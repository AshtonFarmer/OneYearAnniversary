// Global outfit loader.
// Keep outfit 1 as the current/default sprite sheets.
// Add the new full sprite sheets here when they are ready:
// assets/sprites/her_outfit2.png, her_outfit3.png, her_outfit4.png
// assets/sprites/him_outfit2.png, him_outfit3.png, him_outfit4.png
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
