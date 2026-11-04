# Our walkable memory adventure

Open `memory-adventure.html`. The Places menu previews and enters all 14 maps;
none needs farm progress. The neighborhood, journal, and upstairs memories enter
the matching place with E. A replay link returns to the existing film gallery.
The original mall still holds the Flash necklace/photo-booth sequence and Atelier.
The original ground landing and forest swing have no changes in this release.

The Places menu is also the map-to-memory guide: every card names the actual
occasion that its map represents. Homecoming, the Puja ring, and pumpkin carving
share the apartment; the five sky memories share the Birmingham overlook.

## Photo-matched homecoming and occasion outfits

The apartment's central living room now follows the newer `IMG_8484.jpeg` and
`IMG_8488.jpeg` references: cream wall, black leather sofa, beige cushion, two
gold fringe curtains, gold WELCOME, large white HOME, and gold love balloon.
The coffee table carries the sticker-covered laptop, red roses, red soda can,
plates, pink curry bowl, rice pot, and sweets tray. The pink striped bag sits
beside the sofa. Peripheral activity nooks keep the ring, wardrobe, and carving
interactions reachable. The room opens with the full setup in view.

Tanima's homecoming scene uses her light-blue T-shirt and patterned shorts from
the photos. Pool entry changes the couple into a teal bikini and navy swim
trunks; climbing out or leaving the pool restores their selected walking
outfits. These scene changes do not overwrite the saved wardrobe. The film
replays use the corresponding occasion outfits too.

More controls → Occasion outfits offers each of the three looks with a preview
and an explicit Wear everywhere action. The same collection is in Tanima's
Atelier. Ready-made looks retain their original art; fabric painting remains
available for custom designs. All three new sheets are transparent 1024 × 1024,
4 × 4 atlases with a fixed feet baseline and four walking directions.

The environment is a game-art recreation of the visible living room. Spaces
outside the supplied photos remain playable interpretations rather than claims
about the apartment's full floor plan. Artwork briefs and packing details are
recorded in `OCCASION_ART.json`.

These are places to walk around, with actions and scenes staged on their own
floors, benches, water, roads, and stages. Photographs do not supply the maps or
performers. The supplied photos inform the scenery. Game characters retain the
original sprites; articulated crops animate embraces, gifts, seated poses,
swimming, applause, dancing, prayer, picking, and golf swings. Camera framing
widens for the sky, driving, and fireworks so the environment remains visible.

## Places and things to do

| Map | Exploration and interactions | What carries onward |
| --- | --- | --- |
| Welcome-home apartment | Collect roses, hang the gold banner, place flowers, set dinner, then reunite. Open the Puja ring together. Carve both pumpkins at the table. | Reunion keepsake, ring, saved glowing carvings, Atelier entrance |
| Birmingham sky overlook | Choose an eclipse, blood moon, blue moon, meteor shower, or planets at the telescope. Watch each from the blanket. | All five skies saved separately; star chart |
| Railroad Park | Follow lamplights, pause by the pond, sit together on the bench. | Park keepsake; path up to the sky overlook |
| Regions Field | Collect tickets; buy concessions or a souvenir; watch an animated pitch and hit; stay seated for fireworks. | Tickets, treats, souvenir, fireworks keepsake |
| Alight pool | Buy a float; enter at the ladder; actually steer both swimmers across the pool; climb out; rest at the loungers. | Float appears on the water; first-swim ribbon |
| Topgolf | Set aim and power, swing five balls, watch each flight, score target rings; celebrate or visit the snack stand. | Latest scorecard and saved rounds; food and lucky ball |
| Jeep Invasion | Drive the mountain road, walk two rows of Jeeps, find three collectible ducks, browse the stand, pause at the overlook. | Ducks, badge, optional treats; direct route to Astra |
| Astra Lumina | Walk the connected forest trail through all ten named installations in order. Each stop animates lights around the couple; last stop flashes the photobooth. | Ten saved stops and a starlit keepsake |
| Usha Uthup concert | Pick up a program, take seats, watch the singer and band under moving lights, sway and applaud. | Program, tickets, refreshments |
| Atlanta Durga Puja | Collect marigolds, light four individual diyas, share a quiet moment at the pandal, visit the sweet stand. | Celebration keepsake, sweets; route home to the ring |
| Festival of India and community | Cultural performance, drama, kirtan/bhajan, then the vegetarian feast. Browse food and fabric. | Community keepsake; fabric becomes a saved saree design in the Atelier |
| Great Pumpkin Patch | Walk the field and choose exactly two pumpkins; take a wagon portrait; visit the farm stand. | The pair travels home for carving; portrait and cider |
| Warehouse31 | Follow doorways through the chain room, animated reflections, and fog, then embrace at the exit. | Ticket keepsake; next stop is the Addams party |
| Addams Halloween | Explicitly equip shared Gomez/Morticia-inspired outfits, collect a rose, dance, pose, and visit the treat table. | Wardrobe looks, rose, portrait, treats |

The ten Astra stops are Astra Archway, Falling Stars, Cosmic Choir, Stardust Rays,
Nebular Waves, Stellar Visions, Celestial Trail, Astral Genesis, Rise of the Stars,
and the starlit photobooth. Order and partial progress persist between visits.

## Movement, scenes, and saves

WASD moves Ashton, arrow keys move Tanima. Click a path to route both around
solid objects. E, the on-screen interaction button, or touch E uses the nearest
spot. Whole map/M changes the camera. Bag/B opens inventory; Places opens the
travel atlas. Things to do offers keyboard-accessible choices that route the
couple to an activity, where E performs the action. Touch pads are available on touch devices. The pool blocks walking
until entry; its swimmers then use the same controls. The park pond and golf range
remain off limits to ordinary walking.

Scenes gather the couple along actual walking routes, ease into their poses,
then return to exploration. Pause and Escape/Return to exploring are available.
A scene's completion reward is saved after its ending. Collecting a pumpkin or
hanging a banner saves that direct action immediately. Replaying does not award
a collectible or discovery coins again. The gift and outfit choices stay explicit.

`ourYear.adventure.v1` in localStorage holds the shared bag, visits, task flags,
120 starting game coins, chosen sky, and latest 20 golf rounds. These are optional
game purchases, with no payment flow. Discoveries earn coins once. Snacks can be
shared in a little in-world scene. Unique souvenirs are bought once. Map positions
last within the current session. Existing memory and wardrobe save formats remain
intact; there is no new account or cross-device cloud save.

## Layout, scale, and artwork

Each map is 1536 × 1024. Visible character height is 74 pixels outdoors, 96
pixels in most interiors, and 128 in the photo-based apartment to fit its sofa.
These proportions follow the original forest and cabin scales. Transparent
atlas padding is excluded when sizing actors. `js/adventure-places.js` retains
memory and save IDs; `js/adventure-layouts.js` aligns footprints, paths, seats,
water, stage positions, and interaction nodes with the replacement artwork.
`js/adventure-geometry.js` supplies solid footprints and pathfinding. Painted WebP
scenery follows those layouts; changing zoom preserves the world scale. Four
full-size map images are cached at once, with small atlas thumbnails. Dynamic
pumpkins, flowers, gifts, water ripples, floats, lamps, stage lights, band members,
reflections, baseball flight, stars, and fireworks render over the artwork.

The replacement artwork uses the original cabin, mall, forest grounds, and main
map as direct style references: textured timber and stone, dense irregular
foliage, layered furniture, amber lanterns, and deep shadows. Full prompts and
targeted edits are recorded in `ART_STYLE_RESTORE.json`. Three transparent 4 × 4
atlases provide animated performers, baseball players, and detailed collectibles.
`scripts/pack-adventure-atlases.cjs` normalizes supporting atlases without changing
the original player sheets. If artwork fails to download, a retry curtain keeps
the unfinished map hidden. There is no schematic scenery fallback.

The compact brown-and-gold HUD follows the original game's monospace controls.
Scenes fade the navigation away. The default camera shows more scenery; the
additional overview, sound, and replay buttons sit under the ⋯ menu. World and
scene pauses preserve character pose time. Grid routes snap precisely to safe
waypoints so floating-point drift cannot catch characters at furniture corners.

These are stylized playable interpretations, rather than measured real venues.
The trip currently has show rows, a drive, ducks, vendors, and an overlook; an
exact Jeep Invasion itinerary requires the couple's details. The extra community
celebrations share one map until their names and activities are supplied. Sky
positions are illustrative. Script captions are authored narration, not attributed
quotes. The concert has an animated visual performance and optional original note
cues, without a Usha Uthup song recording. The haunted map uses chains, reflections,
and fog rather than sudden loud jump scares.

Helpful references for a more personal pass: wide shots of the Jeep event and
route, the concert hall and seating, the Puja entrance and pandal, and other
community events; the actual Jeep/year/color for this trip; the sequence of the
homecoming; and any exact dialogue the couple wants preserved.

## Verification and preview

`npm test` runs 32 checks for the existing game and new adventure. It covers all
map entrances and activity routes, character scale, bag and coin persistence,
duplicate rewards, two-pumpkin carrying, scene prerequisites, native swimming,
five scored golf flights, all ten ordered Astra stops, animated performers and
reflections, full transparent atlas cells, physical traversal of every new route,
and camera coverage of skies/fireworks. Existing film, wardrobe,
original necklace, run destination, swing, and ground-map regressions are included.
Occasion checks also verify all sixteen transparent walking cells, fixed feet,
saved preset outfits, temporary swim/homecoming clothes, and wardrobe restoration.

`RENDER_MAPS=/absolute/folder npm test` exports map stills. To export the actual
map-engine tour with FFmpeg installed:

```sh
MAP_TRAILER=docs/previews/adventure-tour.mp4 node --test --test-name-pattern='export an adventure tour' tests/our-year.test.cjs
```

`docs/previews/adventure-tour.mp4` samples all 14 maps, with a separate fireworks
shot. It uses the same sprites, map renderer, camera, and actions as the browser.
Browser QA additionally checks real navigation, inventory, collecting, shops, and
scene controls. A physical-phone pass remains useful for touch ergonomics.
