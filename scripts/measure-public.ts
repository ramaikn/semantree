// Mengukur corpus aplikasi melalui API dan menyimpan laporan tanpa kredensial.
const settings=Object.fromEntries((await Bun.file(new URL('../.env',import.meta.url)).text()).split(/\r?\n/).filter(x=>x.includes('=')&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return[x.slice(0,i).trim(),x.slice(i+1)]}));
const base='http://127.0.0.1:8081/api',origin=settings.APP_ORIGIN;
const login=await fetch(base+'/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:settings.BOOTSTRAP_EMAIL,password:settings.BOOTSTRAP_PASSWORD})});
if(!login.ok)throw new Error('Login pengukuran gagal.');
const cookie=login.headers.get('set-cookie')!.split(';')[0];
try{
  const response=await fetch(base+'/evaluation/run?split=holdout',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:'{}'});
  const report=await response.json();if(!response.ok)throw new Error(report.error);
  await Bun.write(new URL('../.runtime/public-evaluation.json',import.meta.url),JSON.stringify(report,null,2));
  console.log(JSON.stringify({split:report.split,compared:report.compared.map(({details,...rest}:{details:unknown})=>rest)},null,2));
}finally{await fetch(base+'/auth/logout',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:'{}'});}
