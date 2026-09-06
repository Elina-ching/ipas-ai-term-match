import fs from 'node:fs';
import vm from 'node:vm';
const ctx={window:{}};vm.createContext(ctx);for(const f of ['data.js','levels.js','python-data.js','curriculum.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
const answers={beginner:Object.fromEntries(ctx.window.BEGINNER_BANK.map(q=>[q.id,q.id])),intermediate:Object.fromEntries([...ctx.window.TERM_BANK.map(q=>[q.id,q.id]),...ctx.window.PYTHON_BANK.map(q=>[q.id,'option'+q.answer])])};
fs.writeFileSync('server/answers.mjs','export const answers = '+JSON.stringify(answers)+';\n');
fs.mkdirSync('public',{recursive:true});for(const f of fs.readdirSync('.'))if(/\.(html|css|js)$/.test(f))fs.copyFileSync(f,'public/'+f);
fs.copyFileSync('_headers','public/_headers');
console.log('Static game files and server answer allowlist built.');
