# Family Movie Night 🍿

The Ortiz family's Friday-night memory book. Round-robin picks (Chris → Kat →
Sedona → River), post-movie reactions, scrapbook pages, printable keepsakes,
stats, trivia, movie ideas, and year-end awards.

**Live:** https://ortizzle.github.io/family-movie-night/
**Everything lives in this one folder.**

---

## Picking this back up

```bash
open src/shell.html      # that's it — no install, no server, no npm
```

Edit anything in `src/`, refresh the browser. There is no build step while
you're working — `src/shell.html` loads the scripts directly.

When you're happy, build and publish:

```bash
python3 build.py                                  # writes index.html
git add -A && git commit -m "..." && git push     # publishes to GitHub Pages
```

Pages takes about a minute. **Mobile Safari caches hard** — hard-refresh or add
`?v=<something>` when checking the live site.

**Never edit `index.html` directly** — it's generated, and the next build
overwrites it.

---

## How it's laid out

The source is split so edits stay surgical; the published page is a single
self-contained file. `build.py` bridges the two by inlining the scripts in
load order.

| File | What's in it |
|---|---|
| `index.html` | **Generated.** The whole app in one file — what Pages serves |
| `build.py` | Inlines the scripts into `index.html` |
| `src/shell.html` | Markup + all CSS (~1,250 lines), and the `<script src>` tags |
| `src/fmn/core.js` | Storage wrapper, Arizona time helpers, theme/motion, the cast, TMDB + OMDb |
| `src/fmn/data.js` | Records, Gist sync, whose-turn-it-is, quote matching, sample data |
| `src/fmn/ui.js` | DOM helpers, stars, modal shell, log-a-night, reactions, delete |
| `src/fmn/keepsakes.js` | Scrapbook, Year in Review, Complete Collection, Claude packs, backups |
| `src/fmn/games.js` | Trivia banks and game engines |
| `src/fmn/home.js` | Header, projector screen, Coming Attractions, night cards |
| `src/fmn/ideas.js` | Idea shelves, recommendations, shortlist, idea detail |
| `src/fmn/vote.js` | "Can't decide? Put it to a vote" |
| `src/fmn/awards.js` | The Ortizzle — year-end awards and the countdown |
| `src/fmn/stats.js` | Stats tab and the game hub |
| `src/fmn/settings.js` | Taste profiles, Settings tab, master render switch |
| `src/fmn/boot.js` | Startup calls — **must load last** |

All files share one global scope, exactly as the old single inline script did.
Load order is declared in the HTML and matters: `boot.js` runs the startup
calls and stays at the end.

---

## Data model

Everything is one flat `data.records` object, keyed by id. Every record carries
`id`, `type`, and `updatedAt`. Deletes are **tombstones** (`deleted: true`),
never removals — a hard delete resurrects on the next sync from another phone.

| Type | Id shape | Holds |
|---|---|---|
| `night` | `night_<ts>_<rand>` | title, year, date, pickedBy, question, bonus, venue, posterPath, cached `facts` |
| `reaction` | `rx_<nightId>_<member>` | stars, thought, character, scene, quotes[], memories[], poll, answer, why |
| `preshow` | `pre_<nightId>` | spoiler-free pre-show notes for a booked night |
| `shortlist` | `short_<slug>` | movies held for later |
| `seen` | `seen_<slug>` | "we've already watched this" — keeps it off the Ideas shelves |
| `pass` | `pass_<slug>` | "not interested" — also fed to Claude as a signal to avoid |
| `profile` | `profile_<member>` | taste profile; `starter: true` until edited |
| `airecs` | `airecs_<member\|family>` | cached Claude picks, so other phones need no API key |
| `vote` | `vote_open` | the open ballot (options, round, openedBy) |
| `ballot` | `ballot_<member>_<round>` | one person's movie vote |
| `oballot` | `oballot_<year>_<cat>_<member>` | one person's Ortizzle vote |
| `rotation` | `rotation_anchor` | pins a Friday to a person, restarting the turn order |
| `setting` | `settings_*` | TMDB/OMDb keys, Ortizzle date, sample dismissal, last backup |

Per-person records (`ballot_`, `oballot_`, `rx_`) are deliberately separate
records rather than arrays on a parent, so two phones acting at once merge
cleanly instead of overwriting each other.

**Not in `data.records`** — these live in localStorage only, per phone, and
never sync: `me` (who's on this phone), `theme`, `motion`, `gist_token`,
`gist_id`, `tmdb_key`, `anthropic_key`, `omdb_key`, `last_sync`.

---

## The rules that keep biting

These are the ones that caused real bugs. Re-read before touching the relevant
area.

**Dates are Arizona time.** Always `AZ.today()`, never
`new Date().toISOString().split('T')[0]` — that drifts to UTC and shows
tomorrow's date after 5pm. All date keys are `YYYY-MM-DD` strings compared
lexically.

**Sync is fetch-merge-write, never blind write.** `Sync.merge` is newest-wins
per record by `updatedAt`; tombstones are kept 60 days then purged; records
flagged `sample: true` are stripped before upload so demo data never reaches
the family gist.

**Deletes need tombstones with the sample flag dropped.** A tombstone that kept
`sample: true` got filtered out of the upload, so deletions never propagated
and sample movies kept coming back on Kat's phone.

**CSS background layer order: the first layer paints on top.** The filmstrip
sprocket holes vanished because the solid strips were listed first.

**Theme tokens flip; some surfaces don't.** Anything on a permanently-dark or
permanently-light surface (the projector screen, keepsake pages, the AI
overlay) must use a non-flipping token like `--on-dark`, or fixed hex. Using
`--cream` there makes buttons invisible in light mode.

**Don't re-render out from under someone.** `adoptMerged` skips its render when
a modal is open or when an input has focus, otherwise a background sync wipes a
half-typed gist token.

**Mobile Safari is the target.** 44px minimum tap targets, no `:hover`-only
interactions, no `alert`/`confirm`/`prompt` (they behave badly), no `onclick`
attributes, no `innerHTML` with user data.

---

## Design decisions worth remembering

**Turn order follows the calendar, not a counter.** `lineupSlots()` walks
Fridays forward, drops booked nights on their own dates, and assigns open
Fridays from a round-robin queue. Booking a Friday that wasn't yours removes
*your* name from the round rather than bumping the person whose slot you took —
so claiming out of order never skips anybody. The marquee, Coming Attractions,
the Settings badge, and the add-night picker all read from this one projection,
because when they each computed their own answer they disagreed.

**Bonus nights are invisible to the rotation.** A night flagged `bonus: true`
is a real movie night — card, reactions, scrapbook, stats, Ortizzle — but
every function that decides whose turn it is runs its input through
`turnNights()` first. That's `nightsSinceAnchor`, `rotationBase`, and
`lineupSlots`. They still show in Coming Attractions, merged in by date at
render time. If you add another rotation-aware function, filter it too.

**"Watched" is a clock, not a reaction.** A night dated today counts as
happened once `showEndMinutes()` has passed — 6:30pm plus the film's cached
runtime plus 20 minutes, defaulting to two hours when there's no runtime. It
used to flip as soon as any reaction had content, but the picker's "why I
picked it" and their question for the family are both written *before* the
movie: Kat filling hers in at breakfast dropped the card into the memory book
and handed the projector to the next person mid-morning. Move the family's
showtime by editing `SHOWTIME` in `core.js` and both the projector line and
this rule follow.

**A spent Friday stops being an open slot.** Once tonight's turn night has
played, `nextOpenFriday()` skips to the following Friday. Without it the
lineup keeps offering today's date, and anything genuinely sooner — a Sunday
bonus — looks further out than the slot that already went, so the projector
would announce an empty turn instead of the next actual movie. A bonus never
spends the Friday; it never took the turn.

**`rotation_anchor` restarts the order without logging a movie.** It only
decides where the order picks back up; once a night actually happens on or
after the anchor date, real nights drive the rotation again.

**The vote doesn't auto-book.** The picker confirms the winner and breaks ties.
Chris's call — a movie shouldn't land on the calendar on its own.

**The nudge is in-app, not push.** An open vote shows as a banner on the Nights
tab. Real push needs a service worker plus permission, and on iOS only fires
for home-screen-installed apps — it fails silently, which is worse than not
having it.

**Streaming providers aren't in the keepsakes.** They'd be stale within a
month. They show on the projector screen and in idea details only.

**The projector screen only ever paints what's cached.** Poster, trailer and
where-to-watch all read `night.facts`, then repaint from the one
`ensureNightFacts` callback when a fetch lands. A night typed in by hand has no
poster or trailer until that callback fires — which is why the poster wrapper
is created empty and `:empty` hides it, rather than the screen reflowing.

**Facts top-ups are additive, never a refetch.** `ensureNightFacts` skips
re-fetching once `fetchedAt` is set, so anything added to the shape later needs
its own `<thing>Tried` flag and a top-up branch — that's how OMDb scores and
then trailers reached nights cached before either existed. Old nights still
carry no `posterPath` if they were logged by hand before posters were cached.

**Pre-show packs are spoiler-free by prompt, not by guarantee.** `generatePreShow`
tells Claude the family hasn't seen the film; the sheet says so too. Keep that
instruction if you touch the prompt — the after-credits pack is the one that's
allowed to discuss the plot.

**The backup nudge is synced, not per-phone.** `settings_backup` records when
anybody last exported, so Chris backing up settles the nudge on Kat's phone
instead of nagging everyone separately.

**Everything degrades without keys.** TMDB (posters, facts, providers), OMDb
(IMDb/RT), and Anthropic (packs, recommendations) are all optional. The app is
fully usable with none of them set.

---

## Where the family's actual memories live

**Not in this repo.** Nights, reactions, quotes, and ratings live in each
phone's localStorage, and — when family sync is configured — in a private
GitHub Gist. Backing up the code does not back up the data.

Settings → Backups exports a JSON file. That's the one to keep somewhere real.

---

## Testing

Playwright drives a real headless Chromium at 390px. Before any deploy, run the
smoke test in `~/.claude/skills/family-app-standards/references/smoke-test.md`.
The hygiene greps, all of which should come back empty:

```bash
grep -rn "onclick=" src/
grep -rnE "\balert\(|\bconfirm\(|\bprompt\(" src/
grep -rnE "ghp_[A-Za-z0-9]|sk-ant-[A-Za-z0-9]" src/
grep -rn "toISOString" src/
grep -rn "innerHTML" src/
```

Test the **built** file, not just the source — the build step is where a
mistake would hide.

---

## Version history

- **v3.4** — the projector waits for the closing credits, and a 6:30 showtime
- **v3.3** — the poster on the projector screen, trailers, spoiler-free pre-show packs, a backup nudge
- **v3.2** — cards in date order, and a Rotten Tomatoes link
- **v3.1** — bonus nights that don't take a turn, and where you watched
- **v3.0** — picker's question, family votes, where-to-watch, The Ortizzle; source split into `src/fmn/*.js` and moved into its own repo
- **v2.6** — "Not interested" on movie ideas
- **v2.5** — Settings sections survive background repaints
- **v2.4** — every Friday gets a row; round-robin queue so a booking never skips anyone
- **v2.3** — restart the turn order without logging a movie
- **v2.2** — date-aware rotation, editable nights, synced AI picks, starter taste profiles
- **v2.1** — shortlist, IMDb parents guide, top-rated shelf
- **v2.0** — games hub, taste profiles, per-person recommendations
- **v1.x** — the original build: reactions, scrapbook, keepsake PDFs, stats, trivia, sync
