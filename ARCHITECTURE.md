# ARCHITECTURE

## Technology Stack
- **HTML5 & CSS3:** Semantic markup, CSS Custom Properties for theming.
- **JavaScript (ES6+):** Vanilla JS modules (no bundlers, no frameworks).
- **PWA Capabilities:** Service Worker (`sw.js`) and `manifest.webmanifest`.
- **Data Persistence:** `IndexedDB` (using localforage-like wrapper in `db.js`).

## System Design
- **Offline-First:** The app never blocks user input waiting for a network request. All observations are saved to `IndexedDB` immediately.
- **Hash-Based Routing:** Changes to `window.location.hash` trigger view re-renders (e.g., `#/mission` routes to the Mission Console).
- **Zero Infrastructure:** There is no backend server. The app communicates directly with the Google Gemini API client-side.

## Data Model: The Observation
The atomic unit of North OS. Every meeting, idea, or event is captured as an observation first.
```json
{
  "id": "obs_12345",
  "text": "Met with Rajat from Hotel Alpine. Needs better WhatsApp booking flow.",
  "created_at": 169823901,
  "processed": false
}
```

## AI Architecture
AI is executed securely via a client-side API key stored locally.
1. **Universal Capture (Aggressive Deal Assessor):** When a user logs a note, it bypasses clustering if it detects a high-leverage immediate deal, spawning an Opportunity instantly.
2. **Background Pattern Engine:** For passive notes, `requestIdleCallback` periodically scans unprocessed observations, clustering them into "Emerging Patterns" via semantic overlap.
3. **The Virtual Board of Directors:** AI personas (CEO, CFO, CTO, CPO) evaluate opportunities and provide strategic input distributed across the execution dashboard.
4. **Interactive Tutor:** A context-aware chatbot on the Opportunity page that provides strict non-technical coaching for founders.
