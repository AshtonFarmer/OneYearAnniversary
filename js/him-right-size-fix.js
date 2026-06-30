// Global sprite direction/frame polish.
// Her sprite sheet uses: row 0 down/front, row 1 left, row 2 up/back, row 3 right.
// His sprite sheet has the left-facing frames on row 3, while row 2 is the back row.
(function(){
  try{
    if(typeof players === 'undefined') return;

    Object.entries(players).forEach(([key, player]) => {
      if(!player) return;

      if(key === 'him' || player.name === 'Me'){
        player.rows = {down:0, up:2, left:3, right:1};
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
