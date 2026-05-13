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

function ModeSwitcher({ mode, setMode }) {
  const modes = [
    { id: "mobile",    icon: "📝", zh: "录入", ms: "Input" },
    { id: "status",    icon: "📊", zh: "战况", ms: "Status" },
    { id: "admin",     icon: "⚙️", zh: "管理", ms: "Admin" },
  ];
  return (
    <div className="mode-switcher">
      {modes.map(m => (
        <button key={m.id} className={mode===m.id?"active":""} onClick={()=>setMode(m.id)}>
          <span className="mode-icon">{m.icon}</span>
          <span>{m.zh}</span>
        </button>
      ))}
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

Object.assign(window, {
  BL, BLinline, SchoolStamp, ModeSwitcher, Confetti, fmt, fmtRM, relTime
});
