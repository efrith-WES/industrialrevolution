// Industrial Revolution Marketplace — tiny classroom server (no dependencies).
// Run:  TEACHER_PIN=mysecret node server.js     then open http://localhost:3000
const http=require('http'),fs=require('fs'),path=require('path');
const PORT=process.env.PORT||3000,PIN=process.env.TEACHER_PIN||'1234',F=path.join(__dirname,'data.json');
let S={game:null,teams:{}},v=1;
try{S=JSON.parse(fs.readFileSync(F,'utf8'))}catch(e){}
let t0;const save=()=>{clearTimeout(t0);t0=setTimeout(()=>fs.writeFile(F,JSON.stringify(S),()=>{}),500)};
const page=fs.readFileSync(path.join(__dirname,'index.html'));
http.createServer((req,res)=>{
 const u=new URL(req.url,'http://x');
 const send=(c,o)=>{res.writeHead(c,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(o))};
 if(req.method==='GET'&&u.pathname==='/api/state')return send(200,+u.searchParams.get('v')===v?{v}:{v,s:S});
 if(req.method==='POST'&&u.pathname==='/api/op'){let b='';
  req.on('data',d=>{b+=d;if(b.length>3e5)req.destroy()});
  req.on('end',()=>{try{
   const o=JSON.parse(b),teacher=req.headers['x-pin']===PIN,[col,id]=String(o.path||'').split('/');
   if(o.op==='auth')return teacher?send(200,{v}):send(403,{error:'Wrong PIN'});
   if(col==='game'){if(!teacher)return send(403,{error:'Teacher PIN required'});
    if(o.op==='set')S.game=o.data;else if(o.op==='update')S.game={...S.game,...o.data};else if(o.op==='delete')S.game=null;else return send(400,{error:'bad op'})}
   else if(col==='teams'&&id){const cur=S.teams[id];
    if(o.op==='delete'){if(!teacher)return send(403,{error:'Teacher only'});delete S.teams[id]}
    else if(o.op==='set'){if(cur&&!teacher)return send(403,{error:'Exists'});if(!cur&&Object.keys(S.teams).length>=200)return send(400,{error:'Game full'});
     const d=o.data;if(!teacher){d.earned=0;d.spent=0;delete d.lc}S.teams[id]=d}
    else if(o.op==='update'){if(!cur)return send(404,{error:'No such company'});const d={...o.data};if(!teacher){delete d.earned;delete d.lc}S.teams[id]={...cur,...d}}
    else return send(400,{error:'bad op'})}
   else return send(400,{error:'bad path'});
   v++;save();send(200,{v,s:S});
  }catch(e){send(400,{error:e.message})}});return}
 res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(page);
}).listen(PORT,()=>console.log('Marketplace running on http://localhost:'+PORT+'  Teacher PIN: '+PIN+(PIN==='1234'?'  (default! set TEACHER_PIN)':'')));
