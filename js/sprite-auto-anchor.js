// Legacy locations share the same silhouette and facing rules as the memory maps.
(function(){
  if(typeof drawSprite!=='function'||typeof players==='undefined')return;
  const fallback=drawSprite;
  drawSprite=function(player){
    if(!player?.img?.complete){fallback(player);return;}
    let direction=player.dir||'down';
    if(player.spinTimer>0){
      direction=['down','left','up','right'][Math.floor(player.spinTimer/5)%4];
      player.spinTimer--;
    }
    if(!window.WalkingSprites.draw(ctx,player.img,direction,player.frame,
      Math.round(player.x-camera.x),Math.round(player.y-camera.y+10),Math.round(128*(player.scale||1))))fallback(player);
  };
})();
