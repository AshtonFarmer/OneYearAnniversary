// Phase 3 completion: live scene edits, historical references, and conversational controls.
(function(){
  try{
    const ENDPOINT='damp-cherry-8310.ashton20-bama.workers.dev';
    const STORAGE_KEY='wishPoolPhase3Session';
    const MAX_HISTORY=24;
    const normalize=value=>String(value||'').toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ').trim();
    const unique=list=>[...new Set((list||[]).filter(Boolean))];

    const LOCATIONS=[
      {keys:['shopping center','shopping centre','shopping'],id:'shopping_center',label:'the Shopping Center',coords:[1116,534]},
      {keys:['cherry blossom lake','lake'],id:'lake',label:'Cherry Blossom Lake',coords:[743,898]},
      {keys:['hot springs','hot spring'],id:'hot_springs',label:'the Hot Springs',coords:[1158,766]},
      {keys:['wish pool','wishing pool'],id:'wish_pool',label:'the Wish Pool',coords:[1333,816]},
      {keys:['future spot'],id:'future_spot',label:'the Future Spot',coords:[1179,248]},
      {keys:['apple orchard','orchard'],id:'orchard',label:'the Apple Orchard',coords:[330,755]},
      {keys:['windmill'],id:'windmill',label:'the Windmill',coords:[727,260]},
      {keys:['helipad','helicopter pad'],id:'helipad',label:'the Helipad',coords:[108,525]},
      {keys:['main cabin','cabin'],id:'cabin',label:'the Main Cabin',coords:[390,556]},
      {keys:['silo'],id:'silo',label:'the Silo',coords:[982,240]},
      {keys:['well of seasons','well'],id:'well',label:'the Well of Seasons',coords:[140,293]},
      {keys:['center','middle of the map','middle'],id:'center',label:'the center of the valley',coords:[768,512]}
    ];

    const SUBJECTS={
      dragon:['dragon','charizard'],money:['money','cash','dollars','coins','gold','diamonds','diamond','treasure','wealth'],
      holi:['holi','color powder','colour powder','rang','abir','colors','colours'],food:['food','feast','biryani','kacchi','fuchka','puchka','mishti','pizza','burger','fries','cake','cookies'],
      pets:['pets','animals','cats and dogs'],binx:['binx'],loki:['loki'],casper:['casper'],mojo:['mojo'],dallas:['dallas'],
      butterflies:['butterfly','butterflies'],flowers:['flower','flowers','petals','roses','blossoms'],hearts:['heart','hearts','love','kisses'],
      stars:['star','stars','galaxy'],comets:['comet','comets','meteor shower'],rain:['rain','monsoon'],snow:['snow','blizzard'],
      ghosts:['ghost','ghosts','spirits'],bats:['bat','bats'],ducks:['duck','ducks'],frogs:['frog','frogs'],fire:['fire','flames','burning'],
      music:['music','song','songs','notes'],lanterns:['lantern','lanterns','diyas'],fireworks:['firework','fireworks'],smoke:['smoke','fog']
    };

    const COLORS={
      red:'red',blue:'blue',green:'green',purple:'purple',pink:'romance',gold:'gold',golden:'gold',white:'white',
      rainbow:'holi',colorful:'holi',colourful:'holi',dark:'dark',darker:'dark',black:'dark',cozy:'cozy',warm:'cozy',romantic:'romance'
    };

    let notice=null;
    let noticeTimer=0;

    function loadMemory(){
      try{return JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'null')||{};}catch(e){return {};}
    }

    function saveMemory(state){
      try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){}
    }

    function showNotice(title,text){
      notice={title,text};noticeTimer=240;
    }

    function detectSubjects(text){
      const t=normalize(text),found=[];
      Object.entries(SUBJECTS).forEach(([name,words])=>{if(words.some(word=>t.includes(word)))found.push(name);});
      return unique(found);
    }

    function detectLocation(text){
      const t=normalize(text);
      return LOCATIONS.find(location=>location.keys.some(key=>t.includes(key)))||null;
    }

    function detectTarget(text){
      const t=` ${normalize(text)} `;
      if(/\bboth\b|both of us|both players|everyone/.test(t))return'both';
      if(/\btanima\b|\bher\b|\bshe\b|girlfriend/.test(t))return'tanima';
      if(/\bashton\b|\bhim\b|\bhe\b|boyfriend/.test(t))return'ashton';
      return'';
    }

    function displayTarget(target){
      return target==='tanima'?'Tanima':target==='ashton'?'Ashton':target==='both'?'both of you':'';
    }

    function directEligible(text){
      const t=normalize(text);
      if(!window.WishCinemaFx||!window.WishCinemaFx.active)return false;
      if(/^(more|more!|even more|again|do it again|less|smaller|bigger|stronger|calmer|faster|slower|pause|pause it|resume|continue|keep going|longer|shorter|undo change|undo that change)$/.test(t))return true;
      if(/^(now|then|also|and then|next|after that|same but|do the same but|again but)\b/.test(t))return true;
      if(/^(add|remove|take away|bring back|replace|swap|set them|set it|make them|make it|turn them|turn it|put them|put it|move them|move it|keep only|clear the effects|clear everything)\b/.test(t))return true;
      if(/^more\s+\w+|^less\s+\w+/.test(t))return true;
      if(/dragon.*eat (them|it)|bring (them|it) back|use (them|it) again/.test(t))return true;
      return false;
    }

    function findHistoryReference(text,state){
      const history=Array.isArray(state.history)?state.history:[];
      if(!history.length)return null;
      const t=normalize(text);
      if(/first wish/.test(t))return history[0];
      if(/second wish/.test(t))return history[1]||null;
      if(/third wish/.test(t))return history[2]||null;
      if(/wish before that|two wishes ago/.test(t))return history[Math.max(0,history.length-2)]||null;
      if(/previous wish|last wish/.test(t))return history[history.length-1]||null;
      return null;
    }

    function rewriteHistoricalRequest(raw,body,state){
      const t=normalize(raw);
      const reference=findHistoryReference(t,state);
      if(!reference)return null;
      if(/^(replay|repeat|bring back|show me|use)\b/.test(t)){
        return {...body,wish:reference.expanded||reference.original||raw,originalWish:raw};
      }
      if(/combine|mix/.test(t)){
        const current=state.lastExpanded||state.lastOriginal||'';
        return {...body,wish:`${current}. Combine it with this earlier wish: ${reference.expanded||reference.original}.`,originalWish:raw};
      }
      return null;
    }

    function colorChange(text){
      const t=normalize(text);
      for(const[word,name]of Object.entries(COLORS)){
        if(new RegExp(`\\b${word}\\b`).test(t))return{name};
      }
      if(/brighter|lighten|more cheerful/.test(t))return{name:'gold'};
      return null;
    }

    function resolvePreviousSubjects(state){
      const list=Array.isArray(state.lastSubjects)?state.lastSubjects:[];
      return list.length?list:['effects'];
    }

    function parseDirectChanges(raw,state){
      const t=normalize(raw).replace(/^(now|then|also|and then|next|after that|same but|do the same but|again but)\s*/,'');
      const changes=[];
      const previous=resolvePreviousSubjects(state);

      if(/undo (that )?change|take back that change/.test(t))return[{type:'undo'}];
      if(/^(pause|pause it|freeze the scene)$/.test(t))return[{type:'pause'}];
      if(/^(resume|continue|unpause|keep going)$/.test(t))return[{type:'resume'}];
      if(/clear (the )?(effects|particles)|clear everything/.test(t))changes.push({type:'clear'});

      if(/triple|way more|a lot more|even more/.test(t))changes.push({type:'intensity',delta:2});
      else if(/\bmore\b|stronger|intense|bigger/.test(t))changes.push({type:'intensity',delta:1});
      if(/\bless\b|calmer|tone it down|not so much/.test(t))changes.push({type:'intensity',delta:-1});

      if(/make (them|it|everything) (much )?bigger|enlarge|giant/.test(t))changes.push({type:'scaleParticles',factor:/much|giant/.test(t)?1.7:1.3});
      if(/make (them|it|everything) smaller|shrink the (effects|particles)|tiny/.test(t))changes.push({type:'scaleParticles',factor:.72});
      if(/faster|speed it up|move faster/.test(t))changes.push({type:'speed',factor:1.45});
      if(/slower|slow it down|move slower/.test(t))changes.push({type:'speed',factor:.68});
      if(/longer|keep it going|last longer|forever/.test(t))changes.push({type:'duration',delta:420});
      if(/shorter|end sooner/.test(t))changes.push({type:'duration',delta:-260});

      const location=detectLocation(t);
      if(location&&/(put|move|send|over|above|around|at|to|there)/.test(t))changes.push({type:'move',location});
      const target=detectTarget(t);
      if(target&&/(around|to|target|follow|give|on|attack|protect|surround)/.test(t))changes.push({type:'target',target});

      const color=colorChange(t);
      if(color&&/(make|turn|change|darker|brighter|rainbow|color|colour|pink|blue|red|green|purple|gold|golden|black|white|cozy|romantic)/.test(t))changes.push({type:'palette',name:color.name});

      if(/spin|spinning|orbit|circle/.test(t))changes.push({type:'motion',mode:'orbit'});
      if(/freeze (them|it|the effects)|stop moving/.test(t))changes.push({type:'motion',mode:'freeze'});
      if(/make (them|it) fall|fall from the sky/.test(t))changes.push({type:'motion',mode:'fall'});
      if(/make (them|it) float|float upward|rise/.test(t))changes.push({type:'motion',mode:'float'});
      if(/explode|burst outward/.test(t))changes.push({type:'motion',mode:'explode'});

      const subjects=detectSubjects(t);
      const removeMode=/remove|take away|get rid of|without|stop the/.test(t);
      const addMode=/add|bring back|include|give me|summon|more\s+|set (them|it) on fire|with\s+|and\s+/.test(t);
      const keepOnly=/keep only/.test(t);

      const replaceMatch=t.match(/(?:replace|swap|turn)\s+(?:the\s+)?([a-z ]+?)\s+(?:with|into)\s+([a-z ]+)$/);
      if(replaceMatch){
        const from=detectSubjects(replaceMatch[1])[0]||(previous.length===1?previous[0]:'');
        const to=detectSubjects(replaceMatch[2])[0];
        if(from&&to)changes.push({type:'replace',from,to});
      }else if(/turn (them|it) into/.test(t)){
        const to=subjects[subjects.length-1];
        if(to)previous.filter(x=>x!=='effects').forEach(from=>changes.push({type:'replace',from,to}));
      }else{
        if(keepOnly){changes.push({type:'clear'});subjects.forEach(subject=>changes.push({type:'add',subject}));}
        else if(removeMode){
          const list=subjects.length?subjects:previous;
          list.filter(x=>x!=='effects').forEach(subject=>changes.push({type:'remove',subject}));
        }else if(addMode||/dragon.*eat (them|it)/.test(t)){
          subjects.forEach(subject=>changes.push({type:'add',subject,amount:/more|many|lots/.test(t)?1.5:1}));
        }
      }

      if(/set (them|it) on fire|catch (them|it) on fire|burn (them|it)/.test(t)){
        changes.push({type:'add',subject:'fire',amount:1.4});
        changes.push({type:'palette',name:'red'});
      }
      if(/dragon.*eat (them|it)/.test(t)){
        changes.push({type:'add',subject:'dragon'});
        previous.filter(x=>x!=='effects'&&x!=='dragon').forEach(subject=>changes.push({type:'remove',subject}));
      }
      if(/bring (them|it) back|use (them|it) again/.test(t)&&!subjects.length){
        previous.filter(x=>x!=='effects').forEach(subject=>changes.push({type:'add',subject}));
      }

      const dedup=[];
      const seen=new Set();
      changes.forEach(change=>{const key=JSON.stringify(change);if(!seen.has(key)){seen.add(key);dedup.push(change);}});
      return dedup;
    }

    function describeChange(change){
      if(change.type==='intensity')return change.delta>0?'made the scene stronger':'calmed the scene down';
      if(change.type==='scaleParticles')return change.factor>1?'made the effects bigger':'made the effects smaller';
      if(change.type==='speed')return change.factor>1?'sped everything up':'slowed everything down';
      if(change.type==='duration')return change.delta>0?'made the scene last longer':'shortened the scene';
      if(change.type==='move')return`moved the scene to ${change.location.label}`;
      if(change.type==='target')return`retargeted the scene to ${displayTarget(change.target)}`;
      if(change.type==='palette')return`changed the scene to ${change.name}`;
      if(change.type==='motion')return`made the effects ${change.mode}`;
      if(change.type==='add')return`added ${change.subject}`;
      if(change.type==='remove')return`removed ${change.subject}`;
      if(change.type==='replace')return`changed ${change.from} into ${change.to}`;
      if(change.type==='clear')return'cleared the visible effects';
      if(change.type==='pause')return'paused the scene';
      if(change.type==='resume')return'resumed the scene';
      return'changed the scene';
    }

    function updateMemoryForDirect(raw,changes){
      const state=loadMemory();
      state.history=Array.isArray(state.history)?state.history:[];
      let subjects=Array.isArray(state.lastSubjects)?state.lastSubjects.slice():[];
      let target=state.lastTarget||'';
      let location=state.lastLocation||'';
      const descriptions=[];
      changes.forEach(change=>{
        descriptions.push(describeChange(change));
        if(change.type==='add')subjects.push(change.subject);
        if(change.type==='remove')subjects=subjects.filter(subject=>subject!==change.subject);
        if(change.type==='replace')subjects=subjects.filter(subject=>subject!==change.from).concat(change.to);
        if(change.type==='clear')subjects=[];
        if(change.type==='target')target=change.target;
        if(change.type==='move')location=change.location.id;
      });
      subjects=unique(subjects).slice(0,8);
      const snapshot=window.WishCinemaFx&&window.WishCinemaFx.snapshot?window.WishCinemaFx.snapshot():null;
      const expanded=`${state.lastExpanded||state.lastOriginal||'Continue the active wish scene'}. Live edit: ${descriptions.join(', ')}.`.slice(0,1000);
      const entry={
        at:Date.now(),original:String(raw).slice(0,240),expanded,followUp:true,subjects,target,location,
        mood:state.lastMood||'',intensity:snapshot?snapshot.level:(state.intensity||1),directEdit:true
      };
      state.history.push(entry);state.history=state.history.slice(-MAX_HISTORY);
      state.lastOriginal=entry.original;state.lastExpanded=entry.expanded;state.lastSubjects=subjects;
      state.lastTarget=target;state.lastLocation=location;state.intensity=entry.intensity;
      state.lastSceneTitle=snapshot?snapshot.title:(state.lastSceneTitle||'');
      state.lastSceneMessage=snapshot?snapshot.message:(state.lastSceneMessage||'');
      state.totalWishes=(state.totalWishes||0)+1;
      saveMemory(state);
      return descriptions;
    }

    function synthetic(message,title='Wish updated'){
      return new Response(JSON.stringify({
        effect:'phase3_live_edit',message,
        scene:{title,message,overlay:'none',duration:1,events:[]}
      }),{status:200,headers:{'Content-Type':'application/json'}});
    }

    function showHistory(){
      const state=loadMemory();
      const history=Array.isArray(state.history)?state.history:[];
      if(!history.length){showNotice('Wish history','The pool has not heard a wish yet.');return'There are no wishes to remember yet.';}
      const recent=history.slice(-4).map((item,index)=>`${history.length-Math.min(4,history.length)+index+1}. ${item.original}`).join('  •  ');
      showNotice('Recent wishes',recent.slice(0,150));
      return recent;
    }

    const previousFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){
      try{
        const url=typeof input==='string'?input:(input&&input.url)||'';
        if(url.includes(ENDPOINT)&&init&&init.body){
          const body=JSON.parse(init.body);
          const raw=String(body&&body.wish||'').trim();
          const t=normalize(raw);
          const state=loadMemory();

          if(/^(show|list|tell me) (my )?(wish )?history$|^what have i wished for$|^show previous wishes$/.test(t)){
            const message=showHistory();
            return synthetic(message,'The pool remembers');
          }

          if(/^(what is happening|what is active|describe the scene|what did you change)$/.test(t)&&window.WishCinemaFx&&window.WishCinemaFx.active){
            const snap=window.WishCinemaFx.snapshot();
            const message=`${snap.title}: ${snap.groups.join(', ')||'cinematic effects'} at intensity ${snap.level}.`;
            showNotice('Current wish scene',message);
            return synthetic(message,'Current wish scene');
          }

          const historical=rewriteHistoricalRequest(raw,body,state);
          if(historical){
            showNotice('An earlier wish returns','The pool reached back into this session.');
            return previousFetch(input,{...init,body:JSON.stringify(historical)});
          }

          if(directEligible(raw)){
            const changes=parseDirectChanges(raw,state);
            if(changes.length===1&&changes[0].type==='undo'){
              const ok=window.WishCinemaFx.undoModify();
              const message=ok?'The last live change was undone.':'There is no live change left to undo.';
              showNotice('Scene edit',message);
              return synthetic(message);
            }
            let applied=[];
            changes.forEach(change=>{if(window.WishCinemaFx.modify(change))applied.push(change);});
            if(applied.length){
              const descriptions=updateMemoryForDirect(raw,applied);
              const message=`The pool remembered and ${descriptions.join(', ')}.`;
              showNotice('The scene changed',message.slice(0,150));
              return synthetic(message);
            }
          }
        }
      }catch(e){console.warn('phase3 direct command failed',e);}
      return previousFetch(input,init);
    };

    function updateNotice(){if(noticeTimer>0)noticeTimer--;if(noticeTimer<=0)notice=null;}
    function drawNotice(){
      if(!notice||noticeTimer<=0||typeof ctx==='undefined'||typeof canvas==='undefined')return;
      const fade=Math.min(1,noticeTimer/35),width=Math.min(620,canvas.width-40),x=canvas.width/2-width/2,y=112;
      ctx.save();ctx.globalAlpha=fade*.94;ctx.fillStyle='rgba(10,6,18,.92)';ctx.strokeStyle='#8ee8ff';ctx.lineWidth=3;
      if(typeof roundRect==='function')roundRect(x,y,width,78,12,true,true);else{ctx.fillRect(x,y,width,78);ctx.strokeRect(x,y,width,78);}
      ctx.fillStyle='#8ee8ff';ctx.font='bold 16px monospace';ctx.fillText(notice.title,x+18,y+28);
      ctx.fillStyle='#fff';ctx.font='13px monospace';ctx.fillText(String(notice.text||'').slice(0,96),x+18,y+55);ctx.restore();
    }

    if(typeof update==='function'){const oldUpdate=update;update=function(){oldUpdate();updateNotice();};}
    if(typeof draw==='function'){const oldDraw=draw;draw=function(){oldDraw();drawNotice();};}

    window.WishPhase3={
      get active(){return !!(window.WishCinemaFx&&window.WishCinemaFx.active);},
      get memory(){return loadMemory();},
      edit(command){
        const state=loadMemory(),changes=parseDirectChanges(command,state),applied=[];
        changes.forEach(change=>{if(window.WishCinemaFx&&window.WishCinemaFx.modify(change))applied.push(change);});
        if(applied.length)updateMemoryForDirect(command,applied);
        return applied.length;
      },
      history:showHistory
    };
  }catch(e){
    console.warn('wish phase3 director failed',e);
  }
})();