(() => {
  let enabled = localStorage.getItem('ipasSound') !== 'off';
  let ctx = null;
  const btn = document.getElementById('soundBtn');
  function context(){ if(!ctx) ctx=new (window.AudioContext||window.webkitAudioContext)(); if(ctx.state==='suspended') ctx.resume(); return ctx; }
  function tone(freq=440,duration=.08,type='sine',gain=.045,delay=0){ if(!enabled)return; try{const c=context(),o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+duration);}catch{} }
  window.gameSound={
    correct(){tone(660,.07,'sine',.045);tone(880,.10,'sine',.04,.07)},
    wrong(){tone(180,.16,'sawtooth',.035);tone(130,.18,'sawtooth',.025,.09)},
    flip(){tone(420,.035,'triangle',.025)},
    fire(){tone(240,.045,'square',.025);tone(520,.07,'square',.02,.035)},
    hit(){tone(760,.045,'square',.035);tone(980,.06,'triangle',.03,.035)},
    move(){tone(300,.025,'triangle',.015)},
    timeout(){tone(220,.10,'sawtooth',.025);tone(160,.15,'sawtooth',.025,.08)}
  };
  function render(){if(btn)btn.textContent=enabled?'🔊 音效開':'🔇 音效關';}
  if(btn)btn.addEventListener('click',()=>{enabled=!enabled;localStorage.setItem('ipasSound',enabled?'on':'off');render();if(enabled)tone(600,.06,'sine',.035);});
  document.addEventListener('pointerdown',()=>{if(enabled)try{context();}catch{}},{once:true});
  render();
})();