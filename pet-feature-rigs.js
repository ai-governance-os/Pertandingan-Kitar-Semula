// A signed-off action brief for every library species. `primary` is the body
// part a child should notice first on tap; `secondary` follows a beat later.
// Coordinates are derived from each form's measured eyes/limbs, so the same
// identity can mature through all five non-egg forms without a generic shake.
const PET_ACTION_BRIEFS={
 qilin:['horn','mane'],phoenix:['tail','crest'],ninetail:['tail','ornament'],yinglong:['crest','tail'],baize:['horn','ornament'],
 lingui:['horn','ornament'],stardeer:['horn','tail'],cloudpard:['tail','paw'],seakirin:['tail','fin'],pixiu:['tail','ornament'],
 thunder:['crest','tail'],bamboo:['crest','ornament'],zhuque:['tail','crest'],xuanwu:['fin','tail'],baihu:['tail','paw'],
 qinglong:['tail','horn'],griffin:['tail','crest'],snowferret:['tail','ear'],firemouse:['ear','tail'],hornbeetle:['horn','antenna'],
 moonrabbit:['ear','paw'],lotusotter:['tail','paw'],coralpanda:['tail','paw'],sunlion:['mane','tail'],crystalowl:['crest','tail'],
 mossbear:['paw','ornament'],lotusfrog:['throat','paw'],aurorabutterfly:['antenna','tail'],ambermantis:['paw','antenna'],staghorn:['horn','paw'],
 jewelspider:['paw','ornament'],honeybee:['antenna','tail'],maplehedgehog:['crest','paw'],misttapir:['snout','tail'],staraxolotl:['crest','tail'],
 opaljelly:['tentacle','ornament'],tidemanta:['fin','tail'],conchsquid:['tentacle','ornament'],silvercarp:['tail','fin'],coconutcrab:['paw','ornament'],
 pebblepenguin:['fin','paw'],sunmeerkat:['tail','paw'],rainchameleon:['tail','crest'],velvetbat:['ear','tail'],blossomhorse:['tail','mane'],
 jadeelephant:['snout','ear'],sandsquirrel:['tail','paw'],orchidlemur:['tail','paw'],stormram:['horn','ornament'],roseflamingo:['tail','fin']
};
const FEATURE_SIDE={
 phoenix:-1,ninetail:1,yinglong:-1,stardeer:1,cloudpard:-1,seakirin:1,pixiu:-1,thunder:-1,zhuque:1,xuanwu:-1,baihu:-1,qinglong:-1,
 griffin:-1,snowferret:1,firemouse:1,moonrabbit:-1,lotusotter:-1,coralpanda:1,sunlion:1,crystalowl:1,staraxolotl:1,opaljelly:1,
 tidemanta:-1,conchsquid:1,silvercarp:-1,pebblepenguin:1,sunmeerkat:-1,rainchameleon:1,velvetbat:1,blossomhorse:1,jadeelephant:-1,
 sandsquirrel:1,orchidlemur:-1,stormram:1,roseflamingo:1
};
const BEAKS=new Set('phoenix thunder zhuque crystalowl griffin pebblepenguin roseflamingo'.split(' '));
const MANDIBLES=new Set('hornbeetle ambermantis staghorn jewelspider honeybee coconutcrab'.split(' '));
function featureProfile(id){
 const pair=PET_ACTION_BRIEFS[id];return pair?{primary:pair[0],secondary:pair[1],side:FEATURE_SIDE[id]||-1,mouth:BEAKS.has(id)?'beak':MANDIBLES.has(id)?'mandible':id==='lotusfrog'?'frog':'smile'}:null;
}
function featureRig(id,stage,eyes,feet,wings){
 const profile=featureProfile(id);if(!profile||!eyes.length)return null;
 const ex=eyes.reduce((n,e)=>n+e[0],0)/eyes.length,ey=eyes.reduce((n,e)=>n+e[1],0)/eyes.length;
 const er=Math.max(...eyes.map(e=>e[2]));const side=profile.side;
 const footY=feet.length?feet.reduce((n,e)=>n+e[1],0)/feet.length:ey+er*5;
 const head=[ex,Math.max(er*1.4,ey-er*2.5),Math.max(20,er*2.7),Math.max(18,er*2.1),ex,ey+er*.2];
 const ornament=[ex,Math.min(330,ey+Math.max(er*4.2,(footY-ey)*.48)),Math.max(18,er*2.5),Math.max(18,er*2.1),ex,ey+er*2.5];
 const tail=[Math.max(18,Math.min(350,ex+side*Math.max(46,er*7))),Math.min(335,Math.max(ey+er*3,footY-er*.7)),Math.max(28,er*3.6),Math.max(25,er*3.2),ex+side*Math.max(15,er*2.2),ey+er*2.8];
 const appendage=wings.length?wings[0]:tail;
 const mouth=[ex+side*er*.18,ey+er*2.15,Math.max(5,er*.8),Math.max(3.5,er*.52)];
 return {profile,mouth,head,ornament,tail,appendage};
}
window.PetFeatureRigs={briefs:PET_ACTION_BRIEFS,profile:featureProfile,get:featureRig};
