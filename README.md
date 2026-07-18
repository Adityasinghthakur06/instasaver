---
title: Free InstaSaver
emoji: 📥
colorFrom: pink
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# Free InstaSaver

A small web app for downloading media you have permission to save from public Instagram posts, Reels and stories, with video and audio-only modes.

## Run locally

```bash
npm install
npm start
```

On Windows machines where Python is not on `PATH`, install once with:

```powershell
$env:YOUTUBE_DL_SKIP_PYTHON_CHECK='1'; npm install
```

Then open `http://localhost:3001`. Port 3001 is used by default so the app does not conflict with services already running on port 3000.

## Notes

- Public `/p/`, `/reel/`, `/tv/` and `/stories/username/id/` Instagram URLs are accepted.
- Stories must still be active and publicly accessible. Instagram may require authentication for some stories even when the profile is public.
- Instagram may change its delivery system or rate-limit requests. Keep `yt-dlp-exec` current if resolving stops working.
- This app intentionally does not bypass private accounts or authentication.

## Free hosting: Hugging Face Spaces

This project is ready for a free Docker Space.

1. Create a free Hugging Face account.
2. Go to `https://huggingface.co/new-space`.
3. Choose:
   - Space name: `free-instasaver`
   - SDK: `Docker`
   - Hardware: free CPU/basic
   - Visibility: Public
4. Upload/push this whole `outputs/linklift` folder to the Space repository.
5. Hugging Face will build the Dockerfile and publish the site.

The app runs on port `7860`, which is the port configured in the Space metadata above.
