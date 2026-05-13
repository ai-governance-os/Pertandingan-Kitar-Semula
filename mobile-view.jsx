// 手机录入 view — pick team, pick category, enter weight, submit

const { useState: useStateM, useRef: useRefM, useEffect: useEffectM } = React;

function MobileView({ state, setState }) {
  const [teamId, setTeamId] = useStateM(null);
  const [catId, setCatId] = useStateM(null);
  const [kg, setKg] = useStateM(0);
  const [celebrate, setCelebrate] = useStateM(null);

  const team = state.teams.find(t => t.id === teamId);
  const cat = state.categories.find(c => c.id === catId);
  const score = cat ? Math.round(kg * cat.points) : 0;
  const ready = team && cat && kg > 0;

  function addKg(d) {
    setKg(prev => Math.max(0, +(prev + d).toFixed(2)));
  }

  function submit() {
    if (!ready) return;
    const { state: next, entry } = EcoData.addEntry(state, teamId, catId, kg);
    setState(next);
    setCelebrate({ entry, team, cat });
    // auto dismiss after 2.6s
    setTimeout(() => {
      setCelebrate(null);
      setKg(0);
      setCatId(null);
      // keep team selected for fast re-entry
    }, 2600);
  }

  function reset() {
    setTeamId(null);
    setCatId(null);
    setKg(0);
  }

  return (
    <div className="mobile-view">
      <div className="mobile-frame">

        <div style={{display:'flex', justifyContent:'center', marginBottom:-6}}>
          <SchoolStamp size={32} />
        </div>

        <div className="mobile-header">
          <h1><span className="zh">环保小兵</span></h1>
          <p>Eco Warrior · Pejuang Hijau</p>
        </div>

        {/* STEP 1 — TEAM */}
        <div className="step-pill">
          <span>{teamId ? "✓" : "1"}</span>
          <BLinline zh="选队伍" ms="Pilih pasukan" />
        </div>
        <div className="team-pick">
          {state.teams.map(t => (
            <div key={t.id}
                 className={`team-card ${t.id === "dragons" ? "dragon" : "lion"} ${teamId===t.id?"selected":""}`}
                 onClick={() => setTeamId(t.id)}>
              <div className="icon-bg">{t.icon}</div>
              <div className="icon">{t.icon}</div>
              <div className="name">
                <span>{t.zh}</span>
                <span className="ms">{t.ms}</span>
              </div>
            </div>
          ))}
        </div>

        {/* STEP 2 — CATEGORY (only after team) */}
        {teamId && (
          <>
            <div className="step-pill">
              <span>{catId ? "✓" : "2"}</span>
              <BLinline zh="选废品" ms="Pilih bahan" />
            </div>
            <div className="category-grid">
              {state.categories.map(c => (
                <div key={c.id}
                     className={`cat-tile ${catId===c.id?"selected":""}`}
                     onClick={() => setCatId(c.id)}>
                  <div className="cat-icon">{c.icon}</div>
                  <div className="cat-name">
                    <span>{c.zh}</span>
                    <span className="ms">{c.ms}</span>
                  </div>
                  <div className="cat-pts">{c.points} pts/kg</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* STEP 3 — WEIGHT (only after cat) */}
        {teamId && catId && (
          <>
            <div className="step-pill">
              <span>{kg > 0 ? "✓" : "3"}</span>
              <BLinline zh="输入重量" ms="Masukkan berat" />
            </div>
            <div className="weight-panel">
              <div className="weight-display">
                <div className="num">{kg.toFixed(2)}</div>
                <div className="unit">kg</div>
              </div>

              <div className="weight-controls">
                <button className="weight-btn minus" onClick={() => addKg(-1)}>−1</button>
                <button className="weight-btn minus" onClick={() => addKg(-0.1)}>−0.1</button>
                <button className="weight-btn plus"  onClick={() => addKg(0.1)}>+0.1</button>
                <button className="weight-btn plus"  onClick={() => addKg(1)}>+1</button>
              </div>
              <div className="weight-controls" style={{gridTemplateColumns:'1fr 1fr 1fr', marginTop:8}}>
                <button className="weight-btn" onClick={() => setKg(0.5)}>0.5</button>
                <button className="weight-btn" onClick={() => setKg(1)}>1.0</button>
                <button className="weight-btn zero" onClick={() => setKg(0)}>RESET</button>
              </div>

              <div className="score-preview">
                <div className="label"><BLinline zh="可得分" ms="Markah" /></div>
                <div className="value">{fmt(score)}<sup>pts</sup></div>
              </div>
            </div>
          </>
        )}

        <div style={{display:'flex', gap:10, marginTop:6}}>
          <button className="chunky-btn" onClick={reset} style={{flex:'0 0 auto', fontSize:14, padding:'12px 16px'}}>
            ↺
          </button>
          <button className={`chunky-btn primary`}
                  disabled={!ready}
                  style={{flex:1, justifyContent:'center', fontSize:20}}
                  onClick={submit}>
            <BLinline zh="提交" ms="Hantar" />
            <span>🚀</span>
          </button>
        </div>

        {/* recent entries by this team — small list at bottom */}
        {teamId && (
          <RecentForTeam state={state} teamId={teamId} />
        )}
      </div>

      {celebrate && <CelebrationPopup info={celebrate} onClose={() => { setCelebrate(null); setKg(0); setCatId(null); }} />}
      {celebrate && <Confetti active={true} />}
    </div>
  );
}

function RecentForTeam({ state, teamId }) {
  const rows = state.entries
    .filter(e => e.teamId === teamId)
    .slice(-3).reverse();
  if (rows.length === 0) return null;
  return (
    <div style={{marginTop:14, padding:'12px 14px', background:'rgba(255,255,255,0.5)', borderRadius:14, border:'2px solid rgba(20,18,40,0.08)'}}>
      <div style={{fontFamily:'var(--font-display)', fontSize:11, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--ink-mute)', fontWeight:700, marginBottom:8}}>
        最近记录 · Terkini
      </div>
      {rows.map(e => {
        const c = state.categories.find(x => x.id === e.categoryId);
        return (
          <div key={e.id} style={{display:'flex', alignItems:'center', gap:8, padding:'4px 0', fontSize:13, fontWeight:600}}>
            <span style={{fontSize:18}}>{c?.icon}</span>
            <span>{c?.zh}</span>
            <span style={{color:'var(--ink-mute)'}}>{e.kg}kg</span>
            <span style={{marginLeft:'auto', fontFamily:'var(--font-display)', fontWeight:700, color:'var(--eco-deep)'}}>+{e.points}</span>
          </div>
        );
      })}
    </div>
  );
}

function CelebrationPopup({ info, onClose }) {
  const { entry, team, cat } = info;
  return (
    <div className="celebration" onClick={onClose}>
      <div className="card">
        <div className="big-icon">{team.icon}</div>
        <div style={{fontFamily:'var(--font-display)', fontWeight:700, fontSize:22, marginTop:4, color: team.id==='dragons'?'var(--dragon-deep)':'var(--lion-deep)'}}>
          {team.zh} <span style={{fontSize:13, opacity:0.6}}>{team.ms}</span>
        </div>
        <div style={{margin:'12px 0 4px', fontSize:14, color:'var(--ink-mute)', fontWeight:600}}>
          {cat.icon} {cat.zh} · {entry.kg}kg
        </div>
        <div className="pts-burst">+{fmt(entry.points)}</div>
        <div className="msg">
          <span>积分！</span>
          <span className="ms">Markah!</span>
        </div>
        <div style={{marginTop:14, fontSize:12, color:'var(--eco-deep)', fontWeight:700}}>
          🌱 减少 {entry.co2} kg CO₂ · CO₂ dikurangkan
        </div>
      </div>
    </div>
  );
}

window.MobileView = MobileView;
