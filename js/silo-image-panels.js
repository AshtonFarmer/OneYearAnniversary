// Silo cave map system
// Uses the uploaded PNG maps in assets/cave/ and stacks all 8 side-by-side.
// yOffset moves whole maps up/down so the walkspaces line up at the seams.

const siloInteriorArt = new Image();
siloInteriorArt.src = 'silo-interior.png';

const cavePanels = [
  {name:'Entrance Cavern', src:'assets/cave/entrance-cavern.png', color:'#fff1c8', yOffset:0},
  {name:'Glowworm Grotto', src:'assets/cave/glowworm-grotto.png', color:'#6df4ff', yOffset:-80},
  {name:'Crystal Caverns', src:'assets/cave/crystal-caverns.png', color:'#9ed8ff', yOffset:-80},
  {name:'Underground River', src:'assets/cave/underground-river.png', color:'#66e5ff', yOffset:102},
  {name:'Geodes & Metallic Veins', src:'assets/cave/geodes-veins.png', color:'#eeb36a', yOffset:-61},
  {name:'Hidden Garden', src:'assets/cave/hidden-garden.png', color:'#9dff9b', yOffset:-61},
  {name:'Ice Cavern', src:'assets/cave/ice-cavern.png', color:'#bff9ff', yOffset:14},
  {name:'The Underground Lake', src:'assets/cave/underground-lake.png', color:'#fff1c8', yOffset:106}
];

cavePanels.forEach(p => {
  p.img = new Image();
  p.img.src = p.src;
});

const PANEL_W = 1280;
const PANEL_H = 760;
const PANEL_OVERLAP = 80;
const PANEL_STEP = PANEL_W - PANEL_OVERLAP;
const CAVE_TOTAL_W = (cavePanels.length - 1) * PANEL_STEP + PANEL_W;

const caveGlints = [];
const caveRipples = [];
const siloStep1Dust = [];

for(let i=0;i<180;i++) caveGlints.push({x:300+Math.random()*(CAVE_TOTAL_W-600),y:90+Math.random()*520,life:Math.random()*180,size:1+Math.random()*2});
for(let i=0;i<55;i++) caveRipples.push({x:200+Math.random()*(CAVE_TOTAL_W-400),y:500+Math.random()*130,life:Math.random()*230,w:22+Math.random()*55});
for(let i=0;i<60;i++) siloStep1Dust.push({x:170+Math.random()*620,y:100+Math.random()*500,life:Math.random()*160,size:1+Math.random()*2});

function imageReady(img){
  return img && img.complete && img.naturalWidth;
}

// Step 1: silo map background, no characters baked into it.
drawSiloInterior = function(){
  if(imageReady(siloInteriorArt)){
    ctx.drawImage(siloInteriorArt,0,0,SILO_W,SILO_H);
  } else {
    ctx.fillStyle = '#17100c';
    ctx.fillRect(0,0,SILO_W,SILO_H);
  }

  ctx.save();
  siloStep1Dust.forEach(d => {
    d.life++;
    if(d.life > 160){
      d.x = 170+Math.random()*620;
      d.y = 520+Math.random()*60;
      d.life = 0;
    }
    d.y -= .05;
    d.x += Math.sin((heartTimer+d.y)/80)*.04;
    const a = Math.sin(d.life/160*Math.PI);
    ctx.globalAlpha = .10 + a*.32;
    ctx.fillStyle = '#ffe0a0';
    ctx.fillRect(Math.round(d.x),Math.round(d.y),d.size,d.size);
  });
  ctx.restore();
};

function drawCaveBackdropCopy(p,x,y){
  if(!imageReady(p.img)) return;

  ctx.save();
  ctx.globalAlpha = .42;
  ctx.filter = 'brightness(55%) saturate(85%)';

  // Draw several shifted copies behind the real map.
  // This fills transparent top/bottom gaps with more cave art, without moving the real map.
  // The offsets are large enough that exposed gaps mostly show rock/ceiling/floor, not main walkways.
  ctx.drawImage(p.img,x,y-150,PANEL_W,PANEL_H);
  ctx.drawImage(p.img,x,y+150,PANEL_W,PANEL_H);
  ctx.drawImage(p.img,x-38,y,PANEL_W,PANEL_H);
  ctx.drawImage(p.img,x+38,y,PANEL_W,PANEL_H);

  ctx.filter = 'none';
  ctx.restore();
}

// Stack all cave PNG maps side-by-side with vertical seam alignment.
drawCaveBackground = function(){
  ctx.fillStyle = '#071018';
  ctx.fillRect(0,0,CAVE_TOTAL_W,CAVE_H);

  // Behind-layer first: same maps, darker and offset, only visible where top maps are transparent.
  cavePanels.forEach((p,i) => {
    const x = i * PANEL_STEP;
    const y = p.yOffset || 0;
    if(x - camera.x > canvas.width + 260 || x + PANEL_W - camera.x < -260) return;
    drawCaveBackdropCopy(p,x,y);
  });

  // Real maps on top.
  cavePanels.forEach((p,i) => {
    const x = i * PANEL_STEP;
    const y = p.yOffset || 0;
    if(x - camera.x > canvas.width + 260 || x + PANEL_W - camera.x < -260) return;

    if(imageReady(p.img)){
      ctx.drawImage(p.img,x,y,PANEL_W,PANEL_H);

      if(i > 0){
        const g = ctx.createLinearGradient(x,0,x+PANEL_OVERLAP,0);
        g.addColorStop(0,'rgba(0,0,0,.22)');
        g.addColorStop(.45,'rgba(0,0,0,.08)');
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x,0,PANEL_OVERLAP,CAVE_H);
      }
    } else {
      ctx.fillStyle = i%2 ? '#11151b' : '#0a1018';
      ctx.fillRect(x,y,PANEL_W,CAVE_H);
    }
  });
};

// Life on top of cave maps.
drawCaveDecorations = function(){
  if(mode !== 'cave') return;

  caveGlints.forEach(g => {
    g.life++;
    if(g.life > 180){
      g.x = 300 + Math.random()*(CAVE_TOTAL_W-600);
      g.y = 90 + Math.random()*520;
      g.life = 0;
    }
    const a = Math.sin(g.life/180*Math.PI);
    if(a < .18) return;
    ctx.save();
    ctx.globalAlpha = .08 + a*.35;
    ctx.fillStyle = g.x > PANEL_STEP && g.x < PANEL_STEP*2 ? '#69f5ff' : (g.x > PANEL_STEP*2 && g.x < PANEL_STEP*3 ? '#b184ff' : '#8be8ff');
    ctx.fillRect(Math.round(g.x-camera.x),Math.round(g.y-camera.y),g.size+1,1);
    ctx.fillRect(Math.round(g.x-camera.x+1),Math.round(g.y-camera.y-1),1,g.size+1);
    ctx.restore();
  });

  caveRipples.forEach(r => {
    r.life++;
    if(r.life > 230){
      r.x = 200 + Math.random()*(CAVE_TOTAL_W-400);
      r.y = 500 + Math.random()*130;
      r.life = 0;
      r.w = 22 + Math.random()*55;
    }
    const a = Math.sin(r.life/230*Math.PI);
    ctx.save();
    ctx.globalAlpha = .16*a;
    ctx.strokeStyle = '#bff9ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(r.x-camera.x,r.y-camera.y,r.w*a,3+a*5,0,0,Math.PI*2);
    ctx.stroke();
    ctx.restore();
  });
};
