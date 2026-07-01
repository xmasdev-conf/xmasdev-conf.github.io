/* ============================================================
   XmasDev — agenda.js
   Fetches sessions from the Sessionize API and renders them.

   Configuration:
     Set SESSIONIZE_API_URL below to your event's Sessionize
     endpoint, e.g.:
       https://sessionize.com/api/v2/YOUR_EVENT_ID/view/All
   ============================================================ */

const LEGACY_SESSIONIZE_API_URL =
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
    const agendaContext = await resolveAgendaContext(container);
    applyAgendaSubtitle(agendaContext.editionData);

    if (agendaContext.unavailable) {
      showAgendaSoon(container);
      return;
    }

    const endpoint = agendaContext.endpoint;
    const data = await fetchAgenda(endpoint);
    renderAgenda(container, data);
  } catch (err) {
    console.error('Agenda fetch error:', err);
    showError(container, err.message);
  }
});

/* ---- Data fetching ----------------------------------------- */
async function fetchAgenda(sessionizeApiUrl) {
  const res = await fetch(sessionizeApiUrl);
  if (!res.ok) {
    throw new Error(`Could not load agenda (HTTP ${res.status}).`);
  }
  return res.json();
}

async function resolveAgendaContext(container) {
  const configUrl = container.dataset.agendaConfig || 'data/editions.json';
  const queryEdition = new URLSearchParams(window.location.search).get('edition');
  const requestedEdition = queryEdition || container.dataset.edition;

  const context = await loadEditionDataFromIndex(configUrl, requestedEdition);
  const settings = context?.editionData?.agenda;
  const enabled = settings?.enabled;
  const endpoint = (settings?.sessionizeApiUrl || '').trim();

  if (enabled === false) {
    return {
      unavailable: true,
      endpoint: '',
      editionData: context?.editionData || null,
      editionKey: context?.editionKey || null,
    };
  }

  if (endpoint) {
    return {
      unavailable: false,
      endpoint,
      editionData: context.editionData,
      editionKey: context.editionKey,
    };
  }

  return {
    unavailable: true,
    endpoint: '',
    editionData: context?.editionData || null,
    editionKey: context?.editionKey || null,
  };
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

    if (!configPath) {
      return {
        editionKey,
        editionData: editionIndexEntry,
        indexPayload: payload,
      };
    }

    const detailRes = await fetch(configPath);
    if (!detailRes.ok) {
      return {
        editionKey,
        editionData: editionIndexEntry,
        indexPayload: payload,
      };
    }

    const detailPayload = await detailRes.json();
    return {
      editionKey,
      editionData: { ...editionIndexEntry, ...detailPayload },
      indexPayload: payload,
    };
  } catch {
    return null;
  }
}

function applyAgendaSubtitle(editionData) {
  const subtitleEl = document.getElementById('agenda-subtitle');
  if (!subtitleEl) return;

  const configured = editionData?.agenda?.subtitle;
  if (configured && configured.trim()) {
    subtitleEl.textContent = configured.trim();
  }
}

/* ---- Main render ------------------------------------------- */
function renderAgenda(container, data) {
  const views = normalizeAgendaViews(data);

  if (!views.length) {
    showEmpty(container);
    return;
  }

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
  const speakers = buildSpeakerMap(views);
  // Build category/track lookup
  const trackColors = buildTrackColorMap(views);

  // Find a grid-style or sessions-style view
  const gridView = views.find((v) => v.hasColumns === true);
  const sessionsView = views.find((v) => (v.hasSessions || Array.isArray(v.sessions)) && !v.hasColumns);

  if (gridView) {
    renderGridView(container, gridView, speakers, trackColors);
  } else if (sessionsView) {
    renderFlatView(container, sessionsView.sessions, speakers, trackColors, sessionsView);
  } else {
    // Try to gather all sessions from every view
    const allSessions = views.flatMap((v) => v.sessions || []);
    if (allSessions.length) {
      renderFlatView(container, allSessions, speakers, trackColors, null);
    } else {
      showEmpty(container);
    }
  }
}

function normalizeAgendaViews(payload) {
  if (Array.isArray(payload)) return payload;

  if (!payload || typeof payload !== 'object') return [];

  if (Array.isArray(payload.views)) return payload.views;
  if (Array.isArray(payload.data)) return payload.data;

  const hasViewShape =
    Array.isArray(payload.sessions) ||
    Array.isArray(payload.rooms) ||
    payload.hasColumns === true ||
    payload.hasSessions === true;

  if (hasViewShape) {
    const hasRoomSessions = Array.isArray(payload.rooms)
      && payload.rooms.some((r) => Array.isArray(r?.sessions) && r.sessions.length > 0);
    const hasTimeSlots = Array.isArray(payload.timeSlots) && payload.timeSlots.length > 0;

    const inferred = {
      ...payload,
      hasColumns: payload.hasColumns ?? (hasTimeSlots || hasRoomSessions),
      hasSessions: payload.hasSessions ?? Array.isArray(payload.sessions),
    };
    return [inferred];
  }

  return [];
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
function renderFlatView(container, sessions, speakers, trackColors, view) {
  container.innerHTML = '';

  if (!sessions.length) { showEmpty(container); return; }

  const rooms = Array.isArray(view?.rooms) ? view.rooms : [];
  if (rooms.length > 1) {
    renderMultiTrackView(container, sessions, rooms, speakers, trackColors);
    return;
  }

  const grid = createEl('div', 'agenda-grid');
  const byTime = groupByStartTime(sessions);

  Object.entries(byTime).forEach(([time, group]) => {
    grid.appendChild(buildTimeslot(time, group, speakers, trackColors));
  });

  container.appendChild(grid);
}

function renderMultiTrackView(container, sessions, rooms, speakers, trackColors) {
  container.innerHTML = '';

  const tabs = createEl('div', 'agenda-tabs');
  const panel = createEl('div', 'agenda-grid');
  let selectedRoomId = null;

  const allTab = createEl('button', 'agenda-tab active');
  allTab.textContent = 'Tutte le track';
  tabs.appendChild(allTab);

  rooms.forEach((room) => {
    const tab = createEl('button', 'agenda-tab');
    tab.textContent = room.name;
    tabs.appendChild(tab);

    tab.addEventListener('click', () => {
      tabs.querySelectorAll('.agenda-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      selectedRoomId = room.id;
      renderSelectedTrack();
    });
  });

  allTab.addEventListener('click', () => {
    tabs.querySelectorAll('.agenda-tab').forEach((t) => t.classList.remove('active'));
    allTab.classList.add('active');
    selectedRoomId = null;
    renderSelectedTrack();
  });

  function renderSelectedTrack() {
    panel.innerHTML = '';

    if (!selectedRoomId) {
      const full = buildTracksGridPanel(sessions, rooms, speakers, trackColors);
      panel.appendChild(full);
      return;
    }

    const selectedRoom = rooms.find((r) => Number(r.id) === Number(selectedRoomId));
    const roomSessions = sessions.filter((s) => isSessionInRoom(s, selectedRoomId) || isGlobalServiceSession(s, rooms));
    const byTime = groupByStartTime(roomSessions);

    Object.entries(byTime).forEach(([time, group]) => {
      const ordered = sortSessionsByTrack(group, rooms);
      panel.appendChild(buildTimeslot(time, ordered, speakers, trackColors));
    });

    if (!Object.keys(byTime).length) {
      panel.innerHTML = '<p class="state-empty">Nessuna sessione disponibile per questa track.</p>';
    }
  }

  renderSelectedTrack();

  container.appendChild(tabs);
  container.appendChild(panel);
}

function buildTracksGridPanel(sessions, rooms, speakers, trackColors) {
  const panel = createEl('div', 'agenda-grid');
  panel.style.setProperty('--tracks-count', String(Math.max(rooms.length, 1)));

  const headerRow = createEl('div', 'timeslot timeslot--tracks-header');
  const timeSpacer = createEl('div', 'timeslot__time timeslot__time--spacer');
  timeSpacer.setAttribute('aria-hidden', 'true');

  const header = createEl('div', 'timeslot__sessions timeslot__sessions--tracks agenda-tracks-header');
  rooms.forEach((room) => {
    const cell = createEl('div', 'agenda-tracks-header__cell');
    cell.textContent = room.name;
    header.appendChild(cell);
  });

  headerRow.appendChild(timeSpacer);
  headerRow.appendChild(header);
  panel.appendChild(headerRow);

  const byTime = groupByStartTime(sessions);
  Object.entries(byTime).forEach(([time, group]) => {
    panel.appendChild(buildTimeslotTracks(time, group, rooms, speakers, trackColors));
  });

  if (!Object.keys(byTime).length) {
    panel.innerHTML = '<p class="state-empty">Nessuna sessione disponibile per questa edizione.</p>';
  }

  return panel;
}

function buildTimeslotTracks(time, sessions, rooms, speakers, trackColors) {
  const row = createEl('div', 'timeslot');

  const timeEl = createEl('div', 'timeslot__time');
  timeEl.textContent = formatTime(time);

  const matrix = createEl('div', 'timeslot__sessions timeslot__sessions--tracks');

  const globalService = sessions.filter((s) => isGlobalServiceSession(s, rooms));
  if (globalService.length) {
    const full = createEl('div', 'timeslot__track-col timeslot__track-col--full');
    globalService.forEach((s) => full.appendChild(buildSessionCard(s, speakers, trackColors)));
    matrix.appendChild(full);
  }

  rooms.forEach((room) => {
    const col = createEl('div', 'timeslot__track-col');
    const roomSessions = sessions.filter((s) => isSessionInRoom(s, room.id) && !isGlobalServiceSession(s, rooms));

    if (!roomSessions.length) {
      const empty = createEl('div', 'timeslot__track-empty');
      empty.textContent = '—';
      col.appendChild(empty);
    } else {
      roomSessions.forEach((s) => col.appendChild(buildSessionCard(s, speakers, trackColors)));
    }

    matrix.appendChild(col);
  });

  row.appendChild(timeEl);
  row.appendChild(matrix);
  return row;
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
  if (Array.isArray(session.categoryItems) && session.categoryItems.length) {
    const item = session.categoryItems[0];
    const badge = createEl('span', 'session-card__track');
    const color = trackColors[item.id] || trackColors['default'];
    badge.style.background = color.bg;
    badge.style.color = color.text;
    badge.textContent = item.name;
    card.appendChild(badge);
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
      const speakerId = typeof ref === 'string' ? ref : ref?.id;
      const sp = speakerId ? (speakers[speakerId] || ref) : ref;
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
      name.textContent = sp.fullName || sp.name || (typeof ref === 'string' ? ref : '');
      speakerEl.appendChild(name);
      speakersEl.appendChild(speakerEl);
    });
    card.appendChild(speakersEl);
  }

  return card;
}

/* ---- Helpers ----------------------------------------------- */
function buildSpeakerMap(data) {
  if (!Array.isArray(data)) return {};

  const map = {};
  data.forEach((view) => {
    (view.speakers || []).forEach((sp) => {
      map[sp.id] = sp;
    });
  });
  return map;
}

function buildTrackColorMap(data) {
  if (!Array.isArray(data)) return { default: TRACK_COLORS[0] };

  const map = { default: TRACK_COLORS[0] };
  let colorIndex = 0;
  data.forEach((view) => {
    (view.sessions || []).forEach((session) => {
      (session.categoryItems || []).forEach((item) => {
        if (item?.id && !map[item.id]) {
          map[item.id] = TRACK_COLORS[colorIndex % TRACK_COLORS.length];
          colorIndex++;
        }
      });
    });
  });
  return map;
}

function isSessionInRoom(session, roomId) {
  return Number(session?.roomId) === Number(roomId);
}

function isGlobalServiceSession(session, rooms) {
  if (!(session?.isServiceSession || session?.isPlenumSession)) return false;

  const hasKnownRoom = rooms.some((r) => isSessionInRoom(session, r.id));
  return !hasKnownRoom;
}

function sortSessionsByTrack(sessions, rooms) {
  const roomOrder = new Map(rooms.map((r, idx) => [Number(r.id), idx]));
  return [...sessions].sort((a, b) => {
    const aBreak = (a.isServiceSession || a.isPlenumSession) ? 0 : 1;
    const bBreak = (b.isServiceSession || b.isPlenumSession) ? 0 : 1;
    if (aBreak !== bBreak) return aBreak - bBreak;

    const aIdx = roomOrder.has(Number(a.roomId)) ? roomOrder.get(Number(a.roomId)) : Number.MAX_SAFE_INTEGER;
    const bIdx = roomOrder.has(Number(b.roomId)) ? roomOrder.get(Number(b.roomId)) : Number.MAX_SAFE_INTEGER;
    if (aIdx !== bIdx) return aIdx - bIdx;

    return (a.title || '').localeCompare(b.title || '');
  });
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

function showAgendaSoon(container) {
  container.innerHTML = `
    <div class="state-empty">
      <p>🗓 Agenda disponibile presto.</p>
    </div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
