/* ============================================================
   ACTIONS: постройки, отряды, способности, экономика, армия, арсенал, бестиарий, шпионаж
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
  const available=Object.entries(BUILDINGS).filter(([bid])=>{
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

/* ============================================================
   ОТРЯДЫ НА СТАНЦИИ — новая система
   ============================================================ */

/* Создание отряда — max 5 отрядов на станции, 5 человек в отряде */
function createSquadPrompt(sid){
  const s = state.stations[sid];
  const existing = stationSquads(sid).filter(q => q.owner === state.player);
  if(existing.length >= 5){ toast('Максимум 5 отрядов на станции'); return; }
  if(s.garrison < 5){ toast('Мало бойцов'); return; }

  const body = `Создать отряд из 5 бойцов?<br><br>
    <input type="text" id="sq-name" placeholder="Название" value="Отряд ${++squadCounter}"
      style="width:100%;padding:6px;background:#1a1a1a;border:1px solid #333;color:#fff;font-size:12px">
    <div style="font-size:11px;color:#888;margin-top:6px">Отрядов на станции: ${existing.length}/5</div>`;

  showModal('Новый отряд', body, [
    { label:'✅ Создать', action:()=>{
      const name = document.getElementById('sq-name').value || ('Отряд '+squadCounter);
      s.garrison -= 5;
      state.squads.push({ id:'sq'+(++squadCounter), name, size:5, weapon:null, stationId:sid, owner:state.player, spied:false });
      logMsg(state.player, `👥 Отряд «${name}» на «${s.name}».`);
      closeModal(); refresh();
    }},
    { label:'Отмена', action:closeModal }
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
  const available=Object.entries(state.weaponStock).filter(([wid,n])=>n>0 && wid!=='knife' && wid!=='throwing_knife');
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
  const available=Object.entries(state.weaponStock).filter(([wid,n])=>n>0 && wid!=='knife' && wid!=='throwing_knife');
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

/* Перемещение отряда: выбираем отряд, потом тапаем на цель */
let selectedSquadForMove = null;

function selectSquadForMove(qid){
  const q = state.squads.find(x => x.id === qid);
  if(!q || q.owner !== state.player) return;
  selectedSquadForMove = qid;
  toast(`Выбран отряд «${q.name}». Тапни на станцию или тоннель`);
  /* Подсвечиваем доступные цели */
  highlightMoveTargets(q);
}

function highlightMoveTargets(q){
  const currentStation = state.stations[q.stationId];
  if(!currentStation) return;
  /* Соседние станции */
  const neighbors = stationNeighbors(q.stationId);
  neighbors.forEach(nid => {
    const el = document.querySelector(`.station[data-id="${nid}"]`);
    if(el) el.classList.add('move-target');
  });
  /* Соседние сегменты тоннеля */
  tunnelsAtStation(q.stationId).forEach(t => {
    /* Подсвечиваем SVG-маркер */
  });
}

function clearMoveHighlights(){
  document.querySelectorAll('.move-target').forEach(e => e.classList.remove('move-target'));
}

/* Обработка тапа по станции/тоннелю при выбранном отряде */
function tryMoveSquadTo(targetId, targetType){
  if(!selectedSquadForMove) return false;
  const q = state.squads.find(x => x.id === selectedSquadForMove);
  if(!q) return false;

  if(targetType === 'station'){
    /* Проверяем соседство */
    const neighbors = stationNeighbors(q.stationId);
    if(!neighbors.includes(targetId)){
      toast('Станция не соседняя');
      return true;
    }
    const tgt = state.stations[targetId];
    if(tgt.owner !== state.player){
      /* Движение на чужую станцию = атака или захват */
      toast('Для атаки выбери действие «Атака»');
      selectedSquadForMove = null;
      clearMoveHighlights();
      return true;
    }
    q.stationId = targetId;
    logMsg(state.player, `Отряд «${q.name}» → «${tgt.name}».`);
    selectedSquadForMove = null;
    clearMoveHighlights();
    refresh();
    return true;
  }
  if(targetType === 'tunnel'){
    /* Проверяем, что сегмент соседний */
    const adjacent = tunnelsAtStation(q.stationId).some(t => t.id === targetId);
    if(!adjacent){
      toast('Сегмент не соседний');
      return true;
    }
    const t = state.tunnels[targetId];
    if(t.owner !== state.player){
      toast('Сегмент не ваш');
      selectedSquadForMove = null;
      clearMoveHighlights();
      return true;
    }
    /* Размещаем отряд в тоннеле */
    q.tunnelId = targetId;
    logMsg(state.player, `Отряд «${q.name}» → тоннель.`);
    selectedSquadForMove = null;
    clearMoveHighlights();
    refresh();
    return true;
  }
  return false;
}

function moveSquadPrompt(qid){
  selectSquadForMove(qid);
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
   ШПИОНАЖ
   ============================================================ */
function sendSpyPrompt(targetStationId){
  const s = state.stations[targetStationId];
  const r = factionRes(state.player);
  const cost = 30; /* Стоимость шпионажа */
  if(r.influence < cost){ toast(`Нужно ${cost}⚖`); return; }
  if(s.owner === state.player){ toast('Своя станция'); return; }

  showModal('🕵 Шпионаж', `Отправить шпиона на «${s.name}»?<br><br>
    Стоимость: <b>${cost}⚖</b><br>
    Шанс успеха: <b>60%</b><br>
    Если поймают — могут казнить или вернуть за выкуп.`, [
    { label:'🕵 Отправить', action:()=>{
      r.influence -= cost;
      const success = Math.random() < 0.6;
      if(success){
        /* Раскрываем отряды на станции */
        state.squads.filter(q => q.stationId === targetStationId && q.owner !== state.player)
          .forEach(q => { q.spied = true; });
        s.spied = true;
        logMsg(state.player, `🕵 Шпион добыл сведения о «${s.name}».`, 'win');
        toast('🕵 Успех!');
      } else {
        /* Провал */
        const killed = Math.random() < 0.5;
        if(killed){
          logMsg(state.player, `🕵 Шпион казнён на «${s.name}».`, 'battle');
          toast('💀 Шпион казнён');
        } else {
          /* Выкуп */
          const ransom = 15;
          if(r.influence >= ransom){
            r.influence -= ransom;
            logMsg(state.player, `🕵 Шпиона выкупили за ${ransom}⚖.`);
            toast(`🕵 Выкуп ${ransom}⚖`);
          } else {
            logMsg(state.player, `🕵 Шпион в плену (нет на выкуп).`);
          }
        }
      }
      closeModal(); refresh();
    }},
    { label:'Отмена', action:closeModal }
  ]);
}

/* ============================================================
   ЭКОНОМИКА
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
  const b=BUILDINGS[bid]; if(!b) return;
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
  showModal(`🏗 ${b.name}`,html,[
    {label:'← Назад',action:()=>{closeModal();showEconomy();}},
    {label:'Закрыть',action:closeModal}
  ]);
}

function economyDetailTunnel(bid){
  const b=TUNNEL_BUILDINGS[bid]; if(!b) return;
  const myTunnels=Object.values(state.tunnels).filter(t=>t.owner===state.player&&!t.mutantNest);
  const res=factionRes(state.player);
  const can=res.food>=b.cost.food&&res.ammo>=b.cost.ammo;

  let html=`<div style="font-size:11px;color:#888;margin-bottom:10px">${b.desc}</div>`;
  if(!myTunnels.length){ html+=`<div style="color:#666;font-size:11px">Нет своих тоннелей.</div>`; }
  myTunnels.forEach(t=>{
    const has=t.buildings.includes(bid);
    const segLbl = t.seg===1?'◀':(t.seg===2?'●':'▶');
    const name=`${segLbl} ${state.stations[t.from].name} ↔ ${state.stations[t.to].name}`;
    html+=`<div class="build-card">
      <div class="bname" style="${has?'color:#69f0ae':''}">${has?'✅':'⬜'} ${name}</div>
      ${!has?`<div class="actions">
        <button class="btn small" onclick="quickBuildTunnel('${t.id}','${bid}')" ${can?'':'disabled'}>🏗 Построить</button>
      </div>`:''}
    </div>`;
  });
  showModal(`🏗 ${b.name}`,html,[
    {label:'← Назад',action:()=>{closeModal();showEconomy();}},
    {label:'Закрыть',action:closeModal}
  ]);
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
   АРМИЯ
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

  html+=`<div class="section-title">Гарнизоны станций (${myStations.length})</div>`;
  if(!myStations.length) html+=`<div style="color:#666;font-size:10px">Нет станций.</div>`;
  myStations.forEach(s=>{
    const w=s.garrisonWeapon?WEAPONS[s.garrisonWeapon]:null;
    const squadCount = stationSquads(s.id).filter(q=>q.owner===state.player).length;
    html+=`<div class="squad-card">
      <div class="sname">🏛 ${s.name} — ${s.garrison} чел. (${squadCount}/5 отрядов)</div>
      <div class="sstats">${w?`<img src="${w.icon||ICONS.weapon}" class="ico-img"> ${w.name}`:'Без оружия'} · 🛡 ${s.fort}</div>
      <div class="actions">
        <button class="btn small" onclick="closeModal();openPanelForStation('${s.id}')">📋 Открыть</button>
        <button class="btn small" onclick="equipGarrisonPrompt('${s.id}')">🔫 Оружие</button>
        <button class="btn small" onclick="sendSpyPrompt('${s.id}')">🕵 Шпион</button>
      </div>
    </div>`;
  });

  html+=`<div class="section-title">Мобильные отряды (${mySquads.length})</div>`;
  if(!mySquads.length) html+=`<div style="color:#666;font-size:10px">Нет мобильных отрядов.</div>`;
  mySquads.forEach(q=>{
    const w=WEAPONS[q.weapon];
    const loc=state.stations[q.stationId];
    html+=`<div class="squad-card">
      <div class="sname">👥 ${q.name} — ${q.size} чел.</div>
      <div class="sstats">📍 ${loc?loc.name:'?'} · ${w?`<img src="${w.icon||ICONS.weapon}" class="ico-img"> ${w.name}`:'Без оружия'}</div>
      <div class="actions">
        <button class="btn small" onclick="renameSquad('${q.id}')">✏</button>
        <button class="btn small" onclick="equipSquad('${q.id}')">🔫</button>
        <button class="btn small" onclick="selectSquadForMove('${q.id}');closeModal()">↔ Двигать</button>
        <button class="btn small danger" onclick="disbandSquad('${q.id}')">✖</button>
      </div>
    </div>`;
  });

  html+=`<div class="section-title">Создать отряд</div>`;
  html+=`<div style="font-size:10px;color:#888;margin-bottom:6px">Отряд берёт 5 бойцов. Макс. 5 отрядов на станции.</div>`;
  myStations.forEach(s=>{
    const cnt = stationSquads(s.id).filter(q=>q.owner===state.player).length;
    html+=`<div class="actions">
      <button class="btn small" onclick="createSquadPrompt('${s.id}')" ${s.garrison<5||cnt>=5?'disabled':''}>
        ➕ ${s.name} (${s.garrison}👥, ${cnt}/5)
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
  let html=`<div style="font-size:11px;color:#888;margin-bottom:10px">Оружие на складе (без ножей).</div>`;
  const entries=Object.entries(state.weaponStock).filter(([w,n])=>n>0 && w!=='knife' && w!=='throwing_knife');
  if(!entries.length) html+=`<div style="color:#666;font-size:11px">Склад пуст.</div>`;
  else entries.forEach(([wid,n])=>{
    const w=WEAPONS[wid];
    html+=`<div class="weapon-card">
      <div class="wname">${w.icon?`<img src="${w.icon}" class="weapon-icon">`:''} ${w.name} — ${n} шт.</div>
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
   БЕСТИАРИЙ
   ============================================================ */
function showBestiary(){
  const groups = {};
  Object.entries(MUTANTS).forEach(([mid, m])=>{
    if(!groups[m.group]) groups[m.group] = [];
    groups[m.group].push({mid, m});
  });

  let html = `<div style="font-size:11px;color:#888;margin-bottom:10px">
    Мутанты тоннелей метро. Справочник по канону Metro 2033 / Last Light.</div>`;

  Object.entries(groups).forEach(([groupName, list])=>{
    html += `<div class="section-title">${groupName}</div>`;
    list.forEach(({mid, m})=>{
      const foundIn = getMutantLocations(mid);
      html += `<div class="mutant-card">
        <div class="mname">${m.icon?`<img src="${m.icon}" class="mutant-icon">`:'🕷'} ${m.name}</div>
        <div class="mstats">
          HP: <b>${m.hp}</b> · Урон: <b>${m.damage}</b> ·
          Стая: ${m.minP}-${m.maxP}
          ${m.lightFear?' · 💡 боится света':''}
          ${m.aquatic?' · 🌊 водный':''}
        </div>
        <div class="mdesc">${m.desc}</div>
        ${foundIn.length?`<div style="font-size:10px;color:#888;margin-top:5px">
          📍 Встречается: ${foundIn.join(', ')}</div>`:''}
      </div>`;
    });
  });

  showModal('🕷 Бестиарий', html, [{label:'Закрыть',action:closeModal}]);
}

function getMutantLocations(mid){
  const locs = [];
  Object.values(state.tunnels).forEach(t=>{
    if(t.mutantNest === mid){
      locs.push(`${state.stations[t.from].name} ↔ ${state.stations[t.to].name}`);
    }
  });
  Object.values(state.stations).forEach(s=>{
    if(s.mutantNest === mid) locs.push(s.name);
  });
  return [...new Set(locs)];
}

/* ============================================================
   ТОННЕЛИ — действия (панель)
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

/* ============================================================
   ЗАХВАТ ТОННЕЛЬНЫХ СЕГМЕНТОВ
   ============================================================ */
function canCaptureTunnel(tid, fid){
  const t = state.tunnels[tid];
  if(t.mutantNest) return false;
  const p = getTunnelPair(t.from, t.to);
  if(t.seg === 1) return state.stations[t.from].owner === fid;
  if(t.seg === 3) return state.stations[t.to].owner === fid;
  return (p.A && p.A.owner === fid) || (p.B && p.B.owner === fid);
}

function captureTunnelPrompt(tid){
  const t=state.tunnels[tid];
  if(t.mutantNest){ toast('Сначала зачистите мутантов'); return; }

  const fromS=state.stations[t.from], toS=state.stations[t.to];
  const sources=[];

  if(t.seg === 1){
    if(fromS.owner === state.player)
      sources.push({type:'station', id:t.from, name:fromS.name, garrison:fromS.garrison});
  } else if(t.seg === 3){
    if(toS.owner === state.player)
      sources.push({type:'station', id:t.to, name:toS.name, garrison:toS.garrison});
  } else {
    const p = getTunnelPair(t.from, t.to);
    if(p.A && p.A.owner === state.player)
      sources.push({type:'tunnel', id:p.A.id, name:'Подступ к '+fromS.name, garrison:p.A.garrison});
    if(p.B && p.B.owner === state.player)
      sources.push({type:'tunnel', id:p.B.id, name:'Подступ к '+toS.name, garrison:p.B.garrison});
    if(fromS.owner === state.player)
      sources.push({type:'station', id:t.from, name:fromS.name, garrison:fromS.garrison});
    if(toS.owner === state.player)
      sources.push({type:'station', id:t.to, name:toS.name, garrison:toS.garrison});
  }

  if(!sources.length){ toast('Нет источников для захвата'); return; }

  const choices = sources.map(s=>{
    return {label:`Из ${s.name} (${s.garrison}👥)`, action:()=>{
      const body = `<div>Захватить сегмент тоннеля?</div>
        <div style="font-size:11px;color:#888;margin-top:6px">
          Сегмент ${t.seg===1?'◀ (подступ к '+fromS.name+')':(t.seg===2?'● (центральный)':'▶ (подступ к '+toS.name+')')}
        </div>
        <input type="range" id="tun-range" min="1" max="${Math.max(1,s.garrison-1)}"
          value="3" oninput="document.getElementById('tun-num').textContent=this.value">
        <div style="text-align:center;font-size:18px"><b id="tun-num">3</b> 👥</div>`;
      showModal('Захват сегмента', body, [
        {label:'🏴 Захватить', action:()=>{
          const n = parseInt(document.getElementById('tun-range').value,10);
          closeModal();
          doCaptureSegment(tid, s, n);
        }},
        {label:'Отмена', action:closeModal}
      ]);
    }};
  });
  choices.push({label:'Отмена',action:closeModal});
  showModal('Источник войск', `Откуда отправить бойцов в сегмент?`, choices);
}

function doCaptureSegment(tid, source, n){
  const t = state.tunnels[tid];
  let src;
  if(source.type === 'station') src = state.stations[source.id];
  else src = state.tunnels[source.id];

  if(!src || src.garrison < n){ toast('Мало бойцов'); return; }

  const isEmpty = !t.mutantNest && t.owner === 'neutral' && t.garrison === 0;
  src.garrison -= n;

  if(isEmpty){
    t.owner = state.player;
    t.garrison = n;
    logMsg(state.player, `🏴 Сегмент тоннеля занят без потерь (+${n}).`, 'win');
  } else {
    const power = n * (0.85 + Math.random()*0.3);
    const def = t.garrison * 1.5;
    if(power > def){
      const surv = Math.max(1, Math.round(n * (1 - def/power) * 0.7));
      const lost = n - surv;
      t.owner = state.player;
      t.garrison = surv;
      logMsg(state.player, `🏴 Сегмент захвачен. −${lost}, гарнизон ${surv}.`, 'win');
    } else {
      const lost = Math.round(n * 0.7);
      src.garrison += Math.max(0, n - lost);
      logMsg(state.player, `⚔ Штурм сегмента провален. −${lost}.`, 'battle');
    }
  }
  state.selected = tid; state.selectedType = 'tunnel';
  refresh();
}