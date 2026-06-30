// Global sprite direction/frame polish.
// Her sprite sheet uses: row 0 down/front, row 1 left, row 2 up/back, row 3 right.
// His sprite sheet is different, so only his rows are mapped separately here.
(function(){
  try{
    if(typeof players === 'undefined') return;

    Object.entries(players).forEach(([key, player]) => {
      if(!player) return;

      if(key === 'him' || player.name === 'Me'){
        player.rows = {down:0, up:1, left:2, right:3};
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
  } catch(e){}
})();
