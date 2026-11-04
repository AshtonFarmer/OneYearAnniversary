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
 const files=['assets/sprites/her_atlas.png','assets/sprites/him_atlas.png','assets/sprites/her_outfit5.png','assets/sprites/him_outfit6.png',...['neighborhood','mountains','festival'].map(n=>'assets/our-year/'+n+'.webp'),'assets/our-year/photos/usha-concert-1.jpg','assets/our-year/photos/usha-concert-2.jpg'];
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
  const document={hidden:false,activeElement:new Element(),getElementById:id=>{if(!elements.has(id))elements.set(id,id==='world'?canvas():new Element());return elements.get(id);},createElement:tag=>tag==='canvas'?canvas(1,1):new Element(tag),querySelectorAll:()=>[],addEventListener(){}};
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
