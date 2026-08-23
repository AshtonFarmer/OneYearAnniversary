// Automatic two-runner circuit through the connected 3x3 Speed Force forest,
// with a guaranteed Flash/Hot Pursuit opening and a comic-speedster pursuit bag.
// Every south-gate finish continues through the configured breach-linked worlds,
// restores the saved site-wide outfits, and lands on the configured final map.
(function(){
  'use strict';

  const canvas=document.getElementById('game');
  const ctx=canvas.getContext('2d');
  const loader=document.getElementById('loader');
  const finish=document.getElementById('finish');
  const startButton=document.getElementById('startButton');
  const replayButton=document.getElementById('replayButton');
  const backButton=document.getElementById('backButton');
  const finishHome=document.getElementById('finishHome');
  const loadText=document.getElementById('loadText');
  const status=document.getElementById('status');
  const chapter=document.getElementById('chapter');
  const chapterLabel=chapter.querySelector('small');
  const sectorName=document.getElementById('sectorName');
  const progressLabel=document.getElementById('progressLabel');
  const progressFill=document.getElementById('progressFill');
  const progressPercent=document.getElementById('progressPercent');
  const speedFlash=document.getElementById('speedFlash');
  const pursuitAlert=document.getElementById('pursuitAlert');
  const alertEyebrow=pursuitAlert.querySelector('small');
  const alertTitle=pursuitAlert.querySelector('strong');
  const alertSubtitle=pursuitAlert.querySelector('span');

  const TILE=1254;
  const WORLD=TILE*3;
  const CELL=256;
  const SPRITE_SIZE=164;
  const PURSUIT_SIZE=216;
  const RUN_DURATION=37;
  const BREACH_DURATION=2.2;
  const BREACH_FRAME_COUNT=16;
  const PURSUIT_LAUNCH_DELAY=.42;
  const EXIT_BREACH_OPEN_AT=.9;
  const EXIT_BREACH_FINISH_DURATION=1.68;
  const EXIT_BREACH_WIDTH=360;
  const EXIT_BREACH_HEIGHT=410;
  const multiverseConfig=window.SPEED_FORCE_MULTIVERSE||{worlds:[],destination:{name:'Dawn Nexus',url:'dawn-nexus.html?from=speed-force'}};
  const TUNNEL_DURATION=Number(multiverseConfig.tunnelDuration)||1.55;
  const WORLD_DURATION=Number(multiverseConfig.worldDuration)||1.72;
  const FINAL_WORLD_DURATION=Number(multiverseConfig.finalDuration)||3.35;
  const MULTIVERSE_LANDING_DURATION=Number(multiverseConfig.landingDuration)||1.12;
  const FINAL_DESTINATION=multiverseConfig.destination||{name:'Dawn Nexus',url:'dawn-nexus.html?from=speed-force'};
  const CHASE_START_RUN=5; // Initial run + three replays must finish first.
  const MAX_PURSUERS=5;
  const REDUCED=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const fallbackRoster=[
    {
      id:'flash-new52',name:'New 52 Flash',asset:'assets/sprites/him_outfit10_run.png',
      guaranteedRun:1,random:false,spriteSize:SPRITE_SIZE,leadBoost:0,
      lightning:{label:'GOLD SPEED FORCE',core:'#fff9cf',bright:'#ffd438',outer:'#ff7a14',shadow:'rgba(255,176,35,.9)'}
    },
    {
      id:'hot-pursuit',name:'Hot Pursuit',asset:'assets/sprites/him_hot_pursuit_run.png',
      guaranteedRun:2,random:false,spriteSize:PURSUIT_SIZE,leadBoost:88,special:'breach',
      lightning:{label:'COSMIC CYAN + ORANGE',core:'#eaffff',bright:'#60efff',outer:'#ff7d0b',shadow:'rgba(87,235,255,.96)'}
    }
  ];
  const rosterSource=Array.isArray(window.SPEEDSTER_ROSTER)&&window.SPEEDSTER_ROSTER.length>=2
    ?window.SPEEDSTER_ROSTER:fallbackRoster;
  const speedsterRoster=rosterSource.map(entry=>({...entry,image:null,loaded:false,failed:false}));
  const speedsterById=new Map(speedsterRoster.map(entry=>[entry.id,entry]));
  const baseSpeedster=speedsterById.get('flash-new52')||speedsterRoster[0];
  const pursuitSpeedster=speedsterById.get('hot-pursuit')||speedsterRoster[1]||baseSpeedster;
  const randomSpeedsters=speedsterRoster.filter(entry=>entry.random);

  const tileDefinitions=[
    {key:'northwest',name:'Thunderbloom Grove',col:0,row:0},
    {key:'north',name:'Moonpath Gate',col:1,row:0},
    {key:'northeast',name:'Crystal Canopy',col:2,row:0},
    {key:'west',name:'Waterfall Bend',col:0,row:1},
    {key:'center',name:'Velocity Shrine',col:1,row:1},
    {key:'east',name:'Silverwood Run',col:2,row:1},
    {key:'southwest',name:'Rootfall Switchbacks',col:0,row:2},
    {key:'south',name:'Midnight Straight',col:1,row:2},
    {key:'southeast',name:'Stormglass Ruins',col:2,row:2}
  ];

  // The nine split maps stay available as individual game assets, but the
  // cinematic uses their shared master so only one environment image request
  // can hold up the loading screen.
  const tiles=tileDefinitions.map(definition=>({
    ...definition,x:definition.col*TILE,y:definition.row*TILE
  }));
  const worldImage=new Image();
  worldImage.src='assets/speed-force/speed-force-master.png';

  function loadSpeedsterImage(speedster){
    if(speedster.image)return speedster.image;
    const image=new Image();
    speedster.image=image;
    image.addEventListener('load',()=>{speedster.loaded=true;speedster.failed=false;},{once:true});
    image.addEventListener('error',()=>{speedster.failed=true;},{once:true});
    image.src=speedster.asset;
    if(image.complete&&image.naturalWidth>0)speedster.loaded=true;
    return image;
  }

  const himImage=loadSpeedsterImage(baseSpeedster);
  const herImage=new Image();
  herImage.src='assets/sprites/her_outfit10_run.png';
  const pursuitImage=loadSpeedsterImage(pursuitSpeedster);
  const breachImage=new Image();
  breachImage.src='assets/sprites/speed_force_breach.png';

  function selectedOutfitPath(who){
    let outfit=1;
    try{
      const saved=Number(localStorage.getItem(who+'Outfit')||1);
      if(Number.isInteger(saved)&&saved>=1&&saved<=11)outfit=saved;
    }catch(error){}
    return outfit===1?'assets/sprites/'+who+'_atlas.png':'assets/sprites/'+who+'_outfit'+outfit+'.png';
  }

  const normalOutfitImages={him:new Image(),her:new Image()};
  normalOutfitImages.him.src=selectedOutfitPath('him');
  normalOutfitImages.her.src=selectedOutfitPath('her');

  const tunnelConfig=multiverseConfig.tunnel||{
    id:'speed-force-corridor',name:'Speed Force Corridor',asset:'assets/multiverse/speed-force-tunnel.webp',
    effect:'tunnel',tint:'rgba(0,40,120,.08)',glow:'#71efff'
  };
  const tunnelImage=new Image();
  tunnelImage.src=tunnelConfig.asset;

  const multiverseWorlds=(Array.isArray(multiverseConfig.worlds)?multiverseConfig.worlds:[]).map(world=>{
    const image=new Image();
    image.src=world.asset;
    return {...world,image};
  });
  const multiverseStages=[];
  multiverseWorlds.forEach((world,index)=>{
    multiverseStages.push({
      kind:'tunnel',
      id:'corridor-'+(index+1),
      targetWorldIndex:index,
      duration:TUNNEL_DURATION,
      image:tunnelImage,
      ...tunnelConfig
    });
    multiverseStages.push({
      kind:'world',
      worldIndex:index,
      duration:world.final?FINAL_WORLD_DURATION:WORLD_DURATION,
      ...world
    });
  });
  const MULTIVERSE_TOTAL_DURATION=multiverseStages.reduce((total,stage)=>total+stage.duration,0);

  const racers=[
    {
      key:'him',name:'Ashton',image:himImage,lane:42,frameOffset:0,seed:17,
      core:'#fff9cf',bright:'#ffd438',outer:'#ff7a14',shadow:'rgba(255,176,35,.9)',
      history:[],pose:null
    },
    {
      key:'her',name:'Tanima',image:herImage,lane:-42,frameOffset:2,seed:83,
      core:'#ffffff',bright:'#bdf9ff',outer:'#35d9ff',shadow:'rgba(119,238,255,.92)',
      history:[],pose:null
    }
  ];

  // Authored against the 1254px source master, then scaled to the 3762px world.
  // The route crosses all nine sectors and finishes at the open south edge.
  const authoredPoints=[
    [625,65],[625,180],[625,390],[625,610],

    // Hard left from the shrine, then a full lap around Thunderbloom Grove.
    [505,620],[420,610],[360,570],[330,505],[250,470],[170,445],[115,390],[80,305],
    [92,232],[145,190],[230,180],[315,192],[380,232],[415,300],[395,380],[340,445],[300,500],[365,560],[420,610],
    [505,620],[625,620],

    // Drop into Rootfall Switchbacks, coil around the lower western road,
    // then return to the shrine without ever touching the sealed west wall.
    [540,665],[470,720],[390,775],[300,800],[205,780],[120,815],[75,875],
    [110,940],[190,985],[285,1005],[375,980],[430,920],[400,850],[330,805],
    [245,790],[160,820],[90,880],[125,945],[210,980],[310,990],[400,955],
    [470,900],[520,830],[570,760],[625,700],[625,620],

    // Cross the shrine and run Crystal Canopy before doubling back internally.
    [780,620],[870,560],[900,500],[835,440],[790,360],[805,275],[875,205],[965,180],
    [1050,205],[1120,270],[1160,350],[1115,430],[1030,475],[965,520],[1040,560],
    [1115,520],[1160,430],[1120,350],[1050,430],[1030,475],[965,520],[870,560],[780,620],[625,620],

    // Stormglass Ruins forms the final large loop before the southbound sprint.
    // Its road also turns back before the sealed east wall.
    [780,620],[870,650],[920,710],[1030,730],[1120,780],[1170,860],[1160,950],
    [1100,1030],[1000,1085],[900,1090],[830,1030],[810,940],[850,860],[930,800],
    [1020,780],[1100,820],[1140,900],[1100,980],[1010,1040],[910,1040],
    [845,980],[850,900],[910,840],[1000,800],[930,740],[850,690],[760,640],[682,650],
    [625,790],[625,1000],[625,1248]
  ].map(point=>({x:point[0]*3,y:point[1]*3}));

  let route=[];
  let routeLength=0;
  let dpr=1;
  let cssWidth=1;
  let cssHeight=1;
  let baseZoom=1;
  let zoom=1;
  let camera={x:WORLD/2,y:80};
  let sceneState='loading';
  let paused=false;
  let sceneElapsed=0;
  let finishElapsed=0;
  let lastFrameTime=0;
  let currentProgress=0;
  let currentRawProgress=0;
  let currentDistance=0;
  let currentSector=-1;
  let chapterTimer=0;
  let flashStrength=0;
  let turnStrength=0;
  let speedStrength=0;
  let wakeParticles=[];
  let particleCarry=0;
  let particleRate=70;
  let particleBudget=420;
  let compactViewport=false;
  let audio=null;
  let lastCrackleAt=0;
  let loadFailed=false;
  let runNumber=loadCompletedRunCount();
  let pursuitAlertTimer=0;
  let exitBreachOpened=false;
  let activeSpeedster=baseSpeedster;
  let activeSpeedsterImage=himImage;
  let randomSpeedsterDeck=[];
  let lastRandomSpeedsterId='';
  let queuedSpeedsterId='';
  let pursuers=[];
  let chaseActive=false;
  let multiverseElapsed=0;
  let multiverseStageIndex=-1;
  let multiverseStageProgress=0;
  let multiverseWorldIndex=-1;
  let multiverseWorldProgress=0;
  let multiverseBreachCount=0;
  let landingElapsed=0;
  let destinationStarted=false;
  const hotPursuit={scheduled:false,active:false,startedAt:0,mix:0};

  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function mix(a,b,t){return a+(b-a)*t;}
  function lerpPoint(a,b,t){return {x:mix(a.x,b.x,t),y:mix(a.y,b.y,t)};}
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function smoothFollow(rate,dt){return 1-Math.pow(1-rate,dt*60);}
  function seeded(value){return (Math.sin(value*12.9898+78.233)*43758.5453)%1;}
  function randomish(value){const result=seeded(value);return result<0?result+1:result;}
  function easeInOut(value){const t=clamp(value,0,1);return t*t*(3-2*t);}
  function easeOut(value){const t=clamp(value,0,1);return 1-Math.pow(1-t,3);}

  function loadCompletedRunCount(){
    try{
      const saved=Number(sessionStorage.getItem('speedForceCompletedRuns')||0);
      return Number.isInteger(saved)&&saved>=0?Math.min(saved,999):0;
    }catch(error){return 0;}
  }

  function saveCompletedRunCount(){
    try{sessionStorage.setItem('speedForceCompletedRuns',String(runNumber));}catch(error){}
  }

  function nextRunCopy(){
    const next=runNumber+1;
    if(next===1)return {button:'Start the run',detail:'Run 1: New 52 Flash. Every finish now crosses five worlds.'};
    if(next===2)return {button:'Replay 1 — Hot Pursuit',detail:'Replay 1: Hot Pursuit and the cosmic bike cross all five worlds.'};
    if(next===3)return {button:'Replay 2 — Flash',detail:'Replay 2: New 52 Flash returns. The pursuit remains sealed.'};
    if(next===4)return {button:'Replay 3 — Flash',detail:'Replay 3: one last clear circuit before the pursuit wakes up.'};
    if(next===5)return {button:'Replay 4 — Pursuit begins',detail:'Replay 4: comic speedsters will breach in behind you.'};
    return {button:'Replay — New pursuers',detail:'Replay '+(next-1)+': a new no-repeat group is waiting beyond the first breach.'};
  }

  function racerPalette(racer){
    if(racer.speedster)return racer.speedster.lightning||racer;
    return racer.key==='him'?(activeSpeedster.lightning||racer):racer;
  }

  function spriteSizeFor(racer){
    if(racer.speedster)return (racer.speedster.spriteSize||SPRITE_SIZE)*.94;
    return racer.key==='him'?(activeSpeedster.spriteSize||SPRITE_SIZE):SPRITE_SIZE;
  }

  function spriteImageFor(racer){
    return racer.key==='him'?activeSpeedsterImage:racer.image;
  }

  function racerEntryAlpha(racer){
    if(racer.isPursuer)return racer.entryAlpha||0;
    if(racer.key!=='him'||!hotPursuit.active)return 1;
    return easeInOut((sceneElapsed-.12)/.42);
  }

  function catmullRom(p0,p1,p2,p3,t){
    const t2=t*t,t3=t2*t;
    return {
      x:.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
      y:.5*((2*p1.y)+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+3*p1.y-3*p2.y+p3.y)*t3)
    };
  }

  function buildRoute(){
    route=[];
    let travelled=0;
    let previous=authoredPoints[0];
    route.push({...previous,distance:0});

    for(let index=0;index<authoredPoints.length-1;index++){
      const p0=authoredPoints[Math.max(0,index-1)];
      const p1=authoredPoints[index];
      const p2=authoredPoints[index+1];
      const p3=authoredPoints[Math.min(authoredPoints.length-1,index+2)];
      const steps=clamp(Math.ceil(distance(p1,p2)/32),9,42);

      for(let step=1;step<=steps;step++){
        const point=catmullRom(p0,p1,p2,p3,step/steps);
        point.x=clamp(point.x,12,WORLD-12);
        point.y=clamp(point.y,12,WORLD-12);
        travelled+=distance(previous,point);
        route.push({...point,distance:travelled});
        previous=point;
      }
    }
    routeLength=travelled;

    for(let index=0;index<route.length;index++){
      const before=route[Math.max(0,index-2)];
      const after=route[Math.min(route.length-1,index+2)];
      const length=Math.max(.001,Math.hypot(after.x-before.x,after.y-before.y));
      route[index].tx=(after.x-before.x)/length;
      route[index].ty=(after.y-before.y)/length;
    }
  }

  function routeAt(targetDistance){
    const wanted=clamp(targetDistance,0,routeLength);
    let low=0,high=route.length-1;
    while(low<high){
      const middle=Math.floor((low+high)/2);
      if(route[middle].distance<wanted)low=middle+1;else high=middle;
    }
    const upper=route[low];
    const lower=route[Math.max(0,low-1)];
    const span=Math.max(.001,upper.distance-lower.distance);
    const amount=clamp((wanted-lower.distance)/span,0,1);
    let tx=mix(lower.tx,upper.tx,amount),ty=mix(lower.ty,upper.ty,amount);
    const tangentLength=Math.max(.001,Math.hypot(tx,ty));
    tx/=tangentLength;ty/=tangentLength;
    return {x:mix(lower.x,upper.x,amount),y:mix(lower.y,upper.y,amount),tx,ty,index:low};
  }

  function runProgress(value){
    const u=clamp(value,0,1);
    const edge=.08;
    const velocity=1/(1-edge);
    if(u<edge)return .5*(velocity/edge)*u*u;
    if(u>1-edge)return 1-.5*(velocity/edge)*(1-u)*(1-u);
    return velocity*(u-edge/2);
  }

  function directionFor(tx,ty){
    if(Math.abs(tx)>Math.abs(ty))return tx<0?'left':'right';
    return ty<0?'up':'down';
  }

  function rowFor(direction){
    return direction==='left'?1:(direction==='up'?2:(direction==='right'?3:0));
  }

  function resize(){
    cssWidth=Math.max(1,window.innerWidth);
    cssHeight=Math.max(1,window.innerHeight);
    compactViewport=Math.min(cssWidth,cssHeight)<640&&Math.max(cssWidth,cssHeight)<980;
    // Desktop is the primary presentation and keeps the full effects budget.
    // Only genuinely phone-sized screens receive the lighter fallback.
    dpr=Math.min(window.devicePixelRatio||1,compactViewport?1.5:2);
    particleRate=compactViewport?48:70;
    particleBudget=compactViewport?260:420;
    canvas.width=Math.round(cssWidth*dpr);
    canvas.height=Math.round(cssHeight*dpr);
    canvas.style.width=cssWidth+'px';
    canvas.style.height=cssHeight+'px';
    baseZoom=clamp(cssHeight/1040,.58,1.08);
  }

  function loadAssets(){
    const images=[
      {image:worldImage,label:'forest'},
      {image:himImage,label:'Ashton'},
      {image:herImage,label:'Tanima'},
      {image:pursuitImage,label:'Hot Pursuit'},
      {image:breachImage,label:'dimensional breach'},
      {image:normalOutfitImages.him,label:'Ashton saved outfit'},
      {image:normalOutfitImages.her,label:'Tanima saved outfit'},
      {image:tunnelImage,label:'Speed Force corridor'},
      ...multiverseWorlds.map(world=>({image:world.image,label:world.name}))
    ];
    let complete=0;
    let failures=0;
    function updateLoad(ok){
      complete++;
      if(!ok)failures++;
      const percent=Math.round(complete/images.length*100);
      loadText.textContent='Preparing the forest… '+percent+'%';
      if(complete===images.length){
        loadFailed=failures>0;
        if(loadFailed){
          sceneState='error';
          startButton.disabled=false;
          startButton.textContent='Retry loading';
          loadText.textContent='The forest files did not all load. Tap retry—this screen will not stay stuck.';
          status.textContent='The Speed Force forest could not finish loading.';
          return;
        }
        sceneState='ready';
        const readyCopy=nextRunCopy();
        startButton.disabled=false;
        startButton.textContent=readyCopy.button;
        loadText.textContent=readyCopy.detail;
        status.textContent='The Speed Force forest is ready.';
        resetScene();
        preloadRandomSpeedsters();
      }
    }
    images.forEach(asset=>{
      const image=asset.image;
      let settled=false;
      const settle=ok=>{
        if(settled)return;
        settled=true;
        window.clearTimeout(timeout);
        updateLoad(ok);
      };
      const timeout=window.setTimeout(()=>settle(false),15000);
      image.addEventListener('load',()=>settle(true),{once:true});
      image.addEventListener('error',()=>settle(false),{once:true});
      // Handles both cached successes and cached/instant failures whose events
      // may have fired before this function attached its listeners.
      if(image.complete)window.setTimeout(()=>settle(image.naturalWidth>0),0);
    });
  }

  function preloadRandomSpeedsters(){
    const start=()=>randomSpeedsters.forEach((speedster,index)=>{
      window.setTimeout(()=>loadSpeedsterImage(speedster),index*70);
    });
    if('requestIdleCallback' in window)window.requestIdleCallback(start,{timeout:1400});
    else window.setTimeout(start,80);
  }

  function refillRandomSpeedsterDeck(){
    randomSpeedsterDeck=[...randomSpeedsters];
    for(let index=randomSpeedsterDeck.length-1;index>0;index--){
      const swapIndex=Math.floor(Math.random()*(index+1));
      [randomSpeedsterDeck[index],randomSpeedsterDeck[swapIndex]]=[randomSpeedsterDeck[swapIndex],randomSpeedsterDeck[index]];
    }
    if(randomSpeedsterDeck.length>1&&randomSpeedsterDeck[randomSpeedsterDeck.length-1].id===lastRandomSpeedsterId){
      [randomSpeedsterDeck[0],randomSpeedsterDeck[randomSpeedsterDeck.length-1]]=[randomSpeedsterDeck[randomSpeedsterDeck.length-1],randomSpeedsterDeck[0]];
    }
  }

  function nextRandomSpeedster(){
    if(!randomSpeedsterDeck.length)refillRandomSpeedsterDeck();
    const speedster=randomSpeedsterDeck.pop()||baseSpeedster;
    lastRandomSpeedsterId=speedster.id;
    return speedster;
  }

  function applySpeedsterTheme(){
    const palette=activeSpeedster.lightning||baseSpeedster.lightning;
    pursuitAlert.style.borderColor=palette.bright;
    pursuitAlert.style.boxShadow='0 10px 32px #000b, 0 0 34px '+palette.shadow;
    alertEyebrow.style.color=palette.outer;
    alertTitle.style.textShadow='-2px 0 10px '+palette.outer+', 2px 0 10px '+palette.bright;
    alertSubtitle.style.color=palette.bright;
    speedFlash.style.background='linear-gradient(110deg,'+palette.outer+'99,rgba(255,255,255,.12) 45%,'+palette.bright+'99)';
    progressFill.style.background='linear-gradient(90deg,'+palette.outer+','+palette.bright+' 43%,#fff 53%,#a8f8ff 68%,#37d7ff)';
  }

  function selectSpeedsterForRun(){
    let selected;
    if(queuedSpeedsterId){
      selected=speedsterById.get(queuedSpeedsterId);
      queuedSpeedsterId='';
    }
    if(!selected){
      if(runNumber===1)selected=baseSpeedster;
      else if(runNumber===2)selected=pursuitSpeedster;
      else selected=baseSpeedster;
    }
    activeSpeedster=selected||baseSpeedster;
    activeSpeedsterImage=loadSpeedsterImage(activeSpeedster);
    hotPursuit.scheduled=activeSpeedster.id===pursuitSpeedster.id;
    hotPursuit.startedAt=0;
    hotPursuit.active=hotPursuit.scheduled;
    hotPursuit.mix=hotPursuit.active?1:0;
    applySpeedsterTheme();
  }

  function selectPursuersForRun(){
    pursuers=[];
    chaseActive=runNumber>=CHASE_START_RUN;
    if(!chaseActive||!randomSpeedsters.length)return;

    const count=Math.min(2+(runNumber-CHASE_START_RUN),MAX_PURSUERS,randomSpeedsters.length);
    const lanes=[-126,126,-202,202,0];
    const selectedIds=new Set();
    for(let index=0;index<count;index++){
      let speedster=nextRandomSpeedster();
      let guard=0;
      while(selectedIds.has(speedster.id)&&guard<randomSpeedsters.length){
        speedster=nextRandomSpeedster();
        guard++;
      }
      selectedIds.add(speedster.id);
      pursuers.push({
        key:'pursuer-'+speedster.id+'-'+index,
        name:speedster.name,
        image:loadSpeedsterImage(speedster),
        speedster,
        isPursuer:true,
        lane:lanes[index]||0,
        frameOffset:(index*2+1)%4,
        seed:211+index*47,
        history:[],pose:null,
        entryDelay:.48+index*.16,
        entryAlpha:0
      });
    }
  }

  function handleStart(){
    if(loadFailed||sceneState==='error'){
      window.location.reload();
      return;
    }
    if(sceneState==='ready'||sceneState==='finished')startRun();
  }

  function resetScene(){
    sceneElapsed=0;
    finishElapsed=0;
    currentProgress=0;
    currentRawProgress=0;
    currentDistance=0;
    currentSector=-1;
    chapterTimer=0;
    flashStrength=0;
    turnStrength=0;
    speedStrength=0;
    wakeParticles=[];
    particleCarry=0;
    pursuitAlertTimer=0;
    exitBreachOpened=false;
    hotPursuit.scheduled=false;
    hotPursuit.active=false;
    hotPursuit.startedAt=0;
    hotPursuit.mix=0;
    pursuers=[];
    chaseActive=false;
    multiverseElapsed=0;
    multiverseStageIndex=-1;
    multiverseStageProgress=0;
    multiverseWorldIndex=-1;
    multiverseWorldProgress=0;
    multiverseBreachCount=0;
    landingElapsed=0;
    destinationStarted=false;
    pursuitAlert.classList.remove('is-visible');
    paused=false;
    racers.forEach(racer=>{racer.history=[];racer.pose=null;});
    const start=routeAt(0);
    const initialZoom=zoom||baseZoom||1;
    const halfWidth=cssWidth/(2*initialZoom);
    const halfHeight=cssHeight/(2*initialZoom);
    camera={
      x:clamp(start.x,halfWidth,WORLD-halfWidth),
      y:clamp(start.y,halfHeight,WORLD-halfHeight)
    };
    updateRacers(0,true);
    updateSector(true);
    progressFill.style.width='0%';
    progressPercent.textContent='0%';
    progressLabel.textContent='FOREST CIRCUIT';
    chapterLabel.textContent='Speed Force Forest';
  }

  function startRun(){
    resetScene();
    runNumber++;
    selectSpeedsterForRun();
    selectPursuersForRun();
    // resetScene prepares the ordinary Flash pose for the ready screen. Build
    // the first playable pose again after selecting this run's form so every
    // replay uses one speedster from launch through the finish line.
    racers.forEach(racer=>{racer.history=[];racer.pose=null;});
    updateRacers(0,true);
    updatePursuers(0,true);
    sceneState='running';
    loader.classList.add('is-hidden');
    finish.classList.add('is-hidden');
    flashStrength=1;
    createAudio();
    playCharge();
    if(hotPursuit.active){
      announceHotPursuit();
    }else if(chaseActive){
      announcePursuers();
    }else{
      status.textContent='Ashton and Tanima launch into the Speed Force forest.';
    }
  }

  function announceHotPursuit(){
    alertEyebrow.textContent='Dimensional breach detected';
    alertTitle.textContent='HOT PURSUIT PROTOCOL';
    alertSubtitle.textContent='Cosmic bike engaged';
    pursuitAlertTimer=2.9;
    pursuitAlert.classList.add('is-visible');
    flashStrength=1.35;
    status.textContent='Dimensional breach detected. Ashton launches in Hot Pursuit mode.';
    playPursuitSiren();
  }

  function announcePursuers(){
    const first=pursuers[0];
    const palette=first&&first.speedster&&first.speedster.lightning;
    if(palette){
      pursuitAlert.style.borderColor=palette.bright;
      pursuitAlert.style.boxShadow='0 10px 32px #000b, 0 0 34px '+palette.shadow;
      alertEyebrow.style.color=palette.outer;
      alertTitle.style.textShadow='-2px 0 10px '+palette.outer+', 2px 0 10px '+palette.bright;
      alertSubtitle.style.color=palette.bright;
    }
    alertEyebrow.textContent='Speedster pursuit detected';
    alertTitle.textContent=pursuers.length+' COMIC SPEEDSTERS';
    alertSubtitle.textContent='BREACHING IN BEHIND YOU';
    pursuitAlertTimer=2.9;
    pursuitAlert.classList.add('is-visible');
    flashStrength=1.15;
    status.textContent=pursuers.map(pursuer=>pursuer.name).join(', ')+' are chasing Ashton and Tanima.';
    playPursuitSiren();
  }

  function triggerHotPursuit(){
    // Never transform during a run. This debug hook queues a complete Hot
    // Pursuit run for the next launch instead.
    queuedSpeedsterId=pursuitSpeedster.id;
    status.textContent='Hot Pursuit is queued for the next complete run.';
    return true;
  }

  function updateHotPursuit(){
    if(!hotPursuit.active){hotPursuit.mix=0;return;}
    hotPursuit.mix=1;
  }

  function finishRun(){
    if(sceneState!=='running')return;
    sceneState='finishing';
    finishElapsed=0;
    flashStrength=1;
    status.textContent=chaseActive
      ?'Ashton and Tanima are escaping '+pursuers.length+' comic speedsters through the exit breach.'
      :(hotPursuit.active?'Hot Pursuit is entering the exit breach.':'Ashton and Tanima are entering the exit breach.');
  }

  function announceMultiverseWorld(index){
    const world=multiverseWorlds[index];
    if(!world)return;
    multiverseWorldIndex=index;
    multiverseBreachCount=index+1;
    chapterLabel.textContent=world.final?'Destination world':'Multiverse transit';
    sectorName.textContent=world.name;
    chapter.classList.add('is-visible');
    chapterTimer=world.final?3.2:2.15;
    flashStrength=1.35;
    if(world.final){
      alertEyebrow.textContent='Earth-Prime lock acquired';
      alertTitle.textContent='FINAL WORLD';
      alertSubtitle.textContent=chaseActive?'PURSUIT SEALED • OUTFITS RESTORING':'RESTORING SAVED OUTFITS';
      status.textContent=chaseActive
        ?'The final breach sealed the comic speedsters behind you. Restoring Ashton and Tanima’s saved outfits.'
        :'Final breach locked on '+FINAL_DESTINATION.name+'. Restoring Ashton and Tanima’s saved outfits.';
    }else{
      alertEyebrow.textContent='Dimensional crossing '+(index+1)+' of '+multiverseWorlds.length;
      alertTitle.textContent=world.name.toUpperCase();
      alertSubtitle.textContent='NEXT BREACH OPENING';
      status.textContent='Ashton and Tanima breached into '+world.name+'.';
    }
    pursuitAlert.style.borderColor=world.glow||'#8ff3ff';
    pursuitAlert.style.boxShadow='0 10px 32px #000b, 0 0 38px '+(world.glow||'#8ff3ff');
    alertEyebrow.style.color=world.glow||'#8ff3ff';
    alertSubtitle.style.color=world.glow||'#8ff3ff';
    pursuitAlertTimer=world.final?3.1:1.65;
    pursuitAlert.classList.add('is-visible');
    playWorldShift(world,index);
  }

  function announceTunnelStage(stage){
    const target=multiverseWorlds[stage.targetWorldIndex];
    chapterLabel.textContent='Inside the breach';
    sectorName.textContent=tunnelConfig.name||'Speed Force Corridor';
    chapter.classList.add('is-visible');
    chapterTimer=1.45;
    flashStrength=1.18;
    alertEyebrow.textContent='Blue corridor locked';
    alertTitle.textContent='SPEED FORCE TUNNEL';
    alertSubtitle.textContent=target?'BREACHING TOWARD '+target.name.toUpperCase():'REALITY SHIFT IN PROGRESS';
    const glow=tunnelConfig.glow||'#71efff';
    pursuitAlert.style.borderColor=glow;
    pursuitAlert.style.boxShadow='0 10px 32px #000b, 0 0 42px '+glow;
    alertEyebrow.style.color=glow;
    alertSubtitle.style.color=glow;
    pursuitAlertTimer=1.25;
    pursuitAlert.classList.add('is-visible');
    status.textContent=target
      ?'Ashton and Tanima are back inside the blue breach corridor, racing toward '+target.name+'.'
      :'Ashton and Tanima are racing inside the Speed Force corridor.';
    playWorldShift(tunnelConfig,stage.targetWorldIndex||0);
  }

  function activateMultiverseStage(index){
    const stage=multiverseStages[index];
    if(!stage)return;
    multiverseStageIndex=index;
    multiverseStageProgress=0;
    multiverseWorldProgress=0;
    if(stage.kind==='world')announceMultiverseWorld(stage.worldIndex);
    else announceTunnelStage(stage);
  }

  function multiverseStageAt(elapsed){
    let cursor=0;
    for(let index=0;index<multiverseStages.length;index++){
      const stage=multiverseStages[index];
      const end=cursor+stage.duration;
      if(elapsed<end||index===multiverseStages.length-1){
        return {index,stage,elapsed:Math.max(0,elapsed-cursor)};
      }
      cursor=end;
    }
    return null;
  }

  function beginMultiverse(){
    if(!multiverseStages.length){
      showFinish();
      return;
    }
    sceneState='multiverse';
    multiverseElapsed=0;
    multiverseStageIndex=-1;
    multiverseStageProgress=0;
    multiverseWorldProgress=0;
    multiverseWorldIndex=-1;
    multiverseBreachCount=0;
    landingElapsed=0;
    destinationStarted=false;
    wakeParticles=[];
    speedStrength=1;
    progressLabel.textContent='MULTIVERSE TRANSIT';
    progressFill.style.width='0%';
    progressPercent.textContent='ENTERING CORRIDOR';
    createAudio();
    activateMultiverseStage(0);
  }

  function beginLanding(){
    if(sceneState==='landing')return;
    sceneState='landing';
    landingElapsed=0;
    speedStrength=.35;
    progressLabel.textContent='EARTH-PRIME ARRIVAL';
    progressFill.style.width='100%';
    progressPercent.textContent='OUTFITS SYNCED';
    chapterLabel.textContent='Destination world';
    sectorName.textContent=FINAL_DESTINATION.name;
    chapter.classList.add('is-visible');
    chapterTimer=4;
    status.textContent='Earth-Prime arrival complete. Saved everyday outfits restored.';
    saveCompletedRunCount();
    try{
      sessionStorage.setItem('speedForceArrival',JSON.stringify({
        runNumber,
        chased:chaseActive,
        worlds:multiverseWorlds.map(world=>world.id),
        destination:FINAL_DESTINATION.id||'dawn-nexus'
      }));
    }catch(error){}
    fadeAudio();
  }

  function goToDestination(){
    if(destinationStarted)return;
    destinationStarted=true;
    window.location.href=FINAL_DESTINATION.url;
  }

  function showFinish(){
    sceneState='finished';
    fadeAudio();
    if(runNumber===1)replayButton.textContent='Replay 1 — Hot Pursuit';
    else if(runNumber===2)replayButton.textContent='Replay 2 — Flash';
    else if(runNumber===3)replayButton.textContent='Replay 3 — Flash';
    else if(runNumber===4)replayButton.textContent='Replay 4 — Pursuit begins';
    else replayButton.textContent='Replay — New pursuers';
    status.textContent=chaseActive
      ?'Breach transit complete. Ashton and Tanima escaped the comic-speedster pursuit.'
      :(hotPursuit.active?'Hot Pursuit cleared the breach.':'Breach transit complete. The forest circuit is clear.');
    finish.classList.remove('is-hidden');
  }

  function racerDistance(racer,baseDistance,progress){
    const rivalry=Math.sin(progress*Math.PI*6+(racer.key==='her'?.7:3.84))*34;
    const straightBoost=Math.sin(progress*Math.PI*14+(racer.key==='her'?1.2:4.34))*11;
    const formBoost=racer.key==='him'?(activeSpeedster.leadBoost||0):0;
    return clamp(baseDistance+rivalry+straightBoost+formBoost,0,routeLength);
  }

  function updateRacers(dt,force){
    racers.forEach(racer=>{
      const sampled=routeAt(racerDistance(racer,currentDistance,currentProgress));
      const lanePulse=1+Math.sin(currentProgress*Math.PI*12+racer.seed)*.1;
      const lane=racer.lane*lanePulse;
      const x=sampled.x-sampled.ty*lane;
      const y=sampled.y+sampled.tx*lane;
      const direction=directionFor(sampled.tx,sampled.ty);
      const frame=Math.floor(sceneElapsed*15+racer.frameOffset)%4;
      const previous=racer.pose;
      const angularTurn=previous?Math.atan2(sampled.ty,sampled.tx)-Math.atan2(previous.ty,previous.tx):0;
      const normalizedTurn=Math.atan2(Math.sin(angularTurn),Math.cos(angularTurn));
      racer.pose={x,y,tx:sampled.tx,ty:sampled.ty,direction,frame,turn:clamp(normalizedTurn*2,-.18,.18)};

      if(force||!previous||distance(previous,racer.pose)>5){
        const spriteSize=spriteSizeFor(racer);
        racer.history.push({
          x,y,tx:sampled.tx,ty:sampled.ty,direction,frame,
          centerX:x,centerY:y-spriteSize*.48
        });
        const historyLimit=REDUCED?11:42;
        if(racer.history.length>historyLimit)racer.history.splice(0,racer.history.length-historyLimit);
      }
    });

  }

  function updatePursuers(dt,force){
    if(!chaseActive)return;
    pursuers.forEach((pursuer,index)=>{
      pursuer.entryAlpha=easeInOut((sceneElapsed-pursuer.entryDelay)/.46);
      const closingGap=mix(760,235,currentProgress)+index*112;
      const surge=Math.sin(currentProgress*Math.PI*9+pursuer.seed)*28;
      const sampled=routeAt(currentDistance-closingGap+surge);
      const lanePulse=1+Math.sin(currentProgress*Math.PI*10+pursuer.seed)*.08;
      const lane=pursuer.lane*lanePulse;
      const x=sampled.x-sampled.ty*lane;
      const y=sampled.y+sampled.tx*lane;
      const direction=directionFor(sampled.tx,sampled.ty);
      const frame=Math.floor(sceneElapsed*15+pursuer.frameOffset)%4;
      const previous=pursuer.pose;
      const angularTurn=previous?Math.atan2(sampled.ty,sampled.tx)-Math.atan2(previous.ty,previous.tx):0;
      const normalizedTurn=Math.atan2(Math.sin(angularTurn),Math.cos(angularTurn));
      pursuer.pose={x,y,tx:sampled.tx,ty:sampled.ty,direction,frame,turn:clamp(normalizedTurn*2,-.18,.18)};

      if((force||!previous||distance(previous,pursuer.pose)>5)&&pursuer.entryAlpha>.02){
        const spriteSize=spriteSizeFor(pursuer);
        pursuer.history.push({
          x,y,tx:sampled.tx,ty:sampled.ty,direction,frame,
          centerX:x,centerY:y-spriteSize*.48
        });
        const historyLimit=REDUCED?8:32;
        if(pursuer.history.length>historyLimit)pursuer.history.splice(0,pursuer.history.length-historyLimit);
      }
    });
  }

  function updateCamera(dt){
    const ahead=routeAt(currentDistance+mix(110,300,speedStrength));
    const midpoint={
      x:(racers[0].pose.x+racers[1].pose.x)/2,
      y:(racers[0].pose.y+racers[1].pose.y)/2
    };
    const forwardBias=chaseActive?.18:.34;
    const target={x:mix(midpoint.x,ahead.x,forwardBias),y:mix(midpoint.y,ahead.y,forwardBias)};
    const closestPursuer=pursuers.find(pursuer=>pursuer.pose&&pursuer.entryAlpha>.05);
    if(closestPursuer){
      target.x=mix(target.x,closestPursuer.pose.x,.11);
      target.y=mix(target.y,closestPursuer.pose.y,.11);
    }
    const next=routeAt(currentDistance+130);
    const dot=clamp(ahead.tx*next.tx+ahead.ty*next.ty,-1,1);
    turnStrength=clamp((1-dot)*8,0,1);
    let desiredZoom=baseZoom*(1-.075*speedStrength-.045*turnStrength-.035*hotPursuit.mix-(chaseActive?.055:0));
    if(sceneState==='finishing'){
      const cinematic=Math.sin(clamp(finishElapsed/EXIT_BREACH_FINISH_DURATION,0,1)*Math.PI);
      const breachCenter=exitBreachCenter();
      target.x=mix(target.x,breachCenter.x,.58);
      target.y=mix(target.y,breachCenter.y,.58);
      desiredZoom*=1+cinematic*.105;
    }
    zoom=mix(zoom||desiredZoom,desiredZoom,smoothFollow(.055,dt));

    const halfWidth=cssWidth/(2*zoom);
    const halfHeight=cssHeight/(2*zoom);
    target.x=clamp(target.x,halfWidth,WORLD-halfWidth);
    target.y=clamp(target.y,halfHeight,WORLD-halfHeight);
    const follow=smoothFollow(.075,dt);
    camera.x=mix(camera.x,target.x,follow);
    camera.y=mix(camera.y,target.y,follow);
  }

  function spawnWake(dt){
    if(REDUCED)return;
    particleCarry+=dt*particleRate;
    while(particleCarry>=1){
      particleCarry--;
      const wakeRunners=[...racers,...pursuers.slice(0,3).filter(pursuer=>pursuer.entryAlpha>.05)];
      wakeRunners.forEach(racer=>{
        const pose=racer.pose;
        if(!pose)return;
        const palette=racerPalette(racer);
        const spark=Math.random()>.42;
        const side=(Math.random()-.5)*60;
        const life=spark?mix(.22,.48,Math.random()):mix(.55,1.05,Math.random());
        wakeParticles.push({
          type:spark?'spark':'leaf',
          x:pose.x-pose.tx*38-pose.ty*side,
          y:pose.y-pose.ty*38+pose.tx*side,
          vx:-pose.tx*mix(180,410,Math.random())+(-pose.ty)*(Math.random()-.5)*90,
          vy:-pose.ty*mix(180,410,Math.random())+(pose.tx)*(Math.random()-.5)*90,
          life,maxLife:life,size:spark?mix(2,4,Math.random()):mix(3,7,Math.random()),
          color:spark?palette.bright:(Math.random()>.5?'#7da556':'#b27e42'),
          angle:Math.random()*Math.PI*2,spin:(Math.random()-.5)*9
        });
      });
    }
    const activeParticleBudget=particleBudget+(chaseActive?100:0);
    if(wakeParticles.length>activeParticleBudget)wakeParticles.splice(0,wakeParticles.length-activeParticleBudget);
  }

  function updateParticles(dt){
    for(let index=wakeParticles.length-1;index>=0;index--){
      const particle=wakeParticles[index];
      particle.life-=dt;
      if(particle.life<=0){wakeParticles.splice(index,1);continue;}
      particle.x+=particle.vx*dt;
      particle.y+=particle.vy*dt;
      particle.vx*=Math.pow(.18,dt);
      particle.vy*=Math.pow(.18,dt);
      particle.angle+=particle.spin*dt;
    }
  }

  function updateSector(force){
    if(!racers[0].pose||!racers[1].pose)return;
    const x=(racers[0].pose.x+racers[1].pose.x)/2;
    const y=(racers[0].pose.y+racers[1].pose.y)/2;
    const col=clamp(Math.floor(x/TILE),0,2);
    const row=clamp(Math.floor(y/TILE),0,2);
    const next=row*3+col;
    if(!force&&next===currentSector)return;
    currentSector=next;
    sectorName.textContent=tileDefinitions[next].name;
    chapter.classList.add('is-visible');
    chapterTimer=2.1;
    flashStrength=Math.max(flashStrength,.62);
    status.textContent='Entering '+tileDefinitions[next].name+'.';
    if(sceneState==='running'&&sceneElapsed-lastCrackleAt>.24){
      playCrackle(next%2===0?'him':'her');
      lastCrackleAt=sceneElapsed;
    }
  }

  function update(dt){
    if(chapterTimer>0){
      chapterTimer-=dt;
      if(chapterTimer<=0)chapter.classList.remove('is-visible');
    }
    flashStrength=Math.max(0,flashStrength-dt*2.7);
    speedFlash.style.opacity=REDUCED?'0':String(flashStrength*.46);
    if(pursuitAlertTimer>0){
      pursuitAlertTimer-=dt;
      if(pursuitAlertTimer<=0)pursuitAlert.classList.remove('is-visible');
    }

    if(sceneState==='running'&&!paused){
      sceneElapsed+=dt;
      const raceElapsed=Math.max(0,sceneElapsed-(hotPursuit.active?PURSUIT_LAUNCH_DELAY:0));
      const raw=clamp(raceElapsed/RUN_DURATION,0,1);
      currentRawProgress=raw;
      currentProgress=runProgress(raw);
      currentDistance=currentProgress*routeLength;
      speedStrength=clamp(Math.min(raw/.08,(1-raw)/.08),0,1);
      updateHotPursuit();
      updateRacers(dt,false);
      updatePursuers(dt,false);
      spawnWake(dt);
      updateParticles(dt);
      updateCamera(dt);
      updateSector(false);
      updateAudio();
      const percent=Math.round(raw*100);
      progressFill.style.width=percent+'%';
      progressPercent.textContent=percent+'%';
      if(!exitBreachOpened&&raw>=EXIT_BREACH_OPEN_AT){
        exitBreachOpened=true;
        flashStrength=Math.max(flashStrength,.9);
        status.textContent='Exit breach opening at the south gate.';
        playExitBreach();
      }
      if(raw>=1)finishRun();
    }else if(sceneState==='finishing'){
      finishElapsed+=dt;
      speedStrength=Math.max(0,1-finishElapsed/.9);
      updateParticles(dt);
      updateCamera(dt);
      if(finishElapsed>=EXIT_BREACH_FINISH_DURATION)beginMultiverse();
    }else if(sceneState==='multiverse'&&!paused){
      multiverseElapsed+=dt;
      const location=multiverseStageAt(multiverseElapsed);
      if(!location){beginLanding();return;}
      if(location.index!==multiverseStageIndex)activateMultiverseStage(location.index);
      multiverseStageProgress=clamp(location.elapsed/location.stage.duration,0,1);
      multiverseWorldProgress=multiverseStageProgress;
      speedStrength=location.stage.final
        ?mix(1,.48,easeInOut((multiverseStageProgress-.72)/.28))
        :(location.stage.kind==='tunnel'?1.12:1);
      updateAudio();
      const totalProgress=clamp(multiverseElapsed/MULTIVERSE_TOTAL_DURATION,0,1);
      progressFill.style.width=Math.round(totalProgress*100)+'%';
      progressPercent.textContent=location.stage.kind==='tunnel'
        ?'BLUE TUNNEL → WORLD '+(location.stage.targetWorldIndex+1)
        :'WORLD '+(location.stage.worldIndex+1)+' / '+multiverseWorlds.length;
      if(multiverseElapsed>=MULTIVERSE_TOTAL_DURATION)beginLanding();
    }else if(sceneState==='landing'){
      landingElapsed+=dt;
      speedStrength=Math.max(0,.35-landingElapsed*.34);
      if(landingElapsed>=MULTIVERSE_LANDING_DURATION)goToDestination();
    }
  }

  function setWorldTransform(shakeX,shakeY){
    const scale=dpr*zoom;
    ctx.setTransform(scale,0,0,scale,canvas.width/2-(camera.x+shakeX)*scale,canvas.height/2-(camera.y+shakeY)*scale);
  }

  function drawVisibleWorldImage(){
    const padding=180;
    const halfWidth=cssWidth/(2*zoom)+padding;
    const halfHeight=cssHeight/(2*zoom)+padding;
    const left=clamp(camera.x-halfWidth,0,WORLD);
    const top=clamp(camera.y-halfHeight,0,WORLD);
    const right=clamp(camera.x+halfWidth,0,WORLD);
    const bottom=clamp(camera.y+halfHeight,0,WORLD);
    const width=Math.max(1,right-left);
    const height=Math.max(1,bottom-top);
    const sourceScale=(worldImage.naturalWidth||TILE)/WORLD;
    ctx.drawImage(
      worldImage,
      left*sourceScale,top*sourceScale,width*sourceScale,height*sourceScale,
      left,top,width,height
    );
  }

  function drawWorld(){
    const shake=REDUCED?0:(speedStrength*(1.2+turnStrength*2.4+hotPursuit.mix*1.8));
    const shakeX=Math.sin(sceneElapsed*71)*shake;
    const shakeY=Math.cos(sceneElapsed*83)*shake*.72;
    setWorldTransform(shakeX,shakeY);
    ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#041018';
    ctx.fillRect(0,0,WORLD,WORLD);
    drawVisibleWorldImage();
    // The render loop may begin before slower browsers finish loading every
    // asset and resetScene creates the first poses. Keep drawing the forest,
    // but wait to sort/draw racers until those poses exist.
    if(!racers.every(racer=>racer.pose))return;
    drawWakeParticles();
    drawPursuitRift();
    drawChaseRift();
    drawExitBreach();
    const activeRunners=[...racers,...pursuers.filter(pursuer=>pursuer.pose&&pursuer.entryAlpha>.01)];
    activeRunners.forEach(drawTrail);
    activeRunners.forEach(drawAfterimages);
    activeRunners.sort((a,b)=>a.pose.y-b.pose.y).forEach(drawRacer);
    drawExitBreachVeil();
  }

  function activeMultiverseStage(){
    return multiverseStages[Math.max(0,multiverseStageIndex)]||multiverseStages[0]||null;
  }

  function drawCoverImage(image,progress,stage){
    const naturalWidth=image.naturalWidth||cssWidth;
    const naturalHeight=image.naturalHeight||cssHeight;
    const cover=Math.max(cssWidth/naturalWidth,cssHeight/naturalHeight)*(stage&&stage.kind==='tunnel'?1.08:1.14);
    const width=naturalWidth*cover;
    const height=naturalHeight*cover;
    const overflowX=Math.max(0,width-cssWidth);
    const overflowY=Math.max(0,height-cssHeight);
    const tunnelDrift=stage&&stage.kind==='tunnel'?Math.sin(multiverseElapsed*2.4)*.06:0;
    const x=-overflowX*clamp(mix(.12,.88,progress)+tunnelDrift,0,1);
    const y=-overflowY*.5+Math.sin(multiverseElapsed*.8)*Math.min(stage&&stage.kind==='tunnel'?5:10,overflowY*.12);
    ctx.drawImage(image,x,y,width,height);
  }

  function drawMultiverseEffect(world,progress){
    const time=multiverseElapsed;
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    if(world.effect==='tunnel'){
      const count=compactViewport?28:52;
      const vanishingX=cssWidth*.83,vanishingY=cssHeight*.47;
      for(let index=0;index<count;index++){
        const angle=randomish(index*31+4)*Math.PI*2;
        const phase=(randomish(index*19+7)+time*(.48+randomish(index*5)*.62))%1;
        const radius=mix(24,Math.max(cssWidth,cssHeight)*.82,phase);
        const x=vanishingX+Math.cos(angle)*radius;
        const y=vanishingY+Math.sin(angle)*radius*.58;
        const length=mix(10,105,phase);
        ctx.globalAlpha=.08+phase*.4;
        ctx.strokeStyle=index%5===0?'#ffffff':(index%2?'#6ff4ff':'#278cff');
        ctx.lineWidth=.7+phase*2.3;ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*length,y+Math.sin(angle)*length*.58);ctx.stroke();
      }
      const pulse=.04+.045*(Math.sin(time*7)+1);
      ctx.globalAlpha=pulse;ctx.fillStyle='#7eefff';ctx.fillRect(0,0,cssWidth,cssHeight);
    }else if(world.effect==='neon'){
      const count=compactViewport?24:46;
      for(let index=0;index<count;index++){
        const lane=randomish(index*47+2);
        const x=(randomish(index*13+8)*cssWidth-time*(90+lane*260)+cssWidth*9)%cssWidth;
        const y=cssHeight*(.14+randomish(index*31+1)*.72);
        ctx.globalAlpha=.1+lane*.34;ctx.strokeStyle=index%3===0?'#ffe398':'#68ecff';ctx.lineWidth=.8+lane*1.2;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-(12+lane*42),y);ctx.stroke();
      }
    }else if(world.effect==='embers'){
      const count=compactViewport?34:66;
      for(let index=0;index<count;index++){
        const x=(randomish(index*37+3)*cssWidth-time*(18+index%5)+cssWidth*8)%cssWidth;
        const y=(randomish(index*21+9)*cssHeight-time*(24+index%7)+cssHeight*8)%cssHeight;
        const size=1+randomish(index*11)*3.1;
        ctx.globalAlpha=.18+randomish(index*29)*.52;ctx.fillStyle=index%3?'#ff5b2a':'#ffd06b';
        ctx.fillRect(x,y,size,size);
      }
    }else if(world.effect==='frost'){
      const count=compactViewport?30:58;
      for(let index=0;index<count;index++){
        const x=(randomish(index*17+4)*cssWidth-time*(34+index%6)+cssWidth*7)%cssWidth;
        const y=(randomish(index*31+9)*cssHeight+time*(28+index%7))%cssHeight;
        const size=1.2+randomish(index*11)*3.4;
        ctx.globalAlpha=.2+randomish(index*23)*.45;ctx.fillStyle=index%4===0?'#d8a8ff':'#d9fbff';
        ctx.save();ctx.translate(x,y);ctx.rotate(time+index);ctx.fillRect(-size,-size*.25,size*2,size*.5);ctx.restore();
      }
    }else if(world.effect==='tempest'){
      const count=compactViewport?38:74;
      for(let index=0;index<count;index++){
        const x=(randomish(index*19+3)*cssWidth-time*(58+index%5)+cssWidth*6)%cssWidth;
        const y=(randomish(index*27+7)*cssHeight+time*(180+index%8))%cssHeight;
        const length=14+randomish(index*13)*31;
        ctx.globalAlpha=.1+randomish(index*29)*.3;ctx.strokeStyle='#d5b5ff';ctx.lineWidth=.7+randomish(index*5);
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-length*.3,y+length);ctx.stroke();
      }
      const lightning=Math.max(0,1-Math.abs(((time*.7)%4)-.14)*22);
      if(lightning>0){ctx.globalAlpha=lightning*.25;ctx.fillStyle='#e8d8ff';ctx.fillRect(0,0,cssWidth,cssHeight);}
    }else if(world.effect==='dawn'){
      const count=compactViewport?22:42;
      for(let index=0;index<count;index++){
        const x=(randomish(index*37+5)*cssWidth+time*(18+index%7))%cssWidth;
        const y=(randomish(index*17+11)*cssHeight+time*(8+index%5))%cssHeight;
        ctx.save();ctx.translate(x,y);ctx.rotate(time*(.35+index%3*.18)+index);
        ctx.globalAlpha=.13+randomish(index*9)*.3;ctx.fillStyle=index%3===0?'#ffe6a2':(index%2?'#ffc4d7':'#c7f5ff');
        ctx.fillRect(-3,-1.3,6,2.6);ctx.restore();
      }
    }
    ctx.restore();
  }

  function multiverseRunnerState(racer,indexOffset){
    const world=activeMultiverseStage();
    const finalWorld=!!(world&&world.kind==='world'&&world.final);
    const tunnel=!!(world&&world.kind==='tunnel');
    const delayedProgress=clamp(multiverseStageProgress-(indexOffset||0),0,1);
    const normalSize=compactViewport?112:clamp(cssHeight*.19,142,208);
    const formScale=clamp(spriteSizeFor(racer)/SPRITE_SIZE,.86,1.34);
    const baseSize=normalSize*formScale;
    const footY=cssHeight*(racer.key==='her'?.63:.70);
    const entry=easeOut(clamp(delayedProgress/.18,0,1));
    let x,size,alpha,exit=0;
    if(finalWorld){
      const travel=easeOut(clamp((delayedProgress-.015)/.88,0,1));
      x=mix(cssWidth*.09,cssWidth*.60,travel);
      size=baseSize*mix(.12,1,entry);
      alpha=easeOut(clamp(delayedProgress/.08,0,1));
    }else if(tunnel){
      const travel=easeInOut(clamp((delayedProgress-.015)/.95,0,1));
      exit=easeInOut(clamp((delayedProgress-.86)/.13,0,1));
      x=mix(cssWidth*.12,cssWidth*.76,travel)+Math.sin(multiverseElapsed*4+racer.seed)*8;
      size=baseSize*mix(.34,1.05,entry)*mix(1,.28,exit);
      alpha=easeOut(clamp(delayedProgress/.06,0,1))*(1-exit*.8);
    }else{
      const travel=easeInOut(clamp((delayedProgress-.025)/.91,0,1));
      exit=easeInOut(clamp((delayedProgress-.78)/.18,0,1));
      x=mix(cssWidth*.09,cssWidth*.91,travel);
      size=baseSize*mix(.12,1,entry)*mix(1,.11,exit);
      alpha=easeOut(clamp(delayedProgress/.07,0,1))*(1-easeInOut(clamp((exit-.46)/.54,0,1)));
    }
    return {x,y:footY,size,normalSize,alpha,entry,exit,finalWorld,tunnel};
  }

  function drawMultiverseTrail(racer,state,palette,alphaScale){
    if(state.alpha<=.01)return;
    const centerY=state.y-state.size*.52;
    const startX=Math.max(-120,state.x-mix(100,cssWidth*.34,state.entry));
    const gradient=ctx.createLinearGradient(startX,centerY,state.x,centerY);
    gradient.addColorStop(0,'rgba(0,0,0,0)');
    gradient.addColorStop(.46,palette.outer);gradient.addColorStop(1,palette.bright);
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    ctx.globalAlpha=.19*state.alpha*alphaScale;ctx.strokeStyle=gradient;ctx.lineWidth=42;ctx.shadowColor=palette.shadow;ctx.shadowBlur=30;
    ctx.beginPath();ctx.moveTo(startX,centerY+Math.sin(multiverseElapsed*10+racer.seed)*7);ctx.lineTo(state.x,centerY);ctx.stroke();
    ctx.globalAlpha=.82*state.alpha*alphaScale;ctx.strokeStyle=palette.core;ctx.lineWidth=2.8;ctx.shadowBlur=9;
    ctx.beginPath();ctx.moveTo(startX,centerY);ctx.lineTo(state.x,centerY);ctx.stroke();ctx.restore();
  }

  function drawMultiverseSprite(racer,state,image,alpha,palette){
    if(!image||!image.complete||!image.naturalWidth||alpha<=.005)return;
    const frame=Math.floor(multiverseElapsed*15+racer.frameOffset)%4;
    const size=state.size;
    ctx.save();ctx.globalAlpha=alpha;ctx.translate(state.x,state.y);
    ctx.shadowColor=palette.shadow;ctx.shadowBlur=18;
    ctx.drawImage(image,frame*CELL,3*CELL,CELL,CELL,-size/2,-size,size,size);
    ctx.restore();
  }

  function drawMultiverseRunner(racer,indexOffset,normalMix){
    const state=multiverseRunnerState(racer,indexOffset);
    if(racer.key==='her'&&activeSpeedster.special==='breach'){
      state.x+=(compactViewport?96:150)*state.entry*(1-state.exit);
    }
    const palette=racerPalette(racer);
    const mixToNormal=clamp(normalMix||0,0,1);
    drawMultiverseTrail(racer,state,palette,1-mixToNormal*.86);
    drawMultiverseSprite(racer,state,spriteImageFor(racer),state.alpha*(1-mixToNormal),palette);
    if(mixToNormal>0){
      const normalImage=normalOutfitImages[racer.key];
      const normalPalette={core:'#fff8d7',bright:'#ffd97a',outer:'#71dfb1',shadow:'rgba(255,214,113,.72)'};
      const normalState={...state,size:mix(state.size,state.normalSize,mixToNormal)};
      drawMultiverseSprite(racer,normalState,normalImage,state.alpha*mixToNormal,normalPalette);
    }
    if(!REDUCED&&state.alpha>.12&&mixToNormal<.92){
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=state.alpha*(1-mixToNormal);
      const center={x:state.x,y:state.y-state.size*.52};
      for(let bolt=0;bolt<3;bolt++){
        const angle=randomish(racer.seed+bolt*8+Math.floor(multiverseElapsed*19))*Math.PI*2;
        const radius=state.size*.3;
        const start={x:center.x+Math.cos(angle)*radius*.35,y:center.y+Math.sin(angle)*radius*.45};
        const end={x:center.x+Math.cos(angle+.9)*radius,y:center.y+Math.sin(angle+.9)*radius*.7};
        drawBolt(start,end,4,palette.bright,bolt?1.2:2,racer.seed+bolt+Math.floor(multiverseElapsed*20));
      }
      ctx.restore();
    }
  }

  function drawMultiversePursuers(){
    const world=activeMultiverseStage();
    if(!chaseActive||!world||world.final)return;
    pursuers.forEach((pursuer,index)=>{
      const state=multiverseRunnerState(pursuer,.035+index*.018);
      state.x-=92+index*48;
      state.y=cssHeight*(.67+(index%2?-.08:.055));
      state.size*=.76;
      const palette=racerPalette(pursuer);
      drawMultiverseTrail(pursuer,state,palette,.56);
      drawMultiverseSprite(pursuer,state,pursuer.image,state.alpha*.88,palette);
    });
  }

  function drawMultiverseBreaches(world){
    const progress=multiverseStageProgress;
    const breachHeight=Math.min(cssHeight*.64,470);
    const breachWidth=breachHeight*.88;
    const footY=cssHeight*.685;
    const centerY=footY-breachHeight*.48;
    const entryCenter={x:cssWidth*.075,y:centerY};
    const entryCollapse=easeInOut(clamp(progress/.28,0,1));
    ctx.save();ctx.shadowColor=world.glow||'#82eeff';ctx.shadowBlur=30;
    drawBreachFrame(entryCenter,breachWidth,breachHeight,mix(9.2,15.999,entryCollapse),1-entryCollapse*.96);
    ctx.restore();
    if(!world.final&&progress>.55){
      const reveal=easeInOut(clamp((progress-.55)/.18,0,1));
      const exitCenter={x:cssWidth*.925,y:centerY};
      ctx.save();ctx.shadowColor=world.glow||'#82eeff';ctx.shadowBlur=28+reveal*22;
      drawBreachFrame(exitCenter,breachWidth,breachHeight,mix(.5,10.2,reveal),reveal);
      ctx.restore();
    }
  }

  function drawMultiverse(){
    const world=activeMultiverseStage()||multiverseWorlds[multiverseWorlds.length-1];
    if(!world)return;
    const progress=sceneState==='landing'?1:multiverseStageProgress;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#02070d';ctx.fillRect(0,0,cssWidth,cssHeight);
    drawCoverImage(world.image,progress,world);
    ctx.fillStyle=world.tint||'rgba(0,0,0,.12)';ctx.fillRect(0,0,cssWidth,cssHeight);
    const horizon=ctx.createLinearGradient(0,0,0,cssHeight);
    horizon.addColorStop(0,'rgba(1,5,14,.12)');horizon.addColorStop(.68,'rgba(2,6,12,.08)');horizon.addColorStop(1,'rgba(0,2,6,.72)');
    ctx.fillStyle=horizon;ctx.fillRect(0,0,cssWidth,cssHeight);
    drawMultiverseEffect(world,progress);
    drawMultiverseBreaches(world);
    const normalMix=world.final?easeInOut(clamp((progress-.62)/.24,0,1)):0;
    drawMultiversePursuers();
    drawMultiverseRunner(racers[0],0,normalMix);
    drawMultiverseRunner(racers[1],.018,normalMix);

    const entryFlash=(1-easeOut(clamp(progress/.10,0,1)))*.72;
    const exitFlash=!world.final?easeInOut(clamp((progress-.94)/.06,0,1))*.86:0;
    const landingFlash=sceneState==='landing'?easeInOut(clamp(landingElapsed/MULTIVERSE_LANDING_DURATION,0,1)):0;
    const flash=Math.max(entryFlash,exitFlash,landingFlash);
    if(flash>.001){
      ctx.globalCompositeOperation='screen';ctx.fillStyle='rgba(226,251,255,'+flash+')';ctx.fillRect(0,0,cssWidth,cssHeight);ctx.globalCompositeOperation='source-over';
    }
  }

  function drawWakeParticles(){
    const halfWidth=cssWidth/(2*zoom)+130;
    const halfHeight=cssHeight/(2*zoom)+130;
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    wakeParticles.forEach(particle=>{
      if(Math.abs(particle.x-camera.x)>halfWidth||Math.abs(particle.y-camera.y)>halfHeight)return;
      const life=particle.life/particle.maxLife;
      ctx.globalAlpha=life*(particle.type==='spark'?.8:.52);
      ctx.strokeStyle=particle.color;
      ctx.fillStyle=particle.color;
      if(particle.type==='spark'){
        const speed=Math.hypot(particle.vx,particle.vy)||1;
        ctx.lineWidth=particle.size;
        ctx.beginPath();
        ctx.moveTo(particle.x,particle.y);
        ctx.lineTo(particle.x-particle.vx/speed*particle.size*6,particle.y-particle.vy/speed*particle.size*6);
        ctx.stroke();
      }else{
        ctx.save();ctx.translate(particle.x,particle.y);ctx.rotate(particle.angle);
        ctx.fillRect(-particle.size, -particle.size*.36,particle.size*2,particle.size*.72);
        ctx.restore();
      }
    });
    ctx.restore();
  }

  function trailPath(history){
    if(history.length<2)return false;
    ctx.beginPath();
    history.forEach((point,index)=>{
      if(index===0)ctx.moveTo(point.centerX,point.centerY);
      else ctx.lineTo(point.centerX,point.centerY);
    });
    return true;
  }

  function drawTrail(racer){
    const history=racer.history;
    if(history.length<2)return;
    const palette=racerPalette(racer);
    const oldest=history[0],newest=history[history.length-1];
    const gradient=ctx.createLinearGradient(oldest.centerX,oldest.centerY,newest.centerX,newest.centerY);
    gradient.addColorStop(0,'rgba(0,0,0,0)');
    gradient.addColorStop(.28,palette.outer);
    gradient.addColorStop(1,palette.bright);
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    ctx.lineCap='round';ctx.lineJoin='round';
    const entryAlpha=racerEntryAlpha(racer);
    const trailScale=racer.isPursuer?.72:1;
    ctx.globalAlpha=.16*speedStrength*entryAlpha;
    ctx.strokeStyle=gradient;ctx.lineWidth=(54+hotPursuit.mix*(racer.key==='him'?16:0))*trailScale;ctx.shadowColor=palette.shadow;ctx.shadowBlur=34;
    if(trailPath(history))ctx.stroke();
    ctx.globalAlpha=.44*speedStrength*entryAlpha;
    ctx.lineWidth=19*trailScale;ctx.shadowBlur=20;
    if(trailPath(history))ctx.stroke();
    ctx.globalAlpha=.93*speedStrength*entryAlpha;
    ctx.strokeStyle=palette.core;ctx.lineWidth=(3.2+hotPursuit.mix*(racer.key==='him'?1.8:0))*trailScale;ctx.shadowBlur=9;
    if(trailPath(history))ctx.stroke();
    drawTrailBranches(racer);
    ctx.restore();
  }

  function drawTrailBranches(racer){
    if(REDUCED)return;
    const history=racer.history;
    const palette=racerPalette(racer);
    const tick=Math.floor(sceneElapsed*18);
    for(let index=5;index<history.length-2;index+=7){
      const point=history[index];
      const branchSize=22+randomish(racer.seed+index+tick)*38;
      const side=randomish(racer.seed*2+index+tick)>.5?1:-1;
      const end={
        x:point.centerX-point.ty*branchSize*side-point.tx*branchSize*.35,
        y:point.centerY+point.tx*branchSize*side-point.ty*branchSize*.35
      };
      ctx.globalAlpha=.42*(index/history.length)*speedStrength*racerEntryAlpha(racer);
      drawBolt({x:point.centerX,y:point.centerY},end,4,palette.bright,1.8,racer.seed+index+tick);
    }
  }

  function drawBreachFrame(center,width,height,frameFloat,alpha){
    const safeFrame=clamp(frameFloat,0,BREACH_FRAME_COUNT-.0001);
    const firstFrame=Math.min(BREACH_FRAME_COUNT-1,Math.floor(safeFrame));
    const secondFrame=Math.min(BREACH_FRAME_COUNT-1,firstFrame+1);
    const blend=safeFrame-firstFrame;

    function drawFrame(frame,frameAlpha){
      if(frameAlpha<=.01)return;
      const col=frame%4,row=Math.floor(frame/4);
      ctx.globalAlpha=frameAlpha*alpha;
      ctx.drawImage(breachImage,col*CELL,row*CELL,CELL,CELL,center.x-width/2,center.y-height/2,width,height);
    }

    drawFrame(firstFrame,1-blend);
    drawFrame(secondFrame,blend);
  }

  function drawPursuitRift(){
    if(!hotPursuit.active)return;
    const elapsed=sceneElapsed-hotPursuit.startedAt;
    if(elapsed<0||elapsed>=BREACH_DURATION)return;
    const start=routeAt(0);
    const ashtonStartX=start.x-start.ty*racers[0].lane;
    const center={x:ashtonStartX-55,y:start.y-25};
    const frameFloat=REDUCED?8:clamp(elapsed/BREACH_DURATION,0,.9999)*BREACH_FRAME_COUNT;

    ctx.save();
    ctx.globalCompositeOperation='source-over';
    ctx.shadowColor='#64ddff';
    ctx.shadowBlur=18;
    drawBreachFrame(center,280,340,frameFloat,1);
    ctx.restore();
  }

  function drawChaseRift(){
    if(!chaseActive)return;
    const elapsed=sceneElapsed;
    if(elapsed<0||elapsed>=BREACH_DURATION)return;
    const start=routeAt(0);
    const center={x:start.x,y:start.y-14};
    const frameFloat=REDUCED?8:clamp(elapsed/BREACH_DURATION,0,.9999)*BREACH_FRAME_COUNT;
    ctx.save();
    ctx.globalCompositeOperation='source-over';
    ctx.shadowColor='#64ddff';
    ctx.shadowBlur=22;
    drawBreachFrame(center,330,388,frameFloat,1);
    ctx.restore();
  }

  function exitBreachCenter(){
    const end=routeAt(routeLength);
    return {x:end.x,y:end.y-EXIT_BREACH_HEIGHT/2};
  }

  function exitBreachReveal(){
    if(sceneState==='finishing')return 1;
    if(sceneState!=='running')return 0;
    return easeInOut((currentRawProgress-EXIT_BREACH_OPEN_AT)/.075);
  }

  function exitBreachFrame(){
    if(sceneState!=='finishing')return exitBreachReveal()*10.25;
    if(REDUCED)return finishElapsed<.76?9:15;
    if(finishElapsed<.7)return 9.25+(Math.sin(sceneElapsed*11)+1)*.72;
    return mix(11,15.999,easeInOut((finishElapsed-.7)/.86));
  }

  function drawExitBreach(){
    const reveal=exitBreachReveal();
    if(reveal<=.001)return;
    const center=exitBreachCenter();
    const collapse=sceneState==='finishing'?easeInOut((finishElapsed-.7)/.86):0;
    const breathing=REDUCED?1:1+Math.sin(sceneElapsed*5.2)*.018*(1-collapse);
    const scale=mix(.58,1,reveal)*breathing;
    const alpha=reveal*(1-collapse*.96);

    ctx.save();
    ctx.globalCompositeOperation='source-over';
    ctx.shadowColor='#82eeff';
    ctx.shadowBlur=26+reveal*22;
    drawBreachFrame(center,EXIT_BREACH_WIDTH*scale,EXIT_BREACH_HEIGHT*scale,exitBreachFrame(),alpha);
    ctx.restore();
  }

  function finishSwallowProgress(){
    if(sceneState!=='finishing')return 0;
    return easeInOut(finishElapsed/.7);
  }

  function drawExitBreachVeil(){
    const swallow=finishSwallowProgress();
    if(swallow<=.001)return;
    const center=exitBreachCenter();
    const radius=66+swallow*30;
    const glow=ctx.createRadialGradient(center.x,center.y,4,center.x,center.y,radius);
    glow.addColorStop(0,'rgba(255,255,255,.98)');
    glow.addColorStop(.22,'rgba(191,249,255,.86)');
    glow.addColorStop(.58,'rgba(60,209,255,.34)');
    glow.addColorStop(1,'rgba(36,133,255,0)');
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=swallow*(1-clamp((finishElapsed-.72)/.72,0,1));
    ctx.fillStyle=glow;
    ctx.beginPath();
    ctx.ellipse(center.x,center.y,radius,radius*1.18,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  function drawBolt(start,end,segments,color,width,seed){
    ctx.beginPath();ctx.moveTo(start.x,start.y);
    const dx=end.x-start.x,dy=end.y-start.y;
    const length=Math.max(1,Math.hypot(dx,dy));
    const nx=-dy/length,ny=dx/length;
    for(let index=1;index<segments;index++){
      const amount=index/segments;
      const jitter=(randomish(seed+index*1.71)-.5)*16;
      ctx.lineTo(start.x+dx*amount+nx*jitter,start.y+dy*amount+ny*jitter);
    }
    ctx.lineTo(end.x,end.y);
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.shadowColor=color;ctx.shadowBlur=8;ctx.stroke();
  }

  function drawSpriteFrame(racer,pose,size,alpha,glow,imageOverride){
    if(!pose)return;
    const image=imageOverride||spriteImageFor(racer);
    if(!image||!image.complete||image.naturalWidth===0)return;
    const row=rowFor(pose.direction);
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(pose.x,pose.y);
    ctx.rotate(pose.turn||0);
    const palette=racerPalette(racer);
    if(glow){ctx.shadowColor=palette.shadow;ctx.shadowBlur=26;}
    ctx.drawImage(image,pose.frame*CELL,row*CELL,CELL,CELL,-size/2,-size,size,size);
    ctx.restore();
  }

  function drawAfterimages(racer){
    if(REDUCED||racer.history.length<18)return;
    ctx.save();ctx.globalCompositeOperation='lighter';
    (compactViewport?[12,25]:[10,19,28]).forEach((behind,index)=>{
      const point=racer.history[Math.max(0,racer.history.length-1-behind)];
      if(!point)return;
      const size=spriteSizeFor(racer)*(1-index*.025);
      const image=spriteImageFor(racer);
      drawSpriteFrame(racer,{...point,turn:0},size,(.13-index*.025)*speedStrength*racerEntryAlpha(racer),true,image);
    });
    ctx.restore();
  }

  function racerRenderState(racer){
    const pose=racer.pose;
    const baseSize=spriteSizeFor(racer);
    if(sceneState!=='finishing')return {pose,size:baseSize,scale:1,alpha:1};

    const swallow=finishSwallowProgress();
    const breach=exitBreachCenter();
    const size=baseSize*mix(1,.12,swallow);
    const baseCenterY=pose.y-baseSize*.5;
    const laneOffset=(racer.key==='him'?-24:24)*(1-swallow);
    const centerX=mix(pose.x,breach.x+laneOffset,swallow);
    const centerY=mix(baseCenterY,breach.y+8,swallow);
    const vanish=easeInOut((swallow-.42)/.58);
    return {
      pose:{
        ...pose,
        x:centerX,
        y:centerY+size*.5,
        turn:mix(pose.turn||0,racer.key==='him'?-.16:.16,swallow)
      },
      size,
      scale:size/baseSize,
      alpha:1-vanish
    };
  }

  function drawRacer(racer){
    const render=racerRenderState(racer);
    const pose=render.pose;
    if(!pose)return;
    const size=render.size;
    const entryAlpha=racerEntryAlpha(racer)*render.alpha;
    ctx.save();
    ctx.globalAlpha=.28*entryAlpha;
    ctx.fillStyle='#02070a';
    ctx.beginPath();ctx.ellipse(pose.x,pose.y-4,size*.34,size*.105,0,0,Math.PI*2);ctx.fill();
    ctx.restore();

    ctx.save();ctx.globalCompositeOperation='lighter';
    drawSpriteFrame(racer,pose,size,.44*speedStrength*entryAlpha,true,spriteImageFor(racer));
    ctx.restore();
    drawSpriteFrame(racer,pose,size,entryAlpha,false,spriteImageFor(racer));
    drawBodyLightning(racer,render);
  }

  function drawBodyLightning(racer,render){
    if(REDUCED)return;
    const pose=render.pose;
    const palette=racerPalette(racer);
    const spriteSize=render.size;
    const entryAlpha=racerEntryAlpha(racer)*render.alpha;
    const tick=Math.floor(sceneElapsed*22);
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let index=0;index<4;index++){
      const startAngle=randomish(racer.seed+index*9+tick)*Math.PI*2;
      const endAngle=startAngle+mix(.8,1.8,randomish(racer.seed+index*5+tick));
      const radius=spriteSize*mix(.23,.42,randomish(racer.seed+index*3+tick));
      const start={x:pose.x+Math.cos(startAngle)*radius,y:pose.y-spriteSize*.52+Math.sin(startAngle)*radius*.72};
      const end={x:pose.x+Math.cos(endAngle)*radius,y:pose.y-spriteSize*.52+Math.sin(endAngle)*radius*.72};
      ctx.globalAlpha=mix(.45,.9,randomish(racer.seed+index+tick))*speedStrength*entryAlpha;
      drawBolt(start,end,4,palette.core,index===0?2.4:1.5,racer.seed+index+tick);
    }
    ctx.restore();
  }

  function drawScreenSpeedLines(){
    if(REDUCED||speedStrength<.2)return;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    const centerX=cssWidth/2,centerY=cssHeight/2;
    const ashtonPalette=activeSpeedster.lightning||baseSpeedster.lightning;
    const lineCount=compactViewport?20:30;
    for(let index=0;index<lineCount;index++){
      const phase=randomish(index*17+Math.floor(sceneElapsed*8));
      const angle=index/lineCount*Math.PI*2+sceneElapsed*.04;
      const startRadius=mix(Math.min(cssWidth,cssHeight)*.22,Math.max(cssWidth,cssHeight)*.52,phase);
      const length=mix(18,78,randomish(index*29+7))*speedStrength;
      const x=centerX+Math.cos(angle)*startRadius;
      const y=centerY+Math.sin(angle)*startRadius;
      ctx.globalAlpha=mix(.02,.12,phase)*speedStrength;
      ctx.strokeStyle=index%3===0?'#8ff4ff':(index%2?ashtonPalette.bright:ashtonPalette.outer);
      ctx.lineWidth=mix(.5,1.6,phase);
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*length,y+Math.sin(angle)*length);ctx.stroke();
    }
    ctx.restore();
  }

  function draw(){
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(sceneState==='multiverse'||sceneState==='landing')drawMultiverse();
    else drawWorld();
    drawScreenSpeedLines();
  }

  function createAudio(){
    if(audio){
      if(audio.context.state==='suspended')audio.context.resume().catch(()=>{});
      const now=audio.context.currentTime;
      audio.master.gain.cancelScheduledValues(now);
      audio.master.gain.setValueAtTime(Math.max(.0001,audio.master.gain.value),now);
      audio.master.gain.exponentialRampToValueAtTime(.42,now+.28);
      return;
    }
    const AudioCtor=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtor)return;
    try{
      const context=new AudioCtor();
      const master=context.createGain();
      const hum=context.createOscillator();
      const humGain=context.createGain();
      const pulse=context.createOscillator();
      const pulseGain=context.createGain();
      const filter=context.createBiquadFilter();
      const noise=context.createBufferSource();
      const noiseGain=context.createGain();
      const buffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate);
      const data=buffer.getChannelData(0);
      let last=0;
      for(let index=0;index<data.length;index++){
        const white=Math.random()*2-1;
        last=last*.82+white*.18;
        data[index]=white*.45+last*.55;
      }
      master.gain.value=.0001;
      master.gain.exponentialRampToValueAtTime(.42,context.currentTime+.5);
      master.connect(context.destination);
      hum.type='sine';hum.frequency.value=47;humGain.gain.value=.13;hum.connect(humGain);humGain.connect(master);hum.start();
      pulse.type='triangle';pulse.frequency.value=94;pulseGain.gain.value=.035;pulse.connect(pulseGain);pulseGain.connect(master);pulse.start();
      noise.buffer=buffer;noise.loop=true;filter.type='bandpass';filter.frequency.value=820;filter.Q.value=.48;noiseGain.gain.value=.08;
      noise.connect(filter);filter.connect(noiseGain);noiseGain.connect(master);noise.start();
      audio={context,master,hum,humGain,pulse,pulseGain,filter,noise,noiseGain};
    }catch(error){audio=null;}
  }

  function playCharge(){
    if(!audio)return;
    const context=audio.context;
    if(context.state==='suspended')context.resume().catch(()=>{});
    const now=context.currentTime+.03;
    [
      {start:150,end:780,color:'sawtooth',pan:-.25},
      {start:210,end:1040,color:'triangle',pan:.25}
    ].forEach((voice,index)=>{
      const oscillator=context.createOscillator();
      const gain=context.createGain();
      oscillator.type=voice.color;
      oscillator.frequency.setValueAtTime(voice.start,now+index*.04);
      oscillator.frequency.exponentialRampToValueAtTime(voice.end,now+.38+index*.04);
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(.12,now+.06);
      gain.gain.exponentialRampToValueAtTime(.0001,now+.48);
      oscillator.connect(gain);gain.connect(audio.master);oscillator.start(now);oscillator.stop(now+.5);
    });
  }

  function playCrackle(key){
    if(!audio||audio.context.state!=='running')return;
    const racer=key==='her'?racers[1]:racers[0];
    const context=audio.context;
    const now=context.currentTime+.005;
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    oscillator.type=key==='her'?'triangle':'sawtooth';
    oscillator.frequency.setValueAtTime(key==='her'?1280:860,now);
    oscillator.frequency.exponentialRampToValueAtTime(key==='her'?230:150,now+.12);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(.085,now+.006);
    gain.gain.exponentialRampToValueAtTime(.0001,now+.14);
    oscillator.connect(gain);gain.connect(audio.master);oscillator.start(now);oscillator.stop(now+.15);
    flashStrength=Math.max(flashStrength,racer.key==='her'?.26:.22);
  }

  function playPursuitSiren(){
    if(!audio||audio.context.state!=='running')return;
    const context=audio.context;
    const now=context.currentTime+.02;
    [0,.18,.36,.54,.72].forEach((offset,index)=>{
      const oscillator=context.createOscillator();
      const gain=context.createGain();
      oscillator.type=index%2?'triangle':'sawtooth';
      oscillator.frequency.setValueAtTime(index%2?1180:720,now+offset);
      oscillator.frequency.exponentialRampToValueAtTime(index%2?720:1180,now+offset+.16);
      gain.gain.setValueAtTime(.0001,now+offset);
      gain.gain.exponentialRampToValueAtTime(.065,now+offset+.025);
      gain.gain.exponentialRampToValueAtTime(.0001,now+offset+.17);
      oscillator.connect(gain);gain.connect(audio.master);
      oscillator.start(now+offset);oscillator.stop(now+offset+.18);
    });
  }

  function playExitBreach(){
    if(!audio||audio.context.state!=='running')return;
    const context=audio.context;
    const now=context.currentTime+.015;
    [
      {type:'sine',start:78,end:34,gain:.15,duration:.82},
      {type:'triangle',start:1320,end:210,gain:.095,duration:.66},
      {type:'sawtooth',start:410,end:118,gain:.055,duration:.5}
    ].forEach((voice,index)=>{
      const oscillator=context.createOscillator();
      const gain=context.createGain();
      oscillator.type=voice.type;
      oscillator.frequency.setValueAtTime(voice.start,now+index*.035);
      oscillator.frequency.exponentialRampToValueAtTime(voice.end,now+voice.duration);
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(voice.gain,now+.07+index*.02);
      gain.gain.exponentialRampToValueAtTime(.0001,now+voice.duration);
      oscillator.connect(gain);gain.connect(audio.master);
      oscillator.start(now);oscillator.stop(now+voice.duration+.02);
    });
  }

  function playWorldShift(world,index){
    playExitBreach();
    if(!audio||audio.context.state!=='running')return;
    const context=audio.context;
    const now=context.currentTime+.03;
    const root=164.81*Math.pow(2,(index%5)/12);
    [1,1.5,2].forEach((ratio,voiceIndex)=>{
      const oscillator=context.createOscillator();
      const gain=context.createGain();
      oscillator.type=voiceIndex===1?'triangle':'sine';
      oscillator.frequency.setValueAtTime(root*ratio,now+voiceIndex*.035);
      oscillator.frequency.exponentialRampToValueAtTime(root*ratio*2.2,now+.42+voiceIndex*.03);
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(world.final?.075:.045,now+.07+voiceIndex*.02);
      gain.gain.exponentialRampToValueAtTime(.0001,now+.66+voiceIndex*.04);
      oscillator.connect(gain);gain.connect(audio.master);
      oscillator.start(now);oscillator.stop(now+.74+voiceIndex*.04);
    });
  }

  function updateAudio(){
    if(!audio||audio.context.state!=='running')return;
    const now=audio.context.currentTime;
    audio.hum.frequency.setTargetAtTime(47+speedStrength*22+hotPursuit.mix*18,now,.08);
    audio.pulse.frequency.setTargetAtTime(94+turnStrength*34+hotPursuit.mix*46,now,.06);
    audio.noiseGain.gain.setTargetAtTime(.035+speedStrength*.11+turnStrength*.045+hotPursuit.mix*.05,now,.09);
    audio.filter.frequency.setTargetAtTime(620+speedStrength*1550+turnStrength*480+hotPursuit.mix*680,now,.08);
  }

  function fadeAudio(){
    if(!audio)return;
    const now=audio.context.currentTime;
    audio.master.gain.cancelScheduledValues(now);
    audio.master.gain.setValueAtTime(Math.max(.0001,audio.master.gain.value),now);
    audio.master.gain.exponentialRampToValueAtTime(.0001,now+.85);
  }

  function goHome(){
    try{sessionStorage.setItem('speedForceRunReturn','1');}catch(error){}
    window.location.href='index.html';
  }

  function loop(now){
    if(document.hidden){
      lastFrameTime=now;
      requestAnimationFrame(loop);
      return;
    }
    const dt=lastFrameTime?clamp((now-lastFrameTime)/1000,0,.04):0;
    lastFrameTime=now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  startButton.addEventListener('click',handleStart);
  replayButton.addEventListener('click',startRun);
  backButton.addEventListener('click',goHome);
  finishHome.addEventListener('click',goHome);
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{
    lastFrameTime=0;
    if(!audio)return;
    if(document.hidden){audio.context.suspend().catch(()=>{});return;}
    if((sceneState==='running'||sceneState==='multiverse')&&!paused)audio.context.resume().catch(()=>{});
  });
  window.addEventListener('keydown',event=>{
    const key=event.key.toLowerCase();
    if(key==='escape'){goHome();return;}
    if(key==='r'&&(sceneState==='finished'||sceneState==='ready')){startRun();return;}
    if(key===' '&&(sceneState==='running'||sceneState==='multiverse')){
      event.preventDefault();paused=!paused;
      status.textContent=paused?'Run paused.':'Run resumed.';
    }
  });

  window.speedForceRun={
    start:startRun,
    replay:startRun,
    triggerHotPursuit,
    startMultiverse:beginMultiverse,
    getState:()=>({
      state:sceneState,
      paused,
      runNumber,
      progress:currentProgress,
      rawProgress:currentRawProgress,
      sector:tileDefinitions[currentSector]&&tileDefinitions[currentSector].name,
      speedster:{id:activeSpeedster.id,name:activeSpeedster.name,asset:activeSpeedster.asset,lightning:activeSpeedster.lightning&&activeSpeedster.lightning.label,fullRun:true},
      hotPursuit:{scheduled:hotPursuit.scheduled,active:hotPursuit.active,mix:hotPursuit.mix,mode:hotPursuit.active?'full-run':'inactive'},
      chase:{
        unlocked:runNumber>=CHASE_START_RUN,
        active:chaseActive,
        beginsAfterReplay:3,
        pursuers:pursuers.map(pursuer=>({id:pursuer.speedster.id,name:pursuer.name,asset:pursuer.speedster.asset,lightning:pursuer.speedster.lightning&&pursuer.speedster.lightning.label}))
      },
      randomDeckRemaining:randomSpeedsterDeck.length,
      exitBreach:{opened:exitBreachOpened,reveal:exitBreachReveal(),swallow:finishSwallowProgress()},
      multiverse:{
        active:sceneState==='multiverse'||sceneState==='landing',
        stageIndex:multiverseStageIndex,
        stageKind:activeMultiverseStage()&&activeMultiverseStage().kind,
        stage:activeMultiverseStage()&&activeMultiverseStage().name,
        stageProgress:multiverseStageProgress,
        worldIndex:multiverseWorldIndex,
        world:multiverseWorlds[multiverseWorldIndex]&&multiverseWorlds[multiverseWorldIndex].name,
        worldProgress:multiverseWorldProgress,
        breachCount:multiverseBreachCount,
        tunnel:{name:tunnelConfig.name,asset:tunnelConfig.asset,returns:multiverseWorlds.length},
        worlds:multiverseWorlds.map(world=>world.name),
        destination:{name:FINAL_DESTINATION.name,url:FINAL_DESTINATION.url},
        savedOutfits:{him:selectedOutfitPath('him'),her:selectedOutfitPath('her')}
      },
      performance:{compactViewport,particleRate,particleBudget,dpr},
      routeLength,
      racers:racers.map(racer=>({name:racer.name,direction:racer.pose&&racer.pose.direction,frame:racer.pose&&racer.pose.frame,x:racer.pose&&Math.round(racer.pose.x),y:racer.pose&&Math.round(racer.pose.y)}))
    }),
    getRoster:()=>speedsterRoster.map(speedster=>({
      id:speedster.id,name:speedster.name,asset:speedster.asset,random:!!speedster.random,
      guaranteedRun:speedster.guaranteedRun||null,loaded:!!speedster.loaded,lightning:speedster.lightning&&speedster.lightning.label
    })),
    route:authoredPoints.map(point=>({...point})),
    tiles:tileDefinitions.map(tile=>({...tile}))
  };

  buildRoute();
  resize();
  zoom=baseZoom;
  loadAssets();
  requestAnimationFrame(loop);
})();
