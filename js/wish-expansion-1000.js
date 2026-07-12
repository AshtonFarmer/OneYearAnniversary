// 600-effect Wish Pool expansion runtime. Every entry has a unique id, title, trigger phrase,
// seed, particle recipe, motion profile, timing profile, and visual signature.
(function(){
  'use strict';
  try{
    if(typeof update!=='function'||typeof draw!=='function')return;
    const ENDPOINT='damp-cherry-8310.ashton20-bama.workers.dev';
    const PACKS=[...(window.WISH_EXPANSION_PACKS_A||[]),...(window.WISH_EXPANSION_PACKS_B||[])];
    const MOTIONS=['fall','rise','orbit','spiral','wave','burst','drift','bounce','cross','fountain','swarm','pulse'];
    const SPAWNS=['top','bottom','left','right','center','players','pool','ring','edges','random'];
    const FORMS=['icon','star','orb','diamond','ribbon','square','ring','spark'];
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const norm=s=>String(s||'').toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9\u00C0-\u024f\u0980-\u09ff]+/g,' ').replace(/\s+/g,' ').trim();
    const slug=s=>norm(s).replace(/\s+/g,'_');
    const title=s=>String(s).replace(/\b\w/g,c=>c.toUpperCase());
    const rand=(a,b)=>a+Math.random()*(b-a);
    const pick=a=>a[Math.floor(Math.random()*a.length)];
    const EFFECTS=[];
    PACKS.forEach((pack,pi)=>{
      (pack.items||[]).forEach((name,ii)=>{
        const seed=pi*20+ii;
        EFFECTS.push({
          id:`x${String(seed+1).padStart(3,'0')}_${pack.id}_${slug(name)}`,
          number:seed+1,pack:pack.id,packLabel:pack.label,name,title:title(name),
          trigger:norm(name),icon:(pack.icons||['✨'])[ii%(pack.icons||['✨']).length],
          palette:pack.palette||['#d9a7ff','#8ee8ff','#fff1a8'],
          motion:MOTIONS[seed%MOTIONS.length],
          spawn:SPAWNS[(seed*7+pi)%SPAWNS.length],
          form:FORMS[(seed*5+ii)%FORMS.length],
          amount:26+(seed%7)*6,
          duration:470+(seed%9)*44,
          speed:.45+(seed%11)*.11,
          size:7+(seed%8)*1.35,
          orbit:52+(seed%13)*9,
          wave:.25+(seed%10)*.08,
          pulse:8+(seed%12),
          twist:(seed%17+3)/100,
          phase:seed*1.731,
          signature:`${pi}-${ii}-${MOTIONS[seed%12]}-${SPAWNS[(seed*7+pi)%10]}-${FORMS[(seed*5+ii)%8]}`
        });
      });
    });

    const ids=new Set(EFFECTS.map(e=>e.id));
    const signatures=new Set(EFFECTS.map(e=>e.signature));
    let scene=null,particles=[],info=null,lastMatched=[];
    let paused=false;

    function screenPoint(kind){
      if(kind==='players'){
        const p=Math.random()<.5?players.her:players.him;
        return{x:p.x-camera.x,y:p.y-camera.y-25};
      }
      if(kind==='pool')return{x:1333-camera.x,y:816-camera.y};
      if(kind==='center')return{x:canvas.width/2,y:canvas.height/2};
      if(kind==='ring'){
        const a=rand(0,Math.PI*2),r=Math.min(canvas.width,canvas.height)*.34;
        return{x:canvas.width/2+Math.cos(a)*r,y:canvas.height/2+Math.sin(a)*r};
      }
      if(kind==='edges'){
        const side=Math.floor(rand(0,4));
        if(side===0)return{x:rand(0,canvas.width),y:-30};
        if(side===1)return{x:canvas.width+30,y:rand(0,canvas.height)};
        if(side===2)return{x:rand(0,canvas.width),y:canvas.height+30};
        return{x:-30,y:rand(0,canvas.height)};
      }
      if(kind==='top')return{x:rand(0,canvas.width),y:-30};
      if(kind==='bottom')return{x:rand(0,canvas.width),y:canvas.height+30};
      if(kind==='left')return{x:-30,y:rand(0,canvas.height)};
      if(kind==='right')return{x:canvas.width+30,y:rand(0,canvas.height)};
      return{x:rand(0,canvas.width),y:rand(0,canvas.height)};
    }

    function velocity(effect,p){
      const s=effect.speed;
      if(effect.motion==='fall')return{vx:rand(-.45,.45),vy:rand(.7,1.5)*s};
      if(effect.motion==='rise')return{vx:rand(-.45,.45),vy:-rand(.7,1.5)*s};
      if(effect.motion==='cross')return{vx:(p.x<canvas.width/2?1:-1)*rand(.8,1.8)*s,vy:rand(-.35,.35)};
      if(effect.motion==='fountain')return{vx:rand(-1.7,1.7)*s,vy:-rand(1.5,3)*s};
      if(effect.motion==='burst')return{vx:rand(-2.2,2.2)*s,vy:rand(-2.2,2.2)*s};
      if(effect.motion==='bounce')return{vx:rand(-1.2,1.2)*s,vy:rand(-1.5,-.4)*s};
      return{vx:rand(-1,1)*s,vy:rand(-1,1)*s};
    }

    function addParticle(effect,index,delay=0){
      const p=screenPoint(effect.spawn),v=velocity(effect,p);
      particles.push({
        effect,index,x:p.x,y:p.y,ox:p.x,oy:p.y,vx:v.vx,vy:v.vy,
        life:effect.duration+rand(-80,120),max:effect.duration+120,
        size:effect.size*rand(.72,1.35),phase:effect.phase+index*.73,
        color:effect.palette[index%effect.palette.length],delay,
        angle:rand(0,Math.PI*2),spin:rand(-.06,.06),trail:[],
        icon:effect.icon
      });
    }

    function begin(effects,forced=false){
      stop(false);
      lastMatched=effects.slice(0,3);
      scene={effects:lastMatched,t:0,d:Math.max(...lastMatched.map(e=>e.duration))+220,forced};
      particles=[];
      lastMatched.forEach((e,ei)=>{
        for(let i=0;i<e.amount;i++)addParticle(e,i,ei*55+(i%8)*3);
      });
      window.dispatchEvent(new CustomEvent('wish-expansion-start',{detail:{effects:lastMatched.map(e=>e.id),count:lastMatched.length}}));
      return true;
    }

    function stop(dispatch=true){
      if(scene&&dispatch)window.dispatchEvent(new CustomEvent('wish-expansion-end',{detail:{effects:scene.effects.map(e=>e.id)}}));
      scene=null;particles=[];paused=false;
    }

    function find(text,limit=3){
      const t=norm(text);
      if(!t)return[];
      const exact=EFFECTS.filter(e=>t.includes(e.trigger));
      if(exact.length)return exact.sort((a,b)=>b.trigger.length-a.trigger.length).slice(0,limit);
      const words=t.split(' ').filter(w=>w.length>3);
      return EFFECTS.map(e=>{
        const ew=e.trigger.split(' '),hits=ew.filter(w=>words.includes(w)).length;
        return{e,score:hits/Math.max(ew.length,1)};
      }).filter(x=>x.score>=.8&&x.e.trigger.split(' ').length>1)
        .sort((a,b)=>b.score-a.score||b.e.trigger.length-a.e.trigger.length)
        .slice(0,limit).map(x=>x.e);
    }

    function resolveByQuery(q){
      const n=norm(q);
      const num=n.match(/\b(\d{1,3})\b/);
      if(num){
        const index=Number(num[1])-1;
        if(EFFECTS[index])return EFFECTS[index];
      }
      return EFFECTS.find(e=>e.id===n||e.id.includes(n.replace(/\s+/g,'_'))||e.trigger===n||norm(e.title)===n)
        ||find(n,1)[0]||null;
    }

    function showInfo(mode){
      info={mode,t:0,d:720};
    }

    function command(raw){
      const t=norm(raw);
      if(/^(show|open|view) (the )?(expansion )?(effect count|wish count|registry count)$/.test(t)){showInfo('count');return true;}
      if(/^(show|open|view) (the )?(new )?(wish packs|expansion packs)$/.test(t)){showInfo('packs');return true;}
      if(/^(pause|pause expansion)$/.test(t)&&scene){paused=true;return true;}
      if(/^(resume|continue expansion)$/.test(t)&&scene){paused=false;return true;}
      if(/^(stop expansion|stop new effects)$/.test(t)){stop();return true;}
      if(/^(random new effect|random expansion wish|surprise expansion)$/.test(t)){begin([pick(EFFECTS)],true);return true;}
      const m=t.match(/^(?:ashton test expansion|test expansion effect|test new effect)\s+(.+)$/);
      if(m){const e=resolveByQuery(m[1]);if(e)begin([e],true);return true;}
      return false;
    }

    function interceptWish(raw){
      if(command(raw))return true;
      const found=find(raw,3);
      if(found.length){begin(found,false);return true;}
      return false;
    }

    const previousFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){
      try{
        const url=typeof input==='string'?input:(input&&input.url)||'';
        if(url.includes(ENDPOINT)&&init&&init.body){
          const body=JSON.parse(init.body),raw=String(body.originalWish||body.wish||'');
          interceptWish(raw);
        }
      }catch(e){}
      return previousFetch(input,init);
    };

    function updateParticle(p){
      if(p.delay>0){p.delay--;return;}
      const e=p.effect;
      p.life--;p.phase+=.08+e.twist;p.angle+=p.spin;
      if(e.motion==='orbit'){
        const c=screenPoint(e.spawn==='players'?'players':e.spawn==='pool'?'pool':'center');
        const r=e.orbit+(p.index%7)*5;
        p.x=c.x+Math.cos(p.phase+p.index)*r;
        p.y=c.y+Math.sin(p.phase+p.index)*r*.58;
      }else if(e.motion==='spiral'){
        const c=screenPoint(e.spawn==='pool'?'pool':'center'),r=18+(p.max-p.life)*.16+(p.index%8)*4;
        p.x=c.x+Math.cos(p.phase*1.7+p.index)*r;
        p.y=c.y+Math.sin(p.phase*1.7+p.index)*r*.65;
      }else if(e.motion==='wave'){
        p.x+=p.vx;p.y+=p.vy+Math.sin(p.phase+p.index)*e.wave;
      }else if(e.motion==='swarm'){
        const c=screenPoint(e.spawn==='players'?'players':'center');
        p.vx+=(c.x-p.x)*.0005+Math.sin(p.phase)*.018;
        p.vy+=(c.y-p.y)*.0005+Math.cos(p.phase*.8)*.018;
        p.x+=p.vx;p.y+=p.vy;
      }else if(e.motion==='pulse'){
        const c=screenPoint(e.spawn==='pool'?'pool':'center'),r=e.orbit+Math.sin(p.phase*2)*e.pulse+(p.index%9)*6;
        p.x=c.x+Math.cos(p.angle+p.index)*r;
        p.y=c.y+Math.sin(p.angle+p.index)*r*.62;
      }else{
        p.x+=p.vx;p.y+=p.vy;
        if(e.motion==='bounce'){
          p.vy+=.025;
          if(p.y>canvas.height-22){p.y=canvas.height-22;p.vy=-Math.abs(p.vy)*.82;}
          if(p.x<10||p.x>canvas.width-10)p.vx*=-1;
        }
        if(e.motion==='drift')p.x+=Math.sin(p.phase)*e.wave;
        if(e.motion==='fountain')p.vy+=.018;
      }
      if(p.index%4===0){
        p.trail.push([p.x,p.y]);
        if(p.trail.length>5)p.trail.shift();
      }
    }

    function updateExpansion(){
      if(info){info.t++;if(info.t>info.d)info=null;}
      if(!scene||paused)return;
      scene.t++;
      particles.forEach(updateParticle);
      particles=particles.filter(p=>p.life>0&&p.x>-220&&p.x<canvas.width+220&&p.y>-220&&p.y<canvas.height+220);
      scene.effects.forEach((e,ei)=>{
        if(scene.t%Math.max(22,78-(e.number%36))===0&&particles.length<260){
          for(let i=0;i<Math.max(2,Math.floor(e.amount/8));i++)addParticle(e,i+scene.t,ei*12);
        }
      });
      if(scene.t>scene.d||!particles.length)stop();
    }

    function drawForm(p){
      if(p.delay>0)return;
      const a=clamp(p.life/70,0,1),e=p.effect,s=p.size;
      ctx.save();ctx.globalAlpha=a;ctx.shadowColor=p.color;ctx.shadowBlur=8+(e.number%13);
      p.trail.forEach((q,i)=>{ctx.globalAlpha=a*(i+1)/(p.trail.length+1)*.22;ctx.fillStyle=p.color;ctx.fillRect(q[0]-2,q[1]-2,4,4);});
      ctx.globalAlpha=a;
      if(e.form==='icon'){
        ctx.font=`${Math.round(s*2)}px "Segoe UI Emoji",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.icon,p.x,p.y);
      }else if(e.form==='star'||e.form==='spark'){
        ctx.fillStyle=p.color;ctx.fillRect(p.x-s/2,p.y-s*2,s,s*4);ctx.fillRect(p.x-s*2,p.y-s/2,s*4,s);
      }else if(e.form==='orb'){
        ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,s,0,Math.PI*2);ctx.fill();
      }else if(e.form==='diamond'){
        ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4+p.angle);ctx.fillStyle=p.color;ctx.fillRect(-s,-s,s*2,s*2);
      }else if(e.form==='ribbon'){
        ctx.strokeStyle=p.color;ctx.lineWidth=Math.max(2,s/3);ctx.beginPath();ctx.moveTo(p.x-s*2,p.y);ctx.quadraticCurveTo(p.x,p.y-s,p.x+s*2,p.y);ctx.stroke();
      }else if(e.form==='ring'){
        ctx.strokeStyle=p.color;ctx.lineWidth=Math.max(2,s/4);ctx.beginPath();ctx.arc(p.x,p.y,s*1.5,0,Math.PI*2);ctx.stroke();
      }else{
        ctx.fillStyle=p.color;ctx.fillRect(p.x-s,p.y-s,s*2,s*2);
      }
      ctx.restore();
    }

    function drawExpansion(){
      if(!scene)return;
      const fade=Math.min(1,scene.t/45)*Math.min(1,(scene.d-scene.t)/70);
      const primary=scene.effects[0];
      ctx.save();ctx.globalAlpha=.09*fade;ctx.fillStyle=primary.palette[0];ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();
      particles.forEach(drawForm);
      const label=scene.effects.map(e=>e.title).join(' + ');
      const packs=[...new Set(scene.effects.map(e=>e.packLabel))].join(' • ');
      const w=Math.min(760,canvas.width-40),x=(canvas.width-w)/2,y=canvas.height-96;
      ctx.save();ctx.globalAlpha=.93*fade;ctx.fillStyle='rgba(9,5,18,.91)';ctx.strokeStyle=primary.palette[1]||'#d9a7ff';ctx.lineWidth=3;
      if(typeof roundRect==='function')roundRect(x,y,w,70,12,true,true);else{ctx.fillRect(x,y,w,70);ctx.strokeRect(x,y,w,70);}
      ctx.fillStyle='#fff1c8';ctx.font='bold 15px monospace';ctx.fillText(label.slice(0,88),x+18,y+26);
      ctx.fillStyle='#d9a7ff';ctx.font='12px monospace';ctx.fillText(`${packs}  •  Registry ${scene.effects.map(e=>e.number).join(', ')}`,x+18,y+51);ctx.restore();
    }

    function drawInfo(){
      if(!info)return;
      const fade=Math.min(1,info.t/30)*Math.min(1,(info.d-info.t)/45);
      const w=Math.min(760,canvas.width-50),h=info.mode==='packs'?430:210,x=(canvas.width-w)/2,y=(canvas.height-h)/2;
      ctx.save();ctx.globalAlpha=.96*fade;ctx.fillStyle='rgba(8,4,16,.96)';ctx.strokeStyle='#ffe18b';ctx.lineWidth=4;
      if(typeof roundRect==='function')roundRect(x,y,w,h,14,true,true);else{ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);}
      ctx.fillStyle='#fff1c8';ctx.font='bold 22px monospace';ctx.fillText('WISH EFFECT REGISTRY',x+24,y+38);
      if(info.mode==='count'){
        ctx.fillStyle='#ffe18b';ctx.font='bold 42px monospace';ctx.fillText(`${EFFECTS.length} NEW INDIVIDUAL EFFECTS`,x+24,y+96);
        ctx.fillStyle='#fff';ctx.font='15px monospace';ctx.fillText(`${PACKS.length} new packs • ${ids.size} unique IDs • ${signatures.size} visual signatures`,x+24,y+133);
        ctx.fillStyle='#d9a7ff';ctx.fillText('These are registry entries, not alternate phrasings.',x+24,y+164);
      }else{
        ctx.fillStyle='#d9a7ff';ctx.font='14px monospace';ctx.fillText(`${PACKS.length} packs • 20 effects in every pack`,x+24,y+66);
        PACKS.forEach((p,i)=>{
          const col=i<15?0:1,row=i%15,xx=x+28+col*(w/2),yy=y+98+row*20;
          ctx.fillStyle=i%2?'#fff':'#ffe18b';ctx.font='12px monospace';ctx.fillText(`${String(i+1).padStart(2,'0')}. ${p.label}`,xx,yy);
        });
      }
      ctx.restore();
    }

    const oldUpdate=update;update=function(){oldUpdate();updateExpansion();};
    const oldDraw=draw;draw=function(){oldDraw();drawExpansion();drawInfo();};

    window.WishExpansion={
      start(value){const e=typeof value==='number'?EFFECTS[value-1]:resolveByQuery(value);return e?begin([e],true):false;},
      startMany(values){const list=(values||[]).map(resolveByQuery).filter(Boolean).slice(0,3);return list.length?begin(list,true):false;},
      find,stop,pause(){paused=true;},resume(){paused=false;},
      get count(){return EFFECTS.length;},
      get packCount(){return PACKS.length;},
      get active(){return !!scene;},
      get effects(){return EFFECTS.map(e=>({id:e.id,number:e.number,title:e.title,pack:e.packLabel,trigger:e.trigger,signature:e.signature}));},
      get packs(){return PACKS.map(p=>({id:p.id,label:p.label,count:p.items.length}));},
      audit(){return{count:EFFECTS.length,uniqueIds:ids.size,uniqueTitles:new Set(EFFECTS.map(e=>e.title)).size,uniqueTriggers:new Set(EFFECTS.map(e=>e.trigger)).size,uniqueSignatures:signatures.size,packCount:PACKS.length,valid:EFFECTS.length===600&&ids.size===600&&new Set(EFFECTS.map(e=>e.trigger)).size===600};}
    };
  }catch(e){console.warn('wish expansion 1000 failed',e);}
})();