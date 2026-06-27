// Windmill of Wishes - Step 2
// Adds the peaceful wish-catching mini-game: baskets, drifting petals, sparkles, and a 52-wish counter.

const wishStartZone = {x:520, y:610, w:240, h:96};
const wishGoal = 52;

let wishGame = null;
let wishLastE = false;
let wishPetals = [];
let wishSparkles = [];
let wishMessageTimer = 0;

function inWishStartZone(){
  return [players.her,players.him].some(p => p.x >= wishStartZone.x && p.x <= wishStartZone.x + wishStartZone.w && p.y >= wishStartZone.y && p.y <= wishStartZone.y + wishStartZone.h);
}

function startWishGame(){
  wishGame = {
    active:true,
    collected:0,
    timer:0,
    spawnTimer:0,
    gustTimer:0,
    finished:false,
    message:'Let’s catch our wishes together.'
  };
  wishPetals = [];
  wishSparkles = [];
  wishMessageTimer = 170;
}

function spawnWishPetal(gust=false){
  const sideDrift = gust ? (Math.random() < .5 ? -1 : 1) : 0;
  wishPetals.push({
    x:165 + Math.random() * 950,
    y:95 + Math.random() * 60,
    vx:(Math.random()-.5)*.75 + sideDrift * (gust ? 1.25 : 0),
    vy:.55 + Math.random()*.72 + (gust ? .25 : 0),
    spin:Math.random()*Math.PI*2,
    spinSpeed:(Math.random()-.5)*.08,
    sway:Math.random()*Math.PI*2,
    size:4 + Math.random()*3,
    caught:false
  });
}

function basketPoint(p){
  let ox = 0;
  let oy = -31;
  if(p.dir === 'left') ox = -23;
  if(p.dir === 'right') ox = 23;
  if(p.dir === 'up') oy = -39;
  if(p.dir === 'down') oy = -24;
  return {x:p.x + ox, y:p.y + oy};
}

function addWishSparkle(x,y){
  for(let i=0;i<8;i++){
    wishSparkles.push({
      x,y,
      vx:(Math.random()-.5)*1.6,
      vy:(Math.random()-.9)*1.8,
      life:32 + Math.random()*16,
      size:2 + Math.random()*2
    });
  }
}

function updateWishGame(){
  if(!wishGame || wishGame.finished) return;

  wishGame.timer++;
  wishGame.spawnTimer--;
  if(wishGame.gustTimer > 0) wishGame.gustTimer--;

  const maxPetals = wishGame.gustTimer > 0 ? 22 : 12;
  if(wishGame.spawnTimer <= 0 && wishPetals.length < maxPetals){
    const gust = Math.random() < .10;
    if(gust) wishGame.gustTimer = 90;
    const count = gust ? 7 + Math.floor(Math.random()*7) : 1;
    for(let i=0;i<count;i++) spawnWishPetal(gust);
    wishGame.spawnTimer = gust ? 45 : 24 + Math.random()*34;
  }

  const baskets = [basketPoint(players.her),basketPoint(players.him)];

  wishPetals = wishPetals.filter(p => {
    p.sway += .045;
    p.spin += p.spinSpeed;
    p.x += p.vx + Math.sin(p.sway)*.42;
    p.y += p.vy;

    for(const b of baskets){
      if(Math.hypot(p.x-b.x,p.y-b.y) < 32){
        wishGame.collected = Math.min(wishGoal,wishGame.collected + 1);
        addWishSparkle(b.x,b.y-6);
        return false;
      }
    }

    return p.y < WORLD_H - 80 && p.x > 90 && p.x < WORLD_W - 90;
  });

  wishSparkles = wishSparkles.filter(s => {
    s.life--;
    s.x += s.vx;
    s.y += s.vy;
    s.vy += .03;
    return s.life > 0;
  });

  if(wishMessageTimer > 0) wishMessageTimer--;

  if(wishGame.collected >= wishGoal){
    wishGame.finished = true;
    wishGame.message = 'The baskets are full of wishes.';
    wishMessageTimer = 240;
    wishPetals = [];
  }
}

const originalWindmillWishUpdate = update;
update = function(){
  originalWindmillWishUpdate();
  updateWishGame();

  const prompt = document.getElementById('prompt');

  if(!wishGame && inWishStartZone() && !nearExit()){
    prompt.style.display = 'block';
    prompt.textContent = 'Press E to catch wishes together 🌸';
  }

  if(keys.e && !wishLastE && !wishGame && inWishStartZone() && !nearExit()){
    startWishGame();
  }

  wishLastE = !!keys.e;
};

function drawBasket(p, fillRatio){
  if(!wishGame) return;
  const b = basketPoint(p);
  const bob = Math.sin(heartTimer/8 + p.x*.03) * 1.5;
  const x = Math.round(b.x - camera.x);
  const y = Math.round(b.y - camera.y + bob);

  ctx.save();

  // handle
  ctx.strokeStyle = '#d39a58';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x,y+5,16,Math.PI,Math.PI*2);
  ctx.stroke();

  // flowers inside as it fills
  const flowers = Math.floor(fillRatio * 9);
  for(let i=0;i<flowers;i++){
    const fx = x - 13 + (i%5)*6;
    const fy = y + 5 - Math.floor(i/5)*5;
    ctx.fillStyle = i%2 ? '#ff9dcc' : '#ffd1e8';
    ctx.fillRect(fx,fy,4,4);
  }

  // basket body
  ctx.fillStyle = '#8a542f';
  ctx.fillRect(x-17,y+9,34,16);
  ctx.fillStyle = '#c9874b';
  ctx.fillRect(x-14,y+11,28,11);
  ctx.fillStyle = '#6b3f22';
  for(let i=-12;i<=12;i+=8) ctx.fillRect(x+i,y+10,3,14);
  ctx.fillRect(x-15,y+16,30,3);
  ctx.restore();
}

function drawWishPetal(p){
  ctx.save();
  ctx.translate(Math.round(p.x-camera.x),Math.round(p.y-camera.y));
  ctx.rotate(p.spin);
  ctx.fillStyle = '#ff8fcf';
  ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
  ctx.fillStyle = '#ffd1e8';
  ctx.fillRect(0,-p.size/2,Math.max(1,p.size/2),Math.max(1,p.size/2));
  ctx.restore();
}

function drawWishSparkles(){
  wishSparkles.forEach(s => {
    ctx.save();
    ctx.globalAlpha = Math.max(0,s.life/42);
    ctx.fillStyle = '#fff1a8';
    ctx.fillRect(Math.round(s.x-camera.x),Math.round(s.y-camera.y),s.size+2,1);
    ctx.fillRect(Math.round(s.x-camera.x+1),Math.round(s.y-camera.y-1),1,s.size+2);
    ctx.restore();
  });
}

function drawWishCounter(){
  if(!wishGame) return;
  const w = 245;
  const h = 74;
  const x = canvas.width/2 - w/2;
  const y = 24;
  ctx.save();
  ctx.fillStyle = 'rgba(25,12,18,.88)';
  ctx.strokeStyle = '#ff9dcc';
  ctx.lineWidth = 3;
  roundUiRect(x,y,w,h,14,true,true);
  ctx.fillStyle = '#ffe18b';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🌸 Wishes Collected',x+w/2,y+29);
  ctx.fillStyle = '#fff1d6';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(`${wishGame.collected} / ${wishGoal}`,x+w/2,y+58);
  ctx.restore();
}

function drawWishMessage(){
  if(!wishGame || wishMessageTimer <= 0 || !wishGame.message) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1,wishMessageTimer/45);
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px monospace';
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#241820';
  ctx.fillStyle = '#fff1d6';
  ctx.shadowColor = '#ff9dcc';
  ctx.shadowBlur = 10;
  ctx.strokeText(wishGame.message,canvas.width/2,canvas.height*.22);
  ctx.fillText(wishGame.message,canvas.width/2,canvas.height*.22);
  ctx.restore();
}

function roundUiRect(x,y,w,h,r,fill,stroke){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
  if(fill) ctx.fill();
  if(stroke) ctx.stroke();
}

const originalWindmillWishDrawDebugZones = drawDebugZones;
drawDebugZones = function(){
  originalWindmillWishDrawDebugZones();
  if(!debugMode) return;
  ctx.save();
  drawDebugRect(wishStartZone,'rgba(255,120,200,.24)');
  drawDebugText('Wish Start',wishStartZone.x,wishStartZone.y);
  ctx.restore();
};

const originalWindmillWishDraw = draw;
draw = function(){
  originalWindmillWishDraw();

  if(wishGame){
    wishPetals.forEach(drawWishPetal);
    drawBasket(players.her,wishGame.collected/wishGoal);
    drawBasket(players.him,wishGame.collected/wishGoal);
    drawWishSparkles();
    drawWishCounter();
    drawWishMessage();
  }
};
