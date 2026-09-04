const c=document.getElementById('game'),ctx=c.getContext('2d');
let W=360,H=480,dpr=1,last=0,room=1,kills=0,gold=0,gameOver=false,roomCleared=false,xp=0,level=1,xpNeed=12;
let area=1,areaName='CASTLE',areaRooms=6,bossRoom=7,atShop=false,areaComplete=false;
const SPRITE_SCALE=0.82;
const player={x:0,y:0,r:14*SPRITE_SCALE,hp:100,maxHp:100,speed:215,fire:0,damage:25,flash:0};
let enemies=[],loot=[],slashes=[],deathMarks=[],particles=[],projectiles=[],entrances=[],keys={},joy={x:0,y:0,active:false},fireHeld=false;
let spawnQueue=[],spawnTimer=0,totalSpawned=0,totalQuota=0,activeCap=0,bossPatternTimer=0,bossPatternStep=0,bossPatternMode='burst';
const ROOM_PLAN={1:{cap:5,total:10,weights:[['bat',.80],['goblin',.10],['skeleton',.10]]},2:{cap:6,total:12,weights:[['bat',.70],['goblin',.15],['skeleton',.15]]},3:{cap:7,total:14,weights:[['bat',.60],['goblin',.20],['skeleton',.20]]},4:{cap:8,total:17,weights:[['bat',.50],['goblin',.25],['skeleton',.25]]},5:{cap:10,total:20,weights:[['bat',.40],['goblin',.30],['skeleton',.30]]},6:{cap:12,total:22,weights:[['bat',1/3],['goblin',1/3],['skeleton',1/3]]}};
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

function chooseEnemyType(weights){
 const r=Math.random();let acc=0;for(const [type,w] of weights){acc+=w;if(r<=acc)return type}return weights[weights.length-1][0];
}
function resetRoom(){
 player.x=Math.max(120,W/2);player.y=Math.max(110,H/2);player.hp=clamp(player.hp,0,player.maxHp);player.flash=0;
 enemies=[];loot=[];slashes=[];deathMarks=[];particles=[];projectiles=[];entrances=[];roomCleared=false;atShop=false;areaComplete=false;
 spawnQueue=[];spawnTimer=.35;totalSpawned=0;bossPatternTimer=1.1;bossPatternStep=0;bossPatternMode='burst';
 const isBoss=room===bossRoom;
 if(isBoss){
  totalQuota=1;activeCap=1;
  const hp=650+area*100;
  enemies.push({x:W-105,y:H/2,r:34*SPRITE_SCALE,type:'boss',hp,max:hp,speed:35+area*2,hit:0,boss:true,attackTimer:1.1});
  msg('BOSS ROOM — DEFEAT THE GUARDIAN');
 }else{
  const plan=ROOM_PLAN[room]||ROOM_PLAN[6];activeCap=plan.cap;totalQuota=plan.total;
  for(let i=0;i<totalQuota;i++)spawnQueue.push(chooseEnemyType(plan.weights));
  msg(`AREA ${area} • ${areaName} — ROOM ${room} • CLEAR THE ROOM`);
  trySpawnEnemy(.2);
 }
 updateHud();
}
function getFurthestSpawnPoint(){
 const left=43,right=W-43,top=82,bottom=H-78;
 const candidates=[];
 for(let x=left;x<=right;x+=35){candidates.push({x,y:top});candidates.push({x,y:bottom})}
 for(let y=top+20;y<=bottom-20;y+=35){candidates.push({x:left,y});candidates.push({x:right,y})}
 const scored=candidates.map(p=>({p,d:Math.hypot(p.x-player.x,p.y-player.y)})).sort((a,b)=>b.d-a.d);
 const topBand=scored.slice(0,Math.max(4,Math.ceil(scored.length*.22)));
 return topBand[Math.floor(Math.random()*topBand.length)].p;
}
function startEntrance(type){
 const p=getFurthestSpawnPoint();
 entrances.push({x:p.x,y:p.y,type,age:0,duration:type==='bat'?.58:.68,active:false,shadow:type==='bat'});
}
function trySpawnEnemy(delay=0){
 if(isBossRoom()||roomCleared||spawnQueue.length===0)return;
 if(enemies.length+entrances.length>=activeCap)return;
 if(spawnTimer>0){spawnTimer=Math.max(spawnTimer,delay);return}
 const type=spawnQueue.shift();totalSpawned++;
 startEntrance(type);spawnTimer=.65;
}
function activateEntrance(ent){
 const base=ent.type==='bat'?34:ent.type==='goblin'?48:58;
 const speed=ent.type==='bat'?78:ent.type==='goblin'?42:34;
 const r=ent.type==='bat'?11:15;
 const hp=base+room*7;
 enemies.push({x:ent.x,y:ent.y,r:r*SPRITE_SCALE,type:ent.type,hp,max:hp,speed:speed+room*2,hit:0,attackCooldown:.8,windup:0,active:true});
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

 spawnTimer=Math.max(0,spawnTimer-dt);
 if(enemies.length<activeCap && spawnQueue.length && spawnTimer<=0)trySpawnEnemy();

 for(let i=entrances.length-1;i>=0;i--){
  const ent=entrances[i];ent.age+=dt;
  if(ent.age>=ent.duration){activateEntrance(ent);entrances.splice(i,1);burst(ent.x,ent.y,'spawn',ent.type==='skeleton'?12:10,ent.type)}
 }

 for(const e of enemies){
  e.hit=Math.max(0,e.hit-dt);
  const d=dist(e,player);
  if(e.type==='goblin'){
   const a=Math.atan2(player.y-e.y,player.x-e.x);
   const desired=135;
   let move=0;if(d>desired+20)move=1;else if(d<desired-25)move=-1;
   const strafe=Math.sin(performance.now()/700+e.x)*.55;
   e.x+=((Math.cos(a)*move)+Math.cos(a+Math.PI/2)*strafe)*e.speed*dt;
   e.y+=((Math.sin(a)*move)+Math.sin(a+Math.PI/2)*strafe)*e.speed*dt;
   e.attackCooldown-=dt;
   if(d<260&&e.attackCooldown<=0&&e.windup<=0){e.windup=.38;e.attackCooldown=1.45;}
   if(e.windup>0){e.windup-=dt;if(e.windup<=0){shootProjectile(e.x,e.y,a,115,10,'arrow')}}
  }else if(e.type==='skeleton'){
   const a=Math.atan2(player.y-e.y,player.x-e.x);
   if(d>52){e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt}
   e.attackCooldown-=dt;
   if(d<78&&e.attackCooldown<=0&&e.windup<=0)e.windup=.48;
   if(e.windup>0){e.windup-=dt;if(e.windup<=0){player.hp-=14;player.flash=.12;burst(player.x,player.y,'hit',5);e.attackCooldown=1.2}}
  }else if(e.type==='bat'){
   const a=Math.atan2(player.y-e.y,player.x-e.x);e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt;
  }else if(e.type==='boss'){
   const a=Math.atan2(player.y-e.y,player.x-e.x);
   if(d>150){e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt}
   e.attackTimer-=dt;
   if(e.attackTimer<=0){bossPatternMode=bossPatternStep%2===0?'burst':'spiral';bossPatternStep++;e.attackTimer=bossPatternMode==='burst'?3.2:5.4;bossPatternTimer=0;}
   if(bossPatternMode==='burst'&&bossPatternTimer<1.0){
    const n=5, gap=.16, idx=Math.floor(bossPatternTimer/gap);
    if(idx< n && Math.abs(bossPatternTimer-idx*gap)<dt*1.2){const base=Math.atan2(player.y-e.y,player.x-e.x);shootProjectile(e.x,e.y,base+(idx-2)*.11,105,14,'boss')}
    bossPatternTimer+=dt;
   }else if(bossPatternMode==='spiral'&&bossPatternTimer<3.6){
    const idx=Math.floor(bossPatternTimer/.14);const prev=Math.floor((bossPatternTimer-dt)/.14);
    if(idx!==prev){const a=idx*.48;shootProjectile(e.x,e.y,a,88,12,'spiral');shootProjectile(e.x,e.y,a+Math.PI,88,12,'spiral')}
    bossPatternTimer+=dt;
   }
  }
  e.x=clamp(e.x,32,W-32);e.y=clamp(e.y,72,H-72);
  if(e.type!=='goblin'&&e.type!=='skeleton'&&d<e.r+player.r){player.hp-=e.type==='boss'?30*dt:22*dt;player.flash=.08}
  if(player.hp<=0){player.hp=0;gameOver=true;msg('You died — tap FIRE to restart')}
 }

 for(let i=projectiles.length-1;i>=0;i--){const q=projectiles[i];q.x+=Math.cos(q.a)*q.speed*dt;q.y+=Math.sin(q.a)*q.speed*dt;q.life-=dt;if(q.life<=0||q.x<15||q.x>W-15||q.y<60||q.y>H-60){projectiles.splice(i,1);continue}if(Math.hypot(q.x-player.x,q.y-player.y)<q.r+player.r){player.hp-=q.damage;player.flash=.15;burst(player.x,player.y,'hit',5);projectiles.splice(i,1);if(player.hp<=0){player.hp=0;gameOver=true;msg('You died — tap FIRE to restart')}}}

 for(let i=slashes.length-1;i>=0;i--){
  const s=slashes[i];s.age+=dt;const progress=s.age/s.duration;const centre=s.angle+s.side*.72;const reach=58;
  for(const e of [...enemies]){if(s.hit.has(e)||!e.active)continue;const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy);let da=Math.atan2(dy,dx)-centre;da=Math.atan2(Math.sin(da),Math.cos(da));if(d<reach+e.r&&Math.abs(da)<.82){e.hp-=s.damage;s.hit.add(e);e.hit=.12;burst(e.x,e.y,'hit',4);if(e.hp<=0){deathMarks.push({x:e.x,y:e.y,type:e.type,seed:Math.random()*1000});if(e.type!=='boss')spawnLoot(e.x,e.y,e.type);enemies.splice(enemies.indexOf(e),1);kills++;awardXP(e.type==='boss'?30:e.type==='bat'?3:e.type==='goblin'?4:5);burst(e.x,e.y,'death',e.type==='boss'?28:12);if(!isBossRoom())spawnTimer=.65;}}}
  if(progress>=1)slashes.splice(i,1);
 }

 loot.forEach(l=>{l.bob+=dt*3;l.spin+=dt*2});
 for(let i=loot.length-1;i>=0;i--){const l=loot[i];if(dist(player,l)<player.r+l.r+9){if(l.type==='Gold'){gold+=l.amount;showPickup(`🪙 +${l.amount} GOLD  •  purse: ${gold}`)}if(l.type==='Heart'){player.hp=player.maxHp;showPickup('♥ FULL HEAL!')}if(l.type==='Potion'){const before=player.hp;player.hp=clamp(player.hp+18,0,player.maxHp);showPickup(`✚ +${Math.round(player.hp-before)} HP`)}burst(l.x,l.y,l.type==='Gold'?'coin':'heal',8);loot.splice(i,1);updateHud()}}
 particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.vx*=.985;p.vy*=.985});particles=particles.filter(p=>p.life>0);
 if(!isBossRoom()&&spawnQueue.length===0&&entrances.length===0&&enemies.length===0&&!roomCleared){roomCleared=true;msg('ROOM CLEARED — reach the EXIT »');showPickup('Room cleared — walk to the glowing exit')}
 if(isBossRoom()&&enemies.length===0&&!roomCleared){roomCleared=true;msg(`AREA ${area} COMPLETE — reach the EXIT »`);showPickup('Guardian defeated — walk to the exit')}
 if(roomCleared&&!atShop){const ex={x:W-22,y:H/2};if(Math.abs(player.x-ex.x)<30&&Math.abs(player.y-ex.y)<66){if(isBossRoom())beginAreaShop();else{room++;resetRoom();showPickup(`Entering room ${room}`)}}}
 updateHud();
}
function shootProjectile(x,y,a,speed,damage,type){projectiles.push({x,y,a,speed,damage,r:type==='arrow'?4:5,life:type==='arrow'?2.6:3.2,type})}

function burst(x,y,type='death',n=8,spawnType=''){
 for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=25+Math.random()*110;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:type==='shot'?.12:.45,type,spawnType})}
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
  pixelRect(-25,5,50,30,'#244b3d');pixelRect(-31,-4,62,25,'#397d55');pixelRect(-24,-28,48,28,'#4c9a63');pixelRect(-17,-21,11,9,P.red2);pixelRect(6,-21,11,9,P.red2);pixelRect(-11,-13,22,8,'#17251f');pixelRect(-37,8,12,26,'#315f4a');pixelRect(25,8,12,26,'#315f4a');pixelRect(-20,32,14,9,'#122a24');pixelRect(6,32,14,9,'#122a24');pixelRect(31,-2,15,5,P.cream);pixelRect(43,-5,5,11,P.cream);
 }else if(e.type==='skeleton'){
  pixelRect(-10,-6,20,14,P.cream);pixelRect(-8,-17,16,12,'#e3ddc8');pixelRect(-4,-13,3,4,P.ink);pixelRect(2,-13,3,4,P.ink);pixelRect(-14,6,8,4,'#b9b5a3');pixelRect(6,6,8,4,'#b9b5a3');pixelRect(-10,12,7,5,'#8f8c7f');pixelRect(3,12,7,5,'#8f8c7f');pixelRect(-2,-1,4,3,'#8d887a');
  ctx.save();ctx.rotate(-.65-(e.windup>0?.5:0));pixelRect(12,-2,4,4,'#6b5539');pixelRect(15,-15,22,4,P.cream);ctx.restore();
 }else if(e.type==='bat'){
  const flap=Math.sin(performance.now()/90+i)*3;pixelRect(-7,-5,14,15,'#16262b');pixelRect(-21,-13-flap,14,20+flap,'#234b4a');pixelRect(7,-13+flap,14,20-flap,'#234b4a');pixelRect(-16,-8,7,11,'#1a3839');pixelRect(9,-8,7,11,'#1a3839');pixelRect(-4,-1,3,3,P.red2);pixelRect(2,-1,3,3,P.red2);
 }else{
  pixelRect(-14,-5,28,15,'#397d65');pixelRect(-10,-11,20,7,'#57b48b');pixelRect(-7,-7,14,4,'#6ac89b');pixelRect(-6,-1,4,3,P.ink);pixelRect(2,-1,4,3,P.ink);pixelRect(-12,7,5,3,'#275b4b');pixelRect(7,7,5,3,'#275b4b');
  ctx.save();ctx.rotate(Math.atan2(player.y-y,player.x-x));pixelRect(9,-2,3,3,'#6f4f32');pixelRect(11,-3,18,3,'#c7a87a');ctx.restore();
 }
 if(e.windup>0){ctx.strokeStyle=P.gold2;ctx.lineWidth=2;ctx.globalAlpha=Math.min(1,e.windup/.48);ctx.beginPath();ctx.arc(0,0,e.r+7,-1.7,-.4);ctx.stroke()}
 ctx.restore();
 pixelRect(x-e.r,y-e.r-11,e.r*2,4,'#0a1719');pixelRect(x-e.r,y-e.r-11,e.r*2*Math.max(0,e.hp/e.max),4,e.type==='boss'?P.gold:P.red);if(e.type==='boss')text('GUARDIAN',x,y-e.r-18,7,P.cream,'center');
}
function drawEntrance(ent){
 const p=Math.min(1,ent.age/ent.duration),x=ent.x,y=ent.y;ctx.save();ctx.translate(x,y);
 if(ent.type==='bat'){
  const h=(1-p)*28,shadow=10+p*8;ctx.globalAlpha=.35;ctx.fillStyle='#02090a';ctx.beginPath();ctx.ellipse(0,10,shadow,4,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.translate(0,-h);ctx.scale(.45+.55*p,.45+.55*p);pixelRect(-7,-5,14,15,'#16262b');pixelRect(-21,-13,14,20,'#234b4a');pixelRect(7,-13,14,20,'#234b4a');pixelRect(-4,-1,3,3,P.red2);pixelRect(2,-1,3,3,P.red2);
 }else if(ent.type==='goblin'){
  const r=5+18*p;ctx.globalAlpha=(1-p)*.7;ctx.fillStyle='#397d65';for(let i=0;i<9;i++){const a=i*2.4;ctx.beginPath();ctx.arc(Math.cos(a)*r*.7,Math.sin(a)*r*.45,r*.16,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=p;ctx.scale(p,p);pixelRect(-14,-5,28,15,'#397d65');pixelRect(-10,-11,20,7,'#57b48b');pixelRect(-6,-1,4,3,P.ink);pixelRect(2,-1,4,3,P.ink);
 }else{
  const r=8+20*p;ctx.globalAlpha=(1-p)*.75;ctx.fillStyle='#8a6743';for(let i=0;i<10;i++){const a=i*2.1;ctx.beginPath();ctx.arc(Math.cos(a)*r*.75,Math.sin(a)*r*.5,2+i%3,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=p;ctx.translate(0,8*(1-p));ctx.scale(.7+.3*p,.7+.3*p);pixelRect(-10,-6,20,14,P.cream);pixelRect(-8,-17,16,12,'#e3ddc8');pixelRect(-4,-13,3,4,P.ink);pixelRect(2,-13,3,4,P.ink);pixelRect(-10,12,7,5,'#8f8c7f');pixelRect(3,12,7,5,'#8f8c7f');
 }
 ctx.restore();
 if(p<1){text(ent.type==='bat'?'DROP IN':ent.type==='goblin'?'MAGIC':'EARTH',x,y-28,6,ent.type==='goblin'?P.green:ent.type==='skeleton'?'#a57b4c':P.cream,'center')}
}
function drawProjectile(q){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.a);ctx.shadowBlur=8;ctx.shadowColor=q.type==='arrow'?P.gold:P.red2;pixelRect(-6,-2,12,4,q.type==='arrow'?P.cream:P.red2);if(q.type==='spiral'){pixelRect(-2,-4,4,8,P.gold2)}ctx.restore()}

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
 projectiles.forEach(drawProjectile);
 entrances.forEach(drawEntrance);
 enemies.forEach((e,i)=>drawEnemy(e,i));drawPlayer();
 slashes.forEach(drawSlash);
 particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/.45);let col=p.type==='coin'?P.gold2:(p.type==='heal'?P.teal2:(p.type==='hit'?P.cream:(p.type==='spawn'?(p.spawnType==='goblin'?P.green:p.spawnType==='skeleton'?'#a57b4c':P.cream):P.gold)));pixelRect(p.x,p.y,4,4,col);ctx.globalAlpha=1});
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
