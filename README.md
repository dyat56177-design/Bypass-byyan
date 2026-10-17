# Link Inspector Pro

Website statis untuk Vercel. Pemeriksaan dilakukan di browser, tanpa endpoint yang mengambil URL dari pengguna.

## Deploy
1. Ekstrak ZIP.
2. Unggah isi folder ke repository GitHub, pertahankan folder `public`.
3. Impor repository di Vercel.
4. Pilih Framework Preset `Other`. Untuk situs statis ini, output directory dapat menggunakan `public`.
5. Deploy.

## Fitur
- Validasi dasar URL HTTP(S)
- Baca kemungkinan tujuan yang terlihat di parameter URL
- Sinyal risiko sederhana seperti HTTP, punycode, IP langsung, dan URL panjang
- Salin atau buka tujuan yang ditemukan

## Batasan
Tidak melewati timer, CAPTCHA, token, login, anti-bot, atau proteksi situs. Tidak mengeksekusi JavaScript dari URL yang diperiksa. Tidak menjamin bahwa tautan aman atau menemukan tujuan akhir yang tersembunyi.
