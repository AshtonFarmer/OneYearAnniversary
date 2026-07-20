// Keeps the hammock cuddle side-by-side, adds blush, and gives the pair a gentle shared hammock bounce.
(function(){
  try{
    if(!window.topSiloHammockEvent || !window.topSiloHammockPostlude ||
       typeof update !== 'function' || typeof draw !== 'function' ||
       typeof players === 'undefined' || typeof ctx === 'undefined' ||
       typeof camera === 'undefined') return;

    const event = window.topSiloHammockEvent;
    const scene = event.state;
    const post = window.topSiloHammockPostlude;
    const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
    const boundsCache = new Map();
    const blankAtlas = document.createElement('canvas');
    blankAtlas.width = 1024;
    blankAtlas.height = 1024;

    const settleStartsAt = 1200 + 2100 + 2800;
    const settleLength = 900;

    function clamp(value,min,max){
      return Math.max(min,Math.min(max,value));
    }

    function ease(value){
      const t = clamp(value,0,1);
      return t < .5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;
    }

    function hipTarget(){
      const zone = event.zones.hip;
      return {x:zone.x+zone.w/2,y:zone.y+zone.h/2};
    }

    // The hammock runs horizontally, so both characters share a slow vertical bounce.
    function hammockDrift(now){
      return {
        x:Math.sin(now/1550)*1.5,
        y:Math.sin(now/920)*3.2 + Math.sin(now/2100)*.8
      };
    }

    function cuddlePositions(now){
      const hip = hipTarget();
      const drift = hammockDrift(now);
      const breathe = Math.sin(now/560);
      return {
        hip,
        drift,
        him:{
          x:hip.x-7+drift.x,
          y:hip.y+22+drift.y+breathe*.8
        },
        her:{
          x:hip.x+7+drift.x,
          y:hip.y-21+drift.y-breathe*.45
        }
      };
    }

    function getVisibleBounds(image,sx,sy,sw,sh){
      const key = (image.currentSrc || image.src || 'sprite')+':'+sx+':'+sy+':'+sw+':'+sh;
      if(boundsCache.has(key)) return boundsCache.get(key);

      try{
        const sample = document.createElement('canvas');
        sample.width = sw;
        sample.height = sh;
        const sampleCtx = sample.getContext('2d',{willReadFrequently:true});
        sampleCtx.clearRect(0,0,sw,sh);
        originalDrawImage.call(sampleCtx,image,sx,sy,sw,sh,0,0,sw,sh);
        const pixels = sampleCtx.getImageData(0,0,sw,sh).data;
        let minX=sw,minY=sh,maxX=-1,maxY=-1;

        for(let y=0;y<sh;y++){
          for(let x=0;x<sw;x++){
            if(pixels[(y*sw+x)*4+3] <= 10) continue;
            if(x<minX) minX=x;
            if(y<minY) minY=y;
            if(x>maxX) maxX=x;
            if(y>maxY) maxY=y;
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

    function drawPixelBlush(alpha){
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#f29ab9';
      ctx.shadowColor = '#ffb4cc';
      ctx.shadowBlur = 2;

      // These are local face coordinates, so the blush rotates with the lying sprite.
      ctx.fillRect(-12,-34,5,3);
      ctx.fillRect(-10,-31,4,2);
      ctx.fillRect(7,-34,5,3);
      ctx.fillRect(7,-31,4,2);
      ctx.restore();
    }

    function drawActorAtHip(image,who,dir,spriteFrame,x,y,options){
      if(!image || !image.complete || !image.naturalWidth) return;
      options = options || {};
      const player = who === 'her' ? players.her : players.him;
      const row = player.rows && player.rows[dir] !== undefined ? player.rows[dir] : 0;
      const cellW = image.naturalWidth/4;
      const cellH = image.naturalHeight/4;
      const size = options.size || 128;
      const sx = (spriteFrame%4)*cellW;
      const sy = row*cellH;
      const visible = getVisibleBounds(image,sx,sy,cellW,cellH);
      const hipRatioY = who === 'him' ? .62 : .61;
      const sourceHipX = visible.x+visible.w*.5+(options.sourceHipOffsetX || 0)*cellW;
      const sourceHipY = visible.y+visible.h*hipRatioY+(options.sourceHipOffsetY || 0)*cellH;
      const drawX = -(sourceHipX/cellW)*size;
      const drawY = -(sourceHipY/cellH)*size;
      const mirror = who === 'him' && dir === 'left';

      ctx.save();
      ctx.globalAlpha = options.alpha === undefined ? 1 : options.alpha;
      ctx.translate(Math.round(x-camera.x),Math.round(y-camera.y));
      ctx.rotate(options.rotation || 0);
      ctx.scale((mirror ? -1 : 1)*(options.scaleX || 1),options.scaleY || 1);
      originalDrawImage.call(ctx,image,sx,sy,cellW,cellH,drawX,drawY,size,size);
      if(options.blush) drawPixelBlush(options.blush);
      ctx.restore();
    }

    function drawHeart(x,y,size,alpha){
      const pixels = ['0110110','1111111','1111111','0111110','0011100','0001000'];
      const unit = Math.max(1,Math.round(size/7));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ff86bd';
      ctx.shadowColor = '#ff9dcc';
      ctx.shadowBlur = unit*3;
      pixels.forEach((line,row) => {
        [...line].forEach((bit,col) => {
          if(bit === '1') ctx.fillRect(x+col*unit,y+row*unit,unit,unit);
        });
      });
      ctx.restore();
    }

    function drawSoftGlow(worldX,worldY,strength){
      const x = worldX-camera.x;
      const y = worldY-camera.y;
      ctx.save();
      ctx.fillStyle = `rgba(12,0,18,${.12+.20*strength})`;
      ctx.fillRect(0,0,canvas.width,canvas.height);
      const glow = ctx.createRadialGradient(x,y,10,x,y,235);
      glow.addColorStop(0,`rgba(255,130,195,${.15+.22*strength})`);
      glow.addColorStop(.55,`rgba(255,105,180,${.06+.12*strength})`);
      glow.addColorStop(1,'rgba(255,105,180,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x-250,y-250,500,500);
      ctx.restore();
    }

    function drawBlanket(now,amount,positions){
      const hip = positions.hip;
      const drift = positions.drift;
      const lift = Math.round((1-ease(amount))*56);
      const breathe = Math.sin(now/560)*1.3;
      const x = Math.round(hip.x-112-camera.x+drift.x);
      const y = Math.round(hip.y-55-camera.y+drift.y+lift+breathe);
      const w = 158;
      const h = 112;

      ctx.save();
      ctx.globalAlpha = clamp(amount,0,1);
      ctx.fillStyle = '#3e2639';
      ctx.fillRect(x+8,y-5,w-16,h+10);
      ctx.fillRect(x,y+6,w,h-12);
      ctx.fillStyle = '#87506f';
      ctx.fillRect(x+7,y,w-14,h);
      ctx.fillRect(x+2,y+9,w-4,h-18);
      ctx.fillStyle = '#a96b87';
      ctx.fillRect(x+8,y+9,w-16,8);
      ctx.fillRect(x+8,y+h-20,w-16,7);
      ctx.fillStyle = '#f0b6cc';
      for(let i=0;i<7;i++){
        const px = x+18+i*19;
        ctx.fillRect(px,y+34,5,5);
        ctx.fillRect(px-3,y+37,11,4);
        ctx.fillRect(px,y+41,5,5);
      }
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      ctx.fillRect(x+10,y+4,w-20,3);
      ctx.restore();
    }

    function drawCustomCuddle(now,amount){
      const positions = cuddlePositions(now);
      const t = clamp(amount,0,1);
      const blush = (.66+Math.sin(now/900)*.06)*t;

      drawSoftGlow(positions.hip.x,positions.hip.y-18,.82);

      // They lie parallel, beside one another instead of occupying the same body space.
      drawActorAtHip(players.him.img,'him','down',0,positions.him.x,positions.him.y,{
        rotation:Math.PI/2,size:128,alpha:t,blush
      });
      drawActorAtHip(players.her.img,'her','down',0,positions.her.x,positions.her.y,{
        rotation:Math.PI/2,size:128,alpha:t,blush,sourceHipOffsetX:.018
      });

      drawBlanket(now,t,positions);

      for(let i=0;i<3;i++){
        const phase = ((now/2400)+i/3)%1;
        drawHeart(
          positions.hip.x-camera.x+50+i*13+positions.drift.x,
          positions.hip.y-camera.y-80-phase*25+positions.drift.y,
          9+i*2,
          Math.sin(Math.PI*phase)*.55*t
        );
      }
    }

    function customCuddleActive(){
      return post.active && (post.stage === 'settle' || post.stage === 'cuddle');
    }

    const previousUpdate = update;
    update = function(){
      previousUpdate();
      if(!customCuddleActive()) return;

      const now = performance.now();
      const positions = cuddlePositions(now);
      players.him.x = positions.him.x;
      players.him.y = positions.him.y;
      players.her.x = positions.her.x;
      players.her.y = positions.her.y;
    };

    const previousDraw = draw;
    draw = function(){
      if(!customCuddleActive()){
        previousDraw();
        return;
      }

      const now = performance.now();
      const wasPostActive = post.active;
      const wasSceneActive = scene.active;
      const herImage = players.her.img;
      const himImage = players.him.img;

      // Draw only the room beneath the custom cuddle, skipping the older overlapping pose.
      post.active = false;
      scene.active = false;
      players.her.img = blankAtlas;
      players.him.img = blankAtlas;
      try{
        previousDraw();
      } finally {
        players.her.img = herImage;
        players.him.img = himImage;
        scene.active = wasSceneActive;
        post.active = wasPostActive;
      }

      let amount = 1;
      if(post.stage === 'settle'){
        amount = ease((now-post.started-settleStartsAt)/settleLength);
      }
      drawCustomCuddle(now,amount);
    };

    window.topSiloHammockCuddleFix = {
      positions:cuddlePositions,
      drift:hammockDrift
    };
  } catch(error){
    console.warn('top-silo hammock cuddle fix failed',error);
  }
})();