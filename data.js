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
  // 🌱 环保类（与回收比赛挂钩）
  { id: "eco_recycle",          group: "eco", icon: "♻️", zh: "环保回收", en: "Eco Recycling",      defaultStars: 2 },
  { id: "eco_paper_box",        group: "eco", icon: "📄", zh: "纸张回收", en: "Paper Recycling",    defaultStars: 1 },
  { id: "eco_save_electricity", group: "eco", icon: "💡", zh: "节省电源", en: "Save Electricity",   defaultStars: 1 },
  { id: "eco_save_water",       group: "eco", icon: "💧", zh: "节省水源", en: "Save Water",         defaultStars: 1 },
  { id: "eco_campus_care",      group: "eco", icon: "🌱", zh: "爱护校园", en: "Campus Care",        defaultStars: 1 },
  // 📚 学业品格类（全方位奖励，不只环保）
  { id: "academic",             group: "character", icon: "📚", zh: "学业进步", en: "Academic Progress", defaultStars: 1 },
  { id: "character",            group: "character", icon: "⭐", zh: "品格表现", en: "Good Character",   defaultStars: 1 },
  { id: "helpfulness",          group: "character", icon: "🤝", zh: "助人为乐", en: "Helpfulness",      defaultStars: 1 },
  { id: "leadership",           group: "character", icon: "🧭", zh: "提醒/领导", en: "Leadership",      defaultStars: 2 },
  // ⚠️ 扣星
  { id: "deduction",            group: "deduction", icon: "⚠️", zh: "扣星",     en: "Deduction",       defaultStars: -1 },
];

const STAR_GROUP_LABELS = {
  eco:       { zh: "🌱 环保",     en: "Eco" },
  character: { zh: "📚 学业品格", en: "Character" },
  deduction: { zh: "⚠️ 扣星",     en: "Deduction" },
};

const DEFAULT_REWARD_CATEGORIES = [
  { id: "a", level: "A", zh: "A级奖励", en: "A Reward", minStars: 200, maxStars: 300, color: "#E33B2F", tint: "#FFF0D2" },
  { id: "b", level: "B", zh: "B级奖励", en: "B Reward", minStars: 100, maxStars: 199, color: "#1769C2", tint: "#EAF5FF" },
  { id: "c", level: "C", zh: "C级奖励", en: "C Reward", minStars: 50,  maxStars: 99,  color: "#25A64A", tint: "#ECF9EA" },
  { id: "d", level: "D", zh: "D级奖励", en: "D Reward", minStars: 0,   maxStars: 49,  color: "#8038B8", tint: "#F5ECFF" },
];

const DEFAULT_REWARD_ITEMS = [
  { id: "reward_a_bottle", categoryId: "a", icon: "🏆", imageUrl: "assets/rewards/a_bottle.jpg", nameZh: "水瓶", nameEn: "Bottle", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_a_markers", categoryId: "a", icon: "🏆", imageUrl: "assets/rewards/a_markers.jpg", nameZh: "马克笔", nameEn: "Markers", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_a_colored_pencils", categoryId: "a", icon: "🏆", imageUrl: "assets/rewards/a_colored_pencils.jpg", nameZh: "颜色笔", nameEn: "Colour pencils", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_a_premium_toy", categoryId: "a", icon: "🏆", imageUrl: "assets/rewards/a_premium_toy.jpg", nameZh: "特级玩具", nameEn: "Premium toy", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_b_pencil_case", categoryId: "b", icon: "🥈", imageUrl: "assets/rewards/b_pencil_case.jpg", nameZh: "笔袋", nameEn: "Pencil case", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_b_mechanical_pen", categoryId: "b", icon: "🥈", imageUrl: "assets/rewards/b_mechanical_pen.jpg", nameZh: "自动笔", nameEn: "Mechanical pen", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_b_toy", categoryId: "b", icon: "🥈", imageUrl: "assets/rewards/b_toy.jpg", nameZh: "玩具", nameEn: "Toy", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_b_piggy_bank", categoryId: "b", icon: "🥈", imageUrl: "assets/rewards/b_piggy_bank.jpg", nameZh: "扑满", nameEn: "Piggy bank", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_b_chess", categoryId: "b", icon: "🥈", imageUrl: "assets/rewards/b_chess.jpg", nameZh: "棋类游戏", nameEn: "Board game", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_c_keychain", categoryId: "c", icon: "🥉", imageUrl: "assets/rewards/c_keychain.jpg", nameZh: "锁匙扣", nameEn: "Keychain", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_c_eraser", categoryId: "c", icon: "🥉", imageUrl: "assets/rewards/c_eraser.jpg", nameZh: "橡皮擦", nameEn: "Eraser", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_c_toy", categoryId: "c", icon: "🥉", imageUrl: "assets/rewards/c_toy.jpg", nameZh: "小玩具", nameEn: "Small toy", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_c_correction_fluid", categoryId: "c", icon: "🥉", imageUrl: "assets/rewards/c_correction_fluid.jpg", nameZh: "涂改液", nameEn: "Correction fluid", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_d_pencils", categoryId: "d", icon: "⭐", imageUrl: "assets/rewards/d_pencils.jpg", nameZh: "铅笔", nameEn: "Pencils", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_d_sharpener", categoryId: "d", icon: "⭐", imageUrl: "assets/rewards/d_sharpener.jpg", nameZh: "铅笔削", nameEn: "Sharpener", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_d_eraser", categoryId: "d", icon: "⭐", imageUrl: "assets/rewards/d_eraser.jpg", nameZh: "橡皮擦", nameEn: "Eraser", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_d_stickers", categoryId: "d", icon: "⭐", imageUrl: "assets/rewards/d_stickers.jpg", nameZh: "贴纸", nameEn: "Stickers", quantity: 10, purchaseCostRm: 0, active: true },
  { id: "reward_d_ruler", categoryId: "d", icon: "⭐", imageUrl: "assets/rewards/d_ruler.jpg", nameZh: "尺", nameEn: "Ruler", quantity: 10, purchaseCostRm: 0, active: true },
];

const DEFAULT_SETTINGS = {
  aiEnabled: true,
  aiLocale: "zh_en",
  storePhotos: false,
  teacherReviewRequiredBelowConfidence: 0.75,
  // How many missed sessions before a student loses personal-prize eligibility
  // (the red list). Admin-adjustable from the 管理 page; changing it re-evaluates
  // every student immediately since eligibility is always derived, never stored.
  redListThreshold: 3,
};

function mergeStarTypes(incoming) {
  const defaults = clone(DEFAULT_STAR_TYPES);
  if (!Array.isArray(incoming) || !incoming.length) return defaults;
  const byId = new Map(incoming.map(t => [t.id, t]));
  // For each default, prefer existing override but always re-apply group/icon if missing.
  const merged = defaults.map(def => {
    const exist = byId.get(def.id);
    if (!exist) return def;
    return {
      ...def,
      ...exist,
      group: exist.group || def.group,
      icon: exist.icon || def.icon,
    };
  });
  // Keep any custom user-added star types that aren't in defaults.
  const defaultIds = new Set(defaults.map(d => d.id));
  const customs = incoming.filter(t => !defaultIds.has(t.id));
  return [...merged, ...customs];
}

function seedCatalog() {
  // EcoCatalog.SEED is defined in catalog.js (loaded before data.js).
  // Fallback to empty array if catalog.js failed to load.
  return (window.EcoCatalog && Array.isArray(window.EcoCatalog.SEED))
    ? clone(window.EcoCatalog.SEED)
    : [];
}

function mergeRewardCategories(incoming) {
  const defaults = clone(DEFAULT_REWARD_CATEGORIES);
  if (!Array.isArray(incoming) || !incoming.length) return defaults;
  const byId = new Map(incoming.map(c => [c.id, c]));
  return defaults.map(def => ({ ...def, ...(byId.get(def.id) || {}) }));
}

function rewardCategoryIdForCost(starCost) {
  const cost = Number(starCost) || 0;
  if (cost >= 200) return "a";
  if (cost >= 100) return "b";
  if (cost >= 50) return "c";
  return "d";
}

function isLegacyDefaultRewardSet(items) {
  if (!Array.isArray(items) || !items.length) return false;
  const legacyIds = new Set(["reward_pencil", "reward_eraser", "reward_ruler", "reward_notebook", "reward_sticker"]);
  return items.every(item => legacyIds.has(item.id) && !item.categoryId && !item.imageUrl);
}

function normalizeRewardItems(items, categories = DEFAULT_REWARD_CATEGORIES) {
  const source = isLegacyDefaultRewardSet(items)
    ? clone(DEFAULT_REWARD_ITEMS)
    : (Array.isArray(items) && items.length ? items : clone(DEFAULT_REWARD_ITEMS));
  const categoryIds = new Set(categories.map(c => c.id));
  return source.map((item, index) => {
    const categoryId = categoryIds.has(item.categoryId)
      ? item.categoryId
      : rewardCategoryIdForCost(item.starCost);
    return {
      ...item,
      id: item.id || makeId("reward"),
      categoryId,
      icon: item.icon || (categoryId === "a" ? "🏆" : categoryId === "b" ? "🥈" : categoryId === "c" ? "🥉" : "⭐"),
      imageUrl: item.imageUrl || "",
      nameZh: item.nameZh || item.name || `奖品 ${index + 1}`,
      nameEn: item.nameEn || item.name || `Reward ${index + 1}`,
      quantity: Math.max(0, Number(item.quantity) || 0),
      purchaseCostRm: Number(item.purchaseCostRm) || 0,
      active: item.active !== false,
    };
  });
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
    rewardCategories: clone(DEFAULT_REWARD_CATEGORIES),
    rewardItems: clone(DEFAULT_REWARD_ITEMS),
    rewardRedemptions: [],
    fundEvents: [],
    catalog: seedCatalog(),
    // Per-student pet overrides only (species swap / nickname). Growth and
    // hunger are always derived from starLedger, never stored.
    pets: {},
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
  // Always merge incoming star types with defaults so newly-added types (e.g. academic, helpfulness)
  // and the `group` field appear for existing users without wiping their saved state.
  state.starTypes = mergeStarTypes(input.starTypes);
  state.starLedger = Array.isArray(input.starLedger) ? input.starLedger : [];
  state.rewardCategories = mergeRewardCategories(input.rewardCategories);
  state.rewardItems = normalizeRewardItems(input.rewardItems, state.rewardCategories);
  state.rewardRedemptions = Array.isArray(input.rewardRedemptions) ? input.rewardRedemptions : [];
  state.fundEvents = Array.isArray(input.fundEvents) ? input.fundEvents : [];
  state.catalog = Array.isArray(input.catalog) && input.catalog.length ? input.catalog : seedCatalog();
  state.pets = (input.pets && typeof input.pets === "object") ? input.pets : {};
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

// Missed-session count that costs a student their personal prize. Read from
// settings so admins can tune it; clamped to >= 1 so the UI can never create a
// nonsensical "0 misses = already disqualified" state.
function redListThreshold(state) {
  const raw = Number(state?.settings?.redListThreshold);
  return Number.isFinite(raw) && raw >= 1 ? Math.round(raw) : DEFAULT_SETTINGS.redListThreshold;
}

function setRedListThreshold(state, value) {
  const next = Math.max(1, Math.round(Number(value) || 1));
  const updated = { ...state, settings: { ...(state.settings || {}), redListThreshold: next } };
  save(updated);
  return updated;
}

function absenceReport(state) {
  const threshold = redListThreshold(state);
  const allMembers = state.teams.flatMap(team => team.members.map(m => ({ ...m, teamId: team.id, teamName: team.zh })));
  return allMembers.map(member => {
    const missed = state.sessions.filter(s => attendanceFor(state, s.id, member.id) === false);
    return {
      ...member,
      missedCount: missed.length,
      missedSessions: missed,
      eligible: missed.length < threshold,
      missesLeft: Math.max(0, threshold - missed.length),
    };
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

// Timestamp for the 1st of the month (00:00 local time) containing `ts`.
// Used to auto-reset the visible star balance every month with zero
// infrastructure: no cron job, no "did we already reset" flag, no button.
// The moment the calendar rolls into a new month, every balance computed
// from this cutoff naturally excludes last month's stars — it just works,
// even if nobody opens the app until the 3rd or the 10th.
function monthStartTs(ts = Date.now()) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).getTime();
}

function currentRewardMonthLabel(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

// Monthly balance — this is THE balance shown everywhere in the UI
// (leaderboard, redemption eligibility, AI scan panel). Resets automatically
// on the 1st of every month; stars earned or spent before the cutoff simply
// stop counting. Full history is never deleted — see studentAllTimeStarBalance
// and the raw starLedger / rewardRedemptions for the permanent record.
function studentStarBalance(state, studentId, asOfTs = Date.now()) {
  const cutoff = monthStartTs(asOfTs);
  const earned = (state.starLedger || [])
    .filter(e => e.studentId === studentId && (e.ts || 0) >= cutoff)
    .reduce((sum, e) => sum + (Number(e.stars) || 0), 0);
  const spent = (state.rewardRedemptions || [])
    .filter(r => r.studentId === studentId && (r.ts || 0) >= cutoff)
    .reduce((sum, r) => sum + (Number(r.starsSpent) || 0), 0);
  return earned - spent;
}

// All-time balance, ignoring the monthly reset — for admin reporting / CSV
// export / "since joining" stats. Never shown as the primary redeemable
// balance because that resets monthly by design.
function studentAllTimeStarBalance(state, studentId) {
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
    .map(m => ({
      ...m,
      balance: studentStarBalance(state, m.id),
      allTimeBalance: studentAllTimeStarBalance(state, m.id),
    }))
    .sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));
}

function teamStarStats(state, teamId) {
  const stars = (state.starLedger || [])
    .filter(e => e.teamId === teamId)
    .reduce((sum, e) => sum + (Number(e.stars) || 0), 0);
  return { stars };
}

// ─────────────────────────── 宠物园 · Eco Pets ───────────────────────────
//
// Pets are DERIVED from the star ledger on purpose:
//   growth (exp) = lifetime stars EARNED — spending stars on a gift never
//                  shrinks a pet ("auto-feed" rule chosen by the school)
//   hunger       = days since that student last earned a star
//
// Nothing is written per view, so the pet screen adds zero extra load on the
// single-row cloud sync and can't create write conflicts. The only stored bits
// are the species override and nickname (state.pets), which change rarely.

// Twelve mythic beasts, one per student and never repeated across the school —
// the school asked for 神兽, not farm animals. The stage emoji are only used by
// the fallback card list; the 3D park draws each beast from PET_LOOKS.
const PET_SPECIES = [
  { id: "qilin",     zh: "麒麟",   en: "Qilin",         aura: "#FFC45C", stages: ["🥚", "🐣", "🦌", "🦄", "✨"] },
  { id: "phoenix",   zh: "凤凰",   en: "Phoenix",       aura: "#FF7A6A", stages: ["🥚", "🐣", "🐤", "🦅", "🔥"] },
  { id: "ninetail",  zh: "九尾狐", en: "Nine-Tail Fox", aura: "#BE8CFF", stages: ["🥚", "🐣", "🦊", "🦊", "🌙"] },
  { id: "yinglong",  zh: "应龙",   en: "Winged Dragon", aura: "#5AC8FF", stages: ["🥚", "🐣", "🦎", "🐲", "🐉"] },
  { id: "baize",     zh: "白泽",   en: "Baize",         aura: "#E8F0FF", stages: ["🥚", "🐣", "🐐", "🦬", "📖"] },
  { id: "lingui",    zh: "灵龟",   en: "Spirit Turtle", aura: "#5ADCAA", stages: ["🥚", "🐣", "🐢", "🐢", "🛡️"] },
  { id: "stardeer",  zh: "星鹿",   en: "Star Deer",     aura: "#8CAAFF", stages: ["🥚", "🐣", "🦌", "🦌", "🌟"] },
  { id: "cloudpard", zh: "云豹",   en: "Cloud Leopard", aura: "#FFE196", stages: ["🥚", "🐣", "🐆", "🐆", "☁️"] },
  { id: "seakirin",  zh: "海麟",   en: "Sea Kirin",     aura: "#50BEDC", stages: ["🥚", "🐟", "🐠", "🐬", "🌊"] },
  { id: "pixiu",     zh: "貔貅",   en: "Pixiu",         aura: "#FFB45A", stages: ["🥚", "🐣", "🐕", "🦁", "💰"] },
  { id: "thunder",   zh: "雷鸟",   en: "Thunderbird",   aura: "#FFE66E", stages: ["🥚", "🐣", "🐦", "🦅", "⚡"] },
  { id: "bamboo",    zh: "竹灵",   en: "Bamboo Spirit", aura: "#96DC78", stages: ["🌰", "🌱", "🌿", "🎋", "🌳"] },
];

// Exp thresholds, calibrated against the school's real ledger (756 star events,
// 19 students, lifetime totals 0–244, median ~105). Earlier draft values
// (8/25/60/120) put 42% of the school at max stage on day one, which kills the
// point of the game — these spread the current roster across all five stages
// and leave 传说 as a genuine year-long goal nobody has reached yet.
const PET_STAGES = [
  { minExp: 0,   zh: "蛋",   en: "Egg" },
  { minExp: 25,  zh: "幼体", en: "Baby" },
  { minExp: 70,  zh: "少年", en: "Junior" },
  { minExp: 150, zh: "成年", en: "Adult" },
  { minExp: 300, zh: "传说", en: "Legend" },
];

const PET_HUNGER_LEVELS = [
  { minDays: 14, key: "starving", zh: "很饿！",   en: "Starving",  icon: "😰" },
  { minDays: 7,  key: "hungry",   zh: "饿了",     en: "Hungry",    icon: "😟" },
  { minDays: 3,  key: "peckish",  zh: "有点饿",   en: "Peckish",   icon: "🙂" },
  { minDays: 0,  key: "full",     zh: "精神饱满", en: "Well fed",  icon: "😊" },
];

// A student who has never earned a star isn't "well fed" and isn't starving
// either — the egg simply hasn't hatched yet. Giving that its own state keeps
// brand-new students from being shown as neglected on day one.
const PET_HUNGER_UNHATCHED = { minDays: 0, key: "unhatched", zh: "等待孵化", en: "Not hatched yet", icon: "🥚" };

const PET_STARVING_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

// Stable hash so a student always hatches the same species on every device,
// with no stored assignment needed.
function hashString(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function petSpeciesFor(state, studentId) {
  const override = state?.pets?.[studentId]?.speciesId;
  const picked = override && PET_SPECIES.find(s => s.id === override);
  return picked || PET_SPECIES[hashString(studentId) % PET_SPECIES.length];
}

function petStageFor(exp) {
  let index = 0;
  PET_STAGES.forEach((stage, i) => { if (exp >= stage.minExp) index = i; });
  return index;
}

function petHungerFor(days) {
  if (days === null) return PET_HUNGER_UNHATCHED;
  return PET_HUNGER_LEVELS.find(l => days >= l.minDays) || PET_HUNGER_LEVELS[PET_HUNGER_LEVELS.length - 1];
}

function petState(state, studentId, now = Date.now()) {
  const events = (state.starLedger || []).filter(e => e.studentId === studentId);

  // Lifetime growth: positives feed the pet, deductions do set it back (a
  // deduction is a real behaviour signal), but never below zero.
  const exp = Math.max(0, events.reduce((sum, e) => sum + (Number(e.stars) || 0), 0));

  // Hunger only looks at stars EARNED, so a deduction doesn't count as a meal.
  const lastFedTs = events
    .filter(e => (Number(e.stars) || 0) > 0)
    .reduce((latest, e) => Math.max(latest, Number(e.ts) || 0), 0);
  const daysSinceFed = lastFedTs ? Math.floor((now - lastFedTs) / DAY_MS) : null;

  const hunger = petHungerFor(daysSinceFed);
  const stageIndex = petStageFor(exp);

  // Starving pets LOOK like they regressed one stage — the scare the school
  // wanted — but exp is untouched, so one new star restores them instantly.
  const displayStageIndex = hunger.key === "starving" ? Math.max(0, stageIndex - 1) : stageIndex;

  const species = petSpeciesFor(state, studentId);
  const nextStage = PET_STAGES[stageIndex + 1] || null;

  return {
    studentId,
    species,
    nickname: state?.pets?.[studentId]?.nickname || "",
    exp,
    stageIndex,
    stage: PET_STAGES[stageIndex],
    displayStageIndex,
    icon: species.stages[displayStageIndex],
    isMaxStage: !nextStage,
    nextStage,
    expToNext: nextStage ? Math.max(0, nextStage.minExp - exp) : 0,
    stageProgress: nextStage
      ? Math.min(1, Math.max(0, (exp - PET_STAGES[stageIndex].minExp) / (nextStage.minExp - PET_STAGES[stageIndex].minExp)))
      : 1,
    daysSinceFed,
    lastFedTs: lastFedTs || null,
    hunger,
    isRegressed: hunger.key === "starving" && stageIndex > 0,
    neverFed: !lastFedTs,
  };
}

function petReport(state, now = Date.now()) {
  const members = state.teams.flatMap(t =>
    t.members.map(m => ({ ...m, teamId: t.id, teamName: t.zh, teamIcon: t.icon, teamColor: t.primary }))
  );
  return members
    .map(m => ({ ...m, pet: petState(state, m.id, now) }))
    .sort((a, b) => b.pet.exp - a.pet.exp || a.name.localeCompare(b.name));
}

function setPetSpecies(state, studentId, speciesId) {
  const pets = { ...(state.pets || {}) };
  pets[studentId] = { ...(pets[studentId] || {}), speciesId };
  const next = { ...state, pets };
  save(next);
  return next;
}

function setPetNickname(state, studentId, nickname) {
  const pets = { ...(state.pets || {}) };
  pets[studentId] = { ...(pets[studentId] || {}), nickname: String(nickname || "").slice(0, 20) };
  const next = { ...state, pets };
  save(next);
  return next;
}

// ─────────────────────────── Reward corner ───────────────────────────

function rewardCategory(state, categoryId) {
  const categories = state.rewardCategories || DEFAULT_REWARD_CATEGORIES;
  return categories.find(c => c.id === categoryId) || categories[0] || DEFAULT_REWARD_CATEGORIES[0];
}

function rewardCategoryForItem(state, item) {
  return rewardCategory(state, item?.categoryId || rewardCategoryIdForCost(item?.starCost));
}

function rewardCategoryRangeLabel(category) {
  if (!category) return "0 - 0";
  return `${Number(category.minStars) || 0} - ${Number(category.maxStars) || 0}`;
}

function rewardItemCost(state, item) {
  const category = rewardCategoryForItem(state, item);
  return Number(category?.minStars) || 0;
}

function addRewardItem(state, item) {
  const categories = state.rewardCategories || DEFAULT_REWARD_CATEGORIES;
  const clean = normalizeRewardItems([{ ...item, id: item.id || makeId("reward") }], categories)[0];
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
  const category = rewardCategoryForItem(state, item);
  const cost = rewardItemCost(state, item);
  const balance = studentStarBalance(state, redemption.studentId);
  if (balance < cost) {
    alert(`星星不足 · Not enough stars. 现有 ${balance} ⭐, 需要 ${cost} ⭐`);
    return state;
  }
  const clean = {
    ...redemption,
    id: redemption.id || makeId("redeem"),
    ts: redemption.ts || Date.now(),
    rewardNameZh: item.nameZh,
    rewardNameEn: item.nameEn,
    rewardCategoryId: category?.id || item.categoryId || "",
    rewardCategoryLevel: category?.level || "",
    starsSpent: cost,
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
    redListThreshold, setRedListThreshold,
    // Pets
    petState, petReport, petSpeciesFor, setPetSpecies, setPetNickname,
    PET_SPECIES, PET_STAGES, PET_STARVING_DAYS,
    exportCSV,
    // AI scan helpers
    addAiScan, updateAiScanDecision,
    // Star ledger helpers
    addStarEvent, removeStarEvent, studentStarBalance, studentAllTimeStarBalance,
    studentStarReport, teamStarStats, monthStartTs, currentRewardMonthLabel,
    // Reward corner helpers
    rewardCategory, rewardCategoryForItem, rewardCategoryRangeLabel, rewardItemCost,
    addRewardItem, updateRewardItem, removeRewardItem, redeemReward,
    addFundEvent, rewardFundStats,
    // Dashboard
    ecoLoopStats,
    // Catalog helpers
    addCatalogItem, updateCatalogItem, removeCatalogItem,
    searchCatalog, catalogStats, aiResultToCatalogItem,
    DEFAULT_CATEGORIES, DEFAULT_TEAMS, DEFAULT_STAR_TYPES, DEFAULT_REWARD_CATEGORIES, DEFAULT_REWARD_ITEMS, STAR_GROUP_LABELS,
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
