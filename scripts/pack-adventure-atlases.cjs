// Normalize generated supporting art into the game's 1024px, 4x4 atlas format.
// Original player atlases are never edited by this asset build.
const fs=require('node:fs'),path=require('node:path');
const modules=[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()];
const sharp=require(require.resolve('sharp',{paths:modules}));
const {createCanvas,ImageData}=require(require.resolve('@napi-rs/canvas',{paths:modules}));
(async()=>{
 for(const [i,name] of ['performance','detail','sports'].entries()){
  const input=process.argv[i+2];if(!input)throw Error('Pass performance, detail, and sports source PNG paths.');
  const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const source=createCanvas(info.width,info.height),sourceCtx=source.getContext('2d');
  sourceCtx.putImageData(new ImageData(new Uint8ClampedArray(data),info.width,info.height),0,0);
  const cells=[];
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
   const x0=Math.round(col*info.width/4),x1=Math.round((col+1)*info.width/4),y0=Math.round(row*info.height/4),y1=Math.round((row+1)*info.height/4);let l=x1,r=x0,t=y1,b=y0;
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*info.width+x)*4+3]>32){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
   if(r<l||b<t)throw Error(name+' has an empty cell '+row+','+col);cells.push({row,col,x:l,y:t,w:r-l+1,h:b-t+1});
  }
  const out=createCanvas(1024,1024),p=out.getContext('2d');p.imageSmoothingEnabled=false;
  for(const c of cells){const rowH=Math.max(...cells.filter(x=>x.row===c.row).map(x=>x.h)),s=name==='detail'?Math.min(232/c.w,220/c.h):Math.min(220/rowH,236/c.w),w=Math.round(c.w*s),h=Math.round(c.h*s);p.drawImage(source,c.x,c.y,c.w,c.h,c.col*256+128-Math.round(w/2),c.row*256+240-h,w,h);}
  const dest=path.resolve('assets/our-year/'+name+'-atlas.png'),temp=dest+'.tmp';fs.writeFileSync(temp,out.toBuffer('image/png'));fs.renameSync(temp,dest);console.log(name,fs.statSync(dest).size,'1024x1024');
 }
})().catch(e=>{console.error(e);process.exit(1);});
