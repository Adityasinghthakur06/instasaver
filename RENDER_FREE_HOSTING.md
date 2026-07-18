# Host Free InstaSaver on Render free web service

Hugging Face Spaces now shows Docker as paid on some accounts. Because this app needs a Node backend, do **not** use a Static Space.

Render is the next best free-backend option for this project.

## Why Render

- Supports Node.js web services.
- Has a documented free web service plan.
- Supports custom domains.
- Uses the app's existing `PORT` environment variable automatically.
- Can run the `/api/resolve` and `/api/download` backend routes.

## Steps

1. Create/sign in to Render:

   ```text
   https://render.com
   ```

2. Put this project on GitHub, or upload/import it from a Git repository.

3. In Render dashboard, choose:

   ```text
   New → Web Service
   ```

4. Connect the repo that contains:

   ```text
   C:\Users\anjal\Documents\Codex\2026-07-08\cer\outputs\linklift
   ```

5. Use these settings:

   ```text
   Name: free-instasaver
   Runtime: Node
   Build Command: npm ci
   Start Command: npm start
   Instance Type: Free
   ```

6. Environment variables:

   ```text
   NODE_ENV=production
   YOUTUBE_DL_SKIP_PYTHON_CHECK=1
   ```

7. After deploy, test:

   ```text
   https://YOUR-RENDER-URL.onrender.com/healthz
   https://YOUR-RENDER-URL.onrender.com/sitemap.xml
   ```

## Important limitations

- Free Render services spin down after inactivity, so first load after idle can take about a minute.
- Heavy downloader traffic can hit free limits.
- If Render asks for payment verification, the truly free fallback is to run the backend from your own computer with a tunnel, but that requires your PC to stay on.

## Domain later

Once the Render URL works, buy the domain and connect it in Render's Custom Domains screen. Then set:

```text
SITE_URL=https://freeinstasaver.com
```
