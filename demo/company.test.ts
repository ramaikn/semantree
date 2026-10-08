import {describe,test,expect} from 'bun:test';
import {balances,documents,financials,products,judgments,simulation} from './company';

describe('Corpus perusahaan konsisten',()=>{
  test('laba rugi Maret berasal dari unit dan biaya yang sama',()=>{
    const m=financials[2];expect(m.revenue).toBe(852000000);expect(m.cogs).toBe(505000000);expect(m.net).toBe(97500000);
    expect(m.gross).toBe(m.revenue-m.cogs);expect(m.net).toBe(m.pretax-m.tax);
  });
  test('neraca seimbang dan kas/piutang/utang terrekonsiliasi',()=>{
    expect(balances.totalAssets).toBe(balances.totalLiabilitiesAndEquity);
    expect(balances.closingAR).toBe(285600000);expect(balances.closingAP).toBe(277000000);
    expect(balances.q1).toBe(2232000000);expect(balances.netQ1).toBe(223080000);
  });
  test('stok tidak negatif dan dokumen bukan judul kosong',()=>{
    for(const p of products)expect(p.opening+p.production.reduce((s,n)=>s+n,0)-p.sales.reduce((s,n)=>s+n,0)).toBeGreaterThan(0);
    expect(documents.length).toBe(15);expect(new Set(documents.map(d=>d.key)).size).toBe(documents.length);
    for(const d of documents){expect(d.content).toContain(simulation);expect(d.content.length).toBeGreaterThan(1400);}
    for(const label of judgments)expect(documents.some(d=>d.key===label.key)).toBe(true);
  });
});
