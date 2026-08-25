// Speed Force entrance beneath the Cherry Blossom Lake bridge.
(function(){
  'use strict';

  if(typeof locs==='undefined'||typeof players==='undefined'||typeof ctx==='undefined')return;

  const entrance={x:706,y:960,w:76,h:63};
  const center={x:entrance.x+entrance.w/2,y:entrance.y+entrance.h/2};
  const breachImage=new Image();
  breachImage.src='assets/sprites/speed_force_breach.png';
  let entering=false;

  function playerInside(player){
    return !!player&&
      player.x>=entrance.x&&player.x<=entrance.x+entrance.w&&
      player.y>=entrance.y&&player.y<=entrance.y+entrance.h;
  }

  function playerNear(player,radius){
    if(!player)return false;
    return Math.hypot(player.x-center.x,player.y-center.y)<radius;
  }

  // main-forest-entry normally installs rectangle-aware locations first. Keep
  // this entrance self-contained in case that optional scene is ever removed.
  if(!window.__forestRectangleLocations&&!window.__speedForceRectangleLocations){
    const originalDistPlayerLoc=distPlayerLoc;
    window.__speedForceRectangleLocations=true;
    window.distPlayerLoc=function(player,location){
      if(location&&location.bounds){
        const bounds=location.bounds;
        const inside=player.x>=bounds.x&&player.x<=bounds.x+bounds.w&&
          player.y>=bounds.y&&player.y<=bounds.y+bounds.h;
        if(inside)return -1;
        const nearestX=Math.max(bounds.x,Math.min(player.x,bounds.x+bounds.w));
        const nearestY=Math.max(bounds.y,Math.min(player.y,bounds.y+bounds.h));
        return Math.hypot(player.x-nearestX,player.y-nearestY);
      }
      return originalDistPlayerLoc(player,location);
    };
  }

  locs.push({
    name:'Speed Force Entrance',
    x:center.x,
    y:center.y,
    r:0,
    bounds:{...entrance},
    page:'speed-force-run.html',
    text:'Press E to enter the Speed Force ⚡'
  });

  function drawBreachFrame(frame,alpha,width,height){
    if(!breachImage.complete||!breachImage.naturalWidth)return;
    const safe=Math.max(0,Math.min(15.999,frame));
    const first=Math.floor(safe);
    const second=Math.min(15,first+1);
    const blend=safe-first;
    const screenX=center.x-camera.x;
    const screenY=center.y-camera.y-22;

    function draw(index,frameAlpha){
      if(frameAlpha<=.01)return;
      const col=index%4;
      const row=Math.floor(index/4);
      ctx.globalAlpha=alpha*frameAlpha;
      ctx.drawImage(
        breachImage,col*256,row*256,256,256,
        screenX-width/2,screenY-height/2,width,height
      );
    }

    draw(first,1-blend);
    draw(second,blend);
  }

  function drawEntrance(){
    const nearby=playerNear(players.her,120)||playerNear(players.him,120);
    const time=performance.now()/1000;
    const pulse=(Math.sin(time*4.6)+1)/2;
    const alpha=nearby ? .96 : .36;
    const frame=nearby?9.1+pulse*1.05:8.35+pulse*.42;
    const width=nearby?126+pulse*8:104+pulse*5;
    const height=nearby?156+pulse*9:132+pulse*6;

    ctx.save();
    ctx.imageSmoothingEnabled=false;
    ctx.globalCompositeOperation='screen';
    ctx.shadowColor=nearby?'#6deaff':'#58bfff';
    ctx.shadowBlur=nearby?34:17;
    drawBreachFrame(frame,alpha,width,height);

    const sparkCount=nearby?7:3;
    ctx.fillStyle='#d9fbff';
    for(let index=0;index<sparkCount;index++){
      const phase=time*(1.2+index*.11)+index*1.73;
      const radius=nearby?46+index*3:38+index*2;
      const x=center.x-camera.x+Math.cos(phase)*radius;
      const y=center.y-camera.y-22+Math.sin(phase*1.31)*radius*.72;
      ctx.globalAlpha=alpha*(.32+(index%3)*.17);
      ctx.fillRect(Math.round(x),Math.round(y),index%2?2:3,index%2?5:3);
    }
    ctx.restore();
  }

  // drawDebugZones is rendered after the map but before the players, which
  // keeps the breach behind both sprites while preserving every debug overlay.
  if(typeof drawDebugZones==='function'&&!window.__speedForceEntranceDraw){
    const originalDrawDebugZones=drawDebugZones;
    window.__speedForceEntranceDraw=true;
    window.drawDebugZones=function(){
      drawEntrance();
      originalDrawDebugZones();
      if(typeof debugMode!=='undefined'&&debugMode){
        ctx.save();
        drawDebugRect(entrance,'rgba(0,255,90,0.28)');
        ctx.restore();
      }
    };
  }

  function playBreachSound(){
    const AudioCtor=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtor)return;
    try{
      const audio=new AudioCtor();
      const now=audio.currentTime+.005;
      const master=audio.createGain();
      master.gain.setValueAtTime(.0001,now);
      master.gain.exponentialRampToValueAtTime(.3,now+.025);
      master.gain.exponentialRampToValueAtTime(.0001,now+.58);
      master.connect(audio.destination);

      const low=audio.createOscillator();
      low.type='sawtooth';
      low.frequency.setValueAtTime(92,now);
      low.frequency.exponentialRampToValueAtTime(34,now+.5);
      low.connect(master);low.start(now);low.stop(now+.58);

      const high=audio.createOscillator();
      const highGain=audio.createGain();
      high.type='triangle';
      high.frequency.setValueAtTime(1280,now);
      high.frequency.exponentialRampToValueAtTime(180,now+.34);
      highGain.gain.setValueAtTime(.18,now);
      highGain.gain.exponentialRampToValueAtTime(.0001,now+.38);
      high.connect(highGain);highGain.connect(master);high.start(now);high.stop(now+.4);
      window.setTimeout(()=>audio.close().catch(()=>{}),850);
    }catch(error){}
  }

  function enterSpeedForce(){
    if(entering)return;
    entering=true;
    if(typeof keys!=='undefined')Object.keys(keys).forEach(key=>{keys[key]=false;});
    try{sessionStorage.setItem('speedForceEntry','cherry-blossom-bridge');}catch(error){}
    playBreachSound();

    const music=document.getElementById('bgm');
    if(music&&!music.paused){
      const initial=music.volume;
      const started=performance.now();
      const fade=now=>{
        const progress=Math.min(1,(now-started)/420);
        music.volume=initial*(1-progress);
        if(progress<1)requestAnimationFrame(fade);
        else{music.pause();music.volume=initial;}
      };
      requestAnimationFrame(fade);
    }

    const flash=document.createElement('div');
    flash.setAttribute('aria-hidden','true');
    Object.assign(flash.style,{
      position:'fixed',inset:'0',zIndex:'100000',pointerEvents:'none',opacity:'0',
      background:'radial-gradient(circle at 50% 88%,#ffffff 0,#8af2ff 8%,rgba(32,108,255,.78) 20%,rgba(2,8,20,.98) 68%)',
      transition:'opacity 480ms cubic-bezier(.18,.76,.3,1)'
    });
    document.body.appendChild(flash);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{flash.style.opacity='1';}));
    window.setTimeout(()=>{window.location.href='speed-force-run.html';},560);
  }

  window.addEventListener('keydown',event=>{
    if(event.key.toLowerCase()!=='e'||event.repeat||entering)return;
    if(!playerInside(players.her)&&!playerInside(players.him))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    enterSpeedForce();
  },{capture:true});
})();
