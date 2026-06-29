// Global sprite direction/frame polish.
// The new transparent sheets are 4 columns by 4 rows:
// row 0 = down/front, row 1 = left, row 2 = up/back, row 3 = right.
(function(){
  try{
    if(typeof players === 'undefined') return;

    Object.values(players).forEach(player => {
      if(!player) return;
      player.rows = {down:0, up:2, left:1, right:3};
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
