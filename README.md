# Family Movie Night 🍿

The Ortiz family's Friday-night memory book — round-robin picks, post-movie
reactions (stars, thoughts, favorite characters, favorite scenes, quotes,
memories, the family poll, and the picker's own question), scrapbook pages,
printable keepsake PDFs, stats, trivia, movie ideas, family votes, and The
Ortizzle year-end awards.

**Live app:** https://ortizzle.github.io/family-movie-night/

## This repo is generated

`index.html` is a **build artifact** — don't edit it here, the next build will
overwrite it. The source lives in
[`ortizzle/screening-room`](https://github.com/ortizzle/screening-room) on the
`claude/family-movie-night-app-uplwwv` branch, split into
`family-movie-night.html` + `fmn/*.js`, with full documentation in that repo's
`FAMILY-MOVIE-NIGHT.md`.

To publish a change:

```bash
cd screening-room
python3 fmn-build.py                 # writes ../family-movie-night/index.html
cd ../family-movie-night
git add -A && git commit -m "..." && git push
```

GitHub Pages serves `main` from the repository root, so a push publishes. Pages
lags about a minute, and mobile Safari caches hard — add `?v=<something>` when
verifying.

## Data

Lives in each phone's localStorage and syncs across the family through a shared
private GitHub Gist, configured in the app's Settings tab along with optional
TMDB, OMDb, and Anthropic keys. **No keys or tokens are ever committed here.**

The app works fully without any of those keys — they add posters, critic
scores, streaming availability, and AI recommendations.

**Backing up this repo does not back up the family's memories.** Use
Settings → Backups to export the data as JSON and keep that somewhere real.
