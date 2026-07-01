# DECISION JOURNAL

## 1. LocalStorage vs IndexedDB
- **Date:** 2026-07-01
- **Problem:** Need offline data storage for complex objects.
- **Alternatives:** IndexedDB, SQLite (WASM).
- **Chosen Solution:** `IndexedDB`.
- **Reasoning:** We originally used `localStorage` for extreme simplicity, but migrated to `IndexedDB` in V4 because `localStorage` was blocking the main thread on large JSON parsing and hitting size limits. IndexedDB provides a fully asynchronous, scalable offline database while remaining native to the browser.
- **Tradeoffs:** More complex async API (promises).
- **Review Date:** N/A (Migrated in V4)

## 2. Vanilla JS vs Frameworks
- **Date:** 2026-07-01
- **Problem:** Choosing a frontend architecture.
- **Chosen Solution:** Vanilla JS (No build step).
- **Reasoning:** Eliminates dependency rot. Ensures the founder can open `index.html` locally 10 years from now and it will still run perfectly.
