(function () {
  'use strict';
  const Y=window.OUR_YEAR,F=window.OurYearFilms,$=id=>document.getElementById(id);
  const images={},costumes={},backdrops={},query=new URLSearchParams(location.search);
  let active=null,index=0,last=0,ready=false,filter='all',sound=false,audio=null,advance=false;
  function load(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('A character could not load. Please reload to try again.'));im.src=src;});}
  function tone(n){if(!sound||!audio)return;try{const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime;o.type='sine';o.frequency.value=220*Math.pow(2,n/12);g.gain.setValueAtTime(.035,now);g.gain.exponentialRampToValueAtTime(.001,now+.65);o.connect(g);g.connect(audio.destination);o.start(now);o.stop(now+.66);}catch(e){}}
  function open(id,scroll=false){
    if(!ready)return;
    index=Math.max(0,Y.memories.findIndex(m=>m.id===id));const m=Y.memories[index];if(active)active.dispose();advance=false;
    $('filmTitle').textContent=m.title;$('filmEyebrow').textContent=m.eyebrow;$('filmNumber').textContent=String(index+1).padStart(2,'0')+' / '+Y.memories.length;$('filmStory').textContent=m.text;const place=window.AdventurePlaces.memoryPlaces[m.id];$('enterPlace').href=place?'memory-adventure.html?place='+place:'shopping.html?memory=first-yes';$('filmPhotos').replaceChildren();
    m.photos.forEach(photo=>$('filmPhotos').appendChild(Y.photoElement(photo,m.title)));
    active=window.OurYearActivities.create(m,{canvas:$('filmScreen'),controls:$('filmControls'),images,backdrops,status:t=>$('filmStatus').textContent=t,tone,open:id=>open(id,true),photo:()=>{const d=document.querySelector('.theater-keepsakes');d.open=true;d.scrollIntoView({behavior:'smooth',block:'nearest'});},complete:(id,extra)=>{try{Y.complete(id,extra);}catch(e){$('filmStatus').textContent='The film finished, but this browser could not save it.';}advance=$('watchAll').checked;}});
    document.querySelectorAll('[data-film]').forEach(b=>{const on=b.dataset.film===m.id;b.setAttribute('aria-pressed',String(on));});
    const url=new URL(location.href);url.searchParams.set('film',m.id);history.replaceState(null,'',url);if(scroll)document.querySelector('.theater-screen').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function grid(){
    $('filmGrid').replaceChildren();Y.memories.filter(m=>filter==='all'||m.area===filter).forEach(m=>{
      const i=Y.memories.indexOf(m),b=document.createElement('button');b.type='button';b.className='film-card';b.dataset.film=m.id;b.setAttribute('aria-pressed',String(index===i));b.setAttribute('aria-label','Watch '+m.title);
      const art=document.createElement('canvas');art.width=480;art.height=285;const full=document.createElement('canvas');full.width=960;full.height=570;const preview=window.OurYearCinema.renderer(full,{images:m.id==='addams'&&costumes.addams?costumes.addams:images,backdrops});const shots=F.get(m.id),shot=shots[Math.min(2,shots.length-1)];preview.render(m.id,shot.start+shot.duration*.57,{thumbnail:true,reducedMotion:true});art.getContext('2d').drawImage(full,0,0,480,285);b.appendChild(art);
      const meta=document.createElement('span');meta.className='film-card-meta';const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0')+' / '+m.eyebrow;const duration=document.createElement('span');const d=F.duration(m.id);duration.textContent=Math.floor(d/60)+':'+String(d%60).padStart(2,'0');meta.append(n,duration);
      const title=document.createElement('strong');title.textContent=m.title;const play=document.createElement('span');play.className='film-card-play';play.textContent='▶';b.append(meta,title,play);b.onclick=()=>open(m.id,true);$('filmGrid').appendChild(b);
    });
  }
  const filters=[['all','The whole year'],['home','Home'],['birmingham','Birmingham nights'],['mountains','The mountains'],['festival','Celebrations'],['autumn','Autumn'],['mall','Our first yes']];
  filters.forEach(([id,label])=>{const b=document.createElement('button');b.textContent=label;b.type='button';b.setAttribute('aria-pressed',String(filter===id));b.onclick=()=>{filter=id;Array.from($('filmFilters').children).forEach(el=>el.setAttribute('aria-pressed',String(el===b)));grid();};$('filmFilters').appendChild(b);});
  $('nextFilm').onclick=()=>open(Y.memories[(index+1)%Y.memories.length].id,false);
  $('previousFilm').onclick=()=>open(Y.memories[(index+Y.memories.length-1)%Y.memories.length].id,false);
  $('sound').onclick=()=>{try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();audio.resume();sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').textContent=sound?'Sound on ♫':'Sound off ♫';tone(4);}catch(e){$('filmStatus').textContent='Sound is unavailable in this browser. The films can still play.';}};
  addEventListener('keydown',e=>{if(!active||['INPUT','SELECT','TEXTAREA','BUTTON','SUMMARY'].includes(e.target.tagName))return;if(e.code==='Space'||e.key.toLowerCase()==='e'){e.preventDefault();if(!e.repeat)active.activate();}});
  document.addEventListener('visibilitychange',()=>{last=0;});
  addEventListener('pagehide',()=>{if(active)active.dispose();});
  function loop(now){const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(active&&!document.hidden){active.update(dt);active.draw();if(advance){advance=false;if(index<Y.memories.length-1)open(Y.memories[index+1].id);else{$('watchAll').checked=false;$('filmStatus').textContent='Our whole year, kept together. ♥';}}}requestAnimationFrame(loop);}
  async function init(){try{
    const loaded=await Promise.all(['him','her'].map(async who=>{let n=Number(localStorage.getItem(who+'Outfit'))||1;if(n<1||n>11||!Number.isInteger(n))n=1;return[who,await load('assets/sprites/'+who+(n===1?'_atlas':'_outfit'+n)+'.png')];}));loaded.forEach(([who,im])=>images[who]=im);
    try{const [him,her]=await Promise.all([window.SharedWardrobe.render({who:'him',kind:'suit',color:'#171b2e',trim:'#b5c9d2',pattern:'stripes'},false),window.SharedWardrobe.render({who:'her',kind:'dress',color:'#17131e',trim:'#9b7fa7'},false)]);costumes.addams={him,her};}catch(e){/* The player reports a costume failure; gallery still opens. */}
    ready=true;$('filmLoading').hidden=true;grid();open(query.get('film')||'homecoming');requestAnimationFrame(loop);
  }catch(e){$('filmLoading').textContent=e.message;}}
  init();
  // Read-only playback state also supports checking every film end-to-end.
  window.memoryTheater={open,getState:()=>({ready,id:Y.memories[index].id,activity:active&&active.getState()}),seek:t=>active&&active.seek&&active.seek(t)};
})();
