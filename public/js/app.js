// ============================================
// Henry Lokal — Frontend App
// ============================================

let currentPage = 'home';
let isAdmin = false;

const PRICE_LABELS = {
  free: 'Gratis',
  cheap: 'Billigt',
  moderate: 'Moderat',
  unknown: 'Ukendt'
};

const DANISH_DAYS = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
const DANISH_MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = DANISH_DAYS[d.getDay()];
  const date = d.getDate();
  const month = DANISH_MONTHS[d.getMonth()];
  return `${day} ${date}. ${month}`;
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()}. ${DANISH_MONTHS[d.getMonth()]}`;
}

// ---- Navigation ----
function navigate(page, data) {
  document.querySelectorAll('main').forEach(m => m.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  currentPage = page;

  switch (page) {
    case 'home':
      document.getElementById('page-home').classList.remove('hidden');
      document.getElementById('nav-events').classList.add('active');
      loadEvents();
      break;
    case 'venues':
      document.getElementById('page-venues').classList.remove('hidden');
      document.getElementById('nav-venues').classList.add('active');
      loadVenues();
      break;
    case 'venue-detail':
      document.getElementById('page-venue-detail').classList.remove('hidden');
      document.getElementById('nav-venues').classList.add('active');
      loadVenueDetail(data);
      break;
    case 'admin':
      document.getElementById('page-admin').classList.remove('hidden');
      document.getElementById('nav-admin').classList.add('active');
      loadAdmin();
      break;
  }

  window.scrollTo(0, 0);
}

// ---- Toast ----
function toast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = message;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ---- API helpers ----
async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return res.json();
}

// ============ EVENTS PAGE ============

async function loadEvents() {
  const musicFilter = document.getElementById('filter-music').value;
  const neighborhoodFilter = document.getElementById('filter-neighborhood').value;
  const dateFilter = document.getElementById('filter-date').value;

  let params = new URLSearchParams({ upcoming: 'true' });
  if (musicFilter) params.set('musicType', musicFilter);
  if (neighborhoodFilter && neighborhoodFilter !== 'all') params.set('neighborhood', neighborhoodFilter);
  if (dateFilter) params.set('date', dateFilter);

  const events = await api(`/api/events?${params}`);

  // Featured
  const featured = events.filter(e => e.featured);
  const featuredSection = document.getElementById('featured-section');
  const featuredContainer = document.getElementById('featured-events');

  if (featured.length > 0 && !musicFilter && !dateFilter && (!neighborhoodFilter || neighborhoodFilter === 'all')) {
    featuredSection.classList.remove('hidden');
    featuredContainer.innerHTML = featured.map(e => eventCardHTML(e)).join('');
  } else {
    featuredSection.classList.add('hidden');
  }

  // All events
  const eventsContainer = document.getElementById('events-list');
  const countEl = document.getElementById('event-count');
  countEl.textContent = `(${events.length})`;

  if (events.length === 0) {
    eventsContainer.innerHTML = `
      <div class="empty-state">
        <div class="icon">🎵</div>
        <p>Ingen events fundet. Prøv et andet filter!</p>
      </div>`;
  } else {
    eventsContainer.innerHTML = events.map(e => eventCardHTML(e)).join('');
  }
}

function eventCardHTML(event) {
  const v = event.venue;
  return `
    <div class="event-card ${event.featured ? 'featured' : ''}" onclick="navigate('venue-detail', '${event.venueId}')">
      ${event.featured ? '<div class="featured-badge">★ Udvalgt</div>' : ''}
      <div class="event-card-header">
        <div class="event-title">${esc(event.title)}</div>
        <span class="event-price price-${event.price}">${PRICE_LABELS[event.price] || event.price}</span>
      </div>
      <div class="event-meta">
        <span><span class="icon">📍</span> <span class="event-venue-name">${v ? esc(v.name) : 'Ukendt'}</span></span>
        <span><span class="icon">📅</span> ${formatDate(event.date)}</span>
        <span><span class="icon">🕐</span> ${esc(event.time)}</span>
        <span class="music-tag">${esc(event.musicType)}</span>
      </div>
      ${v ? `<div class="event-meta"><span><span class="icon">📌</span> ${esc(v.address)} · ${esc(v.neighborhood)}</span></div>` : ''}
      <div class="event-description">${esc(event.description)}</div>
    </div>`;
}

// ============ VENUES PAGE ============

async function loadVenues() {
  const venues = await api('/api/venues');
  const container = document.getElementById('venues-list');

  if (venues.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🍷</div><p>Ingen spillesteder endnu.</p></div>`;
  } else {
    container.innerHTML = venues.map(v => `
      <div class="venue-card" onclick="navigate('venue-detail', '${v.id}')">
        <div class="venue-name">${esc(v.name)}</div>
        <div class="venue-vibe">${esc(v.vibe)}</div>
        <div class="venue-address">📍 ${esc(v.address)} · ${esc(v.neighborhood)}</div>
        <div class="venue-description">${esc(v.description)}</div>
        <div class="venue-tags">${v.tags.map(t => `<span class="venue-tag">${esc(t)}</span>`).join('')}</div>
      </div>`).join('');
  }
}

// ============ VENUE DETAIL ============

async function loadVenueDetail(venueId) {
  const { venue, events } = await api(`/api/venues/${venueId}`);
  const container = document.getElementById('venue-detail-content');

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));

  container.innerHTML = `
    <a class="back-link" onclick="navigate('venues')">← Tilbage til spillesteder</a>
    <div class="venue-detail-header">
      <h1>${esc(venue.name)}</h1>
      <div class="vibe">${esc(venue.vibe)}</div>
      <div class="address">📍 ${esc(venue.address)} · ${esc(venue.neighborhood)}</div>
      <div class="description">${esc(venue.description)}</div>
      ${venue.website ? `<a href="${esc(venue.website)}" target="_blank" class="website-link">🌐 ${esc(venue.website)}</a>` : ''}
      <div class="venue-tags" style="margin-top:12px">${venue.tags.map(t => `<span class="venue-tag">${esc(t)}</span>`).join('')}</div>
    </div>

    <h2 class="section-title">Kommende events <span class="count">(${upcoming.length})</span></h2>
    ${upcoming.length === 0 ? '<div class="empty-state"><p>Ingen kommende events lige nu.</p></div>' :
      upcoming.map(e => `
        <div class="event-card ${e.featured ? 'featured' : ''}">
          ${e.featured ? '<div class="featured-badge">★ Udvalgt</div>' : ''}
          <div class="event-card-header">
            <div class="event-title">${esc(e.title)}</div>
            <span class="event-price price-${e.price}">${PRICE_LABELS[e.price] || e.price}</span>
          </div>
          <div class="event-meta">
            <span><span class="icon">📅</span> ${formatDate(e.date)}</span>
            <span><span class="icon">🕐</span> ${esc(e.time)}</span>
            <span class="music-tag">${esc(e.musicType)}</span>
          </div>
          <div class="event-description">${esc(e.description)}</div>
        </div>`).join('')}`;
}

// ============ ADMIN ============

async function loadAdmin() {
  const { admin } = await api('/api/auth-status');
  isAdmin = admin;

  const container = document.getElementById('admin-content');

  if (!admin) {
    container.innerHTML = `
      <div class="login-box">
        <h2>🔒 Admin</h2>
        <p>Log ind for at administrere spillesteder og events</p>
        <div class="form-group">
          <label for="admin-password">Adgangskode</label>
          <input type="password" id="admin-password" class="form-input" placeholder="Indtast adgangskode..." onkeydown="if(event.key==='Enter') doLogin()">
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="doLogin()">Log ind</button>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="admin-container">
      <div class="admin-header">
        <h2 class="section-title" style="border:none;margin:0;padding:0">⚙️ Administration</h2>
        <button class="btn btn-secondary btn-small" onclick="doLogout()">Log ud</button>
      </div>

      <div class="admin-tabs">
        <button class="admin-tab active" onclick="switchAdminTab('venues', this)">Spillesteder</button>
        <button class="admin-tab" onclick="switchAdminTab('events', this)">Events</button>
      </div>

      <div id="admin-tab-venues">
        <div style="margin-bottom:16px">
          <button class="btn btn-primary" onclick="openVenueModal()">+ Nyt spillested</button>
        </div>
        <div id="admin-venues-list"></div>
      </div>

      <div id="admin-tab-events" class="hidden">
        <div style="margin-bottom:16px">
          <button class="btn btn-primary" onclick="openEventModal()">+ Ny event</button>
        </div>
        <div id="admin-events-list"></div>
      </div>
    </div>`;

  loadAdminVenues();
  loadAdminEvents();
}

function switchAdminTab(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('admin-tab-venues').classList.toggle('hidden', tab !== 'venues');
  document.getElementById('admin-tab-events').classList.toggle('hidden', tab !== 'events');
}

async function doLogin() {
  const pw = document.getElementById('admin-password').value;
  const res = await api('/api/login', { method: 'POST', body: JSON.stringify({ password: pw }) });
  if (res.ok) {
    toast('Logget ind! 🎉');
    loadAdmin();
  } else {
    toast(res.error || 'Forkert adgangskode', 'error');
  }
}

async function doLogout() {
  await api('/api/logout', { method: 'POST' });
  isAdmin = false;
  toast('Logget ud');
  navigate('home');
}

async function loadAdminVenues() {
  const venues = await api('/api/venues');
  const container = document.getElementById('admin-venues-list');
  if (!container) return;
  container.innerHTML = venues.map(v => `
    <div class="admin-list-item">
      <div class="info">
        <h3>${esc(v.name)}</h3>
        <p>${esc(v.neighborhood)} · ${v.tags.join(', ')}</p>
      </div>
      <div class="actions">
        <button class="btn btn-secondary btn-small" onclick="openVenueModal('${v.id}')">Rediger</button>
        <button class="btn btn-danger btn-small" onclick="deleteVenue('${v.id}')">Slet</button>
      </div>
    </div>`).join('');
}

async function loadAdminEvents() {
  const events = await api('/api/events?upcoming=true');
  const container = document.getElementById('admin-events-list');
  if (!container) return;
  container.innerHTML = events.map(e => `
    <div class="admin-list-item">
      <div class="info">
        <h3>${esc(e.title)}</h3>
        <p>${e.venue ? esc(e.venue.name) : '?'} · ${formatDateShort(e.date)} kl. ${esc(e.time)} · ${esc(e.musicType)}</p>
      </div>
      <div class="actions">
        <button class="btn btn-secondary btn-small" onclick="openEventModal('${e.id}')">Rediger</button>
        <button class="btn btn-danger btn-small" onclick="deleteEvent('${e.id}')">Slet</button>
      </div>
    </div>`).join('');
}

// ---- Venue Modal ----
async function openVenueModal(id) {
  let venue = { name: '', address: '', neighborhood: '', description: '', vibe: '', website: '', tags: [] };
  if (id) {
    const { venue: v } = await api(`/api/venues/${id}`);
    venue = v;
  }

  const modal = document.getElementById('modal-container');
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <h2>${id ? 'Rediger spillested' : 'Nyt spillested'}</h2>
        <div class="form-group"><label>Navn</label><input class="form-input" id="m-v-name" value="${esc(venue.name)}"></div>
        <div class="form-group"><label>Adresse</label><input class="form-input" id="m-v-address" value="${esc(venue.address)}"></div>
        <div class="form-group"><label>Kvarter</label><input class="form-input" id="m-v-neighborhood" value="${esc(venue.neighborhood)}" placeholder="f.eks. Frederiksbjerg"></div>
        <div class="form-group"><label>Beskrivelse</label><textarea class="form-input" id="m-v-description">${esc(venue.description)}</textarea></div>
        <div class="form-group"><label>Vibe (1-3 ord)</label><input class="form-input" id="m-v-vibe" value="${esc(venue.vibe)}" placeholder="f.eks. Rå, intim, underjordisk"></div>
        <div class="form-group"><label>Website (valgfrit)</label><input class="form-input" id="m-v-website" value="${esc(venue.website || '')}"></div>
        <div class="form-group"><label>Tags (kommasepareret)</label><input class="form-input" id="m-v-tags" value="${venue.tags.join(', ')}" placeholder="jazz, rock, acoustic"></div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="closeModal()">Annuller</button>
          <button class="btn btn-primary" onclick="saveVenue('${id || ''}')">${id ? 'Gem ændringer' : 'Opret'}</button>
        </div>
      </div>
    </div>`;
}

async function saveVenue(id) {
  const body = {
    name: document.getElementById('m-v-name').value,
    address: document.getElementById('m-v-address').value,
    neighborhood: document.getElementById('m-v-neighborhood').value,
    description: document.getElementById('m-v-description').value,
    vibe: document.getElementById('m-v-vibe').value,
    website: document.getElementById('m-v-website').value,
    tags: document.getElementById('m-v-tags').value.split(',').map(t => t.trim()).filter(Boolean)
  };

  if (id) {
    await api(`/api/admin/venues/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    toast('Spillested opdateret ✅');
  } else {
    await api('/api/admin/venues', { method: 'POST', body: JSON.stringify(body) });
    toast('Spillested oprettet ✅');
  }
  closeModal();
  loadAdminVenues();
}

async function deleteVenue(id) {
  if (!confirm('Er du sikker? Alle events for dette spillested slettes også.')) return;
  await api(`/api/admin/venues/${id}`, { method: 'DELETE' });
  toast('Spillested slettet');
  loadAdminVenues();
  loadAdminEvents();
}

// ---- Event Modal ----
async function openEventModal(id) {
  const venues = await api('/api/venues');
  let event = { venueId: '', title: '', date: '', time: '', description: '', musicType: '', price: 'unknown', moreInfoUrl: '', featured: false };

  if (id) {
    const events = await api('/api/events');
    const found = events.find(e => e.id === id);
    if (found) event = found;
  }

  const modal = document.getElementById('modal-container');
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <h2>${id ? 'Rediger event' : 'Ny event'}</h2>
        <div class="form-group">
          <label>Spillested</label>
          <select class="form-select" id="m-e-venue">
            ${venues.map(v => `<option value="${v.id}" ${v.id === event.venueId ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Titel</label><input class="form-input" id="m-e-title" value="${esc(event.title)}"></div>
        <div class="form-group"><label>Dato</label><input type="date" class="form-input" id="m-e-date" value="${event.date}"></div>
        <div class="form-group"><label>Tidspunkt</label><input type="time" class="form-input" id="m-e-time" value="${event.time}"></div>
        <div class="form-group"><label>Beskrivelse</label><textarea class="form-input" id="m-e-description">${esc(event.description)}</textarea></div>
        <div class="form-group">
          <label>Musiktype</label>
          <select class="form-select" id="m-e-musicType">
            <option value="jazz" ${event.musicType === 'jazz' ? 'selected' : ''}>Jazz</option>
            <option value="acoustic" ${event.musicType === 'acoustic' ? 'selected' : ''}>Akustisk</option>
            <option value="rock" ${event.musicType === 'rock' ? 'selected' : ''}>Rock</option>
            <option value="folk" ${event.musicType === 'folk' ? 'selected' : ''}>Folk</option>
            <option value="experimental" ${event.musicType === 'experimental' ? 'selected' : ''}>Eksperimentel</option>
            <option value="open-mic" ${event.musicType === 'open-mic' ? 'selected' : ''}>Open Mic</option>
            <option value="singer-songwriter" ${event.musicType === 'singer-songwriter' ? 'selected' : ''}>Singer-songwriter</option>
            <option value="electronic" ${event.musicType === 'electronic' ? 'selected' : ''}>Elektronisk</option>
            <option value="punk" ${event.musicType === 'punk' ? 'selected' : ''}>Punk</option>
          </select>
        </div>
        <div class="form-group">
          <label>Pris</label>
          <select class="form-select" id="m-e-price">
            <option value="free" ${event.price === 'free' ? 'selected' : ''}>Gratis</option>
            <option value="cheap" ${event.price === 'cheap' ? 'selected' : ''}>Billigt</option>
            <option value="moderate" ${event.price === 'moderate' ? 'selected' : ''}>Moderat</option>
            <option value="unknown" ${event.price === 'unknown' ? 'selected' : ''}>Ukendt</option>
          </select>
        </div>
        <div class="form-group"><label>Mere info URL (valgfrit)</label><input class="form-input" id="m-e-url" value="${esc(event.moreInfoUrl || '')}"></div>
        <div class="form-group">
          <label class="form-checkbox"><input type="checkbox" id="m-e-featured" ${event.featured ? 'checked' : ''}> Udvalgt event</label>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="closeModal()">Annuller</button>
          <button class="btn btn-primary" onclick="saveEvent('${id || ''}')">${id ? 'Gem ændringer' : 'Opret'}</button>
        </div>
      </div>
    </div>`;
}

async function saveEvent(id) {
  const body = {
    venueId: document.getElementById('m-e-venue').value,
    title: document.getElementById('m-e-title').value,
    date: document.getElementById('m-e-date').value,
    time: document.getElementById('m-e-time').value,
    description: document.getElementById('m-e-description').value,
    musicType: document.getElementById('m-e-musicType').value,
    price: document.getElementById('m-e-price').value,
    moreInfoUrl: document.getElementById('m-e-url').value,
    featured: document.getElementById('m-e-featured').checked
  };

  if (id) {
    await api(`/api/admin/events/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    toast('Event opdateret ✅');
  } else {
    await api('/api/admin/events', { method: 'POST', body: JSON.stringify(body) });
    toast('Event oprettet ✅');
  }
  closeModal();
  loadAdminEvents();
}

async function deleteEvent(id) {
  if (!confirm('Er du sikker på du vil slette denne event?')) return;
  await api(`/api/admin/events/${id}`, { method: 'DELETE' });
  toast('Event slettet');
  loadAdminEvents();
}

// ---- Modal helpers ----
function closeModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('modal-container').innerHTML = '';
}

// ---- Escape HTML ----
function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ---- Init filters ----
async function initFilters() {
  const venues = await api('/api/venues');
  const neighborhoods = [...new Set(venues.map(v => v.neighborhood))].sort();
  const select = document.getElementById('filter-neighborhood');
  neighborhoods.forEach(n => {
    const opt = document.createElement('option');
    opt.value = n;
    opt.textContent = n;
    select.appendChild(opt);
  });

  // Date filter: next 30 days
  const dateSelect = document.getElementById('filter-date');
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const val = d.toISOString().slice(0, 10);
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = i === 0 ? `I dag (${formatDateShort(val)})` : formatDate(val);
    dateSelect.appendChild(opt);
  }
}

// ---- Boot ----
document.addEventListener('DOMContentLoaded', async () => {
  await initFilters();
  navigate('home');
});
