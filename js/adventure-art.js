// Original-world art: painted locations and normalized pixel sprite atlases.
// No geometric substitute scenery or stick-figure cast is shipped to the player.
(function(){
 'use strict';
 const W=1536,H=1024,TAU=Math.PI*2,VERSION='20261104-4',painted=new Map(),pending=new Map(),atlases={},cells=new Map();let active=null,assetJob=null,blank=null;
 function bitmap(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('The artwork could not load. Please try again.'));im.src=src+'?v='+VERSION;});}
 function loadSprites(){if(!assetJob)assetJob=Promise.all(['detail','performance','sports'].map(async name=>{atlases[name]=await bitmap('assets/our-year/'+name+'-atlas.png');})).catch(e=>{assetJob=null;throw e;});return assetJob;}
 function load(place){if(painted.has(place.id))return loadSprites().then(()=>painted.get(place.id));if(pending.has(place.id))return pending.get(place.id);const job=Promise.all([bitmap('assets/our-year/places/'+place.id+'.webp'),loadSprites()]).then(([im])=>{if(painted.size>=4){const oldest=Array.from(painted.keys()).find(id=>id!==active);if(oldest)painted.delete(oldest);}painted.set(place.id,im);return im;}).finally(()=>pending.delete(place.id));pending.set(place.id,job);return job;}
 function base(place){if(painted.has(place.id))return painted.get(place.id);if(!blank){blank=document.createElement('canvas');blank.width=W;blank.height=H;const p=blank.getContext('2d');p.fillStyle='#080c09';p.fillRect(0,0,W,H);}return blank;}
 function painter(p){
  const R=(x,y,w,h,c)=>{p.fillStyle=c;p.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const P=(pts,c)=>{p.fillStyle=c;p.beginPath();pts.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();p.fill();};
  const E=(x,y,rx,ry,c)=>{p.fillStyle=c;p.beginPath();p.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);p.fill();};
  const L=(pts,c,w=1)=>{if(!pts.length)return;p.strokeStyle=c;p.lineWidth=w;p.lineCap='round';p.lineJoin='round';p.beginPath();pts.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.stroke();};
  const T=(str,x,y,size=15,c='#eddbb6')=>{p.fillStyle=c;p.font='bold '+size+'px monospace';p.textAlign='center';p.fillText(str,x,y);};
  const glow=(x,y,r,c)=>{const g=p.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,c.slice(0,7)+'00');R(x-r,y-r,r*2,r*2,g);};
  const star=(x,y,r,c)=>{R(x-r,y,2*r+1,1,c);R(x,y-r,1,2*r+1,c);};return {R,P,E,L,T,glow,star};
 }
 function cell(name,index){const key=name+'-'+index;if(cells.has(key))return cells.get(key);const im=atlases[name];if(!im)return null;const sw=im.naturalWidth/4,sh=im.naturalHeight/4,sx=index%4*sw,sy=Math.floor(index/4)*sh,c=document.createElement('canvas');c.width=sw;c.height=sh;const p=c.getContext('2d',{willReadFrequently:true});p.drawImage(im,sx,sy,sw,sh,0,0,sw,sh);const data=p.getImageData(0,0,sw,sh).data;let x0=sw,y0=sh,x1=0,y1=0;for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(data[(y*sw+x)*4+3]>32){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}const b={im,x:sx+x0,y:sy+y0,w:x1-x0+1,h:y1-y0+1};cells.set(key,b);return b;}
 function sprite(p,name,index,x,y,w,h){const b=cell(name,index);if(!b)return;const s=h===undefined?w/b.h:Math.min(w/b.w,h/b.h),ww=b.w*s,hh=b.h*s;p.save();p.imageSmoothingEnabled=false;p.drawImage(b.im,b.x,b.y,b.w,b.h,Math.round(x-ww/2),Math.round(y-hh),Math.round(ww),Math.round(hh));p.restore();}
 function item(p,index,x,y,w=50,h=50){sprite(p,'detail',index,x,y,w,h);}
 function cast(p,name,row,x,y,height,t){sprite(p,name,row*4+Math.floor(t*2.1)%4,x,y,height);}
 function prop(p,o,t=0,state={flags:{},bag:{}}){if(o.hideWhen&&state.flags[o.hideWhen])return;if(o.kind==='pumpkin'&&state.flags['pumpkin-'+o.number])return;const x=o.x+o.w/2,y=o.y+o.h;
  if(o.kind==='pumpkin')patchPumpkin(p,x,y,o.number);
  if(o.kind==='flowers')item(p,1,x,y,o.w,o.h);
  if(o.kind==='gift')item(p,state.flags['apartment-ring']?3:2,x,y,o.w,o.h);
  if(o.kind==='jeep')item(p,12+Math.floor(t*8)%4,x,y,o.w,o.h);
 }
 const pumpkinShapes=[
  [19,18,'#d6672e','#f39b47',-4],[16,23,'#d34e26','#f7873e',5],
  [24,14,'#d57831','#f6ab56',-6],[19,19,'#a77854','#ecc995',3],
  [23,15,'#ad4b28','#e97837',6],[15,21,'#d98338','#f7b453',-5]
 ];
 function patchPumpkin(p,x,y,number){
  const {E,L}=painter(p),[rx,ry,shadow,light,lean]=pumpkinShapes[number%pumpkinShapes.length];
  const center=y-ry;
  E(x+1,y+1,rx+3,4,'#20131377');
  E(x,center,rx,ry,shadow);
  for(const side of [-1,1])E(x+side*rx*.38,center-1,rx*.43,ry*.91,light);
  E(x,center,rx*.36,ry,shadow);E(x-1,center-1,rx*.27,ry*.92,light);
  L([[x,center-ry+3],[x+lean*.5,center-ry-4],[x+lean,center-ry-6]],'#645332',3);
 }
 function pumpkin(p,x,y,r,design='',lit=false){item(p,0,x,y+r*.8,r*2,r*2);if(!design)return;const {R,P,E,L,glow}=painter(p),col=lit?'#ffe4a4':'#543419';if(lit)glow(x,y,r*1.6,'#ffd07530');if(design==='classic'){for(const side of [-1,1])P([[x+side*r*.3-r*.13,y-r*.12],[x+side*r*.3+r*.13,y-r*.12],[x+side*r*.3,y-r*.4]],col);P([[x-r*.08,y+r*.06],[x+r*.08,y+r*.06],[x,y-r*.1]],col);L([[x-r*.43,y+r*.25],[x-r*.2,y+r*.4],[x+r*.2,y+r*.4],[x+r*.43,y+r*.25]],col,2);}else{E(x,y,r*.43,r*.44,col);E(x-r*.16,y-r*.12,r*.1,r*.13,'#915624');E(x+r*.16,y-r*.12,r*.1,r*.13,'#915624');for(let i=0;i<4;i++)R(x-r*.2+i*r*.13,y+r*.28,1,r*.2,'#915624');}}
 function heart(p,x,y){const {R}=painter(p),pattern=['0110110','1111111','1111111','0111110','0011100','0001000'];pattern.forEach((s,j)=>[...s].forEach((v,i)=>{if(v==='1')R(x+i*2-7,y+j*2,2,2,'#dba59aaa');}));}
 function effects(p,place,t,state,scene,phase='world'){
  const {R,P,E,L,T,glow,star}=painter(p),art=place.art||{},clock=scene?scene.age:t;
  if(phase==='world'){
   if(place.water){const [x,y,w,h]=place.water;p.save();p.beginPath();p.rect(x+4,y+4,w-8,h-8);p.clip();for(let i=0;i<80;i++){const xx=x+((i*113+t*5)%w),yy=y+(i*67)%h;R(xx,yy+Math.sin(t+i)*2,3+i%4,1,'#f2e5be22');}if(state.bag['pool-float'])item(p,6,x+w*.77,y+h*.54+Math.sin(t)*2,76,40);p.restore();}
   if(place.id==='observatory'){const moon=art.moon||[1180,140],x=moon[0],y=moon[1],color=state.sky===1?'#c68059':'#e6ddbc';glow(x,y,70,color+'1f');E(x,y,28,28,color);for(let i=0;i<10;i++)E(x+Math.sin(i*3)*19,y+Math.cos(i*2)*19,2+i%3,1+i%3,'#635f531f');if(state.sky===0){p.save();p.beginPath();p.arc(x,y,28,0,TAU);p.clip();E(x+Math.sin(clock*.12)*43,y-4,28,28,'#101d24');p.restore();}if(state.sky===3)for(let i=0;i<5;i++){const v=(clock*.12+i*.18)%1,xx=1380-v*1050,yy=65+v*150;L([[xx+34,yy-11],[xx,yy]],'#d9e1c7aa');}if(state.sky===4)for(let i=0;i<5;i++)star(630+i*142,120+Math.sin(i)*26,1+i%2,'#e7d6ac');}
   if(place.id==='astra')place.nodes.filter(n=>n.action==='astra').forEach(n=>{if(!state.flags['astra-'+n.station]&&(!scene||scene.node.id!==n.id))return;const xy=art.fx&&art.fx[n.station]||[n.x,n.y-60],x=xy[0],y=xy[1],colors=['#e1bb76','#d9c891','#bdbbdf','#e9d5a4','#a8bdce','#d9cda0','#c7d6b3','#b2cdd8','#d9bd86','#e2c49b'],c=colors[n.station];glow(x,y,75,c+'1e');for(let i=0;i<22;i++){const xx=x+Math.sin(i*2.39+t*.18)*62,yy=y+Math.cos(i*1.79+t*.13)*33,alpha=.3+.45*(1+Math.sin(clock*2+i))/2;p.globalAlpha=alpha;star(xx,yy,i%7===0?2:1,c);}p.globalAlpha=1;if(n.station===3)for(let i=0;i<5;i++)L([[x-45+i*22,y-70],[x-28+i*22,y+45]],c+'28',2);});
   if(place.id==='apartment'){
    if(!art.photoHomecoming){
     if(state.flags['home-banner']){R(631,213,306,36,'#cfac66');R(635,217,298,28,'#f1d79c');T('WELCOME HOME',785,238,24,'#6d4329');}
     if(state.flags['home-flowers']){const xy=art.roses||[700,640];item(p,1,...xy,50,68);}
     if(state.flags['home-dinner']){const xy=art.dinner||[835,655];item(p,4,...xy,115,65);}
    }
    // The photographed decorations, roses and dinner are already painted in
    // their real positions. Interactions never put generic props over them.
    if(art.photoHomecoming&&state.flags['home-banner'])for(let i=0;i<8;i++)star(480+i*89,160+Math.sin(i+t*.35)*15,1,'#f3d77c66');
    const cs=window.OUR_YEAR.detail('carving').carvings;if(cs)cs.forEach((d,i)=>{const xy=art.carvings&&art.carvings[i]||[1160+i*53,660],x=xy[0],y=xy[1],r=25;glow(x,y,r*(1.6+Math.sin(t*3+i)*.12),'#ffb34532');pumpkin(p,x,y,r,d.template||'',true);if(!d.template)(d.strokes||[]).forEach(st=>L(st.map(pt=>[x+(pt[0]*340-170)*r/190,y+(pt[1]*340-170)*r/190]),'#ffe49b',1.5));});
   }
   if(place.id==='pumpkins'){
    const selected=place.nodes.filter(n=>n.action==='pumpkin'&&state.flags['pumpkin-'+n.number]);
    selected.forEach((n,i)=>patchPumpkin(p,1302+i*42,370,n.number));
   }
   if(place.id==='jeep')place.nodes.filter(n=>n.action==='duck').forEach(n=>{if(!state.flags['duck-'+n.number])item(p,5,n.x,n.y,24,25);});
   if(place.id==='puja')for(let i=0;i<4;i++){const [x,y]=art.diyas[i];if(state.flags['puja-lamp-'+i]){glow(x,y-10,55,'#f6bd6330');E(x,y-11+Math.sin(t*4+i),2,6,'#ffe0a0');}}
   if(place.id==='puja'){
    for(const [i,who] of ['him','her'].entries())if(state.flags['puja-offering-'+who]){
     const x=730+i*61,y=398;item(p,1,x,y,31,24);
    }
   }
   if(place.id==='concert'){
    const stage=art.stage||[{row:0,x:785,y:330,h:104},{row:1,x:565,y:330,h:88},{row:2,x:1005,y:330,h:88}];
    if(scene?.node.scene==='concert'&&scene.phase==='playing'&&scene.current?.pose==='dance'){
     const singer=stage[0],spread=82+18*Math.sin(clock*1.2);
     P([[singer.x-16,120],[singer.x+16,120],[singer.x+spread,singer.y+12],[singer.x-spread,singer.y+12]],'#a8cfff36');
     glow(singer.x,singer.y-54,106,'#91bafa48');
     T('SKYFALL',singer.x,164,22,'#d8eaff');
    }
    for(const a of stage)cast(p,'performance',a.row,a.x,a.y,a.h,clock+a.row*.3);
   }
   if(place.id==='community'){
    const mode=scene&&scene.node.scene||'culture',stage=art.stage||[[425,310],[1120,310],[760,400]];if(mode==='culture')for(let i=0;i<2;i++)cast(p,'performance',3,stage[0][0]-50+i*100,stage[0][1],84,clock+i);if(mode==='drama'){cast(p,'sports',3,stage[1][0]-50,stage[1][1],80,clock);cast(p,'performance',3,stage[1][0]+50,stage[1][1],80,clock+2);}if(mode==='music'){cast(p,'performance',2,stage[2][0],stage[2][1],80,clock);cast(p,'performance',0,stage[2][0]+100,stage[2][1],80,clock+.5);}
   }
   if(place.id==='stadium'){
    const field=art.field||{pitch:[936,425],plate:[938,565],fielders:[[665,375],[1230,385],[935,330]]},beat=(clock%4)/4;cast(p,'sports',0,...field.pitch,36,beat*1.85);cast(p,'sports',1,field.plate[0]-15,field.plate[1],39,beat*1.85);field.fielders.forEach(([x,y],i)=>cast(p,'sports',2,x,y,29,clock*.2+i));
    if(scene?.scoreboardHeartUntil>clock){
     glow(909,137,32,'#fb5b7470');
     p.save();p.translate(909,127);p.scale(1.65,1.65);heart(p,0,0);p.restore();
    }
    if(scene&&scene.node.scene==='baseball'){const v=beat<.5?beat*2:(beat-.5)*2,a=beat<.5?field.pitch:field.plate,b=beat<.5?field.plate:[1230,290],x=a[0]+(b[0]-a[0])*v,y=a[1]+(b[1]-a[1])*v-Math.sin(v*Math.PI)*(beat<.5?8:50);R(x,y,3,3,'#fff0ca');}
   }
   if(place.id==='haunt')for(let i=0;i<30;i++){const x=(i*179+t*7)%1500,y=350+i*137%460;R(x,y,25+i%30,2,'#bbc6b608');}
  }
  if(phase==='over'&&scene){
   if(scene.node.scene==='fireworks')for(let i=0;i<7;i++){const v=(clock*.28+i*.19)%1,x=250+i*159%1050,y=145+i*67%110,r=v*74,c=['#e9c59c','#d7d7a5','#b7cccf','#c6b9ce'][i%4];p.globalAlpha=(1-v)*.85;for(let j=0;j<23;j++){const q=j*TAU/23;L([[x+Math.cos(q)*r*.8,y+Math.sin(q)*r*.8+v*25],[x+Math.cos(q)*r,y+Math.sin(q)*r+v*25]],c,1.5);star(x+Math.cos(q)*r,y+Math.sin(q)*r+v*25,1,c);}p.globalAlpha=1;}
   if(scene.kind==='golf'&&scene.flight){const f=scene.flight,v=Math.min(1,f.age/1.5);R(f.x0+(f.x-f.x0)*v,f.y0+(f.y-f.y0)*v-Math.sin(v*Math.PI)*145,3,3,'#fff0cb');}
   if(scene.kind==='golf'){const a=scene.flight?Math.min(1,scene.flight.age/.6):0,x=scene.anchor.x-24,y=scene.anchor.y-42;L([[x,y],[x+Math.sin(a*4-1)*32,y+Math.cos(a*4-1)*32]],'#b9b7a3',1.5);}
   if(scene.phase!=='approach'&&['reunion','ring','dance','portrait','haunt-exit','bench','snack'].includes(scene.node.scene))heart(p,scene.anchor.x,scene.anchor.y-(place.actorHeight||74)-23);
   if(scene.node.scene==='ring'&&scene.phase!=='approach')item(p,3,scene.anchor.x,scene.anchor.y-26,31,31);
   if(scene.node.scene==='feast'&&scene.phase!=='approach')item(p,4,scene.anchor.x,scene.anchor.y+9,50,33);
   if(scene.node.scene==='snack'&&scene.phase!=='approach'){const id=scene.node.sharedItem,index={lemonade:7,cider:10,popcorn:8,sweets:9,meal:4}[id]||9;item(p,index,scene.anchor.x,scene.anchor.y-20,45,38);}
   if((scene.node.scene==='portrait'||scene.node.scene==='pumpkin-photo'||scene.node.station===9)&&clock>4&&clock<4.12)R(0,0,W,H,'#fff7d62b');
  }
 }
 function mapProp(p,place,o,t,state){if(['pumpkin','flowers','gift'].includes(o.kind))prop(p,o,t,state);}
 window.AdventureArt={base,load,pin:id=>active=id,isPainted:id=>painted.has(id),prop,mapProp,effects,painter,pumpkin,item,cast};
})();
