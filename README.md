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

Words are shown in random (shuffled) order, cycling through the whole list before repeating.

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

The app loads `data/words.json` with `fetch()`. Browsers block that on `file://` URLs, so serve the `site/` folder over HTTP:

```sh
cd site
python3 -m http.server 8787
# then open http://localhost:8787/
```

## Editing the word list

`data/words.json` (inside `site/`) is an array of 500 objects, ranked by frequency from the [OpenHebrew frequency list](https://openhebrew.net/en/learn/frequency):

```json
{ "hebrew": "שלום", "transliteration": "shalom", "english": "hello / peace", "rank": 1 }
```

- Write Hebrew without niqqud (plain consonantal spelling, as people actually type it). Any niqqud is stripped automatically.
- Use the correct final letter forms (ך ם ן ף ץ). The trainer checks them exactly, just like real typing.
- `rank` controls the default order, lowest first.
- Verbs are given in the masculine singular present tense, and numbers in the feminine (counting) form.

## Deploying to Cloudflare Pages

Target URL: `wiseberg.net/mehonat-khativa`. All asset paths in the app are
relative (`css/style.css`, `js/app.js`, `data/words.json` — no leading `/`),
so it works correctly at any subpath, not just a domain root.

**Important:** Cloudflare Pages attaches a custom domain to the *root* of a
project. It can't give one Pages project a subpath (like `/mehonat-khativa`)
of a domain whose root is already served by a different Pages project
(`wiseberg.net`'s own Hugo site). This repo is deployed via a **git
submodule** in the `wiseberg.net` repo, which keeps the two repos fully
separate while landing the app's files inside the single Hugo build:

```sh
# one-time setup, from the wiseberg.net repo
git submodule add https://github.com/jacobwiseberg/mehonat-khativa.git static/mehonat-khativa
```

`wiseberg.net/hugo.toml` mounts only `static/mehonat-khativa/site` into the
build (not the submodule root), so this repo's `README.md`, `SPEC.md` and
`.git` metadata never get published — only `site/index.html`, `site/css/`,
`site/js/` and `site/data/` ship.

To publish a change made in *this* repo:

```sh
git push                                   # push the change here first
cd ~/Projects/wiseberg.net
git submodule update --remote static/mehonat-khativa
git add static/mehonat-khativa
git commit -m "Update mehonat-khativa submodule"
git push                                   # triggers the wiseberg.net Pages deploy
```

The `wiseberg.net` Cloudflare Pages project needs **"Enable submodules"**
turned on (Pages project → Settings → Builds → Git settings) so Cloudflare's
build checks out this submodule when it clones the repo.

### Keeping it a fully independent deploy (alternative)

If you'd rather this app deploy on its own instead of through `wiseberg.net`:
push this repo to its own Cloudflare Pages project (Framework preset `None`,
build command empty, output directory `site`), then add a Cloudflare Worker
route for `wiseberg.net/mehonat-khativa/*` that proxies to the generated
`*.pages.dev` URL. More moving parts than the submodule approach above —
only worth it if you want this app's deploys fully decoupled from the main
site's build/deploy cycle.

## Project structure

```
site/index.html        # single page
site/css/style.css     # mobile-first styles
site/js/app.js         # all app logic (no dependencies)
site/data/words.json   # word list
README.md              # this file (not published)
SPEC.md                # original design spec (not published)
```

## Privacy

The app makes no third-party requests. The only network request it makes is for its own `data/words.json`. It stores settings, progress and stats in `localStorage` under the key `mehonat-khativa:v1`. Clearing your site data erases them.
