const c=document.getElementById('game');
let ctx=c.getContext('2d');
const mainCtx=ctx;
const floorTiles=[];
const floorSheet=new Image();
let floorSheetReady=false;
floorSheet.decoding='async';
floorSheet.onload=()=>{floorSheetReady=true};
floorSheet.src='assets/floor/floor_tiles.png';
const FLOOR_TILE_FILES=['floor-clean-1.png','floor-clean-2.png','floor-clean-3.png','floor-clean-4.png','floor-debris-1.png','floor-debris-2.png','floor-debris-3.png','floor-debris-4.png','floor-moss-1.png','floor-moss-2.png','floor-moss-3.png','floor-moss-4.png'];
FLOOR_TILE_FILES.forEach((src,i)=>{const img=new Image();img.decoding='async';img.onload=()=>{img._ready=true};img.src=src;floorTiles[i]=img});
const PROP_FILES={
  torch1:'assets/props/torch-1.png',torch2:'assets/props/torch-2.png',torch3:'assets/props/torch-3.png',torch4:'assets/props/torch-4.png',
  chestClosed:'assets/props/chest-closed.png',chestOpen:'assets/props/chest-open.png',crate1:'assets/props/crate-1.png',crateStack:'assets/props/crate-stack.png',
  barrel:'assets/props/barrel.png',pottery:'assets/props/pottery.png',ruinedPillar:'assets/props/ruined-pillar.png',rubble:'assets/props/rubble.png',statue:'assets/props/statue.png'
};
const propImages={};
Object.entries(PROP_FILES).forEach(([key,src])=>{const img=new Image();img.decoding='async';img.onload=()=>{img._ready=true};img.src=src;propImages[key]=img});

// 0.3.1 authored gameplay assets — all source PNGs are exactly 32x32 RGBA.
const GAME_ASSET_FILES={
  gold:'assets/loot/gold.png',healthSmall:'assets/loot/health-small.png',healthFull:'assets/loot/health-full.png',weaponDrop:'assets/loot/weapon-drop.png',
  goblinArrow:'assets/projectiles/goblin-arrow.png',fireball:'assets/projectiles/fireball.png',fireblast:'assets/projectiles/fireblast.png',
  impactSpark:'assets/effects/impact-spark.png',hitSpark:'assets/effects/hit-spark.png',bloodSplat:'assets/effects/blood-splat.png',
  skeletonRemains:'assets/remains/skeleton-remains.png',goblinRemains:'assets/remains/goblin-remains.png',batRemains:'assets/remains/bat-remains.png',bossRemains:'assets/remains/boss-remains.png'
};
const gameAssetImages={};
Object.entries(GAME_ASSET_FILES).forEach(([key,src])=>{const img=new Image();img.decoding='async';img.onload=()=>{img._ready=true};img.onerror=()=>{img._ready=false};img.src=src;gameAssetImages[key]=img});
function drawGameAsset(key,x,y,size=32,alpha=1,angle=0){const img=gameAssetImages[key];if(!img||!img._ready)return false;ctx.save();ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;ctx.translate(x,y);if(angle)ctx.rotate(angle);ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();return true;}

// Architectural assets. Support the organised /walls paths, Claude's earlier assets/walls layout, and root-level uploads so repository layout cannot blank the room.
const WALL_CANDIDATES={
  top:[
    ['walls/top/top-wall-clean-1.png','assets/walls/top/top-wall-clean-1.png','top-wall-clean.png'],['walls/top/top-wall-clean-2.png','assets/walls/top/top-wall-clean-2.png','top-wall-clean.png'],['walls/top/top-wall-clean-3.png','assets/walls/top/top-wall-clean-3.png','top-wall-clean.png'],
    ['walls/top/top-wall-cracked-1.png','assets/walls/top/top-wall-cracked-1.png','top-wall-cracked.png'],['walls/top/top-wall-cracked-2.png','assets/walls/top/top-wall-cracked-2.png','top-wall-cracked.png'],['walls/top/top-wall-cracked-3.png','assets/walls/top/top-wall-cracked-3.png','top-wall-cracked.png'],
    ['walls/top/top-wall-mossy-1.png','assets/walls/top/top-wall-mossy-1.png','top-wall-mossy.png'],['walls/top/top-wall-mossy-2.png','assets/walls/top/top-wall-mossy-2.png','top-wall-mossy.png'],['walls/top/top-wall-mossy-3.png','assets/walls/top/top-wall-mossy-3.png','top-wall-mossy.png']
  ],
  left:['walls/left/left-wall-clean.png','assets/walls/left/left-wall-clean.png','left-wall-clean.png'],
  right:['walls/right/right-wall-clean.png','assets/walls/right/right-wall-clean.png','right-wall-clean.png'],
  bottom:['walls/bottom/bottom-wall-clean.png','assets/walls/bottom/bottom-wall-clean.png','bottom-wall-clean.png']
};
function loadImageWithFallback(paths,onready){
  const img=new Image();img.decoding='async';let i=0;
  const next=()=>{if(i>=paths.length)return;img._ready=false;img.src=paths[i++];};
  img.onload=()=>{img._ready=true;img._source=img.src;if(onready)onready(img)};
  img.onerror=next;next();return img;
}
const wallImages={top:[],left:null,right:null,bottom:null};
WALL_CANDIDATES.top.forEach((paths,i)=>{wallImages.top[i]=loadImageWithFallback(paths)});
wallImages.left=loadImageWithFallback(WALL_CANDIDATES.left);
wallImages.right=loadImageWithFallback(WALL_CANDIDATES.right);
wallImages.bottom=loadImageWithFallback(WALL_CANDIDATES.bottom);

const SPRITE_SHEET_FILES={player:'assets/sprites/player.png',bat:'assets/sprites/bat.png',goblin:'assets/sprites/goblin.png',skeleton:'assets/sprites/skeleton.png',boss:'assets/sprites/boss_mage.png'};
const spriteImages={};
const spriteReady={};
Object.entries(SPRITE_SHEET_FILES).forEach(([key,src])=>{const img=new Image();img.decoding='async';img.onload=()=>{spriteReady[key]=true};img.onerror=()=>{spriteReady[key]=false};img.src=src;spriteImages[key]=img;spriteReady[key]=false});
const SPRITE_FRAME=32;
const SPRITE_COLS=4;
const SPRITE_ROWS={idle:0,walk:1,attack:2,hurt:3,death:4};
// Codex sheets use the four columns differently by state: idle/walk are directional poses,
// while attack/hurt/death are four-frame animations. Bats are the exception: all states are animated.
const DIRECTIONAL_POSE_SPRITES=new Set(['player','goblin','skeleton','boss']);
const DIRECTION_FRAME={down:0,up:1,right:2,left:3};
function directionFrame(dir){return DIRECTION_FRAME[dir]??DIRECTION_FRAME.right;}
function drawCharacterSprite(kind,action,frame,x,y,size,flip=false,alpha=1,direction=null){
 const img=spriteImages[kind];
 if(!img||!spriteReady[kind])return false;
 const row=SPRITE_ROWS[action]??SPRITE_ROWS.idle;
 let f=((frame%SPRITE_COLS)+SPRITE_COLS)%SPRITE_COLS;
 let mirror=flip;
 if(DIRECTIONAL_POSE_SPRITES.has(kind)&&(action==='idle'||action==='walk')){
   const dir=direction||'right';
   // Use the clean right-facing pose as the canonical side view and mirror it for left.
   // This keeps side-facing characters consistent instead of relying on two subtly
   // different side cells in the authored sheets.
   if(dir==='left'){f=DIRECTION_FRAME.right;mirror=true;}
   else {f=directionFrame(dir);mirror=false;}
 }
 return drawSpriteFrame(img,f*SPRITE_FRAME,row*SPRITE_FRAME,SPRITE_FRAME,SPRITE_FRAME,x,y,size,size,mirror,alpha);
}
function animFrame(time,rate=8){return Math.floor(time*rate)%SPRITE_COLS;}
function timedAnimFrame(age,duration,rate=12){return Math.min(SPRITE_COLS-1,Math.floor(Math.max(0,Math.min(1,age/Math.max(.001,duration)))*SPRITE_COLS));}

let roomTiles=[],roomDecor=[];
const TILE=32, COLS=8, ROWS=12;
function makeRoomLayout(){
  const rand=()=>{const n=Math.sin((roomVariation+1)*12.9898 + room*78.233 + area*37.719)*43758.5453;return n-Math.floor(n);};
  roomTiles=Array.from({length:ROWS},()=>Array(COLS).fill(0));
  // 0.2.5b: the floor is now built from the approved 12-tile authored set.
  // Clean stone dominates; debris and moss appear as controlled, clustered dressing.
  const arch=roomArchetype();
  for(let gy=0;gy<ROWS;gy++) for(let gx=0;gx<COLS;gx++){
    const edge=gx===0||gx===COLS-1||gy===0||gy===ROWS-1;
    let roll=rand();
    let family=0;
    if(arch==='RUINED CHAMBER'){
      family=roll<.24?2:roll<.52?1:0;
    }else if(arch==='CHAPEL'){
      family=roll<.12?2:roll<.28?1:0;
    }else if(arch==='PILLARED HALL'){
      family=roll<.09?2:roll<.22?1:0;
    }else{
      family=roll<.10?2:roll<.25?1:0;
    }
    // Moss hugs the outer stonework more often; debris favours corners and lower traffic.
    const wallBias=Math.min(gx,COLS-1-gx,gy,ROWS-1-gy);
    if(family===2 && wallBias>2 && roll>.55) family=0;
    if(family===1 && wallBias===0 && roll<.35) family=2;
    const variant=Math.floor(rand()*4);
    roomTiles[gy][gx]=family*4+variant;
  }
  // Clear a readable central combat lane without reverting to a repeating checkerboard.
  for(let gy=2;gy<ROWS-2;gy++){
    const gx=Math.floor(COLS/2);
    if(roomTiles[gy][gx]>=4 && roomTiles[gy][gx]<8) roomTiles[gy][gx]=Math.floor(rand()*4);
  }
  // 0.2.5e: clear, deterministic edge decoration. The arena centre and bottom edge stay open.
  roomDecor=[];
  const candidates=[];
  const addCandidate=(kind,x,y)=>{
    if(x<58||x>302||y<72||y>392)return;
    if(Math.abs(x-W/2)<52 && y>118)return; // protect the main combat lane
    candidates.push({kind,x,y});
  };
  // Upper and side-edge slots only; nothing is ever placed along the bottom edge.
  [108,180,252].forEach(x=>addCandidate('top',x,102));
  [190,282,374].forEach(y=>{addCandidate('left',72,y);addCandidate('right',288,y)});

  const seeded=(n)=>{const v=Math.sin((room+1)*127.1+(area+1)*311.7+(roomVariation+1)*71.9+n*19.37)*43758.5453;return v-Math.floor(v)};
  const shuffle=(arr)=>{for(let i=arr.length-1;i>0;i--){const j=Math.floor(seeded(i*7.1)* (i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr};
  const distanceOk=(x,y,placed,min=34)=>placed.every(p=>Math.hypot(p.x-x,p.y-y)>=min);
  const torchCount=2+Math.floor(seeded(41)*3); // 2–4, mandatory in every room.
  const torchKinds=['torch1','torch2','torch3','torch4'];
  // Put mandatory torches in distinct corner zones. With 2, use opposite corners;
  // with 3–4, fill additional corners. This prevents the old top-left clustering.
  const cornerSlots=[
    {x:72,y:88,corner:'TL'},{x:288,y:88,corner:'TR'},
    {x:72,y:374,corner:'BL'},{x:288,y:374,corner:'BR'}
  ];
  let torchSlots;
  if(torchCount===2){
    torchSlots=seeded(42)<.5?[cornerSlots[0],cornerSlots[3]]:[cornerSlots[1],cornerSlots[2]];
  }else{
    torchSlots=shuffle(cornerSlots.slice()).slice(0,torchCount);
  }
  const placed=[];
  torchSlots.forEach((slot,i)=>{
    const kind=torchKinds[Math.floor(seeded(70+i)*torchKinds.length)];
    placed.push({kind,x:slot.x,y:slot.y,torch:true});
  });

  // 2–5 additional decorations, chosen from the new prop pool.
  const decorationPool=['chestClosed','chestOpen','crate1','crateStack','barrel','pottery','ruinedPillar','rubble','statue'];
  const decorCount=2+Math.floor(seeded(93)*4);
  const available=shuffle(candidates.filter(c=>distanceOk(c.x,c.y,placed,38)));
  const selected=available.slice(0,decorCount);
  selected.forEach((slot,i)=>{
    const kind=decorationPool[Math.floor(seeded(120+i)*decorationPool.length)];
    if(distanceOk(slot.x,slot.y,placed,38)) placed.push({kind,x:slot.x,y:slot.y,torch:false});
  });
  roomDecor=placed;
}

function drawProp(kind,x,y){
  const img=propImages[kind];
  if(!img||!img._ready)return;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(img,Math.round(x-16),Math.round(y-16),32,32);ctx.restore();
}
function topWallIndex(){
  // Room archetype biases: ruined rooms favour cracked/mossy; cleaner rooms favour clean.
  const arch=roomArchetype();
  const r=((room*53+area*17+roomVariation*7)%100)/100;
  let family=0;
  if(arch==='RUINED CHAMBER') family=r<.42?1:r<.72?2:0;
  else if(arch==='CHAPEL') family=r<.10?2:r<.26?1:0;
  else family=r<.10?2:r<.30?1:0;
  const variant=(roomVariation+room*3+area)%3;
  return family*3+variant;
}
function drawWallImage(img,x,y,w,h,sourceY=0,sourceH=null){
  if(!img||!img._ready)return false;
  const sh=sourceH??img.naturalHeight??img.height;
  ctx.drawImage(img,0,sourceY,img.naturalWidth||img.width,sh,x,y,w,h);return true;
}
function drawWalls(){
  const top=wallImages.top[topWallIndex()];
  if(top&&top._ready){
    const sourceH=(top.naturalHeight||top.height);
    // Root fallback cracked/mossy files are three 50px variants stacked vertically.
    let sy=0,sh=sourceH;
    if((top._source||'').endsWith('top-wall-cracked.png') || (top._source||'').endsWith('top-wall-mossy.png')){
      sy=(topWallIndex()%3)*50;sh=50;
    }
    drawWallImage(top,0,16,W,50,sy,sh);
  }
  drawWallImage(wallImages.left,0,16,52,H-66);
  drawWallImage(wallImages.right,W-50,16,50,H-66);
  drawWallImage(wallImages.bottom,0,H-50,W,50);
}

function floorTileReady(index){return !!(floorTiles[index]&&floorTiles[index]._ready)}
function drawFloorTile(index,x,y,size=TILE){
  if(floorSheetReady){
    const sx=(index%4)*32,sy=Math.floor(index/4)*32;
    ctx.drawImage(floorSheet,sx,sy,32,32,x,y,size,size);return true;
  }
  const img=floorTiles[index];
  if(floorTileReady(index)){ctx.drawImage(img,0,0,32,32,x,y,size,size);return true;}
  return false;
}
function floorIndexForCell(gx,gy){
  let idx=roomTiles[gy]?.[gx]??0;
  const arch=roomArchetype();
  if((arch==='GUARD ROOM'||arch==='PILLARED HALL') && gx>=3 && gx<=7 && gy>=3 && gy<=10 && idx>=4 && idx<8) idx-=4;
  return idx;
}
function drawBrokenMasonry(seedBase,arch){
  const left=52,top=66,roomW=COLS*TILE,roomH=ROWS*TILE;
  ctx.fillStyle='#071316';ctx.fillRect(0,0,W,H);
  ctx.imageSmoothingEnabled=false;
  ctx.save();ctx.beginPath();ctx.rect(left,top,roomW,roomH);ctx.clip();
  for(let gy=0;gy<ROWS;gy++) for(let gx=0;gx<COLS;gx++){
    drawFloorTile(floorIndexForCell(gx,gy),left+gx*TILE,top+gy*TILE,TILE);
  }
  ctx.restore();
  // Fill the non-room area, leaving the architectural wall pieces to define the border.
  ctx.fillStyle='#071316';
  ctx.fillRect(0,0,left, H);
  ctx.fillRect(left+roomW,0,W-(left+roomW),H);
  ctx.fillRect(left,0,roomW,top);
  ctx.fillRect(left,top+roomH,roomW,H-(top+roomH));
  const vg=ctx.createLinearGradient(0,top,0,top+roomH);
  vg.addColorStop(0,'rgba(0,0,0,.16)');vg.addColorStop(.15,'rgba(0,0,0,0)');vg.addColorStop(.82,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.24)');
  ctx.fillStyle=vg;ctx.fillRect(left,top,roomW,roomH);
}

function drawModularDungeonStatic(){
  ctx.fillStyle=P.ink;ctx.fillRect(0,0,W,H);
  const arch=roomArchetype();
  const seedBase=roomVariation*997+room*131+area*17;
  ctx.save();ctx.imageSmoothingEnabled=false;
  drawBrokenMasonry(seedBase,arch);
  ctx.restore();
  drawWalls();
  for(const d of roomDecor) drawProp(d.kind,d.x,d.y);
}
function rebuildRoomCache(){
  roomCacheCtx.setTransform(1,0,0,1,0,0);roomCacheCtx.clearRect(0,0,360,480);
  const prev=ctx;ctx=roomCacheCtx;drawModularDungeonStatic();ctx=prev;
  roomCacheDirty=false;roomCacheBuilt=true;
}
function drawModularDungeon(){
  if(roomCacheDirty){
    // Keep the first frame correct while images are still loading; once the assets are ready,
    // freeze the static room into an off-screen canvas so mobile devices do not redraw it every frame.
    const topWall=wallImages.top[topWallIndex()];
    const assetsReady=floorSheetReady && !!topWall?._ready && wallImages.left?._ready && wallImages.right?._ready && wallImages.bottom?._ready && roomDecor.every(d=>propImages[d.kind]?._ready);
    if(assetsReady)rebuildRoomCache();
  }
  if(roomCacheBuilt){ctx.drawImage(roomCache,0,0);}
  else drawModularDungeonStatic();
  drawTorchLightOptimized();
}
function drawTorchLightOptimized(){
  const now=performance.now()/1000;
  ctx.save();
  ctx.imageSmoothingEnabled=true;
  for(const d of roomDecor) if(d.torch){
    const flicker=.82+.10*Math.sin(now*4+d.x)+.05*Math.sin(now*9+d.y);
    ctx.globalAlpha=flicker;
    ctx.drawImage(torchGlowCache,d.x-56,d.y-56);
  }
  ctx.restore();
}
let W=360,H=480,dpr=1,last=0,room=1,kills=0,gold=0,score=0,gameOver=false,roomCleared=false,xp=0,level=1,xpNeed=12,started=false,roomsCleared=0,totalGoldCollected=0,walkTime=0,scoreSaved=false,areaClearTimer=0,areaClearShown=false,roomVariation=0;
const roomCache=document.createElement('canvas');roomCache.width=360;roomCache.height=480;const roomCacheCtx=roomCache.getContext('2d');
let roomCacheDirty=true,roomCacheBuilt=false;
const torchGlowCache=document.createElement('canvas');torchGlowCache.width=112;torchGlowCache.height=112;const torchGlowCtx=torchGlowCache.getContext('2d');
(function buildTorchGlow(){const g=torchGlowCtx.createRadialGradient(56,46,2,56,46,50);g.addColorStop(0,'rgba(255,178,78,.22)');g.addColorStop(.28,'rgba(255,140,48,.10)');g.addColorStop(1,'rgba(255,110,30,0)');torchGlowCtx.fillStyle=g;torchGlowCtx.fillRect(0,0,112,112)})();
const VERSION='0.3.1';

// 0.3.1 — authored 32x32 gameplay assets layered over the 0.3.0 soundscape.
// It is deliberately lightweight: a few long-lived ambience nodes plus short one-shot SFX.
let audioCtx=null,audioMaster=null,audioSfx=null,audioAmbience=null,audioStarted=false,audioMuted=false;
let audioDrone=[],audioNoise=null,audioDripTimer=null,audioStepTimer=0;
const AUDIO={
  ensure(){
    if(audioCtx){if(audioCtx.state==='suspended')audioCtx.resume();return true;}
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
      audioCtx=new AC();
      audioMaster=audioCtx.createGain();audioMaster.gain.value=.72;audioMaster.connect(audioCtx.destination);
      audioSfx=audioCtx.createGain();audioSfx.gain.value=.82;audioSfx.connect(audioMaster);
      audioAmbience=audioCtx.createGain();audioAmbience.gain.value=.34;audioAmbience.connect(audioMaster);
      audioStarted=true; return true;
    }catch(e){return false}
  },
  start(){
    if(!this.ensure())return;
    if(audioCtx.state==='suspended')audioCtx.resume();
    if(audioDrone.length)return;
    const now=audioCtx.currentTime;
    const droneGain=audioCtx.createGain();droneGain.gain.value=.055;droneGain.connect(audioAmbience);
    [55,82.5].forEach((f,i)=>{const o=audioCtx.createOscillator();o.type=i?'triangle':'sine';o.frequency.value=f;o.detune.value=i?3:-4;o.connect(droneGain);o.start();audioDrone.push(o)});
    const lfo=audioCtx.createOscillator(),lg=audioCtx.createGain();lfo.frequency.value=.075;lg.gain.value=.018;lfo.connect(lg);lg.connect(droneGain.gain);lfo.start();audioDrone.push(lfo,lg,droneGain);
    const len=audioCtx.sampleRate*2,buf=audioCtx.createBuffer(1,len,audioCtx.sampleRate),data=buf.getChannelData(0);
    for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*.55;
    const n=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),ng=audioCtx.createGain();n.buffer=buf;n.loop=true;f.type='lowpass';f.frequency.value=520;f.Q.value=.35;ng.gain.value=.035;n.connect(f);f.connect(ng);ng.connect(audioAmbience);n.start(now);audioNoise=n;audioDrone.push(f,ng);
    this.scheduleDrip();
  },
  stop(){
    clearTimeout(audioDripTimer);audioDripTimer=null;
    if(!audioCtx||!audioDrone.length)return;
    const nodes=audioDrone.slice();audioDrone=[];audioNoise=null;
    const now=audioCtx.currentTime;
    nodes.forEach(n=>{try{if(n.gain){n.gain.cancelScheduledValues(now);n.gain.setTargetAtTime(0,now,.08)}else if(n.stop)n.stop(now+.2)}catch(e){}});
  },
  setMuted(m){audioMuted=!!m;if(audioMaster)audioMaster.gain.setTargetAtTime(audioMuted?0:.72,audioCtx.currentTime,.04)},
  scheduleDrip(){
    clearTimeout(audioDripTimer);
    if(!audioStarted)return;
    const delay=4200+Math.random()*5600;
    audioDripTimer=setTimeout(()=>{if(audioStarted&&!audioMuted&&!gameOver&&started&&!atShop&&!roomTransition)this.drip();this.scheduleDrip()},delay);
  },
  tone(freq,dur,vol,type='sine',endFreq=freq,delay=0){
    if(!audioCtx||audioMuted)return;
    const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(20,freq),t);o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0001,vol),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(audioSfx);o.start(t);o.stop(t+dur+.02);
  },
  noise(dur,vol,filterFreq=1200,delay=0){
    if(!audioCtx||audioMuted)return;
    const t=audioCtx.currentTime+delay,len=Math.max(1,Math.floor(audioCtx.sampleRate*dur)),b=audioCtx.createBuffer(1,len,audioCtx.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len*.35);
    const s=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),g=audioCtx.createGain();s.buffer=b;f.type='bandpass';f.frequency.value=filterFreq;f.Q.value=.65;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(audioSfx);s.start(t);s.stop(t+dur+.02);
  },
  swing(w){const base=w.id==='claymore'?150:w.id==='longSword'?220:300;this.noise(.12,.10,base);this.tone(base*.55,.10,.045,'triangle',base*.95,.015)},
  hit(){this.noise(.055,.13,520);this.tone(95,.08,.05,'square',55)},
  death(type='normal'){const f=type==='boss'?75:type==='skeleton'?125:type==='goblin'?180:260;this.tone(f,.22,.075,'sawtooth',42);this.noise(type==='boss'?.28:.09,type==='boss'?.12:.06,180)},
  hurt(fire=false){this.tone(fire?125:190,.18,.09,'sawtooth',55);this.noise(.08,.08,400)},
  spawn(type){const f=type==='bat'?520:type==='goblin'?260:150;this.tone(f,.16,.055,'triangle',f*.55);this.noise(.08,.045,800)},
  projectile(type){const f=type==='fireball'?260:type==='fireblast'?110:480;this.tone(f,.10,.035,'triangle',f*1.8);if(type!=='arrow')this.noise(.11,.035,300)},
  pickup(type){if(type==='Gold'){this.tone(880,.08,.065,'sine',1320);this.tone(1320,.12,.045,'sine',1760,.07)}else if(type==='Weapon'){this.tone(330,.16,.06,'triangle',660);this.tone(660,.22,.05,'triangle',990,.12)}else{this.tone(440,.12,.05,'sine',660);this.tone(660,.18,.04,'sine',880,.08)}},
  level(){this.tone(392,.16,.06,'sine',523);this.tone(523,.18,.06,'sine',784,.12);this.tone(784,.28,.055,'sine',1046,.24)},
  wave(){this.tone(180,.20,.055,'triangle',260);this.tone(260,.20,.05,'triangle',180,.18)},
  clear(){this.tone(392,.18,.06,'sine',523);this.tone(523,.18,.06,'sine',659,.16);this.tone(659,.32,.06,'sine',988,.32)},
  exit(){this.tone(196,.28,.05,'sine',294);this.tone(294,.35,.05,'sine',588,.20);this.tone(588,.45,.035,'sine',784,.35)},
  transition(){this.noise(.30,.045,180);this.tone(110,.55,.045,'sine',48);this.tone(392,.20,.03,'triangle',196,.42)},
  shop(){this.tone(261,.15,.05,'sine',392);this.tone(392,.22,.045,'sine',523,.12)},
  buy(){this.tone(523,.10,.045,'sine',659);this.tone(659,.16,.045,'sine',784,.08)},
  denied(){this.tone(100,.16,.06,'square',70)},
  bossWarning(){this.tone(120,.28,.08,'sawtooth',70);this.tone(90,.38,.06,'sawtooth',55,.22)},
  drip(){if(!audioCtx||audioMuted)return;const f=520+Math.random()*180;this.tone(f,.12,.025,'sine',f*.72);this.tone(f*.72,.34,.022,'sine',f*.42,.10)},
  step(){const f=85+Math.random()*25;this.tone(f,.045,.018,'triangle',55);this.noise(.028,.012,650)},
  gameOver(){this.tone(180,.28,.07,'sawtooth',95);this.tone(120,.50,.06,'sine',48,.25)},
  menu(){this.tone(420,.08,.035,'triangle',560)}
};
let area=1,areaName='CASTLE',areaRooms=6,bossRoom=7,atShop=false,areaComplete=false;
const SPRITE_SCALE=0.82;
const WEAPONS={
 shortSword:{id:'shortSword',name:'Short Sword',baseDamage:25,cooldown:.30,reach:58,swingDuration:.18,knockback:1.00,icon:'🗡'},
 longSword:{id:'longSword',name:'Long Sword',baseDamage:32,cooldown:.40,reach:66,swingDuration:.22,knockback:1.08,icon:'⚔'},
 claymore:{id:'claymore',name:'Claymore',baseDamage:45,cooldown:.56,reach:76,swingDuration:.28,knockback:1.20,icon:'🔨'}
};
const RARITIES=[
 {name:'Common',weight:58,mult:1.00,cooldown:1.00,reach:1.00,knockback:1.00,label:'COMMON'},
 {name:'Uncommon',weight:25,mult:1.08,cooldown:.96,reach:1.04,knockback:1.08,label:'UNCOMMON'},
 {name:'Rare',weight:11,mult:1.18,cooldown:.92,reach:1.08,knockback:1.16,label:'RARE'},
 {name:'Epic',weight:5,mult:1.30,cooldown:.88,reach:1.12,knockback:1.25,label:'EPIC'},
 {name:'Legendary',weight:1,mult:1.45,cooldown:.84,reach:1.16,knockback:1.35,label:'LEGENDARY'}
];
const player={x:0,y:0,r:14*SPRITE_SCALE,hp:100,maxHp:100,speed:185,fire:0,damage:25,damageBonus:0,flash:0,hitTimer:0,hitCooldown:0,knockX:0,knockY:0,weapon:null};
let weaponFinds=[],pendingWeaponIndex=0,weaponPromptOpen=false,weaponBurning=false;
function rarityData(name){return RARITIES.find(r=>r.name===name)||RARITIES[0]}
function weaponInstance(id,rarityName='Common'){const base=WEAPONS[id]||WEAPONS.shortSword,r=rarityData(rarityName);return {id:base.id,name:base.name,rarity:r.name,baseDamage:base.baseDamage,damage:Math.round(base.baseDamage*r.mult),cooldown:base.cooldown*r.cooldown,reach:Math.round(base.reach*r.reach),swingDuration:base.swingDuration,knockback:base.knockback*r.knockback,icon:base.icon}}
function playerWeapon(){return player.weapon||weaponInstance('shortSword','Common')}
function currentWeaponStats(){const w=playerWeapon();return {damage:w.damage+(player.damageBonus||0),cooldown:w.cooldown,reach:w.reach,knockback:w.knockback}}
function weightedRarity(){
 const luck=fortuneLevel||0;
 const bonuses=[-8,3,3,1.5,.5];
 const weights=RARITIES.map((r,i)=>luck?Math.max(i===0?10:0,r.weight+bonuses[i]*luck):r.weight);
 const total=weights.reduce((a,w)=>a+w,0);let roll=Math.random()*total;
 for(let i=0;i<RARITIES.length;i++){roll-=weights[i];if(roll<0)return RARITIES[i].name}
 return 'Common';
}
function randomWeaponDrop(){const ids=['shortSword','longSword','claymore'];return weaponInstance(ids[Math.floor(Math.random()*ids.length)],weightedRarity())}
function rarityClass(r){return String(r||'Common').toLowerCase()}
function weaponStatLines(w){return {damage:w.damage,reach:w.reach,cooldown:w.cooldown,knockback:w.knockback}}
let enemies=[],loot=[],slashes=[],deathMarks=[],impactMarks=[],particles=[],projectiles=[],entrances=[],keys={},joy={x:0,y:0,active:false},fireHeld=false;
let spawnQueue=[],spawnTimer=0,totalSpawned=0,totalQuota=0,activeCap=0,activeGoblinCap=0,bossPatternTimer=0,bossPatternStep=0,bossPatternMode='burst';
let spawnWaves=[],spawnWaveIndex=0,waveTransitionTimer=0;
const ROOM_PLAN={1:{cap:5,total:10,weights:[['bat',.80],['goblin',.10],['skeleton',.10]]},2:{cap:6,total:12,weights:[['bat',.70],['goblin',.15],['skeleton',.15]]},3:{cap:7,total:14,weights:[['bat',.60],['goblin',.20],['skeleton',.20]]},4:{cap:8,total:17,weights:[['bat',.50],['goblin',.25],['skeleton',.25]]},5:{cap:10,total:20,weights:[['bat',.40],['goblin',.30],['skeleton',.30]]},6:{cap:12,total:22,weights:[['bat',1/3],['goblin',1/3],['skeleton',1/3]]}};
let shopMessage='',bossWarningType='',bossWarningTimer=0,paused=false;
let fortuneLevel=0;
let roomTransition=null;
const ROOM_ARCHETYPES=['GREAT HALL','PILLARED HALL','RUINED CHAMBER','CHAPEL','GUARD ROOM','CROSS HALL'];
function roomArchetype(){return ROOM_ARCHETYPES[(roomVariation+room*3+area)%ROOM_ARCHETYPES.length]}
function clampEnemySeparation(){
 const normal=enemies.filter(e=>e.type!=='boss');
 for(let i=0;i<normal.length;i++)for(let j=i+1;j<normal.length;j++){
  const a=normal[i],b=normal[j];
  if(a.type!=='goblin'&&b.type!=='goblin')continue;
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,min=34;
  if(d<min){const push=(min-d)/2,ux=dx/d,uy=dy/d;a.x-=ux*push;a.y-=uy*push;b.x+=ux*push;b.y+=uy*push;}
 }
}
function nearestGoblins(){return enemies.filter(e=>e.type==='goblin').sort((a,b)=>dist(a,player)-dist(b,player))}
const SCORE_VALUES={bat:50,goblin:75,skeleton:100,boss:1000};
let highScores=[];
try{highScores=JSON.parse(localStorage.getItem('dungeonSurvivorHighScores')||'[]');if(!Array.isArray(highScores))highScores=[]}catch(e){highScores=[]}
function addScore(amount){score=Math.max(0,score+amount)}
function saveHighScore(){if(scoreSaved)return;scoreSaved=true;highScores.push({score,room,level,gold:totalGoldCollected,kills,area});highScores.sort((a,b)=>b.score-a.score);highScores=highScores.slice(0,5);try{localStorage.setItem('dungeonSurvivorHighScores',JSON.stringify(highScores))}catch(e){}}
function scoreRank(){const i=highScores.findIndex(r=>r.score===score&&r.level===level&&r.kills===kills&&r.gold===totalGoldCollected);return i>=0?i+1:0}
function finishGameOver(){if(gameOver)return;gameOver=true;AUDIO.gameOver();AUDIO.stop();player.hitTimer=0;player.hitCooldown=0;player.knockX=0;player.knockY=0;saveHighScore();msg('RUN ENDED — choose an option')}
function enemyScale(){return (1+(area-1)*.18)*(1+(level-1)*.075)}
function enemyDamageScale(){return 1+(area-1)*.12+(level-1)*.045}
function scaledPotionHeal(){return Math.min(player.maxHp,18+(area-1)*3+Math.floor((level-1)*1.5))}
function scaledGoldAmount(enemyType){const typeBonus=enemyType==='skeleton'?2:enemyType==='goblin'?1:0;const base=1+Math.floor(Math.random()*5);return Math.min(14,base+Math.max(0,area-1)+Math.floor((level-1)/3)+typeBonus)}
function bossGoldReward(){return 30+area*12+level*3}
let nextSwingSide=1, swingCooldown=0, facing=0, facingDir='right';
const GOBLIN_CAPS={1:2,2:3,3:4,4:5,5:6,6:6};
const P={ink:'#061316',deep:'#0a1c20',wall:'#172d31',wall2:'#234247',stone:'#29494a',moss:'#3f6d43',vine:'#2f603c',teal:'#52d8c0',teal2:'#83f0d7',cream:'#d8d4bd',gold:'#e5b94d',gold2:'#ffd86a',red:'#c95159',red2:'#ed6a70',blue:'#5fa9c7',green:'#4dbb88'};

function fitGameFrame(){const frame=document.getElementById('gameFrame'),top=document.getElementById('topUI'),controls=document.getElementById('controls');if(!frame||!top||!controls)return;const gaps=8;const safe=12;const maxH=Math.max(300,Math.min(480,innerHeight-top.offsetHeight-controls.offsetHeight-gaps-safe));const maxW=Math.max(240,Math.min(360,innerWidth-24));const h=Math.min(maxH,maxW/.75);frame.style.width=Math.round(h*.75)+'px';frame.style.height=Math.round(h)+'px';c.style.width=frame.clientWidth+'px';c.style.height=frame.clientHeight+'px'}
function resize(){dpr=Math.min(devicePixelRatio||1,1.5);c.width=360*dpr;c.height=480*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);W=360;H=480;fitGameFrame()}
addEventListener('resize',resize);resize();
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function dirFromAngle(a){const x=Math.cos(a),y=Math.sin(a);if(Math.abs(x)>Math.abs(y))return x<0?'left':'right';return y<0?'up':'down'}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function msg(t){document.getElementById('message').textContent=t}
function showPickup(t){const n=document.getElementById('pickupNotice');n.textContent=t;n.classList.add('show');clearTimeout(showPickup.t);showPickup.t=setTimeout(()=>n.classList.remove('show'),1800)}
function setBossWarning(type=''){
 bossWarningType=type;
 const el=document.getElementById('bossWarning');
 if(!el)return;
 el.textContent=type==='blast'?'FIRE BLAST ATTACK':type==='fireball'?'FIREBALL ATTACK':'';
 el.classList.toggle('show',!!type);
 el.classList.toggle('fireblast',type==='blast');
}
function updateHud(){
 const roomEl=document.getElementById('room');
 if(roomEl)roomEl.textContent=isBossRoom()?'BOSS':`${room}`;
 const areaEl=document.getElementById('areaText');
 if(areaEl)areaEl.textContent=`${areaName} • R${room}`;
 const hpEl=document.getElementById('hp');
 if(hpEl)hpEl.style.width=Math.max(0,player.hp/player.maxHp*100)+'%';
 const hpText=document.getElementById('hpText');
 if(hpText)hpText.textContent=`${Math.ceil(player.hp)} / ${player.maxHp}`;
 const goldEl=document.getElementById('gold');
 if(goldEl)goldEl.textContent=gold;
 const xpEl=document.getElementById('xp');
 if(xpEl)xpEl.style.width=Math.max(0,Math.min(100,xp/xpNeed*100))+'%';
 const levelEl=document.getElementById('levelText');
 if(levelEl)levelEl.textContent=`LV ${level}`;
 const xpTop=document.getElementById('xpTextTop');
 if(xpTop)xpTop.textContent=`${xp} XP`;
 updateInventoryPanel();
}

function chooseEnemyType(weights){
 const r=Math.random();let acc=0;for(const [type,w] of weights){acc+=w;if(r<=acc)return type}return weights[weights.length-1][0];
}
function resetRoom(){
 roomCacheDirty=true;
 player.x=58;player.y=H/2;player.hp=clamp(player.hp,0,player.maxHp);roomVariation=(room*37+area*101)%997;makeRoomLayout();player.flash=0;player.hitTimer=0;player.hitCooldown=0;player.knockX=0;player.knockY=0;
 enemies=[];loot=[];slashes=[];deathMarks=[];impactMarks=[];particles=[];projectiles=[];entrances=[];roomCleared=false;atShop=false;areaComplete=false;areaClearTimer=0;areaClearShown=false;bossWarningTimer=0;setBossWarning('');
 spawnQueue=[];spawnTimer=.35;totalSpawned=0;bossPatternTimer=1.1;bossPatternStep=0;bossPatternMode='burst';spawnWaveIndex=0;spawnWaves=[];waveTransitionTimer=0;
 const isBoss=room===bossRoom;
 if(isBoss){
  totalQuota=1;activeCap=1;
  const hp=Math.round((650+area*100)*enemyScale());
  enemies.push({x:W-105,y:H/2,r:34*SPRITE_SCALE,type:'boss',hp,max:hp,active:true,speed:48+area*2,hit:0,boss:true,attackTimer:1.1,attackAge:0,swingHit:false,weapon:'shortSword',warning:'',warningTimer:0,patternActive:false});
  msg('BOSS ROOM — DEFEAT THE GUARDIAN');
 }else{
  const plan=ROOM_PLAN[room]||ROOM_PLAN[6];activeCap=plan.cap;activeGoblinCap=GOBLIN_CAPS[room]||6;totalQuota=plan.total;
  const waveCount=room<=2?2:3;
  const allSpawns=Array.from({length:totalQuota},()=>chooseEnemyType(plan.weights));
  const baseWave=Math.floor(totalQuota/waveCount),remainder=totalQuota%waveCount;
  let offset=0;spawnWaves=[];
  for(let w=0;w<waveCount;w++){const size=baseWave+(w<remainder?1:0);spawnWaves.push(allSpawns.slice(offset,offset+size));offset+=size;}
  spawnQueue=spawnWaves[0].slice();
  msg(`AREA ${area} • ${areaName} — ROOM ${room} • WAVE 1/${waveCount}`);
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
function countActiveType(type){return enemies.filter(e=>e.type===type).length+entrances.filter(e=>e.type===type).length}
function trySpawnEnemy(delay=0){
 if(isBossRoom()||roomCleared||spawnQueue.length===0)return;
 if(enemies.length+entrances.length>=activeCap)return;
 if(spawnTimer>0){spawnTimer=Math.max(spawnTimer,delay);return}
 let pick=-1;
 for(let i=0;i<spawnQueue.length;i++){
  const type=spawnQueue[i];
  if(type==='goblin'&&countActiveType('goblin')>=activeGoblinCap)continue;
  pick=i;break;
 }
 if(pick<0)return;
 const type=spawnQueue.splice(pick,1)[0];totalSpawned++;AUDIO.spawn(type);
 startEntrance(type);spawnTimer=.65;
}
function activateEntrance(ent){
 const base=ent.type==='bat'?34:ent.type==='goblin'?48:58;
 const speed=ent.type==='bat'?205:ent.type==='goblin'?135:105;
 const r=ent.type==='bat'?11:15;
 const hp=Math.round((base+room*7)*enemyScale());
 enemies.push({x:ent.x,y:ent.y,r:r*SPRITE_SCALE,type:ent.type,hp,max:hp,speed:speed+(ent.type==='bat'?2:ent.type==='goblin'?1:1),hit:0,attackCooldown:.8+Math.random()*.5,windup:0,attackAge:0,swingHit:false,swingAngle:0,swingSide:1,reposition:0,vulnerable:0,active:true,facingDir:'left',orbitAngle:Math.random()*Math.PI*2,orbitRadius:55+Math.random()*28,batAttackCooldown:1.0+Math.random()*.8,batAttackAge:0,batAttackHit:false,edgeTarget:null});
}

function isBossRoom(){return room===bossRoom}
function bossDefeated(){return room===bossRoom && roomCleared}
function beginAreaShop(){
 AUDIO.shop(); atShop=true;areaComplete=true;shopMessage=`${areaName} COMPLETE — spend your gold before the next area.`;
 msg('AREA COMPLETE — CHOOSE YOUR UPGRADES');
}
function buyUpgrade(type){
 if(!atShop)return;
 if(type==='damage'){
  const cost=100;
  if(gold<cost){AUDIO.denied();showPickup('Not enough gold for +5 DAMAGE');return}
  gold-=cost;player.damageBonus+=5;player.damage=currentWeaponStats().damage;AUDIO.buy();showPickup('+5 DAMAGE purchased');
 }else if(type==='health'){
  const cost=75;
  if(gold<cost){AUDIO.denied();showPickup('Not enough gold for +10 MAX HP');return}
  gold-=cost;player.maxHp+=10;player.hp=player.maxHp;AUDIO.buy();showPickup('+10 MAX HP — fully healed');
 }else if(type==='fortune'){
  const cost=125;
  if(gold<cost){AUDIO.denied();showPickup('Not enough gold for FORTUNE');return}
  gold-=cost;fortuneLevel++;AUDIO.buy();showPickup('FORTUNE +1 — BETTER WEAPON RARITIES');
 }
 updateHud();
}
function continueFromShop(){
 if(!atShop)return; AUDIO.transition();
 atShop=false;areaComplete=false;area++;areaName={2:'LOWER CASTLE',3:'CRYPT',4:'CATACOMBS',5:'ABYSS'}[area]||`AREA ${area}`;room=1;
 showPickup(`Entering Area ${area}`);
 msg(`AREA ${area} — ${areaName}`);
 resetRoom();
}

function spawnLoot(x,y,enemyType){
 // Gold remains common, healing is rare, and weapons are occasional physical finds.
 const roll=Math.random();
 let type='Gold',amount=scaledGoldAmount(enemyType),weapon=null;
 if(roll<0.075){type='Weapon';weapon=randomWeaponDrop()}
 else if(roll<0.110) type='Heart';
 else if(roll<0.185) type='Potion';
 const kick=Math.random()*Math.PI*2;const kickSpeed=type==='Gold'?35+Math.random()*35:0;
 loot.push({x,y,r:type==='Weapon'?13:11,type,amount,weapon,bob:Math.random()*6.28,spin:Math.random()*6.28,vx:Math.cos(kick)*kickSpeed,vy:Math.sin(kick)*kickSpeed});
 if(type==='Gold') AUDIO.pickup('Gold'),showPickup(`🪙 ${amount} gold dropped — nearby gold is attracted to you`);
 else if(type==='Heart') AUDIO.pickup('Heart'),showPickup('♥ RARE HEART — full heal!');
 else if(type==='Potion') AUDIO.pickup('Potion'),showPickup('✚ RARE POTION — small heal');
 else AUDIO.pickup('Weapon'),showPickup(`⚔ ${weapon.name} — ${weapon.rarity} weapon found!`);
}

function awardXP(amount){
 xp+=amount;
 let levelled=false,bonusTotal=0;
 while(xp>=xpNeed){
  xp-=xpNeed; level++; levelled=true;
  xpNeed=12+(level-1)*6;
  player.maxHp+=5; player.hp=clamp(player.hp+5,0,player.maxHp);
  const bonus=10+Math.floor(Math.random()*11); gold+=bonus; bonusTotal+=bonus;
  player.damageBonus+=2;player.damage=currentWeaponStats().damage;
 }
 if(levelled){AUDIO.level();showPickup(`★ LEVEL ${level}!  +5 MAX HP  +${bonusTotal} GOLD  +2 DAMAGE`);msg(`LEVEL UP!  You feel stronger.`);}
 updateHud();
}

function findNearestEnemy(){
 return enemies.reduce((p,e)=>!p||dist(player,e)<dist(player,p)?e:p,null);
}
function performSwing(){
 if(gameOver||roomCleared||enemies.length===0||swingCooldown>0)return;
 const target=findNearestEnemy();
 if(target){facing=Math.atan2(target.y-player.y,target.x-player.x); facingDir=dirFromAngle(facing)}
 const side=nextSwingSide;
 nextSwingSide*=-1;
 const w=playerWeapon();
 AUDIO.swing(w);
 swingCooldown=w.cooldown;
 slashes.push({age:0,duration:w.swingDuration,side,angle:facing,reach:w.reach,hit:new Set(),damage:currentWeaponStats().damage,weapon:w});
}

function damagePlayer(amount,sourceX,sourceY,knockbackScale=1,hitType='normal'){
 if(gameOver||player.hitCooldown>0)return false;
 const dx=player.x-sourceX,dy=player.y-sourceY,d=Math.hypot(dx,dy)||1;
 const strength=(18+amount*0.95)*knockbackScale;
 player.knockX=dx/d*strength;player.knockY=dy/d*strength;
 player.hp-=amount;player.flash=.16;AUDIO.hurt(hitType==='fire');player.hitTimer=.24;player.hitCooldown=.28;
 addScore(-(hitType==='fire'?100:5));
 burst(player.x,player.y,'hit',7);
 if(player.hp<=0){player.hp=0;finishGameOver();}
 updateHud();
 return true;
}

function update(dt){
 if(!started)return;
 if(gameOver)return;
 if(paused){updateHud();return;}
 if(roomTransition){
  roomTransition.timer+=dt;
  if(roomTransition.timer>=roomTransition.switchAt&&!roomTransition.switched){room=roomTransition.nextRoom;resetRoom();roomTransition.switched=true;}
  if(roomTransition.timer>=roomTransition.duration)roomTransition=null;
  updateHud();return;
 }
 if(waveTransitionTimer>0)waveTransitionTimer=Math.max(0,waveTransitionTimer-dt);
 if(atShop||weaponPromptOpen){updateHud();return;}
 if(areaClearTimer>0)areaClearTimer=Math.max(0,areaClearTimer-dt);
 player.fire=Math.max(0,player.fire-dt);player.flash=Math.max(0,player.flash-dt);player.hitTimer=Math.max(0,player.hitTimer-dt);player.hitCooldown=Math.max(0,player.hitCooldown-dt);swingCooldown=Math.max(0,swingCooldown-dt);
 player.x+=player.knockX*dt;player.y+=player.knockY*dt;const knockDrag=Math.pow(.025,dt);player.knockX*=knockDrag;player.knockY*=knockDrag;
 let mx=(keys.d?1:0)-(keys.a?1:0),my=(keys.s?1:0)-(keys.w?1:0);
 const movingInput=joy.active||Math.hypot(mx,my)>.12;
 if(movingInput){walkTime+=dt*10;audioStepTimer-=dt;if(started&&!paused&&!atShop&&!roomTransition&&audioStepTimer<=0){AUDIO.step();audioStepTimer=.24+Math.random()*.08}}else audioStepTimer=0;
 if(joy.active){mx=joy.x;my=joy.y}
 const l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}
 if(l>.12){facing=Math.atan2(my,mx);facingDir=dirFromAngle(facing)}
 player.x=clamp(player.x+mx*player.speed*dt,30,W-30);player.y=clamp(player.y+my*player.speed*dt,70,H-70);
 player.x=clamp(player.x,30,W-30);player.y=clamp(player.y,70,H-70);
 // Keep the player outside the Guardian's body, while leaving enough overlap-free distance for sword reach to connect.
 const guardian=enemies.find(e=>e.type==='boss');
 if(guardian){const minD=guardian.r+player.r+6;const dx=player.x-guardian.x,dy=player.y-guardian.y,d=Math.hypot(dx,dy);if(d>0&&d<minD){player.x=guardian.x+dx/d*minD;player.y=guardian.y+dy/d*minD;}}
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
  const moveScale=e.stagger>0?.35:1;
  e.stagger=Math.max(0,(e.stagger||0)-dt);
  if(e.type==='goblin'){
   const a=Math.atan2(player.y-e.y,player.x-e.x); e.facingDir=dirFromAngle(a);
   // Goblins spread around the perimeter and avoid occupying the same firing lane.
   const candidates=[{x:42,y:92},{x:W-42,y:92},{x:42,y:H-92},{x:W-42,y:H-92},{x:W/2,y:84},{x:W/2,y:H-88}];
   if(!e.edgeTarget||Math.hypot(e.edgeTarget.x-e.x,e.edgeTarget.y-e.y)<14){
    const occupied=enemies.filter(o=>o!==e&&o.type==='goblin'&&o.edgeTarget).map(o=>o.edgeTarget);
    const ranked=candidates.map(c=>({c,score:Math.hypot(c.x-player.x,c.y-player.y)+(occupied.some(o=>Math.hypot(o.x-c.x,o.y-c.y)<65)?180:0)})).sort((u,v)=>v.score-u.score);
    e.edgeTarget=ranked[Math.floor(Math.random()*Math.min(2,ranked.length))].c;
   }
   const desired=142, edgeDist=Math.hypot(e.edgeTarget.x-e.x,e.edgeTarget.y-e.y);
   let moveX=0,moveY=0;
   if(edgeDist>18){moveX+=(e.edgeTarget.x-e.x)/edgeDist;moveY+=(e.edgeTarget.y-e.y)/edgeDist;}
   const tooClose=d<desired-24, tooFar=d>desired+28;
   if(tooClose){moveX+=Math.cos(a+Math.PI);moveY+=Math.sin(a+Math.PI)}
   else if(tooFar){moveX+=Math.cos(a)*.55;moveY+=Math.sin(a)*.55}
   const strafe=Math.sin(frameNow/820+e.orbitAngle)*.32;
   moveX+=Math.cos(a+Math.PI/2)*strafe;moveY+=Math.sin(a+Math.PI/2)*strafe;
   const ml=Math.hypot(moveX,moveY)||1;e.x+=moveX/ml*e.speed*dt*moveScale;e.y+=moveY/ml*e.speed*dt*moveScale;
   e.attackCooldown-=dt;
   if(d<285&&e.attackCooldown<=0&&e.windup<=0){e.windup=.52;e.attackCooldown=1.7+Math.random()*.35}
   if(e.windup>0){e.windup-=dt;if(e.windup<=0){shootProjectile(e.x,e.y,a,115,Math.round(10*enemyDamageScale()),'arrow');e.reposition=.38}}
   if(e.reposition>0){e.reposition-=dt;const back=Math.atan2(e.y-player.y,e.x-player.x);e.x+=Math.cos(back)*e.speed*dt*1.15*moveScale;e.y+=Math.sin(back)*e.speed*dt*1.15*moveScale}
  }else if(e.type==='skeleton'){
   const a=Math.atan2(player.y-e.y,player.x-e.x);
   e.facingDir=dirFromAngle(a);
   const nearbyGoblin=enemies.some(o=>o!==e&&o.type==='goblin'&&dist(o,e)<105);
   const skeletonPressure=nearbyGoblin?1.10:1;
   if(d>52&&e.windup<=0&&e.attackAge<=0){e.x+=Math.cos(a)*e.speed*dt*moveScale*skeletonPressure;e.y+=Math.sin(a)*e.speed*dt*moveScale*skeletonPressure}
   e.attackCooldown-=dt;
   if(d<78&&e.attackCooldown<=0&&e.windup<=0&&e.attackAge<=0){e.windup=.48;e.swingHit=false;e.swingAngle=a;e.swingSide=(Math.random()<.5?-1:1)}
   if(e.windup>0){e.windup-=dt;if(e.windup<=0){e.attackAge=.20;e.swingHit=false;e.swingAngle=a}}
   if(e.attackAge>0){
    e.attackAge=Math.max(0,e.attackAge-dt);
    if(!e.swingHit&&Math.hypot(player.x-e.x,player.y-e.y)<e.r+player.r+18){const goblinSupport=enemies.filter(o=>o.type==='goblin'&&dist(o,e)<120).length;damagePlayer(Math.round(14*enemyDamageScale()*(1+Math.min(2,goblinSupport)*.08)),e.x,e.y,1.0,'normal');e.swingHit=true}
    if(e.attackAge<=0){e.attackCooldown=1.2;e.vulnerable=.35;}
   e.vulnerable=Math.max(0,(e.vulnerable||0)-dt);
   }
  }else if(e.type==='bat'){
   const a=Math.atan2(player.y-e.y,player.x-e.x); e.facingDir=dirFromAngle(a);
   e.batAttackCooldown-=dt;
   if(e.batAttackAge>0){
    e.batAttackAge-=dt;
    const diveA=Math.atan2(player.y-e.y,player.x-e.x);
    e.x+=Math.cos(diveA)*e.speed*1.35*dt*moveScale;e.y+=Math.sin(diveA)*e.speed*1.35*dt*moveScale;
    if(!e.batAttackHit&&Math.hypot(player.x-e.x,player.y-e.y)<e.r+player.r+10){damagePlayer(1,e.x,e.y,.45,'normal');e.batAttackHit=true}
    if(e.batAttackAge<=0){e.batAttackCooldown=1.25+Math.random()*.7;e.batAttackHit=false}
   }else if(d>92){
    const weave=Math.sin(frameNow/240+e.orbitAngle)*.28;
    e.x+=(Math.cos(a)+Math.cos(a+Math.PI/2)*weave)*e.speed*dt*moveScale;
    e.y+=(Math.sin(a)+Math.sin(a+Math.PI/2)*weave)*e.speed*dt*moveScale;
   }else{
    // Close bats orbit and subtly alter their tangent, steering the player away from their ideal escape line.
    e.orbitAngle+=dt*(1.15+Math.sin(frameNow/700+e.orbitAngle)*.22);
    const desired=e.orbitRadius, radial=(d-desired)*.025;
    const tangentA=a+Math.PI/2+(Math.sin(e.orbitAngle*1.7)*.22);
    e.x+=(Math.cos(a)*radial+Math.cos(tangentA)*.78)*e.speed*.42*dt*moveScale;
    e.y+=(Math.sin(a)*radial+Math.sin(tangentA)*.78)*e.speed*.42*dt*moveScale;
    if(e.batAttackCooldown<=0&&d<118&&d>38){e.batAttackAge=.34;e.batAttackHit=false;}
   }
  }else if(e.type==='boss'){
   const a=Math.atan2(player.y-e.y,player.x-e.x);
   e.facingDir=dirFromAngle(a);
   // The Guardian slowly circles/repositions around the player instead of parking in place.
   const orbitSign=Math.sin((frameNow/1000)+room)>.0?1:-1;
   const desired=118;
   const radial=d>desired+12?1:d<desired-18?-1:0;
   const tangent=0.72;
   e.x+=(Math.cos(a)*radial+Math.cos(a+orbitSign*Math.PI/2)*tangent)*e.speed*dt*moveScale;
   e.y+=(Math.sin(a)*radial+Math.sin(a+orbitSign*Math.PI/2)*tangent)*e.speed*dt*moveScale;
   if(e.warningTimer>0){
    e.warningTimer=Math.max(0,e.warningTimer-dt);bossWarningTimer=e.warningTimer;
    if(e.warningTimer<=0){setBossWarning('');e.patternActive=true;bossPatternTimer=0;}
   }else if(!e.patternActive){
    e.attackTimer-=dt;
    if(e.attackTimer<=0){
     bossPatternMode=bossPatternStep%2===0?'burst':'spiral';bossPatternStep++;
     e.warning=bossPatternMode==='burst'?'fireball':'blast';e.warningTimer=.82;bossWarningTimer=e.warningTimer;setBossWarning(e.warning);AUDIO.bossWarning();
    }
   }
   if(e.patternActive&&bossPatternMode==='burst'&&bossPatternTimer<1.0){
    const n=5,gap=.16,idx=Math.floor(bossPatternTimer/gap);
    if(idx<n&&Math.abs(bossPatternTimer-idx*gap)<dt*1.2){AUDIO.projectile('fireball');const base=Math.atan2(player.y-e.y,player.x-e.x);shootProjectile(e.x,e.y,base+(idx-2)*.11,122,Math.round(14*enemyDamageScale()),'fireball');}
    bossPatternTimer+=dt;
    if(bossPatternTimer>=1.0){e.patternActive=false;e.attackTimer=3.2;}
   }else if(e.patternActive&&bossPatternMode==='spiral'&&bossPatternTimer<3.6){
    const idx=Math.floor(bossPatternTimer/.14),prev=Math.floor((bossPatternTimer-dt)/.14);
    if(idx!==prev){AUDIO.projectile('fireblast');const pa=idx*.48;shootProjectile(e.x,e.y,pa,88,12,'fireblast');shootProjectile(e.x,e.y,pa+Math.PI,88,12,'fireblast');}
    bossPatternTimer+=dt;
    if(bossPatternTimer>=3.6){e.patternActive=false;e.attackTimer=5.4;}
   }
  }
  e.x=clamp(e.x,32,W-32);e.y=clamp(e.y,72,H-72);
  if(e.type!=='goblin'&&e.type!=='skeleton'&&d<e.r+player.r){damagePlayer(e.type==='boss'?Math.round(30*enemyDamageScale()):e.type==='bat'?1:Math.round(22*enemyDamageScale()),e.x,e.y,e.type==='boss'?1.2:.55,'normal')}
  if(player.hp<=0){player.hp=0;finishGameOver()}
 }
 clampEnemySeparation();

 for(let i=projectiles.length-1;i>=0;i--){const q=projectiles[i];q.age+=dt;q.x+=Math.cos(q.a)*q.speed*dt;q.y+=Math.sin(q.a)*q.speed*dt;q.life-=dt;if(q.life<=0||q.x<15||q.x>W-15||q.y<60||q.y>H-60){projectiles.splice(i,1);continue}if(Math.hypot(q.x-player.x,q.y-player.y)<q.r+player.r){impactMarks.push({x:player.x,y:player.y,age:0,dur:.18,type:'impact',angle:q.a});if(damagePlayer(q.damage,q.x,q.y,q.type==='fireball'?1.0:.85,q.type==='fireball'||q.type==='fireblast'?'fire':'normal'))projectiles.splice(i,1);else projectiles.splice(i,1)}}

 for(let i=slashes.length-1;i>=0;i--){
  const s=slashes[i];s.age+=dt;const progress=s.age/s.duration;const reach=s.reach||playerWeapon().reach;const centre=s.angle+s.side*(Math.PI*.40-(Math.min(1,progress)*Math.PI*.80));
  for(const e of [...enemies]){if(s.hit.has(e)||!e.active)continue;const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy);let da=Math.atan2(dy,dx)-centre;da=Math.atan2(Math.sin(da),Math.cos(da));if(d<reach+e.r&&Math.abs(da)<.82){e.hp-=s.damage;s.hit.add(e);e.hit=.12;e.stagger=.12;const push=Math.max(0,1-d/(reach+e.r));const pa=Math.atan2(e.y-player.y,e.x-player.x);e.x+=Math.cos(pa)*(8+18*push);e.y+=Math.sin(pa)*(8+18*push);AUDIO.hit();impactMarks.push({x:e.x,y:e.y,age:0,dur:.16,type:'hit',angle:Math.random()*Math.PI});burst(e.x,e.y,'hit',5);if(e.hp<=0){AUDIO.death(e.type);deathMarks.push({x:e.x,y:e.y,type:e.type,seed:Math.random()*1000});if(e.type!=='boss')spawnLoot(e.x,e.y,e.type);else{const reward=bossGoldReward();gold+=reward;totalGoldCollected+=reward;showPickup(`👑 GUARDIAN BONUS  +${reward} GOLD`)}enemies.splice(enemies.indexOf(e),1);kills++;addScore(SCORE_VALUES[e.type]||0);awardXP(e.type==='boss'?30:e.type==='bat'?3:e.type==='goblin'?4:5);burst(e.x,e.y,'death',e.type==='boss'?28:12);if(e.type==='boss'){areaClearTimer=1.8;areaClearShown=true;}if(!isBossRoom())spawnTimer=.65;}}}
  if(progress>=1)slashes.splice(i,1);
 }

 loot.forEach(l=>{
  l.bob+=dt*3;l.spin+=dt*2;
  if(l.type==='Gold'){
   l.x+=l.vx*dt;l.y+=l.vy*dt;l.vx*=Math.pow(.035,dt);l.vy*=Math.pow(.035,dt);
   l.x=clamp(l.x,28,W-28);l.y=clamp(l.y,72,H-72);
   const dx=player.x-l.x,dy=player.y-l.y,d=Math.hypot(dx,dy),magnet=32;
   if(d>0.1&&d<magnet){const pull=70+((magnet-d)/magnet)*210;l.x+=dx/d*pull*dt;l.y+=dy/d*pull*dt}
  }
 });
 for(let i=loot.length-1;i>=0;i--){const l=loot[i];const pickupRadius=l.type==='Gold'?player.r+5:player.r+l.r+9;if(dist(player,l)<pickupRadius){if(l.type==='Gold'){gold+=l.amount;totalGoldCollected+=l.amount;AUDIO.pickup('Gold');showPickup(`🪙 +${l.amount} GOLD  •  purse: ${gold}`)}if(l.type==='Heart'){player.hp=player.maxHp;AUDIO.pickup('Heart');showPickup('♥ FULL HEAL!')}if(l.type==='Potion'){const before=player.hp;AUDIO.pickup('Potion');player.hp=clamp(player.hp+scaledPotionHeal(),0,player.maxHp);showPickup(`✚ +${Math.round(player.hp-before)} HP`)}if(l.type==='Weapon'){weaponFinds.push(l.weapon);AUDIO.pickup('Weapon');showPickup(`⚔ ${l.weapon.name} — ${l.weapon.rarity}  •  take it to the exit`)}burst(l.x,l.y,l.type==='Gold'?'coin':l.type==='Weapon'?'weapon':'heal',8);loot.splice(i,1);updateHud()}}
 particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.vx*=.985;p.vy*=.985});particles=particles.filter(p=>p.life>0); impactMarks.forEach(m=>m.age+=dt);impactMarks=impactMarks.filter(m=>m.age<m.dur);
 if(!isBossRoom()&&spawnQueue.length===0&&entrances.length===0&&enemies.length===0&&!roomCleared){
   if(spawnWaveIndex<spawnWaves.length-1){spawnWaveIndex++;spawnQueue=spawnWaves[spawnWaveIndex].slice();spawnTimer=1.0;waveTransitionTimer=.9;AUDIO.wave();msg(`WAVE ${spawnWaveIndex+1}/${spawnWaves.length} — INCOMING`);}
   else{roomCleared=true;roomsCleared++;AUDIO.clear();msg('ROOM CLEARED  •  WALK TO EXIT »');burst(W/2,H/2,'clear',18)}
 }
 if(isBossRoom()&&enemies.length===0&&!roomCleared){roomCleared=true;AUDIO.clear();msg(`AREA ${area} COMPLETE  •  WALK TO EXIT »`)}
 if(roomCleared&&!atShop&&!weaponPromptOpen){
  // 0.2.8c: the exit trigger now matches the actual wooden doorway in the right-wall asset.
  const door=exitDoorRect();
  const cx=clamp(player.x,door.x,door.x+door.w),cy=clamp(player.y,door.y,door.y+door.h);
  if(Math.hypot(player.x-cx,player.y-cy)<=player.r){
    if(isBossRoom())beginAreaShop();
    else if(weaponFinds.length){pendingWeaponIndex=0;weaponPromptOpen=true;openWeaponPrompt();}
    else{AUDIO.exit();startRoomTransition(room+1)}
  }
}
 updateHud();
}
function shootProjectile(x,y,a,speed,damage,type){projectiles.push({x,y,a,speed,damage,r:type==='arrow'?4:7,life:type==='arrow'?2.6:3.2,type,age:0})}

function burst(x,y,type='death',n=8,spawnType=''){
 for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=25+Math.random()*110;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:type==='shot'?.12:.45,type,spawnType})}
}
function pixelRect(x,y,w,h,fill){ctx.fillStyle=fill;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function text(t,x,y,size,fill,align='left'){ctx.fillStyle=fill;ctx.font=`700 ${size}px ui-monospace,monospace`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(t,x,y)}
function panel(x,y,w,h){pixelRect(x,y,w,h,'#061619e8');ctx.strokeStyle='#376566';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h)}

function drawDungeon(){
  // 0.2.5: gameplay HUD lives in the slim banner above the world.
  ctx.fillStyle=P.ink;ctx.fillRect(0,0,W,H);
  drawModularDungeon();
}
function drawRoomArchetypeDetail(){
 const a=roomArchetype();
 if(a==='GREAT HALL'){for(let x=78;x<W-58;x+=58){drawBanner(x,18)}}
 if(a==='PILLARED HALL'){for(let y=150;y<350;y+=72){drawPillar(58,y);drawPillar(W-58,y)}}
 if(a==='RUINED CHAMBER'){for(let i=0;i<5;i++)drawRubble(70+(i*61)%220,115+(i*43)%255,i%3)}
 if(a==='CHAPEL'){drawAltar(W/2,116);for(let x=85;x<=275;x+=95)drawCandle(x,142)}
 if(a==='GUARD ROOM'){drawTable(W/2,126);drawWeaponRack(55,165);drawWeaponRack(W-55,165)}
 if(a==='CROSS HALL'){drawFloorCross();}
 text(a,W/2,82,7,'#78918a','center');
}
function drawTorchLight(){
 const torches=[[55,42],[W-82,42],[55,H-95],[W-82,H-95]];
 for(const [x,y] of torches){const g=ctx.createRadialGradient(x,y-8,2,x,y-8,52);g.addColorStop(0,'rgba(82,216,192,.13)');g.addColorStop(1,'rgba(82,216,192,0)');ctx.fillStyle=g;ctx.fillRect(x-54,y-62,108,108)}
}
function drawAltar(x,y){pixelRect(x-36,y,72,12,'#132a2e');pixelRect(x-28,y-15,56,15,P.stone);pixelRect(x-19,y-28,38,13,'#315454');pixelRect(x-3,y-24,6,7,P.teal2)}
function drawCandle(x,y){pixelRect(x-2,y-10,4,10,'#d4c18a');pixelRect(x,y-15,3,6,P.teal2)}
function drawTable(x,y){pixelRect(x-34,y,68,9,'#59472f');pixelRect(x-27,y+8,6,22,'#493b29');pixelRect(x+21,y+8,6,22,'#493b29')}
function drawWeaponRack(x,y){pixelRect(x-5,y,10,42,'#493b29');for(let i=-1;i<=1;i++)drawSwordAt(x+i*10,y+8,'shortSword',-1.15,1,.55)}
function drawFloorCross(){pixelRect(W/2-10,105,20,250,'#162f32');pixelRect(72,215,216,20,'#162f32');for(let i=0;i<4;i++)pixelRect(80+i*68,208,8,8,P.moss)}
function drawRoomVariation(){
 const v=roomVariation;
 // Pillars: chunky but purely decorative, positioned away from the entrance/exit lanes.
 const pillarSets=[
  [[108,118],[252,362]],
  [[104,352],[256,118]],
  [[108,122],[108,358],[252,122],[252,358]],
  [[150,118],[250,300]],
  [[105,300],[255,180]],
  []
 ];
 const pillars=pillarSets[v%pillarSets.length];
 for(const p of pillars)drawPillar(p[0],p[1]);
 // Wall alcoves/niches create a different silhouette without changing collision.
 const alcoveSide=v%4;
 if(alcoveSide!==3)drawAlcove(alcoveSide===0?'left':'right',118+(v%3)*76);
 if(v%5===1)drawAlcove('left',318);
 // Small debris clusters vary the floor dressing.
 const rubbleCount=2+(v%4);
 for(let i=0;i<rubbleCount;i++){
  const x=82+((v*43+i*71)%196),y=120+((v*29+i*83)%250);
  if(Math.abs(x-58)<34&&Math.abs(y-H/2)<72)continue;
  if(Math.abs(x-(W-22))<34&&Math.abs(y-H/2)<72)continue;
  drawRubble(x,y,(v+i)%3);
 }
}
function drawPillar(x,y){ctx.save();ctx.shadowBlur=8;ctx.shadowColor='#0a1719';pixelRect(x-13,y-13,26,34,'#122a2d');pixelRect(x-10,y-9,20,29,P.stone);pixelRect(x-14,y-15,28,7,P.wall2);pixelRect(x-14,y+19,28,7,P.wall2);pixelRect(x-5,y-5,4,18,'#3a5b59');pixelRect(x+4,y-3,3,15,'#1d393c');ctx.restore()}
function drawAlcove(side,y){const x=side==='left'?12:W-12,dir=side==='left'?1:-1;ctx.save();pixelRect(x,y-34,dir*24,68,'#081619');pixelRect(x+dir*3,y-29,dir*18,58,'#0d2528');pixelRect(x+dir*7,y-24,dir*11,48,'#102c30');pixelRect(x+dir*2,y-38,dir*22,6,P.wall2);pixelRect(x+dir*2,y+32,dir*22,6,P.wall2);ctx.restore()}
function drawRubble(x,y,type){ctx.save();ctx.translate(x,y);ctx.rotate((type-1)*.18);pixelRect(-7,0,8,6,'#52615a');pixelRect(2,-4,7,7,P.stone);pixelRect(-2,-8,5,4,'#314b4b');if(type===2)pixelRect(8,2,4,3,P.moss);ctx.restore()}
function drawBanner(x,y){ctx.save();ctx.translate(x,y);pixelRect(-18,0,36,6,'#6d5630');pixelRect(-14,5,28,39,'#163e3b');pixelRect(-10,9,20,26,'#245650');pixelRect(-3,15,6,8,P.teal);pixelRect(-6,18,12,3,P.teal);ctx.fillStyle='#c7a65a';ctx.beginPath();ctx.moveTo(-14,44);ctx.lineTo(0,55);ctx.lineTo(14,44);ctx.closePath();ctx.fill();ctx.restore()}
function drawSkullShrine(x,y){ctx.save();ctx.shadowBlur=10;ctx.shadowColor='#142f31';pixelRect(x-30,y-2,60,30,'#10262a');pixelRect(x-24,y-15,48,15,P.wall2);text('☠',x,y+18,31,'#7c9181','center');ctx.restore()}
function drawBone(x,y,r){ctx.save();ctx.translate(x,y);ctx.rotate(r);pixelRect(-18,-2,36,4,'#9c9a85');pixelRect(-17,-6,5,5,P.cream);pixelRect(12,1,5,5,P.cream);ctx.restore()}
function drawBlood(x,y,col){ctx.fillStyle=col;for(let i=0;i<8;i++){const a=i*1.7;const rr=6+((i*13)%17);pixelRect(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.55,2+(i%3),2+(i%2),ctx.fillStyle)}}
function drawBonePile(x,y){drawBone(x-5,y-2,-.65);drawBone(x+6,y+3,.7)}
function drawDeathMarks(){for(const m of deathMarks){const remainKey=m.type==='skeleton'?'skeletonRemains':m.type==='goblin'?'goblinRemains':m.type==='bat'?'batRemains':'bossRemains';if(!drawGameAsset(remainKey,m.x,m.y,34,.88)){if(m.type==='skeleton')drawBonePile(m.x,m.y);else if(m.type==='bat'||m.type==='boss')drawBlood(m.x,m.y,'#7a3035');else drawBlood(m.x,m.y,'#3b7b45')}if(m.type!=='skeleton')drawGameAsset('bloodSplat',m.x,m.y,30,.45)}}
function drawImpactMarks(){for(const m of impactMarks){const p=Math.min(1,m.age/m.dur);drawGameAsset(m.type==='hit'?'hitSpark':'impactSpark',m.x,m.y,30+Math.round(p*8),1-p,m.angle)}}
function drawTorch(x,y){const t=frameNow/115+x*.04;const wobble=Math.sin(t)*2;ctx.save();ctx.shadowBlur=24+Math.sin(t*.7)*5;ctx.shadowColor=P.teal;pixelRect(x-8,y,16,28,'#5b655d');pixelRect(x-5,y+5,10,19,'#2b4543');ctx.fillStyle=P.teal2;ctx.beginPath();ctx.moveTo(x+wobble,y-21-Math.sin(t)*2);ctx.lineTo(x+9,y-5);ctx.lineTo(x+Math.sin(t*1.3)*2,y+4);ctx.lineTo(x-9,y-5);ctx.closePath();ctx.fill();ctx.fillStyle=P.teal;ctx.beginPath();ctx.moveTo(x+wobble*.5,y-15);ctx.lineTo(x+4,y-5);ctx.lineTo(x,y);ctx.lineTo(x-4,y-5);ctx.closePath();ctx.fill();ctx.restore()}

function drawSwordAt(x,y,weaponKeyOrInstance,angle,alpha=1,scale=1){
 const w=weaponKeyOrInstance?.id?weaponKeyOrInstance:(WEAPONS[weaponKeyOrInstance]||WEAPONS.shortSword);
 const key=w.id||'shortSword';
 const len=key==='claymore'?31:key==='longSword'?27:23;
 const thick=key==='claymore'?5:key==='longSword'?4:3;
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;
 pixelRect(7,-2,5,4,'#6f4f32');
 pixelRect(11,-thick/2,len*scale,thick,P.cream);
 pixelRect(11+len*scale,-thick/2-1,4,thick+2,P.gold2);
 pixelRect(11,-thick/2-1,4,thick+2,P.gold2);
 ctx.restore();
}
function drawSlash(s){
 const p=Math.min(1,s.age/s.duration);
 const eased=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
 const centre=s.angle+s.side*(Math.PI*.40-eased*Math.PI*.80);
 const trail=Math.sin(p*Math.PI);
 ctx.save();ctx.globalAlpha=.18*trail;ctx.strokeStyle=P.teal2;ctx.lineWidth=5;ctx.beginPath();ctx.arc(player.x,player.y,(s.reach||58)-2, s.angle-s.side*Math.PI*.40, s.angle+s.side*Math.PI*.40, s.side<0);ctx.stroke();ctx.restore();
 // The old procedural sword is intentionally gone. The actual sword is now part of
 // the player's attack animation; this function supplies only the swoosh/trail.
}
function drawFacingArrow(){
 const a=facing;
 const d=20;
 const x=player.x+Math.cos(a)*d;
 const y=player.y+Math.sin(a)*d;
 ctx.save();
 ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha=.82;
 ctx.fillStyle=P.gold2;
 ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-4,-4);ctx.lineTo(-1,0);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();
 ctx.globalAlpha=.5;ctx.fillStyle=P.cream;ctx.fillRect(-1,-1,6,2);
 ctx.restore();
}
function drawSpriteFrame(img,sx,sy,sw,sh,x,y,dw,dh,flip=false,alpha=1){
 if(!img.complete||img.naturalWidth===0)return false;
 ctx.save();ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.drawImage(img,sx,sy,sw,sh,-dw/2,-dh/2,dw,dh);ctx.restore();return true;
}
function drawPlayer(){
 const moving=Math.hypot(joy.x,joy.y)>.12||keys.w||keys.a||keys.s||keys.d;
 const bob=moving?Math.sin(walkTime)*1.2:0;
 const x=player.x,y=player.y+bob,hurt=player.hitTimer>0;
 ctx.save();
 let action='idle',frame=animFrame(frameNow/1000,3.5);
 if(hurt){action='hurt';frame=timedAnimFrame(.24-player.hitTimer,.24,16)}
 else if(slashes.length){const s=slashes[slashes.length-1];action='attack';frame=timedAnimFrame(s.age,s.duration,18)}
 else if(moving){
   // The Codex player walk row is a directional stepping pose, not a 4-frame cycle.
   // Alternate it with the matching idle pose to create a clean two-pose walk.
   const step=Math.floor(walkTime*5)%2;
   action=step?'walk':'idle';
   frame=directionFrame(facingDir);
 }
 const flip=facingDir==='left';
 if(drawCharacterSprite('player',action,frame,x,y,48,flip,hurt?.78:1,facingDir)){
   ctx.restore();
   return;
 }
 ctx.restore();
 drawLegacyPlayer();
}
function drawLegacyPlayer(){
 const x=player.x,y=player.y;ctx.save();ctx.translate(x,y);ctx.scale(SPRITE_SCALE,SPRITE_SCALE);pixelRect(-12,4,24,16,'#071517');pixelRect(-15,0,30,12,'#174642');pixelRect(-12,-13,24,16,'#0b292b');pixelRect(-9,-15,18,7,'#0c3031');ctx.restore();
}
function drawEnemy(e,i){
 const x=e.x,y=e.y;
 ctx.save();
 const kind=e.type==='boss'?'boss':e.type;
 const size=e.type==='boss'?70:52;
 const flip=(e.facingDir||'right')==='left';
 let action='idle',frame=animFrame(frameNow/1000+(i||0)*.17,e.type==='bat'?8:5);
 const attacking=(e.type==='goblin'&&e.windup>0)||(e.type==='skeleton'&&(e.windup>0||e.attackAge>0))||(e.type==='bat'&&e.batAttackAge>0)||(e.type==='boss'&&(e.warningTimer>0||e.patternActive));
 if(e.hit>0){action='hurt';frame=timedAnimFrame(.12-e.hit,.12,18)}
 else if(attacking){action='attack';
   const age=e.type==='bat'?e.batAttackAge:(e.type==='skeleton'?Math.max(0,.20-e.attackAge):(e.type==='goblin'?Math.max(0,.52-e.windup):.82-e.warningTimer));
   const duration=e.type==='bat'?.34:(e.type==='skeleton'?.20:(e.type==='goblin'?.52:.82));
   frame=timedAnimFrame(age,duration,12);
 }else{action='walk';}
 if(drawCharacterSprite(kind,action,frame,x,y,size,flip,e.hit>0?.78:1,e.facingDir)){
   ctx.restore();
 }else{
   ctx.restore();drawLegacyEnemy(e,i);
 }
 if(e.type==='bat'&&e.batAttackAge>0){ctx.save();ctx.globalAlpha=.45+.45*Math.sin(e.batAttackAge*30);ctx.strokeStyle=P.red2;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,e.r+7,0,Math.PI*2);ctx.stroke();ctx.restore()}
 if(e.type==='goblin'&&e.windup>0){const aimA=Math.atan2(player.y-y,player.x-x);ctx.save();ctx.translate(x,y);ctx.rotate(aimA);ctx.strokeStyle='#d9b35b';ctx.globalAlpha=.65*Math.min(1,e.windup/.52);ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(17,0);ctx.lineTo(48,0);ctx.stroke();ctx.setLineDash([]);ctx.restore()}
 if(e.windup>0){ctx.save();ctx.strokeStyle=P.gold2;ctx.lineWidth=2;ctx.globalAlpha=Math.min(1,e.windup/.48);ctx.beginPath();ctx.arc(x,y,e.r+7,-1.7,-.4);ctx.stroke();ctx.restore()}
 pixelRect(x-e.r,y-e.r-11,e.r*2,4,'#0a1719');pixelRect(x-e.r,y-e.r-11,e.r*2*Math.max(0,e.hp/e.max),4,e.type==='boss'?P.gold:P.red);if(e.type==='boss')text('GUARDIAN',x,y-e.r-18,7,P.cream,'center');
}
function drawLegacyEnemy(e,i){
 const x=e.x,y=e.y;ctx.save();ctx.translate(x,y);ctx.scale(SPRITE_SCALE,SPRITE_SCALE);pixelRect(-10,-6,20,14,e.type==='skeleton'?P.cream:'#397d65');ctx.restore();
}
function drawEntrance(ent){
 const p=Math.min(1,ent.age/ent.duration),x=ent.x,y=ent.y;
 ctx.save();ctx.translate(x,y);
 if(ent.type==='bat'){
  const h=(1-p)*28;ctx.globalAlpha=.35;ctx.fillStyle='#02090a';ctx.beginPath();ctx.ellipse(0,12,10+p*8,4,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.translate(0,-h);ctx.scale(.45+.55*p,.45+.55*p);
  if(spriteReady.bat)drawCharacterSprite('bat','idle',animFrame(frameNow/1000,8),0,0,80,false,p); else {pixelRect(-8,-6,16,14,'#2a2a42');pixelRect(-22,-14,14,20,'#463253');pixelRect(8,-14,14,20,'#463253')}
 }else if(ent.type==='goblin'){
  const r=5+18*p;ctx.globalAlpha=(1-p)*.7;ctx.fillStyle='#397d65';for(let i=0;i<9;i++){const a=i*2.4;ctx.beginPath();ctx.arc(Math.cos(a)*r*.7,Math.sin(a)*r*.45,r*.16,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=p;ctx.scale(.7+.3*p,.7+.3*p);
  if(spriteReady.goblin)drawCharacterSprite('goblin','idle',animFrame(frameNow/1000,5),0,0,80,false,1); else {pixelRect(-14,-5,28,15,'#397d65');pixelRect(-10,-11,20,7,'#57b48b')}
 }else{
  const r=8+20*p;ctx.globalAlpha=(1-p)*.75;ctx.fillStyle='#8a6743';for(let i=0;i<10;i++){const a=i*2.1;ctx.beginPath();ctx.arc(Math.cos(a)*r*.75,Math.sin(a)*r*.5,2+i%3,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=p;ctx.translate(0,8*(1-p));ctx.scale(.7+.3*p,.7+.3*p);
  if(spriteReady.skeleton)drawCharacterSprite('skeleton','idle',animFrame(frameNow/1000,5),0,0,80,false,1); else {pixelRect(-10,-6,20,14,P.cream);pixelRect(-8,-17,16,12,'#e3ddc8')}
 }
 ctx.restore();
 if(p<1)text(ent.type==='bat'?'DROP IN':ent.type==='goblin'?'MAGIC':'EARTH',x,y-28,6,ent.type==='goblin'?P.green:ent.type==='skeleton'?'#a57b4c':P.cream,'center');
}
function drawProjectile(q){
 ctx.save();
 const key=q.type==='arrow'?'goblinArrow':q.type==='fireblast'?'fireblast':'fireball';
 const size=q.type==='arrow'?30:(q.type==='fireblast'?36:32);
 if(drawGameAsset(key,q.x,q.y,size,.96,q.type==='arrow'?q.a:0)){ctx.restore();return}
 ctx.translate(q.x,q.y);ctx.rotate(q.a);
 if(q.type==='arrow'){ctx.shadowBlur=8;ctx.shadowColor=P.gold;pixelRect(-7,-2,14,4,P.cream);pixelRect(5,-1,5,2,P.gold2);ctx.restore();return}
 const blast=q.type==='fireblast';const pulse=.85+.18*Math.sin(q.age*18);ctx.globalAlpha=.95;
 ctx.fillStyle=blast?'#ed6a70':'#e5b94d';ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(-1,-6*pulse);ctx.lineTo(2,-2);ctx.lineTo(7,-7*pulse);ctx.lineTo(5,1);ctx.lineTo(9,4);ctx.lineTo(1,5);ctx.lineTo(-3,9);ctx.lineTo(-3,3);ctx.closePath();ctx.fill();
 ctx.fillStyle=blast?'#ffd1a8':'#ffe08a';ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(0,-4);ctx.lineTo(2,-1);ctx.lineTo(5,-3);ctx.lineTo(3,2);ctx.lineTo(5,4);ctx.lineTo(0,3);ctx.closePath();ctx.fill();
 ctx.fillStyle='#fff1c7';pixelRect(-1,-2,4,4,'#fff1c7');ctx.restore();
}

function drawLoot(l){
 const y=l.y+Math.sin(l.bob)*3,x=l.x;ctx.save();ctx.translate(x,y);
 const key=l.type==='Gold'?'gold':l.type==='Heart'?'healthFull':l.type==='Potion'?'healthSmall':'weaponDrop';
 if(drawGameAsset(key,0,0,32,1,0)){
   if(l.type==='Gold'&&Math.sin(l.bob*2.1)>.55){ctx.fillStyle=P.cream;ctx.globalAlpha=.7;pixelRect(-2,-13,4,2,P.cream);pixelRect(-1,-15,2,6,P.cream);pixelRect(-4,-12,8,2,P.cream);ctx.globalAlpha=1}
   if(l.type==='Weapon'){const r=rarityData(l.weapon?.rarity);text(l.weapon?.rarity?.slice(0,1)||'C',0,25,7,r.name==='Legendary'?P.gold2:r.name==='Epic'?P.red2:r.name==='Rare'?P.teal2:P.cream,'center')}
   ctx.restore();return;
 }
 if(l.type==='Gold'){pixelRect(-13,2,10,8,P.gold);pixelRect(1,-3,11,9,P.gold2);pixelRect(-4,-9,10,9,'#f0c85c');pixelRect(-10,4,5,3,'#8f6b25');pixelRect(4,-1,5,3,'#9d7426');}
 else if(l.type==='Heart'){ctx.fillStyle=P.red2;ctx.beginPath();ctx.moveTo(0,11);ctx.lineTo(-13,-1);ctx.quadraticCurveTo(-15,-12,-7,-13);ctx.quadraticCurveTo(0,-13,0,-6);ctx.quadraticCurveTo(0,-13,7,-13);ctx.quadraticCurveTo(15,-12,13,-1);ctx.closePath();ctx.fill();pixelRect(-7,-7,4,3,'#ffb0a5');}
 else if(l.type==='Potion'){pixelRect(-5,-13,10,5,P.cream);pixelRect(-9,-7,18,17,'#25876e');pixelRect(-6,-4,12,11,'#55c997');pixelRect(-3,1,6,6,'#8ee7b9');pixelRect(-7,-15,14,3,'#bcae87');}
 else{const r=rarityData(l.weapon?.rarity);pixelRect(-3,-14,6,9,P.gold2);pixelRect(-6,-6,12,4,P.cream);pixelRect(-3,-2,6,17,'#6f4f32');pixelRect(-8,13,16,4,P.gold);text(l.weapon?.rarity?.slice(0,1)||'C',0,25,7,r.name==='Legendary'?P.gold2:r.name==='Epic'?P.red2:r.name==='Rare'?P.teal2:P.cream,'center');}
 ctx.restore();
}

function drawEntranceDoor(){
 const x=12,y=H/2;ctx.save();
 pixelRect(x,y-54,24,108,'#081619');pixelRect(x,y-48,20,96,'#173336');pixelRect(x+3,y-44,17,88,'#0d2528');
 ctx.strokeStyle='#376566';ctx.lineWidth=3;ctx.strokeRect(x+1,y-50,21,100);
 // Deep black threshold and subtle interior glow suggest the room lies beyond it.
 pixelRect(x+4,y-42,14,84,'#061316');
 pixelRect(x+7,y-30,2,60,'#29494a');
 text('ENTER',x+12,y+65,7,'#78918a','center');
 ctx.restore();
}
// 0.2.8c: the right-wall asset is 160x1536. The wooden doorway itself is
// tightly bounded here so the escape trigger matches the visible doorway, not the wall.
const EXIT_DOOR_SOURCE={x:91,y:642,w:42,h:216};
function exitDoorRect(){
 const wallX=W-50,wallY=16,wallW=50,wallH=H-66;
 return {
   x:wallX+(EXIT_DOOR_SOURCE.x/160)*wallW,
   y:wallY+(EXIT_DOOR_SOURCE.y/1536)*wallH,
   w:(EXIT_DOOR_SOURCE.w/160)*wallW,
   h:(EXIT_DOOR_SOURCE.h/1536)*wallH
 };
}

// 0.2.8c performance optimisation:
// Build the animated doorway effect once as a small sprite-sheet-like set of frames.
// During gameplay the effect is just one drawImage() per frame — no per-frame gradients,
// bezier paths, shadowBlur or particle geometry.
const EXIT_EFFECT_FRAME_COUNT=10;
const EXIT_EFFECT_FPS=12;
let exitEffectFrames=[];
function buildExitEffectFrames(){
 if(exitEffectFrames.length)return;
 const size=128,frames=[];
 for(let f=0;f<EXIT_EFFECT_FRAME_COUNT;f++){
   const oc=document.createElement('canvas');oc.width=size;oc.height=size;
   const o=oc.getContext('2d');
   const t=f/EXIT_EFFECT_FRAME_COUNT*Math.PI*2;
   o.save();o.globalCompositeOperation='screen';o.lineCap='round';o.lineJoin='round';
   // Soft, pre-rendered teal smoke. The blur is paid once during setup, not 60 times/sec.
   for(let side=-1;side<=1;side+=2){
     for(let i=0;i<3;i++){
       const phase=t*(.8+i*.12)+i*1.7+side*.8;
       const y0=64+side*0;
       const x0=64+side*(11+i*3);
       const x1=64+side*(27+i*4);
       const y1=64+(Math.sin(phase*.7+i)*5);
       o.beginPath();o.moveTo(x0,y0);
       const sway1=Math.sin(phase)*5+side*i;
       const sway2=Math.sin(phase+1.7)*8-side*i;
       o.bezierCurveTo(x0+side*(9+sway1),43,x1-side*(9-sway2),83,x1,y1);
       o.strokeStyle=`rgba(38,220,196,${.035+i*.014})`;
       o.lineWidth=6-i*1.1;o.shadowColor='rgba(24,220,197,.26)';o.shadowBlur=8+i*2;o.stroke();
     }
   }
   // Small pre-rendered haze patches around the threshold.
   for(let i=0;i<3;i++){
     const x=64+Math.sin(t*1.2+i*2.1)*5;
     const y=64+(i-1)*30+Math.cos(t+i)*3;
     const g=o.createRadialGradient(x,y,1,x,y,25+i*8);
     g.addColorStop(0,`rgba(43,228,204,${.10-i*.018})`);g.addColorStop(1,'rgba(43,228,204,0)');
     o.fillStyle=g;o.fillRect(x-35,y-25,70,50);
   }
   // Golden sparks are also baked into each frame.
   const sparks=[[-40,-24,0],[-29,11,.8],[-20,35,1.7],[-7,45,2.6],[18,38,1.1],[29,20,2.1],[38,1,.4],[31,-27,2.9],[15,-44,1.8],[-14,-41,.7],[-32,-36,2.3]];
   sparks.forEach(([sx,sy,phase],i)=>{
     const driftX=Math.sin(t*(.9+(i%3)*.12)+phase)*4;
     const driftY=Math.cos(t*(.8+(i%2)*.14)+phase)*3;
     const x=64+sx+driftX,y=64+sy+driftY;
     const twinkle=.35+.65*(.5+.5*Math.sin(t*2.7+phase));
     const r=1.15+(i%3)*.38;
     o.globalAlpha=twinkle;o.fillStyle='#e7bd3b';o.shadowColor='rgba(255,202,61,.85)';o.shadowBlur=5;
     o.beginPath();o.arc(x,y,r,0,Math.PI*2);o.fill();
     if(i%3===0){o.globalAlpha=twinkle*.65;o.fillRect(x-.5,y-4,x+1-(x),8);o.fillRect(x-4,y-.5,8,1)}
   });
   o.restore();frames.push(oc);
 }
 exitEffectFrames=frames;
}
function drawExitSmoke(){
 if(!roomCleared)return;
 if(!exitEffectFrames.length)buildExitEffectFrames();
 const d=exitDoorRect();
 const frame=Math.floor(frameNow/1000*EXIT_EFFECT_FPS)%EXIT_EFFECT_FRAME_COUNT;
 // Effect extends beyond the doorway while remaining centred on the actual door.
 const ew=Math.max(64,d.w*3.6),eh=Math.max(88,d.h*1.55);
 ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.92;
 ctx.drawImage(exitEffectFrames[frame],d.x+d.w*.5-ew*.5,d.y+d.h*.5-eh*.5,ew,eh);
 ctx.restore();
}
function drawExit(){
 // Invisible until the room is cleared. The right-wall PNG supplies the actual doorway.
 if(!roomCleared)return;
 drawExitSmoke();
}
function startRoomTransition(nextRoom){
 if(roomTransition)return; AUDIO.transition();
 const nextVariation=(nextRoom*37+area*101)%997;
 const nextName=ROOM_ARCHETYPES[(nextVariation+nextRoom*3+area)%ROOM_ARCHETYPES.length];
 roomTransition={timer:0,duration:.95,switchAt:.38,nextRoom,roomName:nextName,switched:false};
 msg(`ENTERING ${nextName}`);
}

function drawShop(){
 ctx.fillStyle='#02090ae8';ctx.fillRect(10,45,W-20,H-70);
 panel(25,62,W-50,370);
 text(`${areaName} COMPLETE`,W/2,92,18,P.teal2,'center');text(`PURSE  ${gold} GOLD`,W/2,115,10,P.gold2,'center');text('PERMANENT UPGRADES',W/2,136,8,P.cream,'center');
 panel(48,150,264,54);text('SWORD DAMAGE',60,170,9,P.cream);text('+5',60,190,13,P.teal2);text('100 G',292,186,10,P.gold2,'right');
 panel(48,212,264,54);text('MAX HEALTH',60,232,9,P.cream);text('+10  •  FULL HEAL',60,251,10,P.teal2);text('75 G',292,248,10,P.gold2,'right');
 panel(48,274,264,54);text('FORTUNE',60,294,9,P.cream);text(`BETTER LOOT  •  LV ${fortuneLevel}`,60,313,9,P.teal2);text('125 G',292,310,10,P.gold2,'right');
 panel(48,342,264,50);text('CONTINUE',W/2,373,12,P.teal2,'center');text('TAP AN UPGRADE • TAP CONTINUE WHEN READY',W/2,418,7,'#78918a','center');
 const guardian=enemies.find(e=>e.type==='boss');if(guardian){const minD=guardian.r+player.r+6,dx=player.x-guardian.x,dy=player.y-guardian.y,d=Math.hypot(dx,dy);if(d>0&&d<minD){player.x=guardian.x+dx/d*minD;player.y=guardian.y+dy/d*minD;}}if(fireHeld)performSwing();
}

function formatSpeed(cooldown){return `${(1/cooldown).toFixed(1)}/s`}
function compareArrow(a,b,lowerBetter=false){const d=a-b;const good=lowerBetter?-d:d;if(Math.abs(d)<.005)return '—';return good>0?'▲':'▼'}
function weaponCardHTML(w){const cur=playerWeapon();const cs=currentWeaponStats();const ws=weaponStatLines(w);const damageDiff=ws.damage+player.damageBonus-cs.damage;const reachDiff=ws.reach-cs.reach;const speedDiff=(1/ws.cooldown)-(1/cs.cooldown);const knockDiff=ws.knockback-cs.knockback;return `<div class="weaponCompare"><div class="weaponCol current"><div class="smallTitle">CURRENT</div><div class="weaponName">${cur.icon} ${cur.name}</div><div class="rarity ${rarityClass(cur.rarity)}">${cur.rarity}</div><div class="weaponStat">DAMAGE <b>${cs.damage}</b></div><div class="weaponStat">REACH <b>${cs.reach}</b></div><div class="weaponStat">SPEED <b>${formatSpeed(cs.cooldown)}</b></div><div class="weaponStat">KNOCKBACK <b>${cs.knockback.toFixed(2)}×</b></div></div><div class="compareMid"><div>${compareArrow(damageDiff,0)} </div><div>${compareArrow(reachDiff,0)} </div><div>${compareArrow(speedDiff,0)} </div><div>${compareArrow(knockDiff,0)} </div></div><div class="weaponCol found"><div class="smallTitle">FOUND</div><div class="weaponName">${w.icon} ${w.name}</div><div class="rarity ${rarityClass(w.rarity)}">${w.rarity}</div><div class="weaponStat">DAMAGE <b>${w.damage+player.damageBonus}</b></div><div class="weaponStat">REACH <b>${w.reach}</b></div><div class="weaponStat">SPEED <b>${formatSpeed(w.cooldown)}</b></div><div class="weaponStat">KNOCKBACK <b>${w.knockback.toFixed(2)}×</b></div></div></div>`}
function openWeaponPrompt(){const overlay=document.getElementById('weaponScreen');if(!overlay)return;overlay.classList.remove('burning');const w=weaponFinds[pendingWeaponIndex];if(!w){finishWeaponFinds();return;}document.getElementById('weaponTitle').textContent='WEAPON FOUND';document.getElementById('weaponSub').textContent=`You found this on your adventure — ${pendingWeaponIndex+1} of ${weaponFinds.length}`;document.getElementById('weaponCard').innerHTML=weaponCardHTML(w);document.getElementById('equipWeapon').textContent=`EQUIP ${w.name.toUpperCase()}`;document.getElementById('keepWeapon').textContent='KEEP CURRENT';overlay.classList.add('show');}
function finishWeaponFinds(){weaponFinds=[];pendingWeaponIndex=0;weaponPromptOpen=false;weaponBurning=false;const overlay=document.getElementById('weaponScreen');if(overlay)overlay.classList.remove('show');startRoomTransition(room+1);}
function advanceWeaponFind(){pendingWeaponIndex++;if(pendingWeaponIndex>=weaponFinds.length)finishWeaponFinds();else openWeaponPrompt()}
function discardCurrentFind(){weaponBurning=true;const w=weaponFinds[pendingWeaponIndex];const overlay=document.getElementById('weaponScreen');if(overlay){overlay.classList.add('burning');document.getElementById('weaponTitle').textContent='THROWN INTO THE FIRE';}showPickup(`🔥 ${w.name} thrown into the fire`);setTimeout(()=>{weaponBurning=false;advanceWeaponFind()},240)}
function equipFoundWeapon(){const w=weaponFinds[pendingWeaponIndex];player.weapon=w;player.damage=currentWeaponStats().damage;swingCooldown=0;weaponBurning=true;const overlay=document.getElementById('weaponScreen');if(overlay){overlay.classList.add('burning');document.getElementById('weaponTitle').textContent='OLD WEAPON BURNED';}showPickup(`⚔ ${w.name} equipped — old weapon to the fire`);setTimeout(()=>{weaponBurning=false;advanceWeaponFind()},240)}
function handleWeaponDecision(equip){if(!weaponPromptOpen||weaponBurning)return;if(equip)equipFoundWeapon();else discardCurrentFind();}
function inventoryStatsHTML(){
 const w=playerWeapon(),s=currentWeaponStats();
 const hpPct=Math.max(0,Math.min(100,player.hp/player.maxHp*100));
 const xpPct=Math.max(0,Math.min(100,xp/xpNeed*100));
 return `<div class="invOverview">
   <div class="invStat"><span>HEALTH</span><b>${Math.ceil(player.hp)} / ${player.maxHp}</b><i><em style="width:${hpPct}%"></em></i></div>
   <div class="invStat"><span>XP / LEVEL</span><b>LV ${level}  •  ${xp} / ${xpNeed} XP</b><i><em style="width:${xpPct}%"></em></i></div>
   <div class="invStat purseInv"><span>PURSE</span><b>${gold} GOLD</b></div>
 </div>
 <div class="invSectionTitle">EQUIPPED WEAPON</div>
 <div class="invWeapon">
   <div class="invWeaponIcon">⚔</div>
   <div class="invWeaponMain"><strong>${w.name}</strong><small class="rarity ${rarityClass(w.rarity)}">${w.rarity.toUpperCase()}</small></div>
   <div class="invWeaponStats"><span>DAMAGE <b>${s.damage}</b></span><span>REACH <b>${s.reach}</b></span><span>SPEED <b>${formatSpeed(s.cooldown)}</b></span><span>KNOCKBACK <b>${s.knockback.toFixed(2)}×</b></span></div>
 </div>
 <div class="invSectionTitle">EQUIPMENT</div>
 <div class="invLocked"><span>ARMOUR</span><b>— EMPTY —</b><small>Armour slots will be added to the dungeon.</small></div>
 <div class="invSectionTitle">RUN</div>
 <div class="invRunGrid"><span>AREA <b>${area} • ${areaName}</b></span><span>ROOM <b>${isBossRoom()?'GUARDIAN':room}</b></span><span>ENEMIES <b>${kills}</b></span><span>ROOMS CLEARED <b>${roomsCleared}</b></span></div>`;
}
function updateInventoryPanel(){const el=document.getElementById('inventoryContent');if(el)el.innerHTML=inventoryStatsHTML()}
function openInventory(){if(!started||gameOver||atShop||weaponPromptOpen)return;paused=true;updateInventoryPanel();document.getElementById('inventoryScreen').classList.add('show');msg('GAME PAUSED  •  INVENTORY OPEN')}
function closeInventory(){document.getElementById('inventoryScreen').classList.remove('show');paused=false;msg(roomCleared?'ROOM CLEARED  •  WALK TO EXIT »':`AREA ${area} • ${areaName} — ROOM ${room} • CLEAR THE ROOM`)}
function renderScoreboard(){const list=document.getElementById('scoreList');if(!list)return;const rows=highScores.length?highScores.map((r,i)=>`<div class="scoreRow"><span>#${i+1}</span><b>${r.score}</b><span>R${r.room} • LV${r.level}</span><span>${r.kills}K</span></div>`).join(''):`<div class="emptyScores">NO RUNS RECORDED YET</div>`;list.innerHTML=rows;}
function openScoreboard(){if(started)return;renderScoreboard();document.getElementById('scoreboardScreen').classList.add('show');startScreen.classList.add('menuHidden');}
function closeScoreboard(){document.getElementById('scoreboardScreen').classList.remove('show');startScreen.classList.remove('menuHidden');}
function exitApp(){try{window.close()}catch(e){};setTimeout(()=>{try{history.back()}catch(e){}},80);setTimeout(()=>{if(document.visibilityState==='visible')msg('EXIT — close the app from Android to leave the game')},180);}
function draw(){
 ctx.clearRect(0,0,W,H);
 const shake=!gameOver&&player.hitTimer>0?(player.hitTimer/.24)*2.2:0; if(shake){ctx.save();ctx.translate((Math.random()*2-1)*shake,(Math.random()*2-1)*shake)}
 drawDungeon();
 if(!atShop)drawExit();
 drawDeathMarks();
 drawImpactMarks();
 loot.forEach(drawLoot);
 projectiles.forEach(drawProjectile);
 entrances.forEach(drawEntrance);
 enemies.forEach((e,i)=>drawEnemy(e,i));drawPlayer();
 drawFacingArrow();
 slashes.forEach(drawSlash);
 particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/.45);let col=p.type==='coin'?P.gold2:(p.type==='heal'?P.teal2:(p.type==='weapon'?P.gold2:(p.type==='hit'?P.cream:(p.type==='spawn'?(p.spawnType==='goblin'?P.green:p.spawnType==='skeleton'?'#a57b4c':P.cream):P.gold))));pixelRect(p.x,p.y,4,4,col);ctx.globalAlpha=1});
 if(atShop)drawShop();
 if(player.hp>0&&player.hp/player.maxHp<=.25&&!gameOver){const p=.12+.08*(.5+.5*Math.sin(frameNow/180));ctx.fillStyle='#8f3036';ctx.globalAlpha=p;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
 if(roomTransition){
  const t=roomTransition.timer,fadeOut=Math.min(1,t/.38),fadeIn=Math.min(1,Math.max(0,(t-.38)/.57));
  const alpha=roomTransition.switched?1-fadeIn:fadeOut;
  ctx.fillStyle='#02090af2';ctx.globalAlpha=Math.max(0,Math.min(1,alpha));ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
  if(roomTransition.switched&&fadeIn>.15){ctx.globalAlpha=Math.min(1,(fadeIn-.15)/.45);text(roomTransition.roomName,W/2,215,17,P.teal2,'center');text(`ROOM ${roomTransition.nextRoom}`,W/2,240,9,P.cream,'center');ctx.globalAlpha=1;}
 }
 if(gameOver){ctx.fillStyle='#02090af2';ctx.fillRect(0,0,W,H);panel(24,74,W-48,320);text('GAME OVER',W/2,106,27,P.cream,'center');text(`FINAL SCORE  ${score}`,W/2,134,16,P.gold2,'center');const rank=scoreRank();text(rank===1?'NEW HIGH SCORE!':rank?`HIGH SCORE RANK  #${rank}`:'',W/2,154,8,P.red2,'center');text(`REACHED  ${isBossRoom()?'GUARDIAN':`ROOM ${room}`}`,W/2,181,9,P.teal2,'center');text(`LEVEL ${level}  •  GOLD ${totalGoldCollected}`,W/2,202,9,P.gold2,'center');text(`ENEMIES DEFEATED  ${kills}`,W/2,223,9,P.cream,'center');text(`ROOMS CLEARED  ${roomsCleared}`,W/2,244,9,P.cream,'center');text('BEST RUNS',W/2,272,9,P.teal2,'center');for(let i=0;i<Math.min(3,highScores.length);i++){const r=highScores[i];text(`${i+1}.  ${r.score}`,W/2,291+i*16,8,P.cream,'center')}panel(W/2-82,340,164,34);text('MAIN MENU',W/2,362,10,P.teal2,'center')}
 if(shake)ctx.restore();
}
let frameNow=0;
function loop(t){frameNow=t;const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}

player.weapon=weaponInstance('shortSword','Common');player.damage=playerWeapon().damage;
resetRoom();
buildExitEffectFrames();
const startScreen=document.getElementById('startScreen');
const splashScreen=document.getElementById('splashScreen');
const playButton=document.getElementById('playButton');
const scoreboardButton=document.getElementById('scoreboardButton');
const scoreboardBack=document.getElementById('scoreboardBack');
const exitAppButton=document.getElementById('exitAppButton');
const versionLabel=document.getElementById('versionLabel'); if(versionLabel)versionLabel.textContent='v'+VERSION;
const weaponScreen=document.getElementById('weaponScreen');
const equipWeapon=document.getElementById('equipWeapon');
const keepWeapon=document.getElementById('keepWeapon');
const inventoryButton=document.getElementById('inventoryButton');
const inventoryScreen=document.getElementById('inventoryScreen');
const inventoryClose=document.getElementById('inventoryClose');
const inventoryCloseBottom=document.getElementById('inventoryCloseBottom');
startScreen.style.display='none';
// Keep the menu underneath the splash during its fade so there is never a frame of the dungeon showing between them.
setTimeout(()=>{startScreen.style.display='flex';splashScreen.classList.add('done');setTimeout(()=>{splashScreen.style.display='none';msg('PRESS PLAY TO ENTER THE DUNGEON')},220)},1800);
playButton.addEventListener('pointerdown',e=>{e.preventDefault();AUDIO.menu();if(started)return;closeScoreboard();startNewRun();msg('AREA 1 • CASTLE — ROOM 1 • CLEAR THE ROOM')});
scoreboardButton.addEventListener('pointerdown',e=>{e.preventDefault();AUDIO.menu();openScoreboard()});
scoreboardBack.addEventListener('pointerdown',e=>{e.preventDefault();AUDIO.menu();closeScoreboard()});
exitAppButton.addEventListener('pointerdown',e=>{e.preventDefault();AUDIO.menu();exitApp()});
equipWeapon.addEventListener('pointerdown',e=>{e.preventDefault();AUDIO.menu();handleWeaponDecision(true)});
keepWeapon.addEventListener('pointerdown',e=>{e.preventDefault();AUDIO.menu();handleWeaponDecision(false)});
inventoryButton.addEventListener('pointerdown',e=>{e.preventDefault();AUDIO.menu();openInventory()});
inventoryClose.addEventListener('pointerdown',e=>{e.preventDefault();AUDIO.menu();closeInventory()});
inventoryCloseBottom.addEventListener('pointerdown',e=>{e.preventDefault();AUDIO.menu();closeInventory()});
requestAnimationFrame(loop);
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.code==='Space'&&!gameOver)fireHeld=true});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(e.code==='Space')fireHeld=false});
function startNewRun(){AUDIO.start();started=true;paused=false;startScreen.style.display='none';gameOver=false;area=1;areaName='CASTLE';room=1;kills=0;gold=0;score=0;xp=0;level=1;xpNeed=12;roomsCleared=0;totalGoldCollected=0;scoreSaved=false;fortuneLevel=0;roomTransition=null;atShop=false;areaComplete=false;player.hp=100;player.maxHp=100;player.damageBonus=0;player.weapon=weaponInstance('shortSword','Common');player.damage=playerWeapon().damage;weaponFinds=[];pendingWeaponIndex=0;weaponPromptOpen=false;weaponBurning=false;player.hitTimer=0;player.hitCooldown=0;player.knockX=0;player.knockY=0;nextSwingSide=1;swingCooldown=0;fireHeld=false;joy.active=false;joy.x=joy.y=0;resetRoom()}
function returnToTitle(){AUDIO.stop();gameOver=false;paused=false;started=false;atShop=false;areaComplete=false;weaponPromptOpen=false;weaponBurning=false;weaponFinds=[];fireHeld=false;joy.active=false;joy.x=joy.y=0;startScreen.style.display='flex';document.getElementById('inventoryScreen')?.classList.remove('show');setBossWarning('');msg('PRESS PLAY TO ENTER THE DUNGEON')}

const stick=document.getElementById('stick'),nub=document.getElementById('nub');
function joyMove(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,m=Math.min(45,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);joy.x=Math.cos(a)*m/45;joy.y=Math.sin(a)*m/45;nub.style.transform=`translate(${joy.x*45}px,${joy.y*45}px)`}
stick.addEventListener('pointerdown',e=>{if(paused)return;joy.active=true;stick.setPointerCapture(e.pointerId);joyMove(e)});stick.addEventListener('pointermove',e=>{if(joy.active)joyMove(e)});stick.addEventListener('pointerup',()=>{joy.active=false;joy.x=joy.y=0;nub.style.transform='translate(0,0)'});stick.addEventListener('pointercancel',()=>{joy.active=false;joy.x=joy.y=0;nub.style.transform='translate(0,0)'});
const f=document.getElementById('fire');f.addEventListener('pointerdown',()=>{if(gameOver||paused)return;if(atShop)return;performSwing();fireHeld=true});f.addEventListener('pointerup',()=>fireHeld=false);f.addEventListener('pointercancel',()=>fireHeld=false);
c.addEventListener('pointerdown',e=>{
 const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*(W/r.width),y=(e.clientY-r.top)*(H/r.height);
 if(gameOver){if(x>=W/2-90&&x<=W/2+90&&y>=334&&y<=378)returnToTitle();return;}
 if(!atShop||weaponPromptOpen)return;
 if(x>=48&&x<=312&&y>=150&&y<=204)buyUpgrade('damage');else if(x>=48&&x<=312&&y>=212&&y<=266)buyUpgrade('health');else if(x>=48&&x<=312&&y>=274&&y<=328)buyUpgrade('fortune');else if(x>=48&&x<=312&&y>=342&&y<=392)continueFromShop();
});
if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('portrait').catch(()=>{});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
