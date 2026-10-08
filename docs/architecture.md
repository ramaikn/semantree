# Peta sistem dan konteks sesi berikutnya

## Identitas dan publikasi

Produk bernama **Semantree**, repositori publik mandiri `ramaikn/semantree`, lisensi MIT. Folder `project/enterprise-search` di checkout asal tetap dipertahankan agar database dan proses berjalan tidak dipindahkan. Isi folder diterbitkan sebagai root repo publik melalui export file terlacak, tanpa histori lamaran, `.env`, `.runtime`, atau tools/dependency lokal.

Logo transparan ada di `frontend/public/semantree-mark.svg` (ikon daun) dan `semantree.svg` (logo lengkap). `Brand.tsx` dipakai sidebar/login; favicon menggunakan ikon. Catatan portofolio/developer, model ID, UUID audit, dan checksum tidak tampil pada UI utama. Informasi akses/versi, lisensi corpus simulasi, kegagalan, dan notice cakupan tetap tersedia. Setup tools kini milik proyek sendiri; clone mandiri tidak bergantung pada Media Intelligence.

## Jalur data

React/Bun → HTTP Spring Boot → cek sesi dan workspace → PostgreSQL.

Upload → catat run → Python extractor melalui uv → validasi potongan → transaksi file/versi/chunk → ganti versi aktif → selesai. Teks diekstrak sebelum transaksi agar database tidak dikunci selama parsing. Run gagal tercatat di luar transaksi; data index baru rollback.

Search → tokenisasi aman → `to_tsquery('simple')` → ACL workspace/pemilik di SQL → hanya current_version → ranking → halaman hasil.

Mode `hybrid` → ambil maksimal 100 kandidat ACL-filtered, termasuk teks tanpa match literal pada corpus kecil → `SemanticRanker` menilai makna melalui `AiClient`/Gemini → validasi ID/score dan highlight substring → cek ulang akses/versi → pagination. Ini LLM reranking, bukan vector/embedding search. Jika gagal, respons berisi notice fallback keyword. Total hybrid adalah jumlah matches dalam kandidat terbatas, bukan seluruh corpus besar.

Assistant → search hybrid dengan kategori/visibility yang sama → maksimal 16 bukti/24.000 karakter, empat per dokumen → request jawaban 9router → JSON claims answered/partial/insufficient → validasi kutipan → cek ulang versi/akses → jawaban dan daftar dokumen relevan. Browser tidak menerima secret. Tidak ada agent tool atau tindakan dari model. `AiClient` memusatkan batas dua permintaan AI, JSON/SSE/gzip decoder, serta penanganan error.

9router dapat mengembalikan SSE bila stream tidak eksplisit dan gzip yang tidak otomatis diuraikan Java HttpClient. Request memakai `stream=false` dan identity encoding; `CompletionDecoder` tetap menerima JSON/SSE/gzip dan berhenti pada finish_reason stop. Respons terpotong ditolak. Backend dijalankan dari salinan `.runtime/application.jar` agar target build tidak terkunci di Windows.

## Penanggung jawab modul

- `backend/.../auth`: akun bootstrap, sesi hashed, BCrypt, Origin guard, pengguna, audit.
- `backend/.../documents`: izin baca/pemilik, validasi upload, proses ekstraksi, transaksi versi, unduhan, run.
- `backend/.../retrieval`: tokenisasi, full-text, filter, ACL, evidence dan pemeriksaan ulang akses.
- `backend/.../assistant`: komunikasi AI, batas evidence/konkurensi, validasi kutipan, abstention.
- `backend/.../evaluation`: label manual, pengukuran dua metode, MRR/Recall/nDCG.
- `database/V1__knowledge.sql`: tabel dan index. File asli bytea untuk menghindari filesystem/database tidak konsisten saat rollback.
- `pipeline/extract.py`: parser teks, halaman PDF, paragraf/tabel DOCX; output JSON ke backend.
- `frontend/src/components`: search, detail, upload, aktivitas, akun, evaluasi. `App.tsx` mengatur shell/login.
- `scripts`: environment Windows, setup, start/stop, impor publik berlisensi, pengujian database terpisah.
- `demo/company.ts`: satu ledger dan 15 dokumen perusahaan fiktif Bahasa Indonesia; `scripts/import-company.ts` upload corpus dan menghapus hanya corpus FastAPI lama setelah upload sukses.
- `frontend/.../Select.tsx`: combobox aplikasi berwarna hijau, menu portal fixed mengikuti batas tombol; keyboard, Escape, click luar, resize/scroll.
- `frontend/.../Highlight.tsx`: range literal/semantik tervalidasi, penggabungan overlap dan snippet di sekitar temuan; tidak merender HTML dari sumber.
- `frontend/.../SearchWorkspace.tsx`: Cari/Enter menjalankan search dan jawaban paralel; sakelar jawaban aktif default selama komponen terbuka. Generasi respons search/jawaban terpisah mencegah respons lama muncul setelah query/filter berubah atau AI dimatikan. Pagination hanya meminta halaman search, tanpa menghapus atau menghasilkan ulang jawaban. Mematikan sakelar jawaban tidak mematikan reranking makna pada metode hybrid.

## HTTP

Semua `/api` menggunakan cookie kecuali GET `/health` dan POST `/auth/login`. Perubahan wajib Origin APP_ORIGIN.

| Kelompok | Endpoint utama | Akses |
|---|---|---|
| Sesi | POST auth/login, GET auth/me, POST auth/logout | akun aktif |
| Pengguna | GET/POST users, DELETE users/{id} | administrator ruang |
| Dokumen | GET/POST documents, GET/PATCH/DELETE documents/{id} | baca ACL, perubahan pemilik |
| File | GET documents/{id}/download?version=N | ACL pada setiap unduhan |
| Search | GET search?q=&method=hybrid/ranked/boolean&category=&visibility=&page=&size= | ACL sebelum lexical/AI |
| Asisten | GET assistant/status, POST assistant {question,category,visibility} | ACL sebelum AI, filter konsisten |
| Operasi | GET stats, runs, audit | stats ACL, run sendiri, audit admin |
| Evaluasi | GET/POST evaluation/labels, DELETE evaluation/labels/{id}, POST evaluation/run?split=holdout&hybrid=true | admin dan label dokumen yang boleh dibaca; hybrid opsional |

## Invariant penting

1. Administrator tidak memiliki bypass dokumen privat milik pengguna lain.
2. Query lintas workspace tidak menghasilkan dokumen, termasuk detail/unduhan.
3. Versi arsip dapat dibaca secara eksplisit tetapi tidak masuk pencarian/asisten.
4. Duplikasi isi dicegah pada update dokumen yang sama, bukan deduplikasi global antar-owner.
5. Gagal index tidak mengganti versi aktif. Startup menandai processing yang terputus menjadi failed.
6. Penghapusan berantai menghapus file/index/label; audit dan run tetap menjadi metadata riwayat.
7. Search dan AI tidak diisi seed otomatis. Impor publik merupakan tindakan eksplisit.

## Operasi dan perubahan berikutnya

Port UI 5174, API 8081, PostgreSQL 55433, test API 8082. `.env`, `.runtime`, target, dist, node_modules, .venv diabaikan Git. Jangan menyentuh staged changes Media Intelligence saat commit proyek ini. Root repository berisi dokumen lamaran privat, tidak boleh dipublikasikan sebagai aplikasi.

Untuk deployment internet diperlukan rancangan terpisah: HTTPS/cookie Secure, isolasi parser, pembatasan kuota/rate limit menyeluruh, model keanggotaan/admin lintas ruang yang formal, manajemen secret/password, dan backup. Jangan membuka bind publik hanya untuk membuat demo online.
