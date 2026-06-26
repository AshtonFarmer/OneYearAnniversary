// Cherry Blossom Lake duck feeding interaction.
// Ducks wander around the lake, then swim to the food when you press E on the bridge.

const bridgeFeedBox = {x:671, y:580, w:115, h:126};
const foodTossBox = {x:811, y:596, w:94, h:115};

let duckFeedAction = null;
let duckParticles = [];
let duckFood = [];
let duckActionCooldown = 0;

const ducks = [
  {x:300,y:315,homeX:300,homeY:315,vx:.35,vy:.12,phase:0,target:null},
  {x:1110,y:340,homeX:1110,homeY:340,vx:-.28,vy:.10,phase:1.7,target:null},
  {x:330,y:585,homeX:330,homeY:585,vx:.26,vy:-.12,phase:3.1,target:null},
  {x:1080,y:620,homeX:1080,homeY:620,vx:-.22,vy:.16,phase:4.4,target:null}
];

function pointInBox(x,y,b){
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
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

  for(let i=0;i<14;i++){
    duckFood.push({
      x:startX,
      y:startY,
      tx:endX + (Math.random()-.5) * 42,
      ty:endY + (Math.random()-.5) * 42,
      life:36 + i * 2,
      maxLife:36 + i * 2,
      delay:i * 2
    });
  }

  ducks.forEach((d,i) => {
    d.target = {
      x:endX + Math.cos(i * Math.PI * .5) * 45,
      y:endY + Math.sin(i * Math.PI * .5) * 38
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
        d.x += dx / dist * 1.15;
        d.y += dy / dist * 1.15;
      }
    } else {
      d.x += d.vx + Math.sin(d.phase) * .12;
      d.y += d.vy + Math.cos(d.phase * .8) * .08;

      if(Math.abs(d.x - d.homeX) > 90) d.vx *= -1;
      if(Math.abs(d.y - d.homeY) > 55) d.vy *= -1;
    }

    if(heartTimer % 16 === i * 3){
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
    f.x = f.x + (f.tx - f.x) * .09;
    f.y = f.y + (f.ty - f.y) * .09 + Math.sin(smooth * Math.PI) * -.45;
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

  if(duckFeedAction.timer === 95){
    duckParticles.push({type:'heart',x:foodTossBox.x + foodTossBox.w / 2,y:foodTossBox.y - 12,life:75,size:4});
  }

  if(duckFeedAction.timer > 260){
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

  if(keys.e && !lastE && feedNear && !duckFeedAction && duckActionCooldown <= 0){
    startDuckFeeding();
  }
};

function drawDuck(d){
  const x = Math.round(d.x - camera.x);
  const y = Math.round(d.y - camera.y + Math.sin(d.phase * 2) * 1.5);
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
