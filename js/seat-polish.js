const seatBox = {x:231, y:299, w:110, h:89};

const seatSpot = spots.find(s => s.action === 'bench');
if(seatSpot){
  seatSpot.x = Math.round(seatBox.x + seatBox.w / 2);
  seatSpot.y = Math.round(seatBox.y + seatBox.h / 2);
  seatSpot.r = 78;
}

const prevStartAction = startHelipadAction;
startHelipadAction = function(action){
  if(action !== 'bench'){
    prevStartAction(action);
    return;
  }

  helipadAction = {type:action, phase:'moving', timer:0};
  setTarget(players.her,253,359,'down');
  setTarget(players.him,319,359,'down');
};

drawBenchSitOverlay = function(p){
  if(!helipadAction || helipadAction.type !== 'bench' || helipadAction.phase !== 'active') return false;

  const sw = 96;
  const sh = 128;
  const row = p.rows[p.dir];
  const dw = Math.round(sw * p.scale);
  const dh = Math.round(sh * p.scale);
  const x = Math.round(p.x - camera.x - dw / 2);
  const y = Math.round(p.y - camera.y - dh + 12);

  ctx.drawImage(p.img, p.frame * sw, row * sh, sw, sh, x, y, dw, dh);
  return true;
};
