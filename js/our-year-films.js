// Hand-staged films. Captions describe the supplied memories; they are not
// invented quotations. Times are seconds and are shared by the game/gallery.
(function () {
  'use strict';
  const shot = (title, caption, duration, action, camera) => ({title, caption, duration, action, camera: camera || [480, 285, 1.025]});
  const films = {
    homecoming: [
      shot('Getting everything ready', 'Flowers. Dinner. A room waiting for her.', 7, 'prepare'),
      shot('The door opens', 'After all that waiting, she is finally home.', 8, 'arrive'),
      shot('Finally, right here', 'The distance ends in an embrace.', 9, 'embrace', [490, 310, 1.20]),
      shot('Home is us', 'A kiss, then dinner together under the welcome-home banner.', 9, 'dinner')
    ],
    sky: [
      shot('A city beneath the stars', 'Birmingham at night. The two of us looking up.', 6, 'arrive'),
      shot('Lunar eclipse', 'Watching the shadow travel across the Moon together.', 10, 'eclipse'),
      shot('Blood moon', 'The night the Moon glowed red above us.', 9, 'blood'),
      shot('Blue moon', 'Another special full moon, another night beside you.', 9, 'blue'),
      shot('Meteor shower', 'One streak, then another. We keep looking up.', 10, 'meteors'),
      shot('Planets over Birmingham', 'Finding several little worlds in the same night sky.', 10, 'planets'),
      shot('Our corner of the universe', 'All those skies. One person to share them with.', 7, 'lean')
    ],
    park: [
      shot('Railroad Park Foundation after dark', 'A quiet path through the lights of Birmingham.', 7, 'establish'),
      shot('No need to hurry', 'Walking together from one pool of lamplight to the next.', 10, 'walk'),
      shot('A bench for two', 'We stop, sit down, and let the city carry on around us.', 8, 'sit'),
      shot('Stay a little longer', 'A shoulder to lean on. The moon above the trees.', 9, 'lean', [545, 330, 1.13])
    ],
    baseball: [
      shot('Her first game', 'Taking our seats at Regions Field.', 7, 'arrive'),
      shot('Under the stadium lights', 'A pitch, a swing, and a ball climbing into the night.', 9, 'play'),
      shot('The crowd rises', 'Clapping together for a first baseball memory.', 7, 'cheer'),
      shot('And then, fireworks', 'The game ends. The sky has one more surprise.', 12, 'fireworks'),
      shot('Beside you through it all', 'Watching the last colors fall over Birmingham.', 7, 'lean')
    ],
    swimming: [
      shot('Pool day at Alight', 'Her first time swimming. You are right beside her.', 7, 'edge'),
      shot('Into the water together', 'One careful step, then a little splash.', 7, 'enter'),
      shot('We have got this', 'A reach, a kick, and another stroke across the pool.', 12, 'swim'),
      shot('A little splash', 'Getting comfortable enough to play.', 7, 'splash'),
      shot('One more first, together', 'Resting at the pool edge after making it across.', 7, 'rest')
    ],
    topgolf: [
      shot('One more first', 'The bright targets and the nighttime range at Topgolf.', 6, 'establish'),
      shot('Her turn', 'Tanima lines up the club and takes her shot.', 10, 'herShot'),
      shot('Your turn', 'Ashton steps up. The ball arcs toward the lights.', 10, 'hisShot'),
      shot('That one counts', 'A glowing target, a little celebration, and another turn together.', 8, 'cheer')
    ],
    jeep: [
      shot('The road to the mountains', 'Our Jeep Invasion trip begins in Charizard, our orange Wrangler.', 10, 'drive'),
      shot('Jeeps everywhere', 'Walking past the rows at the Jeep gathering.', 10, 'gathering'),
      shot('The event grounds', 'The booths, the vehicles, and the two of us exploring.', 10, 'grounds'),
      shot('A mountain pause', 'Stopping at the overlook before our night amongst the stars.', 9, 'overlook'),
      shot('The night walk is waiting', 'Next stop: Astra Lumina.', 6, 'astra')
    ],
    astra: [
      shot('Astra Archway', 'Through the luminous arch, into our night amongst the stars.', 9, 'arch'),
      shot('Falling Stars', 'Falling points of light drift through the trees around us.', 9, 'falling'),
      shot('Cosmic Choir', 'The forest glows in breathing circles of light.', 9, 'choir'),
      shot('Stardust Rays', 'Rays of starlight stretch between the trees.', 9, 'rays'),
      shot('Nebular Waves', 'Soft waves of color move across the clearing.', 9, 'waves'),
      shot('Stellar Visions', 'We stop together beneath a celestial vision.', 9, 'visions'),
      shot('Celestial Trail', 'Small lights guide our footsteps along the path.', 9, 'trail'),
      shot('Astral Genesis', 'A bright little universe seems to wake in the forest.', 9, 'genesis'),
      shot('Rise of the Stars', 'The lights begin to rise back toward the sky.', 9, 'rise'),
      shot('Our starlit photobooth', 'A pose, a flash, and one more memory from this night.', 10, 'photo')
    ],
    concert: [
      shot('A night in Atlanta', 'Taking our places for Usha Uthup, live on stage.', 7, 'arrive'),
      shot('Skyfall', 'The lights turn blue as Usha Uthup sings “Skyfall.”', 11, 'perform'),
      shot('Lost in the moment', 'Clapping and swaying together in the audience.', 10, 'dance'),
      shot('One more round of applause', 'An Atlanta concert we got to share.', 8, 'applause')
    ],
    puja: [
      shot('Durga Puja in Atlanta', 'The decorated entrance. A celebration to share.', 8, 'arrive'),
      shot('Walking through the celebration', 'Marigolds, alpona, and the glow of the pandal.', 9, 'walk'),
      shot('Four little lights', 'We light the diyas together, one by one.', 10, 'lamps'),
      shot('A quiet moment', 'Standing side by side in the warmth of the lamps.', 9, 'prayer'),
      shot('A little more time together', 'The celebration carries on around us.', 7, 'leave')
    ],
    ring: [
      shot('For my Lokkhi', 'The roses, the wrapped gift, and your handwritten note.', 7, 'table'),
      shot('Something for her', 'Ashton passes the little box to Tanima.', 8, 'give'),
      shot('The box opens', 'The Swarovski ring catches the light.', 9, 'open'),
      shot('A Puja memory to keep', 'A gift, a smile, and a moment close together.', 9, 'embrace')
    ],
    community: [
      shot('Festival of India', 'Sharing her community, and making memories of our own.', 7, 'arrive'),
      shot('Culture and performances', 'Colorful fabric and dancers turning across the stage.', 9, 'culture'),
      shot('Drama', 'A little stage, a story, and two people watching together.', 8, 'drama'),
      shot('Kirtan and bhajan', 'Musicians, moving hands, and the gathering around them.', 9, 'music'),
      shot('A meal together', 'Sitting down to a vegetarian feast.', 9, 'meal'),
      shot('More days like this', 'A little chapter for the celebrations we shared after February 14.', 7, 'leave')
    ],
    pumpkins: [
      shot('The Great Pumpkin Patch', 'The red barn, the wagon, and an autumn day together.', 7, 'arrive'),
      shot('Finding our favorites', 'Walking through the patch to choose a pair.', 10, 'choose'),
      shot('This one and that one', 'We crouch down and lift our pumpkins.', 8, 'pick'),
      shot('Two pumpkins, two smiles', 'One picture by the wagon before we take them home.', 8, 'pose')
    ],
    carving: [
      shot('An evening at the table', 'Two pumpkins. Two ideas. A little mess.', 7, 'table'),
      shot('Making the first cuts', 'Tanima works on her classic face. Ashton carves a skull.', 12, 'carve'),
      shot('Lights inside', 'The candles go in. The room gets darker.', 8, 'light'),
      shot('Look what we made', 'A classic jack-o’-lantern and a skull glowing side by side.', 9, 'reveal')
    ],
    haunt: [
      shot('Warehouse31 · Unchained', 'At the entrance together. Time to go in.', 8, 'entrance'),
      shot('The chain room', 'A rattle in the dark. We move a little closer.', 9, 'chains'),
      shot('The mirror hall', 'Our reflections follow us past the next doorway.', 9, 'mirrors'),
      shot('Through the fog', 'Stay together. The exit is just ahead.', 9, 'fog'),
      shot('Back outside', 'A breath of relief, then a hug under the exit light.', 8, 'exit')
    ],
    addams: [
      shot('Our Halloween', 'Gomez and Morticia. Ashton and Tanima.', 7, 'reveal'),
      shot('A rose for Morticia', 'A little flourish, a red rose, and matching dark outfits.', 9, 'rose'),
      shot('A turn around the room', 'The two of us, dancing through Halloween.', 11, 'dance'),
      shot('Good night from the Addams', 'A close pose, a flash, and our Halloween keepsake.', 8, 'pose')
    ],
    necklace: [
      shot('At the shopping mall', 'Our photo-booth day, before the question.', 7, 'booth'),
      shot('The Flash necklace', 'Ashton gives Tanima the necklace.', 9, 'gift'),
      shot('The question', 'The moment you asked her to be your girlfriend.', 8, 'ask'),
      shot('Her yes', 'She comes closer. You meet in a hug and a kiss.', 10, 'yes'),
      shot('Four little frames', 'The necklace. The question. The yes. The kiss.', 9, 'print')
    ]
  };
  Object.values(films).forEach(shots => { let at = 0; shots.forEach(s => {s.start = at; at += s.duration;}); });
  window.OurYearFilms = {
    films,
    get: id => films[id],
    duration: id => films[id].reduce((n, s) => n + s.duration, 0),
    locate(id, time) {
      const list = films[id];
      const index = Math.max(0, list.findIndex((s, i) => time < s.start + s.duration || i === list.length - 1));
      const s = list[index];
      return {shot: s, index, progress: Math.max(0, Math.min(1, (time - s.start) / s.duration))};
    }
  };
})();
