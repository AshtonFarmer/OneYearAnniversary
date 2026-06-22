// Debug mode: press G to show/hide zones. Red=blocked, green=interaction/walkable, blue=players, purple=spawn.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; ctx.imageSmoothingEnabled = false; }
addEventListener('resize', resize); resize();
const map = new Image(); map.src = 'assets/maps/cabin-map.png';
const herImg = new Image(); herImg.src = 'assets/sprites/her_atlas.png';
const himImg = new Image(); himImg.src = 'assets/sprites/him_atlas.png';
const keys = {};
let debugMode = false;
addEventListener('keydown', e => { const key=e.key.toLowerCase(); if(key==='g'){ debugMode=!debugMode; e.preventDefault(); return; } keys[key]=true; if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) e.preventDefault(); });
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
let WORLD_W = 1536, WORLD_H = 1024, camera = {x:0,y:0}, heartTimer = 0, lastE = false;
const spawnPoints = [{name:'Her Spawn', x:710, y:835},{name:'Me Spawn', x:805, y:835}];
const players = {
  her:{img:herImg, x:710, y:835, dir:'up', frame:0, speed:3.0, scale:.82, rows:{down:0, up:2, left:3, right:1}, frames:{down:[0,1,2,3], up:[0,1,2,3], left:[0,1,2,3], right:[0,1,2,3]}},
  him:{img:himImg, x:805, y:835, dir:'up', frame:0, speed:3.0, scale:.82, rows:{down:0, up:2, left:3, right:1}, frames:{down:[0,1,2], up:[0,1,2], left:[0,1,2], right:[0,1,2]}}
};
const interactZones = [
  {name:'Love Letters', x:255, y:420, r:95, text:'Press E to open Love Letters 💌', title:'💌 Love Letters', body:'This is where your love letters can go.', cards:['Letter 1','Letter 2','Sweet notes']},
  {name:'Inside Jokes', x:680, y:190, r:105, text:'Press E to open Inside Jokes 📖', title:'📖 Inside Jokes', body:'Add all the dumb funny things only y’all understand.', cards:['Funny quote','Random joke','Favorite laugh']},
  {name:'Favorite Memories', x:740, y:430, r:120, text:'Press E to open Favorite Memories 💖', title:'💖 Favorite Memories', body:'Put your favorite memories from the year here.', cards:['Memory 1','Memory 2','Memory 3']},
  {name:'Favorite Photos', x:925, y:310, r:105, text:'Press E to open Favorite Photos 📷', title:'📷 Favorite Photos', body:'A photo wall for your favorite pictures together.', cards:['Photo spot','Picture placeholder','Cute moment']},
  {name:'Future Together', x:1260, y:375, r:110, text:'Press E to open Future Together ✨', title:'✨ Future Together', body:'Dreams, future plans, and all the places y’all want to go.', cards:['Future home','Trips','Dreams']},
  {name:'Special Messages', x:1190, y:675, r:110, text:'Press E to open Special Messages 💌', title:'💌 Special Messages', body:'Put private messages, voice notes, or sweet paragraphs here.', cards:['Message 1','Message 2','Voice note']},
  {name:'Secret Gift', x:1260, y:845, r:90, text:'Press E to open Secret Gift 🎁', title:'🎁 Secret Gift', body:'A secret hidden surprise can go here.', cards:['???','Hidden memory','Final surprise']},
  {name:'Exit', x:760, y:930, r:90, text:'Press E to go back to the world 🌎', page:'index.html'}
];
const solid = [
  {x:-50,y:-50,w:50,h:WORLD_H+100},{x:WORLD_W,y:-50,w:50,h:WORLD_H+100},{x:-50,y:-50,w:WORLD_W+100,h:50},{x:-50,y:WORLD_H,w:WORLD_W+100,h:50},
  {x:0,y:0,w:1536,h:80},{x:0,y:0,w:35,h:1024},{x:1500,y:0,w:50,h:1024},{x:45,y:120,w:390,h:300},{x:485,y:95,w:285,h:175},{x:1070,y:120,w:340,h:240},{x:585,y:430,w:290,h:145},{x:1040,y:500,w:325,h:215},{x:70,y:575,w:260,h:185},{x:1130,y:780,w:300,h:155}
];
function rectHit(x,y){ return solid.some(s => x > s.x && x < s.x+s.w && y > s.y && y < s.y+s.h); }
function movePlayer(p,input){ let dx=0,dy=0; if(input.up)dy-=1; if(input.down)dy+=1; if(input.left)dx-=1; if(input.right)dx+=1; if(dx||dy){ const len=Math.hypot(dx,dy); dx/=len; dy/=len; if(Math.abs(dx)>Math.abs(dy)) p.dir=dx>0?'right':'left'; else p.dir=dy>0?'down':'up'; const nx=p.x+dx*p.speed, ny=p.y+dy*p.speed; if(!rectHit(nx,p.y))p.x=nx; if(!rectHit(p.x,ny))p.y=ny; p.frameTimer=(p.frameTimer||0)+1; if(p.frameTimer>9){ const seq=p.frames[p.dir]; const i=seq.indexOf(p.frame); p.frame=seq[(i+1+seq.length)%seq.length]; p.frameTimer=0; } } else { p.frame=0; p.frameTimer=0; } }
function getNearZone(){ return interactZones.find(z => Math.hypot(players.her.x-z.x, players.her.y-z.y)<z.r || Math.hypot(players.him.x-z.x, players.him.y-z.y)<z.r); }
function openMemory(zone){ if(zone.page){ location.href=zone.page; return; } document.getElementById('memoryTitle').textContent=zone.title; document.getElementById('memoryText').textContent=zone.body; const grid=document.getElementById('memoryCards'); grid.innerHTML=''; zone.cards.forEach(card=>{ const div=document.createElement('div'); div.className='photo-card'; div.textContent=card; grid.appendChild(div); }); document.getElementById('memoryModal').style.display='flex'; }
function update(){ movePlayer(players.her,{up:keys.arrowup,down:keys.arrowdown,left:keys.arrowleft,right:keys.arrowright}); movePlayer(players.him,{up:keys.w,down:keys.s,left:keys.a,right:keys.d}); heartTimer++; const near=getNearZone(); const prompt=document.getElementById('prompt'); if(near){ prompt.style.display='block'; prompt.textContent=near.text; } else prompt.style.display='none'; if(keys.e&&!lastE&&near) openMemory(near); lastE=!!keys.e; }
function getCamera(){ const cx=(players.her.x+players.him.x)/2, cy=(players.her.y+players.him.y)/2; return {x:Math.max(0,Math.min(Math.max(0,WORLD_W-canvas.width),cx-canvas.width/2)), y:Math.max(0,Math.min(Math.max(0,WORLD_H-canvas.height),cy-canvas.height/2))}; }
function drawSprite(p){ const sw=96,sh=128,row=p.rows[p.dir]; const dw=Math.round(sw*p.scale),dh=Math.round(sh*p.scale); let drawX=Math.round(p.x-camera.x-dw/2), drawY=Math.round(p.y-camera.y-dh+10), drawW=dw; if(p===players.him&&p.dir==='right'){drawX-=4;drawW+=8;} ctx.drawImage(p.img,p.frame*sw,row*sh,sw,sh,drawX,drawY,drawW,dh); }
function drawPixelHeart(x,y,size){ const blocks=[[1,0],[2,0],[4,0],[5,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[1,3],[2,3],[3,3],[4,3],[5,3],[2,4],[3,4],[4,4],[3,5]]; ctx.save(); ctx.translate(Math.round(x-3.5*size),Math.round(y-3*size)); ctx.fillStyle='#ff6bb5'; blocks.forEach(([bx,by])=>ctx.fillRect(bx*size,by*size,size,size)); ctx.fillStyle='#ffd1e8'; ctx.fillRect(size,size,size,size); ctx.restore(); }
function drawCoupleHeart(){ const distance=Math.hypot(players.her.x-players.him.x,players.her.y-players.him.y); if(distance>60)return; const midX=(players.her.x+players.him.x)/2-camera.x, midY=Math.min(players.her.y,players.him.y)-camera.y-78; const float=Math.sin(heartTimer/12)*5, pulse=Math.sin(heartTimer/10)>0?4:3; ctx.save(); ctx.shadowColor='#ff7ac8'; ctx.shadowBlur=10; drawPixelHeart(midX,midY+float,pulse); ctx.restore(); }
function drawDebugRect(rect,color){ctx.fillStyle=color;ctx.fillRect(rect.x-camera.x,rect.y-camera.y,rect.w,rect.h);} function drawDebugCircle(x,y,r,color){ctx.beginPath();ctx.arc(x-camera.x,y-camera.y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();} function drawDebugText(text,x,y){ctx.font='14px monospace';ctx.lineWidth=4;ctx.strokeStyle='#000';ctx.fillStyle='#fff';ctx.strokeText(text,x-camera.x+8,y-camera.y-8);ctx.fillText(text,x-camera.x+8,y-camera.y-8);}
function drawDebugZones(){ if(!debugMode)return; ctx.save(); solid.forEach(rect=>drawDebugRect(rect,'rgba(255,0,0,0.35)')); interactZones.forEach(z=>{drawDebugCircle(z.x,z.y,z.r,'rgba(0,255,90,0.28)');drawDebugText(z.name,z.x,z.y);}); spawnPoints.forEach(spawn=>{drawDebugCircle(spawn.x,spawn.y,20,'rgba(170,80,255,0.75)');drawDebugText(spawn.name,spawn.x,spawn.y);}); drawDebugCircle(players.her.x,players.her.y,10,'rgba(0,130,255,0.85)');drawDebugCircle(players.him.x,players.him.y,10,'rgba(0,130,255,0.85)'); ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(18,18,370,78);ctx.fillStyle='#fff';ctx.font='15px monospace';ctx.fillText('DEBUG ON — press G to hide',32,42);ctx.fillText('Red=blocked Green=spots Blue=players',32,66);ctx.fillText(`Her: ${Math.round(players.her.x)}, ${Math.round(players.her.y)}  Me: ${Math.round(players.him.x)}, ${Math.round(players.him.y)}`,32,90); ctx.restore(); }
function draw(){ camera=getCamera(); ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#061018'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(map,-camera.x,-camera.y); drawDebugZones(); [players.her,players.him].sort((a,b)=>a.y-b.y).forEach(drawSprite); drawCoupleHeart(); }
function loop(){ update(); draw(); requestAnimationFrame(loop); }
Promise.all([map.decode(),herImg.decode(),himImg.decode()]).then(()=>{ WORLD_W=map.naturalWidth; WORLD_H=map.naturalHeight; loop(); });
