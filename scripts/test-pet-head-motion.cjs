const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),sandbox={window:{},Math};vm.createContext(sandbox);
for(const file of ['data.js','hornbeetle-rig.jsx','pet-body-rigs.js','pet-feature-rigs.js','pet-living-profiles.js']){
 const source=fs.readFileSync(path.join(root,file),'utf8');
 vm.runInContext('(function(){"use strict";'+(file.endsWith('jsx')?esbuild.transformSync(source,{loader:'jsx'}).code:source)+'})();',sandbox);
}
sandbox.BeetleRig=sandbox.window.BeetleRig;
const {EcoData,PetLivingRig,PetFeatureRigs,BeetleRig}=sandbox.window;
assert.equal(Object.keys(PetFeatureRigs.headParts).length,50);
const channels=['earLeft','earRight','horn','feelerLeft','feelerRight'];
const neutral=Object.fromEntries(Object.keys(PetLivingRig.pose('qilin',1,0,null,true)).map(k=>[k,0]));
let forms=0,parts=0,minIdle=Infinity,minShow=Infinity;
const failures=[];
for(const {id} of EcoData.PET_SPECIES){
 assert.equal(PetFeatureRigs.headParts[id].length,5,id);
 assert.equal(PetLivingRig.get(id,0),null,'Unhatched eggs do not invent ears');
 for(let stage=1;stage<=5;stage++){
  const rig=PetLivingRig.get(id,stage);assert(rig.features.headParts.length,id+stage);forms++;
  const poses=[false,true].map(show=>Array.from({length:45},(_,i)=>{
   const full=PetLivingRig.pose(id,stage,i/10,show?i/44:null),p={...neutral};
   channels.forEach(k=>p[k]=full[k]);return p;
  }));
  assert(poses[0].some(p=>Math.abs(p.earLeft-p.earRight)>.1),'Ears are not mechanically synchronized');
  for(const part of rig.features.headParts){
   parts++;assert([...part.tip,...part.root,part.width].every(n=>Number.isFinite(n)&&n>=0&&n<=368));
   assert(Math.hypot(part.tip[0]-part.root[0],part.tip[1]-part.root[1])>4,'Real attachment length');
   const ranges=poses.map(samples=>{
    const points=samples.map(p=>BeetleRig.vertex(...part.tip,rig,p));
    return Math.hypot(Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))-Math.min(...points.map(p=>p[1])));
   });
   minIdle=Math.min(minIdle,ranges[0]);minShow=Math.min(minShow,ranges[1]);
   if(ranges[0]<3||ranges[1]<4)failures.push({id,stage,kind:part.kind,ranges});
  }
  const reduced=PetLivingRig.pose(id,stage,1,.4,true);
  assert(Object.values(reduced).every(n=>n===0),'Reduced motion stays still');
 }
}
assert.deepEqual(failures,[],'Each individual appendage moves without relying on head / body motion');
console.log(`PASS: ${forms} forms / ${parts} measured ear, horn and analogous head parts. Minimum isolated tip travel idle ${minIdle.toFixed(1)}px, tap ${minShow.toFixed(1)}px; 50 species; reduced motion.`);
