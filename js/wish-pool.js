(function(){
  try{
    if(typeof update !== 'function' || typeof draw !== 'function') return;

    window.WISH_AI_ENDPOINT = 'https://damp-cherry-8310.ashton20-bama.workers.dev';

    const wishPoolBox = {x:1303, y:801, w:60, h:31};
    const wishPoolCenter = {x:wishPoolBox.x + wishPoolBox.w/2, y:wishPoolBox.y + wishPoolBox.h/2};
    const overlayFor = {
      hearts:'pink',kisses:'pink',rings:'gold',letters:'pink',petals:'pink',roses:'pink',stars:'moon',meteors:'moon',moons:'moon',aurora:'rainbow',
      butterflies:'dreamy',fireflies:'moon',bubbles:'blue',confetti:'rainbow',fireworks:'rainbow',snow:'blue',leaves:'gold',ducks:'gold',
      doves:'dreamy',birds:'dreamy',bees:'gold',dragonflies:'blue',fish:'blue',frogs:'green',rain:'blue',waves:'blue',music:'pink',
      lanterns:'gold',feathers:'dreamy',balloons:'rainbow',clouds:'dreamy',lightning:'storm',rainbow:'rainbow',gems:'purple',crowns:'gold',
      cats:'pink',paws:'gold',suns:'gold',candy:'pink',strawberries:'pink',cake:'gold',coins:'gold',helicopters:'blue',flames:'gold',
      sparkles:'dreamy'
    };

    let wishLastE = false;
    let wishCooldown = 0;
    let wishScene = null;
    let wishParticles = [];

    function inWishBox(x,y){return x>=wishPoolBox.x && x<=wishPoolBox.x+wishPoolBox.w && y>=wishPoolBox.y && y<=wishPoolBox.y+wishPoolBox.h;}
    function nearWishPool(){return inWishBox(players.her.x,players.her.y) || inWishBox(players.him.x,players.him.y);}
    function season(){return typeof currentSeason !== 'undefined' ? currentSeason : (localStorage.getItem('currentSeason') || 'summer');}
    function pick(a){return a[Math.floor(Math.random()*a.length)];}
    function rand(a,b){return a+Math.random()*(b-a);}

    function fallbackMessage(type){
      const m = {
        sparkles:['The water glows softly for your wish.','Tiny sparkles dance as your wish is heard.'],
        hearts:['Little hearts drift through the air for your wish.','Love floats gently around you.'],
        kisses:['Tiny kisses float through the air.','Sweet little kisses drift around your wish.'],
        rings:['A tiny ring sparkle circles your wish.','Golden rings shimmer softly in the air.'],
        letters:['Little love letters float from the wish pool.','Tiny messages drift gently through the magic.'],
        petals:['Soft petals swirl as your wish comes alive.','Flowers drift gently through the air.'],
        roses:['Tiny roses bloom from the magic in the water.','Rose petals float softly around your wish.'],
        stars:['Tiny stars twinkle around your wish.','Starlight gathers softly above the water.'],
        meteors:['Shooting stars streak across the sky.','Tiny comets race through your wish.'],
        moons:['Moonlight wraps softly around the wish.','A little moon glow settles over everything.'],
        aurora:['Aurora lights shimmer softly above you.','The sky glows with dreamy colors.'],
        butterflies:['Butterflies flutter softly through your wish.','Butterflies dance through the air for you.'],
        fireflies:['Fireflies glow gently around your wish.','Tiny lights blink softly through the air.'],
        bubbles:['Bubbles float upward from the wish pool.','The water answers with a playful bubble spell.'],
        confetti:['Confetti bursts through the air for your wish.','A tiny celebration pops into the sky.'],
        fireworks:['Tiny fireworks sparkle across the sky.','The wish pops with colorful fireworks.'],
        snow:['Snowflakes fall softly around your wish.','A gentle little snowfall answers the water.'],
        leaves:['Leaves drift peacefully across the screen.','The pool sends a soft autumn breeze.'],
        ducks:['A silly little ducky charm answers your wish.','Tiny ducks waddle through the magic.'],
        doves:['Soft white doves glide through the wish.','Little birds carry the wish gently forward.'],
        birds:['Little birds flutter across the sky.','Tiny birds fly through the magic.'],
        bees:['Tiny bees buzz sweetly around the wish.','A honey-sweet sparkle fills the air.'],
        dragonflies:['Dragonflies shimmer across the water.','Tiny dragonflies zip gently through the air.'],
        fish:['Little fish swim through the magic.','The pool sends tiny fish across the screen.'],
        frogs:['A goofy little frog charm hops through the wish.','Tiny frogs bounce through the magic.'],
        rain:['A soft magical rain answers your wish.','Gentle raindrops shimmer around the pool.'],
        waves:['Soft waves ripple through the screen.','The wish rolls out like glowing water.'],
        music:['Little music notes float from the wish.','The air fills with a soft song.'],
        lanterns:['Lantern lights rise softly into the air.','Warm little lights float around your wish.'],
        feathers:['Soft feathers drift like a gentle promise.','Feathers float quietly through the air.'],
        balloons:['Balloons float upward with your wish.','Tiny balloons carry your wish into the sky.'],
        clouds:['Soft little clouds puff across the screen.','A dreamy mist rolls gently around the wish.'],
        lightning:['A tiny flash of lightning answers your wish.','The sky flickers with playful storm magic.'],
        rainbow:['A rainbow shimmer spreads across the air.','The pool paints the air with rainbow light.'],
        gems:['Tiny gems sparkle from the water.','A purple gem glow shines around your wish.'],
        crowns:['A tiny royal sparkle crowns the wish.','Little crowns shimmer through the air.'],
        cats:['Tiny cat charms pop into the wish.','The pool sends cute little cat magic.'],
        paws:['Little paw prints dance across the magic.','Tiny paws wander through your wish.'],
        suns:['Sunshine glows warmly through the wish.','The pool fills the air with golden light.'],
        candy:['Tiny candy pieces spin through the air.','A sweet little candy spell answers the wish.'],
        strawberries:['Little strawberries float sweetly upward.','The wish pool sends tiny strawberry magic.'],
        cake:['Tiny cake charms celebrate your wish.','A sweet cake sparkle pops into the air.'],
        coins:['Golden coins shimmer through your wish.','Tiny coins sparkle like treasure.'],
        helicopters:['A tiny helicopter flies across the wish.','Little helicopter magic buzzes through the sky.'],
        flames:['Warm little flames flicker through the magic.','A golden fire glow dances softly around the wish.']
      };
      return pick(m[type] || m.sparkles);
    }

    function chooseType(wish){
      const t = `${wish} ${season()}`.toLowerCase();
      const groups = {
        hearts:['heart','hearts','love','romance','romantic','hug','cuddle','sweetheart','forever','together','soulmate','valentine','marry','wedding','anniversary'],
        kisses:['kiss','kisses','xoxo','lips','smooch'],
        rings:['ring','rings','diamond ring','proposal','propose','engaged','engagement'],
        letters:['letter','letters','love letter','mail','message','messages','text me','note to her'],
        petals:['flower','flowers','petal','petals','blossom','bloom','garden','floral','bouquet','lavender','daisy','tulip','sunflower','cherry blossom','spring','meadow'],
        roses:['rose','roses','rose petal','rose petals'],
        meteors:['meteor','meteors','comet','comets','shooting star','shooting stars'],
        stars:['star','stars','starlight','galaxy','constellation','twinkle','starry','space','cosmos'],
        moons:['moon','moonlight','blue moon','full moon','midnight','night sky'],
        aurora:['aurora','northern lights','color sky','sky lights'],
        butterflies:['butterfly','butterflies','flutter'],
        fireflies:['firefly','fireflies','lightning bug','glow bug'],
        bubbles:['bubble','bubbles','bubble bath','bath','foam'],
        fireworks:['firework','fireworks','exploding colors'],
        confetti:['confetti','party','celebrate','celebration','birthday'],
        snow:['snow','snowing','snowflake','snowflakes','winter','ice','frost','frozen','cold','blizzard'],
        leaves:['leaf','leaves','autumn','fall','tree leaves','falling leaves'],
        ducks:['duck','ducks','ducky','duckies','rubber duck','quack'],
        doves:['dove','doves','white bird','peace bird'],
        birds:['bird','birds','songbird','songbirds'],
        bees:['bee','bees','honey','bumblebee','bumblebees'],
        dragonflies:['dragonfly','dragonflies'],
        fish:['fish','fishes','koi','goldfish','swim','swimming'],
        frogs:['frog','frogs','toad','ribbit'],
        rain:['rain','raining','raindrop','raindrops','storm','drizzle','shower','make it rain','rainy','pouring'],
        waves:['wave','waves','ocean','sea','water wave','ripples'],
        music:['music','song','melody','music note','music notes','sing','piano','guitar','dance','our song'],
        lanterns:['lantern','lanterns','candle','candles','warm light','cozy light'],
        feathers:['feather','feathers','angel','wings'],
        balloons:['balloon','balloons'],
        clouds:['cloud','clouds','mist','fog','dream cloud'],
        lightning:['lightning','thunder','electric','zap'],
        rainbow:['rainbow','colorful','colors'],
        gems:['gem','gems','diamond','jewel','crystal','purple gem'],
        crowns:['crown','crowns','princess','queen','royal','tiara'],
        cats:['cat','cats','kitty','kitten','meow'],
        paws:['paw','paws','pawprint','pawprints','puppy','dog'],
        suns:['sun','sunshine','sunlight','sunny','golden','daylight'],
        candy:['candy','sweets','sweet treats','lollipop','chocolate'],
        strawberries:['strawberry','strawberries','berry','berries'],
        cake:['cake','cupcake','cupcakes'],
        coins:['coin','coins','gold coin','treasure','money'],
        helicopters:['helicopter','helicopters','chopper','heli'],
        flames:['flame','flames','fire','dragon','charizard'],
        sparkles:['sparkle','sparkles','glow','glitter','magic','fairy','shine','shimmer','dream','wish','beautiful','light']
      };
      const scores = {};
      Object.keys(groups).forEach(type => {
        scores[type] = 0;
        groups[type].forEach(w => { if(t.includes(w)) scores[type] += w.includes(' ') ? 4 : 1; });
      });
      if(t.includes('across the screen') || t.includes('fill the screen')) Object.keys(scores).forEach(k => {if(scores[k]) scores[k]+=5;});
      if(t.includes('make it rain')) scores.rain += 10;
      if(t.includes('make it snow')) scores.snow += 10;
      if(t.includes('shooting star')) scores.meteors += 10;
      if(t.includes('love letter')) scores.letters += 8;
      if(t.includes('diamond ring')) scores.rings += 10;
      let best = 'sparkles';
      Object.entries(scores).forEach(([k,v]) => {if(v > (scores[best] || 0)) best = k;});
      return best;
    }

    function payload(text){return {wish:text,season:season(),wishPool:{box:wishPoolBox,center:wishPoolCenter},players:{her:{x:Math.round(players.her.x),y:Math.round(players.her.y),dir:players.her.dir},him:{x:Math.round(players.him.x),y:Math.round(players.him.y),dir:players.him.dir}}};}
    async function aiMessage(text,type){
      try{
        const res = await fetch(window.WISH_AI_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload(text))});
        if(!res.ok) throw new Error('AI failed');
        const data = await res.json();
        return data.message || fallbackMessage(type);
      }catch(e){return fallbackMessage(type);}
    }

    function startWishScene(text){
      const type = chooseType(text);
      wishScene = {text,type,overlay:overlayFor[type] || 'dreamy',message:'The water is listening...',timer:0,waiting:true};
      wishParticles = [];
      aiMessage(text,type).then(msg => {if(wishScene && wishScene.text === text){wishScene.message = msg; wishScene.waiting = false; wishScene.timer = 0;}});
    }

    function makeWish(){
      const text = window.prompt('What should we wish for?');
      if(!text || !text.trim()){wishScene = {text:'',type:'sparkles',overlay:'dreamy',message:'The water ripples softly. Maybe next time.',timer:0,waiting:false}; return;}
      startWishScene(text.trim());
    }

    function newParticle(type){
      const w = canvas.width, h = canvas.height;
      const p = {type,life:150,x:rand(0,w),y:rand(0,h),vx:rand(-.4,.4),vy:rand(-.6,.6),size:rand(3,7),phase:rand(0,100),color:pick(['#ff7ac8','#ffe18b','#8ee8ff','#d9a7ff','#a8ffb5'])};
      if(['petals','roses','leaves','feathers','confetti','candy'].includes(type)){p.x=rand(0,w);p.y=-20;p.life=220;p.vx=rand(-.8,.8);p.vy=rand(.7,1.7);}
      else if(['hearts','kisses','rings','letters','strawberries','cake','coins'].includes(type)){p.x=rand(-20,w+20);p.y=h+25;p.life=230;p.vx=rand(-.35,.35);p.vy=rand(-1.6,-.7);}
      else if(['stars','moons','sparkles','gems','crowns','suns','aurora'].includes(type)){p.x=rand(20,w-20);p.y=rand(40,h-80);p.life=180;p.vy=rand(-.35,.15);}
      else if(['meteors'].includes(type)){p.x=rand(-40,w*.75);p.y=rand(20,h*.35);p.life=90;p.vx=rand(2.1,3.8);p.vy=rand(1.1,2.2);p.size=rand(3,6);}
      else if(type==='rain'){p.x=rand(0,w);p.y=rand(-80,-10);p.life=95;p.vy=rand(3,5.2);p.size=rand(2,4);}
      else if(type==='snow'){p.x=rand(0,w);p.y=rand(-60,-10);p.life=230;p.vx=rand(-.45,.45);p.vy=rand(.55,1.25);}
      else if(['ducks','fish','frogs','waves','helicopters'].includes(type)){p.x=-60;p.y=h-rand(80,220);p.life=390;p.vx=rand(.75,1.8);p.vy=0;}
      else if(['butterflies','doves','birds','bees','dragonflies'].includes(type)){p.x=Math.random()<.5?-30:w+30;p.y=rand(80,h-120);p.life=270;p.vx=p.x<0?rand(.7,1.7):rand(-1.7,-.7);p.vy=rand(-.25,.25);}
      else if(type==='fireflies'){p.x=rand(20,w-20);p.y=rand(80,h-130);p.life=260;p.vx=rand(-.25,.25);p.vy=rand(-.25,.25);p.size=rand(2,4);}
      else if(['bubbles','balloons','lanterns','music','cats','paws'].includes(type)){p.x=rand(0,w);p.y=h+25;p.life=250;p.vx=rand(-.35,.35);p.vy=rand(-1.35,-.55);}
      else if(type==='clouds'){p.x=-70;p.y=rand(70,h-160);p.life=360;p.vx=rand(.35,.9);p.vy=0;p.size=rand(10,18);}
      else if(['lightning','fireworks','flames'].includes(type)){p.x=rand(40,w-40);p.y=rand(20,h*.55);p.life=type==='fireworks'?70:36;p.vx=0;p.vy=0;p.size=rand(8,16);}
      return p;
    }

    function spawnParticles(){
      const type = wishScene.waiting ? 'sparkles' : wishScene.type;
      const many = ['rain','snow','confetti','petals','hearts','leaves','fireworks','candy','bubbles'].includes(type) ? 4 : (['fireflies','bees','dragonflies','meteors','kisses','coins'].includes(type)?2:1);
      for(let i=0;i<many;i++) wishParticles.push(newParticle(type));
    }

    function updateWishScene(){
      if(wishCooldown>0) wishCooldown--;
      const promptBox = document.getElementById('prompt');
      if(!wishScene && nearWishPool()){promptBox.style.display='block'; promptBox.textContent='Press E to make a wish';}
      if(keys.e && !wishLastE && !wishScene && nearWishPool() && wishCooldown<=0){makeWish(); wishCooldown=25;}
      if(wishScene){wishScene.timer++; if(wishScene.timer%(wishScene.waiting?10:3)===0) spawnParticles(); if(!wishScene.waiting && wishScene.timer>560){wishScene=null;wishParticles=[];wishCooldown=35;}}
      wishParticles = wishParticles.filter(p => {p.life--;p.phase++;p.x+=p.vx||0;p.y+=p.vy||0;if(['butterflies','fireflies','snow','petals','roses','leaves','feathers','doves','birds','bees','dragonflies','candy'].includes(p.type)) p.x += Math.sin(p.phase/18)*.35;if(['ducks','fish','frogs','waves','helicopters'].includes(p.type)) p.y += Math.sin(p.phase/12)*.18;return p.life>0 && p.x>-140 && p.x<canvas.width+140 && p.y>-140 && p.y<canvas.height+140;});
      wishLastE=!!keys.e;
    }

    function box(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
    function star(x,y,s,c){box(x-s/2,y-s*2,s,s*4,c);box(x-s*2,y-s/2,s*4,s,c);}
    function duck(x,y,s){box(x,y,s*4,s*2,'#ffd957');box(x+s*3,y-s,s*2,s*2,'#ffd957');box(x+s*5,y,s,s,'#ff9b42');box(x+s*4,y-s,s,s,'#241820');}
    function petal(x,y,s,c){ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(heartTimer/20+x)*.8);box(-s/2,-s,s,s*2,c);box(0,-s,Math.max(1,s/2),Math.max(1,s/2),'#ffd1e8');ctx.restore();}
    function butterfly(x,y,s,p){box(x-s*2,y-s+Math.sin(p.phase/6)*s,s*2,s*2,'#ff9dcc');box(x+s*.4,y-s-Math.sin(p.phase/6)*s,s*2,s*2,'#d9a7ff');box(x-s*.2,y-s*.8,s*.5,s*2,'#241820');}
    function circle(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
    function note(x,y,s){ctx.fillStyle='#fff1c8';ctx.font=`${Math.round(s*4)}px monospace`;ctx.fillText(pick(['♪','♫','♬']),x,y);}
    function cat(x,y,s){box(x-s*1.5,y-s,s*3,s*2,'#ffd1e8');box(x-s*1.5,y-s*2,s,s,'#ffd1e8');box(x+s*.5,y-s*2,s,s,'#ffd1e8');box(x-s*.8,y-s*.3,s*.45,s*.45,'#241820');box(x+s*.35,y-s*.3,s*.45,s*.45,'#241820');}
    function paw(x,y,s){box(x-s,y,s*2,s*1.5,'#ffd982');box(x-s*1.6,y-s*1.3,s,s,'#ffd982');box(x-s*.4,y-s*1.7,s,s,'#ffd982');box(x+s*.8,y-s*1.3,s,s,'#ffd982');}
    function bird(x,y,s,c){box(x-s*2,y,s*2,s,c);box(x+s*.5,y,s*2,s,c);box(x-s*.3,y-s*.4,s*.7,s*.7,c);}
    function bee(x,y,s){box(x-s*2,y-s,s*4,s*2,'#ffd957');box(x-s,y-s,s*.5,s*2,'#241820');box(x+s*.5,y-s,s*.5,s*2,'#241820');box(x-s,y-s*2,s,s,'#cfffff');box(x+s*.2,y-s*2,s,s,'#cfffff');}
    function fish(x,y,s){box(x-s*2,y-s,s*4,s*2,'#ff9b42');box(x+s*2,y-s,s*1.5,s*2,'#ffd957');box(x-s*1.2,y-s*.3,s*.5,s*.5,'#241820');}
    function frog(x,y,s){box(x-s*2,y-s,s*4,s*2,'#70d86b');box(x-s*1.5,y-s*2,s,s,'#70d86b');box(x+s*.5,y-s*2,s,s,'#70d86b');box(x-s*1.25,y-s*1.7,s*.4,s*.4,'#241820');box(x+s*.75,y-s*1.7,s*.4,s*.4,'#241820');}
    function heli(x,y,s){box(x-s*3,y-s,s*5,s*2,'#8ee8ff');box(x+s*2,y-s*.5,s*2,s,'#d9a7ff');box(x-s*2,y-s*2,s*4,s*.4,'#fff1c8');box(x-s,y+s,s*2,s*.4,'#fff1c8');}
    function lips(x,y,s){box(x-s*2,y-s,s*4,s,'#ff5f9c');box(x-s*1.5,y,s*3,s,'#d9417f');}
    function ring(x,y,s){ctx.strokeStyle='#ffd957';ctx.lineWidth=Math.max(2,s/2);ctx.beginPath();ctx.arc(x,y,s*2,0,Math.PI*2);ctx.stroke();star(x,y-s*2.4,s,'#baf7ff');}
    function letter(x,y,s){box(x-s*2,y-s*1.3,s*4,s*2.6,'#fff1e8');ctx.strokeStyle='#d9a7ff';ctx.beginPath();ctx.moveTo(x-s*2,y-s*1.3);ctx.lineTo(x,y);ctx.lineTo(x+s*2,y-s*1.3);ctx.stroke();}
    function strawberry(x,y,s){box(x-s,y-s,s*2,s*2,'#ff3f6e');box(x-s*.5,y+s,s,s,'#ff3f6e');box(x-s*.8,y-s*1.5,s*1.6,s*.7,'#42a35a');}
    function cake(x,y,s){box(x-s*2,y-s,s*4,s*2,'#ffd1e8');box(x-s*2,y-s*1.6,s*4,s*.6,'#fff1c8');box(x-s*.2,y-s*2.8,s*.4,s*1.2,'#ffe18b');}
    function flame(x,y,s){box(x-s,y-s,s*2,s*3,'#ff9b42');box(x-s*.5,y-s*1.6,s,s*2,'#ffe18b');}
    function firework(x,y,s,p){for(let i=0;i<8;i++){const a=i*Math.PI/4+p.phase/8;star(x+Math.cos(a)*s*2.5,y+Math.sin(a)*s*2.5,s*.7,p.color);}}

    function drawParticle(p){
      const x=p.x,y=p.y,s=p.size,a=Math.max(0,Math.min(1,p.life/90)); ctx.save(); ctx.globalAlpha=a;
      if(p.type==='hearts' && typeof drawPixelHeart==='function'){ctx.shadowColor='#ff7ac8';ctx.shadowBlur=10;drawPixelHeart(x,y,s);}
      else if(p.type==='kisses') lips(x,y,s);
      else if(p.type==='rings') ring(x,y,s);
      else if(p.type==='letters') letter(x,y,s);
      else if(p.type==='petals') petal(x,y,s,'#ff9dcc');
      else if(p.type==='roses'){petal(x,y,s,'#d9417f');box(x-s*.4,y+s*.8,s*.8,s*1.4,'#42a35a');}
      else if(p.type==='stars'||p.type==='sparkles') star(x,y,s,'#fff1a8');
      else if(p.type==='meteors'){ctx.shadowColor='#fff1a8';ctx.shadowBlur=12;star(x,y,s,'#fff1a8');box(x-s*5,y-s*2,s*4,s,'rgba(255,241,168,.65)');}
      else if(p.type==='moons'){circle(x,y,s*2,'#f5f2ff');circle(x+s*.9,y-s*.3,s*2,'rgba(12,8,24,.85)');}
      else if(p.type==='aurora') box(x,y,s*8,s,p.color);
      else if(p.type==='ducks') duck(x,y,s);
      else if(p.type==='doves') bird(x,y,s,'#ffffff');
      else if(p.type==='birds') bird(x,y,s,'#ffd1e8');
      else if(p.type==='bees') bee(x,y,s);
      else if(p.type==='dragonflies'){bird(x,y,s,'#8ee8ff');box(x-s*.3,y-s*.2,s*.6,s*.6,'#241820');}
      else if(p.type==='fish') fish(x,y,s);
      else if(p.type==='frogs') frog(x,y,s);
      else if(p.type==='rain') box(x,y,s,s*3,'#8ee8ff');
      else if(p.type==='waves'){ctx.strokeStyle='#8ee8ff';ctx.lineWidth=Math.max(2,s/2);ctx.beginPath();ctx.moveTo(x-s*3,y);ctx.quadraticCurveTo(x-s,y-s,x+s,y);ctx.quadraticCurveTo(x+s*2,y+s,x+s*4,y);ctx.stroke();}
      else if(p.type==='snow') star(x,y,s,'#fff');
      else if(p.type==='leaves') petal(x,y,s,'#d58a3b');
      else if(p.type==='butterflies') butterfly(x,y,s,p);
      else if(p.type==='fireflies'){ctx.shadowColor='#eaff9a';ctx.shadowBlur=14;box(x,y,s,s,'#f5ff9a');}
      else if(p.type==='bubbles'){ctx.strokeStyle='#baf7ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,s*1.7,0,Math.PI*2);ctx.stroke();}
      else if(p.type==='confetti') box(x,y,s*1.6,s*.9,p.color);
      else if(p.type==='fireworks') firework(x,y,s,p);
      else if(p.type==='music') note(x,y,s);
      else if(p.type==='lanterns'){ctx.shadowColor='#ffd982';ctx.shadowBlur=16;box(x-s,y-s*2,s*2,s*3,'#ffb84d');box(x-s*.6,y-s*1.4,s*1.2,s*1.8,'#ffe18b');}
      else if(p.type==='feathers') petal(x,y,s,'#fff1e8');
      else if(p.type==='balloons'){ctx.strokeStyle='#fff1c8';ctx.beginPath();ctx.moveTo(x,y+s*2);ctx.lineTo(x,y+s*5);ctx.stroke();circle(x,y,s*2,p.color);}
      else if(p.type==='clouds'){ctx.globalAlpha*=.65;circle(x,y,s,'#f6f3ff');circle(x+s,y-s*.3,s*.9,'#f6f3ff');circle(x+s*2,y,s,'#f6f3ff');}
      else if(p.type==='lightning'){ctx.shadowColor='#fff277';ctx.shadowBlur=16;star(x,y,s,'#fff277');}
      else if(p.type==='rainbow') box(x,y,s*3,s,p.color);
      else if(p.type==='gems'){ctx.fillStyle='#b87cff';ctx.beginPath();ctx.moveTo(x,y-s*2);ctx.lineTo(x+s*1.6,y-s*.5);ctx.lineTo(x,y+s*2);ctx.lineTo(x-s*1.6,y-s*.5);ctx.closePath();ctx.fill();}
      else if(p.type==='crowns'){box(x-s*2,y,s*4,s,'#ffd957');box(x-s*2,y-s*2,s,s*2,'#ffd957');box(x-s*.4,y-s*3,s,s*3,'#ffd957');box(x+s*1.2,y-s*2,s,s*2,'#ffd957');}
      else if(p.type==='cats') cat(x,y,s);
      else if(p.type==='paws') paw(x,y,s);
      else if(p.type==='suns'){ctx.shadowColor='#ffe18b';ctx.shadowBlur=18;circle(x,y,s*2,'#ffe18b');}
      else if(p.type==='candy'){box(x-s,y-s,s*2,s*2,p.color);box(x-s*2,y-s*.5,s,s,'#fff1c8');box(x+s,y-s*.5,s,s,'#fff1c8');}
      else if(p.type==='strawberries') strawberry(x,y,s);
      else if(p.type==='cake') cake(x,y,s);
      else if(p.type==='coins'){circle(x,y,s*1.8,'#ffd957');box(x-s*.5,y-s,s,s*2,'#ffe18b');}
      else if(p.type==='helicopters') heli(x,y,s);
      else if(p.type==='flames') flame(x,y,s);
      else box(x,y,s,s,'#fff1a8');
      ctx.restore();
    }

    function drawOverlay(){
      if(!wishScene || wishScene.waiting) return;
      const fade=Math.min(1,wishScene.timer/60)*Math.min(1,(560-wishScene.timer)/80); if(fade<=0) return;
      ctx.save(); ctx.globalAlpha=.14*fade;
      const o=wishScene.overlay;
      if(o==='rainbow'){const g=ctx.createLinearGradient(0,0,canvas.width,0);g.addColorStop(0,'#ff6b6b');g.addColorStop(.25,'#ffd93d');g.addColorStop(.5,'#6bff95');g.addColorStop(.75,'#6bcfff');g.addColorStop(1,'#b06bff');ctx.fillStyle=g;}
      else ctx.fillStyle = {pink:'#ff7ac8',gold:'#ffe18b',blue:'#75d8ff',purple:'#b87cff',storm:'#52607a',moon:'#dce7ff',dreamy:'#f7d6ff',green:'#85e889'}[o] || '#f7d6ff';
      ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();
    }

    function wrap(text,maxWidth,maxLines){const words=String(text||'').split(/\s+/).filter(Boolean),lines=[];let line='';words.forEach(word=>{const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width<=maxWidth) line=test;else{if(line) lines.push(line);line=word;}});if(line)lines.push(line);if(lines.length>maxLines){const k=lines.slice(0,maxLines);k[maxLines-1]=k[maxLines-1]+'...';return k;}return lines.length?lines:[''];}
    function drawWishMessage(){
      if(!wishScene) return;
      const alpha=wishScene.waiting?.9:Math.min(1,wishScene.timer/40)*Math.min(1,(560-wishScene.timer)/80);
      const boxW=Math.min(760,canvas.width-48),x=Math.round(canvas.width/2-boxW/2),y=28,pad=22,textW=boxW-pad*2;
      ctx.save();ctx.globalAlpha=Math.max(0,alpha);ctx.font='18px monospace';const msg=wrap(wishScene.message,textW,3);ctx.font='14px monospace';const wish=wishScene.text?wrap(`Wish: ${wishScene.text}`,textW,2):[];const boxH=72+msg.length*23+wish.length*19;
      ctx.fillStyle='rgba(12,8,24,.93)';ctx.strokeStyle='#d9a7ff';ctx.lineWidth=4;roundRect(x,y,boxW,boxH,16,true,true);
      ctx.fillStyle='#d9a7ff';ctx.font='bold 26px monospace';ctx.fillText('Wish Pool',x+pad,y+38);
      ctx.fillStyle='#fff1c8';ctx.font='18px monospace';msg.forEach((line,i)=>ctx.fillText(line,x+pad,y+70+i*23));
      if(wish.length){ctx.fillStyle='rgba(255,255,255,.78)';ctx.font='14px monospace';wish.forEach((line,i)=>ctx.fillText(line,x+pad,y+70+msg.length*23+8+i*19));}
      ctx.restore();
    }

    const originalWishUpdate=update; update=function(){originalWishUpdate();updateWishScene();};
    const originalWishDraw=draw; draw=function(){originalWishDraw();drawOverlay();wishParticles.forEach(drawParticle);drawWishMessage();};
    if(typeof drawDebugZones==='function'){const oldDebug=drawDebugZones;drawDebugZones=function(){oldDebug();if(!debugMode)return;ctx.save();drawDebugRect(wishPoolBox,'rgba(180,80,255,.34)');drawDebugText('Wish Pool Start',wishPoolBox.x,wishPoolBox.y);ctx.restore();};}
  }catch(e){console.warn('wish-pool failed',e);}
})();