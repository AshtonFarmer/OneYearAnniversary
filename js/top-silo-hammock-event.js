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
    const hipZone = {x:638, y:492, w:7, h:1};

    const herSkin = new Image();
    const himSkin = new Image();
    herSkin.src = 'assets/sprites/her_skin.png';
    himSkin.src = 'assets/sprites/him_skin.png';

    const times = {
      approach:4200,
      gaze:2600,
      kiss1:1800,
      kiss2:2400,
      change:650,
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
      fall:false,
      skinApplied:false
    };

    function center(){
      return {x:hammock.x + hammock.w/2, y:hammock.y + hammock.h/2};
    }

    function hipTarget(){
      return {x:hipZone.x + hipZone.w/2, y:hipZone.y + hipZone.h/2};
    }

    function meetingTargets(){
      const hip = hipTarget();
      return {
        her:{x:hip.x-34,y:hip.y+72},
        him:{x:hip.x+34,y:hip.y+72}
      };
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

    function lerp(a,b,t){
      return a + (b-a)*t;
    }

    function timeline(){
      const gazeAt = times.approach;
      const kiss1At = gazeAt + times.gaze;
      const kiss2At = kiss1At + times.kiss1;
      const changeAt = kiss2At + times.kiss2;
      const pose1At = changeAt + times.change;
      const pose2At = pose1At + times.pose1;
      const fallAt = pose2At + times.pose2;
      const walkAt = fallAt + (scene.fall ? times.fall : 0);
      const smokeAt = walkAt + times.walk;
      const waitAt = smokeAt + times.smoke;
      const finishAt = waitAt + times.wait;
      return {gazeAt,kiss1At,kiss2At,changeAt,pose1At,pose2At,fallAt,walkAt,smokeAt,waitAt,finishAt};
    }

    function phase(elapsed){
      const at = timeline();
      if(elapsed < at.gazeAt) return 'approach';
      if(elapsed < at.kiss1At) return 'gaze';
      if(elapsed < at.kiss2At) return 'kiss1';
      if(elapsed < at.changeAt) return 'kiss2';
      if(elapsed < at.pose1At) return 'change';
      if(elapsed < at.pose2At) return 'pose1';
      if(elapsed < at.fallAt) return 'pose2';
      if(scene.fall && elapsed < at.walkAt) return 'fall';
      if(elapsed < at.smokeAt) return 'walk';
      if(elapsed < at.waitAt) return 'smoke';
      if(elapsed < at.finishAt) return 'wait';
      return 'done';
    }

    function cinematicStandingPositions(elapsed){
      const at = timeline();
      const meet = meetingTargets();
      const original = scene.original;
      if(elapsed < at.gazeAt){
        const t = ease(elapsed/times.approach);
        return {
          her:{x:lerp(original.herX,meet.her.x,t),y:lerp(original.herY,meet.her.y,t)},
          him:{x:lerp(original.himX,meet.him.x,t),y:lerp(original.himY,meet.him.y,t)}
        };
      }

      let closeness = 0;
      if(elapsed >= at.kiss1At && elapsed < at.kiss2At){
        closeness = ease((elapsed-at.kiss1At)/times.kiss1)*9;
      } else if(elapsed >= at.kiss2At){
        closeness = 9 + ease((elapsed-at.kiss2At)/times.kiss2)*8;
      }

      return {
        her:{x:meet.her.x+closeness,y:meet.her.y},
        him:{x:meet.him.x-closeness,y:meet.him.y}
      };
    }

    function applySkin(){
      if(scene.skinApplied) return;
      players.her.img = herSkin;
      players.him.img = himSkin;
      players.her.frame = 0;
      players.him.frame = 0;
      scene.skinApplied = true;
    }

    function startScene(now){
      if(scene.active) return;
      scene.original = {
        herImg:players.her.img,
        himImg:players.him.img,
        herX:players.her.x,
        herY:players.her.y,
        himX:players.him.x,
        himY:players.him.y,
        herDir:players.her.dir,
        himDir:players.him.dir
      };
      scene.fall = Math.random() < .25;
      scene.skinApplied = false;
      players.her.frame = 0;
      players.him.frame = 0;
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
      scene.skinApplied = false;
    }

    function frame(now, rate){
      return Math.floor(now / rate) % 4;
    }

    function drawActor(img, who, dir, spriteFrame, x, y, options){
      if(!img || !img.complete || !img.naturalWidth) return;
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

    function drawHeart(x,y,size,alpha,color){
      const pixels = ['0110110','1111111','1111111','0111110','0011100','0001000'];
      const unit = Math.max(1, Math.round(size/7));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color || '#ff6faf';
      ctx.shadowColor = '#ff9dcc';
      ctx.shadowBlur = unit*3;
      pixels.forEach((line,row) => {
        [...line].forEach((bit,col) => {
          if(bit === '1') ctx.fillRect(x+col*unit,y+row*unit,unit,unit);
        });
      });
      ctx.restore();
    }

    function drawPinkLightingAt(worldX,worldY,strength){
      const x = worldX-camera.x;
      const y = worldY-camera.y;
      const s = clamp(strength === undefined ? 1 : strength,0,1.35);
      ctx.save();
      ctx.fillStyle = `rgba(12,0,18,${.20+.27*s})`;
      ctx.fillRect(0,0,canvas.width,canvas.height);
      const glow = ctx.createRadialGradient(x,y,15,x,y,245);
      glow.addColorStop(0,`rgba(255,120,190,${.22+.25*s})`);
      glow.addColorStop(.5,`rgba(255,105,180,${.10+.14*s})`);
      glow.addColorStop(1,'rgba(255,105,180,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x-260,y-260,520,520);
      ctx.restore();
    }

    function drawFlyingHearts(now,worldX,worldY,count,speed,spread){
      const total = count || 10;
      const heartSpeed = speed || 1700;
      const radius = spread || 95;
      for(let i=0;i<total;i++){
        const t = ((now/heartSpeed) + i/total) % 1;
        const x = worldX + Math.sin(i*2.1 + now/700)*radius + (i%2 ? 18 : -18);
        const y = worldY + 52 - t*155;
        const alpha = Math.sin(Math.PI*t);
        drawHeart(x-camera.x,y-camera.y,10+(i%4)*2,alpha);
      }
    }

    function drawSwirlingHearts(now,positions,intensity){
      const midX = (positions.her.x+positions.him.x)/2;
      const midY = (positions.her.y+positions.him.y)/2-58;
      const count = Math.round(6+intensity*8);
      for(let i=0;i<count;i++){
        const angle = now/(900-300*intensity) + i*(Math.PI*2/count);
        const radiusX = 45+intensity*25;
        const radiusY = 24+intensity*18;
        const rise = ((now/1800+i/count)%1)*28;
        const x = midX + Math.cos(angle)*radiusX;
        const y = midY + Math.sin(angle)*radiusY-rise;
        drawHeart(x-camera.x,y-camera.y,9+(i%3)*2,.50+.45*intensity);
      }
    }

    function drawApproach(now,elapsed){
      const positions = cinematicStandingPositions(elapsed);
      const progress = clamp(elapsed/times.approach,0,1);
      const herMoving = Math.abs(positions.her.x-scene.original.herX)+Math.abs(positions.her.y-scene.original.herY) > 2;
      const himMoving = Math.abs(positions.him.x-scene.original.himX)+Math.abs(positions.him.y-scene.original.himY) > 2;
      const herDir = positions.her.x >= scene.original.herX ? 'right' : 'left';
      const himDir = positions.him.x >= scene.original.himX ? 'right' : 'left';
      const midX = (positions.her.x+positions.him.x)/2;
      const midY = (positions.her.y+positions.him.y)/2-45;
      drawPinkLightingAt(midX,midY,.35+.65*progress);
      drawSwirlingHearts(now,positions,.30+.55*progress);
      drawActor(scene.original.herImg,'her',herDir,herMoving ? frame(now,145) : 0,positions.her.x,positions.her.y,{size:128});
      drawActor(scene.original.himImg,'him',himDir,himMoving ? frame(now,145) : 0,positions.him.x,positions.him.y,{size:128});
    }

    function drawGazeOrKiss(now,elapsed,current){
      const positions = cinematicStandingPositions(elapsed);
      const at = timeline();
      let intensity = .65;
      let kissBob = 0;
      let lean = 0;
      if(current === 'kiss1'){
        intensity = .95;
        const t = ease((elapsed-at.kiss1At)/times.kiss1);
        lean = t*.035;
        kissBob = Math.sin(now/260)*1.2*t;
      }
      if(current === 'kiss2'){
        const t = ease((elapsed-at.kiss2At)/times.kiss2);
        intensity = 1.05+.25*t;
        lean = .035+Math.sin(now/300)*.018;
        kissBob = Math.sin(now/190)*(1.5+1.5*t);
      }
      const midX = (positions.her.x+positions.him.x)/2;
      const midY = (positions.her.y+positions.him.y)/2-48;
      drawPinkLightingAt(midX,midY,intensity);
      drawSwirlingHearts(now,positions,intensity);
      if(current !== 'gaze') drawFlyingHearts(now,midX,midY,Math.round(7+intensity*6),1200,60);
      drawActor(scene.original.herImg,'her','right',0,positions.her.x,positions.her.y+kissBob,{rotation:-lean,size:128});
      drawActor(scene.original.himImg,'him','left',0,positions.him.x,positions.him.y-kissBob,{rotation:lean,size:128});
    }

    function drawChange(now,elapsed){
      const positions = cinematicStandingPositions(elapsed);
      const at = timeline();
      const t = clamp((elapsed-at.changeAt)/times.change,0,1);
      const midX = (positions.her.x+positions.him.x)/2;
      const midY = (positions.her.y+positions.him.y)/2-45;
      drawPinkLightingAt(midX,midY,1.25);
      drawSwirlingHearts(now,positions,1.25);
      ctx.save();
      const flash = Math.sin(Math.PI*t);
      ctx.fillStyle = `rgba(255,205,235,${flash*.48})`;
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.restore();
      drawActor(scene.original.herImg,'her','right',0,positions.her.x,positions.her.y,{size:128});
      drawActor(scene.original.himImg,'him','left',0,positions.him.x,positions.him.y,{size:128});
    }

    function drawPoseOne(now){
      const c = center();
      drawActor(herSkin,'her','down',0,c.x+28,c.y,{rotation:Math.PI/2,centered:true,size:128});
      drawActor(himSkin,'him','right',0,c.x-24,hammock.y+hammock.h-10,{size:128});
    }

    function drawPoseTwo(now){
      const c = center();
      drawActor(himSkin,'him','down',0,c.x+33,c.y+2,{rotation:Math.PI/2,centered:true,size:128});
      drawActor(herSkin,'her','right',0,c.x-15,hammock.y+hammock.h-10,{size:128});
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
      drawActor(himSkin,'him','down',frame(now,120),x,y,{rotation:spin,centered:true,size:128});
      if(raw > .62) drawImpact(now,target,(raw-.62)/.38);
    }

    function drawFallenHim(now){
      const target = facePlantTarget();
      const twitch = Math.sin(now/95)*1.5;
      drawActor(himSkin,'him','down',0,target.x,target.y+twitch,{rotation:Math.PI/2,centered:true,size:128});
    }

    function drawWalk(now, elapsed){
      const c = center();
      const target = smokeTarget();
      const from = {x:c.x-14,y:hammock.y+hammock.h-10};
      const at = timeline();
      const t = ease((elapsed-at.walkAt)/times.walk);
      const x = from.x + (target.x-from.x)*t;
      const y = from.y + (target.y-from.y)*t;
      if(scene.fall) drawFallenHim(now);
      else drawActor(himSkin,'him','down',0,c.x+30,c.y+2,{rotation:Math.PI/2,centered:true,size:128});
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
      if(scene.fall) drawFallenHim(now);
      else drawActor(himSkin,'him','down',0,c.x+30,c.y+2+breathe,{rotation:Math.PI/2,centered:true,size:128});
      drawActor(herSkin,'her','right',0,target.x,target.y+breathe*.25,{size:128});
      if(smoking){
        drawCigarette(target);
        drawSmoke(now,target);
      }
    }

    function updateCinematicAnchors(elapsed,current){
      const at = timeline();
      if(elapsed < at.pose1At){
        const positions = cinematicStandingPositions(elapsed);
        players.her.x = positions.her.x;
        players.her.y = positions.her.y;
        players.him.x = positions.him.x;
        players.him.y = positions.him.y;
        return;
      }
      if(current === 'pose1' || current === 'pose2' || current === 'change'){
        const hip = hipTarget();
        players.her.x = hip.x-18;
        players.her.y = hip.y+55;
        players.him.x = hip.x+18;
        players.him.y = hip.y+55;
        return;
      }
      if(current === 'fall'){
        const face = facePlantTarget();
        players.her.x = center().x-18;
        players.her.y = hammock.y+hammock.h-10;
        players.him.x = face.x;
        players.him.y = face.y;
        return;
      }
      if(current === 'walk' || current === 'smoke' || current === 'wait'){
        const target = smokeTarget();
        players.her.x = target.x;
        players.her.y = target.y;
        players.him.x = scene.fall ? facePlantTarget().x : center().x+30;
        players.him.y = scene.fall ? facePlantTarget().y : center().y+2;
      }
    }

    function drawScene(){
      if(!scene.active) return;
      const now = performance.now();
      const elapsed = now-scene.started;
      const current = phase(elapsed);
      const at = timeline();

      if(current === 'approach') drawApproach(now,elapsed);
      if(current === 'gaze' || current === 'kiss1' || current === 'kiss2') drawGazeOrKiss(now,elapsed,current);
      if(current === 'change') drawChange(now,elapsed);
      if(current === 'pose1' || current === 'pose2'){
        const c = center();
        drawPinkLightingAt(c.x,c.y,1.15);
        drawFlyingHearts(now,c.x,c.y,12,1450,100);
        if(current === 'pose1') drawPoseOne(now);
        else drawPoseTwo(now);
      }
      if(current === 'fall') drawFacePlant(now,elapsed);
      if(current === 'walk') drawWalk(now,elapsed);
      if(current === 'smoke') drawAtLookout(now,true);
      if(current === 'wait') drawAtLookout(now,false);

      if(elapsed >= at.pose1At && !scene.skinApplied) applySkin();
    }

    const oldUpdate = update;
    update = function(){
      const now = performance.now();
      if(scene.active){
        const elapsed = now-scene.started;
        const current = phase(elapsed);
        const at = timeline();
        if(elapsed >= at.pose1At) applySkin();
        updateCinematicAnchors(elapsed,current);
        if(current === 'done') finishScene();
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
        ctx.fillText('25% face plant',facePlantZone.x-camera.x+4,facePlantZone.y-camera.y-7);
        ctx.restore();
      }
    };

    window.topSiloHammockEvent = {
      start:() => startScene(performance.now()),
      stop:() => scene.active && finishScene(),
      state:scene,
      times,
      timeline,
      phase,
      zones:{hammock,missingBrick,smoke:smokeZone,facePlant:facePlantZone,hip:hipZone}
    };
  } catch(error){
    console.warn('top-silo hammock event failed',error);
  }
})();