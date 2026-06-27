// The Silo Below
// A fake farm silo that drops into one long, continuous underground walk to the right.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  ctx.imageSmoothingEnabled = false;
}
addEventListener('resize',resize);
resize();

const herImg = new Image();
herImg.src = 'assets/sprites/her_atlas.png';
const himImg = new Image();
himImg.src = 'assets/sprites/him_atlas.png';

const keys = {};
let debugMode = false;
let camera = {x:0,y:0};
let heartTimer = 0;
let lastE = false;
let mode = 'silo';
let fade = 0;
let descending = false;
let descentTimer = 0;
let sitScene = null;
let sitMessage = '';
let sitMessageAlpha = 0;
let shootingStarTimer = 0;

const SILO_W = 960;
const SILO_H = 720;
const CAVE_W = 9300;
const CAVE_H = 760;
const FLOOR_Y = 635;

const players = {
  her:{img:herImg, cols:4, x:415, y:615, dir:'up', frame:0, speed:3.1, name:'Her', scale:.58, rows:{down:0, up:2, left:3, right:1}, frames:{down:[0,1,2,3], up:[0,1,2,3], left:[0,1,2,3], right:[0,1,2,3]}},
  him:{img:himImg, cols:3, x:495, y:615, dir:'up', frame:0, speed:3.1, name:'Me', scale:.58, rows:{down:0, up:2, left:3, right:1}, frames:{down:[0,1,2], up:[0,1,2], left:[0,1,2], right:[0,1,2]}}
};

const hatchZone = {x:410,y:488,w:150,h:92};
const exitZone = {x:80,y:580,w:95,h:92};
const lakeSitZone = {x:8780,y:560,w:210,h:80};

addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if(key === 'g'){
    debugMode = !debugMode;
    e.preventDefault();
    return;
  }
  keys[key] = true;
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) e.preventDefault();
});
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function activeWorldW(){ return mode === 'silo' ? SILO_W : CAVE_W; }
function activeWorldH(){ return mode === 'silo' ? SILO_H : CAVE_H; }

function solidHit(x,y){
  if(mode === 'silo'){
    if(x < 80 || x > SILO_W-80 || y < 90 || y > SILO_H-70) return true;
    return false;
  }

  if(x < 65 || x > CAVE_W-85 || y < 210 || y > FLOOR_Y+20) return true;

  // Water at the final lake. You can walk to the overlook but not into the lake.
  if(x > 8880 && y > 605) return true;
  return false;
}

function movePlayer(p,input){
  if(descending || sitScene) return;

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
    if(!solidHit(nx,p.y)) p.x = nx;
    if(!solidHit(p.x,ny)) p.y = ny;

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
  let cx = (players.her.x + players.him.x)/2;
  let cy = (players.her.y + players.him.y)/2;

  if(sitScene) cx = 8845;

  return {
    x:Math.max(0,Math.min(Math.max(0,activeWorldW()-canvas.width),cx-canvas.width/2)),
    y:Math.max(0,Math.min(Math.max(0,activeWorldH()-canvas.height),cy-canvas.height/2))
  };
}

function inZone(zone){
  return [players.her,players.him].some(p => p.x >= zone.x && p.x <= zone.x+zone.w && p.y >= zone.y && p.y <= zone.y+zone.h);
}

function startDescent(){
  descending = true;
  descentTimer = 0;
  fade = 0;
}

function enterCave(){
  mode = 'cave';
  descending = false;
  fade = 1;
  players.her.x = 170; players.her.y = FLOOR_Y;
  players.him.x = 225; players.him.y = FLOOR_Y;
  players.her.dir = 'right';
  players.him.dir = 'right';
}

function startLakeSit(){
  sitScene = {phase:'walk',timer:0,star:0};
  sitMessage = '';
  sitMessageAlpha = 0;
}

function moveTo(p,target,speed=1.25){
  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const dist = Math.hypot(dx,dy) || 1;
  if(dist < 2){
    p.x = target.x;
    p.y = target.y;
    p.dir = target.dir || p.dir;
    p.frame = 0;
    return true;
  }
  p.x += dx/dist * Math.min(speed,dist);
  p.y += dy/dist * Math.min(speed,dist);
  p.dir = Math.abs(dx) > Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up');
  p.frameTimer = (p.frameTimer || 0)+1;
  if(p.frameTimer > 12){
    const seq = p.frames[p.dir];
    const i = seq.indexOf(p.frame);
    p.frame = seq[(i+1+seq.length)%seq.length];
    p.frameTimer = 0;
  }
  return false;
}

function updateSitScene(){
  if(!sitScene) return;
  sitScene.timer++;
  const herSpot = {x:8818,y:594,dir:'down'};
  const himSpot = {x:8862,y:594,dir:'down'};

  if(sitScene.phase === 'walk'){
    const a = moveTo(players.her,herSpot);
    const b = moveTo(players.him,himSpot);
    if(a && b){
      sitScene.phase = 'line1';
      sitScene.timer = 0;
    }
  }
  else if(sitScene.phase === 'line1'){
    sitMessage = 'It was a long journey...';
    sitMessageAlpha = Math.min(1,sitScene.timer/45) * Math.min(1,(180-sitScene.timer)/45);
    if(sitScene.timer > 180){ sitScene.phase='line2'; sitScene.timer=0; }
  }
  else if(sitScene.phase === 'line2'){
    sitMessage = 'Every step led us somewhere beautiful.';
    sitMessageAlpha = Math.min(1,sitScene.timer/45) * Math.min(1,(210-sitScene.timer)/45);
    if(sitScene.timer > 210){ sitScene.phase='line3'; sitScene.timer=0; }
  }
  else if(sitScene.phase === 'line3'){
    sitMessage = 'Not because of where we ended...';
    sitMessageAlpha = Math.min(1,sitScene.timer/45) * Math.min(1,(190-sitScene.timer)/45);
    if(sitScene.timer > 190){ sitScene.phase='line4'; sitScene.timer=0; }
  }
  else if(sitScene.phase === 'line4'){
    sitMessage = 'But because we walked it together.';
    sitMessageAlpha = Math.min(1,sitScene.timer/45) * Math.min(1,(210-sitScene.timer)/45);
    if(sitScene.timer > 210){ sitScene.phase='line5'; sitScene.timer=0; }
  }
  else if(sitScene.phase === 'line5'){
    sitMessage = 'And somehow... I would do it all again.';
    sitMessageAlpha = Math.min(1,sitScene.timer/45) * Math.min(1,(230-sitScene.timer)/45);
    if(sitScene.timer > 230){ sitScene.phase='quiet'; sitScene.timer=0; shootingStarTimer=360; }
  }
  else if(sitScene.phase === 'quiet'){
    sitMessage = '';
    sitMessageAlpha = 0;
    if(shootingStarTimer > 0) shootingStarTimer--;
  }
}

function update(){
  movePlayer(players.her,{up:keys.arrowup,down:keys.arrowdown,left:keys.arrowleft,right:keys.arrowright});
  movePlayer(players.him,{up:keys.w,down:keys.s,left:keys.a,right:keys.d});
  heartTimer++;

  const prompt = document.getElementById('prompt');
  prompt.style.display = 'none';

  if(descending){
    descentTimer++;
    fade = Math.min(1,descentTimer/95);
    if(descentTimer > 130) enterCave();
  } else if(fade > 0){
    fade = Math.max(0,fade-.018);
  }

  if(mode === 'silo'){
    if(inZone(hatchZone)){
      prompt.style.display = 'block';
      prompt.textContent = 'Press E to descend below';
    } else if(inZone(exitZone)){
      prompt.style.display = 'block';
      prompt.textContent = 'Press E to leave the silo';
    }

    if(keys.e && !lastE && inZone(hatchZone)) startDescent();
    if(keys.e && !lastE && inZone(exitZone)) location.href = 'index.html';
  }
  else if(mode === 'cave'){
    if(inZone(lakeSitZone) && !sitScene){
      prompt.style.display = 'block';
      prompt.textContent = 'Press E to sit at the edge';
    }
    if(keys.e && !lastE && inZone(lakeSitZone) && !sitScene) startLakeSit();
  }

  updateSitScene();
  lastE = !!keys.e;
}

function drawSiloInterior(){
  ctx.fillStyle = '#14100d';
  ctx.fillRect(0,0,SILO_W,SILO_H);

  const cx = SILO_W/2;
  ctx.fillStyle = '#2e2118';
  ctx.beginPath();
  ctx.ellipse(cx,365,330,310,0,0,Math.PI*2);
  ctx.fill();

  for(let r=0;r<12;r++){
    ctx.strokeStyle = r%2 ? '#5e4027' : '#3d281a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx,365,70+r*22,Math.PI*.72,Math.PI*2.28);
    ctx.stroke();
  }

  ctx.fillStyle = '#7b4a2a';
  for(let x=170;x<790;x+=54) ctx.fillRect(x,108,16,520);
  ctx.fillStyle = '#3b2215';
  ctx.fillRect(145,520,670,38);
  ctx.fillRect(145,150,670,24);

  // spiral stair hint upward
  ctx.strokeStyle = '#b17a3f';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx,350,230,Math.PI*.15,Math.PI*1.45);
  ctx.stroke();
  ctx.fillStyle = '#c58a49';
  for(let i=0;i<14;i++){
    const a = Math.PI*.18 + i*.22;
    ctx.fillRect(cx+Math.cos(a)*230-18,350+Math.sin(a)*230-5,38,10);
  }

  // hatch down
  ctx.fillStyle = '#1b120c';
  ctx.fillRect(410,500,150,56);
  ctx.strokeStyle = '#c08a4b';
  ctx.lineWidth = 5;
  ctx.strokeRect(410,500,150,56);
  ctx.fillStyle = '#ffe18b';
  ctx.font = '18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HATCH',485,535);

  // ladder down preview
  ctx.fillStyle = '#6b3f22';
  ctx.fillRect(450,556,10,95);
  ctx.fillRect(510,556,10,95);
  for(let y=570;y<650;y+=22) ctx.fillRect(450,y,70,7);

  ctx.fillStyle = '#d79b52';
  ctx.fillRect(110,585,90,70);
  ctx.fillStyle = '#1d120b';
  ctx.fillRect(125,604,60,51);
}

function drawCaveBackground(){
  const sky = ctx.createLinearGradient(0,0,0,CAVE_H);
  sky.addColorStop(0,'#02040a');
  sky.addColorStop(.55,'#0a1118');
  sky.addColorStop(1,'#130c0d');
  ctx.fillStyle = sky;
  ctx.fillRect(0,0,CAVE_W,CAVE_H);

  // distant stone shapes
  for(let x=0;x<CAVE_W;x+=220){
    const h = 170 + Math.sin(x*.007)*80;
    ctx.fillStyle = x%440===0 ? '#10171e' : '#0b1016';
    ctx.beginPath();
    ctx.moveTo(x,FLOOR_Y);
    ctx.lineTo(x+80,260+h*.2);
    ctx.lineTo(x+190,310+h*.25);
    ctx.lineTo(x+250,FLOOR_Y);
    ctx.closePath();
    ctx.fill();
  }

  // ceiling roughness
  ctx.fillStyle = '#1c1717';
  ctx.beginPath();
  ctx.moveTo(0,0);
  for(let x=0;x<=CAVE_W;x+=70){
    ctx.lineTo(x,115 + Math.sin(x*.011)*30 + Math.sin(x*.031)*18);
  }
  ctx.lineTo(CAVE_W,0);
  ctx.closePath();
  ctx.fill();

  // floor
  ctx.fillStyle = '#241b18';
  ctx.fillRect(0,FLOOR_Y,CAVE_W,CAVE_H-FLOOR_Y);
  ctx.fillStyle = '#3b2c25';
  for(let x=0;x<CAVE_W;x+=48){
    ctx.fillRect(x,FLOOR_Y+Math.sin(x*.06)*8,42,8);
  }
}

function drawSegmentTitle(text,x,color){
  ctx.save();
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#07070a';
  ctx.fillStyle = color;
  ctx.strokeText(text,x-camera.x,170-camera.y);
  ctx.fillText(text,x-camera.x,170-camera.y);
  ctx.restore();
}

function drawCrystal(x,y,s,color){
  ctx.save();
  ctx.translate(x-camera.x,y-camera.y);
  ctx.fillStyle = color;
  ctx.globalAlpha = .88;
  ctx.beginPath();
  ctx.moveTo(0,-s);
  ctx.lineTo(s*.45,-s*.25);
  ctx.lineTo(s*.32,s);
  ctx.lineTo(-s*.32,s);
  ctx.lineTo(-s*.45,-s*.25);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = .35;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-2,-s*.7,4,s*1.2);
  ctx.restore();
}

function drawWaterfall(x,y,w,h,color){
  ctx.save();
  const gx = ctx.createLinearGradient(0,y-camera.y,0,y+h-camera.y);
  gx.addColorStop(0,color);
  gx.addColorStop(1,'rgba(120,230,255,.12)');
  ctx.fillStyle = gx;
  ctx.fillRect(x-camera.x,y-camera.y,w,h);
  ctx.globalAlpha = .45;
  ctx.fillStyle = '#dff8ff';
  for(let i=0;i<7;i++) ctx.fillRect(x-camera.x+i*w/7+Math.sin(heartTimer/12+i)*4,y-camera.y,3,h);
  ctx.restore();
}

function drawCaveDecorations(){
  // entrance ladder
  ctx.fillStyle = '#8a542f';
  ctx.fillRect(98-camera.x,280-camera.y,12,355);
  ctx.fillRect(155-camera.x,280-camera.y,12,355);
  for(let y=295;y<620;y+=34) ctx.fillRect(98-camera.x,y-camera.y,69,8);
  drawSegmentTitle('There should not be a basement...',300,'#fff1c8');

  // glow mushrooms and glowworms
  for(let i=0;i<120;i++){
    const x = 660 + (i*37)%850;
    const y = 210 + (i*73)%250;
    ctx.fillStyle = i%2 ? '#34e6ff' : '#7bffd8';
    ctx.globalAlpha = .45 + Math.sin(heartTimer/20+i)*.25;
    ctx.fillRect(x-camera.x,y-camera.y,2,2);
    ctx.globalAlpha = 1;
  }
  drawSegmentTitle('Glowworm Grotto',950,'#6df4ff');
  for(let i=0;i<18;i++) drawCrystal(760+i*40,FLOOR_Y-18,18+(i%3)*9,i%2?'#7b3cff':'#1bd7ff');

  // crystal caverns
  drawSegmentTitle('Crystal Caverns',2050,'#89d8ff');
  for(let i=0;i<34;i++){
    const x = 1650 + i*42;
    const s = 35 + (i%6)*12;
    drawCrystal(x,FLOOR_Y-25,s,['#21d7ff','#7b3cff','#ff6bd5','#37ffad'][i%4]);
  }

  // dripstone chamber
  drawSegmentTitle('Dripstone Chamber',3150,'#ffd08a');
  ctx.fillStyle = '#6d4a2c';
  for(let i=0;i<36;i++){
    const x = 2700+i*34;
    const h = 45+(i%7)*18;
    ctx.beginPath();
    ctx.moveTo(x-camera.x,125-camera.y);
    ctx.lineTo(x+12-camera.x,125-camera.y);
    ctx.lineTo(x+6-camera.x,125+h-camera.y);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x-camera.x,FLOOR_Y-camera.y);
    ctx.lineTo(x+18-camera.x,FLOOR_Y-camera.y);
    ctx.lineTo(x+9-camera.x,FLOOR_Y-h*.75-camera.y);
    ctx.fill();
  }

  // underground river / lake beginning
  drawSegmentTitle('Underground River',4200,'#66e5ff');
  ctx.fillStyle = '#0b4558';
  ctx.fillRect(3820-camera.x,FLOOR_Y-32-camera.y,760,34);
  ctx.fillStyle = 'rgba(120,240,255,.35)';
  for(let x=3820;x<4580;x+=55) ctx.fillRect(x-camera.x,FLOOR_Y-22+Math.sin(heartTimer/18+x)*4-camera.y,32,3);
  drawWaterfall(4140,240,70,360,'rgba(100,230,255,.55)');

  // metallic veins and geodes
  drawSegmentTitle('Geodes & Metallic Veins',5350,'#eeb36a');
  for(let i=0;i<12;i++){
    const x = 4920+i*85;
    ctx.strokeStyle = i%3===0?'#ffcc4d':(i%3===1?'#c0d4ff':'#ff8a4d');
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x-camera.x,250-camera.y);
    ctx.lineTo(x+40-camera.x,340-camera.y);
    ctx.lineTo(x+18-camera.x,450-camera.y);
    ctx.stroke();
  }
  for(let i=0;i<5;i++){
    const x = 5250+i*150;
    ctx.fillStyle = '#2a1a2e';
    ctx.beginPath(); ctx.ellipse(x-camera.x,FLOOR_Y-60-camera.y,58,76,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#a456ff';
    ctx.beginPath(); ctx.ellipse(x-camera.x,FLOOR_Y-60-camera.y,34,48,0,0,Math.PI*2); ctx.fill();
  }

  // hidden garden
  drawSegmentTitle('Hidden Garden',6450,'#9dff9b');
  ctx.fillStyle = '#14391f';
  ctx.fillRect(6000-camera.x,FLOOR_Y-105-camera.y,900,105);
  for(let i=0;i<55;i++){
    const x = 6040+i*15;
    const y = FLOOR_Y-25-(i%9)*9;
    ctx.fillStyle = ['#ff8fcf','#fff1a8','#7bffd8','#b184ff'][i%4];
    ctx.fillRect(x-camera.x,y-camera.y,7,7);
  }
  drawWaterfall(6630,275,52,330,'rgba(104,255,205,.45)');

  // ice cavern
  drawSegmentTitle('Ice Cavern',7450,'#8de8ff');
  ctx.fillStyle = 'rgba(90,220,255,.18)';
  ctx.fillRect(7000-camera.x,150-camera.y,850,490);
  for(let i=0;i<26;i++){
    const x = 7050+i*32;
    drawCrystal(x,FLOOR_Y-25,28+(i%5)*16,i%2?'#d9fbff':'#42d6ff');
  }

  // final lake overlook
  drawSegmentTitle('The Underground Lake',8720,'#fff1c8');
  ctx.fillStyle = '#071826';
  ctx.fillRect(8350-camera.x,515-camera.y,900,220);
  const lakeGrad = ctx.createLinearGradient(0,520-camera.y,0,735-camera.y);
  lakeGrad.addColorStop(0,'rgba(22,112,145,.75)');
  lakeGrad.addColorStop(1,'rgba(5,20,35,.95)');
  ctx.fillStyle = lakeGrad;
  ctx.fillRect(8360-camera.x,520-camera.y,900,220);
  ctx.fillStyle = 'rgba(170,240,255,.42)';
  for(let x=8360;x<9250;x+=46){
    ctx.fillRect(x-camera.x,555+Math.sin(heartTimer/25+x*.01)*8-camera.y,30,2);
    ctx.fillRect(x-camera.x,610+Math.sin(heartTimer/30+x*.01)*8-camera.y,44,2);
  }
  // cliff ledge / wall hole
  ctx.fillStyle = '#2b211e';
  ctx.fillRect(8500-camera.x,575-camera.y,380,62);
  ctx.fillStyle = '#4a3930';
  ctx.fillRect(8525-camera.x,560-camera.y,325,18);
}

function drawSprite(p){
  const sw = 96, sh = 128, row = p.rows[p.dir];
  const dw = Math.round(sw*p.scale), dh = Math.round(sh*p.scale);
  let drawX = Math.round(p.x-camera.x-dw/2);
  const drawY = Math.round(p.y-camera.y-dh+10);
  let drawW = dw;
  if(p === players.him && p.dir === 'right'){
    drawX -= 4;
    drawW += 8;
  }
  ctx.drawImage(p.img,p.frame*sw,row*sh,sw,sh,drawX,drawY,drawW,dh);
}

function drawSitVersion(p){
  const x = Math.round(p.x-camera.x);
  const y = Math.round(p.y-camera.y);
  ctx.save();
  ctx.fillStyle = p === players.her ? '#95d7b1' : '#2d6fb8';
  ctx.fillRect(x-13,y-42,26,32);
  ctx.fillStyle = '#2a1b15';
  ctx.fillRect(x-14,y-58,28,20);
  ctx.fillStyle = '#f1c7a8';
  ctx.fillRect(x-10,y-50,20,19);
  ctx.fillStyle = '#1a1010';
  ctx.fillRect(x-14,y-9,12,24);
  ctx.fillRect(x+2,y-9,12,24);
  ctx.restore();
}

function drawPlayers(){
  const arr = [players.her,players.him].sort((a,b)=>a.y-b.y);
  if(sitScene && sitScene.phase !== 'walk'){
    arr.forEach(drawSitVersion);
    // little shoulder/heart moment
    if(sitScene.phase === 'quiet') drawPixelHeart((players.her.x+players.him.x)/2-camera.x,players.her.y-78-camera.y,3);
    return;
  }
  arr.forEach(drawSprite);
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

function drawDebug(){
  if(!debugMode) return;
  ctx.save();
  ctx.fillStyle = 'rgba(0,255,120,.25)';
  const zones = mode === 'silo' ? [hatchZone,exitZone] : [lakeSitZone];
  zones.forEach(z => ctx.fillRect(z.x-camera.x,z.y-camera.y,z.w,z.h));
  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  ctx.fillText(`mode:${mode} her:${Math.round(players.her.x)},${Math.round(players.her.y)} him:${Math.round(players.him.x)},${Math.round(players.him.y)}`,20,30);
  ctx.restore();
}

function drawDescentOverlay(){
  if(!descending) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1,descentTimer/40);
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.globalAlpha = Math.min(1,descentTimer/70);
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = '#fff1c8';
  ctx.fillText('...there should not be a basement...',canvas.width/2,canvas.height/2-10);
  if(descentTimer > 65) ctx.fillText('*clank*',canvas.width/2,canvas.height/2+34);
  ctx.restore();
}

function drawFade(){
  if(fade <= 0) return;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.restore();
}

function drawSitMessage(){
  if(!sitMessage || sitMessageAlpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = sitMessageAlpha;
  ctx.textAlign = 'center';
  ctx.font = 'bold 25px monospace';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#02050a';
  ctx.fillStyle = '#fff1c8';
  ctx.shadowColor = '#87d8ff';
  ctx.shadowBlur = 14;
  ctx.strokeText(sitMessage,canvas.width/2,canvas.height*.22);
  ctx.fillText(sitMessage,canvas.width/2,canvas.height*.22);
  ctx.restore();
}

function drawShootingStar(){
  if(!sitScene || sitScene.phase !== 'quiet' || shootingStarTimer > 0) return;
  const t = Math.min(1,(sitScene.timer-360)/120);
  if(t < 0 || t > 1) return;
  const x = 8560 + t*530;
  const y = 584 + Math.sin(t*Math.PI)*35;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,241,200,.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x-camera.x,y-camera.y);
  ctx.lineTo(x-80-camera.x,y+22-camera.y);
  ctx.stroke();
  ctx.fillStyle = '#fff1c8';
  ctx.fillRect(x-camera.x,y-camera.y,6,6);
  ctx.restore();
}

function draw(){
  camera = getCamera();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#02050a';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.save();
  ctx.translate(-camera.x,-camera.y);
  if(mode === 'silo') drawSiloInterior();
  else drawCaveBackground();
  ctx.restore();

  if(mode === 'cave'){
    drawCaveDecorations();
    drawShootingStar();
  }

  drawDebug();
  drawPlayers();
  drawSitMessage();
  drawDescentOverlay();
  drawFade();
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

Promise.all([herImg.decode(),himImg.decode()]).then(()=>loop());
