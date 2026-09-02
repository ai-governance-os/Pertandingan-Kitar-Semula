// 管理员 view — sessions, weights, annual standings, prize eligibility

const { useState: useStateA, useMemo: useMemoA } = React;

function AdminView(props) {
  if (!props.authed) return <AdminGate authed={false} requireAuth={props.requireAuth}>{null}</AdminGate>;
  return <AdminViewInner {...props} />;
}

function AdminViewInner({ state, setState, isAdmin = false }) {
  const [confirmReset, setConfirmReset] = useStateA(false);
  const [newStudentName, setNewStudentName] = useStateA("");
  const [newStudentTeamId, setNewStudentTeamId] = useStateA(() => state.teams[0]?.id || "");
  const [rosterNameDrafts, setRosterNameDrafts] = useStateA({});
  const [rosterNotice, setRosterNotice] = useStateA("");
  const report = useMemoA(() => EcoData.absenceReport(state), [state]);
  const ineligible = report.filter(r => !r.eligible);
  const threshold = EcoData.redListThreshold(state);
  const activeRosterCount = EcoData.activeStudentCount(state);
  const maxActiveStudents = EcoData.MAX_ACTIVE_STUDENTS;

  function changeThreshold(next) {
    const value = Math.max(1, Math.round(Number(next) || 1));
    if (value === threshold) return;
    // Eligibility is derived live, so this re-labels every student instantly.
    const affected = report.filter(r => (r.missedCount >= threshold) !== (r.missedCount >= value)).length;
    if (affected > 0) {
      const ok = window.confirm(
        `改成「没带 ${value} 次取消奖品」后，有 ${affected} 位学生的资格会立刻改变。确定？\n` +
        `Changing the threshold to ${value} will immediately change eligibility for ${affected} student(s). Continue?`
      );
      if (!ok) return;
    }
    setState(EcoData.setRedListThreshold(state, value));
  }
  const starReport = useMemoA(() => EcoData.studentStarReport(state), [state]);
  const starLedger = state.starLedger || [];

  function undoStarEvent(eventId) {
    if (!window.confirm("删除这条星星记录？此操作无法撤销。\nDelete this star record? This cannot be undone.")) return;
    setState(EcoData.removeStarEvent(state, eventId));
  }

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

  function rosterNameDraft(member) {
    return Object.prototype.hasOwnProperty.call(rosterNameDrafts, member.id)
      ? rosterNameDrafts[member.id]
      : member.name;
  }

  function patchRosterName(memberId, name) {
    setRosterNameDrafts(drafts => ({ ...drafts, [memberId]: name }));
  }

  function saveRosterName(member) {
    const name = rosterNameDraft(member).trim();
    if (!name) {
      setRosterNotice("学生姓名不能为空。\nStudent name cannot be empty.");
      return;
    }
    if (name === member.name) {
      setRosterNotice("姓名没有改变。\nNo name change was made.");
      return;
    }
    setState(EcoData.renameStudent(state, member.id, name));
    setRosterNameDrafts(drafts => {
      const next = { ...drafts };
      delete next[member.id];
      return next;
    });
    setRosterNotice(`已更新 ${name} 的姓名。\nName updated.`);
  }

  function addRosterStudent() {
    const name = newStudentName.trim();
    const team = state.teams.find(item => item.id === newStudentTeamId);
    if (!name) {
      setRosterNotice("请先输入学生姓名。\nEnter the student's name first.");
      return;
    }
    if (!team) {
      setRosterNotice("请选择组别。\nChoose a team first.");
      return;
    }
    if (activeRosterCount >= maxActiveStudents) {
      setRosterNotice(`目前已有 ${maxActiveStudents} 位在籍学生。请先归档离校学生，再加入新生；这样每位学生仍保有不同神兽。`);
      return;
    }
    setState(EcoData.addStudent(state, { name, teamId: team.id }));
    setNewStudentName("");
    setRosterNotice(`${name} 已加入 ${team.zh}。`);
  }

  function moveRosterStudent(member, fromTeam, toTeamId) {
    if (toTeamId === fromTeam.id) return;
    const destination = state.teams.find(team => team.id === toTeamId);
    if (!destination) return;
    const ok = window.confirm(`把 ${member.name} 从「${fromTeam.zh}」转到「${destination.zh}」？\n已有的重量、星星、奖品和出席记录会保留。`);
    if (!ok) {
      setRosterNotice("已取消转组。\nTeam change cancelled.");
      return;
    }
    setState(EcoData.moveStudent(state, member.id, destination.id));
    setRosterNotice(`${member.name} 已转到 ${destination.zh}。`);
  }

  function archiveRosterStudent(member) {
    const ok = window.confirm(`归档 ${member.name}？\n他/她将不再出现在日常记录、AI、奖品和神兽乐园，但原有资料会保留，可随时恢复。`);
    if (!ok) return;
    setState(EcoData.archiveStudent(state, member.id));
    setRosterNotice(`${member.name} 已归档；历史记录已保留。`);
  }

  function restoreRosterStudent(member, team) {
    if (activeRosterCount >= maxActiveStudents) {
      setRosterNotice(`目前已有 ${maxActiveStudents} 位在籍学生。请先归档一位离校学生，才能恢复 ${member.name}。`);
      return;
    }
    setState(EcoData.restoreStudent(state, member.id));
    setRosterNotice(`${member.name} 已恢复到 ${team.zh}。`);
  }

  function changeTeamLeader(teamId, studentId) {
    if (!studentId) return;
    setState(EcoData.setTeamLeader(state, teamId, studentId));
    setRosterNotice("组长已更新。\nTeam leader updated.");
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
                sub={EcoData.teamLeaderName(team)}
                value={fmtRM(stats.points)}
                unit=""
                color={team.primary}
              />
            ))}
            <StatBox label="总重量" sub="Jumlah berat" value={fmt(total.kg, 2)} unit="kg" color="var(--eco-deep)" />
            <StatBox label="不可领奖" sub={`${threshold} 次没带或以上`} value={ineligible.length} unit="人" color="#C8341A" />
          </div>
        </div>

        {isAdmin && (
          <div className="admin-section">
            <h2>⭐ 老师星星记录 · Star Ledger (Admin only)</h2>
            <div className="section-sub">每笔加/扣星都记录了操作老师、时间与原因；只有 Admin 能看到全部记录并撤销。</div>
            <div className="eligibility-table-wrap">
              <table className="log-table star-table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>老师</th>
                    <th>学生</th>
                    <th>数量</th>
                    <th>原因</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {starLedger.map(e => (
                    <tr key={e.id} className={e.stars < 0 ? "row-negative" : ""}>
                      <td>{new Date(e.ts).toLocaleString()}</td>
                      <td>{e.teacherId || "unknown"}</td>
                      <td>{e.studentName}</td>
                      <td><b>{e.stars > 0 ? `+${e.stars}` : e.stars}</b> ⭐</td>
                      <td>{e.reasonZh || e.reasonEn || "—"}</td>
                      <td><button className="chunky-btn small-btn" onClick={() => undoStarEvent(e.id)}>撤销</button></td>
                    </tr>
                  ))}
                  {starLedger.length === 0 && (
                    <tr><td colSpan={6}>暂无记录 · No records yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="section-sub" style={{marginTop:16}}>学生星星余额（本月）</div>
            <div className="eligibility-table-wrap">
              <table className="log-table star-table">
                <thead>
                  <tr><th>组别</th><th>姓名</th><th>余额</th></tr>
                </thead>
                <tbody>
                  {starReport.map(r => (
                    <tr key={r.id} className={r.balance < 0 ? "row-negative" : ""}>
                      <td><span className="table-team-cell"><TeamBadge src={r.teamBadgeSrc} name={r.teamName} size={28} /> {r.teamName}</span></td>
                      <td>{r.name}</td>
                      <td><b>{r.balance}</b> ⭐</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="admin-section roster-admin-section">
            <div className="roster-section-heading">
              <div>
                <h2>学生名册与组别分派</h2>
                <div className="section-sub">只限 Admin。可改名、转组、设组长、加入新生，或把离校学生归档后日后恢复；既有记录不会被删除。</div>
              </div>
              <div className="roster-capacity"><b>{activeRosterCount}</b> / {maxActiveStudents} 在籍</div>
            </div>

            <div className="roster-add-row">
              <input
                value={newStudentName}
                maxLength="80"
                placeholder="新生姓名 · Student name"
                onChange={e => setNewStudentName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addRosterStudent(); }}
              />
              <select value={newStudentTeamId} onChange={e => setNewStudentTeamId(e.target.value)}>
                {state.teams.map(team => <option key={team.id} value={team.id}>{team.zh}</option>)}
              </select>
              <button className="chunky-btn primary" type="button" onClick={addRosterStudent}>+ 加入学生</button>
            </div>
            <div className="roster-help">神兽乐园目前有 {maxActiveStudents} 只不同神兽，因此在籍名额保持 {maxActiveStudents} 位；先归档离校学生，才可加入新生。</div>
            {rosterNotice && <div className="roster-notice" role="status">{rosterNotice}</div>}

            <div className="roster-team-grid">
              {state.teams.map(team => {
                const activeMembers = EcoData.activeTeamMembers(state, team.id);
                const archivedMembers = EcoData.teamMembers(state, team.id, { includeArchived: true }).filter(member => member.active === false);
                return (
                  <section className="roster-team-card" key={team.id}>
                    <div className="roster-team-head">
                      <span className="table-team-cell"><TeamBadge team={team} size={32} /> <b>{team.zh}</b></span>
                      <span>{activeMembers.length} 位在籍</span>
                    </div>
                    <label className="roster-leader-control">
                      <span>组长 · Leader</span>
                      <select value={team.leaderId || ""} onChange={e => changeTeamLeader(team.id, e.target.value)} disabled={!activeMembers.length}>
                        {!activeMembers.length && <option value="">暂无在籍学生</option>}
                        {activeMembers.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                      </select>
                    </label>

                    <div className="roster-member-list">
                      {activeMembers.map(member => (
                        <div className="roster-student-row" key={member.id}>
                          <input
                            value={rosterNameDraft(member)}
                            aria-label={`${member.name} 的姓名`}
                            maxLength="80"
                            onChange={e => patchRosterName(member.id, e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") saveRosterName(member); }}
                          />
                          <select value={team.id} aria-label={`${member.name} 的组别`} onChange={e => moveRosterStudent(member, team, e.target.value)}>
                            {state.teams.map(option => <option key={option.id} value={option.id}>{option.zh}</option>)}
                          </select>
                          <div className="roster-row-actions">
                            <button className="chunky-btn small-btn" type="button" onClick={() => saveRosterName(member)}>保存</button>
                            <button className="chunky-btn roster-archive-btn" type="button" onClick={() => archiveRosterStudent(member)}>归档</button>
                          </div>
                        </div>
                      ))}
                      {!activeMembers.length && <div className="roster-empty">暂无在籍学生</div>}
                    </div>

                    {archivedMembers.length > 0 && (
                      <details className="roster-archive-list">
                        <summary>已归档 {archivedMembers.length} 位学生</summary>
                        {archivedMembers.map(member => (
                          <div className="roster-archived-row" key={member.id}>
                            <span>{member.name}</span>
                            <button className="chunky-btn small-btn" type="button" onClick={() => restoreRosterStudent(member, team)}>恢复</button>
                          </div>
                        ))}
                      </details>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        )}

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
          <div className="section-sub">这里按真实回收价 RM/kg 计算；改价后旧记录会按新价格重新计算价值。</div>
          <div className="cat-list">
            {state.categories.map(c => (
              <div className="cat-row compact-cat-row" key={c.id}>
                <div className="category-image" aria-hidden="true">
                  {c.imageSrc ? <img src={c.imageSrc} alt="" /> : <span>{c.icon}</span>}
                </div>
                <div className="name-stack">
                  <div className="static-text cat-name-primary">{c.zh}</div>
                  <div className="static-text cat-name-secondary">{c.ms}</div>
                </div>
                <div className="pts-input">
                  <input type="number" min="0" step="0.01" value={c.price} onChange={e => patchCat(c.id, {price: +e.target.value || 0})} />
                  <span className="unit">RM/kg</span>
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
                        <span className="result-team-name"><TeamBadge team={t} size={24} /> {t.zh}</span>
                        <b>{fmtRM(res.stats[t.id].points)}</b>
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

          <div className="threshold-box">
            <div className="threshold-label">
              <strong>🚩 红名单门槛 · Red-list threshold</strong>
              <small>累计没带 <b>{threshold}</b> 次 → 取消个人奖品资格</small>
            </div>
            {isAdmin ? (
              <div className="threshold-control">
                <div className="star-stepper">
                  <button type="button" onClick={() => changeThreshold(threshold - 1)} disabled={threshold <= 1}>−</button>
                  <input
                    type="number"
                    min="1"
                    value={threshold}
                    onChange={e => changeThreshold(e.target.value)}
                  />
                  <button type="button" onClick={() => changeThreshold(threshold + 1)}>+</button>
                </div>
                <small className="threshold-hint">改动立即生效，会重新计算所有学生的资格</small>
              </div>
            ) : (
              <small className="threshold-hint">只有 Admin 账号可以修改这个门槛</small>
            )}
          </div>

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
                    <td><span className="table-team-cell"><TeamBadge src={member.teamBadgeSrc} name={member.teamName} size={28} /> {member.teamName}</span></td>
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
window.StatBox = StatBox;
