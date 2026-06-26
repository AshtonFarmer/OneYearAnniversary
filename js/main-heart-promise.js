// Main Heart Promise scene.
// Walk into the center of the heart and press E.

const promiseHeartBox = {x:718, y:405, w:52, h:48};
const promiseCenter = {x:744, y:430};

let promiseScene = null;
let promiseLastE = false;
let promiseParticles = [];
let promiseMessage = '';
let promiseMessageAlpha = 0;
let promiseHomeTimer = 0;
let promiseCooldown = 0;
let promiseOriginalVolume = null;

function inPromiseBox(x,y){
  return x >= promiseHeartBox.x && x <= promiseHeartBox.x + promiseHeartBox.w &&
         y >= promiseHeartBox.y && y <= promiseHeartBox.y + promiseHeartBox.h;
}

function nearPromiseHeart(){
  return inPromiseBox(players.her.x,players.her.y) || inPromiseBox(players.him.x,players.him.y);
}

function promiseMoveTo(p,target,speed=1.65){
  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const dist = Math.hypot(dx,dy) || 1;

  if(dist < 2.5){
    p.x = target.x;
    p.y = target.y;
    p.dir = target.dir || p.dir;
    p.frame = 0;
    return true;
  }

  p.x += dx / dist * Math.min(speed,dist);
  p.y += dy / dist * Math.min(speed,dist);
  p.dir = Math.abs(dx) > Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up');

  p.frameTimer = (p.frameTimer || 0) + 1;
  if(p.frameTimer > 10){
    const seq = p.frames[p.dir];
    const i = seq.indexOf(p.frame);
    p.frame = seq[(i + 1 + seq.length) % seq.length];
    p.frameTimer = 0;
  }

  return false;
}

function setPromiseVolume(v){
  const audio = document.querySelector('audio');
  if(!audio) return;
  if(promiseOriginalVolume === null) promiseOriginalVolume = audio.volume;
  audio.volume = Math.max(0,Math.min(1,v));
}

function restorePromiseVolume(){
  const audio = document.querySelector('audio');
  if(audio && promiseOriginalVolume !== null) audio.volume = promiseOriginalVolume;
  promiseOriginalVolume = null;
}

function startPromiseScene(){
  promiseScene = {phase:'walk',timer:0,white:0,bigHeart:0};
  promiseParticles = [];
  promiseMessage = '';
  promiseMessageAlpha = 0;
  promiseHomeTimer = 0;
  promiseCooldown = 30;

  players.her.target = null;
  players.him.target = null;
}

function updatePromiseScene(){
  if(!promiseScene) return;

  promiseScene.timer++;
  heartTimer++;

  const herSpot = {x:promiseCenter.x-18,y:promiseCenter.y+9,dir:'right'};
  const himSpot = {x:promiseCenter.x+18,y:promiseCenter.y+9,dir:'left'};
  const hugHer = {x:promiseCenter.x-6,y:promiseCenter.y+9,dir:'right'};
  const hugHim = {x:promiseCenter.x+7,y:promiseCenter.y+9,dir:'left'};

  if(promiseScene.phase === 'walk'){
    promiseMessage = '';
    const doneHer = promiseMoveTo(players.her,herSpot,1.6);
    const doneHim = promiseMoveTo(players.him,himSpot,1.6);
    if(doneHer && doneHim){
      promiseScene.phase = 'holdHands';
      promiseScene.timer = 0;
    }
  }

  else if(promiseScene.phase === 'holdHands'){
    players.her.dir = 'right';
    players.him.dir = 'left';
    players.her.frame = 0;
    players.him.frame = 0;
    setPromiseVolume(.35);
    if(promiseScene.timer > 95){
      promiseScene.phase = 'line1';
      promiseScene.timer = 0;
    }
  }

  else if(promiseScene.phase === 'line1'){
    promiseMessage = 'One year down...';
    promiseMessageAlpha = Math.min(1,promiseScene.timer/45) * Math.min(1,(180-promiseScene.timer)/45);
    if(promiseScene.timer > 180){
      promiseScene.phase = 'line2';
      promiseScene.timer = 0;
    }
  }

  else if(promiseScene.phase === 'line2'){
    promiseMessage = 'A lifetime to go.';
    promiseMessageAlpha = Math.min(1,promiseScene.timer/45) * Math.min(1,(180-promiseScene.timer)/45);
    if(promiseScene.timer > 180){
      promiseScene.phase = 'line3';
      promiseScene.timer = 0;
    }
  }

  else if(promiseScene.phase === 'line3'){
    promiseMessage = 'No matter where life takes us...';
    promiseMessageAlpha = Math.min(1,promiseScene.timer/45) * Math.min(1,(185-promiseScene.timer)/45);
    if(promiseScene.timer > 185){
      promiseScene.phase = 'line4';
      promiseScene.timer = 0;
    }
  }

  else if(promiseScene.phase === 'line4'){
    promiseMessage = "I'll always find my way back to you.";
    promiseMessageAlpha = Math.min(1,promiseScene.timer/45) * Math.min(1,(210-promiseScene.timer)/45);
    if(promiseScene.timer > 210){
      promiseScene.phase = 'hug';
      promiseScene.timer = 0;
    }
  }

  else if(promiseScene.phase === 'hug'){
    promiseMessage = '';
    promiseMoveTo(players.her,hugHer,1.25);
    promiseMoveTo(players.him,hugHim,1.25);
    players.her.dir = 'right';
    players.him.dir = 'left';
    promiseScene.bigHeart = Math.min(1,promiseScene.timer/90);
    if(promiseScene.timer > 165){
      promiseScene.phase = 'whiteFade';
      promiseScene.timer = 0;
    }
  }

  else if(promiseScene.phase === 'whiteFade'){
    promiseScene.white = Math.min(1,promiseScene.timer/90);
    if(promiseScene.timer > 145){
      promiseScene.phase = 'return';
      promiseScene.timer = 0;
    }
  }

  else if(promiseScene.phase === 'return'){
    promiseScene.white = Math.max(0,1-promiseScene.timer/90);
    players.her.x = hugHer.x;
    players.her.y = hugHer.y;
    players.him.x = hugHim.x;
    players.him.y = hugHim.y;
    players.her.dir = 'right';
    players.him.dir = 'left';
    if(promiseScene.timer > 100){
      promiseScene = null;
      promiseHomeTimer = 240;
      restorePromiseVolume();
    }
  }

  if(promiseScene && ['holdHands','line1','line2','line3','line4','hug'].includes(promiseScene.phase)){
    if(promiseScene.timer % 3 === 0){
      const a = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 76;
      promiseParticles.push({
        x:promiseCenter.x + Math.cos(a)*r,
        y:promiseCenter.y + Math.sin(a)*r*.55,
        angle:a,
        r:r,
        life:130,
        size:2 + Math.random()*3,
        speed:.018 + Math.random()*.018
      });
    }
  }

  promiseParticles = promiseParticles.filter(p => {
    p.life--;
    p.angle += p.speed;
    p.r -= .08;
    p.x = promiseCenter.x + Math.cos(p.angle)*p.r;
    p.y = promiseCenter.y + Math.sin(p.angle)*p.r*.55 - (130-p.life)*.12;
    return p.life > 0;
  });
}

const originalPromiseUpdate = update;
update = function(){
  if(promiseCooldown > 0) promiseCooldown--;
  const prompt = document.getElementById('prompt');

  if(promiseScene){
    updatePromiseScene();
    prompt.style.display = 'none';
    promiseLastE = !!keys.e;
    return;
  }

  originalPromiseUpdate();

  if(promiseHomeTimer > 0){
    promiseHomeTimer--;
    prompt.style.display = 'block';
    prompt.textContent = 'Home.';
  }
  else if(nearPromiseHeart()){
    prompt.style.display = 'block';
    prompt.textContent = 'Press E to make a promise';
  }

  if(keys.e && !promiseLastE && nearPromiseHeart() && promiseCooldown <= 0){
    startPromiseScene();
  }

  promiseLastE = !!keys.e;
};

function drawPromisePetals(){
  promiseParticles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0,p.life/130);
    ctx.translate(Math.round(p.x-camera.x),Math.round(p.y-camera.y));
    ctx.rotate(p.angle);
    ctx.fillStyle = '#ff8fcf';
    ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
    ctx.fillStyle = '#ffd1e8';
    ctx.fillRect(0,-p.size/2,Math.max(1,p.size/2),Math.max(1,p.size/2));
    ctx.restore();
  });
}

function drawPromiseVignette(){
  if(!promiseScene) return;
  let amount = 0;
  if(['holdHands','line1','line2','line3','line4','hug'].includes(promiseScene.phase)) amount = .72;
  if(promiseScene.phase === 'whiteFade') amount = Math.max(0,.72 - promiseScene.white*.72);
  if(amount <= 0) return;

  ctx.save();
  const g = ctx.createRadialGradient(canvas.width/2,canvas.height/2,120,canvas.width/2,canvas.height/2,Math.max(canvas.width,canvas.height)*.75);
  g.addColorStop(0,'rgba(0,0,0,0)');
  g.addColorStop(1,`rgba(5,2,10,${amount})`);
  ctx.fillStyle = g;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.restore();
}

function drawPromiseText(){
  if(!promiseScene || !promiseMessage || promiseMessageAlpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = promiseMessageAlpha;
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px monospace';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#241820';
  ctx.fillStyle = '#fff1d6';
  ctx.shadowColor = '#ff9dcc';
  ctx.shadowBlur = 15;
  ctx.strokeText(promiseMessage,canvas.width/2,canvas.height*.25);
  ctx.fillText(promiseMessage,canvas.width/2,canvas.height*.25);
  ctx.restore();
}

function drawPromiseBigHeart(){
  if(!promiseScene || promiseScene.bigHeart <= 0) return;
  const s = 5 + promiseScene.bigHeart * 7;
  const yFloat = Math.sin(heartTimer/18)*5 - promiseScene.bigHeart*45;
  const x = promiseCenter.x - camera.x;
  const y = promiseCenter.y - camera.y - 72 + yFloat;
  ctx.save();
  ctx.globalAlpha = promiseScene.bigHeart;
  ctx.shadowColor = '#ff7ac8';
  ctx.shadowBlur = 22;
  drawPixelHeart(x,y,s);
  ctx.restore();
}

function drawPromiseWhite(){
  if(!promiseScene || promiseScene.white <= 0) return;
  ctx.save();
  ctx.globalAlpha = promiseScene.white;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.restore();
}

const originalPromiseDrawDebugZones = drawDebugZones;
drawDebugZones = function(){
  originalPromiseDrawDebugZones();
  if(!debugMode) return;
  ctx.save();
  drawDebugRect(promiseHeartBox,'rgba(255,120,200,0.28)');
  drawDebugText('Promise Heart',promiseHeartBox.x,promiseHeartBox.y);
  ctx.restore();
};

const originalPromiseDraw = draw;
draw = function(){
  originalPromiseDraw();
  if(!promiseScene) return;
  drawPromisePetals();
  drawPromiseBigHeart();
  drawPromiseVignette();
  drawPromiseText();
  drawPromiseWhite();
};
