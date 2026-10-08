import {documents,judgments,company,simulation,balances} from '../demo/company';
const settings=Object.fromEntries((await Bun.file(new URL('../.env',import.meta.url)).text()).split(/\r?\n/).filter(x=>x.includes('=')&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return[x.slice(0,i).trim(),x.slice(i+1)]}));
const base='http://127.0.0.1:8081/api',origin=settings.APP_ORIGIN;
async function request(path:string,init:RequestInit={},cookie=''){
  const r=await fetch(base+path,{...init,headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(init.body instanceof FormData?{}:{'Content-Type':'application/json'}),...init.headers}});
  const data=await r.json();if(!r.ok)throw new Error(`${path}: ${data.error||r.status}`);
  return {data,cookie:r.headers.get('set-cookie')?.split(';')[0]||cookie};
}
if(balances.totalAssets!==balances.totalLiabilitiesAndEquity)throw new Error('Ledger tidak seimbang, impor dibatalkan.');
const login=await request('/auth/login',{method:'POST',body:JSON.stringify({email:settings.BOOTSTRAP_EMAIL,password:settings.BOOTSTRAP_PASSWORD})});
try{
  const existing=(await request('/documents',{},login.cookie)).data as {id:string;title:string;source_url:string;license:string;owner_id:string}[];
  const ids=new Map<string,string>(),manifest=[];
  // Upload corpus baru lebih dulu. Jika ada kegagalan, dokumen lama belum dihapus.
  for(const d of documents){
    const prior=existing.find(x=>x.title===d.title&&x.license==='Data simulasi PLN · corpus perusahaan fiktif');
    const form=new FormData();form.set('file',new File([d.content],d.key+'.md'));form.set('title',d.title);form.set('category',d.category);form.set('visibility','workspace');form.set('license','Data simulasi PLN · corpus perusahaan fiktif');if(prior)form.set('documentId',prior.id);
    const {data}=await request('/documents',{method:'POST',body:form},login.cookie);ids.set(d.key,data.id);
    manifest.push({key:d.key,title:d.title,documentId:data.id,sha256:new Bun.CryptoHasher('sha256').update(d.content).digest('hex'),status:data.status,version:data.version});
    console.log(`${d.title}: ${data.status}, v${data.version}`);
  }
  for(const label of judgments)await request('/evaluation/labels',{method:'POST',body:JSON.stringify({query:label.query,documentId:ids.get(label.key),relevance:3,split:label.split,rationale:label.rationale})},login.cookie);
  // Hanya corpus FastAPI yang sebelumnya diimpor otomatis, bukan upload pribadi pengguna.
  const actor=(await request('/auth/me',{},login.cookie)).data;
  for(const old of existing.filter(d=>d.owner_id===actor.id&&d.source_url.startsWith('https://github.com/fastapi/fastapi/blob/')&&d.title.startsWith('FastAPI ·'))){
    await request('/documents/'+old.id,{method:'DELETE'},login.cookie);console.log('Corpus lama dihapus: '+old.title);
  }
  await Bun.write(new URL('../.runtime/company-manifest.json',import.meta.url),JSON.stringify({company,simulation,importedAt:new Date().toISOString(),balances,documents:manifest},null,2));
  console.log(`${documents.length} dokumen perusahaan fiktif tersimpan. File asli tersedia di demo/company.ts dan unduhan aplikasi.`);
}finally{await request('/auth/logout',{method:'POST',body:'{}'},login.cookie);}
