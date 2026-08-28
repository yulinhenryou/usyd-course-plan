const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n');
function section(start, end) {
  const from = script.indexOf(start);
  const to = script.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `Missing source markers: ${start}`);
  return script.slice(from, to);
}
// Exercise the production data and pure accounting functions, without browser storage.
const model = new Function('localStorage', [
  section('    const courses =', '    const PLANNER_CONFIG'),
  section('    const progressTargets =', '    const progressStorageKey'),
  section('    function creditPoints(', '    function renderStructureSlot('),
  'return { courses, majorStructureRequirements, progressTargets, calculateDegreeCredits, evaluateStructureSlot, courseLevelRank, courseImportanceRank };'
].join('\n'))({ getItem: () => null });
const { courses, majorStructureRequirements: requirements, calculateDegreeCredits: calculate } = model;
const byCode = code => courses.find(course => course.code === code);
const statuses = (codes, status = 'completed') => Object.fromEntries(codes.map(code => [code, { status }]));
const sdCore = ['INFO1110', 'INFO1113', 'COMP2123', 'SOFT2201', 'SOFT2412'];

test('all inline scripts compile and all course codes remain unique', () => {
  new Function(script);
  assert.equal(courses.length, 71);
  assert.equal(new Set(courses.map(course => course.code)).size, courses.length);
  assert.ok(byCode('MATH3076'), 'Preserve the previous local addition');
});

test('new courses have full metadata and verified semester offerings', () => {
  for (const [code, term] of [['SOFT2201', 'S2'], ['SOFT3202', 'S1'], ['INFO3315', 'S2']]) {
    const course = byCode(code);
    for (const field of ['summary', 'matters', 'before', 'mastery', 'how', 'terms', 'readings', 'links']) assert.ok(course[field]?.length, `${code}: ${field}`);
    assert.equal(course.cp, '6cp');
    assert.equal(course.availability, `2026 ${term}`);
    assert.ok(course.links.some(([, url]) => url === `https://www.sydney.edu.au/units/${code}`));
  }
  assert.ok(byCode('SOFT2412').category.includes('core'));
});

test('minor is 12 + 18 + 6, without maths or a project slot', () => {
  assert.equal(requirements[1].id, 'sd');
  assert.deepEqual(requirements[1].slots.map(slot => slot.target), [12, 18, 6]);
  assert.deepEqual(requirements[1].slots[2].codes, ['INFO3315', 'SOFT3202']);
  assert.equal(requirements[1].slots.flatMap(slot => slot.codes).some(code => /MATH|SCPU|3888/.test(code)), false);
});

test('shared core counts toward both components and only once toward the degree', () => {
  for (const state of ['completed', 'locked', 'candidate']) {
    const result = calculate(statuses(['INFO1110', 'INFO1113', 'COMP2123'], state));
    assert.deepEqual(result.totals[state], { total: 18, major: 18, minor: 18, shared: 18, ole: 0, elective: 0 });
  }
});

test('minor choice is capped and gives priority to completed over locked over candidate', () => {
  const entries = { ...statuses(sdCore), INFO3315: { status: 'candidate' }, SOFT3202: { status: 'locked' } };
  const result = calculate(entries);
  assert.equal(result.totals.completed.minor, 30);
  assert.equal(result.totals.locked.minor, 6);
  assert.equal(result.totals.candidate.minor, 0);
  assert.equal(result.totals.candidate.elective, 6);
  entries.INFO3315.status = 'completed';
  const updated = calculate(entries);
  assert.equal(updated.totals.completed.minor, 36);
  assert.equal(updated.totals.locked.elective, 6);
  assert.equal(updated.groups[1].slots[2].extras[0].code, 'SOFT3202');
});

test('extra CS electives or projects cannot substitute missing core slots', () => {
  const result = calculate(statuses(['COMP3308', 'COMP3221', 'COMP3419', 'COMP3520', 'COMP3888 / COMP3988', 'SCPU3001']));
  assert.equal(result.totals.completed.major, 12);
  assert.equal(result.totals.completed.elective, 24);
  assert.equal(result.groups[0].slots[0].cp, 0);
});

test('old maths and data plans remain degree credits but not current component credits', () => {
  const entries = statuses(['MATH1064', 'MATH2022', 'MATH2080', 'MATH3066', 'MATH3076', 'DATA3404'], 'locked');
  const snapshot = JSON.stringify(entries);
  const result = calculate(entries);
  assert.equal(result.totals.locked.total, 36);
  assert.equal(result.totals.locked.elective, 36);
  assert.equal(result.totals.locked.major + result.totals.locked.minor, 0);
  assert.equal(JSON.stringify(entries), snapshot, 'Calculations must not migrate or delete records');
});

test('OLE cap and every status bucket reconcile to the unique degree total', () => {
  const entries = Object.fromEntries(courses.map((course, index) => [course.code, { status: ['completed', 'locked', 'candidate'][index % 3] }]));
  const result = calculate(entries);
  const all = Object.values(result.totals);
  assert.equal(all.reduce((sum, bucket) => sum + bucket.ole, 0), 6);
  assert.equal(all.reduce((sum, bucket) => sum + bucket.major, 0), 48);
  assert.equal(all.reduce((sum, bucket) => sum + bucket.minor, 0), 36);
  all.forEach(bucket => assert.equal(bucket.total, bucket.major + bucket.minor - bucket.shared + bucket.ole + bucket.elective));
});

test('neutral and avoided courses contribute no credits', () => {
  const result = calculate({ INFO1110: { status: 'avoid' }, SOFT2201: { status: 'neutral' } });
  assert.ok(Object.values(result.totals).every(bucket => bucket.total === 0));
});

test('course order is level first, then component importance', () => {
  for (let index = 1; index < courses.length; index++) {
    const a = courses[index - 1], b = courses[index];
    assert.ok(model.courseLevelRank(a) <= model.courseLevelRank(b));
    if (model.courseLevelRank(a) === model.courseLevelRank(b)) assert.ok(model.courseImportanceRank(a) <= model.courseImportanceRank(b));
  }
  assert.ok(courses.indexOf(byCode('INFO1110')) < courses.indexOf(byCode('DATA1002 / DATA1902')));
});

test('default semester suggestions contain only the new required path', () => {
  const plan = html.slice(html.indexOf('<section id="plans"'), html.indexOf('<section id="courses"'));
  const stages = [...plan.matchAll(/data-stage-id="([^"]+)"[\s\S]*?<\/article>/g)];
  const allowed = new Set([...sdCore, 'COMP2017', 'COMP2022', 'COMP3027', 'COMP3888 / COMP3988']);
  stages.forEach(([markup, id]) => {
    const codes = [...markup.matchAll(/<strong>([^<]+)<\/strong>/g)].map(match => match[1]);
    codes.forEach(code => assert.ok(allowed.has(code), code));
    if (id.endsWith('s1')) assert.ok(codes.every(code => !['SOFT2201', 'SOFT2412', 'COMP3888 / COMP3988'].includes(code)));
  });
  assert.equal(stages.length, 6);
});

test('all new prerequisite targets exist and old program references are gone', () => {
  const chains = section('const bottleneckChains =', 'function updateBottleneckMap(');
  ['SOFT2201', 'SOFT3202', 'INFO3315', 'SOFT2412'].forEach(code => assert.ok(chains.includes(`target: "${code}"`)));
  const withoutLegacyKey = html.replace('usyd-bsc-cs-dma-planner', 'legacy-storage');
  assert.doesNotMatch(withoutLegacyKey, /\bDMA\b|\bdma\b|Discrete Mathematics and Algorithms/);
  ['usyd-course-status-v1', 'usyd-theme-preference', 'usyd-current-stage-override'].forEach(key => assert.ok(html.includes(key)));
});
