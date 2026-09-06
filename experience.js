(() => {
 const motion=document.createElement('button');motion.type='button';motion.id='motionToggle';
 const reduced=()=>localStorage.getItem('ipasMotion')==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches;
 function render(){document.body.classList.toggle('reduce',reduced());motion.textContent=reduced()?'動畫：關':'動畫：開';motion.setAttribute('aria-pressed',String(!reduced()))}
 motion.onclick=()=>{localStorage.setItem('ipasMotion',reduced()?'on':'off');render()};document.querySelector('.world-nav,header')?.append(motion);render();
 const feedback=document.getElementById('feedback')||document.getElementById('explanation');
 if(feedback){new MutationObserver(()=>{feedback.classList.remove('feedback-pop');if(!reduced()){void feedback.offsetWidth;feedback.classList.add('feedback-pop')}}).observe(feedback,{childList:true,subtree:true})}
})();
