// Keeps outside locations on the same season chosen at the Well of Seasons.
// Put this script right after the location's main JS file.

(function(){
  const season = localStorage.getItem('currentSeason') || 'summer';

  const seasonFileParts = {
    spring: 'spring',
    summer: '',
    fall: 'fall',
    winter: 'winter',
    night: 'night',
    rainy: 'rainy'
  };

  const pageMapNames = {
    'helipad.html': 'helipad-map',
    'cherry-lake.html': 'cherry-lake-map',
    'shopping.html': 'shopping-map'
  };

  const page = location.pathname.split('/').pop() || 'index.html';
  const baseName = pageMapNames[page];

  if(!baseName || typeof map === 'undefined') return;

  const part = seasonFileParts[season];
  const normalMap = `assets/maps/${baseName}.png`;
  const seasonalMap = part ? `assets/maps/${baseName}-${part}.png` : normalMap;

  map.onerror = () => {
    map.onerror = null;
    map.src = normalMap;
  };

  map.src = seasonalMap;
})();