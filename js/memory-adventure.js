(function(){
 'use strict';
 const D=window.AdventurePlaces,S=window.AdventureState,G=window.AdventureGeometry,A=window.AdventureArt,Y=window.OUR_YEAR,$=id=>document.getElementById(id);
 const canvas=$('adventureCanvas'),ctx=canvas.getContext('2d'),images={},wardrobeImages={},occasionImages={},query=new URLSearchParams(location.search);
 let place=D.places[query.get('place')]||D.places.park,ready=false,width=1,height=1,dpr=1,scale=1.4,elapsed=0,last=0,near=null,scene=null,craft=null,overview=false,swimming=false,toastTime=0,returnFocus=null,poses=null,sound=false,audio=null;
 let keys={},camera={x:768,y:650},state=S.read();
 let carrying=false,carrySprite=null;
 const players={him:{who:'him',x:730,y:880,dir:0,frame:0,path:[]},her:{who:'her',x:805,y:880,dir:0,frame:0,path:[]}};
 const debug=window.MapDebug.create(canvas,()=>({ready,...camera,width,height,scale,dpr,mapWidth:1536,mapHeight:1024,id:place.id}));
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),ease=u=>{u=clamp(u);return u*u*(3-2*u);};
 const icons={flower:'❀',pumpkin:'◉',photo:'▧',ring:'◇',star:'✦',ticket:'▰',ribbon:'✧',card:'▤',badge:'✺',duck:'◕',lamp:'♧',snack:'◒',float:'◎',fabric:'✿',ball:'●'};
 function text(tag,copy,cls){const e=document.createElement(tag);e.textContent=copy;if(cls)e.className=cls;return e;}
 function button(copy,fn,parent){const b=text('button',copy);b.type='button';b.onclick=fn;(parent||$('panelContent')).appendChild(b);return b;}
 function tone(n=0){if(!sound||!audio)return;try{const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime;o.frequency.value=220*Math.pow(2,n/12);g.gain.setValueAtTime(.045,now);g.gain.exponentialRampToValueAtTime(.001,now+.4);o.connect(g);g.connect(audio.destination);o.start(now);o.stop(now+.41);}catch(e){}}
 function toast(message){$('adventureToast').textContent=message;$('adventureToast').classList.add('visible');toastTime=5;}
 function sync(){state=S.read();$('coinCount').textContent=state.coins+' coins';updateGoal();positionGoal();}
 function positionGoal(){const h=$('adventureHeader');if(typeof h.getBoundingClientRect!=='function')return;const top=h.getBoundingClientRect().bottom;$('placeGoal').style.top=(top+12)+'px';$('adventureToast').style.top=(top+65)+'px';}
 function flagFor(n){return n.flag||(n.action==='pumpkin'?'pumpkin-'+n.number:n.action==='duck'?'duck-'+n.number:place.id+'-'+n.id);}
 function nodeDone(n){return !!state.flags[n.action==='swim'?'pool-crossed':n.action==='golf'?'golf-round':flagFor(n)];}
 function updateGoal(){
  if(place.id==='pumpkins'){const count=Object.keys(state.flags).filter(k=>k.startsWith('pumpkin-')&&state.flags[k]).length,portrait=!!state.flags['pumpkins-wagon'];$('placeGoal').textContent=count+' / 2 pumpkins · '+(portrait?'Our wagon portrait is kept.':count<2?'Choose our pair in the patch.':'Meet by the wagon, then take them home.');return;}
  if(place.id==='observatory'){const count=[0,1,2,3,4].filter(i=>state.flags['sky-'+i]).length;$('placeGoal').textContent=count+' / 5 skies watched · '+(count<5?'Choose at the telescope; watch on our blanket.':'Every sky, together.');return;}
  const tasks=place.nodes.filter(n=>!['travel','link','shop','sky','dry','carry'].includes(n.action)),done=tasks.filter(n=>n.action==='golf'?state.flags['golf-round']:nodeDone(n)).length,next=tasks.find(n=>!(n.action==='golf'?state.flags['golf-round']:nodeDone(n)));$('placeGoal').textContent=done+' / '+tasks.length+' discoveries'+(next?' · '+next.name:' · This little chapter is ours.');
 }
 function savePosition(){try{sessionStorage.setItem('adventure-position-'+place.id,JSON.stringify(players));}catch(e){}}
 function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Could not load one of our character outfits.'));im.src=src;});}
 function applyOccasionOutfits(){Object.assign(images,wardrobeImages);if(swimming&&occasionImages.swimming)Object.assign(images,occasionImages.swimming);if(place.id==='apartment'&&scene&&scene.node.scene==='reunion'&&occasionImages.homecoming)images.her=occasionImages.homecoming.her;poses=window.OurYearCinema.renderer(canvas,{images});}
 async function loadOccasionOutfits(id){const occasion=id==='pool'?'swimming':id==='apartment'?'homecoming':null;if(!occasion||occasionImages[occasion])return;const cast=occasion==='swimming'?['him','her']:['her'],sheets=await Promise.all(cast.map(who=>window.SharedWardrobe.occasionSheet(who,occasion)));occasionImages[occasion]=Object.fromEntries(cast.map((who,i)=>[who,sheets[i]]));}
 async function refreshOutfits(){for(const who of ['him','her']){const n=window.WalkingSprites.selectOutfit(who);wardrobeImages[who]=await loadImage('assets/sprites/'+who+(n===1?'_atlas':'_outfit'+n)+'.png');}applyOccasionOutfits();}
 function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);positionGoal();}
 function canStand(x,y){return (!carrying||G.contains(place.water,x,y,-18))&&G.canStand(place,x,y,swimming);}
 function walkTo(x,y){Object.values(players).forEach((a,i)=>a.path=G.pathfind(place,a,{x:x+(i?29:-29),y},swimming));}
 function placeAt(x,y){Object.values(players).forEach((a,i)=>{const q=G.nearest(place,x+(i?35:-35),y,swimming);if(q){a.x=q.x;a.y=q.y;}a.path=[];a.dir=0;a.frame=0;});}
 function travel(id,initial=false){
  if(!D.places[id]){savePosition();location.href='memory-world.html'+(id==='home'?'':'?area='+id);return;}
  window.SkyfallPlayer?.setAvailable(id==='concert');
  if(!initial)savePosition();closePanel(false);endScene(false);carrying=false;swimming=false;debug.clear();place=D.places[id];applyOccasionOutfits();A.pin(id);placeAt(...place.spawn);keys={};near=null;$('interact').hidden=true;
  try{const saved=JSON.parse(sessionStorage.getItem('adventure-position-'+id)||'null');if(saved)Object.keys(players).forEach(who=>{if(saved[who]&&canStand(saved[who].x,saved[who].y)){players[who].x=saved[who].x;players[who].y=saved[who].y;}});}catch(e){}
  camera=place.id==='apartment'?{x:768,y:512}:{x:(players.him.x+players.her.x)/2,y:(players.him.y+players.her.y)/2};if(place.id==='apartment')scale=Math.min(width/1536,height/1024)*.97;
  $('placeTitle').textContent=place.title;$('placeChapter').textContent=place.chapter;$('placeSubtitle').textContent=place.subtitle;document.title=place.title+' · Our Adventure';
  S.markVisited(id);sync();$('adventureLoading').hidden=false;const scenery=Promise.all([A.load(place),loadOccasionOutfits(id),id==='pool'&&!carrySprite?loadImage('assets/sprites/pool-carry.webp').then(im=>{carrySprite=im;}):null]).then(([im])=>{if(place.id===id){applyOccasionOutfits();$('adventureLoading').hidden=true;$('retryAdventure').hidden=true;}return im;}).catch(e=>{if(place.id===id){$('adventureLoading').querySelector('p').textContent=e.message;$('retryAdventure').hidden=false;}throw e;});const url=new URL(location.href);url.searchParams.set('place',id);url.searchParams.delete('focus');history.replaceState(null,'',url);if(!initial)toast(place.subtitle);tone(5);return scenery;
 }
 function openPanel(title,eyebrow){if(!$('adventurePanel').open)returnFocus=document.activeElement;$('panelTitle').textContent=title;$('panelEyebrow').textContent=eyebrow||'OUR LITTLE ADVENTURE';$('panelContent').replaceChildren();if(!$('adventurePanel').open)$('adventurePanel').showModal();keys={};$('closePanel').focus();return $('panelContent');}
 function closePanel(reload=true){if(ready&&reload!==false&&!A.isPainted(place.id))A.load(place).catch(e=>toast(e.message));if(craft){craft.dispose();craft=null;}$('adventurePanel').close();keys={};if(returnFocus&&returnFocus.isConnected)returnFocus.focus();}
 function card(parent,title,body,small){const c=text('div','','adventure-card');if(small)c.appendChild(text('small',small));c.append(text('strong',title),text('p',body));parent.appendChild(c);return c;}
 function here(){const content=openPanel('Things to do here',place.title),grid=text('div','','adventure-grid');content.appendChild(text('p','Pick a spot and we will walk there together. Use E when we arrive. You can also explore freely with the movement controls.'));content.appendChild(grid);place.nodes.filter(n=>!['dry','carry'].includes(n.action)||swimming).forEach(n=>{const done=nodeDone(n),missing=(n.needsFlags||[]).filter(f=>!state.flags[f]),body=missing.length?'There is another part of this day to do first.':n.needs&&(state.bag[n.needs]||0)<(n.needsAmount||1)?'Bring '+D.items[n.needs][0].toLowerCase()+' from our other adventures.':n.action==='carry'?'Swim here together and press E. Move with Ashton’s controls and press E again to set Tanima down.':n.action==='shop'?'A stand with optional date treats or souvenirs.':n.action==='travel'?'A path into another place.':done?'We can return to this little moment.':'A little part of our day to discover.',c=card(grid,n.name,body,done?'KEPT ♥':'EXPLORE');button('Walk here →',()=>{endScene(false);closePanel();walkTo(n.x,n.y);toast('Walking to '+n.name.toLowerCase()+'. Use E when we arrive.');},c);});}
 function atlas(){const content=openPanel('Every place in our adventure','OUR MAP & MEMORY GUIDE');content.appendChild(text('p','Each place brings one of our memories to life. Homecoming, the Puja ring, and pumpkin carving share our apartment.'));const grid=text('div','','adventure-grid');content.appendChild(grid);Object.values(D.places).forEach(p=>{const c=card(grid,p.title,p.memoryOf||p.subtitle,state.visited[p.id]?'VISITED ♥':'A NEW PLACE');const preview=document.createElement('canvas');preview.width=384;preview.height=256;const pp=preview.getContext('2d');A.load(p).then(im=>{pp.drawImage(im,0,0,384,256);pp.save();pp.scale(.25,.25);p.props.forEach(o=>A.mapProp(pp,p,o,0,state));pp.restore();}).catch(()=>{pp.drawImage(A.base(p),0,0,384,256);});c.insertBefore?c.insertBefore(preview,c.firstChild):c.appendChild(preview);button('Go there →',()=>travel(p.id),c);});const c=card(grid,'The original Love Mall','The photo booth, the Flash necklace, and Tanima’s Atelier.','OUR EXISTING MALL');button('Walk into the mall ↗',()=>location.href='shopping.html',c);}
 function occasionLooks(){const content=openPanel('Outfits for our memories','OUR OCCASION CLOSET'),grid=text('div','','adventure-grid');content.appendChild(text('p','Our swim outfits appear when we enter the pool. Tanima’s photo outfit appears during the homecoming scene. Choose Wear everywhere to keep a look on across the game.'));content.appendChild(grid);window.SharedWardrobe.presets().forEach(p=>{const c=card(grid,p.name,p.description),preview=document.createElement('canvas');preview.width=192;preview.height=192;window.SharedWardrobe.render(window.SharedWardrobe.presetDesign(p.id),false).then(im=>preview.getContext('2d').drawImage(im,0,0,256,256,0,0,192,192)).catch(e=>toast(e.message));c.appendChild(preview);button('Wear everywhere →',()=>{try{window.SharedWardrobe.wearPreset(p.id);toast(p.name+' is ready to wear across our game.');closePanel();}catch(e){toast(e.message);}},c);});}
 function bag(){
  const content=openPanel('Our bag','KEEPSAKES · '+state.coins+' COINS');content.appendChild(text('p','These are game coins for optional date treats and souvenirs. Discovering a new spot earns more. Our keepsakes travel between all these maps.','bag-note'));
  if(state.feastPlate.length)content.appendChild(text('p','Our festival plate · '+state.feastPlate.join(' · ')));
  const entries=Object.entries(state.bag).filter(([,n])=>n>0);if(!entries.length){content.appendChild(text('p','Our bag is empty. Explore a place, collect a keepsake, or visit a stand.'));return;}
  const grid=text('div','','adventure-grid');content.appendChild(grid);entries.forEach(([id,count])=>{const item=D.items[id];if(!item)return;const c=card(grid,item[0],item[1]+(id==='golf-scorecard'&&state.scores.length?' Latest round: '+state.scores[state.scores.length-1].score+' points.':''),count>1?'IN OUR BAG · '+count:'IN OUR BAG');c.appendChild(text('span',icons[item[2]]||'✦','item-icon'));
   if(item[2]==='snack')button('Share together ♥',()=>{if(!S.consume(id))return;closePanel();sync();beginScene({id:'snack',name:'A little something for two',scene:'snack',action:'scene',x:(players.him.x+players.her.x)/2,y:(players.him.y+players.her.y)/2,sharedItem:id});},c);
   if(id==='festival-fabric')button('Open this design in the Atelier ↗',()=>location.href='outfit-studio.html',c);
   if(id==='pumpkin')button('Take them to the carving table →',()=>travel('apartment'),c);
  });
 }
 const feastMenu=[
  ['Base',['Jeera rice','Roti']],
  ['Main',['Chana masala','Saag paneer']],
  ['Side',['Samosa','Kheer']]
 ];
 function buildFeast(){
  const content=openPanel('Build a vegetarian plate','FESTIVAL OF INDIA');
  const selected=[...state.feastPlate];
  content.appendChild(text('p','Pick one from each group, then bring the plate to our table.'));
  const groups=text('div','','adventure-grid');
  content.appendChild(groups);
  const confirm=button('Pack our plate',()=>{
   S.packFeast(selected);closePanel();toast('Plate packed. Bring it to the feast table.');
  },content);
  const complete=()=>confirm.disabled=!feastMenu.every((_,i)=>selected[i]);
  feastMenu.forEach(([label,choices],i)=>{
   const group=card(groups,label,'Choose one for our plate.');
   const options=choices.map(choice=>button(choice,()=>{
    selected[i]=choice;
    options.forEach((b,j)=>b.setAttribute('aria-pressed',String(choices[j]===choice)));
    complete();
   },group));
   options.forEach((b,j)=>b.setAttribute('aria-pressed',String(choices[j]===selected[i])));
  });
  complete();
 }
 function shop(n){const content=openPanel(n.name,'OUR DATE STANDS · '+state.coins+' COINS');
  if(n.shop==='community')button('Build a vegetarian plate',buildFeast,content);content.appendChild(text('p','Optional treats and souvenirs for our adventure. New discoveries earn coins.'));const grid=text('div','','adventure-grid');content.appendChild(grid);(D.shops[n.shop]||[]).forEach(([id,price])=>{const item=D.items[id],c=card(grid,item[0],item[1],price+' GAME COINS');c.appendChild(text('span',icons[item[2]]||'✦','item-icon'));const owned=item[2]!=='snack'&&state.bag[id];const b=button(owned?'Already in our bag':'Get it · '+price+' coins',()=>{
   try{if(id==='festival-fabric'&&!state.bag[id]&&state.coins>=price)window.SharedWardrobe.save({id:'festival-saree',name:'Festival of India · our fabric',who:'her',kind:'saree',color:'#a8585d',trim:'#ddbd73',pattern:'flowers'});const result=S.purchase(id,price);sync();shop(n);toast(result.message);tone(result.ok?7:0);}catch(e){toast('Could not save that purchase: '+e.message);}
  },c);b.disabled=!!owned||state.coins<price;});}
 function chooseSky(){const content=openPanel('Every sky we shared','THE TELESCOPE');content.appendChild(text('p','Choose one of our remembered skies, then walk to the blanket to watch it together. These sky effects are illustrative rather than a dated sky chart.'));const list=text('div','','sky-options');content.appendChild(list);['Lunar eclipse','Blood moon','Blue moon','Meteor shower','Planets over Birmingham'].forEach((label,i)=>{const b=button((state.flags['sky-'+i]?'✓ ':'')+label,()=>{S.setSky(i);sync();closePanel();toast(label+' is above us. Meet at our blanket.');},list);b.setAttribute('aria-pressed',String(state.sky===i));});}
 function activity(n){
  const content=openPanel('Our pumpkin-carving table','MAKE SOMETHING TOGETHER');const c=document.createElement('canvas');c.width=960;c.height=570;c.className='adventure-craft';const status=text('p','','craft-status'),controls=text('div','','craft-controls');content.append(c,status,controls);
  craft=window.OurYearActivities.createActivity(Y.byId(n.activity),{canvas:c,controls,images,backdrops:{},status:t=>status.textContent=t,tone,photo(){},open(){},complete:(id)=>{Y.complete(id);S.task('apartment-carve',null,15);sync();status.textContent='Our pumpkins are saved. Close the table to see them glowing in the apartment.';}});
 }
 function requires(n){
  if(n.dry&&swimming){toast('Climb out at the pool ladder first, then meet at our loungers.');return false;}
  if(n.needs&&(state.bag[n.needs]||0)<(n.needsAmount||1)){toast(n.needs==='pumpkin'?'Pick our pair of pumpkins at The Great Pumpkin Patch first.':'Find '+D.items[n.needs][0]+' first. It will be in our bag.');return false;}
  const missing=(n.needsFlags||[]).filter(f=>!state.flags[f]);if(missing.length){const target=place.nodes.find(x=>missing.includes(flagFor(x)));toast(target?'First: '+target.name+'.':'There is a little more to explore here first.');return false;}
  if(n.scene==='feast'&&state.feastPlate.length!==3){toast('Build our vegetarian plate at the food stand first.');return false;}
  return true;
 }
 function atCarrySpot(n){
  return swimming&&Object.values(players).every(a=>G.contains(place.water,a.x,a.y)&&Math.hypot(a.x-n.x,a.y-n.y)<n.r);
 }
 function releaseCarry(){
  carrying=false;keys={};
  const [left,,width]=place.water, {him,her}=players;
  const x=him.x+34<left+width-10?him.x+34:him.x-34;
  Object.assign(her,G.nearest(place,x,him.y,true));
  him.path=[];her.path=[];
  toast('Back to swimming together.');
 }
 function act(n){
  if(!ready)return;
  if(carrying){releaseCarry();return;}
  if(!n)return;
  if(n.action==='carry'){
   if(!carrySprite||!atCarrySpot(n))return;
   keys={};Object.values(players).forEach(a=>{a.path=[];});
   Object.assign(players.him,{x:n.x,y:n.y});
   Object.assign(players.her,{x:n.x,y:n.y});
   carrying=true;near=null;
   toast('WASD to wade together. Press E to set Tanima down.');
   return;
  }
  if(scene){
   if(scene.kind==='golf')shoot();
   else if(scene.phase==='playing'&&scene.node.scene==='drive')toggleDrive();
   else if(scene.phase==='playing'&&['baseball','concert'].includes(scene.node.scene))audienceAction('clap');
   else{scene.paused=!scene.paused;sceneControls();}
   return;
  }
  if(!requires(n))return;keys={};tone(2);
  if(n.action==='travel'){travel(n.to);return;}if(n.action==='link'){savePosition();location.href=n.href;return;}if(n.action==='shop'){shop(n);return;}if(n.action==='sky'){chooseSky();return;}if(n.action==='activity'){activity(n);return;}
  if(n.action==='costume'){window.SharedWardrobe.addams();S.task(flagFor(n));refreshOutfits().then(()=>beginScene({...n,scene:'portrait'}));toast('Our Addams looks are equipped across the game.');sync();return;}
  if(n.action==='collect'){const got=S.collect(n.item,flagFor(n));sync();toast(got?D.items[n.item][0]+' is in our bag.':'We already kept this one.');return;}
  if(n.action==='duck'){const got=S.collect('duck','duck-'+n.number);sync();toast(got?'A little Jeep duck! '+[1,2,3].filter(i=>state.flags['duck-'+i]).length+' / 3 found.':'This duck is already in our bag.');return;}
  if(n.action==='pumpkin'){const picked=Object.keys(state.flags).filter(k=>k.startsWith('pumpkin-')&&state.flags[k]).length;if(nodeDone(n)){toast('We already chose this one. There are more pumpkins in the patch.');return;}if(picked>=2){toast('Our pair is picked. Take them home to carve, or pose by the wagon.');return;}S.collect('pumpkin','pumpkin-'+n.number);sync();beginScene({...n,scene:'pick',noReward:true});toast('Pumpkin '+(picked+1)+' of 2 is in our bag.');return;}
  if(n.action==='task'){const got=S.task(flagFor(n));sync();beginScene({...n,scene:'small-task',noReward:true});if(got)toast('A little part of our day, made ready. +8 coins');return;}
  if(n.action==='swim'){swimming=true;scene=null;applyOccasionOutfits();const start=place.art.swimStart||[[540,695],[610,695]],a=G.nearest(place,...start[0],true),b=G.nearest(place,...start[1],true);players.him.path=G.pathfind(place,players.him,a,true);players.her.path=G.pathfind(place,players.her,b,true);toast('Bikini and swim trunks on! Use your movement controls—or click across the pool—to swim together.');return;}
  if(n.action==='dry'){if(swimming){swimming=false;applyOccasionOutfits();placeAt(...(place.art.dry||[460,785]));toast('Back in our walking outfits. Our loungers are waiting.');}else toast('Meet at the ladder to start our swim.');return;}
  if(n.action==='golf'){beginGolf(n);return;}
  beginScene(n);
 }
 const scripts={
  reunion:[['hold',3,'Gold fringe, WELCOME HOME, and that little love balloon.'],['hug',6,'After all that waiting, she is finally here.'],['sit',6,'Red roses, our sticker-covered laptop, and dinner by the black sofa.']],
  ring:[['give',4,'Ashton passes the little Puja gift to Tanima.'],['gift',5,'The ring catches the light. For my Lokkhi.'],['hug',4,'A gift and a moment close together.']],
  bench:[['sit',5,'We sit down under the lamplights.'],['lean',7,'The city carries on. We stay a little longer.']],
  sky:[['sit',10,'Our Birmingham sky, and the two of us looking up.']],water:[['hold',6,'The park lights ripple across the water.']],
  baseball:[['sit',12,'Watch the batter. Press E when HIT! appears to cheer together.']],fireworks:[['sit',5,'The game is over. The sky has one more surprise.'],['cheer',9,'Fireworks above Birmingham, with you right here.']],
  'pool-rest':[['sit',6,'We made it across. Time to rest together.']],cheer:[['cheer',5,'That one counts. One more first together.']],
  'jeep-show':[['hold',7,'Rows of Jeeps, a whole event to explore, and the two of us.']],overlook:[['hold',7,'A mountain pause before our night amongst the stars.']],
  concert:[['sit',6,'The hall goes dark. Usha Uthup takes the stage.'],['dance',8,'Usha Uthup sings “Skyfall.” The stage glows blue as we sway together.'],['clap',5,'One more round of applause.']],applause:[['clap',6,'An Atlanta concert we got to share.']],
  prayer:[['pray',8,'A quiet moment beside four glowing diyas.']],culture:[['sit',8,'Colorful fabric and dancers turning across the stage.']],drama:[['sit',7,'A little stage, a story, and two people watching.']],music:[['clap',8,'Kirtan, bhajan, and the gathering around the musicians.']],feast:[['give',3,'Sharing the plate we picked together.'],['sit',5,'A vegetarian feast and time together in her community.']],
  'pumpkin-photo':[['hold',4,'Two pumpkins by the wagon.'],['portrait',4,'One picture before we take them home to carve.']],pick:[['crouch',3,'This one belongs to our pair.']],
  'haunt-door':[['hold',5,'At the entrance together. Time to go in.']], 'haunt-chain':[['hold',6,'A rattle in the dark. We move a little closer.']], 'haunt-mirror':[['hold',6,'Our reflections follow us past the next doorway.']], 'haunt-exit':[['hold',3,'Through the fog. The exit is just ahead.'],['hug',5,'A breath of relief, then back outside together.']],
  dance:[['dance',8,'Gomez and Morticia. Ashton and Tanima.'],['hug',4,'Good night from the Addams.']],portrait:[['portrait',5,'A little pose to keep from this day.']],snack:[['give',5,'A little something for the two of us to share.']], 'small-task':[['give',3,'One more little detail of our day.']],astra:[['walk',3,'Following the light into the next part of the forest.'],['hold',6,'A night amongst the stars, together.']]
 };
 function anchorFor(n){
  if(place.art&&place.art.anchors&&place.art.anchors[n.scene]){const a=place.art.anchors[n.scene];return {x:a[0],y:a[1]};}
  if(n.scene==='bench'){const o=place.props.find(p=>p.kind==='bench'&&p.x>800);return {x:o.x+o.w/2,y:o.y+18};}
  if(n.scene==='concert'){const o=place.props.find(p=>p.kind==='seat'&&p.x===800);return {x:o.x+o.w/2,y:o.y+18};}
  if(n.scene==='baseball'||n.scene==='fireworks'){const benches=place.props.filter(p=>p.kind==='bench'),o=benches[n.scene==='baseball'?1:3];return {x:o.x+o.w/2,y:o.y+18};}
  if(n.scene==='sky')return {x:745,y:665};
  if(n.scene==='pool-rest')return {x:325,y:255};
  return G.nearest(place,n.x,n.y,swimming)||{x:n.x,y:n.y};
 }
 function beginScene(n){
  const type=n.action==='astra'?'astra':n.scene||'portrait',script=scripts[type]||scripts.portrait;
  scene={kind:'script',node:{...n,scene:type},age:0,phase:'approach',paused:false,script,anchor:anchorFor(n)};
  if(type==='drive')scene.drive={progress:0,lane:0,offset:0,gate:0,cruise:false};
  if(type==='feast')scene.plate=[...state.feastPlate];
  applyOccasionOutfits();
  document.body.classList.add('adventure-cinematic');
  const q=G.nearest(place,n.x,n.y,swimming)||{x:n.x,y:n.y};walkTo(q.x,q.y);const slots=place.art.slots&&place.art.slots[type];if(slots)Object.values(players).forEach((a,i)=>{a.path=G.pathfind(place,a,{x:slots[i][0],y:slots[i][1]+(type==='pool-rest'?65:35)},swimming);});$('sceneCaption').hidden=false;$('sceneTitle').textContent=n.name;$('sceneText').textContent='A little closer together…';sceneControls();if(type==='concert')S.task('concert-performed',null,0);near=null;$('interact').hidden=true;
 }
 function sceneControls(){
  const c=$('sceneControls');c.replaceChildren();if(!scene)return;
  if(scene.kind==='golf'){range(c,'Aim',-100,100,scene.aim,v=>scene.aim=v);range(c,'Power',20,100,scene.power,v=>scene.power=v);button('Take the shot · E',shoot,c);button('Finish round',()=>endScene(false),c);return;}
  const type=scene.node.scene;
  if(scene.phase==='playing'&&type==='drive'){
   button('Lane left · A',()=>steerDrive(-1),c);
   button('Drive / brake · E',toggleDrive,c);
   button('Lane right · D',()=>steerDrive(1),c);
  }
  if(scene.phase==='playing'&&type==='baseball')button('Cheer · E',()=>audienceAction('clap'),c);
  if(type==='concert'){
   if(scene.phase==='playing'){
    button('Clap · E',()=>audienceAction('clap'),c);
    button('Sway together',()=>audienceAction('dance'),c);
   }
   if(window.SkyfallPlayer)button('Listen to Skyfall ♫',window.SkyfallPlayer.open,c);
  }
  button(scene.paused?'Continue ▶':'Pause Ⅱ',()=>{scene.paused=!scene.paused;sceneControls();},c);
  button('Return to exploring',()=>endScene(false),c);
 }
 function audienceAction(pose){
  const s=scene;
  if(!s||s.paused||s.phase!=='playing')return;
  s.audience={pose,until:s.age+(pose==='dance'?4:1.1)};
  if(s.node.scene==='baseball'){
   const beat=s.age%4,inning=Math.floor(s.age/4);
   if(beat>=2&&beat<2.9&&s.lastCheer!==inning){
    s.lastCheer=inning;
    s.cheers=(s.cheers||0)+1;
    S.task('baseball-timed-cheer',null,5);
    tone(7);
   }
  }
 }
 const driveGates=[[.28,-1],[.57,1],[.82,0]];
 const laneNames=['left','center','right'];
 function steerDrive(direction){
  if(scene?.drive&&scene.phase==='playing'&&!scene.paused)scene.drive.lane=clamp(scene.drive.lane+direction,-1,1);
 }
 function toggleDrive(){
  if(scene?.drive&&scene.phase==='playing'&&!scene.paused)scene.drive.cruise=!scene.drive.cruise;
 }
 function roadPoint(progress,lane){
  const road=place.art.drivePath;
  const lengths=road.slice(1).map((b,i)=>Math.hypot(b[0]-road[i][0],b[1]-road[i][1]));
  let distance=progress*lengths.reduce((sum,length)=>sum+length,0),i=0;
  while(i<lengths.length-1&&distance>lengths[i])distance-=lengths[i++];
  const [x,y]=road[i], [xx,yy]=road[i+1], t=distance/lengths[i];
  return {x:x+(xx-x)*t,y:y+(yy-y)*t+lane*24};
 }
 function updateDrive(s,dt){
  const d=s.drive, gate=driveGates[d.gate];
  d.offset+=(d.lane-d.offset)*Math.min(1,dt*8);
  const previous=d.progress;
  if(d.cruise||keys.w||keys.arrowup){
   d.progress=Math.min(d.progress+dt*.17,gate?.[0]??1);
   if(gate&&d.progress>=gate[0]&&Math.abs(d.offset-gate[1])<.25)d.gate++;
  }
  if(d.progress>previous)s.age+=dt;
  s.anchor=roadPoint(d.progress,d.offset);
  s.current={pose:'ride'};
  if(d.progress>=1){
   placeAt(s.anchor.x,s.anchor.y+16);
   endScene(true);toast('Charizard is parked at the turnout. The overlook is up the path.');return;
  }
  const next=driveGates[d.gate];
  $('sceneText').textContent=next
   ? (d.progress>=next[0]?'Steer '+laneNames[next[1]+1]+' to pass.':'Checkpoint '+(d.gate+1)+' / 3 · '+laneNames[next[1]+1]+' lane.')+' Hold W or use Drive.'
   : 'All three checkpoints cleared. Drive on to the turnout.';
 }
 function range(parent,name,min,max,value,change){const l=text('label',name),i=document.createElement('input');i.type='range';i.min=min;i.max=max;i.value=value;i.setAttribute('aria-label',name);i.oninput=()=>change(Number(i.value));l.appendChild(i);parent.appendChild(l);}
 function endScene(finished){
  if(!scene)return;const old=scene;scene=null;applyOccasionOutfits();document.body.classList.remove('adventure-cinematic');$('sceneCaption').hidden=true;keys={};Object.values(players).forEach(a=>{a.path=[];a.frame=0;});
  if(finished){const n=old.node;
   if(n.scene==='feast'){
    if(!S.serveFeast()){toast('Build another plate at the food stand.');return;}
   }else if(!n.noReward)S.task(flagFor(n),n.item,8);
   if(n.action==='astra'){S.task('astra-'+n.station,n.item);const visited=Array.from({length:10},(_,i)=>i).filter(i=>S.read().flags['astra-'+i]);Y.detail('astra',{visited,stage:Math.min(n.station+1,9)});}
   if(n.scene==='sky'){S.task('sky-'+state.sky);const watched=[0,1,2,3,4].filter(i=>S.read().flags['sky-'+i]);Y.detail('sky',{watched});if(watched.length===5)Y.complete('sky');}
   if(n.memory&&n.scene!=='sky')Y.complete(n.memory,{adventure:true});sync();tone(7);toast(n.item?D.items[n.item][0]+' is in our bag.':'A little part of our year, kept.');
  }
 }
 function beginGolf(n){document.body.classList.add('adventure-cinematic');scene={kind:'golf',node:n,anchor:{x:768,y:775},age:0,aim:0,power:65,shots:0,score:0,flight:null};walkTo(765,770);$('sceneCaption').hidden=false;$('sceneTitle').textContent='OUR TOPGOLF ROUND';sceneControls();}
 function shoot(){if(!scene||scene.kind!=='golf'||scene.flight)return;const f=scene;f.flight={age:0,x0:(place.art.golfOrigin||[768,680])[0],y0:(place.art.golfOrigin||[768,680])[1],x:768+f.aim*4,y:650-f.power*4};tone(4);}
 function movement(a,dt,scripted=false){let dx=scripted?0:(keys[a.who==='him'?'d':'arrowright']?1:0)-(keys[a.who==='him'?'a':'arrowleft']?1:0),dy=scripted?0:(keys[a.who==='him'?'s':'arrowdown']?1:0)-(keys[a.who==='him'?'w':'arrowup']?1:0);if(dx||dy)a.path=[];else if(a.path.length){const q=a.path[0],dist=Math.hypot(q.x-a.x,q.y-a.y);if(dist<3){a.x=q.x;a.y=q.y;a.path.shift();a.walking=false;return;}dx=q.x-a.x;dy=q.y-a.y;}const dist=Math.hypot(dx,dy);a.walking=dist>0;if(!a.walking){a.frame=0;return;}dx/=dist;dy/=dist;a.dir=Math.abs(dx)>Math.abs(dy)?dx<0?1:3:dy<0?2:0;const speed=(carrying?55:swimming&&place.water&&G.contains(place.water,a.x,a.y)?78:135)*dt;if(canStand(a.x+dx*speed,a.y))a.x+=dx*speed;if(canStand(a.x,a.y+dy*speed))a.y+=dy*speed;a.frame=Math.floor(elapsed*8)%4;}
 function updateScene(dt){
  const s=scene;if(!s||s.paused)return;Object.values(players).forEach(a=>movement(a,dt,true));
  if(s.kind==='golf'){
   s.age+=dt;$('sceneText').textContent=s.shots+' / 5 balls · '+s.score+' points. Aim and choose power, then take your shot.';
   if(s.flight){s.flight.age+=dt;if(s.flight.age>=1.5){let points=0;(place.art.golfTargets||[[400,410,75,33],[760,280,60,27],[1100,420,85,38],[800,540,70,31]]).forEach(([x,y,r,ry])=>{const d=Math.hypot((s.flight.x-x)/r,(s.flight.y-y)/ry);points=Math.max(points,d<.3?50:d<.7?25:d<1?10:0);});s.score+=points;s.shots++;s.flight=null;tone(points?7:0);if(s.shots===5){S.score(s.score);Y.complete('topgolf',{adventure:true,score:s.score});const score=s.score;endScene(false);sync();toast('Five balls · '+score+' points! Our scorecard is in the bag.');}}}return;
  }
  if(s.phase==='approach'){if(Object.values(players).every(a=>!a.path.length)){s.phase='playing';s.age=0;s.separation=35;sceneControls();}return;}
  if(s.phase==='leaving'){s.departure+=dt;if(s.departure>=.8)endScene(true);return;}
  if(s.drive){updateDrive(s,dt);return;}
  s.age+=dt;let at=0,found=null;for(const part of s.script){if(s.age<at+part[1]){found={pose:part[0],text:part[2],progress:(s.age-at)/part[1]};break;}at+=part[1];}
  if(!found){s.phase='leaving';s.departure=0;return;}s.current=found;s.separation+=(['hug','kiss'].includes(found.pose)?11-s.separation:35-s.separation)*Math.min(1,dt*5);let caption=found.text;
  if(s.node.scene==='baseball'){
   const beat=s.age%4;
   const cue=beat>=2&&beat<2.9?'HIT! Cheer now · E':beat<2?'Here comes the pitch…':'Watch for the next pitch.';
   caption=cue+' · '+(s.cheers||0)+' timed cheers';
  }
  if(s.plate)caption+=' '+s.plate.join(' · ');
  $('sceneText').textContent=caption;
 }
 function updateCamera(dt){const wide=place.id==='apartment'||scene&&['sky','fireworks','drive'].includes(scene.node.scene),stage=scene&&['concert','prayer','reunion'].includes(scene.node.scene),shot=place.art.camera||{x:790,y:410,zoom:1.12},middle=wide?{x:768,y:512}:stage&&scene.phase!=='approach'?shot:scene&&scene.phase!=='approach'?scene.anchor:{x:(players.him.x+players.her.x)/2,y:(players.him.y+players.her.y)/2};const sx=Math.abs(players.him.x-players.her.x),sy=Math.abs(players.him.y-players.her.y),wanted=overview||wide?Math.min(width/1536,height/1024)*.97:Math.max(.45,Math.min(stage?shot.zoom:scene?1.3:1.1,(width-90)/(sx+180),(height-250)/(sy+180)));scale+=(wanted-scale)*Math.min(1,dt*6);const hx=width/(2*scale),hy=height/(2*scale),xx=1536>hx*2?clamp(middle.x,hx,1536-hx):768,yy=1024>hy*2?clamp(middle.y,hy,1024-hy):512;camera.x+=(xx-camera.x)*Math.min(1,dt*5);camera.y+=(yy-camera.y)*Math.min(1,dt*5);}
 function update(dt){elapsed+=dt;if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('adventureToast').classList.remove('visible');}if(!$('adventureLoading').hidden)return;if(craft){craft.update(dt);return;}if($('adventurePanel').open)return;if(scene)updateScene(dt);else if(carrying){movement(players.him,dt);Object.assign(players.her,{x:players.him.x,y:players.him.y});}else Object.values(players).forEach(a=>movement(a,dt));
  if(swimming&&!carrying&&!state.flags['pool-crossed']&&Object.values(players).every(a=>a.x>place.water[0]+place.water[2]*.78&&G.contains(place.water,a.x,a.y))){S.task('pool-crossed',null,15);sync();toast('You both made it across! Climb out and meet by the loungers.');}
  near=null;if(!scene&&!carrying){let distance=Infinity;place.nodes.forEach(n=>{if(['collect','duck','pumpkin'].includes(n.action)&&nodeDone(n)||n.action==='pumpkin'&&(state.bag.pumpkin||0)>=2||n.action==='dry'&&!swimming||n.action==='swim'&&swimming||n.action==='carry'&&!atCarrySpot(n))return;const d=Math.min(...Object.values(players).map(a=>Math.hypot(a.x-n.x,a.y-n.y)));if(d<n.r&&d<distance){near=n;distance=d;}});}
  $('interact').hidden=!near&&!carrying;if(carrying||near)$('interactLabel').textContent=carrying?'Set Tanima down':near.name;updateCamera(dt);
 }
 function drawActor(a){
  const h=place.actorHeight;if(scene&&['playing','leaving'].includes(scene.phase)&&scene.current){
   const s=scene,i=a.who==='him'?-1:1;
   let pose=s.current.pose;
   if(pose==='ride')return;
   if(s.node.scene==='concert'||s.node.scene==='baseball'){
    pose=s.audience?.until>s.age?s.audience.pose:'sit';
   }
   const blend=s.phase==='leaving'?1-ease(s.departure/.8):ease(s.age/.8),slot=place.art.slots&&place.art.slots[s.node.scene]&&place.art.slots[s.node.scene][i<0?0:1];
   let targetX=slot?slot[0]:s.anchor.x+i*s.separation,targetY=slot?slot[1]:s.anchor.y;
   if(s.node.scene==='reunion'&&pose==='sit'&&place.art.reunionSeated){const seat=place.art.reunionSeated[i<0?0:1],sit=ease(s.current.progress*6/.9);targetX+=(seat[0]-targetX)*sit;targetY+=(seat[1]-targetY)*sit;}
   const mapped=pose==='kiss'?'hug':pose==='portrait'?'hold':pose==='gift'?'give':pose;poses.drawPose(a.who,a.x+(targetX-a.x)*blend,a.y+(targetY-a.y)*blend,h,mapped,s.age,a.who==='her');return;
  }
  if(scene&&scene.kind==='golf'&&scene.flight){poses.drawPose(a.who,a.x,a.y,h,a.who==='him'?'swing':'clap',elapsed,a.who==='her');return;}
  if(swimming&&place.water&&G.contains(place.water,a.x,a.y)){poses.drawPose(a.who,a.x,a.y,h,'swim',elapsed,a.who==='her');return;}
  const im=images[a.who];if(!im||!im.complete)return;
  ctx.fillStyle='#173a3635';ctx.beginPath();ctx.ellipse(a.x,a.y+2,13,4,0,0,Math.PI*2);ctx.fill();
  window.WalkingSprites.draw(ctx,im,a.dir,a.frame,a.x,a.y,h);
 }
 function carryRipples(x,y,gold){
  ctx.save();ctx.strokeStyle=gold?'#f6da8e':'#d8fbff';ctx.lineWidth=2;
  for(let i=0;i<2;i++){
   const phase=(elapsed*.9+i*.5)%1;
   ctx.globalAlpha=(1-phase)*.75;ctx.beginPath();
   ctx.ellipse(x,y,13+phase*26,4+phase*8,0,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
 }
 function drawCarry(){
  const {x,y,dir}=players.him,h=108,w=h*carrySprite.naturalWidth/carrySprite.naturalHeight,bob=Math.sin(elapsed*5)*2;
  ctx.save();ctx.translate(x,y);if(dir===1)ctx.scale(-1,1);
  ctx.beginPath();ctx.rect(-w/2,-h,w,h+3);ctx.clip();
  ctx.drawImage(carrySprite,-w/2,-h*.69+bob,w,h);
  ctx.restore();carryRipples(x,y+4,false);
 }
 function draw(){
  if(!ready)return;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#070b09';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.setTransform(scale*dpr,0,0,scale*dpr,(width/2-camera.x*scale)*dpr,(height/2-camera.y*scale)*dpr);ctx.imageSmoothingEnabled=false;ctx.drawImage(A.base(place),0,0);A.effects(ctx,place,elapsed,state,scene);
  const entities=place.props.map(o=>({y:o.y+o.h,draw:()=>A.mapProp(ctx,place,o,elapsed,state)}));if(swimming&&!carrying){const spot=place.nodes.find(n=>n.action==='carry');if(spot)carryRipples(spot.x,spot.y,true);}
  if(carrying)entities.push({y:players.him.y,draw:drawCarry});else Object.values(players).forEach(a=>entities.push({y:scene&&scene.phase==='playing'?scene.anchor.y:a.y,draw:()=>drawActor(a)}));entities.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());
  if(scene?.drive&&scene.phase==='playing'&&scene.current){
   const {x,y}=scene.anchor, gate=driveGates[scene.drive.gate];
   if(gate){
    const point=roadPoint(...gate),{E,T}=A.painter(ctx);
    E(point.x,point.y+12,25,11,'#f4c775aa');T(String(scene.drive.gate+1),point.x,point.y+18,15,'#322213');
   }
   A.prop(ctx,{kind:'jeep',x:x-85,y:y-70,w:170,h:90},scene.age,state);
  }
  if(scene&&scene.node.scene==='haunt-mirror'&&scene.phase!=='approach'){const [x,y,w,h]=place.art.mirrorArea;ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.globalAlpha=.32;poses.drawPose('him',x+w*.3,y+h,60,'hold',scene.age,true);poses.drawPose('her',x+w*.7,y+h,60,'hold',scene.age,false);ctx.restore();}
  A.effects(ctx,place,elapsed,state,scene,'over');
  if(near&&!scene){const {R}=A.painter(ctx),q=near.y-8+Math.sin(elapsed*3)*2;R(near.x-3,q,6,2,'#edcd82');R(near.x-1,q+2,2,2,'#edcd82');}
  if(debug.visible())debug.draw({
   id:place.id,collision:place.id+'|'+swimming+'|'+carrying,canStand,targets:place.nodes,spawn:place.spawn,
   players:Object.values(players),solidRects:place.props.filter(p=>p.solid!==false).map(p=>[p.x,p.y,p.w,p.h])
  });
  if(craft)craft.draw();
 }
 function loop(now){const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(!document.hidden){if(ready)update(dt);draw();}requestAnimationFrame(loop);}
 $('openBag').onclick=()=>{if(!carrying)bag();};$('openHere').onclick=()=>{if(!carrying)here();};$('openAtlas').onclick=atlas;$('openLooks').onclick=occasionLooks;$('interact').onclick=()=>act(near);$('touchAction').onclick=()=>act(scene?scene.node:near);$('closePanel').onclick=closePanel;$('adventurePanel').addEventListener('cancel',e=>{e.preventDefault();closePanel();});
 $('watchFilm').onclick=()=>{savePosition();location.href='memory-theater.html?film='+place.memory;};
 $('overviewButton').onclick=()=>{overview=!overview;$('overviewButton').setAttribute('aria-pressed',String(overview));$('overviewButton').textContent=overview?'Walk view':'Whole map';};
 $('adventureSound').onclick=()=>{try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();audio.resume();sound=!sound;$('adventureSound').textContent=sound?'Sound on ♫':'Sound off ♫';$('adventureSound').setAttribute('aria-pressed',String(sound));tone(4);}catch(e){toast('Sound is unavailable here.');}};
 addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if($('adventurePanel').open){if(k==='e'&&craft){e.preventDefault();craft.activate();}return;}if(k==='escape'&&carrying){releaseCarry();return;}if(k==='escape'&&scene){endScene(false);return;}if(!scene&&!carrying&&debug.key(e))return;if(scene?.drive&&['a','d','arrowleft','arrowright'].includes(k)){e.preventDefault();if(!e.repeat)steerDrive(['a','arrowleft'].includes(k)?-1:1);return;}if(k==='e'&&!e.repeat){e.preventDefault();act(scene?scene.node:near);return;}if(k===' '&&scene&&e.target.tagName!=='BUTTON'){e.preventDefault();act(scene.node);return;}if(k==='i'&&!scene&&!carrying&&!e.repeat){bag();return;}if(k==='m'&&!scene){$('overviewButton').click();return;}if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys[k]=true;});
 addEventListener('keyup',e=>delete keys[e.key.toLowerCase()]);addEventListener('blur',()=>keys={});document.addEventListener('visibilitychange',()=>{last=0;keys={};});
 document.querySelectorAll('[data-key]').forEach(b=>{const end=()=>delete keys[b.dataset.key];b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true;};b.onpointerup=end;b.onpointercancel=end;b.onlostpointercapture=end;});
 canvas.addEventListener('pointerup',e=>{if(!ready||scene||carrying||$('adventurePanel').open||debug.boxActive())return;const rect=canvas.getBoundingClientRect();const x=camera.x+((e.clientX-rect.left)*width/rect.width-width/2)/scale,y=camera.y+((e.clientY-rect.top)*height/rect.height-height/2)/scale;walkTo(x,y);});
 addEventListener('resize',resize);addEventListener('pagehide',savePosition);addEventListener('adventurechange',sync);addEventListener('wardrobechange',()=>refreshOutfits().catch(e=>toast(e.message)));addEventListener('focus',()=>{if(ready)refreshOutfits().catch(()=>{});});
 async function init(){try{await refreshOutfits();resize();await travel(place.id,true);ready=true;$('adventureLoading').hidden=true;}catch(e){$('adventureLoading').querySelector('p').textContent=e.message;$('retryAdventure').hidden=false;}}
 $('retryAdventure').onclick=init;resize();init();requestAnimationFrame(loop);
 window.memoryAdventure={getState:()=>({ready,debug:debug.state(),place:place.id,players:JSON.parse(JSON.stringify(players)),outfits:Object.fromEntries(Object.entries(images).map(([who,im])=>[who,im.src])),camera:{...camera,scale},near:near&&near.id,swimming,carrying,scene:scene&&{kind:scene.kind,phase:scene.phase,age:scene.age,action:scene.current&&scene.current.pose,checkpoints:scene.drive?.gate,timedCheers:scene.cheers||0},adventure:S.read()}),getMap:()=>place,canStand,pathfind:(from,to)=>G.pathfind(place,from,to,swimming)};
})();
