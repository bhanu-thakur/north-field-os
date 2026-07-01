# North Field OS
> The Founder's Field Operating System

## Purpose
North Field OS is a mobile-first, offline-first Progressive Web App (PWA) designed for founders building regional business empires. It exists to reduce the friction between observing reality and taking action.

## Philosophy
- **The 30-Second Rule:** Everything must be executable standing outside a hotel in under 30 seconds.
- **Offline-First Data, Serverless AI:** The real world does not always have Wi-Fi. All data is local-first (`IndexedDB`). AI is executed securely via a client-side API key stored locally (Gemini 2.5 Flash Lite).
- **Vanilla Web:** No bundlers. No frameworks. Open `index.html` and it works.

## Key Features (V5)
- **Universal Capture:** Hit `/` anywhere to log raw observations.
- **Aggressive Deal Assessor:** Auto-detects immediate high-value opportunities and auto-generates tactical action plans.
- **Background Pattern Engine:** Semantic clustering of slow-burn notes into Industry Bibles.
- **The Virtual Board of Directors:** AI personas (CEO, CFO, CTO, CPO) brutally analyze your opportunities.
- **Interactive AI Tutor:** Strict, context-aware business coaching without technical noise.

## Installation & Development
1. Clone the repository.
2. Open `index.html` in your browser (or use a local static server like `npx serve` or Live Server).
3. Install on your mobile device by selecting "Add to Home Screen" (requires HTTPS if deployed).

## Folder Structure
```text
/
├── index.html         # Shell & Icons
├── app.js             # Router & Engine
├── sw.js              # Service Worker
├── manifest.webmanifest # PWA configuration
├── css/               # Vanilla CSS variables & styles
├── modules/           # UI Components & App Logic
└── data/              # Local data models
```
