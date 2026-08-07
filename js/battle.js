// 大師對戰（PvE）：薄包裝層——出題全部呼叫 LSQuiz.gen()，這裡只把答對/答錯換算成傷害
const LSBattle = (() => {
  const MAX_HP = 100;
  // 文字學大師名單：解鎖門檻＝「精通字數」（盒序≥4 且答對≥2 的字），掛真實學習量
  // 攻擊力刻意非線性遞增
  const MASTERS = [
    { id: 'wangyirong', name: '王懿榮', avatar: '🦴', image: 'img/masters/wangyirong.webp', title: '甲骨文發現者', atk: 6, unlock: 0, level: null, taunt: '一片龍骨，讓我看見三千年前的文字。你呢？' },
    { id: 'lisi', name: '李斯', avatar: '📜', image: 'img/masters/lisi.webp', title: '小篆定於一尊', atk: 9, unlock: 8, level: null, taunt: '書同文字！六國異形，皆廢於我手。' },
    { id: 'guifu', name: '桂馥', avatar: '🏮', image: 'img/masters/guifu.webp', title: '說文四大家・義證', atk: 12, unlock: 18, level: null, taunt: '《說文義證》五十卷，字字有據。' },
    { id: 'wangjun', name: '王筠', avatar: '🖋️', image: 'img/masters/wangjun.webp', title: '說文四大家・句讀', atk: 14, unlock: 30, level: null, taunt: '我為初學者解說文，也考你這初學者。' },
    { id: 'zhujunsheng', name: '朱駿聲', avatar: '🔔', image: 'img/masters/zhujunsheng.webp', title: '說文四大家・通訓定聲', atk: 17, unlock: 45, level: '進階', taunt: '轉注、假借，盡在我《通訓定聲》彀中。' },
    { id: 'duanyucai', name: '段玉裁', avatar: '📚', image: 'img/masters/duanyucai.webp', title: '說文四大家・段注', atk: 20, unlock: 65, level: '進階', taunt: '《說文解字注》三十年而成，豈懼你半日之功？' },
    { id: 'xushen', name: '許慎', avatar: '⚖️', image: 'img/masters/xushen.webp', title: '五經無雙・說文解字', atk: 24, unlock: 90, level: '進階', taunt: '六書之名，自我而定。敢在關公面前耍大刀？' },
    { id: 'cangjie', name: '倉頡', avatar: '👁️', image: 'img/characters/cangjie.webp', title: '四目造字・天雨粟鬼夜哭', atk: 30, unlock: 120, level: '挑戰', taunt: '我造字時，天雨粟、鬼夜哭。你答錯時，也會想哭。' }
  ];

  let st = null;

  function render(el) {
    const mastered = LSStore.masteredCount();
    const beaten = LSStore.raw.battle.beaten;
    el.innerHTML = `
<div class="card">
  <h2>大師對戰</h2>
  <p class="muted">與歷代文字學大師過招：答對造成傷害（連擊加成），答錯挨大師一擊。目前精通 <b>${mastered}</b> 字（閃卡升到第 4 盒＋答對 2 次以上算精通），精通越多、解鎖越多大師。</p>
  <div class="roster">${MASTERS.map(m => {
      const locked = mastered < m.unlock;
      return `<div class="card master-card ${locked ? 'locked' : ''}">
        <img class="master-portrait" src="${m.image}" alt="${m.name}人物插畫" width="800" height="800" loading="lazy">
        <div class="name">${m.name}</div>
        <div class="muted">${m.title}</div>
        <div class="muted">攻擊 ${m.atk}${m.level ? '・出題限' + m.level : ''}</div>
        ${beaten[m.id] ? `<div class="beaten">已擊敗 ×${beaten[m.id]}</div>` : ''}
        ${locked ? `<div class="muted">🔒 精通 ${m.unlock} 字解鎖</div>` : `<button class="btn small" data-m="${m.id}">挑戰</button>`}
      </div>`;
    }).join('')}</div>
  <div id="battleArea"></div>
</div>`;
    el.querySelectorAll('[data-m]').forEach(b => {
      b.onclick = () => start(el.querySelector('#battleArea'), MASTERS.find(m => m.id === b.dataset.m));
    });
  }

  function start(area, m) {
    st = { m, myHp: MAX_HP, foeHp: MAX_HP, combo: 0, n: 0 };
    area.scrollIntoView({ behavior: 'smooth' });
    turn(area, `${m.avatar}「${m.taunt}」`);
  }

  function dmgFor() {
    let d = 10 + st.combo * 3;
    if (st.myHp <= 30) d += 5; // 逆轉加成
    return d;
  }

  function bars() {
    return `
<div class="battle-head">
  <div class="hp-wrap"><span class="muted">你　${st.myHp}/${MAX_HP}</span><div class="hp-bar"><div class="hp-fill" style="width:${st.myHp}%"></div></div></div>
  <img class="battle-avatar" src="${st.m.image}" alt="${st.m.name}人物插畫" width="72" height="72">
  <div class="hp-wrap"><span class="muted">${st.m.name}　${st.foeHp}/${MAX_HP}</span><div class="hp-bar"><div class="hp-fill enemy" style="width:${st.foeHp}%"></div></div></div>
</div>
<div class="q-meta"><span>第 ${st.n + 1} 題</span><span class="combo-tag">${st.combo > 1 ? '🔥 連擊 ×' + st.combo : ''}</span></div>`;
  }

  function turn(area, banner) {
    if (st.foeHp <= 0 || st.myHp <= 0) return finish(area);
    const q = LSQuiz.gen(st.m.level);
    st.n++;
    area.innerHTML = `${bars()}${banner ? `<div class="feedback">${banner}</div>` : ''}
<div class="q-stem">${q.stemHtml}</div>
<div class="opt-list">${q.options.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}</div>
<div id="bFb"></div>`;
    area.querySelectorAll('.opt').forEach(btn => {
      btn.onclick = () => {
        const ok = +btn.dataset.i === q.answer;
        area.querySelectorAll('.opt').forEach(b => { b.disabled = true; });
        area.querySelector(`[data-i="${q.answer}"]`).classList.add('correct');
        if (!ok) btn.classList.add('wrong');
        if (q.charId) LSStore.recordAnswer(q.charId, q.cat, ok);
        let msg;
        if (ok) {
          st.combo++;
          const d = dmgFor();
          st.foeHp = Math.max(0, st.foeHp - d);
          msg = `⚔️ 答對！對 ${st.m.name} 造成 <b>${d}</b> 點傷害${st.combo > 1 ? `（連擊 ×${st.combo}）` : ''}。`;
        } else {
          st.combo = 0;
          st.myHp = Math.max(0, st.myHp - st.m.atk);
          area.querySelector('.battle-head').classList.add('shake');
          msg = `💥 答錯！${st.m.name} 反擊，你受到 <b>${st.m.atk}</b> 點傷害。`;
        }
        area.querySelector('#bFb').innerHTML = `<div class="feedback">${msg}<br>${q.explain}</div>
        <div class="btnrow"><button class="btn" id="bNext">${st.foeHp <= 0 || st.myHp <= 0 ? '看結果' : '下一題'}</button></div>`;
        area.querySelector('#bNext').onclick = () => turn(area, '');
      };
    });
  }

  function finish(area) {
    const win = st.foeHp <= 0;
    if (win) LSStore.recordBattleWin(st.m.id);
    area.innerHTML = `<div class="feedback" style="text-align:center">
      <div style="font-size:3rem">${win ? '🏆' : '💀'}</div>
      <p><b>${win ? `你擊敗了 ${st.m.name}！` : `不敵 ${st.m.name}……`}</b></p>
      <p class="muted">${win ? '大師頷首：「後生可畏。」' : `${st.m.avatar}「${st.m.name === '倉頡' ? '再修煉五百年吧。' : '回去把弱點字練熟，再來討教。'}」`}</p>
      <div class="btnrow" style="justify-content:center">
        <button class="btn" id="bAgain">再戰一場</button>
        <button class="btn ghost" onclick="LSApp.go('stats')">看弱點</button>
      </div></div>`;
    const m = st.m;
    area.querySelector('#bAgain').onclick = () => start(area, m);
    // 重新渲染名單以更新解鎖/勝場（重繪整個 view）
    setTimeout(() => { }, 0);
  }

  return { render, MASTERS };
})();
