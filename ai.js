/* ============================================================
   AI: ход ИИ, события, победа, старт
   ============================================================ */

function endTurn(){
  if(state.gameOver) return;

  /* Производство и содержание */
  Object.keys(state.factions).forEach(fid=>{
    const f=state.factions[fid];
    if(!isFactionAlive(fid)){
      if(!f.eliminated){ f.eliminated=true; f.alive=false;
        logMsg('event',`«${FACTIONS[fid].name}» уничтожена.`,'win'); }
      return;
    }
    const owned=ownedStations(fid);
    const ownedT=ownedTunnels(fid);
    let food=0,ammo=0,infl=0,upkeep=0;
    owned.forEach(s=>{
      food+=3+Math.floor(s.population*0.05);
      ammo+=2; infl+=1; upkeep+=s.garrison*0.05;
      s.buildings.forEach(bid=>{
        const b=BUILDINGS[bid]; if(!b) return;
        if(b.effect==='food') food+=b.value;
        if(b.effect==='ammo') ammo+=b.value;
        if(b.effect==='influence'||b.effect==='influence_special') infl+=b.value;
        if(b.effect==='heal') s.garrison=Math.min(s.maxGarrison,s.garrison+Math.min(b.value,Math.floor(s.garrison*0.1)));
        if(b.effect==='population') s.population+=b.value;
        if(b.effect==='camp'){ food+=b.value; s.population=Math.max(0,s.population-2); }
      });
    });
    ownedT.forEach(t=>{
      upkeep+=t.garrison*0.05;
      t.buildings.forEach(bid=>{
        const b=TUNNEL_BUILDINGS[bid]; if(!b) return;
        if(b.effect==='ammo') ammo+=b.value;
      });
    });
    Object.keys(FACTIONS).forEach(other=>{
      if(other===fid) return;
      if(!isFactionAlive(other)) return;
      const r=getRelation(fid,other);
      if(r==='trade'||r==='defensive'){ ammo+=5; food+=3; }
    });
    f.food+=food-upkeep; f.ammo+=ammo; f.influence+=infl;
    if(f.food<0){
      f.food=0;
      owned.forEach(s=>{ s.garrison=Math.max(1,s.garrison-2); });
      logMsg(fid,`⚠ Голод!`,'event');
    }
    f.food=Math.min(999,f.food); f.ammo=Math.min(999,f.ammo); f.influence=Math.min(999,f.influence);
  });

  Object.values(state.stations).forEach(s=>{ if(s.scared>0) s.scared--; });

  aiTurn();
  mutantTurn();
  if(Math.random()<0.55) randomEvent();

  state.turn++;
  renderHeader(); renderMap(); renderPanel();
  checkEliminations(); checkVictory();
}

/* -------- ИИ -------- */
function aiTurn(){
  Object.keys(FACTIONS).forEach(fid=>{
    if(fid===state.player) return;
    if(!isFactionAlive(fid)) return;
    const f=state.factions[fid];
    const owned=ownedStations(fid);

    owned.forEach(s=>{
      if(f.ammo>=10&&f.food>=15&&s.population>=5&&s.garrison<s.maxGarrison&&Math.random()<0.5){
        f.ammo-=10; f.food-=15; s.garrison+=4; s.population-=4;
      }
      if(f.ammo>=25&&s.fort<3&&Math.random()<0.3){ f.ammo-=25; s.fort+=1; }
      if(Math.random()<0.12){
        const avail=Object.entries(BUILDINGS).filter(([bid,b])=>{
          if(s.buildings.includes(bid)) return false;
          if(bid==='camp'&&fid!=='reich') return false;
          return f.food>=b.cost.food&&f.ammo>=b.cost.ammo&&f.influence>=b.cost.influence;
        });
        if(avail.length){
          const [bid,b]=pick(avail);
          f.food-=b.cost.food; f.ammo-=b.cost.ammo; f.influence-=b.cost.influence;
          s.buildings.push(bid);
          if(bid==='barracks') s.maxGarrison+=b.value;
        }
      }
    });

    owned.forEach(s=>{
      if(s.garrison<12) return;
      const neighbors=stationNeighbors(s.id).map(id=>state.stations[id]).filter(n=>{
        if(n.owner===fid) return false;
        if(n.owner==='neutral'&&!n.mutantNest) return true;
        if(n.owner==='neutral') return false;
        const r=getRelation(fid,n.owner);
        return r==='war'||r==='neutral';
      });
      if(!neighbors.length) return;
      neighbors.sort((a,b)=>(a.garrison*(1+a.fort*0.5))-(b.garrison*(1+b.fort*0.5)));
      const tgt=neighbors[0];
      const def=tgt.garrison*(1+tgt.fort*0.5)*(tgt.scared>0?0.5:1);
      const send=Math.floor(s.garrison*0.7);
      if(send>def*1.4) resolveAIAttack(s,tgt,send,fid);
    });

    owned.forEach(s=>{
      const adjacent=tunnelsAtStation(s.id).filter(t=>t.owner==='neutral'&&!t.mutantNest);
      if(adjacent.length&&s.garrison>8&&Math.random()<0.3){
        const t=pick(adjacent);
        const send=Math.min(s.garrison-5,8);
        s.garrison-=send;
        t.owner=fid; t.garrison=Math.round(send*0.7);
      }
    });

    if(Math.random()<0.08) aiDiplomacyProposal(fid);
  });
}

function resolveAIAttack(src,tgt,n,fid){
  const atkPower=n*(0.85+Math.random()*0.3);
  const defPower=tgt.garrison*(1+tgt.fort*0.5)*(tgt.scared>0?0.5:1)*(0.85+Math.random()*0.3);
  src.garrison-=n;
  if(atkPower>defPower){
    const wasOwner=tgt.owner;
    const survivors=Math.max(1,Math.round(n*0.6));
    tgt.owner=fid; tgt.garrison=survivors; tgt.fort=0; tgt.scared=0; tgt.garrisonWeapon=null;
    logMsg(fid,`ИИ: «${FACTIONS[fid].name}» захватила «${tgt.name}».`,'battle');
    if(wasOwner!=='neutral'&&getRelation(fid,wasOwner)!=='war'&&!isEternalWar(fid,wasOwner)){
      setBetrayed(fid,wasOwner);
      logMsg(wasOwner,`⚠ «${FACTIONS[fid].name}» напала врасплох!`,'battle');
    }
    if(wasOwner===state.player) checkDefensiveAllies(tgt,fid);
  } else {
    src.garrison+=Math.max(0,Math.floor(n*0.4));
    tgt.garrison=Math.max(0,tgt.garrison-3);
  }
}
function checkDefensiveAllies(attackedStation,attackerFid){
  if(attackedStation.owner!==state.player) return;
  Object.keys(FACTIONS).forEach(allied=>{
    if(allied===state.player||allied===attackerFid) return;
    if(!isFactionAlive(allied)) return;
    const r=getRelation(state.player,allied);
    if(r!=='defensive') return;
    const targets=[];
    ownedStations(allied).forEach(as=>{
      stationNeighbors(as.id).forEach(nid=>{
        if(state.stations[nid].owner===attackerFid) targets.push({from:as,to:state.stations[nid]});
      });
    });
    if(!targets.length) return;
    const t=targets[0];
    if(t.from.garrison<8) return;
    const send=Math.floor(t.from.garrison*0.5);
    logMsg(allied,`🛡 Союзник контратакует «${FACTIONS[attackerFid].name}»!`);
    resolveAIAttack(t.from,t.to,send,allied);
  });
}
function aiDiplomacyProposal(aiFid){
  const playerFid=state.player;
  if(isEternalWar(aiFid,playerFid)) return;
  const rel=getRelation(aiFid,playerFid);
  const myPower=powerRating(playerFid), aiPower=powerRating(aiFid);
  const ratio=aiPower/Math.max(1,myPower);
  const betrayed=getBetrayed(aiFid,playerFid);
  let pt=null;
  if(rel==='war'&&!betrayed&&ratio<0.7&&Math.random()<0.4) pt='peace';
  else if(rel==='peace'&&ratio>0.9&&Math.random()<0.3) pt='trade';
  if(!pt) return;
  const f=FACTIONS[aiFid];
  showModal(`${f.name} предлагает`,`${f.leader} предлагает: <b>${REL_INFO[pt].label}</b>.`,[
    {label:'✅ Принять',action:()=>{
      setRelation(playerFid,aiFid,pt);
      logMsg(aiFid,`Договор: ${REL_INFO[pt].label}.`,'win');
      closeModal(); refresh();
    }},
    {label:'❌ Отклонить',action:()=>{
      logMsg(playerFid,`Отклонено от «${f.name}».`);
      closeModal();
    }}
  ]);
}

/* -------- СОБЫТИЯ -------- */
const EVENTS=[
  {name:'Выброс радиации',text:'Все гарнизоны −2.',
    fn:()=>{
      Object.values(state.stations).forEach(s=>s.garrison=Math.max(0,s.garrison-2));
      Object.values(state.tunnels).forEach(t=>t.garrison=Math.max(0,t.garrison-2));
    }},
  {name:'Нашествие мутантов',text:'Мутанты атакуют.',
    fn:()=>{ if(Math.random()<0.5) mutantTurn(); mutantTurn(); }},
  {name:'Караван Полиса',text:'Всем +25⚡.',
    fn:()=>Object.values(state.factions).forEach(f=>f.ammo+=25)},
  {name:'Эпидемия',text:'Население −5.',
    fn:()=>Object.values(state.stations).forEach(s=>s.population=Math.max(5,s.population-5))},
  {name:'Найден склад Д-6',text:'Всем +30⚡ +20🍞.',
    fn:()=>Object.values(state.factions).forEach(f=>{f.ammo+=30;f.food+=20;})},
  {name:'Гнездо пауков обнаружено',text:'Появились жукопауки.',
    fn:()=>{
      const neutralT=Object.values(state.tunnels).filter(t=>!t.mutantNest&&t.owner==='neutral');
      if(!neutralT.length) return;
      const t=pick(neutralT);
      t.mutantNest='spiderbug';
      logMsg('event',`🕷️ Пауки в тоннеле ${state.stations[t.from].name}↔${state.stations[t.to].name}.`,'mutant');
    }},
  {name:'Прорыв гермодвери',text:'Станция оккупирована мутантами.',
    fn:()=>{
      const n=Object.values(state.stations).filter(s=>s.owner==='neutral'&&!s.mutantNest&&!s.abandoned);
      if(!n.length)return; const t=pick(n);
      t.mutantNest='common_nosalis';
      logMsg('event',`🕷️ «${t.name}» оккупирована носалисами.`,'mutant');
    }}
];
function randomEvent(){
  const e=pick(EVENTS);
  logMsg('event',`📡 ${e.name}: ${e.text}`);
  e.fn(); toast(`📡 ${e.name}`);
}

/* -------- ПОБЕДА -------- */
function checkEliminations(){
  Object.keys(state.factions).forEach(fid=>{
    if(!isFactionAlive(fid)&&!state.factions[fid].eliminated){
      state.factions[fid].eliminated=true;
      state.factions[fid].alive=false;
      logMsg('event',`«${FACTIONS[fid].name}» уничтожена.`,'win');
    }
  });
}
function checkVictory(){
  if(state.gameOver) return;
  const total=Object.keys(state.stations).length;
  const mine=ownedStations(state.player).length;
  if(mine===total){
    state.gameOver=true;
    showModal('🏆 ПОБЕДА',`Ты захватил все ${total} станций!`,
      [{label:'Новая игра',action:()=>location.reload()}]);
    return;
  }
  if(mine===0){
    state.gameOver=true;
    showModal('💀 ПОРАЖЕНИЕ',`Фракция стёрта.`,
      [{label:'Новая игра',action:()=>location.reload()}]);
    return;
  }
  Object.keys(FACTIONS).forEach(fid=>{
    if(fid===state.player) return;
    if(!isFactionAlive(fid)) return;
    if(ownedStations(fid).length===total){
      state.gameOver=true;
      showModal('💀 ПОРАЖЕНИЕ',`«${FACTIONS[fid].name}» захватила всё.`,
        [{label:'Новая игра',action:()=>location.reload()}]);
    }
  });
}

/* -------- СПРАВКА / ЦЕЛЬ -------- */
function showHelp(){
  showModal('Справка',`
    <b>Меню (☰):</b> Дипломатия, Экономика, Армия, Арсенал, Цель.<br><br>
    <b>Карта:</b> 2 пальца — масштаб, 1 — перемещение, 2 тапа — сброс. Тап по станции/тоннелю — открыть правую панель.<br><br>
    <b>Станции:</b> производство, отряды, постройки.<br>
    <b>Тоннели:</b> 2 сегмента на путь. Захват, оборонительные постройки.<br><br>
    <b>Мутанты (🕷):</b> атакуют соседние тоннели и станции.<br><br>
    <b>⚔ Вечная война:</b> КЛ ↔ Рейх всегда воюют.<br><br>
    <b>Нападение врасплох:</b> −50⚖, мир невозможен навсегда.<br><br>
    <b>Экономика:</b> нажми на постройку — увидишь станции с ней и без. Быстрая постройка в один тап.<br><br>
    <b>Армия:</b> все гарнизоны и отряды. Оружие можно назначить и отрядам, и гарнизонам.
  `,[{label:'Понятно',action:closeModal}]);
}
function showGoal(){
  const f=FACTIONS[state.player];
  const done=checkGoalDone(state.player);
  showModal('🎯 Цель',`<b>${f.name}</b><br>
    <span style="color:#888;font-size:11px">${f.leader}</span><br><br>
    ${f.goalText}<br><br>
    ${done?'<span style="color:#69f0ae">✔ ВЫПОЛНЕНО</span>':'<span style="color:#ff8a80">✘ В процессе</span>'}`,
    [{label:'Ок',action:closeModal}]);
}

/* -------- INIT -------- */
initMapInteractions();
$('#btn-endturn').onclick=()=>{ if(!state.gameOver) endTurn(); };
$('#modal-bg').onclick=e=>{ if(e.target.id==='modal-bg') closeModal(); };
checkOrientation();