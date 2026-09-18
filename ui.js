/* ============================================================
   UI: панели, меню, модалки, лог, HUD
   ============================================================ */

function openPanel(){
  const sb=document.getElementById('sidebar');
  if(sb) sb.classList.add('open');
}
function closePanel(){
  const sb=document.getElementById('sidebar');
  if(sb) sb.classList.remove('open');
  state.selected=null; state.selectedType=null;
  document.querySelectorAll('.station,.tunnel-marker').forEach(e=>e.classList.remove('selected'));
}
function renderPanel(){
  if(state.selectedType==='tunnel') renderTunnelPanel();
  else if(state.selectedType==='station') renderStationPanel();
}

function toggleLeftMenu(){
  const lm=document.getElementById('left-menu');
  if(lm) lm.classList.toggle('hidden');
}
function closeLeftMenu(){
  const lm=document.getElementById('left-menu');
  if(lm) lm.classList.add('hidden');
}

/* -------- HUD -------- */
function renderHeader(){
  const f=factionRes(state.player);
  if(!f) return;
  $('#hdr-faction').textContent=FACTIONS[state.player].name.toUpperCase();
  $('#hdr-faction').style.color=FACTIONS[state.player].color;
  $('#res-food').textContent=Math.round(f.food);
  $('#res-ammo').textContent=Math.round(f.ammo);
  $('#res-infl').textContent=Math.round(f.influence);
  $('#res-sold').textContent=totalSoldiers(state.player);
  $('#res-stat').textContent=ownedStations(state.player).length;
  $('#res-tun').textContent=ownedTunnels(state.player).length;
  $('#turn-num').textContent=state.turn;
  if(checkGoalDone(state.player)&&!state.factions[state.player].goalDone){
    state.factions[state.player].goalDone=true;
    logMsg('win',`🎯 ЦЕЛЬ: ${FACTIONS[state.player].goalText}`,'win');
    toast('🎯 Цель фракции выполнена!');
  }
}
function checkGoalDone(fid){
  const f=state.factions[fid];
  switch(fid){
    case 'red': return totalSoldiers('red')>=150;
    case 'reich': return state.factions.red.eliminated;
    case 'hansa': return RING_IDS.every(id=>state.stations[id].owner==='hansa');
    case 'polis': return f.food>=400&&f.ammo>=400;
    case 'bandits': return f.ammo>=700;
    case 'vdnh': return ['vdnh','alekseevskaya','rizhskaya'].every(id=>state.stations[id].owner==='vdnh')
      &&ownedStations('vdnh').length>=5;
    case 'conf1905': return state.stations.kievskaya.owner==='conf1905'
      &&state.stations.krasnopresnenskaya.owner==='conf1905';
  }
  return false;
}

function logMsg(fid,text,cls){
  const tag=fid&&FACTIONS[fid]?`<span class="lg-${fid}">[${FACTIONS[fid].short}]</span>`:'';
  const clsStr=cls?`lg-${cls}`:(fid?`lg-${fid}`:'');
  state.log.push({turn:state.turn,html:`<span class="t">Х${state.turn}</span>${tag} <span class="${clsStr}">${text}</span>`});
  if(state.log.length>200) state.log.shift();
  renderLog();
}
function renderLog(){
  const el=$('#logpanel'); if(!el) return;
  el.innerHTML=state.log.slice(-60).map(e=>`<div class="entry">${e.html}</div>`).join('');
  el.scrollTop=el.scrollHeight;
}

function refresh(){
  renderHeader();
  document.querySelectorAll('.station').forEach(el=>{
    const s=state.stations[el.dataset.id];
    if(s) updateStationEl(el,s);
  });
  renderPanel();
}

function toast(text){
  const t=document.createElement('div');
  t.className='toast'; t.textContent=text;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2400);
}
function showModal(title,body,choices){
  $('#modal-title').textContent=title;
  $('#modal-body').innerHTML=body;
  const ch=$('#modal-choices'); ch.innerHTML='';
  choices.forEach(c=>{
    const b=document.createElement('button');
    b.className='btn'; b.textContent=c.label; b.onclick=c.action;
    ch.appendChild(b);
  });
  $('#modal-bg').classList.remove('hidden');
}
function closeModal(){ $('#modal-bg').classList.add('hidden'); }

/* ============================================================
   ПАНЕЛЬ СТАНЦИИ
   ============================================================ */
function renderStationPanel(){
  const panel=$('#stationpanel'); const id=state.selected;
  if(!id||state.selectedType!=='station'){
    panel.innerHTML=`<div style="color:#666;text-align:center;padding:30px 0">
      <div style="font-size:32px;margin-bottom:8px">🚇</div>
      <div style="font-size:11px">Выбери станцию или тоннель</div></div>`;
    return;
  }
  const s=state.stations[id];
  const ownerName=s.owner==='neutral'?(s.abandoned?'Заброшена':'Независимые'):FACTIONS[s.owner].name;
  const ownerColor=s.owner==='neutral'?'var(--neutral)':FACTIONS[s.owner].color;
  const isMine=s.owner===state.player;

  let html=`<h2>${s.name} ${s.ring?'<span style="color:#888;font-size:10px">• Кольцо</span>':''}</h2>`;

  if(!isMine&&s.owner!=='neutral'){
    const f=FACTIONS[s.owner];
    const rel=getRelation(state.player,s.owner);
    const info=REL_INFO[rel];
    const betrayed=getBetrayed(state.player,s.owner);
    const eternal=isEternalWar(state.player,s.owner);
    const owned=ownedStations(s.owner);
    const stationNames=owned.map(x=>x.name).join(' · ');

    html+=`<div class="faction-info">
      <div class="faction-banner" style="--fc:${f.color}">
        ${f.flag?`<img src="${f.flag}" class="faction-flag">`:''}
        <div class="faction-short">${f.short}</div>
        <div class="faction-details">
          <div class="faction-name">${f.name}</div>
          <div class="faction-leader">${f.leader}</div>
        </div>
      </div>
      <div class="row"><span>Отношения</span><b style="color:${info.color}">${info.icon} ${info.label}${betrayed?' ☠':''}${eternal?' (вечная)':''}</b></div>
      <div class="row"><span>Станций</span><b>🚇 ${owned.length}</b></div>
      <div class="row"><span>Всего бойцов</span><b>👥 ${totalSoldiers(s.owner)}</b></div>
      <div class="faction-stations-list">${stationNames}</div>
    </div>`;
    if(eternal) html+=`<div class="warn-box danger">⚔ Вечная война. Мир невозможен.</div>`;
    else if(betrayed) html+=`<div class="warn-box danger">☠ Вы предали их. Мир невозможен.</div>`;
  }

  html+=`<div class="row"><span>Владелец</span><b style="color:${ownerColor}">${ownerName}</b></div>`;

  if(s.mutantNest){
    const m=MUTANTS[s.mutantNest];
    html+=`<div class="warn-box mutant">🕷 <b>${m.name}</b><br>${m.desc}<br>HP: ${m.hp} · Урон: ${m.damage}</div>`;
  } else {
    html+=`<div class="row"><span>Гарнизон</span><b>👥 ${s.garrison}${isMine?' / '+s.maxGarrison:''}</b></div>`;
    if(s.garrisonWeapon&&WEAPONS[s.garrisonWeapon]){
      html+=`<div class="row"><span>Оружие гарнизона</span><b>🔫 ${WEAPONS[s.garrisonWeapon].name}</b></div>`;
    }
    html+=`<div class="row"><span>Население</span><b>🏘️ ${Math.round(s.population)}</b></div>
      <div class="row"><span>Укрепления</span><b>🛡️ ${s.fort}</b></div>
      ${s.buildings.length>0?`<div class="row"><span>Постройки</span><b>🏗 ${s.buildings.length}</b></div>`:''}
      ${s.scared>0?`<div class="row"><span style="color:#ff8a80">⚠ Терроризирована</span><b>${s.scared} х.</b></div>`:''}`;
  }

  if(isMine){
    html+=`<div class="tabs">
      <div class="tab ${state.uiTab==='build'?'active':''}" onclick="setTab('build')">🏗</div>
      <div class="tab ${state.uiTab==='squad'?'active':''}" onclick="setTab('squad')">👥</div>
      <div class="tab ${state.uiTab==='action'?'active':''}" onclick="setTab('action')">⚙</div>
    </div>`;
    if(state.uiTab==='build') html+=renderBuildings(id);
    else if(state.uiTab==='squad') html+=renderSquads(id);
    else html+=renderStationActions(id);
  } else if(s.mutantNest){
    html+=`<div class="section-title">Зачистка</div><div class="actions">
      <button class="btn" onclick="clearMutantStation('${id}')">⚔ Зачистить гнездо</button>
    </div>`;
  } else {
    if(s.owner!=='neutral'&&!state.gameOver) html+=renderFactionDiplomacy(s.owner);
    const myAdj=stationNeighbors(id).filter(n=>state.stations[n].owner===state.player);
    if(myAdj.length>0&&!state.gameOver){
      html+=`<div class="section-title">Атака</div><div class="actions">
        ${myAdj.map(src=>`<button class="btn danger" onclick="attackPrompt('${src}','${id}')">⚔ Из ${state.stations[src].name} (${state.stations[src].garrison}👥)</button>`).join('')}
      </div>`;
      html+=renderFactionEnemyActions(id);
    }
    /* Шпионаж */
    if(!state.gameOver){
      html+=`<div class="section-title">Разведка</div><div class="actions">
        <button class="btn" onclick="sendSpyPrompt('${id}')">🕵 Отправить шпиона (30⚖)</button>
      </div>`;
    }
  }
  panel.innerHTML=html;
}

/* ============================================================
   ПАНЕЛЬ ТОННЕЛЯ
   ============================================================ */
function renderTunnelPanel(){
  const panel=$('#stationpanel'); const id=state.selected;
  if(!id||state.selectedType!=='tunnel'){
    panel.innerHTML=`<div style="color:#666;text-align:center;padding:30px 0">Выбери тоннель</div>`;
    return;
  }
  const t=state.tunnels[id];
  const fromS=state.stations[t.from], toS=state.stations[t.to];
  const isMine=t.owner===state.player;
  const color=t.owner==='neutral'?'var(--neutral)':FACTIONS[t.owner].color;
  const ownerName=t.owner==='neutral'?'Нейтральный':FACTIONS[t.owner].name;

  let html=`<h2>Тоннель ${fromS.name} ↔ ${toS.name}</h2>
    <div style="color:#888;font-size:10px;margin-bottom:6px">Сегмент ${t.seg===1?'от '+fromS.name:(t.seg===2?'центральный':'от '+toS.name)}</div>
    <div class="row"><span>Владелец</span><b style="color:${color}">${ownerName}</b></div>`;

  if(t.mutantNest){
    const m=MUTANTS[t.mutantNest];
    html+=`<div class="warn-box mutant">🕷 <b>${m.name}</b><br>${m.desc}<br>HP: ${m.hp} · Урон: ${m.damage} · Стая: ${m.minP}-${m.maxP}</div>`;
  } else {
    html+=`<div class="row"><span>Гарнизон</span><b>👥 ${t.garrison}</b></div>
      <div class="row"><span>Укрепления</span><b>🛡️ ${t.fort}</b></div>
      ${t.buildings.length>0?`<div class="row"><span>Постройки</span><b>🏗 ${t.buildings.length}</b></div>`:''}`;
  }

  if(isMine&&!t.mutantNest){
    html+=`<div class="tabs">
      <div class="tab ${state.tunnelTab==='tbuild'?'active':''}" onclick="setTunTab('tbuild')">🏗</div>
      <div class="tab ${state.tunnelTab==='taction'?'active':''}" onclick="setTunTab('taction')">⚙</div>
    </div>`;
    if(state.tunnelTab==='tbuild') html+=renderTunnelBuildings(id);
    else html+=renderTunnelActions(id);
  } else if(t.mutantNest){
    html+=`<div class="section-title">Зачистка</div><div class="actions">
      <button class="btn" onclick="clearMutantTunnel('${id}')">⚔ Зачистить гнездо</button>
    </div>`;
  } else {
    if(canCaptureTunnel(id,state.player)){
      html+=`<div class="section-title">Захват</div><div class="actions">
        <button class="btn" onclick="captureTunnelPrompt('${id}')">🏴 Захватить сегмент</button>
      </div>`;
    } else {
      html+=`<div style="color:#666;font-size:10px;margin-top:8px">Нет соседних ваших станций/тоннелей.</div>`;
    }
  }
  panel.innerHTML=html;
}

function setTab(t){ state.uiTab=t; renderStationPanel(); }
function setTunTab(t){ state.tunnelTab=t; renderTunnelPanel(); }