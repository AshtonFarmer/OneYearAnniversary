// A deterministic, seekable canvas director. Character faces come from the
// existing sheets; articulated crops supply seated, swimming and embrace poses.
// No relationship photograph is painted onto a film frame.
(function () {
  'use strict';
  const F = window.OurYearFilms, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, u) => a + (b - a) * u, ease = u => {u = clamp(u); return u * u * (3 - 2 * u);};
  const TAU = Math.PI * 2, bounds = new WeakMap();
  let homecomingRoom=null;
  function homecomingBackdrop(){if(!homecomingRoom){homecomingRoom=new Image();homecomingRoom.src='assets/our-year/places/apartment.webp?v=20261104-4';}return homecomingRoom.complete&&(homecomingRoom.naturalWidth||homecomingRoom.width)>1?homecomingRoom:null;}

  function renderer(canvas, options) {
    const p = canvas.getContext('2d');
    let t = 0, u = 0, action = '', frame = null;
    const rect = (x, y, w, h, color, r = 0) => {p.fillStyle = color; p.beginPath(); if (r) p.roundRect(x, y, w, h, r); else p.rect(x, y, w, h); p.fill();};
    function oval(x, y, rx, ry, color) {p.fillStyle = color; p.beginPath(); p.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), 0, 0, TAU); p.fill();}
    function line(points, color, width = 2) {p.strokeStyle = color; p.lineWidth = width; p.lineCap = 'round'; p.lineJoin = 'round'; p.beginPath(); points.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.stroke();}
    function poly(points, color) {p.fillStyle = color; p.beginPath(); points.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); p.fill();}
    function text(s, x, y, size = 18, color = '#f8e9c7', align = 'center') {p.font = size + 'px Georgia'; p.textAlign = align; p.fillStyle = color; p.fillText(s, x, y);}
    function gradient(a, b, y = 0, h = 570) {const g = p.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, a); g.addColorStop(1, b); rect(0, y, 960, h, g);}
    function glow(x, y, radius, color) {const g = p.createRadialGradient(x, y, 0, x, y, radius); g.addColorStop(0, color); g.addColorStop(1, color.slice(0, 7) + '00'); rect(x - radius, y - radius, radius * 2, radius * 2, g);}
    function star(x, y, size = 3, color = '#ffe4ab') {poly([[x, y-size],[x+size*.24,y-size*.24],[x+size,y],[x+size*.24,y+size*.24],[x,y+size],[x-size*.24,y+size*.24],[x-size,y],[x-size*.24,y-size*.24]],color);}
    function heart(x, y, size = 1) {p.save();p.translate(x,y);p.scale(size,size);p.fillStyle='#ed9eb1';p.beginPath();p.moveTo(0,9);p.bezierCurveTo(-32,-8,-15,-31,0,-14);p.bezierCurveTo(15,-31,32,-8,0,9);p.fill();p.restore();}
    function stars(n = 90) {for(let i=0;i<n;i++){p.globalAlpha=.25+.5*(1+Math.sin(t*.8+i))/2;star((i*173+39)%960,45+(i*73)%290,i%7?1.2:3);}p.globalAlpha=1;}
    function moon(x = 760, y = 120, r = 43, color = '#eee1b6') {glow(x,y,r*2.2,color+'28');oval(x,y,r,r,color);for(let i=0;i<9;i++)oval(x+Math.sin(i*2)*r*.66,y+Math.cos(i*3)*r*.62,r*.09,r*.065,'#53657324');}
    function skyline(y = 330) {for(let i=0;i<30;i++){const h=30+(i*37)%125,x=i*36-25;rect(x,y-h,31,h+50,i%2?'#20333e':'#172b37');for(let j=0;j<3;j++)for(let k=0;k<h/13;k++)if((i+j+k)%3)rect(x+5+j*8,y-h+9+k*13,3,5,(i+k)%2?'#dcb9738a':'#9cbbad50');}rect(420,y-135,57,175,'#304b50');for(let k=0;k<10;k++)rect(425,y-127+k*12,46,2,'#a8c2b570');}
    function lamp(x,y) {line([[x,y],[x,y-142]],'#655e4c',5);line([[x-18,y-142],[x+18,y-142]],'#ab925f',4);rect(x-13,y-171,26,29,'#7c7558',4);rect(x-9,y-166,18,19,'#ffe6ac',2);glow(x,y-154,105,'#ffdf8f35');}
    function tree(x,y,h = 260, color = '#1a3d32') {rect(x-9,y-h*.65,18,h*.65,'#493f34');line([[x,y-h*.4],[x-47,y-h*.67]],'#493f34',9);line([[x,y-h*.5],[x+45,y-h*.77]],'#493f34',8);for(let j=0;j<8;j++){const xx=x+Math.sin(j*2.1)*h*.22,yy=y-h*.64+Math.cos(j*2.1)*h*.19;oval(xx,yy,h*.19,h*.22,color);for(let k=0;k<5;k++)oval(xx+Math.sin(k*1.8)*h*.1,yy+Math.cos(k*2)*h*.1,5,3,'#a5b28213');}}
    function bench(x,y,w = 200) {rect(x-w/2,y-49,w,38,'#a17c51',5);for(let j=0;j<3;j++)rect(x-w/2+4,y-44+j*11,w-8,3,'#654c36');rect(x-w/2-4,y-6,w+8,12,'#b58e5e',3);line([[x-w*.4,y+5],[x-w*.4,y+43]],'#394c45',6);line([[x+w*.4,y+5],[x+w*.4,y+43]],'#394c45',6);}
    function flowers(x,y,size = 1) {p.save();p.translate(x,y);p.scale(size,size);rect(-14,-15,28,54,'#7a9e8d',5);for(let i=0;i<8;i++){const xx=Math.sin(i*2)*26,yy=-32+Math.cos(i*2)*20;line([[0,0],[xx,yy]],'#486e46',2);for(let k=0;k<5;k++)oval(xx+Math.sin(k*1.257)*5,yy+Math.cos(k*1.257)*5,5,5,i%2?'#ac3147':'#d04654');oval(xx,yy,3,3,'#f2a36a');}p.restore();}
    function twinkles(x,y,n = 8) {for(let i=0;i<n;i++)star(x+Math.sin(i*2.4+t*.3)*60,y+Math.cos(i*2.4+t*.3)*38,2+(1+Math.sin(t*3+i))*2,'#ffedb9');}

    function sheet(who) {
      const image = options.images[who]; if(!image || !(image.naturalWidth || image.width))return null;
      const wardrobe = window.SharedWardrobe && window.SharedWardrobe.getSprite(image);
      return wardrobe || image;
    }
    function cell(who, col = 0, row = 0) {
      const image=sheet(who);if(!image)return null;
      let frames=bounds.get(image);if(!frames){frames={};bounds.set(image,frames);}
      const index=row*4+col%4;if(frames[index])return frames[index];
      const w=(image.naturalWidth||image.width)/4,h=(image.naturalHeight||image.height)/4,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,(col%4)*w,row*h,w,h,0,0,w,h);
      const data=ctx.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=0,y1=0;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>35){x0=Math.min(x,x0);y0=Math.min(y,y0);x1=Math.max(x,x1);y1=Math.max(y,y1);}
      if(x0>x1)return null;
      const crop=document.createElement('canvas');crop.width=x1-x0+1;crop.height=y1-y0+1;crop.getContext('2d').drawImage(c,x0,y0,crop.width,crop.height,0,0,crop.width,crop.height);frames[index]=crop;return crop;
    }
    // Coordinates use visible body height, rather than the transparent atlas cell.
    function actor(who,x,y,h = 150,pose = 'idle',phase = t,flip = false) {
      const moving=pose==='walk',im=cell(who,moving?Math.floor(phase*7)%4:0,pose==='hug'||pose==='give'?3:0);if(!im)return;
      const w=im.width*h/im.height,sw=im.width,sh=im.height;
      p.save();p.translate(x,y);if(flip)p.scale(-1,1);p.imageSmoothingEnabled=false;
      const bob=moving?Math.sin(phase*14)*1.5:Math.sin(phase*1.8)*.55;
      oval(0,2,w*.42,5,'#071b2438');p.translate(0,bob);
      function part(x0,y0,x1,y1,dx,dy,dw,dh){p.drawImage(im,x0*sw,y0*sh,(x1-x0)*sw,(y1-y0)*sh,dx,dy,dw,dh);}
      if(['idle','walk','look'].includes(pose)){p.drawImage(im,-w/2,-h,w,h);if(pose==='look'){p.fillStyle='#ffe9a000';}p.restore();return;}
      if(pose==='swim') {
        p.translate(0,Math.sin(phase*3)*2);p.rotate(-.05+Math.sin(phase*2)*.025);
        // The generated bikini/trunks and original textured skin supply the
        // swimmer's body. The waterline hides the submerged legs.
        p.save();p.beginPath();p.rect(-w,-h,w*2,h*.91);p.clip();p.drawImage(im,-w/2,-h*.88,w,h);p.restore();
        for(const side of [-1,1]){p.save();p.translate(side*w*.32,-h*.35);p.rotate(side*(.35+Math.sin(phase*4)*.3));part(side<0?0:.78,.43,side<0?.22:1,.77,-w*.11,-h*.07,w*.22,h*.34);p.restore();}
        p.strokeStyle='#d0efef88';p.lineWidth=1.3;for(let ring=0;ring<2;ring++){p.beginPath();p.ellipse(0,-h*.04+ring*5,w*.67+Math.sin(phase*3+ring)*3,5+ring*3,0,0,TAU);p.stroke();}
        p.restore();return;
      }
      const seated=['sit','lean','carve'].includes(pose),crouch=pose==='crouch';
      const lift=seated?h*.22:(crouch?h*.18:0),top=-h+lift;
      // Keep the complete hair/face region intact and articulate below it.
      part(0,0,1,.46,-w/2,top,w,h*.46);
      part(.22,.45,.78,.78,-w*.28,top+h*.45,w*.56,h*.33);
      if(seated||crouch){
        if(who==='him'){
          for(let side=-1;side<=1;side+=2){
            p.save();p.translate(side*w*.20,top+h*.76);p.rotate(-side*.85);
            part(side<0?.12:.52,.76,side<0?.48:.88,.90,-w*.12,0,w*.24,h*.14);p.restore();
            part(side<0?.12:.52,.88,side<0?.48:.88,1,side*w*.30-w*.12,top+h*.85,w*.24,h*.17);
          }
        }else{
          part(.12,.76,.88,.94,-w*.43,top+h*.75,w*.86,h*.18);
          part(.12,.94,.88,1,-w*.35,top+h*.92,w*.70,h*.08);
        }
      }else part(.12,.77,.88,1,-w*.38,top+h*.77,w*.76,h*.23);
      for(let side=-1;side<=1;side+=2){
        let a=0;
        if(pose==='hug')a=side*1.05;
        if(pose==='hold')a=-side*.55;
        if(pose==='give')a=side<0?.1:-1.15;
        if(pose==='cheer')a=side*(2.5+Math.sin(phase*4)*.18);
        if(pose==='dance')a=side*(.7+Math.sin(phase*3)*.4);
        if(pose==='clap')a=side*(.75+Math.sin(phase*7)*.16);
        if(pose==='swing')a=-side*(.9+Math.sin(phase*2)*1.1);
        if(pose==='carve')a=side*(.9+Math.sin(phase*5)*.16);
        if(pose==='pray')a=side*1.02;
        if(pose==='sit'||pose==='lean')a=side*.72;
        p.save();p.translate(side*w*.28,top+h*.47);p.rotate(a);
        part(side<0?0:.77,.46,side<0?.23:1,.79,-w*.115,0,w*.23,h*.33);p.restore();
      }
      p.restore();
    }
    function pair(x,y,h = 145,pose='idle',space=72,lean=false) {
      if(pose==='hold'){line([[x-space/2+25,y-h*.35],[x+space/2-25,y-h*.35]],'#d9a270',8);}
      actor('him',x-space/2,y,h,pose,t);
      if(lean){p.save();p.translate(x+space/2,y);p.rotate(-.14);actor('her',0,0,h*.94,'lean',t);p.restore();}
      else actor('her',x+space/2,y,h*.94,pose,t+.3,true);
    }
    function embrace(x,y,h = 165,kiss = false) {
      actor('him',x-20,y,h,'hug',t);p.save();p.translate(x+21,y);p.rotate(kiss?-.10:-.04);actor('her',0,0,h*.94,'hug',t+.5,true);p.restore();
      heart(x,y-h-15, .5+Math.sin(t)*.04);
    }
    function crowd(x,y,n=12,scale=1,moving=false) {
      for(let i=0;i<n;i++){const xx=x+i*45*scale,yy=y+Math.sin(i*2)*8*scale,b=moving?Math.sin(t*3+i)*3:0;oval(xx,yy,15*scale,4*scale,'#0003');rect(xx-11*scale,yy-34*scale+b,22*scale,32*scale,['#74554e','#426c66','#8e7653','#685b7d'][i%4],7*scale);oval(xx,yy-43*scale+b,10*scale,12*scale,['#c99d72','#a97350','#d5b18c'][i%3]);oval(xx,yy-51*scale+b,11*scale,5*scale,'#3d302a');if(moving)line([[xx-12*scale,yy-25*scale+b],[xx-22*scale,yy-39*scale+Math.sin(t*4+i)*9]],'#bf916b',4*scale);}
    }
    function parkBackground() {
      gradient('#101f35','#686b58');stars();moon(764,112,40);skyline(313);rect(0,330,960,240,'#243f36');
      poly([[418,315],[548,315],[870,570],[72,570]],'#697d6b');poly([[420,315],[425,315],[100,570],[72,570]],'#9b907052');
      for(let i=0;i<8;i++)tree(i*145-10,390+(i%2)*28,180+(i%3)*30,i%2?'#244a37':'#1b3e32');
      [135,325,680,865].forEach((x,i)=>lamp(x,425+(i%2)*36));
      for(let i=0;i<70;i++){const x=i*83%960,y=470+i*37%100;line([[x,y],[x-7,y-16-(i%7)]],'#c3b78055',1);}
      bench(550,425,232);
    }
    function room(dark=false) {
      gradient(dark?'#211a31':'#b59b79',dark?'#3a2942':'#e0cba6');rect(45,58,870,320,dark?'#43324b':'#e3d3b1');
      for(const x of [90,745]){rect(x,102,125,211,'#554c44',4);rect(x+8,110,109,192,dark?'#161c34':'#254653',2);rect(x+59,110,4,192,'#8f8065');rect(x+8,200,109,4,'#8f8065');moon(x+90,143,17);}
      rect(0,380,960,190,dark?'#54424b':'#a78056');for(let i=0;i<15;i++)line([[0,390+i*15],[960,390+i*15]],'#58473738',1);for(let i=0;i<10;i++)line([[i*130,380],[i*130-120,570]],'#58473738',1);
      rect(262,288,445,145,dark?'#242334':'#333c38',17);rect(280,271,410,90,dark?'#343047':'#455049',14);rect(290,319,100,65,'#a69a75',9);rect(575,319,100,65,'#a69a75',9);rect(260,423,450,16,'#3b3732',5);
      rect(847,160,82,230,'#5e4a34',4);rect(856,171,62,207,'#846c4a',3);oval(867,285,4,4,'#e1c78c');
      for(let i=0;i<7;i++){const x=300+i*60,y=62+Math.sin(i/6*Math.PI)*30;line([[x-27,y-7],[x+28,y+7]],'#8b7755',1);star(x,y,4,'#f3d48b');}
      glow(480,135,200,'#ffdc9330');
    }
    function table(y=480){rect(185,y,590,65,'#805537',5);rect(210,y+65,13,65,'#503c2f');rect(735,y+65,13,65,'#503c2f');line([[190,y+6],[768,y+6]],'#bd9166',2);}
    function dish(x,y){oval(x,y,45,12,'#e9dfbe');oval(x,y-2,33,8,'#d8c780');oval(x-10,y-3,12,5,'#bba05b');oval(x+14,y-2,10,5,'#6e8b50');}
    function drawHome() {
      const backdrop=options.backdrops&&options.backdrops.apartment||homecomingBackdrop();if(!backdrop){gradient('#302b24','#5d5140');text('Getting our welcome home ready…',480,285,22);return;}
      p.drawImage(backdrop,0,55,1536,912,0,0,960,570);
      if(action==='prepare')actor('him',mix(250,310,ease(u)),458,128,'walk');
      if(action==='arrive'){actor('him',430,520,138,'give');actor('her',mix(680,515,ease(u)),520,132,'walk');}
      if(action==='embrace')embrace(480,520,140,u>.65);
      if(action==='dinner'){pair(490,330,138,'sit',84,true);heart(490,205,.35);}
    }
    function drawSky(){
      gradient('#07182c','#394b62');stars(150);skyline(375);rect(0,415,960,155,'#243c39');line([[0,434],[960,434]],'#8e9170',4);for(let i=0;i<20;i++)rect(i*54,435,3,60,'#516965');bench(480,461,200);
      const color=action==='blood'?'#c76e4d':action==='blue'?'#e2e8dc':'#e8dfc1';moon(718,143,62,color);
      if(action==='eclipse'){p.save();p.beginPath();p.arc(718,143,62,0,TAU);p.clip();oval(mix(840,650,u),139,65,65,'#101b31ee');p.restore();}
      if(action==='meteors')for(let i=0;i<8;i++){const v=(t*.19+i*.17)%1,x=980-v*1100,y=65+v*265+(i%3)*18;line([[x+80,y-28],[x,y]],'#c5edff99',2);star(x,y,2,'#f7f5d1');}
      if(action==='planets'){['Venus','Mars','Jupiter','Saturn'].forEach((name,i)=>{const x=175+i*166,y=167-Math.sin(i*.9)*66;glow(x,y,23,'#f6d39938');oval(x,y,i===2?5:3,i===2?5:3,i===1?'#dfaa86':'#f7dfae');if(i===3){p.strokeStyle='#d1c5a0';p.beginPath();p.ellipse(x,y,9,3,-.4,0,TAU);p.stroke();}if(u>.4)text(name,x,y+24,13,'#c2d5db');});}
      if(action==='arrive')pair(mix(280,480,ease(u)),501,143,'walk');else pair(480,458,157,'sit',action==='lean'?62:78,action==='lean');
    }
    function drawPark(){parkBackground();if(action==='establish')pair(195+u*65,468,122,'walk');if(action==='walk')pair(mix(270,505,ease(u)),mix(489,468,u),148,'hold');if(action==='sit'||action==='lean'){const v=action==='sit'?ease(clamp(u*3)):1;pair(mix(490,550,v),mix(468,425,v),157,v>.85?'sit':'walk',action==='lean'?62:82,action==='lean');if(action==='lean')heart(550,292,.42);}}
    function ballpark(){
      gradient('#0e1a30','#53606a');stars(50);skyline(259);rect(0,267,960,303,'#1e4936');oval(480,485,400,192,'#397249');poly([[480,485],[295,353],[480,256],[665,353]],'#bea278');poly([[480,449],[340,354],[480,282],[620,354]],'#427d50');line([[480,485],[190,295]],'#d4dfb855',2);line([[480,485],[770,295]],'#d4dfb855',2);
      for(const x of [100,860]){rect(x,100,4,220,'#9ea7a1');for(let j=0;j<5;j++){rect(x-34+j*17,96,12,11,'#fff3c1',2);glow(x-28+j*17,101,50,'#ffedb52e');}}
      rect(360,178,240,48,'#172a36',4);text('REGIONS FIELD',480,201,17,'#dfdabb');text(action==='play'?'PLAY BALL':'BIRMINGHAM',480,218,11,'#b4c7b0');
      crowd(28,365,21,.65,action==='cheer');rect(0,491,960,79,'#76564c');line([[0,488],[960,488]],'#a58e70',5);
    }
    function bursts(){for(let i=0;i<8;i++){const life=(t*.32+i*.18)%1,x=95+(i*131)%800,y=95+(i*67)%130,col=['#f1b7c7','#e7d692','#98dddb','#b8b2ef'][i%4];if(life<.15){line([[x,320],[x,320-life*1300]],col+'80',2);continue;}const v=(life-.15)/.85,r=v*115;p.globalAlpha=1-v;for(let j=0;j<34;j++){const a=j*TAU/34;line([[x+Math.cos(a)*r*.72,y+Math.sin(a)*r*.72+v*v*50],[x+Math.cos(a)*r,y+Math.sin(a)*r+v*v*50]],col,2);star(x+Math.cos(a)*r,y+Math.sin(a)*r+v*v*50,1.5,col);}p.globalAlpha=1;}}
    function drawBaseball(){ballpark();if(action==='play'){const v=(u*2)%1;crowd(455,366,1,.55);line([[488,370],[500+Math.sin(v*6)*18,348]],'#d8be87',4);if(v>.3){const b=(v-.3)/.7;oval(mix(490,750,b),mix(365,260,b)-Math.sin(b*Math.PI)*100,4,4,'#fbf5da');}pair(480,520,139,'sit',84);}else if(action==='arrive')pair(mix(215,480,ease(u)),550,139,'walk');else if(action==='cheer')pair(480,550,139,'cheer');else{bursts();pair(480,520,145,'sit',78,action==='lean');}}
    function pool(){
      gradient('#b4dce0','#f1dbb7');rect(0,64,960,210,'#ded8c5');for(let i=0;i<8;i++){rect(50+i*125,90,70,100,'#577b7a',2);rect(56+i*125,96,58,40,'#a5c7c3');line([[40+i*125,214],[131+i*125,214]],'#5b6e65',3);}tree(55,275,180,'#4d7654');tree(905,275,185,'#426d50');
      rect(0,275,960,295,'#b9b49d');rect(48,302,865,255,'#cbd9cd',22);rect(62,314,838,229,'#42aab7',15);
      for(let i=0;i<22;i++){const pts=[];for(let x=70;x<895;x+=16)pts.push([x,325+i*10+Math.sin(x*.035+t*1.6+i)*3]);line(pts,i%2?'#e0f8ed66':'#187f9a44',1.6);}
      for(let i=0;i<4;i++){rect(154+i*199,256,74,18,'#7db6b5',4);rect(160+i*199,228,63,32,'#92c4c1',4);}
      line([[75,310],[75,270],[95,260],[115,270],[115,350]],'#e0e5d4',5);
    }
    function splash(x,y,n=10){for(let i=0;i<n;i++){const v=(t*1.3+i*.12)%1;oval(x+Math.sin(i*2)*v*49,y-Math.sin(v*Math.PI)*35+v*9,2,4,'#d5f9efb3');}}
    function drawSwim(){pool();if(action==='edge')pair(270+u*90,309,133,'walk',68);else if(action==='enter'){const v=ease(u);pair(365,310+v*72,133,'hold');rect(305,335+v*40,125,75,'#43afbd99');splash(365,382);}else {const x=action==='swim'?mix(300,700,ease(u)):action==='splash'?710:740;actor('him',x-30,431,143,'swim',t);actor('her',x+39,430,135,'swim',t+.9,true);for(let i=0;i<4;i++){p.strokeStyle='#caf4ee99';p.lineWidth=2;p.beginPath();p.ellipse(x,426,70+i*14+Math.sin(t*2)*4,9+i*3,0,0,TAU);p.stroke();}if(action==='splash')splash(x,390,18);if(action==='rest'){line([[x-42,377],[x-42,355],[x+66,355],[x+66,377]],'#d9a579',7);heart(x,322,.4);}}}
    function golf(){gradient('#0a192b','#314f48');stars(70);rect(0,220,960,350,'#356348');for(let i=0;i<18;i++)line([[i*60,85+i%3*18],[i*60,450]],'#98b1a033',2);for(let j=0;j<5;j++)line([[0,120+j*65],[960,120+j*65]],'#98b1a019',1);[[260,286,50],[510,225,37],[740,300,57],[490,382,63]].forEach(([x,y,r],i)=>{oval(x,y,r,r*.28,'#78b4a4');oval(x,y,r*.72,r*.19,'#296c61');oval(x,y,r*.32,r*.09,['#e0b768','#e0a5b3','#a1bdc9','#d0d78a'][i]);if(u>.64&&action!=='establish'){glow(x,y,58,'#f3dc8f38');}});rect(0,473,960,97,'#b0a78a');rect(300,482,360,88,'#466b46');line([[0,474],[960,474]],'#edcf7e',7);}
    function drawGolf(){golf();const who=action==='hisShot'?'him':'her',shot=action==='hisShot'||action==='herShot';actor('him',385,548,149,shot&&who==='him'?'swing':action==='cheer'?'cheer':'idle',t);actor('her',590,548,141,shot&&who==='her'?'swing':action==='cheer'?'clap':'idle',t,true);if(shot){const v=clamp((u-.22)/.55),x0=who==='him'?420:559;const a=mix(-1.5,1.6,ease(clamp(u*2.2)));line([[x0,450],[x0+Math.sin(a)*55,450+Math.cos(a)*55]],'#bcc4b4',4);if(u>.22){oval(mix(x0,510,v),mix(510,225,v)-Math.sin(v*Math.PI)*205,4-v*2,4-v*2,'#fff8d8');if(v===1)text('NICE SHOT',510,194,15,'#ffe19a');}}}
    function mountains(day=true){gradient(day?'#96b4b7':'#12243b',day?'#e7c491':'#56656c');if(!day){stars(65);moon(815,115,30);}for(let k=0;k<4;k++){const pts=[[0,570]];for(let x=0;x<=1000;x+=80)pts.push([x,180+k*65+Math.sin(x*.005+k)*55+Math.cos(x*.014+k)*28]);pts.push([960,570]);poly(pts,['#879d9d','#647f80','#456867','#2e504c'][k]);}for(let i=0;i<15;i++)tree(i*83,540+(i%3)*12,100+(i%4)*19,'#274d42');}
    function jeep(x,y,scale=1,color='#bf6040',moving=false){p.save();p.translate(x,y+(moving?Math.sin(t*9)*1.3:0));p.scale(scale,scale);oval(0,8,111,11,'#0a292c44');rect(-106,-63,213,61,color,8);rect(-62,-109,127,55,color,7);rect(-54,-101,48,36,'#9fbec0',3);rect(3,-101,53,36,'#a8c6c3',3);rect(-4,-101,4,37,'#514a3a');line([[-76,-48],[-76,-19],[17,-19],[17,-51]],'#6f433399',2);rect(-120,-54,14,40,'#343d38',3);rect(100,-35,13,14,'#fff0b8',2);rect(-105,-17,214,9,'#3e4b43',2);for(const xx of [-67,68]){oval(xx,0,29,29,'#20322e');oval(xx,0,16,16,'#84918a');for(let i=0;i<5;i++){const a=i*TAU/5+(moving?t*3:0);line([[xx,0],[xx+Math.cos(a)*13,Math.sin(a)*13]],'#c1c6b0',3);}}p.restore();}
    function tent(x,y,label,color='#b98659'){rect(x-74,y-74,148,75,'#c8af7b');poly([[x-88,y-78],[x,y-126],[x+88,y-78]],color);rect(x-87,y-78,174,12,color);line([[x-80,y-70],[x-80,y+10]],'#7d6e52',3);line([[x+80,y-70],[x+80,y+10]],'#7d6e52',3);rect(x-68,y-15,136,17,'#71583e');text(label,x,y-47,15,'#443e31');}
    function drawJeep(){
      mountains(action!=='astra');if(action==='drive'){poly([[440,290],[530,290],[1000,570],[-30,570]],'#59665e');for(let i=0;i<8;i++)rect(476,300+(i*45+t*100)%270,8,20,'#e5d6aa');jeep(480,459,1.2,options.jeepColor||'#b86645',true);}
      else if(action==='gathering'||action==='grounds'){rect(0,365,960,205,'#a09a76');for(let i=0;i<5;i++)jeep(90+i*197,372,.67,['#8a9e81','#ba6243','#d8ccb0','#6b8492','#4d5755'][i]);if(action==='grounds'){tent(215,280,'JEEP INVASION');tent(740,280,'THE GATHERING','#8c655a');crowd(310,373,8,.64,true);}pair(mix(230,710,ease(u)),530,145,'hold');}
      else {rect(0,455,960,115,'#8a8b69');line([[0,393],[960,393]],'#c3b48a',6);for(let i=0;i<12;i++)rect(i*90,393,5,75,'#9f906b');jeep(190,477,.85,options.jeepColor||'#b86645');pair(570,495,153,action==='astra'?'walk':'hold');if(action==='astra'){rect(625,211,257,62,'#243b37',12);text('ASTRA LUMINA',753,248,25);glow(753,238,140,'#d8db9b24');}}
    }
    function forest(){gradient('#091729','#233c43');stars(80);for(let layer=0;layer<3;layer++)for(let i=0;i<9;i++)tree(i*141-45+layer*33,395+layer*65,270+layer*12,['#172f38','#1b3b3b','#163731'][layer]);poly([[448,330],[518,330],[800,570],[170,570]],'#61736a');for(let i=0;i<16;i++){const x=260+i*29;glow(x,490+(i%3)*15,23,'#b4e4bf30');oval(x,490+(i%3)*15,2,2,'#dbeec0');}}
    function drawAstra(){
      forest();const color=['#93e5dd','#e4d9b3','#c2acef','#a7cbea','#bca1df','#e3d7ab','#8de3d7','#98dfeb','#e5d7a0','#ecc5da'][frame.index];p.save();p.strokeStyle=color;p.shadowColor=color;p.shadowBlur=17;
      if(action==='arch'||action==='photo')for(let k=0;k<5;k++){p.lineWidth=2;p.beginPath();p.ellipse(480,391,150+k*17,240+k*13,0,Math.PI,TAU);p.stroke();}
      if(action==='falling'||action==='rise')for(let i=0;i<66;i++){const x=160+(i*117)%650,y=60+(i*31+t*(action==='rise'?-31:36)+99999)%340;p.globalAlpha=.25+(i%5)/7;star(x,y,2+i%3,color);if(i%4===0)line([[x,y-35],[x,y]],color+'66',1);}
      if(action==='choir')for(let i=0;i<7;i++){p.beginPath();p.ellipse(480,323,80+i*25+Math.sin(t*1.4)*10,25+i*10,0,0,TAU);p.stroke();}
      if(action==='rays')for(let i=0;i<13;i++){p.globalAlpha=.15+(1+Math.sin(t+i))*.1;poly([[100+i*65,70],[135+i*65,70],[600+i*25,450],[560+i*25,450]],color);}
      if(action==='waves')for(let j=0;j<9;j++){const pts=[];for(let x=80;x<900;x+=8)pts.push([x,190+j*20+Math.sin(x*.013+t+j*.5)*31]);line(pts,color+(j%2?'66':'aa'),3);}
      if(action==='visions'){p.beginPath();p.ellipse(480,237,170,76,0,0,TAU);p.stroke();p.beginPath();p.arc(480,237,64,0,TAU);p.stroke();star(480,237,27,color);}
      if(action==='trail')for(let i=0;i<80;i++)star(300+(i*123)%360,320+(i*31)%210,2,color);
      if(action==='genesis'){for(let i=0;i<7;i++){p.globalAlpha=.1+i*.03;p.beginPath();p.arc(480,240,57+i*15+Math.sin(t*2)*6,0,TAU);p.stroke();}p.globalAlpha=1;glow(480,240,120,'#94dce959');oval(480,240,45,45,'#9ae2e8');star(480,240,19,'#ffefbb');}
      p.restore();
      if(action==='photo'){embrace(480,526,158,true);if(u>.48&&u<.53)rect(0,0,960,570,'#fff9dfbb');if(u>.65)strip(742,230,ease((u-.65)/.35));}
      else pair(480+Math.sin(u*Math.PI)*15,531,148,u<.65?'walk':'hold');
      for(let i=0;i<16;i++)oval(90+(i*173)%800,160+(i*79+t*9)%300,1.5,1.5,'#daf8bc88');
    }
    function stage(label='ATLANTA',community=false){gradient('#141c30','#4d3846');rect(60,90,840,325,'#1d2434');rect(80,110,800,250,community?'#576254':'#282b44');for(let i=0;i<20;i++)star(100+i*43,145+(i*47)%160,2,'#ddbf8644');for(const x of [55,845]){rect(x,80,60,345,community?'#a24f47':'#653b56');for(let j=0;j<6;j++)rect(x+j*10,80,3,340,'#311c2e44');}rect(35,412,890,38,'#66504c');rect(35,450,890,22,'#372f38');text(label,480,145,26);for(let i=0;i<5;i++){const x=130+i*175;poly([[x,80],[x+Math.sin(t*.6+i)*90-90,412],[x+Math.sin(t*.6+i)*90+90,412]],['#b6d9d91a','#edb4b71a','#e8ce851a'][i%3]);oval(x,83,11,6,'#e8d4a8');}crowd(0,513,23,.7,true);}
    function performer(x,y,kind='singer',scale=1){p.save();p.translate(x,y);p.scale(scale,scale);const sway=Math.sin(t*2.6)*3;rect(-25+sway,-113,50,94,kind==='singer'?'#292c31':'#c85c51',12);poly([[-24+sway,-90],[30+sway,-75],[38+sway,-4],[-36+sway,-4]],kind==='singer'?'#3f4548':'#b34355');line([[-19+sway,-83],[9+sway,-30]],kind==='singer'?'#b9a270':'#e8bf72',5);oval(sway,-135,21,25,'#bb926d');oval(sway,-155,23,10,kind==='singer'?'#b9bbb2':'#3c292b');oval(sway,-136,2.5,3,'#a53b43');line([[-10+sway,-124],[10+sway,-124]],'#735244',1);line([[-23+sway,-100],[-42+sway,-64+Math.sin(t*3)*8]],'#bd926e',8);line([[22+sway,-100],[34+sway,-130+Math.sin(t*2)*4]],'#bd926e',8);rect(-18,-12,12,13,'#29292c',3);rect(9,-12,12,13,'#29292c',3);p.restore();}
    function drawConcert(){stage('USHA UTHUP · LIVE');performer(480,392,'singer',1.2);line([[520,390],[520,241],[504,238]],'#b7b9a8',3);oval(501,239,10,5,'#9eaca6');for(const x of [248,725]){performer(x,390,'band',.75);if(x===248){line([[x-42,338],[x+50,291]],'#b68e59',6);oval(x-14,326,25,34,'#966b45');}else{rect(x-48,329,96,14,'#c8c9b7');for(let i=0;i<12;i++)rect(x-44+i*8,329,2,10,'#39453f');}}
      if(action==='arrive')pair(mix(215,480,ease(u)),555,130,'walk');else pair(480,555,146,action==='dance'?'dance':'clap',90);
      if(action==='applause')for(let i=0;i<25;i++)star(90+(i*131)%800,80+(i*73+t*18)%300,2,'#ead8a380');
    }
    function festival(){gradient('#8eaca2','#ecd1a0');rect(0,350,960,220,'#b49b73');rect(220,112,520,252,'#c39164');rect(245,126,470,225,'#a94d41');poly([[200,116],[480,47],[760,116]],'#a45c42');rect(370,153,220,195,'#593b38');for(let i=0;i<4;i++){rect(235+i*158,117,13,245,'#ebc482');for(let j=0;j<14;j++)oval(241+i*158,132+j*15,6,6,j%2?'#e4b45d':'#c97a3e');}for(let i=0;i<30;i++){const x=248+i*16,y=140+Math.sin(i/29*Math.PI)*28;oval(x,y,5,5,i%2?'#e0af51':'#bf6d3e');}
      for(let i=0;i<16;i++){const a=i*TAU/16;oval(480+Math.cos(a)*62,277+Math.sin(a)*62,9,15,'#e9bf7355');}oval(480,277,42,42,'#d9a85e22');
      for(let i=0;i<16;i++){const a=i*TAU/16;line([[480,420],[480+Math.cos(a)*80,420+Math.sin(a)*25]],'#f1e3b6aa',2);}p.strokeStyle='#efe4bd';p.lineWidth=2;for(const r of [32,57,83]){p.beginPath();p.ellipse(480,420,r,r*.31,0,0,TAU);p.stroke();}
      for(const x of [120,840]){tree(x,360,200,'#556f47');glow(x,300,45,'#f8cb8720');}crowd(40,409,5,.62);crowd(740,408,5,.62);
    }
    function diya(x,y,on=true){oval(x,y,25,8,'#9c5b35');oval(x,y-3,20,5,'#c88b45');if(on){glow(x,y-17,64,'#ffce7938');oval(x,y-18+Math.sin(t*6+x)*1.4,4,13,'#ffe2a0');oval(x,y-17,2,6,'#fff4ce');}}
    function drawPuja(){festival();if(action==='arrive'||action==='walk')pair(mix(240,480,ease(u)),514,146,'hold');else pair(480,520,151,action==='lamps'?'give':'hold',85);for(let i=0;i<4;i++)diya(330+i*100,442,action==='lamps'?u>(i+1)*.18:action==='prayer'||action==='leave');if(action==='prayer'){glow(480,390,240,'#e7aa5b20');pair(480,520,151,'pray',85);}if(action==='leave')pair(mix(480,745,ease(u)),520,146,'hold');}
    function ringBox(x,y,size=1,open=0){p.save();p.translate(x,y);p.scale(size,size);oval(0,12,85,14,'#352d242b');rect(-80,-5,160,45,'#d5ccb1',12);rect(-70,0,140,28,'#f2e8cd',8);p.save();p.translate(0,-4);p.scale(1,Math.max(.12,1-open*.82));rect(-80,-86,160,86,'#e9dfc6',12);text('SWAROVSKI',0,-41,14,'#a59172');p.restore();if(open>.2){p.globalAlpha=ease((open-.2)/.8);p.strokeStyle='#dbb35e';p.lineWidth=6;p.beginPath();p.ellipse(0,-2,24,13,0,0,TAU);p.stroke();poly([[-13,-24],[0,-31],[14,-24],[10,-9],[-10,-9]],'#e5f7f0');line([[-13,-24],[0,-16],[14,-24]],'#b7d5ce',1);star(0,-26,7+(1+Math.sin(t*3))*3,'#fff8de');p.globalAlpha=1;}p.restore();}
    function drawRing(){room();table(475);flowers(270,430,.9);rect(600,426,118,54,'#efe4c7',2);text('For my Lokkhi ♡',658,450,11,'#80634c');if(action==='table'){ringBox(470,450,1,0);pair(480,422,155,'sit',170);}if(action==='give'){pair(480,460,164,'give',112);ringBox(mix(432,522,ease(u)),mix(381,373,ease(u)),.48,0);}if(action==='open'){pair(480,422,155,'sit',170);ringBox(480,434,1.25,ease(clamp(u*2)));twinkles(480,383);}if(action==='embrace'){embrace(480,452,167);ringBox(650,463,.6,1);}}
    function dancer(x,y,i){p.save();p.translate(x,y);p.rotate(Math.sin(t*2+i)*.08);const color=['#c65b62','#ba8547','#6b9e93'][i%3];poly([[-13,-75],[13,-75],[40+Math.sin(t*2+i)*6,0],[-40,0]],color);line([[-12,-65],[-43,-95+Math.sin(t*3+i)*12]],'#c69a72',6);line([[12,-65],[43,-95+Math.cos(t*3+i)*12]],'#c69a72',6);oval(0,-92,13,16,'#c69a72');oval(0,-104,14,6,'#3f3029');line([[-35,-5],[35,-5]],'#e8c47d',4);p.restore();}
    function drawCommunity(){
      if(action==='arrive'||action==='leave'){festival();tent(135,342,'FESTIVAL OF INDIA');pair(mix(action==='arrive'?250:480,action==='arrive'?480:720,ease(u)),527,143,'hold');}
      else if(action==='meal'){festival();pair(480,446,153,'sit',130);table(460);dish(420,474);dish(547,474);diya(640,467);}
      else{stage(action==='culture'?'CULTURE & PERFORMANCES':action==='drama'?'DRAMA':'KIRTAN & BHAJAN',true);if(action==='culture')for(let i=0;i<4;i++)dancer(300+i*120,409,i);if(action==='drama'){performer(392,413,'band',.85);performer(572,413,'band',.85);rect(470,321,12,90,'#7e6545');text('◇',476,316,23,'#e4c688');}if(action==='music'){for(let i=0;i<3;i++){performer(330+i*150,405,'band',.8);oval(330+i*150,371,27,12,'#b89568');line([[315+i*150,365],[342+i*150,365]],'#e3c79a',3);}for(let i=0;i<5;i++)text('♪',270+i*95,222-Math.sin(t+i)*17,22,'#e9d79a');}pair(480,556,142,'sit',90);}
    }
    function pumpkin(x,y,r=35,design='',lit=false){
      const g=p.createRadialGradient(x-r*.3,y-r*.4,1,x,y,r);g.addColorStop(0,'#e5a456');g.addColorStop(1,'#ad602b');oval(x,y,r,r*.85,g);for(let i=-2;i<=2;i++){p.strokeStyle='#81502c44';p.lineWidth=1.5;p.beginPath();p.ellipse(x+i*r*.10,y,r*(.75-Math.abs(i)*.13),r*.83,0,-Math.PI/2,Math.PI/2);p.stroke();}rect(x-4,y-r*.86-11,9,19,'#676943',3);if(!design)return;
      p.save();p.translate(x,y);p.scale(r/100,r/100);p.fillStyle=lit?'#ffe197':'#543c28';if(lit){p.shadowColor='#ffd278';p.shadowBlur=17;glow(0,0,110,'#ffcb6332');}p.fillStyle=lit?'#ffe197':'#543c28';if(design==='classic'){poly([[-58,-17],[-20,-17],[-39,-50]],p.fillStyle);poly([[20,-17],[58,-17],[39,-50]],p.fillStyle);poly([[-11,9],[11,9],[0,-13]],p.fillStyle);p.fillStyle=lit?'#ffe197':'#543c28';p.beginPath();p.moveTo(-65,25);p.quadraticCurveTo(0,95,65,25);p.lineTo(40,62);p.lineTo(7,60);p.lineTo(-5,70);p.lineTo(-32,58);p.closePath();p.fill();}else{oval(0,-5,53,57,lit?'#ffe197':'#543c28');oval(-22,-13,15,20,'#a5602c');oval(22,-13,15,20,'#a5602c');poly([[0,13],[-9,29],[9,29]],'#a5602c');for(let i=0;i<4;i++)rect(-32+i*20,41,5,21,'#a5602c');}p.restore();
    }
    function patch(){gradient('#aabfb3','#e4ca96');rect(0,340,960,230,'#a4a06d');rect(145,132,665,210,'#92483b');poly([[125,140],[480,48],[830,140]],'#704337');for(let i=0;i<30;i++)rect(150+i*22,145,2,193,'#542c3144');rect(380,192,200,150,'#353830');rect(198,164,562,37,'#e1cb9a',4);text('THE GREAT PUMPKIN PATCH',479,190,24,'#51432f');for(let i=0;i<18;i++){const x=45+(i%9)*107,y=375+Math.floor(i/9)*102;pumpkin(x,y,22+i%3*6);}rect(690,358,185,35,'#8c714c');line([[700,393],[683,420]],'#5a4c38',6);for(const x of [718,850]){oval(x,414,28,28,'#663b36');oval(x,414,23,23,'#ac8e63');for(let j=0;j<8;j++){const a=j*TAU/8;line([[x,414],[x+Math.cos(a)*23,414+Math.sin(a)*23]],'#643f36',3);}}for(let i=0;i<4;i++)pumpkin(710+i*47,353,23);}
    function drawPumpkins(){patch();if(action==='arrive'||action==='choose')pair(mix(230,500,ease(u)),525,147,'walk',110);if(action==='pick'){pair(480,523,148,u<.55?'crouch':'hold',135);for(const x of [413,548])pumpkin(x,mix(500,450,ease(clamp((u-.4)*3))),30);}if(action==='pose'){pair(500,521,151,'hold',106);pumpkin(449,461,32);pumpkin(553,461,32);if(u>.62&&u<.66)rect(0,0,960,570,'#fff3cc66');}}
    function drawCarving(){room(action==='light'||action==='reveal');pair(480,439,158,action==='carve'?'carve':'sit',215);table(468);const reveal=action==='light'||action==='reveal';pumpkin(375,445,65,action==='table'?'':action==='carve'&&u<.48?'':'classic',reveal);pumpkin(585,445,65,action==='table'?'':action==='carve'&&u<.68?'':'skull',reveal);for(let i=0;i<15;i++)poly([[440+i*9,493+i%3*3],[444+i*9,486+i%4*3],[449+i*9,494+i%3*3]],'#d98b3b');if(action==='carve'){line([[380+Math.sin(t*5)*8,408],[390+Math.sin(t*5)*8,433]],'#c5c6b0',4);line([[580+Math.sin(t*5)*8,408],[590+Math.sin(t*5)*8,433]],'#c5c6b0',4);}if(action==='reveal')heart(480,280,.6);}
    function drawHaunt(){
      gradient('#101c2c','#343c3c');rect(100,75,760,400,'#252f34');for(let i=0;i<18;i++)line([[105+i*43,80],[105+i*43,473]],'#182127',2);rect(385,132,190,336,'#0c1823',5);rect(403,145,153,318,'#172d34');
      if(action==='entrance'){rect(220,76,520,58,'#6d6152',4);text('WAREHOUSE31 · UNCHAINED',480,113,26);}
      if(action==='chains')for(let i=0;i<10;i++)for(let j=0;j<13;j++){p.strokeStyle='#9ba49b88';p.lineWidth=2;p.beginPath();p.ellipse(110+i*81+Math.sin(t+i)*5,105+j*21,5,11,0,0,TAU);p.stroke();}
      if(action==='mirrors')for(const x of [235,725]){rect(x-85,177,170,240,'#839288',9);rect(x-75,187,150,220,'#314b50',6);p.save();p.globalAlpha=.45;pair(x,405,108,'walk',60);p.restore();line([[x-64,388],[x+58,212]],'#b7d2ca55',2);}
      if(action==='fog'||action==='chains')for(let i=0;i<9;i++)oval((i*167+t*12)%1250-130,435+Math.sin(t+i)*20,170,33,'#bbdbd319');
      if(action==='exit'){rect(390,119,180,38,'#527b61',5);text('EXIT',480,147,24,'#dceacb');glow(480,219,200,'#c5d9aa33');embrace(480,532,157);}
      else{const close=action==='chains'||action==='fog';pair(480+Math.sin(u*Math.PI)*70,536,151,'hold',close?56:82);if(!options.gentle&&action==='fog'&&u>.45&&u<.53){p.globalAlpha=.28;oval(480,257,29,39,'#d5e2cd');oval(471,251,4,7,'#142834');oval(489,251,4,7,'#142834');p.globalAlpha=1;}}
    }
    function rose(x,y){line([[x,y],[x+8,y-70]],'#69905b',3);poly([[x+4,y-25],[x+25,y-44],[x+18,y-22]],'#658957');for(let i=0;i<7;i++)oval(x+8+Math.sin(i*2)*8,y-72+Math.cos(i*2)*6,7,6,i%2?'#ac304e':'#d04a60');}
    function drawAddams(){room(true);for(let i=0;i<4;i++)diya(150+i*218,380);if(action==='reveal')pair(480,495,186,'idle',133);if(action==='rose'){pair(480,495,183,'give',102);rose(488,431);}if(action==='dance'){const sway=Math.sin(t*1.4)*65;pair(480+sway,492,180,'dance',75);heart(480+sway,277,.6);}if(action==='pose'){embrace(480,495,185,true);if(u>.6&&u<.64)rect(0,0,960,570,'#f5e4df88');}}
    function necklace(x,y,size=1){p.save();p.translate(x,y);p.scale(size,size);p.strokeStyle='#dfba61';p.lineWidth=3;p.beginPath();p.ellipse(0,-13,23,34,0,0,TAU);p.stroke();oval(0,21,15,15,'#a93645');poly([[3,8],[-9,23],[-1,23],[-5,35],[11,18],[3,18]],'#ffdf76');p.restore();}
    function strip(x,y,v=1){p.save();p.translate(x,y);p.rotate(.08);rect(-47,-105,94,Math.max(2,214*v),'#f1e5c7',3);p.beginPath();p.rect(-44,-102,88,209*v);p.clip();for(let i=0;i<4;i++){rect(-39,-96+i*49,78,43,['#445954','#6b5d69','#566552','#51485c'][i]);actor('him',-12,-56+i*49,35,'hug',0);actor('her',12,-56+i*49,34,'hug',0,true);if(i===0)necklace(0,-76,.20);if(i===3)heart(0,-83+i*49,.16);}p.restore();}
    function drawNecklace(){gradient('#b1bcb2','#e6d7b8');rect(0,94,960,294,'#d9cfb4');rect(80,138,240,210,'#65766f',5);rect(101,159,198,167,'#324a4d',3);text('LOVE MALL',201,129,21,'#786246');rect(680,99,218,330,'#6d5e68',8);text('PHOTO BOOTH',790,136,20,'#e9d5b7');rect(702,160,174,229,'#302f44',3);for(let i=0;i<9;i++)rect(702+i*20,160,5,230,'#75607555');rect(0,421,960,149,'#9e947e');for(let i=0;i<12;i++)line([[i*99,421],[i*99-70,570]],'#c7bda25a',1);
      if(action==='booth')pair(mix(775,480,ease(u)),523,158,'walk',82);
      if(action==='gift'){pair(480,523,165,'give',107);necklace(mix(450,523,ease(u)),410,.65);}
      if(action==='ask'){pair(480,523,165,'hold',112);necklace(536,429,.23);heart(480,315,.6);}
      if(action==='yes')embrace(480,523,173,u>.55);
      if(action==='print'){embrace(480,523,173,true);strip(748,mix(155,320,ease(u)),clamp(u*2));if(u<.06)rect(0,0,960,570,'#fff4cfaa');}
      if(action==='ask'||action==='yes')for(let i=0;i<7;i++){const xx=345+i*43,yy=455-(t*22+i*51)%220;p.strokeStyle='#eddfca66';p.lineWidth=1;p.beginPath();p.arc(xx,yy,6+i%3*3,0,TAU);p.stroke();}
    }
    const draws={homecoming:drawHome,sky:drawSky,park:drawPark,baseball:drawBaseball,swimming:drawSwim,topgolf:drawGolf,jeep:drawJeep,astra:drawAstra,concert:drawConcert,puja:drawPuja,ring:drawRing,community:drawCommunity,pumpkins:drawPumpkins,carving:drawCarving,haunt:drawHaunt,addams:drawAddams,necklace:drawNecklace};
    function render(id,time,settings={}) {
      t=time;frame=F.locate(id,time);u=frame.progress;action=frame.shot.action;
      p.save();p.setTransform(1,0,0,1,0,0);p.clearRect(0,0,960,570);p.fillStyle='#11232b';p.fillRect(0,0,960,570);
      p.save();const [cx,cy,z]=frame.shot.camera,zoom=settings.reducedMotion?1:z+(u*.025);p.translate(480,225);p.scale(zoom,zoom);p.translate(-cx-(settings.reducedMotion?0:Math.sin(u*Math.PI)*5),-cy);(draws[id]||drawHome)();p.restore();
      // Vignette and letterbox live outside camera transforms, as do captions.
      const vignette=p.createRadialGradient(480,280,160,480,280,590);vignette.addColorStop(0,'#07182600');vignette.addColorStop(1,'#07182665');rect(0,0,960,570,vignette);
      if(!settings.thumbnail){rect(0,0,960,34,'#0c1b21f2');rect(0,505,960,65,'#0c1b21ed');text(frame.shot.title,25,23,14,'#edd7a6','left');text(String(frame.index+1).padStart(2,'0')+' / '+F.get(id).length,934,23,12,'#a9bfb7','right');text(frame.shot.caption,480,541,18);rect(0,567,960*clamp(time/F.duration(id)),3,'#dcb77c');}
      const cross=clamp((.55-Math.min(u*frame.shot.duration,(1-u)*frame.shot.duration))/.55);
      if(!settings.thumbnail&&cross>0)rect(0,34,960,471,'#0c1b21'+Math.round(cross*190).toString(16).padStart(2,'0'));
      p.restore();return {id,time,index:frame.index,title:frame.shot.title,action,progress:u};
    }
    return {render,drawPose(who,x,y,size,pose,time,flip){t=time;actor(who,x,y,size,pose,t,flip);}};
  }

  function create(memory, options, makeActivity) {
    options.canvas.style.touchAction='pan-y';
    const duration=F.duration(memory.id),saved=window.OUR_YEAR.detail('film-'+memory.id);
    let time=0,paused=false,disposed=false,completed=false,activity=null,notified=-1;
    let reduced=false;try{reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}
    const filmOptions={...options,images:{...options.images}};
    // The Halloween film always shows its costumes, without changing the
    // player's equipped clothes merely because they watched a preview.
    if(memory.id==='addams'&&window.SharedWardrobe){
      Promise.all([
        window.SharedWardrobe.render({who:'him',kind:'suit',color:'#171b2e',trim:'#b5c9d2',pattern:'stripes',strokes:[]},false),
        window.SharedWardrobe.render({who:'her',kind:'dress',color:'#17131e',trim:'#9b7fa7',pattern:'none',strokes:[]},false)
      ]).then(([him,her])=>{if(!disposed)filmOptions.images={him,her};}).catch(()=>options.status('The Halloween costumes could not load; your current outfits are shown.'));
    }
    if(window.SharedWardrobe&&['swimming','homecoming'].includes(memory.id)){
      const cast=memory.id==='swimming'?['him','her']:['her'];
      Promise.all(cast.map(who=>window.SharedWardrobe.occasionSheet(who,memory.id))).then(sheets=>{if(!disposed)cast.forEach((who,i)=>filmOptions.images[who]=sheets[i]);}).catch(()=>options.status('The occasion outfits could not load. Your current outfits are shown.'));
    }
    const screen=renderer(options.canvas,filmOptions),controls=options.controls;
    const add=(label,fn,cls)=>{const b=document.createElement('button');b.type='button';b.textContent=label;if(cls)b.className=cls;b.onclick=fn;controls.appendChild(b);return b;};
    let playButton,seekInput,clock,chapterSelect;
    function stamp(n){return Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');}
    function sync(){if(!seekInput)return;seekInput.value=time;clock.textContent=stamp(time)+' / '+stamp(duration);playButton.textContent=paused?'Play ▶':'Pause Ⅱ';playButton.setAttribute('aria-pressed',String(!paused));const info=F.locate(memory.id,time);chapterSelect.value=String(info.index);if(info.index!==notified){notified=info.index;options.status(info.shot.title+' · '+info.shot.caption);if(options.tone)options.tone([0,2,4,7,9][info.index%5]);}}
    function complete(){if(completed)return;completed=true;try{window.OUR_YEAR.detail('film-'+memory.id,{watched:true,seconds:duration});}catch(e){options.status('The film finished, but this browser could not save its progress.');}if(options.complete)options.complete(memory.id,{film:true,chapters:F.get(memory.id).map(s=>s.title)});}
    function seek(value){if(activity)return;time=clamp(Number(value)||0,0,duration);notified=-1;sync();}
    function interactive(){if(!makeActivity)return;options.canvas.style.touchAction='none';activity=makeActivity(memory,options);}
    function build(){
      controls.replaceChildren();controls.classList.add('film-controls');
      playButton=add('Pause Ⅱ',()=>{if(time>=duration)time=0;paused=!paused;sync();},'primary');
      add('Replay ↻',()=>{time=0;paused=false;notified=-1;sync();});
      const label=document.createElement('label');label.textContent='Scene';chapterSelect=document.createElement('select');chapterSelect.setAttribute('aria-label','Choose a cutscene chapter');F.get(memory.id).forEach((s,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=(i+1)+'. '+s.title;chapterSelect.appendChild(o);});chapterSelect.onchange=()=>{seek(F.get(memory.id)[Number(chapterSelect.value)].start+.6);paused=false;sync();};label.appendChild(chapterSelect);controls.appendChild(label);
      const timeline=document.createElement('label');timeline.className='film-timeline';timeline.textContent='Film';seekInput=document.createElement('input');seekInput.type='range';seekInput.min='0';seekInput.max=String(duration);seekInput.step='.1';seekInput.setAttribute('aria-label','Cutscene time');seekInput.oninput=()=>seek(seekInput.value);clock=document.createElement('span');timeline.append(seekInput,clock);controls.appendChild(timeline);
      add('Less camera motion',e=>{reduced=!reduced;const b=e.currentTarget;b.textContent=reduced?'Camera motion off':'Less camera motion';b.setAttribute('aria-pressed',String(reduced));});
      if(memory.id==='haunt')add('Gentle scares',e=>{filmOptions.gentle=!filmOptions.gentle;e.currentTarget.textContent=filmOptions.gentle?'Gentle scares on':'Gentle scares';});
      if(memory.id==='addams')add('Wear our Addams looks',()=>{window.SharedWardrobe.addams();options.status('Matching Addams outfits saved and equipped.');});
      if(memory.id==='necklace')add('Original mall scene ↗',()=>{location.href='shopping.html?memory=first-yes';});
      if(makeActivity)add('Play the activity ↗',interactive);
      if(saved.watched)add('Watch again from the start',()=>{seek(0);paused=false;sync();});
      sync();
    }
    build();
    return {
      update(dt){if(disposed)return;if(activity){activity.update(dt);return;}if(!paused){time=Math.min(duration,time+Math.min(Math.max(dt,0),.1));if(time>=duration){paused=true;complete();}sync();}},
      draw(){if(disposed)return;if(activity){activity.draw();return;}screen.render(memory.id,time,{reducedMotion:reduced});},
      activate(){if(activity)activity.activate();else{if(time>=duration){time=0;paused=false;}else paused=!paused;sync();}},
      seek,play(){paused=false;sync();},pause(){paused=true;sync();},
      getState:()=>activity?{...activity.getState(),mode:'activity'}:{mode:'film',time,duration,paused,done:completed,chapter:F.locate(memory.id,time).index,action:F.locate(memory.id,time).shot.action},
      dispose(){disposed=true;if(activity)activity.dispose();}
    };
  }
  window.OurYearCinema={renderer,create};
})();
