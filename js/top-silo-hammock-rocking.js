// Controls the movement during both 10-second hammock poses.
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

    // Every pose lasts ten seconds.
    // First five seconds move slowly. The final five move faster.
    function movement(localElapsed, slowAmount, fastAmount){
      const local = clamp(localElapsed, 0, 9999);
      const slowLength = 5000;
      const slowPeriod = 1900;
      const fastPeriod = 520;
      const startPhase = -Math.PI / 2;

      if(local < slowLength){
        const phase = startPhase + (local / slowPeriod) * Math.PI * 2;
        return Math.sin(phase) * slowAmount;
      }

      const slowEndPhase = startPhase + (slowLength / slowPeriod) * Math.PI * 2;
      const fastElapsed = local - slowLength;
      const speedUpBlend = clamp(fastElapsed / 350, 0, 1);
      const amount = slowAmount + (fastAmount - slowAmount) * speedUpBlend;
      const phase = slowEndPhase + (fastElapsed / fastPeriod) * Math.PI * 2;
      return Math.sin(phase) * amount;
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

    function drawHammockPose(elapsed){
      const center = {
        x:hammock.x + hammock.w/2,
        y:hammock.y + hammock.h/2
      };
      const secondPose = elapsed >= 10000;
      const local = secondPose ? elapsed - 10000 : elapsed;

      if(!secondPose){
        // First position: she stays lying still. Only he moves left and right.
        const himX = movement(local, 18, 30);
        drawActor(players.her.img,'her','down',0,
          center.x+28,center.y,
          {rotation:Math.PI/2,centered:true,size:128});
        drawActor(players.him.img,'him','right',0,
          center.x-24+himX,hammock.y+hammock.h-18,
          {size:128});
        return;
      }

      // Second position: he stays lying still. Only she moves slightly up and down.
      const herY = movement(local, 3, 7);
      drawActor(players.him.img,'him','down',0,
        center.x+33,center.y+2,
        {rotation:Math.PI/2,centered:true,size:128});
      drawActor(players.her.img,'her','right',0,
        center.x-15,hammock.y+hammock.h-10+herY,
        {size:128});
    }

    const previousDraw = draw;
    draw = function(){
      const now = performance.now();
      const elapsed = scene.active ? now-scene.started : Infinity;
      const inHammockPose = scene.active && elapsed >= 0 && elapsed < 20000;

      hideOriginalHammockActors = inHammockPose;
      try{
        previousDraw();
      } finally {
        hideOriginalHammockActors = false;
      }

      if(inHammockPose) drawHammockPose(elapsed);
    };
  } catch(error){
    console.warn('top-silo hammock movement failed',error);
  }
})();