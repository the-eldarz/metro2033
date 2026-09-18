/* ============================================================
   CORE: утилиты, состояние, отношения, инициализация
   ============================================================ */

const $=s=>document.querySelector(s);
const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[Math.floor(Math.random()*a.length)];

/* -------- ОРИЕНТАЦИЯ -------- */
async function tryLockOrientation(){
  try{
    const el=document.documentElement;
    if(!document.fullscreenElement&&el.requestFullscreen) await el.requestFullscreen().catch(()=>{});
    if(screen.orientation&&screen.orientation.lock) await screen.orientation.lock('landscape').catch(()=>{});
  }catch(e){}
  checkOrientation();
}
function checkOrientation(){
  const p=window.innerHeight>window.innerWidth;
  const m=Math.min(window.innerWidth,window.innerHeight)<500;
  const ov=document.getElementById('rotate-overlay');
  if(!ov) return;
  if(p&&m) ov.classList.remove('hidden');
  else{
    ov.classList.add('hidden');
    if(!document.getElementById('app').classList.contains('hidden')) setTimeout(fitMap,80);
  }
}
window.addEventListener('resize',checkOrientation);
window.addEventListener('orientationchange',()=>setTimeout(checkOrientation,300));

/* -------- СОСТОЯНИЕ -------- */
const state={
  turn:1, player:null, selected:null, selectedType:null,
  gameOver:false, stations:{}, tunnels:{}, factions:{},
  log:[], relations:{}, betrayed:{}, squads:[], weaponStock:{},
  uiTab:'build', tunnelTab:'tbuild'
};

const REL_INFO={
  war:{label:'ВОЙНА',color:'#d32f2f',icon:'⚔'},
  neutral:{label:'НЕЙТРАЛИТЕТ',color:'#888',icon:'—'},
  peace:{label:'МИР',color:'#90caf9',icon:'🕊'},
  trade:{label:'ТОРГ. СОЮЗ',color:'#ffd54f',icon:'💰'},
  defensive:{label:'ОБОР. СОЮЗ',color:'#69f0ae',icon:'🛡'}
};

/* -------- ОТНОШЕНИЯ -------- */
function relKey(a,b){ return [a,b].sort().join('|'); }
function getRelation(a,b){
  if(a===b) return 'self';
  if(isEternalWar(a,b)) return 'war';
  return state.relations[relKey(a,b)]||'neutral';
}
function setRelation(a,b,r){
  if(a===b||isEternalWar(a,b)) return;
  state.relations[relKey(a,b)]=r;
}
function getBetrayed(a,b){ return !!state.betrayed[relKey(a,b)]; }
function setBetrayed(a,b){ state.betrayed[relKey(a,b)]=true; }
function isEternalWar(a,b){ return (a==='red'&&b==='reich')||(a==='reich'&&b==='red'); }

/* -------- ДОСТУП К ДАННЫМ -------- */
function ownedStations(fid){ return Object.values(state.stations).filter(s=>s.owner===fid); }
function ownedTunnels(fid){ return Object.values(state.tunnels).filter(t=>t.owner===fid); }
function totalSoldiers(fid){
  let sum=ownedStations(fid).reduce((s,x)=>s+x.garrison,0);
  sum+=ownedTunnels(fid).reduce((s,x)=>s+x.garrison,0);
  sum+=state.squads.filter(q=>q.owner===fid).reduce((s,q)=>s+q.size,0);
  return sum;
}
function isFactionAlive(fid){ return ownedStations(fid).length>0; }
function factionRes(fid){ return state.factions[fid]; }
function stationNeighbors(id){
  return CONNECTIONS.filter(([a,b])=>a===id||b===id).map(([a,b])=>a===id?b:a);
}
function tunnelsAtStation(sid){
  return Object.values(state.tunnels).filter(t=>t.from===sid||t.to===sid);
}
function stationSquads(sid){ return state.squads.filter(q=>q.stationId===sid); }
function powerRating(fid){
  const f=state.factions[fid]; if(!f) return 0;
  return totalSoldiers(fid)+ownedStations(fid).length*8+(f.ammo+f.food+f.influence)/30;
}

/* -------- ИНИЦИАЛИЗАЦИЯ -------- */
function initGame(playerFid){
  state.turn=1; state.player=playerFid; state.selected=null; state.selectedType=null;
  state.gameOver=false; state.log=[]; state.relations={}; state.betrayed={};
  state.squads=[]; state.weaponStock={}; state.uiTab='build'; state.tunnelTab='tbuild';

  /* Станции */
  state.stations={};
  STATIONS_DATA.forEach(sd=>{
    state.stations[sd.id]={
      id:sd.id,name:sd.name,x:sd.x,y:sd.y,ring:!!sd.ring,
      abandoned:!!sd.abandoned,
      owner:START_OWNERS[sd.id]||'neutral',
      garrison:0,population:20+rand(0,25),fort:0,scared:0,
      buildings:[],maxGarrison:60,
      mutantNest:MUTANT_NESTS[sd.id]||null,
      garrisonWeapon:null
    };
  });
  Object.values(state.stations).forEach(s=>{
    if(s.abandoned){ s.garrison=0; s.population=rand(2,8); s.owner='neutral'; }
    else if(s.mutantNest){ s.garrison=0; s.population=rand(5,15); s.owner='neutral'; }
    else if(s.owner==='neutral') s.garrison=8+rand(0,8);
    else if(s.owner==='hansa') s.garrison=10+rand(0,6);
    else if(s.owner==='red') s.garrison=14+rand(0,8);
    else s.garrison=12+rand(0,8);
  });

  /* Тоннели */
  state.tunnels={};
  TUNNELS_DATA.forEach(td=>{
    state.tunnels[td.id]={
      id:td.id,from:td.from,to:td.to,x:td.x,y:td.y,seg:td.seg,
      owner:'neutral',garrison:0,fort:0,buildings:[],
      mutantNest:MUTANT_NESTS[td.from+'|'+td.to]||null
    };
  });
  Object.values(state.tunnels).forEach(t=>{
    const fo=state.stations[t.from].owner;
    const to=state.stations[t.to].owner;
    if(fo!=='neutral'&&fo===to){ t.owner=fo; t.garrison=3; }
  });

  /* Фракции */
  state.factions={};
  Object.keys(FACTIONS).forEach(fid=>{
    const base={food:150,ammo:150,influence:80,alive:true,eliminated:false,goalDone:false};
    if(fid==='hansa'){ base.food=220;base.ammo=220;base.influence=140; }
    if(fid==='red'){ base.food=140;base.ammo=180;base.influence=100; }
    if(fid==='bandits'){ base.food=120;base.ammo=170;base.influence=50; }
    if(fid==='vdnh'){ base.food=180;base.ammo=150;base.influence=60; }
    if(fid==='conf1905'){ base.food=180;base.ammo=140;base.influence=90; }
    state.factions[fid]=base;
  });

  const fids=Object.keys(FACTIONS);
  fids.forEach(a=>fids.forEach(b=>{
    if(a!==b&&!isEternalWar(a,b)) setRelation(a,b,'neutral');
  }));
  setRelation('red','reich','war');

  state.weaponStock={knife:2,revolver:3,bastard:1};

  renderMap(); renderHeader(); renderPanel(); renderLog();
  logMsg('event',`Ход 1. Ты — ${FACTIONS[playerFid].leader}, лидер «${FACTIONS[playerFid].name}».`);
  logMsg('event',`Цель: ${FACTIONS[playerFid].goalText}`);
  logMsg('event',`⚔ КЛ и Рейх — вечные враги. Захватывай тоннели, отбивайся от мутантов.`);
  setTimeout(fitMap,50); setTimeout(fitMap,300);
}