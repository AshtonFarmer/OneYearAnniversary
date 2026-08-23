// Comic speedsters available to the Speed Force Forest pursuit system.
// Ashton owns the first four runs: Flash, Hot Pursuit, Flash, Flash. Every
// entry marked random joins the no-repeat chase bag after replay three.
(function(){
  'use strict';

  const roster=[
    {
      id:'flash-new52',name:'New 52 Flash',asset:'assets/sprites/him_outfit10_run.png',
      guaranteedRun:1,random:false,spriteSize:164,leadBoost:0,
      lightning:{label:'GOLD SPEED FORCE',core:'#fff9cf',bright:'#ffd438',outer:'#ff7a14',shadow:'rgba(255,176,35,.9)'}
    },
    {
      id:'hot-pursuit',name:'Hot Pursuit',asset:'assets/sprites/him_hot_pursuit_run.png',
      guaranteedRun:2,random:false,spriteSize:216,leadBoost:88,special:'breach',
      lightning:{label:'COSMIC CYAN + ORANGE',core:'#eaffff',bright:'#60efff',outer:'#ff7d0b',shadow:'rgba(87,235,255,.96)'}
    },
    {
      id:'reverse-flash',name:'Reverse-Flash',asset:'assets/sprites/him_reverse_flash_run.png',
      random:true,spriteSize:168,leadBoost:38,
      lightning:{label:'NEGATIVE RED',core:'#ffe7e8',bright:'#ff3d48',outer:'#8d001d',shadow:'rgba(255,45,67,.96)'}
    },
    {
      id:'godspeed',name:'Godspeed',asset:'assets/sprites/him_godspeed_run.png',
      random:true,spriteSize:170,leadBoost:44,
      lightning:{label:'WHITE + GOLD',core:'#fffef0',bright:'#ffe25b',outer:'#d69312',shadow:'rgba(255,224,83,.96)'}
    },
    {
      id:'black-flash',name:'Black Flash',asset:'assets/sprites/him_black_flash_run.png',
      random:true,spriteSize:168,leadBoost:34,
      lightning:{label:'CRIMSON SHADOW',core:'#ffe1df',bright:'#ff3c34',outer:'#31000b',shadow:'rgba(255,38,42,.9)'}
    },
    {
      id:'wally-west',name:'Wally West — Rebirth',asset:'assets/sprites/him_wally_west_run.png',
      random:true,spriteSize:166,leadBoost:42,
      lightning:{label:'BLUE-WHITE',core:'#f3fdff',bright:'#6ee7ff',outer:'#245cff',shadow:'rgba(83,202,255,.96)'}
    },
    {
      id:'impulse',name:'Impulse',asset:'assets/sprites/him_impulse_run.png',
      random:true,spriteSize:166,leadBoost:48,
      lightning:{label:'RED + GOLD',core:'#fff8cf',bright:'#ffd34a',outer:'#ff432f',shadow:'rgba(255,119,43,.94)'}
    },
    {
      id:'jay-garrick',name:'Jay Garrick',asset:'assets/sprites/him_jay_garrick_run.png',
      random:true,spriteSize:166,leadBoost:30,
      lightning:{label:'GOLDEN AGE GOLD',core:'#fffbd8',bright:'#ffd85b',outer:'#e78b19',shadow:'rgba(255,196,55,.94)'}
    },
    {
      id:'future-flash',name:'Future Flash',asset:'assets/sprites/him_future_flash_run.png',
      random:true,spriteSize:170,leadBoost:52,
      lightning:{label:'FUTURE BLUE',core:'#edfdff',bright:'#41dcff',outer:'#173cff',shadow:'rgba(38,147,255,.98)'}
    },
    {
      id:'max-mercury',name:'Max Mercury',asset:'assets/sprites/him_max_mercury_run.png',
      random:true,spriteSize:168,leadBoost:33,
      lightning:{label:'MERCURY BLUE',core:'#ffffff',bright:'#a7f1ff',outer:'#3979ff',shadow:'rgba(119,218,255,.94)'}
    },
    {
      id:'inertia',name:'Inertia',asset:'assets/sprites/him_inertia_run.png',
      random:true,spriteSize:168,leadBoost:46,
      lightning:{label:'ACID GREEN + GOLD',core:'#f8ffd7',bright:'#dfff45',outer:'#20c856',shadow:'rgba(126,255,55,.92)'}
    },
    {
      id:'savitar',name:'Savitar',asset:'assets/sprites/him_savitar_run.png',
      random:true,spriteSize:174,leadBoost:50,
      lightning:{label:'GOD-OF-MOTION BLUE + GOLD',core:'#f5fbff',bright:'#58dfff',outer:'#ffb72f',shadow:'rgba(72,200,255,.96)'}
    },
    {
      id:'absolute-flash',name:'Absolute Flash',asset:'assets/sprites/him_absolute_flash_run.png',
      random:true,spriteSize:168,leadBoost:40,
      lightning:{label:'ABSOLUTE RED + WHITE',core:'#ffffff',bright:'#ff6158',outer:'#82131d',shadow:'rgba(255,73,64,.94)'}
    },
    {
      id:'kid-flash',name:'Classic Kid Flash',asset:'assets/sprites/him_kid_flash_run.png',
      random:true,spriteSize:166,leadBoost:43,
      lightning:{label:'CLASSIC GOLD + RED',core:'#fff9ce',bright:'#ffd347',outer:'#ff452e',shadow:'rgba(255,124,40,.94)'}
    }
  ];

  window.SPEEDSTER_ROSTER=Object.freeze(roster.map(entry=>Object.freeze({
    ...entry,
    lightning:Object.freeze({...entry.lightning})
  })));
})();
