# North OS — Next Roadmap (Phase 5)

> Source of truth for the next build cycle. This document extends `next.md` and `ROADMAP.md`.
> Every item below is grounded in the current `app.js` / `modules/db.js` / `sw.js` / `index.html` / `css/design-system.css` state as of this review.
>
> **Legend for goal tags:** `[core]` bumps the core compounding engine · `[usability]` makes it easier to use · `[efficiency]` faster / cheaper / less waste · `[aesthetic]` looks and feels more premium.
>
> **Suggested order:** ship the 8 Fixes first (they unblock features that are already half-built), then work the Enhancements, then pull New Features in by phase (see "Sequencing" at the end).

---

## Part 1 — Fixes (broken, buggy, or unreachable today)

These are not improvements; they are defects. The app currently ships promises it does not keep.

### F1. Offline boot is broken `[core]`
`sw.js` caches `index.html`, `app.js`, `css/design-system.css`, and `manifest.webmanifest` — but **not `modules/db.js`**, which `index.html` loads with a `<script>` tag, nor `sw.js` itself. On a real offline load the service worker serves the shell, the browser then requests `modules/db.js`, the cache misses, the network is down, and the app throws before `NF.DB` is ever defined. Because the whole app is offline-first by charter (Constitution Rule #5), this is the single most important defect. **Fix:** add `./modules/db.js` (and any future module scripts) to the `ASSETS` array, bump `CACHE_NAME` to `v2`, and add an `activate` handler that deletes stale caches so users actually receive updates.

### F2. The Virtual Board is unreachable `[core]`
`app.runBoardAnalysis()` is fully implemented — it prompts Gemini for CEO/CFO/CTO/CPO takes, writes `opp.board_analysis`, and `renderMorning` renders those directives on the Spearhead card. But **nothing ever calls it**: the button it looks for (`btn-convene-board`) is never rendered on the Opportunity page. A finished, valuable feature is dead. **Fix:** add a "Convene Board" button in `renderOpportunity` next to "AI Tutor" / "Advance Stage," gated on the presence of an API key.

### F3. Missing SVG icons render blank `[aesthetic]`
The sprite in `index.html` defines only: `i-home, i-grid, i-compass, i-arrow, i-star, i-bulb, i-search, i-target, i-building`. But the code references `#i-spark` (capture modal, emerging patterns, Tutor, diagnostics, prep brief), `#i-cross` (Tutor close), and `#i-users` (board). Every one of those renders as an empty box. For an app whose pitch is "ultra-premium, crisp aesthetic," broken chrome on the marquee AI features is damaging. **Fix:** add the three missing `<symbol>` definitions.

### F4. Businesses cannot be created, and their links are faked `[core]`
There is no "Add Business" UI anywhere. A real user can only get a business into the DB through the simulator (isolated demo DB) or through capture auto-linking to a business that *already exists* — a chicken-and-egg dead end. Worse, `renderBusinessDetail` fills "What opportunities exist?" with `opps.slice(0, 2)` — the first two opportunities in the whole DB, unrelated to the business. **Fix:** add create/edit forms for businesses and link opportunities by a real `business_id` (see E2).

### F5. Patterns don't form until a reload `[core]`
`captureObservation` saves a passive note and returns; it never triggers `runPatternEngine`. The engine only runs once, on boot, inside `requestIdleCallback`. So a founder can log five related notes in a session and no pattern appears until they refresh the app. This quietly breaks the core "capture → pattern" loop that the whole product is built on. **Fix:** call a debounced `runPatternEngine()` after each passive capture, and re-render the affected surfaces.

### F6. Scoring has two contradictory code paths `[core]`
`runAIDiagnostics` scores an opportunity with Gemini and a weighted formula (`leverage*0.5 + velocity*0.3 + conviction*0.2`). But `spawnHypothesis` still assigns `Math.floor(Math.random()*5)+5` to each variable and a random `calculated_score`, even when an API key is present. The same opportunity can therefore be born with a fabricated score and later get a real one, with no indication which is which. **Fix:** route `spawnHypothesis` through the same diagnostics path (AI when available, deterministic fallback otherwise), and stop minting random numbers.

### F7. All user text is injected unescaped into `innerHTML` `[core]`
Every render concatenates raw model/user strings into template literals assigned to `innerHTML` (observation text, business names, titles, lessons, tutor messages). A note containing `<`, `>`, quotes, or a literal `${...}` will break layout at best and inject markup at worst. Even single-user local apps should not be one stray character away from a broken screen. **Fix:** add one `escapeHtml()` helper and apply it to every interpolated user/AI value; render AI HTML (prep briefs, playbooks) through a small allow-list sanitizer instead of raw injection.

### F8. Documentation and labels contradict the code `[efficiency]` `[aesthetic]`
`ARCHITECTURE.md` and `DECISIONS.md` still describe storage as `localStorage`, but the app is 100% IndexedDB. `PROJECT_MISSION.md` calls the UI "dark-mode-first," but `design-system.css` is a light, warm off-white theme with no `prefers-color-scheme`. The page `<title>` and sidebar still read "North V3 Engine" though the app is V4/V5. And `modules/ai.js` still defines a second, conflicting `NF.AI` built on the nonexistent `NF.Store` (harmless only because it isn't loaded). **Fix:** correct the three docs, update the labels, and delete the dead module (see E10).

---

## Part 2 — Enhancements (improve what already exists)

### E1. Cache AI results with a TTL `[efficiency]`
`renderJitLearning` calls Gemini on **every** Morning Briefing render. Navigating away and back re-bills the user and adds latency for an answer that hasn't changed. Cache each AI result keyed to its inputs (e.g. opportunity id + `next_action`) with a timestamp, and only refresh when the inputs change or the TTL expires. Apply the same pattern to prep briefs and board analyses.

### E2. Real business ↔ opportunity links `[core]`
Add a `business_id` field to opportunities, set it when an opportunity is spawned from a business context or when capture auto-links a note. Then `renderBusinessDetail` can query genuinely related opportunities instead of `slice(0, 2)`, and the dossier's "What opportunities exist?" becomes true.

### E3. Escape user text before rendering `[core]`
The correctness half of F7: beyond security, escaping prevents everyday breakage when founders paste quotes, code snippets, or prices with symbols. One shared helper, applied everywhere text meets `innerHTML`.

### E4. Loading states for every AI call `[usability]`
Some AI actions only swap button text ("Analyzing…"), and a few (capture deal-detection, AI post-mortem) block the UI with no visible feedback at all. Add inline spinners/skeletons on the target surface and a lightweight non-blocking toast, so the founder always knows the system is working and never taps twice.

### E5. Robust AI JSON parsing with retry `[core]`
Multiple handlers `JSON.parse` raw model output guarded only by `try/catch` that logs to console (pattern engine) or shows a generic alert. Centralize a resilient extractor (strip fences, grab the first balanced `{…}`/`[…]`, tolerate trailing prose), retry once on failure, and surface a clear, recoverable message. This directly raises the hit-rate of every AI feature.

### E6. Make "Universal Command" real `[usability]` `[efficiency]`
The sidebar's `/` "Universal Command" currently fires a placeholder `alert`. Turn it into an actual palette that jumps to any view, opens capture, or finds an entity — the fastest path through the app for a power user.

### E7. Real dark mode `[aesthetic]`
Honor the "dark-mode-first" claim: define a dark token set, wire `prefers-color-scheme`, and add a manual toggle persisted in settings. Field founders often work at night or in low light; a true dark theme is both aesthetic and practical.

### E8. Fix navigation gaps `[usability]`
The mobile bottom nav exposes only Desk / Map / Dossiers / Capture — Discovery and Settings are unreachable on mobile. Add them (or a "More" affordance), and correct the "V3 Engine" label in the sidebar brand.

### E9. Pattern drill-down `[core]`
The Opportunity's "Observation Log" renders `<li>Found via AI Pattern</li>` placeholders instead of the real notes, and patterns can't be opened to inspect their members. Render actual observation text, and let a pattern card expand to show every observation feeding it — this is where the founder verifies the machine's reasoning.

### E10. Remove or rewire dead code `[efficiency]`
`modules/ai.js`, `modules/boardroom.js`, `data/bibles.js`, `data/pipeline.js`, `data/journal.js`, and `test_gemini.{js,py}` are orphaned; several still call the nonexistent `NF.Store`. Delete them (their live equivalents are in `db.js`/`app.js`) or consciously rewire, and remove the confusion for the next contributor.

### E11. Consistent empty states and edit affordances `[usability]`
Some views have thoughtful empty copy; others render nothing or a blank card. Standardize an empty-state component (icon + one line + a primary action) across Businesses, Opportunities, Discovery, and Patterns, so a cold user always has an obvious next tap.

### E12. Focus and scroll management `[usability]`
Modals and the Tutor sidebar don't trap focus, restore focus on close, or reliably autoscroll the chat. Add focus trapping, `Esc`-to-close everywhere (only capture handles it today), and scroll-to-bottom on new Tutor messages.

### E13. Run the pattern engine after each capture `[core]`
The live half of F5: after a passive note is saved, kick a debounced engine run so patterns emerge within the session, then refresh the emerging-patterns container without a full reload.

### E14. Unify the scoring model `[core]`
The design half of F6: define one scoring function used by spawn, diagnostics, and instant-deal creation, so every opportunity's score means the same thing and is always explainable.

### E15. Reconcile the stage model `[core]`
`advanceStage` walks `Validation → First Sale → Delivery → SOP → Business`, while the Opportunity timeline shows `Observation → Pattern → Hypothesis → Validation → First Sale → Business`. Pick one canonical lifecycle and use it everywhere (timeline, advance, filters, "closest to revenue").

### E16. Targeted re-rendering `[efficiency]` `[usability]`
Nearly every action calls `app.render()`, which rebuilds the entire page, resets scroll, and drops transient state. Move to updating just the affected container. Result: no flicker, preserved scroll position, and snappier interaction.

### E17. Token-usage meter and call log `[efficiency]`
Since the founder pays for their own key, show them: number of AI calls, rough token estimate, and a short log in Settings. Transparency builds trust and helps them tune usage.

### E18. Model and temperature selection `[efficiency]`
Let the user pick the Gemini model (flash-lite / flash / pro) and set temperature for creative vs. deterministic tasks. Different jobs (JSON extraction vs. tutoring) want different settings.

### E19. Configurable thresholds `[usability]`
Hard-coded constants (thin-data cutoff of 10, minimum cluster size of 3, 20-observation batch cap) should be user-adjustable in Settings, since the right values differ by how prolifically a founder logs.

### E20. Recency-weighted momentum `[core]`
Pattern "velocity" is currently `mentions / days-spanned`, which a single old outlier can distort. Weight recent mentions more heavily (exponential decay) so "accelerating" reflects genuine current heat, not lifetime average.

### E21. Accessibility pass `[usability]`
Add aria roles/labels to interactive cards and icon buttons, ensure keyboard operability (the app is heavily `onclick`-on-`div`), and verify contrast on faint-ink text. This widens who can use it and improves general robustness.

### E22. Design-token and motion polish `[aesthetic]`
Replace scattered inline pixel values with a consistent spacing/type scale, and add subtle, uniform transitions (card hover, sidebar slide, modal fade). Small consistency work is what separates "clean" from "premium."

### E23. Offline / AI-availability banner `[usability]`
When `navigator.onLine` is false or no key is set, show a quiet banner explaining that AI features are paused and the local fallback is active — so the founder is never confused about why a button did nothing.

### E24. Near-duplicate detection on capture `[efficiency]`
Founders re-log the same observation in slightly different words. Detect near-duplicates on save (keyword/embedding similarity) and offer to merge, keeping the graph clean and momentum math honest.

---

## Part 3 — New Features (net-new capability)

### Capture & Intake

### N1. Institutional export / import backup `[core]`
A one-tap JSON dump of every store (`observations, patterns, opportunities, businesses, settings`) to a local file, and a restore that drops and repopulates cleanly without ID collisions. All data lives in a single browser's IndexedDB; one cache-clear erases years of compounding memory. This is the highest-priority new feature — it makes the "compound over time" promise trustworthy. (Already scoped in `next.md`.)

### N2. Voice capture `[usability]`
A mic button in Universal Capture using `webkitSpeechRecognition` to dictate observations hands-free, transcribed to text and saved. Standing outside a building, speaking is far faster than thumb-typing — the truest expression of the 30-Second Rule. Fall back to keyboard where unsupported.

### N3. Photo / business-card / receipt OCR `[usability]`
Snap a photo (business card, menu, receipt, signage) and OCR it into a structured observation or a pre-filled business/contact. Captures field intelligence that never gets typed.

### N4. Location tagging `[usability]`
Optionally geotag observations so the founder can later recall "what did I notice near this hotel" and cluster patterns by place. Field work is inherently spatial.

### N5. PWA share target `[usability]`
Register `share_target` in the manifest so the founder can share text or images from any app (WhatsApp, browser, camera) directly into North as an observation, without switching context.

### N6. Offline capture queue with sync status `[core]`
Make capture fully write-through offline (already local) but add a visible queue/indicator for notes awaiting AI enrichment, which then processes automatically when connectivity and a key are available.

### N7. Contextual capture prompts `[usability]`
Optional lightweight scaffolding in the capture box (who / what pain / how big / next move) that structures a note without slowing it down, improving downstream clustering and scoring quality.

### N8. Bulk import `[efficiency]`
Import a backlog of observations from CSV or pasted notes so a founder can seed the system from existing journals and cross the thin-data threshold immediately.

### Intelligence & AI

### N9. Semantic embeddings clustering `[core]`
Upgrade the pattern engine from keyword overlap (local fallback) to embedding similarity, so notes cluster by meaning even when they share no words. This is the biggest single lift to "uncover patterns others overlook."

### N10. Cross-domain analogy explorer `[core]`
A dedicated surface that names structural analogies across industries ("the labor bottleneck in hospitality mirrors your schools pattern") — turning the tagline into a browsable, explainable view rather than a side effect.

### N11. Weekly Review / Sunday Boardroom `[core]`
A scheduled digest that synthesizes the week: new captures, hottest patterns, opportunities advanced, wins vs. graveyard, and one recommended focus. This is the roadmap's original V1.0 "Board Room," finally real, and the natural home for the four AI personas.

### N12. Proactive hypothesis suggestions `[core]`
When a pattern crosses a momentum threshold, North proposes a specific hypothesis unprompted ("You've logged this 6× in 10 days — here's a testable venture"), instead of waiting for the founder to click "Spawn."

### N13. Red-team / kill-the-idea mode `[core]`
A one-click adversarial review that argues the strongest case *against* an opportunity and proposes the cheapest test to falsify it — a structured counter to founder over-conviction, complementing the optimistic Board.

### N14. Market / competitor scan `[core]`
For a given opportunity, an AI-generated snapshot of comparable models, likely incumbents, and known playbooks, so the founder isn't reinventing from scratch. (Uses the model's own knowledge; no scraping.)

### N15. Urgency & sentiment scoring on observations `[efficiency]`
Tag each incoming note with urgency/emotion so the Discovery Feed and patterns can surface the hottest signals first, not just the most recent.

### N16. Pattern lifecycle automation `[core]`
Patterns currently only ever sit at "Emerging." Auto-transition them to "Investigating" once a hypothesis spawns and "Rejected/Dormant" when they go cold, so the pattern list reflects reality without manual grooming.

### N17. AI-generated exit conditions `[core]`
Every opportunity is supposed to have kill criteria (Constitution: ruthless execution). Have the AI draft specific, measurable exit conditions at spawn time, which the founder edits — making the discipline the default.

### N18. "Ask North" — chat over your whole graph `[core]`
A global assistant that answers questions across all local data ("what do I know about hospitality?", "which deals are stalling?") using retrieval over the founder's own observations, patterns, and dossiers. Turns the archive into an oracle.

### Execution & Workflow

### N19. Follow-ups & a Today list `[core]`
Give each `next_action` an optional due date and surface an "actions due today" strip on the Morning Briefing, so the system drives daily execution, not just capture.

### N20. Kanban stage board `[usability]` `[aesthetic]`
A drag-to-advance board view of opportunities by lifecycle stage, as an alternative to the grouped Map — a faster, more tactile way to move deals and see where the pipeline is clogged.

### N21. Outreach drafter `[core]`
From a dossier plus its Prep Brief, generate a ready-to-send WhatsApp/email draft tuned to the decision-maker's stated communication style and known objections — collapsing "I know what to do" into "it's written."

### N22. SOP / playbook library `[core]`
Codify solved problems into reusable playbooks ("Never Learn Twice," Constitution Rule #4). When a pattern or opportunity resolves, prompt to extract an SOP; build a searchable library the founder and future operators reuse.

### N23. Experiment tracker `[core]`
A structured hypothesis → test → result log per opportunity, so validation is evidence-based and the Founder Intel calibration has real inputs beyond graveyard post-mortems.

### N24. Task checklists inside opportunities `[usability]`
Lightweight sub-task checklists on an opportunity, so multi-step next-actions don't collapse into a single vague line.

### N25. Pipeline revenue forecasting `[core]`
Attach expected value and stage-based probability to opportunities and roll them up into a simple forecast — connecting the compounding loop to actual capital, which is the Constitution's endpoint.

### Knowledge & Relationships

### N26. People as first-class entities `[core]`
Revive the dead "People Bible": contacts as their own records, linked across businesses and observations, with trust and interaction history. Relationships are half the compounding thesis and currently have nowhere to live.

### N27. Industry Bibles view `[core]`
A per-industry rollup of patterns, bottlenecks, and SOPs — the "Bible" concept the docs keep referencing but the app never renders as a real destination.

### N28. Trust / interaction timeline `[core]`
A chronological log of every touch with a business (notes, meetings, pitches, outcomes) so the dossier shows a relationship's trajectory, not just its current snapshot.

### N29. Backlinks `[usability]`
Everywhere an observation, person, or business is referenced, show the reverse links — click a person to see every note and deal they appear in. This is what makes the "graph" feel like a graph.

### N30. Tags & saved filters `[efficiency]`
Freeform tagging plus saved filter views across all entities, so the founder can carve their own lenses (by industry, geography, trust level) without waiting on new features.

### Analytics & Review

### N31. Analytics dashboard `[core]` `[aesthetic]`
A dashboard of the metrics that matter: capture streak, pattern velocity trend, opportunity win-rate, time-in-stage, with lightweight inline charts. Makes compounding visible and motivating.

### N32. Judgment calibration curve `[core]`
Beyond today's single accuracy ratio, plot predicted vs. actual over time so the founder can literally watch their judgment sharpen — the product's deepest moat, made legible.

### N33. Graveyard insights `[core]`
Mine archived post-mortems for recurring failure modes ("your top recurring kill reason is under-validating demand") and surface them, turning individual losses into a compounding lesson.

### N34. Global search `[usability]`
Instant search across observations, patterns, opportunities, and businesses with highlighting — table stakes once the archive grows past a few dozen entries.

### Mobility & Platform

### N35. Encrypted cross-device sync `[core]`
Opt-in, end-to-end-encrypted sync so the founder can capture on a phone and review on a laptop without a backend seeing their data — preserving the zero-infrastructure, absolute-privacy charter. (Docs float Gun.js / WebRTC.)

### N36. Install prompt & morning notification `[usability]`
A guided "Add to Home Screen" prompt and a scheduled local notification that fires the Morning Briefing, pulling the founder back into the loop daily.

### N37. Command palette / spotlight `[efficiency]`
The feature-grade version of E6: a fuzzy palette to navigate, create, and jump to any entity from anywhere — the backbone of a fast keyboard-driven workflow.

### N38. Multi-workspace / portfolio switching `[usability]`
Beyond the demo/real split, let the founder run separate workspaces (e.g. different regions or ventures) with isolated databases and a quick switcher — the app already proves this is possible via `switchDatabase`.

### Onboarding & Aesthetic

### N39. Guided first-10-observations onboarding `[usability]` `[aesthetic]`
A friendly checklist that walks a brand-new founder through logging their first ten observations and spawning their first hypothesis — directly attacking the cold-start weeks before the engine has enough data to shine.

---

## Sequencing

**Phase 5.0 — Stabilize (Fixes):** F1–F8. Nothing new should ship on a base that breaks offline, hides finished features, and renders broken icons.

**Phase 5.1 — Trust the data (foundational Enhancements + N1):** E2, E3, E5, E13, E14, E15, plus **N1 (backup/export)**. Make the core loop correct and the data safe.

**Phase 5.2 — Sharpen intelligence:** N9, N10, N11, N12, N18, plus E1, E17, E18, E20. This is the payload — the reason North is more than a notes app.

**Phase 5.3 — Drive execution:** N19, N21, N22, N23, N25, plus E4, E6/N37, E16.

**Phase 5.4 — Relationships & review:** N26, N27, N28, N29, N31, N32, N33, N34.

**Phase 5.5 — Mobility, capture, polish:** N2, N3, N4, N5, N35, N36, N38, N39, plus E7, E21, E22, E23.

Enhancements not pinned to a phase (E8, E9, E10, E11, E12, E19, E24) and features (N6, N7, N8, N13, N14, N15, N16, N17, N20, N24, N30) fold in opportunistically alongside the phase whose surface they touch.

---

*North remains a pure, invisible, offline-first compounding engine. Every item above serves one test: does it help the founder recognize an idea, discover the pattern beneath it, and execute the next highest-leverage move — faster than they could without it?*
