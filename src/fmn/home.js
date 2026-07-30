/* Family Movie Night — fmn/home.js
   The header, the projector screen, Coming Attractions, the night cards.

   These files load in a fixed order from index.html and share one global
   scope, exactly as the single inline script did. Order matters: boot.js
   runs the startup calls and must stay last. */

/* ---------- RENDER: shared ---------- */
var view = 'home';
var quoteIndex = 0;

function renderHeader(app){
  var header = el('header');
  var h1 = el('h1');
  h1.appendChild(document.createTextNode('Family Movie Night'));
  h1.appendChild(el('span','pop','!'));
  header.appendChild(h1);
  header.appendChild(el('div','now','The Ortiz Family · Fridays on the Couch'));
  var doo = el('div','doodles','🎞️ 🍿 ⭐');
  doo.setAttribute('aria-hidden','true');
  header.appendChild(doo);
  app.appendChild(header);
}
function renderTabbar(){
  var bar = document.getElementById('tabbar');
  while (bar.firstChild) bar.removeChild(bar.firstChild);
  [
    { id:'home',     ico:'🍿', label:'Nights' },
    { id:'ideas',    ico:'💡', label:'Ideas' },
    { id:'stats',    ico:'🏆', label:'Stats' },
    { id:'trivia',   ico:'🎯', label:'Trivia' },
    { id:'settings', ico:'⚙️', label:'Settings' }
  ].forEach(function(t){
    var b = el('button', view === t.id ? 'active' : '');
    b.appendChild(el('span','ico', t.ico));
    b.appendChild(document.createTextNode(t.label));
    b.addEventListener('click', function(){
      view = t.id;
      render();
      window.scrollTo(0, 0);
    });
    bar.appendChild(b);
  });
}

/* ---------- RENDER: home ---------- */
function renderHome(app){
  var np = nextPicker();
  var sb = el('div','screenbox');
  var screen = el('div','screen');
  var dust = el('div','dust'); dust.setAttribute('aria-hidden','true');
  screen.appendChild(dust);
  var b1 = el('span','burn b1'); b1.setAttribute('aria-hidden','true');
  var b2 = el('span','burn b2'); b2.setAttribute('aria-hidden','true');
  screen.appendChild(b1); screen.appendChild(b2);
  var inner = el('div','screen-inner');
  // the very next slot on the calendar, booked or not
  var upNext = lineupSlots(1)[0];
  // a bonus night sooner than the next turn is the next thing happening, and
  // worth announcing — but it never changes whose turn it is
  var soonestBonus = bonusNights()[0];
  var showBonus = soonestBonus && soonestBonus.date < upNext.date;
  if (showBonus){
    upNext = { date: soonestBonus.date, member: memberById(soonestBonus.pickedBy),
               title: soonestBonus.title, night: soonestBonus };
  }
  var booked = upNext.night;
  var who = showBonus ? upNext.member : np;
  /* movie night itself deserves a different announcement than "coming up",
     and a slightly hotter bulb — see .screen.tonight */
  var isTonight = upNext.date === AZ.today();
  if (isTonight) screen.classList.add('tonight');
  inner.appendChild(el('div','label' + (isTonight ? ' tonight' : ''), isTonight
    ? (showBonus
        ? (soonestBonus.venue === 'theater' ? 'Tonight — at the theatre' : 'Tonight’s bonus')
        : booked ? 'Tonight’s feature' : 'Tonight')
    : (showBonus
        ? (soonestBonus.venue === 'theater' ? 'Bonus — at the theatre…' : 'Bonus movie…')
        : booked ? 'Coming up…' : 'Up next…')));
  var pn = el('div','pickname', showBonus
    ? 'Family bonus 🎟️'
    : booked ? np.name + '’s pick 🍿'
    : 'It’s ' + np.name + '’s turn to pick! 🍿');
  // a bonus belongs to everybody, so it doesn't wear anyone's colour
  pn.style.color = showBonus ? '' : who.onWhite;
  inner.appendChild(pn);
  /* the one-sheet, projected right onto the screen. Painted lazily so a
     poster that arrives with the facts fetch (a hand-typed booking) still
     shows up without a re-render; a broken image just disappears. */
  var paintPoster = function(){};
  if (booked){
    var pWrap = el('div','screen-poster');
    paintPoster = function(){
      if (!booked.posterPath || pWrap.firstChild) return;
      var pimg = document.createElement('img');
      pimg.alt = '';
      pimg.src = TMDB_IMG + booked.posterPath;
      pimg.addEventListener('error', function(){
        pimg.remove();
        pWrap.removeAttribute('role');
        pWrap.removeAttribute('tabindex');
      });
      pWrap.appendChild(pimg);
      /* tapping the one-sheet opens the pre-show sheet for that movie */
      pWrap.classList.add('poster-tap');
      pWrap.setAttribute('role','button');
      pWrap.setAttribute('tabindex','0');
      pWrap.setAttribute('aria-label','Coming attractions for ' + booked.title);
    };
    var openCA = function(){ if (pWrap.firstChild) openComingAttractions(booked); };
    pWrap.addEventListener('click', openCA);
    pWrap.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openCA(); }
    });
    paintPoster();
    inner.appendChild(pWrap);
    inner.appendChild(el('div','booked-title', booked.title));
  }
  inner.appendChild(el('div','showdate', isTonight
    ? 'Tonight · ' + AZ.prettyLong(upNext.date)
    : booked ? AZ.prettyLong(upNext.date)
    : 'Next movie night · ' + AZ.prettyLong(upNext.date)));
  if (showBonus){
    // don't name the same person twice when the finder is also up next
    var finder = upNext.member;
    inner.appendChild(el('div','screen-bonus', finder.id === np.id
      ? finder.name + ' found this one · nobody loses a turn'
      : finder.name + ' found this one · nobody loses a turn, ' + np.name + ' still picks next'));
  }
  /* the trailer and where to find it — right where you look on the way to
     the couch. Both wait on the same cached facts, so they paint together. */
  if (booked){
    var tWrap = el('div','screen-trailer');
    inner.appendChild(tWrap);
    var wWrap = el('div','screen-watch');
    inner.appendChild(wWrap);
    var paintTrailer = function(f){
      while (tWrap.firstChild) tWrap.removeChild(tWrap.firstChild);
      var tu = trailerUrl(f);
      if (!tu) return;
      var a = el('a','st-link','▶ Watch the trailer');
      a.href = tu;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label','Watch the trailer for ' + booked.title + ' on YouTube');
      tWrap.appendChild(a);
    };
    var paintWatch = function(f){
      while (wWrap.firstChild) wWrap.removeChild(wWrap.firstChild);
      var wr = watchRow(f);
      if (wr) wWrap.appendChild(wr);
    };
    paintTrailer(booked.facts);
    paintWatch(booked.facts);
    ensureNightFacts(booked, function(f){
      paintPoster();
      paintTrailer(f);
      paintWatch(f);
    });
  }
  var rot = el('div','rotation');
  /* initials only, so the whole order fits on one line under the poster;
     the full names live in the label for screen readers */
  rot.setAttribute('aria-label', 'Pick order: '
    + MEMBERS.map(function(m){ return m.name; }).join(', then ')
    + '. ' + np.name + ' is up.');
  MEMBERS.forEach(function(m, i){
    var chip = el('div','rot-chip' + (m.id === np.id ? ' current' : ''));
    chip.setAttribute('aria-hidden','true');
    if (m.id === np.id) chip.style.background = m.onWhite;
    var dot = el('span','dot', m.name.charAt(0));
    dot.style.background = m.color;
    chip.appendChild(dot);
    rot.appendChild(chip);
    if (i < MEMBERS.length - 1) rot.appendChild(el('span','rot-arrow','→'));
  });
  inner.appendChild(rot);
  screen.appendChild(inner);
  sb.appendChild(screen);
  sb.appendChild(el('div','screen-stand'));
  app.appendChild(sb);

  /* friday lineup */
  var lineup = el('div','lineup');
  lineup.appendChild(el('div','lu-head','📅 Coming Attractions'));
  var today = AZ.today();
  // the next four Fridays, plus anything booked further out than that so a
  // movie already on the calendar never drops off the bottom
  var projected = lineupSlots(4);
  var slots = projected.slice(0, 4);
  var later = projected.slice(4).filter(function(s){ return s.night; });
  /* bonus nights sit in the calendar chronologically without taking a slot */
  var withBonus = slots.slice();
  bonusNights().forEach(function(n){
    withBonus.push({ date:n.date, member:memberById(n.pickedBy), title:n.title, night:n, bonus:true });
  });
  withBonus.sort(function(a,b){ return a.date < b.date ? -1 : 1; });
  var rows = withBonus.concat(later);
  rows.forEach(function(slot, u){
    if (u === withBonus.length && later.length) lineup.appendChild(el('div','lu-later','· later on ·'));
    var row = el('div','lu-row' + (u === rows.length - 1 ? ' last' : '') + (slot.bonus ? ' bonus' : ''));
    var dt = el('div','lu-date');
    dt.appendChild(el('div','d1', AZ.monthDay(slot.date)));
    var away = AZ.daysBetween(today, slot.date);
    dt.appendChild(el('div','d2', away === 0 ? 'Tonight!' : away === 1 ? 'Tomorrow'
      : away < 0 ? 'overdue' : 'in ' + away + ' days'));
    row.appendChild(dt);
    var lp = el('div','lu-pick');
    var ld = el('span','dot', slot.member.name.charAt(0));
    ld.style.background = slot.member.color;
    lp.appendChild(ld);
    var lname = el('span', null, slot.bonus
      ? 'Family bonus' + (slot.night && slot.night.venue === 'theater' ? ' 🍿' : '')
      : slot.member.name + '’s pick');
    lname.style.color = slot.bonus ? 'var(--dim)' : memberInk(slot.member);
    lp.appendChild(lname);
    row.appendChild(lp);
    if (slot.title){
      var bt = el('div','lu-title', slot.title);
      row.appendChild(bt);
    } else {
      row.appendChild(el('div','lu-fill'));
    }
    lineup.appendChild(row);
  });
  lineup.appendChild(el('div','lu-head second','🍿 Recent Fridays'));
  var lastFri = AZ.nextFriday();   // look back from the calendar, not from a break
  for (var p=1; p<=4; p++){
    var pf = AZ.addDays(lastFri, -7*p);
    var night = nightNearDate(pf);
    var prow = el('div','lu-row' + (p===4 ? ' last' : ''));
    var pdt = el('div','lu-date');
    pdt.appendChild(el('div','d1', AZ.monthDay(pf)));
    pdt.appendChild(el('div','d2','Friday'));
    prow.appendChild(pdt);
    if (night){
      prow.appendChild(el('div','lu-title', night.title));
      var pd = el('div','pdots');
      MEMBERS.forEach(function(m){
        var r = reactionFor(night.id, m.id);
        var dot = el('span','pdot' + (rxHasContent(r) ? '' : ' off'), m.name.charAt(0));
        if (rxHasContent(r)){
          dot.style.background = m.color;
          dot.style.borderColor = m.color;
        }
        pd.appendChild(dot);
      });
      prow.appendChild(pd);
    } else {
      prow.appendChild(el('div','lu-title skip','no movie night 😴'));
    }
    lineup.appendChild(prow);
  }
  app.appendChild(lineup);

  /* quote sticky note */
  var quotes = allQuotes();
  if (quotes.length){
    var qw = el('div','quotewall');
    qw.setAttribute('role','button');
    qw.setAttribute('tabindex','0');
    var q = quotes[quoteIndex % quotes.length];
    var cqw = el('div','cq-wrap');
    var bubble = el('div','cq', q.quote);
    cqw.appendChild(bubble);
    var attr = el('div','attr');
    q.members.forEach(function(m, i){
      if (i) attr.appendChild(document.createTextNode(i === q.members.length - 1 ? ' & ' : ', '));
      var an = el('span', null, m.name);
      an.style.color = memberInk(m);
      attr.appendChild(an);
    });
    attr.appendChild(document.createTextNode(' · ' + q.movie));
    cqw.appendChild(attr);
    cqw.appendChild(el('div','hint','From the quote wall · tap for another'));
    qw.appendChild(cqw);
    function nextQuote(){ quoteIndex++; render(); }
    qw.addEventListener('click', nextQuote);
    qw.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); nextQuote(); } });
    app.appendChild(qw);
  }

  /* awards season, once it's close enough to matter */
  renderOrtizzleCountdown(app);

  var logBtn = el('button','log-btn','🍿 Log a Movie Night');
  logBtn.addEventListener('click', openAddNight);
  app.appendChild(logBtn);

  /* an open vote sits right under the button — you can't miss it, and it
     needs no notification permission to reach anybody */
  if (openVote()) renderVoteBanner(app);
  else {
    var voteBtn = el('button','vote-start','🗳 Can’t decide? Put it to a vote');
    voteBtn.addEventListener('click', openStartVote);
    app.appendChild(voteBtn);
  }

  /* memory book.
     nights() is newest-first, which is right for memories but backwards for
     things that haven't happened: it puts the furthest-off booking above the
     one coming this week. So upcoming nights run soonest-first at the top,
     then the memories run most-recent-first below. Both chronological, each
     in the direction that reads correctly. */
  var all = nights();
  var upcoming = all.filter(function(n){ return !nightHappened(n); })
    .sort(function(a,b){ return a.date < b.date ? -1 : 1; });
  var past = all.filter(nightHappened);
  var list = upcoming.concat(past);
  var divider = el('div','film-divider');
  divider.setAttribute('aria-hidden','true');
  app.appendChild(divider);
  app.appendChild(el('div','section-label','Our Movie Night Memory Book'));
  app.appendChild(el('div','section-sub', list.length ? list.length + ' night' + (list.length===1?'':'s') + ' together 🍿' : ''));
  if (!list.length){
    var es = el('div','empty-state');
    es.appendChild(el('div','big','🛋️🍿'));
    es.appendChild(el('div', null, 'The memory book is empty!'));
    es.appendChild(el('div', null, 'Log your first Friday movie and start filling it up.'));
    app.appendChild(es);
  }
  list.forEach(function(n, ni){
    // a quiet line where the calendar turns into the scrapbook
    if (upcoming.length && past.length && ni === upcoming.length){
      app.appendChild(el('div','book-split','· already watched ·'));
    }
    var picker = memberById(n.pickedBy);
    var card = el('article','night');

    var head = el('div','head');
    var poster = el('div','poster');
    if (n.posterPath){
      var img = document.createElement('img');
      img.alt = ''; img.loading = 'lazy'; img.src = TMDB_IMG + n.posterPath;
      img.addEventListener('error', function(){
        img.remove();
        poster.style.background = n.grad || 'var(--card-2)';
        poster.appendChild(document.createTextNode(n.title));
      });
      poster.appendChild(img);
    } else {
      poster.style.background = n.grad || 'linear-gradient(160deg,#4E3E51,#2E2430)';
      poster.appendChild(document.createTextNode(n.title));
    }
    // tapping the poster opens that night's scrapbook
    poster.classList.add('poster-tap');
    poster.setAttribute('role','button');
    poster.setAttribute('tabindex','0');
    poster.setAttribute('aria-label','Open the scrapbook for ' + n.title);
    (function(night){
      function go(){ openScrapbook(night); }
      poster.addEventListener('click', go);
      poster.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); }
      });
    })(n);
    head.appendChild(poster);

    var ht = el('div','head-txt');
    ht.appendChild(el('h3', null, n.title));
    var meta = el('div','meta', (n.year ? n.year + ' · ' : '') + AZ.pretty(n.date));
    var avg = familyAvg(n.id);
    if (avg !== null) meta.appendChild(el('span','avgbadge', avg.toFixed(1) + ' ★'));
    ht.appendChild(meta);
    var ticket = el('span','ticket');
    var adm = el('span','admit','🎟');
    adm.style.background = picker.color;
    var tnm = el('span','tname', isBonus(n) ? picker.name + '’s find' : picker.name + '’s pick');
    tnm.style.background = picker.color;
    ticket.appendChild(adm);
    ticket.appendChild(tnm);
    ht.appendChild(ticket);
    if (n.sample) ht.appendChild(el('span','sampletag','sample'));
    if (isBonus(n)) ht.appendChild(el('span','bonustag',
      n.venue === 'theater' ? '🍿 family bonus · at the theatre' : '🎟️ family bonus'));
    if (n.question) ht.appendChild(el('div','night-q', '❓ ' + memberById(n.pickedBy).name + ' asks: ' + n.question));
    head.appendChild(ht);
    card.appendChild(head);

    var rows = el('div','rx-rows');
    var reactedCount = 0;
    MEMBERS.forEach(function(m){
      var r = reactionFor(n.id, m.id);
      if (rxHasContent(r)) reactedCount++;
      var row = el('button','rx-row');
      row.type = 'button';
      var me = whoAmI();
      var who = el('span','who', m.name);
      who.style.color = memberInk(m);
      row.appendChild(who);
      if (me && me.id === m.id) row.appendChild(el('span','you-tag','you'));
      if (r && r.stars) row.appendChild(starsNode(r.stars));
      var snippetText = r ? (r.thought || rxQuotes(r)[0] || rxMemories(r)[0] || r.scene || r.character || '') : '';
      if (snippetText){
        row.appendChild(el('span','snippet', snippetText));
      } else if (!r || !r.stars){
        row.appendChild(el('span','snippet empty','Tap to add your reaction'));
      } else {
        row.appendChild(el('span','snippet',''));
      }
      row.appendChild(el('span','chev','›'));
      row.addEventListener('click', function(){ openReaction(n, m); });
      rows.appendChild(row);
    });
    card.appendChild(rows);

    var actions = el('div','card-actions');
    if (reactedCount > 0){
      var sb2 = el('button','scrapbtn');
      sb2.appendChild(document.createTextNode('📖 Scrapbook'));
      if (reactedCount === MEMBERS.length){
        sb2.appendChild(el('span','done',' ✓'));
      } else {
        sb2.appendChild(el('span','', ' ' + reactedCount + '/4'));
      }
      sb2.addEventListener('click', function(){ openScrapbook(n); });
      actions.appendChild(sb2);
    }
    var ab = el('button','scrapbtn ai', aiPackFor(n.id) ? '✨ After-credits' : '✨ After-credits…');
    ab.addEventListener('click', function(){ openAfterCredits(n); });
    actions.appendChild(ab);
    card.appendChild(actions);

    var del = el('button','del','⋯');
    del.setAttribute('aria-label','More options for this night');
    del.addEventListener('click', function(){ openNightMenu(n); });
    card.appendChild(del);

    app.appendChild(card);
  });

  var footer = el('footer');
  footer.appendChild(el('div', null, 'Family Movie Night · Ortiz Family · v3.3'));
  app.appendChild(footer);
}
