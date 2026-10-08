# Keamanan Semantree

Semantree saat ini ditujukan untuk penggunaan lokal dan pengembangan, bukan layanan internet yang sudah diaudit. Semua port bawaan terikat ke loopback. Belum ada komitmen SLA atau dukungan keamanan versi jangka panjang.

## Melaporkan kerentanan

Gunakan menu **Security → Report a vulnerability** pada GitHub jika private reporting tersedia. Jika tidak tersedia, hubungi maintainer lewat informasi kontak profil GitHub untuk meminta jalur privat sebelum mengirim detail. Jangan mengirim secret, dokumen privat, atau exploit lengkap ke issue publik.

## Sebelum menggunakan

- Jangan publikasikan `.env` atau `.runtime`, termasuk database, upload, dan manifest lokal.
- Potongan dokumen pada pencarian makna dan jawaban AI dikirim ke penyedia yang Anda konfigurasi. Gateway lokal tidak berarti model offline.
- Pilih metode kata kunci dan matikan Jawaban AI jika tidak mengizinkan pengiriman ke penyedia.
- Kutipan valid tidak menjamin semua pernyataan model benar. Periksa teks sumber.
- Deployment jaringan membutuhkan HTTPS, manajemen secret, kontrol unggah, backup, pemantauan, dan audit tambahan.

Detail model ancaman dan pembatasan ada pada [docs/security.md](docs/security.md).
