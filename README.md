# Sistem Kerja Aplikasi Absensi Magang

Dokumentasi lengkap alur kerja, arsitektur, dan API sistem presensi digital berbasis QR Code + GPS.

---

## Daftar Isi

1. [Gambaran Umum](#gambaran-umum)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Struktur Folder](#struktur-folder)
4. [Database dan Tabel](#database-dan-tabel)
5. [Alur Kerja Utama](#alur-kerja-utama)
6. [Dokumentasi API Backend](#dokumentasi-api-backend)
7. [Sistem Keamanan JWT](#sistem-keamanan-jwt)
8. [Halaman Frontend](#halaman-frontend)
9. [Cara Menjalankan Aplikasi](#cara-menjalankan-aplikasi)
10. [Konfigurasi Environment](#konfigurasi-environment)

---

## Gambaran Umum

Aplikasi **Absensi Magang** adalah sistem presensi digital yang memungkinkan:

- **Peserta magang** melakukan check-in dan check-out menggunakan **QR Code** yang dipindai kamera, disertai **validasi GPS** untuk memastikan peserta berada di lokasi yang benar.
- **Admin** mengelola data peserta, memantau statistik kehadiran, mengatur sesi absensi harian, dan melihat riwayat presensi melalui panel admin yang terproteksi JWT.

### Teknologi yang Digunakan

| Bagian      | Teknologi                             |
|-------------|---------------------------------------|
| Frontend    | React 19 + Vite, React Router DOM v7  |
| Backend     | Node.js + Express.js                  |
| Database    | MySQL (via mysql2)                    |
| Auth        | JWT (JSON Web Token) + Bcrypt         |
| QR Scanner  | html5-qrcode                          |
| HTTP Client | Axios                                 |

---

## Arsitektur Sistem

```
FRONTEND (React) - localhost:5173
  Halaman Peserta (/scan, /)         Admin Panel (/dashboard, /participants, dll)
  - QR Scanner                       - Terproteksi JWT
  - GPS Detect                       - ProtectedRoute (cek localStorage)
  - [Footer: Login Admin]
           |
           | axios + Bearer Token
           v
BACKEND (Express.js) - localhost:5000
  Routes -> Middleware JWT -> Controller -> Model -> MySQL
  /api/auth          -> authController
  /api/attendance    -> attendanceController
  /api/participants  -> participantController  [JWT Required]
  /api/sessions      -> sessionController      [JWT Required]
  /api/dashboard     -> dashboardController    [JWT Required]
           |
           | mysql2
           v
MySQL Database (absensi_magang)
  - participants
  - attendances
  - attendance_sessions
  - admins
```

---

## Struktur Folder

```
absensi-magang/
|
+-- backend/
|   +-- src/
|   |   +-- config/
|   |   |   +-- database.js          # Koneksi MySQL (mysql2 pool)
|   |   +-- controllers/
|   |   |   +-- authController.js    # Login + getMe
|   |   |   +-- attendanceController.js  # Scan QR + list absensi
|   |   |   +-- participantController.js # CRUD Peserta
|   |   |   +-- sessionController.js     # CRUD Sesi Absensi
|   |   |   +-- dashboardController.js   # Statistik Dashboard
|   |   +-- middlewares/
|   |   |   +-- authMiddleware.js    # verifyToken (JWT Guard)
|   |   +-- models/
|   |   |   +-- adminModel.js        # Query tabel admins
|   |   |   +-- attendanceModel.js   # Query tabel attendances
|   |   |   +-- attendanceSessionModel.js
|   |   |   +-- participantModel.js  # Query tabel participants
|   |   +-- routes/
|   |   |   +-- authRoutes.js
|   |   |   +-- attendanceRoutes.js
|   |   |   +-- participantRoutes.js
|   |   |   +-- sessionRoutes.js
|   |   |   +-- dashboardRoutes.js
|   |   +-- utils/
|   |   |   +-- distance.js          # Hitung jarak GPS (Haversine)
|   |   |   +-- attendanceTime.js    # Validasi waktu absensi
|   |   +-- server.js                # Entry point Express
|   +-- createAdmin.js               # Script buat akun admin
|   +-- .env                         # Variabel environment
|   +-- package.json
|
+-- frontend/
    +-- src/
    |   +-- api/
    |   |   +-- axios.js             # Instance axios + interceptors
    |   +-- components/
    |   |   +-- AdminLayout.jsx      # Layout admin (Navbar + Outlet)
    |   |   +-- Navbar.jsx           # Navigasi panel admin
    |   |   +-- ProtectedRoute.jsx   # Guard route
    |   |   +-- ParticipantQRCode.jsx
    |   +-- pages/
    |   |   +-- AttendanceScan.jsx   # [PUBLIC] Scan QR + GPS -> absensi
    |   |   +-- Login.jsx            # [PUBLIC] Login admin
    |   |   +-- Dashboard.jsx        # [ADMIN] Statistik dashboard
    |   |   +-- Participants.jsx     # [ADMIN] CRUD peserta
    |   |   +-- Attendance.jsx       # [ADMIN] Riwayat absensi
    |   |   +-- Sessions.jsx         # [ADMIN] Kelola sesi absensi
    |   +-- App.jsx                  # Router utama
    |   +-- main.jsx                 # Entry point React
    |   +-- index.css                # Global styles
    +-- package.json
```

---

## Database dan Tabel

### Tabel `participants` - Data Peserta Magang

| Kolom              | Tipe             | Keterangan                      |
|--------------------|------------------|---------------------------------|
| id                 | INT (PK, AI)     | ID unik peserta                 |
| full_name          | VARCHAR          | Nama lengkap                    |
| identity_number    | VARCHAR (UNIQUE) | NIM / NISN                      |
| institution        | VARCHAR          | Nama universitas / sekolah      |
| participant_type   | ENUM             | mahasiswa / smk / sma           |
| phone              | VARCHAR          | Nomor HP                        |
| status             | ENUM             | active / inactive               |
| start_date         | DATE             | Tanggal mulai magang            |
| end_date           | DATE             | Tanggal selesai magang          |
| qr_token           | VARCHAR (UNIQUE) | Token unik untuk QR Code        |
| created_at         | DATETIME         | Waktu dibuat                    |
| updated_at         | DATETIME         | Waktu diperbarui                |

### Tabel `attendance_sessions` - Sesi Absensi Harian

| Kolom             | Tipe         | Keterangan                          |
|-------------------|--------------|-------------------------------------|
| id                | INT (PK, AI) | ID sesi                             |
| session_date      | DATE         | Tanggal sesi (1 sesi per hari)      |
| check_in_start    | TIME         | Jam buka check-in (07:00)           |
| check_in_end      | TIME         | Jam tutup check-in (09:30)          |
| check_out_start   | TIME         | Jam buka check-out (16:00)          |
| check_out_end     | TIME         | Jam tutup check-out (18:30)         |
| latitude          | DECIMAL      | Koordinat latitude lokasi kantor    |
| longitude         | DECIMAL      | Koordinat longitude lokasi kantor   |
| radius_meter      | INT          | Radius toleransi GPS (meter)        |
| status            | ENUM         | active / closed                     |

### Tabel `attendances` - Rekaman Presensi

| Kolom                 | Tipe         | Keterangan                         |
|-----------------------|--------------|------------------------------------|
| id                    | INT (PK, AI) | ID absensi                         |
| participant_id        | INT (FK)     | Relasi ke participants.id          |
| session_id            | INT (FK)     | Relasi ke attendance_sessions.id   |
| check_in_at           | DATETIME     | Waktu check-in                     |
| check_out_at          | DATETIME     | Waktu check-out (NULL jika belum)  |
| check_in_latitude     | DECIMAL      | GPS saat check-in                  |
| check_in_longitude    | DECIMAL      | GPS saat check-in                  |
| check_out_latitude    | DECIMAL      | GPS saat check-out                 |
| check_out_longitude   | DECIMAL      | GPS saat check-out                 |
| status                | ENUM         | incomplete / completed             |
| note                  | TEXT         | Catatan tambahan                   |

### Tabel `admins` - Akun Administrator

| Kolom           | Tipe         | Keterangan               |
|-----------------|--------------|--------------------------|
| id              | INT (PK, AI) | ID admin                 |
| username        | VARCHAR      | Username login           |
| password_hash   | VARCHAR      | Password di-hash bcrypt  |
| full_name       | VARCHAR      | Nama lengkap admin       |

---

## Alur Kerja Utama

### Alur Peserta - Scan QR Presensi

```
[1] Peserta buka aplikasi -> Halaman / atau /scan (PUBLIK, tanpa login)

[2] Kamera aktif via html5-qrcode
    Scanner menunggu QR Code peserta

[3] QR Code berhasil dibaca
    Nilai = qr_token unik milik peserta

[4] Browser meminta izin GPS
    navigator.geolocation.getCurrentPosition()
    -> Ambil: latitude, longitude, accuracy

[5] POST /api/attendance/scan
    Body: { qr_token, latitude, longitude }
    (Endpoint ini PUBLIK - tidak butuh JWT)

BACKEND - 12 Langkah Validasi:
  [1]  Cek field wajib: qr_token, latitude, longitude
  [2]  Cari peserta berdasarkan qr_token di DB
  [3]  Cek status peserta = "active"
  [4]  Cari sesi hari ini (session_date = CURDATE())
  [5]  Cek status sesi = "active"
  [6]  Ambil konfigurasi lokasi (lat, lng, radius) dari sesi
  [7]  Hitung jarak GPS (algoritma Haversine)
  [8]  Cek peserta dalam radius yang diizinkan
  [9]  Ambil waktu server saat ini
  [10] Cek jam masuk waktu check-in
  [11] Cek jam masuk waktu check-out
  [12] Jika di luar semua waktu -> tolak 403

Keputusan:
  - Belum ada rekaman hari ini?
      -> CHECK-IN: INSERT attendances, status = "incomplete"
      -> Response 201: "Check-in berhasil"

  - Sudah check-in, belum check-out?
      -> CHECK-OUT: UPDATE attendances, status = "completed"
      -> Response 200: "Check-out berhasil"

  - Sudah lengkap (check-in + check-out)?
      -> Tolak 409: "Absensi hari ini sudah lengkap"

[6] Frontend tampilkan hasil:
    Nama peserta, tipe presensi, pesan sukses/gagal
```

### Alur Admin - Login dan Panel

```
[1] Admin klik "Login Admin" di footer halaman scan
    -> Navigasi ke /login

[2] Input username + password
    POST /api/auth/login
    Body: { username, password }

[3] Backend proses:
    - Cari admin berdasarkan username di tabel admins
    - bcrypt.compare(password, password_hash)
    - Buat JWT Token (expire: 8 jam)
    - Response: { token, admin: { id, username, full_name } }

[4] Frontend simpan ke localStorage:
    - localStorage.setItem("token", token)
    - localStorage.setItem("admin", JSON.stringify(admin))

[5] Redirect ke /dashboard

[6] ProtectedRoute cek localStorage.getItem("token"):
    - Ada token -> render AdminLayout + halaman tujuan
    - Tidak ada -> redirect ke /login

[7] Setiap request ke API protected:
    axios interceptor otomatis tambahkan:
    Authorization: Bearer <token>

[8] authMiddleware.verifyToken di backend:
    - Cek header Authorization
    - jwt.verify(token, JWT_SECRET)
    - Jika valid -> req.admin = decoded -> next()
    - Jika expired -> 401 "Sesi kedaluwarsa"
    - Jika invalid -> 403 "Token tidak valid"

[9] Jika respons 401 dari API:
    - Hapus token dari localStorage
    - Auto-redirect ke /login
```

---

## Dokumentasi API Backend

Base URL: `http://localhost:5000/api`

### Auth (Publik)

| Method | Endpoint       | Body                    | Deskripsi                    |
|--------|----------------|-------------------------|------------------------------|
| POST   | /auth/login    | { username, password }  | Login admin, dapat JWT token |
| GET    | /auth/me       | Header: Authorization   | Ambil profil admin aktif     |

### Attendance

| Method | Endpoint            | Auth     | Deskripsi                            |
|--------|---------------------|----------|--------------------------------------|
| POST   | /attendance/scan    | Publik   | Scan QR + validasi GPS -> absensi   |
| GET    | /attendance         | JWT      | List semua absensi (filter tersedia) |

Query params GET /attendance:
- startDate / endDate - filter rentang tanggal (YYYY-MM-DD)
- status - incomplete / completed
- participant_type - mahasiswa / smk / sma
- search - cari nama / NIM / institusi

### Participants (Semua butuh JWT)

| Method | Endpoint                       | Deskripsi              |
|--------|--------------------------------|------------------------|
| GET    | /participants                  | List semua peserta     |
| GET    | /participants/:id              | Detail satu peserta    |
| POST   | /participants                  | Tambah peserta baru    |
| PUT    | /participants/:id              | Edit data peserta      |
| DELETE | /participants/:id              | Hapus peserta          |
| PATCH  | /participants/:id/deactivate   | Nonaktifkan peserta    |

Body POST/PUT /participants:
```json
{
  "full_name": "Budi Santoso",
  "identity_number": "22110001",
  "institution": "Universitas Indonesia",
  "participant_type": "mahasiswa",
  "phone": "08123456789",
  "status": "active",
  "start_date": "2026-01-01",
  "end_date": "2026-06-30"
}
```

### Sessions (Semua butuh JWT)

| Method | Endpoint                 | Deskripsi                        |
|--------|--------------------------|----------------------------------|
| GET    | /sessions                | List semua sesi                  |
| GET    | /sessions/today          | Sesi absensi hari ini            |
| POST   | /sessions                | Buat sesi baru                   |
| PUT    | /sessions/:id            | Edit sesi                        |
| DELETE | /sessions/:id            | Hapus sesi                       |
| PATCH  | /sessions/:id/toggle     | Toggle status active <-> closed  |
| POST   | /sessions/quick-today    | Buat sesi hari ini dengan default|

### Dashboard (Butuh JWT)

| Method | Endpoint          | Deskripsi                         |
|--------|-------------------|-----------------------------------|
| GET    | /dashboard/stats  | Statistik ringkasan dashboard     |

Response /dashboard/stats:
```json
{
  "participants": {
    "total": 25, "active": 23, "inactive": 2,
    "types": { "mahasiswa": 15, "smk": 6, "sma": 4 }
  },
  "attendances": {
    "today_total": 18, "today_completed": 12,
    "today_incomplete": 6, "attendance_rate": 78
  },
  "today_session": { ... },
  "recent_attendances": [ ... ]
}
```

---

## Sistem Keamanan JWT

### Cara Kerja

```
1. Admin login -> backend buat token:
   jwt.sign({ id, username }, JWT_SECRET, { expiresIn: "8h" })

2. Token disimpan di localStorage browser

3. Setiap request ke endpoint protected:
   axios interceptor menambahkan header:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

4. Backend verifyToken middleware:
   - Ekstrak token dari header
   - jwt.verify(token, JWT_SECRET) -> decode payload
   - req.admin = { id, username }
   - next() -> lanjut ke controller

5. Token expired (8 jam) -> 401 -> frontend auto-redirect ke /login
```

### Endpoint PUBLIK (tidak butuh JWT):
- GET / dan /scan - halaman peserta scan QR
- POST /api/attendance/scan - scan absensi
- POST /api/auth/login - login admin

### Endpoint yang BUTUH JWT:
- Semua /api/participants/...
- Semua /api/sessions/...
- Semua /api/dashboard/...
- GET /api/attendance/ (list absensi)
- GET /api/auth/me

---

## Halaman Frontend

### / dan /scan - Halaman Scan QR (Publik)

Halaman utama yang diakses peserta untuk presensi:
- Jam digital real-time (update setiap detik)
- Scanner QR Code via kamera (html5-qrcode)
- Validasi GPS otomatis setelah QR berhasil dibaca
- Tampilkan hasil: nama peserta, tipe presensi, pesan sukses/gagal
- Footer: tombol Login Admin -> navigasi ke /login

### /login - Login Administrator (Publik)

Form login admin dengan username dan password.
Setelah berhasil, token disimpan dan redirect ke /dashboard.

### /dashboard - Dashboard Admin [Proteksi JWT]

Statistik ringkasan:
- Total peserta aktif / tidak aktif
- Persentase kehadiran hari ini
- Info sesi absensi hari ini (jam, lokasi, radius)
- Tabel 5 presensi terbaru

### /participants - Manajemen Peserta [Proteksi JWT]

CRUD lengkap:
- Daftar peserta dengan filter dan pencarian
- Tambah peserta baru (form modal)
- Edit data peserta
- Nonaktifkan / aktifkan peserta
- Hapus peserta (dengan konfirmasi)
- Tampilkan QR Code peserta (untuk dicetak / disimpan)

### /attendance - Riwayat Absensi [Proteksi JWT]

Tabel lengkap rekaman presensi:
- Filter tanggal (preset: hari ini, minggu ini, bulan ini / custom)
- Filter status (completed / incomplete)
- Filter tipe peserta
- Pencarian nama / NIM / institusi
- Detail GPS lokasi presensi

### /sessions - Sesi dan Lokasi Absensi [Proteksi JWT]

Kelola sesi absensi harian:
- Buat sesi untuk tanggal tertentu
- Atur jam check-in dan check-out
- Atur koordinat GPS lokasi absensi
- Atur radius toleransi (meter)
- Toggle status sesi (active / closed)
- Quick-create sesi hari ini dengan satu klik

---

## Cara Menjalankan Aplikasi

### Prasyarat
- Node.js v18+
- MySQL 8.0+
- npm

### 1. Setup Database

```sql
CREATE DATABASE absensi_magang;
USE absensi_magang;
-- Import struktur tabel dari file SQL
```

### 2. Setup dan Jalankan Backend

```bash
cd backend
npm install

# Sesuaikan .env (DB_HOST, DB_USER, DB_PASSWORD, dll.)

# Buat akun admin pertama
node createAdmin.js

# Jalankan development server
npm run dev
# Server berjalan di http://localhost:5000
```

### 3. Setup dan Jalankan Frontend

```bash
cd frontend
npm install
npm run dev
# App berjalan di http://localhost:5173
```

### 4. Akses Aplikasi

| URL                               | Keterangan                |
|-----------------------------------|---------------------------|
| http://localhost:5173/            | Halaman scan QR (peserta) |
| http://localhost:5173/login       | Login admin               |
| http://localhost:5173/dashboard   | Panel admin (butuh login) |
| http://localhost:5000/api         | API Backend               |

---

## Konfigurasi Environment

File: `backend/.env`

```
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=absensi_magang
DB_PORT=3306

ATTENDANCE_LATITUDE=-6.200000
ATTENDANCE_LONGITUDE=106.816666
ATTENDANCE_RADIUS=100

JWT_SECRET=absensi_magang_secret_2026
JWT_EXPIRES_IN=8h
```

**Penting:** Ganti JWT_SECRET dengan string acak yang kuat sebelum deploy ke production.

### Default Akun Admin

Setelah menjalankan `node createAdmin.js`:

| Username | Password  |
|----------|-----------|
| admin    | admin123  |

Ganti password setelah login pertama di production.

---

## Diagram Alur Validasi Scan QR

```
POST /api/attendance/scan
         |
         v
[Cek field lengkap?] --Tidak--> 400 Bad Request
         | Ya
         v
[QR Token terdaftar?] --Tidak--> 404 QR tidak dikenal
         | Ya
         v
[Status peserta active?] --inactive--> 403 Peserta tidak aktif
         | Ya
         v
[Ada sesi hari ini?] --Tidak--> 404 Sesi belum dibuat
         | Ya
         v
[Status sesi active?] --closed--> 403 Sesi sudah ditutup
         | Ya
         v
[Dalam radius GPS?] --Tidak--> 403 Di luar area absensi
         | Ya
         v
[Cek waktu server]
  canCheckIn = jam antara check_in_start dan check_in_end
  canCheckOut = jam antara check_out_start dan check_out_end
         |
         +-- keduanya false --> 403 "Bukan waktu absensi"
         |
         v
[Rekaman absensi hari ini ada?]
         |
         +-- TIDAK ada --> CHECK-IN
         |                  INSERT attendances, status="incomplete"
         |                  -> 201 "Check-in berhasil"
         |
         +-- Ada, belum check-out
         |     +-- canCheckOut? --Tidak--> 403 "Bukan waktu check-out"
         |     +-- Ya --> CHECK-OUT
         |                UPDATE attendances, status="completed"
         |                -> 200 "Check-out berhasil"
         |
         +-- Ada, sudah check-out --> 409 "Absensi sudah lengkap"
```

---

Dokumentasi ini dibuat berdasarkan source code aktual aplikasi.
Terakhir diperbarui: September 2026
