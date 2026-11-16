'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const dist=path.join(__dirname,'dist'),box={window:{}};
for(const f of ['lessons.js','voices.js'])vm.runInNewContext(fs.readFileSync(path.join(dist,f),'utf8'),box);
const files=new Set();
const transcripts=new Map(JSON.parse(fs.readFileSync(path.join(__dirname,'voice-sources.json'),'utf8')).clips.map(c=>[c.file.replace(/^dist\//,''),c.text]));
for(const lesson of box.window.LESSONS.filter(l=>l.version===1)){
 const clips=box.window.VOICE_CLIPS[lesson.id];assert.equal(clips.length,lesson.steps.length,lesson.id);
 for(const [i,src] of clips.entries()){const step=lesson.steps[i];assert.equal(transcripts.get(src),[step.title+'.',step.instruction,step.text||'',step.check].join(' '),'Audio transcript must match '+lesson.id+' step '+i);assert.match(src,/^audio\/clip-\d{3}\.mp3$/);const bytes=fs.readFileSync(path.join(dist,src));assert.ok(bytes.length>4000,src);files.add(src);}
}
assert.equal(files.size,107);
const source=fs.readFileSync(path.join(dist,'app.js'),'utf8');
const stop=source.slice(source.indexOf('function stopSpeech()'),source.indexOf('\nlet wakeLock'));
const speak=source.slice(source.indexOf('function speakStep('),source.indexOf('\nasync function saveLessonAudio'));
const context={console,setTimeout,clearTimeout,window:box.window,Audio:class{
 constructor(src){this.src=src;context.audios.push(this);}
 play(){return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){this.src='';}load(){}
},audios:[],button:{},counts:0,messages:[],beginCountdown(){context.counts++;},status(s){context.messages.push(s);},keepAwake(){},releaseAwake(){},$(s){return context.button;},playExample:async()=>{}};
vm.createContext(context);
vm.runInContext(`let session={id:'speech-1',course:'speech',steps:[{}]},stepIndex=0,speechVersion=0,narrationAudio=null,narrationTimeout=null,narrating=false,utterance=null;${stop}\nfunction pauseSession(){stopSpeech();}\n${speak}`,context);
(async()=>{
 vm.runInContext('speakStep(true)',context);assert.equal(context.counts,0,'timer waits for narration');
 await context.audios.at(-1).onended();assert.equal(context.counts,1);
 vm.runInContext('speakStep(true)',context);const old=context.audios.at(-1),staleEnd=old.onended;
 vm.runInContext('pauseSession()',context);assert.ok(old.paused);await staleEnd();assert.equal(context.counts,1,'cancelled playback cannot start timer');
 vm.runInContext('speakStep(true)',context);const failed=context.audios.at(-1);failed.onerror();assert.ok(failed.paused);assert.equal(context.counts,1,'failed playback cannot start timer');
 vm.runInContext('speakStep(false)',context);await context.audios.at(-1).onended();assert.equal(context.counts,1,'read-only playback does not start timer');
 vm.runInContext('stopSpeech()',context);
 const sw={self:{addEventListener(){},location:{origin:'https://test.local'}},caches:{open:async()=>({match:async()=>new Response(Uint8Array.from([1,2,3,4,5]),{headers:{'Content-Type':'audio/mpeg'}})})},Response,Request,URL,fetch};
 vm.createContext(sw);vm.runInContext(fs.readFileSync(path.join(dist,'sw.js'),'utf8'),sw);
 sw.req=new Request('https://test.local/audio/clip-000.mp3',{headers:{Range:'bytes=1-3'}});const partial=await vm.runInContext('voiceResponse(req)',sw);
 assert.equal(partial.status,206);assert.deepEqual([...new Uint8Array(await partial.arrayBuffer())],[2,3,4]);
 sw.req=new Request('https://test.local/audio/clip-000.mp3',{headers:{Range:'bytes=9-'}});assert.equal((await vm.runInContext('voiceResponse(req)',sw)).status,416);
 console.log(`PASS: all 240 original steps have local audio (${files.size} unique clips); timer ordering, cancellation, errors, manual playback and offline audio ranges.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
