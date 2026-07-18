const form = document.querySelector('#download-form');
const input = document.querySelector('#url');
const button = document.querySelector('#fetch-button');
const message = document.querySelector('#message');
const result = document.querySelector('#result');
const thumbnail = document.querySelector('#thumbnail');
const title = document.querySelector('#video-title');
const meta = document.querySelector('#video-meta');
const saveButton = document.querySelector('#save-button');
const formatBadge = document.querySelector('#format-badge');
const modeButtons = document.querySelectorAll('.mode');
const contentButtons = document.querySelectorAll('.content-type');
let selectedMode = 'video';
let selectedContent = document.body.dataset.activeContent || 'reel';

const contentHints = {
  reel: 'Paste a public Instagram Reel link.',
  post: 'Paste a public Instagram video post link.',
  story: 'Paste the link to an active story from a public account.'
};

contentButtons.forEach((contentButton) => {
  contentButton.classList.toggle('active', contentButton.dataset.content === selectedContent);
  contentButton.addEventListener('click', () => {
    selectedContent = contentButton.dataset.content;
    contentButtons.forEach((item) => item.classList.toggle('active', item === contentButton));
    input.placeholder = `Paste an Instagram ${selectedContent} link…`;
    message.textContent = contentHints[selectedContent];
    message.classList.remove('error');
    result.hidden = true;
  });
});

if (contentHints[selectedContent]) {
  input.placeholder = `Paste an Instagram ${selectedContent} link…`;
  message.textContent = contentHints[selectedContent];
}

modeButtons.forEach((modeButton) => {
  modeButton.addEventListener('click', () => {
    selectedMode = modeButton.dataset.mode;
    modeButtons.forEach((item) => item.classList.toggle('active', item === modeButton));
    button.querySelector('span').textContent = selectedMode === 'audio' ? 'Get audio' : 'Get video';
    result.hidden = true;
  });
});

function formatDuration(total) {
  const mediaLabel = selectedMode === 'audio' ? 'audio' : 'video';
  if (!total) return `Public Instagram ${mediaLabel}`;
  const minutes = Math.floor(total / 60);
  const seconds = String(Math.round(total % 60)).padStart(2, '0');
  return `${minutes}:${seconds} · ${selectedMode === 'audio' ? 'audio track' : 'MP4 video'}`;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  result.hidden = true;
  message.classList.remove('error');
  message.textContent = `Finding the best available ${selectedMode}…`;
  button.disabled = true;
  button.querySelector('span').textContent = 'Fetching…';

  try {
    const response = await fetch('/api/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: input.value.trim(), mode: selectedMode })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not fetch this video.');

    title.textContent = data.title;
    meta.textContent = `${data.creator} · ${formatDuration(data.duration)}`;
    thumbnail.src = data.thumbnail || '';
    thumbnail.parentElement.hidden = !data.thumbnail;
    formatBadge.textContent = data.format;
    saveButton.href = data.downloadUrl;
    saveButton.querySelector('span').textContent = data.mode === 'audio' ? 'Download audio' : 'Download video';
    result.hidden = false;
    message.textContent = `Your ${data.mode} is ready.`;
  } catch (error) {
    message.textContent = error.message;
    message.classList.add('error');
  } finally {
    button.disabled = false;
    button.querySelector('span').textContent = selectedMode === 'audio' ? 'Get audio' : 'Get video';
  }
});
