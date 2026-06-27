// Windmill of Wishes - Step 5
// The glowing heart leaves the flower, drifts to the window, and flies into the sky with a petal trail.

let heartFlight = null;
let heartFlightTrail = [];
let finalPetal = null;
let windmillFinalStarted = false;
let windmillFinalFade = 0;
let windmillFinalMessage = '';
let windmillFinalMessageAlpha = 0;
let windmillReturnTimer = 0;

const originalWindmillGetCamera = getCamera;
getCamera = function(){
  if(heartFlight && heartFlight.phase !== 'done'){
    const target = heartFlight.cameraTarget || {x:heartFlight.x,y:heartFlight.y};
    const desiredX = target.x - canvas.width/2;
    const desiredY = target.y - canvas.height/2;

    // Allow a tiny cinematic look outside the room instead of hard-clamping.
    return {
      x:Math.max(-90,Math.min(Math.max(0,WORLD_W-canvas.width)+90,desiredX)),
      y:Math.max(-120,Math.min(Math.max(0,WORLD_H-canvas.height)+120,desiredY))
    };
  }
  return originalWindmillGetCamera();
};

function startHeartFlight(){
  if(windmillFinalStarted) return;
  windmillFinalStarted = true;

  const startX = WORLD_W/2;
  const startY = 388;

  heartFlight = {
    phase:'rise',
    timer:0,
    x:startX,
    y:startY,
    sx:startX,
    sy:startY,
    tx:640,
    ty:145,
    cameraTarget:{x:startX,y:startY},
    size:9,
    alpha:1
  };

  heartFlightTrail = [];
  finalPetal = null;
  windmillFinalFade = 0;
  windmillFinalMessage = '';
  windmillFinalMessageAlpha = 0;
  windmillReturnTimer = 0;

  if(bloomScene){
    bloomScene.message = '';
  }
}

function updateHeartFlight(){
  if(!heartFlight) return;

  heartFlight.timer++;
  heartTimer++;

  if(heartFlight.phase === 'rise'){
    const t = Math.min(1,heartFlight.timer/120);
    const ease = t*t*(3-2*t);
    heartFlight.x = heartFlight.sx + (heartFlight.tx-heartFlight.sx)*ease;
    heartFlight.y = heartFlight.sy + (heartFlight.ty-heartFlight.sy)*ease + Math.sin(heartTimer/16)*4;
    heartFlight.cameraTarget = {x:heartFlight.x,y:heartFlight.y};

    if(heartFlight.timer % 4 === 0) addHeartFlightTrail(heartFlight.x,heartFlight.y);

    if(t >= 1){
      heartFlight.phase = 'pause';
      heartFlight.timer = 0;
    }
  }

  else if(heartFlight.phase === 'pause'){
    heartFlight.x = heartFlight.tx;
    heartFlight.y = heartFlight.ty + Math.sin(heartTimer/18)*3;
    heartFlight.cameraTarget = {x:heartFlight.x,y:heartFlight.y};
    if(heartFlight.timer % 6 === 0) addHeartFlightTrail(heartFlight.x,heartFlight.y);
    if(heartFlight.timer > 75){
      heartFlight.phase = 'fly';
      heartFlight.timer = 0;
      heartFlight.sx = heartFlight.x;
      heartFlight.sy = heartFlight.y;
      heartFlight.tx = 945;
      heartFlight.ty = -85;
    }
  }

  else if(heartFlight.phase === 'fly'){
    const t = Math.min(1,heartFlight.timer/190);
    const ease = 1 - Math.pow(1-t,3);
    const curve = Math.sin(t*Math.PI) * -85;
    heartFlight.x = heartFlight.sx + (heartFlight.tx-heartFlight.sx)*ease;
    heartFlight.y = heartFlight.sy + (heartFlight.ty-heartFlight.sy)*ease + curve;
    heartFlight.cameraTarget = {x:heartFlight.x,y:heartFlight.y+60};
    heartFlight.size = 9 - t*4;
    heartFlight.alpha = 1 - Math.max(0,t-.72)/.28;

    if(heartFlight.timer % 3 === 0) addHeartFlightTrail(heartFlight.x,heartFlight.y);

    if(t >= 1){
      heartFlight.phase = 'petalBack';
      heartFlight.timer = 0;
      finalPetal = {x:650,y:95,vx:-.12,vy:.72,spin:0,life:260};
      windmillFinalMessage = 'Every dream we share becomes part of our future.';
      windmillFinalMessageAlpha = 0;
    }
  }

  else if(heartFlight.phase === 'petalBack'){
    heartFlight.cameraTarget = {x:(players.her.x+players.him.x)/2,y:(players.her.y+players.him.y)/2};
    if(finalPetal){
      finalPetal.x += finalPetal.vx + Math.sin(heartTimer/25)*.45;
      finalPetal.y += finalPetal.vy;
      finalPetal.spin += .035;
      finalPetal.life--;
      if(finalPetal.life <= 0) finalPetal = null;
    }

    windmillFinalMessageAlpha = Math.min(1,heartFlight.timer/55) * Math.min(1,(260-heartFlight.timer)/55);

    if(heartFlight.timer > 260){
      heartFlight.phase = 'thanks';
      heartFlight.timer = 0;
      windmillFinalMessage = 'Thank you for dreaming with me.';
    }
  }

  else if(heartFlight.phase === 'thanks'){
    heartFlight.cameraTarget = {x:(players.her.x+players.him.x)/2,y:(players.her.y+players.him.y)/2};
    windmillFinalMessageAlpha = Math.min(1,heartFlight.timer/55) * Math.min(1,(230-heartFlight.timer)/55);
    if(heartFlight.timer > 230){
      heartFlight.phase = 'fadeWhite';
      heartFlight.timer = 0;
    }
  }

  else if(heartFlight.phase === 'fadeWhite'){
    heartFlight.cameraTarget = {x:(players.her.x+players.him.x)/2,y:(players.her.y+players.him.y)/2};
    windmillFinalFade = Math.min(1,heartFlight.timer/90);
    if(heartFlight.timer > 125){
      heartFlight.phase = 'return';
      heartFlight.timer = 0;
    }
  }

  else if(heartFlight.phase === 'return'){
    heartFlight.cameraTarget = {x:(players.her.x+players.him.x)/2,y:(players.her.y+players.him.y)/2};
    windmillFinalFade = Math.max(0,1-heartFlight.timer/90);
    if(heartFlight.timer > 100){
      heartFlight.phase = 'done';
      windmillReturnTimer = 220;
      windmillFinalFade = 0;
      windmillFinalMessage = '';
    }
  }

  heartFlightTrail = heartFlightTrail.filter(t => {
    t.life--;
    t.x += t.vx;
    t.y += t.vy;
    t.spin += t.spinSpeed;
    return t.life > 0;
  });
}

function addHeartFlightTrail(x,y){
  heartFlightTrail.push({
    x:x+(Math.random()-.5)*18,
    y:y+(Math.random()-.5)*14,
    vx:(Math.random()-.5)*.45,
    vy:.25+Math.random()*.45,
    spin:Math.random()*Math.PI*2,
    spinSpeed:(Math.random()-.5)*.07,
    life:70+Math.random()*55,
    size:2+Math.random()*4,
    color:Math.random()<.7?'#ff9dcc':'#fff1a8'
  });
}

const originalHeartFlightUpdate = update;
update = function(){
  originalHeartFlightUpdate();

  if(bloomScene && bloomScene.phase === 'hold' && bloomScene.timer > 190 && !windmillFinalStarted){
    startHeartFlight();
  }

  updateHeartFlight();

  if(windmillReturnTimer > 0){
    windmillReturnTimer--;
    const prompt = document.getElementById('prompt');
    prompt.style.display = 'block';
    prompt.textContent = 'The wind carries your wishes forward.';
  }
};

// Hide the Step 4 heart once the final flying heart takes over.
const originalStep5BloomHeart = drawBloomHeart;
drawBloomHeart = function(){
  if(heartFlight && heartFlight.phase !== 'done') return;
  originalStep5BloomHeart();
};

function drawHeartFlightTrail(){
  heartFlightTrail.forEach(t => {
    ctx.save();
    ctx.globalAlpha = Math.max(0,t.life/100);
    ctx.translate(Math.round(t.x-camera.x),Math.round(t.y-camera.y));
    ctx.rotate(t.spin);
    ctx.fillStyle = t.color;
    ctx.fillRect(-t.size/2,-t.size/2,t.size,t.size);
    ctx.restore();
  });
}

function drawFlyingHeart(){
  if(!heartFlight || ['petalBack','thanks','fadeWhite','return','done'].includes(heartFlight.phase)) return;
  ctx.save();
  ctx.globalAlpha = heartFlight.alpha;
  ctx.shadowColor = '#ff7ac8';
  ctx.shadowBlur = 28;
  drawPixelHeart(heartFlight.x-camera.x,heartFlight.y-camera.y,Math.max(3,heartFlight.size));
  ctx.restore();
}

function drawFinalPetal(){
  if(!finalPetal) return;
  ctx.save();
  ctx.translate(Math.round(finalPetal.x-camera.x),Math.round(finalPetal.y-camera.y));
  ctx.rotate(finalPetal.spin);
  ctx.globalAlpha = Math.max(0,Math.min(1,finalPetal.life/100));
  ctx.fillStyle = '#ffd1e8';
  ctx.fillRect(-5,-3,10,6);
  ctx.fillStyle = '#ff8fcf';
  ctx.fillRect(0,-2,5,4);
  ctx.restore();
}

function drawFinalWindmillMessage(){
  if(!windmillFinalMessage || windmillFinalMessageAlpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = windmillFinalMessageAlpha;
  ctx.textAlign = 'center';
  ctx.font = 'bold 25px monospace';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#241820';
  ctx.fillStyle = '#fff1d6';
  ctx.shadowColor = '#ff9dcc';
  ctx.shadowBlur = 14;
  ctx.strokeText(windmillFinalMessage,canvas.width/2,canvas.height*.23);
  ctx.fillText(windmillFinalMessage,canvas.width/2,canvas.height*.23);
  ctx.restore();
}

function drawFinalWhiteFade(){
  if(windmillFinalFade <= 0) return;
  ctx.save();
  ctx.globalAlpha = windmillFinalFade;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.restore();
}

const originalHeartFlightDraw = draw;
draw = function(){
  originalHeartFlightDraw();
  drawHeartFlightTrail();
  drawFlyingHeart();
  drawFinalPetal();
  drawFinalWindmillMessage();
  drawFinalWhiteFade();
};
