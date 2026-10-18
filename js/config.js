// Everything you are likely to tweak lives here.
export const CONFIG = {
  // Generated from a BG Stats export by tools/import-bgstats.ps1
  dataFile: 'data/council.json',
  // Front-page articles. Add an entry to publish one; the newest is always on top.
  articlesFile: 'data/articles.json',

  // Masthead
  title: 'The Galactic Council',
  motto: 'Minutes of the Council, as recorded from Mecatol Rex',
  dateline: 'MECATOL REX',
  price: 'PRICE: ONE TRADE GOOD',

  // BG Stats location names, as shown on the site
  locationNames: { Elders: 'Away', Thuis: 'Home', 'Zonder mij': 'Without Sem' },

  // Stats
  pointsToWin: 10,          // used when a session has no winner marked
  lastN: 5,                 // the "Last N" edition
  rivalryMinGames: 3,       // delegates need this many sessions to appear in the head-to-head table
};
