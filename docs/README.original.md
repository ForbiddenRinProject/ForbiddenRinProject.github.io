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
