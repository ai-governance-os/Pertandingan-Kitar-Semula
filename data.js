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

const DEFAULT_STAR_TYPES = [
  { id: "eco_recycle", icon: "♻️", zh: "环保回收", en: "Eco Recycling", defaultStars: 2 },
  { id: "eco_paper_box", icon: "📄", zh: "纸张回收", en: "Paper Recycling", defaultStars: 1 },
  { id: "eco_save_electricity", icon: "💡", zh: "节省电源", en: "Save Electricity", defaultStars: 1 },
  { id: "eco_save_water", icon: "💧", zh: "节省水源", en: "Save Water", defaultStars: 1 },
  { id: "eco_campus_care", icon: "🌱", zh: "爱护校园", en: "Campus Care", defaultStars: 1 },
  { id: "character", icon: "⭐", zh: "品格表现", en: "Character", defaultStars: 1 },
  { id: "leadership", icon: "🧭", zh: "提醒/领导", en: "Leadership", defaultStars: 2 },
  { id: "deduction", icon: "⚠️", zh: "扣星", en: "Deduction", defaultStars: -1 },
];

const DEFAULT_REWARD_ITEMS = [
  { id: "reward_pencil", icon: "✏️", nameZh: "铅笔", nameEn: "Pencil", starCost: 10, quantity: 20, purchaseCostRm: 8.00, active: true },
  { id: "reward_eraser", icon: "🧽", nameZh: "橡皮擦", nameEn: "Eraser", starCost: 8, quantity: 20, purchaseCostRm: 6.00, active: true },
  { id: "reward_ruler", icon: "📏", nameZh: "尺子", nameEn: "Ruler", starCost: 12, quantity: 15, purchaseCostRm: 7.50, active: true },
  { id: "reward_notebook", icon: "📓", nameZh: "笔记本", nameEn: "Notebook", starCost: 25, quantity: 10, purchaseCostRm: 15.00, active: true },
  { id: "reward_sticker", icon: "🌟", nameZh: "贴纸包", nameEn: "Sticker pack", starCost: 5, quantity: 30, purchaseCostRm: 4.00, active: true },
];

const DEFAULT_SETTINGS = {
  aiEnabled: true,
  aiLocale: "zh_en",
  storePhotos: false,
  teacherReviewRequiredBelowConfidence: 0.75,
};

function seedCatalog() {
  // EcoCatalog.SEED is defined in catalog.js (loaded before data.js).
  // Fallback to empty array if catalog.js failed to load.
  return (window.EcoCatalog && Array.isArray(window.EcoCatalog.SEED))
    ? clone(window.EcoCatalog.SEED)
    : [];
}

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
    aiScans: [],
    starTypes: clone(DEFAULT_STAR_TYPES),
    starLedger: [],
    rewardItems: clone(DEFAULT_REWARD_ITEMS),
    rewardRedemptions: [],
    fundEvents: [],
    catalog: seedCatalog(),
    settings: { ...DEFAULT_SETTINGS },
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

  state.aiScans = Array.isArray(input.aiScans) ? input.aiScans : [];
  state.starTypes = Array.isArray(input.starTypes) && input.starTypes.length ? input.starTypes : clone(DEFAULT_STAR_TYPES);
  state.starLedger = Array.isArray(input.starLedger) ? input.starLedger : [];
  state.rewardItems = Array.isArray(input.rewardItems) && input.rewardItems.length ? input.rewardItems : clone(DEFAULT_REWARD_ITEMS);
  state.rewardRedemptions = Array.isArray(input.rewardRedemptions) ? input.rewardRedemptions : [];
  state.fundEvents = Array.isArray(input.fundEvents) ? input.fundEvents : [];
  state.catalog = Array.isArray(input.catalog) && input.catalog.length ? input.catalog : seedCatalog();
  state.settings = { ...DEFAULT_SETTINGS, ...(input.settings || {}) };

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

// ─────────────────────────── AI scans ───────────────────────────

function addAiScan(state, scan) {
  const clean = { ...scan, id: scan.id || makeId("scan"), ts: scan.ts || Date.now() };
  const next = { ...state, aiScans: [clean, ...(state.aiScans || [])].slice(0, 500) };
  save(next);
  return next;
}

function updateAiScanDecision(state, scanId, patch) {
  const next = {
    ...state,
    aiScans: (state.aiScans || []).map(s => s.id === scanId ? { ...s, ...patch } : s),
  };
  save(next);
  return next;
}

// ─────────────────────────── Star ledger ───────────────────────────

function addStarEvent(state, event) {
  const stars = Number(event.stars) || 0;
  if (stars < 0 && !String(event.reasonZh || event.reasonEn || "").trim()) {
    alert("扣星必须写原因 · Deduction requires a reason.");
    return state;
  }
  const clean = {
    ...event,
    id: event.id || makeId("star"),
    ts: event.ts || Date.now(),
    stars,
  };
  const next = { ...state, starLedger: [clean, ...(state.starLedger || [])] };
  save(next);
  return next;
}

function removeStarEvent(state, eventId) {
  const next = { ...state, starLedger: (state.starLedger || []).filter(e => e.id !== eventId) };
  save(next);
  return next;
}

function studentStarBalance(state, studentId) {
  const earned = (state.starLedger || [])
    .filter(e => e.studentId === studentId)
    .reduce((sum, e) => sum + (Number(e.stars) || 0), 0);
  const spent = (state.rewardRedemptions || [])
    .filter(r => r.studentId === studentId)
    .reduce((sum, r) => sum + (Number(r.starsSpent) || 0), 0);
  return earned - spent;
}

function studentStarReport(state) {
  const members = state.teams.flatMap(t =>
    t.members.map(m => ({ ...m, teamId: t.id, teamName: t.zh, teamIcon: t.icon }))
  );
  return members
    .map(m => ({ ...m, balance: studentStarBalance(state, m.id) }))
    .sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));
}

function teamStarStats(state, teamId) {
  const stars = (state.starLedger || [])
    .filter(e => e.teamId === teamId)
    .reduce((sum, e) => sum + (Number(e.stars) || 0), 0);
  return { stars };
}

// ─────────────────────────── Reward corner ───────────────────────────

function addRewardItem(state, item) {
  const clean = { ...item, id: item.id || makeId("reward"), active: item.active !== false };
  const next = { ...state, rewardItems: [clean, ...(state.rewardItems || [])] };
  save(next);
  return next;
}

function updateRewardItem(state, itemId, patch) {
  const next = {
    ...state,
    rewardItems: (state.rewardItems || []).map(i => i.id === itemId ? { ...i, ...patch } : i),
  };
  save(next);
  return next;
}

function removeRewardItem(state, itemId) {
  const next = { ...state, rewardItems: (state.rewardItems || []).filter(i => i.id !== itemId) };
  save(next);
  return next;
}

function redeemReward(state, redemption) {
  const item = (state.rewardItems || []).find(i => i.id === redemption.rewardItemId);
  if (!item) { alert("奖品不存在 · Reward not found."); return state; }
  if (item.quantity <= 0) { alert("奖品库存不足 · Out of stock."); return state; }
  const balance = studentStarBalance(state, redemption.studentId);
  if (balance < item.starCost) {
    alert(`星星不足 · Not enough stars. 现有 ${balance} ⭐, 需要 ${item.starCost} ⭐`);
    return state;
  }
  const clean = {
    ...redemption,
    id: redemption.id || makeId("redeem"),
    ts: redemption.ts || Date.now(),
    rewardNameZh: item.nameZh,
    rewardNameEn: item.nameEn,
    starsSpent: item.starCost,
  };
  const next = {
    ...state,
    rewardItems: state.rewardItems.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i),
    rewardRedemptions: [clean, ...(state.rewardRedemptions || [])],
  };
  save(next);
  return next;
}

function addFundEvent(state, event) {
  const clean = {
    ...event,
    id: event.id || makeId("fund"),
    ts: event.ts || Date.now(),
    amountRm: Number(event.amountRm) || 0,
  };
  const next = { ...state, fundEvents: [clean, ...(state.fundEvents || [])] };
  save(next);
  return next;
}

function rewardFundStats(state) {
  const recycleValueRm = (state.weighIns || []).reduce(
    (sum, w) => sum + ((Number(w.points) || 0) / 100), 0
  );
  const fundEventsRm = (state.fundEvents || []).reduce(
    (sum, e) => sum + (Number(e.amountRm) || 0), 0
  );
  // Only count purchase cost for items actually bought (fundEvents type=purchase),
  // not the static catalog price.
  const rewardPurchaseRm = (state.fundEvents || [])
    .filter(e => e.type === "purchase")
    .reduce((sum, e) => sum + Math.abs(Number(e.amountRm) || 0), 0);
  const recycleIncomeRm = recycleValueRm
    + (state.fundEvents || [])
      .filter(e => e.type !== "purchase")
      .reduce((sum, e) => sum + (Number(e.amountRm) || 0), 0);
  return {
    recycleValueRm,
    fundEventsRm,
    rewardCostRm: rewardPurchaseRm,
    estimatedBalanceRm: recycleIncomeRm - rewardPurchaseRm,
  };
}

function ecoLoopStats(state) {
  const totals = totalStats(state);
  const stars = (state.starLedger || []);
  return {
    totalRecycledKg: totals.kg,
    totalRecycleValueRm: totals.points / 100,
    aiScanCount: (state.aiScans || []).length,
    starsAwarded: stars.reduce((sum, e) => sum + Math.max(0, Number(e.stars) || 0), 0),
    starsDeducted: Math.abs(stars.reduce((sum, e) => sum + Math.min(0, Number(e.stars) || 0), 0)),
    rewardRedemptionCount: (state.rewardRedemptions || []).length,
    fund: rewardFundStats(state),
  };
}

// ─────────────────────────── Catalog (物品图鉴) ───────────────────────────

function addCatalogItem(state, item) {
  const clean = {
    ...item,
    id: item.id || makeId("cat"),
    parts: Array.isArray(item.parts) ? item.parts : [],
    tags: Array.isArray(item.tags) ? item.tags : [],
    starSuggestion: Number(item.starSuggestion) || 1,
  };
  const next = { ...state, catalog: [clean, ...(state.catalog || [])] };
  save(next);
  return next;
}

function updateCatalogItem(state, itemId, patch) {
  const next = {
    ...state,
    catalog: (state.catalog || []).map(i => i.id === itemId ? { ...i, ...patch } : i),
  };
  save(next);
  return next;
}

function removeCatalogItem(state, itemId) {
  const next = { ...state, catalog: (state.catalog || []).filter(i => i.id !== itemId) };
  save(next);
  return next;
}

function searchCatalog(state, query) {
  const items = state.catalog || [];
  const q = String(query || "").toLowerCase().trim();
  if (!q) return items;
  return items.filter(i => {
    const haystack = [
      i.nameZh, i.nameEn,
      ...(i.tags || []),
      ...(i.materials || []),
      ...(i.parts || []).flatMap(p => [p.partZh, p.partEn]),
    ].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

function catalogStats(state) {
  return {
    total: (state.catalog || []).length,
    byBin: (state.catalog || []).reduce((acc, i) => {
      acc[i.binId] = (acc[i.binId] || 0) + 1;
      return acc;
    }, {}),
  };
}

// Convert an AI scan result into a catalog item (so each AI scan can teach the catalog).
function aiResultToCatalogItem(analysis, groupId = "other") {
  const first = (analysis.detected_items || [])[0] || {};
  const itemId = "cat_ai_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
  return {
    id: itemId,
    group: groupId,
    icon: "🤖",
    nameZh: first.label_zh || "未命名 AI 物品",
    nameEn: first.label_en || "Unnamed AI item",
    binId: (first.recommended_parts || [])[0]?.bin_category_id || "unknown",
    isMixed: !!first.is_mixed_material,
    materials: first.materials || [],
    parts: (first.recommended_parts || []).map(p => ({
      partZh: p.part_zh,
      partEn: p.part_en,
      binId: p.bin_category_id,
      action: p.action,
    })),
    starSuggestion: analysis.main_recommendation?.award_star_suggestion || 1,
    studentMsgZh: analysis.student_message?.zh || "",
    studentMsgEn: analysis.student_message?.en || "",
    teacherNoteZh: analysis.teacher_note?.zh || "",
    teacherNoteEn: analysis.teacher_note?.en || "",
    safetyFlags: analysis.safety_flags || [],
    tags: [first.label_zh, first.label_en].filter(Boolean),
    fromAi: true,
  };
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
    // AI scan helpers
    addAiScan, updateAiScanDecision,
    // Star ledger helpers
    addStarEvent, removeStarEvent, studentStarBalance, studentStarReport, teamStarStats,
    // Reward corner helpers
    addRewardItem, updateRewardItem, removeRewardItem, redeemReward,
    addFundEvent, rewardFundStats,
    // Dashboard
    ecoLoopStats,
    // Catalog helpers
    addCatalogItem, updateCatalogItem, removeCatalogItem,
    searchCatalog, catalogStats, aiResultToCatalogItem,
    DEFAULT_CATEGORIES, DEFAULT_TEAMS, DEFAULT_STAR_TYPES, DEFAULT_REWARD_ITEMS,
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
