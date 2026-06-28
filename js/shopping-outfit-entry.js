// Sends the Outfit Change shop into the new changing room map.
(function(){
  const originalOpenShop = window.openShop;

  window.openShop = function(shop){
    if(shop && shop.name && shop.name.includes('Outfit Change')){
      location.href = 'changing-room.html';
      return;
    }

    if(typeof originalOpenShop === 'function'){
      originalOpenShop(shop);
    }
  };
})();
