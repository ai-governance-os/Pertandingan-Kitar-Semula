// 物品图鉴 View — local-first recycling guide.
// Student flow: pick group → pick item → see scripted advice → award star (optional).
// AI fallback: if not in catalog, scan with AI; teacher can save result back to catalog.

function CatalogView({ state, setState }) {
  const { useState, useMemo, useRef } = React;

  const [group, setGroup] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);  // selected item id
  const [showAI, setShowAI] = useState(false);     // toggle AI fallback panel
  const [teamId, setTeamId] = useState(state.teams[0]?.id || "");
  const [studentId, setStudentId] = useState("");

  const team = state.teams.find(t => t.id === teamId) || state.teams[0];
  const student = team?.members?.find(m => m.id === studentId);

  const groups = window.EcoCatalog?.CATALOG_GROUPS || [];
  const binLabels = window.EcoCatalog?.BIN_LABELS || {};

  const allItems = state.catalog || [];
  const items = useMemo(() => {
    let arr = allItems;
    if (group !== "all") arr = arr.filter(i => i.group === group);
    if (query.trim()) arr = EcoData.searchCatalog({ catalog: arr }, query);
    return arr;
  }, [allItems, group, query]);

  const selectedItem = selected ? allItems.find(i => i.id === selected) : null;

  function awardStarFromCatalog(item) {
    if (!student) { alert("请先选择学生 · Pick a student first"); return; }
    const stars = item.starSuggestion || 1;
    const event = {
      id: "star_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      ts: Date.now(),
      studentId: student.id, studentName: student.name, teamId: team.id,
      starType: "eco_recycle", stars,
      reasonZh: `识别 ${item.nameZh} · 正确分类`,
      reasonEn: `Identified ${item.nameEn} · correctly sorted`,
      evidenceType: "catalog_pick", referenceId: item.id, teacherId: "JBC9008",
    };
    setState(EcoData.addStarEvent(state, event));
    alert(`🌟 ${student.name} +${stars} ⭐`);
  }

  return (
    <div className="mobile-view teacher-entry">
      <div className="mobile-frame teacher-frame catalog-frame">
        <div style={{display:'flex', justifyContent:'center', marginBottom:10}}>
          <SchoolStamp size={64} />
        </div>
        <div className="mobile-header compact">
          <h1>📋 物品图鉴 <span style={{opacity:.6, fontSize:'0.7em'}}>· Recycling Catalog</span></h1>
          <p>{allItems.length} 个常见物品 · {allItems.length} common items</p>
        </div>

        {/* Student picker */}
        <div className="entry-panel ai-context-panel">
          <div className="panel-title"><strong>👥 学生 · Student</strong></div>
          <div className="ai-context-row">
            <label className="ai-context-field">
              <span>组别 · Team</span>
              <select value={teamId} onChange={e => { setTeamId(e.target.value); setStudentId(""); }}>
                {state.teams.map(t => (
                  <option key={t.id} value={t.id}>{t.icon} {t.zh}</option>
                ))}
              </select>
            </label>
            <label className="ai-context-field">
              <span>学生 · Student</span>
              <select value={studentId} onChange={e => setStudentId(e.target.value)}>
                <option value="">— 不指定 · Optional —</option>
                {(team?.members || []).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Search bar */}
        <div className="entry-panel catalog-search-panel">
          <input
            className="catalog-search-input"
            type="search"
            placeholder="🔍 搜索物品... · Search items..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {/* Group chips */}
        <div className="catalog-group-chips">
          <button
            className={`catalog-group-chip ${group === "all" ? "active" : ""}`}
            onClick={() => setGroup("all")}
          >
            <span className="catalog-group-icon">🗂️</span>
            <span>全部</span>
          </button>
          {groups.map(g => (
            <button
              key={g.id}
              className={`catalog-group-chip ${group === g.id ? "active" : ""}`}
              onClick={() => setGroup(g.id)}
            >
              <span className="catalog-group-icon">{g.icon}</span>
              <span>{g.zh}</span>
            </button>
          ))}
        </div>

        {/* Item grid */}
        <div className="catalog-grid">
          {items.map(item => {
            const bin = binLabels[item.binId] || {};
            return (
              <button
                key={item.id}
                className={`catalog-card ${selected === item.id ? "selected" : ""}`}
                onClick={() => setSelected(selected === item.id ? null : item.id)}
              >
                <span className="catalog-card-icon">{item.icon || "❓"}</span>
                <span className="catalog-card-name">{item.nameZh}</span>
                <span className="catalog-card-en">{item.nameEn}</span>
                <span
                  className="catalog-card-bin"
                  style={{background: bin.color || "#999", color: "white"}}
                >
                  {bin.zh || item.binId}
                </span>
                {item.isMixed && <span className="catalog-card-mixed">混合材料</span>}
              </button>
            );
          })}
          {items.length === 0 && (
            <div className="catalog-empty">
              没有匹配的物品 · No items match.<br/>
              <button className="chunky-btn primary" onClick={() => setShowAI(true)}>
                🤖 让 AI 帮我认 · Ask AI
              </button>
            </div>
          )}
        </div>

        {/* Item detail */}
        {selectedItem && (
          <CatalogDetail
            item={selectedItem}
            binLabels={binLabels}
            student={student}
            onAwardStar={() => awardStarFromCatalog(selectedItem)}
            onClose={() => setSelected(null)}
          />
        )}

        {/* AI fallback toggle */}
        <div className="catalog-ai-toggle">
          {!showAI ? (
            <button className="chunky-btn catalog-ai-show-btn" onClick={() => setShowAI(true)}>
              🤖 找不到？让 AI 帮我认
              <small>Not in catalog? Ask AI</small>
            </button>
          ) : (
            <CatalogAIFallback
              state={state}
              setState={setState}
              student={student}
              team={team}
              onClose={() => setShowAI(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CatalogDetail({ item, binLabels, student, onAwardStar, onClose }) {
  const bin = binLabels[item.binId] || {};
  return (
    <div className="entry-panel catalog-detail">
      <div className="catalog-detail-header">
        <span className="catalog-detail-icon">{item.icon}</span>
        <div className="catalog-detail-title">
          <h2>{item.nameZh}</h2>
          <div className="catalog-detail-en">{item.nameEn}</div>
        </div>
        <button className="chunky-btn small-btn" onClick={onClose}>×</button>
      </div>

      <div className="catalog-detail-bin" style={{background: bin.color}}>
        🗑️ 主分类 · Main bin: <b>{bin.zh}</b> · {bin.en}
      </div>

      {item.materials?.length > 0 && (
        <div className="catalog-detail-materials">
          <b>材料 · Materials:</b> {item.materials.join(", ")}
          {item.isMixed && <span className="catalog-detail-mixed-tag"> · 混合材料</span>}
        </div>
      )}

      {item.safetyFlags?.length > 0 && (
        <div className="ai-safety">
          ⚠️ 安全提醒 · Safety: {item.safetyFlags.join(", ")}
        </div>
      )}

      <div className="catalog-detail-parts-title">📋 处理步骤 · Steps</div>
      <div className="ai-parts">
        {(item.parts || []).map((p, i) => {
          const pb = binLabels[p.binId] || {};
          return (
            <div className="ai-part-row" key={i} style={{borderLeftColor: pb.color}}>
              <div className="ai-part-head">
                <b>{i + 1}. {p.partZh}</b>
                <span style={{opacity:.7}}>· {p.partEn}</span>
              </div>
              <div className="ai-part-bin">
                → 投放 <b>{pb.zh}</b> · {pb.en}
              </div>
              <div className="ai-part-action">{p.action}</div>
            </div>
          );
        })}
      </div>

      {item.studentMsgZh && (
        <div className="ai-student-msg">
          💬 {item.studentMsgZh}<br/>
          <span>{item.studentMsgEn}</span>
        </div>
      )}

      {item.teacherNoteZh && (
        <div className="ai-teacher-note">
          🧑‍🏫 老师备注 · Teacher note:<br/>
          {item.teacherNoteZh}<br/>
          <span style={{opacity:.7}}>{item.teacherNoteEn}</span>
        </div>
      )}

      <div className="ai-actions">
        <button
          className="chunky-btn ai-award-btn"
          onClick={onAwardStar}
          disabled={!student}
          title={!student ? "先选学生 · Pick a student first" : ""}
        >
          🌟 奖励 {item.starSuggestion || 1} ⭐
          <small>{student ? `Award ${student.name}` : "Pick student first"}</small>
        </button>
      </div>
    </div>
  );
}

function CatalogAIFallback({ state, setState, student, team, onClose }) {
  const { useState, useRef } = React;
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);

  const aiReady = !!window.SUPABASE_CONFIG?.url && !window.SUPABASE_CONFIG.url.includes("PASTE_");

  function pickFile(f) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError("");
  }

  async function analyze() {
    if (!file) { setError("请先拍照 · Take a photo first"); return; }
    setLoading(true); setError("");
    try {
      const schoolContext = {
        categories: state.categories.map(c => ({ id: c.id, zh: c.zh, en: c.ms || c.zh })),
        teams: state.teams.map(t => ({ id: t.id, zh: t.zh, en: t.ms || t.zh })),
      };
      const out = await EcoAI.analyzeImage(file, { schoolContext, detail: "low" });
      setResult(out);
      if (out.previewDataUrl) setPreview(out.previewDataUrl);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function saveToCatalog() {
    if (!result?.analysis) return;
    const newItem = EcoData.aiResultToCatalogItem(result.analysis, "other");
    setState(EcoData.addCatalogItem(state, newItem));
    alert(`✅ 已加入图鉴 · Added to catalog:\n${newItem.nameZh}`);
    onClose();
  }

  function awardOnly() {
    if (!result?.analysis || !student) {
      alert("请先选择学生 · Pick a student first");
      return;
    }
    const stars = result.analysis.main_recommendation?.award_star_suggestion || 1;
    const event = {
      id: "star_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      ts: Date.now(),
      studentId: student.id, studentName: student.name, teamId: team.id,
      starType: "eco_recycle", stars,
      reasonZh: result.analysis.main_recommendation?.summary_zh || "AI 帮助分类",
      reasonEn: result.analysis.main_recommendation?.summary_en || "AI-assisted sorting",
      evidenceType: "ai_scan", referenceId: null, teacherId: "JBC9008",
    };
    setState(EcoData.addStarEvent(state, event));
    alert(`🌟 ${student.name} +${stars} ⭐`);
  }

  return (
    <div className="entry-panel catalog-ai-panel">
      <div className="panel-title" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <strong>🤖 AI 帮助识别 · AI Help</strong>
        <button className="chunky-btn small-btn" onClick={onClose}>收起 · Hide</button>
      </div>
      <p style={{fontSize:13, color:'var(--ink-soft)', marginBottom:12}}>
        💡 提示：图鉴里找不到的物品才用 AI（每次约 USD $0.005）。<br/>
        Tip: Use AI only for items not in the catalog (~ $0.005 per scan).
      </p>

      {!aiReady && (
        <div className="ai-warning">
          ⚠️ AI 未配置 · AI not configured. See <code>SETUP.md</code>.
        </div>
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{display:'none'}}
             onChange={e => pickFile(e.target.files?.[0])} />
      <input ref={uploadRef} type="file" accept="image/*" style={{display:'none'}}
             onChange={e => pickFile(e.target.files?.[0])} />

      {!preview && (
        <div className="ai-action-row">
          <button className="chunky-btn ai-big-btn primary" onClick={() => cameraRef.current?.click()} disabled={!aiReady}>
            <span className="ai-big-icon">📸</span><span>拍照</span><small>Photo</small>
          </button>
          <button className="chunky-btn ai-big-btn" onClick={() => uploadRef.current?.click()} disabled={!aiReady}>
            <span className="ai-big-icon">🖼️</span><span>上传</span><small>Upload</small>
          </button>
        </div>
      )}

      {preview && (
        <>
          <img src={preview} alt="preview" className="ai-preview" />
          {!result && (
            <button className="chunky-btn primary big-save-btn" onClick={analyze} disabled={loading || !aiReady}>
              {loading ? "⏳ 分析中..." : "✨ 开始分析 · Analyze"}
            </button>
          )}
        </>
      )}

      {error && <div className="err ai-err">⚠️ {error}</div>}

      {result?.analysis && (
        <>
          <AIResultCard
            analysis={result.analysis}
            student={student}
            onSave={() => {}}
            onApprove={() => {}}
            onAward={awardOnly}
          />
          <button className="chunky-btn primary big-save-btn" style={{marginTop:12}} onClick={saveToCatalog}>
            💾 加入图鉴 · Save to Catalog
            <small style={{display:'block', fontSize:11, opacity:0.7}}>下次免费 · Free next time</small>
          </button>
        </>
      )}
    </div>
  );
}

window.CatalogView = CatalogView;
