// Global sprite direction/frame polish.
// Her sprite sheet uses: row 0 down/front, row 1 left, row 2 up/back, row 3 right.
// His sheet is being handled separately, and ONLY his directions are changed here.
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

    if(typeof drawSprite === 'function'){
      const originalDrawSpriteForHimLeft = drawSprite;
      drawSprite = function(player){
        const isHim = player && (player === players.him || player.name === 'Me');

        if(isHim && player.dir === 'left'){
          const sw = 96;
          const sh = 128;
          const row = player.rows.right;
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
  } catch(e){}
})();
