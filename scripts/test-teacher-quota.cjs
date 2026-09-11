const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
let now = Date.parse('2026-09-30T15:59:59Z');
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
}
const memory = new Map(), alerts = [];
const context = {
  window: {}, Date: Clock, Math, console,
  crypto: require('crypto').webcrypto,
  alert: message => alerts.push(message),
  localStorage: { getItem: k => memory.get(k) || null, setItem: (k,v) => memory.set(k,v) },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), context);
const d = context.window.EcoData;
let state = d.defaultState(), sequence = 0;
const event = (stars, teacherId = 'TEACHER_A', extra = {}) => ({
  id: `quota-test-${++sequence}`, studentId: 'test-student', teacherId,
  stars, reasonZh: '测试原因', ...extra,
});
const quota = (id = 'TEACHER_A') => d.teacherMonthlyQuota(state, id);
assert.equal(quota().limit, 150);
assert.equal(d.teacherQuotaMonth(now), '2026-09');
state = d.addStarEvent(state, event(149));
assert.equal(quota().remaining, 1);
state = d.addStarEvent(state, event(-10));
assert.equal(quota().used, 149, 'Deductions never refill allowance');
assert.equal(d.addStarEvent(state, event(2)), state, 'Over-limit awards rejected atomically');
for (const n of [0, NaN, Infinity, 1.5]) assert.equal(d.addStarEvent(state, event(n)), state);
assert.equal(d.addStarEvent(state, event(1, 'unknown')), state);
assert.equal(d.addStarEvent(state, event(-1, 'TEACHER_A', {reasonZh:''})), state);
const last = event(1);
state = d.addStarEvent(state, last);
assert.equal(quota().remaining, 0);
assert.equal(d.addStarEvent(state, last), state, 'Duplicate award rejected');
state = d.removeStarEvent(state, last.id);
assert.equal(quota().used, 150, 'Deleting awards does not replenish quota');
state = d.addStarEvent(state, event(20, 'TEACHER_B'));
assert.equal(quota('TEACHER_B').used, 20);
assert.equal(quota().used, 150);
state = d.setTeacherMonthlyLimit(state, 'TEACHER_A', 200);
assert.equal(quota().remaining, 50);
state = d.setTeacherMonthlyLimit(state, 'TEACHER_A', 100);
assert.equal(quota().remaining, 0);
assert.equal(quota().used, 150);
assert.equal(d.addStarEvent(state, event(1)), state);
for (const value of [-1, 2.5, '', 'invalid']) assert.equal(d.setTeacherMonthlyLimit(state, 'TEACHER_A', value), state);
state = d.setTeacherMonthlyLimit(state, 'TEACHER_B', 0);
assert.equal(d.addStarEvent(state, event(1, 'TEACHER_B')), state);
state = d.load();
assert.equal(quota().used, 150, 'Reload retains ledger and deleted-award usage');
assert.equal(quota().limit, 100);
now = Date.parse('2026-09-30T16:00:00Z');
assert.equal(quota().month, '2026-10');
assert.equal(quota().used, 0);
assert.equal(quota().remaining, 100, 'Month resets to configured limit, no rollover');
assert(state.starLedger.length > 0, 'Monthly rollover retains history');
state = d.addStarEvent(state, event(80, 'TEACHER_A', {ts: Date.parse('2026-08-01T00:00:00Z')}));
assert.equal(quota().used, 80, 'Backdated input cannot avoid current-month quota');
state = d.resetSeason(state);
assert.equal(quota().used, 80, 'Season reset cannot replenish this month');
assert.equal(quota().limit, 100, 'Season reset preserves configured limits');
now = Date.parse('2026-12-31T16:00:00Z');
assert.equal(quota().month, '2027-01');
assert.equal(quota().remaining, 100);
console.log('PASS: quota limits, deductions, deletion, custom limits, reload, Malaysia month/year rollover, backdating, season reset.');
