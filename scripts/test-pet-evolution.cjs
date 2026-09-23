const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
function sandbox(source){
  const memory=new Map(),context={window:{},localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},console,Date,Math,crypto:require('crypto').webcrypto};
  vm.createContext(context);vm.runInContext(source,context);return {data:context.window.EcoData,context,memory};
}
const legacy=sandbox(cp.execFileSync('git',['show','1ac61b2:data.js'],{cwd:root,encoding:'utf8'}));
const updated=sandbox(fs.readFileSync(path.join(root,'data.js'),'utf8'));
const old=legacy.data.defaultState(),oldMap=legacy.data.petSpeciesMap(old);
const guande='dragons_lucas_lee_guan_teck';
old.pets[guande]={nickname:'小角'};
old.starLedger=[{id:'test-event',studentId:guande,stars:10,ts:Date.now()}];
updated.memory.set('eco_warrior_v2',JSON.stringify(old));
const migrated=updated.data.load(),newMap=updated.data.petSpeciesMap(migrated);
assert.equal(updated.data.PET_SPECIES.length,50);
assert.equal(new Set(updated.data.PET_SPECIES.map(s=>s.id)).size,50);
assert.equal(new Set(Object.values(newMap)).size,19);
assert.equal(newMap[guande],'hornbeetle');
for(const id of Object.keys(oldMap))if(id!==guande)assert.equal(newMap[id],oldMap[id],id);
const rosterIdentity=s=>s.teams.map(t=>({id:t.id,zh:t.zh,leaderId:t.leaderId,members:t.members.map(m=>({id:m.id,name:m.name}))}));
assert.equal(JSON.stringify(rosterIdentity(migrated)),JSON.stringify(rosterIdentity(old)),'Names and teams unchanged');
assert.equal(JSON.stringify(migrated.starLedger),JSON.stringify(old.starLedger));
assert.equal(migrated.pets[guande].nickname,'小角');
assert.equal(updated.data.petState(migrated,guande).stageIndex,0);
const other=Object.keys(newMap).find(id=>id!==guande),otherSpecies=newMap[other];
const swapped=updated.data.setPetSpecies(migrated,guande,otherSpecies);
assert.equal(updated.data.petSpeciesMap(swapped)[other],'hornbeetle');
assert.equal(updated.data.petSpeciesMap(swapped)[guande],otherSpecies);
assert.equal(new Set(Object.values(updated.data.petSpeciesMap(swapped))).size,19);
assert.equal(JSON.stringify(updated.data.load().pets),JSON.stringify(swapped.pets),'Reload does not reassign beetle');
assert.equal(JSON.stringify(swapped.starLedger),JSON.stringify(old.starLedger));
assert.equal(updated.data.setPetSpecies(swapped,guande,'invalid'),swapped);
assert.equal(updated.data.setPetSpecies(swapped,'missing','hornbeetle'),swapped);
for(const [stars,index] of [[0,0],[19,0],[20,1],[49,1],[50,2],[99,2],[100,3],[149,3],[150,4],[249,4],[250,5],[399,5],[400,6],[599,6],[600,7],[749,7],[750,8],[999,8],[1000,9]]){
  assert.equal(updated.data.petState({...migrated,starLedger:[{studentId:guande,stars,ts:Date.now()}]},guande).stageIndex,index);
}
const september=new Date(2026,8,30,12).getTime(),october=new Date(2026,9,1,12).getTime();
const august=new Date(2026,7,30,12).getTime();
const yearState={...migrated,starLedger:[{studentId:guande,stars:900,ts:august},{studentId:guande,stars:400,ts:september}],rewardRedemptions:[{studentId:guande,starsSpent:30,ts:september}]};
assert.equal(updated.data.studentStarBalance(yearState,guande,october),0,'monthly wallet resets');
assert.equal(updated.data.petState(yearState,guande,october).stageIndex,6,'growth begins in September and survives October reset');
assert.equal(updated.data.petState(yearState,guande,october).exp,400,'pre-September awards do not enlarge pets');
assert.equal(updated.data.petState({...yearState,starLedger:[{studentId:guande,stars:20,ts:'2026-09-02T00:00:00+08:00'}]},guande,october).exp,20,'ISO timestamps from imported records count');
const deducted={...yearState,starLedger:[...yearState.starLedger,{studentId:guande,stars:-1,ts:october}]};
assert.equal(updated.data.petState(deducted,guande,october).stageIndex,5,'teacher deduction can regress form');
assert.equal(updated.data.petState(yearState,guande,october+30*24*3600*1000).displayStageIndex,6,'hunger cannot regress form');
vm.runInContext(fs.readFileSync(path.join(root,'pet-evolution.js'),'utf8'),updated.context);
vm.runInContext(fs.readFileSync(path.join(root,'pet-ascension-data.js'),'utf8'),updated.context);
const evo=updated.context.window.PetEvolution;
for(const species of updated.data.PET_SPECIES){
  const profile=evo.profiles[species.id];assert(profile,species.id);
  assert.equal(new Set(profile.features).size,10,species.id+' forms');
  assert.equal(new Set(profile.acts).size,10,species.id+' acts');
  for(let stage=0;stage<10;stage++)for(const t of [0,.1,.4,.7,1]){
    const pose=evo.pose(species.id,stage,t);for(const n of ['x','y','angle','head','tail','wings'])assert(Number.isFinite(pose[n]));
  }
}
console.log('PASS: 50 species, 500 form/action definitions, 19 unique owners, swap/reload and all ten thresholds.');
for(const species of updated.data.PET_SPECIES)for(let stage=0;stage<10;stage++)for(const [width,height] of [[390,844],[320,568],[1440,900]]){
  const origin={x:width*.7,y:height*.65,scale:.6},size=Math.min(180,Math.max(100,width*.25));
  const first=evo.parkPose(species.id,stage,0,width,height,origin,size);
  const last=evo.parkPose(species.id,stage,1,width,height,origin,size);
  for(const key of ['x','y','scale']){assert(Math.abs(first[key]-origin[key])<.001);assert(Math.abs(last[key]-origin[key])<.001);}
  for(let i=0;i<=100;i++){
    const pose=evo.parkPose(species.id,stage,i/100,width,height,origin,size);
    assert(Number.isFinite(pose.x)&&Number.isFinite(pose.y)&&pose.scale>0);
    assert(Number.isFinite(pose.tilt||0)&&typeof pose.phase==='string');
    assert(pose.x>=0&&pose.x<=width&&pose.y>=0&&pose.y<=height);
    const still=evo.parkPose(species.id,stage,i/100,width,height,origin,size,true);
    assert.equal(still.x,origin.x);assert.equal(still.y,origin.y);assert.equal(still.scale,origin.scale);
  }
  if(stage>=2){
    const phases=[.12,.32,.64,.82].map(t=>evo.parkPose(species.id,stage,t,width,height,origin,size).phase);
    assert.deepEqual(phases,['accelerate','turn','hero','return'],species.id+' uses staged travel, not a uniform orbit');
    const departure=evo.parkPose(species.id,stage,.31,width,height,origin,size),hero=evo.parkPose(species.id,stage,.72,width,height,origin,size);
    assert(Math.hypot(departure.x-hero.x,departure.y-hero.y)>size*.12,species.id+' turns through a distinct hero location');
  }
}
console.log('PASS: all 500 park shows return to origin, stay in mobile/desktop bounds, use staged curved travel, and respect reduced motion.');
