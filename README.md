# Dungeon Survivor

A mobile-first HTML/JavaScript roguelite dungeon survival prototype designed to run directly from GitHub Pages and install as a PWA on Android.

## v0.1.0 — Core gameplay loop

Version 0.1.0 focuses on making the room-to-room combat loop feel like a proper game before the larger castle art pass planned for v0.2.0.

### Current features
- Portrait mobile layout with virtual joystick and sword SWING control.
- Tap SWING for a single alternating left/right sword attack; hold to repeat.
- Melee sword arc with real collision.
- Area 1: six normal castle rooms followed by a Guardian boss room.
- Progressive enemy spawning rather than dumping the whole room at once.
- Room spawn caps/quotas:
  - Room 1: 5 active / 10 total
  - Room 2: 6 active / 12 total
  - Room 3: 7 active / 14 total
  - Room 4: 8 active / 17 total
  - Room 5: 10 active / 20 total
  - Room 6: 12 active / 22 total
  - Room 7: Guardian boss
- New enemies enter from the furthest sensible room edge from the player.
- Short delay between incoming enemies.
- Enemy entrance animations:
  - Bats drop in with a floor shadow.
  - Goblins arrive in a green magical poof.
  - Skeletons emerge through a brown dusty ground effect.
- Enemies are not active/hittable until their entrance animation finishes.
- Enemy behaviours:
  - Bats swarm directly towards the player.
  - Goblins keep their distance and fire readable arrow projectiles after a short wind-up.
  - Skeletons close in and perform a telegraphed melee sword strike.
  - Guardian alternates between short aimed projectile bursts and a 360-degree spiral pattern with learnable gaps.
- Enemy-specific death marks: green ichor, bones, or blood.
- Gold, rare hearts and potions physically drop onto the floor and must be collected by walking over them.
- XP and level-ups grant max health, gold and damage.
- Cleared rooms unlock a recessed right-wall exit door.
- Guardian defeat leads to a permanent upgrade shop before the next area.
- PWA/GitHub Pages-ready structure.

## Controls
- **Move:** virtual joystick.
- **Swing:** tap for one slash; hold to repeat alternating left/right.
- Desktop testing also supports WASD + Space.

## Planned v0.2.0
The next milestone is a dedicated graphical feel pass for the castle levels: richer stonework, floor variation, moss/vines, architectural details, lighting, props and environmental atmosphere, while keeping the small character scale that gives the rooms breathing space.

## GitHub Pages
Upload the files in this folder to the root of a GitHub repository, then enable **Settings → Pages → Deploy from a branch → main → /(root)**. Open the generated Pages URL in Chrome on Android and use Chrome's menu to install/add the app to the home screen.

## Change Log

### v0.1.0
- Established the first dedicated core-loop milestone.
- Added progressive room spawning with active caps and total quotas.
- Added furthest-edge spawn selection and enemy entrance animations.
- Added goblin ranged combat, skeleton telegraphed melee attacks and Guardian projectile patterns.
- Added spawn/death combat feedback and preserved physical loot collection.
- Kept the v0.0.x visual baseline intact so v0.2.0 can concentrate on the castle art overhaul.

### v0.0.x
- Prototype room combat, sword system, locked exit, XP, loot and Area 1 boss/shop progression.
- Reduced character sprite scale to make the dungeon environment feel larger.
