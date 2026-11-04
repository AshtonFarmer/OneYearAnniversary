// Painted RPG scenery follows the authored footprints in adventure-places.js.
// Code-native props and effects animate discoveries over the fixed artwork;
// a matching procedural layout is retained as a load-failure fallback.
(function(){
 'use strict';
 const W=1536,H=1024,TAU=Math.PI*2,cache=new Map(),painted=new Map(),pending=new Map();let active=null;
 function load(place){if(painted.has(place.id))return Promise.resolve(painted.get(place.id));if(pending.has(place.id))return pending.get(place.id);const job=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{if(painted.size>=4){const oldest=Array.from(painted.keys()).find(id=>id!==active);if(oldest)painted.delete(oldest);}painted.set(place.id,im);resolve(im);};im.onerror=()=>reject(new Error('Detailed scenery could not load. The playable layout is still available.'));im.src='assets/our-year/places/'+place.id+'.webp';}).finally(()=>pending.delete(place.id));pending.set(place.id,job);return job;}
 const palettes={home:['#9b7856','#c19b6d','#dbc29a'],night:['#1b3540','#284549','#d4ba83'],park:['#203e36','#315342','#94a875'],stadium:['#315b42','#45714b','#c4b485'],pool:['#a5b7a3','#ccd0b6','#e5dbbe'],golf:['#204235','#305c40','#bcb282'],jeep:['#687b5b','#889477','#c6b68c'],astra:['#152e36','#20423d','#c5c7a3'],concert:['#292d3f','#3b3c50','#cab38e'],puja:['#8e9271','#ada27e','#e7c88b'],community:['#688164','#8b9c77','#d7be8d'],pumpkins:['#8b8a50','#a5a065','#d2b878'],haunt:['#253038','#34424a','#94a9a3'],halloween:['#46374b','#655063','#cfad86']};
 const hash=(x,y)=>((x*73856093^y*19349663)>>>0)%997/997;
 function painter(p){
  const R=(x,y,w,h,c)=>{p.fillStyle=c;p.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const P=(pts,c)=>{p.fillStyle=c;p.beginPath();pts.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();p.fill();};
  const E=(x,y,rx,ry,c)=>{p.fillStyle=c;p.beginPath();p.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,TAU);p.fill();};
  const L=(pts,c,w=2)=>{p.strokeStyle=c;p.lineWidth=w;p.lineCap='round';p.beginPath();pts.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.stroke();};
  const T=(str,x,y,size=15,c='#eddbb6')=>{p.fillStyle=c;p.font=size+'px Georgia';p.textAlign='center';p.fillText(str,x,y);};
  function glow(x,y,r,c){const g=p.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,c.slice(0,7)+'00');R(x-r,y-r,r*2,r*2,g);}
  function star(x,y,r,c){P([[x,y-r],[x+r*.25,y-r*.25],[x+r,y],[x+r*.25,y+r*.25],[x,y+r],[x-r*.25,y+r*.25],[x-r,y],[x-r*.25,y-r*.25]],c);}
  return {R,P,E,L,T,glow,star};
 }
 function floor(p,kind,x,y,w,h,pal){
  const {R,L,E}=painter(p),base={wood:'#a17f59',stone:'#aaa48d',path:'#baae86',water:'#345e69',pool:'#53b2bd',field:'#4f814e',range:'#356649',road:'#657066',carpet:'#605169',rug:'#a96655',warehouse:'#46504d',grass:pal[1]}[kind]||pal[1];
  R(x-7,y-7,w+14,h+14,kind==='pool'?'#eee3bd':'#273e3a33');R(x,y,w,h,base);
  if(kind==='pool'||kind==='water'){R(x+5,y+5,w-10,h-10,kind==='pool'?'#3b9fae':'#2c5364');return;}
  p.save();p.beginPath();p.rect(x,y,w,h);p.clip();
  for(let j=0;j<h/32;j++)for(let i=0;i<w/32;i++){
   const xx=x+i*32,yy=y+j*32,v=hash(i+31,j+69);
   if(kind==='wood'){L([[xx,yy],[xx+32,yy]],'#624c3d55',1);if(j%2===i%3)L([[xx,yy],[xx,yy+32]],'#624c3d44',1);L([[xx+4,yy+6+v*16],[xx+23,yy+6+v*16]],'#d9b18033',1);}
   else if(kind==='stone'||kind==='warehouse'){L([[xx,yy],[xx+32,yy],[xx+32,yy+32]],'#3d514539',1);R(xx+2,yy+2,29,2,'#e5dbb233');if(v>.85)R(xx+5,yy+20,11,2,'#67766326');}
   else if(kind==='road'){if(v>.8)R(xx+v*10,yy+v*20,5,2,'#dae1bf1a');}
   else if(kind==='carpet'||kind==='rug'){if(i%2===j%2)R(xx+13,yy+13,5,5,'#d6b48b35');}
   else if(kind==='field'||kind==='range'){if(j%4<2)R(xx,yy,32,32,'#a4ba8012');}
   else{if(v>.45){R(xx+v*20,yy+v*23,6,2,'#e5d7a326');R(xx+v*20+2,yy+v*23-3,2,4,'#e5d7a326');}if(v>.92)E(xx+20,yy+13,2,2,'#ead79b55');}
  }p.restore();
 }
 function base(place){
  if(painted.has(place.id))return painted.get(place.id);
  if(cache.has(place.id))return cache.get(place.id);
  const c=document.createElement('canvas');c.width=W;c.height=H;const p=c.getContext('2d'),a=painter(p),{R,P,E,L,T}=a,pal=palettes[place.theme];
  floor(p,'grass',0,0,W,H,pal);
  for(const f of place.floors)floor(p,...f,pal);
  // Map edge treatment is scenery, never a replacement for authored walls.
  const indoor=['home','concert','haunt','halloween'].includes(place.theme);
  if(indoor){R(125,120,1290,85,pal[0]);R(125,195,20,715,'#524940');R(1390,195,25,715,'#524940');R(125,900,570,22,'#524940');R(850,900,565,22,'#524940');L([[145,202],[1390,202]],pal[2],5);for(let x=210;x<1300;x+=240){R(x,129,125,64,'#544d4a');R(x+7,135,111,50,place.theme==='home'?'#284653':'#203742');R(x+59,135,5,50,'#bca87d');R(x+7,159,111,3,'#bca87d');}}
  else{R(80,135,1375,12,'#9c99764d');for(let x=90;x<1450;x+=64){R(x,139,7,50,'#7c806066');}for(let x=120;x<1450;x+=128){E(x,960,34,10,'#233e3426');}}
  R(708,910,120,34,indoor?'#d4bd89':'#8d9d75');R(725,920,88,7,'#e8d4a5');
  if(place.theme==='home'){T('love',770,196,22,'#e6c687');for(const x of [565,1000])for(let j=0;j<8;j++)R(x+j*3,180,2,130-j%3*4,j%2?'#bd963e':'#e4be5a');}
  if(place.theme==='stadium'){
   P([[885,600],[620,420],[885,240],[1150,420]],'#c2a577');P([[885,550],[685,420],[885,285],[1085,420]],'#4f814e');L([[885,600],[490,300]],'#efead0',3);L([[885,600],[1280,300]],'#efead0',3);[[885,592],[635,420],[885,253],[1135,420]].forEach(([x,y])=>P([[x,y-7],[x+8,y],[x,y+7],[x-8,y]],'#eee8d3'));E(885,415,27,14,'#bd9d71');
   for(let x=525;x<1320;x+=28)for(let y=780;y<850;y+=24){R(x,y,13,7,'#7a6354');R(x+4,y-5,5,5,['#be9f7d','#587065','#b88665'][(x+y)%3]);}
  }
  if(place.theme==='golf'){
   for(let i=0;i<22;i++){R(170+i*57,170,2,440,'#b7c4a342');for(let j=0;j<5;j++)R(160,195+j*85,1220,1,'#c7d1ac19');}
   [[400,410,75],[760,280,60],[1100,420,85],[800,540,70]].forEach(([x,y,r],i)=>{E(x,y,r,r*.45,'#9bc2a3');E(x,y,r*.72,r*.31,'#2d7a63');E(x,y,r*.28,r*.12,['#d7bd75','#d3919d','#8fb2c2','#c5cc7b'][i]);});L([[150,632],[1390,632]],'#e6ce7b',8);
  }
  if(place.theme==='jeep'){for(let i=0;i<9;i++)R(190+i*145,805,70,5,'#e4d8b0');for(let i=0;i<9;i++){R(280+i*120,310,2,340,'#ebddad33');}P([[0,135],[150,40],[350,135]],'#546f65');P([[930,135],[1120,25],[1450,135]],'#66817a');}
  if(place.theme==='pool'){for(let i=0;i<8;i++){R(160+i*155,130,110,78,'#d2cbb5');R(177+i*155,143,74,43,'#6c8d8c');R(185+i*155,151,58,27,'#a7c1ba');}L([[480,740],[480,715],[508,701],[532,715],[532,745]],'#e8e9d5',6);}
  if(place.theme==='haunt'){T('WAREHOUSE31 · UNCHAINED',760,170,28,'#c4c3ab');for(let i=0;i<16;i++){L([[160+i*77,240],[180+i*77,270],[168+i*77,310]],'#20313b30',2);}}
  if(place.theme==='halloween'){T('GOOD NIGHT FROM THE ADDAMS',770,175,24,'#dec4d2');for(let i=0;i<20;i++)a.star(300+i*50,228+Math.sin(i)*12,2,'#d9c48f77');}
  if(place.theme==='puja'||place.theme==='community'){
   for(let i=0;i<18;i++){const q=i*TAU/18;a.L([[768+Math.cos(q)*50,565+Math.sin(q)*25],[768+Math.cos(q)*125,565+Math.sin(q)*60]],'#e8dbb58c',2);a.E(768+Math.cos(q)*145,565+Math.sin(q)*70,5,5,'#e8dbb5');}
   for(const r of [62,102,158]){p.strokeStyle='#e8dbb5';p.lineWidth=2;p.beginPath();p.ellipse(768,565,r,r*.48,0,0,TAU);p.stroke();}
  }
  if(['night','park','astra'].includes(place.theme)){
   R(0,0,W,132,'#142833');for(let i=0;i<32;i++){const x=i*51,h=22+i*37%75;R(x,132-h,45,h,i%2?'#253c44':'#1c333d');for(let k=0;k<4;k++)if(i%3)R(x+6+k*9,140-h,3,5,'#e2c3815c');}
   for(let i=0;i<65;i++)a.star(i*139%W,15+i*31%75,i%7?1:2,'#d9e3c180');
  }
  if(cache.size>=4)cache.delete(cache.keys().next().value);cache.set(place.id,c);return c;
 }
 function prop(p,o,t=0,state={flags:{},bag:{}}){
  const {R,P,E,L,T,glow,star}=painter(p),{kind,x,y,w,h}=o;
  if(o.hideWhen&&state.flags[o.hideWhen])return;
  if(o.number!==undefined&&kind==='pumpkin'&&state.flags['pumpkin-'+o.number])return;
  if(kind==='rug'||kind==='mat'||kind==='blanket'){R(x,y,w,h,kind==='mat'?'#4c7654':'#a96860');R(x+5,y+5,w-10,h-10,'#d6b48766');for(let j=0;j<5;j++)L([[x+10,y+15+j*h/5],[x+w-10,y+15+j*h/5]],'#814b4655',2);if(kind==='blanket'){E(x+w*.3,y+h*.35,20,8,'#d1bc8c');E(x+w*.7,y+h*.35,20,8,'#e0cfa8');}return;}
  E(x+w/2,y+h+5,w*.60,9,'#122c3233');
  if(kind==='tree'){
   R(x+w*.38,y-h*.5,w*.24,h*1.5,'#5d503a');L([[x+w*.5,y],[x-10,y-45]],'#69543c',9);const cs=['#294c3a','#355e42','#476d48'];
   for(let i=0;i<10;i++){const xx=x+w/2+Math.sin(i*2)*w*.6,yy=y-h*.6+Math.cos(i*2)*h*.75;P([[xx-30,yy-15],[xx-16,yy-35],[xx+15,yy-39],[xx+38,yy-13],[xx+30,yy+18],[xx-12,yy+26],[xx-34,yy+8]],cs[i%3]);for(let j=0;j<5;j++)R(xx-12+j*7,yy+Math.sin(j+i)*12,9,3,'#96af671c');}return;
  }
  if(kind==='lamp'){
   R(x+w/2-3,y-87,6,110,'#6e6e57');P([[x-4,y-100],[x+w/2,y-119],[x+w+4,y-100]],'#655d48');R(x,y-99,w,27,'#978566');R(x+5,y-96,w-10,20,'#f8dda2');glow(x+w/2,y-84,120,'#f6ce7f35');return;
  }
  if(kind==='bench'||kind==='seat'||kind==='sofa'||kind==='lounger'){
   const sofa=kind==='sofa',c=sofa?'#40564c':kind==='seat'?'#795765':'#9a7c53';R(x,y-28,w,h+28,'#4b4b3b');R(x+4,y-24,w-8,h+21,c);for(let j=0;j<3;j++)R(x+8,y-19+j*9,w-16,3,sofa?'#76847355':'#d3ad763d');R(x-3,y+h-5,w+6,12,sofa?'#627560':'#b29465');R(x+10,y+h+7,7,13,'#4e5847');R(x+w-17,y+h+7,7,13,'#4e5847');if(sofa){R(x+13,y+3,w*.23,h*.6,'#a3936b');R(x+w*.75,y+3,w*.19,h*.6,'#a3936b');}return;
  }
  if(kind==='table'||kind==='counter'){
   R(x+8,y+h-5,10,27,'#534833');R(x+w-18,y+h-5,10,27,'#534833');R(x,y-18,w,h+18,'#6f573e');R(x+3,y-17,w-6,h+11,kind==='counter'?'#b9b198':'#aa8358');L([[x+8,y-10],[x+w-8,y-10]],'#e5c39366',2);for(let i=0;i<w/40;i++)R(x+i*40,y-8,1,h-2,'#5c493e26');
   if(kind==='counter'){R(x+16,y-5,72,46,'#737f77');R(x+22,y,60,34,'#a8b7a5');L([[x+50,y],[x+50,y-20],[x+67,y-20]],'#d4d2b5',4);R(x+w-100,y,65,30,'#4a5449');for(let j=0;j<4;j++)E(x+w-87+j%2*30,y+7+Math.floor(j/2)*13,8,4,'#243f3c');}return;
  }
  if(kind==='shelf'){R(x,y-65,w,h+65,'#594b3c');R(x+7,y-58,w-14,h+50,'#786245');for(let j=0;j<3;j++){R(x,y-20+j*h/3,w,6,'#c2a274');for(let i=0;i<5;i++)R(x+12+i*(w-20)/5,y-48+j*h/3,10,26,['#7f8e6f','#aa6e66','#c6b077'][i%3]);}return;}
  if(kind==='wall'){R(x,y-72,w,h+72,'#243039');R(x+3,y-68,w-6,12,'#65706b');for(let j=0;j<6;j++)R(x,y-49+j*16,w,1,'#74827726');return;}
  if(kind==='mirror'){R(x,y-90,w,h+90,'#a5b1a4');R(x+7,y-83,w-14,h+74,'#426068');L([[x+12,y+h-15],[x+w-18,y-70]],'#a3bcb744',4);return;}
  if(kind==='chains'){for(let i=0;i<6;i++)for(let j=0;j<8;j++){p.strokeStyle='#a4afa477';p.lineWidth=2;p.beginPath();p.ellipse(x+10+i*w/6+Math.sin(t+i)*3,y-60+j*16,4,8,0,0,TAU);p.stroke();}return;}
  if(kind==='flowers'){
   R(x+w*.3,y-10,w*.4,h+10,'#728d78');for(let i=0;i<8;i++){const xx=x+w/2+Math.sin(i*2)*w*.40,yy=y-15+Math.cos(i*2)*h*.3;L([[x+w/2,y+h*.5],[xx,yy]],'#4a6d45',2);for(let j=0;j<5;j++)E(xx+Math.sin(j*1.257)*4,yy+Math.cos(j*1.257)*4,4,4,i%2?'#b84b58':'#d5776c');}return;
  }
  if(kind==='gift'){R(x,y,w,h,'#ded6ba');R(x+w*.43,y-17,w*.14,h+17,'#ba8b7d');R(x,y+h*.42,w,h*.13,'#ba8b7d');P([[x+w/2,y],[x+w*.25,y-22],[x+w*.1,y-8]],'#ddad97');P([[x+w/2,y],[x+w*.8,y-22],[x+w*.92,y-8]],'#ddad97');return;}
  if(kind==='telescope'){L([[x+w/2,y+8],[x+5,y+h],[x+w/2,y+8],[x+w,y+h]],'#8e967d',6);P([[x+5,y-45],[x+20,y-63],[x+w+15,y-16],[x+w,y]],'#b5bca4');P([[x+4,y-47],[x+18,y-65],[x+25,y-57],[x+12,y-39]],'#506b6d');return;}
  if(kind==='pumpkin'){pumpkin(p,x+w/2,y+h/2,w/2);return;}
  if(kind==='jeep'){
   const c=o.color||'#bb6340';R(x,y-20,w,h+15,'#314b42');R(x+5,y-55,w-10,h+45,c);R(x+15,y-68,w-30,41,c);R(x+21,y-62,w*.30,31,'#a0bbba');R(x+w*.55,y-62,w*.26,31,'#9fb7b4');R(x-6,y+h*.2,12,h*.8,'#263d36');R(x+w-6,y+h*.2,12,h*.8,'#263d36');R(x+7,y+h-7,w-14,9,'#53665b');R(x+12,y+h-18,16,8,'#f1e4b9');R(x+w-28,y+h-18,16,8,'#f1e4b9');for(let j=0;j<6;j++)R(x+35+j*9,y+h-23,4,18,'#8c543c');return;
  }
  if(kind==='wagon'){
   for(const xx of [x+22,x+w-24]){E(xx,y+h+2,22,22,'#64443b');E(xx,y+h+2,16,16,'#b59c71');for(let j=0;j<8;j++){const a=j*TAU/8;L([[xx,y+h+2],[xx+Math.cos(a)*16,y+h+2+Math.sin(a)*16]],'#73533d',2);}}
   R(x,y,w,h,'#82704b');for(let j=0;j<4;j++)R(x+4,y+6+j*18,w-8,4,'#b29a63');for(let i=0;i<4;i++)pumpkin(p,x+25+i*(w-40)/4,y+15,18);return;
  }
  if(kind==='stall'){
   R(x+5,y-40,7,h+50,'#7e6b45');R(x+w-12,y-40,7,h+50,'#7e6b45');R(x,y+h-20,w,25,'#98754b');R(x+7,y+h-27,w-14,10,'#d6ba7b');P([[x-14,y-40],[x+w/2,y-94],[x+w+14,y-40]],'#a55f51');R(x-14,y-42,w+28,15,'#bf7961');for(let i=0;i<6;i++)R(x-12+i*(w+24)/6,y-40,(w+24)/12,13,'#edcd9566');R(x+8,y-24,w-16,37,'#ddc493');T(o.label||'WELCOME',x+w/2,y,Math.min(14,w/12),'#654e37');for(let i=0;i<5;i++)E(x+20+i*(w-35)/5,y+h-32,6,5,['#ba7450','#d2b45f','#81936d'][i%3]);return;
  }
  if(kind==='barn'||kind==='pandal'||kind==='stage'){
   const c=kind==='barn'?'#9f4b3d':kind==='pandal'?'#ae6750':'#54445a';R(x,y-65,w,h+60,c);P([[x-17,y-65],[x+w/2,y-130],[x+w+17,y-65]],kind==='stage'?'#65515d':'#825640');R(x+w*.3,y-40,w*.40,h+30,'#3b3c37');R(x+8,y-56,12,h+50,'#d6b17b');R(x+w-20,y-56,12,h+50,'#d6b17b');
   if(kind==='barn'){R(x+25,y-31,w-50,36,'#e8d1a3');T('THE GREAT PUMPKIN PATCH',x+w/2,y-5,18,'#685033');}
   if(kind==='pandal'){for(let i=0;i<25;i++){const xx=x+22+i*(w-44)/24,yy=y-36+Math.sin(i/24*Math.PI)*24;E(xx,yy,5,5,i%2?'#dcb15f':'#ce8549');}for(let i=0;i<12;i++){const a=i*TAU/12;E(x+w/2+Math.cos(a)*44,y+h*.3+Math.sin(a)*34,7,11,'#e2bb74');}R(x+w*.25,y+h-7,w*.5,12,'#ccb68b');}
   if(kind==='stage'){R(x-12,y+h-7,w+24,16,'#b39370');for(const xx of [x+14,x+w-46]){R(xx,y-58,32,h+45,'#835567');for(let i=0;i<4;i++)R(xx+i*8,y-58,2,h+45,'#492b4c44');}}
   return;
  }
  if(kind==='scoreboard'){R(x,y-58,w,h+55,'#3a4f4b');R(x+7,y-51,w-14,h+42,'#233b3c');T('REGIONS FIELD',x+w/2,y-17,24,'#e9d9ad');T(state.flags['baseball-game']?'THANKS FOR COMING':'PLAY BALL',x+w/2,y+20,17,'#aeca9b');return;}
  if(kind==='arch'){p.strokeStyle='#b6ded0';p.shadowColor='#91d5d1';p.shadowBlur=12;p.lineWidth=4;p.beginPath();p.ellipse(x+w/2,y+h,w/2,h+75,0,Math.PI,TAU);p.stroke();p.shadowBlur=0;return;}
  if(kind==='umbrella'){P([[x-w,y],[x,y-62],[x+w*2,y]],'#b2c7af');R(x+w*.45,y,5,h+12,'#947f5e');}
 }
 function pumpkin(p,x,y,r,design='',lit=false){const {E,R,P,L,glow}=painter(p);E(x,y,r,r*.80,'#c7813c');E(x-r*.24,y-r*.18,r*.7,r*.6,'#dc9c4b');R(x-3,y-r*.8-8,7,13,'#6c7144');for(let i=-1;i<=1;i++){p.strokeStyle='#99653566';p.lineWidth=1;p.beginPath();p.ellipse(x+i*r*.10,y,r*(.65-Math.abs(i)*.15),r*.76,0,-Math.PI/2,Math.PI/2);p.stroke();}if(!design)return;const col=lit?'#ffe49b':'#654428';if(lit)glow(x,y,r*2,'#ffd78140');if(design==='classic'){for(const s of [-1,1])P([[x+s*r*.35-r*.15,y-r*.17],[x+s*r*.35+r*.15,y-r*.17],[x+s*r*.35,y-r*.48]],col);P([[x-r*.08,y+r*.03],[x+r*.08,y+r*.03],[x,y-r*.13]],col);L([[x-r*.55,y+r*.17],[x-r*.27,y+r*.38],[x+r*.25,y+r*.38],[x+r*.55,y+r*.17]],col,4);}else{E(x,y,r*.46,r*.50,col);E(x-r*.18,y-r*.13,r*.12,r*.16,'#bb793a');E(x+r*.18,y-r*.13,r*.12,r*.16,'#bb793a');for(let i=0;i<4;i++)R(x-r*.24+i*r*.16,y+r*.32,2,r*.23,'#bb793a');}}
 function npc(p,x,y,color='#bf795d',s=1,move=0){s*=.62;const {R,E,L}=painter(p);E(x,y,15*s,5*s,'#183c3533');R(x-10*s,y-27*s,7*s,26*s,'#3d5148');R(x+3*s,y-27*s,7*s,26*s,'#3d5148');R(x-15*s,y-66*s,30*s,43*s,color);E(x,y-84*s,16*s,20*s,'#bd956e');E(x,y-99*s,17*s,8*s,'#4e3b30');L([[x-16*s,y-57*s],[x-25*s,y-43*s+Math.sin(move)*12*s]],'#bc946c',5*s);L([[x+16*s,y-57*s],[x+25*s,y-43*s-Math.sin(move)*12*s]],'#bc946c',5*s);}
 function effects(p,place,t,state,scene,phase='world'){
  const a=painter(p),{R,P,E,L,T,glow,star}=a;
  if(phase==='world'){
   if(place.water){const [x,y,w,h]=place.water;p.save();p.beginPath();p.rect(x+8,y+8,w-16,h-16);p.clip();for(let j=0;j<25;j++){const pts=[];for(let xx=x;xx<x+w;xx+=18)pts.push([xx,y+j*h/25+Math.sin(xx*.025+t*1.6+j)*4]);L(pts,j%2?'#e3f1c64c':'#216f9133',2);}if(state.bag['pool-float']){p.strokeStyle='#e2b8a2';p.lineWidth=13;p.beginPath();p.ellipse(x+w*.76,y+h*.5+Math.sin(t)*4,40,19,0,0,TAU);p.stroke();}p.restore();}
   if(place.id==='observatory'){const x=1170,y=75,red=state.sky===1;glow(x,y,80,red?'#dd936638':'#dbe3c138');E(x,y,35,35,red?'#ce8566':'#e6e3c7');if(state.sky===0){p.save();p.beginPath();p.arc(x,y,35,0,TAU);p.clip();E(x+Math.sin(t*.10)*49,y-5,34,34,'#162c38');p.restore();}if(state.sky===3){for(let i=0;i<5;i++){const v=(t*.14+i*.21)%1,xx=1350-v*1050,yy=5+v*115;L([[xx+52,yy-14],[xx,yy]],'#d8f2dfaa',2);}}if(state.sky===4)for(let i=0;i<5;i++){star(620+i*135,155+Math.sin(i)*18,4,'#f4d9ad');}}
   if(place.id==='astra')place.nodes.filter(n=>n.action==='astra').forEach(n=>{if(!state.flags['astra-'+n.station]&&(!scene||scene.node.id!==n.id))return;const i=n.station,c=['#9bdfd5','#e1d0a1','#bfade1','#9acde6','#bda4dc','#e6d2a1','#97ddcf','#9addde','#dfd69b','#e3b5ce'][i];glow(n.x,n.y-20,130,c+'20');
    if(i===0||i===9){p.strokeStyle=c;p.lineWidth=3;for(let k=0;k<3;k++){p.beginPath();p.ellipse(n.x,n.y+18,55+k*12,100+k*13,0,Math.PI,TAU);p.stroke();}}
    if([1,3,8].includes(i))for(let j=0;j<15;j++){const yy=n.y-115+(j*29+t*(i===8?-24:24)+99999)%125;star(n.x-75+j*23%150,yy,2+j%3,c);}
    if(i===2)for(let j=0;j<5;j++){p.strokeStyle=c;p.beginPath();p.ellipse(n.x,n.y-25,30+j*16+Math.sin(t)*5,12+j*7,0,0,TAU);p.stroke();}
    if(i===4)for(let j=0;j<4;j++){const pts=[];for(let x=-90;x<=90;x+=6)pts.push([n.x+x,n.y-60+j*19+Math.sin(x*.04+t+j)*13]);L(pts,c+'aa',2);}
    if(i===5){p.strokeStyle=c;p.beginPath();p.ellipse(n.x,n.y-65,70,30,0,0,TAU);p.stroke();star(n.x,n.y-65,15,c);}
    if(i===6)for(let j=0;j<25;j++)star(n.x-80+j*37%160,n.y-10+j*31%60,2,c);
    if(i===7){glow(n.x,n.y-70,90,c+'44');E(n.x,n.y-70,22+Math.sin(t)*3,22+Math.sin(t)*3,c);}
   });
   if(place.id==='haunt'){for(let i=0;i<10;i++)E((i*179+t*13)%1550,320+(i*137)%500,140,25,'#b9d7d215');}
   if(place.id==='haunt'&&scene&&scene.node.scene==='haunt-chain')prop(p,{kind:'chains',x:350,y:275,w:200,h:70},t*3,state);
   if(place.id==='stadium'&&scene&&scene.node.scene==='baseball'){
    const beat=(scene.age%4)/4;npc(p,885,440,'#e6dfc1',.74,beat*12);npc(p,885,600,'#597c89',.74,beat>0.42&&beat<.65?beat*25:0);L([[898,568],[910+Math.sin(beat*12)*22,545]],'#d2aa71',4);
    const v=beat<.5?beat*2:(beat-.5)*2,x=beat<.5?885:885+v*280,y=beat<.5?430+v*150:580-v*270;E(x,y-Math.sin(v*Math.PI)*(beat<.5?8:70),3,3,'#fff1cf');
    if(beat>.5)for(let i=0;i<5;i++){const q=(beat-.5)*2;L([[885+q*250+i*4,580-q*240+i*4],[897+q*250+i*4,568-q*240+i*4]],'#fff1cf66',1);}
   }
   if(place.id==='puja')for(let i=0;i<4;i++){const n=place.nodes.find(n=>n.id==='lamp'+i);E(n.x,n.y,17,7,'#ab7042');if(state.flags['puja-lamp-'+i]){glow(n.x,n.y-10,75,'#ffcf7b3b');E(n.x,n.y-16+Math.sin(t*4+i),3,10,'#ffe7a8');}}
   if(place.id==='apartment'&&state.flags['home-banner'])T('WELCOME HOME',770,160,32,'#e8c66d');
   if(place.id==='apartment'&&state.flags['home-flowers'])prop(p,{kind:'flowers',x:450,y:318,w:45,h:42},t,state);
   if(place.id==='apartment'&&state.flags['home-dinner']){for(const x of [700,815]){E(x,635,28,9,'#eee4c0');E(x,633,18,5,'#b9a668');}}
   if(place.id==='apartment'&&window.OUR_YEAR.detail('carving').carvings){const cs=window.OUR_YEAR.detail('carving').carvings;cs.forEach((d,i)=>{const x=1160+i*53,y=660,r=25;pumpkin(p,x,y,r,d.template||'',true);if(!d.template)(d.strokes||[]).forEach(st=>L(st.map(pt=>[x+(pt[0]*340-170)*r/190,y+(pt[1]*340-170)*r/190]),'#ffe49b',1.5));});}
   if(place.id==='jeep')place.nodes.filter(n=>n.action==='duck').forEach(n=>{if(state.flags['duck-'+n.number])return;E(n.x,n.y,12,8,'#e7cd73');E(n.x+8,n.y-8,7,7,'#f2d981');R(n.x+12,n.y-9,6,3,'#bf8b45');});
   if(place.id==='concert'&&(state.flags['concert-performed']||scene&&scene.node.scene==='concert')){
    const v=place.props.find(o=>o.kind==='stage');for(let i=0;i<5;i++){const x=v.x+70+i*140;P([[x,v.y-45],[x+Math.sin(t*.7+i)*90-65,v.y+v.h],[x+Math.sin(t*.7+i)*90+65,v.y+v.h]],['#b9d8cb19','#dfa9c119','#e6ca8c19'][i%3]);}npc(p,785,340,'#45494b',1.15,t*3);E(785,270,13,6,'#bfc0b3');E(785,281,2,3,'#ab4052');L([[810,340],[810,282],[798,282]],'#b3bba6',3);npc(p,560,340,'#866852',.8,t*2);npc(p,1010,340,'#536a68',.8,t*2);R(975,310,70,9,'#d1d0b6');
   }
   if(place.id==='community'&&scene){if(scene.node.scene==='culture')for(let i=0;i<3;i++)npc(p,320+i*110,285,['#be6d66','#b99055','#6d9a85'][i],.9,t*4+i);if(scene.node.scene==='drama'){npc(p,1060,285,'#ae7b5e',.9,t*2);npc(p,1205,285,'#7d8e73',.9,t*2+2);}if(scene.node.scene==='music')for(let i=0;i<3;i++){npc(p,640+i*125,340,'#9c8061',.75,t*3);E(640+i*125,318,18,9,'#d1b986');}}
  }
  if(phase==='over'&&scene){
   if(scene.node.scene==='fireworks')for(let i=0;i<9;i++){const v=(scene.age*.31+i*.19)%1,x=260+i*151%1050,y=190+i*67%120,r=v*95,c=['#e7b4bd','#dce1a7','#a6dada','#cebde5'][i%4];p.globalAlpha=1-v;for(let j=0;j<24;j++){const q=j*TAU/24;L([[x+Math.cos(q)*r*.7,y+Math.sin(q)*r*.7+v*35],[x+Math.cos(q)*r,y+Math.sin(q)*r+v*35]],c,2);}p.globalAlpha=1;}
   if(scene.kind==='golf'&&scene.flight){const f=scene.flight,v=Math.min(1,f.age/1.5);E(f.x0+(f.x-f.x0)*v,f.y0+(f.y-f.y0)*v-Math.sin(v*Math.PI)*180,4,4,'#fff0cb');}
   if(['reunion','ring','dance','portrait','haunt-exit','bench','snack'].includes(scene.node.scene)){const x=scene.anchor.x,y=scene.anchor.y-110;T('♥',x,y+Math.sin(t*2)*3,24,'#e0a5b2');}
   if(scene.node.scene==='ring'){const x=scene.anchor.x,y=scene.anchor.y-48;R(x-17,y,34,21,'#e4d8b8');E(x,y+8,9,5,'#e1bf72');star(x,y+3,5,'#fff3cb');}
   if(scene.node.scene==='snack'&&scene.phase!=='approach'){const x=scene.anchor.x,y=scene.anchor.y-25,id=scene.node.sharedItem;
    if(id==='lemonade'||id==='cider')for(const d of [-13,13]){P([[x+d-6,y-12],[x+d+6,y-12],[x+d+4,y+5],[x+d-4,y+5]],id==='cider'?'#bd8653':'#e9ce73');L([[x+d+1,y-4],[x+d+1,y-18],[x+d+5,y-20]],'#f4e5bb',1.5);}
    else if(id==='popcorn'){P([[x-12,y-14],[x+12,y-14],[x+9,y+8],[x-9,y+8]],'#c77a73');for(let i=0;i<8;i++)E(x-9+i*3,y-15+Math.sin(i)*3,3,3,'#f2dda0');for(let i=-1;i<=1;i++)R(x+i*6,y-10,2,15,'#efe0bf');}
    else{E(x,y,20,7,'#e7dcc0');for(let i=0;i<4;i++)E(x-11+i*7,y-2,4,4,id==='sweets'?'#dfb477':'#a4b875');}
   }
   if(scene.node.scene==='portrait'||scene.node.scene==='pumpkin-photo'||scene.node.station===9){if(scene.age>4&&scene.age<4.12)R(0,0,W,H,'#fff7d659');}
  }
 }
 function mapProp(p,place,o,t,state){if(!painted.has(place.id)||o.kind==='pumpkin'||o.kind==='gift'||o.hideWhen||(place.id==='halloween'&&o.kind==='flowers'))prop(p,o,t,state);}
 window.AdventureArt={base,load,pin:id=>active=id,isPainted:id=>painted.has(id),prop,mapProp,effects,painter,pumpkin,npc};
})();
