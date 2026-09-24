function DetailGameCrown(){const Crown=window.GameCrown;return Crown?<span className="park-game-crown"><Crown small/></span>:null;}
function EvolutionDetailModal({state,setState,row,authed,isAdmin=false,requireAuth,onClose,onPetInteract}) {
  const {useState,useEffect,useRef}=React;
  const p=row.pet,profile=PetEvolution.profile(p.species.id);
  const [viewStage,setViewStage]=useState(p.stageIndex);
  const [playToken,setPlayToken]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [celebration,setCelebration]=useState('');
  const [libraryOpen,setLibraryOpen]=useState(false);
  const [signatureOpen,setSignatureOpen]=useState(false);
  const [voiceStatus,setVoiceStatus]=useState('');
  const {voiceGender,voiceId}=EcoData.petState(state,row.id);
  const voiceRow={...row,pet:{...row.pet,voiceGender,voiceId,displayStageIndex:viewStage}};
  const voicePack=window.PetCharacterVoice?.resolve(voiceRow);
  const voiceRecording=window.PetCharacterVoice?.recording(voiceRow);
  const heroRef=useRef(null);
  const performanceDuration=[3000,3400,3800,4200,4500,5000,5200,5400,5600,5800][viewStage];
  useEffect(()=>{
    setVoiceStatus('');
    const changed=e=>{
      if(e.detail.id!==p.species.id)return;
      setVoiceStatus(e.detail.state==='playing'?'神兽正在鸣叫':'');
    };
    const voiced=e=>{
      if(e.detail.studentId!==row.id||e.detail.stage!==viewStage)return;
      setVoiceStatus(({loading:'正在准备声音…',playing:'神兽正在说话',error:'语音暂时无法播放，已尝试恢复鸣叫'})[e.detail.state]||'');
    };
    window.addEventListener('pet-creature-call',changed);window.addEventListener('pet-character-voice',voiced);
    return()=>{window.removeEventListener('pet-creature-call',changed);window.removeEventListener('pet-character-voice',voiced);};
  },[row.id,viewStage,p.species.id,voiceGender,voiceId]);
  const previousStage=useRef(p.stageIndex),dialogRef=useRef(null),closeRef=useRef(null);
  const locked=viewStage>p.stageIndex;
  const threshold=EcoData.PET_STAGES[viewStage].minExp;
  const next=Math.min(EcoData.PET_STAGES.length-1,p.stageIndex+1);
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
    heroRef.current?.scrollIntoView({block:'center',behavior:'auto'});
    setPlaying(true);setPlayToken(n=>n+1);
    onPetInteract?.(voiceRow);
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
      {p.species.id==='hornbeetle'&&window.PetSignatureStage&&<button className="signature-entry" onClick={()=>{window.PetOwnerVoice?.stop();setPlayToken(0);setPlaying(false);setSignatureOpen(true);}}><span>新动作试演</span><b>虹翼之约</b><small>挥爪 · 展翼 · 摸摸回应 →</small></button>}
      <div ref={heroRef} className={'evolution-hero form-'+viewStage+(row.yakult?.winner?' yakult-crowned':'')+(row.yakult?.winner&&row.gameWinner?' dual-crowned':'')}>
        <span className="evolution-state-chip">{locked?'未来预览 · 尚未解锁':viewStage===p.displayStageIndex?'当前外形':'已达成'}</span>
        <span className="evolution-form-number">{String(viewStage+1).padStart(2,'0')}<small>/ {EcoData.PET_STAGES.length}</small></span>
        <div className="yakult-evolution-actor"><EvolvedBeast key={p.species.id+':'+viewStage} speciesId={p.species.id} stage={viewStage} className="evolution-hero-beast" alt={p.species.zh+' · '+profile.features[viewStage]} loading="eager" playToken={playToken} duration={performanceDuration} motionScale={.35} onFinished={()=>setPlaying(false)}/>{row.yakult?.winner && <YakultEquipment key={'yakult-'+playToken+':'+viewStage} stage={viewStage} celebrate={playing}/>}{row.gameWinner&&<DetailGameCrown/>}</div>
        <button className="evolution-hero-trigger" type="button" aria-label={playing?'神兽正在表演':'点击神兽播放动作'} disabled={playing} onClick={play}/>
        <div className="evolution-hero-caption"><b>{PetEvolution.names[viewStage]}</b><span>{profile.features[viewStage]} · {viewStage===0?'点阶段预览孵化后的动作':'点我看手脚动作'}</span></div>
      </div>
      <div className="evolution-stage-buttons" aria-label="选择进化阶段">
        {EcoData.PET_STAGES.map((s,i)=><button key={i} type="button" aria-pressed={viewStage===i} className={viewStage===i?'selected':''} onClick={()=>choose(i)}>
          <span>{PetEvolution.names[i]}</span><b>{s.minExp}</b><small>{i===p.displayStageIndex?'现在':i<=p.stageIndex?'已达成':'奖励卡'}</small>
        </button>)}
      </div>
      {window.PetOwnerVoice&&<p style={{textAlign:'center',fontSize:12,color:'#476353',margin:'8px 0'}}>
          “{PetOwnerVoice.line(voiceRow)}”<br/><small>{voiceRecording?voiceRecording.label+' · 专属对白':'对白字幕 · '+(window.PetCuteSounds?.profile(p.species.id,viewStage).label||'动物鸣叫')}</small><br/>
          <button className="character-voice-preview" type="button" onClick={()=>{if(!window.EcoMythicAudio?.readPreference()){setVoiceStatus('乐园已静音，请先在乐园开启声音');return;}onPetInteract?.(voiceRow);}}>{voiceRecording?'听宠物说话':'听听本阶段鸣叫'}</button>
          {voiceStatus&&<small style={{display:'block',marginTop:4}} role="status">{voiceStatus}</small>}
      </p>}
      {isAdmin&&<div className="pet-voice-setting"><label className="pet-voice-field">宠物声音
        <select aria-label="宠物声音" value={voiceGender} onChange={e=>{if(!requireAuth())return;window.PetOwnerVoice?.stop();setState(EcoData.setPetVoiceGender(state,row.id,e.target.value));}}>
          <option value="">待设置 · 保留鸣叫</option><option value="male">男生 · 男声</option><option value="female">女生 · 女声</option>
        </select>
        </label>
        {voiceGender&&<label className="pet-voice-field">专属音色
          <select aria-label="专属音色" value={voicePack?.id||''} onChange={e=>{if(!requireAuth())return;window.PetOwnerVoice?.stop();setState(EcoData.setPetVoice(state,row.id,e.target.value));}}>
            {window.PetVoiceCatalog.list(voiceGender).map(voice=><option key={voice.id} value={voice.id}>{voice.label}{voice.reviewed?'':' · 新样板'}</option>)}
          </select>
        </label>}
        <small>每位学生可选不同音色；换宠物、进化后保留选择。</small>
        <a href="pet-voice-preview.html" target="_blank" rel="noopener noreferrer" onClick={()=>window.PetOwnerVoice?.stop()}>比较全部童声样板 ↗</a>
      </div>}
      <button className="evolution-play" type="button" onClick={play} disabled={playing}>
        <span className="material-symbols-rounded" aria-hidden="true">{playing?'auto_awesome':'play_arrow'}</span>
        <span>{playing?'正在表演：':locked?'试播未来招式：':'表演给我看：'}{profile.acts[viewStage]}</span>
        <small>{Math.ceil(performanceDuration/1000)} 秒</small>
      </button>
      <div className="evolution-unlock-note" role="status">{celebration|| (locked?'再赚 '+Math.max(0,threshold-p.exp)+' 张奖励卡，解锁这个造型和招式。':'点它就能表演，奖励卡由老师确认后发放。')}</div>
      <section className="evolution-next" aria-label="下一阶段奖励">
        <img src={PetEvolution.asset(p.species.id,next)} alt="" loading="lazy"/>
        <div><small>9 月起累计 {p.exp} 张 · 当前{PetEvolution.names[p.displayStageIndex]}</small>
          <b>{p.isMaxStage?'神话已达成，你的努力闪闪发光！':'再赚 '+p.expToNext+' 张 → '+profile.features[next]}</b>
          <span>{p.isMaxStage?'十种造型和十个专属表演已达成':'新招式：'+profile.acts[next]}</span>
          <div className="evolution-progress" role="progressbar" aria-label="下一阶段成长进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p.stageProgress*100)}><i style={{width:Math.round(p.stageProgress*100)+'%'}}/></div>
        </div>
        {!p.isMaxStage&&<button type="button" onClick={()=>choose(next)} aria-label="查看下一阶段">看</button>}
      </section>
      <details className="evolution-earn"><summary>今天可以怎样赚奖励卡？</summary>
        <div>{examples.map(type=><span key={type.id}>{type.zh}<b>参考 +{type.defaultStars}</b></span>)}</div>
        <p>做好环保、学习或助人行动，请老师确认。实际发卡数以老师记录为准；试播不会改变奖励卡。神兽从 2026 年 9 月开始累计成长；管理员结算奖卡和兑换奖品不会让它退化，扣卡则会影响成长值。</p>
      </details>
      <YakultPetHonour row={row} state={state}/>
      {authed&&<button type="button" className="evolution-rename" onClick={rename}>给神兽取名字</button>}
      {isAdmin&&<button type="button" className="evolution-rename" onClick={()=>setLibraryOpen(true)}>ADMIN · 从 50 种神兽中选伙伴</button>}
    </section>
    {libraryOpen&&isAdmin&&<BeastLibraryPicker state={state} setState={setState} studentId={row.id} isAdmin={isAdmin} onClose={()=>setLibraryOpen(false)}/>}
    {signatureOpen&&<PetSignatureStage row={row} onPetInteract={onPetInteract} onClose={()=>setSignatureOpen(false)}/>}
  </div>;
}
window.EvolutionDetailModal=EvolutionDetailModal;
