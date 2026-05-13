// 环保小兵 · Eco Warrior League — competition data layer
// Single source of truth: localStorage, optionally mirrored by CloudSync.

const STORAGE_KEY = "eco_warrior_v2";
const LEGACY_STORAGE_KEY = "eco_warrior_v1";
const SCORING_VERSION = 4;

const DEFAULT_CATEGORIES = [
  { id: "aluminum",  icon: "🥫", zh: "铝罐",   ms: "Tin aluminium",  price: 5.50, points: 550, color: "#8A9AA8" },
  { id: "used_oil",  icon: "🛢️", zh: "回锅油", ms: "Minyak terpakai", price: 3.40, points: 340, color: "#6F7D3C" },
  { id: "newspaper", icon: "📰", zh: "报纸",   ms: "Surat khabar",   price: 1.00, points: 100, color: "#D8B35D" },
  { id: "metal",     icon: "🔩", zh: "铁制品", ms: "Besi",           price: 0.40, points: 40,  color: "#737C86" },
  { id: "cardboard", icon: "📦", zh: "纸皮",   ms: "Kotak kadbod",   price: 0.25, points: 25,  color: "#B07A42" },
  { id: "plastic",   icon: "🧴", zh: "塑料",   ms: "Plastik",        price: 0.25, points: 25,  color: "#45A8C7" },
  { id: "paper",     icon: "📄", zh: "纸张",   ms: "Kertas",         price: 0.10, points: 10,  color: "#8DB580" },
];

const DEFAULT_TEAMS = [
  {
    id: "lions",
    zh: "云狮组",
    ms: "Kumpulan Singa Awan",
    icon: "🦁",
    primary: "#2EC4B6",
    glow: "#88E5FF",
    leader: "Queenie Lee Li Ying 李栎颖",
    members: [
      { id: "lions_low_li_en", name: "Low Li En 刘丽恩" },
      { id: "lions_low_li_qing", name: "Low Li Qing 刘丽情" },
      { id: "lions_low_jun_hao", name: "Low Jun Hao 刘均昊" },
      { id: "lions_tan_jin_xian", name: "Tan Jin Xian 陈晋贤" },
      { id: "lions_chan_yu_xun", name: "Chan Yu Xun 曾昱勋" },
      { id: "lions_tan_yue_ying", name: "Tan Yue Ying 陈月營" },
      { id: "lions_hugo_lee_jun_hong", name: "Hugo Lee Jun Hong 李唆竑" },
      { id: "lions_queenie_lee_li_ying", name: "Queenie Lee Li Ying 李栎颖" },
      { id: "lions_tee_ling_xian", name: "Tee Ling Xian 郑琳仙" },
    ],
  },
  {
    id: "dragons",
    zh: "飞龙组",
    ms: "Kumpulan Naga Terbang",
    icon: "🐲",
    primary: "#FF6B35",
    glow: "#FFC93C",
    leader: "Ong Xing Mei 王欣美",
    members: [
      { id: "dragons_lau_yan_tong", name: "Lau Yan Tong 刘妍彤" },
      { id: "dragons_ong_xing_yi", name: "Ong Xing Yi 王欣依" },
      { id: "dragons_lau_xin_yu", name: "Lau Xin Yu 刘欣瑜" },
      { id: "dragons_lucas_lee_guan_teck", name: "Lucas Lee Guan Teck 李冠德" },
      { id: "dragons_tee_joe_jian", name: "Tee Joe Jian 郑祖建" },
      { id: "dragons_lau_yu_ze", name: "Lau Yu Ze 刘宇哲" },
      { id: "dragons_lai_xuan_ning", name: "Lai Xuan Ning 赖萱宁" },
      { id: "dragons_tee_jing_er", name: "Tee Jing Er 郑静娥" },
      { id: "dragons_ong_xing_mei", name: "Ong Xing Mei 王欣美" },
      { id: "dragons_tea_kai_ze", name: "Tea Kai Ze 赵凱泽" },
    ],
  },
];

const DEFAULT_SESSION_ID = "session_1";

function defaultState() {
  return {
    version: 2,
    scoringVersion: SCORING_VERSION,
    categories: clone(DEFAULT_CATEGORIES),
    teams: clone(DEFAULT_TEAMS),
    sessions: [
      { id: DEFAULT_SESSION_ID, name: "第一次", date: new Date().toISOString().slice(0, 10), locked: false },
    ],
    activeSessionId: DEFAULT_SESSION_ID,
    weighIns: [],
    attendance: [],
    season: { startedAt: Date.now(), name: { zh: "2026 环保回收赛", ms: "Musim Kitar Semula 2026" } },
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return saveAndReturn(defaultState());
    return normalizeState(JSON.parse(raw));
  } catch (e) {
    return saveAndReturn(defaultState());
  }
}

function saveAndReturn(state) {
  save(state);
  return state;
}

function normalizeState(input) {
  const base = defaultState();
  const state = { ...base, ...input, version: 2 };

  state.categories = normalizeCategories(input.categories || base.categories, input.scoringVersion === SCORING_VERSION);
  state.scoringVersion = SCORING_VERSION;
  state.teams = normalizeTeams(input.teams || base.teams);
  state.sessions = Array.isArray(input.sessions) && input.sessions.length ? input.sessions : base.sessions;
  state.activeSessionId = input.activeSessionId || state.sessions[0].id;
  if (!state.sessions.some(s => s.id === state.activeSessionId)) state.activeSessionId = state.sessions[0].id;

  state.weighIns = Array.isArray(input.weighIns) ? input.weighIns : [];
  if (!state.weighIns.length && Array.isArray(input.entries) && input.entries.length) {
    state.weighIns = input.entries.map(e => ({
      id: e.id || makeId("w"),
      ts: e.ts || Date.now(),
      sessionId: state.activeSessionId,
      teamId: e.teamId,
      categoryId: mapLegacyCategory(e.categoryId),
      kg: Number(e.kg) || 0,
      points: Number(e.points) || 0,
    }));
  }
  state.weighIns = state.weighIns.map(w => recalcWeighIn(state.categories, w)).filter(w => w.kg > 0);
  state.entries = state.weighIns;
  state.attendance = Array.isArray(input.attendance) ? input.attendance : [];
  state.season = input.season || base.season;

  save(state);
  return state;
}

function normalizeCategories(categories, keepExistingPoints = false) {
  const byId = new Map();
  categories.forEach(c => {
    const id = mapLegacyCategory(c.id);
    if (!byId.has(id)) byId.set(id, c);
  });
  return DEFAULT_CATEGORIES.map(def => {
    const existing = byId.get(def.id);
    if (!existing || !keepExistingPoints) return { ...def };
    const points = Number(existing.points) || def.points;
    return { ...def, points, price: +(points / 100).toFixed(2) };
  });
}

function normalizeTeams(teams) {
  const byId = new Map(teams.map(t => [t.id, t]));
  return DEFAULT_TEAMS.map(def => {
    const existing = byId.get(def.id);
    if (!existing) return clone(def);
    return {
      ...def,
      members: Array.isArray(existing.members) && existing.members.length ? existing.members : clone(def.members),
    };
  });
}

function mapLegacyCategory(id) {
  const map = { steel: "metal", book: "paper", glass: "paper", ewaste: "metal" };
  return map[id] || id;
}

function save(state) {
  const next = { ...state, entries: state.weighIns || [] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  if (window.CloudSync && window.CloudSync.mode === "cloud" && !window.CloudSync.applyingRemote) {
    window.CloudSync.push(next);
  }
}

function makeId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

function activeSession(state) {
  return state.sessions.find(s => s.id === state.activeSessionId) || state.sessions[0];
}

function setActiveSession(state, sessionId) {
  const next = { ...state, activeSessionId: sessionId };
  save(next);
  return next;
}

function addSession(state, name) {
  const index = state.sessions.length + 1;
  const session = {
    id: makeId("session"),
    name: name || `第${index}次`,
    date: new Date().toISOString().slice(0, 10),
    locked: false,
  };
  const next = { ...state, sessions: [...state.sessions, session], activeSessionId: session.id };
  save(next);
  return next;
}

function updateSession(state, sessionId, patch) {
  const sessions = state.sessions.map(s => s.id === sessionId ? { ...s, ...patch } : s);
  const next = { ...state, sessions };
  save(next);
  return next;
}

function removeSession(state, sessionId) {
  if (state.sessions.length <= 1) return state;
  const sessions = state.sessions.filter(s => s.id !== sessionId);
  const next = {
    ...state,
    sessions,
    activeSessionId: state.activeSessionId === sessionId ? sessions[0].id : state.activeSessionId,
    weighIns: state.weighIns.filter(w => w.sessionId !== sessionId),
    attendance: state.attendance.filter(a => a.sessionId !== sessionId),
  };
  next.entries = next.weighIns;
  save(next);
  return next;
}

function updateCategories(state, categories) {
  const normalized = categories.map(c => ({
    ...c,
    points: Math.round((Number(c.price) || 0) * 100),
  }));
  const next = {
    ...state,
    scoringVersion: SCORING_VERSION,
    categories: normalized,
    weighIns: state.weighIns.map(w => recalcWeighIn(normalized, w)),
  };
  next.entries = next.weighIns;
  save(next);
  return next;
}

function recalcWeighIn(categories, weighIn) {
  const cat = categories.find(c => c.id === weighIn.categoryId);
  const kg = Math.max(0, Number(weighIn.kg) || 0);
  return {
    ...weighIn,
    kg,
    points: Math.round(kg * (Number(cat?.points) || 0)),
  };
}

function updateWeighIn(state, sessionId, teamId, categoryId, kg) {
  const value = Math.max(0, Number(kg) || 0);
  const existing = state.weighIns.find(w => w.sessionId === sessionId && w.teamId === teamId && w.categoryId === categoryId);
  let weighIns;
  if (value <= 0) {
    weighIns = state.weighIns.filter(w => w !== existing);
  } else if (existing) {
    weighIns = state.weighIns.map(w =>
      w === existing ? recalcWeighIn(state.categories, { ...w, kg: value, ts: Date.now() }) : w
    );
  } else {
    weighIns = [
      ...state.weighIns,
      recalcWeighIn(state.categories, { id: makeId("w"), ts: Date.now(), sessionId, teamId, categoryId, kg: value }),
    ];
  }
  const next = { ...state, weighIns };
  next.entries = weighIns;
  save(next);
  return next;
}

function getWeight(state, sessionId, teamId, categoryId) {
  return state.weighIns.find(w => w.sessionId === sessionId && w.teamId === teamId && w.categoryId === categoryId)?.kg || 0;
}

function setAttendance(state, sessionId, memberId, brought) {
  const attendance = state.attendance.filter(a => !(a.sessionId === sessionId && a.memberId === memberId));
  attendance.push({ sessionId, memberId, brought: !!brought, ts: Date.now() });
  const next = { ...state, attendance };
  save(next);
  return next;
}

function attendanceFor(state, sessionId, memberId) {
  const row = state.attendance.find(a => a.sessionId === sessionId && a.memberId === memberId);
  return row ? row.brought : true;
}

function teamMembers(state, teamId) {
  return state.teams.find(t => t.id === teamId)?.members || [];
}

function sessionTeamStats(state, sessionId, teamId) {
  const rows = state.weighIns.filter(w => w.sessionId === sessionId && w.teamId === teamId);
  const points = rows.reduce((sum, w) => sum + w.points, 0);
  const kg = rows.reduce((sum, w) => sum + w.kg, 0);
  return { points, kg, count: rows.length };
}

function teamStats(state, teamId) {
  const rows = state.weighIns.filter(w => w.teamId === teamId);
  const points = rows.reduce((sum, w) => sum + w.points, 0);
  const kg = rows.reduce((sum, w) => sum + w.kg, 0);
  return { points, kg, count: rows.length, level: Math.floor(points / 500) + 1, progressInLevel: (points % 500) / 500 };
}

function sessionStats(state, sessionId) {
  const stats = {};
  state.teams.forEach(t => { stats[t.id] = sessionTeamStats(state, sessionId, t.id); });
  const leaders = [...state.teams].sort((a, b) => stats[b.id].points - stats[a.id].points);
  const winner = stats[leaders[0].id].points === stats[leaders[1]?.id]?.points ? null : leaders[0];
  return { stats, winner };
}

function totalStats(state) {
  const kg = state.weighIns.reduce((sum, w) => sum + w.kg, 0);
  const points = state.weighIns.reduce((sum, w) => sum + w.points, 0);
  return { kg, points, count: state.weighIns.length };
}

function absenceReport(state) {
  const allMembers = state.teams.flatMap(team => team.members.map(m => ({ ...m, teamId: team.id, teamName: team.zh })));
  return allMembers.map(member => {
    const missed = state.sessions.filter(s => attendanceFor(state, s.id, member.id) === false);
    return { ...member, missedCount: missed.length, missedSessions: missed, eligible: missed.length < 2 };
  }).sort((a, b) => b.missedCount - a.missedCount || a.name.localeCompare(b.name));
}

function resetSeason(state) {
  const fresh = defaultState();
  fresh.categories = state.categories;
  fresh.teams = state.teams;
  fresh.scoringVersion = SCORING_VERSION;
  save(fresh);
  return fresh;
}

function exportCSV(state) {
  const rows = [];
  rows.push(["type", "session", "date", "team", "category_or_member", "kg", "rm_per_kg", "value_rm", "brought", "missed_count"]);
  state.weighIns.forEach(w => {
    const session = state.sessions.find(s => s.id === w.sessionId) || {};
    const team = state.teams.find(t => t.id === w.teamId) || {};
    const cat = state.categories.find(c => c.id === w.categoryId) || {};
    rows.push(["weigh_in", session.name || "", session.date || "", team.zh || "", cat.zh || "", w.kg, (cat.points || 0) / 100, (w.points || 0) / 100, "", ""]);
  });
  absenceReport(state).forEach(m => {
    state.sessions.forEach(s => {
      rows.push(["attendance", s.name, s.date || "", m.teamName, m.name, "", "", "", attendanceFor(state, s.id, m.id) ? "有带" : "没带", m.missedCount]);
    });
  });
  return "\uFEFF" + rows.map(r => r.map(v => {
    const s = String(v ?? "");
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
}

Object.assign(window, {
  EcoData: {
    load, save, defaultState, resetSeason,
    activeSession, setActiveSession, addSession, updateSession, removeSession,
    updateCategories, updateWeighIn, getWeight,
    setAttendance, attendanceFor, teamMembers,
    sessionTeamStats, sessionStats, teamStats, totalStats, absenceReport,
    exportCSV,
    DEFAULT_CATEGORIES, DEFAULT_TEAMS,
    LEVELS: [
      { lv: 1, zh: "起步", ms: "Mula" },
      { lv: 2, zh: "稳定", ms: "Mantap" },
      { lv: 3, zh: "领先", ms: "Mendahului" },
      { lv: 4, zh: "冠军候选", ms: "Calon juara" },
      { lv: 5, zh: "总冠军", ms: "Juara" },
    ],
    LEVEL_STEP: 500,
  },
});
