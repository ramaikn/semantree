# Berkontribusi ke Semantree

## Memulai

1. Fork repositori, clone fork Anda, lalu ikuti setup di [README](README.md).
2. Buat branch perubahan dengan tujuan yang jelas.
3. Jangan commit `.env`, file upload, database, `.runtime`, screenshot yang mengandung informasi privat, atau token API.
4. Tambahkan test cepat pada alur kritis yang berubah; gunakan Bun dan uv, bukan npm atau interpreter Python langsung.
5. Jalankan `scripts/test.ps1` untuk perubahan lintas backend/frontend. Perubahan UI saja cukup build frontend dan pemeriksaan browser, kecuali mengubah kontrak API.
6. Buka pull request dengan ringkasan, alasan perubahan, hasil pengujian, serta batas yang belum diuji.

## Prinsip

- Pertahankan pemeriksaan akses sebelum dokumen dikirim ke AI serta pemeriksaan ulang versi/akses sesudah respons.
- Jangan mengarang fallback jawaban ketika model gagal atau evidence tidak cukup.
- Teks antarmuka Bahasa Indonesia, singkat dan relevan bagi pengguna. Catatan implementasi ada di dokumentasi, bukan layar produk.
- Hindari dependensi baru bila pustaka yang tersedia sudah memadai.
- Bedakan pencarian full-text, reranking LLM, dan embedding. Jangan membuat klaim kualitas tanpa bukti pengukuran.
- Gunakan Conventional Commits, misalnya `fix(search): ignore stale answer responses`.

## Melaporkan masalah

Gunakan GitHub Issues untuk bug non-sensitif. Sertakan langkah reproduksi, sistem operasi, versi runtime, hasil yang diharapkan/aktual, dan log yang sudah dibersihkan. Jangan memuat isi dokumen privat, password, atau API key.

Untuk kelemahan keamanan, baca [SECURITY.md](SECURITY.md) dan jangan mempublikasikan exploit atau data rahasia di issue terbuka.
