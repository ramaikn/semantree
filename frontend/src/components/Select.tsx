import {Children,isValidElement,useEffect,useId,useLayoutEffect,useRef,useState,type ReactNode,type KeyboardEvent} from 'react'
import {createPortal} from 'react-dom'
import {Check,ChevronDown} from 'lucide-react'

type Props={value:string|number;onChange:(event:{target:{value:string}})=>void;children:ReactNode;'aria-label'?:string;required?:boolean;disabled?:boolean}
type Option={value:string;label:string;disabled:boolean}

/** Posisi menu mengikuti tombol, termasuk saat layar di-scroll atau diubah ukurannya. */
export default function Select({value,onChange,children,required,disabled,'aria-label':ariaLabel}:Props){
  const id=useId(),button=useRef<HTMLButtonElement>(null),menu=useRef<HTMLDivElement>(null);
  const [open,setOpen]=useState(false),[active,setActive]=useState(0),[position,setPosition]=useState({left:0,top:0,width:0,maxHeight:260});
  const options:Option[]=Children.toArray(children).filter(isValidElement).map(child=>{
    const props=child.props as {value?:string|number;children:ReactNode;disabled?:boolean};
    const label=Children.toArray(props.children).join('');
    return {value:String(props.value??label),label,disabled:!!props.disabled};
  });
  const selected=options.findIndex(o=>o.value===String(value));
  function reposition(){
    const rect=button.current?.getBoundingClientRect();if(!rect)return;
    const width=Math.min(Math.max(rect.width,190),window.innerWidth-24);
    const height=Math.min(options.length*38+12,260);
    const below=window.innerHeight-rect.bottom-12,above=rect.top-12;
    const flip=below<Math.min(height,150)&&above>below;
    const maxHeight=Math.max(72,Math.min(260,flip?above:below));
    setPosition({left:Math.max(12,Math.min(rect.left,window.innerWidth-width-12)),top:flip?Math.max(12,rect.top-Math.min(height,maxHeight)-6):rect.bottom+6,width,maxHeight});
  }
  useLayoutEffect(()=>{if(open)reposition()},[open]);
  useEffect(()=>{
    if(!open)return;
    function outside(e:PointerEvent){if(!button.current?.contains(e.target as Node)&&!menu.current?.contains(e.target as Node))setOpen(false)}
    window.addEventListener('pointerdown',outside);window.addEventListener('resize',reposition);window.addEventListener('scroll',reposition,true);
    return()=>{window.removeEventListener('pointerdown',outside);window.removeEventListener('resize',reposition);window.removeEventListener('scroll',reposition,true)};
  },[open,options.length]);
  useEffect(()=>{if(open)menu.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({block:'nearest'})},[active,open]);
  function choose(index:number){const option=options[index];if(!option||option.disabled)return;onChange({target:{value:option.value}});setOpen(false);button.current?.focus()}
  function keydown(e:KeyboardEvent){
    if(e.key==='Escape'){setOpen(false);e.preventDefault();return}
    if(e.key==='Tab'){setOpen(false);return}
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!open){setActive(selected<0?0:selected);setOpen(true)}else setActive(i=>(i+(e.key==='ArrowDown'?1:-1)+options.length)%options.length)}
    else if(e.key==='Home'||e.key==='End'){e.preventDefault();setOpen(true);setActive(e.key==='Home'?0:options.length-1)}
    else if(e.key==='Enter'||e.key===' '){e.preventDefault();if(open)choose(active);else{setActive(selected<0?0:selected);setOpen(true)}}
    else if(e.key.length===1){const next=options.findIndex((o,i)=>i>active&&o.label.toLocaleLowerCase().startsWith(e.key.toLocaleLowerCase()));if(next>=0){setActive(next);setOpen(true)}}
  }
  return <div className="select-control"><button type="button" ref={button} className="select-trigger" disabled={disabled} role="combobox" aria-label={ariaLabel} aria-expanded={open} aria-haspopup="listbox" aria-controls={open?id:undefined} aria-activedescendant={open?`${id}-${active}`:undefined} aria-required={required} onKeyDown={keydown} onClick={()=>{setActive(selected<0?0:selected);setOpen(!open)}}><span>{options[selected]?.label||'Pilih...'}</span><ChevronDown size={14}/></button>
    {open&&createPortal(<div ref={menu} id={id} className="select-menu" role="listbox" aria-label={ariaLabel||'Pilihan'} style={{position:'fixed',...position}}>{options.map((option,i)=><div id={`${id}-${i}`} role="option" aria-selected={i===selected} aria-disabled={option.disabled} data-index={i} key={option.value} className={`select-option ${i===selected?'selected':''} ${i===active?'keyboard-active':''}`} onPointerMove={()=>setActive(i)} onPointerDown={e=>e.preventDefault()} onClick={e=>{e.stopPropagation();choose(i)}}><span>{option.label}</span>{i===selected&&<Check size={14}/>}</div>)}</div>,document.body)}
  </div>
}
