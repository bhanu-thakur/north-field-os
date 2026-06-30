# NORTH OS — CHANGELOG

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
