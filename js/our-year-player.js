// An inline memory player for the upper treehouse. Closing it returns to the
// same room and the same player positions; the ground map never changes.
(function(){
  'use strict';
  const Y=window.OUR_YEAR;
  let backdropPromise=null;
  function load(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Could not load this memory’s scenery.'));im.src=src;});}
  function backdrops(){if(!backdropPromise)backdropPromise=Promise.all(['neighborhood','mountains','festival'].map(async name=>[name,await load('assets/our-year/'+name+'.webp')])).then(entries=>Object.fromEntries(entries)).catch(error=>{backdropPromise=null;throw error;});return backdropPromise;}
  function create(options){
    const dialog=document.createElement('dialog');dialog.className='our-year-playdialog';dialog.setAttribute('aria-labelledby','inlineMemoryTitle');
    dialog.innerHTML='<header class="inline-heading"><div><span class="inline-eyebrow"></span><h2 id="inlineMemoryTitle"></h2></div><button type="button" class="inline-close" aria-label="Return to the game">Close memory ✕</button></header><div class="inline-layout"><section class="inline-play"><div class="inline-stage"><canvas width="960" height="570" aria-label="Interactive memory scene"></canvas><span class="inline-badge"></span></div><p class="inline-status" role="status" aria-live="polite"></p><div class="inline-controls"></div><p class="inline-kept" role="status" aria-live="polite"></p></section><aside><details class="film-keepsakes"><summary>Our photos &amp; keepsakes</summary><span class="inline-eyebrow">ONE OF OUR DAYS</span><p class="inline-story"></p><div class="inline-photos"></div></details></aside></div>';
    document.body.appendChild(dialog);
    const find=s=>dialog.querySelector(s),canvas=find('canvas');let activity=null,lastFrame=0,frame=0,request=0,focus=null;
    function pause(open){dispatchEvent(new CustomEvent('ouryearmodal',{detail:{open}}));}
    function stop(){cancelAnimationFrame(frame);if(activity)activity.dispose();activity=null;lastFrame=0;}
    function close(){request++;stop();dialog.close();pause(false);if(focus&&focus.isConnected)focus.focus();}
    find('.inline-close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
    function loop(now){if(!dialog.open||!activity)return;const dt=lastFrame?Math.min(.05,(now-lastFrame)/1000):0;lastFrame=now;if(!document.hidden){activity.update(dt);activity.draw();}frame=requestAnimationFrame(loop);}
    async function open(id){
      const m=Y.byId(id);if(!m)return;const ticket=++request;stop();focus=document.activeElement;find('h2').textContent=m.title;find('.inline-eyebrow').textContent=m.eyebrow;find('.inline-story').textContent=m.text;find('.inline-badge').textContent=m.eyebrow;find('.inline-kept').textContent='';find('.inline-photos').replaceChildren();m.photos.forEach(photo=>find('.inline-photos').appendChild(Y.photoElement(photo,m.title)));find('.inline-controls').replaceChildren();find('.inline-status').textContent='Opening this little piece of our year…';
      if(!dialog.open)dialog.showModal();pause(true);find('.inline-close').focus();
      try{
        const backgrounds=await backdrops();if(request!==ticket||!dialog.open)return;
        activity=window.OurYearActivities.create(m,{canvas,controls:find('.inline-controls'),images:options.images(),backdrops:backgrounds,status:t=>find('.inline-status').textContent=t,tone:options.tone,open,photo:index=>{const photo=find('.inline-photos').children[index];if(photo)photo.scrollIntoView({behavior:'smooth',block:'nearest'});},complete:(id,extra)=>{try{Y.complete(id,extra);find('.inline-kept').textContent='♥ Kept in our photo wall. Take as long as you like here.';}catch(error){find('.inline-kept').textContent='Played, but this browser could not save the memory: '+error.message;}}});
        lastFrame=0;frame=requestAnimationFrame(loop);
      }catch(error){find('.inline-status').textContent=error.message;const retry=document.createElement('button');retry.textContent='Try opening the memory again';retry.onclick=()=>open(id);find('.inline-controls').appendChild(retry);}
    }
    return {open,close,isOpen:()=>dialog.open,activate:()=>{if(activity)activity.activate();}};
  }
  window.OurYearPlayer={create};
})();
