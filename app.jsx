// 环保小兵 — main app: public viewer + on-demand admin login, cloud sync, mode switcher.

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "bigScreenTheme": "arena",
  "startMode": "status"
}/*EDITMODE-END*/;

const ADMIN_ID = "JBC9008";
const ADMIN_PW = "BL9008";
const AUTH_KEY = "eco_warrior_authed_v1";

const PUBLIC_MODES = ["status", "rewards"];
const ADMIN_ONLY_MODES = ["mobile", "ai", "admin"];

function normalizeMode(mode) {
  if (mode === "bigscreen") return "status";
  return mode;
}

function pickStartMode(tweaks, authed) {
  const wanted = normalizeMode(tweaks.startMode || (authed ? "mobile" : "status"));
  if (!authed && ADMIN_ONLY_MODES.includes(wanted)) return "status";
  return wanted;
}

function LoginModal({ open, onClose, onAuth }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) { setId(""); setPw(""); setErr(""); }
  }, [open]);

  if (!open) return null;

  function submit(e) {
    e.preventDefault();
    if (id.trim().toUpperCase() === ADMIN_ID && pw === ADMIN_PW) {
      localStorage.setItem(AUTH_KEY, "1");
      onAuth();
      onClose();
    } else {
      setErr("账号或密码错误 · ID atau kata laluan salah");
      setPw("");
    }
  }

  return (
    <div className="login-modal-backdrop" onClick={onClose}>
      <form className="login-card login-modal" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <button type="button" className="login-modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="logo-pair">
          <img src="logo LATEST.jpg" alt="SJK(C) Chung Hwa Belemang" />
        </div>
        <div className="school">
          <span style={{fontFamily:'"ZCOOL KuaiLe", var(--font-display)', fontSize:18}}>文林望中华学校</span>
          <span className="ms">SJK(C) CHUNG HWA BELEMANG</span>
        </div>
        <h1><span className="zh">老师登入</span></h1>
        <div className="tagline">Admin Login</div>

        <div className="login-form">
          <div className="login-field">
            <label>账号 · ID</label>
            <input value={id} onChange={e => setId(e.target.value)} placeholder="JBC9008" autoComplete="username" autoCapitalize="characters" autoFocus />
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
          家长 · 学生可以直接关闭这窗口继续浏览<br/>
          <span style={{opacity:.65}}>Parents & students: close to keep browsing</span>
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
  const [loginOpen, setLoginOpen] = useState(false);
  const [state, setState] = useState(() => EcoData.load());
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [mode, setMode] = useState(() => pickStartMode(tweaks, localStorage.getItem(AUTH_KEY) === "1"));
  const [syncMode, setSyncMode] = useState("local");
  const [syncErr, setSyncErr] = useState(null);

  // Cloud sync runs for everyone so viewers see live data.
  useEffect(() => {
    CloudSync.init(window.SUPABASE_CONFIG);
    const offChange = CloudSync.onChange(s => setState(EcoData.load()));
    const offStatus = CloudSync.onStatus((m, err) => { setSyncMode(m); setSyncErr(err); });
    return () => { offChange(); offStatus(); };
  }, []);

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
    if (ADMIN_ONLY_MODES.includes(mode)) setMode("status");
  }

  function handleSetMode(next) {
    if (!authed && ADMIN_ONLY_MODES.includes(next)) {
      setLoginOpen(true);
      return;
    }
    setMode(next);
  }

  function requireAuth(action) {
    if (authed) return action ? action() : true;
    setLoginOpen(true);
    return false;
  }

  const isDark = false;

  return (
    <>
      <ModeSwitcher mode={mode} setMode={handleSetMode} authed={authed} adminOnlyModes={ADMIN_ONLY_MODES} />

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

      {authed ? (
        <button className={`logout-btn ${isDark ? "on-dark" : ""}`} onClick={logout}>
          👤 老师 · 登出
        </button>
      ) : (
        <button className={`logout-btn login-btn ${isDark ? "on-dark" : ""}`} onClick={() => setLoginOpen(true)}>
          🔓 老师登入
        </button>
      )}

      {mode === "mobile" && <MobileView state={state} setState={setState} authed={authed} requireAuth={requireAuth} />}
      {(mode === "status" || mode === "bigscreen") && <BigScreenView state={state} theme={tweaks.bigScreenTheme} />}
      {mode === "ai" && <AIScanView state={state} setState={setState} authed={authed} requireAuth={requireAuth} />}
      {mode === "rewards" && <RewardCornerView state={state} setState={setState} authed={authed} requireAuth={requireAuth} />}
      {mode === "admin" && <AdminView state={state} setState={setState} authed={authed} requireAuth={requireAuth} />}

      {authed && (
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
                { value: "status", label: "战况" },
                { value: "rewards", label: "奖品" },
                { value: "mobile", label: "记录" },
                { value: "ai", label: "AI" },
                { value: "admin", label: "管理" },
              ]}
              onChange={v => setTweak("startMode", v)}
            />
          </TweakSection>
        </TweaksPanel>
      )}

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onAuth={() => setAuthed(true)}
      />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
