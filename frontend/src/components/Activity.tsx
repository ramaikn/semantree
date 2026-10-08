import {useEffect,useState} from 'react'
import {api} from '../api'
import {date} from '../types'
type Run={id:string;filename:string;status:string;message:string;chunks:number;started_at:string;finished_at:string}
type Event={id:number;actor_name:string;action:string;target:string;created_at:string}
const statuses:Record<string,string>={processing:'Memproses',success:'Selesai',unchanged:'Tidak berubah',failed:'Gagal'};
const actions:Record<string,string>={'document.index':'Dokumen diindeks','document.access':'Akses dokumen diubah','document.delete':'Dokumen dihapus','assistant.answer':'Jawaban AI dibuat','evaluation.label':'Label evaluasi disimpan','evaluation.run':'Evaluasi dijalankan','user.create':'Pengguna dibuat','user.deactivate':'Pengguna dinonaktifkan'};
export default function Activity({admin}:{admin:boolean}) {
  const [runs,setRuns]=useState<Run[]>([]),[events,setEvents]=useState<Event[]>([]),[error,setError]=useState('');
  async function load(){try{setError('');setRuns(await api('/runs'));if(admin)setEvents(await api('/audit'))}catch(e){setError((e as Error).message)}}
  useEffect(()=>{void load()},[]);
  return <><div className="page-title"><h1>Aktivitas</h1><button className="secondary" onClick={load}>Perbarui</button></div>{error&&<p className="error" role="alert">{error}</p>}<section className="panel"><h3>Dokumen saya</h3>{runs.length?<div className="table-wrap"><table><thead><tr><th>Dokumen</th><th>Status</th><th>Potongan</th><th>Waktu</th></tr></thead><tbody>{runs.map(r=><tr key={r.id}><td><strong>{r.filename}</strong>{r.status==='failed'&&<small>{r.message}</small>}</td><td><span className={'status '+r.status}>{statuses[r.status]||r.status}</span></td><td>{r.chunks}</td><td>{date(r.started_at)}</td></tr>)}</tbody></table></div>:<p className="empty">Belum ada aktivitas dokumen.</p>}</section>{admin&&<section className="panel"><h3>Aktivitas ruang kerja</h3><div className="table-wrap"><table><thead><tr><th>Pengguna</th><th>Tindakan</th><th>Waktu</th></tr></thead><tbody>{events.map(e=><tr key={e.id}><td>{e.actor_name}</td><td>{actions[e.action]||e.action}</td><td>{date(e.created_at)}</td></tr>)}</tbody></table></div></section>}</>
}
