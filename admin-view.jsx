// 管理员 view — sessions, weights, annual standings, prize eligibility

const { useState: useStateA, useMemo: useMemoA } = React;

function AdminView({ state, setState }) {
  const [confirmReset, setConfirmReset] = useStateA(false);
  const report = useMemoA(() => EcoData.absenceReport(state), [state]);
  const ineligible = report.filter(r => !r.eligible);

  function addSession() {
    const name = window.prompt("新 Session 名称，例如：第二次", `第${state.sessions.length + 1}次`);
    if (!name) return;
    setState(EcoData.addSession(state, name.trim()));
  }

  function patchSession(id, patch) {
    setState(EcoData.updateSession(state, id, patch));
  }

  function deleteSession(id) {
    if (!window.confirm("删除这个 Session？相关重量和有带/没带记录也会删除。")) return;
    setState(EcoData.removeSession(state, id));
  }

  function patchCat(id, patch) {
    const next = state.categories.map(c => c.id === id ? { ...c, ...patch } : c);
    setState(EcoData.updateCategories(state, next));
  }

  function exportCsv() {
    const csv = EcoData.exportCSV(state);
    const blob = new Blob([csv], {type: "text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hari-mesra-alam-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetSeason() {
    setState(EcoData.resetSeason(state));
    setConfirmReset(false);
  }

  const seasonTotals = state.teams.map(team => ({ team, stats: EcoData.teamStats(state, team.id) }))
    .sort((a, b) => b.stats.points - a.stats.points);
  const total = EcoData.totalStats(state);

  return (
    <div className="admin-view">
      <div className="admin-frame">
        <div style={{marginBottom:18}}>
          <SchoolStamp size={78} />
        </div>

        <div className="admin-header">
          <div>
            <h1><span className="zh">管理面板</span> · Admin Panel</h1>
            <div className="subtitle">Session、分类权重、组员资格、全年总分</div>
          </div>
          <div className="actions">
            <button className="chunky-btn" onClick={exportCsv}>导出 CSV</button>
            <button className="chunky-btn primary" onClick={addSession}>+ 新 Session</button>
          </div>
        </div>

        <div className="admin-section">
          <h2>全年总览</h2>
          <div className="admin-stat-grid">
            {seasonTotals.map(({team, stats}, index) => (
              <StatBox
                key={team.id}
                label={`${index === 0 ? "领先" : "追赶"} · ${team.zh}`}
                sub={team.leader}
                value={fmt(stats.points)}
                unit="pts"
                color={team.primary}
              />
            ))}
            <StatBox label="总重量" sub="Jumlah berat" value={fmt(total.kg, 2)} unit="kg" color="var(--eco-deep)" />
            <StatBox label="不可领奖" sub="2 次没带或以上" value={ineligible.length} unit="人" color="#C8341A" />
          </div>
        </div>

        <div className="admin-section">
          <h2>Session 管理</h2>
          <div className="session-admin-list">
            {state.sessions.map(s => {
              const session = EcoData.sessionStats(state, s.id);
              return (
                <div className={`session-admin-row ${state.activeSessionId === s.id ? "current" : ""}`} key={s.id}>
                  <button className="session-current-btn" onClick={() => setState(EcoData.setActiveSession(state, s.id))}>
                    {state.activeSessionId === s.id ? "当前" : "设为当前"}
                  </button>
                  <input value={s.name} onChange={e => patchSession(s.id, {name: e.target.value})} />
                  <input type="date" value={s.date || ""} onChange={e => patchSession(s.id, {date: e.target.value})} />
                  <div className="session-result">
                    {session.winner ? `胜出：${session.winner.zh}` : "暂时平手"}
                  </div>
                  <button className="del" onClick={() => deleteSession(s.id)} disabled={state.sessions.length <= 1}>删除</button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-section">
          <h2>分类权重</h2>
          <div className="section-sub">每公斤多少分可随时改；改了以后旧记录会按新权重重新计算。</div>
          <div className="cat-list">
            {state.categories.map(c => (
              <div className="cat-row compact-cat-row" key={c.id}>
                <input className="icon-cell" value={c.icon} onChange={e => patchCat(c.id, {icon: e.target.value})} />
                <div className="name-stack">
                  <input value={c.zh} onChange={e => patchCat(c.id, {zh: e.target.value})} />
                  <input value={c.ms} onChange={e => patchCat(c.id, {ms: e.target.value})} />
                </div>
                <div className="pts-input">
                  <input type="number" min="0" step="1" value={c.points} onChange={e => patchCat(c.id, {points: +e.target.value || 0})} />
                  <span className="unit">pts/kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-section">
          <h2>每次胜负</h2>
          <div className="session-results-grid">
            {state.sessions.map(s => {
              const res = EcoData.sessionStats(state, s.id);
              return (
                <div className="session-result-card" key={s.id}>
                  <strong>{s.name}</strong>
                  <span>{s.date || "未设日期"}</span>
                  <div className="result-lines">
                    {state.teams.map(t => (
                      <div key={t.id}>
                        <span>{t.icon} {t.zh}</span>
                        <b>{fmt(res.stats[t.id].points)} pts</b>
                      </div>
                    ))}
                  </div>
                  <em>{res.winner ? `${res.winner.zh} 胜出` : "平手"}</em>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-section">
          <h2>组员名单与年终资格</h2>
          <div className="eligibility-table-wrap">
            <table className="log-table eligibility-table">
              <thead>
                <tr>
                  <th>组别</th>
                  <th>姓名</th>
                  <th style={{textAlign:'center'}}>没带次数</th>
                  <th>资格</th>
                </tr>
              </thead>
              <tbody>
                {report.map(member => (
                  <tr key={member.id} className={!member.eligible ? "bad-row" : ""}>
                    <td>{member.teamName}</td>
                    <td>{member.name}</td>
                    <td style={{textAlign:'center'}}>{member.missedCount}</td>
                    <td>{member.eligible ? "可领奖" : "取消个人奖品"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-section danger-zone">
          <h2>危险操作</h2>
          <div className="section-sub" style={{color:'#9B2A14'}}>重置会清空 Session、重量和有带/没带记录，但保留名单与分类权重。</div>
          {!confirmReset ? (
            <button className="chunky-btn danger-btn" onClick={() => setConfirmReset(true)}>重置全年记录</button>
          ) : (
            <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap'}}>
              <strong style={{color:'#C8341A'}}>确定？</strong>
              <button className="chunky-btn danger-btn" onClick={resetSeason}>是，重置</button>
              <button className="chunky-btn" onClick={() => setConfirmReset(false)}>取消</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, sub, value, unit, color }) {
  return (
    <div className="stat-box">
      <div className="stat-label">{label}</div>
      <div className="stat-sub">{sub}</div>
      <div className="stat-value" style={{color}}>
        {value}<span>{unit}</span>
      </div>
    </div>
  );
}

window.AdminView = AdminView;
