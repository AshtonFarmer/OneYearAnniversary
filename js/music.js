(function(){
  const MUSIC_SRC = 'audio/summer-orange-sky.mp3';
  const STORAGE_KEY = 'oneYearMusicTime';
  const PLAY_KEY = 'oneYearMusicShouldPlay';

  let music = document.getElementById('bgm');

  if(!music){
    music = document.createElement('audio');
    music.id = 'bgm';
    music.loop = true;
    music.preload = 'auto';
    music.src = MUSIC_SRC;
    document.body.appendChild(music);
  }

  music.volume = 0.35;

  const savedTime = Number(sessionStorage.getItem(STORAGE_KEY));
  if(!Number.isNaN(savedTime) && savedTime > 0){
    music.currentTime = savedTime;
  }

  function rememberMusic(){
    if(!Number.isNaN(music.currentTime)){
      sessionStorage.setItem(STORAGE_KEY, String(music.currentTime));
    }
  }

  setInterval(rememberMusic, 1000);
  window.addEventListener('beforeunload', rememberMusic);

  function startMusic(){
    music.play().then(() => {
      sessionStorage.setItem(PLAY_KEY, 'yes');
      hideMusicNote();
    }).catch(() => {});
  }

  function hideMusicNote(){
    const note = document.getElementById('musicNote');
    if(note) note.style.display = 'none';
  }

  function showMusicNote(){
    if(document.getElementById('musicNote')) return;

    const note = document.createElement('div');
    note.id = 'musicNote';
    note.textContent = 'Press any key or click to start music 🎵';
    note.style.position = 'fixed';
    note.style.left = '50%';
    note.style.top = '18px';
    note.style.transform = 'translateX(-50%)';
    note.style.background = 'rgba(25,12,18,.92)';
    note.style.border = '3px solid #ff9dcc';
    note.style.borderRadius = '12px';
    note.style.color = '#ffe18b';
    note.style.fontFamily = 'monospace';
    note.style.fontSize = '16px';
    note.style.padding = '9px 16px';
    note.style.zIndex = '99999';
    note.style.boxShadow = '0 8px 22px #0009';
    document.body.appendChild(note);
  }

  document.addEventListener('keydown', startMusic, {once:true});
  document.addEventListener('pointerdown', startMusic, {once:true});

  if(sessionStorage.getItem(PLAY_KEY) === 'yes'){
    startMusic();
  } else {
    window.addEventListener('load', showMusicNote);
  }
})();
