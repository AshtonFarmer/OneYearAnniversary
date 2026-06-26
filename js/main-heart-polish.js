// Main map heart garden polish.
// This does not change the background image. It draws a softer pixel flower heart on top.

const mainHeartGarden = {
  x:1005,
  y:76,
  w:365,
  h:230
};

function drawTinyFlower(x,y,color){
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(x-2,y,2,2);
  ctx.fillRect(x+2,y,2,2);
  ctx.fillRect(x,y-2,2,2);
  ctx.fillRect(x,y+2,2,2);
  ctx.fillStyle = '#ffe18b';
  ctx.fillRect(x,y,2,2);
  ctx.restore();
}

function drawMainHeartGardenPolish(){
  const h = mainHeartGarden;
  const cx = h.x + h.w/2;
  const cy = h.y + h.h/2 + 8;
  const scale = 7.6;

  ctx.save();

  // Soft dark-green center to hide the rough/jagged middle.
  ctx.globalAlpha = .72;
  ctx.fillStyle = '#23451f';
  for(let yy=-11; yy<=10; yy++){
    for(let xx=-14; xx<=14; xx++){
      const nx = xx / 14;
      const ny = yy / 10;
      const v = Math.pow(nx*nx + ny*ny - .55, 3) - nx*nx*ny*ny*ny;
      if(v < 0){
        const px = Math.round(cx + xx*scale - camera.x);
        const py = Math.round(cy + yy*scale - camera.y);
        ctx.fillRect(px,py,8,8);
      }
    }
  }

  // Flower outline heart. Bigger and smoother than the rough map shape.
  ctx.globalAlpha = .95;
  const colors = ['#ff7ac8','#ff9ed7','#d864b0','#f6b4dd','#fff0a8'];
  for(let t=0; t<Math.PI*2; t+=0.085){
    const x = 16 * Math.pow(Math.sin(t),3);
    const y = -(13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t));
    const wobble = Math.sin(t*7 + heartTimer/35) * 2;
    const px = Math.round(cx + (x*scale*.92) - camera.x + wobble);
    const py = Math.round(cy + (y*scale*.72) - camera.y);
    drawTinyFlower(px,py,colors[Math.floor(Math.abs(Math.sin(t*4))*colors.length)%colors.length]);
  }

  // A few flowers inside so it blends into the old garden instead of looking pasted on.
  for(let i=0;i<34;i++){
    const t = i * 2.399;
    const r = 8 + (i % 9) * 1.6;
    const px = Math.round(cx + Math.cos(t)*r*scale*.55 - camera.x);
    const py = Math.round(cy + Math.sin(t)*r*scale*.38 - camera.y);
    drawTinyFlower(px,py,colors[i % colors.length]);
  }

  ctx.restore();
}

const originalMainHeartDraw = draw;
draw = function(){
  camera = getCamera();

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#061018';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.drawImage(map,-camera.x,-camera.y);
  drawMainHeartGardenPolish();

  drawDebugZones();
  drawBoxSelector();

  const arr = [players.her,players.him].sort((a,b) => a.y - b.y);
  arr.forEach(drawSprite);

  drawCoupleHeart();
  drawAchievement();
};
