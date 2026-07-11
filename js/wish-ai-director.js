// AI Wish Director: safely turns Cloudflare scene recipes into temporary game effects.
(function(){
  try{
    if(typeof update !== 'function' || typeof draw !== 'function') return;

    const ENDPOINT = 'damp-cherry-8310.ashton20-bama.workers.dev';
    const allowedEvents = new Set([
      'particles','meteor_strike','smoke','ghosts','bats','earthquake','flood','eclipse','blood_moon','black_sun',
      'lightning_storm','dark_portal','void','shadow_creatures','crows','dark_vines','giant_eye','red_stars',
      'angry_ducks','frog_rain','grim_reaper','skulls','red_footprints','creepy_eyes','haunted_helicopter',
      'charizard_fire','pool_hand','dancing_skeleton','defeat_player','freeze_player','stone_player','fire_player',
      'collapse_player','ghost_player','dark_bubble','shrink_player','spin_player','bat_lift','swap_players','reverse_controls',
      'shadow_clones','tornado','volcano','sinkhole','blizzard','toxic_fog','sandstorm'
    ]);

    const places = {
      silo:{x:982,y:240},
      windmill:{x:727,y:260},
      helipad:{x:108,y:525},
      cabin:{x:390,y:556},
      lake:{x:743,y:898},
      shopping:{x:1116,y:534},
      shopping_center:{x:1116,y:534},
      well:{x:140,y:293},
      hot_springs:{x:1158,y:766},
      orchard:{x:330,y:755},
      future_spot:{x:1179,y:248},
      wish_pool:{x:1333,y:816},
      center:{x:768,y:512}
    };

    let scene = null;
    let particles = [];
    let shakeX = 0, shakeY = 0;
    let reverseUntil = 0;
    let originalHer = null, originalHim = null;

    function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
    function pick(a){return a[Math.floor(Math.random()*a.length)];}
    function rand(a,b){return a+Math.random()*(b-a);}
    function targetPoint(target){
      const key=String(target||'center').toLowerCase().replace(/\s+/g,'_');
      if(key==='ashton'||key==='him'||key==='me') return {x:players.him.x,y:players.him.y};
      if(key==='tanima'||key==='her'||key==='she') return {x:players.her.x,y:players.her.y};
      if(key==='random_player') return Math.random()<.5?{x:players.her.x,y:players.her.y}:{x:players.him.x,y:players.him.y};
      return places[key] || places.center;
    }
    function normalizeEvent(e){
      if(!e || typeof e!=='object') return null;
      const type=String(e.type||'').toLowerCase();
      if(!allowedEvents.has(type)) return null;
      return {
        type,
        target:String(e.target||'center').toLowerCase(),
        amount:clamp(Number(e.amount)||10,1,60),
        intensity:clamp(Number(e.intensity)||5,1,10),
        duration:clamp(Number(e.duration)||360,30,900),
        color:String(e.color||'').slice(0,24),
        delay:clamp(Number(e.delay)||0,0,600),
        started:false,
        timer:0
      };
    }
    function normalizeScene(raw){
      if(!raw || typeof raw!=='object') return null;
      const events=(Array.isArray(raw.events)?raw.events:[]).map(normalizeEvent).filter(Boolean).slice(0,10);
      if(!events.length) return null;
      return {
        title:String(raw.title||'The Wish Director').slice(0,60),
        message:String(raw.message||'The wish twists reality for a moment.').replace(/\s+/g,' ').slice(0,180),
        overlay:String(raw.overlay||'none').toLowerCase(),
        duration:clamp(Number(raw.duration)||600,120,1200),
        timer:0,
        events
      };
    }

    const realFetch = window.fetch.bind(window);
    window.fetch = async function(input, init){
      const response = await realFetch(input, init);
      try{
        const url = typeof input==='string' ? input : (input && input.url) || '';
        if(url.includes(ENDPOINT)){
          response.clone().json().then(data=>{
            const recipe=normalizeScene(data.scene || data.recipe || data);
            if(recipe) startScene(recipe);
          }).catch(()=>{});
        }
      }catch(e){}
      return response;
    };

    function startScene(recipe){
      scene=recipe;
      particles=[];
      originalHer={x:players.her.x,y:players.her.y,scale:players.her.scale,speed:players.her.speed};
      originalHim={x:players.him.x,y:players.him.y,scale:players.him.scale,speed:players.him.speed};
      window.dispatchEvent(new CustomEvent('wish-ai-scene-start',{detail:recipe}));
    }
    function endScene(){
      if(originalHer){players.her.scale=originalHer.scale;players.her.speed=originalHer.speed;}
      if(originalHim){players.him.scale=originalHim.scale;players.him.speed=originalHim.speed;}
      reverseUntil=0; particles=[]; scene=null; shakeX=0; shakeY=0;
      window.dispatchEvent(new CustomEvent('wish-ai-scene-end'));
    }

    function playerFor(target){
      const t=String(target||'').toLowerCase();
      if(['ashton','him','me'].includes(t)) return players.him;
      if(['tanima','her','she'].includes(t)) return players.her;
      if(t==='random_player') return Math.random()<.5?players.her:players.him;
      return players.him;
    }
    function beginEvent(e){
      e.started=true; e.timer=0;
      if(e.type==='swap_players'){
        const x=players.her.x,y=players.her.y; players.her.x=players.him.x;players.her.y=players.him.y;players.him.x=x;players.him.y=y;
      }
      if(e.type==='reverse_controls') reverseUntil=performance.now()+e.duration*16.67;
      if(['defeat_player','collapse_player','freeze_player','stone_player','fire_player','ghost_player','dark_bubble','shrink_player','spin_player','bat_lift'].includes(e.type)){
        const p=playerFor(e.target); p._wishCurse={type:e.type,timer:e.duration,max:e.duration};
        if(e.type==='shrink_player') p.scale*=.45;
        if(['defeat_player','collapse_player','freeze_player','stone_player','dark_bubble'].includes(e.type)) p.speed=0;
      }
      if(e.type==='earthquake') e.duration=Math.max(e.duration,240);
    }

    function addParticle(type,x,y,opts={}){
      particles.push({type,x,y,vx:opts.vx??rand(-1,1),vy:opts.vy??rand(-1,1),life:opts.life||180,size:opts.size||rand(3,8),color:opts.color||'#ffffff',phase:rand(0,100)});
    }
    function spawnForEvent(e){
      const p=targetPoint(e.target); const n=e.type==='particles'?e.amount:Math.max(1,Math.ceil(e.intensity/3));
      for(let i=0;i<n;i++){
        switch(e.type){
          case 'meteor_strike': addParticle('meteor',p.x-rand(220,360),p.y-rand(180,300),{vx:rand(4,7),vy:rand(3,5),life:90,size:rand(8,16),color:'#ffb347'}); break;
          case 'smoke': addParticle('smoke',p.x+rand(-35,35),p.y+rand(-25,25),{vy:rand(-1.2,-.3),life:220,size:rand(10,22),color:'#403848'}); break;
          case 'ghosts': case 'ghost_player': addParticle('ghost',p.x+rand(-100,100),p.y+rand(-60,80),{vy:rand(-1.1,-.3),life:240,size:rand(7,14)}); break;
          case 'bats': case 'bat_lift': addParticle('bat',p.x+rand(-140,140),p.y+rand(-80,80),{vx:rand(-2,2),vy:rand(-1,1),life:200,size:rand(5,10)}); break;
          case 'crows': addParticle('crow',rand(0,WORLD_W),rand(60,500),{vx:rand(1.5,3),life:260,size:rand(6,11)}); break;
          case 'red_stars': addParticle('star',rand(0,WORLD_W),rand(0,WORLD_H),{life:180,size:rand(4,9),color:'#ff304f'}); break;
          case 'angry_ducks': addParticle('duck',rand(-80,0),rand(300,WORLD_H-50),{vx:rand(1.5,3.5),life:330,size:rand(5,9)}); break;
          case 'frog_rain': addParticle('frog',rand(0,WORLD_W),-20,{vy:rand(2,5),life:260,size:rand(5,9)}); break;
          case 'skulls': addParticle('skull',rand(0,WORLD_W),-20,{vy:rand(1,3),life:260,size:rand(6,11)}); break;
          case 'red_footprints': addParticle('foot',p.x+rand(-80,80),p.y+rand(-80,80),{vx:0,vy:0,life:260,size:rand(4,7),color:'#a40018'}); break;
          case 'creepy_eyes': addParticle('eye',rand(0,WORLD_W),rand(0,WORLD_H),{vx:0,vy:0,life:180,size:rand(6,12)}); break;
          case 'shadow_creatures': case 'shadow_clones': addParticle('shadow',p.x+rand(-150,150),p.y+rand(-100,100),{life:240,size:rand(8,15)}); break;
          case 'dark_vines': addParticle('vine',p.x+rand(-100,100),p.y+rand(-60,60),{vx:0,vy:rand(-.4,0),life:260,size:rand(5,10)}); break;
          case 'lightning_storm': addParticle('bolt',rand(0,WORLD_W),rand(0,500),{vx:0,vy:0,life:18,size:rand(10,20),color:'#fff176'}); break;
          case 'volcano': case 'charizard_fire': case 'fire_player': addParticle('fire',p.x+rand(-80,80),p.y+rand(-60,60),{vy:rand(-2,-.5),life:120,size:rand(6,14),color:'#ff6a2a'}); break;
          case 'blizzard': addParticle('snow',rand(0,WORLD_W),-20,{vx:rand(-2,2),vy:rand(1,4),life:260,size:rand(3,8)}); break;
          case 'toxic_fog': case 'sandstorm': addParticle('fog',rand(0,WORLD_W),rand(0,WORLD_H),{vx:rand(.2,1),life:220,size:rand(18,34),color:e.type==='sandstorm'?'#b48b55':'#71b86b'}); break;
          case 'tornado': addParticle('debris',p.x+rand(-80,80),p.y+rand(-120,120),{vx:rand(-2,2),vy:rand(-2,2),life:160,size:rand(4,9)}); break;
          case 'flood': addParticle('wave',rand(0,WORLD_W),WORLD_H-rand(0,160),{vx:rand(.5,2),vy:0,life:180,size:rand(8,16),color:'#3978b8'}); break;
          default: addParticle('spark',p.x+rand(-100,100),p.y+rand(-100,100),{life:140,size:rand(3,8),color:e.color||'#d9a7ff'});
        }
      }
    }

    const oldMovePlayer=movePlayer;
    movePlayer=function(p,input){
      if(performance.now()<reverseUntil){input={up:input.down,down:input.up,left:input.right,right:input.left};}
      if(p._wishCurse && p._wishCurse.timer>0 && ['defeat_player','collapse_player','freeze_player','stone_player','dark_bubble'].includes(p._wishCurse.type)) return;
      oldMovePlayer(p,input);
    };

    function updateDirector(){
      if(!scene) return;
      scene.timer++;
      shakeX=0;shakeY=0;
      scene.events.forEach(e=>{
        if(!e.started && scene.timer>=e.delay) beginEvent(e);
        if(!e.started) return;
        e.timer++;
        if(e.type==='earthquake' && e.timer<e.duration){shakeX=rand(-e.intensity,e.intensity);shakeY=rand(-e.intensity,e.intensity);}
        if(e.timer<e.duration && e.timer%Math.max(2,12-e.intensity)===0) spawnForEvent(e);
      });
      [players.her,players.him].forEach(p=>{
        if(p._wishCurse){p._wishCurse.timer--; if(p._wishCurse.type==='spin_player') p.dir=pick(['up','down','left','right']); if(p._wishCurse.type==='bat_lift') p.y-=.35;
          if(p._wishCurse.timer<=0){p._wishCurse=null; if(originalHer&&p===players.her){p.scale=originalHer.scale;p.speed=originalHer.speed;} if(originalHim&&p===players.him){p.scale=originalHim.scale;p.speed=originalHim.speed;}}
        }
      });
      particles=particles.filter(p=>{p.life--;p.phase++;p.x+=p.vx||0;p.y+=p.vy||0;return p.life>0;});
      if(scene.timer>=scene.duration) endScene();
    }

    function sx(x){return x-camera.x+shakeX;} function sy(y){return y-camera.y+shakeY;}
    function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
    function circle(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
    function drawP(p){
      const x=sx(p.x),y=sy(p.y),s=p.size,a=clamp(p.life/60,0,1);ctx.save();ctx.globalAlpha=a;
      if(p.type==='meteor'){ctx.shadowColor='#ff6a2a';ctx.shadowBlur=18;circle(x,y,s,'#ffb347');rect(x-s*5,y-s*.5,s*5,s,'rgba(255,100,30,.65)');}
      else if(p.type==='smoke'||p.type==='fog'){ctx.globalAlpha*=.45;circle(x,y,s,p.color);circle(x+s*.7,y-s*.3,s*.75,p.color);}
      else if(p.type==='ghost'){ctx.globalAlpha*=.72;circle(x,y-s,s,'#e9e4ff');rect(x-s,y-s,s*2,s*2,'#e9e4ff');circle(x-s*.35,y-s,1.5,'#191225');circle(x+s*.35,y-s,1.5,'#191225');}
      else if(p.type==='bat'||p.type==='crow'){rect(x-s*2,y,s*2,s,'#17131f');rect(x+s*.2,y,s*2,s,'#17131f');rect(x-s*.2,y-s*.3,s*.5,s*.8,'#17131f');}
      else if(p.type==='star'){rect(x-s/2,y-s*2,s,s*4,p.color);rect(x-s*2,y-s/2,s*4,s,p.color);}
      else if(p.type==='duck'){rect(x,y,s*4,s*2,'#ffd957');rect(x+s*3,y-s,s*2,s*2,'#ffd957');}
      else if(p.type==='frog'){rect(x-s*2,y-s,s*4,s*2,'#70d86b');rect(x-s*1.5,y-s*2,s,s,'#70d86b');rect(x+s*.5,y-s*2,s,s,'#70d86b');}
      else if(p.type==='skull'){circle(x,y,s,'#e8e1d5');rect(x-s*.7,y+s*.5,s*1.4,s,'#e8e1d5');circle(x-s*.35,y-s*.1,s*.2,'#111');circle(x+s*.35,y-s*.1,s*.2,'#111');}
      else if(p.type==='eye'){circle(x,y,s,'#f1e6df');circle(x,y,s*.45,'#c9002b');circle(x,y,s*.18,'#111');}
      else if(p.type==='shadow'){ctx.globalAlpha*=.55;circle(x,y-s,s,'#0a0710');rect(x-s,y-s,s*2,s*3,'#0a0710');}
      else if(p.type==='vine'){rect(x,y,s*.6,s*5,'#24102d');circle(x-s,y+s,s,'#3a1748');}
      else if(p.type==='bolt'){ctx.shadowColor='#fff176';ctx.shadowBlur=20;rect(x,y,s*.45,s*5,'#fff176');}
      else if(p.type==='fire'){ctx.shadowColor='#ff6a2a';ctx.shadowBlur=16;circle(x,y,s,p.color);circle(x,y-s*.8,s*.55,'#ffe068');}
      else if(p.type==='snow'){circle(x,y,s,'#fff');}
      else if(p.type==='wave'){ctx.strokeStyle=p.color;ctx.lineWidth=Math.max(2,s/3);ctx.beginPath();ctx.moveTo(x-s*2,y);ctx.quadraticCurveTo(x,y-s,x+s*2,y);ctx.stroke();}
      else if(p.type==='foot'){rect(x-s,y-s,s*.8,s*2,p.color);rect(x+s*.2,y,s*.8,s*1.5,p.color);}
      else {circle(x,y,s,p.color||'#d9a7ff');}
      ctx.restore();
    }

    function drawOverlay(){
      if(!scene) return;
      const alpha=Math.min(.48,scene.timer/90*.35);ctx.save();ctx.globalAlpha=alpha;
      const o=scene.overlay;
      const colors={eclipse:'#080611',blood_moon:'#7b0018',black_sun:'#05030a',void:'#09000f',storm:'#18202f',flood:'#184c78',toxic:'#315c35',sand:'#795d3d'};
      ctx.fillStyle=colors[o]||'rgba(0,0,0,0)';ctx.fillRect(0,0,canvas.width,canvas.height);
      if(o==='blood_moon'||o==='eclipse'||o==='black_sun'){const cx=canvas.width*.82,cy=canvas.height*.18,r=Math.min(canvas.width,canvas.height)*.09;circle(cx,cy,r,o==='blood_moon'?'#b40025':'#07060b');if(o==='eclipse'){ctx.strokeStyle='#f1d27a';ctx.lineWidth=5;ctx.beginPath();ctx.arc(cx,cy,r+3,0,Math.PI*2);ctx.stroke();}}
      ctx.restore();
    }

    const oldDrawSprite=drawSprite;
    drawSprite=function(p){
      const curse=p._wishCurse;
      if(!curse){oldDrawSprite(p);return;}
      ctx.save();
      if(['defeat_player','collapse_player'].includes(curse.type)){
        const x=p.x-camera.x,y=p.y-camera.y;ctx.translate(x,y);ctx.rotate(Math.PI/2);ctx.translate(-x,-y);ctx.globalAlpha=.9;ctx.filter='sepia(1) saturate(8) hue-rotate(315deg)';oldDrawSprite(p);
      }else{
        if(curse.type==='freeze_player') ctx.filter='hue-rotate(160deg) saturate(2) brightness(1.25)';
        else if(curse.type==='stone_player') ctx.filter='grayscale(1) contrast(1.25)';
        else if(curse.type==='fire_player') ctx.filter='sepia(1) saturate(6) hue-rotate(330deg)';
        else ctx.filter='sepia(1) saturate(5) hue-rotate(300deg)';
        oldDrawSprite(p);
      }
      ctx.restore();
    };

    function drawTitle(){
      if(!scene) return; const w=Math.min(680,canvas.width-40),x=(canvas.width-w)/2,y=canvas.height-104;
      ctx.save();ctx.globalAlpha=.9;ctx.fillStyle='rgba(8,4,14,.9)';ctx.strokeStyle='#8e3aff';ctx.lineWidth=3;roundRect(x,y,w,76,12,true,true);ctx.fillStyle='#d9a7ff';ctx.font='bold 18px monospace';ctx.fillText(scene.title,x+18,y+28);ctx.fillStyle='#fff';ctx.font='14px monospace';ctx.fillText(scene.message.slice(0,78),x+18,y+54);ctx.restore();
    }

    const oldUpdate=update;update=function(){oldUpdate();updateDirector();};
    const oldDraw=draw;draw=function(){ctx.save();ctx.translate(shakeX,shakeY);oldDraw();ctx.restore();drawOverlay();particles.forEach(drawP);drawTitle();};
  }catch(e){console.warn('wish-ai-director failed',e);}
})();