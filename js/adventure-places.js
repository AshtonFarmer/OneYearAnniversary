// Coordinates describe playable layouts inspired by the supplied memories,
// not surveyed floor plans. Props and collisions share this single definition.
(function(){
 'use strict';
 const prop=(kind,x,y,w,h,extra={})=>({kind,x,y,w,h,...extra});
 const node=(id,name,x,y,action,extra={})=>({id,name,x,y,action,r:85,...extra});
 const exit=(to='home')=>node('exit','Leave this place',768,932,'travel',{to});
 const places={
  apartment:{title:'Our Welcome-home Apartment',chapter:'HOME · ALL THE LITTLE THINGS',theme:'home',spawn:[768,880],memory:'homecoming',
   subtitle:'Our black sofa, gold welcome-home decorations, roses, and dinner together.',
   floors:[['wood',145,175,1245,730]],
   props:[prop('counter',215,260,335,85),prop('sofa',640,355,285,90),prop('table',620,610,280,86),prop('flowers',380,485,45,42,{hideWhen:'apartment-roses'}),prop('gift',1110,382,75,60),prop('shelf',1120,610,115,130),prop('rug',590,460,370,100,{solid:false}),prop('lamp',1025,320,32,32)],
   nodes:[exit(),node('roses','Arrange the welcome-home roses',400,550,'collect',{item:'roses',once:true}),node('banner','Straighten the gold welcome-home banner',760,260,'task',{flag:'home-banner'}),node('vase','Set the roses by our laptop',438,430,'task',{flag:'home-flowers',needs:'roses'}),node('dinner','Set out our welcome-home dinner',750,735,'task',{flag:'home-dinner'}),node('reunion','Welcome her home',760,520,'scene',{scene:'reunion',needsFlags:['home-banner','home-flowers','home-dinner'],memory:'homecoming',item:'home-photo'}),node('ring','Open the Puja gift together',1085,490,'scene',{scene:'ring',memory:'ring',item:'puja-ring'}),node('carve','Carve our pumpkins',1110,780,'activity',{activity:'carving',needs:'pumpkin',needsAmount:2,memory:'carving'}),node('closet','Tanima’s Atelier',440,800,'link',{href:'outfit-studio.html'})]
  },
  observatory:{title:'Our Birmingham Night Sky',chapter:'THE OVERLOOK · LOOK UP TOGETHER',theme:'night',spawn:[768,895],memory:'sky',
   subtitle:'Choose a sky at the telescope, then settle onto our blanket.',
   floors:[['stone',180,280,1180,610],['grass',350,530,830,260]],
   props:[prop('telescope',1060,380,65,65),prop('blanket',620,585,250,145,{solid:false}),prop('bench',310,450,200,45),prop('tree',180,350,70,60),prop('tree',1325,350,70,60),prop('lamp',355,740,32,30),prop('lamp',1180,740,32,30)],
   nodes:[exit(),node('telescope','Choose a sky to watch',1080,500,'sky'),node('blanket','Watch this sky together',740,720,'scene',{scene:'sky',memory:'sky'}),node('chart','Keep a star chart',400,565,'collect',{item:'star-chart',once:true}),node('park','Walk down to Railroad Park',1240,845,'travel',{to:'park'})]
  },
  park:{title:'Railroad Park Foundation · After Dark',chapter:'BIRMINGHAM · A DATE WITH NO HURRY',theme:'park',spawn:[730,870],memory:'park',
   subtitle:'Follow the lamplights, stop by the water, and find our bench.',
   floors:[['path',220,720,1090,150],['path',610,270,160,520],['path',620,510,650,120],['water',990,230,340,230]],
   props:[prop('bench',960,650,220,42),prop('bench',250,410,185,42),...[225,470,825,1250].map((x,i)=>prop('lamp',x,750-i%2*180,30,30)),...[160,375,950,1350,180,1340].map((x,i)=>prop('tree',x,310+i%3*110,78,60)),prop('flowers',485,610,55,45)],
   nodes:[exit(),node('light1','Follow the first lamplight',300,795,'task',{flag:'park-light-1'}),node('light2','Walk a little farther',680,655,'task',{flag:'park-light-2'}),node('water','Pause by the water',1050,530,'scene',{scene:'water',flag:'park-water'}),node('bench','Sit together on our bench',1070,745,'scene',{scene:'bench',memory:'park',item:'park-photo'}),node('sky','Climb to the sky overlook',690,340,'travel',{to:'observatory'})]
  },
  stadium:{title:'Regions Field',chapter:'BIRMINGHAM · HER FIRST BASEBALL GAME',theme:'stadium',spawn:[768,895],memory:'baseball',
   subtitle:'Concessions, our seats, the ballgame—and the fireworks afterward.',
   floors:[['stone',140,710,1250,200],['field',440,200,930,485]],
   props:[prop('stall',190,545,180,95,{label:'CONCESSIONS'}),prop('stall',190,300,180,95,{label:'SOUVENIRS'}),...Array.from({length:4},(_,i)=>prop('bench',530+i*190,750,160,35)),prop('scoreboard',600,155,400,80),prop('lamp',425,265,32,30),prop('lamp',1380,265,32,30)],
   nodes:[exit(),node('ticket','Keep our first-game tickets',780,835,'collect',{item:'baseball-ticket',once:true}),node('snacks','Get something from concessions',280,680,'shop',{shop:'concessions'}),node('merch','Browse the souvenir stand',280,435,'shop',{shop:'baseball'}),node('game','Find our seats and cheer for a hit',840,690,'scene',{scene:'baseball',flag:'baseball-game'}),node('fireworks','Stay for the fireworks',1100,835,'scene',{scene:'fireworks',needsFlags:['baseball-game'],memory:'baseball',item:'fireworks-photo'})]
  },
  pool:{title:'Alight Pool Courtyard',chapter:'BIRMINGHAM · HER FIRST SWIM',theme:'pool',spawn:[300,835],memory:'swimming',
   subtitle:'Swim to the golden ripples together to try the pool carry.',
   floors:[['stone',150,190,1250,710],['pool',485,300,690,420]],water:[485,300,690,420],
   props:[...Array.from({length:4},(_,i)=>prop('lounger',280+i*260,225,90,55)),prop('umbrella',1300,500,40,40),prop('stall',170,445,155,85,{label:'POOL DAY'}),prop('table',1255,680,90,70)],
   nodes:[exit(),node('swim','Go down the pool ladder together',430,735,'swim'),node('carry','Carry Tanima',750,650,'carry',{r:74}),node('rest','Rest by the loungers',350,310,'scene',{scene:'pool-rest',dry:true,memory:'swimming',item:'swim-ribbon',needsFlags:['pool-crossed']}),node('float','Pool-day supplies',245,610,'shop',{shop:'pool'}),node('exit-water','Climb out of the pool',540,760,'dry')]
  },
  golf:{title:'Our Topgolf Bay',chapter:'BIRMINGHAM · ONE MORE SHOT',theme:'golf',spawn:[768,895],memory:'topgolf',
   subtitle:'Take turns in the bay, aim down the range, and keep your scorecard.',
   floors:[['range',150,165,1240,455],['stone',150,640,1240,260]],
   props:[prop('table',265,730,170,65),prop('sofa',265,620,170,60),prop('mat',640,665,250,140,{solid:false}),prop('stall',1150,730,150,75,{label:'DRINKS & BITES'})],
   nodes:[exit(),node('play','Aim a five-ball round',768,775,'golf'),node('watch','Celebrate a shot together',1000,745,'scene',{scene:'cheer',flag:'golf-cheer'}),node('snacks','Share a bite between turns',1225,855,'shop',{shop:'golf'})]
  },
  jeep:{title:'Our Jeep Invasion Trip',chapter:'THE MOUNTAINS · THE WHOLE ADVENTURE',theme:'jeep',spawn:[230,870],memory:'jeep',
   subtitle:'Steer Charizard through the mountain road checkpoints, then visit the overlook.',
   floors:[['road',150,720,1240,180],['stone',250,275,1040,370],['path',650,180,150,600]],
   props:[...Array.from({length:8},(_,i)=>prop('jeep',330+i%4*250,335+Math.floor(i/4)*220,125,62,{color:['#b96440','#617c84','#8b9568','#d1c49d'][i%4]})),prop('stall',170,150,190,85,{label:'JEEP INVASION'}),prop('stall',1150,150,190,85,{label:'DUCK & GEAR'}),prop('tree',1320,690,70,60)],
   nodes:[exit('mountains'),node('road','Take Charizard for a mountain drive',550,830,'scene',{scene:'drive',flag:'jeep-road'}),node('gathering','Explore the Jeep gathering',750,465,'scene',{scene:'jeep-show',flag:'jeep-gathering'}),node('duck1','Find a duck by the Jeeps',470,450,'duck',{number:1}),node('duck2','Find a duck by the event stand',270,290,'duck',{number:2}),node('duck3','Find a duck near the overlook',1270,700,'duck',{number:3}),node('gear','Browse Jeep-day souvenirs',1250,280,'shop',{shop:'jeep'}),node('overlook','Pause at the mountain overlook',950,190,'scene',{scene:'overlook',flag:'jeep-overlook',needsFlags:['jeep-road','jeep-gathering'],memory:'jeep',item:'jeep-badge'}),node('astra','Head to Astra Lumina',750,190,'travel',{to:'astra'})]
  },
  astra:{title:'Astra Lumina · The Full Trail',chapter:'ANAKEESTA · A NIGHT AMONGST THE STARS',theme:'astra',spawn:[240,900],memory:'astra',
   subtitle:'Ten installations. Walk the lantern path and bring the stars back to life.',
   floors:[['path',180,800,1180,120],['path',1250,240,110,620],['path',180,530,1180,120],['path',180,280,110,580],['path',180,260,1180,110]],
   props:[...Array.from({length:16},(_,i)=>prop('tree',80+i%8*192,165+Math.floor(i/8)*550,75,60)),prop('arch',215,815,85,55,{solid:false}),prop('arch',1210,200,100,55,{solid:false})],
   nodes:[node('exit','Back to Jeep Invasion',220,955,'travel',{to:'jeep'}),...['Astra Archway','Falling Stars','Cosmic Choir','Stardust Rays','Nebular Waves','Stellar Visions','Celestial Trail','Astral Genesis','Rise of the Stars','Starlit Photobooth'].map((name,i)=>{const xy=[[350,850],[750,850],[1190,850],[1300,600],[1040,580],[660,580],[245,580],[245,315],[740,315],[1250,315]][i];return node('station'+i,name,...xy,'astra',{station:i,flag:'astra-'+i,needsFlags:i?['astra-'+(i-1)]:[],memory:i===9?'astra':null,item:i===9?'astra-photo':null});})]
  },
  concert:{title:'Usha Uthup · Our Atlanta Concert',chapter:'ATLANTA · THE LIGHTS GO DOWN',theme:'concert',spawn:[768,890],memory:'concert',
   subtitle:'Find our seats for Usha Uthup’s “Skyfall,” then clap or sway together.',
   floors:[['carpet',170,180,1190,720]],
   props:[prop('stage',420,195,740,170),...Array.from({length:12},(_,i)=>prop('seat',350+i%4*225,475+Math.floor(i/4)*115,145,42)),prop('stall',170,335,135,95,{label:'PROGRAMS'}),prop('stall',1240,620,120,90,{label:'REFRESHMENTS'})],
   nodes:[exit('festival'),node('program','Pick up a concert program',240,500,'collect',{item:'concert-program',once:true}),node('seat','Watch Usha Uthup sing “Skyfall”',875,570,'scene',{scene:'concert',memory:'concert',item:'concert-ticket'}),node('applause','Join the applause',750,790,'scene',{scene:'applause',flag:'concert-applause'}),node('snacks','Visit the refreshment stand',1300,815,'shop',{shop:'concert'})]
  },
  puja:{title:'Durga Puja in Atlanta',chapter:'ATLANTA · A CELEBRATION TOGETHER',theme:'puja',spawn:[768,890],memory:'puja',
   subtitle:'Marigolds, alpona, glowing diyas, and time together at the pandal.',
   floors:[['stone',200,250,1140,650],['rug',530,360,480,410]],
   props:[prop('pandal',510,160,520,180),prop('stall',205,365,170,90,{label:'FLOWERS'}),prop('stall',1160,430,160,90,{label:'SWEETS'}),prop('table',1150,710,170,60),prop('flowers',400,700,65,50)],
   nodes:[exit('festival'),node('flowers','Take flowers for the celebration',290,510,'collect',{item:'marigolds',once:true}),...[0,1,2,3].map((n)=>node('lamp'+n,'Light diya '+(n+1),[600,920,600,920][n],[435,435,710,710][n],'task',{flag:'puja-lamp-'+n})),node('quiet','Share a quiet moment at the pandal',760,510,'scene',{scene:'prayer',needsFlags:['puja-lamp-0','puja-lamp-1','puja-lamp-2','puja-lamp-3'],memory:'puja',item:'puja-keepsake'}),node('sweets','Browse the sweet stand',1240,585,'shop',{shop:'puja'}),node('ring','Back home to her Puja gift',1240,825,'travel',{to:'apartment'})]
  },
  community:{title:'Festival of India & Community Days',chapter:'OUR COMMUNITY · AFTER FEBRUARY 14',theme:'community',spawn:[768,890],memory:'community',
   subtitle:'Watch the performances, build a vegetarian plate, and share it at our table.',
   floors:[['path',160,720,1230,150],['path',620,220,220,650],['stone',180,250,1160,440]],
   props:[prop('stage',210,180,430,130),prop('stage',960,180,350,130),prop('stall',230,505,190,90,{label:'VEGETARIAN FEAST'}),prop('stall',1110,505,190,90,{label:'FABRIC & COLOR'}),prop('table',550,640,160,60),prop('table',800,640,160,60)],
   nodes:[exit('festival'),node('culture','Watch the cultural performances',425,380,'scene',{scene:'culture',flag:'community-culture'}),node('drama','Watch the drama stage',1120,380,'scene',{scene:'drama',flag:'community-drama'}),node('music','Join the kirtan & bhajan gathering',760,400,'scene',{scene:'music',flag:'community-music'}),node('feast','Share the vegetarian feast',760,760,'scene',{scene:'feast',flag:'community-feast',needsFlags:['community-culture','community-drama','community-music'],memory:'community',item:'community-keepsake'}),node('food','Browse the food stand',325,665,'shop',{shop:'community'}),node('fabric','Choose fabric for the Atelier',1200,665,'shop',{shop:'fabric'})]
  },
  pumpkins:{title:'The Great Pumpkin Patch',chapter:'AUTUMN · FINDING OUR FAVORITES',theme:'pumpkins',spawn:[768,890],memory:'pumpkins',
   subtitle:'Explore the patch, choose two pumpkins, and take them home to carve.',
   floors:[['path',160,740,1240,150],['path',660,250,180,600]],
   props:[prop('barn',565,150,410,180),prop('wagon',1190,370,180,95),prop('stall',170,190,190,95,{label:'FARM STAND'}),...Array.from({length:12},(_,i)=>prop('pumpkin',310+i%4*270,410+Math.floor(i/4)*130,50,45,{number:i}))],
   nodes:[exit(),...Array.from({length:12},(_,i)=>node('pumpkin'+i,'Choose this pumpkin',335+i%4*270,485+Math.floor(i/4)*130,'pumpkin',{number:i})),node('farm-shop','Browse the farm stand',265,350,'shop',{shop:'farm'}),node('wagon','Pose by the pumpkin wagon',1240,545,'scene',{scene:'pumpkin-photo',memory:'pumpkins',item:'pumpkin-photo',needs:'pumpkin',needsAmount:2}),node('home','Take our pumpkins home',1100,850,'travel',{to:'apartment'})]
  },
  haunt:{title:'Warehouse31 · Unchained',chapter:'HALLOWEEN · STAY CLOSE',theme:'haunt',spawn:[280,875],memory:'haunt',
   subtitle:'Follow the doorways through chains, mirrors, and fog. You have each other.',
   floors:[['warehouse',150,180,1240,720]],
   props:[prop('wall',150,500,410,28),prop('wall',690,500,700,28),prop('wall',715,180,25,170),prop('wall',715,680,25,220),prop('mirror',1100,270,150,70),prop('mirror',930,670,100,70),prop('chains',350,275,200,70,{solid:false}),prop('chains',270,650,120,70,{solid:false})],
   nodes:[exit(),node('entrance','Enter Warehouse31 together',300,760,'scene',{scene:'haunt-door',flag:'haunt-entrance'}),node('chains','The Chain Room',410,390,'scene',{scene:'haunt-chain',flag:'haunt-chains',needsFlags:['haunt-entrance']}),node('mirror','The Mirror Hall',1100,410,'scene',{scene:'haunt-mirror',flag:'haunt-mirror',needsFlags:['haunt-chains']}),node('fog','The Fog Run',1120,810,'scene',{scene:'haunt-exit',memory:'haunt',item:'haunt-ticket',needsFlags:['haunt-mirror']}),node('party','Continue our Halloween night',1280,900,'travel',{to:'halloween'})]
  },
  halloween:{title:'Good Night from the Addams',chapter:'HALLOWEEN · OUR WAY',theme:'halloween',spawn:[768,890],memory:'addams',
   subtitle:'Choose our matching outfits, pick up a rose, and take a turn on the dance floor.',
   floors:[['wood',170,210,1200,690],['rug',540,400,470,370]],
   props:[prop('sofa',235,370,230,80),prop('shelf',1130,270,140,130),prop('table',1090,655,180,70),prop('flowers',350,650,50,42),prop('lamp',480,280,30,30),prop('lamp',1050,280,30,30)],
   nodes:[exit(),node('costumes','Wear our Addams outfits',1200,490,'costume'),node('rose','A rose for Morticia',390,755,'collect',{item:'halloween-rose',once:true}),node('dance','Dance together',760,585,'scene',{scene:'dance',memory:'addams',item:'addams-photo'}),node('pose','Take our Halloween portrait',760,340,'scene',{scene:'portrait',flag:'addams-portrait'}),node('table','Halloween treats',1180,800,'shop',{shop:'halloween'})]
  }
 };
 const memoriesByPlace={apartment:'Her welcome home, the Durga Puja ring, and carving our two pumpkins.',observatory:'Our lunar eclipse, blood moon, blue moon, meteor shower, and planets over Birmingham.',park:'Our nighttime walk and bench date at Railroad Park Foundation.',stadium:'Her first baseball game at Regions Field and the fireworks afterward.',pool:'Her first swim together at Alight.',golf:'Our first Topgolf visit.',jeep:'Our Jeep Invasion trip and mountain drive.',astra:'Astra Lumina at Anakeesta during our Jeep Invasion trip.',concert:'Usha Uthup singing “Skyfall” at our Atlanta concert.',puja:'Our Atlanta Durga Puja celebration.',community:'Festival of India and the community performances, drama, kirtan, and meals.',pumpkins:'Our pumpkin-patch visit and picking a pair to take home.',haunt:'Our Warehouse31 haunted-house visit.',halloween:'Our Halloween together as Gomez and Morticia Addams.'};
 for(const [id,memoryOf] of Object.entries(memoriesByPlace))places[id].memoryOf=memoryOf;
 const memoryPlaces={homecoming:'apartment',ring:'apartment',carving:'apartment',sky:'observatory',park:'park',baseball:'stadium',swimming:'pool',topgolf:'golf',jeep:'jeep',astra:'astra',concert:'concert',puja:'puja',community:'community',pumpkins:'pumpkins',haunt:'haunt',addams:'halloween'};
 const items={
  roses:['Welcome-home roses','A bouquet to place in the apartment vase.','flower'],marigolds:['Marigolds','Flowers from the celebration.','flower'],pumpkin:['Our pumpkins','Picked at the patch. Take them to the apartment carving table.','pumpkin'],
  'home-photo':['Finally home','The room, the dinner, and our reunion.','photo'],'puja-ring':['For my Lokkhi','The Swarovski ring and the promise in your note.','ring'],'star-chart':['Our sky chart','Five skies to discover together from the overlook.','star'],'park-photo':['Railroad Park keepsake','Our bench under the lamplights.','photo'],
  'baseball-ticket':['First-game tickets','A first baseball game at Regions Field.','ticket'],'fireworks-photo':['Fireworks over Birmingham','A little sky full of color after the game.','photo'],'swim-ribbon':['Our first swim','A whole pool crossed together.','ribbon'],'golf-scorecard':['Topgolf scorecard','Our five-ball round.','card'],'jeep-badge':['Jeep Invasion badge','A whole mountain trip together.','badge'],duck:['A little Jeep duck','A little yellow souvenir from the show.','duck'],
  'astra-photo':['Our starlit keepsake','Ten installations, one night amongst the stars.','photo'],'concert-program':['Concert program','Usha Uthup, live in Atlanta.','card'],'concert-ticket':['Our concert tickets','A night of stage lights and applause.','ticket'],'puja-keepsake':['A Puja memory','Four diyas glowing together.','lamp'],'community-keepsake':['Our community days','Culture, music, food, and sharing her community.','card'],'pumpkin-photo':['Pumpkin-patch portrait','Two pumpkins by the red barn.','photo'],'haunt-ticket':['We made it out','Warehouse31, together.','ticket'],'addams-photo':['Good night from the Addams','Our matching Halloween looks.','photo'],'halloween-rose':['A rose for Morticia','A little flourish for our Halloween.','flower'],
  popcorn:['Popcorn for two','Share this snack anywhere on a date.','snack'],lemonade:['Two lemonades','Something cool to share.','snack'],'foam-finger':['A baseball souvenir','A little reminder of her first game.','badge'],'pool-float':['Pool-day float','A floating ring appears in the pool after you buy it.','float'],sweets:['A box of sweets','Something sweet to share.','snack'],meal:['Vegetarian bites','A little food to share between adventures.','snack'],'festival-fabric':['Festival fabric','A saved saree design for Tanima’s Atelier.','fabric'],cider:['Apple cider','A cozy autumn drink for two.','snack'],'golf-ball':['A lucky golf ball','A keepsake from the nighttime range.','ball']
 };
 const shops={concessions:[['popcorn',8],['lemonade',6]],baseball:[['foam-finger',12]],pool:[['pool-float',15],['lemonade',6]],golf:[['golf-ball',10],['meal',9]],jeep:[['duck',8],['lemonade',6]],concert:[['lemonade',6],['popcorn',8]],puja:[['sweets',8]],community:[['meal',9],['sweets',8]],fabric:[['festival-fabric',20]],farm:[['cider',7]],halloween:[['sweets',8],['popcorn',8]]};
 Object.entries(places).forEach(([id,p])=>{p.id=id;p.width=1536;p.height=1024;p.actorHeight=64;p.nodes.forEach(n=>{n.r=n.r||85;});});
 window.AdventurePlaces={places,memoryPlaces,items,shops,prop,node};
})();
