// Loads data/council.json (made from a BG Stats export by tools/import-bgstats.ps1).
import { CONFIG } from './config.js';
import { faction } from './factions.js';

const CACHE_KEY = 'council:data:v2';

function toGames(raw) {
  return (raw.plays || []).map(p => {
    const seats = p.seats.map(s => ({ ...s, faction: faction(s.faction).name, vp: s.vp ?? 0 }));
    // Winner first, then by victory points; equal results share a place.
    const better = (a, b) => a.win !== b.win ? a.win : a.vp > b.vp;
    seats.forEach(s => { s.place = 1 + seats.filter(o => better(o, s)).length; });
    seats.sort((a, b) => a.place - b.place || a.player.localeCompare(b.player));
    const winner = seats.find(s => s.win) || null;
    const runnerUp = seats.find(s => s !== winner);
    return {
      ...p,
      location: CONFIG.locationNames[p.location] ?? p.location,
      seats,
      winner,
      target: winner ? Math.max(winner.vp, CONFIG.pointsToWin) : CONFIG.pointsToWin,
      margin: winner && runnerUp ? winner.vp - runnerUp.vp : null,
    };
  });
}

// Newest first: by date and time; on a tie, the entry added later to the file wins.
const toArticles = a => (a?.articles || []).map((x, i) => ({ ...x, order: i }))
  .sort((x, y) => (y.date + (y.time || '')).localeCompare(x.date + (x.time || '')) || y.order - x.order);
const toCouncil = raw => ({ games: toGames(raw.council), generated: raw.council.generated, articles: toArticles(raw.articles) });

function load() { try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; } }
function save(val) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(val)); } catch { /* ignore */ } }

export function cachedCouncil() {
  const raw = load();
  return raw?.council?.plays ? toCouncil(raw) : null;
}

async function getJson(file, required) {
  const res = await fetch(file, { cache: 'no-cache' });
  if (res.ok) return res.json();
  if (required) throw new Error(`Could not load ${file} (HTTP ${res.status}).`);
  return null;
}

export async function fetchCouncil() {
  const [council, articles] = await Promise.all([getJson(CONFIG.dataFile, true), getJson(CONFIG.articlesFile, false)]);
  const raw = { council, articles };
  save(raw);
  return toCouncil(raw);
}
