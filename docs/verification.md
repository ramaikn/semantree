# Bukti pemeriksaan

Pemeriksaan selesai **9 Oktober 2026** di Windows, Bun 1.4.2, uv 0.12.19, Java 21.0.12.1, PostgreSQL 17.9. Angka berikut berasal dari eksekusi, bukan target.

## Hasil aktual

### Branding Semantree dan persiapan open source

9 Oktober 2026: build React/TypeScript berhasil setelah rebranding (JavaScript 263,07 kB, gzip 81,21 kB), lima test corpus/highlight lulus. Semua script PowerShell lolos parser dan setup-tools mandiri mengenali JDK 21/PostgreSQL 17.9 pada cache workspace yang sudah ada. Unduhan cold-start baru tidak diulang; pengujian ini tidak mengklaim verifikasi download di komputer bersih.

Browser menampilkan judul Semantree, logo daun transparan, sidebar tanpa catatan developer, serta pencarian tanpa sublabel berulang. Cari/Enter masih menghasilkan jawaban nyata Rp97.500.000 dan CV Laut Biru Pangan; klik kartu S1 membuka potongan ekstraksi yang sesuai. Logo/sidebar juga diperiksa pada mobile 390 × 844. Perubahan ini tidak mengubah kontrak API, ACL, atau isi corpus. File publik diperiksa tanpa `.env`, `.runtime`, dependency/tools lokal, atau histori repositori lamaran.

### Review corpus perusahaan dan pencarian makna

Pemeriksaan lanjutan **9 Oktober 2026** setelah penggantian corpus:

| Pemeriksaan | Hasil |
|---|---|
| Bun test corpus dan highlight | 5 lulus, 57 assertions |
| Python extractor | 3 lulus |
| Java JUnit | 6 lulus, termasuk ID kandidat palsu dan highlight yang tidak ada di sumber |
| TypeScript + Vite | build berhasil, JavaScript terakhir 264,78 kB, gzip 81,58 kB |
| HTTP regression | 12 kelompok lulus di database terpisah, termasuk jawaban Gemini nyata |
| Corpus aktif | 15 dokumen makanan perusahaan fiktif, 40 potongan; empat dokumen FastAPI lama dihapus |
| Gemini search | empat query literal/parafrasa lulus, seluruh 40 kandidat berizin dinilai |
| Gemini assistant | laba Maret + supplier, pencarian SOP suhu ikan, serta abstention omzet April lulus |
| Browser | dropdown desktop/mobile menempel 6 px di bawah tombol; highlight hasil dan sumber kuning `rgb(255,235,158)`; jawaban lintas dokumen dan daftar sumber diperiksa pada aplikasi berjalan |

Laba bersih Maret dijawab **Rp97.500.000**, supplier **CV Laut Biru Pangan**, dengan kutipan dari dua dokumen berbeda. Query parafrasa `untung bersih bulan ketiga` menemukan laporan Maret; `tanggal habis pakainya paling dekat dikirim dulu` menemukan FEFO. Hasil detail tersimpan di `.runtime/company-review.json`, manifest/checksum di `.runtime/company-manifest.json`. Waktu empat query search pada pemeriksaan tersebut 3,37–7,30 detik; tiga pertanyaan AI 6,82–7,92 detik. Waktu browser dapat berbeda; ini bukan benchmark load atau jaminan SLA.

Pengujian integrasi sempat menemukan health HTTP 200 sebelum bootstrap akun selesai. Akar masalah adalah urutan startup Spring Boot: server menerima HTTP sebelum `ApplicationRunner` selesai. Health sekarang mengembalikan 503/`starting` sampai bootstrap dan pemulihan indeks selesai, kemudian 200/`ok`. Pengujian ulang 12 kelompok API lulus, tanpa menambahkan retry login untuk menyembunyikan masalah.

Screenshot review baru ada di `.openchamber/screenshots/` pada root repo: `enterprise-dropdown-fixed-2026-10-08T16-57-06-834.jpg`, `enterprise-company-search-highlight-2026-10-08T17-07-10-040.jpg`, dan `enterprise-company-ai-answer-2026-10-08T17-08-22-748.jpg`. Timestamp nama screenshot memakai UTC; pemeriksaan lokal berlangsung 9 Oktober. Ini bukan audit aksesibilitas penuh. Tidak ada klaim MRR/Recall/nDCG baru sebelum perbandingan corpus perusahaan dijalankan.

### Jawaban AI otomatis pada pencarian

Review UI lanjutan: Cari/Enter menghasilkan pencarian serta jawaban AI tanpa tombol terpisah. Jawaban muncul sebelum hasil search, dengan kartu kutipan dan daftar dokumen relevan tetap dapat membuka teks ekstraksi. Klik kartu S1 berhasil memfokuskan potongan laba rugi Maret. Mematikan sakelar menghapus jawaban; pencarian berikutnya tetap menampilkan hasil dokumen tanpa jawaban. Sakelar juga dapat dimatikan saat respons sedang diproses; respons lama diabaikan oleh generasi jawaban.

Build TypeScript/Vite setelah perubahan berhasil (JavaScript 264,93 kB, gzip 81,65 kB), dua test highlight lulus. Tampilan mobile 390 × 844 diperiksa: kotak pencarian lebih lebar tanpa tombol Tanya AI, sakelar berada dalam batas layar. Backend tidak berubah pada perubahan UI ini. Ini tidak menambah klaim hasil pengujian backend baru.

Saat satu percobaan mobile, reranking makna tidak tersedia dan hasil menampilkan notice fallback keyword dengan benar; percobaan desktop sebelumnya menghasilkan search makna serta jawaban nyata. Mematikan jawaban yang sedang diproses tidak menghapus hasil search dan respons AI lama tidak muncul kembali. Ketersediaan penyedia AI tetap tidak dijamin.

### Riwayat pemeriksaan corpus FastAPI (hasil awal)

Tabel dan metrik berikut berasal dari corpus lama sebelum diganti, bukan kualitas corpus perusahaan aktif.

| Pemeriksaan | Hasil |
|---|---|
| Python unittest | 3 test lulus |
| Java JUnit | 4 test lulus, 0 gagal/error/skip |
| TypeScript + Vite production build | berhasil; JavaScript 258,68 kB, gzip 79,44 kB |
| HTTP integration | 12 kelompok pemeriksaan lulus |
| AI nyata | 9router `ag/gemini-3.8-flash-low`, jawaban menyebut backup siang dari fixture versi 2 dan kutipan valid |
| Data aplikasi | 4 dokumen FastAPI asli, 28 chunk aktif; fixture tetap hanya di database test |
| Browser | login, search, buka bukti, perpustakaan, evaluasi, jawaban AI dan klik kutipan; desktop 1440×900 dan mobile 390×844 |
| Konfigurasi | `.env` terabaikan Git; pemeriksaan 57 berkas sumber tidak menemukan kunci lokal/password bootstrap; ketiga port hanya mendengar di 127.0.0.1 |

### Metrik corpus publik

Pengukuran `bun run scripts/measure-public.ts` pada tiga query holdout:

| Metode | MRR | Recall@5 | nDCG@5 | Rata-rata waktu query |
|---|---|---|---|---|
| boolean | 1,000 | 1,000 | 1,000 | 9,67 ms |
| ranked | 1,000 | 1,000 | 1,000 | 14,67 ms |

Hasil sama pada sampel mudah ini tidak membuktikan ranked lebih baik. Query dekat dengan judul, hanya empat dokumen, satu label relevan per query. Jangan mengklaim 100% akurasi umum. Hasil JSON lengkap tersimpan di `.runtime/public-evaluation.json`.

### Temuan dan perbaikan nyata

- Eksekusi awal melewati batas shell 120 detik. Batas proses diperpanjang, bukan menghapus test AI.
- 9router dapat memberi SSE jika stream tidak eksplisit; decoder mendukung JSON dan SSE, serta menolak finish_reason terpotong.
- Respons juga dapat terkompresi gzip. Java HttpClient tidak otomatis menguraikannya. Decoder membaca gzip secara terbatas dan request meminta identity encoding. Test mencakup JSON, SSE, gzip, dan respons terpotong.
- Java di Windows mengunci JAR yang sedang dipakai. Script backend kini menjalankan salinan `.runtime/application.jar`, bukan target hasil build.

## Prosedur

`scripts/test.ps1`: Python unittest, TypeScript/React build, Maven verify, lalu HTTP terhadap backend Java/PostgreSQL nyata dengan database `enterprise_search_test`. Test AI dijalankan jika kunci lokal tersedia. JSON hasil HTTP ditulis ke `.runtime/test-api-results.json`, tidak berisi kunci atau password.

Alur kritis: login/Origin, ACL privat dan lintas ruang, upload/unduh, update identik, arsip dan versi aktif, ekstraksi gagal, pencabutan akses, label dan metrik, abstention tanpa evidence, jawaban nyata 9router, penghapusan, serta pencabutan sesi.

## Interpretasi

Fixture hanya dipakai database test. Dokumen publik di aplikasi diimpor dari FastAPI, sumber revisi dan lisensi ada di manifest lokal. Label awal merupakan review topik oleh pembuat proyek, bukan pengujian independen oleh HRD. Metrik awal pada corpus empat dokumen tidak boleh dipakai sebagai klaim kualitas enterprise.

Pemeriksaan UI menggunakan aplikasi yang berjalan, bukan hanya membaca kode. Jika browser panel tidak dapat dikendalikan, keterbatasan itu dicatat dan tidak disebut sebagai pemeriksaan interaksi selesai.

Browser panel dapat dikendalikan pada sesi ini. Tangkapan layar lokal berada di `.openchamber/screenshots/` pada root repo: login desktop, perpustakaan mobile, dan evaluasi. Pemeriksaan visual bukan audit aksesibilitas penuh atau uji load.

Pertanyaan browser `What are background tasks used for?` menghasilkan tiga fakta Bahasa Indonesia tentang operasi sesudah respons, notifikasi email, dan pemrosesan data. Ketiganya mengutip S1, dokumen Background Tasks v1 lokasi karakter 1–1397; isi asli mendukung penjelasan itu. Kutipan dapat diklik menuju panel sumber. Screenshot `enterprise-search-ai-evidence-2026-10-08T16-13-05-313.jpg` tersimpan pada folder tangkapan layar yang sama.
