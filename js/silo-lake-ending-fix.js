// Underground Lake ending fix
// Uses the real sprites, moves the sit spot, and makes the star/reflection look cleaner.

const LAKE_SIT_AREA = {x:9212, y:617, w:103, h:55};
const LAKE_STAR_AREA = {x:9003, y:408, w:288, h:113};

let lakeStarSparkles = [];
for(let i=0;i<34;i++){
  lakeStarSparkles.push({
    x:LAKE_STAR_AREA.x + Math.random()*LAKE_STAR_AREA.w,
    y:LAKE_STAR_AREA.y + Math.random()*LAKE_STAR_AREA.h,
    phase:Math.random()*120,
    size:1+Math.random()*2
  });
}

startLakeSit = function(){
  sitScene = {phase:'walk',timer:0,star:0};
  sitMessage = '';
  sitMessageAlpha = 0;
  shootingStarTimer = 0;
};

updateSitScene = function(){
  if(!sitScene) return;
  sitScene.timer++;

  const herSpot = {x:9232,y:636,dir:'up'};
  const himSpot = {x:9274,y:636,dir:'up'};

  if(sitScene.phase === 'walk'){
    const a = moveTo(players.her,herSpot,1.35);
    const b = moveTo(players.him,himSpot,1.35);
    if(a && b){
      players.her.dir = 'up';
      players.him.dir = 'up';
      players.her.frame = 0;
      players.him.frame = 0;
      sitScene.phase = 'line1';
      sitScene.timer = 0;
    }
  }
  else if(sitScene.phase === 'line1'){
    sitMessage = 'It was a long journey...';
    sitMessageAlpha = Math.min(1,sitScene.timer/45) * Math.min(1,(175-sitScene.timer)/45);
    if(sitScene.timer > 175){ sitScene.phase='line2'; sitScene.timer=0; }
  }
  else if(sitScene.phase === 'line2'){
    sitMessage = 'But every step was beautiful.';
    sitMessageAlpha = Math.min(1,sitScene.timer/45) * Math.min(1,(195-sitScene.timer)/45);
    if(sitScene.timer > 195){ sitScene.phase='line3'; sitScene.timer=0; }
  }
  else if(sitScene.phase === 'line3'){
    sitMessage = 'And we are still here...';
    sitMessageAlpha = Math.min(1,sitScene.timer/45) * Math.min(1,(185-sitScene.timer)/45);
    if(sitScene.timer > 185){ sitScene.phase='line4'; sitScene.timer=0; }
  }
  else if(sitScene.phase === 'line4'){
    sitMessage = 'enjoying the moment together.';
    sitMessageAlpha = Math.min(1,sitScene.timer/45) * Math.min(1,(210-sitScene.timer)/45);
    if(sitScene.timer > 210){ sitScene.phase='quiet'; sitScene.timer=0; }
  }
  else if(sitScene.phase === 'quiet'){
    sitMessage = '';
    sitMessageAlpha = 0;
  }
};

function drawLakeStarShape(cx,cy,r,alpha=1){
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx-camera.x,cy-camera.y);
  ctx.shadowColor = '#fff1a8';
  ctx.shadowBlur = 18;

  ctx.fillStyle = '#fff8c9';
  ctx.beginPath();
  for(let i=0;i<10;i++){
    const a = -Math.PI/2 + i*Math.PI/5;
    const rr = i%2===0 ? r : r*.42;
    const x = Math.cos(a)*rr;
    const y = Math.sin(a)*rr;
    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  }
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = alpha*.75;
  ctx.strokeStyle = '#fff1a8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r*2.4,0);
  ctx.lineTo(r*2.4,0);
  ctx.moveTo(0,-r*2.4);
  ctx.lineTo(0,r*2.4);
  ctx.stroke();

  ctx.restore();
}

function drawLakeReflection(cx,cy,t){
  ctx.save();
  const pulse = .65 + Math.sin(t/26)*.18;

  // Golden glow reflection sitting inside the lake area.
  const g = ctx.createRadialGradient(cx-camera.x,cy-camera.y,4,cx-camera.x,cy-camera.y,92);
  g.addColorStop(0,`rgba(255,246,175,${.55*pulse})`);
  g.addColorStop(.35,`rgba(255,216,105,${.22*pulse})`);
  g.addColorStop(1,'rgba(255,216,105,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx-camera.x,cy-camera.y,115,42,0,0,Math.PI*2);
  ctx.fill();

  // Pixel water streaks/reflection lines.
  ctx.globalAlpha = .7*pulse;
  ctx.fillStyle = '#fff1a8';
  for(let i=0;i<9;i++){
    const yy = cy + i*7 - camera.y;
    const w = 84 - i*6;
    const wiggle = Math.sin(t/18+i)*10;
    ctx.fillRect(cx-camera.x-w/2+wiggle,yy,w,2);
  }
  ctx.restore();
}

drawShootingStar = function(){
  if(!sitScene || sitScene.phase !== 'quiet') return;

  const t = sitScene.timer;
  const progress = Math.min(1,t/165);
  const sx = LAKE_STAR_AREA.x + LAKE_STAR_AREA.w - progress*LAKE_STAR_AREA.w;
  const sy = LAKE_STAR_AREA.y + 18 + Math.sin(progress*Math.PI)*48;
  const reflectionX = LAKE_STAR_AREA.x + LAKE_STAR_AREA.w*.46;
  const reflectionY = LAKE_STAR_AREA.y + LAKE_STAR_AREA.h*.58;

  ctx.save();

  // Tiny lake sparkles around the reflection area.
  lakeStarSparkles.forEach(s => {
    const a = .15 + Math.sin((heartTimer+s.phase)/22)*.25;
    ctx.globalAlpha = Math.max(0,a);
    ctx.fillStyle = s.phase%2 > 1 ? '#fff1a8' : '#8be8ff';
    ctx.fillRect(Math.round(s.x-camera.x),Math.round(s.y-camera.y),s.size,s.size);
  });

  // Shooting star trail, then actual star head.
  ctx.globalAlpha = .9;
  ctx.strokeStyle = 'rgba(255,241,168,.88)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx-camera.x,sy-camera.y);
  ctx.lineTo(sx+96-camera.x,sy-32-camera.y);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx+8-camera.x,sy+4-camera.y);
  ctx.lineTo(sx+128-camera.x,sy-38-camera.y);
  ctx.stroke();

  drawLakeStarShape(sx,sy,8,.95);
  drawLakeReflection(reflectionX,reflectionY,t);

  ctx.restore();
};

function drawRealSeatedSprite(p,offsetX=0){
  // Uses the real sprite sheet, cropped lower so it reads as sitting at the cliff edge.
  const sw = 96, sh = 128;
  const row = p.rows.up;
  const frame = 0;
  const scale = p.scale || .58;
  const dw = Math.round(sw*scale);
  const dh = Math.round(sh*scale);
  const x = Math.round(p.x-camera.x-dw/2+offsetX);
  const y = Math.round(p.y-camera.y-dh+18);

  ctx.save();
  ctx.drawImage(p.img,frame*sw,row*sh,sw,sh,x,y,dw,dh);

  // Small dark ledge mask over feet to fake a seated pose without replacing sprites.
  ctx.globalAlpha = .72;
  ctx.fillStyle = '#151012';
  ctx.fillRect(x-2,y+dh-22,dw+4,24);
  ctx.globalAlpha = .45;
  ctx.fillStyle = '#32404c';
  ctx.fillRect(x+5,y+dh-20,dw-10,3);
  ctx.restore();
}

drawPlayers = function(){
  const arr = [players.her,players.him].sort((a,b)=>a.y-b.y);
  if(sitScene && sitScene.phase !== 'walk'){
    drawRealSeatedSprite(players.her,-3);
    drawRealSeatedSprite(players.him,3);
    if(sitScene.phase === 'quiet'){
      drawPixelHeart((players.her.x+players.him.x)/2-camera.x,players.her.y-84-camera.y,3);
    }
    return;
  }
  arr.forEach(drawSprite);
};

// Better lake ending camera and prompt trigger.
const previousLakeEndingUpdate = updateFullCaveSystems;
updateFullCaveSystems = function(){
  if(previousLakeEndingUpdate) previousLakeEndingUpdate();
  if(mode !== 'cave' || sitScene) return;

  const prompt = document.getElementById('prompt');
  const inLakeSitArea = players.her.x >= LAKE_SIT_AREA.x && players.her.x <= LAKE_SIT_AREA.x+LAKE_SIT_AREA.w && players.her.y >= LAKE_SIT_AREA.y && players.her.y <= LAKE_SIT_AREA.y+LAKE_SIT_AREA.h;
  if(inLakeSitArea){
    prompt.style.display = 'block';
    prompt.textContent = 'Press E to sit at the edge';
    if(keys.e && !lastE) startLakeSit();
  }
};

const previousLakeEndingGetCamera = getCamera;
getCamera = function(){
  if(sitScene){
    const cx = 9145;
    const cy = 545;
    return {
      x:Math.max(0,Math.min(Math.max(0,activeWorldW()-canvas.width),cx-canvas.width/2)),
      y:Math.max(0,Math.min(Math.max(0,activeWorldH()-canvas.height),cy-canvas.height/2))
    };
  }
  return previousLakeEndingGetCamera();
};
