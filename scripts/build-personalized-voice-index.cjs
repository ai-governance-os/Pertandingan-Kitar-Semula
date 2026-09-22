const fs=require('node:fs'),path=require('node:path');
function buildVoiceIndex(root=path.resolve(__dirname,'..')){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/voices/personalized/manifest.json'),'utf8'));
 const source=`// Generated from assets/voices/personalized/manifest.json. Recordings belong to students.\nwindow.PetPersonalizedVoices=(()=>{\n const students=${JSON.stringify(manifest.students)};\n function find(row,voice){\n  const owner=students[row?.id],pet=row?.pet;\n  if(!owner||!pet||owner.ownerName!==window.PetOwnerVoice?.name(row.name))return null;\n  const assigned=window.PetVoiceCatalog?.get(owner.voiceId);\n  if(!assigned||assigned.gender!==voice?.gender)return null;\n  const stage=Math.max(0,Math.min(5,Math.floor(Number(pet.displayStageIndex)||0))),clip=owner.stages[stage];\n  if(owner.voiceId===voice.id&&owner.speciesId===pet.species?.id&&clip?.text===window.PetOwnerVoice.greeting(row.name,stage,pet.species.id))return {...clip,voiceId:owner.voiceId};\n  // A species-neutral line in this student's recorded voice keeps pet swaps audible.\n  const fallback=owner.universal;\n  return fallback?.text?.startsWith(owner.ownerName+'主人，')?{...fallback,voiceId:owner.voiceId}:null;\n }\n return {find};\n})();\n`;
 fs.writeFileSync(path.join(root,'pet-personalized-voices.js'),source);
}
module.exports=buildVoiceIndex;
if(require.main===module)buildVoiceIndex();
