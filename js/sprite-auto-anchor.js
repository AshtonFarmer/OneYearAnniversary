// Experimental in-game sprite auto-anchor.
// Does NOT touch outfit menu previews.
// It finds the visible pixels inside each frame, crops empty space, and draws by bottom-center feet.
(function(){
  try{
    if(typeof drawSprite !== 'function' || typeof players === 'undefined') return;

    const fallbackDrawSprite = drawSprite;
    const boundsCache = new Map();

    function getBounds(img, sx, sy, sw, sh){
      const key = (img.currentSrc || img.src || 'img') + ':' + sx + ':' + sy + ':' + sw + ':' + sh;
      if(boundsCache.has(key)) return boundsCache.get(key);

      try{
        const c = document.createElement('canvas');
        c.width = sw;
        c.height = sh;
        const cctx = c.getContext('2d', {willReadFrequently:true});
        cctx.clearRect(0,0,sw,sh);
        cctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        const data = cctx.getImageData(0,0,sw,sh).data;

        let minX = sw, minY = sh, maxX = -1, maxY = -1;
        for(let y=0;y<sh;y++){
          for(let x=0;x<sw;x++){
            const a = data[(y * sw + x) * 4 + 3];
            if(a > 10){
              if(x < minX) minX = x;
              if(y < minY) minY = y;
              if(x > maxX) maxX = x;
              if(y > maxY) maxY = y;
            }
          }
        }

        if(maxX < 0){
          const empty = {x:0,y:0,w:sw,h:sh};
          boundsCache.set(key, empty);
          return empty;
        }

        const pad = 2;
        const b = {
          x: Math.max(0, minX - pad),
          y: Math.max(0, minY - pad),
          w: Math.min(sw, maxX - minX + 1 + pad * 2),
          h: Math.min(sh, maxY - minY + 1 + pad * 2)
        };
        boundsCache.set(key, b);
        return b;
      } catch(e){
        const fallback = {x:0,y:0,w:sw,h:sh, failed:true};
        boundsCache.set(key, fallback);
        return fallback;
      }
    }

    drawSprite = function(player){
      try{
        if(!player || !player.img || !player.img.complete || !player.img.naturalWidth){
          fallbackDrawSprite(player);
          return;
        }

        const dirs = ['down','left','up','right'];
        let dir = player.dir || 'down';
        if(player.spinTimer > 0){
          dir = dirs[Math.floor(player.spinTimer / 5) % dirs.length];
          player.spinTimer--;
        }

        const cols = 4;
        const rows = 4;
        const sw = Math.round(player.img.naturalWidth / cols);
        const sh = Math.round(player.img.naturalHeight / rows);
        if(!sw || !sh){
          fallbackDrawSprite(player);
          return;
        }

        const row = (player.rows && player.rows[dir] !== undefined) ? player.rows[dir] : 0;
        const frame = player.frame || 0;
        const sx = frame * sw;
        const sy = row * sh;
        const b = getBounds(player.img, sx, sy, sw, sh);
        if(b.failed){
          fallbackDrawSprite(player);
          return;
        }

        // Keep roughly the old on-map size, but crop empty transparent padding first.
        const targetH = Math.round(128 * (player.scale || 1));
        const targetW = Math.round(b.w * (targetH / b.h));
        const drawX = Math.round(player.x - camera.x - targetW / 2);
        const drawY = Math.round(player.y - camera.y - targetH + 10);

        const isHim = player.key === 'him' || player.name === 'Me' || player === players.him;
        const mirrorLeft = isHim && dir === 'left';

        if(mirrorLeft){
          ctx.save();
          ctx.translate(drawX + targetW, drawY);
          ctx.scale(-1, 1);
          ctx.drawImage(
            player.img,
            sx + b.x, sy + b.y, b.w, b.h,
            0, 0, targetW, targetH
          );
          ctx.restore();
        } else {
          ctx.drawImage(
            player.img,
            sx + b.x, sy + b.y, b.w, b.h,
            drawX, drawY, targetW, targetH
          );
        }
      } catch(e){
        fallbackDrawSprite(player);
      }
    };
  } catch(e){
    console.warn('sprite-auto-anchor failed', e);
  }
})();
