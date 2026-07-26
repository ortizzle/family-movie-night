/* Family Movie Night — fmn/data.js
   Records, family Gist sync, whose-turn-it-is, quote matching, sample data.

   These files load in a fixed order from index.html and share one global
   scope, exactly as the single inline script did. Order matters: boot.js
   runs the startup calls and must stay last. */

/* ---------- data ---------- */
var data = Store.get('data', { records:{} });
if (!data.records) data.records = {};

function saveData(){
  data.updatedAt = Date.now();
  if (!Store.set('data', data)) toast('Storage full — could not save');
  scheduleSync();
}

/* ---------- family Gist sync (safe merge + tombstones — canonical) ----------
   Rules that prevent the data-loss bugs other family apps hit:
   - every record has id + updatedAt; per-record newest-wins on merge
   - deletes are tombstones ({deleted:true}), purged after 60 days
   - on save: fetch remote FIRST, merge, then write — never blind-overwrite */
var Sync = {
  filename: 'family-movie-night-data.json',
  gistId: function(){ return Store.get('gist_id') || ''; },
  token: function(){ return Store.get('gist_token') || ''; },
  configured: function(){ return !!(this.gistId() && this.token()); },
  headers: function(){
    return {
      'Authorization': 'Bearer ' + this.token(),
      'Accept': 'application/vnd.github+json'
    };
  },
  pullRemote: function(){
    var self = this;
    return fetch('https://api.github.com/gists/' + self.gistId(), { headers: self.headers() })
      .then(function(res){
        if (!res.ok) throw new Error('Gist fetch failed: ' + res.status);
        return res.json();
      })
      .then(function(gist){
        var file = gist.files[self.filename];
        if (!file) return { records:{} };
        if (file.truncated){
          return fetch(file.raw_url).then(function(r){ return r.text(); })
            .then(function(t){ return JSON.parse(t || '{"records":{}}'); });
        }
        return JSON.parse(file.content || '{"records":{}}');
      });
  },
  merge: function(local, remote){
    var out = { records: {} };
    var id;
    for (id in (remote.records || {})) out.records[id] = remote.records[id];
    for (id in (local.records || {})){
      var rec = local.records[id];
      var r = out.records[id];
      if (!r || (rec.updatedAt || 0) > (r.updatedAt || 0)) out.records[id] = rec;
    }
    var cutoff = Date.now() - 60 * 86400000;
    for (id in out.records){
      var t = out.records[id];
      if (t && t.deleted && (t.updatedAt || 0) < cutoff) delete out.records[id];
    }
    return out;
  },
  save: function(localData){
    var self = this;
    var mergedHolder = localData;
    return self.pullRemote()
      .catch(function(){ return null; }) // offline or first save — proceed with local
      .then(function(remote){
        var merged = remote ? self.merge(localData, remote) : localData;
        mergedHolder = merged;
        // demo nights stay local — never seed the family gist with sample data
        var upload = { records:{} };
        for (var id in merged.records){
          if (!merged.records[id].sample) upload.records[id] = merged.records[id];
        }
        return fetch('https://api.github.com/gists/' + self.gistId(), {
          method: 'PATCH',
          headers: Object.assign({ 'Content-Type':'application/json' }, self.headers()),
          body: JSON.stringify({ files: (function(){
            var f = {};
            f[self.filename] = { content: JSON.stringify(upload, null, 2) };
            return f;
          })() })
        });
      })
      .then(function(res){
        if (!res.ok) throw new Error('Gist save failed: ' + res.status);
        Store.set('data', mergedHolder);
        Store.set('last_sync', Date.now());
        return mergedHolder;
      });
  },
  load: function(){
    var self = this;
    var local = Store.get('data', { records:{} });
    return self.pullRemote().then(function(remote){
      var merged = self.merge(local, remote);
      Store.set('data', merged);
      Store.set('last_sync', Date.now());
      return merged;
    });
  },
  createGist: function(){
    var self = this;
    return fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type':'application/json' }, self.headers()),
      body: JSON.stringify({
        description: 'family-movie-night-data',
        public: false,
        files: (function(){
          var f = {};
          f[self.filename] = { content: '{"records":{}}' };
          return f;
        })()
      })
    }).then(function(res){
      if (!res.ok) throw new Error('Gist create failed: ' + res.status);
      return res.json();
    }).then(function(gist){
      Store.set('gist_id', gist.id);
      return gist.id;
    });
  }
};
var syncTimer = null;
var syncBusy = false;
function overlaysOpen(){
  return !!document.querySelector('.modal-overlay') || !!document.querySelector('.scrap-overlay');
}
/* don't repaint out from under someone mid-keystroke — a background sync
   landing while a token is half-typed would wipe the field */
function userIsTyping(){
  var a = document.activeElement;
  return !!(a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'));
}
function adoptMerged(merged){
  var changed = JSON.stringify(merged) !== JSON.stringify(data);
  data = merged;
  // a phone that just received the family's real nights (or their dismissal
  // of the demo) shouldn't keep showing sample movies alongside them
  if (hasSample() && (samplesDismissed() || hasRealNights())){
    clearSample(true);
    return true;
  }
  if (changed && !overlaysOpen() && !userIsTyping()) render();
  return changed;
}
function scheduleSync(){
  if (!Sync.configured()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(runSync, 1500);
}
function runSync(){
  if (!Sync.configured() || syncBusy) return;
  syncBusy = true;
  Sync.save(data).then(function(merged){
    syncBusy = false;
    adoptMerged(merged);
  }).catch(function(){
    syncBusy = false;
    toast('Saved on this phone — family sync will retry');
  });
}
function pullSync(quiet){
  if (!Sync.configured() || syncBusy) return;
  syncBusy = true;
  Sync.load().then(function(merged){
    syncBusy = false;
    var changed = adoptMerged(merged);
    if (!quiet) toast(changed ? 'Synced — new family entries in! 🍿' : 'Synced — all caught up ✓');
  }).catch(function(){
    syncBusy = false;
    if (!quiet) toast('Couldn’t reach the family gist — check token & connection');
  });
}
document.addEventListener('visibilitychange', function(){
  if (document.visibilityState === 'visible' && !overlaysOpen()) pullSync(true);
});
function liveRecords(type){
  var out = [];
  for (var id in data.records){
    var r = data.records[id];
    if (r && !r.deleted && r.type === type) out.push(r);
  }
  return out;
}
function nights(){
  return liveRecords('night').sort(function(a,b){
    return a.date === b.date ? (b.updatedAt||0)-(a.updatedAt||0) : (a.date < b.date ? 1 : -1);
  });
}
function reactionFor(nightId, memberId){
  var r = data.records['rx_' + nightId + '_' + memberId];
  return (r && !r.deleted) ? r : null;
}
function rxQuotes(r){
  if (!r) return [];
  if (r.quotes && r.quotes.length) return r.quotes;
  return r.quote ? [r.quote] : [];
}
function rxMemories(r){
  if (!r) return [];
  if (r.memories && r.memories.length) return r.memories;
  return r.memory ? [r.memory] : [];
}
function rxHasContent(r){
  return !!(r && (r.stars > 0 || (r.thought||'').length || (r.character||'').length ||
    (r.scene||'').length || (r.why||'').length || rxQuotes(r).length || rxMemories(r).length || r.poll));
}
function reactionsFor(nightId){
  var out = [];
  for (var i=0;i<MEMBERS.length;i++){
    var r = reactionFor(nightId, MEMBERS[i].id);
    if (r) out.push(r);
  }
  return out;
}
function familyAvg(nightId){
  var rs = reactionsFor(nightId).filter(function(r){ return r.stars > 0; });
  if (!rs.length) return null;
  var sum = 0;
  for (var i=0;i<rs.length;i++) sum += rs[i].stars;
  return sum / rs.length;
}
/* ---------- whose turn it is ----------
   A night scheduled for a future Friday is *upcoming*, not spent: the
   rotation only advances past nights that have actually happened.
   (Otherwise River booking her own turn made the app jump to Chris.) */
function rotationNext(memberId){
  for (var i=0;i<MEMBERS.length;i++){
    if (MEMBERS[i].id === memberId) return MEMBERS[(i+1) % MEMBERS.length];
  }
  return MEMBERS[0];
}
function nightHappened(n){
  if (n.date < AZ.today()) return true;
  if (n.date > AZ.today()) return false;
  // tonight: it has happened once somebody writes a reaction
  return reactionsFor(n.id).some(rxHasContent);
}
function happenedNights(){            // newest first
  return nights().filter(nightHappened);
}
function scheduledNights(){           // soonest first
  return nights().filter(function(n){ return !nightHappened(n); })
    .sort(function(a,b){ return a.date < b.date ? -1 : 1; });
}
/* The rotation anchor restarts the order without anyone having to log a
   movie for it: "from this Friday on, it's Kat's turn." It only decides
   where the order picks back up — once a night actually happens on or
   after the anchor date, the real nights take over again, so a skipped
   Friday never costs anybody their turn. */
function rotationAnchor(){
  var r = data.records['rotation_anchor'];
  return (r && !r.deleted && r.date && memberById(r.member)) ? r : null;
}
function setRotationAnchor(date, memberId){
  data.records['rotation_anchor'] = {
    id:'rotation_anchor', type:'rotation', date:date, member:memberId,
    updatedAt: Date.now()
  };
  saveData();
}
/* the next open slot on the calendar — normally the coming Friday, but a
   restart dated further out means the family is taking a break until then */
function nextOpenFriday(){
  var a = rotationAnchor(), nf = AZ.nextFriday();
  return (a && a.date > nf) ? a.date : nf;
}
/* nights that count toward the running order — everything since the restart */
function nightsSinceAnchor(){
  var a = rotationAnchor();
  var past = happenedNights();
  if (!a) return past;
  return past.filter(function(n){ return n.date >= a.date; });
}
/* where the order picks back up when nothing is booked yet — the last night
   that happened since the restart, else the restart itself, else the top */
function rotationBase(){
  var since = nightsSinceAnchor();
  if (since.length) return rotationNext(since[0].pickedBy);
  var a = rotationAnchor();
  if (a) return memberById(a.member);
  var past = happenedNights();
  if (past.length) return rotationNext(past[0].pickedBy);
  return MEMBERS[0];
}
/* The upcoming calendar, one row per Friday. Every Friday gets a slot, so a
   movie booked a month out no longer swallows the open Fridays in front of
   it — those still belong to whoever's turn they are. A booked night claims
   the Friday it lands on (within a few days, for the Saturdays), and the
   rotation continues from whoever the previous slot went to. Keeps going
   past `count` if it has to, so nothing already booked falls off the end. */
function rotationOrderFrom(member){
  var out = [], start = 0;
  for (var i=0;i<MEMBERS.length;i++) if (MEMBERS[i].id === member.id) start = i;
  for (var j=0;j<MEMBERS.length;j++) out.push(MEMBERS[(start + j) % MEMBERS.length]);
  return out;
}
function lineupSlots(count){
  var sched = scheduledNights();
  var placed = {}, slots = [];
  var cursor = nextOpenFriday();
  if (sched.length && sched[0].date < cursor) cursor = sched[0].date;
  /* Everybody still owed a turn this time around. Booking a Friday that
     wasn't yours takes your name off the list rather than shunting the
     person you bumped off the end of it — so nobody loses a turn when a
     night gets claimed out of order. */
  var order = rotationOrderFrom(rotationBase());
  var cycle = order.slice();
  function take(memberId){
    for (var k=0;k<cycle.length;k++){
      if (cycle[k].id === memberId){ cycle.splice(k, 1); break; }
    }
    if (!cycle.length) cycle = order.slice();
  }
  while (slots.length < count){
    var hit = null;
    for (var i=0;i<sched.length;i++){
      if (placed[sched[i].id]) continue;
      if (Math.abs(AZ.daysBetween(cursor, sched[i].date)) <= 3){ hit = sched[i]; break; }
    }
    if (hit){
      placed[hit.id] = true;
      take(hit.pickedBy);
      slots.push({ date:hit.date, member:memberById(hit.pickedBy), title:hit.title, night:hit });
    } else {
      var who = cycle[0];
      take(who.id);
      slots.push({ date: cursor, title: null, night: null, member: who });
    }
    cursor = AZ.addDays(cursor, 7);
  }
  // anything booked past the end of the window still gets a slot of its own
  sched.forEach(function(n){
    if (placed[n.id]) return;
    slots.push({ date:n.date, member:memberById(n.pickedBy), title:n.title, night:n });
  });
  return slots;
}
/* who is up next — whoever owns the very next slot on the calendar */
function nextPicker(){
  return lineupSlots(1)[0].member;
}
/* default picker when logging a brand-new night — the first Friday nobody
   has booked yet, so two people don't get booked into one slot */
function pickerForNewNight(){
  var slots = lineupSlots(8);
  for (var i=0;i<slots.length;i++) if (!slots[i].night) return slots[i].member;
  return rotationNext(slots[slots.length-1].member.id);
}
/* whose Friday a given date is, if it's one we're projecting */
function pickerForDate(date){
  if (!date) return null;
  var slots = lineupSlots(12);
  for (var i=0;i<slots.length;i++){
    if (Math.abs(AZ.daysBetween(slots[i].date, date)) <= 3) return slots[i].member;
  }
  return null;
}
/* ---------- quote matching ----------
   When two people save the same line (or one saves a longer version of
   it) we show it once, credited to everyone who picked it. */
function normQuote(s){
  return String(s || '')
    .toLowerCase()
    .replace(/[‘’“”"']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function quoteSimilar(a, b){
  var na = normQuote(a), nb = normQuote(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // one is a longer telling of the other ("Weaknesses: cake" inside
  // "Strengths: none. Weaknesses: cake") — guarded so tiny lines like
  // "hey" don't swallow everything they appear in
  if (na.length >= 8 && nb.length >= 8 && (na.indexOf(nb) !== -1 || nb.indexOf(na) !== -1)) return true;
  // near-identical wording (Dice coefficient over word tokens)
  var ta = na.split(' '), tb = nb.split(' ');
  if (ta.length < 3 || tb.length < 3) return false;
  var pool = {};
  tb.forEach(function(t){ pool[t] = (pool[t] || 0) + 1; });
  var overlap = 0;
  ta.forEach(function(t){ if (pool[t]) { overlap++; pool[t]--; } });
  return (2 * overlap) / (ta.length + tb.length) >= 0.8;
}
/* entries: [{text, member}] -> [{text, members:[...]}] */
function groupQuotes(entries){
  var groups = [];
  entries.forEach(function(e){
    if (!e.text) return;
    for (var i = 0; i < groups.length; i++){
      if (quoteSimilar(groups[i].text, e.text)){
        if (groups[i].members.indexOf(e.member) === -1) groups[i].members.push(e.member);
        // keep the fullest wording as the one we print
        if (String(e.text).length > String(groups[i].text).length) groups[i].text = e.text;
        return;
      }
    }
    groups.push({ text: e.text, members: [e.member] });
  });
  return groups;
}
function nightQuoteGroups(nightId){
  var entries = [];
  MEMBERS.forEach(function(m){
    rxQuotes(reactionFor(nightId, m.id)).forEach(function(q){
      entries.push({ text: q, member: m });
    });
  });
  return groupQuotes(entries);
}
/* note beside a quote several people saved — they chose the line, they
   didn't say it, and there may be more than two of them */
function sharedQuoteNote(count){
  if (count >= MEMBERS.length) return '— all of us picked this one!';
  if (count === 2) return '— both picked this one';
  if (count === 3) return '— all three picked this one';
  return '— ' + count + ' of us picked this one';
}
function memberNames(list){
  var names = list.map(function(m){ return m.name; });
  if (names.length <= 1) return names.join('');
  if (names.length === 2) return names[0] + ' & ' + names[1];
  return names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
}
function allQuotes(){
  var out = [];
  var ns = nights();
  for (var i=0;i<ns.length;i++){
    // group per movie so the same line in two films stays separate
    nightQuoteGroups(ns[i].id).forEach(function(g){
      out.push({ quote: g.text, members: g.members, movie: ns[i].title });
    });
  }
  return out;
}
function nightNearDate(dateStr){
  var list = nights();
  for (var i=0;i<list.length;i++){
    if (Math.abs(AZ.daysBetween(dateStr, list[i].date)) <= 2) return list[i];
  }
  return null;
}
function pollTally(nightId){
  var t = { laughed:[], cried:[], rewatch:[], seenBefore:[], answered:0 };
  MEMBERS.forEach(function(m){
    var r = reactionFor(nightId, m.id);
    if (r && r.poll){
      t.answered++;
      if (r.poll.laughed) t.laughed.push(m);
      if (r.poll.cried) t.cried.push(m);
      if (r.poll.rewatch) t.rewatch.push(m);
      if (r.poll.seenBefore) t.seenBefore.push(m);
    }
  });
  return t;
}

/* ---------- sample data ---------- */
/* the family has dismissed the demo data (synced, so it sticks on every phone) */
function samplesDismissed(){
  var r = data.records['settings_samples'];
  return !!(r && !r.deleted && r.cleared);
}
function hasRealNights(){
  return nights().some(function(n){ return !n.sample; });
}
function seedSample(){
  // never re-seed once the family has dismissed the demo, once real nights
  // exist, or on a phone that is already joined to family sync
  if (samplesDismissed() || Store.get('seeded') || nights().length || Sync.configured()) return;
  var now = Date.now();
  var seeds = [
    { title:'The Princess Bride', year:1987, date:'2026-07-10', pickedBy:'chris', grad:'linear-gradient(160deg,#8A6A2E,#3A2A0E)',
      rx: {
        chris:  { stars:5, why:'You can’t officially be an Ortiz kid until you’ve seen it. It was time.', thought:'Still perfect. The kids finally got why I say "inconceivable" all the time.', character:'Inigo Montoya', scene:'The Cliffs of Insanity duel. Two masters fencing left-handed out of pure respect, switching hands mid-fight. Best sword fight ever put on film.', quotes:['Hello. My name is Inigo Montoya.'], memories:['All four of us saying the Montoya speech together by the end.'], poll:{laughed:true, cried:false, rewatch:true, seenBefore:true} },
        kat:    { stars:4.5, thought:'Holds up better than almost anything from the 80s.', character:'Westley', quotes:['As you wish.'], memories:['River gasping at the shrieking eels.'], poll:{laughed:true, cried:true, rewatch:true, seenBefore:true} },
        sedona: { stars:4, thought:'The sword fight was actually so good?', character:'Inigo Montoya', quotes:['Inconceivable!'], memories:['Dad quoting every line 2 seconds early.'], poll:{laughed:true, cried:false, rewatch:true, seenBefore:false} },
        river:  { stars:5, thought:'THE ROUS ARE REAL.', character:'Fezzik', quotes:['Anybody want a peanut?','Have fun storming the castle!'], memories:['Popcorn flew everywhere during the eel jump-scare.'], poll:{laughed:true, cried:false, rewatch:true, seenBefore:false} }
      } },
    { title:'Spider-Man: Into the Spider-Verse', year:2018, date:'2026-07-17', pickedBy:'kat', grad:'linear-gradient(160deg,#4A2E5E,#1E0E2A)',
      rx: {
        chris:  { stars:5, thought:'Best-looking animated movie ever made. Not close.', character:'Miles Morales', quotes:['That’s all it is, Miles. A leap of faith.'], memories:['Everyone dead silent during the leap scene.'], poll:{laughed:true, cried:true, rewatch:true, seenBefore:true} },
        kat:    { stars:5, why:'The art style is unlike anything else — I wanted us to see it together on the big TV.', thought:'The soundtrack carried the whole pizza dinner.', character:'Spider-Gwen', quotes:['Hey.'], memories:['Sedona adding the whole soundtrack to her playlist before credits ended.','The four of us doing the "hey" nod at dinner all week.'], poll:{laughed:true, cried:true, rewatch:true, seenBefore:true} },
        sedona: { stars:5, thought:'No notes. Peni Parker deserved more scenes.', character:'Peni Parker', quotes:['It’s a canon event.'], memories:['We paused it to argue about which Spider-person we’d each be.'], poll:{laughed:true, cried:false, rewatch:true, seenBefore:false} },
        river:  { stars:4, thought:'Spider-Ham is the best character and I will not be debating this.', character:'Spider-Ham', scene:'The leap of faith. Miles jumps off the building and the whole screen flips upside down so it looks like he is rising instead of falling.', quotes:['That could be a baby photo.'], memories:['Doing the Miles shoulder-touch to Dad all weekend.'], poll:{laughed:true, cried:false, rewatch:true, seenBefore:false} }
      } },
    { title:'Jumanji: Welcome to the Jungle', year:2017, date:'2026-07-24', pickedBy:'sedona', grad:'linear-gradient(160deg,#2E5E4A,#0E2A1E)',
      rx: {
        chris:  { stars:3.5, thought:'Fun, loud, forgettable. Great pick for pizza night though.', character:'Dr. Smolder Bravestone', quotes:['I have a fanny pack full of gains.'], memories:['Kat crying laughing at the cake scene.'], poll:{laughed:true, cried:false, rewatch:false, seenBefore:true} },
        kat:    { stars:4, thought:'Jack Black playing a teenage girl is a career highlight.', character:'Professor Shelly Oberon', scene:'The cake scene. One bite, one beat of pure silence, and then the loudest explosion of the whole movie. I had to pause it to breathe.', quotes:['I can’t even with this place.'], memories:['The cake scene. I had to pause it.'], poll:{laughed:true, cried:false, rewatch:true, seenBefore:false} },
        sedona: { stars:4, why:'We needed a loud, funny one after a long week. Mission accomplished.', thought:'Good pick, me. The video-game lives idea is clever.', character:'Ruby Roundhouse', quotes:['Strengths: none. Weaknesses: cake.'], memories:['River checking his own "strengths and weaknesses" after.'], poll:{laughed:true, cried:false, rewatch:true, seenBefore:false} },
        river:  { stars:5, thought:'CAKE. BOOM.', character:'Franklin "Mouse" Finbar', quotes:['Weaknesses: cake.'], memories:['We all listed our video game strengths at breakfast.'], poll:{laughed:true, cried:false, rewatch:true, seenBefore:false} }
      } }
  ];
  for (var i=0;i<seeds.length;i++){
    var s = seeds[i];
    var nid = 'night_seed_' + i;
    data.records[nid] = { id:nid, type:'night', title:s.title, year:s.year, date:s.date,
      pickedBy:s.pickedBy, grad:s.grad, sample:true, updatedAt: now };
    for (var m in s.rx){
      var rid = 'rx_' + nid + '_' + m;
      var rx = s.rx[m];
      data.records[rid] = { id:rid, type:'reaction', nightId:nid, member:m,
        stars:rx.stars, why:rx.why || '', thought:rx.thought, character:rx.character,
        scene:rx.scene || '', quotes:rx.quotes, memories:rx.memories, poll:rx.poll,
        sample:true, updatedAt: now };
    }
  }
  Store.set('seeded', true);
  saveData();
}
function hasSample(){
  for (var id in data.records){
    var r = data.records[id];
    if (r && r.sample && !r.deleted) return true;
  }
  return false;
}
function clearSample(quiet){
  var now = Date.now();
  for (var id in data.records){
    var r = data.records[id];
    if (r && r.sample && !r.deleted){
      // NOTE: no `sample` flag on the tombstone — records marked sample are
      // stripped before upload, so a flagged tombstone would never reach the
      // other phones and the demo nights would come back on their next sync
      data.records[id] = { id:r.id, type:r.type, deleted:true, updatedAt:now };
    }
  }
  data.records['settings_samples'] = {
    id:'settings_samples', type:'setting', key:'samples', cleared:true, updatedAt: now
  };
  Store.set('seeded', true);
  saveData();
  render();
  if (!quiet) toast('Sample nights cleared — couch is all yours');
}
