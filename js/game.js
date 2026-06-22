const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  ctx.imageSmoothingEnabled = false;
}

addEventListener('resize', resize); 
resize();

const map = new Image(); 
map.src = 'assets/maps/main-map.png';

const herImg = new Image(); 
herImg.src = 'assets/sprites/her_atlas.png';

const himImg = new Image(); 
himImg.src = 'assets/sprites/him_atlas.png';

const keys = {};

addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;

  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())){
    e.preventDefault();
  }
});

addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

let WORLD_W = 1536;
let WORLD_H = 1024;
let camera = {x:0,y:0};
let heartTimer = 0;

const locs = [
  {name:'Helipad', x:120, y:420, r:90, page:'helipad.html', text:'Press E to board the helicopter 🚁'},
  {name:'Main Cabin', x:455, y:485, r:105, page:'cabin.html', text:'Press E to enter the main cabin 🏡'},
  {name:'Cherry Blossom Lake', x:770, y:765, r:115, page:'cherry-lake.html', text:'Press E to visit Cherry Blossom Lake 🌸'},
  {name:'Shopping Center', x:1270, y:585, r:120, page:'shopping.html', text:'Press E to enter the shopping center 🛍️'},
  {name:'Future Spot', x:1410, y:310, r:85, page:null, text:'Locked for later 💕'}
];

const solid = [
  {x:-50,y:-50,w:50,h:WORLD_H+100},
  {x:WORLD_W,y:-50,w:50,h:WORLD_H+100},
  {x:-50,y:-50,w:WORLD_W+100,h:50},
  {x:-50,y:WORLD_H,w:WORLD_W+100,h:50},
  {x:20,y:25,w:360,h:120},
  {x:1285,y:20,w:230,h:140},
  {x:25,y:790,w:235,h:210},
  {x:35,y:355,w:175,h:150},
  {x:245,y:320,w:285,h:260},
  {x:1030,y:290,w:420,h:345},
  {x:630,y:705,w:285,h:205}
];

function rectHit(x,y){ 
  return solid.some(s => x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h); 
}

const players = {
  her:{
    img:herImg, 
    cols:4, 
    x:720, 
    y:650, 
    dir:'down', 
    frame:0, 
    speed:3.0, 
    name:'Her', 
    scale:.58,
    rows:{down:0, up:2, left:3, right:1}, 
    frames:{down:[0,1,2,3], up:[0,1,2,3], left:[0,1,2,3], right:[0,1,2,3]}
  },

  him:{
    img:himImg, 
    cols:3, 
    x:800, 
    y:650, 
    dir:'down', 
    frame:0, 
    speed:3.0, 
    name:'Me', 
    scale:.58,
    rows:{down:0, up:2, left:3, right:1}, 
    frames:{down:[0,1,2], up:[0,1,2], left:[0,1,2], right:[0,1,2]}
  }
};

function movePlayer(p, input){
  let dx = 0;
  let dy = 0;

  if(input.up) dy -= 1; 
  if(input.down) dy += 1; 
  if(input.left) dx -= 1; 
  if(input.right) dx += 1;

  if(dx || dy){
    const len = Math.hypot(dx,dy); 
    dx /= len; 
    dy /= len;

    if(Math.abs(dx) > Math.abs(dy)){
      p.dir = dx > 0 ? 'right' : 'left';
    } else {
      p.dir = dy > 0 ? 'down' : 'up';
    }

    const nx = p.x + dx * p.speed;
    const ny = p.y + dy * p.speed;

    if(!rectHit(nx,p.y)) p.x = nx;
    if(!rectHit(p.x,ny)) p.y = ny;

    p.frameTimer = (p.frameTimer || 0) + 1;

    if(p.frameTimer > 9){
      const seq = p.frames[p.dir];
      const i = seq.indexOf(p.frame);
      p.frame = seq[(i + 1 + seq.length) % seq.length];
      p.frameTimer = 0;
    }

  } else {
    p.frame = 0;
    p.frameTimer = 0;
  }
}

function distPlayerLoc(p,l){ 
  return Math.hypot(p.x - l.x, p.y - l.y); 
}

let lastE = false;

function update(){
  movePlayer(players.her,{
    up:keys.arrowup,
    down:keys.arrowdown,
    left:keys.arrowleft,
    right:keys.arrowright
  });

  movePlayer(players.him,{
    up:keys.w,
    down:keys.s,
    left:keys.a,
    right:keys.d
  });

  heartTimer++;

  const near = locs.find(l => 
    distPlayerLoc(players.her,l) < l.r || 
    distPlayerLoc(players.him,l) < l.r
  );

  const prompt = document.getElementById('prompt');

  if(near){ 
    prompt.style.display = 'block'; 
    prompt.textContent = near.text; 
  } else {
    prompt.style.display = 'none';
  }

  if(keys.e && !lastE && near && near.page){
    location.href = near.page;
  }

  lastE = !!keys.e;
}

function getCamera(){
  const cx = (players.her.x + players.him.x) / 2;
  const cy = (players.her.y + players.him.y) / 2;

  return {
    x: Math.max(0, Math.min(Math.max(0,WORLD_W - canvas.width), cx - canvas.width / 2)),
    y: Math.max(0, Math.min(Math.max(0,WORLD_H - canvas.height), cy - canvas.height / 2))
  };
}

function drawSprite(p){
  const sw = 96;
  const sh = 128;
  const row = p.rows[p.dir];

  const dw = Math.round(sw * p.scale);
  const dh = Math.round(sh * p.scale);

  let drawX = Math.round(p.x - camera.x - dw / 2);
  let drawY = Math.round(p.y - camera.y - dh + 10);

  let drawW = dw;

  if (p === players.him && p.dir === 'right') {
    drawX -= 4;
    drawW += 8;
  }

  ctx.drawImage(
    p.img,
    p.frame * sw,
    row * sh,
    sw,
    sh,
    drawX,
    drawY,
    drawW,
    dh
  );
}

function drawPixelHeart(x, y, size){
  const blocks = [
    [1,0],[2,0],[4,0],[5,0],
    [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],
    [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
    [1,3],[2,3],[3,3],[4,3],[5,3],
    [2,4],[3,4],[4,4],
    [3,5]
  ];

  ctx.save();

  ctx.translate(
    Math.round(x - 3.5 * size),
    Math.round(y - 3 * size)
  );

  ctx.fillStyle = '#ff6bb5';

  blocks.forEach(([bx, by]) => {
    ctx.fillRect(
      bx * size,
      by * size,
      size,
      size
    );
  });

  ctx.fillStyle = '#ffd1e8';
  ctx.fillRect(size, size, size, size);

  ctx.restore();
}

function drawCoupleHeart(){
  const distance = Math.hypot(
    players.her.x - players.him.x,
    players.her.y - players.him.y
  );

  if(distance > 48) return;

  const midX =
    (players.her.x + players.him.x) / 2 - camera.x;

  const midY =
    Math.min(players.her.y, players.him.y) - camera.y - 55;

  const float =
    Math.sin(heartTimer / 12) * 5;

  const pulse =
    Math.sin(heartTimer / 10) > 0 ? 4 : 3;

  ctx.save();

  ctx.shadowColor = '#ff7ac8';
  ctx.shadowBlur = 10;

  drawPixelHeart(
    midX,
    midY + float,
    pulse
  );

  ctx.restore();
}

function draw(){
  camera = getCamera();

  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = '#061018';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.drawImage(map,-camera.x,-camera.y);

  const arr = [players.her,players.him].sort((a,b) => a.y - b.y);

  arr.forEach(drawSprite);

  drawCoupleHeart();
}

function loop(){
  update(); 
  draw(); 
  requestAnimationFrame(loop);
}

Promise.all([map.decode(), herImg.decode(), himImg.decode()]).then(() => {
  WORLD_W = map.naturalWidth; 
  WORLD_H = map.naturalHeight;
  loop();
});
