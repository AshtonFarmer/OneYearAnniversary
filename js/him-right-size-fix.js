// Fix: his right-facing sprite looks smaller because that row has extra empty space.
// This only boosts HIS right-facing draw size and keeps his feet anchored.

const originalHimRightSizeDrawSprite = drawSprite;

drawSprite = function(p){
  if(p === players.him && p.dir === 'right'){
    const sw = 96;
    const sh = 128;
    const row = p.rows[p.dir];

    // Only the right-facing him sprite gets a small boost.
    const fixedScale = p.scale * 1.12;
    const dw = Math.round(sw * fixedScale);
    const dh = Math.round(sh * fixedScale);

    // Keep feet planted while the sprite grows upward.
    const drawX = Math.round(p.x - camera.x - dw / 2 - 2);
    const drawY = Math.round(p.y - camera.y - dh + 10);

    ctx.drawImage(p.img, p.frame * sw, row * sh, sw, sh, drawX, drawY, dw, dh);
    return;
  }

  originalHimRightSizeDrawSprite(p);
};
