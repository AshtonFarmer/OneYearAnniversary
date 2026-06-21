const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  ctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize);
resize();

const map = new Image(); map.src = 'assets/maps/main-map.png';
const herImg = new Image(); herImg.src = 'assets/sprites/her_atlas.png';
const himImg = new Image(); himImg.src = 'assets/sprites/him_atlas.png';

const keys = {};
addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault();
});
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

let WORLD_W = 1536;
let WORLD_H = 1024;
let camera = {x:0,y:0};

const locs = [
  {name:'Helipad', x:110, y:425, r:105, page:'helipad.html', text:'Press E to board the helicopter 🚁'},
  {name:'Main Cabin', x:520, y:295, r:115, page:'cabin.html', text:'Press E to enter the main cabin 🏡'},
  {name:'Cherry Blossom Lake', x:800, y:745, r:130, page:'cherry-lake.html', text:'Press E to visit Cherry Blossom Lake 🌸'},
  {name:'Shopping Center', x:1275, y:625, r:130, page:'shopping.html', text:'Press E to enter the shopping center 🛍️'},
  {name:'Future Spot', x:1410, y:310, r:95, page:null, text:'Locked for later 💕'}
];

const solid = [
  {x:-50,y:-50,w:50,h:WORLD_H+100},{x:WORLD_W,y:-50,w:50,h:WORLD_H+100},
  {x:-50,y:-50,w:WORLD_W+100,h:50},{x:-50,y:WORLD_H,w:WORLD_W+100,h:50},
  {x:20,y:25,w:330,h:120},
  {x:1295,y:20,w:220,h:135},
  {x:25,y:780,w:230,h:215},
  {x:75,y:350,w:155,h:125},
  {x:385,y:210,w:245,h:170},
  {x:1050,y:245,w:395,h:370},
  {x:645,y:690,w:280,h:220}
];
function rectHit(x,y){ return solid.some(s=>x>s.x&&x<s.x+s.w&&y>s.y&&y<s.y+s.h); }

const players = {
  her:{img:herImg, cols:4, x:725, y:610, face:'down', frame:0, speed:2.8, name:'Her', sideRow:1, scale:.48},
  him:{img:himImg, cols:3, x:820, y:610, face:'down', frame:0, speed:2.8, name:'Me', sideRow:3, scale:.48}
};

function movePlayer(p, input){
  let dx=0,dy=0;
  if(input.up) dy-=1; if(input.down) dy+=1; if(input.left) dx-=1; if(input.right) dx+=1;
  if(dx||dy){
    const len=Math.hypot(dx,dy); dx/=len; dy/=len;
    if(Math.abs(dx)>Math.abs(dy)) p.face = dx>0 ? 'right' : 'left';
    else p.face = dy>0 ? 'down' : 'up';
    const nx=p.x+dx*p.speed, ny=p.y+dy*p.speed;
    if(!rectHit(nx,p.y)) p.x=nx;
    if(!rectHit(p.x,ny)) p.y=ny;
    p.frameTimer=(p.frameTimer||0)+1;
    if(p.frameTimer>9){ p.frame=(p.frame+1)%p.cols; p.frameTimer=0; }
  } else {
    p.frame=0;
    p.frameTimer=0;
  }
}

function distPlayerLoc(p,l){ return Math.hypot(p.x-l.x,p.y-l.y); }
let lastE=false;
function update(){
  movePlayer(players.her,{up:keys.arrowup,down:keys.arrowdown,left:keys.arrowleft,right:keys.arrowright});
  movePlayer(players.him,{up:keys.w,down:keys.s,left:keys.a,right:keys.d});
  const near = locs.find(l => distPlayerLoc(players.her,l)<l.r || distPlayerLoc(players.him,l)<l.r);
  const prompt = document.getElementById('prompt');
  if(near){ prompt.style.display='block'; prompt.textContent=near.text; }
  else prompt.style.display='none';
  if(keys.e && !lastE && near && near.page) location.href = near.page;
  lastE=!!keys.e;
}
function getCamera(){
  const cx=(players.her.x+players.him.x)/2;
  const cy=(players.her.y+players.him.y)/2;
  return {
    x: Math.max(0, Math.min(Math.max(0,WORLD_W-canvas.width), cx-canvas.width/2)),
    y: Math.max(0, Math.min(Math.max(0,WORLD_H-canvas.height), cy-canvas.height/2))
  };
}

function drawSprite(p){
  const sw=96, sh=128;
  let row = 0;
  let flip = false;
  if(p.face === 'down') row = 0;
  if(p.face === 'up') row = 2;
  if(p.face === 'right') row = p.sideRow;
  if(p.face === 'left') { row = p.sideRow; flip = true; }

  const dw = Math.round(sw * p.scale);
  const dh = Math.round(sh * p.scale);
  const dx = Math.round(p.x - camera.x - dw/2);
  const dy = Math.round(p.y - camera.y - dh + 10);

  ctx.save();
  if(flip){
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(p.img, p.frame*sw, row*sh, sw, sh, 0, 0, dw, dh);
  } else {
    ctx.drawImage(p.img, p.frame*sw, row*sh, sw, sh, dx, dy, dw, dh);
  }
  ctx.restore();
}
function draw(){
  camera = getCamera();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#061018';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(map,-camera.x,-camera.y);
  const arr=[players.her,players.him].sort((a,b)=>a.y-b.y);
  arr.forEach(drawSprite);
}
function loop(){update(); draw(); requestAnimationFrame(loop)}
Promise.all([map.decode(), herImg.decode(), himImg.decode()]).then(()=>{
  WORLD_W = map.naturalWidth; WORLD_H = map.naturalHeight;
  loop();
});
