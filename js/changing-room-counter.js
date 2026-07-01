(function(){
  let mustCheckOut = false;
  let note = '';
  let noteTime = 0;

  function say(text, frames){
    note = text;
    noteTime = frames || 160;
  }

  function setupCounterFeature(){
    if(typeof zones === 'undefined') return;

    const exitZone = zones.find(z => z.type === 'exit');
    if(exitZone){
      exitZone.type = 'door';
      exitZone.text = 'Press E to leave the clothing store';
    }

    if(!zones.some(z => z.type === 'counter')){
      zones.push({name:'Counter', x:768, y:275, r:115, type:'counter', text:'Press E at the counter'});
    }

    if(typeof chooseOutfit === 'function' && !chooseOutfit.counterWrapped){
      const oldChoose = chooseOutfit;
      chooseOutfit = function(who, outfit){
        oldChoose(who, outfit);
        mustCheckOut = true;
        say('New outfit selected. We should stop by the counter first.');
      };
      chooseOutfit.counterWrapped = true;
    }

    if(typeof update === 'function' && !update.counterWrapped){
      const oldUpdate = update;
      update = function(){
        oldUpdate();
        if(noteTime > 0) noteTime--;
        if(!activeZone || !keys.e || menuOpen) return;

        if(activeZone.type === 'door'){
          if(mustCheckOut){
            say("Haha... I do not think they will let us leave yet.", 190);
          } else {
            location.href = 'shopping.html';
          }
        }

        if(activeZone.type === 'counter'){
          mustCheckOut = false;
          say('Lady: You both look wonderful. Happy Anniversary!', 190);
        }
      };
      update.counterWrapped = true;
    }

    if(typeof draw === 'function' && !draw.counterWrapped){
      const oldDraw = draw;
      draw = function(){
        oldDraw();
        if(noteTime <= 0 || !note) return;
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
      draw.counterWrapped = true;
    }
  }

  setupCounterFeature();
})();
