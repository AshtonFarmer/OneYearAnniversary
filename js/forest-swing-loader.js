// Static HD pixel-comic loading splash for the forest swing.
// The character artwork and backdrop never animate; only the real loading
// percentage and web progress strand move.
(function(){
  'use strict';

  const overlay=document.getElementById('loading');
  const canvas=document.getElementById('spiderLoaderCanvas');
  const message=document.getElementById('loaderMessage');
  const percent=document.getElementById('loaderPercent');
  if(!overlay || !canvas) return;

  const context=canvas.getContext('2d',{alpha:false});
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const artwork={him:new Image(),her:new Image()};

  const state={
    startedAt:performance.now(),
    targetProgress:.035,
    shownProgress:0,
    completionRequested:false,
    finishing:false,
    failed:false,
    finishResolve:null,
    animationFrame:0,
    width:0,
    height:0,
    dpr:1
  };

  const MINIMUM_SCREEN_TIME=reducedMotion ? 650 : 2350;

  function clamp(value,min,max){
    return Math.max(min,Math.min(max,value));
  }

  // The forest scene uses its own procedural theme. Remove the old global
  // music notice so it cannot cover this splash; a tap still reaches the
  // scene's normal pointer handler and unlocks audio on iPhone.
  function removeLegacyMusicNote(){
    const note=document.getElementById('musicNote');
    if(note) note.remove();
  }
  const musicNoteObserver=new MutationObserver(removeLegacyMusicNote);
  musicNoteObserver.observe(document.body,{childList:true});
  removeLegacyMusicNote();

  function resize(){
    const width=Math.max(1,window.innerWidth);
    const height=Math.max(1,window.innerHeight);
    const dpr=Math.min(3,window.devicePixelRatio || 1);
    if(state.width===width && state.height===height && state.dpr===dpr) return false;
    state.width=width;
    state.height=height;
    state.dpr=dpr;
    canvas.width=Math.round(width*dpr);
    canvas.height=Math.round(height*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
    context.imageSmoothingEnabled=true;
    context.imageSmoothingQuality='high';
    return true;
  }

  function drawWebFan(anchorX,anchorY,radiusX,radiusY,alpha,mirror){
    context.save();
    context.strokeStyle=`rgba(239,248,255,${alpha})`;
    context.lineWidth=1.35;
    const direction=mirror ? -1 : 1;
    for(let spoke=0;spoke<9;spoke++){
      const angle=(-.64+spoke*.16)*direction;
      context.beginPath();
      context.moveTo(anchorX,anchorY);
      context.lineTo(
        anchorX+Math.cos(angle)*radiusX*direction,
        anchorY+Math.sin(angle)*radiusY+radiusY*.52
      );
      context.stroke();
    }
    for(let ring=1;ring<=6;ring++){
      const scale=ring/6;
      context.beginPath();
      for(let point=0;point<=24;point++){
        const angle=(-.64+point*(1.28/24))*direction;
        const x=anchorX+Math.cos(angle)*radiusX*scale*direction;
        const y=anchorY+Math.sin(angle)*radiusY*scale+radiusY*.52*scale;
        if(point===0) context.moveTo(x,y); else context.lineTo(x,y);
      }
      context.stroke();
    }
    context.restore();
  }

  function drawCenterWeb(){
    const width=state.width;
    const height=state.height;
    const centerX=width*.5;
    const centerY=height*.455;
    const radius=Math.min(width*.48,height*.25);
    context.save();
    context.translate(centerX,centerY);
    context.strokeStyle='rgba(211,234,255,.105)';
    context.lineWidth=1;
    for(let spoke=0;spoke<12;spoke++){
      const angle=spoke*Math.PI/6;
      context.beginPath();
      context.moveTo(0,0);
      context.lineTo(Math.cos(angle)*radius,Math.sin(angle)*radius);
      context.stroke();
    }
    for(let ring=1;ring<=5;ring++){
      const ringRadius=radius*ring/5;
      context.beginPath();
      for(let point=0;point<=48;point++){
        const angle=point*Math.PI*2/48;
        const scallop=1-.045*Math.sin(angle*12);
        const x=Math.cos(angle)*ringRadius*scallop;
        const y=Math.sin(angle)*ringRadius*scallop;
        if(point===0) context.moveTo(x,y); else context.lineTo(x,y);
      }
      context.stroke();
    }
    context.restore();
  }

  function drawBackdrop(){
    const width=state.width;
    const height=state.height;
    const base=context.createLinearGradient(0,0,width,height);
    base.addColorStop(0,'#101a36');
    base.addColorStop(.42,'#070b1a');
    base.addColorStop(.72,'#081124');
    base.addColorStop(1,'#010309');
    context.fillStyle=base;
    context.fillRect(0,0,width,height);

    context.save();
    const redPanel=context.createLinearGradient(0,0,width*.48,height);
    redPanel.addColorStop(0,'#f13c54');
    redPanel.addColorStop(.5,'#a90f2b');
    redPanel.addColorStop(1,'#4a0718');
    context.fillStyle=redPanel;
    context.beginPath();
    context.moveTo(-width*.24,0);
    context.lineTo(width*.47,0);
    context.lineTo(width*.08,height);
    context.lineTo(-width*.62,height);
    context.closePath();
    context.fill();

    const bluePanel=context.createLinearGradient(width,0,width*.31,height);
    bluePanel.addColorStop(0,'#2584df');
    bluePanel.addColorStop(.5,'#0d4c94');
    bluePanel.addColorStop(1,'#041c47');
    context.fillStyle=bluePanel;
    context.beginPath();
    context.moveTo(width*.72,0);
    context.lineTo(width*1.22,0);
    context.lineTo(width*.82,height);
    context.lineTo(width*.3,height);
    context.closePath();
    context.fill();
    context.restore();

    // Static high-density halftone texture.
    const gap=clamp(Math.round(Math.min(width,height)/45),9,16);
    context.save();
    context.fillStyle='rgba(255,255,255,.105)';
    for(let y=-gap;y<height+gap;y+=gap){
      for(let x=-gap;x<width+gap;x+=gap){
        const stagger=((y/gap)&1) ? gap*.5 : 0;
        const dot=1+(((x+y)/gap)%3===0 ? .3 : 0);
        context.beginPath();
        context.arc(x+stagger,y,dot,0,Math.PI*2);
        context.fill();
      }
    }
    context.restore();

    drawCenterWeb();
    drawWebFan(0,height*.1,width*.72,height*.58,.22);
    drawWebFan(width,height*.075,width*.69,height*.56,.2,true);

    // Inked panel seams and fixed light streaks.
    context.save();
    context.lineCap='round';
    context.strokeStyle='rgba(196,228,255,.45)';
    context.lineWidth=1.5;
    context.shadowColor='rgba(72,157,255,.5)';
    context.shadowBlur=9;
    context.beginPath();
    context.moveTo(width*.47,0);
    context.lineTo(width*.08,height);
    context.moveTo(width*.72,0);
    context.lineTo(width*.3,height);
    context.stroke();
    context.restore();

    context.save();
    context.globalAlpha=.11;
    context.strokeStyle='#fff';
    context.lineWidth=1.5;
    for(let index=-2;index<8;index++){
      const x=index*width*.22;
      context.beginPath();
      context.moveTo(x,height*.12);
      context.lineTo(x-width*.38,height*.88);
      context.stroke();
    }
    context.restore();

    const vignette=context.createRadialGradient(
      width*.5,height*.45,Math.min(width,height)*.08,
      width*.5,height*.46,Math.max(width,height)*.72
    );
    vignette.addColorStop(0,'rgba(0,0,0,0)');
    vignette.addColorStop(.68,'rgba(0,0,0,.06)');
    vignette.addColorStop(1,'rgba(0,0,0,.55)');
    context.fillStyle=vignette;
    context.fillRect(0,0,width,height);
  }

  function getRiderPose(kind){
    const width=state.width;
    const height=state.height;
    const portrait=height>width*1.12;
    const size=portrait
      ? clamp(width*.88,286,370)
      : clamp(height*.62,210,390);
    if(kind==='him'){
      return {
        x:portrait ? width*.64 : width*.64,
        y:portrait ? height*.315 : height*.44,
        size,
        angle:portrait ? -.035 : -.02,
        anchorX:portrait ? width*.075 : width*.18,
        anchorY:height*.045,
        handOffsetX:-.09,
        handOffsetY:-.285
      };
    }
    return {
      x:portrait ? width*.365 : width*.37,
      y:portrait ? height*.595 : height*.56,
      size,
      angle:portrait ? .04 : .025,
      anchorX:portrait ? width*.94 : width*.82,
      anchorY:height*.07,
      handOffsetX:-.02,
      handOffsetY:-.39
    };
  }

  function drawRiderAura(pose,kind){
    const radius=pose.size*.57;
    const glow=context.createRadialGradient(pose.x,pose.y,0,pose.x,pose.y,radius);
    if(kind==='him'){
      glow.addColorStop(0,'rgba(255,62,82,.24)');
      glow.addColorStop(.46,'rgba(59,142,255,.12)');
    }else{
      glow.addColorStop(0,'rgba(255,162,64,.19)');
      glow.addColorStop(.46,'rgba(56,132,245,.11)');
    }
    glow.addColorStop(1,'rgba(0,0,0,0)');
    context.save();
    context.fillStyle=glow;
    context.fillRect(pose.x-radius,pose.y-radius,radius*2,radius*2);
    context.restore();
  }

  function drawActiveWeb(pose,kind){
    const handX=pose.x+pose.size*pose.handOffsetX;
    const handY=pose.y+pose.size*pose.handOffsetY;
    const controlX=(pose.anchorX+handX)*.5+(kind==='him'?32:-32);
    const controlY=(pose.anchorY+handY)*.39;
    context.save();
    context.strokeStyle='rgba(255,255,255,.88)';
    context.lineWidth=2.8;
    context.shadowColor='rgba(255,255,255,.9)';
    context.shadowBlur=6;
    context.beginPath();
    context.moveTo(pose.anchorX,pose.anchorY);
    context.quadraticCurveTo(controlX,controlY,handX,handY);
    context.stroke();

    context.globalAlpha=.62;
    context.lineWidth=1;
    for(let offset=-1;offset<=1;offset+=2){
      context.beginPath();
      context.moveTo(pose.anchorX+offset*3,pose.anchorY);
      context.quadraticCurveTo(controlX+offset*5,controlY,handX+offset*4,handY);
      context.stroke();
    }
    context.restore();
  }

  function drawRider(kind,pose){
    const image=artwork[kind];
    if(!image.complete || !image.naturalWidth) return;
    context.save();
    context.translate(Math.round(pose.x),Math.round(pose.y));
    context.rotate(pose.angle);
    context.shadowColor=kind==='him' ? 'rgba(255,48,72,.48)' : 'rgba(53,135,255,.5)';
    context.shadowBlur=18;
    context.shadowOffsetY=7;
    context.imageSmoothingEnabled=true;
    context.imageSmoothingQuality='high';
    context.drawImage(image,-pose.size/2,-pose.size/2,pose.size,pose.size);
    context.restore();
  }

  function drawStaticSplash(){
    resize();
    drawBackdrop();
    const him=getRiderPose('him');
    const her=getRiderPose('her');
    drawRiderAura(him,'him');
    drawRiderAura(her,'her');
    drawActiveWeb(him,'him');
    drawActiveWeb(her,'her');
    drawRider('him',him);
    drawRider('her',her);
  }

  function updateProgressDisplay(){
    const easedTarget=state.completionRequested ? 1 : Math.min(.94,state.targetProgress);
    const difference=easedTarget-state.shownProgress;
    state.shownProgress+=difference*(state.completionRequested ? .15 : .075);
    if(Math.abs(difference)<.001) state.shownProgress=easedTarget;
    const shown=clamp(state.shownProgress,0,1);
    overlay.style.setProperty('--loader-progress',shown.toFixed(4));
    if(percent) percent.textContent=`${Math.round(shown*100)}%`;
  }

  function beginFinish(){
    if(state.finishing || state.failed) return;
    state.finishing=true;
    overlay.classList.add('is-finishing');
    window.setTimeout(() => overlay.classList.add('is-hidden'),360);
    window.setTimeout(() => {
      cancelAnimationFrame(state.animationFrame);
      musicNoteObserver.disconnect();
      removeLegacyMusicNote();
      overlay.remove();
      if(state.finishResolve) state.finishResolve();
    },980);
  }

  function loop(time){
    updateProgressDisplay();
    const minimumMet=time-state.startedAt>=MINIMUM_SCREEN_TIME;
    if(state.completionRequested && state.shownProgress>=.995 && minimumMet) beginFinish();
    state.animationFrame=requestAnimationFrame(loop);
  }

  function setProgress(progress){
    if(state.failed || state.completionRequested) return;
    state.targetProgress=Math.max(state.targetProgress,clamp(Number(progress)||0,0,.94));
  }

  function complete(){
    if(state.failed) return Promise.resolve();
    state.targetProgress=1;
    state.completionRequested=true;
    return new Promise(resolve => { state.finishResolve=resolve; });
  }

  function fail(text){
    state.failed=true;
    state.targetProgress=state.shownProgress;
    if(message) message.textContent=text || 'THE FOREST COULD NOT FINISH LOADING.';
    if(percent) percent.textContent='!';
  }

  artwork.him.addEventListener('load',drawStaticSplash,{once:true});
  artwork.her.addEventListener('load',drawStaticSplash,{once:true});
  artwork.him.src='assets/sprites/him_spidey_loader_static_hd.png';
  artwork.her.src='assets/sprites/her_spidey_loader_static_hd.png';

  window.ForestSwingLoader={setProgress,complete,fail};
  window.addEventListener('resize',drawStaticSplash,{passive:true});
  drawStaticSplash();
  state.animationFrame=requestAnimationFrame(loop);
})();
