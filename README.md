Dungeon Survivor — v0.3.8j

### v0.3.8j — Treasure Rooms
- Added a special Treasure Room encounter with no enemies or combat waves.
- Treasure Rooms use exactly four corner torches and no other existing room prop decorations.
- Eight treasure objects are placed per room: a guaranteed closed chest plus seven randomly selected treasure types.
- Treasure objects use assets from `assets/treasure-room/`.
- Walking over treasure collects it physically; the treasure disappears and awards a larger gold payout.
- Closed chests switch to the authored open-chest asset briefly before disappearing.
- Treasure rewards scale upward by area.
- Treasure Rooms are random non-boss rooms and are immediately considered cleared, so the exit is available while the player loots.
- Existing combat, loot, equipment, Elite waves and menu systems are otherwise unchanged.

# DUNGEON SURVIVOR

Dungeon Survivor is a mobile-first, top-down roguelite dungeon survival game designed to run from GitHub Pages and install as a PWA on Android.

## What is the game?

Fight your way through dangerous dungeon rooms, survive waves of enemies, collect dropped loot, gain XP and grow stronger. Clear each room to unlock the exit, move through the doorway and enter the next room. Progress through the castle and eventually face the Guardian.

The game is built as a lightweight HTML, CSS and JavaScript project with a portrait mobile layout, virtual controls and a chunky pixel-art presentation.

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

## Loot & Equipment

- Gold, health and weapon items physically appear in the dungeon.
- Items must be walked over to collect them; notifications do not replace physical collection.
- Gold and weapon drops use a sparkle effect rather than a wobble.
- Health pickups retain their wobble animation.
- Weapons use Common, Uncommon, Rare, Epic and Legendary rarities.
- Weapon finds are presented for an equip-or-keep decision at the room exit.
- Armour and boots form the foundation of the equipment system, including damage reduction and evade effects.

## Combat

- Close-range sword combat with visible attack animations.
- Weapon classes include Short Sword, Long Sword and Claymore.
- Weapon rarity affects combat statistics.
- Critical hits provide increased damage and stronger combat feedback.
- Enemy attacks include melee, ranged and Guardian projectile patterns.
- Enemies can evade attacks, while the player can gain Evade through equipped boots.

## Controls

- **Move:** virtual joystick.
- **Swing:** tap for one slash; hold to repeat alternating left/right swings.
- **Inventory:** opens the player card and pauses the run.
- **Desktop testing:** WASD + Space.

## Mobile HUD

The mobile HUD is deliberately slim and sits above the game world. It contains only the essential player information:

- Health
- XP / Level
- Purse / Gold

There is no mini-map.

## General Features

- Portrait mobile layout.
- PWA/GitHub Pages-ready structure.
- Progressive enemy spawning and varied enemy behaviours.
- Directional player and enemy presentation.
- Physical loot collection.
- XP, levels, health, damage and build progression.
- Melee combat with hit effects, stagger and knockback.
- Locked room exits and a Guardian boss encounter.
- Permanent upgrade shop between areas.
- Local high-score table and end-of-run score summary.
- Modular authored dungeon architecture with separate wall, floor and prop assets.
- Authored pixel-art gameplay assets and dungeon remains.
- Lightweight authored/procedural audio and visual combat feedback.

## GitHub Pages

Upload the project files to the root of a GitHub repository, then enable **Settings → Pages → Deploy from a branch → main → /(root)**. Open the generated Pages URL in Chrome on Android and use Chrome's menu to install/add the app to the home screen.

# Change Log

## 0.3.8i — Menu & UI Readability Pass
- Reworked the main menu, scoreboard, inventory, room rewards, area shop and game-over screens around a consistent dark-fantasy pixel UI language.
- Increased primary text, stats and touch targets while grouping information into clearer cards.
- Added dedicated HTML/CSS area-complete shop and run-complete screens so the most important choices are easier to scan and tap.
- Preserved the existing gameplay systems, authored gameplay art and slim mobile HUD.


## 0.3.8h — Elite Attack Patterns
- Added dedicated Elite Mage, Elite Zombie and Elite Skeleton sprite-sheet support from `assets/elites/`.
- Elite Mage uses a ranged 3-fireball fan volley, with spacing/retreat movement so it behaves differently from the Guardian Mage.
- Elite Zombie uses a telegraphed heavy melee lunge, then briefly retreats before re-engaging.
- Elite Skeleton uses a fast two-swing weapon combo with a short recovery window.
- Elite waves now select only the dedicated Mage/Zombie/Skeleton Elite archetypes.
- Existing Elite HP, damage, evade, shimmer, Rare+ loot, XP and 5× score systems remain intact.

## 0.3.8g — Elite Waves
- Added dedicated Elite waves that replace a normal wave when triggered, with depth-scaled frequency and 1–8 Elites per wave.
- Elites are 50% larger, have greatly increased health and damage, reduced stagger, a gold shimmer, heavy landing thud, and improved health bars.
- Elite kills award massive XP/score and a guaranteed Rare+ equipment cache, with a chance of an additional Rare+ weapon.
- Equipment drops use their correct helmet, chest-piece, and boots artwork.


## 0.3.8f — Armour & Equipment System

- Added Common, Uncommon, Rare, Epic and Legendary Iron equipment.
- Added Helmet, Chest Piece and Boots equipment slots with rarity-based bonuses, using the authored `helmet.png`, `chest-piece.png` and `boots(1).png` assets.
- Added physical equipment drops using the authored armour-drop asset; collected equipment is automatically equipped.
- Helmet provides critical-hit resistance, Chest Piece provides damage reduction, and Boots provide Evade.
- Added enemy critical hits so Helmet resistance has an active combat effect.
- Expanded the end-of-area screen to show the current equipment loadout alongside permanent upgrades.
- Expanded the inventory into a proper equipment layout using the authored Helmet, Chest Piece and Boots assets.
- Removed Move Speed from the level-up upgrade pool.
- Fixed the equipment drop slot roll so each equipment type has a consistent chance.

## 0.3.8e — Bug Hunt & Asset Direction Fixes

- Corrected projectile arrow orientation for the updated arrow asset, which is authored pointing cardinal North.
- Arrow rotation now maps North, East, South and West correctly from the projectile's travel direction.
- Removed the old procedural weapon-drop drawing fallback so a weapon drop cannot silently revert to the legacy sword/icon artwork.
- Preserved the authored weapon-drop asset and rarity marker as the only weapon-drop presentation.
- Restored the v0.3.8b behaviour that keeps enemy hurt animation without reducing enemy opacity or creating a hit blink.
- Cleaned the README so the top of the document is dedicated to game information rather than version/build details.
- Moved the 0.2.x history out of the active Change Log into the archive below.

## 0.3.8d — Player Movement Animation Fix

- Fixed an excessively fast player animation timer that caused movement to judder.
- Kept movement speed unchanged; only the animation timing was corrected.

## 0.3.8c — Evade System

- Added player Evade through equipped boots.
- Added rarity-based boot evade chances.
- Added enemy Evade chances for normal enemies, Elites and the Guardian.
- Added visible **EVADE!** combat feedback.
- Kept Evade separate from Critical Hit behaviour.

## 0.3.8b — Enemy Hit Stability

- Removed enemy hit-state opacity reduction/blinking while retaining the hurt animation and combat feedback.

## 0.3.8a — Death Remains

- Added authored enemy death-remains animations for Skeletons, Goblins, Bats and the Guardian.
- Added subtle blood-splat presentation beneath non-skeletal remains.

## 0.3.5b — Reward Flow

- Level-up reward choices now open when the player activates the cleared-room exit, alongside the end-of-room weapon reward flow.
- Level-up rewards no longer interrupt the final enemy death/combat moment.
- Door reward flow resolves weapon rewards, then pending level rewards, before transitioning to the next room or area shop.

## 0.3.5a — Hit Stability Fix

- Hardened the player damage path against invalid damage/position values.
- Isolated player-hurt audio failures from gameplay updates.

## 0.3.5 — Player Progression

- Added between-room level-up choices with three upgrade options.
- Added progressive player build stats for damage, max HP, movement speed, critical chance, attack speed and knockback.
- Added occasional Elite enemies with stronger stats, a gold aura and bonus score/XP.
- Added the first armour drop and automatic equipping.
- Added Bosses Killed and Stages Cleared to saved scoreboard records.
- Added progression and armour information to the inventory/player card.

## 0.3.4a — Polish & Atmosphere

- Gold and weapon pickups now use a subtle animated sparkle instead of the old wobble.
- Health pickups retain their wobble animation.
- Expanded the dungeon soundscape with torch crackle and room-archetype ambience.
- Exit and room transitions now include door close/open sounds.
- Added a clear-scoreboard control with confirmation.

## 0.3.3 — Combat Feel & Scoreboard

- Added end-of-run local date/time to scoreboard records.
- Added weapon weight movement profiles for Short Sword, Long Sword and Claymore.
- Added weapon-dependent critical hits with stronger impact, knockback, stagger, audio and feedback.

## 0.3.2 — Authored Gameplay Assets

- Added authored 32×32 RGBA PNG gameplay assets.
- Loot now uses authored Gold, Small Health, Full Health and Weapon Drop assets.
- Goblin arrows, fireballs and fireblasts use authored projectile assets.
- Enemy deaths use authored Skeleton, Goblin, Bat and Guardian remains.
- Added authored hit/impact spark effects while retaining lightweight procedural fallbacks where appropriate.

## 0.3.0 — Soundscape

- Added the procedural Web Audio soundscape for combat, enemies, projectiles, pickups, level-ups, room transitions, the shop and game-over feedback.
- Added subtle dungeon ambience including a low drone, air/noise, distant drips and movement footsteps.
- Audio starts from the Play gesture to work within mobile browser audio restrictions.

# Archived 0.2.x Development History

The 0.2.x releases are retained here as historical development records. They are no longer part of the active Change Log.

## 0.2.9

- Added paced enemy waves, with rooms arriving in distinct waves rather than one continuous spawn stream.
- Added room-to-room fade transitions showing the next room name and number.
- Added the Fortune shop upgrade for better weapon rarity chances.
- Optimised the cleared-room exit effect using pre-rendered animation frames.
- Tightened the escape trigger to the actual wooden doorway bounds.

## 0.2.8 / 0.2.8b / 0.2.8c

- Reworked the cleared-room exit presentation around the actual doorway.
- Added animated teal spectral smoke and golden spark effects.
- Removed the old hard-edged exit marker and EXIT label.
- Kept the exit invisible until the room is cleared.
- Optimised the exit effect with pre-rendered frames.

## 0.2.7

- Replaced the legacy procedural sword indicator with a facing-direction arrow.
- Removed the old procedural sword from the swing trail while retaining the swoosh.
- Standardised left/right side-facing character presentation.

## 0.2.6

- Added off-screen room caching for static floor, walls and props.
- Reduced expensive per-frame lighting and shadow work.
- Reduced the maximum canvas backing-device pixel ratio for mobile performance.
- Cached the current animation clock once per frame.

## 0.2.5

- Introduced the slim mobile HUD with Health, XP/Level and Purse information.
- Removed the mini-map.
- Added the central Inventory button and a paused inventory/player card.
- Added the authored modular floor, wall and prop environment pipeline.
- Added sparse, deterministic room decoration and doorway protection.

## 0.2.4

- Externalised modular Castle architecture and props into repository assets.
- Added deeper wall construction, doorway masonry, corner dressing and physical prop collision.

## 0.2.3

- Promoted the modular atlas into the live dungeon surface.
- Added reusable authored stone samples and repeatable brick wall presentation.
- Added surface wear, cracks and restrained depth treatment.

## 0.2.1

- Refined the Castle floor and masonry presentation through several graphical passes.
- Added reusable room layouts including Great Hall, Pillared Hall, Ruined Chamber, Chapel, Guard Room and Cross Hall.
- Added independent modular props and torch presentation.

## 0.2.0 REDO

- Overhauled the Castle presentation with richer authored pixel-art environment work.
- Added deterministic Castle room archetypes and decorative layouts.
- Added animated torch presentation and richer environmental depth.
- Reworked Bats and Goblins and added light enemy-synergy behaviour.
- Added a clearer room-clear rhythm and stronger Castle room identity.
- Added the requested Game Over **MAIN MENU** button.
- Updated the start-menu visual language, splash presentation and PWA artwork.

## v0.3.8n — Corridor, merchant and bug-fix pass
- Added the Corridor Route Choice as the progression step after room rewards: completed room → rewards/upgrade → corridor fork → left/right choice → next room.
- Expanded the corridor description pools to 24 varied hints per destination class, with deliberately overlapping/ambiguous wording so room types are not trivially identifiable.
- Hardened corridor choice generation so the two sides always lead to different destination types and the corridor overlay cannot sit behind another UI layer.
- Implemented Merchant Room layouts using the three authored stall variants: top-left, top-centre and top-right. The merchant stands directly in front of the selected stall.
- Merchant Room torches are deliberate: three opposite corners for side stalls, four corners for the centre stall. Remaining merchant assets use fixed, hand-authored placements rather than random scattering.
- Fixed end-of-area equipment artwork rendering with fallback path resolution for Helmet, Chest Piece and Boots.
- Corrected character sprite row mapping to the supplied 512×96 (16×3) sheets so hurt/death states do not address nonexistent rows.
- Kept authored North-facing orientation explicit for goblin arrows and Elite Mage fireballs.
- Build ZIP contains code + README only; assets remain external and are not bundled.


## v0.3.8n
- Enlarged and deliberately composed Merchant Room stall/merchant presentation to better match the approved mock-up.
- Kept the three stall positions and corresponding 3/4 torch rules.
- Hardened Corridor Route Choice overlay/transition handling so the fork reliably appears after room rewards and accepts touch input.
- Preserved varied, ambiguous corridor hints.
- Hardened Area Complete equipment artwork display with fallback rendering when an image path fails.
