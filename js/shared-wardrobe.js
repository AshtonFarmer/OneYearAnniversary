// Lightweight design records; rendered sheets are cached in memory, not stored
// as megabytes of data URLs. All sixteen original movement cells are preserved.
(function(){
  'use strict';
  const KEY='ourYear.wardrobe.v1', rawSheets=new Map(), rendered=new Map();
  let saved=read();
  function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return v&&v.version===1?v:{version:1,designs:[],equipped:{},necklace:false};}catch(e){return {version:1,designs:[],equipped:{},necklace:false};}}
  function persist(){localStorage.setItem(KEY,JSON.stringify(saved));rendered.clear();dispatchEvent(new CustomEvent('wardrobechange'));}
  function rgb(hex){const n=parseInt((/^#[0-9a-f]{6}$/i.test(hex)?hex:'#6e8b73').slice(1),16);return [n>>16,(n>>8)&255,n&255];}
  function normalize(d){
    const who=d.who==='him'?'him':'her',kind=who==='him'?'suit':(d.kind==='dress'?'dress':'saree');
    return {id:String(d.id||'look-'+Date.now()),name:String(d.name||'My new look').slice(0,50),who,kind,base:who==='him'?6:(kind==='dress'?5:1),color:/^#[0-9a-f]{6}$/i.test(d.color)?d.color:'#728d77',trim:/^#[0-9a-f]{6}$/i.test(d.trim)?d.trim:'#e5ba65',pattern:['none','flowers','stars','stripes','checks'].includes(d.pattern)?d.pattern:'none',strokes:(Array.isArray(d.strokes)?d.strokes:[]).slice(-350).map(s=>({color:/^#[0-9a-f]{6}$/i.test(s.color)?s.color:'#ffffff',size:Math.max(.005,Math.min(.15,Number(s.size)||.025)),points:(Array.isArray(s.points)?s.points:[]).slice(0,240).filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)).map(p=>p.map(n=>Math.max(0,Math.min(1,n))))}))};
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
    d.strokes.forEach(s=>{p.strokeStyle=s.color;p.fillStyle=s.color;p.lineWidth=s.size*256;p.lineCap='round';p.lineJoin='round';p.beginPath();s.points.forEach((pt,i)=>{if(i)p.lineTo(pt[0]*256,pt[1]*320);else p.moveTo(pt[0]*256,pt[1]*320);});if(s.points.length===1){p.arc(s.points[0][0]*256,s.points[0][1]*320,p.lineWidth/2,0,7);p.fill();}else p.stroke();});
    return c;
  }
  function sheet(who,base){
    const path='assets/sprites/'+who+(base===1?'_atlas':'_outfit'+base)+'.png';
    if(!rawSheets.has(path))rawSheets.set(path,new Promise((resolve,reject)=>{const i=new Image();i.wardrobeRaw=true;i.onload=()=>resolve(i);i.onerror=()=>{rawSheets.delete(path);reject(new Error('The original outfit could not load.'));};i.src=path+'?wardrobe-base=1';}));
    return rawSheets.get(path);
  }
  async function render(input,necklace){
    const d=input?normalize(input):null,who=d?d.who:'her',base=d?d.base:1;
    const image=await sheet(who,base),c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;
    const p=c.getContext('2d',{willReadFrequently:true});p.drawImage(image,0,0);
    if(d){
      const pixels=p.getImageData(0,0,c.width,c.height),a=pixels.data;
      const t=texture(d).getContext('2d').getImageData(0,0,256,320).data,trim=rgb(d.trim);
      const cw=c.width/4,ch=c.height/4;
      for(let row=0;row<4;row++)for(let col=0;col<4;col++){
        let x0=cw,y0=ch,x1=0,y1=0;
        for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const i=((row*ch+y)*c.width+col*cw+x)*4;if(a[i+3]>30){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
        const h=y1-y0,w=x1-x0;
        for(let y=Math.max(y0,Math.floor(y0+h*.50));y<=y1;y++)for(let x=x0;x<=x1;x++){
          const i=((row*ch+y)*c.width+col*cw+x)*4;if(a[i+3]<30)continue;
          const fy=(y-y0)/h,fx=(x-x0)/w,r=a[i],g=a[i+1],b=a[i+2],lum=(r+g+b)/3;
          // Hair and skin remain original. The back-facing hair extends lower.
          if(fy<.50)continue;
          if(row===2&&fy<.70)continue;
          if((row===1&&fx>.55||row===3&&fx<.45)&&fy<.68)continue;
          let cloth=false,border=false;
          if(d.kind==='saree'){cloth=r>55&&g<r*.48&&b<r*.60; border=r>120&&g>r*.53&&g<r*.9&&b<g*.65;}
          else if(d.kind==='dress')cloth=r>120&&g>88&&b>85&&r-g<50&&g-b<38;
          else cloth=lum>23&&lum<115&&Math.max(r,g,b)-Math.min(r,g,b)<40;
          if(!cloth&&!border)continue;
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
        const i=new Image();i.wardrobeRaw=true;i.onload=()=>{const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const p=c.getContext('2d');p.drawImage(i,0,0);drawNecklace(p,c.width/4,c.height/4);resolve(c);};i.onerror=reject;i.src=image.src+(image.src.includes('?')?'&':'?')+'wardrobe-base=1';
      });promise.then(canvas=>{record.canvas=canvas;}).catch(()=>{});
    }
    return rendered.get(key).canvas;
  }
  function addams(){
    const her=save({id:'addams-morticia',name:'Morticia · our Halloween',who:'her',kind:'dress',color:'#17131e',trim:'#9b7fa7',pattern:'none',strokes:[]});
    const him=save({id:'addams-gomez',name:'Gomez · our Halloween',who:'him',kind:'suit',color:'#171b2e',trim:'#b5c9d2',pattern:'stripes',strokes:[]});equip(her.id);equip(him.id);return [her,him];
  }
  addEventListener('storage',e=>{if(e.key===KEY){saved=read();rendered.clear();dispatchEvent(new CustomEvent('wardrobechange'));}});
  window.SharedWardrobe={KEY,read:()=>JSON.parse(JSON.stringify(saved)),save,equip,unequip,remove,normalize,texture,render,getSprite,addams,setNecklace:on=>{saved.necklace=!!on;persist();}};
})();
