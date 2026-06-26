// Special photo booth memory scene.
// While the normal photo booth is running, press * to trigger the special moment.

const specialMemorySpot = {x:809, y:413, w:112, h:54};
const specialMemoryLeft = {x:814, y:445};
const specialMemoryRight = {x:875, y:445};
const specialMemoryTogether = {x:838, y:445};

let specialPhotoScene = null;
let specialPhotoLastStar = false;
let specialPhotoBubbles = [];
let specialPhotoHearts = [];
let specialPhotoEndingStripTimer = 0;

function specialStarPressed(){
  return !!keys['*'] || !!keys['8'];
}

function moveSpecialToward(p,target,speed=2.2){
  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const dist = Math.hypot(dx,dy) || 1;

  if(dist < 3){
    p.x = target.x;
    p.y = target.y;
    p.dir = target.dir || p.dir;
    p.frame = 0;
    return true;
  }

  p.x += dx / dist * Math.min(speed,dist);
  p.y += dy / dist * Math.min(speed,dist);
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

function finishSpecialPhotoScene(){
  specialPhotoScene = null;
  shoppingAction = null;
  shoppingCooldown = 35;
  specialPhotoEndingStripTimer = 120;
  specialPhotoBubbles = [];
  specialPhotoHearts = [];
  players.her.frame = 0;
  players.him.frame = 0;
}

function startSpecialPhotoScene(){
  const c = boxCenter(photoBoothBox);
  specialPhotoScene = {timer:0,phase:'walkOut',message:'',flash:0,walkDone:false,yesDone:false};
  shoppingAction = null;
  photoStrip = null;
  photoFlash = 0;
  specialPhotoEndingStripTimer = 0;

  // Start inside/near the photo booth, then walk away to the real spot.
  players.him.x = c.x - 12;
  players.him.y = c.y + 36;
  players.him.dir = 'left';
  players.him.frame = 0;

  players.her.x = c.x + 18;
  players.her.y = c.y + 36;
  players.her.dir = 'left';
  players.her.frame = 0;
}

function updateSpecialPhotoScene(){
  if(!specialPhotoScene) return;

  specialPhotoScene.timer++;
  heartTimer++;

  const bubbleX = specialMemoryLeft.x - 18;
  const bubbleY = specialMemoryLeft.y + 10;

  if(specialPhotoScene.phase === 'walkOut'){
    specialPhotoScene.message = 'Walking to the special spot...';
    const himDone = moveSpecialToward(players.him,{x:specialMemoryLeft.x,y:specialMemoryLeft.y,dir:'right'},2.4);
    const herDone = moveSpecialToward(players.her,{x:specialMemoryRight.x,y:specialMemoryRight.y,dir:'left'},2.4);

    if(himDone && herDone){
      specialPhotoScene.phase = 'bubbles';
      specialPhotoScene.timer = 0;
      players.him.dir = 'right';
      players.her.dir = 'left';
    }
  } else if(specialPhotoScene.phase === 'bubbles'){
    specialPhotoScene.message = 'The bubble machine starts...';
    players.him.frame = 0;
    players.her.frame = 0;
    if(specialPhotoScene.timer > 85){
      specialPhotoScene.phase = 'ask';
      specialPhotoScene.timer = 0;
    }
  } else if(specialPhotoScene.phase === 'ask'){
    specialPhotoScene.message = 'Will you be my girlfriend?';
    players.him.frame = 0;
    players.her.frame = 0;
    players.him.dir = 'right';
    players.her.dir = 'left';
    if(specialPhotoScene.timer > 130){
      specialPhotoScene.phase = 'yesWalk';
      specialPhotoScene.timer = 0;
    }
  } else if(specialPhotoScene.phase === 'yesWalk'){
    specialPhotoScene.message = 'She said yes!';
    players.him.dir = 'right';
    const herDone = moveSpecialToward(players.her,{x:specialMemoryTogether.x+14,y:specialMemoryTogether.y,dir:'left'},2.0);
    moveSpecialToward(players.him,{x:specialMemoryTogether.x-2,y:specialMemoryTogether.y,dir:'right'},1.4);
    if(herDone || specialPhotoScene.timer > 90){
      specialPhotoScene.phase = 'hold';
      specialPhotoScene.timer = 0;
      players.him.x = specialMemoryTogether.x - 2;
      players.her.x = specialMemoryTogether.x + 10;
      players.him.y = specialMemoryTogether.y;
      players.her.y = specialMemoryTogether.y;
      players.him.dir = 'right';
      players.her.dir = 'left';
    }
  } else if(specialPhotoScene.phase === 'hold'){
    specialPhotoScene.message = 'Hug... then kiss ❤️';
    players.him.x = specialMemoryTogether.x - 2;
    players.her.x = specialMemoryTogether.x + 10;
    players.him.y = specialMemoryTogether.y;
    players.her.y = specialMemoryTogether.y;
    players.him.dir = 'right';
    players.her.dir = 'left';
    players.him.frame = 0;
    players.her.frame = 0;
    if(specialPhotoScene.timer > 140){
      specialPhotoScene.phase = 'print';
      specialPhotoScene.timer = 0;
      specialPhotoScene.flash = 20;
      photoStrip = {poses:['bubbles','question','yes','kiss'],y:-160,show:true};
    }
  } else if(specialPhotoScene.phase === 'print'){
    specialPhotoScene.message = 'Printing the special photo strip...';
    if(photoStrip) photoStrip.y = Math.min(122,photoStrip.y + 4);
    if(specialPhotoScene.timer > 155){
      finishSpecialPhotoScene();
      return;
    }
  }

  if(['bubbles','ask','yesWalk','hold'].includes(specialPhotoScene.phase) && specialPhotoScene.timer % 4 === 0){
    specialPhotoBubbles.push({x:bubbleX+Math.random()*18,y:bubbleY,vx:(Math.random()-.5)*.65,vy:-.75-Math.random()*.7,life:105,size:3+Math.random()*5});
  }

  if(['yesWalk','hold'].includes(specialPhotoScene.phase) && specialPhotoScene.timer % 16 === 0){
    specialPhotoHearts.push({x:specialMemoryTogether.x+5,y:specialMemoryTogether.y-55,life:72,size:4});
  }

  if(specialPhotoScene.flash > 0) specialPhotoScene.flash--;

  specialPhotoBubbles = specialPhotoBubbles.filter(b => { b.life--; b.x += b.vx; b.y += b.vy; return b.life > 0; });
  specialPhotoHearts = specialPhotoHearts.filter(h => { h.life--; h.y -= .45; return h.life > 0; });
}

const originalSpecialPhotoUpdate = update;
update = function(){
  const starNow = specialStarPressed();

  if(specialPhotoScene){
    updateSpecialPhotoScene();
    const prompt = document.getElementById('prompt');

    // Important: updateSpecialPhotoScene can finish and set specialPhotoScene to null.
    // Do not read specialPhotoScene.message after that or the game loop crashes/freezes.
    if(specialPhotoScene){
      prompt.style.display = 'block';
      prompt.textContent = specialPhotoScene.message;
    } else {
      prompt.style.display = 'none';
    }

    specialPhotoLastStar = starNow;
    return;
  }

  originalSpecialPhotoUpdate();

  if(specialPhotoEndingStripTimer > 0){
    specialPhotoEndingStripTimer--;
    if(specialPhotoEndingStripTimer <= 0){
      photoStrip = null;
    }
  }

  if(starNow && !specialPhotoLastStar && shoppingAction && shoppingAction.type === 'photo'){
    startSpecialPhotoScene();
  }

  if(shoppingAction && shoppingAction.type === 'photo'){
    const prompt = document.getElementById('prompt');
    prompt.style.display = 'block';
    prompt.textContent = 'Press * for the special memory';
  }

  specialPhotoLastStar = starNow;
};

function drawSpecialBubbleMachine(){
  if(!specialPhotoScene) return;
  const x = specialMemoryLeft.x - 22 - camera.x;
  const y = specialMemoryLeft.y + 4 - camera.y;
  ctx.save();
  ctx.fillStyle = '#1f5c8f';
  ctx.fillRect(x,y,13,18);
  ctx.fillStyle = '#54b7ff';
  ctx.fillRect(x+3,y+3,7,5);
  ctx.fillStyle = '#143a5c';
  ctx.fillRect(x+3,y+13,7,3);
  ctx.restore();
}

function drawSpecialBubbles(){
  specialPhotoBubbles.forEach(b => {
    ctx.save();
    ctx.globalAlpha = Math.max(0,b.life/105)*.75;
    ctx.strokeStyle = '#9ee8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.x-camera.x,b.y-camera.y,b.size,0,Math.PI*2);
    ctx.stroke();
    ctx.restore();
  });
}

function drawSpecialHearts(){
  specialPhotoHearts.forEach(h => {
    ctx.save();
    ctx.globalAlpha = Math.max(0,h.life/72);
    ctx.shadowColor = '#ff7ac8';
    ctx.shadowBlur = 9;
    drawPixelHeart(h.x-camera.x,h.y-camera.y,h.size);
    ctx.restore();
  });
}

function drawSpecialSpeech(){
  if(!specialPhotoScene || specialPhotoScene.phase !== 'ask') return;
  const x = specialMemoryLeft.x + 8 - camera.x;
  const y = specialMemoryLeft.y - 72 - camera.y;
  ctx.save();
  ctx.fillStyle = '#fff7ef';
  ctx.strokeStyle = '#241820';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x,y,112,42,10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#241820';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Will you be',x+56,y+16);
  ctx.fillText('my girlfriend?',x+56,y+30);
  ctx.restore();
}

function drawYesSpeech(){
  if(!specialPhotoScene || specialPhotoScene.phase !== 'yesWalk') return;
  const x = players.her.x - camera.x + 8;
  const y = players.her.y - camera.y - 72;
  ctx.save();
  ctx.fillStyle = '#fff7ef';
  ctx.strokeStyle = '#241820';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x,y,48,28,9);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#241820';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Yes!',x+24,y+18);
  ctx.restore();
}

function drawSpecialKneelDetail(){
  if(!specialPhotoScene || specialPhotoScene.phase !== 'ask') return;
  const x = players.him.x - camera.x;
  const y = players.him.y - camera.y - 20;
  ctx.save();
  ctx.fillStyle = '#241820';
  ctx.fillRect(x-13,y+42,17,8);
  ctx.fillStyle = '#ff8fbd';
  ctx.fillRect(x+17,y+18,7,7);
  drawPixelHeart(x+24,y+22,2);
  ctx.restore();
}

const originalSpecialPhotoDrawDebugZones = drawDebugZones;
drawDebugZones = function(){
  originalSpecialPhotoDrawDebugZones();
  if(!debugMode) return;
  ctx.save();
  drawDebugRect(specialMemorySpot,'rgba(120,220,255,0.24)');
  drawDebugText('Special Memory Spot',specialMemorySpot.x,specialMemorySpot.y);
  ctx.restore();
};

const originalSpecialPhotoDraw = draw;
draw = function(){
  originalSpecialPhotoDraw();
  if(!specialPhotoScene) return;

  drawSpecialBubbleMachine();
  drawSpecialBubbles();
  drawSpecialKneelDetail();
  drawSpecialSpeech();
  drawYesSpeech();
  drawSpecialHearts();

  if(specialPhotoScene.flash > 0){
    ctx.save();
    ctx.globalAlpha = specialPhotoScene.flash / 20;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.restore();
  }
};
