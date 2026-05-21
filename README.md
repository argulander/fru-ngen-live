# Fruängen Live Dashboard

Light, minimalist live dashboard for a Stockholm/Fruängen commuter.

## Kort

- **Tunnelbana linje 14** — Fruängen → T-Centralen (SL Transport API, live)
- **Buss 173** — Fruängsgården → Fruängen (SL Transport API, live)
- **Bil** — Hasselstigen 6 → Lindhagensgatan 100 (Google Routes om nyckel finns, annars OSRM utan live-trafik)
- **Väder** — Open-Meteo för Fruängen

## Miljövariabler

Hanteras som secret i Lovable Cloud edge functions:

| Namn | Krävs | Beskrivning |
|---|---|---|
| `GOOGLE_ROUTES_API_KEY` | Nej | Google Cloud API-nyckel med tillgång till **Routes API**. Saknas den används OSRM som fallback och kortet visar "OSRM fallback / utan live-trafik". |

Lägg till nyckeln via Lovable Cloud → Settings → Edge Function Secrets. Den exponeras aldrig i klienten.

## Datakällor

- SL Transport API: `https://transport.integration.sl.se/v1/sites/{id}/departures` (proxat via edge function `sl-departures` för att slippa CORS-problem)
- Open-Meteo: anropas direkt från klienten (CORS-vänlig, ingen nyckel)
- Google Routes API + OSRM (`router.project-osrm.org`): via edge function `car-route`

## Uppdateringsintervall

- Kollektivtrafik: var 30:e sekund
- Bil: var 60:e sekund
- Väder: var 10:e minut

Alla kort visar laddnings-, tom- och fel-tillstånd inline – sidan blir aldrig blank.
