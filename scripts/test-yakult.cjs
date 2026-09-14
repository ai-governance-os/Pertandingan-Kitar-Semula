const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const memory = new Map();
const ctx = { console, Date, Math, Map, Set, Intl, alert: message => { throw new Error(message); }, localStorage: { getItem: k => memory.get(k), setItem: (k,v) => memory.set(k,v) } };
ctx.window = ctx;
vm.createContext(ctx);
for (const file of ['data.js','yakult.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const d = ctx.EcoData, y = ctx.EcoYakult;
const state = d.defaultState(), students = state.teams.flatMap(t => t.members), [a,b,c] = students;
const now = Date.parse('2026-09-15T02:00:00Z');
const event = (id,studentId,stars,reasonZh,ts=now-1000,other={}) => ({id,studentId,stars,reasonZh,ts,teacherId:'TEACHER',...other});
state.starLedger = [
  event('a1',a.id,2,'购买 Yakult'), event('a2',a.id,3,'yakult'), event('a1',a.id,2,'购买 Yakult'),
  event('b1',b.id,5,'',now-2000,{reasonEn:'YAKULT purchase'}), event('ordinary',c.id,100,'功课'),
  event('c1',c.id,2,'益力多'),event('c2',c.id,1,'養樂多'),
  event('negative',a.id,-10,'Yakult 不相关扣卡'), event('excluded',c.id,20,'Yakult',now-1000,{yakult:false}),
  event('august',c.id,40,'Yakult',Date.parse('2026-08-31T15:59:59.999Z')),
  event('future',c.id,90,'Yakult',now+1000),event('invalid',c.id,90,'Yakult','invalid'),
  event('forced',c.id,1,'漏写原因',now-1000,{yakult:true}),
];
const original = JSON.stringify(state);
let r = y.report(state,now);
assert.equal(r.key,'2026-09');
assert.equal(r.winners.length,2);
assert.equal(r.highest,5);
assert.equal(r.students.find(s=>s.id===a.id).count,2,'Duplicate event IDs count once');
assert.equal(r.students.find(s=>s.id===c.id).total,4);
assert.equal(r.students.find(s=>s.id===c.id).rank,3,'Tied ranks use competition ranking');
assert.equal(JSON.stringify(state),original,'Reading statistics is pure');
state.rewardRedemptions = [{studentId:a.id,starsSpent:99,ts:now}];
assert.equal(y.report(state,now).students.find(s=>s.id===a.id).total,5,'Redeeming does not reduce Yakult total');
assert.equal(y.report(d.defaultState(),now).winners.length,0,'No winner with zero awards');
assert.equal(y.report(state,Date.parse('2026-09-30T16:00:00Z')).key,'2026-10');
assert.equal(y.report(state,Date.parse('2026-09-30T16:00:00Z')).winners.length,0,'KL midnight resets ranking');
assert.equal(y.matchesReason({reasonZh:'Ｙａｋｕｌｔ'}),true);
assert.equal(y.matchesReason({reasonZh:'养乐多'}),true);
assert.equal(y.matchesReason({reasonZh:'notyakultish'}),false);
assert.equal(y.report({...state,starLedger:[event('midnight',a.id,2,'Yakult',Date.parse('2026-08-31T16:00:00Z'))]},now).highest,2);
let corrected = y.classify(state,'b1',false,'ADMIN');
assert.equal(y.report(corrected,now).winners.length,1);
assert.equal(corrected.starLedger.find(e=>e.id==='b1').stars,5,'Classification changes no card amounts');
assert.equal(corrected.starLedger.length,state.starLedger.length);
assert.equal(y.classify(state,'b1',false,'TEACHER'),state);
corrected = y.classify(corrected,'b1',null,'ADMIN');
assert.equal(y.report(corrected,now).winners.length,2,'Auto classification can be restored');
memory.set('eco_warrior_v2',JSON.stringify(y.classify(state,'b1',false,'ADMIN')));
assert.equal(y.isYakult(d.load().starLedger.find(e=>e.id==='b1')),false,'Classification survives normalization/reload');
const removed = d.removeStarEvent(state,'a2');
assert.equal(y.report(removed,now).winners[0].id,b.id,'Undo recalculates champion');
assert.equal(y.honours(state,c.id,now)[0].month,'2026-08','Completed monthly honours are derived without a cron job');
const atMonthEnd={...state,starLedger:state.starLedger.filter(e=>!['future','invalid'].includes(e.id))};
assert.equal(y.honours(atMonthEnd,a.id,Date.parse('2026-09-30T16:00:00Z'))[0].total,5);
const archived = JSON.parse(JSON.stringify(state));
archived.teams[0].members.find(s=>s.id===a.id).active=false;
assert.equal(y.report(archived,now).winners.length,1,'Archived students do not compete on current roster');
assert.equal(d.petReport(state,now).filter(s=>s.yakult.winner).length,2,'Park uses the same winning calculation');
console.log('Yakult: ties, aliases, deductions, deduplication, month boundaries, undo, overrides, persistence and pet integration passed.');
