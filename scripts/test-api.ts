import {strict as assert} from 'node:assert';
// Dijalankan hanya terhadap database test terpisah oleh test.ps1.
const base='http://127.0.0.1:8082/api',origin='http://127.0.0.1:5174';
const results:{name:string;ok:boolean}[]=[];
async function request(path:string,body?:unknown,cookie='',method?:string,expected=200){
  if(path.startsWith('/search?')&&!path.includes('method='))path+='&method=ranked';
  const form=body instanceof FormData;
  const r=await fetch(base+path,{method:method||(body?'POST':'GET'),headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(!form&&body?{'Content-Type':'application/json'}:{})},body:body?(form?body:JSON.stringify(body)):undefined});
  const data=await r.json();assert.equal(r.status,expected,`${path}: ${JSON.stringify(data)}`);return {data,cookie:r.headers.get('set-cookie')?.split(';')[0]||cookie};
}
async function check(name:string,task:()=>Promise<void>){await task();results.push({name,ok:true});console.log('PASS '+name)}
async function upload(cookie:string,text:string,title:string,visibility='private',documentId?:string,filename='fixture.md'){
  const form=new FormData();form.set('file',new File([text],filename));form.set('title',title);form.set('category','Fixture pengujian');form.set('visibility',visibility);if(documentId)form.set('documentId',documentId);return request('/documents',form,cookie);
}
const admin=(await request('/auth/login',{email:process.env.BOOTSTRAP_EMAIL,password:process.env.BOOTSTRAP_PASSWORD})).cookie;
let member='',outsider='',privateId='',sharedId='';
await check('Login salah, anonim, serta CSRF ditolak',async()=>{
  await request('/auth/login',{email:'admin@local.test',password:'incorrect-password'},'',undefined,401);
  await request('/documents',undefined,'',undefined,401);
  const r=await fetch(base+'/auth/logout',{method:'POST',headers:{Cookie:admin,'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,403);
});
await check('Pengguna nyata dan ruang terpisah',async()=>{
  await request('/users',{email:'member@test.local',name:'Member Test',password:'member-password-test',role:'member'},admin);
  await request('/users',{email:'outside@test.local',name:'Outside Test',password:'outside-password-test',role:'admin',newWorkspace:'Ruang pengujian terpisah'},admin);
  member=(await request('/auth/login',{email:'member@test.local',password:'member-password-test'})).cookie;
  outsider=(await request('/auth/login',{email:'outside@test.local',password:'outside-password-test'})).cookie;
  await request('/users',undefined,member,undefined,403);
});
await check('Upload, ekstraksi, index, detail, dan file asli',async()=>{
  privateId=(await upload(admin,'vaultsecretalpha: Dokumen rahasia internal.','Rahasia')).data.id;
  sharedId=(await upload(admin,'Backup disimpan setiap malam. Recoverytokenalpha membutuhkan persetujuan administrator.','Prosedur backup','workspace')).data.id;
  const detail=(await request('/documents/'+sharedId,undefined,member)).data;assert.equal(detail.chunks.length,1);assert.equal(detail.current_version,1);
  const r=await fetch(base+`/documents/${sharedId}/download?version=1`,{headers:{Cookie:member}});assert.equal(r.status,200);assert.match(await r.text(),/Recoverytokenalpha/);
});
await check('ACL berlaku sebelum retrieval, detail, download, dan lintas ruang',async()=>{
  assert.equal((await request('/search?q=vaultsecretalpha',undefined,member)).data.total,0);
  assert.equal((await request('/search?q=recoverytokenalpha',undefined,outsider)).data.total,0);
  await request('/documents/'+privateId,undefined,member,undefined,404);
  await request('/documents/'+sharedId,undefined,outsider,undefined,404);
  const r=await fetch(base+`/documents/${privateId}/download?version=1`,{headers:{Cookie:member}});assert.equal(r.status,404);
  await request('/documents/'+sharedId,{title:'Tidak boleh',category:'Fixture',visibility:'private'},member,'PATCH',403);
});
await check('Reindex identik, versi aktif, dan arsip',async()=>{
  const unchanged=await upload(admin,'Backup disimpan setiap malam. Recoverytokenalpha membutuhkan persetujuan administrator.','Prosedur backup','workspace',sharedId);assert.equal(unchanged.data.status,'unchanged');
  const newVersion=await upload(admin,'Backup disimpan setiap siang. Recoverytokenbeta membutuhkan persetujuan administrator.','Prosedur backup','workspace',sharedId);assert.equal(newVersion.data.version,2);
  assert.equal((await request('/search?q=recoverytokenalpha',undefined,member)).data.total,0);
  assert.equal((await request('/search?q=recoverytokenbeta',undefined,member)).data.total,1);
  assert.match((await request('/documents/'+sharedId+'?version=1',undefined,member)).data.chunks[0].content,/Recoverytokenalpha/);
});
await check('Kegagalan ekstraksi tercatat tanpa merusak versi aktif',async()=>{
  const form=new FormData();form.set('file',new File(['   '],'empty.txt'));form.set('title','Prosedur backup');form.set('documentId',sharedId);await request('/documents',form,admin,undefined,400);
  assert.equal((await request('/documents/'+sharedId,undefined,admin)).data.current_version,2);
  assert.ok((await request('/runs',undefined,admin)).data.some((r:{status:string})=>r.status==='failed'));
});
await check('Pencabutan akses langsung berlaku',async()=>{
  await request('/documents/'+sharedId,{title:'Prosedur backup',category:'Fixture pengujian',visibility:'private'},admin,'PATCH');
  assert.equal((await request('/search?q=recoverytokenbeta',undefined,member)).data.total,0);
  await request('/documents/'+sharedId,undefined,member,undefined,404);
  await request('/documents/'+sharedId,{title:'Prosedur backup',category:'Fixture pengujian',visibility:'workspace'},admin,'PATCH');
});
await check('Evaluasi terukur dan hanya administrator',async()=>{
  await request('/evaluation/labels',{query:'backup',documentId:sharedId,relevance:3,split:'holdout',rationale:'Fixture memuat aturan backup secara langsung.'},admin);
  const report=(await request('/evaluation/run?split=holdout',{},admin)).data;assert.equal(report.compared.length,2);assert.equal(report.compared[0].mrr,1);
  await request('/evaluation/labels',undefined,member,undefined,403);
  await request('/evaluation/labels',{query:'secret',documentId:privateId,relevance:3,split:'holdout',rationale:'Tidak dapat diakses.'},outsider,undefined,404);
});
await check('Asisten tidak mengarang jawaban saat evidence tidak relevan',async()=>{
  const answer=(await request('/assistant',{question:'unfindabletokenxyz'},member)).data;assert.equal(answer.status,'insufficient');assert.equal(answer.claims.length,0);
});
if(process.env.AI_API_KEY)await check('Integrasi 9router nyata dengan kutipan valid',async()=>{
  const answer=(await request('/assistant',{question:'Kapan backup disimpan?'},member)).data;
  assert.equal(answer.status,'answered');assert.ok(answer.claims.length>0);assert.ok(answer.citations.length>0);assert.ok(answer.citations.every((c:{source:{documentId:string;version:number}})=>c.source.documentId===sharedId&&c.source.version===2));
  assert.match(answer.claims.map((c:{text:string})=>c.text).join(' '),/siang/i);
});
await check('Penghapusan membersihkan index, file, dan label',async()=>{
  await request('/documents/'+sharedId,undefined,admin,'DELETE');
  assert.equal((await request('/search?q=recoverytokenbeta',undefined,admin)).data.total,0);
  await request('/documents/'+sharedId,undefined,admin,undefined,404);
  assert.equal((await request('/evaluation/labels',undefined,admin)).data.length,0);
});
await check('Penonaktifan mencabut sesi yang sudah login',async()=>{
  const users=(await request('/users',undefined,admin)).data;
  await request('/users/'+users.find((u:{email:string})=>u.email==='member@test.local').id,undefined,admin,'DELETE');
  await request('/documents',undefined,member,undefined,401);
});
await Bun.write(new URL('../.runtime/test-api-results.json',import.meta.url),JSON.stringify({testedAt:new Date().toISOString(),database:'enterprise_search_test',results},null,2));
console.log(`${results.length} pemeriksaan API lulus.`);
