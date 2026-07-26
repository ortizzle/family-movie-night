/* Family Movie Night — fmn/stats.js
   The Stats tab and the game hub.

   These files load in a fixed order from index.html and share one global
   scope, exactly as the single inline script did. Order matters: boot.js
   runs the startup calls and must stay last. */

/* ---------- RENDER: stats ---------- */
function memberStats(){
  var list = nights();
  var out = {};
  MEMBERS.forEach(function(m){
    out[m.id] = { member:m, picks:[], given:[], received:[], fives:0 };
  });
  list.forEach(function(n){
    if (out[n.pickedBy]) out[n.pickedBy].picks.push(n);
    var avg = familyAvg(n.id);
    if (avg !== null && out[n.pickedBy]) out[n.pickedBy].received.push(avg);
    MEMBERS.forEach(function(m){
      var r = reactionFor(n.id, m.id);
      if (r && r.stars){
        out[m.id].given.push(r.stars);
        if (r.stars === 5) out[m.id].fives++;
      }
    });
  });
  return out;
}
function mean(arr){
  if (!arr.length) return null;
  var s = 0;
  for (var i=0;i<arr.length;i++) s += arr[i];
  return s / arr.length;
}
function fridayStreak(){
  var streak = 0;
  var f = AZ.addDays(AZ.nextFriday(), -7);
  while (nightNearDate(f)){
    streak++;
    f = AZ.addDays(f, -7);
  }
  return streak;
}
function renderStats(app){
  var list = nights();
  app.appendChild(el('div','section-label','Movie Night Stats'));
  app.appendChild(el('div','section-sub','The family record book 🏆'));

  if (!list.length){
    var es = el('div','empty-state');
    es.appendChild(el('div','big','📊'));
    es.appendChild(el('div', null, 'No stats yet — log a few movie nights first!'));
    app.appendChild(es);
    return;
  }

  var tiles = el('div','stat-tiles');
  var t1 = el('div','stat-tile');
  t1.appendChild(el('div','num', String(list.length)));
  t1.appendChild(el('div','lbl','Nights together'));
  tiles.appendChild(t1);
  var t2 = el('div','stat-tile');
  t2.appendChild(el('div','num', String(fridayStreak())));
  t2.appendChild(el('div','lbl','Friday streak 🔥'));
  tiles.appendChild(t2);
  app.appendChild(tiles);

  var stats = memberStats();
  var critic = null, pleaser = null;
  MEMBERS.forEach(function(m){
    var s = stats[m.id];
    var g = mean(s.given);
    if (g !== null && (critic === null || g < critic.v)) critic = { m:m, v:g };
    var rcv = mean(s.received);
    if (rcv !== null && (pleaser === null || rcv > pleaser.v)) pleaser = { m:m, v:rcv };
  });

  MEMBERS.forEach(function(m){
    var s = stats[m.id];
    var card = el('div','stat-member');
    card.style.borderLeftColor = m.color;
    var head = el('div','sm-head');
    var dot = el('span','sm-dot', m.name.charAt(0));
    dot.style.background = m.color;
    head.appendChild(dot);
    var nm = el('span','sm-name', m.name);
    nm.style.color = memberInk(m);
    head.appendChild(nm);
    if (critic && critic.m.id === m.id) head.appendChild(el('span','sm-badge','🍅 toughest critic'));
    else if (pleaser && pleaser.m.id === m.id) head.appendChild(el('span','sm-badge','🎉 crowd pleaser'));
    card.appendChild(head);

    var grid = el('div','sm-grid');
    function cell(label, value){
      var c = el('div','sm-cell');
      c.appendChild(el('b', null, value));
      c.appendChild(document.createTextNode(' ' + label));
      grid.appendChild(c);
    }
    var g = mean(s.given);
    var rcv = mean(s.received);
    cell('picks made', String(s.picks.length));
    cell('★ given on avg', g === null ? '—' : g.toFixed(1));
    cell('their picks score', rcv === null ? '—' : rcv.toFixed(1) + ' ★');
    cell('five-star raves', String(s.fives));
    card.appendChild(grid);

    if (s.picks.length){
      var ph = el('div','sm-picks');
      ph.appendChild(document.createTextNode('🎬 Picked: '));
      s.picks.forEach(function(n, i){
        var avg = familyAvg(n.id);
        ph.appendChild(el('b', null, n.title));
        ph.appendChild(document.createTextNode(avg !== null ? ' (' + avg.toFixed(1) + '★)' : ''));
        if (i < s.picks.length - 1) ph.appendChild(document.createTextNode(' · '));
      });
      card.appendChild(ph);
    }
    app.appendChild(card);
  });

  var split = null;
  list.forEach(function(n){
    var rs = reactionsFor(n.id).filter(function(r){ return r.stars > 0; });
    if (rs.length < 2) return;
    var mn = 6, mx = 0, mnWho = null, mxWho = null;
    rs.forEach(function(r){
      if (r.stars < mn){ mn = r.stars; mnWho = memberById(r.member).name; }
      if (r.stars > mx){ mx = r.stars; mxWho = memberById(r.member).name; }
    });
    var spread = mx - mn;
    if (spread > 0 && (split === null || spread > split.spread)){
      split = { n:n, spread:spread, mn:mn, mx:mx, mnWho:mnWho, mxWho:mxWho };
    }
  });
  if (split){
    var sc = el('div','split-card');
    sc.appendChild(el('div','sc-title','💥 Biggest Split Decision'));
    sc.appendChild(el('div','sc-movie', split.n.title));
    sc.appendChild(el('div','sc-detail',
      split.mxWho + ' gave it ' + split.mx + '★ … ' + split.mnWho + ' gave it ' + split.mn + '★. The couch was divided.'));
    app.appendChild(sc);
  }

  var foot = el('footer');
  foot.appendChild(el('div', null, 'More coming: badges · one year ago tonight · the Ortiz Oscars'));
  app.appendChild(foot);
}

/* ---------- RENDER: trivia (game hub) ---------- */
var GAMES = [
  { id:'trivia',  ico:'🎯', name:'Movie Trivia',   desc:'Questions by category — Pixar, Disney, classics and more.' },
  { id:'whosaid', ico:'💬', name:'Who Said It?',   desc:'A famous line appears. Name the movie it came from.' },
  { id:'ourwall', ico:'🍿', name:'Our Quote Wall', desc:'Quotes your family saved — guess who picked each one.', needsData:true },
  { id:'iq',      ico:'🧠', name:'Movie IQ Test',  desc:'Ten mixed questions. Find out the family’s movie rank.' }
];
var trivia = { game:null, cat:null, deck:null, idx:0, score:0, dunno:0, answered:false, lastPick:-1 };

function shuffledOrder(n){
  var arr = [];
  for (var i=0;i<n;i++) arr.push(i);
  for (var j=arr.length-1;j>0;j--){
    var k = Math.floor(Math.random()*(j+1));
    var t = arr[j]; arr[j] = arr[k]; arr[k] = t;
  }
  return arr;
}
function shuffleArr(a){
  var r = a.slice();
  for (var i=r.length-1;i>0;i--){
    var j = Math.floor(Math.random()*(i+1));
    var t = r[i]; r[i] = r[j]; r[j] = t;
  }
  return r;
}
/* questions built from the family's own saved quotes: who picked this line? */
function ourWallDeck(){
  var out = [];
  nights().forEach(function(n){
    nightQuoteGroups(n.id).forEach(function(g){
      if (g.members.length !== 1) return;           // ambiguous if several picked it
      var who = g.members[0];
      var others = shuffleArr(MEMBERS.filter(function(m){ return m.id !== who.id; })).slice(0, 3);
      var opts = shuffleArr([who].concat(others));
      out.push({
        q: '“' + g.text + '”',
        sub: 'from ' + n.title,
        opts: opts.map(function(m){ return m.name; }),
        a: opts.indexOf(who),
        note: who.name + ' saved this one from ' + n.title + '.'
      });
    });
  });
  return shuffleArr(out);
}
function buildDeck(){
  if (trivia.game === 'trivia'){
    var pool = TRIVIA.filter(function(q){ return !trivia.cat || q.cat === trivia.cat; });
    return shuffleArr(pool).slice(0, 12);
  }
  if (trivia.game === 'whosaid') return shuffleArr(WHO_SAID).slice(0, 12);
  if (trivia.game === 'ourwall') return ourWallDeck().slice(0, 12);
  if (trivia.game === 'iq'){
    var mixed = shuffleArr(TRIVIA).slice(0, 6)
      .concat(shuffleArr(WHO_SAID).slice(0, 3))
      .concat(ourWallDeck().slice(0, 1));
    return shuffleArr(mixed).slice(0, 10);
  }
  return [];
}
function startGame(gameId, catId){
  trivia.game = gameId;
  trivia.cat = catId || null;
  trivia.deck = buildDeck();
  trivia.idx = 0; trivia.score = 0; trivia.dunno = 0;
  trivia.answered = false; trivia.lastPick = -1;
  render();
  window.scrollTo(0, 0);
}
function iqRank(pct){
  if (pct >= 0.9) return { medal:'🏆', title:'Certified Film Buffs', line:'Roll credits and take a bow — this family knows its movies.' };
  if (pct >= 0.7) return { medal:'🎬', title:'Serious Movie Family', line:'Strong showing. A couple more Fridays and you’ll sweep it.' };
  if (pct >= 0.5) return { medal:'🍿', title:'Solid Watchers', line:'Respectable! The popcorn was clearly the main event.' };
  return { medal:'🎟', title:'Rookie Reviewers', line:'The fix is obvious and delicious: more movie nights.' };
}
function renderTrivia(app){
  app.appendChild(el('div','section-label','Movie Games'));
  app.appendChild(el('div','section-sub','One phone, four brains 🎯'));

  /* ---- game picker ---- */
  if (!trivia.game){
    var wallCount = ourWallDeck().length;
    GAMES.forEach(function(g){
      var locked = g.needsData && wallCount < 4;
      var card = el('button','game-card' + (locked ? ' locked' : ''));
      card.type = 'button';
      var ico = el('span','g-ico', g.ico);
      card.appendChild(ico);
      var body = el('span','g-body');
      body.appendChild(el('span','g-name', g.name));
      body.appendChild(el('span','g-desc', locked
        ? 'Save a few more favorite quotes and this game unlocks.'
        : g.desc));
      card.appendChild(body);
      if (!locked){
        card.appendChild(el('span','g-go','›'));
        card.addEventListener('click', function(){
          if (g.id === 'trivia'){ trivia.game = 'trivia'; trivia.deck = null; render(); window.scrollTo(0,0); }
          else startGame(g.id);
        });
      }
      app.appendChild(card);
    });
    var foot = el('footer');
    foot.appendChild(el('div', null, TRIVIA.length + ' trivia questions · ' + WHO_SAID.length + ' famous lines · your own quote wall'));
    app.appendChild(foot);
    return;
  }

  /* ---- category picker for Movie Trivia ---- */
  if (trivia.game === 'trivia' && !trivia.deck){
    app.appendChild(el('div','idea-note','Pick a category — or play them all mixed together.'));
    var all = el('button','game-card');
    all.type = 'button';
    all.appendChild(el('span','g-ico','🎲'));
    var ab = el('span','g-body');
    ab.appendChild(el('span','g-name','Everything'));
    ab.appendChild(el('span','g-desc','All ' + TRIVIA.length + ' questions, shuffled.'));
    all.appendChild(ab);
    all.appendChild(el('span','g-go','›'));
    all.addEventListener('click', function(){ startGame('trivia', null); });
    app.appendChild(all);
    TRIVIA_CATS.forEach(function(c){
      var n = TRIVIA.filter(function(q){ return q.cat === c.id; }).length;
      var b = el('button','game-card');
      b.type = 'button';
      b.appendChild(el('span','g-ico', c.label.split(' ')[0]));
      var bb = el('span','g-body');
      bb.appendChild(el('span','g-name', c.label.replace(/^\S+\s/,'')));
      bb.appendChild(el('span','g-desc', n + ' questions'));
      b.appendChild(bb);
      b.appendChild(el('span','g-go','›'));
      b.addEventListener('click', function(){ startGame('trivia', c.id); });
      app.appendChild(b);
    });
    var back0 = el('button','idea-refresh','‹ Back to games');
    back0.addEventListener('click', function(){ trivia.game = null; render(); });
    app.appendChild(back0);
    return;
  }

  var deck = trivia.deck || [];

  /* ---- finale ---- */
  if (trivia.idx >= deck.length){
    var total = deck.length || 1;
    var pct = trivia.score / total;
    var rank = iqRank(pct);
    var done = el('div','tq-done');
    done.appendChild(el('div','big', rank.medal));
    done.appendChild(el('div','score-line', trivia.score + ' / ' + total));
    done.appendChild(el('div','rank-title', rank.title));
    done.appendChild(el('p', null, rank.line));
    if (trivia.dunno) done.appendChild(el('p', null, trivia.dunno + ' passed on — no shame, that’s how you learn a new favorite.'));
    var again = el('button','tq-next','Play again');
    again.addEventListener('click', function(){ startGame(trivia.game, trivia.cat); });
    done.appendChild(again);
    var back = el('button','idea-refresh','‹ Back to games');
    back.addEventListener('click', function(){ trivia.game = null; trivia.deck = null; render(); });
    done.appendChild(back);
    app.appendChild(done);
    return;
  }

  /* ---- question ---- */
  var Q = deck[trivia.idx];
  var card = el('div','tq-card');
  var prog = el('div','tq-progress');
  prog.appendChild(el('span', null, 'Question ' + (trivia.idx+1) + ' of ' + deck.length));
  prog.appendChild(el('span','score','Score: ' + trivia.score));
  card.appendChild(prog);
  card.appendChild(el('div','tq-q', Q.q));
  if (Q.sub) card.appendChild(el('div','tq-sub', Q.sub));

  var opts = el('div','tq-opts');
  Q.opts.forEach(function(opt, i){
    var b = el('button','tq-opt', opt);
    b.type = 'button';
    if (trivia.answered){
      b.disabled = true;
      if (i === Q.a) b.classList.add('correct');
      else if (i === trivia.lastPick) b.classList.add('wrong');
    } else {
      b.addEventListener('click', function(){
        trivia.answered = true;
        trivia.lastPick = i;
        if (i === Q.a){ trivia.score++; confettiBurst(14); }
        render();
      });
    }
    opts.appendChild(b);
  });
  card.appendChild(opts);

  if (!trivia.answered){
    var dk = el('button','tq-dunno','🤷 Don’t know — show me');
    dk.addEventListener('click', function(){
      trivia.answered = true;
      trivia.lastPick = -1;
      trivia.dunno++;
      render();
    });
    card.appendChild(dk);
  }

  if (trivia.answered){
    var verdict = trivia.lastPick === -1 ? 'Here’s the answer. '
      : (trivia.lastPick === Q.a ? '✓ Correct! ' : '✗ Not this time. ');
    card.appendChild(el('div','tq-note', verdict + (Q.note || '')));
    var next = el('button','tq-next', trivia.idx + 1 >= deck.length ? 'See the final score' : 'Next question');
    next.addEventListener('click', function(){
      trivia.idx++;
      trivia.answered = false;
      trivia.lastPick = -1;
      render();
      window.scrollTo(0, 0);
    });
    card.appendChild(next);
  }
  app.appendChild(card);

  var quit = el('button','idea-refresh','‹ Back to games');
  quit.addEventListener('click', function(){ trivia.game = null; trivia.deck = null; render(); });
  app.appendChild(quit);
}
