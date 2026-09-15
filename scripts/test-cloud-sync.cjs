const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'cloud-sync.js'), 'utf8');
const copy = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const base = () => ({ starLedger: [{ id: 'existing', stars: 2 }, { id: 'remove', stars: 1 }], settings: { title: 'School', limit: 150 }, pets: { a: { nickname: 'A', species: 'qilin' } } });
const config = { url: 'https://test.invalid', anonKey: 'test-only' };
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function target() {
  const handlers = new Map();
  return {
    handlers,
    addEventListener(name, fn) { if (!handlers.has(name)) handlers.set(name, new Set()); handlers.get(name).add(fn); },
    removeEventListener(name, fn) { handlers.get(name)?.delete(fn); },
    dispatch(name, event = {}) { for (const fn of handlers.get(name) || []) fn(event); },
  };
}
function fixture(options = {}) {
  const memory = options.memory || new Map();
  if (!memory.has('state')) memory.set('state', JSON.stringify(options.local || base()));
  const server = options.server || { row: { data: base(), updated_at: '2026-09-15T00:00:00.000Z' } };
  server.calls ||= []; server.updates ||= 0;
  const window = target(), document = { ...target(), visibilityState: 'visible' };
  const navigator = { onLine: options.online !== false }, timers = new Map();
  let sequence = 0, clients = 0, channels = 0;
  const localStorage = {
    getItem: key => memory.get(key) || null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: key => memory.delete(key),
  };
  class Query {
    constructor() { this.operation = 'read'; this.filters = {}; }
    select(columns) { this.columns = columns; return this; }
    eq(key, value) { this.filters[key] = value; return this; }
    is(key, value) { return this.eq(key, value); }
    update(row) { this.operation = 'update'; this.row = copy(row); return this; }
    insert(row) { this.operation = 'insert'; this.row = copy(row); return this; }
    maybeSingle() { return this; }
    abortSignal(signal) { this.signal = signal; return this; }
    then(resolve, reject) { return this.execute().then(resolve, reject); }
    async execute() {
      server.calls.push({ operation: this.operation, columns: this.columns });
      if (server.blockRead && this.operation === 'read') await server.blockRead(this);
      if (!navigator.onLine || server.failRead && this.operation === 'read') return { error: { message: 'Temporary network failure' }, status: server.failRead || 503 };
      if (this.operation === 'read') return { data: server.row ? this.columns === 'updated_at' ? { updated_at: server.row.updated_at } : copy(server.row) : null };
      if (server.beforeWrite) await server.beforeWrite(this);
      if (server.failWrite) return { error: { message: 'Write unavailable', code: 'test-failure' }, status: server.failWrite };
      if (this.operation === 'insert' && server.row) return { error: { message: 'Duplicate', code: '23505' }, status: 409 };
      if (this.operation === 'update' && this.filters.updated_at !== server.row.updated_at) return { data: null };
      server.row = copy(this.row); server.updates++;
      return { data: { updated_at: this.row.updated_at } };
    }
  }
  const client = {
    from: () => new Query(),
    realtime: { isConnected: () => true, connect() {}, disconnect() {} },
    channel() {
      channels++;
      const channel = { state: 'joining', on(event, filter, fn) { this.change = fn; return this; }, subscribe(fn) { this.status = fn; return this; } };
      return channel;
    },
    async removeChannel(channel) { channel.state = 'closed'; channel.status?.('CLOSED'); },
  };
  window.supabase = { createClient() { clients++; return client; } };
  const EcoData = {
    load() { return JSON.parse(memory.get('state')); },
    save(state) {
      memory.set('state', JSON.stringify(state));
      if (window.CloudSync?.enabled && !window.CloudSync.applyingRemote) window.CloudSync.push(state);
    },
  };
  const context = vm.createContext({ window, document, navigator, localStorage, EcoData, Date, Intl, Math, AbortController,
    console: { warn() {}, error() {} },
    setTimeout(fn, delay) { const id = ++sequence; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  vm.runInContext(source, context);
  const sync = window.CloudSync;
  const join = () => { sync.channel.state = 'joined'; sync.channel.status('SUBSCRIBED'); };
  return { sync, server, memory, window, document, navigator, localStorage, timers, EcoData, join, context,
    counts: () => ({ clients, channels }), start: () => sync.init(config) };
}

test('HTTP works before Realtime confirms; there is no false connected timer', async () => {
  const f = fixture(); await f.start();
  assert.equal(f.sync.mode, 'polling'); assert.equal(f.server.updates, 0);
  assert.equal([...f.timers.values()].some(t => t.delay === 2000), false);
  f.join(); assert.equal(f.sync.mode, 'cloud');
  f.sync.channel.status('CHANNEL_ERROR', new Error('WebSocket blocked'));
  assert.equal(f.sync.mode, 'polling');
  const state = f.EcoData.load(); state.starLedger.unshift({ id: 'a', stars: 1 }); f.EcoData.save(state);
  await f.sync.run(); assert(f.server.row.data.starLedger.some(e => e.id === 'a'));
  assert.equal(f.sync.mode, 'polling');
});
test('an initial HTTP failure stays failed until a successful read', async () => {
  const f = fixture(); f.server.failRead = 503; await f.start();
  assert.equal(f.sync.mode, 'retrying'); assert.equal(f.sync.ready, false);
  f.join(); assert.equal(f.sync.mode, 'retrying');
  f.server.failRead = 0; await f.sync.retry();
  assert.equal(f.sync.mode, 'cloud'); assert.equal(f.sync.ready, true);
});
test('offline edits survive reload and merge with another teacher, including deletions', async () => {
  const f = fixture(); await f.start(); f.navigator.onLine = false; f.window.dispatch('offline');
  const local = f.EcoData.load(); local.starLedger = [{ id: 'teacher-a', stars: 3 }, local.starLedger[0]];
  local.pets.a.nickname = 'New name'; f.EcoData.save(local);
  assert.equal(f.sync.mode, 'offline'); assert(f.memory.has(f.sync.OUTBOX_KEY));
  f.server.row.data.starLedger.unshift({ id: 'teacher-b', stars: 5 });
  f.server.row.data.settings.limit = 200; f.server.row.data.pets.a.species = 'phoenix';
  f.server.row.updated_at = '2026-09-15T00:01:00.000Z'; f.sync.disconnect();
  const g = fixture({ memory: f.memory, server: f.server }); await g.start();
  const saved = g.server.row.data;
  assert.deepEqual(saved.starLedger.map(e => e.id).sort(), ['existing', 'teacher-a', 'teacher-b']);
  assert.equal(saved.settings.limit, 200); assert.deepEqual(saved.pets.a, { nickname: 'New name', species: 'phoenix' });
  assert.equal(g.memory.has(g.sync.OUTBOX_KEY), false);
});
test('failed uploads retain the queue; a WebSocket join cannot mask the failure', async () => {
  const f = fixture(); await f.start();
  const local = f.EcoData.load(); local.settings.title = 'Changed'; f.EcoData.save(local);
  f.server.failWrite = 503; await f.sync.run();
  assert(f.sync.pendingWrite); assert(f.memory.has(f.sync.OUTBOX_KEY)); assert.equal(f.sync.mode, 'retrying');
  f.join(); assert.equal(f.sync.mode, 'retrying');
  f.server.failWrite = 0; await f.sync.run();
  assert.equal(f.server.row.data.settings.title, 'Changed'); assert.equal(f.sync.pendingWrite, null);
  assert.equal(f.sync.mode, 'cloud');
});
test('an edit and an undo arriving during upload are retained and serialized', async () => {
  const f = fixture(); await f.start();
  const local = f.EcoData.load(); local.starLedger.unshift({ id: 'undo-me', stars: 4 }); f.EcoData.save(local);
  const entered = deferred(), release = deferred(); let count = 0;
  f.server.beforeWrite = async () => { if (++count === 1) { entered.resolve(); await release.promise; } };
  const saving = f.sync.run(); await entered.promise;
  const newer = f.EcoData.load(); newer.starLedger = newer.starLedger.filter(e => e.id !== 'undo-me'); newer.starLedger.unshift({ id: 'keep-me', stars: 2 });
  f.EcoData.save(newer); const sameRun = f.sync.run(); assert.equal(sameRun, saving);
  release.resolve(); await saving; assert(f.sync.pendingWrite);
  await f.sync.run();
  assert.equal(f.server.row.data.starLedger.some(e => e.id === 'undo-me'), false);
  assert.equal(f.server.row.data.starLedger.filter(e => e.id === 'keep-me').length, 1);
});
test('a competing write between read and update is merged after compare-and-swap fails', async () => {
  const f = fixture(); await f.start(); const state = f.EcoData.load(); state.starLedger.unshift({ id: 'local', stars: 1 }); f.EcoData.save(state);
  f.server.beforeWrite = () => {
    f.server.beforeWrite = null; f.server.row.data.starLedger.unshift({ id: 'concurrent', stars: 2 });
    f.server.row.updated_at = '2026-09-15T00:02:00.000Z';
  };
  await f.sync.run();
  assert(f.server.row.data.starLedger.some(e => e.id === 'local'));
  assert(f.server.row.data.starLedger.some(e => e.id === 'concurrent'));
  assert.equal(f.server.updates, 1); assert.equal(f.sync.pendingWrite, null);
});
test('unchanged polling fetches only a timestamp; visibility resumes missed updates', async () => {
  const f = fixture(); await f.start(); const before = f.server.calls.length;
  await f.sync.run(); assert.equal(f.server.calls.length, before + 1); assert.equal(f.server.calls.at(-1).columns, 'updated_at');
  f.document.visibilityState = 'hidden'; await f.sync.run(); assert.equal(f.server.calls.length, before + 1);
  f.server.row.data.settings.title = 'Remote update'; f.server.row.updated_at = '2026-09-15T00:03:00.000Z';
  f.document.visibilityState = 'visible'; f.document.dispatch('visibilitychange'); await f.sync.running;
  assert.equal(f.EcoData.load().settings.title, 'Remote update');
});
test('offline-first opening resumes automatically and repeated init does not duplicate listeners', async () => {
  const f = fixture({ online: false }); await f.start(); await f.start();
  assert.equal(f.sync.mode, 'offline'); assert.deepEqual(f.counts(), { clients: 0, channels: 0 });
  f.navigator.onLine = true; f.window.dispatch('online'); await f.sync.running;
  await f.start(); assert.deepEqual(f.counts(), { clients: 1, channels: 1 });
  assert.equal(f.window.handlers.get('online').size, 1);
  f.sync.disconnect(); assert.equal(f.window.handlers.get('online').size, 0); assert.equal(f.timers.size, 0);
});
test('SDK loading is shared, times out and removes failed scripts so retry can load again', async () => {
  const f = fixture(); delete f.window.supabase; const scripts = [];
  f.document.createElement = () => ({ remove() { this.removed = true; } });
  f.document.head = { appendChild(s) { scripts.push(s); } };
  const loading = f.start(); const duplicate = f.start(); assert.equal(loading, duplicate);
  scripts[0].onerror(); await loading;
  assert.equal(scripts[0].removed, true); assert.equal(f.sync.mode, 'retrying');
  const retry = f.sync.retry(); assert.equal(scripts.length, 2);
  [...f.timers.values()].find(t => t.delay === 15000).fn(); await retry;
  assert.equal(scripts[1].removed, true); assert.equal(f.sync.ready, false);
});
test('permission errors are shown immediately and retries back off', async () => {
  const f = fixture(); f.server.failRead = 403; await f.start();
  assert.equal(f.sync.mode, 'error'); assert.equal(f.sync.ready, false);
  const first = [...f.timers.values()][0].delay; await f.sync.run();
  const second = [...f.timers.values()][0].delay; assert(second > first);
});
test('HTTP timeouts retain queued edits and release the active request', async () => {
  const f = fixture(); await f.start(); const local = f.EcoData.load(); local.settings.title = 'Keep'; f.EcoData.save(local);
  const entered = deferred();
  f.server.blockRead = q => new Promise((resolve, reject) => { entered.resolve(); q.signal.addEventListener('abort', () => reject(new Error('Request timed out'))); });
  const attempt = f.sync.run(); await entered.promise;
  [...f.timers.values()].find(t => t.delay === 12000).fn(); await attempt;
  assert(f.sync.pendingWrite); assert.equal(f.sync.running, null); assert.equal(f.sync.controllers.size, 0);
});
test('storage failure keeps the newest queue in memory and never claims synced', async () => {
  const f = fixture(); await f.start(); f.navigator.onLine = false;
  const first = f.EcoData.load(); first.settings.title = 'First'; f.EcoData.save(first);
  const realSet = f.localStorage.setItem;
  f.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  const second = f.EcoData.load(); second.settings.title = 'Newest'; f.EcoData.save(second);
  f.sync.restorePending(); assert.equal(f.sync.pendingWrite.state.settings.title, 'Newest'); assert.equal(f.sync.mode, 'error');
  f.localStorage.setItem = realSet; f.navigator.onLine = true; await f.sync.retry();
  assert.equal(f.server.row.data.settings.title, 'Newest');
});
test('simultaneous empty-cloud initialization does not replace the winning seed', async () => {
  const f = fixture({ server: { row: null } });
  f.server.beforeWrite = () => { f.server.beforeWrite = null; f.server.row = { data: { ...base(), settings: { title: 'Other device', limit: 200 } }, updated_at: '2026-09-15T00:01:00.000Z' }; };
  await f.start(); assert.equal(f.server.updates, 0); assert.equal(f.EcoData.load().settings.title, 'Other device');
});
test('a local edit after another tab queues a change preserves both changes', async () => {
  const f = fixture(); await f.start(); const g = fixture({ memory: f.memory, server: f.server }); await g.start();
  f.navigator.onLine = g.navigator.onLine = false;
  const a = f.EcoData.load(); a.starLedger.unshift({ id: 'tab-a', stars: 1 }); f.EcoData.save(a);
  const b = base(); b.starLedger.unshift({ id: 'tab-b', stars: 1 }); g.EcoData.save(b);
  g.navigator.onLine = true; await g.sync.run();
  assert(g.server.row.data.starLedger.some(e => e.id === 'tab-a'));
  assert(g.server.row.data.starLedger.some(e => e.id === 'tab-b'));
  assert(g.EcoData.load().starLedger.some(e => e.id === 'tab-a'));
  assert(g.EcoData.load().starLedger.some(e => e.id === 'tab-b'));
});
test('JSONB key reordering does not manufacture local changes or override remote edits', () => {
  const f = fixture();
  const original = { settings: { title: 'School', limit: 150 } };
  const reordered = { settings: { limit: 150, title: 'School' } };
  const remote = { settings: { title: 'New remote title', limit: 200 } };
  assert.deepEqual(copy(f.sync.mergeChanges(original, reordered, remote)), remote);
});
test('repeated Realtime failures neither accelerate nor postpone HTTP backoff', async () => {
  const f = fixture(); f.server.failRead = 503; await f.start(); await f.sync.run(); await f.sync.run();
  f.sync.channel.status('CHANNEL_ERROR');
  const timer = f.sync.timer, delay = f.timers.get(timer).delay;
  for (let i = 0; i < 10; i++) f.sync.channel.status('CHANNEL_ERROR');
  assert.equal(f.sync.timer, timer); assert(delay >= 4000);
});
