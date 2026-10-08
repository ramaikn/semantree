import {useRef,useState} from 'react'
import {Search,ArrowUpRight,Lock,Globe,ArrowRight,BookOpen} from 'lucide-react'
import {api,post} from '../api'
import type {Results,Answer,Stats,Hit} from '../types'
import Select from './Select'
import Highlight,{excerpt} from './Highlight'

export default function SearchWorkspace({stats,onOpen}:{stats:Stats|null;onOpen:(id:string,chunk?:string,terms?:string[])=>void}) {
  const [query,setQuery]=useState(''),[category,setCategory]=useState(''),[visibility,setVisibility]=useState(''),[method,setMethod]=useState('hybrid');
  const [results,setResults]=useState<Results|null>(null),[answer,setAnswer]=useState<Answer|null>(null),[busy,setBusy]=useState(false),[aiBusy,setAiBusy]=useState(false);
  const [error,setError]=useState(''),[aiError,setAiError]=useState(''),[page,setPage]=useState(0);
  const [aiEnabled,setAiEnabled]=useState(true);
  const searchGeneration=useRef(0),answerGeneration=useRef(0);
  function clearAnswer(){answerGeneration.current++;setAnswer(null);setAiError('');setAiBusy(false)}
  function invalidate(){searchGeneration.current++;clearAnswer();setResults(null);setError('');setBusy(false);setPage(0)}
  function toggleAi(){if(aiEnabled)clearAnswer();setAiEnabled(!aiEnabled)}
  async function search(p=0,withAnswer=true){
    const version=++searchGeneration.current;setBusy(true);setError('');
    if(withAnswer){clearAnswer();setResults(null);setPage(0)}
    const answerTask=withAnswer&&aiEnabled?ask():Promise.resolve();
    try{const params=new URLSearchParams({q:query,method,category,visibility,page:String(p)});const data=await api<Results>('/search?'+params);if(version===searchGeneration.current){setResults(data);setPage(p)}}
    catch(e){if(version===searchGeneration.current)setError((e as Error).message)}finally{if(version===searchGeneration.current)setBusy(false)}
    await answerTask;
  }
  async function ask(){
    const version=++answerGeneration.current;setAiBusy(true);setAiError('');setAnswer(null);
    try{const data=await post<Answer>('/assistant',{question:query,category,visibility});if(version===answerGeneration.current)setAnswer(data)}
    catch(e){if(version===answerGeneration.current)setAiError((e as Error).message)}finally{if(version===answerGeneration.current)setAiBusy(false)}
  }
  const open=(h:Hit)=>onOpen(h.documentId,h.chunkId,h.highlights);
  function resultCard(hit:Hit){return <article className="result" key={hit.chunkId}>
    <div className="result-top"><span className="file-mark"><BookOpen size={19}/></span><div>
      <div className="meta">{hit.category} · v{hit.version} · {hit.visibility==='private'?<Lock size={12}/>:<Globe size={12}/>} {hit.visibility==='private'?'Privat':'Ruang kerja'}{hit.matchType==='semantic'&&<span className="semantic-indicator">Cocok makna</span>}</div>
      <button className="result-title" onClick={()=>open(hit)}><Highlight text={hit.title} terms={hit.highlights}/><ArrowUpRight size={18}/></button>
    </div></div><p><Highlight text={excerpt(hit.content,hit.highlights)} terms={hit.highlights}/></p>
    <footer><span>{hit.location} · {hit.owner}</span><button className="text-button" onClick={()=>open(hit)}>Lihat bukti <ArrowRight size={14}/></button></footer>
  </article>}
  return <><section className="search-intro"><h1>Cari di dokumen Anda.</h1></section>
    <form className="search-form" onSubmit={e=>{e.preventDefault();void search()}}>
      <div className="search-input"><Search size={22}/><input aria-label="Kata kunci atau pertanyaan" required maxLength={500} value={query} onChange={e=>{invalidate();setQuery(e.target.value)}} placeholder="Cari informasi atau tanyakan sesuatu..."/>
        <button disabled={busy||aiBusy} type="submit">{busy?'Mencari...':'Cari'}<ArrowRight size={16}/></button>
      </div>
      <div className="filters">
        <Select aria-label="Kategori" value={category} onChange={e=>{invalidate();setCategory(e.target.value)}}><option value="">Semua kategori</option>{stats?.categories.map(c=><option key={c.category}>{c.category}</option>)}</Select>
        <Select aria-label="Hak akses" value={visibility} onChange={e=>{invalidate();setVisibility(e.target.value)}}><option value="">Semua akses</option><option value="workspace">Ruang kerja</option><option value="private">Privat</option></Select>
        <Select aria-label="Metode pencarian" value={method} onChange={e=>{invalidate();setMethod(e.target.value)}}><option value="hybrid">Cerdas · kata & makna</option><option value="ranked">Kata kunci + judul</option><option value="boolean">Semua kata · baseline</option></Select>
        <button className="ai-toggle" type="button" role="switch" aria-label="Jawaban AI otomatis" aria-checked={aiEnabled} onClick={toggleAi}><span className="ai-toggle-track" aria-hidden="true"><span/></span>Jawaban AI</button>
      </div>
    </form>
    {aiError&&<p className="error" role="alert">{aiError}</p>}
    {aiBusy&&<div className="answer-box loading" role="status"><span className="pulse"/>Asisten mencari dokumen relevan dan menyusun jawaban...</div>}
    {answer&&<section className="answer-box">
      <div className="answer-header"><h3>{answer.status==='partial'?'Jawaban sebagian':answer.status==='insufficient'?'Informasi belum tersedia':'Jawaban AI'}</h3></div>
      {answer.claims.map((c,i)=><p key={i}>{c.text} <span className="citations">{c.citations.map(ref=>{const s=answer.citations.find(x=>x.id===ref);return <button key={ref} onClick={()=>s&&open(s.source)}>[{ref}]</button>})}</span></p>)}
      <p className="answer-note">{answer.message}</p>{answer.retrievalNotice&&<p className="notice">{answer.retrievalNotice}</p>}
      {answer.citations.length>0&&<div className="answer-sources">{answer.citations.map(s=><button className="source-link" key={s.id} onClick={()=>open(s.source)}><strong>{s.id}</strong><span>{s.source.title}<small>v{s.source.version} · {s.source.location}</small></span><ArrowUpRight size={15}/></button>)}</div>}
      {answer.relevantDocuments.length>0&&<div className="relevant-documents"><h4>Dokumen relevan</h4>{answer.relevantDocuments.map(h=><button className="relevant-document" key={h.documentId} onClick={()=>open(h)}><BookOpen size={17}/><span>{h.title}<small>{h.category} · v{h.version}</small></span><ArrowUpRight size={16}/></button>)}</div>}
    </section>}
    {error&&<p className="error" role="alert">{error}</p>}
    {busy&&<div className="search-progress" role="status"><span className="pulse"/>{method==='hybrid'?'Mencari kata kunci dan menilai makna dokumen...':'Mencari kata kunci...'}</div>}
    {!results&&!answer&&!busy&&!aiBusy&&!aiError?<div className="search-empty"><div className="empty-symbol"><Search size={32}/></div><p>{stats?.documents?`${stats.documents} dokumen tersedia untuk dicari.`:'Upload dokumen untuk memulai.'}</p></div>:null}
    {results&&<><div className="results-heading"><span><strong>{results.total}</strong> potongan ditemukan <small>· {results.elapsedMs} ms · {results.retrieval==='semantic'?'Kata & makna':'Kata kunci'}</small></span></div>
      {results.notice&&<p className="notice">{results.notice}</p>}
      {results.items.length?results.items.map(resultCard):<div className="empty"><h3>Tidak ada hasil yang relevan.</h3><p>Coba pertanyaan yang lebih spesifik atau sesuaikan filter. Tidak semua informasi tersedia dalam dokumen.</p></div>}
      {results.total>10&&<div className="pagination"><button className="secondary" disabled={page===0||busy||aiBusy} onClick={()=>void search(page-1,false)}>Sebelumnya</button><span>Halaman {page+1} dari {Math.ceil(results.total/10)}</span><button className="secondary" disabled={(page+1)*10>=results.total||busy||aiBusy} onClick={()=>void search(page+1,false)}>Berikutnya</button></div>}
    </>}
  </>
}
