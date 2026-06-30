# DECISION JOURNAL

## 1. LocalStorage vs IndexedDB
- **Date:** 2026-07-01
- **Problem:** Need offline data storage for complex objects.
- **Alternatives:** IndexedDB, SQLite (WASM).
- **Chosen Solution:** `localStorage`.
- **Reasoning:** Extreme simplicity, zero async overhead for initial versions, perfectly synchronous UI updates.
- **Tradeoffs:** 5MB limit. Cannot query large datasets efficiently.
- **Review Date:** When payload exceeds 2MB (approx. 20,000 observations). We will migrate to IndexedDB then.

## 2. Vanilla JS vs Frameworks
- **Date:** 2026-07-01
- **Problem:** Choosing a frontend architecture.
- **Chosen Solution:** Vanilla JS (No build step).
- **Reasoning:** Eliminates dependency rot. Ensures the founder can open `index.html` locally 10 years from now and it will still run perfectly.
