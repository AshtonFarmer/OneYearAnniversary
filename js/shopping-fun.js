// Shopping Center fun interactions: photo booth + ice cream shop.
// No saved history/collection. Just cute one-off moments.

const photoBoothBox = {x:933, y:366, w:61, h:90};
const iceCreamBox = {x:537, y:642, w:58, h:53};

let shoppingAction = null;
let shoppingCooldown = 0;
let shoppingLastE = false;
let shoppingParticles = [];
let photoFlash = 0;
let photoStrip = null;
let iceCreamMoment = null;

const photoPoseSets = [
  ['smile','heart','silly','blush'],
  ['peace','laugh','kiss','goofy'],
  ['cute','surprise','heart','laugh'],
  ['shy','smile','goofy','heart']
];

const iceCreamFlavors = [
  {name:'Chocolate', color:'#7a4328'},
  {name:'Vanilla', color:'#fff1c8'},
  {name:'Strawberry', color:'#ff8fbd'},
  {name:'Mint', color:'#8ff0c8'},
  {name:'Blueberry', color:'#8fb5ff'}
];

function boxCenter(b){
  return {x:b.x + b.w/2, y:b.y + b.h/2};
}

function inShoppingBox(x,y,b){
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

function nearShoppingBox(b){
  return inShoppingBox(players.her.x,players.her.y,b) || inShoppingBox(players.him.x,players.him.y,b);
}

function setShoppingTarget(p,x,y,dir){
  p.target = {x,y,dir};
}

function walkShoppingTarget(p){
  if(!p.target) return true;

  const dx = p.target.x - p.x;
  const dy = p.target.y - p.y;
  const dist = Math.hypot(dx,dy) || 1;

  if(dist < 3){
    p.x = p.target.x;
    p.y = p.target.y;
    p.dir = p.target.dir || p.dir;
    p.frame = 0;
    p.target = null;
    return true;
  }

  const step = Math.min(p.speed * 1.18, dist);
  p.x += dx / dist * step;
  p.y += dy / dist * step;
  p.dir = Math.abs(dx) > Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up');

  p.frameTimer = (p.frameTimer || 0) + 1;
  if(p.frameTimer > 8){
    const seq = p.frames[p.dir];
    const i = seq.indexOf(p.frame);
    p.frame = seq[(i + 1 + seq.length) % seq.length];
    p.frameTimer = 0;
  }

  return false;
}

function startPhotoBooth(){
  shoppingAction = {type:'photo',phase:'walk',timer:0};
  shoppingCooldown = 30;
  photoStrip = null;
  photoFlash = 0;

  const c = boxCenter(photoBoothBox);
  setShoppingTarget(players.her,c.x-13,c.y+34,'up');
  setShoppingTarget(players.him,c.x+14,c.y+34,'up');
}

function startIceCream(){
  shoppingAction = {type:'ice',phase:'walk',timer:0};
  shoppingCooldown = 30;

  const herFlavor = iceCreamFlavors[Math.floor(Math.random()*iceCreamFlavors.length)];
  const himFlavor = iceCreamFlavors[Math.floor(Math.random()*iceCreamFlavors.length)];
  const brainFreeze = Math.random() < .35 ? (Math.random() < .5 ? 'her' : 'him') : null;

  iceCreamMoment = {herFlavor,himFlavor,brainFreeze,bites:0};

  const c = boxCenter(iceCreamBox);
  setShoppingTarget(players.her,c.x-20,c.y+64,'up');
  setShoppingTarget(players.him,c.x+22,c.y+64,'up');
}

function spawnShopHeart(x,y){
  shoppingParticles.push({type:'heart',x,y,life:70,size:4});
}

function spawnShopSparkle(x,y){
  shoppingParticles.push({type:'sparkle',x:x+(Math.random()-.5)*40,y:y+(Math.random()-.5)*34,life:36,size:2+Math.random()*2});
}

function updateShoppingFun(){
  if(shoppingCooldown > 0) shoppingCooldown--;
  if(photoFlash > 0) photoFlash--;

  shoppingParticles = shoppingParticles.filter(p => {
    p.life--;
    if(p.type === 'heart') p.y -= .45;
    if(p.type === 'sparkle') p.y -= .25;
    return p.life > 0;
  });

  if(!shoppingAction) return;
  shoppingAction.timer++;

  if(shoppingAction.type === 'photo'){
    if(shoppingAction.phase === 'walk'){
      const doneHer = walkShoppingTarget(players.her);
      const doneHim = walkShoppingTarget(players.him);
      if(doneHer && doneHim){
        shoppingAction.phase = 'curtain';
        shoppingAction.timer = 0;
        players.her.dir = 'up';
        players.him.dir = 'up';
      }
    } else if(shoppingAction.phase === 'curtain'){
      players.her.frame = 0;
      players.him.frame = 0;
      if(shoppingAction.timer === 90){
        photoFlash = 18;
        spawnShopHeart(photoBoothBox.x + photoBoothBox.w/2, photoBoothBox.y - 8);
      }
      if(shoppingAction.timer === 118){
        photoStrip = {
          poses:photoPoseSets[Math.floor(Math.random()*photoPoseSets.length)],
          y:-160,
          show:true
        };
        shoppingAction.phase = 'print';
        shoppingAction.timer = 0;
      }
    } else if(shoppingAction.phase === 'print'){
      if(photoStrip) photoStrip.y = Math.min(122,photoStrip.y + 4);
      if(shoppingAction.timer % 18 === 0) spawnShopSparkle(photoBoothBox.x+30,photoBoothBox.y+30);
      if(shoppingAction.timer > 190){
        shoppingAction = null;
        shoppingCooldown = 25;
      }
    }
  }

  if(shoppingAction && shoppingAction.type === 'ice'){
    if(shoppingAction.phase === 'walk'){
      const doneHer = walkShoppingTarget(players.her);
      const doneHim = walkShoppingTarget(players.him);
      if(doneHer && doneHim){
        shoppingAction.phase = 'eat';
        shoppingAction.timer = 0;
        players.her.dir = 'up';
        players.him.dir = 'up';
        spawnShopHeart((players.her.x+players.him.x)/2, players.her.y-60);
      }
    } else if(shoppingAction.phase === 'eat'){
      players.her.frame = 0;
      players.him.frame = 0;
      if(shoppingAction.timer % 55 === 0) iceCreamMoment.bites++;
      if(shoppingAction.timer === 95 && iceCreamMoment.brainFreeze){
        shoppingParticles.push({type:'freeze',who:iceCreamMoment.brainFreeze,life:90});
        spawnShopHeart((players.her.x+players.him.x)/2, players.her.y-60);
      }
      if(shoppingAction.timer > 260){
        shoppingAction = null;
        shoppingCooldown = 25;
      }
    }
  }
}

const originalShoppingUpdate = update;
update = function(){
  if(!shoppingAction){
    originalShoppingUpdate();
  } else {
    heartTimer++;
  }

  updateShoppingFun();

  const prompt = document.getElementById('prompt');
  const nearPhoto = nearShoppingBox(photoBoothBox);
  const nearIce = nearShoppingBox(iceCreamBox);

  if(!shoppingAction){
    if(nearPhoto){
      prompt.style.display = 'block';
      prompt.textContent = 'Press E to use the photo booth';
    } else if(nearIce){
      prompt.style.display = 'block';
      prompt.textContent = 'Press E to get ice cream';
    }
  } else {
    prompt.style.display = 'block';
    if(shoppingAction.type === 'photo'){
      if(shoppingAction.phase === 'curtain'){
        const left = Math.max(1,4-Math.ceil(shoppingAction.timer/30));
        prompt.textContent = left > 1 ? `${left-1}...` : 'Smile!';
      } else if(shoppingAction.phase === 'print') prompt.textContent = 'Photo strip printing!';
      else prompt.textContent = 'Walking to the photo booth...';
    }
    if(shoppingAction.type === 'ice'){
      if(shoppingAction.phase === 'eat') prompt.textContent = `${iceCreamMoment.herFlavor.name} + ${iceCreamMoment.himFlavor.name}`;
      else prompt.textContent = 'Walking to the ice cream shop...';
    }
  }

  if(keys.e && !shoppingLastE && !shoppingAction && shoppingCooldown <= 0){
    if(nearPhoto) startPhotoBooth();
    else if(nearIce) startIceCream();
  }

  shoppingLastE = !!keys.e;
};

function drawPhotoBoothOverlay(){
  if(!shoppingAction || shoppingAction.type !== 'photo') return;

  const x = photoBoothBox.x - camera.x;
  const y = photoBoothBox.y - camera.y;

  ctx.save();

  if(shoppingAction.phase === 'curtain' || shoppingAction.phase === 'print'){
    const close = Math.min(1,shoppingAction.timer/45);
    ctx.fillStyle = '#7b1838';
    ctx.fillRect(x-6,y-4,Math.round((photoBoothBox.w+12)*close),photoBoothBox.h+8);
    ctx.fillStyle = '#b82c5a';
    for(let i=0;i<6;i++) ctx.fillRect(x-4+i*12,y-4,5,photoBoothBox.h+8);
  }

  if(photoStrip && photoStrip.show){
    const sx = photoBoothBox.x + 78 - camera.x;
    const sy = photoBoothBox.y + photoStrip.y - camera.y;
    ctx.fillStyle = '#fff7ef';
    ctx.fillRect(sx,sy,46,126);
    ctx.fillStyle = '#241820';
    ctx.fillRect(sx+4,sy+5,38,24);
    ctx.fillRect(sx+4,sy+35,38,24);
    ctx.fillRect(sx+4,sy+65,38,24);
    ctx.fillRect(sx+4,sy+95,38,24);

    photoStrip.poses.forEach((pose,i) => {
      const py = sy + 13 + i*30;
      ctx.fillStyle = '#ff97cf';
      ctx.fillRect(sx+11,py,7,7);
      ctx.fillStyle = '#8bd2ff';
      ctx.fillRect(sx+28,py,7,7);
      ctx.fillStyle = '#ff6bb5';
      drawPixelHeart(sx+23,py+6,2);
      ctx.fillStyle = '#fff1a8';
      ctx.font = '7px monospace';
      ctx.fillText(pose,sx+7,py+15);
    });
  }

  ctx.restore();
}

function drawIceCreamOverlay(){
  if(!iceCreamMoment || !shoppingAction || shoppingAction.type !== 'ice' || shoppingAction.phase !== 'eat') return;

  function drawCone(p,flavor,side){
    const shake = iceCreamMoment.brainFreeze === side && shoppingAction.timer > 95 && shoppingAction.timer < 160 ? Math.sin(shoppingAction.timer)*3 : 0;
    const x = p.x - camera.x + (side === 'her' ? -18 : 18) + shake;
    const y = p.y - camera.y - 54;
    ctx.save();
    ctx.fillStyle = '#d89a54';
    ctx.beginPath();
    ctx.moveTo(x-5,y+10);
    ctx.lineTo(x+5,y+10);
    ctx.lineTo(x,y+24);
    ctx.fill();
    ctx.fillStyle = flavor.color;
    ctx.fillRect(x-7,y+2,14,10);
    ctx.fillRect(x-4,y-2,8,5);
    ctx.restore();
  }

  drawCone(players.her,iceCreamMoment.herFlavor,'her');
  drawCone(players.him,iceCreamMoment.himFlavor,'him');
}

function drawShoppingParticles(){
  shoppingParticles.forEach(p => {
    ctx.save();
    if(p.type === 'heart'){
      ctx.globalAlpha = Math.max(0,p.life/70);
      ctx.shadowColor = '#ff7ac8';
      ctx.shadowBlur = 8;
      drawPixelHeart(p.x-camera.x,p.y-camera.y,p.size);
    }
    if(p.type === 'sparkle'){
      ctx.globalAlpha = Math.max(0,p.life/36);
      ctx.fillStyle = '#fff1a8';
      ctx.fillRect(p.x-camera.x,p.y-camera.y,p.size+2,1);
      ctx.fillRect(p.x-camera.x+1,p.y-camera.y-1,1,p.size+2);
    }
    if(p.type === 'freeze'){
      const target = p.who === 'her' ? players.her : players.him;
      ctx.globalAlpha = Math.max(0,p.life/90);
      ctx.font = '18px monospace';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#061018';
      ctx.fillStyle = '#8bd2ff';
      ctx.strokeText('BRAIN FREEZE!',target.x-camera.x,target.y-camera.y-78);
      ctx.fillText('BRAIN FREEZE!',target.x-camera.x,target.y-camera.y-78);
      ctx.fillText('❄',target.x-camera.x-18,target.y-camera.y-58);
      ctx.fillText('❄',target.x-camera.x+18,target.y-camera.y-54);
    }
    ctx.restore();
  });
}

const originalShoppingDrawDebugZones = drawDebugZones;
drawDebugZones = function(){
  originalShoppingDrawDebugZones();
  if(!debugMode) return;
  ctx.save();
  drawDebugRect(photoBoothBox,'rgba(255,120,200,0.28)');
  drawDebugText('Photo Booth',photoBoothBox.x,photoBoothBox.y);
  drawDebugRect(iceCreamBox,'rgba(120,220,255,0.28)');
  drawDebugText('Ice Cream',iceCreamBox.x,iceCreamBox.y);
  ctx.restore();
};

const originalShoppingDraw = draw;
draw = function(){
  camera = getCamera();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#061018';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(map,-camera.x,-camera.y);

  drawPhotoBoothOverlay();
  drawDebugZones();

  const arr = [players.her,players.him].sort((a,b)=>a.y-b.y);
  arr.forEach(drawSprite);
  drawIceCreamOverlay();
  drawShoppingParticles();
  drawCoupleHeart();

  if(photoFlash > 0){
    ctx.save();
    ctx.globalAlpha = photoFlash / 18;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.restore();
  }
};
