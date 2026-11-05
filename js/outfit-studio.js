(function(){
  'use strict';
  const W=window.SharedWardrobe,$=id=>document.getElementById(id),fabric=$('fabric'),fc=fabric.getContext('2d'),preview=$('fittingPreview'),pc=preview.getContext('2d');
  let draft=W.normalize({name:'My first saree',who:'her',kind:'saree',saree:{},color:'#728d77',trim:'#e5ba65',pattern:'none',strokes:[]}),sprite=null,row=0,auto=true,painting=false,renderTimer=0,revision=0,turnStart=performance.now();
  const recipes=[
    ['Dhaka Jamdani','Airy colors with spaced, woven motifs.','#246d66','#e8e2c0','#17605b','buti','lotus','vine','cotton','none','scattered'],
    ['Tangail','Light cloth with a contrasting border and a banded pallu.','#f2d7ae','#912c44','#993751','flowers','stripes','checks','cotton','none','bands'],
    ['Banarasi brocade','Jewel-toned brocade, paisleys, and gold vines.','#791b42','#f6c46c','#482052','paisley','vine','vine','brocade','gold','bands'],
    ['Kanchipuram silk','A contrasting pallu, gold checks, and temple-point edges.','#772035','#f8bd62','#28456c','checks','peacock','temple','silk','gold','bands'],
    ['Paithani','A jewel-toned body with a peacock as the pallu centerpiece.','#352659','#efbd70','#105858','buti','peacock','vine','silk','gold','panel'],
    ['Baluchari','A story-panel feel with an arch centerpiece and floral edges.','#592a55','#ebb987','#842b4e','buti','arch','flowers','silk','none','panel'],
    ['Patola','Repeated double-ikat-inspired diamonds in contrasting colors.','#a42d4c','#f4bf76','#155c57','ikat','ikat','temple','silk','none','repeat'],
    ['Bandhani','Small clusters of tie-dye dots and brighter festive edges.','#be355e','#fff3cc','#b54e23','bandhani','bandhani','buti','cotton','none','scattered'],
    ['Kantha embroidery','A warm ground with running-stitch designs.','#e3bc92','#812f49','#c79577','kantha','vine','kantha','cotton','none','bands'],
    ['Chanderi','A light-looking finish with scattered buti and a fine gold detail.','#9a759a','#f2d69b','#624b82','buti','lotus','stripes','tissue','gold','scattered'],
    ['Sambalpuri ikat','Bold contrast, stepped diamonds, and strong bands.','#374964','#f6c69a','#ac4b3b','ikat','ikat','checks','cotton','none','bands'],
    ['Kasavu','Ivory cloth and a distinct gold edge.','#f5ebd3','#bd8e32','#ece0b9','none','stripes','stripes','cotton','gold','bands'],
    ['Crimson Puja','Cream and red with a lotus pallu and temple-point border.','#f2dcbd','#bd3346','#8c2542','lotus','lotus','temple','silk','gold','panel'],
    ['Gallery Heirloom','An ornate centerpiece inspired by the record saree’s woven artwork.','#2c254f','#f6cf81','#58334e','vine','arch','peacock','brocade','ruby','panel']
  ];
  const zoneNames={body:'Body',pleats:'Pleats',pallu:'Pallu',border:'Border'};
  const zoneHelp={body:'The main wrap of the saree.',pleats:'The gathered folds at the front.',pallu:'The decorated end draped over the shoulder.',border:'The edging around the saree.'};
  const zoneFields={zoneColor:'color',zoneInk:'ink',zoneFinish:'finish',zoneAccent:'accent',zoneSecondInk:'secondInk',zoneLayout:'layout',zoneSpacing:'spacing'};
  const zoneButtons=document.querySelectorAll('[data-zone]');
  let selectedZone='body',closeUp=false,paintPointer=null,activeMark=null,stampTool='',walking=true,blouseView=false,blouseBack=false,selectedStamp=null;
  const swatch={x:49,y:49,w:262,h:328};
  const outline=path=>new Path2D(path);
  const sketch={
    blouse:outline('M140 45 Q159 61 183 60 Q202 59 218 44 L249 61 L275 109 L240 128 L228 109 L226 167 Q177 188 131 161 L128 108 L113 130 L76 111 L102 61 Z'),
    body:outline('M128 151 Q177 184 228 154 L271 401 Q181 432 88 400 L122 230 Z'),
    pleats:outline('M168 173 Q183 177 201 173 L224 415 Q187 424 145 415 Z'),
    pallu:outline('M210 45 Q228 40 247 56 Q255 94 256 139 L279 277 Q248 302 222 283 L215 179 L160 207 Q147 182 144 157 Z'),
    border:outline('M89 396 Q182 425 271 398 L273 415 Q183 445 87 413 Z M223 276 Q251 288 278 268 L281 282 Q248 308 222 289 Z')
  };
  const sketchAreas={body:[88,151,183,270],pleats:[145,173,79,252],pallu:[144,45,137,257],border:[87,268,194,167]};
  const drapeNotes={
    classic:'The original shoulder wrap.',
    bengali:'A cross-body fold with a wider contrasting edge.',
    gujarati:'A wider pallu carried forward to show its design.'
  };
  const drapeSketches={
    classic:sketch,
    bengali:{...sketch,
      pallu:outline('M116 48 Q102 45 93 64 Q109 117 120 174 L210 209 L231 165 Q188 140 116 48 Z'),
      border:outline('M89 387 Q180 421 271 389 L273 415 Q183 445 87 413 Z M116 164 Q168 182 214 198 L210 214 Q168 201 120 180 Z')},
    gujarati:{...sketch,
      pallu:outline('M112 49 Q132 41 146 57 Q177 104 199 152 L238 244 Q183 274 104 249 L108 162 Z'),
      border:outline('M89 396 Q182 425 271 398 L273 415 Q183 445 87 413 Z M105 238 Q175 261 234 232 L239 248 Q175 277 103 253 Z')}
  };
  const drapeAreas={classic:sketchAreas,bengali:{...sketchAreas,pallu:[92,44,141,168],border:[87,160,187,272]},
    gujarati:{...sketchAreas,pallu:[103,41,137,234],border:[87,231,187,201]}};
  const drapeLabels={classic:'Classic',bengali:'Bengali-inspired',gujarati:'Gujarati-inspired'};
  function buildDrapeChoices(){
    for(const [key,label] of Object.entries(drapeLabels)){
      const button=document.createElement('button'),icon=document.createElement('canvas'),name=document.createElement('span');
      button.type='button';button.dataset.drape=key;button.setAttribute('aria-pressed','false');
      icon.width=44;icon.height=49;icon.setAttribute('aria-hidden','true');
      const ctx=icon.getContext('2d'),paths=drapeSketches[key];
      ctx.translate(2,0);ctx.scale(.111,.111);
      for(const [part,path] of Object.entries(paths)){
        ctx.fillStyle=part==='pallu'?'#b14b63':part==='border'?'#dbab63':part==='pleats'?'#50756a':'#31554e';
        ctx.fill(path);
      }
      name.textContent=label;button.append(icon,name);
      button.onclick=()=>{
        draft.drape=key;
        closeUp=false;blouseView=false;fabric.style.cursor='pointer';
        updateZone();queueRender();
      };
      $('drapeChoices').append(button);
    }
  }
  const blouseFields={blouseColor:'color',blouseTrim:'trim',blouseNeck:'neck',blouseSleeve:'sleeve',blouseBack:'back'};
  const necklines={
    round:'Q180 75 218 44',square:'L142 72 L218 72 L218 44',
    vee:'L180 88 L218 44',high:'Q180 52 218 44'
  };
  const sleeves={
    short:['L275 109 L240 128','L113 130 L76 111'],
    cap:['L269 87 L239 106','L115 106 L82 88'],
    elbow:['L289 145 L249 163','L107 163 L67 145']
  };
  function getBlouse(){return draft.blouse??{match:true,color:draft.saree.body.color,trim:draft.saree.body.ink,neck:'round',sleeve:'short',back:'closed'};}
  function drawBlouse(back=false){
    const blouse=getBlouse(),body=draft.saree.body;
    const [right,left]=sleeves[blouse.sleeve];
    const neckline=back?(blouse.back==='scoop'?'Q180 126 218 44':necklines.high):necklines[blouse.neck];
    const shape=outline('M140 44 '+neckline+' L249 61 '+right+' L228 109 L226 167 Q177 188 131 161 L128 108 '+left+' L102 61 Z');
    fc.fillStyle=blouse.match?body.color:blouse.color;fc.fill(shape);
    fc.strokeStyle=blouse.match?body.ink:blouse.trim;fc.lineWidth=3;fc.stroke(shape);
    if(back&&blouse.back==='keyhole'){
      fc.fillStyle='#e9dfca';fc.beginPath();fc.ellipse(180,91,11,21,0,0,Math.PI*2);fc.fill();fc.stroke();
    }
  }
  function palluMarks(){return draft.saree.pallu.marks;}
  function updatePalluTools(){
    const active=!!draft.saree&&!blouseView&&closeUp&&selectedZone==='pallu';
    $('palluTools').hidden=!active;
    if(!active)return;
    const list=palluMarks(),select=$('placedStamp');
    if(!list.includes(selectedStamp))selectedStamp=null;
    select.replaceChildren();
    const empty=document.createElement('option');empty.value='';empty.textContent='Choose a placed motif';select.append(empty);
    list.forEach((mark,index)=>{
      if(!mark.stamp||!mark.points.length)return;
      const option=document.createElement('option');option.value=index;
      option.textContent=(index+1)+'. '+W.sareeOptions.motifs[mark.stamp];select.append(option);
    });
    select.value=selectedStamp?String(list.indexOf(selectedStamp)):'';
    $('palluTransform').disabled=!selectedStamp;
    if(!selectedStamp)return;
    $('palluSize').value=selectedStamp.size*100;
    $('palluAngle').value=selectedStamp.angle||0;
    $('palluMirror').checked=!!selectedStamp.mirror;
  }
  function updateBlouseTools(){
    $('blouseView').setAttribute('aria-pressed',blouseView);
    $('blouseControls').hidden=!blouseView;
    if(!blouseView)return;
    const blouse=getBlouse();
    $('blouseMatch').checked=blouse.match;
    for(const [id,field] of Object.entries(blouseFields))$(id).value=blouse[field];
    $('blouseColor').disabled=blouse.match;$('blouseTrim').disabled=blouse.match;
    $('blouseSide').textContent=blouseBack?'Show front':'Show back';
    $('blouseSide').setAttribute('aria-pressed',blouseBack);
  }
  const motifGroups={
    'Flowers and foliage':['lotus','flowers','jasmine','marigold','fern','vine','lotuspond','paisley'],
    'Birds and animals':['peacock','parrot','elephant','swan','fish'],
    'Woven geometry':['buti','ikat','bandhani','kantha','checks','stripes','trellis','coin','temple','chevron','wave','arch'],
    'Celestial and keepsakes':['sunburst','stars','moon','heart','eclipse','diya','fireworks','railroad','jeep']
  };
  function openMotifs(field){
    const stamp=field==='stamp',accent=field==='secondMotif',zone=draft.saree[selectedZone];
    const names=W.sareeOptions.motifs,selected=stamp?stampTool:zone[field];
    $('motifHeading').textContent=stamp?'Choose a stamp':accent?'Choose an accent motif':'Choose a primary motif';
    const grid=$('motifChoices');grid.replaceChildren();
    function addTile(parent,key,label){
      const button=document.createElement('button'),icon=document.createElement('canvas'),caption=document.createElement('span');
      button.type='button';button.className='motif-tile';button.setAttribute('aria-pressed',key===selected);
      icon.width=74;icon.height=54;icon.setAttribute('aria-hidden','true');
      const ctx=icon.getContext('2d'),ground='#263b35';
      ctx.fillStyle=ground;ctx.fillRect(0,0,74,54);
      if(key&&key!=='none')W.drawMotif(ctx,key,37,27,38,'#f4d79e',ground);
      else {ctx.strokeStyle='#a2aa8c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(29,27);ctx.lineTo(45,27);ctx.stroke();}
      caption.textContent=label;button.append(icon,caption);
      button.onclick=()=>{
        if(stamp){
          stampTool=key;$('paintTool').textContent=label;
          if(key)setZone(selectedZone,true);
        }else{zone[field]=key;updateZone();queueRender();}
        $('motifGallery').close();
      };
      parent.append(button);
    }
    const clear=document.createElement('div');clear.className='motif-grid';grid.append(clear);
    addTile(clear,stamp?'':'none',stamp?'Freehand brush':accent?'No accent':'Plain');
    for(const [group,keys] of Object.entries(motifGroups)){
      const section=document.createElement('section'),heading=document.createElement('h3'),tiles=document.createElement('div');
      heading.textContent=group;tiles.className='motif-grid';
      for(const key of keys)addTile(tiles,key,names[key]);
      section.append(heading,tiles);grid.append(section);
    }
    $('motifGallery').showModal();
  }
  function fillOptions(id,options){
    for(const [value,label] of Object.entries(options)){
      const option=document.createElement('option');
      option.value=value;option.textContent=label;$(id).append(option);
    }
  }
  function applyRecipe(index,announce=true){
    const [name,,color,ink,palluColor,motif,palluMotif,borderMotif,finish,accent,palluLayout]=recipes[index];
    const edits={
      body:{color,ink,motif,finish,spacing:53,layout:'scattered'},
      pleats:{color,ink,motif:motif==='none'?'none':'stripes',finish,spacing:34,layout:'repeat'},
      pallu:{color:palluColor,ink,motif:palluMotif,finish,accent,layout:palluLayout,spacing:48},
      border:{color:ink,ink:color,motif:borderMotif,finish,accent,layout:'bands',spacing:35}
    };
    for(const [key,zone] of Object.entries(edits))draft.saree[key]={
      ...zone,secondMotif:draft.saree[key].secondMotif,secondInk:draft.saree[key].secondInk,marks:draft.saree[key].marks
    };
    sync();
    if(announce)say(name+' applied. Your brushwork and stamps are still here.');
  }
  function updateZone(){
    const zone=draft.saree[selectedZone];
    updateBlouseTools();updatePalluTools();
    for(const [id,field] of Object.entries(zoneFields))$(id).value=zone[field]??'#e9a7a7';
    $('zoneMotif').textContent=W.sareeOptions.motifs[zone.motif];
    $('zoneSecond').textContent=zone.secondMotif&&zone.secondMotif!=='none'?W.sareeOptions.motifs[zone.secondMotif]:'No accent';
    $('secondInkField').hidden=!zone.secondMotif||zone.secondMotif==='none';
    for(const button of $('drapeChoices').children){
      button.setAttribute('aria-pressed',button.dataset.drape===draft.drape);
    }
    $('drapeNote').textContent=drapeNotes[draft.drape];
    $('zoneLabel').textContent=zoneNames[selectedZone].toUpperCase();
    $('spacingField').hidden=(zone.motif==='none'&&(!zone.secondMotif||zone.secondMotif==='none'))||zone.layout==='panel';
    $('swatchView').setAttribute('aria-pressed',closeUp);
    $('swatchView').textContent=selectedZone==='pallu'?'Pallu layout':'Paint close-up';
    zoneButtons.forEach(b=>b.setAttribute('aria-pressed',b.dataset.zone===selectedZone));
    $('artboardCaption').textContent=blouseView?'Blouse '+(blouseBack?'back':'front')+' · shape details are shown on this sketch.':
      selectedZone==='pallu'&&closeUp?'Add a motif, then drag it around or adjust it using the controls.':closeUp?zoneHelp[selectedZone]+' Paint or stamp the swatch.':zoneHelp[selectedZone]+' Click a section or open its paint close-up.';
  }
  function setZone(key,open=closeUp){
    if(key!==selectedZone)selectedStamp=null;
    selectedZone=key;closeUp=open;blouseView=false;
    fabric.style.cursor=closeUp?'crosshair':'pointer';
    updateZone();drawFabric();
  }
  function drawSaree(){
    if(blouseView){
      fc.save();fc.translate(-90,40);fc.scale(1.5,1.5);drawBlouse(blouseBack);fc.restore();
      return;
    }
    if(closeUp){
      const {x,y,w,h}=swatch;
      fc.fillStyle='#a89572';fc.fillRect(x-3,y-3,w+6,h+6);
      fc.drawImage(W.sareeTexture(draft.saree[selectedZone]),x,y,w,h);
      if(selectedZone==='pallu'&&selectedStamp&&palluMarks().includes(selectedStamp)){
        const [u,v]=selectedStamp.points[0];
        fc.save();fc.strokeStyle='#fff1bc';fc.lineWidth=2;fc.setLineDash([4,3]);fc.beginPath();
        fc.arc(x+u*w,y+v*h,Math.max(10,selectedStamp.size*w*.57),0,Math.PI*2);fc.stroke();fc.restore();
      }
      fc.fillStyle='#4e4939';fc.textAlign='center';fc.font='12px Georgia';
      fc.fillText(zoneNames[selectedZone]+' · fabric close-up',180,402);
      return;
    }
    const paths=drapeSketches[draft.drape],areas=drapeAreas[draft.drape];
    for(const [key,part] of Object.entries(paths)){
      fc.save();fc.clip(part);
      if(key==='blouse'){
        fc.restore();drawBlouse();continue;
      }else fc.drawImage(W.sareeTexture(draft.saree[key]),...areas[key]);
      fc.restore();
      fc.strokeStyle=key===selectedZone?'#fbecbf':'#342d3b99';
      fc.lineWidth=key===selectedZone?2.7:1.1;fc.stroke(part);
    }
    fc.save();fc.clip(paths.pleats);
    fc.strokeStyle='#1a152452';fc.lineWidth=2;
    for(const hem of [151,168,183,198,213]){
      fc.beginPath();fc.moveTo(180+(hem-180)*.37,179);fc.lineTo(hem,414);fc.stroke();
    }
    fc.restore();
    if(draft.drape!=='classic')return;
    fc.strokeStyle='#e8d4aeaa';fc.lineWidth=1;
    fc.beginPath();fc.moveTo(225,58);fc.quadraticCurveTo(190,120,155,171);fc.stroke();
    fc.beginPath();fc.moveTo(240,63);fc.quadraticCurveTo(237,155,258,277);fc.stroke();
  }
  function say(s){$('studioStatus').textContent=s;}
  function silhouette(){const p=new Path2D();if(draft.kind==='saree'){p.moveTo(140,42);p.lineTo(98,61);p.lineTo(77,131);p.lineTo(117,151);p.lineTo(112,199);p.lineTo(77,405);p.quadraticCurveTo(180,437,283,405);p.lineTo(236,199);p.lineTo(240,148);p.lineTo(280,132);p.lineTo(259,62);p.lineTo(215,42);p.quadraticCurveTo(180,73,140,42);}else if(draft.kind==='dress'){p.moveTo(137,42);p.lineTo(111,76);p.lineTo(104,129);p.lineTo(132,157);p.lineTo(132,187);p.lineTo(53,404);p.quadraticCurveTo(180,445,307,404);p.lineTo(228,187);p.lineTo(228,157);p.lineTo(256,129);p.lineTo(249,76);p.lineTo(222,42);p.quadraticCurveTo(180,78,137,42);}else{p.moveTo(144,45);p.lineTo(96,63);p.lineTo(67,239);p.lineTo(108,249);p.lineTo(127,153);p.lineTo(125,260);p.lineTo(123,408);p.lineTo(170,408);p.lineTo(180,281);p.lineTo(190,408);p.lineTo(237,408);p.lineTo(235,260);p.lineTo(233,153);p.lineTo(252,249);p.lineTo(293,239);p.lineTo(264,63);p.lineTo(216,45);p.closePath();}return p;}
  function drawFabric(){
    fc.clearRect(0,0,360,440);if(draft.saree){drawSaree();return;}const path=silhouette();fc.save();fc.shadowColor='#29342a44';fc.shadowBlur=15;fc.shadowOffsetY=8;fc.fillStyle=draft.color;fc.fill(path);fc.restore();fc.save();fc.clip(path);fc.drawImage(W.texture(draft),0,0,360,440);const light=fc.createLinearGradient(30,0,320,0);light.addColorStop(0,'#0004');light.addColorStop(.4,'#ffffff15');light.addColorStop(.6,'#0000');light.addColorStop(1,'#0003');fc.fillStyle=light;fc.fillRect(0,0,360,440);fc.strokeStyle=draft.trim;fc.lineWidth=7;fc.stroke(path);if(draft.kind==='saree'){fc.lineWidth=14;fc.beginPath();fc.moveTo(250,48);fc.lineTo(115,230);fc.lineTo(94,412);fc.stroke();fc.lineWidth=2;fc.strokeStyle='#fff5';fc.beginPath();fc.moveTo(255,47);fc.lineTo(123,233);fc.lineTo(102,412);fc.stroke();}else if(draft.kind==='dress'){fc.fillStyle=draft.trim;fc.fillRect(125,175,110,10);fc.lineWidth=2;fc.strokeRect(161,173,37,13);}fc.restore();fc.strokeStyle='#243c3555';fc.lineWidth=1;fc.stroke(path);
  }
  function queueRender(){drawFabric();clearTimeout(renderTimer);const ticket=++revision;renderTimer=setTimeout(()=>W.render(draft,$('necklace').checked).then(c=>{if(ticket===revision)sprite=c;}).catch(e=>say(e.message)),100);}
  function sync(){
    const advanced=!!draft.saree;
    $('wearer').value=draft.who;$('garment').value=draft.kind;
    $('garment').querySelector('[value=suit]').hidden=draft.who!=='him';
    $('garment').querySelector('[value=saree]').hidden=draft.who==='him';
    $('garment').querySelector('[value=dress]').hidden=draft.who==='him';
    $('fabricColor').value=draft.color;$('trimColor').value=draft.trim;$('lookName').value=draft.name;
    $('kindLabel').textContent=advanced?'SAREE DESIGN WORKBENCH':draft.kind.toUpperCase()+' · YOUR DESIGN';
    fabric.style.cursor=advanced&&!closeUp?'pointer':'crosshair';
    $('sareeTools').hidden=!advanced;$('drapeTools').hidden=!advanced;$('sareeModes').hidden=!advanced;$('stampField').hidden=!advanced;
    $('legacyTools').hidden=advanced;$('upgradeSaree').hidden=advanced||draft.kind!=='saree';
    $('paintHint').textContent=advanced?'Choose a section and open Paint close-up. Brush and stamps stay on that section.':'Paint directly on the fabric.';
    $('artboardCaption').textContent='Colors, little flowers, a scribble. It’s yours.';
    document.querySelectorAll('[data-pattern]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.pattern===draft.pattern));
    if(!advanced){blouseView=false;$('blouseControls').hidden=true;$('palluTools').hidden=true;}
    if(advanced)updateZone();
    queueRender();
  }
  function point(e){
    const r=fabric.getBoundingClientRect();
    return [(e.clientX-r.left)*360/r.width,(e.clientY-r.top)*440/r.height];
  }
  function paintPoint(x,y){
    return draft.saree?[(x-swatch.x)/swatch.w,(y-swatch.y)/swatch.h]:[x/360,y/440];
  }
  function marks(){return draft.saree?draft.saree[selectedZone].marks:draft.strokes;}
  function inside(point){return point.every(n=>n>=0&&n<=1);}
  fabric.addEventListener('pointerdown',e=>{
    if(blouseView||paintPointer!==null||e.button!==0)return;
    const [x,y]=point(e);
    if(draft.saree&&!closeUp){
      const part=['border','pallu','pleats','body'].find(key=>fc.isPointInPath(drapeSketches[draft.drape][key],x,y));
      if(part)setZone(part);
      return;
    }
    const pt=paintPoint(x,y),list=marks(),limit=draft.saree?80:350;
    if(!inside(pt)||!draft.saree&&!fc.isPointInPath(silhouette(),x,y))return;
    if(draft.saree&&selectedZone==='pallu'){
      const hit=list.findLast(mark=>mark.stamp&&mark.points.length&&
        Math.hypot(mark.points[0][0]-pt[0],(mark.points[0][1]-pt[1])*swatch.h/swatch.w)<Math.max(.04,mark.size*.58));
      if(hit){
        e.preventDefault();selectedStamp=hit;activeMark=hit;paintPointer=e.pointerId;
        fabric.setPointerCapture(e.pointerId);updatePalluTools();drawFabric();return;
      }
    }
    if(list.length>=limit){say('This section is full. Undo or clear marks to add more.');return;}
    e.preventDefault();
    const stamp=draft.saree&&stampTool;
    const size=Number($('brushSize').value);
    activeMark={color:$('paintColor').value,size:stamp?size/100:size/360,points:[pt],...(stamp?{stamp}:{})};
    list.push(activeMark);
    if(stamp){
      if(selectedZone==='pallu'){selectedStamp=activeMark;updatePalluTools();}
      activeMark=null;queueRender();return;
    }
    painting=true;paintPointer=e.pointerId;fabric.setPointerCapture(e.pointerId);drawFabric();
  });
  fabric.addEventListener('pointermove',e=>{
    if(paintPointer!==e.pointerId)return;
    const pt=paintPoint(...point(e));
    if(activeMark.stamp){
      activeMark.points[0]=pt.map(n=>Math.max(0,Math.min(1,n)));drawFabric();
    }else if(painting&&activeMark.points.length<240&&inside(pt)){activeMark.points.push(pt);drawFabric();}
  });
  function endPaint(e){
    if(paintPointer!==e.pointerId)return;
    painting=false;paintPointer=null;activeMark=null;queueRender();
  }
  for(const event of ['pointerup','pointercancel','lostpointercapture'])fabric.addEventListener(event,endPaint);
  $('fabricColor').addEventListener('input',e=>{draft.color=e.target.value;queueRender();});
  $('trimColor').addEventListener('input',e=>{draft.trim=e.target.value;queueRender();});
  function switchGarment(who,kind){
    draft=W.normalize({who,kind,name:draft.name,color:draft.color,trim:draft.trim,...(kind==='saree'?{saree:{}}:{})});
    selectedZone='body';closeUp=false;blouseView=false;selectedStamp=null;sync();
  }
  $('wearer').addEventListener('change',e=>switchGarment(e.target.value,e.target.value==='him'?'suit':'saree'));
  $('garment').addEventListener('change',e=>switchGarment(draft.who,e.target.value));
  $('lookName').addEventListener('input',e=>draft.name=e.target.value);
  document.querySelectorAll('[data-pattern]').forEach(b=>b.onclick=()=>{draft.pattern=b.dataset.pattern;sync();});
  $('undoPaint').onclick=()=>{marks().pop();updatePalluTools();queueRender();};
  $('clearPaint').onclick=()=>{marks().length=0;updatePalluTools();queueRender();};
  for(const [id,field] of Object.entries(zoneFields))$(id).addEventListener('input',e=>{
    draft.saree[selectedZone][field]=field==='spacing'?Number(e.target.value):e.target.value;
    updateZone();queueRender();
  });
  zoneButtons.forEach(b=>b.onclick=()=>setZone(b.dataset.zone));
  $('swatchView').onclick=()=>setZone(selectedZone,!closeUp);
  $('blouseView').onclick=()=>{
    blouseView=!blouseView;closeUp=false;blouseBack=false;
    fabric.style.cursor=blouseView?'default':'pointer';updateZone();drawFabric();
  };
  $('blouseSide').onclick=()=>{blouseBack=!blouseBack;updateBlouseTools();drawFabric();};
  function editBlouse(field,value){
    draft.blouse={...getBlouse(),[field]:value};updateBlouseTools();queueRender();
  }
  $('blouseMatch').onchange=e=>editBlouse('match',e.target.checked);
  for(const [id,field] of Object.entries(blouseFields))$(id).oninput=e=>editBlouse(field,e.target.value);
  for(const [field,choices] of Object.entries(W.sareeOptions.blouseStyles)){
    fillOptions('blouse'+field[0].toUpperCase()+field.slice(1),choices);
  }
  $('addPalluStamp').onclick=()=>openMotifs('stamp');
  $('placedStamp').onchange=e=>{
    selectedStamp=e.target.value===''?null:palluMarks()[Number(e.target.value)];
    updatePalluTools();drawFabric();
  };
  $('palluSize').oninput=e=>{selectedStamp.size=Number(e.target.value)/100;queueRender();};
  $('palluAngle').oninput=e=>{selectedStamp.angle=Number(e.target.value);queueRender();};
  $('palluMirror').onchange=e=>{selectedStamp.mirror=e.target.checked;queueRender();};
  $('removePalluStamp').onclick=()=>{
    palluMarks().splice(palluMarks().indexOf(selectedStamp),1);
    selectedStamp=null;updatePalluTools();queueRender();
  };
  fabric.addEventListener('keydown',e=>{
    if($('palluTools').hidden||!selectedStamp)return;
    const delta={ArrowLeft:[-.015,0],ArrowRight:[.015,0],ArrowUp:[0,-.015],ArrowDown:[0,.015]}[e.key];
    if(!delta)return;
    e.preventDefault();
    selectedStamp.points[0]=selectedStamp.points[0].map((n,i)=>Math.max(0,Math.min(1,n+delta[i])));
    queueRender();
  });
  $('zoneMotif').onclick=()=>openMotifs('motif');
  $('zoneSecond').onclick=()=>openMotifs('secondMotif');
  $('paintTool').onclick=()=>openMotifs('stamp');
  $('walkPreview').onclick=()=>{
    walking=!walking;$('walkPreview').setAttribute('aria-pressed',walking);
    $('walkPreview').textContent=walking?'Walking':'Standing';
  };
  fillOptions('zoneFinish',W.sareeOptions.finishes);fillOptions('zoneAccent',W.sareeOptions.accents);
  fillOptions('zoneLayout',W.sareeOptions.layouts);buildDrapeChoices();
  fillOptions('sareeRecipe',recipes.map(([name])=>name+' inspired'));
  function showRecipe(){$('sareeRecipeNote').textContent=recipes[Number($('sareeRecipe').value)][1];}
  $('sareeRecipe').onchange=showRecipe;
  $('applyRecipe').onclick=()=>applyRecipe(Number($('sareeRecipe').value));
  $('upgradeSaree').onclick=()=>{
    const original=draft;
    draft=W.normalize({...original,id:'',name:(original.name.slice(0,42)+' · copy'),strokes:[],saree:{
      body:{motif:original.pattern,marks:original.strokes}
    }});
    sync();say('Working on a new copy. The saved original stays in your closet.');
  };
  showRecipe();
  function save(wear){try{const stampIndex=draft.saree?palluMarks().indexOf(selectedStamp):-1;
    draft=W.save(draft);selectedStamp=stampIndex<0?null:palluMarks()[stampIndex];updatePalluTools();if(wear){W.equip(draft.id);W.setNecklace($('necklace').checked);}say(wear?'Your original is saved and ready to wear across the game.':'Saved to your little closet.');buildCloset();}catch(e){say('Could not save: '+e.message);}}
  $('saveLook').onclick=()=>save(false);$('wearLook').onclick=()=>save(true);$('necklace').checked=W.read().necklace;$('necklace').onchange=queueRender;
  $('newLook').onclick=()=>{draft=W.normalize({name:'My next little original',who:draft.who,kind:draft.kind,color:draft.color,trim:draft.trim,strokes:[],...(draft.kind==='saree'?{saree:{}}:{})});selectedZone='body';closeUp=false;blouseView=false;selectedStamp=null;sync();say('A fresh canvas, just for you.');};
  document.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>{row=Number(b.dataset.dir);auto=false;$('turnPreview').setAttribute('aria-pressed','false');});$('turnPreview').onclick=()=>{auto=!auto;turnStart=performance.now();$('turnPreview').setAttribute('aria-pressed',auto);};
  function previewPreset(id){clearTimeout(renderTimer);const ticket=++revision;W.render(W.presetDesign(id),false).then(c=>{if(ticket===revision)sprite=c;}).catch(e=>say(e.message));say(W.presetDesign(id).name+' · a ready-made occasion look.');}
  function buildOccasions(){const closet=$('occasionLooks');closet.replaceChildren();W.presets().forEach(p=>{const el=document.createElement('div');el.className='closet-look';const title=document.createElement('strong');title.textContent=p.name;const note=document.createElement('p');note.className='hint';note.textContent=p.description;const row=document.createElement('div');row.className='row';[['Preview',()=>previewPreset(p.id)],['Wear everywhere',()=>{try{W.wearPreset(p.id);previewPreset(p.id);buildCloset();say(p.name+' is saved and ready to wear across the game.');}catch(e){say(e.message);}}]].forEach(([label,fn])=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;row.appendChild(b);});el.append(title,note,row);closet.appendChild(el);});}
  function buildCloset(){const closet=$('closet');closet.replaceChildren();const saved=W.read();if(!saved.designs.length){const p=document.createElement('p');p.className='hint';p.textContent='Your first original will live here.';closet.appendChild(p);}saved.designs.forEach(d=>{const el=document.createElement('div');el.className='closet-look';const title=document.createElement('strong');title.textContent=d.name+(saved.equipped[d.who]===d.id?' · wearing':'');el.appendChild(title);const r=document.createElement('div');r.className='row';[[d.preset?'Preview':'Edit',()=>{if(d.preset)previewPreset(d.preset);else{draft=W.normalize(d);sync();}}],['Wear',()=>{try{W.equip(d.id);buildCloset();say(d.name+' is now on.');}catch(e){say(e.message);}}],['Remove',()=>{try{W.remove(d.id);buildCloset();}catch(e){say(e.message);}}]].forEach(([name,fn])=>{const b=document.createElement('button');b.textContent=name;b.onclick=fn;r.appendChild(b);});el.appendChild(r);closet.appendChild(el);});}
  $('exportLook').onclick=()=>{const blob=new Blob([JSON.stringify(W.normalize(draft),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(draft.name||'my-outfit').replace(/[^a-z0-9_-]+/gi,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('importLook').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>4000000)throw new Error('Choose a design file smaller than 4 MB.');const d=JSON.parse(await f.text());if(!d||!['her','him'].includes(d.who)||!Array.isArray(d.strokes))throw new Error('This is not an outfit design file.');draft=W.normalize(d);sync();say('Imported. Save it to keep it in this closet.');}catch(error){say('Could not import: '+error.message);}e.target.value='';};
  const directions=['FRONT','LEFT','BACK','RIGHT'];
  function loop(now){
    pc.clearRect(0,0,256,256);
    if(auto)row=Math.floor((now-turnStart)/1900)%4;
    const label=directions[row]+(walking?' · WALKING PREVIEW':' · STANDING PREVIEW');
    if($('previewDirection').textContent!==label)$('previewDirection').textContent=label;
    if(sprite)window.WalkingSprites.draw(pc,sprite,row,walking?Math.floor(now/170)%4:0,128,242,228);
    requestAnimationFrame(loop);
  }
  applyRecipe(0,false);buildOccasions();buildCloset();requestAnimationFrame(loop);
})();
