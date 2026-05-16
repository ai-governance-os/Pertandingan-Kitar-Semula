// Reward Corner — fund tracker, inventory management, and star-based redemption.

function RewardCornerView({ state, setState }) {
  const { useState, useMemo } = React;

  const [redeemTeamId, setRedeemTeamId] = useState(state.teams[0]?.id || "");
  const [redeemStudentId, setRedeemStudentId] = useState("");
  const [redeemItemId, setRedeemItemId] = useState((state.rewardItems || [])[0]?.id || "");

  const [newName, setNewName] = useState("");
  const [newEn, setNewEn] = useState("");
  const [newCost, setNewCost] = useState(10);
  const [newQty, setNewQty] = useState(10);
  const [newPrice, setNewPrice] = useState(5);
  const [newIcon, setNewIcon] = useState("🎁");

  const [fundAmount, setFundAmount] = useState(0);
  const [fundNote, setFundNote] = useState("");
  const [fundType, setFundType] = useState("topup");

  const fund = useMemo(() => EcoData.rewardFundStats(state), [state]);
  const team = state.teams.find(t => t.id === redeemTeamId) || state.teams[0];
  const student = team?.members?.find(m => m.id === redeemStudentId);
  const recentRedemptions = useMemo(() => (state.rewardRedemptions || []).slice(0, 10), [state.rewardRedemptions]);

  function redeem() {
    if (!student) { alert("请选择学生 · Pick a student first."); return; }
    if (!redeemItemId) { alert("请选择奖品 · Pick a reward."); return; }
    const next = EcoData.redeemReward(state, {
      studentId: student.id,
      studentName: student.name,
      teamId: team.id,
      rewardItemId: redeemItemId,
      teacherId: "JBC9008",
    });
    if (next === state) return;
    setState(next);
    const item = (state.rewardItems || []).find(i => i.id === redeemItemId);
    alert(`🎁 ${student.name} 兑换了 ${item?.nameZh || ""} (-${item?.starCost || 0} ⭐)`);
  }

  function addItem() {
    if (!newName.trim()) { alert("请输入奖品名称 · Enter a reward name."); return; }
    setState(EcoData.addRewardItem(state, {
      icon: newIcon || "🎁",
      nameZh: newName.trim(),
      nameEn: newEn.trim() || newName.trim(),
      starCost: Number(newCost) || 1,
      quantity: Number(newQty) || 0,
      purchaseCostRm: Number(newPrice) || 0,
      active: true,
    }));
    setNewName(""); setNewEn(""); setNewCost(10); setNewQty(10); setNewPrice(5); setNewIcon("🎁");
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

  function logFund() {
    const amt = Number(fundAmount) || 0;
    if (!amt) { alert("金额不能是 0 · Amount cannot be 0."); return; }
    const signed = fundType === "purchase" ? -Math.abs(amt) : Math.abs(amt);
    setState(EcoData.addFundEvent(state, {
      type: fundType,
      amountRm: signed,
      note: fundNote,
      teacherId: "JBC9008",
    }));
    setFundAmount(0); setFundNote("");
  }

  return (
    <div className="admin-view">
      <div className="admin-frame">
        <div style={{marginBottom:18, display:'flex', justifyContent:'center'}}>
          <SchoolStamp size={72} />
        </div>
        <div className="admin-header">
          <div>
            <h1>🎁 奖励角落 <span style={{opacity:.6,fontSize:'0.7em'}}>· Reward Corner</span></h1>
            <div className="subtitle">回收价值 → 奖品资源 → 学生兑换</div>
          </div>
        </div>

        <div className="admin-section">
          <h2>💰 基金概况 · Fund Overview</h2>
          <div className="admin-stat-grid">
            <StatBox label="回收估值" sub="Recycle value" value={fmt(fund.recycleValueRm || 0, 2)} unit="RM" color="var(--eco-deep)" />
            <StatBox label="奖品支出" sub="Reward spend" value={fmt(fund.rewardCostRm || 0, 2)} unit="RM" color="#C8341A" />
            <StatBox label="估计余额" sub="Balance" value={fmt(fund.estimatedBalanceRm || 0, 2)} unit="RM" color="#2EC4B6" />
          </div>
          <div className="fund-form">
            <select value={fundType} onChange={e => setFundType(e.target.value)}>
              <option value="topup">💵 收入 · Income</option>
              <option value="purchase">🛒 采购支出 · Purchase</option>
              <option value="donation">🎁 捐赠 · Donation</option>
            </select>
            <input
              type="number"
              placeholder="RM"
              value={fundAmount}
              onChange={e => setFundAmount(e.target.value)}
            />
            <input
              placeholder="说明 · Note"
              value={fundNote}
              onChange={e => setFundNote(e.target.value)}
            />
            <button className="chunky-btn primary" onClick={logFund}>记录 · Log</button>
          </div>
        </div>

        <div className="admin-section redeem-section">
          <h2>✨ 兑换奖品 · Redeem</h2>
          <div className="redeem-row">
            <select value={redeemTeamId} onChange={e => { setRedeemTeamId(e.target.value); setRedeemStudentId(""); }}>
              {state.teams.map(t => <option key={t.id} value={t.id}>{t.icon} {t.zh}</option>)}
            </select>
            <select value={redeemStudentId} onChange={e => setRedeemStudentId(e.target.value)}>
              <option value="">— 选择学生 · Choose —</option>
              {(team?.members || []).map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({EcoData.studentStarBalance(state, m.id)} ⭐)
                </option>
              ))}
            </select>
            <select value={redeemItemId} onChange={e => setRedeemItemId(e.target.value)}>
              {(state.rewardItems || []).filter(i => i.active !== false).map(i => (
                <option key={i.id} value={i.id}>
                  {i.icon || "🎁"} {i.nameZh} ({i.starCost} ⭐ · 库存 {i.quantity})
                </option>
              ))}
            </select>
            <button className="chunky-btn primary big-redeem-btn" onClick={redeem} disabled={!student}>
              🎁 立即兑换 · Redeem
            </button>
          </div>
          {student && (
            <div className="redeem-balance">
              {student.name} 现有 <b>{EcoData.studentStarBalance(state, student.id)}</b> ⭐
            </div>
          )}
        </div>

        <div className="admin-section">
          <h2>🛍️ 奖品库存 · Reward Inventory</h2>
          <div className="reward-grid">
            {(state.rewardItems || []).map(item => (
              <div className="reward-card" key={item.id}>
                <div className="reward-icon">{item.icon || "🎁"}</div>
                <div className="reward-name">
                  <strong>{item.nameZh}</strong>
                  <small>{item.nameEn}</small>
                </div>
                <div className="reward-cost">{item.starCost} ⭐</div>
                <div className="reward-qty-row">
                  <button className="chunky-btn small-btn" onClick={() => bumpQty(item.id, -1)}>−</button>
                  <span><b>{item.quantity}</b> pcs</span>
                  <button className="chunky-btn small-btn" onClick={() => bumpQty(item.id, 1)}>+</button>
                </div>
                <button className="chunky-btn small-btn reward-delete" onClick={() => deleteItem(item.id)}>删除</button>
              </div>
            ))}
          </div>

          <h3 style={{marginTop:24}}>➕ 新增奖品 · Add Reward</h3>
          <div className="reward-add-row">
            <input style={{maxWidth:60}} placeholder="🎁" value={newIcon} onChange={e => setNewIcon(e.target.value)} />
            <input placeholder="中文名" value={newName} onChange={e => setNewName(e.target.value)} />
            <input placeholder="English name" value={newEn} onChange={e => setNewEn(e.target.value)} />
            <input type="number" placeholder="星星 ⭐" value={newCost} onChange={e => setNewCost(e.target.value)} />
            <input type="number" placeholder="数量" value={newQty} onChange={e => setNewQty(e.target.value)} />
            <input type="number" placeholder="单价 RM" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
            <button className="chunky-btn primary" onClick={addItem}>新增 · Add</button>
          </div>
        </div>

        <div className="admin-section">
          <h2>📜 最近兑换 · Recent Redemptions</h2>
          {recentRedemptions.length === 0 && <div className="ai-history-empty">暂无兑换 · No redemptions yet.</div>}
          <div className="star-history-list">
            {recentRedemptions.map(r => (
              <div key={r.id} className="star-history-row pos">
                <div className="star-history-icon">🎁</div>
                <div className="star-history-body">
                  <div className="star-history-title">
                    {r.studentName} <span className="star-amt">−{r.starsSpent} ⭐</span>
                  </div>
                  <div className="star-history-meta">
                    {r.rewardNameZh} · {r.rewardNameEn}
                    <span style={{opacity:.55, marginLeft:6}}>{relTime(r.ts)} ago</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.RewardCornerView = RewardCornerView;
