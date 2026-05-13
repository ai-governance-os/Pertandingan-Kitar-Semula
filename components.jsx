// 环保小兵 — shared React components

const { useState, useEffect, useRef, useMemo } = React;

// Bilingual text rendering
function BL({ zh, ms, sep = " · " }) {
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

// School identity stamp (logo + name)
function SchoolStamp({ size = 36, light = false }) {
  return (
    <div className="school-stamp" style={{display:'inline-flex', alignItems:'center', gap:10, color: light ? 'rgba(255,255,255,0.85)' : 'var(--ink-soft)'}}>
      <img src="assets/school-logo.jpg" alt="SJK(C) Chung Hwa Belemang" style={{width:size, height:size, borderRadius:'50%', objectFit:'cover', boxShadow: light ? '0 0 0 2px rgba(255,255,255,0.3)' : '0 2px 6px rgba(20,18,40,0.15)'}} />
      <div style={{display:'flex', flexDirection:'column', lineHeight:1.1, fontFamily:'var(--font-display)'}}>
        <span style={{fontWeight:700, fontSize: size > 40 ? 15 : 12, fontFamily:'"ZCOOL KuaiLe", var(--font-display)', letterSpacing:'0.04em'}}>文林望中华学校</span>
        <span style={{fontSize: size > 40 ? 9 : 8, opacity:0.7, letterSpacing:'0.12em', fontWeight:600, marginTop:1}}>SJK(C) CHUNG HWA BELEMANG</span>
      </div>
    </div>
  );
}

// Mode switcher (top-left)
function ModeSwitcher({ mode, setMode }) {
  const modes = [
    { id: "mobile",    icon: "📱", zh: "录入", ms: "Input" },
    { id: "bigscreen", icon: "🖥️", zh: "大屏", ms: "Skrin" },
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

// Confetti burst
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

// Format helpers
function fmt(n, digits = 0) {
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + "s";
  if (s < 3600) return Math.floor(s/60) + "m";
  if (s < 86400) return Math.floor(s/3600) + "h";
  return Math.floor(s/86400) + "d";
}

Object.assign(window, {
  BL, BLinline, SchoolStamp, ModeSwitcher, Confetti, fmt, relTime
});
