import {useEffect,useState} from 'react'
import {BookOpen,Search,Files,Activity as ActivityIcon,Users as UsersIcon,BarChart3,LogOut,Upload,ArrowUpRight,Lock,Globe,Menu,ChevronRight} from 'lucide-react'
import {api,post} from './api'
import {date,type User,type Doc,type Stats} from './types'
import SearchWorkspace from './components/SearchWorkspace'
import DocumentPanel from './components/DocumentPanel'
import UploadDialog from './components/UploadDialog'
import Activity from './components/Activity'
import Users from './components/Users'
import Evaluation from './components/Evaluation'
import Brand from './components/Brand'

type Page='search'|'documents'|'activity'|'evaluation'|'users';
export default function App(){
  const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true),[page,setPage]=useState<Page>('search'),[docs,setDocs]=useState<Doc[]>([]),[stats,setStats]=useState<Stats|null>(null),[error,setError]=useState(''),[selected,setSelected]=useState<{id:string;chunk?:string;terms?:string[]}|null>(null),[upload,setUpload]=useState<{existing?:Doc}|null>(null),[mobile,setMobile]=useState(false),[filter,setFilter]=useState('');
  useEffect(()=>{api<User>('/auth/me').then(setUser).catch(()=>{}).finally(()=>setLoading(false));const expire=()=>{setUser(null);setDocs([]);setStats(null);setSelected(null);setUpload(null)};window.addEventListener('session-expired',expire);return()=>window.removeEventListener('session-expired',expire)},[]);
  async function refresh(){try{const [d,s]=await Promise.all([api<Doc[]>('/documents'),api<Stats>('/stats')]);setDocs(d);setStats(s);setError('')}catch(e){setError((e as Error).message)}}
  useEffect(()=>{if(user)void refresh()},[user]);
  async function logout(){try{await post('/auth/logout',{});setUser(null);setSelected(null);setUpload(null);setDocs([]);setStats(null);setPage('search')}catch(e){setError((e as Error).message)}}
  if(loading)return <div className="boot"><Brand/>Memuat...</div>;
  if(!user)return <Login onLogin={u=>{setUser(u);setPage('search')}}/>;
  const nav:{id:Page;label:string;icon:typeof Search}[]=[{id:'search',label:'Pencarian',icon:Search},{id:'documents',label:'Dokumen',icon:Files},{id:'activity',label:'Aktivitas',icon:ActivityIcon},...(user.role==='admin'?[{id:'evaluation' as Page,label:'Evaluasi',icon:BarChart3},{id:'users' as Page,label:'Pengguna',icon:UsersIcon}]:[])];
  return <div className="app"><aside className={'sidebar '+(mobile?'visible':'')}><a href="#" className="brand" aria-label="Semantree" onClick={e=>{e.preventDefault();setPage('search');setMobile(false)}}><Brand/></a><div className="workspace"><span className="workspace-icon">{user.workspace.slice(0,1)}</span><div><strong>{user.workspace}</strong></div></div><nav>{nav.map(n=><button className={page===n.id?'active':''} key={n.id} onClick={()=>{setPage(n.id);setMobile(false)}}><n.icon size={19}/>{n.label}{page===n.id&&<ChevronRight size={15}/>}</button>)}</nav><div className="sidebar-bottom"><div className="identity"><span className="avatar">{user.name[0]}</span><div><strong>{user.name}</strong><small>{user.role==='admin'?'Administrator':'Anggota'}</small></div><button className="icon" aria-label="Keluar" onClick={logout}><LogOut size={17}/></button></div></div></aside>
    {mobile&&<div className="mobile-scrim" onClick={()=>setMobile(false)}/>}
    <div className="main"><header className="topbar"><div><button className="icon mobile-menu" aria-label="Buka menu" onClick={()=>setMobile(!mobile)}><Menu size={22}/></button><span>Ruang kerja</span><ChevronRight size={14}/><strong>{nav.find(n=>n.id===page)?.label}</strong></div><button onClick={()=>setUpload({})}><Upload size={16}/>Upload dokumen</button></header><main>
      {error&&<p className="error" role="alert">{error}</p>}
      {page==='search'&&<SearchWorkspace stats={stats} onOpen={(id,chunk,terms)=>setSelected({id,chunk,terms})}/>}
      {page==='documents'&&<><div className="page-title"><h1>Dokumen</h1><button className="secondary" onClick={refresh}>Perbarui</button></div><div className="stat-strip"><div><strong>{stats?.documents||0}</strong><span>Dokumen</span></div><div><strong>{stats?.categories.length||0}</strong><span>Kategori</span></div></div><div className="library-toolbar"><div><Search size={17}/><input aria-label="Filter judul dokumen" placeholder="Cari judul dokumen..." value={filter} onChange={e=>setFilter(e.target.value)}/></div></div><section className="panel library"><div className="table-wrap"><table><thead><tr><th>Dokumen</th><th>Kategori</th><th>Akses</th><th>Versi</th><th>Diperbarui</th><th/></tr></thead><tbody>{docs.filter(d=>d.title.toLowerCase().includes(filter.toLowerCase())).map(d=><tr key={d.id}><td><button className="doc-name" onClick={()=>setSelected({id:d.id})}><BookOpen size={18}/><span><strong>{d.title}</strong><small>{d.owner_name}</small></span></button></td><td>{d.category}</td><td><span className="meta">{d.visibility==='private'?<Lock size={13}/>:<Globe size={13}/>} {d.visibility==='private'?'Privat':'Ruang kerja'}</span></td><td>v{d.current_version}</td><td>{date(d.updated_at)}</td><td><button className="icon" aria-label={'Buka '+d.title} onClick={()=>setSelected({id:d.id})}><ArrowUpRight size={17}/></button></td></tr>)}</tbody></table></div>{docs.length===0&&<div className="empty"><Files size={30}/><h3>Belum ada dokumen.</h3><button onClick={()=>setUpload({})}>Upload dokumen</button></div>}</section></>}
      {page==='activity'&&<Activity admin={user.role==='admin'}/>}{page==='evaluation'&&<Evaluation docs={docs}/>}{page==='users'&&<Users self={user.id}/>}
    </main></div>
    {selected&&<DocumentPanel key={selected.id} id={selected.id} focusChunk={selected.chunk} highlightTerms={selected.terms} user={user} onClose={()=>setSelected(null)} onChanged={refresh} onVersion={doc=>{setSelected(null);setUpload({existing:doc})}}/>}{upload&&<UploadDialog existing={upload.existing} onClose={()=>setUpload(null)} onDone={()=>void refresh()}/>}
  </div>
}

function Login({onLogin}:{onLogin:(user:User)=>void}){
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{onLogin(await post<User>('/auth/login',{email,password}));setPassword('')}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  return <div className="login-layout"><section className="login-story"><div className="brand"><Brand/></div><div><h1>Temukan informasi.<br/>Telusuri sumbernya.</h1><p>Pencarian dokumen dan jawaban AI dalam satu ruang kerja.</p><div className="login-features"><span><Search size={18}/>Pencarian lintas dokumen</span><span><Lock size={18}/>Dokumen privat dan bersama</span><span><BookOpen size={18}/>Jawaban dengan sumber asli</span></div></div></section><section className="login-form"><div><h2>Masuk ke Semantree</h2><form onSubmit={submit}><label>Email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@organisasi.com"/></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p className="error" role="alert">{error}</p>}<button className="login-submit" disabled={busy}>{busy?'Memeriksa...':'Masuk'}<ArrowUpRight size={18}/></button></form></div></section></div>
}
