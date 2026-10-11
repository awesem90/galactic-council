// Every TI4 faction (base game, Prophecy of Kings, Codex), with a short name and a sigil colour.
export const FACTIONS = {
  'Arborec':                 { short: 'Arborec',    color: '#6f9e3e' },
  'Barony of Letnev':        { short: 'Letnev',     color: '#b0383a' },
  'Clan of Saar':            { short: 'Saar',       color: '#c07a35' },
  'Embers of Muaat':         { short: 'Muaat',      color: '#e0592a' },
  'Emirates of Hacan':       { short: 'Hacan',      color: '#d9a93b' },
  'Federation of Sol':       { short: 'Sol',        color: '#3f7fd1' },
  'Ghosts of Creuss':        { short: 'Creuss',     color: '#45b7d6' },
  'L1Z1X Mindnet':           { short: 'L1Z1X',      color: '#5a6fa8' },
  'Mentak Coalition':        { short: 'Mentak',     color: '#e08a2a' },
  'Naalu Collective':        { short: 'Naalu',      color: '#8fb83e' },
  'Nekro Virus':             { short: 'Nekro',      color: '#c3262e' },
  "Sardakk N'orr":           { short: 'Sardakk',    color: '#9e2b2b' },
  'Universities of Jol-Nar': { short: 'Jol-Nar',    color: '#8a5cc7' },
  'Winnu':                   { short: 'Winnu',      color: '#a27bd1' },
  'Xxcha Kingdom':           { short: 'Xxcha',      color: '#3f9e6e' },
  'Yin Brotherhood':         { short: 'Yin',        color: '#c9c3d9' },
  'Yssaril Tribes':          { short: 'Yssaril',    color: '#4f8a46' },
  'Argent Flight':           { short: 'Argent',     color: '#e3863a' },
  'Empyrean':                { short: 'Empyrean',   color: '#9b59d0' },
  'Mahact Gene-Sorcerers':   { short: 'Mahact',     color: '#e3c040' },
  'Naaz-Rokha Alliance':     { short: 'Naaz-Rokha', color: '#4fb05a' },
  'Nomad':                   { short: 'Nomad',      color: '#9aa3b5' },
  'Titans of Ul':            { short: 'Titans',     color: '#d65f9b' },
  "Vuil'Raith Cabal":        { short: 'Cabal',      color: '#d43a4f' },
  'Council Keleres':         { short: 'Keleres',    color: '#3fb8a6' },
};

const norm = s => String(s || '').replace(/[‘’ʼ]/g, "'").trim().toLowerCase();
const byNorm = new Map(Object.entries(FACTIONS).map(([name, f]) => [norm(name), { name, ...f }]));

export function faction(name) {
  return byNorm.get(norm(name)) || { name, short: name, color: '#8d93a6' };
}
