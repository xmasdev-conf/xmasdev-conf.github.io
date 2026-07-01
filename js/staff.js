/* ============================================================
   XmasDev — staff.js
  Loads staff data from editions index + edition config and renders cards.
   ============================================================ */

const SOCIAL_ICONS = {
  x:         { icon: '𝕏', label: 'X' },
  twitter:   { icon: '𝕏', label: 'X' },
  bluesky:   { icon: '🦋', label: 'Bluesky' },
  linkedin:  { icon: 'in', label: 'LinkedIn' },
  instagram: { icon: '📸', label: 'Instagram' },
  facebook:  { icon: 'f', label: 'Facebook' },
};

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('staff-container');
  if (!container) return;

  showLoading(container);

  try {
    const staff = await fetchStaff(container);
    renderStaff(container, staff);
  } catch (err) {
    console.error('Staff fetch error:', err);
    showError(container, err.message);
  }
});

/* ---- Data fetching ----------------------------------------- */
async function fetchStaff(container) {
  const editionsIndexUrl = container.dataset.editionsIndex || 'data/editions.json';
  const queryEdition = new URLSearchParams(window.location.search).get('edition');
  const requestedEdition = queryEdition || container.dataset.edition;

  const editionData = await loadEditionDataFromIndex(editionsIndexUrl, requestedEdition);
  if (Array.isArray(editionData?.staff)) return editionData.staff;

  throw new Error('Staff config missing for selected edition.');
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
function renderStaff(container, staff) {
  if (!staff || !staff.length) {
    container.innerHTML = '<p class="state-empty">No staff information available yet.</p>';
    return;
  }

  const randomizedStaff = randomizeStaffOrder(staff);

  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'staff-grid';

  randomizedStaff.forEach((member) => {
    grid.appendChild(buildStaffCard(member));
  });

  container.appendChild(grid);
}

/* ---- Build a single staff card ----------------------------- */
function buildStaffCard(member) {
  const card = document.createElement('article');
  card.className = 'staff-card';

  const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ');

  // Photo
  const img = document.createElement('img');
  img.className = 'staff-card__photo';
  img.src = member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1e2530&color=e6edf3&size=200`;
  img.alt = fullName;
  img.width = 100;
  img.height = 100;
  img.loading = 'lazy';
  // Fallback for broken images
  img.onerror = () => {
    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1e2530&color=e6edf3&size=200`;
  };
  card.appendChild(img);

  // Name
  const name = document.createElement('div');
  name.className = 'staff-card__name';
  name.textContent = fullName;
  card.appendChild(name);

  // Role
  if (member.role) {
    const role = document.createElement('div');
    role.className = 'staff-card__role';
    role.textContent = member.role;
    card.appendChild(role);
  }

  // Bio
  if (member.bio) {
    const bio = document.createElement('p');
    bio.className = 'staff-card__bio';
    bio.textContent = member.bio;
    card.appendChild(bio);
  }

  // Social links
  if (member.socials && Object.keys(member.socials).length) {
    const socials = document.createElement('div');
    socials.className = 'staff-card__socials';

    Object.entries(member.socials).forEach(([platform, url]) => {
      if (typeof url !== 'string' || !url.trim()) return;
      const normalizedPlatform = platform.toLowerCase() === 'twitter' ? 'x' : platform.toLowerCase();
      const meta = SOCIAL_ICONS[normalizedPlatform] || { icon: '🔗', label: platform };
      const a = document.createElement('a');
      a.href = url.trim();
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = meta.label;
      a.setAttribute('aria-label', `${fullName} on ${meta.label}`);
      a.textContent = meta.icon;
      socials.appendChild(a);
    });

    card.appendChild(socials);
  }

  return card;
}

function randomizeStaffOrder(staff) {
  if (!Array.isArray(staff) || staff.length < 2) return staff;

  const key = 'xmasdev-staff-last-order';
  const previousOrder = sessionStorage.getItem(key) || '';

  let shuffled = shuffle([...staff]);
  let currentOrder = serializeOrder(shuffled);
  let attempts = 0;

  while (currentOrder === previousOrder && attempts < 8) {
    shuffled = shuffle([...staff]);
    currentOrder = serializeOrder(shuffled);
    attempts += 1;
  }

  if (currentOrder === previousOrder) {
    shuffled.push(shuffled.shift());
    currentOrder = serializeOrder(shuffled);
  }

  sessionStorage.setItem(key, currentOrder);
  return shuffled;
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function serializeOrder(staff) {
  return staff.map((member) => String(member.id ?? `${member.firstName}-${member.lastName}`)).join('|');
}

/* ---- State helpers ----------------------------------------- */
function showLoading(container) {
  container.innerHTML = `
    <div class="state-loading">
      <div class="spinner"></div>
      <p>Loading staff…</p>
    </div>`;
}

function showError(container, message) {
  container.innerHTML = `
    <div class="state-error">
      <p>⚠️ Could not load staff data.</p>
    </div>`;
  console.error(message);
}
