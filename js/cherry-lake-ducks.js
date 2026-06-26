// Cherry Blossom Lake duck feeding interaction.
// Ducks wander around the lake, then the right-side ducks swim to the food when you press E on the bridge.

const bridgeFeedBox = {x:671, y:580, w:115, h:126};
const foodTossBox = {x:811, y:596, w:94, h:115};
const duckBridgeBlock = {x:659, y:284, w:142, h:661};

const duckWaterZones = [
  {x:0, y:396, w:659, h:491},
  {x:137, y:474, w:512, h:305},
  {x:441, y:357, w:218, h:178},
  {x:305, y:698, w:343, h:197},
  {x:793, y:438, w:653, h:249},
  {x:799, y:686, w:422, h:188}
];

let duckFeedAction = null;
let duckParticles = [];
let duckFood = [];
let duckActionCooldown = 0;
let duckLastE = false;

const ducks = [
  {x:260,y:520,homeX:260,homeY:520,vx:.35,vy:.12,phase:0,target:null,zone:0,side:'left'},
  {x:520,y:430,homeX:520,homeY:430,vx:-.28,vy:.10,phase:1.7,target:null,zone:2,side:'left'},
  {x:360,y:760,homeX:360,homeY:760,vx:.26,vy:-.12,phase:3.1,target:null,zone:3,side:'left'},
  {x:1085,y:535,homeX:1085,homeY:535,vx:-.22,vy:.16,phase:4.4,target:null,zone:4,side:'right'},
  {x:930,y:760,homeX:930,homeY:760,vx:.24,vy:-.10,phase:2.4,target:null,zone:5,side:'right'},
  {x:1265,y:600,homeX:1265,homeY:600,vx:-.32,vy:.08,phase:5.1,target:null,zone:4,side:'right'}
];

function pointInBox(x,y,b){
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

function clampDuckToZone(d){
  const z = duckWaterZones[d.zone];
  if(d.x < z.x + 18){ d.x = z.x + 18; d.vx = Math.abs(d.vx); }
  if(d.x > z.x + z.w - 18){ d.x = z.x + z.w - 18; d.vx = -Math.abs(d.vx); }
  if(d.y < z.y + 18){ d.y = z.y + 18; d.vy = Math.abs(d.vy); }
  if(d.y > z.y + z.h - 18){ d.y = z.y + z.h - 18; d.vy = -Math.abs(d.vy); }

  if(d.side === 'left' && d.x > duckBridgeBlock.x - 18){
    d.x = duckBridgeBlock.x - 18;
    d.vx = -Math.abs(d.vx);
  }

  if(d.side === 'right' && d.x < duckBridgeBlock.x + duckBridgeBlock.w + 18){
    d.x = duckBridgeBlock.x + duckBridgeBlock.w + 18;
    d.vx = Math.abs(d.vx);
  }
}

function nearFeedBridge(){
  return pointInBox(players.her.x,players.her.y,bridgeFeedBox) ||
         pointInBox(players.him.x,players.him.y,bridgeFeedBox);
}

function startDuckFeeding(){
  duckFeedAction = {phase:'toss',timer:0};
  duckActionCooldown = 30;

  players.her.dir = 'right';
  players.him.dir = 'right';

  const startX = (players.her.x + players.him.x) / 2;
  const startY = Math.min(players.her.y,players.him.y) - 35;
  const endX = foodTossBox.x + foodTossBox.w / 2;
  const endY = foodTossBox.y + foodTossBox.h / 2;

  for(let i=0;i<18;i++){
    duckFood.push({
      x:startX,
      y:startY,
      sx:startX,
      sy:startY,
      tx:endX + (Math.random()-.5) * 42,
      ty:endY + (Math.random()-.5) * 42,
      life:42 + i * 2,
      maxLife:42 + i * 2,
      delay:i * 2
    });
  }

  ducks.forEach((d,i) => {
    if(d.side !== 'right'){
      d.target = null;
      return;
    }

    const rightIndex = ducks.filter(duck => duck.side === 'right').indexOf(d);
    d.target = {
      x:endX + Math.cos(rightIndex * Math.PI * 2 / 3) * 52,
      y:endY + Math.sin(rightIndex * Math.PI * 2 / 3) * 42
    };
  });
}

function updateDuckMovement(){
  ducks.forEach((d,i) => {
    d.phase += .035;

    if(d.target){
      const dx = d.target.x - d.x;
      const dy = d.target.y - d.y;
      const dist = Math.hypot(dx,dy);
      if(dist > 2){
        d.x += dx / dist * 1.35;
        d.y += dy / dist * 1.35;
      }
      clampDuckToZone(d);
    } else {
      d.x += d.vx + Math.sin(d.phase) * .12;
      d.y += d.vy + Math.cos(d.phase * .8) * .08;
      clampDuckToZone(d);
    }

    if(heartTimer % 18 === i * 3){
      duckParticles.push({type:'ripple',x:d.x,y:d.y+8,life:36,size:5});
    }
  });
}

function updateDuckFeeding(){
  if(duckActionCooldown > 0) duckActionCooldown--;

  updateDuckMovement();

  duckFood = duckFood.filter(f => {
    if(f.delay > 0){
      f.delay--;
      return true;
    }
    f.life--;
    const t = 1 - f.life / f.maxLife;
    const smooth = t * t * (3 - 2 * t);
    f.x = f.sx + (f.tx - f.sx) * smooth;
    f.y = f.sy + (f.ty - f.sy) * smooth - Math.sin(smooth * Math.PI) * 34;
    if(f.life === 6){
      duckParticles.push({type:'splash',x:f.tx,y:f.ty,life:34,size:8});
    }
    return f.life > 0;
  });

  duckParticles = duckParticles.filter(p => {
    p.life--;
    if(p.type === 'heart') p.y -= .45;
    return p.life > 0;
  });

  if(!duckFeedAction) return;

  duckFeedAction.timer++;

  if(duckFeedAction.timer > 75 && duckFeedAction.timer < 210 && duckFeedAction.timer % 22 === 0){
    ducks.filter(d => d.side === 'right').forEach(d => {
      duckParticles.push({type:'splash',x:d.x,y:d.y+8,life:22,size:4});
    });
  }

  if(duckFeedAction.timer === 95){
    duckParticles.push({type:'heart',x:foodTossBox.x + foodTossBox.w / 2,y:foodTossBox.y - 12,life:75,size:4});
  }

  if(duckFeedAction.timer > 320){
    duckFeedAction = null;
    ducks.forEach(d => d.target = null);
  }
}

const originalCherryUpdate = update;
update = function(){
  originalCherryUpdate();
  updateDuckFeeding();

  const prompt = document.getElementById('prompt');
  const feedNear = nearFeedBridge();

  if(feedNear && !duckFeedAction){
    prompt.style.display = 'block';
    prompt.textContent = 'Press E to feed the ducks';
  }

  if(keys.e && !duckLastE && feedNear && !duckFeedAction && duckActionCooldown <= 0){
    startDuckFeeding();
  }

  duckLastE = !!keys.e;
};

function drawDuck(d){
  const pecking = duckFeedAction && duckFeedAction.timer > 80 && duckFeedAction.timer < 230 && d.side === 'right';
  const x = Math.round(d.x - camera.x);
  const y = Math.round(d.y - camera.y + Math.sin(d.phase * 2) * 1.5 + (pecking ? Math.sin(duckFeedAction.timer / 3) * 2 : 0));
  const facingLeft = d.target ? d.target.x < d.x : d.vx < 0;
  const flip = facingLeft ? -1 : 1;

  ctx.save();
  ctx.translate(x,y);
  ctx.scale(flip,1);

  ctx.fillStyle = '#2f6f3a';
  ctx.fillRect(-5,-9,9,8);
  ctx.fillStyle = '#1f4d2a';
  ctx.fillRect(-3,-11,6,3);
  ctx.fillStyle = '#5b412f';
  ctx.fillRect(-11,-3,17,9);
  ctx.fillStyle = '#ddd6c4';
  ctx.fillRect(-9,-5,10,3);
  ctx.fillStyle = '#f2a23a';
  ctx.fillRect(4,-7,6,3);
  ctx.fillStyle = '#111';
  ctx.fillRect(1,-8,2,2);

  ctx.restore();
}

function drawDuckParticles(){
  duckParticles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0,p.life / 75);

    if(p.type === 'ripple'){
      ctx.strokeStyle = '#bdefff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = Math.max(0,p.life / 36) * .45;
      ctx.beginPath();
      ctx.ellipse(p.x-camera.x,p.y-camera.y,p.size + (36-p.life)*.45,(p.size + (36-p.life)*.45)*.45,0,0,Math.PI*2);
      ctx.stroke();
    }

    if(p.type === 'splash'){
      ctx.strokeStyle = '#8ee8ff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = Math.max(0,p.life / 34) * .75;
      ctx.beginPath();
      ctx.arc(p.x-camera.x,p.y-camera.y,p.size + (34-p.life)*.35,0,Math.PI*2);
      ctx.stroke();
    }

    if(p.type === 'heart'){
      ctx.shadowColor = '#ff7ac8';
      ctx.shadowBlur = 8;
      drawPixelHeart(p.x-camera.x,p.y-camera.y,p.size);
    }

    ctx.restore();
  });

  duckFood.forEach(f => {
    if(f.delay > 0) return;
    ctx.save();
    ctx.fillStyle = '#f2b544';
    ctx.fillRect(Math.round(f.x-camera.x),Math.round(f.y-camera.y),3,3);
    ctx.restore();
  });
}

const originalCherryDrawDebugZones = drawDebugZones;
drawDebugZones = function(){
  originalCherryDrawDebugZones();
  if(!debugMode) return;
  ctx.save();
  duckWaterZones.forEach(z => drawDebugRect(z,'rgba(0,180,255,0.12)'));
  drawDebugRect(duckBridgeBlock,'rgba(255,0,120,0.18)');
  drawDebugText('Duck Bridge Block',duckBridgeBlock.x,duckBridgeBlock.y);
  drawDebugRect(bridgeFeedBox,'rgba(255,220,0,0.25)');
  drawDebugText('Duck Feed Start',bridgeFeedBox.x,bridgeFeedBox.y);
  drawDebugRect(foodTossBox,'rgba(0,180,255,0.25)');
  drawDebugText('Food Toss Water',foodTossBox.x,foodTossBox.y);
  ctx.restore();
};

const originalCherryDraw = draw;
draw = function(){
  camera = getCamera();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#061018';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(map,-camera.x,-camera.y);

  ducks.forEach(drawDuck);
  drawDuckParticles();
  drawDebugZones();

  const arr = [players.her,players.him].sort((a,b) => a.y - b.y);
  arr.forEach(drawSprite);
  drawCoupleHeart();
};
