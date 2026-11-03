# Our year expansion

The Speed Force run now ends in **Our Little World**, a personal memory neighborhood. The existing forest swing still lands in **Skyroot Grounds**. Its artwork, spawn, collision, lift, prayer spaces, and events are retained. Only the **upper treehouse artwork and activities** and the **running sequence’s final destination** change among the existing maps. The mall receives the requested necklace moment and Atelier entrance; all maps share custom outfits.

## Places and scale

- The upper treehouse keeps the old 1536 × 1024 footprint, lift, bridges, and floor connections. Its 74-pixel characters fit roughly 100-pixel door openings. Furniture has collision; the rooms open activities with **E**.
- The final neighborhood uses 44-pixel characters against 45–60-pixel doorways in the source artwork. A following camera presents them at about 79 screen pixels at its normal zoom. **Whole map** changes the camera, keeping the same character-to-world ratio.
- Mountain and festival scenes are parts of the new destination. They do not replace the grounds or the four temporary multiverse realities.
- Closing an upstairs memory returns to the same room and player positions. The upper gallery can replay every memory.

## Memories and events

| Memory | Interaction |
| --- | --- |
| Welcome home | Hang the banner, flowers, dinner, and a walk-in reunion |
| Birmingham skies | Separate eclipse, blood moon, blue moon, meteor, and planet memories; partial progress resumes |
| Railroad Park | Walk between four lamplights, then sit together |
| Regions Field | Three swings, followed by animated fireworks |
| First swim | Kick and move across the pool together |
| Topgolf | Aim and power, ball flight, target scoring, five-ball scorecard |
| Jeep Invasion | Road trip, Jeep gathering, event grounds, mountain overlook |
| Astra Lumina | All ten named trail experiences from the supplied sign, each with its own scenery and light effect; resume mid-trail; final photobooth |
| Usha Uthup concert | Original concert photos and a responsive stage-light rhythm replay |
| Durga Puja | Light four diyas and share a quiet moment |
| Puja ring | Open the ring box and keep the gift memory |
| Festival of India and community | Four distinct festival visits, alongside the supplied flyer |
| The Great Pumpkin Patch | Select two pumpkins by pointer or keyboard |
| Pumpkin carving | Two pumpkins; freehand cuts, classic and skull stencils, undo, candle glow, saved designs |
| Warehouse31 | Stay together through four rooms; optional gentle scares |
| Addams Halloween | Save and equip matching Morticia and Gomez-inspired looks |
| Our first yes | The original mall scene now gives the Flash necklace before the question; saves the keepsake and wearable accessory |

The trip scenes are creative personal replays. They do not claim exact celestial positions, a day-by-day Jeep Invasion itinerary, or names/dates for community gatherings that were not supplied. The concert replay does not reproduce a recording of a copyrighted song. Existing music remains available upstairs; the new destination offers original optional note effects.

## Tanima’s Atelier

Access from Love Mall, the changing room, the upstairs creator room, or the new destination. Design a saree, dress, or suit; choose fabric, trim, patterns, and painted strokes. View all four walking directions, name and save designs, equip them across the game, and export/import a design JSON file. Existing built-in outfit choices remain available.

Designs use original character sheets, preserving frame dimensions, padding, alpha, and the face area. The Flash necklace is an accessory. **Run and swing sprite sheets keep their cutscene costumes**; the selected ordinary look returns at the end of the run.

Memories and outfits save locally in the current browser, following the existing game’s approach. There is no new account or cloud synchronization. Design export/import supports moving an outfit between devices.

## Controls

| Control | Action |
| --- | --- |
| WASD | Ashton |
| Arrow keys | Tanima |
| E near a place | Enter the location, start a scene, or use an activity’s primary action |
| Click a path | Both characters walk there using obstacle-aware routes in the new destination |
| J | Memory journal in the new destination |
| M / Whole map | Toggle overview and walking camera |
| Touch pads and E | Movement and interaction on touch devices |
| Escape / Close | Close the memory before resuming exploration |

## Validation

Run `npm install` once for the test-only development dependencies, then `npm test`. The website itself remains static HTML/JavaScript with no build or runtime dependency installation.

Tests exercise activity completion, saved progress, aimed shots, freehand carving, distinct visits, the original necklace choreography, every destination entrance’s route, preserved ground assets/configuration, the final Speed Force route, and character face/alpha preservation across all sixteen wardrobe frames.

Desktop browser QA covers loading the upper floor, opening and returning from inline memories, the destination’s arrival and camera views, and the mall/studio flow. Device-specific touch layout still needs a real phone pass.

## Artwork

New artwork uses the built-in image generator; prompts and paths are recorded in `OUR_YEAR_ART_PROMPTS.json`. WebP copies are the browser assets. Original user photos remain unchanged; display framing removes the surrounding phone UI where possible. Receipt screenshots and the Google search screenshot are references only, not published game assets.
