// Pack the generated walking cells into the existing 1024px 4x4 game format.
// The generated originals stay untouched. Only packing, alpha cleanup, and
// correcting the man's left-profile row happen here.
const fs=require('node:fs'),path=require('node:path');
const sharp=require(require.resolve('sharp',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
(async()=>{
 const looks=[['her_outfit12.png',false],['him_outfit12.png',true],['her_outfit13.png',false]];
 for(const [index,[name,correctLeft]] of looks.entries()){
  const input=process.argv[index+2];if(!input)throw Error('Pass her swim, his swim, and her homecoming source PNGs.');
  const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true}),cells=[];
  // Saturated red matte remnants are outside this blue/teal/skin/hair palette.
  for(let i=0;i<data.length;i+=4)if(data[i]>200&&data[i+1]<45&&data[i+2]<45)data[i+3]=0;
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
   const left=Math.round(col*info.width/4),right=Math.round((col+1)*info.width/4),top=Math.round(row*info.height/4),bottom=Math.round((row+1)*info.height/4);let l=right,r=left,t=bottom,b=top;
   for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*info.width+x)*4+3]>32){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
   if(r<l||b<t)throw Error(name+' has an empty cell '+row+','+col);cells.push({row,col,left:l,top:t,width:r-l+1,height:b-t+1});
  }
  const layers=[];
  for(const c of cells){
   const maxHeight=Math.max(...cells.filter(a=>a.row===c.row).map(a=>a.height)),scale=Math.min(218/maxHeight,224/c.width),w=Math.round(c.width*scale),h=Math.round(c.height*scale);
   let cell=sharp(data,{raw:info}).extract({left:c.left,top:c.top,width:c.width,height:c.height});if(correctLeft&&c.row===1)cell=cell.flop();
   layers.push({input:await cell.resize(w,h,{kernel:'nearest'}).png().toBuffer(),left:c.col*256+128-Math.round(w/2),top:c.row*256+240-h});
  }
  const destination=path.resolve('assets/sprites',name);
  await sharp({create:{width:1024,height:1024,channels:4,background:'#00000000'}}).composite(layers).png().toFile(destination);
  console.log(name,fs.statSync(destination).size,'1024x1024; feet baseline 240');
 }
})().catch(e=>{console.error(e);process.exit(1);});
