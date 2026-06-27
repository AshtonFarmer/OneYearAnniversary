// Silo visual upgrade: real PNG panel system.
// Step 1 uses the uploaded silo-interior.png from the repo root.

const siloInteriorArt = new Image();
siloInteriorArt.src = 'silo-interior.png';

const cavePanels = [
  {name:'Entrance Cavern', src:'assets/cave/entrance.png', color:'#fff1c8'},
  {name:'Glowworm Grotto', src:'assets/cave/glowworms.png', color:'#6df4ff'},
  {name:'Crystal Caverns', src:'assets/cave/crystals.png', color:'#9ed8ff'},
  {name:'Underground River', src:'assets/cave/river.png', color:'#66e5ff'},
  {name:'Geodes & Metallic Veins', src:'assets/cave/geodes.png', color:'#eeb36a'},
  {name:'Hidden Garden', src:'assets/cave/garden.png', color:'#9dff9b'},
  {name:'Ice Cavern', src:'assets/cave/ice.png', color:'#bff9ff'},
  {name:'The Underground Lake', src:'assets/cave/lake-ending.png', color:'#fff1c8'}
];

cavePanels.forEach(p => {
  p.img = new Image();
  p.img.src = p.src;
});

const PANEL_W = 1280;
const PANEL_OVERLAP = 80;
const PANEL_STEP = PANEL_W - PANEL_OVERLAP;

const caveGlints = [];
const caveRipples = [];
for(let i=0;i<120;i++) caveGlints.push({x:520+Math.random()*8350,y:170+Math.random()*390,life:Math.random()*160,size:1+Math.random()*3});
for(let i=0;i<35;i++) caveRipples.push({x:3900+Math.random()*5150,y:552+Math.random()*84,life:Math.random()*220,w:22+Math.random()*60});

const siloStep1Dust = [];
for(let i=0;i<60;i++){
  siloStep1Dust.push({x:170+Math.random()*620,y:100+Math.random()*500,life:Math.random()*160,size:1+Math.random()*2});
}

function imageReady(img){
  return img && img.complete && img.naturalWidth;
}

// Step 1: real map background, no characters baked into it.
drawSiloInterior = function(){
  if(imageReady(siloInteriorArt)){
    ctx.drawImage(siloInteriorArt,0,0,SILO_W,SILO_H);
  } else {
    ctx.fillStyle = '#17100c';
    ctx.fillRect(0,0,SILO_W,SILO_H);
  }

  // Soft animated dust only. The room itself stays in the PNG map.
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

// Stack future PNG cave panels side-by-side, with a soft overlap blend.
drawCaveBackground = function(){
  ctx.fillStyle = '#071018';
  ctx.fillRect(0,0,CAVE_W,CAVE_H);

  cavePanels.forEach((p,i) => {
    const x = i * PANEL_STEP;
    if(x - camera.x > canvas.width + 200 || x + PANEL_W - camera.x < -200) return;

    if(imageReady(p.img)){
      ctx.drawImage(p.img,x,0,PANEL_W,CAVE_H);

      if(i > 0){
        const g = ctx.createLinearGradient(x,0,x+PANEL_OVERLAP,0);
        g.addColorStop(0,'rgba(0,0,0,.45)');
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x,0,PANEL_OVERLAP,CAVE_H);
      }
    } else {
      ctx.fillStyle = i%2 ? '#11151b' : '#0a1018';
      ctx.fillRect(x,0,PANEL_W,CAVE_H);
    }
  });
};

// Life on top of future cave maps.
drawCaveDecorations = function(){
  caveGlints.forEach(g => {
    g.life++;
    if(g.life > 160){
      g.x = 520 + Math.random()*8350;
      g.y = 170 + Math.random()*390;
      g.life = 0;
    }
    const a = Math.sin(g.life/160*Math.PI);
    ctx.save();
    ctx.globalAlpha = .15 + a*.55;
    ctx.fillStyle = g.x < 1500 ? '#6df4ff' : (g.x < 3000 ? '#b184ff' : (g.x < 6100 ? '#ffd078' : '#9dff9b'));
    ctx.fillRect(Math.round(g.x-camera.x),Math.round(g.y-camera.y),g.size,g.size);
    ctx.restore();
  });

  caveRipples.forEach(r => {
    r.life++;
    if(r.life > 220){
      r.x = 3900 + Math.random()*5150;
      r.y = 552 + Math.random()*84;
      r.life = 0;
      r.w = 22 + Math.random()*60;
    }
    const a = Math.sin(r.life/220*Math.PI);
    ctx.save();
    ctx.globalAlpha = .26*a;
    ctx.strokeStyle = '#bff9ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(r.x-camera.x,r.y-camera.y,r.w*a,4+a*5,0,0,Math.PI*2);
    ctx.stroke();
    ctx.restore();
  });

  ctx.save();
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.lineWidth = 6;
  cavePanels.forEach((p,i) => {
    const x = i * PANEL_STEP + PANEL_W/2;
    if(x-camera.x < -220 || x-camera.x > canvas.width+220) return;
    ctx.strokeStyle = '#02050a';
    ctx.fillStyle = p.color;
    ctx.strokeText(p.name,x-camera.x,165-camera.y);
    ctx.fillText(p.name,x-camera.x,165-camera.y);
  });
  ctx.restore();
};
