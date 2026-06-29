// Global outfit loader.
// Outfit 1 is the current/default sprite sheet.
// Supports assets/sprites/her_outfit2.png through her_outfit9.png
// and assets/sprites/him_outfit2.png through him_outfit9.png.
(function(){
  const originalSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;

  function isSpriteSheet(path){
    return path.includes('assets/sprites/her_atlas.png') ||
      path.includes('assets/sprites/him_atlas.png') ||
      path.includes('assets/sprites/her_outfit') ||
      path.includes('assets/sprites/him_outfit');
  }

  function selectedSpritePath(originalPath){
    const isHer = originalPath.includes('assets/sprites/her_atlas.png');
    const isHim = originalPath.includes('assets/sprites/him_atlas.png');
    if(!isHer && !isHim) return originalPath;

    const who = isHer ? 'her' : 'him';
    const outfit = Number(localStorage.getItem(`${who}Outfit`) || 1);

    if(outfit <= 1) return originalPath;
    return `assets/sprites/${who}_outfit${outfit}.png`;
  }

  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    get(){
      return originalSrc.get.call(this);
    },
    set(value){
      const finalValue = selectedSpritePath(String(value));
      originalSrc.set.call(this, finalValue);

      if(finalValue !== value){
        this.onerror = () => {
          this.onerror = null;
          originalSrc.set.call(this, value);
        };
      }
    }
  });

  CanvasRenderingContext2D.prototype.drawImage = function(image, ...args){
    const src = image && image.src ? image.src : '';
    const isOldCrop = args.length === 8 && args[2] === 96 && args[3] === 128;

    if(isOldCrop && isSpriteSheet(src) && image.naturalWidth && image.naturalHeight && image.naturalWidth !== 384){
      const oldX = args[0];
      const oldY = args[1];
      const destX = args[4];
      const destY = args[5];
      const destW = args[6];
      const destH = args[7];

      const frame = Math.round(oldX / 96);
      const row = Math.round(oldY / 128);
      const cellW = image.naturalWidth / 4;
      const cellH = image.naturalHeight / 4;

      const cropX = cellW * 0.18;
      const cropY = cellH * 0.02;
      const cropW = cellW * 0.64;
      const cropH = cellH * 0.96;

      return originalDrawImage.call(
        this,
        image,
        frame * cellW + cropX,
        row * cellH + cropY,
        cropW,
        cropH,
        destX,
        destY,
        destW,
        destH
      );
    }

    return originalDrawImage.call(this, image, ...args);
  };
})();
