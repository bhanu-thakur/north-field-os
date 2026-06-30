# CODING GUIDELINES

1. **Zero Dependencies:** No React, Vue, Tailwind, Webpack, or Vite.
2. **The 30-Second UX Rule:** UI elements must be massive (48px+ tap targets), high contrast, and accessible with one thumb.
3. **Global Namespace:** Bind core modules to `window.NF = window.NF || {};` to allow modular loading without a bundler.
4. **Data Isolation:** All data interactions must go through the `NF.Store` wrapper around `localStorage`. Do not call `localStorage` directly in UI components.
5. **No White Screens:** If a route fails or data is missing, fail gracefully to the Mission Console with an error pill, never a blank screen.
