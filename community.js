(() => {
  const key='ipasExplorer';
  const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  async function api(path,body,method){const identity=read();const response=await fetch('./api/'+path,{method:method||(body?'POST':'GET'),headers:{'Content-Type':'application/json',...(identity?{Authorization:'Bearer '+identity.token}:{})},...(body?{body:JSON.stringify(body)}:{})});if(!response.ok)throw Error('世界榜尚未連線或免費額度暫時用盡；個人練習仍可使用。');const type=response.headers.get('content-type')||'';if(!type.includes('application/json'))throw Error('世界榜後端尚未啟用；你的個人紀錄仍在此裝置。');return response.json();}
  window.Community={read,async join(){if(read())return read();const i=await api('join',{});localStorage.setItem(key,JSON.stringify(i));return i},rank:level=>api('ranking?level='+level),async answer(level,target,choice){if(!read())return;try{await api('answer',{level,target,choice})}catch{}},async remove(){if(read())await api('me',null,'DELETE');localStorage.removeItem(key)}};
})();
