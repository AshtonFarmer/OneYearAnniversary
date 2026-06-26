// Extra Helipad interactions: helicopter takeoff, bench sitting, and waterfall splashing.
// Loaded after helipad.js so the original movement/debug system stays intact.

let helipadAction = null;
let helipadActionCooldown = 0;
let helipadParticles = [];
let helipadPetals = [];
let helicopterBladeSpin = 0;

// Add new interaction spots without replacing your original ones.
spots[0].text = 'Press E to take off together 🚁';
spots[0].action = 'takeoff';
spots[0].title = '🚁 Our Next Adventure';
spots[0].body = 'A little adventure photo moment. We can add real photos here later.';

spots.push(
  {
    name:'Bench Together',
    x:355,
    y:430,
    r:95,
    text:'Press E to sit together on the bench 🌸',
    action:'bench'
  },
  {
    name:'Waterfall Splash',
    x:560,
    y:720,
    r:105,
    text:'Press E to splash water together 💧',
    action:'waterfall'
  }
);

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
    p.frameTimer = 0;
    p.target = null;
    return true;
  }

  const step = Math.min(p.speed * 1.25, dist);
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

function startHelipadAction(action){
  helipadAction = {
    type:action,
    phase:'moving',
    timer:0
  };

  if(action === 'takeoff'){
    setTarget(players.her,920,405,'right');
    setTarget(players.him,870,405,'right');
  }

  if(action === 'bench'){
    setTarget(players.her,333,424,'down');
    setTarget(players.him,383,424,'down');
  }

  if(action === 'waterfall'){
    setTarget(players.her,520,735,'right');
    setTarget(players.him,610,735,'left');
  }
}

function spawnHelipadHeart(x,y){
  helipadParticles.push({
    type:'heart',
    x,
    y,
    life:75,
    size:Math.random() > .5 ? 3 : 4,
    vx:(Math.random() - .5) * .8,
    vy:-.7
  });
}

function spawnWind(){
  helipadParticles.push({
    type:'wind',
    x:760 + Math.random() * 460,
    y:235 + Math.random() * 250,
    life:55,
    vx:-1.4 - Math.random() * 1.4,
    vy:(Math.random() - .5) * .45,
    size:8 + Math.random() * 18
  });
}

function spawnPetal(){
  helipadPetals.push({
    x:230 + Math.random() * 350,
    y:260 + Math.random() * 260,
    life:160,
    vx:.25 + Math.random() * .55,
    vy:.35 + Math.random() * .45,
    size:2 + Math.random() * 2
  });
}

function spawnSplash(fromLeft){
  const baseX = fromLeft ? players.her.x + 20 : players.him.x - 20;
  const baseY = fromLeft ? players.her.y - 28 : players.him.y - 28;

  for(let i=0;i<9;i++){
    helipadParticles.push({
      type:'water',
      x:baseX,
      y:baseY,
      life:38 + Math.random() * 20,
      vx:(fromLeft ? 1 : -1) * (1.8 + Math.random() * 2.2),
      vy:-1.8 - Math.random() * 2,
      size:2 + Math.random() * 3
    });
  }
}

function updateHelipadAction(){
  helicopterBladeSpin += .18;

  if(heartTimer % 18 === 0) spawnWind();
  if(heartTimer % 22 === 0) spawnPetal();

  if(helipadActionCooldown > 0) helipadActionCooldown--;

  if(!helipadAction) return;

  const herDone = walkToTarget(players.her);
  const himDone = walkToTarget(players.him);

  if(helipadAction.phase === 'moving' && herDone && himDone){
    helipadAction.phase = 'active';
    helipadAction.timer = 0;

    if(helipadAction.type === 'takeoff'){
      players.her.dir = 'right';
      players.him.dir = 'right';
    }

    if(helipadAction.type === 'bench'){
      players.her.dir = 'down';
      players.him.dir = 'down';
      spawnHelipadHeart((players.her.x + players.him.x) / 2, players.her.y - 58);
    }

    if(helipadAction.type === 'waterfall'){
      players.her.dir = 'right';
      players.him.dir = 'left';
      spawnSplash(true);
    }
  }

  if(helipadAction.phase === 'active'){
    helipadAction.timer++;

    if(helipadAction.type === 'takeoff'){
      if(helipadAction.timer % 5 === 0) spawnWind();
      if(helipadAction.timer === 80){
        showModal({
          title:'🚁 Our Next Adventure',
          body:'This will be the adventure-photo spot. We can add real memories here later.'
        });
      }
    }

    if(helipadAction.type === 'bench'){
      if(helipadAction.timer % 70 === 0){
        spawnHelipadHeart((players.her.x + players.him.x) / 2, players.her.y - 58);
      }
    }

    if(helipadAction.type === 'waterfall'){
      if(helipadAction.timer % 42 === 0) spawnSplash(true);
      if(helipadAction.timer % 42 === 21) spawnSplash(false);
      if(helipadAction.timer % 85 === 0){
        spawnHelipadHeart((players.her.x + players.him.x) / 2, players.her.y - 58);
      }
    }
  }

  if(keys.e && helipadAction.phase === 'active' && helipadAction.timer > 30 && helipadActionCooldown <= 0){
    helipadAction = null;
    helipadActionCooldown = 20;
    players.her.dir = 'down';
    players.him.dir = 'down';
  }
}

function updateExtraParticles(){
  helipadParticles = helipadParticles.filter(p => {
    p.life--;
    p.x += p.vx;
    p.y += p.vy;

    if(p.type === 'water') p.vy += .22;
    if(p.type === 'heart') p.y -= .25;

    return p.life > 0;
  });

  helipadPetals = helipadPetals.filter(p => {
    p.life--;
    p.x += p.vx + Math.sin((heartTimer + p.y) / 20) * .2;
    p.y += p.vy;
    return p.life > 0;
  });
}

function drawHelicopterBlades(){
  // Visual effect only. It does not touch the map or any borders.
  const cx = 925 - camera.x;
  const cy = 300 - camera.y;
  const len = 185;

  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(helicopterBladeSpin);
  ctx.globalAlpha = .26;
  ctx.strokeStyle = '#d9efff';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-len,0);
  ctx.lineTo(len,0);
  ctx.moveTo(0,-len * .55);
  ctx.lineTo(0,len * .55);
  ctx.stroke();

  ctx.globalAlpha = .13;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(-len * .75,0);
  ctx.lineTo(len * .75,0);
  ctx.stroke();
  ctx.restore();
}

function drawHelipadParticles(){
  helipadPetals.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0,p.life / 160) * .8;
    ctx.fillStyle = '#ff7ac8';
    ctx.fillRect(p.x - camera.x, p.y - camera.y, p.size, p.size);
    ctx.restore();
  });

  helipadParticles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0,p.life / 70);

    if(p.type === 'heart'){
      ctx.shadowColor = '#ff7ac8';
      ctx.shadowBlur = 8;
      drawPixelHeart(p.x - camera.x, p.y - camera.y, p.size);
    }

    if(p.type === 'wind'){
      ctx.strokeStyle = '#d8f1ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x - camera.x, p.y - camera.y);
      ctx.lineTo(p.x - camera.x + p.size, p.y - camera.y - 4);
      ctx.stroke();
    }

    if(p.type === 'water'){
      ctx.fillStyle = '#8ee8ff';
      ctx.fillRect(p.x - camera.x, p.y - camera.y, p.size, p.size);
    }

    ctx.restore();
  });
}

function drawBenchSitOverlay(p){
  if(!helipadAction || helipadAction.type !== 'bench' || helipadAction.phase !== 'active') return false;

  const sw = 96;
  const sh = 128;
  const row = p.rows[p.dir];
  const dw = Math.round(sw * p.scale);
  const dh = Math.round(sh * p.scale);

  let drawX = Math.round(p.x - camera.x - dw / 2);
  let drawY = Math.round(p.y - camera.y - dh + 20 + Math.sin(helipadAction.timer / 12) * 1.5);

  ctx.drawImage(p.img, p.frame * sw, row * sh, sw, sh, drawX, drawY, dw, dh);

  // Little swinging feet illusion.
  ctx.save();
  ctx.globalAlpha = .75;
  ctx.fillStyle = '#1d2730';
  const footSwing = Math.sin(helipadAction.timer / 8) * 3;
  ctx.fillRect(p.x - camera.x - 10 + footSwing, p.y - camera.y - 6, 7, 12);
  ctx.fillRect(p.x - camera.x + 5 - footSwing, p.y - camera.y - 6, 7, 12);
  ctx.restore();

  return true;
}

const originalHelipadUpdate = update;
update = function(){
  if(!helipadAction){
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

  heartTimer++;
  updateHelipadAction();
  updateExtraParticles();

  const near = spots.find(s =>
    distToSpot(players.her,s) < s.r ||
    distToSpot(players.him,s) < s.r
  );

  const prompt = document.getElementById('prompt');

  if(helipadAction && helipadAction.phase === 'active'){
    prompt.style.display = 'block';
    prompt.textContent = 'Press E to stop';
  } else if(near){
    prompt.style.display = 'block';
    prompt.textContent = near.text;
  } else {
    prompt.style.display = 'none';
  }

  if(keys.e && !lastE && near && !helipadAction && helipadActionCooldown <= 0){
    if(near.action === 'back') location.href = 'index.html';
    else if(near.action === 'takeoff' || near.action === 'bench' || near.action === 'waterfall'){
      startHelipadAction(near.action);
      helipadActionCooldown = 20;
    } else if(near.action === 'photos'){
      showModal(near);
    }
  }

  lastE = !!keys.e;
};

const originalHelipadDrawSprite = drawSprite;
drawSprite = function(p){
  if(drawBenchSitOverlay(p)) return;
  originalHelipadDrawSprite(p);
};

const originalHelipadDrawDebugZones = drawDebugZones;
drawDebugZones = function(){
  originalHelipadDrawDebugZones();

  if(!debugMode) return;

  ctx.save();
  spots.forEach(spot => {
    if(spot.action === 'bench' || spot.action === 'waterfall' || spot.action === 'takeoff'){
      drawDebugCircle(spot.x, spot.y, spot.r, 'rgba(255,220,0,0.30)');
      drawDebugText(spot.name, spot.x, spot.y);
    }
  });
  ctx.restore();
};

const originalHelipadDraw = draw;
draw = function(){
  camera = getCamera();

  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = '#061018';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.drawImage(map,-camera.x,-camera.y);

  drawHelicopterBlades();
  drawHelipadParticles();
  drawDebugZones();

  const arr = [players.her,players.him].sort((a,b) => a.y - b.y);
  arr.forEach(drawSprite);

  drawCoupleHeart();
};
