// Phase 3: session memory, pronoun resolution, follow-up wishes, undo, and conversation-style wish chains.
(function(){
  try{
    const ENDPOINT = 'damp-cherry-8310.ashton20-bama.workers.dev';
    const STORAGE_KEY = 'wishPoolPhase3Session';
    const MAX_HISTORY = 24;

    const normalize = value => String(value || '')
      .toLowerCase()
      .replace(/[’]/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    const emptyState = () => ({
      version: 1,
      history: [],
      lastOriginal: '',
      lastExpanded: '',
      lastSubjects: [],
      lastTarget: '',
      lastLocation: '',
      lastMood: '',
      intensity: 1,
      totalWishes: 0,
      lastSceneTitle: '',
      lastSceneMessage: ''
    });

    function loadState(){
      try{
        const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
        if(!parsed || typeof parsed !== 'object') return emptyState();
        return {...emptyState(), ...parsed, history:Array.isArray(parsed.history) ? parsed.history.slice(-MAX_HISTORY) : []};
      }catch(e){
        return emptyState();
      }
    }

    let memory = loadState();
    let notice = null;
    let noticeTimer = 0;

    function save(){
      try{sessionStorage.setItem(STORAGE_KEY, JSON.stringify(memory));}catch(e){}
    }

    function showNotice(title, text){
      notice = {title, text};
      noticeTimer = 210;
    }

    const subjectGroups = {
      dragon:['dragon','charizard'],
      money:['money','cash','dollars','coins','gold','diamonds','treasure','wealth'],
      holi:['holi','color powder','colour powder','rang','abir'],
      food:['biryani','kacchi','fuchka','puchka','mishti','pizza','burger','fries','cake','cookies','food','feast'],
      pets:['binx','loki','casper','mojo','dallas','cats','dogs','pets'],
      butterflies:['butterfly','butterflies'],
      flowers:['flower','flowers','petals','roses','blossoms'],
      hearts:['heart','hearts','love'],
      stars:['star','stars','comet','comets','galaxy'],
      weather:['rain','storm','snow','blizzard','fog','rainbow','aurora','monsoon'],
      ghosts:['ghost','ghosts','spirit','spirits'],
      bats:['bat','bats'],
      ducks:['duck','ducks'],
      frogs:['frog','frogs'],
      fire:['fire','flames','burning'],
      music:['music','song','notes'],
      lanterns:['lantern','lanterns'],
      darkness:['darkness','shadow','shadows','void','blood moon','eclipse']
    };

    const locationGroups = [
      ['shopping center','shopping_center'],
      ['shopping centre','shopping_center'],
      ['cherry blossom lake','lake'],
      ['hot springs','hot_springs'],
      ['wish pool','wish_pool'],
      ['future spot','future_spot'],
      ['apple orchard','orchard'],
      ['windmill','windmill'],
      ['helipad','helipad'],
      ['helicopter pad','helipad'],
      ['main cabin','cabin'],
      ['cabin','cabin'],
      ['silo','silo'],
      ['lake','lake'],
      ['orchard','orchard'],
      ['shopping','shopping_center'],
      ['well','well']
    ];

    function detectSubjects(text){
      const t = normalize(text);
      const found = [];
      Object.entries(subjectGroups).forEach(([name, words]) => {
        if(words.some(word => t.includes(word))) found.push(name);
      });
      return found.slice(0, 6);
    }

    function detectTarget(text){
      const t = ` ${normalize(text)} `;
      if(/\bboth\b|both of us|both players|everyone/.test(t)) return 'both';
      if(/\btanima\b|\bher\b|\bshe\b|girlfriend/.test(t)) return 'tanima';
      if(/\bashton\b|\bhim\b|\bhe\b|boyfriend|\bme\b/.test(t)) return 'ashton';
      if(/random player|one of us/.test(t)) return 'random_player';
      return '';
    }

    function detectLocation(text){
      const t = normalize(text);
      for(const [phrase, location] of locationGroups){
        if(t.includes(phrase)) return location;
      }
      return '';
    }

    function detectMood(text){
      const t = normalize(text);
      if(/sad|lonely|homesick|scared|anxious|worried|comfort/.test(t)) return 'comfort';
      if(/love|kiss|hug|romantic|marry|wedding/.test(t)) return 'romantic';
      if(/kill|destroy|dark|evil|curse|blood|ghost|void/.test(t)) return 'dark';
      if(/funny|chaos|silly|surprise/.test(t)) return 'chaotic';
      if(/cozy|calm|relax|sleepy|peaceful/.test(t)) return 'cozy';
      return '';
    }

    function subjectPhrase(subjects){
      if(!subjects || !subjects.length) return 'the previous wish effects';
      if(subjects.length === 1) return subjects[0];
      return subjects.slice(0, -1).join(', ') + ' and ' + subjects[subjects.length - 1];
    }

    function targetPhrase(target){
      if(target === 'tanima') return 'Tanima';
      if(target === 'ashton') return 'Ashton';
      if(target === 'both') return 'both Ashton and Tanima';
      if(target === 'random_player') return 'one random player';
      return '';
    }

    function locationPhrase(location){
      const labels = {
        shopping_center:'the Shopping Center', lake:'Cherry Blossom Lake', hot_springs:'the Hot Springs',
        wish_pool:'the Wish Pool', future_spot:'the Future Spot', orchard:'the Apple Orchard',
        windmill:'the Windmill', helipad:'the Helipad', cabin:'the Main Cabin', silo:'the Silo', well:'the Well of Seasons'
      };
      return labels[location] || '';
    }

    function clearActiveScenes(){
      try{if(window.WishCinemaFx && window.WishCinemaFx.active) window.WishCinemaFx.end();}catch(e){}
      try{if(window.WishPhase2 && window.WishPhase2.active) window.WishPhase2.end();}catch(e){}
      try{if(window.DragonBoss && window.DragonBoss.active && window.WishCinemaFx) window.WishCinemaFx.end();}catch(e){}
    }

    function clearMemory(show=true){
      memory = emptyState();
      save();
      clearActiveScenes();
      if(show) showNotice('Wish memory cleared', 'The pool has forgotten the previous conversation.');
    }

    function undoLast(){
      clearActiveScenes();
      memory.history.pop();
      const previous = memory.history[memory.history.length - 1];
      if(previous){
        memory.lastOriginal = previous.original || '';
        memory.lastExpanded = previous.expanded || previous.original || '';
        memory.lastSubjects = previous.subjects || [];
        memory.lastTarget = previous.target || '';
        memory.lastLocation = previous.location || '';
        memory.lastMood = previous.mood || '';
      }else{
        Object.assign(memory, emptyState());
      }
      save();
      showNotice('Last wish undone', previous ? 'The pool returned to the wish before it.' : 'There are no earlier wishes left.');
    }

    function resolvePronouns(text){
      let result = text;
      const subjects = subjectPhrase(memory.lastSubjects);
      const target = targetPhrase(memory.lastTarget);
      const location = locationPhrase(memory.lastLocation);

      result = result.replace(/\b(they|them|those)\b/gi, subjects);
      result = result.replace(/\b(it|that|this)\b/gi, memory.lastSubjects.length === 1 ? memory.lastSubjects[0] : subjects);
      if(target){
        result = result.replace(/\bthe same person\b/gi, target);
        result = result.replace(/\bthat player\b/gi, target);
      }
      if(location){
        result = result.replace(/\bthere\b/gi, location);
        result = result.replace(/\bthat place\b/gi, location);
      }
      return result;
    }

    function resolveWish(original){
      const raw = String(original || '').trim();
      const t = normalize(raw);
      if(!raw) return {expanded:raw, followUp:false, command:''};

      if(/^(forget everything|forget previous wishes|clear memory|reset wish memory|start over)$/.test(t)){
        clearMemory();
        return {expanded:'soft peaceful sparkles', followUp:false, command:'clear'};
      }

      if(/^(undo|undo that|undo last wish|take that back|forget that)$/.test(t)){
        undoLast();
        return {expanded:'soft peaceful sparkles', followUp:false, command:'undo'};
      }

      if(/^(stop|enough|make it stop|stop everything|cancel the wish)$/.test(t)){
        clearActiveScenes();
        showNotice('Wish stopped', 'The pool releases the current scene.');
        return {expanded:'soft peaceful sparkles', followUp:false, command:'stop'};
      }

      if(/^(what did i wish for|what was my last wish|remember my wish)$/.test(t)){
        const remembered = memory.lastOriginal || 'nothing yet';
        showNotice('The pool remembers', remembered);
        return {expanded:memory.lastExpanded || 'soft memory sparkles', followUp:true, command:'recall'};
      }

      const hasPrevious = !!memory.lastExpanded;
      let expanded = raw;
      let followUp = false;

      const repeatOnly = /^(more|more!|even more|again|do it again|keep going|bigger|stronger|double it|triple it)$/;
      if(hasPrevious && repeatOnly.test(t)){
        memory.intensity = Math.min(5, (memory.intensity || 1) + (/triple/.test(t) ? 2 : 1));
        expanded = `${memory.lastExpanded}. Repeat the same scene with intensity level ${memory.intensity}, more particles, stronger motion, and a larger cinematic effect.`;
        followUp = true;
      }else if(hasPrevious && /^(less|smaller|calmer|tone it down|not so much)$/.test(t)){
        memory.intensity = Math.max(1, (memory.intensity || 1) - 1);
        expanded = `${memory.lastExpanded}. Repeat it more gently at intensity level ${memory.intensity}, with fewer particles and calmer movement.`;
        followUp = true;
      }else if(hasPrevious && /^(same|same thing|same again|do the same)$/.test(t)){
        expanded = `${memory.lastExpanded}. Repeat the same wish scene.`;
        followUp = true;
      }else if(hasPrevious && /^(same but|do the same but|again but)/.test(t)){
        const change = raw.replace(/^(same but|do the same but|again but)\s*/i, '');
        expanded = `${memory.lastExpanded}. Keep the previous scene, but ${resolvePronouns(change)}.`;
        followUp = true;
      }else if(hasPrevious && (/^(now|then|also|and|but|next|after that)\b/.test(t) || /^(make|turn|give|have|put|send|add|remove|change)\s+(it|them|that|those|the same)/.test(t))){
        expanded = `${memory.lastExpanded}. Then ${resolvePronouns(raw.replace(/^(now|then|also|and|but|next|after that)\s*/i, ''))}.`;
        followUp = true;
      }else if(hasPrevious && /\b(it|them|they|those|that|there|the same person|that player|that place)\b/.test(t)){
        expanded = `${memory.lastExpanded}. Then ${resolvePronouns(raw)}.`;
        followUp = true;
      }else{
        memory.intensity = 1;
      }

      const subjects = detectSubjects(expanded);
      const target = detectTarget(expanded) || (followUp ? memory.lastTarget : '');
      const location = detectLocation(expanded) || (followUp ? memory.lastLocation : '');
      const mood = detectMood(expanded) || (followUp ? memory.lastMood : '');

      return {expanded, followUp, command:'', subjects, target, location, mood};
    }

    function remember(original, resolution){
      if(resolution.command && resolution.command !== 'recall') return;
      const subjects = resolution.subjects && resolution.subjects.length ? resolution.subjects : detectSubjects(resolution.expanded);
      const entry = {
        at:Date.now(),
        original:String(original || '').slice(0, 240),
        expanded:String(resolution.expanded || original || '').slice(0, 1000),
        followUp:!!resolution.followUp,
        subjects,
        target:resolution.target || detectTarget(resolution.expanded),
        location:resolution.location || detectLocation(resolution.expanded),
        mood:resolution.mood || detectMood(resolution.expanded),
        intensity:memory.intensity || 1
      };

      memory.history.push(entry);
      memory.history = memory.history.slice(-MAX_HISTORY);
      memory.lastOriginal = entry.original;
      memory.lastExpanded = entry.expanded;
      memory.lastSubjects = entry.subjects;
      memory.lastTarget = entry.target;
      memory.lastLocation = entry.location;
      memory.lastMood = entry.mood;
      memory.totalWishes = (memory.totalWishes || 0) + 1;
      save();

      if(entry.followUp){
        showNotice('The pool remembered', `Continuing: ${entry.subjects.length ? subjectPhrase(entry.subjects) : entry.original}`);
      }
    }

    const previousFetch = window.fetch.bind(window);
    window.fetch = async function(input, init){
      let originalWish = '';
      let resolution = null;
      let nextInit = init;

      try{
        const url = typeof input === 'string' ? input : (input && input.url) || '';
        if(url.includes(ENDPOINT) && init && init.body){
          const body = JSON.parse(init.body);
          if(body && body.wish){
            originalWish = String(body.wish);
            resolution = resolveWish(originalWish);
            remember(originalWish, resolution);

            const enrichedBody = {
              ...body,
              wish:resolution.expanded,
              originalWish,
              memory:{
                followUp:!!resolution.followUp,
                intensity:memory.intensity || 1,
                previousWishes:memory.history.slice(-6).map(item => item.expanded),
                lastSubjects:memory.lastSubjects,
                lastTarget:memory.lastTarget,
                lastLocation:memory.lastLocation,
                lastMood:memory.lastMood,
                totalWishes:memory.totalWishes
              }
            };
            nextInit = {...init, body:JSON.stringify(enrichedBody)};
          }
        }
      }catch(e){}

      const response = await previousFetch(input, nextInit);

      try{
        if(resolution){
          response.clone().json().then(data => {
            const scene = data && (data.scene || data.recipe || data);
            if(scene && typeof scene === 'object'){
              memory.lastSceneTitle = String(scene.title || '').slice(0, 80);
              memory.lastSceneMessage = String(scene.message || data.message || '').slice(0, 200);
              save();
            }
          }).catch(()=>{});
        }
      }catch(e){}

      return response;
    };

    function updateMemoryNotice(){
      if(noticeTimer > 0) noticeTimer--;
      if(noticeTimer <= 0) notice = null;
    }

    function drawMemoryNotice(){
      if(!notice || noticeTimer <= 0 || typeof ctx === 'undefined' || typeof canvas === 'undefined') return;
      const fade = Math.min(1, noticeTimer / 35);
      const width = Math.min(520, canvas.width - 40);
      const x = canvas.width / 2 - width / 2;
      const y = 28;
      ctx.save();
      ctx.globalAlpha = fade * .94;
      ctx.fillStyle = 'rgba(10, 6, 18, .92)';
      ctx.strokeStyle = '#d9a7ff';
      ctx.lineWidth = 3;
      if(typeof roundRect === 'function') roundRect(x, y, width, 76, 12, true, true);
      else {ctx.fillRect(x, y, width, 76);ctx.strokeRect(x, y, width, 76);}
      ctx.fillStyle = '#d9a7ff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(notice.title, x + 18, y + 27);
      ctx.fillStyle = '#ffffff';
      ctx.font = '13px monospace';
      const text = String(notice.text || '').slice(0, 78);
      ctx.fillText(text, x + 18, y + 53);
      ctx.restore();
    }

    if(typeof update === 'function'){
      const oldUpdate = update;
      update = function(){oldUpdate();updateMemoryNotice();};
    }

    if(typeof draw === 'function'){
      const oldDraw = draw;
      draw = function(){oldDraw();drawMemoryNotice();};
    }

    window.WishMemory = {
      resolve:resolveWish,
      clear:clearMemory,
      undo:undoLast,
      stop:clearActiveScenes,
      get state(){return JSON.parse(JSON.stringify(memory));},
      get history(){return memory.history.slice();}
    };
  }catch(e){
    console.warn('wish phase3 memory failed', e);
  }
})();