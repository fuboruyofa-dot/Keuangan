# 💰 DompetKu — Personal Finance App

Aplikasi pencatat keuangan pribadi berbasis web. Semua data tersimpan di **localStorage** browser — tidak perlu backend atau database.

## ✨ Fitur
- Dashboard ringkasan keuangan (harian / mingguan / bulanan)
- Catat pemasukan & pengeluaran
- Manajemen akun & dompet (Cash, BCA, DANA, dll.)
- Budget per kategori dengan notifikasi
- Riwayat transaksi dengan filter & pencarian
- Halaman Tabungan

---

## 🚀 Deploy ke Vercel via GitHub

### 1. Upload ke GitHub
1. Buat repository baru di [github.com](https://github.com/new)
2. Upload semua file dalam folder ini:
   - `index.html`
   - `app.js`
   - `vercel.json`
   - `README.md`

   Cara cepat via GitHub web:
   - Klik **"uploading an existing file"**
   - Drag & drop semua file
   - Klik **"Commit changes"**

### 2. Deploy ke Vercel
1. Buka [vercel.com](https://vercel.com) → Login dengan GitHub
2. Klik **"Add New Project"**
3. Pilih repository yang baru dibuat
4. Klik **"Deploy"** — tidak perlu konfigurasi apapun!
5. Tunggu ~30 detik, website sudah live! 🎉

### 3. Custom Domain (opsional)
Di dashboard Vercel → Settings → Domains → tambahkan domain kamu.

---

## 💡 Catatan
- Data tersimpan di localStorage browser, artinya data berbeda tiap browser/device
- Untuk reset data: buka DevTools → Application → Local Storage → Clear
- Tidak perlu koneksi internet setelah halaman dimuat (kecuali Google Fonts)

## 📁 Struktur File
```
dompetku/
├── index.html    # Struktur & styling
├── app.js        # Logic aplikasi
├── vercel.json   # Konfigurasi Vercel
└── README.md     # Panduan ini
```
