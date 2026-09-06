# DUNGEON SURVIVOR

**Current Version: 0.2.5fff**

Dungeon Survivor is a mobile-first, top-down roguelite dungeon survival game designed to run directly from GitHub Pages and install as a PWA on Android.

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
- **Inventory:** opens the player card and pauses the run.
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
- Modular authored dungeon architecture with separate wall, floor and prop assets.

## GitHub Pages

Upload the project files to the root of a GitHub repository, then enable **Settings → Pages → Deploy from a branch → main → /(root)**. Open the generated Pages URL in Chrome on Android and use Chrome's menu to install/add the app to the home screen.

## Archived 0.1.x Releases

The 0.1 releases are retained here as historical development records rather than current project documentation.

### 0.1.9 — Weapons, Decisions & Start Menu

- Added physical weapon drops that must be collected by walking over them.
- Added Short Sword, Long Sword and Claymore as distinct weapon classes.
- Added Common, Uncommon, Rare, Epic and Legendary weapon rarities.
- Kept the Short Sword as the guaranteed starting weapon.
- Added weapon discovery/equip decisions at room exits.
- Slowed Goblins slightly and changed Bat close-range behaviour.
- Added the Local Scoreboard and return-to-start controls.
- Added a discreet version number and Exit App control.

### 0.1.8 — Movement, Combat Feel & Castle Room Variation

- Rebalanced movement speed hierarchy for player and enemies.
- Kept Bats as the fastest enemy and the Guardian deliberately slow.
- Fixed Game Over screen shake after lethal hits.
- Added deterministic Castle room variation including pillars, alcoves, rubble, moss, torches, banners, shrines and floor details.

### 0.1.7 — Progression, Scoring & Front-End Presentation

- Added area/level-based enemy scaling and stronger area progression naming.
- Increased gold rewards and potion healing with progression.
- Added scoring and damage penalties.
- Added a local top-five high-score table.
- Added an Area Cleared presentation after the Guardian.
- Replaced early splash/menu approximations with selected torchlit dungeon artwork.
- Updated PWA icons and front-end presentation.

### 0.1.6 — Combat Feedback & Presentation

- Added Goblin Archer simultaneous active limits and clearer aiming/firing feedback.
- Added player hit feedback, knockback, hit recovery and low-health warning.
- Added clearer enemy attack presentation.
- Added the branded splash screen, hero app icon and matching title-menu presentation.

### 0.1.5 — Guardian Fix & Run Flow

- Fixed Guardian sword damage and defeat handling.
- Tuned Guardian projectile speed.
- Changed Game Over and fresh-run flow.
- Kept the Guardian body blocker so close-range sword hits remain possible.

### 0.1.4 — Combat & Presentation Polish

- Added the dedicated title/start screen.
- Added Guardian attack warnings and stronger boss-attack presentation.
- Reworked Guardian projectiles with layered flame-like effects.
- Added the Guardian collision blocker, sword-hit feedback and player movement polish.
- Added gold sparkle feedback, room-clear presentation and run summary.
- Separated README documentation from the version history.

### 0.1.3 — Directional Characters & Room Presentation

- Added the left-side decorative entrance and left-side player starting position.
- Added irregular floor detail and directional player/enemy presentation.
- Fixed skeleton movement and Guardian repositioning.
- Restored player damage upgrades to sword-swing damage.

### 0.1.2 — Sword Combat & Enemy Polish

- Fixed sword damage collision.
- Expanded the visual sword swing while keeping the gameplay hitbox separate.
- Added hit flash, stagger, knockback and stronger impact particles.
- Refined Bat, Goblin and Skeleton behaviours.
- Added deterministic decorative pillars and dropped-gold bounce.

### 0.1.1 — Combat Feel & Gold Pickup

- Added close-range magnetic gold pickup.
- Added visible animated player and skeleton sword swings.
- Added Short Sword / Long Sword / Claymore weapon-class foundation.
- Added weapon-rarity data foundation.

### 0.1.0 — Core Gameplay Loop

- Established the first dedicated core-loop milestone.
- Added progressive room spawning with active caps and total quotas.
- Added furthest-edge spawn selection and enemy entrance animations.
- Added Goblin ranged combat, Skeleton telegraphed melee attacks and Guardian projectile patterns.
- Added spawn/death combat feedback and physical loot collection.
- Added the Area 1 castle room sequence, Guardian encounter and upgrade shop.

### 0.0.x — Early Prototype Archive

- Prototype room combat, sword system, locked exit, XP, loot and Area 1 boss/shop progression.
- Reduced character sprite scale to make the dungeon environment feel larger.

## Change Log

### 0.2.5fff — Codebase Clean-up & Render Pipeline Rewrite

- Reworked the active game renderer into a single, clean floor → walls → props pipeline.
- Removed obsolete embedded environment artwork and the unused legacy room-decoration renderers.
- Removed the old floor-sheet slicing path that was sampling tiny regions from the large presentation atlas.
- Uses the twelve authored 32×32 floor PNGs directly, with an organised-folder fallback.
- Simplified wall loading while retaining compatibility with the organised wall folders and existing root-level uploads.
- Kept only the new authored `assets/props/` decoration system in the live room renderer.
- Removed unused room-archetype decorative helpers, obsolete atlas helpers and dead environment code.
- Cleaned and hardened the service-worker cache list around assets that are actually used.
- Bumped the build identifier to **0.2.5fff**.

### 0.2.5ff — Floor & Architecture Recovery

- Repaired the room render pipeline after 0.2.5f blanked the floor and wall architecture.
- Uses the uploaded `assets/floor/floor_tiles.png` as the primary 4×3 sheet of twelve 32×32 floor tiles, with the existing individual floor PNGs retained as a compatibility fallback.
- Added repository-path fallbacks for the approved wall assets so the room still renders if the organised `/walls/...` paths or earlier root-level uploads are present.
- Supports the packed three-variant root cracked/mossy wall files as a fallback without stretching the whole three-variant image into a single wall.
- Keeps the new authored `assets/props/` decorations as the active room-decoration layer; no legacy room-decoration drawing is used by the live room renderer.
- Hardened service-worker installation so one missing optional asset cannot prevent the new cache from installing.
- Bumped the build identifier to **0.2.5ff** for easier testing.

### 0.2.5f — Floor & Decoration Fix

- Fixed the dungeon floor to use the uploaded **12 individual 32×32 floor PNGs directly** rather than treating the labelled presentation sheet as a sprite sheet.
- Uses the four Clean, four Debris and four Moss variants as the actual room-floor tiles.
- Corrected the floor room dimensions and clipping so tiles stay inside the wall architecture.
- Disabled the legacy environmental decoration render path so old torches, chests, pillars and rubble cannot be drawn over the new system.
- Made the new authored `assets/props/` set the only active room-decoration source.
- Kept the agreed sparse decoration rules: 2–4 torches, 3–5 additional props, edge-biased placement, clear centre, no bottom-edge props and protected doorways.
- Made the version label substantially more visible for easier build identification during testing.
- Reorganised this README so release changes live in the Change Log rather than at the top of the document.
- Moved the complete 0.1.x history into the archived section at the bottom of the Change Log.

### 0.2.5e — Authored Architecture & New Props

- Added the new authored wall architecture using the uploaded modular wall assets.
- Added the new independent environmental prop set under `assets/props/`.
- Added deterministic sparse edge-biased room decoration with mandatory torches.
- Removed the old active modular prop presentation from the intended live room render path.
- Updated the service-worker asset list for the new walls and props.

### 0.2.5d — Architecture Pass

- Integrated the approved top, left, right and bottom wall pieces into the live room.
- Added modular wall variants and doorway architecture.
- Improved the room silhouette so the dungeon reads as an enclosed room rather than a flat canvas.

### 0.2.5c — Environment Integration

- Continued the modular environment integration and prepared the authored wall/floor asset pipeline for the Castle rooms.
- Kept the player, enemy, combat and progression systems intact while the environment presentation was rebuilt.

### 0.2.5b — Authored 12-Tile Floor Foundation

- Introduced the approved **12-piece authored floor set**: four Clean, four Debris and four Moss 32×32 tiles.
- Added deterministic per-cell floor variation and room-archetype weighting.
- Kept clean stone dominant while using debris and moss as restrained variation.
- Preserved readable central combat lanes.

### 0.2.5 — Player HUD, Controls & Inventory Foundation

- Moved the player status UI out of the dungeon canvas into a slim banner above the game world.
- Reduced the status information to the essentials: health, XP/level, purse and room.
- Removed the in-world minimap so the dungeon has more visual space and less HUD clutter.
- Moved transient player notifications to the top of the game world directly beneath the status banner.
- Removed the duplicate room-clear notification from the bottom of the screen.
- Repositioned the virtual controls lower on the phone layout.
- Added a dedicated central Inventory button between Move and Swing.
- Inventory opens a full player card and pauses the run without advancing enemies, projectiles or timers.
- Inventory currently shows health, XP/level, purse, equipped weapon stats and run progress, with an armour section reserved for the future equipment system.

### 0.2.4 — Architecture & Props Pass

- Externalised the modular Castle atlas/prop sheets into real repository assets.
- Added deeper wall construction, inner trim, doorway masonry and corner/buttress dressing.
- Added physical collision for substantial pillars, chests, altars and rubble.
- Added prop shadows and room-specific architectural dressing.
- Kept the room surface modular rather than using a baked room background.

### 0.2.3 — Textured Modular Dungeon

- Promoted the modular atlas into the live room surface.
- Added reusable authored stone samples and a repeatable brick wall ring.
- Added finer surface wear, cracks and a restrained inner vignette for more depth.
- Added the earlier compact HUD and minimap foundation that was later replaced by the slimmer 0.2.5 HUD.

### 0.2.1c — Ancient Stone Graphical Refinement

- Refined the modular floor into finer-grained individual masonry slabs.
- Reduced slab size, softened seam contrast and added irregular edge wear, chips, moss, mineral flecks and fine cracks.
- Retained modular wall variants and room dressing for architectural identity.

### 0.2.1b — Broken Masonry Graphical Refinement

- Reworked the Castle floor from a visibly repeating square-tile field into an irregular stone field.
- Added larger-scale cracks, chips, moss, grime and worn-stone variation.
- Reduced the visual grid effect while retaining modular room construction.

### 0.2.1 — The Living Dungeon

- Great Hall moved to a reusable modular environment pipeline.
- Added deterministic room layouts for Great Hall, Pillared Hall, Ruined Chamber, Chapel, Guard Room and Cross Hall.
- Added independent modular props and torch glow layers.

### 0.2.0 REDO — Authored Pixel-Art Great Hall

- Overhauled the Castle presentation with richer authored pixel-art environment work.
- Added deterministic Castle room archetypes and decorative layouts.
- Added animated torch presentation and richer environmental depth.
- Reworked Bats and Goblins and added light enemy-synergy behaviour.
- Added a clearer room-clear rhythm and stronger Castle room identity.
- Added the requested Game Over **MAIN MENU** button.
- Updated the start-menu visual language, splash presentation and PWA artwork.

