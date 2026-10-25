# Lab Virtual Kekekalan Daya Rangkaian AC
Struktur: `index.html`, `style.css`, `script.js`, `README.md` (satu folder, tanpa backend).

## Jalankan lokal
Buka `index.html` dengan klik dua kali di browser, atau jalankan `python -m http.server 8000` lalu buka http://localhost:8000.

## GitHub Pages
1. Buat repositori publik di github.com (mis. `lab-daya-ac`), lalu Add file, Upload files, unggah keempat file, Commit.
2. Settings, Pages, Source: Deploy from a branch, Branch: `main`, folder `/ (root)`, Save.
3. Tunggu 1 sampai 2 menit. Tautan: `https://USERNAME.github.io/lab-daya-ac/`.

## Kasus uji manual (V = 220 V, f = 50 Hz)
- R = 50 Ω saja: I = 4,4 A, P = 968 W, Q = 0, pf = 1.
- RLC seri R=30, L=100 mH, C=47 µF: X_L=31,42; X_C=67,73; |Z|=47,10 Ω; I=4,671 A; P≈654,6 W; Q≈−792,3 var; pf≈0,637 mendahului.
- RLC paralel R=50, L=100 mH, C=47 µF: I_R=4,4 A; I_L=7,003 A; I_C=3,248 A; P=968 W; Q_L=+1540,6; Q_C=−714,7; Q≈825,9 var.
Tombol "Jalankan uji otomatis rumus" di tab Eksperimen memeriksa ketiganya.
