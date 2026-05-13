// 环保小兵 — main app: login, cloud sync, mode switcher

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "bigScreenTheme": "arena",
  "startMode": "mobile"
}/*EDITMODE-END*/;

const ADMIN_ID = "JBC9008";
const ADMIN_PW = "JBC9008";
const AUTH_KEY = "eco_warrior_authed_v1";

function normalizeMode(mode) {
  return mode === "bigscreen" ? "status" : mode;
}

function LoginGate({ onAuth }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
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
          <img src="logo LATEST.jpg" alt="SJK(C) Chung Hwa Belemang" />
        </div>
        <div className="school">
          <span style={{fontFamily:'"ZCOOL KuaiLe", var(--font-display)', fontSize:18}}>文林望中华学校</span>
          <span className="ms">SJK(C) CHUNG HWA BELEMANG</span>
        </div>
        <h1><span className="zh">环保小兵</span></h1>
        <div className="tagline">HARI MESRA ALAM · 资源回收赛</div>

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
          </button>
        </div>

        <div className="footer-note">
          老师录入重量、Session 分数与组员记录
        </div>
      </form>
    </div>
  );
}

function SyncStatusPill({ mode, dark, errorMsg, onClick }) {
  const labels = {
    cloud: "云同步中",
    local: "本机模式",
    connecting: "连接中",
    error: "同步错误",
  };
  return (
    <div className={`sync-status ${mode} ${dark ? "on-dark" : ""}`} onClick={onClick} title={errorMsg || ""}>
      <span className="dot" />
      <span>{labels[mode] || labels.local}</span>
    </div>
  );
}

function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === "1");
  const [state, setState] = useState(() => EcoData.load());
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [mode, setMode] = useState(() => normalizeMode(tweaks.startMode || "mobile"));
  const [syncMode, setSyncMode] = useState("local");
  const [syncErr, setSyncErr] = useState(null);

  useEffect(() => {
    if (!authed) return;
    CloudSync.init(window.SUPABASE_CONFIG);
    const offChange = CloudSync.onChange(s => setState(EcoData.load()));
    const offStatus = CloudSync.onStatus((m, err) => { setSyncMode(m); setSyncErr(err); });
    return () => { offChange(); offStatus(); };
  }, [authed]);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === "eco_warrior_v2") setState(EcoData.load());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function logout() {
    if (!window.confirm("登出？\nLog keluar?")) return;
    localStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  }

  if (!authed) return <LoginGate onAuth={() => setAuthed(true)} />;

  const isDark = false;

  return (
    <>
      <ModeSwitcher mode={mode} setMode={setMode} />
      <SyncStatusPill
        mode={syncMode}
        errorMsg={syncErr}
        dark={isDark}
        onClick={() => {
          if (syncMode === "local") window.open("setup-guide.html", "_blank");
          else if (syncMode === "error") alert("同步错误 / Ralat:\n\n" + (syncErr || "Unknown"));
          else alert(syncMode === "cloud" ? "云同步运行中" : "正在连接云端");
        }}
      />
      <button className={`logout-btn ${isDark ? "on-dark" : ""}`} onClick={logout}>登出 · Log Keluar</button>

      {mode === "mobile" && <MobileView state={state} setState={setState} />}
      {(mode === "status" || mode === "bigscreen") && <BigScreenView state={state} theme={tweaks.bigScreenTheme} />}
      {mode === "admin" && <AdminView state={state} setState={setState} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="战况风格 · Tema Status">
          <TweakSelect
            label="主题"
            value={tweaks.bigScreenTheme}
            options={[
              { value: "arena", label: "竞技场 · Arena" },
              { value: "map", label: "路线图 · Peta" },
              { value: "retro", label: "复古 · Retro" },
            ]}
            onChange={v => setTweak("bigScreenTheme", v)}
          />
        </TweakSection>
        <TweakSection label="默认模式 · Mod Mula">
          <TweakRadio
            label="开机进入"
            value={tweaks.startMode}
            options={[
              { value: "mobile", label: "录入" },
              { value: "status", label: "战况" },
              { value: "admin", label: "管理" },
            ]}
            onChange={v => setTweak("startMode", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
