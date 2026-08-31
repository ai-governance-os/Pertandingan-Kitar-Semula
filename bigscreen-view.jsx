// 战况 view — mobile-friendly status, ranking, and red list

const { useMemo: useMemoB, useState: useStateB } = React;

function BigScreenView({ state }) {
  const [tab, setTab] = useStateB("session");
  const session = EcoData.activeSession(state);
  const sessionResult = EcoData.sessionStats(state, session.id);
  const seasonTotals = useMemoB(() =>
    state.teams
      .map(team => ({ team, stats: EcoData.teamStats(state, team.id), sessionStats: sessionResult.stats[team.id] }))
      .sort((a, b) => b.stats.points - a.stats.points),
    [state, sessionResult]
  );
  const currentRanking = useMemoB(() =>
    state.teams
      .map(team => ({ team, stats: sessionResult.stats[team.id] }))
      .sort((a, b) => b.stats.points - a.stats.points),
    [state, sessionResult]
  );
  const missedMembers = EcoData.absenceReport(state).filter(member => member.missedCount > 0);
  const redList = missedMembers.filter(member => !member.eligible);
  const watchList = missedMembers.filter(member => member.eligible);

  const leader = sessionResult.winner;
  const scores = state.teams.map(team => sessionResult.stats[team.id].points);
  const lead = Math.abs((scores[0] || 0) - (scores[1] || 0));

  return (
    <div className="status-view">
      <div className="status-frame">
        <div className="status-identity">
          <SchoolStamp size={72} />
        </div>

        <header className="status-header">
          <div>
            <h1>环保小兵 · 战况</h1>
            <p>{session.name} · {session.date || "未设日期"}</p>
          </div>
          <div className="status-pill">{leader ? `${leader.zh} 领先` : "暂时平手"}</div>
        </header>

        <section className="status-score-grid">
          {state.teams.map(team => (
            <TeamStatusCard
              key={team.id}
              team={team}
              sessionStats={sessionResult.stats[team.id]}
              seasonStats={EcoData.teamStats(state, team.id)}
            />
          ))}
        </section>

        <div className="lead-summary">
          {leader ? (
            <span>本次领先：<strong>{leader.zh}</strong> +{fmtRM(lead)}</span>
          ) : (
            <span>本次比赛暂时平手</span>
          )}
        </div>

        <nav className="status-tabs">
          <button className={tab === "session" ? "active" : ""} onClick={() => setTab("session")}>本次排名</button>
          <button className={tab === "season" ? "active" : ""} onClick={() => setTab("season")}>全年总榜</button>
          <button className={tab === "red" ? "active danger" : ""} onClick={() => setTab("red")}>
            红名单{redList.length ? ` ${redList.length}` : ""}
          </button>
        </nav>

        {tab === "session" && (
          <StatusList
            title="本次 Session 排名"
            rows={currentRanking.map((row, index) => ({
              id: row.team.id,
              rank: index + 1,
              main: `${row.team.icon} ${row.team.zh}`,
              sub: `${fmt(row.stats.kg, 2)} kg`,
              value: fmtRM(row.stats.points),
            }))}
          />
        )}

        {tab === "season" && (
          <StatusList
            title="全年累计总榜"
            rows={seasonTotals.map((row, index) => ({
              id: row.team.id,
              rank: index + 1,
              main: `${row.team.icon} ${row.team.zh}`,
              sub: `组长：${row.team.leader}`,
              value: fmtRM(row.stats.points),
            }))}
          />
        )}

        {tab === "red" && <RedListPanel redList={redList} watchList={watchList} threshold={EcoData.redListThreshold(state)} />}
      </div>
    </div>
  );
}

function TeamStatusCard({ team, sessionStats, seasonStats }) {
  return (
    <article className={`status-team-card ${team.id}`}>
      <div className="status-team-top">
        <span className="status-team-icon">{team.icon}</span>
        <div>
          <h2>{team.zh}</h2>
          <p>{team.leader}</p>
        </div>
      </div>
      <div className="status-main-score">{fmtRM(sessionStats.points)}<span> 总值</span></div>
      <div className="status-mini-metrics">
        <div>
          <small>本次重量</small>
          <strong>{fmt(sessionStats.kg, 2)} kg</strong>
        </div>
        <div>
          <small>全年累计</small>
          <strong>{fmtRM(seasonStats.points)}</strong>
        </div>
      </div>
    </article>
  );
}

function StatusList({ title, rows }) {
  return (
    <section className="status-panel">
      <h2>{title}</h2>
      <div className="status-list">
        {rows.map(row => (
          <div className="status-row" key={row.id}>
            <span className="status-rank">{row.rank}</span>
            <div>
              <strong>{row.main}</strong>
              <small>{row.sub}</small>
            </div>
            <b>{row.value}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function RedListPanel({ redList, watchList, threshold = 3 }) {
  return (
    <section className="status-panel red-panel">
      <h2>红名单 · 奖品取消名单</h2>
      <div className="rule-note">📌 规则：累计没带回收物 <b>{threshold} 次</b>会被列入红名单，取消个人奖品资格</div>

      {redList.length === 0 && watchList.length === 0 && (
        <div className="red-empty">目前没有学生有没带记录。</div>
      )}

      {redList.length > 0 && (
        <div className="red-list">
          {redList.map(member => (
            <div className="red-row" key={member.id}>
              <div>
                <strong>{member.name}</strong>
                <span>{member.teamName} · 没带 {member.missedCount} 次</span>
                <small>{member.missedSessions.map(s => s.name).join("、")}</small>
              </div>
              <b>取消个人奖品</b>
            </div>
          ))}
        </div>
      )}

      {watchList.length > 0 && (
        <>
          <h3 className="watch-heading">⚠️ 警戒名单 · 还没取消资格，请留意</h3>
          <div className="red-list">
            {watchList.map(member => (
              <div className="red-row watch-row" key={member.id}>
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.teamName} · 没带 {member.missedCount} 次</span>
                  <small>{member.missedSessions.map(s => s.name).join("、")}</small>
                </div>
                <b>再没带 {member.missesLeft ?? (threshold - member.missedCount)} 次取消奖品</b>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

window.BigScreenView = BigScreenView;
