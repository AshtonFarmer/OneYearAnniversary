(function(){
  'use strict';
  const nav=document.createElement('nav');nav.id='ourYearMallNav';nav.setAttribute('aria-label','Mall memories');
  const memory=document.createElement('button');memory.id='replayFirstYes';memory.type='button';memory.textContent='Our first yes ⚡';memory.onclick=()=>{if(typeof startSpecialPhotoScene!=='function')return;if(typeof closeShop==='function')closeShop();startSpecialPhotoScene();};nav.appendChild(memory);
  [['Our Little World ↗','memory-world.html']].forEach(([text,url])=>{const a=document.createElement('a');a.textContent=text;a.href=url;nav.appendChild(a);});document.body.appendChild(nav);
  if(new URLSearchParams(location.search).get('memory')==='first-yes'){
    const hint=document.createElement('div');hint.className='first-yes-invitation';hint.textContent='Our photo booth, the bubbles, and the necklace. Press “Our first yes ⚡” to replay it.';document.body.appendChild(hint);setTimeout(()=>hint.remove(),11000);
  }
})();
