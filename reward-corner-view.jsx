// Reward Corner — public student leaderboard + gift list; admin can +/- stars and redeem.

function RewardCornerView({ state, setState, authed = true, requireAuth = (fn) => fn && fn() }) {
  const { useState, useMemo } = React;

  const [teamFilter, setTeamFilter] = useState("all");
  const [starModal, setStarModal] = useState(null);  // { student, direction: "+" | "-" }
  const [redeemFor, setRedeemFor] = useState(null);  // student id

  const report = useMemo(() => EcoData.studentStarReport(state), [state]);
  const filteredReport = teamFilter === "all"
    ? report
    : report.filter(s => s.teamId === teamFilter);

  function openStarModal(student, direction) {
    if (!requireAuth()) return;
    setStarModal({ student, direction });
  }

  function saveStar({ student, starTypeId, stars, reasonZh, reasonEn }) {
    const event = {
      id: "star_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      ts: Date.now(),
      studentId: student.id, studentName: student.name, teamId: student.teamId,
      starType: starTypeId, stars,
      reasonZh, reasonEn,
      evidenceType: "teacher_quickaward", referenceId: null, teacherId: "JBC9008",
    };
    const next = EcoData.addStarEvent(state, event);
    if (next === state) return false;
    setState(next);
    return true;
  }

  function openRedeem(student) {
    if (!requireAuth()) return;
    setRedeemFor(student);
  }

  function doRedeem(student, rewardItemId) {
    const next = EcoData.redeemReward(state, {
      studentId: student.id,
      studentName: student.name,
      teamId: student.teamId,
      rewardItemId,
      teacherId: "JBC9008",
    });
    if (next === state) return false;
    setState(next);
    return true;
  }

  return (
    <div className="mobile-view teacher-entry">
      <div className="mobile-frame teacher-frame reward-frame">
        <div style={{display:'flex', justifyContent:'center', marginBottom:10}}>
          <SchoolStamp size={64} />
        </div>
        <div className="mobile-header compact">
          <h1>🎁 奖品角落 <span style={{opacity:.6, fontSize:'0.7em'}}>· Rewards</span></h1>
          <p>环保 + 学业 + 品格 = 累积 ⭐ → 换礼物 · Eco + academic + character → stars → rewards</p>
        </div>

        {/* Star Leaderboard */}
        <div className="entry-panel">
          <div className="panel-title" style={{marginBottom:10}}>
            <strong>🏆 学生星星排行 · Star Leaderboard</strong>
          </div>

          <div className="team-tabs">
            <button
              className={`team-tab ${teamFilter === "all" ? "active" : ""}`}
              onClick={() => setTeamFilter("all")}
            >
              全部 · All ({report.length})
            </button>
            {state.teams.map(t => {
              const count = report.filter(r => r.teamId === t.id).length;
              return (
                <button
                  key={t.id}
                  className={`team-tab ${teamFilter === t.id ? "active" : ""}`}
                  onClick={() => setTeamFilter(t.id)}
                  style={{borderColor: teamFilter === t.id ? t.primary : undefined}}
                >
                  {t.icon} {t.zh} ({count})
                </button>
              );
            })}
          </div>

          <div className="leaderboard-list">
            {filteredReport.map((row, i) => (
              <div className="leader-row" key={row.id}>
                <span className="leader-rank">#{i + 1}</span>
                <span className="leader-team">{row.teamIcon}</span>
                <span className="leader-name">{row.name}</span>
                <span className="leader-balance">
                  <b>{row.balance}</b> ⭐
                </span>
                {authed && (
                  <span className="leader-actions">
                    <button
                      className="leader-btn add"
                      onClick={() => openStarModal(row, "+")}
                      title="加星 · Add stars"
                    >+</button>
                    <button
                      className="leader-btn sub"
                      onClick={() => openStarModal(row, "-")}
                      title="扣星 · Deduct stars"
                    >−</button>
                    <button
                      className="leader-btn redeem"
                      onClick={() => openRedeem(row)}
                      title="兑换 · Redeem"
                    >🎁</button>
                  </span>
                )}
              </div>
            ))}
            {filteredReport.length === 0 && (
              <div className="ai-history-empty">还没有学生记录 · No students.</div>
            )}
          </div>
        </div>

        {/* Gift Inventory */}
        <div className="entry-panel">
          <div className="panel-title">
            <strong>🎁 可换礼物 · Available Rewards</strong>
          </div>
          <div className="reward-grid">
            {(state.rewardItems || []).filter(i => i.active !== false).map(item => (
              <div className="reward-card" key={item.id}>
                <div className="reward-icon">{item.icon || "🎁"}</div>
                <div className="reward-name">
                  <strong>{item.nameZh}</strong>
                  <small>{item.nameEn}</small>
                </div>
                <div className="reward-cost">{item.starCost} ⭐</div>
                <div className="reward-stock">
                  库存 · Stock: <b>{item.quantity}</b>
                </div>
              </div>
            ))}
            {(state.rewardItems || []).length === 0 && (
              <div className="ai-history-empty" style={{gridColumn: '1 / -1'}}>
                还没有奖品 · No rewards yet.
              </div>
            )}
          </div>
        </div>

        {/* Admin: add gift + manage inventory */}
        {authed && <RewardAdminPanel state={state} setState={setState} />}
      </div>

      {/* Star award modal */}
      {starModal && (
        <StarAwardModal
          state={state}
          student={starModal.student}
          direction={starModal.direction}
          onCancel={() => setStarModal(null)}
          onSave={(payload) => {
            const ok = saveStar(payload);
            if (ok) setStarModal(null);
          }}
        />
      )}

      {/* Redemption modal */}
      {redeemFor && (
        <RedeemModal
          state={state}
          student={redeemFor}
          onCancel={() => setRedeemFor(null)}
          onRedeem={(itemId) => {
            const ok = doRedeem(redeemFor, itemId);
            if (ok) setRedeemFor(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────── Star Award Modal ───────────────────────────

function StarAwardModal({ state, student, direction, onCancel, onSave }) {
  const { useState } = React;
  const isDeduction = direction === "-";

  const allTypes = state.starTypes || [];
  const usableTypes = isDeduction
    ? allTypes.filter(t => t.id === "deduction" || t.group === "deduction")
    : allTypes.filter(t => t.group !== "deduction");

  const groups = isDeduction ? ["deduction"] : ["eco", "character"];
  const groupLabels = EcoData.STAR_GROUP_LABELS || {
    eco: { zh: "🌱 环保" }, character: { zh: "📚 学业品格" }, deduction: { zh: "⚠️ 扣星" },
  };

  const [starTypeId, setStarTypeId] = useState(
    isDeduction ? "deduction" : (usableTypes.find(t => t.group === "eco")?.id || usableTypes[0]?.id || "")
  );
  const [stars, setStars] = useState(() => {
    const t = usableTypes.find(x => x.id === starTypeId);
    return Math.abs(t?.defaultStars || 1) * (isDeduction ? -1 : 1);
  });
  const [reasonZh, setReasonZh] = useState("");
  const [reasonEn, setReasonEn] = useState("");

  function pickType(id) {
    setStarTypeId(id);
    const t = usableTypes.find(x => x.id === id);
    if (t) setStars(Math.abs(t.defaultStars || 1) * (isDeduction ? -1 : 1));
  }

  function submit(e) {
    e.preventDefault();
    const value = Number(stars) || 0;
    if (!value) { alert("数量不能是 0 · Stars cannot be 0."); return; }
    if (isDeduction && !reasonZh.trim() && !reasonEn.trim()) {
      alert("扣星必须填原因 · Deduction requires a reason."); return;
    }
    onSave({ student, starTypeId, stars: value, reasonZh, reasonEn });
  }

  return (
    <div className="login-modal-backdrop" onClick={onCancel}>
      <form className="star-modal" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <button type="button" className="login-modal-close" onClick={onCancel} aria-label="Close">×</button>
        <h2 className="star-modal-title">
          {isDeduction ? "− 扣星" : "+ 加星"} · {student.name}
          <small>{student.teamName} · 现有 {EcoData.studentStarBalance(state, student.id)} ⭐</small>
        </h2>

        <div className="star-modal-groups">
          {groups.map(gid => (
            <div className="star-modal-group" key={gid}>
              <div className="star-modal-group-label">{groupLabels[gid]?.zh}</div>
              <div className="star-types-grid star-modal-grid">
                {usableTypes.filter(t => (t.group || "character") === gid).map(t => (
                  <button
                    type="button"
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
            </div>
          ))}
        </div>

        <div className="star-modal-row">
          <label className="star-field" style={{flex:'0 0 auto'}}>
            <span>数量 · Stars</span>
            <div className="star-stepper">
              <button type="button" onClick={() => setStars(s => Number(s) - 1)}>−</button>
              <input type="number" value={stars} onChange={e => setStars(e.target.value)} />
              <button type="button" onClick={() => setStars(s => Number(s) + 1)}>+</button>
            </div>
          </label>
        </div>

        <div className="star-modal-row">
          <label className="star-field" style={{flex:1}}>
            <span>原因（中文）{isDeduction && <em style={{color:'#C8341A'}}>* 必填</em>}</span>
            <input
              placeholder={isDeduction ? "扣星原因" : "例如：主动捡纸皮"}
              value={reasonZh}
              onChange={e => setReasonZh(e.target.value)}
              autoFocus
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

        <button type="submit" className="chunky-btn primary big-save-btn" style={{marginTop:6}}>
          {isDeduction ? `− 扣 ${Math.abs(stars)} ⭐` : `+ 加 ${stars} ⭐`}
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────── Redemption Modal ───────────────────────────

function RedeemModal({ state, student, onCancel, onRedeem }) {
  const balance = EcoData.studentStarBalance(state, student.id);
  const items = (state.rewardItems || []).filter(i => i.active !== false);

  return (
    <div className="login-modal-backdrop" onClick={onCancel}>
      <div className="star-modal" onClick={e => e.stopPropagation()}>
        <button type="button" className="login-modal-close" onClick={onCancel} aria-label="Close">×</button>
        <h2 className="star-modal-title">
          🎁 {student.name} 兑换
          <small>现有 {balance} ⭐</small>
        </h2>

        <div className="redeem-grid">
          {items.map(item => {
            const affordable = balance >= item.starCost;
            const inStock = item.quantity > 0;
            const disabled = !affordable || !inStock;
            return (
              <button
                type="button"
                key={item.id}
                className={`reward-card redeem-pick ${disabled ? "disabled" : ""}`}
                onClick={() => onRedeem(item.id)}
                disabled={disabled}
                title={!inStock ? "库存不足" : (!affordable ? "星星不足" : "")}
              >
                <div className="reward-icon">{item.icon || "🎁"}</div>
                <div className="reward-name">
                  <strong>{item.nameZh}</strong>
                  <small>{item.nameEn}</small>
                </div>
                <div className="reward-cost">{item.starCost} ⭐</div>
                <div className="reward-stock">库存 {item.quantity}</div>
                {!affordable && <div className="redeem-warn">星星不足</div>}
                {!inStock && <div className="redeem-warn">库存不足</div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Admin Panel: manage gifts ───────────────────────────

function RewardAdminPanel({ state, setState }) {
  const { useState } = React;
  const [newName, setNewName] = useState("");
  const [newEn, setNewEn] = useState("");
  const [newCost, setNewCost] = useState(10);
  const [newQty, setNewQty] = useState(10);
  const [newIcon, setNewIcon] = useState("🎁");
  const [expanded, setExpanded] = useState(false);

  function addItem() {
    if (!newName.trim()) { alert("请输入奖品名称 · Enter a reward name."); return; }
    setState(EcoData.addRewardItem(state, {
      icon: newIcon || "🎁",
      nameZh: newName.trim(),
      nameEn: newEn.trim() || newName.trim(),
      starCost: Number(newCost) || 1,
      quantity: Number(newQty) || 0,
      purchaseCostRm: 0,
      active: true,
    }));
    setNewName(""); setNewEn(""); setNewCost(10); setNewQty(10); setNewIcon("🎁");
  }

  function bumpQty(id, delta) {
    const item = (state.rewardItems || []).find(i => i.id === id);
    if (!item) return;
    setState(EcoData.updateRewardItem(state, id, { quantity: Math.max(0, (item.quantity || 0) + delta) }));
  }

  function deleteItem(id) {
    if (!window.confirm("删除这个奖品？\nRemove this reward?")) return;
    setState(EcoData.removeRewardItem(state, id));
  }

  return (
    <div className="entry-panel">
      <div
        className="panel-title"
        style={{display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer'}}
        onClick={() => setExpanded(e => !e)}
      >
        <strong>🛠️ 管理奖品（老师）· Admin: manage rewards</strong>
        <button className="chunky-btn small-btn">{expanded ? "收起" : "展开"}</button>
      </div>

      {expanded && (
        <>
          <div className="reward-admin-list">
            {(state.rewardItems || []).map(item => (
              <div className="reward-admin-row" key={item.id}>
                <span className="reward-admin-icon">{item.icon}</span>
                <span className="reward-admin-name">
                  {item.nameZh} <small>· {item.nameEn}</small>
                </span>
                <span className="reward-admin-cost">{item.starCost} ⭐</span>
                <span className="reward-admin-qty">
                  <button className="leader-btn sub" onClick={() => bumpQty(item.id, -1)}>−</button>
                  <b>{item.quantity}</b>
                  <button className="leader-btn add" onClick={() => bumpQty(item.id, +1)}>+</button>
                </span>
                <button className="leader-btn sub" onClick={() => deleteItem(item.id)} title="删除">×</button>
              </div>
            ))}
          </div>

          <div className="reward-add-row" style={{marginTop:14}}>
            <input style={{maxWidth:60}} placeholder="🎁" value={newIcon} onChange={e => setNewIcon(e.target.value)} />
            <input placeholder="中文名" value={newName} onChange={e => setNewName(e.target.value)} />
            <input placeholder="English name" value={newEn} onChange={e => setNewEn(e.target.value)} />
            <input type="number" placeholder="星星" value={newCost} onChange={e => setNewCost(e.target.value)} />
            <input type="number" placeholder="数量" value={newQty} onChange={e => setNewQty(e.target.value)} />
            <button className="chunky-btn primary" onClick={addItem}>➕ 新增</button>
          </div>
        </>
      )}
    </div>
  );
}

window.RewardCornerView = RewardCornerView;
