(() => {
 const params=new URLSearchParams(location.search);const level=params.get('level')==='beginner'?'beginner':'intermediate';window.IPAS_LEVEL=level;
 if(level==='beginner')window.TERM_BANK=window.BEGINNER_BANK;
 document.getElementById('levelLabel').textContent=(level==='beginner'?'🌱 初級':'🚀 中級')+'挑戰';
 document.querySelector('.hero h1').textContent='AI 群島遊樂場';document.querySelector('.eyebrow').textContent='iPAS AI 應用規劃師 · '+(level==='beginner'?'初級':'中級');document.querySelector('.subtitle').textContent='看懂解釋，再用下一次回想鞏固記憶。';
 if(localStorage.getItem('ipasMotion')==='off')document.body.classList.add('reduce');
 document.getElementById('reviewBtn').onclick=()=>location.href='play.html?level='+level+'&review=1&game=truck';
})();
