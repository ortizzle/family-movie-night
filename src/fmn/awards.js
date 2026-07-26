/* Family Movie Night — fmn/awards.js
   The Ortizzle — the family's year-end awards, plus the countdown to
   ceremony night.

   These files load in a fixed order from index.html and share one global
   scope, exactly as the single inline script did. Order matters: boot.js
   runs the startup calls and must stay last. */

/* ---------- when the ceremony is ----------
   A Friday the family picks, in the new year. Default: the second Friday
   of January, far enough in that the holidays are over. */
function secondFridayOfJan(year){
  var d = new Date(year, 0, 1);
  var add = (5 - d.getDay() + 7) % 7;      // first Friday
  d.setDate(d.getDate() + add + 7);        // ...then the next one
  var mm = String(d.getMonth()+1).padStart(2,'0');
  var dd = String(d.getDate()).padStart(2,'0');
  return d.getFullYear() + '-' + mm + '-' + dd;
}
function ortizzleDate(){
  var r = data.records['settings_ortizzle'];
  if (r && !r.deleted && r.date) return r.date;
  return secondFridayOfJan(Number(AZ.today().slice(0,4)) + 1);
}
function ortizzleYear(){
  // the awards honour the year that just ended
  return Number(ortizzleDate().slice(0,4)) - 1;
}
function setOrtizzleDate(date){
  data.records['settings_ortizzle'] = {
    id:'settings_ortizzle', type:'setting', key:'ortizzle', date:date, updatedAt: Date.now()
  };
  saveData();
}
function daysToOrtizzle(){
  return AZ.daysBetween(AZ.today(), ortizzleDate());
}

/* ---------- the awards themselves ----------
   Most are settled by the year's own record — the family already voted,
   one star at a time. A few are genuinely a matter of taste, and those go
   to a ballot on the night. */
function nightHasReactions(n){
  return reactionsFor(n.id).some(rxHasContent);
}
/* only nights the family actually wrote something about can win anything */
function nightsInYear(year){
  return nights().filter(function(n){
    return n.date.slice(0,4) === String(year) && nightHasReactions(n);
  });
}
function pollCount(nightId, key){
  return reactionsFor(nightId).filter(function(r){
    return r && r.poll && r.poll[key];
  }).length;
}
function ratingSpread(nightId){
  var vals = reactionsFor(nightId)
    .filter(function(r){ return r && r.stars; })
    .map(function(r){ return r.stars; });
  if (vals.length < 2) return null;
  return Math.max.apply(null, vals) - Math.min.apply(null, vals);
}
function quoteCount(nightId){
  return reactionsFor(nightId).reduce(function(t, r){ return t + rxQuotes(r).length; }, 0);
}
/* pick the night that maximises `score`; null when nothing qualifies */
function topNight(list, score){
  var best = null, bestVal = null;
  list.forEach(function(n){
    var v = score(n);
    if (v === null || v === undefined) return;
    if (bestVal === null || v > bestVal){ bestVal = v; best = n; }
  });
  return best ? { night:best, value:bestVal } : null;
}
function computedAwards(year){
  var list = nightsInYear(year);
  var out = [];
  function add(icon, name, blurb, hit, fmt){
    if (!hit) return;
    out.push({
      icon:icon, name:name, blurb:blurb, night:hit.night,
      detail: fmt ? fmt(hit.value, hit.night) : null
    });
  }
  add('🏆', 'Best Picture', 'Highest family average, all four votes counted',
      topNight(list, function(n){ return familyAvg(n.id); }),
      function(v){ return starText(Math.round(v*2)/2) + ' average'; });
  add('😂', 'Achievement in Making Us Laugh', 'The one that got the most of us',
      topNight(list, function(n){ var c = pollCount(n.id,'laughed'); return c ? c : null; }),
      function(v){ return v + ' of us laughed'; });
  add('😢', 'The Tissue Award', 'Nobody was cutting onions',
      topNight(list, function(n){ var c = pollCount(n.id,'cried'); return c ? c : null; }),
      function(v){ return v + (v === 1 ? ' of us cried' : ' of us cried'); });
  add('🔁', 'Most Rewatchable', 'The one we’d all happily start again',
      topNight(list, function(n){ var c = pollCount(n.id,'rewatch'); return c ? c : null; }),
      function(v){ return v + ' would see it again'; });
  add('💬', 'Most Quotable', 'Lines we kept',
      topNight(list, function(n){ var c = quoteCount(n.id); return c ? c : null; }),
      function(v){ return v + ' quote' + (v === 1 ? '' : 's') + ' saved'; });
  add('🥊', 'Biggest Disagreement', 'The widest gap between the highest and lowest star',
      topNight(list, function(n){ return ratingSpread(n.id); }),
      function(v){ return v + ' star' + (v === 1 ? '' : 's') + ' apart'; });
  add('🎁', 'Best Surprise', 'Highest rated among the ones none of us had seen',
      topNight(list, function(n){
        if (pollCount(n.id, 'seenBefore')) return null;
        return familyAvg(n.id);
      }),
      function(v){ return starText(Math.round(v*2)/2) + ', sight unseen'; });
  return out;
}
/* each person's own best night of the year, from the films they chose */
function pickerAwards(year){
  var list = nightsInYear(year);
  var out = [];
  MEMBERS.forEach(function(m){
    var mine = list.filter(function(n){ return n.pickedBy === m.id; });
    var hit = topNight(mine, function(n){ return familyAvg(n.id); });
    if (!hit) return;
    out.push({
      icon:'🎬', name: m.name + '’s Pick of the Year', member:m,
      blurb: mine.length + ' pick' + (mine.length === 1 ? '' : 's') + ' this year',
      night: hit.night,
      detail: starText(Math.round(hit.value*2)/2) + ' from the family'
    });
  });
  return out;
}

/* ---------- the categories worth arguing about ----------
   Nominees come from the year's data; the winner is whatever the family
   says on the night. Ballots reuse the same one-record-per-person shape as
   the movie vote, so two phones can't clobber each other. */
var ORTIZZLE_VOTED = [
  { key:'character', icon:'🌟', name:'Character of the Year',
    blurb:'Everyone’s favourite characters, head to head' },
  { key:'memory',    icon:'📌', name:'Movie Night Moment of the Year',
    blurb:'Not the film — the night' },
  { key:'quote',     icon:'💬', name:'The Line We’ll Still Be Saying in Ten Years',
    blurb:'One quote to rule them all' }
];
function ortizzleNominees(year, key){
  var list = nightsInYear(year);
  var out = [], seen = {};
  list.forEach(function(n){
    MEMBERS.forEach(function(m){
      var r = reactionFor(n.id, m.id);
      if (!r) return;
      var vals = key === 'character' ? (r.character ? [r.character] : [])
               : key === 'memory'    ? rxMemories(r)
               :                       rxQuotes(r);
      vals.forEach(function(v){
        var k = normQuote(v);
        if (!k || seen[k]) return;
        seen[k] = true;
        out.push({ text:v, by:m, night:n });
      });
    });
  });
  return out;
}
function ortizzleBallot(year, key, memberId){
  var r = data.records['oballot_' + year + '_' + key + '_' + memberId];
  return (r && !r.deleted) ? r : null;
}
function castOrtizzleBallot(year, key, memberId, text){
  var id = 'oballot_' + year + '_' + key + '_' + memberId;
  data.records[id] = {
    id:id, type:'oballot', year:year, category:key, member:memberId,
    text:text, updatedAt: Date.now()
  };
  saveData();
}
function ortizzleWinner(year, key){
  var counts = {}, best = null;
  MEMBERS.forEach(function(m){
    var b = ortizzleBallot(year, key, m.id);
    if (!b || !b.text) return;
    var k = normQuote(b.text);
    counts[k] = counts[k] || { text:b.text, voters:[] };
    counts[k].voters.push(m);
  });
  for (var k in counts){
    if (!best || counts[k].voters.length > best.voters.length) best = counts[k];
  }
  return best;
}

/* ---------- the countdown on the Nights tab ---------- */
function renderOrtizzleCountdown(app){
  var away = daysToOrtizzle();
  if (away < 0 || away > 120) return;      // only once it's in sight
  var card = el('button','ortiz-card');
  card.type = 'button';
  var left = el('div','oc-left');
  left.appendChild(el('div','oc-ico','🏆'));
  card.appendChild(left);
  var body = el('div','oc-body');
  body.appendChild(el('div','oc-name','The Ortizzle'));
  body.appendChild(el('div','oc-sub', away === 0 ? 'Tonight! 🎉'
    : away === 1 ? 'Tomorrow night'
    : away + ' days away · ' + AZ.prettyLong(ortizzleDate())));
  card.appendChild(body);
  card.appendChild(el('span','oc-go','›'));
  card.addEventListener('click', function(){ openOrtizzle(ortizzleYear()); });
  app.appendChild(card);
}

/* ---------- ceremony night ----------
   Built on the same keepsake page as the scrapbook, so it prints to the
   same US Letter book page and slots into the family's shelf. */
function openOrtizzle(year){
  var overlay = keepsakeOverlay();
  var page = el('div','scrap-page ortizzle');

  function paint(){
    while (page.firstChild) page.removeChild(page.firstChild);

    page.appendChild(el('div','sp-kicker','Family Movie Night presents'));
    page.appendChild(el('div','oz-title','The Ortizzle'));
    page.appendChild(el('div','oz-sub',
      'For achievement in entertaining the Ortiz family in the motion picture sciences'));
    page.appendChild(el('div','sp-date', year + ' · awarded ' + AZ.prettyLong(ortizzleDate())));

    var list = nightsInYear(year);
    if (!list.length){
      page.appendChild(el('div','oz-empty',
        'No movie nights logged for ' + year + ' yet. Watch a few, write down what you thought, and the awards write themselves.'));
      return;
    }

    page.appendChild(el('div','oz-count', list.length + ' movie night' + (list.length === 1 ? '' : 's') + ' considered'));

    /* the ones the year already decided */
    computedAwards(year).forEach(function(a){ page.appendChild(awardCard(a)); });

    /* everyone's own pick of the year */
    var pa = pickerAwards(year);
    if (pa.length){
      page.appendChild(el('div','oz-divider','· Picks of the Year ·'));
      pa.forEach(function(a){ page.appendChild(awardCard(a)); });
    }

    /* and the ones worth arguing about */
    page.appendChild(el('div','oz-divider','· Put to the family ·'));
    ORTIZZLE_VOTED.forEach(function(cat){
      page.appendChild(votedCard(year, cat, paint));
    });

    printButton(page);
  }

  function awardCard(a){
    var card = el('div','oz-award');
    var top = el('div','oz-top');
    top.appendChild(el('span','oz-ico', a.icon));
    var nm = el('span','oz-name', a.name);
    if (a.member) nm.style.color = a.member.color;
    top.appendChild(nm);
    card.appendChild(top);
    card.appendChild(el('div','oz-blurb', a.blurb));
    var win = el('div','oz-winner', a.night.title + (a.night.year ? ' (' + a.night.year + ')' : ''));
    card.appendChild(win);
    if (a.detail) card.appendChild(el('div','oz-detail', a.detail));
    return card;
  }

  function votedCard(year, cat, repaint){
    var card = el('div','oz-award voted');
    var top = el('div','oz-top');
    top.appendChild(el('span','oz-ico', cat.icon));
    top.appendChild(el('span','oz-name', cat.name));
    card.appendChild(top);
    card.appendChild(el('div','oz-blurb', cat.blurb));

    var noms = ortizzleNominees(year, cat.key);
    if (!noms.length){
      card.appendChild(el('div','oz-detail','Nothing nominated yet — this one fills in as the family writes.'));
      return card;
    }
    var win = ortizzleWinner(year, cat.key);
    var me = whoAmI();
    var mine = me ? ortizzleBallot(year, cat.key, me.id) : null;

    if (win){
      card.appendChild(el('div','oz-winner','“' + win.text + '”'));
      card.appendChild(el('div','oz-detail',
        win.voters.map(function(m){ return m.name; }).join(' & ') + '’s vote'
        + (win.voters.length > 1 ? 's' : '')));
    }

    var noml = el('div','oz-noms');
    noms.slice(0, 8).forEach(function(nom){
      var b = el('button','oz-nom' + (mine && normQuote(mine.text) === normQuote(nom.text) ? ' on' : ''));
      b.type = 'button';
      b.appendChild(el('span','on-text','“' + nom.text + '”'));
      var by = el('span','on-by', nom.by.name + ' · ' + nom.night.title);
      by.style.color = nom.by.color;
      b.appendChild(by);
      b.addEventListener('click', function(){
        var voter = whoAmI();
        if (!voter){ openWhoAmIPrompt(); return; }
        castOrtizzleBallot(year, cat.key, voter.id, nom.text);
        repaint();
        toast(voter.name + ' voted 🏆');
      });
      noml.appendChild(b);
    });
    card.appendChild(noml);
    if (!me) card.appendChild(el('div','oz-detail','Set who’s on this phone in Settings to cast a vote.'));
    return card;
  }

  paint();
  overlay.appendChild(page);
  document.body.appendChild(overlay);
}
