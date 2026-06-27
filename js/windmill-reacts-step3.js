// Windmill of Wishes - Step 3
// The room reacts as wishes are collected: gears speed up, window blades spin faster, light warms, and the room glows more.

function wishProgress(){
  if(!wishGame) return 0;
  return Math.max(0,Math.min(1,wishGame.collected / wishGoal));
}

function easedWishProgress(){
  const p = wishProgress();
  return p*p*(3 - 2*p);
}

// Override the Step 1 gears so they react to the wish counter.
drawGears = function(){
  const p = easedWishProgress();
  const speed = 1 + p * 3.4;

  drawGear(240,248,54,16,heartTimer/95 * speed);
  drawGear(1038,248,54,16,-heartTimer/95 * speed);
  drawGear(295,560,44,14,-heartTimer/80 * speed);
  drawGear(984,560,44,14,heartTimer/80 * speed);

  // Tiny golden glow on the gears as they wake up.
  if(p > .05){
    ctx.save();
    ctx.globalAlpha = .18 * p;
    ctx.fillStyle = '#ffd98a';
    [
      [240,248,66],
      [1038,248,66],
      [295,560,54],
      [984,560,54]
    ].forEach(([x,y,r]) => {
      ctx.beginPath();
      ctx.arc(x-camera.x,y-camera.y,r,0,Math.PI*2);
      ctx.fill();
    });
    ctx.restore();
  }
};

// Override the window so the blade shadow outside gets faster too.
drawWindow = function(){
  const p = easedWishProgress();
  const x = 485, y = 82, w = 310, h = 148;
  ctx.save();
  ctx.fillStyle = '#1a304f';
  ctx.fillRect(x,y,w,h);

  const grad = ctx.createLinearGradient(0,y,0,y+h);
  grad.addColorStop(0,'#5db8ff');
  grad.addColorStop(1,p > .65 ? '#ffe5a8' : '#ffd28b');
  ctx.fillStyle = grad;
  ctx.fillRect(x+10,y+10,w-20,h-20);

  clouds.forEach(c => {
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    ctx.fillRect(c.x,y+38,c.w,12);
    ctx.fillRect(c.x+10,y+28,c.w*.45,12);
    ctx.fillRect(c.x+24,y+33,c.w*.55,10);
  });

  // Faster blade shadow as wishes are collected.
  ctx.save();
  ctx.translate(x+w/2,y+h/2);
  ctx.rotate(heartTimer/95 * (1 + p*3.6));
  ctx.fillStyle = `rgba(82,54,33,${.22 + p*.08})`;
  ctx.fillRect(-8,-80,16,160);
  ctx.fillRect(-80,-8,160,16);
  ctx.restore();

  // Warm glow in the window when the windmill wakes up.
  if(p > .05){
    ctx.globalAlpha = p * .18;
    ctx.fillStyle = '#fff1a8';
    ctx.fillRect(x+10,y+10,w-20,h-20);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = '#5a321d';
  ctx.fillRect(x,y,w,10);
  ctx.fillRect(x,y+h-10,w,10);
  ctx.fillRect(x,y,10,h);
  ctx.fillRect(x+w-10,y,10,h);
  ctx.fillRect(x+w/2-5,y,10,h);
  ctx.fillRect(x,y+h/2-5,w,10);
  ctx.restore();
};

function drawWindmillPowerGlow(){
  if(!wishGame) return;
  const p = easedWishProgress();
  if(p <= 0) return;

  ctx.save();

  // Golden warmth slowly fills the room.
  ctx.globalAlpha = .10 * p;
  ctx.fillStyle = '#ffd98a';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // A stronger beam from the window as the gears wake up.
  ctx.globalAlpha = .22 * p;
  ctx.fillStyle = '#fff1a8';
  ctx.beginPath();
  ctx.moveTo(555-camera.x,210-camera.y);
  ctx.lineTo(735-camera.x,210-camera.y);
  ctx.lineTo(900-camera.x,760-camera.y);
  ctx.lineTo(360-camera.x,760-camera.y);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

const originalWindmillReactDraw = draw;
draw = function(){
  originalWindmillReactDraw();
  drawWindmillPowerGlow();
};

const originalWindmillReactUpdate = update;
update = function(){
  originalWindmillReactUpdate();

  // Milestone messages for the room coming alive. No screen flashing.
  if(wishGame && !wishGame.finished){
    if([10,20,30,40].includes(wishGame.collected) && wishMessageTimer <= 0){
      wishGame.message = 'The windmill is waking up...';
      wishMessageTimer = 95;
    }
    if(wishGame.collected >= 50 && wishMessageTimer <= 0){
      wishGame.message = 'Almost there...';
      wishMessageTimer = 95;
    }
  }
};
