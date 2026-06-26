// Step 2: animals polish for Cherry Blossom Lake.
// Keeps ducks on the right side and adds koi feeding on the left side.

const koiStartBox = {x:105, y:580, w:59, h:72};
const koiFeedBox = {x:206, y:585, w:197, h:139};

// Keep only the right-side ducks in the duck system.
if(typeof ducks !== 'undefined'){
  const rightDucks = ducks.filter(d => d.side === 'right');
  ducks.splice(0, ducks.length, ...rightDucks);
}

let koiAction = null;
let koiLastE = false;
let koiCooldown = 0;
let koiFood = [];
let koiParticles = [];

const koiFish = [
  {x:245,y:625,homeX:245,homeY:625,vx:.24,vy:.10,phase:0,color:'#ff9a2f',accent:'#fff2d6',target:null},
  {x:320,y:650,homeX:320,homeY:650,vx:-.20,vy:.12,phase:1.8,color:'#f4f0e6',accent:'#ff9a2f',target:null},
  {x:285,y:695,homeX:285,homeY:695,vx:.18,vy:-.13,phase:3.4,color:'#25222a',accent:'#f4f0e6',target:null},
  {x:360,y:610,homeX:360,homeY:610,vx:-.22,vy:.09,phase:5.1,color:'#f4f0e6',accent:'#25222a',target:null},
  {x:230,y:690,homeX:230,homeY:690,vx:.20,vy:-.10,phase:2.6,color:'#ffb14a',accent:'#25222a',target:null}
];

function insideKoiBox(x,y,b){
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

function nearKoiStart(){
  return insideKoiBox(players.her.x,players.her.y,koiStartBox) ||
         insideKoiBox(players.him.x,players.him.y,koiStartBox);
}

function clampKoi(k){
  if(k.x < koiFeedBox.x + 14){ k.x = koiFeedBox.x + 14; k.vx = Math.abs(k.vx); }
  if(k.x > koiFeedBox.x + koiFeedBox.w - 14){ k.x = koiFeedBox.x + koiFeedBox.w - 14; k.vx = -Math.abs(k.vx); }
  if(k.y < koiFeedBox.y + 14){ k.y = koiFeedBox.y + 14; k.vy = Math.abs(k.vy); }
  if(k.y > koiFeedBox.y + koiFeedBox.h - 14){ k.y = koiFeedBox.y + koiFeedBox.h - 14; k.vy = -Math.abs(k.vy); }
}

function startKoiFeeding(){
  koiAction = {timer:0};
  koiCooldown = 30;

  players.her.dir = 'right';
  players.him.dir = 'right';

  const startX = (players.her.x + players.him.x) / 2;
  const startY = Math.min(players.her.y,players.him.y) - 30;
  const endX = koiFeedBox.x + koiFeedBox.w / 2;
  const endY = koiFeedBox.y + koiFeedBox.h / 2;

  for(let i=0;i<16;i++){
    koiFood.push({
      x:startX,
      y:startY,
      sx:startX,
      sy:startY,
      tx:endX + (Math.random()-.5) * 70,
      ty:endY + (Math.random()-.5) * 52,
      life:38 + i * 2,
      maxLife:38 + i * 2,
      delay:i
    });
  }

  koiFish.forEach((k,i) => {
    k.target = {
      x:endX + Math.cos(i * Math.PI * 2 / koiFish.length) * 58,
      y:endY + Math.sin(i * Math.PI * 2 / koiFish.length) * 38
    };
  });
}

function updateKoi(){
  if(koiCooldown > 0) koiCooldown--;

  koiFish.forEach((k,i) => {
    k.phase += .045;

    if(k.target){
      const dx = k.target.x - k.x;
      const dy = k.target.y - k.y;
      const dist = Math.hypot(dx,dy) || 1;
      if(dist > 2){
        k.x += dx / dist * 1.05;
        k.y += dy / dist * 1.05;
      } else if(koiAction){
        const orbit = koiAction.timer / 34 + i * Math.PI * 2 / koiFish.length;
        k.x += Math.cos(orbit) * .65;
        k.y += Math.sin(orbit) * .45;
      }
    } else {
      k.x += k.vx + Math.sin(k.phase) * .18;
      k.y += k.vy + Math.cos(k.phase*.9) * .12;
    }

    clampKoi(k);

    if(heartTimer % 24 === i * 4){
      koiParticles.push({type:'ripple',x:k.x,y:k.y,life:38,size:4});
    }
  });

  koiFood = koiFood.filter(f => {
    if(f.delay > 0){ f.delay--; return true; }
    f.life--;
    const t = 1 - f.life / f.maxLife;
    const smooth = t*t*(3-2*t);
    f.x = f.sx + (f.tx - f.sx) * smooth;
    f.y = f.sy + (f.ty - f.sy) * smooth - Math.sin(smooth*Math.PI) * 24;
    if(f.life === 5) koiParticles.push({type:'splash',x:f.tx,y:f.ty,life:30,size:5});
    return f.life > 0;
  });

  koiParticles = koiParticles.filter(p => {
    p.life--;
    if(p.type === 'heart') p.y -= .45;
    return p.life > 0;
  });

  if(koiAction){
    koiAction.timer++;
    if(koiAction.timer === 95){
      koiParticles.push({type:'heart',x:koiFeedBox.x + koiFeedBox.w/2,y:koiFeedBox.y + 10,life:70,size:4});
    }
    if(koiAction.timer > 300){
      koiAction = null;
      koiFish.forEach(k => k.target = null);
    }
  }
}

function drawKoi(k){
  const angle = k.target ? Math.atan2(k.target.y-k.y,k.target.x-k.x) : Math.atan2(k.vy,k.vx);
  const x = Math.round(k.x - camera.x);
  const y = Math.round(k.y - camera.y + Math.sin(k.phase*2)*1.2);

  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(angle);
  ctx.fillStyle = k.color;
  ctx.fillRect(-8,-3,14,6);
  ctx.fillRect(3,-5,5,10);
  ctx.fillStyle = k.accent;
  ctx.fillRect(-3,-3,4,6);
  ctx.fillRect(7,-4,4,8);
  ctx.fillStyle = '#111';
  ctx.fillRect(5,-2,2,2);
  ctx.restore();
}

function drawKoiEffects(){
  koiParticles.forEach(p => {
    ctx.save();
    if(p.type === 'ripple'){
      ctx.globalAlpha = Math.max(0,p.life/38)*.42;
      ctx.strokeStyle = '#bdefff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(p.x-camera.x,p.y-camera.y,p.size+(38-p.life)*.35,(p.size+(38-p.life)*.35)*.45,0,0,Math.PI*2);
      ctx.stroke();
    }
    if(p.type === 'splash'){
      ctx.globalAlpha = Math.max(0,p.life/30)*.65;
      ctx.strokeStyle = '#8ee8ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x-camera.x,p.y-camera.y,p.size+(30-p.life)*.3,0,Math.PI*2);
      ctx.stroke();
    }
    if(p.type === 'heart'){
      ctx.globalAlpha = Math.max(0,p.life/70);
      ctx.shadowColor = '#ff7ac8';
      ctx.shadowBlur = 8;
      drawPixelHeart(p.x-camera.x,p.y-camera.y,p.size);
    }
    ctx.restore();
  });

  koiFood.forEach(f => {
    if(f.delay > 0) return;
    ctx.save();
    ctx.fillStyle = '#f2b544';
    ctx.fillRect(Math.round(f.x-camera.x),Math.round(f.y-camera.y),3,3);
    ctx.restore();
  });
}

const originalKoiUpdate = update;
update = function(){
  originalKoiUpdate();
  updateKoi();

  const prompt = document.getElementById('prompt');
  const near = nearKoiStart();

  if(near && !koiAction){
    prompt.style.display = 'block';
    prompt.textContent = 'Press E to feed the koi';
  }

  if(keys.e && !koiLastE && near && !koiAction && koiCooldown <= 0){
    startKoiFeeding();
  }

  koiLastE = !!keys.e;
};

const originalKoiDebugZones = drawDebugZones;
drawDebugZones = function(){
  originalKoiDebugZones();
  if(!debugMode) return;
  ctx.save();
  drawDebugRect(koiStartBox,'rgba(255,190,0,0.28)');
  drawDebugText('Feed Koi Start',koiStartBox.x,koiStartBox.y);
  drawDebugRect(koiFeedBox,'rgba(255,120,0,0.18)');
  drawDebugText('Koi Water',koiFeedBox.x,koiFeedBox.y);
  ctx.restore();
};

const originalKoiDraw = draw;
draw = function(){
  camera = getCamera();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#061018';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(map,-camera.x,-camera.y);

  if(typeof ducks !== 'undefined') ducks.forEach(drawDuck);
  koiFish.forEach(drawKoi);
  if(typeof drawDuckParticles === 'function') drawDuckParticles();
  drawKoiEffects();
  if(typeof drawFishEffects === 'function') drawFishEffects();
  if(typeof drawLakePetals === 'function') drawLakePetals();
  if(typeof lakeButterflies !== 'undefined') lakeButterflies.forEach(drawButterfly);
  drawDebugZones();

  const arr = [players.her,players.him].sort((a,b) => a.y - b.y);
  arr.forEach(drawSprite);
  drawCoupleHeart();
};
