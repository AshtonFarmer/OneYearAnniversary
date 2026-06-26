// Debug mode: press G to show/hide zones. Red=blocked, green=interaction/walkable, blue=players, purple=spawn.
// Box mode: press B, drag a box, then copy coordinates from Console.

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
map.src = 'assets/maps/cabin-map.png';

const herImg = new Image();
herImg.src = 'assets/sprites/her_atlas.png';

const himImg = new Image();
himImg.src = 'assets/sprites/him_atlas.png';

const keys = {};
let debugMode = false;
let boxMode = false;
let dragStart = null;
let dragEnd = null;

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

  if(key === ' '){
    e.preventDefault();

    if(!spaceHeld){
      spaceHeld = true;
      spaceHoldStart = performance.now();

      if(bothPlayersOnBed()){
        startBedJump();
      }
    }

    keys[key] = true;
    return;
  }

  keys[key] = true;

  if(['arrowup','arrowdown','arrowleft','arrowright'].includes(key)){
    e.preventDefault();
  }
});

addEventListener('keyup', e => {
  const key = e.key.toLowerCase();

  if(key === ' '){
    spaceHeld = false;
    keys[key] = false;

    if(bedLayDown){
      bedLayDown = false;
      players.her.dir = 'down';
      players.him.dir = 'down';
    }

    return;
  }

  keys[key] = false;
});

canvas.addEventListener('mousedown', e => {
  if(!boxMode) return;

  const rect = canvas.getBoundingClientRect();

  dragStart = {
    x: Math.round(e.clientX - rect.left + camera.x),
    y: Math.round(e.clientY - rect.top + camera.y)
  };

  dragEnd = {...dragStart};
});

canvas.addEventListener('mousemove', e => {
  if(!boxMode || !dragStart) return;

  const rect = canvas.getBoundingClientRect();

  dragEnd = {
    x: Math.round(e.clientX - rect.left + camera.x),
    y: Math.round(e.clientY - rect.top + camera.y)
  };
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

let WORLD_W = 1536;
let WORLD_H = 1024;
let camera = {x:0,y:0};
let heartTimer = 0;
let lastE = false;

// Extra cabin interactions
const bedZone = {x:1160, y:140, w:171, h:156};
let spaceHeld = false;
let spaceHoldStart = 0;
let bedJumping = false;
let bedJumpStart = 0;
let bedJumpDuration = 520;
let bedLayDown = false;
let bedLandingTimer = 0;
let heartParticles = [];
let warmthParticles = [];
let steamParticles = [];
let actionState = null;
let actionCooldown = 0;

const spawnPoints = [
  {name:'Her Spawn', x:710, y:835},
  {name:'Me Spawn', x:805, y:835}
];

const players = {
  her:{
    img:herImg,
    x:710,
    y:835,
    dir:'up',
    frame:0,
    speed:3.0,
    scale:.82,
    rows:{down:0, up:2, left:3, right:1},
    frames:{down:[0,1,2,3], up:[0,1,2,3], left:[0,1,2,3], right:[0,1,2,3]}
  },

  him:{
    img:himImg,
    x:805,
    y:835,
    dir:'up',
    frame:0,
    speed:3.0,
    scale:.82,
    rows:{down:0, up:2, left:3, right:1},
    frames:{down:[0,1,2], up:[0,1,2], left:[0,1,2], right:[0,1,2]}
  }
};

const interactZones = [
  {
    name:'Kitchen Memories',
    x:211,
    y:754,
    r:70,
    text:'Press E to open Kitchen Memories 🍳',
    title:'🍳 Kitchen Memories',
    body:'All the meals, snacks, and memories you made together in the kitchen.',
    cards:['Favorite meal','Cooking together','Late night snacks']
  },

  {
    name:'Inside Jokes',
    x:614,
    y:329,
    r:75,
    text:'Press E to open Inside Jokes 📖',
    title:'📖 Inside Jokes',
    body:'Add all the dumb funny things only y’all understand.',
    cards:['Funny quote','Random joke','Favorite laugh']
  },

  {
    name:'Favorite Memories',
    x:298,
    y:400,
    r:70,
    text:'Press E to open Favorite Memories 💖',
    title:'💖 Favorite Memories',
    body:'Put your favorite memories from the year here.',
    cards:['Memory 1','Memory 2','Memory 3']
  },

  {
    name:'Favorite Photos',
    x:925,
    y:310,
    r:105,
    text:'Press E to open Favorite Photos 📷',
    title:'📷 Favorite Photos',
    body:'A photo wall for your favorite pictures together.',
    cards:['Photo spot','Picture placeholder','Cute moment']
  },

  {
    name:'Bed Fun',
    x:1246,
    y:218,
    r:80,
    text:'Press E to open Bed Fun 😏',
    title:'😏 Bed Fun',
    body:'A private place for your special moments together.',
    cards:['💕','✨','🤍']
  },

  {
    name:'Special Messages',
    x:1190,
    y:675,
    r:110,
    text:'Press E to open Special Messages 💌',
    title:'💌 Special Messages',
    body:'Put private messages, voice notes, or sweet paragraphs here.',
    cards:['Message 1','Message 2','Voice note']
  },

  {
    name:'Secret Gift',
    x:1383,
    y:829,
    r:50,
    text:'Press E to open Secret Gift 🎁',
    title:'🎁 Secret Gift',
    body:'A secret hidden surprise can go here.',
    cards:['???','Hidden memory','Final surprise']
  },

  {
    name:'Exit',
    x:760,
    y:930,
    r:90,
    text:'Press E to go back to the world 🌎',
    page:'index.html'
  }
];

const cabinActionZones = [
  {
    name:'Sit Together',
    x:725,
    y:520,
    r:120,
    text:'Press E to Sit Together 🛋️',
    action:'sit'
  },
  {
    name:'Drink Coffee',
    x:735,
    y:620,
    r:95,
    text:'Press E to Drink Coffee ☕',
    action:'coffee'
  },
  {
    name:'Warm Up',
    x:270,
    y:380,
    r:115,
    text:'Press E to Warm Up 🔥',
    action:'fireplace'
  },
  {
    name:'Read Together',
    x:615,
    y:315,
    r:105,
    text:'Press E to Read Together 📖',
    action:'read'
  }
];

const solid = [
  {x:-50,y:-50,w:50,h:WORLD_H+100},
  {x:WORLD_W,y:-50,w:50,h:WORLD_H+100},
  {x:-50,y:-50,w:WORLD_W+100,h:50},
  {x:-50,y:WORLD_H,w:WORLD_W+100,h:50},

  {x:0,y:0,w:1536,h:80},
  {x:0,y:0,w:35,h:1024},
  {x:1500,y:0,w:50,h:1024},

  {x:41, y:561, w:320, h:147}, // Kitchen
  {x:638, y:573, w:185, h:87}, // Futon
  {x:34, y:84, w:402, h:299}, // Fireplace
  {x:375, y:70, w:769, h:196}, // Top Wall
  {x:859, y:222, w:132, h:92}, // Drawers
  {x:508, y:150, w:216, h:165}, // Bookcase
  {x:843, y:424, w:29, h:131}, // Couch Right Arm
  {x:579, y:423, w:28, h:140}, // Couch Left Arm
  {x:598, y:425, w:258, h:59}, // Couch Middle
  {x:1061, y:434, w:406, h:176}, // Wall Above Table
  {x:417, y:591, w:59, h:111}, // Plant 1
  {x:1388, y:549, w:59, h:109}, // Plant 2
  {x:1299, y:711, w:151, h:99}, // Present and Bear

  // Cabin Walls
  {x:47, y:698, w:17, h:178},   // Left Bottom Wall
  {x:47, y:854, w:526, h:22},   // Bottom Left Wall
  {x:554, y:856, w:26, h:67},   // Bottom Center Left Pillar
  {x:565, y:906, w:73, h:16},   // Bottom Center Left
  {x:621, y:909, w:18, h:56},   // Bottom Center Left End
  {x:844, y:856, w:648, h:70},  // Bottom Right Wall
  {x:787, y:911, w:75, h:16},   // Bottom Center Right
  {x:782, y:908, w:62, h:63},   // Bottom Center Right Pillar
  {x:1472, y:72, w:24, h:840},  // Right Wall
  {x:43, y:368, w:61, h:244}    // Left Middle Wall
];

function rectHit(x,y){
  return solid.some(s => x > s.x && x < s.x+s.w && y > s.y && y < s.y+s.h);
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

    if(Math.abs(dx) > Math.abs(dy)){
      p.dir = dx > 0 ? 'right' : 'left';
    } else {
      p.dir = dy > 0 ? 'down' : 'up';
    }

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
  } else {
    p.frame = 0;
    p.frameTimer = 0;
  }
}

function getNearZone(){
  return cabinActionZones.find(z =>
    Math.hypot(players.her.x - z.x, players.her.y - z.y) < z.r ||
    Math.hypot(players.him.x - z.x, players.him.y - z.y) < z.r
  ) || interactZones.find(z =>
    Math.hypot(players.her.x - z.x, players.her.y - z.y) < z.r ||
    Math.hypot(players.him.x - z.x, players.him.y - z.y) < z.r
  );
}

function pointInsideRect(x,y,rect){
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function bothPlayersOnBed(){
  return pointInsideRect(players.her.x,players.her.y,bedZone) &&
         pointInsideRect(players.him.x,players.him.y,bedZone);
}

function spawnHeart(x,y){
  heartParticles.push({
    x,
    y,
    life:70,
    size:Math.random() > .5 ? 3 : 4,
    drift:(Math.random() - .5) * 1.2
  });
}

function startBedJump(){
  if(bedJumping || bedLayDown || actionState) return;

  bedJumping = true;
  bedJumpStart = performance.now();
  bedLandingTimer = 0;

  players.her.dir = 'down';
  players.him.dir = 'down';
  players.her.frame = 1;
  players.him.frame = 1;

  spawnHeart((players.her.x + players.him.x) / 2, Math.min(players.her.y,players.him.y) - 82);
}

function getBedJumpOffset(){
  if(!bedJumping) return 0;

  const t = Math.min(1,(performance.now() - bedJumpStart) / bedJumpDuration);
  return -Math.sin(t * Math.PI) * 38;
}

function updateBedAction(){
  if(!bothPlayersOnBed()){
    bedJumping = false;
    bedLayDown = false;
    return;
  }

  if(bedJumping){
    const done = performance.now() - bedJumpStart >= bedJumpDuration;

    if(done){
      bedJumping = false;
      bedLandingTimer = 10;
      spawnHeart((players.her.x + players.him.x) / 2, Math.min(players.her.y,players.him.y) - 78);
    }
  }

  if(spaceHeld && !bedJumping && !bedLayDown && !actionState){
    const heldFor = performance.now() - spaceHoldStart;

    if(heldFor > 1200){
      bedLayDown = true;
      players.her.dir = 'right';
      players.him.dir = 'left';
      players.her.frame = 0;
      players.him.frame = 0;
      spawnHeart((players.her.x + players.him.x) / 2, Math.min(players.her.y,players.him.y) - 70);
    }
  }

  if(bedLandingTimer > 0){
    bedLandingTimer--;
  }
}

function setPlayerTarget(p,x,y,dir){
  p.target = {x,y,dir};
}

function updatePlayerTarget(p){
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

  const step = Math.min(p.speed * 1.3, dist);
  p.x += (dx / dist) * step;
  p.y += (dy / dist) * step;

  if(Math.abs(dx) > Math.abs(dy)){
    p.dir = dx > 0 ? 'right' : 'left';
  } else {
    p.dir = dy > 0 ? 'down' : 'up';
  }

  p.frameTimer = (p.frameTimer || 0) + 1;
  if(p.frameTimer > 8){
    const seq = p.frames[p.dir];
    const i = seq.indexOf(p.frame);
    p.frame = seq[(i + 1 + seq.length) % seq.length];
    p.frameTimer = 0;
  }

  return false;
}

function startCabinAction(type){
  bedLayDown = false;
  bedJumping = false;

  actionState = {
    type,
    phase:'moving',
    timer:0,
    start:performance.now()
  };

  if(type === 'sit'){
    setPlayerTarget(players.her,690,520,'down');
    setPlayerTarget(players.him,760,520,'down');
  }

  if(type === 'coffee'){
    setPlayerTarget(players.her,690,655,'up');
    setPlayerTarget(players.him,775,655,'up');
  }

  if(type === 'fireplace'){
    setPlayerTarget(players.her,230,410,'up');
    setPlayerTarget(players.him,315,410,'up');
  }

  if(type === 'read'){
    setPlayerTarget(players.her,575,330,'up');
    setPlayerTarget(players.him,655,330,'up');
  }
}

function updateCabinAction(){
  if(!actionState) return;

  const herDone = updatePlayerTarget(players.her);
  const himDone = updatePlayerTarget(players.him);

  if(actionState.phase === 'moving' && herDone && himDone){
    actionState.phase = 'active';
    actionState.timer = 0;
    actionState.start = performance.now();

    if(actionState.type === 'sit'){
      players.her.dir = 'down';
      players.him.dir = 'down';
    }

    if(actionState.type === 'coffee'){
      players.her.dir = 'up';
      players.him.dir = 'up';
    }

    if(actionState.type === 'fireplace'){
      players.her.dir = 'up';
      players.him.dir = 'up';
    }

    if(actionState.type === 'read'){
      players.her.dir = 'up';
      players.him.dir = 'up';
    }
  }

  if(actionState.phase === 'active'){
    actionState.timer++;

    if(actionState.timer % 55 === 0){
      spawnHeart((players.her.x + players.him.x) / 2, Math.min(players.her.y,players.him.y) - 70);
    }

    if(actionState.type === 'coffee' && actionState.timer % 7 === 0){
      steamParticles.push({x:718 + Math.random()*40, y:605, life:55, drift:(Math.random()-.5)*.5});
    }

    if(actionState.type === 'fireplace' && actionState.timer % 4 === 0){
      warmthParticles.push({x:250 + Math.random()*80, y:350 + Math.random()*45, life:45, drift:(Math.random()-.5)*1.4});
    }

    if(actionState.type === 'read'){
      if(actionState.timer % 80 < 38){
        players.her.dir = 'right';
        players.him.dir = 'left';
      } else {
        players.her.dir = 'up';
        players.him.dir = 'up';
      }
    }
  }

  if(keys.e && actionCooldown <= 0 && actionState.phase === 'active' && actionState.timer > 25){
    actionState = null;
    actionCooldown = 20;
    players.her.dir = 'down';
    players.him.dir = 'down';
  }
}

function updateParticles(){
  heartParticles = heartParticles.filter(h => {
    h.life--;
    h.y -= .65;
    h.x += h.drift;
    return h.life > 0;
  });

  warmthParticles = warmthParticles.filter(p => {
    p.life--;
    p.y -= .45;
    p.x += p.drift;
    return p.life > 0;
  });

  steamParticles = steamParticles.filter(p => {
    p.life--;
    p.y -= .7;
    p.x += p.drift;
    return p.life > 0;
  });

  if(actionCooldown > 0) actionCooldown--;
}

function openMemory(zone){
  if(zone.page){
    location.href = zone.page;
    return;
  }

  document.getElementById('memoryTitle').textContent = zone.title;
  document.getElementById('memoryText').textContent = zone.body;

  const grid = document.getElementById('memoryCards');
  grid.innerHTML = '';

  zone.cards.forEach(card => {
    const div = document.createElement('div');
    div.className = 'photo-card';
    div.textContent = card;
    grid.appendChild(div);
  });

  document.getElementById('memoryModal').style.display = 'flex';
}

function update(){
  if(!actionState && !bedLayDown){
    movePlayer(players.her,{
      up:keys.arrowup,
      down:keys.arrowdown,
      left:keys.arrowleft,
      right:keys.arrowright
    });

    movePlayer(players.him,{
      up:keys.w,
      down:keys.s,
      left:keys.a,
      right:keys.d
    });
  }

  updateBedAction();
  updateCabinAction();
  updateParticles();

  heartTimer++;

  const near = getNearZone();
  const prompt = document.getElementById('prompt');

  if(actionState && actionState.phase === 'active'){
    prompt.style.display = 'block';
    prompt.textContent = 'Press E to stop';
  } else if(bedLayDown){
    prompt.style.display = 'block';
    prompt.textContent = 'Press Space to stand back up 🛏️';
  } else if(near){
    prompt.style.display = 'block';
    prompt.textContent = near.text;
  } else {
    prompt.style.display = 'none';
  }

  if(keys.e && !lastE && near && !actionState && actionCooldown <= 0){
    if(near.action === 'sit' || near.action === 'coffee' || near.action === 'fireplace' || near.action === 'read'){
      startCabinAction(near.action);
      actionCooldown = 20;
    } else {
      openMemory(near);
    }
  }

  lastE = !!keys.e;
}

function getCamera(){
  const cx = (players.her.x + players.him.x) / 2;
  const cy = (players.her.y + players.him.y) / 2;

  return {
    x: Math.max(0, Math.min(Math.max(0,WORLD_W - canvas.width), cx - canvas.width / 2)),
    y: Math.max(0, Math.min(Math.max(0,WORLD_H - canvas.height), cy - canvas.height / 2))
  };
}

function drawSprite(p){
  const sw = 96;
  const sh = 128;
  const row = p.rows[p.dir];

  const dw = Math.round(sw * p.scale);
  const dh = Math.round(sh * p.scale);

  let drawX = Math.round(p.x - camera.x - dw / 2);
  let drawY = Math.round(p.y - camera.y - dh + 10);
  let drawW = dw;
  let drawH = dh;

  if(p === players.him && p.dir === 'right'){
    drawX -= 4;
    drawW += 8;
  }

  const jumpOffset = getBedJumpOffset();

  if(bedJumping){
    drawY += jumpOffset;

    if(jumpOffset < -18){
      drawY -= 4;
      drawH += 8;
    }
  }

  if(bedLandingTimer > 0){
    drawY += 4;
    drawH -= 5;
    drawW += 5;
    drawX -= 2;
  }

  if(actionState && actionState.phase === 'active'){
    const t = actionState.timer;

    if(actionState.type === 'sit'){
      drawY += Math.sin(t / 10) * 2;
    }

    if(actionState.type === 'coffee' && t % 80 > 40){
      drawY -= 3;
    }

    if(actionState.type === 'fireplace'){
      drawW += Math.sin(t / 12) * 2;
    }
  }

  if(bedLayDown){
    const layAngle = p === players.her ? -Math.PI / 2 : Math.PI / 2;
    const layX = p === players.her ? p.x - camera.x - 14 : p.x - camera.x + 14;
    const layY = p.y - camera.y - 18;

    ctx.save();
    ctx.translate(Math.round(layX), Math.round(layY));
    ctx.rotate(layAngle);
    ctx.drawImage(
      p.img,
      p.frame * sw,
      row * sh,
      sw,
      sh,
      Math.round(-drawW / 2),
      Math.round(-drawH / 2),
      drawW,
      drawH
    );
    ctx.restore();
    return;
  }

  ctx.drawImage(p.img, p.frame * sw, row * sh, sw, sh, drawX, drawY, drawW, drawH);
}

function drawPixelHeart(x,y,size){
  const blocks = [
    [1,0],[2,0],[4,0],[5,0],
    [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],
    [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
    [1,3],[2,3],[3,3],[4,3],[5,3],
    [2,4],[3,4],[4,4],
    [3,5]
  ];

  ctx.save();
  ctx.translate(Math.round(x - 3.5 * size), Math.round(y - 3 * size));

  ctx.fillStyle = '#ff6bb5';
  blocks.forEach(([bx,by]) => ctx.fillRect(bx * size, by * size, size, size));

  ctx.fillStyle = '#ffd1e8';
  ctx.fillRect(size, size, size, size);

  ctx.restore();
}

function drawCoupleHeart(){
  const distance = Math.hypot(
    players.her.x - players.him.x,
    players.her.y - players.him.y
  );

  if(distance > 60) return;

  const midX = (players.her.x + players.him.x) / 2 - camera.x;
  const midY = Math.min(players.her.y, players.him.y) - camera.y - 78;
  const float = Math.sin(heartTimer / 12) * 5;
  const pulse = Math.sin(heartTimer / 10) > 0 ? 4 : 3;

  ctx.save();
  ctx.shadowColor = '#ff7ac8';
  ctx.shadowBlur = 10;
  drawPixelHeart(midX, midY + float, pulse);
  ctx.restore();
}

function drawHeartParticles(){
  heartParticles.forEach(h => {
    ctx.save();
    ctx.globalAlpha = Math.max(0,h.life / 70);
    ctx.shadowColor = '#ff7ac8';
    ctx.shadowBlur = 8;
    drawPixelHeart(h.x - camera.x, h.y - camera.y, h.size);
    ctx.restore();
  });
}

function drawBedSquish(){
  if(!bedJumping && bedLandingTimer <= 0 && !bedLayDown) return;

  const x = 1160 - camera.x;
  const y = 140 - camera.y;
  const w = 171;
  const h = 156;

  ctx.save();

  if(bedJumping){
    ctx.globalAlpha = .18;
    ctx.fillStyle = '#ff9acb';
    ctx.fillRect(x + 18, y + h - 30, w - 36, 8);
  }

  if(bedLandingTimer > 0){
    ctx.globalAlpha = .35;
    ctx.strokeStyle = '#ffd1e8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h - 28, 55 - bedLandingTimer * 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  if(bedLayDown){
    ctx.globalAlpha = .25 + Math.sin(heartTimer / 20) * .08;
    ctx.fillStyle = '#ff79bd';
    ctx.fillRect(x + 42, y + 98, 88, 5);
  }

  ctx.restore();
}

function drawActionEffects(){
  if(actionState && actionState.phase === 'active'){
    const t = actionState.timer;

    if(actionState.type === 'sit'){
      const wiggle = Math.sin(t / 10) * 3;
      drawPixelHeart(790 - camera.x + wiggle, 465 - camera.y, 3);
    }

    if(actionState.type === 'coffee'){
      const cupY = t % 80 > 40 ? 590 : 610;

      ctx.save();
      ctx.fillStyle = '#f5d6b5';
      ctx.fillRect(710 - camera.x, cupY - camera.y, 8, 8);
      ctx.fillRect(765 - camera.x, cupY - camera.y, 8, 8);
      ctx.restore();
    }

    if(actionState.type === 'fireplace'){
      const glow = .14 + Math.sin(t / 8) * .05;

      ctx.save();
      ctx.globalAlpha = glow;
      ctx.fillStyle = '#ff9b3d';
      ctx.beginPath();
      ctx.arc(280 - camera.x, 350 - camera.y, 150, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if(actionState.type === 'read'){
      ctx.save();
      ctx.fillStyle = '#f7e7b0';
      ctx.fillRect(590 - camera.x, 285 - camera.y, 18, 13);
      ctx.fillRect(630 - camera.x, 285 - camera.y, 18, 13);
      ctx.strokeStyle = '#8b5a2b';
      ctx.strokeRect(590 - camera.x, 285 - camera.y, 18, 13);
      ctx.strokeRect(630 - camera.x, 285 - camera.y, 18, 13);
      ctx.restore();
    }
  }

  warmthParticles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0,p.life / 45) * .7;
    ctx.fillStyle = '#ffb15c';
    ctx.fillRect(p.x - camera.x, p.y - camera.y, 4, 4);
    ctx.restore();
  });

  steamParticles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0,p.life / 55) * .55;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x - camera.x, p.y - camera.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawDebugRect(rect,color){
  ctx.fillStyle = color;
  ctx.fillRect(rect.x - camera.x, rect.y - camera.y, rect.w, rect.h);
}

function drawDebugCircle(x,y,r,color){
  ctx.beginPath();
  ctx.arc(x - camera.x, y - camera.y, r, 0, Math.PI * 2);
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
  ctx.strokeText(text, x - camera.x + 8, y - camera.y - 8);
  ctx.fillText(text, x - camera.x + 8, y - camera.y - 8);
}

function drawDebugZones(){
  if(!debugMode) return;

  ctx.save();

  solid.forEach(rect => drawDebugRect(rect,'rgba(255,0,0,0.35)'));

  interactZones.forEach(z => {
    drawDebugCircle(z.x,z.y,z.r,'rgba(0,255,90,0.28)');
    drawDebugText(z.name,z.x,z.y);
  });

  cabinActionZones.forEach(z => {
    drawDebugCircle(z.x,z.y,z.r,'rgba(255,220,0,0.28)');
    drawDebugText(z.name,z.x,z.y);
  });

  drawDebugRect(bedZone,'rgba(255,120,255,0.28)');
  drawDebugText('Bed Space Zone',bedZone.x,bedZone.y);

  spawnPoints.forEach(spawn => {
    drawDebugCircle(spawn.x,spawn.y,20,'rgba(170,80,255,0.75)');
    drawDebugText(spawn.name,spawn.x,spawn.y);
  });

  drawDebugCircle(players.her.x,players.her.y,10,'rgba(0,130,255,0.85)');
  drawDebugCircle(players.him.x,players.him.y,10,'rgba(0,130,255,0.85)');

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(18,18,535,126);

  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';
  ctx.fillText('DEBUG ON — press G to hide',32,42);
  ctx.fillText('Press B, drag a box, check Console',32,66);
  ctx.fillText('Red=blocked Green=spots Blue=players',32,90);
  ctx.fillText(`Her: ${Math.round(players.her.x)}, ${Math.round(players.her.y)}  Me: ${Math.round(players.him.x)}, ${Math.round(players.him.y)}`,32,114);
  ctx.fillText('Yellow=extra actions, purple box=bed space zone',32,138);

  if(boxMode && dragStart && dragEnd){
    const x = Math.min(dragStart.x, dragEnd.x) - camera.x;
    const y = Math.min(dragStart.y, dragEnd.y) - camera.y;
    const w = Math.abs(dragStart.x - dragEnd.x);
    const h = Math.abs(dragStart.y - dragEnd.y);

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

  drawBedSquish();
  drawActionEffects();

  drawDebugZones();

  [players.her,players.him]
    .sort((a,b) => a.y - b.y)
    .forEach(drawSprite);

  drawCoupleHeart();
  drawHeartParticles();
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
