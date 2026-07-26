/* Family Movie Night — fmn/ideas.js
   The Ideas tab: shelves, recommendations, shortlist, idea detail.

   These files load in a fixed order from index.html and share one global
   scope, exactly as the single inline script did. Order matters: boot.js
   runs the startup calls and must stay last. */

/* ---------- RENDER: ideas ----------
   Three sources, best-first: Claude ("For us", needs a key), TMDB
   discover (needs a key, gives real posters + synopses), and a curated
   built-in shelf so the tab is useful with no keys at all. Titles the
   family has already logged are filtered out. */
/* Curated shelf, tuned for a 9- and 12-year-old across genres.
   tags: kid = the everyday crowd-pleaser shelf, classic = older films
   that still land with this age group, talk = worth discussing after
   (this is where the tasteful PG-13/R titles live). */
var CURATED = [
  /* ---- animated & family adventure ---- */
  { title:'Spider-Man: Across the Spider-Verse', year:2023, cert:'PG', kid:true, overview:'Miles Morales is thrown across the multiverse and comes up against a whole society of Spider-People who think his story has to end one way.' },
  { title:'Puss in Boots: The Last Wish', year:2022, cert:'PG', kid:true, overview:'Down to his last life, a swashbuckling cat sets out to find a wishing star — chased by a wolf who is Death himself.' },
  { title:'The Mitchells vs. the Machines', year:2021, cert:'PG', kid:true, overview:'A gloriously odd family road trip turns into the last stand of humankind when the robots take over.' },
  { title:'Big Hero 6', year:2014, cert:'PG', kid:true, overview:'A boy genius and a soft inflatable healthcare robot build a superhero team to solve his brother’s death.' },
  { title:'Zootopia', year:2016, cert:'PG', kid:true, overview:'A rookie rabbit cop and a con-artist fox uncover a conspiracy in a city where predator and prey live side by side.' },
  { title:'Inside Out', year:2015, cert:'PG', kid:true, overview:'Inside an eleven-year-old’s head, Joy and Sadness get lost and have to find their way back before she falls apart.' },
  { title:'Coco', year:2017, cert:'PG', kid:true, overview:'A boy who dreams of being a musician crosses into the Land of the Dead and uncovers the truth about his family.' },
  { title:'Encanto', year:2021, cert:'PG', kid:true, overview:'The only girl in a magical family born without a gift may be the one who has to save their enchanted house.' },
  { title:'Moana', year:2016, cert:'PG', kid:true, overview:'A chief’s daughter sails beyond the reef with a stubborn demigod to return a stolen relic and save her island.' },
  { title:'How to Train Your Dragon', year:2010, cert:'PG', kid:true, overview:'A Viking teenager who is supposed to kill dragons instead befriends an injured one and changes his village forever.' },
  { title:'Klaus', year:2019, cert:'PG', kid:true, overview:'A spoiled postman posted to a bitter frozen town befriends a reclusive toymaker and accidentally invents a legend.' },
  { title:'Luca', year:2021, cert:'PG', kid:true, overview:'Two sea monsters spend a summer on the Italian Riviera passing as human boys, chasing a Vespa and a friendship.' },
  { title:'Turning Red', year:2022, cert:'PG', kid:true, overview:'A thirteen-year-old turns into a giant red panda whenever she gets excited — which, at thirteen, is constantly.' },
  { title:'Raya and the Last Dragon', year:2021, cert:'PG', kid:true, overview:'A lone warrior hunts the last dragon to reunite a broken land that has forgotten how to trust.' },
  { title:'The Bad Guys', year:2022, cert:'PG', kid:true, overview:'A crew of animal criminals pretends to go good — and one of them starts to mean it.' },
  { title:'Wreck-It Ralph', year:2012, cert:'PG', kid:true, overview:'An arcade villain leaves his own game to prove he can be a hero, and nearly breaks the arcade doing it.' },
  { title:'Kung Fu Panda', year:2008, cert:'PG', kid:true, overview:'A noodle-shop panda is accidentally chosen as the Dragon Warrior and has to become one for real.' },
  { title:'Ratatouille', year:2007, cert:'G', kid:true, overview:'A rat with a remarkable palate teams up with a clumsy kitchen worker to cook in a great Paris restaurant.' },
  { title:'WALL·E', year:2008, cert:'G', kid:true, overview:'A small trash-compacting robot alone on an abandoned Earth follows a visiting probe across the galaxy.' },
  { title:'The Incredibles', year:2004, cert:'PG', kid:true, overview:'A family of undercover superheroes is pulled back into action when a new villain targets them.' },
  { title:'The Iron Giant', year:1999, cert:'PG', kid:true, overview:'A boy in 1950s Maine befriends a giant metal robot from space and hides him from a government agent.' },
  { title:'My Neighbor Totoro', year:1988, cert:'G', kid:true, overview:'Two sisters move to the countryside while their mother is ill and befriend the forest spirits nearby.' },
  { title:'Kiki’s Delivery Service', year:1989, cert:'G', kid:true, overview:'A young witch moves to a seaside town for a year on her own and starts a flying delivery service.' },
  { title:'Castle in the Sky', year:1986, cert:'PG', kid:true, overview:'A girl with a mysterious pendant and a boy in a mining town race sky pirates to a legendary floating city.' },
  { title:'Paddington 2', year:2017, cert:'PG', kid:true, overview:'Paddington takes odd jobs to buy his aunt a birthday present, then must clear his name when it is stolen.' },

  /* ---- live-action adventure, comedy & mystery ---- */
  { title:'Enola Holmes', year:2020, cert:'PG-13', kid:true, overview:'Sherlock’s much sharper younger sister runs away to London and solves a case her brothers cannot.' },
  { title:'Jumanji: The Next Level', year:2019, cert:'PG-13', kid:true, overview:'The friends are pulled back into the game, only this time the avatars are scrambled and the desert is trying to kill them.' },
  { title:'Sonic the Hedgehog', year:2020, cert:'PG', kid:true, overview:'A super-fast blue alien hedgehog hides out in small-town Montana with a government scientist on his tail.' },
  { title:'Detective Pikachu', year:2019, cert:'PG', kid:true, overview:'A boy who can somehow understand a caffeine-addled Pikachu investigates his father’s disappearance.' },
  { title:'Night at the Museum', year:2006, cert:'PG', kid:true, overview:'A night guard discovers the museum exhibits come alive after dark — all of them, at once.' },
  { title:'School of Rock', year:2003, cert:'PG-13', kid:true, overview:'A failed guitarist fakes his way into substitute teaching and turns a class of ten-year-olds into a rock band.' },
  { title:'Holes', year:2003, cert:'PG', kid:true, overview:'A boy sent to a brutal desert camp digs holes all day and slowly uncovers why.' },
  { title:'Hugo', year:2011, cert:'PG', kid:true, overview:'An orphan living in a Paris train station repairs a mechanical man and stumbles into the birth of cinema.' },
  { title:'Matilda', year:1996, cert:'PG', kid:true, overview:'A brilliant girl with awful parents and a monstrous headmistress discovers she can move things with her mind.' },
  { title:'The Sandlot', year:1993, cert:'PG', kid:true, classic:true, overview:'A new kid falls in with a neighbourhood baseball crew and their summer becomes legend.' },
  { title:'Cool Runnings', year:1993, cert:'PG', kid:true, overview:'Four Jamaican sprinters and a disgraced coach take a bobsled to the Winter Olympics.' },
  { title:'The Karate Kid', year:1984, cert:'PG', kid:true, classic:true, overview:'A bullied teenager is taught karate — and rather more than karate — by his apartment handyman.' },
  { title:'The Goonies', year:1985, cert:'PG', kid:true, classic:true, overview:'A gang of kids follow a pirate map under their town to save their neighbourhood.' },
  { title:'Free Guy', year:2021, cert:'PG-13', kid:true, overview:'A background character in a video game realises he is one, and decides to become the hero instead.' },
  { title:'The Greatest Showman', year:2017, cert:'PG', kid:true, overview:'P.T. Barnum builds a spectacle out of the people everyone else turned away, and nearly loses his family to it.' },
  { title:'Sing', year:2016, cert:'PG', kid:true, overview:'A desperate koala theatre owner stages a singing competition, and every contestant has something to prove.' },

  /* ---- mystery & whodunnit (the Only Murders / Elsbeth lane) ---- */
  { title:'Knives Out', year:2019, cert:'PG-13', kid:true, overview:'A wildly wealthy novelist dies after his birthday party and a courtly private detective picks apart a houseful of suspects.' },
  { title:'Glass Onion: A Knives Out Mystery', year:2022, cert:'PG-13', kid:true, overview:'Benoit Blanc is invited to a tech billionaire’s island murder-mystery weekend, where the real murder is not on the schedule.' },
  { title:'Clue', year:1985, cert:'PG', kid:true, classic:true, overview:'Six strangers, one mansion, one blackmailer and several endings — the board game played entirely for laughs.' },
  { title:'Murder on the Orient Express', year:2017, cert:'PG-13', kid:true, overview:'Hercule Poirot is snowbound on a luxury train with thirteen suspects and one very stabbed passenger.' },
  { title:'See How They Run', year:2022, cert:'PG-13', kid:true, overview:'A weary inspector and an eager constable investigate a killing behind the scenes of a West End play.' },
  { title:'Scooby-Doo', year:2002, cert:'PG', kid:true, overview:'The gang reunites on Spooky Island, where the tourists are behaving very strangely indeed.' },

  /* ---- KPop, music & modern Disney the girls gravitate to ---- */
  { title:'KPop Demon Hunters', year:2025, cert:'PG', kid:true, overview:'A chart-topping K-pop girl group leads a secret double life hunting the demons that feed on their fans.' },
  { title:'Wish', year:2023, cert:'PG', kid:true, overview:'A girl and a mischievous star take on a king who has been hoarding his kingdom’s wishes.' },
  { title:'Frozen II', year:2019, cert:'PG', kid:true, overview:'Elsa follows a voice only she can hear into an enchanted forest to learn where her power came from.' },
  { title:'Moana 2', year:2024, cert:'PG', kid:true, overview:'Moana answers a call from her ancestors and sails far beyond familiar waters with a new crew.' },
  { title:'Descendants: The Rise of Red', year:2024, cert:'PG', kid:true, overview:'The Queen of Hearts’ daughter and Cinderella’s daughter travel back in time to stop a coup at Auradon Prep.' },
  { title:'Camp Rock', year:2008, cert:'PG', kid:true, overview:'A girl works in the camp kitchen to attend a music camp, and a teen star hears her sing without knowing who she is.' },
  { title:'Enchanted', year:2007, cert:'PG', kid:true, overview:'A cartoon princess is banished into live-action Manhattan and keeps singing anyway.' },
  { title:'Coraline', year:2009, cert:'PG', kid:true, overview:'A girl finds a door to a better version of her family — until they ask her to sew buttons over her eyes.' },

  /* ---- classics that still land with this age group ---- */
  { title:'E.T. the Extra-Terrestrial', year:1982, cert:'PG', classic:true, kid:true, overview:'A lonely boy hides a stranded alien in his home and helps him find a way back to his planet.' },
  { title:'Back to the Future', year:1985, cert:'PG', classic:true, kid:true, overview:'A teenager is sent thirty years into the past and has to make sure his parents still fall in love.' },
  { title:'The Princess Bride', year:1987, cert:'PG', classic:true, kid:true, overview:'A farm boy turned pirate storms a castle to rescue his true love, with fencing, giants and revenge along the way.' },
  { title:'The Wizard of Oz', year:1939, cert:'G', classic:true, overview:'A Kansas farm girl is swept by a tornado into a technicolor land and follows a yellow brick road home.' },
  { title:'Mary Poppins', year:1964, cert:'G', classic:true, overview:'A magical nanny arrives on the east wind to look after two neglected London children — and their father.' },
  { title:'The Sound of Music', year:1965, cert:'G', classic:true, overview:'A would-be nun becomes governess to seven children in Austria as the country slides toward war.' },
  { title:'Singin’ in the Rain', year:1952, cert:'G', classic:true, overview:'As Hollywood lurches from silent films to talkies, a matinee idol and his friends rescue a disastrous production.' },
  { title:'Home Alone', year:1990, cert:'PG', classic:true, kid:true, overview:'An eight-year-old left behind at Christmas defends the house against two determined burglars.' },
  { title:'Mrs. Doubtfire', year:1993, cert:'PG-13', classic:true, overview:'A divorced actor disguises himself as an elderly nanny to spend time with his own children.' },

  /* ---- worth discussing afterwards ---- */
  { title:'Wonder', year:2017, cert:'PG', talk:true, overview:'A boy with a facial difference starts fifth grade at a mainstream school and slowly changes everyone around him.' },
  { title:'Hidden Figures', year:2016, cert:'PG', talk:true, overview:'Three Black women mathematicians at NASA fight segregation while helping put an astronaut into orbit.' },
  { title:'Remember the Titans', year:2000, cert:'PG', talk:true, overview:'A newly integrated Virginia high school football team learns to play — and live — together in 1971.' },
  { title:'Queen of Katwe', year:2016, cert:'PG', talk:true, overview:'A girl selling maize in a Kampala slum discovers chess and plays her way toward a different life.' },
  { title:'McFarland, USA', year:2015, cert:'PG', talk:true, overview:'A coach in a farmworking California town builds a cross-country team out of kids who run before dawn to pick crops.' },
  { title:'October Sky', year:1999, cert:'PG', talk:true, overview:'A coal miner’s son in 1950s West Virginia builds rockets against his father’s wishes.' },
  { title:'Billy Elliot', year:2000, cert:'R', talk:true, overview:'During the 1984 miners’ strike, a boxing-class boy in a mining town discovers he would rather dance ballet — and must win over his grieving father.' },
  { title:'Dead Poets Society', year:1989, cert:'PG', talk:true, overview:'An unorthodox English teacher at a strict boys’ boarding school inspires his students to think for themselves.' },
  { title:'A Monster Calls', year:2016, cert:'PG-13', talk:true, overview:'A boy whose mother is dying is visited each night by a giant yew tree that tells him three stories.' },
  { title:'The Blind Side', year:2009, cert:'PG-13', talk:true, overview:'A well-off Memphis family takes in a homeless teenager who becomes an All-American football player.' },
  { title:'Selma', year:2014, cert:'PG-13', talk:true, overview:'Dr. Martin Luther King Jr. leads the 1965 voting-rights march from Selma to Montgomery.' },
  { title:'Life Is Beautiful', year:1997, cert:'PG-13', talk:true, overview:'An Italian Jewish father uses humour and invention to shield his young son from a concentration camp.' },
  { title:'Bend It Like Beckham', year:2002, cert:'PG-13', talk:true, overview:'A London teenager secretly joins a women’s football team against her traditional Punjabi family’s wishes.' },
  { title:'Whale Rider', year:2002, cert:'PG-13', talk:true, overview:'A Māori girl fights her grandfather’s tradition that only a firstborn boy can lead their people.' },
  { title:'12 Angry Men', year:1957, cert:'NR', talk:true, classic:true, overview:'One juror refuses to vote guilty, forcing eleven others to re-examine a murder case in a sweltering room.' },
  { title:'To Kill a Mockingbird', year:1962, cert:'NR', talk:true, classic:true, overview:'A small-town Alabama lawyer defends a Black man falsely accused, watched by his young daughter Scout.' }
];
var IDEA_CATS = [
  { id:'shortlist',label:'🔖 Our shortlist', local:true },
  { id:'curated',  label:'🍿 Crowd pleasers' },
  { id:'toprated', label:'⭐ Top rated', genres:'', cert:'PG-13', minVotes:4000 },
  { id:'talk',     label:'💬 Worth discussing' },
  { id:'classics', label:'🏛 Classics' },
  { id:'family',   label:'👨‍👩‍👧 Family', genres:'10751', cert:'PG' },
  { id:'animated', label:'🎨 Animated', genres:'16', cert:'PG' },
  { id:'adventure',label:'🗺 Adventure', genres:'12', cert:'PG-13' },
  { id:'funny',    label:'😂 Funny', genres:'35', cert:'PG-13' },
  { id:'fantasy',  label:'🐉 Fantasy & sci-fi', genres:'14,878', cert:'PG-13' },
  { id:'mystery',  label:'🔍 Mystery & whodunnit', genres:'9648,80', cert:'PG-13' },
  { id:'drama',    label:'🎭 Great drama', genres:'18', cert:'R' },
  { id:'ai',       label:'✨ For us', ai:true }
];
/* shelves shown in the Ideas tab: the fixed ones, plus one per family
   member who has filled in a taste profile */
function ideaShelves(){
  var out = IDEA_CATS.slice();
  var me = whoAmI();
  var personal = [];
  MEMBERS.forEach(function(m){
    if (!profileFilled(profileFor(m.id))) return;
    personal.push({ id:'ai_' + m.id, label:'✨ For ' + m.name, ai:true, member:m });
  });
  // whoever is holding this phone gets their shelf first
  personal.sort(function(a,b){
    if (me && a.member.id === me.id) return -1;
    if (me && b.member.id === me.id) return 1;
    return 0;
  });
  return out.concat(personal);
}
var ideas = { cat:'curated', items:null, loading:false, note:null, seed:1 };

function watchedTitleSet(){
  var set = {};
  nights().forEach(function(n){ set[normQuote(n.title)] = true; });
  liveRecords('seen').forEach(function(r){ set[normQuote(r.title)] = true; });
  return set;
}
function shortlisted(){
  return liveRecords('shortlist').sort(function(a,b){ return (b.updatedAt||0)-(a.updatedAt||0); });
}
function shortlistId(it){
  return 'short_' + normQuote(it.title).replace(/\s+/g,'_').slice(0, 60);
}
function isShortlisted(it){
  var r = data.records[shortlistId(it)];
  return !!(r && !r.deleted);
}
function toggleShortlist(it){
  var id = shortlistId(it);
  var existing = data.records[id];
  if (existing && !existing.deleted){
    data.records[id] = { id:id, type:'shortlist', deleted:true, updatedAt: Date.now() };
    saveData();
    return false;
  }
  data.records[id] = {
    id:id, type:'shortlist', title:it.title, year:it.year || null,
    tmdbId:it.tmdbId || null, posterPath:it.posterPath || null,
    overview:it.overview || '', cert:it.cert || null, score:it.score || null,
    updatedAt: Date.now()
  };
  // saving something is a deliberate "we want this", so it clears an older
  // "already watched" or "not interested" — a mis-tap or a wanted rewatch
  // shouldn't leave the movie stuck off the shelves
  var sid = seenId(it), pid = passId(it);
  if (data.records[sid] && !data.records[sid].deleted){
    data.records[sid] = { id:sid, type:'seen', deleted:true, updatedAt: Date.now() };
  }
  if (data.records[pid] && !data.records[pid].deleted){
    data.records[pid] = { id:pid, type:'pass', deleted:true, updatedAt: Date.now() };
  }
  saveData();
  return true;
}
function seenId(it){
  return 'seen_' + normQuote(it.title).replace(/\s+/g,'_').slice(0, 60);
}
function isSeen(it){
  var r = data.records[seenId(it)];
  return !!(r && !r.deleted);
}
function markSeen(it){
  var id = seenId(it);
  data.records[id] = {
    id:id, type:'seen', title:it.title, year:it.year || null, updatedAt: Date.now()
  };
  saveData();
}
/* marked by mistake, or we want another go at it */
function unmarkSeen(it){
  var id = seenId(it);
  if (!data.records[id]) return;
  data.records[id] = { id:id, type:'seen', deleted:true, updatedAt: Date.now() };
  saveData();
}
function seenTitles(){
  return liveRecords('seen').sort(function(a,b){ return (b.updatedAt||0)-(a.updatedAt||0); });
}
/* "not interested" — a real signal, not just a hide. Passed titles drop off
   every shelf and get handed to Claude as things not to suggest again. */
function passId(it){
  return 'pass_' + normQuote(it.title).replace(/\s+/g,'_').slice(0, 60);
}
function isPassed(it){
  var r = data.records[passId(it)];
  return !!(r && !r.deleted);
}
function markPassed(it){
  var me = whoAmI();
  data.records[passId(it)] = {
    id: passId(it), type:'pass', title: it.title, year: it.year || null,
    by: me ? me.id : null, updatedAt: Date.now()
  };
  // saying no to something you'd saved is a change of mind — clear it
  var sid = shortlistId(it);
  if (data.records[sid] && !data.records[sid].deleted){
    data.records[sid] = { id:sid, type:'shortlist', deleted:true, updatedAt: Date.now() };
  }
  saveData();
}
function unpass(rec){
  data.records[rec.id] = { id:rec.id, type:'pass', deleted:true, updatedAt: Date.now() };
  saveData();
}
/* what the family has already turned down — the strongest taste signal we
   have, because somebody looked at it and said no */
function passedPromptBlock(){
  var p = passedTitles();
  if (!p.length) return '';
  return '\n\nThe family looked at these and said "not interested" — do not '
    + 'suggest them again, and read them as a signal about what to avoid:\n'
    + p.slice(0, 15).map(function(r){
        return '- ' + r.title + (r.year ? ' (' + r.year + ')' : '');
      }).join('\n');
}
function passedTitles(){
  return liveRecords('pass').sort(function(a,b){ return (b.updatedAt||0)-(a.updatedAt||0); });
}
function notWatched(items){
  var seen = watchedTitleSet(), passed = {};
  passedTitles().forEach(function(r){ passed[normQuote(r.title)] = true; });
  return items.filter(function(it){
    var k = normQuote(it.title);
    return !seen[k] && !passed[k];
  });
}
function shuffleWithSeed(arr, seed){
  var a = arr.slice();
  var s = seed || 1;
  for (var i = a.length - 1; i > 0; i--){
    s = (s * 9301 + 49297) % 233280;
    var j = Math.floor((s / 233280) * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function tmdbDiscover(cat, page){
  var cred = loadTmdbCred();
  if (!cred) return Promise.reject(new Error('NO_KEY'));
  var url = 'https://api.themoviedb.org/3/discover/movie'
    + '?include_adult=false&language=en-US'
    + '&certification_country=US&certification.lte=' + encodeURIComponent(cat.cert || 'PG-13')
    + '&sort_by=vote_average.desc&vote_count.gte=' + (cat.minVotes || 900)
    + (cat.genres ? '&with_genres=' + encodeURIComponent(cat.genres) : '')
    + '&page=' + (page || 1);
  if (cat.before) url += '&primary_release_date.lte=' + cat.before;
  if (cat.since) url += '&primary_release_date.gte=' + cat.since;
  var headers = {};
  if (cred.type === 'v4') headers['Authorization'] = 'Bearer ' + cred.value;
  else url += '&api_key=' + encodeURIComponent(cred.value);
  return fetch(url, { headers: headers }).then(function(res){
    if (!res.ok) throw new Error('TMDB ' + res.status);
    return res.json();
  }).then(function(d){
    return (d.results || []).map(function(r){
      return {
        title: r.title,
        year: Number((r.release_date || '').slice(0,4)) || null,
        overview: r.overview || '',
        posterPath: r.poster_path || null,
        score: r.vote_average || null,
        tmdbId: r.id
      };
    });
  });
}
function aiIdeasFor(member){
  var prof = profileFor(member.id) || {};
  var list = nights();
  var history = list.slice(0, 14).map(function(n){
    var r = reactionFor(n.id, member.id);
    var mine = (r && r.stars) ? ' — ' + member.name + ' rated it ' + starText(r.stars) + '/5' : '';
    return '- ' + n.title + (n.year ? ' (' + n.year + ')' : '') + mine;
  }).join('\n');
  var taste = [];
  if (prof.genres && prof.genres.length) taste.push('Enjoys: ' + prof.genres.join(', '));
  if (prof.loves) taste.push('Already loves: ' + prof.loves);
  if (prof.avoids) taste.push('Not for them: ' + prof.avoids);
  if (prof.night) taste.push('A great movie night for them: ' + prof.night);
  if (prof.era) taste.push('Older films: ' + prof.era);
  var system = 'You recommend movies for a family movie night. The family: Chris and Kat (parents), '
    + 'Sedona (12) and River (9). Everything must genuinely work for a 9- and 12-year-old watching '
    + 'with their parents — engaging for kids that age, not just technically permitted. '
    + 'Follow each person\'s stated taste on older films; classics are welcome when they still hold a '
    + 'kid\'s attention. If they mention TV shows they love, use those as a taste signal and recommend '
    + 'films in the same spirit. Never recommend a film in the watched list.';
  var prompt = 'Recommend 6 movies chosen specifically for ' + member.name + ', but that the whole family can enjoy together.\n\n'
    + member.name + '’s taste:\n' + (taste.length ? taste.join('\n') : '(no profile yet — use their ratings below)')
    + '\n\nWhat the family has watched:\n' + (history || '(nothing yet)')
    + (shortlisted().length ? '\n\nOn the family shortlist already (do not repeat these):\n'
        + shortlisted().slice(0, 10).map(function(r){ return '- ' + r.title; }).join('\n') : '')
    + passedPromptBlock()
    + '\n\nRespond with ONLY valid JSON, no markdown fences:\n'
    + '{"picks":[{"title":"","year":2000,"why":"one warm sentence on why ' + member.name + ' specifically would love it","synopsis":"two spoiler-free sentences"}]}';
  return askClaude(prompt, { system: system, maxTokens: 1500 }).then(function(text){
    var t = text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
    var obj = JSON.parse(t);
    if (!obj || !obj.picks || !obj.picks.length) throw new Error('BAD_SHAPE');
    return obj.picks.slice(0, 8).map(function(p){
      return { title:p.title, year:p.year || null, overview:p.synopsis || '', why:p.why || '', posterPath:null, score:null };
    });
  });
}
function aiIdeas(){
  var list = nights();
  var history = list.slice(0, 14).map(function(n){
    var avg = familyAvg(n.id);
    return '- ' + n.title + (n.year ? ' (' + n.year + ')' : '') + (avg !== null ? ' — family rated ' + avg.toFixed(1) + '/5' : '');
  }).join('\n');
  var system = 'You recommend movies for a family movie night. The family: Chris and Kat (parents), '
    + 'Sedona (12) and River (9). Everything must genuinely work for a 9- and 12-year-old watching '
    + 'with their parents — engaging for kids that age, not merely permitted. Classics are welcome '
    + 'when they still hold a kid\'s attention. If the family mentions TV shows they love, use those '
    + 'as a taste signal and recommend films in the same spirit. '
    + 'Never recommend a movie that appears in their watched list.';
  var shortlistLine = shortlisted().length
    ? '\n\nAlready on their shortlist (they like the look of these — suggest things in a similar spirit, but do not repeat them):\n'
      + shortlisted().slice(0, 10).map(function(r){ return '- ' + r.title; }).join('\n')
    : '';
  var prompt = 'Movies this family has already watched together:\n'
    + (history || '(none yet)')
    + shortlistLine
    + passedPromptBlock()
    + '\n\nRecommend 6 movies they would love next. Respond with ONLY valid JSON, no markdown fences:\n'
    + '{"picks":[{"title":"","year":2000,"why":"one warm sentence on why THIS family","synopsis":"two spoiler-free sentences"}]}';
  return askClaude(prompt, { system: system, maxTokens: 1400 }).then(function(text){
    var t = text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
    var obj = JSON.parse(t);
    if (!obj || !obj.picks || !obj.picks.length) throw new Error('BAD_SHAPE');
    return obj.picks.slice(0, 8).map(function(p){
      return { title:p.title, year:p.year || null, overview:p.synopsis || '', why:p.why || '', posterPath:null, score:null };
    });
  });
}
/* fills in posters/synopses for AI or curated picks when a TMDB key exists */
function enrichFromTmdb(items){
  var cred = loadTmdbCred();
  if (!cred) return Promise.resolve(items);
  return Promise.all(items.map(function(it){
    return tmdbSearch(it.title).then(function(d){
      var hit = (d.results || [])[0];
      if (!hit) return it;
      it.posterPath = it.posterPath || hit.poster_path || null;
      it.score = it.score || hit.vote_average || null;
      it.tmdbId = it.tmdbId || hit.id;
      if (!it.overview) it.overview = hit.overview || '';
      if (!it.year) it.year = Number((hit.release_date || '').slice(0,4)) || null;
      return it;
    }).catch(function(){ return it; });
  }));
}
function loadIdeas(force){
  var cat = ideaShelves().filter(function(c){ return c.id === ideas.cat; })[0] || IDEA_CATS[0];
  ideas.loading = true;
  ideas.note = null;
  render();

  var job;
  if (cat.ai){
    var recId = 'airecs_' + (cat.member ? cat.member.id : 'family');
    var stored = data.records[recId];
    var cached = (stored && !stored.deleted && stored.picks) ? stored.picks : null;
    if (cached && cached.length && !force){
      job = enrichFromTmdb(cached);
    } else if (!Store.get('anthropic_key') && cached){
      job = enrichFromTmdb(cached);
    } else {
      job = (cat.member ? aiIdeasFor(cat.member) : aiIdeas()).then(function(picks){
        // stored as a synced record so the rest of the family sees these
        // without needing an Anthropic key of their own
        data.records[recId] = {
          id:recId, type:'airecs', member: cat.member ? cat.member.id : null,
          picks:picks, updatedAt: Date.now()
        };
        saveData();
        return enrichFromTmdb(picks);
      });
    }
  } else if (cat.id === 'shortlist'){
    var saved = shortlisted().map(function(r){
      return { title:r.title, year:r.year, tmdbId:r.tmdbId, posterPath:r.posterPath,
               overview:r.overview, cert:r.cert, score:r.score };
    });
    job = saved.length ? enrichFromTmdb(saved) : Promise.resolve([]);
  } else if (cat.id === 'curated'){
    job = enrichFromTmdb(shuffleWithSeed(CURATED.filter(function(c){ return c.kid; }), ideas.seed).slice(0, 12));
  } else if (cat.id === 'talk'){
    job = enrichFromTmdb(shuffleWithSeed(CURATED.filter(function(c){ return c.talk; }), ideas.seed).slice(0, 12));
  } else if (cat.id === 'classics'){
    job = enrichFromTmdb(shuffleWithSeed(CURATED.filter(function(c){ return c.classic; }), ideas.seed).slice(0, 12));
  } else {
    job = tmdbDiscover(cat, 1 + (ideas.seed % 3));
  }

  job.then(function(items){
    // keep the raw list — watched/passed filtering happens at render time, so
    // undoing a pass puts the movie straight back on the shelf
    ideas.items = items.slice(0, 30);
    ideas.loading = false;
    if (!notWatched(ideas.items).length){
      ideas.note = (cat.id === 'shortlist')
        ? 'Nothing saved yet — tap any movie idea and choose “Save to our shortlist” to keep it here for later.'
        : 'You’ve seen everything here! Try another shelf or shuffle.';
    }
    render();
  }).catch(function(e){
    ideas.loading = false;
    if (cat.ai && e && e.message === 'NO_KEY'){
      var relay = data.records['airecs_' + (cat.member ? cat.member.id : 'family')];
      if (relay && !relay.deleted && relay.picks && relay.picks.length){
        ideas.items = notWatched(relay.picks);
        ideas.note = 'Picked out on ' + (cat.member ? cat.member.name + '’s' : 'the family’s')
          + ' behalf and shared with everyone — no key needed on this phone.';
        render();
        return;
      }
      ideas.items = null;
      ideas.note = cat.member
        ? 'Add an Anthropic key in Settings and this shelf picks movies just for ' + cat.member.name + ', using their taste profile.'
        : 'Add an Anthropic key in Settings and this shelf recommends movies based on what your family has actually loved.';
    } else if (e && e.message === 'NO_KEY'){
      // no TMDB key: stay on the chosen shelf, show the built-in picks that
      // fit it, and say plainly what unlocks the rest
      var pool = CURATED;
      if (cat.id === 'animated') pool = CURATED.filter(function(c){ return !c.talk && !c.classic; });
      else if (cat.id === 'drama' || cat.id === 'oldies') pool = CURATED.filter(function(c){ return c.talk || c.classic; });
      ideas.items = notWatched(shuffleWithSeed(pool, ideas.seed).slice(0, 12));
      ideas.note = 'Showing our built-in picks. Add a free TMDB key in Settings for posters and thousands more movies.';
    } else {
      ideas.items = null;
      ideas.note = 'Couldn’t load ideas just now — check your connection and try again.';
    }
    render();
  });
}
function openIdeaDetail(it){
  openModal(function(box, close){
    box.appendChild(el('h3', null, it.title));
    box.appendChild(el('div','msub', (it.year ? it.year : 'Movie') + ' · Movie idea'));

    var hero = el('div','idea-hero');
    var poster = el('div','poster');
    if (it.posterPath){
      var img = document.createElement('img');
      img.alt = ''; img.src = TMDB_IMG + it.posterPath;
      poster.appendChild(img);
    } else {
      poster.appendChild(el('span','ph', it.title));
    }
    hero.appendChild(poster);
    var side = el('div','side');
    var facts = el('div','idea-facts');
    var watchWrap = el('div','watch-wrap');
    function paintIdeaFacts(f){
      while (facts.firstChild) facts.removeChild(facts.firstChild);
      while (watchWrap.firstChild) watchWrap.removeChild(watchWrap.firstChild);
      var wr = watchRow(f);
      if (wr) watchWrap.appendChild(wr);
      var cert = (f && f.cert) || it.cert;
      if (cert) facts.appendChild(el('span','idea-fact cert', cert));
      var rel = (f && f.released) || null;
      facts.appendChild(el('span','idea-fact', rel ? rel.slice(0,4) : (it.year ? String(it.year) : 'Movie')));
      if (f && f.runtime) facts.appendChild(el('span','idea-fact', Math.floor(f.runtime/60) + 'h ' + (f.runtime%60) + 'm'));
      if (f && f.imdb) facts.appendChild(imdbGuideChip(f, 'idea-fact'));
      if (f && f.rt) facts.appendChild(el('span','idea-fact rt','🍅 ' + f.rt));
      if (f && f.meta) facts.appendChild(el('span','idea-fact','Metacritic ' + f.meta));
      var ts = (f && f.tmdbScore) || it.score;
      if (ts && !(f && f.imdb)) facts.appendChild(el('span','idea-fact star','★ ' + Number(ts).toFixed(1) + ' TMDB'));
      facts.appendChild(el('span','idea-fact','Not yet watched'));
    }
    paintIdeaFacts(it.facts);
    if (!it.facts && loadTmdbCred()){
      buildFacts(it.tmdbId, it.title + (it.year ? ' ' + it.year : '')).then(function(f){
        it.facts = f;
        paintIdeaFacts(f);
      }).catch(function(){});
    }
    side.appendChild(facts);
    if (it.why) side.appendChild(el('div','idea-why', '“' + it.why + '”'));
    hero.appendChild(side);
    box.appendChild(hero);

    box.appendChild(watchWrap);

    box.appendChild(el('div','f-label','What it’s about'));
    box.appendChild(el('div','idea-syn', it.overview || 'No synopsis available for this one yet — but the title alone might be enough.'));

    var saveBtn = el('button','idea-refresh' + (isShortlisted(it) ? ' on' : ''),
      isShortlisted(it) ? '🔖 Saved to our shortlist — tap to remove' : '🔖 Save to our shortlist');
    saveBtn.addEventListener('click', function(){
      var added = toggleShortlist(it);
      saveBtn.textContent = added ? '🔖 Saved to our shortlist — tap to remove' : '🔖 Save to our shortlist';
      saveBtn.classList.toggle('on', added);
      toast(added ? 'Saved for later 🔖' : 'Removed from the shortlist');
    });
    box.appendChild(saveBtn);

    var seenBtn = el('button','idea-refresh' + (isSeen(it) ? ' on' : ''),
      isSeen(it) ? '✓ Marked as watched — tap to undo' : '✓ We’ve already seen this one');
    seenBtn.addEventListener('click', function(){
      if (isSeen(it)){
        unmarkSeen(it);
        seenBtn.textContent = '✓ We’ve already seen this one';
        seenBtn.classList.remove('on');
        render();
        toast('Not watched after all — back in the mix');
        return;
      }
      markSeen(it);
      close();
      render();
      toast('Marked as watched — we won’t suggest it again');
    });
    box.appendChild(seenBtn);

    var passBtn = el('button','idea-refresh pass','🚫 Not interested');
    passBtn.addEventListener('click', function(){
      markPassed(it);
      close();
      render();
      toast('Passed — and we’ll steer recommendations away from it');
    });
    box.appendChild(passBtn);

    var row = el('div','modal-buttons');
    var cancel = el('button','btn-secondary','Close');
    cancel.addEventListener('click', close);
    var pick = el('button','btn-primary','🍿 Make this our pick');
    pick.addEventListener('click', function(){
      var np = nextPicker();
      var id = 'night_' + Date.now() + '_' + Math.floor(Math.random()*1e6);
      data.records[id] = {
        id:id, type:'night', title:it.title, year:it.year || null,
        date: nextOpenFriday(), pickedBy: np.id,
        tmdbId: it.tmdbId || null, posterPath: it.posterPath || null,
        updatedAt: Date.now()
      };
      saveData();
      close();
      view = 'home';
      render();
      window.scrollTo(0, 0);
      toast(it.title + ' is on the calendar for ' + np.name + '’s pick 🍿');
    });
    row.appendChild(cancel); row.appendChild(pick);
    box.appendChild(row);
  });
}
function openAddToShortlist(){
  var sel = null;
  openModal(function(box, close){
    box.appendChild(el('h3', null, '🔖 Add to our shortlist'));
    box.appendChild(el('div','msub','Something you heard about and want to remember'));
    var cred = loadTmdbCred();
    var selWrap = el('div');
    function paintSel(){
      while (selWrap.firstChild) selWrap.removeChild(selWrap.firstChild);
      if (!sel) return;
      var card = el('div','m-results');
      var rowB = el('div','m-result');
      var mini = el('div','mini');
      if (sel.posterPath){
        var im = document.createElement('img');
        im.alt = ''; im.src = TMDB_IMG + sel.posterPath;
        mini.appendChild(im);
      }
      var tx = el('div');
      tx.appendChild(el('div','t', sel.title));
      tx.appendChild(el('div','y', sel.year ? String(sel.year) : ''));
      rowB.appendChild(mini); rowB.appendChild(tx);
      card.appendChild(rowB);
      selWrap.appendChild(el('div','f-label','Selected'));
      selWrap.appendChild(card);
    }
    if (cred){
      box.appendChild(el('div','f-label','Search'));
      var sInput = el('input','f-input');
      sInput.type = 'search'; sInput.placeholder = 'Search movies (TMDB)…'; sInput.autocomplete = 'off';
      box.appendChild(sInput);
      var resBox = el('div');
      box.appendChild(resBox);
      var timer = null;
      sInput.addEventListener('input', function(){
        clearTimeout(timer);
        var q = sInput.value.trim();
        if (q.length < 2){ while (resBox.firstChild) resBox.removeChild(resBox.firstChild); return; }
        timer = setTimeout(function(){
          tmdbSearch(q).then(function(d){
            while (resBox.firstChild) resBox.removeChild(resBox.firstChild);
            var wrap = el('div','m-results');
            (d.results || []).slice(0,5).forEach(function(r){
              var b = el('button','m-result');
              b.type = 'button';
              var mini = el('div','mini');
              if (r.poster_path){
                var im = document.createElement('img');
                im.alt = ''; im.loading = 'lazy'; im.src = 'https://image.tmdb.org/t/p/w92' + r.poster_path;
                mini.appendChild(im);
              }
              var tx = el('div');
              tx.appendChild(el('div','t', r.title));
              tx.appendChild(el('div','y', (r.release_date||'').slice(0,4)));
              b.appendChild(mini); b.appendChild(tx);
              b.addEventListener('click', function(){
                sel = { title:r.title, year:Number((r.release_date||'').slice(0,4)) || null,
                        tmdbId:r.id, posterPath:r.poster_path || null, overview:r.overview || '' };
                while (resBox.firstChild) resBox.removeChild(resBox.firstChild);
                sInput.value = '';
                paintSel();
              });
              wrap.appendChild(b);
            });
            resBox.appendChild(wrap);
          }).catch(function(){ toast('Search failed — type the title instead'); });
        }, 350);
      });
    }
    box.appendChild(el('div','f-label', cred ? 'Or type the title' : 'Movie title'));
    var tInput = el('input','f-input');
    tInput.type = 'text'; tInput.placeholder = 'e.g. Knives Out';
    box.appendChild(tInput);
    box.appendChild(el('div','f-label','Year (optional)'));
    var yInput = el('input','f-input');
    yInput.type = 'number'; yInput.inputMode = 'numeric';
    box.appendChild(yInput);
    box.appendChild(selWrap);

    var row = el('div','modal-buttons');
    var cancel = el('button','btn-secondary','Cancel');
    cancel.addEventListener('click', close);
    var save = el('button','btn-primary','Save to shortlist');
    save.addEventListener('click', function(){
      var item = sel || { title: tInput.value.trim(), year: Number(yInput.value) || null };
      if (!item.title){ toast('Give it a title first'); return; }
      toggleShortlist(item);
      close();
      ideas.cat = 'shortlist';
      ideas.items = null;
      loadIdeas(true);
      toast('Saved to the shortlist 🔖');
    });
    row.appendChild(cancel); row.appendChild(save);
    box.appendChild(row);
  });
}
function renderIdeas(app){
  app.appendChild(el('div','section-label','Movie Ideas'));
  var np = nextPicker();
  var sub = el('div','section-sub', 'Up next: ' + np.name + '’s pick 💡');
  app.appendChild(sub);

  var chips = el('div','idea-chips');
  ideaShelves().forEach(function(c){
    var b = el('button','idea-chip' + (ideas.cat === c.id ? ' on' : ''), c.label);
    b.type = 'button';
    b.addEventListener('click', function(){
      ideas.cat = c.id;
      ideas.items = null;
      loadIdeas(false);
    });
    chips.appendChild(b);
  });
  app.appendChild(chips);

  if (ideas.loading){
    var ld = el('div','idea-loading');
    var reel = el('div','reel','🎞️');
    reel.setAttribute('aria-hidden','true');
    ld.appendChild(reel);
    ld.appendChild(el('div','msg','Finding something good…'));
    app.appendChild(ld);
    return;
  }

  if (ideas.items === null && !ideas.note){
    // first visit to the tab
    loadIdeas(false);
    return;
  }

  // re-filter on every render, not just on load, so a title logged from
  // this tab disappears the moment you come back to it
  // the shortlist is an explicit keep-list: a movie you deliberately saved
  // stays visible even if it's been watched, so rewatches survive
  var visible = (ideas.cat === 'shortlist') ? (ideas.items || []) : notWatched(ideas.items || []);
  if (visible.length){
    var grid = el('div','idea-grid');
    visible.forEach(function(it){
      var card = el('button','idea-card');
      card.type = 'button';
      var post = el('div','idea-poster');
      if (it.posterPath){
        var img = document.createElement('img');
        img.alt = ''; img.loading = 'lazy'; img.src = TMDB_IMG + it.posterPath;
        post.appendChild(img);
      } else {
        post.appendChild(el('span','ph', it.title));
      }
      if (it.score) post.appendChild(el('span','idea-score', '★ ' + Number(it.score).toFixed(1)));
      card.appendChild(post);
      var meta = el('div','idea-meta');
      meta.appendChild(el('div','t', it.title));
      meta.appendChild(el('div','y', it.year ? String(it.year) : 'Tap for the story'));
      card.appendChild(meta);
      card.addEventListener('click', function(){ openIdeaDetail(it); });
      grid.appendChild(card);
    });
    app.appendChild(grid);
  }

  if (ideas.items && ideas.items.length && !visible.length && !ideas.note){
    ideas.note = 'You’ve seen every one of these! Shuffle for more.';
  }
  if (ideas.note) app.appendChild(el('div','idea-note', ideas.note));

  if (ideas.cat === 'shortlist'){
    var addBtn = el('button','idea-refresh','＋ Add a movie by name');
    addBtn.addEventListener('click', openAddToShortlist);
    app.appendChild(addBtn);
  }

  var refresh = el('button','idea-refresh','🔀 Show me different ones');
  refresh.addEventListener('click', function(){
    ideas.seed = (ideas.seed + 7) % 997;
    loadIdeas(true);
  });
  if (ideas.cat !== 'shortlist') app.appendChild(refresh);

  var foot = el('footer');
  foot.appendChild(el('div', null, 'Tap any poster for the story · already-watched titles are hidden'));
  app.appendChild(foot);
}
