// Debug mode: press G to show/hide zones. Red=blocked, green=interaction/walkable, blue=players, purple=spawn.
// Box select mode: press B, click + drag a rectangle, release, then copy the coordinates from Console.

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

const seasons = [
  {key:'spring', label:'Spring', emoji:'🌼', coins:1, map:'assets/maps/main-map-spring.png'},
  {key:'summer', label:'Summer', emoji:'☀️', coins:2, map:'assets/maps/main-map.png'},
  {key:'fall', label:'Fall', emoji:'🍁', coins:3, map:'assets/maps/main-map-fall.png'},
  {key:'winter', label:'Winter', emoji:'❄️', coins:4, map:'assets/maps/main-map-winter.png'},
  {key:'night', label:'Night', emoji:'🌙', coins:5, map:'assets/maps/main-map-night.png'}
];

let currentSeason = localStorage.getItem('currentSeason') || 'summer';
let nextWellCoins = Number(localStorage.getItem('nextWellCoins') || 1);
let seasonMessage = null;
let seasonMessageTimer = 0;
let coinAnimation = null;

function getSeason(){
  return seasons.find(season => season.key === currentSeason) || seasons[1];
}

function getNextWellSeason(){
  return seasons.find(season => season.coins === nextWellCoins) || seasons[0];
}

function setMapForSeason(seasonKey){
  const season = seasons.find(item => item.key === seasonKey) || seasons[1];
  currentSeason = season.key;
  localStorage.setItem('currentSeason', currentSeason);

  map.onerror = () => {
    map.onerror = null;
    map.src = 'assets/maps/main-map.png';
  };

  map.src = season.map;
}

setMapForSeason(currentSeason);

const herImg = new Image(); 
herImg.src = 'assets/sprites/her_atlas.png';

const himImg = new Image(); 
himImg.src = 'assets/sprites/him_atlas.png';

const keys = {};
let debugMode = false;
let boxSelectMode = false;
let boxStart = null;
let boxCurrent = null;

addEventListener('keydown', e => {
  const key = e.key.toLowerCase();

  if(key === 'g'){
    debugMode = !debugMode;
    e.preventDefault();
    return;
  }

  if(key === 'b'){
    boxSelectMode = !boxSelectMode;
    boxStart = null;
    boxCurrent = null;
    console.log(boxSelectMode ? 'BOX SELECT ON - drag a box' : 'BOX SELECT OFF');
    e.preventDefault();
    return;
  }

  keys[key] = true;

  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)){
    e.preventDefault();
  }
});

addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousedown', e => {
  if(!boxSelectMode) return;

  const rect = canvas.getBoundingClientRect();

  boxStart = {
    x: Math.round(e.clientX - rect.left + camera.x),
    y: Math.round(e.clientY - rect.top + camera.y)
  };

  boxCurrent = {...boxStart};
});

canvas.addEventListener('mousemove', e => {
  if(!boxSelectMode || !boxStart) return;

  const rect = canvas.getBoundingClientRect();

  boxCurrent = {
    x: Math.round(e.clientX - rect.left + camera.x),
    y: Math.round(e.clientY - rect.top + camera.y)
  };
});

canvas.addEventListener('mouseup', () => {
  if(!boxSelectMode || !boxStart || !boxCurrent) return;

  const x = Math.min(boxStart.x, boxCurrent.x);
  const y = Math.min(boxStart.y, boxCurrent.y);
  const w = Math.abs(boxCurrent.x - boxStart.x);
  const h = Math.abs(boxCurrent.y - boxStart.y);

  const boxCode = `{x:${x}, y:${y}, w:${w}, h:${h}}`;

  console.log('COPY THIS:', boxCode);

  boxStart = null;
  boxCurrent = null;
});

let WORLD_W = 1536;
let WORLD_H = 1024;
let camera = {x:0,y:0};
let heartTimer = 0;

let kissCount = Number(localStorage.getItem('kissCount') || 0);
let lastKissAt = 0;

let achievementMessage = null;
let achievementTimer = 0;

let achievement100Shown = localStorage.getItem('achievement100Kisses') === 'true';
let achievement1000Shown = localStorage.getItem('achievement1000Kisses') === 'true';

const wellZone = {x:112, y:271, w:57, h:45};
const wellInside = {x:127, y:228, w:37, h:22};

const locs = [
  {
    name:'Helipad',
    x:108, y:525, r:50,
    page:'helipad.html',
    text:'Press E to board the helicopter 🚁'
  },

  {
    name:'Main Cabin',
    x:390, y:556, r:55,
    page:'cabin.html',
    text:'Press E to enter the main cabin 🏡'
  },

  {
    name:'Cherry Blossom Lake',
    x:743, y:898, r:55,
    page:'cherry-lake.html',
    text:'Press E to visit Cherry Blossom Lake 🌸'
  },

  {
    name:'Shopping Center',
    x:1116, y:534, r:90,
    page:'shopping.html',
    text:'Press E to enter the shopping center 🛍️'
  },

  {
    name:'Well of Seasons',
    x:wellZone.x + wellZone.w / 2,
    y:wellZone.y + wellZone.h / 2,
    r:62,
    page:null,
    action:'well',
    text:() => {
      const season = getNextWellSeason();
      return `Press E to toss ${season.coins} coin${season.coins === 1 ? '' : 's'} into the Well of Seasons ${season.emoji} ${season.label}`;
    }
  },

  {
    name:'Future Spot',
    x:1179, y:248, r:55,
    page:null,
    text:'Locked for later 💕'
  }
];

const solid = [

  // ===== WORLD BOUNDARIES =====
  {x:-50,y:-50,w:50,h:WORLD_H+100},             // Left map edge
  {x:WORLD_W,y:-50,w:50,h:WORLD_H+100},         // Right map edge
  {x:-50,y:-50,w:WORLD_W+100,h:50},             // Top map edge
  {x:-50,y:WORLD_H,w:WORLD_W+100,h:50},         // Bottom map edge


  // ===== CHERRY BLOSSOM LAKE =====
  {x:626,y:658,w:249,h:239},                    // Cherry Blossom Lake Pond


  // ===== UI PANELS =====
  {x:23,y:792,w:232,h:207},                     // Players Box
  {x:1226,y:858,w:270,h:141},                   // Music Player Box
  {x:17,y:10,w:378,h:115},                      // One Year Anniversary Banner
  {x:1289,y:17,w:222,h:138},                    // Controls Box


  // ===== HELIPAD AREA =====
  {x:31,y:353,w:175,h:155},                     // Helicopter Pad


  // ===== CENTER OF MAP =====
  {x:244,y:322,w:285,h:204},                    // Main Cabin
  {x:693,y:78,w:68,h:156},                      // Windmill
  {x:109,y:184,w:66,h:101},                     // Well
  {x:949,y:22,w:62,h:198},                      // Silo
  {x:521,y:82,w:124,h:196},                     // Greenhouse
  {x:1073,y:99,w:172,h:145},                    // Right Corner House
  {x:195,y:122,w:274,h:146},                    // Left Corner Sheds


  // ===== WATER / CLIFF EDGES =====
  {x:389,y:982,w:304,h:42},                     // Bottom Left Water
  {x:788,y:978,w:152,h:50},                     // Bottom Right Water


  // ===== SHOPPING CENTER =====
  {x:1011,y:287,w:122,h:127},                   // Shopping Barn 1
  {x:1207,y:282,w:118,h:131},                   // Shopping Barn 2
  {x:970,y:413,w:107,h:241},                    // Shopping Barns 3 & 4
  {x:1145,y:423,w:113,h:231},                   // Shopping Barns 5 & 6
  {x:1358,y:388,w:86,h:175},                    // Shopping Barn 7 + Pond


  // ===== APPLE ORCHARD =====
  {x:140,y:653,w:67,h:132},                     // Tree Row 1
  {x:248,y:658,w:65,h:205},                     // Tree Row 2
  {x:341,y:664,w:66,h:204},                     // Tree Row 3
  {x:451,y:662,w:69,h:198},                     // Tree Row 4


  // ===== HOT SPRINGS =====
  {x:951,y:736,w:67,h:62},                      // Hot Spring 1
  {x:1066,y:736,w:61,h:60},                     // Hot Spring 2
  {x:1169,y:736,w:60,h:60},                     // Hot Spring 3
  {x:1304,y:734,w:60,h:67},                     // Hot Spring 4


  // ===== FENCES =====
  {x:255,y:922,w:212,h:25},                     // Fence 1
  {x:501,y:924,w:198,h:20},                     // Fence 2
  {x:777,y:922,w:264,h:18},                     // Fence 3
  {x:1094,y:915,w:127,h:17},                    // Fence 4
  {x:824,y:280,w:90,h:40},                      // Fence 5
  {x:93,y:304,w:80,h:18},                       // Fence 6
  {x:154,y:588,w:205,h:32},                     // Fence 7
  {x:406,y:587,w:165,h:29},                     // Fence 8
  {x:566,y:537,w:21,h:71}                       // Fence 9
];

const spawnPoints = [
  {name:'Her Spawn', x:692, y:424},
  {name:'Me Spawn', x:789, y:419}
];

function rectHit(x,y){ 
  return solid.some(s => x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h); 
}

const players = {
  her:{img:herImg, cols:4, x:720, y:650, dir:'down', frame:0, speed:3.0, name:'Her', scale:.58, rows:{down:0, up:2, left:3, right:1}, frames:{down:[0,1,2,3], up:[0,1,2,3], left:[0,1,2,3], right:[0,1,2,3]}},
  him:{img:himImg, cols:3, x:800, y:650, dir:'down', frame:0, speed:3.0, name:'Me', scale:.58, rows:{down:0, up:2, left:3, right:1}, frames:{down:[0,1,2], up:[0,1,2], left:[0,1,2], right:[0,1,2]}}
};

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
  } else { 
    p.frame = 0; 
    p.frameTimer = 0; 
  }
}

function distPlayerLoc(p,l){ 
  return Math.hypot(p.x - l.x, p.y - l.y); 
}

function tossSeasonCoins(){
  const season = getNextWellSeason();

  currentSeason = season.key;
  localStorage.setItem('currentSeason', currentSeason);

  nextWellCoins = season.coins >= 5 ? 1 : season.coins + 1;
  localStorage.setItem('nextWellCoins', nextWellCoins);

  setMapForSeason(season.key);

  seasonMessage = {
    title:'🪙 The Well of Seasons',
    text:`The well accepted ${season.coins} coin${season.coins === 1 ? '' : 's'}... ${season.emoji} ${season.label} has arrived.`
  };
  seasonMessageTimer = 260;

  coinAnimation = {
    x: wellInside.x + wellInside.w / 2,
    y: wellInside.y - 16,
    targetY: wellInside.y + wellInside.h / 2,
    timer: 55
  };

  window.dispatchEvent(new CustomEvent('season-change', {detail:{season:season.key, coins:season.coins}}));
}

let lastE = false;

function update(){
  movePlayer(players.her,{up:keys.arrowup,down:keys.arrowdown,left:keys.arrowleft,right:keys.arrowright});
  movePlayer(players.him,{up:keys.w,down:keys.s,left:keys.a,right:keys.d});
  heartTimer++;
  updateKissAchievement();

  const near = locs.find(l => distPlayerLoc(players.her,l) < l.r || distPlayerLoc(players.him,l) < l.r);
  const prompt = document.getElementById('prompt');

  if(near){ 
    prompt.style.display = 'block'; 
    prompt.textContent = typeof near.text === 'function' ? near.text() : near.text; 
  } else { 
    prompt.style.display = 'none'; 
  }

  if(keys.e && !lastE && near){
    if(near.action === 'well'){
      tossSeasonCoins();
    } else if(near.page){ 
      location.href = near.page; 
    }
  }

  lastE = !!keys.e;

  if(achievementTimer > 0){ 
    achievementTimer--; 
  }

  if(seasonMessageTimer > 0){
    seasonMessageTimer--;
  }

  if(coinAnimation){
    coinAnimation.timer--;
    if(coinAnimation.timer <= 0) coinAnimation = null;
  }
}

function updateKissAchievement(){
  const distance = Math.hypot(players.her.x - players.him.x, players.her.y - players.him.y);
  if(distance > 48) return;

  const now = performance.now();
  if(now - lastKissAt < 200) return;

  lastKissAt = now;
  kissCount++;
  localStorage.setItem('kissCount', kissCount);

  if(kissCount >= 100 && !achievement100Shown){
    achievement100Shown = true;
    achievementMessage = {title:'💖 100 Kisses', text:'Y’all really cannot stay apart.'};
    achievementTimer = 420;
    localStorage.setItem('achievement100Kisses', 'true');
  }

  if(kissCount >= 1000 && !achievement1000Shown){
    achievement1000Shown = true;
    achievementMessage = {title:'😂 1000 Kisses', text:'Wow y’all are REALLY in love. Calm down you two.'};
    achievementTimer = 520;
    localStorage.setItem('achievement1000Kisses', 'true');
  }
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
  const sw = 96, sh = 128, row = p.rows[p.dir];
  const dw = Math.round(sw * p.scale), dh = Math.round(sh * p.scale);
  let drawX = Math.round(p.x - camera.x - dw / 2);
  let drawY = Math.round(p.y - camera.y - dh + 10);
  let drawW = dw;

  if (p === players.him && p.dir === 'right') { 
    drawX -= 4; 
    drawW += 8; 
  }

  ctx.drawImage(p.img, p.frame * sw, row * sh, sw, sh, drawX, drawY, drawW, dh);
}

function drawPixelHeart(x, y, size){
  const blocks = [[1,0],[2,0],[4,0],[5,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[1,3],[2,3],[3,3],[4,3],[5,3],[2,4],[3,4],[4,4],[3,5]];
  ctx.save(); 
  ctx.translate(Math.round(x - 3.5 * size), Math.round(y - 3 * size)); 
  ctx.fillStyle = '#ff6bb5'; 
  blocks.forEach(([bx,by]) => ctx.fillRect(bx * size, by * size, size, size)); 
  ctx.fillStyle = '#ffd1e8'; 
  ctx.fillRect(size, size, size, size); 
  ctx.restore();
}

function drawCoupleHeart(){
  const distance = Math.hypot(players.her.x - players.him.x, players.her.y - players.him.y);
  if(distance > 48) return;

  const midX = (players.her.x + players.him.x) / 2 - camera.x;
  const midY = Math.min(players.her.y, players.him.y) - camera.y - 55;
  const float = Math.sin(heartTimer / 12) * 5;
  const pulse = Math.sin(heartTimer / 10) > 0 ? 4 : 3;

  ctx.save(); 
  ctx.shadowColor = '#ff7ac8'; 
  ctx.shadowBlur = 10; 
  drawPixelHeart(midX, midY + float, pulse); 
  ctx.restore();
}

function drawAchievement(){
  if(achievementTimer <= 0 || !achievementMessage) return;

  const alpha = Math.min(1, achievementTimer / 60);
  const boxW = 520, boxH = 120, x = canvas.width - boxW - 26, y = 26;

  ctx.save(); 
  ctx.globalAlpha = alpha; 
  ctx.fillStyle = 'rgba(25, 12, 18, 0.95)'; 
  ctx.strokeStyle = '#ff9dcc'; 
  ctx.lineWidth = 4; 
  roundRect(x, y, boxW, boxH, 14, true, true);

  ctx.fillStyle = '#ff9dcc'; 
  ctx.font = 'bold 24px monospace'; 
  ctx.fillText('Achievement Unlocked!', x + 22, y + 36);

  ctx.fillStyle = '#ffe18b'; 
  ctx.font = 'bold 22px monospace'; 
  ctx.fillText(achievementMessage.title, x + 22, y + 70);

  ctx.fillStyle = '#ffffff'; 
  ctx.font = '15px monospace'; 
  ctx.fillText(achievementMessage.text, x + 22, y + 98);

  ctx.restore();
}

function drawSeasonMessage(){
  if(seasonMessageTimer <= 0 || !seasonMessage) return;

  const alpha = Math.min(1, seasonMessageTimer / 50);
  const boxW = 560, boxH = 104, x = Math.round(canvas.width / 2 - boxW / 2), y = 26;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(12, 8, 24, 0.92)';
  ctx.strokeStyle = '#ffe18b';
  ctx.lineWidth = 4;
  roundRect(x, y, boxW, boxH, 14, true, true);

  ctx.fillStyle = '#ffe18b';
  ctx.font = 'bold 23px monospace';
  ctx.fillText(seasonMessage.title, x + 22, y + 38);

  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.fillText(seasonMessage.text, x + 22, y + 72);
  ctx.restore();
}

function drawSeasonBadge(){
  const season = getSeason();
  const text = `${season.emoji} ${season.label}`;
  const x = 24;
  const y = canvas.height - 70;

  ctx.save();
  ctx.fillStyle = 'rgba(10, 8, 18, 0.75)';
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2;
  roundRect(x, y, 160, 44, 10, true, true);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(text, x + 18, y + 29);
  ctx.restore();
}

function drawCoinAnimation(){
  if(!coinAnimation) return;

  const progress = 1 - coinAnimation.timer / 55;
  const y = coinAnimation.y + (coinAnimation.targetY - coinAnimation.y) * progress;
  const x = coinAnimation.x + Math.sin(progress * Math.PI * 2) * 5;
  const size = progress > 0.75 ? 3 : 6;

  ctx.save();
  ctx.fillStyle = '#ffe18b';
  ctx.strokeStyle = '#7a4a00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x - camera.x, y - camera.y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = 1 - progress;
  ctx.fillStyle = '#fff8c8';
  ctx.beginPath();
  ctx.arc(x - camera.x - 8, y - camera.y - 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(x, y, w, h, r, fill, stroke){
  ctx.beginPath(); 
  ctx.moveTo(x + r, y); 
  ctx.lineTo(x + w - r, y); 
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); 
  ctx.lineTo(x + w, y + h - r); 
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); 
  ctx.lineTo(x + r, y + h); 
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); 
  ctx.lineTo(x, y + r); 
  ctx.quadraticCurveTo(x, y, x + r, y); 
  ctx.closePath(); 
  if(fill) ctx.fill(); 
  if(stroke) ctx.stroke();
}

function drawDebugRect(rect, color){ 
  ctx.fillStyle = color; 
  ctx.fillRect(rect.x - camera.x, rect.y - camera.y, rect.w, rect.h); 
}

function drawDebugCircle(x, y, r, color){ 
  ctx.beginPath(); 
  ctx.arc(x - camera.x, y - camera.y, r, 0, Math.PI * 2); 
  ctx.fillStyle = color; 
  ctx.fill(); 
  ctx.strokeStyle = '#fff'; 
  ctx.lineWidth = 2; 
  ctx.stroke(); 
}

function drawDebugText(text, x, y){ 
  ctx.font = '14px monospace'; 
  ctx.lineWidth = 4; 
  ctx.strokeStyle = '#000'; 
  ctx.fillStyle = '#fff'; 
  ctx.strokeText(text, x - camera.x + 8, y - camera.y - 8); 
  ctx.fillText(text, x - camera.x + 8, y - camera.y - 8); 
}

function drawBoxSelector(){
  if(!boxSelectMode || !boxStart || !boxCurrent) return;

  const x = Math.min(boxStart.x, boxCurrent.x) - camera.x;
  const y = Math.min(boxStart.y, boxCurrent.y) - camera.y;
  const w = Math.abs(boxCurrent.x - boxStart.x);
  const h = Math.abs(boxCurrent.y - boxStart.y);

  ctx.save();
  ctx.fillStyle = 'rgba(0,180,255,0.25)';
  ctx.strokeStyle = '#00b4ff';
  ctx.lineWidth = 3;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function drawDebugZones(){
  if(!debugMode) return;

  ctx.save();

  solid.forEach(rect => drawDebugRect(rect, 'rgba(255,0,0,0.35)'));

  locs.forEach(loc => { 
    drawDebugCircle(loc.x, loc.y, loc.r, 'rgba(0,255,90,0.28)'); 
    drawDebugText(loc.name, loc.x, loc.y); 
  });

  drawDebugRect(wellZone, 'rgba(0,255,90,0.28)');
  drawDebugRect(wellInside, 'rgba(255,230,80,0.38)');
  drawDebugText('Well Toss Zone', wellZone.x, wellZone.y);
  drawDebugText('Coin Drop', wellInside.x, wellInside.y);

  spawnPoints.forEach(spawn => { 
    drawDebugCircle(spawn.x, spawn.y, 20, 'rgba(170,80,255,0.75)'); 
    drawDebugText(spawn.name, spawn.x, spawn.y); 
  });

  drawDebugCircle(players.her.x, players.her.y, 10, 'rgba(0,130,255,0.85)'); 
  drawDebugCircle(players.him.x, players.him.y, 10, 'rgba(0,130,255,0.85)');

  ctx.fillStyle = 'rgba(0,0,0,0.65)'; 
  ctx.fillRect(18,18,540,124); 

  ctx.fillStyle = '#fff'; 
  ctx.font = '15px monospace'; 
  ctx.fillText('DEBUG ON — press G to hide',32,42); 
  ctx.fillText('Press B, then drag to make a coordinate box',32,66);
  ctx.fillText('Red=blocked Green=areas Blue=players Yellow=coin drop',32,90); 
  ctx.fillText(`Season: ${getSeason().label} | Next well coins: ${nextWellCoins}`,32,114);
  ctx.fillText(`Her: ${Math.round(players.her.x)}, ${Math.round(players.her.y)}  Me: ${Math.round(players.him.x)}, ${Math.round(players.him.y)}`,32,136);

  ctx.restore();
}

function draw(){
  camera = getCamera();

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#061018'; 
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.drawImage(map,-camera.x,-camera.y);

  drawCoinAnimation();
  drawDebugZones();
  drawBoxSelector();

  const arr = [players.her,players.him].sort((a,b) => a.y - b.y);
  arr.forEach(drawSprite);

  drawCoupleHeart();
  drawAchievement();
  drawSeasonMessage();
  drawSeasonBadge();
}

function loop(){ 
  update(); 
  draw(); 
  requestAnimationFrame(loop); 
}

Promise.all([map.decode().catch(() => {}), herImg.decode(), himImg.decode()]).then(() => { 
  WORLD_W = map.naturalWidth || WORLD_W; 
  WORLD_H = map.naturalHeight || WORLD_H; 
  loop(); 
});