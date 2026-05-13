// 管理员 ADMIN VIEW — edit categories, view log, export CSV, reset

const { useState: useStateA, useMemo: useMemoA } = React;

function AdminView({ state, setState }) {
  const [confirm, setConfirm] = useStateA(false);

  function patchCat(id, patch) {
    const next = state.categories.map(c => c.id === id ? { ...c, ...patch } : c);
    setState(EcoData.updateCategories(state, next));
  }
  function deleteCat(id) {
    if (!window.confirm("删除此废品种类？\nPadam kategori ini?")) return;
    const next = state.categories.filter(c => c.id !== id);
    setState(EcoData.updateCategories(state, next));
  }
  function addCat() {
    const newCat = {
      id: "cat_" + Date.now(),
      icon: "♻️", zh: "新废品", ms: "Bahan baru",
      points: 5, co2: 1.0, color: "#888"
    };
    setState(EcoData.updateCategories(state, [...state.categories, newCat]));
  }
  function exportCsv() {
    const csv = EcoData.exportCSV(state);
    const blob = new Blob([csv], {type: "text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eco-warrior-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function doReset() {
    setState(EcoData.resetSeason(state));
    setConfirm(false);
  }
  function reseedDemo() {
    const fresh = EcoData.defaultState();
    fresh.categories = state.categories;
    fresh.teams = state.teams;
    const seeded = EcoData.seedDemo(fresh);
    setState(seeded);
  }
  function deleteEntry(id) {
    setState(EcoData.removeEntry(state, id));
  }

  const sortedEntries = useMemoA(() =>
    [...state.entries].sort((a,b) => b.ts - a.ts), [state.entries]
  );

  const dragons = EcoData.teamStats(state, "dragons");
  const lions = EcoData.teamStats(state, "lions");

  return (
    <div className="admin-view">
      <div className="admin-frame">

        <div style={{marginBottom:18}}>
          <SchoolStamp size={42} />
        </div>

        <div className="admin-header">
          <div>
            <h1><span className="zh">管理面板</span> · <span style={{fontFamily:'var(--font-display)'}}>Admin Panel</span></h1>
            <div className="subtitle">环保小兵 · Eco Warrior · 赛季管理</div>
          </div>
          <div className="actions">
            <button className="chunky-btn" onClick={exportCsv}>📊 <BLinline zh="导出 CSV" ms="Eksport CSV" /></button>
            <button className="chunky-btn" onClick={reseedDemo} style={{fontSize:14}}>🎲 <BLinline zh="重置示范数据" ms="Data demo" /></button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="admin-section">
          <h2>📊 <BLinline zh="赛季总览" ms="Ringkasan musim" /></h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginTop:14}}>
            <StatBox label="飞龙总分" sub="Naga" value={fmt(dragons.points)} unit="pts" color="var(--dragon)" />
            <StatBox label="云狮总分" sub="Singa" value={fmt(lions.points)} unit="pts" color="var(--lion)" />
            <StatBox label="回收总量" sub="Jumlah kitar" value={fmt(dragons.kg + lions.kg, 1)} unit="kg" color="var(--eco-deep)" />
            <StatBox label="CO₂ 减排" sub="CO₂ kurang" value={fmt(dragons.co2 + lions.co2, 1)} unit="kg" color="#4361EE" />
          </div>
        </div>

        {/* Categories */}
        <div className="admin-section">
          <h2>♻️ <BLinline zh="废品种类与分值" ms="Kategori & markah" /></h2>
          <div className="section-sub">编辑分数（每公斤）和 CO₂ 因子。变更立即生效。<br/>Edit markah (setiap kg) & faktor CO₂. Berkesan serta-merta.</div>
          <div className="cat-list">
            {state.categories.map(c => (
              <div className="cat-row" key={c.id}>
                <input className="icon-cell" value={c.icon} onChange={e => patchCat(c.id, {icon: e.target.value})} style={{fontSize:30, textAlign:'center'}} />
                <div className="name-stack">
                  <input value={c.zh} onChange={e => patchCat(c.id, {zh: e.target.value})} placeholder="中文" />
                  <input value={c.ms} onChange={e => patchCat(c.id, {ms: e.target.value})} placeholder="Bahasa Melayu" />
                </div>
                <div className="pts-input">
                  <input type="number" min="0" step="1" value={c.points} onChange={e => patchCat(c.id, {points: +e.target.value || 0})} />
                  <span className="unit">pts/kg</span>
                </div>
                <div className="co2-input">
                  <input type="number" min="0" step="0.1" value={c.co2} onChange={e => patchCat(c.id, {co2: +e.target.value || 0})} />
                  <span className="unit">CO₂</span>
                </div>
                <button className="del" onClick={() => deleteCat(c.id)} title="删除">🗑</button>
              </div>
            ))}
          </div>
          <button className="add-cat-btn" onClick={addCat}>
            + <BLinline zh="添加废品种类" ms="Tambah kategori" />
          </button>
        </div>

        {/* Log */}
        <div className="admin-section">
          <h2>📋 <BLinline zh="称重记录" ms="Rekod timbang" /> <span style={{fontSize:14, opacity:0.5, marginLeft:6, fontWeight:500, fontFamily:'var(--font-body)'}}>({state.entries.length})</span></h2>
          {sortedEntries.length === 0 ? (
            <div className="log-empty">还没有记录 · Tiada rekod lagi</div>
          ) : (
            <div style={{maxHeight:360, overflowY:'auto', marginRight:-10, paddingRight:10}}>
              <table className="log-table">
                <thead>
                  <tr>
                    <th>时间 · Masa</th>
                    <th>队伍 · Pasukan</th>
                    <th>废品 · Bahan</th>
                    <th style={{textAlign:'right'}}>重量 · Berat</th>
                    <th style={{textAlign:'right'}}>分数 · Markah</th>
                    <th style={{textAlign:'right'}}>CO₂</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.slice(0, 200).map(e => {
                    const cat = state.categories.find(c => c.id === e.categoryId);
                    const team = state.teams.find(t => t.id === e.teamId);
                    return (
                      <tr key={e.id}>
                        <td>{new Date(e.ts).toLocaleString('zh-CN', {month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'})}</td>
                        <td><span className={`pill ${e.teamId}`}>{team?.icon} {team?.zh}</span></td>
                        <td>{cat?.icon} {cat?.zh}</td>
                        <td style={{textAlign:'right'}}>{e.kg} kg</td>
                        <td className="pts-cell" style={{textAlign:'right', color:'var(--eco-deep)'}}>+{e.points}</td>
                        <td style={{textAlign:'right', color:'var(--ink-mute)'}}>{e.co2} kg</td>
                        <td><button className="del" onClick={() => deleteEntry(e.id)}>🗑</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="admin-section danger-zone">
          <h2>⚠️ <BLinline zh="危险操作" ms="Zon bahaya" /></h2>
          <div className="section-sub" style={{color:'#9B2A14'}}>
            重置赛季会清除所有称重记录，但保留废品种类设置。<br/>
            Tetap semula musim akan padamkan semua rekod, tetapi simpan tetapan kategori.
          </div>
          {!confirm ? (
            <button className="chunky-btn" style={{background:'#FFD6CC', borderColor:'#C8341A', boxShadow:'0 5px 0 #C8341A', color:'#C8341A'}} onClick={() => setConfirm(true)}>
              🗑 <BLinline zh="重置赛季" ms="Tetap semula musim" />
            </button>
          ) : (
            <div style={{display:'flex', gap:10, alignItems:'center'}}>
              <span style={{fontWeight:700, color:'#C8341A'}}>确定？Pasti?</span>
              <button className="chunky-btn" style={{background:'#C8341A', borderColor:'#7A1B0A', boxShadow:'0 5px 0 #7A1B0A', color:'white', fontSize:14}} onClick={doReset}>
                ✓ 是 / Ya
              </button>
              <button className="chunky-btn" style={{fontSize:14}} onClick={() => setConfirm(false)}>
                ✗ 取消 / Batal
              </button>
            </div>
          )}
        </div>

        <div style={{textAlign:'center', color:'var(--ink-mute)', fontSize:12, padding:'14px 0', fontWeight:600, letterSpacing:'0.05em'}}>
          数据保存在本机浏览器 · Data disimpan di pelayar
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, sub, value, unit, color }) {
  return (
    <div style={{
      background:'var(--bg-cream)',
      border:'2px solid var(--ink)',
      borderRadius:14,
      padding:'12px 14px',
      boxShadow:'0 3px 0 var(--ink)',
    }}>
      <div style={{fontSize:11, fontWeight:700, color:'var(--ink-mute)', letterSpacing:'0.08em', textTransform:'uppercase'}}>{label}</div>
      <div style={{fontSize:9, opacity:0.6, fontWeight:600, marginTop:-1}}>{sub}</div>
      <div style={{fontFamily:'var(--font-display)', fontWeight:700, fontSize:26, color, marginTop:4, lineHeight:1}}>
        {value}<span style={{fontSize:12, opacity:0.5, marginLeft:4}}>{unit}</span>
      </div>
    </div>
  );
}

window.AdminView = AdminView;
