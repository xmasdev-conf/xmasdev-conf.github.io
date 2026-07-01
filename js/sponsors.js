/* ============================================================
   XmasDev — sponsors.js
  Loads sponsor data from editions index + edition config.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('sponsors-container');
  if (!container) return;

  showLoading(container);

  try {
    const data = await fetchSponsors(container);
    renderSponsors(container, data);
  } catch (err) {
    console.error('Sponsors fetch error:', err);
    showError(container);
  }
});

/* ---- Data fetching ----------------------------------------- */
async function fetchSponsors(container) {
  const editionsIndexUrl = container.dataset.editionsIndex || 'data/editions.json';
  const queryEdition = new URLSearchParams(window.location.search).get('edition');
  const requestedEdition = queryEdition || container.dataset.edition;

  const editionData = await loadEditionDataFromIndex(editionsIndexUrl, requestedEdition);
  if (editionData?.sponsors) return editionData.sponsors;

  throw new Error('Sponsors config missing for selected edition.');
}

async function loadEditionDataFromIndex(indexUrl, requestedEdition) {
  try {
    const res = await fetch(indexUrl);
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

/* ---- Render ------------------------------------------------- */
function renderSponsors(container, data) {
  const tiers = (data.tiers || []).slice().sort(sortTiersByPriority);
  if (!tiers.length) {
    container.innerHTML = '<p class="state-empty">Sponsor information coming soon.</p>';
    return;
  }

  container.innerHTML = '';

  tiers.forEach((tier) => {
    if (!tier.sponsors || !tier.sponsors.length) return;

    const section = document.createElement('div');
    section.className = `sponsor-tier sponsor-tier--${tier.name.toLowerCase()}`;

    // Tier label
    const label = document.createElement('div');
    label.className = 'sponsor-tier__label';
    const h3 = document.createElement('h3');
    h3.textContent = tier.name;
    label.appendChild(h3);
    section.appendChild(label);

    // Sponsor cards
    const grid = document.createElement('div');
    grid.className = 'sponsor-tier__grid';

    tier.sponsors.forEach((sponsor) => {
      grid.appendChild(buildSponsorCard(sponsor));
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}

function sortTiersByPriority(a, b) {
  const order = ['diamond', 'platinum', 'gold', 'silver'];
  const aName = (a?.name || '').toLowerCase();
  const bName = (b?.name || '').toLowerCase();

  const aIdx = order.indexOf(aName);
  const bIdx = order.indexOf(bName);

  const safeA = aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx;
  const safeB = bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx;

  if (safeA !== safeB) return safeA - safeB;
  return aName.localeCompare(bName);
}

/* ---- Build a single sponsor card --------------------------- */
function buildSponsorCard(sponsor) {
  const card = document.createElement('a');
  card.className = 'sponsor-card';
  card.href = sponsor.url || '#';
  card.target = '_blank';
  card.rel = 'noopener noreferrer';
  card.title = sponsor.name;

  if (sponsor.logo) {
    const img = document.createElement('img');
    img.src = sponsor.logo;
    img.alt = sponsor.name;
    img.loading = 'lazy';
    card.appendChild(img);
  }

  const name = document.createElement('div');
  name.className = 'sponsor-card__name';
  name.textContent = sponsor.name;
  card.appendChild(name);

  if (sponsor.description) {
    const desc = document.createElement('div');
    desc.className = 'sponsor-card__desc';
    desc.textContent = sponsor.description;
    card.appendChild(desc);
  }

  return card;
}

/* ---- State helpers ----------------------------------------- */
function showLoading(container) {
  container.innerHTML = `
    <div class="state-loading">
      <div class="spinner"></div>
      <p>Loading sponsors…</p>
    </div>`;
}

function showError(container) {
  container.innerHTML = `
    <div class="state-error">
      <p>⚠️ Could not load sponsor data.</p>
    </div>`;
}
