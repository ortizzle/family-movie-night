/* Family Movie Night — fmn/ui.js
   DOM helpers, stars, the modal shell, logging a night, reactions, deleting.

   These files load in a fixed order from index.html and share one global
   scope, exactly as the single inline script did. Order matters: boot.js
   runs the startup calls and must stay last. */

/* ---------- tiny DOM helpers ---------- */
function el(tag, cls, text){
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
}
function toast(msg){
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function(){ t.classList.remove('show'); }, 2600);
}
/* ---------- stars (supports halves) ----------
   Ratings are stored as numbers in 0.5 steps. Whole-number ratings saved
   by earlier versions stay valid. Each star is an outline glyph with a
   filled glyph layered on top, clipped to 0 / 50 / 100% width. */
function clampStars(n){
  n = Math.round((Number(n) || 0) * 2) / 2;
  return Math.max(0, Math.min(5, n));
}
function starFillPct(rating, position){
  if (rating >= position) return 100;
  if (rating >= position - 0.5) return 50;
  return 0;
}
/* "3½" — for toasts and hints */
function starText(n){
  n = clampStars(n);
  var whole = Math.floor(n);
  return (n - whole >= 0.5) ? (whole + '½') : String(whole);
}
function starUnit(pct){
  var st = el('span','st');
  st.appendChild(document.createTextNode('☆'));
  var fill = el('span','fill','★');
  fill.style.width = pct + '%';
  st.appendChild(fill);
  return st;
}
function starsNode(n, cls){
  n = clampStars(n);
  var span = el('span', cls || 'stars');
  for (var i=1;i<=5;i++) span.appendChild(starUnit(starFillPct(n, i)));
  return span;
}
function confettiBurst(count){
  var colors = ['#FFB454','#F2705F','#A8C686','#8FB8DE','#FFC94A','#FFEFD9'];
  var wrap = el('div','confetti');
  var n = count || 44;
  for (var i=0;i<n;i++){
    var p = document.createElement('i');
    p.style.left = (Math.random()*100) + 'vw';
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = (1.6 + Math.random()*1.4) + 's';
    p.style.animationDelay = (Math.random()*0.4) + 's';
    p.style.transform = 'rotate(' + Math.floor(Math.random()*360) + 'deg)';
    wrap.appendChild(p);
  }
  document.body.appendChild(wrap);
  setTimeout(function(){ wrap.remove(); }, 3600);
}

/* ---------- generic modal shell ---------- */
function openModal(build){
  var overlay = el('div','modal-overlay');
  var box = el('div','modal-box');
  overlay.appendChild(box);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.remove(); });
  build(box, function close(){ overlay.remove(); });
  document.body.appendChild(overlay);
  return overlay;
}
function confirmModal(opts){
  openModal(function(box, close){
    box.appendChild(el('h3', null, opts.title));
    box.appendChild(el('p', null, opts.message));
    var row = el('div','modal-buttons');
    var cancel = el('button','btn-secondary', opts.cancelText || 'Cancel');
    cancel.addEventListener('click', close);
    var ok = el('button','btn-primary', opts.confirmText || 'OK');
    ok.addEventListener('click', function(){ close(); if (opts.onConfirm) opts.onConfirm(); });
    row.appendChild(cancel); row.appendChild(ok);
    box.appendChild(row);
  });
}

/* ---------- log-a-night modal ---------- */
function openAddNight(){
  var sel = null;
  openModal(function(box, close){
    box.appendChild(el('h3', null, '🍿 Log a Movie Night'));
    box.appendChild(el('div','msub','What did the family watch?'));

    var cred = loadTmdbCred();
    var manualWrap = el('div');
    var searchWrap = el('div');
    var selWrap = el('div');
    function renderSel(){
      while (selWrap.firstChild) selWrap.removeChild(selWrap.firstChild);
      if (!sel) return;
      var lbl = el('div','f-label','Tonight’s feature');
      var card = el('div','m-results');
      var rowBtn = el('div','m-result');
      var mini = el('div','mini');
      if (sel.posterPath){
        var img = document.createElement('img');
        img.alt = ''; img.src = TMDB_IMG + sel.posterPath;
        mini.appendChild(img);
      }
      var tx = el('div');
      tx.appendChild(el('div','t', sel.title));
      tx.appendChild(el('div','y', sel.year ? String(sel.year) : ''));
      rowBtn.appendChild(mini); rowBtn.appendChild(tx);
      card.appendChild(rowBtn);
      selWrap.appendChild(lbl); selWrap.appendChild(card);
    }

    if (cred){
      var sLbl = el('div','f-label','Search');
      var sInput = el('input','f-input');
      sInput.type = 'search'; sInput.placeholder = 'Search movies (TMDB)…'; sInput.autocomplete = 'off';
      var resBox = el('div');
      var timer = null;
      sInput.addEventListener('input', function(){
        clearTimeout(timer);
        var q = sInput.value.trim();
        if (q.length < 2){ while (resBox.firstChild) resBox.removeChild(resBox.firstChild); return; }
        timer = setTimeout(function(){
          tmdbSearch(q).then(function(d){
            while (resBox.firstChild) resBox.removeChild(resBox.firstChild);
            var list = (d.results || []).slice(0, 5);
            if (!list.length) return;
            var wrap = el('div','m-results');
            list.forEach(function(r){
              var b = el('button','m-result');
              b.type = 'button';
              var mini = el('div','mini');
              if (r.poster_path){
                var img = document.createElement('img');
                img.alt = ''; img.loading = 'lazy';
                img.src = 'https://image.tmdb.org/t/p/w92' + r.poster_path;
                mini.appendChild(img);
              }
              var tx = el('div');
              tx.appendChild(el('div','t', r.title));
              tx.appendChild(el('div','y', (r.release_date || '').slice(0,4)));
              b.appendChild(mini); b.appendChild(tx);
              b.addEventListener('click', function(){
                sel = { title: r.title, year: Number((r.release_date||'').slice(0,4)) || null,
                        tmdbId: r.id, posterPath: r.poster_path || null };
                while (resBox.firstChild) resBox.removeChild(resBox.firstChild);
                sInput.value = '';
                renderSel();
              });
              wrap.appendChild(b);
            });
            resBox.appendChild(wrap);
          }).catch(function(){ toast('Search failed — try manual entry'); });
        }, 350);
      });
      searchWrap.appendChild(sLbl);
      searchWrap.appendChild(sInput);
      searchWrap.appendChild(resBox);
      var manualLink = el('button','linky','or type it in manually');
      manualLink.type = 'button';
      manualLink.addEventListener('click', function(){
        searchWrap.style.display = 'none';
        manualWrap.style.display = 'block';
      });
      searchWrap.appendChild(manualLink);
      manualWrap.style.display = 'none';
    } else {
      var note = el('div','m-note',
        'Tip: add a free TMDB key in Settings and you’ll get posters & movie search here. Manual entry works great too.');
      searchWrap.appendChild(note);
    }

    manualWrap.appendChild(el('div','f-label','Movie title'));
    var tInput = el('input','f-input');
    tInput.type = 'text'; tInput.placeholder = 'e.g. The Iron Giant';
    manualWrap.appendChild(tInput);
    manualWrap.appendChild(el('div','f-label','Year (optional)'));
    var yInput = el('input','f-input');
    yInput.type = 'number'; yInput.inputMode = 'numeric'; yInput.placeholder = 'e.g. 1999';
    manualWrap.appendChild(yInput);

    var dateWrap = el('div');
    dateWrap.appendChild(el('div','f-label','Movie night date'));
    var dInput = el('input','f-input');
    dInput.type = 'date'; dInput.value = AZ.today();
    dateWrap.appendChild(dInput);

    var pickWrap = el('div');
    pickWrap.appendChild(el('div','f-label','Whose pick was it?'));
    var chips = el('div','pick-chips');
    var picked = (pickerForDate(AZ.today()) || pickerForNewNight()).id;
    MEMBERS.forEach(function(m){
      var c = el('button','pick-chip', m.name);
      c.type = 'button';
      function paint(){
        if (picked === m.id){ c.classList.add('on'); c.style.background = m.color; }
        else { c.classList.remove('on'); c.style.background = ''; }
      }
      c.addEventListener('click', function(){ picked = m.id; repaintAll(); });
      c._paint = paint;
      chips.appendChild(c);
    });
    function repaintAll(){
      var kids = chips.children;
      for (var i=0;i<kids.length;i++) if (kids[i]._paint) kids[i]._paint();
    }
    repaintAll();
    pickWrap.appendChild(chips);
    /* Booking a night that hasn't happened yet is almost always someone
       claiming a Friday, so follow the calendar: whoever's turn that date is
       gets preselected. Past the end of the projected lineup we fall back to
       whoever's holding the phone. Either way the chips are right there. */
    var touchedPicker = false;
    chips.addEventListener('click', function(){ touchedPicker = true; });
    dInput.addEventListener('change', function(){
      if (touchedPicker) return;
      // the calendar knows whose Friday this is; fall back to whoever's
      // holding the phone only for a date the lineup doesn't reach
      var owner = pickerForDate(dInput.value), me = whoAmI();
      picked = (owner || (me && dInput.value > AZ.today() ? me : pickerForNewNight())).id;
      repaintAll();
    });

    var row = el('div','modal-buttons');
    var cancel = el('button','btn-secondary','Cancel');
    cancel.addEventListener('click', close);
    var save = el('button','btn-primary','Save the Night');
    save.addEventListener('click', function(){
      var title = sel ? sel.title : tInput.value.trim();
      if (!title){ toast('Give the movie a title first'); return; }
      var year = sel ? sel.year : (Number(yInput.value) || null);
      var date = dInput.value || AZ.today();
      var id = 'night_' + Date.now() + '_' + Math.floor(Math.random()*1e6);
      data.records[id] = {
        id:id, type:'night', title:title, year:year, date:date, pickedBy:picked,
        tmdbId: sel ? sel.tmdbId : null, posterPath: sel ? sel.posterPath : null,
        updatedAt: Date.now()
      };
      saveData();
      close();
      render();
      toast(memberById(picked).name + '’s pick is saved — everyone add your reactions!');
    });
    row.appendChild(cancel); row.appendChild(save);

    box.appendChild(searchWrap);
    box.appendChild(manualWrap);
    box.appendChild(selWrap);
    box.appendChild(dateWrap);
    box.appendChild(pickWrap);
    box.appendChild(row);
  });
}

/* ---------- reaction modal ---------- */
function openReaction(night, member){
  var existing = reactionFor(night.id, member.id);
  var stars = existing ? existing.stars : 0;
  var isPicker = night.pickedBy === member.id;
  var poll = existing && existing.poll ? {
    laughed: !!existing.poll.laughed, cried: !!existing.poll.cried,
    rewatch: !!existing.poll.rewatch, seenBefore: !!existing.poll.seenBefore
  } : { laughed:false, cried:false, rewatch:false, seenBefore:false };

  openModal(function(box, close){
    var h = el('h3', null, member.name + '’s Reaction');
    h.style.color = memberInk(member);
    box.appendChild(h);
    box.appendChild(el('div','msub', night.title + ' · ' + AZ.pretty(night.date)));

    box.appendChild(el('div','f-label','Star rating'));
    var sp = el('div','starpick');
    var starBtns = [];
    var hint = el('div','starpick-hint','');
    function paintStars(){
      starBtns.forEach(function(b, i){
        var pct = starFillPct(stars, i + 1);
        b.querySelector('.fill').style.width = pct + '%';
        b.classList.toggle('on', pct > 0);
      });
      hint.textContent = stars
        ? starText(stars) + ' out of 5 · tap again to clear'
        : 'Tap the stars — left half of a star for a ½';
    }
    for (var i=1;i<=5;i++){
      (function(n){
        var b = el('button');
        b.type = 'button';
        b.setAttribute('aria-label', n + ' stars (left half for ' + (n - 0.5) + ')');
        b.appendChild(starUnit(0));
        b.addEventListener('click', function(e){
          // left half of the glyph = half star; keyboard activation (no
          // pointer coords) always takes the whole star
          var rect = b.getBoundingClientRect();
          var viaPointer = e.clientX || e.clientY;
          var picked = (viaPointer && (e.clientX - rect.left) < rect.width / 2) ? n - 0.5 : n;
          stars = (picked === stars) ? 0 : picked; // tapping the same value clears it
          paintStars();
        });
        starBtns.push(b);
        sp.appendChild(b);
      })(i);
    }
    paintStars();
    box.appendChild(sp);
    box.appendChild(hint);

    /* director's intro — only for the picker */
    var why = null;
    if (isPicker){
      box.appendChild(el('div','f-label','🎬 Director’s intro — why this movie?'));
      why = el('textarea','f-area');
      why.placeholder = 'Tell the family why you picked tonight’s film…';
      why.value = existing ? (existing.why || '') : '';
      box.appendChild(why);
    }

    /* the picker's own question — theirs to write, everyone else's to answer */
    var askBox = null;
    if (isPicker){
      box.appendChild(el('div','f-label','❓ Your question for the family'));
      askBox = el('input','f-input');
      askBox.type = 'text';
      askBox.placeholder = 'e.g. Who’s going to cry first?';
      askBox.value = night.question || '';
      box.appendChild(askBox);
      box.appendChild(el('div','set-note','Ask one thing and everybody answers it in their own reaction. It gets its own page in the scrapbook.'));
    }

    /* ...and everybody's answer to it */
    var answer = null;
    if (night.question){
      box.appendChild(el('div','f-label','❓ ' + night.question));
      answer = el('textarea','f-area');
      answer.placeholder = memberById(night.pickedBy).name + ' wants to know…';
      answer.value = existing ? (existing.answer || '') : '';
      box.appendChild(answer);
    }

    box.appendChild(el('div','f-label','What did you think?'));
    var thought = el('textarea','f-area');
    thought.placeholder = 'Your two-sentence review…';
    thought.value = existing ? (existing.thought || '') : '';
    box.appendChild(thought);

    box.appendChild(el('div','f-label','Favorite character'));
    var character = el('input','f-input');
    character.type = 'text';
    character.placeholder = 'Who stole the movie for you?';
    character.value = existing ? (existing.character || '') : '';
    box.appendChild(character);

    box.appendChild(el('div','f-label','🎞 Favorite scene'));
    var scene = el('textarea','f-area');
    scene.placeholder = 'Set the scene — which moment will you replay forever?';
    scene.value = existing ? (existing.scene || '') : '';
    box.appendChild(scene);

    box.appendChild(el('div','f-label','Favorite quotes'));
    var quoteList = el('div','multi-list');
    function addQuoteInput(val){
      var q = el('input','f-input');
      q.type = 'text';
      q.placeholder = quoteList.children.length
        ? 'Another line worth keeping…'
        : 'The line you’ll be repeating all week';
      q.value = val || '';
      quoteList.appendChild(q);
      return q;
    }
    var exQuotes = rxQuotes(existing);
    if (exQuotes.length) exQuotes.forEach(function(q){ addQuoteInput(q); });
    else addQuoteInput('');
    box.appendChild(quoteList);
    var moreQ = el('button','linky','+ add another quote');
    moreQ.type = 'button';
    moreQ.addEventListener('click', function(){ addQuoteInput('').focus(); });
    box.appendChild(moreQ);

    box.appendChild(el('div','f-label','Favorite movie night memories'));
    var memList = el('div','multi-list');
    function addMemInput(val){
      var m = el('textarea','f-area');
      m.placeholder = memList.children.length
        ? 'Another moment from the night…'
        : 'Not the movie — the night. What happened on the couch?';
      m.value = val || '';
      memList.appendChild(m);
      return m;
    }
    var exMems = rxMemories(existing);
    if (exMems.length) exMems.forEach(function(m){ addMemInput(m); });
    else addMemInput('');
    box.appendChild(memList);
    var moreM = el('button','linky','+ add another memory');
    moreM.type = 'button';
    moreM.addEventListener('click', function(){ addMemInput('').focus(); });
    box.appendChild(moreM);

    /* the family poll */
    box.appendChild(el('div','f-label','🗳 The family poll'));
    var pollRow = el('div','poll-chips');
    [
      { key:'laughed',    label:'😂 I laughed' },
      { key:'cried',      label:'😢 I cried' },
      { key:'rewatch',    label:'🔁 I’d see it again' },
      { key:'seenBefore', label:'👀 Seen it before' }
    ].forEach(function(pq){
      var c = el('button','poll-chip' + (poll[pq.key] ? ' on' : ''), pq.label);
      c.type = 'button';
      c.addEventListener('click', function(){
        poll[pq.key] = !poll[pq.key];
        c.classList.toggle('on', poll[pq.key]);
      });
      pollRow.appendChild(c);
    });
    box.appendChild(pollRow);

    var row = el('div','modal-buttons');
    var cancel = el('button','btn-secondary','Cancel');
    cancel.addEventListener('click', close);
    var save = el('button','btn-gold', existing ? 'Update' : 'Save Reaction');
    save.addEventListener('click', function(){
      var quotes = [];
      for (var i=0;i<quoteList.children.length;i++){
        var v = quoteList.children[i].value.trim();
        if (v) quotes.push(v);
      }
      var memories = [];
      for (var j=0;j<memList.children.length;j++){
        var mv = memList.children[j].value.trim();
        if (mv) memories.push(mv);
      }
      var id = 'rx_' + night.id + '_' + member.id;
      data.records[id] = {
        id:id, type:'reaction', nightId:night.id, member:member.id,
        stars:stars, why: (isPicker && why) ? why.value.trim() : (existing ? existing.why || '' : ''),
        thought:thought.value.trim(), character:character.value.trim(), scene:scene.value.trim(),
        quotes:quotes, memories:memories, poll:poll,
        answer: answer ? answer.value.trim() : (existing ? existing.answer || '' : ''),
        updatedAt: Date.now()
      };
      // the picker's question lives on the night, not the reaction
      if (askBox){
        var q = askBox.value.trim();
        var nrec = data.records[night.id];
        if (nrec && !nrec.deleted && (nrec.question || '') !== q){
          nrec.question = q;
          nrec.updatedAt = Date.now();
        }
      }
      saveData();
      close();
      render();
      if (stars === 5) confettiBurst();
      toast(stars ? member.name + ' gave it ' + starText(stars) + ' stars' : 'Saved ' + member.name + '’s reaction');
    });
    row.appendChild(cancel); row.appendChild(save);
    box.appendChild(row);
  });
}

/* ---------- delete a night (tombstone) ---------- */
function reallyDeleteNight(night){
      var now = Date.now();
      data.records[night.id] = { id:night.id, type:'night', deleted:true, updatedAt:now };
      MEMBERS.forEach(function(m){
        var rid = 'rx_' + night.id + '_' + m.id;
        if (data.records[rid]) data.records[rid] = { id:rid, type:'reaction', deleted:true, updatedAt:now };
      });
  saveData();
  render();
  toast('Night removed');
}
/* Deleting a night throws away everyone's writing, so it takes a
   deliberate path: a menu, then a confirm that names what is lost, then
   a second confirm whenever anybody has already written something. */
function deleteNight(night){
  var filled = MEMBERS.filter(function(m){ return rxHasContent(reactionFor(night.id, m.id)); });
  if (!filled.length){
    confirmModal({
      title:'Remove this night?',
      message:'“' + night.title + '” (' + AZ.pretty(night.date) + ') has no reactions yet.',
      confirmText:'Delete night',
      onConfirm: function(){ reallyDeleteNight(night); }
    });
    return;
  }
  openModal(function(box, close){
    box.appendChild(el('h3', null, 'Delete this movie night?'));
    box.appendChild(el('div','msub', night.title + ' · ' + AZ.pretty(night.date)));
    var note = el('div','danger-note');
    note.appendChild(document.createTextNode(
      'This permanently deletes ' + filled.length + ' saved reaction' + (filled.length===1?'':'s') +
      ' from ' + memberNames(filled) + ' — every rating, quote, favorite scene and memory from that night. It cannot be undone.'));
    box.appendChild(note);
    var row = el('div','modal-buttons');
    var keep = el('button','btn-secondary','Keep it');
    keep.addEventListener('click', close);
    var go = el('button','btn-danger','Continue');
    go.addEventListener('click', function(){
      close();
      confirmModal({
        title:'Are you sure?',
        message:'Last chance — “' + night.title + '” and ' + memberNames(filled) + '’s writing will be gone for good.',
        confirmText:'Delete forever',
        onConfirm: function(){ reallyDeleteNight(night); }
      });
    });
    row.appendChild(keep); row.appendChild(go);
    box.appendChild(row);
  });
}
/* edit a night — mainly for moving a Friday that didn't happen, which
   pushes everyone behind it down the rotation automatically */
function openEditNight(night){
  openModal(function(box, close){
    box.appendChild(el('h3', null, 'Edit this movie night'));
    box.appendChild(el('div','msub', nightHappened(night) ? 'Already watched' : 'Not watched yet'));

    box.appendChild(el('div','f-label','Movie title'));
    var tInput = el('input','f-input');
    tInput.type = 'text';
    tInput.value = night.title || '';
    box.appendChild(tInput);

    box.appendChild(el('div','f-label','Year'));
    var yInput = el('input','f-input');
    yInput.type = 'number'; yInput.inputMode = 'numeric';
    yInput.value = night.year || '';
    box.appendChild(yInput);

    box.appendChild(el('div','f-label','Movie night date'));
    var dInput = el('input','f-input');
    dInput.type = 'date';
    dInput.value = night.date;
    box.appendChild(dInput);
    var hint = el('div','set-note','Moving this to a later date keeps everyone’s turn in order — the rest of the lineup shifts with it.');
    box.appendChild(hint);

    box.appendChild(el('div','f-label','❓ Question for the family'));
    var qInput = el('input','f-input');
    qInput.type = 'text';
    qInput.placeholder = 'e.g. Who’s going to cry first?';
    qInput.value = night.question || '';
    box.appendChild(qInput);
    box.appendChild(el('div','set-note','The picker’s own question — everyone answers it in their reaction.'));

    box.appendChild(el('div','f-label','Whose pick?'));
    var chips = el('div','pick-chips');
    var picked = night.pickedBy;
    MEMBERS.forEach(function(m){
      var c = el('button','pick-chip', m.name);
      c.type = 'button';
      function paint(){
        if (picked === m.id){ c.classList.add('on'); c.style.background = m.color; }
        else { c.classList.remove('on'); c.style.background = ''; }
      }
      c.addEventListener('click', function(){ picked = m.id; repaintAll(); });
      c._paint = paint;
      chips.appendChild(c);
    });
    function repaintAll(){
      var kids = chips.children;
      for (var i=0;i<kids.length;i++) if (kids[i]._paint) kids[i]._paint();
    }
    repaintAll();
    box.appendChild(chips);

    var row = el('div','modal-buttons');
    var cancel = el('button','btn-secondary','Cancel');
    cancel.addEventListener('click', close);
    var save = el('button','btn-gold','Save changes');
    save.addEventListener('click', function(){
      var title = tInput.value.trim();
      if (!title){ toast('The movie still needs a title'); return; }
      var rec = data.records[night.id];
      if (!rec || rec.deleted){ close(); return; }
      rec.title = title;
      rec.year = Number(yInput.value) || null;
      rec.date = dInput.value || rec.date;
      rec.pickedBy = picked;
      rec.question = qInput.value.trim();
      rec.updatedAt = Date.now();
      saveData();
      close();
      render();
      toast('Movie night updated');
    });
    row.appendChild(cancel); row.appendChild(save);
    box.appendChild(row);
  });
}
/* the ⋯ button on each night card */
function openNightMenu(night){
  openModal(function(box, close){
    box.appendChild(el('h3', null, night.title));
    box.appendChild(el('div','msub', AZ.pretty(night.date) + ' · ' + memberById(night.pickedBy).name + '’s pick'));
    var list = el('div','menu-list');
    var open = el('button','menu-item');
    open.appendChild(el('span','mi','📖'));
    open.appendChild(document.createTextNode('Open the scrapbook'));
    open.addEventListener('click', function(){ close(); openScrapbook(night); });
    list.appendChild(open);
    var ac = el('button','menu-item');
    ac.appendChild(el('span','mi','✨'));
    ac.appendChild(document.createTextNode('After-credits pack'));
    ac.addEventListener('click', function(){ close(); openAfterCredits(night); });
    list.appendChild(ac);
    var ed = el('button','menu-item');
    ed.appendChild(el('span','mi','✏️'));
    ed.appendChild(document.createTextNode(nightHappened(night) ? 'Edit details' : 'Edit or move this night'));
    ed.addEventListener('click', function(){ close(); openEditNight(night); });
    list.appendChild(ed);
    var del = el('button','menu-item danger');
    del.appendChild(el('span','mi','🗑'));
    del.appendChild(document.createTextNode('Delete this night'));
    del.addEventListener('click', function(){ close(); deleteNight(night); });
    list.appendChild(del);
    box.appendChild(list);
    var row = el('div','modal-buttons');
    var cancel = el('button','btn-secondary','Close');
    cancel.addEventListener('click', close);
    row.appendChild(cancel);
    box.appendChild(row);
  });
}
