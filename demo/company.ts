/** Seluruh identitas dan transaksi berikut fiktif. Angka diturunkan dari satu ledger. */
export const company='PT Pangan Lestari Nusantara';
export const simulation='DATA SIMULASI PERUSAHAAN FIKTIF. Bukan data pelanggan, laporan audit, atau izin edar nyata.';
export const products=[
  {sku:'PLN-001',name:'Keripik Pisang Original 80 g',price:12000,cost:7000,opening:8000,production:[20000,22500,24800],sales:[18000,20500,23000],raw:'Pisang kepok, minyak kelapa sawit, gula, garam',shelf:'6 bulan',allergen:'Diproses pada fasilitas yang juga menangani susu dan kedelai'},
  {sku:'PLN-002',name:'Granola Cokelat 200 g',price:28000,cost:17000,opening:6000,production:[10000,11800,13000],sales:[9000,10500,12000],raw:'Oat, bubuk kakao, madu, susu bubuk, almond',shelf:'9 bulan',allergen:'Susu, almond, gluten; tidak cocok untuk alergi bahan tersebut'},
  {sku:'PLN-003',name:'Sambal Tuna 150 g',price:24000,cost:14000,opening:4000,production:[8000,9200,11000],sales:[7000,8500,10000],raw:'Tuna, cabai, bawang merah, minyak, garam',shelf:'12 bulan sebelum dibuka; sesudah dibuka simpan dingin dan habiskan 7 hari',allergen:'Ikan'},
];
export const months=[
  {name:'Januari',code:'2026-01',rent:30000000,payroll:75000000,marketing:28000000,logistics:22000000,utilities:15000000,admin:8000000,purchases:470000000,supplierPayment:440000000,capital:30000000},
  {name:'Februari',code:'2026-02',rent:30000000,payroll:78000000,marketing:32000000,logistics:25000000,utilities:17000000,admin:9000000,purchases:520000000,supplierPayment:505000000,capital:40000000},
  {name:'Maret',code:'2026-03',rent:30000000,payroll:82000000,marketing:36000000,logistics:29000000,utilities:19000000,admin:10000000,purchases:580000000,supplierPayment:568000000,capital:60000000},
];
export const rupiah=(n:number)=>'Rp'+Math.round(n).toLocaleString('id-ID');
export const number=(n:number)=>n.toLocaleString('id-ID');
export const financials=months.map((m,i)=>{
  const revenue=products.reduce((sum,p)=>sum+p.price*p.sales[i],0);
  const cogs=products.reduce((sum,p)=>sum+p.cost*p.sales[i],0);
  const operating=m.rent+m.payroll+m.marketing+m.logistics+m.utilities+m.admin;
  const depreciation=10000000,interest=6000000,gross=revenue-cogs,pretax=gross-operating-depreciation-interest,tax=Math.round(pretax*.22),net=pretax-tax;
  const credit=revenue*.3,cashSales=revenue*.7,collections=i===0?120000000:products.reduce((sum,p)=>sum+p.price*p.sales[i-1],0)*.3;
  return {...m,revenue,cogs,operating,depreciation,interest,gross,pretax,tax,net,credit,cashSales,collections};
});
const salesTotal=products.reduce((s,p)=>s+p.sales.reduce((a,b)=>a+b,0),0);
const q1=financials.reduce((s,m)=>s+m.revenue,0);
const netQ1=financials.reduce((s,m)=>s+m.net,0);
const grossQ1=financials.reduce((s,m)=>s+m.gross,0);
const closingAR=150000000+financials.reduce((s,m)=>s+m.credit-m.collections,0);
const closingAP=220000000+financials.reduce((s,m)=>s+m.purchases-m.supplierPayment,0);
const cashRows=financials.map(m=>({...m,inflow:m.cashSales+m.collections,outflow:m.supplierPayment+m.operating+m.interest+m.tax+m.capital}));
const closingCash=500000000+cashRows.reduce((s,m)=>s+m.inflow-m.outflow,0);
const closingInventory=650000000+financials.reduce((s,m)=>s+m.purchases-m.cogs,0);
const closingAssets=1200000000+financials.reduce((s,m)=>s+m.capital-m.depreciation,0);

export type CompanyDocument={key:string;title:string;category:string;content:string};
function doc(key:string,title:string,category:string,body:string):CompanyDocument{
  return {key,title,category,content:`# ${title}\n\n${simulation}\n\nPerusahaan: ${company}\nKode dokumen: PLN/${key.toUpperCase()}/2026\nStatus: dokumen simulasi aktif, revisi 1\nPemilik proses: tim ${category}\nCakupan: Januari sampai Maret 2026 kecuali dinyatakan berbeda.\n\n${body}\n\n## Pengendalian dokumen\nDokumen ini disusun untuk menguji Enterprise Search. Semua nama badan usaha, supplier, transaksi, batch, serta angka bersifat fiktif. Dokumen tidak boleh digunakan sebagai bukti legal, sertifikasi, pelaporan pajak, atau rekomendasi investasi. Perubahan isi wajib membuat revisi baru; referensi angka menggunakan dokumen keuangan dan ledger simulasi periode yang sama.\n`};
}

export const documents:CompanyDocument[]=[
  doc('profil','Profil Perusahaan dan Rencana Bisnis 2026','Perusahaan',`## Ringkasan usaha
PT Pangan Lestari Nusantara adalah perusahaan makanan kemasan fiktif, berbasis operasi simulasi di Makassar dengan gudang distribusi di Gowa. Perusahaan menjual camilan pisang, granola, dan sambal ikan melalui distributor, toko ritel, serta kanal daring. Nama, lokasi operasi, dan riwayat usaha dalam dokumen ini tidak merepresentasikan badan usaha nyata.

## Organisasi dan kewenangan
Direktur operasional simulasi: Raka Pratama. Kepala keuangan: Nabila Putri. Kepala produksi: Dimas Wirawan. Kepala pembelian: Sari Wulandari. Kepala mutu: Andi Mahendra. Penanggung jawab gudang: Lina Safitri. Customer care: Maya Kusuma. Pengadaan di atas Rp50.000.000 harus disetujui direktur operasional dan kepala keuangan. Pembayaran tidak boleh disetujui orang yang sama dengan pembuat pesanan pembelian.

## Model pendapatan dan sasaran
Tiga SKU aktif tercantum di Katalog Produk 2026. Sasaran pendapatan triwulan pertama adalah Rp2.050.000.000. Realisasi omzet Januari sampai Maret mencapai ${rupiah(q1)}, dengan ${number(salesTotal)} kemasan terjual. Selisih realisasi terhadap target sebesar ${rupiah(q1-2050000000)}. Target berikutnya bukan realisasi: pendapatan April sampai Juni Rp2.400.000.000 dan peluncuran varian granola kacang pada Juni 2026 setelah evaluasi alergen. Belum ada laporan keuangan April 2026 dalam corpus ini.

## Risiko usaha
Harga tuna dan oat dapat berubah, pemasok tertentu terkonsentrasi, serta penjualan distributor memakai termin kredit. Pengendalian: minimal dua pemasok potensial per bahan kritis, inspeksi bahan masuk, FEFO di gudang, dan review piutang mingguan. Corpus demo belum memuat hasil audit eksternal atau nomor BPOM/sertifikat halal nyata.`),
  doc('katalog','Katalog Produk dan Spesifikasi Makanan 2026','Produk',`## Produk aktif dan harga
Harga berikut adalah harga jual bersih rata-rata per kemasan dalam ledger demo, belum termasuk PPN. Tidak ada diskon tambahan dalam transaksi Januari sampai Maret.

| SKU | Produk | Isi bersih | Harga per kemasan | Biaya standar / HPP | Masa simpan |
|---|---|---|---:|---:|---|
${products.map(p=>`| ${p.sku} | ${p.name} | ${p.name.match(/\d+ g/)?.[0]} | ${rupiah(p.price)} | ${rupiah(p.cost)} | ${p.shelf} |`).join('\n')}

${products.map(p=>`## ${p.name}\nKode SKU: ${p.sku}. Komposisi simulasi: ${p.raw}.\nInformasi alergen: ${p.allergen}.\nPenyimpanan sebelum dibuka: tempat bersih, kering, terlindung matahari, suhu 20 sampai 28 derajat Celsius. ${p.sku==='PLN-003'?'Sambal tuna setelah dibuka disimpan pada suhu 0 sampai 4 derajat Celsius; gunakan sendok bersih dan habiskan dalam 7 hari.':'Setelah dibuka tutup kemasan rapat; kualitas terbaik dalam 14 hari.'}\nKemasan primer: ${p.sku==='PLN-003'?'botol kaca 150 g dengan tutup segel':'standing pouch berlapis penghalang kelembapan'}. Kode batch dan tanggal kedaluwarsa harus terbaca. Klaim nutrisi, izin edar, dan sertifikasi tidak dibuat karena dokumen ini bukan hasil pengujian laboratorium.\nHarga ${rupiah(p.price)}, biaya standar ${rupiah(p.cost)}, sehingga kontribusi kotor per kemasan ${rupiah(p.price-p.cost)} sebelum biaya operasional.`).join('\n\n')}

## Penanganan pelanggan
Pelanggan dengan alergi ikan tidak boleh diarahkan membeli Sambal Tuna. Granola mengandung susu dan almond. Keluhan kemasan bocor, bau menyimpang, atau segel rusak masuk SOP Pengaduan dan Penarikan. Jangan menjanjikan produk bebas alergen tanpa bukti spesifikasi.`),
  ...financials.map((m,i)=>doc('keuangan-'+m.code,`Laporan Keuangan ${m.name} 2026`,'Keuangan',`## Dasar laporan dan periode
Periode ${i===0?'1 sampai 31 Januari':i===1?'1 sampai 28 Februari':'1 sampai 31 Maret'} 2026. Pada laporan keuangan di bulan ${m.name.toLowerCase()} mencatat bahwa pendapatan penjualan bersih mencapai ${rupiah(m.revenue)}. Semua angka dalam rupiah, tidak dalam ribuan atau jutaan. Basis akrual, belum termasuk PPN; HPP berdasarkan biaya standar SKU. Asumsi pajak laba 22% digunakan hanya untuk simulasi dan bukan nasihat pajak.

## Rincian penjualan dan harga pokok
| Produk / SKU | Kemasan terjual | Harga jual per kemasan | Pendapatan bersih | HPP per kemasan | Total HPP |
|---|---:|---:|---:|---:|---:|
${products.map(p=>`| ${p.name} / ${p.sku} | ${number(p.sales[i])} | ${rupiah(p.price)} | ${rupiah(p.sales[i]*p.price)} | ${rupiah(p.cost)} | ${rupiah(p.sales[i]*p.cost)} |`).join('\n')}
| Total | ${number(products.reduce((s,p)=>s+p.sales[i],0))} | - | ${rupiah(m.revenue)} | - | ${rupiah(m.cogs)} |

## Laporan laba rugi
| Pos | Nilai |
|---|---:|
| Pendapatan penjualan bersih / omzet | ${rupiah(m.revenue)} |
| Harga pokok penjualan (HPP) | ${rupiah(m.cogs)} |
| Laba kotor | ${rupiah(m.gross)} |
| Gaji dan tunjangan | ${rupiah(m.payroll)} |
| Sewa | ${rupiah(m.rent)} |
| Pemasaran | ${rupiah(m.marketing)} |
| Logistik dan pengiriman | ${rupiah(m.logistics)} |
| Utilitas | ${rupiah(m.utilities)} |
| Administrasi | ${rupiah(m.admin)} |
| Total biaya operasional tunai | ${rupiah(m.operating)} |
| Penyusutan aset | ${rupiah(m.depreciation)} |
| Laba operasional | ${rupiah(m.gross-m.operating-m.depreciation)} |
| Beban bunga | ${rupiah(m.interest)} |
| Laba sebelum pajak | ${rupiah(m.pretax)} |
| Beban pajak simulasi 22% | ${rupiah(m.tax)} |
| Laba bersih | ${rupiah(m.net)} |

## Analisis manajemen
Margin laba kotor ${(m.gross/m.revenue*100).toFixed(2)}%; margin laba bersih ${(m.net/m.revenue*100).toFixed(2)}%. ${i>0?`Pendapatan meningkat ${rupiah(m.revenue-financials[i-1].revenue)} atau ${((m.revenue/financials[i-1].revenue-1)*100).toFixed(2)}% dibanding ${financials[i-1].name.toLowerCase()} 2026. Laba bersih berubah dari ${rupiah(financials[i-1].net)} menjadi ${rupiah(m.net)}.`:'Ini bulan pertama yang tersedia dalam demo; tidak ada data Desember 2025 untuk perbandingan.'}
Granola memiliki harga jual tertinggi per kemasan; volume terbesar berasal dari keripik pisang. Pembelian bahan/inventori ${rupiah(m.purchases)} tidak sama dengan HPP bulan ini; selisihnya memengaruhi saldo persediaan. Pembayaran supplier ${rupiah(m.supplierPayment)} mengurangi kas dan utang, bukan langsung menjadi biaya baru.

## Piutang dan arus kas terkait
Penjualan tunai 70% sebesar ${rupiah(m.cashSales)}; penjualan kredit 30% sebesar ${rupiah(m.credit)}. Penerimaan piutang dari periode sebelumnya ${rupiah(m.collections)}. Arus kas serta neraca lengkap tersedia pada dokumen Arus Kas dan Neraca Triwulan I 2026. Pengakuan omzet bukan berarti seluruh penjualan sudah menjadi uang kas.

## Pemeriksaan
Pendapatan merupakan jumlah unit terjual dikalikan harga jual per SKU. Laba kotor = pendapatan dikurangi HPP. Laba bersih = laba sebelum pajak dikurangi beban pajak simulasi. Penyusun simulasi: Nabila Putri; peninjau: direktur operasional. Bukan laporan audit.`)),
  doc('neraca','Arus Kas dan Neraca Triwulan I 2026','Keuangan',`## Saldo awal 1 Januari 2026
Kas Rp500.000.000, piutang usaha Rp150.000.000, persediaan Rp650.000.000, aset tetap bersih Rp1.200.000.000. Total aset Rp2.500.000.000. Utang supplier Rp220.000.000, pinjaman bank Rp600.000.000, modal disetor Rp1.500.000.000, laba ditahan awal Rp180.000.000. Total kewajiban dan ekuitas Rp2.500.000.000.

## Arus kas bulanan
| Pos | Januari 2026 | Februari 2026 | Maret 2026 |
|---|---:|---:|---:|
| Penjualan tunai | ${cashRows.map(m=>rupiah(m.cashSales)).join(' | ')} |
| Penerimaan piutang | ${cashRows.map(m=>rupiah(m.collections)).join(' | ')} |
| Total penerimaan kas | ${cashRows.map(m=>rupiah(m.inflow)).join(' | ')} |
| Pembayaran supplier | ${cashRows.map(m=>rupiah(m.supplierPayment)).join(' | ')} |
| Biaya operasional tunai | ${cashRows.map(m=>rupiah(m.operating)).join(' | ')} |
| Pembayaran bunga | ${cashRows.map(m=>rupiah(m.interest)).join(' | ')} |
| Pembayaran pajak simulasi | ${cashRows.map(m=>rupiah(m.tax)).join(' | ')} |
| Belanja aset tetap | ${cashRows.map(m=>rupiah(m.capital)).join(' | ')} |
| Total pengeluaran kas | ${cashRows.map(m=>rupiah(m.outflow)).join(' | ')} |
| Perubahan kas bersih | ${cashRows.map(m=>rupiah(m.inflow-m.outflow)).join(' | ')} |

## Neraca 31 Maret 2026
| Pos | Nilai |
|---|---:|
| Kas akhir | ${rupiah(closingCash)} |
| Piutang usaha akhir | ${rupiah(closingAR)} |
| Persediaan akhir, termasuk bahan dan barang jadi | ${rupiah(closingInventory)} |
| Aset tetap bersih | ${rupiah(closingAssets)} |
| Total aset | ${rupiah(closingCash+closingAR+closingInventory+closingAssets)} |
| Utang supplier | ${rupiah(closingAP)} |
| Pinjaman bank | Rp600.000.000 |
| Modal disetor | Rp1.500.000.000 |
| Laba ditahan akhir | ${rupiah(180000000+netQ1)} |
| Total kewajiban dan ekuitas | ${rupiah(closingAP+600000000+1500000000+180000000+netQ1)} |

## Rekonsiliasi
Piutang akhir = Rp150.000.000 + penjualan kredit triwulan dikurangi penerimaan piutang triwulan. Utang supplier akhir = Rp220.000.000 + pembelian inventori dikurangi pembayaran supplier. Persediaan akhir = Rp650.000.000 + pembelian inventori dikurangi HPP. Belanja aset Rp130.000.000 menambah aset tetap; penyusutan triwulan Rp30.000.000 mengurangi nilainya. Tidak ada pembayaran pokok pinjaman, dividen, atau tambahan modal selama periode ini. Pajak simulasi dibayar pada bulan yang sama dengan beban pajak. Saldo neraca seimbang dan laba ditahan naik sebesar laba bersih triwulan ${rupiah(netQ1)}.

## Makna manajerial
Arus kas masuk tidak sama dengan omzet karena ada penjualan kredit dan penerimaan piutang lama. Inventori mencakup bahan baku, barang dalam proses, dan barang jadi; jangan menyamakan seluruh nilai persediaan dengan kemasan jadi pada laporan gudang.`),
  doc('penjualan','Laporan Penjualan dan Kanal Distribusi Triwulan I 2026','Penjualan',`## Realisasi penjualan
Omzet bersih triwulan Januari sampai Maret ${rupiah(q1)} dan ${number(salesTotal)} kemasan. Harga jual dan jumlah per SKU konsisten dengan laporan keuangan bulanan.

| Produk | Januari unit | Februari unit | Maret unit | Total unit | Total omzet |
|---|---:|---:|---:|---:|---:|
${products.map(p=>`| ${p.name} | ${number(p.sales[0])} | ${number(p.sales[1])} | ${number(p.sales[2])} | ${number(p.sales.reduce((s,n)=>s+n,0))} | ${rupiah(p.sales.reduce((s,n)=>s+n,0)*p.price)} |`).join('\n')}

## Kanal distribusi berdasarkan nilai
Alokasi kanal simulasi berlaku pada tiap bulan: distributor 50%, toko ritel 30%, kanal daring 20%. Ini alokasi nilai penjualan, bukan jumlah unit atau daftar transaksi pelanggan individual.
| Periode | Distributor | Ritel | Daring | Total |
|---|---:|---:|---:|---:|
${financials.map(m=>`| ${m.name} 2026 | ${rupiah(m.revenue*.5)} | ${rupiah(m.revenue*.3)} | ${rupiah(m.revenue*.2)} | ${rupiah(m.revenue)} |`).join('\n')}

## Penilaian kinerja
Keripik Pisang Original mempunyai volume triwulan terbesar, ${number(products[0].sales.reduce((s,n)=>s+n,0))} kemasan. Granola Cokelat menghasilkan omzet terbesar per produk, ${rupiah(products[1].sales.reduce((s,n)=>s+n,0)*products[1].price)}. Jangan menyamakan produk paling banyak unitnya dengan paling besar pendapatannya.
Laba kotor triwulan ${rupiah(grossQ1)}. Tidak ada retur yang diakui sebagai pengurang penjualan selama Januari sampai Maret; kasus keluhan ditangani sebagai layanan pelanggan tanpa koreksi nilai ledger. Proyeksi April bukan penjualan aktual.

## Kebijakan order
Distributor harus memiliki persetujuan limit kredit. Pesanan ritel dan daring dibayar sebelum pengiriman kecuali ada kontrak tertulis. Nilai kredit ditetapkan 30% dari total penjualan bulanan pada model demo; sisa 70% tunai. Pemrosesan pesanan memerlukan cek stok tersedia, tanggal kedaluwarsa, alamat, serta nomor batch. Tidak ada identitas pelanggan pribadi nyata pada dokumen ini.`),
  doc('supplier','Daftar Supplier dan Evaluasi Pemasok Maret 2026','Pengadaan',`## Master supplier aktif
Semua supplier berikut fiktif. Kode digunakan oleh dokumen pembelian dan rencana kebutuhan bahan.
| Kode | Nama supplier | Bahan / layanan | Termin | Lead time | Skor mutu | Risiko |
|---|---|---|---|---|---:|---|
| SUP-01 | CV Kebun Pisang Sejahtera | Pisang kepok | 30 hari | 3 hari | 92/100 | Sedang, variasi kematangan musiman |
| SUP-02 | PT Biji Sehat Sentosa | Oat, kakao, almond, susu bubuk | 30 hari | 7 hari | 89/100 | Sedang, ketergantungan bahan impor |
| SUP-03 | CV Laut Biru Pangan | Tuna dingin | 14 hari | 2 hari | 94/100 | Tinggi, perlu rantai dingin |
| SUP-04 | PT Kemas Aman Mandiri | Pouch, botol kaca, label | 30 hari | 10 hari | 87/100 | Sedang, waktu kemasan panjang |
| SUP-05 | CV Bumbu Nusantara | Cabai, bawang merah, minyak, gula, garam, madu | 14 hari | 4 hari | 90/100 | Sedang, fluktuasi harga cabai |

## Evaluasi dan persyaratan penerimaan
CV Laut Biru Pangan adalah pemasok bahan ikan tuna. Tuna harus tiba pada suhu 0 sampai 4 derajat Celsius dengan data batch, tanggal kirim, dan catatan suhu. Kiriman dengan suhu di atas 4 derajat atau bau menyimpang dikarantina; tidak boleh dipakai sebelum QA menyetujui.
PT Biji Sehat Sentosa memasok bahan granola termasuk almond dan susu, sehingga dokumen alergen wajib menyertai setiap perubahan komposisi. PT Kemas Aman Mandiri memasok kemasan primer; botol retak, segel tidak rapat, dan label tidak terbaca adalah cacat kritis. CV Kebun Pisang Sejahtera harus memenuhi spesifikasi kematangan dan bebas kerusakan busuk yang tampak.

## Metode penilaian
Skor evaluasi tertimbang: mutu 40%, ketepatan pengiriman 30%, kelengkapan dokumen 20%, respons komplain 10%. Skor minimal 85 untuk supplier aktif. Skor tabel adalah hasil simulasi review Maret, bukan sertifikasi. Dua kiriman bermasalah berturut-turut memicu audit internal dan pertimbangan supplier alternatif.

## Pembayaran dan konflik kepentingan
Pembayaran dilakukan setelah pencocokan purchase order, penerimaan gudang, serta tagihan (three-way match). Perubahan rekening supplier harus diverifikasi terpisah oleh keuangan dan pembelian. Tidak ada rekening bank, NPWP, nomor telepon, atau kontrak asli dalam corpus. Kontak operasional supplier disimulasikan sebagai jabatan sales/account manager, tanpa alamat email publik.

## Prioritas tindak lanjut
Risiko tertinggi adalah putusnya rantai dingin tuna. Lead time paling panjang adalah kemasan, 10 hari. Pembelian kemasan dilakukan minimal dua minggu sebelum rencana produksi. Supplier alternatif baru berstatus kandidat, belum disetujui dan belum melakukan transaksi.`),
  doc('pembelian','Register Pembelian Bahan dan Utang Supplier Triwulan I 2026','Pengadaan',`## Pembelian inventori dan pembayaran
Pembelian dinyatakan dalam rupiah dan dicatat ke persediaan. Alokasi lima supplier per bulan: SUP-01 20%, SUP-02 25%, SUP-03 25%, SUP-04 15%, SUP-05 15%.
| Periode | SUP-01 | SUP-02 | SUP-03 | SUP-04 | SUP-05 | Total pembelian |
|---|---:|---:|---:|---:|---:|---:|
${financials.map(m=>`| ${m.name} 2026 | ${rupiah(m.purchases*.2)} | ${rupiah(m.purchases*.25)} | ${rupiah(m.purchases*.25)} | ${rupiah(m.purchases*.15)} | ${rupiah(m.purchases*.15)} | ${rupiah(m.purchases)} |`).join('\n')}

| Periode | Pembelian inventori | Pembayaran supplier | Kenaikan utang |
|---|---:|---:|---:|
${financials.map(m=>`| ${m.name} 2026 | ${rupiah(m.purchases)} | ${rupiah(m.supplierPayment)} | ${rupiah(m.purchases-m.supplierPayment)} |`).join('\n')}
Utang awal 1 Januari Rp220.000.000. Utang akhir 31 Maret ${rupiah(closingAP)}. Pembayaran termasuk pelunasan saldo awal; data ini bukan daftar invoice rinci. Register nilai menjadi acuan angka arus kas dan neraca.

## Pesanan pembelian Maret
PO-202603-01 untuk CV Kebun Pisang Sejahtera bernilai Rp116.000.000, disetujui 2 Maret. PO-202603-02 untuk PT Biji Sehat Sentosa Rp145.000.000, disetujui 2 Maret. PO-202603-03 untuk CV Laut Biru Pangan Rp145.000.000, disetujui 3 Maret. PO-202603-04 untuk PT Kemas Aman Mandiri Rp87.000.000, disetujui 1 Maret. PO-202603-05 untuk CV Bumbu Nusantara Rp87.000.000, disetujui 3 Maret. Total lima PO Rp580.000.000. Nilai register belum termasuk PPN dan menggunakan nilai simulasi tanpa nomor invoice nyata.

## Kontrol procurement
PO di atas Rp50.000.000 memerlukan dua persetujuan. Pembelian harus mengacu daftar supplier aktif, forecast produksi, saldo gudang, dan safety stock. Bukti penerimaan merekam kuantitas aktual, batch, suhu jika perlu, serta hasil pemeriksaan mutu. Tagihan dengan kuantitas berbeda ditahan hingga selisih selesai. Jangan menghitung pembelian inventori sebagai beban operasional langsung; HPP diakui saat penjualan.

## Jadwal review
Kepala pembelian dan keuangan meninjau utang setiap Jumat. Supplier dengan termin 14 hari diprioritaskan menurut tanggal jatuh tempo, tanpa mendahulukan transaksi yang tidak mempunyai dokumen lengkap.`),
  doc('stok','Laporan Persediaan Barang Jadi 31 Maret 2026','Gudang',`## Pergerakan stok kemasan
Unit tabel adalah kemasan jadi. Saldo awal + produksi selesai - penjualan = stok akhir. Tidak ada kehilangan, scrap barang jadi, atau retur dalam ledger simulasi ini; pengamatan mutu tidak mengubah jumlah ledger.
| SKU / Produk | Awal 1 Januari | Produksi Januari–Maret | Penjualan Januari–Maret | Akhir 31 Maret | Biaya standar | Nilai barang jadi |
|---|---:|---:|---:|---:|---:|---:|
${products.map(p=>{const prod=p.production.reduce((s,n)=>s+n,0),sales=p.sales.reduce((s,n)=>s+n,0),closing=p.opening+prod-sales;return`| ${p.sku} / ${p.name} | ${number(p.opening)} | ${number(prod)} | ${number(sales)} | ${number(closing)} | ${rupiah(p.cost)} | ${rupiah(closing*p.cost)} |`}).join('\n')}

## Stok bulanan
${months.map((m,i)=>`### ${m.name} 2026\n${products.map(p=>{const opening=p.opening+p.production.slice(0,i).reduce((s,n)=>s+n,0)-p.sales.slice(0,i).reduce((s,n)=>s+n,0);return `${p.name}: awal ${number(opening)}, produksi ${number(p.production[i])}, keluar penjualan ${number(p.sales[i])}, akhir ${number(opening+p.production[i]-p.sales[i])} kemasan.`}).join('\n')}`).join('\n\n')}

## Nilai dan rekonsiliasi
Nilai barang jadi akhir ${rupiah(products.reduce((s,p)=>s+(p.opening+p.production.reduce((a,n)=>a+n,0)-p.sales.reduce((a,n)=>a+n,0))*p.cost,0))}. Total persediaan neraca ${rupiah(closingInventory)} mencakup bahan baku dan barang dalam proses selain barang jadi. Jangan membandingkan nilai barang jadi saja dengan keseluruhan neraca tanpa rekonsiliasi komponen.

## Pengeluaran dan batas stok
Kebijakan FEFO: batch dengan tanggal kedaluwarsa terdekat dikeluarkan lebih dulu, bukan hanya batch yang masuk paling awal. Safety stock minimal keripik 5.000 kemasan, granola 3.000, sambal tuna 2.000. Ketiga SKU berada di atas batas pada 31 Maret. Tempat penyimpanan harus kering, bersih, dan tidak menerima sinar matahari langsung. Produk dikarantina dipisahkan secara fisik dan diblokir dari penjualan.

## Stock opname
Penghitungan akhir bulan dilakukan dua orang, satu gudang dan satu keuangan. Selisih lebih dari 0,5% jumlah kemasan memerlukan investigasi dan persetujuan kepala operasional. Dokumen ini tidak berisi inventori April 2026.`),
  doc('produksi','Rencana dan Realisasi Produksi Triwulan I 2026','Produksi',`## Volume produksi selesai
| Produk | Januari kemasan | Februari kemasan | Maret kemasan | Total |
|---|---:|---:|---:|---:|
${products.map(p=>`| ${p.name} | ${number(p.production[0])} | ${number(p.production[1])} | ${number(p.production[2])} | ${number(p.production.reduce((s,n)=>s+n,0))} |`).join('\n')}

## Batch produksi Maret
Keripik Pisang PLN-001: batch KP-260305 8.000 kemasan, KP-260315 8.200, KP-260325 8.600; total 24.800. Granola PLN-002: GR-260307 4.000, GR-260317 4.500, GR-260327 4.500; total 13.000. Sambal Tuna PLN-003: ST-260308 3.500, ST-260318 3.500, ST-260328 4.000; total 11.000. Semua batch simulasi lolos release QA sebelum masuk saldo barang jadi.

## Alur kerja
Penerimaan bahan → inspeksi dan karantina sementara → penyimpanan sesuai jenis → penimbangan resep → proses produksi → pengisian/penyegelan → pemeriksaan label dan berat → pemeriksaan mutu → release QA → stok barang jadi. Bahan ikan memakai rantai dingin. Bahan alergen granola dipisahkan dan pergantian lini wajib dibersihkan serta dicatat.

## Kapasitas dan rencana
Kapasitas simulasi per bulan: keripik 30.000, granola 16.000, sambal tuna 14.000 kemasan. Pemanfaatan kapasitas Maret masing-masing 82,67%, 81,25%, dan 78,57%. Target produksi April: keripik 26.000, granola 14.000, sambal tuna 12.000; angka tersebut rencana, bukan realisasi. Rencana belum menjadi penjualan atau omzet.

## Pengendalian biaya
Biaya standar per kemasan keripik Rp7.000, granola Rp17.000, sambal tuna Rp14.000. Biaya standar mencakup bahan, kemasan, dan overhead produksi simulasi; jangan menambahkan ulang overhead ke HPP laporan keuangan. Biaya penjualan, administrasi, sewa, serta logistik pada laporan laba rugi dicatat di luar HPP. Seluruh pembelian inventori dan perubahan nilai stok menggunakan ledger yang sama.

## Catatan batas data
Corpus tidak memuat resep komersial teruji, parameter thermal processing tervalidasi, hasil laboratorium, atau bukti sertifikasi pangan. Prosedur berikut adalah simulasi proses pengendalian, bukan instruksi produksi makanan siap digunakan tanpa validasi ahli.`),
  doc('mutu','SOP Penerimaan Bahan, Mutu, dan Keamanan Pangan','Mutu',`## Tujuan dan tanggung jawab
SOP simulasi menjaga bahan yang masuk sesuai spesifikasi, dapat ditelusuri ke supplier, serta tidak langsung digunakan bila ada ketidaksesuaian. Gudang menerima dan mencatat; QA memeriksa serta memutuskan release; pembelian menindaklanjuti klaim supplier. SOP bukan pengganti standar keamanan pangan tervalidasi.

## Penerimaan bahan
1. Cocokkan supplier aktif, nomor PO, surat jalan, bahan, kuantitas, dan kode batch.
2. Periksa kemasan, kebersihan kendaraan, tanggal kedaluwarsa, dan kondisi fisik bahan.
3. Untuk tuna dingin dari CV Laut Biru Pangan, ukur suhu penerimaan. Batas simulasi 0 sampai 4 derajat Celsius. Catat alat ukur dan waktunya.
4. Kiriman tuna di atas 4 derajat, bau menyimpang, atau tanpa identitas batch ditahan dalam karantina. Jangan menerima untuk produksi hanya karena kebutuhan mendesak.
5. Oat, almond, susu bubuk, dan kakao diperiksa dokumen alergen dan kelembapan kemasan. Bahan kering disimpan terpisah dari ikan dan bahan kimia pembersih.
6. QA menandatangani release. Jika ditolak, pembelian menghubungi supplier; keuangan menahan pembayaran terkait hingga penyelesaian disetujui.

## Pencegahan kontaminasi dan alergen
Granola mengandung susu dan almond. Tuna mengandung alergen ikan. Peralatan serta area penyimpanan diberi identifikasi, personel membersihkan lini sebelum pergantian, dan label tidak boleh mengklaim bebas alergen tanpa uji. Pekerja yang sakit tidak menangani pangan sebelum dinyatakan layak. Jadwal pembersihan, pelatihan higiene, dan inspeksi hama dicatat dalam log internal.

## Release barang jadi
QA memeriksa identitas SKU, batch, tanggal produksi, tanggal kedaluwarsa, integritas segel, berat bersih, dan kesesuaian label dengan spesifikasi. Produk dengan segel bocor, botol retak, atau label alergen hilang tidak boleh dijual. Temuan memicu karantina, investigasi, dan tindakan korektif.

## Retensi dan eskalasi
Catatan supplier, batch, hasil inspeksi, dan distribusi disimpan dalam simulasi selama dua tahun. Keluhan kritis atau dugaan bahaya pangan diekskalasikan ke kepala mutu dan direktur segera; tindak lanjut merujuk SOP Pengaduan dan Penarikan. Jangan menganggap kondisi normal dari fakta bahwa penjualan naik.`),
  doc('pengiriman','SOP Gudang, Pengiriman, dan Distribusi','Gudang',`## Penyimpanan dan picking
Barang jadi disimpan pada 20 sampai 28 derajat Celsius, kering, dan tidak terkena matahari langsung. Gunakan FEFO (First Expired, First Out): pilih tanggal kedaluwarsa paling dekat. FIFO hanya mengikuti urutan masuk dan tidak selalu cukup untuk pangan. Produk karantina tidak boleh tersedia untuk picking.

## Pemrosesan order
Admin memeriksa status pembayaran atau limit kredit distributor. Gudang memastikan SKU, jumlah, batch, dan sisa umur produk. Sisa umur minimal saat dikirim adalah tiga bulan untuk keripik/granola dan empat bulan untuk sambal tuna, kecuali kontrak tertulis menyatakan lain. Perubahan ketentuan tidak boleh disetujui hanya lewat pesan lisan.

## Pengemasan transportasi
Pouch dilindungi karton yang sesuai, botol kaca memakai sekat agar tidak pecah, serta segel harus utuh. Kendaraan bersih dan tidak mengangkut bahan kimia bersama makanan. Sambal tuna yang belum dibuka adalah barang jadi suhu ruang sesuai spesifikasi demo; aturan 0 sampai 4 derajat berlaku untuk bahan tuna dingin dan sambal setelah dibuka, bukan disamakan dengan seluruh pengiriman produk.

## Dokumen pengiriman
Surat jalan memuat nomor order, tanggal, SKU, jumlah, batch, penerima, dan identitas pengangkut. Pelacakan batch diperlukan agar penarikan dapat menentukan pelanggan terdampak. Konfirmasi penerimaan disimpan sebelum order dianggap terkirim. Kerusakan dicatat dengan foto dan nomor batch tanpa membagikan identitas pelanggan di corpus publik.

## Service level dan pengecualian
Target simulasi persiapan order adalah satu hari kerja setelah pembayaran/approval. Distributor memiliki jadwal pengiriman dua kali seminggu; kanal daring setiap hari kerja. Keterlambatan lebih dari dua hari dieskalasikan ke kepala gudang. Target ini bukan janji SLA kepada pelanggan nyata. Biaya logistik aktual Januari Rp22.000.000, Februari Rp25.000.000, Maret Rp29.000.000, sesuai laporan laba rugi.`),
  doc('keluhan','SOP Pengaduan Pelanggan dan Penarikan Produk','Layanan Pelanggan',`## Penerimaan keluhan
Customer care merekam tanggal, SKU, nomor batch, jenis masalah, dan bukti kemasan. Jangan meminta data pribadi yang tidak diperlukan. Keluhan rasa, berat, dan keterlambatan dicatat berbeda dari keluhan keselamatan seperti alergi, benda asing, segel bocor, atau bau menyimpang.

## Eskalasi insiden
Dugaan bahaya pangan dilaporkan kepada kepala mutu dan direktur segera. QA memblokir stok batch terkait, meninjau catatan produksi dan supplier, serta menentukan apakah distribusi harus dihentikan. Keputusan penarikan tidak dibuat oleh AI atau customer care sendiri. Bila perlu pelaporan regulator, perusahaan nyata harus mengikuti hukum yang berlaku; corpus demo tidak mengklaim proses legal sudah dilakukan.

## Alur penarikan simulasi
Identifikasi batch terdampak → blokir stok → telusuri distribusi → hubungi pelanggan/kanal terdampak → kumpulkan dan karantina produk → investigasi akar masalah → verifikasi tindakan korektif → persetujuan penutupan. Batas simulasi: traceability internal selesai maksimal empat jam setelah keputusan; efektivitas penarikan ditinjau dalam 24 jam.

## Register layanan Maret 2026
Tiga kasus non-kritis simulasi: CC-260301 kemasan keripik terlipat saat transportasi; CC-260302 pengiriman granola terlambat satu hari; CC-260303 pelanggan meminta penjelasan penyimpanan sambal setelah dibuka. Semua ditutup dengan klarifikasi/penggantian layanan, tanpa retur penjualan atau koreksi ledger keuangan. Tidak ada penarikan aktif dan tidak ada kejadian alergi yang dilaporkan dalam register ini. Ketiadaan kasus bukan bukti produk bebas risiko.

## Pedoman respons
Untuk sambal tuna sesudah dibuka: simpan dingin 0 sampai 4 derajat Celsius dan habiskan dalam tujuh hari. Granola mengandung susu dan almond, sehingga pelanggan alergi perlu menghindarinya. Jangan menjawab pertanyaan kesehatan sebagai diagnosis. Nomor BPOM, sertifikat halal, dan hasil nutrisi tidak tersedia pada demo ini; jangan menciptakan nomor atau mengklaim sertifikasi.`),
  doc('kredit','Kebijakan Kredit Distributor dan Penagihan Piutang','Keuangan',`## Penjualan tunai dan kredit
Dalam model Januari sampai Maret, 70% nilai penjualan dibayar tunai dan 30% dicatat sebagai piutang kredit. Termin distributor yang disetujui adalah 30 hari. Keputusan kredit memerlukan pemeriksaan kontrak, riwayat pembayaran, dan approval kepala keuangan. Tidak ada data rekening atau pelanggan asli.

## Rekonsiliasi piutang
Saldo piutang awal Rp150.000.000. Penerimaan Januari Rp120.000.000 berasal dari saldo lama; sisa saldo awal Rp30.000.000 tetap belum tertagih sampai akhir Maret. Penerimaan Februari ${rupiah(financials[1].collections)} merupakan penjualan kredit Januari, penerimaan Maret ${rupiah(financials[2].collections)} merupakan penjualan kredit Februari. Penjualan kredit Maret ${rupiah(financials[2].credit)} belum diterima per 31 Maret. Piutang akhir ${rupiah(closingAR)} = sisa saldo lama Rp30.000.000 + kredit Maret ${rupiah(financials[2].credit)}.

## Aging akhir Maret
Piutang berjalan sampai 30 hari Rp255.600.000. Piutang lebih dari 90 hari Rp30.000.000 dari saldo awal. Tidak ada saldo kelompok 31–60 atau 61–90 hari pada ledger sederhana ini. Belum dibuat pencadangan kerugian kredit karena corpus demo tidak memiliki estimasi risiko teruji; hal itu merupakan keterbatasan laporan, bukan jaminan tertagih.

## Proses penagihan
Pengingat sebelum jatuh tempo dikirim tiga hari kerja sebelumnya. Pada jatuh tempo, keuangan memeriksa bukti pembayaran. Tujuh hari lewat tempo memicu penghentian sementara kredit baru; 30 hari lewat tempo dieskalasikan ke direktur. Batas kredit tidak ditambah untuk menutupi tunggakan tanpa persetujuan tertulis.

## Pembatasan akses dan pencatatan
Dokumen transaksi pelanggan nyata seharusnya hanya dapat dibaca pihak berwenang. Pada demo, kebijakan ini dibagikan ke ruang kerja karena tidak berisi identitas pribadi. Setiap perubahan termin atau limit harus terdokumentasi dan tidak berasal dari instruksi AI.`),
];

export const judgments=[
  {query:'laporan keuangan maret 2026',key:'keuangan-2026-03',split:'tuning',rationale:'Dokumen laba rugi periode Maret dengan pendapatan, biaya, dan laba bersih.'},
  {query:'makanan yang mengandung almond',key:'katalog',split:'tuning',rationale:'Spesifikasi granola mencantumkan almond dan peringatan alergen.'},
  {query:'berapa untung bersih bulan ketiga tahun 2026',key:'keuangan-2026-03',split:'holdout',rationale:'Bulan ketiga adalah Maret; laporan mencantumkan laba bersih, sinonim untung.'},
  {query:'siapa pemasok ikan untuk sambal dan berapa lama kirimnya',key:'supplier',split:'holdout',rationale:'Master supplier mengaitkan tuna, nama supplier, dan lead time dua hari.'},
  {query:'barang yang tanggal habis pakainya paling dekat dikirim dulu',key:'pengiriman',split:'holdout',rationale:'SOP menjelaskan FEFO sebagai pengeluaran berdasarkan tanggal kedaluwarsa.'},
  {query:'berapa uang yang belum dibayar pelanggan sampai akhir maret',key:'kredit',split:'holdout',rationale:'Kebijakan kredit memuat saldo piutang serta aging akhir Maret.'},
  {query:'cara menghadapi kiriman ikan yang terlalu hangat',key:'mutu',split:'holdout',rationale:'SOP menetapkan batas suhu penerimaan tuna dan prosedur karantina.'},
  {query:'cari dokumen penanganan barang makanan yang harus ditarik dari toko',key:'keluhan',split:'holdout',rationale:'SOP penarikan memuat blokir batch, traceability, dan komunikasi kanal terdampak.'},
];

export const balances={q1,netQ1,closingCash,closingAR,closingAP,closingInventory,closingAssets,
  totalAssets:closingCash+closingAR+closingInventory+closingAssets,
  totalLiabilitiesAndEquity:closingAP+600000000+1500000000+180000000+netQ1};
