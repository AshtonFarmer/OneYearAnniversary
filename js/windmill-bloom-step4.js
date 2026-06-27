// Windmill of Wishes - Step 4
// When 52 wishes are collected, the petals gather and bloom into a glowing flower with a heart inside.

let bloomScene = null;
let bloomPetals = [];
let bloomSparkles = [];
let bloomStarted = false;

function startBloomScene(){
  if(bloomStarted) return;
  bloomStarted = true;

  bloomScene = {
    phase:'lift',
    timer:0,
    flowerOpen:0,
    heartOpen:0,
    message:'The wishes begin to bloom...'
  };

  bloomPetals = [];
  bloomSparkles = [];

  const spots = [basketPoint(players.her), basketPoint(players.him)];
  for(let i=0;i<52;i++){
    const from = spots[i%2];
    bloomPetals.push({
      x:from.x + (Math.random()-.5)*28,
      y:from.y + (Math.random()-.5)*16,
      angle:Math.random()*Math.PI*2,
      radius:95 + Math.random()*70,
      targetRadius:14 + Math.random()*34,
      speed:.018 + Math.random()*.026,
      size:3 + Math.random()*4,
      color:i%3===0?'#ffd1e8':(i%3===1?'#ff8fcf':'#fff1a8'),
      life:1
    });
  }
}

function updateBloomScene(){
  if(!bloomScene) return;
  bloomScene.timer++;

  const center = {x:WORLD_W/2, y:430};

  if(bloomScene.phase === 'lift'){
    bloomScene.message = 'The wishes begin to bloom...';
    bloomPetals.forEach(p => {
      p.angle += p.speed;
      p.radius += (p.targetRadius - p.radius) * .018;
      p.x += (center.x + Math.cos(p.angle)*p.radius - p.x) * .045;
      p.y += (center.y + Math.sin(p.angle)*p.radius*.45 - p.y) * .045;
    });
    if(bloomScene.timer > 210){
      bloomScene.phase = 'grow';
      bloomScene.timer = 0;
    }
  }

  else if(bloomScene.phase === 'grow'){
    bloomScene.message = 'A wish flower blooms.';
    bloomScene.flowerOpen = Math.min(1,bloomScene.timer/230);
    bloomPetals.forEach(p => {
      p.angle += p.speed * 1.8;
      p.radius *= .985;
      p.x += (center.x - p.x) * .018;
      p.y += (center.y - p.y) * .018;
    });
    if(bloomScene.timer % 8 === 0) addBloomSparkle(center.x+(Math.random()-.5)*150,center.y+(Math.random()-.5)*110);
    if(bloomScene.timer > 250){
      bloomScene.phase = 'heart';
      bloomScene.timer = 0;
    }
  }

  else if(bloomScene.phase === 'heart'){
    bloomScene.message = 'Something beautiful is waking up...';
    bloomScene.flowerOpen = 1;
    bloomScene.heartOpen = Math.min(1,bloomScene.timer/130);
    if(bloomScene.timer % 5 === 0) addBloomSparkle(center.x+(Math.random()-.5)*90,center.y+(Math.random()-.5)*80);
    if(bloomScene.timer > 165){
      bloomScene.phase = 'hold';
      bloomScene.timer = 0;
    }
  }

  else if(bloomScene.phase === 'hold'){
    bloomScene.message = 'Every dream we share becomes part of our future.';
    bloomScene.flowerOpen = 1;
    bloomScene.heartOpen = 1;
    if(bloomScene.timer % 10 === 0) addBloomSparkle(center.x+(Math.random()-.5)*130,center.y+(Math.random()-.5)*100);
  }

  bloomSparkles = bloomSparkles.filter(s => {
    s.life--;
    s.x += s.vx;
    s.y += s.vy;
    s.vy -= .002;
    return s.life > 0;
  });
}

function addBloomSparkle(x,y){
  bloomSparkles.push({x,y,vx:(Math.random()-.5)*.75,vy:(Math.random()-.5)*.75,life:45+Math.random()*35,size:2+Math.random()*2});
}

const originalBloomUpdate = update;
update = function(){
  originalBloomUpdate();

  if(wishGame && wishGame.finished && !bloomStarted){
    startBloomScene();
  }

  updateBloomScene();
};

function drawBloomPetals(){
  if(!bloomScene) return;
  bloomPetals.forEach(p => {
    ctx.save();
    ctx.translate(Math.round(p.x-camera.x),Math.round(p.y-camera.y));
    ctx.rotate(p.angle);
    ctx.globalAlpha = bloomScene.phase === 'grow' ? Math.max(0,1-bloomScene.flowerOpen*.8) : .92;
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
    ctx.restore();
  });
}

function drawWishFlower(){
  if(!bloomScene || bloomScene.flowerOpen <= 0) return;

  const centerX = WORLD_W/2 - camera.x;
  const centerY = 430 - camera.y;
  const open = bloomScene.flowerOpen;

  ctx.save();
  ctx.translate(centerX,centerY);

  // Stem and leaves grow first.
  ctx.fillStyle = '#3f7b3c';
  ctx.fillRect(-3,18,6,Math.round(75*open));
  ctx.fillStyle = '#5fa95a';
  ctx.save();
  ctx.rotate(-.55);
  ctx.fillRect(-2,45,34*open,10);
  ctx.restore();
  ctx.save();
  ctx.rotate(.55);
  ctx.fillRect(-32*open,58,34*open,10);
  ctx.restore();

  // Glow behind flower.
  const glow = ctx.createRadialGradient(0,0,10,0,0,135*open);
  glow.addColorStop(0,'rgba(255,170,220,.42)');
  glow.addColorStop(1,'rgba(255,170,220,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0,0,135*open,0,Math.PI*2);
  ctx.fill();

  // Petal layers open one after another.
  drawPetalLayer(18,54,9,'#ff7ac8',open,.05);
  drawPetalLayer(14,42,8,'#ff9ed7',open,.22);
  drawPetalLayer(10,30,7,'#ffd1e8',open,.42);
  drawPetalLayer(7,18,6,'#fff1a8',open,.62);

  // Center.
  ctx.fillStyle = '#ffe18b';
  ctx.beginPath();
  ctx.arc(0,0,14*Math.min(1,open*1.5),0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#ffb84d';
  ctx.beginPath();
  ctx.arc(0,0,7*Math.min(1,open*1.8),0,Math.PI*2);
  ctx.fill();

  ctx.restore();
}

function drawPetalLayer(count,length,width,color,open,delay){
  const layerOpen = Math.max(0,Math.min(1,(open-delay)/(1-delay)));
  if(layerOpen <= 0) return;
  ctx.save();
  ctx.globalAlpha = layerOpen;
  ctx.fillStyle = color;
  for(let i=0;i<count;i++){
    ctx.save();
    ctx.rotate(i*Math.PI*2/count + Math.sin(heartTimer/50)*.025);
    const l = length * (.35 + layerOpen*.65);
    const w = width * (.55 + layerOpen*.45);
    ctx.beginPath();
    ctx.ellipse(0,-l/2,l/3,w,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawBloomHeart(){
  if(!bloomScene || bloomScene.heartOpen <= 0) return;
  const h = bloomScene.heartOpen;
  const pulse = 1 + Math.sin(heartTimer/10)*.08;
  const x = WORLD_W/2 - camera.x;
  const y = 430 - camera.y - 12 - h*30 + Math.sin(heartTimer/18)*3;
  ctx.save();
  ctx.globalAlpha = h;
  ctx.shadowColor = '#ff7ac8';
  ctx.shadowBlur = 24;
  drawPixelHeart(x,y,Math.round((5 + h*4)*pulse));
  ctx.restore();
}

function drawBloomSparkles(){
  bloomSparkles.forEach(s => {
    ctx.save();
    ctx.globalAlpha = Math.max(0,s.life/70);
    ctx.fillStyle = '#fff1a8';
    ctx.fillRect(Math.round(s.x-camera.x),Math.round(s.y-camera.y),s.size+2,1);
    ctx.fillRect(Math.round(s.x-camera.x+1),Math.round(s.y-camera.y-1),1,s.size+2);
    ctx.restore();
  });
}

function drawBloomMessage(){
  if(!bloomScene || !bloomScene.message) return;
  let alpha = 1;
  if(bloomScene.phase === 'lift') alpha = Math.min(1,bloomScene.timer/50);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.font = 'bold 23px monospace';
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#241820';
  ctx.fillStyle = '#fff1d6';
  ctx.shadowColor = '#ff9dcc';
  ctx.shadowBlur = 12;
  ctx.strokeText(bloomScene.message,canvas.width/2,canvas.height*.20);
  ctx.fillText(bloomScene.message,canvas.width/2,canvas.height*.20);
  ctx.restore();
}

const originalBloomDraw = draw;
draw = function(){
  originalBloomDraw();
  if(!bloomScene) return;
  drawBloomPetals();
  drawWishFlower();
  drawBloomHeart();
  drawBloomSparkles();
  drawBloomMessage();
};
