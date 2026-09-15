function useYakultClock() {
  const [now, setNow] = React.useState(Date.now);
  React.useEffect(() => {
    let timer;
    function refresh() {
      const time = Date.now();
      setNow(time);
      clearTimeout(timer);
      timer = setTimeout(refresh, Math.min(2147483647, EcoYakult.period(time).end - time + 30));
    }
    refresh();
    document.addEventListener('visibilitychange', refresh);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  return now;
}

// A dimensional crown with the brand engraved into its curved front band.
// Each instance needs its own SVG paint IDs (multiple champions can share a park).
function YakultCrown({ stage }) {
  const id = React.useId().replace(/:/g, '');
  const gold = 'yakult-gold-' + id, inset = 'yakult-inset-' + id, ruby = 'yakult-ruby-' + id;
  const junior = stage < 2;
  return <span className="yakult-crown" data-crown-stage={stage}>
    <svg viewBox="0 0 180 140" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff8d5"/><stop offset=".25" stopColor="#ffe599"/><stop offset=".48" stopColor="#bf8434"/><stop offset=".64" stopColor="#ffdf84"/><stop offset="1" stopColor="#9c5d26"/></linearGradient>
        <linearGradient id={inset} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff9dc"/><stop offset=".48" stopColor="#fbe9bb"/><stop offset="1" stopColor="#d8a85a"/></linearGradient>
        <linearGradient id={ruby} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffe1d8"/><stop offset=".35" stopColor="#f16c81"/><stop offset=".72" stopColor="#b72148"/><stop offset="1" stopColor="#64172f"/></linearGradient>
      </defs>
      {stage >= 3 && <g className="yakult-crown-laurels" fill={'url(#'+gold+')'} stroke="#9d6a31" strokeWidth="1.2">
        <path d="M35 110C17 101 7 80 10 61C22 70 29 84 25 92C11 87 5 77 5 69C18 78 24 91 29 101C12 99 3 91 2 82C17 86 29 99 35 110ZM145 110C163 101 173 80 170 61C158 70 151 84 155 92C169 87 175 77 175 69C162 78 156 91 151 101C168 99 177 91 178 82C163 86 151 99 145 110Z"/>
      </g>}
      {stage >= 4 && <g fill="none" stroke={'url(#'+gold+')'} strokeWidth={stage===5?9:6}>
        <path d="M42 87C25 37 63 17 90 23C117 17 155 37 138 87"/>
        <path d="M90 25C67 38 69 65 70 86M90 25C113 38 111 65 110 86" strokeWidth="4"/>
      </g>}
      <ellipse cx="90" cy="109" rx="58" ry="18" fill="#78402e" stroke="#edbc69" strokeWidth="3"/>
      <path d={junior ? 'M28 60L63 79L90 41L117 79L152 60L139 113Q90 130 41 113Z' : 'M23 55L51 76L62 42L80 64L90 29L100 64L118 42L129 76L157 55L141 113Q90 132 39 113Z'} fill={'url(#'+gold+')'} stroke="#895726" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d={junior ? 'M37 68L65 87L90 54L115 87L143 68' : 'M32 64L53 83L65 53L81 76L90 43L99 76L115 53L127 83L148 64'} fill="none" stroke="#fff5c4" strokeWidth="3" strokeLinejoin="round"/>
      {(junior ? [[28,60],[90,41],[152,60]] : [[23,55],[62,42],[90,29],[118,42],[157,55]]).map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i===2&&!junior?6:4.5} fill="#fff7da" stroke="#c69243" strokeWidth="2"/>)}
      <path d="M90 69L103 82L90 97L77 82Z" fill={'url(#'+ruby+')'} stroke="#fff0b3" strokeWidth="2.5"/>
      <path d="M90 71L90 92L79 82Z" fill="#ffb5ba" opacity=".48"/>
      {stage >= 2 && <g fill={'url(#'+ruby+')'} stroke="#fff0b3" strokeWidth="1.5"><ellipse cx="53" cy="93" rx="5" ry="7" transform="rotate(-15 53 93)"/><ellipse cx="127" cy="93" rx="5" ry="7" transform="rotate(15 127 93)"/></g>}
      <path d="M37 102Q90 115 143 102L142 122Q90 139 38 122Z" fill={'url(#'+inset+')'} stroke="#a87332" strokeWidth="2"/>
      <path d="M39 105Q90 119 141 105M40 124Q90 139 140 124" fill="none" stroke="#fff0ae" strokeWidth="2"/>
      <text className="yakult-crown-engraving" x="90" y="125" textAnchor="middle" fill="#a8213d" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="900" letterSpacing="-1">Yakult</text>
      {stage >= 3 && <path className="yakult-crown-star" d={stage===5 ? 'M90 2L95 13L107 14L98 22L101 34L90 28L79 34L82 22L73 14L85 13Z' : 'M90 8L94 18L105 19L97 26L99 37L90 31L81 37L83 26L75 19L86 18Z'} fill={'url(#'+gold+')'} stroke="#fff3c3" strokeWidth="2"/>}
      {stage === 5 && <circle cx="90" cy="20" r="4" fill={'url(#'+ruby+')'} stroke="#fff5ce"/>}
      <path className="yakult-crown-glint" d="M38 73L40 80L47 82L40 84L38 91L36 84L29 82L36 80Z" fill="#fffef1"/>
    </svg>
  </span>;
}

// The crown travels with the actor for every species and form.
function YakultEquipment({ stage = 0, celebrate = false }) {
  return <span className={`yakult-equipment yakult-stage-${stage} ${celebrate ? 'yakult-celebrate' : ''}`} aria-hidden="true">
    <YakultCrown stage={stage}/>
  </span>;
}

function YakultBoard({ report, onPick }) {
  return <div className="yakult-board">
    <div className="yakult-board-intro"><span className="yakult-wordmark">Yakult</span><span>{report.label} · 星光荣誉</span></div>
    <h3>本月 Yakult 之星</h3>
    <p className="yakult-board-rule">按 Yakult 正向奖励卡累计 · 同分共享冠冕<br/>兑换和普通扣卡不影响排名 · 每月 1 日重新竞争</p>
    {report.highest === 0 && <p className="yakult-empty">冠冕虚位以待。老师记录第一笔 Yakult 奖励后，称号自动点亮。</p>}
    <ol className="yakult-ranking">
      {report.students.map(student => <li key={student.id} className={student.winner ? 'yakult-leader' : ''}>
        <span className="yakult-rank">{student.winner ? '✦' : student.rank || '—'}</span>
        <TeamBadge src={student.teamBadgeSrc} name={student.teamName} size={30}/>
        <span className="yakult-student">
          {onPick ? <button type="button" onClick={() => onPick(student.id)}>{student.name}</button> : <b>{student.name}</b>}
          <small>{student.teamName}{student.winner ? ' · Yakult 之星' : ''}</small>
        </span>
        <span className="yakult-score"><b>{student.total}</b><small>张奖卡</small></span>
      </li>)}
    </ol>
    <p className="yakult-footnote">统计老师因 Yakult 发出的奖卡，并非购买瓶数。装备为荣誉外观，不额外发卡。</p>
  </div>;
}

function YakultLeaderboardDialog({ report, onClose, onPick }) {
  const ref = React.useRef(null), closeRef = React.useRef(null);
  React.useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    function keyboard(e) {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key !== 'Tab') return;
      const items = [...ref.current.querySelectorAll('button:not(:disabled)')];
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
    const dialog = ref.current;
    dialog.addEventListener('keydown', keyboard);
    return () => { dialog.removeEventListener('keydown', keyboard); previous?.focus?.(); };
  }, []);
  return <div className="yakult-backdrop" onClick={onClose}>
    <section className="yakult-dialog" role="dialog" aria-modal="true" aria-label="本月 Yakult 排行榜" ref={ref} onClick={e => e.stopPropagation()}>
      <button ref={closeRef} type="button" className="yakult-close" onClick={onClose} aria-label="关闭 Yakult 排行榜">×</button>
      <YakultBoard report={report} onPick={onPick}/>
    </section>
  </div>;
}

function YakultPetHonour({ row, state }) {
  const [preview, setPreview] = React.useState(false);
  const now = useYakultClock();
  const current = EcoYakult.report(state, Math.max(now, Date.now())).students.find(student => student.id === row.id);
  const history = React.useMemo(() => EcoYakult.honours(state, row.id, now), [state, row.id, now]);
  return <section className={`yakult-pet-honour ${current?.winner ? 'is-yakult-star' : ''}`} aria-label="Yakult 荣誉">
    <div className="yakult-honour-copy"><span className="yakult-wordmark">Yakult</span><b>{current?.winner ? '本月 Yakult 之星' : '本月 Yakult 荣誉'}</b><span>{current?.total || 0} 张 Yakult 奖励卡</span></div>
    <p>{current?.winner ? '已获得 Yakult 星耀冠冕，随进化解锁更华丽的王冠；同分共享，每月重新竞争。' : '本月 Yakult 奖励卡并列最高且大于 0，即可获得 Yakult 星耀冠冕。'}</p>
    {!current?.winner && <button type="button" className="yakult-preview-button" aria-expanded={preview} onClick={() => setPreview(!preview)}>{preview ? '收起装备预览' : '预览 Yakult 装备'}</button>}
    {preview && !current?.winner && <div className="yakult-equipment-preview"><span>装备预览 · 尚未获得</span><div className="yakult-preview-pet"><EvolvedBeast speciesId={row.pet.species.id} stage={row.pet.displayStageIndex} loading="lazy"/><YakultEquipment stage={row.pet.displayStageIndex}/></div></div>}
    {history.length > 0 && <details className="yakult-history"><summary>历月 Yakult 之星 · {history.length} 次</summary>{history.map(item => <p key={item.month}>✦ {item.label} · {item.total} 张</p>)}</details>}
  </section>;
}

function YakultAdminReview({ state, setState, teacherId }) {
  const now = useYakultClock(), [query, setQuery] = React.useState(''), [filter, setFilter] = React.useState('yakult');
  const [notice, setNotice] = React.useState('');
  const [month, setMonth] = React.useState('');
  const periodKey = month || EcoYakult.period(now).key;
  const events = (state.starLedger || []).filter(event => {
    const ts = EcoYakult.timestamp(event?.ts);
    return EcoYakult.validAward(event) && Number.isFinite(ts) && EcoYakult.period(ts).key === periodKey &&
      (filter === 'all' || EcoYakult.isYakult(event)) &&
      `${event.studentName || ''} ${event.teacherId || ''} ${event.reasonZh || ''} ${event.reasonEn || ''}`.toLowerCase().includes(query.toLowerCase());
  }).sort((a, b) => EcoYakult.timestamp(b.ts) - EcoYakult.timestamp(a.ts));
  function classify(eventId, rawValue) {
    const value = rawValue === 'auto' ? null : rawValue === 'yes';
    setState(current => EcoYakult.classify(current, eventId, value, teacherId));
    setNotice('Yakult 分类已更新，排行榜会重新计算。原奖励卡数量和老师额度保持不变。');
  }
  return <div className="admin-section yakult-admin">
    <h2>Yakult 奖励核对</h2><p>自动识别 Yakult／养乐多／益力多。可将误判设为「不计入」，或把漏记的奖励设为「计入」。</p>
    <div className="yakult-admin-filters">
      <label>月份<input type="month" value={periodKey} onChange={e => setMonth(e.target.value)}/></label>
      <label>显示<select value={filter} onChange={e => setFilter(e.target.value)}><option value="yakult">Yakult 奖励</option><option value="all">全部正向奖励</option></select></label>
      <label>查找<input value={query} onChange={e => setQuery(e.target.value)} placeholder="学生、老师或原因"/></label>
    </div>
    <p role="status">{notice}</p>
    <details><summary>查看 {events.length} 笔记录并核对分类</summary>
      <div className="yakult-audit-list">{events.map(event => <article key={event.id}>
        <div><b>{event.studentName || event.studentId}</b><strong>+{event.stars} 张</strong></div>
        <small>{new Date(EcoYakult.timestamp(event.ts)).toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' })} · {event.teacherId}</small>
        <p>{[event.reasonZh, event.reasonEn].filter(Boolean).join(' · ') || '未填写原因'}</p>
        <label>Yakult 分类<select aria-label={`${event.studentName || event.studentId} 的 Yakult 分类`} value={typeof event.yakult === 'boolean' ? (event.yakult ? 'yes' : 'no') : 'auto'} onChange={e => classify(event.id, e.target.value)}><option value="auto">自动识别</option><option value="yes">计入 Yakult</option><option value="no">不计入 Yakult</option></select></label>
        <small>{EcoYakult.isYakult(event) ? '已计入 Yakult 排名' : '未计入 Yakult 排名'}{event.yakultReviewedBy ? ` · ${event.yakultReviewedBy} 已核对` : ''}</small>
      </article>)}</div>
      {!events.length && <p>这个月份没有符合筛选条件的记录。</p>}
    </details>
  </div>;
}
Object.assign(window, { useYakultClock, YakultEquipment, YakultBoard, YakultLeaderboardDialog, YakultPetHonour, YakultAdminReview });
