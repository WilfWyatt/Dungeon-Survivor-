const c=document.getElementById('game'),ctx=c.getContext('2d');
let W,H,dpr,scale=1,last=0,room=1,kills=0,gameOver=false,transition=0;
const player={x:0,y:0,r:15,hp:100,maxHp:100,speed:220,fire:0,damage:25};
let enemies=[],loot=[],bullets=[],particles=[],keys={},joy={x:0,y:0,active:false},fireHeld=false;

function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;c.width=W*dpr;c.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);scale=Math.min(W/900,H/600)}
addEventListener('resize',resize);resize();

function resetRoom(){player.x=W/2;player.y=H/2;enemies=[];loot=[];bullets=[];particles=[];transition=0;
  const count=Math.min(5+room*2,18);
  for(let i=0;i<count;i++){let a=Math.random()*Math.PI*2, rad=260+Math.random()*180;
    enemies.push({x:W/2+Math.cos(a)*rad,y:H/2+Math.sin(a)*rad,r:15+Math.random()*5,hp:40+room*8,max:40+room*8,speed:45+room*2});
  }
  msg('Clear the room!'); updateHud();
}
function msg(t){document.getElementById('message').textContent=t}
function updateHud(){document.getElementById('room').textContent=`Room ${room}`;document.getElementById('kills').textContent=`Kills: ${kills}`;document.getElementById('hp').style.width=Math.max(0,player.hp/player.maxHp*100)+'%'}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function spawnLoot(x,y){const types=['Potion','Coins','Ammo','Upgrade'];const type=types[Math.floor(Math.random()*types.length)];
 loot.push({x,y,r:9,type,bob:Math.random()*6.28});showPickup(`💠 ${type} dropped — walk over it to collect`)}
function showPickup(t){let n=document.getElementById('pickupNotice');n.textContent=t;n.classList.add('show');clearTimeout(showPickup.t);showPickup.t=setTimeout(()=>n.classList.remove('show'),1800)}
function shoot(){if(player.fire>0||gameOver||enemies.length===0)return;player.fire=.18;
 let target=enemies.reduce((p,e)=>!p||dist(player,e)<dist(player,p)?e:p,null);if(!target)return;
 let a=Math.atan2(target.y-player.y,target.x-player.x);bullets.push({x:player.x,y:player.y,vx:Math.cos(a)*650,vy:Math.sin(a)*650,r:4,damage:player.damage});
}
function update(dt){
 if(gameOver)return;
 player.fire-=dt;
 let mx=(keys.d?1:0)-(keys.a?1:0),my=(keys.s?1:0)-(keys.w?1:0);
 if(joy.active){mx=joy.x;my=joy.y} let l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}
 player.x=clamp(player.x+mx*player.speed*dt,28,W-28);player.y=clamp(player.y+my*player.speed*dt,70,H-28);
 if(fireHeld)shoot();
 enemies.forEach(e=>{let a=Math.atan2(player.y-e.y,player.x-e.x);e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt;
   if(dist(e,player)<e.r+player.r){player.hp-=25*dt;if(player.hp<=0){player.hp=0;gameOver=true;msg('You died — tap FIRE to restart')}}});
 bullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt});
 for(let i=bullets.length-1;i>=0;i--){let b=bullets[i],hit=false;for(let j=enemies.length-1;j>=0;j--){let e=enemies[j];
   if(Math.hypot(b.x-e.x,b.y-e.y)<b.r+e.r){e.hp-=b.damage;hit=true;if(e.hp<=0){spawnLoot(e.x,e.y);enemies.splice(j,1);kills++;burst(e.x,e.y);updateHud()}break}}if(hit||b.x<0||b.x>W||b.y<0||b.y>H)bullets.splice(i,1)}
 loot.forEach(x=>x.bob+=dt*4);
 for(let i=loot.length-1;i>=0;i--){if(dist(player,loot[i])<player.r+loot[i].r+7){let t=loot[i].type;if(t==='Potion')player.hp=clamp(player.hp+30,0,player.maxHp);if(t==='Coins'){}if(t==='Ammo'){}if(t==='Upgrade')player.damage+=5;showPickup(`Collected ${t}!`);loot.splice(i,1);updateHud()}}
 particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt});particles=particles.filter(p=>p.life>0);
 if(enemies.length===0&&!transition){transition=1.5;msg('Room cleared — exit is opening!')} 
 if(transition){transition-=dt;if(transition<=0){room++;resetRoom()}}
 updateHud();
}
function burst(x,y){for(let i=0;i<10;i++){let a=Math.random()*6.28,s=30+Math.random()*100;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.45})}}
function pixelRect(x,y,w,h,fill){ctx.fillStyle=fill;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function text(t,x,y,size,fill,align='left'){ctx.fillStyle=fill;ctx.font=`700 ${size}px ui-monospace,monospace`;ctx.textAlign=align;ctx.fillText(t,x,y)}
function drawStone(){
  ctx.fillStyle='#08181b';ctx.fillRect(0,0,W,H);
  const top=48, tile=42;
  for(let y=top;y<H;y+=tile) for(let x=0;x<W;x+=tile){
    const n=((x/tile|0)*17+(y/tile|0)*31)%5;
    ctx.fillStyle=['#182f33','#1b3538','#203a3b','#1a3135','#223d3d'][n];ctx.fillRect(x,y,tile-1,tile-1);
    ctx.fillStyle='#29484a';ctx.fillRect(x+2,y+2,tile-5,2);
    if(n===2){ctx.fillStyle='#10272a';ctx.fillRect(x+8,y+13,12,2);ctx.fillRect(x+20,y+15,7,2)}
    if(n===4){ctx.fillStyle='#33504b';ctx.fillRect(x+29,y+5,3,10)}
  }
  // mossy perimeter walls
  pixelRect(0,48,W,10,'#0a1719'); pixelRect(0,H-48,W,48,'#0a1719');
  for(let x=0;x<W;x+=55){pixelRect(x,48,48,7,'#294447');pixelRect(x,H-48,48,8,'#294447')}
  pixelRect(0,58,10,H-106,'#102527'); pixelRect(W-10,58,10,H-106,'#102527');
  // vines
  ctx.strokeStyle='#315f3d';ctx.lineWidth=5;ctx.lineCap='round';
  for(let i=0;i<9;i++){let x=20+i*(W-40)/8;ctx.beginPath();ctx.moveTo(x,55);ctx.quadraticCurveTo(x-18,95+i%3*35,x+10,135+i%4*28);ctx.quadraticCurveTo(x+30,160+i%3*45,x+5,205+i%2*50);ctx.stroke();}
  ctx.strokeStyle='#487345';ctx.lineWidth=2; for(let i=0;i<12;i++){let x=25+i*(W-50)/11;ctx.beginPath();ctx.moveTo(x,H-52);ctx.quadraticCurveTo(x+20,H-100,x-8,H-135);ctx.stroke()}
}
function drawTorch(x,y){ctx.save();ctx.shadowBlur=22;ctx.shadowColor='#38d9c0';pixelRect(x-7,y,14,25,'#53615b');pixelRect(x-5,y+4,10,19,'#314b48');ctx.fillStyle='#67e4c8';ctx.beginPath();ctx.moveTo(x,y-18);ctx.lineTo(x+8,y-5);ctx.lineTo(x,y+3);ctx.lineTo(x-8,y-5);ctx.closePath();ctx.fill();ctx.restore()}
function drawPlayer(){let x=player.x,y=player.y;ctx.save();ctx.translate(x,y);ctx.shadowBlur=12;ctx.shadowColor='#42d8c0';
 pixelRect(-10,4,20,14,'#102426');pixelRect(-13,0,26,12,'#1c4b49');pixelRect(-9,-13,18,16,'#12383a');pixelRect(-5,-9,10,8,'#b8c6aa');pixelRect(-10,16,7,5,'#0b191b');pixelRect(3,16,7,5,'#0b191b');pixelRect(8,-1,19,4,'#7b8d79');pixelRect(24,-2,5,6,'#f4d66d');ctx.restore()}
function drawEnemy(e,i){let x=e.x,y=e.y;ctx.save();ctx.translate(x,y);ctx.shadowBlur=8;ctx.shadowColor='#5de0c4';
 if(i%3===0){ // skeleton
  pixelRect(-9,-7,18,13,'#d9d2b8');pixelRect(-7,-16,14,10,'#e6dec6');pixelRect(-4,-13,3,4,'#182326');pixelRect(2,-13,3,4,'#182326');pixelRect(-13,7,8,4,'#b7b19d');pixelRect(5,7,8,4,'#b7b19d');pixelRect(-10,13,7,4,'#8f8a7b');pixelRect(3,13,7,4,'#8f8a7b');
 } else if(i%3===1){ // bat
  pixelRect(-7,-5,14,15,'#18252a');pixelRect(-20,-12,13,18,'#244b4a');pixelRect(7,-12,13,18,'#244b4a');pixelRect(-4,-2,3,3,'#e75d63');pixelRect(2,-2,3,3,'#e75d63');
 } else { // slime
  pixelRect(-13,-5,26,13,'#3c8569');pixelRect(-9,-10,18,6,'#55b78e');pixelRect(-5,-2,3,3,'#102522');pixelRect(2,-2,3,3,'#102522');
 }
 ctx.restore();
 // health bar
 pixelRect(x-e.r,y-e.r-10,e.r*2,4,'#102023');pixelRect(x-e.r,y-e.r-10,e.r*2*Math.max(0,e.hp/e.max),4,'#d85a61');
}
function drawLoot(l){let y=l.y+Math.sin(l.bob)*3,x=l.x;ctx.save();ctx.translate(x,y);ctx.shadowBlur=12;ctx.shadowColor=l.type==='Coins'?'#d9a93e':'#4ee2c5';
 if(l.type==='Coins'){pixelRect(-11,2,10,7,'#d39b35');pixelRect(2,-2,10,7,'#e7b84a');pixelRect(-3,-7,9,7,'#f0c85b')}
 else if(l.type==='Potion'){pixelRect(-5,-11,10,5,'#cbbf9b');pixelRect(-9,-5,18,16,'#329f7b');pixelRect(-5,-2,10,9,'#65d4ae')}
 else if(l.type==='Upgrade'){pixelRect(-9,-9,18,18,'#267e78');pixelRect(-5,-5,10,10,'#63e4cf');pixelRect(-2,-2,4,4,'#d9d6bd')}
 else {pixelRect(-8,-8,16,16,'#4d7f8b');pixelRect(-4,-4,8,8,'#9ad9d0')}
 ctx.restore()}
function drawExit(){let x=W-42,y=H/2;ctx.save();ctx.shadowBlur=22;ctx.shadowColor='#4ee2c5';pixelRect(x-20,y-48,40,96,'#0c2225');pixelRect(x-15,y-42,30,84,'#173d3e');ctx.strokeStyle='#67e4c8';ctx.lineWidth=3;ctx.strokeRect(x-18,y-46,36,92);text('»',x,y+10,42,'#67e4c8','center');text('EXIT',x,y+65,9,'#d9d6bd','center');ctx.restore()}
function drawHudArt(){
 pixelRect(12,12,205,78,'#071518dd');ctx.strokeStyle='#315b5b';ctx.strokeRect(12,12,205,78);text('DUNGEON',24,36,19,'#d9d6bd');text('SURVIVOR',24,58,19,'#67e4c8');text(`ROOM ${room}`,24,78,9,'#8ab8ad');
 pixelRect(230,16,120,8,'#102225');pixelRect(230,16,120*player.hp/player.maxHp,8,'#c9525b');text(`${Math.ceil(player.hp)} / ${player.maxHp}`,358,24,10,'#d9d6bd');text(`KILLS ${kills}`,W-18,25,10,'#67e4c8','right');
}
function draw(){
 ctx.clearRect(0,0,W,H);drawStone();
 drawTorch(48,88);drawTorch(W-90,88);drawTorch(48,H-88);drawTorch(W-90,H-88);
 // skull relief
 text('☠',W/2,92,38,'#365454','center');
 if(enemies.length===0) drawExit();
 loot.forEach(drawLoot);bullets.forEach(b=>{pixelRect(b.x-3,b.y-2,7,4,'#f4d66d');pixelRect(b.x-1,b.y-4,3,8,'#fff1a2')});
 enemies.forEach((e,i)=>drawEnemy(e,i));drawPlayer();
 particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/.45);pixelRect(p.x,p.y,4,4,'#e7bd52');ctx.globalAlpha=1});
 drawHudArt();
 if(gameOver){ctx.fillStyle='#02090acc';ctx.fillRect(0,0,W,H);text('GAME OVER',W/2,H/2-15,30,'#d9d6bd','center');text('TAP FIRE TO RESTART',W/2,H/2+18,11,'#67e4c8','center')}
}

function loop(t){let dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}
resetRoom();requestAnimationFrame(loop);

addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.code==='Space')fireHeld=true;if(gameOver&&e.code==='Space'){gameOver=false;room=1;kills=0;player.hp=100;player.damage=25;resetRoom()}});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(e.code==='Space')fireHeld=false});
const stick=document.getElementById('stick'),nub=document.getElementById('nub');
function joyMove(e){let r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,m=Math.min(45,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);joy.x=Math.cos(a)*m/45;joy.y=Math.sin(a)*m/45;nub.style.transform=`translate(${joy.x*45}px,${joy.y*45}px)`}
stick.addEventListener('pointerdown',e=>{joy.active=true;stick.setPointerCapture(e.pointerId);joyMove(e)});
stick.addEventListener('pointermove',e=>{if(joy.active)joyMove(e)});
stick.addEventListener('pointerup',()=>{joy.active=false;joy.x=joy.y=0;nub.style.transform='translate(0,0)'});
const f=document.getElementById('fire');f.addEventListener('pointerdown',()=>{if(gameOver){gameOver=false;room=1;kills=0;player.hp=100;player.damage=25;resetRoom()}fireHeld=true});f.addEventListener('pointerup',()=>fireHeld=false);f.addEventListener('pointercancel',()=>fireHeld=false);

if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
