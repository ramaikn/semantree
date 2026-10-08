import {useState} from 'react'
import {Upload,X,FileText} from 'lucide-react'
import {api} from '../api'
import Select from './Select'
import type {Doc} from '../types'

export default function UploadDialog({existing,onClose,onDone}:{existing?:Doc;onClose:()=>void;onDone:()=>void}) {
  const [file,setFile]=useState<File|null>(null),[title,setTitle]=useState(existing?.title||''),[category,setCategory]=useState(existing?.category||'Umum'),[visibility,setVisibility]=useState(existing?.visibility||'private'),[source,setSource]=useState(existing?.source_url||''),[license,setLicense]=useState(existing?.license||''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function submit(e:React.FormEvent){e.preventDefault();if(!file)return;setBusy(true);setError('');const form=new FormData();form.set('file',file);form.set('title',title);form.set('category',category);form.set('visibility',visibility);form.set('sourceUrl',source);form.set('license',license);if(existing)form.set('documentId',existing.id);try{await api('/documents',{method:'POST',body:form});onDone();onClose()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  return <div className="overlay" onClick={()=>!busy&&onClose()}><section className="modal" role="dialog" aria-modal="true" aria-label="Upload dokumen" onClick={e=>e.stopPropagation()}><div className="drawer-top"><h2>{existing?'Upload versi baru':'Tambahkan dokumen'}</h2><button disabled={busy} className="icon" aria-label="Tutup upload" onClick={onClose}><X size={20}/></button></div><form onSubmit={submit}>
    <label className="file-picker"><FileText size={28}/><strong>{file?file.name:'Pilih dokumen'}</strong><span>PDF, DOCX, TXT, Markdown · maksimal 12 MB</span><input type="file" accept=".pdf,.docx,.txt,.md" required onChange={e=>{const f=e.target.files?.[0]||null;setFile(f);if(f&&!title)setTitle(f.name.replace(/\.[^.]+$/,''))}}/></label>
    <label>Judul<input required maxLength={200} value={title} onChange={e=>setTitle(e.target.value)}/></label><div className="form-grid"><label>Kategori<input required maxLength={80} value={category} onChange={e=>setCategory(e.target.value)}/></label><label>Akses<Select aria-label="Akses dokumen" value={visibility} onChange={e=>setVisibility(e.target.value)}><option value="private">Privat, hanya saya</option><option value="workspace">Semua di ruang kerja</option></Select></label></div>
    <label>URL sumber<input type="url" value={source} onChange={e=>setSource(e.target.value)} placeholder="Opsional"/></label><label>Lisensi atau izin penggunaan<input value={license} maxLength={200} onChange={e=>setLicense(e.target.value)} placeholder="Opsional"/></label>
    {error&&<p className="error" role="alert">{error}</p>}<div className="modal-footer"><span>{busy?'Mengekstrak dan menyimpan index…':'PDF scan belum mendukung OCR.'}</span><button type="submit" disabled={busy||!file}><Upload size={16}/>{busy?'Memproses…':'Upload & index'}</button></div>
  </form></section></div>
}
