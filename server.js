require('dotenv/config') // inline dotenv loading
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3334;
const DATA_FILE = path.join(__dirname, 'henrylokal-data.json');

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

// --- Data helpers ---
function loadData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// --- Auth middleware ---
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: 'Ikke autoriseret' });
}

// ============ PUBLIC API ============

// GET /api/venues
app.get('/api/venues', (req, res) => {
  const data = loadData();
  res.json(data.venues);
});

// GET /api/venues/:id
app.get('/api/venues/:id', (req, res) => {
  const data = loadData();
  const venue = data.venues.find(v => v.id === req.params.id);
  if (!venue) return res.status(404).json({ error: 'Spillested ikke fundet' });
  const events = data.events.filter(e => e.venueId === venue.id);
  res.json({ venue, events });
});

// GET /api/events
app.get('/api/events', (req, res) => {
  const data = loadData();
  let events = data.events.map(e => {
    const venue = data.venues.find(v => v.id === e.venueId);
    return { ...e, venue };
  });

  // Filters
  if (req.query.date) {
    events = events.filter(e => e.date === req.query.date);
  }
  if (req.query.musicType) {
    events = events.filter(e => e.musicType === req.query.musicType);
  }
  if (req.query.neighborhood && req.query.neighborhood !== 'all') {
    events = events.filter(e => e.venue && e.venue.neighborhood === req.query.neighborhood);
  }
  if (req.query.upcoming === 'true') {
    const today = new Date().toISOString().slice(0, 10);
    events = events.filter(e => e.date >= today);
    events.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }
  if (req.query.featured === 'true') {
    events = events.filter(e => e.featured);
  }

  res.json(events);
});

// ============ AUTH ============

app.post('/api/login', async (req, res) => {
  const { password } = req.body;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return res.status(500).json({ error: 'Server konfigurationsfejl' });
  
  const match = await bcrypt.compare(password, hash);
  if (match) {
    req.session.admin = true;
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'Forkert adgangskode' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/api/auth-status', (req, res) => {
  res.json({ admin: !!(req.session && req.session.admin) });
});

// ============ ADMIN API ============

// Venues CRUD
app.post('/api/admin/venues', requireAdmin, (req, res) => {
  const data = loadData();
  const venue = { id: 'v' + uuidv4().slice(0, 8), ...req.body };
  data.venues.push(venue);
  saveData(data);
  res.json(venue);
});

app.put('/api/admin/venues/:id', requireAdmin, (req, res) => {
  const data = loadData();
  const idx = data.venues.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Ikke fundet' });
  data.venues[idx] = { ...data.venues[idx], ...req.body, id: req.params.id };
  saveData(data);
  res.json(data.venues[idx]);
});

app.delete('/api/admin/venues/:id', requireAdmin, (req, res) => {
  const data = loadData();
  data.venues = data.venues.filter(v => v.id !== req.params.id);
  data.events = data.events.filter(e => e.venueId !== req.params.id);
  saveData(data);
  res.json({ ok: true });
});

// Events CRUD
app.post('/api/admin/events', requireAdmin, (req, res) => {
  const data = loadData();
  const event = { id: 'e' + uuidv4().slice(0, 8), ...req.body };
  data.events.push(event);
  saveData(data);
  res.json(event);
});

app.put('/api/admin/events/:id', requireAdmin, (req, res) => {
  const data = loadData();
  const idx = data.events.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Ikke fundet' });
  data.events[idx] = { ...data.events[idx], ...req.body, id: req.params.id };
  saveData(data);
  res.json(data.events[idx]);
});

app.delete('/api/admin/events/:id', requireAdmin, (req, res) => {
  const data = loadData();
  data.events = data.events.filter(e => e.id !== req.params.id);
  saveData(data);
  res.json({ ok: true });
});

// ============ SPA fallback ============
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎵 Henry Lokal kører på http://localhost:${PORT}`);
});
