// Helipad rebuilt cleanly. Debug: G shows zones. Box mode: B drag to copy coordinates.

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
let boxMode = false;
let dragStart = null;
let dragEnd = null;

let WORLD_W = 1536;
let WORLD_H = 1024;
let camera = {x:0,y:0};
let lastE = false;
let heartTimer = 0;
let actionCooldown = 0;
let currentAction = null;
let particles = [];
let petals = [];
let rotorSpin = 0;

const waterBox = {x:1331, y:633, w:113, h:80};
const benchBox = {x:231, y:299, w:110, h:89};
const rotorBox = {x:950, y:179, w:296, h:95};

const spots = [
  {name:'Helicopter', x:980, y:360, r:105, text:'Press E to take off together', action:'takeoff'},
  {name:'Adventure Sign', x:516, y:312, r:60, text:'Press E to read the adventure sign', action:'photos', title:'Our Adventures Together', body:'A little place for a message about everywhere you want to go together.'},
  {name:'Bench Together', x:286, y:344, r:78, text:'Press E to sit together on the bench', action:'bench'},
  {name:'Water Splash', x:1388, y:673, r:85, text:'Press E to splash water together', action:'water'},
  {name:'Picnic Overlook', x:1045, y:650, r:95, text:'Press E to open overlook memories', action:'photos', title:'Favorite Places', body:'Add screenshots, photos, or notes about beautiful places and memories here.'},
  {name:'Back', x:760, y:975, r:70, text:'Press E to go back to the world', action:'back'}
];

const spawnPoints = [
  {name:'Her Spawn', x:730, y:900},
  {name:'Me Spawn', x:805, y:900}
];

const players = {
  her:{img:herImg,x:730,y:900,dir:'up',frame:0,speed:3,scale:.58,rows:{down:0,up:2,left:3,right:1},frames:{down:[0,1,2,3],up:[0,1,2,3],left:[0,1,2,3],right:[0,1,2,3]}},
  him:{img:himImg,x:805,y:900,dir:'up',frame:0,speed:3,scale:.58,rows:{down:0,up:2,left:3,right:1},frames:{down:[0,1,2],up:[0,1,2],left:[0,1,2],right:[0,1,2]}}
};

const boundaryBlocks = [
  {x:0,y:0,w:40,h:WORLD_H},
  {x:0,y:0,w:WORLD_W,h:210},
  {x:WORLD_W-40,y:0,w:40,h:WORLD_H},
  {x:0,y:WORLD_H-20,w:WORLD_W,h:20},
  {x:35,y:932,w:585,h:84},
  {x:1383,y:203,w:116,h:341},
  {x:472,y:594,w:186,h:216},
  {x:1268,y:618,w:31,h:118},
  {x:1193,y:647,w:99,h:114},
  {x:223,y:496,w:237,h:192},
  {x:32,y:201,w:158,h:542},
  {x:1059,y:714,w:238,h:182},
  {x:830,y:921,w:675,h:96},
  {x:643,y:191,w:120,h:211}
];

addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if(key === 'g'){
    debugMode = !debugMode;
    e.preventDefault();
    return;
  }
  if(key === 'b'){
    boxMode = !boxMode;
    dragStart = null;
    dragEnd = null;
    console.log('Box Mode:', boxMode ? 'ON' : 'OFF');
    e.preventDefault();
    return;
  }
  keys[key] = true;
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) e.preventDefault();
});

addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousedown', e => {
  if(!boxMode) return;
  const rect = canvas.getBoundingClientRect();
  dragStart = {x:Math.round(e.clientX-rect.left+camera.x), y:Math.round(e.clientY-rect.top+camera.y)};
  dragEnd = {...dragStart};
});

canvas.addEventListener('mousemove', e => {
  if(!boxMode || !dragStart) return;
  const rect = canvas.getBoundingClientRect();
  dragEnd = {x:Math.round(e.clientX-rect.left+camera.x), y:Math.round(e.clientY-rect.top+camera.y)};
});

canvas.addEventListener('mouseup', e => {
  if(!boxMode || !dragStart || !dragEnd) return;
  const x = Math.min(dragStart.x, dragEnd.x);
  const y = Math.min(dragStart.y, dragEnd.y);
  const w = Math.abs(dragStart.x - dragEnd.x);
  const h = Math.abs(dragStart.y - dragEnd.y);
  console.log(`COPY THIS: {x:${x}, y:${y}, w:${w}, h:${h}}`);
  dragStart = null;
  dragEnd = null;
});

function rectHit(x,y){
  return boundaryBlocks.some(b => x>b.x && x<b.x+b.w && y>b.y && y<b.y+b.h);
}

function animateWalk(p){
  p.frameTimer = (p.frameTimer || 0) + 1;
  if(p.frameTimer > 9){
    const seq = p.frames[p.dir];
    const i = seq.indexOf(p.frame);
    p.frame = seq[(i + 1 + seq.length) % seq.length];
    p.frameTimer = 0;
  }
}

function movePlayer(p,input){
  let dx = 0;
  let dy = 0;
  if(input.up) dy -= 1;
  if(input.down) dy += 1;
  if(input.left) dx -= 1;
  if(input.right) dx += 1;
  if(dx || dy){
    const len = Math.hypot(dx,dy);
    dx /= len;
    dy /= len;
    p.dir = Math.abs(dx) > Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up');
    const nx = p.x + dx * p.speed;
    const ny = p.y + dy * p.speed;
    if(!rectHit(nx,p.y)) p.x = nx;
    if(!rectHit(p.x,ny)) p.y = ny;
    animateWalk(p);
  } else {
    p.frame = 0;
    p.frameTimer = 0;
  }
}

function setTarget(p,x,y,dir){
  p.target = {x,y,dir};
}

function walkToTarget(p){
  if(!p.target) return true;
  const dx = p.target.x - p.x;
  const dy = p.target.y - p.y;
  const dist = Math.hypot(dx,dy);
  if(dist < 3){
    p.x = p.target.x;
    p.y = p.target.y;
    p.dir = p.target.dir || p.dir;
    p.frame = 0;
    p.target = null;
    return true;
  }
  const step = Math.min(p.speed * 1.25, dist);
  p.x += dx / dist * step;
  p.y += dy / dist * step;
  p.dir = Math.abs(dx) > Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up');
  animateWalk(p);
  return false;
}

function distToSpot(p,s){
  return Math.hypot(p.x-s.x, p.y-s.y);
}

function showModal(spot){
  document.getElementById('modalTitle').textContent = spot.title || 'Our Adventures Together';
  document.getElementById('modalText').textContent = spot.body || 'Add your memories here later.';
  document.getElementById('photoModal').style.display = 'flex';
}

function startAction(type){
  currentAction = {type, phase:'moving', timer:0};
  if(type === 'takeoff'){
    setTarget(players.her,925,405,'right');
    setTarget(players.him,875,405,'right');
  }
  if(type === 'bench'){
    setTarget(players.her,253,359,'down');
    setTarget(players.him,319,359,'down');
  }
  if(type === 'water'){
    setTarget(players.her,1361,699,'right');
    setTarget(players.him,1414,699,'left');
  }
}

function spawnHeart(x,y){
  particles.push({type:'heart',x,y,life:75,size:Math.random()>.5?3:4,vx:(Math.random()-.5)*.8,vy:-.8});
}

function spawnWind(){
  particles.push({type:'wind',x:rotorBox.x+Math.random()*rotorBox.w,y:rotorBox.y+Math.random()*rotorBox.h,life:50,vx:-1.8-Math.random()*1.2,vy:(Math.random()-.5)*.4,size:10+Math.random()*18});
}

function spawnPetal(){
  petals.push({x:210+Math.random()*180,y:240+Math.random()*220,life:150,vx:.25+Math.random()*.45,vy:.35+Math.random()*.35,size:2+Math.random()*2});
}

function spawnSplash(fromLeft){
  const baseX = fromLeft ? players.her.x + 14 : players.him.x - 14;
  const baseY = waterBox.y + 35 + Math.random()*15;
  for(let i=0;i<12;i++){
    particles.push({type:'water',x:baseX,y:baseY,life:38+Math.random()*20,vx:(fromLeft?1:-1)*(1.5+Math.random()*2.5),vy:-1.6-Math.random()*2,size:2+Math.random()*3});
  }
}

function updateAction(){
  rotorSpin += .18;
  if(heartTimer % 20 === 0) spawnWind();
  if(heartTimer % 30 === 0) spawnPetal();
  if(actionCooldown > 0) actionCooldown--;
  if(!currentAction) return;

  const herDone = walkToTarget(players.her);
  const himDone = walkToTarget(players.him);
  if(currentAction.phase === 'moving' && herDone && himDone){
    currentAction.phase = 'active';
    currentAction.timer = 0;
    if(currentAction.type === 'takeoff'){
      players.her.dir = 'right';
      players.him.dir = 'right';
    }
    if(currentAction.type === 'bench'){
      players.her.dir = 'down';
      players.him.dir = 'down';
      spawnHeart(286,298);
    }
    if(currentAction.type === 'water'){
      players.her.dir = 'right';
      players.him.dir = 'left';
      spawnSplash(true);
    }
  }

  if(currentAction.phase === 'active'){
    currentAction.timer++;
    if(currentAction.type === 'takeoff'){
      if(currentAction.timer % 4 === 0) spawnWind();
      if(currentAction.timer === 80){
        showModal({title:'Our Next Adventure', body:'This is the adventure-photo spot. We can add real photos here later.'});
      }
    }
    if(currentAction.type === 'bench'){
      if(currentAction.timer % 85 === 0) spawnHeart(286,298);
    }
    if(currentAction.type === 'water'){
      if(currentAction.timer % 42 === 0) spawnSplash(true);
      if(currentAction.timer % 42 === 21) spawnSplash(false);
      if(currentAction.timer % 90 === 0) spawnHeart(1388,620);
    }
  }

  if(keys.e && currentAction.phase === 'active' && currentAction.timer > 30 && actionCooldown <= 0){
    currentAction = null;
    actionCooldown = 20;
    players.her.dir = 'down';
    players.him.dir = 'down';
  }
}

function updateParticles(){
  particles = particles.filter(p => {
    p.life--;
    p.x += p.vx;
    p.y += p.vy;
    if(p.type === 'water') p.vy += .22;
    if(p.type === 'heart') p.y -= .25;
    return p.life > 0;
  });
  petals = petals.filter(p => {
    p.life--;
    p.x += p.vx + Math.sin((heartTimer+p.y)/20)*.2;
    p.y += p.vy;
    return p.life > 0;
  });
}

function update(){
  if(!currentAction){
    movePlayer(players.her,{up:keys.arrowup,down:keys.arrowdown,left:keys.arrowleft,right:keys.arrowright});
    movePlayer(players.him,{up:keys.w,down:keys.s,left:keys.a,right:keys.d});
  }
  heartTimer++;
  updateAction();
  updateParticles();

  const near = spots.find(s => distToSpot(players.her,s)<s.r || distToSpot(players.him,s)<s.r);
  const prompt = document.getElementById('prompt');
  if(currentAction && currentAction.phase === 'active'){
    prompt.style.display = 'block';
    prompt.textContent = 'Press E to stop';
  } else if(near){
    prompt.style.display = 'block';
    prompt.textContent = near.text;
  } else {
    prompt.style.display = 'none';
  }

  if(keys.e && !lastE && near && !currentAction && actionCooldown <= 0){
    if(near.action === 'back') location.href = 'index.html';
    else if(near.action === 'photos') showModal(near);
    else startAction(near.action);
    actionCooldown = 20;
  }
  lastE = !!keys.e;
}

function getCamera(){
  const cx = (players.her.x + players.him.x) / 2;
  const cy = (players.her.y + players.him.y) / 2;
  return {x:Math.max(0,Math.min(Math.max(0,WORLD_W-canvas.width),cx-canvas.width/2)), y:Math.max(0,Math.min(Math.max(0,WORLD_H-canvas.height),cy-canvas.height/2))};
}

function drawSprite(p){
  const sw = 96;
  const sh = 128;
  const row = p.rows[p.dir];
  const dw = Math.round(sw*p.scale);
  const dh = Math.round(sh*p.scale);
  let drawX = Math.round(p.x-camera.x-dw/2);
  let drawY = Math.round(p.y-camera.y-dh+10);
  let drawW = dw;
  if(p === players.him && p.dir === 'right'){
    drawX -= 4;
    drawW += 8;
  }
  if(currentAction && currentAction.type === 'bench' && currentAction.phase === 'active'){
    drawY += 12;
  }
  ctx.drawImage(p.img,p.frame*sw,row*sh,sw,sh,drawX,drawY,drawW,dh);
}

function drawPixelHeart(x,y,size){
  const blocks = [[1,0],[2,0],[4,0],[5,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[1,3],[2,3],[3,3],[4,3],[5,3],[2,4],[3,4],[4,4],[3,5]];
  ctx.save();
  ctx.translate(Math.round(x-3.5*size),Math.round(y-3*size));
  ctx.fillStyle = '#ff6bb5';
  blocks.forEach(([bx,by]) => ctx.fillRect(bx*size,by*size,size,size));
  ctx.fillStyle = '#ffd1e8';
  ctx.fillRect(size,size,size,size);
  ctx.restore();
}

function drawCoupleHeart(){
  const distance = Math.hypot(players.her.x-players.him.x,players.her.y-players.him.y);
  if(distance > 48) return;
  const midX = (players.her.x+players.him.x)/2-camera.x;
  const midY = Math.min(players.her.y,players.him.y)-camera.y-55;
  const float = Math.sin(heartTimer/12)*5;
  const pulse = Math.sin(heartTimer/10)>0?4:3;
  ctx.save();
  ctx.shadowColor = '#ff7ac8';
  ctx.shadowBlur = 10;
  drawPixelHeart(midX,midY+float,pulse);
  ctx.restore();
}

function drawRotor(){
  const cx = Math.round(rotorBox.x + rotorBox.w/2) - camera.x;
  const cy = Math.round(rotorBox.y + rotorBox.h/2) - camera.y;
  const len = rotorBox.w / 2;
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(rotorSpin);
  ctx.globalAlpha = .22;
  ctx.strokeStyle = '#d9efff';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-len,0);
  ctx.lineTo(len,0);
  ctx.moveTo(0,-rotorBox.h*.55);
  ctx.lineTo(0,rotorBox.h*.55);
  ctx.stroke();
  ctx.restore();
}

function drawParticles(){
  petals.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0,p.life/150)*.8;
    ctx.fillStyle = '#ff7ac8';
    ctx.fillRect(p.x-camera.x,p.y-camera.y,p.size,p.size);
    ctx.restore();
  });
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0,p.life/75);
    if(p.type === 'heart'){
      ctx.shadowColor = '#ff7ac8';
      ctx.shadowBlur = 8;
      drawPixelHeart(p.x-camera.x,p.y-camera.y,p.size);
    }
    if(p.type === 'wind'){
      ctx.strokeStyle = '#d8f1ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x-camera.x,p.y-camera.y);
      ctx.lineTo(p.x-camera.x+p.size,p.y-camera.y-4);
      ctx.stroke();
    }
    if(p.type === 'water'){
      ctx.fillStyle = '#8ee8ff';
      ctx.fillRect(p.x-camera.x,p.y-camera.y,p.size,p.size);
    }
    ctx.restore();
  });
}

function drawDebugRect(rect,color){
  ctx.fillStyle = color;
  ctx.fillRect(rect.x-camera.x,rect.y-camera.y,rect.w,rect.h);
}

function drawDebugCircle(x,y,r,color){
  ctx.beginPath();
  ctx.arc(x-camera.x,y-camera.y,r,0,Math.PI*2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawDebugText(text,x,y){
  ctx.font = '14px monospace';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000';
  ctx.fillStyle = '#fff';
  ctx.strokeText(text,x-camera.x+8,y-camera.y-8);
  ctx.fillText(text,x-camera.x+8,y-camera.y-8);
}

function drawDebugZones(){
  if(!debugMode) return;
  ctx.save();
  boundaryBlocks.forEach(rect => drawDebugRect(rect,'rgba(255,0,0,0.35)'));
  drawDebugRect(waterBox,'rgba(0,180,255,0.25)');
  drawDebugRect(benchBox,'rgba(255,220,0,0.25)');
  drawDebugRect(rotorBox,'rgba(255,255,255,0.18)');
  spots.forEach(spot => {drawDebugCircle(spot.x,spot.y,spot.r,'rgba(0,255,90,0.28)'); drawDebugText(spot.name,spot.x,spot.y);});
  spawnPoints.forEach(spawn => {drawDebugCircle(spawn.x,spawn.y,20,'rgba(170,80,255,0.75)'); drawDebugText(spawn.name,spawn.x,spawn.y);});
  drawDebugCircle(players.her.x,players.her.y,10,'rgba(0,130,255,0.85)');
  drawDebugCircle(players.him.x,players.him.y,10,'rgba(0,130,255,0.85)');
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(18,18,520,126);
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';
  ctx.fillText('DEBUG ON - press G to hide',32,42);
  ctx.fillText('Press B, drag a box, check Console',32,66);
  ctx.fillText('Red=blocked Green=spots Yellow=bench Blue=water',32,90);
  ctx.fillText(`Her: ${Math.round(players.her.x)}, ${Math.round(players.her.y)}  Me: ${Math.round(players.him.x)}, ${Math.round(players.him.y)}`,32,114);
  if(boxMode && dragStart && dragEnd){
    const x = Math.min(dragStart.x,dragEnd.x)-camera.x;
    const y = Math.min(dragStart.y,dragEnd.y)-camera.y;
    const w = Math.abs(dragStart.x-dragEnd.x);
    const h = Math.abs(dragStart.y-dragEnd.y);
    ctx.fillStyle = 'rgba(0,180,255,0.25)';
    ctx.strokeStyle = '#00b4ff';
    ctx.lineWidth = 3;
    ctx.fillRect(x,y,w,h);
    ctx.strokeRect(x,y,w,h);
  }
  ctx.restore();
}

function draw(){
  camera = getCamera();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#061018';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(map,-camera.x,-camera.y);
  drawRotor();
  drawParticles();
  drawDebugZones();
  [players.her,players.him].sort((a,b)=>a.y-b.y).forEach(drawSprite);
  drawCoupleHeart();
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

Promise.all([map.decode(),herImg.decode(),himImg.decode()]).then(() => {
  WORLD_W = map.naturalWidth;
  WORLD_H = map.naturalHeight;
  loop();
});
