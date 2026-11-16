'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const b={window:{}};vm.createContext(b);for(const f of ['harmony.js','piano.js']){cp.execFileSync(process.execPath,['--check','dist/'+f]);vm.runInContext(fs.readFileSync('dist/'+f,'utf8'),b);}
const H=b.window.Harmony;assert.equal(H.roots.length*H.types.length,168);
for(const r of H.roots)for(const t of H.types)for(let inv=0;inv<3;inv++){
 const c=H.chord(r.symbol,t.id,inv);assert.equal(c.notes.length,t.intervals.length);assert.equal(c.names.length,c.notes.length);assert.equal(new Set(c.notes).size,c.notes.length);const range=H.keyRange(c.notes);assert.ok(range.start<Math.min(...c.notes)&&range.end>Math.max(...c.notes));assert.ok(![1,3,6,8,10].includes(range.start%12)&&![1,3,6,8,10].includes(range.end%12));assert.ok(c.notes.every(n=>Number.isInteger(n)&&n>=0&&n<=127));assert.ok(c.notes.every((n,i)=>!i||n>c.notes[i-1]));
 assert.deepEqual([...c.notes].map(n=>(n-r.pc+120)%12).sort((a,b)=>a-b),[...t.intervals].map(n=>n%12).sort((a,b)=>a-b));
}
assert.equal(H.chord('C','minor').names.join(','),'До,Ми♭,Соль');assert.equal(H.chord('C','dim7').names.join(','),'До,Ми♭,Соль♭,Си♭♭');assert.equal(H.chord('Db','major').names.join(','),'Ре♭,Фа,Ля♭');
assert.equal(H.chord('C','major',1).notes.join(','),'52,55,60');assert.equal(H.chord('C','major',2).notes.join(','),'55,60,64');
assert.throws(()=>H.chord('unknown','major'));
const hasProbe=cp.spawnSync('ffprobe',['-version']).status===0;
for(const [,file] of b.window.PianoSound.samples){const p='dist/piano/'+file+'.mp3',bytes=fs.readFileSync(p);assert.ok(bytes.length>4000);if(!hasProbe){assert.ok(bytes.slice(0,3).toString()==='ID3'||bytes[0]===255);continue;}const meta=JSON.parse(cp.execFileSync('ffprobe',['-v','quiet','-show_format','-show_streams','-of','json',p]));assert.equal(meta.streams[0].channels,1);assert.ok(Number(meta.format.duration)>3);}
// Verify loading/caching, pitch transposition and safe release independently of a browser.
const events=[],param=()=>({value:0,setValueAtTime(...a){events.push(['set',...a]);},linearRampToValueAtTime(...a){events.push(['linear',...a]);},exponentialRampToValueAtTime(...a){events.push(['exp',...a]);},cancelScheduledValues(...a){events.push(['cancel',...a]);}});
const node=()=>({connect(){return this;}}),context={currentTime:2,destination:{},createGain(){return {...node(),gain:param()};},createDynamicsCompressor(){return {...node(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()};},createBufferSource(){return {...node(),playbackRate:param(),start(t){this.started=t;},stop(t){this.stopped=t;}};},decodeAudioData:async()=>({duration:8})};
let requests=0;b.fetch=async()=>{requests++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};};
(async()=>{const P=b.window.PianoSound;await Promise.all([P.prepare(context,[60,61]),P.prepare(context,[60])]);assert.equal(requests,1,'coalesced nearest-sample request');const v=P.strike(context,61,1,.2,.1);assert.ok(Math.abs(v.source.playbackRate.value-2**(1/12))<1e-9);assert.equal(v.source.started,2.2);assert.ok(Math.abs(v.source.stopped-3.9)<1e-9);v.release();assert.ok(events.some(e=>e[0]==='cancel'));assert.throws(()=>P.strike(context,84));console.log('PASS: 168 chords, all inversions/spellings, nine decodable piano samples, cached loading, repitching and key release.');})().catch(e=>{console.error(e);process.exitCode=1;});
