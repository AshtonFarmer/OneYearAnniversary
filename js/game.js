
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; ctx.imageSmoothingEnabled = false; }
addEventListener('resize', resize); resize();

const map = new Image(); map.src = 'assets/maps/main-map.png';
const herImg = new Image(); herImg.src = 'assets/sprites/her_atlas.png';
const himImg = new Image(); himImg.src = 'assets/sprites/him_atlas.png';

const keys = {};
addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault();
});
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

const locs = [
  {name:'Helipad', x:455, y:330, r:115, page:'helipad.html', text:'Press E to board the helicopter 🚁'},
  {name:'Main Cabin', x:900, y:410, r:125, page:'cabin.html', text:'Press E to enter the cabin 🏡'},
  {name:'Cherry Blossom Lake', x:1450, y:405, r:150, page:'cherry-lake.html', text:'Press E to visit Cherry Blossom Lake 🌸'},
  {name:'Shopping Center', x:1385, y:935, r:150, page:'shopping.html', text:'Press E to enter the shopping center 🛍️'},
  {name:'Future Spot', x:1595, y:680, r:95, page:null, text:'Locked for later 💕'}
];

// Keep this light for now so testing feels fun instead of getting stuck.
const solid = [
  {x:0,y:0,w:40,h:1200},{x:1760,y:0,w:40,h:1200},{x:0,y:0,w:1800,h:40},{x:0,y:1160,w:1800,h:40},
  {x:65,y:190,w:155,h:825}, {x:1260,y:120,w:390,h:310}, {x:1185,y:770,w:415,h:290},
  {x:785,y:270,w:230,h:165}, {x:325,y:210,w:260,h:180}, {x:1210,y:835,w:355,h:170}, {x:1510,y:620,w:170,h:115}
];
function rectHit(x,y){ return solid.some(s=>x>s.x&&x<s.x+s.w&&y>s.y&&y<s.y+s.h); }

const players = {
  her:{img:herImg, cols:4, x:840, y:1080, dir:0, frame:0, speed:3.2, name:'Her'},
  him:{img:himImg, cols:3, x:955, y:1080, dir:0, frame:0, speed:3.2, name:'Me'}
};
// atlas rows: 0 front, 1 left, 2 back, 3 right
function movePlayer(p, input){
  let dx=0,dy=0;
  if(input.up) dy-=1; if(input.down) dy+=1; if(input.left) dx-=1; if(input.right) dx+=1;
  if(dx||dy){
    const len=Math.hypot(dx,dy); dx/=len; dy/=len;
    if(Math.abs(dx)>Math.abs(dy)) p.dir = dx>0 ? 3 : 1;
    else p.dir = dy>0 ? 0 : 2;
    let nx=p.x+dx*p.speed, ny=p.y+dy*p.speed;
    if(!rectHit(nx,p.y)) p.x=nx; if(!rectHit(p.x,ny)) p.y=ny;
    p.frameTimer=(p.frameTimer||0)+1;
    if(p.frameTimer>7){ p.frame=(p.frame+1)%p.cols; p.frameTimer=0; }
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
function draw(){
  const cx=(players.her.x+players.him.x)/2, cy=(players.her.y+players.him.y)/2;
  const camera={x:Math.max(0,Math.min(1800-canvas.width,cx-canvas.width/2)), y:Math.max(0,Math.min(1200-canvas.height,cy-canvas.height/2))};
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(map,-camera.x,-camera.y);
  // No permanent popups on the map. The only popup is the nearby prompt.
  const arr=[players.her,players.him].sort((a,b)=>a.y-b.y);
  arr.forEach(p=>drawSprite(p,camera));
}
function loop(){update(); draw(); requestAnimationFrame(loop)}
Promise.all([map.decode(), herImg.decode(), himImg.decode()]).then(loop);
