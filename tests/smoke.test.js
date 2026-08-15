/* Smoke test for v3.3 against the BUILT index.html, at 390px.
   Covers: tonight state, poster tap -> Coming Attractions, trailer link +
   top-up of old facts, pre-show pack generation, degradation with no keys,
   night-menu entry, and the Settings backup nudge. */
const { APP, launch } = require('./lib/harness');

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64');

const DETAILS = {
  id: 8392, title: 'The Iron Giant', release_date: '1999-08-06', runtime: 86,
  vote_average: 7.9, imdb_id: 'tt0129167', poster_path: '/fetched-poster.jpg',
  release_dates: { results: [{ iso_3166_1: 'US', release_dates: [{ certification: 'PG' }] }] },
  'watch/providers': { results: { US: { link: 'https://www.themoviedb.org/x', flatrate: [{ provider_name: 'Max' }] } } },
  videos: { results: [
    { site: 'YouTube', type: 'Teaser', key: 'teaserkey', official: true, name: 'Teaser' },
    { site: 'Vimeo',   type: 'Trailer', key: 'nope', official: true, name: 'Vimeo' },
    { site: 'YouTube', type: 'Trailer', key: 'TRAILERKEY', official: true, name: 'Official Trailer' }
  ] }
};
const VIDEOS_ONLY = { id: 8392, results: DETAILS.videos.results };
const PACK = {
  hype: 'A boy and a hundred-foot robot, told with more heart than most live-action epics. It earns every quiet moment.',
  lookFor: ['The hand-drawn giant against painted backgrounds', 'How little dialogue the giant needs', 'The recurring espresso joke'],
  guess: ['Who cries first', 'Whether River picks the giant as favorite character'],
  heads: 'One tense military sequence near the end; nothing graphic.'
};

function seed(opts){
  return function(o){
    const az = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Phoenix' }).format(new Date());
    const p = az.split('-').map(Number);
    const d = new Date(p[0], p[1]-1, p[2]);
    let date;
    if (o.when === 'today'){
      date = az;
    } else if (o.when === 'past'){
      d.setDate(d.getDate() - 21);
      date = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    } else {
      d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7));
      if (az === d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')) {
        d.setDate(d.getDate() + 7);
      }
      date = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }
    const night = {
      id: 'night_test_1', type: 'night', title: 'The Iron Giant', year: 1999,
      date: date, pickedBy: 'kat', updatedAt: Date.now(),
      posterPath: o.poster ? '/mock.jpg' : null,
      tmdbId: o.tmdbId ? 8392 : null
    };
    if (o.facts) night.facts = o.facts;
    const records = {};
    if (o.night !== false) records.night_test_1 = night;
    localStorage.setItem('fmn_data', JSON.stringify({ records: records }));
    localStorage.setItem('fmn_me', JSON.stringify('chris'));
    localStorage.setItem('fmn_sample_dismissed', JSON.stringify(true));
    if (o.tmdbKey) localStorage.setItem('fmn_tmdb_key', JSON.stringify('abc123'));
    if (o.anthropicKey) localStorage.setItem('fmn_anthropic_key', JSON.stringify('sk-ant-testtesttest'));
  };
}

(async () => {
  const browser = await launch();
  const results = [];
  const errors = [];
  let videoCalls = 0;

  async function open(o){
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: o.theme || 'dark',
      acceptDownloads: true
    });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push((o.name || '?') + ': ' + e.message));
    await page.route('**image.tmdb.org/**', r => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
    await page.route('**api.themoviedb.org/**', r => {
      const u = r.request().url();
      if (u.indexOf('/videos') !== -1){
        videoCalls++;
        return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(VIDEOS_ONLY) });
      }
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DETAILS) });
    });
    await page.route('**api.anthropic.com/**', r => r.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(PACK) }] })
    }));
    await page.goto(APP);
    await page.evaluate(seed(), o);
    await page.reload();
    await page.waitForTimeout(o.settle || 800);
    return { ctx, page };
  }

  function check(name, ok, detail){
    results.push((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  ' + JSON.stringify(detail) : ''));
  }

  /* 1. tonight, booked, poster + trailer from cached facts */
  {
    const { ctx, page } = await open({ name:'tonight', when:'today', poster:true, tmdbId:true, tmdbKey:true,
      facts: { fetchedAt: Date.now(), tmdbId:8392, cert:'PG', runtime:86, videosTried:true,
               trailer:{key:'TRAILERKEY',name:'Official Trailer'},
               watch:{ link:'https://x', stream:['Max'], rent:[] } } });
    const s = await page.evaluate(() => {
      const a = document.querySelector('.screen-trailer .st-link');
      return {
        label: (document.querySelector('.screen .label') || {}).textContent,
        labelTonight: !!document.querySelector('.screen .label.tonight'),
        screenTonight: !!document.querySelector('.screen.tonight'),
        showdate: (document.querySelector('.showdate') || {}).textContent,
        poster: !!document.querySelector('.screen-poster img'),
        posterRole: (document.querySelector('.screen-poster') || {}).getAttribute('role'),
        trailerHref: a ? a.href : null,
        trailerH: a ? Math.round(a.getBoundingClientRect().height) : 0,
        watch: !!document.querySelector('.screen-watch .watch-row'),
        hScroll: document.documentElement.scrollWidth > 390
      };
    });
    /* The projector is a marquee: poster, title, date, showtime. The trailer and
       where-to-stream moved to the Coming Attractions sheet in v3.5 — they must
       NOT be back on the screen, and the next check proves they're on the sheet. */
    check('tonight: label, glow, poster, and no trailer on the marquee',
      /Tonight’s feature/.test(s.label) && s.labelTonight && s.screenTonight &&
      /^Tonight ·/.test(s.showdate) && s.poster && s.posterRole === 'button' &&
      s.trailerHref === null && !s.watch && !s.hScroll, s);

    /* poster tap -> Coming Attractions sheet (no Anthropic key) */
    await page.click('.screen-poster');
    await page.waitForTimeout(500);
    const ca = await page.evaluate(() => {
      const t = document.querySelector('.ca-trailer');
      return {
        overlay: !!document.querySelector('.ai-overlay'),
        kicker: (document.querySelector('.ai-kicker') || {}).textContent,
        title: (document.querySelector('.ai-title') || {}).textContent,
        poster: !!document.querySelector('.ca-poster img'),
        chips: document.querySelectorAll('.ca-facts .idea-fact').length,
        trailerHref: t ? t.href : null,
        trailerH: t ? Math.round(t.getBoundingClientRect().height) : 0,
        watch: !!document.querySelector('.watch-row'),
        cta: (document.querySelector('.ai-gen') || {}).textContent,
        hasPack: !!document.querySelector('.ca-hype'),
        hScroll: document.documentElement.scrollWidth > 390
      };
    });
    check('poster tap opens sheet; degrades with no Claude key',
      ca.overlay && /Tonight’s feature/.test(ca.kicker) && ca.title === 'The Iron Giant' &&
      ca.poster && ca.chips >= 2 && ca.trailerHref === 'https://www.youtube.com/watch?v=TRAILERKEY' &&
      ca.trailerH >= 44 && ca.watch && /Open Settings/.test(ca.cta) && !ca.hasPack && !ca.hScroll, ca);
    await ctx.close();
  }

  /* 2. not tonight -> Coming up */
  {
    const { ctx, page } = await open({ name:'friday', when:'friday', poster:true, tmdbKey:true,
      facts: { fetchedAt: Date.now(), tmdbId:8392, videosTried:true, trailer:null } });
    const s = await page.evaluate(() => ({
      label: (document.querySelector('.screen .label') || {}).textContent,
      tonight: !!document.querySelector('.screen.tonight'),
      showdate: (document.querySelector('.showdate') || {}).textContent,
      trailerLink: !!document.querySelector('.screen-trailer .st-link'),
      trailerVisible: (function(){
        const w = document.querySelector('.screen-trailer');
        return w ? getComputedStyle(w).display !== 'none' : false;
      })(),
      hScroll: document.documentElement.scrollWidth > 390
    }));
    check('not tonight: "Coming up", no glow, no trailer when none exists',
      /Coming up/.test(s.label) && !s.tonight && !/Tonight/.test(s.showdate) &&
      !s.trailerLink && !s.trailerVisible && !s.hScroll, s);
    await ctx.close();
  }

  /* 3. trailer top-up for facts cached before trailers existed */
  {
    videoCalls = 0;
    const { ctx, page } = await open({ name:'topup', when:'friday', poster:true, tmdbId:true, tmdbKey:true,
      settle: 1400,
      facts: { fetchedAt: Date.now() - 90000000, tmdbId:8392, cert:'PG', runtime:86 } });
    const s = await page.evaluate(() => {
      const a = document.querySelector('.screen-trailer .st-link');
      const rec = JSON.parse(localStorage.getItem('fmn_data')).records.night_test_1;
      return {
        trailerHref: a ? a.href : null,
        savedTrailer: rec.facts && rec.facts.trailer ? rec.facts.trailer.key : null,
        videosTried: rec.facts ? rec.facts.videosTried : null
      };
    });
    /* the top-up is about what lands in the cache — the link itself is rendered
       on the sheet now, not the projector */
    check('old facts get a trailer topped up and cached',
      s.savedTrailer === 'TRAILERKEY' && s.videosTried === true && videoCalls >= 1,
      Object.assign({ videoCalls }, s));
    await ctx.close();
  }

  /* 4. pre-show pack generation with a Claude key */
  {
    const { ctx, page } = await open({ name:'pack', when:'friday', poster:true, tmdbId:true,
      tmdbKey:true, anthropicKey:true,
      facts: { fetchedAt: Date.now(), tmdbId:8392, videosTried:true, trailer:{key:'TRAILERKEY'} } });
    await page.click('.screen-poster');
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => (document.querySelector('.ai-gen') || {}).textContent);
    await page.click('.ai-gen');
    await page.waitForTimeout(1200);
    const s = await page.evaluate(() => {
      const rec = JSON.parse(localStorage.getItem('fmn_data')).records.pre_night_test_1;
      return {
        hype: (document.querySelector('.ca-hype') || {}).textContent,
        lookFor: document.querySelectorAll('.ai-fact').length,
        guess: document.querySelectorAll('.ai-talk').length,
        heads: !!document.querySelector('.ca-heads'),
        regen: !!document.querySelector('.ai-regen'),
        recType: rec ? rec.type : null,
        recId: rec ? rec.id : null,
        hScroll: document.documentElement.scrollWidth > 390
      };
    });
    check('pre-show pack generates, renders and is stored as a synced record',
      /Open Settings|Write the pre-show/.test(before) && /hundred-foot robot/.test(s.hype) &&
      s.lookFor === 3 && s.guess === 2 && s.heads && s.regen &&
      s.recType === 'preshow' && s.recId === 'pre_night_test_1' && !s.hScroll, s);
    await ctx.close();
  }

  /* 5. no keys at all, hand-typed night: still renders, sheet reachable via menu */
  {
    const { ctx, page } = await open({ name:'nokeys', when:'friday', poster:false });
    const s = await page.evaluate(() => ({
      screen: !!document.querySelector('.screen'),
      bookedTitle: (document.querySelector('.booked-title') || {}).textContent,
      posterImg: !!document.querySelector('.screen-poster img'),
      posterFocusable: !!document.querySelector('.screen-poster[tabindex]'),
      trailer: !!document.querySelector('.screen-trailer .st-link'),
      hScroll: document.documentElement.scrollWidth > 390
    }));
    await page.click('.night .del');
    await page.waitForTimeout(300);
    const menu = await page.evaluate(() => Array.prototype.map.call(
      document.querySelectorAll('.menu-item'), b => b.textContent));
    check('no keys: screen intact, no empty tap target, menu offers the sheet',
      s.screen && s.bookedTitle === 'The Iron Giant' && !s.posterImg && !s.posterFocusable &&
      !s.trailer && !s.hScroll && menu.some(t => /Coming attractions/.test(t)), { s, menu });

    /* the sheet itself with no TMDB and no Claude key */
    await page.evaluate(() => {
      document.querySelector('.modal-overlay').remove();
    });
    await page.evaluate(() => openComingAttractions(nights()[0]));
    await page.waitForTimeout(300);
    const sheet = await page.evaluate(() => ({
      title: (document.querySelector('.ai-title') || {}).textContent,
      chips: document.querySelectorAll('.ca-facts .idea-fact').length,
      cta: (document.querySelector('.ai-gen') || {}).textContent
    }));
    check('sheet degrades to title + Settings nudge with no keys',
      sheet.title === 'The Iron Giant' && sheet.chips === 0 && /Open Settings/.test(sheet.cta), sheet);
    await ctx.close();
  }

  /* 6. past night: no Coming attractions in the menu */
  {
    const { ctx, page } = await open({ name:'past', when:'past', poster:true });
    await page.click('.night .del');
    await page.waitForTimeout(300);
    const menu = await page.evaluate(() => Array.prototype.map.call(
      document.querySelectorAll('.menu-item'), b => b.textContent));
    check('watched night has no pre-show entry',
      !menu.some(t => /Coming attractions/.test(t)) && menu.some(t => /scrapbook/.test(t)), menu);
    await ctx.close();
  }

  /* 7. Settings backup nudge, and export clearing it */
  {
    const { ctx, page } = await open({ name:'backup', when:'friday', poster:true });
    await page.evaluate(() => { view = 'settings'; render(); });
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => {
      const cards = Array.prototype.slice.call(document.querySelectorAll('.set-card'));
      const card = cards.filter(c => /Backups/.test(c.textContent))[0];
      if (!card) return { missing: 'Backups card' };
      card.querySelector('.set-head').click();
      return {
        badge: card.querySelector('.set-badge').textContent,
        badgeOn: card.querySelector('.set-badge').classList.contains('on'),
        warn: !!card.querySelector('.set-warn'),
        note: card.querySelector('.set-note').textContent
      };
    });
    await page.waitForTimeout(200);
    const dl = page.waitForEvent('download').catch(() => null);
    await page.evaluate(() => {
      const cards = Array.prototype.slice.call(document.querySelectorAll('.set-card'));
      const card = cards.filter(c => /Backups/.test(c.textContent))[0];
      if (!card) return;
      const btn = Array.prototype.slice.call(card.querySelectorAll('.set-btn'))
        .filter(b => /Download backup/.test(b.textContent))[0];
      if (btn) btn.click();
    });
    await dl;
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => {
      const cards = Array.prototype.slice.call(document.querySelectorAll('.set-card'));
      const card = cards.filter(c => /Backups/.test(c.textContent))[0];
      const rec = JSON.parse(localStorage.getItem('fmn_data')).records.settings_backup;
      return {
        badge: card.querySelector('.set-badge').textContent,
        badgeOn: card.querySelector('.set-badge').classList.contains('on'),
        warn: !!card.querySelector('.set-warn'),
        recBy: rec ? rec.by : null,
        recType: rec ? rec.type : null,
        hasAt: !!(rec && rec.at)
      };
    });
    check('backup nudge shows when never, clears after export',
      before.badge === 'Never' && !before.badgeOn && before.warn && /No backup file/.test(before.note) &&
      after.badge === 'Today' && after.badgeOn && !after.warn &&
      after.recType === 'setting' && after.recBy === 'chris' && after.hasAt, { before, after });
    await ctx.close();
  }

  console.log(results.join('\n'));
  if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));
  await browser.close();
  process.exit(results.some(r => r.startsWith('FAIL')) || errors.length ? 1 : 0);
})();
