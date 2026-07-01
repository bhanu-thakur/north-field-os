# North OS — Handover Document (Next Steps)

**Welcome to the new system.** This document serves as the absolute source of truth for the AI assistant picking up this project. Read this entirely before touching any code.

## 1. Project Philosophy & Architecture
**North OS is an invisible, offline-first intelligence engine for high-leverage founders.**
- **Tech Stack:** STRICTLY Vanilla JavaScript, HTML, CSS. No React, no Vue, no bundlers, no build steps, no external remote databases (like Firebase or Supabase).
- **Data Layer:** 100% local `IndexedDB`. All data lives directly in the user's browser. It is fully offline capable. The database logic is completely abstracted inside `modules/db.js`.
- **UI Architecture:** Single Page Application (SPA) driven by a monolithic `app.js`. The state is controlled by `NF.State.context`. Routing simply swaps out the inner HTML of the main container. CSS is heavily hand-tuned for a premium, crisp, dark-mode-first aesthetic (see `css/`).

## 2. Current State (What we just built in V4)

We just completed **Phase 4.1** and **Phase 4.2**, migrating the app from a simple note-taking tool to a proactive AI intelligence engine. 

### The Gemini API Integration (Free & Local)
We did NOT use a backend server to add AI. Instead:
- We built a `/settings` route where the user pastes their free-tier Google AI Studio API Key.
- This key is stored securely in `IndexedDB`.
- `modules/db.js` exposes an `NF.AI.generateContent(prompt)` function that makes a direct client-side `fetch()` call to the Gemini REST API.
- Because it runs locally on the consumer's key, it costs $0 and requires no infrastructure.

### The Intelligence Features
- **Cross-Domain Pattern Engine:** When the user logs observations via Universal Capture (`/`), `app.runPatternEngine()` groups them. If the Gemini API is active, it actively scans for cross-domain analogies and names patterns dynamically. If not, it falls back to a custom local JS keyword-clustering algorithm.
- **Pre-Meeting Prep Brief:** On Business Dossiers, the user can click "Prep Brief" to have Gemini generate a 3-bullet execution plan based on that specific client's data.
- **Just-in-Time Micro-Learning:** The Morning Briefing dynamically grabs the "Next Physical Action" of the user's highest leverage opportunity and asks Gemini to generate a specific execution playbook for it.
- **Explainable Scores & Founder Intel:** AI Scores (Leverage, Velocity) are now grounded in data. We also track "Founder Intel" (Prediction Accuracy) based on wins vs. graveyard post-mortems.
- **The Discovery Feed:** A new `/discovery` route shows a chronological feed of raw observations.

## 3. What We Are Going To Do Next (Phase 4.3)

The immediate next steps for the project are to finish **Phase 4.3 (Hardware & Infrastructure)**:

- `[ ]` **Institutional Export/Backup:** Because all data lives in local `IndexedDB`, it is vulnerable to browser cache clears. We need a 1-click JSON Export/Restore button (likely in the new `/settings` view) to securely backup the entire IndexedDB graph to a local `.json` file, and restore it.
- `[ ]` **Voice Capture:** Integrate the Web Speech API (`webkitSpeechRecognition`) into the Universal Capture modal. The user should be able to hit a microphone icon and physically dictate observations into the system, which then get transcribed and saved as text.

## 4. Instructions for the Next AI Session
1. Do not overwrite the existing CSS or change the brutalist/crisp aesthetic.
2. Rely on `NF.DB` for all data transactions.
3. If implementing Phase 4.3 (Export/Backup), ensure the JSON backup encompasses all tables (`opportunities`, `businesses`, `observations`, `patterns`, `settings`) and properly drops/restores them to avoid ID collisions.
4. If implementing Voice Capture, handle browser permissions gracefully and fall back to keyboard input if unsupported.

**End of Line.** Proceed with execution.
