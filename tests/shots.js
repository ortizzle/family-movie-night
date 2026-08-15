const { APP, launch } = require('./lib/harness');
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="342" height="513">
  <rect width="342" height="513" fill="#1d2b45"/>
  <circle cx="171" cy="185" r="82" fill="#7FB4E8" opacity=".85"/>
  <rect y="372" width="342" height="141" fill="#0e1524"/>
  <text x="171" y="432" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#F3EADA" font-weight="bold">THE IRON</text>
  <text x="171" y="470" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#F3EADA" font-weight="bold">GIANT</text>
</svg>`;
const DETAILS = {
  id: 8392, release_date: '1999-08-06', runtime: 86, vote_average: 7.9, imdb_id: 'tt0129167',
  release_dates: { results: [{ iso_3166_1:'US', release_dates:[{certification:'PG'}] }] },
  'watch/providers': { results: { US: { link:'https://x', flatrate:[{provider_name:'Max'}] } } },
  videos: { results: [{ site:'YouTube', type:'Trailer', key:'TRAILERKEY', official:true, name:'Trailer' }] }
};
const PACK = {
  hype: 'A boy finds a hundred-foot robot in the woods, and the movie treats that with more heart than most live-action epics manage. It earns every quiet moment.',
  lookFor: ['The hand-drawn giant moving against painted backgrounds — two different techniques sharing one frame',
            'How little the giant actually says, and how much it still gets across',
            'The espresso running gag, which pays off later'],
  guess: ['Who in this family cries first', 'Whether River names the giant his favorite character'],
  heads: 'One tense military sequence near the end — loud, but nothing graphic.'
};

(async () => {
  const browser = await launch();

  async function shot(name, opts){
    const ctx = await browser.newContext({ viewport:{width:390,height:opts.h||760}, colorScheme:opts.theme||'dark', deviceScaleFactor:2 });
    const page = await ctx.newPage();
    await page.route('**image.tmdb.org/**', r => r.fulfill({status:200,contentType:'image/svg+xml',body:SVG}));
    await page.route('**api.themoviedb.org/**', r => r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(DETAILS)}));
    await page.route('**api.anthropic.com/**', r => r.fulfill({status:200,contentType:'application/json',
      body: JSON.stringify({content:[{type:'text',text:JSON.stringify(PACK)}]})}));
    await page.goto(APP);
    await page.evaluate((o) => {
      const az = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Phoenix'}).format(new Date());
      const p = az.split('-').map(Number);
      const d = new Date(p[0],p[1]-1,p[2]);
      let date = az;
      if (!o.today){
        d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7));
        date = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      }
      localStorage.setItem('fmn_data', JSON.stringify({records:{ night_test_1:{
        id:'night_test_1', type:'night', title:'The Iron Giant', year:1999, date:date,
        pickedBy:'kat', updatedAt:Date.now(), posterPath:'/mock.jpg', tmdbId:8392,
        facts:{ fetchedAt:Date.now(), tmdbId:8392, cert:'PG', runtime:86, videosTried:true,
                trailer:{key:'TRAILERKEY',name:'Trailer'}, tmdbScore:7.9,
                watch:{link:'https://x',stream:['Max'],rent:[]} }
      }}}));
      localStorage.setItem('fmn_me', JSON.stringify('chris'));
      localStorage.setItem('fmn_sample_dismissed', JSON.stringify(true));
      localStorage.setItem('fmn_tmdb_key', JSON.stringify('abc'));
      localStorage.setItem('fmn_anthropic_key', JSON.stringify('sk-ant-x'));
    }, opts);
    await page.reload();
    await page.waitForTimeout(700);
    if (opts.sheet){
      await page.click('.screen-poster');
      await page.waitForTimeout(400);
      await page.click('.ai-gen');
      await page.waitForTimeout(1000);
      await page.evaluate(() => window.scrollTo(0,0));
      await page.screenshot({ path:name, fullPage: true });
    } else {
      const box = await page.locator('.screenbox').boundingBox();
      await page.screenshot({ path:name, clip:{x:0,y:0,width:390,height:Math.min(760, box.y+box.height+16)} });
    }
    await ctx.close();
  }

  await shot('v33-tonight.png', { today:true });
  await shot('v33-sheet.png', { sheet:true, h:900 });
  await browser.close();
  console.log('shots saved');
})();
