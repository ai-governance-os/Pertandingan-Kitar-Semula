// AI Scan View — v1.1 layered analysis: normal mode by default, fine-analysis on demand.

function AIScanView(props) {
  if (!props.authed) return <AdminGate authed={false} requireAuth={props.requireAuth}>{null}</AdminGate>;
  return <AIScanViewInner {...props} />;
}

function AIScanViewInner({ state, setState }) {
  const { useState, useRef, useMemo } = React;

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [teamId, setTeamId] = useState(state.teams[0]?.id || "");
  const [studentId, setStudentId] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [retriedHigh, setRetriedHigh] = useState(false);
  const [dailyUsed, setDailyUsed] = useState(() => EcoAI.todayCount());

  const cameraRef = useRef(null);
  const uploadRef = useRef(null);

  const team = state.teams.find(t => t.id === teamId) || state.teams[0];
  const student = team?.members?.find(m => m.id === studentId);
  const recentScans = useMemo(() => (state.aiScans || []).slice(0, 8), [state.aiScans]);
  const remaining = Math.max(0, EcoAI.DAILY_LIMIT - dailyUsed);

  function pickFile(f) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError("");
    setRetriedHigh(false);
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    setRetriedHigh(false);
    if (cameraRef.current) cameraRef.current.value = "";
    if (uploadRef.current) uploadRef.current.value = "";
  }

  async function runAnalysis(mode) {
    if (!file) { setError("请先拍照或选择图片 · Take or choose a photo first."); return; }
    setLoading(true); setError("");
    try {
      const schoolContext = {
        categories: state.categories.map(c => ({ id: c.id, zh: c.zh, en: c.ms || c.zh })),
        teams: state.teams.map(t => ({ id: t.id, zh: t.zh, en: t.ms || t.zh })),
      };
      const out = await EcoAI.analyzeImage(file, { schoolContext, mode });
      setResult(out);
      setDailyUsed(out.dailyUsedAfter ?? EcoAI.todayCount());
      if (out.previewDataUrl) setPreview(out.previewDataUrl);
      if (mode === "high") setRetriedHigh(true);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function analyze() { return runAnalysis("normal"); }
  function reanalyzeHigh() { return runAnalysis("high"); }

  function saveScan(decision) {
    if (!result?.analysis) return;
    const scan = {
      id: "scan_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      ts: Date.now(),
      studentId: student?.id || "",
      studentName: student?.name || "",
      teamId: team?.id || "",
      source: "upload",
      imageStored: false,
      imageUrl: null,
      aiProvider: result.provider,
      model: result.model,
      mode: result.mode || "normal",
      analysis: result.analysis,
      teacherDecision: decision,
      correction: null,
      awardedStars: 0,
    };
    setState(EcoData.addAiScan(state, scan));
    alert(decision === "approved" ? "✅ 已批准并保存 · Approved & saved" : "✅ 已保存记录 · Saved");
    reset();
  }

  function awardStarFromResult() {
    if (!result?.analysis) return;
    if (!student) { alert("请先选择学生 · Please choose a student first."); return; }

    const rec = result.analysis.main_recommendation || {};
    const action = result.analysis.recommended_next_action;
    if (action === "separate_items") {
      if (!window.confirm("AI 提示是多物品照片，建议先分开拍。仍要奖励？\nAI says multiple items — award anyway?")) return;
    }
    if (action === "reject_as_unsafe") {
      alert("⚠️ 这是危险物，不应给学生奖励。请老师处理。\nHazardous item — do not award stars.");
      return;
    }

    const suggested = rec.award_star_suggestion ?? 1;
    const input = window.prompt(
      `奖励 ${student.name} 几颗 ⭐ ?\nHow many eco stars for ${student.name}?\n(AI 建议 · suggested: ${suggested})`,
      String(suggested)
    );
    if (input === null) return;
    const stars = Number(input);
    if (!Number.isFinite(stars) || stars <= 0) return;

    const scanId = "scan_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    const scan = {
      id: scanId, ts: Date.now(),
      studentId: student.id, studentName: student.name, teamId: team.id,
      source: "upload", imageStored: false, imageUrl: null,
      aiProvider: result.provider, model: result.model, mode: result.mode || "normal",
      analysis: result.analysis,
      teacherDecision: "approved", correction: null, awardedStars: stars,
    };
    const event = {
      id: "star_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      ts: Date.now(),
      studentId: student.id, studentName: student.name, teamId: team.id,
      starType: "eco_recycle", stars,
      reasonZh: rec.summary_zh || "AI 环保扫描后奖励",
      reasonEn: rec.summary_en || "Eco star awarded after AI scan",
      evidenceType: "ai_scan", referenceId: scanId, teacherId: "JBC9008",
    };
    let next = EcoData.addAiScan(state, scan);
    next = EcoData.addStarEvent(next, event);
    setState(next);
    alert(`🌟 ${student.name} +${stars} ⭐`);
    reset();
  }

  const aiReady = !!window.SUPABASE_CONFIG?.url && !window.SUPABASE_CONFIG.url.includes("PASTE_");
  const quotaExhausted = remaining <= 0;

  return (
    <div className="mobile-view teacher-entry">
      <div className="mobile-frame teacher-frame ai-scan-frame">
        <div style={{display:'flex', justifyContent:'center', marginBottom:10}}>
          <SchoolStamp size={64} />
        </div>
        <div className="mobile-header compact">
          <h1>🤖 智能扫描 <span style={{opacity:.7, fontSize:'0.7em'}}>· AI Scan</span></h1>
          <p>拍照分析物品，学习正确分类 · Snap to learn how to recycle it.</p>
        </div>

        {!aiReady && (
          <div className="ai-warning">
            ⚠️ AI 未启用 · AI not enabled.<br/>
            请先在 <code>index.html</code> 设定 Supabase，并部署 Edge Function。<br/>
            See <code>SETUP.md</code>.
          </div>
        )}

        <div className="ai-quota-pill" title="每日 AI 分析上限 · Daily AI quota">
          📊 今日 AI 用量 · Today: <b>{dailyUsed}</b> / {EcoAI.DAILY_LIMIT}
          {remaining <= 10 && remaining > 0 && <span className="ai-quota-warn"> · 剩 {remaining} 次</span>}
          {quotaExhausted && <span className="ai-quota-empty"> · 今日已满 · Quota reached</span>}
        </div>

        <div className="entry-panel ai-context-panel">
          <div className="panel-title"><strong>👥 学生 / 组别 · Student / Team</strong></div>
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
          {student && (
            <div className="ai-student-balance">
              {student.name} 现有 <b>{EcoData.studentStarBalance(state, student.id)}</b> ⭐
            </div>
          )}
        </div>

        <div className="entry-panel ai-upload-card">
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{display:'none'}}
            onChange={e => pickFile(e.target.files?.[0])}
          />
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            style={{display:'none'}}
            onChange={e => pickFile(e.target.files?.[0])}
          />

          {!preview && (
            <div className="ai-action-row">
              <button
                className="chunky-btn ai-big-btn primary"
                onClick={() => cameraRef.current?.click()}
                disabled={!aiReady || quotaExhausted}
              >
                <span className="ai-big-icon">📸</span>
                <span>拍照</span>
                <small>Take Photo</small>
              </button>
              <button
                className="chunky-btn ai-big-btn"
                onClick={() => uploadRef.current?.click()}
                disabled={!aiReady || quotaExhausted}
              >
                <span className="ai-big-icon">🖼️</span>
                <span>选照片</span>
                <small>Choose Photo</small>
              </button>
            </div>
          )}

          {preview && (
            <>
              <img src={preview} alt="preview" className="ai-preview" />
              <div className="ai-action-row">
                {!result && (
                  <button
                    className="chunky-btn primary ai-big-btn"
                    onClick={analyze}
                    disabled={loading || !aiReady || quotaExhausted}
                  >
                    {loading ? (
                      <>
                        <span className="ai-big-icon">⏳</span>
                        <span>分析中…</span>
                        <small>Analyzing…</small>
                      </>
                    ) : (
                      <>
                        <span className="ai-big-icon">✨</span>
                        <span>开始 AI 分析</span>
                        <small>Quick · normal mode</small>
                      </>
                    )}
                  </button>
                )}
                <button className="chunky-btn ai-big-btn" onClick={reset}>
                  <span className="ai-big-icon">🗑️</span>
                  <span>重选</span>
                  <small>Reset</small>
                </button>
              </div>
            </>
          )}

          {error && <div className="err ai-err">⚠️ {error}</div>}
        </div>

        {result?.analysis && (
          <AIResultCard
            analysis={result.analysis}
            student={student}
            mode={result.mode}
            onSave={() => saveScan("pending")}
            onApprove={() => saveScan("approved")}
            onAward={awardStarFromResult}
            onReanalyzeHigh={reanalyzeHigh}
            canReanalyzeHigh={!retriedHigh && !loading && !quotaExhausted}
            reanalyzeLoading={loading}
          />
        )}

        <div className="entry-panel">
          <div className="panel-title" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <strong>📚 最近扫描 · Recent Scans ({(state.aiScans || []).length})</strong>
            <button className="chunky-btn small-btn" onClick={() => setShowHistory(s => !s)}>
              {showHistory ? "收起 · Hide" : "展开 · Show"}
            </button>
          </div>
          {showHistory && (
            <div className="ai-history-list">
              {recentScans.length === 0 && <div className="ai-history-empty">暂无记录 · No scans yet.</div>}
              {recentScans.map(s => {
                const item = s.analysis?.detected_items?.[0];
                return (
                  <div key={s.id} className="ai-history-row">
                    <div className="ai-history-icon">
                      {s.teacherDecision === "approved" ? "✅" : "📝"}
                    </div>
                    <div className="ai-history-body">
                      <div className="ai-history-title">
                        {item?.label_zh || "—"} <span style={{opacity:.6}}>· {item?.label_en || ""}</span>
                        {s.mode === "high" && <span className="ai-mode-pill"> 🔍 精细</span>}
                      </div>
                      <div className="ai-history-meta">
                        {s.studentName || "未指名"} · {s.teamId ? (state.teams.find(t => t.id === s.teamId)?.zh || "") : ""}
                        {s.awardedStars > 0 && <> · +{s.awardedStars} ⭐</>}
                        <span style={{opacity:.55, marginLeft:6}}>{relTime(s.ts)} ago</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── AI Result Card (v1.1) ───────────────────────────

const NEXT_ACTION_META = {
  accept:           { icon: "✅", className: "next-accept",   zh: "可采用 AI 建议",                  en: "Accept AI suggestion" },
  take_closeup:     { icon: "🔍", className: "next-closeup",  zh: "请近拍标签 / 包装膜 / 瓶盖部分", en: "Please take a close-up" },
  separate_items:   { icon: "📸", className: "next-separate", zh: "检测到多个物品，请逐个拍照",     en: "Multiple items — take separate photos" },
  teacher_confirm:  { icon: "👩‍🏫", className: "next-teacher", zh: "需要老师确认材料 / 分类",         en: "Teacher review needed" },
  reject_as_unsafe: { icon: "⚠️", className: "next-unsafe",   zh: "可能是危险物，请老师介入",        en: "Possible hazard — teacher must handle" },
};

function AIResultCard({
  analysis,
  student,
  mode,
  onSave,
  onApprove,
  onAward,
  onReanalyzeHigh,
  canReanalyzeHigh,
  reanalyzeLoading,
}) {
  const rec = analysis.main_recommendation || {};
  const conf = Math.round((analysis.overall_confidence || 0) * 100);
  const recyclable = !!analysis.is_recyclable_candidate;
  const needsReview = !!rec.needs_teacher_review;
  const safety = analysis.safety_flags || [];

  // v1.1 fields (may be missing on old Edge Function responses)
  const imgQ = analysis.image_quality || null;
  const multi = !!analysis.multi_item_detected;
  const multiAdvZh = analysis.multi_item_advice_zh || "";
  const multiAdvEn = analysis.multi_item_advice_en || "";
  const uncertZh = analysis.uncertainties_zh || [];
  const uncertEn = analysis.uncertainties_en || [];
  const nextAction = analysis.recommended_next_action || "accept";
  const nextMeta = NEXT_ACTION_META[nextAction] || NEXT_ACTION_META.accept;

  const statusClass = needsReview ? "ai-status review" : recyclable ? "ai-status ok" : "ai-status no";
  const statusText  = needsReview ? "❓ 需要老师确认 · Teacher review needed"
                    : recyclable  ? "✅ 可回收 · Recyclable"
                                  : "❌ 不可回收 · Not recyclable";

  // Show the fine-analysis button when AI was uncertain or asked for a closeup,
  // OR when teacher clicked elsewhere (always offer if quota allows).
  const fineSuggested =
    conf < 75 ||
    needsReview ||
    uncertZh.length > 0 ||
    nextAction === "take_closeup" ||
    nextAction === "teacher_confirm" ||
    (imgQ && imgQ.needs_retake);

  const fineDisabled = !canReanalyzeHigh;

  return (
    <div className="entry-panel ai-result-card">
      <div className={statusClass}>
        {statusText}
        <span className="ai-conf">{conf}%</span>
      </div>

      {/* Mode pill — tells teacher whether this came from normal or fine analysis */}
      <div className="ai-mode-banner">
        {mode === "high"
          ? <>🔍 <b>精细分析</b> · Fine analysis result</>
          : <>⚡ <b>快速分析</b> · Quick analysis result</>}
      </div>

      {/* Recommended next action — most important UI cue */}
      {nextAction !== "accept" && (
        <div className={`ai-next-action ${nextMeta.className}`}>
          <div className="ai-next-action-head">
            <span className="ai-next-icon">{nextMeta.icon}</span>
            <b>{nextMeta.zh}</b>
          </div>
          <div className="ai-next-action-en">{nextMeta.en}</div>
        </div>
      )}

      {/* Multi-item warning */}
      {multi && (multiAdvZh || multiAdvEn) && (
        <div className="ai-multi-banner">
          📸 {multiAdvZh}
          <br/><span>{multiAdvEn}</span>
        </div>
      )}

      {/* Image quality banner */}
      {imgQ && imgQ.needs_retake && (imgQ.retake_reason_zh || imgQ.retake_reason_en) && (
        <div className="ai-imgq-banner">
          🖼️ <b>图片质量 · Image quality:</b> {imgQ.clarity}<br/>
          {imgQ.retake_reason_zh}
          <br/><span>{imgQ.retake_reason_en}</span>
        </div>
      )}

      {/* AI uncertainties (honest "I don't know" list) */}
      {uncertZh.length > 0 && (
        <div className="ai-uncertain-banner">
          <div className="ai-uncertain-title">🤔 AI 不确定 · AI is unsure about:</div>
          <ul>
            {uncertZh.map((u, i) => (
              <li key={i}>
                {u}
                {uncertEn[i] && <><br/><span style={{opacity:.65}}>{uncertEn[i]}</span></>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fine-analysis (high detail) re-run button */}
      {fineSuggested && (
        <button
          className={`chunky-btn ai-fine-btn ${fineDisabled ? "disabled" : ""}`}
          onClick={onReanalyzeHigh}
          disabled={fineDisabled}
          title={fineDisabled ? "已用过精细分析，或今日额度已满" : "用更高精度 AI 重新分析"}
        >
          {reanalyzeLoading ? "⏳ 精细分析中…" : "🔍 精细分析 · Re-analyze in high detail"}
          <small>
            {mode === "high"
              ? "本图已是精细分析 · Already high detail"
              : (fineDisabled
                  ? (canReanalyzeHigh === false ? "(精细分析每图限 1 次)" : "")
                  : "适合标签 / 包装膜 / 玻璃 / 混合材料 · For labels, films, glass, mixes")}
          </small>
        </button>
      )}

      <div className="ai-summary">
        <div className="ai-summary-zh">{rec.summary_zh}</div>
        <div className="ai-summary-en">{rec.summary_en}</div>
      </div>

      {safety.length > 0 && (
        <div className="ai-safety">
          ⚠️ 安全提醒 · Safety: {safety.join(", ")}
        </div>
      )}

      {(analysis.detected_items || []).map((item, idx) => (
        <div className="ai-item" key={idx}>
          <h3>
            {item.label_zh} <span style={{opacity:.6}}>· {item.label_en}</span>
            {typeof item.confidence === "number" && (
              <span className="ai-item-conf">{Math.round(item.confidence * 100)}%</span>
            )}
          </h3>
          {(item.materials || []).length > 0 && (
            <div className="ai-materials">
              <b>材料 · Materials:</b> {(item.materials || []).join(", ")}
            </div>
          )}
          <div className="ai-parts">
            {(item.recommended_parts || []).map((p, i) => (
              <div className="ai-part-row" key={i}>
                <div className="ai-part-head">
                  <b>{p.part_zh}</b>
                  <span style={{opacity:.7}}>· {p.part_en}</span>
                </div>
                <div className="ai-part-bin">
                  → 投放 <b>{p.bin_label_zh}</b> · {p.bin_label_en}
                </div>
                <div className="ai-part-action">📝 {p.action}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {analysis.student_message?.zh && (
        <div className="ai-student-msg">
          💬 {analysis.student_message.zh}
          <br/><span>{analysis.student_message.en}</span>
        </div>
      )}

      {analysis.teacher_note?.zh && (
        <div className="ai-teacher-note">
          🧑‍🏫 老师备注 · Teacher note:<br/>
          {analysis.teacher_note.zh}<br/>
          <span style={{opacity:.7}}>{analysis.teacher_note.en}</span>
        </div>
      )}

      <div className="ai-actions">
        <button className="chunky-btn" onClick={onSave}>📌 仅保存<small>Save</small></button>
        <button className="chunky-btn primary" onClick={onApprove}>✅ 老师批准<small>Approve</small></button>
        <button
          className="chunky-btn ai-award-btn"
          onClick={onAward}
          disabled={!student}
          title={!student ? "先选择学生 · Pick a student first" : ""}
        >
          🌟 奖励环保星<small>{student ? `Award ${student.name}` : "Pick student first"}</small>
        </button>
      </div>
    </div>
  );
}

window.AIScanView = AIScanView;
window.AIResultCard = AIResultCard;
