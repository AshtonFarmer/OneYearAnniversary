(function(){
  'use strict';
  function draw(ctx,ox,oy,t,near){
    ctx.save();ctx.translate(ox,oy);
    // Small moving details live on their actual map props; none alter collision.
    const glints=[[330,429,'#ffe38d'],[1208,467,'#ffe1ee'],[760,355,'#ffd99b'],[1190,748,'#ffc46a'],[1228,750,'#ffc46a']];
    glints.forEach(([x,y,color],i)=>{const strength=.3+.25*Math.sin(t*2.2+i);ctx.globalAlpha=strength;ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=12;ctx.beginPath();ctx.ellipse(x,y,3+(i>2?Math.sin(t*3+i):0),i>2?5:3,0,0,7);ctx.fill();});
    ctx.globalAlpha=.55;ctx.shadowBlur=0;ctx.fillStyle='#e2bf89';ctx.font='15px Georgia';for(let i=0;i<3;i++)ctx.fillText('♪',1310+i*15,425-((t*12+i*17)%55));
    const drift=t*.16%1;ctx.strokeStyle='#c4f0ff';ctx.globalAlpha=Math.sin(drift*Math.PI)*.4;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(355+drift*115,610+drift*20);ctx.lineTo(340+drift*115,605+drift*20);ctx.stroke();
    ctx.globalAlpha=1;ctx.shadowBlur=0;
    if(near){const labels={creator:[355,313,'Atelier · E'],memoryWorld:[768,430,'Our Little World · E']};const label=labels[near];if(label){ctx.font='12px Georgia';const w=ctx.measureText(label[2]).width+20;ctx.fillStyle='#14271fed';ctx.strokeStyle='#d7bb7a';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(label[0]-w/2,label[1]-18,w,26,5);ctx.fill();ctx.stroke();ctx.fillStyle='#f2dfb4';ctx.textAlign='center';ctx.fillText(label[2],label[0],label[1]);}}
    ctx.restore();
  }
  window.OurYearTreehouse={draw};
})();
