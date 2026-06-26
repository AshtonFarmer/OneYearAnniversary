// Fix for his right-facing frames.
// The right row has extra empty padding, so draw the non-empty part at normal height.

const originalHimRightSizeDrawSprite = drawSprite;
const himBoundsCache = new Map();

function himBounds(img, sx, sy, sw, sh){
  const key = sx + ':' + sy;
  if(himBoundsCache.has(key)) return himBoundsCache.get(key);

  const off = document.createElement('canvas');
  off.width = sw;
  off.height = sh;
  const c = off.getContext('2d');
  c.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  const data = c.getImageData(0,0,sw,sh).data;

  let minX = sw, minY = sh, maxX = -1, maxY = -1;
  for(let y=0;y<sh;y++){
    for(let x=0;x<sw;x++){
      if(data[(y*sw+x)*4+3] > 10){
        minX = Math.min(minX,x);
        minY = Math.min(minY,y);
        maxX = Math.max(maxX,x);
        maxY = Math.max(maxY,y);
      }
    }
  }

  const b = maxX < 0 ? {x:0,y:0,w:sw,h:sh} : {x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
  himBoundsCache.set(key,b);
  return b;
}

function himNormalHeight(p, sw, sh){
  let h = 0;
  const row = p.rows.down;
  for(let f=0; f<4; f++){
    h = Math.max(h, himBounds(p.img, f*sw, row*sh, sw, sh).h);
  }
  return h || sh;
}

drawSprite = function(p){
  if(p === players.him && p.dir === 'right'){
    try{
      const sw = 96;
      const sh = 128;
      const sx = p.frame * sw;
      const sy = p.rows.right * sh;
      const b = himBounds(p.img, sx, sy, sw, sh);
      const dh = himNormalHeight(p, sw, sh) * p.scale;
      const dw = b.w * (dh / b.h);
      const dx = Math.round(p.x - camera.x - dw/2);
      const dy = Math.round(p.y - camera.y - dh + 4);

      ctx.drawImage(p.img, sx+b.x, sy+b.y, b.w, b.h, dx, dy, dw, dh);
      return;
    } catch(e){
      originalHimRightSizeDrawSprite(p);
      return;
    }
  }

  originalHimRightSizeDrawSprite(p);
};
