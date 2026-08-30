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

// Exercise production data and pure accounting functions without browser storage.
const model = new Function('localStorage', [
  section('    const courses =', '    const PLANNER_CONFIG'),
  section('    const progressTargets =', '    const progressStorageKey'),
  section('    function creditPoints(', '    function renderStructureSlot('),
  'return { courses, majorStructureRequirements, progressTargets, calculateDegreeCredits, evaluateStructureSlot, courseLevelRank, courseImportanceRank };'
].join('\n'))({ getItem: () => null });

const { courses, majorStructureRequirements: requirements, calculateDegreeCredits: calculate } = model;
const byCode = code => courses.find(course => course.code === code);
const statuses = (codes, status = 'completed') => Object.fromEntries(codes.map(code => [code, { status }]));
const statisticsCore = ['MATH1061', 'DATA1001', 'DATA2002', 'STAT2011'];

test('all inline scripts compile and all course codes remain unique', () => {
  new Function(script);
  assert.equal(courses.length, 76);
  assert.equal(new Set(courses.map(course => course.code)).size, courses.length);
  assert.ok(byCode('MATH3076'), 'Preserve the previous local addition');
});

test('new maths, business and statistics courses have complete verified metadata', () => {
  const expected = [
    ['MATH2069', 'S1'], ['QBUS3330', 'S2'], ['STAT2011', 'S1'], ['STAT3021', 'S1'],
    ['STAT3022', 'S1'], ['STAT3023', 'S2'], ['STAT3888', 'S2']
  ];
  for (const [code, term] of expected) {
    const course = byCode(code);
    assert.ok(course, code);
    for (const field of ['summary', 'matters', 'before', 'mastery', 'how', 'terms', 'readings', 'links']) {
      assert.ok(course[field]?.length, `${code}: ${field}`);
    }
    assert.equal(course.cp, '6cp');
    assert.equal(course.availability, `2026 ${term}`);
    assert.ok(course.links.some(([, url]) => url === `https://www.sydney.edu.au/units/${code}`));
  }
});

test('DECO1016 keeps admission restrictions separate from assumed knowledge and degree requirements', () => {
  const course = byCode('DECO1016');
  assert.equal(course.name, 'Introduction to Web Design');
  assert.equal(course.level, '1000');
  assert.deepEqual(course.category, ['design', 'elective']);
  assert.match(course.matters, /Bachelor of Design Computing.*DECO2102/);
  const notes = new Function(`${section('const prerequisiteNotes =', 'function prerequisiteNoteFor(')}; return prerequisiteNotes;`)();
  assert.deepEqual(notes.DECO1016.requires, ['无指定先修课程']);
  assert.deepEqual(notes.DECO1016.assumed, ['DECO1012']);
  assert.equal(notes.DECO1016.graph, false);
  assert.ok(notes.DECO1016.eligibility);
  for (const state of ['completed', 'locked', 'candidate']) {
    assert.deepEqual(calculate(statuses(['DECO1016'], state)).totals[state], {
      total: 6, major: 0, minor: 0, shared: 0, ole: 0, elective: 6
    });
  }
});

test('WRIT1000 is a current unrestricted writing elective with complete metadata', () => {
  const course = byCode('WRIT1000');
  assert.equal(course.name, 'Introduction to Academic Writing');
  assert.equal(course.availability, '2026 S1 / S2');
  assert.deepEqual(course.category, ['elective']);
  assert.match(course.matters, /不是英语语言习得课程/);
  const notes = new Function(`${section('const prerequisiteNotes =', 'function prerequisiteNoteFor(')}; return prerequisiteNotes;`)();
  assert.deepEqual(notes.WRIT1000.requires, ['无指定先修课程']);
  assert.equal(notes.WRIT1000.graph, false);
  assert.deepEqual(calculate(statuses(['WRIT1000'])).totals.completed, {
    total: 6, major: 0, minor: 0, shared: 0, ole: 0, elective: 6
  });
});

test('Statistics minor follows the 6 + 6 + 12 + 12 structure', () => {
  const minor = requirements[1];
  assert.equal(minor.id, 'stats');
  assert.equal(minor.target, 36);
  assert.deepEqual(minor.slots.map(slot => slot.target), [6, 6, 12, 12]);
  assert.deepEqual(minor.slots[0].codes, ['MATH1061']);
  assert.deepEqual(minor.slots[1].codes, ['MATH1062', 'DATA1001']);
  assert.deepEqual(minor.slots[2].codes, ['DATA2002', 'STAT2011']);
  assert.deepEqual(minor.slots[3].codes, ['STAT3021', 'STAT3022', 'STAT3023', 'STAT3888']);
});

test('CS and Statistics component credits remain separate', () => {
  for (const state of ['completed', 'locked', 'candidate']) {
    const cs = calculate(statuses(['INFO1110', 'INFO1113', 'COMP2123'], state));
    assert.deepEqual(cs.totals[state], { total: 18, major: 18, minor: 0, shared: 0, ole: 0, elective: 0 });
    const stats = calculate(statuses(statisticsCore, state));
    assert.deepEqual(stats.totals[state], { total: 24, major: 0, minor: 24, shared: 0, ole: 0, elective: 0 });
  }
});

test('3000-level Statistics selective is capped and prioritises completed over locked over candidate', () => {
  const entries = {
    ...statuses(statisticsCore),
    STAT3021: { status: 'completed' },
    STAT3022: { status: 'locked' },
    STAT3023: { status: 'candidate' },
    STAT3888: { status: 'candidate' }
  };
  const result = calculate(entries);
  assert.equal(result.totals.completed.minor, 30);
  assert.equal(result.totals.locked.minor, 6);
  assert.equal(result.totals.candidate.minor, 0);
  assert.equal(result.totals.candidate.elective, 12);

  entries.STAT3023.status = 'completed';
  const updated = calculate(entries);
  assert.equal(updated.totals.completed.minor, 36);
  assert.equal(updated.totals.locked.elective, 6);
  assert.ok(updated.groups[1].slots[3].extras.some(course => course.code === 'STAT3022'));
});

test('extra CS electives or projects cannot substitute missing core slots', () => {
  const result = calculate(statuses(['COMP3308', 'COMP3221', 'COMP3419', 'COMP3520', 'COMP3888 / COMP3988', 'SCPU3001']));
  assert.equal(result.totals.completed.major, 12);
  assert.equal(result.totals.completed.elective, 24);
  assert.equal(result.groups[0].slots[0].cp, 0);
});

test('software and unrelated maths plans remain other degree credits', () => {
  const codes = ['SOFT2201', 'SOFT2412', 'SOFT3202', 'INFO3315', 'MATH2069', 'MATH2070', 'MATH3076', 'QBUS3330'];
  const entries = statuses(codes, 'locked');
  const snapshot = JSON.stringify(entries);
  const result = calculate(entries);
  assert.equal(result.totals.locked.total, 48);
  assert.equal(result.totals.locked.elective, 48);
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
  assert.equal(all.reduce((sum, bucket) => sum + bucket.shared, 0), 0);
  all.forEach(bucket => assert.equal(bucket.total, bucket.major + bucket.minor - bucket.shared + bucket.ole + bucket.elective));
});

test('neutral and avoided courses contribute no credits', () => {
  const result = calculate({ INFO1110: { status: 'avoid' }, STAT3021: { status: 'neutral' } });
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

test('default semester suggestions contain only CS and Statistics required-path units', () => {
  const plan = html.slice(html.indexOf('<section id="plans"'), html.indexOf('<section id="courses"'));
  const stages = [...plan.matchAll(/data-stage-id="([^"]+)"[\s\S]*?<\/article>/g)];
  const allowed = new Set([
    'INFO1110', 'INFO1113', 'COMP2123', 'COMP2017', 'COMP2022', 'COMP3027', 'COMP3888 / COMP3988',
    'MATH1061', 'DATA1001', 'DATA2002', 'STAT2011', 'STAT3022', 'STAT3888'
  ]);
  stages.forEach(([markup]) => {
    const codes = [...markup.matchAll(/<strong>([^<]+)<\/strong>/g)].map(match => match[1]);
    codes.forEach(code => assert.ok(allowed.has(code), code));
  });
  assert.equal(stages.length, 6);
});

test('new prerequisite targets exist and stale program structure references are gone', () => {
  const chains = section('const bottleneckChains =', 'function updateBottleneckMap(');
  ['MATH2069', 'QBUS3330', 'DATA2002', 'STAT2011', 'STAT3021', 'STAT3022', 'STAT3023', 'STAT3888'].forEach(code => {
    assert.ok(chains.includes(`target: "${code}"`), code);
  });
  const withoutLegacyKey = html.replace('usyd-bsc-cs-dma-planner', 'legacy-storage');
  assert.doesNotMatch(withoutLegacyKey, /\bDMA\b|\bdma\b|Discrete Mathematics and Algorithms/);
  assert.doesNotMatch(html, /Minor · Software Development|SD minor|data-structure-tab="sd"/i);
  assert.match(html, /Minor · Statistics/);
  ['usyd-course-status-v1', 'usyd-theme-preference', 'usyd-current-stage-override'].forEach(key => assert.ok(html.includes(key)));
});
