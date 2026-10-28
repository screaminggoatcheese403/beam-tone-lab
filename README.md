# BEAM / TONE LAB

A vintage-mixing-desk-inspired guitar tone recipe builder for **Blackstar BEAM Solo** and a **standard Telecaster with bridge and neck single-coil pickups and a three-way selector**.

First version is deliberately **static and free to host**. It imports the **63 real equipment model names** and **10 artist recipes** from `Blackstar_BEAM_Full_Workbook.xlsx`, adds a few curated song lookups and general genre starters, and allows on-screen adjustments to gain, bass, mids, treble, ISF, pickup, and signal-chain components. Saved presets live in **this browser's local storage**, with JSON export/import for backup or moving to another phone/computer.

## Phase 1 — Put the app on GitHub Pages

1. Create a new GitHub repository, perhaps **`beam-tone-lab`**. A public repo is simplest for GitHub Pages.
2. Upload all **root files** from this folder (`index.html`, `app.js`, `styles.css`, `mobile.css`, `data.js`, `data.json`, `favicon.svg`, `manifest.webmanifest`, `.nojekyll`). You can also upload `README.md`, `build.py` and the `worker` folder.
3. On GitHub open **Settings → Pages → Build and deployment**.
4. Set **Source: Deploy from a branch**, select **main**, and folder **/(root)**, then Save.
5. When GitHub publishes the site, the URL will typically be `https://YOUR-USERNAME.github.io/beam-tone-lab/`. This can also be added to a phone's home screen.

**No npm, command line, build service or API key is needed for the initial version.** You can test the files locally by opening `index.html`, too.

## What it can and cannot do in local mode

- Recognizes the workbook's artist recipes, including Link Wray, Johnny Thunders, Poison Ivy, Duane Eddy, Johnny Ramone, etc.
- Recognizes **a limited list of example songs**, including *Rumble*, *Misirlou*, *Chinese Rocks*, *Human Fly*, and *Blitzkrieg Bop*.
- Recognizes genres such as surf, garage, spaghetti western, punk, rockabilly, fuzz, and metal and gives a labelled **style estimate**.
- For an unknown name, gives a **neutral Telecaster starting tone**, clearly labelled **not a researched song match**. It does not falsely pretend to have researched the song.
- **Does not** remotely program the BEAM Solo itself: set the suggested controls in the Blackstar app by hand.

All starting EQ values are creative approximations to adjust by ear. Some original workbook suggestions were rewritten to accommodate the current Tele single-coil pickups rather than the old P90 setup.

## Phase 2 — Optional genuinely new AI recipes (Cloudflare Worker)

GitHub Pages cannot safely keep a secret API key. To generate tailored recipes for **songs and guitarists not already in the workbook**, host the optional code in [`worker/`](worker/) as a **Cloudflare Worker**, with your OpenAI API key stored as a **Cloudflare secret**, never in this repository or the browser.

You will need a Cloudflare account and an OpenAI **API** account; API billing is separate from a ChatGPT subscription. The Worker itself and AI API may incur charges.

### Cloudflare deployment (optional; can do later)

In the `worker` directory:

```sh
npx wrangler login
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put APP_ACCESS_KEY
npx wrangler deploy
```

**Important:** Set `ALLOWED_ORIGIN` in `worker/wrangler.toml` to exactly your GitHub Pages **origin** (`https://YOUR-USERNAME.github.io` — no repository path) before deployment. `APP_ACCESS_KEY` should be a long, random password. If Wrangler asks to create the Worker before secrets can be added, deploy once and immediately add secrets; avoid using it until both secrets are configured. You may also configure all secrets in the Cloudflare dashboard under **Workers & Pages → Settings → Variables and Secrets** after deployment.

After deploying, copy the HTTPS Worker URL. Open **⚙ settings** in the BEAM Tone Lab web app, enter the Worker URL and passphrase, and press **Save connection**. This enables AI mode for arbitrary artist/song input, with a schema that restricts gear names to your workbook inventory.

**Security notes:** Do not commit `.env`, `.dev.vars`, or secret credentials. Treat the passphrase as a personal credential. The Worker checks this passphrase and CORS origin; for wider public use, add Cloudflare rate limiting and stronger authentication before opening the service to others. API charges are your responsibility. The app does not store the passphrase across reloads.

## Files

- `index.html` — page structure
- `styles.css` — desktop vintage console aesthetic
- `mobile.css` — touch-friendly iPhone and Android layout (horizontal faders, accessible labels, full-width gear strips)
- `app.js` — tone matching, interactive desk, local presets, AI client
- `data.js` — curated workbook models and recipes embedded for a no-server first run
- `data.json` — same data in portable JSON format
- `build.py` — regenerates data.json from the original spreadsheet; rerun after changing the sheet and then regenerate data.js
- `worker/` — optional AI backend; needs a separate Cloudflare deployment

## First tests

1. Search `Link Wray` (workbook artist).
2. Search `Misirlou` (curated song).
3. Search `spaghetti western` (style estimate).
4. Search `A totally unfamiliar song` (labelled **general starter** in local mode).
5. Move the faders, change the pickup, click a signal-chain module, save, reload, then re-open **My presets**.

**Not affiliated with or endorsed by Blackstar or any musician.**

## Mobile-first update v2

On phone widths up to 680 CSS pixels, the app uses a dedicated readable layout rather than shrinking the desktop board. Controls are large enough to tap, text labels are enlarged, and the gain/EQ controls are easy-to-adjust horizontal faders. iPhone Pro Max screens (428–440 CSS px), smaller iPhones (375 px), and 320 px narrow devices were tested for horizontal overflow. Do not remove `mobile.css` when uploading files to GitHub Pages. The desktop design remains unchanged.
