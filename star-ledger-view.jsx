// Star Ledger View — quick-tap eco/character star awards with deduction-requires-reason flow.

function StarLedgerView({ state, setState }) {
  const { useState, useMemo } = React;

  const [teamId, setTeamId] = useState(state.teams[0]?.id || "");
  const [studentId, setStudentId] = useState("");
  const [starTypeId, setStarTypeId] = useState("eco_recycle");
  const [stars, setStars] = useState(1);
  const [reasonZh, setReasonZh] = useState("");
  const [reasonEn, setReasonEn] = useState("");

  const team = state.teams.find(t => t.id === teamId) || state.teams[0];
  const student = team?.members?.find(m => m.id === studentId);
  const starType = (state.starTypes || []).find(s => s.id === starTypeId);
  const report = useMemo(() => EcoData.studentStarReport(state), [state]);
  const recentLedger = useMemo(() => (state.starLedger || []).slice(0, 10), [state.starLedger]);

  function pickType(id) {
    setStarTypeId(id);
    const t = (state.starTypes || []).find(s => s.id === id);
    if (t) setStars(t.defaultStars);
  }

  function submit() {
    if (!student) { alert("请选择学生 · Please choose a student."); return; }
    const value = Number(stars) || 0;
    if (!value) { alert("星星数量不能是 0 · Stars cannot be 0."); return; }
    if (value < 0 && !reasonZh.trim() && !reasonEn.trim()) {
      alert("扣星必须填写原因 · Deduction requires a reason.");
      return;
    }
    const event = {
      id: "star_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      ts: Date.now(),
      studentId: student.id, studentName: student.name, teamId: team.id,
      starType: starTypeId,
      stars: value,
      reasonZh, reasonEn,
      evidenceType: "teacher_observation",
      referenceId: null,
      teacherId: "JBC9008",
    };
    const next = EcoData.addStarEvent(state, event);
    if (next === state) return;
    setState(next);
    setReasonZh(""); setReasonEn("");
    setStars(starType?.defaultStars || 1);
  }

  function undo(eventId) {
    if (!window.confirm("删除这条记录？\nDelete this record?")) return;
    setState(EcoData.removeStarEvent(state, eventId));
  }

  const isDeduction = (Number(stars) || 0) < 0 || starTypeId === "deduction";

  return (
    <div className="admin-view">
      <div className="admin-frame">
        <div style={{marginBottom:18, display:'flex', justifyContent:'center'}}>
          <SchoolStamp size={72} />
        </div>
        <div className="admin-header">
          <div>
            <h1>⭐ 环保星 <span style={{opacity:.6,fontSize:'0.7em'}}>· Eco Stars</span></h1>
            <div className="subtitle">记录环保行为、品格表现与校园贡献</div>
          </div>
        </div>

        <div className="admin-section star-quick-section">
          <h2>📝 新增星星 · New Star Record</h2>

          <div className="star-row">
            <label className="star-field">
              <span>组别 · Team</span>
              <select value={teamId} onChange={e => { setTeamId(e.target.value); setStudentId(""); }}>
                {state.teams.map(t => (
                  <option key={t.id} value={t.id}>{t.icon} {t.zh}</option>
                ))}
              </select>
            </label>
            <label className="star-field">
              <span>学生 · Student</span>
              <select value={studentId} onChange={e => setStudentId(e.target.value)}>
                <option value="">— 选择学生 · Choose —</option>
                {(team?.members || []).map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({EcoData.studentStarBalance(state, m.id)} ⭐)
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="star-types-grid">
            {(state.starTypes || []).map(t => (
              <button
                key={t.id}
                className={`star-type-chip ${starTypeId === t.id ? "active" : ""}`}
                onClick={() => pickType(t.id)}
              >
                <span className="star-type-icon">{t.icon}</span>
                <span className="star-type-zh">{t.zh}</span>
                <small>{t.en}</small>
              </button>
            ))}
          </div>

          <div className="star-row">
            <label className="star-field">
              <span>数量 · Stars {isDeduction && <em style={{color:'#C8341A'}}>(扣)</em>}</span>
              <div className="star-stepper">
                <button type="button" onClick={() => setStars(s => Number(s) - 1)}>−</button>
                <input
                  type="number"
                  value={stars}
                  onChange={e => setStars(e.target.value)}
                />
                <button type="button" onClick={() => setStars(s => Number(s) + 1)}>+</button>
              </div>
            </label>
          </div>

          <div className="star-row">
            <label className="star-field" style={{flex:1}}>
              <span>原因（中文）{isDeduction && <em style={{color:'#C8341A'}}>* 必填</em>}</span>
              <input
                placeholder={isDeduction ? "扣星原因 · Reason for deduction" : "例如：主动捡纸皮"}
                value={reasonZh}
                onChange={e => setReasonZh(e.target.value)}
              />
            </label>
            <label className="star-field" style={{flex:1}}>
              <span>Reason (English)</span>
              <input
                placeholder="e.g. picked up cardboard"
                value={reasonEn}
                onChange={e => setReasonEn(e.target.value)}
              />
            </label>
          </div>

          <button className="chunky-btn primary big-save-btn" onClick={submit}>
            💾 保存记录 · Save
          </button>
        </div>

        <div className="admin-section">
          <h2>🏆 学生星星余额 · Student Balances</h2>
          <div className="eligibility-table-wrap">
            <table className="log-table star-table">
              <thead>
                <tr><th>#</th><th>组别 · Team</th><th>姓名 · Name</th><th>余额 · Balance</th></tr>
              </thead>
              <tbody>
                {report.map((r, i) => (
                  <tr key={r.id} className={r.balance < 0 ? "row-negative" : ""}>
                    <td>{i + 1}</td>
                    <td>{r.teamIcon} {r.teamName}</td>
                    <td>{r.name}</td>
                    <td><b>{r.balance}</b> ⭐</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-section">
          <h2>🕒 最近记录 · Recent Records</h2>
          {recentLedger.length === 0 && <div className="ai-history-empty">暂无记录 · No records yet.</div>}
          <div className="star-history-list">
            {recentLedger.map(e => {
              const type = (state.starTypes || []).find(t => t.id === e.starType);
              return (
                <div key={e.id} className={`star-history-row ${e.stars < 0 ? "neg" : "pos"}`}>
                  <div className="star-history-icon">{type?.icon || "⭐"}</div>
                  <div className="star-history-body">
                    <div className="star-history-title">
                      {e.studentName} <span className="star-amt">{e.stars > 0 ? `+${e.stars}` : e.stars} ⭐</span>
                    </div>
                    <div className="star-history-meta">
                      {type?.zh || e.starType}
                      {e.reasonZh && <> · {e.reasonZh}</>}
                      <span style={{opacity:.55, marginLeft:6}}>{relTime(e.ts)} ago</span>
                    </div>
                  </div>
                  <button className="chunky-btn small-btn" onClick={() => undo(e.id)}>×</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

window.StarLedgerView = StarLedgerView;
