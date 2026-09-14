// Isolated demonstration. No cloud client, no connection to the school's data.
function fixture() {
  const state = EcoData.defaultState(), now = Date.now();
  const members = state.teams.flatMap(t => t.members.map(s => ({ ...s, teamId:t.id })));
  const rows = [];
  const award = (s, stars, reasonZh) => rows.push({ id:'preview-'+rows.length, ts:now-1000, studentId:s.id, studentName:s.name, teamId:s.teamId, teacherId:'ADMIN', stars, reasonZh });
  members.forEach((s,i) => {
    if(i===0)award(s,6,'Yakult');
    else if(i===1){award(s,6,'购买 yakult');award(s,114,'日常奖励');}
    else if(i===2){award(s,4,'益力多');award(s,46,'学习奖励');}
  });
  return { ...state, settings:{...state.settings,teacherMonthlyLimits:{ADMIN:1000}}, starLedger:rows };
}
function YakultDemo() {
  const [state,setState]=React.useState(fixture),[mode,setMode]=React.useState(() => ['park','gallery','motion','rewards','admin'].includes(new URLSearchParams(location.search).get('view')) ? new URLSearchParams(location.search).get('view') : 'park'),[species,setSpecies]=React.useState(()=>{const id=new URLSearchParams(location.search).get('species');return EcoData.PET_SPECIES.some(s=>s.id===id)?id:'hornbeetle';});
  window.yakultDemoState=state;
  const report=EcoYakult.report(state);
  return <>
    <nav className="yakult-demo-nav" aria-label="隔离演示"><span>演示 · 模拟奖卡</span>{[['park','乐园'],['gallery','六阶段'],['motion','耳角动作'],['rewards','老师发卡'],['admin','管理核对']].map(([id,label])=><button type="button" key={id} onClick={()=>setMode(id)}>{label}</button>)}<button onClick={()=>setState({...state,starLedger:[]})}>空榜</button><button onClick={()=>setState(fixture())}>重置演示</button></nav>
    {mode==='park'&&<PetGardenView state={state} setState={setState} authed isAdmin requireAuth={()=>true}/>}
    {mode==='rewards'&&<RewardCornerView state={state} setState={setState} authed requireAuth={()=>true} teacherId="ADMIN"/>}
    {mode==='admin'&&<main className="yakult-demo-main" style={{height:'100dvh',overflow:'auto'}}><YakultAdminReview state={state} setState={setState} teacherId="ADMIN"/><YakultBoard report={report}/></main>}
    {mode==='gallery'&&<main className="yakult-demo-main" style={{height:'100dvh',overflow:'auto'}}><h1>Yakult 星耀冠冕 · 六阶段装备预览</h1><p>小金冠 → 宝石冠 → 月桂星冠 → 传奇拱冠。下方为演示外观。</p><label>神兽<select value={species} onChange={e=>setSpecies(e.target.value)}>{EcoData.PET_SPECIES.map(s=><option key={s.id} value={s.id}>{s.zh}</option>)}</select></label><div className="yakult-demo-gallery">{EcoData.PET_STAGES.map((s,i)=><article key={i}><span>0{i+1} · {s.zh}</span><div className="yakult-demo-actor"><EvolvedBeast speciesId={species} stage={i} loading="eager"/><YakultEquipment stage={i}/></div><strong>Yakult 之星</strong></article>)}</div></main>}
    {mode==='motion'&&<main className="yakult-demo-main" style={{height:'100dvh',overflow:'auto'}}><style>{`.head-motion-demo-gallery article{gap:12px;padding:14px 6px}.head-motion-demo-gallery article>span{margin:0}.head-motion-demo-gallery .yakult-demo-actor{width:100%;max-width:220px;height:auto;aspect-ratio:1}`}</style><h1>50 只神兽 · 耳角实动</h1><p>待机会动，点击后动作更明显。耳朵左右错拍，角从角根摆动；没有耳角的使用原有触角、头冠或鳃须。未破壳的蛋维持原样。</p><label>选择神兽<select value={species} onChange={e=>setSpecies(e.target.value)}>{EcoData.PET_SPECIES.map(s=><option key={s.id} value={s.id}>{s.zh}</option>)}</select></label><div className="yakult-demo-gallery head-motion-demo-gallery">{EcoData.PET_STAGES.slice(1).map((s,i)=><HeadMotionDemoCard key={species+':'+i} speciesId={species} stage={i+1} label={s.zh}/>)}</div></main>}
  </>;
}
function HeadMotionDemoCard({speciesId,stage,label}){
 const [token,setToken]=React.useState(0),[playing,setPlaying]=React.useState(false);
 const kinds=[...new Set(PetFeatureRigs.headParts[speciesId][stage-1].map(p=>({ear:'转耳 / 抖耳',horn:'角根摆动',crest:'头冠起伏',antenna:'触角探动',gill:'鳃须舒展',mantle:'柔软头饰 / 头部起伏'}[p.kind])))];
 return <article><span>{label}</span><div className="yakult-demo-actor"><EvolvedBeast speciesId={speciesId} stage={stage} loading="eager" playToken={token} onFinished={()=>setPlaying(false)}/></div><strong>{kinds.join(' · ')}</strong><button type="button" disabled={playing} style={{minHeight:44,padding:'8px 14px',borderRadius:12,border:'1px solid #cfb77a',background:'#fff4d7',color:'#294a3e'}} onClick={()=>{setPlaying(true);setToken(n=>n+1);}}>{playing?'表演中…':'看'+label+'表演'}</button></article>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<YakultDemo/>);
