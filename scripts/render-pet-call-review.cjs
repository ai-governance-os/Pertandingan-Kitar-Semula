// Reproducible local audition of the exact runtime PCM; no cloud data or TTS.
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),scope={window:{},Math};vm.createContext(scope);
for(const f of ['pet-living-profiles.js','pet-cute-sounds.js'])vm.runInContext(`(function(){${fs.readFileSync(path.join(root,f),'utf8')}})()`,scope);
const rate=22050,ids=['sunlion','crystalowl','seakirin','hornbeetle'],parts=[];
for(const id of ids){parts.push(scope.window.PetCuteSounds.samples(id,2,rate));parts.push(new Float32Array(rate*.4));}
const count=parts.reduce((n,p)=>n+p.length,0),wav=Buffer.alloc(44+count*2);
wav.write('RIFF');wav.writeUInt32LE(36+count*2,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(count*2,40);
let offset=44;for(const part of parts)for(const x of part){wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,x))*.15*32767),offset);offset+=2;}
const dest=path.join(root,'audit','living-pets','call-comparison-v3.wav');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,wav);console.log(dest);
