import {useEffect,useState} from 'react'
import {api,post} from '../api'
import type {Doc} from '../types'
import Select from './Select'
type Label={id:string;query:string;title:string;relevance:number;split:string;rationale:string}
type Report={split:string;k:number;limitations:string;compared:{method:string;queries:number;mrr:number;recallAt5:number;ndcgAt5:number;meanLatencyMs:number;details:{query:string;mrr:number;recallAt5:number;ndcgAt5:number;elapsedMs:number;retrieval:string;notice:string}[]}[]}
export default function Evaluation({docs}:{docs:Doc[]}) {
  const [labels,setLabels]=useState<Label[]>([]),[report,setReport]=useState<Report|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[split,setSplit]=useState('holdout'),[form,setForm]=useState({query:'',documentId:'',relevance:3,split:'holdout',rationale:''});
  async function load(){try{setLabels(await api('/evaluation/labels'))}catch(e){setError((e as Error).message)}}
  useEffect(()=>{void load()},[]);
  async function save(e:React.FormEvent){e.preventDefault();if(!form.documentId){setError('Pilih dokumen yang relevan.');return}setBusy(true);setError('');try{await post('/evaluation/labels',form);await load();setForm({...form,query:'',rationale:''})}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function run(){setBusy(true);setError('');try{setReport(await post<Report>('/evaluation/run?split='+split+'&hybrid=true',{}))}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function remove(id:string){try{await api('/evaluation/labels/'+id,{method:'DELETE'});await load()}catch(e){setError((e as Error).message)}}
  const percent=(v:number)=>(v*100).toFixed(1)+'%';
  function download(){if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='evaluasi-search.json';a.click();URL.revokeObjectURL(url)}
  return <>
    <div className="page-title"><div><h1>Kualitas pencarian</h1><p>Bandingkan pencarian kata kunci dan pencarian makna.</p></div></div>
    {error&&<p className="error" role="alert">{error}</p>}
    <div className="admin-grid"><section className="panel"><h3>Label relevansi manusia</h3><form onSubmit={save}>
      <label>Query<input required maxLength={500} value={form.query} onChange={e=>setForm({...form,query:e.target.value})}/></label>
      <label>Dokumen yang relevan<Select aria-label="Dokumen relevan" required value={form.documentId} onChange={e=>setForm({...form,documentId:e.target.value})}><option value="">Pilih dokumen</option>{docs.map(d=><option value={d.id} key={d.id}>{d.title}</option>)}</Select></label>
      <div className="form-grid"><label>Relevansi<Select aria-label="Relevansi" value={form.relevance} onChange={e=>setForm({...form,relevance:Number(e.target.value)})}><option value={3}>3 · sangat relevan</option><option value={2}>2 · relevan</option><option value={1}>1 · terkait</option></Select></label><label>Kelompok<Select aria-label="Kelompok label" value={form.split} onChange={e=>setForm({...form,split:e.target.value})}><option value="holdout">Holdout</option><option value="tuning">Tuning</option></Select></label></div>
      <label>Alasan penilaian<textarea required maxLength={500} value={form.rationale} onChange={e=>setForm({...form,rationale:e.target.value})}/></label><button disabled={busy}>Simpan label</button>
    </form></section><section className="panel"><h3>Jalankan perbandingan</h3><p className="form-help">Tuning untuk pengembangan. Holdout untuk pemeriksaan akhir, bukan untuk mengubah ranking berulang kali.</p>
      <label>Kelompok pengujian<Select aria-label="Kelompok pengujian" value={split} onChange={e=>setSplit(e.target.value)}><option value="holdout">Holdout</option><option value="tuning">Tuning</option></Select></label><button disabled={busy} onClick={run}>{busy?'Memproses...':'Ukur tiga metode'}</button>
      {report&&<><h4>{report.split} · {report.compared[0].queries} query</h4><table><thead><tr><th>Metode</th><th>MRR</th><th>Recall@5</th><th>nDCG@5</th></tr></thead><tbody>{report.compared.map(r=><tr key={r.method}><td>{r.method}<small>{r.meanLatencyMs.toFixed(1)} ms</small></td><td>{percent(r.mrr)}</td><td>{percent(r.recallAt5)}</td><td>{percent(r.ndcgAt5)}</td></tr>)}</tbody></table>
        {report.compared.some(r=>r.details.some(d=>d.notice))&&<p className="notice">Sebagian query menggunakan fallback kata kunci. Periksa detail pada unduhan JSON.</p>}
        <p className="form-help">{report.limitations}</p><button className="secondary" onClick={download}>Unduh hasil JSON</button></>}
    </section></div>
    <section className="panel"><h3>Label tersimpan · {labels.length}</h3>{labels.length?<div className="table-wrap"><table><thead><tr><th>Query</th><th>Dokumen</th><th>Nilai</th><th>Kelompok</th><th/></tr></thead><tbody>{labels.map(l=><tr key={l.id}><td><strong>{l.query}</strong><small>{l.rationale}</small></td><td>{l.title}</td><td>{l.relevance}</td><td>{l.split}</td><td><button className="text-button danger" onClick={()=>void remove(l.id)}>Hapus</button></td></tr>)}</tbody></table></div>:<p className="empty">Belum ada label. Angka kualitas tidak dibuat sebelum evaluasi dijalankan.</p>}</section>
  </>
}
