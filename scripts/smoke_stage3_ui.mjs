import vm from 'node:vm';

const baseUrl = String(process.env.MANJINGO_BASE_URL || 'https://manyingo.pages.dev').replace(/\/$/, '');

function check(value, message) {
  if (!value) throw new Error(message);
}

async function readTextAsset(pathname, label) {
  const response = await fetch(`${baseUrl}${pathname}`, { headers: { accept: 'text/javascript,text/html,*/*;q=0.8' } });
  if (!response.ok) throw new Error(`${label} unavailable (${response.status})`);
  const text = await response.text();
  check(text.length > 100, `${label} returned an unexpectedly small payload`);
  return text;
}

console.log(`Smoke testing Stage 3 UI at ${baseUrl}`);

const [homepageSource, homeShellSource, stage3Source, packSource] = await Promise.all([
  readTextAsset('/', 'homepage'),
  readTextAsset('/home-shell.js', 'home shell asset'),
  readTextAsset('/stage3-reading.js', 'Stage 3 reading asset'),
  readTextAsset('/question-pack-transfer-07.js', 'Stage 3 question pack')
]);

check(homepageSource.includes('./home-shell.js'), 'deployed homepage does not load the home shell');
check(homeShellSource.includes("script.src='./stage3-reading.js'"), 'deployed home shell does not load the Stage 3 reading runtime');
check(homeShellSource.includes('loadStage3Reading();'), 'deployed home shell does not install the Stage 3 reading runtime');

const context = { console, window: {}, Array, Object, Number, String, Math, Set, Map };
vm.createContext(context);
vm.runInContext(stage3Source, context, { filename: 'production/stage3-reading.js' });
vm.runInContext(packSource, context, { filename: 'production/question-pack-transfer-07.js' });
const stage3 = context.ManjingoStage3Reading;
const pack = context.window.ManjingoQuestionPackTransfer07;
check(stage3 && typeof stage3.buildChallenge === 'function', 'deployed Stage 3 runtime is missing buildChallenge()');
check(typeof stage3.summarizeResults === 'function', 'deployed Stage 3 runtime is missing summarizeResults()');
check(typeof stage3.isStage3Question === 'function', 'deployed Stage 3 runtime is missing Stage 3 filtering');
check(pack && Array.isArray(pack.questions), 'deployed Stage 3 question pack is missing');
check(pack.questions.length === 36, `deployed Stage 3 pack contains ${pack.questions.length} questions instead of 36`);

const skillIds = ['read.argumentation', 'transfer.short-passage', 'transfer.mixed'];
for (const skillId of skillIds) {
  const questions = pack.questions.filter(question => Array.isArray(question.skillIds) && question.skillIds.includes(skillId));
  check(questions.length === 12, `${skillId} contains ${questions.length} questions instead of 12`);
  check(new Set(questions.map(question => question.sourceTextId)).size >= 5, `${skillId} does not span at least five source texts`);
}

let cursors = {};
const seen = new Set();
for (let run = 0; run < 6; run += 1) {
  const built = stage3.buildChallenge(pack.questions, cursors, 2);
  check(built.questions.length === 6, `deployed Stage 3 runtime produced ${built.questions.length} questions instead of 6`);
  const counts = Object.fromEntries(skillIds.map(id => [id, 0]));
  for (const question of built.questions) {
    const skillId = question.skillIds.find(id => skillIds.includes(id));
    counts[skillId] += 1;
    seen.add(question.id);
  }
  check(skillIds.every(id => counts[id] === 2), `deployed Stage 3 runtime is not balanced across advanced skills: ${JSON.stringify(counts)}`);
  cursors = built.nextCursors;
}
check(seen.size === 36, `six deployed Stage 3 rotations covered ${seen.size} questions instead of 36`);

const summary = stage3.summarizeResults([
  { skillId: 'read.argumentation', correct: true },
  { skillId: 'read.argumentation', correct: false },
  { skillId: 'transfer.short-passage', correct: true },
  { skillId: 'transfer.short-passage', correct: true },
  { skillId: 'transfer.mixed', correct: false },
  { skillId: 'transfer.mixed', correct: true }
]);
check(summary.total === 6 && summary.correct === 4 && summary.rows.length === 3, 'deployed Stage 3 result summary is invalid');

console.log('✓ deployed Stage 3 loader, 36-question passage bank, six-round rotation, and three-skill summary are healthy');
