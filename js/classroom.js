// 課堂共學：同一題先答、看同儕理由、再修正；只存匿名小組與彙整證據。
const LSClassroom = (() => {
  const EVIDENCE = ['輪廓描畫', '指示記號', '部件會義', '讀音線索', '借音用字', '近義互訓'];
  const PROMPTS = [
    { id: 'ben-xiu', title: '本與休：都有木，分類一樣嗎？', question: '「本」和「休」都看得到木，兩字的構形方式是否相同？', options: ['相同', '不同'], answer: '不同', reason: '本以短橫指出樹根，是指事；休由人、木會出休息之意，是會意。' },
    { id: 'mo-axis', title: '莫：一個字，兩條判斷軸', question: '題目問「莫」借作否定詞時，應答哪一類？', options: ['會意', '假借', '形聲'], answer: '假借', reason: '日落草叢是字形構成的會意；借作否定詞則是用字關係的假借。' },
    { id: 'kao-lao', title: '考與老：何時才是轉注？', question: '題目問「考、老」彼此訓釋的關係時，應答哪一類？', options: ['形聲', '象形', '轉注'], answer: '轉注', reason: '轉注說明兩個同類近義字互相訓釋，不是單看一個字的構形。' }
  ];
  let state = null;

  function render(el) {
    const wall = LSStore.raw.classroom.evidenceWall;
    el.innerHTML = `<section class="card classroom-intro"><p class="eyebrow">不比快、不排名、不記姓名</p><h2>課堂共學：一題、兩次作答、一個理由</h2><p>學生先獨立判斷，再聽同學說證據，最後允許修正。老師看到的是匿名分布與理由牆，不是誰輸誰贏。</p><p class="muted">所有資料只存在這台裝置；請用「第幾組」代稱，不輸入學生姓名。</p><div class="prompt-grid">${PROMPTS.map((prompt, index) => `<button type="button" class="prompt-card" data-prompt="${index}"><b>${prompt.title}</b><span>${prompt.question}</span></button>`).join('')}</div></section><section class="card"><h2>匿名證據牆</h2><div class="evidence-wall">${EVIDENCE.map(label => `<span><b>${wall[label] || 0}</b>${label}</span>`).join('')}</div><button class="btn small ghost" id="classClearWall">清空本機證據牆</button></section><div id="classroomArea" aria-live="polite"></div>`;
    el.querySelectorAll('[data-prompt]').forEach(button => { button.onclick = () => start(el.querySelector('#classroomArea'), Number(button.dataset.prompt)); });
    el.querySelector('#classClearWall').onclick = () => {
      if (!window.confirm('只清空本機匿名證據統計，確定嗎？')) return;
      LSStore.raw.classroom.evidenceWall = {};
      LSStore.persist();
      render(el);
    };
  }

  function start(area, promptIndex) {
    state = { prompt: PROMPTS[promptIndex], answers: [], group: 1, startedAt: Date.now() };
    collect(area);
  }

  function collect(area) {
    const p = state.prompt;
    area.innerHTML = `<section class="card classroom-flow"><p class="eyebrow">第 ${state.group} 組・先自己想</p><h2>${p.question}</h2><form id="classroomForm"><fieldset><legend>第一次答案</legend>${p.options.map(option => `<label><input required type="radio" name="initial" value="${option}"> ${option}</label>`).join('')}</fieldset><label>信心程度<select name="confidence"><option value="不確定">不確定</option><option value="有點把握">有點把握</option><option value="很有把握">很有把握</option></select></label><fieldset><legend>聽完同學理由後，哪項證據最關鍵？</legend>${EVIDENCE.map(label => `<label><input required type="radio" name="evidence" value="${label}"> ${label}</label>`).join('')}</fieldset><fieldset><legend>第二次答案（可以不改）</legend>${p.options.map(option => `<label><input required type="radio" name="revised" value="${option}"> ${option}</label>`).join('')}</fieldset><div class="btnrow"><button class="btn" type="submit">匿名送出本組</button><button class="btn ghost" type="button" id="classSummary">看全班彙整</button></div></form></section>`;
    area.querySelector('#classroomForm').onsubmit = event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const answer = { group: state.group, initial: data.get('initial'), revised: data.get('revised'), confidence: data.get('confidence'), evidence: data.get('evidence') };
      state.answers.push(answer);
      const wall = LSStore.raw.classroom.evidenceWall;
      wall[answer.evidence] = (wall[answer.evidence] || 0) + 1;
      LSStore.persist();
      state.group++;
      area.innerHTML = `<section class="card"><h2>第 ${answer.group} 組已匿名收下</h2><p>先答「${answer.initial}」，討論後答「${answer.revised}」；選用證據：${answer.evidence}。</p><div class="btnrow"><button class="btn" id="classNextGroup">下一組作答</button><button class="btn ghost" id="classShowSummary">看全班彙整</button></div></section>`;
      area.querySelector('#classNextGroup').onclick = () => collect(area);
      area.querySelector('#classShowSummary').onclick = () => summary(area);
    };
    area.querySelector('#classSummary').onclick = () => summary(area);
  }

  function counts(field) {
    return state.prompt.options.map(option => ({ option, count: state.answers.filter(answer => answer[field] === option).length }));
  }

  function summary(area) {
    if (!state.answers.length) {
      area.insertAdjacentHTML('beforeend', '<p class="feedback">目前還沒有匿名作答。</p>');
      return;
    }
    const p = state.prompt;
    const initial = counts('initial');
    const revised = counts('revised');
    const changed = state.answers.filter(answer => answer.initial !== answer.revised).length;
    const save = LSStore.raw;
    save.classroom.sessions.push({ promptId: p.id, groups: state.answers.length, changed, completedAt: new Date().toISOString() });
    save.classroom.sessions = save.classroom.sessions.slice(-20);
    LSStore.persist();
    area.innerHTML = `<section class="card classroom-summary"><p class="eyebrow">匿名全班彙整</p><h2>${p.title}</h2><div class="answer-shift"><div><h3>第一次答案</h3>${initial.map(item => `<p><b>${item.count}</b> 組選 ${item.option}</p>`).join('')}</div><div><h3>討論後答案</h3>${revised.map(item => `<p><b>${item.count}</b> 組選 ${item.option}</p>`).join('')}</div></div><p><b>${changed}</b> 組在聽完理由後修正答案。改變不是扣分，而是學習留下的證據。</p><div class="feedback"><b>可檢驗的理由：</b>${p.reason}</div><div class="btnrow"><button class="btn" id="classNewRound">換一題</button><button class="btn ghost" id="classRepeat">同題再開一班</button></div></section>`;
    area.querySelector('#classNewRound').onclick = () => LSApp.go('classroom');
    area.querySelector('#classRepeat').onclick = () => start(area, PROMPTS.indexOf(p));
  }

  return { EVIDENCE, PROMPTS, render };
})();
