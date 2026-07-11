// Phase 1 Wish Pool content packs: romance, Bengali culture, food, pets, money, weather, magic, space, holidays, emotions, comedy, and secrets.
(function(){
  try{
    if(typeof update!=='function'||typeof draw!=='function') return;

    const endpoint='damp-cherry-8310.ashton20-bama.workers.dev';
    const particles=[];
    let scene=null;
    let lastConcept=null;
    let intensity=1;

    const rnd=(a,b)=>a+Math.random()*(b-a);
    const pick=a=>a[Math.floor(Math.random()*a.length)];
    const norm=s=>String(s||'').toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ').trim();
    const has=(t,arr)=>arr.some(x=>t.includes(x));

    const packs={
      romance:{
        keys:['i love you','love you','i miss you','miss you','kiss me','kiss ashton','kiss tanima','hug me','hold my hand','cuddle','dance with me','first kiss','first date','stay forever','never leave','forever together','soulmate','my home','my person','our future','get married','marry me','wedding','honeymoon','million kisses','endless love','beautiful life','my bright star','amar mishti','bhalobasha','bhalobasi','shona','jaan','baba'],
        icons:['❤','♥','💗','🌹','✨'],overlay:'pink',message:'Love fills the whole world around you.'
      },
      holi:{
        keys:['holi','happy holi','throw colors','throw colour','color powder','colour powder','festival of colors','festival of colours','rang','abir'],
        icons:['●','✦','✹','❋'],colors:['#ff3f6e','#ff9b2f','#ffd93d','#54e36f','#4fb6ff','#a86cff'],overlay:'rainbow',message:'Your Holi memory bursts back to life in every color.'
      },
      bengaliFestival:{
        keys:['pohela boishakh','pohela boishakh','bangla new year','eid mubarak','happy eid','eid','durga puja','pujo','diyas','rangoli','alpana','bengali celebration'],
        icons:['🏮','✦','🌙','🌸','✨'],overlay:'gold',message:'Warm lights and celebration gather around your wish.'
      },
      bengaliFood:{
        keys:['biryani','kacchi biryani','kacchi','tehari','fuchka','puchka','phuchka','roshogolla','rasgulla','mishti','sandesh','chomchom','cham cham','jilapi','jalebi','mishti doi','doi','luchi','paratha','shingara','singara','samosa','khichuri','khichdi','ilish','hilsa','chicken curry','beef curry','mutton curry','cha','chai','mango lassi','payesh','pitha','bhorta','dal','polao','pulao','korma','rezala','haleem','kabob','kebab'],
        icons:['🍛','🥘','🥟','🍚','🫖','🥭'],overlay:'warm',message:'A delicious Bengali feast floats through the air.'
      },
      food:{
        keys:['pizza','burger','hamburger','cheeseburger','fries','french fries','taco','tacos','nachos','cookie','cookies','ice cream','milkshake','donut','donuts','doughnut','brownie','brownies','cake','cupcake','pancake','pancakes','waffle','waffles','steak','sushi','ramen','spaghetti','pasta','popcorn','cheese','sandwich','hot dog','chicken nuggets','nuggets','mac and cheese','chocolate','candy','cotton candy','coffee','hot chocolate','tea','lemonade','smoothie','watermelon','strawberry','mango','apple pie','pie','lobster','shrimp','crab','salad','soup','bread','croissant','biscuit','cereal','bacon','eggs'],
        icons:['🍕','🍔','🍟','🌮','🍪','🍦','🍩','🍰','🍿','☕'],overlay:'warm',message:'Your craving becomes a ridiculous floating feast.'
      },
      pets:{
        keys:['binx','loki','casper','mojo','dallas','our pets','our animals','black cat','white cat','shih tzu'],
        icons:['🐈‍⬛','🐈‍⬛','🐈','🐕','🐕'],overlay:'cozy',message:'Your favorite little animals come running into the magic.'
      },
      animals:{
        keys:['fox','foxes','owl','owls','deer','rabbit','rabbits','bunny','bunnies','squirrel','squirrels','raccoon','raccoons','turtle','turtles','koi','hummingbird','hummingbirds','cardinal','cardinals','blue jay','blue jays','ladybug','ladybugs','unicorn','pegasus','griffin','phoenix','mermaid','kraken','forest spirit','fairy','fairies'],
        icons:['🦊','🦉','🦌','🐇','🐿','🦝','🐢','🦄','🧚'],overlay:'dreamy',message:'A tiny parade of magical creatures answers the wish.'
      },
      money:{
        keys:['money','cash','dollar','dollars','rich','wealth','fortune','lottery','jackpot','millionaire','billionaire','gold bar','gold bars','coins','coin rain','money rain','money tornado','cash explosion','treasure','diamonds','diamond shower','credit card','credit cards','wallet','wallets','money bag','piggy bank','bank account','payday','raise','bonus','shopping spree','make tanima rich','make us rich'],
        icons:['💵','💸','💰','🪙','💎','💳'],overlay:'gold',message:'Tanima-level wealth rains across the entire world.'
      },
      cozy:{
        keys:['cozy','cosy','peaceful','relax','relaxing','sleepy','tired','warm evening','soft rain','calm','comfort me','i need comfort','safe','make me feel safe','quiet night','candlelight'],
        icons:['🏮','✨','🍂','☕','🌙'],overlay:'warm',message:'The world becomes quiet, warm, and safe for a while.'
      },
      emotion:{
        keys:['i am sad',"i'm sad",'im sad','lonely','i feel alone','i miss home','homesick','scared','afraid','anxious','worried','bad day','need a hug','cheer me up','make me happy','happiness','hope','good luck','luck','feel better'],
        icons:['❤','✨','🌸','🦋','🏮'],overlay:'soft',message:'The wish pool stays close and wraps the moment in kindness.'
      },
      weather:{
        keys:['monsoon','heavy rain','thunderstorm','storm','rain','drizzle','snow','blizzard','fog','mist','wind','windy','golden hour','sunrise','sunset','rainbow','aurora','northern lights','moonlight','starry night','heatwave','cloudy','hail','tornado','flood','earthquake','volcano','lightning'],
        icons:['🌧','❄','⚡','🌈','🌙','☁','🍃'],overlay:'weather',message:'The sky changes itself to match your wish.'
      },
      space:{
        keys:['space','galaxy','stars','shooting stars','meteor shower','comet','moon','planet','planets','saturn','black hole','constellation','universe','alien','aliens','ufo','eclipse','blood moon'],
        icons:['★','✦','☄','🌙','🪐','👽'],overlay:'space',message:'The universe leans closer to listen.'
      },
      magic:{
        keys:['magic','magical world','i can fly','let me fly','give me wings','invisible','invisibility','teleport','teleport us','powers','superpowers','time stop','stop time','slow time','turn invisible','make me taller','make me tiny','shrink me','grow me','castle','kingdom','queen','king','princess','royal parade'],
        icons:['✨','🪽','👑','🔮','🪄'],overlay:'purple',message:'Reality bends just enough to make the impossible feel close.'
      },
      funny:{
        keys:['chaos','cause chaos','surprise me','random wish','ashton farted','fart','bald ashton','ashton was bald','duck world','ducks rule','frog king','everything bounce','everything spin','pizza rain','cheese rain','flying socks','homework'],
        icons:['🦆','🐸','🧀','🧦','💥','😂'],overlay:'chaos',message:'The wish pool makes a terrible decision on purpose.'
      },
      travel:{
        keys:['bangladesh','alabama','disney','beach','ocean vacation','camping','mountains','road trip','airport','atlanta','birmingham','vacation','holiday trip'],
        icons:['✈','🏝','⛰','🏕','🚙'],overlay:'sunset',message:'For a moment, the world feels like somewhere new.'
      },
      holiday:{
        keys:['christmas','halloween','valentine','valentines day','birthday','new year','thanksgiving','easter','anniversary','our anniversary'],
        icons:['🎄','🎃','💝','🎂','🎆','🎁'],overlay:'celebration',message:'The whole map joins your celebration.'
      },
      dark:{
        keys:['darkness','evil','curse','apocalypse','end the world','destroy everything','take his soul','take her soul','kill ashton','kill tanima','ghosts','demons','bats','crows','blood moon','black sun','void','dark portal','meteor strike','dragon attack','charizard attack'],
        icons:['☠','👻','🦇','🔥','☄'],overlay:'dark',message:'The pool pauses... then grants the terrible idea anyway.'
      }
    };

    const colorSets={
      pink:['#ff6bb5','#ff9dcc','#ffd1e8'],rainbow:['#ff3f6e','#ff9b2f','#ffd93d','#54e36f','#4fb6ff','#a86cff'],gold:['#ffd957','#ffe18b','#ffb84d'],warm:['#ffb56b','#ffd6a5','#fff1c8'],cozy:['#ffd982','#ffb56b','#f7d6ff'],dreamy:['#d9a7ff','#8ee8ff','#ffd1e8'],soft:['#ffd1e8','#fff1c8','#d9a7ff'],weather:['#8ee8ff','#dce7ff','#fff'],space:['#fff1a8','#d9a7ff','#8ee8ff'],purple:['#b87cff','#d9a7ff','#f7d6ff'],chaos:['#ff3f6e','#ffd93d','#4fb6ff'],sunset:['#ff9b6b','#ffd982','#d9a7ff'],celebration:['#ff7ac8','#ffe18b','#8ee8ff'],dark:['#a40018','#32113f','#111018']
    };

    function classify(text){
      const t=norm(text);
      if(['more','more!','even more','again','do it again'].includes(t)&&lastConcept){intensity=Math.min(4,intensity+1);return lastConcept;}
      if(has(t,['too much','stop','enough','make it stop'])){intensity=1;lastConcept=null;return null;}
      const matches=[];
      Object.entries(packs).forEach(([name,p])=>{let score=0;p.keys.forEach(k=>{if(t.includes(k))score+=k.includes(' ')?4:1;});if(score)matches.push({name,p,score});});
      if(!matches.length) return null;
      matches.sort((a,b)=>b.score-a.score);
      const result=matches[0];lastConcept=result;intensity=1;return result;
    }

    function startLocalWish(text){
      const concept=classify(text);if(!concept){scene=null;return;}
      const p=concept.p;scene={timer:0,duration:520+intensity*90,pack:concept.name,message:p.message,overlay:p.overlay,icons:p.icons,colors:p.colors||colorSets[p.overlay]||colorSets.dreamy,text};
      particles.length=0;
      const count=18+intensity*14;
      for(let i=0;i<count;i++) spawnParticle(scene,true);
    }

    function spawnParticle(s,initial){
      const icon=pick(s.icons), colors=s.colors, fromTop=['holi','food','bengaliFood','money','holiday','funny'].includes(s.pack);
      particles.push({icon,color:pick(colors),x:rnd(0,canvas.width),y:initial?rnd(0,canvas.height):(fromTop?-30:canvas.height+30),vx:rnd(-.7,.7),vy:fromTop?rnd(.7,1.8):rnd(-1.5,-.5),life:rnd(180,360),size:rnd(18,34),phase:rnd(0,100)});
    }

    const realFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){
      try{
        const url=typeof input==='string'?input:(input&&input.url)||'';
        if(url.includes(endpoint)&&init&&init.body){const body=JSON.parse(init.body);if(body&&body.wish)startLocalWish(body.wish);}
      }catch(e){}
      return realFetch(input,init);
    };

    function updatePack(){
      if(!scene)return;scene.timer++;
      if(scene.timer%Math.max(2,8-intensity)===0&&particles.length<120)spawnParticle(scene,false);
      particles.forEach(p=>{p.life--;p.phase++;p.x+=p.vx+Math.sin(p.phase/15)*.18;p.y+=p.vy;});
      for(let i=particles.length-1;i>=0;i--)if(particles[i].life<=0||particles[i].y<-80||particles[i].y>canvas.height+80)particles.splice(i,1);
      if(scene.timer>scene.duration){scene=null;particles.length=0;}
    }

    function overlay(){
      if(!scene)return;const fade=Math.min(1,scene.timer/45)*Math.min(1,(scene.duration-scene.timer)/70);ctx.save();ctx.globalAlpha=.10*fade;
      if(scene.overlay==='rainbow'){const g=ctx.createLinearGradient(0,0,canvas.width,0);scene.colors.forEach((c,i)=>g.addColorStop(i/(scene.colors.length-1),c));ctx.fillStyle=g;}
      else ctx.fillStyle=scene.colors[0]||'#d9a7ff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();
    }

    function drawPack(){
      if(!scene)return;overlay();ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
      particles.forEach(p=>{ctx.save();ctx.globalAlpha=Math.min(1,p.life/55);ctx.font=`${Math.round(p.size)}px "Segoe UI Emoji", sans-serif`;ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=8;ctx.fillText(p.icon,p.x,p.y);ctx.restore();});
      const w=Math.min(720,canvas.width-40),x=(canvas.width-w)/2,y=130;ctx.globalAlpha=.93;ctx.fillStyle='rgba(12,8,24,.9)';ctx.strokeStyle=scene.colors[0];ctx.lineWidth=3;roundRect(x,y,w,72,12,true,true);ctx.fillStyle='#fff1c8';ctx.font='bold 18px monospace';ctx.fillText(scene.message,x+w/2,y+29);ctx.fillStyle='rgba(255,255,255,.72)';ctx.font='13px monospace';ctx.fillText(`Phase 1: ${scene.pack}`,x+w/2,y+53);ctx.restore();
    }

    const oldUpdate=update;update=function(){oldUpdate();updatePack();};
    const oldDraw=draw;draw=function(){oldDraw();drawPack();};

    window.WishPhase1={packs,start:startLocalWish,get active(){return !!scene;}};
  }catch(e){console.warn('wish phase 1 packs failed',e);}
})();