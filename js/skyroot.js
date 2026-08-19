// Connected two-player exploration for Skyroot Grounds and Skyroot Treehouse.
(function(){
  'use strict';

  var canvas=document.getElementById('game');
  var ctx=canvas.getContext('2d');
  var loading=document.getElementById('loading');
  var prompt=document.getElementById('prompt');
  var mapTitle=document.getElementById('mapTitle');
  var toast=document.getElementById('toast');
  var transition=document.getElementById('transition');
  var faithMoment=document.getElementById('faithMoment');
  var faithTitle=document.getElementById('faithTitle');
  var faithText=document.getElementById('faithText');
  var closeFaith=document.getElementById('closeFaith');
  var interactButton=document.getElementById('interactButton');

  function selectedOutfit(who){
    try{
      var outfit=Number(localStorage.getItem(who+'Outfit')||1);
      var maxOutfit=11;
      return Number.isInteger(outfit)&&outfit>=1&&outfit<=maxOutfit?outfit:1;
    }catch(error){return 1;}
  }

  function selectedOutfitPath(who){
    var outfit=selectedOutfit(who);
    return outfit===1?'assets/sprites/'+who+'_atlas.png':'assets/sprites/'+who+'_outfit'+outfit+'.png';
  }

  var images={grounds:new Image(),treehouse:new Image(),her:new Image(),him:new Image()};
  images.grounds.src='assets/maps/skyroot-grounds.png';
  images.treehouse.src='assets/maps/skyroot-treehouse.png';
  images.her.src=selectedOutfitPath('her');
  images.him.src=selectedOutfitPath('him');

  var keys={};
  var touchState={her:{up:false,down:false,left:false,right:false},him:{up:false,down:false,left:false,right:false}};
  var interactPressed=false;
  var lastInteract=false;
  var paused=false;
  var transitioning=false;
  var camera={x:0,y:0};
  var worldWidth=1536;
  var worldHeight=1024;
  var heartTimer=0;
  var toastTimer=0;
  var debugMode=false;
  var boxSelectMode=false;
  var boxStart=null;
  var boxCurrent=null;
  var boxResult=null;
  var boxText='';
  var spriteBoundsCache=new Map();
  var BLESSING_STORAGE_KEY='skyrootBlessingOfTwoPaths';
  var BLESSING_DOOR={x:764,y:361,r:98};
  var PRAYER_TARGETS={
    christian:{x:920,y:884,focusX:920,focusY:835,actor:'him'},
    krishna:{x:1260,y:884,focusX:1260,focusY:835,actor:'her'}
  };
  var blessingState=loadBlessingState();
  var ceremony=null;
  var ceremonyAudioContext=null;
  var previousMusicVolume=null;

  function rect(x,y,w,h){return {type:'rect',x:x,y:y,w:w,h:h};}
  function ellipse(x,y,rx,ry){return {type:'ellipse',x:x,y:y,rx:rx,ry:ry};}

  var maps={
    grounds:{
      title:'SKYROOT GROUNDS',
      image:images.grounds,
      spawn:{her:{x:726,y:900,dir:'up'},him:{x:806,y:900,dir:'up'}},
      elevatorReturn:{her:{x:724,y:470,dir:'up'},him:{x:804,y:470,dir:'up'}},
      solids:[
        rect(0,0,1536,58),rect(0,58,45,966),rect(1491,58,45,966),
        rect(0,948,610,76),rect(880,948,656,76),
        rect(425,58,245,345),rect(864,58,245,338),rect(670,58,194,205),
        rect(823,601,192,238),rect(1132,600,255,239),rect(1010,688,123,83)
      ],
      walkable:null,
      locations:[
        {name:'Skyroot Lift',x:768,y:438,r:82,text:'Press E to ride the trunk lift into the treehouse',action:'treehouse'},
        {name:'Christian Prayer Space',x:920,y:858,r:105,text:'Press E for a quiet moment at the Christian prayer space',action:'christianPrayer'},
        {name:'Krishna Prayer Space',x:1260,y:858,r:112,text:'Press E for a quiet moment at Krishna’s prayer space',action:'krishnaPrayer'},
        {name:'Blessing Bench',x:1090,y:876,r:54,text:'Press E to replay the Blessing of Two Paths',action:'replayBlessing',requiresBlessing:true},
        {name:'Seasonal Compass',x:270,y:610,r:92,text:'Press E to inspect the seasonal compass stones',action:'compass'},
        {name:'Amber Sapways',x:1240,y:470,r:92,text:'Press E to study the glowing amber sapways',action:'sap'},
        {name:'Root Chimes',x:300,y:200,r:90,text:'Press E to listen to the natural root chimes',action:'chimes'}
      ]
    },
    treehouse:{
      title:'SKYROOT TREEHOUSE',
      image:images.treehouse,
      spawn:{her:{x:730,y:875,dir:'up'},him:{x:806,y:875,dir:'up'}},
      solids:[],
      walkable:[
        ellipse(340,205,245,176),ellipse(1145,210,246,176),
        ellipse(205,470,248,178),ellipse(1310,470,245,176),
        ellipse(350,700,255,188),ellipse(1175,700,250,184),
        ellipse(875,900,215,123),ellipse(768,455,246,194),ellipse(768,735,130,218),
        rect(420,245,320,235),rect(795,245,320,230),rect(345,380,340,170),
        rect(850,375,340,175),rect(410,520,330,230),rect(800,520,360,230),rect(640,610,350,414)
      ],
      locations:[
        {name:'Trunk Lift',x:768,y:820,r:100,text:'Press E to ride the lift back to Skyroot Grounds',action:'grounds'},
        {name:'Creator Studio',x:330,y:215,r:118,text:'Press E to explore the shared creator studio',action:'creator'},
        {name:'Future Family Room',x:1145,y:220,r:118,text:'Press E to visit the future-family room',action:'family'},
        {name:'Future Planning Room',x:210,y:470,r:116,text:'Press E to look through your future plans',action:'planning'},
        {name:'Mojo Pet Loft',x:1310,y:470,r:116,text:'Press E to visit Mojo’s pet loft',action:'mojo'},
        {name:'Sky Observatory',x:350,y:700,r:118,text:'Press E to look through the sky observatory',action:'observatory'},
        {name:'Web-Slinger Gear Room',x:1175,y:700,r:120,text:'Press E to inspect the web-slinger gear room',action:'gear'},
        {name:'Cloud Balcony',x:875,y:905,r:110,text:'Press E to relax together above the clouds',action:'balcony'}
      ]
    }
  };

  var currentMap='grounds';
  var currentConfig=maps.grounds;
  var players={
    her:{key:'her',img:images.her,x:maps.grounds.spawn.her.x,y:maps.grounds.spawn.her.y,dir:'up',frame:0,speed:3,scale:.58,rows:{down:0,left:1,up:2,right:3},frames:{down:[0,1,2,3],up:[0,1,2,3],left:[0,1,2,3],right:[0,1,2,3]}},
    him:{key:'him',img:images.him,x:maps.grounds.spawn.him.x,y:maps.grounds.spawn.him.y,dir:'up',frame:0,speed:3,scale:.58,rows:{down:0,left:3,up:2,right:3},frames:{down:[0,1,2,3],up:[0,1,2,3],left:[0,1,2,3],right:[0,1,2,3]}}
  };
  window.skyrootPlayers=players;

  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function resize(){canvas.width=Math.max(1,innerWidth);canvas.height=Math.max(1,innerHeight);ctx.imageSmoothingEnabled=false;}

  function refreshOutfit(who){
    var expected=selectedOutfitPath(who);
    var current=(players[who].img.currentSrc||players[who].img.src||'').split('/').pop();
    if(current===expected.split('/').pop())return;
    var replacement=new Image();
    replacement.src=expected;
    replacement.decode().then(function(){
      cacheSpriteBounds(replacement);
      images[who]=replacement;
      players[who].img=replacement;
    }).catch(function(){});
  }

  function refreshOutfits(){refreshOutfit('her');refreshOutfit('him');}

  function insideShape(x,y,shape){
    if(shape.type==='ellipse'){
      var dx=(x-shape.x)/shape.rx;
      var dy=(y-shape.y)/shape.ry;
      return dx*dx+dy*dy<=1;
    }
    return x>=shape.x&&x<=shape.x+shape.w&&y>=shape.y&&y<=shape.y+shape.h;
  }

  function canStand(x,y){
    if(x<42||x>worldWidth-42||y<55||y>worldHeight-45)return false;
    if(currentConfig.walkable&&!currentConfig.walkable.some(function(shape){return insideShape(x,y,shape);})){return false;}
    if(currentConfig.solids.some(function(shape){return insideShape(x,y,shape);})){return false;}
    return true;
  }

  function movePlayer(player,input){
    if(paused||transitioning)return;
    var dx=0,dy=0;
    if(input.up)dy--;if(input.down)dy++;if(input.left)dx--;if(input.right)dx++;
    if(dx||dy){
      var length=Math.hypot(dx,dy);dx/=length;dy/=length;
      if(Math.abs(dx)>Math.abs(dy))player.dir=dx>0?'right':'left';else player.dir=dy>0?'down':'up';
      var nx=player.x+dx*player.speed,ny=player.y+dy*player.speed;
      if(canStand(nx,player.y))player.x=nx;if(canStand(player.x,ny))player.y=ny;
      player.frameTimer=(player.frameTimer||0)+1;
      if(player.frameTimer>9){
        var sequence=player.frames[player.dir],index=sequence.indexOf(player.frame);
        player.frame=sequence[(index+1+sequence.length)%sequence.length];player.frameTimer=0;
      }
    }else{player.frame=0;player.frameTimer=0;}
  }

  function inputFor(who,keyboard){
    return {up:!!keyboard.up||touchState[who].up,down:!!keyboard.down||touchState[who].down,left:!!keyboard.left||touchState[who].left,right:!!keyboard.right||touchState[who].right};
  }

  function distance(player,location){return Math.hypot(player.x-location.x,player.y-location.y);}
  function nearestLocation(){
    var nearest=null,nearestDistance=Infinity;
    currentConfig.locations.forEach(function(location){
      if(location.requiresBlessing&&!blessingState.shared)return;
      var value=Math.min(distance(players.her,location),distance(players.him,location));
      if(value<location.r&&value<nearestDistance){nearest=location;nearestDistance=value;}
    });
    return nearest;
  }

  function showToast(title,text,duration){
    toast.querySelector('strong').textContent=title;toast.querySelector('span').textContent=text;
    toast.classList.add('is-visible');toastTimer=duration||260;
  }

  function openPrayer(title,text){paused=true;faithTitle.textContent=title;faithText.textContent=text;faithMoment.classList.add('is-visible');}
  function closePrayerPanel(){faithMoment.classList.remove('is-visible');if(!ceremony)paused=false;}

  function loadBlessingState(){
    try{
      var saved=JSON.parse(localStorage.getItem(BLESSING_STORAGE_KEY)||'null');
      return {christian:!!(saved&&saved.christian),krishna:!!(saved&&saved.krishna),shared:!!(saved&&saved.shared)};
    }catch(error){return {christian:false,krishna:false,shared:false};}
  }

  function saveBlessingState(){
    try{localStorage.setItem(BLESSING_STORAGE_KEY,JSON.stringify(blessingState));}catch(error){}
  }

  function setCeremonyUi(active){
    document.body.classList.toggle('skyroot-cinematic',active);
    var bgm=document.getElementById('bgm');
    if(active){
      if(bgm&&previousMusicVolume===null){previousMusicVolume=bgm.volume;bgm.volume=Math.min(bgm.volume,.12);}
      var musicNote=document.getElementById('musicNote');if(musicNote)musicNote.style.display='none';
      prompt.style.display='none';toast.classList.remove('is-visible');
    }else if(bgm&&previousMusicVolume!==null){
      bgm.volume=previousMusicVolume;previousMusicVolume=null;
    }
  }

  function audioContext(){
    if(ceremonyAudioContext)return ceremonyAudioContext;
    var AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)return null;
    try{ceremonyAudioContext=new AudioContext();return ceremonyAudioContext;}catch(error){return null;}
  }

  function ceremonyTone(context,frequency,start,duration,type,volume){
    var oscillator=context.createOscillator(),gain=context.createGain();
    oscillator.type=type||'sine';oscillator.frequency.setValueAtTime(frequency,start);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(volume||.035,start+.06);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    oscillator.connect(gain);gain.connect(context.destination);oscillator.start(start);oscillator.stop(start+duration+.05);
  }

  function playCeremonyAudio(kind){
    var context=audioContext();if(!context)return;
    if(context.state==='suspended')context.resume().catch(function(){});
    var start=context.currentTime+.05,notes;
    if(kind==='christian')notes=[[392,0,.8,'sine'],[493.88,.55,.9,'sine'],[587.33,1.2,1.2,'triangle']];
    else if(kind==='krishna')notes=[[440,0,.55,'sine'],[493.88,.48,.55,'sine'],[587.33,.96,.7,'sine'],[659.25,1.55,.85,'sine'],[587.33,2.2,1.15,'sine']];
    else notes=[[392,0,.9,'sine'],[440,.35,.75,'sine'],[493.88,.8,.9,'triangle'],[587.33,1.35,1.1,'sine'],[659.25,2.05,1.35,'sine']];
    notes.forEach(function(note,index){ceremonyTone(context,note[0],start+note[1],note[2],note[3],kind==='shared'&&index===notes.length-1?.05:.032);});
  }

  function startPrayerCeremony(kind){
    if(currentMap!=='grounds'||ceremony||transitioning||!PRAYER_TARGETS[kind])return;
    var target=PRAYER_TARGETS[kind],actor=players[target.actor];
    ceremony={kind:kind,frame:0,duration:350,actor:actor,startX:actor.x,startY:actor.y,targetX:target.x,targetY:target.y};
    actor.dir='up';actor.frame=0;actor.frameTimer=0;paused=true;setCeremonyUi(true);playCeremonyAudio(kind);
  }

  function startSharedCeremony(replay){
    if(currentMap!=='grounds'||ceremony||transitioning)return;
    ceremony={kind:'shared',frame:0,duration:440,replay:!!replay};
    paused=true;setCeremonyUi(true);playCeremonyAudio('shared');
  }

  function finishCeremony(){
    if(!ceremony)return;
    var finished=ceremony.kind;
    if(finished==='christian')blessingState.christian=true;
    if(finished==='krishna')blessingState.krishna=true;
    saveBlessingState();
    ceremony=null;
    if((finished==='christian'||finished==='krishna')&&blessingState.christian&&blessingState.krishna&&!blessingState.shared){
      startSharedCeremony(false);return;
    }
    if(finished==='shared'){
      blessingState.shared=true;saveBlessingState();
      setCeremonyUi(false);paused=false;
      showToast('BLESSING OF TWO PATHS','Two traditions, two hearts, and one future held together with love and respect.',360);
      return;
    }
    setCeremonyUi(false);paused=false;
    showToast(finished==='christian'?'CHRISTIAN PRAYER COMPLETE':'KRISHNA PRAYER COMPLETE',finished==='christian'?'Warm light remains beside the cross.':'Blue-gold light remains beside Krishna’s altar.',260);
  }

  function updateCeremony(){
    if(!ceremony)return;
    ceremony.frame++;
    if(ceremony.actor){
      var travel=clamp(ceremony.frame/72,0,1);
      var eased=travel<.5?2*travel*travel:1-Math.pow(-2*travel+2,2)/2;
      ceremony.actor.x=ceremony.startX+(ceremony.targetX-ceremony.startX)*eased;
      ceremony.actor.y=ceremony.startY+(ceremony.targetY-ceremony.startY)*eased;
      ceremony.actor.dir='up';ceremony.actor.frame=0;
    }
    if(ceremony.frame>=ceremony.duration)finishCeremony();
  }

  function ceremonyBow(player){
    if(!ceremony||ceremony.actor!==player)return 0;
    var frame=ceremony.frame;
    if(frame<78)return 0;
    if(frame<128)return (frame-78)/50;
    if(frame<285)return 1;
    return clamp(1-(frame-285)/48,0,1);
  }

  function ceremonyFocus(){
    if(!ceremony)return null;
    if(ceremony.kind==='christian')return {x:PRAYER_TARGETS.christian.focusX,y:PRAYER_TARGETS.christian.focusY};
    if(ceremony.kind==='krishna')return {x:PRAYER_TARGETS.krishna.focusX,y:PRAYER_TARGETS.krishna.focusY};
    var progress=clamp((ceremony.frame-30)/220,0,1);
    var eased=progress*progress*(3-2*progress);
    return {x:1090+(BLESSING_DOOR.x-1090)*eased,y:820+(BLESSING_DOOR.y-820)*eased};
  }

  function saveState(){
    try{sessionStorage.setItem('skyrootState',JSON.stringify({map:currentMap,her:{x:players.her.x,y:players.her.y,dir:players.her.dir},him:{x:players.him.x,y:players.him.y,dir:players.him.dir}}));}catch(error){}
  }

  function placePlayers(spawn){
    ['her','him'].forEach(function(who){players[who].x=spawn[who].x;players[who].y=spawn[who].y;players[who].dir=spawn[who].dir||'down';players[who].frame=0;players[who].frameTimer=0;});
  }

  function switchMap(nextMap){
    if(transitioning||!maps[nextMap])return;
    transitioning=true;transition.textContent=nextMap==='treehouse'?'RIDING INTO THE CANOPY…':'RETURNING TO THE ROOTS…';transition.classList.add('is-visible');
    setTimeout(function(){
      currentMap=nextMap;currentConfig=maps[currentMap];worldWidth=currentConfig.image.naturalWidth||1536;worldHeight=currentConfig.image.naturalHeight||1024;
      placePlayers(currentMap==='grounds'?maps.grounds.elevatorReturn:maps.treehouse.spawn);mapTitle.textContent=currentConfig.title;camera={x:0,y:0};clearBoxSelection(boxSelectMode?'B BOX TOOL ON - drag on the new map.':'');saveState();
      setTimeout(function(){transition.classList.remove('is-visible');transitioning=false;showToast(currentConfig.title,currentMap==='treehouse'?'The lift opens into one continuous canopy home.':'The lift returns you beneath the ancient tree.',210);},260);
    },460);
  }

  function handleAction(action){
    if(action==='treehouse'){switchMap('treehouse');return;}if(action==='grounds'){switchMap('grounds');return;}
    if(action==='christianPrayer'){startPrayerCeremony('christian');return;}
    if(action==='krishnaPrayer'){startPrayerCeremony('krishna');return;}
    if(action==='replayBlessing'){startSharedCeremony(true);return;}
    var messages={
      compass:['THE SEASONAL COMPASS','Its stones are ready to reflect spring, summer, fall, and winter when the seasonal map versions arrive.'],
      sap:['THE AMBER SAPWAYS','Golden sap moves through the ancient roots like warm light beneath the bark.'],
      chimes:['THE ROOT CHIMES','Wood, seed shells, and tiny bells make a soft song in the branches.'],
      creator:['SHARED CREATOR STUDIO','A place for code, art, games, and every strange idea you build together.'],
      family:['FUTURE-FAMILY ROOM','A gentle room kept for the family dreams you are building toward together.'],
      planning:['FUTURE PLANNING ROOM','Maps, calendars, blueprints, and dream boards hold the adventures still ahead.'],
      mojo:['MOJO PET LOFT','A cozy blue-accented loft made for Mojo and every future four-legged family member.'],
      observatory:['SKY OBSERVATORY','The telescope points past the canopy toward a sky full of future wishes.'],
      gear:['WEB-SLINGER GEAR ROOM','Your red-and-blue suits, masks, and web gear finally have a home of their own.'],
      balcony:['CLOUD BALCONY','A quiet place where the two of you can sit above the clouds and breathe.']
    };
    if(messages[action])showToast(messages[action][0],messages[action][1],300);
  }

  function interact(){if(paused||transitioning)return;var location=nearestLocation();if(location)handleAction(location.action);}

  function update(){
    updateCeremony();
    movePlayer(players.her,inputFor('her',{up:keys.arrowup,down:keys.arrowdown,left:keys.arrowleft,right:keys.arrowright}));
    movePlayer(players.him,inputFor('him',{up:keys.w,down:keys.s,left:keys.a,right:keys.d}));
    heartTimer++;
    var near=nearestLocation();
    if(near&&!paused&&!transitioning&&!ceremony){prompt.style.display='block';prompt.textContent=near.text;}else prompt.style.display='none';
    var active=!!keys.e||interactPressed;if(active&&!lastInteract)interact();lastInteract=active;interactPressed=false;
    if(toastTimer>0){toastTimer--;if(toastTimer===0)toast.classList.remove('is-visible');}
    if(heartTimer%120===0)saveState();
  }

  function getCamera(){
    var focus=ceremonyFocus();
    var cx=focus?focus.x:(players.her.x+players.him.x)/2,cy=focus?focus.y:(players.her.y+players.him.y)/2;
    return {x:clamp(cx-canvas.width/2,0,Math.max(0,worldWidth-canvas.width)),y:clamp(cy-canvas.height/2,0,Math.max(0,worldHeight-canvas.height))};
  }
  function screenX(x){return canvas.width>worldWidth?x+(canvas.width-worldWidth)/2:x-camera.x;}
  function screenY(y){return canvas.height>worldHeight?y+(canvas.height-worldHeight)/2:y-camera.y;}

  function spriteBounds(image,sx,sy,sw,sh){
    var key=(image.currentSrc||image.src||'sprite')+':'+sx+':'+sy+':'+sw+':'+sh;
    if(spriteBoundsCache.has(key))return spriteBoundsCache.get(key);
    try{
      var sample=document.createElement('canvas');
      sample.width=sw;sample.height=sh;
      var sampleContext=sample.getContext('2d',{willReadFrequently:true});
      sampleContext.clearRect(0,0,sw,sh);
      sampleContext.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);
      var pixels=sampleContext.getImageData(0,0,sw,sh).data;
      var minX=sw,minY=sh,maxX=-1,maxY=-1;
      for(var y=0;y<sh;y++){
        for(var x=0;x<sw;x++){
          if(pixels[(y*sw+x)*4+3]>10){
            if(x<minX)minX=x;if(x>maxX)maxX=x;
            if(y<minY)minY=y;if(y>maxY)maxY=y;
          }
        }
      }
      if(maxX<0){var empty={x:0,y:0,w:sw,h:sh};spriteBoundsCache.set(key,empty);return empty;}
      var padding=2;
      var left=Math.max(0,minX-padding),top=Math.max(0,minY-padding);
      var right=Math.min(sw,maxX+1+padding),bottom=Math.min(sh,maxY+1+padding);
      var bounds={
        x:left,
        y:top,
        w:right-left,
        h:bottom-top
      };
      spriteBoundsCache.set(key,bounds);return bounds;
    }catch(error){
      var fallback={x:0,y:0,w:sw,h:sh};spriteBoundsCache.set(key,fallback);return fallback;
    }
  }

  function cacheSpriteBounds(image){
    var sw=Math.round(image.naturalWidth/4),sh=Math.round(image.naturalHeight/4);
    for(var row=0;row<4;row++)for(var frame=0;frame<4;frame++)spriteBounds(image,frame*sw,row*sh,sw,sh);
  }

  function drawSprite(player){
    var sw=Math.round(player.img.naturalWidth/4),sh=Math.round(player.img.naturalHeight/4);
    if(!sw||!sh)return;
    var row=player.rows[player.dir];
    var frame=clamp(player.frame||0,0,3);
    var sx=frame*sw,sy=row*sh;
    var bounds=spriteBounds(player.img,sx,sy,sw,sh);
    var targetHeight=Math.round(128*player.scale);
    var targetWidth=Math.max(1,Math.round(bounds.w*(targetHeight/bounds.h)));
    var drawX=Math.round(screenX(player.x)-targetWidth/2);
    var drawY=Math.round(screenY(player.y)-targetHeight+10);

    var bow=ceremonyBow(player);
    if(bow>0){
      var pivotX=Math.round(screenX(player.x)),pivotY=Math.round(screenY(player.y)+10);
      ctx.save();ctx.translate(pivotX,pivotY);ctx.rotate((player===players.him?.20:.16)*bow);
      ctx.drawImage(player.img,sx+bounds.x,sy+bounds.y,bounds.w,bounds.h,-Math.round(targetWidth/2),-targetHeight,targetWidth,targetHeight);
      ctx.restore();return;
    }

    if(player===players.him&&player.dir==='left'){
      ctx.save();ctx.translate(drawX+targetWidth,drawY);ctx.scale(-1,1);
      ctx.drawImage(player.img,sx+bounds.x,sy+bounds.y,bounds.w,bounds.h,0,0,targetWidth,targetHeight);
      ctx.restore();return;
    }
    ctx.drawImage(player.img,sx+bounds.x,sy+bounds.y,bounds.w,bounds.h,drawX,drawY,targetWidth,targetHeight);
  }

  function traceDebugShape(shape){
    ctx.beginPath();
    if(shape.type==='ellipse')ctx.ellipse(screenX(shape.x),screenY(shape.y),shape.rx,shape.ry,0,0,Math.PI*2);
    else ctx.rect(screenX(shape.x),screenY(shape.y),shape.w,shape.h);
  }

  function drawDebugShape(shape,fill,stroke){
    traceDebugShape(shape);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();
  }

  function drawDebugCircle(x,y,r,fill,stroke){
    ctx.beginPath();ctx.arc(screenX(x),screenY(y),r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();
  }

  function drawDebugLabel(text,x,y){
    ctx.font='12px monospace';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.fillStyle='#fff';
    ctx.strokeText(text,screenX(x)+7,screenY(y)-7);ctx.fillText(text,screenX(x)+7,screenY(y)-7);
  }

  function drawDebugPanel(){
    var panelX=12,panelY=68,panelWidth=Math.min(canvas.width-24,650),panelHeight=138;
    ctx.fillStyle='rgba(4,10,18,.88)';ctx.fillRect(panelX,panelY,panelWidth,panelHeight);
    ctx.strokeStyle='#7ce6ff';ctx.lineWidth=2;ctx.strokeRect(panelX,panelY,panelWidth,panelHeight);
    ctx.fillStyle='#fff';ctx.font='12px monospace';
    ctx.fillText('DEBUG ON - G hide | B box selector',panelX+10,panelY+20,panelWidth-20);
    ctx.fillText('Map: '+currentMap+' | Her outfit #'+selectedOutfit('her')+' | His outfit #'+selectedOutfit('him'),panelX+10,panelY+42,panelWidth-20);
    ctx.fillText('Her: '+Math.round(players.her.x)+', '+Math.round(players.her.y)+' '+players.her.dir+' | Me: '+Math.round(players.him.x)+', '+Math.round(players.him.y)+' '+players.him.dir,panelX+10,panelY+64,panelWidth-20);
    ctx.fillText('Red blocked | Green walkable | Gold interact | Purple spawn',panelX+10,panelY+86,panelWidth-20);
    ctx.fillText('Sprite feet are the blue center points.',panelX+10,panelY+106,panelWidth-20);
    ctx.fillText('Blessings: Cross '+(blessingState.christian?'YES':'no')+' | Krishna '+(blessingState.krishna?'YES':'no')+' | Shared '+(blessingState.shared?'YES':'no'),panelX+10,panelY+128,panelWidth-20);
  }

  function drawDebugZones(){
    if(!debugMode)return;
    ctx.save();
    if(currentConfig.walkable)currentConfig.walkable.forEach(function(shape){drawDebugShape(shape,'rgba(44,255,126,.13)','rgba(83,255,145,.72)');});
    currentConfig.solids.forEach(function(shape){drawDebugShape(shape,'rgba(255,45,62,.24)','rgba(255,89,101,.82)');});
    currentConfig.locations.forEach(function(location){
      if(location.requiresBlessing&&!blessingState.shared)return;
      drawDebugCircle(location.x,location.y,location.r,'rgba(255,198,63,.18)','rgba(255,218,112,.9)');drawDebugLabel(location.name,location.x,location.y);
    });
    if(currentMap==='grounds')drawDebugCircle(BLESSING_DOOR.x,BLESSING_DOOR.y,BLESSING_DOOR.r,'rgba(110,182,255,.08)','rgba(178,220,255,.86)');
    Object.keys(currentConfig.spawn).forEach(function(who){var spawn=currentConfig.spawn[who];drawDebugCircle(spawn.x,spawn.y,15,'rgba(179,92,255,.72)','#f1d7ff');});
    if(currentConfig.elevatorReturn)Object.keys(currentConfig.elevatorReturn).forEach(function(who){var spawn=currentConfig.elevatorReturn[who];drawDebugCircle(spawn.x,spawn.y,12,'rgba(179,92,255,.55)','#f1d7ff');});
    drawDebugCircle(players.her.x,players.her.y,9,'rgba(26,151,255,.88)','#fff');
    drawDebugCircle(players.him.x,players.him.y,9,'rgba(26,151,255,.88)','#fff');
    drawDebugPanel();ctx.restore();
  }

  function selectionRect(a,b){
    return {x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)};
  }

  function drawBoxSelector(){
    if(!boxSelectMode)return;
    ctx.save();
    var selection=boxResult||(boxStart&&boxCurrent?selectionRect(boxStart,boxCurrent):null);
    if(selection){
      var x=screenX(selection.x),y=screenY(selection.y);
      ctx.fillStyle='rgba(0,180,255,.22)';ctx.fillRect(x,y,selection.w,selection.h);
      ctx.strokeStyle='#00d5ff';ctx.lineWidth=3;ctx.strokeRect(x,y,selection.w,selection.h);
      ctx.fillStyle='#fff';ctx.font='12px monospace';ctx.fillText('x:'+selection.x+' y:'+selection.y+' w:'+selection.w+' h:'+selection.h,x+6,y-7);
    }else if(boxStart){
      drawDebugCircle(boxStart.x,boxStart.y,9,'rgba(0,213,255,.25)','#00d5ff');
    }
    var panelY=debugMode?216:68,panelWidth=Math.min(canvas.width-24,650);
    ctx.fillStyle='rgba(4,10,18,.9)';ctx.fillRect(12,panelY,panelWidth,42);
    ctx.strokeStyle='#00d5ff';ctx.lineWidth=2;ctx.strokeRect(12,panelY,panelWidth,42);
    ctx.fillStyle='#fff';ctx.font='12px monospace';ctx.fillText(boxText||'B BOX TOOL ON - drag on the map, then check Console',22,panelY+26,panelWidth-20);
    ctx.restore();
  }


  function worldRadialGlow(x,y,r,inner,outer){
    var sx=screenX(x),sy=screenY(y),gradient=ctx.createRadialGradient(sx,sy,3,sx,sy,r);
    gradient.addColorStop(0,inner);gradient.addColorStop(1,outer);
    ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(sx,sy,r,0,Math.PI*2);ctx.fill();
  }

  function drawPermanentBlessings(){
    if(currentMap!=='grounds')return;
    ctx.save();ctx.globalCompositeOperation='screen';
    if(blessingState.christian)worldRadialGlow(920,842,72,'rgba(255,218,121,.24)','rgba(255,193,73,0)');
    if(blessingState.krishna)worldRadialGlow(1260,842,76,'rgba(92,166,255,.22)','rgba(255,191,73,0)');
    if(blessingState.shared){
      var pulse=1+Math.sin(heartTimer/32)*.025;
      ctx.beginPath();ctx.arc(screenX(BLESSING_DOOR.x),screenY(BLESSING_DOOR.y),BLESSING_DOOR.r*pulse,0,Math.PI*2);
      ctx.strokeStyle='rgba(139,199,255,.28)';ctx.lineWidth=8;ctx.shadowColor='#ffcf73';ctx.shadowBlur=17;ctx.stroke();
      ctx.beginPath();ctx.arc(screenX(BLESSING_DOOR.x),screenY(BLESSING_DOOR.y),BLESSING_DOOR.r*pulse-5,0,Math.PI*2);
      ctx.strokeStyle='rgba(255,213,116,.26)';ctx.lineWidth=3;ctx.stroke();
    }
    ctx.restore();
  }

  function quadraticPoint(from,control,to,t){
    var one=1-t;
    return {x:one*one*from.x+2*one*t*control.x+t*t*to.x,y:one*one*from.y+2*one*t*control.y+t*t*to.y};
  }

  function drawLightTrail(from,control,to,progress,color){
    if(progress<=0)return;
    var steps=52,end=Math.max(1,Math.floor(steps*clamp(progress,0,1)));
    ctx.beginPath();
    for(var index=0;index<=end;index++){
      var point=quadraticPoint(from,control,to,index/steps),x=screenX(point.x),y=screenY(point.y);
      if(index===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.strokeStyle=color;ctx.lineWidth=7;ctx.lineCap='round';ctx.shadowColor=color;ctx.shadowBlur=18;ctx.stroke();
    var head=quadraticPoint(from,control,to,end/steps);
    ctx.beginPath();ctx.arc(screenX(head.x),screenY(head.y),9,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  }

  function ceremonyStrength(){
    if(!ceremony)return 0;
    var enter=clamp(ceremony.frame/35,0,1),leave=clamp((ceremony.duration-ceremony.frame)/35,0,1);
    return Math.min(enter,leave);
  }

  function drawCeremonyUnderlay(){
    drawPermanentBlessings();
    if(!ceremony||currentMap!=='grounds')return;
    var strength=ceremonyStrength();
    ctx.save();ctx.fillStyle='rgba(1,5,9,'+(.30*strength)+')';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.globalCompositeOperation='screen';
    if(ceremony.kind==='christian'){
      worldRadialGlow(920,830,150,'rgba(255,229,155,'+(.5*strength)+')','rgba(255,174,57,0)');
      ctx.strokeStyle='rgba(255,231,166,'+(.62*strength)+')';ctx.lineWidth=5;ctx.shadowColor='#ffd273';ctx.shadowBlur=22;
      ctx.beginPath();ctx.moveTo(screenX(920),screenY(750));ctx.lineTo(screenX(920),screenY(845));ctx.moveTo(screenX(884),screenY(786));ctx.lineTo(screenX(956),screenY(786));ctx.stroke();
    }else if(ceremony.kind==='krishna'){
      worldRadialGlow(1260,830,160,'rgba(96,179,255,'+(.48*strength)+')','rgba(255,189,67,0)');
      worldRadialGlow(1260,847,54,'rgba(255,211,104,'+(.58*strength)+')','rgba(255,179,42,0)');
    }else{
      var progress=clamp((ceremony.frame-45)/220,0,1);
      drawLightTrail({x:920,y:850},{x:870,y:660},BLESSING_DOOR,progress,'rgba(255,207,102,.88)');
      drawLightTrail({x:1260,y:850},{x:1110,y:610},BLESSING_DOOR,progress,'rgba(92,177,255,.9)');
      if(progress>.70){
        var ringProgress=clamp((progress-.70)/.30,0,1),ringRadius=BLESSING_DOOR.r*(.72+.28*ringProgress);
        ctx.beginPath();ctx.arc(screenX(BLESSING_DOOR.x),screenY(BLESSING_DOOR.y),ringRadius,0,Math.PI*2);
        ctx.strokeStyle='rgba(178,218,255,'+(.88*ringProgress*strength)+')';ctx.lineWidth=12;ctx.shadowColor='#ffcf72';ctx.shadowBlur=30;ctx.stroke();
        ctx.beginPath();ctx.arc(screenX(BLESSING_DOOR.x),screenY(BLESSING_DOOR.y),Math.max(4,ringRadius-7),0,Math.PI*2);
        ctx.strokeStyle='rgba(255,214,116,'+(.9*ringProgress*strength)+')';ctx.lineWidth=4;ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawCeremonyParticles(){
    if(!ceremony||currentMap!=='grounds')return;
    var strength=ceremonyStrength(),kind=ceremony.kind;
    ctx.save();ctx.globalCompositeOperation='screen';
    if(kind==='christian'||kind==='krishna'){
      var centerX=kind==='christian'?920:1260,centerY=kind==='christian'?865:858;
      for(var i=0;i<22;i++){
        var travel=((ceremony.frame*1.2+i*29)%190)/190;
        var drift=Math.sin(i*2.73+ceremony.frame/35)*(30+(i%5)*9);
        var x=screenX(centerX+drift),y=screenY(centerY-travel*185);
        ctx.globalAlpha=(.25+.7*(1-travel))*strength;
        if(kind==='krishna'&&i%3===0){
          ctx.fillStyle=i%2?'#ffbc3e':'#ff7f45';ctx.translate(x,y);ctx.rotate(travel*5+i);ctx.fillRect(-4,-2,8,4);ctx.setTransform(1,0,0,1,0,0);
        }else{
          ctx.fillStyle=kind==='christian'?'#ffe8a5':(i%2?'#83c8ff':'#ffd477');
          ctx.beginPath();ctx.arc(x,y,2+(i%3),0,Math.PI*2);ctx.fill();
        }
      }
      if(kind==='krishna'&&ceremony.frame>105&&ceremony.frame<285){
        ctx.globalAlpha=.72*strength;ctx.fillStyle='#bde5ff';ctx.font='bold 22px monospace';
        ctx.fillText('♪',screenX(1195),screenY(760));ctx.fillText('♫',screenX(1310),screenY(735));
      }
    }else{
      var doorGlow=clamp((ceremony.frame-190)/90,0,1);
      for(var spark=0;spark<28;spark++){
        var angle=spark/28*Math.PI*2+ceremony.frame/100;
        var radius=BLESSING_DOOR.r+(spark%4)*11+Math.sin(ceremony.frame/18+spark)*6;
        ctx.globalAlpha=doorGlow*strength*(.35+(spark%3)*.18);
        ctx.fillStyle=spark%2?'#ffd47c':'#91cfff';
        ctx.beginPath();ctx.arc(screenX(BLESSING_DOOR.x)+Math.cos(angle)*radius,screenY(BLESSING_DOOR.y)+Math.sin(angle)*radius,2+(spark%3),0,Math.PI*2);ctx.fill();
      }
    }
    ctx.restore();
    drawCeremonyCaption();
  }

  function drawCeremonyCaption(){
    if(!ceremony)return;
    var strength=ceremonyStrength(),title,subtitle;
    if(ceremony.kind==='christian'){title='A QUIET MOMENT WITH GOD';subtitle='Warm light gathers around the cross.';}
    else if(ceremony.kind==='krishna'){title='A QUIET MOMENT WITH KRISHNA';subtitle='The diya glows in blue and gold as petals rise.';}
    else{title='BLESSING OF TWO PATHS';subtitle='Two traditions. Two hearts. One future together.';}
    var titleSize=Math.max(17,Math.min(27,canvas.width/17)),subtitleSize=Math.max(12,Math.min(17,canvas.width/25));
    var panelWidth=Math.min(canvas.width-28,570),panelX=(canvas.width-panelWidth)/2,panelY=canvas.height-Math.max(142,canvas.height*.20);
    ctx.save();ctx.globalAlpha=strength;ctx.fillStyle='rgba(4,10,16,.80)';ctx.fillRect(panelX,panelY,panelWidth,78);
    ctx.strokeStyle=ceremony.kind==='krishna'?'rgba(125,197,255,.8)':'rgba(255,216,125,.8)';ctx.lineWidth=2;ctx.strokeRect(panelX,panelY,panelWidth,78);
    ctx.textAlign='center';ctx.fillStyle='#fff0bc';ctx.font='900 '+titleSize+'px monospace';ctx.fillText(title,canvas.width/2,panelY+30);
    ctx.fillStyle='#e9f2ed';ctx.font=subtitleSize+'px monospace';ctx.fillText(subtitle,canvas.width/2,panelY+57);
    ctx.restore();
  }

  function drawHeart(){
    if(Math.hypot(players.her.x-players.him.x,players.her.y-players.him.y)>48)return;
    var blocks=[[1,0],[2,0],[4,0],[5,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[1,3],[2,3],[3,3],[4,3],[5,3],[2,4],[3,4],[4,4],[3,5]];
    var size=Math.sin(heartTimer/10)>0?4:3,x=screenX((players.her.x+players.him.x)/2)-3.5*size,y=screenY(Math.min(players.her.y,players.him.y))-55+Math.sin(heartTimer/12)*5-3*size;
    ctx.save();ctx.shadowColor='#ff7ac8';ctx.shadowBlur=10;ctx.fillStyle='#ff6bb5';
    blocks.forEach(function(block){ctx.fillRect(Math.round(x+block[0]*size),Math.round(y+block[1]*size),size,size);});ctx.restore();
  }

  function draw(){
    camera=getCamera();ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle=currentMap==='grounds'?'#07100c':'#0b1530';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingEnabled=false;ctx.drawImage(currentConfig.image,Math.round(screenX(0)),Math.round(screenY(0)));
    drawCeremonyUnderlay();drawDebugZones();[players.her,players.him].sort(function(a,b){return a.y-b.y;}).forEach(drawSprite);drawHeart();drawCeremonyParticles();drawBoxSelector();
  }

  function loop(){update();draw();requestAnimationFrame(loop);}

  function restoreState(){
    var fromForest=new URLSearchParams(location.search).get('from')==='forest';
    if(fromForest){try{sessionStorage.removeItem('skyrootState');}catch(error){}currentMap='grounds';currentConfig=maps.grounds;placePlayers(maps.grounds.spawn);return;}
    try{
      var saved=JSON.parse(sessionStorage.getItem('skyrootState')||'null');if(!saved||!maps[saved.map])return;
      currentMap=saved.map;currentConfig=maps[currentMap];
      ['her','him'].forEach(function(who){if(saved[who]&&Number.isFinite(saved[who].x)&&Number.isFinite(saved[who].y)){players[who].x=saved[who].x;players[who].y=saved[who].y;players[who].dir=saved[who].dir||'down';}});
    }catch(error){}
  }

  function clearBoxSelection(message){
    boxStart=null;boxCurrent=null;boxResult=null;boxText=message||'';
  }

  function worldPointFromEvent(event){
    var bounds=canvas.getBoundingClientRect();
    var canvasX=(event.clientX-bounds.left)*(canvas.width/bounds.width);
    var canvasY=(event.clientY-bounds.top)*(canvas.height/bounds.height);
    return {
      x:Math.round(canvas.width>worldWidth?canvasX-(canvas.width-worldWidth)/2:canvasX+camera.x),
      y:Math.round(canvas.height>worldHeight?canvasY-(canvas.height-worldHeight)/2:canvasY+camera.y)
    };
  }

  function finishBoxSelection(event){
    if(!boxSelectMode||!boxStart)return;
    boxCurrent=worldPointFromEvent(event);boxResult=selectionRect(boxStart,boxCurrent);
    boxText='x:'+boxResult.x+', y:'+boxResult.y+', w:'+boxResult.w+', h:'+boxResult.h;
    console.log('COPY THIS: {x:'+boxResult.x+', y:'+boxResult.y+', w:'+boxResult.w+', h:'+boxResult.h+'}');
    boxStart=null;boxCurrent=null;
  }

  function bindDebugTools(){
    canvas.addEventListener('pointerdown',function(event){
      if(!boxSelectMode||event.button!==0)return;
      event.preventDefault();boxResult=null;boxStart=worldPointFromEvent(event);boxCurrent=boxStart;
      boxText='Dragging from x:'+boxStart.x+', y:'+boxStart.y;
      try{canvas.setPointerCapture(event.pointerId);}catch(error){}
    });
    canvas.addEventListener('pointermove',function(event){
      if(!boxSelectMode||!boxStart)return;
      event.preventDefault();boxCurrent=worldPointFromEvent(event);
    });
    canvas.addEventListener('pointerup',function(event){
      if(!boxSelectMode||!boxStart)return;
      event.preventDefault();finishBoxSelection(event);
      try{canvas.releasePointerCapture(event.pointerId);}catch(error){}
    });
    canvas.addEventListener('pointercancel',function(){if(boxStart)clearBoxSelection('Selection cancelled - drag again.');});
  }

  function bindTouch(){
    document.querySelectorAll('.touch-pad button').forEach(function(button){
      var pad=button.closest('.touch-pad'),who=pad.getAttribute('data-player'),direction=button.getAttribute('data-direction');
      function release(event){if(event)event.preventDefault();touchState[who][direction]=false;}
      button.addEventListener('pointerdown',function(event){event.preventDefault();touchState[who][direction]=true;try{button.setPointerCapture(event.pointerId);}catch(error){}});
      button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
    });
    interactButton.addEventListener('pointerdown',function(event){event.preventDefault();interactPressed=true;});
  }

  addEventListener('resize',resize);
  addEventListener('keydown',function(event){
    var key=event.key.toLowerCase();
    if(key==='g'){
      if(!event.repeat){debugMode=!debugMode;console.log(debugMode?'SKYROOT DEBUG ON':'SKYROOT DEBUG OFF');}
      event.preventDefault();return;
    }
    if(key==='b'){
      if(!event.repeat){
        boxSelectMode=!boxSelectMode;clearBoxSelection(boxSelectMode?'B BOX TOOL ON - drag on the map, then check Console.':'');
        canvas.style.cursor=boxSelectMode?'crosshair':'';
        console.log(boxSelectMode?'SKYROOT BOX SELECT ON - drag a box':'SKYROOT BOX SELECT OFF');
      }
      event.preventDefault();return;
    }
    if(key==='escape'&&boxSelectMode){clearBoxSelection('Selection cleared - press B to turn the tool off.');event.preventDefault();return;}
    if(key==='escape'){
      if(ceremony){event.preventDefault();return;}
      if(faithMoment.classList.contains('is-visible'))closePrayerPanel();else location.href='index.html';event.preventDefault();return;
    }
    keys[key]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].indexOf(key)!==-1)event.preventDefault();
  });
  addEventListener('keyup',function(event){keys[event.key.toLowerCase()]=false;});
  addEventListener('beforeunload',saveState);
  addEventListener('pageshow',refreshOutfits);
  addEventListener('storage',function(event){if(event.key==='herOutfit'||event.key==='himOutfit')refreshOutfits();});
  closeFaith.addEventListener('click',closePrayerPanel);
  faithMoment.addEventListener('click',function(event){if(event.target===faithMoment)closePrayerPanel();});
  window.skyrootDebugTools={
    getState:function(){return {map:currentMap,debug:debugMode,boxSelect:boxSelectMode,outfits:{her:selectedOutfit('her'),him:selectedOutfit('him')},blessings:{christian:blessingState.christian,krishna:blessingState.krishna,shared:blessingState.shared,ceremony:ceremony?ceremony.kind:null},players:{her:{x:players.her.x,y:players.her.y,dir:players.her.dir,frame:players.her.frame},him:{x:players.him.x,y:players.him.y,dir:players.him.dir,frame:players.him.frame}}};},
    replayBlessing:function(){if(blessingState.shared)startSharedCeremony(true);},
    resetBlessings:function(){blessingState={christian:false,krishna:false,shared:false};saveBlessingState();return this.getState();}
  };
  bindTouch();bindDebugTools();resize();

  Promise.all([images.grounds.decode(),images.treehouse.decode(),images.her.decode(),images.him.decode()]).then(function(){
    cacheSpriteBounds(images.her);cacheSpriteBounds(images.him);
    restoreState();currentConfig=maps[currentMap];worldWidth=currentConfig.image.naturalWidth||1536;worldHeight=currentConfig.image.naturalHeight||1024;mapTitle.textContent=currentConfig.title;
    loading.classList.add('is-hidden');setTimeout(function(){loading.remove();},560);
    showToast(currentConfig.title,currentMap==='grounds'?'The forest path has brought you beneath the ancient tree.':'Welcome back to your connected canopy home.',210);loop();
  }).catch(function(){loading.querySelector('strong').textContent='SKYROOT COULD NOT LOAD';loading.querySelector('span').textContent='Please refresh and try again.';});
})();
