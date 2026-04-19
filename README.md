# Delema API

Delema API is a decision-support API designed to help developers handle complex logic, recommendations, and automated choices in their applications. This unified API combines powerful research tools with high-performance multimedia processing.

## Key Features

### Research & Data Extraction
- **ArXiv Search**: Access millions of scientific papers with detailed metadata.
- **Wikipedia Integration**: Fetch summaries and full article data in multiple languages.
- **Nerd Font Discovery**: Search and filter through the Nerd Fonts collection.
- **GitHub Repository Scanner**: Recursively scan repositories for Markdown files and retrieve content.

### Video & Audio Processing
- **Metadata Extraction**: Get detailed video info without downloading.
- **Multi-platform Support**: Works with YouTube (Shorts, Music), TikTok, Instagram, Twitter/X, and 1000+ more via `yt-dlp`.
- **Audio Extraction**: High-quality MP3 and M4A conversion.
- **Progress Tracking**: Real-time download status updates via Task IDs.
- **Auto-Cleanup**: Temporary files are automatically removed after delivery.

## API Endpoints

### General
- `GET /`: API status and documentation landing page.

### Research
- `GET /arxiv?q={query}`
- `GET /wikipedia?q={query}&lang={lang}`
- `GET /nerdfont?q={query}`
- `POST /github/scan`: Body `{"owner": "", "repo": "", "token": "", "path": ""}`
- `POST /github/content`: Body `{"owner": "", "repo": "", "token": "", "path": ""}`

### Multimedia
- `GET /info?url={url}`
- `GET /download?url={url}&format={best|mp4|mp3|m4a}`
- `GET /progress/{task_id}`

## Getting Started

### Prerequisites
- **Python 3.10+**
- **FFmpeg**: Required for audio extraction.
- **Node.js**: Required by `yt-dlp` for certain signature decryptions.

### Installation
1. Clone the repository:
   ```bash
   git clone git@github.com:razaeldotexe/delema-api.git
   cd delema-api
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the server:
   ```bash
   python main.py
   # or
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

## Deployment
This API is ready for deployment on **Railway** or any platform supporting **Nixpacks** or **Procfile**. Ensure you provide a `PORT` environment variable.

---
&copy; 2026 OpenZero Project.
