// Fix: his right-facing sprite looked smaller than his other directions.
// The first fix was too strong, so this uses a tiny correction only.

const originalHimRightSizeDrawSprite = drawSprite;

drawSprite = function(p){
  if(p === players.him && p.dir === 'right'){
    const sw = 96;
    const sh = 128;
    const row = p.rows[p.dir];

    // Tiny boost only. 1.12 was way too much.
    const fixedScale = p.scale * 1.04;
    const dw = Math.round(sw * fixedScale);
    const dh = Math.round(sh * fixedScale);

    // Keep feet planted while the sprite grows upward a little.
    const drawX = Math.round(p.x - camera.x - dw / 2);
    const drawY = Math.round(p.y - camera.y - dh + 10);

    ctx.drawImage(p.img, p.frame * sw, row * sh, sw, sh, drawX, drawY, dw, dh);
    return;
  }

  originalHimRightSizeDrawSprite(p);
};
