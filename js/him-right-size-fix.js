// Global sprite direction/frame polish.
// Her stays untouched.
// His side-facing frames are on row 3, so right uses row 3 and left mirrors row 3.
(function(){
  try{
    if(typeof players === 'undefined') return;

    Object.entries(players).forEach(([key, player]) => {
      if(!player) return;

      if(key === 'him' || player.name === 'Me'){
        player.rows = {down:0, up:2, left:3, right:3};
      } else {
        player.rows = {down:0, up:2, left:1, right:3};
      }

      player.frames = {
        down:[0,1,2,3],
        up:[0,1,2,3],
        left:[0,1,2,3],
        right:[0,1,2,3]
      };
      player.cols = 4;
    });

    if(typeof drawSprite === 'function'){
      const originalDrawSpriteForHimLeft = drawSprite;
      drawSprite = function(player){
        const isHim = player && (player === players.him || player.name === 'Me');

        if(isHim && player.dir === 'left'){
          const sw = 96;
          const sh = 128;
          const row = 3;
          const dw = Math.round(sw * player.scale);
          const dh = Math.round(sh * player.scale);
          const drawX = Math.round(player.x - camera.x - dw / 2);
          const drawY = Math.round(player.y - camera.y - dh + 10);

          ctx.save();
          ctx.translate(drawX + dw, drawY);
          ctx.scale(-1, 1);
          ctx.drawImage(player.img, player.frame * sw, row * sh, sw, sh, 0, 0, dw, dh);
          ctx.restore();
          return;
        }

        originalDrawSpriteForHimLeft(player);
      };
    }

    // Changing room counter feature. This only runs on the clothing store page.
    if(typeof zones !== 'undefined' && typeof chooseOutfit === 'function' && typeof update === 'function'){
      let mustStopAtCounter = false;
      let note = '';
      let noteTimer = 0;
      let previousE = false;

      const exitZone = zones.find(z => z.type === 'exit');
      if(exitZone){
        exitZone.type = 'door';
        exitZone.text = 'Press E to leave the clothing store';
      }

      if(!zones.some(z => z.type === 'counter')){
        zones.push({name:'Counter', x:306, y:480, r:95, type:'counter', text:'Press E to talk to the lady at the counter'});
      }

      function inRect(px, py, r){
        return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
      }

      function say(text, frames){
        note = text;
        noteTimer = frames || 160;
      }

      const oldChooseOutfit = chooseOutfit;
      chooseOutfit = function(who, outfit){
        oldChooseOutfit(who, outfit);
        mustStopAtCounter = true;
        say('New outfit selected. We should stop by the counter first.');
      };

      const oldNearbyZone = nearbyZone;
      nearbyZone = function(){
        const counterRect = {x:157, y:460, w:298, h:39};
        if(inRect(players.her.x, players.her.y, counterRect) || inRect(players.him.x, players.him.y, counterRect)){
          return {name:'Counter', x:306, y:480, r:95, type:'counter', text:'Press E to talk to the lady at the counter'};
        }
        return oldNearbyZone();
      };

      const oldUpdate = update;
      update = function(){
        oldUpdate();
        if(noteTimer > 0) noteTimer--;

        const justPressedE = keys.e && !previousE;
        previousE = !!keys.e;
        if(!justPressedE || !activeZone || menuOpen) return;

        if(activeZone.type === 'door'){
          if(mustStopAtCounter){
            say('Haha... I do not think they will let us leave yet.', 190);
          } else {
            location.href = 'shopping.html';
          }
        }

        if(activeZone.type === 'counter'){
          mustStopAtCounter = false;
          say('Lady: You both look wonderful. Happy Anniversary!', 190);
        }
      };

      const oldDraw = draw;
      draw = function(){
        oldDraw();
        if(noteTimer <= 0 || !note) return;

        ctx.save();
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        const w = Math.min(canvas.width - 60, 820);
        const x = canvas.width / 2;
        const y = 92;
        ctx.fillStyle = 'rgba(25,12,18,.94)';
        ctx.strokeStyle = '#ff9dcc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x - w / 2, y - 35, w, 70, 14);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffe18b';
        ctx.fillText(note, x, y + 7, w - 34);
        ctx.restore();
      };
    }

    // B key boundary helper. Safe on pages that already have G debug.
    // B turns it on/off. Click one corner, then click the opposite corner.
    if(typeof canvas !== 'undefined' && typeof camera !== 'undefined' && !window.anniversaryBTool){
      window.anniversaryBTool = true;
      let bMode = false;
      let firstPoint = null;
      let secondPoint = null;
      let mousePoint = null;
      let bText = '';

      function mapPointFromEvent(e){
        const rect = canvas.getBoundingClientRect();
        return {
          x: Math.round(e.clientX - rect.left + camera.x),
          y: Math.round(e.clientY - rect.top + camera.y)
        };
      }

      function rectFromPoints(a, b){
        const x = Math.min(a.x, b.x);
        const y = Math.min(a.y, b.y);
        const w = Math.abs(a.x - b.x);
        const h = Math.abs(a.y - b.y);
        return {x, y, w, h};
      }

      addEventListener('keydown', e => {
        const key = e.key.toLowerCase();
        if(key === 'b'){
          bMode = !bMode;
          firstPoint = null;
          secondPoint = null;
          mousePoint = null;
          bText = bMode ? 'B boundary tool ON. Click corner 1.' : 'B boundary tool OFF.';
        }
        if(bMode && key === 'escape'){
          firstPoint = null;
          secondPoint = null;
          mousePoint = null;
          bText = 'Cleared. Click corner 1.';
        }
      });

      canvas.addEventListener('mousemove', e => {
        if(!bMode) return;
        mousePoint = mapPointFromEvent(e);
      });

      canvas.addEventListener('click', e => {
        if(!bMode) return;
        const p = mapPointFromEvent(e);

        if(!firstPoint || secondPoint){
          firstPoint = p;
          secondPoint = null;
          bText = 'Corner 1 x:' + p.x + ' y:' + p.y + '. Click corner 2.';
          console.log('Boundary corner 1', p.x, p.y);
          return;
        }

        secondPoint = p;
        const r = rectFromPoints(firstPoint, secondPoint);
        bText = 'x:' + r.x + ', y:' + r.y + ', w:' + r.w + ', h:' + r.h;
        console.log('{x:' + r.x + ', y:' + r.y + ', w:' + r.w + ', h:' + r.h + '}');
      });

      const oldDrawForBTool = draw;
      draw = function(){
        oldDrawForBTool();
        if(!bMode) return;

        ctx.save();
        ctx.font = '18px monospace';
        ctx.fillStyle = 'rgba(25,12,18,.94)';
        ctx.fillRect(18, 18, 620, 48);
        ctx.strokeStyle = '#ffe18b';
        ctx.strokeRect(18, 18, 620, 48);
        ctx.fillStyle = '#ffe18b';
        ctx.fillText(bText || 'B boundary tool ON. Click corner 1.', 30, 49);

        const activeSecond = secondPoint || mousePoint;
        if(firstPoint && activeSecond){
          const r = rectFromPoints(firstPoint, activeSecond);
          const sx = r.x - camera.x;
          const sy = r.y - camera.y;

          ctx.fillStyle = 'rgba(255,157,204,0.25)';
          ctx.fillRect(sx, sy, r.w, r.h);
          ctx.strokeStyle = '#ff9dcc';
          ctx.lineWidth = 3;
          ctx.strokeRect(sx, sy, r.w, r.h);
          ctx.fillStyle = '#ffffff';
          ctx.fillText('x:' + r.x + ' y:' + r.y + ' w:' + r.w + ' h:' + r.h, sx + 8, sy - 10);
        } else if(firstPoint){
          const sx = firstPoint.x - camera.x;
          const sy = firstPoint.y - camera.y;
          ctx.strokeStyle = '#ff9dcc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(sx, sy, 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.fillText('corner 1', sx + 15, sy - 10);
        }
        ctx.restore();
      };
    }
  } catch(e){}
})();