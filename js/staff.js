/* ============================================================
   XmasDev — staff.js
   Loads staff data from data/staff.json and renders cards.
   ============================================================ */

const STAFF_DATA_URL = 'data/staff.json';

const SOCIAL_ICONS = {
  twitter:   { icon: '𝕏', label: 'Twitter / X' },
  linkedin:  { icon: 'in', label: 'LinkedIn' },
  github:    { icon: '⌥', label: 'GitHub' },
  instagram: { icon: '📸', label: 'Instagram' },
  website:   { icon: '🌐', label: 'Website' },
};

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('staff-container');
  if (!container) return;

  showLoading(container);

  try {
    const staff = await fetchStaff();
    renderStaff(container, staff);
  } catch (err) {
    console.error('Staff fetch error:', err);
    showError(container, err.message);
  }
});

/* ---- Data fetching ----------------------------------------- */
async function fetchStaff() {
  const res = await fetch(STAFF_DATA_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* ---- Render ------------------------------------------------- */
function renderStaff(container, staff) {
  if (!staff || !staff.length) {
    container.innerHTML = '<p class="state-empty">No staff information available yet.</p>';
    return;
  }

  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'staff-grid';

  staff.forEach((member) => {
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
      if (!url) return;
      const meta = SOCIAL_ICONS[platform.toLowerCase()] || { icon: '🔗', label: platform };
      const a = document.createElement('a');
      a.href = url;
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
