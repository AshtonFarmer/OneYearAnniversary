// Silo Step 2 - cinematic descent sequence
// Press E at the hatch and the characters actually descend instead of instantly teleporting.

let descentScene = null;
let descentParticles = [];
let descentLastE = false;
let originalEnterCaveStep2 = enterCave;

function startCinematicDescent(){
  if(descentScene) return;

  descentScene = {
    phase:'walkToHatch',
    timer:0,
    hatchOpen:0,
    blueGlow:0,
    fade:0,
    message:'',
    herGone:false,
    himGone:false,
    cameraShake:0
  };

  descending = false;
  descentTimer = 0;
  fade = 0;
  descentParticles = [];

  const prompt = document.getElementById('prompt');
  prompt.style.display = 'none';
}

function easeStep(t){
  t = Math.max(0,Math.min(1,t));
  return t*t*(3-2*t);
}

function moveCharacterToward(p,target,speed=1.35){
  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const dist = Math.hypot(dx,dy) || 1;
  if(dist < 2){
    p.x = target.x;
    p.y = target.y;
    p.dir = target.dir || p.dir;
    p.frame = 0;
    p.frameTimer = 0;
    return true;
  }

  p.x += dx/dist * Math.min(speed,dist);
  p.y += dy/dist * Math.min(speed,dist);
  p.dir = Math.abs(dx) > Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up');

  p.frameTimer = (p.frameTimer || 0) + 1;
  if(p.frameTimer > 10){
    const seq = p.frames[p.dir];
    const i = seq.indexOf(p.frame);
    p.frame = seq[(i+1+seq.length)%seq.length];
    p.frameTimer = 0;
  }
  return false;
}

function spawnDescentMist(count=1){
  for(let i=0;i<count;i++){
    descentParticles.push({
      x:480 + (Math.random()-.5)*105,
      y:535 + (Math.random()-.5)*45,
      vx:(Math.random()-.5)*.55,
      vy:-.35-Math.random()*.55,
      life:70+Math.random()*80,
      size:2+Math.random()*5,
      color:Math.random()<.65?'#8be8ff':'#fff1c8'
    });
  }
}

function updateDescentParticles(){
  descentParticles = descentParticles.filter(p => {
    p.life--;
    p.x += p.vx + Math.sin((heartTimer+p.y)/40)*.12;
    p.y += p.vy;
    p.vy += .004;
    return p.life > 0;
  });
}

function finishDescentToCave(){
  descentScene = null;
  originalEnterCaveStep2();
  fade = 1;
}

function updateCinematicDescent(){
  if(!descentScene) return;

  descentScene.timer++;
  updateDescentParticles();

  const herTarget = {x:455,y:560,dir:'down'};
  const himTarget = {x:505,y:560,dir:'down'};

  if(descentScene.phase === 'walkToHatch'){
    const a = moveCharacterToward(players.her,herTarget,1.45);
    const b = moveCharacterToward(players.him,himTarget,1.45);
    descentScene.message = '';
    if(a && b){
      descentScene.phase = 'pauseBeforeOpen';
      descentScene.timer = 0;
      players.her.dir = 'up';
      players.him.dir = 'up';
    }
  }

  else if(descentScene.phase === 'pauseBeforeOpen'){
    descentScene.message = '...';
    if(descentScene.timer > 45){
      descentScene.phase = 'openHatch';
      descentScene.timer = 0;
      descentScene.cameraShake = 18;
      descentScene.message = 'CLUNK';
      spawnDescentMist(12);
    }
  }

  else if(descentScene.phase === 'openHatch'){
    descentScene.hatchOpen = easeStep(descentScene.timer/70);
    descentScene.blueGlow = Math.min(1,descentScene.timer/55);
    if(descentScene.timer % 4 === 0) spawnDescentMist(2);
    if(descentScene.cameraShake > 0) descentScene.cameraShake--;
    if(descentScene.timer > 92){
      descentScene.phase = 'lookDown';
      descentScene.timer = 0;
      descentScene.message = 'It keeps going down...';
    }
  }

  else if(descentScene.phase === 'lookDown'){
    descentScene.blueGlow = 1;
    if(descentScene.timer % 8 === 0) spawnDescentMist(1);
    if(descentScene.timer > 95){
      descentScene.phase = 'climbDown';
      descentScene.timer = 0;
      descentScene.message = '';
      players.her.dir = 'up';
      players.him.dir = 'up';
    }
  }

  else if(descentScene.phase === 'climbDown'){
    descentScene.blueGlow = 1;
    if(descentScene.timer % 6 === 0) spawnDescentMist(1);

    if(descentScene.timer < 95){
      players.him.y += .78;
      players.him.x += Math.sin(descentScene.timer/10)*.08;
      players.him.frame = descentScene.timer % 24 < 12 ? 1 : 2;
    } else {
      descentScene.himGone = true;
    }

    if(descentScene.timer > 42 && descentScene.timer < 142){
      players.her.y += .72;
      players.her.x += Math.sin(descentScene.timer/10)*.08;
      players.her.frame = descentScene.timer % 24 < 12 ? 1 : 2;
    } else if(descentScene.timer >= 142){
      descentScene.herGone = true;
    }

    if(descentScene.timer > 150){
      descentScene.phase = 'darkness';
      descentScene.timer = 0;
      descentScene.message = '';
    }
  }

  else if(descentScene.phase === 'darkness'){
    descentScene.fade = Math.min(1,descentScene.timer/85);
    descentScene.blueGlow = Math.max(0,1-descentScene.timer/95);
    if(descentScene.timer === 42) descentScene.message = '*drip*';
    if(descentScene.timer > 115){
      finishDescentToCave();
    }
  }
}

// Override startDescent so the old instant transition becomes cinematic.
startDescent = startCinematicDescent;

const originalSiloStep2Update = update;
update = function(){
  originalSiloStep2Update();
  updateCinematicDescent();

  // Prevent the old E press from starting another sequence while this is running.
  if(descentScene) descentLastE = !!keys.e;
};

function drawDescentMist(){
  if(!descentScene) return;
  ctx.save();
  descentParticles.forEach(p => {
    ctx.globalAlpha = Math.max(0,Math.min(.55,p.life/80));
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x-camera.x),Math.round(p.y-camera.y),p.size,p.size);
  });
  ctx.restore();
}

function drawHatchOpeningOverlay(){
  if(!descentScene || mode !== 'silo') return;

  const hx = 480-camera.x;
  const hy = 535-camera.y;
  const open = descentScene.hatchOpen || 0;
  const glow = descentScene.blueGlow || 0;

  ctx.save();

  // Cold blue light rising out of the hatch.
  if(glow > 0){
    const rg = ctx.createRadialGradient(hx,hy,10,hx,hy,145);
    rg.addColorStop(0,`rgba(78,211,255,${.42*glow})`);
    rg.addColorStop(1,'rgba(78,211,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(hx-170,hy-145,340,260);

    ctx.globalAlpha = .22*glow;
    ctx.fillStyle = '#8be8ff';
    ctx.beginPath();
    ctx.moveTo(hx-40,hy-5);
    ctx.lineTo(hx+40,hy-5);
    ctx.lineTo(hx+95,hy-250);
    ctx.lineTo(hx-95,hy-250);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Fake hatch door opening on top of the map art.
  if(open > 0){
    ctx.translate(hx,hy);
    ctx.rotate(-open*.75);
    ctx.fillStyle = '#7b4a2a';
    ctx.fillRect(-70,-30,140,56);
    ctx.strokeStyle = '#21140e';
    ctx.lineWidth = 5;
    ctx.strokeRect(-70,-30,140,56);
    ctx.fillStyle = '#24160f';
    ctx.fillRect(-48,-8,96,6);
    ctx.restore();
    return;
  }

  ctx.restore();
}

function drawDescentMessage(){
  if(!descentScene || !descentScene.message) return;
  ctx.save();
  const alpha = descentScene.phase === 'darkness' ? Math.max(0,1-descentScene.timer/70) : 1;
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px monospace';
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#02050a';
  ctx.fillStyle = descentScene.message === 'CLUNK' ? '#fff1c8' : '#dff8ff';
  ctx.shadowColor = '#87d8ff';
  ctx.shadowBlur = descentScene.message === 'CLUNK' ? 0 : 12;
  ctx.strokeText(descentScene.message,canvas.width/2,canvas.height*.23);
  ctx.fillText(descentScene.message,canvas.width/2,canvas.height*.23);
  ctx.restore();
}

function drawDescentFade(){
  if(!descentScene || descentScene.fade <= 0) return;
  ctx.save();
  ctx.globalAlpha = descentScene.fade;
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.restore();
}

// Hide characters after they climb through the hatch.
const originalSiloStep2DrawPlayers = drawPlayers;
drawPlayers = function(){
  if(!descentScene){
    originalSiloStep2DrawPlayers();
    return;
  }

  const savedHer = players.her;
  const savedHim = players.him;

  const arr = [];
  if(!descentScene.herGone) arr.push(players.her);
  if(!descentScene.himGone) arr.push(players.him);
  arr.sort((a,b)=>a.y-b.y).forEach(drawSprite);
};

const originalSiloStep2Draw = draw;
draw = function(){
  if(descentScene && descentScene.cameraShake > 0){
    const s = descentScene.cameraShake;
    ctx.save();
    ctx.translate((Math.random()-.5)*s*.45,(Math.random()-.5)*s*.45);
    originalSiloStep2Draw();
    ctx.restore();
  } else {
    originalSiloStep2Draw();
  }

  drawHatchOpeningOverlay();
  drawDescentMist();
  drawDescentMessage();
  drawDescentFade();
};
