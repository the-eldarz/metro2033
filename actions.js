/* ============================================================
   ACTIONS: постройки, отряды, способности, экономика, армия, арсенал
   ============================================================ */

/* -------- БАЗОВЫЕ ДЕЙСТВИЯ -------- */
function canRecruit(id){
  const s=state.stations[id], r=factionRes(state.player);
  return r.ammo>=10&&r.food>=15&&s.population>=5&&s.garrison<s.maxGarrison;
}
function recruit(){
  const s=state.stations[state.selected], r=factionRes(state.player);
  if(!canRecruit(state.selected)) return;
  r.ammo-=10; r.food-=15; s.garrison+=5;
  s.population=Math.max(0,s.population-5);
  logMsg(state.player,`На «${s.name}» +5 бойцов.`); refresh();
}
function fortify(){
  const s=state.stations[state.selected], r=factionRes(state.player);
  if(r.ammo<25||s.fort>=5) return;
  r.ammo-=25; s.fort+=1;
  logMsg(state.player,`«${s.name}» → ур. ${s.fort}.`); refresh();
}
function moveTroops(){
  const id=state.selected, s=state.stations[id];
  const targets=stationNeighbors(id).filter(n=>state.stations[n].owner===state.player);
  if(!targets.length){ toast('Нет соседних станций'); return; }
  const choices=targets.map(tid=>{
    const t=state.stations[tid];
    return {label:`→ ${t.name} (${t.garrison})`,action:()=>{
      const mv=Math.max(0,s.garrison-3);
      if(mv<=0){ toast('Нечего'); return; }
      s.garrison-=mv; t.garrison+=mv;
      logMsg(state.player,`${mv} бойцов: ${s.name} → ${t.name}.`);
      closeModal(); refresh();
    }};
  });
  choices.push({label:'Отмена',action:closeModal});
  showModal('Переброска',`Из «${s.name}» (${s.garrison}).`,choices);
}

/* -------- СПОСОБНОСТИ ФРАКЦИЙ -------- */
function abilityRed(id){
  const r=factionRes('red'), s=state.stations[id];
  if(r.ammo<20||s.population<4) return;
  r.ammo-=20; s.garrison+=4; s.population-=4;
  logMsg('red',`Мобилизация «${s.name}»: +4.`); refresh();
}
function abilityHansa(){
  const r=factionRes('hansa');
  if(r.influence<10) return;
  r.influence-=10; r.ammo+=50;
  logMsg('hansa',`Караван: +50⚡.`); refresh();
}
function abilityPolis(targetId){
  const r=factionRes('polis'), s=state.stations[targetId];
  if(r.influence<30) return;
  r.influence-=30;
  const chance=0.5-Math.min(0.3,s.garrison*0.02)+(s.population>30?0.1:0);
  if(Math.random()<chance){
    s.owner='polis'; s.garrison=Math.max(5,s.garrison);
    logMsg('polis',`«${s.name}» присоединилась!`,'win');
  } else logMsg('polis',`«${s.name}» отказалась.`);
  refresh();
}
function abilityReichCamp(id){
  const r=factionRes('reich'), s=state.stations[id];
  if(r.ammo<50||r.influence<30||s.buildings.includes('camp')) return;
  r.ammo-=50; r.influence-=30;
  s.buildings.push('camp'); s.population=Math.max(0,s.population-3);
  logMsg('reich',`Концлагерь на «${s.name}».`); refresh();
}
function abilityBandit(id){
  const r=factionRes('bandits'), s=state.stations[id];
  if(s.population<5) return;
  s.population=Math.max(0,s.population-4);
  r.ammo+=25; r.food+=20;
  logMsg('bandits',`Грабёж: +25⚡ +20🍞.`); refresh();
}
function abilityVdnh(){
  const r=factionRes('vdnh');
  if(r.food<30) return;
  r.food-=30; r.ammo+=50;
  logMsg('vdnh',`30🍞→50⚡.`); refresh();
}
function abilityConf(){
  const r=factionRes('conf1905');
  if(r.influence<20) return;
  r.influence-=20; r.food+=30; r.ammo+=30;
  logMsg('conf1905',`20⚖→30🍞+30⚡.`); refresh();
}

/* -------- ПОСТРОЙКИ СТАНЦИЙ -------- */
function renderBuildings(sid){
  const s=state.stations[sid];
  const fid=state.player, res=factionRes(fid);
  let h=`<div class="section-title">Постройки (${s.buildings.length})</div>`;
  s.buildings.forEach(bid=>{
    const b=BUILDINGS[bid]; if(!b) return;
    h+=`<div class="build-card"><div class="bname">✅ ${b.name}</div><div class="bdesc">${b.desc}</div></div>`;
  });
  const available=Object.entries(BUILDINGS).filter(([bid,b])=>{
    if(s.buildings.includes(bid)) return false;
    if(bid==='camp'&&fid!=='reich') return false;
    return true;
  });
  if(available.length){
    h+=`<div class="section-title">Доступные</div>`;
    available.forEach(([bid,b])=>{
      const can=res.food>=b.cost.food&&res.ammo>=b.cost.ammo&&res.influence>=b.cost.influence;
      const cost=[];
      if(b.cost.food) cost.push(b.cost.food+'🍞');
      if(b.cost.ammo) cost.push(b.cost.ammo+'⚡');
      if(b.cost.influence) cost.push(b.cost.influence+'⚖');
      h+=`<div class="build-card"><div class="bname">${b.name}</div>
        <div class="bdesc">${b.desc}</div>
        <div class="bbonus">${cost.join(' ')||'—'}</div>
        <div class="actions"><button class="btn small" onclick="buildStructure('${sid}','${bid}')" ${can?'':'disabled'}>🏗 Построить</button></div>
      </div>`;
    });
  } else h+=`<div style="color:#666;font-size:10px;margin-top:8px">Всё построено.</div>`;
  return h;
}
function buildStructure(sid,bid){
  const s=state.stations[sid], b=BUILDINGS[bid], r=factionRes(state.player);
  if(!b||s.buildings.includes(bid)) return;
  if(bid==='camp'&&state.player!=='reich') return;
  if(r.food<b.cost.food||r.ammo<b.cost.ammo||r.influence<b.cost.influence) return;
  r.food-=b.cost.food; r.ammo-=b.cost.ammo; r.influence-=b.cost.influence;
  s.buildings.push(bid);
  if(bid==='fortifications') s.fort+=b.value;
  if(bid==='barracks') s.maxGarrison+=b.value;
  logMsg(state.player,`🏗 ${b.name} на «${s.name}».`,'win');
  refresh();
}

/* -------- ПОСТРОЙКИ ТОННЕЛЕЙ -------- */
function renderTunnelBuildings(tid){
  const t=state.tunnels[tid];
  const fid=state.player, res=factionRes(fid);
  let h=`<div class="section-title">Военные постройки (${t.buildings.length})</div>`;
  t.buildings.forEach(bid=>{
    const b=TUNNEL_BUILDINGS[bid]; if(!b) return;
    h+=`<div class="build-card"><div class="bname">✅ ${b.name}</div><div class="bdesc">${b.desc}</div></div>`;
  });
  const available=Object.entries(TUNNEL_BUILDINGS).filter(([bid])=>{
    if(t.buildings.includes(bid)) return false;
    if(bid==='gas_trap'&&fid!=='reich') return false;
    return true;
  });
  if(available.length){
    h+=`<div class="section-title">Доступные</div>`;
    available.forEach(([bid,b])=>{
      const can=res.food>=b.cost.food&&res.ammo>=b.cost.ammo;
      const cost=[];
      if(b.cost.food) cost.push(b.cost.food+'🍞');
      if(b.cost.ammo) cost.push(b.cost.ammo+'⚡');
      h+=`<div class="build-card"><div class="bname">${b.name}</div>
        <div class="bdesc">${b.desc}</div>
        <div class="bbonus">${cost.join(' ')||'—'}</div>
        <div class="actions"><button class="btn small" onclick="buildTunnelStructure('${tid}','${bid}')" ${can?'':'disabled'}>🏗 Построить</button></div>
      </div>`;
    });
  } else h+=`<div style="color:#666;font-size:10px;margin-top:8px">Всё построено.</div>`;
  return h;
}
function buildTunnelStructure(tid,bid){
  const t=state.tunnels[tid], b=TUNNEL_BUILDINGS[bid], r=factionRes(state.player);
  if(!b||t.buildings.includes(bid)) return;
  if(bid==='gas_trap'&&state.player!=='reich') return;
  if(r.food<b.cost.food||r.ammo<b.cost.ammo) return;
  r.food-=b.cost.food; r.ammo-=b.cost.ammo;
  t.buildings.push(bid);
  if(bid==='barricade'||bid==='mg_nest') t.fort+=b.value;
  logMsg(state.player,`🏗 ${b.name} в тоннеле.`,'win');
  refresh();
}

/* -------- ОТРЯДЫ НА СТАНЦИИ -------- */
function renderSquads(sid){
  const s=state.stations[sid];
  const mySquads=stationSquads(sid).filter(q=>q.owner===state.player);
  let h=`<div class="section-title">Отряды (${mySquads.length})</div>`;
  if(!mySquads.length) h+=`<div style="color:#666;font-size:10px">Нет отрядов.</div>`;
  mySquads.forEach(q=>{
    const w=WEAPONS[q.weapon];
    h+=`<div class="squad-card">
      <div class="sname">👥 ${q.name} — ${q.size}</div>
      <div class="sstats">🔫 ${w?w.name:'Без оружия'}${w?' (урон '+w.damage+')':''}</div>
      <div class="actions">
        <button class="btn small" onclick="renameSquad('${q.id}')">✏</button>
        <button class="btn small" onclick="equipSquad('${q.id}')">🔫</button>
        <button class="btn small" onclick="moveSquadPrompt('${q.id}')">↔</button>
        <button class="btn small danger" onclick="disbandSquad('${q.id}')">✖</button>
      </div>
    </div>`;
  });
  h+=`<div class="section-title">Создать</div><div class="actions">
    <button class="btn" onclick="createSquadPrompt('${sid}')" ${s.garrison<5?'disabled':''}>➕ Отряд (5👥)</button>
  </div>
  <div class="section-title">Снаряжение гарнизона</div><div class="actions">
    <button class="btn" onclick="equipGarrisonPrompt('${sid}')">🔫 ${s.garrisonWeapon?WEAPONS[s.garrisonWeapon].name:'Без оружия'}</button>
  </div>`;
  return h;
}

/* -------- ДЕЙСТВИЯ СТАНЦИИ -------- */
function renderStationActions(id){
  const s=state.stations[id];
  let h=`<div class="section-title">Действия</div><div class="actions">
    <button class="btn" onclick="recruit()" ${canRecruit(id)?'':'disabled'}>👥 Рекрут (−10⚡ −15🍞)</button>
    <button class="btn" onclick="fortify()" ${s.fort>=5||factionRes(state.player).ammo<25?'disabled':''}>🛡 Укрепить (−25⚡)</button>
    <button class="btn" onclick="moveTroops()" ${s.garrison<=3?'disabled':''}>↔ Переброс</button>
  </div>`;
  h+=renderFactionActions(id);
  return h;
}

/* -------- ДИПЛОМАТИЯ (компакт на станции) -------- */
function renderFactionDiplomacy(fid){
  const rel=getRelation(state.player,fid);
  const betrayed=getBetrayed(state.player,fid);
  const eternal=isEternalWar(state.player,fid);
  if(!isFactionAlive(fid)) return '';
  let h=`<div class="section-title">Дипломатия</div><div class="actions">`;
  if(eternal){
    h+=`<span style="color:#ff8a80;font-size:10px">Вечная война.</span>`;
  } else {
    if(rel!=='war') h+=`<button class="btn warn" onclick="diploAction('${fid}','war')">📜 Война</button>`;
    if(rel==='war'){
      if(betrayed) h+=`<button class="btn" disabled>🕊 Мир (невозможен)</button>`;
      else h+=`<button class="btn diplo" onclick="diploAction('${fid}','peace')">🕊 Мир</button>`;
    }
    if(rel==='peace') h+=`<button class="btn diplo" onclick="diploAction('${fid}','trade')">💰 Торг</button>`;
    if(rel==='trade') h+=`<button class="btn diplo" onclick="diploAction('${fid}','defensive')">🛡 Оборона</button>`;
  }
  h+=`</div>`;
  return h;
}

function renderFactionActions(id){
  const fid=state.player, f=FACTIONS[fid];
  let h=`<div class="section-title">${f.abilityName}</div><div class="actions">`;
  if(fid==='red'){
    h+=`<button class="btn" onclick="abilityRed('${id}')" ${factionRes('red').ammo<20||state.stations[id].population<4?'disabled':''}>📣 Мобилизация</button>`;
  } else if(fid==='hansa'){
    h+=`<button class="btn" onclick="abilityHansa()" ${factionRes('hansa').influence<10?'disabled':''}>🐪 Караван (−10⚖)</button>`;
  } else if(fid==='polis'){
    const neut=stationNeighbors(id).filter(n=>state.stations[n].owner==='neutral'&&!state.stations[n].mutantNest);
    if(neut.length){
      h+=neut.map(n=>`<button class="btn" onclick="abilityPolis('${n}')" ${factionRes('polis').influence<30?'disabled':''}>🕊 ${state.stations[n].name}</button>`).join('');
    } else h+=`<span style="color:#666;font-size:10px">Нет нейтралов рядом</span>`;
  } else if(fid==='reich'){
    h+=`<button class="btn" onclick="abilityReichCamp('${id}')" ${factionRes('reich').ammo<50||factionRes('reich').influence<30||state.stations[id].buildings.includes('camp')?'disabled':''}>☠ Концлагерь</button>`;
  } else if(fid==='bandits'){
    h+=`<button class="btn" onclick="abilityBandit('${id}')" ${state.stations[id].population<5?'disabled':''}>💰 Грабёж</button>`;
  } else if(fid==='vdnh'){
    h+=`<button class="btn" onclick="abilityVdnh()" ${factionRes('vdnh').food<30?'disabled':''}>🏪 30🍞→50⚡</button>`;
  } else if(fid==='conf1905'){
    h+=`<button class="btn" onclick="abilityConf()" ${factionRes('conf1905').influence<20?'disabled':''}>⚖ 20⚖→30/30</button>`;
  }
  h+=`</div>`;
  return h;
}

function renderFactionEnemyActions(enemyId){
  const fid=state.player;
  if(fid!=='reich') return '';
  const r=factionRes('reich');
  let h=`<div class="section-title" style="color:#ff8a80">Карательные акции</div><div class="actions">`;
  h+=`<button class="btn danger" onclick="reichGas('${enemyId}')" ${r.ammo<40||r.influence<25?'disabled':''}>☣ Газ. камера</button>`;
  h+=`<button class="btn danger" onclick="reichHang('${enemyId}')" ${r.ammo<25||r.influence<15?'disabled':''}>🪢 Повешение</button>`;
  h+=`<button class="btn danger" onclick="reichTorture('${enemyId}')" ${r.ammo<15?'disabled':''}>🔪 Пытки</button>`;
  h+=`<button class="btn danger" onclick="reichShoot('${enemyId}')" ${r.ammo<30?'disabled':''}>🔫 Расстрел</button>`;
  h+=`</div>`;
  return h;
}

/* ============================================================
   ОТРЯДЫ — действия
   ============================================================ */
let squadCounter=0;
function createSquadPrompt(sid){
  const s=state.stations[sid];
  if(s.garrison<5){ toast('Мало бойцов'); return; }
  const body=`Создать отряд из 5 бойцов?<br><br>
    <input type="text" id="sq-name" placeholder="Название" value="Отряд ${++squadCounter}"
      style="width:100%;padding:6px;background:#1a1a1a;border:1px solid #333;color:#fff;font-size:12px">`;
  showModal('Новый отряд',body,[
    {label:'✅ Создать',action:()=>{
      const name=document.getElementById('sq-name').value||('Отряд '+squadCounter);
      s.garrison-=5;
      state.squads.push({id:'sq'+(++squadCounter),name,size:5,weapon:null,stationId:sid,owner:state.player});
      logMsg(state.player,`👥 Отряд «${name}» на «${s.name}».`);
      closeModal(); refresh();
    }},
    {label:'Отмена',action:closeModal}
  ]);
}
function renameSquad(qid){
  const q=state.squads.find(x=>x.id===qid); if(!q) return;
  const body=`<input type="text" id="sq-rename" value="${q.name}"
    style="width:100%;padding:6px;background:#1a1a1a;border:1px solid #333;color:#fff;font-size:12px">`;
  showModal('Переименовать',body,[
    {label:'✅',action:()=>{
      q.name=document.getElementById('sq-rename').value||q.name;
      closeModal(); refresh();
    }},
    {label:'Отмена',action:closeModal}
  ]);
}
function equipSquad(qid){
  const q=state.squads.find(x=>x.id===qid); if(!q) return;
  const available=Object.entries(state.weaponStock).filter(([wid,n])=>n>0);
  if(!available.length){
    showModal('Оружие','Склад пуст.',[{label:'Ок',action:closeModal}]); return;
  }
  const choices=available.map(([wid,n])=>{
    const w=WEAPONS[wid];
    return {label:`${w.name} (${n}) — ${w.damage} урона`,action:()=>{
      if(q.weapon) state.weaponStock[q.weapon]=(state.weaponStock[q.weapon]||0)+1;
      q.weapon=wid; state.weaponStock[wid]--;
      if(state.weaponStock[wid]<=0) delete state.weaponStock[wid];
      logMsg(state.player,`🔫 «${q.name}» → ${w.name}.`);
      closeModal(); refresh();
    }};
  });
  choices.push({label:'Снять оружие',action:()=>{
    if(q.weapon) state.weaponStock[q.weapon]=(state.weaponStock[q.weapon]||0)+1;
    q.weapon=null; closeModal(); refresh();
  }});
  choices.push({label:'Отмена',action:closeModal});
  showModal('Выбор оружия',`Текущее: ${q.weapon?WEAPONS[q.weapon].name:'нет'}`,choices);
}
function equipGarrisonPrompt(sid){
  const s=state.stations[sid];
  const available=Object.entries(state.weaponStock).filter(([wid,n])=>n>0);
  if(!available.length){
    showModal('Оружие гарнизона','Склад пуст.',[{label:'Ок',action:closeModal}]); return;
  }
  const choices=available.map(([wid,n])=>{
    const w=WEAPONS[wid];
    return {label:`${w.name} (${n}) — ${w.damage} урона`,action:()=>{
      if(s.garrisonWeapon) state.weaponStock[s.garrisonWeapon]=(state.weaponStock[s.garrisonWeapon]||0)+1;
      s.garrisonWeapon=wid; state.weaponStock[wid]--;
      if(state.weaponStock[wid]<=0) delete state.weaponStock[wid];
      logMsg(state.player,`🔫 Гарнизон «${s.name}» → ${w.name}.`);
      closeModal(); refresh();
    }};
  });
  choices.push({label:'Снять оружие',action:()=>{
    if(s.garrisonWeapon) state.weaponStock[s.garrisonWeapon]=(state.weaponStock[s.garrisonWeapon]||0)+1;
    s.garrisonWeapon=null; closeModal(); refresh();
  }});
  choices.push({label:'Отмена',action:closeModal});
  showModal('Оружие гарнизона',`Текущее: ${s.garrisonWeapon?WEAPONS[s.garrisonWeapon].name:'нет'}`,choices);
}
function moveSquadPrompt(qid){
  const q=state.squads.find(x=>x.id===qid); if(!q) return;
  const targets=stationNeighbors(q.stationId).filter(n=>state.stations[n].owner===state.player);
  if(!targets.length){ toast('Нет соседних станций'); return; }
  const choices=targets.map(tid=>({label:`→ ${state.stations[tid].name}`,action:()=>{
    q.stationId=tid;
    logMsg(state.player,`Отряд «${q.name}» → «${state.stations[tid].name}».`);
    closeModal(); refresh();
  }}));
  choices.push({label:'Отмена',action:closeModal});
  showModal('Переброска отряда',`Куда «${q.name}»?`,choices);
}
function disbandSquad(qid){
  const q=state.squads.find(x=>x.id===qid); if(!q) return;
  state.stations[q.stationId].garrison+=q.size;
  if(q.weapon) state.weaponStock[q.weapon]=(state.weaponStock[q.weapon]||0)+1;
  state.squads=state.squads.filter(x=>x.id!==qid);
  logMsg(state.player,`Отряд «${q.name}» расформирован.`);
  refresh();
}

/* ============================================================
   ЭКОНОМИКА — сводка по всем постройкам
   ============================================================ */
function showEconomy(){
  let html=`<div style="font-size:11px;color:#888;margin-bottom:10px">
    Все постройки, доступные вашей фракции. Нажми на постройку чтобы увидеть станции.</div>`;

  Object.entries(BUILDINGS).forEach(([bid,b])=>{
    if(bid==='camp'&&state.player!=='reich') return;
    const built=Object.values(state.stations).filter(s=>s.owner===state.player&&s.buildings.includes(bid));
    const canBuild=Object.values(state.stations).filter(s=>s.owner===state.player&&!s.buildings.includes(bid));
    const cost=[];
    if(b.cost.food) cost.push(b.cost.food+'🍞');
    if(b.cost.ammo) cost.push(b.cost.ammo+'⚡');
    if(b.cost.influence) cost.push(b.cost.influence+'⚖');
    html+=`<div class="build-card" onclick="economyDetail('${bid}')" style="cursor:pointer">
      <div class="bname">${b.name}</div>
      <div class="bdesc">${b.desc}</div>
      <div class="bbonus">Стоимость: ${cost.join(' ')||'—'}</div>
      <div style="font-size:10px;color:#888;margin-top:4px">
        Построено: <b style="color:#69f0ae">${built.length}</b> ·
        Доступно: <b style="color:#ffd54f">${canBuild.length}</b>
      </div>
    </div>`;
  });

  /* Тоннельные постройки */
  html+=`<div class="section-title">Военные постройки тоннелей</div>`;
  Object.entries(TUNNEL_BUILDINGS).forEach(([bid,b])=>{
    if(bid==='gas_trap'&&state.player!=='reich') return;
    const built=Object.values(state.tunnels).filter(t=>t.owner===state.player&&t.buildings.includes(bid));
    const canBuild=Object.values(state.tunnels).filter(t=>t.owner===state.player&&!t.buildings.includes(bid));
    const cost=[];
    if(b.cost.food) cost.push(b.cost.food+'🍞');
    if(b.cost.ammo) cost.push(b.cost.ammo+'⚡');
    html+=`<div class="build-card" onclick="economyDetailTunnel('${bid}')" style="cursor:pointer">
      <div class="bname">${b.name}</div>
      <div class="bdesc">${b.desc}</div>
      <div class="bbonus">Стоимость: ${cost.join(' ')||'—'}</div>
      <div style="font-size:10px;color:#888;margin-top:4px">
        Построено: <b style="color:#69f0ae">${built.length}</b> ·
        Доступно: <b style="color:#ffd54f">${canBuild.length}</b>
      </div>
    </div>`;
  });

  showModal('🏗 Экономика',html,[{label:'Закрыть',action:closeModal}]);
}

function economyDetail(bid){
  const b=BUILDINGS[bid];
  if(!b) return;
  const myStations=Object.values(state.stations).filter(s=>s.owner===state.player);
  const res=factionRes(state.player);
  const can=res.food>=b.cost.food&&res.ammo>=b.cost.ammo&&res.influence>=b.cost.influence;

  let html=`<div style="font-size:11px;color:#888;margin-bottom:10px">${b.desc}</div>`;
  myStations.forEach(s=>{
    const has=s.buildings.includes(bid);
    html+=`<div class="build-card">
      <div class="bname" style="${has?'color:#69f0ae':''}">${has?'✅':'⬜'} ${s.name}</div>
      ${!has?`<div class="actions">
        <button class="btn small" onclick="quickBuild('${s.id}','${bid}')" ${can?'':'disabled'}>🏗 Построить</button>
      </div>`:''}
    </div>`;
  });
  showModal(`🏗 ${b.name}`,html,[{label:'← Назад',action:()=>{closeModal();showEconomy();}},{label:'Закрыть',action:closeModal}]);
}

function economyDetailTunnel(bid){
  const b=TUNNEL_BUILDINGS[bid];
  if(!b) return;
  const myTunnels=Object.values(state.tunnels).filter(t=>t.owner===state.player&&!t.mutantNest);
  const res=factionRes(state.player);
  const can=res.food>=b.cost.food&&res.ammo>=b.cost.ammo;

  let html=`<div style="font-size:11px;color:#888;margin-bottom:10px">${b.desc}</div>`;
  if(!myTunnels.length){ html+=`<div style="color:#666;font-size:11px">Нет своих тоннелей.</div>`; }
  myTunnels.forEach(t=>{
    const has=t.buildings.includes(bid);
    const name=`${state.stations[t.from].name} ↔ ${state.stations[t.to].name} (сег. ${t.seg})`;
    html+=`<div class="build-card">
      <div class="bname" style="${has?'color:#69f0ae':''}">${has?'✅':'⬜'} ${name}</div>
      ${!has?`<div class="actions">
        <button class="btn small" onclick="quickBuildTunnel('${t.id}','${bid}')" ${can?'':'disabled'}>🏗 Построить</button>
      </div>`:''}
    </div>`;
  });
  showModal(`🏗 ${b.name}`,html,[{label:'← Назад',action:()=>{closeModal();showEconomy();}},{label:'Закрыть',action:closeModal}]);
}

function quickBuild(sid,bid){
  buildStructure(sid,bid);
  closeModal();
  showEconomy();
}
function quickBuildTunnel(tid,bid){
  buildTunnelStructure(tid,bid);
  closeModal();
  showEconomy();
}

/* ============================================================
   АРМИЯ — все отряды (включая гарнизоны)
   ============================================================ */
function showArmy(){
  const myStations=ownedStations(state.player);
  const mySquads=state.squads.filter(q=>q.owner===state.player);

  let totalGarrison=0;
  myStations.forEach(s=>totalGarrison+=s.garrison);
  let totalSquad=0;
  mySquads.forEach(q=>totalSquad+=q.size);

  let html=`<div style="font-size:11px;color:#888;margin-bottom:10px">
    Гарнизоны: <b style="color:#fff">${totalGarrison}</b> чел. ·
    Отряды: <b style="color:#fff">${totalSquad}</b> чел. (${mySquads.length} шт.)
  </div>`;

  /* Гарнизоны станций */
  html+=`<div class="section-title">Гарнизоны станций (${myStations.length})</div>`;
  if(!myStations.length) html+=`<div style="color:#666;font-size:10px">Нет станций.</div>`;
  myStations.forEach(s=>{
    const w=s.garrisonWeapon?WEAPONS[s.garrisonWeapon]:null;
    html+=`<div class="squad-card">
      <div class="sname">🏛 ${s.name} — ${s.garrison} чел.</div>
      <div class="sstats">🔫 ${w?w.name:'Без оружия'}${w?' (урон '+w.damage+')':''} · 🛡 Укрепления: ${s.fort}</div>
      <div class="actions">
        <button class="btn small" onclick="closeModal();openPanelForStation('${s.id}')">📋 Открыть</button>
        <button class="btn small" onclick="equipGarrisonPrompt('${s.id}')">🔫 Оружие</button>
      </div>
    </div>`;
  });

  /* Мобильные отряды */
  html+=`<div class="section-title">Мобильные отряды (${mySquads.length})</div>`;
  if(!mySquads.length) html+=`<div style="color:#666;font-size:10px">Нет мобильных отрядов.</div>`;
  mySquads.forEach(q=>{
    const w=WEAPONS[q.weapon];
    const loc=state.stations[q.stationId];
    html+=`<div class="squad-card">
      <div class="sname">👥 ${q.name} — ${q.size} чел.</div>
      <div class="sstats">📍 ${loc?loc.name:'?'} · 🔫 ${w?w.name:'Без оружия'}</div>
      <div class="actions">
        <button class="btn small" onclick="renameSquad('${q.id}')">✏</button>
        <button class="btn small" onclick="equipSquad('${q.id}')">🔫</button>
        <button class="btn small" onclick="moveSquadPrompt('${q.id}')">↔</button>
        <button class="btn small danger" onclick="disbandSquad('${q.id}')">✖</button>
      </div>
    </div>`;
  });

  /* Создание отряда */
  html+=`<div class="section-title">Создать отряд</div>`;
  html+=`<div style="font-size:10px;color:#888;margin-bottom:6px">Отряд берёт 5 бойцов из гарнизона станции.</div>`;
  myStations.forEach(s=>{
    html+=`<div class="actions">
      <button class="btn small" onclick="createSquadPrompt('${s.id}')" ${s.garrison<5?'disabled':''}>
        ➕ ${s.name} (${s.garrison}👥)
      </button>
    </div>`;
  });

  showModal('👥 Армия',html,[{label:'Закрыть',action:closeModal}]);
}
function openPanelForStation(sid){
  closeModal();
  selectStation(sid);
}

/* ============================================================
   АРСЕНАЛ
   ============================================================ */
function showArmory(){
  let html=`<div style="font-size:11px;color:#888;margin-bottom:10px">Оружие на складе.</div>`;
  const entries=Object.entries(state.weaponStock).filter(([w,n])=>n>0);
  if(!entries.length) html+=`<div style="color:#666;font-size:11px">Склад пуст.</div>`;
  else entries.forEach(([wid,n])=>{
    const w=WEAPONS[wid];
    html+=`<div class="weapon-card">
      <div class="wname">🔫 ${w.name} — ${n} шт.</div>
      <div class="wstats">Урон: ${w.damage} · Точность: ${w.accuracy}% · Дальность: ${w.range}</div>
      <div class="wdesc">${w.desc}</div>
    </div>`;
  });
  const hasWorkshop=Object.values(state.stations).some(s=>s.owner===state.player&&s.buildings.includes('ammo_workshop'));
  if(hasWorkshop){
    html+=`<div class="section-title">Производство</div>`;
    const produce=[
      {wid:'bastard',cost:40},{wid:'ak74',cost:70},{wid:'vsv',cost:110},
      {wid:'uboinik',cost:90},{wid:'duplet',cost:35},{wid:'ashot',cost:100},
      {wid:'kalash2012',cost:130},{wid:'bulldog',cost:150},{wid:'valve',cost:200}
    ];
    produce.forEach(p=>{
      const w=WEAPONS[p.wid];
      const can=factionRes(state.player).ammo>=p.cost;
      html+=`<div class="weapon-card">
        <div class="wname">${w.name}</div>
        <div class="wstats">Урон ${w.damage} · Точность ${w.accuracy}%</div>
        <div class="actions"><button class="btn small" onclick="produceWeapon('${p.wid}',${p.cost})" ${can?'':'disabled'}>🔨 ${p.cost}⚡</button></div>
      </div>`;
    });
  } else {
    html+=`<div style="color:#666;font-size:10px;margin-top:8px">Для производства нужна оружейная мастерская на станции.</div>`;
  }
  showModal('🔫 Арсенал',html,[{label:'Закрыть',action:closeModal}]);
}
function produceWeapon(wid,cost){
  const r=factionRes(state.player);
  if(r.ammo<cost) return;
  r.ammo-=cost;
  state.weaponStock[wid]=(state.weaponStock[wid]||0)+1;
  logMsg(state.player,`🔨 Произведено: ${WEAPONS[wid].name}.`);
  closeModal(); showArmory(); refresh();
}

/* ============================================================
   ТОННЕЛИ — действия/захват
   ============================================================ */
function renderTunnelActions(tid){
  const t=state.tunnels[tid];
  let h=`<div class="section-title">Действия</div><div class="actions">
    <button class="btn" onclick="tunnelReinforce('${tid}')">👥 Усилить</button>
    <button class="btn" onclick="tunnelWithdraw('${tid}')" ${t.garrison<=1?'disabled':''}>↩ Вывести</button>
  </div>`;
  return h;
}
function tunnelReinforce(tid){
  const t=state.tunnels[tid];
  const fromS=state.stations[t.from], toS=state.stations[t.to];
  const sources=[];
  if(fromS.owner===state.player) sources.push({id:t.from,name:fromS.name,garrison:fromS.garrison});
  if(toS.owner===state.player) sources.push({id:t.to,name:toS.name,garrison:toS.garrison});
  if(!sources.length){ toast('Нет источников'); return; }
  const choices=sources.map(s=>({label:`Из ${s.name} (${s.garrison})`,action:()=>{
    const mv=Math.max(0,s.garrison-3);
    if(mv<=0){ toast('Нечего'); return; }
    state.stations[s.id].garrison-=mv; t.garrison+=mv;
    logMsg(state.player,`+${mv} в тоннель.`);
    closeModal(); refresh();
  }}));
  choices.push({label:'Отмена',action:closeModal});
  showModal('Усиление','Откуда?',choices);
}
function tunnelWithdraw(tid){
  const t=state.tunnels[tid];
  const fromS=state.stations[t.from], toS=state.stations[t.to];
  const targets=[];
  if(fromS.owner===state.player) targets.push({id:t.from,name:fromS.name});
  if(toS.owner===state.player) targets.push({id:t.to,name:toS.name});
  if(!targets.length){ toast('Нет станций рядом'); return; }
  const choices=targets.map(s=>({label:`→ ${s.name}`,action:()=>{
    const mv=Math.max(0,t.garrison);
    state.stations[s.id].garrison+=mv; t.garrison=0;
    logMsg(state.player,`${mv} выведено.`);
    closeModal(); refresh();
  }}));
  choices.push({label:'Отмена',action:closeModal});
  showModal('Вывод','Куда?',choices);
}
function canCaptureTunnel(tid,fid){
  const t=state.tunnels[tid];
  if(state.stations[t.from].owner===fid||state.stations[t.to].owner===fid) return true;
  const adjT=Object.values(state.tunnels).some(o=>{
    if(o.owner!==fid||o.id===t.id) return false;
    return (o.from===t.from&&o.to===t.to)||(o.from===t.to&&o.to===t.from);
  });
  return adjT;
}
function captureTunnelPrompt(tid){
  const t=state.tunnels[tid];
  const fromS=state.stations[t.from], toS=state.stations[t.to];
  const sources=[];
  if(fromS.owner===state.player) sources.push({type:'station',id:t.from,garrison:fromS.garrison,name:fromS.name});
  if(toS.owner===state.player) sources.push({type:'station',id:t.to,garrison:toS.garrison,name:toS.name});
  const adjT=Object.values(state.tunnels).find(o=>o.owner===state.player&&
    ((o.from===t.from&&o.to===t.to)||(o.from===t.to&&o.to===t.from)));
  if(adjT) sources.push({type:'tunnel',id:adjT.id,garrison:adjT.garrison,name:'Соседний сегмент'});

  if(!sources.length){ toast('Нет источников'); return; }
  const choices=sources.map(s=>{
    const max=Math.max(1,s.garrison-1);
    const def=Math.max(3,t.garrison);
    return {label:`Из ${s.name} (${s.garrison}👥)`,action:()=>{
      const def2=Math.max(1,Math.min(max,def+2));
      const body=`<div>Захватить тоннель? Понадобится ~${def} бойцов.</div>
        <input type="range" id="tun-range" min="1" max="${max}" value="${def2}"
          oninput="document.getElementById('tun-num').textContent=this.value">
        <div style="text-align:center;font-size:18px"><b id="tun-num">${def2}</b> 👥</div>`;
      showModal('Захват тоннеля',body,[
        {label:'🏴 Захватить',action:()=>{
          const n=parseInt(document.getElementById('tun-range').value,10);
          closeModal();
          doCaptureTunnel(tid,s,n);
        }},
        {label:'Отмена',action:closeModal}
      ]);
    }};
  });
  choices.push({label:'Отмена',action:closeModal});
  showModal('Источник войск','Откуда?',choices);
}
function doCaptureTunnel(tid,source,n){
  const t=state.tunnels[tid];
  let srcGar;
  if(source.type==='station') srcGar=state.stations[source.id];
  else srcGar=state.tunnels[source.id];
  if(srcGar.garrison<n){ toast('Мало бойцов'); return; }
  const power=n*(0.85+Math.random()*0.3);
  const def=t.garrison*1.5;
  srcGar.garrison-=n;
  if(power>def){
    const surv=Math.max(1,Math.round(n*(1-def/power)*0.7));
    const lost=n-surv;
    t.owner=state.player; t.garrison=surv;
    logMsg(state.player,`🏴 Тоннель захвачен. −${lost}, гарнизон ${surv}.`,'win');
    state.selected=tid; state.selectedType='tunnel';
  } else {
    logMsg(state.player,`⚔ Штурм провален. −${Math.round(n*0.7)}.`,'battle');
  }
  refresh();
}