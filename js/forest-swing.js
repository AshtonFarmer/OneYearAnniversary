// Automatic two-rider forest swing.
// The PNGs are background panels; characters and webs stay separate runtime layers.
(function(){
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const loading = document.getElementById('loading');
  const chapter = document.getElementById('chapter');
  const landingPanel = document.getElementById('landing');
  const sceneStatus = document.getElementById('sceneStatus');

  const PANEL_W = 1774;
  const PANEL_H = 887;
  const PANEL_OVERLAP = 128;
  const PANEL_STEP = PANEL_W - PANEL_OVERLAP;
  const INTRO_DURATION = 1.55;
  const CYCLE_DURATION = 1.72;
  const LAND_DURATION = 2.15;
  const SHOT_END = .23;
  const SWING_END = .81;
  const SPRITE_CELL = 256;
  const SPRITE_SIZE = 148;

  const panelDefinitions = [
    ['Entrance Canopy','assets/forest/forest-swing-01-entrance-canopy.png'],
    ['Canopy Ascent','assets/forest/forest-swing-02-canopy-ascent.png'],
    ['Giant-Oak Corridor','assets/forest/forest-swing-03-giant-oak-corridor.png'],
    ['Waterfall Ravine','assets/forest/forest-swing-04-waterfall-ravine.png'],
    ['Firefly-Veil Grove','assets/forest/forest-swing-05-firefly-veil-grove.png'],
    ['Moonlit Canopy','assets/forest/forest-swing-06-moonlit-canopy.png'],
    ['Silverwood Descent','assets/forest/forest-swing-07-silverwood-descent.png'],
    ['Landing Clearing','assets/forest/forest-swing-08-landing-clearing.png']
  ];

  const panels = panelDefinitions.map(([name,src]) => {
    const img = new Image();
    img.src = src;
    return {name,src,img};
  });

  const anchors = [
    [0,340,155,220],[0,1450,145],
    [1,430,145],[1,1390,245],
    [2,460,135],[2,1460,130],
    [3,460,125],[3,1430,150],
    [4,430,150],[4,1400,145],
    [5,500,205],[5,1440,155],
    [6,565,175],[6,1450,395],
    [7,410,250]
  ].map(([panel,x,y,radius],index) => ({
    index,
    panel,
    x:panel * PANEL_STEP + x,
    y,
    radius:radius || null
  }));

  const WORLD_W = (panels.length - 1) * PANEL_STEP + PANEL_W;
  const WORLD_H = PANEL_H;
  const TOTAL_SWING_DURATION = anchors.length * CYCLE_DURATION;

  const herImage = new Image();
  herImage.src = 'assets/sprites/her_spidey_swing_atlas.png';
  const himImage = new Image();
  himImage.src = 'assets/sprites/him_spidey_swing_atlas.png';

  const riders = [
    {
      key:'her',
      name:'Tanima',
      image:herImage,
      timeOffset:.055,
      anchorX:18,
      anchorY:-4,
      radius:345,
      start:{x:82,y:604},
      launch:{x:130,y:510},
      landingApproach:{x:7 * PANEL_STEP + 1120,y:420},
      landing:{x:7 * PANEL_STEP + 1390,y:605},
      shotFrame:8,
      swingFrames:[4,5,4,3],
      flightFrames:[3,11,10],
      landingFrames:[1,14,15],
      wrist:{3:[177,13],4:[102,25],5:[108,29],8:[224,116],10:[165,128],11:[232,126],14:[142,200],15:[201,143]}
    },
    {
      key:'him',
      name:'Ashton',
      image:himImage,
      timeOffset:-.055,
      anchorX:-18,
      anchorY:7,
      radius:318,
      start:{x:35,y:618},
      launch:{x:90,y:535},
      landingApproach:{x:7 * PANEL_STEP + 1060,y:445},
      landing:{x:7 * PANEL_STEP + 1328,y:611},
      shotFrame:11,
      swingFrames:[4,5,4,3],
      flightFrames:[3,11,10],
      landingFrames:[1,14,15],
      wrist:{3:[237,17],4:[105,62],5:[109,63],10:[185,126],11:[232,102],14:[152,205],15:[196,139]}
    }
  ];

  let camera = {x:0,y:0};
  let sceneScale = 1;
  let motionScale = 1;
  let sceneTime = 0;
  let lastFrameTime = 0;
  let running = false;
  let landed = false;
  let currentPanel = -1;
  let chapterTimer = 0;
  let riderPoses = [];
  let ambientParticles = [];
  let impactParticles = [];
  let ambientSpawnCarry = 0;
  let landingRevealTimer = 0;
  let landingPanelShown = false;

  function clamp(value,min,max){ return Math.max(min,Math.min(max,value)); }
  function mix(a,b,t){ return a + (b-a)*t; }
  function easeInOut(t){ return .5 - Math.cos(clamp(t,0,1)*Math.PI)/2; }
  function easeOut(t){ return 1-Math.pow(1-clamp(t,0,1),3); }
  function pointMix(a,b,t){ return {x:mix(a.x,b.x,t),y:mix(a.y,b.y,t)}; }

  function randomBetween(min,max){ return min+Math.random()*(max-min); }

  function resize(){
    const dpr = Math.min(window.devicePixelRatio || 1,2);
    const cssW = Math.max(1,window.innerWidth);
    const cssH = Math.max(1,window.innerHeight);
    canvas.width = Math.round(cssW*dpr);
    canvas.height = Math.round(cssH*dpr);
    canvas.style.width = cssW+'px';
    canvas.style.height = cssH+'px';
    sceneScale = clamp(cssH/PANEL_H,.9,1.1)*dpr;
    motionScale = clamp((canvas.width/sceneScale)/600,.76,1);
    ctx.imageSmoothingEnabled = false;
  }

  window.addEventListener('resize',resize);
  resize();

  function anchorFor(index,rider){
    const anchor = anchors[clamp(index,0,anchors.length-1)];
    return {x:anchor.x+rider.anchorX,y:anchor.y+rider.anchorY};
  }

  function arcPoint(index,rider,angle){
    const anchor = anchorFor(index,rider);
    const anchorRadius = anchors[index].radius || Infinity;
    const radius = Math.min(rider.radius*motionScale,Math.max(235,580-anchor.y),anchorRadius);
    return {
      x:anchor.x+Math.sin(angle)*radius,
      y:anchor.y+Math.cos(angle)*radius
    };
  }

  function arcStart(index,rider){ return arcPoint(index,rider,-1.07); }
  function arcEnd(index,rider){ return arcPoint(index,rider,1.09); }

  function flightMid(fromIndex,toIndex,rider){
    const from = arcEnd(fromIndex,rider);
    const to = arcStart(toIndex,rider);
    const point = pointMix(from,to,.52);
    point.y -= 72;
    return point;
  }

  function webPose(type,anchor,amount,impact){
    return {type,anchor,amount:clamp(amount,0,1),impact:clamp(impact || 0,0,1)};
  }

  function evaluateIntro(rider,t){
    const wait = rider.key === 'her' ? .02 : .08;
    const local = clamp((t-wait)/(1-wait),0,1);
    if(local < .28){
      return {x:rider.start.x,y:rider.start.y,frame:0,web:null};
    }
    const leap = easeOut((local-.28)/.72);
    const position = pointMix(rider.start,rider.launch,leap);
    position.y -= Math.sin(leap*Math.PI)*62;
    return {
      x:position.x,
      y:position.y,
      frame:leap < .46 ? 1 : 2,
      web:null
    };
  }

  function evaluateSwing(rider,elapsed){
    const riderTime = Math.max(0,elapsed+rider.timeOffset);
    if(riderTime >= TOTAL_SWING_DURATION){
      return evaluateLanding(rider,riderTime-TOTAL_SWING_DURATION);
    }

    const index = Math.min(anchors.length-1,Math.floor(riderTime/CYCLE_DURATION));
    const u = (riderTime-index*CYCLE_DURATION)/CYCLE_DURATION;
    const anchor = anchorFor(index,rider);

    if(u < SHOT_END){
      const t = u/SHOT_END;
      const start = index === 0 ? rider.launch : flightMid(index-1,index,rider);
      const end = arcStart(index,rider);
      const travel = easeInOut(t);
      const position = pointMix(start,end,travel);
      position.y -= Math.sin(travel*Math.PI)*38;
      const amount = easeOut(clamp((t-.06)/.82,0,1));
      const impact = clamp(1-Math.abs(t-.91)/.09,0,1);
      return {
        x:position.x,
        y:position.y,
        frame:t>.82 ? rider.swingFrames[0] : rider.shotFrame,
        web:webPose('shoot',anchor,amount,impact)
      };
    }

    if(u < SWING_END){
      const t = (u-SHOT_END)/(SWING_END-SHOT_END);
      const swingT = easeInOut(t);
      const angle = mix(-1.07,1.09,swingT);
      const position = arcPoint(index,rider,angle);
      const frameIndex = Math.min(rider.swingFrames.length-1,Math.floor(t*rider.swingFrames.length));
      return {
        x:position.x,
        y:position.y,
        frame:rider.swingFrames[frameIndex],
        web:webPose('attached',anchor,1,clamp(1-t*12,0,1))
      };
    }

    const t = (u-SWING_END)/(1-SWING_END);
    const start = arcEnd(index,rider);
    const end = index < anchors.length-1 ? flightMid(index,index+1,rider) : rider.landingApproach;
    const travel = easeInOut(t);
    const position = pointMix(start,end,travel);
    position.y -= Math.sin(travel*Math.PI)*48;
    const frameIndex = t < .28 ? 0 : (t < .68 ? 1 : 2);
    return {
      x:position.x,
      y:position.y,
      frame:rider.flightFrames[frameIndex],
      web:webPose('retract',anchor,1-easeOut(t),0)
    };
  }

  function evaluateLanding(rider,elapsed){
    const t = clamp(elapsed/LAND_DURATION,0,1);
    const travel = easeInOut(t);
    const position = pointMix(rider.landingApproach,rider.landing,travel);
    position.y -= Math.sin(travel*Math.PI)*88;
    const frame = t < .62 ? rider.landingFrames[0] : (t < .88 ? rider.landingFrames[1] : rider.landingFrames[2]);
    return {x:position.x,y:position.y,frame,web:null,landed:t>=1};
  }

  function wristFor(pose,rider){
    const local = rider.wrist[pose.frame] || [192,72];
    return {
      x:pose.x-SPRITE_SIZE/2+(local[0]/SPRITE_CELL)*SPRITE_SIZE,
      y:pose.y-SPRITE_SIZE/2+(local[1]/SPRITE_CELL)*SPRITE_SIZE
    };
  }

  function drawPanel(panel,index){
    const x = index*PANEL_STEP;
    if(index === 0){
      ctx.drawImage(panel.img,x,0,PANEL_W,PANEL_H);
      return;
    }

    // Blend each new map across the shared edge so the eight paintings read as one route.
    ctx.drawImage(
      panel.img,
      PANEL_OVERLAP,0,PANEL_W-PANEL_OVERLAP,PANEL_H,
      x+PANEL_OVERLAP,0,PANEL_W-PANEL_OVERLAP,PANEL_H
    );

    const strips = 12;
    const stripW = PANEL_OVERLAP/strips;
    for(let strip=0;strip<strips;strip++){
      ctx.save();
      ctx.globalAlpha=(strip+1)/strips;
      const sx=strip*stripW;
      ctx.drawImage(panel.img,sx,0,stripW+1,PANEL_H,x+sx,0,stripW+1,PANEL_H);
      ctx.restore();
    }
  }

  function drawBackground(){
    ctx.fillStyle='#031012';
    ctx.fillRect(0,0,WORLD_W,WORLD_H);
    panels.forEach((panel,index) => {
      const x=index*PANEL_STEP;
      const visibleLeft=camera.x-160;
      const visibleRight=camera.x+canvas.width/sceneScale+160;
      if(x>visibleRight || x+PANEL_W<visibleLeft) return;
      drawPanel(panel,index);
    });
  }

  function spawnAmbientParticle(){
    const viewW=canvas.width/sceneScale;
    const viewH=canvas.height/sceneScale;
    const visibleTop=Math.max(45,camera.y+45);
    const visibleBottom=Math.max(visibleTop+1,Math.min(WORLD_H-45,camera.y+viewH-70));
    const roll=Math.random();
    const type=roll<.52 ? 'leaf' : (roll<.72 ? 'petal' : 'streak');
    const life=type==='streak' ? randomBetween(.34,.58) : randomBetween(1.7,2.8);
    ambientParticles.push({
      type,
      x:camera.x+viewW+randomBetween(10,120),
      y:randomBetween(visibleTop,visibleBottom),
      vx:type==='streak' ? randomBetween(-720,-500) : randomBetween(-64,-28),
      vy:type==='petal' ? randomBetween(4,18) : randomBetween(-10,18),
      life,
      maxLife:life,
      size:type==='streak' ? randomBetween(24,54) : randomBetween(3,6),
      angle:randomBetween(0,Math.PI*2),
      spin:randomBetween(-3.4,3.4),
      phase:randomBetween(0,Math.PI*2)
    });
  }

  function spawnLandingImpact(){
    riders.forEach(rider => {
      const groundX=rider.landing.x;
      const groundY=rider.landing.y+54;

      for(let i=0;i<10;i++){
        const life=randomBetween(.55,.95);
        impactParticles.push({
          type:'dust',
          x:groundX+randomBetween(-24,24),
          y:groundY+randomBetween(-4,4),
          vx:randomBetween(-58,58),
          vy:randomBetween(-75,-24),
          life,
          maxLife:life,
          size:randomBetween(4,9),
          gravity:88
        });
      }

      for(let i=0;i<8;i++){
        const life=randomBetween(.75,1.25);
        impactParticles.push({
          type:'leaf',
          x:groundX+randomBetween(-18,18),
          y:groundY-3,
          vx:randomBetween(-95,95),
          vy:randomBetween(-145,-62),
          life,
          maxLife:life,
          size:randomBetween(3,6),
          gravity:130,
          angle:randomBetween(0,Math.PI*2),
          spin:randomBetween(-6,6)
        });
      }
    });
  }

  function updateParticles(dt,allowAmbient){
    if(allowAmbient && sceneTime>INTRO_DURATION+.15 && !landed){
      ambientSpawnCarry+=dt*8.5;
      while(ambientSpawnCarry>=1){
        spawnAmbientParticle();
        ambientSpawnCarry--;
      }
    }

    ambientParticles.forEach(particle => {
      particle.life-=dt;
      particle.x+=particle.vx*dt;
      particle.y+=(particle.vy+Math.sin(sceneTime*5+particle.phase)*10)*dt;
      particle.angle+=particle.spin*dt;
    });
    ambientParticles=ambientParticles.filter(particle => particle.life>0 && particle.x>camera.x-120);

    impactParticles.forEach(particle => {
      particle.life-=dt;
      particle.x+=particle.vx*dt;
      particle.y+=particle.vy*dt;
      particle.vy+=(particle.gravity || 0)*dt;
      if(typeof particle.angle==='number') particle.angle+=particle.spin*dt;
    });
    impactParticles=impactParticles.filter(particle => particle.life>0);
  }

  function drawLeafParticle(particle,alpha){
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(Math.round(particle.x),Math.round(particle.y));
    ctx.rotate(particle.angle || 0);
    const size=Math.max(2,Math.round(particle.size));
    ctx.fillStyle='#7ebf68';
    ctx.fillRect(-size,-Math.ceil(size*.45),size*2,size);
    ctx.fillStyle='#d2e879';
    ctx.fillRect(-size,0,size,Math.max(1,Math.floor(size*.35)));
    ctx.restore();
  }

  function drawAmbientEffects(){
    ambientParticles.forEach(particle => {
      const alpha=clamp(particle.life/Math.min(.5,particle.maxLife),0,1)*.72;
      if(particle.type==='streak'){
        ctx.save();
        ctx.globalAlpha=alpha*.62;
        ctx.strokeStyle='#d9fff0';
        ctx.lineWidth=1.5;
        ctx.beginPath();
        ctx.moveTo(Math.round(particle.x),Math.round(particle.y));
        ctx.lineTo(Math.round(particle.x+particle.size),Math.round(particle.y));
        ctx.stroke();
        ctx.restore();
      } else if(particle.type==='petal'){
        ctx.save();
        ctx.globalAlpha=alpha;
        ctx.translate(Math.round(particle.x),Math.round(particle.y));
        ctx.rotate(particle.angle || 0);
        ctx.fillStyle='#ffd3e8';
        ctx.fillRect(-3,-2,6,4);
        ctx.fillStyle='#fff1f8';
        ctx.fillRect(-2,-2,2,2);
        ctx.restore();
      } else {
        drawLeafParticle(particle,alpha);
      }
    });
  }

  function drawImpactEffects(){
    impactParticles.forEach(particle => {
      const alpha=clamp(particle.life/particle.maxLife,0,1);
      if(particle.type==='leaf'){
        drawLeafParticle(particle,alpha);
        return;
      }

      ctx.save();
      ctx.globalAlpha=alpha*.45;
      ctx.fillStyle='#b6ab82';
      const size=Math.max(2,Math.round(particle.size*(1+(1-alpha)*.7)));
      ctx.fillRect(Math.round(particle.x-size/2),Math.round(particle.y-size/2),size,size);
      ctx.fillStyle='#d2c7a2';
      ctx.fillRect(Math.round(particle.x-size/3),Math.round(particle.y-size/2),Math.max(2,Math.round(size*.35)),Math.max(2,Math.round(size*.35)));
      ctx.restore();
    });
  }

  function drawWebStrand(from,to,loose){
    const dx=to.x-from.x;
    const dy=to.y-from.y;
    const length=Math.hypot(dx,dy) || 1;
    const nx=-dy/length;
    const ny=dx/length;
    const points=9;

    function trace(amplitude){
      ctx.beginPath();
      for(let i=0;i<=points;i++){
        const t=i/points;
        const wave=Math.sin(t*Math.PI*6)*amplitude*Math.sin(t*Math.PI);
        const x=mix(from.x,to.x,t)+nx*wave;
        const y=mix(from.y,to.y,t)+ny*wave;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
    }

    ctx.save();
    ctx.lineCap='round';
    ctx.lineJoin='round';
    trace(loose ? 4.5 : .65);
    ctx.strokeStyle='rgba(0,12,16,.78)';
    ctx.lineWidth=5;
    ctx.stroke();
    trace(loose ? 4.5 : .65);
    ctx.strokeStyle='rgba(221,245,255,.96)';
    ctx.lineWidth=2.15;
    ctx.stroke();
    trace(loose ? 3.8 : .4);
    ctx.strokeStyle='rgba(255,255,255,.92)';
    ctx.lineWidth=.85;
    ctx.stroke();

    if(!loose && length>95){
      ctx.strokeStyle='rgba(205,238,245,.72)';
      ctx.lineWidth=1;
      const ticks=Math.min(9,Math.floor(length/54));
      for(let i=1;i<=ticks;i++){
        const t=i/(ticks+1);
        const x=mix(from.x,to.x,t);
        const y=mix(from.y,to.y,t);
        ctx.beginPath();
        ctx.moveTo(x-nx*3.5,y-ny*3.5);
        ctx.lineTo(x+nx*3.5,y+ny*3.5);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawAnchorImpact(anchor,intensity){
    if(intensity<=0) return;
    const pulse=6+intensity*11;
    ctx.save();
    ctx.globalAlpha=intensity;
    ctx.strokeStyle='#f5ffff';
    ctx.fillStyle='#d6fbff';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(anchor.x,anchor.y,pulse*.55,0,Math.PI*2);
    ctx.stroke();
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4;
      ctx.beginPath();
      ctx.moveTo(anchor.x+Math.cos(angle)*4,anchor.y+Math.sin(angle)*4);
      ctx.lineTo(anchor.x+Math.cos(angle)*pulse,anchor.y+Math.sin(angle)*pulse);
      ctx.stroke();
    }
    ctx.fillRect(Math.round(anchor.x-2),Math.round(anchor.y-2),4,4);
    ctx.restore();
  }

  function drawWeb(pose,rider){
    if(!pose.web || pose.web.amount<=.015) return;
    const wrist=wristFor(pose,rider);
    const anchor=pose.web.anchor;
    const end=pointMix(wrist,anchor,pose.web.amount);
    drawWebStrand(wrist,end,pose.web.type==='shoot');
    drawAnchorImpact(anchor,pose.web.impact);
  }

  function drawRider(pose,rider){
    const col=pose.frame%4;
    const row=Math.floor(pose.frame/4);
    const x=Math.round(pose.x-SPRITE_SIZE/2);
    const y=Math.round(pose.y-SPRITE_SIZE/2);
    ctx.drawImage(
      rider.image,
      col*SPRITE_CELL,row*SPRITE_CELL,SPRITE_CELL,SPRITE_CELL,
      x,y,SPRITE_SIZE,SPRITE_SIZE
    );
  }

  function updateChapter(midX,dt){
    const panel=clamp(Math.floor((midX+PANEL_STEP*.42)/PANEL_STEP),0,panels.length-1);
    if(panel!==currentPanel){
      currentPanel=panel;
      chapter.textContent=panels[panel].name;
      chapterTimer=2.25;
    }
    chapterTimer=Math.max(0,chapterTimer-dt);
    const fadeIn=clamp((2.25-chapterTimer)/.28,0,1);
    const fadeOut=clamp(chapterTimer/.55,0,1);
    chapter.style.opacity=String(Math.min(fadeIn,fadeOut)*.94);
  }

  function updateCamera(dt){
    const midX=(riderPoses[0].x+riderPoses[1].x)/2;
    const midY=(riderPoses[0].y+riderPoses[1].y)/2;
    const viewW=canvas.width/sceneScale;
    const viewH=canvas.height/sceneScale;
    const focusPoints=riderPoses.map(pose => ({x:pose.x,y:pose.y}));
    riderPoses.forEach(pose => {
      if(pose.web && pose.web.amount>.12) focusPoints.push(pose.web.anchor);
    });
    const minX=Math.min(...focusPoints.map(point => point.x));
    const maxX=Math.max(...focusPoints.map(point => point.x));
    const minY=Math.min(...focusPoints.map(point => point.y));
    const maxY=Math.max(...focusPoints.map(point => point.y));
    const framedX=(minX+maxX)/2-viewW/2;
    const framedY=(minY+maxY)/2-viewH/2;
    const targetX=clamp(maxX-minX<viewW*.9 ? framedX : midX-viewW*.47,0,Math.max(0,WORLD_W-viewW));
    const targetY=clamp(maxY-minY<viewH*.82 ? framedY : midY-viewH*.53,0,Math.max(0,WORLD_H-viewH));
    const follow=1-Math.pow(.001,dt);
    camera.x=mix(camera.x,targetX,follow);
    camera.y=mix(camera.y,targetY,follow);
    updateChapter(midX,dt);
  }

  function update(dt){
    if(!running){
      updateParticles(dt,false);
      if(landed && !landingPanelShown){
        landingRevealTimer=Math.max(0,landingRevealTimer-dt);
        if(landingRevealTimer<=0){
          landingPanelShown=true;
          landingPanel.classList.add('is-visible');
        }
      }
      return;
    }
    sceneTime+=dt;

    if(sceneTime<INTRO_DURATION){
      const t=clamp(sceneTime/INTRO_DURATION,0,1);
      riderPoses=riders.map(rider => evaluateIntro(rider,t));
    } else {
      const swingElapsed=sceneTime-INTRO_DURATION;
      riderPoses=riders.map(rider => evaluateSwing(rider,swingElapsed));
    }

    updateCamera(dt);
    updateParticles(dt,true);

    if(!landed && riderPoses.every(pose => pose.landed)){
      landed=true;
      running=false;
      chapter.style.opacity='0';
      landingRevealTimer=.9;
      landingPanelShown=false;
      spawnLandingImpact();
      window.dispatchEvent(new CustomEvent('forest-swing-landed'));
      sceneStatus.textContent='The forest swing is complete. Ashton and Tanima landed together in the final clearing.';
      try{ localStorage.setItem('forestSwingCompleted','true'); }catch(error){}
    }
  }

  function draw(){
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#020b0d';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.setTransform(sceneScale,0,0,sceneScale,-camera.x*sceneScale,-camera.y*sceneScale);
    ctx.imageSmoothingEnabled=false;
    drawBackground();
    drawAmbientEffects();
    riderPoses.forEach((pose,index) => drawWeb(pose,riders[index]));
    riderPoses.forEach((pose,index) => drawRider(pose,riders[index]));
    drawImpactEffects();

    const vignette=ctx.createRadialGradient(
      camera.x+canvas.width/sceneScale*.5,
      camera.y+canvas.height/sceneScale*.48,
      110,
      camera.x+canvas.width/sceneScale*.5,
      camera.y+canvas.height/sceneScale*.48,
      Math.max(canvas.width/sceneScale,canvas.height/sceneScale)*.72
    );
    vignette.addColorStop(.55,'rgba(0,0,0,0)');
    vignette.addColorStop(1,'rgba(0,7,8,.30)');
    ctx.fillStyle=vignette;
    ctx.fillRect(camera.x,camera.y,canvas.width/sceneScale,canvas.height/sceneScale);
  }

  function loop(now){
    if(!lastFrameTime) lastFrameTime=now;
    const dt=Math.min(.04,Math.max(0,(now-lastFrameTime)/1000));
    lastFrameTime=now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function resetScene(){
    sceneTime=0;
    lastFrameTime=0;
    camera={x:0,y:0};
    landed=false;
    running=true;
    currentPanel=-1;
    chapterTimer=0;
    ambientParticles=[];
    impactParticles=[];
    ambientSpawnCarry=0;
    landingRevealTimer=0;
    landingPanelShown=false;
    landingPanel.classList.remove('is-visible');
    riderPoses=riders.map(rider => evaluateIntro(rider,0));
    sceneStatus.textContent='The automatic forest swing has started.';
  }

  function returnHome(){
    try{ sessionStorage.setItem('forestSwingReturn','1'); }catch(error){}
    window.location.href='index.html';
  }

  document.getElementById('replaySwing').addEventListener('click',resetScene);
  document.getElementById('returnHome').addEventListener('click',returnHome);
  window.addEventListener('keydown',event => {
    if(event.key==='Escape') returnHome();
    if((event.key==='r' || event.key==='R') && landed) resetScene();
  });

  const assets=[...panels.map(panel => panel.img),herImage,himImage];
  Promise.all(assets.map(image => image.decode().catch(() => {}))).then(() => {
    const missing=assets.filter(image => !image.naturalWidth);
    if(missing.length){
      loading.textContent='The forest could not finish loading.';
      sceneStatus.textContent='Some forest assets failed to load.';
      return;
    }
    resetScene();
    loading.classList.add('is-hidden');
    window.setTimeout(() => loading.remove(),650);
    requestAnimationFrame(loop);
  });
})();
