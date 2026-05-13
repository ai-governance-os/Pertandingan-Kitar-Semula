// 大屏 view — current session battle + annual totals

const { useMemo: useMemoB, useState: useStateB, useEffect: useEffectB, useRef: useRefB } = React;

function BigScreenView({ state, theme }) {
  const session = EcoData.activeSession(state);
  const sessionResult = EcoData.sessionStats(state, session.id);
  const totals = state.teams.map(team => ({ team, stats: EcoData.teamStats(state, team.id) }));
  const total = EcoData.totalStats(state);
  const absence = EcoData.absenceReport(state);
  const ineligible = absence.filter(m => !m.eligible);

  const leader = sessionResult.winner;
  const teamA = state.teams[0];
  const teamB = state.teams[1];
  const scoreA = sessionResult.stats[teamA.id].points;
  const scoreB = sessionResult.stats[teamB.id].points;
  const lead = Math.abs(scoreA - scoreB);

  const recent = useMemoB(() => {
    return [...state.weighIns].sort((a, b) => b.ts - a.ts).slice(0, 5);
  }, [state.weighIns]);

  const [flash, setFlash] = useStateB(null);
  const prevPts = useRefB({ a: scoreA, b: scoreB });
  useEffectB(() => {
    if (scoreA > prevPts.current.a) setFlash(teamA.id);
    if (scoreB > prevPts.current.b) setFlash(teamB.id);
    prevPts.current = { a: scoreA, b: scoreB };
    const t = setTimeout(() => setFlash(null), 2000);
    return () => clearTimeout(t);
  }, [scoreA, scoreB]);

  return (
    <div className={`bigscreen theme-${theme} session-screen`}>
      <div className="bs-header">
        <div style={{position:'absolute', top:-6, left:30}}>
          <SchoolStamp size={82} light={theme !== "map"} />
        </div>
        <h1><span className="zh">环保小兵</span> · HARI MESRA ALAM</h1>
        <div className="subtitle">{session.name} · {session.date || "未设日期"} · 当前 Session</div>
      </div>

      <div className="versus-arena session-arena">
        {state.teams.map(team => (
          <TeamBattleCard
            key={team.id}
            team={team}
            sessionStats={sessionResult.stats[team.id]}
            seasonStats={EcoData.teamStats(state, team.id)}
            flash={flash === team.id}
          />
        ))}
        <div className="versus-center session-center">
          <div className="vs">VS</div>
          {leader ? (
            <div className="lead-label">{leader.zh} 领先<br/>+{fmt(lead)} pts</div>
          ) : (
            <div className="lead-label" style={{color:'rgba(255,255,255,0.55)'}}>暂时平手</div>
          )}
        </div>
      </div>

      <div className="stat-strip session-stat-strip">
        <div className="stat-cell eco">
          <div className="label">全年总重量</div>
          <div className="value">{fmt(total.kg, 2)}<span className="unit">kg</span></div>
        </div>
        <div className="stat-cell items">
          <div className="label">全年累计分</div>
          <div className="value">{fmt(total.points)}<span className="unit">pts</span></div>
        </div>
        <div className="stat-cell co2">
          <div className="label">不可领奖</div>
          <div className="value">{ineligible.length}<span className="unit">人</span></div>
        </div>
        <div className="activity-feed">
          <div className="header">最近重量记录</div>
          {recent.map(w => {
            const cat = state.categories.find(c => c.id === w.categoryId);
            const team = state.teams.find(t => t.id === w.teamId);
            const s = state.sessions.find(x => x.id === w.sessionId);
            return (
              <div key={w.id} className="row">
                <span className={`badge ${w.teamId}`} />
                <span>{team?.icon} {team?.zh}</span>
                <span>{cat?.icon} {cat?.zh}</span>
                <span>{fmt(w.kg, 2)}kg</span>
                <span className="pts">+{fmt(w.points)}</span>
                <span className="when">{s?.name}</span>
              </div>
            );
          })}
          {recent.length === 0 && <div className="row" style={{opacity:0.45}}>还没有记录</div>}
        </div>
      </div>

      <div className="season-rank">
        {totals.map(({team, stats}, index) => (
          <div key={team.id} className={`rank-card ${team.id}`}>
            <span>{index + 1}</span>
            <strong>{team.icon} {team.zh}</strong>
            <b>{fmt(stats.points)} pts</b>
            <small>{fmt(stats.kg, 2)} kg</small>
          </div>
        ))}
      </div>

      {flash && <Confetti active={true} />}
    </div>
  );
}

function TeamBattleCard({ team, sessionStats, seasonStats, flash }) {
  return (
    <div className={`fighter ${team.id}`}>
      <div className="fighter-card session-card" style={flash ? {animation: 'pulse 600ms ease-out'} : {}}>
        <div className="team-card-top">
          <div className="mascot">{team.icon}</div>
          <div className="team-name">
            <span className="zh">{team.zh}</span>
            <span className="ms">组长：{team.leader}</span>
          </div>
        </div>
        <div className="score-big">
          {fmt(sessionStats.points)}<span className="pts">PTS</span>
        </div>
        <div className="session-mini-grid">
          <div>
            <span>本次重量</span>
            <b>{fmt(sessionStats.kg, 2)} kg</b>
          </div>
          <div>
            <span>全年累计</span>
            <b>{fmt(seasonStats.points)} pts</b>
          </div>
        </div>
      </div>
    </div>
  );
}

window.BigScreenView = BigScreenView;
