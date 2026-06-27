// Windmill of Wishes - Step 1
// Cozy interior only: wooden room, gears, sunlight, dust, window, and exit.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  ctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize);
resize();

const herImg = new Image();
herImg.src = 'assets/sprites/her_atlas.png';
const himImg = new Image();
himImg.src = 'assets/sprites/him_atlas.png';

const keys = {};
let debugMode = false;
let boxSelectMode = false;
let boxStart = null;
let boxCurrent = null;
let camera = {x:0,y:0};
let heartTimer = 0;
let lastE = false;

const WORLD_W = 1280;
const WORLD_H = 820;

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
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) e.preventDefault();
});

addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener('mousedown', e => {
  if(!boxSelectMode) return;
  const rect = canvas.getBoundingClientRect();
  boxStart = {x:Math.round(e.clientX-rect.left+camera.x), y:Math.round(e.clientY-rect.top+camera.y)};
  boxCurrent = {...boxStart};
});
canvas.addEventListener('mousemove', e => {
  if(!boxSelectMode || !boxStart) return;
  const rect = canvas.getBoundingClientRect();
  boxCurrent = {x:Math.round(e.clientX-rect.left+camera.x), y:Math.round(e.clientY-rect.top+camera.y)};
});
canvas.addEventListener('mouseup', () => {
  if(!boxSelectMode || !boxStart || !boxCurrent) return;
  const x = Math.min(boxStart.x,boxCurrent.x);
  const y = Math.min(boxStart.y,boxCurrent.y);
  const w = Math.abs(boxCurrent.x-boxStart.x);
  const h = Math.abs(boxCurrent.y-boxStart.y);
  console.log('COPY THIS:', `{x:${x}, y:${y}, w:${w}, h:${h}}`);
  boxStart = null;
  boxCurrent = null;
});

const players = {
  her:{img:herImg, cols:4, x:585, y:700, dir:'up', frame:0, speed:3.0, name:'Her', scale:.58, rows:{down:0, up:2, left:3, right:1}, frames:{down:[0,1,2,3], up:[0,1,2,3], left:[0,1,2,3], right:[0,1,2,3]}},
  him:{img:himImg, cols:3, x:655, y:700, dir:'up', frame:0, speed:3.0, name:'Me', scale:.58, rows:{down:0, up:2, left:3, right:1}, frames:{down:[0,1,2], up:[0,1,2], left:[0,1,2], right:[0,1,2]}}
};

const exitZone = {x:560,y:730,w:165,h:70};

const solid = [
  {x:-60,y:-60,w:60,h:WORLD_H+120},
  {x:WORLD_W,y:-60,w:60,h:WORLD_H+120},
  {x:-60,y:-60,w:WORLD_W+120,h:60},
  {x:-60,y:WORLD_H,w:WORLD_W+120,h:60},
  {x:0,y:0,w:WORLD_W,h:72},
  {x:0,y:0,w:78,h:WORLD_H},
  {x:WORLD_W-78,y:0,w:78,h:WORLD_H},
  {x:0,y:WORLD_H-64,w:520,h:64},
  {x:760,y:WORLD_H-64,w:520,h:64},
  {x:146,y:120,w:178,h:148},
  {x:956,y:120,w:178,h:148}
];

const dust = [];
for(let i=0;i<70;i++){
  dust.push({x:120+Math.random()*1040,y:95+Math.random()*610,vx:(Math.random()-.5)*.18,vy:-.08-Math.random()*.12,life:80+Math.random()*160,size:1+Math.random()*2});
}

const clouds = [
  {x:505,y:101,w:34,s:.18},
  {x:603,y:126,w:46,s:.11},
  {x:693,y:94,w:40,s:.15}
];

function rectHit(x,y){
  return solid.some(s => x > s.x && x < s.x+s.w && y > s.y && y < s.y+s.h);
}

function movePlayer(p,input){
  let dx = 0, dy = 0;
  if(input.up) dy -= 1;
  if(input.down) dy += 1;
  if(input.left) dx -= 1;
  if(input.right) dx += 1;
  if(dx || dy){
    const len = Math.hypot(dx,dy); dx/=len; dy/=len;
    if(Math.abs(dx)>Math.abs(dy)) p.dir = dx>0?'right':'left';
    else p.dir = dy>0?'down':'up';
    const nx = p.x + dx*p.speed;
    const ny = p.y + dy*p.speed;
    if(!rectHit(nx,p.y)) p.x = nx;
    if(!rectHit(p.x,ny)) p.y = ny;
    p.frameTimer = (p.frameTimer || 0) + 1;
    if(p.frameTimer > 9){
      const seq = p.frames[p.dir];
      const i = seq.indexOf(p.frame);
      p.frame = seq[(i+1+seq.length)%seq.length];
      p.frameTimer = 0;
    }
  } else {
    p.frame = 0;
    p.frameTimer = 0;
  }
}

function getCamera(){
  const cx = (players.her.x + players.him.x)/2;
  const cy = (players.her.y + players.him.y)/2;
  return {
    x:Math.max(0,Math.min(Math.max(0,WORLD_W-canvas.width),cx-canvas.width/2)),
    y:Math.max(0,Math.min(Math.max(0,WORLD_H-canvas.height),cy-canvas.height/2))
  };
}

function nearExit(){
  return [players.her,players.him].some(p => p.x >= exitZone.x && p.x <= exitZone.x+exitZone.w && p.y >= exitZone.y && p.y <= exitZone.y+exitZone.h);
}

function update(){
  movePlayer(players.her,{up:keys.arrowup,down:keys.arrowdown,left:keys.arrowleft,right:keys.arrowright});
  movePlayer(players.him,{up:keys.w,down:keys.s,left:keys.a,right:keys.d});
  heartTimer++;

  dust.forEach(d => {
    d.x += d.vx + Math.sin((heartTimer+d.y)/90)*.06;
    d.y += d.vy;
    d.life--;
    if(d.life <= 0 || d.y < 70){
      d.x = 120 + Math.random()*1040;
      d.y = 690 + Math.random()*40;
      d.life = 100 + Math.random()*180;
    }
  });

  clouds.forEach(c => {
    c.x += c.s;
    if(c.x > 765) c.x = 490;
  });

  const prompt = document.getElementById('prompt');
  if(nearExit()){
    prompt.style.display = 'block';
    prompt.textContent = 'Press E to leave the windmill';
  } else {
    prompt.style.display = 'none';
  }

  if(keys.e && !lastE && nearExit()) location.href = 'index.html';
  lastE = !!keys.e;
}

function drawWoodPlankFloor(){
  ctx.fillStyle = '#6b3f22';
  ctx.fillRect(0,0,WORLD_W,WORLD_H);

  for(let y=70;y<WORLD_H;y+=42){
    ctx.fillStyle = y%84===0 ? '#7a4828' : '#5c331c';
    ctx.fillRect(78,y,WORLD_W-156,3);
  }
  for(let x=88;x<WORLD_W-78;x+=120){
    ctx.fillStyle = 'rgba(34,18,10,.35)';
    for(let y=80;y<WORLD_H-70;y+=84){
      ctx.fillRect(x+(y%168===0?0:48),y,3,39);
    }
  }

  ctx.fillStyle = 'rgba(255,210,130,.05)';
  for(let y=86;y<WORLD_H-90;y+=84){
    ctx.fillRect(86,y,WORLD_W-172,7);
  }
}

function drawWallsAndBeams(){
  ctx.fillStyle = '#3b2215';
  ctx.fillRect(0,0,WORLD_W,80);
  ctx.fillRect(0,0,88,WORLD_H);
  ctx.fillRect(WORLD_W-88,0,88,WORLD_H);
  ctx.fillRect(0,WORLD_H-74,540,74);
  ctx.fillRect(740,WORLD_H-74,540,74);

  ctx.fillStyle = '#8a542f';
  ctx.fillRect(96,84,WORLD_W-192,13);
  ctx.fillRect(96,WORLD_H-100,WORLD_W-192,13);
  ctx.fillRect(102,94,13,WORLD_H-195);
  ctx.fillRect(WORLD_W-115,94,13,WORLD_H-195);

  ctx.fillStyle = '#4a2a18';
  ctx.fillRect(150,0,18,WORLD_H-74);
  ctx.fillRect(WORLD_W-168,0,18,WORLD_H-74);
  ctx.fillRect(0,190,WORLD_W,17);
  ctx.fillRect(0,525,WORLD_W,17);

  ctx.fillStyle = '#9b6135';
  ctx.fillRect(552,WORLD_H-76,176,18);
  ctx.fillStyle = '#2b1a12';
  ctx.fillRect(576,WORLD_H-65,128,65);
  ctx.fillStyle = '#7b4a2a';
  ctx.fillRect(590,WORLD_H-57,100,57);
}

function drawWindow(){
  const x = 485, y = 82, w = 310, h = 148;
  ctx.save();
  ctx.fillStyle = '#1a304f';
  ctx.fillRect(x,y,w,h);

  const grad = ctx.createLinearGradient(0,y,0,y+h);
  grad.addColorStop(0,'#5db8ff');
  grad.addColorStop(1,'#ffd28b');
  ctx.fillStyle = grad;
  ctx.fillRect(x+10,y+10,w-20,h-20);

  clouds.forEach(c => {
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    ctx.fillRect(c.x,y+38,c.w,12);
    ctx.fillRect(c.x+10,y+28,c.w*.45,12);
    ctx.fillRect(c.x+24,y+33,c.w*.55,10);
  });

  // slow windmill blade shadow passing the window
  ctx.save();
  ctx.translate(x+w/2,y+h/2);
  ctx.rotate(heartTimer/95);
  ctx.fillStyle = 'rgba(82,54,33,.22)';
  ctx.fillRect(-8,-80,16,160);
  ctx.fillRect(-80,-8,160,16);
  ctx.restore();

  ctx.fillStyle = '#5a321d';
  ctx.fillRect(x,y,w,10);
  ctx.fillRect(x,y+h-10,w,10);
  ctx.fillRect(x,y,10,h);
  ctx.fillRect(x+w-10,y,10,h);
  ctx.fillRect(x+w/2-5,y,10,h);
  ctx.fillRect(x,y+h/2-5,w,10);
  ctx.restore();
}

function drawSunbeams(){
  ctx.save();
  ctx.globalAlpha = .28;
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.moveTo(520,210);
  ctx.lineTo(610,210);
  ctx.lineTo(430,740);
  ctx.lineTo(310,740);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = .18;
  ctx.beginPath();
  ctx.moveTo(685,210);
  ctx.lineTo(765,210);
  ctx.lineTo(950,740);
  ctx.lineTo(830,740);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGear(cx,cy,r,teeth,rot){
  ctx.save();
  ctx.translate(cx-camera.x,cy-camera.y);
  ctx.rotate(rot);

  ctx.fillStyle = '#3f2818';
  for(let i=0;i<teeth;i++){
    ctx.save();
    ctx.rotate(i*Math.PI*2/teeth);
    ctx.fillRect(r-5,-6,18,12);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0,0,r,0,Math.PI*2);
  ctx.fillStyle = '#8a542f';
  ctx.fill();
  ctx.strokeStyle = '#2b1a12';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = '#5a321d';
  for(let i=0;i<6;i++){
    ctx.save();
    ctx.rotate(i*Math.PI/3);
    ctx.fillRect(0,-5,r-10,10);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0,0,14,0,Math.PI*2);
  ctx.fillStyle = '#2b1a12';
  ctx.fill();
  ctx.restore();
}

function drawGears(){
  drawGear(240,248,54,16,heartTimer/95);
  drawGear(1038,248,54,16,-heartTimer/95);
  drawGear(295,560,44,14,-heartTimer/80);
  drawGear(984,560,44,14,heartTimer/80);
}

function drawDust(){
  ctx.save();
  dust.forEach(d => {
    ctx.globalAlpha = Math.max(0,Math.min(.42,d.life/110));
    ctx.fillStyle = '#ffe2a3';
    ctx.fillRect(Math.round(d.x-camera.x),Math.round(d.y-camera.y),d.size,d.size);
  });
  ctx.restore();
}

function drawSprite(p){
  const sw = 96, sh = 128, row = p.rows[p.dir];
  const dw = Math.round(sw*p.scale), dh = Math.round(sh*p.scale);
  let drawX = Math.round(p.x-camera.x-dw/2);
  let drawY = Math.round(p.y-camera.y-dh+10);
  let drawW = dw;
  if(p === players.him && p.dir === 'right'){
    drawX -= 4;
    drawW += 8;
  }
  ctx.drawImage(p.img,p.frame*sw,row*sh,sw,sh,drawX,drawY,drawW,dh);
}

function drawPixelHeart(x,y,size){
  const blocks = [[1,0],[2,0],[4,0],[5,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[1,3],[2,3],[3,3],[4,3],[5,3],[2,4],[3,4],[4,4],[3,5]];
  ctx.save();
  ctx.translate(Math.round(x-3.5*size),Math.round(y-3*size));
  ctx.fillStyle = '#ff6bb5';
  blocks.forEach(([bx,by]) => ctx.fillRect(bx*size,by*size,size,size));
  ctx.fillStyle = '#ffd1e8';
  ctx.fillRect(size,size,size,size);
  ctx.restore();
}

function drawCoupleHeart(){
  const distance = Math.hypot(players.her.x-players.him.x,players.her.y-players.him.y);
  if(distance > 48) return;
  const midX = (players.her.x+players.him.x)/2-camera.x;
  const midY = Math.min(players.her.y,players.him.y)-camera.y-55;
  const float = Math.sin(heartTimer/12)*5;
  const pulse = Math.sin(heartTimer/10)>0 ? 4 : 3;
  ctx.save();
  ctx.shadowColor = '#ff7ac8';
  ctx.shadowBlur = 10;
  drawPixelHeart(midX,midY+float,pulse);
  ctx.restore();
}

function drawDebugRect(rect,color){
  ctx.fillStyle = color;
  ctx.fillRect(rect.x-camera.x,rect.y-camera.y,rect.w,rect.h);
}
function drawDebugText(text,x,y){
  ctx.font = '14px monospace';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000';
  ctx.fillStyle = '#fff';
  ctx.strokeText(text,x-camera.x+8,y-camera.y-8);
  ctx.fillText(text,x-camera.x+8,y-camera.y-8);
}
function drawDebugZones(){
  if(!debugMode) return;
  ctx.save();
  solid.forEach(r => drawDebugRect(r,'rgba(255,0,0,.32)'));
  drawDebugRect(exitZone,'rgba(0,255,90,.25)');
  drawDebugText('Exit',exitZone.x,exitZone.y);
  drawDebugText(`Her: ${Math.round(players.her.x)}, ${Math.round(players.her.y)}  Me: ${Math.round(players.him.x)}, ${Math.round(players.him.y)}`,28,112);
  ctx.restore();
}

function drawBoxSelector(){
  if(!boxSelectMode || !boxStart || !boxCurrent) return;
  const x = Math.min(boxStart.x,boxCurrent.x)-camera.x;
  const y = Math.min(boxStart.y,boxCurrent.y)-camera.y;
  const w = Math.abs(boxCurrent.x-boxStart.x);
  const h = Math.abs(boxCurrent.y-boxStart.y);
  ctx.save();
  ctx.fillStyle = 'rgba(0,180,255,.25)';
  ctx.strokeStyle = '#00b4ff';
  ctx.lineWidth = 3;
  ctx.fillRect(x,y,w,h);
  ctx.strokeRect(x,y,w,h);
  ctx.restore();
}

function draw(){
  camera = getCamera();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#061018';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.save();
  ctx.translate(-camera.x,-camera.y);
  drawWoodPlankFloor();
  drawWallsAndBeams();
  drawWindow();
  drawSunbeams();
  ctx.restore();

  drawGears();
  drawDust();

  drawDebugZones();
  drawBoxSelector();

  const arr = [players.her,players.him].sort((a,b)=>a.y-b.y);
  arr.forEach(drawSprite);
  drawCoupleHeart();

  ctx.save();
  const g = ctx.createRadialGradient(canvas.width/2,canvas.height/2,140,canvas.width/2,canvas.height/2,Math.max(canvas.width,canvas.height)*.72);
  g.addColorStop(0,'rgba(0,0,0,0)');
  g.addColorStop(1,'rgba(5,2,10,.22)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.restore();
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

Promise.all([herImg.decode(),himImg.decode()]).then(() => loop());
