const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; ctx.imageSmoothingEnabled = false; }
addEventListener('resize', resize); resize();

const map = new Image(); map.src = 'assets/maps/main-map.png';
const herImg = new Image(); herImg.src = 'assets/sprites/her_atlas.png';
const himImg = new Image(); himImg.src = 'assets/sprites/him_atlas.png';

const keys = {};
addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault(); });
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

const locs = [
  {name:'Helipad', x:455, y:330, r:115, page:'helipad.html', text:'Press E to board the helicopter 🚁'},
  {name:'Main Cabin', x:900, y:435, r:120, page:'cabin.html', text:'Press E to enter the cabin 🏡'},
  {name:'Cherry Blossom Lake', x:1440, y:500, r:130, page:'cherry-lake.html', text:'Press E to visit Cherry Blossom Lake 🌸'},
  {name:'Shopping Center', x:900, y:900, r:140, page:'shopping.html', text:'Press E to enter the shopping center 🛍️'},
  {name:'Future Spot', x:1350, y:710, r:90, page:null, text:'Locked for later 💕'}
];

const solid = [
  {x:0,y:0,w:250,h:1200},{x:1650,y:0,w:160,h:1200},
  {x:0,y:0,w:1800,h:70},{x:0,y:1120,w:1800,h:90},
  {x:75,y:220,w:155,h:810},{x:1250,y:135,w:390,h:320},{x:1160,y:765,w:420,h:295},
  {x:335,y:205,w:240,h:185},{x:790,y:250,w:220,h:180},{x:690,y:710,w:420,h:180}
];
function rectHit(x,y){ return solid.some(s=>x>s.x&&x<s.x+s.w&&y>s.y&&y<s.y+s.h); }

const players = {
  her:{img:herImg, cols:4, x:1000, y:1010, dir:0, frame:0, speed:3.2, name:'Her'},
  him:{img:himImg, cols:3, x:820, y:1010, dir:0, frame:0, speed:3.2, name:'Me'}
};
// dir rows: 0 front, 1 side/right, 2 back, 3 side/left
function movePlayer(p, input){
  let dx=0,dy=0;
  if(input.up) dy-=1; if(input.down) dy+=1; if(input.left) dx-=1; if(input.right) dx+=1;
  if(dx||dy){
    const len=Math.hypot(dx,dy); dx/=len; dy/=len;
    if(Math.abs(dx)>Math.abs(dy)) p.dir = dx>0 ? 1 : 3; else p.dir = dy>0 ? 0 : 2;
    let nx=p.x+dx*p.speed, ny=p.y+dy*p.speed;
    if(!rectHit(nx,p.y)) p.x=nx; if(!rectHit(p.x,ny)) p.y=ny;
    p.frameTimer=(p.frameTimer||0)+1; if(p.frameTimer>8){p.frame=(p.frame+1)%p.cols;p.frameTimer=0;}
  } else { p.frame=0; p.frameTimer=0; }
}
function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
let lastE=false;
function update(){
  movePlayer(players.her,{up:keys.arrowup,down:keys.arrowdown,left:keys.arrowleft,right:keys.arrowright});
  movePlayer(players.him,{up:keys.w,down:keys.s,left:keys.a,right:keys.d});
  const near = locs.find(l => dist(players.her,l)<l.r || dist(players.him,l)<l.r);
  const prompt = document.getElementById('prompt');
  if(near){ prompt.style.display='block'; prompt.textContent=near.text; }
  else prompt.style.display='none';
  if(keys.e && !lastE && near && near.page) location.href = near.page;
  lastE=!!keys.e;
}
function drawSprite(p,camera){
  const sw=96, sh=128;
  const dx=Math.round(p.x-camera.x-sw/2), dy=Math.round(p.y-camera.y-sh+18);
  ctx.drawImage(p.img, p.frame*sw, p.dir*sh, sw, sh, dx, dy, sw, sh);
}
function label(text,x,y,camera){
  const sx=x-camera.x, sy=y-camera.y;
  ctx.fillStyle='rgba(30,16,18,.86)'; ctx.strokeStyle='#b17142'; ctx.lineWidth=3;
  ctx.fillRect(sx-120,sy-35,240,58); ctx.strokeRect(sx-120,sy-35,240,58);
  ctx.fillStyle='#ffe18b'; ctx.font='18px monospace'; ctx.textAlign='center';
  ctx.fillText(text,sx,sy-8); ctx.font='14px monospace'; ctx.fillText('walk close + press E',sx,sy+13);
}
function draw(){
  const cx=(players.her.x+players.him.x)/2, cy=(players.her.y+players.him.y)/2;
  const camera={x:Math.max(0,Math.min(1800-canvas.width,cx-canvas.width/2)), y:Math.max(0,Math.min(1200-canvas.height,cy-canvas.height/2))};
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(map,-camera.x,-camera.y);
  label('Helipad',455,175,camera); label('Main Cabin',900,225,camera); label('Cherry Lake',1445,165,camera); label('Shopping Center',900,680,camera); label('Future Spot',1350,585,camera);
  const arr=[players.her,players.him].sort((a,b)=>a.y-b.y); arr.forEach(p=>drawSprite(p,camera));
}
function loop(){update(); draw(); requestAnimationFrame(loop)}
Promise.all([map.decode(), herImg.decode(), himImg.decode()]).then(loop);
