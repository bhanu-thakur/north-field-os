# NORTH OS — CHANGELOG

## [2026-07-02] - Mission 11: Judgment Layer I (Predictions & Kill Discipline)
- Predictions Engine: Added the ability to log predictions with a confidence slider on opportunities. Unresolved predictions surface in the Morning Briefing based on their resolve-by dates.
- Calibration & Lessons: Resolving a prediction correctly/incorrectly now updates the founder's overall Brier-style accuracy score. Incorrect predictions immediately force a post-mortem lesson extraction.
- Ruthless Kill Dates: AI now drafts 2 measurable exit conditions and a kill date upon opportunity spawn (with an inline edit dialog). Missed kill dates trigger prominent red warnings in the UI.
- Unified Post-Mortem: Archiving an opportunity now instantly pops up a 3-field post-mortem dialog (Cause, Predicted vs Actual, Key Lesson) replacing the old chained alert prompts.
## [2026-07-02] - Mission 10: Mobile Ergonomics
- Swipe Gestures: Implemented native, fluid `translateX` touch gestures for Opportunity rows. Swiping right advances the stage (green reveal), swiping left archives it to the graveyard (red reveal), with an immediate 5-second Undo toast bypassing blocking prompts.
- Bottom Sheet Layouts: Re-anchored Universal Capture and mobile menus as iOS-style bottom sheets with drag indicator pills.
- Floating Action Button (FAB): Injected a sticky Capture FAB on mobile viewports `env(safe-area-inset-bottom)` aware, ensuring capture is always reachable by thumb.
- Touch Targets & V4 Fixes: Expanded all actionable touch targets to minimum 48px footprint. Fixed hardcoded "V5" Engine labels back to the current "V4 Engine".
## [2026-07-02] - Mission 9: Voice + Share + Shortcut Capture
- Voice Dictation: Implemented `webkitSpeechRecognition` to allow hands-free logging with live interim result streaming and dynamic UI pulsing.
- Auto-Expanding Drafts: Universal Capture now dynamically expands up to 6 lines and continuously auto-saves drafts to IndexedDB to survive accidental closures.
- PWA System Integrations: Registered a `share_target` to receive shared text from OS apps, and added an app icon Shortcut to jump directly into the capture modal (`/?capture=1`).
## [2026-07-02] - Mission 8: Toasts, Loading, Undo
- Custom Non-Blocking Feedback: Developed `NF.UI.toast` (bottom-anchored, stacks max 2) as a global replacement for all 22 native `alert()` calls. The interface is now completely non-blocking.
- Optimistic Save & Undo: Universal Capture now saves immediately to IndexedDB and surfaces a "Captured" toast with a 5s "Undo" action. The AI processing continues seamlessly in the background.
- Skeleton States & Resilient Retries: All AI-populated surfaces (Prep Brief, Board Analysis, Diagnostics, and JIT Tutor) now display a shimmering skeleton card while awaiting the model. If the network drops or generation fails, an inline 'Retry' block appears in place.

## [2026-07-02] - Mission 7: Live Pattern Loop + Resilient JSON
- Bulletproof AI Parsing: Added `NF.AI.extractJSON` and `app.generateJSON` wrapper to handle all AI generation calls. It gracefully handles markdown fences, finds balanced braces, and returns parsed JSON.
- Retry Loop & Toasts: On JSON parse failure, the wrapper automatically retries once with explicit instructions to output valid JSON. On a second failure, a non-blocking toast informs the user.
- Live Pattern Engine Debounce: Passive notes logged via Universal Capture now trigger `runPatternEngine` in the background after an 8-second debounce, dynamically re-rendering the patterns container without a full page refresh.

## [2026-07-02] - Mission 6: One Scoring Truth + One Lifecycle
- Unified the Opportunity Lifecycle: Extracted the lifecycle into a single global array (`LIFECYCLE`), ensuring timeline visualization, filtering, and stage advancement logic are perfectly in sync.
- Consolidated Scoring Logic: Replaced hardcoded math with a unified `computeScore` function across all AI and fallback scoring paths.
- Replaced Magic with Determinism: Removed all `Math.random()` score generation in favor of a fixed fallback (all metrics at 5) when no API key is present.
- Improved Data Transparency: Fallback scores are now tagged with `score_source: 'fallback'` and visibly display an "est." tag in the UI until AI diagnostics overwrite them.

## [2026-07-02] - Mission 5: Dead Feature Resurrection
- Unlocked the Board: Added the "Convene Board" button to the Opportunity view, appropriately gated behind the presence of an API key.
- Upgraded the Business Creation Flow: The "Add Entity" modal now captures full context (Name, Industry, Contact Person, Phone, and Notes).
- Solidified the Relational Data Model: Opportunities now reliably carry a `business_id` when spawned manually from a Business Dossier or when auto-linked by the Pattern Engine during capture.
- Refined the Dossier UI: Replaced the static slice with a precise `business_id` filter and added a clean empty state for unlinked entities.

## [2026-07-02] - Mission 4: Service Worker Completeness
- Upgraded the Service Worker (`sw.js`) to cache newly introduced data and module files (`boardroom.js`, `journal.js`, `bibles.js`, `pipeline.js`).
- Implemented a "Network First, fallback to Cache" strategy for JavaScript application code (`app.js` and `modules/*.js`) to ensure updates ship immediately on reload without requiring a manual cache-version bump.
- Maintained a "Cache First" strategy for core assets (CSS, manifest, index) to ensure lightning-fast boot times, while actively updating the cache in the background.
- Bumped cache version to `v3`.

## [2026-07-02] - Mission 3: Export / Import Backup
- Built `NF.DB.exportAll()` to securely serialize all 7 IndexedDB stores into a versioned JSON blob and trigger a local download.
- Built `NF.DB.importAll()` to parse, validate, and non-destructively merge backup JSON files via ID-collision overwrites.
- Added a new Data Backup section to the Settings UI with an export button, relative time display for the last backup, and a file input for restoration.
- Implemented a proactive, dismissible warning banner on the Morning desk that alerts the founder if new observations have been logged since the last export and the backup is older than 7 days (or missing).

## [2026-07-02] - Mission 2: Typed AI Results + Token Budgets
- Upgraded the AI integration to use structured return objects \`{ok, text, error}\` for robust error handling.
- Implemented per-task token budgets to optimize API usage.
- Added intelligent retry logic for HTTP 429 (Rate Limited) errors to handle free-tier throttling gracefully.
- Updated all call sites to handle the new return object and show appropriate UI messages on failure.

## [2026-07-02] - Mission 1: Key Security
- Secured Gemini API key by moving it from the URL to the \`x-goog-api-key\` header.
- Safely parsed API responses, preventing app crashes on unexpected or malformed payloads.
- Masked the API key in the Settings UI, rendering a "Key saved ✓" badge instead of the plain text key.
- Prevented accidental deletion of the stored API key when saving settings with an empty input field.

## [V5.0.0] - The Active Copilot Upgrade
*North OS has evolved from a passive intelligence engine into an active, multi-disciplinary startup copilot. It now actively coaches you, builds tactical execution playbooks, and simulates an entire boardroom of executives.*

### 🏢 The Virtual Board of Directors
- **Four-Persona Executive Analysis**: You can now "Convene the Board" on any Opportunity. The AI splits into four distinct personas (CEO, CFO, CTO, CPO) to brutally analyze your deal from their respective domains (Vision, Economics, Feasibility, UX).
- **Homepage Directives**: Board Directives are dynamically injected directly into your Morning Briefing, contextualizing your daily "Next Physical Action" with multi-disciplinary strategic advice.

### 🎓 Interactive AI Tutor & Playbooks
- **Sidebar Tutor**: Added a slide-out, context-aware AI Tutor to the Opportunity page. It remembers your specific business constraints and provides conversational strategic advice without losing your context.
- **Strict Non-Technical Coaching**: The Tutor is strictly instructed to teach you *how to sell and operate* a business, outright refusing to act as a generic technical tutorial bot (e.g., teaching you *how to sell* video editing, not *how to edit* videos).
- **Aggressive Deal Assessor**: Universal Capture now instantly spawns a high-leverage Opportunity and auto-generates a tactical plan if it detects an explicit, immediate business deal in your raw logs, completely bypassing the slower Pattern clustering.
- **Model Upgrade**: Upgraded the core intelligence engine from `gemini-1.5-flash` to the highly-capable and free-tier optimized `gemini-2.5-flash-lite`.

## [V4.0.0] - The AI Intelligence Upgrade
*North is now a true intelligence engine, fully powered by the Gemini AI API running locally in your browser. It doesn't just store data; it analyzes, clusters, and coaches.*

### 🧠 Gemini API Integration (100% Free & Local)
- **Settings & AI Profile**: Added a secure `/settings` route to input and locally store a free-tier Google AI Studio API key (`IndexedDB`).
- **Private & Serverless**: All Gemini API calls (`fetch()`) are executed directly from the client to Google's servers. No backend. No data sent to third parties. 100% free under the consumer tier.

### 🔍 Cross-Domain Pattern Engine
- **Semantic Overlap**: Overhauled the local pattern clustering to detect semantic keyword overlap (e.g., "logistics", "supply chain") rather than random recency grouping.
- **Gemini Analogy Detection**: If an API key is present, the Pattern Engine actively scans your raw data for structural cross-domain analogies (e.g., identifying that a bottleneck in a restaurant is structurally identical to a bottleneck in a manufacturing plant) and names them dynamically.
- **Temporal Momentum**: Tracks velocity of patterns over time (e.g., "5 mentions in 3 weeks. Theme is accelerating").

### 🎓 Founder Coaching & Execution
- **Pre-Meeting Executive Brief**: Added a "Prep Brief" button to Business Dossiers. Click it to have Gemini instantly generate a ruthless 3-bullet execution plan based on that specific client's known problems, trust level, and next moves.
- **Just-in-Time Micro-Learning**: The Morning Briefing now reads your highest leverage "Spearhead Opportunity" and automatically asks Gemini to generate a highly tactical playbook to unblock your exact Next Physical Action.
- **Thin-Data Mode**: Mentor mode now actively detects if you have too little data (< 10 observations) and demands you gather more volume before attempting pattern recognition.

### 📈 UI & UX Refinements
- **The Discovery Feed**: Built a new top-level `/discovery` route as a chronological feed of raw field observations before they mutate into clustered patterns.
- **Explainable AI Scoring**: The Leverage, Velocity, and Conviction scores on the Opportunity Detail page now feature dynamic explanatory text grounded in your data.
- **Dynamic Capture Signals**: Universal Capture now scans for keywords on the fly and returns context-aware toasts (e.g., "3rd note about logistics — this is becoming a pattern").
- **Clean Sandbox Simulator**: The Simulator now runs on a completely isolated `NorthFieldOS_Demo` database. It safely spins up, demonstrates the core loop, and wipes itself without touching your real intelligence data.
- **Mobile Backdrop UX**: Fixed click-away closing logic on mobile dialogs.

## [V3.5.0] - The Intelligence Engine (Final Enhancement)
*The architecture is now permanently locked. North is a pure, invisible compounding engine tailored for high-leverage founder execution.*

### 🚀 Architecture & Global Capture
- **Founder Intel Array**: Injected a silent `founder_intel` object to track prediction accuracy and recent lessons over time.
- **Omnipresent Capture**: Universal Capture was ripped out of the sidebar. Pressing `/` globally triggers a frosted-glass drop-down to log thoughts without breaking visual context.
- **Background Engine**: `runPatternEngine` was moved to `requestIdleCallback` to completely unblock the UI thread on boot.

### 💼 The CEO's Desk (Home Screen Redesign)
- **Mentor Mode**: Dynamic top-level messaging analyzing your daily log frequency and focus depth.
- **The Spearhead**: Instantly surfaces the single highest-leverage Opportunity and its Next Physical Action.
- **Revenue Proximity**: Highlights high-velocity ventures that are in the Validation or First Sale stages.
- **Industry Bibles**: Emerging Patterns now act as thematic folders grouping your raw field intelligence.
- **Parallel Learning**: Randomly feeds an actionable mental model (e.g., "Negotiation Dynamics") for off-field study.

### 📈 Compounding Timeline & The Graveyard
- **Visual Compounding**: Replaced static steppers with a true timeline tracing ideas from raw *Observation* to mature *Business*.
- **The Graveyard Protocol**: Archiving an opportunity now enforces a ruthless post-mortem (*Reason, Prediction vs Actual, Core Lesson*), silently calibrating the Founder Intel array.

### 🕸️ The Intelligence Web (Business Dossiers)
- **4-Question Layout**: Dossiers explicitly answer: *Who are they? What do we know? What opportunities exist? What should I do next?*
- **Key Contacts**: Dossiers now track Key Contacts, Communication Styles, and Objections natively.
- **Crisp Aesthetic**: Audited CSS to ensure ultra-premium, high-contrast crispness (solid opaque cards, subtle borders, deep shadows) for maximum data readability.

### 🎮 Interactive Simulator & UX
- **Live-Fire Tour**: Added an interactive "Run Simulator" button that wipes the DB and programmatically guides the user through the Observe -> Pattern -> Opportunity -> Business compounding loop with live typing and UI navigation.
- **Mobile First**: Built a new frosted-glass bottom navigation bar (`.mobnav`) for instant thumb-reach navigation on mobile devices.
- **Universal UX**: Fixed the Universal Capture modal to properly close when tapping outside the bounds or clicking the explicit 'Close' button.

---

## [V4.0.0-alpha] - Pivot to The Spearhead OS

All notable changes to North Field OS will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [4.0.0] - 2026-07-01
### The Indispensable Engine (V4 Pivot)
Based on a ruthless product designer review, North was stripped of its "Management Software / CRM" bloat to focus entirely on compounding business opportunities and actionable intelligence.

**Build 1: Universal Capture & Observation Engine**
- Stripped away Discovery Mode forms and manual AI scoring buttons.
- Replaced with a single "What did you see?" text area (Universal Capture) which dumps into the new `observations` DB store.
- Eradicated all browser native dialogs (`alert()`, `prompt()`) and replaced them with a Unified Dialog System using custom Promises matching the Card Atlas aesthetic.

**Build 2: The Silent Pattern Engine**
- Introduced a background AI clustering loop (`app.runPatternEngine`).
- Silently groups unprocessed `observations` into new `patterns` without any user intervention.
- Emerging Patterns automatically surface on the Home Screen for review.

**Build 3: The Spearhead & Opportunity Map**
- The Home Screen (Morning Briefing) was redesigned to show only ONE thing: The Spearhead. Your single highest leverage Opportunity across the entire system.
- The flat "Pipeline" grid was killed and replaced by the indented **Opportunity Map**, which groups active ventures by lifecycle stage (Validation -> First Sale -> Delivery -> SOP -> Business).
- Opportunity Detail UI was drastically reduced. The 10-variable AI grid was gutted. Scoring is now based on exactly 3 variables: **Leverage, Velocity, and Conviction.**

**Build 4: The Business Dossier**
- The traditional CRM "Business Evidence" view was replaced by Intelligence Briefings.
- Split business detail screens into "The Reality" (Known Patterns / Problems) and "The Leverage" (Active Experiments / Next Physical Move).
- Killed the "Evening Review" and "Repeatable Assets" sections to eliminate chore-like features.

## [3.0.0] - 2026-06-30
### Added / Changed
- **Opportunity Engine Pivot:** Architecture redesigned exclusively around the `Opportunity` entity.
- **Card Atlas UI:** Restored elegant typography (Fraunces, JetBrains Mono, Inter) and glassmorphism.
- **Opportunity Execution Dashboard:** Granular tracking for Validation, First Sale, Delivery.

## [1.0.0] - 2026-06-30
### Added
- **The Board Room (v1.0):** Weekly Sunday Review AI Personas and Enterprise Dashboard.
- **Execution & Judgment (v0.4):** Opportunity Pipeline and Decision Journal modules.
- **The Compounding Engine (v0.3):** Live `ai.js` module for Google Gemini extraction, Settings view for API Keys, and Auto-Extract in Inbox.
- **The Graph & Bibles (v0.2):** Industry/People Bibles and Manual Tagging in Inbox.
- **The Field Recorder (v0.1):** Mission Console, Quick Capture FAB, Observation Inbox, Offline-first Service Worker, and Institutional Memory scaffolding.
