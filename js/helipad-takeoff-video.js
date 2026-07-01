// Fullscreen helicopter flyoff video.
// Uses the season-selected MP4s in assets/animation/.
// Rainy and night seasons close the helicopter ride instead.
(function(){
  try{
    if(typeof startAction !== 'function') return;

    const videoBySeason = {
      spring: 'assets/animation/helicopter_flyoff_spring.mp4',
      summer: 'assets/animation/helicopter_flyoff_main.mp4',
      fall: 'assets/animation/helicopter_flyoff_fall.mp4',
      winter: 'assets/animation/helicopter_flyoff_winter.mp4'
    };

    let overlay = null;
    let playing = false;
    let notice = '';
    let noticeTimer = 0;

    function currentSeason(){
      return localStorage.getItem('currentSeason') || 'summer';
    }

    function rideClosed(){
      const season = currentSeason();
      return season === 'rainy' || season === 'night';
    }

    function selectedVideo(){
      return videoBySeason[currentSeason()] || videoBySeason.summer;
    }

    function showClosedMessage(){
      const season = currentSeason();
      if(season === 'rainy'){
        notice = 'The helicopter ride is closed because of the rain.';
      } else if(season === 'night'){
        notice = 'The helicopter ride is closed for the night.';
      } else {
        notice = 'The helicopter ride is closed right now.';
      }
      noticeTimer = 190;
    }

    function ensureOverlay(){
      if(overlay) return overlay;

      overlay = document.createElement('div');
      overlay.id = 'takeoffVideoOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;display:none;background:#000;z-index:9999;overflow:hidden;font-family:monospace;color:white;';
      overlay.innerHTML =
        '<video id="takeoffVideo" playsinline preload="auto" style="width:100%;height:100%;object-fit:cover;display:block;background:#000;"></video>' +
        '<div id="takeoffMemory" style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;background:linear-gradient(rgba(2,5,10,.30),rgba(2,5,10,.92));padding:24px;text-align:center;">' +
          '<div style="width:min(900px,92vw);background:rgba(15,10,16,.88);border:3px solid #ff9dcc;border-radius:18px;padding:26px;box-shadow:0 12px 40px #000;">' +
            '<h1 style="margin:0 0 12px;color:#ff97cf;font-size:32px;">Our Next Adventure</h1>' +
            '<p style="color:#fff1c8;font-size:20px;line-height:1.45;margin:0 0 22px;">This is where our photos and videos can appear after the helicopter flies away.</p>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin:18px 0 24px;">' +
              '<div style="min-height:120px;border:2px dashed #ffe18b;border-radius:14px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;color:#ffe18b;">Photo 1</div>' +
              '<div style="min-height:120px;border:2px dashed #ffe18b;border-radius:14px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;color:#ffe18b;">Video 1</div>' +
              '<div style="min-height:120px;border:2px dashed #ffe18b;border-radius:14px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;color:#ffe18b;">Memory</div>' +
            '</div>' +
            '<button id="takeoffClose" style="background:#ff97cf;border:0;border-radius:12px;padding:12px 18px;font-weight:bold;cursor:pointer;margin:6px;">Back to Helipad</button>' +
            '<button id="takeoffReplay" style="background:#2f1f2a;color:#ffe18b;border:2px solid #b17142;border-radius:12px;padding:10px 16px;font-weight:bold;cursor:pointer;margin:6px;">Replay Takeoff</button>' +
          '</div>' +
        '</div>' +
        '<button id="skipTakeoff" style="position:absolute;right:18px;top:18px;z-index:2;background:rgba(15,10,16,.82);border:2px solid #ffe18b;border-radius:10px;color:#ffe18b;padding:9px 12px;font-weight:bold;cursor:pointer;">Skip</button>';

      document.body.appendChild(overlay);

      const video = overlay.querySelector('#takeoffVideo');
      const memory = overlay.querySelector('#takeoffMemory');
      const skip = overlay.querySelector('#skipTakeoff');
      const close = overlay.querySelector('#takeoffClose');
      const replay = overlay.querySelector('#takeoffReplay');

      function showMemory(){
        playing = false;
        video.pause();
        video.style.display = 'none';
        skip.style.display = 'none';
        memory.style.display = 'flex';
      }

      video.addEventListener('ended', showMemory);
      skip.onclick = showMemory;

      close.onclick = function(){
        playing = false;
        video.pause();
        overlay.style.display = 'none';
        memory.style.display = 'none';
        video.style.display = 'block';
        skip.style.display = 'block';
        if(typeof currentAction !== 'undefined') currentAction = null;
        if(typeof actionCooldown !== 'undefined') actionCooldown = 20;
      };

      replay.onclick = function(){
        if(rideClosed()){
          overlay.style.display = 'none';
          showClosedMessage();
          return;
        }
        playTakeoffVideo();
      };

      return overlay;
    }

    function playTakeoffVideo(){
      const panel = ensureOverlay();
      const video = panel.querySelector('#takeoffVideo');
      const memory = panel.querySelector('#takeoffMemory');
      const skip = panel.querySelector('#skipTakeoff');

      playing = true;
      panel.style.display = 'block';
      memory.style.display = 'none';
      video.style.display = 'block';
      skip.style.display = 'block';
      video.src = selectedVideo();
      video.currentTime = 0;
      video.muted = false;

      const playPromise = video.play();
      if(playPromise && typeof playPromise.catch === 'function'){
        playPromise.catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    }

    const originalStartAction = startAction;
    startAction = function(type){
      if(type === 'takeoff'){
        if(rideClosed()){
          showClosedMessage();
          if(typeof actionCooldown !== 'undefined') actionCooldown = 20;
          return;
        }
        playTakeoffVideo();
        if(typeof actionCooldown !== 'undefined') actionCooldown = 20;
        return;
      }
      return originalStartAction(type);
    };

    const originalUpdate = update;
    update = function(){
      if(playing){
        heartTimer++;
        lastE = !!keys.e;
        return;
      }
      const result = originalUpdate();
      if(noticeTimer > 0) noticeTimer--;
      return result;
    };

    const originalDraw = draw;
    draw = function(){
      originalDraw();
      if(noticeTimer <= 0 || !notice) return;

      ctx.save();
      const w = Math.min(canvas.width - 60, 720);
      const x = canvas.width / 2;
      const y = 92;
      ctx.fillStyle = 'rgba(15,10,16,.94)';
      ctx.strokeStyle = '#ffe18b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - 36, w, 72, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff1c8';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(notice, x, y + 8, w - 34);
      ctx.restore();
    };
  } catch(e){
    console.warn('helipad-takeoff-video failed', e);
  }
})();
