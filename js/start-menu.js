// Interactive title screen for One Year Together.
(function(){
  'use strict';
  try{
    const chunks=window.__ONE_YEAR_MENU_BG_CHUNKS||[];
    if(chunks.length){
      const url='data:image/webp;base64,'+chunks.join('');
      document.documentElement.style.setProperty('--start-menu-bg',`url("${url}")`);
      window.__ONE_YEAR_MENU_BG_CHUNKS=[];
    }

    const menu=document.getElementById('start-menu');
    if(!menu)return;
    const stage=menu.querySelector('.start-menu-stage');
    const dialogWrap=menu.querySelector('.start-menu-dialog-backdrop');
    const dialog=menu.querySelector('.start-menu-dialog');
    const dialogTitle=menu.querySelector('[data-dialog-title]');
    const dialogBody=menu.querySelector('[data-dialog-body]');
    const closeButton=menu.querySelector('.start-menu-dialog-close');
    const buttons=[...menu.querySelectorAll('.start-menu-hit')];
    let currentIndex=0;
    let hoverAudio=null;

    function audioContext(){
      try{
        const AC=window.AudioContext||window.webkitAudioContext;
        if(!AC)return null;
        if(!hoverAudio)hoverAudio=new AC();
        if(hoverAudio.state==='suspended')hoverAudio.resume().catch(()=>{});
        return hoverAudio;
      }catch(e){return null;}
    }

    function tone(kind){
      const ac=audioContext();
      if(!ac)return;
      try{
        const now=ac.currentTime;
        const notes=kind==='click'?[[392,0,.05],[587,.055,.08]]:[[523,0,.035]];
        notes.forEach(([hz,delay,duration])=>{
          const osc=ac.createOscillator(),gain=ac.createGain();
          osc.type='square';osc.frequency.setValueAtTime(hz,now+delay);
          gain.gain.setValueAtTime(.0001,now+delay);
          gain.gain.exponentialRampToValueAtTime(.025,now+delay+.008);
          gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);
          osc.connect(gain).connect(ac.destination);osc.start(now+delay);osc.stop(now+delay+duration+.01);
        });
      }catch(e){}
    }

    function select(index,focus=true){
      currentIndex=(index+buttons.length)%buttons.length;
      buttons.forEach((button,i)=>button.classList.toggle('is-selected',i===currentIndex));
      if(focus)buttons[currentIndex].focus({preventScroll:true});
    }

    function gameCanvas(){return document.getElementById('game');}

    function showMenu(){
      menu.classList.remove('is-leaving');
      menu.setAttribute('aria-hidden','false');
      document.body.classList.add('start-menu-open');
      const canvas=gameCanvas();if(canvas)canvas.style.pointerEvents='none';
      setTimeout(()=>select(currentIndex,true),60);
    }

    function hideMenu(mode){
      tone('click');
      if(mode==='start'){
        try{sessionStorage.removeItem('wishPoolPhase3Session');}catch(e){}
        try{localStorage.setItem('oneYearHasPlayed','1');}catch(e){}
        try{window.WishPoolCoordinator&&window.WishPoolCoordinator.stopAll();}catch(e){}
      }
      menu.classList.add('is-leaving');
      menu.setAttribute('aria-hidden','true');
      document.body.classList.remove('start-menu-open');
      const canvas=gameCanvas();if(canvas)canvas.style.pointerEvents='auto';
      window.dispatchEvent(new CustomEvent('one-year-game-start',{detail:{mode}}));
    }

    function progressData(){
      let wishes=0,secretsFound=0,secretsTotal=27,effects=window.WISH_POOL_MINIMUM_INDIVIDUAL_EFFECTS||1050;
      try{wishes=(window.WishMemory&&window.WishMemory.state&&window.WishMemory.state.totalWishes)||0;}catch(e){}
      try{
        const p=window.WishPhase4&&window.WishPhase4.progress;
        if(p){secretsFound=p.found||0;secretsTotal=p.total||secretsTotal;}
        else if(window.WishSecrets){const q=window.WishSecrets.progress;secretsFound=q.found||0;secretsTotal=q.total||secretsTotal;}
      }catch(e){}
      return{wishes,secretsFound,secretsTotal,effects};
    }

    function openDialog(title,html){
      dialogTitle.textContent=title;
      dialogBody.innerHTML=html;
      dialogWrap.classList.add('is-open');
      dialogWrap.setAttribute('aria-hidden','false');
      closeButton.focus({preventScroll:true});
    }

    function closeDialog(){
      dialogWrap.classList.remove('is-open');
      dialogWrap.setAttribute('aria-hidden','true');
      select(currentIndex,true);
    }

    function memories(){
      const p=progressData();
      let recent=[];
      try{recent=(window.WishMemory&&window.WishMemory.history||[]).slice(-3).reverse();}catch(e){}
      const recentHtml=recent.length?recent.map((item,i)=>`<p><strong>${i+1}.</strong> ${escapeHtml(item.original||item.expanded||'A remembered wish')}</p>`).join(''):'<p>No wishes have been made in this session yet.</p>';
      openDialog('Memories',`
        <div class="start-menu-stat"><span>Wishes made this session</span><strong>${p.wishes}</strong></div>
        <div class="start-menu-stat"><span>Secrets discovered</span><strong>${p.secretsFound} / ${p.secretsTotal}</strong></div>
        <div class="start-menu-stat"><span>Individual wish effects</span><strong>${p.effects}+</strong></div>
        <h3>Recent wishes</h3>${recentHtml}
        <div class="start-menu-option-grid"><button class="start-menu-option" data-panel-action="secret-journal">Open Secret Journal</button></div>`);
    }

    function currentQuality(){
      try{return window.WishPoolCoordinator&&window.WishPoolCoordinator.quality||localStorage.getItem('wishPoolQuality')||'auto';}catch(e){return'auto';}
    }

    function settings(){
      const q=currentQuality();
      const musicMuted=localStorage.getItem('oneYearMenuMuted')==='1';
      openDialog('Settings',`
        <p>Choose how the game should feel on this device.</p>
        <div class="start-menu-option-grid">
          <button class="start-menu-option" data-panel-action="quality-auto" aria-pressed="${q==='auto'}">Auto Quality</button>
          <button class="start-menu-option" data-panel-action="quality-high" aria-pressed="${q==='high'}">High Quality</button>
          <button class="start-menu-option" data-panel-action="quality-low" aria-pressed="${q==='low'}">Low Quality</button>
          <button class="start-menu-option" data-panel-action="music" aria-pressed="${!musicMuted}">${musicMuted?'Music: Off':'Music: On'}</button>
          <button class="start-menu-option" data-panel-action="fullscreen">Toggle Fullscreen</button>
        </div>
        <p>The quality setting controls the Wish Pool particle budget automatically.</p>`);
    }

    function credits(){
      openDialog('Credits',`
        <div class="start-menu-credit">
          <h3>One Year Together</h3>
          <p>Made for Ashton &amp; Tanima.</p>
          <p>Designed as a tiny pixel-art world filled with memories, wishes, jokes, pets, Bengali culture, romance and a ridiculous amount of money.</p>
          <p><strong>Created with love by Ashton.</strong></p>
        </div>`);
    }

    function exitPanel(){
      openDialog('Exit Game',`
        <p class="start-menu-exit-note">Thanks for visiting your world together.</p>
        <div class="start-menu-option-grid">
          <button class="start-menu-option" data-panel-action="return-menu">Stay Here</button>
          <button class="start-menu-option" data-panel-action="close-tab">Close Game</button>
        </div>
        <p>Browsers may ask you to close the tab manually.</p>`);
    }

    function escapeHtml(value){
      return String(value||'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
    }

    function setQuality(mode){
      try{
        if(window.WishPoolCoordinator)window.WishPoolCoordinator.setQuality(mode);
        else localStorage.setItem('wishPoolQuality',mode);
      }catch(e){}
      settings();
    }

    function toggleMusic(){
      let muted=false;
      try{muted=localStorage.getItem('oneYearMenuMuted')==='1';localStorage.setItem('oneYearMenuMuted',muted?'0':'1');}catch(e){}
      try{
        const media=[...document.querySelectorAll('audio')];
        media.forEach(item=>item.muted=!muted);
      }catch(e){}
      settings();
    }

    function panelAction(action){
      if(action==='quality-auto')setQuality('auto');
      else if(action==='quality-high')setQuality('high');
      else if(action==='quality-low')setQuality('low');
      else if(action==='music')toggleMusic();
      else if(action==='fullscreen'){
        try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen();}catch(e){}
      }
      else if(action==='secret-journal'){
        closeDialog();hideMenu('continue');
        setTimeout(()=>{try{window.WishPhase4&&window.WishPhase4.journal('all');}catch(e){}},500);
      }
      else if(action==='return-menu')closeDialog();
      else if(action==='close-tab'){
        try{window.close();}catch(e){}
        dialogBody.innerHTML='<p class="start-menu-exit-note">You can safely close this tab now. Your discovered secrets and settings are saved.</p>';
      }
    }

    function activate(action){
      if(action==='start')hideMenu('start');
      else if(action==='continue')hideMenu('continue');
      else if(action==='memories')memories();
      else if(action==='settings')settings();
      else if(action==='credits')credits();
      else if(action==='exit')exitPanel();
    }

    buttons.forEach((button,index)=>{
      button.addEventListener('mouseenter',()=>{if(currentIndex!==index)tone('hover');select(index,false);});
      button.addEventListener('focus',()=>select(index,false));
      button.addEventListener('click',()=>activate(button.dataset.action));
    });

    closeButton.addEventListener('click',closeDialog);
    dialogWrap.addEventListener('click',event=>{if(event.target===dialogWrap)closeDialog();});
    dialog.addEventListener('click',event=>{
      const button=event.target.closest('[data-panel-action]');
      if(button){tone('click');panelAction(button.dataset.panelAction);}
    });

    document.addEventListener('keydown',event=>{
      const open=dialogWrap.classList.contains('is-open');
      const menuVisible=!menu.classList.contains('is-leaving');
      if(event.key==='Escape'){
        if(open){event.preventDefault();closeDialog();}
        else if(!menuVisible){event.preventDefault();showMenu();}
        return;
      }
      if(!menuVisible||open)return;
      if(['ArrowDown','s','S'].includes(event.key)){event.preventDefault();tone('hover');select(currentIndex+1,true);}
      else if(['ArrowUp','w','W'].includes(event.key)){event.preventDefault();tone('hover');select(currentIndex-1,true);}
      else if(event.key==='Enter'||event.key===' '){event.preventDefault();activate(buttons[currentIndex].dataset.action);}
    });

    try{
      const muted=localStorage.getItem('oneYearMenuMuted')==='1';
      if(muted)document.querySelectorAll('audio').forEach(item=>item.muted=true);
    }catch(e){}

    showMenu();
    window.OneYearStartMenu={show:showMenu,hide:()=>hideMenu('continue'),openMemories:memories,openSettings:settings};
  }catch(error){console.warn('start menu failed',error);}
})();