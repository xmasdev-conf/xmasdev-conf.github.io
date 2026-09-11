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

function ed_ui(key, fallback) {
  return (window.I18n && typeof window.I18n.t === 'function') ? window.I18n.t(key, fallback) : fallback;
}
function ed_tr(value) {
  return (window.I18n && typeof window.I18n.pick === 'function') ? window.I18n.pick(value) : value;
}
function ed_locale() {
  return (window.I18n && window.I18n.lang === 'en') ? 'en-GB' : 'it-IT';
}

function renderPreviousEditions(container, payload) {
  const activeEdition = String(payload?.activeEdition || '').trim();
  const editions = payload?.editions || {};

  const previous = Object.entries(editions)
    .filter(([key]) => key !== activeEdition)
    .sort(([a], [b]) => Number(b) - Number(a));

  if (!previous.length) {
    container.innerHTML = `<p class="state-empty">${ed_ui('editions.empty', 'Nessuna edizione precedente disponibile al momento.')}</p>`;
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
    if (edition?.city) details.push(ed_tr(edition.city));

    const desc = document.createElement('p');
    desc.textContent = details.length
      ? `${ed_ui('editions.editionOf', 'Edizione del')} ${details.join(' — ')}.`
      : ed_ui('editions.genericDesc', 'Edizione precedente della conference XmasDev.');
    card.appendChild(desc);

    const links = document.createElement('div');
    links.style.display = 'flex';
    links.style.gap = '0.75rem';
    links.style.flexWrap = 'wrap';

    links.appendChild(buildLink(`agenda.html?edition=${encodeURIComponent(key)}`, ed_ui('nav.agenda', 'Agenda')));
    links.appendChild(buildLink(`sponsors.html?edition=${encodeURIComponent(key)}`, ed_ui('nav.sponsors', 'Sponsor')));
    links.appendChild(buildLink(`staff.html?edition=${encodeURIComponent(key)}`, ed_ui('nav.staff', 'Staff')));

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
  return date.toLocaleDateString(ed_locale(), {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function showLoading(container) {
  container.innerHTML = `
    <div class="state-loading">
      <div class="spinner"></div>
      <p>${ed_ui('editions.loading', 'Caricamento edizioni…')}</p>
    </div>`;
}

function showError(container) {
  container.innerHTML = `
    <div class="state-error">
      <p>⚠️ ${ed_ui('editions.error', 'Impossibile caricare le edizioni precedenti.')}</p>
    </div>`;
}
