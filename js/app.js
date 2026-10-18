import { fetchCouncil, cachedCouncil } from './data.js';
import { computeStats } from './stats.js';
import { CONFIG } from './config.js';
import { header, footer, frontPage, overview, profile, factions, sessions, skeleton, errorPanel } from './render.js';

const app = document.getElementById('app');
const pref = {
  get(k, d) { try { return localStorage.getItem('council:' + k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('council:' + k, v); } catch { /* ignore */ } },
};

const RANGES = ['all', 'last'];
const rangeFor = screen => { const r = pref.get('range:' + screen); return RANGES.includes(r) ? r : 'all'; };

const state = { council: null, error: null, delegate: pref.get('delegate', '') };

let memo = { key: null, stats: null };
function stats(range) {
  const key = state.council.generated + '|' + state.council.games.length + '|' + range;
  if (memo.key !== key) memo = { key, stats: computeStats(state.council.games, { range }) };
  return memo.stats;
}

function route() {
  const [page, arg] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  if (page === 'delegate') return { screen: 'delegate', name: arg || null };
  if (page === 'sessions') return { screen: 'sessions', name: arg || null };
  if (page === 'factions') return { screen: 'factions' };
  if (page === 'assembly') return { screen: 'overview' };
  return { screen: 'front' };
}

function render() {
  const r = route();
  if (!state.council) {
    app.innerHTML = header(null, r.screen) + `<main>${state.error ? errorPanel(state.error) : skeleton()}</main>`;
    return;
  }
  const st = stats(rangeFor(r.screen));
  let body, title = '';
  if (r.screen === 'delegate') {
    const name = r.name || (st.players.some(p => p.name === state.delegate) ? state.delegate : st.players[0]?.name);
    if (name && name !== state.delegate) { state.delegate = name; pref.set('delegate', name); }
    body = profile(st, name); title = name;
  } else if (r.screen === 'sessions') {
    body = sessions(st, r.name); title = 'Sessions';
  } else if (r.screen === 'factions') {
    body = factions(st); title = 'Factions';
  } else if (r.screen === 'overview') {
    body = overview(st); title = 'Assembly';
  } else {
    body = frontPage(state.council.articles);
  }
  document.title = (title ? title + ' · ' : '') + CONFIG.title;
  app.innerHTML = header(st, r.screen) + `<main>${body}</main>` + footer(state.council.generated);
}

app.addEventListener('click', e => {
  const b = e.target.closest('[data-range]');
  if (!b) return;
  pref.set('range:' + route().screen, b.dataset.range);
  render();
});

window.addEventListener('hashchange', () => { render(); window.scrollTo({ top: 0 }); });

async function start() {
  state.council = cachedCouncil();
  render();
  try {
    state.council = await fetchCouncil();
    state.error = null;
  } catch (err) {
    // Keep showing the last good record if there is one.
    if (!state.council) state.error = err.message;
    console.warn('Galactic Council: data load failed', err);
  }
  render();
}

start();
