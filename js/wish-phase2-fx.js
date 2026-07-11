// Phase 2 cinematic FX runtime, extended for Phase 3 live scene editing.
(function(){
  try{
    if(typeof update !== 'function' || typeof draw !== 'function') return;

    const rnd=(a,b)=>a+Math.random()*(b-a);
    const pick=a=>a[Math.floor(Math.random()*a.length)];
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

    const PALETTES={
      romance:['#ff6bb5','#ffd1e8','#ffe18b'],
      holi:['#ff315d','#ff9b2f','#ffd93d','#4fe06a','#3da8ff','#a45cff'],
      gold:['#ffd957','#ffe18b','#ffb84d'],
      cozy:['#ffd6a5','#fff1c8','#d9a7ff'],
      storm:['#8ee8ff','#dce7ff','#fff176'],
      space:['#fff1a8','#d9a7ff','#8ee8ff'],
      dark:['#a40018','#32113f','#111018'],
      food:['#ffb56b','#ffd6a5','#fff1c8'],
      red:['#ff304f','#a40018','#ffd1d8'],
      blue:['#4fb6ff','#8ee8ff','#dce7ff'],
      green:['#54e36f','#b8ffad','#e4ffd9'],
      purple:['#a86cff','#d9a7ff','#f2dcff'],
      white:['#ffffff','#e9e4ff','#fff1c8']
    };

    let scene=null;
    let motes=[];
    let savedPlayers=null;
    let editHistory=[];

    function deepCopy(value){
      try{return JSON.parse(JSON.stringify(value));}catch(e){return null;}
    }

    function selectedPlayers(){
      if(!scene) return [];
      if(scene.target === 'both') return [players.her,players.him];
      if(scene.target === players.her || scene.target === 'tanima') return [players.her];
      if(scene.target === players.him || scene.target === 'ashton') return [players.him];
      return [players.him];
    }

    function inferGroup(type,icons){
      const joined=(icons||[]).join(' ');
      if(/[❤♥💗💋]/u.test(joined)) return 'hearts';
      if(/[🌸🌹❀]/u.test(joined)) return 'flowers';
      if(joined.includes('🦋')) return 'butterflies';
      if(/[💵💸💰🪙💳💎]/u.test(joined) || type==='money') return 'money';
      if(joined.includes('👻')) return 'ghosts';
      if(joined.includes('🦇')) return 'bats';
      if(joined.includes('🦆')) return 'ducks';
      if(joined.includes('🐸')) return 'frogs';
      if(/[🐈🐕🐾]/u.test(joined) || type==='pet') return 'pets';
      if(/[🍛🥘🥟🍚🫖🥭🍕🍔🍟🌮🍪🍦🍩🍰🍿☕]/u.test(joined)) return 'food';
      if(/[🏮🪔]/u.test(joined)) return 'lanterns';
      if(/[♪♫♬]/u.test(joined)) return 'music';
      if(type==='rain') return 'rain';
      if(type==='snow') return 'snow';
      if(type==='fire') return 'fire';
      if(type==='star'||type==='redstar') return 'stars';
      if(type==='comet') return 'comets';
      if(type==='powder'||type==='confetti') return 'holi';
      if(type==='firework') return 'fireworks';
      if(type==='steam') return 'smoke';
      return type;
    }

    function anchorScreen(){
      if(!scene) return {x:canvas.width/2,y:canvas.height/2};
      const world=scene.anchor || scene.pl;
      if(Array.isArray(world)) return {x:world[0]-camera.x,y:world[1]-camera.y};
      return {x:canvas.width/2,y:canvas.height/2};
    }

    function mote(type,x,y,opts={}){
      const palette=scene&&scene.p&&scene.p.length?scene.p:PALETTES.cozy;
      motes.push({
        type,x,y,
        vx:opts.vx??rnd(-1,1),vy:opts.vy??rnd(-1,1),
        life:opts.life||220,size:opts.size||rnd(7,18),
        color:opts.color||pick(palette),phase:rnd(0,100),
        icon:opts.icon||'',group:opts.group||inferGroup(type,[opts.icon||'']),
        frozen:false
      });
    }

    function burst(type,count,mode='screen',icons=[],group=''){
      if(!scene) return;
      const total=Math.max(1,Math.round(count*(scene.level||1)));
      const anchor=anchorScreen();
      const useAnchor=!!scene.anchor;
      for(let i=0;i<total;i++){
        let x=useAnchor?anchor.x+rnd(-120,120):rnd(0,canvas.width);
        let y=useAnchor?anchor.y+rnd(-80,80):rnd(0,canvas.height);
        if(mode==='top'){y=-30;x=useAnchor?anchor.x+rnd(-150,150):rnd(0,canvas.width);}
        if(mode==='bottom'){y=canvas.height+30;x=useAnchor?anchor.x+rnd(-150,150):rnd(0,canvas.width);}
        const icon=icons.length?pick(icons):'';
        mote(type,x,y,{
          vx:rnd(-1.8,1.8),
          vy:mode==='top'?rnd(.8,2.4):mode==='bottom'?rnd(-2.4,-.8):rnd(-1.2,1.2),
          life:rnd(160,340),icon,group:group||inferGroup(type,icons)
        });
      }
    }

    function act(action){
      action.done=true;
      const n=action.n||30;
      const chosen=selectedPlayers();
      const first=chosen[0]||players.him;
      switch(action.type){
        case 'together': {
          const x=(players.her.x+players.him.x)/2;
          const y=(players.her.y+players.him.y)/2;
          players.her.x=x-16;players.him.x=x+16;
          players.her.y=players.him.y=y;
          break;
        }
        case 'dance': scene.dance=scene.t+180;break;
        case 'color': chosen.length?chosen.forEach(p=>p._p2Color=scene.t+300):(players.her._p2Color=players.him._p2Color=scene.t+300);break;
        case 'icons': burst('icon',n,action.mode,action.icons);break;
        case 'powder': burst('powder',n,'screen',[],'holi');scene.flash=10;break;
        case 'confetti': burst('confetti',n,'top',[],'holi');break;
        case 'fireworks': burst('firework',n,'screen',[],'fireworks');scene.flash=18;break;
        case 'steam': burst('steam',n,'bottom',[],'smoke');break;
        case 'orbit': burst('orbit',n,'screen',action.icons,inferGroup('icon',action.icons));break;
        case 'feast': scene.feast={icons:action.icons,until:scene.t+220};break;
        case 'pets': burst('pet',n,'screen',action.icons,'pets');break;
        case 'nap': scene.nap={icons:action.icons,until:scene.t+220};break;
        case 'money': burst('money',n,'screen',[],'money');break;
        case 'treasure': scene.treasure=scene.t+210;break;
        case 'flash': scene.flash=24;break;
        case 'fireflies': burst('firefly',n,'screen',[],'fireflies');break;
        case 'rain': burst('rain',n,'top',[],'rain');break;
        case 'snow': burst('snow',n,'top',[],'snow');break;
        case 'ice': scene.ice=scene.t+260;break;
        case 'sunset': scene.sunset=scene.t+260;break;
        case 'bolt': burst('bolt',n,'screen',[],'lightning');scene.shake=5;break;
        case 'stars': burst('star',n,'screen',[],'stars');break;
        case 'redstars': burst('redstar',n,'screen',[],'stars');break;
        case 'comets': burst('comet',n,'screen',[],'comets');break;
        case 'moon': mote('moon',canvas.width*.82,canvas.height*.18,{vx:0,vy:0,life:360,size:55,group:'moon'});break;
        case 'aurora': burst('aurora',n,'screen',[],'aurora');break;
        case 'invisible': chosen.forEach(p=>p._p2Invisible=scene.t+260);break;
        case 'levitate': scene.levitate=scene.t+190;break;
        case 'teleport': {
          scene.flash=30;
          const x=players.her.x,y=players.her.y;
          players.her.x=players.him.x;players.her.y=players.him.y;
          players.him.x=x;players.him.y=y;
          break;
        }
        case 'scale': chosen.forEach(p=>{p.scale*=action.v;p._p2Scale=scene.t+280;});break;
        case 'crown': scene.crown=scene.t+240;break;
        case 'spin': scene.spin=scene.t+180;break;
        case 'boom': scene.boom=scene.t+120;scene.flash=12;break;
        case 'dark': scene.flash=8;break;
        case 'darkflash': scene.flash=25;scene.shake=8;break;
        case 'shield': scene.shield=scene.t+240;break;
        case 'kiss': scene.kiss=scene.t+160;break;
        case 'dragon':
          if(window.DragonBoss) window.DragonBoss.spawn({events:[{type:'charizard_fire',target:first===players.her?'tanima':'ashton'}]});
          break;
        case 'smoke': {
          const point=action.pl||scene.pl||[camera.x+canvas.width/2,camera.y+canvas.height/2];
          const p={x:point[0]-camera.x,y:point[1]-camera.y};
          for(let i=0;i<n;i++) mote('steam',p.x+rnd(-60,60),p.y+rnd(-30,30),{vy:rnd(-1.2,-.3),color:'#403848',size:rnd(12,25),group:'smoke'});
          break;
        }
        case 'meteor': {
          const point=action.pl||scene.pl||[camera.x+canvas.width/2,camera.y+canvas.height/2];
          const p={x:point[0]-camera.x,y:point[1]-camera.y};
          for(let i=0;i<8;i++) mote('comet',p.x-rnd(180,320),p.y-rnd(160,260),{vx:rnd(4,7),vy:rnd(3,5),life:100,size:rnd(10,18),group:'comets'});
          scene.shake=9;
          break;
        }
        case 'rare': mote('comet',-80,rnd(60,canvas.height*.35),{vx:7,vy:2,life:260,size:18,group:'comets'});break;
      }
    }

    function saveEditSnapshot(){
      if(!scene) return;
      editHistory.push({
        scene:{
          level:scene.level,d:scene.d,rate:scene.rate,p:deepCopy(scene.p),dark:scene.dark,
          holi:scene.holi,target:scene.target,anchor:deepCopy(scene.anchor),pl:deepCopy(scene.pl),
          title:scene.title,m:scene.m,particleMode:scene.particleMode
        },
        motes:deepCopy(motes)
      });
      editHistory=editHistory.slice(-12);
    }

    function undoModify(){
      if(!scene||!editHistory.length) return false;
      const snap=editHistory.pop();
      Object.assign(scene,snap.scene);
      motes=snap.motes||[];
      scene.flash=10;
      return true;
    }

    const SUBJECTS={
      hearts:{type:'icon',mode:'bottom',icons:['❤','♥','💗','💋'],count:42},
      flowers:{type:'icon',mode:'top',icons:['🌸','🌹','❀'],count:40},
      butterflies:{type:'icon',mode:'screen',icons:['🦋'],count:36},
      money:{type:'icon',mode:'top',icons:['💵','💸','💰','🪙','💎'],count:70},
      diamonds:{type:'icon',mode:'top',icons:['💎','✨'],count:42,group:'money'},
      rain:{type:'rain',mode:'top',icons:[],count:70},
      snow:{type:'snow',mode:'top',icons:[],count:70},
      fire:{type:'fire',mode:'screen',icons:[],count:48},
      ghosts:{type:'icon',mode:'bottom',icons:['👻'],count:34},
      bats:{type:'icon',mode:'screen',icons:['🦇'],count:38},
      ducks:{type:'icon',mode:'screen',icons:['🦆'],count:36},
      frogs:{type:'icon',mode:'top',icons:['🐸'],count:38},
      stars:{type:'star',mode:'screen',icons:[],count:55},
      comets:{type:'comet',mode:'screen',icons:[],count:18},
      fireworks:{type:'firework',mode:'screen',icons:[],count:24},
      holi:{type:'powder',mode:'screen',icons:[],count:85},
      food:{type:'icon',mode:'top',icons:['🍛','🥘','🥟','🍚','🫖','🥭','🍕','🍔','🍟','🌮','🍪','🍰'],count:58},
      pets:{type:'pet',mode:'screen',icons:['🐈‍⬛','🐈','🐕'],count:24},
      binx:{type:'pet',mode:'screen',icons:['🐈‍⬛'],count:12,group:'pets'},
      loki:{type:'pet',mode:'screen',icons:['🐈‍⬛'],count:12,group:'pets'},
      casper:{type:'pet',mode:'screen',icons:['🐈'],count:12,group:'pets'},
      mojo:{type:'pet',mode:'screen',icons:['🐕'],count:12,group:'pets'},
      dallas:{type:'pet',mode:'screen',icons:['🐕'],count:12,group:'pets'},
      lanterns:{type:'icon',mode:'bottom',icons:['🏮','🪔','✨'],count:28},
      music:{type:'icon',mode:'bottom',icons:['♪','♫','♬'],count:26},
      smoke:{type:'steam',mode:'bottom',icons:[],count:30}
    };

    function addSubject(subject,countMultiplier=1){
      if(subject==='dragon'){
        act({type:'dragon',done:false});
        return true;
      }
      const spec=SUBJECTS[subject];
      if(!spec) return false;
      burst(spec.type,Math.round(spec.count*countMultiplier),spec.mode,spec.icons,spec.group||subject);
      if(subject==='fireworks') scene.flash=16;
      if(subject==='holi'){scene.holi=true;scene.p=PALETTES.holi.slice();scene.flash=10;}
      if(subject==='fire') scene.flash=8;
      return true;
    }

    function removeSubject(subject){
      const aliases={diamonds:'money',binx:'pets',loki:'pets',casper:'pets',mojo:'pets',dallas:'pets'};
      const group=aliases[subject]||subject;
      const before=motes.length;
      motes=motes.filter(q=>q.group!==group);
      if(subject==='dragon'&&window.DragonBoss&&window.DragonBoss.stop) window.DragonBoss.stop();
      return motes.length!==before||subject==='dragon';
    }

    function setTarget(value){
      if(value==='tanima') scene.target=players.her;
      else if(value==='ashton') scene.target=players.him;
      else if(value==='both') scene.target='both';
      else return false;
      return true;
    }

    function moveScene(location){
      if(!location||!Array.isArray(location.coords)) return false;
      const old=anchorScreen();
      scene.anchor=location.coords.slice(0,2);
      scene.pl=location.coords.slice(0,2);
      const next=anchorScreen();
      const dx=next.x-old.x,dy=next.y-old.y;
      motes.forEach(q=>{q.x+=dx;q.y+=dy;});
      scene.locationLabel=location.label||'';
      return true;
    }

    function applyMotion(mode){
      const center=anchorScreen();
      if(mode==='freeze'){
        motes.forEach(q=>{q.frozen=true;q.vx=0;q.vy=0;});
      }else if(mode==='resume'){
        motes.forEach(q=>{q.frozen=false;if(Math.abs(q.vx)+Math.abs(q.vy)<.05){q.vx=rnd(-1,1);q.vy=rnd(-1,1);}});
      }else if(mode==='orbit'||mode==='spin'){
        motes.forEach(q=>{q.type=q.icon?'orbit':q.type;q.phase=rnd(0,160);q.group=q.group||'effects';});
        scene.particleMode='orbit';
      }else if(mode==='fall'){
        motes.forEach(q=>{q.frozen=false;q.vy=Math.abs(q.vy||1)+.8;});
        scene.particleMode='fall';
      }else if(mode==='float'){
        motes.forEach(q=>{q.frozen=false;q.vy=-Math.abs(q.vy||1)-.3;});
        scene.particleMode='float';
      }else if(mode==='explode'){
        motes.forEach(q=>{const dx=q.x-center.x,dy=q.y-center.y,len=Math.hypot(dx,dy)||1;q.vx=dx/len*rnd(2,5);q.vy=dy/len*rnd(2,5);q.frozen=false;});
        scene.flash=18;scene.shake=5;
      }else return false;
      return true;
    }

    function modify(change){
      if(!scene||!change||typeof change!=='object') return false;
      saveEditSnapshot();
      let changed=false;
      switch(change.type){
        case 'intensity': {
          const before=scene.level||1;
          scene.level=clamp(before+(change.delta||0),1,6);
          const delta=scene.level-before;
          scene.d=Math.max(scene.t+180,scene.d+delta*180);
          if(delta>0){
            const copies=deepCopy(motes.slice(0,Math.min(motes.length,22*delta)))||[];
            copies.forEach(q=>{q.x+=rnd(-28,28);q.y+=rnd(-28,28);q.life+=90;q.size*=1+.08*delta;});
            motes.push(...copies);
          }else if(delta<0){
            motes=motes.filter((_,i)=>i%2===0);
          }
          changed=delta!==0;
          break;
        }
        case 'duration': scene.d=Math.max(scene.t+120,scene.d+(change.delta||0));changed=true;break;
        case 'speed': scene.rate=clamp((scene.rate||1)*(change.factor||1),.35,2.5);changed=true;break;
        case 'pause': scene.paused=true;changed=true;break;
        case 'resume': scene.paused=false;applyMotion('resume');changed=true;break;
        case 'palette': {
          const palette=change.palette||PALETTES[change.name];
          if(palette){scene.p=palette.slice();scene.dark=change.name==='dark';scene.holi=change.name==='holi';motes.forEach((q,i)=>q.color=scene.p[i%scene.p.length]);changed=true;}
          break;
        }
        case 'color': {
          const palette=PALETTES[change.name]||[change.value||'#ffffff',change.value||'#ffffff','#ffffff'];
          scene.p=palette.slice();motes.forEach((q,i)=>q.color=palette[i%palette.length]);changed=true;break;
        }
        case 'move': changed=moveScene(change.location);break;
        case 'target': changed=setTarget(change.target);break;
        case 'scaleParticles': {
          const factor=clamp(change.factor||1,.35,3);
          motes.forEach(q=>q.size=clamp(q.size*factor,2,72));changed=true;break;
        }
        case 'motion': changed=applyMotion(change.mode);break;
        case 'add': changed=addSubject(change.subject,change.amount||1);break;
        case 'remove': changed=removeSubject(change.subject);break;
        case 'replace': {
          const removed=removeSubject(change.from);
          const added=addSubject(change.to,change.amount||1);
          changed=removed||added;break;
        }
        case 'clear': motes=[];changed=true;break;
      }
      if(!changed){editHistory.pop();return false;}
      if(change.message) scene.m=change.message;
      if(change.title) scene.title=change.title;
      scene.flash=Math.max(scene.flash||0,6);
      try{window.dispatchEvent(new CustomEvent('wish-cinema-modified',{detail:{change,snapshot:snapshot()}}));}catch(e){}
      return true;
    }

    function begin(nextScene){
      end(false);
      scene=nextScene;
      motes=[];
      editHistory=[];
      scene.rate=scene.rate||1;
      scene.paused=false;
      scene.anchor=scene.anchor||null;
      savedPlayers={
        her:{x:players.her.x,y:players.her.y,scale:players.her.scale},
        him:{x:players.him.x,y:players.him.y,scale:players.him.scale}
      };
      try{window.dispatchEvent(new CustomEvent('wish-cinema-start',{detail:{scene:snapshot()}}));}catch(e){}
      return true;
    }

    function end(restore=true){
      if(restore&&savedPlayers){
        players.her.x=savedPlayers.her.x;players.her.y=savedPlayers.her.y;players.her.scale=savedPlayers.her.scale;
        players.him.x=savedPlayers.him.x;players.him.y=savedPlayers.him.y;players.him.scale=savedPlayers.him.scale;
      }
      players.her._p2Color=players.him._p2Color=0;
      players.her._p2Invisible=players.him._p2Invisible=0;
      const old=scene;
      scene=null;motes=[];savedPlayers=null;editHistory=[];
      try{window.dispatchEvent(new CustomEvent('wish-cinema-end',{detail:{scene:old}}));}catch(e){}
    }

    function updateScene(){
      if(!scene||scene.paused) return;
      const rate=scene.rate||1;
      scene.t+=rate;
      scene.a.forEach(a=>{if(!a.done&&scene.t>=a.at) act(a);});
      if(scene.dance>scene.t||scene.spin>scene.t) players.her.dir=players.him.dir=pick(['left','right','up','down']);
      if(scene.levitate>scene.t){players.her.y-=Math.sin(scene.t/8)*.22;players.him.y-=Math.sin(scene.t/8)*.22;}
      if(savedPlayers){
        if(players.her._p2Scale&&scene.t>=players.her._p2Scale){players.her.scale=savedPlayers.her.scale;players.her._p2Scale=0;}
        if(players.him._p2Scale&&scene.t>=players.him._p2Scale){players.him.scale=savedPlayers.him.scale;players.him._p2Scale=0;}
      }
      const anchor=anchorScreen();
      motes.forEach(q=>{
        q.life-=rate;q.phase+=rate;
        if(q.frozen) return;
        if(q.type==='money'||q.type==='orbit'||scene.particleMode==='orbit'){
          const radius=100+(q.phase%150);
          q.x=anchor.x+Math.cos(q.phase/13)*radius;
          q.y=anchor.y+Math.sin(q.phase/13)*radius*.5;
        }else{
          q.x+=q.vx*rate;q.y+=q.vy*rate;
          if(['powder','confetti','aurora','pet'].includes(q.type)) q.x+=Math.sin(q.phase/11)*.7;
        }
      });
      motes=motes.filter(q=>q.life>0&&q.x>-180&&q.x<canvas.width+180&&q.y>-180&&q.y<canvas.height+180);
      if(scene.flash>0) scene.flash=Math.max(0,scene.flash-rate);
      if(scene.shake>0) scene.shake=Math.max(0,scene.shake-.08*rate);
      if(scene.t>scene.d) end();
    }

    function drawMote(q){
      const alpha=clamp(q.life/55,0,1);
      ctx.save();ctx.globalAlpha=alpha;ctx.shadowColor=q.color;ctx.shadowBlur=10;
      if(['icon','pet','orbit'].includes(q.type)){
        ctx.font=`${Math.round(q.size*1.8)}px "Segoe UI Emoji",sans-serif`;
        ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(q.icon,q.x,q.y);
      }else if(q.type==='star'||q.type==='redstar'){
        ctx.fillStyle=q.type==='redstar'?'#ff304f':q.color;
        ctx.fillRect(q.x-q.size/2,q.y-q.size*2,q.size,q.size*4);
        ctx.fillRect(q.x-q.size*2,q.y-q.size/2,q.size*4,q.size);
      }else if(q.type==='rain'){
        ctx.fillStyle='#8ee8ff';ctx.fillRect(q.x,q.y,2,q.size*2);
      }else if(q.type==='snow'){
        ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(q.x,q.y,q.size*.55,0,Math.PI*2);ctx.fill();
      }else if(q.type==='fire'){
        ctx.fillStyle=q.color||'#ff6a2a';ctx.shadowColor='#ff6a2a';ctx.shadowBlur=18;
        ctx.beginPath();ctx.arc(q.x,q.y,q.size,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#ffe068';ctx.beginPath();ctx.arc(q.x,q.y-q.size*.7,q.size*.55,0,Math.PI*2);ctx.fill();
      }else if(q.type==='firefly'){
        ctx.fillStyle='#f5ff9a';ctx.shadowBlur=18;ctx.fillRect(q.x,q.y,q.size/2,q.size/2);
      }else if(q.type==='steam'){
        ctx.globalAlpha*=.35;ctx.fillStyle=q.color||'#fff';ctx.beginPath();ctx.arc(q.x,q.y,q.size,0,Math.PI*2);ctx.fill();
      }else if(q.type==='powder'||q.type==='confetti'){
        ctx.fillStyle=q.color;ctx.beginPath();ctx.arc(q.x,q.y,q.size,0,Math.PI*2);ctx.fill();
      }else if(q.type==='firework'){
        for(let i=0;i<8;i++){const a=i*Math.PI/4+q.phase/10;ctx.fillStyle=q.color;ctx.fillRect(q.x+Math.cos(a)*q.size*2,q.y+Math.sin(a)*q.size*2,4,4);}
      }else if(q.type==='comet'){
        ctx.fillStyle='#fff1a8';ctx.fillRect(q.x,q.y,q.size,q.size);
        ctx.fillStyle='rgba(255,241,168,.5)';ctx.fillRect(q.x-q.size*5,q.y,q.size*5,q.size/2);
      }else if(q.type==='bolt'){
        ctx.fillStyle='#fff176';ctx.fillRect(q.x,q.y,q.size/3,q.size*5);
      }else if(q.type==='moon'){
        ctx.fillStyle='#f5f2ff';ctx.beginPath();ctx.arc(q.x,q.y,q.size,0,Math.PI*2);ctx.fill();
      }else if(q.type==='aurora'){
        ctx.globalAlpha*=.3;ctx.fillStyle=q.color;ctx.fillRect(q.x,q.y,q.size*8,q.size);
      }else if(q.type==='money'){
        ctx.font=`${Math.round(q.size*2)}px sans-serif`;ctx.fillText(pick(['💵','💸','🪙']),q.x,q.y);
      }
      ctx.restore();
    }

    function drawExtras(){
      if(!scene) return;
      if(scene.feast&&scene.feast.until>scene.t){
        const y=canvas.height*.7;ctx.save();ctx.fillStyle='rgba(80,42,20,.85)';ctx.fillRect(canvas.width/2-170,y,340,28);
        ctx.font='42px sans-serif';ctx.textAlign='center';scene.feast.icons.slice(0,5).forEach((x,i)=>ctx.fillText(x,canvas.width/2-110+i*55,y-10));ctx.restore();
      }
      if(scene.nap&&scene.nap.until>scene.t){
        ctx.save();ctx.font='38px sans-serif';ctx.textAlign='center';scene.nap.icons.slice(0,5).forEach((x,i)=>ctx.fillText(x,canvas.width/2-110+i*55,canvas.height*.72));ctx.fillText('💤',canvas.width/2+145,canvas.height*.66);ctx.restore();
      }
      if(scene.treasure>scene.t){
        ctx.save();ctx.font='76px sans-serif';ctx.textAlign='center';ctx.fillText('🧰',canvas.width/2,canvas.height*.68);ctx.font='36px sans-serif';ctx.fillText('💎 ✨ 💰',canvas.width/2,canvas.height*.57);ctx.restore();
      }
      if(scene.crown>scene.t){
        ctx.save();ctx.font='34px sans-serif';ctx.textAlign='center';ctx.fillText('👑',players.her.x-camera.x,players.her.y-camera.y-78);ctx.fillText('👑',players.him.x-camera.x,players.him.y-camera.y-78);ctx.restore();
      }
      if(scene.shield>scene.t){
        [players.her,players.him].forEach(p=>{ctx.save();ctx.strokeStyle='#ffe18b';ctx.shadowColor='#ffe18b';ctx.shadowBlur=18;ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x-camera.x,p.y-camera.y-26,34,0,Math.PI*2);ctx.stroke();ctx.restore();});
      }
      if(scene.kiss>scene.t){ctx.save();ctx.font='42px sans-serif';ctx.textAlign='center';ctx.fillText('💋',(players.her.x+players.him.x)/2-camera.x,Math.min(players.her.y,players.him.y)-camera.y-72);ctx.restore();}
      if(scene.boom>scene.t){ctx.save();ctx.font='bold 72px Impact,sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffd93d';ctx.strokeStyle='#111';ctx.lineWidth=8;ctx.strokeText('BOOM!',canvas.width/2,canvas.height/2);ctx.fillText('BOOM!',canvas.width/2,canvas.height/2);ctx.restore();}
    }

    function drawScene(){
      if(!scene) return;
      const fade=Math.min(1,scene.t/45)*Math.min(1,(scene.d-scene.t)/70);
      ctx.save();ctx.globalAlpha=.12*fade;
      if(scene.holi){const g=ctx.createLinearGradient(0,0,canvas.width,0);scene.p.forEach((x,i)=>g.addColorStop(i/(scene.p.length-1),x));ctx.fillStyle=g;}
      else ctx.fillStyle=scene.p[0];
      ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();
      if(scene.sunset>scene.t){ctx.save();const g=ctx.createLinearGradient(0,0,0,canvas.height);g.addColorStop(0,'rgba(255,140,90,.26)');g.addColorStop(1,'rgba(255,210,130,.08)');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();}
      if(scene.ice>scene.t){ctx.save();ctx.globalAlpha=.16;ctx.fillStyle='#8ee8ff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();}
      motes.forEach(drawMote);drawExtras();
      if(scene.flash>0){ctx.save();ctx.globalAlpha=scene.flash/40;ctx.fillStyle=scene.dark?'#8b0018':'#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();}
      const width=Math.min(760,canvas.width-40),x=(canvas.width-width)/2,y=canvas.height-96;
      ctx.save();ctx.globalAlpha=.92;ctx.fillStyle='rgba(10,6,18,.9)';ctx.strokeStyle=scene.p[1]||'#d9a7ff';ctx.lineWidth=3;
      if(typeof roundRect==='function') roundRect(x,y,width,70,12,true,true);else{ctx.fillRect(x,y,width,70);ctx.strokeRect(x,y,width,70);}
      ctx.fillStyle=scene.p[1]||'#d9a7ff';ctx.font='bold 15px monospace';ctx.fillText(`${scene.title}${scene.paused?' — PAUSED':''}`,x+18,y+25);
      ctx.fillStyle='#fff';ctx.font='14px monospace';ctx.fillText(String(scene.m||'').slice(0,94),x+18,y+50);ctx.restore();
    }

    function snapshot(){
      if(!scene) return null;
      return {
        title:scene.title,message:scene.m,concepts:(scene.c||[]).slice(),level:scene.level||1,
        rate:scene.rate||1,paused:!!scene.paused,target:scene.target===players.her?'tanima':scene.target===players.him?'ashton':scene.target,
        location:scene.locationLabel||'',particleCount:motes.length,remaining:Math.max(0,Math.round(scene.d-scene.t)),
        groups:[...new Set(motes.map(q=>q.group).filter(Boolean))]
      };
    }

    const originalDrawSprite=drawSprite;
    drawSprite=function(player){
      if(scene&&player._p2Invisible&&player._p2Invisible>scene.t){ctx.save();ctx.globalAlpha=.18;originalDrawSprite(player);ctx.restore();return;}
      if(scene&&player._p2Color&&player._p2Color>scene.t){ctx.save();ctx.filter=`hue-rotate(${Math.round(scene.t*9)%360}deg) saturate(2.5)`;originalDrawSprite(player);ctx.restore();return;}
      originalDrawSprite(player);
    };

    const originalUpdate=update;
    update=function(){originalUpdate();updateScene();};
    const originalDraw=draw;
    draw=function(){
      if(scene&&scene.shake>0){ctx.save();ctx.translate(rnd(-scene.shake,scene.shake),rnd(-scene.shake,scene.shake));originalDraw();ctx.restore();}
      else originalDraw();
      drawScene();
    };

    window.WishCinemaFx={
      begin,end,modify,undoModify,snapshot,
      get active(){return !!scene;},
      get scene(){return snapshot();},
      palettes:PALETTES
    };
  }catch(e){
    console.warn('wish phase2 fx failed',e);
  }
})();