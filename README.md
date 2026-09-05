# DUNGEON SURVIVOR

**Current Version: 0.1.5**

Dungeon Survivor is a mobile-first, top-down roguelite dungeon survival game designed to run directly from GitHub Pages and install as a PWA on Android.

## What is the game?

Fight your way through dangerous dungeon rooms, survive waves of enemies, collect dropped loot, gain XP and grow stronger. Clear each room to unlock the exit, progress through the castle and eventually face the Guardian.

The game is built as a lightweight HTML, CSS and JavaScript project with a portrait mobile layout, virtual controls and a deliberately chunky pixel-art presentation.

## Gameplay

- Explore room-to-room dungeon encounters.
- Fight using a close-range sword with alternating swings.
- Collect physical loot by walking over it.
- Gain XP and level up during a run.
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

## Milestones

### 0.2.0 — Castle Graphics Overhaul

The major visual milestone for the castle levels. The aim is to turn the dungeon into a richer, more atmospheric pixel-art environment rather than a simple combat arena.

Planned areas include:

- Individual, irregular stone floor slabs.
- Cracks, chips and worn stonework.
- Moss and creeping vines.
- More textured and varied walls.
- Animated torch flames and glow.
- Environmental lighting and shadows.
- Pillars, alcoves and architectural details.
- Blood, bones, debris and other environmental storytelling.
- More room-specific layouts and visual variations.
- Stronger atmospheric colour and depth.

## Change Log

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
