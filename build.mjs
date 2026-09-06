import fs from 'node:fs';
import vm from 'node:vm';
const ctx={window:{}};vm.createContext(ctx);for(const f of ['data.js','levels.js','python-data.js','curriculum.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
const answers={beginner:Object.fromEntries(ctx.window.BEGINNER_BANK.map(q=>[q.id,q.id])),intermediate:Object.fromEntries([...ctx.window.TERM_BANK.map(q=>[q.id,q.id]),...ctx.window.PYTHON_BANK.map(q=>[q.id,'option'+q.answer])])};
fs.writeFileSync('server/answers.mjs','export const answers = '+JSON.stringify(answers)+';\n');
fs.mkdirSync('public',{recursive:true});for(const f of fs.readdirSync('.'))if(/\.(html|css|js)$/.test(f))fs.copyFileSync(f,'public/'+f);
fs.copyFileSync('_headers','public/_headers');
// 資安標頭以 _headers 為單一來源，同時產生 Worker 套用的常數，避免兩處各寫一份而走鐘。
const headerPairs=fs.readFileSync('_headers','utf8').split(/\r?\n/).filter(line=>/^\s+\S+:/.test(line)).map(line=>{const at=line.indexOf(':');return [line.slice(0,at).trim(),line.slice(at+1).trim()]});
fs.writeFileSync('server/headers.mjs','export const assetHeaders = '+JSON.stringify(Object.fromEntries(headerPairs))+';\n');
console.log('Static game files, security headers and server answer allowlist built.');
