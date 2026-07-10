// Temporary Wish Pool starter.
// Nothing is saved to localStorage, so refreshing the page resets every wish.
// Later we can connect window.WISH_AI_ENDPOINT to a Cloudflare Worker.
(function(){
  try{
    if(typeof update !== 'function' || typeof draw !== 'function') return;

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

    function localWishResult(text){
      const lower = text.toLowerCase();
      let effect = 'sparkles';
      let message = 'The water glows... your wish has been heard.';

      if(lower.includes('heart') || lower.includes('love') || lower.includes('tanima') || lower.includes('forever')){
        effect = 'hearts';
        message = 'The water glows pink... love answers back.';
      }
      else if(lower.includes('flower') || lower.includes('petal') || lower.includes('spring')){
        effect = 'petals';
        message = 'Soft petals drift across the water.';
      }
      else if(lower.includes('star') || lower.includes('moon') || lower.includes('night')){
        effect = 'stars';
        message = 'Tiny stars shimmer above the pool.';
      }
      else if(lower.includes('duck') || lower.includes('ducks')){
        effect = 'ducks';
        message = 'A tiny duck appears like it had somewhere important to be.';
      }
      else if(lower.includes('rain')){
        effect = 'rain';
        message = 'Little drops fall softly around the wish pool.';
      }

      return {effect,message};
    }

    async function askWishAI(text){
      const endpoint = window.WISH_AI_ENDPOINT || '';
      if(!endpoint) return localWishResult(text);

      try{
        const res = await fetch(endpoint,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({wish:text})
        });
        if(!res.ok) throw new Error('Wish AI failed');
        const data = await res.json();
        return {
          effect: data.effect || 'sparkles',
          message: data.message || 'The water glows... your wish has been heard.'
        };
      } catch(err){
        console.warn('Wish AI fallback:', err);
        return localWishResult(text);
      }
    }

    function startWishScene(text){
      wishScene = {
        text,
        effect:'listening',
        message:'The water is listening...',
        timer:0,
        waiting:true
      };
      wishParticles = [];

      askWishAI(text).then(result => {
        if(!wishScene || wishScene.text !== text) return;
        wishScene.effect = result.effect || 'sparkles';
        wishScene.message = result.message || 'The water glows... your wish has been heard.';
        wishScene.waiting = false;
        wishScene.timer = 0;
      });
    }

    function makeWish(){
      const text = window.prompt('What should we wish for?');
      if(!text || !text.trim()){
        wishScene = {
          text:'',
          effect:'sparkles',
          message:'The water ripples softly. Maybe next time.',
          timer:0,
          waiting:false
        };
        return;
      }
      startWishScene(text.trim());
    }

    function spawnWishParticle(){
      if(!wishScene) return;
      const effect = wishScene.effect;
      const baseX = wishPoolCenter.x + (Math.random() - .5) * 76;
      const baseY = wishPoolCenter.y + (Math.random() - .5) * 34;

      if(effect === 'hearts'){
        wishParticles.push({type:'heart',x:baseX,y:baseY,life:90,vx:(Math.random()-.5)*.6,vy:-.9-Math.random()*.6,size:3+Math.random()*2});
      }
      else if(effect === 'petals'){
        wishParticles.push({type:'petal',x:baseX,y:baseY,life:120,vx:.25+Math.random()*.8,vy:-.25+Math.random()*.45,size:3+Math.random()*3,spin:Math.random()*6});
      }
      else if(effect === 'stars'){
        wishParticles.push({type:'star',x:baseX,y:baseY-20-Math.random()*60,life:100,vx:(Math.random()-.5)*.25,vy:-.18,size:2+Math.random()*3});
      }
      else if(effect === 'ducks'){
        if(wishParticles.filter(p => p.type === 'duck').length < 5){
          wishParticles.push({type:'duck',x:wishPoolBox.x-12,y:wishPoolCenter.y-2+Math.random()*12,life:220,vx:.45+Math.random()*.35,vy:Math.sin(heartTimer/20)*.05,size:5});
        }
      }
      else if(effect === 'rain'){
        wishParticles.push({type:'drop',x:baseX,y:wishPoolCenter.y-86-Math.random()*90,life:90,vx:0,vy:1.8+Math.random()*1.4,size:3});
      }
      else {
        wishParticles.push({type:'sparkle',x:baseX,y:baseY,life:80,vx:(Math.random()-.5)*.45,vy:-.6-Math.random()*.5,size:2+Math.random()*3});
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
        if(wishScene.timer % (wishScene.waiting ? 8 : 3) === 0) spawnWishParticle();
        if(!wishScene.waiting && wishScene.timer > 430){
          wishScene = null;
          wishParticles = [];
          wishCooldown = 35;
        }
      }

      wishParticles = wishParticles.filter(p => {
        p.life--;
        p.x += p.vx || 0;
        p.y += p.vy || 0;
        if(p.type === 'drop' && p.y > wishPoolCenter.y + 18) p.life = 0;
        if(p.type === 'duck' && p.x > wishPoolBox.x + wishPoolBox.w + 30) p.life = 0;
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
        const alpha = Math.max(0,Math.min(1,p.life/80));
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
          ctx.shadowColor = '#fff1a8';
          ctx.shadowBlur = 8;
          drawStar(x,y,p.size);
        }
        else if(p.type === 'duck'){
          drawDuck(x,y,p.size);
        }
        else if(p.type === 'drop'){
          ctx.fillStyle = '#8ee8ff';
          ctx.fillRect(x,y,p.size,p.size*2);
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

    function drawWishMessage(){
      if(!wishScene) return;
      const alpha = wishScene.waiting ? .9 : Math.min(1, wishScene.timer / 40) * Math.min(1, (430 - wishScene.timer) / 60);
      const boxW = Math.min(700, canvas.width - 48);
      const boxH = 118;
      const x = Math.round(canvas.width / 2 - boxW / 2);
      const y = 28;

      ctx.save();
      ctx.globalAlpha = Math.max(0,alpha);
      ctx.fillStyle = 'rgba(12,8,24,.93)';
      ctx.strokeStyle = '#d9a7ff';
      ctx.lineWidth = 4;
      roundRect(x,y,boxW,boxH,16,true,true);

      ctx.fillStyle = '#d9a7ff';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('Wish Pool',x+22,y+38);

      ctx.fillStyle = '#fff1c8';
      ctx.font = '17px monospace';
      ctx.fillText(wishScene.message,x+22,y+72,boxW-44);

      if(wishScene.text){
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        ctx.font = '14px monospace';
        const wishLine = `Wish: ${wishScene.text}`;
        ctx.fillText(wishLine,x+22,y+98,boxW-44);
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
