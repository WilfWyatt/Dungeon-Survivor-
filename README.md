# Dungeon Survivor

## v0.1.1 — Combat feel & gold pickup

Version 0.1.1 adds a small magnetic pickup radius for gold and establishes the first weapon-class data foundation.

### v0.1.1 changes
- Gold within a tiny player-width radius is gently attracted to the player; hearts and potions still require physical pickup.
- Player sword attacks now animate an actual sword through the swing rather than relying only on a hit arc.
- Sword data is structured around weapon classes: Short Sword, Long Sword and Claymore, with different damage, swing speed and reach values ready for future weapon loot.
- Weapon rarity is represented in the weapon data with five planned tiers: Common, Uncommon, Rare, Epic and Legendary.
- Skeleton sword attacks now show a wind-up and visible swing animation, with damage occurring during the swing.

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

### v0.1.2
- Fixed player sword damage collision so swings can damage and kill enemies correctly.
- Expanded the visual sword swing to a broad 144-degree sweep while keeping the gameplay hitbox separate.
- Added hit flash, stagger, knockback and stronger impact particles.
- Added small enemy-behaviour refinements: bats weave, goblins reposition after firing, and skeletons have a brief recovery window after their swing.
- Added a small deterministic selection of decorative room pillars.
- Added a little bounce/kick to dropped gold before it settles.

### v0.1.1
- Added close-range magnetic gold pickup.
- Added visible animated player and skeleton sword swings.
- Added Short Sword / Long Sword / Claymore weapon-class foundation.
- Added Common / Uncommon / Rare / Epic / Legendary rarity data foundation.

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
