function BeastLibraryPicker({state,setState,studentId,isAdmin,onClose}) {
  const {useState,useEffect,useRef}=React;
  const roster=EcoData.petReport(state),student=roster.find(r=>r.id===studentId);
  const [selected,setSelected]=useState(student?.pet.species.id||'hornbeetle');
  const [query,setQuery]=useState(''),[category,setCategory]=useState('全部');
  const [stage,setStage]=useState(5),[token,setToken]=useState(0),[playing,setPlaying]=useState(false);
  const [notice,setNotice]=useState(''),[confirming,setConfirming]=useState(false);
  const ref=useRef(null),close=useRef(null);
  useEffect(()=>{
    const previous=document.activeElement;close.current?.focus();
    const keyboard=e=>{
      if(e.key==='Escape'){e.stopImmediatePropagation();onClose();}
      if(e.key==='Tab'){
        const items=ref.current?.querySelectorAll('button:not(:disabled),input,select');
        if(!items?.length)return;const first=items[0],last=items[items.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',keyboard,true);
    return()=>{document.removeEventListener('keydown',keyboard,true);previous?.focus?.();};
  },[]);
  if(!isAdmin||!student)return null;
  const species=EcoData.PET_SPECIES.find(s=>s.id===selected),profile=PetEvolution.profile(selected);
  const owner=roster.find(r=>r.id!==studentId&&r.pet.species.id===selected);
  const current=student.pet.species.id===selected;
  const family=s=>s.category||(['phoenix','yinglong','thunder','zhuque','griffin'].includes(s.id)?'飞羽':['seakirin','xuanwu'].includes(s.id)?'海灵':'灵兽');
  const visible=EcoData.PET_SPECIES.filter(s=>(category==='全部'||family(s)===category)&&(s.zh+s.en).toLowerCase().includes(query.toLowerCase().trim()));
  function choose(id){setSelected(id);setConfirming(false);setToken(0);setPlaying(false);setNotice('');ref.current?.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  function assign(){
    if(!isAdmin||current)return;
    if(!confirming){setConfirming(true);return;}
    // Recompute with the latest cloud state; never replace any reward ledger.
    setState(previous=>EcoData.setPetSpecies(previous,studentId,selected));
    setConfirming(false);setNotice('已为 '+student.name+' 选择'+species.zh+'。奖励卡与组别保持不变。');
  }
  return <div className="evolution-backdrop library-backdrop" onClick={onClose}>
    <section className="beast-library" role="dialog" aria-modal="true" aria-labelledby="library-title" ref={ref} onClick={e=>e.stopPropagation()}>
      <header className="evolution-header"><div><span className="evolution-eyebrow">ADMIN · 原创神兽收藏</span><h2 id="library-title">神兽库 <small>{EcoData.PET_SPECIES.length} 种</small></h2></div><button ref={close} className="evolution-close" onClick={onClose} aria-label="关闭神兽库">×</button></header>
      <p className="library-student">为 <b>{student.name}</b> 选伙伴 · {student.teamName}</p>
      <div className="library-preview" style={{'--evo-color':species.aura}}>
        <EvolvedBeast key={selected+stage} speciesId={selected} stage={stage} playToken={token} onFinished={()=>setPlaying(false)} loading="eager" alt={species.zh+' '+profile.features[stage]}/>
        <div><span className="evolution-eyebrow">{family(species)} · {PetEvolution.names[stage]}</span><h3>{species.zh}</h3><p>{profile.features[stage]}</p><button className="library-play" disabled={playing} onClick={()=>{setToken(n=>n+1);setPlaying(true);}}>{playing?'正在表演…':'▶ '+profile.acts[stage]} · 3 秒</button></div>
      </div>
      <div className="evolution-stage-buttons">{EcoData.PET_STAGES.map((s,i)=><button key={i} className={stage===i?'selected':''} aria-pressed={stage===i} onClick={()=>{setStage(i);setToken(0);setPlaying(false);}}><span>{PetEvolution.names[i]}</span><b>{s.minExp}</b><small>奖励卡</small></button>)}</div>
      <div className="library-assignment">
        <p>{current?'这是目前的伙伴。':owner?'已属于 '+owner.name+'；选择后将与该同学交换神兽。':'尚未分配，可以成为这位同学的新伙伴。'}</p>
        {confirming&&<p className="library-confirm">确认给 {student.name} 选择{species.zh}{owner?'，并把'+student.pet.species.zh+'交给 '+owner.name:''}？只换品种，不增加或扣除奖励卡。</p>}
        <button className="evolution-play" disabled={current} onClick={assign}>{current?'当前伙伴':confirming?'确认'+(owner?'交换':'选择'):'为这位同学选择'+species.zh}</button>
        {confirming&&<button className="library-cancel" onClick={()=>setConfirming(false)}>取消</button>}
        <span role="status">{notice}</span>
      </div>
      <div className="library-search"><input type="search" aria-label="搜索神兽" placeholder="搜索神兽名称…" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="筛选神兽类型" value={category} onChange={e=>setCategory(e.target.value)}>{['全部','虫灵','海灵','飞羽','灵兽'].map(c=><option key={c}>{c}</option>)}</select></div>
      <div className="library-grid">{visible.map(s=>{
        const assigned=roster.find(r=>r.pet.species.id===s.id);
        return <button key={s.id} className={selected===s.id?'selected':''} aria-pressed={selected===s.id} onClick={()=>choose(s.id)}><img src={PetEvolution.asset(s.id,5)} alt="" loading="lazy"/><b>{s.zh}</b><small>{assigned?assigned.name.split(' ').slice(-1)[0]+' 的伙伴':'可选择'}</small></button>;
      })}</div>
      {!visible.length&&<p className="library-empty">没有找到这个名称，试试其它关键词。</p>}
      <p className="library-footnote">50 种 × 10 阶进化。真实成长按历来净奖卡 0 / 20 / 50 / 100 / 150 / 250 / 400 / 600 / 750 / 1000 张解锁；月初余额清零不影响宠物。</p>
    </section>
  </div>;
}
window.BeastLibraryPicker=BeastLibraryPicker;
