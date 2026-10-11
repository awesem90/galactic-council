// Every stat is a pure function of (games, range).
import { CONFIG } from './config.js';
import { FACTIONS } from './factions.js';

export const pct = (w, g) => g ? Math.round(w / g * 100) : 0;
export const dec1 = v => v.toFixed(1);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dateOf = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
export const shortDate = iso => { const d = dateOf(iso); return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`; };
export const longDate = iso => { const d = dateOf(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
export const fmtMinutes = m => Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm';
const mean = list => list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;

// Most-used value; ties go to the most recent use.
function mostUsed(list) {
  const c = new Map();
  list.forEach((v, i) => { const e = c.get(v) || { n: 0, last: 0 }; e.n++; e.last = i; c.set(v, e); });
  let best = null, be = null;
  for (const [v, e] of c) if (!be || e.n > be.n || (e.n === be.n && e.last > be.last)) { best = v; be = e; }
  return best;
}

export function computeStats(allGames, { range }) {
  const games = range === 'last' ? allGames.slice(-CONFIG.lastN) : allGames;

  const P = new Map(); // delegate -> stats
  const F = new Map(); // faction -> stats
  const player = name => {
    if (!P.has(name)) P.set(name, { name, games: 0, wins: 0, vp: [], places: [], results: [], factions: new Map(), log: [], speaker: 0, speakerWins: 0, nearMisses: 0 });
    return P.get(name);
  };

  for (const g of games) {
    for (const s of g.seats) {
      const p = player(s.player);
      p.games++; p.vp.push(s.vp); p.places.push(s.place); p.results.push(s.win);
      p.log.push({ game: g, seat: s });
      if (s.win) p.wins++;
      if (s.speaker) { p.speaker++; if (s.win) p.speakerWins++; }
      if (!s.win && s.vp >= g.target - 1) p.nearMisses++;
      const pf = p.factions.get(s.faction) || { name: s.faction, games: 0, wins: 0, vp: [] };
      pf.games++; pf.vp.push(s.vp); if (s.win) pf.wins++;
      p.factions.set(s.faction, pf);

      const f = F.get(s.faction) || { name: s.faction, games: 0, wins: 0, vp: [], pilots: new Map(), last: '' };
      f.games++; f.vp.push(s.vp); if (s.win) f.wins++;
      f.last = g.date;
      const pl = f.pilots.get(s.player) || { name: s.player, games: 0, wins: 0 };
      pl.games++; if (s.win) pl.wins++;
      f.pilots.set(s.player, pl);
      F.set(s.faction, f);
    }
  }

  const players = [...P.values()].map(p => ({
    ...p,
    rate: pct(p.wins, p.games),
    avgVp: mean(p.vp),
    avgPlace: mean(p.places),
    bestVp: Math.max(...p.vp),
    form: p.results.slice(-5),
    mainFaction: mostUsed(p.log.map(l => l.seat.faction)),
    factionList: [...p.factions.values()].map(f => ({ ...f, avgVp: mean(f.vp) }))
      .sort((a, b) => b.games - a.games || b.wins - a.wins || a.name.localeCompare(b.name)),
  // Council standing: most wins, then win rate, then average victory points.
  })).sort((a, b) => b.wins - a.wins || b.rate - a.rate || b.avgVp - a.avgVp || b.games - a.games || a.name.localeCompare(b.name));
  players.forEach((p, i) => { p.rank = i + 1; });

  const factions = [...F.values()].map(f => ({
    ...f,
    rate: pct(f.wins, f.games),
    avgVp: mean(f.vp),
    bestVp: Math.max(...f.vp),
    pilotList: [...f.pilots.values()].sort((a, b) => b.games - a.games || a.name.localeCompare(b.name)),
  })).sort((a, b) => b.wins - a.wins || b.avgVp - a.avgVp || b.games - a.games || a.name.localeCompare(b.name));
  const unplayed = Object.keys(FACTIONS).filter(n => !F.has(n));

  // ----- Head to head: how often A finished above B when both sat at the table -----
  const h2hNames = players.filter(p => p.games >= CONFIG.rivalryMinGames).map(p => p.name);
  const vs = {};
  for (const g of games) for (const a of g.seats) for (const b of g.seats) {
    if (a === b) continue;
    const t = ((vs[a.player] ||= {})[b.player] ||= { games: 0, ahead: 0 });
    t.games++; if (a.place < b.place) t.ahead++;
  }
  const matrix = h2hNames.map(a => ({
    name: a,
    cells: h2hNames.map(b => a === b ? null : { vs: b, games: vs[a]?.[b]?.games || 0, ahead: vs[a]?.[b]?.ahead || 0 }),
  }));

  // ----- Session-level figures -----
  const withSpeaker = games.filter(g => g.seats.some(s => s.speaker));
  const speakerWins = withSpeaker.filter(g => g.seats.some(s => s.speaker && s.win)).length;
  const speakerChance = mean(withSpeaker.map(g => 100 / g.seats.length));
  const withRounds = games.filter(g => g.rounds);
  const timed = games.filter(g => g.minutes);
  const decided = games.filter(g => g.margin !== null);
  const pick = (list, better) => list.reduce((m, g) => (!m || better(g, m) ? g : m), null);
  const nearMiss = players.filter(p => p.nearMisses).sort((a, b) => b.nearMisses - a.nearMisses || a.wins - b.wins)[0] || null;

  return {
    range, games, allGames, players, factions, unplayed, matrix, vs,
    seats: games.reduce((n, g) => n + g.seats.length, 0),
    avgSeats: mean(games.map(g => g.seats.length)),
    avgRounds: mean(withRounds.map(g => g.rounds)),
    avgMinutes: Math.round(mean(timed.map(g => g.minutes))),
    longest: pick(timed, (g, m) => g.minutes > m.minutes),
    shortest: pick(timed, (g, m) => g.minutes < m.minutes),
    closest: pick(decided, (g, m) => g.margin <= m.margin),
    blowout: pick(decided, (g, m) => g.margin > m.margin),
    speakerGames: withSpeaker.length, speakerWins, speakerRate: pct(speakerWins, withSpeaker.length), speakerChance,
    nearMiss,
    topFaction: factions.slice().sort((a, b) => b.games - a.games || b.wins - a.wins)[0] || null,
  };
}
