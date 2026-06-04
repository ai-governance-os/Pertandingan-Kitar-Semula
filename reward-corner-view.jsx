// Reward Corner - four reward tiers with grouped card ranges and editable stock.

function RewardCornerView({ state, setState, authed = true, requireAuth = (fn) => fn && fn() }) {
  const { useState, useMemo } = React;

  const [teamFilter, setTeamFilter] = useState("all");
  const [starModal, setStarModal] = useState(null);
  const [redeemFor, setRedeemFor] = useState(null);

  const categories = state.rewardCategories || EcoData.DEFAULT_REWARD_CATEGORIES;
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
          <p>奖卡按 A/B/C/D 等级兑换，老师可随时更新每级奖品和库存 · Reward tiers with editable stock</p>
        </div>

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
                    <button className="leader-btn add" onClick={() => openStarModal(row, "+")} title="加星 · Add stars">+</button>
                    <button className="leader-btn sub" onClick={() => openStarModal(row, "-")} title="扣星 · Deduct stars">−</button>
                    <button className="leader-btn redeem" onClick={() => openRedeem(row)} title="兑换 · Redeem">🎁</button>
                  </span>
                )}
              </div>
            ))}
            {filteredReport.length === 0 && (
              <div className="ai-history-empty">还没有学生记录 · No students.</div>
            )}
          </div>
        </div>

        <div className="entry-panel">
          <div className="panel-title">
            <strong>🎁 可换奖品 · Available Rewards</strong>
          </div>
          <div className="reward-tier-list">
            {categories.map(category => (
              <RewardTierSection
                key={category.id}
                category={category}
                items={(state.rewardItems || []).filter(i => i.active !== false && i.categoryId === category.id)}
              />
            ))}
          </div>
        </div>

        {authed && <RewardAdminPanel state={state} setState={setState} />}
      </div>

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

function RewardTierSection({ category, items }) {
  return (
    <section className="reward-tier" style={{'--tier-color': category.color, '--tier-tint': category.tint}}>
      <div className="reward-tier-head">
        <div className="reward-tier-badge">{category.level}</div>
        <div>
          <h2>{category.zh}</h2>
          <span>{category.en}</span>
        </div>
        <div className="reward-tier-range">
          {EcoData.rewardCategoryRangeLabel(category)} 张奖卡
          <small>Reward cards</small>
        </div>
      </div>
      <div className="reward-tier-grid">
        {items.map(item => <RewardDisplayCard key={item.id} item={item} />)}
        {items.length === 0 && (
          <div className="ai-history-empty" style={{gridColumn:'1 / -1'}}>这个等级还没有奖品 · No rewards in this tier.</div>
        )}
      </div>
    </section>
  );
}

function RewardDisplayCard({ item, asButton = false, disabled = false, onClick, warn }) {
  const Tag = asButton ? "button" : "div";
  return (
    <Tag
      type={asButton ? "button" : undefined}
      className={`reward-card tier-reward-card ${disabled ? "disabled redeem-pick" : ""}`}
      onClick={onClick}
      disabled={asButton ? disabled : undefined}
    >
      <div className="reward-photo-wrap">
        {item.imageUrl
          ? <img className="reward-photo" src={item.imageUrl} alt={item.nameZh || item.nameEn} />
          : <span className="reward-icon">{item.icon || "🎁"}</span>}
      </div>
      <div className="reward-name">
        <strong>{item.nameZh}</strong>
        <small>{item.nameEn}</small>
      </div>
      <div className="reward-stock">库存 · Stock: <b>{item.quantity}</b></div>
      {warn && <div className="redeem-warn">{warn}</div>}
    </Tag>
  );
}

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

function RedeemModal({ state, student, onCancel, onRedeem }) {
  const balance = EcoData.studentStarBalance(state, student.id);
  const categories = state.rewardCategories || EcoData.DEFAULT_REWARD_CATEGORIES;
  const activeItems = (state.rewardItems || []).filter(i => i.active !== false);

  return (
    <div className="login-modal-backdrop" onClick={onCancel}>
      <div className="star-modal reward-redeem-modal" onClick={e => e.stopPropagation()}>
        <button type="button" className="login-modal-close" onClick={onCancel} aria-label="Close">×</button>
        <h2 className="star-modal-title">
          🎁 {student.name} 兑换
          <small>现有 {balance} ⭐</small>
        </h2>

        <div className="reward-tier-list redeem-tier-list">
          {categories.map(category => {
            const items = activeItems.filter(i => i.categoryId === category.id);
            const qualified = balance >= (Number(category.minStars) || 0);
            return (
              <section className="reward-tier" key={category.id} style={{'--tier-color': category.color, '--tier-tint': category.tint}}>
                <div className="reward-tier-head compact">
                  <div className="reward-tier-badge">{category.level}</div>
                  <div>
                    <h2>{category.zh}</h2>
                    <span>{EcoData.rewardCategoryRangeLabel(category)} 张奖卡</span>
                  </div>
                </div>
                <div className="redeem-grid">
                  {items.map(item => {
                    const inStock = item.quantity > 0;
                    const disabled = !qualified || !inStock;
                    const warn = !inStock ? "库存不足" : (!qualified ? `需 ${category.minStars} ⭐` : "");
                    return (
                      <RewardDisplayCard
                        key={item.id}
                        item={item}
                        asButton={true}
                        disabled={disabled}
                        warn={warn}
                        onClick={() => onRedeem(item.id)}
                      />
                    );
                  })}
                  {items.length === 0 && <div className="ai-history-empty" style={{gridColumn:'1 / -1'}}>这个等级还没有奖品</div>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RewardAdminPanel({ state, setState }) {
  const { useState } = React;
  const [expanded, setExpanded] = useState(false);
  const [addingCategoryId, setAddingCategoryId] = useState("");
  const categories = state.rewardCategories || EcoData.DEFAULT_REWARD_CATEGORIES;

  function patch(id, patch) {
    setState(EcoData.updateRewardItem(state, id, patch));
  }

  function bumpQty(id, delta) {
    const item = (state.rewardItems || []).find(i => i.id === id);
    if (!item) return;
    patch(id, { quantity: Math.max(0, (item.quantity || 0) + delta) });
  }

  function deleteItem(id) {
    const item = (state.rewardItems || []).find(i => i.id === id);
    if (!item) return;
    if (!window.confirm(`删除「${item.nameZh}」？\nRemove "${item.nameEn}"?`)) return;
    setState(EcoData.removeRewardItem(state, id));
  }

  return (
    <div className="entry-panel">
      <div className="panel-title reward-admin-header" onClick={() => setExpanded(e => !e)}>
        <strong>🛠️ 管理奖品（老师）· Admin: manage rewards</strong>
        <button className="chunky-btn small-btn">{expanded ? "收起 ▲" : "展开 ▼"}</button>
      </div>

      {expanded && (
        <div className="reward-admin-wrap">
          <p className="reward-admin-tip">
            奖卡数量跟着 A/B/C/D 等级走；老师只需要更新每个等级里的奖品和库存。
          </p>

          <div className="reward-admin-tier-list">
            {categories.map(category => {
              const items = (state.rewardItems || []).filter(i => i.categoryId === category.id);
              const addingHere = addingCategoryId === category.id;
              return (
                <section className="reward-admin-tier" key={category.id} style={{'--tier-color': category.color, '--tier-tint': category.tint}}>
                  <div className="reward-admin-tier-head">
                    <div>
                      <b>{category.zh}</b>
                      <span>{EcoData.rewardCategoryRangeLabel(category)} 张奖卡 · {category.en}</span>
                    </div>
                    <button className="chunky-btn small-btn" onClick={(e) => { e.stopPropagation(); setAddingCategoryId(addingHere ? "" : category.id); }}>
                      {addingHere ? "取消" : "+ 新增"}
                    </button>
                  </div>

                  <div className="reward-edit-list">
                    {items.map(item => (
                      <RewardEditCard
                        key={item.id}
                        item={item}
                        onPatch={(p) => patch(item.id, p)}
                        onBumpQty={(d) => bumpQty(item.id, d)}
                        onDelete={() => deleteItem(item.id)}
                      />
                    ))}
                    {items.length === 0 && <div className="ai-history-empty">这个等级还没有奖品</div>}
                    {addingHere && (
                      <NewRewardForm
                        category={category}
                        onCancel={() => setAddingCategoryId("")}
                        onAdd={(data) => {
                          setState(EcoData.addRewardItem(state, data));
                          setAddingCategoryId("");
                        }}
                      />
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RewardEditCard({ item, onPatch, onBumpQty, onDelete }) {
  return (
    <div className="reward-edit-card tier-edit-card">
      <div className="reward-edit-row">
        <div className="reward-edit-photo">
          {item.imageUrl ? <img src={item.imageUrl} alt={item.nameZh || item.nameEn} /> : <span>{item.icon || "🎁"}</span>}
        </div>
        <div className="reward-edit-names">
          <input className="reward-edit-name-zh" value={item.nameZh} onChange={e => onPatch({ nameZh: e.target.value })} placeholder="中文名" />
          <input className="reward-edit-name-en" value={item.nameEn} onChange={e => onPatch({ nameEn: e.target.value })} placeholder="English name" />
          <input className="reward-edit-name-en" value={item.imageUrl || ""} onChange={e => onPatch({ imageUrl: e.target.value })} placeholder="图片路径 · Image path" />
        </div>
        <button className="reward-delete-btn" onClick={onDelete} title="删除 · Delete">🗑️</button>
      </div>

      <div className="reward-edit-row reward-edit-numbers">
        <label className="reward-edit-num">
          <span>📦 库存 · Stock</span>
          <div className="reward-edit-stepper">
            <button type="button" onClick={() => onBumpQty(-1)}>−</button>
            <input type="number" min="0" value={item.quantity} onChange={e => onPatch({ quantity: Math.max(0, Number(e.target.value) || 0) })} />
            <button type="button" onClick={() => onBumpQty(+1)}>+</button>
            <span className="reward-edit-unit">pcs</span>
          </div>
        </label>
      </div>
    </div>
  );
}

function NewRewardForm({ category, onAdd, onCancel }) {
  const { useState } = React;
  const [nameZh, setNameZh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [quantity, setQuantity] = useState(10);

  function submit() {
    if (!nameZh.trim()) { alert("请输入奖品中文名 · Enter a Chinese name."); return; }
    onAdd({
      categoryId: category.id,
      icon: category.level,
      imageUrl: imageUrl.trim(),
      nameZh: nameZh.trim(),
      nameEn: nameEn.trim() || nameZh.trim(),
      quantity: Number(quantity) || 0,
      purchaseCostRm: 0,
      active: true,
    });
  }

  return (
    <div className="reward-edit-card reward-new-card">
      <div className="reward-edit-row">
        <div className="reward-edit-photo new">{category.level}</div>
        <div className="reward-edit-names">
          <input className="reward-edit-name-zh" value={nameZh} onChange={e => setNameZh(e.target.value)} placeholder="中文名（必填）" autoFocus />
          <input className="reward-edit-name-en" value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="English name" />
          <input className="reward-edit-name-en" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="图片路径，可留空 · Image path" />
        </div>
      </div>

      <div className="reward-edit-row reward-edit-numbers">
        <label className="reward-edit-num">
          <span>📦 库存</span>
          <div className="reward-edit-stepper">
            <button type="button" onClick={() => setQuantity(q => Math.max(0, Number(q) - 1))}>−</button>
            <input type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} />
            <button type="button" onClick={() => setQuantity(q => Number(q) + 1)}>+</button>
            <span className="reward-edit-unit">pcs</span>
          </div>
        </label>
      </div>

      <div className="reward-new-actions">
        <button className="chunky-btn" onClick={onCancel}>取消 · Cancel</button>
        <button className="chunky-btn primary" onClick={submit}>✅ 加入这个等级 · Save</button>
      </div>
    </div>
  );
}

window.RewardCornerView = RewardCornerView;
