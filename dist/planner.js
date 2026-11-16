'use strict';
// Calendar dates, without elapsed-millisecond/DST arithmetic.
window.TrainingPlan=(()=>{
 const BLOCKS=[{name:'Основа',description:'Свободный звук, удобная высота, пульс и первые движения рук.'},{name:'Управление',description:'Дикция, интонация, слух, ноты и координация.'},{name:'Применение',description:'Рассказы, песенные фразы, аккомпанемент и мотивы.'},{name:'Самостоятельность',description:'Речь для камеры, исполнение, свой эскиз и контроль результата.'}];
 const DAYS=['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
 const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
 const date=(now=new Date())=>`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const add=(s,n)=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 const weekday=s=>new Date(s+'T12:00:00Z').getUTCDay();
 const monday=s=>add(s,-((weekday(s)+6)%7));
 function schedule(s,start){const week=Math.round((Date.parse(monday(s)+'T12:00:00Z')-Date.parse(monday(start)+'T12:00:00Z'))/604800000);return [[],['speech'],['piano'],['vocal'],['piano'],[Math.abs(week)%2?'vocal':'speech'],['piano','music']][weekday(s)].slice();}
 function block(lessons,mastered){for(let i=0;i<4;i++)if(lessons.some(l=>l.block===i&&!mastered[l.id]))return i;return 4;}
 function recommend(course,lessons,mastered){const b=block(lessons,mastered);const inBlock=lessons.filter(l=>l.course===course&&l.block===b);return inBlock.find(l=>!mastered[l.id])||inBlock.at(-1)||null;}
 function normalize(raw,lessons,today){const ids=new Set(lessons.map(l=>l.id));const p={version:1,startedOn:validDate(raw?.startedOn)?raw.startedOn:today,closedOn:validDate(raw?.closedOn)?raw.closedOn:null,pending:null};const v=raw?.pending;
  if(v&&validDate(v.date)&&validDate(v.availableOn)&&Array.isArray(v.lessonIds)&&v.lessonIds.length>0&&v.lessonIds.length<=2&&new Set(v.lessonIds).size===v.lessonIds.length&&v.lessonIds.every(id=>ids.has(id))){p.pending={date:v.date,availableOn:v.availableOn,lessonIds:v.lessonIds.slice(),done:Array.isArray(v.done)?v.done.filter(id=>v.lessonIds.includes(id)):[]};}
  return p;
 }
 function ensure(state,lessons,today=date()){const p=state.plan=normalize(state.plan,lessons,today);if(!p.pending&&p.closedOn!==today){const ids=schedule(today,p.startedOn).map(c=>recommend(c,lessons,state.mastered)).filter(Boolean).map(l=>l.id);if(ids.length)p.pending={date:today,availableOn:today,lessonIds:ids,done:[]};}return p;}
 function task(state,lessons,today=date()){const p=ensure(state,lessons,today);if(!p.pending||p.pending.availableOn>today)return null;const id=p.pending.lessonIds.find(id=>!p.pending.done.includes(id));return lessons.find(l=>l.id===id)||null;}
 function finish(state,lessons,lessonId,practiced,today=date()){const p=ensure(state,lessons,today);if(!practiced||!p.pending||p.pending.availableOn>today)return false;
  // Only the assigned lesson completes a calendar slot. Free choice stays free practice.
  if(!p.pending.lessonIds.includes(lessonId))return false;
  if(!p.pending.done.includes(lessonId))p.pending.done.push(lessonId);
  if(p.pending.lessonIds.every(id=>p.pending.done.includes(id))){p.pending=null;p.closedOn=today;}return true;
 }
 function defer(state,lessons,today=date()){const p=ensure(state,lessons,today);if(p.pending)p.pending.availableOn=add(today,1);}
 return {BLOCKS,DAYS,date,add,weekday,monday,schedule,block,recommend,normalize,ensure,task,finish,defer,validDate};
})();
