/* ============================================================
   XmasDev — main.js  (shared across all pages)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initSnowflakes();
  highlightActiveNav();
  initCfpBanner();
});

/* ---- Responsive hamburger menu ----------------------------- */
function initNavbar() {
  const hamburger = document.getElementById('navbar-hamburger');
  const links = document.getElementById('navbar-links');
  if (!hamburger || !links) return;

  hamburger.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close menu on link click (mobile)
  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---- Highlight current page in nav ------------------------- */
function highlightActiveNav() {
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar__links a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

/* ---- Animated snowflakes (hero section only) --------------- */
function initSnowflakes() {
  const container = document.querySelector('.snowflakes');
  if (!container) return;

  const symbols = ['❄', '❅', '❆', '✦', '✧'];
  const count = 18;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'snowflake';
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.left = `${Math.random() * 100}%`;
    el.style.fontSize = `${0.6 + Math.random() * 1}rem`;
    el.style.animationDuration = `${6 + Math.random() * 10}s`;
    el.style.animationDelay = `-${Math.random() * 12}s`;
    el.style.opacity = `${0.05 + Math.random() * 0.2}`;
    container.appendChild(el);
  }
}

/* ---- CFP banner (homepage only) --------------------------- */
async function initCfpBanner() {
  const cfpSection = document.getElementById('cfp');
  if (!cfpSection) return;

  const configUrl = cfpSection.dataset.cfpConfig || 'data/editions.json';
  const requestedEdition = cfpSection.dataset.edition;

  const cfpData = await loadCfpFromEditions(configUrl, requestedEdition);

  const title = cfpData?.title || cfpSection.dataset.cfpTitle;
  const closeRaw = cfpData?.close || cfpSection.dataset.cfpClose;
  const linkRaw = cfpData?.link || cfpSection.dataset.cfpLink;
  const enabled = cfpData?.enabled;

  if (enabled === false) {
    cfpSection.hidden = true;
    return;
  }

  if (!title || !closeRaw || !linkRaw) {
    cfpSection.hidden = true;
    return;
  }

  const closeDate = new Date(closeRaw);
  if (Number.isNaN(closeDate.getTime()) || Date.now() > closeDate.getTime()) {
    cfpSection.hidden = true;
    return;
  }

  let link;
  try {
    link = new URL(linkRaw);
  } catch {
    cfpSection.hidden = true;
    return;
  }

  const titleEl = document.getElementById('cfp-title');
  const deadlineEl = document.getElementById('cfp-deadline');
  const linkEl = document.getElementById('cfp-link');

  if (!titleEl || !deadlineEl || !linkEl) {
    cfpSection.hidden = true;
    return;
  }

  titleEl.textContent = title;
  deadlineEl.textContent = closeDate.toLocaleString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  linkEl.href = link.toString();

  cfpSection.hidden = false;
}

async function loadCfpFromEditions(configUrl, requestedEdition) {
  const editionData = await loadEditionDataFromIndex(configUrl, requestedEdition);
  return editionData?.cfp || null;
}

async function loadEditionDataFromIndex(configUrl, requestedEdition) {
  try {
    const res = await fetch(configUrl);
    if (!res.ok) return null;

    const payload = await res.json();
    const editions = payload?.editions;
    if (!editions || typeof editions !== 'object') return null;

    const editionKey = requestedEdition || payload?.activeEdition;
    if (!editionKey || !editions[editionKey]) return null;

    const editionIndexEntry = editions[editionKey];
    const configPath = editionIndexEntry?.configUrl;

    if (!configPath) return editionIndexEntry;

    const detailRes = await fetch(configPath);
    if (!detailRes.ok) return editionIndexEntry;

    const detailPayload = await detailRes.json();
    return { ...editionIndexEntry, ...detailPayload };
  } catch {
    return null;
  }
}
