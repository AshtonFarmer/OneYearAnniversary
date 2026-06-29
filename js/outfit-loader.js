// Global outfit loader.
// Outfit 1 is the current/default sprite sheet.
// Supports assets/sprites/her_outfit2.png through her_outfit9.png
// and assets/sprites/him_outfit2.png through him_outfit9.png.
(function(){
  const originalSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');

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
})();
