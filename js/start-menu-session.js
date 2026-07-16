// Keeps the title screen from reopening every time the player returns home.
(function(){
  'use strict';
  const KEY='oneYearStartMenuShown';
  const menu=document.getElementById('start-menu');
  const canvas=document.getElementById('game');
  let alreadyShown=false;

  try{
    alreadyShown=sessionStorage.getItem(KEY)==='1';
    if(!alreadyShown)sessionStorage.setItem(KEY,'1');
  }catch(error){}

  if(alreadyShown&&menu){
    menu.classList.add('is-leaving');
    menu.setAttribute('aria-hidden','true');
    document.body.classList.remove('start-menu-open');
    if(canvas)canvas.style.pointerEvents='auto';
  }

  document.documentElement.classList.remove('skip-start-menu');

  if(window.OneYearStartMenu){
    window.OneYearStartMenu.resetFirstOpen=function(){
      try{sessionStorage.removeItem(KEY);}catch(error){}
    };
  }
})();
