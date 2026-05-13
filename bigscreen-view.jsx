// 大屏 BIG SCREEN — 3 themes: arena / map / retro

const { useState: useStateB, useEffect: useEffectB, useRef: useRefB, useMemo: useMemoB } = React;

function BigScreenView({ state, theme }) {
  const dragons = EcoData.teamStats(state, "dragons");
  const lions   = EcoData.teamStats(state, "lions");
  const total   = EcoData.totalStats(state);

  const leader = dragons.points > lions.points ? "dragons"
                : lions.points > dragons.points ? "lions"
                : null;
  const lead = Math.abs(dragons.points - lions.points);

  const recent = useMemoB(() => {
    return [...state.entries].sort((a,b) => b.ts - a.ts).slice(0, 5);
  }, [state.entries]);

  // play celebrate on score change
  const [flash, setFlash] = useStateB(null);
  const prevPts = useRefB({ dragons: dragons.points, lions: lions.points });
  useEffectB(() => {
    if (dragons.points > prevPts.current.dragons) setFlash({ teamId: "dragons", diff: dragons.points - prevPts.current.dragons });
    else if (lions.points > prevPts.current.lions) setFlash({ teamId: "lions",   diff: lions.points - prevPts.current.lions });
    prevPts.current = { dragons: dragons.points, lions: lions.points };
    if (flash) {
      const t = setTimeout(() => setFlash(null), 2500);
      return () => clearTimeout(t);
    }
  }, [dragons.points, lions.points]);

  return (
    <div className={`bigscreen theme-${theme}`}>

      <div className="bs-header">
        <div style={{position:'absolute', top:0, left:30}}>
          <SchoolStamp size={48} light={theme!=='map'} />
        </div>
        <h1>
          <span className="zh">环保小兵</span> · <span style={{fontFamily:'var(--font-display)'}}>ECO WARRIOR LEAGUE</span>
        </h1>
        <div className="subtitle">{state.season.name.zh} · {state.season.name.ms}</div>
      </div>

      {theme === "map" ? (
        <MapStage dragons={dragons} lions={lions} state={state} />
      ) : (
        <div className="versus-arena">
          <Fighter teamKey="dragons" team={state.teams[0]} stats={dragons} flash={flash?.teamId==='dragons'?flash:null} theme={theme} />
          <div className="versus-center">
            {leader && <div className="lead-arrow" style={{transform: leader==='dragons'?'rotate(-90deg)':'rotate(90deg)'}}>▲</div>}
            <div className="vs">VS</div>
            {leader && <div className="lead-label">领先 / Mendahului<br/>+{fmt(lead)} pts</div>}
            {!leader && <div className="lead-label" style={{color:'rgba(255,255,255,0.5)'}}>平手 / Seri</div>}
          </div>
          <Fighter teamKey="lions" team={state.teams[1]} stats={lions} flash={flash?.teamId==='lions'?flash:null} theme={theme} />
        </div>
      )}

      <div className="stat-strip">
        <div className="stat-cell items">
          <div className="label">📥 总投入 · Jumlah masuk</div>
          <div className="value">{fmt(total.count)}<span className="unit">items</span></div>
        </div>
        <div className="stat-cell eco">
          <div className="label">♻️ 共回收 · Dikitar semula</div>
          <div className="value">{fmt(total.kg, 1)}<span className="unit">kg</span></div>
        </div>
        <div className="stat-cell co2">
          <div className="label">🌍 减少碳排 · CO₂ dikurangkan</div>
          <div className="value">{fmt(total.co2, 1)}<span className="unit">kg CO₂</span></div>
        </div>
        <div className="activity-feed">
          <div className="header">⚡ 实时动态 · Aktiviti</div>
          {recent.map(e => {
            const c = state.categories.find(x => x.id === e.categoryId);
            const t = state.teams.find(x => x.id === e.teamId);
            return (
              <div key={e.id} className="row">
                <span className={`badge ${e.teamId}`} />
                <span style={{fontSize:14}}>{t?.icon}</span>
                <span>{c?.icon} {c?.zh}</span>
                <span style={{opacity:0.5}}>{e.kg}kg</span>
                <span className="pts">+{e.points}</span>
                <span className="when">{relTime(e.ts)}</span>
              </div>
            );
          })}
          {recent.length === 0 && <div className="row" style={{opacity:0.4}}>—</div>}
        </div>
      </div>

      {flash && <Confetti active={true} colors={flash.teamId==='dragons'?["#FF6B35","#FFC93C","#FFB400"]:["#2EC4B6","#88E5FF","#6FCF7E"]} />}
    </div>
  );
}

function Fighter({ teamKey, team, stats, flash, theme }) {
  const levelName = EcoData.LEVELS[Math.min(stats.level-1, EcoData.LEVELS.length-1)];
  return (
    <div className={`fighter ${teamKey}`}>
      <div className="fighter-card" style={flash ? {animation: 'pulse 600ms ease-out'} : {}}>
        <div style={{display:'flex', alignItems:'center', gap:20}}>
          <div className="mascot">{team.icon}</div>
          <div style={{flex:1}}>
            <div className="team-name" style={{textAlign:'left'}}>
              <span className="zh">{team.zh}</span>
              <span className="ms">{team.ms}</span>
            </div>
            <div className="score-big" style={{textAlign:'left'}}>
              {fmt(stats.points)}<span className="pts">PTS</span>
            </div>
          </div>
        </div>

        <div className="level-bar">
          <div className="level-tag">
            <span className="lv-num">
              ⭐ Lv.{stats.level} · {levelName?.zh}
            </span>
            <span style={{fontFamily:'var(--font-body)', fontSize:12, opacity:0.7}}>
              {fmt(stats.points % EcoData.LEVEL_STEP)} / {EcoData.LEVEL_STEP}
            </span>
          </div>
          <div className="bar">
            <div className="fill" style={{width: (stats.progressInLevel*100)+"%"}} />
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:14, fontSize:13}}>
          <div style={{background:'rgba(0,0,0,0.2)', borderRadius:12, padding:'8px 12px'}}>
            <div style={{fontSize:10, opacity:0.55, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase'}}>已回收 · Berat</div>
            <div style={{fontFamily:'var(--font-display)', fontWeight:700, fontSize:18}}>{fmt(stats.kg, 1)} kg</div>
          </div>
          <div style={{background:'rgba(0,0,0,0.2)', borderRadius:12, padding:'8px 12px'}}>
            <div style={{fontSize:10, opacity:0.55, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase'}}>投入次数 · Hantaran</div>
            <div style={{fontFamily:'var(--font-display)', fontWeight:700, fontSize:18}}>{stats.count}</div>
          </div>
        </div>

        {flash && (
          <div style={{
            position:'absolute',
            top:-30, right:20,
            fontFamily:'var(--font-display)',
            fontWeight:700,
            fontSize: 56,
            color:'var(--gold)',
            textShadow:'0 0 24px var(--gold), 0 4px 0 rgba(0,0,0,0.4)',
            animation:'popIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents:'none'
          }}>
            +{flash.diff}
          </div>
        )}
      </div>
    </div>
  );
}

// THEME B — Adventure Map: both teams climb a mountain trail
function MapStage({ dragons, lions, state }) {
  // Map points 0..1 = progress; cap at level 6
  const maxPts = EcoData.LEVELS.length * EcoData.LEVEL_STEP;
  const dProg = Math.min(1, dragons.points / maxPts);
  const lProg = Math.min(1, lions.points / maxPts);

  // Path goes from bottom-left to top (mountain shape) — define waypoints
  // Each waypoint is a checkpoint (level)
  const path = [
    { x: 8,  y: 88 },  // base camp
    { x: 22, y: 78 },
    { x: 32, y: 65 },
    { x: 48, y: 55 },
    { x: 60, y: 42 },
    { x: 72, y: 28 },
    { x: 86, y: 12 },  // summit
  ];

  function posAt(t) {
    if (t <= 0) return path[0];
    if (t >= 1) return path[path.length-1];
    const seg = t * (path.length - 1);
    const i = Math.floor(seg);
    const f = seg - i;
    const a = path[i], b = path[i+1];
    return { x: a.x + (b.x-a.x)*f, y: a.y + (b.y-a.y)*f };
  }

  const dPos = posAt(dProg);
  const lPos = posAt(lProg);

  // build SVG path string
  const pathD = path.map((p, i) => (i===0?"M":"L") + p.x + "," + p.y).join(" ");

  return (
    <div className="versus-arena">
      <div className="map-stage">
        <svg className="mountain-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Mountains in background */}
          <polygon points="0,100 25,40 50,60 75,30 100,55 100,100" fill="#5a8a6a" opacity="0.4"/>
          <polygon points="0,100 15,60 35,75 55,55 75,75 100,65 100,100" fill="#4a7a5a" opacity="0.6"/>
          {/* Path */}
          <path d={pathD} stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" fill="none" strokeDasharray="2,1.5" strokeLinecap="round"/>
          <path d={pathD} stroke="rgba(20,18,40,0.4)" strokeWidth="2.6" fill="none" strokeLinecap="round"/>
          <path d={pathD} stroke="#FFD66E" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
        </svg>

        {/* Checkpoint flags */}
        {path.map((p, i) => (
          <div key={i} className="checkpoint" style={{left: p.x+"%", top: p.y+"%"}}>
            <div className="flag">{i===path.length-1?"🏆":i===0?"🏕️":"🚩"}</div>
            <div className="lv">Lv.{i+1}</div>
          </div>
        ))}

        {/* Team markers */}
        <div className="trail-marker dragons" style={{left: dPos.x+"%", top: dPos.y+"%"}}>
          <div className="mascot">🐲</div>
          <div className="tag">飞龙 {fmt(dragons.points)}</div>
        </div>
        <div className="trail-marker lions" style={{left: lPos.x+"%", top: (lPos.y+6)+"%"}}>
          <div className="mascot">🦁</div>
          <div className="tag">云狮 {fmt(lions.points)}</div>
        </div>
      </div>
    </div>
  );
}

window.BigScreenView = BigScreenView;
