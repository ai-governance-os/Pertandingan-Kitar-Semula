// Eco Loop Dashboard — visualises the closed-loop sustainability flow.
// Waste → RM → Rewards → Behaviour → More sustainability.

function EcoLoopDashboard({ state }) {
  const { useMemo } = React;
  const stats = useMemo(() => EcoData.ecoLoopStats(state), [state]);
  const fund = stats.fund || {};
  const teamRanking = useMemo(() => {
    return state.teams.map(t => ({
      id: t.id, zh: t.zh, icon: t.icon, primary: t.primary,
      stars: EcoData.teamStarStats(state, t.id).stars,
      kg: EcoData.teamStats(state, t.id).kg,
    })).sort((a, b) => b.stars - a.stars);
  }, [state]);
  const topStudents = useMemo(() => EcoData.studentStarReport(state).slice(0, 5), [state]);

  return (
    <div className="status-view">
      <div className="status-frame">
        <div className="status-identity">
          <SchoolStamp size={72} />
        </div>
        <header className="status-header">
          <div>
            <h1>🔁 永续闭环 <span style={{opacity:.6,fontSize:'0.6em'}}>· Sustainability Loop</span></h1>
            <p>Waste → RM → Rewards → Behaviour → Sustainability</p>
          </div>
          <div className="status-pill">AI + Eco Stars</div>
        </header>

        <section className="status-score-grid">
          <StatBox label="总回收重量" sub="Total recycled" value={fmt(stats.totalRecycledKg, 2)} unit="kg" color="var(--eco-deep)" />
          <StatBox label="回收估值" sub="Recycle value" value={fmt(stats.totalRecycleValueRm, 2)} unit="RM" color="#2EC4B6" />
          <StatBox label="基金余额" sub="Fund balance" value={fmt(fund.estimatedBalanceRm || 0, 2)} unit="RM" color="#FFB400" />
          <StatBox label="AI 扫描" sub="AI scans" value={stats.aiScanCount} unit="次" color="#FF6B35" />
          <StatBox label="环保星已奖" sub="Stars awarded" value={stats.starsAwarded} unit="⭐" color="#FFC93C" />
          <StatBox label="兑换次数" sub="Redemptions" value={stats.rewardRedemptionCount} unit="次" color="#88E5FF" />
        </section>

        <section className="status-panel eco-loop-flow">
          <h2>♻️ 行为闭环 · The Loop</h2>
          <div className="loop-chain">
            <div className="loop-node">
              <div className="loop-icon">🗑️</div>
              <div className="loop-label">学生带回收物<small>Students bring recyclables</small></div>
              <div className="loop-value">{fmt(stats.totalRecycledKg, 1)} kg</div>
            </div>
            <div className="loop-arrow">→</div>
            <div className="loop-node">
              <div className="loop-icon">💰</div>
              <div className="loop-label">变成资金<small>Becomes funds</small></div>
              <div className="loop-value">RM {fmt(stats.totalRecycleValueRm, 2)}</div>
            </div>
            <div className="loop-arrow">→</div>
            <div className="loop-node">
              <div className="loop-icon">🎁</div>
              <div className="loop-label">采购奖品<small>Purchase rewards</small></div>
              <div className="loop-value">{(state.rewardItems || []).reduce((s, i) => s + (i.quantity || 0), 0)} 件</div>
            </div>
            <div className="loop-arrow">→</div>
            <div className="loop-node">
              <div className="loop-icon">⭐</div>
              <div className="loop-label">学生用星星换<small>Students redeem stars</small></div>
              <div className="loop-value">{stats.rewardRedemptionCount} 次</div>
            </div>
            <div className="loop-arrow">↻</div>
            <div className="loop-node">
              <div className="loop-icon">🌱</div>
              <div className="loop-label">更多正向行为<small>More eco action</small></div>
              <div className="loop-value">{stats.starsAwarded} ⭐</div>
            </div>
          </div>
        </section>

        <section className="status-panel">
          <h2>🏆 组别排行 · Team Ranking (by ⭐)</h2>
          <div className="loop-team-list">
            {teamRanking.map((t, i) => (
              <div key={t.id} className="loop-team-row" style={{borderLeftColor: t.primary}}>
                <span className="loop-team-rank">#{i + 1}</span>
                <span className="loop-team-name">{t.icon} {t.zh}</span>
                <span className="loop-team-stars">{t.stars} ⭐</span>
                <span className="loop-team-kg">{fmt(t.kg, 1)} kg</span>
              </div>
            ))}
          </div>
        </section>

        <section className="status-panel">
          <h2>🌟 Top 5 学生 · Top Eco Stars</h2>
          <div className="loop-top-list">
            {topStudents.map((s, i) => (
              <div key={s.id} className="loop-top-row">
                <span className="loop-top-rank">#{i + 1}</span>
                <span className="loop-top-name">{s.teamIcon} {s.name}</span>
                <span className="loop-top-stars">{s.balance} ⭐</span>
              </div>
            ))}
            {topStudents.length === 0 && <div className="ai-history-empty">尚无星星记录 · No stars yet.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

window.EcoLoopDashboard = EcoLoopDashboard;
