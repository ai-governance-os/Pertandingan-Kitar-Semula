// 环保小兵 — main app: login gate, cloud sync, mode switcher, Tweaks

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "bigScreenTheme": "arena",
  "startMode": "bigscreen"
}/*EDITMODE-END*/;

// Hardcoded admin credentials. User decided: one shared account.
const ADMIN_ID = "JBC9008";
const ADMIN_PW = "JBC9008";
const AUTH_KEY = "eco_warrior_authed_v1";

// ─────────────────────────────────────────────────────────────────
// LOGIN GATE
// ─────────────────────────────────────────────────────────────────
function LoginGate({ onAuth }) {
  const [id, setId]   = useState("");
  const [pw, setPw]   = useState("");
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    if (id.trim().toUpperCase() === ADMIN_ID && pw === ADMIN_PW) {
      localStorage.setItem(AUTH_KEY, "1");
      onAuth();
    } else {
      setErr("账号或密码错误 · ID atau kata laluan salah");
      setPw("");
    }
  }

  return (
    <div className="login-gate">
      <form className="login-card" onSubmit={submit}>
        <div className="logo-pair">
          <img src="assets/school-logo.jpg" alt="SJK(C) Chung Hwa Belemang" />
        </div>
        <div className="school">
          <span style={{fontFamily:'"ZCOOL KuaiLe", var(--font-display)', fontSize:16}}>文林望中华学校</span>
          <span className="ms">SJK(C) CHUNG HWA BELEMANG</span>
        </div>
        <div className="mascot-pair">
          <span>🐲</span>
          <span>🦁</span>
        </div>
        <h1><span className="zh">环保小兵</span></h1>
        <div className="tagline">Eco Warrior League</div>

        <div className="login-form">
          <div className="login-field">
            <label>账号 · ID</label>
            <input value={id} onChange={e => setId(e.target.value)} placeholder="JBC9008" autoComplete="username" autoCapitalize="characters" />
          </div>
          <div className="login-field">
            <label>密码 · Kata laluan</label>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </div>

          {err && <div className="err">{err}</div>}

          <button type="submit" className="chunky-btn primary" style={{justifyContent:'center', marginTop:6, fontSize:18}}>
            <span>登入</span>
            <span style={{fontSize:14, opacity:0.85, fontWeight:500}}>· Log Masuk</span>
            <span>🚪</span>
          </button>
        </div>

        <div className="footer-note">
          🔒 全校共用账号 · Akaun bersama<br/>
          请向老师查询 · Sila tanya guru
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SYNC STATUS INDICATOR
// ─────────────────────────────────────────────────────────────────
function SyncStatusPill({ mode, dark, errorMsg, onClick }) {
  const labels = {
    cloud:      { zh: "云同步中", ms: "Tersegerak" },
    local:      { zh: "本机模式", ms: "Setempat" },
    connecting: { zh: "连接中…",  ms: "Menyambung…" },
    error:      { zh: "同步错误",  ms: "Ralat" },
  };
  const l = labels[mode] || labels.local;
  return (
    <div className={`sync-status ${mode} ${dark ? "on-dark" : ""}`} onClick={onClick} title={errorMsg || ""}>
      <span className="dot" />
      <span>{mode === "cloud" ? "☁" : mode === "local" ? "💾" : mode === "connecting" ? "⟳" : "⚠"} {l.zh}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────
function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === "1");
  const [state, setState]   = useState(() => EcoData.load());
  const [tweaks, setTweak]  = useTweaks(TWEAK_DEFAULTS);
  const [mode, setMode]     = useState(tweaks.startMode || "bigscreen");
  const [syncMode, setSyncMode] = useState("local");
  const [syncErr, setSyncErr]   = useState(null);

  // Boot cloud sync (no-op if no config)
  useEffect(() => {
    if (!authed) return;
    const cfg = window.SUPABASE_CONFIG;
    CloudSync.init(cfg);

    const offChange = CloudSync.onChange(s => setState(s));
    const offStatus = CloudSync.onStatus((m, err) => { setSyncMode(m); setSyncErr(err); });
    return () => { offChange(); offStatus(); };
  }, [authed]);

  // Listen for localStorage changes from other tabs (works in local mode too)
  useEffect(() => {
    function onStorage(e) {
      if (e.key === "eco_warrior_v1") setState(EcoData.load());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function logout() {
    if (!window.confirm("登出？\nLog keluar?")) return;
    localStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  }

  if (!authed) {
    return <LoginGate onAuth={() => setAuthed(true)} />;
  }

  const isDark = mode === "bigscreen" && tweaks.bigScreenTheme !== "map";

  return (
    <>
      <ModeSwitcher mode={mode} setMode={setMode} />
      <SyncStatusPill mode={syncMode} errorMsg={syncErr} dark={isDark}
                      onClick={() => {
                        if (syncMode === "local") {
                          window.open("setup-guide.html", "_blank");
                        } else if (syncMode === "error") {
                          alert("同步错误 / Ralat:\n\n" + (syncErr || "Unknown"));
                        } else {
                          alert(syncMode === "cloud"
                            ? "✅ 云同步运行中\n所有设备实时同步\n\n☁ Tersegerak\nSemua peranti tersegerak"
                            : "正在连接云端…\nSedang menyambung…");
                        }
                      }} />
      <button className={`logout-btn ${isDark ? "on-dark" : ""}`} onClick={logout}>登出 · Log Keluar</button>

      {mode === "mobile"    && <MobileView    state={state} setState={setState} />}
      {mode === "bigscreen" && <BigScreenView state={state} theme={tweaks.bigScreenTheme} />}
      {mode === "admin"     && <AdminView     state={state} setState={setState} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="大屏风格 · Tema Skrin">
          <TweakSelect
            label="主题"
            value={tweaks.bigScreenTheme}
            options={[
              { value: "arena", label: "🥊 战斗竞技场 · Arena" },
              { value: "map",   label: "🏔 探险地图 · Peta" },
              { value: "retro", label: "👾 复古街机 · Retro" },
            ]}
            onChange={v => setTweak("bigScreenTheme", v)}
          />
        </TweakSection>

        <TweakSection label="默认模式 · Mod Mula">
          <TweakRadio
            label="开机进入"
            value={tweaks.startMode}
            options={[
              { value: "mobile",    label: "📱" },
              { value: "bigscreen", label: "🖥️" },
              { value: "admin",     label: "⚙️" },
            ]}
            onChange={v => setTweak("startMode", v)}
          />
        </TweakSection>

        <TweakSection label="数据 · Data">
          <TweakButton
            label="🎲 重置示范数据"
            onClick={() => {
              const fresh = EcoData.defaultState();
              fresh.categories = state.categories;
              fresh.teams = state.teams;
              setState(EcoData.seedDemo(fresh));
            }}
          />
          <TweakButton
            label="🗑 清空所有记录"
            onClick={() => {
              if (!window.confirm("清空所有称重记录？")) return;
              setState(EcoData.resetSeason(state));
            }}
          />
          <TweakButton
            label="➕ 模拟一次称重"
            onClick={() => {
              const team = Math.random() < 0.5 ? "dragons" : "lions";
              const cats = state.categories;
              const cat = cats[Math.floor(Math.random() * cats.length)];
              const kg = +(Math.random() * 3 + 0.5).toFixed(2);
              const { state: next } = EcoData.addEntry(state, team, cat.id, kg);
              setState(next);
            }}
          />
        </TweakSection>

        <TweakSection label="云端 · Awan">
          <TweakButton
            label="📖 查看 Firebase 设置指南"
            onClick={() => window.open("setup-guide.html", "_blank")}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
