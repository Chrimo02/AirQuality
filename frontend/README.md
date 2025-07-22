
# Smart Home Frontend

React/Vite-Frontend zur **Darstellung von Luftqualitäts-Messdaten**, **Session-Verwaltung** und **Steuerung von Geräten** (Ventilator & Aroma-Diffusor).  
Es kann wahlweise mit **Mock-Daten** oder einem **echten Backend** laufen.

---

## Features
- Live- und historische Messdaten anzeigen
- Sessions starten/beenden und Daten exportieren
- Gerätesteuerung (Ventilator / Diffusor)
- Mock-Modus zum schnellen Ausprobieren ohne Backend

## Tech-Stack
- React + Vite
- Tailwind CSS
- Axios
- Jest & @testing-library/react (Komponenten-/Service-Tests)

---

## Voraussetzungen
- Node ≥ 18.18
- npm ≥ 9

---

## Schnellstart

```bash
# 1. Dependencies installieren
npm install

# 2. Dev-Server starten
npm run dev
# -> Im Terminal erscheint eine URL (http://localhost:5173 o.ä.) anklicken
