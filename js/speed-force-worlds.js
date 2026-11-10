// Ordered worlds for the Savitar-inspired breach run. Every environment in
// this sequence was created specifically for the multiverse transit: the blue
// corridor returns between realities, and the last world remains playable.
(function(){
  'use strict';

  const worlds=[
    {
      id:'meridian-city',
      name:'Earth-2 — Meridian City',
      asset:'assets/multiverse/art-deco-earth.webp',
      effect:'neon',
      tint:'rgba(5,34,68,.15)',
      glow:'#72efff'
    },
    {
      id:'eclipse-ruins',
      name:'Earth-13 — Eclipse Ruins',
      asset:'assets/multiverse/eclipse-earth.webp',
      effect:'embers',
      tint:'rgba(92,5,18,.18)',
      glow:'#ff5a42'
    },
    {
      id:'cryostella',
      name:'Earth-47 — Cryostella',
      asset:'assets/multiverse/crystal-earth.webp',
      effect:'frost',
      tint:'rgba(21,47,115,.12)',
      glow:'#a8f6ff'
    },
    {
      id:'tempest-empire',
      name:'Earth-67 — Tempest Empire',
      asset:'assets/multiverse/tempest-earth.webp',
      effect:'tempest',
      tint:'rgba(55,20,105,.17)',
      glow:'#dc8cff'
    },
    {
      id:'our-little-world',
      name:'Earth-Prime — Our Little World',
      asset:'assets/our-year/neighborhood.webp',
      effect:'dawn',
      tint:'rgba(120,72,10,.06)',
      glow:'#ffe39a',
      final:true
    }
  ];

  window.SPEED_FORCE_MULTIVERSE=Object.freeze({
    tunnel:Object.freeze({
      id:'speed-force-corridor',
      name:'Speed Force Corridor',
      asset:'assets/multiverse/speed-force-tunnel.webp',
      effect:'tunnel',
      tint:'rgba(0,40,120,.08)',
      glow:'#71efff'
    }),
    tunnelDuration:.95,
    worldDuration:1.05,
    finalDuration:2.45,
    landingDuration:.85,
    destination:Object.freeze({
      id:'our-little-world',
      name:'Our Little World',
      url:'memory-world.html?from=speed-force'
    }),
    worlds:Object.freeze(worlds.map(world=>Object.freeze({...world})))
  });
})();
