// Special photo booth memory scene.
// While the normal photo booth is running, press * to trigger the special moment.

let specialPhotoScene = null;
let specialPhotoLastStar = false;
let specialPhotoBubbles = [];
let specialPhotoHearts = [];

function specialStarPressed(){
  return !!keys['*'] || !!keys['8'];
}

function startSpecialPhotoScene(){
  const c = boxCenter(photoBoothBox);
  specialPhotoScene = {timer:0,phase:'start',message:'',flash:0};
  shoppingAction = null;
  photoStrip = null;
  photoFlash = 0;

  players.him.x = c.x - 12;
  players.him.y = c.y + 36;
  players.him.dir = 'right';
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

  const c = boxCenter(photoBoothBox);
  players.him.x = c.x - 12;
  players.her.x = c.x + 18;
  players.him.y = c.y + 36;
  players.her.y = c.y + 36;

  if(specialPhotoScene.timer < 70){
    specialPhotoScene.phase = 'start';
    specialPhotoScene.message = 'Setting up the special moment...';
  } else if(specialPhotoScene.timer < 155){
    specialPhotoScene.phase = 'bubbles';
    specialPhotoScene.message = 'The bubble machine turns on...';
  } else if(specialPhotoScene.timer < 285){
    specialPhotoScene.phase = 'ask';
    specialPhotoScene.message = 'Will you be my girlfriend?';
  } else if(specialPhotoScene.timer < 390){
    specialPhotoScene.phase = 'yes';
    specialPhotoScene.message = 'She said yes!';
  } else if(specialPhotoScene.timer < 500){
    specialPhotoScene.phase = 'together';
    specialPhotoScene.message = 'A perfect little memory ❤️';
    players.him.x = c.x - 4;
    players.her.x = c.x + 7;
  } else if(specialPhotoScene.timer < 620){
    specialPhotoScene.phase = 'print';
    specialPhotoScene.message = 'Printing the special photo strip...';
    if(!photoStrip){
      photoStrip = {poses:['bubbles','question','yes','heart'],y:-160,show:true};
      specialPhotoScene.flash = 20;
    }
    photoStrip.y = Math.min(122,photoStrip.y + 4);
  } else {
    specialPhotoScene = null;
    shoppingCooldown = 35;
    return;
  }

  if(['bubbles','ask','yes','together'].includes(specialPhotoScene.phase) && specialPhotoScene.timer % 4 === 0){
    specialPhotoBubbles.push({x:c.x-23+Math.random()*18,y:c.y+42,vx:(Math.random()-.5)*.55,vy:-.75-Math.random()*.6,life:95,size:3+Math.random()*5});
  }

  if(['yes','together'].includes(specialPhotoScene.phase) && specialPhotoScene.timer % 16 === 0){
    specialPhotoHearts.push({x:c.x+4,y:c.y-10,life:72,size:4});
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
    prompt.style.display = 'block';
    prompt.textContent = specialPhotoScene.message;
    specialPhotoLastStar = starNow;
    return;
  }

  originalSpecialPhotoUpdate();

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
  const c = boxCenter(photoBoothBox);
  const x = c.x - 33 - camera.x;
  const y = c.y + 22 - camera.y;
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
    ctx.globalAlpha = Math.max(0,b.life/95)*.75;
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
  const c = boxCenter(photoBoothBox);
  const x = c.x - 12 - camera.x;
  const y = c.y - 58 - camera.y;
  ctx.save();
  ctx.fillStyle = '#fff7ef';
  ctx.strokeStyle = '#241820';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x,y,104,42,10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#241820';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Will you be',x+52,y+16);
  ctx.fillText('my girlfriend?',x+52,y+30);
  ctx.restore();
}

function drawSpecialKneelDetail(){
  if(!specialPhotoScene || specialPhotoScene.phase !== 'ask') return;
  const c = boxCenter(photoBoothBox);
  const x = c.x - 13 - camera.x;
  const y = c.y + 18 - camera.y;
  ctx.save();
  ctx.fillStyle = '#241820';
  ctx.fillRect(x-10,y+24,17,8);
  ctx.fillStyle = '#ff8fbd';
  ctx.fillRect(x+16,y+5,7,7);
  drawPixelHeart(x+23,y+9,2);
  ctx.restore();
}

const originalSpecialPhotoDraw = draw;
draw = function(){
  originalSpecialPhotoDraw();
  if(!specialPhotoScene) return;

  drawSpecialBubbleMachine();
  drawSpecialBubbles();
  drawSpecialKneelDetail();
  drawSpecialSpeech();
  drawSpecialHearts();

  if(specialPhotoScene.flash > 0){
    ctx.save();
    ctx.globalAlpha = specialPhotoScene.flash / 20;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.restore();
  }
};
