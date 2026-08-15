/* Every way a Claude call can fail, and the sentence the family gets for each.

   These exist because all of them used to produce the same toast — "Couldn't
   reach Claude, try again in a moment" — so an empty Anthropic account looked
   exactly like bad wifi, and "I'm repeatedly unable to pull after credits" came
   with no way to tell which one it was. Also covers the visible skip control on
   the lineup, since both shipped together in v3.7. */
const { APP, PNG, PIXEL, launch, reporter } = require('./lib/harness');

const GOOD = {
  facts: ['f1','f2','f3','f4','f5'],
  trivia: [{ q:'Who?', opts:['a','b','c','d'], a:1, note:'because' }],
  talk: ['t1','t2','t3']
};

/* today's night, already rated, so After the Credits is live */
function seed(){
  const az = new Intl.DateTimeFormat('en-CA', { timeZone:'America/Phoenix' }).format(new Date());
  localStorage.setItem('fmn_data', JSON.stringify({ records:{
    night_test_1: { id:'night_test_1', type:'night', title:'The Iron Giant', year:1999,
                    date: az, pickedBy:'kat', updatedAt: Date.now() },
    rx_night_test_1_kat: { id:'rx_night_test_1_kat', type:'reaction', nightId:'night_test_1',
                           memberId:'kat', stars:5, updatedAt: Date.now() }
  } }));
  localStorage.setItem('fmn_me', JSON.stringify('chris'));
  localStorage.setItem('fmn_sample_dismissed', JSON.stringify(true));
  localStorage.setItem('fmn_anthropic_key', JSON.stringify('sk-ant-testtesttest'));
}

(async () => {
  const browser = await launch();
  const R = reporter('claude');
  const errors = [];

  /* one after-credits generate against a stubbed Anthropic reply.
     handler(route, n) decides what the API says on attempt n. */
  async function runCase(name, handler, expect){
    R.note(name);
    const ctx = await browser.newContext({ viewport: PIXEL, colorScheme:'dark' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(name + ': ' + e.message));
    let calls = 0;
    await page.route('**image.tmdb.org/**', r => r.fulfill({ status:200, contentType:'image/png', body:PNG }));
    await page.route('**api.themoviedb.org/**', r => r.fulfill({ status:200, contentType:'application/json', body:'{}' }));
    await page.route('**api.anthropic.com/**', r => { calls++; return handler(r, calls); });
    await page.goto(APP);
    await page.evaluate(seed);
    await page.reload();
    await page.waitForTimeout(700);

    /* open it through the app's own entry point, not by poking the DOM */
    const opened = await page.evaluate(() => {
      const n = (typeof nights === 'function') ? nights()[0] : null;
      if (!n) return false;
      openAfterCredits(n);
      return true;
    });
    if (!opened){ R.check(name, false, 'no night to open'); await ctx.close(); return; }
    await page.waitForTimeout(200);
    const btn = await page.$('.ai-overlay .ai-gen');
    if (!btn){ R.check(name, false, 'no generate button'); await ctx.close(); return; }
    await btn.click({ timeout: 4000 }).catch(e => errors.push(name + ': click ' + e.message));
    await page.waitForTimeout(expect.wait || 1200);

    const state = await page.evaluate(() => ({
      err: (document.querySelector('.ai-overlay .ai-err') || {}).textContent || null,
      genLabel: (document.querySelector('.ai-overlay .ai-gen') || {}).textContent || null,
      facts: document.querySelectorAll('.ai-overlay .ai-fact').length
    }));
    R.check(name + ' · message',
      expect.match ? (state.err || '').indexOf(expect.match) !== -1 : state.err === null,
      { err: state.err, want: expect.match || '(none)' });
    if (expect.calls !== undefined) R.check(name + ' · attempts', calls === expect.calls, { calls, want: expect.calls });
    if (expect.facts !== undefined) R.check(name + ' · facts rendered', state.facts === expect.facts, { got: state.facts });
    if (expect.match) R.check(name + ' · try-again button', /Try again/.test(state.genLabel || ''), { label: state.genLabel });
    await ctx.close();
  }

  const json = (status, body) => (r) =>
    r.fulfill({ status, contentType:'application/json', body: JSON.stringify(body) });
  const ok = (text, stop) => (r) => r.fulfill({ status:200, contentType:'application/json',
    body: JSON.stringify({ content:[{ type:'text', text: text }], stop_reason: stop || 'end_turn' }) });

  /* the pack still arrives when nothing goes wrong */
  await runCase('happy path', ok(JSON.stringify(GOOD)), { match:null, facts:5, calls:1 });

  /* a fence and a sentence of preamble shouldn't cost the family their pack */
  await runCase('fenced + preamble',
    ok('Sure! Here you go:\n```json\n' + JSON.stringify(GOOD) + '\n```'),
    { match:null, facts:5 });

  await runCase('401 bad key',
    json(401, { error:{ type:'authentication_error', message:'invalid x-api-key' } }),
    { match:'rejected', calls:1 });

  /* an empty balance arrives as 400 on some plans and 403 on others */
  await runCase('400 credit balance',
    json(400, { error:{ type:'invalid_request_error', message:'Your credit balance is too low to access the Anthropic API' } }),
    { match:'out of credit', calls:1 });
  await runCase('403 billing',
    json(403, { error:{ type:'billing_error', message:'credit balance too low' } }),
    { match:'out of credit', calls:1 });

  await runCase('403 permission',
    json(403, { error:{ type:'permission_error', message:'not allowed' } }),
    { match:'isn’t allowed to use', calls:1 });

  await runCase('404 model',
    json(404, { error:{ type:'not_found_error', message:'model not found' } }),
    { match:'needs an update', calls:1 });

  /* busy retries three times, then says so in its own words */
  await runCase('529 overloaded',
    json(529, { error:{ type:'overloaded_error', message:'Overloaded' } }),
    { match:'busy right now', calls:3, wait:6000 });

  /* ...and a passing overload never reaches the family at all */
  await runCase('529 then success',
    (r, n) => n < 3
      ? r.fulfill({ status:529, contentType:'application/json', body: JSON.stringify({ error:{ type:'overloaded_error' } }) })
      : r.fulfill({ status:200, contentType:'application/json',
          body: JSON.stringify({ content:[{ type:'text', text: JSON.stringify(GOOD) }], stop_reason:'end_turn' }) }),
    { match:null, facts:5, calls:3, wait:6000 });

  /* an answer that stopped at max_tokens reads differently from a bad shape,
     and is fixed differently too */
  await runCase('truncated', ok('{"facts":["one","two thr', 'max_tokens'), { match:'cut off', calls:1 });

  /* The real one Chris hit, on River's pick: a small film Claude doesn't know.
     It answers in prose, which can never parse — so the app used to blame the
     JSON. The prompt now offers {"unknown":true} as a way to say so. */
  await runCase('film Claude doesn’t know',
    ok(JSON.stringify({ unknown: true })),
    { match:'doesn’t know a film called', calls:1 });
  await runCase('unknown film names the title',
    ok(JSON.stringify({ unknown: true })),
    { match:'The Iron Giant', calls:1 });

  /* prose retries once, told plainly to send JSON only... */
  await runCase('prose retries and recovers',
    (r, n) => n === 1
      ? r.fulfill({ status:200, contentType:'application/json',
          body: JSON.stringify({ content:[{ type:'text', text:'I would love to help with that movie!' }], stop_reason:'end_turn' }) })
      : r.fulfill({ status:200, contentType:'application/json',
          body: JSON.stringify({ content:[{ type:'text', text: JSON.stringify(GOOD) }], stop_reason:'end_turn' }) }),
    { match:null, facts:5, calls:2 });

  /* ...and when it won't comply, the family sees what it actually said, which
     is the whole diagnosis */
  await runCase('prose twice quotes what Claude said',
    ok('I am not familiar with a film by that title.'),
    { match:'I am not familiar with a film by that title', calls:2 });
  await runCase('empty answer', ok(''), { match:'empty answer', calls:1 });
  await runCase('network down', (r) => r.abort('failed'), { match:'check your connection', calls:3, wait:6000 });

  /* ---- "no movie night" has to be visible, not just tappable ---- */
  {
    R.note('lineup skip control');
    const ctx = await browser.newContext({ viewport: PIXEL, colorScheme:'dark' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('skip: ' + e.message));
    await page.route('**api.themoviedb.org/**', r => r.fulfill({ status:200, contentType:'application/json', body:'{}' }));
    await page.goto(APP);
    await page.evaluate(() => {
      localStorage.setItem('fmn_data', JSON.stringify({ records:{} }));
      localStorage.setItem('fmn_me', JSON.stringify('chris'));
      localStorage.setItem('fmn_sample_dismissed', JSON.stringify(true));
    });
    await page.reload();
    await page.waitForTimeout(700);

    const before = await page.evaluate(() => {
      const rows = [].slice.call(document.querySelectorAll('.lu-row.lu-tap'));
      return {
        taps: rows.length,
        chips: rows.map(r => (r.querySelector('.lu-skip') || {}).textContent || null),
        tall: rows.every(r => r.getBoundingClientRect().height >= 44)
      };
    });
    R.check('lineup · every open Friday is tappable', before.taps > 0, before);
    /* only the next one wears the label — on every row it read as a status
       ("no movie night" four times) rather than a choice */
    R.check('lineup · only the next one is labelled',
      before.chips[0] === 'Skip this one' && before.chips.slice(1).every(c => c === null), before);
    R.check('lineup · rows are still 44px+', before.tall, { tall: before.tall });

    await page.click('.lu-row.lu-tap', { timeout: 4000 }).catch(e => errors.push('skip click: ' + e.message));
    await page.waitForTimeout(250);
    const modal = await page.evaluate(() => (document.querySelector('.modal-box h3') || {}).textContent || null);
    R.check('lineup · modal asks first', modal === 'Skip this Friday?', { modal });

    await page.evaluate(() => {
      const b = [].slice.call(document.querySelectorAll('.modal-box button'))
        .filter(x => x.textContent === 'Skip it')[0];
      if (b) b.click();
    });
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => {
      const row = document.querySelector('.lu-row.skipped');
      return {
        skipped: !!row,
        chip: row ? (row.querySelector('.lu-skip') || {}).textContent : null,
        label: row ? row.textContent : null
      };
    });
    R.check('lineup · flips to put-it-back', after.skipped && after.chip === 'Put it back', after);
    R.check('lineup · says no movie night', /No movie night/.test(after.label || ''), { label: after.label });
    await ctx.close();
  }

  await R.finish(browser, errors);
})().catch(e => { console.log('THREW: ' + e.message); process.exit(1); });
