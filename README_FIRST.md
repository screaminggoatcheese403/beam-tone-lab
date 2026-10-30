# BEAM / TONE LAB — Version 4 · The Record Crate

A static, no-paid-API guitar and bass tone *starting-point* library based on your original Blackstar BEAM Solo workbook and Songsterr export.

## What's included

- **134 distinct Songsterr tabs**: 98 unique saved in Favorites or Playlists plus 36 additional uploaded tabs.
- **49 tabs tagged "MY UPLOAD"**, including 13 that overlap the 98 saved entries.
- **11 Songsterr playlists** and clickable links to the corresponding Songsterr tab IDs.
- Search by **song title, band/artist, guitarist, genre, or playlist**. Artist aliases include **Johnny Ramone → Ramones**, **Johnny Thunders → Johnny Thunders / New York Dolls**, **Poison Ivy → The Cramps**.
- Five instrument profiles, including two basses, each with its own custom body icon, plus instrument-specific pickup selection.
- Original workbook artist recipes for represented musicians; genre-based starting recipes for other songs.
- Full BEAM Solo gear chooser (only workbook-listed amps, cabs, mics and effects), manual gain/EQ/ISF control, browser-local Save/Copy/Export/Import.

**Important accuracy note:** Songsterr exports songs, not the exact amplifier, cabinet and pedal settings used in the recordings. The vast majority of song-level presets are **genre approximations**, clearly labeled as such. Artist-level starting points are from your original workbook and are likewise not studio-verified. We can refine selected songs together in future releases.

## Publish to the existing GitHub Pages repository

1. Download `BEAM_Tone_Lab_v4_GitHub.zip` and **unzip** it on your Mac.
2. In the existing `beam-tone-lab` GitHub repository, choose **Add file → Upload files**.
3. Upload **the extracted files and the entire `assets` folder**, preserving the `assets/` directory and all five `.svg` files. Do not upload the ZIP itself. A Git client is another option if the browser does not allow folder uploads.
4. When GitHub asks whether to replace files with the same names, confirm, then **Commit changes** to the `main` branch.
5. In a few minutes, open `https://screaminggoatcheese403.github.io/beam-tone-lab/` in Safari; reload (or close and relaunch an installed home-screen shortcut) to avoid cached old files.

There is **no Cloudflare service or OpenAI API dependency**. Your existing Cloudflare Worker may be left unused or disabled; the app never calls it. GitHub Pages hosting is free for public repositories.

## Update songs and presets later

- `songs.js`: 134 tab names, genres, playlist memberships, original Songsterr IDs and searchable artist labels. It contains **no Songsterr account profile, billing, email or password data**.
- `instruments.js`: your guitars and basses, string gauges and current/pending configurations.
- `data.js`: 63 BEAM Solo equipment models and original workbook artist/style recipes.
- `app.js`: filtering, pickup choice, editable console and saved presets.

The code uses `textContent` for user-originated titles, never raw HTML. Clicking "Save preset" saves locally in that specific browser only; use **Export/Import** to move saved variations between devices. Changes to the GitHub site do not directly change the Blackstar BEAM Solo app.

## Current instrument details to confirm later

- Danelectro Dano Pro guitar: 3-way switching and knob functions not yet confirmed.
- Aria Pro II ZZB Deluxe bass: original pickups confirmed; switching and controls still to confirm.
- Soundigger Tele Surfmaster: half-round .010s currently, chrome flatwound .011s planned, **not yet installed**.
- Danelectro Dano Pro bass: 3-way, two lipstick pickups, master volume and tone, flatwounds.
- Gretsch Synchromatic Nashville: dual Hi-Fidelity Filter'Trons, three-way, flatwounds.

## Files for the live site

`index.html`, `styles.css`, `mobile.css`, `v3.css`, `v4.css`, `app.js`, `data.js`, `songs.js`, `instruments.js`, `.nojekyll`, `favicon.svg`, `manifest.webmanifest`, `assets/*.svg`.
