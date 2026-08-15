# Tests

Playwright suites that drive the **built** `index.html` in headless Chromium at
phone size. They live in the repo because they kept getting lost anywhere else.

The app itself still ships with zero dependencies — nothing here is loaded by
`index.html`, and `build.py` doesn't look in this folder. `playwright-core` is a
dev-only tool, the same way `python3 build.py` is.

## Running them

```bash
cd tests
npm install        # once — pulls playwright-core
./run.sh           # builds index.html, then runs every *.test.js
./run.sh claude    # just one suite
```

`run.sh` builds first on purpose. **Testing `src/shell.html` tests something
nobody ships** — a file that's fine in source and broken after inlining has
happened, and the built file is what Pages serves.

Exit code is 0 only if every check passed and no page threw.

## What's here

| File | Covers |
|---|---|
| `smoke.test.js` | Tonight's state, poster tap → Coming Attractions, trailer links, facts top-up, pre-show generation, degradation with no API keys, the night menu, the backup nudge |
| `claude.test.js` | Every Anthropic failure mode and the sentence each produces; the retry behaviour; the visible skip control on the lineup |
| `poster.test.js` | Projector poster: present, 404'd, missing, and nothing booked — none of which may cause a horizontal scrollbar |
| `shots.js` | Not a test — screenshots the app into PNGs for eyeballing a visual change |
| `lib/harness.js` | Shared launch, paths, viewports, and the reporter |

## Two things the harness fixes for you

**Never hardcode the Chromium path.** The container's numbered browser directory
changes; `chromePath()` finds it, and `FMN_CHROME=/path/to/chrome` overrides.

**Results are appended to `<suite>.log` as they happen**, not held until the end.
A suite that wedged on its last case used to print nothing at all, which made a
slow run and a stuck run look identical.

## Writing a new one

Open the app through its own entry points — `openAfterCredits(night)`,
`nights()[0]`, a real click on a real button. Poking the DOM into the shape you
want tests the test. Seed through `localStorage` before a reload, the way a
phone would have it.

Route every outbound host (`api.anthropic.com`, `api.themoviedb.org`,
`image.tmdb.org`). An unrouted request in a suite means a real network call from
someone's machine, and a flaky test.
