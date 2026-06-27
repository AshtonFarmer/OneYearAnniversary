// Silo / Cave debug tools + red blockade collision boxes
// Toggle debug with G.
// Click + drag on the canvas to create a rectangle.
// Release the mouse and copy the console line: {x:..., y:..., w:..., h:...}
// Put silo rectangles in SILO_RED_BARRIERS.
// Put cave rectangles in CAVE_RED_BARRIERS.

const SILO_RED_BARRIERS = [
  // Example:
  // {x:100, y:100, w:50, h:80},
];

const CAVE_RED_BARRIERS = [
  // Add your cave blockades here:
  // {x:100, y:100, w:50, h:80},
];

let debugMouse = {x:0,y:0,worldX:0,worldY:0};
let debugDragStart = null;
let debugDragBox = null;

function currentBarrierList(){
  return mode === 'silo' ? SILO_RED_BARRIERS : CAVE_RED_BARRIERS;
}

function pointInsideRect(px,py,r){
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function hitRedBarrier(x,y){
  return currentBarrierList().some(r => pointInsideRect(x,y,r));
}

const baseSolidHitBeforeDebug = solidHit;
solidHit = function(x,y){
  if(baseSolidHitBeforeDebug(x,y)) return true;
  if(hitRedBarrier(x,y)) return true;
  return false;
};

function updateDebugMouse(e){
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  debugMouse.x = (e.clientX - rect.left) * scaleX;
  debugMouse.y = (e.clientY - rect.top) * scaleY;
  debugMouse.worldX = Math.round(debugMouse.x + camera.x);
  debugMouse.worldY = Math.round(debugMouse.y + camera.y);
}

canvas.addEventListener('mousemove', e => {
  updateDebugMouse(e);
  if(debugMode && debugDragStart){
    const x1 = debugDragStart.x;
    const y1 = debugDragStart.y;
    const x2 = debugMouse.worldX;
    const y2 = debugMouse.worldY;
    debugDragBox = {
      x:Math.min(x1,x2),
      y:Math.min(y1,y2),
      w:Math.abs(x2-x1),
      h:Math.abs(y2-y1)
    };
  }
});

canvas.addEventListener('mousedown', e => {
  if(!debugMode) return;
  updateDebugMouse(e);
  debugDragStart = {x:debugMouse.worldX,y:debugMouse.worldY};
  debugDragBox = {x:debugMouse.worldX,y:debugMouse.worldY,w:0,h:0};
});

canvas.addEventListener('mouseup', e => {
  if(!debugMode || !debugDragStart) return;
  updateDebugMouse(e);
  const x1 = debugDragStart.x;
  const y1 = debugDragStart.y;
  const x2 = debugMouse.worldX;
  const y2 = debugMouse.worldY;
  const box = {
    x:Math.min(x1,x2),
    y:Math.min(y1,y2),
    w:Math.abs(x2-x1),
    h:Math.abs(y2-y1)
  };

  if(box.w > 2 && box.h > 2){
    const copyText = `{x:${box.x}, y:${box.y}, w:${box.w}, h:${box.h}},`;
    console.log('COPY THIS:', copyText);
    console.log(mode === 'silo' ? 'Paste into SILO_RED_BARRIERS' : 'Paste into CAVE_RED_BARRIERS');
  }

  debugDragStart = null;
  debugDragBox = null;
});

function drawDebugRect(r,fill,stroke){
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.fillRect(r.x-camera.x,r.y-camera.y,r.w,r.h);
  ctx.strokeRect(r.x-camera.x,r.y-camera.y,r.w,r.h);
  ctx.restore();
}

function drawDebugTools(){
  if(!debugMode) return;

  // Existing red blockades.
  currentBarrierList().forEach(r => drawDebugRect(r,'rgba(255,0,0,.34)','rgba(255,50,50,.95)'));

  // Rectangle currently being dragged.
  if(debugDragBox) drawDebugRect(debugDragBox,'rgba(255,80,0,.28)','rgba(255,180,70,.95)');

  // Player hit points.
  ctx.save();
  ctx.fillStyle = 'rgba(0,255,120,.7)';
  ctx.fillRect(players.her.x-camera.x-3,players.her.y-camera.y-3,6,6);
  ctx.fillRect(players.him.x-camera.x-3,players.him.y-camera.y-3,6,6);
  ctx.restore();

  // Debug info box.
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.72)';
  ctx.fillRect(12,12,455,126);
  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  ctx.strokeRect(12,12,455,126);
  ctx.fillStyle = '#fff1c8';
  ctx.font = '14px monospace';
  ctx.fillText(`DEBUG ON | mode: ${mode}`,24,35);
  ctx.fillText(`mouse world: x:${debugMouse.worldX} y:${debugMouse.worldY}`,24,55);
  ctx.fillText(`her: x:${Math.round(players.her.x)} y:${Math.round(players.her.y)}`,24,75);
  ctx.fillText(`him: x:${Math.round(players.him.x)} y:${Math.round(players.him.y)}`,24,95);
  ctx.fillText(`drag red blockade -> release -> copy from console`,24,115);
  ctx.fillText(`G toggles debug`,310,35);
  ctx.restore();
}

const drawBeforeSiloDebugTools = draw;
draw = function(){
  drawBeforeSiloDebugTools();
  drawDebugTools();
};
