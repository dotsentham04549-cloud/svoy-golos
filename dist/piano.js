'use strict';
window.PianoSound=(()=>{
 const samples=[[36,'C2'],[42,'Fs2'],[48,'C3'],[54,'Fs3'],[60,'C4'],[66,'Fs4'],[72,'C5'],[78,'Fs5'],[84,'C6']];
 const contexts=new WeakMap();
 function state(context){if(!contexts.has(context)){const master=context.createGain(),compressor=context.createDynamicsCompressor();master.gain.value=.8;compressor.threshold.value=-14;compressor.knee.value=12;compressor.ratio.value=3;compressor.attack.value=.004;compressor.release.value=.18;master.connect(compressor).connect(context.destination);contexts.set(context,{buffers:new Map(),loads:new Map(),master});}return contexts.get(context);}
 const nearest=midi=>samples.reduce((a,b)=>Math.abs(a[0]-midi)<=Math.abs(b[0]-midi)?a:b);
 async function prepare(context,notes=samples.map(s=>s[0])){const s=state(context);await Promise.all([...new Set(notes.map(n=>nearest(n)[0]))].map(async key=>{if(s.buffers.has(key))return;if(!s.loads.has(key)){const file=samples.find(n=>n[0]===key)[1];const task=(async()=>{const response=await fetch(`piano/${file}.mp3`);if(!response.ok)throw Error('Piano sample unavailable');const bytes=await response.arrayBuffer();const buffer=await context.decodeAudioData(bytes);s.buffers.set(key,buffer);})();s.loads.set(key,task);task.catch(()=>s.loads.delete(key));}await s.loads.get(key);}));}
 function strike(context,midi,duration=.6,delay=0,volume=.14){const s=state(context),key=nearest(midi)[0],buffer=s.buffers.get(key);if(!buffer)throw Error('Piano not loaded');const src=context.createBufferSource(),gain=context.createGain(),at=context.currentTime+Math.max(0,delay),level=Math.min(.5,Math.max(.01,volume*2.5));src.buffer=buffer;src.playbackRate.value=2**((midi-key)/12);src.connect(gain).connect(s.master);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(level,at+.005);const releaseAt=at+duration;gain.gain.setValueAtTime(level,releaseAt);gain.gain.exponentialRampToValueAtTime(.0001,releaseAt+.65);src.start(at);src.stop(releaseAt+.7);
  const release=()=>{const t=Math.max(context.currentTime,at+.006);gain.gain.cancelScheduledValues(t);gain.gain.setValueAtTime(level,t);gain.gain.exponentialRampToValueAtTime(.0001,t+.3);try{src.stop(t+.35);}catch{}};
  return {source:src,release};
 }
 return {prepare,strike,samples};
})();
