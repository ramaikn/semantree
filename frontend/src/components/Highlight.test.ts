import {test,expect} from 'bun:test';
import {matchRanges,excerpt} from './Highlight';
test('menandai kata yang terpisah, bukan harus sama kalimat',()=>{
  const text='Pada laporan keuangan di bulan Maret mencatat bahwa penjualan meningkat pada 2026.';
  expect(matchRanges(text,['laporan','keuangan','maret','2026']).map(r=>text.slice(r.start,r.end))).toEqual(['laporan','keuangan','Maret','2026']);
});
test('highlight semantik, overlap, dan snippet di sekitar temuan',()=>{
  const text='x '.repeat(600)+'Laba bersih Maret Rp97.500.000.';
  expect(excerpt(text,['laba bersih'])).toContain('Laba bersih');
  expect(matchRanges('laba bersih',['laba','laba bersih'])).toEqual([{start:0,end:11}]);
  expect(matchRanges('pelabaan laba',['laba'])).toEqual([{start:9,end:13}]);
});
