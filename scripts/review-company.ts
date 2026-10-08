import {strict as assert} from 'node:assert';
const settings=Object.fromEntries((await Bun.file(new URL('../.env',import.meta.url)).text()).split(/\r?\n/).filter(x=>x.includes('=')&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return[x.slice(0,i).trim(),x.slice(i+1)]}));
const base='http://127.0.0.1:8081/api',origin=settings.APP_ORIGIN;
const login=await fetch(base+'/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:settings.BOOTSTRAP_EMAIL,password:settings.BOOTSTRAP_PASSWORD})});
assert.equal(login.status,200);
const cookie=login.headers.get('set-cookie')!.split(';')[0];
async function request(path:string,body?:unknown){
  const start=Date.now(),r=await fetch(base+path,{method:body?'POST':'GET',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return {data,elapsedMs:Date.now()-start};
}
const report:unknown[]=[];
try{
  const library=await request('/documents');
  assert.ok(library.data.length>=15);assert.ok(!library.data.some((d:{title:string})=>d.title.startsWith('FastAPI ·')));
  const searches=[
    {q:'laporan keuangan maret 2026',title:'Laporan Keuangan Maret 2026'},
    {q:'siapa pemasok ikan untuk sambal dan berapa lama kirimnya',title:'Daftar Supplier dan Evaluasi Pemasok Maret 2026'},
    {q:'berapa untung bersih bulan ketiga tahun 2026',title:'Laporan Keuangan Maret 2026'},
    {q:'barang yang tanggal habis pakainya paling dekat dikirim dulu',title:'SOP Gudang, Pengiriman, dan Distribusi'},
  ];
  for(const test of searches){
    const {data,elapsedMs}=await request('/search?'+new URLSearchParams({q:test.q,method:'hybrid',size:'10'}));
    assert.equal(data.retrieval,'semantic',data.notice);assert.ok(data.items.some((h:{title:string})=>h.title===test.title),test.q);
    assert.ok(data.items.some((h:{highlights:string[]})=>h.highlights.length>0));
    report.push({type:'search',query:test.q,elapsedMs,top:data.items.slice(0,5).map((h:{title:string;score:number;highlights:string[]})=>({title:h.title,score:h.score,highlights:h.highlights})),examined:data.examined,available:data.available});
    console.log('PASS semantic: '+test.q);
  }
  for(const question of ['Berapa laba bersih Maret 2026 dan siapa pemasok tuna untuk sambal?','Carikan dokumen yang menjelaskan cara menangani ikan kiriman yang terlalu hangat.','Berapa omzet April 2026?']){
    const {data,elapsedMs}=await request('/assistant',{question});
    if(question.includes('April'))assert.equal(data.status,'insufficient');
    else {assert.ok(['answered','partial'].includes(data.status));assert.ok(data.citations.length>0);assert.ok(data.relevantDocuments.length>0);}
    if(question.startsWith('Berapa laba')){
      const text=data.claims.map((c:{text:string})=>c.text).join(' ');assert.match(text,/97[.,]500[.,]000/);assert.match(text,/Laut Biru/i);
    }
    report.push({type:'assistant',question,elapsedMs,status:data.status,claims:data.claims,message:data.message,citations:data.citations.map((c:{id:string;source:{title:string;version:number}})=>({id:c.id,title:c.source.title,version:c.source.version})),relevantDocuments:data.relevantDocuments.map((d:{title:string})=>d.title)});
    console.log('PASS assistant: '+question);
  }
  await Bun.write(new URL('../.runtime/company-review.json',import.meta.url),JSON.stringify({reviewedAt:new Date().toISOString(),checks:report},null,2));
}finally{await fetch(base+'/auth/logout',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:'{}'});}
