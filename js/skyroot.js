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

  var images={grounds:new Image(),treehouse:new Image(),her:new Image(),him:new Image()};
  images.grounds.src='assets/maps/skyroot-grounds.png';
  images.treehouse.src='assets/maps/skyroot-treehouse.png';
  images.her.src='assets/sprites/her_atlas.png';
  images.him.src='assets/sprites/him_atlas.png';

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
    her:{img:images.her,x:maps.grounds.spawn.her.x,y:maps.grounds.spawn.her.y,dir:'up',frame:0,speed:3,scale:.58,rows:{down:0,up:2,left:3,right:1},frames:{down:[0,1,2,3],up:[0,1,2,3],left:[0,1,2,3],right:[0,1,2,3]}},
    him:{img:images.him,x:maps.grounds.spawn.him.x,y:maps.grounds.spawn.him.y,dir:'up',frame:0,speed:3,scale:.58,rows:{down:0,up:2,left:3,right:1},frames:{down:[0,1,2],up:[0,1,2],left:[0,1,2],right:[0,1,2]}}
  };
  window.skyrootPlayers=players;

  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function resize(){canvas.width=Math.max(1,innerWidth);canvas.height=Math.max(1,innerHeight);ctx.imageSmoothingEnabled=false;}

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
  function closePrayerPanel(){faithMoment.classList.remove('is-visible');paused=false;}

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
      placePlayers(currentMap==='grounds'?maps.grounds.elevatorReturn:maps.treehouse.spawn);mapTitle.textContent=currentConfig.title;camera={x:0,y:0};saveState();
      setTimeout(function(){transition.classList.remove('is-visible');transitioning=false;showToast(currentConfig.title,currentMap==='treehouse'?'The lift opens into one continuous canopy home.':'The lift returns you beneath the ancient tree.',210);},260);
    },460);
  }

  function handleAction(action){
    if(action==='treehouse'){switchMap('treehouse');return;}if(action==='grounds'){switchMap('grounds');return;}
    if(action==='christianPrayer'){openPrayer('A quiet moment with God','The candles glow beside the cross and open Bible while you take a peaceful moment to pray.');return;}
    if(action==='krishnaPrayer'){openPrayer('A quiet moment with Krishna','The diya glows beside Krishna, the sacred footprints, prayer book, flowers, and puja vessels while Tanima takes a peaceful moment for prayer.');return;}
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
    movePlayer(players.her,inputFor('her',{up:keys.arrowup,down:keys.arrowdown,left:keys.arrowleft,right:keys.arrowright}));
    movePlayer(players.him,inputFor('him',{up:keys.w,down:keys.s,left:keys.a,right:keys.d}));
    heartTimer++;
    var near=nearestLocation();
    if(near&&!paused&&!transitioning){prompt.style.display='block';prompt.textContent=near.text;}else prompt.style.display='none';
    var active=!!keys.e||interactPressed;if(active&&!lastInteract)interact();lastInteract=active;interactPressed=false;
    if(toastTimer>0){toastTimer--;if(toastTimer===0)toast.classList.remove('is-visible');}
    if(heartTimer%120===0)saveState();
  }

  function getCamera(){
    var cx=(players.her.x+players.him.x)/2,cy=(players.her.y+players.him.y)/2;
    return {x:clamp(cx-canvas.width/2,0,Math.max(0,worldWidth-canvas.width)),y:clamp(cy-canvas.height/2,0,Math.max(0,worldHeight-canvas.height))};
  }
  function screenX(x){return canvas.width>worldWidth?x+(canvas.width-worldWidth)/2:x-camera.x;}
  function screenY(y){return canvas.height>worldHeight?y+(canvas.height-worldHeight)/2:y-camera.y;}

  function drawSprite(player){
    var sw=96,sh=128,row=player.rows[player.dir],dw=Math.round(sw*player.scale),dh=Math.round(sh*player.scale);
    var x=Math.round(screenX(player.x)-dw/2),y=Math.round(screenY(player.y)-dh+10),drawWidth=dw;
    if(player===players.him&&player.dir==='right'){x-=4;drawWidth+=8;}
    ctx.drawImage(player.img,player.frame*sw,row*sh,sw,sh,x,y,drawWidth,dh);
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
    [players.her,players.him].sort(function(a,b){return a.y-b.y;}).forEach(drawSprite);drawHeart();
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
    if(key==='escape'){if(faithMoment.classList.contains('is-visible'))closePrayerPanel();else location.href='index.html';event.preventDefault();return;}
    keys[key]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].indexOf(key)!==-1)event.preventDefault();
  });
  addEventListener('keyup',function(event){keys[event.key.toLowerCase()]=false;});
  addEventListener('beforeunload',saveState);
  closeFaith.addEventListener('click',closePrayerPanel);
  faithMoment.addEventListener('click',function(event){if(event.target===faithMoment)closePrayerPanel();});
  bindTouch();resize();

  Promise.all([images.grounds.decode(),images.treehouse.decode(),images.her.decode(),images.him.decode()]).then(function(){
    restoreState();currentConfig=maps[currentMap];worldWidth=currentConfig.image.naturalWidth||1536;worldHeight=currentConfig.image.naturalHeight||1024;mapTitle.textContent=currentConfig.title;
    loading.classList.add('is-hidden');setTimeout(function(){loading.remove();},560);
    showToast(currentConfig.title,currentMap==='grounds'?'The forest path has brought you beneath the ancient tree.':'Welcome back to your connected canopy home.',210);loop();
  }).catch(function(){loading.querySelector('strong').textContent='SKYROOT COULD NOT LOAD';loading.querySelector('span').textContent='Please refresh and try again.';});
})();
