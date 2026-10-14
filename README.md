# Forbidden Rin — complete editable project export

Exported from published version 11, source commit `3310059633083da9c579756aac284c33d5d07bc7`.
Original site: https://forbidden-rin.foggyeft7.chatgpt.site

## Current entrance and reading view

The site now opens in the illustrated reading room with the book resting on the desk. Trees, water, leaves and sunlight move until paused. Activating the book opens its cover, turns five pages, moves the camera toward the open spread, and enters the Story reader without a white flash. The original overhead desk artwork is reused for the second part of the camera sequence and the reading background.

`dist/room-reader.css` positions the desk book and styles the reader as a bound paper spread. Desktop shows the title/contents leaf beside the reading leaf; small screens use a single-column layout for readable text. Chapters, bookmarks, font size, night reading, Author’s Desk and the other views remain available. Return to the room resets the sequence, and reduced motion enters reading directly.

The ZIP and `EXPORT-MANIFEST.json` preserve the original export; their hashes describe that snapshot, not subsequent development edits. The editable website is `dist/`.

## Install and run locally

This is a buildless website: **plain HTML, CSS and JavaScript**, with all runtime assets included. The `dist/` directory contains the actual editable source, not compiled or minified framework output. There is no React project, package.json, node_modules, npm installation, API key or backend requirement.

1. Extract this ZIP and open the `forbidden-rin` folder in Codex or your editor.
2. Install Python 3 if it is not already installed.
3. Open a terminal in this folder and run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

On Windows, use:

```powershell
py -m http.server 8000 --bind 127.0.0.1 --directory dist
```

4. Visit http://localhost:8000 in a modern browser. Click the book to start the opening sequence and unlock audio playback. Use the Sound control if your saved preference is muted.
5. Stop the server with Ctrl+C.

Use a local HTTP server, rather than double-clicking index.html: the app fetches `book.json`.

## Build and deployment

**No build step is required.** Edit files directly in `dist/` and refresh the browser. The complete deployable output is the existing `dist/` directory. A static host should use `dist` as its publish directory with no install or build command. The routes are URL hashes and require no special server routing.

The original `.openai/hosting.json` is preserved for provenance and existing Sites configuration. It refers to the original live website. Running this copy locally does not deploy anything. Do not run a Sites publication workflow targeting that ID unless you intentionally want to update the original website.

## Continue in Codex and GitHub

Open the extracted project folder in Codex. Ask it to read this README and inspect `dist/` before making changes. To start a new GitHub repository from this snapshot:

```sh
git init
git add .
git commit -m "Import complete Forbidden Rin website"
git branch -M main
```

Create an empty GitHub repository, add its URL with `git remote add origin YOUR_REPOSITORY_URL`, then run `git push -u origin main`. No existing Git remotes, access tokens, or authentication settings are included in the export.

## What is included

- Every tracked source/configuration file from the source commit above.
- All HTML, CSS, JavaScript, inline SVG graphics and icons, images, backgrounds, and audio in `dist/`.
- All four views (Home, Story, Characters, World), Author’s Desk, imports/exports, preferences, bookmarks, music controls, and reduced-motion behavior.
- The opening book animation, hover/focus glow, camera transitions, garden effects, steam, light, particles, and scene performance changes exactly as coded.
- Active three-minute music loop, cinematic sound effects, earlier original music tracks, and their composition scripts.
- Artwork generation records and the original project README in `docs/README.original.md`.
- `EXPORT-MANIFEST.json`, containing SHA-256 hashes of the original repository files.

No website source or asset was redesigned or recreated for this export. Only export documentation, an ordinary `.gitignore`, and the manifest were added; this README has export instructions prepended. The untouched original README is also included.

## Browser-only content and fonts

No repository files or referenced runtime assets were missing. The published `dist/book.json` currently has no chapters, characters, or map image. This matches the source; it is not an export omission.

Unpublished Author’s Desk edits, imported portraits/maps, reading progress, and preferences may exist only in localStorage in your browser on the original website. This workspace cannot read that browser storage. To move any such drafts, open Author’s Desk on the original website, choose Export content, then Import that JSON into the locally running copy. To make that content the new repository default, save the exported content as `dist/book.json`. Keep the original website unchanged. Browser preferences and bookmarks are separate from the content export and do not transfer automatically.

Fonts use the original system-font stack (Palatino/Book Antiqua, Iowan Old Style/Baskerville/Georgia, Avenir Next/Segoe UI/Arial). There are no bundled or remotely downloaded font files in this project. The same browser, device fonts, viewport and preferences give the closest visual match; different operating systems may select different fallback fonts just as on the live website.

Original illustrations are raster WebP assets plus editable SVG cover/icon art. No layered Photoshop/Illustrator originals exist in the source repository. The full image files used by the website and generation records are included.

## Optional audio-authoring dependencies

Playback needs no audio-authoring packages. The archived Python composition scripts require Python 3 and NumPy (`python3 -m pip install numpy`). They produce WAV files; FFmpeg can encode those as MP3. Existing finished audio is included and does not need regeneration. The current uploaded-song loop is `dist/assets/fantasy-novel-loop.mp3`.

## Verification

The export was compared byte-for-byte with every tracked file in the source checkout (the original README is preserved separately), local asset references were checked, and ZIP integrity was checked. Runtime JavaScript syntax was checked. No live site files were modified and no deployment was performed. This export did not introduce a browser visual/performance retest.

---

## Original project documentation

# Forbidden

A buildless, responsive fantasy book website. The original site's two illustrations are optimized into `dist/assets/`.

## Content

`dist/book.json` contains the canonical book title, author, tagline, chapters, character profiles, and map. No manuscript, character canon, or map has been supplied yet; the corresponding arrays are intentionally empty.

The Author's Desk lets the owner preview chapters, portraits and a map in this browser. Drafts are browser-local, with JSON export/import. To publish them for every visitor, export the JSON, replace `dist/book.json` with that content, and deploy an updated Site. Never treat browser-local edits as deployed changes.

Chapter schema: `{ "id": "unique-id", "title": "Chapter title", "subtitle": "", "text": "Plain text, with blank lines between paragraphs." }`.

Character schema: `{ "id": "unique-id", "name": "Name", "role": "", "quote": "", "description": "", "image": "asset URL or a local image data URL" }`.

Map schema: `{ "image": "asset URL or local image data URL", "title": "Map title", "description": "", "locations": [{ "id": "unique-id", "name": "Location name", "description": "", "x": 50, "y": 50 }] }`. Coordinates are percentages of the image width and height.

All imported text is rendered with DOM text nodes. Imported image URLs are limited to HTTPS, same-site paths and supported raster image data URLs. There are no external runtime dependencies.

The entrance begins in a top-down view of a sunlit desk, with a solid navy-and-gold book at its center. Clicking lifts the book, pulls back into the existing room, opens the cover and turns five pages, then flashes white into the home screen. `entrance.css` owns the sequence and uses flat, opaque cover and paper planes, without 3D backfaces or depth sorting. The opaque right page remains underneath every cover/page turn. The cover artwork is a native SVG with an opaque base rectangle; the book title and author remain editable text.

The sequence has explicit stages at 650 ms (room reveal), 2050 ms (cover open), 3150 ms (page flips), and 4450 ms (white flash). The home screen is revealed only after the white overlay reaches full opacity. Skip, navigation, and replay cancel all queued stages; repeated clicks cannot start duplicate timelines. Keyboard Enter and Space work like clicking. Reduced-motion settings skip the cinematic and flash. Environmental motion can be paused separately, and replay restores the overhead desk and closed cover.

The two camera views are `dist/assets/overhead-desk.webp` and the existing `dist/assets/reading-room-v2.webp`. The book is centered independently of background cropping and scales to fit small or short screens. Sunlight and soft leaf shadows move over the overhead desk. `desk-atmosphere.js` draws continuously deforming steam curls, expanding vapor puffs, moving sunbeams and light motes on a canvas aligned with the artwork. Steam originates at (430, 272). It uses requestAnimationFrame and caps rendering resolution to limit graphics work. The motion control reports the effective pause state, including the operating system preference; explicitly selecting Resume enables the canvas motion. Pause, hidden tabs and leaving the entrance stop the animation loop. Replay resumes it. The overhead image and its atmosphere share one wrapper so they stay aligned while fading and pulling back. Both effects honor the environmental pause control and reduced-motion settings. During the room reveal, the room background and garden effects share one wrapper so their positions stay aligned.

`garden.css` and `living-scene.css` animate image layers within feathered masks around the tree canopies, flower beds, and sky. The stream has a small animated displacement filter plus flowing highlights. Falling leaves stay clipped to the doorway. In the room, sunlight and dappled leaf shadows move slowly across the lit walls, floor and desk, with a few dust motes in the sunbeams. The introductory copy and its separate opening button have been removed. The book itself opens with click, tap, Enter, or Space.

Motion controls in the intro and home header stay synchronized. The browser-local pause preference and reduced-motion settings stop the decorative animations; the SVG water filter also pauses through `pauseAnimations()`. SVG water motion pauses while the page is hidden. Filters and lighting layers are separate from the opaque book planes.

Artwork was recreated with the built-in Image Generation tool from the original room image. The prompt and generated asset details are tracked in `tools/room-art-generation.json`; the original `reading-room.webp` is retained. The overhead camera artwork is recorded in `tools/overhead-art-generation.json`.

`dist/assets/fantasy-novel-loop.mp3` is the active music, processed from the user-uploaded `extracted_audio.mp3` (181.464 seconds, stereo 48 kHz). It contains a 180-second repeating cycle at 192 kbps. The 1-second tail from 180–181 seconds crossfades into 0–1 seconds, following the main segment from 1–180 seconds. This rotates the start by one second to smooth the wrap without shortening the three-minute cycle. The HTML audio element loops it continuously. Existing mute/volume controls, intro ducking, hidden-tab pause, and saved preferences are retained. Earlier original scores remain archived in assets.

`dist/assets/book-cinematic.mp3` is an original 6.8-second stereo sound-effects track from `tools/compose-intro-sfx.py`. Its cues match the entrance: airy levitation at 0 ms, a binding creak at 2050 ms, five page rustles at 3150/3370/3590/3810/4030 ms, and a gentle magical pull at 4450 ms that peaks as the screen reaches white at 4930 ms. Its tail fades into the home screen. Regenerate it if stage timings change. The preloaded track starts inside the book click/keyboard gesture; reduced-motion entry omits it. Music briefly lowers to 62% of its selected level, then smoothly returns during the final shimmer. The shared Sound control and volume slider control both tracks. Mute keeps the effect timeline moving silently, so unmuting does not restart old cues. Skip, replay, navigation during the intro and hiding the tab stop and rewind the effects. Normal flash completion permits the final shimmer to finish. Playback rejection restores normal music volume and does not block entry.


The opening book has a prepainted gold hover/focus halo, fading with opacity. Camera positioning uses transforms rather than animating top. Camera transitions pause atmospheric canvas and room effects; the overhead canvas remains stopped once its scene fades out. Hidden room SVG animation is paused until needed and on exit. Full-screen animated brightness filters are replaced by the existing moving sunlight layers; canvas steam avoids per-stroke blur and paints at 30 fps. Artwork is decoded during startup. Navigation fades incoming content with opacity and respects reduced motion. Replay restores the overhead effects and resets transition flags.
