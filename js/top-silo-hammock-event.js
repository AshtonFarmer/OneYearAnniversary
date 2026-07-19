// Top-silo hammock anniversary cutscene.
(function(){
  try{
    if(typeof players === 'undefined' || typeof zones === 'undefined' ||
       typeof update !== 'function' || typeof draw !== 'function' ||
       typeof drawSprite !== 'function' || typeof nearbyZone !== 'function') return;

    const hammock = zones.find(z => z.type === 'hammock');
    const missingBrick = zones.find(z => z.type === 'lookout');
    Object.assign(hammock, {
      x:434, y:433, w:420, h:123,
      text:'Press E to start the hammock moment'
    });
    Object.assign(missingBrick, {
      x:552, y:190, w:161, h:174,
      text:'Press E to peek through the missing brick'
    });

    const smokeZone = {x:600, y:365, w:63, h:49};
    const facePlantZone = {x:467, y:575, w:292, h:57};
    const herSkin = new Image();
    const himSkin = new Image();
    herSkin.src = 'assets/sprites/her_skin.png';
    himSkin.src = 'assets/sprites/him_skin.png';

    const times = {
      pose1:10000,
      pose2:10000,
      fall:2800,
      walk:2400,
      smoke:6500,
      wait:3000
    };

    const scene = {
      active:false,
      started:0,
      original:null,
      fall:false
    };

    function center(){
      return {x:hammock.x + hammock.w/2, y:hammock.y + hammock.h/2};
    }

    function smokeTarget(){
      return {x:smokeZone.x + smokeZone.w/2, y:smokeZone.y + smokeZone.h - 2};
    }

    function facePlantTarget(){
      return {x:facePlantZone.x + facePlantZone.w/2, y:facePlantZone.y + facePlantZone.h/2};
    }

    function clamp(v, min, max){
      return Math.max(min, Math.min(max, v));
    }

    function ease(t){
      t = clamp(t,0,1);
      return t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
    }

    function timeline(){
      const pose2At = times.pose1;
      const fallAt = pose2At + times.pose2;
      const walkAt = fallAt + (scene.fall ? times.fall : 0);
      const smokeAt = walkAt + times.walk;
      const waitAt = smokeAt + times.smoke;
      const finishAt = waitAt + times.wait;
      return {pose2At,fallAt,walkAt,smokeAt,waitAt,finishAt};
    }

    function phase(elapsed){
      const at = timeline();
      if(elapsed < at.pose2At) return 'pose1';
      if(elapsed < at.fallAt) return 'pose2';
      if(scene.fall && elapsed < at.walkAt) return 'fall';
      if(elapsed < at.smokeAt) return 'walk';
      if(elapsed < at.waitAt) return 'smoke';
      if(elapsed < at.finishAt) return 'wait';
      return 'done';
    }

    function startScene(now){
      if(scene.active) return;
      scene.original = {
        herImg:players.her.img,
        himImg:players.him.img
      };
      scene.fall = Math.random() < .10;
      players.her.img = herSkin;
      players.him.img = himSkin;
      players.her.frame = players.him.frame = 0;
      viewingLookout = false;
      scene.active = true;
      scene.started = now;
      const prompt = document.getElementById('prompt');
      if(prompt) prompt.style.display = 'none';
    }

    function finishScene(){
      const c = center();
      const target = smokeTarget();
      const face = facePlantTarget();
      const fell = scene.fall;
      players.her.img = scene.original.herImg;
      players.him.img = scene.original.himImg;

      players.her.x = target.x;
      players.her.y = target.y;
      players.her.dir = 'down';
      players.her.frame = 0;
      players.her.frameTimer = 0;

      players.him.x = fell ? face.x : c.x - 34;
      players.him.y = fell ? face.y + facePlantZone.h/2 : hammock.y + hammock.h - 4;
      players.him.dir = 'down';
      players.him.frame = 0;
      players.him.frameTimer = 0;

      scene.active = false;
      scene.original = null;
      scene.fall = false;
    }

    function frame(now, rate){
      return Math.floor(now / rate) % 4;
    }

    function direction(now, offset){
      const dirs = ['right','down','left','up'];
      return dirs[Math.floor((now + (offset || 0)) / 2500) % 4];
    }

    function drawActor(img, who, dir, spriteFrame, x, y, options){
      if(!img.complete || !img.naturalWidth) return;
      options = options || {};
      const rows = who === 'him' ? players.him.rows : players.her.rows;
      const row = rows[dir] === undefined ? 0 : rows[dir];
      const cellW = img.naturalWidth / 4;
      const cellH = img.naturalHeight / 4;
      const size = options.size || 128;
      const sx = (spriteFrame % 4) * cellW;
      const sy = row * cellH;
      const mirror = who === 'him' && dir === 'left';

      ctx.save();
      ctx.translate(Math.round(x-camera.x), Math.round(y-camera.y));
      ctx.rotate(options.rotation || 0);
      if(mirror) ctx.scale(-1,1);
      if(options.centered){
        ctx.drawImage(img, sx, sy, cellW, cellH, -size/2, -size/2, size, size);
      } else {
        ctx.drawImage(img, sx, sy, cellW, cellH, -size/2, -size+10, size, size);
      }
      ctx.restore();
    }

    function drawHeart(x,y,size,alpha){
      const pixels = [
        '0110110','1111111','1111111','0111110','0011100','0001000'
      ];
      const unit = Math.max(1, Math.round(size/7));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ff6faf';
      ctx.shadowColor = '#ff9dcc';
      ctx.shadowBlur = unit*3;
      pixels.forEach((line,row) => {
        [...line].forEach((bit,col) => {
          if(bit === '1') ctx.fillRect(x+col*unit,y+row*unit,unit,unit);
        });
      });
      ctx.restore();
    }

    function drawPinkLighting(){
      const c = center();
      const x = c.x-camera.x;
      const y = c.y-camera.y;
      ctx.save();
      ctx.fillStyle = 'rgba(12,0,18,.46)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      const glow = ctx.createRadialGradient(x,y,15,x,y,235);
      glow.addColorStop(0,'rgba(255,120,190,.42)');
      glow.addColorStop(.5,'rgba(255,105,180,.20)');
      glow.addColorStop(1,'rgba(255,105,180,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x-250,y-250,500,500);
      ctx.restore();
    }

    function drawFlyingHearts(now){
      const c = center();
      for(let i=0;i<10;i++){
        const t = ((now/1700) + i*.137) % 1;
        const x = c.x + Math.sin(i*2.1 + now/700)*95 + (i%2 ? 24 : -24);
        const y = c.y + 52 - t*155;
        const alpha = Math.sin(Math.PI*t);
        drawHeart(x-camera.x,y-camera.y,11+(i%4)*2,alpha);
      }
    }

    function drawPoseOne(now){
      const c = center();
      const sway = Math.sin(now/280)*3;
      const bob = Math.cos(now/330)*2;
      drawActor(herSkin,'her','down',frame(now,320),c.x+28+sway,c.y+bob,
        {rotation:Math.PI/2,centered:true,size:128});
      drawActor(himSkin,'him',direction(now),frame(now,165),c.x-24+sway*.45,
        hammock.y+hammock.h-10+bob,{size:128});
    }

    function drawPoseTwo(now){
      const c = center();
      const sway = Math.sin(now/240)*3;
      const bob = Math.cos(now/310)*2;
      drawActor(himSkin,'him','down',frame(now,330),c.x+33+sway,c.y+2+bob,
        {rotation:Math.PI/2,centered:true,size:128});
      drawActor(herSkin,'her',direction(now,1250),frame(now,165),c.x-15+sway*.35,
        hammock.y+hammock.h-10+bob,{size:128});
      drawFlyingHearts(now);
    }

    function drawImpact(now, target, strength){
      ctx.save();
      const x = target.x-camera.x-48;
      const y = target.y-camera.y+4;
      ctx.strokeStyle = '#ffe18b';
      ctx.fillStyle = 'rgba(225,190,140,.72)';
      ctx.lineWidth = 3;
      for(let i=0;i<6;i++){
        const a = (Math.PI*2*i)/6 + now/700;
        const inner = 12 + strength*8;
        const outer = 24 + strength*18;
        ctx.beginPath();
        ctx.moveTo(x+Math.cos(a)*inner,y+Math.sin(a)*inner*.5);
        ctx.lineTo(x+Math.cos(a)*outer,y+Math.sin(a)*outer*.5);
        ctx.stroke();
      }
      for(let i=0;i<5;i++){
        const a = i*1.7 + now/900;
        ctx.globalAlpha = .55*(1-strength*.25);
        ctx.beginPath();
        ctx.arc(x+Math.cos(a)*(18+i*3),y+8+Math.sin(a)*8,4+i,0,Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawFacePlant(now, elapsed){
      const c = center();
      const target = facePlantTarget();
      const at = timeline();
      const raw = clamp((elapsed-at.fallAt)/times.fall,0,1);
      const t = ease(raw);
      const start = {x:c.x+33,y:c.y+2};
      const x = start.x + (target.x-start.x)*t;
      const y = start.y + (target.y-start.y)*t - Math.sin(Math.PI*t)*72;
      const spin = Math.PI/2 + Math.sin(Math.PI*t)*Math.PI*1.35;

      drawActor(herSkin,'her','down',0,c.x-18,hammock.y+hammock.h-10,{size:128});
      drawActor(himSkin,'him','down',frame(now,120),x,y,
        {rotation:spin,centered:true,size:128});

      if(raw > .62){
        drawImpact(now,target,(raw-.62)/.38);
      }
    }

    function drawFallenHim(now){
      const target = facePlantTarget();
      const twitch = Math.sin(now/95)*1.5;
      drawActor(himSkin,'him','down',0,target.x,target.y+twitch,
        {rotation:Math.PI/2,centered:true,size:128});
    }

    function drawWalk(now, elapsed){
      const c = center();
      const target = smokeTarget();
      const from = {x:c.x-14,y:hammock.y+hammock.h-10};
      const at = timeline();
      const t = ease((elapsed-at.walkAt)/times.walk);
      const x = from.x + (target.x-from.x)*t;
      const y = from.y + (target.y-from.y)*t;
      if(scene.fall){
        drawFallenHim(now);
      } else {
        drawActor(himSkin,'him','down',0,c.x+30,c.y+2,
          {rotation:Math.PI/2,centered:true,size:128});
      }
      drawActor(herSkin,'her','up',frame(now,135),x,y,{size:128});
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
    }

    function drawSmoke(now, target){
      ctx.save();
      for(let i=0;i<7;i++){
        const t = ((now/2300)+i*.16)%1;
        const x = target.x-camera.x+31 + Math.sin(t*8+i)*10 + t*20;
        const y = target.y-camera.y-68 - t*65;
        ctx.globalAlpha = (1-t)*.65;
        ctx.fillStyle = '#d8d3d7';
        ctx.beginPath();
        ctx.arc(x,y,3+t*5,0,Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawAtLookout(now, smoking){
      const c = center();
      const target = smokeTarget();
      const breathe = Math.sin(now/420)*1.5;
      if(scene.fall){
        drawFallenHim(now);
      } else {
        drawActor(himSkin,'him','down',0,c.x+30,c.y+2+breathe,
          {rotation:Math.PI/2,centered:true,size:128});
      }
      drawActor(herSkin,'her','right',0,target.x,target.y+breathe*.25,{size:128});
      if(smoking){
        drawCigarette(target);
        drawSmoke(now,target);
      }
    }

    function drawScene(){
      if(!scene.active) return;
      const now = performance.now();
      const elapsed = now-scene.started;
      const current = phase(elapsed);
      if(current === 'pose1') drawPoseOne(now);
      if(current === 'pose2'){
        drawPinkLighting();
        drawPoseTwo(now);
      }
      if(current === 'fall') drawFacePlant(now,elapsed);
      if(current === 'walk') drawWalk(now,elapsed);
      if(current === 'smoke') drawAtLookout(now,true);
      if(current === 'wait') drawAtLookout(now,false);
    }

    const oldUpdate = update;
    update = function(){
      const now = performance.now();
      if(scene.active){
        if(phase(now-scene.started) === 'done') finishScene();
        const prompt = document.getElementById('prompt');
        if(prompt) prompt.style.display = 'none';
        lastE = !!keys.e;
        return;
      }

      const active = nearbyZone();
      const justE = !!keys.e && !lastE;
      if(justE && active && active.type === 'hammock' && !viewingLookout){
        startScene(now);
        lastE = !!keys.e;
        return;
      }
      oldUpdate();
    };

    const oldDrawSprite = drawSprite;
    drawSprite = function(player){
      if(scene.active) return;
      oldDrawSprite(player);
    };

    const oldDraw = draw;
    draw = function(){
      oldDraw();
      drawScene();
      if(debugMode){
        ctx.save();
        ctx.fillStyle = 'rgba(180,120,255,.28)';
        ctx.strokeStyle = '#d6a8ff';
        ctx.fillRect(smokeZone.x-camera.x,smokeZone.y-camera.y,smokeZone.w,smokeZone.h);
        ctx.strokeRect(smokeZone.x-camera.x,smokeZone.y-camera.y,smokeZone.w,smokeZone.h);
        ctx.fillStyle = '#fff';
        ctx.font = '13px monospace';
        ctx.fillText('smoke spot',smokeZone.x-camera.x+4,smokeZone.y-camera.y-7);

        ctx.fillStyle = 'rgba(255,115,80,.26)';
        ctx.strokeStyle = '#ff7350';
        ctx.fillRect(facePlantZone.x-camera.x,facePlantZone.y-camera.y,facePlantZone.w,facePlantZone.h);
        ctx.strokeRect(facePlantZone.x-camera.x,facePlantZone.y-camera.y,facePlantZone.w,facePlantZone.h);
        ctx.fillStyle = '#fff';
        ctx.fillText('10% face plant',facePlantZone.x-camera.x+4,facePlantZone.y-camera.y-7);
        ctx.restore();
      }
    };

    window.topSiloHammockEvent = {
      start:() => startScene(performance.now()),
      stop:() => scene.active && finishScene(),
      state:scene,
      zones:{hammock,missingBrick,smoke:smokeZone,facePlant:facePlantZone}
    };
  } catch(error){
    console.warn('top-silo hammock event failed',error);
  }
})();
