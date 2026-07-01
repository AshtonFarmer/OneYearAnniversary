// Clean 1024x1024 sprite sheet renderer.
// Uses 4x4 sheets with exact 256x256 cells and anchors sprites by their feet.
(function(){
  try{
    if(typeof players === 'undefined' || typeof drawSprite !== 'function') return;

    Object.values(players).forEach(player => {
      if(!player) return;
      player.cols = 4;
      player.rows = {down:0, left:1, up:2, right:3};
      player.frames = {
        down:[0,1,2,3],
        left:[0,1,2,3],
        up:[0,1,2,3],
        right:[0,1,2,3]
      };
      player.scale = player.scale || 1;
    });

    window.drawSprite = function(player){
      const cell = 256;
      const dirs = ['down','left','up','right'];
      let dir = player.dir || 'down';

      if(player.spinTimer > 0){
        dir = dirs[Math.floor(player.spinTimer / 5) % dirs.length];
        player.spinTimer--;
      }

      const row = player.rows[dir] ?? 0;
      const frame = player.frame || 0;

      // Draw the whole 256x256 cell, but scale it down and anchor by bottom center.
      // This keeps feet lined up even when outfits have different hair/dress sizes.
      const renderSize = Math.round(128 * (player.scale || 1));
      const drawX = Math.round(player.x - camera.x - renderSize / 2);
      const drawY = Math.round(player.y - camera.y - renderSize + 10);

      ctx.drawImage(
        player.img,
        frame * cell,
        row * cell,
        cell,
        cell,
        drawX,
        drawY,
        renderSize,
        renderSize
      );
    };

    if(typeof drawOutfitPreview === 'function'){
      window.drawOutfitPreview = function(preview, who, outfit){
        const pctx = preview.getContext('2d');
        pctx.imageSmoothingEnabled = false;
        pctx.clearRect(0,0,preview.width,preview.height);
        pctx.fillStyle = 'rgba(0,0,0,.18)';
        pctx.fillRect(0,0,preview.width,preview.height);

        const img = new Image();
        img.onload = () => {
          pctx.clearRect(0,0,preview.width,preview.height);
          pctx.fillStyle = 'rgba(0,0,0,.18)';
          pctx.fillRect(0,0,preview.width,preview.height);
          pctx.drawImage(img, 0, 0, 256, 256, 0, 0, 72, 96);
        };
        img.onerror = () => {
          pctx.fillStyle = '#ffe18b';
          pctx.font = '10px monospace';
          pctx.textAlign = 'center';
          pctx.fillText('sprite', 36, 42);
          pctx.fillText('needed', 36, 56);
        };
        img.src = outfitPath(who, outfit);
      };
    }
  } catch(e){
    console.warn('sprite-clean-renderer failed', e);
  }
})();
