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
  if (editionData?.sponsors || editionData?.sponsorshipPack) {
    return {
      sponsors: editionData?.sponsors || { tiers: [] },
      sponsorshipPack: editionData?.sponsorshipPack || null,
      sponsorsPageContent: editionData?.sponsors?.pageContent || null,
    };
  }

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

/* ---- i18n helpers ------------------------------------------ */
function sp_tr(value) {
  return (window.I18n && typeof window.I18n.pick === 'function') ? window.I18n.pick(value) : value;
}
function sp_ui(key, fallback) {
  return (window.I18n && typeof window.I18n.t === 'function') ? window.I18n.t(key, fallback) : fallback;
}

/* ---- Render ------------------------------------------------- */
function renderSponsors(container, data) {
  const tiers = (data?.sponsors?.tiers || []).slice().sort(sortTiersByPriority);
  const sponsorshipPack = data?.sponsorshipPack || {};
  const sponsorsPageContent = data?.sponsorsPageContent || {};
  const currentSponsorTiers = tiers.filter((tier) => Array.isArray(tier?.sponsors) && tier.sponsors.length > 0);
  const sponsorshipTiers = tiers.filter((tier) => tier?.price || (Array.isArray(tier?.benefits) && tier.benefits.length > 0));

  if (!currentSponsorTiers.length && !sponsorshipTiers.length) {
    container.innerHTML = `<p class="state-empty">${sp_ui('sponsors.empty', 'Le informazioni sugli sponsor saranno disponibili a breve.')}</p>`;
    return;
  }

  container.innerHTML = '';

  if (currentSponsorTiers.length) {
    const currentHeader = document.createElement('div');
    currentHeader.className = 'section__header';
    currentHeader.innerHTML = `
      <h2>${sp_tr(sponsorsPageContent.currentSponsorsTitle) || sp_ui('sponsors.currentTitle', 'Sponsor attuali')}</h2>
      <p>${sp_tr(sponsorsPageContent.currentSponsorsDescription) || sp_ui('sponsors.currentDesc', 'Le aziende già confermate per questa edizione.')}</p>
    `;
    container.appendChild(currentHeader);

    currentSponsorTiers.forEach((tier) => {
      const section = document.createElement('div');
      section.className = `sponsor-tier sponsor-tier--${(tier.name || '').toLowerCase()}`;

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
        let safeUrl = '#';
        try {
          const u = new URL(sponsor.url, window.location.href);
          if (u.protocol === 'http:' || u.protocol === 'https:') safeUrl = u.toString();
        } catch {}
        grid.appendChild(buildSponsorCard({ ...sponsor, url: safeUrl }, tier.name));
      });

      section.appendChild(grid);
      container.appendChild(section);
    });
  }

  if (sponsorshipTiers.length) {
    const tiersHeader = document.createElement('div');
    tiersHeader.className = 'section__header sponsors-current__header';
    tiersHeader.innerHTML = `
      <h2>${sp_tr(sponsorsPageContent.packagesSectionTitle) || sp_ui('sponsors.packagesTitle', 'Diventa sponsor')}</h2>
      <p>${sp_tr(sponsorsPageContent.packagesSectionDescription) || sp_ui('sponsors.packagesDesc', 'Scegli il livello più adatto alla tua azienda e supporta la community XmasDev.')}</p>
    `;
    container.appendChild(tiersHeader);
    container.appendChild(buildSponsorshipPackSection(sponsorshipPack, sponsorshipTiers));
  }
}


function buildSponsorshipPackSection(pack, tiers) {
  const section = document.createElement('section');
  section.className = 'sponsor-pack';
  section.setAttribute('aria-label', 'Pacchetti sponsor');

  const header = document.createElement('div');
  header.className = 'section__header sponsor-pack__header';

  const title = document.createElement('h3');
  title.textContent = sp_tr(pack.title) || sp_ui('sponsors.packDefaultTitle', 'Pacchetti sponsor');
  header.appendChild(title);

  if (pack.subtitle) {
    const subtitle = document.createElement('p');
    subtitle.className = 'sponsor-pack__subtitle';
    subtitle.textContent = sp_tr(pack.subtitle);
    header.appendChild(subtitle);
  }

  if (pack.note) {
    const note = document.createElement('p');
    note.textContent = sp_tr(pack.note);
    header.appendChild(note);
  }

  section.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'sponsor-pack__grid';

  (tiers || []).forEach((tier) => {
    const card = document.createElement('article');
    const tierName = (tier?.name || '').toLowerCase();
    card.className = `sponsor-pack__card sponsor-pack__card--${tierName}`;

    const title = document.createElement('h3');
    title.textContent = tier?.name || '';
    card.appendChild(title);

    const price = document.createElement('p');
    price.className = 'sponsor-pack__price';
    price.textContent = sp_tr(tier?.price) || '';
    card.appendChild(price);

    const ul = document.createElement('ul');
    (tier?.benefits || []).forEach((benefit) => {
      const li = document.createElement('li');
      li.textContent = sp_tr(benefit);
      ul.appendChild(li);
    });
    card.appendChild(ul);

    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
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
function buildSponsorCard(sponsor, tierName) {
  const card = document.createElement('a');
  card.className = 'sponsor-card';
  card.href = sponsor.url || '#';
  card.target = '_blank';
  card.rel = 'noopener noreferrer';
  card.title = sponsor.name;
  card.setAttribute('aria-label', buildSponsorAriaLabel(sponsor.name, tierName));

  if (sponsor.logo) {
    const img = document.createElement('img');
    img.src = sponsor.logo;
    img.alt = sponsor.name;
    img.loading = 'lazy';
    card.appendChild(img);
  } else {
    const name = document.createElement('div');
    name.className = 'sponsor-card__name';
    name.textContent = sponsor.name;
    card.appendChild(name);
  }

  return card;
}

/* ---- Accessible label for a sponsor card ------------------- */
function buildSponsorAriaLabel(name, tierName) {
  const tierPart = tierName ? ` — ${sp_ui('sponsors.tierSuffix', 'sponsor')} ${tierName}` : '';
  return `${name}${tierPart} (${sp_ui('sponsors.newTab', 'si apre in una nuova scheda')})`;
}

/* ---- State helpers ----------------------------------------- */
function showLoading(container) {
  container.innerHTML = `
    <div class="state-loading">
      <div class="spinner"></div>
      <p>${sp_ui('sponsors.loading', 'Caricamento sponsor in corso…')}</p>
    </div>`;
}

function showError(container) {
  container.innerHTML = `
    <div class="state-error">
      <p>⚠️ ${sp_ui('sponsors.error', 'Impossibile caricare i dati degli sponsor.')}</p>
    </div>`;
}
