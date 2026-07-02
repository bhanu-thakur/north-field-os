# North OS — Master Improvements & Feature Roadmap (v2)

> Consolidates and supersedes `ROADMAP_NEXT.md` (Phase 5). Reconciled against the live codebase (`app.js` 1620L, `modules/db.js`, `sw.js` v2, `css/design-system.css`) as of July 2026.
> Legend: `[core]` compounding engine · `[trust]` data safety & security · `[usability]` · `[efficiency]` · `[judgment]` founder decision quality · `[aesthetic]`
> Items marked **(R:xx)** carry over or extend an item from ROADMAP_NEXT.md.

---

## Part 0 — Roadmap Reconciliation (audit findings)

Before adding anything, correct the record — a stale source of truth is worse than none:

- **F1 is ~70% shipped.** `sw.js` is at `CACHE_NAME v2`, caches `modules/db.js`, and has the activate-cleanup handler. Still broken: `modules/boardroom.js`, `data/journal.js`, `data/bibles.js`, `data/pipeline.js` are loaded but uncached → offline boot still fails. Mark F1 "partially done," finish the asset list.
- **F7/E3 is ~80% shipped.** `app.escapeHtml` exists and is applied across observation text, titles, tutor messages, lessons. Remaining gaps: AI-generated HTML (prep briefs, playbooks) is still raw-injected; audit the ~14 `innerHTML` sites and close the rest.
- **F8 partially persists.** Docs still claim dark-mode-first; CSS is light-only. `next.md` claims the key is "stored securely" — it is plaintext IndexedDB echoed into the DOM (see #1).
- Mark shipped items ✅ in ROADMAP_NEXT.md rather than deleting them — the changelog of promises kept is itself founder data.

---

## Part 1 — Critical Fixes (security & data integrity)

1. **API key out of the URL** `[trust]` — `db.js` sends `?key=${apiKey}` as a query param, which leaks into network logs and browser history. Move to the `x-goog-api-key` request header.
2. **Stop echoing the key into the DOM** `[trust]` — `renderSettings` renders `value="${apiKey}"` into the HTML. Render the field empty with a "key saved ✓" badge; only write on change.
3. **Guard the Gemini response path** `[trust]` — `data.candidates[0].content.parts[0].text` throws on safety blocks and empty candidates. Optional-chain it and return a typed error.
4. **Non-destructive schema migrations** `[trust]` — `onupgradeneeded` deletes any store not in the current list. Replace destructive resets with additive migrations + a pre-migration auto-export. One pivot must never erase years of field notes.
5. **Finish the service-worker asset list** `[trust]` **(R:F1)** — add `modules/boardroom.js` and all `data/*.js`; adopt network-first for `app.js` so releases don't require manual cache bumps.
6. **One-tap JSON export/import** `[trust]` **(R:N1)** — dump all seven stores to a dated `.json`; restore with ID-collision handling. The single highest-priority feature in the entire document.
7. **Auto-backup reminder** `[trust]` — if last export > 7 days and observation count grew, show a quiet banner. Data durability as a habit, not a feature.
8. **Auto-backup to Google Drive** `[trust]` — the founder already holds a Google key; one OAuth scope away from set-and-forget cloud backup without abandoning the zero-backend charter.
9. **Wire the Convene Board button** `[core]` **(R:F2)** — `runBoardAnalysis` is finished and unreachable. Ship the button.
10. **Add missing SVG symbols** `[aesthetic]` **(R:F3)** — `#i-spark`, `#i-cross`, `#i-users` render blank on the marquee AI features.
11. **Business create/edit UI + real links** `[core]` **(R:F4, E2)** — "Add Business" form; `business_id` on opportunities; kill the fake `opps.slice(0,2)` dossier links.
12. **Unify scoring** `[core]` **(R:F6, E14)** — one scoring function for spawn, diagnostics, and instant deals; no more random numbers wearing a score's clothes. Persist `score_source: 'ai' | 'fallback'` on every opportunity.
13. **One canonical lifecycle** `[core]` **(R:E15)** — reconcile `advanceStage`'s chain with the timeline's chain; use it everywhere.
14. **Debounced pattern engine after capture** `[core]` **(R:F5, E13)** — patterns must emerge in-session, not on next reload.
15. **Centralized resilient JSON extractor with one retry** `[core]` **(R:E5)** — strip fences, grab first balanced bracket, tolerate prose, retry once, surface a recoverable toast.
16. **Typed AI results** `[trust]` — `generateContent` returns `{ok, text, error, tokens}` instead of `null`; every caller can tell "no key" from "network" from "safety block" from "truncated."
17. **Raise `maxOutputTokens` per task class** `[efficiency]` — 300 default truncates clustering JSON mid-array → silent parse fail. Define per-task budgets (capture: 300, clustering: 2000, board: 1500).
18. **Doc/label truth pass** `[aesthetic]` **(R:F8)** — fix `localStorage` claims, "dark-mode-first" claim, "V3 Engine" labels, "stored securely" claim; delete or rewire orphaned `modules/ai.js`, `data/*.js`, `test_gemini.*` **(R:E10)**.

## Part 2 — Capture (the 30-Second Rule, fully honored)

19. **Voice capture** `[usability]` **(R:N2)** — mic button, Web Speech API, keyboard fallback. Fastest input standing outside a hotel.
20. **Photo observations with deferred OCR** `[usability]` **(R:N3)** — snap signage/menus/cards as blobs; AI extracts structure when online.
21. **Geo-tagging** `[core]` **(R:N4)** — optional lat/long per observation; field intelligence is spatial, and yours spans Shimla↔Mohali.
22. **PWA share target** `[usability]` **(R:N5)** — share WhatsApp messages, URLs, screenshots straight into capture from the Android share sheet.
23. **Inline micro-syntax** `[efficiency]` — parse `@person #industry ₹amount !urgent` at save time into structured fields.
24. **Capture templates** `[usability]` **(R:N7)** — "business visit / conversation / price point" scaffolds, 3 fields each, skippable.
25. **Offline AI enrichment queue with visible status** `[core]` **(R:N6)** — the `ai_jobs` store exists; wire it end-to-end with a pending-count chip.
26. **Bulk import** `[efficiency]` **(R:N8)** — CSV or pasted-notes import to cross the thin-data threshold on day one.
27. **Near-duplicate merge on save** `[efficiency]` **(R:E24)** — keyword-similarity check; offer merge; keep momentum math honest.
28. **Quick-audio memo fallback** `[usability]` — where speech recognition is unsupported, record audio blob for later transcription rather than losing the moment.
29. **Home-screen capture shortcut** `[usability]` — PWA `shortcuts` entry in the manifest jumping straight to the capture modal.
30. **Observation edit history** `[trust]` — preserve original raw text whenever AI or the founder rewrites a note; the raw field signal is the asset.

## Part 3 — Pattern & Intelligence Engine

31. **Embedding-based clustering** `[core]` **(R:N9)** — upgrade from keyword overlap to semantic similarity (Gemini embedding endpoint, cached locally); notes cluster by meaning.
32. **Recency-weighted momentum** `[core]` **(R:E20)** — exponential decay so "accelerating" means now, not lifetime average.
33. **Pattern lifecycle automation** `[core]` **(R:N16)** — Emerging → Investigating (on hypothesis spawn) → Dormant/Rejected (on cold streak), automatic.
34. **Pattern confidence decay** `[core]` — untouched patterns fade after 60 days unless reinforced; the map reflects the current territory.
35. **Contradiction detector** `[judgment]` — flag when a new observation contradicts an existing pattern's thesis; contradictions are the highest-value signal in field research.
36. **Cross-pattern collision surface** `[core]` **(R:N10)** — a browsable view of structural analogies and intersections between patterns, with the AI's reasoning shown.
37. **Pattern drill-down** `[core]` **(R:E9)** — expand any pattern to its member observations verbatim; the founder must be able to audit the machine's clustering.
38. **Seasonality layer** `[core]` — tag observations by season/month; hill-economy patterns (monsoon, tourist waves, wedding season) are cyclic, and the engine should know it.
39. **Urgency & sentiment scoring** `[efficiency]` **(R:N15)** — tag incoming notes so Discovery surfaces the hottest signals, not merely the newest.
40. **Proactive hypothesis suggestions** `[core]` **(R:N12)** — momentum threshold crossed → North proposes a testable venture unprompted.
41. **"Ask North" graph chat** `[core]` **(R:N18)** — retrieval over all local stores; "what do I know about hospitality?" answered from the founder's own archive.
42. **Weekly Field Report / Sunday Boardroom** `[core]` **(R:N11)** — scheduled digest: captures, cluster movement, stalled deals, one recommended focus, delivered by the four personas.
43. **Market/competitor snapshot per opportunity** `[core]` **(R:N14)** — comparable models, incumbents, known playbooks from model knowledge.
44. **Industry Bible as a real destination** `[core]` **(R:N27)** — per-industry rollup view: patterns, unit economics observed, bottlenecks, SOPs, key people.
45. **Bible auto-growth** `[core]` — every resolved pattern and completed deal appends structured learnings to its industry's Bible automatically.
46. **AI result cache with TTL** `[efficiency]` **(R:E1)** — key on input hash; stop re-billing the Morning Briefing on every render.
47. **Local-first fallback intelligence** `[efficiency]` — keyword clustering, deterministic scoring, and template briefs must all work keyless/offline, clearly labeled as fallback.

## Part 4 — Decision Quality (the founder's real moat)

48. **Prediction ledger** `[judgment]` — before any action: falsifiable prediction + confidence % + resolve-by date; resolution updates `founder_intel.prediction_accuracy` with real data instead of a placeholder 50.
49. **Calibration curve** `[judgment]` **(R:N32)** — plot predicted vs. actual over time; watching your own judgment sharpen is the product's deepest promise made visible.
50. **Bias tripwires** `[judgment]` — `founder_intel.biases` actively checked: each new opportunity is screened against your known failure modes and flagged.
51. **Base-rate injector** `[judgment]` — the Board must cite category base rates ("most tier-2 F&B ventures fail within 18 months") against founder optimism, every time.
52. **Red-team / kill-the-idea mode** `[judgment]` **(R:N13)** — one click, strongest case *against*, plus the cheapest falsifying test.
53. **Board debate mode** `[judgment]` — CEO and CFO argue opposing sides in sequence instead of four parallel monologues; disagreement is where the insight lives.
54. **AI-drafted exit conditions at spawn** `[judgment]` **(R:N17)** — measurable kill criteria are the default, founder edits rather than invents.
55. **Kill-criteria enforcement** `[judgment]` — exit conditions get deadlines; the app nags loudly when conditions are met but the deal is still "Active." Ruthlessness as software.
56. **Pre-mortem generator** `[judgment]` — "it's six months later and this failed — why?" run before validation begins; answers stored on the opportunity.
57. **Structured post-mortem on archive** `[judgment]` — archiving triggers a guided autopsy (cause, predicted-vs-actual, lesson) feeding `recent_lessons`.
58. **Graveyard mining** `[judgment]` **(R:N33)** — cluster archived post-mortems into recurring failure modes; "your top kill reason is under-validated demand."
59. **Decision journal** `[judgment]` — decisions as first-class records: alternatives considered, reasoning, expected outcome; quarterly review view.
60. **Opportunity-cost comparator** `[judgment]` — spawning a new opportunity forces a rank against active ones: what does this steal attention from?
61. **Conviction-vs-evidence gap meter** `[judgment]` — show founder-stated conviction next to evidence count per opportunity; a big gap is a yellow flag rendered in the UI.
62. **Sunk-cost alarm** `[judgment]` — time + money logged against a stalled deal, displayed at decision points ("you've spent 40 days; would you start this today?").

## Part 5 — Validation & Execution

63. **Stage-gate checklists** `[core]` **(R:E15 ext.)** — 3–5 concrete gates per lifecycle stage; can't advance past unchecked gates without an explicit override (which is itself logged).
64. **Cheapest-test suggester** `[core]` — AI proposes the minimum-cost real-world experiment: ₹ budget, days, success metric.
65. **Experiment tracker** `[core]` **(R:N23)** — hypothesis → test → result log per opportunity; validation becomes evidence, and calibration gets inputs.
66. **First-customer record** `[core]` — who paid, how much, how found; the moment an idea became a business, permanently marked.
67. **Unit-economics scratchpad** `[core]` — price, cost, margin, breakeven volume per opportunity; the Board reads these numbers instead of vibes.
68. **Pipeline revenue forecast** `[core]` **(R:N25)** — expected value × stage probability rolled up; the compounding loop connected to actual capital.
69. **Time-to-money clock** `[core]` — days since spawn vs. first rupee, rendered big; the metric that disciplines everything else.
70. **Today list with due dates** `[core]` **(R:N19)** — `next_action` gets an optional date; Morning Briefing opens with "due today."
71. **Task checklists inside opportunities** `[usability]` **(R:N24)** — multi-step next-actions stop collapsing into one vague line.
72. **Kanban stage board** `[usability]` **(R:N20)** — drag-to-advance by lifecycle stage; see where the pipeline clogs.
73. **Outreach drafter** `[core]` **(R:N21)** — dossier + prep brief → ready-to-send WhatsApp/email tuned to the decision-maker's style.
74. **SOP builder with repeat detection** `[core]` **(R:N22)** — a task done 3× prompts "codify this"; searchable playbook library ("Never Learn Twice").
75. **Delegation-readiness score** `[core]` — per opportunity: % of tasks with SOPs; the metric that tells you when it can run without you (your Operator → Automation stages).
76. **Follow-up snooze & resurface** `[usability]` — park a deal until a date or trigger ("resurface when tourist season starts"); it returns to the Morning Briefing automatically.

## Part 6 — Relationships (currently absent; half the thesis)

77. **People as first-class entities** `[core]` **(R:N26)** — contacts with role, what they control, trust level, linked across observations/businesses/deals.
78. **Interaction timeline per person & business** `[core]` **(R:N28)** — every touch, chronological; dossiers show trajectory, not snapshots.
79. **Relationship decay alerts** `[core]` — "no contact with Rajat (Hotel Alpine) in 45 days"; regional business is maintained, not closed.
80. **Intro-path finder** `[core]` — "who do I know connected to X?" answered from the people graph.
81. **Favor ledger** `[core]` — asked vs. owed per person; the invisible currency of tier-2 business, made visible.
82. **Backlinks everywhere** `[usability]` **(R:N29)** — click any person/business/pattern to see every note and deal it appears in; this is what makes the graph feel like a graph.
83. **Person quick-capture** `[usability]` — `@newname` at capture creates a stub person record to enrich later.

## Part 7 — Analytics, Review & Founder Development

84. **Analytics dashboard** `[core]` **(R:N31)** — capture streak, pattern-velocity trend, win rate, time-in-stage, with lightweight inline SVG charts.
85. **Capture streaks & volume stats** `[usability]` — "volume precedes pattern recognition" is your own mentor line; gamify volume honestly.
86. **Monthly founder review ritual** `[judgment]` — AI-guided: wins, misses, calibration delta, one behavior change; appended to `founder_intel`.
87. **Skill-gap diagnosis** `[judgment]` — Board mines recurring failure causes → "your gap is negotiation, not ideas"; links to JIT lessons.
88. **JIT learning, expanded** `[core]` **(R: existing stub)** — stalled stage triggers a targeted micro-lesson tied to the exact blocking action.
89. **Reading-to-field pipeline** `[core]` — book/podcast insights logged as `#learning` observations, clustered *with* field data so theory meets ground truth.
90. **Year-in-review generator** `[aesthetic]` — annual compounding report: observations → patterns → deals → revenue → lessons; the "better business builder each year" promise, rendered.
91. **Global instant search** `[usability]` **(R:N34)** — across all stores, with highlighting; table stakes past ~50 entries.
92. **Tags & saved filter views** `[efficiency]` **(R:N30)** — founder-defined lenses (industry, geography, trust) without waiting on features.

## Part 8 — Platform, Mobility & AI Infrastructure

93. **Encrypted cross-device sync** `[core]` **(R:N35)** — opt-in E2E sync (Gun.js/WebRTC or export-QR handshake) preserving the zero-backend charter.
94. **Multi-workspace switching** `[usability]` **(R:N38)** — isolated DBs per region/venture; `switchDatabase` already proves the mechanism.
95. **Install prompt + morning notification** `[usability]` **(R:N36)** — guided A2HS; scheduled local notification firing the Morning Briefing.
96. **Model selector per task class** `[efficiency]` **(R:E18)** — Flash-Lite for capture, Flash for clustering, Pro for Board sessions; one dropdown, per-task defaults.
97. **Token meter & call log** `[efficiency]` **(R:E17)** — calls, rough tokens, cost estimate in Settings; the founder pays for the key, show them the bill.
98. **Per-task temperature presets** `[efficiency]` — deterministic for JSON extraction, warmer for tutoring/drafting.
99. **Rate-limit & backoff handling** `[trust]` — free-tier Gemini keys throttle; queue with exponential backoff instead of silent nulls.
100. **Configurable thresholds** `[usability]` **(R:E19)** — thin-data cutoff, min cluster size, batch cap as Settings, since logging cadence varies by founder.
101. **Second-provider fallback** `[trust]` — optional Claude/OpenAI key slot; if Gemini errors twice, route the call; the intelligence layer shouldn't have a single point of failure.

## Part 9 — UX, Aesthetic & Accessibility

102. **Real dark mode** `[aesthetic]` **(R:E7)** — dark token set, `prefers-color-scheme`, manual toggle; field founders work at night, and the docs already promised it.
103. **Command palette, fully real** `[efficiency]` **(R:E6, N37)** — `/` accepts verbs: `/kill`, `/board`, `/predict`, `/person Rajat`, fuzzy entity jump.
104. **Targeted re-rendering** `[efficiency]` **(R:E16)** — update affected containers instead of full `app.render()`; preserve scroll, kill flicker.
105. **Loading states for every AI call** `[usability]` **(R:E4)** — inline skeletons + non-blocking toast; the founder never taps twice.
106. **Offline/keyless banner** `[usability]` **(R:E23)** — quiet strip explaining AI is paused and local fallback is active.
107. **Standardized empty states** `[usability]` **(R:E11)** — icon + one line + primary action, everywhere a cold user can land.
108. **Focus, Esc, and scroll management** `[usability]` **(R:E12)** — focus trap in modals, Esc-to-close everywhere, autoscroll the Tutor.
109. **One-hand bottom-sheet mode** `[usability]` — key actions reachable by thumb; the standing-outside-a-hotel posture is one-handed.
110. **Mobile nav completeness** `[usability]` **(R:E8)** — Discovery and Settings reachable on mobile; fix the "V3 Engine" brand label.
111. **Accessibility pass** `[usability]` **(R:E21)** — aria roles on interactive cards, keyboard operability for `onclick` divs, contrast audit on faint ink.
112. **Design-token & motion polish** `[aesthetic]` **(R:E22)** — consistent spacing/type scale, uniform subtle transitions; the gap between clean and premium.

---

## Sequencing (revised)

- **Phase 5.0 — Trust:** #1–8 (security + backup) before anything else. A compounding engine that can lose or leak its memory is a contradiction.
- **Phase 5.1 — Correctness:** #9–18 (finish the half-shipped fixes, unify scoring/lifecycle, typed AI results).
- **Phase 5.2 — Judgment payload:** #48–62. This phase is what makes North *founder* software instead of notes software — ship it before more capture polish.
- **Phase 5.3 — Intelligence:** #31–47 (embeddings, weekly report, Ask North, Bibles).
- **Phase 5.4 — Execution:** #63–76.
- **Phase 5.5 — Relationships:** #77–83.
- **Phase 5.6 — Review & platform:** #84–101.
- **Continuous:** #102–112 fold in alongside whichever surface each release touches.

**The one-line test for every item (unchanged from your original):** does it help the founder recognize an idea, discover the pattern beneath it, and execute the next highest-leverage move — faster than they could without it? Items #48–62 pass that test hardest, and they're the ones no competitor's notes app will ever bother building.

---

## Part 10 — UI/UX Enhancements (#113–162)

> Grounded in North's actual surfaces (capture modal, Morning Briefing, Opportunity page, Tutor sidebar, Pipeline Map, Dossiers, Settings) and in proven interaction patterns from best-in-class products (Linear, Things 3, Superhuman, WhatsApp, Gmail, GitHub, iOS/Material guidelines). No duplication with #102–112.

### Capture experience

113. **Optimistic save with undo toast** — save locally the instant the founder hits enter; show a 5-second "Captured · Undo" toast (Gmail-style) instead of any confirmation dialog. AI enrichment happens after, invisibly.
114. **Draft persistence** — if the capture modal is dismissed accidentally (back gesture, call comes in), the text survives and restores on reopen. Nothing typed in the field is ever lost.
115. **Recent-captures strip** — last 3 notes shown faintly below the input; prevents accidental duplicates and gives a sense of session continuity.
116. **Post-capture suggestion chips** — after save, one-tap chips: "Link to Hotel Alpine?" "Tag #hospitality?" "Mark urgent?" — enrichment as taps, never as form fields.
117. **Auto-expanding textarea** — grows with content, never scrolls internally under ~6 lines; the note is always fully visible while writing.
118. **Smart input modes** — `inputmode="decimal"` when a ₹ context is detected, so the numeric keypad appears for prices.
119. **Haptic tick on save** — a single `navigator.vibrate(10)` confirms capture without looking at the screen; eyes stay on the street.
120. **Voice waveform feedback** — live amplitude bars while dictating, so the founder knows the mic is hearing them before they check the transcript.

### Navigation & information architecture

121. **Scroll-position memory** — every view remembers its scroll offset via history state; returning from a detail page lands exactly where you left.
122. **Swipe-back gesture** — edge-swipe returns to the previous view on mobile, matching iOS/Android muscle memory.
123. **Long-press quick actions on bottom nav** — long-press Capture for voice capture, long-press Map for "closest to revenue" (Material shortcut pattern).
124. **Pull-to-refresh on feeds** — Discovery and Patterns refresh with the universal gesture, running the pattern engine on release.
125. **Recently-viewed strip on the Desk** — last 3 entities as small chips; founders bounce between the same 2–3 deals constantly.
126. **Pin to top** — star an opportunity or business to pin it above the fold on Map and Dossiers.
127. **Segmented filter control** — Active / Paused / Archived as a thumb-reachable segment control (iOS pattern), replacing dropdowns.
128. **Swipe actions on list rows** — swipe right to advance stage, swipe left to archive (Mail pattern), with color + icon revealed under the row and undo toast after.

### Reading & scanning

129. **Progressive disclosure cards** — cards show a 2-line summary; tap expands in place with animation rather than navigating away. Reading stays in flow.
130. **Relative timestamps** — "2h ago" / "3d ago" everywhere, absolute date on tap; recency is the signal that matters in field data.
131. **Indian digit grouping** — all money renders as ₹1,50,000 via `Intl.NumberFormat('en-IN')`; ₹150000 reads wrong to the only user who matters.
132. **New-since-last-visit markers** — a subtle dot on patterns/opportunities that changed since the founder's last session (Slack unread pattern); the Morning Briefing becomes scannable in 10 seconds.
133. **Inline entity chips** — `@person` and business names render inside note text as tappable pill chips linking to their records; the graph becomes visible in the prose itself.
134. **Reading-width cap** — text-heavy views (Bibles, briefs, post-mortems) capped at ~68ch on desktop; full-bleed paragraphs are unreadable.
135. **Smart truncation** — long titles ellipsize at line 2 with full text on long-press; layout never breaks from a verbose note.

### Feedback & micro-interactions

136. **Skeleton screens matching final layout** — AI-loading states mirror the shape of the content they're fetching (card skeletons, not spinners); perceived speed doubles.
137. **Shimmer on the enriching card** — when AI is processing a specific opportunity, that exact card shimmers; the founder sees *where* the machine is working.
138. **Stage-advance moment** — advancing a stage triggers a brief, satisfying progress-bar fill + check (Things 3 completion feel). The core loop's most important action deserves its most polished animation.
139. **Toast system with actions** — one consistent toast component: message + optional action (Undo, View, Retry); replaces every `alert()` in the app.
140. **Pressed-state scale** — buttons and cards scale to 0.97 on press with a fast spring; touch feels physical.
141. **Inline error recovery** — every failed AI call renders a compact error state *in place* with a Retry button; the founder never has to guess what died or re-navigate.
142. **Reduced-motion respect** — all animation behind `prefers-reduced-motion`; polish that can be turned off is polish that can be trusted.

### Data visualization

143. **Momentum sparklines** — a tiny 30-day sparkline on each pattern card; trend is visible at a glance without opening anything.
144. **Explainable score bar** — leverage/velocity/conviction as a stacked segment bar with tap-to-reveal reasoning; the score becomes an argument, not a number.
145. **Pipeline funnel** — a compact funnel at the top of the Map showing count per stage; clogs become visually obvious.
146. **Capture heat calendar** — GitHub-contribution-style grid of daily capture volume; streaks and dry spells at a glance.
147. **Confidence rings** — prediction confidence and founder calibration rendered as small progress rings, not raw percentages.

### Typography & hierarchy

148. **Editorial display face for Bibles & reports** — a characterful serif for Industry Bible and Weekly Report headers only; the founder's compounded knowledge should *look* like a publication, distinct from UI chrome.
149. **Tabular numerals for all metrics** — `font-variant-numeric: tabular-nums` on scores, money, and dates so columns align and tickers don't jitter.
150. **Label + icon pairing rule** — destructive and stage-changing actions always carry a text label; icon-only buttons reserved for universally understood actions (close, search).
151. **Eyebrow labels for context** — small uppercase eyebrows ("EMERGING PATTERN", "STAGE 3 · DELIVERY") above titles encode entity type and state before the reader parses a word of content.

### Mobile ergonomics

152. **Capture FAB in the thumb zone** — a floating capture button bottom-right on mobile, present on every view; the 30-Second Rule starts with zero reach.
153. **Bottom sheets over centered modals** — capture, filters, and quick actions slide from the bottom on mobile (draggable, dismissible by swipe); centered modals are a desktop pattern.
154. **Safe-area insets** — `env(safe-area-inset-*)` padding so the bottom nav and FAB clear gesture bars and notches on modern phones.
155. **48px touch-target audit** — every interactive element hits the minimum; misplaced taps in the field are captured observations lost.

### Context & personalization

156. **Time-aware Desk** — morning shows the plan (due actions, spearhead); evening shows the recap (today's captures, one reflection prompt). Same view, two moods, matching the founder's actual day.
157. **Density toggle** — comfortable/compact modes; a founder with 40 opportunities scans differently than one with 4.
158. **Reorderable Desk sections** — drag Morning Briefing blocks into the founder's own priority order, persisted in settings.

### Trust & delight

159. **Interactive first-run with self-deleting sample data** — a 90-second guided tour on seeded demo entities that wipe themselves after the founder's 5th real capture; cold start becomes a lesson, not a blank page.
160. **Tasteful milestone moments** — first pattern formed, first sale recorded: one brief celebratory animation, once, never repeated. Mark the moments that matter.
161. **Field-mode empty state** — when the archive is thin, the empty Desk shows a quiet compass animation and one line: "Patterns need fuel. Go capture three things you noticed today." The empty screen is an instruction, not an apology.
162. **Print/PDF stylesheet for dossiers & weekly reports** — a `@media print` pass so a dossier or Sunday report can be shared with a partner or investor as a clean one-pager; the first moment North's output leaves the founder's phone.

---

## Part 11 — The Dual-Brain Playbook Engine (#163–175)

> Two new AI personas layered over the Board. **The Operator** (Harshad-Mehta-style market brain: spots structural angles, arbitrage, timing, capital flows) and **The Strategist** (Shelby-style maneuvering brain: territory, relationships, leverage, moving first). Operating doctrine baked into every prompt: **sharp, not dirty.** The personas play to the legal limit — information asymmetry, speed, relationship cultivation, perception management, hardball negotiation, exploiting incumbents' laziness. Hard stops are only the genuinely illegal: bribery, fraud, insider/confidential government info, forgery, misrepresentation, coercion. Anywhere near a line, the persona names the risk plainly and hands you the sharpest *lawful* version of the same move.

163. **Persona engine** — two system prompts stored in `data/` as editable text; each takes an opportunity + linked observations + people graph as context. Operator outputs: market structure, who profits at each layer, timing windows, capital math. Strategist outputs: stakeholder power map, alliance sequence, first-mover moves, negotiation posture.
164. **Opportunity Playbook generator** — one button on any opportunity → a saved playbook doc: (a) 5–7 monetization angles ranked by founder-fit, (b) stakeholder map, (c) first-72-hours action list, (d) contact-research checklist, (e) positioning vs. incumbents, (f) capital & breakeven sketch.
165. **News-to-opportunity ingestion** — paste a news snippet/URL text ("satellite city near Chandigarh", "Baddi-Nalagarh drug park", "new NH corridor") → AI extracts the development, second-order effects (land services, rentals, logistics, suppliers, content, staffing), and spawns a structured opportunity per angle worth pursuing.
166. **Territory Watch** — standing topics (drug park, NH alignment, satellite city) as pinned watchlists; new observations tagged to a territory auto-update its playbook and re-rank angles.
167. **Stakeholder mapper** — playbooks generate a who-decides/who-influences grid (officials by office not name, industry bodies, brokers, incumbents) wired into the People store as stub records to fill from field research.
168. **Contact-research checklist** — per playbook: the legitimate public sources to work — govt press releases, tender portals (HP e-tenders), industry association directories, RERA filings, LinkedIn, local CA/broker/bar networks, public consultations — each as a tickable task.
169. **First-mover checklist** — monitor tenders and EOIs, attend public hearings, register on vendor lists, secure the boring assets early (rentals near a coming site, supplier relationships, a niche website that ranks before competitors care).
170. **Deal-closing kit** — for service opportunities (e.g., wedding videography): outreach scripts by channel, pricing anchors with a 3-tier package, objection-handling lines, follow-up cadence, and a close checklist — generated from the founder's actual portfolio context.
171. **Incumbent displacement brief** — Strategist analyzes existing players' weaknesses from the founder's observations and proposes a wedge (speed, package, niche, geography) rather than head-on competition.
172. **Political & institutional access, the legal way** — playbooks include an "access ladder": public grievance portals, MLA/MC public office hours, industry association membership, CSR/event sponsorship, press coverage — plus the greyer-but-lawful layer: being useful to powerful people before asking anything (free content, event coverage, introductions), cultivating clerks and PAs who control calendars, sponsoring the right local events, and being physically present where decisions socialize. The persona draws its line only at paid influence and confidential leaks — and says so while offering the lawful equivalent.
173. **Playbook → pipeline wiring** — every playbook action item can be promoted to a `next_action` with a due date; playbooks are execution documents, not essays.
174. **Persona debate on big bets** — for opportunities above a founder-set stake threshold, Operator and Strategist argue sequencing (capital-first vs. relationships-first) before the Board verdict.
175. **Playbook refresh on evidence** — new linked observations or resolved predictions trigger a "playbook stale" badge and one-tap regeneration with a diff of what changed.
