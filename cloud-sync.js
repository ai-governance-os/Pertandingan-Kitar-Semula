// 环保小兵 — Supabase cloud sync layer
// Activates automatically when window.SUPABASE_CONFIG is set (in index.html).
// Falls back to local-only mode if not configured.

const CloudSync = {
  ready: false,
  mode: "local",       // "local" | "cloud" | "connecting" | "error"
  errorMsg: null,
  client: null,
  channel: null,
  listeners: new Set(),
  pendingWrite: null,
  writeTimer: null,
  STATE_KEY: "main",

  // ── Observer pattern for state changes ───────────────────
  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },
  emit(state) {
    this.listeners.forEach(fn => { try { fn(state); } catch (e) {} });
  },

  // ── Status broadcaster ───────────────────────────────────
  statusListeners: new Set(),
  onStatus(fn) {
    this.statusListeners.add(fn);
    fn(this.mode, this.errorMsg);
    return () => this.statusListeners.delete(fn);
  },
  setStatus(mode, errorMsg = null) {
    this.mode = mode;
    this.errorMsg = errorMsg;
    this.statusListeners.forEach(fn => { try { fn(mode, errorMsg); } catch (e) {} });
  },

  async init(config) {
    if (!config || !config.url || !config.anonKey ||
        config.url.includes("PASTE_") || config.anonKey.includes("PASTE_")) {
      this.setStatus("local");
      return false;
    }
    this.setStatus("connecting");
    try {
      // Load Supabase JS client
      await this.loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js");
      this.client = window.supabase.createClient(config.url, config.anonKey, {
        realtime: { params: { eventsPerSecond: 5 } },
      });

      // Initial fetch
      const { data, error } = await this.client
        .from("app_state")
        .select("data")
        .eq("id", this.STATE_KEY)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no row found, which is OK on first run
        throw error;
      }
      if (data && data.data && Object.keys(data.data).length > 0) {
        EcoData.save(data.data);  // mirror to localStorage
        this.emit(data.data);
      } else {
        // Cloud is empty — seed from local
        const local = EcoData.load();
        await this.writeNow(local);
      }

      // Subscribe to realtime updates
      this.channel = this.client
        .channel("eco-warrior-state")
        .on("postgres_changes",
          { event: "*", schema: "public", table: "app_state", filter: `id=eq.${this.STATE_KEY}` },
          (payload) => {
            const newState = payload.new?.data;
            if (newState && Object.keys(newState).length > 0) {
              EcoData.save(newState);
              this.emit(newState);
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") this.setStatus("cloud");
          else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            this.setStatus("error", "Realtime subscribe failed");
          }
        });

      this.ready = true;
      // Also set to cloud if subscribe is slow to confirm
      setTimeout(() => { if (this.mode === "connecting") this.setStatus("cloud"); }, 2000);
      return true;
    } catch (e) {
      console.error("Supabase init failed:", e);
      this.setStatus("error", e.message || String(e));
      return false;
    }
  },

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) { resolve(); return; }
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load " + src));
      document.head.appendChild(s);
    });
  },

  // Debounced write
  push(state) {
    if (this.mode !== "cloud") return;
    this.pendingWrite = state;
    clearTimeout(this.writeTimer);
    this.writeTimer = setTimeout(() => {
      if (this.pendingWrite) this.writeNow(this.pendingWrite);
      this.pendingWrite = null;
    }, 350);
  },

  async writeNow(state) {
    if (!this.client) return;
    try {
      const { error } = await this.client
        .from("app_state")
        .upsert({
          id: this.STATE_KEY,
          data: state,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
    } catch (e) {
      console.error("Cloud write failed:", e);
      this.setStatus("error", e.message || String(e));
    }
  },

  disconnect() {
    if (this.channel) this.client?.removeChannel(this.channel);
    this.channel = null;
    this.setStatus("local");
  },
};

window.CloudSync = CloudSync;
