// Final tweaks: reset tree carving once for testing, allow manual reset near tree, and make skip count easier to see.

if(localStorage.getItem('cherryLakeTreeResetV1') !== 'true'){
  localStorage.removeItem('cherryLakeInitialsCarved');
  localStorage.setItem('cherryLakeTreeResetV1','true');
  if(typeof carvedInitials !== 'undefined') carvedInitials = false;
}

let finalTweaksLastR = false;
const originalFinalTweaksUpdate = update;
update = function(){
  originalFinalTweaksUpdate();

  if(typeof initialsTreeBox !== 'undefined' && typeof carvedInitials !== 'undefined'){
    const nearTree = typeof nearDateBox === 'function' && nearDateBox(initialsTreeBox);
    const prompt = document.getElementById('prompt');

    if(nearTree && carvedInitials && !dateActivity){
      prompt.style.display = 'block';
      prompt.textContent = 'A ❤️ T is carved here forever  •  Press R to reset test';
    }

    if(keys.r && !finalTweaksLastR && nearTree && carvedInitials){
      localStorage.removeItem('cherryLakeInitialsCarved');
      carvedInitials = false;
      dateActivityCooldown = 20;
      if(prompt){
        prompt.style.display = 'block';
        prompt.textContent = 'Tree carving reset. Press E to carve again';
      }
    }
  }

  finalTweaksLastR = !!keys.r;
};

drawSkipMessage = function(){
  if(typeof skipMessageTimer === 'undefined' || skipMessageTimer <= 0 || !skipMessage) return;

  const pop = Math.sin(skipMessageTimer / 8) * 2;

  ctx.save();
  ctx.globalAlpha = Math.min(1,skipMessageTimer/25);
  ctx.textAlign = 'center';
  ctx.font = `${Math.round(36 + pop)}px monospace`;
  ctx.lineWidth = 9;
  ctx.strokeStyle = '#241820';
  ctx.fillStyle = '#fff1a8';
  ctx.shadowColor = '#ffd983';
  ctx.shadowBlur = 14;
  ctx.strokeText(skipMessage,canvas.width/2,110);
  ctx.fillText(skipMessage,canvas.width/2,110);

  ctx.font = '16px monospace';
  ctx.lineWidth = 5;
  ctx.shadowBlur = 7;
  ctx.strokeText(`Best: ${bestSkips}`,canvas.width/2,139);
  ctx.fillText(`Best: ${bestSkips}`,canvas.width/2,139);
  ctx.restore();
};
