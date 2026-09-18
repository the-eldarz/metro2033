/* ============================================================
   COMBAT: атаки станций, спецоперации Рейха, мутанты
   ============================================================ */

/* -------- АТАКА СТАНЦИИ -------- */
function attackPrompt(srcId,tgtId){
  const src=state.stations[srcId], tgt=state.stations[tgtId];
  if(src.garrison<=3){ toast('Мало бойцов'); return; }
  const enemyOwner=tgt.owner;
  const isNeutral=enemyOwner==='neutral';
  const isWar=!isNeutral&&getRelation(state.player,enemyOwner)==='war';
  const isBetrayed=!isNeutral&&getBetrayed(state.player,enemyOwner);
  const eternal=!isNeutral&&isEternalWar(state.player,enemyOwner);
  const needSurprise=!isNeutral&&!isWar&&!eternal;

  const max=src.garrison-1;
  const def=Math.round(tgt.garrison*(1+tgt.fort*0.5)*(tgt.scared>0?0.5:1));
  const defaultVal=Math.max(1,Math.floor(max*0.7));

  const srcSquads=stationSquads(srcId).filter(q=>q.owner===state.player);
  let squadBonus=0;
  srcSquads.forEach(q=>{ if(q.weapon) squadBonus+=WEAPONS[q.weapon].damage*0.1; });
  if(src.garrisonWeapon) squadBonus+=WEAPONS[src.garrisonWeapon].damage*0.05;
  squadBonus=Math.min(squadBonus,30);

  let warning='';
  if(eternal) warning=`<div class="warn-box danger">⚔ Вечная война.</div>`;
  else if(needSurprise){
    if(isBetrayed) warning=`<div class="warn-box danger">☠ Вечная война (предательство).</div>`;
    else warning=`<div class="warn-box">⚠ Нападение врасплох: −50⚖, война, мир невозможен.</div>`;
  }

  const body=`<div>Из <b>${src.name}</b> (${src.garrison}) на <b>${tgt.name}</b> (${tgt.garrison}, 🛡${tgt.fort}).</div>
    <div style="margin-top:6px;font-size:11px;color:#888">Защита ~${def}${squadBonus>0?' · Оружие +'+Math.round(squadBonus)+'%':''}</div>
    ${warning}
    <input type="range" id="atk-range" min="1" max="${max}" value="${defaultVal}"
      oninput="document.getElementById('atk-num').textContent=this.value">
    <div style="text-align:center;font-size:20px"><b id="atk-num">${defaultVal}</b> 👥</div>`;

  const choices=[];
  const getN=()=>parseInt(document.getElementById('atk-range').value,10);
  if(needSurprise&&!isBetrayed){
    choices.push({label:'📜 Объявить войну и атаковать',action:()=>{
      const n=getN(); closeModal();
      declareWarFormal(state.player,enemyOwner);
      resolveAttack(srcId,tgtId,n);
    }});
    choices.push({label:'⚔ Врасплох (−50⚖)',action:()=>{
      const n=getN(); closeModal();
      surpriseAttack(state.player,enemyOwner);
      resolveAttack(srcId,tgtId,n);
    }});
  } else {
    choices.push({label:'⚔ В атаку!',action:()=>{
      const n=getN(); closeModal();
      resolveAttack(srcId,tgtId,n);
    }});
  }
  choices.push({label:'Отмена',action:closeModal});
  showModal('Атака',body,choices);
}

function resolveAttack(srcId,tgtId,n){
  const src=state.stations[srcId], tgt=state.stations[tgtId];
  const attackerFid=src.owner, defenderFid=tgt.owner;
  let atkBonus=1.0;
  if(attackerFid==='red') atkBonus+=0.05;
  const squads=stationSquads(srcId).filter(q=>q.owner===attackerFid);
  let squadBonus=0;
  squads.forEach(q=>{ if(q.weapon) squadBonus+=WEAPONS[q.weapon].damage*0.1; });
  if(src.garrisonWeapon) squadBonus+=WEAPONS[src.garrisonWeapon].damage*0.05;
  atkBonus+=Math.min(squadBonus,0.5);

  const fortBonus=1+tgt.fort*0.5;
  const scaredMalus=tgt.scared>0?0.5:1;
  const atkPower=n*atkBonus*(0.85+Math.random()*0.3);
  const defPower=tgt.garrison*fortBonus*scaredMalus*(0.85+Math.random()*0.3);
  src.garrison-=n;
  if(atkPower>defPower){
    const survivors=Math.max(1,Math.round(n*(1-defPower/atkPower)*0.7));
    const lost=n-survivors;
    tgt.owner=attackerFid; tgt.garrison=survivors;
    tgt.fort=0; tgt.scared=0; tgt.garrisonWeapon=null;
    logMsg(attackerFid,`⚔ ${src.name}→${tgt.name}: ПОБЕДА. −${lost}, гарнизон ${survivors}.`,'battle');
    if(defenderFid!=='neutral') logMsg(defenderFid,`Потеряна «${tgt.name}».`,'battle');
  } else {
    const attackerLost=Math.round(n*(0.6+Math.random()*0.3));
    const defenderLost=Math.max(0,Math.round(tgt.garrison*(atkPower/defPower)*0.6));
    tgt.garrison=Math.max(0,tgt.garrison-defenderLost);
    src.garrison+=Math.max(0,n-attackerLost);
    logMsg(attackerFid,`⚔ Атака на «${tgt.name}» отбита. −${attackerLost}.`,'battle');
    if(defenderFid!=='neutral') logMsg(defenderFid,`Отбита атака. −${defenderLost}.`,'battle');
  }
  tgt.population=Math.max(0,tgt.population-rand(1,4));
  state.selected=tgt.id; state.selectedType='station';
  refresh(); checkEliminations(); checkVictory();
}

/* -------- ВОЙНА / ВРАСПЛОХ -------- */
function declareWarFormal(a,b){
  if(isEternalWar(a,b)) return;
  setRelation(a,b,'war');
  logMsg(a,`📜 Война «${FACTIONS[b].name}».`,'battle');
  logMsg(b,`«${FACTIONS[a].name}» объявила войну!`,'battle');
  toast(`📜 Война: ${FACTIONS[b].name}`);
}
function surpriseAttack(a,b){
  if(isEternalWar(a,b)) return;
  setRelation(a,b,'war'); setBetrayed(a,b);
  state.factions[a].influence=Math.max(0,state.factions[a].influence-50);
  logMsg(a,`⚠ Нападение врасплох! −50⚖, мир невозможен.`,'battle');
  logMsg(b,`«${FACTIONS[a].name}» напала без объявления!`,'battle');
  toast(`⚠ Врасплох: ${FACTIONS[b].name}`);
}
function hostileCheck(enemyId){
  const owner=state.stations[enemyId].owner;
  if(owner==='neutral'||owner===state.player) return true;
  if(getRelation(state.player,owner)==='war') return true;
  surpriseAttack(state.player,owner);
  return true;
}

/* -------- СПЕЦОПЕРАЦИИ РЕЙХА -------- */
function reichGas(id){
  const r=factionRes('reich'), s=state.stations[id];
  if(r.ammo<40||r.influence<25) return;
  if(!hostileCheck(id)) return;
  r.ammo-=40; r.influence-=25;
  const killed=Math.floor(s.garrison*0.5);
  s.garrison=Math.max(0,s.garrison-killed);
  s.population=Math.max(0,s.population-Math.floor(s.population*0.15));
  logMsg('reich',`☣ Газ. камера на «${s.name}»: −${killed}.`,'battle');
  checkCaptureAfterAction(id); refresh();
}
function reichHang(id){
  const r=factionRes('reich'), s=state.stations[id];
  if(r.ammo<25||r.influence<15) return;
  if(!hostileCheck(id)) return;
  r.ammo-=25; r.influence-=15; s.scared=2;
  logMsg('reich',`🪢 Повешение на «${s.name}»: оборона −50%.`,'battle');
  refresh();
}
function reichTorture(id){
  const r=factionRes('reich');
  if(r.ammo<15) return;
  if(!hostileCheck(id)) return;
  r.ammo-=15; r.influence+=25;
  logMsg('reich',`🔪 Пытки: +25⚖.`,'battle'); refresh();
}
function reichShoot(id){
  const r=factionRes('reich'), s=state.stations[id];
  if(r.ammo<30) return;
  if(!hostileCheck(id)) return;
  r.ammo-=30;
  const killed=Math.floor(s.garrison*0.25);
  s.garrison=Math.max(0,s.garrison-killed);
  logMsg('reich',`🔫 Расстрел на «${s.name}»: −${killed}.`,'battle');
  checkCaptureAfterAction(id); refresh();
}
function checkCaptureAfterAction(stationId){
  const s=state.stations[stationId];
  if(s.garrison<=0&&s.owner!==state.player&&s.owner!=='neutral'){
    const myAdj=stationNeighbors(stationId).filter(n=>state.stations[n].owner===state.player);
    if(myAdj.length){
      const src=state.stations[myAdj[0]];
      const send=Math.max(1,Math.floor(src.garrison/2));
      src.garrison-=send;
      s.owner=state.player; s.garrison=send; s.fort=0;
      logMsg(state.player,`«${s.name}» занята.`,'win');
    }
  }
}

/* -------- ДИПЛОМАТИЯ UI (общая) -------- */
function showDiplomacy(){
  const playerFid=state.player;
  const others=Object.keys(FACTIONS).filter(fid=>fid!==playerFid);
  let html=`<div style="font-size:11px;color:#888;margin-bottom:10px;line-height:1.5">
    <b>Мир</b> — нельзя атаковать без штрафа. <b>Торг. союз</b> — +5⚡+3🍞/ход.
    <b>Обор. союз</b> — + контратака союзника.</div>`;
  others.forEach(fid=>{
    const f=FACTIONS[fid], alive=isFactionAlive(fid);
    const rel=getRelation(playerFid,fid);
    const info=REL_INFO[rel];
    const betrayed=getBetrayed(playerFid,fid);
    const eternal=isEternalWar(playerFid,fid);
    const power=powerRating(fid);
    html+=`<div class="diplo-row" style="${alive?'':'opacity:.4'}">
      <div class="dot" style="background:${f.color}"></div>
      <div class="fname" style="color:${f.color}">${f.name}</div>
      <div class="fstatus" style="color:${info.color};border-color:${info.color}55">${info.icon} ${info.label}</div>
      ${eternal?'<div class="betrayed">⚔ вечная</div>':''}
      ${betrayed?'<div class="betrayed">☠ предано</div>':''}
      <div style="font-size:10px;color:#888;margin-left:4px">${alive?'~'+Math.round(power):'—'}</div>
      <div class="btns">`;
    if(alive&&!state.gameOver&&!eternal){
      if(rel!=='war') html+=`<button class="btn warn small" onclick="diploAction('${fid}','war')">📜</button>`;
      if(rel==='war'&&!betrayed) html+=`<button class="btn diplo small" onclick="diploAction('${fid}','peace')">🕊</button>`;
      if(rel==='peace') html+=`<button class="btn diplo small" onclick="diploAction('${fid}','trade')">💰</button>`;
      if(rel==='trade') html+=`<button class="btn diplo small" onclick="diploAction('${fid}','defensive')">🛡</button>`;
    }
    html+=`</div></div>`;
  });
  showModal('🕊 Дипломатия',html,[{label:'Закрыть',action:closeModal}]);
}
function diploAction(targetFid,type){
  const playerFid=state.player;
  const f=FACTIONS[targetFid];
  if(isEternalWar(playerFid,targetFid)){ toast('Вечная война'); closeModal(); return; }
  if(type==='war'){ declareWarFormal(playerFid,targetFid); closeModal(); refresh(); return; }
  if(getBetrayed(playerFid,targetFid)&&type==='peace'){
    toast(`☠ «${f.name}» не пойдёт на мир.`); closeModal(); return;
  }
  const myPower=powerRating(playerFid), aiPower=powerRating(targetFid);
  const ratio=myPower/Math.max(1,aiPower);
  let chance=0.5;
  if(type==='peace') chance=Math.max(0.1,Math.min(0.9,ratio*0.75));
  else if(type==='trade') chance=Math.max(0.15,Math.min(0.85,0.4+(ratio-1)*0.3));
  else if(type==='defensive') chance=Math.max(0.1,Math.min(0.7,0.3+(ratio-1)*0.25));
  if(Math.random()<chance){
    setRelation(playerFid,targetFid,type);
    logMsg(playerFid,`«${f.name}» приняла: ${REL_INFO[type].label}.`,'win');
    toast(`✅ ${f.name}: ${REL_INFO[type].label}`);
  } else {
    logMsg(playerFid,`«${f.name}» отклонила.`);
    toast(`❌ ${f.name} отклонила`);
  }
  closeModal(); refresh();
}

/* -------- МУТАНТЫ -------- */
function clearMutantTunnel(tid){
  const t=state.tunnels[tid];
  if(!t.mutantNest){ toast('Нет гнезда'); return; }
  const m=MUTANTS[t.mutantNest];
  let power=0;
  const fromS=state.stations[t.from], toS=state.stations[t.to];
  if(fromS.owner===state.player) power+=fromS.garrison;
  if(toS.owner===state.player) power+=toS.garrison;
  state.squads.filter(q=>q.owner===state.player).forEach(q=>{
    if(q.stationId===t.from||q.stationId===t.to){
      power+=q.size*(q.weapon?WEAPONS[q.weapon].damage/10:1);
    }
  });
  const need=m.hp*2*(m.pack?1.5:1);
  if(power<need){ toast(`Нужно ~${Math.round(need)} силы`); return; }
  const lost=Math.min(Math.round(need/15),Math.max(0,fromS.owner===state.player?fromS.garrison-2:0));
  if(fromS.owner===state.player) fromS.garrison-=lost;
  t.mutantNest=null;
  t.owner=state.player; t.garrison=Math.max(2,Math.round(need/10));
  logMsg(state.player,`✅ Гнездо ${m.name} зачищено! −${lost} бойцов.`,'win');
  refresh();
}
function clearMutantStation(sid){
  const s=state.stations[sid];
  if(!s.mutantNest){ toast('Нет гнезда'); return; }
  const m=MUTANTS[s.mutantNest];
  let power=0;
  stationNeighbors(sid).forEach(nid=>{
    if(state.stations[nid].owner===state.player) power+=state.stations[nid].garrison*0.7;
  });
  state.squads.filter(q=>q.owner===state.player).forEach(q=>{
    if(stationNeighbors(sid).includes(q.stationId))
      power+=q.size*(q.weapon?WEAPONS[q.weapon].damage/10:1);
  });
  const need=m.hp*2.5*(m.pack?1.4:1);
  if(power<need){ toast(`Нужно ~${Math.round(need)} силы`); return; }
  s.mutantNest=null; s.owner=state.player; s.garrison=Math.max(3,Math.round(need/15));
  logMsg(state.player,`✅ Гнездо ${m.name} на «${s.name}» зачищено!`,'win');
  refresh();
}
function mutantTurn(){
  const nests=[];
  Object.values(state.tunnels).forEach(t=>{ if(t.mutantNest) nests.push({type:'tunnel',obj:t}); });
  Object.values(state.stations).forEach(s=>{ if(s.mutantNest) nests.push({type:'station',obj:s}); });

  nests.forEach(nest=>{
    if(Math.random()>0.35) return;
    const m=MUTANTS[nest.obj.mutantNest];
    const packSize=rand(m.minP,m.maxP);
    let targets=[];
    if(nest.type==='tunnel'){
      const t=nest.obj;
      const other=Object.values(state.tunnels).find(o=>
        o.id!==t.id&&((o.from===t.from&&o.to===t.to)||(o.from===t.to&&o.to===t.from))
      );
      if(other&&other.owner!=='neutral') targets.push({type:'tunnel',obj:other});
    }
    if(nest.type==='station'){
      const s=nest.obj;
      stationNeighbors(s.id).forEach(nid=>{
        const ns=state.stations[nid];
        if(ns.owner!=='neutral'&&!ns.mutantNest) targets.push({type:'station',obj:ns});
      });
      tunnelsAtStation(s.id).forEach(t=>{
        if(t.owner!=='neutral') targets.push({type:'tunnel',obj:t});
      });
    }
    if(!targets.length) return;
    const tgt=pick(targets);

    let lightBonus=0;
    if(m.lightFear&&tgt.type==='tunnel'&&tgt.obj.buildings.includes('searchlight')) lightBonus=0.5;
    const mutantPower=packSize*m.damage*(1-lightBonus);
    const def=tgt.obj.garrison+tgt.obj.fort*3;

    if(mutantPower>def){
      const lost=Math.min(tgt.obj.garrison,Math.ceil(packSize/2));
      tgt.obj.garrison=Math.max(0,tgt.obj.garrison-lost);
      if(tgt.obj.garrison<=0){
        tgt.obj.owner='neutral';
        logMsg('event',`🕷️ ${m.name} (x${packSize}) захватили ${tgt.type==='tunnel'?'тоннель':'«'+tgt.obj.name+'»'}!`,'mutant');
      } else {
        logMsg('event',`🕷️ ${m.name} атаковали: −${lost} бойцов.`,'mutant');
      }
    } else {
      const killed=Math.min(packSize,Math.ceil(def/m.damage));
      logMsg('event',`🛡️ Отбито ${killed} ${m.name}.`,'mutant');
      if(nest.type==='tunnel'&&Math.random()<0.2) nest.obj.mutantNest=null;
    }
  });
}