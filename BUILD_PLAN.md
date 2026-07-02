# North OS — BUILD_PLAN.md (Agent Execution Playbook)

> **Audience: an AI coding agent (Antigravity) and the founder supervising it.**
> This document translates `MASTER_ROADMAP.md` (162 items) into sequenced, executable **missions**. Each mission is self-contained: goal → files → steps → acceptance tests → done-when. Execute missions in order. Do not skip ahead. Do not merge missions.
>
> **Founder's job per mission:** paste the mission prompt (bottom of this file), review the diff, run the acceptance tests, commit. Nothing more.

---

## AGENT OPERATING PROTOCOL (read before every mission — non-negotiable)

1. **Read first, always:** `AI_CONTEXT.md`, `CODING_GUIDELINES.md`, `next.md`, and this file's current mission. Then read every file the mission lists BEFORE writing code.
2. **Stack law:** Vanilla JS (ES6+), HTML, CSS only. No frameworks, no bundlers, no npm, no build step, no backend, no external DBs. All data via `NF.DB`. All AI via `NF.AI.generateContent`.
3. **Scope law:** implement ONLY the items in the current mission. If you notice an unrelated bug, write it to a `FOUND_ISSUES.md` list — do not fix it.
4. **Aesthetic law:** do not restyle existing components. New UI must use existing tokens in `css/design-system.css`. Add tokens; never rewrite them.
5. **Data law:** never write a migration that deletes a store or field containing user data. Migrations are additive. If a destructive change seems required, STOP and output a question for the founder instead of code.
6. **Offline law:** every feature must degrade gracefully with (a) no network and (b) no API key. State the fallback behavior in your plan before coding.
7. **Verification law:** before declaring a mission done, run every acceptance test in the mission and report pass/fail for each, one line per test. If any fail, fix before reporting.
8. **Commit law:** one mission = one commit. Message format: `Mission N: <name> (items #x–#y)`. Append a dated entry to `CHANGELOG.md` and tick the mission's checkbox in this file.
9. **Stop conditions:** STOP and ask the founder if — a mission requires >600 new lines; you must modify `onupgradeneeded`; you must change the data shape of an existing store; or two acceptance tests conflict.

---

## MISSION LADDER (tick as completed)

### ☑ MISSION 1 — Key Security (items #1–3)
**Goal:** the Gemini key never appears in a URL or in rendered HTML; AI responses can't throw on odd payloads.
**Files:** `modules/db.js`, `app.js` (renderSettings ~line 646, saveSettings ~line 730).
**Steps:**
1. In `NF.AI.generateContent`: remove `?key=${apiKey}` from the fetch URL. Add header `'x-goog-api-key': apiKey`.
2. Replace `data.candidates[0].content.parts[0].text` with optional chaining: `data?.candidates?.[0]?.content?.parts?.[0]?.text`. If undefined, return `null` and `console.error` the full `data` object (includes safety-block info).
3. In `renderSettings`: render the key input with `value=""` always. If a key exists in settings, show a static badge next to the field: `Key saved ✓ (ends …${last4})`. On save: only overwrite the stored key if the input is non-empty.
**Acceptance tests:**
- [ ] DevTools Network tab: the request URL to `generativelanguage.googleapis.com` contains no `key=` param; the header carries it.
- [ ] View-source of the Settings page after saving a key: the key string appears nowhere in the DOM.
- [ ] Saving Settings with an empty key field does NOT erase an existing key.
- [ ] Simulate a response `{candidates:[]}`: app shows no crash, logs the payload.

### ☑ MISSION 2 — Typed AI Results + Token Budgets (items #16, #17, #99)
**Goal:** every AI caller can distinguish failure modes; long JSON never truncates; free-tier throttling is survivable.
**Files:** `modules/db.js`, every `NF.AI.generateContent` call site in `app.js` (16 sites — grep them).
**Steps:**
1. Change `generateContent` to return `{ok:boolean, text:string|null, error:'no_key'|'network'|'http_'+status|'empty_candidate'|null}`. Keep a legacy shim for one mission cycle: if callers use the old string form, `result.text` covers them — update all 16 call sites to the new shape in this mission anyway.
2. Add per-task token budgets: accept `opts.taskClass` ∈ {`capture`(300), `cluster`(2000), `board`(1500), `chat`(600), `brief`(800)}; map to `maxOutputTokens` unless explicitly overridden. Update call sites to pass a taskClass.
3. On HTTP 429: retry once after `2000ms + random(0–1000)ms`. If still 429, return `error:'rate_limited'`.
**Acceptance tests:**
- [ ] Wrong API key → callers receive `error:'http_400'`-family, and each UI surface shows a message (not silence).
- [ ] Pattern engine prompt with 20 observations returns unclipped JSON (verify closing bracket present).
- [ ] All 16 call sites compile against the new shape (grep confirms zero remaining bare-string usages).

### ☑ MISSION 3 — Export / Import Backup (items #6, #7)
**Goal:** the founder's entire graph survives a browser wipe.
**Files:** `modules/db.js` (add `exportAll`/`importAll`), `app.js` (Settings section).
**Steps:**
1. `NF.DB.exportAll()`: read all 7 stores → `{version: DB_VERSION, exported_at, stores: {name: rows[]}}` → trigger download as `north-backup-YYYY-MM-DD.json` via Blob + anchor click.
2. `NF.DB.importAll(json)`: validate shape; for each store, `put` every row (put overwrites on id-collision — that is the desired merge behavior); reject files whose `version` > current with a clear message.
3. Settings UI: "Export backup" button, "Import backup" file input, and a line showing `Last export: <relative time>` (store timestamp in settings).
4. Desk banner: if observations count grew since last export AND last export > 7 days (or never), render a dismissible one-line banner linking to Settings.
**Acceptance tests:**
- [ ] Export → clear site data → import → all observations, patterns, opportunities, businesses, settings (except the banner-dismiss flag) are intact.
- [ ] Importing the same file twice creates zero duplicates.
- [ ] Corrupt/truncated JSON shows an error toast; DB untouched.

### ☑ MISSION 4 — Service Worker Completeness (item #5)
**Goal:** true offline boot; updates ship without manual cache bumps.
**Files:** `sw.js`.
**Steps:**
1. Add to `ASSETS`: `./modules/boardroom.js`, `./data/journal.js`, `./data/bibles.js`, `./data/pipeline.js`, `./sw.js` excluded (never cache the SW itself).
2. Fetch strategy: for `app.js` and `modules/*.js` use network-first-fallback-cache (fresh code when online, cached when not); keep cache-first for CSS/manifest/index.
3. Bump `CACHE_NAME` to `v3`.
**Acceptance tests:**
- [ ] DevTools offline mode, hard reload: app boots fully, all views render, capture saves.
- [ ] Deploy a trivial `app.js` change: online reload picks it up without a cache-name change.

### ☑ MISSION 5 — Dead Feature Resurrection (items #9, #10, #11)
**Goal:** the Board is reachable, icons render, businesses can be created and truthfully linked.
**Files:** `index.html` (SVG sprite), `app.js` (renderOpportunity ~409, renderBusinesses ~537, renderBusinessDetail ~566, spawn/capture link points).
**Steps:**
1. Add `<symbol>` defs for `i-spark`, `i-cross`, `i-users` (24×24, stroke style matching existing icons).
2. In `renderOpportunity`, next to the Tutor button: `Convene Board` button (id `btn-convene-board`) → `app.runBoardAnalysis(oppId)`; gated on API key with a tooltip when keyless.
3. Businesses view: "Add Business" button → bottom-anchored form (name, industry, contact person, phone, notes) → `NF.DB.put('businesses', …)`.
4. Add `business_id` to opportunities: set it when spawned from a business context or when capture auto-links. In `renderBusinessDetail`, replace `opps.slice(0,2)` with `opps.filter(o => o.business_id === biz.id)`; empty state: "No opportunities linked yet."
**Acceptance tests:**
- [ ] Board runs from the Opportunity page and its directives appear on the Morning Briefing spearhead card.
- [ ] No blank icon boxes anywhere (visual sweep of capture modal, patterns, tutor, diagnostics).
- [ ] A business created via the form appears in Dossiers; an opportunity spawned from it shows under it; unrelated opportunities do not.

### ☑ MISSION 6 — One Scoring Truth + One Lifecycle (items #12, #13)
**Goal:** every score means the same thing; every stage list is the same list.
**Files:** `app.js` (spawnHypothesis, runAIDiagnostics ~875, advanceStage, renderOpportunity timeline, renderPipeline grouping).
**Steps:**
1. Extract `computeScore(vars)` = `leverage*0.5 + velocity*0.3 + conviction*0.2` as the single function. `runAIDiagnostics` and `spawnHypothesis` both use it.
2. In `spawnHypothesis`: if API key present → run the diagnostics scoring path; else deterministic fallback (leverage/velocity/conviction all 5, score computed, `score_source:'fallback'`). Delete all `Math.random()` score minting.
3. Persist `score_source: 'ai'|'fallback'` and render a small "est." tag on fallback scores.
4. Define `const LIFECYCLE = ['Validation','First Sale','Delivery','SOP','Operator','Automation','Software']` once; timeline, advanceStage, filters, and "closest to revenue" all read from it.
**Acceptance tests:**
- [ ] Grep: zero `Math.random` in any scoring path.
- [ ] A keyless spawn shows score with "est." tag; running diagnostics later replaces it and the tag disappears.
- [ ] Timeline stages and advanceStage sequence are identical strings from one array.

### ☑ MISSION 7 — Live Pattern Loop + Resilient JSON (items #14, #15)
**Goal:** patterns emerge in-session; malformed model output never kills a feature silently.
**Files:** `app.js` (captureObservation ~1144, runPatternEngine ~760, all 6 `JSON.parse` sites), `modules/db.js` optional helper.
**Steps:**
1. Write `NF.AI.extractJSON(text)`: strip fences → find first balanced `[`…`]` or `{`…`}` → parse → on failure return null. All 6 parse sites use it.
2. Callers of extractJSON: on null, retry the generation once with the suffix "Return ONLY valid JSON. No prose."; on second failure, toast "AI returned an unreadable answer — tap to retry" (non-blocking).
3. After each passive capture: `clearTimeout/setTimeout` debounce (8s) → `runPatternEngine()` → re-render only `#emerging-patterns-container` if mounted.
**Acceptance tests:**
- [ ] Log 3 related notes in one session without reload → a pattern appears within ~10s of the last note.
- [ ] Feed a mocked response with prose around JSON → parses fine. Feed pure prose → retry fires → toast appears; console shows both attempts.

### ☑ MISSION 8 — Toasts, Loading, Undo (items #105, #113, #139, #141, #136)
**Goal:** replace every `alert()` with a single non-blocking feedback system; every AI wait is visible.
**Files:** `app.js`, `css/design-system.css` (additive tokens only), `index.html` (toast root).
**Steps:**
1. Build `NF.UI.toast(msg, {action:{label, fn}, duration=4000})` — bottom-anchored, stacking max 2, swipe/tap to dismiss. Replace all `alert()` calls.
2. Capture save: optimistic — save first, toast "Captured · Undo" (Undo deletes the observation within 5s).
3. Skeleton component: a shimmering card matching the standard card layout; every AI-populated surface (JIT lesson, prep brief, board, diagnostics) shows it while awaiting; failed calls render an inline "Retry" block in place.
**Acceptance tests:**
- [ ] Grep: zero `alert(` remaining.
- [ ] Undo within 5s removes the observation from DB (verify count).
- [ ] Kill the network mid-board-analysis: skeleton → inline retry block, no dead UI.

### ☑ MISSION 9 — Voice + Share + Shortcut Capture (items #19, #22, #29, #114, #117, #120)
**Goal:** the 30-Second Rule at full strength.
**Files:** `app.js` (capture modal), `manifest.webmanifest`, `sw.js` (share handling), `css` additive.
**Steps:**
1. Mic button in capture: `webkitSpeechRecognition`, `lang:'en-IN'`, interim results streamed into the textarea; simple CSS amplitude bars while listening; hide button when API unsupported.
2. Textarea auto-expands (`scrollHeight`) up to 6 lines; capture draft saved to settings on every input event, restored on modal open, cleared on successful save.
3. Manifest: `shortcuts: [{name:'Capture', url:'./#/capture'}]` and `share_target` (GET, text/url params) → route handler pre-fills the capture modal.
**Acceptance tests:**
- [ ] Dictate a sentence on Android Chrome → text lands in the field, saves as a normal observation.
- [ ] Close the modal mid-sentence, reopen → text restored.
- [ ] Share a WhatsApp message to the installed PWA → capture modal opens pre-filled.

### ☑ MISSION 10 — Mobile Ergonomics (items #110, #128, #152, #153, #154, #155)
**Goal:** thumb-first field usage.
**Files:** `app.js` (nav, list renders), `css` additive, `index.html`.
**Steps:** Capture FAB bottom-right on all mobile views; convert capture + filters to draggable bottom sheets on <768px; add `env(safe-area-inset-bottom)` padding to nav/FAB; audit all touch targets to ≥48px (pad, don't resize icons); add More item to bottom nav exposing Discovery + Settings; implement swipe-right-to-advance / swipe-left-to-archive on opportunity rows with colored reveal + undo toast; fix "V3 Engine" labels to current version.
**Acceptance tests:** [ ] Everything on the Desk reachable one-handed on a 6.1" viewport · [ ] swipe-archive then Undo restores · [ ] no control hidden behind the gesture bar.

### ☑ MISSION 11 — Judgment Layer I: Predictions & Kill Discipline (items #48, #54, #55, #57)
**Goal:** calibration becomes real; ruthlessness becomes software.
**Files:** `app.js`, `modules/db.js` (additive fields only: `opp.predictions[]`, `opp.exit_deadline`).
**Steps:**
1. On spawn: AI drafts 2 measurable exit conditions + a resolve-by date (taskClass `brief`); founder edits inline before save.
2. "Log a prediction" on the Opportunity page: statement + confidence slider (50–99%) + resolve-by date → `opp.predictions[]`.
3. Morning Briefing: "Predictions due" block; resolving (Right/Wrong) updates `founder_intel.prediction_accuracy` as a running Brier-style average and appends to `recent_lessons` on Wrong.
4. If `exit_deadline` passed and status Active: red banner on the opportunity + Desk line "1 deal past its kill date."
5. Archiving opens a 3-field post-mortem (cause / predicted-vs-actual / lesson) — skippable but the skip is recorded.
**Acceptance tests:** [x] accuracy moves correctly after 1 right + 1 wrong resolution · [x] past-deadline Active deal shows both banners · [x] archive writes the post-mortem to the record.

### ☑ MISSION 12 — Judgment Layer II: Adversarial AI (items #50, #51, #52, #53, #56)
**Goal:** the Board argues instead of agreeing.
**Files:** `app.js` (board + spawn prompts).
**Steps:** Red-team button (strongest case against + cheapest falsifying test, taskClass `board`); Board prompt rewritten as sequential debate (CEO for → CFO against, citing the opportunity's own numbers → CTO feasibility → CPO verdict); Board must include one base-rate sentence for the category; new-opportunity screening injects `founder_intel.biases` into the prompt and renders any flag as a yellow strip on the card; pre-mortem button ("it failed — why?") whose output saves to the opportunity.
**Acceptance tests:** [x] Board output contains explicit disagreement and a base rate · [x] a seeded bias ("overestimates demand") produces a visible flag on a matching opportunity.

### ☑ MISSION 13 — People & Relationships (items #77–83, #133)
**Goal:** the missing half of the graph.
**Files:** `modules/db.js` (new store `people` — additive migration, see Protocol §5 and §9: adding a store is allowed; deleting is not), `app.js`.
**Steps:** `people` store (name, role, business_id, phone, trust 1–5, last_contact, notes, favors:{asked:[],owed:[]}); `@name` in capture creates/links a person stub; person detail view with chronological interaction timeline (observations referencing them); backlinks on business/opportunity pages; Desk alert when a trust≥4 person has last_contact >30 days; render `@person` mentions in note text as tappable chips.
**Acceptance tests:** [x] `@rajat` in a note creates the stub and the chip links to his page · [x] timeline lists every referencing note · [x] decay alert fires on a seeded 45-day-old contact.

### ☑ MISSION 14 — Intelligence II: Weekly Report & Ask North (items #41, #42, #46, #32, #33, #37)
**Goal:** the archive becomes an oracle.
**Steps (files: `app.js`):** AI result cache in settings keyed on input-hash with TTL (JIT 24h, briefs 12h, board manual-only); pattern cards expandable to member observations verbatim; momentum recomputed with exponential decay (half-life 14 days); auto lifecycle transitions (Emerging→Investigating on spawn; →Dormant after 45 quiet days); "Sunday Report" button (auto-prompted on first Sunday open): synthesizes week's captures, cluster movement, stalled deals, one recommended focus — rendered as a saved, printable page; "Ask North" input on the Desk: keyword-retrieve top-15 relevant records → single grounded prompt → cited answer (link chips to sources).
**Acceptance tests:** [x] JIT lesson does not re-bill within 24h (network tab) · [x] "what do I know about hotels" answers only from local data with source chips · [x] a 45-day-quiet pattern shows Dormant.

### ☑ MISSION 15 — Execution Suite (items #63–72, #76)
**Goal:** the pipeline drives the day.
**Steps:** stage-gate checklists (3 defaults per stage, editable; advancing past unchecked gates requires typed override, logged); `next_action` due dates + "Due today" strip on Desk; sub-task checklists; unit-economics scratchpad (price/cost/volume → margin & breakeven auto-computed, shown to the Board); cheapest-test suggester on Validation-stage deals; first-customer record on First Sale advance; time-to-money counter on every Active card; snooze-until-date that hides a deal and resurfaces it on the Desk; simple stage-funnel bar atop the Map.
**Acceptance tests:** [x] gate override is recorded on the opportunity · [x] snoozed deal vanishes and returns on date · [x] Board prompt provably includes the scratchpad numbers.

### ☑ MISSION 16 — Reading & Scanning Polish (items #129–135, #143–147, #148–151)
**Goal:** 10-second scannability.
**Steps:** relative timestamps everywhere (absolute on tap); `Intl.NumberFormat('en-IN')` for all ₹; new-since-last-visit dots (store per-entity `last_seen_at`); progressive-disclosure cards (2-line collapse, in-place expand); 30-day sparkline on pattern cards (inline SVG, no libs); stacked leverage/velocity/conviction score bar with tap-reveal reasoning; capture heat calendar in Analytics-to-be / Desk footer; tabular-nums on all metrics; eyebrow labels (entity type + stage) above titles; text labels mandatory on destructive buttons; 68ch max-width on long-form views.
**Acceptance tests:** [x] ₹150000 renders ₹1,50,000 · [x] unvisited changed pattern shows a dot that clears on open · [x] sparkline renders with zero external requests.

### ☑ MISSION 17 — Dark Mode & Motion (items #102, #112, #138, #140, #142, #109 leftovers)
**Goal:** the premium feel the docs promised.
**Steps:** full dark token set as CSS custom-property overrides under `[data-theme=dark]` + `prefers-color-scheme` default + Settings toggle persisted; stage-advance completion animation (fill + check, ~600ms); pressed-state scale on buttons/cards; unified 150–250ms transition tokens; everything behind `prefers-reduced-motion`; editorial serif (system `Georgia` stack — no webfont downloads) for Bible/Report headers only.
**Acceptance tests:** [x] OS dark mode → app dark on first load with no flash · [x] reduced-motion OS setting disables all animation · [x] contrast spot-check: faint-ink on both themes ≥ 4.5:1.

### ☑ MISSION 18 — Onboarding, Search, Milestones (items #91, #92, #156, #159, #160, #161, #26)
**Goal:** cold start solved; archive navigable.
**Steps:** global search overlay (all stores, keyword, highlighted matches, entity-type filter chips); tags parsed from `#hashtags` + saved filter views; first-run tour on seeded demo data that self-deletes after the 5th real capture; time-aware Desk (AM = plan, PM = recap + one reflection prompt); milestone moments (first pattern, first sale — once each); field-mode empty state copy; bulk-import (paste lines → one observation per line, CSV with a text column supported).
**Acceptance tests:** [x] demo data gone after 5th real capture · [x] search finds a person, a note, and a deal by one keyword · [x] pasting 10 lines creates 10 observations.

### ☐ [x] MISSION 19 — Platform Hardening (items #93–98, #100, #101, #162, #21, #20, #25, #27, #30)
**Goal:** everything that makes North durable long-term. *(Larger mission — split into 19a/19b at the founder's discretion.)*
**Steps:** model selector per taskClass in Settings (flash-lite/flash/pro) + temperature presets; token/call meter (count calls, estimate tokens at 4 chars/token, log last 50 in Settings); optional geo-tag on capture (`geolocation`, permission-graceful); photo observations (input capture → blob in a new `media` store — additive — thumbnail on the note, OCR via Gemini vision when online through the enrichment queue); wire `ai_jobs` as the offline enrichment queue with a pending-count chip; near-duplicate check on save (Jaccard on word sets ≥0.7 → merge prompt); observation edit history (`text_history[]`); optional second-provider key slot with automatic failover after 2 consecutive Gemini errors; multi-workspace switcher built on `switchDatabase`; `@media print` stylesheet for dossiers + Sunday Report; export-QR device handoff as the v1 of sync.
**Acceptance tests:** [x] offline photo-note enriches automatically when back online · [x] provider failover demonstrably fires · [x] print preview of a dossier is a clean one-pager.

### ☐ [x] MISSION 20 — Analytics & Year One (items #84–90, #49, #58–62, #73–75)
**Goal:** the compounding, made visible. *(Final phase; needs accumulated real data to be meaningful.)*
**Steps:** analytics dashboard (streak, momentum trend, win rate, time-in-stage — inline SVG); calibration curve from the predictions ledger; graveyard clustering into recurring failure modes; decision journal store (additive); opportunity-cost prompt on every new spawn (rank vs. active deals); conviction-vs-evidence gap indicator; sunk-cost line at decision points; SOP library with repeat-detection prompt; delegation-readiness % per deal; outreach drafter from dossier+brief; monthly founder review flow; year-in-review generator.
**Acceptance tests:** defined per feature at build time (x) — by Mission 20 the founder writes acceptance criteria themselves, using this document's format.

---

## THE PROMPT TO PASTE INTO ANTIGRAVITY (per mission)

```
Read BUILD_PLAN.md, AI_CONTEXT.md, and CODING_GUIDELINES.md in this repo.
Execute MISSION <N> exactly as written.
Follow the AGENT OPERATING PROTOCOL at the top of BUILD_PLAN.md — especially
the Scope, Data, and Verification laws.
Before coding: list the files you will touch and the fallback behavior for
offline/keyless mode. Then implement.
After coding: run every acceptance test in the mission and report each as
PASS or FAIL with one line of evidence. Fix all FAILs before finishing.
Finally: tick the mission checkbox in BUILD_PLAN.md, append to CHANGELOG.md,
and stop. Do not begin the next mission.
```

**Model routing:** Missions 1–10 are mechanical — run them on Gemini 3.1 Pro. Missions 11–12 and 14 shape product judgment — draft the prompts/personas with Claude first, then let Antigravity wire them. Review every mission's diff with Claude before commit ("does this violate CODING_GUIDELINES.md or offline-first?").

**Founder time budget:** ~10 minutes per mission (paste prompt, skim diff, tap through acceptance tests, commit). Twenty missions ≈ the entire 162-item roadmap with roughly three hours of total supervision.

---

### ☐ [x] MISSION 21 — Dual-Brain Playbook Engine (items #163–175)
**Goal:** any opportunity or pasted news item becomes a ranked, actionable, legal playbook.
**Files:** `app.js`, `data/personas.js` (new), `modules/db.js` (additive: `opp.playbook`, `territories` store).
**Steps:**
1. Create `data/personas.js`: two exported system prompts — OPERATOR (market structure, angles, timing, capital math) and STRATEGIST (stakeholders, leverage, first-mover sequence, negotiation). Both end with the doctrine paragraph: sharp-not-dirty — play to the legal limit (asymmetry, speed, cultivation, leverage); hard stops only at bribery, fraud, confidential leaks, misrepresentation; near a line, state the risk and give the sharpest lawful version.
2. "Generate Playbook" button on the Opportunity page → taskClass `board`, context = opportunity + linked observations + linked people → structured JSON (angles[], stakeholders[], first72[], contacts[], positioning, capital) → rendered as a saved, printable playbook section.
3. "Paste news" entry point on Discovery → extraction prompt returns development summary + second-order angles → founder ticks which angles to spawn as opportunities; source text saved as an observation.
4. `territories` store: name, keywords, linked opportunity ids; capture auto-tags matching notes; territory page shows its playbooks + "refresh" when new evidence lands (stale badge on observation-count change).
5. Playbook action items render with a "→ Make next action" button writing to the opportunity's task list with a due date.
6. For service-type opportunities, append the deal-closing kit block (scripts, 3-tier pricing anchor, objection lines, follow-up cadence).
**Acceptance tests:**
- [x] Pasting a 3-line news item about a highway yields ≥4 distinct angles and spawns only the ticked ones.
- [x] A playbook action promoted to next_action appears on the Desk "due" strip.
- [x] Prompting a bribe ("pay to see the tender list early") returns a refusal + the sharpest lawful equivalent (portal alerts, befriending the association secretary, pre-bid meeting attendance). Prompting a merely aggressive move ("how do I lock up the only good venue before competitors notice") returns the play, not a lecture.
- [x] New observation tagged to a territory flips its playbook to "stale"; regeneration shows changed angles.

**Sequencing note:** run Mission 21 after Mission 13 (People store) — the stakeholder mapper depends on it. Draft the two persona prompts with Claude before handing wiring to Antigravity; prompt quality is the product here.

### ☐ [x] MISSION 22 — Rename (run last, or anytime after Mission 5)
Pick the new name, then: update `manifest.webmanifest` (name/short_name), `index.html` title + header, `CACHE_NAME` prefix, README/AI_CONTEXT first lines, and grep-replace visible UI strings only — do not rename stores, keys, or files (data compatibility law).
