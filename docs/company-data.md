# Corpus perusahaan makanan fiktif

## Status dan asal

PT Pangan Lestari Nusantara adalah identitas fiktif untuk review Enterprise Search. Seluruh nama personel, supplier, transaksi, batch, harga, dan angka laporan merupakan **data simulasi**, bukan laporan perusahaan nyata. Tidak ada NPWP, rekening bank, nomor izin edar, atau sertifikasi yang dibuat menyerupai bukti legal.

`demo/company.ts` menjadi satu sumber ledger dan teks dokumen. Nilai penjualan, HPP, stok, laba, pajak asumsi, arus kas, serta neraca dihitung dari array produk/bulan. `demo/company.test.ts` memeriksa saldo dan hubungan angka. Data simulasi lengkap tidak berarti dummy fitur: file benar-benar diupload, diekstrak, diindex, dicari, diunduh, serta dipakai AI melalui alur produk yang sama dengan file pengguna.

## Lima belas dokumen

1. Profil perusahaan dan rencana bisnis 2026.
2. Katalog produk serta komposisi/alergen/harga/penyimpanan.
3. Laporan keuangan Januari 2026.
4. Laporan keuangan Februari 2026.
5. Laporan keuangan Maret 2026.
6. Arus kas dan neraca triwulan I 2026.
7. Penjualan dan kanal distribusi.
8. Master supplier dan evaluasi pemasok.
9. Register pembelian dan utang supplier.
10. Persediaan barang jadi 31 Maret.
11. Rencana dan realisasi produksi.
12. SOP penerimaan bahan, mutu, dan keamanan pangan.
13. SOP gudang, pengiriman, dan distribusi.
14. SOP pengaduan dan penarikan produk.
15. Kebijakan kredit distributor dan penagihan piutang.

File asli Markdown tersedia melalui tombol unduhan aplikasi. Setiap dokumen punya kode, revisi, periode, status simulasi, isi beberapa bagian/tabel, dan pengendalian dokumen. Importer mencatat checksum dan ID di `.runtime/company-manifest.json`.

## Angka acuan untuk review

| Ukuran | Nilai |
|---|---:|
| Omzet Maret | Rp852.000.000 |
| HPP Maret | Rp505.000.000 |
| Laba kotor Maret | Rp347.000.000 |
| Laba bersih Maret | Rp97.500.000 |
| Omzet triwulan I | Rp2.232.000.000 |
| Laba bersih triwulan I | Rp223.080.000 |
| Piutang 31 Maret | Rp285.600.000 |
| Utang supplier 31 Maret | Rp277.000.000 |

Supplier tuna: **CV Laut Biru Pangan**, lead time **2 hari**, termin **14 hari**. Bahan tuna diterima pada **0–4 °C**, kiriman di atas batas dikarantina dan diperiksa QA. Ini batas prosedur simulasi, bukan validasi keamanan pangan untuk operasi nyata.

Laporan April belum ada. Rencana produksi April bukan omzet aktual. Produk granola mengandung susu dan almond, sambal tuna mengandung ikan. Dokumen tidak boleh dipakai sebagai rekomendasi kesehatan atau instruksi produksi komersial tervalidasi.

## Contoh pencarian dan batas evaluasi

- `laporan keuangan maret 2026`: cocok periode dan judul, kata boleh terpisah di kalimat.
- `berapa untung bersih bulan ketiga tahun 2026`: makna untung/laba dan bulan ketiga/Maret.
- `siapa pemasok ikan untuk sambal dan berapa lama kirimnya`: gabungan supplier, bahan, dan lead time.
- `barang yang tanggal habis pakainya paling dekat dikirim dulu`: parafrasa FEFO.
- `cara menghadapi kiriman ikan yang terlalu hangat`: prosedur karantina suhu bahan.
- `omzet April 2026`: informasi belum tersedia, AI harus menjelaskan kekurangan data.

Label dua tuning dan enam holdout dibuat dari isi corpus oleh pembuat proyek, bukan keluaran model yang dinilai. Sampel tetap kecil dan buatan, sehingga hasil bukan bukti generalisasi untuk enterprise nyata. Pencarian makna adalah reranking LLM dengan batas 100 kandidat, bukan index embedding besar. Kata/frasa highlight dari Gemini harus ditemukan sebagai substring asli, tidak boleh dikarang.
