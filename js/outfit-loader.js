// Global outfit loader.
// Outfit 1 is the current/default sprite sheet.
// Supports her_atlas/him_atlas plus outfit2 through outfit9.
(function(){
  const originalSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  const originalOnload = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'onload');
  const convertedFlag = 'data:image/png;base64,';

  function isSpriteFile(path){
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

  function convertSpriteSheet(img){
    if(!img.complete || !img.naturalWidth || !img.naturalHeight) return null;

    const sourceW = img.naturalWidth / 4;
    const sourceH = img.naturalHeight / 4;
    const finalW = 384;
    const finalH = 512;
    const frameW = 96;
    const frameH = 128;

    const out = document.createElement('canvas');
    out.width = finalW;
    out.height = finalH;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = false;

    for(let row = 0; row < 4; row++){
      for(let col = 0; col < 4; col++){
        octx.drawImage(
          img,
          col * sourceW,
          row * sourceH,
          sourceW,
          sourceH,
          col * frameW,
          row * frameH,
          frameW,
          frameH
        );
      }
    }

    const imageData = octx.getImageData(0, 0, finalW, finalH);
    const d = imageData.data;
    for(let i = 0; i < d.length; i += 4){
      if(d[i] < 8 && d[i + 1] < 8 && d[i + 2] < 8){
        d[i + 3] = 0;
      }
    }
    octx.putImageData(imageData, 0, 0);

    return out.toDataURL('image/png');
  }

  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    get(){
      return originalSrc.get.call(this);
    },
    set(value){
      const requested = String(value);
      const finalValue = selectedSpritePath(requested);

      if(!isSpriteFile(finalValue) || finalValue.startsWith(convertedFlag)){
        originalSrc.set.call(this, finalValue);
        return;
      }

      const img = this;
      const userOnload = originalOnload.get.call(img);

      originalOnload.set.call(img, function(event){
        if(img.naturalWidth !== 384 || img.naturalHeight !== 512){
          const converted = convertSpriteSheet(img);
          if(converted){
            originalOnload.set.call(img, userOnload || null);
            originalSrc.set.call(img, converted);
            return;
          }
        }

        if(typeof userOnload === 'function') userOnload.call(img, event);
      });

      img.onerror = () => {
        img.onerror = null;
        originalOnload.set.call(img, userOnload || null);
        if(finalValue !== requested) originalSrc.set.call(img, requested);
      };

      originalSrc.set.call(this, finalValue);
    }
  });
})();
