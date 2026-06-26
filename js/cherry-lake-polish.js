// Step 4: polish pass for Cherry Blossom Lake.
// Adds soft lake sparkles, animal wakes, cozy vignette, and tiny idle details.

let lakeSparkles = [];
let glowMotes = [];
let polishTimer = 0;

function randomPolishWaterPoint(){
  const zones = typeof ambientWaterZones !== 'undefined' ? ambientWaterZones : [
    {x:0, y:396, w:659, h:491},
    {x:793, y:438, w:653, h:249},
    {x:799, y:686, w:422, h:188}
  ];
  const z = zones[Math.floor(Math.random()*zones.length)];
  return {
    x:z.x + 18 + Math.random()*Math.max(20,z.w-36),
    y:z.y + 18 + Math.random()*Math.max(20,z.h-36)
  };
}

function updateLakePolish(){
  polishTimer++;

  if(Math.random() < .06){
    const p = randomPolishWaterPoint();
    lakeSparkles.push({x:p.x,y:p.y,life:42 + Math.random()*32,maxLife:74,size:1 + Math.random()*2});
  }

  if(Math.random() < .025){
    glowMotes.push({
      x:Math.random()*1448,
      y:80 + Math.random()*850,
      vx:(Math.random()-.5)*.25,
      vy:-.12-Math.random()*.18,
      life:120 + Math.random()*90,
      size:1 + Math.random()*2
    });
  }

  lakeSparkles = lakeSparkles.filter(s => {
    s.life--;
    s.y += Math.sin((polishTimer + s.x) / 30) * .04;
    return s.life > 0;
  });

  glowMotes = glowMotes.filter(m => {
    m.life--;
    m.x += m.vx + Math.sin((polishTimer + m.y) / 45) * .07;
    m.y += m.vy;
    return m.life > 0;
  });
}

function drawLakeSparkles(){
  lakeSparkles.forEach(s => {
    const alpha = Math.sin((1 - s.life / s.maxLife) * Math.PI) * .75;
    ctx.save();
    ctx.globalAlpha = Math.max(0,alpha);
    ctx.fillStyle = '#ffffff';
    const x = Math.round(s.x-camera.x);
    const y = Math.round(s.y-camera.y);
    ctx.fillRect(x,y,s.size+2,1);
    ctx.fillRect(x+1,y-1,1,s.size+2);
    ctx.restore();
  });
}

function drawGlowMotes(){
  glowMotes.forEach(m => {
    ctx.save();
    ctx.globalAlpha = Math.max(0,m.life/160)*.32;
    ctx.fillStyle = '#ffd7ef';
    ctx.fillRect(Math.round(m.x-camera.x),Math.round(m.y-camera.y),m.size,m.size);
    ctx.restore();
  });
}

function drawAnimalWake(x,y,phase){
  ctx.save();
  ctx.globalAlpha = .16 + Math.sin(phase)*.05;
  ctx.strokeStyle = '#d8f7ff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x-camera.x,y-camera.y+8,12,4,0,0,Math.PI*2);
  ctx.stroke();
  ctx.restore();
}

const originalPolishDrawDuck = typeof drawDuck === 'function' ? drawDuck : null;
if(originalPolishDrawDuck){
  drawDuck = function(d){
    drawAnimalWake(d.x,d.y,d.phase);
    originalPolishDrawDuck(d);
  };
}

const originalPolishDrawKoi = typeof drawKoi === 'function' ? drawKoi : null;
if(originalPolishDrawKoi){
  drawKoi = function(k){
    drawAnimalWake(k.x,k.y,k.phase*.7);
    originalPolishDrawKoi(k);
  };
}

const originalPolishDrawSprite = drawSprite;
drawSprite = function(p){
  if(typeof dateActivity !== 'undefined' && dateActivity && dateActivity.type === 'picnic' && dateActivity.phase === 'active'){
    const lean = p === players.her ? Math.sin(polishTimer/55)*1.4 : Math.sin(polishTimer/65 + 1)*.8;
    const oldX = p.x;
    p.x += lean;
    originalPolishDrawSprite(p);
    p.x = oldX;
    return;
  }
  originalPolishDrawSprite(p);
};

function drawSoftVignette(){
  ctx.save();
  const g = ctx.createRadialGradient(canvas.width/2,canvas.height/2,Math.min(canvas.width,canvas.height)*.25,canvas.width/2,canvas.height/2,Math.max(canvas.width,canvas.height)*.72);
  g.addColorStop(0,'rgba(0,0,0,0)');
  g.addColorStop(1,'rgba(12,4,18,0.22)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.restore();
}

const originalPolishUpdate = update;
update = function(){
  originalPolishUpdate();
  updateLakePolish();
};

const originalPolishDraw = draw;
draw = function(){
  camera = getCamera();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#061018';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(map,-camera.x,-camera.y);

  if(typeof drawPicnic === 'function') drawPicnic();
  drawLakeSparkles();
  if(typeof ducks !== 'undefined') ducks.forEach(drawDuck);
  if(typeof koiFish !== 'undefined') koiFish.forEach(drawKoi);
  if(typeof drawDuckParticles === 'function') drawDuckParticles();
  if(typeof drawKoiEffects === 'function') drawKoiEffects();
  if(typeof drawFishEffects === 'function') drawFishEffects();
  if(typeof drawDateParticles === 'function') drawDateParticles();
  if(typeof drawLakePetals === 'function') drawLakePetals();
  drawGlowMotes();
  if(typeof lakeButterflies !== 'undefined') lakeButterflies.forEach(drawButterfly);
  if(typeof drawTreeInitials === 'function') drawTreeInitials();
  drawDebugZones();

  const arr = [players.her,players.him].sort((a,b)=>a.y-b.y);
  arr.forEach(drawSprite);
  drawCoupleHeart();
  if(typeof drawSkipMessage === 'function') drawSkipMessage();
  drawSoftVignette();
};
