// Bench cuddle slide polish. This file loads after helipad.js.

const benchSlideStart = {
  her:{x:253,y:359},
  him:{x:319,y:359}
};

const benchSlideEnd = {
  her:{x:274,y:359},
  him:{x:298,y:359}
};

const originalStartAction = startAction;
startAction = function(type){
  originalStartAction(type);

  if(type === 'bench'){
    setTarget(players.her,benchSlideStart.her.x,benchSlideStart.her.y,'down');
    setTarget(players.him,benchSlideStart.him.x,benchSlideStart.him.y,'down');
  }
};

const originalUpdateAction = updateAction;
updateAction = function(){
  originalUpdateAction();

  if(!currentAction || currentAction.type !== 'bench') return;

  if(currentAction.phase === 'active'){
    const t = Math.min(1,currentAction.timer / 80);
    const smooth = t * t * (3 - 2 * t);

    players.her.x = benchSlideStart.her.x + (benchSlideEnd.her.x - benchSlideStart.her.x) * smooth;
    players.him.x = benchSlideStart.him.x + (benchSlideEnd.him.x - benchSlideStart.him.x) * smooth;
    players.her.y = benchSlideStart.her.y;
    players.him.y = benchSlideStart.him.y;
    players.her.dir = 'down';
    players.him.dir = 'down';
    players.her.frame = 0;
    players.him.frame = 0;
  }
};

const originalDrawSprite = drawSprite;
drawSprite = function(p){
  if(currentAction && currentAction.type === 'bench' && currentAction.phase === 'active'){
    const sw = 96;
    const sh = 128;
    const row = p.rows[p.dir];
    const dw = Math.round(sw * p.scale);
    const dh = Math.round(sh * p.scale);
    const breathing = Math.sin(heartTimer / 28) * .5;
    let drawX = Math.round(p.x - camera.x - dw / 2);
    let drawY = Math.round(p.y - camera.y - dh + 7 + breathing);
    let drawW = dw;

    if(p === players.him && p.dir === 'right'){
      drawX -= 4;
      drawW += 8;
    }

    ctx.drawImage(p.img,p.frame*sw,row*sh,sw,sh,drawX,drawY,drawW,dh);
    return;
  }

  originalDrawSprite(p);
};
