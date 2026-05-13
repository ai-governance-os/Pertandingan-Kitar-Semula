// 老师录入 view — session, team weights, member brought/not brought

const { useState: useStateM, useMemo: useMemoM } = React;

function MobileView({ state, setState }) {
  const session = EcoData.activeSession(state);
  const [teamId, setTeamId] = useStateM(state.teams[0]?.id);
  const team = state.teams.find(t => t.id === teamId) || state.teams[0];
  const sessionScores = useMemoM(() => EcoData.sessionStats(state, session.id), [state, session.id]);
  const selectedStats = EcoData.sessionTeamStats(state, session.id, team.id);

  function setSession(id) {
    setState(EcoData.setActiveSession(state, id));
  }

  function addSession() {
    const name = window.prompt("新 Session 名称，例如：第二次", `第${state.sessions.length + 1}次`);
    if (!name) return;
    setState(EcoData.addSession(state, name.trim()));
  }

  function changeWeight(categoryId, value) {
    setState(EcoData.updateWeighIn(state, session.id, team.id, categoryId, value));
  }

  function markMember(memberId, brought) {
    setState(EcoData.setAttendance(state, session.id, memberId, brought));
  }

  return (
    <div className="mobile-view teacher-entry">
      <div className="mobile-frame teacher-frame">
        <div style={{display:'flex', justifyContent:'center', marginBottom:10}}>
          <SchoolStamp size={72} />
        </div>

        <div className="mobile-header compact">
          <h1><span className="zh">老师录入</span></h1>
          <p>重量、分数、组员有带/没带</p>
        </div>

        <div className="session-bar">
          <label>
            <span>Session</span>
            <select value={session.id} onChange={e => setSession(e.target.value)}>
              {state.sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <button className="chunky-btn" onClick={addSession}>+ 新增</button>
        </div>

        <div className="session-score-row">
          {state.teams.map(t => {
            const stats = sessionScores.stats[t.id];
            return (
              <button
                key={t.id}
                className={`session-team-card ${t.id} ${team.id === t.id ? "active" : ""}`}
                onClick={() => setTeamId(t.id)}
              >
                <span className="team-mini">{t.icon}</span>
                <span>{t.zh}</span>
                <b>{fmt(stats.points)} pts</b>
              </button>
            );
          })}
        </div>

        <div className="entry-panel">
          <div className="panel-title">
            <div>
              <strong>{team.icon} {team.zh}</strong>
              <span>组长：{team.leader}</span>
            </div>
            <div className="total-badge">{fmt(selectedStats.kg, 2)} kg · {fmt(selectedStats.points)} pts</div>
          </div>

          <div className="weight-grid">
            {state.categories.map(cat => {
              const kg = EcoData.getWeight(state, session.id, team.id, cat.id);
              const pts = Math.round(kg * cat.points);
              return (
                <div className="weight-row" key={cat.id}>
                  <div className="cat-label">
                    <span className="cat-icon">{cat.icon}</span>
                    <span>{cat.zh}</span>
                    <small>{cat.points} pts/kg</small>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={kg || ""}
                    placeholder="0.00"
                    onChange={e => changeWeight(cat.id, e.target.value)}
                  />
                  <div className="row-points">{fmt(pts)} pts</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="entry-panel">
          <div className="panel-title">
            <div>
              <strong>组员记录</strong>
              <span>累计两次没带，年终奖品取消</span>
            </div>
          </div>

          <div className="member-list">
            {team.members.map(member => {
              const brought = EcoData.attendanceFor(state, session.id, member.id);
              const report = EcoData.absenceReport(state).find(r => r.id === member.id);
              return (
                <div className={`member-row ${brought ? "brought" : "missing"}`} key={member.id}>
                  <div className="member-name">
                    <strong>{member.name}</strong>
                    <small>累计没带 {report?.missedCount || 0} 次</small>
                  </div>
                  <div className="attendance-toggle">
                    <button className={brought ? "active" : ""} onClick={() => markMember(member.id, true)}>有带</button>
                    <button className={!brought ? "active danger" : ""} onClick={() => markMember(member.id, false)}>没带</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

window.MobileView = MobileView;
