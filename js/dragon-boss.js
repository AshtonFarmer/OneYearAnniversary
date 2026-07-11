// Large animated dragon boss used by AI Wish Director scenes.
(function(){
  try{
    if(typeof update !== 'function' || typeof draw !== 'function') return;

    const dragonImg = new Image();
    const dragonSheet = document.createElement('canvas');
    const dragonSheetCtx = dragonSheet.getContext('2d',{willReadFrequently:true});
    let dragonSource = dragonImg;
    let sourceFrameW = 256;
    let sourceFrameH = 256;
    let dragonReady = false;

    dragonImg.onload = function(){
      sourceFrameW = dragonImg.naturalWidth / 4;
      sourceFrameH = dragonImg.naturalHeight / 4;

      dragonSheet.width = dragonImg.naturalWidth;
      dragonSheet.height = dragonImg.naturalHeight;
      dragonSheetCtx.clearRect(0,0,dragonSheet.width,dragonSheet.height);
      dragonSheetCtx.drawImage(dragonImg,0,0);

      // Some image tools export the transparency checkerboard as real pixels.
      // Remove only very bright neutral gray/white pixels while preserving fire,
      // horns, eyes, and the dragon's colored highlights.
      try{
        const imageData = dragonSheetCtx.getImageData(0,0,dragonSheet.width,dragonSheet.height);
        const data = imageData.data;
        for(let i=0;i<data.length;i+=4){
          const r=data[i], g=data[i+1], b=data[i+2];
          const max=Math.max(r,g,b), min=Math.min(r,g,b);
          const neutral=(max-min)<13;
          if(neutral && min>205) data[i+3]=0;
        }
        dragonSheetCtx.putImageData(imageData,0,0);
        dragonSource = dragonSheet;
      }catch(e){
        dragonSource = dragonImg;
      }

      dragonReady = true;
    };
    dragonImg.src = 'assets/sprites/dragon_sprite.png';

    const hoverFrames = [0,1,2,3];
    const fireFrames = [8,9,10,11];
    const roarFrame = 12;
    const diveFrame = 13;
    const impactFrame = 14;
    const recoverFrame = 15;

    let dragon = null;
    let embers = [];

    function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
    function rand(a,b){return a+Math.random()*(b-a);}
    function targetFromRecipe(recipe){
      const ev=(recipe.events||[]).find(e=>e.type==='charizard_fire' || e.type==='defeat_player' || e.type==='fire_player');
      const t=String(ev?.target||'ashton').toLowerCase();
      if(['tanima','her','she'].includes(t)) return players.her;
      return players.him;
    }
    function spawnDragon(recipe={}){
      const target=targetFromRecipe(recipe);
      dragon={
        target,
        timer:0,
        duration:760,
        x:-320,
        y:Math.max(80,target.y-250),
        scale:1.18,
        state:'enter',
        frame:hoverFrames[0],
        attackDone:false,
        impactDone:false
      };
      embers=[];
    }

    window.addEventListener('wish-ai-scene-start',e=>{
      const recipe=e.detail||{};
      if((recipe.events||[]).some(ev=>ev.type==='charizard_fire')) spawnDragon(recipe);
    });
    window.addEventListener('wish-ai-scene-end',()=>{dragon=null;embers=[];});

    window.DragonBoss={spawn:spawnDragon,get active(){return !!dragon;}};

    function addEmber(x,y){
      embers.push({x,y,vx:rand(-1.1,1.1),vy:rand(-2.6,-.8),life:rand(28,60),size:rand(3,8)});
    }

    function updateDragon(){
      if(!dragon) return;
      dragon.timer++;
      const target=dragon.target;
      const tx=target.x;
      const ty=target.y-110;

      if(dragon.timer<140){
        dragon.state='enter';
        dragon.x += (tx-170-dragon.x)*.035;
        dragon.y += (ty-dragon.y)*.03;
        dragon.frame=hoverFrames[Math.floor(dragon.timer/8)%hoverFrames.length];
      }else if(dragon.timer<260){
        dragon.state='circle';
        const a=(dragon.timer-140)/18;
        dragon.x=tx+Math.cos(a)*170;
        dragon.y=ty+Math.sin(a)*75;
        dragon.frame=4+(Math.floor(dragon.timer/16)%4);
      }else if(dragon.timer<330){
        dragon.state='roar';
        dragon.x += (tx-dragon.x)*.08;
        dragon.y += (ty-20-dragon.y)*.08;
        dragon.frame=roarFrame;
      }else if(dragon.timer<420){
        dragon.state='fire';
        dragon.frame=fireFrames[Math.floor((dragon.timer-330)/10)%fireFrames.length];
        for(let i=0;i<4;i++) addEmber(target.x+rand(-20,20),target.y-rand(10,100));
      }else if(dragon.timer<485){
        dragon.state='dive';
        dragon.frame=diveFrame;
        dragon.x += (tx-dragon.x)*.18;
        dragon.y += (target.y-30-dragon.y)*.18;
      }else if(dragon.timer<525){
        dragon.state='impact';
        dragon.frame=impactFrame;
        if(!dragon.impactDone){
          dragon.impactDone=true;
          for(let i=0;i<46;i++) addEmber(target.x+rand(-55,55),target.y+rand(-20,20));
        }
      }else if(dragon.timer<610){
        dragon.state='recover';
        dragon.frame=recoverFrame;
        dragon.y-=1.1;
      }else{
        dragon.state='exit';
        dragon.frame=hoverFrames[Math.floor(dragon.timer/8)%hoverFrames.length];
        dragon.x+=5.4;
        dragon.y-=1.1;
      }

      embers=embers.filter(e=>{e.life--;e.x+=e.vx;e.y+=e.vy;e.vy+=.035;return e.life>0;});
      if(dragon.timer>dragon.duration || dragon.x>WORLD_W+360){dragon=null;embers=[];}
    }

    function drawShadow(){
      if(!dragon) return;
      const target=dragon.target;
      const lift=clamp((target.y-dragon.y)/280,.15,1);
      const x=dragon.x-camera.x;
      const y=target.y-camera.y+20;
      ctx.save();
      ctx.globalAlpha=.32*(1-lift*.35);
      ctx.fillStyle='#120a0a';
      ctx.beginPath();
      ctx.ellipse(x,y,95*dragon.scale,34*dragon.scale,0,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    function drawDragon(){
      if(!dragon || !dragonReady) return;
      drawShadow();
      const col=dragon.frame%4;
      const row=Math.floor(dragon.frame/4);
      const drawSize=256*dragon.scale;
      const x=Math.round(dragon.x-camera.x-drawSize/2);
      const bob=Math.sin(dragon.timer/7)*5;
      const y=Math.round(dragon.y-camera.y-drawSize/2+bob);
      ctx.save();
      if(dragon.state==='fire' || dragon.state==='impact'){
        ctx.shadowColor='#ff5a1f';
        ctx.shadowBlur=28;
      }
      ctx.drawImage(
        dragonSource,
        col*sourceFrameW,row*sourceFrameH,sourceFrameW,sourceFrameH,
        x,y,drawSize,drawSize
      );
      ctx.restore();

      embers.forEach(e=>{
        const a=clamp(e.life/45,0,1);
        ctx.save();ctx.globalAlpha=a;ctx.shadowColor='#ff6a1f';ctx.shadowBlur=10;
        ctx.fillStyle=e.life%2?'#ff8a2a':'#ffe05a';
        ctx.fillRect(e.x-camera.x,e.y-camera.y,e.size,e.size);
        ctx.restore();
      });
    }

    const oldUpdate=update;
    update=function(){oldUpdate();updateDragon();};
    const oldDraw=draw;
    draw=function(){oldDraw();drawDragon();};
  }catch(e){console.warn('dragon-boss failed',e);}
})();