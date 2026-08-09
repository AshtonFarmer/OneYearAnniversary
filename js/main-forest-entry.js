// Entrance for the automatic forest-swing cutscene.
// This rectangle uses the exact home-map coordinates selected in debug mode.
(function(){
  'use strict';

  if(typeof locs === 'undefined' || typeof players === 'undefined') return;

  const forestEntrance = {
    x:1454,
    y:257,
    w:82,
    h:43
  };
  let enteringForest = false;

  function playerInsideEntrance(player){
    return !!player &&
      player.x >= forestEntrance.x &&
      player.x <= forestEntrance.x + forestEntrance.w &&
      player.y >= forestEntrance.y &&
      player.y <= forestEntrance.y + forestEntrance.h;
  }

  function playEntryThwip(){
    const AudioCtor=window.AudioContext || window.webkitAudioContext;
    if(!AudioCtor) return;

    try{
      const context=new AudioCtor();
      const now=context.currentTime+.004;
      const oscillator=context.createOscillator();
      const gain=context.createGain();
      oscillator.type='triangle';
      oscillator.frequency.setValueAtTime(980,now);
      oscillator.frequency.exponentialRampToValueAtTime(120,now+.2);
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(.28,now+.008);
      gain.gain.exponentialRampToValueAtTime(.0001,now+.21);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now+.22);
      window.setTimeout(() => context.close().catch(() => {}),420);
    } catch(error){}
  }

  function fadePageMusic(){
    const music=document.getElementById('bgm');
    if(!music || music.paused) return;
    const startVolume=music.volume;
    const startedAt=performance.now();

    function fade(now){
      const progress=Math.min(1,(now-startedAt)/430);
      music.volume=startVolume*(1-progress);
      if(progress<1){
        requestAnimationFrame(fade);
      } else {
        music.pause();
        music.volume=startVolume;
      }
    }

    requestAnimationFrame(fade);
  }

  function enterForest(){
    if(enteringForest) return;
    enteringForest=true;
    playEntryThwip();
    fadePageMusic();

    const fade=document.createElement('div');
    fade.setAttribute('aria-hidden','true');
    fade.style.position='fixed';
    fade.style.inset='0';
    fade.style.zIndex='100000';
    fade.style.pointerEvents='none';
    fade.style.opacity='0';
    fade.style.background='radial-gradient(circle at 88% 22%,rgba(34,86,62,.42),rgba(2,11,13,.98) 68%)';
    fade.style.transition='opacity 520ms ease-in';
    document.body.appendChild(fade);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => { fade.style.opacity='1'; });
    });

    window.setTimeout(() => {
      window.location.href='forest-swing.html';
    },620);
  }

  // Remove any older Forest Trail entry before installing the corrected doorway.
  for(let index=locs.length-1;index>=0;index--){
    if(locs[index] && locs[index].name === 'Forest Trail') locs.splice(index,1);
  }

  // The original location system uses circles. Add rectangle-aware distance
  // support so this doorway activates only inside the selected 82 x 43 box.
  if(typeof distPlayerLoc === 'function' && !window.__forestRectangleLocations){
    const originalDistPlayerLoc = distPlayerLoc;

    window.__forestRectangleLocations = true;
    window.distPlayerLoc = function(player,location){
      if(location && location.bounds){
        const bounds = location.bounds;
        const inside =
          player.x >= bounds.x &&
          player.x <= bounds.x + bounds.w &&
          player.y >= bounds.y &&
          player.y <= bounds.y + bounds.h;

        if(inside) return -1;

        const nearestX = Math.max(bounds.x,Math.min(player.x,bounds.x+bounds.w));
        const nearestY = Math.max(bounds.y,Math.min(player.y,bounds.y+bounds.h));
        return Math.hypot(player.x-nearestX,player.y-nearestY);
      }

      return originalDistPlayerLoc(player,location);
    };
  }

  locs.push({
    name:'Forest Trail',
    x:forestEntrance.x + forestEntrance.w/2,
    y:forestEntrance.y + forestEntrance.h/2,
    r:0,
    bounds:{...forestEntrance},
    page:'forest-swing.html',
    text:'Press E to enter the forest trail 🌲'
  });

  // Capture E before the main game performs its normal instant page change.
  // This keeps the exact doorway trigger while giving the forest a cinematic fade.
  window.addEventListener('keydown',event => {
    if(event.key.toLowerCase()!=='e' || event.repeat || enteringForest) return;
    if(!playerInsideEntrance(players.her) && !playerInsideEntrance(players.him)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if(typeof keys!=='undefined') keys.e=false;
    enterForest();
  },{capture:true});

  // Show the exact rectangle when G debug mode is enabled.
  if(typeof drawDebugZones === 'function' && !window.__forestRectangleDebug){
    const originalDrawDebugZones = drawDebugZones;

    window.__forestRectangleDebug = true;
    window.drawDebugZones = function(){
      originalDrawDebugZones();
      if(typeof debugMode === 'undefined' || !debugMode) return;

      ctx.save();
      drawDebugRect(forestEntrance,'rgba(0,255,90,0.28)');
      drawDebugText('Forest Trail',forestEntrance.x,forestEntrance.y);
      ctx.restore();
    };
  }

  // Returning from the cutscene puts both players just left of the doorway,
  // facing it, so either character can immediately walk back through.
  try{
    if(sessionStorage.getItem('forestSwingReturn') === '1'){
      sessionStorage.removeItem('forestSwingReturn');

      players.her.x = forestEntrance.x - 28;
      players.her.y = forestEntrance.y + 13;
      players.her.dir = 'right';
      players.her.frame = 0;

      players.him.x = forestEntrance.x - 28;
      players.him.y = forestEntrance.y + 32;
      players.him.dir = 'right';
      players.him.frame = 0;
    }
  } catch(error){}
})();
