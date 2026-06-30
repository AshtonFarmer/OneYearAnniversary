// Global sprite direction/frame polish.
// The new transparent sheets are 4 columns by 4 rows.
// Walking left was using the wrong side row, so this normalizes it everywhere.
(function(){
  try{
    if(typeof players === 'undefined') return;

    Object.values(players).forEach(player => {
      if(!player) return;
      player.rows = {down:0, up:2, left:3, right:1};
      player.frames = {
        down:[0,1,2,3],
        up:[0,1,2,3],
        left:[0,1,2,3],
        right:[0,1,2,3]
      };
      player.cols = 4;
    });
  } catch(e){}
})();
