// 宠物园 · Eco Pets — public wall of every student's pet.
// Growth and hunger are derived from the star ledger (see data.js petState),
// so this screen is read-only for everyone; teachers only get species/nickname
// tools, never a way to hand out growth directly.

function PetGardenView({ state, setState, authed = false, requireAuth = (fn) => fn && fn() }) {
  const { useState, useMemo } = React;

  const [teamFilter, setTeamFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  const report = useMemo(() => EcoData.petReport(state), [state]);
  const filtered = teamFilter === "all" ? report : report.filter(r => r.teamId === teamFilter);
  const selected = selectedId ? report.find(r => r.id === selectedId) : null;

  const hungryCount = report.filter(r => r.pet.hunger.key === "hungry" || r.pet.hunger.key === "starving").length;
  const legendCount = report.filter(r => r.pet.isMaxStage).length;

  return (
    <div className="mobile-view teacher-entry">
      <div className="mobile-frame teacher-frame pet-frame">
        <div style={{display:'flex', justifyContent:'center', marginBottom:10}}>
          <SchoolStamp size={64} />
        </div>
        <div className="mobile-header compact">
          <h1>🐾 宠物园 <span style={{opacity:.6, fontSize:'0.7em'}}>· Eco Pets</span></h1>
          <p>做环保、拿星星 → 宠物就会长大 · Earn stars, your pet grows</p>
        </div>

        <div className="pet-rule-note">
          🍽️ 宠物会自动吃你赚到的星星 —— <b>换礼物不会让宠物变小</b>。
          太久没有新星星，宠物会饿哦！
        </div>

        <div className="pet-summary">
          <div className="pet-summary-item">
            <b>{report.length}</b><span>只宠物</span>
          </div>
          <div className="pet-summary-item">
            <b>{legendCount}</b><span>传说 ✨</span>
          </div>
          <div className={`pet-summary-item ${hungryCount > 0 ? "warn" : ""}`}>
            <b>{hungryCount}</b><span>肚子饿 😟</span>
          </div>
        </div>

        <div className="team-tabs">
          <button
            className={`team-tab ${teamFilter === "all" ? "active" : ""}`}
            onClick={() => setTeamFilter("all")}
          >
            全部 · All ({report.length})
          </button>
          {state.teams.map(t => (
            <button
              key={t.id}
              className={`team-tab ${teamFilter === t.id ? "active" : ""}`}
              onClick={() => setTeamFilter(t.id)}
              style={{borderColor: teamFilter === t.id ? t.primary : undefined}}
            >
              {t.icon} {t.zh} ({report.filter(r => r.teamId === t.id).length})
            </button>
          ))}
        </div>

        <div className="pet-grid">
          {filtered.map(row => (
            <PetCard key={row.id} row={row} onClick={() => setSelectedId(row.id)} />
          ))}
          {filtered.length === 0 && (
            <div className="ai-history-empty" style={{gridColumn:'1 / -1'}}>还没有学生记录 · No students.</div>
          )}
        </div>
      </div>

      {selected && (
        <PetDetailModal
          state={state}
          setState={setState}
          row={selected}
          authed={authed}
          requireAuth={requireAuth}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function PetCard({ row, onClick }) {
  const p = row.pet;
  return (
    <button
      className={`pet-card hunger-${p.hunger.key} ${p.isMaxStage ? "is-legend" : ""}`}
      onClick={onClick}
      style={{'--team-color': row.teamColor}}
    >
      <div className="pet-avatar">
        <span className="pet-emoji">{p.icon}</span>
        {p.isMaxStage && <span className="pet-badge-legend">✨</span>}
        <span className="pet-mood">{p.hunger.icon}</span>
      </div>
      <div className="pet-name">
        {p.nickname || row.name.split(" ").slice(-1)[0]}
      </div>
      <div className="pet-stage-label">
        {row.teamIcon} {p.stage.zh}
        {p.isRegressed && <span className="pet-regress-tag">虚弱</span>}
      </div>
      <div className="pet-bar">
        <div className="pet-bar-fill" style={{width: `${Math.round(p.stageProgress * 100)}%`}} />
      </div>
      <div className="pet-exp">{p.exp} ⭐</div>
    </button>
  );
}

function PetDetailModal({ state, setState, row, authed, requireAuth, onClose }) {
  const p = row.pet;

  function changeSpecies() {
    if (!requireAuth()) return;
    const names = EcoData.PET_SPECIES.map((s, i) => `${i + 1}. ${s.stages[3]} ${s.zh}`).join("\n");
    const answer = window.prompt(
      `帮 ${row.name} 换一只宠物？输入编号：\nPick a species for ${row.name}:\n\n${names}`,
      String(EcoData.PET_SPECIES.findIndex(s => s.id === p.species.id) + 1)
    );
    if (answer === null) return;
    const index = Number(answer) - 1;
    const picked = EcoData.PET_SPECIES[index];
    if (!picked) { alert("编号不对 · Invalid number"); return; }
    setState(EcoData.setPetSpecies(state, row.id, picked.id));
  }

  function rename() {
    if (!requireAuth()) return;
    const answer = window.prompt(
      `给 ${row.name} 的宠物取名字（留空 = 用学生名字）：\nPet nickname:`,
      p.nickname || ""
    );
    if (answer === null) return;
    setState(EcoData.setPetNickname(state, row.id, answer.trim()));
  }

  const hungerHint = p.neverFed
    ? "还没有拿过星星，蛋还没孵化 · No stars yet — the egg hasn't hatched"
    : p.daysSinceFed === 0
      ? "今天刚吃过 · Fed today"
      : `已经 ${p.daysSinceFed} 天没有新星星 · ${p.daysSinceFed} day(s) without a new star`;

  return (
    <div className="login-modal-backdrop" onClick={onClose}>
      <div className="star-modal pet-modal" onClick={e => e.stopPropagation()}>
        <button type="button" className="login-modal-close" onClick={onClose} aria-label="Close">×</button>

        <div className={`pet-modal-hero hunger-${p.hunger.key}`}>
          <span className="pet-modal-emoji">{p.icon}</span>
          {p.isMaxStage && <span className="pet-badge-legend big">✨</span>}
        </div>

        <h2 className="star-modal-title" style={{textAlign:'center'}}>
          {p.nickname || `${row.name} 的宠物`}
          <small>{row.teamIcon} {row.teamName} · {p.species.zh} · {p.stage.zh}</small>
        </h2>

        <div className="pet-modal-stats">
          <div className="pet-stat">
            <b>{p.exp}</b><span>成长值 ⭐</span>
          </div>
          <div className="pet-stat">
            <b>{p.hunger.icon}</b><span>{p.hunger.zh}</span>
          </div>
          <div className="pet-stat">
            <b>{p.stageIndex + 1}/{EcoData.PET_STAGES.length}</b><span>进化阶段</span>
          </div>
        </div>

        <div className="pet-progress-block">
          {p.isMaxStage ? (
            <div className="pet-next-note">🏆 已经是最终形态 · Fully evolved!</div>
          ) : (
            <>
              <div className="pet-bar big">
                <div className="pet-bar-fill" style={{width: `${Math.round(p.stageProgress * 100)}%`}} />
              </div>
              <div className="pet-next-note">
                再赚 <b>{p.expToNext} ⭐</b> 就进化成「{p.nextStage.zh}」
                <br/><span>{p.expToNext} more star(s) to evolve</span>
              </div>
            </>
          )}
        </div>

        <div className={`pet-hunger-note ${p.hunger.key}`}>
          {p.hunger.icon} {hungerHint}
          {p.isRegressed && (
            <div className="pet-regress-note">
              ⚠️ 太久没吃，宠物虚弱了，外表退回上一阶段。<br/>
              <b>成长值没有减少 —— 拿到新星星马上恢复！</b>
            </div>
          )}
        </div>

        {authed && (
          <div className="pet-admin-row">
            <button className="chunky-btn small-btn" onClick={changeSpecies}>🔄 换宠物</button>
            <button className="chunky-btn small-btn" onClick={rename}>✏️ 改名字</button>
          </div>
        )}
      </div>
    </div>
  );
}

window.PetGardenView = PetGardenView;
