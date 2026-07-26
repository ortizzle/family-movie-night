/* Family Movie Night — fmn/games.js
   The trivia question banks and the game engines.

   These files load in a fixed order from index.html and share one global
   scope, exactly as the single inline script did. Order matters: boot.js
   runs the startup calls and must stay last. */

/* ---------- TRIVIA ---------- */
var TRIVIA_CATS = [
  { id:'pixar',    label:'🧸 Pixar' },
  { id:'disney',   label:'🏰 Disney' },
  { id:'classic',  label:'📽 Classic family' },
  { id:'animation',label:'🎨 Animation' },
  { id:'adventure',label:'🚀 Sci-fi & adventure' }
];
var TRIVIA = [
  /* ---- Pixar ---- */
  { cat:'pixar', q:'Who says "To infinity… and beyond!"?', opts:['Woody','Buzz Lightyear','Mr. Potato Head','Rex'], a:1, note:'Buzz Lightyear, Space Ranger, Toy Story.' },
  { cat:'pixar', q:'Finish the quote: "Just keep ___" — Dory, Finding Nemo.', opts:['Floating','Paddling','Swimming','Smiling'], a:2, note:'"Just keep swimming, just keep swimming…"' },
  { cat:'pixar', q:'What is Edna Mode’s famous rule in The Incredibles?', opts:['No sidekicks','No capes','No masks','No gadgets'], a:1, note:'"NO CAPES!"' },
  { cat:'pixar', q:'What job does Woody hold in Andy’s room?', opts:['Space Ranger','Sheriff','Mayor','Doctor'], a:1, note:'There’s a snake in my boot! Sheriff Woody.' },
  { cat:'pixar', q:'In Up, what is the name of the talking dog?', opts:['Rocky','Dug','Buster','Alpha'], a:1, note:'"I have just met you, and I love you." — Dug' },
  { cat:'pixar', q:'In Coco, Miguel dreams of playing which instrument?', opts:['Trumpet','Drums','Piano','Guitar'], a:3, note:'Just like his idol, Ernesto de la Cruz.' },
  { cat:'pixar', q:'In Ratatouille, Remy is what kind of animal?', opts:['Mouse','Possum','Rat','Ferret'], a:2, note:'Anyone can cook — even a rat in Paris.' },
  { cat:'pixar', q:'What is the name of Nemo’s worried dad?', opts:['Gill','Bruce','Crush','Marlin'], a:3, note:'He crossed the whole ocean with Dory.' },
  { cat:'pixar', q:'In WALL·E, what is the name of the sleek probe robot?', opts:['EVE','IRIS','NOVA','ADA'], a:0, note:'EVE — Extraterrestrial Vegetation Evaluator.' },
  { cat:'pixar', q:'In Monsters, Inc., what powers the city of Monstropolis at the start?', opts:['Children’s laughter','Children’s screams','Sunlight','Dreams'], a:1, note:'Until they discover laughter is ten times more powerful.' },
  { cat:'pixar', q:'In Inside Out, which emotion narrates most of the film?', opts:['Sadness','Fear','Joy','Anger'], a:2, note:'Joy runs headquarters — until she and Sadness get lost.' },
  { cat:'pixar', q:'In Toy Story, who is the neighbour who breaks toys?', opts:['Sid','Al','Randy','Zurg'], a:0, note:'Sid Phillips, and his toys eventually get their revenge.' },

  /* ---- Disney ---- */
  { cat:'disney', q:'What is the name of Simba’s father in The Lion King?', opts:['Scar','Rafiki','Zazu','Mufasa'], a:3, note:'Mufasa, king of the Pride Lands.' },
  { cat:'disney', q:'"Ohana means family. Family means…"', opts:['Nobody gets left behind','Everyone eats together','We stick like glue','Always saying aloha'], a:0, note:'"…nobody gets left behind or forgotten." — Lilo & Stitch' },
  { cat:'disney', q:'What can Elsa create with her powers in Frozen?', opts:['Fire','Plants','Ice and snow','Wind'], a:2, note:'The cold never bothered her anyway.' },
  { cat:'disney', q:'What is the name of Moana’s very confused chicken?', opts:['Pua','Tamatoa','Heihei','Maui'], a:2, note:'Sometimes the chicken lives inside the boat.' },
  { cat:'disney', q:'Finish the Encanto song: "We don’t talk about ___"', opts:['Mirabel','Bruno','Abuela','Casita'], a:1, note:'No, no, no!' },
  { cat:'disney', q:'In Aladdin, what is the Genie’s first rule about wishes?', opts:['No wishing for more wishes','No wishing for money','No wishing for flight','No wishing for food'], a:0, note:'Also: he can’t kill anyone, make anyone fall in love, or raise the dead.' },
  { cat:'disney', q:'In The Little Mermaid, what does Ariel trade for legs?', opts:['Her hair','Her voice','Her necklace','Her memories'], a:1, note:'Ursula takes her voice as payment.' },
  { cat:'disney', q:'In Mary Poppins, what word do the children learn that is "something to say when you have nothing to say"?', opts:['Bibbidi-Bobbidi-Boo','Abracadabra','Supercalifragilisticexpialidocious','Hakuna Matata'], a:2, note:'Even though the sound of it is something quite atrocious.' },
  { cat:'disney', q:'In Beauty and the Beast, what is the enchanted clock called?', opts:['Lumière','Cogsworth','Chip','Mrs. Potts'], a:1, note:'Lumière is the candelabra; Cogsworth is the clock.' },

  /* ---- Classic family ---- */
  { cat:'classic', q:'In The Wizard of Oz, Dorothy repeats: "There’s no place like ___"', opts:['Oz','Kansas','Home','The farm'], a:2, note:'Click your heels three times.' },
  { cat:'classic', q:'E.T. wants to do what?', opts:['Phone home','Ride bikes forever','Eat candy','Learn English'], a:0, note:'"E.T. phone home."' },
  { cat:'classic', q:'Willy Wonka’s famous factory makes what?', opts:['Toys','Fireworks','Chocolate','Bubblegum only'], a:2, note:'Golden tickets got you inside the chocolate factory.' },
  { cat:'classic', q:'"My name is Inigo Montoya. You killed my ___. Prepare to die."', opts:['Brother','Father','Teacher','King'], a:1, note:'The most quoted line in The Princess Bride.' },
  { cat:'classic', q:'In The Princess Bride, what does Westley really mean when he says "As you wish"?', opts:['Goodbye','I love you','Yes, boss','Leave me alone'], a:1, note:'That day, Buttercup was amazed to discover it.' },
  { cat:'classic', q:'In Home Alone, what is the name of the boy left behind?', opts:['Kevin','Buzz','Fuller','Marv'], a:0, note:'Kevin McCallister, defender of 671 Lincoln Avenue.' },
  { cat:'classic', q:'In Back to the Future, what speed must the DeLorean reach to time travel?', opts:['77 mph','88 mph','99 mph','101 mph'], a:1, note:'88 miles per hour — and 1.21 gigawatts.' },
  { cat:'classic', q:'In Mrs. Doubtfire, what job does the disguised father take?', opts:['Teacher','Nanny','Chef','Driver'], a:1, note:'A housekeeper and nanny for his own children.' },
  { cat:'classic', q:'In Singin’ in the Rain, Hollywood is switching from silent films to what?', opts:['Colour films','Talkies','Widescreen','Musicals'], a:1, note:'The arrival of sound throws the studio into chaos.' },

  /* ---- Animation (non-Disney/Pixar) ---- */
  { cat:'animation', q:'What animal is Spider-Ham in Into the Spider-Verse?', opts:['A hamster','A pig','A raccoon','A capybara'], a:1, note:'Peter Porker, the Spectacular Spider-Ham.' },
  { cat:'animation', q:'Shrek is what kind of creature?', opts:['Troll','Ogre','Giant','Goblin'], a:1, note:'Ogres are like onions — they have layers.' },
  { cat:'animation', q:'What does the Iron Giant love to eat?', opts:['Rocks','Metal','Trees','Cars only'], a:1, note:'A giant robot with a giant appetite for metal.' },
  { cat:'animation', q:'In Spirited Away, what happens to Chihiro’s parents?', opts:['They vanish','They turn into pigs','They fall asleep','They shrink'], a:1, note:'They eat food meant for the spirits and are turned into pigs.' },
  { cat:'animation', q:'In My Neighbor Totoro, what arrives to carry the girls?', opts:['A dragon','A giant bird','The Catbus','A flying boat'], a:2, note:'The grinning, twelve-legged Catbus.' },
  { cat:'animation', q:'In How to Train Your Dragon, what is Hiccup’s dragon called?', opts:['Stormfly','Toothless','Meatlug','Hookfang'], a:1, note:'A Night Fury named Toothless.' },
  { cat:'animation', q:'In Kung Fu Panda, what is Po’s job before becoming the Dragon Warrior?', opts:['Farmer','Noodle shop worker','Blacksmith','Gardener'], a:1, note:'He works in his father’s noodle shop.' },
  { cat:'animation', q:'In Zootopia, what animal is Officer Judy Hopps?', opts:['Fox','Rabbit','Sloth','Otter'], a:1, note:'The first rabbit on the Zootopia police force.' },

  /* ---- Sci-fi & adventure ---- */
  { cat:'adventure', q:'"May the ___ be with you."', opts:['Speed','Luck','Force','Wind'], a:2, note:'Star Wars. Always.' },
  { cat:'adventure', q:'In Harry Potter, which platform does the Hogwarts Express leave from?', opts:['Platform 9¾','Platform 13','Platform 7½','Platform 12'], a:0, note:'Run straight at the wall between platforms 9 and 10.' },
  { cat:'adventure', q:'In Jumanji: Welcome to the Jungle, what is Professor Oberon’s fatal weakness?', opts:['Water','Heights','Mosquitoes','Cake'], a:3, note:'Weaknesses: CAKE. (A very important Ortiz movie night.)' },
  { cat:'adventure', q:'In Raiders of the Lost Ark, what is Indiana Jones searching for?', opts:['The Holy Grail','The Ark of the Covenant','Sankara Stones','Atlantis'], a:1, note:'And he is famously afraid of snakes.' },
  { cat:'adventure', q:'In Jurassic Park, what is used to fill gaps in the dinosaur DNA?', opts:['Bird DNA','Frog DNA','Lizard DNA','Crocodile DNA'], a:1, note:'Which is exactly how the dinosaurs start changing sex. Life finds a way.' },
  { cat:'adventure', q:'In The Lord of the Rings, who carries the One Ring to Mordor?', opts:['Sam','Aragorn','Frodo','Merry'], a:2, note:'Frodo Baggins — with Sam carrying him at the end.' },
  { cat:'adventure', q:'In The Goonies, what are the kids searching for?', opts:['A lost city','One-Eyed Willy’s treasure','A meteorite','A missing dog'], a:1, note:'Goonies never say die.' },
  { cat:'adventure', q:'In Night at the Museum, what happens to the exhibits after dark?', opts:['They disappear','They come alive','They talk only','They shrink'], a:1, note:'Thanks to the tablet of Ahkmenrah.' }
];
/* famous lines -> which film are they from */
var WHO_SAID = [
  { q:'"To infinity… and beyond!"', opts:['Toy Story','WALL·E','The Incredibles','Big Hero 6'], a:0 },
  { q:'"There’s no place like home."', opts:['Mary Poppins','The Wizard of Oz','Peter Pan','Annie'], a:1 },
  { q:'"Hakuna Matata."', opts:['Moana','Zootopia','The Lion King','Tarzan'], a:2 },
  { q:'"E.T. phone home."', opts:['E.T. the Extra-Terrestrial','Close Encounters','Flight of the Navigator','Explorers'], a:0 },
  { q:'"Just keep swimming."', opts:['The Little Mermaid','Moana','Finding Nemo','Luca'], a:2 },
  { q:'"Why so serious?"', opts:['Spider-Man','The Dark Knight','Iron Man','Batman Begins'], a:1 },
  { q:'"I am Groot."', opts:['Avengers','Guardians of the Galaxy','Ant-Man','Black Panther'], a:1 },
  { q:'"Ogres are like onions."', opts:['Shrek','Trolls','Hotel Transylvania','Monsters, Inc.'], a:0 },
  { q:'"My name is Inigo Montoya."', opts:['Robin Hood','The Princess Bride','Stardust','The Three Musketeers'], a:1 },
  { q:'"Adventure is out there!"', opts:['Up','Onward','Brave','Encanto'], a:0 },
  { q:'"Ohana means family."', opts:['Moana','Lilo & Stitch','Coco','Encanto'], a:1 },
  { q:'"NO CAPES!"', opts:['Megamind','The Incredibles','Sky High','Despicable Me'], a:1 },
  { q:'"Roads? Where we’re going we don’t need roads."', opts:['Back to the Future','Cars','Speed Racer','Herbie'], a:0 },
  { q:'"You’re a wizard, Harry."', opts:['The Hobbit','Harry Potter and the Sorcerer’s Stone','Percy Jackson','Narnia'], a:1 },
  { q:'"Life is like a box of chocolates."', opts:['Big','Forrest Gump','Rain Man','The Terminal'], a:1 },
  { q:'"Anyone can cook."', opts:['Chef','Ratatouille','Julie & Julia','Burnt'], a:1 },
  { q:'"I’ll be back."', opts:['Rocky','The Terminator','Die Hard','Predator'], a:1 },
  { q:'"We’re gonna need a bigger boat."', opts:['Titanic','Jaws','The Perfect Storm','Master and Commander'], a:1 }
];
function shuffledOrder(n){
  var arr = [];
  for (var i=0;i<n;i++) arr.push(i);
  for (var j=arr.length-1;j>0;j--){
    var k = Math.floor(Math.random()*(j+1));
    var tmp = arr[j]; arr[j] = arr[k]; arr[k] = tmp;
  }
  return arr;
}
