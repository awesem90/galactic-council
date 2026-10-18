// HTML for every page. Everything is built from the stats object.
import { CONFIG } from './config.js';
import { faction } from './factions.js';
import { pct, dec1, fmtMinutes, shortDate, longDate } from './stats.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const delegateHref = name => '#/delegate/' + encodeURIComponent(name);
const sessionsHref = name => '#/sessions' + (name ? '/' + encodeURIComponent(name) : '');
const plural = (n, word, many = word + 's') => `${n} ${n === 1 ? word : many}`;
const ordinal = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');
const scope = st => st.range === 'last' ? `over the last ${plural(st.games.length, 'session')}` : 'across every session on record';
const who = name => `<a href="${delegateHref(name)}">${esc(name)}</a>`;

// The council seal: Mecatol Rex in the middle, six seats around it.
export const SEAL = `<svg class="seal" viewBox="0 0 64 64" aria-hidden="true">
  <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="32" cy="32" r="25" fill="none" stroke="currentColor" stroke-width=".75" stroke-dasharray="2 3"/>
  ${[0, 1, 2, 3, 4, 5].map(i => { const a = (i * 60 - 90) * Math.PI / 180; return `<circle cx="${(32 + 25 * Math.cos(a)).toFixed(1)}" cy="${(32 + 25 * Math.sin(a)).toFixed(1)}" r="2.6" fill="currentColor"/>`; }).join('')}
  <polygon points="32,17 45,24.5 45,39.5 32,47 19,39.5 19,24.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="32" cy="32" r="7" fill="currentColor"/>
</svg>`;

// A faction name as a coloured chip; `full` shows the whole name instead of the short one.
function fx(name, full = false) {
  const f = faction(name);
  return `<span class="fx" style="--fx:${f.color}" title="${esc(f.name)}">${esc(full ? f.name : f.short)}</span>`;
}

// Victory points as a track of pips, filled up to the score.
function track(vp, target) {
  const pips = Array.from({ length: target }, (_, i) => `<i class="${i < vp ? 'on' : ''}"></i>`).join('');
  return `<span class="track" title="${vp} of ${target} VP">${pips}</span>`;
}

const form = results => `<span class="form">${results.map(w => `<i class="${w ? 'w' : 'l'}" title="${w ? 'Win' : 'Loss'}"></i>`).join('')}</span>`;
const sectionHead = (title, extra = '') => `<h2 class="section-head"><span>${title}</span>${extra}</h2>`;
const figure = (value, label, note = '') => `<div class="figure"><b>${value}</b><span>${label}</span>${note ? `<small>${note}</small>` : ''}</div>`;

// ---------- Header ----------
export function header(st, screen) {
  const nav = [['front', '#/', 'Front Page'], ['overview', '#/assembly', 'Assembly'], ['delegate', '#/delegate', 'Delegates'], ['factions', '#/factions', 'Factions'], ['sessions', '#/sessions', 'Sessions']];
  const editions = [['all', 'All sessions'], ['last', 'Last ' + CONFIG.lastN]];
  return `
  <header class="top">
    <a class="brand" href="#/">${SEAL}<span><b>${esc(CONFIG.title)}</b><small>${esc(CONFIG.motto)}</small></span></a>
    <nav class="sections" aria-label="Sections">${nav.map(([key, href, label]) => `<a href="${href}" class="${screen === key ? 'active' : ''}">${label}</a>`).join('')}</nav>
    ${st && screen !== 'front' ? `<div class="edition" role="group" aria-label="Range">${editions.map(([key, label]) =>
      `<button data-range="${key}" class="${st.range === key ? 'active' : ''}" aria-pressed="${st.range === key}">${esc(label)}</button>`).join('')}</div>` : ''}
  </header>`;
}

export function footer(generated) {
  return `<footer class="colophon">Recorded from the BG Stats export${generated ? ' of ' + esc(generated) : ''}. Twilight Imperium © Fantasy Flight Games; this is a fan-made record of our own games.</footer>`;
}

// ---------- Assembly (front page) ----------
function headline(st) {
  const [L, second] = st.players;
  if (!L) return 'The Council has not yet convened';
  if (L.wins >= 2 && (!second || L.wins >= second.wins * 2)) return `${esc(L.name)} Holds the Throne`;
  if (second && L.wins === second.wins) return `${esc(L.name)} and ${esc(second.name)} Share the Lead`;
  return `${esc(L.name)} Leads the Council`;
}

function standingsTable(st, compact = false) {
  return `<table class="table standings">
    <thead><tr><th>#</th><th class="l">Delegate</th><th title="Sessions">S</th><th title="Wins">W</th><th>Win %</th><th title="Average victory points">Avg VP</th>${compact ? '' : '<th title="Average finishing place">Avg place</th><th class="l">Usual faction</th>'}<th class="l">Form</th></tr></thead>
    <tbody>${st.players.map(p => `
      <tr class="${p.rank === 1 ? 'lead-row' : ''}"><td>${p.rank}</td><td class="l">${who(p.name)}</td>
      <td>${p.games}</td><td class="b">${p.wins}</td><td>${p.rate}</td><td>${dec1(p.avgVp)}</td>
      ${compact ? '' : `<td>${dec1(p.avgPlace)}</td><td class="l">${fx(p.mainFaction)}</td>`}<td class="l">${form(p.form)}</td></tr>`).join('')}</tbody>
  </table>
  <p class="note">Ranked by wins, then win rate, then average victory points. Form shows each delegate's last five sessions.</p>`;
}

function sessionCard(g, { open = false } = {}) {
  const meta = [g.rounds && plural(g.rounds, 'round'), g.minutes && fmtMinutes(g.minutes), g.location].filter(Boolean).map(esc).join(' · ');
  const exp = g.expansions.slice().sort((a, b) => (b === 'PoK') - (a === 'PoK') || a.localeCompare(b));
  return `<article class="session${open ? ' open' : ''}">
    <header>
      <div><p class="kicker">${longDate(g.date)}</p>
      <h3>${g.winner ? `${esc(g.winner.player)} takes the throne with ${esc(faction(g.winner.faction).short)}` : 'No winner recorded'}</h3>
      <p class="meta">${meta}</p></div>
      ${g.margin !== null ? `<p class="margin"><b>${g.margin === 0 ? 'tie' : '+' + g.margin}</b><span>margin</span></p>` : ''}
    </header>
    <ol class="seats">${g.seats.map(s => `
      <li class="${s.win ? 'win' : ''}"><span class="place">${ordinal(s.place)}</span><span class="who">${who(s.player)}${s.speaker ? ' <span class="gavel" title="Speaker at the start">Speaker</span>' : ''}</span>
      ${fx(s.faction, true)}<span class="vp">${track(s.vp, g.target)}<b>${s.vp}</b></span></li>`).join('')}</ol>
    ${g.setup.length || exp.length ? `<p class="tags">${g.setup.map(t => `<span>${esc(t)}</span>`).join('')}${exp.map(t => `<span class="exp">${esc(t)}</span>`).join('')}</p>` : ''}
  </article>`;
}

function headToHead(st) {
  if (st.matrix.length < 2) return '';
  return `<section class="block">
    ${sectionHead('Head to head', `<small>Sessions where the row finished above the column, out of sessions together (min. ${CONFIG.rivalryMinGames} sessions)</small>`)}
    <div class="scroll"><table class="table matrix">
      <thead><tr><th></th>${st.matrix.map(r => `<th>${esc(r.name)}</th>`).join('')}</tr></thead>
      <tbody>${st.matrix.map(r => `<tr><th class="l">${who(r.name)}</th>${r.cells.map(c => {
        if (!c) return '<td class="self">—</td>';
        if (!c.games) return '<td class="none">·</td>';
        const share = c.ahead / c.games;
        return `<td class="${share > .5 ? 'up' : share < .5 ? 'down' : ''}" title="${esc(r.name)} above ${esc(c.vs)} in ${c.ahead} of ${c.games}">${c.ahead}/${c.games}</td>`;
      }).join('')}</tr>`).join('')}</tbody>
    </table></div>
  </section>`;
}

export function overview(st) {
  const L = st.players[0];
  const latest = st.games[st.games.length - 1];
  const verdict = st.speakerRate > st.speakerChance + 8 ? 'The Speaker token is worth fighting for.'
    : st.speakerRate < st.speakerChance - 8 ? 'Holding the Speaker token looks more like a curse.' : 'The Speaker token barely tips the scales.';
  const lede = L ? `${who(L.name)} has won ${plural(L.wins, 'session')} of ${L.games} ${scope(st)}, averaging ${dec1(L.avgVp)} victory points a game.${L.mainFaction ? ` Favoured faction: ${esc(faction(L.mainFaction).name)}.` : ''}` : '';

  const notes = [
    st.closest && `<li><b>Closest finish.</b> ${esc(st.closest.winner.player)} won on ${longDate(st.closest.date)} by ${plural(st.closest.margin, 'point')}, with ${st.closest.seats.filter(s => !s.win && s.vp === st.closest.winner.vp - st.closest.margin).map(s => esc(s.player)).join(' and ')} right behind.</li>`,
    st.blowout && st.blowout !== st.closest && `<li><b>Widest margin.</b> ${esc(st.blowout.winner.player)} won by ${plural(st.blowout.margin, 'point')} on ${longDate(st.blowout.date)}.</li>`,
    st.nearMiss && `<li><b>So close.</b> ${who(st.nearMiss.name)} finished one point short of victory ${plural(st.nearMiss.nearMisses, 'time')}.</li>`,
    st.longest && `<li><b>Longest session.</b> ${fmtMinutes(st.longest.minutes)} on ${longDate(st.longest.date)}${st.longest.rounds ? `, over ${plural(st.longest.rounds, 'round')}` : ''}.</li>`,
    st.topFaction && `<li><b>Most fielded.</b> ${esc(st.topFaction.name)}, in ${plural(st.topFaction.games, 'session')} (${plural(st.topFaction.wins, 'win')}).</li>`,
    st.speakerGames && `<li><b>The Speaker's edge.</b> The starting Speaker won ${st.speakerWins} of ${st.speakerGames} sessions (${st.speakerRate}%), against ${Math.round(st.speakerChance)}% by pure chance. ${verdict}</li>`,
  ].filter(Boolean);

  return `
  <section class="hero">
    <p class="kicker">Session ${st.allGames.length} on record${latest ? ' · last convened ' + longDate(latest.date) : ''}</p>
    <h1>${headline(st)}</h1>
    ${lede ? `<p class="lede">${lede}</p>` : ''}
  </section>

  <section class="figures">
    ${figure(st.games.length, 'Sessions')}
    ${figure(st.players.length, 'Delegates')}
    ${figure(st.factions.length, 'Factions fielded', `of ${st.factions.length + st.unplayed.length}`)}
    ${figure(dec1(st.avgRounds), 'Rounds a game')}
    ${figure(st.avgMinutes ? fmtMinutes(st.avgMinutes) : '—', 'At the table')}
    ${figure(dec1(st.avgSeats), 'Delegates a game')}
  </section>

  <div class="columns">
    <section class="block wide">${sectionHead('Standings')}${standingsTable(st, true)}</section>
    <section class="block">${sectionHead('From the minutes')}<ul class="notes">${notes.join('')}</ul></section>
  </div>

  ${latest ? `<section class="block">${sectionHead('Latest session', `<a class="more" href="#/sessions">All sessions →</a>`)}${sessionCard(latest, { open: true })}</section>` : ''}

  <section class="block">${sectionHead('Faction power', `<a class="more" href="#/factions">All factions →</a>`)}${factionTable(st.factions.slice(0, 6), true)}</section>

  ${headToHead(st)}`;
}

// ---------- Delegates ----------
export function profile(st, name) {
  const p = st.players.find(x => x.name === name);
  const picker = `<nav class="picker" aria-label="Delegates">${st.players.map(x => `<a href="${delegateHref(x.name)}" class="${x.name === name ? 'active' : ''}">${esc(x.name)}</a>`).join('')}</nav>`;
  if (!p) return picker + `<p class="empty">${esc(name || 'This delegate')} has no sessions in this range.</p>`;

  const rivals = st.players.filter(o => o.name !== p.name && st.vs[p.name]?.[o.name])
    .map(o => ({ name: o.name, ...st.vs[p.name][o.name] }))
    .sort((a, b) => b.games - a.games || b.ahead / b.games - a.ahead / a.games || a.name.localeCompare(b.name));

  return `${picker}
  <section class="hero small">
    <p class="kicker">Delegate · ${ordinal(p.rank)} in the Council</p>
    <h1>${esc(p.name)}</h1>
    <p class="lede">${plural(p.wins, 'win')} in ${plural(p.games, 'session')} ${scope(st)}${p.mainFaction ? `, most often as ${esc(faction(p.mainFaction).name)}` : ''}.</p>
  </section>
  <section class="figures">
    ${figure(p.games, 'Sessions')}
    ${figure(p.wins, 'Wins', p.rate + '%')}
    ${figure(dec1(p.avgVp), 'Avg VP', 'best ' + p.bestVp)}
    ${figure(dec1(p.avgPlace), 'Avg place')}
    ${figure(p.nearMisses, 'One short')}
    ${figure(p.speaker, 'Started as Speaker', p.speaker ? plural(p.speakerWins, 'win') : '')}
  </section>
  <div class="columns">
    <section class="block">${sectionHead('Factions played')}
      <table class="table"><thead><tr><th class="l">Faction</th><th>S</th><th>W</th><th>Avg VP</th></tr></thead>
      <tbody>${p.factionList.map(f => `<tr><td class="l">${fx(f.name, true)}</td><td>${f.games}</td><td class="b">${f.wins}</td><td>${dec1(f.avgVp)}</td></tr>`).join('')}</tbody></table>
    </section>
    <section class="block">${sectionHead('Against the Council', '<small>finished above, out of sessions together</small>')}
      <table class="table"><thead><tr><th class="l">Delegate</th><th>Above</th><th>Together</th><th>%</th></tr></thead>
      <tbody>${rivals.map(r => `<tr><td class="l">${who(r.name)}</td><td class="b">${r.ahead}</td><td>${r.games}</td><td>${pct(r.ahead, r.games)}</td></tr>`).join('')}</tbody></table>
    </section>
  </div>
  <section class="block">${sectionHead('Sessions', `<a class="more" href="${sessionsHref(p.name)}">Full results →</a>`)}
    <table class="table log"><thead><tr><th class="l">Date</th><th class="l">Faction</th><th>VP</th><th>Place</th><th class="l">Winner</th></tr></thead>
    <tbody>${p.log.slice().reverse().map(({ game: g, seat: s }) => `<tr class="${s.win ? 'lead-row' : ''}">
      <td class="l">${shortDate(g.date)}</td><td class="l">${fx(s.faction, true)}</td><td class="b">${s.vp}</td><td>${ordinal(s.place)} of ${g.seats.length}</td>
      <td class="l">${s.win ? '<b>Won</b>' : g.winner ? who(g.winner.player) : '—'}</td></tr>`).join('')}</tbody></table>
  </section>`;
}

// ---------- Factions ----------
function factionTable(list, compact = false) {
  return `<table class="table factions">
    <thead><tr><th class="l">Faction</th><th title="Times fielded">Fielded</th><th>Wins</th><th>Win %</th><th title="Average length of the sessions it played in">Avg time</th>${compact ? '' : '<th title="Highest victory points scored with it">Best VP</th><th class="l">Delegates</th><th class="l">Last fielded</th>'}</tr></thead>
    <tbody>${list.map(f => `<tr><td class="l">${fx(f.name, true)}</td><td>${f.games}</td><td class="b">${f.wins}</td><td>${f.rate}</td><td>${f.avgMinutes ? fmtMinutes(f.avgMinutes) : "—"}</td>
      ${compact ? '' : `<td>${f.bestVp}</td><td class="l pilots">${f.pilotList.map(pl => `${who(pl.name)}${pl.games > 1 ? ` <small>×${pl.games}</small>` : ''}`).join(', ')}</td><td class="l">${shortDate(f.last)}</td>`}</tr>`).join('')}</tbody>
  </table>`;
}

export function factions(st) {
  return `
  <section class="hero small">
    <p class="kicker">Factions</p>
    <h1>${plural(st.factions.length, 'faction')} have taken a seat</h1>
    <p class="lede">Sorted by wins, then win rate, ${scope(st)}. Avg time is the average length of the sessions a faction played in.</p>
  </section>
  <section class="block"><div class="scroll">${factionTable(st.factions)}</div></section>
  ${st.unplayed.length ? `<section class="block">${sectionHead('Yet to take a seat')}<p class="unplayed">${st.unplayed.map(n => fx(n, true)).join(' ')}</p></section>` : ''}`;
}

// ---------- Sessions ----------
export function sessions(st, name) {
  const list = st.games.filter(g => !name || g.seats.some(s => s.player === name)).slice().reverse();
  return `
  <section class="hero small">
    <p class="kicker">Sessions</p>
    <h1>${name ? `Every session with ${esc(name)}` : 'The full record'}</h1>
    <p class="lede">${plural(list.length, 'session')}, newest first.${name ? ` <a href="#/sessions">Show everyone →</a>` : ''}</p>
  </section>
  <div class="session-list">${list.map(g => sessionCard(g)).join('') || '<p class="empty">No sessions in this range.</p>'}</div>`;
}

// ---------- States ----------
export const skeleton = () => `<p class="empty">Convening the Council…</p>`;
export const errorPanel = msg => `<div class="error"><h2>The Council could not convene</h2><p>${esc(msg)}</p></div>`;

// ---------- Front page: a newspaper, newest article on top ----------
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekday = iso => { const [y, m, d] = iso.split('-').map(Number); return WEEKDAYS[new Date(y, m - 1, d).getDay()]; };
// *text* in article copy becomes italics; everything else is escaped.
const inline = s => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');

function story(a, lead) {
  const body = a.body.map(b => typeof b === 'string' ? `<p>${inline(b)}</p>`
    : b.head ? `<h3>${inline(b.head)}</h3>`
    : `<blockquote class="pull">${inline(b.quote)}</blockquote>`).join('');
  return `
  <article class="story${lead ? ' lead' : ''}">
    <p class="kicker">${esc(a.kicker || 'Report')} · ${weekday(a.date)} ${longDate(a.date)}</p>
    <h2 class="headline">${inline(a.headline)}</h2>
    ${a.deck ? `<p class="deck">${inline(a.deck)}</p>` : ''}
    ${a.byline ? `<p class="byline">${esc(a.byline)}</p>` : ''}
    ${a.image ? `<figure class="art"><img src="${esc(a.image)}" alt="${esc(a.caption || '')}" loading="lazy">${a.caption ? `<figcaption>${inline(a.caption)}</figcaption>` : ''}</figure>` : ''}
    <div class="copy">${body}</div>
    ${a.numbers?.length ? `<aside class="numbers"><h4>By the numbers</h4><dl>${a.numbers.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></aside>` : ''}
  </article>`;
}

export function frontPage(articles = []) {
  return `
  <div class="paper">
    <header class="paper-head">
      <p class="paper-name">${esc(CONFIG.title)}</p>
      <p class="paper-motto">“${esc(CONFIG.motto)}”</p>
    </header>
    ${articles.length ? articles.map((a, i) => story(a, i === 0)).join('') : '<p class="empty">No reports filed yet.</p>'}
  </div>`;
}
