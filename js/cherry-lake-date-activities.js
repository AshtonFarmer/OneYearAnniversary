// Step 3: date activities for Cherry Blossom Lake.
// Adds skip rocks, picnic blanket, and permanent tree initials.

const skipStartBox = {x:366, y:315, w:65, h:55};
const skipWaterBox = {x:370, y:388, w:58, h:507};
const picnicBox = {x:334, y:16, w:148, h:97};
const initialsTreeBox = {x:1351, y:922, w:30, h:65};

let dateActivity = null;
let dateActivityLastE = false;
let dateActivityCooldown = 0;
let skipRocks = [];
let dateParticles = [];
let picnicActive = false;
let carvedInitials = localStorage.getItem('cherryLakeInitialsCarved') === 'true';
let bestSkips = Number(localStorage.getItem('bestRockSkips') || 0);
let skipMessage = null;
let skipMessageTimer = 0;

function inDateBox(x,y,b){
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

function nearDateBox(b){
  return inDateBox(players.her.x,players.her.y,b) || inDateBox(players.him.x,players.him.y,b);
}

function spawnDateHeart(x,y){
  dateParticles.push({type:'heart',x,y,life:72,size:4});
}

function startSkipRocks(){
  dateActivity = {type:'skip',timer:0};
  dateActivityCooldown = 30;
  players.her.dir = 'down';
  players.him.dir = 'down';

  const count = 2 + Math.floor(Math.random() * 6);
  const newRecord = count > bestSkips;
  if(newRecord){
    bestSkips = count;
    localStorage.setItem('bestRockSkips',String(bestSkips));
  }

  skipMessage = newRecord ? `${count} Skips! New Record!` : `${count} Skips!`;
  skipMessageTimer = 130;

  const startX = skipStartBox.x + skipStartBox.w / 2;
  const startY = skipStartBox.y + skipStartBox.h / 2;

  for(let i=0;i<count;i++){
    const t = i / Math.max(1,count-1);
    skipRocks.push({
      x:startX,
      y:startY,
      sx:startX,
      sy:startY,
      tx:skipWaterBox.x + 12 + Math.random() * Math.max(8,skipWaterBox.w-24),
      ty:skipWaterBox.y + 30 + t * (skipWaterBox.h - 60),
      delay:14 + i * 18,
      life:24,
      maxLife:24
    });
  }
}

function startPicnic(){
  picnicActive = true;
  dateActivity = {type:'picnic',phase:'moving',timer:0};
  dateActivityCooldown = 30;

  players.her.target = {x:386,y:92,dir:'down'};
  players.him.target = {x:430,y:92,dir:'down'};
}

function startTreeCarving(){
  dateActivity = {type:'tree',timer:0};
  dateActivityCooldown = 30;
  carvedInitials = true;
  localStorage.setItem('cherryLakeInitialsCarved','true');
  players.her.dir = 'right';
  players.him.dir = 'right';
  spawnDateHeart(initialsTreeBox.x + 15, initialsTreeBox.y - 12);
}

function updateDateTarget(p){
  if(!p.target) return true;
  const dx = p.target.x - p.x;
  const dy = p.target.y - p.y;
  const dist = Math.hypot(dx,dy) || 1;
  if(dist < 3){
    p.x = p.target.x;
    p.y = p.target.y;
    p.dir = p.target.dir || p.dir;
    p.frame = 0;
    p.target = null;
    return true;
  }

  const step = Math.min(p.speed * 1.2,dist);
  p.x += dx / dist * step;
  p.y += dy / dist * step;
  p.dir = Math.abs(dx) > Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up');
  p.frameTimer = (p.frameTimer || 0) + 1;
  if(p.frameTimer > 8){
    const seq = p.frames[p.dir];
    const i = seq.indexOf(p.frame);
    p.frame = seq[(i + 1 + seq.length) % seq.length];
    p.frameTimer = 0;
  }
  return false;
}

function updateDateActivities(){
  if(dateActivityCooldown > 0) dateActivityCooldown--;
  if(skipMessageTimer > 0) skipMessageTimer--;

  skipRocks = skipRocks.filter(r => {
    if(r.delay > 0){ r.delay--; return true; }
    r.life--;
    const t = 1 - r.life / r.maxLife;
    const smooth = t*t*(3-2*t);
    r.x = r.sx + (r.tx - r.sx) * smooth;
    r.y = r.sy + (r.ty - r.sy) * smooth - Math.sin(smooth*Math.PI) * 18;
    if(r.life === 5){
      dateParticles.push({type:'ripple',x:r.tx,y:r.ty,life:36,size:5});
    }
    return r.life > 0;
  });

  dateParticles = dateParticles.filter(p => {
    p.life--;
    if(p.type === 'heart') p.y -= .5;
    if(p.type === 'steam') p.y -= .55;
    return p.life > 0;
  });

  if(!dateActivity) return;

  dateActivity.timer++;

  if(dateActivity.type === 'picnic'){
    if(dateActivity.phase === 'moving'){
      const done1 = updateDateTarget(players.her);
      const done2 = updateDateTarget(players.him);
      if(done1 && done2){
        dateActivity.phase = 'active';
        dateActivity.timer = 0;
        players.her.dir = 'down';
        players.him.dir = 'down';
        spawnDateHeart(408,46);
      }
    } else {
      players.her.frame = 0;
      players.him.frame = 0;
      if(dateActivity.timer % 75 === 0) spawnDateHeart(408,46);
      if(dateActivity.timer % 14 === 0){
        dateParticles.push({type:'steam',x:413 + Math.random()*14,y:69,life:44});
      }
    }
  }

  if(dateActivity.type === 'tree' && dateActivity.timer > 120){
    dateActivity = null;
  }

  if(dateActivity.type === 'skip' && dateActivity.timer > 170){
    dateActivity = null;
  }
}

const originalDateUpdate = update;
update = function(){
  originalDateUpdate();
  updateDateActivities();

  const prompt = document.getElementById('prompt');
  const nearSkip = nearDateBox(skipStartBox);
  const nearPicnic = nearDateBox(picnicBox);
  const nearTree = nearDateBox(initialsTreeBox);

  if(!dateActivity){
    if(nearSkip){
      prompt.style.display = 'block';
      prompt.textContent = 'Press E to skip rocks';
    } else if(nearPicnic){
      prompt.style.display = 'block';
      prompt.textContent = picnicActive ? 'Press E to relax at the picnic' : 'Press E to set up a picnic';
    } else if(nearTree){
      prompt.style.display = 'block';
      prompt.textContent = carvedInitials ? 'A ❤️ T is carved here forever' : 'Press E to carve your initials';
    }
  }

  if(keys.e && !dateActivityLastE && !dateActivity && dateActivityCooldown <= 0){
    if(nearSkip) startSkipRocks();
    else if(nearPicnic) startPicnic();
    else if(nearTree && !carvedInitials) startTreeCarving();
  }

  if(keys.e && !dateActivityLastE && dateActivity && dateActivity.type === 'picnic' && dateActivity.phase === 'active' && dateActivity.timer > 30){
    dateActivity = null;
    dateActivityCooldown = 25;
  }

  dateActivityLastE = !!keys.e;
};

function drawPicnic(){
  if(!picnicActive) return;
  const x = picnicBox.x - camera.x;
  const y = picnicBox.y - camera.y;

  ctx.save();
  ctx.globalAlpha = .95;
  ctx.fillStyle = '#ff7fae';
  ctx.fillRect(x+36,y+48,76,38);
  ctx.fillStyle = '#ffd7e8';
  for(let i=0;i<4;i++){
    ctx.fillRect(x+36+i*19,y+48,9,38);
    ctx.fillRect(x+36,y+48+i*10,76,5);
  }

  ctx.fillStyle = '#9b5a2e';
  ctx.fillRect(x+83,y+35,22,18);
  ctx.fillStyle = '#d99a51';
  ctx.fillRect(x+87,y+31,14,7);

  ctx.fillStyle = '#fff1d6';
  ctx.fillRect(x+55,y+58,10,8);
  ctx.fillStyle = '#f2b544';
  ctx.fillRect(x+70,y+61,13,6);
  ctx.fillStyle = '#8b4a2b';
  ctx.fillRect(x+96,y+58,7,10);
  ctx.restore();
}

function drawTreeInitials(){
  if(!carvedInitials) return;
  ctx.save();
  const x = initialsTreeBox.x - camera.x - 10;
  const y = initialsTreeBox.y - camera.y + 16;
  ctx.font = '12px monospace';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#4a2a16';
  ctx.fillStyle = '#ffd0d0';
  ctx.strokeText('A ♥ T',x,y);
  ctx.fillText('A ♥ T',x,y);
  ctx.restore();
}

function drawDateParticles(){
  skipRocks.forEach(r => {
    if(r.delay > 0) return;
    ctx.save();
    ctx.fillStyle = '#d9d1c3';
    ctx.fillRect(Math.round(r.x-camera.x),Math.round(r.y-camera.y),4,3);
    ctx.restore();
  });

  dateParticles.forEach(p => {
    ctx.save();
    if(p.type === 'ripple'){
      ctx.globalAlpha = Math.max(0,p.life/36)*.55;
      ctx.strokeStyle = '#bdefff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(p.x-camera.x,p.y-camera.y,p.size+(36-p.life)*.55,(p.size+(36-p.life)*.55)*.45,0,0,Math.PI*2);
      ctx.stroke();
    }
    if(p.type === 'heart'){
      ctx.globalAlpha = Math.max(0,p.life/72);
      ctx.shadowColor = '#ff7ac8';
      ctx.shadowBlur = 8;
      drawPixelHeart(p.x-camera.x,p.y-camera.y,p.size);
    }
    if(p.type === 'steam'){
      ctx.globalAlpha = Math.max(0,p.life/44)*.45;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x-camera.x,p.y-camera.y,3,0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawSkipMessage(){
  if(skipMessageTimer <= 0 || !skipMessage) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1,skipMessageTimer/25);
  ctx.font = '22px monospace';
  ctx.textAlign = 'center';
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#241820';
  ctx.fillStyle = '#ffd983';
  ctx.strokeText(skipMessage,canvas.width/2,95);
  ctx.fillText(skipMessage,canvas.width/2,95);
  ctx.restore();
}

const originalDateDebugZones = drawDebugZones;
drawDebugZones = function(){
  originalDateDebugZones();
  if(!debugMode) return;
  ctx.save();
  drawDebugRect(skipStartBox,'rgba(255,220,0,0.22)');
  drawDebugText('Skip Rocks Start',skipStartBox.x,skipStartBox.y);
  drawDebugRect(skipWaterBox,'rgba(0,180,255,0.18)');
  drawDebugText('Skip Water',skipWaterBox.x,skipWaterBox.y);
  drawDebugRect(picnicBox,'rgba(255,120,180,0.22)');
  drawDebugText('Picnic',picnicBox.x,picnicBox.y);
  drawDebugRect(initialsTreeBox,'rgba(255,190,0,0.24)');
  drawDebugText('Initials Tree',initialsTreeBox.x,initialsTreeBox.y);
  ctx.restore();
};

const originalDateDraw = draw;
draw = function(){
  camera = getCamera();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#061018';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(map,-camera.x,-camera.y);

  drawPicnic();
  if(typeof ducks !== 'undefined') ducks.forEach(drawDuck);
  if(typeof koiFish !== 'undefined') koiFish.forEach(drawKoi);
  if(typeof drawDuckParticles === 'function') drawDuckParticles();
  if(typeof drawKoiEffects === 'function') drawKoiEffects();
  if(typeof drawFishEffects === 'function') drawFishEffects();
  drawDateParticles();
  if(typeof drawLakePetals === 'function') drawLakePetals();
  if(typeof lakeButterflies !== 'undefined') lakeButterflies.forEach(drawButterfly);
  drawTreeInitials();
  drawDebugZones();

  const arr = [players.her,players.him].sort((a,b) => a.y - b.y);
  arr.forEach(drawSprite);
  drawCoupleHeart();
  drawSkipMessage();
};
