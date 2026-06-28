// Visual walkway connectors between cave maps.
// These draw stone/concrete path pieces OVER the cave maps so the walkspaces connect better.
// If you want to tweak them, edit CAVE_PATH_CONNECTORS below.

const CAVE_PATH_CONNECTORS = [
  // Cave Entrance Right Side -> Glowworm Grotto Left Side
  {x:1176, y:424, w:59, h:210},

  // Crystal Caverns Right Side -> Underground River Left Side
  {x:3571, y:347, w:82, h:306},

  // Underground River Right Side -> Geodes and Veins Left Side
  {x:4761, y:372, w:84, h:284},

  // Hidden Garden Right Side -> Ice Cavern Left Side
  {x:7161, y:445, w:86, h:194},

  // Ice Cavern Right Side -> Underground Lake Left Side
  {x:8344, y:343, w:129, h:250},
];

function drawStoneConnector(r){
  ctx.save();

  const x = r.x - camera.x;
  const y = r.y - camera.y;

  // Main stone/concrete base.
  const grad = ctx.createLinearGradient(x,y,x,y+r.h);
  grad.addColorStop(0,'rgba(155,148,132,.82)');
  grad.addColorStop(.5,'rgba(118,112,101,.86)');
  grad.addColorStop(1,'rgba(82,78,73,.78)');
  ctx.fillStyle = grad;
  ctx.fillRect(x,y,r.w,r.h);

  // Dark outline to make it sit in the cave.
  ctx.strokeStyle = 'rgba(28,25,24,.82)';
  ctx.lineWidth = 4;
  ctx.strokeRect(x,y,r.w,r.h);

  // Small tile cracks / texture.
  ctx.globalAlpha = .32;
  ctx.strokeStyle = '#ded6bd';
  ctx.lineWidth = 1;
  for(let yy=18; yy<r.h; yy+=26){
    ctx.beginPath();
    ctx.moveTo(x+4,y+yy);
    ctx.lineTo(x+r.w-4,y+yy+Math.sin((r.x+yy)*.05)*4);
    ctx.stroke();
  }
  for(let xx=14; xx<r.w; xx+=31){
    ctx.beginPath();
    ctx.moveTo(x+xx,y+5);
    ctx.lineTo(x+xx+Math.sin((r.y+xx)*.04)*5,y+r.h-5);
    ctx.stroke();
  }

  // Edge shadow/feather so it blends into the PNG better.
  ctx.globalAlpha = .22;
  ctx.fillStyle = '#000';
  ctx.fillRect(x,y,5,r.h);
  ctx.fillRect(x+r.w-5,y,5,r.h);
  ctx.fillRect(x,y,r.w,5);
  ctx.fillRect(x,y+r.h-5,r.w,5);

  ctx.restore();
}

function drawCavePathConnectors(){
  if(mode !== 'cave') return;
  CAVE_PATH_CONNECTORS.forEach(r => {
    if(r.x - camera.x > canvas.width + 80 || r.x + r.w - camera.x < -80) return;
    drawStoneConnector(r);
  });
}

const drawBeforeCavePathConnectors = draw;
draw = function(){
  drawBeforeCavePathConnectors();
  drawCavePathConnectors();
};
