// Dokumen asli diambil dari satu revisi FastAPI. Tidak dijalankan saat aplikasi dibuka.
const base='http://127.0.0.1:8081/api';
const origin='http://127.0.0.1:5174';
const env=await Bun.file(new URL('../.env',import.meta.url)).text();
const settings=Object.fromEntries(env.split(/\r?\n/).filter(x=>x.includes('=')&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return[x.slice(0,i).trim(),x.slice(i+1)]}));
async function json(path:string,init:RequestInit={},cookie=''){
  const response=await fetch(base+path,{...init,headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(init.body instanceof FormData?{}:{'Content-Type':'application/json'}),...init.headers}});
  const data=await response.json();if(!response.ok)throw new Error(data.error||`HTTP ${response.status}`);
  return {data,cookie:response.headers.get('set-cookie')?.split(';')[0]||cookie};
}
async function text(url:string){const r=await fetch(url);if(!r.ok)throw new Error(`Sumber gagal HTTP ${r.status}: ${url}`);return await r.text()}
const login=await json('/auth/login',{method:'POST',body:JSON.stringify({email:settings.BOOTSTRAP_EMAIL,password:settings.BOOTSTRAP_PASSWORD})});
const commit=await fetch('https://api.github.com/repos/fastapi/fastapi/commits/master',{headers:{'User-Agent':'Ruang-Pengetahuan-Portfolio'}});
if(!commit.ok)throw new Error(`Manifest sumber gagal HTTP ${commit.status}`);
const sha=(await commit.json()).sha as string;
if(!/^[a-f0-9]{40}$/.test(sha))throw new Error('Revisi sumber tidak valid.');
const root=`https://raw.githubusercontent.com/fastapi/fastapi/${sha}/`;
const license=await text(root+'LICENSE');
if(!license.includes('MIT License'))throw new Error('Lisensi sumber berbeda. Impor dihentikan untuk pemeriksaan.');
const sources=[
  {path:'docs/en/docs/tutorial/background-tasks.md',title:'FastAPI · Background Tasks',query:'background tasks',reason:'Panduan resmi menjelaskan BackgroundTasks, penggunaan, dan caveat.',split:'holdout'},
  {path:'docs/en/docs/tutorial/cors.md',title:'FastAPI · Cross-Origin Resource Sharing',query:'CORS middleware',reason:'Panduan resmi menjelaskan origin dan konfigurasi CORSMiddleware.',split:'holdout'},
  {path:'docs/en/docs/tutorial/security/oauth2-jwt.md',title:'FastAPI · OAuth2 dan JWT',query:'OAuth2 JWT password',reason:'Panduan resmi membahas password hashing, OAuth2 dan JSON Web Tokens.',split:'holdout'},
  {path:'docs/en/docs/tutorial/sql-databases.md',title:'FastAPI · SQL Databases',query:'SQL databases session',reason:'Panduan resmi menunjukkan database relasional dan session SQLModel.',split:'tuning'},
];
const manifest:{url:string;title:string;sha256:string;documentId:string}[]=[];
const existing=(await json('/documents',{},login.cookie)).data as {id:string;title:string;source_url:string}[];
for(const s of sources){
  const content=await text(root+s.path);if(content.length<200)throw new Error('Sumber terlalu pendek.');
  const form=new FormData();form.set('file',new File([content],s.path.split('/').at(-1)!));form.set('title',s.title);form.set('category','Dokumentasi publik');form.set('visibility','workspace');form.set('sourceUrl',`https://github.com/fastapi/fastapi/blob/${sha}/${s.path}`);form.set('license','MIT · FastAPI, Sebastián Ramírez dan kontributor');
  const prior=existing.find(d=>d.title===s.title&&d.source_url.startsWith('https://github.com/fastapi/fastapi/blob/'));
  if(prior)form.set('documentId',prior.id);
  const {data}=await json('/documents',{method:'POST',body:form},login.cookie);
  await json('/evaluation/labels',{method:'POST',body:JSON.stringify({query:s.query,documentId:data.id,relevance:3,split:s.split,rationale:s.reason})},login.cookie);
  manifest.push({url:root+s.path,title:s.title,sha256:new Bun.CryptoHasher('sha256').update(content).digest('hex'),documentId:data.id});
  console.log(`${s.title}: ${data.status}, v${data.version}`);
}
await Bun.write(new URL('../.runtime/public-source-manifest.json',import.meta.url),JSON.stringify({repository:'fastapi/fastapi',revision:sha,fetchedAt:new Date().toISOString(),license,sources:manifest},null,2));
await json('/auth/logout',{method:'POST',body:'{}'},login.cookie);
console.log('Dokumen asli tersimpan. Label awal berjumlah kecil, bukan benchmark independen.');
