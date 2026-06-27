// Silo Step 3 - Entrance Cavern
// Uses entrance-cavern.png as the first real cave map and adds spawn, ambience, and right-side continuation.

let entranceReveal = null;
let entranceDrops = [];
let entranceSparkles = [];
let entranceMist = [];

for(let i=0;i<50;i++){
  entranceDrops.push({x:120+Math.random()*1060,y:80+Math.random()*360,life:Math.random()*130,speed:.9+Math.random()*1.5});
}
for(let i=0;i<75;i++){
  entranceSparkles.push({x:260+Math.random()*930,y:115+Math.random()*455,life:Math.random()*170,size:1+Math.random()*2});
}
for(let i=0;i<35;i++){
  entranceMist.push({x:360+Math.random()*650,y:390+Math.random()*215,life:Math.random()*220,size:10+Math.random()*35});
}

// Step 3 takes over the final moment of Step 2 so the cave begins at the left doorway.
finishDescentToCave = function(){
  descentScene = null;
  mode = 'cave';
  fade = 1;

  players.her.x = 170;
  players.her.y = 590;
  players.her.dir = 'right';
  players.her.frame = 0;

  players.him.x = 215;
  players.him.y = 590;
  players.him.dir = 'right';
  players.him.frame = 0;

  entranceReveal = {
    timer:0,
    phase:'hold',
    message:''
  };
};

// If someone enters cave without the Step 2 sequence, still place them at the left entrance.
const originalStep3EnterCave = enterCave;
enterCave = function(){
  originalStep3EnterCave();
  players.her.x = 170;
  players.her.y = 590;
  players.her.dir = 'right';
  players.him.x = 215;
  players.him.y = 590;
  players.him.dir = 'right';
  entranceReveal = {timer:0,phase:'hold',message:''};
};

const originalStep3SolidHit = solidHit;
solidHit = function(x,y){
  if(mode !== 'cave') return originalStep3SolidHit(x,y);

  // Keep the player on the front walking shelf of the entrance cavern for now.
  if(x < 85 || y < 475 || y > 668) return true;

  // Left cave wall / doorway border.
  if(x < 120 && y < 620) return true;

  // Water and deep center river. Step 4 will extend the walk deeper/right.
  if(x > 360 && x < 1110 && y < 560) return true;

  // Right edge becomes the continuation trigger, not a hard wall until Step 4 exists.
  if(x > 1225) return true;

  return false;
};

function updateEntranceReveal(){
  if(!entranceReveal) return;
  entranceReveal.timer++;

  if(entranceReveal.phase === 'hold'){
    // Tiny pause so the reveal has weight.
    if(entranceReveal.timer < 95){
      players.her.dir = 'right';
      players.him.dir = 'right';
    } else {
      entranceReveal.phase = 'free';
      entranceReveal.timer = 0;
    }
  }
}

const originalStep3MovePlayer = movePlayer;
movePlayer = function(p,input){
  if(entranceReveal && entranceReveal.phase === 'hold') return;
  originalStep3MovePlayer(p,input);
};

function updateEntranceParticles(){
  if(mode !== 'cave') return;

  entranceDrops.forEach(d => {
    d.life++;
    d.y += d.speed;
    if(d.life > 130 || d.y > 620){
      d.x = 120+Math.random()*1060;
      d.y = 80+Math.random()*260;
      d.life = 0;
      d.speed = .9+Math.random()*1.5;
    }
  });

  entranceSparkles.forEach(s => {
    s.life++;
    if(s.life > 170){
      s.x = 260+Math.random()*930;
      s.y = 115+Math.random()*455;
      s.life = 0;
    }
  });

  entranceMist.forEach(m => {
    m.life++;
    m.x += Math.sin((heartTimer+m.y)/75)*.08;
    if(m.life > 220){
      m.x = 360+Math.random()*650;
      m.y = 390+Math.random()*215;
      m.life = 0;
    }
  });
}

const originalStep3Update = update;
update = function(){
  originalStep3Update();
  updateEntranceReveal();
  updateEntranceParticles();

  const prompt = document.getElementById('prompt');
  if(mode === 'cave' && !sitScene && players.her.x > 1130){
    prompt.style.display = 'block';
    prompt.textContent = 'The path continues to the right...';
  }
};

function drawEntranceWaterfalls(){
  if(mode !== 'cave') return;
  ctx.save();

  // Subtle animated waterfall highlights over the painted map.
  const falls = [
    {x:410,y:235,w:54,h:185},
    {x:902,y:295,w:42,h:165}
  ];
  falls.forEach((f,i) => {
    const a = .13 + Math.sin(heartTimer/18+i)*.035;
    ctx.globalAlpha = a;
    ctx.fillStyle = '#8be8ff';
    ctx.fillRect(f.x-camera.x,f.y-camera.y,f.w,f.h);
    ctx.globalAlpha = a+.05;
    for(let k=0;k<4;k++){
      const sx = f.x + 8 + k*(f.w/4) + Math.sin(heartTimer/12+k)*3;
      ctx.fillRect(sx-camera.x,f.y-camera.y,2,f.h);
    }
  });

  ctx.restore();
}

function drawEntranceParticles(){
  if(mode !== 'cave') return;

  ctx.save();

  // Mist sitting near water and cave floor.
  entranceMist.forEach(m => {
    const a = Math.sin(m.life/220*Math.PI);
    ctx.globalAlpha = .06*a;
    ctx.fillStyle = '#bff9ff';
    ctx.beginPath();
    ctx.ellipse(m.x-camera.x,m.y-camera.y,m.size,m.size*.28,0,0,Math.PI*2);
    ctx.fill();
  });

  // Drips.
  entranceDrops.forEach(d => {
    ctx.globalAlpha = .22;
    ctx.fillStyle = '#8be8ff';
    ctx.fillRect(Math.round(d.x-camera.x),Math.round(d.y-camera.y),2,7);
  });

  // Crystal twinkles.
  entranceSparkles.forEach(s => {
    const a = Math.sin(s.life/170*Math.PI);
    if(a <= .15) return;
    ctx.globalAlpha = .12 + a*.42;
    ctx.fillStyle = s.x < 520 ? '#b184ff' : '#6df4ff';
    ctx.fillRect(Math.round(s.x-camera.x),Math.round(s.y-camera.y),s.size+1,1);
    ctx.fillRect(Math.round(s.x-camera.x+1),Math.round(s.y-camera.y-1),1,s.size+1);
  });

  ctx.restore();
}

function drawEntranceReveal(){
  if(!entranceReveal || mode !== 'cave') return;

  if(entranceReveal.phase === 'hold'){
    const t = entranceReveal.timer;
    const fadeOut = Math.max(0,1-t/85);
    ctx.save();
    ctx.globalAlpha = fadeOut*.55;
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.restore();
  }
}

const originalStep3Draw = draw;
draw = function(){
  originalStep3Draw();
  drawEntranceWaterfalls();
  drawEntranceParticles();
  drawEntranceReveal();
};
