# OpenZero Video Downloader API

API berbasis FastAPI untuk mengunduh video dan audio menggunakan `yt-dlp`. Siap dideploy ke Railway.

## Fitur
- **Metadata Info**: Mendapatkan info video tanpa mendownload.
- **Multi-platform**: Mendukung YouTube, TikTok, Instagram, Twitter, dan banyak lagi.
- **Audio Extraction**: Mendukung format MP3 dan M4A.
- **Progress Tracking**: Cek status download secara real-time.
- **Rate Limiting**: Mencegah penyalahgunaan API.
- **Auto-Cleanup**: Menghapus file sementara setelah dikirim ke user.

## Menangani Error Cookies (Sign in to confirm you are not a bot)

Jika Anda mendapatkan error "Sign in to confirm you are not a bot", YouTube memblokir akses dari IP server Anda. Cara mengatasinya:

1. Install ekstensi browser **Get cookies.txt LOCALLY** (tersedia di Chrome/Firefox).
2. Buka YouTube dan pastikan Anda login.
3. Gunakan ekstensi tersebut untuk mengekspor cookie YouTube sebagai file `cookies.txt`.
4. Letakkan file `cookies.txt` tersebut di dalam folder `video_api/`.
5. API akan otomatis mendeteksi dan menggunakan file tersebut untuk bypass bot detection.

> **Peringatan**: Jangan bagikan file `cookies.txt` Anda karena berisi informasi login akun Anda.

## Dependensi Sistem

API ini membutuhkan beberapa dependensi sistem agar fitur download (terutama YouTube dan ekstraksi audio) berjalan lancar:

1. **FFmpeg**: Dibutuhkan untuk konversi audio (MP3/M4A) dan menggabungkan video/audio berkualitas tinggi.
2. **Node.js**: Dibutuhkan oleh `yt-dlp` sebagai JavaScript runtime untuk memproses signature video (terutama YouTube).

### Cara Instal (Lokal/Termux)
```bash
# Termux
pkg install ffmpeg nodejs-lts

# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg nodejs

# MacOS
brew install ffmpeg node
```

## Cara Menjalankan Lokal

1. Masuk ke direktori:
   ```bash
   cd video_api
   ```
2. Buat virtual environment (opsional):
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Android
   ```
3. Install dependensi:
   ```bash
   pip install -r requirements.txt
   ```
4. Jalankan server:
   ```bash
   uvicorn main:app --reload
   ```

API akan tersedia di `http://localhost:8000`.

## Endpoint API

### 1. Root
- **URL**: `/`
- **Method**: `GET`
- **Desc**: Cek status API.

### 2. Info Video
- **URL**: `/info`
- **Method**: `GET`
- **Query Params**: `url` (String)
- **Contoh**: `/info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ`

### 3. Download
- **URL**: `/download`
- **Method**: `GET`
- **Query Params**:
  - `url`: URL video.
  - `format`: `best` (default), `mp4`, `mp3`, `m4a`.
- **Contoh**: `/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=mp3`

### 4. Progress
- **URL**: `/progress/{task_id}`
- **Method**: `GET`
- **Desc**: Mengecek persentase unduhan jika proses masih berjalan.

## Deployment ke Railway

1. Hubungkan repository ke Railway.
2. Railway akan otomatis mendeteksi `Procfile`.
3. Pastikan menambahkan variabel lingkungan `PORT` (Railway menyediakannya secara otomatis).
4. Selesai.
