const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),s={window:{},Math};vm.createContext(s);
for(const f of ['data.js','hornbeetle-rig.jsx','pet-body-rigs.js','pet-feature-rigs.js','pet-living-profiles.js']){
 const text=fs.readFileSync(path.join(root,f),'utf8');vm.runInContext('(function(){'+(f.endsWith('jsx')?esbuild.transformSync(text,{loader:'jsx'}).code:text)+'})();',s);
}
s.BeetleRig=s.window.BeetleRig;const {EcoData,PetLivingRig,PetBodyRigs,PetFeatureRigs,BeetleRig}=s.window;
assert.equal(Object.keys(PetBodyRigs.limbs).length,50);assert.equal(Object.keys(PetFeatureRigs.briefs).length,50);let forms=0,wings=0,featureForms=0;const signatures=new Set();
for(const {id} of EcoData.PET_SPECIES){
 assert.equal(PetBodyRigs.limbs[id].length,5,id+' all five non-egg forms');
 assert.equal(PetLivingRig.get(id,0),null,id+' egg remains egg');
 for(let stage=1;stage<6;stage++){
  const rig=PetLivingRig.get(id,stage);assert(rig?.feet.length>=2,id+stage);assert(rig.features?.profile,id+' has a signed-off action brief');forms++;
  assert.strictEqual(rig,PetLivingRig.get(id,stage),'Rig is cached');
  for(const parts of [rig.feet,rig.wings])for(const part of parts)assert(part.every(n=>Number.isFinite(n)&&n>=0&&n<=368),id+' finite measured parts');
  const traces=[];let footRange=0,wingRange=0;
  const first=PetLivingRig.pose(id,stage,0);first.head=first.breathe=0;
  for(let i=0;i<=24;i++){
   const p=PetLivingRig.pose(id,stage,i/4);p.head=p.breathe=0;
   traces.push([p.wave,p.step,p.wing]);
   for(const [kind,parts] of [['feet',rig.feet],['wings',rig.wings]])for(const [x,y] of parts){
    const a=BeetleRig.vertex(x,y,rig,first),b=BeetleRig.vertex(x,y,rig,p),d=Math.hypot(a[0]-b[0],a[1]-b[1]);
    if(kind==='feet')footRange=Math.max(footRange,d);else wingRange=Math.max(wingRange,d);
   }
   for(const t of [0,.2,.5,.8,1]){
    const pose=PetLivingRig.pose(id,stage,i/4,t);assert(Object.values(pose).every(Number.isFinite));
    for(let y=0;y<=368;y+=46)for(let x=0;x<=368;x+=46){
     const [vx,vy]=BeetleRig.vertex(x,y,rig,pose);assert(Math.abs(vx-x)<=69&&Math.abs(vy-y)<72);
    }
   }
  }
  assert(footRange>4,id+' stage '+stage+' has visible non-face limb travel: '+footRange);
  const action=PetLivingRig.pose(id,stage,2.4,.25,false,true);
  assert(action.mouth>.1,id+' stage '+stage+' visibly opens its mouth during the animal call');
  const trait=rig.features.profile.primary;
  const key=trait==='tail'?'tail':trait==='paw'?'wave':trait==='fin'||trait==='tentacle'?'appendage':trait==='ornament'?'ornament':'head';
  const region=key==='head'?rig.features.head:key==='tail'?rig.features.tail:key==='appendage'?rig.features.appendage:key==='ornament'?rig.features.ornament:rig.feet[0];
  const probe=[region[0]+region[2]*.72,region[1]];
  const neutral={blink:0,head:0,breathe:0,wave:0,step:0,wing:0,happy:0,tail:0,appendage:0,ornament:0,mouth:0};
  const emphasized={...neutral,[key]:1};
  const from=BeetleRig.vertex(probe[0],probe[1],rig,neutral),to=BeetleRig.vertex(probe[0],probe[1],rig,emphasized);
  assert(Math.hypot(from[0]-to[0],from[1]-to[1])>2,id+' stage '+stage+' primary '+trait+' has visible travel');featureForms++;
  if(rig.wings.length){wings++;assert(wingRange>5,id+' stage '+stage+' wings actually fan: '+wingRange);}
  assert(Object.values(PetLivingRig.pose(id,stage,2,.5,true)).every(n=>n===0),'Reduced motion');
  signatures.add(JSON.stringify(traces));
 }
}
assert.equal(forms,250);assert.equal(featureForms,250);assert(signatures.size>=200,'Species and stages do not all use one motion');
const performance=fs.readFileSync(path.join(root,'pet-performance.jsx'),'utf8');
assert(!performance.includes("return <HornbeetleActor"),'Beetle uses the same full-body show pipeline');
console.log(`PASS: all 50 species / ${forms} bodies, ${wings} winged forms, ${featureForms} primary part actions, mouths, visible limb/wing travel, bounded poses, reduced motion, cached rigs.`);
