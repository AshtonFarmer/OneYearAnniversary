// Silo Step 1 polish
// Replaces the ugly silo room with a warmer Stardew-like canvas interior.
// Keeps the same hatch/exit zones from silo.js.

const siloDust = [];
for(let i=0;i<75;i++){
  siloDust.push({
    x:170 + Math.random()*620,
    y:95 + Math.random()*510,
    vx:(Math.random()-.5)*.12,
    vy:-.04-Math.random()*.06,
    life:80+Math.random()*190,
    size:1+Math.random()*2
  });
}

function drawSiloWoodPlanks(){
  // Curved wall base.
  const wall = ctx.createRadialGradient(480,360,90,480,360,430);
  wall.addColorStop(0,'#6c4127');
  wall.addColorStop(.52,'#392419');
  wall.addColorStop(1,'#0b0708');
  ctx.fillStyle = wall;
  ctx.fillRect(0,0,SILO_W,SILO_H);

  // Round silo shape.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(480,365,360,330,0,0,Math.PI*2);
  ctx.clip();

  // Vertical curved planks.
  for(let x=145;x<=815;x+=34){
    const shade = 38 + ((x/34)%5)*10;
    ctx.fillStyle = `rgb(${shade+45},${shade+22},${shade+10})`;
    ctx.fillRect(x,92,26,545);
    ctx.fillStyle = 'rgba(18,9,5,.45)';
    ctx.fillRect(x+24,92,3,545);
    ctx.fillStyle = 'rgba(255,210,130,.08)';
    ctx.fillRect(x+3,120,3,480);
  }

  // Iron bands around the inside.
  ctx.strokeStyle = 'rgba(32,25,22,.82)';
  ctx.lineWidth = 18;
  [158,282,423,560].forEach(y => {
    ctx.beginPath();
    ctx.ellipse(480,y,322,34,0,0,Math.PI*2);
    ctx.stroke();
  });
  ctx.strokeStyle = 'rgba(174,118,60,.24)';
  ctx.lineWidth = 5;
  [158,282,423,560].forEach(y => {
    ctx.beginPath();
    ctx.ellipse(480,y,322,34,0,0,Math.PI*2);
    ctx.stroke();
  });

  ctx.restore();
}

function drawSiloTopLight(){
  // Top opening and sunlight.
  ctx.save();
  ctx.fillStyle = '#071521';
  ctx.beginPath();
  ctx.ellipse(480,95,82,42,0,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#9a6136';
  ctx.lineWidth = 12;
  ctx.stroke();

  ctx.fillStyle = 'rgba(100,190,255,.45)';
  ctx.beginPath();
  ctx.ellipse(480,95,54,25,0,0,Math.PI*2);
  ctx.fill();

  const beam = ctx.createLinearGradient(0,100,0,610);
  beam.addColorStop(0,'rgba(255,220,140,.34)');
  beam.addColorStop(1,'rgba(255,220,140,0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(430,118);
  ctx.lineTo(530,118);
  ctx.lineTo(610,620);
  ctx.lineTo(335,620);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawSpiralStairs(){
  ctx.save();

  // Back side of spiral.
  ctx.strokeStyle = 'rgba(55,33,22,.92)';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(480,352,250,Math.PI*.08,Math.PI*1.42);
  ctx.stroke();

  ctx.strokeStyle = '#b77a3f';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(480,352,250,Math.PI*.08,Math.PI*1.42);
  ctx.stroke();

  // Steps following the curve.
  for(let i=0;i<18;i++){
    const a = Math.PI*.12 + i*.235;
    const x = 480 + Math.cos(a)*250;
    const y = 352 + Math.sin(a)*250;
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(a+Math.PI/2);
    ctx.fillStyle = '#d19555';
    ctx.fillRect(-32,-6,64,12);
    ctx.fillStyle = 'rgba(35,18,8,.35)';
    ctx.fillRect(-32,3,64,4);
    ctx.restore();
  }

  // Railing posts.
  for(let i=0;i<11;i++){
    const a = Math.PI*.18 + i*.34;
    const x = 480 + Math.cos(a)*250;
    const y = 352 + Math.sin(a)*250;
    ctx.fillStyle = '#3a2215';
    ctx.fillRect(x-4,y-38,8,46);
  }

  ctx.strokeStyle = '#e3a861';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(480,352,270,Math.PI*.1,Math.PI*1.38);
  ctx.stroke();

  ctx.restore();
}

function drawHatchArea(){
  ctx.save();

  // Circular floor boards around hatch.
  ctx.fillStyle = 'rgba(16,8,4,.42)';
  ctx.beginPath();
  ctx.ellipse(480,548,190,70,0,0,Math.PI*2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(221,157,83,.32)';
  ctx.lineWidth = 4;
  for(let r=60;r<185;r+=30){
    ctx.beginPath();
    ctx.ellipse(480,548,r,r*.36,0,0,Math.PI*2);
    ctx.stroke();
  }

  // Blue glow through the crack.
  const glow = ctx.createRadialGradient(480,535,10,480,535,125);
  glow.addColorStop(0,'rgba(87,210,255,.38)');
  glow.addColorStop(1,'rgba(87,210,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(350,465,260,160);

  // Hatch body.
  ctx.fillStyle = '#2b1a12';
  ctx.fillRect(390,494,180,76);
  ctx.fillStyle = '#7b4a2a';
  ctx.fillRect(402,505,156,54);
  ctx.fillStyle = '#5d351f';
  ctx.fillRect(402,530,156,7);
  ctx.strokeStyle = '#d09750';
  ctx.lineWidth = 5;
  ctx.strokeRect(390,494,180,76);

  // Hinges and handle.
  ctx.fillStyle = '#17100e';
  ctx.fillRect(405,500,28,10);
  ctx.fillRect(527,500,28,10);
  ctx.strokeStyle = '#17100e';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(480,533,20,0,Math.PI);
  ctx.stroke();

  // Small ladder hint below hatch.
  ctx.fillStyle = '#8a542f';
  ctx.fillRect(446,570,12,95);
  ctx.fillRect(502,570,12,95);
  for(let y=588;y<655;y+=23) ctx.fillRect(446,y,68,7);

  ctx.restore();
}

function drawSiloProps(){
  ctx.save();

  // Exit doorway left.
  ctx.fillStyle = '#d79b52';
  ctx.fillRect(106,584,96,78);
  ctx.fillStyle = '#1d120b';
  ctx.fillRect(123,604,62,58);

  // Crates / barrel / lantern.
  ctx.fillStyle = '#6e4326';
  ctx.fillRect(705,585,60,44);
  ctx.fillStyle = '#8c5a32';
  ctx.fillRect(713,592,44,30);
  ctx.strokeStyle = '#2b1a12';
  ctx.lineWidth = 3;
  ctx.strokeRect(713,592,44,30);

  ctx.fillStyle = '#6b3f22';
  ctx.beginPath();
  ctx.ellipse(258,610,28,42,0,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,210,120,.14)';
  ctx.fillRect(248,575,5,70);

  ctx.fillStyle = '#f2b35f';
  ctx.fillRect(686,440,22,30);
  ctx.fillStyle = 'rgba(255,218,120,.20)';
  ctx.beginPath();
  ctx.arc(697,456,55,0,Math.PI*2);
  ctx.fill();

  // Rope coil.
  ctx.strokeStyle = '#b88a55';
  ctx.lineWidth = 5;
  for(let r=12;r<34;r+=7){
    ctx.beginPath();
    ctx.arc(250,468,r,0,Math.PI*2);
    ctx.stroke();
  }

  // Cobweb.
  ctx.strokeStyle = 'rgba(230,230,230,.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(740,142); ctx.lineTo(810,108);
  ctx.moveTo(740,142); ctx.lineTo(792,164);
  ctx.moveTo(740,142); ctx.lineTo(762,100);
  ctx.stroke();

  ctx.restore();
}

function drawSiloDust(){
  ctx.save();
  siloDust.forEach(d => {
    d.x += d.vx + Math.sin((heartTimer+d.y)/80)*.04;
    d.y += d.vy;
    d.life--;
    if(d.life <= 0 || d.y < 90){
      d.x = 170 + Math.random()*620;
      d.y = 560 + Math.random()*40;
      d.life = 90 + Math.random()*210;
    }
    ctx.globalAlpha = Math.max(0,Math.min(.5,d.life/120));
    ctx.fillStyle = '#ffe0a0';
    ctx.fillRect(Math.round(d.x),Math.round(d.y),d.size,d.size);
  });
  ctx.restore();
}

// Full replacement for Step 1. Later cave steps won't touch this.
drawSiloInterior = function(){
  ctx.save();
  drawSiloWoodPlanks();
  drawSiloTopLight();
  drawSpiralStairs();
  drawHatchArea();
  drawSiloProps();
  drawSiloDust();

  // Cinematic vignette.
  const v = ctx.createRadialGradient(480,370,130,480,370,480);
  v.addColorStop(0,'rgba(0,0,0,0)');
  v.addColorStop(1,'rgba(0,0,0,.46)');
  ctx.fillStyle = v;
  ctx.fillRect(0,0,SILO_W,SILO_H);
  ctx.restore();
};
