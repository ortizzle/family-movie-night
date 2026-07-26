/* Family Movie Night — fmn/core.js
   Storage, Arizona time, theme and motion, the cast, TMDB and OMDb lookups.

   These files load in a fixed order from index.html and share one global
   scope, exactly as the single inline script did. Order matters: boot.js
   runs the startup calls and must stay last. */

'use strict';
/* =====================================================================
   FAMILY MOVIE NIGHT — Ortiz Family · v1.3
   v1.2: quotes render as comic speech bubbles (Comic Neue, alternating
   tails); "favorite scene" renders as a screenplay page (Courier
   Prime, CUT TO: + slugline) in scrapbooks and yearbooks.
   v1.3: Settings > Appearance — Light/Dark/Auto theme and a projector-
   animations on/off/auto toggle. Keepsake pages (scrapbook, yearbook,
   comic bubbles, screenplay excerpts) intentionally stay "paper"-
   colored in both themes; only the app chrome re-themes.
   AI: optional Anthropic key (Settings) powers per-movie After-Credits
   packs — fun facts, trivia, discussion questions — stored as synced
   records so one phone generates and every phone gets them. The app is
   fully usable with no key set.
   Tabs: Nights / Stats / Trivia / Settings.
   Reactions: stars, thought, favorite character, quotes[], memories[],
   family poll (laughed / cried / watch again / seen it before), and
   "why I picked it" for the night's selector.
   Keepsakes: per-night scrapbook (grouped by question) and a Year in
   Review — both print to US Letter PDFs. Settings has export/import
   JSON backups.
   Sync: shared family Gist, safe merge (per-record newest-wins) with
   tombstoned deletes — one memory book across every phone. Offline
   first: localStorage always works; sync retries when back online.
   ===================================================================== */

/* ---------- Arizona time helpers (canonical) ---------- */
var AZ = {
  tz: 'America/Phoenix',
  today: function(){
    return new Intl.DateTimeFormat('en-CA', { timeZone: this.tz }).format(new Date());
  },
  pretty: function(dateStr){
    var p = dateStr.split('-').map(Number);
    var d = new Date(p[0], p[1]-1, p[2]);
    return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
  },
  prettyLong: function(dateStr){
    var p = dateStr.split('-').map(Number);
    var d = new Date(p[0], p[1]-1, p[2]);
    return d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
  },
  monthDay: function(dateStr){
    var p = dateStr.split('-').map(Number);
    var d = new Date(p[0], p[1]-1, p[2]);
    return d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
  },
  daysBetween: function(a, b){
    return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
  },
  addDays: function(dateStr, n){
    var p = dateStr.split('-').map(Number);
    var d = new Date(p[0], p[1]-1, p[2]);
    d.setDate(d.getDate() + n);
    var mm = String(d.getMonth()+1).padStart(2,'0');
    var dd = String(d.getDate()).padStart(2,'0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  },
  nextFriday: function(){
    var t = this.today().split('-').map(Number);
    var d = new Date(t[0], t[1]-1, t[2]);
    var add = (5 - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + add);
    var mm = String(d.getMonth()+1).padStart(2,'0');
    var dd = String(d.getDate()).padStart(2,'0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }
};

/* ---------- localStorage wrapper (canonical) ---------- */
var Store = {
  ns: 'fmn_',
  get: function(key, fallback){
    if (fallback === undefined) fallback = null;
    try {
      var raw = localStorage.getItem(this.ns + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch(e){ return fallback; }
  },
  set: function(key, value){
    try { localStorage.setItem(this.ns + key, JSON.stringify(value)); return true; }
    catch(e){ return false; }
  },
  remove: function(key){ localStorage.removeItem(this.ns + key); }
};

/* ---------- appearance: theme + motion (Settings > Appearance) ----------
   Both default to 'auto' (follow the phone), and can be pinned to an
   explicit value. Applied via attribute/class so plain CSS handles the
   rest — no inline styles, no per-element JS. */
function resolveTheme(){
  var pref = Store.get('theme', 'auto');
  if (pref === 'light' || pref === 'dark') return pref;
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
}
function applyTheme(){
  var resolved = resolveTheme();
  document.documentElement.setAttribute('data-theme', resolved);
  var mt = document.querySelector('meta[name="theme-color"]');
  if (mt) mt.content = resolved === 'light' ? '#FAF3E8' : '#211820';
}
function resolveMotion(){
  var pref = Store.get('motion', 'auto');
  if (pref === 'on') return true;
  if (pref === 'off') return false;
  return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
function applyMotion(){
  document.documentElement.classList.toggle('motion-on', resolveMotion());
}
if (window.matchMedia){
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function(){
    if (Store.get('theme', 'auto') === 'auto') applyTheme();
  });
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function(){
    if (Store.get('motion', 'auto') === 'auto') applyMotion();
  });
}

/* ---------- the cast ---------- */
var MEMBERS = [
  { id:'chris',  name:'Chris',  color:'#7FB4E8', onWhite:'#2F6DA8', paper:'#D6E7F7' },
  { id:'kat',    name:'Kat',    color:'#F2705F', onWhite:'#C94F3D', paper:'#FAD9CE' },
  { id:'sedona', name:'Sedona', color:'#A8C686', onWhite:'#6E9155', paper:'#E2EDCF' },
  { id:'river',  name:'River',  color:'#C4A5E8', onWhite:'#7350A8', paper:'#E9DEF8' }
];
/* member colors are tuned for dark cards; on light cards use the deeper
   on-paper tone so names stay readable */
function memberInk(m){
  return resolveTheme() === 'light' ? m.onWhite : m.color;
}
function memberById(id){
  for (var i=0;i<MEMBERS.length;i++) if (MEMBERS[i].id === id) return MEMBERS[i];
  return MEMBERS[0];
}

/* ---------- TMDB ---------- */
var TMDB_IMG = 'https://image.tmdb.org/t/p/w342';
function detectCred(raw){
  var t = (raw || '').trim();
  if (!t) return null;
  if (t.indexOf('eyJ') === 0) return { type:'v4', value:t };
  return { type:'v3', value:t };
}
/* The TMDB key is shared with the family through the synced gist so one
   person's setup gives everyone posters — otherwise each phone has to be
   configured separately and the others see blank cards. It's a free,
   read-only metadata key; the Anthropic key stays per-device because it
   bills. Nothing is ever written into the HTML. */
function sharedTmdbKey(){
  var r = data.records['settings_tmdb'];
  return (r && !r.deleted && r.value) ? r.value : null;
}
function setSharedTmdbKey(v){
  data.records['settings_tmdb'] = {
    id:'settings_tmdb', type:'setting', key:'tmdb', value:v, updatedAt: Date.now()
  };
  saveData();
}
function loadTmdbCred(){
  var own = Store.get('tmdb_key');
  if (own) return detectCred(own);
  var shared = sharedTmdbKey();
  if (shared) return detectCred(shared);
  try {
    var raw = localStorage.getItem('sr_tmdb_key');
    if (raw){
      var v = JSON.parse(raw);
      if (v && v.type && v.value) return v;
    }
  } catch(e){}
  return null;
}
/* optional OMDb key -> IMDb / Rotten Tomatoes / Metacritic scores.
   Shared the same way so the whole family sees the same numbers. */
function omdbKey(){
  var own = Store.get('omdb_key');
  if (own) return own;
  var r = data.records['settings_omdb'];
  return (r && !r.deleted && r.value) ? r.value : null;
}
function setSharedOmdbKey(v){
  data.records['settings_omdb'] = {
    id:'settings_omdb', type:'setting', key:'omdb', value:v, updatedAt: Date.now()
  };
  saveData();
}
function tmdbSearch(query){
  var cred = loadTmdbCred();
  if (!cred) return Promise.reject(new Error('NO_KEY'));
  var url = 'https://api.themoviedb.org/3/search/movie?include_adult=false&query=' + encodeURIComponent(query);
  var headers = {};
  if (cred.type === 'v4') headers['Authorization'] = 'Bearer ' + cred.value;
  else url += '&api_key=' + encodeURIComponent(cred.value);
  return fetch(url, { headers: headers }).then(function(res){
    if (!res.ok) throw new Error('TMDB ' + res.status);
    return res.json();
  });
}

/* ---------- movie facts (cert, release, runtime, critic scores) ----------
   Fetched once per title and cached on the record so they sync to the
   family and survive offline. OMDb (optional) adds IMDb / Rotten
   Tomatoes / Metacritic. */
function tmdbDetails(tmdbId){
  var cred = loadTmdbCred();
  if (!cred || !tmdbId) return Promise.reject(new Error('NO_KEY'));
  var url = 'https://api.themoviedb.org/3/movie/' + tmdbId + '?append_to_response=release_dates,watch/providers';
  var headers = {};
  if (cred.type === 'v4') headers['Authorization'] = 'Bearer ' + cred.value;
  else url += '&api_key=' + encodeURIComponent(cred.value);
  return fetch(url, { headers: headers }).then(function(res){
    if (!res.ok) throw new Error('TMDB ' + res.status);
    return res.json();
  });
}
/* Where the family can actually watch it tonight. TMDB relays JustWatch
   data; we only want US, and only the names — logos would mean more
   requests and more layout. Streaming is what matters, so rent/buy is a
   fallback, not a headline. */
function usWatchFrom(details){
  try {
    var wp = details['watch/providers'];
    var us = wp && wp.results && wp.results.US;
    if (!us) return null;
    function names(list){
      return (list || []).map(function(p){ return p.provider_name; }).slice(0, 4);
    }
    var out = {
      link: us.link || null,
      stream: names(us.flatrate),
      rent: names(us.rent).concat(names(us.buy)).slice(0, 3)
    };
    if (!out.stream.length && !out.rent.length) return null;
    return out;
  } catch(e){ return null; }
}
function usCertFrom(details){
  try {
    var list = (details.release_dates && details.release_dates.results) || [];
    for (var i=0;i<list.length;i++){
      if (list[i].iso_3166_1 !== 'US') continue;
      var rd = list[i].release_dates || [];
      for (var j=0;j<rd.length;j++){
        if (rd[j].certification) return rd[j].certification;
      }
    }
  } catch(e){}
  return null;
}
function omdbScores(imdbId){
  var key = omdbKey();
  if (!key || !imdbId) return Promise.resolve(null);
  return fetch('https://www.omdbapi.com/?apikey=' + encodeURIComponent(key) + '&i=' + encodeURIComponent(imdbId))
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){
      if (!d || d.Response === 'False') return null;
      var out = { imdb: d.imdbRating && d.imdbRating !== 'N/A' ? d.imdbRating : null, rt:null, meta:null };
      (d.Ratings || []).forEach(function(r){
        if (r.Source === 'Rotten Tomatoes') out.rt = r.Value;
        if (r.Source === 'Metacritic') out.meta = r.Value;
      });
      return out;
    })
    .catch(function(){ return null; });
}
/* resolves {cert, released, runtime, tmdbScore, imdb, rt, meta} */
function buildFacts(tmdbId, fallbackTitle){
  var idPromise = tmdbId
    ? Promise.resolve(tmdbId)
    : tmdbSearch(fallbackTitle || '').then(function(d){
        var hit = (d.results || [])[0];
        return hit ? hit.id : null;
      });
  return idPromise.then(function(id){
    if (!id) throw new Error('NO_ID');
    return tmdbDetails(id).then(function(d){
      var f = {
        tmdbId: id,
        cert: usCertFrom(d),
        released: d.release_date || null,
        runtime: d.runtime || null,
        tmdbScore: d.vote_average || null,
        imdbId: d.imdb_id || null,
        watch: usWatchFrom(d),
        fetchedAt: Date.now()
      };
      return omdbScores(f.imdbId).then(function(sc){
        if (sc){ f.imdb = sc.imdb; f.rt = sc.rt; f.meta = sc.meta; }
        if (omdbKey()) f.omdbTried = true;
        return f;
      });
    });
  });
}
/* IMDb chip links straight to that film's Parents Guide */
function imdbGuideChip(f, cls){
  var label = 'IMDb ' + f.imdb;
  if (!f.imdbId) return el('span', cls + ' star', label);
  var a = el('a', cls + ' star link', label + ' ⓘ');
  a.href = 'https://www.imdb.com/title/' + f.imdbId + '/parentalguide';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.setAttribute('aria-label', 'IMDb parents guide for this film');
  return a;
}
/* the "where can we watch it" row */
function watchRow(f){
  if (!f || !f.watch) return null;
  var w = f.watch;
  var wrap = el('div','watch-row');
  var lead = el('div','wr-lead', w.stream.length ? '📺 Streaming on' : '💵 Rent or buy');
  wrap.appendChild(lead);
  var pills = el('div','wr-pills');
  var list = w.stream.length ? w.stream : w.rent;
  list.forEach(function(name){ pills.appendChild(el('span','wr-pill', name)); });
  if (w.stream.length && w.rent.length){
    pills.appendChild(el('span','wr-pill muted', 'or rent: ' + w.rent[0]));
  }
  wrap.appendChild(pills);
  if (w.link){
    var a = el('a','wr-link','Where to watch ↗');
    a.href = w.link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    wrap.appendChild(a);
  }
  return wrap;
}
function factChips(f, cls){
  var wrap = el('div', cls || 'idea-facts');
  if (!f) return wrap;
  if (f.cert) wrap.appendChild(el('span','idea-fact cert', f.cert));
  if (f.released) wrap.appendChild(el('span','idea-fact', AZ.pretty(f.released).replace(/^\w+, /,'') + ', ' + f.released.slice(0,4)));
  if (f.runtime) wrap.appendChild(el('span','idea-fact', Math.floor(f.runtime/60) + 'h ' + (f.runtime%60) + 'm'));
  if (f.imdb) wrap.appendChild(imdbGuideChip(f, 'idea-fact'));
  if (f.rt) wrap.appendChild(el('span','idea-fact rt','🍅 ' + f.rt));
  if (f.meta) wrap.appendChild(el('span','idea-fact','Metacritic ' + f.meta));
  if (!f.imdb && f.tmdbScore) wrap.appendChild(el('span','idea-fact star','★ ' + Number(f.tmdbScore).toFixed(1) + ' TMDB'));
  return wrap;
}
/* ensure a night has cached facts; re-renders once they arrive.
   Facts cached before an OMDb key was added have no IMDb/RT scores, so
   top them up once a key appears rather than leaving them blank forever. */
function ensureNightFacts(night, onDone){
  var f = night.facts;
  var haveCore = !!(f && f.fetchedAt);
  var wantsOmdb = haveCore && !f.imdb && !f.omdbTried && !!omdbKey() && !!f.imdbId;

  if (haveCore && !wantsOmdb){ if (onDone) onDone(f); return; }

  if (wantsOmdb){
    if (onDone) onDone(f);            // paint what we already have
    omdbScores(f.imdbId).then(function(sc){
      var rec = data.records[night.id];
      if (!rec || rec.deleted) return;
      var merged = {};
      for (var k in f) merged[k] = f[k];
      if (sc){ merged.imdb = sc.imdb; merged.rt = sc.rt; merged.meta = sc.meta; }
      merged.omdbTried = true;
      rec.facts = merged;
      rec.updatedAt = Date.now();
      saveData();
      if (onDone) onDone(merged);
    }).catch(function(){});
    return;
  }

  if (!loadTmdbCred()) return;
  buildFacts(night.tmdbId, night.title + (night.year ? ' ' + night.year : '')).then(function(f2){
    var rec = data.records[night.id];
    if (!rec || rec.deleted) return;
    rec.facts = f2;
    rec.updatedAt = Date.now();
    saveData();
    if (onDone) onDone(f2);
  }).catch(function(){});
}
