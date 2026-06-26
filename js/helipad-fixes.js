const waterBox = {x:1331, y:633, w:113, h:80};
const rotorBox = {x:950, y:179, w:296, h:95};

const waterSpot = spots.find(s => s.action === 'waterfall');
if(waterSpot){
  waterSpot.x = Math.round(waterBox.x + waterBox.w / 2);
  waterSpot.y = Math.round(waterBox.y + waterBox.h / 2);
  waterSpot.r = 85;
}

const flySpot = spots.find(s => s.action === 'takeoff');
if(flySpot){
  flySpot.x = 980;
  flySpot.y = 360;
  flySpot.r = 105;
}

startHelipadAction = function(action){
  helipadAction = {type:action, phase:'moving', timer:0};

  if(action === 'takeoff'){
    setTarget(players.her,925,405,'right');
    setTarget(players.him,875,405,'right');
  }

  if(action === 'bench'){
    setTarget(players.her,333,424,'down');
    setTarget(players.him,383,424,'down');
  }

  if(action === 'waterfall'){
    setTarget(players.her,waterBox.x + 30,waterBox.y + 66,'right');
    setTarget(players.him,waterBox.x + 83,waterBox.y + 66,'left');
  }
};

spawnWind = function(){
  helipadParticles.push({
    type:'wind',
    x:rotorBox.x + Math.random() * rotorBox.w,
    y:rotorBox.y + Math.random() * rotorBox.h,
    life:55,
    vx:-1.4 - Math.random() * 1.4,
    vy:(Math.random() - .5) * .45,
    size:8 + Math.random() * 18
  });
};

spawnSplash = function(fromLeft){
  const baseX = fromLeft ? players.her.x + 16 : players.him.x - 16;
  const baseY = waterBox.y + 35 + Math.random() * 18;

  for(let i=0;i<11;i++){
    helipadParticles.push({
      type:'water',
      x:baseX,
      y:baseY,
      life:38 + Math.random() * 20,
      vx:(fromLeft ? 1 : -1) * (1.5 + Math.random() * 2.4),
      vy:-1.7 - Math.random() * 2.1,
      size:2 + Math.random() * 3
    });
  }
};

drawHelicopterBlades = function(){
  const cx = Math.round(rotorBox.x + rotorBox.w / 2) - camera.x;
  const cy = Math.round(rotorBox.y + rotorBox.h / 2) - camera.y;
  const len = rotorBox.w / 2;

  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(helicopterBladeSpin);
  ctx.globalAlpha = .24;
  ctx.strokeStyle = '#d9efff';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-len,0);
  ctx.lineTo(len,0);
  ctx.moveTo(0,-rotorBox.h * .55);
  ctx.lineTo(0,rotorBox.h * .55);
  ctx.stroke();
  ctx.globalAlpha = .12;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.moveTo(-len * .72,0);
  ctx.lineTo(len * .72,0);
  ctx.stroke();
  ctx.restore();
};
