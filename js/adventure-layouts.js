// Art-aligned footprints, seating, and camera composition for the original-world
// style pass. Memory IDs, prerequisites, inventory and save keys stay stable.
(function(){
 'use strict';
 const D=window.AdventurePlaces,P=D.places,prop=D.prop;
 const box=(x,y,w,h,kind='scenery',extra={})=>prop(kind,x,y,w,h,extra);
 const route=(points,radius=65)=>({points,radius});
 function move(id,points){for(const [key,xy] of Object.entries(points)){const n=P[id].nodes.find(n=>n.id===key);if(n){n.x=xy[0];n.y=xy[1];}}}
 for(const p of Object.values(P)){p.actorHeight=['apartment','concert','halloween','haunt','community'].includes(p.id)?96:74;p.art={version:'20261104-3',bounds:[145,210,1255,775],anchors:{},slots:{}};}
 P.apartment.actorHeight=128;
 Object.assign(P.apartment.art,{photoHomecoming:true,bounds:[60,435,1410,560],walkAreas:[[85,445,1360,415],[690,835,170,155]],anchors:{reunion:[790,580],ring:[1190,620]},reunionSeated:[[745,530],[845,530]],camera:{x:780,y:510,zoom:.94},carvings:[[1300,510],[1370,510]]});
 P.apartment.props=[box(90,300,220,160),box(455,375,660,165),box(515,620,560,185),box(90,655,210,180),box(1240,350,200,225)];
 move('apartment',{roses:[425,620],banner:[1170,510],vase:[470,585],dinner:[790,845],reunion:[790,580],ring:[1190,620],carve:[1325,630],closet:[345,800],exit:[770,960]});P.apartment.spawn=[770,940];
 Object.assign(P.park.art,{bounds:[170,200,1250,795],paths:[route([[760,980],[735,875],[680,780],[675,650],[625,555],[565,505],[700,420],[735,350],[780,270]],65),route([[680,780],[520,765],[350,750]],72),route([[565,505],[400,480],[340,465]],65),route([[700,420],[850,475],[1000,545],[1160,555],[1320,605],[1350,660],[1220,710],[1150,700]],70)],anchors:{bench:[1180,643],water:[1080,565]},waterShape:[[960,320],[1400,290],[1450,455],[1350,535],[1080,515],[930,440]]});
 P.park.props=[box(1090,585,185,65),box(275,390,165,65)];
 move('park',{exit:[760,950],light1:[350,750],light2:[675,650],water:[1080,565],bench:[1170,705],sky:[780,300]});
 Object.assign(P.astra.art,{bounds:[130,210,1290,790],paths:[route([[760,980],[760,880],[760,850],[700,805],[600,790],[435,810],[300,790],[270,730],[245,650],[235,550],[205,480],[250,445],[400,400],[465,330],[510,310],[700,315],[780,290],[980,335],[1150,345],[1240,390],[1310,445],[1300,550],[1320,690],[1310,800],[1250,820],[1130,790],[1100,715],[1060,680],[1000,650],[945,625],[890,570],[780,525]],65)],fx:[[760,790],[305,690],[210,420],[400,225],[780,210],[1180,290],[1340,450],[1315,748],[1000,595],[820,425]]});
 P.astra.props=[box(780,365,100,115)];P.astra.spawn=[760,945];
 const stops=[[760,865],[310,765],[220,480],[430,315],[780,295],[1150,345],[1300,535],[1280,815],[1000,670],[780,525]];stops.forEach((xy,i)=>move('astra',{['station'+i]:xy}));move('astra',{exit:[760,970]});
 Object.assign(P.stadium.art,{bounds:[105,310,1335,685],walkAreas:[[130,400,315,410],[180,740,1220,250],[680,645,510,105],[1090,700,75,100],[470,650,250,160]],anchors:{baseball:[900,700],fireworks:[900,700]},slots:{baseball:[[875,700],[920,700]],fireworks:[[875,700],[920,700]]},field:{pitch:[936,425],plate:[938,565],fielders:[[665,375],[1230,385],[935,330]]}});
 P.stadium.props=[box(170,300,190,115),box(160,520,240,145),box(370,775,90,35),box(985,775,90,35),box(1165,775,85,35)];
 move('stadium',{ticket:[780,950],snacks:[300,700],merch:[290,455],game:[900,735],fireworks:[1030,735]});P.stadium.spawn=[770,955];
 Object.assign(P.pool.art,{bounds:[280,265,1200,735],walkAreas:[[290,270,1170,550],[690,800,150,195]],anchors:{'pool-rest':[600,340]},slots:{'pool-rest':[[490,340],[710,340]]},swimStart:[[540,675],[610,675]],dry:[510,775]});
 P.pool.water=[475,425,740,295];P.pool.props=[box(460,260,65,115),box(680,260,65,115),box(900,260,75,115),box(1150,260,75,115),box(230,435,185,220),box(1300,460,155,140),box(1300,635,150,115)];P.pool.spawn=[760,965];
 move('pool',{swim:[510,775],rest:[600,400],float:[345,695],'exit-water':[540,755],exit:[760,965]});
 Object.assign(P.golf.art,{bounds:[145,650,1250,340],walkAreas:[[150,660,1240,325]],golfTargets:[[550,354,132,39],[850,268,95,25],[1115,340,106,29],[886,428,112,28]],golfOrigin:[768,712]});
 P.golf.props=[box(190,685,300,85),box(330,750,160,48),box(540,650,42,140),box(960,650,43,140),box(1130,655,285,135),box(250,870,220,75),box(1110,870,205,75)];move('golf',{watch:[1050,815],snacks:[1240,830]});
 Object.assign(P.concert.art,{bounds:[90,420,1360,575],walkAreas:[[105,425,1330,380],[700,790,140,205]],anchors:{concert:[870,525]},slots:{concert:[[835,525],[905,525]]},stage:[{row:0,x:785,y:330,h:104},{row:1,x:565,y:330,h:88},{row:2,x:1005,y:330,h:88}],camera:{x:790,y:490,zoom:1.08}});
 P.concert.props=[...Array.from({length:12},(_,i)=>box(350+i%4*225,475+Math.floor(i/4)*115,165,60,'seat')),box(125,365,185,170),box(1250,565,200,140)];
 move('concert',{program:[260,580],seat:[875,570],applause:[775,790],snacks:[1300,755]});P.concert.spawn=[770,950];
 Object.assign(P.observatory.art,{bounds:[220,480,1210,515],walkAreas:[[300,520,1050,240],[900,490,400,130]],paths:[route([[760,980],[760,830],[730,745],[690,690]],62),route([[1240,845],[1190,700],[1050,600]],60)],anchors:{sky:[625,610]},slots:{sky:[[580,610],[665,600]]},moon:[1180,120]});
 P.observatory.props=[box(300,420,240,110),box(1030,440,100,110),box(1180,440,150,110)];
 move('observatory',{exit:[760,965],telescope:[1050,590],blanket:[700,720],chart:[1135,590],park:[1240,845]});P.observatory.spawn=[760,960];
 Object.assign(P.jeep.art,{bounds:[120,200,1320,795],walkAreas:[[180,300,1220,450],[540,230,900,180]],paths:[route([[220,960],[650,895],[1000,845],[1360,790]],65),route([[760,885],[760,765],[760,745]],45)],drivePath:[[550,910],[650,895],[1000,845],[1360,790]],anchors:{'jeep-show':[770,565],overlook:[990,320]}});
 P.jeep.props=[box(70,200,430,190),box(1150,220,320,180),...[[270,415,220,110],[530,410,210,112],[790,415,220,105],[1045,390,210,120],[250,600,230,115],[540,585,220,130],[820,585,220,125],[1100,590,230,110]].map(b=>box(...b)),box(180,745,500,30),box(830,720,590,35)];
 move('jeep',{exit:[740,940],road:[550,900],gathering:[770,565],duck1:[505,560],duck2:[200,425],duck3:[1370,710],gear:[1270,440],overlook:[990,320],astra:[635,330]});P.jeep.spawn=[740,900];
 Object.assign(P.puja.art,{bounds:[60,330,1410,665],walkAreas:[[90,350,1350,475],[700,800,150,185]],diyas:[[608,425],[928,425],[608,650],[928,650]],anchors:{prayer:[760,520]},camera:{x:768,y:520,zoom:1.04}});
 P.puja.props=[box(475,150,595,210),box(165,365,295,220),box(1150,350,320,240),box(1140,635,225,125),box(415,630,130,130),box(1000,650,80,110)];
 move('puja',{exit:[760,960],flowers:[320,630],lamp0:[608,470],lamp1:[928,470],lamp2:[608,705],lamp3:[928,705],quiet:[760,520],sweets:[1270,630],ring:[1240,805]});P.puja.spawn=[760,955];
 Object.assign(P.community.art,{bounds:[80,330,1380,670],walkAreas:[[110,350,1300,460],[700,800,140,195]],stage:[[450,310],[1200,310],[760,500]],anchors:{culture:[425,380],drama:[1150,380],music:[760,600],feast:[760,760]}});
 P.community.props=[box(210,150,470,180),box(1100,150,260,180),box(170,460,300,160),box(1150,450,250,180),box(550,625,110,100),box(920,625,120,100),box(770,415,70,100),box(860,440,50,80)];
 move('community',{culture:[425,380],drama:[1150,380],music:[760,600],feast:[760,760],food:[325,665],fabric:[1200,665],exit:[760,960]});P.community.spawn=[760,950];
 const pumpkins=[[360,460],[430,500],[300,570],[470,600],[850,470],[930,510],[820,590],[960,640],[490,740],[600,730],[980,750],[1100,730]];
 P.pumpkins.props=[box(580,100,640,275),box(200,215,260,175),box(1240,305,240,150)];pumpkins.forEach(([x,y],i)=>{P.pumpkins.props.push(box(x-25,y-44,50,44,'pumpkin',{number:i}));move('pumpkins',{['pumpkin'+i]:[x,y+30]});});
 Object.assign(P.pumpkins.art,{bounds:[160,300,1250,690],anchors:{'pumpkin-photo':[1300,525]}});move('pumpkins',{'farm-shop':[320,425],wagon:[1300,525],home:[1100,850]});
 Object.assign(P.haunt.art,{bounds:[60,310,1410,690],walkAreas:[[90,315,1350,500],[680,800,120,195]],mirrorArea:[1165,168,130,88],anchors:{'haunt-exit':[1200,760]}});
 P.haunt.props=[box(80,425,570,45),box(800,425,650,45),box(722,170,28,210),box(720,625,28,190),box(375,290,160,80),box(250,245,100,70),box(510,340,60,50),box(600,180,90,160),box(1150,270,160,60,'mirror'),box(400,570,200,120)];
 move('haunt',{entrance:[400,755],chains:[410,390],mirror:[1160,390],fog:[1200,760],party:[1350,740],exit:[740,960]});P.haunt.spawn=[740,950];
 Object.assign(P.halloween.art,{bounds:[60,350,1410,650],walkAreas:[[90,350,1370,485],[620,825,180,165]],anchors:{dance:[760,585],portrait:[780,415]}});
 P.halloween.props=[box(205,390,260,100),box(210,150,200,220),box(230,560,195,105),box(155,710,190,105),box(1050,190,180,160),box(1240,175,180,180),box(1160,470,280,110),box(1070,680,360,120),box(480,450,36,52,'flowers',{hideWhen:'halloween-rose',solid:false})];
 move('halloween',{costumes:[1130,410],pose:[780,415],dance:[760,585],rose:[510,530],table:[1240,835],exit:[700,965]});P.halloween.spawn=[700,950];
 window.AdventureLayouts={version:'20261104-3'};
})();
