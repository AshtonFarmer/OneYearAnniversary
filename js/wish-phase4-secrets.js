// Phase 4 foundation: ultra-rare secret scenes, discovery memory, and a pity system.
(function(){
  try{
    if(typeof update!=='function'||typeof draw!=='function')return;

    const ENDPOINT='damp-cherry-8310.ashton20-bama.workers.dev';
    const STORE='wishPoolPhase4Secrets';
    const R=(a,b)=>a+Math.random()*(b-a);
    const P=a=>a[Math.floor(Math.random()*a.length)];
    const C=(v,a,b)=>Math.max(a,Math.min(b,v));
    const N=s=>String(s||'').toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ').trim();

    const EVENTS=[
      {id:'secret_comet',name:'The Quiet Comet',rarity:'rare',weight:18,duration:620,keys:['star','space','comet','moon','wish']},
      {id:'moon_smile',name:'The Moon Smiles Back',rarity:'ultra',weight:8,duration:700,keys:['moon','night','space','sad','love']},
      {id:'cloud_whale',name:'The Whale Above the Valley',rarity:'ultra',weight:7,duration:760,keys:['cloud','sky','fly','dream','ocean']},
      {id:'giant_duck',name:'The Lake Duck',rarity:'rare',weight:14,duration:650,keys:['duck','lake','funny','chaos']},
      {id:'fairy_guardian',name:'Tanima’s Fairy Guardian',rarity:'ultra',weight:8,duration:720,keys:['tanima','fairy','magic','safe','protect','sad']},
      {id:'golden_jackpot',name:'The Impossible Jackpot',rarity:'rare',weight:15,duration:700,keys:['money','cash','rich','gold','diamond','tanima','shopping']},
      {id:'holi_memory',name:'A Holi Memory Returns',rarity:'rare',weight:15,duration:720,keys:['holi','color','colour','rang','abir','memory']},
      {id:'pet_constellation',name:'Five Lights in the Sky',rarity:'ultra',weight:8,duration:760,keys:['binx','loki','casper','mojo','dallas','pet','cat','dog']},
      {id:'bengali_feast_spirit',name:'The Midnight Bengali Feast',rarity:'rare',weight:13,duration:720,keys:['biryani','kacchi','fuchka','mishti','cha','bengali','bangladesh','food']},
      {id:'time_still',name:'The Valley Holds Its Breath',rarity:'ultra',weight:7,duration:620,keys:['time','forever','stay','moment','peace','quiet']},
      {id:'double_rainbow',name:'The Second Rainbow',rarity:'rare',weight:13,duration:680,keys:['rainbow','rain','storm','happy','hope']},
      {id:'heart_tree',name:'The Heart Tree Blooms',rarity:'ultra',weight:7,duration:760,keys:['love','heart','forever','marry','wedding','flower']},
      {id:'wish_pool_awakens',name:'The Pool Remembers',rarity:'legendary',weight:3,duration:900,keys:['wish','pool','remember','anniversary','forever']},
      {id:'love_in_stars',name:'Written Across the Stars',rarity:'legendary',weight:2,duration:900,keys:['love','ashton','tanima','forever','stars','anniversary']},
      {id:'dragon_shadow',name:'The Ancient Shadow',rarity:'legendary',weight:2,duration:820,keys:['dragon','charizard','fire','shadow','sky']}
    ];

    const COLORS={
      gold:['#ffd957','#ffe9a8','#ffb52e'],pink:['#ff6bb5','#ffd1e8','#fff1c8'],
      sky:['#8ee8ff','#d9a7ff','#fff1a8'],dark:['#160a25','#45113f','#ff6a2a'],
      holi:['#ff315d','#ff9b2f','#ffd93d','#4fe06a','#3da8ff','#a45cff']
    };

    const fresh=()=>({version:1,totalWishes:0,sinceSecret:0,seen:[],counts:{},lastSecret:'',lastAt:0});
    function load(){try{return Object.assign(fresh(),JSON.parse(localStorage.getItem(STORE)||'null')||{});}catch(e){return fresh();}}
    let state=load();
    let active=null;
    let pending=null;
    let particles=[];
    let savedSpeeds=null;

    function save(){try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){}}
    function screenPlayer(target){
      const p=target==='ashton'?players.him:players.her;
      return{x:p.x-camera.x,y:p.y-camera.y-24};
    }
    function add(type,x,y,o={}){particles.push({type,x,y,vx:o.vx??R(-1,1),vy:o.vy??R(-1,1),life:o.life||260,max:o.life||260,size:o.size||R(4,12),color:o.color||'#fff',phase:R(0,100),icon:o.icon||''});}
    function burst(type,n,o={}){
      for(let i=0;i<n;i++)add(type,o.x??R(0,canvas.width),o.y??R(0,canvas.height),{
        vx:o.vx===undefined?R(-2,2):o.vx+R(-.45,.45),vy:o.vy===undefined?R(-2,2):o.vy+R(-.45,.45),
        life:o.life||R(180,360),size:o.size||R(5,15),color:o.colors?P(o.colors):(o.color||'#fff'),icon:o.icons?P(o.icons):''
      });
    }

    function choose(wish){
      const t=N(wish),unseen=EVENTS.filter(e=>!state.seen.includes(e.id));
      const pool=unseen.length?unseen:EVENTS;
      const weighted=[];
      pool.forEach(e=>{
        let w=e.weight;
        e.keys.forEach(k=>{if(t.includes(k))w+=12;});
        if(e.rarity==='legendary'&&state.sinceSecret<18)w*=.35;
        weighted.push([e,w]);
      });
      let roll=R(0,weighted.reduce((s,x)=>s+x[1],0));
      for(const[e,w]of weighted){roll-=w;if(roll<=0)return e;}
      return weighted[0][0];
    }

    function consider(wish){
      state.totalWishes++;
      state.sinceSecret++;
      const chance=state.sinceSecret>=32?1:Math.min(.13,.018+state.sinceSecret*.0032);
      if(!pending&&!active&&Math.random()<chance){pending={event:choose(wish),delay:210,wait:0,forced:false};}
      save();
    }

    function eventById(value){
      const q=N(value).replace(/[^a-z0-9 ]/g,' ');
      return EVENTS.find(e=>e.id===q.replace(/\s+/g,'_')||N(e.name).includes(q)||q.includes(e.id.replace(/_/g,' ')))||null;
    }

    function begin(def,forced){
      end(false);
      active={def,t:0,d:def.duration,flash:0,shake:0,forced:!!forced};
      particles=[];
      if(!forced){
        state.sinceSecret=0;
        state.lastSecret=def.id;
        state.lastAt=Date.now();
        state.counts[def.id]=(state.counts[def.id]||0)+1;
        if(!state.seen.includes(def.id))state.seen.push(def.id);
        save();
      }
      if(def.id==='time_still'){
        savedSpeeds={her:players.her.speed,him:players.him.speed};
        players.her.speed=0;players.him.speed=0;
      }
      seed(def.id);
      window.dispatchEvent(new CustomEvent('wish-secret-start',{detail:{id:def.id,name:def.name,rarity:def.rarity,forced:!!forced}}));
    }

    function end(dispatch=true){
      if(savedSpeeds){players.her.speed=savedSpeeds.her;players.him.speed=savedSpeeds.him;savedSpeeds=null;}
      if(active&&dispatch)window.dispatchEvent(new CustomEvent('wish-secret-end',{detail:{id:active.def.id}}));
      active=null;particles=[];
    }

    function seed(id){
      if(id==='secret_comet')burst('star',55,{colors:COLORS.sky,life:420});
      if(id==='moon_smile')burst('star',70,{colors:COLORS.sky,life:500});
      if(id==='cloud_whale')burst('cloud',34,{colors:['#fff','#dce7ff'],life:520,size:22});
      if(id==='giant_duck')burst('ripple',34,{x:canvas.width*.5,y:canvas.height*.68,colors:COLORS.sky,life:520});
      if(id==='fairy_guardian')burst('fairy',65,{...screenPlayer('tanima'),colors:COLORS.gold,life:540});
      if(id==='golden_jackpot')burst('icon',120,{y:-30,vy:2.1,icons:['💵','💸','💰','🪙','💎'],colors:COLORS.gold,life:520,size:16});
      if(id==='holi_memory')burst('powder',150,{colors:COLORS.holi,life:540});
      if(id==='pet_constellation')burst('star',85,{colors:COLORS.sky,life:600});
      if(id==='bengali_feast_spirit')burst('icon',75,{y:canvas.height+30,vy:-1.5,icons:['🍛','🥘','🥟','🍚','🫖','🥭'],colors:COLORS.gold,life:560,size:17});
      if(id==='double_rainbow')burst('spark',80,{colors:COLORS.holi,life:520});
      if(id==='heart_tree')burst('heart',90,{colors:COLORS.pink,life:560});
      if(id==='wish_pool_awakens')burst('spark',150,{x:canvas.width*.55,y:canvas.height*.55,colors:COLORS.sky,life:700});
      if(id==='love_in_stars')burst('star',140,{colors:COLORS.sky,life:760});
      if(id==='dragon_shadow')burst('ember',85,{colors:['#ff6a2a','#ffe05a'],life:600});
    }

    function updateParticles(){
      particles.forEach(p=>{
        p.life--;p.phase++;
        if(p.type==='fairy'){
          const c=screenPlayer('tanima'),r=38+(p.phase%110)*.25;
          p.x=c.x+Math.cos(p.phase/12)*r;p.y=c.y+Math.sin(p.phase/12)*r*.7;
        }else if(p.type==='ripple'){
          p.x+=Math.sin(p.phase/18)*.15;
        }else{
          p.x+=p.vx;p.y+=p.vy;
          if(['powder','cloud','heart','spark'].includes(p.type))p.x+=Math.sin(p.phase/13)*.45;
        }
      });
      particles=particles.filter(p=>p.life>0&&p.x>-180&&p.x<canvas.width+180&&p.y>-180&&p.y<canvas.height+180);
    }

    function updateSecret(){
      if(pending){
        pending.wait++;
        const busy=(window.WishCinemaFx&&window.WishCinemaFx.active)||(window.WishPhase2&&window.WishPhase2.active)||(window.DragonBoss&&window.DragonBoss.active);
        if(pending.delay>0)pending.delay--;
        else if(!busy||pending.wait>1200){const p=pending;pending=null;begin(p.event,p.forced);}
      }
      if(!active)return;
      active.t++;
      const id=active.def.id,t=active.t;
      if(id==='secret_comet'&&t===90){for(let i=0;i<14;i++)add('comet',-120-i*18,80+i*5,{vx:6.6,vy:1.35,life:260,size:18,color:'#fff1a8'});}
      if(id==='golden_jackpot'&&t%70===0)burst('icon',30,{y:-20,vy:2.2,icons:['💵','💸','🪙','💎'],colors:COLORS.gold,life:350});
      if(id==='holi_memory'&&t%95===0){burst('powder',55,{colors:COLORS.holi,life:320});active.flash=10;}
      if(id==='dragon_shadow'&&t===190){active.flash=12;active.shake=7;}
      if(id==='wish_pool_awakens'&&t%100===0)burst('spark',40,{x:canvas.width*.55,y:canvas.height*.55,colors:COLORS.sky,life:360});
      updateParticles();
      if(active.flash>0)active.flash--;
      if(active.shake>0)active.shake=Math.max(0,active.shake-.08);
      if(t>active.d)end();
    }

    function drawParticle(p){
      const a=C(p.life/Math.min(70,p.max),0,1);ctx.save();ctx.globalAlpha=a;ctx.shadowColor=p.color;ctx.shadowBlur=10;
      if(p.type==='icon'){ctx.font=`${Math.round(p.size*1.8)}px "Segoe UI Emoji",sans-serif`;ctx.textAlign='center';ctx.fillText(p.icon,p.x,p.y);}
      else if(p.type==='star'||p.type==='spark'){ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size*2,p.size,p.size*4);ctx.fillRect(p.x-p.size*2,p.y-p.size/2,p.size*4,p.size);}
      else if(p.type==='comet'){ctx.fillStyle='#fff1a8';ctx.fillRect(p.x,p.y,p.size,p.size);ctx.globalAlpha*=.55;ctx.fillRect(p.x-p.size*8,p.y+2,p.size*8,p.size/2);}
      else if(p.type==='powder'){ctx.globalAlpha*=.75;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
      else if(p.type==='cloud'){ctx.globalAlpha*=.45;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.arc(p.x+p.size,p.y+3,p.size*.8,0,Math.PI*2);ctx.fill();}
      else if(p.type==='fairy'){ctx.fillStyle='#fff8a6';ctx.fillRect(p.x,p.y,4,4);ctx.strokeStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.stroke();}
      else if(p.type==='ripple'){ctx.strokeStyle=p.color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,p.size*2.5,p.size*.7,0,0,Math.PI*2);ctx.stroke();}
      else if(p.type==='heart'){ctx.font=`${Math.round(p.size*1.8)}px sans-serif`;ctx.textAlign='center';ctx.fillText('♥',p.x,p.y);}
      else if(p.type==='ember'){ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}
      ctx.restore();
    }

    function pixelWhale(t){
      const x=-260+(canvas.width+520)*(t/active.d),y=canvas.height*.25+Math.sin(t/26)*12,s=2.2;
      ctx.save();ctx.globalAlpha=.72;ctx.fillStyle='#b9d8eb';ctx.shadowColor='#8ee8ff';ctx.shadowBlur=18;
      ctx.fillRect(x,y,150*s,42*s);ctx.fillRect(x+28*s,y-18*s,86*s,18*s);ctx.fillRect(x+35*s,y+42*s,48*s,16*s);
      ctx.fillRect(x-28*s,y+4*s,30*s,13*s);ctx.fillRect(x-45*s,y-10*s,18*s,22*s);ctx.fillRect(x-45*s,y+18*s,18*s,22*s);
      ctx.fillStyle='#152338';ctx.fillRect(x+118*s,y+10*s,5*s,5*s);ctx.restore();
    }

    function drawMoonSmile(){
      const x=canvas.width*.82,y=canvas.height*.18,r=Math.min(canvas.width,canvas.height)*.085;
      ctx.save();ctx.fillStyle='#f7f1c9';ctx.shadowColor='#fff1a8';ctx.shadowBlur=25;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#433b4f';ctx.fillRect(x-r*.36,y-r*.18,7,10);ctx.fillRect(x+r*.27,y-r*.18,7,10);
      ctx.strokeStyle='#433b4f';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y+r*.05,r*.35,.1*Math.PI,.9*Math.PI);ctx.stroke();ctx.restore();
    }

    function drawDuck(){
      const bob=Math.sin(active.t/14)*7,x=canvas.width*.5,y=canvas.height*.66+bob,s=3;
      ctx.save();ctx.shadowColor='#ffe18b';ctx.shadowBlur=20;ctx.fillStyle='#ffd957';ctx.fillRect(x-42*s,y-18*s,72*s,32*s);ctx.fillRect(x+18*s,y-42*s,28*s,28*s);ctx.fillStyle='#ff9b2f';ctx.fillRect(x+44*s,y-33*s,22*s,9*s);ctx.fillStyle='#111';ctx.fillRect(x+34*s,y-34*s,5*s,5*s);ctx.restore();
    }

    function drawPetConstellation(){
      const names=[['BINX','🐈‍⬛'],['LOKI','🐈‍⬛'],['CASPER','🐈'],['MOJO','🐕'],['DALLAS','🐕']];
      ctx.save();ctx.textAlign='center';ctx.font='22px monospace';
      names.forEach((n,i)=>{const x=canvas.width*(.18+i*.16),y=canvas.height*(.22+(i%2)*.12);ctx.fillStyle='#fff1a8';ctx.fillText('✦',x,y);ctx.font='16px monospace';ctx.fillText(n[0],x,y+28);ctx.font='20px sans-serif';ctx.fillText(n[1],x,y+54);ctx.font='22px monospace';if(i<names.length-1){ctx.strokeStyle='rgba(217,167,255,.65)';ctx.beginPath();ctx.moveTo(x+15,y);ctx.lineTo(canvas.width*(.18+(i+1)*.16)-15,canvas.height*(.22+((i+1)%2)*.12));ctx.stroke();}});ctx.restore();
    }

    function drawHeartTree(){
      const x=canvas.width*.5,y=canvas.height*.72;
      ctx.save();ctx.fillStyle='#6b3d27';ctx.fillRect(x-18,y-120,36,130);ctx.fillRect(x-70,y-92,70,20);ctx.fillRect(x,y-76,68,20);ctx.fillStyle='#ff6bb5';ctx.shadowColor='#ff9dcc';ctx.shadowBlur=16;
      for(let i=0;i<28;i++){const a=i/28*Math.PI*2,r=58*(1-Math.sin(a));const px=x+Math.cos(a)*r*.65,py=y-118-Math.sin(a)*r*.48;ctx.fillRect(px-8,py-8,16,16);}ctx.restore();
    }

    function drawPoolAwakens(){
      const wx=1333-camera.x,wy=816-camera.y;
      const x=C(wx,90,canvas.width-90),y=C(wy,100,canvas.height-100),r=45+Math.sin(active.t/12)*8;
      ctx.save();ctx.strokeStyle='#8ee8ff';ctx.shadowColor='#d9a7ff';ctx.shadowBlur=28;ctx.lineWidth=5;
      for(let i=0;i<4;i++){ctx.globalAlpha=.8-i*.16;ctx.beginPath();ctx.arc(x,y,r+i*24,0,Math.PI*2);ctx.stroke();}ctx.restore();
    }

    function drawLoveStars(){
      const a=Math.min(1,(active.t-120)/90)*Math.min(1,(active.d-active.t)/110);
      if(a<=0)return;ctx.save();ctx.globalAlpha=a;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${Math.max(36,Math.min(78,canvas.width/11))}px monospace`;ctx.fillStyle='#fff1a8';ctx.shadowColor='#d9a7ff';ctx.shadowBlur=28;ctx.fillText('I LOVE YOU',canvas.width/2,canvas.height*.35);ctx.font='22px monospace';ctx.fillStyle='#ffd1e8';ctx.fillText('ASHTON + TANIMA',canvas.width/2,canvas.height*.44);ctx.restore();
    }

    function drawDragonShadow(){
      const p=active.t/active.d,x=-360+(canvas.width+720)*p,y=canvas.height*.32+Math.sin(active.t/18)*20,s=1.2;
      ctx.save();ctx.globalAlpha=.55;ctx.fillStyle='#07030b';ctx.shadowColor='#32113f';ctx.shadowBlur=24;
      ctx.beginPath();ctx.ellipse(x,y,95*s,38*s,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.moveTo(x-30,y);ctx.lineTo(x-210,y-95);ctx.lineTo(x-130,y+20);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(x+30,y);ctx.lineTo(x+210,y-95);ctx.lineTo(x+130,y+20);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ff5a1f';ctx.fillRect(x-22,y-12,8,5);ctx.fillRect(x+14,y-12,8,5);ctx.restore();
    }

    function drawSpecial(){
      const id=active.def.id;
      if(id==='moon_smile')drawMoonSmile();
      else if(id==='cloud_whale')pixelWhale(active.t);
      else if(id==='giant_duck')drawDuck();
      else if(id==='pet_constellation')drawPetConstellation();
      else if(id==='heart_tree')drawHeartTree();
      else if(id==='wish_pool_awakens')drawPoolAwakens();
      else if(id==='love_in_stars')drawLoveStars();
      else if(id==='dragon_shadow')drawDragonShadow();
      else if(id==='golden_jackpot'&&active.t>180){ctx.save();ctx.font='88px sans-serif';ctx.textAlign='center';ctx.fillText('💰',canvas.width/2,canvas.height*.57);ctx.font='28px monospace';ctx.fillStyle='#ffe18b';ctx.fillText('JACKPOT',canvas.width/2,canvas.height*.66);ctx.restore();}
      else if(id==='bengali_feast_spirit'&&active.t>160){ctx.save();ctx.fillStyle='rgba(78,42,18,.88)';ctx.fillRect(canvas.width/2-210,canvas.height*.68,420,30);ctx.font='44px sans-serif';ctx.textAlign='center';ctx.fillText('🍛  🥟  🍚  🫖  🥭',canvas.width/2,canvas.height*.66);ctx.restore();}
      else if(id==='double_rainbow'){
        ctx.save();ctx.lineWidth=13;COLORS.holi.forEach((c,i)=>{ctx.strokeStyle=c;ctx.beginPath();ctx.arc(canvas.width/2,canvas.height*.82,canvas.width*.38-i*13,Math.PI,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(canvas.width/2,canvas.height*.84,canvas.width*.27-i*10,Math.PI,Math.PI*2);ctx.stroke();});ctx.restore();
      }
    }

    function drawSecret(){
      if(!active)return;
      const f=Math.min(1,active.t/60)*Math.min(1,(active.d-active.t)/90);
      ctx.save();ctx.globalAlpha=.14*f;ctx.fillStyle=active.def.rarity==='legendary'?'#160a25':active.def.id==='holi_memory'?'#ff6bb5':'#20344f';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();
      particles.forEach(drawParticle);drawSpecial();
      if(active.flash>0){ctx.save();ctx.globalAlpha=active.flash/28;ctx.fillStyle=active.def.id==='dragon_shadow'?'#ff5a1f':'#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();}
      const w=Math.min(680,canvas.width-40),x=(canvas.width-w)/2,y=26;
      ctx.save();ctx.globalAlpha=.9*f;ctx.fillStyle='rgba(9,5,18,.9)';ctx.strokeStyle=active.def.rarity==='legendary'?'#ffe18b':'#d9a7ff';ctx.lineWidth=3;
      if(typeof roundRect==='function')roundRect(x,y,w,70,12,true,true);else{ctx.fillRect(x,y,w,70);ctx.strokeRect(x,y,w,70);}
      ctx.fillStyle=active.def.rarity==='legendary'?'#ffe18b':'#d9a7ff';ctx.font='bold 16px monospace';ctx.fillText(active.def.name,x+18,y+27);
      ctx.fillStyle='#fff';ctx.font='13px monospace';ctx.fillText('For one quiet moment, the Wish Pool reveals one of its secrets.',x+18,y+52);ctx.restore();
    }

    const previousFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){
      let next=init;
      try{
        const url=typeof input==='string'?input:(input&&input.url)||'';
        if(url.includes(ENDPOINT)&&init&&init.body){
          const body=JSON.parse(init.body),wish=String(body.wish||'');
          const match=N(body.originalWish||wish).match(/^ashton test secret\s+(.+)$/);
          if(match){const def=eventById(match[1]);if(def){pending={event:def,delay:45,wait:0,forced:true};next={...init,body:JSON.stringify({...body,wish:'soft peaceful sparkles'})};}}
          else if(wish)consider(body.originalWish||wish);
        }
      }catch(e){}
      return previousFetch(input,next);
    };

    const oldUpdate=update;update=function(){oldUpdate();updateSecret();};
    const oldDraw=draw;draw=function(){if(active&&active.shake>0){ctx.save();ctx.translate(R(-active.shake,active.shake),R(-active.shake,active.shake));oldDraw();ctx.restore();}else oldDraw();drawSecret();};

    window.WishSecrets={
      test(id){const def=eventById(id);if(!def)return false;pending={event:def,delay:1,wait:0,forced:true};return true;},
      stop(){pending=null;end();},
      reset(){state=fresh();save();},
      get discoveries(){return state.seen.slice();},
      get progress(){return{found:state.seen.length,total:EVENTS.length,totalWishes:state.totalWishes,sinceSecret:state.sinceSecret,lastSecret:state.lastSecret};},
      get active(){return active?active.def.id:'';},
      events:EVENTS.map(e=>({id:e.id,name:e.name,rarity:e.rarity}))
    };
  }catch(e){console.warn('wish phase4 secrets failed',e);}
})();
