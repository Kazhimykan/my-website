'use strict';
const STORAGE_KEY = 'grafik_smen_five_v1';
const DEFAULT_NAMES = ['Сотрудник 1','Сотрудник 2','Сотрудник 3','Сотрудник 4','Сотрудник 5'];
const $ = id => document.getElementById(id);
const money = number => new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(number) + ' ₸';
const num = value => Math.max(0,Number(value)||0);
const currentMonth = () => { const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
function load(){try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY));if(data&&typeof data==='object')return data;}catch(e){console.warn('Данные повреждены',e)}return {};}
let data=load();if(!data.months||typeof data.months!=='object')data.months={};if(!Array.isArray(data.names))data.names=[...DEFAULT_NAMES];if(!Array.isArray(data.replacements))data.replacements=[];
const validMonth = m => /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
const urlMonth = new URLSearchParams(location.search).get('month');
let month=validMonth(urlMonth)?urlMonth:validMonth(data.activeMonth)?data.activeMonth:currentMonth();let chosenMark='1';
function daysCount(){const [y,m]=month.split('-').map(Number);return new Date(y,m,0).getDate();}
function monthData(){if(!data.months[month]||typeof data.months[month]!=='object')data.months[month]={rate:22000,bonus:3200,marks:{},deductions:{}};const obj=data.months[month];if(!obj.marks||typeof obj.marks!=='object')obj.marks={};if(!obj.deductions||typeof obj.deductions!=='object')obj.deductions={};return obj;}
function save(){data.activeMonth=month;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));$('saveStatus').textContent='✓ Сохранено автоматически на этом устройстве';}catch(e){$('saveStatus').textContent='Не удалось сохранить данные. Экспортируйте файл JSON.';}}
function replacementFor(i,d){return data.replacements.find(r=>r.from===i&&r.date===`${month}-${String(d).padStart(2,'0')}`);}
function getMark(i,d){if(replacementFor(i,d))return 'П';return monthData().marks[`${i}-${d}`]||'';}
function calc(i){let full=0,half=0,off=0;for(let d=1;d<=daysCount();d++){const v=getMark(i,d);if(v==='1')full++;else if(v==='0.5')half++;else if(v==='В')off++;}const shifts=full+half/2;const {rate,bonus}=monthData();return {full,half,off,shifts,base:shifts*num(rate),bonusPay:shifts*num(bonus),total:shifts*(num(rate)+num(bonus))};}
function element(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function render(){const m=monthData();$('month').value=month;$('rate').value=m.rate??22000;$('bonus').value=m.bonus??3200;document.querySelectorAll('.mark-choice').forEach(b=>b.classList.toggle('selected',b.dataset.mark===chosenMark));const head=$('scheduleTable').tHead,body=$('scheduleTable').tBodies[0];head.replaceChildren();body.replaceChildren();const tr=element('tr');tr.append(element('th','Сотрудник'));const [year,mon]=month.split('-').map(Number);const weekday=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];for(let d=1;d<=daysCount();d++){const date=new Date(year,mon-1,d);const h=element('th',String(d),'day');const w=element('span',weekday[date.getDay()],'day-name');h.append(w);if(date.getDay()===0||date.getDay()===6)h.classList.add('weekend');tr.append(h);}head.append(tr);
for(let i=0;i<5;i++){const row=element('tr');const first=element('td');const name=element('input');name.className='employee-input';name.value=data.names[i]||DEFAULT_NAMES[i];name.setAttribute('aria-label',`Имя сотрудника ${i+1}`);name.maxLength=55;name.addEventListener('change',()=>{data.names[i]=name.value.trim()||DEFAULT_NAMES[i];save();render();renderReplacements();});first.append(name);row.append(first);for(let d=1;d<=daysCount();d++){const cell=element('td');const value=getMark(i,d);const btn=element('button',value==='0.5'?'0,5':value,'shift-btn '+(value==='1'?'full':value==='0.5'?'half':value==='В'?'off':value==='П'?'replacement':''));btn.type='button';btn.title=`${data.names[i]||DEFAULT_NAMES[i]}, ${d} число: ${value||'не отмечено'}`;btn.setAttribute('aria-label',btn.title);btn.addEventListener('click',()=>{if(replacementFor(i,d)){document.getElementById('replacementSection').scrollIntoView({behavior:'smooth'});return;}const key=`${i}-${d}`;if(getMark(i,d)===chosenMark)delete monthData().marks[key];else if(chosenMark)monthData().marks[key]=chosenMark;else delete monthData().marks[key];save();render();});cell.append(btn);row.append(cell);}body.append(row);}renderSummary();}
function renderSummary(){
 const body=$('summaryBody');body.replaceChildren();
 const totals={shifts:0,base:0,bonusPay:0,deductions:0,payable:0};
 for(let i=0;i<5;i++){
  const c=calc(i), ds=monthData().deductions;
  const revision=num(ds[`${i}-revision`]);
  const birthday=num(ds[`${i}-birthday`]);
  const deducted=revision+birthday;
  const payable=c.total-deducted;
  totals.shifts+=c.shifts;totals.base+=c.base;totals.bonusPay+=c.bonusPay;
  totals.deductions+=deducted;totals.payable+=payable;
  const tr=element('tr');
  [data.names[i]||DEFAULT_NAMES[i],c.full,c.half,c.off,c.shifts.toLocaleString('ru-RU'),money(c.base),money(c.bonusPay),money(c.total)].forEach(v=>tr.append(element('td',String(v))));
  for(const [kind,value] of [['revision',revision],['birthday',birthday]]){
   const td=element('td'),field=element('input');
   field.type='number';field.min='0';field.step='100';field.inputMode='numeric';field.className='deduction-input';
   field.value=String(value);field.title=kind==='revision'?'Удержание за ревизию':'Удержание на день рождения';
   field.setAttribute('aria-label',`${field.title}: ${data.names[i]||DEFAULT_NAMES[i]}`);
   field.addEventListener('change',()=>{monthData().deductions[`${i}-${kind}`]=num(field.value);save();renderSummary();});
   td.append(field);tr.append(td);
  }
  tr.append(element('td',money(deducted)));tr.append(element('td',money(payable),'payable-cell'));
  body.append(tr);
 }
 $('totalShifts').textContent=totals.shifts.toLocaleString('ru-RU');
 $('totalBase').textContent=money(totals.base);$('totalBonus').textContent=money(totals.bonusPay);
 $('totalDeductions').textContent=money(totals.deductions);$('totalPay').textContent=money(totals.payable);
}
$('month').addEventListener('change',e=>{if(!validMonth(e.target.value))return;month=e.target.value;monthData();save();render();$('replaceDate').value=month+'-15';updateReplacementAmount();renderReplacements();});
for(const id of ['rate','bonus'])$(id).addEventListener('change',e=>{monthData()[id]=num(e.target.value);save();render();});
document.querySelectorAll('.mark-choice').forEach(btn=>btn.addEventListener('click',()=>{chosenMark=btn.dataset.mark;document.querySelectorAll('.mark-choice').forEach(b=>b.classList.toggle('selected',b===btn));}));
$('clearMonth').addEventListener('click',()=>{if(confirm(`Удалить ВСЕ отметки за ${month}? Имена и ставки сохранятся.`)){monthData().marks={};save();render();}});
$('exportBtn').addEventListener('click',()=>{save();const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`grafik-smen-${month}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);});
$('importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const imported=JSON.parse(await file.text());if(!imported||!Array.isArray(imported.names)||!imported.months||typeof imported.months!=='object'||Array.isArray(imported.months))throw Error('Неверный формат');if(!confirm('Заменить текущие данные данными из файла?'))return;data={names:Array.from({length:5},(_,i)=>String(imported.names[i]||DEFAULT_NAMES[i]).slice(0,55)),months:{}};for(const [key,entry] of Object.entries(imported.months)){if(!validMonth(key)||!entry||typeof entry!=='object')continue;const marks={};if(entry.marks&&typeof entry.marks==='object'){for(const [k,v] of Object.entries(entry.marks)){const match=/^([0-4])-(\d{1,2})$/.exec(k);if(match&&Number(match[2])>=1&&Number(match[2])<=31&&['1','0.5','В'].includes(v))marks[k]=v;}}const deductions={};if(entry.deductions&&typeof entry.deductions==='object'){for(const [dk,dv] of Object.entries(entry.deductions)){if(/^[0-4]-(revision|birthday)$/.test(dk))deductions[dk]=num(dv);}}data.months[key]={rate:num(entry.rate),bonus:num(entry.bonus),marks,deductions};}month=validMonth(imported.activeMonth)?imported.activeMonth:currentMonth();data.replacements=Array.isArray(imported.replacements)?imported.replacements.filter(r=>r&&/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(r.date||'')&&Number.isInteger(r.from)&&Number.isInteger(r.to)&&r.from>=0&&r.from<5&&r.to>=0&&r.to<5&&r.from!==r.to).map(r=>({id:String(r.id||Date.now()+Math.random()),date:r.date,from:r.from,to:r.to,fraction:r.fraction===0.5?0.5:1,amount:num(r.amount),paid:Math.min(num(r.paid),num(r.amount)),note:String(r.note||'').slice(0,200)})):[];save();render();renderReplacements();alert('График успешно загружен.');}catch(err){alert('Не удалось открыть файл: неверный формат JSON.');}finally{e.target.value='';}});
monthData();render();renderReplacements();

// Подмены сотрудников и независимый журнал взаиморасчётов.
function dateInMonth(value){return typeof value==='string'&&value.startsWith(month+'-');}
function updateReplacementAmount(){const fraction=Number($('replaceFraction').value);$('replaceAmount').value=Math.round((num(monthData().rate)+num(monthData().bonus))*fraction);}
function refreshReplacementSelects(){for(const id of ['replaceFor','replaceBy']){const field=$(id),prev=field.value;field.replaceChildren();for(let i=0;i<5;i++){const option=element('option',data.names[i]||DEFAULT_NAMES[i]);option.value=String(i);field.append(option);}field.value=prev&&Number(prev)<5?prev:id==='replaceFor'?'0':'1';}}
function renderReplacements(){
 refreshReplacementSelects();const body=$('replacementBody');body.replaceChildren();
 const records=data.replacements.filter(r=>dateInMonth(r.date)).sort((a,b)=>a.date.localeCompare(b.date));
 let total=0,paid=0;
 for(const r of records){const tr=element('tr');const amt=num(r.amount),settled=Math.min(amt,num(r.paid));total+=amt;paid+=settled;
 [r.date.split('-').reverse().join('.'),data.names[r.from]||DEFAULT_NAMES[r.from],data.names[r.to]||DEFAULT_NAMES[r.to],r.fraction===0.5?'0,5':'1',money(amt),money(settled),money(amt-settled),r.note||'—'].forEach(value=>tr.append(element('td',String(value))));
 const actions=element('td');const settle=element('button','Оплатить','small-action');settle.type='button';settle.disabled=amt<=settled;settle.addEventListener('click',()=>{const input=prompt(`Сколько отдали? Остаток ${money(amt-settled)}`,String(amt-settled));if(input===null)return;const value=Number(input.replace(',','.'));if(!Number.isFinite(value)||value<=0||value>amt-settled){alert('Введите сумму больше 0 и не больше остатка.');return;}r.paid=settled+value;save();renderReplacements();});
 const del=element('button','Удалить','small-action danger');del.type='button';del.addEventListener('click',()=>{if(!confirm('Удалить эту запись о подмене и выплатах?'))return;data.replacements=data.replacements.filter(x=>x!==r);save();render();renderReplacements();});actions.append(settle,del);tr.append(actions);body.append(tr);
 }
 if(!records.length){const tr=element('tr'),td=element('td','В этом месяце нет подмен.');td.colSpan=9;tr.append(td);body.append(tr);}
 $('replacementTotal').textContent=money(total);$('replacementPaid').textContent=money(paid);$('replacementDue').textContent=money(total-paid);
}
$('replaceDate').value=month+'-15';refreshReplacementSelects();updateReplacementAmount();
$('replaceFraction').addEventListener('change',updateReplacementAmount);
for(const id of ['rate','bonus'])$(id).addEventListener('change',updateReplacementAmount);
$('replacementForm').addEventListener('submit',event=>{event.preventDefault();const date=$('replaceDate').value,from=Number($('replaceFor').value),to=Number($('replaceBy').value),amount=Number($('replaceAmount').value);if(!dateInMonth(date)){alert('Дата должна относиться к выбранному месяцу графика.');return;}if(from===to){alert('Выберите двух разных сотрудников.');return;}if(!Number.isFinite(amount)||amount<0){alert('Укажите корректную сумму.');return;}const obj={id:String(Date.now())+'-'+Math.random().toString(36).slice(2),date,from,to,fraction:Number($('replaceFraction').value),amount,paid:0,note:$('replaceNote').value.trim().slice(0,200)};data.replacements.push(obj);$('replaceNote').value='';save();render();renderReplacements();});
// Первый запуск: пример подмены. Он не изменяет существующий табель.
if(!data.replacements.length&&!data.replacementDemoInitialized){data.replacementDemoInitialized=true;data.replacements.push({id:'demo-2026-10-15',date:'2026-10-15',from:0,to:1,fraction:1,amount:25200,paid:0,note:'Пример: Ернур вышел вместо меня'});save();}
render();renderReplacements();
