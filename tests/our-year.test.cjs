const test=require('node:test');
const {before}=test;
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const modulePaths=[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||path.resolve(__dirname,'..')];
const canvasLib=require(require.resolve('@napi-rs/canvas',{paths:modulePaths}));
const ROOT=path.resolve(__dirname,'..');
const src=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.style={};this.attributes={};this.listeners={};this.textContent='';this.value='';this.open=false;this.isConnected=true;this.classList={add(){},remove(){},contains(){return false;},toggle(){}};}
  appendChild(el){this.children.push(el);return el;}append(...els){this.children.push(...els);}replaceChildren(...els){this.children=els;}setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return this.attributes[k]||null;}addEventListener(k,v){(this.listeners[k]||=[]).push(v);}removeEventListener(k,v){this.listeners[k]=(this.listeners[k]||[]).filter(x=>x!==v);}focus(){}close(){this.open=false;}showModal(){this.open=true;}remove(){this.isConnected=false;}querySelector(){return new Element();}querySelectorAll(){return [];}scrollIntoView(){}click(){if(this.onclick)this.onclick();}
}
function storage(){const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};}
const decoded=new Map();
before(async()=>{
 const sharp=require(require.resolve('sharp',{paths:modulePaths}));
 const files=['assets/sprites/her_atlas.png','assets/sprites/him_atlas.png','assets/sprites/her_outfit5.png','assets/sprites/him_outfit6.png','assets/sprites/her_outfit12.png','assets/sprites/him_outfit12.png','assets/sprites/her_outfit13.png','assets/sprites/pool-carry.webp',...['neighborhood','mountains','festival'].map(n=>'assets/our-year/'+n+'.webp'),'assets/our-year/photos/usha-concert-1.jpg','assets/our-year/photos/usha-concert-2.jpg',...['detail','performance','sports'].map(n=>'assets/our-year/'+n+'-atlas.png')];
 if(fs.existsSync(path.join(ROOT,'assets/our-year/places')))files.push(...fs.readdirSync(path.join(ROOT,'assets/our-year/places')).filter(f=>f.endsWith('.webp')).map(f=>'assets/our-year/places/'+f));
 await Promise.all(files.map(async file=>{decoded.set(file,await sharp(path.join(ROOT,file)).ensureAlpha().raw().toBuffer({resolveWithObject:true}));}));
});
// Use the same raster pixels as the browser. The container's Skia build does
// not decode these C2PA PNGs itself, so Sharp supplies its unmodified pixels.
class Image{
 constructor(){const c=canvasLib.createCanvas(1,1);let url='',loaded=false;
  Object.defineProperties(c,{src:{get:()=>url,set:value=>{url=value;const file=String(value).split('?')[0],raw=decoded.get(file);if(raw){c.width=raw.info.width;c.height=raw.info.height;c.getContext('2d').putImageData(new canvasLib.ImageData(new Uint8ClampedArray(raw.data),c.width,c.height),0,0);loaded=true;queueMicrotask(()=>{if(c.onload)c.onload();});}else if(c.onerror)queueMicrotask(()=>c.onerror(new Error('Image fixture missing: '+file)));}},currentSrc:{get:()=>url},naturalWidth:{get:()=>loaded?c.width:0},naturalHeight:{get:()=>loaded?c.height:0},complete:{get:()=>loaded}});
  c.decode=()=>Promise.resolve();c.addEventListener=(name,fn)=>c['on'+name]=fn;return c;
 }
}

function canvas(w=960,h=570){const c=canvasLib.createCanvas(w,h);c.listeners={};c.style={};c.addEventListener=(k,v)=>(c.listeners[k]||=[]).push(v);c.removeEventListener=(k,v)=>c.listeners[k]=(c.listeners[k]||[]).filter(x=>x!==v);c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});c.setPointerCapture=()=>{};return c;}
function context(search=''){
  const elements=new Map(),events={};
  const document={body:new Element('body'),hidden:false,activeElement:new Element(),getElementById:id=>{if(!elements.has(id))elements.set(id,id==='world'||id==='adventureCanvas'?canvas():new Element());return elements.get(id);},createElement:tag=>tag==='canvas'?canvas(1,1):new Element(tag),querySelectorAll:()=>[],addEventListener(){}};
  const location={href:'https://example.test/memory-world.html'+search,search};
  const s={window:null,document,localStorage:storage(),sessionStorage:storage(),location,Image,URL,URLSearchParams,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},dispatchEvent:e=>(events[e.type]||[]).forEach(f=>f(e)),addEventListener:(type,fn)=>(events[type]||=[]).push(fn),requestAnimationFrame:()=>1,cancelAnimationFrame(){},innerWidth:1366,innerHeight:900,devicePixelRatio:1,performance,history:{replaceState(){}},console,setTimeout,clearTimeout};s.window=s;vm.createContext(s);return s;
}
function load(s,...files){files.forEach(file=>vm.runInContext(src(file),s,{filename:file}));return s;}
function fixture(id,session){const s=session||load(context(),'js/our-year-data.js','js/shared-wardrobe.js','js/our-year-activities.js'),c=canvas(),controls=new Element(),images={him:new Image(),her:new Image()},backgrounds={};images.him.src='assets/sprites/him_atlas.png';images.her.src='assets/sprites/her_atlas.png';for(const name of ['neighborhood','mountains','festival']){const im=new Image();im.src='assets/our-year/'+name+'.webp';backgrounds[name]=im;}let count=0,message='';
  const a=s.OurYearActivities.create(s.OUR_YEAR.byId(id),{canvas:c,controls,images,backdrops:backgrounds,status:text=>message=text,complete:(id,extra)=>{count++;s.OUR_YEAR.complete(id,extra);},tone(){},open(){},photo(){}});
  return {s,c,a,controls,count:()=>count,status:()=>message,click:text=>{const b=controls.children.find(b=>b.tagName==='BUTTON'&&b.textContent.startsWith(text));assert.ok(b,'Missing button '+text);b.click();},tick:secs=>{for(let i=0;i<Math.ceil(secs*60);i++)a.update(1/60);},draw:()=>{a.draw();return c.toBuffer('image/png');}};
}

test('all supplied occasions have reachable memory records and photo files',()=>{
 const s=load(context(),'js/our-year-data.js');assert.equal(s.OUR_YEAR.memories.length,17);for(const m of s.OUR_YEAR.memories){assert.ok(m.text.length>40);for(const p of m.photos)assert.ok(fs.existsSync(path.join(ROOT,p.src)),p.src);}for(const name of ['Lunar eclipse','Blood moon','Blue moon','Meteor shower','Planets over Birmingham'])assert.ok(src('js/our-year-activities.js').includes(name));
});
test('the existing ground map and the whole forest swing stay unchanged',()=>{
 const ground='assets/maps/skyroot-grounds.png';assert.equal(execFileSync('git',['hash-object',ground],{cwd:ROOT,encoding:'utf8'}).trim(),execFileSync('git',['rev-parse','HEAD:'+ground],{cwd:ROOT,encoding:'utf8'}).trim());
 const groundBlock=text=>text.split('    grounds:{')[1].split('    treehouse:{')[0];assert.equal(groundBlock(src('js/skyroot.js')),groundBlock(execFileSync('git',['show','HEAD:js/skyroot.js'],{cwd:ROOT,encoding:'utf8'})));
 for(const file of ['js/forest-swing.js','assets/maps/skyroot-treehouse.png'])if(fs.existsSync(path.join(ROOT,file)))assert.equal(execFileSync('git',['hash-object',file],{cwd:ROOT,encoding:'utf8'}).trim(),execFileSync('git',['rev-parse','HEAD:'+file],{cwd:ROOT,encoding:'utf8'}).trim());
});
test('a replay keeps every sky separate and resumes partial skywatching',()=>{
 const f=fixture('sky');for(let i=0;i<3;i++){f.click(['Lunar','Blood','Blue'][i]);f.a.activate();f.tick(4.2);f.draw();}assert.equal(f.count(),0);const next=fixture('sky',f.s);assert.equal(next.a.getState().watched.length,3);for(const label of ['Meteor shower','Planets']){next.click(label);next.a.activate();next.tick(4.2);next.draw();}assert.equal(next.count(),1);assert.equal(next.a.getState().watched.length,5);
});
test('homecoming and park walks complete after their choreography',()=>{
 const home=fixture('homecoming');for(let i=0;i<4;i++)home.a.activate();assert.equal(home.count(),0);home.tick(5);home.draw();assert.equal(home.count(),1);
 const park=fixture('park');for(let i=0;i<4;i++){park.a.activate();park.tick(3);park.draw();}assert.equal(park.count(),0);park.a.activate();assert.equal(park.count(),1);
});
test('the baseball first ends with fireworks and swimming travels across the pool',()=>{
 const f=fixture('baseball');for(let i=0;i<4;i++)f.a.activate();f.tick(4);assert.equal(f.count(),0);f.draw();f.tick(4);assert.equal(f.count(),1);
 const swim=fixture('swimming');for(let i=0;i<5;i++)swim.a.activate();assert.equal(swim.count(),0);swim.tick(2.5);swim.draw();assert.equal(swim.count(),1);assert.equal(swim.a.getState().progress,1);
});
test('Topgolf scores an aimed target, waits for flight, and finishes exactly five balls',()=>{
 const f=fixture('topgolf');const aim=f.controls.children.find(e=>e.textContent==='Aim').children[0],power=f.controls.children.find(e=>e.textContent==='Power').children[0];aim.value=-65.625;aim.oninput();power.value=56.25;power.oninput();for(let i=0;i<5;i++){f.a.activate();f.a.activate();assert.equal(f.a.getState().shots,i);f.tick(1.3);f.draw();}assert.equal(f.count(),1);assert.equal(f.a.getState().shots,5);assert.equal(f.a.getState().score,250);
});
test('the mountain trip leads into all ten Astra stations and resumes the trail',()=>{
 const trip=fixture('jeep');for(let i=0;i<4;i++){trip.a.activate();trip.tick(4);trip.draw();}assert.equal(trip.count(),1);
 const first=fixture('astra');for(let i=0;i<3;i++){first.a.activate();first.tick(5);first.draw();}const resumed=fixture('astra',first.s);assert.equal(resumed.a.getState().stage,3);for(let i=3;i<10;i++){resumed.a.activate();resumed.tick(5);resumed.draw();}assert.equal(resumed.count(),1);assert.equal(resumed.a.getState().flags.length,10);assert.equal(first.s.OUR_YEAR.read().completed.astra.stations.length,10);
});
test('the concert, Puja lamps, and gift box play to completion',()=>{
 const concert=fixture('concert');for(let i=0;i<12;i++)concert.a.activate();concert.draw();assert.equal(concert.count(),1);
 const puja=fixture('puja');for(let i=0;i<4;i++)puja.a.activate();puja.draw();assert.equal(puja.count(),0);puja.a.activate();puja.tick(4.2);assert.equal(puja.count(),1);
 const ring=fixture('ring');const before=ring.draw();ring.a.activate();ring.tick(.8);assert.notDeepEqual(before,ring.draw());ring.a.activate();assert.equal(ring.count(),1);
});
test('community memories require four distinct visits',()=>{
 const f=fixture('community');f.click('Culture');f.click('✓ Culture');assert.equal(f.a.getState().flags.length,1);for(const text of ['Drama','Kirtan','Vegetarian'])f.click(text);f.draw();assert.equal(f.count(),1);
});
test('pumpkins can be picked by pointer and both carvings are required and saved',()=>{
 const f=fixture('pumpkins'),event=(x,y)=>({type:'pointerdown',clientX:x,clientY:y,pointerId:1});f.c.listeners.pointerdown[0](event(125,390));f.c.listeners.pointerdown[0](event(125,390));assert.equal(f.a.getState().picked.length,1);f.c.listeners.pointerdown[0](event(270,390));f.draw();assert.equal(f.count(),1);
 const carve=fixture('carving');carve.a.activate();carve.tick(.2);assert.match(carve.status(),/both pumpkins/);assert.equal(carve.count(),0);carve.click('Classic');carve.click('Pumpkin 2');carve.click('Draw my own');for(const ev of [{type:'pointerdown',clientX:470,clientY:290},{type:'pointermove',clientX:490,clientY:310},{type:'pointerup',clientX:490,clientY:310}])carve.c.listeners[ev.type][0]({...ev,pointerId:1});carve.draw();carve.a.activate();assert.equal(carve.count(),1);assert.equal(carve.s.OUR_YEAR.detail('carving').carvings[1].strokes[0].length,2);
});
test('the haunted house exits after four doors, and Addams looks enter the shared closet',()=>{
 const haunt=fixture('haunt');haunt.click('Gentle scares');for(let i=0;i<4;i++){haunt.a.activate();haunt.tick(2.6);haunt.draw();}assert.equal(haunt.count(),1);assert.equal(haunt.a.getState().quiet,true);
 const addams=fixture('addams');addams.a.activate();addams.draw();assert.equal(addams.count(),1);const w=addams.s.SharedWardrobe.read();assert.equal(w.equipped.her,'addams-morticia');assert.equal(w.equipped.him,'addams-gomez');assert.equal(addams.s.localStorage.getItem('herOutfit'),'5');
});
test('outfit painting preserves all sixteen frames, alpha, feet, and face pixels',async()=>{
 const s=load(context(),'js/shared-wardrobe.js');for(const [who,kind,base] of [['her','saree',1],['her','dress',5],['him','suit',6]]){
  const d={who,kind,color:'#357e86',trim:'#efb5ce',pattern:'flowers',strokes:[{color:'#faf4c6',size:.04,points:[[.4,.7],[.5,.8],[.6,.7]]}]};const rendered=await s.SharedWardrobe.render(d,false);assert.equal(rendered.width,1024);assert.equal(rendered.height,1024);const original=new Image();original.src='assets/sprites/'+who+(base===1?'_atlas':'_outfit'+base)+'.png';const c=canvas(1024,1024);c.getContext('2d').drawImage(original,0,0);const a=c.getContext('2d').getImageData(0,0,1024,1024).data,b=rendered.getContext('2d').getImageData(0,0,1024,1024).data;let changed=0;
  for(let i=0;i<a.length;i+=4){assert.equal(a[i+3],b[i+3],'alpha stays fixed');if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])changed++;const y=Math.floor(i/4/1024)%256;if(y<105){for(let k=0;k<3;k++)assert.ok(Math.abs(a[i+k]*a[i+3]/255-b[i+k]*b[i+3]/255)<=1.1,'face '+kind+' x='+((i/4)%1024)+' y='+Math.floor(i/4/1024)+' alpha='+a[i+3]+' before='+a[i+k]+' after='+b[i+k]);}}
  assert.ok(changed>1000,who+' '+kind+' must visibly change the garment');
 }
});
test('every world entrance is reachable on foot and actor scale fits the doors',async()=>{
 for(const area of ['home','mountains','festival']){const s=load(context('?area='+area),'js/our-year-data.js','js/our-year-world.js');await new Promise(resolve=>setImmediate(resolve));assert.equal(s.memoryWorld.getState().ready,true);const map=s.memoryWorld.getMap(),actor=s.memoryWorld.getState().players.him;assert.equal(map.actorHeight,44);for(const zone of map.zones){const route=s.memoryWorld.pathfind(actor,zone.x,zone.y);assert.ok(route.length,area+'/'+zone.name+' has a route');const last=route[route.length-1];assert.ok(Math.hypot(last.x-zone.x,last.y-zone.y)<zone.r,zone.name+' can activate');assert.ok(route.every(pt=>s.memoryWorld.canStand(pt.x,pt.y)));}}
});
test('the original photo booth gives the necklace before the question, then saves the first yes',()=>{
 const s=load(context(),'js/our-year-data.js','js/shared-wardrobe.js');const player=x=>({x,y:420,dir:'down',frame:0,frames:{down:[0,1,2,3],up:[0,1,2,3],left:[0,1,2,3],right:[0,1,2,3]}});
 Object.assign(s,{players:{him:player(880),her:player(910)},keys:{},camera:{x:0,y:0},canvas:canvas(),ctx:canvas().getContext('2d'),photoBoothBox:{x:870,y:350,w:80,h:80},boxCenter:b=>({x:b.x+b.w/2,y:b.y+b.h/2}),shoppingAction:null,photoStrip:null,photoFlash:0,shoppingCooldown:0,heartTimer:0,update(){},draw(){},drawDebugZones(){},drawPixelHeart(){},drawDebugRect(){},drawDebugText(){},debugMode:false});load(s,'js/shopping-photo-booth-memory.js');vm.runInContext('startSpecialPhotoScene()',s);const phases=[];for(let i=0;i<1800;i++){const phase=vm.runInContext('specialPhotoScene&&specialPhotoScene.phase',s);if(phase&&!phases.includes(phase))phases.push(phase);vm.runInContext('update()',s);if(!vm.runInContext('!!specialPhotoScene',s))break;}
 assert.deepEqual(phases,['walkOut','bubbles','necklace','ask','yesWalk','hold','print']);assert.ok(s.OUR_YEAR.read().completed.necklace);assert.equal(s.SharedWardrobe.read().necklace,true);
});
test('the Speed Force retains its chase but now lands in the new map',()=>{const s=load(context(),'js/speed-force-worlds.js');const cfg=s.SPEED_FORCE_MULTIVERSE;assert.equal(cfg.worlds.length,5);assert.equal(cfg.worlds[4].asset,'assets/our-year/neighborhood.webp');assert.equal(cfg.destination.url,'memory-world.html?from=speed-force');assert.equal(cfg.tunnel.asset,'assets/multiverse/speed-force-tunnel.webp');});

function filmFixture(id){
 const s=load(context(),'js/our-year-data.js','js/shared-wardrobe.js','js/our-year-films.js','js/our-year-cinema.js','js/our-year-activities.js');
 const c=canvas(),controls=new Element(),images={him:new Image(),her:new Image()};images.him.src='assets/sprites/him_atlas.png';images.her.src='assets/sprites/her_atlas.png';
 let completions=0,message='';const options={canvas:c,controls,images,backdrops:{},status:t=>message=t,complete:(id,extra)=>{completions++;s.OUR_YEAR.complete(id,extra);},tone(){},open(){},photo(){}};
 const a=s.OurYearActivities.create(s.OUR_YEAR.byId(id),options);
 return {s,c,controls,images,a,options,count:()=>completions,status:()=>message};
}
test('all 17 memories default to films, complete once after their ending, and keep interactive activities',()=>{
 const ids=load(context(),'js/our-year-data.js').OUR_YEAR.memories.map(m=>m.id);
 for(const id of ids){const f=filmFixture(id);assert.equal(f.a.getState().mode,'film',id);const duration=f.a.getState().duration;assert.ok(duration>=30,id+' has staged time');assert.equal(f.count(),0);for(let i=0;i<duration*20+2;i++)f.a.update(.05);assert.equal(f.count(),1,id+' completes at end');assert.equal(f.a.getState().paused,true);f.a.update(.1);assert.equal(f.count(),1,'completion is idempotent');const button=f.controls.children.find(b=>b.textContent==='Play the activity ↗');assert.ok(button);button.click();assert.equal(f.a.getState().mode,'activity');f.a.dispose();}
});
test('film pause, chapter selection, replay and seek control the actual rendered timeline',()=>{
 const f=filmFixture('astra');f.a.update(.1);f.a.pause();const at=f.a.getState().time;for(let i=0;i<20;i++)f.a.update(.05);assert.equal(f.a.getState().time,at);f.a.seek(40);assert.equal(f.a.getState().chapter,4);f.a.draw();assert.match(f.status(),/Nebular Waves/);assert.equal(f.count(),0,'seeking does not immediately complete');f.a.play();f.a.update(.1);assert.ok(f.a.getState().time>40);f.controls.children.find(b=>b.textContent==='Replay ↻').click();assert.equal(f.a.getState().time,0);assert.equal(f.a.getState().paused,false);f.a.dispose();const previous=f.a.getState().time;f.a.update(1);assert.equal(f.a.getState().time,previous,'disposed directors stop');
});
test('every chapter renders from sprites and drawings with no photographs, and movement changes frames',async()=>{
 const output=process.env.RENDER_FILMS;let index=0;
 const f0=filmFixture('homecoming');
 for(const memory of f0.s.OUR_YEAR.memories){
  const f=filmFixture(memory.id),photos=[];await new Promise(resolve=>setImmediate(resolve));const real=f.c.getContext('2d').drawImage.bind(f.c.getContext('2d'));f.c.getContext('2d').drawImage=(im,...args)=>{if(im.src&&im.src.includes('/photos/'))photos.push(im.src);return real(im,...args);};
  let previous=null;const shots=f.s.OurYearFilms.get(memory.id);for(const shot of shots){f.a.seek(shot.start+shot.duration*.35);f.a.draw();const a=f.c.toBuffer('image/png');f.a.seek(shot.start+shot.duration*.7);f.a.draw();const b=f.c.toBuffer('image/png');assert.notDeepEqual(a,b,memory.id+'/'+shot.title+' animates');if(previous)assert.notDeepEqual(previous,b,'chapters have different scenery/poses');previous=b;}
  assert.deepEqual(photos,[],memory.id+' film never draws a relationship photo');
  if(output){fs.mkdirSync(output,{recursive:true});const shot=shots[Math.min(2,shots.length-1)];f.a.seek(shot.start+shot.duration*.65);f.a.draw();fs.writeFileSync(path.join(output,String(++index).padStart(2,'0')+'-'+memory.id+'.png'),f.c.toBuffer('image/png'));}
  f.a.dispose();
 }
});
test('film viewing does not silently change clothing; Addams equip remains an explicit action',async()=>{
 const f=filmFixture('addams'),before=JSON.stringify(f.s.SharedWardrobe.read());await new Promise(resolve=>setImmediate(resolve));f.a.seek(17);f.a.draw();assert.equal(JSON.stringify(f.s.SharedWardrobe.read()),before);f.controls.children.find(b=>b.textContent==='Wear our Addams looks').click();assert.equal(f.s.SharedWardrobe.read().equipped.her,'addams-morticia');
});
test('all ten Astra installations and the necklace gift order are staged as separate chapters',()=>{
 const f=filmFixture('astra');assert.equal(f.s.OurYearFilms.get('astra').length,10);assert.deepEqual(Array.from(f.s.OurYearFilms.get('necklace'),s=>s.action),['booth','gift','ask','yes','print']);assert.ok(f.s.OurYearFilms.get('jeep').some(s=>s.action==='gathering'));assert.ok(f.s.OurYearFilms.get('park').some(s=>s.action==='sit'));assert.ok(f.s.OurYearFilms.get('swimming').some(s=>s.action==='swim'));
});

test('all 14 adventure maps have reachable entrances, activities, and correctly scaled characters',()=>{
 const s=load(context(),'js/adventure-places.js','js/adventure-layouts.js','js/adventure-geometry.js');assert.equal(Object.keys(s.AdventurePlaces.places).length,14);
 for(const place of Object.values(s.AdventurePlaces.places)){
  assert.equal(place.actorHeight,place.id==='apartment'?128:['concert','halloween','haunt','community'].includes(place.id)?96:74);const spawn=s.AdventureGeometry.nearest(place,...place.spawn);assert.ok(spawn,place.id+' has a safe spawn');
  for(const n of place.nodes){if(n.action==='carry')continue;const route=s.AdventureGeometry.pathfind(place,spawn,n);assert.ok(route.length||Math.hypot(n.x-spawn.x,n.y-spawn.y)<n.r,place.id+'/'+n.id+' has a route');const end=route[route.length-1]||spawn;assert.ok(Math.hypot(n.x-end.x,n.y-end.y)<n.r,place.id+'/'+n.id+' can be activated');assert.ok(route.every(p=>s.AdventureGeometry.canStand(place,p.x,p.y)),place.id+'/'+n.id+' route avoids obstacles');}
 }
 const pool=s.AdventurePlaces.places.pool;assert.equal(s.AdventureGeometry.canStand(pool,750,500),false);assert.equal(s.AdventureGeometry.canStand(pool,750,500,true),true);
});
test('adventure coins, unique collectibles, snacks, and cross-map inventory persist without duplicate rewards',()=>{
 const s=load(context(),'js/adventure-places.js','js/adventure-layouts.js','js/adventure-state.js');const S=s.AdventureState;assert.equal(S.read().coins,120);S.task('first-visit',null,8);S.task('first-visit',null,8);assert.equal(S.read().coins,128);
 assert.equal(S.purchase('pool-float',15).ok,true);assert.equal(S.purchase('pool-float',15).ok,false);assert.equal(S.read().coins,113);assert.equal(S.purchase('festival-fabric',999).ok,false);assert.equal(S.read().coins,113);
 S.collect('pumpkin','pumpkin-0');S.collect('pumpkin','pumpkin-0');S.collect('pumpkin','pumpkin-1');assert.equal(S.read().bag.pumpkin,2);assert.equal(S.purchase('popcorn',8).ok,true);assert.equal(S.consume('popcorn'),true);assert.equal(S.consume('popcorn'),false);S.markVisited('apartment');assert.equal(S.read().bag.pumpkin,2);assert.equal(S.read().visited.apartment,true);
 assert.throws(()=>S.purchase('popcorn',-10));S.score(125);assert.equal(S.read().scores[0].score,125);assert.equal(S.read().bag['golf-scorecard'],1);
});
test('each adventure map renders its own spatial layout and visible props',async()=>{
 const s=load(context(),'js/our-year-data.js','js/adventure-places.js','js/adventure-layouts.js','js/adventure-art.js');const hashes=new Set(),crypto=require('node:crypto');s.AdventureArt.pin('apartment');
 for(const place of Object.values(s.AdventurePlaces.places)){const im=await s.AdventureArt.load(place);assert.equal(im.naturalWidth,1536);assert.equal(im.naturalHeight,1024);const c=canvas(1536,1024),p=c.getContext('2d');p.drawImage(s.AdventureArt.base(place),0,0);const state={flags:{},bag:{},sky:0};place.props.forEach(o=>s.AdventureArt.mapProp(p,place,o,1,state));s.AdventureArt.effects(p,place,1,state,null);const data=c.toBuffer('image/png');assert.ok(data.length>10000,place.id+' has scenery');hashes.add(crypto.createHash('sha256').update(data).digest('hex'));if(process.env.RENDER_MAPS){fs.mkdirSync(process.env.RENDER_MAPS,{recursive:true});fs.writeFileSync(path.join(process.env.RENDER_MAPS,place.id+'.png'),data);}}
 assert.equal(hashes.size,14,'every map has distinct artwork');assert.equal(s.AdventureArt.isPainted('apartment'),true,'atlas thumbnails never evict the active map');
});
test('map events stage scenes in the world and complete prerequisites before saving keepsakes',async()=>{
 const s=load(context('?place=apartment'),'js/shared-wardrobe.js','js/our-year-data.js','js/our-year-films.js','js/our-year-cinema.js','js/our-year-activities.js','js/adventure-places.js','js/adventure-layouts.js','js/adventure-state.js','js/adventure-geometry.js','js/adventure-art.js');
 vm.runInContext(src('js/memory-adventure.js').replace('window.memoryAdventure={','window.__adventureTest={act,travel,update,draw,players,placeAt,endScene};window.memoryAdventure={'),s);await new Promise(resolve=>setImmediate(resolve));assert.equal(s.memoryAdventure.getState().ready,true);
 const access=s.__adventureTest,place=s.AdventurePlaces.places.apartment;
 access.act(place.nodes.find(n=>n.id==='reunion'));assert.equal(s.memoryAdventure.getState().scene,null,'reunion waits for its preparations');
 for(const id of ['roses','banner','vase','dinner']){access.act(place.nodes.find(n=>n.id===id));access.endScene(false);}
 access.placeAt(760,520);access.act(place.nodes.find(n=>n.id==='reunion'));for(let i=0;i<1800;i++)access.update(1/60);access.draw();assert.equal(s.memoryAdventure.getState().scene,null);assert.ok(s.AdventureState.read().bag['home-photo']);assert.ok(s.OUR_YEAR.read().completed.homecoming);
 access.travel('pumpkins');await new Promise(resolve=>setImmediate(resolve));const patch=s.AdventurePlaces.places.pumpkins;for(const id of ['pumpkin0','pumpkin1','pumpkin2']){access.act(patch.nodes.find(n=>n.id===id));access.endScene(false);}assert.equal(s.AdventureState.read().bag.pumpkin,2,'only our pair is picked');
 access.travel('apartment');assert.equal(s.AdventureState.read().bag.pumpkin,2,'our pumpkins travel home');
});

// Optional review artifact, rendered through the same director as the browser.
// This is intentionally opt-in, never a prerequisite for running the tests.
if(process.env.FILM_TRAILER)test('export a short scene from each of the 17 films',async()=>{
 const {spawn}=require('node:child_process'),destination=process.env.FILM_TRAILER;
 fs.mkdirSync(path.dirname(destination),{recursive:true});
 const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size','960x570','-framerate','18','-i','pipe:0','-vf','scale=768:456','-c:v','libx264','-preset','veryfast','-crf','25','-pix_fmt','yuv420p','-movflags','+faststart',destination]);
 let errors='';ff.stderr.on('data',b=>errors+=b);const ended=new Promise((resolve,reject)=>{ff.on('error',reject);ff.on('close',code=>code===0?resolve():reject(new Error(errors)));});
 const ids=load(context(),'js/our-year-data.js').OUR_YEAR.memories.map(m=>m.id);
 for(const [index,id] of ids.entries()){
  const f=filmFixture(id);await new Promise(resolve=>setImmediate(resolve));
  const shots=f.s.OurYearFilms.get(id),pick=id==='baseball'?3:id==='sky'?4:id==='astra'?3:Math.min(2,shots.length-1),shot=shots[pick];
  for(let n=0;n<54;n++){
   f.a.seek(shot.start+1+n/18);f.a.draw();const p=f.c.getContext('2d');p.fillStyle='#102421';p.fillRect(0,0,960,34);p.fillStyle='#e5cc99';p.font='17px Georgia';p.textAlign='left';p.fillText(String(index+1).padStart(2,'0')+' / '+ids.length+'  ·  '+f.s.OUR_YEAR.byId(id).title,24,23);
   const pixels=p.getImageData(0,0,960,570).data;await new Promise((resolve,reject)=>ff.stdin.write(Buffer.from(pixels.buffer),error=>error?reject(error):resolve()));
  }f.a.dispose();
 }
 ff.stdin.end();await ended;assert.ok(fs.statSync(destination).size>10000);
});

async function adventureFixture(id='park'){
 const s=load(context('?place='+id),'js/shared-wardrobe.js','js/our-year-data.js','js/our-year-films.js','js/our-year-cinema.js','js/our-year-activities.js','js/adventure-places.js','js/adventure-layouts.js','js/adventure-state.js','js/adventure-geometry.js','js/adventure-art.js');
 vm.runInContext(src('js/memory-adventure.js').replace('window.memoryAdventure={','window.__adventureTest={act,travel,update,draw,players,placeAt,endScene,shoot};window.memoryAdventure={'),s);await new Promise(resolve=>setImmediate(resolve));
 const a=s.__adventureTest;return {s,a,tick:seconds=>{for(let i=0;i<Math.ceil(seconds*60);i++)a.update(1/60);},act:id=>a.act(s.memoryAdventure.getMap().nodes.find(n=>n.id===id)),travel:async id=>{await a.travel(id);},state:()=>s.memoryAdventure.getState()};
}
test('support atlases have 16 complete transparent cells with consistent feet and distinct animation frames',()=>{
 for(const name of ['detail','performance','sports']){const raw=decoded.get('assets/our-year/'+name+'-atlas.png');assert.equal(raw.info.width,1024);assert.equal(raw.info.height,1024);let transparent=0;const signatures=[];
  for(let cell=0;cell<16;cell++){let count=0,minX=256,maxX=0,minY=256,maxY=0,signature=0;for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=((Math.floor(cell/4)*256+y)*1024+cell%4*256+x)*4,a=raw.data[i+3];if(!a)transparent++;if(a>32){count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);signature=(signature+raw.data[i]*(x+1)+raw.data[i+1]*(y+1))%2147483647;}}
   assert.ok(count>400,name+' cell '+cell+' contains art');assert.ok(minX>2&&maxX<253&&minY>2&&maxY<251,name+' cell '+cell+' keeps its full silhouette');assert.ok(maxY>=235&&maxY<=241,name+' cell '+cell+' has a stable feet baseline');signatures.push(signature);
  }assert.ok(transparent>250000,name+' is really transparent');if(name!=='detail')for(let row=0;row<4;row++)assert.equal(new Set(signatures.slice(row*4,row*4+4)).size,4,name+' row '+row+' animates');
 }
});
test('both characters physically follow every new art-aligned route without getting caught on furniture',async()=>{
 const f=await adventureFixture();for(const place of Object.values(f.s.AdventurePlaces.places)){await f.travel(place.id);for(const n of place.nodes){if(['dry','carry'].includes(n.action))continue;f.a.placeAt(...place.spawn);for(const [i,a] of Object.values(f.a.players).entries())a.path=f.s.AdventureGeometry.pathfind(place,a,{x:n.x+(i?29:-29),y:n.y});f.tick(50);for(const a of Object.values(f.a.players)){assert.equal(a.path.length,0,place.id+'/'+n.id+'/'+a.who+' reaches the end: '+JSON.stringify({x:a.x,y:a.y,next:a.path[0],last:a.path[a.path.length-1]}));assert.ok(Math.hypot(a.x-n.x,a.y-n.y)<n.r,place.id+'/'+n.id+'/'+a.who+' can interact');}}}
});
test('the pool carry requires both swimmers at the marker and can be released and repeated',async()=>{
 const f=await adventureFixture('pool'),spot=f.s.memoryAdventure.getMap().nodes.find(n=>n.id==='carry');
 const press=(type,key)=>f.s.dispatchEvent({type,key,target:{tagName:'CANVAS'},preventDefault(){}});
 const interact=f.s.document.getElementById('interact');
 f.act('carry');assert.equal(f.state().carrying,false);
 f.act('swim');f.tick(5);
 const [x,y]=[spot.x,spot.y];
 const {him,her}=f.a.players;
 for(const [a,dx] of [[him,-29],[her,29]])a.path=f.s.memoryAdventure.pathfind(a,{x:x+dx,y});
 f.tick(8);assert.equal(f.state().near,'carry','both can swim to the marker from the ladder');
 her.x=x+spot.r+10;f.tick(.1);assert.notEqual(f.state().near,'carry');
 her.x=x+29;f.tick(.1);press('keydown','e');assert.equal(f.state().carrying,true);
 press('keydown','d');f.tick(1);press('keyup','d');
 assert.ok(him.x>x);assert.equal(her.x,him.x);assert.equal(her.y,him.y);
 f.a.draw();
 press('keydown','s');f.tick(6);press('keyup','s');
 assert.ok(him.y<720&&her.y===him.y,'the carrying pair stays in the pool');
 interact.click();f.tick(.1);assert.equal(f.state().carrying,false);assert.equal(f.state().swimming,true);assert.notEqual(him.x,her.x);
 f.a.placeAt(x,y);f.tick(.1);interact.click();assert.equal(f.state().carrying,true);
 await f.travel('park');assert.equal(f.state().carrying,false);assert.equal(f.state().swimming,false);
});
test('the explorable pool can be crossed and climbed out of; a native golf round records exactly five flights',async()=>{
 const f=await adventureFixture('pool');f.a.placeAt(430,735);f.act('swim');f.a.placeAt(1100,835);f.tick(.1);assert.equal(f.s.AdventureState.read().flags['pool-crossed'],undefined,'walking around the deck does not count as swimming');f.a.placeAt(430,735);f.act('swim');f.tick(5);assert.equal(f.state().swimming,true);
 for(const a of Object.values(f.a.players))a.path=f.s.memoryAdventure.pathfind(a,{x:a.who==='him'?1060:1110,y:500});
 f.tick(15);assert.ok(f.s.AdventureState.read().flags['pool-crossed']);f.a.draw();f.act('exit-water');assert.equal(f.state().swimming,false);assert.ok(Object.values(f.a.players).every(a=>f.s.memoryAdventure.canStand(a.x,a.y)));f.a.placeAt(600,400);f.act('rest');f.tick(20);assert.ok(f.s.OUR_YEAR.read().completed.swimming);
 await f.travel('golf');f.a.placeAt(768,775);f.act('play');const controls=f.s.document.getElementById('sceneControls'),aim=controls.children.find(e=>e.textContent==='Aim').children[0],power=controls.children.find(e=>e.textContent==='Power').children[0];aim.value=-54.5;aim.oninput();power.value=74;power.oninput();
 for(let i=0;i<5;i++){f.a.shoot();f.a.shoot();f.tick(1.6);f.a.draw();}assert.equal(f.state().scene,null);assert.equal(f.s.AdventureState.read().scores.length,1);assert.equal(f.s.AdventureState.read().scores[0].score,250);assert.ok(f.s.AdventureState.read().bag['golf-scorecard']);assert.ok(f.s.OUR_YEAR.read().completed.topgolf);
});
test('all ten walkable Astra stations enforce order, animate, and save the completed trail once',async()=>{
 const f=await adventureFixture('astra');f.act('station2');assert.equal(f.state().scene,null);for(let i=0;i<10;i++){const n=f.s.memoryAdventure.getMap().nodes.find(n=>n.id==='station'+i);f.a.placeAt(n.x,n.y);f.act(n.id);f.tick(5);f.a.draw();f.tick(12);assert.ok(f.s.AdventureState.read().flags['astra-'+i]);}
 assert.equal(f.s.OUR_YEAR.detail('astra').visited.length,10);assert.ok(f.s.OUR_YEAR.read().completed.astra);assert.equal(f.s.AdventureState.read().bag['astra-photo'],1);f.act('station9');f.tick(17);assert.equal(f.s.AdventureState.read().bag['astra-photo'],1);
});
test('map scenes animate the ballgame, band, festival and mirror; skies and fireworks frame the whole world',async()=>{
 const f=await adventureFixture();for(const [place,id] of [['stadium','game'],['concert','seat'],['community','culture'],['community','drama'],['community','music'],['haunt','mirror']]){
  await f.travel(place);const n=f.s.memoryAdventure.getMap().nodes.find(n=>n.id===id);(n.needsFlags||[]).forEach(flag=>f.s.AdventureState.task(flag));f.a.placeAt(n.x,n.y);f.act(id);f.tick(4);f.a.draw();const c=f.s.document.getElementById('adventureCanvas'),before=c.toBuffer('image/png');f.tick(.6);f.a.draw();assert.notDeepEqual(before,c.toBuffer('image/png'),place+'/'+id+' visibly animates');f.a.endScene(false);
 }
 for(const [place,id] of [['observatory','blanket'],['stadium','fireworks']]){await f.travel(place);const n=f.s.memoryAdventure.getMap().nodes.find(n=>n.id===id);(n.needsFlags||[]).forEach(flag=>f.s.AdventureState.task(flag));f.a.placeAt(n.x,n.y);f.act(id);f.tick(5);f.a.draw();const c=f.state().camera;assert.ok(c.y-450/c.scale<100,'sky is in frame');assert.ok(c.y+450/c.scale>n.y,'both characters stay in frame');f.a.endScene(false);}
});

// A reproducible preview of the actual walkable maps and their native scenes.
// The web game has no dependency on Node or FFmpeg.
if(process.env.MAP_TRAILER)test('export an adventure tour from the live map engine',async()=>{
 const {spawn}=require('node:child_process'),destination=process.env.MAP_TRAILER;fs.mkdirSync(path.dirname(destination),{recursive:true});
 const f=await adventureFixture('apartment'),world=f.s.document.getElementById('adventureCanvas'),out=canvas(768,506),p=out.getContext('2d');
 const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size','768x506','-framerate','15','-i','pipe:0','-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',destination]);
 let errors='';ff.stderr.on('data',b=>errors+=b);const ended=new Promise((resolve,reject)=>{ff.on('error',reject);ff.on('close',code=>code===0?resolve():reject(new Error(errors)));});
 f.s.document.getElementById('overviewButton').click();const shots=[['apartment','reunion'],['observatory','blanket'],['park','bench'],['stadium','game'],['stadium','fireworks'],['pool','swim'],['golf','play'],['jeep','road'],['astra','station4'],['concert','seat'],['puja','quiet'],['community','culture'],['pumpkins','pumpkin0'],['haunt','mirror'],['halloween','dance']];
 for(const [index,[place,id]] of shots.entries()){
  await f.travel(place);if(f.s.document.getElementById('overviewButton').textContent!=='Walk view')f.s.document.getElementById('overviewButton').click();const n=f.s.memoryAdventure.getMap().nodes.find(n=>n.id===id);(n.needsFlags||[]).forEach(flag=>f.s.AdventureState.task(flag));if(place==='astra')for(let i=0;i<4;i++)f.s.AdventureState.task('astra-'+i);if(place==='halloween'){f.s.SharedWardrobe.addams();await new Promise(resolve=>setImmediate(resolve));}
  f.a.placeAt(n.x,n.y);f.act(id);if(place==='pool')f.tick(5);else{for(let tries=0;tries<1000&&f.state().scene&&f.state().scene.phase==='approach';tries++)f.tick(1/60);f.tick(.4);}if(place==='pool')for(const a of Object.values(f.a.players))a.path=f.s.memoryAdventure.pathfind(a,{x:a.who==='him'?1080:1120,y:520});
  for(let i=0;i<75;i++){
   if(i===18)f.s.document.getElementById('overviewButton').click();
   if(place==='golf'&&i%26===0)f.a.shoot();f.tick(1/15);f.a.draw();p.drawImage(world,0,0,768,506);p.fillStyle='#211811ed';p.fillRect(0,0,768,48);p.fillStyle='#d8b66b';p.font='11px monospace';p.textAlign='left';p.fillText(String(index+1).padStart(2,'0')+' / '+shots.length+'  ·  '+f.s.memoryAdventure.getMap().chapter,18,18);p.fillStyle='#fff0c5';p.font='16px monospace';p.fillText(f.s.memoryAdventure.getMap().title,18,39);const caption=f.s.document.getElementById('sceneText').textContent;if(caption&&f.state().scene){p.fillStyle='#211811ed';p.fillRect(0,470,768,36);p.fillStyle='#fff0c5';p.font='12px monospace';p.textAlign='center';p.fillText(caption,384,493);}
   const pixels=p.getImageData(0,0,768,506).data;await new Promise((resolve,reject)=>ff.stdin.write(Buffer.from(pixels.buffer),error=>error?reject(error):resolve()));
  }f.a.endScene(false);
 }
 ff.stdin.end();await ended;assert.ok(fs.statSync(destination).size>10000);
});

test('the Things to do guide routes both characters to a real stand and purchases persist in the shared bag',async()=>{
 const f=await adventureFixture('pool'),doc=f.s.document;doc.getElementById('openHere').click();assert.equal(doc.getElementById('adventurePanel').open,true);const grid=doc.getElementById('panelContent').children.find(c=>c.className==='adventure-grid'),stand=grid.children.find(c=>c.children.some(e=>e.textContent==='Pool-day supplies'));assert.ok(stand);stand.children.find(c=>c.tagName==='BUTTON').click();assert.equal(doc.getElementById('adventurePanel').open,false);f.tick(10);assert.equal(f.state().near,'float');doc.getElementById('interact').click();const shop=doc.getElementById('panelContent').children.find(c=>c.className==='adventure-grid'),float=shop.children.find(c=>c.children.some(e=>e.textContent==='Pool-day float'));float.children.find(c=>c.tagName==='BUTTON').click();assert.equal(f.s.AdventureState.read().bag['pool-float'],1);assert.equal(f.s.AdventureState.read().coins,105);await f.travel('apartment');assert.equal(f.s.AdventureState.read().bag['pool-float'],1);
});

test('occasion outfits keep all sixteen full transparent walking cells and can be worn across maps',async()=>{
 const s=load(context(),'js/shared-wardrobe.js');
 for(const p of s.SharedWardrobe.presets()){
  const file='assets/sprites/'+p.who+'_outfit'+p.base+'.png',raw=decoded.get(file);assert.equal(raw.info.width,1024);assert.equal(raw.info.height,1024);
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
   let bottom=0,top=256,left=256,right=0,clear=0;
   for(let y=0;y<256;y++)for(let x=0;x<256;x++){const alpha=raw.data[((row*256+y)*1024+col*256+x)*4+3];if(alpha>32){bottom=Math.max(bottom,y);top=Math.min(top,y);left=Math.min(left,x);right=Math.max(right,x);}else clear++;}
   assert.ok(top>=8&&left>3&&right<252,p.id+' keeps its full silhouette');assert.ok(bottom>=237&&bottom<=240,p.id+' feet do not jump');assert.ok(clear>20000,p.id+' has true alpha');
  }
  const before=JSON.stringify(s.SharedWardrobe.read());await s.SharedWardrobe.occasionSheet(p.who,p.occasion);assert.equal(JSON.stringify(s.SharedWardrobe.read()),before,'a scene preview never equips a look');
  const d=s.SharedWardrobe.wearPreset(p.id);assert.equal(s.localStorage.getItem(p.who+'Outfit'),String(p.base));assert.equal(s.SharedWardrobe.read().equipped[p.who],d.id);
  const rendered=await s.SharedWardrobe.render(d,false);assert.equal(rendered.width,1024);assert.equal(rendered.height,1024);
  const restored=load(context(),'js/shared-wardrobe.js');restored.localStorage.setItem(restored.SharedWardrobe.KEY,JSON.stringify(s.SharedWardrobe.read()));load(restored,'js/shared-wardrobe.js');assert.equal(restored.SharedWardrobe.read().equipped[p.who],d.id);
 }
});

test('pool and photo homecoming use their occasion clothes and restore the saved wardrobe afterward',async()=>{
 const f=await adventureFixture('pool'),original=JSON.stringify(f.s.SharedWardrobe.read()),walking=JSON.stringify(f.state().outfits);
 f.act('swim');assert.match(f.state().outfits.her,/her_outfit12/);assert.match(f.state().outfits.him,/him_outfit12/);f.tick(2);f.a.draw();
 assert.equal(JSON.stringify(f.s.SharedWardrobe.read()),original);f.act('exit-water');assert.equal(JSON.stringify(f.state().outfits),walking);
 f.act('swim');await f.travel('park');assert.equal(JSON.stringify(f.state().outfits),walking,'leaving the pool restores the selected clothes');
 await f.travel('apartment');for(const flag of ['home-banner','home-flowers','home-dinner'])f.s.AdventureState.task(flag);
 const n=f.s.memoryAdventure.getMap().nodes.find(n=>n.id==='reunion');f.a.placeAt(n.x,n.y);f.act('reunion');assert.match(f.state().outfits.her,/her_outfit13/);f.tick(12);f.a.draw();
 assert.equal(f.s.memoryAdventure.getMap().art.photoHomecoming,true);assert.equal(JSON.stringify(f.s.SharedWardrobe.read()),original);f.a.endScene(false);assert.equal(JSON.stringify(f.state().outfits),walking);
});
