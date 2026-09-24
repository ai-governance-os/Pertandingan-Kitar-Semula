const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const memory = new Map();
const context = {
  window: {}, console, Date, Math, crypto: require('node:crypto').webcrypto,
  localStorage: {
    getItem: key => memory.get(key) || null,
    setItem: (key, value) => memory.set(key, value),
  },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'data.js'), 'utf8'), context);
const d = context.window.EcoData;
const state = d.defaultState();
const studentId = state.teams[0].members[0].id;
const beforeSeptember = Date.parse('2026-08-30T12:00:00+08:00');
const september = Date.parse('2026-09-20T12:00:00+08:00');
const october = Date.parse('2026-10-01T12:00:00+08:00');
state.starLedger = [
  { id: 'old', studentId, teacherId: 'TEACHER_A', stars: 99, ts: beforeSeptember },
  { id: 'new', studentId, teacherId: 'TEACHER_A', stars: 12, ts: september },
];
state.rewardRedemptions = [{ id: 'spent', studentId, starsSpent: 2, ts: september }];
assert.equal(d.studentStarBalance(state, studentId, october), 10, 'September cards carry into October');
assert.equal(d.studentAllTimeStarBalance(state, studentId), 109, 'older history is retained');
const exp = d.petState(state, studentId).exp;
const quota = d.teacherMonthlyQuota(state, 'TEACHER_A');
assert.equal(d.resetStudentCards(state, 'unknown'), state, 'anonymous reset is ignored');

let current = d.resetStudentCards(state, 'ADMIN');
assert.equal(current.studentCardResets.length, 1);
assert.equal(current.studentCardResets[0].cardsCleared, 10);
assert.equal(d.studentStarBalance(current, studentId), 0, 'admin settlement clears redeemable cards');
assert.equal(d.studentAllTimeStarBalance(current, studentId), 109, 'ledger and redemptions remain');
assert.equal(d.petState(current, studentId).exp, exp, 'pet growth remains');
assert.equal(d.teacherMonthlyQuota(current, 'TEACHER_A').used, quota.used, 'teacher quota remains');
assert.equal(d.studentStarBalance(d.load(), studentId), 0, 'settlement survives reload');

current = d.addStarEvent(current, { studentId, teamId: state.teams[0].id, teacherId: 'TEACHER_A', stars: 3 });
assert.equal(d.studentStarBalance(current, studentId), 3, 'new cards count immediately after settlement');
assert(current.starLedger[0].ts > current.studentCardResets[0].ts, 'same-millisecond awards follow reset');
current.starLedger.unshift({ id: 'offline-before-reset', studentId, stars: 5, ts: september });
assert.equal(d.studentStarBalance(current, studentId), 3, 'late sync of an old award stays in closed period');
current = d.resetStudentCards(current, 'ADMIN');
assert.equal(d.studentStarBalance(current, studentId), 0, 'repeated settlement clears the new period');
assert.equal(current.studentCardResets.length, 2);
console.log('PASS: carryover, admin settlement, history, pet growth, teacher quota, reload, post-reset awards, offline records.');
