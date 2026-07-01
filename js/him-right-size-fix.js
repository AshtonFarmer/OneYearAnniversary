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
      let checkoutOpen = false;
      let pendingOutfits = [];

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

      function pendingLabel(){
        if(!pendingOutfits.length) return 'Outfit change';
        return pendingOutfits.join(' + ');
      }

      function ensureCheckoutPanel(){
        let panel = document.getElementById('checkoutPanel');
        if(panel) return panel;

        panel = document.createElement('div');
        panel.id = 'checkoutPanel';
        panel.style.cssText = 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(4,10,18,.55);z-index:30;font-family:monospace;';
        panel.innerHTML = '<div style="width:min(520px,90vw);background:rgba(25,12,18,.97);border:3px solid #b17142;border-radius:16px;padding:24px;color:white;box-shadow:0 12px 40px #000;text-align:center;">' +
          '<h1 style="margin-top:0;color:#ff97cf;font-size:26px;">Checkout Counter</h1>' +
          '<p id="checkoutLady" style="color:#ffe18b;font-size:18px;line-height:1.4;">Lady: Did you find everything you were looking for?</p>' +
          '<div style="border-top:2px dashed #ff9dcc;border-bottom:2px dashed #ff9dcc;margin:18px 0;padding:16px 0;">' +
          '<div id="checkoutOutfit" style="font-size:20px;color:#fff;margin-bottom:8px;">Outfit change</div>' +
          '<div style="font-size:20px;color:#ffe18b;">Price: &hearts; Love</div>' +
          '</div>' +
          '<button id="buyOutfitBtn" style="background:#ff97cf;border:0;border-radius:10px;padding:12px 18px;font-weight:bold;cursor:pointer;margin:6px;">Buy Outfit</button>' +
          '<button id="cancelOutfitBtn" style="background:#2f1f2a;color:#ffe18b;border:2px solid #b17142;border-radius:10px;padding:10px 16px;font-weight:bold;cursor:pointer;margin:6px;">Cancel</button>' +
          '</div>';
        document.body.appendChild(panel);

        panel.querySelector('#buyOutfitBtn').onclick = function(){
          panel.style.display = 'none';
          checkoutOpen = false;
          menuOpen = false;
          mustStopAtCounter = false;
          pendingOutfits = [];
          say('Lady: You both look wonderful. Happy Anniversary!', 190);
        };

        panel.querySelector('#cancelOutfitBtn').onclick = function(){
          panel.style.display = 'none';
          checkoutOpen = false;
          menuOpen = false;
          say('Lady: No problem. Come back when you are ready.');
        };

        return panel;
      }

      function openCheckoutPanel(){
        const panel = ensureCheckoutPanel();
        const outfitLine = panel.querySelector('#checkoutOutfit');
        outfitLine.textContent = pendingLabel();
        checkoutOpen = true;
        menuOpen = true;
        panel.style.display = 'flex';
      }

      const oldChooseOutfit = chooseOutfit;
      chooseOutfit = function(who, outfit){
        oldChooseOutfit(who, outfit);
        mustStopAtCounter = true;
        const label = (who === 'her' ? 'Her' : 'His') + ' Outfit #' + outfit;
        pendingOutfits = pendingOutfits.filter(item => !item.startsWith(who === 'her' ? 'Her Outfit' : 'His Outfit'));
        pendingOutfits.push(label);
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
        if(checkoutOpen) return;
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
          if(mustStopAtCounter){
            openCheckoutPanel();
          } else {
            say('Lady: You are all paid up. Have a beautiful day!');
          }
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