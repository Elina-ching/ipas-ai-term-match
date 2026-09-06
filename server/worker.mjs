import { answers } from './answers.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const digest=async token=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');
export function validAnswer(level,target,choice){return Object.hasOwn(answers,level)&&typeof target==='string'&&typeof choice==='string'&&Object.hasOwn(answers[level],target)&&answers[level][target]===choice}
async function readBody(req){
 const reader=req.body?.getReader();if(!reader)return '';let size=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024){await reader.cancel();throw new RangeError('body')}chunks.push(value)}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}return new TextDecoder().decode(bytes);
}
export default {async fetch(req,env){const url=new URL(req.url);if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(req);if(!env.DB)return json({error:'World ranking not configured'},503);if(req.headers.get('Origin')&&req.headers.get('Origin')!==url.origin)return json({error:'Origin not allowed'},403);try{
 // 限流鍵只交給平台限流器，不寫入資料庫或日誌；缺少綁定時禁止公開建立身分。
 if(env.API_LIMIT){const {success}=await env.API_LIMIT.limit({key:req.headers.get('CF-Connecting-IP')||'local'});if(!success)return json({error:'Too many requests'},429)}
 if(req.method==='GET'&&url.pathname==='/api/ranking'){const level=url.searchParams.get('level');if(!['beginner','intermediate'].includes(level))return json({error:'Invalid level'},400);const {results}=await env.DB.prepare('SELECT p.alias,s.stars FROM scores s JOIN players p ON p.id=s.player_id WHERE s.level=? ORDER BY s.stars DESC,s.player_id ASC LIMIT 50').bind(level).all();return json(results)}
 if(req.method==='POST'&&url.pathname==='/api/join'){if(!env.JOIN_LIMIT)return json({error:'Signup unavailable'},503);if(!(await env.JOIN_LIMIT.limit({key:req.headers.get('CF-Connecting-IP')||'local'})).success)return json({error:'Too many signups'},429);const token=crypto.randomUUID()+crypto.randomUUID(),id=crypto.randomUUID();const alias='探險家-'+id.slice(0,8);const result=await env.DB.prepare('INSERT INTO players(id,token_hash,alias) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM players)<2000').bind(id,await digest(token),alias).run();if(!result.meta.changes)return json({error:'Community capacity reached'},503);return json({token,alias},201)}
 const auth=req.headers.get('Authorization')||'';if(!/^Bearer [a-f0-9-]{72}$/.test(auth))return json({error:'Unauthorized'},401);const player=await env.DB.prepare('SELECT id FROM players WHERE token_hash=?').bind(await digest(auth.slice(7))).first();if(!player)return json({error:'Unauthorized'},401);
 if(req.method==='DELETE'&&url.pathname==='/api/me'){await env.DB.batch([env.DB.prepare('DELETE FROM mastery WHERE player_id=?').bind(player.id),env.DB.prepare('DELETE FROM players WHERE id=?').bind(player.id)]);return json({deleted:true})}
 if(req.method==='POST'&&url.pathname==='/api/answer'){let body;try{body=await readBody(req)}catch(e){if(e instanceof RangeError)return json({error:'Too large'},413);throw e}let v;try{v=JSON.parse(body)}catch{return json({error:'Invalid JSON'},400)}if(!v||typeof v!=='object'||!validAnswer(v.level,v.target,v.choice))return json({error:'Invalid answer'},400);const result=await env.DB.prepare('INSERT OR IGNORE INTO mastery(player_id,level,term_id) VALUES(?,?,?)').bind(player.id,v.level,v.target).run();return json({saved:true,added:result.meta.changes>0})}
 return json({error:'Not found'},404);
 }catch{return json({error:'Temporarily unavailable'},503)}}};
