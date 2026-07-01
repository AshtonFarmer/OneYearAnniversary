// Adds the climb-up trigger inside the silo.
// Walk into the upper stair area and press E to enter the cozy top room.
(function(){
  try{
    if(typeof update !== 'function' || typeof draw !== 'function' || typeof players === 'undefined') return;

    const stairsUpZone = {
      name:'Stairs Up',
      x:448,
      y:30,
      w:88,
      h:74,
      text:'Press E to climb up to the cozy silo top'
    };

    let previousE = false;

    function inRect(px, py, r){
      return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    }

    function touchingStairs(){
      if(typeof mode !== 'undefined' && mode !== 'silo') return false;
      return inRect(players.her.x, players.her.y, stairsUpZone) || inRect(players.him.x, players.him.y, stairsUpZone);
    }

    const originalUpdateForSiloTopEntry = update;
    update = function(){
      originalUpdateForSiloTopEntry();

      if(touchingStairs()){
        const prompt = document.getElementById('prompt');
        if(prompt){
          prompt.style.display = 'block';
          prompt.textContent = stairsUpZone.text;
        }

        const justPressedE = keys.e && !previousE;
        if(justPressedE){
          location.href = 'top-silo.html';
        }
      }

      previousE = !!keys.e;
    };

    const originalDrawForSiloTopEntry = draw;
    draw = function(){
      originalDrawForSiloTopEntry();
      if(typeof debugMode === 'undefined' || !debugMode || typeof camera === 'undefined') return;
      if(typeof mode !== 'undefined' && mode !== 'silo') return;

      ctx.save();
      ctx.fillStyle = 'rgba(255,225,139,.30)';
      ctx.strokeStyle = '#ffe18b';
      ctx.lineWidth = 2;
      ctx.fillRect(stairsUpZone.x - camera.x, stairsUpZone.y - camera.y, stairsUpZone.w, stairsUpZone.h);
      ctx.strokeRect(stairsUpZone.x - camera.x, stairsUpZone.y - camera.y, stairsUpZone.w, stairsUpZone.h);
      ctx.fillStyle = '#fff1c8';
      ctx.font = '14px monospace';
      ctx.fillText('stairs up', stairsUpZone.x - camera.x + 4, stairsUpZone.y - camera.y - 8);
      ctx.restore();
    };
  } catch(e){
    console.warn('silo-top-entry failed', e);
  }
})();
