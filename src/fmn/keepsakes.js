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
/* `key` names the section so the scrapbook can deal it onto the right sheet.
   Nothing else reads it — the yearbook keeps every section in one flow. */
function spSection(title, key){
  var s = el('div','sp-section');
  if (key) s.setAttribute('data-k', key);
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
    var whySec = spSection('🎬 Why ' + picker.name + ' picked it', 'why');
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
    var rateSec = spSection('⭐ Our ratings', 'rates');
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
    var thoSec = spSection('💭 What we thought', 'thoughts');
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
      var qaSec = spSection('❓ ' + memberById(night.pickedBy).name + ' asked', 'asked');
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
    var chSec = spSection('🌟 Favorite characters', 'chars');
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
    var qSec = spSection('💬 Quotes we kept', 'quotes');
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
    return rxScenes(reactionFor(night.id, m.id)).length;
  });
  if (sceneMembers.length){
    var scSec = spSection('🎞 Favorite scenes', 'scenes');
    sceneMembers.forEach(function(m){
      /* one screenplay page per scene, so a second favorite doesn't get
         crammed into the first one's slugline */
      rxScenes(reactionFor(night.id, m.id)).forEach(function(sc, i){
        var pageEl = el('div','sp-scene');
        pageEl.appendChild(el('div','slug', m.name + '’s favorite scene'
          + (i ? ' · ' + (i + 1) : '')));
        pageEl.appendChild(el('div','cut','Cut to:'));
        pageEl.appendChild(el('div','action', sc));
        scSec.appendChild(pageEl);
      });
    });
    container.appendChild(scSec);
  }

  /* memories */
  var anyMems = false;
  var mSec = spSection('📌 Memories from the couch', 'memories');
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
    var pSec = spSection('🗳 The family poll', 'poll');
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
/* how a night is credited on a keepsake page — a bonus belongs to the whole
   family, with the person who found it named alongside */
function creditLine(n){
  var picker = memberById(n.pickedBy);
  return isBonus(n)
    ? 'Family bonus · ' + picker.name + '’s find'
    : picker.name + '’s pick';
}
/* ---------- fitting the keepsake onto two sheets ----------
   Everything here is measured, not predicted. The first version estimated
   heights from character counts and was wrong in exactly the way that hurts:
   deleting a few quotes moved the estimate, moved the split, and printed
   FOUR pages with most of two of them blank. A sheet that overruns its page
   by a millimetre pushes the next sheet a whole page later, so the only
   honest answer is to lay it out at the real page size and look at it.

   The page box is US Letter less the 0.5in @page margin: 7.5 x 10 inches,
   which at CSS 96dpi is 720 x 960. The budget is deliberately a little under
   that: measuring off-screen and paginating for real differ by a percent or
   two, printers round differently again, and a sheet one percent over costs
   a whole page. Three tenths of an inch of slack is cheap insurance. */
var FIT_PAGE_H = 960;
var FIT_BUDGET = 930;
/* preference order: full size in two columns, then a third column — it buys
   about half a page again and costs nothing in legibility — and only then
   smaller type, down to where it stops being comfortable to read. */
var FIT_PLANS = (function(){
  var out = [];
  [2, 3].forEach(function(cols){
    [1, 0.95, 0.90, 0.85, 0.80, 0.75, 0.70, 0.66].forEach(function(scale){
      out.push({ cols: cols, scale: scale });
    });
  });
  /* two columns at full size first, then widen before shrinking */
  return out.sort(function(a, b){
    return (b.scale - a.scale) || (a.cols - b.cols);
  });
})();

/* Lay the given split out and report what each sheet would cost on paper. */
function fitMeasure(page, parts){
  var pad = 0.22 * 96;
  function h(elm){ return elm ? elm.getBoundingClientRect().height : 0; }
  var masthead = h(parts.kicker) + h(parts.title) + h(parts.date) + h(parts.head);
  return {
    one: pad + masthead + h(parts.one),
    two: parts.two.firstChild ? pad + h(parts.two) + h(parts.waiting) + h(parts.foot) + pad : 0
  };
}
/* Deal the first `cut` sections onto sheet one and the rest onto sheet two. */
function fitDeal(parts, cut){
  parts.secs.forEach(function(sec, i){
    (i < cut ? parts.one : parts.two).appendChild(sec);
  });
  var banner = parts.two.querySelector('.sp-sheet-head');
  if (cut >= parts.secs.length){
    if (banner) banner.remove();
  } else if (!banner){
    parts.two.insertBefore(el('div','sp-sheet-head','What we kept 🍿'), parts.two.firstChild);
  }
  parts.two.style.display = (cut >= parts.secs.length) ? 'none' : '';
}
/* Choose the split, the column count and the type size. Returns the plan it
   settled on so the caller can say what happened. */
function fitScrapbook(page){
  var parts = {
    secs: Array.prototype.slice.call(page.querySelectorAll('.sp-section')),
    one: page.querySelector('.sp-sheet.one'),
    two: page.querySelector('.sp-sheet.two'),
    kicker: page.querySelector('.sp-kicker'),
    title: page.querySelector('.sp-title'),
    date: page.querySelector('.sp-date'),
    head: page.querySelector('.sp-head'),
    waiting: page.querySelector('.sp-waiting'),
    foot: page.querySelector('.sp-foot')
  };
  if (!parts.one || !parts.two || !parts.secs.length) return null;

  page.classList.add('sp-fit', 'sp-fit-measure');
  var best = null;
  for (var p = 0; p < FIT_PLANS.length && !best; p++){
    var plan = FIT_PLANS[p];
    page.style.setProperty('--sp-cols', plan.cols);
    page.style.setProperty('--sp-scale', plan.scale);
    /* everything on one sheet is the nicest answer when it fits — a single
       well-filled page beats two thin ones */
    var candidates = [];
    for (var cut = 1; cut <= parts.secs.length; cut++) candidates.push(cut);
    var winner = null, winnerCost = Infinity;
    candidates.forEach(function(cut){
      fitDeal(parts, cut);
      var m = fitMeasure(page, parts);
      if (m.one > FIT_BUDGET || m.two > FIT_BUDGET) return;
      /* prefer the split that leaves the two sheets most even; a single sheet
         costs nothing and wins outright */
      var cost = m.two ? Math.abs(m.one - m.two) : -1;
      if (cost < winnerCost){ winnerCost = cost; winner = cut; }
    });
    if (winner !== null) best = { cols: plan.cols, scale: plan.scale, cut: winner };
  }
  if (!best){
    /* More writing than two readable pages can hold. Rather than lose any of
       it, take the smallest type and spill — but still split where the two
       sheets come out closest to even, so the overflow is a few lines onto a
       third page instead of one crammed sheet beside a half-empty one. */
    var last = FIT_PLANS[FIT_PLANS.length - 1];
    page.style.setProperty('--sp-cols', last.cols);
    page.style.setProperty('--sp-scale', last.scale);
    /* Fill sheet one right up to the page and let only sheet two run over.
       Evening the two out is the tempting move and it is the wrong one: two
       sheets at 101% spill a little onto a page each, which is four sheets
       with two of them nearly blank — the exact shape of the bug this whole
       routine exists to kill. */
    var packed = 1;
    for (var c = 1; c <= parts.secs.length; c++){
      fitDeal(parts, c);
      if (fitMeasure(page, parts).one <= FIT_BUDGET) packed = c;
    }
    best = { cols: last.cols, scale: last.scale, cut: packed, overflowed: true };
  }
  page.style.setProperty('--sp-cols', best.cols);
  page.style.setProperty('--sp-scale', best.scale);
  fitDeal(parts, best.cut);
  page.classList.remove('sp-fit-measure');
  return best;
}
/* Ctrl+P and the browser's own menu never touch our button, so the fit has to
   hang off the event as well — an unfitted scrapbook prints as one default
   column. Taking .sp-fit off again waits for afterprint: strip it any earlier
   and the layout can be gone before the printer has read it. */
window.addEventListener('beforeprint', function(){
  var page = document.querySelector('.scrap-overlay .scrap-page');
  if (!page || page.classList.contains('sp-fit')) return;
  page.classList.add('sp-fit');
  if (page.querySelector('.sp-sheet')) fitScrapbook(page);
});
window.addEventListener('afterprint', function(){
  var page = document.querySelector('.scrap-page.sp-fit');
  /* the fit layout is for paper only — left on, the overlay becomes a
     two-column letter page on a phone */
  if (page) page.classList.remove('sp-fit', 'sp-fit-measure');
});
function printButton(page, night){
  var pb = el('button','sp-print','🖨️ Save as PDF keepsake');
  pb.addEventListener('click', function(){
    /* Every keepsake wants the print typography; only the night scrapbook has
       sheets to solve. The yearbook and the collection share these .sp-*
       styles, so leaving .sp-fit off them printed their pages at screen size.
       They hand this function their cover, not the page, so climb to the
       sheet the styles are actually written against. */
    var sheet = page.closest ? (page.closest('.scrap-page') || page) : page;
    sheet.classList.add('sp-fit');
    if (night) fitScrapbook(sheet);
    window.print();
  });
  page.appendChild(pb);
  page.appendChild(el('div','sp-print-hint', night
    ? 'In the print dialog choose “Save as PDF” — two sheets, ready for the binder.'
    : 'In the print dialog choose “Save as PDF” — that file is the keepsake.'));
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
  pol.appendChild(el('div','cap', isBonus(night) ? 'Family bonus 🎟️' : picker.name + '’s pick 🍿'));
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
    if (f.rt) factsBox.appendChild(rtChip(f, night.title, 'sp-fact'));
    if (f.meta) factsBox.appendChild(el('span','sp-fact','Metacritic ' + f.meta));
    if (!f.imdb && f.tmdbScore) factsBox.appendChild(el('span','sp-fact star','★ ' + Number(f.tmdbScore).toFixed(1) + ' TMDB'));
  }
  paintFacts(night.facts);
  ensureNightFacts(night, paintFacts);
  side.appendChild(factsBox);

  head.appendChild(side);
  page.appendChild(head);

  /* Two sheets, each a self-contained pair of columns. That structure matters
     more than it looks: a column block that straddles a page break makes
     Chrome throw away most of a page, which is how a two-page keepsake
     printed as three. Nothing here ever crosses a boundary — sheet one ends,
     the page ends, sheet two begins.
     Running order is the night as it happened first, then what it left
     behind. The poll sits early because it's night-of data, not a keepsake.
     Anything unkeyed keeps its place at the end rather than disappearing.
     Where the cut actually falls is fitScrapbook's job, at print time, once
     there is something real to measure. */
  var built = el('div');
  buildNightKeepsake(built, night);
  var ORDER = ['why','rates','poll','thoughts','asked','chars','quotes','scenes','memories'];
  var secs = [];
  while (built.firstChild) secs.push(built.removeChild(built.firstChild));
  secs.sort(function(a, b){
    var ia = ORDER.indexOf(a.getAttribute('data-k'));
    var ib = ORDER.indexOf(b.getAttribute('data-k'));
    return (ia < 0 ? ORDER.length : ia) - (ib < 0 ? ORDER.length : ib);
  });
  var sheetOne = el('div','sp-sheet one');
  var sheetTwo = el('div','sp-sheet two');
  secs.forEach(function(x){ sheetOne.appendChild(x); });
  page.appendChild(sheetOne);
  page.appendChild(sheetTwo);

  var waiting = MEMBERS.filter(function(m){ return !rxHasContent(reactionFor(night.id, m.id)); });
  if (waiting.length){
    page.appendChild(el('div','sp-waiting',
      'still waiting on ' + waiting.map(function(m){ return m.name; }).join(' & ') + ' … 🍿'));
  }
  printButton(page, night);
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
      creditLine(n) + (n.year ? ' · ' + n.year : '') + (avg !== null ? ' · family score ' + avg.toFixed(1) + '★' : '')));
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
      s.scenes += rxScenes(r).length;
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
      creditLine(n) + (n.year ? ' · ' + n.year : '') + (avg !== null ? ' · family score ' + avg.toFixed(1) + '★' : '')));
    buildNightKeepsake(sec, n);
    page.appendChild(sec);
  });

  page.appendChild(el('div','sp-foot','The Ortiz Family · est. Fridays'));
  overlay.appendChild(page);
  document.body.appendChild(overlay);
}

/* ---------- Claude: after-credits packs (browser-direct, canonical) ---------- */
var CLAUDE_MODEL = 'claude-sonnet-4-6';
var CLAUDE_TRIES = 3;

/* Every way this can fail used to collapse into one toast — "Couldn't reach
   Claude" — so an empty account, a dead key, a busy API and an answer that got
   cut off all looked like the same shrug, and none of them told you what to do.
   Each gets its own code now. The three that are genuinely transient retry
   themselves before anyone sees a message at all. */
function claudeError(status, body){
  var err = (body && body.error) || {};
  var blurb = (err.type || '') + ' ' + (err.message || '');
  if (status === 401) return new Error('BAD_KEY');
  /* the console reports an empty balance as 400 on some plans and 403 on
     others, so go by what it says rather than by the number */
  if (/credit balance|billing/i.test(blurb)) return new Error('NO_CREDIT');
  if (status === 403) return new Error('NO_ACCESS');
  if (status === 404) return new Error('BAD_MODEL');
  if (status === 429 || status >= 500) return new Error('BUSY');
  return new Error('API_' + status + (err.message ? ': ' + err.message : ''));
}
function claudeWait(ms){
  return new Promise(function(done){ setTimeout(done, ms); });
}
function askClaude(prompt, opts){
  opts = opts || {};
  var key = Store.get('anthropic_key');
  if (!key) return Promise.reject(new Error('NO_KEY'));
  var body = JSON.stringify({
    model: CLAUDE_MODEL,
    max_tokens: opts.maxTokens || 1400,
    system: opts.system || undefined,
    messages: [{ role:'user', content: prompt }]
  });
  function attempt(n){
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: body
    }).catch(function(){
      throw new Error('OFFLINE');   // fetch only rejects for network/CORS
    }).then(function(res){
      if (res.ok) return res.json();
      return res.json().catch(function(){ return null; }).then(function(j){
        throw claudeError(res.status, j);
      });
    }).then(function(d){
      /* an answer that stopped mid-sentence can never parse — name that, rather
         than blaming the JSON for it later */
      if (d.stop_reason === 'max_tokens') throw new Error('TRUNCATED');
      var text = (d.content || []).filter(function(b){ return b.type === 'text'; })
        .map(function(b){ return b.text; }).join('\n');
      if (!text.trim()) throw new Error('EMPTY');
      return text;
    }).catch(function(e){
      var m = e && e.message;
      if (n < CLAUDE_TRIES && (m === 'BUSY' || m === 'OFFLINE')){
        return claudeWait(700 * Math.pow(3, n - 1)).then(function(){ return attempt(n + 1); });
      }
      throw e;
    });
  }
  return attempt(1);
}
/* Claude usually returns bare JSON as asked, but a stray fence or a sentence of
   preamble shouldn't cost the family their pack — take the outermost braces.
   When it isn't JSON at all, carry what it actually said: that sentence is the
   whole diagnosis, and "not in the shape the app expects" hides it. */
function badShape(said){
  var e = new Error('BAD_SHAPE');
  e.said = String(said || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  return e;
}
function parseClaudeJson(text){
  var t = String(text || '').trim()
    .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  var a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < a) throw badShape(t);
  try { return JSON.parse(t.slice(a, b + 1)); }
  catch (err){ throw badShape(t); }
}

/* What the app knows about the film, handed over as identity. A small or very
   new title is the case that broke this: asked for behind-the-scenes facts about
   a film it doesn't know, Claude answers in prose, and the app called that a
   shape problem. The IMDb/TMDB ids pin down which film we mean even when the
   title alone is ambiguous. */
function filmContext(night){
  var f = night.facts || {};
  var bits = [];
  if (f.released) bits.push('released ' + f.released);
  if (f.cert) bits.push('rated ' + f.cert);
  if (f.runtime) bits.push(f.runtime + ' min');
  if (f.imdbId) bits.push('IMDb ' + f.imdbId);
  if (f.tmdbId) bits.push('TMDB id ' + f.tmdbId);
  return bits.length ? '\nWhat we know about it: ' + bits.join(', ') + '.' : '';
}
/* The escape hatch. Without it the only way for Claude to say "I don't know this
   film" is prose, which can never parse — so the app could never tell "we asked
   about a film nobody knows" apart from "the JSON came back mangled". */
var UNKNOWN_OUT = '\nIf you do not actually know this specific film, do not guess '
  + 'and do not invent facts about it — respond with exactly {"unknown":true} and nothing else.';

/* One retry when a reply isn't JSON. A model that wandered into prose usually
   complies when told so directly, and a genuinely unknown film now answers with
   {"unknown":true} instead, so this doesn't fire for that case. */
function askForJson(prompt, opts){
  return askClaude(prompt, opts).then(parseClaudeJson).catch(function(e){
    if (!e || e.message !== 'BAD_SHAPE') throw e;
    return askClaude(prompt + '\n\nYour previous reply was not valid JSON. '
      + 'Reply with the JSON object only — no preamble, no explanation, no fences.', opts)
      .then(parseClaudeJson);
  });
}
/* one sentence a parent can act on, for whatever came back */
function claudeTrouble(e, title){
  var m = (e && e.message) || '';
  var film = title ? '“' + title + '”' : 'that film';
  if (m === 'UNKNOWN_FILM') return 'Claude doesn’t know a film called ' + film + '. '
    + 'Check the title under Edit details — otherwise it may be too new or too small for Claude to know it.';
  /* what it actually said is the diagnosis; a generic shape complaint isn't */
  if (m === 'BAD_SHAPE' && e.said) return 'Claude answered, but not in the shape the app expects. '
    + 'It said: “' + e.said + '”';
  if (m === 'NO_KEY')    return 'Add an Anthropic key in Settings first.';
  if (m === 'BAD_KEY')   return 'That Anthropic key was rejected — check it in Settings.';
  if (m === 'NO_CREDIT') return 'The Anthropic account is out of credit. Top it up at console.anthropic.com, then try again.';
  if (m === 'NO_ACCESS') return 'That key isn’t allowed to use ' + CLAUDE_MODEL + '. Check its permissions in the Anthropic console.';
  if (m === 'BAD_MODEL') return 'Claude no longer offers the model this app asks for — the app needs an update.';
  if (m === 'BUSY')      return 'Claude is busy right now — tried three times. Give it a minute and tap again.';
  if (m === 'OFFLINE')   return 'Couldn’t reach Claude — check your connection, then try again.';
  if (m === 'TRUNCATED') return 'Claude’s answer got cut off partway. Tap try again.';
  if (m === 'EMPTY')     return 'Claude sent back an empty answer. Tap try again.';
  if (m === 'BAD_SHAPE') return 'Claude answered, but not in the shape the app expects. Tap try again.';
  if (m.indexOf('API_') === 0) return 'Claude turned the request down — ' + m.slice(4);
  return 'Something went wrong talking to Claude. Tap try again.';
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
  var prompt = 'Movie: "' + night.title + '"' + (night.year ? ' (' + night.year + ')' : '') + '.'
    + filmContext(night) + '\n'
    + 'Respond with ONLY valid JSON, no markdown fences, exactly this shape:\n'
    + '{"facts":["5 short, surprising behind-the-scenes fun facts about this movie"],'
    + '"trivia":[{"q":"question about this movie","opts":["4 options"],"a":0,"note":"one-line fun explanation"} x3],'
    + '"talk":["3 discussion questions for the family to talk about together after watching"]}'
    + UNKNOWN_OUT;
  return askForJson(prompt, { system: system, maxTokens: 2200 }).then(function(obj){
    if (obj && obj.unknown) throw new Error('UNKNOWN_FILM');
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
  /* a toast is gone by the time you've read it — when the pack won't come, the
     reason stays on the sheet next to the button you're about to tap again */
  var trouble = '';

  function startGenerate(){
    loading = true;
    trouble = '';
    paint();
    generatePack(night).then(function(){
      loading = false;
      paint();
      confettiBurst(20);
    }).catch(function(e){
      loading = false;
      trouble = claudeTrouble(e, night.title);
      paint();
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
        page.appendChild(c);
        if (trouble) page.appendChild(el('div','ai-err', trouble));
        var gen = el('button','ai-gen', trouble ? '↻ Try again' : '✨ Make tonight’s pack');
        gen.addEventListener('click', startGenerate);
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
      /* Answers stick per person: shut the sheet, come back tomorrow, and the
         round is where you left it instead of offering you a second guess.
         Nobody signed in has nowhere to save them, so those stay in memory. */
      var me = whoAmI();
      var saved = me ? triviaPicks(night.id, me.id, pack.updatedAt) : null;
      pack.trivia.forEach(function(Q, qi){
        if (!Q || !Q.q || !Q.opts) return;
        var card = el('div','tq-card');
        card.style.marginTop = '10px';
        card.appendChild(el('div','tq-q', Q.q));
        var opts = el('div','tq-opts');
        var answered = false;
        function reveal(choice, replaying){
          if (answered) return;
          answered = true;
          var kids = opts.children;
          for (var k=0;k<kids.length;k++){
            kids[k].disabled = true;
            if (k === Q.a) kids[k].classList.add('correct');
            else if (k === choice) kids[k].classList.add('wrong');
          }
          if (choice === Q.a && !replaying) confettiBurst(12);
          if (Q.note) card.appendChild(el('div','tq-note', (choice === Q.a ? '✓ Correct! ' : '✗ Not this time. ') + Q.note));
        }
        Q.opts.forEach(function(opt, i){
          var b = el('button','tq-opt', opt);
          b.type = 'button';
          b.addEventListener('click', function(){
            if (answered) return;
            if (me) saveTriviaPick(night.id, me.id, pack.updatedAt, qi, i);
            reveal(i, false);
          });
          opts.appendChild(b);
        });
        card.appendChild(opts);
        page.appendChild(card);
        /* no confetti on a replay — it already fired the night they played */
        if (saved && saved[qi] !== undefined) reveal(saved[qi], true);
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

/* ---------- Coming Attractions — the pre-show sheet for a booked night ----------
   Tapping the poster on the projector screen lands here: the one-sheet big,
   the facts, the trailer, where to watch it, and — with a Claude key — a
   spoiler-free pre-show to read out before anybody presses play. Shares the
   after-credits overlay, so it re-themes with the app. */
function preShowFor(nightId){
  var r = data.records['pre_' + nightId];
  return (r && !r.deleted && r.lookFor && r.lookFor.length) ? r : null;
}
function generatePreShow(night){
  var system = 'You write spoiler-free pre-show notes for a family movie night. '
    + 'The family: Chris and Kat (parents), Sedona (12) and River (9). '
    + 'They have NOT seen this film yet — never reveal twists, endings, deaths or any '
    + 'surprise, and never hint that one is coming. Warm, excited, PG, and specific to '
    + 'this film rather than generic praise.';
  var prompt = 'Movie: "' + night.title + '"' + (night.year ? ' (' + night.year + ')' : '') + '.'
    + filmContext(night) + '\n'
    + 'Respond with ONLY valid JSON, no markdown fences, exactly this shape:\n'
    + '{"hype":"two spoiler-free sentences on why this is a great pick for tonight",'
    + '"lookFor":["3 spoiler-free things to watch for — a visual detail, a piece of craft, a running joke"],'
    + '"guess":["2 predictions the family can call out loud before pressing play"],'
    + '"heads":"one short honest heads-up for parents about tone or intensity, or an empty string if there is nothing to flag"}'
    + UNKNOWN_OUT;
  return askForJson(prompt, { system: system, maxTokens: 1500 }).then(function(obj){
    if (obj && obj.unknown) throw new Error('UNKNOWN_FILM');
    if (!obj || !obj.hype || !obj.lookFor || !obj.lookFor.length) throw new Error('BAD_SHAPE');
    var rec = {
      id: 'pre_' + night.id, type: 'preshow', nightId: night.id, title: night.title,
      hype: String(obj.hype),
      lookFor: obj.lookFor.slice(0, 4),
      guess: (obj.guess || []).slice(0, 3),
      heads: obj.heads ? String(obj.heads) : '',
      updatedAt: Date.now()
    };
    if (night.sample) rec.sample = true; // demo packs stay off the family gist
    data.records[rec.id] = rec;
    saveData();
    return rec;
  });
}
function openComingAttractions(night){
  var overlay = el('div','ai-overlay');
  var closeBtn = el('button','scrap-close','✕');
  closeBtn.setAttribute('aria-label','Close');
  closeBtn.addEventListener('click', function(){ overlay.remove(); });
  overlay.appendChild(closeBtn);
  var page = el('div','ai-page');
  overlay.appendChild(page);
  var loading = false;
  var facts = night.facts || null;
  var trouble = '';

  function startGenerate(){
    loading = true;
    trouble = '';
    paint();
    generatePreShow(night).then(function(){
      loading = false;
      paint();
      confettiBurst(16);
    }).catch(function(e){
      loading = false;
      trouble = claudeTrouble(e, night.title);
      paint();
    });
  }

  function paint(){
    while (page.firstChild) page.removeChild(page.firstChild);
    var tonight = night.date === AZ.today();
    var watched = nightHappened(night);
    /* after the movie these are keepsake notes, not an announcement */
    var when = watched ? AZ.prettyLong(night.date)
      : (tonight ? 'tonight' : AZ.prettyLong(night.date))
        + (night.venue !== 'theater' ? ' at ' + showtimeLabel() : '');
    page.appendChild(el('div','ai-kicker', watched ? '🎟 Pre-show notes'
      : tonight ? '🎬 Tonight’s feature' : '🎟 Coming attractions'));
    page.appendChild(el('div','ai-title', night.title));
    page.appendChild(el('div','ai-sub', (isBonus(night)
        ? memberById(night.pickedBy).name + '’s find · family bonus'
          + (night.venue === 'theater' ? ' at the theatre' : '')
        : memberById(night.pickedBy).name + '’s pick')
      + ' · ' + when));

    if (night.posterPath){
      var pw = el('div','ca-poster');
      var img = document.createElement('img');
      img.alt = '';
      img.src = TMDB_IMG + night.posterPath;
      img.addEventListener('error', function(){ pw.remove(); });
      pw.appendChild(img);
      page.appendChild(pw);
    }

    if (facts){
      var chips = factChips(facts, 'idea-facts ca-facts', night.title);
      page.appendChild(chips);
      var tu = trailerUrl(facts);
      if (tu){
        var ta = el('a','ca-trailer','▶ Watch the trailer');
        ta.href = tu;
        ta.target = '_blank';
        ta.rel = 'noopener noreferrer';
        ta.setAttribute('aria-label','Watch the trailer for ' + night.title + ' on YouTube');
        page.appendChild(ta);
      }
    }
    /* always answers "where do we put this on?", even with no TMDB key and
       even when nothing carries it — outside the facts block on purpose */
    var wr = watchRow(facts, { title: night.title, venue: night.venue });
    if (wr) page.appendChild(wr);

    if (loading){
      var ld = el('div','ai-loading');
      var reel = el('div','reel','🎞️');
      reel.setAttribute('aria-hidden','true');
      ld.appendChild(reel);
      ld.appendChild(el('div','msg','Writing tonight’s pre-show…'));
      page.appendChild(ld);
      return;
    }

    var pack = preShowFor(night.id);
    var hasKey = !!Store.get('anthropic_key');

    if (pack){
      page.appendChild(el('div','ai-sec-title','🍿 Before you press play'));
      page.appendChild(el('div','ca-hype', pack.hype));
      page.appendChild(el('div','ai-sec-title','👀 Watch for'));
      pack.lookFor.forEach(function(w, i){
        var fc = el('div','ai-fact');
        fc.appendChild(el('b', null, '#' + (i+1) + ' '));
        fc.appendChild(document.createTextNode(w));
        page.appendChild(fc);
      });
      if (pack.guess && pack.guess.length){
        page.appendChild(el('div','ai-sec-title','🔮 Call it now'));
        pack.guess.forEach(function(g){ page.appendChild(el('div','ai-talk', g)); });
      }
      if (pack.heads){
        page.appendChild(el('div','ai-sec-title','🧭 Parent heads-up'));
        page.appendChild(el('div','ca-heads', pack.heads));
      }
      if (hasKey){
        var regen = el('button','ai-regen','↻ Fresh pre-show');
        regen.addEventListener('click', function(){
          confirmModal({
            title:'Write a fresh pre-show?',
            message:'Tonight’s notes for this movie will be replaced for everyone.',
            confirmText:'Fresh pre-show',
            onConfirm: startGenerate
          });
        });
        page.appendChild(regen);
      }
      page.appendChild(el('div','ai-disclaimer','Written by Claude · asked to stay spoiler-free, but skim it first'));
      return;
    }

    var c = el('div','ai-center');
    c.appendChild(el('div','big','🎟️✨'));
    if (hasKey){
      c.appendChild(el('div', null, 'A spoiler-free pre-show — why this pick is worth the popcorn, things to watch for, and predictions to call out loud.'));
      page.appendChild(c);
      if (trouble) page.appendChild(el('div','ai-err', trouble));
      var gen = el('button','ai-gen', trouble ? '↻ Try again' : '✨ Write the pre-show');
      gen.addEventListener('click', startGenerate);
      page.appendChild(gen);
    } else {
      c.appendChild(el('div', null, 'Pre-show notes need a Claude (Anthropic) API key. Add one in Settings — the poster, facts, trailer and where-to-watch all work without it.'));
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
  }

  paint();
  /* fills in facts, trailer and where-to-watch for a night booked by hand */
  ensureNightFacts(night, function(f){ facts = f; paint(); });
  document.body.appendChild(overlay);
}

/* ---------- export / import ---------- */
/* When the family last exported a real backup file. Synced, so one phone
   doing it settles the nudge for everybody — and it's a timestamp, not a
   secret, so it's safe to share. */
function lastBackup(){
  var r = data.records['settings_backup'];
  return (r && !r.deleted && r.at) ? r : null;
}
function markBackup(){
  var me = whoAmI();
  data.records['settings_backup'] = {
    id:'settings_backup', type:'setting', key:'backup',
    at: Date.now(), by: me ? me.id : null, updatedAt: Date.now()
  };
  saveData();
}
function backupPayload(){
  return JSON.stringify(data, null, 2);
}
function backupFilename(ext){
  return 'family-movie-night-backup-' + AZ.today() + '.' + (ext || 'json');
}
/* Chrome vets a shared file twice and the two checks disagree. `canShare()`
   only looks at the MIME type, but `share()` also runs the *filename
   extension* past an allowlist — and `.json` isn't on it. That's the whole
   story behind the NotAllowedError on a Pixel: canShare({application/json})
   said yes, switching the type to text/plain didn't help, because the name
   still ended in .json. So the shared copy is a .txt, and only text/plain is
   offered. It's the same JSON inside; import reads it either way.
   Returns null when sharing files isn't possible at all — the button hides. */
var SHARE_BACKUP_EXT = 'txt';
function shareableBackupType(){
  if (!navigator.share || !navigator.canShare) return null;
  try {
    var probe = new File(['{}'], backupFilename(SHARE_BACKUP_EXT), { type:'text/plain' });
    if (navigator.canShare({ files: [probe] })) return 'text/plain';
  } catch(e){}
  return null;
}
function canShareBackup(){ return !!shareableBackupType(); }
/* `silent` is for the share fallback, which has its own message to deliver —
   otherwise this toast lands on top of it and the reason is lost. Callers
   wired straight to a click must wrap it, or the Event object arrives as
   `silent` and quietly suppresses the confirmation. */
function exportBackup(silent){
  try {
    var blob = new Blob([backupPayload()], { type:'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = backupFilename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000);
    markBackup();
    render();
    if (!silent) toast('Backup exported 📦');
    return true;
  } catch(e){
    if (!silent) toast('Export failed — try again');
    return false;
  }
}
/* Straight into Drive: hand the file to the OS and let the share sheet pick
   the app and the folder. The File is built before the call so the browser
   still counts this as the user's tap. */
function shareBackup(){
  var type = shareableBackupType();
  if (!type){ exportBackup(); return; }
  var file;
  try {
    file = new File([backupPayload()], backupFilename(SHARE_BACKUP_EXT), { type: type });
  } catch(e){ exportBackup(); return; }
  var opened = Date.now();
  navigator.share({ files:[file], title:'Family Movie Night backup' })
    .then(function(){
      markBackup();
      render();
      toast('Backup sent 📦');
    })
    .catch(function(err){
      var name = (err && err.name) || 'Error';
      /* A sheet somebody actually saw and dismissed comes back after a beat.
         An instant AbortError means it never opened. NotAllowedError is never
         a cancel — it's Android refusing — and swallowing it made this button
         look broken, so nothing silent survives here any more. */
      var instant = (Date.now() - opened) < 700;
      if (name === 'AbortError' && !instant) return;
      /* save first, then speak — exportBackup's own toast would otherwise
         land on top of this one and take the reason with it */
      exportBackup(true);
      toast('Share sheet didn’t open — saved to Downloads instead');
    });
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
