/* Projector-screen poster smoke test against the BUILT index.html.
   Cases:
   1. Booked upcoming night with posterPath -> poster img visible on screen
   2. Booked night, image 404s -> poster wrap empty and hidden (fallback)
   3. Booked night without posterPath -> poster wrap empty and hidden
   4. Nothing booked -> no poster wrap at all, screen still renders
*/
const { APP, launch } = require('./lib/harness');

// 1x1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64');

function nightSeed(withPoster){
  // a booked night on the next Friday (computed in-page with AZ-equivalent logic)
  return function(posterOn){
    const now = new Date();
    const az = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Phoenix' }).format(now);
    const p = az.split('-').map(Number);
    const d = new Date(p[0], p[1]-1, p[2]);
    d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7));
    const date = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    const night = {
      id: 'night_test_1', type: 'night', title: 'The Iron Giant', year: 1999,
      date, pickedBy: 'chris', updatedAt: Date.now(),
      posterPath: posterOn ? '/fake-poster.jpg' : null
    };
    localStorage.setItem('fmn_data', JSON.stringify({ records: { night_test_1: night } }));
    localStorage.setItem('fmn_me', JSON.stringify('chris'));
    localStorage.setItem('fmn_sample_dismissed', JSON.stringify(true));
  };
}

(async () => {
  const browser = await launch();
  const results = [];
  const errors = [];

  async function run(name, { seedPoster, imageOk, seedNight = true }, check){
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(name + ': ' + e.message));
    await page.route('**image.tmdb.org/**', route => {
      if (imageOk) route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
      else route.fulfill({ status: 404, body: 'nope' });
    });
    await page.goto(APP);
    if (seedNight) await page.evaluate(nightSeed(), seedPoster);
    else await page.evaluate(() => {
      localStorage.setItem('fmn_data', JSON.stringify({ records: {} }));
      localStorage.setItem('fmn_sample_dismissed', JSON.stringify(true));
    });
    await page.reload();
    await page.waitForTimeout(600);
    const state = await page.evaluate(() => {
      const wrap = document.querySelector('.screen-poster');
      const img = document.querySelector('.screen-poster img');
      return {
        screen: !!document.querySelector('.screen'),
        bookedTitle: (document.querySelector('.booked-title') || {}).textContent || null,
        wrap: !!wrap,
        wrapVisible: wrap ? getComputedStyle(wrap).display !== 'none' : false,
        img: !!img,
        imgW: img ? img.getBoundingClientRect().width : 0,
        hScroll: document.documentElement.scrollWidth > 390,
        rotChips: document.querySelectorAll('.rot-chip').length,
        rotOneLine: (function(){
          const r = document.querySelector('.rotation');
          return r ? r.getBoundingClientRect().height < 50 : false;
        })(),
        rotLabel: (document.querySelector('.rotation') || { getAttribute: () => null }).getAttribute('aria-label')
      };
    });
    const ok = check(state);
    results.push((ok ? 'PASS' : 'FAIL') + '  ' + name + '  ' + JSON.stringify(state));
    await ctx.close();
  }

  await run('poster shows on booked night', { seedPoster: true, imageOk: true },
    s => s.screen && s.bookedTitle === 'The Iron Giant' && s.img && s.wrapVisible && s.imgW > 80 && s.imgW <= 172 && !s.hScroll
      && s.rotChips === 4 && s.rotOneLine && /Pick order/.test(s.rotLabel || ''));
  await run('broken image hides cleanly', { seedPoster: true, imageOk: false },
    s => s.screen && s.wrap && !s.img && !s.wrapVisible && !s.hScroll);
  await run('no posterPath hides cleanly', { seedPoster: false, imageOk: true },
    s => s.screen && s.wrap && !s.img && !s.wrapVisible && !s.hScroll);
  await run('nothing booked, no wrap', { seedNight: false, seedPoster: false, imageOk: true },
    s => s.screen && !s.wrap && !s.img && !s.hScroll);

  console.log(results.join('\n'));
  if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));
  await browser.close();
  process.exit(results.some(r => r.startsWith('FAIL')) || errors.length ? 1 : 0);
})();
