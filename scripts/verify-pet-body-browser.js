// Run only against the isolated lab using agent-browser eval --stdin.
// Actual canvas pixels, with blink/head/breathing disabled, prove body motion.
(async()=>{
 const failures=[],rows=[],begin=performance.now();
 const face=document.createElement('canvas');face.width=face.height=368;
 const fc=face.getContext('2d',{willReadFrequently:true});
 const target=document.createElement('canvas');target.width=target.height=384;
 const ctx=target.getContext('2d',{willReadFrequently:true});
 for(const species of EcoData.PET_SPECIES){
  for(let stage=1;stage<=5;stage++){
   const img=new Image();img.src=PetEvolution.asset(species.id,stage);await img.decode();
   fc.clearRect(0,0,368,368);fc.drawImage(img,0,0,368,368);
   const rig=PetLivingRig.get(species.id,stage),times=[.2,1.4,2.6],frames=[];
   for(const seconds of times){
    const pose=PetLivingRig.pose(species.id,stage,seconds);
    pose.head=pose.blink=pose.breathe=pose.happy=0;
    BeetleRig.draw(ctx,face,rig,pose,{grid:14});
    frames.push(ctx.getImageData(0,0,384,384).data);
   }
   const changed=parts=>{
    let count=0;
    for(let y=0;y<384;y++)for(let x=0;x<384;x++){
     const sx=x/384*400-16,sy=y/384*400-16;
     if(!parts.some(([px,py,rx,ry])=>((sx-px)/rx)**2+((sy-py)/ry)**2<1))continue;
     const k=(y*384+x)*4;
     if(frames.slice(1).some(b=>Math.abs(frames[0][k]-b[k])+Math.abs(frames[0][k+1]-b[k+1])+Math.abs(frames[0][k+2]-b[k+2])+Math.abs(frames[0][k+3]-b[k+3])>60))count++;
    }
    return count;
   };
   const feetPixels=changed(rig.feet),wingPixels=rig.wings.length?changed(rig.wings):null;
   rows.push({id:species.id,stage,feetPixels,wingPixels});
   if(feetPixels<45||wingPixels!==null&&wingPixels<80)failures.push(rows.at(-1));
  }
 }
 const result={forms:rows.length,failures,minFootPixels:Math.min(...rows.map(r=>r.feetPixels)),wingedForms:rows.filter(r=>r.wingPixels!==null).length,elapsed:Math.round(performance.now()-begin)};
 window.petBodyPixelReview={...result,rows};return JSON.stringify(result);
})();
