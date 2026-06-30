# ARCHITECTURE

## Technology Stack
- **HTML5 & CSS3:** Semantic markup, CSS Custom Properties for theming.
- **JavaScript (ES6+):** Vanilla JS modules.
- **PWA Capabilities:** Service Worker (`sw.js`) and `manifest.webmanifest`.
- **Data Persistence:** `localStorage` (JSON-serialized string arrays/objects).

## System Design
- **Offline-First:** The app never blocks user input waiting for a network request. All observations are saved to `localStorage` immediately.
- **Hash-Based Routing:** Changes to `window.location.hash` trigger view re-renders (e.g., `#/mission` routes to the Mission Console).

## Data Model: The Observation
The atomic unit of North Field OS. Every meeting, idea, or event is captured as an observation first.
```json
{
  "id": "obs_12345",
  "timestamp": 169823901,
  "raw_text": "Met with Rajat from Hotel Alpine. Needs better WhatsApp booking flow.",
  "status": "inbox",
  "tags": ["hospitality", "automation"]
}
```

## AI Architecture
AI is handled via an asynchronous batch queue.
1. User logs Observation (Offline).
2. App detects network state (`navigator.onLine`).
3. If online, batch sends unprocessed observations to an LLM endpoint.
4. LLM returns structured JSON (Entities, Bible Updates, Hypotheses).
5. User approves changes in the Inbox.
