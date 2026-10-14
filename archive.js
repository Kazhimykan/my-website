"use strict";
const KEY='grafik_smen_five_v1', $=id=>document.getElementById(id);
const months=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const money=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n)+' ₸';
const number=v=>Math.max(0,Number(v)||0);
let data={};try{data=JSON.parse(localStorage.getItem(KEY))||{};}catch(e){data={};}
if(!data.months||typeof data.months!=='object')data.months={};
if(!Array.isArray(data.names))data.names=[];
const active=/^\d{4}-(0[1-9]|1[0-2])$/.test(data.activeMonth||'')?data.activeMonth:'2026-10';
let year=Number(active.slice(0,4)),month=Number(active.slice(5,7));
function key(){return `${year}-${String(month).padStart(2,'0')}`;}
function entry(){return data.months[key()]||{rate:22000,bonus:3200,marks:{},deductions:{}};}
function el(tag,value,cls){const e=document.createElement(tag);if(value!==undefined)e.textContent=String(value);if(cls)e.className=cls;return e;}
function totals(forMonth=month){const rec=data.months[`${year}-${String(forMonth).padStart(2,'0')}`]||{rate:22000,bonus:3200,marks:{},deductions:{}},dCount=new Date(year,forMonth,0).getDate(),marks=rec.marks||{},ded=rec.deductions||{},rows=[];let a={shifts:0,base:0,bonus:0,deductions:0,pay:0};for(let i=0;i<5;i++){let full=0,half=0,off=0;for(let d=1;d<=dCount;d++){let c=marks[`${i}-${d}`];if(Array.isArray(data.replacements)&&data.replacements.some(r=>r.from===i&&r.date===`${year}-${String(forMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`))c='П';if(c==='1')full++;else if(c==='0.5')half++;else if(c==='В')off++;}const shifts=full+half/2,base=shifts*number(rec.rate??22000),bonus=shifts*number(rec.bonus??3200),rev=number(ded[`${i}-revision`]),birth=number(ded[`${i}-birthday`]),deduct=rev+birth,pay=base+bonus-deduct;rows.push({name:data.names[i]||`Сотрудник ${i+1}`,full,half,off,shifts,base,bonus,rev,birth,deduct,pay});a.shifts+=shifts;a.base+=base;a.bonus+=bonus;a.deductions+=deduct;a.pay+=pay;}return {rows,a};}
function render(){
 $('archiveYear').value=String(year);$('archiveMonth').value=String(month);renderAnnual();
 const record=data.months[key()],hasRecord=!!record&&(Object.keys(record.marks||{}).length>0||Object.values(record.deductions||{}).some(v=>number(v)>0));
 $('archiveStatus').textContent=hasRecord?'✓ Есть сохранённые записи': 'Пока нет заполненных смен за этот месяц';
 $('graphTitle').textContent=`График — ${months[month-1]} ${year}`;
 $('editMonth').href=`index.html?month=${key()}`;
 const grid=$('monthCards');grid.replaceChildren();for(let m=1;m<=12;m++){const k=`${year}-${String(m).padStart(2,'0')}`,r=data.months[k],exists=!!r&&(Object.keys(r.marks||{}).length>0||Object.values(r.deductions||{}).some(v=>number(v)>0));const btn=el('button',`${months[m-1]} ${exists?'✓':'—'}`,'month-card'+(m===month?' active':'')+(exists?' filled':''));btn.type='button';btn.addEventListener('click',()=>{month=m;render();});grid.append(btn);}
 renderArchiveReplacements();const {rows,a}=totals();$('aShifts').textContent=a.shifts.toLocaleString('ru-RU');$('aBase').textContent=money(a.base);$('aBonus').textContent=money(a.bonus);$('aDeductions').textContent=money(a.deductions);$('aPay').textContent=money(a.pay);
 const head=$('archiveSchedule').tHead,body=$('archiveSchedule').tBodies[0],dCount=new Date(year,month,0).getDate(),marks=entry().marks||{},wk=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];head.replaceChildren();body.replaceChildren();const hr=el('tr');hr.append(el('th','Сотрудник'));for(let d=1;d<=dCount;d++){const day=el('th',d,'day');day.append(el('span',wk[new Date(year,month-1,d).getDay()],'day-name'));hr.append(day);}head.append(hr);
 for(let i=0;i<5;i++){const tr=el('tr');tr.append(el('td',rows[i].name));for(let d=1;d<=dCount;d++){const date=`${key()}-${String(d).padStart(2,'0')}`;const isReplacement=Array.isArray(data.replacements)&&data.replacements.some(r=>r.from===i&&r.date===date);const value=isReplacement?'П':(marks[`${i}-${d}`]||'');const cell=el('td',value==='0.5'?'0,5':value,value==='1'?'archive-full':value==='0.5'?'archive-half':value==='В'?'archive-off':value==='П'?'archive-replacement':'');tr.append(cell);}body.append(tr);}
 const sb=$('archiveSummary');sb.replaceChildren();for(const r of rows){const tr=el('tr');[r.name,r.full,r.half,r.off,r.shifts.toLocaleString('ru-RU'),money(r.base),money(r.bonus),money(r.base+r.bonus),money(r.rev),money(r.birth),money(r.deduct),money(r.pay)].forEach(v=>tr.append(el('td',v)));sb.append(tr);}
}

function renderAnnual(){
 $('annualTitle').textContent=`Итоги за ${year} год`;
 const annualRows=Array.from({length:5},(_,i)=>({name:data.names[i]||`Сотрудник ${i+1}`,full:0,half:0,shifts:0,base:0,bonus:0,rev:0,birth:0,deduct:0,pay:0}));
 const monthBody=$('annualMonths');monthBody.replaceChildren();
 let yearTotal={shifts:0,base:0,bonus:0,deductions:0,pay:0};
 for(let m=1;m<=12;m++){
  const {rows,a}=totals(m);
  rows.forEach((r,i)=>{for(const k of ['full','half','shifts','base','bonus','rev','birth','deduct','pay'])annualRows[i][k]+=r[k];});
  for(const k of ['shifts','base','bonus','deductions','pay'])yearTotal[k]+=a[k];
  const tr=el('tr');const label=el('button',months[m-1],'annual-month-link');label.type='button';label.addEventListener('click',()=>{month=m;render();$('graphTitle').scrollIntoView({behavior:'smooth',block:'start'});});const td=el('td');td.append(label);tr.append(td);
  [a.shifts.toLocaleString('ru-RU'),money(a.base),money(a.bonus),money(a.deductions),money(a.pay)].forEach(v=>tr.append(el('td',v)));
  monthBody.append(tr);
 }
 const body=$('annualEmployees');body.replaceChildren();
 for(const r of annualRows){const tr=el('tr');[r.name,r.full,r.half,r.shifts.toLocaleString('ru-RU'),money(r.base),money(r.bonus),money(r.rev),money(r.birth),money(r.deduct),money(r.pay)].forEach(v=>tr.append(el('td',v)));body.append(tr);}
 $('yearShifts').textContent=yearTotal.shifts.toLocaleString('ru-RU');$('yearBase').textContent=money(yearTotal.base);$('yearBonus').textContent=money(yearTotal.bonus);$('yearDeduct').textContent=money(yearTotal.deductions);$('yearPay').textContent=money(yearTotal.pay);
 const t=$('annualMonthsTotal');t.replaceChildren();['Всего',yearTotal.shifts.toLocaleString('ru-RU'),money(yearTotal.base),money(yearTotal.bonus),money(yearTotal.deductions),money(yearTotal.pay)].forEach(v=>t.append(el('th',v)));
}

const yearOptions=new Set([2026,year,...Object.keys(data.months).filter(k=>/^\d{4}-(0[1-9]|1[0-2])$/.test(k)).map(k=>Number(k.slice(0,4)))]);
for(let y=2026;y<=Math.max(new Date().getFullYear()+2,...yearOptions);y++)yearOptions.add(y);
[...yearOptions].sort((a,b)=>a-b).forEach(y=>{const opt=el('option',y);opt.value=y;$('archiveYear').append(opt);});
months.forEach((m,i)=>{const opt=el('option',m);opt.value=i+1;$('archiveMonth').append(opt);});
$('archiveYear').addEventListener('change',e=>{year=Number(e.target.value);render();});
$('archiveMonth').addEventListener('change',e=>{month=Number(e.target.value);render();});
window.addEventListener('storage',()=>{try{data=JSON.parse(localStorage.getItem(KEY))||{};}catch(e){}render();});
render();

function renderArchiveReplacements(){const recs=(Array.isArray(data.replacements)?data.replacements:[]).filter(r=>typeof r.date==='string'&&r.date.startsWith(key()+'-'));const body=$('archReplacements');body.replaceChildren();let due=0,paid=0;for(const r of recs){const amt=number(r.amount),p=Math.min(amt,number(r.paid));due+=amt;paid+=p;const tr=el('tr');[r.date.split('-').reverse().join('.'),data.names[r.from]||`Сотрудник ${r.from+1}`,data.names[r.to]||`Сотрудник ${r.to+1}`,r.fraction===0.5?'0,5':'1',money(amt),money(p),money(amt-p)].forEach(v=>tr.append(el('td',v)));body.append(tr);}if(!recs.length){const tr=el('tr'),td=el('td','Подмен нет');td.colSpan=7;tr.append(td);body.append(tr);}$('archDebt').textContent=money(due);$('archPaid').textContent=money(paid);$('archRemaining').textContent=money(due-paid);}
