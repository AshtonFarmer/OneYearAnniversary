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
map.src = 'assets/maps/clothing-store.png';

const herImg = new Image();
herImg.src = 'assets/sprites/her_atlas.png';

const himImg = new Image();
himImg.src = 'assets/sprites/him_atlas.png';

const keys = {};
let debugMode = false;
let lastE = false;
let WORLD_W = 1536;
let WORLD_H = 1024;
let camera = {x:0,y:0};
let windBursts = [];
let menuOpen = false;
let activeZone = null;

addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if(key === 'g'){
    debugMode = !debugMode;
    e.preventDefault();
    return;
  }
  keys[key] = true;
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) e.preventDefault();
});
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

const players = {
  her:{key:'her', img:herImg, x:710, y:860, dir:'up', frame:0, speed:3.0, scale:1.0,
       rows:{down:0, up:2, left:3, right:1}, frames:{down:[0,1,2,3], up:[0,1,2,3], left:[0,1,2,3], right:[0,1,2,3]}},
  him:{key:'him', img:himImg, x:825, y:860, dir:'up', frame:0, speed:3.0, scale:1.0,
       rows:{down:0, up:2, left:3, right:1}, frames:{down:[0,1,2,3], up:[0,1,2,3], left:[0,1,2,3], right:[0,1,2,3]}}
};

const zones = [
  {name:'Changing Mirror', x:768, y:430, r:120, type:'outfit', text:'Press E to change outfits 👗'},
  {name:'Exit', x:768, y:930, r:95, type:'exit', text:'Press E to go back to the shopping plaza'}
];

const solid = [
  {x:-60,y:-60,w:60,h:WORLD_H+120},
  {x:WORLD_W,y:-60,w:60,h:WORLD_H+120},
  {x:-60,y:-60,w:WORLD_W+120,h:60},
  {x:-60,y:WORLD_H,w:WORLD_W+120,h:60}
];

const outfitNames = [
  'Default',
  'Outfit 2',
  'Outfit 3',
  'Outfit 4',
  'Outfit 5',
  'Outfit 6',
  'Outfit 7',
  'Outfit 8',
  'Outfit 9'
];

function outfitPath(who, outfit){
  return outfit === 1 ? `assets/sprites/${who}_atlas.png` : `assets/sprites/${who}_outfit${outfit}.png`;
}

function rectHit(x,y){
  return solid.some(s => x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h);
}

function movePlayer(p, input){
  if(menuOpen) return;
  let dx = 0, dy = 0;
  if(input.up) dy -= 1;
  if(input.down) dy += 1;
  if(input.left) dx -= 1;
  if(input.right) dx += 1;

  if(dx || dy){
    const len = Math.hypot(dx,dy);
    dx /= len; dy /= len;
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

function nearbyZone(){
  return zones.find(zone =>
    Math.hypot(players.her.x - zone.x, players.her.y - zone.y) < zone.r ||
    Math.hypot(players.him.x - zone.x, players.him.y - zone.y) < zone.r
  );
}

function update(){
  movePlayer(players.her,{up:keys.arrowup,down:keys.arrowdown,left:keys.arrowleft,right:keys.arrowright});
  movePlayer(players.him,{up:keys.w,down:keys.s,left:keys.a,right:keys.d});

  windBursts = windBursts.filter(burst => ++burst.t < burst.life);

  activeZone = nearbyZone();
  const prompt = document.getElementById('prompt');
  if(activeZone && !menuOpen){
    prompt.style.display = 'block';
    prompt.textContent = activeZone.text;
  } else {
    prompt.style.display = 'none';
  }

  if(keys.e && !lastE && activeZone && !menuOpen){
    if(activeZone.type === 'exit') location.href = 'shopping.html';
    if(activeZone.type === 'outfit') openOutfitMenu();
  }
  lastE = !!keys.e;
}

function openOutfitMenu(){
  menuOpen = true;
  buildOutfitButtons('her');
  buildOutfitButtons('him');
  document.getElementById('outfitModal').style.display = 'flex';
}

function closeOutfitMenu(){
  menuOpen = false;
  document.getElementById('outfitModal').style.display = 'none';
}
window.closeOutfitMenu = closeOutfitMenu;

function buildOutfitButtons(who){
  const box = document.getElementById(who + 'Outfits');
  box.innerHTML = '';
  const current = Number(localStorage.getItem(`${who}Outfit`) || 1);

  outfitNames.forEach((name, index) => {
    const outfit = index + 1;
    const btn = document.createElement('button');
    btn.className = 'outfit-card' + (current === outfit ? ' active' : '');

    const preview = document.createElement('canvas');
    preview.width = 72;
    preview.height = 96;
    preview.className = 'outfit-preview';

    const title = document.createElement('strong');
    title.textContent = name;

    const status = document.createElement('span');
    status.textContent = current === outfit ? 'Currently wearing' : 'Click to wear';

    btn.appendChild(preview);
    btn.appendChild(title);
    btn.appendChild(status);
    btn.onclick = () => chooseOutfit(who, outfit);
    box.appendChild(btn);

    drawOutfitPreview(preview, who, outfit);
  });
}

function drawOutfitPreview(preview, who, outfit){
  const pctx = preview.getContext('2d');
  pctx.imageSmoothingEnabled = false;
  pctx.clearRect(0,0,preview.width,preview.height);
  pctx.fillStyle = 'rgba(0,0,0,.18)';
  pctx.fillRect(0,0,preview.width,preview.height);

  const img = new Image();
  img.onload = () => {
    pctx.clearRect(0,0,preview.width,preview.height);
    pctx.fillStyle = 'rgba(0,0,0,.18)';
    pctx.fillRect(0,0,preview.width,preview.height);
    // Show the front-facing idle frame from the sprite sheet.
    pctx.drawImage(img, 0, 0, 96, 128, 0, 0, 72, 96);
  };
  img.onerror = () => {
    pctx.fillStyle = '#ffe18b';
    pctx.font = '10px monospace';
    pctx.textAlign = 'center';
    pctx.fillText('sprite', 36, 42);
    pctx.fillText('needed', 36, 56);
  };
  img.src = outfitPath(who, outfit);
}

function chooseOutfit(who, outfit){
  localStorage.setItem(`${who}Outfit`, outfit);
  const p = players[who];
  const newImg = new Image();
  newImg.onload = () => { p.img = newImg; };
  newImg.onerror = () => { p.img = who === 'her' ? herImg : himImg; };
  newImg.src = outfitPath(who, outfit);
  closeOutfitMenu();
  spinPlayer(p);
}

function spinPlayer(p){
  p.spinTimer = 70;
  windBursts.push({x:p.x,y:p.y,t:0,life:70});
}

function getCamera(){
  const cx = (players.her.x + players.him.x) / 2;
  const cy = (players.her.y + players.him.y) / 2;
  return {
    x: Math.max(0, Math.min(Math.max(0, WORLD_W - canvas.width), cx - canvas.width / 2)),
    y: Math.max(0, Math.min(Math.max(0, WORLD_H - canvas.height), cy - canvas.height / 2))
  };
}

function drawSprite(p){
  const sw = 96, sh = 128;
  const dirs = ['down','left','up','right'];
  let dir = p.dir;
  if(p.spinTimer > 0){
    dir = dirs[Math.floor(p.spinTimer / 5) % dirs.length];
    p.spinTimer--;
  }
  const row = p.rows[dir];
  const dw = Math.round(sw * p.scale);
  const dh = Math.round(sh * p.scale);
  let drawX = Math.round(p.x - camera.x - dw / 2);
  let drawY = Math.round(p.y - camera.y - dh + 10);
  let drawW = dw;
  if(p.key === 'him' && dir === 'right'){
    drawX -= 4;
    drawW += 8;
  }
  ctx.drawImage(p.img, p.frame * sw, row * sh, sw, sh, drawX, drawY, drawW, dh);
}

function drawWind(){
  windBursts.forEach(burst => {
    const progress = burst.t / burst.life;
    const x = burst.x - camera.x;
    const y = burst.y - camera.y - 35;
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = '#d9f7ff';
    ctx.lineWidth = 3;
    for(let i=0;i<4;i++){
      const a = progress * Math.PI * 8 + i * Math.PI / 2;
      const r = 18 + progress * 45;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * 8, y + Math.sin(a) * 4, r, a, a + 1.2);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    for(let i=0;i<8;i++){
      const a = progress * Math.PI * 10 + i;
      const r = 15 + i * 5;
      ctx.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r * .45, 3, 3);
    }
    ctx.restore();
  });
}

function drawDebug(){
  if(!debugMode) return;
  ctx.save();
  zones.forEach(z => {
    ctx.beginPath();
    ctx.arc(z.x - camera.x, z.y - camera.y, z.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,255,90,0.28)';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  });
  ctx.restore();
}

function draw(){
  camera = getCamera();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#061018';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(map, -camera.x, -camera.y);
  drawDebug();
  const arr = [players.her, players.him].sort((a,b) => a.y - b.y);
  arr.forEach(drawSprite);
  drawWind();
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

Promise.all([map.decode(), herImg.decode(), himImg.decode()]).then(() => {
  WORLD_W = map.naturalWidth;
  WORLD_H = map.naturalHeight;
  loop();
});
