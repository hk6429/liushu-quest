// 課堂共學：答案先鎖定，接著看理由、討論，最後才可提交修正版；只保存匿名彙整。
const LSClassroom = (() => {
  const EVIDENCE = ['輪廓描畫', '指示記號', '部件會義', '讀音線索', '借音用字', '近義互訓'];
  const CONFIDENCE = ['不確定', '有點把握', '很有把握'];
  const PROMPTS = [
    { id: 'ben-xiu', title: '本與休：都有木，分類一樣嗎？', question: '「本」和「休」都看得到木，兩字的構形方式是否相同？', options: ['相同', '不同'], answer: '不同', reason: '本以短橫指出樹根，是指事；休由人、木會出休息之意，是會意。' },
    { id: 'mo-axis', title: '莫：一個字，兩條判斷軸', question: '題目問「莫」借作否定詞時，應答哪一類？', options: ['會意', '假借', '形聲'], answer: '假借', reason: '日落草叢是字形構成的會意；借作否定詞則是用字關係的假借。' },
    { id: 'kao-lao', title: '考與老：何時才是轉注？', question: '題目問「考、老」彼此訓釋的關係時，應答哪一類？', options: ['形聲', '象形', '轉注'], answer: '轉注', reason: '轉注說明兩個同類近義字互相訓釋，不是單看一個字的構形。' }
  ];
  let state = null;

  const zeroCounts = labels => Object.fromEntries(labels.map(label => [label, 0]));
  const fresh = prompt => ({
    promptId: prompt.id, groups: 0, changed: 0, confidenceUp: 0,
    initialCounts: zeroCounts(prompt.options), revisedCounts: zeroCounts(prompt.options),
    evidenceCounts: zeroCounts(EVIDENCE), initialConfidence: zeroCounts(CONFIDENCE), revisedConfidence: zeroCounts(CONFIDENCE),
    startedAt: new Date().toISOString()
  });

  function promptOf(id) { return PROMPTS.find(prompt => prompt.id === id); }

  function persistActive() {
    LSStore.raw.classroom.active = state ? structuredClone(state.aggregate) : null;
    LSStore.persist();
  }

  function render(el) {
    const classroom = LSStore.raw.classroom;
    const wall = classroom.evidenceWall;
    const activePrompt = promptOf(classroom.active?.promptId);
    el.innerHTML = `<section class="card classroom-intro"><p class="eyebrow">不比快、不排名、不記姓名</p><h2>課堂共學：先答鎖定，再看理由，再修正</h2><p>學生先獨立判斷並鎖定答案，接著看理由、討論，最後才出現第二次作答。老師看到的是匿名分布、信心變化與證據牆。</p><p class="muted">所有學習彙整只存在這台裝置；不輸入姓名，也不保存個別組別的答案軌跡。</p>${activePrompt ? `<button type="button" class="btn" id="classResume">繼續「${activePrompt.title}」（已收 ${classroom.active.groups} 組）</button>` : ''}<div class="prompt-grid">${PROMPTS.map((prompt, index) => `<button type="button" class="prompt-card" data-prompt="${index}"><b>${prompt.title}</b><span>${prompt.question}</span></button>`).join('')}</div></section><section class="card"><h2>匿名證據牆</h2><div class="evidence-wall">${EVIDENCE.map(label => `<span><b>${wall[label] || 0}</b>${label}</span>`).join('')}</div><button class="btn small ghost" id="classClearWall">清空本機證據牆</button></section><div id="classroomArea" aria-live="polite"></div>`;
    const area = el.querySelector('#classroomArea');
    el.querySelectorAll('[data-prompt]').forEach(button => { button.onclick = () => start(area, Number(button.dataset.prompt)); });
    el.querySelector('#classResume')?.addEventListener('click', () => resume(area));
    el.querySelector('#classClearWall').onclick = () => {
      if (!window.confirm('只清空本機匿名證據統計，確定嗎？')) return;
      LSStore.raw.classroom.evidenceWall = {};
      LSStore.persist(); render(el);
    };
  }

  function start(area, promptIndex) {
    const prompt = PROMPTS[promptIndex];
    state = { prompt, aggregate: fresh(prompt), current: null };
    persistActive();
    collectInitial(area);
  }

  function resume(area) {
    const aggregate = LSStore.raw.classroom.active;
    const prompt = promptOf(aggregate?.promptId);
    if (!prompt) return;
    state = { prompt, aggregate: structuredClone(aggregate), current: null };
    collectInitial(area);
  }

  function collectInitial(area) {
    const p = state.prompt;
    const group = state.aggregate.groups + 1;
    area.innerHTML = `<section class="card classroom-flow" data-phase="initial"><p class="eyebrow">第 ${group} 組・階段 1/3</p><h2>${p.question}</h2><form id="classInitialForm"><fieldset><legend>第一次答案（送出後鎖定）</legend>${p.options.map(option => `<label><input required type="radio" name="initial" value="${option}"> ${option}</label>`).join('')}</fieldset><label>第一次信心<select name="confidence" required>${CONFIDENCE.map(value => `<option value="${value}">${value}</option>`).join('')}</select></label><div class="btnrow"><button class="btn" type="submit">鎖定第一次答案</button>${state.aggregate.groups ? '<button class="btn ghost" type="button" id="classSummary">看目前彙整</button>' : ''}</div></form></section>`;
    area.querySelector('#classInitialForm').onsubmit = event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      state.current = { initial: data.get('initial'), initialConfidence: data.get('confidence') };
      discuss(area);
    };
    area.querySelector('#classSummary')?.addEventListener('click', () => summary(area));
  }

  function discuss(area) {
    const p = state.prompt;
    area.innerHTML = `<section class="card classroom-flow" data-phase="discuss"><p class="eyebrow">階段 2/3・答案已鎖定</p><h2>先比較理由，不急著改答案</h2><p>第一次答案已鎖定為「<b>${state.current.initial}</b>」。現在請小組說明自己的證據，再閱讀可檢驗的理由。</p><div class="feedback"><b>可檢驗的理由：</b>${p.reason}</div><div class="btnrow"><button class="btn" id="classRevise">討論完成，進入第二次作答</button></div></section>`;
    area.querySelector('#classRevise').onclick = () => collectRevision(area);
  }

  function collectRevision(area) {
    const p = state.prompt;
    area.innerHTML = `<section class="card classroom-flow" data-phase="revise"><p class="eyebrow">階段 3/3・討論後再答</p><h2>${p.question}</h2><form id="classRevisionForm"><fieldset><legend>哪項證據最關鍵？</legend>${EVIDENCE.map(label => `<label><input required type="radio" name="evidence" value="${label}"> ${label}</label>`).join('')}</fieldset><fieldset><legend>第二次答案（可以不改）</legend>${p.options.map(option => `<label><input required type="radio" name="revised" value="${option}"> ${option}</label>`).join('')}</fieldset><label>第二次信心<select name="confidence" required>${CONFIDENCE.map(value => `<option value="${value}">${value}</option>`).join('')}</select></label><div class="btnrow"><button class="btn" type="submit">匿名送出修正版</button></div></form></section>`;
    area.querySelector('#classRevisionForm').onsubmit = event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      commitGroup(area, { ...state.current, revised: data.get('revised'), revisedConfidence: data.get('confidence'), evidence: data.get('evidence') });
    };
  }

  function commitGroup(area, answer) {
    const a = state.aggregate;
    a.groups++;
    a.initialCounts[answer.initial]++;
    a.revisedCounts[answer.revised]++;
    a.evidenceCounts[answer.evidence]++;
    a.initialConfidence[answer.initialConfidence]++;
    a.revisedConfidence[answer.revisedConfidence]++;
    if (answer.initial !== answer.revised) a.changed++;
    if (CONFIDENCE.indexOf(answer.revisedConfidence) > CONFIDENCE.indexOf(answer.initialConfidence)) a.confidenceUp++;
    const wall = LSStore.raw.classroom.evidenceWall;
    wall[answer.evidence] = (wall[answer.evidence] || 0) + 1;
    state.current = null;
    persistActive();
    area.innerHTML = `<section class="card"><h2>第 ${a.groups} 組已匿名彙整</h2><p>個別答案不會保存；目前只保留全班分布、信心變化與證據次數。</p><div class="btnrow"><button class="btn" id="classNextGroup">下一組作答</button><button class="btn ghost" id="classShowSummary">看全班彙整</button></div></section>`;
    area.querySelector('#classNextGroup').onclick = () => collectInitial(area);
    area.querySelector('#classShowSummary').onclick = () => summary(area);
  }

  function countRows(counts) {
    return Object.entries(counts).map(([label, count]) => `<p><b>${count}</b> 組選 ${label}</p>`).join('');
  }

  function summary(area) {
    const a = state?.aggregate;
    if (!a?.groups) { area.insertAdjacentHTML('beforeend', '<p class="feedback">目前還沒有匿名作答。</p>'); return; }
    const p = state.prompt;
    const save = LSStore.raw;
    const snapshot = { ...structuredClone(a), completedAt: new Date().toISOString() };
    save.classroom.sessions.push(snapshot);
    save.classroom.sessions = save.classroom.sessions.slice(-20);
    save.classroom.active = null;
    LSStore.persist();
    area.innerHTML = `<section class="card classroom-summary"><p class="eyebrow">匿名全班彙整</p><h2>${p.title}</h2><div class="answer-shift"><div><h3>第一次答案</h3>${countRows(a.initialCounts)}</div><div><h3>討論後答案</h3>${countRows(a.revisedCounts)}</div></div><p><b>${a.changed}</b> 組修正答案；<b>${a.confidenceUp}</b> 組的信心提高。改變不是扣分，而是學習留下的證據。</p><h3>採用的證據</h3><div class="evidence-wall">${EVIDENCE.map(label => `<span><b>${a.evidenceCounts[label]}</b>${label}</span>`).join('')}</div><div class="feedback"><b>可檢驗的理由：</b>${p.reason}</div><div class="btnrow"><button class="btn" id="classNewRound">換一題</button><button class="btn ghost" id="classRepeat">同題再開一班</button></div></section>`;
    area.querySelector('#classNewRound').onclick = () => LSApp.go('classroom');
    area.querySelector('#classRepeat').onclick = () => start(area, PROMPTS.indexOf(p));
    state = null;
  }

  return { EVIDENCE, CONFIDENCE, PROMPTS, render };
})();
