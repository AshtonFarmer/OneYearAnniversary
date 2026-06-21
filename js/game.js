const page = document.body.dataset.page || 'home';

const LOCATIONS = {
  home: [
    { id:'helipad', name:'Helipad', hint:'Press E to board', x:250, y:250, w:210, h:150, page:'helipad.html' },
    { id:'cabin', name:'Main Cabin', hint:'Press E to enter', x:610, y:220, w:220, h:180, page:'cabin.html' },
    { id:'cherry', name:'Cherry Blossom Lake', hint:'Press E to visit', x:1050, y:250, w:300, h:220, page:'cherry-lake.html' },
    { id:'shopping', name:'Shopping Center', hint:'Press E to shop', x:585, y:620, w:360, h:170, page:'shopping.html' },
    { id:'future', name:'Future Spot', hint:'Locked for later', x:1070, y:650, w:180, h:130, locked:true }
  ],
  cabin: [
    { id:'back', name:'Go Outside', hint:'Press E to leave', x:680, y:755, w:180, h:60, page:'index.html' },
    { id:'letters', name:'Letters Table', hint:'Press E to open note', x:430, y:330, w:160, h:120, popup:'A little table for love letters, inside jokes, and stuff you want her to read.' },
    { id:'photos', name:'Picture Wall', hint:'Press E to view', x:850, y:290, w:180, h:120, popup:'Put your favorite pictures here later.' }
  ],
  helipad: [
    { id:'back', name:'Return', hint:'Press E to fly back', x:680, y:755, w:180, h:60, page:'index.html' },
    { id:'heli', name:'Cute Helicopter', hint:'Press E', x:540, y:260, w:360, h:220, popup:'This can become a little flying scene or a memory about a trip.' }
  ],
  cherry: [
    { id:'back', name:'Back to World', hint:'Press E to leave', x:680, y:755, w:180, h:60, page:'index.html' },
    { id:'bridge', name:'Bridge Photos', hint:'Press E to open pictures', x:650, y:350, w:250, h:180, popup:'This is where the photo gallery opens at the end of the bridge.' }
  ],
  shopping: [
    { id:'back', name:'Exit Mall', hint:'Press E to leave', x:680, y:755, w:180, h:60, page:'index.html' },
    { id:'gift', name:'Gift Shop', hint:'Press E to open photos', x:340, y:360, w:180, h:170, popup:'Gift Shop memories go here.' },
    { id:'food', name:'Food Court', hint:'Press E to open photos', x:630, y:360, w:220, h:170, popup:'Food dates, snacks, and funny pictures.' },
    { id:'photo', name:'Photo Booth', hint:'Press E to open photos', x:960, y:360, w:180, h:170, popup:'A photo booth page or gallery can go here.' }
  ]
};

class AnniversaryScene extends Phaser.Scene {
  preload(){
    this.load.image('girl','assets/girl.png');
    this.load.image('boy','assets/boy.png');
  }
  create(){
    this.W = 1400; this.H = 900;
    this.cameras.main.setBackgroundColor('#102a28');
    this.drawMap();
    this.locations = LOCATIONS[page] || LOCATIONS.home;
    this.drawLocations();

    this.girl = this.physics.add.sprite(640, 790, 'girl').setScale(.38).setDepth(10);
    this.boy = this.physics.add.sprite(735, 790, 'boy').setScale(.72).setDepth(10);
    this.girl.body.setSize(60,60).setOffset(22,130);
    this.boy.body.setSize(40,40).setOffset(8,60);
    this.girl.setCollideWorldBounds(true); this.boy.setCollideWorldBounds(true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E');
    this.prompt = document.getElementById('prompt');
    this.modal = document.getElementById('modal');
    this.modalText = document.getElementById('modalText');
    document.getElementById('closeModal').onclick = () => this.modal.classList.add('hidden');
  }
  drawMap(){
    const g = this.add.graphics();
    // grass
    g.fillStyle(0x2f8f4e,1).fillRect(0,0,this.W,this.H);
    g.fillStyle(0x1f5c38,1);
    for(let i=0;i<250;i++) g.fillCircle(Math.random()*this.W, Math.random()*this.H, Math.random()*3+2);
    // water / areas by page
    if(page==='home'){
      g.fillStyle(0x256eb6,1).fillRoundedRect(1030,120,320,310,40);
      g.fillRoundedRect(20,260,120,460,35);
      this.path(g, [[700,840],[700,690],[760,690],[760,450],[700,450],[700,310],[1050,310],[700,450],[300,450],[300,300],[250,300],[700,450],[700,670],[760,670],[760,700]]);
      this.drawCabin(g,620,215); this.drawHelipad(g,170,180); this.drawMall(g,555,575); this.drawLake(g,1040,140);
    } else if(page==='cabin'){
      g.fillStyle(0x6b3f25,1).fillRoundedRect(190,130,1020,640,12);
      g.fillStyle(0xc7864a,1).fillRoundedRect(230,170,940,560,10);
      g.fillStyle(0x3d2318,1).fillRect(650,755,120,70);
      this.text('Cozy Cabin Room', 520, 70, 36);
      this.drawFurniture(g);
    } else if(page==='helipad'){
      this.path(g, [[700,820],[700,570],[700,500]]);
      this.drawHelipad(g,500,210,360);
      this.drawHelicopter(g,555,260);
      this.text('Helipad', 620, 90, 42);
    } else if(page==='cherry'){
      g.fillStyle(0x256eb6,1).fillRoundedRect(360,140,700,470,55);
      this.path(g, [[700,820],[700,560],[700,410],[700,260]]);
      this.drawBridge(g,660,255);
      for(let i=0;i<12;i++) this.tree(300+i*80, 100+(i%2)*35, 0xff9ad5);
      this.text('Cherry Blossom Lake', 485, 70, 38);
    } else if(page==='shopping'){
      g.fillStyle(0xb98a57,1).fillRoundedRect(160,130,1080,580,14);
      this.path(g, [[700,820],[700,620],[700,470],[430,470],[700,470],[1040,470]]);
      this.text('Love Mall', 610, 80, 42);
      this.drawShop(g,300,260,'Gift Shop'); this.drawShop(g,590,260,'Food Court'); this.drawShop(g,930,260,'Photo Booth');
    }
    // trees border
    for(let x=20;x<this.W;x+=70){ this.tree(x,35); this.tree(x,this.H-35); }
    for(let y=60;y<this.H;y+=75){ this.tree(35,y); this.tree(this.W-35,y); }
  }
  path(g, pts){ g.lineStyle(72,0xd9b274,1); g.beginPath(); g.moveTo(pts[0][0],pts[0][1]); pts.slice(1).forEach(p=>g.lineTo(p[0],p[1])); g.strokePath(); g.lineStyle(50,0xc99b5a,1); g.beginPath(); g.moveTo(pts[0][0],pts[0][1]); pts.slice(1).forEach(p=>g.lineTo(p[0],p[1])); g.strokePath(); }
  tree(x,y,color=0x1f6b3d){ const g=this.add.graphics(); g.fillStyle(0x6b3f20).fillRect(x-7,y+10,14,30); g.fillStyle(color).fillCircle(x,y,34); g.setDepth(4); }
  text(t,x,y,s=24){ this.add.text(x,y,t,{fontFamily:'monospace',fontSize:s+'px',color:'#ffd9f0',stroke:'#351b12',strokeThickness:5}).setDepth(20); }
  drawCabin(g,x,y){ g.fillStyle(0x6b3a23).fillRoundedRect(x,y,210,150,8); g.fillStyle(0x4b1d37).fillTriangle(x-20,y+45,x+105,y-55,x+230,y+45); g.fillStyle(0xffd36a).fillRect(x+85,y+75,40,70); g.fillStyle(0xffc36c).fillRect(x+25,y+60,42,35).fillRect(x+145,y+60,42,35); }
  drawHelipad(g,x,y,size=210){ g.fillStyle(0x4a4a55).fillRoundedRect(x,y,size,size*.7,18); g.lineStyle(4,0xe3d5a4).strokeCircle(x+size/2,y+size*.35,55); this.add.text(x+size/2-18,y+size*.35-28,'H',{fontFamily:'monospace',fontSize:'58px',color:'#e3d5a4'}).setDepth(5); }
  drawHelicopter(g,x,y){ g.fillStyle(0xffffff).fillEllipse(x+160,y+70,180,70); g.fillStyle(0xe84763).fillEllipse(x+100,y+70,80,60); g.lineStyle(8,0x333333).lineBetween(x+160,y+30,x+160,y-50).lineBetween(x+60,y-50,x+260,y-50).lineBetween(x+225,y+70,x+330,y+45); }
  drawLake(){ for(let i=0;i<5;i++) this.tree(1070+i*55,120,0xff9ad5); }
  drawMall(g,x,y){ g.fillStyle(0x6b4a35).fillRoundedRect(x,y,390,145,8); g.fillStyle(0xff6aa6).fillRect(x+90,y+35,210,50); this.add.text(x+120,y+45,'SHOPPING',{fontFamily:'monospace',fontSize:'28px',color:'#fff2a6'}).setDepth(5); }
  drawShop(g,x,y,label){ g.fillStyle(0x4b2c25).fillRoundedRect(x,y,180,190,8); g.fillStyle(0xffca75).fillRect(x+25,y+85,130,70); this.add.text(x+24,y+25,label,{fontFamily:'monospace',fontSize:'22px',color:'#ffd9f0'}).setDepth(8); }
  drawBridge(g,x,y){ g.fillStyle(0x8b5a36).fillRoundedRect(x,y,85,315,8); for(let yy=y+10; yy<y+300; yy+=32) g.fillRect(x-10,yy,105,8); }
  drawFurniture(g){ g.fillStyle(0x5b2f23).fillRoundedRect(390,300,170,110,8).fillRoundedRect(830,250,210,120,8); g.fillStyle(0xffd6a1).fillRect(420,330,110,50).fillRect(865,280,150,60); }
  drawLocations(){
    this.locationRects = [];
    this.locations.forEach(l => {
      const r = this.add.zone(l.x,l.y,l.w,l.h).setOrigin(0,0);
      this.physics.add.existing(r,true); this.locationRects.push({zone:r,data:l});
      const color = l.locked ? '#777' : '#ffd56b';
      this.add.text(l.x+10,l.y-45,`${l.name}\n${l.hint}`,{fontFamily:'monospace',fontSize:'18px',color,backgroundColor:'rgba(45,24,16,.75)',padding:{x:12,y:8}}).setDepth(30);
    });
  }
  update(){
    this.move(this.girl, this.cursors.left.isDown, this.cursors.right.isDown, this.cursors.up.isDown, this.cursors.down.isDown);
    this.move(this.boy, this.keys.A.isDown, this.keys.D.isDown, this.keys.W.isDown, this.keys.S.isDown);
    const near = this.findNearby();
    if(near){ this.prompt.textContent = `${near.name}: ${near.hint}`; this.prompt.classList.remove('hidden'); }
    else this.prompt.classList.add('hidden');
    if(Phaser.Input.Keyboard.JustDown(this.keys.E) && near && !near.locked){
      if(near.page) location.href = near.page;
      if(near.popup){ this.modalText.textContent = near.popup; this.modal.classList.remove('hidden'); }
    }
  }
  move(sprite,left,right,up,down){
    const speed=210; let vx=0,vy=0;
    if(left) vx=-speed; if(right) vx=speed; if(up) vy=-speed; if(down) vy=speed;
    sprite.body.setVelocity(vx,vy); if(vx&&vy) sprite.body.velocity.normalize().scale(speed);
    if(vx<0) sprite.setFlipX(true); if(vx>0) sprite.setFlipX(false);
  }
  findNearby(){
    for(const item of this.locationRects){
      const l=item.data;
      const cx=l.x+l.w/2, cy=l.y+l.h/2;
      const d1=Phaser.Math.Distance.Between(this.girl.x,this.girl.y,cx,cy);
      const d2=Phaser.Math.Distance.Between(this.boy.x,this.boy.y,cx,cy);
      if(Math.min(d1,d2)<180) return l;
    }
    return null;
  }
}

new Phaser.Game({ type: Phaser.AUTO, width: 1400, height: 900, parent:'game', physics:{ default:'arcade' }, scene: AnniversaryScene, scale:{ mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH } });
