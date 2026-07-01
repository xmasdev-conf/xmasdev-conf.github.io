/* ============================================================
   XmasDev — agenda.js
   Fetches sessions from the Sessionize API and renders them.

   Configuration:
     Set SESSIONIZE_API_URL below to your event's Sessionize
     endpoint, e.g.:
       https://sessionize.com/api/v2/YOUR_EVENT_ID/view/All
   ============================================================ */

const SESSIONIZE_API_URL =
  'https://sessionize.com/api/v2/YOUR_EVENT_ID/view/All';

/* Track colour palette — cycles through these */
const TRACK_COLORS = [
  { bg: 'rgba(230,57,70,0.15)', text: '#ff6b74' },
  { bg: 'rgba(56,139,253,0.15)', text: '#79c0ff' },
  { bg: 'rgba(45,198,83,0.15)', text: '#56d364' },
  { bg: 'rgba(244,208,63,0.15)', text: '#f4d03f' },
  { bg: 'rgba(188,140,255,0.15)', text: '#d2a8ff' },
  { bg: 'rgba(255,166,0,0.15)', text: '#ffa600' },
];

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('agenda-container');
  if (!container) return;

  showLoading(container);

  try {
    const data = await fetchAgenda();
    renderAgenda(container, data);
  } catch (err) {
    console.error('Agenda fetch error:', err);
    showError(container, err.message);
  }
});

/* ---- Data fetching ----------------------------------------- */
async function fetchAgenda() {
  const res = await fetch(SESSIONIZE_API_URL);
  if (!res.ok) {
    throw new Error(`Could not load agenda (HTTP ${res.status}).`);
  }
  return res.json();
}

/* ---- Main render ------------------------------------------- */
function renderAgenda(container, data) {
  /*
   * Sessionize /view/All returns an array of "view" objects.
   * We look for the GridSmart or Sessions view.
   * Each view has:  { title, hasColumns, hasSessions, ... sessions|rooms }
   *
   * For a flat view (Sessions):  data[n].sessions  → array of sessions
   * For a grid view (GridSmart): data[n].rooms      → array of rooms
   *                              data[n].timeSlots  → array of time slots
   *
   * We handle both layouts gracefully.
   */

  // Build speaker lookup  {id → speaker}
  const speakers = buildSpeakerMap(data);
  // Build category/track lookup
  const trackColors = buildTrackColorMap(data);

  // Find a grid-style or sessions-style view
  const gridView = data.find((v) => v.hasColumns);
  const sessionsView = data.find((v) => v.hasSessions && !v.hasColumns);

  if (gridView) {
    renderGridView(container, gridView, speakers, trackColors);
  } else if (sessionsView) {
    renderFlatView(container, sessionsView.sessions, speakers, trackColors);
  } else {
    // Try to gather all sessions from every view
    const allSessions = data.flatMap((v) => v.sessions || []);
    if (allSessions.length) {
      renderFlatView(container, allSessions, speakers, trackColors);
    } else {
      showEmpty(container);
    }
  }
}

/* ---- Grid view (rooms × timeslots) ------------------------- */
function renderGridView(container, view, speakers, trackColors) {
  container.innerHTML = '';

  const rooms = view.rooms || [];
  if (!rooms.length) { showEmpty(container); return; }

  // Create a room tab per room
  const tabBar = createEl('div', 'agenda-tabs');
  const panels = createEl('div', '');

  rooms.forEach((room, idx) => {
    const tab = createEl('button', 'agenda-tab');
    tab.textContent = room.name;
    tab.dataset.idx = idx;
    if (idx === 0) tab.classList.add('active');

    const panel = createEl('div', 'agenda-grid');
    panel.id = `room-panel-${idx}`;
    panel.hidden = idx !== 0;

    // Render sessions in this room
    const sessions = room.sessions || [];
    const byTime = groupByStartTime(sessions);

    Object.entries(byTime).forEach(([time, group]) => {
      panel.appendChild(buildTimeslot(time, group, speakers, trackColors));
    });

    tab.addEventListener('click', () => {
      tabBar.querySelectorAll('.agenda-tab').forEach((t) => t.classList.remove('active'));
      panels.querySelectorAll('.agenda-grid').forEach((p) => { p.hidden = true; });
      tab.classList.add('active');
      panel.hidden = false;
    });

    tabBar.appendChild(tab);
    panels.appendChild(panel);
  });

  container.appendChild(tabBar);
  container.appendChild(panels);
}

/* ---- Flat view (list of sessions) -------------------------- */
function renderFlatView(container, sessions, speakers, trackColors) {
  container.innerHTML = '';

  if (!sessions.length) { showEmpty(container); return; }

  const grid = createEl('div', 'agenda-grid');
  const byTime = groupByStartTime(sessions);

  Object.entries(byTime).forEach(([time, group]) => {
    grid.appendChild(buildTimeslot(time, group, speakers, trackColors));
  });

  container.appendChild(grid);
}

/* ---- Build a single time-slot row -------------------------- */
function buildTimeslot(time, sessions, speakers, trackColors) {
  const row = createEl('div', 'timeslot');

  const timeEl = createEl('div', 'timeslot__time');
  timeEl.textContent = formatTime(time);

  const sessionList = createEl('div', 'timeslot__sessions');
  sessions.forEach((s) =>
    sessionList.appendChild(buildSessionCard(s, speakers, trackColors))
  );

  row.appendChild(timeEl);
  row.appendChild(sessionList);
  return row;
}

/* ---- Build a single session card --------------------------- */
function buildSessionCard(session, speakers, trackColors) {
  const isBreak = session.isServiceSession || session.isPlenumSession;
  const card = createEl('div', isBreak ? 'session-card session-card--break' : 'session-card');

  // Track badge
  if (session.categories && session.categories.length) {
    session.categories.forEach((cat) => {
      if (cat.categoryItems && cat.categoryItems.length) {
        const item = cat.categoryItems[0];
        const badge = createEl('span', 'session-card__track');
        const color = trackColors[item.id] || trackColors['default'];
        badge.style.background = color.bg;
        badge.style.color = color.text;
        badge.textContent = item.name;
        card.appendChild(badge);
      }
    });
  }

  const title = createEl('div', 'session-card__title');
  title.textContent = session.title;
  card.appendChild(title);

  if (session.description) {
    const desc = createEl('div', 'session-card__description');
    desc.textContent = session.description;
    card.appendChild(desc);
  }

  // Speakers
  if (session.speakers && session.speakers.length) {
    const speakersEl = createEl('div', 'session-card__speakers');
    session.speakers.forEach((ref) => {
      const sp = speakers[ref.id] || ref;
      const speakerEl = createEl('div', 'session-card__speaker');

      if (sp.profilePicture) {
        const img = createEl('img');
        img.src = sp.profilePicture;
        img.alt = sp.fullName || sp.name || '';
        img.width = 28;
        img.height = 28;
        img.loading = 'lazy';
        speakerEl.appendChild(img);
      }

      const name = createEl('span');
      name.textContent = sp.fullName || sp.name || '';
      speakerEl.appendChild(name);
      speakersEl.appendChild(speakerEl);
    });
    card.appendChild(speakersEl);
  }

  return card;
}

/* ---- Helpers ----------------------------------------------- */
function buildSpeakerMap(data) {
  const map = {};
  data.forEach((view) => {
    (view.speakers || []).forEach((sp) => {
      map[sp.id] = sp;
    });
  });
  return map;
}

function buildTrackColorMap(data) {
  const map = { default: TRACK_COLORS[0] };
  let colorIndex = 0;
  data.forEach((view) => {
    (view.categories || []).forEach((cat) => {
      (cat.items || []).forEach((item) => {
        if (!map[item.id]) {
          map[item.id] = TRACK_COLORS[colorIndex % TRACK_COLORS.length];
          colorIndex++;
        }
      });
    });
  });
  return map;
}

function groupByStartTime(sessions) {
  const map = {};
  sessions.forEach((s) => {
    const key = s.startsAt || '00:00';
    if (!map[key]) map[key] = [];
    map[key].push(s);
  });
  // Sort by time
  return Object.fromEntries(
    Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  );
}

function formatTime(isoOrTime) {
  if (!isoOrTime) return '';
  try {
    const d = new Date(isoOrTime);
    if (isNaN(d.getTime())) return isoOrTime;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoOrTime;
  }
}

function createEl(tag, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

/* ---- State helpers ----------------------------------------- */
function showLoading(container) {
  container.innerHTML = `
    <div class="state-loading">
      <div class="spinner"></div>
      <p>Loading agenda…</p>
    </div>`;
}

function showError(container, message) {
  container.innerHTML = `
    <div class="state-error">
      <p>⚠️ Could not load the agenda.</p>
      <p style="font-size:0.85rem;margin-top:0.5rem;">${escapeHtml(message)}</p>
    </div>`;
}

function showEmpty(container) {
  container.innerHTML = `
    <div class="state-empty">
      <p>🗓 The agenda will be published soon. Stay tuned!</p>
    </div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
