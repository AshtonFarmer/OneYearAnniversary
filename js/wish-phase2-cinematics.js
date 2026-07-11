// Phase 2: cinematic mini-scenes layered on top of Phase 1 wish packs.
(function(){
  try{
    if(typeof update!=='function'||typeof draw!=='function') return;

    const endpoint='damp-cherry-8310.ashton20-bama.workers.dev';
    const norm=s=>String(s||'').toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ').trim();
    const has=(t,a)=>a.some(x=>t.includes(x));
    const rnd=(a,b)=>a+Math.random()*(b-a);
    const pick=a=>a[Math.floor(Math.random()*a.length)];
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

    let scene=null;
    let motes=[];
    let lastWish='';
    let repeatLevel=1;
    let saved=null;

    const colors={
      romance:['#ff6bb5','#ffd1e8','#ffe18b'],
      holi:['#ff315d','#ff9b2f','#ffd93d','#4fe06a','#3da8ff','#a45cff'],
      gold:['#ffd957','#ffe18b','#ffb84d'],
      cozy:['#ffd6a5','#fff1c8','#d9a7ff'],
      storm:['#8ee8ff','#dce7ff','#fff176'],
      space:['#fff1a8','#d9a7ff','#8ee8ff'],
      dark:['#a40018','#32113f','#111018'],
      food:['#ffb56b','#ffd6a5','#fff1c8'],
      pets:['#ffd1e8','#fff1c8','#8ee8ff']
    };

    function targetFromText(t){
      if(has(t,['tanima',' her ',' she ','girlfriend'])) return players.her;
      if(has(t,['ashton',' him ',' he ','boyfriend',' me '])) return players.him;
      return null;
    }

    function classify(text){
      const t=` ${norm(text)} `;
      if(has(t,[' stop ',' enough ',' too much ',' make it stop '])) return {kind:'stop'};
      if(has(t,[' more ',' even more ',' again ',' do it again '])) return {kind:'repeat'};
      if(has(t,['holi','festival of colors','festival of colours','throw colors','throw colour','rang','abir'])) return {kind:'holi'};
      if(has(t,['eid','pohela boishakh','bangla new year','durga puja','pujo','rangoli','alpana'])) return {kind:'festival'};
      if(has(t,['biryani','kacchi','tehari','fuchka','puchka','roshogolla','mishti','sandesh','chomchom','jilapi','doi','luchi','shingara','khichuri','ilish','curry','cha','chai','lassi','payesh','pitha','bhorta','polao','korma','rezala','haleem','kabob','kebab'])) return {kind:'bengaliFood'};
      if(has(t,['pizza','burger','fries','taco','nacho','cookie','ice cream','milkshake','donut','brownie','cake','pancake','waffle','steak','sushi','ramen','pasta','popcorn','cheese','sandwich','hot dog','nugget','chocolate','candy','coffee','tea'])) return {kind:'food'};
      if(has(t,['binx','loki','casper','mojo','dallas','black cat','white cat','shih tzu','our pets'])) return {kind:'pets'};
      if(has(t,['money','cash','dollar','rich','wealth','lottery','jackpot','millionaire','billionaire','gold bar','coin rain','money rain','money tornado','treasure','diamond','credit card','shopping spree','payday','bonus'])) return {kind:'money'};
      if(has(t,['i love you','love you','i miss you','kiss me','hug me','hold my hand','cuddle','dance with me','first kiss','first date','stay forever','never leave','soulmate','marry me','wedding','our future','amar mishti','bhalobasha','bhalobasi','shona','jaan','baba'])) return {kind:'romance'};
      if(has(t,['i am sad',"i'm sad",'lonely','miss home','homesick','scared','anxious','worried','bad day','need a hug','cheer me up','feel better','comfort me'])) return {kind:'comfort'};
      if(has(t,['cozy','cosy','peaceful','relax','sleepy','tired','warm evening','soft rain','candlelight','quiet night'])) return {kind:'cozy'};
      if(has(t,['monsoon','thunderstorm','blizzard','snow','rain','fog','sunset','sunrise','aurora','northern lights','rainbow','golden hour'])) return {kind:'weather'};
      if(has(t,['space','galaxy','shooting star','meteor shower','comet','moon','planet','constellation','universe','alien','ufo','eclipse','blood moon'])) return {kind:'space'};
      if(has(t,['magic','i can fly','let me fly','give me wings','invisible','teleport','superpower','stop time','slow time','queen','king','castle','royal parade'])) return {kind:'magic'};
      if(has(t,['chaos','surprise me','random wish','fart','bald ashton','duck world','ducks rule','frog king','everything bounce','everything spin','cheese rain','flying socks','homework'])) return {kind:'funny'};
      if(has(t,['bangladesh','alabama','disney','beach','camping','mountains','road trip','vacation','atlanta','birmingham'])) return {kind:'travel'};
      if(has(t,['christmas','halloween','valentine','birthday','new year','thanksgiving','easter','anniversary'])) return {kind:'holiday'};
      if(has(t,['darkness','evil','curse','apocalypse','end the world','destroy everything','take his soul','take her soul','kill ashton','kill tanima','ghosts','demons','bats','blood moon','black sun','void','dark portal','meteor strike','dragon attack','charizard attack'])) return {kind:'dark'};
      return null;
    }

    function makeScene(kind,text){
      const target=targetFromText(` ${norm(text)} `);
      const base={kind,text,timer:0,duration:650+repeatLevel*80,phase:0,target,shake:0,flash:0,overlay:'none',message:'The wish becomes a little story.',palette:colors.cozy,actions:[]};
      const add=(at,type,data={})=>base.actions.push({at,type,...data,done:false});

      if(kind==='romance'){
        base.overlay='pink';base.palette=colors.romance;base.message='For a moment, the whole world remembers how much you love each other.';
        add(20,'moveTogether');add(90,'hearts',{count:45});add(160,'petals',{count:35});add(230,'dance');add(430,'lanterns',{count:24});
      }else if(kind==='holi'){
        base.overlay='rainbow';base.palette=colors.holi;base.message='Your Holi memory explodes back into the world in every color.';
        add(25,'colorBurst',{count:90});add(90,'playerColor');add(150,'colorBurst',{count:120});add(260,'dance');add(390,'confetti',{count:70});
      }else if(kind==='festival'){
        base.overlay='gold';base.palette=colors.gold;base.message='The map lights up like a warm celebration.';
        add(30,'lanterns',{count:35});add(100,'petals',{count:45});add(180,'fireworks',{count:28});add(320,'music',{count:24});
      }else if(kind==='bengaliFood'||kind==='food'){
        base.overlay='warm';base.palette=colors.food;base.message=kind==='bengaliFood'?'A full Bengali feast floats through the air like the best kind of dream.':'Your craving turns into a ridiculous floating feast.';
        add(20,'foodRain',{count:90});add(130,'steam',{count:35});add(260,'foodOrbit',{count:40});add(420,'sparkles',{count:30});
      }else if(kind==='pets'){
        base.overlay='cozy';base.palette=colors.pets;base.message='Binx, Loki, Casper, Mojo, and Dallas fill the moment with familiar little chaos.';
        add(30,'pawTrail',{count:50});add(100,'petParade',{count:28});add(250,'hearts',{count:24});add(380,'petNap');
      }else if(kind==='money'){
        base.overlay='gold';base.palette=colors.gold;base.message='Tanima-level wealth takes over the entire screen.';
        add(20,'moneyRain',{count:110});add(120,'cashBurst',{count:80});add(230,'moneyTornado',{count:100});add(360,'diamonds',{count:45});add(470,'goldFlash');
      }else if(kind==='comfort'||kind==='cozy'){
        base.overlay='warm';base.palette=colors.cozy;base.message=kind==='comfort'?'The world gets quiet and stays close until the bad feeling passes.':'Everything slows down and becomes warm, quiet, and safe.';
        add(20,'moveTogether');add(100,'lanterns',{count:24});add(190,'fireflies',{count:35});add(300,'hearts',{count:20});add(410,'softRain',{count:45});
      }else if(kind==='weather'){
        base.overlay='weather';base.palette=colors.storm;base.message='The sky changes itself to match the wish.';
        add(20,'clouds',{count:25});add(100,'weatherMix',{count:90});add(250,'lightning',{count:12});add(390,'rainbow',{count:35});
      }else if(kind==='space'){
        base.overlay='space';base.palette=colors.space;base.message='The universe leans close enough to touch.';
        add(20,'stars',{count:80});add(140,'comets',{count:18});add(240,'moon');add(350,'aurora',{count:45});add(470,'constellation',{count:30});
      }else if(kind==='magic'){
        base.overlay='purple';base.palette=colors.space;base.message='Reality bends just enough to make the impossible feel real.';
        add(20,'sparkles',{count:65});add(120,'teleportFlash');add(220,'levitate');add(360,'crowns',{count:28});add(470,'wings',{count:35});
      }else if(kind==='funny'){
        base.overlay='chaos';base.palette=colors.holi;base.message='The Wish Pool makes a terrible decision on purpose.';
        add(20,'randomChaos',{count:120});add(160,'spinPlayers');add(290,'duckRush',{count:45});add(410,'frogRain',{count:55});
      }else if(kind==='travel'){
        base.overlay='sunset';base.palette=colors.cozy;base.message='For a moment, the world feels like somewhere new.';
        add(20,'clouds',{count:25});add(120,'travelIcons',{count:45});add(250,'sunsetGlow');add(380,'stars',{count:35});
      }else if(kind==='holiday'){
        base.overlay='celebration';base.palette=colors.romance;base.message='The whole map joins the celebration.';
        add(20,'confetti',{count:90});add(120,'fireworks',{count:30});add(240,'gifts',{count:45});add(380,'music',{count:30});
      }else if(kind==='dark'){
        base.overlay='dark';base.palette=colors.dark;base.message='The pool hesitates... then grants the terrible idea anyway.';
        base.shake=6;add(20,'darken');add(90,'bats',{count:45});add(180,'ghosts',{count:35});add(290,'redStars',{count:45});add(400,'darkFlash');
      }
      return base;
    }

    function start(text){
      const c=classify(text);
      if(!c) return;
      if(c.kind==='stop'){end();return;}
      if(c.kind==='repeat'){
        if(!lastWish) return;
        repeatLevel=Math.min(4,repeatLevel+1);
        const lc=classify(lastWish);if(lc) scene=makeScene(lc.kind,lastWish);
      }else{
        repeatLevel=1;lastWish=text;scene=makeScene(c.kind,text);
      }
      motes=[];
      saved={her:{x:players.her.x,y:players.her.y,scale:players.her.scale,speed:players.her.speed},him:{x:players.him.x,y:players.him.y,scale:players.him.scale,speed:players.him.speed}};
    }

    function addMote(type,x,y,opts={}){motes.push({type,x,y,vx:opts.vx??rnd(-1,1),vy:opts.vy??rnd(-1,1),life:opts.life||220,size:opts.size||rnd(5,14),color:opts.color||pick(scene.palette),phase:rnd(0,100),icon:opts.icon||''});}
    function burst(type,count,mode='screen',icons=[]){
      for(let i=0;i<count;i++){
        let x=rnd(0,canvas.width),y=rnd(0,canvas.height);
        if(mode==='top') y=-30;
        if(mode==='bottom') y=canvas.height+30;
        addMote(type,x,y,{vx:rnd(-1.8,1.8),vy:mode==='top'?rnd(.8,2.4):mode==='bottom'?rnd(-2.4,-.8):rnd(-1.2,1.2),life:rnd(160,340),size:rnd(7,18),icon:icons.length?pick(icons):''});
      }
    }

    function runAction(a){
      a.done=true;
      const n=Math.round((a.count||30)*repeatLevel);
      switch(a.type){
        case 'moveTogether': {
          const mx=(players.her.x+players.him.x)/2,my=(players.her.y+players.him.y)/2;players.her.x=mx-16;players.him.x=mx+16;players.her.y=players.him.y=my;break;
        }
        case 'dance': scene.danceUntil=scene.timer+180;break;
        case 'playerColor': players.her._phase2Color=players.him._phase2Color=scene.timer+300;break;
        case 'hearts': burst('icon',n,'bottom',['❤','♥','💗']);break;
        case 'petals': burst('icon',n,'top',['🌸','🌹','❀']);break;
        case 'lanterns': burst('icon',n,'bottom',['🏮','✨']);break;
        case 'fireworks': burst('firework',n);scene.flash=18;break;
        case 'music': burst('icon',n,'bottom',['♪','♫','♬']);break;
        case 'colorBurst': burst('powder',n);scene.flash=10;break;
        case 'confetti': burst('confetti',n,'top');break;
        case 'foodRain': burst('icon',n,'top',scene.kind==='bengaliFood'?['🍛','🥘','🥟','🍚','🫖','🥭']:['🍕','🍔','🍟','🌮','🍪','🍦','🍩','🍰','🍿','☕']);break;
        case 'steam': burst('steam',n,'bottom');break;
        case 'foodOrbit': burst('icon',n,'screen',['🍛','🍕','🍪','🍰']);break;
        case 'pawTrail': burst('icon',n,'bottom',['🐾']);break;
        case 'petParade': burst('icon',n,'screen',['🐈‍⬛','🐈','🐕']);break;
        case 'petNap': burst('icon',16,'screen',['💤','🐾']);break;
        case 'moneyRain': burst('icon',n,'top',['💵','💸','💰','🪙']);break;
        case 'cashBurst': burst('icon',n,'screen',['💵','💳','💎']);scene.flash=12;break;
        case 'moneyTornado': burst('moneySpin',n);break;
        case 'diamonds': burst('icon',n,'top',['💎','✨']);break;
        case 'goldFlash': scene.flash=24;break;
        case 'fireflies': burst('firefly',n);break;
        case 'softRain': burst('rain',n,'top');break;
        case 'clouds': burst('icon',n,'screen',['☁','☁️']);break;
        case 'weatherMix': burst('rain',n,'top');break;
        case 'lightning': burst('bolt',n);scene.shake=4;break;
        case 'rainbow': burst('confetti',n);break;
        case 'stars': burst('star',n);break;
        case 'comets': burst('comet',n);break;
        case 'moon': addMote('moon',canvas.width*.82,canvas.height*.18,{vx:0,vy:0,life:360,size:55});break;
        case 'aurora': burst('aurora',n);break;
        case 'constellation': burst('star',n);break;
        case 'sparkles': burst('star',n);break;
        case 'teleportFlash': scene.flash=30;{const x=players.her.x;players.her.x=players.him.x;players.him.x=x;}break;
        case 'levitate': scene.levitateUntil=scene.timer+180;break;
        case 'crowns': burst('icon',n,'bottom',['👑','✨']);break;
        case 'wings': burst('icon',n,'screen',['🪽','✨']);break;
        case 'randomChaos': burst('icon',n,'screen',['🧀','🧦','🍕','😂','💥']);break;
        case 'spinPlayers': scene.spinUntil=scene.timer+180;break;
        case 'duckRush': burst('icon',n,'screen',['🦆']);break;
        case 'frogRain': burst('icon',n,'top',['🐸']);break;
        case 'travelIcons': burst('icon',n,'screen',['✈','🏝','⛰','🏕','🚙']);break;
        case 'sunsetGlow': scene.flash=10;break;
        case 'gifts': burst('icon',n,'bottom',['🎁','🎂','🎄','🎃']);break;
        case 'darken': scene.flash=8;break;
        case 'bats': burst('icon',n,'screen',['🦇']);break;
        case 'ghosts': burst('icon',n,'bottom',['👻']);break;
        case 'redStars': burst('star',n);break;
        case 'darkFlash': scene.flash=25;scene.shake=8;break;
      }
    }

    function end(){
      if(saved){players.her.x=saved.her.x;players.her.y=saved.her.y;players.her.scale=saved.her.scale;players.her.speed=saved.her.speed;players.him.x=saved.him.x;players.him.y=saved.him.y;players.him.scale=saved.him.scale;players.him.speed=saved.him.speed;}
      players.her._phase2Color=players.him._phase2Color=0;scene=null;motes=[];saved=null;
    }

    const realFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){
      try{const url=typeof input==='string'?input:(input&&input.url)||'';if(url.includes(endpoint)&&init&&init.body){const b=JSON.parse(init.body);if(b&&b.wish)start(b.wish);}}catch(e){}
      return realFetch(input,init);
    };

    function updateScene(){
      if(!scene) return;
      scene.timer++;
      scene.actions.forEach(a=>{if(!a.done&&scene.timer>=a.at)runAction(a);});
      if(scene.danceUntil>scene.timer){players.her.dir=players.him.dir=pick(['left','right','up','down']);}
      if(scene.spinUntil>scene.timer){players.her.dir=players.him.dir=pick(['left','right','up','down']);}
      if(scene.levitateUntil>scene.timer){players.her.y-=Math.sin(scene.timer/8)*.22;players.him.y-=Math.sin(scene.timer/8)*.22;}
      motes.forEach(m=>{m.life--;m.phase++;if(m.type==='moneySpin'){const cx=canvas.width/2,cy=canvas.height/2,r=120+(m.phase%160);m.x=cx+Math.cos(m.phase/12)*r;m.y=cy+Math.sin(m.phase/12)*r*.55;}else{m.x+=m.vx;m.y+=m.vy;if(['powder','confetti','aurora'].includes(m.type))m.x+=Math.sin(m.phase/11)*.7;}});
      motes=motes.filter(m=>m.life>0&&m.x>-100&&m.x<canvas.width+100&&m.y>-100&&m.y<canvas.height+100);
      if(scene.flash>0)scene.flash--;
      if(scene.timer>scene.duration)end();
    }

    function drawMote(m){
      const a=clamp(m.life/55,0,1);ctx.save();ctx.globalAlpha=a;ctx.shadowColor=m.color;ctx.shadowBlur=10;
      if(m.type==='icon'){ctx.font=`${Math.round(m.size*1.8)}px "Segoe UI Emoji",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(m.icon,m.x,m.y);}
      else if(m.type==='star'){ctx.fillStyle=m.color;ctx.fillRect(m.x-m.size/2,m.y-m.size*2,m.size,m.size*4);ctx.fillRect(m.x-m.size*2,m.y-m.size/2,m.size*4,m.size);}
      else if(m.type==='rain'){ctx.fillStyle='#8ee8ff';ctx.fillRect(m.x,m.y,2,m.size*2);}
      else if(m.type==='firefly'){ctx.fillStyle='#f5ff9a';ctx.shadowBlur=18;ctx.fillRect(m.x,m.y,m.size/2,m.size/2);}
      else if(m.type==='steam'){ctx.globalAlpha*=.35;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(m.x,m.y,m.size,0,Math.PI*2);ctx.fill();}
      else if(m.type==='powder'||m.type==='confetti'){ctx.fillStyle=m.color;ctx.beginPath();ctx.arc(m.x,m.y,m.size,0,Math.PI*2);ctx.fill();}
      else if(m.type==='firework'){for(let i=0;i<8;i++){const ang=i*Math.PI/4+m.phase/10;ctx.fillStyle=m.color;ctx.fillRect(m.x+Math.cos(ang)*m.size*2,m.y+Math.sin(ang)*m.size*2,4,4);}}
      else if(m.type==='comet'){ctx.fillStyle='#fff1a8';ctx.fillRect(m.x,m.y,m.size,m.size);ctx.fillStyle='rgba(255,241,168,.5)';ctx.fillRect(m.x-m.size*5,m.y,m.size*5,m.size/2);}
      else if(m.type==='bolt'){ctx.fillStyle='#fff176';ctx.fillRect(m.x,m.y,m.size/3,m.size*5);}
      else if(m.type==='moon'){ctx.fillStyle='#f5f2ff';ctx.beginPath();ctx.arc(m.x,m.y,m.size,0,Math.PI*2);ctx.fill();}
      else if(m.type==='aurora'){ctx.globalAlpha*=.3;ctx.fillStyle=m.color;ctx.fillRect(m.x,m.y,m.size*8,m.size);}
      else if(m.type==='moneySpin'){ctx.font=`${Math.round(m.size*2)}px "Segoe UI Emoji",sans-serif`;ctx.fillText(pick(['💵','💸','🪙']),m.x,m.y);}
      ctx.restore();
    }

    function drawScene(){
      if(!scene) return;
      const fade=Math.min(1,scene.timer/45)*Math.min(1,(scene.duration-scene.timer)/70);
      ctx.save();ctx.globalAlpha=.13*fade;
      if(scene.overlay==='rainbow'){const g=ctx.createLinearGradient(0,0,canvas.width,0);scene.palette.forEach((c,i)=>g.addColorStop(i/(scene.palette.length-1),c));ctx.fillStyle=g;}
      else ctx.fillStyle=scene.palette[0];ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();
      motes.forEach(drawMote);
      if(scene.flash>0){ctx.save();ctx.globalAlpha=scene.flash/40;ctx.fillStyle=scene.kind==='dark'?'#8b0018':'#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();}
      const w=Math.min(720,canvas.width-40),x=(canvas.width-w)/2,y=canvas.height-92;ctx.save();ctx.globalAlpha=.9;ctx.fillStyle='rgba(10,6,18,.88)';ctx.strokeStyle=scene.palette[1]||'#d9a7ff';ctx.lineWidth=3;roundRect(x,y,w,66,12,true,true);ctx.fillStyle='#fff1c8';ctx.font='bold 15px monospace';ctx.fillText(scene.message.slice(0,92),x+18,y+40);ctx.restore();
    }

    const oldDrawSprite=drawSprite;
    drawSprite=function(p){
      if(p._phase2Color&&scene&&p._phase2Color>scene.timer){ctx.save();ctx.filter=`hue-rotate(${Math.round(scene.timer*9)%360}deg) saturate(2.5)`;oldDrawSprite(p);ctx.restore();return;}
      oldDrawSprite(p);
    };

    const oldUpdate=update;update=function(){oldUpdate();updateScene();};
    const oldDraw=draw;draw=function(){oldDraw();drawScene();};
    window.WishPhase2={start,end,get active(){return !!scene;}};
  }catch(e){console.warn('wish phase2 failed',e);}
})();