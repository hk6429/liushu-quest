// 大師對戰（PvE）：薄包裝層——出題全部呼叫 LSQuiz.gen()，這裡只把答對/答錯換算成傷害
const LSBattle = (() => {
  const MAX_HP = 100;
  // 文字學大師名單：解鎖門檻＝跨日、客觀作答與理由證據形成的「有效精通字數」。
  // 攻擊力刻意非線性遞增
  const MASTERS = [
    { id: 'wangyirong', name: '王懿榮', avatar: '🦴', image: 'img/masters/wangyirong.webp', title: '甲骨文發現者', atk: 6, unlock: 0, level: null, focusCats: ['象形'], roundLimit: 10, taunt: '一片龍骨，讓我看見三千年前的文字。你呢？' },
    { id: 'lisi', name: '李斯', avatar: '📜', image: 'img/masters/lisi.webp', title: '小篆定於一尊', atk: 9, unlock: 8, level: null, focusCats: ['指事', '會意'], roundLimit: 10, taunt: '書同文字！六國異形，皆廢於我手。' },
    { id: 'guifu', name: '桂馥', avatar: '🏮', image: 'img/masters/guifu.webp', title: '說文四大家・義證', atk: 12, unlock: 18, level: null, focusCats: ['假借'], roundLimit: 10, taunt: '《說文義證》五十卷，字字有據。' },
    { id: 'wangjun', name: '王筠', avatar: '🖋️', image: 'img/masters/wangjun.webp', title: '說文四大家・句讀', atk: 14, unlock: 30, level: null, focusCats: ['會意'], roundLimit: 10, taunt: '我為初學者解說文，也考你這初學者。' },
    { id: 'zhujunsheng', name: '朱駿聲', avatar: '🔔', image: 'img/masters/zhujunsheng.webp', title: '說文四大家・通訓定聲', atk: 17, unlock: 45, level: '進階', focusCats: ['形聲'], roundLimit: 10, taunt: '轉注、假借，盡在我《通訓定聲》彀中。' },
    { id: 'duanyucai', name: '段玉裁', avatar: '📚', image: 'img/masters/duanyucai.webp', title: '說文四大家・段注', atk: 20, unlock: 65, level: '進階', focusCats: ['轉注', '假借'], roundLimit: 10, taunt: '《說文解字注》三十年而成，豈懼你半日之功？' },
    { id: 'xushen', name: '許慎', avatar: '⚖️', image: 'img/masters/xushen.webp', title: '五經無雙・說文解字', atk: 24, unlock: 90, level: '進階', focusCats: ['象形', '指事', '會意', '形聲', '轉注', '假借'], roundLimit: 10, taunt: '六書之名，自我而定。敢在關公面前耍大刀？' },
    { id: 'cangjie', name: '倉頡', avatar: '👁️', image: 'img/characters/cangjie.webp', title: '四目造字・天雨粟鬼夜哭', atk: 30, unlock: 120, level: '挑戰', focusCats: ['象形', '指事', '會意', '形聲', '轉注', '假借'], roundLimit: 10, taunt: '我造字時，天雨粟、鬼夜哭。你答錯時，也會想哭。' }
  ];

  let st = null;

  function sessionToken() {
    return `battle:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`;
  }

  function render(el) {
    const mastered = LSStore.masteredCount();
    const beaten = LSStore.raw.battle.beaten;
    const best = LSStore.raw.battle.best;
    el.innerHTML = `
<div class="card battle-shell">
  <div class="battle-lobby">
    <h2>大師對戰</h2>
    <p class="muted">與歷代文字學大師過招：答對造成傷害（連擊加成），答錯挨大師一擊。目前有效精通 <b>${mastered}</b> 字；須跨日客觀答對並通過理由題，才會列入解鎖。</p>
    <p class="muted"><b>創作說明：</b>人物插畫是 AI 輔助的教學想像圖，不是歷史肖像復原；對戰台詞是本站戲劇化創作，不是史料原句。</p>
    <div class="roster">${MASTERS.map(m => {
      const locked = mastered < m.unlock;
      return `<div class="card master-card ${locked ? 'locked' : ''}">
        <img class="master-portrait" src="${m.image}" alt="${m.name}人物插畫" width="800" height="800" loading="lazy">
        <div class="name">${m.name}</div>
        <div class="muted">${m.title}</div>
        <div class="muted">攻擊 ${m.atk}${m.level ? '・出題限' + m.level : ''}・主題 ${m.focusCats.join('／')}</div>
        ${beaten[m.id] ? `<div class="beaten">已擊敗 ×${beaten[m.id]}</div>` : ''}
        ${best[m.id] != null ? `<div class="muted">個人最佳 ${best[m.id]}／${m.roundLimit}</div>` : ''}
        ${locked ? `<div class="muted">🔒 有效精通 ${m.unlock} 字解鎖</div>` : `<button class="btn small" data-m="${m.id}">挑戰</button>`}
      </div>`;
    }).join('')}</div>
  </div>
  <div id="battleArea"></div>
</div>`;
    el.querySelectorAll('[data-m]').forEach(b => {
      b.onclick = () => start(el.querySelector('#battleArea'), MASTERS.find(m => m.id === b.dataset.m));
    });
  }

  function start(area, m) {
    const p = typeof LSProgress !== 'undefined' ? LSProgress : null;
    st = { m, myHp: MAX_HP, foeHp: MAX_HP, combo: 0, n: 0, right: 0, focusRight: 0,
      blueprint: p ? p.battleBlueprint(m) : Array.from({ length: m.roundLimit }, () => ({})),
      usedIds: new Set(), usedKeys: new Set(), missedIds: new Set(), completed: false, sessionId: sessionToken() };
    area.closest('.battle-shell').classList.add('is-fighting');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    area.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    turn(area, `${m.avatar}「${m.taunt}」<br>最多 ${m.roundLimit} 回合；先將大師氣力歸零，或回合結束時答對至少 7 題且主題題答對 3 題即可獲勝。`);
  }

  function dmgFor() {
    let d = 10 + st.combo * 3;
    if (st.myHp <= 30) d += 5; // 逆轉加成
    return d;
  }

  function bars() {
    return `
<div class="battle-arena" aria-label="阿滿對戰${st.m.name}">
  <div class="arena-heading">
    <span class="arena-ornament" aria-hidden="true"></span>
    <div><b>翰墨對決</b><small>第 ${st.n} 回合</small></div>
    <button class="arena-exit" id="bChoose" type="button">重選大師</button>
  </div>
  <div class="combatants">
    <section class="fighter fighter-player" aria-label="玩家阿滿">
      <div class="fighter-name"><span>六書學徒</span><b>阿滿</b></div>
      <div class="fighter-art"><img src="img/characters/aman.webp" alt="玩家角色阿滿" width="800" height="1000"></div>
      <div class="fighter-stats">
        <div class="fighter-statline"><span>氣力</span><b class="player-hp-text">${st.myHp}/${MAX_HP}</b></div>
        <div class="hp-bar" role="progressbar" aria-label="阿滿氣力" aria-valuemin="0" aria-valuemax="${MAX_HP}" aria-valuenow="${st.myHp}" aria-valuetext="阿滿氣力 ${st.myHp}／${MAX_HP}"><div class="hp-fill player-hp-fill" style="width:${st.myHp}%"></div></div>
        <div class="fighter-detail"><span>攻擊 ${dmgFor()}</span><span class="player-combo">連擊 ${st.combo}</span></div>
      </div>
    </section>
    <div class="versus-seal" aria-label="對戰">對</div>
    <section class="fighter fighter-enemy" aria-label="對手${st.m.name}">
      <div class="fighter-name"><span>${st.m.title}</span><b>${st.m.name}</b></div>
      <div class="fighter-art"><img src="${st.m.image}" alt="${st.m.name}人物插畫" width="800" height="800"></div>
      <div class="fighter-stats">
        <div class="fighter-statline"><span>氣力</span><b class="enemy-hp-text">${st.foeHp}/${MAX_HP}</b></div>
        <div class="hp-bar" role="progressbar" aria-label="${st.m.name}氣力" aria-valuemin="0" aria-valuemax="${MAX_HP}" aria-valuenow="${st.foeHp}" aria-valuetext="${st.m.name}氣力 ${st.foeHp}／${MAX_HP}"><div class="hp-fill enemy enemy-hp-fill" style="width:${st.foeHp}%"></div></div>
        <div class="fighter-detail"><span>攻擊 ${st.m.atk}</span><span>${st.m.level ? '題限 ' + st.m.level : '全卷出題'}</span></div>
      </div>
    </section>
  </div>
</div>
    <div class="battle-round-meta"><span>第 ${st.n}／${st.m.roundLimit} 題・答對 ${st.right}</span><span class="combo-tag">${st.combo > 1 ? '🔥 連擊 ×' + st.combo : '以字為招，以理破陣'}</span></div>`;
  }

  function updateBattleHud(area, ok) {
    const playerText = area.querySelector('.player-hp-text');
    const enemyText = area.querySelector('.enemy-hp-text');
    const playerBar = area.querySelector('.player-hp-fill');
    const enemyBar = area.querySelector('.enemy-hp-fill');
    const combo = area.querySelector('.player-combo');
    if (playerText) playerText.textContent = `${st.myHp}/${MAX_HP}`;
    if (enemyText) enemyText.textContent = `${st.foeHp}/${MAX_HP}`;
    if (playerBar) {
      playerBar.style.width = `${st.myHp}%`;
      playerBar.parentElement.setAttribute('aria-valuenow', st.myHp);
      playerBar.parentElement.setAttribute('aria-valuetext', `阿滿氣力 ${st.myHp}／${MAX_HP}`);
    }
    if (enemyBar) {
      enemyBar.style.width = `${st.foeHp}%`;
      enemyBar.parentElement.setAttribute('aria-valuenow', st.foeHp);
      enemyBar.parentElement.setAttribute('aria-valuetext', `${st.m.name}氣力 ${st.foeHp}／${MAX_HP}`);
    }
    if (combo) combo.textContent = `連擊 ${st.combo}`;
    const target = area.querySelector(ok ? '.fighter-enemy' : '.fighter-player');
    if (target) target.classList.add(ok ? 'is-hit' : 'is-shaken');
  }

  function turn(area, banner) {
    if (st.foeHp <= 0 || st.myHp <= 0 || st.n >= st.m.roundLimit) return finish(area);
    const slot = st.blueprint[st.n] || {};
    const q = LSQuiz.gen({ level: st.m.level, cat: slot.cat, type: slot.type, excludeIds: st.usedIds, excludeKeys: st.usedKeys });
    st.currentSlot = slot;
    st.n++;
    if (q.charId) st.usedIds.add(q.charId);
    st.usedKeys.add(q.key);
    area.innerHTML = `${bars()}${banner ? `<div class="feedback" role="status" aria-live="polite">${banner}</div>` : ''}
<div class="battle-question">
  <div class="q-stem">${q.stemHtml}</div>
  <div class="opt-list">${q.options.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}</div>
  <div id="bFb" role="status" aria-live="polite"></div>
</div>`;
    area.querySelector('#bChoose').onclick = () => render(area.closest('.view'));
    area.querySelectorAll('.opt').forEach(btn => {
      btn.onclick = () => {
        const ok = +btn.dataset.i === q.answer;
        area.querySelectorAll('.opt').forEach(b => { b.disabled = true; });
        area.querySelector(`[data-i="${q.answer}"]`).classList.add('correct');
        if (!ok) btn.classList.add('wrong');
        const p = typeof LSProgress !== 'undefined' ? LSProgress : null;
        const before = q.charId && p ? p.masteryStage(LSStore.raw.cards[q.charId]) : null;
        LSStore.recordAnswer(q.charId, q.cat, ok, 'battle', `${st.sessionId}:${q.key}`, {
          axis: q.axis, rationale: !!q.rationale, transfer: !!q.transfer, misconception: q.misconception
        });
        const after = q.charId && p ? p.masteryStage(LSStore.raw.cards[q.charId]) : null;
        let msg;
        if (ok) {
          st.right++;
          if (st.currentSlot.focus) st.focusRight++;
          st.combo++;
          const d = dmgFor();
          st.foeHp = Math.max(0, st.foeHp - d);
          msg = `⚔️ 答對！對 ${st.m.name} 造成 <b>${d}</b> 點傷害${st.combo > 1 ? `（連擊 ×${st.combo}）` : ''}。`;
        } else {
          if (q.charId) st.missedIds.add(q.charId);
          st.combo = 0;
          st.myHp = Math.max(0, st.myHp - st.m.atk);
          msg = `💥 答錯！${st.m.name} 反擊，你受到 <b>${st.m.atk}</b> 點傷害。`;
        }
        updateBattleHud(area, ok);
        const growth = before && after ? `<br>${before.id === after.id ? after.label : `${before.label} → ${after.label}`}：${after.next}` : '';
        const ending = st.foeHp <= 0 || st.myHp <= 0 || st.n >= st.m.roundLimit;
        area.querySelector('#bFb').innerHTML = `<div class="feedback">${msg}<br>${q.explain}${growth}</div>
        <div class="btnrow"><button class="btn" id="bNext">${ending ? '看結果' : '下一題'}</button></div>`;
        area.querySelector('#bNext').onclick = () => turn(area, '');
        area.querySelector('#bNext').focus();
      };
    });
  }

  function finish(area) {
    const win = st.myHp > 0 && (st.foeHp <= 0 || (st.n >= st.m.roundLimit && st.right >= 7 && st.focusRight >= 3));
    const previousBest = Number(LSStore.raw.battle.best[st.m.id] || 0);
    const result = st.completed ? { earned: [], best: previousBest } : LSStore.recordBattleResult(st.m.id, {
      win, score: st.right, total: st.n, eventId: `${st.sessionId}:complete`
    });
    const earned = result.earned;
    const improved = result.recorded && st.right > previousBest;
    const p = typeof LSProgress !== 'undefined' ? LSProgress : null;
    const recovery = p?.recoveryIds([...st.missedIds], LSStore.weakIds(LSData.all.map(c => c.id)), 5) || [...st.missedIds].slice(0, 5);
    st.completed = true;
    area.innerHTML = `<div class="battle-result ${win ? 'is-win' : 'is-loss'}" role="status" aria-live="polite">
      <div style="font-size:3rem">${win ? '🏆' : '💀'}</div>
      <p><b>${win ? `你擊敗了 ${st.m.name}！` : `不敵 ${st.m.name}……`}</b></p>
      <p>本戰 ${st.right}／${st.n}，主題題答對 ${st.focusRight} 題；個人最佳 ${result.best}／${st.m.roundLimit}${improved ? '（刷新）' : ''}。</p>
      <p class="muted">${win ? '大師頷首：「後生可畏。」' : `${st.m.avatar}「${st.m.name === '倉頡' ? '再修煉五百年吧。' : '回去把弱點字練熟，再來討教。'}」`}${earned.length ? `<br>🏮 新印記 ×${earned.length}` : ''}</p>
      <div class="btnrow" style="justify-content:center">
        <button class="btn" id="bAgain">再戰一場</button>
        ${recovery.length ? '<button class="btn ghost" id="bReview">補強最多 5 個錯字</button>' : ''}
        <button class="btn ghost" id="bChooseAgain">重選大師</button>
        <button class="btn ghost" onclick="LSApp.go('stats')">看弱點</button>
      </div></div>`;
    const m = st.m;
    area.querySelector('#bAgain').onclick = () => start(area, m);
    area.querySelector('#bReview')?.addEventListener('click', () => {
      LSFlash.focus(recovery);
      LSApp.go('flash');
    });
    area.querySelector('#bChooseAgain').onclick = () => render(area.closest('.view'));
    // 重新渲染名單以更新解鎖/勝場（重繪整個 view）
    setTimeout(() => { }, 0);
  }

  return { render, MASTERS };
})();
