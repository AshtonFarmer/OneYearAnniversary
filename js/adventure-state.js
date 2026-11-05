(function(){
 'use strict';
 const KEY='ourYear.adventure.v1',catalog=window.AdventurePlaces.items;
 const fresh=()=>({version:1,coins:120,bag:{},flags:{},visited:{},sky:0,scores:[],feastPlate:[]});
 function read(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.version===1)return {...fresh(),...s,coins:Math.max(0,Math.floor(Number(s.coins)||0)),bag:s.bag||{},flags:s.flags||{},visited:s.visited||{},scores:Array.isArray(s.scores)?s.scores:[],feastPlate:Array.isArray(s.feastPlate)?s.feastPlate:[]};}catch(e){}return fresh();}
 function mutate(fn){const s=read(),result=fn(s);localStorage.setItem(KEY,JSON.stringify(s));dispatchEvent(new CustomEvent('adventurechange'));return result;}
 function award(s,flag,reward=8){if(!s.flags[flag]){s.flags[flag]=true;s.coins+=reward;return true;}return false;}
 function add(s,id,n=1){if(catalog[id])s.bag[id]=(s.bag[id]||0)+n;}
 function purchase(id,price){if(!catalog[id]||!Number.isInteger(price)||price<0)throw Error('This item is unavailable.');return mutate(s=>{if(s.coins<price)return {ok:false,message:'You need '+price+' coins. Explore a new spot to earn a few more.'};if(catalog[id][2]!=='snack'&&s.bag[id])return {ok:false,message:'You already have this keepsake.'};s.coins-=price;add(s,id);return {ok:true,message:'Added to our bag: '+catalog[id][0]+'.'};});}
 function collect(id,flag,amount=1){return mutate(s=>{if(flag&&s.flags[flag])return false;if(flag)award(s,flag,5);add(s,id,amount);return true;});}
 function task(flag,item,reward=8){return mutate(s=>{const isNew=award(s,flag,reward);if(isNew&&item)add(s,item);return isNew;});}
 function consume(id){return mutate(s=>{if(!s.bag[id])return false;s.bag[id]--;if(!s.bag[id])delete s.bag[id];return true;});}
 function markVisited(id){mutate(s=>{s.visited[id]=true;});}
 function setSky(mode){mutate(s=>{s.sky=Math.max(0,Math.min(4,Math.floor(mode)));});}
 function score(points){mutate(s=>{s.scores.push({score:points,at:Date.now()});s.scores=s.scores.slice(-20);award(s,'golf-round',15);if(!s.bag['golf-scorecard'])add(s,'golf-scorecard');});}
 function packFeast(plate){mutate(s=>{s.feastPlate=[...plate];});}
 function serveFeast(){return mutate(s=>{
  if(s.feastPlate.length!==3)return false;
  s.feastPlate=[];
  if(award(s,'community-feast'))add(s,'community-keepsake');
  return true;
 });}
 window.AdventureState={KEY,read,purchase,collect,task,consume,markVisited,setSky,score,packFeast,serveFeast};
})();
