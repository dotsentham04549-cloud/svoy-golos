'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),cp=require('node:child_process');
const root=__dirname,dist=path.join(root,'dist');
for(const file of ['app.js','lessons.js','planner.js','harmony.js','piano.js','sw.js'])cp.execFileSync(process.execPath,['--check',path.join(dist,file)]);
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(dist,'lessons.js'),'utf8'),sandbox);
const {COURSES,LESSONS}=sandbox.window;
assert.equal(COURSES.length,4);assert.equal(LESSONS.length,112);assert.equal(new Set(LESSONS.map(x=>x.id)).size,112);
for(const [course,count,seconds] of [['speech',24,1080],['vocal',24,540],['piano',48,360],['music',16,300]]){
 const ls=LESSONS.filter(l=>l.course===course);assert.equal(ls.length,count);
 for(const l of ls){if(l.version===1)assert.equal(l.steps.reduce((s,x)=>s+x.seconds,0),seconds);assert.ok(l.goal&&l.criteria.length>=2);assert.ok(l.steps.length>=3);for(const s of l.steps){assert.ok(s.title&&s.instruction&&s.check);assert.ok(Number.isInteger(s.seconds)&&s.seconds>0);if(s.notes){assert.ok(s.notes.length>0);assert.ok(s.notes.every(n=>Number.isInteger(n)&&n>=0&&n<=127));}}}
}
assert.ok(LESSONS.filter(l=>l.course==='piano'||l.course==='music').every(l=>l.home===true));
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
for(const ref of [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1]))assert.ok(fs.existsSync(path.join(dist,ref)),ref+' is missing');
const manifest=JSON.parse(fs.readFileSync(path.join(dist,'manifest.webmanifest'),'utf8'));assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
for(const size of [192,512]){
 const icon=manifest.icons.find(i=>i.sizes===`${size}x${size}`&&i.purpose==='any');assert.ok(icon);
 const png=fs.readFileSync(path.join(dist,icon.src));assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);
}
assert.equal(manifest.id,'./');
for(const l of LESSONS.filter(l=>l.course==='vocal'))assert.equal(l.steps[3].recall,true);
const appSource=fs.readFileSync(path.join(dist,'app.js'),'utf8');assert.ok(appSource.includes('if(s.notes&&!s.recall)'));
assert.ok(!fs.existsSync(path.join(dist,'__qa.html')),'Remove QA page before publication');
console.log('PASS: 112 complete lessons, four curricula, timing, practical gates, assets, PWA paths and JavaScript syntax.');
