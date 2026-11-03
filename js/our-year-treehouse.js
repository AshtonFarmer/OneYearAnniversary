(function(){
  'use strict';
  const Y=window.OUR_YEAR;
  const player=window.OurYearPlayer.create({images:()=>({him:window.skyrootPlayers.him.img,her:window.skyrootPlayers.her.img})});
  const dialog=document.createElement('dialog');dialog.className='treehouse-memories';dialog.setAttribute('aria-labelledby','treehouseMemoryTitle');
  const header=document.createElement('div');header.className='treehouse-memory-heading';const title=document.createElement('h2');title.id='treehouseMemoryTitle';title.textContent='Our year, up in the branches.';const closeButton=document.createElement('button');closeButton.textContent='Close ✕';closeButton.onclick=close;header.append(title,closeButton);dialog.appendChild(header);
  const intro=document.createElement('p');intro.textContent='All our little firsts. All the places we keep. Choose a photo to step back into the day, right here in our treehouse.';dialog.appendChild(intro);
  const links=document.createElement('div');links.className='treehouse-memory-links';[['Walk into Our Little World','memory-world.html?from=treehouse'],['Visit Tanima’s Atelier','outfit-studio.html']].forEach(([text,url])=>{const a=document.createElement('a');a.textContent=text+' ↗';a.href=url;links.appendChild(a);});dialog.appendChild(links);
  const grid=document.createElement('div');grid.className='treehouse-memory-grid';dialog.appendChild(grid);document.body.appendChild(dialog);
  const toolbar=document.createElement('button');toolbar.id='treehousePhotoWall';toolbar.textContent='Our photo wall ♥';toolbar.hidden=true;toolbar.onclick=()=>open();document.body.appendChild(toolbar);
  let context='grounds',selected=null;
  function pause(open){dispatchEvent(new CustomEvent('ouryearmodal',{detail:{open}}));}
  function close(){dialog.close();pause(false);toolbar.focus();}
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  function play(id){dialog.close();player.open(id);}
  function open(filter){selected=filter||null;grid.replaceChildren();const state=Y.read();Y.memories.filter(m=>!filter||filter.includes(m.id)).forEach(m=>{const b=document.createElement('button');b.className='treehouse-memory-card';if(m.photos.length)b.appendChild(Y.photoElement(m.photos[0],m.title));else{const art=document.createElement('span');art.className='treehouse-memory-art';art.textContent=m.icon;b.appendChild(art);}const text=document.createElement('strong');text.textContent=m.title;const status=document.createElement('small');status.textContent=state.completed[m.id]?'♥ Kept · revisit':'Relive this day ↗';b.append(text,status);b.onclick=()=>play(m.id);grid.appendChild(b);});if(!dialog.open)dialog.showModal();pause(true);closeButton.focus();}
  function room(action){
    if(action==='creator'){location.href='outfit-studio.html';return;}
    if(action==='family'){play('homecoming');return;}
    if(action==='planning'||action==='memoryWall'){open();return;}
    if(action==='mojo'||action==='celebrations'){open(['concert','puja','ring','community']);return;}
    if(action==='observatory'){open(['sky','park']);return;}
    if(action==='gear'){open(['pumpkins','carving','haunt','addams','baseball','swimming','topgolf']);return;}
    if(action==='necklace'){play('necklace');return;}
    if(action==='ring'){play('ring');return;}
  }
  function setContext(map){if(context!==map){context=map;toolbar.hidden=map!=='treehouse';}}
  function draw(ctx,ox,oy,t,near){
    ctx.save();ctx.translate(ox,oy);
    // Small moving details live on their actual map props; none alter collision.
    const glints=[[330,429,'#ffe38d'],[1208,467,'#ffe1ee'],[760,355,'#ffd99b'],[1190,748,'#ffc46a'],[1228,750,'#ffc46a']];
    glints.forEach(([x,y,color],i)=>{const strength=.3+.25*Math.sin(t*2.2+i);ctx.globalAlpha=strength;ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=12;ctx.beginPath();ctx.ellipse(x,y,3+(i>2?Math.sin(t*3+i):0),i>2?5:3,0,0,7);ctx.fill();});
    ctx.globalAlpha=.55;ctx.shadowBlur=0;ctx.fillStyle='#e2bf89';ctx.font='15px Georgia';for(let i=0;i<3;i++)ctx.fillText('♪',1310+i*15,425-((t*12+i*17)%55));
    const drift=t*.16%1;ctx.strokeStyle='#c4f0ff';ctx.globalAlpha=Math.sin(drift*Math.PI)*.4;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(355+drift*115,610+drift*20);ctx.lineTo(340+drift*115,605+drift*20);ctx.stroke();
    ctx.globalAlpha=1;ctx.shadowBlur=0;
    if(near){const labels={creator:[355,313,'Atelier · E'],family:[1150,306,'Welcome home · E'],planning:[205,560,'Our photo wall · E'],memoryWall:[205,386,'Our photo wall · E'],celebrations:[1320,553,'Our celebrations · E'],observatory:[355,825,'Our skies · E'],gear:[1180,829,'Firsts & autumn · E'],memoryWorld:[768,430,'Our Little World · E']};const label=labels[near];if(label){ctx.font='12px Georgia';const w=ctx.measureText(label[2]).width+20;ctx.fillStyle='#14271fed';ctx.strokeStyle='#d7bb7a';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(label[0]-w/2,label[1]-18,w,26,5);ctx.fill();ctx.stroke();ctx.fillStyle='#f2dfb4';ctx.textAlign='center';ctx.fillText(label[2],label[0],label[1]);}}
    ctx.restore();
  }
  window.OurYearTreehouse={open,room,draw,setContext,isOpen:()=>dialog.open||player.isOpen(),close:()=>{if(player.isOpen())player.close();else close();},activate:()=>{if(player.isOpen())player.activate();}};
})();
