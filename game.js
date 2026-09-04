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
function draw(){
 ctx.clearRect(0,0,W,H);
 ctx.fillStyle='#252b32';ctx.fillRect(0,0,W,H);
 // subtle floor grid
 ctx.strokeStyle='#303740';ctx.lineWidth=1;for(let x=0;x<W;x+=48){ctx.beginPath();ctx.moveTo(x,60);ctx.lineTo(x,H);ctx.stroke()}for(let y=60;y<H;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
 // exit
 if(enemies.length===0){ctx.fillStyle='#5ee6a8';ctx.strokeStyle='#baffdf';ctx.lineWidth=3;ctx.beginPath();ctx.arc(W-55,H/2,28,0,6.28);ctx.fill();ctx.stroke();ctx.fillStyle='#10251b';ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillText('EXIT',W-55,H/2+5)}
 loot.forEach(l=>{let y=l.y+Math.sin(l.bob)*3;ctx.fillStyle=l.type==='Potion'?'#ff7180':l.type==='Upgrade'?'#b58cff':'#ffd45c';ctx.beginPath();ctx.arc(l.x,y,l.r,0,6.28);ctx.fill();ctx.strokeStyle='#fff';ctx.stroke()});
 bullets.forEach(b=>{ctx.fillStyle='#fff2a6';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.28);ctx.fill()});
 enemies.forEach(e=>{ctx.fillStyle='#d95c68';ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,6.28);ctx.fill();ctx.fillStyle='#222';ctx.fillRect(e.x-e.r,e.y-e.r-7,e.r*2,3);ctx.fillStyle='#72e08a';ctx.fillRect(e.x-e.r,e.y-e.r-7,e.r*2*(e.hp/e.max),3)});
 ctx.fillStyle='#67b8ff';ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,6.28);ctx.fill();ctx.strokeStyle='#dff3ff';ctx.lineWidth=2;ctx.stroke();
 particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/.45);ctx.fillStyle='#ffd166';ctx.fillRect(p.x,p.y,4,4);ctx.globalAlpha=1});
 if(gameOver){ctx.fillStyle='#000b';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 32px system-ui';ctx.fillText('GAME OVER',W/2,H/2-20);ctx.font='16px system-ui';ctx.fillText('Tap FIRE to restart',W/2,H/2+20)}
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
