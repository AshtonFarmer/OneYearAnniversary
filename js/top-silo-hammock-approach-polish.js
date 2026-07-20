// Smooths the walk toward the hammock before the gaze and kiss sequence.
(function(){
  try{
    if(!window.topSiloHammockEvent || typeof update !== 'function' ||
       typeof draw !== 'function' || typeof players === 'undefined' ||
       typeof ctx === 'undefined' || typeof camera === 'undefined') return;

    const event = window.topSiloHammockEvent;
    const scene = event.state;
    const times = event.times;
    const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;

    let hideBaseActors = false;
    let cachedSceneStart = -1;
    let cachedPlan = null;

    function isSceneActor(image){
      if(!scene.original || !image) return false;
      return image === scene.original.herImg || image === scene.original.himImg;
    }

    CanvasRenderingContext2D.prototype.drawImage = function(image, ...args){
      if(hideBaseActors && isSceneActor(image)) return;
      return originalDrawImage.call(this,image,...args);
    };

    function clamp(value,min,max){
      return Math.max(min,Math.min(max,value));
    }

    function hipTarget(){
      const zone = event.zones.hip;
      return {x:zone.x+zone.w/2,y:zone.y+zone.h/2};
    }

    function meetingTargets(){
      const hip = hipTarget();
      return {
        her:{x:hip.x-34,y:hip.y+72},
        him:{x:hip.x+34,y:hip.y+72}
      };
    }

    function makePath(start,target){
      const vertical = Math.abs(target.y-start.y);
      const horizontal = Math.abs(target.x-start.x);
      return {
        start,
        target,
        vertical,
        horizontal,
        total:vertical+horizontal
      };
    }

    function getPlan(){
      if(cachedPlan && cachedSceneStart === scene.started) return cachedPlan;

      const targets = meetingTargets();
      const herPath = makePath(
        {x:scene.original.herX,y:scene.original.herY},
        targets.her
      );
      const himPath = makePath(
        {x:scene.original.himX,y:scene.original.himY},
        targets.him
      );

      const startPause = 140;
      const settleTime = 360;
      const travelWindow = Math.max(600,times.approach-startPause-settleTime);
      const longest = Math.max(1,herPath.total,himPath.total);

      cachedSceneStart = scene.started;
      cachedPlan = {
        her:herPath,
        him:himPath,
        startPause,
        speed:longest/travelWindow
      };
      return cachedPlan;
    }

    function stateAlongPath(path,elapsed,who,plan){
      const travelElapsed = Math.max(0,elapsed-plan.startPause);
      const distance = clamp(travelElapsed*plan.speed,0,path.total);
      const moving = distance < path.total-.01;
      let x = path.start.x;
      let y = path.start.y;
      let dir = who === 'her' ? 'right' : 'left';

      if(distance < path.vertical){
        const sign = Math.sign(path.target.y-path.start.y) || 1;
        y = path.start.y+distance*sign;
        dir = sign > 0 ? 'down' : 'up';
      } else {
        y = path.target.y;
        const horizontalDistance = Math.min(path.horizontal,distance-path.vertical);
        const sign = Math.sign(path.target.x-path.start.x) || (who === 'her' ? 1 : -1);
        x = path.start.x+horizontalDistance*sign;
        dir = sign > 0 ? 'right' : 'left';
      }

      if(!moving){
        x = path.target.x;
        y = path.target.y;
        dir = who === 'her' ? 'right' : 'left';
      }

      const spriteFrame = moving ? Math.floor(distance/11)%4 : 0;
      const stepBob = moving ? Math.sin((distance/11)*Math.PI)*.65 : 0;

      return {x,y:y+stepBob,dir,frame:spriteFrame,moving,distance};
    }

    function approachStates(elapsed){
      const plan = getPlan();
      return {
        her:stateAlongPath(plan.her,elapsed,'her',plan),
        him:stateAlongPath(plan.him,elapsed,'him',plan)
      };
    }

    function drawActor(image,who,state){
      if(!image || !image.complete || !image.naturalWidth) return;

      const player = who === 'her' ? players.her : players.him;
      const row = player.rows && player.rows[state.dir] !== undefined ? player.rows[state.dir] : 0;
      const cellW = image.naturalWidth/4;
      const cellH = image.naturalHeight/4;
      const size = 128;
      const sx = state.frame*cellW;
      const sy = row*cellH;
      const mirror = who === 'him' && state.dir === 'left';

      ctx.save();
      ctx.translate(Math.round(state.x-camera.x),Math.round(state.y-camera.y));
      if(mirror) ctx.scale(-1,1);
      originalDrawImage.call(
        ctx,image,sx,sy,cellW,cellH,
        -size/2,-size+10,size,size
      );
      ctx.restore();
    }

    function drawHeart(x,y,size,alpha){
      const pixels = ['0110110','1111111','1111111','0111110','0011100','0001000'];
      const unit = Math.max(1,Math.round(size/7));
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

    function drawLighting(worldX,worldY,strength){
      const x = worldX-camera.x;
      const y = worldY-camera.y;
      ctx.save();
      ctx.fillStyle = `rgba(12,0,18,${.20+.27*strength})`;
      ctx.fillRect(0,0,canvas.width,canvas.height);
      const glow = ctx.createRadialGradient(x,y,15,x,y,245);
      glow.addColorStop(0,`rgba(255,120,190,${.22+.25*strength})`);
      glow.addColorStop(.5,`rgba(255,105,180,${.10+.14*strength})`);
      glow.addColorStop(1,'rgba(255,105,180,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x-260,y-260,520,520);
      ctx.restore();
    }

    function drawSwirlingHearts(now,states,intensity){
      const midX = (states.her.x+states.him.x)/2;
      const midY = (states.her.y+states.him.y)/2-58;
      const count = Math.round(6+intensity*8);

      for(let i=0;i<count;i++){
        const angle = now/(900-300*intensity)+i*(Math.PI*2/count);
        const radiusX = 45+intensity*25;
        const radiusY = 24+intensity*18;
        const rise = ((now/1800+i/count)%1)*28;
        const x = midX+Math.cos(angle)*radiusX;
        const y = midY+Math.sin(angle)*radiusY-rise;
        drawHeart(x-camera.x,y-camera.y,9+(i%3)*2,.50+.45*intensity);
      }
    }

    function drawPolishedApproach(now,elapsed){
      const states = approachStates(elapsed);
      const progress = clamp(elapsed/times.approach,0,1);
      const midX = (states.her.x+states.him.x)/2;
      const midY = (states.her.y+states.him.y)/2-45;

      drawLighting(midX,midY,.35+.65*progress);
      drawSwirlingHearts(now,states,.30+.55*progress);

      [
        {who:'her',image:scene.original.herImg,state:states.her},
        {who:'him',image:scene.original.himImg,state:states.him}
      ]
        .sort((a,b) => a.state.y-b.state.y)
        .forEach(actor => drawActor(actor.image,actor.who,actor.state));
    }

    const previousUpdate = update;
    update = function(){
      previousUpdate();
      if(!scene.active || !scene.original) return;

      const elapsed = performance.now()-scene.started;
      if(event.phase(elapsed) !== 'approach') return;

      const states = approachStates(elapsed);
      players.her.x = states.her.x;
      players.her.y = states.her.y;
      players.him.x = states.him.x;
      players.him.y = states.him.y;
    };

    const previousDraw = draw;
    draw = function(){
      const now = performance.now();
      const elapsed = scene.active ? now-scene.started : Infinity;
      const replaceApproach = scene.active && scene.original && event.phase(elapsed) === 'approach';

      if(!replaceApproach){
        previousDraw();
        return;
      }

      const activeState = scene.active;
      hideBaseActors = true;
      scene.active = false;
      try{
        previousDraw();
      } finally {
        scene.active = activeState;
        hideBaseActors = false;
      }

      drawPolishedApproach(now,elapsed);
    };
  } catch(error){
    console.warn('top-silo hammock approach polish failed',error);
  }
})();