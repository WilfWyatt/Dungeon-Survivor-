const c=document.getElementById('game'),ctx=c.getContext('2d');
let W=360,H=480,dpr=1,last=0,room=1,kills=0,gold=0,gameOver=false,roomCleared=false,xp=0,level=1,xpNeed=12;
let area=1,areaName='CASTLE',areaRooms=6,bossRoom=7,atShop=false,areaComplete=false;
const SPRITE_SCALE=0.82;
const player={x:0,y:0,r:14*SPRITE_SCALE,hp:100,maxHp:100,speed:215,fire:0,damage:25,flash:0};
let enemies=[],loot=[],slashes=[],deathMarks=[],particles=[],keys={},joy={x:0,y:0,active:false},fireHeld=false;
let shopMessage='';
let nextSwingSide=1, swingCooldown=0, facing=0;
const P={ink:'#061316',deep:'#0a1c20',wall:'#172d31',wall2:'#234247',stone:'#29494a',moss:'#3f6d43',vine:'#2f603c',teal:'#52d8c0',teal2:'#83f0d7',cream:'#d8d4bd',gold:'#e5b94d',gold2:'#ffd86a',red:'#c95159',red2:'#ed6a70',blue:'#5fa9c7',green:'#4dbb88'};

function fitGameFrame(){const frame=document.getElementById('gameFrame'),top=document.getElementById('topUI'),controls=document.getElementById('controls');if(!frame||!top||!controls)return;const gaps=10;const safe=16;const maxH=Math.max(320,Math.min(480,innerHeight-top.offsetHeight-controls.offsetHeight-gaps-safe));const maxW=Math.max(240,Math.min(360,innerWidth-24));const h=Math.min(maxH,maxW/0.75);frame.style.width=Math.round(h*0.75)+'px';frame.style.height=Math.round(h)+'px';c.style.width=frame.clientWidth+'px';c.style.height=frame.clientHeight+'px'}
function resize(){dpr=Math.min(devicePixelRatio||1,2);c.width=360*dpr;c.height=480*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);W=360;H=480;fitGameFrame()}
addEventListener('resize',resize);resize();
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function msg(t){document.getElementById('message').textContent=t}
function showPickup(t){const n=document.getElementById('pickupNotice');n.textContent=t;n.classList.add('show');clearTimeout(showPickup.t);showPickup.t=setTimeout(()=>n.classList.remove('show'),1800)}
function updateHud(){
 document.getElementById('room').textContent=isBossRoom()?`BOSS`:`${room}`;
 document.getElementById('areaText').textContent=`AREA ${area} • ${areaName}`;
 document.getElementById('hp').style.width=Math.max(0,player.hp/player.maxHp*100)+'%';
 document.getElementById('hpText').textContent=`${Math.ceil(player.hp)} / ${player.maxHp}`;
 document.getElementById('gold').textContent=gold;
 document.getElementById('xp').style.width=Math.max(0,Math.min(100,xp/xpNeed*100))+'%';
 document.getElementById('levelText').textContent=`LV ${level}`;
}

function resetRoom(){
 player.x=Math.max(120,W/2);player.y=Math.max(110,H/2);player.hp=clamp(player.hp,0,player.maxHp);player.flash=0;
 enemies=[];loot=[];slashes=[];deathMarks=[];particles=[];roomCleared=false;atShop=false;areaComplete=false;
 const isBoss=room===bossRoom;
 const count=isBoss?1:Math.min(5+room*2,18);
 const top=82,bottom=Math.max(top+120,H-78),left=42,right=Math.max(left+210,W-42);
 if(isBoss){
  enemies.push({x:W-105,y:H/2,r:34*SPRITE_SCALE,type:'boss',hp:650+area*100,max:650+area*100,speed:35+area*2,hit:0,boss:true});
  msg('BOSS ROOM — DEFEAT THE GUARDIAN');
 }else{
  for(let i=0;i<count;i++){
   let x,y,tries=0;
   do{x=left+Math.random()*(right-left);y=top+Math.random()*(bottom-top);tries++}while(Math.hypot(x-player.x,y-player.y)<150&&tries<30);
   const type=i%4===0?'bat':(i%3===0?'slime':'skeleton');
   const base=type==='bat'?34:type==='slime'?46:54;
   enemies.push({x,y,r:(type==='bat'?14:15+Math.random()*3)*SPRITE_SCALE,type,hp:base+room*7,max:base+room*7,speed:(type==='bat'?65:45)+room*2,hit:0});
  }
  msg(`AREA ${area} • ${areaName} — ROOM ${room} • CLEAR THE ROOM`);
 }
 updateHud();
}

function isBossRoom(){return room===bossRoom}
function bossDefeated(){return room===bossRoom && roomCleared}
function beginAreaShop(){
 atShop=true;areaComplete=true;shopMessage=`${areaName} COMPLETE — spend your gold before the next area.`;
 msg('AREA COMPLETE — CHOOSE YOUR UPGRADES');
}
function buyUpgrade(type){
 if(!atShop)return;
 if(type==='damage'){
  const cost=100;
  if(gold<cost){showPickup('Not enough gold for +5 DAMAGE');return}
  gold-=cost;player.damage+=5;showPickup('+5 DAMAGE purchased');
 }else if(type==='health'){
  const cost=75;
  if(gold<cost){showPickup('Not enough gold for +10 MAX HP');return}
  gold-=cost;player.maxHp+=10;player.hp=player.maxHp;showPickup('+10 MAX HP — fully healed');
 }
 updateHud();
}
function continueFromShop(){
 if(!atShop)return;
 atShop=false;areaComplete=false;area++;areaName=area===2?'TBD':`AREA ${area}`;room=1;
 showPickup(`Entering Area ${area}`);
 msg(`AREA ${area} — ${areaName}`);
 resetRoom();
}

function spawnLoot(x,y,enemyType){
 // Almost everything is gold. Healing is deliberately rare.
 const roll=Math.random();
 let type='Gold',amount=1+Math.floor(Math.random()*5);
 if(roll<0.035) type='Heart';
 else if(roll<0.105) type='Potion';
 loot.push({x,y,r:11,type,amount,bob:Math.random()*6.28,spin:Math.random()*6.28});
 if(type==='Gold') showPickup(`🪙 ${amount} gold dropped — walk over it to collect`);
 else if(type==='Heart') showPickup('♥ RARE HEART — full heal!');
 else showPickup('✚ RARE POTION — small heal');
}

function awardXP(amount){
 xp+=amount;
 let levelled=false,bonusTotal=0;
 while(xp>=xpNeed){
  xp-=xpNeed; level++; levelled=true;
  xpNeed=12+(level-1)*6;
  player.maxHp+=5; player.hp=clamp(player.hp+5,0,player.maxHp);
  const bonus=10+Math.floor(Math.random()*11); gold+=bonus; bonusTotal+=bonus;
  player.damage+=2;
 }
 if(levelled){showPickup(`★ LEVEL ${level}!  +5 MAX HP  +${bonusTotal} GOLD  +2 DAMAGE`);msg(`LEVEL UP!  You feel stronger.`);}
 updateHud();
}

function findNearestEnemy(){
 return enemies.reduce((p,e)=>!p||dist(player,e)<dist(player,p)?e:p,null);
}
function performSwing(){
 if(gameOver||roomCleared||enemies.length===0||swingCooldown>0)return;
 const target=findNearestEnemy();
 if(target) facing=Math.atan2(target.y-player.y,target.x-player.x);
 const side=nextSwingSide;
 nextSwingSide*=-1;
 swingCooldown=.30;
 slashes.push({age:0,duration:.18,side,angle:facing,hit:new Set(),damage:player.damage});
}

function update(dt){
 if(gameOver)return;
 if(atShop){updateHud();return;}
 player.fire=Math.max(0,player.fire-dt);player.flash=Math.max(0,player.flash-dt);swingCooldown=Math.max(0,swingCooldown-dt);
 let mx=(keys.d?1:0)-(keys.a?1:0),my=(keys.s?1:0)-(keys.w?1:0);
 if(joy.active){mx=joy.x;my=joy.y}
 const l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}
 player.x=clamp(player.x+mx*player.speed*dt,30,W-30);player.y=clamp(player.y+my*player.speed*dt,70,H-70);
 if(fireHeld)performSwing();

 enemies.forEach(e=>{
  e.hit=Math.max(0,e.hit-dt);
  const a=Math.atan2(player.y-e.y,player.x-e.x);e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt;
  if(dist(e,player)<e.r+player.r){player.hp-=22*dt;player.flash=.08;if(player.hp<=0){player.hp=0;gameOver=true;msg('You died — tap FIRE to restart')}}
 });

 for(let i=slashes.length-1;i>=0;i--){
  const s=slashes[i];
  s.age+=dt;
  const progress=s.age/s.duration;
  const centre=s.angle+s.side*.72;
  const reach=58;
  for(const e of [...enemies]){
   if(s.hit.has(e))continue;
   const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy);
   let da=Math.atan2(dy,dx)-centre;
   da=Math.atan2(Math.sin(da),Math.cos(da));
   if(d<reach+e.r && Math.abs(da)<.82){
    e.hp-=s.damage;s.hit.add(e);e.hit=.12;burst(e.x,e.y,'hit',4);
    if(e.hp<=0){deathMarks.push({x:e.x,y:e.y,type:e.type,seed:Math.random()*1000});if(e.type!=='boss')spawnLoot(e.x,e.y,e.type);enemies.splice(enemies.indexOf(e),1);kills++;awardXP(e.type==='boss'?30:e.type==='bat'?3:e.type==='slime'?4:5);burst(e.x,e.y,'death',e.type==='boss'?28:12);}
   }
  }
  if(progress>=1)slashes.splice(i,1);
 }

 loot.forEach(l=>{l.bob+=dt*3;l.spin+=dt*2});
 for(let i=loot.length-1;i>=0;i--){
  const l=loot[i];
  if(dist(player,l)<player.r+l.r+9){
   if(l.type==='Gold'){gold+=l.amount;showPickup(`🪙 +${l.amount} GOLD  •  purse: ${gold}`)}
   if(l.type==='Heart'){player.hp=player.maxHp;showPickup('♥ FULL HEAL!')}
   if(l.type==='Potion'){const before=player.hp;player.hp=clamp(player.hp+18,0,player.maxHp);showPickup(`✚ +${Math.round(player.hp-before)} HP`)}
   burst(l.x,l.y,l.type==='Gold'?'coin':'heal',8);loot.splice(i,1);updateHud()
  }
 }

 particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.vx*=.985;p.vy*=.985});particles=particles.filter(p=>p.life>0);

 if(enemies.length===0&&!roomCleared){
  roomCleared=true;
  if(isBossRoom()){
   msg(`AREA ${area} COMPLETE — reach the EXIT »`);
   showPickup('Guardian defeated — walk to the exit');
  }else{
   msg('ROOM CLEARED — reach the EXIT »');
   showPickup('Room cleared — walk to the glowing exit');
  }
 }
 if(roomCleared&&!atShop){
  const ex={x:W-22,y:H/2};
  if(Math.abs(player.x-ex.x)<30 && Math.abs(player.y-ex.y)<66){
   if(isBossRoom()) beginAreaShop();
   else {room++;resetRoom();showPickup(`Entering room ${room}`)}
  }
 }
 updateHud();
}

function burst(x,y,type='death',n=8){
 for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=25+Math.random()*110;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:type==='shot'?.12:.45,type})}
}
function pixelRect(x,y,w,h,fill){ctx.fillStyle=fill;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function text(t,x,y,size,fill,align='left'){ctx.fillStyle=fill;ctx.font=`700 ${size}px ui-monospace,monospace`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(t,x,y)}
function panel(x,y,w,h){pixelRect(x,y,w,h,'#061619e8');ctx.strokeStyle='#376566';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h)}

function drawDungeon(){
 ctx.fillStyle=P.ink;ctx.fillRect(0,0,W,H);
 const hudH=0, tile=40;
 // full fixed 360x480 game viewport; HTML owns the HUD above it
 pixelRect(0,0,W,H,P.deep);
 // floor tiles with individual cracks/highlights
 for(let y=0;y<H-54;y+=tile){for(let x=14;x<W-14;x+=tile){
  const gx=(x/tile|0),gy=(y/tile|0),n=(gx*31+gy*17+room*13)%7;
  pixelRect(x,y,tile-2,tile-2,[P.wall,P.wall2,'#29484a','#203c40','#29474a','#1d373b','#2b4b4b'][n]);
  pixelRect(x+3,y+3,tile-8,2,'#365457');
  if(n===2||n===5){pixelRect(x+8,y+15,12,2,'#142b2f');pixelRect(x+19,y+17,8,2,'#142b2f')}
  if(n===4){pixelRect(x+29,y+7,3,10,'#31504e');pixelRect(x+27,y+17,6,2,'#31504e')}
 }}
 // heavy perimeter masonry, inspired by the reference
 pixelRect(0,0,W,13,'#09181b');pixelRect(0,H-55,W,55,'#08171a');
 for(let x=8;x<W;x+=58){pixelRect(x,3,48,7,P.stone);pixelRect(x,H-48,48,8,P.stone)}
 pixelRect(0,0,12,H-55,P.wall);pixelRect(W-12,0,12,H-55,P.wall);
 // moss creeping along walls
 ctx.strokeStyle=P.vine;ctx.lineWidth=5;ctx.lineCap='round';
 for(let i=0;i<8;i++){let x=24+i*(W-48)/7;ctx.beginPath();ctx.moveTo(x,hudH+7);ctx.quadraticCurveTo(x-16,105+i%3*28,x+7,132+i%4*25);ctx.quadraticCurveTo(x+25,155+i%3*35,x+2,190+i%2*40);ctx.stroke()}
 for(let i=0;i<10;i++){let x=20+i*(W-40)/9;ctx.beginPath();ctx.moveTo(x,H-49);ctx.quadraticCurveTo(x+16,H-88,x-5,H-118);ctx.stroke()}
 // banners and skull shrine
 drawBanner(W/2-95,5);drawBanner(W/2+95,5);drawSkullShrine(W/2,24);
 drawTorch(55,42);drawTorch(W-82,42);drawTorch(55,H-95);drawTorch(W-82,H-95);
 // Enemy-specific death marks are drawn after kills so the floor tells the story.
}
function drawBanner(x,y){ctx.save();ctx.translate(x,y);pixelRect(-18,0,36,6,'#6d5630');pixelRect(-14,5,28,39,'#163e3b');pixelRect(-10,9,20,26,'#245650');pixelRect(-3,15,6,8,P.teal);pixelRect(-6,18,12,3,P.teal);ctx.fillStyle='#c7a65a';ctx.beginPath();ctx.moveTo(-14,44);ctx.lineTo(0,55);ctx.lineTo(14,44);ctx.closePath();ctx.fill();ctx.restore()}
function drawSkullShrine(x,y){ctx.save();ctx.shadowBlur=10;ctx.shadowColor='#142f31';pixelRect(x-30,y-2,60,30,'#10262a');pixelRect(x-24,y-15,48,15,P.wall2);text('☠',x,y+18,31,'#7c9181','center');ctx.restore()}
function drawBone(x,y,r){ctx.save();ctx.translate(x,y);ctx.rotate(r);pixelRect(-18,-2,36,4,'#9c9a85');pixelRect(-17,-6,5,5,P.cream);pixelRect(12,1,5,5,P.cream);ctx.restore()}
function drawBlood(x,y,col){ctx.fillStyle=col;for(let i=0;i<8;i++){const a=i*1.7;const rr=6+((i*13)%17);pixelRect(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.55,2+(i%3),2+(i%2),ctx.fillStyle)}}
function drawBonePile(x,y){drawBone(x-5,y-2,-.65);drawBone(x+6,y+3,.7)}
function drawDeathMarks(){for(const m of deathMarks){if(m.type==='skeleton')drawBonePile(m.x,m.y);else if(m.type==='bat'||m.type==='boss')drawBlood(m.x,m.y,'#7a3035');else drawBlood(m.x,m.y,'#3b7b45')}}
function drawTorch(x,y){ctx.save();ctx.shadowBlur=24;ctx.shadowColor=P.teal;pixelRect(x-8,y,16,28,'#5b655d');pixelRect(x-5,y+5,10,19,'#2b4543');ctx.fillStyle=P.teal2;ctx.beginPath();ctx.moveTo(x,y-20);ctx.lineTo(x+9,y-5);ctx.lineTo(x,y+4);ctx.lineTo(x-9,y-5);ctx.closePath();ctx.fill();ctx.fillStyle=P.teal;ctx.beginPath();ctx.moveTo(x,y-14);ctx.lineTo(x+4,y-5);ctx.lineTo(x,y);ctx.lineTo(x-4,y-5);ctx.closePath();ctx.fill();ctx.restore()}

function drawSlash(s){
 const p=Math.min(1,s.age/s.duration);
 const centre=s.angle+s.side*.72;
 const start=centre-s.side*.78, end=centre+s.side*.22;
 ctx.save();ctx.translate(player.x,player.y);ctx.rotate(0);
 ctx.strokeStyle=P.cream;ctx.lineWidth=7;ctx.lineCap='round';ctx.shadowBlur=12;ctx.shadowColor=P.teal2;
 ctx.globalAlpha=Math.sin(Math.min(1,p)*Math.PI)*.92;
 ctx.beginPath();ctx.arc(0,0,47,start,end,s.side<0);ctx.stroke();
 ctx.strokeStyle=P.teal2;ctx.lineWidth=2;ctx.globalAlpha*=.8;ctx.beginPath();ctx.arc(0,0,51,start,end,s.side<0);ctx.stroke();
 ctx.restore();
}
function drawPlayer(){
 const x=player.x,y=player.y;ctx.save();ctx.translate(x,y);ctx.scale(SPRITE_SCALE,SPRITE_SCALE);ctx.shadowBlur=player.flash?22:13;ctx.shadowColor=P.teal;
 // hood/body silhouette
 pixelRect(-10,5,20,14,'#071517');pixelRect(-14,0,28,13,'#174642');pixelRect(-11,-12,22,15,'#0c3031');pixelRect(-7,-9,14,9,P.cream);
 // hood shadow + eyes
 pixelRect(-5,-8,10,7,'#071719');pixelRect(-4,-5,3,2,P.teal2);pixelRect(2,-5,3,2,P.teal2);
 // cloak highlights, boots, sword
 pixelRect(-12,11,7,9,'#0c2829');pixelRect(5,11,7,9,'#0c2829');pixelRect(-15,6,5,7,'#25645a');
 ctx.save();ctx.rotate(facing);pixelRect(8,-2,5,5,'#6f4f32');pixelRect(12,-3,20,4,P.cream);pixelRect(30,-5,5,8,P.cream);pixelRect(11,-5,3,9,P.gold2);ctx.restore();ctx.restore();
}
function drawEnemy(e,i){
 const x=e.x,y=e.y;ctx.save();ctx.translate(x,y);ctx.scale(SPRITE_SCALE,SPRITE_SCALE);ctx.shadowBlur=9;ctx.shadowColor=e.type==='bat'?P.red:P.teal;
 if(e.type==='boss'){
  // Giant castle guardian: chunky goblin silhouette, deliberately much larger than normal enemies.
  pixelRect(-25,5,50,30,'#244b3d');pixelRect(-31,-4,62,25,'#397d55');pixelRect(-24,-28,48,28,'#4c9a63');
  pixelRect(-17,-21,11,9,P.red2);pixelRect(6,-21,11,9,P.red2);pixelRect(-11,-13,22,8,'#17251f');
  pixelRect(-37,8,12,26,'#315f4a');pixelRect(25,8,12,26,'#315f4a');
  pixelRect(-20,32,14,9,'#122a24');pixelRect(6,32,14,9,'#122a24');
  pixelRect(31,-2,15,5,P.cream);pixelRect(43,-5,5,11,P.cream);
 }else if(e.type==='skeleton'){
  pixelRect(-10,-6,20,14,P.cream);pixelRect(-8,-17,16,12,'#e3ddc8');pixelRect(-4,-13,3,4,P.ink);pixelRect(2,-13,3,4,P.ink);pixelRect(-14,6,8,4,'#b9b5a3');pixelRect(6,6,8,4,'#b9b5a3');pixelRect(-10,12,7,5,'#8f8c7f');pixelRect(3,12,7,5,'#8f8c7f');pixelRect(-2,-1,4,3,'#8d887a');
 }else if(e.type==='bat'){
  pixelRect(-7,-5,14,15,'#16262b');pixelRect(-21,-13,14,20,'#234b4a');pixelRect(7,-13,14,20,'#234b4a');pixelRect(-16,-8,7,11,'#1a3839');pixelRect(9,-8,7,11,'#1a3839');pixelRect(-4,-1,3,3,P.red2);pixelRect(2,-1,3,3,P.red2);
 }else{
  pixelRect(-14,-5,28,15,'#397d65');pixelRect(-10,-11,20,7,'#57b48b');pixelRect(-7,-7,14,4,'#6ac89b');pixelRect(-6,-1,4,3,P.ink);pixelRect(2,-1,4,3,P.ink);pixelRect(-12,7,5,3,'#275b4b');pixelRect(7,7,5,3,'#275b4b');
 }
 ctx.restore();
 pixelRect(x-e.r,y-e.r-11,e.r*2,4,'#0a1719');pixelRect(x-e.r,y-e.r-11,e.r*2*Math.max(0,e.hp/e.max),4,P.red);
 if(e.type==='boss')text('GUARDIAN',x,y-e.r-18,7,P.cream,'center');
}
function drawLoot(l){
 const y=l.y+Math.sin(l.bob)*3,x=l.x;ctx.save();ctx.translate(x,y);ctx.shadowBlur=14;ctx.shadowColor=l.type==='Gold'?P.gold:P.teal;
 if(l.type==='Gold'){
  pixelRect(-13,2,10,8,P.gold);pixelRect(1,-3,11,9,P.gold2);pixelRect(-4,-9,10,9,'#f0c85c');pixelRect(-10,4,5,3,'#8f6b25');pixelRect(4,-1,5,3,'#9d7426');
 }else if(l.type==='Heart'){
  ctx.fillStyle=P.red2;ctx.beginPath();ctx.moveTo(0,11);ctx.lineTo(-13,-1);ctx.quadraticCurveTo(-15,-12,-7,-13);ctx.quadraticCurveTo(0,-13,0,-6);ctx.quadraticCurveTo(0,-13,7,-13);ctx.quadraticCurveTo(15,-12,13,-1);ctx.closePath();ctx.fill();pixelRect(-7,-7,4,3,'#ffb0a5');
 }else{
  pixelRect(-5,-13,10,5,P.cream);pixelRect(-9,-7,18,17,'#25876e');pixelRect(-6,-4,12,11,'#55c997');pixelRect(-3,1,6,6,'#8ee7b9');pixelRect(-7,-15,14,3,'#bcae87');
 }
 ctx.restore();
}

function drawExit(){
 const x=W-12,y=H/2;ctx.save();
 // Door is recessed into the right wall.
 pixelRect(x-24,y-54,24,108,'#081619');pixelRect(x-20,y-48,20,96,'#173336');pixelRect(x-17,y-44,17,88,'#0d2528');
 ctx.strokeStyle=P.teal2;ctx.lineWidth=3;ctx.strokeRect(x-21,y-50,21,100);
 text('»',x-9,y+12,38,P.teal2,'center');
 if(!roomCleared){
  pixelRect(x-14,y-9,18,20,'#6d5a34');pixelRect(x-11,y-13,12,10,'#b9a56b');
  ctx.strokeStyle='#172124';ctx.lineWidth=3;ctx.strokeRect(x-9,y-10,8,10);pixelRect(x-7,y-3,4,5,'#172124');
 }else text('EXIT',x-9,y+65,8,P.cream,'center');
 ctx.restore();
}
function drawShop(){
 ctx.fillStyle='#02090ae8';ctx.fillRect(10,55,W-20,H-110);
 panel(25,75,W-50,330);
 text(`${areaName} COMPLETE`,W/2,105,18,P.teal2,'center');
 text(`PURSE  ${gold} GOLD`,W/2,128,10,P.gold2,'center');
 text('SPEND GOLD ON PERMANENT UPGRADES',W/2,150,8,P.cream,'center');
 panel(48,172,264,58);text('SWORD DAMAGE',60,192,9,P.cream);text('+5',60,211,13,P.teal2);text('100 G',292,207,10,P.gold2,'right');
 panel(48,242,264,58);text('MAX HEALTH',60,262,9,P.cream);text('+10  •  FULL HEAL',60,281,11,P.teal2);text('75 G',292,277,10,P.gold2,'right');
 panel(48,318,264,50);text('CONTINUE',W/2,349,12,P.teal2,'center');
 text('TAP AN UPGRADE • TAP CONTINUE WHEN READY',W/2,390,7,'#78918a','center');
}

function draw(){
 ctx.clearRect(0,0,W,H);drawDungeon();
 if(!atShop)drawExit();
 drawDeathMarks();
 loot.forEach(drawLoot);
 enemies.forEach((e,i)=>drawEnemy(e,i));drawPlayer();
 slashes.forEach(drawSlash);
 particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/.45);let col=p.type==='coin'?P.gold2:(p.type==='heal'?P.teal2:(p.type==='hit'?P.cream:P.gold));pixelRect(p.x,p.y,4,4,col);ctx.globalAlpha=1});
 if(roomCleared&&!atShop){panel(W/2-125,H-65,250,34);text(isBossRoom()?'BOSS DEFEATED  •  WALK TO EXIT »':'ROOM CLEARED  •  WALK TO EXIT »',W/2,H-43,10,P.teal2,'center')}
 if(atShop)drawShop();
 if(gameOver){ctx.fillStyle='#02090ad9';ctx.fillRect(0,0,W,H);text('GAME OVER',W/2,H/2-15,30,P.cream,'center');text('TAP FIRE TO RESTART',W/2,H/2+18,11,P.teal2,'center')}
}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}

resetRoom();requestAnimationFrame(loop);
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.code==='Space')fireHeld=true;if(gameOver&&e.code==='Space')restart()});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(e.code==='Space')fireHeld=false});
function restart(){gameOver=false;area=1;areaName='CASTLE';room=1;kills=0;gold=0;xp=0;level=1;xpNeed=12;atShop=false;areaComplete=false;player.hp=100;player.maxHp=100;player.damage=25;nextSwingSide=1;swingCooldown=0;resetRoom()}

const stick=document.getElementById('stick'),nub=document.getElementById('nub');
function joyMove(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,m=Math.min(45,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);joy.x=Math.cos(a)*m/45;joy.y=Math.sin(a)*m/45;nub.style.transform=`translate(${joy.x*45}px,${joy.y*45}px)`}
stick.addEventListener('pointerdown',e=>{joy.active=true;stick.setPointerCapture(e.pointerId);joyMove(e)});stick.addEventListener('pointermove',e=>{if(joy.active)joyMove(e)});stick.addEventListener('pointerup',()=>{joy.active=false;joy.x=joy.y=0;nub.style.transform='translate(0,0)'});stick.addEventListener('pointercancel',()=>{joy.active=false;joy.x=joy.y=0;nub.style.transform='translate(0,0)'});
const f=document.getElementById('fire');f.addEventListener('pointerdown',()=>{if(gameOver){restart();return}if(atShop)return;performSwing();fireHeld=true});f.addEventListener('pointerup',()=>fireHeld=false);f.addEventListener('pointercancel',()=>fireHeld=false);
c.addEventListener('pointerdown',e=>{if(!atShop)return;const r=c.getBoundingClientRect();const x=(e.clientX-r.left)*(W/r.width),y=(e.clientY-r.top)*(H/r.height);if(x>=48&&x<=312&&y>=172&&y<=230)buyUpgrade('damage');else if(x>=48&&x<=312&&y>=242&&y<=300)buyUpgrade('health');else if(x>=48&&x<=312&&y>=318&&y<=368)continueFromShop()});
if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('portrait').catch(()=>{});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
