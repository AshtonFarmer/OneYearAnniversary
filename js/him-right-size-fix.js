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
        zones.push({name:'Counter', x:768, y:275, r:115, type:'counter', text:'Press E at the counter'});
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
  } catch(e){}
})();