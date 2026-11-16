'use strict';
window.Harmony=(()=>{
 const roots=[['C','До',0,0],['Db','Ре♭',1,1],['D','Ре',2,1],['Eb','Ми♭',3,2],['E','Ми',4,2],['F','Фа',5,3],['Gb','Соль♭',6,4],['G','Соль',7,4],['Ab','Ля♭',8,5],['A','Ля',9,5],['Bb','Си♭',10,6],['B','Си',11,6]].map(([symbol,name,pc,letter])=>({symbol,name,pc,letter}));
 const types=[
 {id:'major',suffix:'',name:'Мажор',intervals:[0,4,7],degrees:[0,2,4]},
 {id:'minor',suffix:'m',name:'Минор',intervals:[0,3,7],degrees:[0,2,4]},
 {id:'seven',suffix:'7',name:'Доминантсептаккорд',intervals:[0,4,7,10],degrees:[0,2,4,6]},
 {id:'maj7',suffix:'maj7',name:'Большой мажорный септаккорд',intervals:[0,4,7,11],degrees:[0,2,4,6]},
 {id:'m7',suffix:'m7',name:'Малый минорный септаккорд',intervals:[0,3,7,10],degrees:[0,2,4,6]},
 {id:'sus2',suffix:'sus2',name:'С задержанием на секунде',intervals:[0,2,7],degrees:[0,1,4]},
 {id:'sus4',suffix:'sus4',name:'С задержанием на кварте',intervals:[0,5,7],degrees:[0,3,4]},
 {id:'dim',suffix:'dim',name:'Уменьшённое трезвучие',intervals:[0,3,6],degrees:[0,2,4]},
 {id:'aug',suffix:'aug',name:'Увеличенное трезвучие',intervals:[0,4,8],degrees:[0,2,4]},
 {id:'six',suffix:'6',name:'Мажор с секстой',intervals:[0,4,7,9],degrees:[0,2,4,5]},
 {id:'m6',suffix:'m6',name:'Минор с секстой',intervals:[0,3,7,9],degrees:[0,2,4,5]},
 {id:'add9',suffix:'add9',name:'Мажор с ноной',intervals:[0,4,7,14],degrees:[0,2,4,8]},
 {id:'dim7',suffix:'dim7',name:'Уменьшённый септаккорд',intervals:[0,3,6,9],degrees:[0,2,4,6]},
 {id:'m7b5',suffix:'m7♭5',name:'Полууменьшённый септаккорд',intervals:[0,3,6,10],degrees:[0,2,4,6]}];
 function chord(rootId,typeId,inversion=0,octave=3){const root=roots.find(r=>r.symbol===rootId),type=types.find(t=>t.id===typeId);if(!root||!type)throw Error('Unknown chord');const natural=[0,2,4,5,7,9,11],names=['До','Ре','Ми','Фа','Соль','Ля','Си'];let notes=type.intervals.map((n,i)=>{const letter=(root.letter+type.degrees[i])%7,pc=(root.pc+n)%12,delta=((pc-natural[letter]+18)%12)-6;return {midi:12*(octave+1)+root.pc+n,name:names[letter]+(delta>0?'♯'.repeat(delta):'♭'.repeat(-delta))};});for(let i=0;i<Math.min(Math.max(0,inversion),notes.length-1);i++){const first=notes.shift();first.midi+=12;notes.push(first);}notes.sort((a,b)=>a.midi-b.midi);return {symbol:root.symbol+type.suffix,notes:notes.map(n=>n.midi),names:notes.map(n=>n.name),type:type.name};}
 function keyRange(notes,base=48){const white=n=>[0,2,4,5,7,9,11].includes(((n%12)+12)%12);if(!notes.length)return {start:base,end:base+24};let start=Math.min(...notes),end=Math.max(...notes);do{start--;}while(!white(start));do{end++;}while(!white(end));while(end-start<12){do{start--;}while(!white(start));if(end-start>=12)break;do{end++;}while(!white(end));}return {start,end};}
 return {roots,types,chord,keyRange};
})();
