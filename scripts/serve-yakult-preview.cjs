// Preview server uses synthetic data on a separate origin, without CloudSync.
const http=require('http'),fs=require('fs'),path=require('path'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..');
const sources=[...fs.readFileSync(path.join(root,'build.cjs'),'utf8').matchAll(/^  '([^']+)',/gm)].map(m=>m[1]).filter(f=>!['app.jsx','cloud-sync.js'].includes(f));
sources.push('scripts/yakult-preview.jsx');
const html=`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Yakult 之星 · 隔离演示</title><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/pet-evolution.css"><link rel="stylesheet" href="/yakult.css"><style>.yakult-demo-nav{position:fixed;top:0;left:0;right:0;z-index:200;display:flex;align-items:center;gap:5px;background:#fff8ebf5;padding:7px;overflow:auto;color:#8c2b42;font:11px sans-serif}.yakult-demo-nav>span{white-space:nowrap}.yakult-demo-nav button{min-height:44px;white-space:nowrap;border:1px solid #d3b986;background:#fff9ed;border-radius:9px;padding:4px 10px;color:#653a35}.yakult-demo-main{padding:80px 20px 20px;max-width:1024px;margin:auto}.yakult-demo-main select{min-height:44px;margin:6px;padding:8px}.yakult-demo-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:24px}.yakult-demo-gallery article{display:grid;place-items:center;gap:30px;border-radius:22px;background:radial-gradient(ellipse at center,#3a6357,#13342f);padding:18px 8px 20px;color:#ffeaca;border:1px solid #c8ab6c}.yakult-demo-gallery article>span{font-size:12px}.yakult-demo-gallery article>strong{font-size:13px}.yakult-demo-actor{position:relative;width:140px;height:140px}.yakult-demo-actor .evolved-beast{width:100%;height:100%}@media(max-width:600px){.yakult-demo-gallery{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.yakult-demo-actor{width:110px;height:110px}.yakult-demo-main{padding-inline:12px}}</style><div id="root"></div><script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script><script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script><script src="/preview.js"></script></html>`;
const mime={'.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg'};
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');
  res.setHeader('Cache-Control','no-store');
  if(url.pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);return;}
  if(url.pathname==='/preview.js'){
    try{const code=sources.map(f=>`;(function(){${fs.readFileSync(path.join(root,f),'utf8')}\n})();`).join('\n');const out=await esbuild.transform(code,{loader:'jsx',target:['chrome100'],minify:false});res.setHeader('Content-Type','text/javascript; charset=utf-8');res.end(out.code);}catch(e){res.statusCode=500;res.end('Preview build failed');console.error(e.message);}return;
  }
  const filename=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!filename.startsWith(root+path.sep)){res.statusCode=403;res.end();return;}
  fs.readFile(filename,(error,data)=>{if(error){res.statusCode=404;res.end();return;}res.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');res.end(data);});
}).listen(8877,'127.0.0.1',()=>console.log('Isolated Yakult demo: http://127.0.0.1:8877/ (no cloud connection)'));
