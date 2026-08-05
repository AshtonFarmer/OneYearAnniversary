// Entrance for the automatic forest-swing cutscene.
// This rectangle uses the exact home-map coordinates selected in debug mode.
(function(){
  'use strict';

  if(typeof locs === 'undefined' || typeof players === 'undefined') return;

  const forestEntrance = {
    x:1453,
    y:248,
    w:80,
    h:60
  };

  // The original location system uses circles. Add rectangle-aware distance
  // support so this doorway activates only inside the selected 80 x 60 box.
  if(typeof distPlayerLoc === 'function' && !window.__forestRectangleLocations){
    const originalDistPlayerLoc = distPlayerLoc;

    window.__forestRectangleLocations = true;
    window.distPlayerLoc = function(player,location){
      if(location && location.bounds){
        const bounds = location.bounds;
        const inside =
          player.x >= bounds.x &&
          player.x <= bounds.x + bounds.w &&
          player.y >= bounds.y &&
          player.y <= bounds.y + bounds.h;

        if(inside) return -1;

        const nearestX = Math.max(bounds.x,Math.min(player.x,bounds.x+bounds.w));
        const nearestY = Math.max(bounds.y,Math.min(player.y,bounds.y+bounds.h));
        return Math.hypot(player.x-nearestX,player.y-nearestY);
      }

      return originalDistPlayerLoc(player,location);
    };
  }

  locs.push({
    name:'Forest Trail',
    x:forestEntrance.x + forestEntrance.w/2,
    y:forestEntrance.y + forestEntrance.h/2,
    r:0,
    bounds:{...forestEntrance},
    page:'forest-swing.html',
    text:'Press E to enter the forest trail 🌲'
  });

  // Show the exact rectangle when G debug mode is enabled.
  if(typeof drawDebugZones === 'function' && !window.__forestRectangleDebug){
    const originalDrawDebugZones = drawDebugZones;

    window.__forestRectangleDebug = true;
    window.drawDebugZones = function(){
      originalDrawDebugZones();
      if(typeof debugMode === 'undefined' || !debugMode) return;

      ctx.save();
      drawDebugRect(forestEntrance,'rgba(0,255,90,0.28)');
      drawDebugText('Forest Trail',forestEntrance.x,forestEntrance.y);
      ctx.restore();
    };
  }

  // Returning from the cutscene puts both players just left of the doorway,
  // facing it, so either character can immediately walk back through.
  try{
    if(sessionStorage.getItem('forestSwingReturn') === '1'){
      sessionStorage.removeItem('forestSwingReturn');

      players.her.x = forestEntrance.x - 28;
      players.her.y = forestEntrance.y + 18;
      players.her.dir = 'right';
      players.her.frame = 0;

      players.him.x = forestEntrance.x - 28;
      players.him.y = forestEntrance.y + 44;
      players.him.dir = 'right';
      players.him.frame = 0;
    }
  } catch(error){}
})();
