// Isolated preview only. Prove actual pixels move with every other channel off.
(()=>{
 window.petHeadPixelReview={running:true,forms:0};
 (async()=>{
 const channels=['earLeft','earRight','horn','feelerLeft','feelerRight'];
 const zero=Object.fromEntries(Object.keys(PetLivingRig.pose('qilin',1,0,null,true)).map(k=>[k,0]));
 const target=document.createElement('canvas');target.width=target.height=192;
 const ctx=target.getContext('2d',{willReadFrequently:true});
 const rows=[],failures=[];
 for(const species of EcoData.PET_SPECIES)for(let stage=1;stage<=5;stage++){
  const img=new Image();img.src=PetEvolution.asset(species.id,stage);await img.decode();
  const rig=PetLivingRig.get(species.id,stage),frames=[];
  // Deliberately low park-detail mesh, but the real tip vertices are retained.
  for(const time of [0,.8,1.7,2.8]){
   const full=PetLivingRig.pose(species.id,stage,time),pose={...zero};
   channels.forEach(k=>pose[k]=full[k]);BeetleRig.draw(ctx,img,rig,pose,{grid:8});
   frames.push(ctx.getImageData(0,0,192,192).data);
  }
  for(const [index,part] of rig.features.headParts.entries()){
   let changed=0,visible=0;
   const [tx,ty]=part.tip,[bx,by]=part.root,r=part.width;
   for(let y=0;y<192;y++)for(let x=0;x<192;x++){
    const sx=x/192*400-16,sy=y/192*400-16;
    if(sx<Math.min(tx,bx)-r||sx>Math.max(tx,bx)+r||sy<Math.min(ty,by)-r||sy>Math.max(ty,by)+r)continue;
    const k=(y*192+x)*4;
    if(frames.some(f=>f[k+3]>100))visible++;
    if(frames.slice(1).some(f=>Math.abs(f[k]-frames[0][k])+Math.abs(f[k+1]-frames[0][k+1])+Math.abs(f[k+2]-frames[0][k+2])+Math.abs(f[k+3]-frames[0][k+3])>60))changed++;
   }
   const row={id:species.id,stage,index,kind:part.kind,changed,visible};rows.push(row);
   if(changed<6||visible<10)failures.push(row);
  }
  window.petHeadPixelReview.forms++;
 }
 window.petHeadPixelReview={running:false,forms:250,parts:rows.length,rows,failures,minChangedPixels:Math.min(...rows.map(r=>r.changed))};
 })().catch(error=>{window.petHeadPixelReview={running:false,error:String(error)};});
 return 'Head pixel review started on isolated preview';
})();
