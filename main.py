import os
import uuid
import sys
import asyncio
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import yt_dlp
from dotenv import load_dotenv

load_dotenv()

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

# Add fetchers path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "fetchers")))
try:
    import arxiv_fetcher
    import wiki_fetcher
    import nerdfont_fetcher
    import github_fetcher
except ImportError as e:
    logger.error(f"Failed to import fetchers: {e}")

# Configuration
TEMP_FOLDER = os.getenv("TEMP_FOLDER", "temp")
MAX_FILESIZE = os.getenv("MAX_FILESIZE", "500M")
PORT = int(os.getenv("PORT", 8000))

# Ensure temp folder exists
os.makedirs(TEMP_FOLDER, exist_ok=True)

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Delema API", description="Combined Research & Video Downloader API")

# Middleware & Exception Handlers
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory progress tracking for video
download_progress = {}

class MyLogger:
    def debug(self, msg): pass
    def warning(self, msg): logger.warning(msg)
    def error(self, msg): logger.error(msg)

def create_progress_hook(task_id: str):
    def hook(d):
        if d['status'] == 'downloading':
            download_progress[task_id] = {
                "status": "downloading",
                "downloaded_bytes": d.get('downloaded_bytes'),
                "total_bytes": d.get('total_bytes') or d.get('total_bytes_estimate'),
                "speed": d.get('speed'),
                "eta": d.get('eta'),
                "percent": d.get('_percent_str', '0%').strip()
            }
        elif d['status'] == 'finished':
            download_progress[task_id]["status"] = "finished"
            download_progress[task_id]["percent"] = "100%"
    return hook

def cleanup_file(path: str, task_id: str = None):
    try:
        if os.path.exists(path):
            os.remove(path)
        if task_id and task_id in download_progress:
            del download_progress[task_id]
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Delema API</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { background: #0f172a; color: #e2e8f0; font-family: 'Inter', sans-serif; }
            .hero { padding: 60px 0; border-bottom: 1px solid #1e293b; }
            .card { background: #1e293b; border: 1px solid #334155; color: #e2e8f0; }
            code { color: #38bdf8; background: #0f172a; padding: 2px 6px; border-radius: 4px; }
            .endpoint { border-left: 4px solid #38bdf8; padding-left: 15px; margin-bottom: 20px; }
            .badge-get { background: #10b981; color: white; }
            .badge-post { background: #f59e0b; color: white; }
        </style>
    </head>
    <body>
        <div class="hero text-center">
            <div class="container">
                <h1 class="display-4 fw-bold text-info">Delema API</h1>
                <p class="lead text-secondary">Unified Research and Multimedia API</p>
                <div class="mt-4">
                    <span class="badge bg-success">Status: Online</span>
                    <span class="badge bg-info text-dark">Version: 2.0.0</span>
                </div>
            </div>
        </div>

        <div class="container my-5">
            <div class="row">
                <div class="col-md-8 mx-auto">
                    <h3 class="mb-4">Research Endpoints</h3>
                    <div class="card mb-4 shadow-sm">
                        <div class="card-body">
                            <div class="endpoint">
                                <span class="badge badge-get mb-2">GET</span>
                                <h5>/arxiv</h5>
                                <p class="text-secondary small">Search papers from ArXiv.</p>
                                <code>/arxiv?q={query}</code>
                            </div>
                            <div class="endpoint">
                                <span class="badge badge-get mb-2">GET</span>
                                <h5>/wikipedia</h5>
                                <p class="text-secondary small">Search articles from Wikipedia.</p>
                                <code>/wikipedia?q={query}&lang={lang}</code>
                            </div>
                            <div class="endpoint">
                                <span class="badge badge-get mb-2">GET</span>
                                <h5>/nerdfont</h5>
                                <p class="text-secondary small">Search Nerd Fonts.</p>
                                <code>/nerdfont?q={query}</code>
                            </div>
                            <div class="endpoint">
                                <span class="badge badge-post mb-2">POST</span>
                                <h5>/github/scan</h5>
                                <p class="text-secondary small">Scan GitHub repo recursively for .md files.</p>
                                <code>POST {"owner": "", "repo": "", "token": "", "path": ""}</code>
                            </div>
                            <div class="endpoint">
                                <span class="badge badge-post mb-2">POST</span>
                                <h5>/github/content</h5>
                                <p class="text-secondary small">Get GitHub file content.</p>
                                <code>POST {"owner": "", "repo": "", "token": "", "path": ""}</code>
                            </div>
                        </div>
                    </div>

                    <h3 class="mb-4">Video Downloader Endpoints</h3>
                    <div class="card mb-4 shadow-sm">
                        <div class="card-body">
                            <div class="endpoint">
                                <span class="badge badge-get mb-2">GET</span>
                                <h5>/info</h5>
                                <p class="text-secondary small">Get video metadata.</p>
                                <code>/info?url={video_url}</code>
                            </div>
                            <div class="endpoint">
                                <span class="badge badge-get mb-2">GET</span>
                                <h5>/download</h5>
                                <p class="text-secondary small">Download video/audio.</p>
                                <code>/download?url={video_url}&format={best|mp4|mp3|m4a}</code>
                            </div>
                            <div class="endpoint">
                                <span class="badge badge-get mb-2">GET</span>
                                <h5>/progress/{task_id}</h5>
                                <p class="text-secondary small">Track download status.</p>
                                <code>/progress/{task_id}</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <footer class="text-center py-4 text-secondary small">
            &copy; 2026 OpenZero Project.
        </footer>
    </body>
    </html>
    """

# --- Research Handlers ---

@app.get("/arxiv")
@limiter.limit("10/minute")
async def get_arxiv(request: Request, q: str = Query(..., description="Query for ArXiv search")):
    try:
        return arxiv_fetcher.fetch_arxiv(q)
    except Exception as e:
        logger.error(f"ArXiv Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/wikipedia")
@limiter.limit("10/minute")
async def get_wikipedia(request: Request, q: str = Query(..., description="Query for Wikipedia search"), lang: str = "id"):
    try:
        return wiki_fetcher.fetch_wikipedia_data(q, lang)
    except Exception as e:
        logger.error(f"Wikipedia Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/nerdfont")
@limiter.limit("10/minute")
async def get_nerdfont(request: Request, q: str = Query(..., description="Query for NerdFont search")):
    try:
        return nerdfont_fetcher.fetch_fonts(q)
    except Exception as e:
        logger.error(f"NerdFont Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/github/scan")
@limiter.limit("5/minute")
async def scan_github(request: Request, data: dict):
    owner = data.get("owner")
    repo = data.get("repo")
    token = data.get("token")
    path = data.get("path", "")
    if not owner or not repo:
        raise HTTPException(status_code=400, detail="Owner and repo required")
    
    result = github_fetcher.scan_recursive(owner, repo, token, path)
    if isinstance(result, dict) and "error" in result:
        status_code = 403 if "403" in result["error"] else 500
        raise HTTPException(status_code=status_code, detail=result["error"])
    return result

@app.post("/github/content")
@limiter.limit("5/minute")
async def get_github_content(request: Request, data: dict):
    owner = data.get("owner")
    repo = data.get("repo")
    token = data.get("token")
    path = data.get("path")
    if not owner or not repo or not path:
        raise HTTPException(status_code=400, detail="Owner, repo, and path required")
    
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
    file_info = github_fetcher.github_api_request(url, token)
    if isinstance(file_info, dict) and "error" in file_info:
        status_code = 403 if "403" in file_info["error"] else 500
        raise HTTPException(status_code=status_code, detail=file_info["error"])
    
    if isinstance(file_info, dict) and "download_url" in file_info:
        content = github_fetcher.fetch_file_content(file_info["download_url"], token)
        if isinstance(content, dict) and "error" in content:
            raise HTTPException(status_code=500, detail=content["error"])
        return {"name": path.split("/")[-1], "content": content}
    else:
        raise HTTPException(status_code=404, detail="File not found")

# --- Video Downloader Handlers ---

@app.get("/info")
@limiter.limit("20/minute")
async def get_info(request: Request, url: str):
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,
        'nocheckcertificate': True,
    }
    cookies_path = os.path.join(os.path.dirname(__file__), "cookies.txt")
    if os.path.exists(cookies_path):
        ydl_opts['cookiefile'] = cookies_path
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                "status": "success",
                "data": {
                    "id": info.get('id'),
                    "title": info.get('title'),
                    "duration": info.get('duration'),
                    "thumbnail": info.get('thumbnail'),
                    "uploader": info.get('uploader'),
                    "view_count": info.get('view_count'),
                    "formats": [
                        {"format_id": f.get('format_id'), "ext": f.get('ext'), "resolution": f.get('resolution'), "filesize": f.get('filesize')}
                        for f in info.get('formats', []) if f.get('filesize')
                    ] if not info.get('_type') == 'playlist' else "Playlist detected"
                }
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/download")
@limiter.limit("5/minute")
async def download_video(
    request: Request,
    background_tasks: BackgroundTasks,
    url: str,
    format: str = Query("best", enum=["best", "mp4", "mp3", "m4a"])
):
    task_id = str(uuid.uuid4())
    download_progress[task_id] = {"status": "starting", "percent": "0%"}
    outtmpl = os.path.join(TEMP_FOLDER, f"{task_id}.%(ext)s")
    
    ydl_opts = {
        'format': 'bestvideo+bestaudio/best' if format not in ["mp3", "m4a"] else 'bestaudio/best',
        'outtmpl': outtmpl,
        'progress_hooks': [create_progress_hook(task_id)],
        'logger': MyLogger(),
        'max_filesize': 524288000, 
        'nocheckcertificate': True,
    }
    cookies_path = os.path.join(os.path.dirname(__file__), "cookies.txt")
    if os.path.exists(cookies_path):
        ydl_opts['cookiefile'] = cookies_path

    if format in ["mp3", "m4a"]:
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': format,
            'preferredquality': '192',
        }]
    
    try:
        loop = asyncio.get_event_loop()
        def run_dl():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                return ydl.prepare_filename(info)

        filepath = await loop.run_in_executor(None, run_dl)
        if format == "mp3":
            filepath = os.path.splitext(filepath)[0] + ".mp3"
        elif format == "m4a":
            filepath = os.path.splitext(filepath)[0] + ".m4a"

        if not os.path.exists(filepath):
            found = False
            for f in os.listdir(TEMP_FOLDER):
                if f.startswith(task_id):
                    filepath = os.path.join(TEMP_FOLDER, f)
                    found = True
                    break
            if not found:
                raise Exception("File not found after download")

        filename = os.path.basename(filepath)
        background_tasks.add_task(cleanup_file, filepath, task_id)
        return FileResponse(path=filepath, filename=filename, media_type='application/octet-stream')

    except Exception as e:
        if task_id in download_progress:
            del download_progress[task_id]
        err_msg = str(e)
        if "ffmpeg" in err_msg.lower():
            raise HTTPException(status_code=500, detail="FFmpeg not installed.")
        elif "javascript" in err_msg.lower() or "runtime" in err_msg.lower():
            raise HTTPException(status_code=500, detail="Node.js not installed.")
        raise HTTPException(status_code=500, detail=err_msg)

@app.get("/progress/{task_id}")
async def get_progress(task_id: str):
    if task_id not in download_progress:
        return JSONResponse(status_code=404, content={"status": "error", "message": "Task ID not found"})
    return {"status": "success", "data": download_progress[task_id]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
