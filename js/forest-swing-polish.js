// Forest swing polish layer: procedural comic-book music, THWIP effects,
// and natural sprite lean without requiring extra animation frames.
(function(){
  'use strict';

  const INTRO_DURATION = 1.55;
  const CYCLE_DURATION = 1.72;
  const ANCHOR_COUNT = 15;
  const SPRITE_CELL = 256;
  const MAX_TILT = 0.20;
  const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const riderAudio = [
    {key:'her',offset:.055,pan:-.16,pitch:1.06},
    {key:'him',offset:-.055,pan:.16,pitch:.95}
  ];

  const wristMaps = {
    her:{3:[177,13],4:[102,25],5:[108,29],8:[224,116],10:[165,128],11:[232,126]},
    him:{3:[237,17],4:[105,62],5:[109,63],10:[185,126],11:[232,102]}
  };

  const rotationState = new Map();
  let sceneStartedAt = null;
  let nextThwip = 0;
  let sceneActive = true;
  let audioContext = null;
  let masterGain = null;
  let themeGain = null;
  let sfxGain = null;
  let noiseBuffer = null;
  let themeTimer = null;
  let nextThemeLoopAt = 0;
  let pageMusic = null;

  const thwipSchedule = [];
  riderAudio.forEach(rider => {
    for(let index=0;index<ANCHOR_COUNT;index++){
      thwipSchedule.push({
        time:INTRO_DURATION + index*CYCLE_DURATION - rider.offset,
        pan:rider.pan,
        pitch:rider.pitch,
        index
      });
    }
  });
  thwipSchedule.sort((a,b) => a.time-b.time);

  function clamp(value,min,max){ return Math.max(min,Math.min(max,value)); }

  function silencePageMusic(){
    pageMusic = pageMusic || document.getElementById('bgm');
    if(!pageMusic) return;
    if(!pageMusic.paused) pageMusic.pause();
    if(pageMusic.dataset.forestSwingSuppressed !== '1'){
      pageMusic.dataset.forestSwingSuppressed='1';
      pageMusic.addEventListener('play',() => pageMusic.pause());
    }
  }

  function createNoiseBuffer(context){
    const length=Math.max(1,Math.floor(context.sampleRate*.28));
    const buffer=context.createBuffer(1,length,context.sampleRate);
    const data=buffer.getChannelData(0);
    let previous=0;
    for(let i=0;i<length;i++){
      const white=Math.random()*2-1;
      previous=previous*.55+white*.45;
      data[i]=white*.68+previous*.32;
    }
    return buffer;
  }

  function createAudio(){
    if(audioContext) return audioContext;
    const AudioCtor=window.AudioContext || window.webkitAudioContext;
    if(!AudioCtor) return null;

    audioContext=new AudioCtor();
    masterGain=audioContext.createGain();
    themeGain=audioContext.createGain();
    sfxGain=audioContext.createGain();
    masterGain.gain.value=.78;
    themeGain.gain.value=.19;
    sfxGain.gain.value=.52;
    themeGain.connect(masterGain);
    sfxGain.connect(masterGain);
    masterGain.connect(audioContext.destination);
    noiseBuffer=createNoiseBuffer(audioContext);
    return audioContext;
  }

  function resumeAudio(){
    const context=createAudio();
    if(!context) return;
    silencePageMusic();
    const resume=context.state==='suspended' ? context.resume() : Promise.resolve();
    resume.then(() => {
      silencePageMusic();
      if(sceneActive && sceneStartedAt!==null) startTheme();
    }).catch(() => {});
  }

  function makePanner(context,pan){
    if(typeof context.createStereoPanner==='function'){
      const panner=context.createStereoPanner();
      panner.pan.value=pan;
      return panner;
    }
    return context.createGain();
  }

  function playThwip(event){
    const context=audioContext;
    if(!context || context.state!=='running' || !sfxGain) return;
    const now=context.currentTime+.004;
    const panner=makePanner(context,event.pan);
    panner.connect(sfxGain);

    const noise=context.createBufferSource();
    const noiseFilter=context.createBiquadFilter();
    const noiseGain=context.createGain();
    noise.buffer=noiseBuffer;
    noiseFilter.type='bandpass';
    noiseFilter.frequency.setValueAtTime(2500*event.pitch,now);
    noiseFilter.frequency.exponentialRampToValueAtTime(780*event.pitch,now+.16);
    noiseFilter.Q.value=.72;
    noiseGain.gain.setValueAtTime(.0001,now);
    noiseGain.gain.exponentialRampToValueAtTime(.34,now+.008);
    noiseGain.gain.exponentialRampToValueAtTime(.0001,now+.19);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(panner);
    noise.start(now);
    noise.stop(now+.21);

    const snap=context.createOscillator();
    const snapGain=context.createGain();
    snap.type='triangle';
    snap.frequency.setValueAtTime(1040*event.pitch,now);
    snap.frequency.exponentialRampToValueAtTime(155*event.pitch,now+.17);
    snapGain.gain.setValueAtTime(.0001,now);
    snapGain.gain.exponentialRampToValueAtTime(.24,now+.005);
    snapGain.gain.exponentialRampToValueAtTime(.0001,now+.18);
    snap.connect(snapGain);
    snapGain.connect(panner);
    snap.start(now);
    snap.stop(now+.19);

    const body=context.createOscillator();
    const bodyGain=context.createGain();
    body.type='sine';
    body.frequency.setValueAtTime(380*event.pitch,now+.012);
    body.frequency.exponentialRampToValueAtTime(92*event.pitch,now+.15);
    bodyGain.gain.setValueAtTime(.0001,now);
    bodyGain.gain.exponentialRampToValueAtTime(.13,now+.014);
    bodyGain.gain.exponentialRampToValueAtTime(.0001,now+.18);
    body.connect(bodyGain);
    bodyGain.connect(panner);
    body.start(now);
    body.stop(now+.19);
  }

  function playLandingThump(){
    const context=audioContext;
    if(!context || context.state!=='running' || !sfxGain) return;
    const now=context.currentTime+.006;

    const thump=context.createOscillator();
    const thumpGain=context.createGain();
    thump.type='sine';
    thump.frequency.setValueAtTime(118,now);
    thump.frequency.exponentialRampToValueAtTime(42,now+.24);
    thumpGain.gain.setValueAtTime(.0001,now);
    thumpGain.gain.exponentialRampToValueAtTime(.34,now+.012);
    thumpGain.gain.exponentialRampToValueAtTime(.0001,now+.3);
    thump.connect(thumpGain);
    thumpGain.connect(sfxGain);
    thump.start(now);
    thump.stop(now+.32);

    const dust=context.createBufferSource();
    const dustFilter=context.createBiquadFilter();
    const dustGain=context.createGain();
    dust.buffer=noiseBuffer;
    dustFilter.type='lowpass';
    dustFilter.frequency.setValueAtTime(740,now);
    dustFilter.frequency.exponentialRampToValueAtTime(190,now+.32);
    dustGain.gain.setValueAtTime(.14,now);
    dustGain.gain.exponentialRampToValueAtTime(.0001,now+.34);
    dust.connect(dustFilter);
    dustFilter.connect(dustGain);
    dustGain.connect(sfxGain);
    dust.start(now);
    dust.stop(now+.35);
  }

  function handleLanding(){
    playLandingThump();
    stopTheme();
  }

  function midiToFrequency(midi){ return 440*Math.pow(2,(midi-69)/12); }

  function scheduleTone(start,midi,duration,volume,type,filterFrequency,destination){
    const context=audioContext;
    if(!context || !destination) return;
    const oscillator=context.createOscillator();
    const filter=context.createBiquadFilter();
    const gain=context.createGain();
    oscillator.type=type;
    oscillator.frequency.setValueAtTime(midiToFrequency(midi),start);
    filter.type='lowpass';
    filter.frequency.value=filterFrequency;
    filter.Q.value=.7;
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(volume,start+.018);
    gain.gain.setValueAtTime(volume*.82,Math.max(start+.02,start+duration-.07));
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    oscillator.start(start);
    oscillator.stop(start+duration+.02);
  }

  function scheduleKick(start,volume){
    const context=audioContext;
    if(!context || !themeGain) return;
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    oscillator.type='sine';
    oscillator.frequency.setValueAtTime(118,start);
    oscillator.frequency.exponentialRampToValueAtTime(48,start+.12);
    gain.gain.setValueAtTime(volume,start);
    gain.gain.exponentialRampToValueAtTime(.0001,start+.14);
    oscillator.connect(gain);
    gain.connect(themeGain);
    oscillator.start(start);
    oscillator.stop(start+.15);
  }

  function scheduleSnare(start,volume){
    const context=audioContext;
    if(!context || !themeGain || !noiseBuffer) return;
    const source=context.createBufferSource();
    const filter=context.createBiquadFilter();
    const gain=context.createGain();
    source.buffer=noiseBuffer;
    filter.type='highpass';
    filter.frequency.value=1450;
    gain.gain.setValueAtTime(volume,start);
    gain.gain.exponentialRampToValueAtTime(.0001,start+.11);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(themeGain);
    source.start(start);
    source.stop(start+.12);
  }

  function scheduleHat(start,volume){
    const context=audioContext;
    if(!context || !themeGain || !noiseBuffer) return;
    const source=context.createBufferSource();
    const filter=context.createBiquadFilter();
    const gain=context.createGain();
    source.buffer=noiseBuffer;
    filter.type='highpass';
    filter.frequency.value=5200;
    gain.gain.setValueAtTime(volume,start);
    gain.gain.exponentialRampToValueAtTime(.0001,start+.035);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(themeGain);
    source.start(start);
    source.stop(start+.04);
  }

  function scheduleThemeLoop(start){
    const beat=60/132;
    const melody=[
      [0,74,.45],[.75,77,.22],[1,81,.42],[1.75,79,.22],
      [2,77,.45],[2.75,74,.22],[3,72,.56],
      [4,70,.45],[4.75,74,.22],[5,77,.42],[5.75,76,.22],
      [6,74,.45],[6.75,72,.22],[7,69,.56],
      [8,77,.45],[8.75,81,.22],[9,82,.42],[9.75,81,.22],
      [10,79,.45],[10.75,77,.22],[11,74,.56],
      [12,76,.45],[12.75,79,.22],[13,81,.42],[13.75,79,.22],
      [14,76,.38],[14.6,74,.28],[15,73,.26],[15.45,74,.48]
    ];
    const bass=[38,38,43,43,46,46,45,45];
    const chords=[[50,53,57],[55,58,62],[58,62,65],[57,61,64]];

    melody.forEach(([offset,note,length],index) => {
      scheduleTone(start+offset*beat,note,length*beat,.10+(index%4===0?.018:0),'sawtooth',1900,themeGain);
    });

    bass.forEach((note,index) => {
      scheduleTone(start+index*2*beat,note,1.55*beat,.075,'square',480,themeGain);
    });

    chords.forEach((chord,index) => {
      chord.forEach((note,voice) => {
        scheduleTone(start+index*4*beat,note,3.65*beat,.028-(voice*.003),'triangle',1250,themeGain);
      });
    });

    for(let i=0;i<16;i++){
      const at=start+i*beat;
      if(i%4===0 || i%4===2) scheduleKick(at,.072);
      if(i%4===1 || i%4===3) scheduleSnare(at,.032);
      scheduleHat(at,.012);
      scheduleHat(at+beat*.5,.008);
    }
  }

  function scheduleThemeAhead(){
    const context=audioContext;
    if(!context || context.state!=='running' || !sceneActive) return;
    const loopDuration=16*(60/132);
    if(nextThemeLoopAt<context.currentTime-.05) nextThemeLoopAt=context.currentTime+.05;
    while(nextThemeLoopAt<context.currentTime+1.25){
      scheduleThemeLoop(nextThemeLoopAt);
      nextThemeLoopAt+=loopDuration;
    }
  }

  function startTheme(){
    if(!audioContext || audioContext.state!=='running' || !themeGain || !sceneActive) return;
    themeGain.gain.cancelScheduledValues(audioContext.currentTime);
    themeGain.gain.setTargetAtTime(.19,audioContext.currentTime,.08);
    if(!themeTimer){
      nextThemeLoopAt=audioContext.currentTime+.05;
      scheduleThemeAhead();
      themeTimer=window.setInterval(scheduleThemeAhead,400);
    }
  }

  function stopTheme(){
    sceneActive=false;
    if(themeTimer){
      clearInterval(themeTimer);
      themeTimer=null;
    }
    if(audioContext && themeGain){
      themeGain.gain.cancelScheduledValues(audioContext.currentTime);
      themeGain.gain.setTargetAtTime(.0001,audioContext.currentTime,.35);
    }
  }

  function beginSceneClock(){
    sceneStartedAt=performance.now();
    nextThwip=0;
    sceneActive=true;
    rotationState.clear();
    if(audioContext && audioContext.state==='running') startTheme();
  }

  function watchSceneAudio(){
    if(sceneActive && sceneStartedAt!==null){
      const elapsed=(performance.now()-sceneStartedAt)/1000;
      while(nextThwip<thwipSchedule.length && thwipSchedule[nextThwip].time<=elapsed+.018){
        playThwip(thwipSchedule[nextThwip]);
        nextThwip++;
      }
    }
    requestAnimationFrame(watchSceneAudio);
  }

  function atlasKey(image){
    const source=(image && (image.currentSrc || image.src)) || '';
    if(source.includes('her_spidey_swing_atlas.png')) return 'her';
    if(source.includes('him_spidey_swing_atlas.png')) return 'him';
    return '';
  }

  const originalDrawImage=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(){
    const args=Array.prototype.slice.call(arguments);
    const key=atlasKey(args[0]);
    if(!key || args.length!==9 || REDUCED_MOTION){
      if(key && sceneStartedAt===null) beginSceneClock();
      return originalDrawImage.apply(this,args);
    }

    if(sceneStartedAt===null) beginSceneClock();

    const sx=Number(args[1]);
    const sy=Number(args[2]);
    const dx=Number(args[5]);
    const dy=Number(args[6]);
    const dw=Number(args[7]);
    const dh=Number(args[8]);
    const frame=Math.round(sx/SPRITE_CELL)+Math.round(sy/SPRITE_CELL)*4;
    const centerX=dx+dw/2;
    const centerY=dy+dh/2;
    const now=performance.now();
    const previous=rotationState.get(key);
    let angle=previous ? previous.angle : 0;

    if(previous){
      const dt=clamp(now-previous.time,8,80);
      const distance=Math.hypot(centerX-previous.x,centerY-previous.y);
      if(distance>420 || now-previous.time>220){
        angle=0;
      } else {
        const scale=16.667/dt;
        const vx=(centerX-previous.x)*scale;
        const vy=(centerY-previous.y)*scale;
        let target=Math.atan2(vy,Math.max(Math.abs(vx),.7))*.43;
        target+=clamp(vx/18,-1,1)*.035;
        if(frame===0 || frame===1 || frame===2) target*=.55;
        if(frame===14 || frame===15) target*=.25;
        target=clamp(target,-MAX_TILT,MAX_TILT);
        const response=clamp(dt/70,.14,.42);
        angle+=(target-angle)*response;
      }
    }

    rotationState.set(key,{x:centerX,y:centerY,time:now,angle});

    const wrist=wristMaps[key][frame];
    const pivotX=wrist ? dx+(wrist[0]/SPRITE_CELL)*dw : centerX;
    const pivotY=wrist ? dy+(wrist[1]/SPRITE_CELL)*dh : centerY;

    this.save();
    this.translate(pivotX,pivotY);
    this.rotate(angle);
    originalDrawImage.call(
      this,args[0],args[1],args[2],args[3],args[4],
      dx-pivotX,dy-pivotY,dw,dh
    );
    this.restore();
  };

  function bindSceneControls(){
    const replay=document.getElementById('replaySwing');
    const landing=document.getElementById('landing');

    if(replay){
      replay.addEventListener('click',() => {
        resumeAudio();
        beginSceneClock();
      });
    }

    if(landing){
      const observer=new MutationObserver(() => {
        if(landing.classList.contains('is-visible')) stopTheme();
      });
      observer.observe(landing,{attributes:true,attributeFilter:['class']});
    }
  }

  silencePageMusic();
  window.setTimeout(silencePageMusic,0);
  window.setTimeout(silencePageMusic,350);
  document.addEventListener('pointerdown',resumeAudio,{passive:true});
  document.addEventListener('keydown',resumeAudio);
  window.addEventListener('load',silencePageMusic);
  window.addEventListener('forest-swing-landed',handleLanding);
  bindSceneControls();
  resumeAudio();
  requestAnimationFrame(watchSceneAudio);
})();
