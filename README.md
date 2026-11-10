# GO Manager

GO Manager adalah aplikasi web untuk membantu seller mengelola Group Order
(GO), pendaftaran customer, dan rekap status order. Proyek ini sedang dibangun
bertahap; dokumentasi ini membedakan fitur yang sudah ada di kode saat ini dari
fitur MVP yang masih perlu dikerjakan.

## Status proyek saat ini

### Sudah dikerjakan

- **Login dan area internal** menggunakan Supabase Auth. Halaman internal
  memerlukan sesi login dan profil aktif.
- **Dasar role Owner dan Admin.** Menu Owner disembunyikan dari Admin, pembuatan
  GO dan perubahan status GO dibatasi untuk Owner, dan informasi modal/profit
  hanya ditampilkan untuk Owner.
- **Daftar dan detail GO**, termasuk status, harga, kuota, tanggal tutup,
  progress slot, waiting list, daftar peserta, dan tautan form publik.
- **Pembuatan GO oleh Owner** dengan judul, deskripsi, harga jual, modal,
  kuota, tanggal tutup, dan foto produk. Foto diunggah ke Supabase Storage.
- **Alur status GO:** Draft → Open → Closed → Selesai. GO yang sudah Closed
  dapat dibuka kembali.
- **Form publik tanpa login** di `/go/[slug]`. Customer dapat mendaftar dengan
  nama, nomor HP, jumlah, metode pembayaran, dan catatan. Form menampilkan
  kuota, progress, dan waiting list, serta memperbarui informasi kuota berkala.
- **Pendaftaran melalui fungsi Supabase**, termasuk penentuan pendaftaran
  confirmed atau waiting list. Halaman publik juga menampilkan informasi toko
  dan tautan WhatsApp bila tersedia.
- **Rekap order** dengan filter GO, status pembayaran, dan status pengerjaan,
  serta pencarian nama atau nomor HP. Saat ini daftar dibatasi sampai 200 order
  terbaru.
- **Ubah status secara massal** untuk pembayaran dan pengerjaan (maksimal 200
  order sekali proses).
- **Pencatatan aktivitas dasar** saat GO dibuat, status GO diubah, atau status
  order diperbarui secara massal.
- **Navigasi responsif** untuk tampilan desktop dan mobile.

### Belum selesai / belum tersedia

- Dashboard saat ini masih berupa placeholder; angka ringkasan dan grafik
  belum ditampilkan.
- Input order manual dari DM Twitter atau WhatsApp belum tersedia.
- Halaman manajemen Admin dan pengaturan toko belum tersedia, walaupun
  tautannya sudah direncanakan di navigasi Owner.
- Undangan Admin melalui email atau link belum tersedia.
- Export peserta GO dan export rekap ke CSV/Excel belum tersedia.
- Riwayat aktivitas belum memiliki halaman untuk dilihat.
- Fitur belum mencakup notifikasi WhatsApp otomatis, payment gateway, portal
  customer, multi-toko, inventori kompleks, atau aplikasi mobile native.

## Teknologi

- Next.js App Router dan React
- Supabase Auth, Database, Storage, dan fungsi RPC
- Tailwind CSS

## Halaman yang tersedia

| Halaman | Kegunaan | Status |
| --- | --- | --- |
| `/login` | Login Owner/Admin | Tersedia |
| `/dashboard` | Ringkasan aktivitas | Placeholder |
| `/group-orders` | Daftar GO dan progress kuota | Tersedia |
| `/group-orders/new` | Membuat GO | Tersedia untuk Owner |
| `/group-orders/[id]` | Detail GO dan daftar peserta | Tersedia |
| `/go/[slug]` | Form pendaftaran publik | Tersedia |
| `/orders` | Rekap, filter, pencarian, dan ubah status massal | Tersedia |
| `/admins` | Manajemen Admin | Belum dibuat |
| `/settings` | Pengaturan toko | Belum dibuat |

## Menjalankan proyek

### 1. Siapkan kebutuhan

- Node.js dan npm
- Proyek Supabase yang sudah dikonfigurasi untuk aplikasi ini
- Tabel, kebijakan akses, Storage bucket, dan fungsi RPC yang digunakan aplikasi

### 2. Konfigurasi environment

Buat file `.env.local` di root proyek dan isi nilai dari proyek Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Jangan masukkan kredensial rahasia ke repositori. Struktur database dan SQL
untuk fungsi Supabase belum didokumentasikan/dikelola di repositori ini, jadi
pastikan dependensi Supabase yang dibutuhkan sudah disiapkan sebelum mencoba
alur aplikasi.

### 3. Instal dependensi dan jalankan

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Untuk memeriksa kualitas
kode dan membuat build lokal:

```bash
npm run lint
npm run build
```

## Dependensi data Supabase yang digunakan

Implementasi saat ini membaca atau menulis objek Supabase berikut:

- Tabel: `profiles`, `group_orders`, `orders`, `go_costs`,
  `activity_logs`, dan `store_settings`
- Storage bucket: `go-images`
- Fungsi RPC: `get_public_go` dan `register_for_go`

Nama-nama di atas adalah dependensi yang dipanggil oleh aplikasi, bukan bukti
bahwa skema database, kebijakan Row Level Security (RLS), atau fungsi RPC sudah
disertakan dalam repositori. Pastikan akses Owner/Admin dan akses publik dibatasi
dengan benar di sisi Supabase.

## Urutan pengembangan berikutnya

Kerjakan satu tahap dan validasi hasilnya sebelum pindah ke tahap berikutnya.

1. **Rapikan fondasi Supabase** — dokumentasikan skema tabel, fungsi RPC,
   Storage, dan kebijakan RLS yang sesuai dengan akses Owner, Admin, dan publik.
2. **Lengkapi rekap order** — tambahkan input order manual, detail data yang
   dibutuhkan, dan penanganan data yang jumlahnya lebih dari 200 order.
3. **Bangun Dashboard** — tampilkan ringkasan order, GO aktif, pembayaran, dan
   pengerjaan; tambahkan grafik omzet khusus Owner.
4. **Buat Pengaturan Toko** — kelola nama toko, logo, dan kontak WhatsApp yang
   dipakai pada form publik.
5. **Buat Manajemen Admin** — undang, ubah, nonaktifkan, atau hapus Admin
   dengan aturan akses yang jelas.
6. **Tambahkan export** — mulai dari CSV untuk peserta GO dan rekap order;
   verifikasi data dan status yang diekspor.
7. **Lengkapi audit dan validasi** — sediakan tampilan log aktivitas dan uji
   alur Owner, Admin, pendaftaran publik, waiting list, dan pembatasan akses.

## Alur yang sudah dapat dicoba

1. Owner login.
2. Owner membuat GO dan mengatur informasi dasar, kuota, harga, modal, serta
   foto opsional.
3. Owner membuka GO dan membagikan tautan `/go/[slug]`.
4. Customer mengisi form publik; pendaftaran masuk sebagai peserta atau
   waiting list sesuai ketersediaan kuota.
5. Owner/Admin melihat peserta dan rekap order, lalu memperbarui status
   pembayaran atau pengerjaan.
6. Owner dapat melihat omzet dan estimasi profit di detail GO.
