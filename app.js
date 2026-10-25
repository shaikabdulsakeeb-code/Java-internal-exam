/* Java Study Desk — turns the supplied exported material into a calm study interface. */
const MODULES = [
  { id: 'foundations', title: 'Java Foundations', source: null, description: 'Build confidence with console input, primitive values, formatted output, and simple arithmetic. These are the essentials behind almost every Java lab program.', concepts: ['Scanner', 'nextLine()', 'int / double', 'printf()', 'operators'] },
  { id: 'control', title: 'Control Statements', source: 'Control Statements:-', description: 'Control statements choose which instruction runs and how many times it repeats. Practice conditions, loops, and clear step-by-step logic.', concepts: ['if / else', 'switch', 'for loop', 'while loop', 'break'] },
  { id: 'classes', title: 'Classes & Objects', source: 'Classes objects constructors and methods:-', description: 'Classes group data and behaviour. Learn to create objects, initialise them with constructors, and call methods to solve a task cleanly.', concepts: ['class', 'object', 'constructor', 'this', 'methods'] },
  { id: 'strings', title: 'String Handling', source: 'String Handling:-', description: 'Strings represent text. These programs practise reading text safely, comparing it, inspecting characters, and transforming a sequence of characters.', concepts: ['String', 'length()', 'charAt()', 'equals()', 'StringBuilder'] },
  { id: 'arrays', title: 'Arrays', source: 'Arrays:-', description: 'An array stores several values of one type under one name. Focus on indexing, loops, searching, and calculating results from a collection.', concepts: ['array', 'index', 'length', 'traversal', 'nested loops'] },
  { id: 'inheritance', title: 'Inheritance', source: 'Inheritance:-', description: 'Inheritance lets a child class reuse and extend a parent class. Review how related classes share fields and methods using extends and super.', concepts: ['extends', 'super', 'parent class', 'child class', 'override'] },
  { id: 'interface', title: 'Interfaces', source: 'InterFace:-', description: 'An interface defines a promise: a class that implements it supplies the required behaviour. It helps separate what an object does from how it does it.', concepts: ['interface', 'implements', 'abstract method', 'polymorphism'] },
  { id: 'packages', title: 'Packages & Utilities', source: 'Packages:-', description: 'Packages organise Java code and give access to useful library classes. These questions use Scanner, StringBuilder, wrapper classes, and date utilities.', concepts: ['import', 'Scanner', 'StringBuilder', 'Float', 'Date'] },
  { id: 'exceptions', title: 'Exception Handling', source: 'Exception Handling:-', description: 'Exception handling lets a program respond safely when an operation fails. Learn the purpose of try, catch, throw, and finally.', concepts: ['try', 'catch', 'throw', 'finally', 'Exception'] }
];

const source = window.JAVA_STUDY_SOURCE || '';
const esc = value => String(value || '').replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
const normalise = value => value.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
const cleanBlock = value => normalise(value.replace(/^\s*(Single File Programming Question|Problem [Ss]tatement)\s*/m, ''));

function splitModules(raw) {
  const starts = MODULES.slice(1).map(m => ({ ...m, at: raw.indexOf(m.source) }));
  const firstEnd = starts[0].at;
  const groups = [{ ...MODULES[0], text: raw.slice(0, firstEnd) }];
  starts.forEach((module, index) => groups.push({ ...module, text: raw.slice(module.at + module.source.length, starts[index + 1]?.at ?? raw.length) }));
  return groups;
}

function titleFor(body, number) {
  const statement = body.match(/Problem [Ss]tatement\s*\n+([\s\S]*?)(?=\n\s*Input format\s*:|$)/)?.[1] || '';
  const first = normalise(statement).split('\n').find(line => line.length > 18) || '';
  const compact = first.replace(/^(Write|Create|Develop|Help|Given|A)\s+/i, '').replace(/[.].*$/, '').trim();
  return compact.length > 65 ? compact.slice(0, 62).trimEnd() + '…' : compact || `Practice program ${number}`;
}

function getSection(body, heading, stops) {
  const stop = stops.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const match = body.match(new RegExp('(?:^|\\n)\\s*' + heading + '\\s*:\\s*\\n?([\\s\\S]*?)(?=\\n\\s*(?:' + stop + ')\\s*:|$)', 'i'));
  return match ? normalise(match[1]) : '';
}

function extractQuestions(text) {
  const beforeCode = text.split(/\/\/ You are using Java/)[0];
  const matches = [...beforeCode.matchAll(/Question No:\s*(\d+)([\s\S]*?)(?=Question No:\s*\d+|$)/g)];
  return matches.map((match, index) => {
    const body = cleanBlock(match[2].split(/Fill your code here/i)[0]);
    const problem = getSection(body, 'Problem [Ss]tatement', ['Input format', 'Output format', 'Code constraints', 'Sample test cases', 'Whitelist']) || body.split(/\n\s*Input format\s*:/i)[0];
    const input = getSection(body, 'Input format', ['Output format', 'Code constraints', 'Sample test cases', 'Whitelist']);
    const output = getSection(body, 'Output format', ['Code constraints', 'Sample test cases', 'Whitelist']);
    const constraints = getSection(body, 'Code constraints', ['Sample test cases', 'Whitelist']);
    const samples = [...body.matchAll(/Input\s*\d*\s*:\s*\n([\s\S]*?)\n\s*Output\s*\d*\s*:\s*\n([\s\S]*?)(?=\n\s*Input\s*\d*\s*:|$)/gi)].map(x => ({ input: normalise(x[1]), output: normalise(x[2]) }));
    return { number: Number(match[1]), title: titleFor(body, index + 1), problem: normalise(problem), input, output, constraints, samples };
  });
}

function extractCodes(text) {
  const first = text.indexOf('// You are using Java');
  if (first < 0) return [];
  const codeArea = text.slice(first);
  let snippets = codeArea.split(/(?=\/\/ You are using Java)/).filter(part => part.trim().startsWith('// You are using Java'));
  /* The source omits a label before one wrapper-class answer. Split its first
     export at the balanced closing brace of the neighbouring Main class. */
  if (snippets.length === 4) {
    for (let index = 0; index < snippets.length; index += 1) {
      const current = snippets[index];
      const mains = [...current.matchAll(/(?:public\s+)?class\s+Main\s*\{/g)];
      if (mains.length > 1) {
        let depth = 0;
        let end = mains[0].index + mains[0][0].length - 1;
        for (; end < current.length; end += 1) {
          if (current[end] === '{') depth += 1;
          if (current[end] === '}' && --depth === 0) { end += 1; break; }
        }
        snippets = [...snippets.slice(0, index), current.slice(0, end), current.slice(end), ...snippets.slice(index + 1)];
        break;
      }
    }
  }
  return snippets.map(code => normalise(code.replace(/^\s*\/\/ You are using Java\s*/, '')).replace(/\n+$/, '')).filter(Boolean);
}

function programmeExplanation(question) {
  const low = (question.problem + ' ' + question.title).toLowerCase();
  if (low.includes('array')) return 'Read the values into an array, then use a loop to visit each position. The program keeps track of the required result as it moves through the collection.';
  if (low.includes('string') || low.includes('word')) return 'The program reads the complete line of text, then applies the requested String or StringBuilder operation before printing the result in the required format.';
  if (low.includes('date')) return 'The input dates are converted from text into Date objects. Their values can then be compared or subtracted before the final answer is printed.';
  if (low.includes('class') || low.includes('object')) return 'The class models the information in the question. main creates or uses the object, and its methods keep the work organised and readable.';
  return 'Scanner reads each input value in the same order as the question. The program applies the required calculation or decision and prints the exact output labels expected by the evaluator.';
}

function buildData() {
  return splitModules(source).map(module => {
    const questions = extractQuestions(module.text);
    const codes = extractCodes(module.text);
    questions.forEach((question, index) => { question.code = codes[index] || '// The original solution was not available in the provided export.'; question.logic = programmeExplanation(question); });
    return { ...module, questions };
  });
}

const modules = buildData();
let activeModule = modules[0];
let searchTerm = '';
const doneKey = 'java-study-desk-completed';
let completed = new Set(JSON.parse(localStorage.getItem(doneKey) || '[]'));

function highlight(code) {
  return esc(code).replace(/(\/\/.*)/g, '<span class="cm">$1</span>').replace(/(&quot;[^&]*?&quot;)/g, '<span class="st">$1</span>').replace(/\b(public|private|protected|class|static|void|new|import|return|if|else|for|while|try|catch|finally|throw|throws|extends|implements|interface|double|int|long|float|boolean|char|String)\b/g, '<span class="kw">$1</span>');
}
function renderNav() {
  document.querySelector('#topicNav').innerHTML = modules.map((m, i) => `<button class="topic-button ${m.id === activeModule.id ? 'active' : ''}" data-module="${m.id}"><span class="topic-num">${String(i + 1).padStart(2,'0')}</span><span class="topic-name">${esc(m.title)}</span><small>${String(m.questions.length).padStart(2,'0')}</small></button>`).join('');
}
function renderProgress() {
  const all = modules.flatMap(m => m.questions.map(q => `${m.id}-${q.number}`));
  const count = all.filter(id => completed.has(id)).length;
  document.querySelector('#progressText').textContent = `${count} / ${all.length}`;
  document.querySelector('#progressBar').style.width = `${all.length ? count / all.length * 100 : 0}%`;
  document.querySelector('#questionCount').textContent = all.length;
}
function detail(heading, content) { return content ? `<div class="problem-section"><h4>${heading}</h4><p>${esc(content)}</p></div>` : ''; }
function card(module, q) {
  const id = `${module.id}-${q.number}`;
  const done = completed.has(id);
  const samples = q.samples.map((sample, index) => `<div class="sample-grid"><div class="sample"><label>SAMPLE INPUT ${q.samples.length > 1 ? index + 1 : ''}</label><pre>${esc(sample.input)}</pre></div><div class="sample"><label>SAMPLE OUTPUT ${q.samples.length > 1 ? index + 1 : ''}</label><pre>${esc(sample.output)}</pre></div></div>`).join('');
  return `<article class="program-card" id="${id}"><header class="card-header"><span class="question-number">${String(q.number).padStart(2,'0')}</span><div class="card-title"><p>QUESTION ${q.number} · JAVA 11</p><h3>${esc(q.title)}</h3></div><button class="done-button ${done ? 'done' : ''}" data-complete="${id}">${done ? 'Completed' : 'Mark done'}</button></header><div class="problem">${detail('Problem statement', q.problem)}${detail('Input format', q.input)}${detail('Output format', q.output)}${detail('Constraints', q.constraints)}${samples}</div><section class="solution"><div class="solution-head"><h4>Java solution</h4><span>READY TO RUN</span><button class="copy-button" data-copy="${id}">Copy code</button></div><div class="code-wrap"><pre><code>${highlight(q.code)}</code></pre></div><div class="logic"><strong>How it works:</strong> ${esc(q.logic)}</div></section></article>`;
}
function renderContent() {
  document.querySelector('#crumbTitle').textContent = activeModule.title;
  document.querySelector('#topicIntro').innerHTML = `<p class="section-kicker">MODULE ${String(modules.indexOf(activeModule) + 1).padStart(2,'0')} · ${activeModule.questions.length} PROGRAMS</p><h2>${esc(activeModule.title)}</h2><p>${esc(activeModule.description)}</p><div class="concepts">${activeModule.concepts.map(c => `<span class="concept">${esc(c)}</span>`).join('')}</div>`;
  const needle = searchTerm.toLowerCase().trim();
  const visible = activeModule.questions.filter(q => !needle || [q.title,q.problem,q.input,q.output,q.constraints,q.code].join(' ').toLowerCase().includes(needle));
  const area = document.querySelector('#questions');
  area.innerHTML = visible.length ? visible.map(q => card(activeModule, q)).join('') : document.querySelector('#emptyTemplate').innerHTML;
}
function selectModule(id, shouldScroll = true) {
  activeModule = modules.find(m => m.id === id) || modules[0]; searchTerm = ''; document.querySelector('#searchInput').value = ''; renderNav(); renderContent();
  document.querySelector('#sidebar').classList.remove('open'); document.querySelector('#menuButton').setAttribute('aria-expanded', 'false');
  if (shouldScroll) document.querySelector('#topicIntro').scrollIntoView({ behavior:'smooth', block:'start' });
}
document.querySelector('#topicNav').addEventListener('click', e => { const button = e.target.closest('[data-module]'); if (button) selectModule(button.dataset.module); });
document.querySelector('#menuButton').addEventListener('click', () => { const sidebar = document.querySelector('#sidebar'); const open = sidebar.classList.toggle('open'); document.querySelector('#menuButton').setAttribute('aria-expanded', open); });
document.querySelector('#searchInput').addEventListener('input', e => { searchTerm = e.target.value; renderContent(); });
document.querySelector('#questions').addEventListener('click', async e => {
  const complete = e.target.closest('[data-complete]'); const copy = e.target.closest('[data-copy]');
  if (complete) { const id = complete.dataset.complete; completed.has(id) ? completed.delete(id) : completed.add(id); localStorage.setItem(doneKey, JSON.stringify([...completed])); renderProgress(); renderContent(); }
  if (copy) { const q = activeModule.questions.find(x => `${activeModule.id}-${x.number}` === copy.dataset.copy); await navigator.clipboard.writeText(q.code); copy.textContent = 'Copied!'; setTimeout(() => copy.textContent = 'Copy code', 1300); }
});
document.querySelector('#randomButton').addEventListener('click', () => { const all = modules.flatMap(m => m.questions.map(q => ({m,q}))); const pick = all[Math.floor(Math.random() * all.length)]; selectModule(pick.m.id, false); requestAnimationFrame(() => document.querySelector(`#${pick.m.id}-${pick.q.number}`).scrollIntoView({behavior:'smooth', block:'center'})); });
renderNav(); renderProgress(); renderContent();
