(() => {
  const bank = Array.isArray(window.TERM_BANK) ? window.TERM_BANK : [];
  const $ = (id) => document.getElementById(id);
  const els = {
    category: $('categorySelect'), score: $('score'), combo: $('combo'), best: $('bestScore'),
    total: $('totalAnswered'), wrong: $('wrongCount'), correct: $('correctCount'), feedback: $('feedback'),
    truckModeBtn: $('truckModeBtn'), memoryModeBtn: $('memoryModeBtn'), newRoundBtn: $('newRoundBtn'),
    truckGame: $('truckGame'), memoryGame: $('memoryGame'), road: $('road'), truck: $('truck'), truckTerm: $('truckTerm'),
    cargo: $('cargoOptions'), speed: $('speedLevel'), timerBar: $('timerBar'), memoryBoard: $('memoryBoard'), memoryProgress: $('memoryProgress')
  };
  const state = {
    mode: 'truck', score: 0, combo: 0, correct: 0, truckIndex: 0, truckQueue: [], truckTimer: null,
    truckStartedAt: 0, truckDuration: 6500, memoryPairs: [], memoryOpen: [], memoryMatched: new Set(), memoryLock: false,
    stats: loadStats()
  };

  function loadStats() {
    try {
      const raw = JSON.parse(localStorage.getItem('ipasPlayStats') || '{}');
      return { bestScore: Number(raw.bestScore) || 0, totalAnswered: Number(raw.totalAnswered) || 0, wrongIds: Array.isArray(raw.wrongIds) ? raw.wrongIds : [] };
    } catch { return { bestScore: 0, totalAnswered: 0, wrongIds: [] }; }
  }
  function saveStats(){ localStorage.setItem('ipasPlayStats', JSON.stringify(state.stats)); }
  function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
  function pool(){ const c=els.category.value; return c==='ALL'?bank:bank.filter(x=>x.category===c); }
  function esc(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
  function initCategories(){
    const cats=[...new Set(bank.map(x=>x.category))]; els.category.innerHTML='<option value="ALL">全範圍混合（'+bank.length+'）</option>';
    cats.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=`${c}（${bank.filter(x=>x.category===c).length}）`;els.category.appendChild(o);});
  }
  function updateHud(){
    els.score.textContent=state.score; els.combo.textContent=state.combo; els.best.textContent=state.stats.bestScore;
    els.total.textContent=state.stats.totalAnswered; els.wrong.textContent=state.stats.wrongIds.length; els.correct.textContent=state.correct;
  }
  function feedback(title,msg,type=''){ els.feedback.className=`feedback card ${type}`.trim(); els.feedback.innerHTML=`<strong>${esc(title)}</strong><p>${esc(msg)}</p>`; }
  function addWrong(id){ if(!state.stats.wrongIds.includes(id)) state.stats.wrongIds.unshift(id); state.stats.wrongIds=state.stats.wrongIds.slice(0,40); }
  function markCorrect(item,points){
    state.combo++; state.correct++; state.score+=points+Math.min(state.combo,8)*3; state.stats.wrongIds=state.stats.wrongIds.filter(id=>id!==item.id);
    if(state.score>state.stats.bestScore) state.stats.bestScore=state.score; saveStats(); updateHud();
  }
  function markWrong(item){ state.combo=0; state.score=Math.max(0,state.score-5); state.stats.totalAnswered++; addWrong(item.id); saveStats(); updateHud(); }

  function setMode(mode){
    stopTruck(); state.mode=mode; state.score=0; state.combo=0; state.correct=0;
    els.truckModeBtn.classList.toggle('active',mode==='truck'); els.memoryModeBtn.classList.toggle('active',mode==='memory');
    els.truckGame.classList.toggle('hidden',mode!=='truck'); els.memoryGame.classList.toggle('hidden',mode!=='memory');
    mode==='truck'?startTruckGame():startMemoryGame(); updateHud();
  }

  function startTruckGame(){
    stopTruck(); state.truckQueue=shuffle(pool()).slice(0,Math.min(20,pool().length)); state.truckIndex=0; state.truckDuration=6500; state.combo=0; state.correct=0;
    feedback('🚚 車隊出發！','看到車上的名詞，立刻點下方正確貨物。連續答對會加速。'); nextTruck();
  }
  function stopTruck(){ if(state.truckTimer){cancelAnimationFrame(state.truckTimer);state.truckTimer=null;} }
  function nextTruck(){
    stopTruck(); if(state.mode!=='truck')return;
    if(state.truckIndex>=state.truckQueue.length){feedback('🏁 車隊完成！',`本局答對 ${state.correct} 題，得分 ${state.score}。`,'good');return;}
    const item=state.truckQueue[state.truckIndex++]; state.currentTruck=item; els.truckTerm.textContent=item.term; els.truck.className='truck'; renderCargo(item);
    const level=Math.min(10,1+Math.floor(state.correct/3)); els.speed.textContent=level; state.truckDuration=Math.max(2400,6500-(level-1)*420);
    state.truckStartedAt=performance.now(); animateTruck();
  }
  function animateTruck(){
    const now=performance.now(), p=Math.min(1,(now-state.truckStartedAt)/state.truckDuration);
    const roadW=els.road.clientWidth, truckW=els.truck.offsetWidth||260, start=-truckW, end=roadW+30;
    els.truck.style.transform=`translateX(${start+(end-start)*p}px)`; els.timerBar.style.transform=`scaleX(${1-p})`;
    if(p>=1){ timeoutTruck(); return; }
    state.truckTimer=requestAnimationFrame(animateTruck);
  }
  function timeoutTruck(){
    stopTruck(); const item=state.currentTruck; markWrong(item); feedback('💨 車跑掉了！',`${item.term}：${item.definition}`,'bad'); els.truck.classList.add('wrong'); setTimeout(nextTruck,900);
  }
  function renderCargo(correct){
    const others=shuffle(pool().filter(x=>x.id!==correct.id)).slice(0,3); const opts=shuffle([correct,...others]); els.cargo.innerHTML='';
    opts.forEach(o=>{const b=document.createElement('button');b.type='button';b.className='cargo-btn';b.textContent=o.definition;b.addEventListener('click',()=>chooseCargo(b,o));els.cargo.appendChild(b);});
  }
  function chooseCargo(btn,choice){
    stopTruck(); const item=state.currentTruck; state.stats.totalAnswered++;
    els.cargo.querySelectorAll('button').forEach(b=>b.disabled=true);
    if(choice.id===item.id){ btn.classList.add('good'); els.truck.classList.add('correct'); markCorrect(item,30); feedback(`📦 裝貨成功！Combo × ${state.combo}`,item.note||item.definition,'good'); }
    else { btn.classList.add('bad'); addWrong(item.id); state.combo=0; state.score=Math.max(0,state.score-5); saveStats(); updateHud(); feedback('❌ 裝錯貨！',`${item.term} 應該載：${item.definition}`,'bad'); }
    saveStats(); updateHud(); setTimeout(nextTruck,750);
  }

  function startMemoryGame(){
    stopTruck(); state.memoryPairs=shuffle(pool()).slice(0,Math.min(6,pool().length)); state.memoryOpen=[]; state.memoryMatched=new Set(); state.memoryLock=false; state.combo=0; state.correct=0; renderMemory(); feedback('🃏 翻牌開始','找出 6 組「名詞＋定義」。配對成功的牌會消失。');
  }
  function renderMemory(){
    const cards=[]; state.memoryPairs.forEach(item=>{cards.push({key:item.id+'-t',id:item.id,text:item.term,type:'term'});cards.push({key:item.id+'-d',id:item.id,text:item.definition,type:'definition'});});
    els.memoryBoard.innerHTML=''; shuffle(cards).forEach(c=>{const b=document.createElement('button');b.type='button';b.className='memory-tile';b.dataset.key=c.key;b.innerHTML=`<span class="memory-inner"><span class="memory-face memory-back">?</span><span class="memory-face memory-front">${esc(c.text)}</span></span>`;b.addEventListener('click',()=>flipMemory(b,c));els.memoryBoard.appendChild(b);}); updateMemoryProgress();
  }
  function flipMemory(btn,card){
    if(state.memoryLock||btn.classList.contains('flipped')||btn.classList.contains('matched'))return;
    btn.classList.add('flipped'); state.memoryOpen.push({btn,card}); if(state.memoryOpen.length<2)return;
    const [a,b]=state.memoryOpen; if(a.card.id===b.card.id&&a.card.type!==b.card.type){
      state.stats.totalAnswered++; markCorrect(bank.find(x=>x.id===a.card.id),20); a.btn.classList.add('matched');b.btn.classList.add('matched');state.memoryMatched.add(a.card.id);state.memoryOpen=[];feedback(`✨ 配對成功！Combo × ${state.combo}`,bank.find(x=>x.id===a.card.id).note||'記住這一組！','good');updateMemoryProgress();
      if(state.memoryMatched.size===state.memoryPairs.length)setTimeout(()=>feedback('🎉 全部清空！',`你完成 ${state.memoryPairs.length} 組，得分 ${state.score}。再來一局吧！`,'good'),500);
    } else {
      state.memoryLock=true; state.stats.totalAnswered++; const item=bank.find(x=>x.id===a.card.id); addWrong(item.id); state.combo=0; state.score=Math.max(0,state.score-3);saveStats();updateHud();feedback('再想一下 👀','這兩張不是同一組。','bad');
      setTimeout(()=>{a.btn.classList.remove('flipped');b.btn.classList.remove('flipped');state.memoryOpen=[];state.memoryLock=false;},850);
    }
  }
  function updateMemoryProgress(){ els.memoryProgress.textContent=`${state.memoryMatched.size} / ${state.memoryPairs.length}`; }

  els.truckModeBtn.addEventListener('click',()=>setMode('truck'));
  els.memoryModeBtn.addEventListener('click',()=>setMode('memory'));
  els.newRoundBtn.addEventListener('click',()=>state.mode==='truck'?startTruckGame():startMemoryGame());
  els.category.addEventListener('change',()=>state.mode==='truck'?startTruckGame():startMemoryGame());
  initCategories(); updateHud(); setMode('truck');
})();