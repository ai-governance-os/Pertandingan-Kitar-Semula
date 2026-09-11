// Eye anchors measured on 192px contact sheets of the actual five forms.
// Tuples: visible eye x,y,r; optional second eye x,y,r. No invented extra eyes.
const PET_EYES = {
 qilin:[[80,85,8,118,77,7],[107,74,8,136,66,6],[82,60,3],[86,52,2],[135,58,2]],
 phoenix:[[80,76,7,119,68,6],[53,77,6,90,83,7],[54,53,4,75,58,2],[58,40,3,72,46,2],[62,49,2]],
 ninetail:[[78,79,7,115,87,7],[51,85,8,90,97,8],[117,65,5,142,72,4],[123,62,3,140,66,2],[105,73,4,122,65,3]],
 yinglong:[[97,72,7,132,65,5],[120,79,8,155,70,5],[100,42,4,113,49,2],[105,45,3],[104,43,2]],
 baize:[[79,69,6,115,63,6],[117,68,6,147,66,5],[99,55,4,114,62,2],[100,51,2],[107,57,2]],
 lingui:[[94,63,7,127,74,6],[72,72,8,107,85,6],[79,58,5,101,65,3],[118,50,2],[119,53,2]],
 stardeer:[[68,67,8,108,76,8],[102,85,8,136,77,6],[123,56,5,144,53,3],[136,53,3],[124,55,3]],
 cloudpard:[[79,66,6,115,54,6],[116,70,7,152,59,6],[129,38,4,153,42,3],[132,35,3,147,38,2],[143,36,3,158,40,2]],
 seakirin:[[95,72,7,129,79,5],[98,70,7,129,76,5],[100,52,4,122,56,3],[118,52,4,134,61,2],[134,63,3,147,71,2]],
 pixiu:[[76,65,8,120,77,8],[86,70,8,125,80,7],[64,58,6,94,67,5],[82,53,5,109,64,4],[124,69,5,151,80,4]],
 thunder:[[83,63,8,123,74,8],[101,72,8,139,65,6],[135,56,5,153,62,2],[114,57,3],[118,54,2]],
 bamboo:[[84,89,7,122,83,7],[82,93,8,120,104,8],[87,77,6,114,64,5],[84,62,5,108,61,4],[93,56,3,107,62,2]],
 zhuque:[[87,82,6,121,77,6],[115,94,6,145,84,5],[124,59,4,143,56,3],[103,45,3],[108,67,2]],
 xuanwu:[[84,74,8,135,70,5],[114,79,7,159,79,4],[129,72,5],[144,65,4],[137,61,3]],
 baihu:[[79,69,7,118,61,7],[102,70,7,140,61,6],[112,49,5,143,56,5],[65,30,2,85,32,2],[116,46,2,127,51,2]],
 qinglong:[[95,71,7,128,63,5],[101,76,7,129,62,5],[136,63,3],[112,59,2],[137,74,2]],
 griffin:[[92,66,8,129,59,5],[126,70,8,158,61,5],[140,39,5,157,47,2],[67,40,3,82,48,2],[112,53,2]],
 snowferret:[[86,63,6,125,50,5],[36,53,5,81,66,7],[45,45,3,68,52,3],[49,42,3,67,44,2],[142,39,3,126,42,2]],
 firemouse:[[69,68,6,109,74,6],[98,77,8,142,73,6],[109,64,7,144,63,5],[88,64,6,116,62,4],[81,74,5,108,78,3]],
 moonrabbit:[[95,91,6,128,84,5],[104,99,6,136,91,5],[50,59,2,70,63,3],[61,42,2,72,44,2],[96,40,2,113,47,2]],
 lotusotter:[[75,56,6,114,44,5],[114,62,5,148,55,4],[118,38,3,145,34,3],[113,24,3,135,22,2],[98,35,2,119,30,2]],
 coralpanda:[[79,64,4,112,73,4],[54,90,4,80,80,4],[82,52,4,103,61,3],[84,31,2,97,32,2],[58,64,2,76,65,2]],
 sunlion:[[88,65,6,124,59,6],[101,71,7,141,63,6],[129,50,4,153,52,3],[122,45,3,141,47,2],[120,50,3,140,51,2]],
 crystalowl:[[86,64,9,127,54,8],[77,70,10,116,57,9],[78,53,6,105,56,5],[72,42,4,96,39,4],[79,57,3,96,57,3]],
 mossbear:[[91,76,5,127,59,4],[108,66,5,140,56,4],[135,37,3,154,34,3],[107,24,3,124,26,2],[144,36,2,158,35,2]],
 lotusfrog:[[72,48,11,129,29,9],[87,63,13,154,34,10],[70,54,7,110,65,4],[89,20,6,125,32,4],[92,46,5,127,58,3]],
 aurorabutterfly:[[76,70,6,108,78,6],[99,93,8,138,84,8],[108,61,6,128,69,4],[101,53,4,120,50,3],[120,55,3,132,60,2]],
 ambermantis:[[88,73,8,120,69,6],[106,73,9,138,65,6],[105,52,6,126,60,4],[79,42,5,96,42,3],[104,53,4,122,53,3]],
 staghorn:[[82,79,8,124,74,7],[108,94,9,153,86,7],[109,69,7,142,64,4],[104,75,5,134,74,4],[109,76,5,135,74,4]],
 jewelspider:[[86,69,10,119,65,9],[99,74,12,138,69,11],[101,87,7,128,86,7],[60,53,7,84,56,7],[62,80,8,91,87,9]],
 honeybee:[[87,70,9,126,61,7],[108,87,11,154,86,8],[114,63,8,149,69,6],[91,56,6,119,60,4],[93,59,5,117,61,4]],
 maplehedgehog:[[95,71,5,130,66,4],[109,99,8,151,85,5],[107,60,5,136,58,3],[113,57,4,139,56,2],[115,67,4,140,66,2]],
 misttapir:[[72,60,6,120,68,6],[105,77,8,157,65,5],[76,57,5],[68,44,3],[59,52,3]],
 staraxolotl:[[86,72,5,129,66,4],[76,91,5,115,84,4],[80,69,4,112,65,3],[112,56,3,142,56,2],[112,63,3,140,63,2]],
 opaljelly:[[80,75,5,113,66,5],[80,69,6,114,58,5],[80,62,4,107,53,4],[77,57,3,101,51,3],[86,52,2,108,53,2]],
 tidemanta:[[75,50,8,119,64,6],[94,67,7,133,85,6],[114,58,4,135,69,3],[125,47,4,149,58,3],[122,62,3,141,70,2]],
 conchsquid:[[81,77,8,120,68,7],[85,97,9,127,89,8],[90,71,6,120,64,5],[99,69,5,126,66,4],[103,85,4,125,78,3]],
 silvercarp:[[90,69,8,137,81,7],[37,114,6,74,125,7],[82,57,6,113,50,3],[78,47,5,49,39,3],[64,59,5,91,64,2]],
 coconutcrab:[[75,39,10,122,25,9],[90,50,10,138,54,9],[95,67,5,121,66,5],[99,33,5,129,38,5],[98,51,5,130,54,4]],
 pebblepenguin:[[84,65,6,125,58,6],[82,72,7,127,65,6],[101,40,5,128,39,3],[101,33,4,123,33,2],[112,38,3,128,40,2]],
 sunmeerkat:[[81,58,8,120,42,8],[91,51,8,127,40,6],[118,33,5,141,29,4],[123,37,4,143,33,3],[120,38,4,140,34,3]],
 rainchameleon:[[85,63,12,140,48,10],[106,80,13,165,59,12],[131,54,9,170,46,6],[121,57,9,156,52,6],[96,68,7,123,65,4]],
 velvetbat:[[90,88,5,114,81,5],[79,88,5,108,96,5],[89,62,3,105,66,2],[112,60,2,121,64,2],[134,56,2,143,61,2]],
 blossomhorse:[[77,66,5,110,73,5],[108,69,6,141,61,4],[67,53,4,88,62,2],[44,43,2,58,50,2],[70,42,2,83,48,2]],
 jadeelephant:[[83,57,6,126,66,5],[91,70,6,134,75,5],[115,53,5,151,57,3],[85,51,4,121,57,3],[77,56,3,109,65,3]],
 sandsquirrel:[[100,72,7,137,83,6],[55,101,7,85,93,5],[136,66,6,168,61,5],[125,56,5,151,54,3],[129,57,4,152,54,4]],
 orchidlemur:[[86,59,8,116,56,7],[35,97,5,60,109,5],[138,43,5,157,42,3],[122,34,4,140,34,3],[130,53,3,145,49,3]],
 stormram:[[74,61,6,111,70,6],[73,69,6,109,79,6],[91,55,3,112,62,2],[125,45,2,139,50,2],[117,57,2]],
 roseflamingo:[[93,48,6,121,36,3],[99,55,7,133,44,3],[114,34,4],[114,23,3],[113,30,3]],
};
const PET_LIVING_FAMILIES={
 bird:'phoenix thunder zhuque crystalowl roseflamingo griffin',
 wing:'yinglong aurorabutterfly honeybee velvetbat staghorn',
 water:'seakirin xuanwu staraxolotl tidemanta silvercarp',
 tentacle:'opaljelly conchsquid',
 insect:'hornbeetle ambermantis jewelspider coconutcrab',
 bouncy:'moonrabbit firemouse sandsquirrel lotusfrog maplehedgehog',
 gentle:'baize mossbear jadeelephant misttapir stormram bamboo',
};
function livingFamily(id){return Object.keys(PET_LIVING_FAMILIES).find(k=>PET_LIVING_FAMILIES[k].split(' ').includes(id))||'beast';}
function livingSeed(id){return [...id].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,7);}
const livingRigCache=new Map();
function livingRig(id,stage){
 const key=id+':'+stage;if(livingRigCache.has(key))return livingRigCache.get(key);
 const beetle=id==='hornbeetle'?window.BeetleRig?.rigs[stage]:null;
 const anchors=PET_EYES[id]?.[stage-1];if(!anchors&&!beetle)return null;
 const factor=368/192,eyes=[];
 if(beetle)eyes.push(...beetle.eyes);else for(let i=0;i<anchors.length;i+=3)eyes.push([anchors[i]*factor,anchors[i+1]*factor,anchors[i+2]*factor,anchors[i+2]*factor*1.12]);
 const hx=eyes.reduce((s,e)=>s+e[0],0)/eyes.length,hy=eyes.reduce((s,e)=>s+e[1],0)/eyes.length;
 const family=livingFamily(id),small=stage<3,headRadius=small?90:60;
 const tips=window.PetBodyRigs?.limbs[id]?.[stage-1];if(!tips)return null;
 const feet=[];
 for(let i=0;i<tips.length;i+=2){
  const x=tips[i]*factor,y=tips[i+1]*factor;
  const radius=stage===1?14:family==='tentacle'?22:family==='insect'||id==='hornbeetle'?16:15;
  feet.push([x,y,radius*factor,(stage===1?17:27)*factor,x,y-(stage===1?16:25)*factor]);
 }
 const wings=(window.PetBodyRigs?.wings[id]?.[stage-1]||[]).map(p=>p.map(v=>v*factor));
 const rig={head:beetle?.head||[hx,hy,headRadius,headRadius],eyes,feet,wings,skin:beetle?.skin||'#ded3b6',family,seed:livingSeed(id),hatchling:stage===1};
 livingRigCache.set(key,rig);return rig;
}
function livingPose(id,stage,seconds,show=null,reduced=false,walking=false){
 const seed=livingSeed(id),offset=(seed%173)/31,family=livingFamily(id);
 const p=BeetleRig.pose(stage,seconds+offset,show,reduced,walking);
 if(reduced)return p;
 const active=show!==null,g=active?Math.sin(Math.PI*Math.max(0,Math.min(1,show))):1;
 const beat=active?show*Math.PI*(4+stage+seed%3):(seconds+offset)*(walking?5.5+stage*.13:2.8+(seed%5)*.14+stage*.17);
 const idleGreeting=.5+.5*Math.sin((seconds+offset)*2.05);
 // Different amplitudes / cadence for all five bodies. Idle motion is visible
 // too: a paw lifts, joints rotate and wings fan from their actual shoulders.
 p.head=Math.sin(beat*.45)*(active?.12*g:.055);
 p.wave=active?g*([0,.8,1.05,1.35,1.15,1.5][stage])*(.7+.3*Math.sin(beat)):idleGreeting*(stage===1?.62:.36);
 p.step=stage===1?0:Math.sin(beat)*(active?1.35*g:walking?1.05:.72);
 p.breathe=Math.sin(beat*.5)*(active?2.2*g:1.6);
 p.wing=Math.sin(beat*(family==='wing'?1.45:1))*(active?1.6*g:walking?1.1:.85);
 if(family==='gentle'){p.head*=.7;p.wave*=1.05;p.step*=.85;}
 if(family==='bouncy'){p.step*=1.15;p.wave*=1.1;}
 if(family==='tentacle'){p.wave=0;p.step=Math.sin(beat)*g*1.25;}
 if(family==='water'){p.wave*=.4;p.wing*=1.1;}
 if(family==='bird'){p.wave*=.25;}
 if(stage===1){p.step=0;p.head*=.75;p.wing*=.65;p.wave=active?g*(.9+.35*Math.sin(beat)):idleGreeting*.95;}
 return p;
}
window.PetLivingRig={eyes:PET_EYES,get:livingRig,pose:livingPose,family:livingFamily,seed:livingSeed};
