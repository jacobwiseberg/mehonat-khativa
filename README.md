# Mehonat Khativa (מכונת כתיבה)

A free, no-login web app for learning to type the 500 most common Hebrew words. "Mehonat khativa" means "typewriter" in Hebrew. It works on phones and desktops.

- **100% static.** Plain HTML, CSS and vanilla JS. No build step, no backend, no dependencies.
- **No accounts, cookies, analytics or ads.** Stats and progress are stored only in your browser's `localStorage`.
- **On-screen Hebrew keyboard** laid out like the standard Israeli PC keyboard (SI-1452), so you learn where each letter actually sits.
- **RTL-correct** word display and input field.

## How it works

1. A Hebrew word appears in large type, with its transliteration and English meaning underneath.
2. Type it in any of three ways:
   - **Tap the on-screen keyboard.** This is the default on phones, and the OS keyboard stays hidden.
   - **Use your device's Hebrew keyboard.** Turn off "Show on-screen Hebrew keyboard" in Settings.
   - **Use a physical keyboard with an English layout.** With "Treat English-layout keystrokes as Hebrew" on (the default), pressing the physical key where a Hebrew letter lives types that letter. For example, `T` types `א` and `,` types `ת`.
3. As you type, each letter turns green if it's correct or red if it's wrong. The next key to press is highlighted on the on-screen keyboard (you can turn this off).
4. When you finish a word, you see your accuracy and speed. A perfect word moves on to the next one automatically. Otherwise you can choose **Try again** or **Next**.
5. The stats bar shows words completed, overall accuracy, WPM (5 characters = 1 word) and the number of perfect words. Use **Settings → Reset stats** to clear them.

Words appear in rank order (roughly most common and easiest first) by default. Choose **Shuffle (practice all)** in Settings to practice them in random order.

### Keyboard layout reference (Israeli standard)

| QWERTY | q | w | e | r | t | y | u | i | o | p |
|---|---|---|---|---|---|---|---|---|---|---|
| Hebrew | / | ' | ק | ר | א | ט | ו | ן | ם | פ |

| QWERTY | a | s | d | f | g | h | j | k | l | ; | ' |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Hebrew | ש | ד | ג | כ | ע | י | ח | ל | ך | ף | , |

| QWERTY | z | x | c | v | b | n | m | , | . | / |
|---|---|---|---|---|---|---|---|---|---|---|
| Hebrew | ז | ס | ב | ה | נ | מ | צ | ת | ץ | . |

The on-screen keyboard is drawn left to right because it mirrors physical key positions. All Hebrew text in the app is right to left.

## Running locally

The app loads `data/words.json` with `fetch()`. Browsers block that on `file://` URLs, so serve the folder over HTTP:

```sh
python3 -m http.server 8787
# then open http://localhost:8787/
```

## Editing the word list

`data/words.json` is an array of 500 objects, ranked by frequency from the [OpenHebrew frequency list](https://openhebrew.net/en/learn/frequency):

```json
{ "hebrew": "שלום", "transliteration": "shalom", "english": "hello / peace", "rank": 1 }
```

- Write Hebrew without niqqud (plain consonantal spelling, as people actually type it). Any niqqud is stripped automatically.
- Use the correct final letter forms (ך ם ן ף ץ). The trainer checks them exactly, just like real typing.
- `rank` controls the default order, lowest first.
- Verbs are given in the masculine singular present tense, and numbers in the feminine (counting) form.

## Deploying to Cloudflare Pages

There's no build step. Cloudflare serves the repository root as-is.

Target URL: `wiseberg.net/mehonat-khativa`. All asset paths in this app are
relative (`css/style.css`, `js/app.js`, `data/words.json` — no leading `/`),
so it works correctly at any subpath, not just a domain root.

**Important:** Cloudflare Pages attaches a custom domain to the *root* of a
project. It can't give one Pages project a subpath (like `/mehonat-khativa`)
of a domain whose root is already served by a different Pages project
(`wiseberg.net`'s own Hugo site). There are two ways to actually land this
app at `wiseberg.net/mehonat-khativa`:

### Option A — fold it into the wiseberg.net repo (recommended, zero extra infra)

Hugo copies anything under `static/` into the build output verbatim. Copy
this app's files into the `wiseberg.net` repo and they'll deploy together in
the single existing Pages project:

```sh
mkdir -p ~/Projects/wiseberg.net/static/mehonat-khativa
cp -r index.html css js data ~/Projects/wiseberg.net/static/mehonat-khativa/
```

Commit and push the `wiseberg.net` repo as usual. The app will be live at
`wiseberg.net/mehonat-khativa/index.html` (and `/mehonat-khativa/` once an
index redirect or trailing-slash rule is in place — Hugo/Cloudflare Pages
serve `index.html` for a directory request by default, so plain
`wiseberg.net/mehonat-khativa/` should just work).

Every time this project's `data/words.json`, `index.html`, `css/`, or `js/`
change, re-run the copy step and push `wiseberg.net` again. This repo
(`mehonat-khativa`) stays the source of truth for the app; the copy is a
one-way sync into the site repo at deploy time.

### Option B — keep it fully separate (adds a Worker)

Deploy this repo as its own Pages project (steps below), then add a
Cloudflare Worker with a route for `wiseberg.net/mehonat-khativa/*` that
proxies requests to the generated `*.pages.dev` URL. More moving parts than
Option A — only worth it if you want this app's deploys fully decoupled from
the main site's.

1. Push this repo to GitHub or GitLab.
2. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git** and select the repo.
3. Use these build settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
   - **Production branch:** `main`
4. Click **Save and Deploy**. Cloudflare gives the site a URL like `mehonat-khativa.pages.dev`.
5. Add a Worker route `wiseberg.net/mehonat-khativa/*` that fetches from that `.pages.dev` URL and returns the response.

Every push to the production branch redeploys the site automatically.

## Project structure

```
index.html        # single page
css/style.css     # mobile-first styles, light/dark mode
js/app.js         # all app logic (no dependencies)
data/words.json   # word list
```

## Privacy

The app makes no third-party requests. The only network request it makes is for its own `data/words.json`. It stores settings, progress and stats in `localStorage` under the key `mehonat-khativa:v1`. Clearing your site data erases them.
