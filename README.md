# Delema API

Delema API adalah *decision-support engine* yang dirancang untuk menangani logika kompleks, riset berbasis AI, dan pengambilan data terstruktur. Awalnya ditulis dalam Python/FastAPI, kini telah bermigrasi sepenuhnya ke **Node.js** berperforma tinggi menggunakan **TypeScript**, **Express**, dan **Zod**.

## Fitur Utama

### 🧠 Smart Research & AI
- **ArXiv Synthesis**: Cari publikasi ilmiah dengan ringkasan otomatis berbasis AI (Gemini/Groq).
- **Wikipedia Intelligence**: Ambil data ensiklopedia dengan dukungan *fallback* otomatis antara bahasa Inggris dan Indonesia.
- **Hybrid AI Search**: Pencarian produk dan konten pintar yang menggabungkan data real-time dan pemrosesan LLM.

### 🏥 Healthcare Data
- **OpenFDA Integration**: Akses cepat ke database FDA untuk informasi obat (*drug*), makanan (*food*), dan perangkat medis (*device*).

### 🛠 Utilities
- **Hyper-local Weather**: Data cuaca real-time berdasarkan kota atau koordinat geografis menggunakan Open-Meteo.

## Struktur API (v1)

Semua *endpoint* menggunakan prefix: `{domain}/api/delema/v1/`

### Research
- `POST /research/arxiv`: Pencarian jurnal ilmiah + Ringkasan AI.
- `POST /research/wikipedia`: Informasi ensiklopedia + Ringkasan AI.

### AI Search
- `POST /ai/search`: Rekomendasi dan pencarian pintar berbasis AI.

### Healthcare
- `POST /fda/search`: Pencarian data regulasi OpenFDA.

### Utilities
- `GET /weather`: Informasi cuaca terkini (mendukung param `city` atau `lat`/`lon`).

## Teknologi Utama
- **Runtime**: Node.js 18+
- **Bahasa**: TypeScript
- **Framework**: Express.js
- **Validasi**: Zod (Rigorously typed request/response)
- **AI Engine**: Gemini, Groq, & OpenRouter

## Memulai

### Prasyarat
- **Node.js 18+**
- **pnpm** (disarankan)

### Instalasi & Konfigurasi
1. Clone repository:
   ```bash
   git clone git@github.com:razaeldotexe/delema-api.git
   cd delema-api
   ```
2. Instal dependensi:
   ```bash
   pnpm install
   ```
3. Konfigurasi `.env`:
   Salin `.env.example` ke `.env` dan isi kunci API yang diperlukan (GEMINI_API_KEY, GROQ_API_KEY, dll).

### Menjalankan Server
- **Development**: `pnpm run dev`
- **Build**: `pnpm run build`
- **Production**: `pnpm run start`

## Pengujian
Jalankan rangkaian tes unit untuk memastikan integritas logika dan endpoint:
```bash
pnpm run test
```

---
© 2026 OpenZero Project.
