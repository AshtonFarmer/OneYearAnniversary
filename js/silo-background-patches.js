// Cave background patches
// These fill the transparent/empty edges between uploaded cave maps so the page background does not show through.
// They are drawn AFTER the maps, but BEFORE the connector paths/debug tools.

const CAVE_BACKGROUND_PATCHES = [
  {x:1273, y:684, w:1126, h:70, type:'bottom'},
  {x:2402, y:683, w:1196, h:69, type:'bottom'},
  {x:3676, y:6, w:1124, h:98, type:'top'},
  {x:4879, y:699, w:1117, h:56, type:'bottom'},
  {x:6005, y:700, w:1196, h:54, type:'bottom'},
  {x:8480, y:7, w:1195, h:95, type:'top'},
];

function drawCaveRockPatch(p){
  const sx = p.x - camera.x;
  const sy = p.y - camera.y;

  ctx.save();

  // Base color changes a little depending on top/bottom and section.
  const g = ctx.createLinearGradient(sx,sy,sx,sy+p.h);
  if(p.type === 'top'){
    g.addColorStop(0,'rgba(5,8,12,.96)');
    g.addColorStop(.55,'rgba(15,22,27,.94)');
    g.addColorStop(1,'rgba(27,34,34,.92)');
  } else {
    g.addColorStop(0,'rgba(22,34,34,.92)');
    g.addColorStop(.55,'rgba(11,23,27,.94)');
    g.addColorStop(1,'rgba(4,10,14,.98)');
  }
  ctx.fillStyle = g;
  ctx.fillRect(sx,sy,p.w,p.h);

  // Small fake rock/moss texture so it does not look like a flat rectangle.
  const seed = Math.floor(p.x + p.y);
  for(let i=0;i<170;i++){
    const rx = sx + ((i*47 + seed*3) % Math.max(1,p.w));
    const ry = sy + ((i*23 + seed*7) % Math.max(1,p.h));
    const size = 2 + ((i + seed) % 5);
    const moss = i % 5 === 0;
    ctx.globalAlpha = moss ? .18 : .13;
    ctx.fillStyle = moss ? '#2f5a38' : (i % 2 ? '#263337' : '#10181c');
    ctx.fillRect(rx,ry,size,size);
  }

  // Feather the edge back into the art.
  ctx.globalAlpha = .35;
  if(p.type === 'top'){
    const f = ctx.createLinearGradient(sx,sy+p.h-28,sx,sy+p.h);
    f.addColorStop(0,'rgba(0,0,0,0)');
    f.addColorStop(1,'rgba(0,0,0,.55)');
    ctx.fillStyle = f;
    ctx.fillRect(sx,sy+p.h-30,p.w,30);
  } else {
    const f = ctx.createLinearGradient(sx,sy,sx,sy+32);
    f.addColorStop(0,'rgba(0,0,0,.35)');
    f.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = f;
    ctx.fillRect(sx,sy,p.w,34);
  }

  ctx.restore();
}

function drawCaveBackgroundPatches(){
  if(mode !== 'cave') return;
  CAVE_BACKGROUND_PATCHES.forEach(p => {
    if(p.x - camera.x > canvas.width + 80 || p.x + p.w - camera.x < -80) return;
    drawCaveRockPatch(p);
  });
}

const drawBeforeCaveBackgroundPatches = draw;
draw = function(){
  drawBeforeCaveBackgroundPatches();
  drawCaveBackgroundPatches();
};
