// 环保小兵 — shared React components

const { useState, useEffect, useRef, useMemo } = React;

function BL({ zh, ms }) {
  return (
    <span className="lang-stack">
      <span className="zh">{zh}</span>
      <span className="ms">{ms}</span>
    </span>
  );
}

function BLinline({ zh, ms }) {
  return <span>{zh}<span style={{opacity:0.55, fontWeight:500, marginLeft:6, fontSize:'0.78em'}}>{ms}</span></span>;
}

function SchoolStamp({ size = 60, light = false }) {
  return (
    <div className="school-stamp" style={{display:'inline-flex', alignItems:'center', gap:12, color: light ? 'rgba(255,255,255,0.9)' : 'var(--ink-soft)'}}>
      <img
        src="logo LATEST.jpg"
        alt="SJK(C) Chung Hwa Belemang"
        style={{width:size, height:size, borderRadius:'50%', objectFit:'contain', background:'white'}}
      />
      <div style={{display:'flex', flexDirection:'column', lineHeight:1.1, fontFamily:'var(--font-display)'}}>
        <span style={{fontWeight:700, fontSize: size > 56 ? 18 : 14, fontFamily:'"ZCOOL KuaiLe", var(--font-display)', letterSpacing:'0.04em'}}>文林望中华学校</span>
        <span style={{fontSize: size > 56 ? 11 : 9, opacity:0.72, letterSpacing:'0.12em', fontWeight:600, marginTop:2}}>SJK(C) CHUNG HWA BELEMANG</span>
      </div>
    </div>
  );
}

function ModeSwitcher({ mode, setMode, authed = true, adminOnlyModes = [] }) {
  // Order matters — public modes come first so viewers see them on the left.
  const modes = [
    { id: "catalog",   icon: "📋", zh: "图鉴",   ms: "Catalog" },
    { id: "status",    icon: "📊", zh: "战况",   ms: "Status" },
    { id: "rewards",   icon: "🎁", zh: "奖品",   ms: "Rewards" },
    { id: "loop",      icon: "🔁", zh: "闭环",   ms: "Loop" },
    { id: "mobile",    icon: "📝", zh: "录入",   ms: "Input" },
    { id: "stars",     icon: "⭐", zh: "环保星", ms: "Stars" },
    { id: "admin",     icon: "⚙️", zh: "管理",   ms: "Admin" },
  ];
  return (
    <div className="mode-switcher">
      {modes.map(m => {
        const locked = !authed && adminOnlyModes.includes(m.id);
        const classes = [
          mode === m.id ? "active" : "",
          locked ? "locked" : "",
        ].filter(Boolean).join(" ");
        return (
          <button key={m.id} className={classes} onClick={() => setMode(m.id)} title={locked ? "需要老师登入 · Admin login required" : ""}>
            <span className="mode-icon">{m.icon}</span>
            <span>{m.zh}{locked ? " 🔒" : ""}</span>
          </button>
        );
      })}
    </div>
  );
}

function Confetti({ active, colors = ["#FF6B35","#FFC93C","#2EC4B6","#88E5FF","#6FCF7E","#FFB400"] }) {
  if (!active) return null;
  const pieces = Array.from({length: 60}, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 300,
    duration: 1200 + Math.random() * 800,
    color: colors[i % colors.length],
    rotate: Math.random() * 360,
  }));
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} style={{
          left: p.left + "%",
          background: p.color,
          animationDuration: p.duration + "ms",
          animationDelay: p.delay + "ms",
          transform: `rotate(${p.rotate}deg)`,
        }} />
      ))}
    </div>
  );
}

function fmt(n, digits = 0) {
  return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtRM(cents) {
  return "RM " + fmt((Number(cents) || 0) / 100, 2);
}

function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + "s";
  if (s < 3600) return Math.floor(s/60) + "m";
  if (s < 86400) return Math.floor(s/3600) + "h";
  return Math.floor(s/86400) + "d";
}

function ViewerHint({ children }) {
  return (
    <div className="viewer-hint">
      🔒 <span>{children || "需要老师登入才能操作 · Admin login required to edit"}</span>
    </div>
  );
}

function AdminGate({ authed, requireAuth, children }) {
  if (authed) return children;
  return (
    <div className="mobile-view teacher-entry">
      <div className="mobile-frame teacher-frame admin-gate-frame">
        <div style={{display:'flex', justifyContent:'center', marginBottom:14}}>
          <SchoolStamp size={84} />
        </div>
        <div className="admin-gate-card">
          <div className="admin-gate-lock">🔒</div>
          <h2>仅老师可进入<br/><small>Admin only area</small></h2>
          <p>这个页面用来记录或修改数据，需要老师登入。<br/>
          家长 / 学生可以浏览 <b>📋 图鉴</b>、<b>📊 战况</b>、<b>🎁 奖品</b> 和 <b>🔁 闭环</b> 这几个公开页面。</p>
          <p style={{opacity:.7, fontSize:13}}>This page edits data and needs admin login.<br/>
          Parents & students can browse Catalog / Status / Rewards / Loop without logging in.</p>
          <button className="chunky-btn primary" style={{marginTop:14, fontSize:17, padding:'14px 24px'}} onClick={() => requireAuth && requireAuth()}>
            🔓 老师登入 · Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  BL, BLinline, SchoolStamp, ModeSwitcher, Confetti, fmt, fmtRM, relTime,
  ViewerHint, AdminGate,
});
