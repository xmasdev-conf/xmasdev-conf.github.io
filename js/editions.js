/* ============================================================
   XmasDev — editions.js
   Renders previous editions from data/editions.json index.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('editions-archive');
  if (!container) return;

  showLoading(container);

  try {
    const indexUrl = container.dataset.editionsIndex || 'data/editions.json';
    const payload = await fetchEditionsIndex(indexUrl);
    renderPreviousEditions(container, payload);
  } catch (err) {
    console.error('Editions fetch error:', err);
    showError(container);
  }
});

async function fetchEditionsIndex(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderPreviousEditions(container, payload) {
  const activeEdition = String(payload?.activeEdition || '').trim();
  const editions = payload?.editions || {};

  const previous = Object.entries(editions)
    .filter(([key]) => key !== activeEdition)
    .sort(([a], [b]) => Number(b) - Number(a));

  if (!previous.length) {
    container.innerHTML = '<p class="state-empty">Nessuna edizione precedente disponibile al momento.</p>';
    return;
  }

  container.innerHTML = '';

  previous.forEach(([key, edition]) => {
    const card = document.createElement('article');
    card.className = 'about-card';

    const icon = document.createElement('div');
    icon.className = 'about-card__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '🎄';
    card.appendChild(icon);

    const title = document.createElement('h3');
    title.textContent = edition?.name || `XmasDev ${key}`;
    card.appendChild(title);

    const details = [];
    if (edition?.eventDate) details.push(formatDate(edition.eventDate));
    if (edition?.city) details.push(edition.city);

    const desc = document.createElement('p');
    desc.textContent = details.length
      ? `Edizione del ${details.join(' — ')}.`
      : 'Edizione precedente della conference XmasDev.';
    card.appendChild(desc);

    const links = document.createElement('div');
    links.style.display = 'flex';
    links.style.gap = '0.75rem';
    links.style.flexWrap = 'wrap';

    links.appendChild(buildLink(`agenda.html?edition=${encodeURIComponent(key)}`, 'Agenda'));
    links.appendChild(buildLink(`sponsors.html?edition=${encodeURIComponent(key)}`, 'Sponsor'));
    links.appendChild(buildLink(`staff.html?edition=${encodeURIComponent(key)}`, 'Staff'));

    card.appendChild(links);
    container.appendChild(card);
  });
}

function buildLink(href, label) {
  const a = document.createElement('a');
  a.href = href;
  a.className = 'btn btn--outline';
  a.textContent = label;
  a.setAttribute('aria-label', `${label} edizione`);
  return a;
}

function formatDate(raw) {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function showLoading(container) {
  container.innerHTML = `
    <div class="state-loading">
      <div class="spinner"></div>
      <p>Caricamento edizioni…</p>
    </div>`;
}

function showError(container) {
  container.innerHTML = `
    <div class="state-error">
      <p>⚠️ Impossibile caricare le edizioni precedenti.</p>
    </div>`;
}
