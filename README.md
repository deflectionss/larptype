# larptype

Minimal, smooth typing test for Roblox players, Roblox devs and vibecoders.

Play it at **https://deflectionss.github.io/larptype/**

## Run

Double-click `index.html`. No install, no build step. Works offline except fonts (Google Fonts, falls back to a system monospace font).

To host it, upload the folder to any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages). Leave out the `.claude` folder.

## Features

- Modes: time (15/30/60/120/custom), words (10/25/50/100/custom), quote, zen, custom text
- One word list: roblox slang, studio and scripting terms, luau keywords, vibecoding lingo and ad metrics (ctr, cpm, qptr, roas...)
- Quotes: game dev and shipping lines plus Luau one-liners
- Punctuation and numbers toggles
- Spring-animated caret (4 styles, 3 speeds), smooth line scroll, sliding indicators, staggered result screen
- Results: wpm, raw, accuracy, consistency, characters, animated chart with gliding hover and arrow-key scrubbing, words history with speed heatmap, replay, share card (PNG)
- Contact: about page and privacy page (Discord and email)
- Pace caret (ghost): pb, average, last or custom wpm
- Weak key trainer: per-key accuracy and speed heatmap, practice test built from your weakest letters
- Practice missed words
- XP, levels, rank titles, 31 badges
- Challenge mods: lava, blind, memory, mirror, upside down, random case, no backspace
- Difficulty (normal / expert / master), stop on error, confidence, freedom, min wpm / accuracy
- 30 themes + custom theme editor, 21 fonts, background patterns
- Command line (`esc` or `ctrl+k`): fuzzy search over every setting, theme, font and action, live theme preview
- Everything saved in the browser (localStorage). Export / import settings, export history as JSON or CSV

## Files

- `index.html` page shell
- `css/base.css` layout, test area, caret · `css/ui.css` results, settings, stats, command line, modals
- `js/data/` themes, word packs, quotes
- `js/store.js` settings schema + saved data · `js/theme.js` themes and fonts · `js/fx.js` springs, toasts, modals, particles
- `js/generator.js` word generation · `js/test.js` typing engine · `js/view.js` rendering, caret, scrolling
- `js/results.js`, `js/replay.js`, `js/chart.js`, `js/progress.js`, `js/palette.js`, `js/settings.js`, `js/stats.js`, `js/main.js`

To add words, edit the lists in `js/data/words.js`. To add a theme, add a row in `js/data/themes.js`.

## Privacy and credits

- Privacy page: `#/privacy`. Nothing leaves the browser except font requests to Google Fonts.
- Inspired by [Monkeytype](https://monkeytype.com). Independent project, no Monkeytype code, not affiliated.
- Roblox and Robux are trademarks of Roblox Corporation. Fan-made, not affiliated with Roblox Corporation.
- Icons from [Lucide](https://lucide.dev), ISC license. See `THIRD-PARTY-NOTICES.txt`.
