(() => {
  const key='ipasExplorer',syncKey='ipasSynced',queueKey='ipasPending',queueLimit=400;
  const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const readList=name=>{try{const value=JSON.parse(localStorage.getItem(name)||'[]');return Array.isArray(value)?value:[]}catch{return []}};
  const writeList=(name,value)=>{try{localStorage.setItem(name,JSON.stringify(value))}catch{}};
  const mark=(level,target)=>level+'/'+target;
  let joining=null,flushing=false;
  function status(message){let node=document.getElementById('syncStatus');if(!node){node=document.createElement('p');node.id='syncStatus';node.setAttribute('role','status');node.className='sync-status';document.body.append(node)}node.textContent=message}
  async function api(path,body,method){const identity=read();const response=await fetch('./api/'+path,{method:method||(body?'POST':'GET'),signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json',...(identity?{Authorization:'Bearer '+identity.token}:{})},...(body?{body:JSON.stringify(body)}:{})});if(!response.ok){const failure=Error(response.status===401?'匿名憑證已失效；請按「刪除我的雲端紀錄」清除，再重新加入。':response.status===429?'同步太頻繁，請稍後再試；本機仍可玩。':'世界榜尚未連線或免費容量暫時用盡；個人練習仍可使用。');failure.status=response.status;throw failure}const type=response.headers.get('content-type')||'';if(!type.includes('application/json'))throw Error('世界榜後端尚未啟用；你的個人紀錄仍在此裝置。');return response.json();}
  // 答對的知識點先進本機佇列再送出：斷線或尚未加入世界榜時不會遺失，
  // 連線恢復或加入後自動補送；已確認計星的不再重送，省下免費寫入額度。
  async function flush(){
    if(flushing||!read())return false;
    flushing=true;
    try{
      for(let item=readList(queueKey)[0];item;item=readList(queueKey)[0]){
        const response=await api('answer',{level:item.level,target:item.target,choice:item.choice});
        if(response.saved!==true)throw Error('世界榜未確認這一題，稍後會再試。');
        const id=mark(item.level,item.target),synced=readList(syncKey);
        if(!synced.includes(id)){synced.push(id);writeList(syncKey,synced)}
        writeList(queueKey,readList(queueKey).filter(pending=>mark(pending.level,pending.target)!==id));
      }
      status('世界榜已同步 · 沒有待補送的知識點');
      return true;
    }catch(error){
      status(error.message+'（待補送 '+readList(queueKey).length+' 個知識點，連線恢復後自動補送）');
      return false;
    }finally{flushing=false}
  }
  window.Community={read,pending:()=>readList(queueKey).length,async join(){if(read())return read();if(joining)return joining;joining=(async()=>{const i=await api('join',{});localStorage.setItem(key,JSON.stringify(i));return i})();try{const i=await joining;flush();return i}finally{joining=null}},rank:level=>api('ranking?level='+level),async answer(level,target,choice){const id=mark(level,target);if(readList(syncKey).includes(id))return true;const queue=readList(queueKey);if(!queue.some(pending=>mark(pending.level,pending.target)===id)){if(queue.length>=queueLimit)queue.shift();queue.push({level,target,choice});writeList(queueKey,queue)}if(!read()){status('本機練習 · 尚未加入世界榜；已暫存 '+readList(queueKey).length+' 個知識點，加入後自動補送');return false}status('世界榜同步中…');return flush()},async remove(){
    // 伺服器回 401 代表這個身分在雲端已經不存在，本機再留著憑證只會卡死：
    // 既刪不掉也無法重新加入。此時照樣清除憑證，但保留待補送佇列，
    // 讓玩家重新加入後那些知識點仍能同步上去。
    let stale=false;
    if(read()){try{await api('me',null,'DELETE')}catch(failure){if(failure.status!==401)throw failure;stale=true}}
    localStorage.removeItem(key);localStorage.removeItem(syncKey);
    if(!stale)localStorage.removeItem(queueKey);
    status(stale?'失效身分已清除；重新加入後會自動補送 '+readList(queueKey).length+' 個知識點。':'雲端身分已刪除，本機學習紀錄保留');
  }};
  addEventListener('online',()=>{flush()});
  if(read()&&readList(queueKey).length)flush();
})();
