/* Family Movie Night — fmn/vote.js
   "Can't decide? Put it to a vote" — the picker shortlists a few, everyone
   votes, the picker books the winner.

   These files load in a fixed order from index.html and share one global
   scope, exactly as the single inline script did. Order matters: boot.js
   runs the startup calls and must stay last. */

/* ---------- the open vote ----------
   Only one vote runs at a time — a family of four doesn't need a queue, and
   one open question is easier to answer than three. The vote record holds
   the options; each ballot is its own record so two phones voting at once
   merge cleanly instead of overwriting each other's choices. */
function openVote(){
  var r = data.records['vote_open'];
  return (r && !r.deleted && r.options && r.options.length) ? r : null;
}
function ballotId(member){ return 'ballot_' + member + '_' + (openVote() ? openVote().round : 0); }
function ballotFor(memberId){
  var v = openVote();
  if (!v) return null;
  var r = data.records['ballot_' + memberId + '_' + v.round];
  return (r && !r.deleted) ? r : null;
}
function castBallot(memberId, choice){
  var v = openVote();
  if (!v) return;
  var id = 'ballot_' + memberId + '_' + v.round;
  data.records[id] = {
    id:id, type:'ballot', round:v.round, member:memberId,
    choice:choice, updatedAt: Date.now()
  };
  saveData();
}
function voteTally(){
  var v = openVote();
  if (!v) return [];
  var counts = v.options.map(function(o){ return { option:o, voters:[] }; });
  MEMBERS.forEach(function(m){
    var b = ballotFor(m.id);
    if (b && typeof b.choice === 'number' && counts[b.choice]) counts[b.choice].voters.push(m);
  });
  return counts;
}
function votesIn(){
  return MEMBERS.filter(function(m){ return !!ballotFor(m.id); }).length;
}
/* the leaders — plural, because a four-person family ties constantly */
function voteLeaders(){
  var t = voteTally();
  var top = 0;
  t.forEach(function(c){ if (c.voters.length > top) top = c.voters.length; });
  if (!top) return [];
  return t.filter(function(c){ return c.voters.length === top; });
}
function startVote(options, openedBy){
  var prev = data.records['vote_open'];
  var round = (prev && prev.round ? prev.round : 0) + 1;
  data.records['vote_open'] = {
    id:'vote_open', type:'vote', round:round, options:options,
    openedBy: openedBy, openedAt: Date.now(), updatedAt: Date.now()
  };
  saveData();
}
function closeVote(){
  var v = openVote();
  if (!v) return;
  data.records['vote_open'] = {
    id:'vote_open', type:'vote', round:v.round, deleted:true, updatedAt: Date.now()
  };
  saveData();
}

/* ---------- the banner on the Nights tab ----------
   This is the "nudge" that actually works: no notification permission, no
   service worker, no silent failure. If a vote is open and you haven't
   voted, you see it the moment you open the app. */
function renderVoteBanner(app){
  var v = openVote();
  if (!v) return;
  var me = whoAmI();
  var mine = me ? ballotFor(me.id) : null;
  var card = el('div','vote-card');

  var head = el('div','vote-head');
  head.appendChild(el('span','vc-ico','🗳'));
  var opener = memberById(v.openedBy);
  head.appendChild(el('span','vc-title', opener
    ? opener.name + ' can’t decide — help pick!'
    : 'Help pick the movie!'));
  card.appendChild(head);

  card.appendChild(el('div','vote-sub', votesIn() + ' of ' + MEMBERS.length + ' voted'
    + (me ? (mine ? ' · you voted' : ' · not you yet') : ' · set who’s on this phone in Settings to vote')));

  var tally = voteTally();
  tally.forEach(function(c, i){
    var row = el('button','vote-opt' + (mine && mine.choice === i ? ' mine' : ''));
    row.type = 'button';
    var main = el('div','vo-main');
    main.appendChild(el('div','vo-title', c.option.title + (c.option.year ? ' (' + c.option.year + ')' : '')));
    var who = el('div','vo-voters');
    c.voters.forEach(function(m){
      var d = el('span','vo-dot', m.name.charAt(0));
      d.style.background = m.color;
      who.appendChild(d);
    });
    if (!c.voters.length) who.appendChild(el('span','vo-none','no votes yet'));
    main.appendChild(who);
    row.appendChild(main);
    row.appendChild(el('span','vo-count', String(c.voters.length)));
    row.addEventListener('click', function(){
      var voter = whoAmI();
      if (!voter){ openWhoAmIPrompt(); return; }
      castBallot(voter.id, i);
      render();
      toast(voter.name + ' voted for ' + c.option.title + ' 🗳');
    });
    card.appendChild(row);
  });

  // only the person who called the vote closes it
  if (me && me.id === v.openedBy){
    var lead = voteLeaders();
    var done = el('button','vote-close', lead.length === 1
      ? '🍿 Book ' + lead[0].option.title
      : (lead.length ? '🤝 It’s a tie — you decide' : '✕ Cancel the vote'));
    done.addEventListener('click', function(){
      if (!lead.length){ closeVote(); render(); toast('Vote cancelled'); return; }
      if (lead.length === 1){ bookVoteWinner(lead[0].option); return; }
      openTieBreak(lead);
    });
    card.appendChild(done);
  } else if (me) {
    card.appendChild(el('div','vote-foot', memberById(v.openedBy).name + ' books the winner once everyone’s in.'));
  }
  app.appendChild(card);
}
function openWhoAmIPrompt(){
  openModal(function(box, close){
    box.appendChild(el('h3', null, 'Who’s voting?'));
    box.appendChild(el('div','msub','Tap your name — this phone remembers it'));
    var chips = el('div','pick-chips');
    MEMBERS.forEach(function(m){
      var c = el('button','pick-chip', m.name);
      c.type = 'button';
      c.addEventListener('click', function(){
        Store.set('me', m.id);
        close();
        render();
        toast('This phone is ' + m.name + '’s 🙋');
      });
      chips.appendChild(c);
    });
    box.appendChild(chips);
    var row = el('div','modal-buttons');
    var cancel = el('button','btn-secondary','Cancel');
    cancel.addEventListener('click', close);
    row.appendChild(cancel);
    box.appendChild(row);
  });
}
function openTieBreak(leaders){
  openModal(function(box, close){
    box.appendChild(el('h3', null, '🤝 It’s a tie'));
    box.appendChild(el('div','msub','You called the vote, so you get the casting vote'));
    leaders.forEach(function(c){
      var b = el('button','set-btn', '🍿 ' + c.option.title);
      b.addEventListener('click', function(){ close(); bookVoteWinner(c.option); });
      box.appendChild(b);
    });
    var row = el('div','modal-buttons');
    var cancel = el('button','btn-secondary','Not yet');
    cancel.addEventListener('click', close);
    row.appendChild(cancel);
    box.appendChild(row);
  });
}
function bookVoteWinner(opt){
  var v = openVote();
  var picker = v ? memberById(v.openedBy) : nextPicker();
  var id = 'night_' + Date.now() + '_' + Math.floor(Math.random()*1e6);
  data.records[id] = {
    id:id, type:'night', title:opt.title, year:opt.year || null,
    date: nextOpenFriday(), pickedBy: picker.id,
    tmdbId: opt.tmdbId || null, posterPath: opt.posterPath || null,
    updatedAt: Date.now()
  };
  closeVote();          // also saves
  saveData();
  view = 'home';
  render();
  window.scrollTo(0, 0);
  confettiBurst();
  toast(opt.title + ' won the vote — it’s on the calendar 🍿');
}

/* ---------- starting one ----------
   Candidates come from the shortlist first, since that's where the family
   already parked the maybes, plus anything on the current Ideas shelf. */
function voteCandidates(){
  var out = [], seen = {};
  function add(it){
    var k = normQuote(it.title);
    if (!k || seen[k]) return;
    seen[k] = true;
    out.push({ title:it.title, year:it.year || null, tmdbId:it.tmdbId || null,
               posterPath:it.posterPath || null });
  }
  shortlisted().forEach(add);
  notWatched(ideas.items || []).forEach(add);
  return out;
}
function openStartVote(){
  var picked = [];
  var candidates = voteCandidates();
  openModal(function(box, close){
    box.appendChild(el('h3', null, '🗳 Put it to a vote'));
    box.appendChild(el('div','msub','Pick two to four, and let everyone choose'));

    if (!candidates.length){
      box.appendChild(el('div','set-note','Nothing to vote on yet — save a few movies to the shortlist from the Ideas tab first, then come back.'));
      var row0 = el('div','modal-buttons');
      var c0 = el('button','btn-secondary','Close');
      c0.addEventListener('click', close);
      row0.appendChild(c0);
      box.appendChild(row0);
      return;
    }

    var count = el('div','set-note','');
    var list = el('div','vote-picklist');
    candidates.slice(0, 20).forEach(function(it){
      var b = el('button','vote-pick');
      b.type = 'button';
      b.appendChild(el('span','vp-title', it.title + (it.year ? ' (' + it.year + ')' : '')));
      var mark = el('span','vp-mark','');
      b.appendChild(mark);
      b.addEventListener('click', function(){
        var at = -1;
        for (var i=0;i<picked.length;i++) if (picked[i].title === it.title) at = i;
        if (at !== -1){ picked.splice(at, 1); }
        else {
          if (picked.length >= 4){ toast('Four is plenty — deselect one first'); return; }
          picked.push(it);
        }
        b.classList.toggle('on', at === -1);
        mark.textContent = at === -1 ? '✓' : '';
        paintCount();
      });
      list.appendChild(b);
    });
    function paintCount(){
      count.textContent = picked.length < 2
        ? 'Choose at least two'
        : picked.length + ' on the ballot';
      go.disabled = picked.length < 2;
    }
    box.appendChild(count);
    box.appendChild(list);

    var row = el('div','modal-buttons');
    var cancel = el('button','btn-secondary','Cancel');
    cancel.addEventListener('click', close);
    var go = el('button','btn-primary','🗳 Open the vote');
    go.addEventListener('click', function(){
      var me = whoAmI() || nextPicker();
      startVote(picked, me.id);
      close();
      view = 'home';
      render();
      window.scrollTo(0, 0);
      toast('Vote is open — everyone gets a say 🗳');
    });
    row.appendChild(cancel); row.appendChild(go);
    box.appendChild(row);
    paintCount();
  });
}
