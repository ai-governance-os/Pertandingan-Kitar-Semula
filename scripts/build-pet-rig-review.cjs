// Diagnostic contact sheets only; original artwork is never changed.
const fs=require('fs'),path=require('path'),vm=require('vm');
const sharp=require(require.resolve('sharp',{paths:[process.env.PET_REVIEW_NODE_MODULES||path.join(__dirname,'../node_modules')]}));
const root=path.resolve(__dirname,'..'),out=path.join(root,'audit/living-pets');
const ctx={window:{},console};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),ctx);
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const species=ctx.window.EcoData.PET_SPECIES.filter(s=>s.id!=='hornbeetle');
 for(let page=0;page<Math.ceil(species.length/5);page++){
  const entries=species.slice(page*5,page*5+5),layers=[],labels=[];
  for(let row=0;row<entries.length;row++)for(let stage=1;stage<=5;stage++){
   const s=entries[row],x=(stage-1)*192,y=row*210;
   layers.push({input:await sharp(path.join(root,'assets/pet-park/evolution',s.id,stage+'.webp')).resize(192,192).png().toBuffer(),left:x,top:y});
   labels.push(`<text x="${x+6}" y="${y+206}" font-size="13" font-family="Arial" fill="#122b25">${s.id} ${stage}</text>`);
  }
  const bg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="${entries.length*210}"><rect width="100%" height="100%" fill="#dce5df"/>${labels.join('')}</svg>`);
  await sharp(bg).composite(layers).png().toFile(path.join(out,'faces-'+page+'.png'));
 }
 console.log('10 diagnostic contact sheets ready');
}
main().catch(e=>{console.error(e);process.exitCode=1});
