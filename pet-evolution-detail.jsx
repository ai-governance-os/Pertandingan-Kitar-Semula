function EvolutionDetailModal({state,setState,row,authed,isAdmin=false,requireAuth,onClose,onPetInteract}) {
  const {useState,useEffect,useRef}=React;
  const p=row.pet,profile=PetEvolution.profile(p.species.id);
  const [viewStage,setViewStage]=useState(5);
  const [playToken,setPlayToken]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [deviceVoice,setDeviceVoice]=useState(()=>window.PetOwnerVoice?.isDeviceEnabled()||false);
  const [celebration,setCelebration]=useState('');
  const [libraryOpen,setLibraryOpen]=useState(false);
  const [signatureOpen,setSignatureOpen]=useState(false);
  const [voiceStatus,setVoiceStatus]=useState('');
  const [auditionPlaying,setAuditionPlaying]=useState(false);
  const characterClip=window.PetCharacterVoice?.resolve(row.name,viewStage,p.species.id);
  const auditionClip=window.PetCharacterVoice?.resolve(row.name,viewStage,p.species.id,'audition');
  const performanceDuration=Math.max(3000,(characterClip?.duration||0)*1000+350);
  useEffect(()=>{
    setVoiceStatus('');setAuditionPlaying(false);window.PetCharacterVoice?.warm(row.name,viewStage,p.species.id);
    const changed=e=>{
      const sample=e.detail.key===auditionClip?.key;
      if(e.detail.key&&e.detail.key!==characterClip?.key&&!sample)return;
      setAuditionPlaying(sample&&e.detail.state==='playing');
      setVoiceStatus(e.detail.state==='playing'?(sample?'正在播放新版童趣样音':'正在播放旧版阶段配音'):e.detail.state==='blocked'||e.detail.state==='error'?'配音未能播放，请点试听重试':'');
    };
    window.addEventListener('pet-character-voice',changed);return()=>window.removeEventListener('pet-character-voice',changed);
  },[row.name,viewStage,p.species.id]);
  const previousStage=useRef(p.stageIndex),dialogRef=useRef(null),closeRef=useRef(null);
  const locked=viewStage>p.stageIndex;
  const threshold=EcoData.PET_STAGES[viewStage].minExp;
  const next=Math.min(5,p.stageIndex+1);
  useEffect(()=>{
    const previous=document.activeElement;
    closeRef.current?.focus();
    function keyboard(e){
      if(e.key==='Escape'&&!e.defaultPrevented)onClose();
      if(e.key==='Tab'){
        const items=dialogRef.current?.querySelectorAll('button:not(:disabled),input,select,summary,a[href]');
        if(!items?.length)return;
        const first=items[0],last=items[items.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    }
    document.addEventListener('keydown',keyboard);
    return ()=>{document.removeEventListener('keydown',keyboard);previous?.focus?.();};
  },[]);
  useEffect(()=>{
    if(p.stageIndex>previousStage.current){
      setViewStage(p.stageIndex);setPlayToken(n=>n+1);setPlaying(true);
      setCelebration('新进化！'+profile.features[p.stageIndex]);
    }
    previousStage.current=p.stageIndex;
  },[p.stageIndex]);
  function choose(index){window.PetOwnerVoice?.stop();setViewStage(index);setPlayToken(0);setPlaying(false);setCelebration('');}
  function play(){
    setPlaying(true);setPlayToken(n=>n+1);
    onPetInteract?.({...row,pet:{...row.pet,displayStageIndex:viewStage}});
  }
  useEffect(()=>()=>window.PetOwnerVoice?.stop(),[]);
  function rename(){
    if(!requireAuth())return;
    const name=window.prompt('给 '+row.name+' 的神兽取个名字：',p.nickname||'');
    if(name!==null)setState(EcoData.setPetNickname(state,row.id,name.trim()));
  }
  const examples=(state.starTypes||[]).filter(type=>type.defaultStars>0&&['eco_recycle','academic','helpfulness'].includes(type.id));
  return <div className="evolution-backdrop" onClick={onClose}>
    <section className="evolution-dialog" hidden={signatureOpen} role="dialog" aria-modal="true" aria-labelledby="evolution-title" ref={dialogRef} onClick={e=>e.stopPropagation()} style={{'--evo-color':p.species.aura}}>
      <header className="evolution-header">
        <div><span className="evolution-eyebrow">我的神兽 · 成长图鉴</span><h2 id="evolution-title">{p.nickname||p.species.zh}</h2></div>
        <button ref={closeRef} className="evolution-close" onClick={onClose} aria-label="关闭神兽图鉴">×</button>
      </header>
      <div className="evolution-owner"><TeamBadge src={row.teamBadgeSrc} name={row.teamName} size={25}/><span>{row.name}<small>{row.teamName} · {profile.temperament}</small></span></div>
      {auditionClip&&<section className="child-voice-audition" aria-label="新版童趣声音试听">
        <b>童趣男声 · 新版样音</b><small>约 6 秒 · AI 合成声音 · 尚未替换各阶段对白</small>
        <button className="character-voice-preview" type="button" aria-pressed={auditionPlaying} onClick={()=>{
          if(auditionPlaying){window.PetOwnerVoice?.stop();return;}
          if(!window.EcoMythicAudio?.readPreference()){setVoiceStatus('乐园已静音，请先在乐园开启声音');return;}
          setVoiceStatus('正在载入新版童趣样音…');
          onPetInteract?.({...row,pet:{...row.pet,displayStageIndex:viewStage,voiceAction:'audition'}});
        }}>{auditionPlaying?'停止试听':'试听新版童趣音'}</button>
        <small>“{auditionClip.text}”</small>
        {voiceStatus&&<small role="status">{voiceStatus}</small>}
      </section>}
      {p.species.id==='hornbeetle'&&window.PetSignatureStage&&<button className="signature-entry" onClick={()=>{window.PetOwnerVoice?.stop();setPlayToken(0);setPlaying(false);setSignatureOpen(true);}}><span>新动作试演</span><b>虹翼之约</b><small>挥爪 · 展翼 · 摸摸回应 →</small></button>}
      <div className={'evolution-hero form-'+viewStage}>
        <span className="evolution-state-chip">{locked?'未来预览 · 尚未解锁':viewStage===p.displayStageIndex?'当前外形':'本月已达成'}</span>
        <span className="evolution-form-number">0{viewStage+1}<small>/ 06</small></span>
        <EvolvedBeast key={p.species.id+':'+viewStage} speciesId={p.species.id} stage={viewStage} className="evolution-hero-beast" alt={p.species.zh+' · '+profile.features[viewStage]} loading="eager" playToken={playToken} duration={performanceDuration} onFinished={()=>setPlaying(false)}/>
        <div className="evolution-hero-caption"><b>{PetEvolution.names[viewStage]}</b><span>{profile.features[viewStage]}</span></div>
      </div>
      <div className="evolution-stage-buttons" aria-label="选择进化阶段">
        {EcoData.PET_STAGES.map((s,i)=><button key={i} type="button" aria-pressed={viewStage===i} className={viewStage===i?'selected':''} onClick={()=>choose(i)}>
          <span>{PetEvolution.names[i]}</span><b>{s.minExp}</b><small>{i===p.displayStageIndex?'现在':i<=p.stageIndex?'已达成':'奖励卡'}</small>
        </button>)}
      </div>
      {window.PetOwnerVoice&&<p style={{textAlign:'center',fontSize:12,color:'#476353',margin:'8px 0'}}>
          “{PetOwnerVoice.greeting(row.name,viewStage,p.species.id)}”<br/><small>{characterClip?'中文角色配音 · 天角仙样音版':'每阶专属对白字幕 · 神兽短鸣随乐园静音设置'}</small><br/>
          {characterClip?<button className="character-voice-preview" type="button" onClick={()=>{if(!window.EcoMythicAudio?.readPreference()){setVoiceStatus('乐园已静音，请先在乐园开启声音');return;}onPetInteract?.({...row,pet:{...row.pet,displayStageIndex:viewStage}});}}>{auditionClip?'对比旧版阶段配音':'试听本阶段中文配音'}</button>:<button type="button" aria-pressed={deviceVoice} onClick={()=>setDeviceVoice(PetOwnerVoice.setDeviceEnabled(!deviceVoice))} style={{marginTop:6,minHeight:44,border:'1px solid #ccdace',borderRadius:22,padding:'8px 16px',background:'#f1f6ef',color:'#476353',font:'inherit'}}>系统朗读（非角色配音）：{deviceVoice?'开':'关'}</button>}
          {!auditionClip&&voiceStatus&&<small style={{display:'block',marginTop:4}} role="status">{voiceStatus}</small>}
      </p>}
      <button className="evolution-play" type="button" onClick={play} disabled={playing}>
        <span className="material-symbols-rounded" aria-hidden="true">{playing?'auto_awesome':'play_arrow'}</span>
        <span>{playing?'正在表演：':locked?'试播未来招式：':'表演给我看：'}{profile.acts[viewStage]}</span>
        <small>{Math.ceil(performanceDuration/1000)} 秒</small>
      </button>
      <div className="evolution-unlock-note" role="status">{celebration|| (locked?'再赚 '+Math.max(0,threshold-p.exp)+' 张奖励卡，解锁这个造型和招式。':'点它就能表演，奖励卡由老师确认后发放。')}</div>
      <section className="evolution-next" aria-label="下一阶段奖励">
        <img src={PetEvolution.asset(p.species.id,next)} alt="" loading="lazy"/>
        <div><small>本月 {p.exp} 张 · 当前{PetEvolution.names[p.displayStageIndex]}</small>
          <b>{p.isMaxStage?'传奇已达成，你的努力闪闪发光！':'再赚 '+p.expToNext+' 张 → '+profile.features[next]}</b>
          <span>{p.isMaxStage?'六种造型和六个专属表演已达成':'新招式：'+profile.acts[next]}</span>
          <div className="evolution-progress" role="progressbar" aria-label="下一阶段成长进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p.stageProgress*100)}><i style={{width:Math.round(p.stageProgress*100)+'%'}}/></div>
        </div>
        {!p.isMaxStage&&<button type="button" onClick={()=>choose(next)} aria-label="查看下一阶段">看</button>}
      </section>
      <details className="evolution-earn"><summary>今天可以怎样赚奖励卡？</summary>
        <div>{examples.map(type=><span key={type.id}>{type.zh}<b>参考 +{type.defaultStars}</b></span>)}</div>
        <p>做好环保、学习或助人行动，请老师确认。实际发卡数以老师记录为准；试播不会改变奖励卡。成长按现有本月规则计算，兑换奖品不会扣掉成长值。</p>
      </details>
      {p.isRegressed&&<p className="evolution-care-note">现在有点没精神，暂时显示上一阶段外形；成长值仍保留，获得新奖励卡就恢复。</p>}
      {authed&&<button type="button" className="evolution-rename" onClick={rename}>给神兽取名字</button>}
      {isAdmin&&<button type="button" className="evolution-rename" onClick={()=>setLibraryOpen(true)}>ADMIN · 从 50 种神兽中选伙伴</button>}
    </section>
    {libraryOpen&&isAdmin&&<BeastLibraryPicker state={state} setState={setState} studentId={row.id} isAdmin={isAdmin} onClose={()=>setLibraryOpen(false)}/>}
    {signatureOpen&&<PetSignatureStage row={row} onPetInteract={onPetInteract} onClose={()=>setSignatureOpen(false)}/>}
  </div>;
}
window.EvolutionDetailModal=EvolutionDetailModal;
