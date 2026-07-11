// Phase 4 completion: personal hidden wishes, a discovery journal, milestones, and the Forever Finale.
(function(){
  try{
    if(typeof update!=='function'||typeof draw!=='function')return;

    const ENDPOINT='damp-cherry-8310.ashton20-bama.workers.dev';
    const STORE='wishPoolPhase4Completion';
    const R=(a,b)=>a+Math.random()*(b-a);
    const P=a=>a[Math.floor(Math.random()*a.length)];
    const C=(v,a,b)=>Math.max(a,Math.min(b,v));
    const N=s=>String(s||'').toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ').trim();

    const PERSONAL=[
      {id:'bright_star',name:'My Bright Star',rarity:'personal',duration:760,match:t=>/my bright star|amar tara|brightest star/.test(t)},
      {id:'everything_ok',name:'Everything Will Be Okay',rarity:'personal',duration:720,match:t=>/everything will be (ok|okay)|it will be (ok|okay)|we will be (ok|okay)/.test(t)},
      {id:'bhalobasha_forever',name:'Bhalobasha Forever',rarity:'personal',duration:820,match:t=>/(bhalobasha|bhalobasi|ami tomake bhalobashi)/.test(t)&&/forever|always|endless/.test(t)},
      {id:'holi_dance',name:'The Holi Dance',rarity:'hidden',duration:820,match:t=>/holi|rang|abir/.test(t)&&/dance|together|again|memory/.test(t)},
      {id:'money_moon',name:'Money Under Moonlight',rarity:'hidden',duration:780,match:t=>/money|cash|rich|wealth|diamond/.test(t)&&/moon|moonlight|night|stars/.test(t)},
      {id:'bengali_home',name:'A Little Piece of Home',rarity:'personal',duration:820,match:t=>/bangladesh|bengali|bangla/.test(t)&&/home|miss|homesick|remember/.test(t)},
      {id:'five_companions',name:'The Five Companions',rarity:'hidden',duration:820,match:t=>['binx','loki','casper','mojo','dallas'].every(x=>t.includes(x))},
      {id:'dragon_bow',name:'The Dragon Bows',rarity:'legendary',duration:900,match:t=>/dragon|charizard/.test(t)&&/protect|love|friend|bow|peace/.test(t)},
      {id:'million_kisses',name:'One Million Kisses',rarity:'hidden',duration:760,match:t=>/million|thousand|endless/.test(t)&&/kiss|kisses/.test(t)},
      {id:'queen_of_valley',name:'Queen of the Valley',rarity:'personal',duration:850,match:t=>/tanima/.test(t)&&/queen|princess|royal/.test(t)&&/money|rich|wealth|diamond|gold/.test(t)},
      {id:'anniversary_clock',name:'The Anniversary Clock',rarity:'legendary',duration:900,match:t=>/anniversary|one year/.test(t)&&/stop time|freeze time|forever|moment/.test(t)}
    ];

    const FINALE={id:'forever_finale',name:'The Forever Finale',rarity:'mythic',duration:1180};
    const ALL=[...PERSONAL,FINALE];
    const COLORS={
      gold:['#ffd957','#ffe9a8','#ffb52e'],pink:['#ff6bb5','#ffd1e8','#fff1c8'],
      sky:['#8ee8ff','#d9a7ff','#fff1a8'],holi:['#ff315d','#ff9b2f','#ffd93d','#4fe06a','#3da8ff','#a45cff'],
      green:['#0f8a4b','#f05a67','#ffe9a8'],dark:['#12071f','#32113f','#ff6a2a']
    };

    const fresh=()=>({version:1,seen:[],counts:{},milestones:[],last:'',finaleUnlocked:false,finaleSeen:false,totalPersonal:0});
    function load(){try{return Object.assign(fresh(),JSON.parse(localStorage.getItem(STORE)||'null')||{});}catch(e){return fresh();}}
    let state=load();
    let active=null;
    let pending=null;
    let particles=[];
    let journal=null;
    let toast=null;
    let savedSpeeds=null;

    function save(){try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){}}
    function add(type,x,y,o={}){particles.push({type,x,y,vx:o.vx??R(-1,1),vy:o.vy??R(-1,1),life:o.life||260,max:o.life||260,size:o.size||R(5,14),color:o.color||'#fff',icon:o.icon||'',phase:R(0,100)});}
    function burst(type,n,o={}){for(let i=0;i<n;i++)add(type,o.x??R(0,canvas.width),o.y??R(0,canvas.height),{vx:o.vx===undefined?R(-2,2):o.vx+R(-.5,.5),vy:o.vy===undefined?R(-2,2):o.vy+R(-.5,.5),life:o.life||R(180,380),size:o.size||R(6,16),color:o.colors?P(o.colors):(o.color||'#fff'),icon:o.icons?P(o.icons):''});}
    function baseProgress(){try{return window.WishSecrets?window.WishSecrets.progress:{found:0,total:15};}catch(e){return{found:0,total:15};}}
    function combinedProgress(){const b=baseProgress();const personalFound=state.seen.filter(id=>id!=='forever_finale').length;return{found:b.found+personalFound+(state.finaleSeen?1:0),total:b.total+PERSONAL.length+1,baseFound:b.found,baseTotal:b.total,personalFound,personalTotal:PERSONAL.length,finaleSeen:state.finaleSeen};}
    function busy(){return !!((window.WishCinemaFx&&window.WishCinemaFx.active)||(window.WishPhase2&&window.WishPhase2.active)||(window.DragonBoss&&window.DragonBoss.active)||(window.WishSecrets&&window.WishSecrets.active)||active);}
    function queue(def,forced=false,delay=180){pending={def,forced,delay,wait:0};}

    function mark(def,forced){
      if(forced)return;
      state.last=def.id;
      state.counts[def.id]=(state.counts[def.id]||0)+1;
      if(!state.seen.includes(def.id)){
        state.seen.push(def.id);
        if(def.id==='forever_finale')state.finaleSeen=true;else state.totalPersonal++;
      }
      save();
      checkMilestones();
    }

    function begin(def,forced=false){
      end(false);
      active={def,t:0,d:def.duration,forced,flash:0,shake:0};
      particles=[];
      mark(def,forced);
      if(['everything_ok','anniversary_clock','forever_finale'].includes(def.id)){
        savedSpeeds={her:players.her.speed,him:players.him.speed};players.her.speed=0;players.him.speed=0;
      }
      seed(def.id);
      window.dispatchEvent(new CustomEvent('wish-phase4-personal-start',{detail:{id:def.id,name:def.name,rarity:def.rarity,forced}}));
    }

    function end(dispatch=true){
      if(savedSpeeds){players.her.speed=savedSpeeds.her;players.him.speed=savedSpeeds.him;savedSpeeds=null;}
      if(active&&dispatch)window.dispatchEvent(new CustomEvent('wish-phase4-personal-end',{detail:{id:active.def.id}}));
      active=null;particles=[];
    }

    function seed(id){
      if(id==='bright_star')burst('star',110,{colors:COLORS.sky,life:620});
      else if(id==='everything_ok'){burst('lantern',42,{y:canvas.height+30,vy:-1.1,colors:COLORS.gold,life:560});burst('firefly',55,{colors:COLORS.gold,life:600});}
      else if(id==='bhalobasha_forever'){burst('heart',95,{colors:COLORS.pink,life:620});burst('petal',70,{y:-25,vy:1.2,colors:COLORS.pink,life:600});}
      else if(id==='holi_dance')burst('powder',190,{colors:COLORS.holi,life:620});
      else if(id==='money_moon'){burst('coin',135,{y:-30,vy:2,colors:COLORS.gold,life:620});burst('star',65,{colors:COLORS.sky,life:620});}
      else if(id==='bengali_home'){burst('lantern',50,{y:canvas.height+30,vy:-1.2,colors:COLORS.green,life:620});burst('petal',65,{y:-20,vy:1.1,colors:COLORS.green,life:600});}
      else if(id==='five_companions'){burst('paw',80,{colors:COLORS.sky,life:620});burst('star',60,{colors:COLORS.sky,life:640});}
      else if(id==='dragon_bow'){burst('ember',100,{colors:['#ff6a2a','#ffe05a'],life:680});burst('star',55,{colors:COLORS.sky,life:650});}
      else if(id==='million_kisses')burst('kiss',180,{colors:COLORS.pink,life:620});
      else if(id==='queen_of_valley'){burst('coin',150,{y:-25,vy:2.1,colors:COLORS.gold,life:660});burst('spark',80,{colors:COLORS.gold,life:620});}
      else if(id==='anniversary_clock'){burst('star',90,{colors:COLORS.sky,life:700});burst('heart',55,{colors:COLORS.pink,life:680});}
      else if(id==='forever_finale'){burst('star',170,{colors:COLORS.sky,life:1000});burst('heart',90,{colors:COLORS.pink,life:900});}
    }

    function checkMilestones(){
      const p=combinedProgress();
      const marks=[1,5,10,15,20,25];
      for(const m of marks){if(p.found>=m&&!state.milestones.includes(m)){state.milestones.push(m);save();toast={title:`Secret milestone: ${m}`,text:`${p.found} of ${p.total} Wish Pool secrets discovered.`,timer:300};break;}}
      const finaleReady=(p.baseFound>=p.baseTotal&&p.personalFound>=5)||p.found>=20;
      if(finaleReady&&!state.finaleUnlocked){state.finaleUnlocked=true;save();toast={title:'A final secret has awakened',text:'The Wish Pool is ready to reveal its greatest memory.',timer:360};queue(FINALE,false,300);}
    }

    function matchPersonal(wish){
      const t=N(wish);
      if(/one year forever|our forever wish|show me our forever/.test(t))return FINALE;
      const matches=PERSONAL.filter(def=>def.match(t));
      if(!matches.length)return null;
      return matches.find(def=>!state.seen.includes(def.id))||matches[0];
    }

    function eventById(value){const q=N(value).replace(/[^a-z0-9 ]/g,' ');return ALL.find(e=>e.id===q.replace(/\s+/g,'_')||N(e.name).includes(q)||q.includes(e.id.replace(/_/g,' ')))||null;}
    function showJournal(mode='all'){
      const base=window.WishSecrets?window.WishSecrets.events:[];
      const baseSeen=new Set(window.WishSecrets?window.WishSecrets.discoveries:[]);
      const rows=[...base.map(e=>({id:e.id,name:e.name,rarity:e.rarity,seen:baseSeen.has(e.id)})),...ALL.map(e=>({id:e.id,name:e.name,rarity:e.rarity,seen:e.id==='forever_finale'?state.finaleSeen:state.seen.includes(e.id)}))];
      journal={mode,rows:mode==='found'?rows.filter(r=>r.seen):mode==='locked'?rows.filter(r=>!r.seen):rows,timer:900,page:0};
    }

    function command(raw){
      const t=N(raw);
      if(/^(show|open|view) (my )?(secret journal|secrets|secret progress|discoveries)$/.test(t)){showJournal('all');return true;}
      if(/^(show|view) (my )?(found secrets|discovered secrets)$/.test(t)){showJournal('found');return true;}
      if(/^(show|view) (my )?(locked secrets|undiscovered secrets|missing secrets)$/.test(t)){showJournal('locked');return true;}
      if(/^(close|hide) (the )?(secret journal|secrets)$/.test(t)){journal=null;return true;}
      if(/^(reset phase 4 secrets|reset secret journal)$/.test(t)){state=fresh();save();journal=null;toast={title:'Phase 4 reset',text:'Personal discoveries and milestones were cleared.',timer:300};return true;}
      return false;
    }

    function updateParticles(){
      particles.forEach(p=>{p.life--;p.phase++;p.x+=p.vx;p.y+=p.vy;if(['powder','petal','lantern','paw','heart','kiss'].includes(p.type))p.x+=Math.sin(p.phase/13)*.5;if(p.type==='firefly'){p.x+=Math.sin(p.phase/9)*.8;p.y+=Math.cos(p.phase/12)*.45;}});
      particles=particles.filter(p=>p.life>0&&p.x>-180&&p.x<canvas.width+180&&p.y>-180&&p.y<canvas.height+180);
    }

    function updateActive(){
      if(pending){pending.wait++;if(pending.delay>0)pending.delay--;else if(!busy()||pending.wait>1500){const q=pending;pending=null;begin(q.def,q.forced);}}
      if(journal){journal.timer--;if(journal.timer<=0)journal=null;}
      if(toast){toast.timer--;if(toast.timer<=0)toast=null;}
      if(!active)return;
      active.t++;
      const id=active.def.id,t=active.t;
      if(id==='holi_dance'&&t%95===0){burst('powder',70,{colors:COLORS.holi,life:360});active.flash=8;players.her.dir=players.him.dir=P(['left','right','up','down']);}
      if(id==='money_moon'&&t%90===0)burst('coin',35,{y:-20,vy:2.2,colors:COLORS.gold,life:380});
      if(id==='million_kisses'&&t%75===0)burst('kiss',45,{colors:COLORS.pink,life:360});
      if(id==='queen_of_valley'&&t%85===0)burst('coin',35,{y:-20,vy:2.2,colors:COLORS.gold,life:380});
      if(id==='dragon_bow'&&t===240){active.shake=5;active.flash=10;}
      if(id==='forever_finale'){
        if(t===190)burst('powder',180,{colors:COLORS.holi,life:580});
        if(t===390){burst('coin',100,{y:-20,vy:2,colors:COLORS.gold,life:520});burst('icon',55,{icons:['🍛','🥟','🫖','🐈‍⬛','🐈','🐕'],colors:COLORS.gold,life:520});}
        if(t===610){active.shake=4;burst('ember',90,{colors:['#ff6a2a','#ffe05a'],life:520});}
        if(t===820){burst('star',160,{colors:COLORS.sky,life:600});active.flash=16;}
      }
      updateParticles();
      if(active.flash>0)active.flash--;
      if(active.shake>0)active.shake=Math.max(0,active.shake-.08);
      if(t>active.d)end();
    }

    function drawParticle(p){
      const a=C(p.life/Math.min(70,p.max),0,1);ctx.save();ctx.globalAlpha=a;ctx.shadowColor=p.color;ctx.shadowBlur=10;
      if(['star','spark'].includes(p.type)){ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size*2,p.size,p.size*4);ctx.fillRect(p.x-p.size*2,p.y-p.size/2,p.size*4,p.size);}
      else if(p.type==='powder'){ctx.globalAlpha*=.78;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
      else if(p.type==='ember'){ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}
      else if(p.type==='firefly'){ctx.fillStyle='#fff8a6';ctx.shadowBlur=18;ctx.fillRect(p.x,p.y,4,4);}
      else{const icon=p.type==='heart'?'♥':p.type==='kiss'?'💋':p.type==='coin'?P(['💵','💸','🪙','💎']):p.type==='lantern'?'🏮':p.type==='petal'?'🌸':p.type==='paw'?'🐾':p.icon||'✨';ctx.font=`${Math.round(p.size*1.8)}px "Segoe UI Emoji",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=p.color;ctx.fillText(icon,p.x,p.y);}
      ctx.restore();
    }

    function drawShield(){
      [players.her,players.him].forEach(p=>{const x=p.x-camera.x,y=p.y-camera.y-26;ctx.save();ctx.strokeStyle='#ffe18b';ctx.shadowColor='#ffe18b';ctx.shadowBlur=24;ctx.lineWidth=5;for(let i=0;i<3;i++){ctx.globalAlpha=.8-i*.2;ctx.beginPath();ctx.arc(x,y,36+i*12+Math.sin(active.t/12)*4,0,Math.PI*2);ctx.stroke();}ctx.restore();});
    }

    function drawDragonBow(){
      const x=canvas.width*.5,y=canvas.height*.42,s=1.15,bow=Math.min(1,Math.max(0,(active.t-250)/120));
      ctx.save();ctx.translate(x,y+bow*65);ctx.rotate(bow*.22);ctx.globalAlpha=.68;ctx.fillStyle='#100617';ctx.shadowColor='#ff6a2a';ctx.shadowBlur=24;
      ctx.beginPath();ctx.ellipse(0,0,105*s,42*s,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.moveTo(-25,0);ctx.lineTo(-230,-105);ctx.lineTo(-135,30);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(25,0);ctx.lineTo(230,-105);ctx.lineTo(135,30);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ff5a1f';ctx.fillRect(-25,-12,8,5);ctx.fillRect(17,-12,8,5);ctx.restore();
    }

    function drawClock(){
      const x=canvas.width*.5,y=canvas.height*.42,r=Math.min(canvas.width,canvas.height)*.14;
      ctx.save();ctx.strokeStyle='#ffe18b';ctx.shadowColor='#d9a7ff';ctx.shadowBlur=25;ctx.lineWidth=6;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
      for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.fillStyle='#fff1c8';ctx.fillRect(x+Math.cos(a)*(r-12)-3,y+Math.sin(a)*(r-12)-3,6,6);}
      ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-r*.55);ctx.moveTo(x,y);ctx.lineTo(x+r*.42,y+r*.18);ctx.stroke();ctx.restore();
    }

    function drawSpecial(){
      const id=active.def.id,t=active.t;
      if(id==='bright_star'){
        const a=Math.min(1,t/120)*Math.min(1,(active.d-t)/110);ctx.save();ctx.globalAlpha=a;ctx.textAlign='center';ctx.fillStyle='#fff1a8';ctx.shadowColor='#d9a7ff';ctx.shadowBlur=30;ctx.font=`bold ${Math.max(36,Math.min(74,canvas.width/12))}px monospace`;ctx.fillText('MY BRIGHT STAR',canvas.width/2,canvas.height*.4);ctx.font='20px monospace';ctx.fillStyle='#ffd1e8';ctx.fillText('Tanima',canvas.width/2,canvas.height*.48);ctx.restore();
      }else if(id==='everything_ok'){drawShield();ctx.save();ctx.textAlign='center';ctx.fillStyle='#fff1c8';ctx.font='bold 30px monospace';ctx.fillText('Everything will be okay.',canvas.width/2,canvas.height*.28);ctx.restore();}
      else if(id==='bhalobasha_forever'){ctx.save();ctx.textAlign='center';ctx.fillStyle='#ffd1e8';ctx.shadowColor='#ff6bb5';ctx.shadowBlur=24;ctx.font='bold 44px monospace';ctx.fillText('BHALOBASHA',canvas.width/2,canvas.height*.36);ctx.font='22px monospace';ctx.fillText('FOREVER',canvas.width/2,canvas.height*.43);ctx.restore();}
      else if(id==='money_moon'){ctx.save();ctx.fillStyle='#f7f1c9';ctx.shadowColor='#ffe18b';ctx.shadowBlur=25;ctx.beginPath();ctx.arc(canvas.width*.78,canvas.height*.2,62,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(15,10,30,.75)';ctx.beginPath();ctx.arc(canvas.width*.8,canvas.height*.18,58,0,Math.PI*2);ctx.fill();ctx.restore();}
      else if(id==='bengali_home'){ctx.save();ctx.globalAlpha=.18;ctx.fillStyle='#0f8a4b';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=.75;ctx.fillStyle='#f05a67';ctx.beginPath();ctx.arc(canvas.width*.5,canvas.height*.38,58,0,Math.PI*2);ctx.fill();ctx.textAlign='center';ctx.fillStyle='#fff1c8';ctx.font='bold 28px monospace';ctx.fillText('A little piece of home finds you.',canvas.width/2,canvas.height*.56);ctx.restore();}
      else if(id==='five_companions'){const pets=[['BINX','🐈‍⬛'],['LOKI','🐈‍⬛'],['CASPER','🐈'],['MOJO','🐕'],['DALLAS','🐕']];ctx.save();ctx.textAlign='center';pets.forEach((p,i)=>{const x=canvas.width*(.18+i*.16),y=canvas.height*(.28+(i%2)*.12);ctx.font='22px monospace';ctx.fillStyle='#fff1a8';ctx.fillText('✦',x,y);ctx.font='15px monospace';ctx.fillText(p[0],x,y+28);ctx.font='26px sans-serif';ctx.fillText(p[1],x,y+58);if(i<pets.length-1){ctx.strokeStyle='rgba(217,167,255,.7)';ctx.beginPath();ctx.moveTo(x+16,y);ctx.lineTo(canvas.width*(.18+(i+1)*.16)-16,canvas.height*(.28+((i+1)%2)*.12));ctx.stroke();}});ctx.restore();}
      else if(id==='dragon_bow')drawDragonBow();
      else if(id==='queen_of_valley'){const p=players.her;ctx.save();ctx.textAlign='center';ctx.font='62px sans-serif';ctx.fillText('👑',p.x-camera.x,p.y-camera.y-92);ctx.font='bold 28px monospace';ctx.fillStyle='#ffe18b';ctx.fillText('QUEEN OF THE VALLEY',canvas.width/2,canvas.height*.28);ctx.restore();}
      else if(id==='anniversary_clock')drawClock();
      else if(id==='forever_finale'){
        if(t>620)drawDragonBow();
        if(t>790){const a=Math.min(1,(t-790)/90)*Math.min(1,(active.d-t)/90);ctx.save();ctx.globalAlpha=a;ctx.textAlign='center';ctx.shadowColor='#d9a7ff';ctx.shadowBlur=32;ctx.fillStyle='#fff1a8';ctx.font=`bold ${Math.max(40,Math.min(82,canvas.width/10))}px monospace`;ctx.fillText('FOREVER',canvas.width/2,canvas.height*.37);ctx.font='24px monospace';ctx.fillStyle='#ffd1e8';ctx.fillText('ASHTON + TANIMA',canvas.width/2,canvas.height*.46);ctx.font='17px monospace';ctx.fillStyle='#fff';ctx.fillText('Every wish led back to you.',canvas.width/2,canvas.height*.53);ctx.restore();}
      }
    }

    function drawActive(){
      if(!active)return;const f=Math.min(1,active.t/60)*Math.min(1,(active.d-active.t)/100);ctx.save();ctx.globalAlpha=.15*f;ctx.fillStyle=active.def.id==='holi_dance'?'#ff6bb5':active.def.rarity==='legendary'||active.def.rarity==='mythic'?'#160a25':'#20344f';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();particles.forEach(drawParticle);drawSpecial();
      if(active.flash>0){ctx.save();ctx.globalAlpha=active.flash/28;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();}
      const w=Math.min(720,canvas.width-40),x=(canvas.width-w)/2,y=26;ctx.save();ctx.globalAlpha=.94*f;ctx.fillStyle='rgba(9,5,18,.92)';ctx.strokeStyle=active.def.rarity==='mythic'?'#fff1a8':active.def.rarity==='legendary'?'#ffe18b':'#d9a7ff';ctx.lineWidth=3;if(typeof roundRect==='function')roundRect(x,y,w,72,12,true,true);else{ctx.fillRect(x,y,w,72);ctx.strokeRect(x,y,w,72);}ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 16px monospace';ctx.fillText(active.def.name,x+18,y+27);ctx.fillStyle='#fff';ctx.font='13px monospace';ctx.fillText(active.def.id==='forever_finale'?'The Wish Pool remembers every color, laugh, meal, pet, dream, and promise.':'A personal secret hidden inside your world has awakened.',x+18,y+53);ctx.restore();
    }

    function drawJournal(){
      if(!journal)return;const p=combinedProgress(),rows=journal.rows,pageSize=8,pages=Math.max(1,Math.ceil(rows.length/pageSize));journal.page=Math.floor((900-journal.timer)/180)%pages;const list=rows.slice(journal.page*pageSize,(journal.page+1)*pageSize);const w=Math.min(680,canvas.width-50),h=390,x=(canvas.width-w)/2,y=(canvas.height-h)/2;ctx.save();ctx.globalAlpha=.97;ctx.fillStyle='rgba(8,4,16,.96)';ctx.strokeStyle='#d9a7ff';ctx.lineWidth=4;if(typeof roundRect==='function')roundRect(x,y,w,h,14,true,true);else{ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);}ctx.fillStyle='#fff1c8';ctx.font='bold 22px monospace';ctx.fillText('WISH POOL SECRET JOURNAL',x+24,y+38);ctx.fillStyle='#d9a7ff';ctx.font='14px monospace';ctx.fillText(`${p.found} / ${p.total} discovered`,x+24,y+64);list.forEach((r,i)=>{const yy=y+104+i*32;ctx.fillStyle=r.seen?'#ffe18b':'#6f6878';ctx.font='16px monospace';ctx.fillText(r.seen?'✦':'?',x+28,yy);ctx.fillStyle=r.seen?'#fff':'#716b7b';ctx.fillText(r.seen?r.name:'????????????????',x+58,yy);ctx.fillStyle=r.seen?'#d9a7ff':'#514b59';ctx.font='12px monospace';ctx.fillText(r.rarity.toUpperCase(),x+w-120,yy);});ctx.fillStyle='#8f8798';ctx.font='12px monospace';ctx.fillText(`Page ${journal.page+1} of ${pages}  •  The journal closes automatically`,x+24,y+h-24);ctx.restore();
    }

    function drawToast(){if(!toast)return;const a=Math.min(1,toast.timer/35),w=Math.min(560,canvas.width-40),x=(canvas.width-w)/2,y=112;ctx.save();ctx.globalAlpha=.94*a;ctx.fillStyle='rgba(10,6,18,.94)';ctx.strokeStyle='#ffe18b';ctx.lineWidth=3;if(typeof roundRect==='function')roundRect(x,y,w,72,12,true,true);else{ctx.fillRect(x,y,w,72);ctx.strokeRect(x,y,w,72);}ctx.fillStyle='#ffe18b';ctx.font='bold 16px monospace';ctx.fillText(toast.title,x+18,y+27);ctx.fillStyle='#fff';ctx.font='13px monospace';ctx.fillText(toast.text.slice(0,82),x+18,y+53);ctx.restore();}

    window.addEventListener('wish-secret-start',e=>{if(!e.detail||e.detail.forced)return;setTimeout(checkMilestones,0);});

    const previousFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){
      let next=init;
      try{
        const url=typeof input==='string'?input:(input&&input.url)||'';
        if(url.includes(ENDPOINT)&&init&&init.body){
          const body=JSON.parse(init.body),original=String(body.originalWish||body.wish||'');
          const test=N(original).match(/^ashton test final secret\s+(.+)$/);
          if(test){const def=eventById(test[1]);if(def)queue(def,true,45);next={...init,body:JSON.stringify({...body,wish:'soft peaceful sparkles',originalWish:'soft peaceful sparkles'})};}
          else if(command(original)){next={...init,body:JSON.stringify({...body,wish:'soft peaceful sparkles',originalWish:'soft peaceful sparkles'})};}
          else{const def=matchPersonal(original);if(def&&!pending&&!active)queue(def,false,210);}
        }
      }catch(e){}
      const response=await previousFetch(input,next);
      setTimeout(checkMilestones,0);
      return response;
    };

    const oldUpdate=update;update=function(){oldUpdate();updateActive();};
    const oldDraw=draw;draw=function(){if(active&&active.shake>0){ctx.save();ctx.translate(R(-active.shake,active.shake),R(-active.shake,active.shake));oldDraw();ctx.restore();}else oldDraw();drawActive();drawJournal();drawToast();};

    window.WishPhase4={
      test(id){const def=eventById(id);if(!def)return false;queue(def,true,1);return true;},
      journal(mode='all'){showJournal(mode);},
      stop(){pending=null;end();journal=null;},
      reset(){state=fresh();save();},
      get progress(){return combinedProgress();},
      get discoveries(){return state.seen.slice();},
      get active(){return active?active.def.id:'';},
      events:ALL.map(e=>({id:e.id,name:e.name,rarity:e.rarity}))
    };
  }catch(e){console.warn('wish phase4 completion failed',e);}
})();
