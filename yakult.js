// Yakult honours are derived from reward events; no extra cards are issued.
const MY_OFFSET = 8 * 60 * 60 * 1000;
function timestamp(value) {
  if (value === null || value === undefined || value === '') return NaN;
  return typeof value === 'number' || /^\d+$/.test(String(value)) ? Number(value) : Date.parse(value);
}
function period(now = Date.now()) {
  const local = new Date(now + MY_OFFSET);
  const year = local.getUTCFullYear(), month = local.getUTCMonth();
  return {
    key: `${year}-${String(month + 1).padStart(2, '0')}`,
    label: `${year}年${month + 1}月`,
    start: Date.UTC(year, month, 1) - MY_OFFSET,
    end: Date.UTC(year, month + 1, 1) - MY_OFFSET,
  };
}
function matchesReason(event) {
  const text = `${event?.reasonZh || ''} ${event?.reasonEn || ''}`.normalize('NFKC');
  return /(?:^|[^a-z])yakult(?=$|[^a-z])|养乐多|養樂多|益力多/i.test(text);
}
function isYakult(event) {
  if (typeof event?.yakult === 'boolean') return event.yakult;
  return matchesReason(event);
}
function validAward(event) {
  return !!event?.id && !!event.studentId && Number.isSafeInteger(Number(event.stars)) && Number(event.stars) > 0;
}
function roster(state, includeArchived = false) {
  return (state.teams || []).flatMap(team => EcoData.teamMembers(state, team.id, { includeArchived }).map(member => ({
    ...member, teamId: team.id, teamName: team.zh, teamBadgeSrc: team.badgeSrc,
  })));
}
function report(state, now = Date.now(), includeArchived = false) {
  const month = period(now), students = roster(state, includeArchived).map(student => ({ ...student, total: 0, count: 0 }));
  const byId = new Map(students.map(student => [student.id, student])), seen = new Set();
  for (const event of state.starLedger || []) {
    if (!event?.id || seen.has(event.id)) continue;
    seen.add(event.id);
    const ts = timestamp(event.ts), student = byId.get(event.studentId);
    if (!student || !validAward(event) || !isYakult(event) || ts < month.start || ts >= month.end || ts > now || !Number.isFinite(ts)) continue;
    student.total += Number(event.stars);
    student.count += 1;
  }
  students.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const highest = students[0]?.total || 0;
  let lastTotal = -1, rank = 0;
  students.forEach((student, index) => {
    if (student.total !== lastTotal) rank = index + 1;
    lastTotal = student.total;
    student.rank = student.total > 0 ? rank : null;
    student.winner = student.total > 0 && student.total === highest;
  });
  return { ...month, students, highest, winners: students.filter(student => student.winner) };
}
function honours(state, studentId, now = Date.now()) {
  const current = period(now), months = new Map();
  for (const event of state.starLedger || []) {
    const ts = timestamp(event?.ts);
    if (!Number.isFinite(ts) || ts >= current.start || !validAward(event) || !isYakult(event)) continue;
    const month = period(ts);
    months.set(month.key, month);
  }
  return [...months.values()].sort((a, b) => b.start - a.start).flatMap(month => {
    const winner = report(state, month.end - 1, true).winners.find(student => student.id === studentId);
    return winner ? [{ month: month.key, label: month.label, total: winner.total }] : [];
  });
}
function classify(state, eventId, value, adminId) {
  if (adminId !== 'ADMIN' || ![true, false, null].includes(value)) return state;
  const event = (state.starLedger || []).find(event => event.id === eventId);
  if (!validAward(event)) return state;
  const next = { ...state, starLedger: state.starLedger.map(item => {
    if (item.id !== eventId) return item;
    const updated = { ...item, yakultReviewedBy: adminId, yakultReviewedAt: Date.now() };
    if (value === null) delete updated.yakult;
    else updated.yakult = value;
    return updated;
  }) };
  EcoData.save(next);
  return next;
}
window.EcoYakult = { period, timestamp, matchesReason, isYakult, validAward, report, honours, classify };
