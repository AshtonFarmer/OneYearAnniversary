// Lightweight design records; rendered sheets are cached in memory, not stored
// as megabytes of data URLs. All sixteen original movement cells are preserved.
(function(){
  'use strict';
  const KEY='ourYear.wardrobe.v1', rawSheets=new Map(), rendered=new Map();
  const presets=[
    {id:'tanima-pool-day',who:'her',base:12,name:'Tanima · teal bikini',occasion:'swimming',description:'A teal bikini and bare feet for our first swim.'},
    {id:'ashton-pool-day',who:'him',base:12,name:'Ashton · swim trunks',occasion:'swimming',description:'Navy swim trunks with gold side stripes and bare feet.'},
    {id:'tanima-welcome-home',who:'her',base:13,name:'Tanima · welcome home',occasion:'homecoming',description:'The light-blue T-shirt and patterned shorts from our welcome-home photos.'}
  ];
  const sareeZones=['body','pleats','pallu','border'];
  const motifs={
    none:'Plain',buti:'Woven buti',lotus:'Lotus',paisley:'Mango paisley',vine:'Flowering vine',
    peacock:'Peacock',ikat:'Ikat diamonds',bandhani:'Tie-dye dots',temple:'Temple points',
    kantha:'Running stitches',checks:'Checks',stripes:'Stripes',flowers:'Blossoms',stars:'Stars',
    arch:'Palace arches',moon:'Moon and stars',heart:'Hearts',
    jasmine:'Jasmine',marigold:'Marigold',fern:'Fern frond',parrot:'Parrot',elephant:'Elephant',
    swan:'Swan',fish:'Fish',coin:'Coin medallion',trellis:'Diamond trellis',sunburst:'Sunburst',
    chevron:'Chevron',wave:'Scalloped waves',diya:'Puja lamp',eclipse:'Eclipse',fireworks:'Fireworks',
    lotuspond:'Lotus pond',railroad:'Railroad Park skyline',jeep:'Little Jeep'
  };
  const drapes={classic:'Classic shoulder drape',bengali:'Bengali-inspired wrap',gujarati:'Gujarati-inspired front pallu'};
  const blouseStyles={
    neck:{round:'Round',square:'Square',vee:'V-neck',high:'High neck'},
    sleeve:{short:'Short',cap:'Cap',elbow:'Elbow length'},
    back:{closed:'Closed',scoop:'Scoop',keyhole:'Keyhole'}
  };
  const finishes={cotton:'Matte cotton',silk:'Silk sheen',brocade:'Brocade',tissue:'Shimmer tissue',linen:'Linen',velvet:'Velvet finish'};
  const accents={none:'None',gold:'Gold zari',silver:'Silver zari',rose:'Rose-gold thread',pearls:'Pearls',ruby:'Ruby accents',emerald:'Emerald accents'};
  const layouts={repeat:'All-over repeat',scattered:'Staggered repeat',bands:'Woven bands',panel:'Statement centerpiece'};
  const pick=(value,choices,fallback)=>Object.hasOwn(choices,value)?value:fallback;
  const hex=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(value)?value:fallback;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function normalizeMarks(marks,limit){
    return (Array.isArray(marks)?marks:[]).slice(-limit).map(s=>({
      color:hex(s?.color,'#ffffff'),
      size:clamp(Number(s?.size)||.025,.005,.30),
      points:(Array.isArray(s?.points)?s.points:[]).slice(0,240)
        .filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))
        .map(p=>p.map(n=>Math.round(clamp(n,0,1)*10000)/10000)),
      ...(s?.stamp&&s.stamp!=='none'&&Object.hasOwn(motifs,s.stamp)?{
        stamp:s.stamp,angle:clamp(Number(s.angle)||0,-180,180),mirror:s.mirror===true
      }:{})
    }));
  }
  function normalizeSaree(zones,color,trim){
    return Object.fromEntries(sareeZones.map(key=>{
      const zone=zones[key]||{};
      return [key,{
        color:hex(zone.color,key==='border'?trim:color),ink:hex(zone.ink,key==='border'?color:trim),
        motif:pick(zone.motif,motifs,'none'),secondMotif:pick(zone.secondMotif,motifs,'none'),
        secondInk:hex(zone.secondInk,'#e9a7a7'),finish:pick(zone.finish,finishes,'silk'),
        accent:pick(zone.accent,accents,'none'),layout:pick(zone.layout,layouts,'repeat'),
        spacing:clamp(Number(zone.spacing)||48,24,82),marks:normalizeMarks(zone.marks,80)
      }];
    }));
  }
  let saved=read();
  function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return v&&v.version===1?v:{version:1,designs:[],equipped:{},necklace:false};}catch(e){return {version:1,designs:[],equipped:{},necklace:false};}}
  function persist(){localStorage.setItem(KEY,JSON.stringify(saved));rendered.clear();dispatchEvent(new CustomEvent('wardrobechange'));}
  function rgb(hex){const n=parseInt((/^#[0-9a-f]{6}$/i.test(hex)?hex:'#6e8b73').slice(1),16);return [n>>16,(n>>8)&255,n&255];}
  function normalize(d){
    const who=d.who==='him'?'him':'her',preset=presets.find(p=>p.id===d.preset&&p.who===who),kind=preset?'preset':who==='him'?'suit':(d.kind==='dress'?'dress':'saree');
    const color=hex(d.color,'#728d77'),trim=hex(d.trim,'#e5ba65');
    const blouse=d.blouse&&typeof d.blouse==='object'?{
      match:d.blouse.match!==false,
      color:hex(d.blouse.color,color),trim:hex(d.blouse.trim,trim),
      ...Object.fromEntries(Object.entries(blouseStyles).map(([key,options])=>[key,pick(d.blouse[key],options,Object.keys(options)[0])]))
    }:null;
    return {
      id:String(d.id||'look-'+Date.now()),name:String(d.name||'My new look').slice(0,50),who,kind,
      base:preset?preset.base:who==='him'?6:kind==='dress'?5:1,
      ...(preset?{preset:preset.id}:{}),color,trim,
      pattern:['none','flowers','stars','stripes','checks'].includes(d.pattern)?d.pattern:'none',
      strokes:normalizeMarks(d.strokes,350).map(({color,size,points})=>({color,size:Math.min(.15,size),points})),
      ...(kind==='saree'&&d.saree&&typeof d.saree==='object'?{saree:normalizeSaree(d.saree,color,trim),drape:pick(d.drape,drapes,'classic'),...(blouse?{blouse}:{})}:{})
    };
  }
  function save(design){const d=normalize(design);const i=saved.designs.findIndex(x=>x.id===d.id);if(i>=0)saved.designs[i]=d;else {if(saved.designs.length>=30)throw new Error('Your closet holds 30 designs. Remove one before saving another.');saved.designs.push(d);}persist();return d;}
  function equip(id){const d=saved.designs.find(x=>x.id===id);if(!d)throw new Error('That saved look is missing.');saved.equipped[d.who]=id;localStorage.setItem(d.who+'Outfit',String(d.base));persist();return d;}
  function unequip(who){delete saved.equipped[who];persist();}
  function remove(id){saved.designs=saved.designs.filter(d=>d.id!==id);Object.keys(saved.equipped).forEach(who=>{if(saved.equipped[who]===id)delete saved.equipped[who];});persist();}
  function texture(d){
    const c=document.createElement('canvas');c.width=256;c.height=320;const p=c.getContext('2d');p.fillStyle=d.color;p.fillRect(0,0,256,320);p.strokeStyle=d.trim;p.fillStyle=d.trim;p.lineWidth=2;
    for(let y=15;y<320;y+=34)for(let x=15;x<256;x+=34){
      if(d.pattern==='stars'){p.beginPath();p.moveTo(x,y-5);p.lineTo(x+2,y-1);p.lineTo(x+6,y);p.lineTo(x+2,y+2);p.lineTo(x,y+6);p.lineTo(x-2,y+2);p.lineTo(x-6,y);p.lineTo(x-2,y-1);p.closePath();p.fill();}
      if(d.pattern==='flowers'){for(let k=0;k<5;k++){p.beginPath();p.ellipse(x+Math.sin(k*1.257)*4,y+Math.cos(k*1.257)*4,2,4,-k*1.257,0,7);p.fill();}p.fillStyle=d.color;p.fillRect(x-1,y-1,2,2);p.fillStyle=d.trim;}
      if(d.pattern==='checks'){p.globalAlpha=.35;p.fillRect(x-15,y-15,16,16);p.globalAlpha=1;}
    }
    if(d.pattern==='stripes'){p.globalAlpha=.55;for(let x=0;x<256;x+=16)p.fillRect(x,0,2,320);p.globalAlpha=1;}
    paintMarks(p,d.strokes);
    return c;
  }
  function motif(p,name,x,y,size,ink,ground){
    p.save();p.translate(x,y);p.scale(size,size);p.fillStyle=ink;p.strokeStyle=ink;p.lineWidth=.09;
    const path=(points,closed=false)=>{
      p.beginPath();points.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));
      if(closed){p.closePath();p.fill();}else p.stroke();
    };
    const dot=(x,y,r)=>{p.beginPath();p.arc(x,y,r,0,Math.PI*2);p.fill();};
    const oval=(x,y,rx,ry,angle=0)=>{p.beginPath();p.ellipse(x,y,rx,ry,angle,0,Math.PI*2);p.fill();};
    switch(name){
      case 'buti':
        path([[0,-.52],[.27,-.12],[.12,.24],[0,.45],[-.12,.24],[-.27,-.12]],true);
        dot(-.31,.20,.06);dot(.31,.20,.06);break;
      case 'lotus':
        oval(0,-.16,.13,.34);oval(-.21,-.05,.12,.30,-.72);oval(.21,-.05,.12,.30,.72);
        path([[-.42,.16],[-.25,.34],[.25,.34],[.42,.16]]);break;
      case 'paisley':
        p.beginPath();p.moveTo(.41,-.49);p.bezierCurveTo(-.29,-.55,-.61,-.02,-.38,.32);
        p.bezierCurveTo(-.14,.65,.39,.46,.28,.14);p.bezierCurveTo(.19,-.07,.05,-.15,.41,-.49);p.fill();
        p.fillStyle=ground;dot(-.13,.19,.10);dot(-.20,-.02,.05);break;
      case 'vine':
        path([[-.49,.36],[-.25,-.07],[.12,.08],[.44,-.35]]);
        oval(-.30,-.16,.10,.20,-.72);oval(.12,.25,.12,.20,-.7);oval(.34,-.17,.10,.18,.9);break;
      case 'peacock':
        for(let k=-2;k<=2;k++){
          const angle=k*.48;
          oval(Math.sin(angle)*.37-.10,-Math.cos(angle)*.39,.10,.23,angle);
        }
        oval(-.04,.09,.26,.18);oval(.18,-.09,.09,.22,.22);dot(.24,-.29,.11);
        path([[.31,-.32],[.46,-.27],[.30,-.23]],true);path([[-.06,.19],[-.06,.35],[.13,.35]]);break;
      case 'ikat':
        path([[0,-.53],[.16,-.32],[.25,-.32],[.25,-.20],[.49,0],[.25,.20],[.25,.32],[.16,.32],[0,.53],[-.16,.32],[-.25,.32],[-.25,.20],[-.49,0],[-.25,-.20],[-.25,-.32],[-.16,-.32]],true);
        p.fillStyle=ground;path([[0,-.25],[.21,0],[0,.25],[-.21,0]],true);break;
      case 'bandhani':
        for(let k=0;k<8;k++)dot(Math.sin(k*Math.PI/4)*.30,Math.cos(k*Math.PI/4)*.30,.07);
        dot(0,0,.065);break;
      case 'temple':
        path([[-.51,.31],[-.35,.08],[-.24,.14],[0,-.48],[.24,.14],[.35,.08],[.51,.31]],true);break;
      case 'kantha':
        path([[-.5,.18],[-.31,-.01]]);path([[-.20,-.13],[-.02,-.31]]);
        path([[.08,-.24],[.25,-.07]]);path([[.33,.04],[.51,.22]]);break;
      case 'checks':p.fillRect(-.40,-.40,.40,.40);p.fillRect(0,0,.40,.40);break;
      case 'stripes':p.fillRect(-.13,-.5,.10,1);p.fillRect(.03,-.5,.10,1);break;
      case 'flowers':
        for(let k=0;k<5;k++)oval(Math.sin(k*1.257)*.26,Math.cos(k*1.257)*.26,.13,.20,-k*1.257);
        p.fillStyle=ground;dot(0,0,.09);break;
      case 'arch':
        p.beginPath();p.moveTo(-.43,.42);p.lineTo(-.43,-.05);p.quadraticCurveTo(-.36,-.35,0,-.51);
        p.quadraticCurveTo(.36,-.35,.43,-.05);p.lineTo(.43,.42);p.stroke();dot(0,0,.13);
        path([[-.50,.43],[.50,.43]]);break;
      case 'moon':
        dot(-.10,.04,.33);p.fillStyle=ground;dot(.05,-.06,.29);p.fillStyle=ink;dot(.34,-.21,.07);dot(.31,.14,.04);break;
      case 'stars':
        path([[0,-.48],[.09,-.10],[.43,0],[.09,.10],[0,.48],[-.09,.10],[-.43,0],[-.09,-.10]],true);break;
      case 'jasmine':
        for(let k=0;k<6;k++){p.save();p.rotate(k*Math.PI/3);oval(0,-.25,.12,.26,.26);p.restore();}
        p.fillStyle=ground;dot(0,0,.09);break;
      case 'marigold':
        for(let k=0;k<10;k++)dot(Math.sin(k*Math.PI/5)*.30,Math.cos(k*Math.PI/5)*.30,.14);
        dot(0,0,.31);p.fillStyle=ground;dot(0,0,.13);p.fillStyle=ink;dot(0,0,.06);break;
      case 'fern':
        path([[0,-.49],[0,.50]]);
        for(let k=0;k<4;k++){
          const y=-.29+k*.19,offset=.11+k*.046;
          oval(-offset,y,.07,offset,-.85);oval(offset,y,.07,offset,.85);
        }
        break;
      case 'parrot':
        oval(-.06,.04,.23,.29,-.52);dot(.17,-.26,.17);
        path([[.27,-.34],[.46,-.26],[.27,-.17]],true);
        path([[-.10,.10],[-.46,.48],[-.18,.40],[.03,.22]],true);
        p.fillStyle=ground;dot(.20,-.29,.045);oval(-.10,.04,.073,.16,-.62);break;
      case 'elephant':
        oval(-.10,-.06,.37,.27);dot(.25,-.10,.22);
        p.fillRect(-.37,.08,.13,.27);p.fillRect(-.03,.10,.13,.25);
        path([[.40,-.10],[.44,.20],[.34,.30],[.26,.23]]);
        path([[-.42,-.06],[-.51,.14]]);p.fillStyle=ground;dot(.32,-.17,.04);
        oval(.13,-.07,.076,.13,-.35);break;
      case 'swan':
        oval(-.12,.16,.35,.18);path([[.18,.19],[.28,-.07],[.20,-.28],[.08,-.32],[.01,-.23]]);
        dot(.08,-.28,.11);path([[.01,-.31],[-.19,-.25],[.03,-.23]],true);
        p.fillStyle=ground;oval(-.20,.12,.21,.058,.25);break;
      case 'fish':
        oval(.07,0,.32,.22);path([[-.19,0],[-.49,-.26],[-.49,.26]],true);
        p.fillStyle=ground;dot(.25,-.06,.055);p.strokeStyle=ground;path([[.06,-.14],[.12,0],[.06,.14]]);break;
      case 'coin':
        dot(0,0,.44);p.fillStyle=ground;dot(0,0,.32);p.fillStyle=ink;dot(0,0,.19);
        for(let k=0;k<8;k++)dot(Math.sin(k*Math.PI/4)*.53,Math.cos(k*Math.PI/4)*.53,.04);break;
      case 'trellis':
        path([[0,-.52],[.49,0],[0,.52],[-.49,0],[0,-.52]]);
        path([[-.25,0],[0,-.25],[.25,0],[0,.25],[-.25,0]]);dot(0,0,.07);break;
      case 'sunburst':
        for(let k=0;k<12;k++){p.save();p.rotate(k*Math.PI/6);path([[-.05,-.28],[0,-.53],[.05,-.28]],true);p.restore();}
        dot(0,0,.23);p.fillStyle=ground;dot(0,0,.09);break;
      case 'chevron':
        for(const y of [-.22,.03,.28])path([[-.49,y-.17],[0,y+.09],[.49,y-.17]]);break;
      case 'wave':
        for(const y of [-.25,.03,.31]){
          p.beginPath();p.moveTo(-.51,y);p.quadraticCurveTo(-.26,y-.35,0,y);
          p.quadraticCurveTo(.26,y-.35,.51,y);p.stroke();
        }
        break;
      case 'diya':
        p.beginPath();p.moveTo(-.46,.02);p.quadraticCurveTo(-.25,.51,0,.45);
        p.quadraticCurveTo(.25,.51,.46,.02);p.quadraticCurveTo(0,.20,-.46,.02);p.fill();
        p.beginPath();p.moveTo(.03,-.51);p.quadraticCurveTo(.37,-.15,.03,-.01);
        p.quadraticCurveTo(-.23,-.16,.03,-.51);p.fill();break;
      case 'eclipse':
        dot(0,0,.43);p.fillStyle=ground;dot(.045,-.018,.35);p.fillStyle=ink;dot(.33,-.29,.075);break;
      case 'fireworks':
        for(let k=0;k<10;k++){p.save();p.rotate(k*Math.PI/5);path([[0,-.15],[0,-.39]]);dot(0,-.53,.034);p.restore();}
        dot(0,0,.06);break;
      case 'lotuspond':
        oval(0,-.15,.13,.28);oval(-.21,-.05,.11,.22,-.72);oval(.21,-.05,.11,.22,.72);
        for(const y of [.22,.37])path([[-.47,y],[-.24,y+.05],[0,y],[.24,y+.05],[.47,y]]);break;
      case 'railroad':
        path([[-.51,.27],[-.51,-.12],[-.34,-.12],[-.34,.02],[-.23,.02],[-.23,-.41],
          [-.07,-.41],[-.07,-.19],[.08,-.19],[.08,-.32],[.27,-.32],[.27,.03],[.47,.03],[.47,.27]],true);
        path([[-.49,.40],[.49,.40]]);break;
      case 'jeep':
        path([[-.50,.23],[-.50,-.02],[-.24,-.02],[-.13,-.30],[.33,-.30],[.43,-.08],[.50,-.08],[.50,.23]],true);
        dot(-.30,.24,.15);dot(.31,.24,.15);p.fillStyle=ground;
        p.fillRect(-.10,-.23,.17,.15);p.fillRect(.13,-.23,.16,.15);dot(-.30,.24,.058);dot(.31,.24,.058);break;
      case 'heart':
        p.beginPath();p.moveTo(0,.43);p.bezierCurveTo(-.87,-.12,-.39,-.59,0,-.23);
        p.bezierCurveTo(.39,-.59,.87,-.12,0,.43);p.fill();break;
    }
    p.restore();
  }
  function paintMarks(p,marks,ground){
    for(const mark of marks){
      if(!mark.points.length)continue;
      const [x,y]=mark.points[0];
      if(mark.stamp){
        p.save();p.translate(x*256,y*320);p.rotate((mark.angle||0)*Math.PI/180);
        if(mark.mirror)p.scale(-1,1);
        motif(p,mark.stamp,0,0,mark.size*256,mark.color,ground);p.restore();continue;
      }
      p.strokeStyle=mark.color;p.fillStyle=mark.color;p.lineWidth=mark.size*256;
      p.lineCap='round';p.lineJoin='round';p.beginPath();
      if(mark.points.length===1){p.arc(x*256,y*320,p.lineWidth/2,0,7);p.fill();continue;}
      mark.points.forEach(([x,y],i)=>i?p.lineTo(x*256,y*320):p.moveTo(x*256,y*320));p.stroke();
    }
  }
  function sareeTexture(zone){
    const c=document.createElement('canvas');c.width=256;c.height=320;
    const p=c.getContext('2d'),{color,ink,finish,layout,spacing,accent,marks}=zone;
    p.fillStyle=color;p.fillRect(0,0,256,320);
    const shine={cotton:.02,silk:.27,brocade:.19,tissue:.37,linen:.04,velvet:.15}[finish];
    const light=p.createLinearGradient(0,60,256,270);
    light.addColorStop(0,'#0004');light.addColorStop(.42,'rgba(255,255,255,'+shine+')');
    light.addColorStop(.69,'#0000');light.addColorStop(1,finish==='velvet'?'#0007':'#0002');
    p.fillStyle=light;p.fillRect(0,0,256,320);
    p.fillStyle=finish==='tissue'?'#ffedac33':'#fff2';
    const thread=finish==='linen'?7:finish==='brocade'?3:5;
    for(let y=2;y<320;y+=thread)p.fillRect(0,y,256,finish==='linen'?1.2:.55);
    if(zone.motif!=='none'){
      if(layout==='panel'){
        motif(p,zone.motif,128,160,142,ink,color);
        for(const y of [27,293])for(let x=24;x<256;x+=41)motif(p,zone.motif,x,y,20,ink,color);
      }else{
        const stride=layout==='bands'?spacing*1.65:spacing;
        for(let y=spacing/2,line=0;y<320;y+=stride,line++)for(let x=spacing/2;x<256+spacing/2;x+=spacing){
          const offset=layout==='scattered'&&line%2?spacing/2:0;
          motif(p,zone.motif,x-offset,y,spacing*.66,ink,color);
        }
      }
    }
    if(zone.secondMotif&&zone.secondMotif!=='none'){
      const secondInk=zone.secondInk;
      if(layout==='panel'){
        for(const y of [105,215])for(const x of [44,212])motif(p,zone.secondMotif,x,y,37,secondInk,color);
      }else{
        const stride=layout==='bands'?spacing*1.65:spacing;
        for(let y=stride/2+spacing/2,line=0;y<320;y+=stride,line++)for(let x=spacing;x<256+spacing;x+=spacing){
          const offset=layout==='scattered'&&line%2?spacing/2:0;
          motif(p,zone.secondMotif,x-offset,y,spacing*.49,secondInk,color);
        }
      }
    }
    if(accent&&accent!=='none'){
      const metal={gold:'#ffdb79',silver:'#edf7ff',rose:'#ffb6a3',pearls:'#fff3d7',ruby:'#f06b97',emerald:'#7bf1ba'}[accent];
      if(['gold','silver','rose'].includes(accent)){
        p.fillStyle=metal;p.globalAlpha=.8;
        for(const y of [5,11,308,314])p.fillRect(0,y,256,y===11||y===308?1:2);
      }else{
        p.fillStyle=metal;
        for(let y=14,line=0;y<320;y+=29,line++)for(let x=15+(line%2)*17;x<256;x+=35){
          p.beginPath();p.arc(x,y,3.2,0,7);p.fill();
          p.fillStyle='#fff';p.fillRect(x-1.5,y-1.5,1.5,1.5);p.fillStyle=metal;
        }
      }
      p.globalAlpha=1;
    }
    paintMarks(p,marks,color);
    return c;
  }
  // Keep the original animation and color only garment pixels. The wraps
  // change which portions of the fabric cross the chest, hip, and back.
  function sareePoint(row,x,y,border,drape){
    if(drape==='bengali'||drape==='gujarati'){
      const bengali=drape==='bengali';
      const width=bengali?.17:.29;
      const frontDepth=bengali?.33:.40;
      const center=row===0?(bengali?.27+(y-.45)*1.03:.34+(y-.45)*.47):
        row===1?.58-(y-.46)*.45:row===2?.53+(y-.69)*(bengali?-.60:.60):.43+(y-.46)*.4;
      const start=row===2?.69:.45;
      const depth=row===2?.22:row===0?frontDepth:.33;
      const edge=Math.abs(x-center);
      if(y>=start&&y<start+depth&&edge<width){
        const u=(x-center+width)/(width*2),v=(y-start)/depth;
        return (edge>width-(bengali?.055:.027)||v>.91)?['border',u,v]:['pallu',u,v];
      }
      if(y>.94||border&&y>.90)return ['border',x,(y-.90)/.10];
      if(y>.72&&row===0&&Math.abs(x-(bengali?.37:.5))<(bengali?.11:.17))return ['pleats',x,(y-.72)/.28];
      return ['body',x,(y-.42)/.58];
    }
    if(border)return ['border',x,clamp((y-.42)/.58,0,1)];
    const center=row===0?.84-(y-.46)*1.15:row===1?.44-(y-.48)*.7:row===2?.54+(y-.70)*.78:.55+(y-.48)*.7;
    const onPallu=row===2?y>.70&&y<.89:y<.79;
    if(onPallu&&Math.abs(x-center)<.19)return ['pallu',(x-center+.19)/.38,(y-(row===2?.70:.45))/(row===2?.19:.34)];
    if(y>.71&&(row===0||row===2)&&x>.30&&x<.64)return ['pleats',(x-.30)/.34,(y-.71)/.29];
    return ['body',x,(y-.42)/.58];
  }
  function sheet(who,base){
    const path='assets/sprites/'+who+(base===1?'_atlas':'_outfit'+base)+'.png';
    if(!rawSheets.has(path))rawSheets.set(path,new Promise((resolve,reject)=>{const i=new Image();i.wardrobeRaw=true;i.onload=()=>resolve(i);i.onerror=()=>{rawSheets.delete(path);reject(new Error('The original outfit could not load.'));};i.src=path+'?wardrobe-base=1';}));
    return rawSheets.get(path);
  }
  async function render(input,necklace){
    const d=input?normalize(input):null,who=d?d.who:'her',base=d?d.base:1;
    const image=await sheet(who,base),c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;c.wardrobeSource=image.src;
    const p=c.getContext('2d',{willReadFrequently:true});p.drawImage(image,0,0);
    if(d&&!d.preset){
      const pixels=p.getImageData(0,0,c.width,c.height),a=pixels.data;
      const enhanced=d.saree&&Object.fromEntries(sareeZones.map(key=>[key,sareeTexture(d.saree[key]).getContext('2d').getImageData(0,0,256,320).data]));
      const blouse=d.blouse&&!d.blouse.match?{color:rgb(d.blouse.color),trim:rgb(d.blouse.trim)}:null;
      const t=enhanced?null:texture(d).getContext('2d').getImageData(0,0,256,320).data,trim=rgb(d.trim);
      const cw=c.width/4,ch=c.height/4;
      for(let row=0;row<4;row++)for(let col=0;col<4;col++){
        let x0=cw,y0=ch,x1=0,y1=0;
        for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const i=((row*ch+y)*c.width+col*cw+x)*4;if(a[i+3]>30){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
        const h=y1-y0,w=x1-x0;
        for(let y=Math.max(y0,Math.floor(y0+h*(enhanced?.43:.50)));y<=y1;y++)for(let x=x0;x<=x1;x++){
          const i=((row*ch+y)*c.width+col*cw+x)*4;if(a[i+3]<30)continue;
          const fy=(y-y0)/h,fx=(x-x0)/w,r=a[i],g=a[i+1],b=a[i+2],lum=(r+g+b)/3;
          // Hair and skin remain original. The back-facing hair extends lower.
          if(fy<(enhanced?.43:.50))continue;
          if(row===2&&fy<.70)continue;
          if((row===1&&fx>.55||row===3&&fx<.45)&&fy<.68)continue;
          if(enhanced&&(fy<.53&&(fx<.28||fx>.78)||y<105))continue;
          let cloth=false,border=false;
          if(d.kind==='saree'){cloth=r>55&&g<r*.48&&b<r*.60; border=r>120&&g>r*.53&&g<r*.9&&b<g*.65;}
          else if(d.kind==='dress')cloth=r>120&&g>88&&b>85&&r-g<50&&g-b<38;
          else cloth=lum>23&&lum<115&&Math.max(r,g,b)-Math.min(r,g,b)<40;
          if(!cloth&&!border)continue;
          if(enhanced){
            const [part,sx,sy]=sareePoint(row,fx,fy,border,d.drape);
            const shade=.46+lum/285;
            if(blouse&&row!==2&&fy<.59&&fx>.24&&fx<.80&&part==='body'){
              const thread=fy<.48?blouse.trim:blouse.color;
              for(let k=0;k<3;k++)a[i+k]=Math.min(255,thread[k]*shade);
              continue;
            }
            const sample=(clamp(Math.floor(sy*320),0,319)*256+clamp(Math.floor(sx*256),0,255))*4;
            for(let k=0;k<3;k++)a[i+k]=Math.min(255,enhanced[part][sample+k]*shade);
            continue;
          }
          const u=Math.max(0,Math.min(255,Math.floor(fx*255))),v=Math.max(0,Math.min(319,Math.floor((fy-.50)/.50*319))),ti=(v*256+u)*4;
          const shade=d.kind==='saree'?.43+lum/240:(d.kind==='suit'?.60+lum/180:.35+lum/340);
          for(let k=0;k<3;k++)a[i+k]=Math.min(255,(border?trim[k]:t[ti+k])*shade);
        }
      }
      p.putImageData(pixels,0,0);
    }
    if(necklace&&who==='her')drawNecklace(p,c.width/4,c.height/4);
    return c;
  }
  function drawNecklace(p,cw,ch){
    for(let row=0;row<4;row++){if(row===2)continue;for(let col=0;col<4;col++){
      p.save();p.translate(col*cw,row*ch);const x=cw*.50+(row===1?-.045*cw:(row===3?.045*cw:0)),y=ch*.52;
      p.strokeStyle='#efc867';p.lineWidth=1.7;p.beginPath();p.moveTo(x-8,y-6);p.quadraticCurveTo(x,y+10,x+8,y-6);p.stroke();p.fillStyle='#a82029';p.beginPath();p.arc(x,y+6,5.2,0,7);p.fill();p.fillStyle='#ffdf65';p.beginPath();p.moveTo(x+1,y+1);p.lineTo(x-3,y+7);p.lineTo(x,y+7);p.lineTo(x-1,y+12);p.lineTo(x+4,y+5);p.lineTo(x+1,y+5);p.closePath();p.fill();p.restore();
    }}
  }
  function getSprite(image){
    if(!image||image.wardrobeRaw||!image.src||/[?&]wardrobe-(base|preview)=/.test(image.src))return null;
    const match=image.src.match(/assets\/sprites\/(her|him)_(atlas|outfit\d+)\.png(?:[?#]|$)/);if(!match)return null;
    const who=match[1],d=saved.designs.find(x=>x.id===saved.equipped[who]);
    const necklace=who==='her'&&saved.necklace;if(!d&&!necklace)return null;
    const key=image.src+'|'+(d?d.id:'')+'|'+necklace;
    if(!rendered.has(key)){
      const record={canvas:null};rendered.set(key,record);
      // For the accessory alone, use the exact currently selected sheet.
      const promise=d?render(d,necklace):new Promise((resolve,reject)=>{
        const i=new Image();i.wardrobeRaw=true;i.onload=()=>{const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;c.wardrobeSource=i.src;const p=c.getContext('2d');p.drawImage(i,0,0);drawNecklace(p,c.width/4,c.height/4);resolve(c);};i.onerror=reject;i.src=image.src+(image.src.includes('?')?'&':'?')+'wardrobe-base=1';
      });promise.then(canvas=>{record.canvas=canvas;}).catch(()=>{});
    }
    return rendered.get(key).canvas;
  }
  function addams(){
    const her=save({id:'addams-morticia',name:'Morticia · our Halloween',who:'her',kind:'dress',color:'#17131e',trim:'#9b7fa7',pattern:'none',strokes:[]});
    const him=save({id:'addams-gomez',name:'Gomez · our Halloween',who:'him',kind:'suit',color:'#171b2e',trim:'#b5c9d2',pattern:'stripes',strokes:[]});equip(her.id);equip(him.id);return [her,him];
  }
  function presetDesign(id){const p=presets.find(p=>p.id===id);if(!p)throw new Error('That occasion outfit is missing.');return normalize({...p,preset:p.id,strokes:[]});}
  function wearPreset(id){const d=save(presetDesign(id));equip(d.id);return d;}
  function occasionSheet(who,occasion){const p=presets.find(p=>p.who===who&&p.occasion===occasion);return p?sheet(who,p.base):Promise.reject(new Error('That occasion outfit is missing.'));}
  addEventListener('storage',e=>{if(e.key===KEY){saved=read();rendered.clear();dispatchEvent(new CustomEvent('wardrobechange'));}});
  window.SharedWardrobe={KEY,read:()=>JSON.parse(JSON.stringify(saved)),save,equip,unequip,remove,normalize,texture,sareeTexture,drawMotif:motif,sareeOptions:{motifs,finishes,accents,layouts,drapes,blouseStyles},render,getSprite,addams,presets:()=>presets.map(p=>({...p})),presetDesign,wearPreset,occasionSheet,setNecklace:on=>{saved.necklace=!!on;persist();}};
})();
