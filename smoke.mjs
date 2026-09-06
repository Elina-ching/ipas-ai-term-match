import assert from 'node:assert/strict';
const base=process.argv[2];if(!base||!/^https?:\/\//.test(base))throw Error('請提供已授權的驗收網址');
const identities=[];
async function request(path,{token,method='GET',body,origin}={}){return fetch(base+'/api/'+path,{method,signal:AbortSignal.timeout(10000),headers:{Origin:origin||base,...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{})})}
try{
 for(let i=0;i<2;i++){const r=await request('join',{method:'POST',body:{}});assert.equal(r.status,201);identities.push(await r.json())}
 const [a,b]=identities;assert.notEqual(a.alias,b.alias);
 const answer={level:'beginner',target:'b01',choice:'b01'};
 const first=await (await request('answer',{method:'POST',token:a.token,body:answer})).json();assert.equal(first.added,true);
 const duplicates=await Promise.all(Array.from({length:4},async()=>{const r=await request('answer',{method:'POST',token:a.token,body:answer});assert.equal(r.status,200);return r.json()}));assert.ok(duplicates.every(r=>r.added===false));
 await request('answer',{method:'POST',token:b.token,body:answer});await request('answer',{method:'POST',token:b.token,body:{...answer,target:'b25',choice:'b25'}});
 const rank=await (await request('ranking?level=beginner')).json();assert.equal(rank.find(x=>x.alias===a.alias).stars,1);assert.equal(rank.find(x=>x.alias===b.alias).stars,2);assert.ok(rank.findIndex(x=>x.alias===b.alias)<rank.findIndex(x=>x.alias===a.alias));
 assert.equal((await request('me',{method:'DELETE'})).status,401);
 assert.equal((await request('answer',{method:'POST',token:a.token,body:{level:'intermediate',target:'b01',choice:'b01'}})).status,400);
 assert.equal((await request('answer',{method:'POST',token:a.token,body:answer,origin:'https://other.test'})).status,403);
 assert.equal((await request('me',{method:'DELETE',token:a.token,body:{alias:b.alias}})).status,200);
 assert.equal((await request('answer',{method:'POST',token:a.token,body:answer})).status,401);
 const after=await (await request('ranking?level=beginner')).json();assert.ok(!after.some(x=>x.alias===a.alias));assert.equal(after.find(x=>x.alias===b.alias).stars,2);
 console.log('PASS: 雲端雙身分、不同知識點、併發去重、排名、跨級拒絕、跨來源拒絕、未授權刪除及身分隔離。');
}finally{for(const identity of identities){const r=await request('me',{method:'DELETE',token:identity.token});assert.ok([200,401].includes(r.status))}console.log('驗收腳本建立的身分均已刪除；憑證未寫入檔案。')}
