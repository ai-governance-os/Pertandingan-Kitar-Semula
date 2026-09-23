// HTTP saves remain available when Realtime disconnects. Unsent changes survive reloads.
const CloudSync = {
  STATE_KEY: 'main', OUTBOX_KEY: 'eco_warrior_sync_outbox_v1',
  REWARD_RECOVERY_DATE: '2026-09-11', SDK_URL: 'supabase.bundle.js?v=2.116.0',
  ready: false, enabled: false, mode: 'local', errorMsg: null,
  client: null, channel: null, realtimeReady: false, applyingRemote: false,
  pendingWrite: null, remoteState: null, remoteUpdatedAt: null, localView: null,
  lastAppliedRemoteAt: 0, lastSuccessAt: 0, failures: 0, generation: 0,
  timer: null, running: null, requested: false, storageError: null,
  listeners: new Set(), statusListeners: new Set(), controllers: new Set(),
  clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); },
  equal(a, b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(key => Object.prototype.hasOwnProperty.call(b, key) && this.equal(a[key], b[key]));
  },
  online() { return navigator.onLine !== false; },
  visible() { return document.visibilityState !== 'hidden'; },
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  emit(state) { this.listeners.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } }); },
  onStatus(fn) {
    this.statusListeners.add(fn); fn(this.mode, this.errorMsg);
    return () => this.statusListeners.delete(fn);
  },
  setStatus(mode, errorMsg = null) {
    if (mode === this.mode && errorMsg === this.errorMsg) return;
    this.mode = mode; this.errorMsg = errorMsg;
    this.statusListeners.forEach(fn => { try { fn(mode, errorMsg); } catch (e) { console.error(e); } });
  },
  refreshStatus() {
    if (!this.enabled) return this.setStatus('local');
    if (this.storageError) return this.setStatus('error', this.storageError);
    if (!this.online()) return this.setStatus('offline', this.pendingWrite ? '修改已保存在本机，联网后自动补传。' : '网络已断开，联网后自动恢复。');
    if (this.failures) return; // Only a successful HTTP request clears a data-sync failure.
    if (this.pendingWrite) return this.setStatus('pending', '修改已保存在本机，正在等待上传。');
    if (!this.ready) return this.setStatus('connecting');
    this.setStatus(this.realtimeReady ? 'cloud' : 'polling', this.realtimeReady ? null : '实时连接恢复中；备用连接正常，每 15 秒检查更新。');
  },
  init(config) {
    if (this.enabled) return this.running || Promise.resolve(this.ready);
    if (!config?.url || !config?.anonKey || config.url.includes('PASTE_') || config.anonKey.includes('PASTE_')) {
      this.setStatus('local'); return Promise.resolve(false);
    }
    this.config = config;
    this.initialRead = true;
    this.localView = this.clone(EcoData.load());
    this.startingLocal = this.clone(this.localView);
    this.enabled = true;
    this.restorePending();
    if (this.pendingWrite) this.mirror(this.pendingWrite.state);
    this.onOnline = () => this.retry();
    this.onOffline = () => { this.clearScheduled(); this.refreshStatus(); };
    this.onVisible = () => { if (this.visible()) this.retry(); };
    this.onStorage = event => {
      if (event.key === this.OUTBOX_KEY) {
        this.restorePending();
        if (this.pendingWrite) this.mirror(this.pendingWrite.state);
        this.requestSync(350); this.refreshStatus();
      }
    };
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
    window.addEventListener('storage', this.onStorage);
    document.addEventListener('visibilitychange', this.onVisible);
    this.refreshStatus();
    return this.run();
  },
  async ensureClient() {
    if (this.client) return;
    const generation = this.generation;
    await this.loadScript(this.SDK_URL);
    if (!this.enabled || generation !== this.generation) return;
    this.client = window.supabase.createClient(this.config.url, this.config.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      realtime: {
        params: { eventsPerSecond: 5 }, worker: typeof Worker !== 'undefined',
        heartbeatCallback: status => {
          if (!this.enabled || generation !== this.generation) return;
          if (status === 'ok' && this.channel?.state === 'joined') {
            this.realtimeReady = true; this.refreshStatus();
          }
          if (['disconnected', 'timeout', 'error'].includes(status)) {
            this.realtimeReady = false; this.refreshStatus();
            if (this.online() && this.visible()) this.requestSync(1000);
          }
        },
      },
    });
  },
  async ensureChannel() {
    if (this.channel?.state === 'closed') {
      const old = this.channel; this.channel = null;
      await this.client.removeChannel(old);
    }
    if (!this.channel) {
      const channel = this.client.channel('eco-warrior-state');
      this.channel = channel;
      channel.on('postgres_changes',
        { event: '*', schema: 'public', table: 'app_state', filter: `id=eq.${this.STATE_KEY}` },
        () => { if (this.channel === channel) this.requestSync(250); }
      ).subscribe((status, error) => {
        if (!this.enabled || this.channel !== channel) return;
        this.realtimeReady = status === 'SUBSCRIBED';
        if (error) console.warn('Realtime connection:', status, error.message || String(error));
        this.refreshStatus();
        // Re-fetch on every join to recover updates missed while disconnected.
        if (this.visible()) this.requestSync(status === 'SUBSCRIBED' ? 250 : 1000);
      });
    }
    if (!this.client.realtime.isConnected()) this.client.realtime.connect();
  },
  loadScript(src) {
    if (window.supabase?.createClient) return Promise.resolve();
    if (this.sdkPromise) return this.sdkPromise;
    this.sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => finish(new Error('同步组件加载超时，请检查网络。')), 15000);
      const finish = error => {
        clearTimeout(timer); script.onload = script.onerror = null;
        if (error) { script.remove(); reject(error); } else resolve();
      };
      script.src = src;
      script.onload = () => finish(window.supabase?.createClient ? null : new Error('同步组件未能启动。'));
      script.onerror = () => finish(new Error('同步组件加载失败，请检查网络。'));
      document.head.appendChild(script);
    }).finally(() => { this.sdkPromise = null; });
    return this.sdkPromise;
  },
  requestSync(delay = 0) {
    if (!this.enabled) return;
    if (this.running) { this.requested = true; return; }
    if (this.failures) delay = Math.max(delay, Math.min(60000, 1000 * 2 ** Math.min(this.failures - 1, 6)));
    const due = Date.now() + delay;
    if (this.timer && this.nextSyncAt <= due) return;
    this.clearScheduled(); this.nextSyncAt = due;
    this.timer = setTimeout(() => { this.timer = null; this.run(); }, delay);
  },
  clearScheduled() {
    clearTimeout(this.timer); this.timer = null; this.nextSyncAt = 0;
  },
  retry() {
    if (!this.enabled) return Promise.resolve(false);
    this.clearScheduled();
    if (this.online()) this.setStatus(this.pendingWrite ? 'pending' : 'connecting');
    return this.run();
  },
  run() {
    if (this.running) { this.requested = true; return this.running; }
    if (!this.enabled || !this.online()) { this.refreshStatus(); return Promise.resolve(false); }
    if (!this.visible()) return Promise.resolve(false);
    this.clearScheduled();
    const generation = this.generation;
    this.requested = false;
    const current = () => this.enabled && generation === this.generation;
    this.running = (async () => {
      try {
        await this.ensureClient();
        if (!current()) return false;
        // A blocked WebSocket must not prevent HTTP reads or writes.
        try { await this.ensureChannel(); } catch (e) { this.realtimeReady = false; console.warn('Realtime unavailable:', e.message); }
        if (!current()) return false;
        await this.syncData(current);
        if (!current()) return false;
        this.ready = true; this.failures = 0; this.lastSuccessAt = Date.now();
        this.refreshStatus();
        return true;
      } catch (e) {
        if (!current()) return false;
        this.failures++;
        const permanent = ['401', '403', '42501', 'PGRST301'].includes(String(e.status || e.code));
        const detail = [e.message || String(e), e.code && `(${e.code})`].filter(Boolean).join(' ');
        console.warn('Cloud sync attempt failed:', detail);
        this.setStatus(!this.online() ? 'offline' : permanent || this.failures >= 3 ? 'error' : 'retrying', detail);
        return false;
      } finally {
        if (current()) {
          this.running = null;
          if (this.online()) {
            const retryDelay = Math.min(60000, 1000 * 2 ** Math.min(this.failures - 1, 6)) * (0.9 + Math.random() * 0.2);
            this.requestSync(this.failures ? retryDelay : this.pendingWrite || this.requested ? 350 : this.realtimeReady ? 60000 : 15000);
          }
        }
      }
    })();
    return this.running;
  },
  async query(builder) {
    const controller = new AbortController(); this.controllers.add(controller);
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const result = await builder.abortSignal(controller.signal);
      if (result.error) throw Object.assign(new Error(result.error.message), result.error, { status: result.status });
      return result.data;
    } finally { clearTimeout(timer); this.controllers.delete(controller); }
  },
  async readRemote() {
    // Most checks fetch a timestamp instead of the ~400 KB state document.
    if (this.remoteState && !this.pendingWrite) {
      const version = await this.query(this.client.from('app_state').select('updated_at').eq('id', this.STATE_KEY).maybeSingle());
      if (version && version.updated_at === this.remoteUpdatedAt) return { data: this.remoteState, updated_at: this.remoteUpdatedAt };
    }
    return this.query(this.client.from('app_state').select('data, updated_at').eq('id', this.STATE_KEY).maybeSingle());
  },
  async syncData(current) {
    for (let attempt = 0; attempt < 3; attempt++) {
      this.restorePending();
      const remote = await this.readRemote();
      if (!current()) return;
      this.restorePending(); // Edits may arrive while reading the cloud.
      const remoteState = remote?.data || {};
      if (this.initialRead) {
        this.initialRead = false;
        if (!this.pendingWrite && remote?.data) {
          const recovered = this.recoverMissingRewardEvents(remoteState, this.startingLocal);
          if (recovered.count) this.queue(recovered.state, remoteState);
        }
      }
      if (!remote && !this.pendingWrite) this.queue(this.startingLocal, this.startingLocal, true);
      if (!this.pendingWrite) { this.acceptRemote(remoteState, remote.updated_at); return; }
      const sent = this.clone(this.pendingWrite);
      if (remote && sent.seed) { this.acknowledge(sent, remoteState, remote.updated_at); return; }
      const mergedState = remote ? this.mergeChanges(sent.base, sent.state, remoteState) : sent.state;
      const merged = EcoData.reconcileGameAwards?.(mergedState) || mergedState;
      if (this.equal(merged, remoteState)) { this.acknowledge(sent, remoteState, remote?.updated_at); return; }
      const updatedAt = new Date(Math.max(Date.now(), (Date.parse(remote?.updated_at) || 0) + 1)).toISOString();
      const row = { data: merged, updated_at: updatedAt };
      let saved;
      if (remote) {
        // Compare-and-swap prevents overwriting an intervening save from another device.
        let update = this.client.from('app_state').update(row).eq('id', this.STATE_KEY);
        update = remote.updated_at == null ? update.is('updated_at', null) : update.eq('updated_at', remote.updated_at);
        saved = await this.query(update.select('updated_at').maybeSingle());
      } else {
        try { saved = await this.query(this.client.from('app_state').insert({ id: this.STATE_KEY, ...row }).select('updated_at').maybeSingle()); }
        catch (e) { if (e.code === '23505') continue; throw e; }
      }
      if (!current()) return;
      if (!saved) continue;
      this.acknowledge(sent, merged, saved.updated_at);
      return;
    }
    throw new Error('其他设备正在更新，已保留本机修改，稍后自动重试。');
  },
  restorePending() {
    if (this.storageError) return; // Do not replace an unsaved in-memory queue with an older disk copy.
    try {
      const raw = localStorage.getItem(this.OUTBOX_KEY), stored = raw ? JSON.parse(raw) : null;
      this.pendingWrite = stored?.version === 1 && stored.project === this.config.url && stored.id && stored.state && stored.base ? stored : null;
    } catch (e) { this.storageError = '无法读取待同步记录，请保留此页面并检查浏览器储存空间。'; }
  },
  persistPending() {
    try {
      if (this.pendingWrite) localStorage.setItem(this.OUTBOX_KEY, JSON.stringify(this.pendingWrite));
      else localStorage.removeItem(this.OUTBOX_KEY);
      this.storageError = null;
    } catch (e) { this.storageError = '待同步修改暂时只能保留在此页面，请勿关闭；请检查浏览器储存空间。'; }
  },
  queue(state, base, seed = false) {
    this.pendingWrite = { version: 1, project: this.config.url, id: `${Date.now()}-${Math.random()}`, seed, base: this.clone(base), state: this.clone(state) };
    this.persistPending();
  },
  push(state) {
    if (!this.enabled || this.applyingRemote) return;
    const previousView = this.localView || this.startingLocal;
    this.restorePending();
    const next = this.pendingWrite ? this.mergeChanges(previousView, state, this.pendingWrite.state) : this.clone(state);
    this.queue(next, this.pendingWrite?.base || previousView);
    this.localView = this.clone(next);
    this.requestSync(350); this.refreshStatus();
  },
  acknowledge(sent, state, updatedAt) {
    this.restorePending();
    if (this.pendingWrite && this.pendingWrite.id !== sent.id) {
      // Include edits made during upload, even undoing the change being uploaded.
      this.queue(this.mergeChanges(sent.state, this.pendingWrite.state, state), state);
    } else { this.pendingWrite = null; this.persistPending(); }
    this.acceptRemote(state, updatedAt);
  },
  acceptRemote(state, updatedAt) {
    this.remoteState = this.clone(state); this.remoteUpdatedAt = updatedAt;
    this.lastAppliedRemoteAt = Date.parse(updatedAt) || 0;
    this.mirror(this.pendingWrite ? this.mergeChanges(this.pendingWrite.base, this.pendingWrite.state, state) : state);
  },
  mirror(state) {
    this.applyingRemote = true;
    try {
      if (!this.equal(EcoData.load(), state)) { EcoData.save(state); this.emit(state); }
      this.localView = this.clone(EcoData.load());
    } finally { this.applyingRemote = false; }
  },
  // Apply this device's changes to the latest cloud state, preserving unrelated changes.
  mergeChanges(base, local, remote) {
    if (this.equal(base, local)) return this.clone(remote);
    if (this.equal(base, remote) || this.equal(local, remote)) return this.clone(local);
    if (Array.isArray(base) && Array.isArray(local) && Array.isArray(remote) &&
        [...base, ...local, ...remote].every(item => item && typeof item === 'object' && item.id != null)) {
      const b = new Map(base.map(item => [item.id, item])), l = new Map(local.map(item => [item.id, item])), r = new Map(remote.map(item => [item.id, item]));
      return [...new Set([...l.keys(), ...r.keys()])].map(id => this.mergeChanges(b.get(id), l.get(id), r.get(id))).filter(item => item !== undefined);
    }
    const object = value => value && typeof value === 'object' && !Array.isArray(value);
    if (object(local) && object(remote) && (object(base) || base === undefined)) {
      return Object.fromEntries([...new Set([...Object.keys(base || {}), ...Object.keys(local), ...Object.keys(remote)])]
        .filter(key => !['__proto__', 'constructor', 'prototype'].includes(key))
        .map(key => [key, this.mergeChanges(base?.[key], local[key], remote[key])]).filter(([, value]) => value !== undefined));
    }
    return this.clone(local);
  },
  localDate(ts) {
    const date = new Date(typeof ts === 'string' ? ts : Number(ts));
    if (!Number.isFinite(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  },
  recoverMissingRewardEvents(remote, local) {
    const remoteLedger = Array.isArray(remote?.starLedger) ? remote.starLedger : [];
    const localLedger = Array.isArray(local?.starLedger) ? local.starLedger : [];
    const remoteIds = new Set(remoteLedger.map(event => event?.id).filter(Boolean));
    const missing = localLedger.filter(event => event?.id && !remoteIds.has(event.id) && this.localDate(event.ts) === this.REWARD_RECOVERY_DATE);
    return missing.length ? { state: { ...remote, starLedger: [...missing, ...remoteLedger] }, count: missing.length } : { state: remote, count: 0 };
  },
  disconnect() {
    this.enabled = false; this.generation++;
    this.clearScheduled(); this.controllers.forEach(controller => controller.abort());
    window.removeEventListener('online', this.onOnline); window.removeEventListener('offline', this.onOffline);
    window.removeEventListener('storage', this.onStorage); document.removeEventListener('visibilitychange', this.onVisible);
    const channel = this.channel; this.channel = null;
    if (channel) this.client?.removeChannel(channel);
    this.client?.realtime.disconnect();
    this.client = null; this.ready = false; this.realtimeReady = false; this.running = null; this.failures = 0;
    this.setStatus('local');
  },
};
window.CloudSync = CloudSync;
