(() => {
  const bank = Array.isArray(window.TERM_BANK) ? window.TERM_BANK : [];
  const $ = (id) => document.getElementById(id);

  const state = {
    round: [],
    matched: new Set(),
    selectedTerm: null,
    selectedDefinition: null,
    score: 0,
    combo: 0,
    stats: loadStats()
  };

  const els = {
    category: $('categorySelect'),
    pairCount: $('pairCount'),
    newRound: $('newRoundBtn'),
    resetStats: $('resetStatsBtn'),
    clearWrong: $('clearWrongBtn'),
    termList: $('termList'),
    definitionList: $('definitionList'),
    feedback: $('feedback'),
    score: $('score'),
    combo: $('combo'),
    bestScore: $('bestScore'),
    roundProgress: $('roundProgress'),
    totalAnswered: $('totalAnswered'),
    wrongCount: $('wrongCount'),
    wrongList: $('wrongList')
  };

  function loadStats() {
    try {
      const raw = JSON.parse(localStorage.getItem('ipasTermMatchStats') || '{}');
      return {
        bestScore: Number(raw.bestScore) || 0,
        totalAnswered: Number(raw.totalAnswered) || 0,
        wrongIds: Array.isArray(raw.wrongIds) ? raw.wrongIds : []
      };
    } catch {
      return { bestScore: 0, totalAnswered: 0, wrongIds: [] };
    }
  }

  function saveStats() {
    localStorage.setItem('ipasTermMatchStats', JSON.stringify(state.stats));
  }

  function shuffle(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function initCategories() {
    const categories = [...new Set(bank.map((item) => item.category))];
    els.category.innerHTML = '';
    const all = document.createElement('option');
    all.value = 'ALL';
    all.textContent = `全範圍混合（${bank.length} 個名詞）`;
    els.category.appendChild(all);

    categories.forEach((category) => {
      const count = bank.filter((item) => item.category === category).length;
      const option = document.createElement('option');
      option.value = category;
      option.textContent = `${category}（${count}）`;
      els.category.appendChild(option);
    });
  }

  function startRound() {
    const category = els.category.value;
    const pairCount = Math.max(4, Math.min(8, Number(els.pairCount.value) || 6));
    const pool = category === 'ALL' ? bank : bank.filter((item) => item.category === category);

    state.round = shuffle(pool).slice(0, Math.min(pairCount, pool.length));
    state.matched = new Set();
    state.selectedTerm = null;
    state.selectedDefinition = null;
    state.combo = 0;
    renderRound();
    setFeedback('準備配對', `本回合共有 ${state.round.length} 組。先選左邊名詞，再選右邊概念。`, '');
    updateHud();
  }

  function renderRound() {
    els.termList.innerHTML = '';
    els.definitionList.innerHTML = '';

    shuffle(state.round).forEach((item) => {
      const button = makeOption(item.term, item.id, 'term');
      els.termList.appendChild(button);
    });

    shuffle(state.round).forEach((item) => {
      const button = makeOption(item.definition, item.id, 'definition');
      els.definitionList.appendChild(button);
    });
  }

  function makeOption(text, id, type) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'match-option';
    button.dataset.id = id;
    button.dataset.type = type;
    button.textContent = text;
    if (state.matched.has(id)) button.classList.add('matched');
    button.addEventListener('click', () => chooseOption(button));
    return button;
  }

  function chooseOption(button) {
    const { id, type } = button.dataset;
    if (state.matched.has(id)) return;

    const selector = `.match-option[data-type="${type}"]`;
    document.querySelectorAll(selector).forEach((node) => node.classList.remove('selected'));
    button.classList.add('selected');

    if (type === 'term') state.selectedTerm = id;
    if (type === 'definition') state.selectedDefinition = id;

    if (state.selectedTerm && state.selectedDefinition) checkPair();
  }

  function checkPair() {
    const termId = state.selectedTerm;
    const definitionId = state.selectedDefinition;
    const chosenTerm = bank.find((item) => item.id === termId);
    const chosenDefinition = bank.find((item) => item.id === definitionId);

    state.stats.totalAnswered += 1;

    if (termId === definitionId) {
      state.combo += 1;
      const bonus = Math.min(state.combo - 1, 5) * 5;
      state.score += 20 + bonus;
      state.matched.add(termId);
      state.stats.wrongIds = state.stats.wrongIds.filter((id) => id !== termId);
      setFeedback(`✅ 配對成功！Combo × ${state.combo}`, `${chosenTerm.term}：${chosenTerm.note}`, 'good');
      markMatched(termId);
    } else {
      state.combo = 0;
      state.score = Math.max(0, state.score - 5);
      addWrong(termId);
      setFeedback('❌ 這兩個不是一組', `${chosenTerm.term} 的正確概念：${chosenTerm.definition} 提醒：${chosenTerm.note}`, 'bad');
      clearSelections();
    }

    if (state.score > state.stats.bestScore) state.stats.bestScore = state.score;
    saveStats();
    updateHud();
    renderWrongList();

    if (state.matched.size === state.round.length) {
      setTimeout(() => {
        setFeedback('🎉 本回合完成', `你完成 ${state.round.length} 組配對，本局目前 ${state.score} 分。可以直接開始下一回合。`, 'good');
      }, 180);
    }
  }

  function markMatched(id) {
    document.querySelectorAll(`.match-option[data-id="${id}"]`).forEach((button) => {
      button.classList.remove('selected');
      button.classList.add('matched');
    });
    state.selectedTerm = null;
    state.selectedDefinition = null;
  }

  function clearSelections() {
    document.querySelectorAll('.match-option.selected').forEach((button) => button.classList.remove('selected'));
    state.selectedTerm = null;
    state.selectedDefinition = null;
  }

  function addWrong(id) {
    if (!state.stats.wrongIds.includes(id)) state.stats.wrongIds.unshift(id);
    state.stats.wrongIds = state.stats.wrongIds.slice(0, 30);
  }

  function renderWrongList() {
    els.wrongList.innerHTML = '';
    const items = state.stats.wrongIds.map((id) => bank.find((item) => item.id === id)).filter(Boolean);

    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = '目前沒有待複習錯題。保持住 😎';
      els.wrongList.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'wrong-item';
      row.innerHTML = `<strong>${escapeHtml(item.term)}</strong><span>${escapeHtml(item.definition)}</span><small>${escapeHtml(item.category)}｜${escapeHtml(item.note)}</small>`;
      els.wrongList.appendChild(row);
    });
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function setFeedback(title, message, type) {
    els.feedback.className = `feedback card ${type}`.trim();
    els.feedback.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>`;
  }

  function updateHud() {
    els.score.textContent = state.score;
    els.combo.textContent = state.combo;
    els.bestScore.textContent = state.stats.bestScore;
    els.roundProgress.textContent = `${state.matched.size} / ${state.round.length}`;
    els.totalAnswered.textContent = state.stats.totalAnswered;
    els.wrongCount.textContent = state.stats.wrongIds.length;
  }

  function resetStats() {
    const ok = window.confirm('確定要重設最高分、累積答題與錯題紀錄嗎？');
    if (!ok) return;
    state.score = 0;
    state.combo = 0;
    state.stats = { bestScore: 0, totalAnswered: 0, wrongIds: [] };
    saveStats();
    updateHud();
    renderWrongList();
    setFeedback('紀錄已重設', '題庫不受影響，可以重新開始練習。', '');
  }

  function clearWrong() {
    state.stats.wrongIds = [];
    saveStats();
    updateHud();
    renderWrongList();
    setFeedback('錯題本已清除', '新的答錯題目仍會再次加入。', '');
  }

  els.newRound.addEventListener('click', startRound);
  els.resetStats.addEventListener('click', resetStats);
  els.clearWrong.addEventListener('click', clearWrong);

  initCategories();
  renderWrongList();
  updateHud();
  startRound();
})();
