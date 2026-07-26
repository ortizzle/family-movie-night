/* Family Movie Night — fmn/keepsakes.js
   Scrapbook, Year in Review, the Complete Collection, Claude packs, backups.

   These files load in a fixed order from index.html and share one global
   scope, exactly as the single inline script did. Order matters: boot.js
   runs the startup calls and must stay last. */

/* ---------- KEEPSAKE BUILDERS (shared by scrapbook + yearbook) ---------- */
function spTag(m){
  var t = el('span','sp-tag', m.name);
  t.style.background = m.onWhite;
  return t;
}
function spSection(title){
  var s = el('div','sp-section');
  s.appendChild(el('div','sp-sec-title', title));
  return s;
}
/* renders the by-question groups for one night into container */
function buildNightKeepsake(container, night){
  var rots = [-1.4, 1.1, -0.7, 1.6];
  var picker = memberById(night.pickedBy);
  var pickerRx = reactionFor(night.id, picker.id);

  /* why the picker chose it */
  if (pickerRx && pickerRx.why){
    var whySec = spSection('🎬 Why ' + picker.name + ' picked it');
    var why = el('div','sp-why');
    why.appendChild(spTag(picker));
    why.appendChild(el('div','why-text','“' + pickerRx.why + '”'));
    whySec.appendChild(why);
    container.appendChild(whySec);
  }

  /* ratings */
  var rated = MEMBERS.filter(function(m){
    var r = reactionFor(night.id, m.id);
    return r && r.stars > 0;
  });
  if (rated.length){
    var rateSec = spSection('⭐ Our ratings');
    var rates = el('div','sp-rates');
    rated.forEach(function(m){
      var r = reactionFor(night.id, m.id);
      var box = el('div','sp-rate');
      box.appendChild(spTag(m));
      box.appendChild(starsNode(r.stars));
      rates.appendChild(box);
    });
    rateSec.appendChild(rates);
    container.appendChild(rateSec);
  }

  /* what we thought */
  var thoughts = MEMBERS.filter(function(m){
    var r = reactionFor(night.id, m.id);
    return r && r.thought;
  });
  if (thoughts.length){
    var thoSec = spSection('💭 What we thought');
    thoughts.forEach(function(m, i){
      var r = reactionFor(night.id, m.id);
      var note = el('div','sp-note');
      note.appendChild(spTag(m));
      note.appendChild(document.createTextNode(' “' + r.thought + '”'));
      note.style.transform = 'rotate(' + (rots[i % 4] * 0.5) + 'deg)';
      thoSec.appendChild(note);
    });
    container.appendChild(thoSec);
  }

  /* the picker's own question, and what everyone said back */
  if (night.question){
    var ansMembers = MEMBERS.filter(function(m){
      var r = reactionFor(night.id, m.id);
      return r && r.answer;
    });
    if (ansMembers.length){
      var qaSec = spSection('❓ ' + memberById(night.pickedBy).name + ' asked');
      var asked = el('div','sp-asked', night.question);
      qaSec.appendChild(asked);
      ansMembers.forEach(function(m, i){
        var r = reactionFor(night.id, m.id);
        var note = el('div','sp-note');
        note.appendChild(spTag(m));
        note.appendChild(document.createTextNode(' ' + r.answer));
        note.style.transform = 'rotate(' + (rots[(i+1) % 4] * 0.5) + 'deg)';
        qaSec.appendChild(note);
      });
      container.appendChild(qaSec);
    }
  }

  /* favorite characters */
  var chars = MEMBERS.filter(function(m){
    var r = reactionFor(night.id, m.id);
    return r && r.character;
  });
  if (chars.length){
    var chSec = spSection('🌟 Favorite characters');
    chars.forEach(function(m){
      var r = reactionFor(night.id, m.id);
      var line = el('div','sp-char-line');
      line.appendChild(spTag(m));
      line.appendChild(document.createTextNode(' ' + r.character));
      chSec.appendChild(line);
    });
    container.appendChild(chSec);
  }

  /* quotes — comic speech bubbles, tails alternating sides.
     Matching lines from different people share one bubble. */
  var qGroups = nightQuoteGroups(night.id);
  if (qGroups.length){
    var qSec = spSection('💬 Quotes we kept');
    qGroups.forEach(function(g, qi){
      var wrap = el('div','sp-comic-wrap' + (qi % 2 ? ' flip' : ''));
      var bubble = el('div','sp-comic', g.text);
      bubble.style.transform = 'rotate(' + (rots[qi % 4] * 0.6) + 'deg)';
      wrap.appendChild(bubble);
      var tags = el('div','sp-tags');
      g.members.forEach(function(m){ tags.appendChild(spTag(m)); });
      if (g.members.length > 1) tags.appendChild(el('span','sp-both', sharedQuoteNote(g.members.length)));
      wrap.appendChild(tags);
      qSec.appendChild(wrap);
    });
    container.appendChild(qSec);
  }

  /* favorite scenes — screenplay pages */
  var sceneMembers = MEMBERS.filter(function(m){
    var r = reactionFor(night.id, m.id);
    return r && r.scene;
  });
  if (sceneMembers.length){
    var scSec = spSection('🎞 Favorite scenes');
    sceneMembers.forEach(function(m){
      var r = reactionFor(night.id, m.id);
      var pageEl = el('div','sp-scene');
      pageEl.appendChild(el('div','slug', m.name + '’s favorite scene'));
      pageEl.appendChild(el('div','cut','Cut to:'));
      pageEl.appendChild(el('div','action', r.scene));
      scSec.appendChild(pageEl);
    });
    container.appendChild(scSec);
  }

  /* memories */
  var anyMems = false;
  var mSec = spSection('📌 Memories from the couch');
  var mi = 0;
  MEMBERS.forEach(function(m){
    var r = reactionFor(night.id, m.id);
    rxMemories(r).forEach(function(mem){
      anyMems = true;
      var strip = el('div','sp-strip');
      strip.style.background = m.paper;
      strip.appendChild(spTag(m));
      strip.appendChild(document.createTextNode(' ' + mem));
      strip.style.transform = 'rotate(' + (rots[(mi+2) % 4] * 0.7) + 'deg)';
      mSec.appendChild(strip);
      mi++;
    });
  });
  if (anyMems) container.appendChild(mSec);

  /* the family poll */
  var tally = pollTally(night.id);
  if (tally.answered){
    var pSec = spSection('🗳 The family poll');
    [
      { label:'😂 Did we laugh?', list:tally.laughed },
      { label:'😢 Did we cry?', list:tally.cried },
      { label:'🔁 Would we see it again?', list:tally.rewatch },
      { label:'👀 Seen it before?', list:tally.seenBefore }
    ].forEach(function(pq){
      var row = el('div','sp-poll-row');
      row.appendChild(el('span','pq', pq.label));
      row.appendChild(el('span','tally', pq.list.length + '/' + tally.answered));
      var dots = el('span','sp-pdots');
      MEMBERS.forEach(function(m){
        var yes = pq.list.indexOf(m) !== -1;
        var d = el('span','sp-pdot', m.name.charAt(0));
        if (yes){
          d.style.background = m.onWhite;
          d.style.borderColor = m.onWhite;
          d.style.color = '#fff';
        }
        dots.appendChild(d);
      });
      row.appendChild(dots);
      pSec.appendChild(row);
    });
    container.appendChild(pSec);
  }
}
function keepsakeOverlay(){
  var overlay = el('div','scrap-overlay');
  var closeBtn = el('button','scrap-close','✕');
  closeBtn.setAttribute('aria-label','Close');
  closeBtn.addEventListener('click', function(){ overlay.remove(); });
  overlay.appendChild(closeBtn);
  return overlay;
}
function printButton(page){
  var pb = el('button','sp-print','🖨️ Save as PDF keepsake');
  pb.addEventListener('click', function(){ window.print(); });
  page.appendChild(pb);
  page.appendChild(el('div','sp-print-hint','In the print dialog choose “Save as PDF” — that file is the keepsake.'));
}

/* ---------- night scrapbook overlay ---------- */
function openScrapbook(night){
  var overlay = keepsakeOverlay();
  var page = el('div','scrap-page');
  var picker = memberById(night.pickedBy);

  page.appendChild(el('div','sp-kicker','Family Movie Night · Scrapbook'));
  page.appendChild(el('div','sp-title', night.title));
  page.appendChild(el('div','sp-date', AZ.prettyLong(night.date) + (night.year ? ' · ' + night.year : '')));

  var head = el('div','sp-head');
  var pol = el('div','sp-polaroid');
  var ph = el('div','ph');
  if (night.posterPath){
    var img = document.createElement('img');
    img.alt = ''; img.src = TMDB_IMG + night.posterPath;
    img.addEventListener('error', function(){
      img.remove();
      ph.style.background = night.grad || '#4E3E51';
      ph.appendChild(document.createTextNode(night.title));
    });
    ph.appendChild(img);
  } else {
    ph.style.background = night.grad || 'linear-gradient(160deg,#4E3E51,#2E2430)';
    ph.appendChild(document.createTextNode(night.title));
  }
  pol.appendChild(ph);
  pol.appendChild(el('div','cap', picker.name + '’s pick 🍿'));
  head.appendChild(pol);

  var side = el('div','sp-headside');
  var avg = familyAvg(night.id);
  if (avg !== null){
    var av = el('div','sp-avg');
    av.appendChild(starsNode(avg));
    av.appendChild(el('small', null, 'family score: ' + avg.toFixed(1) + ' / 5'));
    side.appendChild(av);
  }
  var ticket = el('span','ticket');
  var adm = el('span','admit','🎟');
  adm.style.background = picker.color;
  var tnm = el('span','tname','Admit Four');
  tnm.style.background = picker.color;
  ticket.appendChild(adm); ticket.appendChild(tnm);
  side.appendChild(ticket);

  // the film's own vitals, under the ticket
  var factsBox = el('div','sp-facts');
  function paintFacts(f){
    while (factsBox.firstChild) factsBox.removeChild(factsBox.firstChild);
    if (!f) return;
    if (f.cert) factsBox.appendChild(el('span','sp-fact cert', f.cert));
    if (f.released) factsBox.appendChild(el('span','sp-fact', f.released.slice(0,4)));
    if (f.runtime) factsBox.appendChild(el('span','sp-fact', Math.floor(f.runtime/60) + 'h ' + (f.runtime%60) + 'm'));
    if (f.imdb) factsBox.appendChild(imdbGuideChip(f, 'sp-fact'));
    if (f.rt) factsBox.appendChild(el('span','sp-fact rt','🍅 ' + f.rt));
    if (f.meta) factsBox.appendChild(el('span','sp-fact','Metacritic ' + f.meta));
    if (!f.imdb && f.tmdbScore) factsBox.appendChild(el('span','sp-fact star','★ ' + Number(f.tmdbScore).toFixed(1) + ' TMDB'));
  }
  paintFacts(night.facts);
  ensureNightFacts(night, paintFacts);
  side.appendChild(factsBox);

  head.appendChild(side);
  page.appendChild(head);

  buildNightKeepsake(page, night);

  var waiting = MEMBERS.filter(function(m){ return !rxHasContent(reactionFor(night.id, m.id)); });
  if (waiting.length){
    page.appendChild(el('div','sp-waiting',
      'still waiting on ' + waiting.map(function(m){ return m.name; }).join(' & ') + ' … 🍿'));
  }
  printButton(page);
  var ac = el('button','sp-after','✨ After-credits pack for this movie');
  ac.addEventListener('click', function(){ overlay.remove(); openAfterCredits(night); });
  page.appendChild(ac);
  page.appendChild(el('div','sp-foot','The Ortiz Family · est. Fridays'));

  overlay.appendChild(page);
  document.body.appendChild(overlay);
}

/* ---------- YEAR IN REVIEW keepsake ---------- */
function openYearbook(year){
  var yearNights = nights().filter(function(n){ return n.date.slice(0,4) === String(year); })
    .sort(function(a,b){ return a.date < b.date ? -1 : 1; });
  if (!yearNights.length){ toast('No movie nights logged in ' + year + ' yet'); return; }

  var overlay = keepsakeOverlay();
  var page = el('div','scrap-page');

  /* cover */
  var cover = el('div','yb-cover');
  cover.appendChild(el('div','yb-eyebrow','The Ortiz Family Presents'));
  cover.appendChild(el('div','sp-title','Family Movie Night'));
  cover.appendChild(el('div','yb-year', String(year)));
  cover.appendChild(el('div','yb-sub','a year on the couch, together'));

  var avgs = [];
  var quoteCount = 0, memCount = 0, firstWatches = 0;
  var best = null;
  yearNights.forEach(function(n){
    var a = familyAvg(n.id);
    if (a !== null){
      avgs.push(a);
      if (!best || a > best.avg) best = { n:n, avg:a };
    }
    MEMBERS.forEach(function(m){
      var r = reactionFor(n.id, m.id);
      quoteCount += rxQuotes(r).length;
      memCount += rxMemories(r).length;
      if (r && r.poll && !r.poll.seenBefore) firstWatches++;
    });
  });
  var stats = el('div','yb-stats');
  [
    { n:String(yearNights.length), l:'movie nights' },
    { n:avgs.length ? (avgs.reduce(function(a,b){return a+b;},0)/avgs.length).toFixed(1) + '★' : '—', l:'avg family score' },
    { n:String(quoteCount), l:'quotes kept' },
    { n:String(memCount), l:'memories saved' },
    { n:String(firstWatches), l:'first watches' }
  ].forEach(function(s){
    var t = el('div','yb-stat');
    t.appendChild(el('div','n', s.n));
    t.appendChild(el('div','l', s.l));
    stats.appendChild(t);
  });
  cover.appendChild(stats);
  if (best){
    var b = el('div','yb-best');
    b.appendChild(document.createTextNode('🏆 Highest-rated night: '));
    b.appendChild(el('b', null, best.n.title));
    b.appendChild(document.createTextNode(' (' + best.avg.toFixed(1) + '★, ' + memberById(best.n.pickedBy).name + '’s pick)'));
    cover.appendChild(b);
  }
  printButton(cover);
  page.appendChild(cover);

  /* one section per night, chronological */
  yearNights.forEach(function(n){
    var sec = el('div','yb-night');
    var picker = memberById(n.pickedBy);
    sec.appendChild(el('div','sp-kicker', AZ.prettyLong(n.date)));
    sec.appendChild(el('div','sp-title', n.title));
    var avg = familyAvg(n.id);
    sec.appendChild(el('div','sp-date',
      picker.name + '’s pick' + (n.year ? ' · ' + n.year : '') + (avg !== null ? ' · family score ' + avg.toFixed(1) + '★' : '')));
    buildNightKeepsake(sec, n);
    page.appendChild(sec);
  });

  page.appendChild(el('div','sp-foot','The Ortiz Family · ' + year + ' · est. Fridays'));
  overlay.appendChild(page);
  document.body.appendChild(overlay);
}

/* ---------- THE COMPLETE COLLECTION (every night, all time) ----------
   Cover → table of contents → full stats → every movie in order. */
function collectionStats(list){
  var s = {
    nights: list.length, avgs: [], quotes: 0, memories: 0, scenes: 0,
    firstWatches: 0, laughs: 0, cries: 0, rewatch: 0,
    best: null, worst: null, mostQuoted: null, split: null,
    perMember: {}
  };
  MEMBERS.forEach(function(m){
    s.perMember[m.id] = { m:m, picks:0, given:[], received:[], fives:0, quotes:0, memories:0 };
  });
  list.forEach(function(n){
    var avg = familyAvg(n.id);
    if (avg !== null){
      s.avgs.push(avg);
      if (!s.best || avg > s.best.avg) s.best = { n:n, avg:avg };
      if (!s.worst || avg < s.worst.avg) s.worst = { n:n, avg:avg };
      if (s.perMember[n.pickedBy]) s.perMember[n.pickedBy].received.push(avg);
    }
    if (s.perMember[n.pickedBy]) s.perMember[n.pickedBy].picks++;

    var nightQuotes = 0;
    MEMBERS.forEach(function(m){
      var r = reactionFor(n.id, m.id);
      if (!r) return;
      var pm = s.perMember[m.id];
      if (r.stars){ pm.given.push(r.stars); if (r.stars === 5) pm.fives++; }
      var qn = rxQuotes(r).length, mn = rxMemories(r).length;
      pm.quotes += qn; pm.memories += mn;
      s.quotes += qn; s.memories += mn; nightQuotes += qn;
      if (r.scene) s.scenes++;
      if (r.poll){
        if (r.poll.laughed) s.laughs++;
        if (r.poll.cried) s.cries++;
        if (r.poll.rewatch) s.rewatch++;
        if (!r.poll.seenBefore) s.firstWatches++;
      }
    });
    if (nightQuotes && (!s.mostQuoted || nightQuotes > s.mostQuoted.count)){
      s.mostQuoted = { n:n, count:nightQuotes };
    }
    var rs = reactionsFor(n.id).filter(function(r){ return r.stars > 0; });
    if (rs.length >= 2){
      var mn2 = 6, mx = 0, mnW = null, mxW = null;
      rs.forEach(function(r){
        if (r.stars < mn2){ mn2 = r.stars; mnW = memberById(r.member).name; }
        if (r.stars > mx){ mx = r.stars; mxW = memberById(r.member).name; }
      });
      if (mx - mn2 > 0 && (!s.split || mx - mn2 > s.split.spread)){
        s.split = { n:n, spread:mx-mn2, lo:mn2, hi:mx, loWho:mnW, hiWho:mxW };
      }
    }
  });
  return s;
}
function openCollection(){
  var list = nights().slice().sort(function(a,b){ return a.date < b.date ? -1 : 1; });
  if (!list.length){ toast('Log a movie night first — then the collection is worth printing'); return; }

  var overlay = keepsakeOverlay();
  var page = el('div','scrap-page');
  var s = collectionStats(list);
  var avgAll = s.avgs.length ? s.avgs.reduce(function(a,b){return a+b;},0)/s.avgs.length : null;
  var first = list[0].date, last = list[list.length-1].date;

  /* ---- cover ---- */
  var cover = el('div','ks-cover ks-page');
  cover.appendChild(el('div','ks-crest','🎬'));
  cover.appendChild(el('div','yb-eyebrow','The Ortiz Family Presents'));
  cover.appendChild(el('div','sp-title','Family Movie Night'));
  cover.appendChild(el('div','ks-rule'));
  cover.appendChild(el('div','yb-sub','the complete collection'));
  cover.appendChild(el('div','sp-date', AZ.prettyLong(first) + ' — ' + AZ.prettyLong(last)));
  var band = el('div','ks-stat-band');
  [
    { n:String(s.nights), l:'movie nights' },
    { n:avgAll === null ? '—' : avgAll.toFixed(1) + '★', l:'family score' },
    { n:String(s.quotes), l:'quotes kept' },
    { n:String(s.memories), l:'memories' }
  ].forEach(function(t){
    var d = el('div','ks-tile');
    d.appendChild(el('div','n', t.n));
    d.appendChild(el('div','l', t.l));
    band.appendChild(d);
  });
  cover.appendChild(band);
  var cast = el('div','ks-cast');
  MEMBERS.forEach(function(m){
    var w = el('div','who');
    var dot = el('span','dot', m.name.charAt(0));
    dot.style.background = m.onWhite;
    w.appendChild(dot);
    w.appendChild(document.createTextNode(m.name));
    cast.appendChild(w);
  });
  cover.appendChild(cast);
  printButton(cover);
  page.appendChild(cover);

  /* ---- table of contents ---- */
  var toc = el('div','ks-page');
  toc.appendChild(el('div','ks-h2','Table of Contents'));
  toc.appendChild(el('div','ks-sub','every Friday, in order'));
  var tocList = el('div','toc');
  list.forEach(function(n, i){
    var row = el('div','toc-row');
    row.appendChild(el('span','toc-no','No. ' + (i+1)));
    row.appendChild(el('span','toc-title', n.title));
    row.appendChild(el('span','toc-dots'));
    var meta = el('span','toc-meta', AZ.monthDay(n.date) + ' · ' + memberById(n.pickedBy).name);
    var avg = familyAvg(n.id);
    if (avg !== null) meta.appendChild(el('span','toc-score', avg.toFixed(1) + '★'));
    row.appendChild(meta);
    tocList.appendChild(row);
  });
  toc.appendChild(tocList);
  page.appendChild(toc);

  /* ---- complete stats ---- */
  var st = el('div','ks-page');
  st.appendChild(el('div','ks-h2','The Family Record Book'));
  st.appendChild(el('div','ks-sub','everything, added up'));

  var band2 = el('div','ks-stat-band');
  [
    { n:String(s.nights), l:'nights' },
    { n:avgAll === null ? '—' : avgAll.toFixed(1) + '★', l:'avg score' },
    { n:String(s.quotes), l:'quotes' },
    { n:String(s.memories), l:'memories' },
    { n:String(s.scenes), l:'scenes' },
    { n:String(s.firstWatches), l:'first watches' },
    { n:String(s.laughs), l:'laughs' },
    { n:String(s.cries), l:'good cries' }
  ].forEach(function(t){
    var d = el('div','ks-tile');
    d.appendChild(el('div','n', t.n));
    d.appendChild(el('div','l', t.l));
    band2.appendChild(d);
  });
  st.appendChild(band2);

  var table = el('table','ks-table');
  var thead = el('thead');
  var hr = el('tr');
  [['Who',''],['Picks','num'],['Avg given','num'],['Their picks','num'],['5★','num'],['Quotes','num'],['Memories','num']]
    .forEach(function(h){ var th = el('th', h[1], h[0]); hr.appendChild(th); });
  thead.appendChild(hr);
  table.appendChild(thead);
  var tbody = el('tbody');
  MEMBERS.forEach(function(m){
    var pm = s.perMember[m.id];
    var g = mean(pm.given), rc = mean(pm.received);
    var tr = el('tr');
    var td0 = el('td','who', m.name);
    td0.style.color = m.onWhite;
    tr.appendChild(td0);
    [String(pm.picks), g===null?'—':g.toFixed(1), rc===null?'—':rc.toFixed(1)+'★',
     String(pm.fives), String(pm.quotes), String(pm.memories)]
      .forEach(function(v){ tr.appendChild(el('td','num', v)); });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  st.appendChild(table);

  var awards = el('div','ks-awards');
  function award(medal, title, value, detail){
    var a = el('div','ks-award');
    a.appendChild(el('div','medal', medal));
    var b = el('div','body');
    b.appendChild(el('div','t', title));
    b.appendChild(el('div','v', value));
    if (detail) b.appendChild(el('div','d', detail));
    a.appendChild(b);
    awards.appendChild(a);
  }
  if (s.best) award('🏆','Best Picture', s.best.n.title,
    s.best.avg.toFixed(1) + '★ · ' + memberById(s.best.n.pickedBy).name + '’s pick · ' + AZ.prettyLong(s.best.n.date));
  if (s.mostQuoted) award('💬','Most Quotable', s.mostQuoted.n.title,
    s.mostQuoted.count + ' quote' + (s.mostQuoted.count===1?'':'s') + ' saved from one night');
  if (s.split) award('💥','Biggest Split Decision', s.split.n.title,
    s.split.hiWho + ' gave it ' + starText(s.split.hi) + '★ … ' + s.split.loWho + ' gave it ' + starText(s.split.lo) + '★.');
  var critic = null, pleaser = null, quoter = null;
  MEMBERS.forEach(function(m){
    var pm = s.perMember[m.id];
    var g = mean(pm.given), rc = mean(pm.received);
    if (g !== null && (!critic || g < critic.v)) critic = { m:m, v:g };
    if (rc !== null && (!pleaser || rc > pleaser.v)) pleaser = { m:m, v:rc };
    if (!quoter || pm.quotes > quoter.v) quoter = { m:m, v:pm.quotes };
  });
  if (critic) award('🍅','Toughest Critic', critic.m.name, 'averages ' + critic.v.toFixed(1) + '★ across every night');
  if (pleaser) award('🎉','Crowd Pleaser', pleaser.m.name, 'their picks average ' + pleaser.v.toFixed(1) + '★ with the family');
  if (quoter && quoter.v > 0) award('🎙','Keeper of the Quotes', quoter.m.name, quoter.v + ' quotes saved for the wall');
  if (s.rewatch) award('🔁','Would Watch Again', s.rewatch + ' votes', 'across ' + s.nights + ' night' + (s.nights===1?'':'s'));
  st.appendChild(awards);
  page.appendChild(st);

  /* ---- every night, numbered to match the contents ---- */
  list.forEach(function(n, i){
    var sec = el('div','yb-night');
    var picker = memberById(n.pickedBy);
    sec.appendChild(el('div','yb-no','No. ' + (i+1)));
    sec.appendChild(el('div','sp-kicker', AZ.prettyLong(n.date)));
    sec.appendChild(el('div','sp-title', n.title));
    var avg = familyAvg(n.id);
    sec.appendChild(el('div','sp-date',
      picker.name + '’s pick' + (n.year ? ' · ' + n.year : '') + (avg !== null ? ' · family score ' + avg.toFixed(1) + '★' : '')));
    buildNightKeepsake(sec, n);
    page.appendChild(sec);
  });

  page.appendChild(el('div','sp-foot','The Ortiz Family · est. Fridays'));
  overlay.appendChild(page);
  document.body.appendChild(overlay);
}

/* ---------- Claude: after-credits packs (browser-direct, canonical) ---------- */
function askClaude(prompt, opts){
  opts = opts || {};
  var key = Store.get('anthropic_key');
  if (!key) return Promise.reject(new Error('NO_KEY'));
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: opts.maxTokens || 1400,
      system: opts.system || undefined,
      messages: [{ role:'user', content: prompt }]
    })
  }).then(function(res){
    if (res.status === 401) throw new Error('BAD_KEY');
    if (!res.ok) throw new Error('Claude API error: ' + res.status);
    return res.json();
  }).then(function(d){
    return d.content.filter(function(b){ return b.type === 'text'; })
      .map(function(b){ return b.text; }).join('\n');
  });
}
function aiPackFor(nightId){
  var r = data.records['ai_' + nightId];
  return (r && !r.deleted && r.facts) ? r : null;
}
function generatePack(night){
  var system = 'You create after-movie discussion packs for a family movie night. '
    + 'The family: Chris and Kat (parents), Sedona and River (kids). '
    + 'Everything must be family-friendly, warm, and fun. Avoid spoiling major twists in the facts; '
    + 'the family has JUST watched the movie, so trivia and discussion questions may reference the plot freely.';
  var prompt = 'Movie: "' + night.title + '"' + (night.year ? ' (' + night.year + ')' : '') + '.\n'
    + 'Respond with ONLY valid JSON, no markdown fences, exactly this shape:\n'
    + '{"facts":["5 short, surprising behind-the-scenes fun facts about this movie"],'
    + '"trivia":[{"q":"question about this movie","opts":["4 options"],"a":0,"note":"one-line fun explanation"} x3],'
    + '"talk":["3 discussion questions for the family to talk about together after watching"]}';
  return askClaude(prompt, { system: system, maxTokens: 1600 }).then(function(text){
    var t = text.trim();
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    var obj = JSON.parse(t);
    if (!obj || !obj.facts || !obj.facts.length || !obj.trivia || !obj.talk) throw new Error('BAD_SHAPE');
    var rec = {
      id: 'ai_' + night.id, type: 'ai', nightId: night.id, title: night.title,
      facts: obj.facts.slice(0, 6),
      trivia: obj.trivia.slice(0, 4),
      talk: obj.talk.slice(0, 4),
      updatedAt: Date.now()
    };
    if (night.sample) rec.sample = true; // demo packs stay off the family gist
    data.records[rec.id] = rec;
    saveData();
    return rec;
  });
}
function openAfterCredits(night){
  var overlay = el('div','ai-overlay');
  var closeBtn = el('button','scrap-close','✕');
  closeBtn.setAttribute('aria-label','Close');
  closeBtn.addEventListener('click', function(){ overlay.remove(); });
  overlay.appendChild(closeBtn);
  var page = el('div','ai-page');
  overlay.appendChild(page);
  var loading = false;

  function startGenerate(){
    loading = true;
    paint();
    generatePack(night).then(function(){
      loading = false;
      paint();
      confettiBurst(20);
    }).catch(function(e){
      loading = false;
      paint();
      if (e && e.message === 'BAD_KEY') toast('That Anthropic key was rejected — check it in Settings');
      else if (e && e.message === 'NO_KEY') toast('Add an Anthropic key in Settings first');
      else toast('Couldn’t reach Claude — try again in a moment');
    });
  }

  function paint(){
    while (page.firstChild) page.removeChild(page.firstChild);
    page.appendChild(el('div','ai-kicker','✨ After the Credits'));
    page.appendChild(el('div','ai-title', night.title));
    page.appendChild(el('div','ai-sub', memberById(night.pickedBy).name + '’s pick · ' + AZ.pretty(night.date)));

    var pack = aiPackFor(night.id);
    var hasKey = !!Store.get('anthropic_key');

    if (loading){
      var ld = el('div','ai-loading');
      var reel = el('div','reel','🎞️');
      reel.setAttribute('aria-hidden','true');
      ld.appendChild(reel);
      ld.appendChild(el('div','msg','Rolling the after-credits reel…'));
      page.appendChild(ld);
      return;
    }

    if (!pack){
      var c = el('div','ai-center');
      c.appendChild(el('div','big','🍿✨'));
      if (hasKey){
        c.appendChild(el('div', null, 'Fun facts, movie trivia, and talk-about-it questions —\nmade just for tonight’s film. One tap:'));
        var gen = el('button','ai-gen','✨ Make tonight’s pack');
        gen.addEventListener('click', startGenerate);
        page.appendChild(c);
        page.appendChild(gen);
      } else {
        c.appendChild(el('div', null, 'After-credits packs need a Claude (Anthropic) API key.\nAdd one in Settings and this button does the rest —\neverything else in the app works without it.'));
        var go = el('button','ai-gen','⚙️ Open Settings');
        go.addEventListener('click', function(){
          overlay.remove();
          view = 'settings';
          render();
          window.scrollTo(0, 0);
        });
        page.appendChild(c);
        page.appendChild(go);
      }
      return;
    }

    /* fun facts */
    page.appendChild(el('div','ai-sec-title','🎬 Fun facts'));
    pack.facts.forEach(function(f, i){
      var fc = el('div','ai-fact');
      fc.appendChild(el('b', null, '#' + (i+1) + ' '));
      fc.appendChild(document.createTextNode(f));
      page.appendChild(fc);
    });

    /* trivia round about this movie */
    if (pack.trivia && pack.trivia.length){
      page.appendChild(el('div','ai-sec-title','🎯 Tonight’s trivia round'));
      pack.trivia.forEach(function(Q){
        if (!Q || !Q.q || !Q.opts) return;
        var card = el('div','tq-card');
        card.style.marginTop = '10px';
        card.appendChild(el('div','tq-q', Q.q));
        var opts = el('div','tq-opts');
        var answered = false;
        Q.opts.forEach(function(opt, i){
          var b = el('button','tq-opt', opt);
          b.type = 'button';
          b.addEventListener('click', function(){
            if (answered) return;
            answered = true;
            var kids = opts.children;
            for (var k=0;k<kids.length;k++){
              kids[k].disabled = true;
              if (k === Q.a) kids[k].classList.add('correct');
              else if (k === i) kids[k].classList.add('wrong');
            }
            if (i === Q.a) confettiBurst(12);
            if (Q.note) card.appendChild(el('div','tq-note', (i === Q.a ? '✓ Correct! ' : '✗ Not this time. ') + Q.note));
          });
          opts.appendChild(b);
        });
        card.appendChild(opts);
        page.appendChild(card);
      });
    }

    /* discussion questions */
    if (pack.talk && pack.talk.length){
      page.appendChild(el('div','ai-sec-title','💬 Talk about it'));
      pack.talk.forEach(function(t){
        page.appendChild(el('div','ai-talk', t));
      });
    }

    if (hasKey){
      var regen = el('button','ai-regen','↻ Make a fresh pack');
      regen.addEventListener('click', function(){
        confirmModal({
          title:'Make a fresh pack?',
          message:'The current facts, trivia, and questions for this movie will be replaced for everyone.',
          confirmText:'Fresh pack',
          onConfirm: startGenerate
        });
      });
      page.appendChild(regen);
    }
    page.appendChild(el('div','ai-disclaimer','Written by Claude · double-check facts before quoting them at school'));
  }

  paint();
  document.body.appendChild(overlay);
}

/* ---------- export / import ---------- */
function exportBackup(){
  try {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'family-movie-night-backup-' + AZ.today() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000);
    toast('Backup exported 📦');
  } catch(e){
    toast('Export failed — try again');
  }
}
function importBackup(file){
  var reader = new FileReader();
  reader.onload = function(){
    try {
      var incoming = JSON.parse(reader.result);
      if (!incoming || typeof incoming.records !== 'object') throw new Error('bad shape');
      var added = 0, updated = 0;
      for (var id in incoming.records){
        var rec = incoming.records[id];
        if (!rec || !rec.id) continue;
        var local = data.records[id];
        if (!local){ data.records[id] = rec; added++; }
        else if ((rec.updatedAt || 0) > (local.updatedAt || 0)){ data.records[id] = rec; updated++; }
      }
      saveData();
      render();
      toast('Imported: ' + added + ' new, ' + updated + ' updated ✓');
    } catch(e){
      toast('That file doesn’t look like a Movie Night backup');
    }
  };
  reader.readAsText(file);
}
