// Final Wish Pool polish: scene arbitration, duplicate-request protection, performance budgeting,
// state recovery, subtle audio cues, pool feedback, and diagnostics.
(function(){
  'use strict';
  try{
    if(typeof window==='undefined'||typeof update!=='function'||typeof draw!=='function')return;

    const ENDPOINT='damp-cherry-8310.ashton20-bama.workers.dev';
    const POOL_WORLD={x:1333,y:816};
    const QUALITY_KEY='wishPoolQuality';
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const norm=v=>String(v||'').toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ').trim();

    let quality='auto';
    try{quality=localStorage.getItem(QUALITY_KEY)||'auto';}catch(e){}
    if(!['auto','high','low'].includes(quality))quality='auto';

    let status={mode:'idle',timer:0,label:''};
    let baseline=null;
    let wasBusy=false;
    let idleFrames=0;
    let averageFrameMs=16.7;
    let lastFrameAt=performance.now();
    let duplicateKey='';
    let duplicateAt=0;
    let duplicatePromise=null;
    let duplicateClone=null;
    let errorCount=0;
    let audioContext=null;

    function systems(){
      return{
        phase4:!!(window.WishPhase4&&window.WishPhase4.active),
        secret:!!(window.WishSecrets&&window.WishSecrets.active),
        cinema:!!(window.WishCinemaFx&&window.WishCinemaFx.active),
        phase2:!!(window.WishPhase2&&window.WishPhase2.active),
        phase1:!!(window.WishPhase1&&window.WishPhase1.active),
        dragon:!!(window.DragonBoss&&window.DragonBoss.active)
      };
    }

    function anyBusy(s=systems()){
      return s.phase4||s.secret||s.cinema||s.phase2||s.phase1||s.dragon;
    }

    function safeCall(fn){try{fn();}catch(e){errorCount++;}}

    function stopPhase1(){
      if(window.WishPhase1&&window.WishPhase1.active)safeCall(()=>window.WishPhase1.start('stop'));
    }

    function stopDragon(){
      if(window.DragonBoss&&window.DragonBoss.stop)safeCall(()=>window.DragonBoss.stop());
      else if(window.DragonBoss&&window.DragonBoss.active)safeCall(()=>window.dispatchEvent(new Event('wish-ai-scene-end')));
    }

    function arbitrate(){
      const s=systems();
      if(s.phase4||s.secret){
        if(s.cinema)safeCall(()=>window.WishCinemaFx.end());
        if(s.phase2)safeCall(()=>window.WishPhase2.end());
        stopPhase1();
        if(s.dragon)stopDragon();
      }else if(s.cinema){
        if(s.phase2)safeCall(()=>window.WishPhase2.end());
        stopPhase1();
      }else if(s.phase2){
        stopPhase1();
      }
    }

    function validNumber(v){return typeof v==='number'&&Number.isFinite(v);}

    function captureBaseline(){
      if(typeof players==='undefined'||!players.her||!players.him)return;
      baseline={
        her:{scale:players.her.scale,speed:players.her.speed},
        him:{scale:players.him.scale,speed:players.him.speed}
      };
    }

    function sanitizePlayer(p,b,clearTemps=false){
      if(!p||!b)return;
      if(!validNumber(p.scale)||p.scale<.15||p.scale>4)p.scale=b.scale;
      if(!validNumber(p.speed)||p.speed<0||p.speed>20)p.speed=b.speed;
      if(clearTemps){
        p._p2Color=0;
        p._phase2Color=0;
        p._p2Invisible=0;
        p._p2Scale=0;
        p._wishCurse=null;
      }
    }

    function restoreTemporaryState(){
      if(!baseline||typeof players==='undefined')return;
      sanitizePlayer(players.her,baseline.her,true);
      sanitizePlayer(players.him,baseline.him,true);
      if(validNumber(baseline.her.scale))players.her.scale=baseline.her.scale;
      if(validNumber(baseline.him.scale))players.him.scale=baseline.him.scale;
      if(validNumber(baseline.her.speed))players.her.speed=baseline.her.speed;
      if(validNumber(baseline.him.speed))players.him.speed=baseline.him.speed;
      baseline=null;
    }

    function stopAll(){
      safeCall(()=>window.WishPhase4&&window.WishPhase4.stop());
      safeCall(()=>window.WishSecrets&&window.WishSecrets.stop());
      safeCall(()=>window.WishCinemaFx&&window.WishCinemaFx.end());
      safeCall(()=>window.WishPhase2&&window.WishPhase2.end());
      stopPhase1();
      stopDragon();
      restoreTemporaryState();
      status={mode:'idle',timer:0,label:''};
    }

    function audio(){
      try{
        const AC=window.AudioContext||window.webkitAudioContext;
        if(!AC)return null;
        if(!audioContext)audioContext=new AC();
        if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
        return audioContext;
      }catch(e){return null;}
    }

    function tone(kind){
      const ac=audio();
      if(!ac)return;
      try{
        const now=ac.currentTime;
        const sets={
          listen:[[392,.05,.07],[523,.11,.06]],
          grant:[[523,.02,.07],[659,.09,.08],[784,.17,.09]],
          secret:[[392,.02,.08],[587,.12,.1],[880,.25,.12]],
          error:[[196,.02,.07],[147,.11,.08]]
        };
        (sets[kind]||sets.listen).forEach(([hz,at,dur])=>{
          const osc=ac.createOscillator(),gain=ac.createGain();
          osc.type=kind==='error'?'sawtooth':'sine';
          osc.frequency.setValueAtTime(hz,now+at);
          gain.gain.setValueAtTime(0.0001,now+at);
          gain.gain.exponentialRampToValueAtTime(.035,now+at+.012);
          gain.gain.exponentialRampToValueAtTime(.0001,now+at+dur);
          osc.connect(gain).connect(ac.destination);
          osc.start(now+at);osc.stop(now+at+dur+.02);
        });
      }catch(e){}
    }

    function setStatus(mode,timer,label){
      status={mode,timer,label:label||''};
    }

    function isWishRequest(input,init){
      const url=typeof input==='string'?input:(input&&input.url)||'';
      return url.includes(ENDPOINT)&&init&&init.body;
    }

    const previousFetch=window.fetch.bind(window);
    window.fetch=function(input,init){
      if(!isWishRequest(input,init))return previousFetch(input,init);

      let key='';
      try{
        const body=JSON.parse(init.body);
        key=norm(body.originalWish||body.wish);
      }catch(e){}

      const now=Date.now();
      if(key&&key===duplicateKey&&now-duplicateAt<750&&duplicatePromise){
        return duplicatePromise.then(()=>duplicateClone?duplicateClone.clone():previousFetch(input,init));
      }

      duplicateKey=key;
      duplicateAt=now;
      duplicateClone=null;
      if(!anyBusy()&&!baseline)captureBaseline();
      setStatus('thinking',360,'The Wish Pool is listening...');
      tone('listen');

      const request=previousFetch(input,init).then(response=>{
        try{duplicateClone=response.clone();}catch(e){}
        setStatus('granting',150,'Wish granted');
        tone('grant');
        return response;
      }).catch(error=>{
        errorCount++;
        setStatus('error',210,'The magic flickered. Try the wish again.');
        tone('error');
        throw error;
      });

      duplicatePromise=request;
      setTimeout(()=>{
        if(Date.now()-duplicateAt>=750){duplicatePromise=null;duplicateClone=null;}
      },850);
      return request;
    };

    function updateCoordinator(){
      arbitrate();
      const busy=anyBusy();
      if(busy&&!wasBusy){
        idleFrames=0;
        if(!baseline)captureBaseline();
      }
      if(!busy&&wasBusy)idleFrames=1;
      else if(!busy&&idleFrames>0)idleFrames++;
      if(!busy&&idleFrames===45)restoreTemporaryState();
      wasBusy=busy;

      if(status.timer>0)status.timer--;
      else if(status.mode!=='idle')status={mode:'idle',timer:0,label:''};

      if(typeof players!=='undefined'&&baseline){
        sanitizePlayer(players.her,baseline.her,false);
        sanitizePlayer(players.him,baseline.him,false);
      }
    }

    function glyphBudget(){
      if(quality==='high')return 360;
      if(quality==='low')return 150;
      if(averageFrameMs>30)return 135;
      if(averageFrameMs>23)return 200;
      return 300;
    }

    function drawPoolFeedback(){
      if(typeof ctx==='undefined'||typeof canvas==='undefined'||typeof camera==='undefined')return;
      const x=POOL_WORLD.x-camera.x,y=POOL_WORLD.y-camera.y;
      if(x<-120||x>canvas.width+120||y<-120||y>canvas.height+120)return;
      const t=performance.now()/1000;
      const active=status.mode!=='idle';
      const pulse=active?10+Math.sin(t*6)*5:4+Math.sin(t*2)*2;
      const color=status.mode==='error'?'#ff5b6e':status.mode==='granting'?'#ffe18b':'#d9a7ff';
      ctx.save();
      ctx.globalAlpha=active?.86:.28;
      ctx.strokeStyle=color;
      ctx.shadowColor=color;
      ctx.shadowBlur=active?22:10;
      ctx.lineWidth=active?4:2;
      for(let i=0;i<(active?3:1);i++){
        ctx.globalAlpha=(active?.72:.24)-i*.16;
        ctx.beginPath();
        ctx.arc(x,y-8,26+pulse+i*14,0,Math.PI*2);
        ctx.stroke();
      }
      if(status.mode==='thinking'){
        ctx.globalAlpha=.9;
        for(let i=0;i<3;i++){
          const a=t*2.4+i*Math.PI*2/3;
          ctx.fillStyle=i===0?'#fff1c8':color;
          ctx.fillRect(x+Math.cos(a)*42-3,y-8+Math.sin(a)*20-3,6,6);
        }
      }
      if(active&&status.label){
        const label=status.label.slice(0,42);
        ctx.font='bold 12px monospace';
        const w=Math.min(330,ctx.measureText(label).width+24);
        const bx=clamp(x-w/2,10,canvas.width-w-10),by=clamp(y-88,12,canvas.height-42);
        ctx.globalAlpha=.9;
        ctx.fillStyle='rgba(10,6,18,.9)';
        ctx.fillRect(bx,by,w,28);
        ctx.strokeStyle=color;ctx.strokeRect(bx,by,w,28);
        ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(label,bx+w/2,by+14);
      }
      ctx.restore();
    }

    const oldUpdate=update;
    update=function(){oldUpdate();updateCoordinator();};

    const oldDraw=draw;
    draw=function(){
      const start=performance.now();
      const nativeFillText=ctx.fillText;
      let glyphs=0;
      const budget=glyphBudget();
      ctx.fillText=function(text,x,y,maxWidth){
        const s=String(text);
        const particleLike=s.length<=10&&!/[A-Za-z0-9]{4,}/.test(s);
        if(particleLike){
          glyphs++;
          if(glyphs>budget&&glyphs%3!==0)return;
        }
        return maxWidth===undefined?nativeFillText.call(ctx,text,x,y):nativeFillText.call(ctx,text,x,y,maxWidth);
      };
      try{oldDraw();}finally{ctx.fillText=nativeFillText;}
      drawPoolFeedback();
      const elapsed=performance.now()-start;
      averageFrameMs=averageFrameMs*.94+elapsed*.06;
      const now=performance.now();
      const frameDelta=now-lastFrameAt;
      lastFrameAt=now;
      if(frameDelta>0&&frameDelta<250)averageFrameMs=averageFrameMs*.96+frameDelta*.04;
    };

    window.addEventListener('wish-secret-start',()=>{tone('secret');setStatus('granting',180,'A rare secret awakened');});
    window.addEventListener('wish-phase4-personal-start',()=>{tone('secret');setStatus('granting',200,'A personal secret awakened');});
    window.addEventListener('error',()=>{errorCount++;});
    window.addEventListener('unhandledrejection',()=>{errorCount++;});

    window.WishPoolCoordinator={
      stopAll,
      setQuality(mode){
        if(!['auto','high','low'].includes(mode))return false;
        quality=mode;
        try{localStorage.setItem(QUALITY_KEY,mode);}catch(e){}
        return true;
      },
      get quality(){return quality;},
      get activeSystems(){return systems();},
      get frameMs(){return Math.round(averageFrameMs*10)/10;},
      get status(){return status.mode;}
    };

    window.WishPoolDiagnostics={
      run(){
        const checks={
          canvas:typeof canvas!=='undefined'&&!!canvas,
          context:typeof ctx!=='undefined'&&!!ctx,
          players:typeof players!=='undefined'&&!!(players.her&&players.him),
          wishEndpoint:!!window.WISH_AI_ENDPOINT,
          phase1:!!window.WishPhase1,
          phase2:!!window.WishCinemaFx,
          memory:!!window.WishMemory,
          liveDirector:!!window.WishPhase3,
          secrets:!!window.WishSecrets,
          phase4:!!window.WishPhase4,
          dragon:!!window.DragonBoss
        };
        return{ok:Object.values(checks).every(Boolean),checks,active:systems(),quality,frameMs:Math.round(averageFrameMs*10)/10,errors:errorCount};
      },
      stopAll,
      get report(){return this.run();}
    };
  }catch(e){console.warn('wish pool final polish failed',e);}
})();
