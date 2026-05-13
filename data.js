// 环保小兵 · Eco Warrior League — data layer
// All persistence in localStorage. Single source of truth.

const STORAGE_KEY = "eco_warrior_v1";

// Default waste categories (point per kg, CO2 saved per kg)
// Aluminum highest, glass lowest — typical school recycling values
const DEFAULT_CATEGORIES = [
  { id: "newspaper", icon: "📰", zh: "报纸",     ms: "Surat khabar", points: 10, co2: 3.5, color: "#F5C45E" },
  { id: "cardboard", icon: "📦", zh: "纸皮",     ms: "Kotak kadbod",  points: 6,  co2: 3.3, color: "#C68B59" },
  { id: "book",      icon: "📚", zh: "书本",     ms: "Buku lama",     points: 8,  co2: 2.9, color: "#8B6F47" },
  { id: "plastic",   icon: "🧴", zh: "塑料瓶",   ms: "Botol plastik", points: 15, co2: 2.5, color: "#5BC0EB" },
  { id: "aluminum",  icon: "🥫", zh: "铝罐",     ms: "Tin aluminium", points: 25, co2: 9.0, color: "#B8B8B8" },
  { id: "steel",     icon: "🥡", zh: "铁罐",     ms: "Tin besi",      points: 12, co2: 1.8, color: "#7A8B99" },
  { id: "glass",     icon: "🍾", zh: "玻璃瓶",   ms: "Botol kaca",    points: 4,  co2: 0.5, color: "#88D498" },
  { id: "ewaste",    icon: "🔌", zh: "电子垃圾", ms: "E-sisa",        points: 20, co2: 2.0, color: "#A06CD5" },
];

const DEFAULT_TEAMS = [
  { id: "dragons", zh: "飞龙队", ms: "Pasukan Naga",  icon: "🐲", primary: "#FF6B35", glow: "#FFC93C" },
  { id: "lions",   zh: "云狮队", ms: "Pasukan Singa", icon: "🦁", primary: "#2EC4B6", glow: "#88E5FF" },
];

// Level milestones (each team levels up as they score)
const LEVEL_STEP = 500;  // pts per level
const LEVELS = [
  { lv: 1, zh: "新手", ms: "Pemula" },
  { lv: 2, zh: "巡逻员", ms: "Peronda" },
  { lv: 3, zh: "护林员", ms: "Penjaga Hutan" },
  { lv: 4, zh: "环保英雄", ms: "Wira Hijau" },
  { lv: 5, zh: "地球守护者", ms: "Pelindung Bumi" },
  { lv: 6, zh: "传奇大师", ms: "Sifu Legenda" },
];

function defaultState() {
  return {
    categories: DEFAULT_CATEGORIES,
    teams: DEFAULT_TEAMS,
    entries: [],  // { id, ts, teamId, categoryId, kg, points, co2 }
    season: { startedAt: Date.now(), name: { zh: "2026 春季赛", ms: "Musim 2026" } },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDemo(defaultState());
    const s = JSON.parse(raw);
    // backfill missing fields
    if (!s.categories) s.categories = DEFAULT_CATEGORIES;
    if (!s.teams) s.teams = DEFAULT_TEAMS;
    if (!s.entries) s.entries = [];
    if (!s.season) s.season = defaultState().season;
    return s;
  } catch (e) {
    return seedDemo(defaultState());
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Push to cloud if connected (data.js doesn't depend on CloudSync; soft check)
  if (window.CloudSync && window.CloudSync.mode === "cloud") {
    window.CloudSync.push(state);
  }
}

// Seed plausible demo data on first load so big screen looks alive
function seedDemo(state) {
  const now = Date.now();
  const days = 14;
  const ents = [];
  for (let i = 0; i < 38; i++) {
    const cat = state.categories[Math.floor(Math.random() * state.categories.length)];
    const team = Math.random() < 0.52 ? state.teams[0] : state.teams[1];
    const kg = +(Math.random() * 4 + 0.2).toFixed(2);
    ents.push({
      id: "seed_" + i,
      ts: now - Math.floor(Math.random() * days * 24 * 3600 * 1000),
      teamId: team.id,
      categoryId: cat.id,
      kg,
      points: Math.round(kg * cat.points),
      co2: +(kg * cat.co2).toFixed(2),
    });
  }
  ents.sort((a, b) => a.ts - b.ts);
  state.entries = ents;
  save(state);
  return state;
}

// Score aggregation helpers
function teamStats(state, teamId) {
  const ents = state.entries.filter(e => e.teamId === teamId);
  const points = ents.reduce((a, e) => a + e.points, 0);
  const kg = ents.reduce((a, e) => a + e.kg, 0);
  const co2 = ents.reduce((a, e) => a + e.co2, 0);
  const level = Math.min(LEVELS.length, Math.max(1, Math.floor(points / LEVEL_STEP) + 1));
  const progressInLevel = (points % LEVEL_STEP) / LEVEL_STEP;
  return { points, kg, co2, count: ents.length, level, progressInLevel };
}

function totalStats(state) {
  const kg = state.entries.reduce((a, e) => a + e.kg, 0);
  const co2 = state.entries.reduce((a, e) => a + e.co2, 0);
  return { kg, co2, count: state.entries.length };
}

function addEntry(state, teamId, categoryId, kg) {
  const cat = state.categories.find(c => c.id === categoryId);
  if (!cat) return state;
  const entry = {
    id: "e_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
    ts: Date.now(),
    teamId, categoryId, kg,
    points: Math.round(kg * cat.points),
    co2: +(kg * cat.co2).toFixed(2),
  };
  const next = { ...state, entries: [...state.entries, entry] };
  save(next);
  return { state: next, entry };
}

function removeEntry(state, entryId) {
  const next = { ...state, entries: state.entries.filter(e => e.id !== entryId) };
  save(next);
  return next;
}

function updateCategories(state, categories) {
  const next = { ...state, categories };
  save(next);
  return next;
}

function resetSeason(state) {
  const fresh = defaultState();
  // keep customized categories, reset entries
  fresh.categories = state.categories;
  fresh.teams = state.teams;
  save(fresh);
  return fresh;
}

function exportCSV(state) {
  const header = ["timestamp", "datetime", "team_zh", "team_ms", "category_zh", "category_ms", "kg", "points", "co2_kg"];
  const rows = state.entries.map(e => {
    const team = state.teams.find(t => t.id === e.teamId) || {};
    const cat = state.categories.find(c => c.id === e.categoryId) || {};
    const dt = new Date(e.ts).toISOString();
    return [e.ts, dt, team.zh || "", team.ms || "", cat.zh || "", cat.ms || "", e.kg, e.points, e.co2];
  });
  const csv = [header, ...rows].map(r => r.map(v => {
    const s = String(v ?? "");
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
  return "\uFEFF" + csv;  // BOM for Excel
}

// Export to global scope for other Babel scripts
Object.assign(window, {
  EcoData: {
    load, save, addEntry, removeEntry, updateCategories, resetSeason,
    teamStats, totalStats, exportCSV, defaultState, seedDemo,
    LEVELS, LEVEL_STEP, DEFAULT_CATEGORIES, DEFAULT_TEAMS,
  },
});
