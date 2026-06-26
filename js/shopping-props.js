// Visual props for the Shopping Center.
// Draws pixel props over the map without changing the background image.

function drawPhotoBoothProp(){
  const b = photoBoothBox;
  const x = b.x - camera.x;
  const y = b.y - camera.y;
  const flashBlink = Math.sin(heartTimer / 45) > .92;

  ctx.save();

  // Shadow/base
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.fillRect(x-5,y+b.h-4,b.w+10,8);

  // Booth body
  ctx.fillStyle = '#5c1f38';
  ctx.fillRect(x-7,y-8,b.w+14,b.h+13);
  ctx.fillStyle = '#b83266';
  ctx.fillRect(x-3,y-4,b.w+6,b.h+5);

  // Photo sign
  ctx.fillStyle = '#241820';
  ctx.fillRect(x-11,y-25,b.w+22,18);
  ctx.fillStyle = '#ffe18b';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PHOTO',x+b.w/2,y-12);

  // Camera flash box
  ctx.fillStyle = flashBlink ? '#ffffff' : '#ffd1e8';
  ctx.fillRect(x+b.w/2-7,y-38,14,10);
  ctx.fillStyle = '#241820';
  ctx.fillRect(x+b.w/2-3,y-35,6,4);

  // Curtain stripes
  ctx.fillStyle = '#7b1838';
  ctx.fillRect(x+6,y+8,b.w-12,b.h-14);
  ctx.fillStyle = '#d94b82';
  for(let i=0;i<5;i++) ctx.fillRect(x+9+i*10,y+8,4,b.h-14);

  // Little heart decal
  drawPixelHeart(x+b.w-13,y+10,2);

  ctx.restore();
}

function drawIceCreamShopProp(){
  const b = iceCreamBox;
  const x = b.x - camera.x;
  const y = b.y - camera.y;
  const bob = Math.sin(heartTimer / 28);

  ctx.save();

  // Shadow/base
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.fillRect(x-5,y+b.h-2,b.w+10,7);

  // Counter
  ctx.fillStyle = '#7b4a2a';
  ctx.fillRect(x-8,y+22,b.w+16,28);
  ctx.fillStyle = '#d99a51';
  ctx.fillRect(x-5,y+19,b.w+10,7);

  // Pastel awning
  ctx.fillStyle = '#fff1c8';
  ctx.fillRect(x-10,y+2,b.w+20,18);
  ctx.fillStyle = '#ff8fbd';
  for(let i=0;i<6;i++) ctx.fillRect(x-8+i*11,y+2,5,18);
  ctx.fillStyle = '#8ff0c8';
  for(let i=0;i<5;i++) ctx.fillRect(x-2+i*12,y+2,5,18);

  // Cone sign
  const sx = x+b.w/2;
  const sy = y-18 + bob;
  ctx.fillStyle = '#d89a54';
  ctx.beginPath();
  ctx.moveTo(sx-9,sy+15);
  ctx.lineTo(sx+9,sy+15);
  ctx.lineTo(sx,sy+39);
  ctx.fill();
  ctx.fillStyle = '#ff8fbd';
  ctx.fillRect(sx-12,sy+4,24,12);
  ctx.fillStyle = '#fff1c8';
  ctx.fillRect(sx-8,sy-4,16,10);
  ctx.fillStyle = '#8bd2ff';
  ctx.fillRect(sx-4,sy-10,8,8);

  // Tiny menu board
  ctx.fillStyle = '#241820';
  ctx.fillRect(x+b.w-16,y+27,14,16);
  ctx.fillStyle = '#ffe18b';
  ctx.fillRect(x+b.w-13,y+31,8,2);
  ctx.fillRect(x+b.w-13,y+36,8,2);

  ctx.restore();
}

const originalPropsDraw = draw;
draw = function(){
  camera = getCamera();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#061018';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(map,-camera.x,-camera.y);

  drawPhotoBoothProp();
  drawIceCreamShopProp();
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
