// Routes the 600-entry expansion before legacy wish engines so one request creates one clean scene.
(function(){
  'use strict';
  try{
    if(!window.WishExpansion)return;
    const ENDPOINT='damp-cherry-8310.ashton20-bama.workers.dev';
    const STORE='wishExpansionLastEffects';
    const norm=s=>String(s||'').toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ').trim();
    let last=[];
    try{last=JSON.parse(sessionStorage.getItem(STORE)||'[]');if(!Array.isArray(last))last=[];}catch(e){last=[];}
    function save(){try{sessionStorage.setItem(STORE,JSON.stringify(last.slice(0,3)));}catch(e){}}
    function synthetic(message,effects=[]){
      const body=JSON.stringify({ok:true,message,expansion:true,effects:effects.map(e=>({number:e.number,id:e.id,title:e.title,pack:e.packLabel}))});
      return Promise.resolve(new Response(body,{status:200,headers:{'Content-Type':'application/json'}}));
    }
    function start(list){
      const numbers=list.map(e=>typeof e==='number'?e:e.number).filter(Boolean).slice(0,3);
      if(!numbers.length)return false;
      window.WishExpansion.startMany(numbers);
      last=numbers;save();return true;
    }
    const previousFetch=window.fetch.bind(window);
    window.fetch=function(input,init){
      try{
        const url=typeof input==='string'?input:(input&&input.url)||'';
        if(url.includes(ENDPOINT)&&init&&init.body){
          const body=JSON.parse(init.body),raw=String(body.originalWish||body.wish||''),t=norm(raw);
          if(/^(stop|enough|stop everything|make it stop|cancel the wish)$/.test(t)){
            window.WishExpansion.stop();last=[];save();
            return synthetic('The Wish Pool stopped the expansion scene.');
          }
          if(/^(show|open|view) (the )?(expansion )?(effect count|wish count|registry count)$/.test(t)){
            const a=window.WishExpansion.audit();
            return synthetic(`${a.count} new individual effects across ${a.packCount} packs. Registry valid: ${a.valid?'yes':'no'}.`);
          }
          if(/^(show|open|view) (the )?(new )?(wish packs|expansion packs)$/.test(t)){
            return synthetic(`${window.WishExpansion.packCount} expansion packs with 20 individual effects in each pack.`);
          }
          if(/^(more|more!|again|do it again|keep going)$/.test(t)&&last.length){
            const e=window.WishExpansion.effects.filter(x=>last.includes(x.number));start(e);
            return synthetic('The Wish Pool repeated the expansion effect.',e);
          }
          if(/^(even more|way more|triple it)$/.test(t)&&last.length){
            const e=window.WishExpansion.effects.find(x=>x.number===last[0]);
            const list=e?[e,e,e]:[];start(list);
            return synthetic('The Wish Pool tripled the expansion effect.',list);
          }
          if(/^random new effect$|^random expansion wish$|^surprise expansion$/.test(t)){
            const all=window.WishExpansion.effects,e=all[Math.floor(Math.random()*all.length)];start([e]);
            return synthetic(`Random expansion wish: ${e.title}.`,[e]);
          }
          const test=t.match(/^(?:ashton test expansion|test expansion effect|test new effect)\s+(.+)$/);
          if(test){
            const found=window.WishExpansion.find(test[1],1);
            if(found.length){start(found);return synthetic(`Testing expansion effect ${found[0].number}: ${found[0].title}.`,found);}
          }
          const found=window.WishExpansion.find(raw,3);
          if(found.length){
            start(found);
            return synthetic(`Wish granted: ${found.map(e=>e.title).join(' + ')}.`,found);
          }
        }
      }catch(e){}
      return previousFetch(input,init);
    };
  }catch(e){console.warn('wish expansion router failed',e);}
})();