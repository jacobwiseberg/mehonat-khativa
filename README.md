# Hebrew Typing Trainer

A free, no-login web app for learning to type the most common Hebrew words. It works on phones and desktops.

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

`data/words.json` is an array of objects:

```json
{ "hebrew": "שלום", "transliteration": "shalom", "english": "hello / peace", "rank": 1 }
```

- Write Hebrew without niqqud (plain consonantal spelling, as people actually type it). Any niqqud is stripped automatically.
- Use the correct final letter forms (ך ם ן ף ץ). The trainer checks them exactly, just like real typing.
- `rank` controls the default order, lowest first.
- Verbs are given in the masculine singular present tense, and numbers in the feminine (counting) form.

## Deploying to Cloudflare Pages

There's no build step. Cloudflare serves the repository root as-is.

1. Push this repo to GitHub or GitLab.
2. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git** and select the repo.
3. Use these build settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
   - **Production branch:** `main` (or whichever branch you deploy from)
4. Click **Save and Deploy**. Cloudflare gives the site a URL like `hebrew-type.pages.dev`.
5. Add a custom subdomain:
   1. In the Pages project, open **Custom domains → Set up a custom domain** and enter e.g. `type.wiseberg.net` (or `hebrew.wiseberg.net`).
   2. Because `wiseberg.net` already uses Cloudflare DNS, Cloudflare offers to create the record for you. Accept it. To add the record by hand instead, go to **DNS → Records → Add record**:
      - **Type:** `CNAME`
      - **Name:** `type` (or `hebrew`)
      - **Target:** `hebrew-type.pages.dev` (your generated Pages URL)
      - **Proxy status:** Proxied
   3. Wait for the domain to show **Active**. HTTPS is provisioned automatically.

Every push to the production branch redeploys the site automatically.

## Project structure

```
index.html        # single page
css/style.css     # mobile-first styles, light/dark mode
js/app.js         # all app logic (no dependencies)
data/words.json   # word list
```

## Privacy

The app makes no third-party requests. The only network request it makes is for its own `data/words.json`. It stores settings, progress and stats in `localStorage` under the key `hebrew-type:v1`. Clearing your site data erases them.
