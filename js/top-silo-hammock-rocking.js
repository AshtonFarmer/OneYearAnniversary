// Adds left-to-right rocking during both 10-second hammock poses.
(function(){
  try{
    if(!window.topSiloHammockEvent || typeof draw !== 'function' ||
       typeof players === 'undefined' || typeof ctx === 'undefined' ||
       typeof camera === 'undefined') return;

    const event = window.topSiloHammockEvent;
    const scene = event.state;
    const hammock = event.zones.hammock;
    const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
    let hideOriginalHammockActors = false;

    function isHammockSkin(image){
      const src = image && (image.currentSrc || image.src) ? String(image.currentSrc || image.src) : '';
      return src.includes('/her_skin.png') || src.includes('/him_skin.png') ||
        src.endsWith('her_skin.png') || src.endsWith('him_skin.png');
    }

    CanvasRenderingContext2D.prototype.drawImage = function(image, ...args){
      if(hideOriginalHammockActors && isHammockSkin(image)) return;
      return originalDrawImage.call(this, image, ...args);
    };

    function clamp(value, min, max){
      return Math.max(min, Math.min(max, value));
    }

    // Each pose lasts ten seconds:
    // 0-5 seconds = slower left/right ride.
    // 5-10 seconds = quicker left/right ride.
    function rockingOffset(localElapsed){
      const local = clamp(localElapsed, 0, 9999);
      const slowLength = 5000;
      const slowPeriod = 1900;
      const fastPeriod = 520;
      const startPhase = -Math.PI / 2; // Begin on the left side.

      if(local < slowLength){
        const phase = startPhase + (local / slowPeriod) * Math.PI * 2;
        return {
          x:Math.sin(phase) * 18,
          y:Math.cos(phase * 2) * 1.5
        };
      }

      const slowEndPhase = startPhase + (slowLength / slowPeriod) * Math.PI * 2;
      const fastElapsed = local - slowLength;
      const speedUpBlend = clamp(fastElapsed / 350, 0, 1);
      const amplitude = 18 + 12 * speedUpBlend;
      const phase = slowEndPhase + (fastElapsed / fastPeriod) * Math.PI * 2;
      return {
        x:Math.sin(phase) * amplitude,
        y:Math.cos(phase * 2) * 3
      };
    }

    function frame(now, rate){
      return Math.floor(now / rate) % 4;
    }

    function direction(now, offset){
      const dirs = ['right','down','left','up'];
      return dirs[Math.floor((now + (offset || 0)) / 2500) % 4];
    }

    function drawActor(image, who, dir, spriteFrame, x, y, options){
      if(!image || !image.complete || !image.naturalWidth) return;
      options = options || {};

      const player = who === 'him' ? players.him : players.her;
      const row = player.rows && player.rows[dir] !== undefined ? player.rows[dir] : 0;
      const cellW = image.naturalWidth / 4;
      const cellH = image.naturalHeight / 4;
      const size = options.size || 128;
      const sx = (spriteFrame % 4) * cellW;
      const sy = row * cellH;
      const mirror = who === 'him' && dir === 'left';

      ctx.save();
      ctx.translate(Math.round(x-camera.x), Math.round(y-camera.y));
      ctx.rotate(options.rotation || 0);
      if(mirror) ctx.scale(-1,1);

      const dx = -size/2;
      const dy = options.centered ? -size/2 : -size+10;
      originalDrawImage.call(ctx, image, sx, sy, cellW, cellH, dx, dy, size, size);
      ctx.restore();
    }

    function drawRockingPose(now, elapsed){
      const center = {
        x:hammock.x + hammock.w/2,
        y:hammock.y + hammock.h/2
      };
      const secondPose = elapsed >= 10000;
      const local = secondPose ? elapsed - 10000 : elapsed;
      const ride = rockingOffset(local);

      if(!secondPose){
        const bob = Math.cos(now/330)*2 + ride.y;
        drawActor(players.her.img,'her','down',frame(now,320),
          center.x+28+ride.x,center.y+bob,
          {rotation:Math.PI/2,centered:true,size:128});
        drawActor(players.him.img,'him',direction(now),frame(now,165),
          center.x-24+ride.x,hammock.y+hammock.h-10+bob,
          {size:128});
        return;
      }

      const bob = Math.cos(now/310)*2 + ride.y;
      drawActor(players.him.img,'him','down',frame(now,330),
        center.x+33+ride.x,center.y+2+bob,
        {rotation:Math.PI/2,centered:true,size:128});
      drawActor(players.her.img,'her',direction(now,1250),frame(now,165),
        center.x-15+ride.x,hammock.y+hammock.h-10+bob,
        {size:128});
    }

    const previousDraw = draw;
    draw = function(){
      const now = performance.now();
      const elapsed = scene.active ? now-scene.started : Infinity;
      const inRockingPose = scene.active && elapsed >= 0 && elapsed < 20000;

      hideOriginalHammockActors = inRockingPose;
      try{
        previousDraw();
      } finally {
        hideOriginalHammockActors = false;
      }

      if(inRockingPose) drawRockingPose(now,elapsed);
    };
  } catch(error){
    console.warn('top-silo hammock rocking failed',error);
  }
})();
