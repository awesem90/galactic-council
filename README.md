# The Galactic Council

The record of our Twilight Imperium (4th edition) games: standings, factions, head-to-heads and every session. It's a plain static site (HTML, CSS and JS, with no build step), and all game data comes from a BG Stats export.

Live: https://awesem90.github.io/galactic-council/

## Updating the data

1. In BG Stats, export your data (`BGStatsExport.json`).
2. Run the importer:
   ```
   powershell -ExecutionPolicy Bypass -File tools\import-bgstats.ps1 -Export "C:\Users\sem_m\Downloads\BGStatsExport.json"
   ```
3. Commit and push `data/council.json`. GitHub Pages republishes in about a minute.

The importer:
- keeps only *Twilight Imperium: Fourth Edition* plays (BGG id 233078) where players have a faction, which is the BG Stats "role" field;
- takes each delegate's faction, victory points (the score), the winner, the speaker (the start player), rounds, duration and location;
- splits the BG Stats "board" field into setup tags (`Map: Milty Draft`, `Factions: All Pick`, `Total War`…) and lists the expansions used (PoK, Codex I–III);
- does **not** publish the play comments, which are private notes.


## Articles

The front page is a newspaper: the written reports from `data/articles.json`, stacked newest on top. Order goes by `date` (and an optional `time`); on a tie, the entry added later wins. To publish one, add an entry like this anywhere in the list:

```json
{
  "id": "2026-10-fall-of-argent",
  "date": "2026-10-18",
  "kicker": "Session report",
  "headline": "Empyrean Seizes the Galaxy Through Mallice",
  "deck": "The subheadline.",
  "byline": "By our correspondent at Mecatol Rex",
  "image": "assets/articles/empyrean-rules-the-galaxy.jpg",
  "caption": "Photo caption.",
  "body": ["A paragraph. *Faction names* in asterisks become italics.", { "head": "A subheading" }, { "quote": "A pull quote." }],
  "numbers": [["Factions in contention", "7"]]
}
```

Put images in `assets/articles/` (a JPG around 1600 px wide works well). Source artwork, such as the SVG behind the Empyrean illustration, lives in `tools/art/`.

## Files

| File | What it does |
|---|---|
| `index.html` | Page shell (fonts, CSS, script) |
| `css/style.css` | All styling (colour tokens at the top) |
| `js/config.js` | **Settings**: title, motto, location names, the "Last N" range, the head-to-head threshold |
| `js/factions.js` | Every faction with a short name and a sigil colour |
| `js/data.js` | Loads `data/council.json` and `data/articles.json`, works out each seat's place and the winning margin |
| `js/stats.js` | Every stat (wins, average VP, average place, near misses, speaker edge, head-to-head…) as pure functions |
| `js/render.js` | HTML for every page |
| `js/app.js` | Routing (`#/` front page, `#/assembly`, `#/delegate/<name>`, `#/factions`, `#/sessions`, `#/sessions/<name>`), ranges, caching |
| `data/council.json` | The sessions, made by the importer |
| `data/articles.json` | Front-page articles |
| `tools/import-bgstats.ps1` | BG Stats export → `data/council.json` |
| `tools/serve.ps1` | Local preview at http://localhost:8766/ |

## Pages

- **Front Page**: the newspaper, with every article newest first, under the masthead.
- **Assembly**: the lead story (generated from the stats), key figures, the standings, notes from the minutes (closest finish, near misses, the speaker's edge…), the latest session, faction power and the head-to-head table.
- **Delegates**: a profile per player, with wins, average VP and place, near misses, factions played, how often they finished above each other delegate, and every session.
- **Factions**: every faction fielded, by wins and win rate, with the average length of its sessions and who played it, plus the factions that have yet to take a seat.
- **Sessions**: every game, with each delegate's place, faction and VP track, the starting speaker, the setup and the expansions.

The range switch (*All sessions · Last 5*) is remembered per page. Standings rank by wins, then win rate, then average victory points.

## Hosting

GitHub Pages serves the `main` branch from the repo root. Every push redeploys the site.
