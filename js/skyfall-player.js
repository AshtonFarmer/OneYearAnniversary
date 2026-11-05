(function () {
  'use strict';

  const trigger = document.getElementById('listenSkyfall');
  const videoId = 'QO3oILb1vSY';
  const start = 280;
  let panel = null;
  let opener = null;

  function close(restoreFocus = false) {
    if (!panel) return;
    panel.remove();
    panel = null;
    if (restoreFocus && opener?.isConnected && !opener.hidden) opener.focus();
    opener = null;
  }

  function open(event) {
    if (panel) {
      panel.querySelector('button').focus();
      return;
    }

    opener = event?.currentTarget || document.activeElement;
    panel = document.createElement('aside');
    panel.className = 'skyfall-player';
    panel.setAttribute('aria-label', 'Skyfall recording');

    const header = document.createElement('header');
    const title = document.createElement('strong');
    title.textContent = '“Skyfall” · Usha Uthup';
    const stop = document.createElement('button');
    stop.type = 'button';
    stop.textContent = 'Close player';
    stop.addEventListener('click', () => close(true));
    header.append(title, stop);

    const player = document.createElement('iframe');
    player.title = 'Usha Uthup singing Skyfall at INK2013';
    player.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
    player.allowFullscreen = true;
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    player.src = `https://www.youtube.com/embed/${videoId}?start=${start}&autoplay=1&playsinline=1&rel=0`;

    const fallback = document.createElement('a');
    fallback.href = `https://www.youtube.com/watch?v=${videoId}&t=${start}s`;
    fallback.target = '_blank';
    fallback.rel = 'noopener';
    fallback.textContent = 'Open on YouTube ↗';
    const credit = document.createElement('p');
    credit.append('Live at INK2013 · ', fallback);
    panel.append(header, player, credit);
    document.body.append(panel);
    stop.focus();
  }

  trigger.addEventListener('click', open);
  window.SkyfallPlayer = {
    open,
    setAvailable(available) {
      trigger.hidden = !available;
      if (!available) close();
    }
  };
})();
