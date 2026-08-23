// Permanent two-player destination reached after the Speed Force multiverse run.
(function(){
  'use strict';

  const canvas=document.getElementById('game');
  const ctx=canvas.getContext('2d');
  const loading=document.getElementById('loading');
  const prompt=document.getElementById('prompt');
  const toast=document.getElementById('toast');
  const arrivalFlash=document.getElementById('arrivalFlash');
  const arrivalSource=new URLSearchParams(location.search).get('from')||'';
  const arrivingFromSpeedForce=arrivalSource==='speed-force';
  const CELL=256;
  const MAP_ASSET='assets/multiverse/dawn-nexus.webp';
  const STORAGE_KEY='dawnNexusState';

  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function selectedOutfit(who){
    try{
      const value=Number(localStorage.getItem(who+'Outfit')||1);
      return Number.isInteger(value)&&value>=1&&value<=11?value:1;
    }catch(error){return 1;}
  }
  function outfitPath(who){
    const outfit=selectedOutfit(who);
    return outfit===1?'assets/sprites/'+who+'_atlas.png':'assets/sprites/'+who+'_outfit'+outfit+'.png';
  }
  function loadImage(source){
    return new Promise((resolve,reject)=>{
      const image=new Image();
      image.addEventListener('load',()=>resolve(image),{once:true});
      image.addEventListener('error',()=>reject(new Error('Could not load '+source)),{once:true});
      image.src=source;
      if(image.complete&&image.naturalWidth)resolve(image);
    });
  }

  let cssWidth=1,cssHeight=1,dpr=1,viewScale=1;
  let worldWidth=1672,worldHeight=941;
  let mapImage=null;
  let camera={x:worldWidth/2,y:worldHeight/2};
  let lastFrame=0;
  let arrivalElapsed=arrivingFromSpeedForce?0:99;
  let toastTimer=0;
  let heartTime=0;
  let interactPressed=false;
  let lastInteract=false;
  const keys={};
  const players={
    him:{key:'him',name:'Ashton',img:null,x:792,y:616,dir:'up',frame:0,frameTimer:0,speed:190,rows:{down:0,up:2,left:3,right:3}},
    her:{key:'her',name:'Tanima',img:null,x:880,y:616,dir:'up',frame:0,frameTimer:0,speed:190,rows:{down:0,left:1,up:2,right:3}}
  };

  const locations=[
    {name:'Arrival Seal',x:836,y:548,r:118,text:'Press E to run the Speed Force again',action:'replay'},
    {name:'Nexus Palace',x:836,y:248,r:105,text:'Press E to look toward the Nexus Palace',action:'palace'},
    {name:'Western Reality Crystal',x:300,y:360,r:92,text:'Press E to inspect the western reality crystal',action:'westCrystal'},
    {name:'Eastern Reality Crystal',x:1382,y:360,r:92,text:'Press E to inspect the eastern reality crystal',action:'eastCrystal'},
    {name:'Sunrise Outlook',x:190,y:716,r:95,text:'Press E to watch the worlds turn beneath the sunrise',action:'outlook'}
  ];

  function resize(){
    cssWidth=Math.max(1,innerWidth);cssHeight=Math.max(1,innerHeight);
    dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(cssWidth*dpr);canvas.height=Math.round(cssHeight*dpr);
    canvas.style.width=cssWidth+'px';canvas.style.height=cssHeight+'px';
    viewScale=Math.max(cssWidth/worldWidth,cssHeight/worldHeight);
    viewScale=clamp(viewScale,.72,1.35);
  }

  function canStand(x,y){
    if(x<92||x>worldWidth-92||y<205||y>worldHeight-48)return false;
    const plaza=Math.pow((x-worldWidth/2)/760,2)+Math.pow((y-575)/365,2)<=1;
    const palaceWalk=x>590&&x<1080&&y>195&&y<680;
    return plaza||palaceWalk;
  }

  function inputFor(who){
    if(who==='him')return {up:keys.w,down:keys.s,left:keys.a,right:keys.d};
    return {up:keys.arrowup,down:keys.arrowdown,left:keys.arrowleft,right:keys.arrowright};
  }

  function movePlayer(player,input,dt){
    let dx=(input.right?1:0)-(input.left?1:0);
    let dy=(input.down?1:0)-(input.up?1:0);
    if(!dx&&!dy){player.frame=0;player.frameTimer=0;return;}
    const length=Math.hypot(dx,dy);dx/=length;dy/=length;
    if(Math.abs(dx)>Math.abs(dy))player.dir=dx>0?'right':'left';else player.dir=dy>0?'down':'up';
    const amount=player.speed*dt;
    const nextX=player.x+dx*amount,nextY=player.y+dy*amount;
    if(canStand(nextX,player.y))player.x=nextX;
    if(canStand(player.x,nextY))player.y=nextY;
    player.frameTimer+=dt;
    if(player.frameTimer>.105){player.frame=(player.frame+1)%4;player.frameTimer=0;}
  }

  function distanceTo(location){
    return Math.min(...Object.values(players).map(player=>Math.hypot(player.x-location.x,player.y-location.y)));
  }
  function nearestLocation(){
    let nearest=null,best=Infinity;
    locations.forEach(location=>{const distance=distanceTo(location);if(distance<location.r&&distance<best){nearest=location;best=distance;}});
    return nearest;
  }

  function showToast(title,text,duration){
    toast.querySelector('strong').textContent=title;
    toast.querySelector('span').textContent=text;
    toast.classList.add('is-visible');toastTimer=duration||4;
  }
  function activate(location){
    if(!location)return;
    if(location.action==='replay'){window.location.href='speed-force-run.html';return;}
    if(location.action==='palace')showToast('THE DAWN NEXUS','The palace stands at the stable center of the realities you crossed. This world is now safe to explore.',5);
    if(location.action==='westCrystal')showToast('REALITY ARCHIVE','The crystal holds a blue afterimage of Meridian City and the breach that carried you through it.',4.5);
    if(location.action==='eastCrystal')showToast('REALITY ARCHIVE','The crystal flickers between the Eclipse Ruins, Cryostella, and the Tempest Empire.',4.5);
    if(location.action==='outlook')showToast('BETWEEN WORLDS','Below the island, distant realities move like stars. The pursuit cannot cross the sealed final breach.',4.8);
  }

  function saveState(){
    try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify({him:{x:players.him.x,y:players.him.y,dir:players.him.dir},her:{x:players.her.x,y:players.her.y,dir:players.her.dir}}));}catch(error){}
  }
  function restoreState(){
    if(arrivingFromSpeedForce){try{sessionStorage.removeItem(STORAGE_KEY);}catch(error){}return;}
    try{
      const saved=JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'null');
      if(!saved)return;
      ['him','her'].forEach(who=>{
        if(saved[who]&&Number.isFinite(saved[who].x)&&Number.isFinite(saved[who].y)&&canStand(saved[who].x,saved[who].y)){
          players[who].x=saved[who].x;players[who].y=saved[who].y;players[who].dir=saved[who].dir||'down';
        }
      });
    }catch(error){}
  }

  function refreshOutfits(){
    ['him','her'].forEach(who=>{
      const expected=outfitPath(who);
      if(players[who].img&&(players[who].img.currentSrc||players[who].img.src||'').endsWith(expected))return;
      loadImage(expected).then(image=>{players[who].img=image;}).catch(()=>{});
    });
  }

  function updateCamera(){
    const middle={x:(players.him.x+players.her.x)/2,y:(players.him.y+players.her.y)/2};
    const halfWidth=cssWidth/(2*viewScale),halfHeight=cssHeight/(2*viewScale);
    const targetX=worldWidth*viewScale<=cssWidth?worldWidth/2:clamp(middle.x,halfWidth,worldWidth-halfWidth);
    const targetY=worldHeight*viewScale<=cssHeight?worldHeight/2:clamp(middle.y,halfHeight,worldHeight-halfHeight);
    camera.x+=(targetX-camera.x)*.08;camera.y+=(targetY-camera.y)*.08;
  }

  function update(dt){
    movePlayer(players.him,inputFor('him'),dt);
    movePlayer(players.her,inputFor('her'),dt);
    updateCamera();heartTime+=dt;
    arrivalElapsed+=dt;
    if(arrivingFromSpeedForce&&arrivalElapsed<2.2){
      const flash=arrivalElapsed<.45?1-arrivalElapsed/.45:Math.max(0,1-(arrivalElapsed-.45)/1.55);
      arrivalFlash.style.opacity=String(flash*.92);
    }else arrivalFlash.style.opacity='0';
    const nearby=nearestLocation();
    prompt.style.display=nearby?'block':'none';
    if(nearby)prompt.textContent=nearby.text;
    const interacting=interactPressed||keys.e;
    if(interacting&&!lastInteract)activate(nearby);
    lastInteract=interacting;interactPressed=false;
    if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)toast.classList.remove('is-visible');}
  }

  function setWorldTransform(){
    const scale=dpr*viewScale;
    ctx.setTransform(scale,0,0,scale,canvas.width/2-camera.x*scale,canvas.height/2-camera.y*scale);
  }

  function drawArrivalPortal(){
    if(!arrivingFromSpeedForce||arrivalElapsed>3.2)return;
    const strength=clamp(1-arrivalElapsed/3.2,0,1);
    const radius=45+Math.sin(arrivalElapsed*8)*5+arrivalElapsed*12;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=strength;
    ctx.strokeStyle='#a9f8ff';ctx.lineWidth=5;ctx.shadowColor='#39cfff';ctx.shadowBlur=24;
    ctx.beginPath();ctx.ellipse(836,554,radius,radius*.52,0,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=strength*.28;ctx.fillStyle='#5ce9ff';ctx.beginPath();ctx.ellipse(836,554,radius*.85,radius*.38,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }

  function drawPlayer(player){
    const image=player.img;if(!image||!image.naturalWidth)return;
    const row=player.rows[player.dir]||0;
    const size=94;
    ctx.save();ctx.translate(player.x,player.y);
    ctx.globalAlpha=.25;ctx.fillStyle='#132437';ctx.beginPath();ctx.ellipse(0,2,27,8,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
    if(player.key==='him'&&player.dir==='left'){
      ctx.scale(-1,1);ctx.drawImage(image,player.frame*CELL,row*CELL,CELL,CELL,-size/2,-size+8,size,size);
    }else ctx.drawImage(image,player.frame*CELL,row*CELL,CELL,CELL,-size/2,-size+8,size,size);
    ctx.restore();
  }

  function drawHeart(){
    if(Math.hypot(players.her.x-players.him.x,players.her.y-players.him.y)>52)return;
    const x=(players.her.x+players.him.x)/2,y=Math.min(players.her.y,players.him.y)-91+Math.sin(heartTime*4)*4;
    ctx.save();ctx.translate(x,y);ctx.scale(.65,.65);ctx.fillStyle='#ff74ba';ctx.shadowColor='#ff8bc8';ctx.shadowBlur=13;
    ctx.beginPath();ctx.moveTo(0,12);ctx.bezierCurveTo(-30,-8,-20,-32,0,-17);ctx.bezierCurveTo(20,-32,30,-8,0,12);ctx.fill();ctx.restore();
  }

  function draw(){
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#b8e8ee';ctx.fillRect(0,0,canvas.width,canvas.height);
    setWorldTransform();ctx.imageSmoothingEnabled=false;
    if(mapImage)ctx.drawImage(mapImage,0,0,worldWidth,worldHeight);
    drawArrivalPortal();
    Object.values(players).sort((a,b)=>a.y-b.y).forEach(drawPlayer);
    drawHeart();
  }

  function loop(now){
    const dt=lastFrame?clamp((now-lastFrame)/1000,0,.04):0;lastFrame=now;
    update(dt);draw();requestAnimationFrame(loop);
  }

  addEventListener('resize',resize);
  addEventListener('keydown',event=>{
    const key=event.key.toLowerCase();keys[key]=true;
    if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))event.preventDefault();
    if(key==='escape')location.href='index.html';
  });
  addEventListener('keyup',event=>{keys[event.key.toLowerCase()]=false;});
  addEventListener('focus',refreshOutfits);
  addEventListener('beforeunload',saveState);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastFrame=0;refreshOutfits();}});

  resize();
  Promise.all([loadImage(MAP_ASSET),loadImage(outfitPath('him')),loadImage(outfitPath('her'))]).then(images=>{
    mapImage=images[0];players.him.img=images[1];players.her.img=images[2];
    worldWidth=mapImage.naturalWidth||1672;worldHeight=mapImage.naturalHeight||941;
    restoreState();camera={x:(players.him.x+players.her.x)/2,y:(players.him.y+players.her.y)/2};resize();
    loading.classList.add('is-hidden');
    if(arrivingFromSpeedForce)showToast('PURSUIT SEALED','The final breach closed behind you. Your saved everyday outfits are restored across the site.',5.4);
    else showToast('DAWN NEXUS','The stable heart of the realities is ready to explore.',3.8);
  }).catch(error=>{
    loading.querySelector('strong').textContent='THE NEXUS COULD NOT OPEN';
    loading.querySelector('span').textContent=error.message+' — reload the page to try again.';
  });
  requestAnimationFrame(loop);

  window.dawnNexus={
    getState:()=>({
      ready:!!mapImage,
      arrivingFromSpeedForce,
      map:{asset:MAP_ASSET,width:worldWidth,height:worldHeight},
      outfits:{him:outfitPath('him'),her:outfitPath('her')},
      players:{him:{x:Math.round(players.him.x),y:Math.round(players.him.y),dir:players.him.dir},her:{x:Math.round(players.her.x),y:Math.round(players.her.y),dir:players.her.dir}},
      nearby:nearestLocation()&&nearestLocation().name
    }),
    interact:()=>{interactPressed=true;},
    refreshOutfits
  };
})();
