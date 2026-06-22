// Debug mode: press G to show/hide zones. Red=blocked, green=interaction/walkable, blue=players, purple=spawn.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  ctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize);
resize();

const map = new Image();
map.src = 'assets/maps/helipad-map.png';

const herImg = new Image();
herImg.src = 'assets/sprites/her_atlas.png';

const himImg = new Image();
himImg.src = 'assets/sprites/him_atlas.png';

const keys = {};
let debugMode = false;
addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if(key === 'g'){
    debugMode = !debugMode;
    e.preventDefault();
    return;
  }
  keys[key] = true;
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)){
    e.preventDefault();
  }
});
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

let WORLD_W = 1536;
let WORLD_H = 1024;
let camera = {x:0,y:0};
let lastE = false;
let heartTimer = 0;

const spots = [
  {name:'Helicopter', x:980, y:360, r:115, text:'Press E to open adventure memories 🚁', action:'photos', title:'🚁 Our Adventures Together', body:'This is where trip photos, future plans, and adventure memories will go.'},
  {name:'Adventure Sign', x:350, y:405, r:80, text:'Press E to read the adventure sign 💕', action:'photos', title:'💕 Our Adventures Together', body:'A little place for a message about everywhere you want to go together.'},
  {name:'Picnic Overlook', x:1045, y:650, r:95, text:'Press E to open overlook memories 🌄', action:'photos', title:'🌄 Favorite Places', body:'Add screenshots, photos, or notes about beautiful places and memories here.'},
  {name:'Back', x:760, y:975, r:70, text:'Press E to go back to the world 🌎', action:'back'}
];

const spawnPoints = [
  {name:'Her Spawn', x:730, y:900},
  {name:'Me Spawn', x:805, y:900}
];

const players = {
  her:{img:herImg, x:730, y:900, dir:'up', frame:0, speed:3.0, scale:.58, rows:{down:0, up:2, left:3, right:1}, frames:{down:[0,1,2,3], up:[0,1,2,3], left:[0,1,2,3], right:[0,1,2,3]}},
  him:{img:himImg, x:805, y:900, dir:'up', frame:0, speed:3.0, scale:.58, rows:{down:0, up:2, left:3, right:1}, frames:{down:[0,1,2], up:[0,1,2], left:[0,1,2], right:[0,1,2]}}
};

const boundaryBlocks = [
  {x:0, y:0, w:40, h:WORLD_H},
  {x:0, y:0, w:WORLD_W, h:210},
  {x:WORLD_W - 40, y:0, w:40, h:WORLD_H},
  {x:0, y:WORLD_H - 20, w:WORLD_W, h:20}
];

function rectHit(x,y){
  if(x < 40 || y < 210 || x > WORLD_W - 40 || y > WORLD_H - 20) return true;
  return false;
}

function movePlayer(p, input){
  let dx = 0;
  let dy = 0;
  if(input.up) dy -= 1;
  if(input.down) dy += 1;
  if(input.left) dx -= 1;
  if(input.right) dx += 1;
  if(dx || dy){
    const len = Math.hypot(dx,dy); dx /= len; dy /= len;
    if(Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 'right' : 'left';
    else p.dir = dy > 0 ? 'down' : 'up';
    const nx = p.x + dx * p.speed;
    const ny = p.y + dy * p.speed;
    if(!rectHit(nx,p.y)) p.x = nx;
    if(!rectHit(p.x,ny)) p.y = ny;
    p.frameTimer = (p.frameTimer || 0) + 1;
    if(p.frameTimer > 9){
      const seq = p.frames[p.dir];
      const i = seq.indexOf(p.frame);
      p.frame = seq[(i + 1 + seq.length) % seq.length];
      p.frameTimer = 0;
    }
  } else { p.frame = 0; p.frameTimer = 0; }
}

function distToSpot(p,s){ return Math.hypot(p.x - s.x, p.y - s.y); }

function showModal(spot){
  document.getElementById('modalTitle').textContent = spot.title || '🚁 Our Adventures Together';
  document.getElementById('modalText').textContent = spot.body || 'Add your memories here later.';
  document.getElementById('photoModal').style.display = 'flex';
}

function update(){
  movePlayer(players.her,{up:keys.arrowup,down:keys.arrowdown,left:keys.arrowleft,right:keys.arrowright});
  movePlayer(players.him,{up:keys.w,down:keys.s,left:keys.a,right:keys.d});
  heartTimer++;
  const near = spots.find(s => distToSpot(players.her,s) < s.r || distToSpot(players.him,s) < s.r);
  const prompt = document.getElementById('prompt');
  if(near){ prompt.style.display = 'block'; prompt.textContent = near.text; }
  else { prompt.style.display = 'none'; }
  if(keys.e && !lastE && near){
    if(near.action === 'back') location.href = 'index.html';
    if(near.action === 'photos') showModal(near);
  }
  lastE = !!keys.e;
}

function getCamera(){
  const cx = (players.her.x + players.him.x) / 2;
  const cy = (players.her.y + players.him.y) / 2;
  return {x: Math.max(0, Math.min(Math.max(0,WORLD_W - canvas.width), cx - canvas.width / 2)), y: Math.max(0, Math.min(Math.max(0,WORLD_H - canvas.height), cy - canvas.height / 2))};
}

function drawSprite(p){
  const sw = 96, sh = 128, row = p.rows[p.dir];
  const dw = Math.round(sw * p.scale), dh = Math.round(sh * p.scale);
  let drawX = Math.round(p.x - camera.x - dw / 2);
  let drawY = Math.round(p.y - camera.y - dh + 10);
  let drawW = dw;
  if(p === players.him && p.dir === 'right'){ drawX -= 4; drawW += 8; }
  ctx.drawImage(p.img, p.frame * sw, row * sh, sw, sh, drawX, drawY, drawW, dh);
}

function drawPixelHeart(x, y, size){
  const blocks = [[1,0],[2,0],[4,0],[5,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[1,3],[2,3],[3,3],[4,3],[5,3],[2,4],[3,4],[4,4],[3,5]];
  ctx.save(); ctx.translate(Math.round(x - 3.5 * size), Math.round(y - 3 * size)); ctx.fillStyle = '#ff6bb5'; blocks.forEach(([bx,by]) => ctx.fillRect(bx * size, by * size, size, size)); ctx.fillStyle = '#ffd1e8'; ctx.fillRect(size, size, size, size); ctx.restore();
}
function drawCoupleHeart(){
  const distance = Math.hypot(players.her.x - players.him.x, players.her.y - players.him.y);
  if(distance > 48) return;
  const midX = (players.her.x + players.him.x) / 2 - camera.x;
  const midY = Math.min(players.her.y, players.him.y) - camera.y - 55;
  const float = Math.sin(heartTimer / 12) * 5;
  const pulse = Math.sin(heartTimer / 10) > 0 ? 4 : 3;
  ctx.save(); ctx.shadowColor = '#ff7ac8'; ctx.shadowBlur = 10; drawPixelHeart(midX, midY + float, pulse); ctx.restore();
}

function drawDebugRect(rect, color){ ctx.fillStyle = color; ctx.fillRect(rect.x - camera.x, rect.y - camera.y, rect.w, rect.h); }
function drawDebugCircle(x, y, r, color){ ctx.beginPath(); ctx.arc(x - camera.x, y - camera.y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
function drawDebugText(text, x, y){ ctx.font = '14px monospace'; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.fillStyle = '#fff'; ctx.strokeText(text, x - camera.x + 8, y - camera.y - 8); ctx.fillText(text, x - camera.x + 8, y - camera.y - 8); }
function drawDebugZones(){
  if(!debugMode) return;
  ctx.save();
  boundaryBlocks.forEach(rect => drawDebugRect(rect, 'rgba(255,0,0,0.35)'));
  spots.forEach(spot => { drawDebugCircle(spot.x, spot.y, spot.r, 'rgba(0,255,90,0.28)'); drawDebugText(spot.name, spot.x, spot.y); });
  spawnPoints.forEach(spawn => { drawDebugCircle(spawn.x, spawn.y, 20, 'rgba(170,80,255,0.75)'); drawDebugText(spawn.name, spawn.x, spawn.y); });
  drawDebugCircle(players.her.x, players.her.y, 10, 'rgba(0,130,255,0.85)'); drawDebugCircle(players.him.x, players.him.y, 10, 'rgba(0,130,255,0.85)');
  ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(18,18,360,78); ctx.fillStyle = '#fff'; ctx.font = '15px monospace'; ctx.fillText('DEBUG ON — press G to hide',32,42); ctx.fillText('Red=blocked Green=spots Blue=players',32,66); ctx.fillText(`Her: ${Math.round(players.her.x)}, ${Math.round(players.her.y)}  Me: ${Math.round(players.him.x)}, ${Math.round(players.him.y)}`,32,90);
  ctx.restore();
}

function draw(){
  camera = getCamera();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#061018'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(map,-camera.x,-camera.y);
  drawDebugZones();
  const arr = [players.her,players.him].sort((a,b) => a.y - b.y);
  arr.forEach(drawSprite);
  drawCoupleHeart();
}
function loop(){ update(); draw(); requestAnimationFrame(loop); }
Promise.all([map.decode(), herImg.decode(), himImg.decode()]).then(() => { WORLD_W = map.naturalWidth; WORLD_H = map.naturalHeight; loop(); });
