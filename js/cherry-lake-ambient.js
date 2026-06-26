// Step 1: ambient life for Cherry Blossom Lake.
// Adds drifting petals, butterflies that scatter, and occasional fish jumps.

const ambientWaterZones = [
  {x:0, y:396, w:659, h:491},
  {x:137, y:474, w:512, h:305},
  {x:441, y:357, w:218, h:178},
  {x:305, y:698, w:343, h:197},
  {x:793, y:438, w:653, h:249},
  {x:799, y:686, w:422, h:188}
];

let lakePetals = [];
let lakePetalGustTimer = 0;
let lakeButterflies = [
  {x:160,y:300,homeX:160,homeY:300,phase:0,color:'#b787ff',scared:0},
  {x:1220,y:330,homeX:1220,homeY:330,phase:2.1,color:'#ff9a3d',scared:0},
  {x:220,y:760,homeX:220,homeY:760,phase:4.2,color:'#7fb8ff',scared:0},
  {x:1110,y:820,homeX:1110,homeY:820,phase:5.7,color:'#ff7ac8',scared:0}
];
let lakeFish = [];
let nextFishJump = 90;

function randomWaterPoint(){
  const z = ambientWaterZones[Math.floor(Math.random() * ambientWaterZones.length)];
  return {
    x:z.x + 25 + Math.random() * Math.max(20,z.w - 50),
    y:z.y + 25 + Math.random() * Math.max(20,z.h - 50)
  };
}

function spawnLakePetal(gust=false){
  const fromLeftTree = Math.random() < .5;
  lakePetals.push({
    x:fromLeftTree ? -20 - Math.random()*120 : 1448 + Math.random()*120,
    y:40 + Math.random()*860,
    vx:(fromLeftTree ? 1 : -1) * (.25 + Math.random()*.75) + (gust ? (fromLeftTree ? 1.2 : -1.2) : 0),
    vy:.25 + Math.random()*.55,
    spin:Math.random()*Math.PI*2,
    life:260 + Math.random()*160,
    size:2 + Math.random()*3,
    waterRipple:false
  });
}

function updateLakePetals(){
  if(Math.random() < .28) spawnLakePetal(false);

  lakePetalGustTimer--;
  if(lakePetalGustTimer <= 0 && Math.random() < .008){
    lakePetalGustTimer = 210;
    for(let i=0;i<24;i++) spawnLakePetal(true);
  }

  lakePetals = lakePetals.filter(p => {
    p.life--;
    p.spin += .08;
    p.x += p.vx + Math.sin((heartTimer + p.y) / 30) * .18;
    p.y += p.vy + Math.cos((heartTimer + p.x) / 45) * .08;

    const overWater = ambientWaterZones.some(z => pointInBox(p.x,p.y,z));
    if(overWater && !p.waterRipple && Math.random() < .006){
      p.waterRipple = true;
      lakeFish.push({type:'petalRipple',x:p.x,y:p.y,life:34,size:3});
    }

    return p.life > 0 && p.y < 1120 && p.x > -220 && p.x < 1668;
  });
}

function updateButterflies(){
  lakeButterflies.forEach(b => {
    b.phase += .045;

    const d1 = Math.hypot(players.her.x - b.x, players.her.y - b.y);
    const d2 = Math.hypot(players.him.x - b.x, players.him.y - b.y);
    const near = Math.min(d1,d2);

    if(near < 95) b.scared = 120;

    if(b.scared > 0){
      b.scared--;
      const awayX = b.x - ((players.her.x + players.him.x) / 2);
      const awayY = b.y - ((players.her.y + players.him.y) / 2);
      const len = Math.hypot(awayX,awayY) || 1;
      b.x += awayX / len * 2.1 + Math.sin(b.phase*3) * .9;
      b.y += awayY / len * 2.1 + Math.cos(b.phase*4) * .8;
    } else {
      b.x += (b.homeX + Math.sin(b.phase) * 45 - b.x) * .015;
      b.y += (b.homeY + Math.cos(b.phase*.8) * 28 - b.y) * .015;
    }
  });
}

function updateFishJumps(){
  nextFishJump--;
  if(nextFishJump <= 0){
    const p = randomWaterPoint();
    lakeFish.push({type:'fishJump',x:p.x,y:p.y,life:62,maxLife:62,size:1});
    nextFishJump = 130 + Math.floor(Math.random()*220);
  }

  lakeFish = lakeFish.filter(f => {
    f.life--;
    return f.life > 0;
  });
}

function updateAmbientLake(){
  updateLakePetals();
  updateButterflies();
  updateFishJumps();
}

function drawLakePetals(){
  lakePetals.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0,Math.min(1,p.life/120)) * .9;
    ctx.translate(Math.round(p.x-camera.x),Math.round(p.y-camera.y));
    ctx.rotate(p.spin);
    ctx.fillStyle = '#ff8fcf';
    ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
    ctx.fillStyle = '#ffd1e8';
    ctx.fillRect(0,-p.size/2,Math.max(1,p.size/2),Math.max(1,p.size/2));
    ctx.restore();
  });
}

function drawButterfly(b){
  const flap = Math.sin(heartTimer / 4 + b.phase * 6);
  const x = Math.round(b.x-camera.x);
  const y = Math.round(b.y-camera.y + Math.sin(b.phase*2)*4);

  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle = b.color;
  ctx.fillRect(-5,-3,4,5 + flap*1.5);
  ctx.fillRect(2,-3,4,5 - flap*1.5);
  ctx.fillRect(-4,3,3,4);
  ctx.fillRect(2,3,3,4);
  ctx.fillStyle = '#241820';
  ctx.fillRect(0,-2,1,8);
  ctx.restore();
}

function drawFishEffects(){
  lakeFish.forEach(f => {
    ctx.save();

    if(f.type === 'petalRipple'){
      ctx.globalAlpha = Math.max(0,f.life/34) * .45;
      ctx.strokeStyle = '#bdefff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(f.x-camera.x,f.y-camera.y,f.size + (34-f.life)*.4,(f.size + (34-f.life)*.4)*.45,0,0,Math.PI*2);
      ctx.stroke();
    }

    if(f.type === 'fishJump'){
      const t = 1 - f.life / f.maxLife;
      const jump = Math.sin(t * Math.PI) * 28;
      const fishX = f.x - camera.x + t * 22;
      const fishY = f.y - camera.y - jump;

      if(f.life > 14){
        ctx.fillStyle = '#d7f0ff';
        ctx.fillRect(Math.round(fishX),Math.round(fishY),10,4);
        ctx.fillRect(Math.round(fishX-3),Math.round(fishY+1),3,2);
        ctx.fillStyle = '#7bbfe8';
        ctx.fillRect(Math.round(fishX+7),Math.round(fishY-1),3,2);
      }

      ctx.globalAlpha = t < .25 ? t*2 : Math.max(0,(1-t)*1.6);
      ctx.strokeStyle = '#bdefff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(f.x-camera.x,f.y-camera.y,8 + t*25,4 + t*10,0,0,Math.PI*2);
      ctx.stroke();
    }

    ctx.restore();
  });
}

const originalAmbientUpdate = update;
update = function(){
  originalAmbientUpdate();
  updateAmbientLake();
};

const originalAmbientDraw = draw;
draw = function(){
  camera = getCamera();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#061018';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(map,-camera.x,-camera.y);

  if(typeof ducks !== 'undefined') ducks.forEach(drawDuck);
  if(typeof drawDuckParticles === 'function') drawDuckParticles();
  drawFishEffects();
  drawLakePetals();
  lakeButterflies.forEach(drawButterfly);
  drawDebugZones();

  const arr = [players.her,players.him].sort((a,b) => a.y - b.y);
  arr.forEach(drawSprite);
  drawCoupleHeart();
};
