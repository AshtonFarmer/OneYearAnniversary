// Fixes the bed cuddle pose so the characters face each other instead of rotating sideways.
// Loaded after cabin.js and overrides only the bed/cuddle drawing behavior.

updateBedAction = function(){
  if(!bothPlayersOnBed()){
    bedJumping = false;
    bedLayDown = false;
    return;
  }

  if(bedJumping){
    const done = performance.now() - bedJumpStart >= bedJumpDuration;

    if(done){
      bedJumping = false;
      bedLandingTimer = 10;
      spawnHeart((players.her.x + players.him.x) / 2, Math.min(players.her.y,players.him.y) - 78);
    }
  }

  if(spaceHeld && !bedJumping && !bedLayDown && !actionState){
    const heldFor = performance.now() - spaceHoldStart;

    if(heldFor > 1200){
      bedLayDown = true;

      // Clean cuddle pose on the bed: close together and facing each other.
      players.her.x = 1225;
      players.her.y = 252;
      players.him.x = 1268;
      players.him.y = 252;

      players.her.dir = 'right';
      players.him.dir = 'left';
      players.her.frame = 0;
      players.him.frame = 0;

      spawnHeart((players.her.x + players.him.x) / 2, Math.min(players.her.y,players.him.y) - 70);
    }
  }

  if(bedLandingTimer > 0){
    bedLandingTimer--;
  }
};

drawSprite = function(p){
  const sw = 96;
  const sh = 128;
  const row = p.rows[p.dir];

  const dw = Math.round(sw * p.scale);
  const dh = Math.round(sh * p.scale);

  let drawX = Math.round(p.x - camera.x - dw / 2);
  let drawY = Math.round(p.y - camera.y - dh + 10);
  let drawW = dw;
  let drawH = dh;

  if(p === players.him && p.dir === 'right'){
    drawX -= 4;
    drawW += 8;
  }

  const jumpOffset = getBedJumpOffset();

  if(bedJumping){
    drawY += jumpOffset;

    if(jumpOffset < -18){
      drawY -= 4;
      drawH += 8;
    }
  }

  if(bedLandingTimer > 0){
    drawY += 4;
    drawH -= 5;
    drawW += 5;
    drawX -= 2;
  }

  if(actionState && actionState.phase === 'active'){
    const t = actionState.timer;

    if(actionState.type === 'sit'){
      drawY += Math.sin(t / 10) * 2;
    }

    if(actionState.type === 'coffee' && t % 80 > 40){
      drawY -= 3;
    }

    if(actionState.type === 'fireplace'){
      drawW += Math.sin(t / 12) * 2;
    }
  }

  if(bedLayDown){
    // No sideways rotation anymore. Keep them upright, facing each other,
    // then tuck their lower bodies under the fake blanket layer.
    drawY += 8;
    drawW = Math.round(drawW * .92);
    drawH = Math.round(drawH * .92);
    drawX = Math.round(p.x - camera.x - drawW / 2);

    ctx.drawImage(p.img, p.frame * sw, row * sh, sw, sh, drawX, drawY, drawW, drawH);
    return;
  }

  ctx.drawImage(p.img, p.frame * sw, row * sh, sw, sh, drawX, drawY, drawW, drawH);
};

function drawBedCuddleBlanket(){
  if(!bedLayDown) return;

  const x = 1160 - camera.x;
  const y = 140 - camera.y;

  ctx.save();

  // Fake a blanket layer without touching the map art or collision borders.
  ctx.globalAlpha = .72;
  ctx.fillStyle = '#8f3f55';
  ctx.fillRect(x + 38, y + 94, 103, 37);

  ctx.globalAlpha = .38 + Math.sin(heartTimer / 18) * .08;
  ctx.fillStyle = '#ff9acb';
  ctx.fillRect(x + 44, y + 99, 91, 5);

  ctx.globalAlpha = .24;
  ctx.fillStyle = '#2b1018';
  ctx.fillRect(x + 40, y + 127, 99, 5);

  ctx.restore();
}

draw = function(){
  camera = getCamera();

  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = '#061018';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.drawImage(map,-camera.x,-camera.y);

  drawBedSquish();
  drawActionEffects();

  drawDebugZones();

  [players.her,players.him]
    .sort((a,b) => a.y - b.y)
    .forEach(drawSprite);

  drawBedCuddleBlanket();
  drawCoupleHeart();
  drawHeartParticles();
};
