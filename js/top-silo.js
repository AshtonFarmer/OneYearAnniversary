// Silo Top
// Cozy top room plus the seasonal missing-brick lookout.

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
map.src = 'assets/maps/top-silo.png';

const viewImg = new Image();

const herImg = new Image();
herImg.src = 'assets/sprites/her_atlas.png';

const himImg = new Image();
himImg.src = 'assets/sprites/him_atlas.png';

const keys = {};
let debugMode = false;
let camera = {x:0,y:0};
let lastE = false;
let viewingLookout = false;
let WORLD_W = 1024;
let WORLD_H = 1024;
let heartTimer = 0;

const seasonViews = {
  spring:'assets/maps/top-view-main-map-spring.png',
  summer:'assets/maps/top-view-main-map.png',
  fall:'assets/maps/top-view-main-map-fall.png',
  winter:'assets/maps/top-view-main-map-winter.png',
  night:'assets/maps/top-view-main-map-night.png',
  rainy:'assets/maps/top-view-main-map-rainy.png'
};

function currentSeasonKey(){
  return localStorage.getItem('currentSeason') || 'summer';
}

function setLookoutImage(){
  const src = seasonViews[currentSeasonKey()] || seasonViews.summer;
  viewImg.onerror = () => {
    viewImg.onerror = null;
    viewImg.src = seasonViews.summer;
  };
  viewImg.src = src;
}
setLookoutImage();

const players = {
  her:{key:'her', img:herImg, x:485, y:835, dir:'up', frame:0, speed:3.0, scale:.58,
       rows:{down:0, up:2, left:1, right:3}, frames:{down:[0,1,2,3], up:[0,1,2,3], left:[0,1,2,3], right:[0,1,2,3]}},
  him:{key:'him', img:himImg, x:545, y:835, dir:'up', frame:0, speed:3.0, scale:.58,
       rows:{down:0, up:2, left:1, right:3}, frames:{down:[0,1,2,3], up:[0,1,2,3], left:[0,1,2,3], right:[0,1,2,3]}}
};

const zones = [
  {name:'Missing Brick', type:'lookout', x:448, y:160, w:150, h:150, text:'Press E to peek through the missing brick'},
  {name:'Stairs Down', type:'downstairs', x:430, y:710, w:170, h:240, text:'Press E to climb back down'},
  {name:'Hammock', type:'hammock', x:235, y:330, w:555, h:160, text:'Press E to rest by the hammock'}
];

const solid = [
  {x:-60,y:-60,w:60,h:WORLD_H+120},
  {x:WORLD_W,y:-60,w:60,h:WORLD_H+120},
  {x:-60,y:-60,w:WORLD_W+120,h:60},
  {x:-60,y:WORLD_H,w:WORLD_W+120,h:60},
  // Keep them in the warm open floor area. We can tune these later with B/G.
  {x:0,y:0,w:1024,h:130},
  {x:0,y:0,w:120,h:1024},
  {x:904,y:0,w:120,h:1024},
  {x:0,y:930,w:1024,h:94}
];

addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if(key === 'g'){
    debugMode = !debugMode;
    e.preventDefault();
    return;
  }
  if(viewingLookout && (key === 'escape' || key === 'e')){
    viewingLookout = false;
    e.preventDefault();
    return;
  }
  keys[key] = true;
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) e.preventDefault();
});
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function inRect(px, py, r){
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function rectHit(x, y){
  return solid.some(r => inRect(x, y, r));
}

function zoneTouching(z){
  return inRect(players.her.x, players.her.y, z) || inRect(players.him.x, players.him.y, z);
}

function nearbyZone(){
  return zones.find(zoneTouching);
}

function movePlayer(p, input){
  if(viewingLookout) return;

  let dx = 0, dy = 0;
  if(input.up) dy -= 1;
  if(input.down) dy += 1;
  if(input.left) dx -= 1;
  if(input.right) dx += 1;

  if(dx || dy){
    const len = Math.hypot(dx,dy);
    dx /= len;
    dy /= len;

    if(Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 'right' : 'left';
    else p.dir = dy > 0 ? 'down' : 'up';

    const nx = p.x + dx * p.speed;
    const ny = p.y + dy * p.speed;
    if(!rectHit(nx, p.y)) p.x = nx;
    if(!rectHit(p.x, ny)) p.y = ny;

    p.frameTimer = (p.frameTimer || 0) + 1;
    if(p.frameTimer > 9){
      const seq = p.frames[p.dir];
      const i = seq.indexOf(p.frame);
      p.frame = seq[(i + 1 + seq.length) % seq.length];
      p.frameTimer = 0;
    }
  } else {
    p.frame = 0;
    p.frameTimer = 0;
  }
}

function getCamera(){
  const cx = (players.her.x + players.him.x) / 2;
  const cy = (players.her.y + players.him.y) / 2;
  return {
    x: Math.max(0, Math.min(Math.max(0, WORLD_W - canvas.width), cx - canvas.width / 2)),
    y: Math.max(0, Math.min(Math.max(0, WORLD_H - canvas.height), cy - canvas.height / 2))
  };
}

function update(){
  heartTimer++;
  movePlayer(players.her,{up:keys.arrowup,down:keys.arrowdown,left:keys.arrowleft,right:keys.arrowright});
  movePlayer(players.him,{up:keys.w,down:keys.s,left:keys.a,right:keys.d});

  const prompt = document.getElementById('prompt');
  const activeZone = nearbyZone();

  if(viewingLookout){
    prompt.style.display = 'block';
    prompt.textContent = 'Press E or Esc to step back from the missing brick';
  } else if(activeZone){
    prompt.style.display = 'block';
    prompt.textContent = activeZone.text;
  } else {
    prompt.style.display = 'none';
  }

  const justE = keys.e && !lastE;
  if(justE && activeZone && !viewingLookout){
    if(activeZone.type === 'lookout'){
      setLookoutImage();
      viewingLookout = true;
      players.her.dir = 'up';
      players.him.dir = 'up';
    }
    if(activeZone.type === 'downstairs'){
      location.href = 'silo.html';
    }
    if(activeZone.type === 'hammock'){
      prompt.style.display = 'block';
      prompt.textContent = 'This feels like our secret little place.';
    }
  }
  lastE = !!keys.e;
}

function drawSprite(p){
  const sw = 96, sh = 128;
  const row = p.rows[p.dir];
  const dw = Math.round(sw * p.scale);
  const dh = Math.round(sh * p.scale);
  const drawX = Math.round(p.x - camera.x - dw / 2);
  const drawY = Math.round(p.y - camera.y - dh + 10);
  ctx.drawImage(p.img, p.frame * sw, row * sh, sw, sh, drawX, drawY, dw, dh);
}

function drawDebug(){
  if(!debugMode) return;
  ctx.save();
  zones.forEach(z => {
    ctx.fillStyle = z.type === 'lookout' ? 'rgba(120,220,255,.30)' : 'rgba(0,255,120,.25)';
    ctx.fillRect(z.x-camera.x, z.y-camera.y, z.w, z.h);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(z.x-camera.x, z.y-camera.y, z.w, z.h);
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(z.name, z.x-camera.x+6, z.y-camera.y+18);
  });
  solid.forEach((r,i) => {
    ctx.fillStyle = 'rgba(255,60,60,.22)';
    ctx.fillRect(r.x-camera.x, r.y-camera.y, r.w, r.h);
    ctx.strokeStyle = '#ff5555';
    ctx.strokeRect(r.x-camera.x, r.y-camera.y, r.w, r.h);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText('solid ' + i, r.x-camera.x+5, r.y-camera.y+16);
  });
  ctx.restore();
}

function drawLookout(){
  if(!viewingLookout) return;

  ctx.save();
  ctx.fillStyle = '#02050a';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  if(viewImg.complete && viewImg.naturalWidth){
    const scale = Math.min(canvas.width / viewImg.naturalWidth, canvas.height / viewImg.naturalHeight);
    const w = viewImg.naturalWidth * scale;
    const h = viewImg.naturalHeight * scale;
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;
    ctx.drawImage(viewImg, x, y, w, h);
  }

  const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, Math.min(canvas.width,canvas.height)*.30, canvas.width/2, canvas.height/2, Math.max(canvas.width,canvas.height)*.72);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.textAlign = 'center';
  ctx.font = 'bold 22px monospace';
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#02050a';
  ctx.fillStyle = '#fff1c8';
  const label = currentSeasonKey() === 'summer' ? 'The world below' : 'The world below - ' + currentSeasonKey();
  ctx.strokeText(label, canvas.width/2, 52);
  ctx.fillText(label, canvas.width/2, 52);
  ctx.restore();
}

function draw(){
  camera = getCamera();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#02050a';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  if(map.complete && map.naturalWidth){
    ctx.drawImage(map, -camera.x, -camera.y);
  }

  drawDebug();

  [players.her, players.him]
    .sort((a,b) => a.y - b.y)
    .forEach(drawSprite);

  drawLookout();
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

Promise.all([map.decode(), herImg.decode(), himImg.decode()]).then(() => {
  WORLD_W = map.naturalWidth || WORLD_W;
  WORLD_H = map.naturalHeight || WORLD_H;
  loop();
}).catch(() => loop());
