// Fade transition plus the smoke-heart and cuddle ending for the top-silo hammock scene.
(function(){
  try{
    if(!window.topSiloHammockEvent || typeof update !== 'function' ||
       typeof draw !== 'function' || typeof players === 'undefined' ||
       typeof ctx === 'undefined' || typeof camera === 'undefined' ||
       typeof keys === 'undefined') return;

    const event = window.topSiloHammockEvent;
    const scene = event.state;
    const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
    const boundsCache = new Map();
    const transparentPixel = document.createElement('canvas');
    transparentPixel.width = transparentPixel.height = 1;

    const durations = {
      lookBack:1200,
      heartPuff:2100,
      returnWalk:2800,
      settle:900
    };

    const post = {
      active:false,
      started:0,
      stage:'',
      hideActors:false,
      exitReadyAt:0
    };

    function isCurrentActorImage(image){
      return image && (image === players.her.img || image === players.him.img);
    }

    CanvasRenderingContext2D.prototype.drawImage = function(image, ...args){
      if(post.hideActors && isCurrentActorImage(image)) return;
      return originalDrawImage.call(this,image,...args);
    };

    function clamp(value,min,max){
      return Math.max(min,Math.min(max,value));
    }

    function ease(value){
      const t = clamp(value,0,1);
      return t < .5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;
    }

    function lerp(a,b,t){
      return a+(b-a)*t;
    }

    function zoneCenter(zone,bottom){
      return {
        x:zone.x+zone.w/2,
        y:bottom ? zone.y+zone.h-2 : zone.y+zone.h/2
      };
    }

    function hipTarget(){
      return zoneCenter(event.zones.hip,false);
    }

    function smokeTarget(){
      return zoneCenter(event.zones.smoke,true);
    }

    function faceTarget(){
      return zoneCenter(event.zones.facePlant,false);
    }

    function cuddleStandTargets(){
      const hip = hipTarget();
      return {
        her:{x:hip.x-30,y:hip.y+74},
        him:{x:hip.x+30,y:hip.y+74}
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

    function drawActor(image,who,dir,spriteFrame,x,y,options){
      if(!image || !image.complete || !image.naturalWidth) return;
      options = options || {};
      const player = who === 'her' ? players.her : players.him;
      const row = player.rows && player.rows[dir] !== undefined ? player.rows[dir] : 0;
      const cellW = image.naturalWidth/4;
      const cellH = image.naturalHeight/4;
      const size = options.size || 128;
      const sx = (spriteFrame%4)*cellW;
      const sy = row*cellH;
      const mirror = who === 'him' && dir === 'left';

      ctx.save();
      ctx.globalAlpha = options.alpha === undefined ? 1 : options.alpha;
      ctx.translate(Math.round(x-camera.x),Math.round(y-camera.y));
      ctx.rotate(options.rotation || 0);
      if(mirror) ctx.scale(-1,1);
      originalDrawImage.call(ctx,image,sx,sy,cellW,cellH,-size/2,-size+10,size,size);
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
      ctx.restore();
    }

    function drawHeart(x,y,size,alpha,color){
      const pixels = ['0110110','1111111','1111111','0111110','0011100','0001000'];
      const unit = Math.max(1,Math.round(size/7));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color || '#ff86bd';
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
      const s = clamp(strength,0,1.2);
      ctx.save();
      ctx.fillStyle = `rgba(12,0,18,${.12+.20*s})`;
      ctx.fillRect(0,0,canvas.width,canvas.height);
      const glow = ctx.createRadialGradient(x,y,10,x,y,230);
      glow.addColorStop(0,`rgba(255,130,195,${.15+.22*s})`);
      glow.addColorStop(.55,`rgba(255,105,180,${.06+.12*s})`);
      glow.addColorStop(1,'rgba(255,105,180,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x-245,y-245,490,490);
      ctx.restore();
    }

    function drawCigarette(target){
      const x = target.x-camera.x+27;
      const y = target.y-camera.y-63;
      ctx.save();
      ctx.strokeStyle = '#f4eee5';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x-2,y+2);
      ctx.lineTo(x+8,y);
      ctx.stroke();
      ctx.fillStyle = '#ff8b3d';
      ctx.fillRect(Math.round(x+7),Math.round(y-2),3,3);
      ctx.restore();
      return {x:x+8,y:y};
    }

    function drawHeartSmoke(now,target,progress){
      const origin = drawCigarette(target);
      const grow = ease(clamp(progress/.55,0,1));
      const fade = 1-ease(clamp((progress-.68)/.32,0,1));
      const centerX = origin.x-12;
      const centerY = origin.y-58;
      const scale = .72+grow*.72;

      ctx.save();
      ctx.fillStyle = '#eee6ed';
      ctx.shadowColor = '#ffb5d5';
      ctx.shadowBlur = 6;

      for(let i=0;i<32;i++){
        const a = (Math.PI*2*i)/32;
        const hx = 16*Math.pow(Math.sin(a),3);
        const hy = -(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a));
        const wobble = Math.sin(now/240+i)*1.2;
        ctx.globalAlpha = (.18+.48*grow)*fade*(.72+.28*Math.sin(Math.PI*i/31));
        ctx.beginPath();
        ctx.arc(centerX+hx*scale+wobble,centerY+hy*scale,3.1+grow*2.1,0,Math.PI*2);
        ctx.fill();
      }

      for(let i=0;i<7;i++){
        const t = i/6;
        ctx.globalAlpha = (.48-i*.05)*fade;
        ctx.beginPath();
        ctx.arc(
          lerp(origin.x,centerX,t)+Math.sin(now/180+i)*2,
          lerp(origin.y,centerY+18,t),
          2.3+i*.35,
          0,Math.PI*2
        );
        ctx.fill();
      }
      ctx.restore();
    }

    function drawFallenHim(now){
      const target = faceTarget();
      drawActor(players.him.img,'him','down',0,target.x,target.y+Math.sin(now/95)*1.5,
        {rotation:Math.PI/2,size:128});
    }

    function drawWaitingHim(now){
      const hip = hipTarget();
      const breathe = Math.sin(now/430)*1.2;
      drawActorAtHip(players.him.img,'him','down',0,hip.x+3,hip.y+8+breathe,
        {rotation:Math.PI/2,size:128});
    }

    function beginPostlude(now){
      post.active = true;
      post.started = now;
      post.stage = 'lookBack';
      post.exitReadyAt = 0;
    }

    function postElapsed(now){
      return now-post.started;
    }

    function postStage(elapsed){
      const heartAt = durations.lookBack;
      const returnAt = heartAt+durations.heartPuff;
      const settleAt = returnAt+durations.returnWalk;
      const cuddleAt = settleAt+durations.settle;
      if(elapsed < heartAt) return 'lookBack';
      if(elapsed < returnAt) return 'heartPuff';
      if(elapsed < settleAt) return 'returnWalk';
      if(elapsed < cuddleAt) return 'settle';
      return 'cuddle';
    }

    function walkDirection(from,to){
      const dx = to.x-from.x;
      const dy = to.y-from.y;
      if(Math.abs(dx)>Math.abs(dy)) return dx>=0 ? 'right' : 'left';
      return dy>=0 ? 'down' : 'up';
    }

    function drawLookBack(now,elapsed,heart){
      const target = smokeTarget();
      const progress = heart
        ? clamp((elapsed-durations.lookBack)/durations.heartPuff,0,1)
        : clamp(elapsed/durations.lookBack,0,1);
      const focus = scene.fall ? faceTarget() : hipTarget();
      drawSoftGlow((target.x+focus.x)/2,(target.y+focus.y)/2-30,.55);

      if(scene.fall) drawFallenHim(now);
      else drawWaitingHim(now);

      drawActor(players.her.img,'her','down',0,target.x,target.y,{size:128});
      if(heart) drawHeartSmoke(now,target,progress);
      else drawCigarette(target);
    }

    function drawReturnWalk(now,elapsed){
      const local = clamp((elapsed-durations.lookBack-durations.heartPuff)/durations.returnWalk,0,1);
      const t = ease(local);
      const fromHer = smokeTarget();
      const targets = cuddleStandTargets();
      const her = {
        x:lerp(fromHer.x,targets.her.x,t),
        y:lerp(fromHer.y,targets.her.y,t)
      };
      const herDistance = Math.hypot(her.x-fromHer.x,her.y-fromHer.y);
      const herFrame = Math.floor(herDistance/10)%4;
      const herDir = walkDirection(fromHer,targets.her);

      drawSoftGlow((her.x+targets.him.x)/2,(her.y+targets.him.y)/2-40,.55+.25*t);

      if(scene.fall){
        const fromHim = faceTarget();
        const him = {
          x:lerp(fromHim.x,targets.him.x,t),
          y:lerp(fromHim.y,targets.him.y,t)
        };
        const himDistance = Math.hypot(him.x-fromHim.x,him.y-fromHim.y);
        drawActor(players.him.img,'him',walkDirection(fromHim,targets.him),Math.floor(himDistance/10)%4,
          him.x,him.y,{size:128});
      } else {
        drawWaitingHim(now);
      }

      drawActor(players.her.img,'her',herDir,herFrame,her.x,her.y,{size:128});
      for(let i=0;i<4;i++){
        const a = now/650+i*Math.PI/2;
        drawHeart(
          (lerp(her.x,targets.him.x,.5)+Math.cos(a)*38)-camera.x,
          (lerp(her.y,targets.him.y,.5)-62+Math.sin(a)*17)-camera.y,
          9,.52
        );
      }
    }

    function drawPixelBlanket(now,amount){
      const hip = hipTarget();
      const lift = Math.round((1-ease(amount))*52);
      const breathe = Math.round(Math.sin(now/520)*1.2);
      const x = Math.round(hip.x-110-camera.x);
      const y = Math.round(hip.y-31-camera.y+lift+breathe);
      const w = 132;
      const h = 82;

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
      for(let i=0;i<6;i++){
        const px = x+17+i*19;
        ctx.fillRect(px,y+28,5,5);
        ctx.fillRect(px-3,y+31,11,4);
        ctx.fillRect(px,y+35,5,5);
      }
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      ctx.fillRect(x+10,y+4,w-20,3);
      ctx.restore();
    }

    function drawCuddle(now,settleProgress){
      const hip = hipTarget();
      const breathe = Math.sin(now/520)*1.2;
      const t = clamp(settleProgress,0,1);
      drawSoftGlow(hip.x,hip.y-20,.82);

      drawActorAtHip(players.him.img,'him','down',0,hip.x-4,hip.y+8+breathe,
        {rotation:Math.PI/2,size:128,alpha:t});
      drawActorAtHip(players.her.img,'her','down',0,hip.x+8,hip.y-7-breathe*.4,
        {rotation:Math.PI/2,size:128,alpha:t,sourceHipOffsetX:.018});
      drawPixelBlanket(now,t);

      for(let i=0;i<3;i++){
        const phase = ((now/2200)+i/3)%1;
        drawHeart(
          hip.x-camera.x+56+i*12,
          hip.y-camera.y-72-phase*28,
          9+i*2,Math.sin(Math.PI*phase)*.72
        );
      }
    }

    function setPostPlayerAnchors(now,stage,elapsed){
      const smoke = smokeTarget();
      const targets = cuddleStandTargets();
      const hip = hipTarget();

      if(stage === 'lookBack' || stage === 'heartPuff'){
        players.her.x = smoke.x;
        players.her.y = smoke.y;
        if(scene.fall){
          const face = faceTarget();
          players.him.x = face.x;
          players.him.y = face.y;
        } else {
          players.him.x = hip.x;
          players.him.y = hip.y;
        }
        return;
      }

      if(stage === 'returnWalk'){
        const local = clamp((elapsed-durations.lookBack-durations.heartPuff)/durations.returnWalk,0,1);
        const t = ease(local);
        players.her.x = lerp(smoke.x,targets.her.x,t);
        players.her.y = lerp(smoke.y,targets.her.y,t);
        if(scene.fall){
          const face = faceTarget();
          players.him.x = lerp(face.x,targets.him.x,t);
          players.him.y = lerp(face.y,targets.him.y,t);
        } else {
          players.him.x = hip.x;
          players.him.y = hip.y;
        }
        return;
      }

      players.her.x = hip.x+8;
      players.her.y = hip.y;
      players.him.x = hip.x-4;
      players.him.y = hip.y+8;
    }

    function movementPressed(){
      return !!(
        keys.arrowup || keys.arrowdown || keys.arrowleft || keys.arrowright ||
        keys.w || keys.a || keys.s || keys.d
      );
    }

    function finishCuddle(){
      const targets = cuddleStandTargets();
      post.active = false;
      post.stage = '';
      event.stop();

      players.her.x = targets.her.x;
      players.her.y = targets.her.y;
      players.him.x = targets.him.x;
      players.him.y = targets.him.y;
      players.her.dir = 'down';
      players.him.dir = 'down';
      players.her.frame = 0;
      players.him.frame = 0;
      players.her.frameTimer = 0;
      players.him.frameTimer = 0;

      const prompt = document.getElementById('prompt');
      if(prompt) prompt.style.display = 'none';
    }

    function drawFadeToBlack(now){
      if(!scene.active || post.active) return;
      const elapsed = now-scene.started;
      const at = event.timeline();
      const current = event.phase(elapsed);
      let alpha = 0;

      if(current === 'change'){
        alpha = ease((elapsed-at.changeAt)/event.times.change);
      } else if(current === 'pose1'){
        const revealLength = 720;
        alpha = 1-ease((elapsed-at.pose1At)/revealLength);
      }

      if(alpha <= 0) return;
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${clamp(alpha,0,1)})`;
      ctx.fillRect(0,0,canvas.width,canvas.height);
      if(alpha>.82){
        drawHeart(canvas.width/2-11,canvas.height/2-8,16,(alpha-.82)/.18,'#ff9dcc');
      }
      ctx.restore();
    }

    const previousUpdate = update;
    update = function(){
      const now = performance.now();

      if(post.active){
        if(!scene.active || !scene.original){
          post.active = false;
          return previousUpdate();
        }

        const elapsed = postElapsed(now);
        post.stage = postStage(elapsed);
        setPostPlayerAnchors(now,post.stage,elapsed);

        const prompt = document.getElementById('prompt');
        if(post.stage === 'cuddle'){
          if(!post.exitReadyAt) post.exitReadyAt = now+500;
          if(prompt){
            prompt.style.display = 'block';
            prompt.textContent = 'Move either character when you are ready to get up';
          }
          if(now >= post.exitReadyAt && movementPressed()){
            finishCuddle();
            previousUpdate();
          }
        } else if(prompt){
          prompt.style.display = 'none';
        }
        lastE = !!keys.e;
        return;
      }

      if(scene.active && scene.original){
        const elapsed = now-scene.started;
        if(event.phase(elapsed) === 'wait'){
          beginPostlude(now);
          setPostPlayerAnchors(now,'lookBack',0);
          lastE = !!keys.e;
          return;
        }
      }

      previousUpdate();
    };

    const previousDraw = draw;
    draw = function(){
      const now = performance.now();

      if(!post.active){
        previousDraw();
        drawFadeToBlack(now);
        return;
      }

      const wasActive = scene.active;
      post.hideActors = true;
      scene.active = false;
      try{
        previousDraw();
      } finally {
        scene.active = wasActive;
        post.hideActors = false;
      }

      const elapsed = postElapsed(now);
      const stage = postStage(elapsed);
      if(stage === 'lookBack') drawLookBack(now,elapsed,false);
      if(stage === 'heartPuff') drawLookBack(now,elapsed,true);
      if(stage === 'returnWalk') drawReturnWalk(now,elapsed);
      if(stage === 'settle'){
        const start = durations.lookBack+durations.heartPuff+durations.returnWalk;
        drawCuddle(now,ease((elapsed-start)/durations.settle));
      }
      if(stage === 'cuddle') drawCuddle(now,1);
    };

    window.topSiloHammockPostlude = post;
  } catch(error){
    console.warn('top-silo hammock postlude failed',error);
  }
})();