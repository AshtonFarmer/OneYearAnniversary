// Silo visual upgrade: use artwork panels for the silo room and the long cave walk.

const siloInteriorArt = new Image();
siloInteriorArt.src = 'assets/cave/interior.svg';

const cavePanoramaArt = new Image();
cavePanoramaArt.src = 'assets/cave/panorama.svg';

const caveSceneLabels = [
  ['Entrance Cavern',430,'#fff1c8'],
  ['Glowworm Grotto',1120,'#6df4ff'],
  ['Crystal Caverns',2050,'#9ed8ff'],
  ['Dripstone Chamber',3300,'#ffd08a'],
  ['Underground River',4380,'#66e5ff'],
  ['Geodes & Metallic Veins',5620,'#eeb36a'],
  ['Hidden Garden',6720,'#9dff9b'],
  ['Ice Cavern',7850,'#bff9ff'],
  ['The Underground Lake',8840,'#fff1c8']
];

const caveGlints = [];
const caveRipples = [];
for(let i=0;i<120;i++) caveGlints.push({x:520+Math.random()*8350,y:170+Math.random()*390,life:Math.random()*160,size:1+Math.random()*3});
for(let i=0;i<35;i++) caveRipples.push({x:3900+Math.random()*5150,y:552+Math.random()*84,life:Math.random()*220,w:22+Math.random()*60});

// Replace the rough canvas-drawn silo room with artwork.
drawSiloInterior = function(){
  if(siloInteriorArt.complete && siloInteriorArt.naturalWidth){
    ctx.drawImage(siloInteriorArt,0,0,SILO_W,SILO_H);
  } else {
    ctx.fillStyle = '#17100c';
    ctx.fillRect(0,0,SILO_W,SILO_H);
  }
};

// Replace the rough cave background with one continuous artwork image.
drawCaveBackground = function(){
  if(cavePanoramaArt.complete && cavePanoramaArt.naturalWidth){
    ctx.drawImage(cavePanoramaArt,0,0,CAVE_W,CAVE_H);
  } else {
    ctx.fillStyle = '#071018';
    ctx.fillRect(0,0,CAVE_W,CAVE_H);
  }
};

// Replace the old decoration layer with subtle life on top of the image.
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

  // Section names float softly over each image panel.
  ctx.save();
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.lineWidth = 6;
  caveSceneLabels.forEach(([text,x,color]) => {
    if(x-camera.x < -220 || x-camera.x > canvas.width+220) return;
    ctx.strokeStyle = '#02050a';
    ctx.fillStyle = color;
    ctx.strokeText(text,x-camera.x,165-camera.y);
    ctx.fillText(text,x-camera.x,165-camera.y);
  });
  ctx.restore();
};
