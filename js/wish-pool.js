// AI Wish Pool starter.
// Nothing is saved to localStorage, so refreshing the page resets every wish.
// The Cloudflare Worker keeps the AI key/binding hidden.
(function(){
  try{
    if(typeof update !== 'function' || typeof draw !== 'function') return;

    window.WISH_AI_ENDPOINT = 'https://damp-cherry-8310.ashton20-bama.workers.dev';

    const wishPoolBox = {x:1303, y:801, w:60, h:31};
    const wishPoolCenter = {
      x: wishPoolBox.x + wishPoolBox.w / 2,
      y: wishPoolBox.y + wishPoolBox.h / 2
    };

    let wishLastE = false;
    let wishCooldown = 0;
    let wishScene = null;
    let wishParticles = [];

    function inWishBox(x,y){
      return x >= wishPoolBox.x && x <= wishPoolBox.x + wishPoolBox.w &&
             y >= wishPoolBox.y && y <= wishPoolBox.y + wishPoolBox.h;
    }

    function nearWishPool(){
      return inWishBox(players.her.x,players.her.y) || inWishBox(players.him.x,players.him.y);
    }

    function neutralWishResult(){
      return {
        effect:'none',
        message:'The water glows... your wish has been heard.'
      };
    }

    function getMapUrlForAI(){
      if(typeof map !== 'undefined' && map.src) return map.src;
      if(typeof getSeason === 'function'){
        const season = getSeason();
        if(season && season.map) return new URL(season.map, location.href).href;
      }
      return new URL('assets/maps/main-map.png', location.href).href;
    }

    function getSeasonForAI(){
      if(typeof currentSeason !== 'undefined') return currentSeason;
      return localStorage.getItem('currentSeason') || 'summer';
    }

    function getWishPayload(text){
      return {
        wish:text,
        season:getSeasonForAI(),
        mapUrl:getMapUrlForAI(),
        wishPool:{
          box:wishPoolBox,
          center:wishPoolCenter,
          note:'The wish starts at the fourth water pool in the home hot springs area.'
        },
        players:{
          her:{x:Math.round(players.her.x), y:Math.round(players.her.y), dir:players.her.dir},
          him:{x:Math.round(players.him.x), y:Math.round(players.him.y), dir:players.him.dir}
        }
      };
    }

    async function askWishAI(text){
      const endpoint = window.WISH_AI_ENDPOINT || '';
      if(!endpoint) return neutralWishResult();

      try{
        const res = await fetch(endpoint,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(getWishPayload(text))
        });
        if(!res.ok) throw new Error('Wish AI failed');
        const data = await res.json();
        return {
          effect: data.effect || 'none',
          message: data.message || 'The water glows... your wish has been heard.'
        };
      } catch(err){
        console.warn('Wish AI fallback:', err);
        return neutralWishResult();
      }
    }

    function startWishScene(text){
      wishScene = {
        text,
        effect:'none',
        message:'The water is listening...',
        timer:0,
        waiting:true
      };
      wishParticles = [];

      askWishAI(text).then(result => {
        if(!wishScene || wishScene.text !== text) return;
        wishScene.effect = result.effect || 'none';
        wishScene.message = result.message || 'The water glows... your wish has been heard.';
        wishScene.waiting = false;
        wishScene.timer = 0;
        wishParticles = [];
      });
    }

    function makeWish(){
      const text = window.prompt('What should we wish for?');
      if(!text || !text.trim()){
        wishScene = {
          text:'',
          effect:'none',
          message:'The water ripples softly. Maybe next time.',
          timer:0,
          waiting:false
        };
        return;
      }
      startWishScene(text.trim());
    }

    function viewWorld(){
      return {
        x: (typeof camera !== 'undefined' ? camera.x : 0),
        y: (typeof camera !== 'undefined' ? camera.y : 0),
        w: canvas.width,
        h: canvas.height
      };
    }

    function rand(min,max){
      return min + Math.random() * (max - min);
    }

    function spawnFromPoolSparkle(){
      wishParticles.push({
        type:'sparkle',
        x:wishPoolCenter.x + rand(-26,26),
        y:wishPoolCenter.y + rand(-14,14),
        life:45,
        vx:rand(-.22,.22),
        vy:-.22,
        size:2,
        screenWide:false
      });
    }

    function spawnWishParticle(){
      if(!wishScene) return;
      const effect = wishScene.effect;
      if(effect === 'none') return;

      const v = viewWorld();
      const safeTop = v.y + 60;
      const safeBottom = v.y + Math.max(90, v.h - 35);
      const safeLeft = v.x - 80;
      const safeRight = v.x + v.w + 80;

      if(effect === 'hearts'){
        for(let i=0;i<3;i++){
          wishParticles.push({
            type:'heart',
            x:safeLeft - rand(0,120),
            y:rand(safeTop, safeBottom),
            life:330,
            vx:rand(1.5,2.7),
            vy:rand(-.55,.25),
            wave:rand(0,Math.PI*2),
            waveSpeed:rand(.035,.07),
            waveAmp:rand(.35,1.25),
            size:3+Math.random()*2,
            screenWide:true
          });
        }
      }
      else if(effect === 'petals'){
        for(let i=0;i<4;i++){
          wishParticles.push({
            type:'petal',
            x:safeLeft - rand(0,140),
            y:rand(safeTop, safeBottom),
            life:360,
            vx:rand(1.7,3.1),
            vy:rand(-.25,.45),
            wave:rand(0,Math.PI*2),
            waveSpeed:rand(.045,.085),
            waveAmp:rand(.5,1.8),
            size:3+Math.random()*3,
            spin:Math.random()*6,
            screenWide:true
          });
        }
      }
      else if(effect === 'stars'){
        for(let i=0;i<3;i++){
          wishParticles.push({
            type:'star',
            x:rand(v.x + 20, v.x + v.w - 20),
            y:rand(v.y + 50, v.y + Math.max(90, v.h * .62)),
            life:105,
            vx:rand(-.12,.12),
            vy:rand(-.08,.08),
            twinkle:rand(0,Math.PI*2),
            size:2+Math.random()*3,
            screenWide:true
          });
        }
      }
      else if(effect === 'ducks'){
        if(wishParticles.filter(p => p.type === 'duck').length < 9){
          wishParticles.push({
            type:'duck',
            x:safeLeft - rand(0,80),
            y:rand(v.y + v.h * .55, v.y + v.h - 80),
            life:430,
            vx:rand(1.15,2.1),
            vy:0,
            bob:rand(0,Math.PI*2),
            size:5,
            screenWide:true
          });
        }
      }
      else if(effect === 'rain'){
        for(let i=0;i<9;i++){
          wishParticles.push({
            type:'drop',
            x:rand(v.x - 25, v.x + v.w + 25),
            y:v.y - rand(10,130),
            life:130,
            vx:rand(-.22,.22),
            vy:rand(3.0,5.2),
            size:2+Math.random()*2,
            screenWide:true
          });
        }
      }
      else if(effect === 'sparkles'){
        for(let i=0;i<5;i++){
          wishParticles.push({
            type:'sparkle',
            x:rand(v.x + 20, v.x + v.w - 20),
            y:rand(v.y + 60, v.y + v.h - 60),
            life:85,
            vx:rand(-.35,.35),
            vy:rand(-.85,-.2),
            size:2+Math.random()*3,
            screenWide:true
          });
        }
      }
    }

    function updateWishScene(){
      if(wishCooldown > 0) wishCooldown--;

      const promptBox = document.getElementById('prompt');
      if(!wishScene && nearWishPool()){
        promptBox.style.display = 'block';
        promptBox.textContent = 'Press E to make a wish';
      }

      if(keys.e && !wishLastE && !wishScene && nearWishPool() && wishCooldown <= 0){
        makeWish();
        wishCooldown = 25;
      }

      if(wishScene){
        wishScene.timer++;
        if(wishScene.waiting && wishScene.timer % 12 === 0){
          spawnFromPoolSparkle();
        }
        if(!wishScene.waiting && wishScene.timer % 3 === 0){
          spawnWishParticle();
        }
        if(!wishScene.waiting && wishScene.timer > 520){
          wishScene = null;
          wishParticles = [];
          wishCooldown = 35;
        }
      }

      const v = viewWorld();
      wishParticles = wishParticles.filter(p => {
        p.life--;
        p.age = (p.age || 0) + 1;
        p.wave = (p.wave || 0) + (p.waveSpeed || 0);
        p.bob = (p.bob || 0) + .08;
        p.x += p.vx || 0;
        p.y += p.vy || 0;
        if(p.waveAmp) p.y += Math.sin(p.wave) * p.waveAmp;
        if(p.type === 'duck') p.y += Math.sin(p.bob) * .28;

        const margin = 160;
        if(p.x < v.x - margin || p.x > v.x + v.w + margin) p.life = 0;
        if(p.y < v.y - margin || p.y > v.y + v.h + margin) p.life = 0;
        return p.life > 0;
      });

      wishLastE = !!keys.e;
    }

    function drawDuck(x,y,s){
      ctx.save();
      ctx.fillStyle = '#ffd957';
      ctx.fillRect(x,y,s*4,s*2);
      ctx.fillRect(x+s*3,y-s,s*2,s*2);
      ctx.fillStyle = '#ff9b42';
      ctx.fillRect(x+s*5,y,s,s);
      ctx.fillStyle = '#241820';
      ctx.fillRect(x+s*4,y-s,s,s);
      ctx.restore();
    }

    function drawStar(x,y,s){
      ctx.save();
      ctx.fillStyle = '#fff1a8';
      ctx.fillRect(x-s/2,y-s*2,s,s*4);
      ctx.fillRect(x-s*2,y-s/2,s*4,s);
      ctx.restore();
    }

    function drawWishParticles(){
      wishParticles.forEach(p => {
        const x = p.x - camera.x;
        const y = p.y - camera.y;
        const alpha = Math.max(0,Math.min(1,p.life/90));
        ctx.save();
        ctx.globalAlpha = alpha;

        if(p.type === 'heart' && typeof drawPixelHeart === 'function'){
          ctx.shadowColor = '#ff7ac8';
          ctx.shadowBlur = 10;
          drawPixelHeart(x,y,p.size);
        }
        else if(p.type === 'petal'){
          ctx.translate(x,y);
          ctx.rotate((p.spin || 0) + heartTimer/18);
          ctx.fillStyle = '#ff9dcc';
          ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
          ctx.fillStyle = '#ffd1e8';
          ctx.fillRect(0,-p.size/2,Math.max(1,p.size/2),Math.max(1,p.size/2));
        }
        else if(p.type === 'star'){
          const twinkle = .55 + Math.abs(Math.sin((p.twinkle || 0) + heartTimer / 12)) * .45;
          ctx.globalAlpha = alpha * twinkle;
          ctx.shadowColor = '#fff1a8';
          ctx.shadowBlur = 8;
          drawStar(x,y,p.size);
        }
        else if(p.type === 'duck'){
          drawDuck(x,y,p.size);
        }
        else if(p.type === 'drop'){
          ctx.fillStyle = '#8ee8ff';
          ctx.fillRect(x,y,p.size,p.size*3);
        }
        else {
          ctx.shadowColor = '#fff1a8';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#fff1a8';
          ctx.fillRect(x,y,p.size,p.size);
        }

        ctx.restore();
      });
    }

    function wrapCanvasText(text,maxWidth,maxLines){
      const words = String(text || '').split(/\s+/).filter(Boolean);
      const lines = [];
      let line = '';

      words.forEach(word => {
        const test = line ? `${line} ${word}` : word;
        if(ctx.measureText(test).width <= maxWidth){
          line = test;
        } else {
          if(line) lines.push(line);
          line = word;
        }
      });

      if(line) lines.push(line);

      if(lines.length > maxLines){
        const kept = lines.slice(0,maxLines);
        kept[maxLines - 1] = kept[maxLines - 1].replace(/\.{3}$/,'') + '...';
        return kept;
      }

      return lines.length ? lines : [''];
    }

    function drawWrappedLines(lines,x,y,lineHeight){
      lines.forEach((line,i) => ctx.fillText(line,x,y + i * lineHeight));
    }

    function drawWishMessage(){
      if(!wishScene) return;
      const alpha = wishScene.waiting ? .9 : Math.min(1, wishScene.timer / 40) * Math.min(1, (520 - wishScene.timer) / 60);
      const boxW = Math.min(760, canvas.width - 48);
      const x = Math.round(canvas.width / 2 - boxW / 2);
      const y = 28;
      const pad = 22;
      const textW = boxW - pad * 2;

      ctx.save();
      ctx.globalAlpha = Math.max(0,alpha);

      ctx.font = '18px monospace';
      const messageLines = wrapCanvasText(wishScene.message,textW,3);

      ctx.font = '14px monospace';
      const wishLines = wishScene.text ? wrapCanvasText(`Wish: ${wishScene.text}`,textW,2) : [];

      const boxH = 72 + messageLines.length * 23 + wishLines.length * 19;

      ctx.fillStyle = 'rgba(12,8,24,.93)';
      ctx.strokeStyle = '#d9a7ff';
      ctx.lineWidth = 4;
      roundRect(x,y,boxW,boxH,16,true,true);

      ctx.fillStyle = '#d9a7ff';
      ctx.font = 'bold 26px monospace';
      ctx.fillText('Wish Pool',x + pad,y + 38);

      ctx.fillStyle = '#fff1c8';
      ctx.font = '18px monospace';
      drawWrappedLines(messageLines,x + pad,y + 70,23);

      if(wishLines.length){
        ctx.fillStyle = 'rgba(255,255,255,.78)';
        ctx.font = '14px monospace';
        drawWrappedLines(wishLines,x + pad,y + 70 + messageLines.length * 23 + 8,19);
      }

      ctx.restore();
    }

    const originalWishUpdate = update;
    update = function(){
      originalWishUpdate();
      updateWishScene();
    };

    const originalWishDraw = draw;
    draw = function(){
      originalWishDraw();
      drawWishParticles();
      drawWishMessage();
    };

    if(typeof drawDebugZones === 'function'){
      const originalWishDebug = drawDebugZones;
      drawDebugZones = function(){
        originalWishDebug();
        if(!debugMode) return;
        ctx.save();
        drawDebugRect(wishPoolBox,'rgba(180,80,255,.34)');
        drawDebugText('Wish Pool Start',wishPoolBox.x,wishPoolBox.y);
        ctx.restore();
      };
    }
  } catch(e){
    console.warn('wish-pool failed', e);
  }
})();