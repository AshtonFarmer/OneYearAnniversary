// Keeps a missing seasonal map from stopping the whole page from loading.
// This makes image.decode() resolve even if a seasonal image is missing or still swapping.
(function(){
  if(!window.HTMLImageElement || !HTMLImageElement.prototype.decode) return;
  const originalDecode = HTMLImageElement.prototype.decode;

  HTMLImageElement.prototype.decode = function(){
    return originalDecode.call(this).catch(() => Promise.resolve());
  };
})();