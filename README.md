# Family Movie Night 🍿

The Ortiz family's Friday-night memory book. Round-robin picks
(Chris → Kat → Sedona → River), post-movie reactions, scrapbook pages,
printable keepsakes, stats, trivia, movie ideas, family votes, and The
Ortizzle year-end awards.

**Live app:** https://ortizzle.github.io/family-movie-night/

## Working on it

```bash
open src/shell.html      # opens the app locally — no install, no server
```

Edit anything in `src/`, refresh the browser. That's the whole loop.

## Publishing

```bash
python3 build.py                                  # writes index.html
git add -A && git commit -m "what changed" && git push
```

GitHub Pages serves `index.html` from the root of `main`, so pushing
publishes. Give it a minute, and hard-refresh on your phone — mobile Safari
caches aggressively.

**Don't edit `index.html` by hand.** It's generated from `src/`, and the next
build overwrites it.

## What's where

```
index.html            ← generated; the app your family loads
build.py              ← makes it
src/shell.html        ← markup + all the CSS
src/fmn/*.js          ← all the logic, twelve files
DOCS.md               ← how it works, the data model, the gotchas
CLAUDE.md             ← conventions for Claude Code sessions
```

Start with **DOCS.md** if you're picking this back up after a while.

## Your family's memories are not in this repo

The nights, ratings, quotes, and memories live in each phone's browser storage
and sync through a private GitHub Gist. Cloning this repo does not back them
up.

**Settings → Backups → Export** writes a JSON file. Keep that somewhere real.

## Keys

TMDB (posters, facts, streaming availability), OMDb (IMDb and Rotten Tomatoes
scores), and Anthropic (after-credits packs, AI recommendations) are all
optional — entered in the app's Settings, stored on each phone. The app works
fully without any of them. **No keys are ever committed here.**
