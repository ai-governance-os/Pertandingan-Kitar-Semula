const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),scope={window:{},Math};vm.createContext(scope);
vm.runInContext(esbuild.transformSync(fs.readFileSync(path.join(root,'pet-signature-stage.jsx'),'utf8'),{loader:'jsx'}).code,scope);
const api=scope.window.PetSignatureMotion;
assert(fs.statSync(path.join(root,api.atlas)).size>10000);
const signatures=new Set();
for(const [id,show] of Object.entries(api.shows)){
 assert(show.duration>=2000&&show.duration<=5000);assert.equal(show.frames[0],0);assert.equal(show.frames.at(-1),0);
 signatures.add(show.frames.join(','));
 for(let i=0;i<=200;i++){
  const p=api.pose(id,i/200);assert(Number.isInteger(p.frame)&&p.frame>=0&&p.frame<16);
  for(const key of ['x','y','scale','air'])assert(Number.isFinite(p[key]));
  assert(Math.abs(p.x)<=25&&Math.abs(p.y)<=51&&p.scale>=1&&p.scale<=1.045);
  const r=api.pose(id,i/200,true);assert.equal(r.x,0);assert.equal(r.y,0);assert.equal(r.scale,1);
 }
 for(const t of [0,1]){const p=api.pose(id,t);assert.equal(p.frame,0);assert(Math.abs(p.x)<1e-8&&Math.abs(p.y)<1e-8);}
}
assert.equal(signatures.size,3);
console.log('PASS: three distinct authored sequences; finite bounded poses, settled endpoints, reduced motion and bundled atlas.');
