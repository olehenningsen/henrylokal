# Karner Lokal 🎵

**De steder du ikke finder på stiften.dk**

En kurateret guide til live musik events, hyggelige barer og spillesteder i Aarhus. Intime jazz-aftener, akustiske sets, open mic og skjulte barer med live musik.

## Kom i gang

```bash
npm install
npm start
```

Åbn [http://localhost:3334](http://localhost:3334) i din browser.

## Administration

Gå til ⚙️ i menuen og log ind med admin-adgangskoden.

## Tech stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla JS (ingen frameworks)
- **Data:** JSON-fil (`henrylokal-data.json`)
- **Design:** Dark mode med amber/guld accenter

## Funktioner

### Offentlig side
- Gennemse kommende events og spillesteder
- Filtrer på genre, kvarter og dato
- Event-kort med spillested, tidspunkt, genre, pris og beskrivelse
- Spillestedsprofiler med kommende events
- Dansk UI hele vejen igennem
- Mobil-responsivt design

### Admin
- Opret, rediger og slet spillesteder
- Opret, rediger og slet events
- Marker events som udvalgte
- Password-beskyttet adgang

## Miljøvariabler

Se `.env` for konfiguration:
- `SESSION_SECRET` — Session hemmelighed
- `ADMIN_PASSWORD_HASH` — Bcrypt-hash af admin password
- `PORT` — Server port (standard: 3334)

---

Lavet med ❤️ til Aarhus' undergrund
