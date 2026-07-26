/* Family Movie Night — fmn/settings.js
   Taste profiles, the Settings tab, and the master render switch.

   These files load in a fixed order from index.html and share one global
   scope, exactly as the single inline script did. Order matters: boot.js
   runs the startup calls and must stay last. */

/* ---------- taste profiles (drive per-person recommendations) ---------- */
var GENRES = ['Animated','Adventure','Comedy','Fantasy','Sci-fi','Musical','Mystery','Action',
  'Drama','True stories','Historical','Sports','Spooky (a little)','Heartwarming'];
function whoAmI(){
  var id = Store.get('me');
  if (!id) return null;
  for (var i=0;i<MEMBERS.length;i++) if (MEMBERS[i].id === id) return MEMBERS[i];
  return null;
}
function profileFor(memberId){
  var r = data.records['profile_' + memberId];
  return (r && !r.deleted) ? r : null;
}
function profileFilled(p){
  return !!(p && ((p.genres && p.genres.length) || p.loves || p.avoids || p.night));
}
function profileSummary(p){
  if (!profileFilled(p)) return 'Not set up yet — tap to answer a few questions';
  var bits = [];
  if (p.genres && p.genres.length) bits.push(p.genres.slice(0,3).join(', '));
  if (p.loves) bits.push('loves ' + p.loves.split(/[,.]/)[0].trim());
  return bits.join(' · ') || 'Profile saved';
}
/* Starter profiles, from what the family already said they love. These are a
   first draft, not a verdict — anyone can open theirs and rewrite it, and the
   moment they do, the starter flag is gone. Only ever written when a person
   has no profile of their own yet. */
var STARTER_PROFILES = {
  chris: { genres:['Adventure','Comedy','Sci-fi','Mystery','True stories'],
    era:'Love the old classics',
    loves:'The Princess Bride, Back to the Future, Indiana Jones, Knives Out, Spider-Verse',
    avoids:'',
    night:'Something we can all quote at breakfast for the next week.' },
  kat: { genres:['Comedy','Mystery','Heartwarming','Drama','Musical'],
    era:'Happy to mix in classics',
    loves:'Only Murders in the Building, Elsbeth, Knives Out, Ferris Bueller’s Day Off',
    avoids:'',
    night:'Funny and warm, with a mystery I can try to solve out loud.' },
  sedona: { genres:['Mystery','Comedy','Musical','Animated','Fantasy'],
    era:'Happy to mix in classics',
    loves:'Only Murders in the Building, High Potential, Elsbeth, Knives Out, KPop Demon Hunters, Disney movies',
    avoids:'Anything genuinely scary',
    night:'A whodunnit with a soundtrack worth adding to my playlist.' },
  river: { genres:['Animated','Adventure','Comedy','Fantasy','Musical'],
    era:'Mostly newer films',
    loves:'KPop Demon Hunters, Disney and Pixar movies, Spider-Verse, Knives Out',
    avoids:'Sad animal movies, anything too scary',
    night:'Big, funny, and loud — with popcorn.' }
};
/* Where the order restarts. Chris took the weekend of July 26, 2026, so the
   next Friday belongs to Kat, and it runs Kat → Sedona → River → Chris from
   there. Written once, with a fixed timestamp so every phone agrees; change
   it any time from Settings and that edit wins everywhere. */
var ANCHOR_SEED = { date:'2026-07-31', member:'kat', at: 1753500000000 };
function seedRotation(){
  if (data.records['rotation_anchor']) return;   // includes tombstones
  data.records['rotation_anchor'] = {
    id:'rotation_anchor', type:'rotation',
    date: ANCHOR_SEED.date, member: ANCHOR_SEED.member,
    updatedAt: ANCHOR_SEED.at
  };
  saveData();
}
function seedProfiles(){
  var wrote = false;
  MEMBERS.forEach(function(m){
    if (data.records['profile_' + m.id]) return;   // includes tombstones — never resurrect
    var s = STARTER_PROFILES[m.id];
    if (!s) return;
    data.records['profile_' + m.id] = {
      id:'profile_' + m.id, type:'profile', member:m.id, starter:true,
      genres:s.genres.slice(), era:s.era, loves:s.loves, avoids:s.avoids, night:s.night,
      updatedAt: Date.now()
    };
    wrote = true;
  });
  if (wrote) saveData();
}
function saveProfile(memberId, prof){
  prof.id = 'profile_' + memberId;
  prof.type = 'profile';
  prof.member = memberId;
  prof.updatedAt = Date.now();
  data.records[prof.id] = prof;
  saveData();
}
function openProfileEditor(member){
  var p = profileFor(member.id) || {};
  var picked = (p.genres || []).slice();
  openModal(function(box, close){
    var h = el('h3', null, member.name + '’s movie taste');
    h.style.color = memberInk(member);
    box.appendChild(h);
    box.appendChild(el('div','msub','A few questions — these shape the ideas we suggest'));

    box.appendChild(el('div','f-label','What kinds of movies do you love?'));
    var gc = el('div','genre-chips');
    GENRES.forEach(function(g){
      var b = el('button','genre-chip' + (picked.indexOf(g) !== -1 ? ' on' : ''), g);
      b.type = 'button';
      b.addEventListener('click', function(){
        var i = picked.indexOf(g);
        if (i === -1) picked.push(g); else picked.splice(i, 1);
        b.classList.toggle('on', picked.indexOf(g) !== -1);
      });
      gc.appendChild(b);
    });
    box.appendChild(gc);

    box.appendChild(el('div','f-label','Older films & classics'));
    var eras = ['Mostly newer films','Happy to mix in classics','Love the old classics'];
    var eraPick = p.era || eras[1];
    var ec = el('div','genre-chips');
    eras.forEach(function(opt){
      var b = el('button','genre-chip' + (eraPick === opt ? ' on' : ''), opt);
      b.type = 'button';
      b.addEventListener('click', function(){
        eraPick = opt;
        var kids = ec.children;
        for (var i=0;i<kids.length;i++) kids[i].classList.toggle('on', kids[i].textContent === eraPick);
      });
      ec.appendChild(b);
    });
    box.appendChild(ec);

    box.appendChild(el('div','f-label','Movies & shows you already love'));
    var loves = el('textarea','f-area');
    loves.placeholder = 'e.g. Only Murders in the Building, Knives Out, KPop Demon Hunters…';
    loves.value = p.loves || '';
    box.appendChild(loves);

    box.appendChild(el('div','f-label','Not for me'));
    var avoids = el('textarea','f-area');
    avoids.placeholder = 'e.g. too scary, sad animal movies, long war films…';
    avoids.value = p.avoids || '';
    box.appendChild(avoids);

    box.appendChild(el('div','f-label','What makes a great movie night for you?'));
    var night = el('textarea','f-area');
    night.placeholder = 'e.g. something funny we can quote all week…';
    night.value = p.night || '';
    box.appendChild(night);

    var row = el('div','modal-buttons');
    var cancel = el('button','btn-secondary','Cancel');
    cancel.addEventListener('click', close);
    var save = el('button','btn-gold','Save');
    save.addEventListener('click', function(){
      saveProfile(member.id, {
        genres: picked, era: eraPick, loves: loves.value.trim(),
        avoids: avoids.value.trim(), night: night.value.trim()
      });
      var rid = 'airecs_' + member.id;   // taste changed — retire the shared picks
      if (data.records[rid]) data.records[rid] = { id:rid, type:'airecs', deleted:true, updatedAt: Date.now() };
      close();
      render();
      toast(member.name + '’s taste saved — ideas will use it 🎭');
    });
    row.appendChild(cancel); row.appendChild(save);
    box.appendChild(row);
  });
}
/* collapsible settings section */
/* Which Settings sections are open, remembered across renders — otherwise a
   background sync landing (or any re-render) slams every section shut while
   somebody is halfway through typing in one. */
var collState = {};
function collapsible(app, title, opts){
  opts = opts || {};
  var card = el('div','set-card');
  var head = el('button','set-head');
  head.type = 'button';
  head.appendChild(el('div','set-title', title));
  if (opts.badge) head.appendChild(el('span','set-badge' + (opts.badgeOn ? ' on' : ''), opts.badge));
  head.appendChild(el('span','chev','›'));
  var body = el('div','set-body');
  if (!(title in collState)) collState[title] = !!opts.open;
  function paint(){
    body.style.display = collState[title] ? 'block' : 'none';
    head.setAttribute('aria-expanded', collState[title] ? 'true' : 'false');
  }
  paint();
  head.addEventListener('click', function(){ collState[title] = !collState[title]; paint(); });
  card.appendChild(head);
  card.appendChild(body);
  app.appendChild(card);
  return body;
}

/* ---------- RENDER: settings ---------- */
function renderSettings(app){
  app.appendChild(el('div','section-label','Settings & Keepsakes'));
  app.appendChild(el('div','section-sub','The projection booth ⚙️'));

  /* appearance */
  var ap = el('div','set-card');
  ap.appendChild(el('div','set-title','🎨 Appearance'));
  ap.appendChild(el('div','set-note','Pick a look, or leave it on Auto to follow your phone’s setting.'));

  ap.appendChild(el('div','f-label','Theme'));
  var themeRow = el('div','poll-chips triple');
  var curTheme = Store.get('theme', 'auto');
  [['light','☀️ Light'],['dark','🌙 Dark'],['auto','📱 Auto']].forEach(function(opt){
    var b = el('button','poll-chip' + (curTheme === opt[0] ? ' on' : ''), opt[1]);
    b.type = 'button';
    b.addEventListener('click', function(){
      Store.set('theme', opt[0]);
      applyTheme();
      render();
      toast('Theme: ' + opt[1]);
    });
    themeRow.appendChild(b);
  });
  ap.appendChild(themeRow);

  ap.appendChild(el('div','f-label','Projector animations'));
  var motionRow = el('div','poll-chips triple');
  var curMotion = Store.get('motion', 'auto');
  [['on','🎬 On'],['off','🛑 Off'],['auto','📱 Auto']].forEach(function(opt){
    var b = el('button','poll-chip' + (curMotion === opt[0] ? ' on' : ''), opt[1]);
    b.type = 'button';
    b.addEventListener('click', function(){
      Store.set('motion', opt[0]);
      applyMotion();
      render();
      toast('Projector animations: ' + opt[1]);
    });
    motionRow.appendChild(b);
  });
  ap.appendChild(motionRow);
  ap.appendChild(el('div','set-note','Flicker, film burns, and drifting dust on the “Up next…” screen. Turn them off for calmer viewing or to save battery.'));
  app.appendChild(ap);

  /* keepsakes */
  var ks = collapsible(app, '📕 Printable keepsakes', { open:true });
  var years = {};
  nights().forEach(function(n){ years[n.date.slice(0,4)] = true; });
  var yearList = Object.keys(years).sort().reverse();
  if (yearList.length){
    ks.appendChild(el('div','set-note','Open one, then “Save as PDF.” The collection is the big one — cover, table of contents, the full record book, then every movie night we’ve ever had.'));
    var cb = el('button','set-btn','📚 The Complete Collection — every movie night');
    cb.addEventListener('click', openCollection);
    ks.appendChild(cb);
    yearList.forEach(function(y){
      var b = el('button','set-btn','📖 ' + y + ' Year in Review');
      b.addEventListener('click', function(){ openYearbook(y); });
      ks.appendChild(b);
    });
  } else {
    ks.appendChild(el('div','set-note','Log some movie nights and your printable keepsakes will appear here.'));
  }
  /* who's on this phone */
  var meNow = whoAmI();
  var wm = collapsible(app, '🙋 Who’s on this phone?', {
    badge: meNow ? meNow.name : 'Not set', badgeOn: !!meNow
  });
  wm.appendChild(el('div','set-note','Pick yourself and the app marks your row on each movie night, and puts your own recommendations first. Stays on this phone.'));
  var meChips = el('div','pick-chips');
  MEMBERS.forEach(function(m){
    var c = el('button','pick-chip' + (meNow && meNow.id === m.id ? ' on' : ''), m.name);
    c.type = 'button';
    if (meNow && meNow.id === m.id) c.style.background = m.color;
    c.addEventListener('click', function(){
      Store.set('me', m.id);
      render();
      toast('This phone is ' + m.name + '’s 🙋');
    });
    meChips.appendChild(c);
  });
  wm.appendChild(meChips);

  /* restart the turn order */
  var anch = rotationAnchor();
  var ro = collapsible(app, '🔁 Whose turn is next?', {
    badge: nextPicker().name, badgeOn: true
  });
  ro.appendChild(el('div','set-note','Set who takes the next Friday and the order runs on from there. Use this after a break, or any time you want to start the rotation over — you don’t have to log a movie for it.'));
  var roDate = el('input','f-input');
  roDate.type = 'date';
  roDate.value = (anch && anch.date > AZ.today()) ? anch.date : AZ.nextFriday();
  ro.appendChild(el('div','f-label','Starting which Friday?'));
  ro.appendChild(roDate);
  ro.appendChild(el('div','f-label','Whose pick is that one?'));
  var roPicked = anch ? anch.member : nextPicker().id;
  var roChips = el('div','pick-chips');
  function roPaint(){
    var kids = roChips.children;
    for (var i=0;i<kids.length;i++){
      var on = kids[i]._mid === roPicked;
      kids[i].classList.toggle('on', on);
      kids[i].style.background = on ? memberById(kids[i]._mid).color : '';
    }
  }
  MEMBERS.forEach(function(m){
    var c = el('button','pick-chip', m.name);
    c.type = 'button';
    c._mid = m.id;
    c.addEventListener('click', function(){ roPicked = m.id; roPaint(); roPreview(); });
    roChips.appendChild(c);
  });
  roPaint();
  ro.appendChild(roChips);
  var roOrder = el('div','set-note');
  function roPreview(){
    var bits = [], who = memberById(roPicked), d = roDate.value || AZ.nextFriday();
    for (var i=0;i<4;i++){
      bits.push(AZ.monthDay(AZ.addDays(d, 7*i)) + ' — ' + who.name);
      who = rotationNext(who.id);
    }
    roOrder.textContent = 'Then: ' + bits.join(' · ');
  }
  roDate.addEventListener('change', roPreview);
  roPreview();
  ro.appendChild(roOrder);
  var roSave = el('button','set-btn','🔁 Restart the order');
  roSave.addEventListener('click', function(){
    setRotationAnchor(roDate.value || AZ.nextFriday(), roPicked);
    render();
    toast(memberById(roPicked).name + ' is up next 🔁');
  });
  ro.appendChild(roSave);

  /* passed-on movies — undo lives here */
  var passes = passedTitles();
  if (passes.length){
    var pc = collapsible(app, '🚫 Not interested', { badge: String(passes.length) });
    pc.appendChild(el('div','set-note','Movies somebody passed on. They stay off the Ideas shelves and Claude steers away from them. Changed your mind? Tap one to put it back.'));
    passes.forEach(function(r){
      var row = el('button','tp-row');
      row.type = 'button';
      var who = r.by ? memberById(r.by) : null;
      var dot = el('span','tp-dot', who ? who.name.charAt(0) : '🚫');
      dot.style.background = who ? who.color : 'var(--line)';
      row.appendChild(dot);
      var body = el('span','tp-body');
      body.appendChild(el('span','tp-name', r.title + (r.year ? ' (' + r.year + ')' : '')));
      body.appendChild(el('span','tp-sum', who ? who.name + ' passed — tap to undo' : 'Passed — tap to undo'));
      row.appendChild(body);
      row.appendChild(el('span','tp-go','↺'));
      row.addEventListener('click', function(){
        unpass(r);
        render();
        toast(r.title + ' is back in the mix');
      });
      pc.appendChild(row);
    });
  }

  /* The Ortizzle */
  var oz = collapsible(app, '🏆 The Ortizzle', { badge: String(ortizzleYear()) });
  oz.appendChild(el('div','set-note','Our year-end awards, for achievement in entertaining the Ortiz family in the motion picture sciences. Most winners come straight from the year’s ratings and polls; three are put to the family on the night.'));
  oz.appendChild(el('div','f-label','Ceremony night'));
  var ozDate = el('input','f-input');
  ozDate.type = 'date';
  ozDate.value = ortizzleDate();
  ozDate.addEventListener('change', function(){
    if (!ozDate.value) return;
    setOrtizzleDate(ozDate.value);
    render();
    toast('The Ortizzle is set for ' + AZ.prettyLong(ozDate.value) + ' 🏆');
  });
  oz.appendChild(ozDate);
  var away = daysToOrtizzle();
  oz.appendChild(el('div','set-note', away > 0
    ? away + ' days to go. A countdown appears on the Nights tab once it’s within four months.'
    : away === 0 ? 'That’s tonight. 🎉' : 'That date has passed — pick next year’s.'));
  var ozOpen = el('button','set-btn','🏆 Open the ' + ortizzleYear() + ' Ortizzle');
  ozOpen.addEventListener('click', function(){ openOrtizzle(ortizzleYear()); });
  oz.appendChild(ozOpen);

  /* marked-as-watched — undo lives here too */
  var seenList = seenTitles();
  if (seenList.length){
    var sc = collapsible(app, '✓ Marked as watched', { badge: String(seenList.length) });
    sc.appendChild(el('div','set-note','Movies somebody said we\u2019d already seen, so they stay off the Ideas shelves. Marked one by mistake, or want another go at it? Tap to put it back.'));
    seenList.forEach(function(r){
      var row = el('button','tp-row');
      row.type = 'button';
      var dot = el('span','tp-dot','\u2713');
      dot.style.background = 'var(--line)';
      row.appendChild(dot);
      var body = el('span','tp-body');
      body.appendChild(el('span','tp-name', r.title + (r.year ? ' (' + r.year + ')' : '')));
      body.appendChild(el('span','tp-sum','Marked as watched \u2014 tap to undo'));
      row.appendChild(body);
      row.appendChild(el('span','tp-go','\u21ba'));
      row.addEventListener('click', function(){
        unmarkSeen(r);
        render();
        toast(r.title + ' is back in the mix');
      });
      sc.appendChild(row);
    });
  }

  /* taste profiles */
  var tp = collapsible(app, '🎭 Taste profiles', {
    badge: MEMBERS.filter(function(m){ return profileFilled(profileFor(m.id)); }).length + '/' + MEMBERS.length,
    badgeOn: MEMBERS.every(function(m){ return profileFilled(profileFor(m.id)); })
  });
  tp.appendChild(el('div','set-note','Everyone starts with a profile built from what you already love. Tap yours to correct it — the Ideas tab uses these to recommend movies for each person by name.'));
  MEMBERS.forEach(function(m){
    var prof = profileFor(m.id);
    var row = el('button','tp-row');
    row.type = 'button';
    var dot = el('span','tp-dot', m.name.charAt(0));
    dot.style.background = m.color;
    row.appendChild(dot);
    var body = el('span','tp-body');
    var nm = el('span','tp-name', m.name);
    nm.style.color = memberInk(m);
    body.appendChild(nm);
    body.appendChild(el('span','tp-sum', profileSummary(prof)));
    if (prof && prof.starter) body.appendChild(el('span','tp-starter','starter — tap to make it yours'));
    row.appendChild(body);
    row.appendChild(el('span','tp-go','›'));
    row.addEventListener('click', function(){ openProfileEditor(m); });
    tp.appendChild(row);
  });

  /* family sync */
  var sy = collapsible(app, '🔄 Family sync', {
    badge: Sync.configured() ? 'On' : 'Off', badgeOn: Sync.configured()
  });
  var configured = Sync.configured();
  if (configured){
    var last = Store.get('last_sync');
    sy.appendChild(el('div','set-note','Sync is ON — every phone with this token & gist shares one memory book. Last synced: '
      + (last ? new Date(last).toLocaleString('en-US', { timeZone: AZ.tz, month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }) : 'not yet') + '.'));
    var now = el('button','set-btn','🔄 Sync now');
    now.addEventListener('click', function(){ pullSync(false); });
    sy.appendChild(now);
  } else {
    sy.appendChild(el('div','set-note','One-time setup: paste the family GitHub token, then create (or paste) the family gist. Do the same on each phone — after that, everything syncs automatically.'));
  }
  var rowt = el('div','set-row');
  var tInput2 = el('input','f-input');
  tInput2.type = 'password';
  tInput2.autocomplete = 'off';
  tInput2.placeholder = Sync.token() ? 'Token saved — paste to replace' : 'Paste GitHub token (gist scope)';
  rowt.appendChild(tInput2);
  var tSave = el('button','set-save','Save');
  tSave.addEventListener('click', function(){
    var v = tInput2.value.trim();
    if (!v) return;
    Store.set('gist_token', v);
    render();
    toast('Token saved 🔐');
  });
  rowt.appendChild(tSave);
  sy.appendChild(rowt);
  var rowg = el('div','set-row');
  var gInput = el('input','f-input');
  gInput.type = 'text';
  gInput.autocomplete = 'off';
  gInput.placeholder = Sync.gistId() ? 'Gist saved: ' + Sync.gistId().slice(0,8) + '… — paste to replace' : 'Paste family gist ID';
  rowg.appendChild(gInput);
  var gSave = el('button','set-save','Save');
  gSave.addEventListener('click', function(){
    var v = gInput.value.trim();
    if (!v) return;
    Store.set('gist_id', v);
    render();
    toast('Gist linked 🔗');
    pullSync(false);
  });
  rowg.appendChild(gSave);
  sy.appendChild(rowg);

  if (Sync.gistId()){
    var idRow = el('div','gist-id-row');
    idRow.appendChild(el('div','lbl','Family gist ID — send this to the other phones'));
    idRow.appendChild(el('code','gist-id-text', Sync.gistId()));
    sy.appendChild(idRow);

    var copyBtn = el('button','set-btn','📋 Copy gist ID');
    copyBtn.addEventListener('click', function(){
      var id = Sync.gistId();
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(id)
          .then(function(){ toast('Gist ID copied ✓'); })
          .catch(function(){ toast('Couldn’t copy — tap the ID above to select it'); });
      } else {
        toast('Tap the ID above, then copy the selection');
      }
    });
    sy.appendChild(copyBtn);

    if (navigator.share){
      var shareBtn = el('button','set-btn','📤 Share with family');
      shareBtn.addEventListener('click', function(){
        navigator.share({
          title: 'Family Movie Night sync',
          text: 'Family Movie Night gist ID: ' + Sync.gistId()
            + '\n\nIn the app: Settings → Family sync → paste this, plus the token I sent you separately.'
        }).catch(function(){});
      });
      sy.appendChild(shareBtn);
    }
  }

  if (Sync.token() && !Sync.gistId()){
    var cg = el('button','set-btn','✨ Create the family gist (first phone only)');
    cg.addEventListener('click', function(){
      Sync.createGist().then(function(id){
        render();
        toast('Family gist created! Share its ID with the other phones');
      }).catch(function(){
        toast('Couldn’t create the gist — check the token');
      });
    });
    sy.appendChild(cg);
  }
  /* data safety */
  var ds = collapsible(app, '💾 Backups');
  ds.appendChild(el('div','set-note','Export saves everything — nights, reactions, quotes, memories — to a file you can keep in iCloud/Files. Import merges a backup in without losing newer entries.'));
  var ex = el('button','set-btn','📦 Export backup file');
  ex.addEventListener('click', exportBackup);
  ds.appendChild(ex);
  var fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', function(){
    if (fileInput.files && fileInput.files[0]) importBackup(fileInput.files[0]);
    fileInput.value = '';
  });
  ds.appendChild(fileInput);
  var im = el('button','set-btn','📥 Import backup file');
  im.addEventListener('click', function(){ fileInput.click(); });
  ds.appendChild(im);
  ds.appendChild(el('div','set-note','Even with family sync on, a backup file in Drive/Files is the seatbelt.'));
  /* tmdb key */
  var tk = collapsible(app, '🎬 TMDB key — posters & facts', {
    badge: loadTmdbCred() ? 'Saved' : 'Not set', badgeOn: !!loadTmdbCred()
  });
  var shared = sharedTmdbKey();
  tk.appendChild(el('div','set-note', shared
    ? 'Saved and shared with the family — every phone that syncs gets posters automatically. Paste a new one to replace it.'
    : (loadTmdbCred()
      ? 'Using a key stored on this phone only. Save it here to share it with the whole family through sync.'
      : 'Free at themoviedb.org. Save it once and it syncs to everyone’s phone — posters, movie facts and search for the whole family.')));
  var rowk = el('div','set-row');
  var kInput = el('input','f-input');
  kInput.type = 'password';
  kInput.autocomplete = 'off';
  kInput.placeholder = shared ? 'Shared key saved — paste to replace' : 'Paste TMDB API key';
  rowk.appendChild(kInput);
  var kSave = el('button','set-save','Save');
  kSave.addEventListener('click', function(){
    var v = kInput.value.trim();
    if (!v) return;
    Store.remove('tmdb_key');   // prefer the shared copy from here on
    setSharedTmdbKey(v);
    render();
    toast(Sync.configured() ? 'TMDB key saved & shared with the family 🎬' : 'TMDB key saved 🎬');
  });
  rowk.appendChild(kSave);
  tk.appendChild(rowk);

  /* omdb key — IMDb / Rotten Tomatoes / Metacritic */
  var ok = collapsible(app, '🍅 OMDb key — IMDb & RT', {
    badge: omdbKey() ? 'Saved' : 'Not set', badgeOn: !!omdbKey()
  });
  var oShared = data.records['settings_omdb'];
  ok.appendChild(el('div','set-note', (oShared && !oShared.deleted)
    ? 'Saved and shared — scrapbooks and movie ideas show IMDb, Rotten Tomatoes and Metacritic scores.'
    : 'Optional and free at omdbapi.com. Adds IMDb, Rotten Tomatoes and Metacritic scores to scrapbook pages and movie ideas.'));
  var rowo = el('div','set-row');
  var oInput = el('input','f-input');
  oInput.type = 'password';
  oInput.autocomplete = 'off';
  oInput.placeholder = (oShared && !oShared.deleted) ? 'Shared key saved — paste to replace' : 'Paste OMDb API key';
  rowo.appendChild(oInput);
  var oSave = el('button','set-save','Save');
  oSave.addEventListener('click', function(){
    var v = oInput.value.trim();
    if (!v) return;
    Store.remove('omdb_key');
    setSharedOmdbKey(v);
    // let already-cached nights top up with IMDb / RT next time they're opened
    nights().forEach(function(n){
      var rec = data.records[n.id];
      if (rec && rec.facts) { delete rec.facts.omdbTried; }
    });
    saveData();
    render();
    toast(Sync.configured() ? 'OMDb key saved & shared 🍅' : 'OMDb key saved 🍅');
  });
  rowo.appendChild(oSave);
  ok.appendChild(rowo);

  /* claude key */
  var ck = collapsible(app, '🤖 Claude — packs & picks', {
    badge: Store.get('anthropic_key') ? 'Saved' : 'Not set', badgeOn: !!Store.get('anthropic_key')
  });
  var hasAnthro = !!Store.get('anthropic_key');
  ck.appendChild(el('div','set-note', hasAnthro
    ? 'Key saved — every night card’s ✨ After-credits button can make fun facts, movie trivia, and talk-about-it questions for that night’s film. Packs sync to the whole family.'
    : 'Optional: add an Anthropic API key and every night card gets an ✨ After-credits pack — fun facts, trivia about that exact movie, and discussion questions for the post-movie couch talk. Everything else works without it.'));
  var rowc = el('div','set-row');
  var cInput = el('input','f-input');
  cInput.type = 'password';
  cInput.autocomplete = 'off';
  cInput.placeholder = hasAnthro ? 'Key saved — paste to replace' : 'Paste Anthropic API key';
  rowc.appendChild(cInput);
  var cSave = el('button','set-save','Save');
  cSave.addEventListener('click', function(){
    var v = cInput.value.trim();
    if (!v) return;
    Store.set('anthropic_key', v);
    render();
    toast('Claude key saved 🤖');
  });
  rowc.appendChild(cSave);
  ck.appendChild(rowc);
  if (hasAnthro){
    var cClear = el('button','set-btn warn','Remove Claude key');
    cClear.addEventListener('click', function(){
      Store.remove('anthropic_key');
      render();
      toast('Claude key removed');
    });
    ck.appendChild(cClear);
  }
  /* sample data */
  if (hasSample()){
    var sd = collapsible(app, '🧪 Sample data');
    sd.appendChild(el('div','set-note','The three demo nights are still in the memory book so you can explore.'));
    var cs = el('button','set-btn warn','🧹 Clear sample data');
    cs.addEventListener('click', function(){
      confirmModal({
        title:'Clear the sample nights?',
        message:'The three demo nights and their reactions will be removed so you can start fresh.',
        confirmText:'Clear them',
        onConfirm: clearSample
      });
    });
    sd.appendChild(cs);
  }

  var foot = el('footer');
  foot.appendChild(el('div', null, 'Family Movie Night · Ortiz Family · v3.0'));
  app.appendChild(foot);
}

/* ---------- master render ---------- */
function render(){
  var app = document.getElementById('app');
  while (app.firstChild) app.removeChild(app.firstChild);
  renderHeader(app);
  if (view === 'home') renderHome(app);
  else if (view === 'ideas') renderIdeas(app);
  else if (view === 'stats') renderStats(app);
  else if (view === 'trivia') renderTrivia(app);
  else renderSettings(app);
  renderTabbar();
}
