(function(){
  'use strict';

  const tile=16;

  function create(canvas,view){
    let zones=false,box=false,drag=null,selection=null,collisionKey=null,blocked=[];
    const ctx=canvas.getContext('2d');
    const visible=()=>zones||box;
    const clear=()=>{drag=null;selection=null;};
    function key(event){
      if(event.ctrlKey||event.metaKey||event.altKey||event.target?.isContentEditable)return false;
      const k=event.key.toLowerCase();
      if(k!=='b'&&k!=='g'&&(k!=='escape'||!box))return false;
      event.preventDefault();
      if(event.repeat)return true;
      if(k==='b'){
        box=!box;clear();
        canvas.style.cursor=box?'crosshair':'';
      }else if(k==='g')zones=!zones;
      else clear();
      return true;
    }
    function worldPoint(event){
      const rect=canvas.getBoundingClientRect(),v=view();
      return {
        x:Math.round(Math.max(0,Math.min(v.mapWidth,v.x+((event.clientX-rect.left)*v.width/rect.width-v.width/2)/v.scale))),
        y:Math.round(Math.max(0,Math.min(v.mapHeight,v.y+((event.clientY-rect.top)*v.height/rect.height-v.height/2)/v.scale)))
      };
    }
    function measure(start,end){
      return {x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),w:Math.abs(end.x-start.x),h:Math.abs(end.y-start.y)};
    }
    canvas.addEventListener('pointerdown',event=>{
      if(!box||event.button!==0||drag||!view().ready)return;
      event.preventDefault();
      const start=worldPoint(event);
      selection=measure(start,start);drag={start,pointer:event.pointerId};
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove',event=>{
      if(drag?.pointer===event.pointerId)selection=measure(drag.start,worldPoint(event));
    });
    canvas.addEventListener('pointerup',event=>{
      if(drag?.pointer!==event.pointerId)return;
      selection=measure(drag.start,worldPoint(event));drag=null;
      const {x,y,w,h}=selection;
      console.info('Map selection:',{map:view().id,x,y,w,h});
    });
    for(const type of ['pointercancel','lostpointercapture']){
      canvas.addEventListener(type,event=>{if(drag?.pointer===event.pointerId)clear();});
    }

    function draw({id,collision,canStand,targets,spawn,players,solidRects=[]}){
      if(!visible())return;
      const v=view(),unit=1/v.scale;
      if(collision!==collisionKey){
        collisionKey=collision;blocked=[];
        for(let y=0;y<v.mapHeight;y+=tile)for(let x=0;x<v.mapWidth;x+=tile){
          if(!canStand(x+tile/2,y+tile/2))blocked.push([x,y]);
        }
      }
      function circle(x,y,r,fill,stroke){
        ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.stroke();
      }
      function label(copy,x,y){
        const w=ctx.measureText(copy).width+12*unit;
        ctx.fillStyle='#09111ded';ctx.fillRect(x-w/2,y-12*unit,w,17*unit);
        ctx.fillStyle='#fff';ctx.fillText(copy,x,y);
      }
      ctx.save();
      ctx.lineWidth=1.6*unit;
      ctx.font=(11*unit)+'px monospace';ctx.textAlign='center';
      ctx.fillStyle='#ff3d552c';
      for(const [x,y] of blocked)ctx.fillRect(x,y,tile,tile);
      ctx.strokeStyle='#ff7689b8';
      for(const [x,y,w,h] of solidRects)ctx.strokeRect(x,y,w,h);
      ctx.strokeStyle='#7be9a9';ctx.strokeRect(0,0,v.mapWidth,v.mapHeight);
      for(const {id,name,x,y,r} of targets){
        circle(x,y,r,'#ffcc5523','#ffda76');
        circle(x,y,3*unit,'#fff2bc','#121b24');
        label((name||id)+' · '+x+', '+y+' · r'+r,x,y-8*unit);
      }
      if(spawn)circle(spawn[0],spawn[1],6*unit,'#b279ed','#f2d9ff');
      for(const p of players)circle(p.x,p.y,5*unit,'#249eff','#fff');
      if(box&&selection){
        const {x,y,w,h}=selection;
        ctx.fillStyle='#32d9ff38';ctx.fillRect(x,y,w,h);
        ctx.strokeStyle='#32d9ff';ctx.strokeRect(x,y,w,h);
        label('x:'+x+' y:'+y+' w:'+w+' h:'+h,x+w/2,y-8*unit);
      }
      ctx.setTransform(v.dpr,0,0,v.dpr,0,0);
      ctx.font='12px monospace';ctx.textAlign='left';
      const hudY=Math.max(0,v.height-100),panelWidth=Math.min(v.width-24,610);
      ctx.fillStyle='#09111ded';ctx.fillRect(12,hudY,panelWidth,45);
      ctx.fillStyle='#fff';
      ctx.fillText('MAP DEV TOOLS · '+id+'   B: box + overlay   G: overlay',22,hudY+17,panelWidth-20);
      ctx.fillText(box?'Drag to measure in map pixels · Esc clears the box':'Gold: interaction · Red: blocked grid · Blue: feet · Purple: spawn',22,hudY+34,panelWidth-20);
      ctx.restore();
    }
    return {key,draw,clear,visible,boxActive:()=>box,state:()=>({zones:visible(),box,selection:selection&&{...selection}})};
  }

  window.MapDebug={create};
})();
