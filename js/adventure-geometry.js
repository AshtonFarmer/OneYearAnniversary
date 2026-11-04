(function(){
 'use strict';
 function contains(r,x,y,pad=0){const a=Array.isArray(r)?r:[r.x,r.y,r.w,r.h];return x>a[0]-pad&&x<a[0]+a[2]+pad&&y>a[1]-pad&&y<a[1]+a[3]+pad;}
 function canStand(place,x,y,swimming=false){
  if(x<155||x>1380||y<(place.id==='pool'?196:212)||y>958)return false;
  if(['home','concert','haunt','halloween'].includes(place.theme)&&y>895&&(x<704||x>831))return false;
  if(place.water&&contains(place.water,x,y,8)&&!swimming)return false;
  if(place.floors.some(f=>f[0]==='water'&&contains(f.slice(1),x,y,8)))return false;
  if(place.id==='golf'&&contains([150,165,1240,455],x,y,5))return false;
  return !place.props.some(p=>p.solid!==false&&contains(p,x,y,11));
 }
 function nearest(place,x,y,swimming=false){
  const cx=Math.max(165,Math.min(1370,x)),cy=Math.max(225,Math.min(945,y));if(canStand(place,cx,cy,swimming))return {x:cx,y:cy};
  for(let r=16;r<230;r+=16)for(let k=0;k<24;k++){const a=k*Math.PI/12,xx=cx+Math.cos(a)*r,yy=cy+Math.sin(a)*r;if(canStand(place,xx,yy,swimming))return {x:xx,y:yy};}return null;
 }
 function pathfind(place,from,to,swimming=false){
  const step=16,cols=96,rows=64,goalPoint=nearest(place,to.x,to.y,swimming);if(!goalPoint)return [];
  const cell=(x,y)=>({x:Math.floor(x/step),y:Math.floor(y/step)}),a=cell(from.x,from.y),b=cell(goalPoint.x,goalPoint.y);
  const safe=(x,y)=>canStand(place,x*step+8,y*step+8,swimming);
  // The start/goal may sit beside a furniture edge. Find a reachable grid cell.
  function adjust(c){if(safe(c.x,c.y))return c;for(let r=1;r<12;r++)for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(safe(c.x+x,c.y+y))return {x:c.x+x,y:c.y+y};return null;}
  const start=adjust(a),goal=adjust(b);if(!start||!goal)return [];
  const src=start.y*cols+start.x,dst=goal.y*cols+goal.x,queue=[src],prev=new Int32Array(cols*rows).fill(-2);prev[src]=-1;
  for(let at=0;at<queue.length;at++){const n=queue[at];if(n===dst)break;const x=n%cols,y=Math.floor(n/cols);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,next=yy*cols+xx;if(xx<0||yy<0||xx>=cols||yy>=rows||prev[next]!==-2||!safe(xx,yy))continue;prev[next]=n;queue.push(next);}}
  if(prev[dst]===-2)return [];
  const route=[];for(let n=dst;n!==src&&n>=0;n=prev[n])route.push({x:n%cols*step+8,y:Math.floor(n/cols)*step+8});route.reverse();return route;
 }
 window.AdventureGeometry={contains,canStand,nearest,pathfind};
})();
