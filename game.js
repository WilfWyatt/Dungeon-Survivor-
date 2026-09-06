const c=document.getElementById('game'),ctx=c.getContext('2d');
const characterSprites=new Image();
let characterSpritesReady=false;
characterSprites.onload=()=>{characterSpritesReady=true};
characterSprites.src='player-sprites.png';
const enemySprites=new Image();
let enemySpritesReady=false;
enemySprites.onload=()=>{enemySpritesReady=true};
enemySprites.src='enemy-sprites.png';


/* --------------------------------------------------------------------------
 * ROOM ENVIRONMENT
 * --------------------------------------------------------------------------
 * The environment is deliberately self-contained.  It owns only the room
 * floor, architectural walls and authored props.  Gameplay entities never
 * depend on the environment renderer, so a missing image can never stop the
 * update loop.
 */

const TILE = 32;
const COLS = 8;
const ROWS = 12;
const ROOM_X = 52;
const ROOM_TOP = 50;
const ROOM_BOTTOM = ROOM_TOP + ROWS * TILE;
const ROOM_W = COLS * TILE;
const ROOM_H = ROWS * TILE;

const FLOOR_FILES = [
  'floor-clean-1.png', 'floor-clean-2.png', 'floor-clean-3.png', 'floor-clean-4.png',
  'floor-debris-1.png', 'floor-debris-2.png', 'floor-debris-3.png', 'floor-debris-4.png',
  'floor-moss-1.png', 'floor-moss-2.png', 'floor-moss-3.png', 'floor-moss-4.png'
];

function loadImage(src) {
  const image = new Image();
  image.decoding = 'async';
  image.ready = false;
  image.onload = () => { image.ready = true; };
  image.onerror = () => { image.ready = false; };
  image.src = src;
  return image;
}

const floorTiles = FLOOR_FILES.map(file => loadImage(file));

const WALL_FILES = {
  top: [
    'walls/top/top-wall-clean-1.png',
    'walls/top/top-wall-clean-2.png',
    'walls/top/top-wall-clean-3.png',
    'walls/top/top-wall-cracked-1.png',
    'walls/top/top-wall-cracked-2.png',
    'walls/top/top-wall-cracked-3.png',
    'walls/top/top-wall-mossy-1.png',
    'walls/top/top-wall-mossy-2.png',
    'walls/top/top-wall-mossy-3.png'
  ],
  left: 'walls/left/left-wall-clean.png',
  right: 'walls/right/right-wall-clean.png',
  bottom: 'walls/bottom/bottom-wall-clean.png'
};

const wallImages = {
  top: WALL_FILES.top.map(loadImage),
  left: loadImage(WALL_FILES.left),
  right: loadImage(WALL_FILES.right),
  bottom: loadImage(WALL_FILES.bottom)
};

const PROP_FILES = {
  torch1: 'assets/props/torch-1.png',
  torch2: 'assets/props/torch-2.png',
  torch3: 'assets/props/torch-3.png',
  torch4: 'assets/props/torch-4.png',
  chestClosed: 'assets/props/chest-closed.png',
  chestOpen: 'assets/props/chest-open.png',
  crate1: 'assets/props/crate-1.png',
  crateStack: 'assets/props/crate-stack.png',
  barrel: 'assets/props/barrel.png',
  pottery: 'assets/props/pottery.png',
  ruinedPillar: 'assets/props/ruined-pillar.png',
  rubble: 'assets/props/rubble.png',
  statue: 'assets/props/statue.png'
};

const propImages = Object.fromEntries(
  Object.entries(PROP_FILES).map(([name, file]) => [name, loadImage(file)])
);

const DECOR_POOL = [
  'chestClosed', 'chestOpen', 'crate1', 'crateStack',
  'barrel', 'pottery', 'ruinedPillar', 'rubble', 'statue'
];

const TORCH_SLOTS = [
  { x: 72, y: 88 },
  { x: 288, y: 88 },
  { x: 72, y: 122 },
  { x: 288, y: 122 }
];

const PROP_SLOTS = [
  { x: 108, y: 102 }, { x: 180, y: 102 }, { x: 252, y: 102 },
  { x: 72, y: 190 }, { x: 288, y: 190 },
  { x: 72, y: 282 }, { x: 288, y: 282 },
  { x: 72, y: 374 }, { x: 288, y: 374 }
];

let roomTiles = [];
let roomDecor = [];

function roomRandom(offset = 0) {
  const seed = area * 1009 + room * 131 + roomVariation * 17 + offset;
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function makeRoomLayout() {
  const archetype = roomArchetype();

  roomTiles = Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) => {
      const roll = roomRandom(y * COLS + x);
      let family = 0;

      if (archetype === 'RUINED CHAMBER') {
        family = roll < 0.24 ? 2 : roll < 0.52 ? 1 : 0;
      } else if (archetype === 'CHAPEL') {
        family = roll < 0.12 ? 2 : roll < 0.28 ? 1 : 0;
      } else if (archetype === 'PILLARED HALL') {
        family = roll < 0.09 ? 2 : roll < 0.22 ? 1 : 0;
      } else {
        family = roll < 0.10 ? 2 : roll < 0.25 ? 1 : 0;
      }

      const variant = Math.floor(roomRandom(100 + y * COLS + x) * 4);
      return family * 4 + variant;
    })
  );

  // Keep the middle of the room visually clean and combat-friendly.
  const centre = Math.floor(COLS / 2);
  for (let y = 2; y < ROWS - 2; y++) {
    if (roomTiles[y][centre] >= 4 && roomTiles[y][centre] < 8) {
      roomTiles[y][centre] -= 4;
    }
  }

  const placed = [];
  const occupied = new Set();

  const addProp = (kind, x, y, torch = false) => {
    const key = `${x}:${y}`;
    if (occupied.has(key)) return false;
    if (!torch && y > ROOM_BOTTOM - 55) return false;
    if (!torch && Math.abs(x - W / 2) < 55 && y > ROOM_TOP + 55) return false;
    if (x < ROOM_X + 16 || x > ROOM_X + ROOM_W - 16) return false;
    if (y < ROOM_TOP + 16 || y > ROOM_BOTTOM - 16) return false;

    occupied.add(key);
    placed.push({ kind, x, y, torch });
    return true;
  };

  // Every room gets 2–4 authored torches, kept away from the doors.
  const torchCount = 2 + Math.floor(roomRandom(401) * 3);
  const torchOrder = TORCH_SLOTS
    .map((slot, index) => ({ slot, order: roomRandom(410 + index) }))
    .sort((a, b) => a.order - b.order);

  for (let i = 0; i < torchCount; i++) {
    const slot = torchOrder[i].slot;
    const kind = `torch${1 + Math.floor(roomRandom(420 + i) * 4)}`;
    addProp(kind, slot.x, slot.y, true);
  }

  // Add 3–5 non-torch props, biased to the upper/side edges.
  const propCount = 3 + Math.floor(roomRandom(600) * 3);
  const propOrder = PROP_SLOTS
    .map((slot, index) => ({ slot, order: roomRandom(500 + index) }))
    .sort((a, b) => a.order - b.order);

  let added = 0;
  for (let i = 0; i < propOrder.length && added < propCount; i++) {
    const kind = DECOR_POOL[Math.floor(roomRandom(610 + i) * DECOR_POOL.length)];
    if (addProp(kind, propOrder[i].slot.x, propOrder[i].slot.y)) added++;
  }

  roomDecor = placed;
}

function drawFloor() {
  ctx.fillStyle = '#0b191c';
  ctx.fillRect(ROOM_X, ROOM_TOP, ROOM_W, ROOM_H);
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const index = roomTiles[y]?.[x] ?? 0;
      const tile = floorTiles[index];
      const dx = ROOM_X + x * TILE;
      const dy = ROOM_TOP + y * TILE;

      if (tile?.ready && tile.naturalWidth >= 32 && tile.naturalHeight >= 32) {
        ctx.drawImage(tile, 0, 0, 32, 32, dx, dy, TILE, TILE);
      } else {
        // Safe visual fallback while an image is loading/missing.
        ctx.fillStyle = '#15282b';
        ctx.fillRect(dx, dy, TILE, TILE);
        ctx.fillStyle = '#203638';
        ctx.fillRect(dx + 1, dy + 1, TILE - 2, 2);
        ctx.fillRect(dx + 1, dy + TILE - 3, TILE - 2, 2);
      }
    }
  }
}

function drawWallImage(image, x, y, width, height) {
  if (!image?.ready) return false;
  ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, x, y, width, height);
  return true;
}

function drawWalls() {
  const archetype = roomArchetype();
  const variant = (roomVariation + room + area) % 3;
  let topSet = wallImages.top.slice(0, 3);

  if (archetype === 'RUINED CHAMBER') topSet = wallImages.top.slice(3, 6);
  else if (variant === 2) topSet = wallImages.top.slice(6, 9);

  const top = topSet[variant];
  const topDrawn = drawWallImage(top, 0, 0, W, ROOM_TOP);
  const leftDrawn = drawWallImage(wallImages.left, 0, 0, ROOM_X, H);
  const rightDrawn = drawWallImage(wallImages.right, W - ROOM_X, 0, ROOM_X, H);
  const bottomDrawn = drawWallImage(wallImages.bottom, 0, ROOM_BOTTOM, W, H - ROOM_BOTTOM);

  // Never leave a completely empty room edge if an asset is unavailable.
  ctx.fillStyle = '#13282b';
  if (!topDrawn) ctx.fillRect(0, 0, W, ROOM_TOP);
  if (!leftDrawn) ctx.fillRect(0, 0, ROOM_X, H);
  if (!rightDrawn) ctx.fillRect(W - ROOM_X, 0, ROOM_X, H);
  if (!bottomDrawn) ctx.fillRect(0, ROOM_BOTTOM, W, H - ROOM_BOTTOM);
}

function drawProps() {
  ctx.imageSmoothingEnabled = false;

  for (const prop of roomDecor) {
    const image = propImages[prop.kind];
    if (!image?.ready) continue;
    ctx.drawImage(image, Math.round(prop.x - 16), Math.round(prop.y - 16), 32, 32);
  }
}

function drawTorchLight() {
  const now = performance.now() * 0.004;

  for (const torch of roomDecor) {
    if (!torch.torch) continue;

    const pulse = 0.14 + 0.035 * Math.sin(now + torch.x * 0.03);
    const glow = ctx.createRadialGradient(
      torch.x, torch.y - 8, 2,
      torch.x, torch.y - 8, 42
    );
    glow.addColorStop(0, `rgba(255, 154, 58, ${pulse})`);
    glow.addColorStop(1, 'rgba(255, 120, 30, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(torch.x - 44, torch.y - 52, 88, 88);
  }
}

function drawRoomEnvironment() {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  drawFloor();
  drawWalls();
  drawProps();
  drawTorchLight();
  ctx.restore();
}

let W=360,H=480,dpr=1,last=0,room=1,kills=0,gold=0,score=0,gameOver=false,roomCleared=false,xp=0,level=1,xpNeed=12,started=false,roomsCleared=0,totalGoldCollected=0,walkTime=0,scoreSaved=false,areaClearTimer=0,areaClearShown=false,roomVariation=0;
const VERSION='0.2.5g';
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
function weightedRarity(){let total=RARITIES.reduce((a,r)=>a+r.weight,0),roll=Math.random()*total;for(const r of RARITIES){roll-=r.weight;if(roll<0)return r.name}return 'Common'}
function randomWeaponDrop(){const ids=['shortSword','longSword','claymore'];return weaponInstance(ids[Math.floor(Math.random()*ids.length)],weightedRarity())}
function rarityClass(r){return String(r||'Common').toLowerCase()}
function weaponStatLines(w){return {damage:w.damage,reach:w.reach,cooldown:w.cooldown,knockback:w.knockback}}
let enemies=[],loot=[],slashes=[],deathMarks=[],particles=[],projectiles=[],entrances=[],keys={},joy={x:0,y:0,active:false},fireHeld=false;
let spawnQueue=[],spawnTimer=0,totalSpawned=0,totalQuota=0,activeCap=0,activeGoblinCap=0,bossPatternTimer=0,bossPatternStep=0,bossPatternMode='burst';
const ROOM_PLAN={1:{cap:5,total:10,weights:[['bat',.80],['goblin',.10],['skeleton',.10]]},2:{cap:6,total:12,weights:[['bat',.70],['goblin',.15],['skeleton',.15]]},3:{cap:7,total:14,weights:[['bat',.60],['goblin',.20],['skeleton',.20]]},4:{cap:8,total:17,weights:[['bat',.50],['goblin',.25],['skeleton',.25]]},5:{cap:10,total:20,weights:[['bat',.40],['goblin',.30],['skeleton',.30]]},6:{cap:12,total:22,weights:[['bat',1/3],['goblin',1/3],['skeleton',1/3]]}};
let shopMessage='',bossWarningType='',bossWarningTimer=0,paused=false;
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
const SCORE_VALUES={bat:50,goblin:75,skeleton:100,boss:1000};
let highScores=[];
try{highScores=JSON.parse(localStorage.getItem('dungeonSurvivorHighScores')||'[]');if(!Array.isArray(highScores))highScores=[]}catch(e){highScores=[]}
function addScore(amount){score=Math.max(0,score+amount)}
function saveHighScore(){if(scoreSaved)return;scoreSaved=true;highScores.push({score,room,level,gold:totalGoldCollected,kills,area});highScores.sort((a,b)=>b.score-a.score);highScores=highScores.slice(0,5);try{localStorage.setItem('dungeonSurvivorHighScores',JSON.stringify(highScores))}catch(e){}}
function scoreRank(){const i=highScores.findIndex(r=>r.score===score&&r.level===level&&r.kills===kills&&r.gold===totalGoldCollected);return i>=0?i+1:0}
function finishGameOver(){if(gameOver)return;gameOver=true;player.hitTimer=0;player.hitCooldown=0;player.knockX=0;player.knockY=0;saveHighScore();msg('RUN ENDED — choose an option')}
function enemyScale(){return (1+(area-1)*.18)*(1+(level-1)*.075)}
function enemyDamageScale(){return 1+(area-1)*.12+(level-1)*.045}
function scaledPotionHeal(){return Math.min(player.maxHp,18+(area-1)*3+Math.floor((level-1)*1.5))}
function scaledGoldAmount(enemyType){const typeBonus=enemyType==='skeleton'?2:enemyType==='goblin'?1:0;const base=1+Math.floor(Math.random()*5);return Math.min(14,base+Math.max(0,area-1)+Math.floor((level-1)/3)+typeBonus)}
function bossGoldReward(){return 30+area*12+level*3}
let nextSwingSide=1, swingCooldown=0, facing=0, facingDir='right';
const GOBLIN_CAPS={1:2,2:3,3:4,4:5,5:6,6:6};
const P={ink:'#061316',deep:'#0a1c20',wall:'#172d31',wall2:'#234247',stone:'#29494a',moss:'#3f6d43',vine:'#2f603c',teal:'#52d8c0',teal2:'#83f0d7',cream:'#d8d4bd',gold:'#e5b94d',gold2:'#ffd86a',red:'#c95159',red2:'#ed6a70',blue:'#5fa9c7',green:'#4dbb88'};

function fitGameFrame(){const frame=document.getElementById('gameFrame'),top=document.getElementById('topUI'),controls=document.getElementById('controls');if(!frame||!top||!controls)return;const gaps=8;const safe=12;const maxH=Math.max(300,Math.min(480,innerHeight-top.offsetHeight-controls.offsetHeight-gaps-safe));const maxW=Math.max(240,Math.min(360,innerWidth-24));const h=Math.min(maxH,maxW/.75);frame.style.width=Math.round(h*.75)+'px';frame.style.height=Math.round(h)+'px';c.style.width=frame.clientWidth+'px';c.style.height=frame.clientHeight+'px'}
function resize(){dpr=Math.min(devicePixelRatio||1,2);c.width=360*dpr;c.height=480*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);W=360;H=480;fitGameFrame()}
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
 player.x=64;player.y=H/2;player.hp=clamp(player.hp,0,player.maxHp);roomVariation=(room*37+area*101)%997;makeRoomLayout();player.flash=0;player.hitTimer=0;player.hitCooldown=0;player.knockX=0;player.knockY=0;
 enemies=[];loot=[];slashes=[];deathMarks=[];particles=[];projectiles=[];entrances=[];roomCleared=false;atShop=false;areaComplete=false;areaClearTimer=0;areaClearShown=false;bossWarningTimer=0;setBossWarning('');
 spawnQueue=[];spawnTimer=.35;totalSpawned=0;bossPatternTimer=1.1;bossPatternStep=0;bossPatternMode='burst';
 const isBoss=room===bossRoom;
 if(isBoss){
  totalQuota=1;activeCap=1;
  const hp=Math.round((650+area*100)*enemyScale());
  enemies.push({x:W-105,y:H/2,r:34*SPRITE_SCALE,type:'boss',hp,max:hp,active:true,speed:48+area*2,hit:0,boss:true,attackTimer:1.1,attackAge:0,swingHit:false,weapon:'shortSword',warning:'',warningTimer:0,patternActive:false});
  msg('BOSS ROOM — DEFEAT THE GUARDIAN');
 }else{
  const plan=ROOM_PLAN[room]||ROOM_PLAN[6];activeCap=plan.cap;activeGoblinCap=GOBLIN_CAPS[room]||6;totalQuota=plan.total;
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
 const type=spawnQueue.splice(pick,1)[0];totalSpawned++;
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
function beginAreaShop(){
 atShop=true;areaComplete=true;shopMessage=`${areaName} COMPLETE — spend your gold before the next area.`;
 msg('AREA COMPLETE — CHOOSE YOUR UPGRADES');
}
function buyUpgrade(type){
 if(!atShop)return;
 if(type==='damage'){
  const cost=100;
  if(gold<cost){showPickup('Not enough gold for +5 DAMAGE');return}
  gold-=cost;player.damageBonus+=5;player.damage=currentWeaponStats().damage;showPickup('+5 DAMAGE purchased');
 }else if(type==='health'){
  const cost=75;
  if(gold<cost){showPickup('Not enough gold for +10 MAX HP');return}
  gold-=cost;player.maxHp+=10;player.hp=player.maxHp;showPickup('+10 MAX HP — fully healed');
 }
 updateHud();
}
function continueFromShop(){
 if(!atShop)return;
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
 if(type==='Gold') showPickup(`🪙 ${amount} gold dropped — nearby gold is attracted to you`);
 else if(type==='Heart') showPickup('♥ RARE HEART — full heal!');
 else if(type==='Potion') showPickup('✚ RARE POTION — small heal');
 else showPickup(`⚔ ${weapon.name} — ${weapon.rarity} weapon found!`);
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
 if(levelled){showPickup(`★ LEVEL ${level}!  +5 MAX HP  +${bonusTotal} GOLD  +2 DAMAGE`);msg(`LEVEL UP!  You feel stronger.`);}
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
 swingCooldown=w.cooldown;
 slashes.push({age:0,duration:w.swingDuration,side,angle:facing,reach:w.reach,hit:new Set(),damage:currentWeaponStats().damage,weapon:w});
}

function damagePlayer(amount,sourceX,sourceY,knockbackScale=1,hitType='normal'){
 if(gameOver||player.hitCooldown>0)return false;
 const dx=player.x-sourceX,dy=player.y-sourceY,d=Math.hypot(dx,dy)||1;
 const strength=(18+amount*0.95)*knockbackScale;
 player.knockX=dx/d*strength;player.knockY=dy/d*strength;
 player.hp-=amount;player.flash=.16;player.hitTimer=.24;player.hitCooldown=.28;
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
 if(atShop||weaponPromptOpen){updateHud();return;}
 if(areaClearTimer>0)areaClearTimer=Math.max(0,areaClearTimer-dt);
 player.fire=Math.max(0,player.fire-dt);player.flash=Math.max(0,player.flash-dt);player.hitTimer=Math.max(0,player.hitTimer-dt);player.hitCooldown=Math.max(0,player.hitCooldown-dt);swingCooldown=Math.max(0,swingCooldown-dt);
 player.x+=player.knockX*dt;player.y+=player.knockY*dt;const knockDrag=Math.pow(.025,dt);player.knockX*=knockDrag;player.knockY*=knockDrag;
 let mx=(keys.d?1:0)-(keys.a?1:0),my=(keys.s?1:0)-(keys.w?1:0);
 const movingInput=joy.active||Math.hypot(mx,my)>.12;
 if(movingInput)walkTime+=dt*10;
 if(joy.active){mx=joy.x;my=joy.y}
 const l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}
 if(l>.12){facing=Math.atan2(my,mx);facingDir=dirFromAngle(facing)}
 player.x=clamp(player.x+mx*player.speed*dt,58,W-58);player.y=clamp(player.y+my*player.speed*dt,58,H-58);
 player.x=clamp(player.x,58,W-58);player.y=clamp(player.y,58,H-58);
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
   const strafe=Math.sin(performance.now()/820+e.orbitAngle)*.32;
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
    if(!e.batAttackHit&&Math.hypot(player.x-e.x,player.y-e.y)<e.r+player.r+10){damagePlayer(Math.round(11*enemyDamageScale()),e.x,e.y,.45,'normal');e.batAttackHit=true}
    if(e.batAttackAge<=0){e.batAttackCooldown=1.25+Math.random()*.7;e.batAttackHit=false}
   }else if(d>92){
    const weave=Math.sin(performance.now()/240+e.orbitAngle)*.28;
    e.x+=(Math.cos(a)+Math.cos(a+Math.PI/2)*weave)*e.speed*dt*moveScale;
    e.y+=(Math.sin(a)+Math.sin(a+Math.PI/2)*weave)*e.speed*dt*moveScale;
   }else{
    // Close bats orbit and subtly alter their tangent, steering the player away from their ideal escape line.
    e.orbitAngle+=dt*(1.15+Math.sin(performance.now()/700+e.orbitAngle)*.22);
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
   const orbitSign=Math.sin((performance.now()/1000)+room)>.0?1:-1;
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
     e.warning=bossPatternMode==='burst'?'fireball':'blast';e.warningTimer=.82;bossWarningTimer=e.warningTimer;setBossWarning(e.warning);
    }
   }
   if(e.patternActive&&bossPatternMode==='burst'&&bossPatternTimer<1.0){
    const n=5,gap=.16,idx=Math.floor(bossPatternTimer/gap);
    if(idx<n&&Math.abs(bossPatternTimer-idx*gap)<dt*1.2){const base=Math.atan2(player.y-e.y,player.x-e.x);shootProjectile(e.x,e.y,base+(idx-2)*.11,122,Math.round(14*enemyDamageScale()),'fireball');}
    bossPatternTimer+=dt;
    if(bossPatternTimer>=1.0){e.patternActive=false;e.attackTimer=3.2;}
   }else if(e.patternActive&&bossPatternMode==='spiral'&&bossPatternTimer<3.6){
    const idx=Math.floor(bossPatternTimer/.14),prev=Math.floor((bossPatternTimer-dt)/.14);
    if(idx!==prev){const pa=idx*.48;shootProjectile(e.x,e.y,pa,88,12,'fireblast');shootProjectile(e.x,e.y,pa+Math.PI,88,12,'fireblast');}
    bossPatternTimer+=dt;
    if(bossPatternTimer>=3.6){e.patternActive=false;e.attackTimer=5.4;}
   }
  }
  e.x=clamp(e.x,58,W-58);e.y=clamp(e.y,58,H-58);
  if(e.type!=='goblin'&&e.type!=='skeleton'&&d<e.r+player.r){damagePlayer(e.type==='boss'?Math.round(30*enemyDamageScale()):Math.round(22*enemyDamageScale()),e.x,e.y,e.type==='boss'?1.2:.55,'normal')}
  if(player.hp<=0){player.hp=0;finishGameOver()}
 }
 clampEnemySeparation();

 for(let i=projectiles.length-1;i>=0;i--){const q=projectiles[i];q.age+=dt;q.x+=Math.cos(q.a)*q.speed*dt;q.y+=Math.sin(q.a)*q.speed*dt;q.life-=dt;if(q.life<=0||q.x<50||q.x>W-50||q.y<50||q.y>H-50){projectiles.splice(i,1);continue}if(Math.hypot(q.x-player.x,q.y-player.y)<q.r+player.r){if(damagePlayer(q.damage,q.x,q.y,q.type==='fireball'?1.0:.85,q.type==='fireball'||q.type==='fireblast'?'fire':'normal'))projectiles.splice(i,1);else projectiles.splice(i,1)}}

 for(let i=slashes.length-1;i>=0;i--){
  const s=slashes[i];s.age+=dt;const progress=s.age/s.duration;const reach=s.reach||playerWeapon().reach;const centre=s.angle+s.side*(Math.PI*.40-(Math.min(1,progress)*Math.PI*.80));
  for(const e of [...enemies]){if(s.hit.has(e)||!e.active)continue;const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy);let da=Math.atan2(dy,dx)-centre;da=Math.atan2(Math.sin(da),Math.cos(da));if(d<reach+e.r&&Math.abs(da)<.82){e.hp-=s.damage;s.hit.add(e);e.hit=.12;e.stagger=.12;const push=Math.max(0,1-d/(reach+e.r));const pa=Math.atan2(e.y-player.y,e.x-player.x);e.x+=Math.cos(pa)*(8+18*push);e.y+=Math.sin(pa)*(8+18*push);burst(e.x,e.y,'hit',5);if(e.hp<=0){deathMarks.push({x:e.x,y:e.y,type:e.type,seed:Math.random()*1000});if(e.type!=='boss')spawnLoot(e.x,e.y,e.type);else{const reward=bossGoldReward();gold+=reward;totalGoldCollected+=reward;showPickup(`👑 GUARDIAN BONUS  +${reward} GOLD`)}enemies.splice(enemies.indexOf(e),1);kills++;addScore(SCORE_VALUES[e.type]||0);awardXP(e.type==='boss'?30:e.type==='bat'?3:e.type==='goblin'?4:5);burst(e.x,e.y,'death',e.type==='boss'?28:12);if(e.type==='boss'){areaClearTimer=1.8;areaClearShown=true;}if(!isBossRoom())spawnTimer=.65;}}}
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
 for(let i=loot.length-1;i>=0;i--){const l=loot[i];const pickupRadius=l.type==='Gold'?player.r+5:player.r+l.r+9;if(dist(player,l)<pickupRadius){if(l.type==='Gold'){gold+=l.amount;totalGoldCollected+=l.amount;showPickup(`🪙 +${l.amount} GOLD  •  purse: ${gold}`)}if(l.type==='Heart'){player.hp=player.maxHp;showPickup('♥ FULL HEAL!')}if(l.type==='Potion'){const before=player.hp;player.hp=clamp(player.hp+scaledPotionHeal(),0,player.maxHp);showPickup(`✚ +${Math.round(player.hp-before)} HP`)}if(l.type==='Weapon'){weaponFinds.push(l.weapon);showPickup(`⚔ ${l.weapon.name} — ${l.weapon.rarity}  •  take it to the exit`)}burst(l.x,l.y,l.type==='Gold'?'coin':l.type==='Weapon'?'weapon':'heal',8);loot.splice(i,1);updateHud()}}
 particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.vx*=.985;p.vy*=.985});particles=particles.filter(p=>p.life>0);
 if(!isBossRoom()&&spawnQueue.length===0&&entrances.length===0&&enemies.length===0&&!roomCleared){roomCleared=true;roomsCleared++;msg('ROOM CLEARED  •  WALK TO EXIT »');burst(W/2,H/2,'clear',18)}
 if(isBossRoom()&&enemies.length===0&&!roomCleared){roomCleared=true;msg(`AREA ${area} COMPLETE  •  WALK TO EXIT »`)}
 if(roomCleared&&!atShop&&!weaponPromptOpen){const ex={x:W-58,y:H/2};if(Math.abs(player.x-ex.x)<24&&Math.abs(player.y-ex.y)<58){if(isBossRoom())beginAreaShop();else if(weaponFinds.length){pendingWeaponIndex=0;weaponPromptOpen=true;openWeaponPrompt();}else{room++;resetRoom();showPickup(`Entering room ${room}`)}}}
 updateHud();
}
function shootProjectile(x,y,a,speed,damage,type){projectiles.push({x,y,a,speed,damage,r:type==='arrow'?4:7,life:type==='arrow'?2.6:3.2,type,age:0})}

function burst(x,y,type='death',n=8,spawnType=''){
 for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=25+Math.random()*110;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:type==='shot'?.12:.45,type,spawnType})}
}
function pixelRect(x,y,w,h,fill){ctx.fillStyle=fill;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function text(t,x,y,size,fill,align='left'){ctx.fillStyle=fill;ctx.font=`700 ${size}px ui-monospace,monospace`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(t,x,y)}
function panel(x,y,w,h){pixelRect(x,y,w,h,'#061619e8');ctx.strokeStyle='#376566';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h)}

function drawDungeon() {
  // One environment pass: floor -> walls -> props -> torch light.
  drawRoomEnvironment();
}
function drawBone(x, y, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  pixelRect(-18, -2, 36, 4, '#9c9a85');
  pixelRect(-17, -6, 5, 5, P.cream);
  pixelRect(12, 1, 5, 5, P.cream);
  ctx.restore();
}

function drawBlood(x, y, colour) {
  for (let i = 0; i < 8; i++) {
    const angle = i * 1.7;
    const radius = 6 + ((i * 13) % 17);
    pixelRect(
      x + Math.cos(angle) * radius,
      y + Math.sin(angle) * radius * 0.55,
      2 + (i % 3),
      2 + (i % 2),
      colour
    );
  }
}

function drawBonePile(x, y) {
  drawBone(x - 5, y - 2, -0.65);
  drawBone(x + 6, y + 3, 0.7);
}

function drawDeathMarks() {
  for (const mark of deathMarks) {
    if (mark.type === 'skeleton') drawBonePile(mark.x, mark.y);
    else if (mark.type === 'bat' || mark.type === 'boss') drawBlood(mark.x, mark.y, '#7a3035');
    else drawBlood(mark.x, mark.y, '#3b7b45');
  }
}

function drawSwordAt(x,y,weaponKeyOrInstance,angle,alpha=1,scale=1){
 const w=weaponKeyOrInstance?.id?weaponKeyOrInstance:(WEAPONS[weaponKeyOrInstance]||WEAPONS.shortSword);
 const key=w.id||'shortSword';
 const len=key==='claymore'?31:key==='longSword'?27:23;
 const thick=key==='claymore'?5:key==='longSword'?4:3;
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;ctx.shadowBlur=10;ctx.shadowColor=P.teal2;
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
 drawSwordAt(player.x,player.y,s.weapon||playerWeapon(),centre,0.98,1);
}
function drawSpriteFrame(img,sx,sy,sw,sh,x,y,dw,dh,flip=false,alpha=1){
 if(!img.complete||img.naturalWidth===0)return false;
 ctx.save();ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.drawImage(img,sx,sy,sw,sh,-dw/2,-dh/2,dw,dh);ctx.restore();return true;
}
function drawPlayer(){
 const bob=(Math.hypot(joy.x,joy.y)>.12||keys.w||keys.a||keys.s||keys.d)?Math.sin(walkTime)*1.2:0;
 const x=player.x,y=player.y+bob,hurt=player.hitTimer>0;
 ctx.save();ctx.shadowBlur=hurt?12:(player.flash?24:10);ctx.shadowColor=hurt?'#8f3036':P.teal;
 const frame=facingDir==='up'?3:(facingDir==='left'||facingDir==='right'?1:0);
 const flip=facingDir==='left';
 if(characterSpritesReady){drawSpriteFrame(characterSprites,frame*64,0,64,64,x,y,48,48,flip,hurt?.78:1)}
 else {ctx.restore();return drawLegacyPlayer();}
 if(hurt){ctx.save();ctx.globalAlpha=.72;ctx.strokeStyle='#a33d46';ctx.lineWidth=2;ctx.strokeRect(x-17,y-18,34,36);ctx.restore()}
 if(!slashes.length)drawSwordAt(x,y,playerWeapon(),facing,1,1);
 ctx.restore();
}
function drawLegacyPlayer(){
 const x=player.x,y=player.y;ctx.save();ctx.translate(x,y);ctx.scale(SPRITE_SCALE,SPRITE_SCALE);pixelRect(-12,4,24,16,'#071517');pixelRect(-15,0,30,12,'#174642');pixelRect(-12,-13,24,16,'#0b292b');pixelRect(-9,-15,18,7,'#0c3031');ctx.restore();
}
function drawEnemy(e,i){
 const x=e.x,y=e.y,d=e.facingDir||'down';
 ctx.save();ctx.shadowBlur=e.type==='bat'?11:10;ctx.shadowColor=e.type==='bat'?P.red:P.teal;
 const idx=e.type==='goblin'?0:e.type==='skeleton'?1:e.type==='bat'?2:3;
 const size=e.type==='boss'?70:52;
 const flip=d==='left';
 if(enemySpritesReady){
   const frameW=80, frameH=80;
   drawSpriteFrame(enemySprites,idx*frameW,0,frameW,frameH,x,y,size,size,flip,e.hit>0?.78:1);
 } else {ctx.restore();return drawLegacyEnemy(e,i);}
 // Bat dive telegraph remains readable over the new art.
 if(e.type==='bat'&&e.batAttackAge>0){ctx.save();ctx.globalAlpha=.45+.45*Math.sin(e.batAttackAge*30);ctx.strokeStyle=P.red2;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,e.r+7,0,Math.PI*2);ctx.stroke();ctx.restore()}
 if(e.type==='goblin'&&e.windup>0){const aimA=Math.atan2(player.y-y,player.x-x);ctx.save();ctx.translate(x,y);ctx.rotate(aimA);ctx.strokeStyle='#d9b35b';ctx.globalAlpha=.65*Math.min(1,e.windup/.52);ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(17,0);ctx.lineTo(48,0);ctx.stroke();ctx.setLineDash([]);ctx.restore()}
 if(e.windup>0){ctx.save();ctx.strokeStyle=P.gold2;ctx.lineWidth=2;ctx.globalAlpha=Math.min(1,e.windup/.48);ctx.beginPath();ctx.arc(x,y,e.r+7,-1.7,-.4);ctx.stroke();ctx.restore()}
 ctx.restore();
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
  if(enemySpritesReady)drawSpriteFrame(enemySprites,160,0,80,80,0,0,80,80,false,p); else {pixelRect(-8,-6,16,14,'#2a2a42');pixelRect(-22,-14,14,20,'#463253');pixelRect(8,-14,14,20,'#463253')}
 }else if(ent.type==='goblin'){
  const r=5+18*p;ctx.globalAlpha=(1-p)*.7;ctx.fillStyle='#397d65';for(let i=0;i<9;i++){const a=i*2.4;ctx.beginPath();ctx.arc(Math.cos(a)*r*.7,Math.sin(a)*r*.45,r*.16,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=p;ctx.scale(.7+.3*p,.7+.3*p);
  if(enemySpritesReady)drawSpriteFrame(enemySprites,0,0,80,80,0,0,80,80,false,1); else {pixelRect(-14,-5,28,15,'#397d65');pixelRect(-10,-11,20,7,'#57b48b')}
 }else{
  const r=8+20*p;ctx.globalAlpha=(1-p)*.75;ctx.fillStyle='#8a6743';for(let i=0;i<10;i++){const a=i*2.1;ctx.beginPath();ctx.arc(Math.cos(a)*r*.75,Math.sin(a)*r*.5,2+i%3,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=p;ctx.translate(0,8*(1-p));ctx.scale(.7+.3*p,.7+.3*p);
  if(enemySpritesReady)drawSpriteFrame(enemySprites,80,0,80,80,0,0,80,80,false,1); else {pixelRect(-10,-6,20,14,P.cream);pixelRect(-8,-17,16,12,'#e3ddc8')}
 }
 ctx.restore();
 if(p<1)text(ent.type==='bat'?'DROP IN':ent.type==='goblin'?'MAGIC':'EARTH',x,y-28,6,ent.type==='goblin'?P.green:ent.type==='skeleton'?'#a57b4c':P.cream,'center');
}
function drawProjectile(q){
 ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.a);
 if(q.type==='arrow'){ctx.shadowBlur=8;ctx.shadowColor=P.gold;pixelRect(-7,-2,14,4,P.cream);pixelRect(5,-1,5,2,P.gold2);ctx.restore();return}
 const blast=q.type==='fireblast';const pulse=.85+.18*Math.sin(q.age*18);ctx.shadowBlur=blast?18:13;ctx.shadowColor=blast?P.red2:P.gold2;ctx.globalAlpha=.95;
 // Layered, pointed flame rather than a flat projectile rectangle.
 ctx.fillStyle=blast?'#ed6a70':'#e5b94d';ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(-1,-6*pulse);ctx.lineTo(2,-2);ctx.lineTo(7,-7*pulse);ctx.lineTo(5,1);ctx.lineTo(9,4);ctx.lineTo(1,5);ctx.lineTo(-3,9);ctx.lineTo(-3,3);ctx.closePath();ctx.fill();
 ctx.fillStyle=blast?'#ffd1a8':'#ffe08a';ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(0,-4);ctx.lineTo(2,-1);ctx.lineTo(5,-3);ctx.lineTo(3,2);ctx.lineTo(5,4);ctx.lineTo(0,3);ctx.closePath();ctx.fill();
 ctx.fillStyle='#fff1c7';pixelRect(-1,-2,4,4,'#fff1c7');
 ctx.restore();
}

function drawLoot(l){
 const y=l.y+Math.sin(l.bob)*3,x=l.x;ctx.save();ctx.translate(x,y);ctx.shadowBlur=14;ctx.shadowColor=l.type==='Gold'?P.gold:P.teal;
 if(l.type==='Gold'){
  pixelRect(-13,2,10,8,P.gold);pixelRect(1,-3,11,9,P.gold2);pixelRect(-4,-9,10,9,'#f0c85c');pixelRect(-10,4,5,3,'#8f6b25');pixelRect(4,-1,5,3,'#9d7426');
 }else if(l.type==='Heart'){
  ctx.fillStyle=P.red2;ctx.beginPath();ctx.moveTo(0,11);ctx.lineTo(-13,-1);ctx.quadraticCurveTo(-15,-12,-7,-13);ctx.quadraticCurveTo(0,-13,0,-6);ctx.quadraticCurveTo(0,-13,7,-13);ctx.quadraticCurveTo(15,-12,13,-1);ctx.closePath();ctx.fill();pixelRect(-7,-7,4,3,'#ffb0a5');
 }else if(l.type==='Potion'){
  pixelRect(-5,-13,10,5,P.cream);pixelRect(-9,-7,18,17,'#25876e');pixelRect(-6,-4,12,11,'#55c997');pixelRect(-3,1,6,6,'#8ee7b9');pixelRect(-7,-15,14,3,'#bcae87');
 }else{
  const r=rarityData(l.weapon?.rarity);ctx.shadowColor=r.name==='Legendary'?P.gold2:r.name==='Epic'?P.red2:r.name==='Rare'?P.teal2:P.teal;
  pixelRect(-3,-14,6,9,P.gold2);pixelRect(-6,-6,12,4,P.cream);pixelRect(-3,-2,6,17,'#6f4f32');pixelRect(-8,13,16,4,P.gold);
  text(l.weapon?.rarity?.slice(0,1)||'C',0,25,7,r.name==='Legendary'?P.gold2:r.name==='Epic'?P.red2:r.name==='Rare'?P.teal2:P.cream,'center');
 }
 if(l.type==='Gold'&&Math.sin(l.bob*2.1)>.55){ctx.fillStyle=P.cream;ctx.globalAlpha=.7;pixelRect(-2,-13,4,2,P.cream);pixelRect(-1,-15,2,6,P.cream);pixelRect(-4,-12,8,2,P.cream);ctx.globalAlpha=1}
 ctx.restore();
}

function drawEntranceDoor(){}
function drawExit(){
  const x=W-54,y=H/2;
  if(!roomCleared){
    ctx.save();
    pixelRect(x-9,y-9,18,20,'#6d5a34');pixelRect(x-6,y-13,12,10,'#b9a56b');
    ctx.strokeStyle='#172124';ctx.lineWidth=3;ctx.strokeRect(x-4,y-10,8,10);pixelRect(x-2,y-3,4,5,'#172124');
    ctx.restore();
  }
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

function formatSpeed(cooldown){return `${(1/cooldown).toFixed(1)}/s`}
function compareArrow(a,b,lowerBetter=false){const d=a-b;const good=lowerBetter?-d:d;if(Math.abs(d)<.005)return '—';return good>0?'▲':'▼'}
function weaponCardHTML(w){const cur=playerWeapon();const cs=currentWeaponStats();const ws=weaponStatLines(w);const damageDiff=ws.damage+player.damageBonus-cs.damage;const reachDiff=ws.reach-cs.reach;const speedDiff=(1/ws.cooldown)-(1/cs.cooldown);const knockDiff=ws.knockback-cs.knockback;return `<div class="weaponCompare"><div class="weaponCol current"><div class="smallTitle">CURRENT</div><div class="weaponName">${cur.icon} ${cur.name}</div><div class="rarity ${rarityClass(cur.rarity)}">${cur.rarity}</div><div class="weaponStat">DAMAGE <b>${cs.damage}</b></div><div class="weaponStat">REACH <b>${cs.reach}</b></div><div class="weaponStat">SPEED <b>${formatSpeed(cs.cooldown)}</b></div><div class="weaponStat">KNOCKBACK <b>${cs.knockback.toFixed(2)}×</b></div></div><div class="compareMid"><div>${compareArrow(damageDiff,0)} </div><div>${compareArrow(reachDiff,0)} </div><div>${compareArrow(speedDiff,0)} </div><div>${compareArrow(knockDiff,0)} </div></div><div class="weaponCol found"><div class="smallTitle">FOUND</div><div class="weaponName">${w.icon} ${w.name}</div><div class="rarity ${rarityClass(w.rarity)}">${w.rarity}</div><div class="weaponStat">DAMAGE <b>${w.damage+player.damageBonus}</b></div><div class="weaponStat">REACH <b>${w.reach}</b></div><div class="weaponStat">SPEED <b>${formatSpeed(w.cooldown)}</b></div><div class="weaponStat">KNOCKBACK <b>${w.knockback.toFixed(2)}×</b></div></div></div>`}
function openWeaponPrompt(){const overlay=document.getElementById('weaponScreen');if(!overlay)return;overlay.classList.remove('burning');const w=weaponFinds[pendingWeaponIndex];if(!w){finishWeaponFinds();return;}document.getElementById('weaponTitle').textContent='WEAPON FOUND';document.getElementById('weaponSub').textContent=`You found this on your adventure — ${pendingWeaponIndex+1} of ${weaponFinds.length}`;document.getElementById('weaponCard').innerHTML=weaponCardHTML(w);document.getElementById('equipWeapon').textContent=`EQUIP ${w.name.toUpperCase()}`;document.getElementById('keepWeapon').textContent='KEEP CURRENT';overlay.classList.add('show');}
function finishWeaponFinds(){weaponFinds=[];pendingWeaponIndex=0;weaponPromptOpen=false;weaponBurning=false;const overlay=document.getElementById('weaponScreen');if(overlay)overlay.classList.remove('show');room++;resetRoom();showPickup(`Entering room ${room}`);}
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
 loot.forEach(drawLoot);
 projectiles.forEach(drawProjectile);
 entrances.forEach(drawEntrance);
 enemies.forEach((e,i)=>drawEnemy(e,i));drawPlayer();
 slashes.forEach(drawSlash);
 particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/.45);let col=p.type==='coin'?P.gold2:(p.type==='heal'?P.teal2:(p.type==='weapon'?P.gold2:(p.type==='hit'?P.cream:(p.type==='spawn'?(p.spawnType==='goblin'?P.green:p.spawnType==='skeleton'?'#a57b4c':P.cream):P.gold))));pixelRect(p.x,p.y,4,4,col);ctx.globalAlpha=1});
 if(atShop)drawShop();
 if(player.hp>0&&player.hp/player.maxHp<=.25&&!gameOver){const p=.12+.08*(.5+.5*Math.sin(performance.now()/180));ctx.fillStyle='#8f3036';ctx.globalAlpha=p;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
 if(gameOver){ctx.fillStyle='#02090af2';ctx.fillRect(0,0,W,H);panel(24,74,W-48,320);text('GAME OVER',W/2,106,27,P.cream,'center');text(`FINAL SCORE  ${score}`,W/2,134,16,P.gold2,'center');const rank=scoreRank();text(rank===1?'NEW HIGH SCORE!':rank?`HIGH SCORE RANK  #${rank}`:'',W/2,154,8,P.red2,'center');text(`REACHED  ${isBossRoom()?'GUARDIAN':`ROOM ${room}`}`,W/2,181,9,P.teal2,'center');text(`LEVEL ${level}  •  GOLD ${totalGoldCollected}`,W/2,202,9,P.gold2,'center');text(`ENEMIES DEFEATED  ${kills}`,W/2,223,9,P.cream,'center');text(`ROOMS CLEARED  ${roomsCleared}`,W/2,244,9,P.cream,'center');text('BEST RUNS',W/2,272,9,P.teal2,'center');for(let i=0;i<Math.min(3,highScores.length);i++){const r=highScores[i];text(`${i+1}.  ${r.score}`,W/2,291+i*16,8,P.cream,'center')}panel(W/2-82,340,164,34);text('MAIN MENU',W/2,362,10,P.teal2,'center')}
 if(shake)ctx.restore();
}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}

player.weapon=weaponInstance('shortSword','Common');player.damage=playerWeapon().damage;
resetRoom();
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
playButton.addEventListener('pointerdown',e=>{e.preventDefault();if(started)return;closeScoreboard();startNewRun();msg('AREA 1 • CASTLE — ROOM 1 • CLEAR THE ROOM')});
scoreboardButton.addEventListener('pointerdown',e=>{e.preventDefault();openScoreboard()});
scoreboardBack.addEventListener('pointerdown',e=>{e.preventDefault();closeScoreboard()});
exitAppButton.addEventListener('pointerdown',e=>{e.preventDefault();exitApp()});
equipWeapon.addEventListener('pointerdown',e=>{e.preventDefault();handleWeaponDecision(true)});
keepWeapon.addEventListener('pointerdown',e=>{e.preventDefault();handleWeaponDecision(false)});
inventoryButton.addEventListener('pointerdown',e=>{e.preventDefault();openInventory()});
inventoryClose.addEventListener('pointerdown',e=>{e.preventDefault();closeInventory()});
inventoryCloseBottom.addEventListener('pointerdown',e=>{e.preventDefault();closeInventory()});
requestAnimationFrame(loop);
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.code==='Space'&&!gameOver)fireHeld=true});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(e.code==='Space')fireHeld=false});
function startNewRun(){started=true;paused=false;startScreen.style.display='none';gameOver=false;area=1;areaName='CASTLE';room=1;kills=0;gold=0;score=0;xp=0;level=1;xpNeed=12;roomsCleared=0;totalGoldCollected=0;scoreSaved=false;atShop=false;areaComplete=false;player.hp=100;player.maxHp=100;player.damageBonus=0;player.weapon=weaponInstance('shortSword','Common');player.damage=playerWeapon().damage;weaponFinds=[];pendingWeaponIndex=0;weaponPromptOpen=false;weaponBurning=false;player.hitTimer=0;player.hitCooldown=0;player.knockX=0;player.knockY=0;nextSwingSide=1;swingCooldown=0;fireHeld=false;joy.active=false;joy.x=joy.y=0;resetRoom()}
function returnToTitle(){gameOver=false;paused=false;started=false;atShop=false;areaComplete=false;weaponPromptOpen=false;weaponBurning=false;weaponFinds=[];fireHeld=false;joy.active=false;joy.x=joy.y=0;startScreen.style.display='flex';document.getElementById('inventoryScreen')?.classList.remove('show');setBossWarning('');msg('PRESS PLAY TO ENTER THE DUNGEON')}

const stick=document.getElementById('stick'),nub=document.getElementById('nub');
function joyMove(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,m=Math.min(45,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);joy.x=Math.cos(a)*m/45;joy.y=Math.sin(a)*m/45;nub.style.transform=`translate(${joy.x*45}px,${joy.y*45}px)`}
stick.addEventListener('pointerdown',e=>{if(paused)return;joy.active=true;stick.setPointerCapture(e.pointerId);joyMove(e)});stick.addEventListener('pointermove',e=>{if(joy.active)joyMove(e)});stick.addEventListener('pointerup',()=>{joy.active=false;joy.x=joy.y=0;nub.style.transform='translate(0,0)'});stick.addEventListener('pointercancel',()=>{joy.active=false;joy.x=joy.y=0;nub.style.transform='translate(0,0)'});
const f=document.getElementById('fire');f.addEventListener('pointerdown',()=>{if(gameOver||paused)return;if(atShop)return;performSwing();fireHeld=true});f.addEventListener('pointerup',()=>fireHeld=false);f.addEventListener('pointercancel',()=>fireHeld=false);
c.addEventListener('pointerdown',e=>{
 const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*(W/r.width),y=(e.clientY-r.top)*(H/r.height);
 if(gameOver){if(x>=W/2-90&&x<=W/2+90&&y>=334&&y<=378)returnToTitle();return;}
 if(!atShop||weaponPromptOpen)return;
 if(x>=48&&x<=312&&y>=172&&y<=230)buyUpgrade('damage');else if(x>=48&&x<=312&&y>=242&&y<=300)buyUpgrade('health');else if(x>=48&&x<=312&&y>=318&&y<=368)continueFromShop();
});
if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('portrait').catch(()=>{});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
