# Keamanan dan batas akses

## Yang sudah diterapkan

- Seluruh layanan aplikasi dan database bind ke loopback. Tidak membuka layanan ke jaringan atau internet.
- Password BCrypt cost 12. Token sesi acak 256-bit, database hanya menyimpan SHA-256 token, masa berlaku 8 jam. Password bootstrap acak dan tidak dicetak ke log.
- Cookie HttpOnly, SameSite Strict, scope `/api`. Origin wajib cocok untuk POST/PATCH/DELETE, termasuk login. Tidak ada CORS wildcard atau secret di frontend.
- SQL menggunakan parameter. Token query dibatasi menjadi huruf/angka, maksimal 24 kata. URL sumber hanya HTTP/HTTPS tanpa credentials, tidak di-fetch oleh backend.
- Setiap baca dokumen memeriksa workspace dan visibility/owner. Mutasi hanya pemilik. File asli diunduh sebagai attachment/octet-stream dengan nosniff, tidak dijalankan sebagai HTML.
- Upload maksimal 12 MB, PDF maksimal 300 halaman, teks maksimal 1,5 juta karakter, 3.000 potongan. DOCX memiliki batas ukuran ZIP terurai 48 MB/3.000 entries. Parser berjalan proses terpisah, maksimal dua proses dan 60 detik.
- Penggantian versi, index, dan metadata dalam transaksi. Perubahan akses/versi dicek ulang sebelum jawaban AI dikembalikan.
- Delapan percobaan gagal login per alamat selama 15 menit, sesi dicabut saat akun dinonaktifkan. UI menggunakan text rendering React, tidak menggunakan dangerouslySetInnerHTML/Markdown HTML.

## AI dan privasi

Potongan dokumen yang lolos izin **dikirim ke 9router**, lalu dapat diteruskan ke penyedia model di luar komputer. 9router lokal tidak berarti model bekerja offline. Kebijakan retention penyedia belum diaudit. Gunakan data publik atau berizin untuk demo. Dokumen privat tidak otomatis berarti pemilik menyetujui pengiriman ke layanan eksternal; keputusan upload/penggunaan AI berada pada pengguna.

Mode pencarian cerdas juga mengirim maksimal 100 kandidat yang sudah lolos izin ke penyedia untuk penilaian makna. Mode keyword tidak. Setiap ID kandidat dan frasa highlight divalidasi terhadap teks asli; model tidak dapat menunjuk dokumen di luar daftar yang diberikan. Akses dan versi diperiksa ulang setelah reranking serta sebelum jawaban dikembalikan. Corpus makanan aktif seluruhnya data simulasi tanpa identitas/rekening/sertifikasi nyata.

Kunci hanya dalam `.env` lokal, tidak di Git. Secret yang pernah ditulis di percakapan sebaiknya diganti sebelum deployment atau perubahan cakupan jaringan. Jangan mencetak `.env` pada laporan, tangkapan layar, atau terminal publik.

Prompt memisahkan evidence dari instruksi sistem dan meminta abstention. Semua klaim harus memiliki kutipan valid. Model tidak dapat melakukan tool call. Namun semantik kutipan belum diverifikasi otomatis dan prompt injection belum terbukti kebal. Pengguna wajib membaca bukti asli.

## Belum memenuhi deployment produksi

Tidak ada HTTPS/Secure cookie lokal, password reset, MFA, SSO, antivirus, sandbox OS parser, kuota per pengguna, penjadwalan cleanup, backup teruji, atau PostgreSQL row-level security. Akun database aplikasi juga memiliki hak migrasi skema untuk kemudahan demo, bukan pemisahan privilege produksi.

Parser PDF/DOCX pihak ketiga bisa mempunyai kerentanan. Batas waktu/ukuran membantu tetapi tidak menjamin batas memori OS. Jangan menerima upload dari publik tanpa sandbox dan pemeriksaan keamanan tambahan.

Pengecekan ulang akses setelah AI mengurangi kebocoran saat perubahan akses, tetapi tidak menarik kembali data yang sudah dikirim ke penyedia selama akses masih valid. Tidak ada jaminan linearizable untuk pencabutan akses pada saat jaringan mengirim respons.
