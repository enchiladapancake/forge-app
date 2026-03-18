# The Forge

The Forge is a fully local MVP productivity RPG built with React and Vite. It turns productive sessions into XP, project levels, category progression, quest rewards, and overall Mylo Level progress.

The app now supports local setup presets and profile-backed structure customization. The original Mylo setup is preserved as a first-class built-in preset, and brand-new users can start from other presets or a blank canvas.

## Run locally

1. Install Node.js 18+.
2. Open this folder in a terminal.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local Vite URL shown in the terminal.

## Deploy

### Vercel

1. Import this repo/project into Vercel.
2. Keep the default framework as `Vite`.
3. Use the default build command `npm run build`.
4. Use the default output directory `dist`.
5. Deploy.

`vercel.json` is already included so client-side routes like `/road`, `/daily-road`, `/projects/:projectId`, and the other app sections rewrite back to `index.html` correctly.

### Notes

- The app is fully local-first and stores progress in the browser's `localStorage`, so each browser/device keeps its own save unless the user uses Export/Import.
- The app now includes a lightweight service worker and installable web-app manifest, so after deployment on HTTPS you can install it from supported browsers.
- If you deploy under a subpath instead of the site root, update the Vite base path in `vite.config.js` before deploying.
- Node.js 18+ is the intended runtime for local install/build.

## MVP features

- Dashboard with Mylo Level, category summaries, projects, daily quests, habits, recent note, and activity feed
- Project detail view with progress, logs, and achievements
- Session logging with duration, date, tag, and note
- XP calculation with project rates, diminishing returns, and active streak bonus
- Leveling for projects, categories, and overall account
- Daily quest claiming and daily habit check-offs
- Local persistence with `localStorage`
