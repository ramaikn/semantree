import {useEffect,useState} from 'react'
import {X,Download,ExternalLink,Lock,Globe,Trash2,Upload,Save} from 'lucide-react'
import {api} from '../api'
import {date,type Detail,type User} from '../types'
import Highlight from './Highlight'
import Select from './Select'

export default function DocumentPanel({id,user,onClose,onChanged,onVersion,focusChunk,highlightTerms=[]}:{id:string;user:User;onClose:()=>void;onChanged:()=>void;onVersion:(doc:Detail)=>void;focusChunk?:string;highlightTerms?:string[]}) {
  const [doc,setDoc]=useState<Detail|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[deleting,setDeleting]=useState(false);
  const [title,setTitle]=useState(''),[category,setCategory]=useState(''),[visibility,setVisibility]=useState('');
  async function load(version?:number){try{setError('');const d=await api<Detail>(`/documents/${id}${version?'?version='+version:''}`);setDoc(d);setTitle(d.title);setCategory(d.category);setVisibility(d.visibility)}catch(e){setError((e as Error).message)}}
  useEffect(()=>{void load()},[id]);
  useEffect(()=>{if(doc && focusChunk) document.getElementById('chunk-'+focusChunk)?.scrollIntoView({block:'center'})},[doc,focusChunk]);
  useEffect(()=>{const listener=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener)},[onClose]);
  async function save(){setBusy(true);try{await api(`/documents/${id}`,{method:'PATCH',body:JSON.stringify({title,category,visibility})});await load(doc?.selectedVersion);onChanged()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function remove(){setBusy(true);try{await api(`/documents/${id}`,{method:'DELETE'});onChanged();onClose()}catch(e){setError((e as Error).message);setBusy(false)}}
  return <div className="overlay" onClick={onClose}><section className="drawer" role="dialog" aria-modal="true" aria-label="Detail dokumen" onClick={e=>e.stopPropagation()}>
    <div className="drawer-top"><button className="icon" aria-label="Tutup detail" onClick={onClose}><X size={20}/></button></div>
    {error&&<div role="alert" className="error">{error}</div>}
    {!doc?<p>Memuat dokumen…</p>:<><h2>{doc.title}</h2><div className="meta">{doc.visibility==='private'?<Lock size={14}/>:<Globe size={14}/>} {doc.visibility==='private'?'Privat':'Ruang kerja'} · {doc.category} · {doc.owner_name}</div>
      <div className="version-bar"><label>Versi <Select aria-label="Versi dokumen" value={doc.selectedVersion} onChange={e=>void load(Number(e.target.value))}>{doc.versions.map(v=><option value={v.number} key={v.id}>v{v.number}{v.number===doc.current_version?' · aktif':' · arsip'}</option>)}</Select></label><a className="button secondary" href={`/api/documents/${id}/download?version=${doc.selectedVersion}`}><Download size={16}/>File asli</a></div>
      {doc.selectedVersion!==doc.current_version&&<div className="notice">Versi arsip. Pencarian dan asisten hanya memakai versi aktif.</div>}
      <dl className="source-info"><dt>Diperbarui</dt><dd>{date(doc.updated_at)}</dd>{doc.source_url&&<><dt>Sumber</dt><dd><a href={doc.source_url} target="_blank" rel="noreferrer">Buka sumber <ExternalLink size={12}/></a></dd></>}{doc.license&&<><dt>Lisensi</dt><dd>{doc.license}</dd></>}</dl>
      {doc.owner_id===user.id&&<details className="manage"><summary>Kelola dokumen</summary><label>Judul<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={200}/></label><label>Kategori<input value={category} onChange={e=>setCategory(e.target.value)} maxLength={80}/></label><label>Akses<Select aria-label="Ubah akses dokumen" value={visibility} onChange={e=>setVisibility(e.target.value)}><option value="private">Privat</option><option value="workspace">Ruang kerja</option></Select></label><div className="actions"><button disabled={busy} onClick={save}><Save size={15}/>Simpan</button><button className="secondary" onClick={()=>onVersion(doc)}><Upload size={15}/>Versi baru</button></div><button className="danger text-button" onClick={()=>setDeleting(true)}><Trash2 size={15}/>Hapus dokumen</button>{deleting&&<div className="notice">Hapus file, seluruh versi, index, dan label evaluasinya?<div className="actions"><button className="danger" disabled={busy} onClick={remove}>Hapus permanen</button><button className="secondary" onClick={()=>setDeleting(false)}>Batal</button></div></div>}</details>}
      <div className="evidence-heading"><h3>Teks hasil ekstraksi</h3><span>{doc.chunks.length} potongan</span></div>{doc.chunks.map(c=><article className={'source-chunk '+(c.id===focusChunk?'focused':'')} id={'chunk-'+c.id} key={c.id}><div className="meta">#{c.ordinal} · {c.location}</div><p><Highlight text={c.content} terms={highlightTerms}/></p></article>)}
    </>}
  </section></div>
}
