// Automatic two-speedster circuit through the connected 3x3 Speed Force forest.
// The future entrance can point directly to speed-force-run.html; this scene is
// intentionally self-contained until the final doorway location is chosen.
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
  const sectorName=document.getElementById('sectorName');
  const progressFill=document.getElementById('progressFill');
  const progressPercent=document.getElementById('progressPercent');
  const speedFlash=document.getElementById('speedFlash');

  const TILE=1254;
  const WORLD=TILE*3;
  const CELL=256;
  const SPRITE_SIZE=164;
  const RUN_DURATION=37;
  const REDUCED=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);

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

  const himImage=new Image();
  himImage.src='assets/sprites/him_outfit10_run.png';
  const herImage=new Image();
  herImage.src='assets/sprites/her_outfit10_run.png';

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
  let currentDistance=0;
  let currentSector=-1;
  let chapterTimer=0;
  let flashStrength=0;
  let turnStrength=0;
  let speedStrength=0;
  let wakeParticles=[];
  let particleCarry=0;
  let audio=null;
  let lastCrackleAt=0;
  let loadFailed=false;

  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function mix(a,b,t){return a+(b-a)*t;}
  function lerpPoint(a,b,t){return {x:mix(a.x,b.x,t),y:mix(a.y,b.y,t)};}
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function smoothFollow(rate,dt){return 1-Math.pow(1-rate,dt*60);}
  function seeded(value){return (Math.sin(value*12.9898+78.233)*43758.5453)%1;}
  function randomish(value){const result=seeded(value);return result<0?result+1:result;}

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
    dpr=Math.min(window.devicePixelRatio||1,2);
    cssWidth=Math.max(1,window.innerWidth);
    cssHeight=Math.max(1,window.innerHeight);
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
      {image:herImage,label:'Tanima'}
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
        startButton.disabled=false;
        startButton.textContent='Start the run';
        loadText.textContent='One entrance. One exit. The circuit is ready.';
        status.textContent='The Speed Force forest is ready.';
        resetScene();
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
    currentDistance=0;
    currentSector=-1;
    chapterTimer=0;
    flashStrength=0;
    turnStrength=0;
    speedStrength=0;
    wakeParticles=[];
    particleCarry=0;
    paused=false;
    racers.forEach(racer=>{racer.history=[];racer.pose=null;});
    const start=routeAt(0);
    camera={x:start.x,y:start.y};
    updateRacers(0,true);
    updateSector(true);
    progressFill.style.width='0%';
    progressPercent.textContent='0%';
  }

  function startRun(){
    resetScene();
    sceneState='running';
    loader.classList.add('is-hidden');
    finish.classList.add('is-hidden');
    flashStrength=1;
    status.textContent='Ashton and Tanima launch into the Speed Force forest.';
    createAudio();
    playCharge();
  }

  function finishRun(){
    if(sceneState!=='running')return;
    sceneState='finishing';
    finishElapsed=0;
    flashStrength=1;
    status.textContent='The Speed Force forest circuit is complete.';
    fadeAudio();
  }

  function showFinish(){
    sceneState='finished';
    finish.classList.remove('is-hidden');
  }

  function racerDistance(racer,baseDistance,progress){
    const rivalry=Math.sin(progress*Math.PI*6+(racer.key==='her'?.7:3.84))*34;
    const straightBoost=Math.sin(progress*Math.PI*14+(racer.key==='her'?1.2:4.34))*11;
    return clamp(baseDistance+rivalry+straightBoost,0,routeLength);
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
        racer.history.push({
          x,y,tx:sampled.tx,ty:sampled.ty,direction,frame,
          centerX:x,centerY:y-SPRITE_SIZE*.52
        });
        const historyLimit=REDUCED?11:42;
        if(racer.history.length>historyLimit)racer.history.splice(0,racer.history.length-historyLimit);
      }
    });

    if(!force)spawnWake(dt);
  }

  function updateCamera(dt){
    const ahead=routeAt(currentDistance+mix(110,300,speedStrength));
    const midpoint={
      x:(racers[0].pose.x+racers[1].pose.x)/2,
      y:(racers[0].pose.y+racers[1].pose.y)/2
    };
    const target={x:mix(midpoint.x,ahead.x,.34),y:mix(midpoint.y,ahead.y,.34)};
    const next=routeAt(currentDistance+130);
    const dot=clamp(ahead.tx*next.tx+ahead.ty*next.ty,-1,1);
    turnStrength=clamp((1-dot)*8,0,1);
    const desiredZoom=baseZoom*(1-.075*speedStrength-.045*turnStrength);
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
    particleCarry+=dt*70;
    while(particleCarry>=1){
      particleCarry--;
      racers.forEach(racer=>{
        const pose=racer.pose;
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
          color:spark?racer.bright:(Math.random()>.5?'#7da556':'#b27e42'),
          angle:Math.random()*Math.PI*2,spin:(Math.random()-.5)*9
        });
      });
    }
    if(wakeParticles.length>420)wakeParticles.splice(0,wakeParticles.length-420);
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

    if(sceneState==='running'&&!paused){
      sceneElapsed+=dt;
      const raw=clamp(sceneElapsed/RUN_DURATION,0,1);
      currentProgress=runProgress(raw);
      currentDistance=currentProgress*routeLength;
      speedStrength=clamp(Math.min(raw/.08,(1-raw)/.08),0,1);
      updateRacers(dt,false);
      updateParticles(dt);
      updateCamera(dt);
      updateSector(false);
      updateAudio();
      const percent=Math.round(raw*100);
      progressFill.style.width=percent+'%';
      progressPercent.textContent=percent+'%';
      if(raw>=1)finishRun();
    }else if(sceneState==='finishing'){
      finishElapsed+=dt;
      speedStrength=Math.max(0,1-finishElapsed/.9);
      updateParticles(dt);
      updateCamera(dt);
      if(finishElapsed>=1.05)showFinish();
    }
  }

  function setWorldTransform(shakeX,shakeY){
    const scale=dpr*zoom;
    ctx.setTransform(scale,0,0,scale,canvas.width/2-(camera.x+shakeX)*scale,canvas.height/2-(camera.y+shakeY)*scale);
  }

  function drawWorld(){
    const shake=REDUCED?0:(speedStrength*(1.2+turnStrength*2.4));
    const shakeX=Math.sin(sceneElapsed*71)*shake;
    const shakeY=Math.cos(sceneElapsed*83)*shake*.72;
    setWorldTransform(shakeX,shakeY);
    ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#041018';
    ctx.fillRect(0,0,WORLD,WORLD);
    ctx.drawImage(worldImage,0,0,WORLD,WORLD);
    drawWakeParticles();
    racers.forEach(drawTrail);
    racers.forEach(drawAfterimages);
    [...racers].sort((a,b)=>a.pose.y-b.pose.y).forEach(drawRacer);
  }

  function drawWakeParticles(){
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    wakeParticles.forEach(particle=>{
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
    const oldest=history[0],newest=history[history.length-1];
    const gradient=ctx.createLinearGradient(oldest.centerX,oldest.centerY,newest.centerX,newest.centerY);
    gradient.addColorStop(0,'rgba(0,0,0,0)');
    gradient.addColorStop(.28,racer.outer);
    gradient.addColorStop(1,racer.bright);
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    ctx.lineCap='round';ctx.lineJoin='round';
    ctx.globalAlpha=.16*speedStrength;
    ctx.strokeStyle=gradient;ctx.lineWidth=54;ctx.shadowColor=racer.shadow;ctx.shadowBlur=34;
    if(trailPath(history))ctx.stroke();
    ctx.globalAlpha=.44*speedStrength;
    ctx.lineWidth=19;ctx.shadowBlur=20;
    if(trailPath(history))ctx.stroke();
    ctx.globalAlpha=.93*speedStrength;
    ctx.strokeStyle=racer.core;ctx.lineWidth=3.2;ctx.shadowBlur=9;
    if(trailPath(history))ctx.stroke();
    drawTrailBranches(racer);
    ctx.restore();
  }

  function drawTrailBranches(racer){
    if(REDUCED)return;
    const history=racer.history;
    const tick=Math.floor(sceneElapsed*18);
    for(let index=5;index<history.length-2;index+=7){
      const point=history[index];
      const branchSize=22+randomish(racer.seed+index+tick)*38;
      const side=randomish(racer.seed*2+index+tick)>.5?1:-1;
      const end={
        x:point.centerX-point.ty*branchSize*side-point.tx*branchSize*.35,
        y:point.centerY+point.tx*branchSize*side-point.ty*branchSize*.35
      };
      ctx.globalAlpha=.42*(index/history.length)*speedStrength;
      drawBolt({x:point.centerX,y:point.centerY},end,4,racer.bright,1.8,racer.seed+index+tick);
    }
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

  function drawSpriteFrame(racer,pose,size,alpha,glow){
    if(!pose)return;
    const row=rowFor(pose.direction);
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(pose.x,pose.y);
    ctx.rotate(pose.turn||0);
    if(glow){ctx.shadowColor=racer.shadow;ctx.shadowBlur=26;}
    ctx.drawImage(racer.image,pose.frame*CELL,row*CELL,CELL,CELL,-size/2,-size,size,size);
    ctx.restore();
  }

  function drawAfterimages(racer){
    if(REDUCED||racer.history.length<18)return;
    ctx.save();ctx.globalCompositeOperation='lighter';
    [10,19,28].forEach((behind,index)=>{
      const point=racer.history[Math.max(0,racer.history.length-1-behind)];
      if(!point)return;
      drawSpriteFrame(racer,{...point,turn:0},SPRITE_SIZE*(1-index*.025),(.13-index*.025)*speedStrength,true);
    });
    ctx.restore();
  }

  function drawRacer(racer){
    const pose=racer.pose;
    if(!pose)return;
    ctx.save();
    ctx.globalAlpha=.28;
    ctx.fillStyle='#02070a';
    ctx.beginPath();ctx.ellipse(pose.x,pose.y-4,SPRITE_SIZE*.31,SPRITE_SIZE*.105,0,0,Math.PI*2);ctx.fill();
    ctx.restore();

    ctx.save();ctx.globalCompositeOperation='lighter';
    drawSpriteFrame(racer,pose,SPRITE_SIZE,.42*speedStrength,true);
    ctx.restore();
    drawSpriteFrame(racer,pose,SPRITE_SIZE,1,false);
    drawBodyLightning(racer);
  }

  function drawBodyLightning(racer){
    if(REDUCED)return;
    const pose=racer.pose;
    const tick=Math.floor(sceneElapsed*22);
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let index=0;index<4;index++){
      const startAngle=randomish(racer.seed+index*9+tick)*Math.PI*2;
      const endAngle=startAngle+mix(.8,1.8,randomish(racer.seed+index*5+tick));
      const radius=SPRITE_SIZE*mix(.23,.42,randomish(racer.seed+index*3+tick));
      const start={x:pose.x+Math.cos(startAngle)*radius,y:pose.y-SPRITE_SIZE*.52+Math.sin(startAngle)*radius*.72};
      const end={x:pose.x+Math.cos(endAngle)*radius,y:pose.y-SPRITE_SIZE*.52+Math.sin(endAngle)*radius*.72};
      ctx.globalAlpha=mix(.45,.9,randomish(racer.seed+index+tick))*speedStrength;
      drawBolt(start,end,4,racer.core,index===0?2.4:1.5,racer.seed+index+tick);
    }
    ctx.restore();
  }

  function drawScreenSpeedLines(){
    if(REDUCED||speedStrength<.2)return;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    const centerX=cssWidth/2,centerY=cssHeight/2;
    for(let index=0;index<30;index++){
      const phase=randomish(index*17+Math.floor(sceneElapsed*8));
      const angle=index/30*Math.PI*2+sceneElapsed*.04;
      const startRadius=mix(Math.min(cssWidth,cssHeight)*.22,Math.max(cssWidth,cssHeight)*.52,phase);
      const length=mix(18,78,randomish(index*29+7))*speedStrength;
      const x=centerX+Math.cos(angle)*startRadius;
      const y=centerY+Math.sin(angle)*startRadius;
      ctx.globalAlpha=mix(.02,.12,phase)*speedStrength;
      ctx.strokeStyle=index%2?'#d9fdff':'#ffe682';
      ctx.lineWidth=mix(.5,1.6,phase);
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*length,y+Math.sin(angle)*length);ctx.stroke();
    }
    ctx.restore();
  }

  function draw(){
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawWorld();
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

  function updateAudio(){
    if(!audio||audio.context.state!=='running')return;
    const now=audio.context.currentTime;
    audio.hum.frequency.setTargetAtTime(47+speedStrength*22,now,.08);
    audio.pulse.frequency.setTargetAtTime(94+turnStrength*34,now,.06);
    audio.noiseGain.gain.setTargetAtTime(.035+speedStrength*.11+turnStrength*.045,now,.09);
    audio.filter.frequency.setTargetAtTime(620+speedStrength*1550+turnStrength*480,now,.08);
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
  window.addEventListener('keydown',event=>{
    const key=event.key.toLowerCase();
    if(key==='escape'){goHome();return;}
    if(key==='r'&&(sceneState==='finished'||sceneState==='ready')){startRun();return;}
    if(key===' '&&sceneState==='running'){
      event.preventDefault();paused=!paused;
      status.textContent=paused?'Run paused.':'Run resumed.';
    }
  });

  window.speedForceRun={
    start:startRun,
    replay:startRun,
    getState:()=>({
      state:sceneState,
      paused,
      progress:currentProgress,
      sector:tileDefinitions[currentSector]&&tileDefinitions[currentSector].name,
      routeLength,
      racers:racers.map(racer=>({name:racer.name,direction:racer.pose&&racer.pose.direction,frame:racer.pose&&racer.pose.frame,x:racer.pose&&Math.round(racer.pose.x),y:racer.pose&&Math.round(racer.pose.y)}))
    }),
    route:authoredPoints.map(point=>({...point})),
    tiles:tileDefinitions.map(tile=>({...tile}))
  };

  buildRoute();
  resize();
  zoom=baseZoom;
  loadAssets();
  requestAnimationFrame(loop);
})();
