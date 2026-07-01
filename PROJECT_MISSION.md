# NORTH OS — Project Mission & History

## 1. The Core Mission
**North OS is not a note-taking app. It is an invisible, offline-first intelligence engine for high-leverage founders.**

The goal of this system is to radically reduce the cognitive load of a founder operating in the field. When a founder hears a complaint, identifies a bottleneck, or spots an inefficiency, they need a system that captures it in seconds and automatically compounds it into a structured business opportunity.

### The 3 Core Philosophies
1. **The 30-Second Rule**: If it takes more than 30 seconds to capture an observation, the system has failed. Capture must be omnipresent (via the `/` hotkey), frictionless, and immediate.
2. **Absolute Privacy & Zero Infrastructure**: Founders deal with highly sensitive data. Therefore, North OS is built as a Progressive Web App (PWA) with a 100% local `IndexedDB` storage layer. There are no backend servers, no subscriptions, and no remote databases. All AI capabilities are powered by a client-side API key, making the app permanently free to operate.
3. **From Data to Intelligence**: Data alone is useless. North OS actively coaches the founder. It clusters random notes into patterns, scores opportunities objectively, and generates customized execution playbooks so the founder always knows their next highest-leverage move.

---

## 2. The Journey: What We Have Built

We have evolved North OS through several major architectural phases, culminating in the V4 AI Intelligence Engine.

### Phase 1 & 2: The Foundation (Data Structuring)
- **Vanilla JavaScript Architecture**: We committed to a pure Vanilla JS stack (no React, no bundlers) to maintain absolute control over performance and simplicity.
- **The Compounding Loop**: We established the core data flow: `Observations` -> `Patterns` -> `Opportunities` -> `Businesses`.
- **UI System**: Built a custom, CSS-driven SPA framework using `app.render()`. Designed a premium, dark-mode-first, crisp aesthetic with deep shadows and solid cards.

### Phase 3: The Intelligence Engine (Automation)
- **Universal Capture**: Implemented a global frosted-glass capture modal bound to the `/` key, allowing the founder to log intelligence without breaking their current workflow.
- **The Pattern Engine**: Wrote a background clustering algorithm to detect recurring keywords across raw observations and automatically spawn "Emerging Patterns."
- **The Founder Dashboard**: Redesigned the "Morning Briefing" to highlight the "Spearhead Opportunity" (the single highest-leverage move) and surface Graveyard Post-Mortems.

### Phase 4: The Active Copilot (V5)
We permanently transformed North OS from a passive database into a proactive coach by integrating the Gemini AI API directly into the client.

- **Serverless AI (`modules/db.js`)**: Implemented a secure Settings layer where the user drops a free-tier Google AI Studio key, allowing the browser to `fetch()` intelligence directly from Google at zero cost (powered by `gemini-2.5-flash-lite`).
- **Cross-Domain Analogy Detection**: Gemini scans raw observations to find structural analogies and names patterns dynamically.
- **Aggressive Deal Assessor**: Universal Capture instantly spawns a high-leverage Opportunity and auto-generates a tactical plan if it detects an explicit, immediate business deal in your raw logs, completely bypassing the slower Pattern clustering.
- **Interactive AI Tutor**: A slide-out, context-aware AI Tutor on the Opportunity page. It remembers your specific business constraints and provides conversational strategic advice without losing your context. It is strictly instructed to teach you *how to sell and operate* a business, refusing to act as a technical tutorial bot.
- **The Virtual Board of Directors**: You can "Convene the Board" on any Opportunity. The AI splits into four distinct personas (CEO, CFO, CTO, CPO) to brutally analyze your deal from their respective domains. Their directives inject straight into your daily Morning Briefing.
- **AI Auto-Scoring & Prep Briefs**: Gemini ruthlessly evaluates evidence to score Leverage/Velocity/Conviction, and generates concise 3-bullet execution strategies based on known client problems.

---

## 3. The Future (Phase 5+)
While the core intelligence architecture is permanently locked, future enhancements will focus strictly on frictionless data mobility and advanced edge-capture:
- **Data Mobility**: Cross-device syncing using decentralized stores (e.g., Gun.js or WebRTC).
- **Voice-to-Execution**: Direct voice transcription API integration to log observations hands-free.

*North OS remains a pure, invisible compounding engine tailored for high-leverage execution.*
