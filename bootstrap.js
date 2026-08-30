(() => {
  const bank = Array.isArray(window.TERM_BANK) ? window.TERM_BANK : [];
  window.TERM_ZH = window.TERM_ZH || {};

  // 若題庫名詞沒有正式中譯，改用核心定義作為中文提示，避免出現「待補」。
  bank.forEach((item) => {
    const current = window.TERM_ZH[item.term];
    if (typeof current !== 'string' || !current.trim()) {
      window.TERM_ZH[item.term] = item.definition;
    }
  });

  // 明確的本局歸零：重新載入遊戲狀態，但保留 localStorage 中的最高分、累積作答與錯題紀錄。
  const resetBtn = document.getElementById('resetScoreBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
})();