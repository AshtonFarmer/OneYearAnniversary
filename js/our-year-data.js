// The memories supplied by Ashton. Dates are included only when the reference
// photo identifies the occasion; this is a personal replay, not an ephemeris.
(function(){
  'use strict';
  const KEY='ourYear.v1';
  const photo=(file,crop)=>({src:'assets/our-year/photos/'+file,crop:crop||null});
  const memories=[
    {id:'homecoming',area:'home',title:'Finally home to me',eyebrow:'The welcome home',icon:'⌂',type:'homecoming',text:'The gold decorations, flowers, dinner, and that feeling when Tanima was finally back home with you.',photos:[photo('homecoming-1.jpg',[0,502,709,532]),photo('homecoming-2.jpg',[0,502,709,532])]},
    {id:'sky',area:'birmingham',title:'Every sky we shared',eyebrow:'Birmingham after dark',icon:'☾',type:'sky',text:'Your lunar eclipse, blood moon, blue moon, meteor shower, and nights spotting multiple planets together. These are separate sky memories to revisit at your own pace.',photos:[]},
    {id:'park',area:'birmingham',title:'Just us at Railroad Park Foundation',eyebrow:'A walk after dark',icon:'♧',type:'park',text:'A nighttime walk at Railroad Park Foundation. No big occasion needed: the lit path, the city around you, and time together.',photos:[photo('railroad-park.jpg',[0,295,709,945])]},
    {id:'baseball',area:'birmingham',title:'Her first baseball game',eyebrow:'Regions Field',icon:'⚾',type:'baseball',text:'You took Tanima to her first baseball game at Regions Field, then stayed for the fireworks over Birmingham.',photos:[photo('baseball.jpg',[0,502,709,532])]},
    {id:'swimming',area:'birmingham',title:'Her first swim',eyebrow:'Alight · pool day',icon:'≈',type:'swimming',text:'Her first time swimming, with you right beside her. Take it slowly, splash a little, and make it across together.',photos:[photo('swimming.jpg',[0,295,709,945])]},
    {id:'topgolf',area:'birmingham',title:'One more shot',eyebrow:'Her first Topgolf trip',icon:'⚑',type:'topgolf',text:'The lit targets, the nighttime range, and taking her to Topgolf for the first time. Aim a few shots and keep your own little scorecard.',photos:[photo('topgolf.jpg',[0,295,709,945])]},
    {id:'jeep',area:'mountains',title:'Jeep Invasion, together',eyebrow:'The mountain road trip',icon:'▰',type:'jeep',text:'Your Jeep Invasion trip: the road there, the Jeep gathering, the event grounds, and the mountains. The night walk at Astra Lumina gets its own full chapter.',photos:[]},
    {id:'astra',area:'mountains',title:'Astra Lumina',eyebrow:'The main event · Anakeesta',icon:'✦',type:'astra',text:'The mountain trip becomes a night amongst the stars. Walk through every named trail experience from your photo, ending with a keepsake together.',photos:[photo('astra-together.jpg',[0,502,709,532]),photo('astra-sign.jpg',[0,295,709,945]),photo('astra-trail.jpg')]},
    {id:'concert',area:'festival',title:'Usha Uthup, live',eyebrow:'Your Atlanta concert',icon:'♫',type:'concert',text:'You went to Atlanta and watched Usha Uthup perform live on stage. Your own concert photos belong beside this little stage replay.',photos:[photo('usha-concert-1.jpg'),photo('usha-concert-2.jpg')]},
    {id:'puja',area:'festival',title:'Durga Puja in Atlanta',eyebrow:'A celebration together',icon:'❋',type:'puja',text:'The Durga Puja trip to Atlanta: the decorations, the celebrations, and the fun you shared. Take a quiet moment beside the lamps.',photos:[]},
    {id:'ring',area:'festival',title:'For my Lokkhi',eyebrow:'Your Puja ring',icon:'◇',type:'ring',text:'The Swarovski ring you chose for her, the red roses, and your handwritten promise to keep showering her with love through the Pujas and occasions ahead.',photos:[photo('puja-ring.jpg')]},
    {id:'community',area:'festival',title:'Her community, our memories',eyebrow:'Festival of India & beyond',icon:'❀',type:'community',text:'Festival of India and the other community celebrations you attended together after February 14. Culture, performances, food, and sharing this part of her life.',photos:[photo('festival-of-india.jpg',[100,367,510,771])]},
    {id:'pumpkins',area:'autumn',title:'The Great Pumpkin Patch',eyebrow:'Picking our pumpkins',icon:'◉',type:'pumpkins',text:'The red barn, hay, the pumpkin wagon, and finding pumpkins together at The Great Pumpkin Patch.',photos:[photo('pumpkin-patch.jpg')]},
    {id:'carving',area:'autumn',title:'Our first carvings',eyebrow:'A little messy. All ours.',icon:'✎',type:'carving',text:'Your pumpkin-carving night: her classic jack-o’-lantern and your skull design. Make another pair, or draw something completely new.',photos:[photo('pumpkin-carving.jpg')]},
    {id:'haunt',area:'autumn',title:'Warehouse31: Unchained',eyebrow:'The haunted house date',icon:'☠',type:'haunt',text:'The two of you went through Warehouse31 together. Stay close through the chains, shadows, and fog, then find the way back out.',photos:[]},
    {id:'addams',area:'autumn',title:'Good night from the Addams',eyebrow:'Halloween, our way',icon:'♥',type:'addams',text:'Your Addams family Halloween: Gomez’s pinstripes, Morticia’s black dress, and both of you together. You can keep the matching looks in your wardrobe.',photos:[photo('addams-together.jpg',[0,461,709,533]),photo('addams-morticia.jpg',[0,180,709,1107])]},
    {id:'necklace',area:'mall',title:'Our first yes',eyebrow:'The photo booth & Flash necklace',icon:'ϟ',type:'necklace',text:'At the shopping mall, when you asked Tanima to be your girlfriend, you gave her a Flash necklace. Replay the original photo-booth memory to see the gift become part of that moment.',photos:[]}
  ];
  function read(){try{const data=JSON.parse(localStorage.getItem(KEY)||'null');return data&&data.version===1?data:{version:1,completed:{},details:{}};}catch(e){return {version:1,completed:{},details:{}};}}
  function write(state){localStorage.setItem(KEY,JSON.stringify(state));window.dispatchEvent(new CustomEvent('ouryearchange'));}
  function detail(id,value){const state=read();if(arguments.length===1)return state.details[id]||{};state.details[id]=value;write(state);return value;}
  function complete(id,extra){const state=read();state.completed[id]={at:Date.now(),...extra};write(state);return state;}
  function photoElement(p,alt){
    const box=document.createElement('div');box.className='memory-photo';
    const img=document.createElement('img');img.src=p.src;img.alt=alt;img.loading='lazy';img.decoding='async';
    if(p.crop){const [x,y,w,h]=p.crop;box.style.aspectRatio=w+'/'+h;img.style.width=(100*(p.src.includes('astra-trail')?1290:(p.src.includes('usha-')||p.src.includes('puja-ring')||p.src.includes('pumpkin-')?1290:709))/w)+'%';img.style.left=(-x/w*100)+'%';img.style.top=(-y/h*100)+'%';}
    else {box.classList.add('uncropped');}
    box.appendChild(img);return box;
  }
  window.OUR_YEAR={KEY,memories,read,detail,complete,photoElement,byId:id=>memories.find(m=>m.id===id)};
})();
