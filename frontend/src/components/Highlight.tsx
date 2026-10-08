export type Range={start:number;end:number}

export function matchRanges(text:string,terms:string[]):Range[]{
  const lowered=text.toLocaleLowerCase('id-ID'),ranges:Range[]=[];
  for(const term of [...new Set(terms.map(t=>t.trim().toLocaleLowerCase('id-ID')))].filter(t=>t.length>=2)){
    let from=0,index:number;
    while((index=lowered.indexOf(term,from))>=0&&ranges.length<500){
      const before=lowered[index-1]||'',after=lowered[index+term.length]||'';
      // Hindari mencocokkan 'laba' di dalam kata yang tidak berkaitan.
      if(!/[\p{L}\p{N}]/u.test(before)&&!/[\p{L}\p{N}]/u.test(after))ranges.push({start:index,end:index+term.length});
      from=index+term.length;
    }
  }
  ranges.sort((a,b)=>a.start-b.start||b.end-a.end);
  const merged:Range[]=[];
  for(const range of ranges){const prev=merged.at(-1);if(prev&&range.start<=prev.end)prev.end=Math.max(prev.end,range.end);else merged.push({...range})}
  return merged;
}

export function excerpt(text:string,terms:string[],limit=650){
  const ranges=matchRanges(text,terms);
  let focus=ranges[0]?.start??0,best=0;
  for(const range of ranges){const count=ranges.filter(r=>r.start>=range.start&&r.end<=range.start+limit-100).length;if(count>best){best=count;focus=range.start}}
  const start=Math.max(0,focus-100),end=Math.min(text.length,start+limit);
  return (start?'…':'')+text.slice(start,end)+(end<text.length?'…':'');
}

export default function Highlight({text,terms}:{text:string;terms:string[]}){
  const ranges=matchRanges(text,terms),nodes:React.ReactNode[]=[];let offset=0;
  for(const [i,range]of ranges.entries()){nodes.push(text.slice(offset,range.start));nodes.push(<mark key={i}>{text.slice(range.start,range.end)}</mark>);offset=range.end}
  nodes.push(text.slice(offset));return <>{nodes}</>;
}
