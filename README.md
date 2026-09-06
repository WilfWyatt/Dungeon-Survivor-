# DUNGEON SURVIVOR

**Current Version: 0.2.5**

## 0.2.5 — Player HUD, Controls & Inventory Foundation
- Moved the player status UI out of the dungeon canvas into a slim banner above the game world.
- Reduced the status information to the essentials: health, XP/level, purse and room.
- Removed the in-world minimap so the dungeon has more visual space and less HUD clutter.
- Moved all transient player notifications to the top of the game world directly beneath the status banner.
- Removed the duplicate room-clear notification from the bottom of the screen.
- Repositioned the virtual controls lower on the phone layout.
- Added a dedicated central Inventory button between Move and Swing.
- Inventory opens a full player card and pauses the run without advancing enemies, projectiles or timers.
- Inventory currently shows health, XP/level, purse, equipped weapon stats and run progress, with an armour section reserved for the future equipment system.
- Kept the modular dungeon, authored environment pipeline, enemies, combat, loot, weapons, progression and PWA structure intact.

## 0.2.3 — Textured Modular Dungeon
- Promoted the modular atlas from an unused/secondary source into the actual live room surface.
- Every 24px floor cell is now selected from reusable authored stone samples, with a separate repeatable brick wall ring.
- Added finer surface wear, cracks and a restrained inner vignette for more depth.
- Added a compact in-canvas HUD for health, XP, level and purse plus a live minimap.
- Kept room archetypes, props, enemy behaviour, combat, loot and progression intact.

## 0.2.1 — The Living Dungeon
- Great Hall now renders from a reusable 24px modular environment atlas instead of a single background image.
- Deterministic room layouts for Great Hall, Pillared Hall, Ruined Chamber, Chapel, Guard Room and Cross Hall.
- Independent modular props for pillars, chests, torches, banners, altar and rubble.
- Independent torch glow layers; the room itself is no longer a baked scene image.


## 0.2.1c — Ancient Stone graphical refinement
- Refined the modular floor into finer-grained individual masonry slabs, closer to the original graphical target.
- Reduced slab size, softened seam contrast and added irregular edge wear, chips, moss, mineral flecks and fine cracks.
- Retained the modular wall variants and room dressing for architectural identity.
- Added extra torch/rubble dressing to several Castle room archetypes.
- Kept the modular architecture, gameplay collision and clear combat lanes intact.



Dungeon Survivor is a mobile-first, top-down roguelite dungeon survival game designed to run directly from GitHub Pages and install as a PWA on Android.

### 0.2.0 REDO graphical rebuild
- Replaced the procedural Great Hall backdrop with an authored pixel-art environment asset targeted at the original design document.
- The game canvas now uses the new environment as the visual foundation while keeping movement, enemies, combat, loot, rooms, scoring and progression live.
- The old procedural room dressing is no longer layered over the authored Great Hall.
- Added a restrained vignette so live gameplay remains readable over the richer artwork.
- The current v0.2.0 game remains the fallback baseline; this REDO is the first integrated graphical pass.

## What is the game?

Fight your way through dangerous dungeon rooms, survive waves of enemies, collect dropped loot, gain XP and grow stronger. Clear each room to unlock the exit, progress through the castle and eventually face the Guardian.

The game is built as a lightweight HTML, CSS and JavaScript project with a portrait mobile layout, virtual controls and a deliberately chunky pixel-art presentation.

## Gameplay

- Explore room-to-room dungeon encounters.
- Fight using a close-range sword with alternating swings.
- Collect physical loot by walking over it.
- Gain XP and level up during a run.
- Enemy strength, loot value and healing scale with area and player level.
- Earn score for kills and lose score when taking damage.
- Spend gold on permanent upgrades after defeating an area boss.
- Learn enemy attack patterns and react to telegraphed attacks.
- Reach the Guardian and survive its projectile patterns.

## Controls

- **Move:** virtual joystick.
- **Swing:** tap for one slash; hold to repeat alternating left/right swings.
- **Desktop testing:** WASD + Space.

## General Features

- Portrait mobile layout.
- PWA/GitHub Pages-ready structure.
- Progressive enemy spawning and varied enemy behaviours.
- Directional player and enemy presentation.
- Physical gold, hearts and potions.
- XP, levels, health and damage progression.
- Melee combat with visible sword swings, hit effects, stagger and knockback.
- Locked room exits and a Guardian boss encounter.
- Permanent upgrade shop between areas.
- Branded splash/start presentation and installable app icons.
- Local high-score table and end-of-run score summary.

## Change Log

### 0.2.5c — Authored 12-Tile Procedural Floor
- Replaced the procedural-looking 0.2.5 floor rendering with the approved **12-piece authored floor set**.
- Added four clean stone variants, four debris variants and four moss variants as individual **32×32 PNG assets**.
- The room floor is now assembled cell-by-cell from those assets, with deterministic variation and room-archetype weighting.
- Clean stone remains dominant; debris and moss are clustered rather than distributed as a noisy checkerboard.
- Central combat lanes are kept readable while retaining natural floor variation.
- Floor assets live at `assets/floor/floor_tiles.png`, with wall assets grouped under `assets/walls/`.
- Updated PWA cache/version references to **0.2.5c**.

## 0.2.1c — Ancient Stone
- Reduced the visible masonry scale so the Castle floor reads as many individual worn stones rather than a handful of giant slabs.
- Softened the dark seam treatment to avoid a jigsaw/grid appearance.
- Added finer chips, mineral flecks, moss, grime, short cracks and occasional larger broken-stone details.
- Added subtle high-traffic wear while preserving clear combat lanes and the modular procedural construction.

### 0.2.1b — Broken Masonry graphical refinement
- Reworked the Castle floor from a visibly repeating square-tile field into an irregular stone-field renderer with jittered slab boundaries.
- Added larger-scale cracks crossing slab boundaries, chips, moss, grime and worn-stone variation.
- Reduced the visual grid/gridline effect while retaining modular room construction and reusable architecture.
- Kept room archetype dressing, carpet features, thresholds, props and combat lanes intact.


### 0.2.0 REDO — Authored Pixel-Art Great Hall

- Overhauled the Castle presentation with irregular individual floor slabs, cracks, chips, worn stonework, moss, vines, rubble and richer wall dressing.
- Added deterministic Castle room archetypes and decorative layouts including Great Hall, Pillared Hall, Ruined Chamber, Chapel, Guard Room and Cross Hall variants.
- Added animated teal torch flames with subtle local glow and stronger environmental depth.
- Added environmental details such as banners, shrines, altar/candles, tables, weapon racks and varied debris while keeping combat lanes clear.
- Reworked Bats into a three-stage threat: fast approach, close-range orbit/harassment and a brief diving attack.
- Reworked Goblins to spread towards different room-edge positions, maintain firing distance and avoid clumping together.
- Added light encounter synergy so Skeletons press slightly harder when Goblins are nearby, reinforcing the mixed-enemy threat.
- Added a more deliberate room-clear rhythm and clearer Castle room identity.
- Added the requested Game Over **MAIN MENU** button; FIRE/Space no longer exits Game Over.
- Updated Start menu secondary buttons to use the same red/metallic visual language as the Play button.
- Kept the local scoreboard, version label and existing PWA/start-screen presentation.

### 0.1.9 — Weapons, Decisions & Start Menu

- Added physical weapon drops that must be collected by walking over them.
- Added Short Sword, Long Sword and Claymore as distinct weapon classes with different speed, reach, damage and knockback profiles.
- Added Common, Uncommon, Rare, Epic and Legendary weapon rarities, with rarity affecting multiple weapon stats.
- Kept the Short Sword as the guaranteed starting weapon for every fresh run.
- Collected weapons are held as finds until the current room is cleared and the player reaches the exit.
- Added a weapon discovery/equip screen at the room exit with a current-versus-found stat comparison.
- Weapon decisions are final: an unequipped found weapon is thrown into the fire and removed from the run.
- Multiple weapons found in one room are presented one at a time, with each decision resolving before the next.
- Slowed Goblins slightly while preserving their ranged spacing role.
- Changed Bats so they rush from range but slow down and kite around the player at close range.
- Added a Local Scoreboard button to the start menu using the device's existing top-five high-score data.
- Added a return-to-start control from the scoreboard.
- Added a discreet version number to the start screen and an Exit App control with browser/PWA-safe fallback behaviour.

### 0.1.8 — Movement, Combat Feel & Castle Room Variation

- Rebalanced movement speed hierarchy to approximately Bat 207 > Player 185 > Goblin 146 > Skeleton 106 >>> Guardian 50, with room/area scaling retained.
- Reduced player movement speed to make enemy spacing and positioning more meaningful.
- Kept Bats as the fastest enemy, with low durability and nuisance pressure.
- Tuned the enemy speed hierarchy so Goblins sit below the player and Skeletons remain slower, deliberate melee threats.
- Kept the Guardian deliberately lumbering and slow.
- Fixed the Game Over screen inheriting the combat screen-shake when the lethal hit happened during the hit-feedback window.
- Added deterministic Castle room variation: different pillar arrangements, wall alcoves, rubble/debris clusters, moss density, torch/banner dressing, skull-shrine appearances and floor-detail patterns.
- Kept room variations decorative and non-blocking so they do not create unfair collision or pathing problems.

### 0.1.7 — Progression, Scoring & Front-End Presentation

- Added area/level-based enemy scaling for HP and damage while keeping progression controlled.
- Added stronger area progression naming: Castle, Lower Castle, Crypt, Catacombs and Abyss as later areas are reached.
- Increased gold rewards as area and player level rise, with modest enemy-type bonuses and a Guardian completion reward.
- Increased potion healing gradually with area and player level.
- Added scoring: Bat +50, Goblin +75, Skeleton +100 and Guardian +1,000.
- Added score penalties: normal enemy hit -5; Fireball and Fire Blast hit -100. Score cannot fall below zero.
- Added a local top-five high-score table stored on the device and displayed on Game Over.
- Added a short Area Cleared presentation after defeating the Guardian before reaching the exit/shop.
- Replaced the generated splash/menu approximation with the selected torchlit dungeon artwork as the actual splash and Play menu visuals.
- Removed the transition gap between splash and start menu by crossfading the menu underneath the splash.
- Replaced the PWA app icon with the exact selected hero-in-the-doorway artwork.
- Updated the service-worker cache and packaged visual assets for the new front-end presentation.

### 0.1.6 — Combat Feedback & Presentation

- Added Goblin Archer simultaneous active limits: R1 2, R2 3, R3 4, R4 5, R5 6, R6 6.
- Added clearer Goblin aiming/firing feedback before arrows are released.
- Added visible player hit feedback with a muted blood-red outline, proportional knockback and a brief hit-recovery window.
- Added a small impact shake and subtle low-health warning when the player falls below 25% HP.
- Added more readable enemy attack presentation while preserving the existing Skeleton wind-up/recovery and Bat behaviour.
- Added a 2-second branded splash screen using the torchlit barred-dungeon visual direction before the Play menu.
- Added a hero-in-the-doorway app icon and PWA icon metadata.
- Updated the title menu presentation to match the torchlit dungeon visual direction.

### 0.1.5 — Guardian Fix & Run Flow

- Fixed the Guardian so it can correctly take sword damage and be defeated.
- Increased Guardian Fireball projectile speed slightly while leaving Fire Blast speed unchanged.
- Changed Game Over flow so **FIRE** returns to the title screen instead of immediately starting another run.
- Changed **PLAY** to start a completely fresh run, resetting run statistics and player progression.
- Kept the Guardian body blocker in place so the player can approach safely enough to land sword hits without overlapping the boss.

### 0.1.4 — Combat & Presentation Polish

- Added a dedicated title/start screen so a new run no longer launches directly into gameplay.
- Added a more prominent Guardian attack-warning display beneath the Health/XP HUD area.
- Added separate **FIREBALL ATTACK** and **FIRE BLAST ATTACK** warnings during Guardian wind-ups.
- Added a short warning pulse and stronger visual treatment to make boss attacks stand out from the normal HUD.
- Reworked Guardian projectiles into layered, flame-like fireballs/blasts with animated pulsing and glow.
- Added a collision blocker around the Guardian so the player can get close enough to land sword hits without walking inside the boss.
- Added stronger sword-hit feedback with impact particles, knockback and a brief stagger effect retained from the previous combat polish.
- Added subtle player walking/idle movement polish.
- Added occasional sparkle feedback to dropped gold.
- Added a more prominent room-clear presentation.
- Added a small run summary to the Game Over screen.
- Restructured the README so general documentation, milestones and version history are kept separate.

### 0.1.3 — Directional Characters & Room Presentation

- Added the left-side decorative entrance and left-side player starting position.
- Added irregular floor detail and directional player/enemy presentation.
- Fixed skeleton movement by initialising attack state.
- Fixed Guardian movement so it continually repositions around the arena.
- Restored player damage upgrades to sword-swing damage.

### 0.1.2 — Sword Combat & Enemy Polish

- Fixed player sword damage collision so swings can damage and kill enemies correctly.
- Expanded the visual sword swing to a broad 144-degree sweep while keeping the gameplay hitbox separate.
- Added hit flash, stagger, knockback and stronger impact particles.
- Added small enemy-behaviour refinements: bats weave, goblins reposition after firing, and skeletons have a brief recovery window after their swing.
- Added a small deterministic selection of decorative room pillars.
- Added a little bounce/kick to dropped gold before it settles.

### 0.1.1 — Combat Feel & Gold Pickup

- Added close-range magnetic gold pickup.
- Added visible animated player and skeleton sword swings.
- Added Short Sword / Long Sword / Claymore weapon-class foundation.
- Added Common / Uncommon / Rare / Epic / Legendary rarity data foundation.

### 0.1.0 — Core Gameplay Loop

- Established the first dedicated core-loop milestone.
- Added progressive room spawning with active caps and total quotas.
- Added furthest-edge spawn selection and enemy entrance animations.
- Added goblin ranged combat, skeleton telegraphed melee attacks and Guardian projectile patterns.
- Added spawn/death combat feedback and preserved physical loot collection.
- Added the Area 1 castle room sequence, Guardian encounter and upgrade shop.

### 0.0.x — Early Prototype

- Prototype room combat, sword system, locked exit, XP, loot and Area 1 boss/shop progression.
- Reduced character sprite scale to make the dungeon environment feel larger.

## GitHub Pages

Upload the project files to the root of a GitHub repository, then enable **Settings → Pages → Deploy from a branch → main → /(root)**. Open the generated Pages URL in Chrome on Android and use Chrome's menu to install/add the app to the home screen.

## v0.2.4 — Architecture & Props Pass
- Externalised the modular Castle atlas/prop sheets into real repository assets.
- Added deeper wall construction, inner trim, doorway masonry and corner/buttress dressing.
- Added physical collision for substantial pillars, chests, altars and rubble.
- Added prop shadows and room-specific architectural dressing.
- Kept the room surface fully modular: individual floor cells are assembled from the 128x96 approved floor atlas rather than using a baked room background.
