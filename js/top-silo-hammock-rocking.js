// Controls the movement during both 10-second hammock poses.
(function(){
  try{
    if(!window.topSiloHammockEvent || typeof draw !== 'function' ||
       typeof players === 'undefined' || typeof ctx === 'undefined' ||
       typeof camera === 'undefined') return;

    const event = window.topSiloHammockEvent;
    const scene = event.state;
    const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
    const hipZone = {x:638, y:492, w:7, h:1};
    const hipTarget = {
      x:hipZone.x + hipZone.w / 2,
      y:hipZone.y + hipZone.h / 2
    };
    const boundsCache = new Map();
    let hideOriginalHammockActors = false;

    event.zones.hip = hipZone;

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

    function getVisibleBounds(image, sx, sy, sw, sh){
      const key = (image.currentSrc || image.src || 'sprite') + ':' + sx + ':' + sy + ':' + sw + ':' + sh;
      if(boundsCache.has(key)) return boundsCache.get(key);

      try{
        const sample = document.createElement('canvas');
        sample.width = sw;
        sample.height = sh;
        const sampleCtx = sample.getContext('2d', {willReadFrequently:true});
        sampleCtx.clearRect(0,0,sw,sh);
        originalDrawImage.call(sampleCtx,image,sx,sy,sw,sh,0,0,sw,sh);
        const pixels = sampleCtx.getImageData(0,0,sw,sh).data;
        let minX = sw;
        let minY = sh;
        let maxX = -1;
        let maxY = -1;

        for(let y=0;y<sh;y++){
          for(let x=0;x<sw;x++){
            if(pixels[(y*sw+x)*4+3] <= 10) continue;
            if(x < minX) minX = x;
            if(y < minY) minY = y;
            if(x > maxX) maxX = x;
            if(y > maxY) maxY = y;
          }
        }

        const result = maxX < 0
          ? {x:0,y:0,w:sw,h:sh}
          : {x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
        boundsCache.set(key,result);
        return result;
      } catch(error){
        const fallback = {x:0,y:0,w:sw,h:sh};
        boundsCache.set(key,fallback);
        return fallback;
      }
    }

    function drawActorAtHip(image, who, dir, spriteFrame, x, y, options){
      if(!image || !image.complete || !image.naturalWidth) return;
      options = options || {};

      const player = who === 'him' ? players.him : players.her;
      const row = player.rows && player.rows[dir] !== undefined ? player.rows[dir] : 0;
      const cellW = image.naturalWidth / 4;
      const cellH = image.naturalHeight / 4;
      const size = options.size || 128;
      const sx = (spriteFrame % 4) * cellW;
      const sy = row * cellH;
      const visible = getVisibleBounds(image,sx,sy,cellW,cellH);

      const hipRatioY = who === 'him' ? .62 : .61;
      const sourceHipX = visible.x + visible.w * .5 + (options.sourceHipOffsetX || 0) * cellW;
      const sourceHipY = visible.y + visible.h * hipRatioY + (options.sourceHipOffsetY || 0) * cellH;
      const drawX = -(sourceHipX / cellW) * size;
      const drawY = -(sourceHipY / cellH) * size;
      const mirror = who === 'him' && dir === 'left';

      ctx.save();
      ctx.translate(Math.round(x-camera.x),Math.round(y-camera.y));
      ctx.rotate(options.rotation || 0);
      ctx.scale((mirror ? -1 : 1) * (options.scaleX || 1),options.scaleY || 1);
      originalDrawImage.call(ctx,image,sx,sy,cellW,cellH,drawX,drawY,size,size);
      ctx.restore();
    }

    function drawHammockPose(elapsed){
      const secondPose = elapsed >= 10000;
      const local = secondPose ? elapsed - 10000 : elapsed;

      if(!secondPose){
        const himLean = movement(local,.055,.15);
        drawActorAtHip(players.her.img,'her','down',0,
          hipTarget.x,hipTarget.y,
          {rotation:Math.PI/2,size:128});
        drawActorAtHip(players.him.img,'him','right',0,
          hipTarget.x,hipTarget.y,
          {rotation:himLean,size:128,sourceHipOffsetX:.085,sourceHipOffsetY:.065});
        return;
      }

      const herStretch = movement(local,.018,.045);
      drawActorAtHip(players.him.img,'him','down',0,
        hipTarget.x,hipTarget.y,
        {rotation:Math.PI/2,size:128});
      drawActorAtHip(players.her.img,'her','right',0,
        hipTarget.x,hipTarget.y,
        {scaleY:1+herStretch,size:128,sourceHipOffsetX:.085,sourceHipOffsetY:.065});
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

      if(typeof debugMode !== 'undefined' && debugMode){
        ctx.save();
        ctx.fillStyle = 'rgba(80,255,170,.45)';
        ctx.strokeStyle = '#50ffaa';
        ctx.lineWidth = 2;
        ctx.fillRect(hipZone.x-camera.x,hipZone.y-camera.y,hipZone.w,Math.max(1,hipZone.h));
        ctx.strokeRect(hipZone.x-camera.x,hipZone.y-camera.y,hipZone.w,Math.max(1,hipZone.h));
        ctx.fillStyle = '#ffffff';
        ctx.font = '13px monospace';
        ctx.fillText('shared hip point',hipZone.x-camera.x-45,hipZone.y-camera.y-8);
        ctx.restore();
      }
    };
  } catch(error){
    console.warn('top-silo hammock movement failed',error);
  }
})();