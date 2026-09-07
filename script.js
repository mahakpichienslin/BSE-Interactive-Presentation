const state = {
  power: false,
  starting: false,
  mode: 'PHOTO',
  function: 'LAMP BY LAMP',
  flashRate: 20,
  lux: 150,
  output: false,
  faults: {1:false,2:false,3:false},
  lastPhotoOutput: false
};

const el = id => document.getElementById(id);
const refs = {
  badge: el('systemBadge'), power: el('powerState'), mode: el('modeState'), fn: el('functionState'), flash: el('flashState'),
  lux: el('luxSlider'), luxValue: el('luxValue'), logic: el('photoLogic'), breakerBtn: el('breakerBtn'),
  msg: el('messageBox'), msgTitle: el('messageTitle'), msgText: el('messageText'), title: el('componentTitle'), desc: el('componentDescription'), tag: el('componentTag')
};

const componentInfo = {
  powerLed:['POWER LED','ไฟแสดงว่าตู้ได้รับไฟเลี้ยงและเปิดใช้งาน','INDICATOR'],
  photoLed:['PHOTO ON LED','แสดงสถานะ Photo Cell: ติดเมื่อ Photo Cell ไม่ได้รับแสง / สภาพมืด','PHOTO CELL'],
  modeLed:['PHOTO / MANUAL LED','เขียว = PHOTO MODE · แดง = MANUAL MODE · ช่วงตั้งค่าใช้สถานะ Mode Setting','MODE'],
  lamp1:['LAMP 1 ON / FAIL','เขียว = Line 1 ทำงานปกติ · แดง = Lamp/Load ผิดปกติ','ALARM LED'],
  lamp2:['LAMP 2 ON / FAIL','เขียว = Line 2 ทำงานปกติ · แดง = Lamp/Load ผิดปกติ','ALARM LED'],
  lamp3:['LAMP 3 ON / FAIL','เขียว = Line 3 ทำงานปกติ · แดง = Lamp/Load ผิดปกติ','ALARM LED']
};
const actionInfo = {
  breaker:['Main Breaker','ควบคุมการเปิด–ปิดไฟเข้า Control Box','POWER'],
  mode:['SET MODE','ใช้เลือก PHOTO MODE หรือ MANUAL MODE','CONTROL'],
  function:['SET FUNCTION','เลือกโหมดการทำงาน Lamp by Lamp / Spare','CONTROL'],
  flash:['SET SPEED FLASH','ปรับอัตราการกระพริบในช่วง 10–60 ครั้ง/นาที','CONTROL']
};

function selectInfo(key, type='component'){
  const item = type==='component' ? componentInfo[key] : actionInfo[key];
  if(!item) return;
  refs.title.textContent=item[0]; refs.desc.textContent=item[1]; refs.tag.textContent=item[2];
}

function calculateOutput(){
  if(!state.power || state.starting){ state.output=false; return; }
  if(state.mode==='MANUAL'){ state.output=true; return; }
  if(state.lux < 31.5) state.lastPhotoOutput=true;
  else if(state.lux > 125) state.lastPhotoOutput=false;
  state.output=state.lastPhotoOutput;
}

function setMessage(kind,title,text){ refs.msg.className='message-box '+kind; refs.msgTitle.textContent=title; refs.msgText.textContent=text; }

function render(){
  calculateOutput();
  refs.power.textContent=state.power ? (state.starting?'INITIALIZING':'ON') : 'OFF';
  refs.mode.textContent=state.mode; refs.fn.textContent=state.function; refs.flash.textContent=`${state.flashRate} FPM`;
  refs.luxValue.textContent=`${state.lux} Lux`;
  refs.breakerBtn.textContent=state.power?'TURN BREAKER OFF':'TURN BREAKER ON';
  refs.badge.className='system-badge '+(state.power&&!state.starting?'online':'offline');
  refs.badge.querySelector('b').textContent=state.power?(state.starting?'INITIALIZING':'SYSTEM ON'):'SYSTEM OFF';
  const photoDark = state.lux < 31.5;
  const photoLight = state.lux > 125;
  const zone = photoDark?'DARK':photoLight?'LIGHT':'HYSTERESIS ZONE';
  refs.logic.textContent=`Photo Cell: ${zone} — Output ${state.output?'ON':'OFF'}${state.mode==='MANUAL'?' (Manual command)':''}`;

  document.querySelectorAll('.lamp-channel').forEach(btn=>{
    const n=btn.dataset.lamp; btn.classList.remove('on','failed');
    const small=btn.querySelector('small');
    if(state.power && state.output && state.faults[n]){ btn.classList.add('failed'); small.textContent='FAIL'; }
    else if(state.power && state.output){ btn.classList.add('on'); small.textContent='ON'; }
    else small.textContent='OFF';
  });

  const activeFaults=Object.keys(state.faults).filter(n=>state.faults[n] && state.power && state.output);
  if(activeFaults.length){ setMessage('alarm','ACTIVE ALARM',`Lamp ${activeFaults.join(', ')} load failure detected · Alarm Contact active.`); }
  else if(state.power && !state.starting){ setMessage('neutral','System normal',`${state.mode} MODE · Output ${state.output?'ON':'OFF'} · No active load alarm.`); }
  else if(!state.power){ setMessage('neutral','System is off','Turn the breaker ON to start the control box.'); }
}

function startSystem(){
  state.power=true; state.starting=true; render();
  const overlay=document.createElement('div'); overlay.className='boot-overlay'; overlay.innerHTML=`<div class="boot-card"><p class="eyebrow">BSCB-004AL-V3</p><h2>INITIAL SYSTEM CHECK</h2><p>ระบบกำลังตรวจสอบอุปกรณ์เบื้องต้นก่อนเข้าสู่โหมดปกติ</p><div class="boot-bar"><div class="boot-progress"></div></div><div class="boot-time">10 sec</div></div>`; document.body.appendChild(overlay);
  const progress=overlay.querySelector('.boot-progress'), time=overlay.querySelector('.boot-time');
  requestAnimationFrame(()=>progress.style.width='100%'); let remaining=10; const timer=setInterval(()=>{remaining--; time.textContent=`${remaining} sec`; if(remaining<=0){clearInterval(timer); state.starting=false; overlay.remove(); render();}},1000);
}

refs.breakerBtn.addEventListener('click',()=>{ if(state.power){state.power=false;state.starting=false;render()} else startSystem(); selectInfo('breaker','action'); });
refs.lux.addEventListener('input',e=>{state.lux=Number(e.target.value);render();});
el('nightBtn').addEventListener('click',()=>{state.lux=10;refs.lux.value=10;render();});
el('clearBtn').addEventListener('click',()=>{state.faults={1:false,2:false,3:false};render();});

document.querySelectorAll('.hotspot[data-component]').forEach(btn=>btn.addEventListener('click',()=>selectInfo(btn.dataset.component)));
document.querySelectorAll('.hotspot[data-action]').forEach(btn=>btn.addEventListener('click',()=>{
  const a=btn.dataset.action; selectInfo(a,'action');
  if(a==='breaker'){ refs.breakerBtn.click(); }
  if(!state.power || state.starting) return;
  if(a==='mode'){ state.mode=state.mode==='PHOTO'?'MANUAL':'PHOTO'; render(); }
  if(a==='function'){ state.function=state.function==='LAMP BY LAMP'?'SPARE':'LAMP BY LAMP'; render(); }
  if(a==='flash'){ state.flashRate+=10; if(state.flashRate>60) state.flashRate=10; render(); }
}));

document.querySelectorAll('.lamp-channel').forEach(btn=>btn.addEventListener('click',()=>{
  const n=btn.dataset.lamp; state.faults[n]=!state.faults[n]; selectInfo('lamp'+n); render();
}));

document.querySelectorAll('.scenario-card').forEach(card=>card.addEventListener('click',()=>{
  const s=card.dataset.scenario; document.getElementById('cabinet').scrollIntoView({behavior:'smooth'});
  if(s==='photo'){state.mode='PHOTO';state.lux=150;refs.lux.value=150;render();setMessage('warning','PHOTO MODE exercise','Move the Ambient Light slider below 31.5 Lux, then above 125 Lux. Observe Output status.');}
  if(s==='manual'){state.mode='MANUAL';render();setMessage('warning','MANUAL MODE exercise','Manual mode commands the obstruction-light output ON immediately while the system is powered.');}
  if(s==='failure'){if(!state.power){setMessage('warning','Lamp failure exercise','Turn the breaker ON first. Then switch output ON and click LAMP 1–3 to simulate a missing load.');}else{state.mode='MANUAL';state.faults[1]=true;render();}}
  if(s==='startup'){ if(state.power){state.power=false;render();} setTimeout(()=>refs.breakerBtn.click(),350); }
}));

document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');document.getElementById(tab.dataset.scroll).scrollIntoView({behavior:'smooth'});}));
render();
