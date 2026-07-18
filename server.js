const express = require('express');
const path = require('path');
const youtubedl = require('youtube-dl-exec');

const app = express();
const PORT = process.env.PORT || 3001;
const publicDir = path.join(__dirname, 'public');
const landingPages = {
  '/': {
    title: 'Free InstaSaver — Instagram Reels, Posts, Stories & Audio Downloader',
    description: 'Free InstaSaver helps you download public Instagram Reels, video posts, active stories and Reel audio online. Paste a link, choose video or audio, and save.',
    heading: 'Your Instagram favorites,',
    accent: 'saved in a snap.',
    lede: 'Download public Reels, video posts, active stories, or save just the audio. Fast, private and beautifully simple.',
    canonicalPath: '/',
    activeContent: 'reel'
  },
  '/instagram-reels-downloader': {
    title: 'Instagram Reels Downloader — Save Reels Online Free | Free InstaSaver',
    description: 'Use Free InstaSaver as a free Instagram Reels downloader. Paste a public Reel link, preview the media, and save the Reel video or audio track.',
    heading: 'Instagram Reels downloader',
    accent: 'free, fast, online.',
    lede: 'Paste a public Instagram Reel link and save the video or extract the original audio track in a few clicks.',
    canonicalPath: '/instagram-reels-downloader',
    activeContent: 'reel'
  },
  '/instagram-video-downloader': {
    title: 'Instagram Video Downloader — Download Public Posts Free | Free InstaSaver',
    description: 'Download public Instagram video posts online for free. Copy a post link, paste it into Free InstaSaver, and save the available MP4 video.',
    heading: 'Instagram video downloader',
    accent: 'for public posts.',
    lede: 'Save public Instagram video posts from open accounts. Copy the post link, paste it here, and download the available video.',
    canonicalPath: '/instagram-video-downloader',
    activeContent: 'post'
  },
  '/instagram-story-downloader': {
    title: 'Instagram Story Downloader — Save Active Public Stories | Free InstaSaver',
    description: 'Save active public Instagram stories online. Paste a public story link into Free InstaSaver and download the available story media.',
    heading: 'Instagram story downloader',
    accent: 'before it disappears.',
    lede: 'Download active stories from public Instagram accounts when the story link is publicly reachable.',
    canonicalPath: '/instagram-story-downloader',
    activeContent: 'story'
  },
  '/instagram-audio-downloader': {
    title: 'Instagram Audio Downloader — Extract Reel Audio Free | Free InstaSaver',
    description: 'Extract audio from public Instagram Reels and videos. Paste an Instagram link and use Free InstaSaver audio mode to save the soundtrack.',
    heading: 'Instagram audio downloader',
    accent: 'for Reels and videos.',
    lede: 'Switch to audio mode to save the soundtrack from public Instagram Reels and video posts without downloading the full video.',
    canonicalPath: '/instagram-audio-downloader',
    activeContent: 'reel'
  }
};

function siteUrlFor(req) {
  return (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

function pageFor(req) {
  return landingPages[req.path] || landingPages['/'];
}

function renderHome(req, res) {
  const fs = require('fs');
  const page = pageFor(req);
  const canonicalUrl = `${siteUrlFor(req)}${page.canonicalPath === '/' ? '' : page.canonicalPath}`;
  const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8')
    .replaceAll('{{SITE_URL}}', siteUrlFor(req))
    .replaceAll('{{CANONICAL_URL}}', canonicalUrl)
    .replaceAll('{{PAGE_TITLE}}', page.title)
    .replaceAll('{{PAGE_DESCRIPTION}}', page.description)
    .replaceAll('{{HERO_HEADING}}', page.heading)
    .replaceAll('{{HERO_ACCENT}}', page.accent)
    .replaceAll('{{HERO_LEDE}}', page.lede)
    .replaceAll('{{ACTIVE_CONTENT}}', page.activeContent);
  res.type('html').send(html);
}

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(express.json({ limit: '8kb' }));
app.get('/', (req, res) => renderHome(req, res));
Object.keys(landingPages).filter((route) => route !== '/').forEach((route) => {
  app.get(route, (req, res) => renderHome(req, res));
});
app.get('/healthz', (_req, res) => res.json({ ok: true, name: 'Free InstaSaver' }));
app.get('/robots.txt', (req, res) => res.type('text').send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${siteUrlFor(req)}/sitemap.xml\n`));
app.get('/sitemap.xml', (req, res) => {
  const base = siteUrlFor(req);
  const urls = Object.values(landingPages).map((page) => {
    const loc = `${base}${page.canonicalPath === '/' ? '/' : page.canonicalPath}`;
    const priority = page.canonicalPath === '/' ? '1.0' : '0.85';
    return `<url><loc>${loc}</loc><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
  }).join('');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
});
app.use(express.static(publicDir, { index: false }));

function isInstagramUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const post = /^\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/.test(url.pathname);
    const story = /^\/stories\/[A-Za-z0-9._]+\/[0-9]+\/?/.test(url.pathname);
    return url.protocol === 'https:' && host === 'instagram.com' && (post || story);
  } catch {
    return false;
  }
}

function cleanFilename(value = 'instagram-video') {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, ' ').trim().slice(0, 100) || 'instagram-video';
}

async function getInfo(url, mode = 'video') {
  return youtubedl(url, {
    dumpSingleJson: true,
    noWarnings: true,
    skipDownload: true,
    format: mode === 'audio' ? 'bestaudio/best' : 'best[ext=mp4]/best'
  });
}

function usableInfo(info) {
  if (info?.url) return info;
  if (Array.isArray(info?.entries)) return info.entries.find((entry) => entry?.url) || null;
  return null;
}

app.post('/api/resolve', async (req, res) => {
  const url = String(req.body?.url || '').trim();
  const mode = req.body?.mode === 'audio' ? 'audio' : 'video';
  if (!isInstagramUrl(url)) {
    return res.status(400).json({ error: 'Paste a valid public Instagram Reel, post, or story URL.' });
  }

  try {
    const info = usableInfo(await getInfo(url, mode));
    if (!info?.url) throw new Error('No downloadable video was found.');
    res.json({
      title: info.title || info.description?.split('\n')[0] || 'Instagram video',
      creator: info.uploader || info.channel || 'Instagram creator',
      thumbnail: info.thumbnail || null,
      duration: Number(info.duration) || null,
      mode,
      format: mode === 'audio' ? (info.ext || 'm4a').toUpperCase() : 'MP4',
      downloadUrl: `/api/download?mode=${mode}&url=${encodeURIComponent(url)}`
    });
  } catch (error) {
    console.error('Resolve failed:', error.message);
    res.status(422).json({ error: 'This video could not be fetched. Make sure the post is public and still available.' });
  }
});

app.get('/api/download', async (req, res) => {
  const url = String(req.query.url || '').trim();
  const mode = req.query.mode === 'audio' ? 'audio' : 'video';
  if (!isInstagramUrl(url)) return res.status(400).send('Invalid Instagram URL.');

  try {
    const info = usableInfo(await getInfo(url, mode));
    if (!info?.url) throw new Error('No downloadable video was found.');

    const upstream = await fetch(info.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!upstream.ok || !upstream.body) throw new Error(`Media request failed (${upstream.status}).`);

    const extension = mode === 'audio' ? (info.ext || 'm4a') : 'mp4';
    const filename = `${cleanFilename(info.title)}.${extension}`;
    res.setHeader('Content-Type', upstream.headers.get('content-type') || (mode === 'audio' ? 'audio/mp4' : 'video/mp4'));
    res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '')}"`);
    const length = upstream.headers.get('content-length');
    if (length) res.setHeader('Content-Length', length);

    const { Readable } = require('stream');
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    console.error('Download failed:', error.message);
    if (!res.headersSent) res.status(422).send('The video could not be downloaded. It may be private or unavailable.');
  }
});

app.use((req, res) => renderHome(req, res));

app.listen(PORT, () => {
  console.log(`Free InstaSaver is running at http://localhost:${PORT}`);
});
