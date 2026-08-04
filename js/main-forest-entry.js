// Configurable entrance for the automatic forest-swing cutscene.
// Move only these coordinates when the final home-map doorway is chosen.
(function(){
  'use strict';

  if(typeof locs === 'undefined' || typeof players === 'undefined') return;

  const forestEntrance = {
    x:1470,
    y:675,
    r:72
  };

  locs.push({
    name:'Forest Trail',
    x:forestEntrance.x,
    y:forestEntrance.y,
    r:forestEntrance.r,
    page:'forest-swing.html',
    text:'Press E to enter the forest trail 🌲'
  });

  // Returning from the cutscene puts both players back beside the same trail.
  // Their normal outfit choices reload through outfit-loader.js as usual.
  try{
    if(sessionStorage.getItem('forestSwingReturn') === '1'){
      sessionStorage.removeItem('forestSwingReturn');
      players.her.x = forestEntrance.x - 52;
      players.her.y = forestEntrance.y + 7;
      players.her.dir = 'left';
      players.her.frame = 0;
      players.him.x = forestEntrance.x - 8;
      players.him.y = forestEntrance.y + 7;
      players.him.dir = 'left';
      players.him.frame = 0;
    }
  } catch(error){}
})();
