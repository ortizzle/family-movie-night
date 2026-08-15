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

Pages takes about a minute. **Chrome on Android caches hard** — hard-refresh or add
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
| `reaction` | `rx_<nightId>_<member>` | stars, thought, character, scenes[], quotes[], memories[], poll, answer, why |
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
| `skip` | `skip_<YYYY-MM-DD>` | a Friday the family took off — no movie night, no turn spent |
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

**The list-shaped reaction fields all read through a helper.** `rxQuotes`,
`rxMemories` and `rxScenes` each prefer the plural array and fall back to the
old singular field, because each started life as one value. Read them through
the helper — never `r.scene` or `r.quote` directly — or records written by an
earlier version go blank. Saving writes the array *and* mirrors the first
entry into the singular field, so a phone still on the old build shows
something rather than an empty page.

**Dates are Arizona time.** Always `AZ.today()`, never
`new Date().toISOString().split('T')[0]` — that drifts to UTC and shows
tomorrow's date after 5pm. All date keys are `YYYY-MM-DD` strings compared
lexically.

**Sync is fetch-merge-write, never blind write.** `Sync.merge` is newest-wins
per record by `updatedAt`; tombstones are kept 60 days then purged; records
flagged `sample: true` are stripped before upload so demo data never reaches
the family gist.

**Re-read local *after* the round trip, never before.** Both `save` and `load`
used to snapshot local data, spend a second or two on the network, then write
the merge back — so anything saved during that window was silently deleted.
River answered his question on Chris's phone while a foreground pull was in
flight: the upload already on its way carried it to Kat, and the pull landing
afterwards wiped it locally. It looked like "saved on one phone, not the
other" and was really a write being thrown away at home. Both paths now merge
against `Store.get('data')` at the moment they adopt, which is safe precisely
because the merge is newest-wins. `scheduleSync` also sets `syncAgain` when it
fires during a sync, so a mid-flight write still reaches the gist instead of
waiting for somebody to save again.

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

**Chrome on Android is the target.** The whole family is on Pixels. 48dp
minimum tap targets, no `:hover`-only
interactions, no `alert`/`confirm`/`prompt` (they behave badly), no `onclick`
attributes, no `innerHTML` with user data.

**Share text, not files, when text will do.** The nudge shares a string, which
every Android target accepts. Sharing a *file* is fussier, and the two checks
disagree: `canShare()` looks only at the MIME type, but `share()` also runs the
**filename extension** past an allowlist that doesn't include `.json`. That's
the `NotAllowedError` a Pixel throws on a file `canShare()` just approved —
and why switching the type to `text/plain` alone didn't fix it. The shared
backup is a `.txt`; import accepts both extensions and parses by content. A
`share()` rejection is also not always a cancel: an `AbortError` back in under
700ms means the sheet never opened, so fall back rather than going quiet.

**An empty Friday and a skipped one are different things.** Without a way to
say "no movie night this week", an empty Friday reads as an open one — so
moving a booked film a week later handed its old Friday straight back to the
same person, and they came up on two Fridays in a row. That's what `skip`
records are for. `lineupSlots` gives a skipped Friday a row (visible and
reversible) but doesn't count it toward `count` and doesn't `take()` a turn,
so the order waits. Anything asking *whose* turn it is has to filter through
`openSlots()` first — a skipped Friday has `member: null`, and the projector
announcing one as the next movie night was the first thing that broke.
Skipped Fridays are also neutral in `fridayStreak`: stepped over, neither
counted nor held against the family.

The control has to be *visible*, not just present. It shipped as a bare tap on
the row and Chris asked for it again a week later, because a phone has no hover
to discover an invisible target with. Every open Friday now carries a
`.lu-skip` chip that says "No movie night" (or "Put it back" once it's off),
which is the affordance — the whole row is still the tap target.

**A Friday row shows the score, not who showed up.** The initials used to sit
there, one per person, lit when they'd written something — but everybody is at
movie night, so they only ever said the same thing. The row carries
`familyAvg` as stars plus the number instead. A night only appears here once
somebody has rated it, so there is always a score; when fewer than four have
rated, the count rides alongside, because an average of two isn't the
family's.

**A Friday row belongs to that Friday's movie.** `happenedNightNear` keeps a
±2 day window, because a Friday film sometimes actually gets played on
Saturday — but it ranks candidates instead of taking the first one `nights()`
happens to return. Exact date first, turn night before bonus, then nearest. A
bonus only ever claims the day it was watched: it never outranks the Friday's
own film, and it never fills an empty Friday, because a bonus is an extra
night, not a substitute for the round.

**The projector screen is a marquee, not a page.** Poster, title, date,
showtime, rotation — that's the whole budget. The trailer, streaming, facts
and pre-show notes live behind the poster tap. Putting them on the screen
itself pushed the lineup off the phone and said everything twice.

**A multi-column block must never straddle a page break.** Chrome throws away
most of a page when it does — the two-page keepsake printed as three until the
scrapbook was split into two `.sp-sheet` blocks with the page break *between*
them. Each sheet's columns start and finish on one piece of paper. Anything
else reaching for `columns` in print needs the same treatment.

**The scrapbook's print layout is measured, never predicted.** `fitScrapbook`
lays the page out off-screen at the real page size and reads the heights back,
then picks the split, the column count and the type size that actually fit.
The first version estimated all that from character counts, and it failed in
the way that hurts: deleting a few quotes moved the estimate, moved the split,
and printed *four* pages with most of two of them blank. A sheet that overruns
its page by a millimetre pushes the next sheet a page later, so guessing is
not good enough.

Three things that follow from it, each learned the expensive way:

- The layout lives in `.sp-fit`, not inside `@media print` — the fitter has to
  apply and measure it before the print dialog exists. JS adds the class on
  the button and on `beforeprint`, and drops it on `afterprint`; left on, the
  overlay becomes a two-column Letter page on a phone. Every keepsake gets the
  class (they share the `.sp-*` styles); only the night scrapbook has sheets
  to solve, and they hand `printButton` their cover, so it climbs to
  `.scrap-page` first.
- The budget is 930px against a 960px page. Measuring off-screen and
  paginating for real differ by a percent or two, and a percent costs a page.
- When nothing fits, fill sheet one to capacity and let only sheet two spill.
  Evening the two out is the tempting move and it is wrong: two sheets at 101%
  spill a little onto a page each, which is four sheets with two nearly blank.

Past what two readable pages hold it still runs over, deliberately — the
alternative is 5pt type or dropping someone's memory.

**Trivia answers belong to a person and a pack.** `tq_<nightId>_<memberId>`
holds one person's picks, stamped with the pack's `updatedAt`. The stamp is
the point: "Make a fresh pack" writes different questions, and last week's
answers would land on the wrong rows. Signed out, the round still plays — it
just doesn't save, because there's nobody to save it for.

**Retitling a night means it was a different movie.** `openEditNight` calls
`forgetLookedUp()` whenever the title or year changes: `facts`, `posterPath`,
`tmdbId` are dropped and the pre-show/after-credits packs are tombstoned.
Without it the old film's poster and runtime stick forever, because
`ensureNightFacts` never refetches once `fetchedAt` is stamped. Reactions are
never touched — only the family knows whether the typo or the viewing was the
mistake.

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

**"Watched" means somebody rated it — stars, nothing else.** A night dated
today counts as happened once any reaction has `stars > 0`. Two rules that
look reasonable are both wrong and have been tried: *any* reaction content
flips it far too early, because the picker's "why I picked it" and their
question for the family are written **before** the movie (Kat filling hers in
at breakfast dropped the card into the memory book and handed the projector to
the next person mid-morning); and a clock — showtime plus runtime — flips on a
late start, a long intermission, or a pause for popcorn. The first star is the
only signal that the credits actually rolled. `SHOWTIME` in `core.js` is a
display time for the projector line, not part of this rule.

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
month. They show on the projector screen, the pre-show sheet, and idea details.

**Providers have their own clock; the rest of the facts never expire.**
`ensureNightFacts` refuses to re-fetch once `fetchedAt` is set, which is right
for a runtime but wrong for where a film streams — that changes month to
month. `watchAt` ages separately and refreshes after a week, only for a night
still coming up. It's stamped even when the call fails, so a flaky network
can't cause a fetch on every render.

**`watchRow` stays silent unless you ask it not to.** With no `title` in its
options it returns `null` when TMDB knows of no US service, which keeps the
projector screen short and idea cards tidy. The pre-show sheet passes a title,
so it always renders — saying plainly that TMDB lists nothing and offering a
JustWatch search instead. A blank space there reads as a bug; "we don't know"
doesn't.

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

**Every Claude failure has to name itself.** `askClaude` maps each way the call
can fail to its own code — `BAD_KEY`, `NO_CREDIT`, `NO_ACCESS`, `BAD_MODEL`,
`BUSY`, `OFFLINE`, `TRUNCATED`, `EMPTY`, plus `BAD_SHAPE` from the parser — and
`claudeTrouble` turns each into one sentence a parent can act on. They all used
to collapse into "Couldn't reach Claude — try again in a moment", which meant an
empty Anthropic account looked exactly like bad wifi and nobody could tell what
to fix. The message renders as `.ai-err` on the sheet, next to the button, not
as a toast that's gone before you've read it. `BUSY` and `OFFLINE` retry three
times with backoff before anyone sees anything.

**A film newer than Claude's training data is a film Claude cannot know — and
the app has to introduce it.** This is what "repeatedly unable to pull after
credits" really was. River picked a major 2026 release; TMDB knew all about it,
Claude had never heard of it, and the app was sending nothing but the title
while demanding five behind-the-scenes facts. The model answered in prose, and
prose can never parse. Size at the box office has nothing to do with it: what
matters is whether the film existed when the model was trained, and every
Friday from here on is newer than that.

So `buildFacts` now caches the film's **story** — `overview`, `tagline`,
`genres`, `director`, `cast` — and `filmContext(night)` hands all of it to
Claude as a briefing. Nights cached before v3.9 have no story, so
`ensureNightFacts` tops them up behind a `storyTried` flag, the same additive
pattern as OMDb scores and trailers. **`storyTried` is stamped even when the
fetch fails**, or a film TMDB can't find re-fetches on every render.

A pack written from the briefing rather than Claude's own memory comes back with
`"grounded":true`, gets stored on the record, and the sheet says so: *"Written
by Claude from this film's TMDB details — too new for it to have seen."* Keep
that honest if you touch it. "Surprising behind-the-scenes fun facts" about a
film the model has never seen would be invention, which is why the prompt
redirects those to what the details actually support.

**Claude needs a way to say "I don't know this film."** Without one, the only
way for it to answer about a small or very new title is prose — and prose can
never parse, so the app reported a film nobody knows as a mangled-JSON problem.
That's what "repeatedly unable to pull after credits" actually was: River picked
*The Sheep Detectives*, Claude didn't know it, and the sheet blamed the shape.
Both prompts now offer `{"unknown":true}` as an explicit out, and both hand over
`filmContext(night)` — release date, certificate, runtime, IMDb and TMDB ids —
so a real-but-obscure film has an identity beyond its title. Keep the escape
hatch if you rewrite a prompt; without it the failure becomes unreadable again.

**A `BAD_SHAPE` carries what Claude actually said.** The sentence it replied
with *is* the diagnosis, and a generic shape complaint throws it away. `badShape`
keeps 160 characters and `claudeTrouble` quotes them back. Prose also gets one
automatic retry (`askForJson`) that tells Claude plainly to send JSON only —
which doesn't fire for an unknown film, because that now returns valid JSON.

**Claude's JSON goes through `parseClaudeJson`, never `JSON.parse` directly.**
It strips a fence and takes the outermost braces, so a stray "Sure! Here you go:"
doesn't cost the family their pack. Ask for more `max_tokens` than the pack
needs — a reply that stops at the limit throws `TRUNCATED`, which reads very
differently from a shape problem and is fixed differently too.

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

Playwright drives a real headless Chromium at 412px (Pixel) and 390px (the
narrower case). Before any deploy, run the
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

- **v3.9** — the app briefs Claude on films newer than it, so new releases get packs
- **v3.8** — Claude can say it doesn't know a film, instead of failing as bad JSON
- **v3.7** — Claude failures say what actually went wrong; "No movie night" is a visible choice
- **v3.6** — skip a Friday without anyone losing their turn
- **v3.5** — a nudge to text whoever hasn't reacted yet; trivia answers stay
  answered; fixing a night's title forgets the wrong movie's poster and facts;
  a leaner projector screen; Recent Fridays rows that jump to the night; and
  the scrapbook keepsake condensed onto two printed sheets
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
