# Hebrew Typing Trainer — Project Spec

## Goal
A simple, free, no-login, no-backend web app that teaches people to type
common Hebrew words. Must work great on both desktop and mobile browsers.
Deploy target: Cloudflare Pages, as a static site, under a subdomain of
wiseberg.net (e.g. `type.wiseberg.net` or `hebrew.wiseberg.net`).

## Hard constraints
- **Zero backend.** No server, no database, no login/accounts, no API calls
  to anything at runtime. Pure static HTML/CSS/JS.
- **Zero build step preferred.** Plain HTML/CSS/vanilla JS so the repo can be
  deployed to Cloudflare Pages with no build command (Framework preset: None,
  Build command: empty, Output directory: `/`). If a tiny bundler is truly
  needed, keep it minimal and document the exact build command in README.
- **Low maintenance.** No dependencies that need regular updates for security.
  No analytics/tracking. No cookies.
- **Mobile-first responsive.** Must be fully usable on a phone screen,
  including the typing input method (see below).
- **RTL correctness.** Hebrew text must render right-to-left correctly
  everywhere (word display, input field, keyboard layout).

## Core feature: typing practice loop
1. Show a target Hebrew word (large, clear, RTL) plus its English meaning
   and a simple transliteration underneath (helps beginners).
2. User types the word. Support BOTH:
   - Physical/system keyboard input (if the user has a Hebrew layout enabled
     on their OS/phone) via a normal text input, AND
   - An on-screen virtual Hebrew keyboard (tap-to-type) for users who don't
     have Hebrew enabled on their device — this is essential for mobile and
     for actually teaching the standard Israeli keyboard layout. Map it to
     the real Hebrew keyboard layout (e.g. ת=5th row/t key position etc. —
     use the standard Israeli PC layout mapping of Hebrew letters to QWERTY
     key positions, since that's what "learning to type in Hebrew" usually
     means for English keyboard users).
3. Live feedback as they type: correct letters highlighted one color,
   incorrect another, matching target word, like typing-test apps.
4. On word completion: show accuracy %, and a short "great job / try again"
   style result, then auto-advance to next word (or button to continue).
5. Track running session stats (words completed, accuracy, speed) — store
   in `localStorage` only, no accounts. Reset button to clear local stats.

## Word data
- `data/words.json`: an array of objects like:
  ```json
  { "hebrew": "שלום", "transliteration": "shalom", "english": "hello / peace", "rank": 1 }
  ```
- Seed with ~100-150 of the most common modern Hebrew words (mix of function
  words — pronouns, prepositions — and common nouns/verbs/adjectives), each
  with accurate transliteration and English meaning. Verify Hebrew spelling
  is correct standard (no niqqud needed — plain consonantal text, since
  that's what's actually typed day to day).
- Order words roughly by frequency/difficulty; let the game progress through
  them in order by default, with a "shuffle" / "practice all" mode too.

## UI/UX requirements
- Clean, minimal, single-page app. Big readable Hebrew font (e.g. system
  Hebrew-capable font stack, or a free webfont like Noto Sans Hebrew loaded
  locally — do NOT depend on a live CDN at runtime if avoidable; if a
  webfont is used, self-host the font file in the repo).
  Prefer OS-native Hebrew font fallback (`"Arial Hebrew", "Noto Sans Hebrew", sans-serif`) to avoid any extra network dependency — keep it simple.
- Works great one-handed on a phone: big tap targets on the virtual
  keyboard, no horizontal scrolling, no tiny text.
- Light/dark mode support is a nice-to-have, not required.
- No sign-up, no ads, no external trackers.

## Deployment
- Plain static site deployable to Cloudflare Pages directly from this git
  repo with zero config (no build command, root `/` as output).
- Include a short `README.md` section: "Deploying to Cloudflare Pages" with
  exact steps (connect repo in Cloudflare dashboard → Pages → set build
  command to none / output dir `/` → add custom subdomain under
  wiseberg.net via Cloudflare DNS CNAME to the generated `*.pages.dev`
  Pages URL).

## Out of scope (don't build)
- Accounts, login, server-side anything, databases, payment, multiplayer,
  analytics, ads.

## Deliverables
- `index.html`, `style.css` (or `css/style.css`), `app.js` (or `js/app.js`),
  `data/words.json`, `README.md` with deploy instructions, `.gitignore`.
- The app must actually run correctly when opened via a local static file
  server (e.g. `python3 -m http.server`) — verify this works before
  finishing.
