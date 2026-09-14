// A small diagnostic strip; it never writes or alters the source artwork.
(async()=>{
 const examples=[['moonrabbit',1],['hornbeetle',5],['qilin',2],['jadeelephant',1]];
 const canvas=document.createElement('canvas');canvas.width=720;canvas.height=1000;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#dfebe5';ctx.fillRect(0,0,720,1000);
 const zero=Object.fromEntries(Object.keys(PetLivingRig.pose('qilin',1,0,null,true)).map(k=>[k,0]));
 for(const [row,[id,stage]] of examples.entries()){
  const img=new Image();img.src=PetEvolution.asset(id,stage);await img.decode();
  for(let col=0;col<3;col++){
   const p={...zero},level=[-1,0,1][col];
   for(const key of ['earLeft','earRight','horn','feelerLeft','feelerRight'])p[key]=level;
   ctx.save();ctx.translate(col*240,row*250);BeetleRig.draw(ctx,img,PetLivingRig.get(id,stage),p,{grid:14,size:240,clear:false});ctx.restore();
   ctx.fillStyle='#193b30';ctx.font='14px Arial';ctx.fillText(`${id} ${stage} / ${['fold','rest','perk'][col]}`,col*240+8,row*250+244);
  }
 }
 document.querySelector('#root').style.display='none';document.body.style.overflow='auto';document.body.append(canvas);
 return 'Review strip ready';
})();
