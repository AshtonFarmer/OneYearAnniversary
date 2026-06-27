// Full cave walk controller
// Turns the 8 uploaded cave maps into one continuous right-scrolling cave journey.
// Current mode: loose/free walking so testing is easy. We can tighten collisions later.

const caveMapNames = [
  'Entrance Cavern',
  'Glowworm Grotto',
  'Crystal Caverns',
  'Underground River',
  'Geodes & Veins',
  'Hidden Garden',
  'Ice Cavern',
  'Underground Lake'
];

let caveIntroHold = null;
let caveNameCard = {text:'',timer:0};
let lastCaveIndex = -1;
let caveBats = [];
let caveFish = [];
let lakeEndingStarted = false;

for(let i=0;i<5;i++) caveBats.push({x:1600+i*1450,y:135+Math.random()*160,phase:Math.random()*100});
for(let i=0;i<12;i++) caveFish.push({x:3500+Math.random()*4900,y:560+Math.random()*70,phase:Math.random()*100,speed:.25+Math.random()*.35});

function caveIndexForX(x){
  return Math.max(0,Math.min(cavePanels.length-1,Math.floor((x + PANEL_STEP*.45) / PANEL_STEP)));
}

function caveWalkYAtX(x){
  // Only used for spawning/ending now. Movement is intentionally wide open.
  const i = caveIndexForX(x);
  const local = x - i*PANEL_STEP;
  if(i === 0) return 590 - Math.sin(local/190)*10;
  if(i === 1) return 520 + Math.sin(local/220)*25;
  if(i === 2) return 520 + Math.sin(local/180)*22;
  if(i === 3) return 535 + Math.sin(local/210)*28;
  if(i === 4) return 525 + Math.sin(local/200)*24;
  if(i === 5) return 520 + Math.sin(local/220)*28;
  if(i === 6) return 520 + Math.sin(local/180)*22;
  return local < 760 ? 520 + Math.sin(local/210)*18 : 570;
}

// Override world size now that all 8 maps are side-by-side.
activeWorldW = function(){ return mode === 'silo' ? SILO_W : CAVE_TOTAL_W; };
activeWorldH = function(){ return mode === 'silo' ? SILO_H : CAVE_H; };

// Loose collision: only keep players inside the image bounds.
// No path barriers for now, so you can actually walk and test the whole cave.
solidHit = function(x,y){
  if(mode === 'silo'){
    if(x < 80 || x > SILO_W-80 || y < 90 || y > SILO_H-70) return true;
    return false;
  }

  if(x < 65 || x > CAVE_TOTAL_W - 90) return true;
  if(y < 120 || y > CAVE_H - 55) return true;

  return false;
};

function setCaveSpawn(){
  players.her.x = 160;
  players.her.y = caveWalkYAtX(160);
  players.her.dir = 'right';
  players.her.frame = 0;
  players.him.x = 212;
  players.him.y = caveWalkYAtX(212);
  players.him.dir = 'right';
  players.him.frame = 0;
  caveIntroHold = {timer:0};
  caveNameCard = {text:'Entrance Cavern',timer:150};
  lastCaveIndex = 0;
}

// Step 2 calls this at the end of the descent.
finishDescentToCave = function(){
  descentScene = null;
  mode = 'cave';
  fade = 1;
  setCaveSpawn();
};

enterCave = function(){
  mode = 'cave';
  fade = 1;
  setCaveSpawn();
};

const originalFullCaveMovePlayer = movePlayer;
movePlayer = function(p,input){
  if(caveIntroHold && caveIntroHold.timer < 95) return;
  originalFullCaveMovePlayer(p,input);
};

function updateFullCaveSystems(){
  if(mode !== 'cave') return;

  if(caveIntroHold){
    caveIntroHold.timer++;
    players.her.dir = 'right';
    players.him.dir = 'right';
    if(caveIntroHold.timer > 105) caveIntroHold = null;
  }

  const idx = caveIndexForX((players.her.x + players.him.x)/2);
  if(idx !== lastCaveIndex){
    lastCaveIndex = idx;
    caveNameCard.text = caveMapNames[idx] || '';
    caveNameCard.timer = 150;
  }
  if(caveNameCard.timer > 0) caveNameCard.timer--;

  caveBats.forEach(b => {
    b.phase++;
    b.x += .55;
    if(b.x > CAVE_TOTAL_W - 300) b.x = 900 + Math.random()*600;
  });

  caveFish.forEach(f => {
    f.phase++;
    f.x += f.speed;
    if(f.x > CAVE_TOTAL_W - 900) f.x = 3200 + Math.random()*800;
    f.y += Math.sin(f.phase/40)*.08;
  });

  const lakeX = PANEL_STEP*7 + 900;
  if(!lakeEndingStarted && players.her.x > lakeX){
    const prompt = document.getElementById('prompt');
    prompt.style.display = 'block';
    prompt.textContent = 'Press E to sit at the edge';
    if(keys.e && !lastE){
      lakeEndingStarted = true;
      startLakeSit();
    }
  }
}

const originalFullCaveUpdate = update;
update = function(){
  originalFullCaveUpdate();
  updateFullCaveSystems();
};

function drawCaveNameCard(){
  if(mode !== 'cave' || caveNameCard.timer <= 0 || !caveNameCard.text) return;
  const a = Math.min(1,caveNameCard.timer/45) * Math.min(1,(150-caveNameCard.timer)/30 + .2);
  ctx.save();
  ctx.globalAlpha = Math.min(.95,a);
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px monospace';
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#02050a';
  ctx.fillStyle = '#fff1c8';
  ctx.shadowColor = '#87d8ff';
  ctx.shadowBlur = 14;
  ctx.strokeText(caveNameCard.text,canvas.width/2,72);
  ctx.fillText(caveNameCard.text,canvas.width/2,72);
  ctx.restore();
}

function drawFullCaveAmbience(){
  if(mode !== 'cave') return;

  ctx.save();

  const idx = caveIndexForX(camera.x + canvas.width/2);
  let color = 'rgba(50,160,255,.06)';
  if(idx === 1) color = 'rgba(35,215,255,.10)';
  if(idx === 2) color = 'rgba(150,90,255,.10)';
  if(idx === 3) color = 'rgba(80,220,255,.08)';
  if(idx === 4) color = 'rgba(255,185,90,.07)';
  if(idx === 5) color = 'rgba(90,255,170,.08)';
  if(idx === 6) color = 'rgba(170,245,255,.10)';
  if(idx === 7) color = 'rgba(120,190,255,.12)';
  ctx.fillStyle = color;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.strokeStyle = 'rgba(5,8,14,.72)';
  ctx.lineWidth = 3;
  caveBats.forEach(b => {
    const x = b.x - camera.x;
    const y = b.y + Math.sin(b.phase/18)*18 - camera.y;
    if(x < -80 || x > canvas.width+80) return;
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.quadraticCurveTo(x+11,y-9,x+22,y);
    ctx.quadraticCurveTo(x+34,y-9,x+46,y);
    ctx.stroke();
  });

  ctx.fillStyle = 'rgba(180,245,255,.45)';
  caveFish.forEach(f => {
    const x = f.x - camera.x;
    const y = f.y - camera.y;
    if(x < -30 || x > canvas.width+30) return;
    ctx.fillRect(x,y,7,2);
    ctx.fillRect(x+6,y-1,2,4);
  });

  ctx.restore();
}

function drawCaveIntroHold(){
  if(!caveIntroHold || mode !== 'cave') return;
  const a = Math.max(0,1-caveIntroHold.timer/95);
  ctx.save();
  ctx.globalAlpha = a*.35;
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.restore();
}

const originalFullCaveDraw = draw;
draw = function(){
  originalFullCaveDraw();
  drawFullCaveAmbience();
  drawCaveIntroHold();
  drawCaveNameCard();
};
