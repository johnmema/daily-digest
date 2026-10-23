# Daily Digest cover-flow prototype - transfer notes

## What this is
Interactive mockup of the Daily Digest as a snap-scrolling cover flow, built per John's annotated screenshots and follow-up corrections. Published reference: https://files.instinct.com/7ztqybgfx0ln-the-daily-digest-as-a-cover (PRIVATE).

## Contents
Vite + React + TS app. `src/App.tsx` (all logic), `src/style.css` (all styling), `src/editions.json` (11 editions, No. 46-36: real titles, subtitles, dates, read times, full body prose + tables pulled from https://readsomethingnew.vercel.app), `src/photos/ed36..46.jpg` (cover photos), `src/photos/preview.png` (link-preview card image only, not used by the app).

## Flow behavior (all verified on phone 390px + desktop 1280px)
- `.flow` = native CSS scroll-snap (y mandatory, snap-stop always), one `.panel` per edition, 100dvh each. No custom smooth-scroll engine (TSJ's custom engine stalled in testing; native snap chosen deliberately).
- Per-edition background color wash via IntersectionObserver (threshold 0.55) swapping `.flow` backgroundColor with a 0.7s transition. Colors per edition in editions.json: bg (wash), cover (deep color = spine), ink (unused on covers now).
- Corner readouts OUTSIDE the cover: `.readout.date` bottom-left, `.readout.num` bottom-right, per panel. John explicitly wants these; do NOT remove.
- Cover = photo (`.ph`, object-fit cover, inset left by spine width) + `.spine` (left colored column, edition deep color) + `.scrim` (bottom gradient for text legibility) + `.ctitle` (bottom-left, white, text-shadow). Nothing else on the cover: John removed the masthead ("The Daily Digest"), the hint ("Scroll - tap a cover to read"), and the date/issue printed on the cover.
- Tap cover -> open mode: only that panel renders (openIdx; others return null - prevents stale covers/pills after essay end). `.panel.open` grows to fit content: small cover (`.cover.small`) on its color band, then `.sheet` (ivory) with meta line, title, lede, body (h2/p/ol/ul/blockquote/tables), optional `.credit`, then `.next` button ("Next: No. N - Title") or "Back to the covers" on the last. Close via fixed `.closepill`, Escape key, or tapping the small cover.
- `.closepill` is at top:76px on purpose: the Instinct File viewer's compact sticky header overlaps the top ~24-70px of the iframe viewport after the outer page scrolls. Do not move it back up.
- Viewer constraint: the File renders in a cross-origin iframe with a ~264px host header on first phone view (collapses to compact bar after first scroll). App cannot remove it; `.stage` is min(580px,100%) so cover+readouts fit the first viewport. Keep key UI inside the top ~580px of each panel.
- Desktop title sizing: ctitle clamp(28px,2.6vw,38px) - smaller cap chosen so "The Science of GLP-1" doesn't split after the hyphen at 1280px.

## Photo sources and licenses
- No. 36-44, 46: Unsplash free license (https://unsplash.com/license - free for commercial/non-commercial, no permission or credit required). Photo pages (author/source): see photos-sources.txt. All Unsplash+ premium/watermarked candidates were rejected on purpose.
- No. 45: CC BY 2.0, "Lorena Cupcake", https://www.flickr.com/photos/22901150@N00/3905485341 (via Openverse). ATTRIBUTION REQUIRED - currently rendered as the `.credit` line at the end of No. 45's essay. Keep that line or equivalent wherever the image is used.
- Photos were selected for emotional/editorial pull per John's direction ("nice professional pictures... with some emotion", "not text or empty"). Treat as curated mockup selections; production covers would be commissioned/generated.

## Scaffolding
The project dir is `src/` only (main.tsx is the Vite react-ts template entry importing App + style.css). To run: drop `src/` into a fresh `npm create vite@latest dd -- --template react-ts` project, `npm i`, `npm run dev`. No other dependencies.
