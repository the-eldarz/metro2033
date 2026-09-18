/* ============================================================
   MAP: зум/пан, рендер карты, элементы станций и тоннелей
   ============================================================ */

const mapT={scale:1,tx:0,ty:0};
let touchState=null,suppressClick=false;

function applyMapTransform(){
  const m=document.getElementById('map');
  if(m) m.style.transform=`translate(${mapT.tx}px,${mapT.ty}px) scale(${mapT.scale})`;
}
function fitMap(){
  const wrap=document.getElementById('mapwrap'); if(!wrap) return;
  const w=wrap.clientWidth,h=wrap.clientHeight; if(w<=0||h<=0) return;
  const s=Math.min(w/MAP_W,h/MAP_H)*0.96;
  mapT.scale=s; mapT.tx=(w-MAP_W*s)/2; mapT.ty=(h-MAP_H*s)/2;
  applyMapTransform();
}
function initMapInteractions(){
  const wrap=document.getElementById('mapwrap');
  wrap.addEventListener('touchstart',e=>{
    if(e.touches.length===1){
      touchState={mode:'pan',startX:e.touches[0].clientX,startY:e.touches[0].clientY,
        startTx:mapT.tx,startTy:mapT.ty,moved:0};
    } else if(e.touches.length===2){
      const t0=e.touches[0],t1=e.touches[1];
      const d=Math.hypot(t0.clientX-t1.clientX,t0.clientY-t1.clientY);
      const r=wrap.getBoundingClientRect();
      touchState={mode:'pinch',startDist:d,startScale:mapT.scale,
        startTx:mapT.tx,startTy:mapT.ty,
        cx:(t0.clientX+t1.clientX)/2-r.left,cy:(t0.clientY+t1.clientY)/2-r.top,moved:0};
      e.preventDefault();
    }
  },{passive:false});
  wrap.addEventListener('touchmove',e=>{
    if(!touchState) return;
    if(touchState.mode==='pan'&&e.touches.length===1){
      const dx=e.touches[0].clientX-touchState.startX;
      const dy=e.touches[0].clientY-touchState.startY;
      touchState.moved=Math.max(touchState.moved,Math.hypot(dx,dy));
      mapT.tx=touchState.startTx+dx; mapT.ty=touchState.startTy+dy;
      applyMapTransform();
    } else if(touchState.mode==='pinch'&&e.touches.length===2){
      e.preventDefault();
      const t0=e.touches[0],t1=e.touches[1];
      const d=Math.hypot(t0.clientX-t1.clientX,t0.clientY-t1.clientY);
      const ns=Math.max(0.25,Math.min(5,touchState.startScale*d/touchState.startDist));
      const k=ns/touchState.startScale;
      mapT.tx=touchState.cx-k*(touchState.cx-touchState.startTx);
      mapT.ty=touchState.cy-k*(touchState.cy-touchState.startTy);
      mapT.scale=ns;
      touchState.moved=Math.max(touchState.moved,Math.abs(d-touchState.startDist));
      applyMapTransform();
    }
  },{passive:false});
  wrap.addEventListener('touchend',e=>{
    if(!touchState) return;
    if(e.touches.length===0){
      if(touchState.moved>10){ suppressClick=true; setTimeout(()=>suppressClick=false,250); }
      touchState=null;
    } else if(e.touches.length===1&&touchState.mode==='pinch'){
      touchState={mode:'pan',startX:e.touches[0].clientX,startY:e.touches[0].clientY,
        startTx:mapT.tx,startTy:mapT.ty,moved:touchState.moved};
    }
  },{passive:true});
  wrap.addEventListener('wheel',e=>{
    e.preventDefault();
    const r=wrap.getBoundingClientRect();
    const cx=e.clientX-r.left,cy=e.clientY-r.top;
    const ns=Math.max(0.25,Math.min(5,mapT.scale*(e.deltaY<0?1.15:0.87)));
    const k=ns/mapT.scale;
    mapT.tx=cx-k*(cx-mapT.tx); mapT.ty=cy-k*(cy-mapT.ty);
    mapT.scale=ns; applyMapTransform();
  },{passive:false});
  let lastTap=0;
  wrap.addEventListener('touchend',()=>{
    if(touchState&&touchState.moved>10) return;
    const now=Date.now();
    if(now-lastTap<300){ fitMap(); lastTap=0; } else lastTap=now;
  },{passive:true});
}

/* -------- РЕНДЕР КАРТЫ -------- */
function renderMap(){
  const map=$('#map');
  if(!map) return;
  map.querySelectorAll('.station,.tunnel-marker').forEach(e=>e.remove());
  const svg=$('#connections'); svg.innerHTML='';

  /* Отрисовка 3 сегментов на каждое соединение */
  CONNECTIONS.forEach(([a,b])=>{
    const A=state.stations[a], B=state.stations[b]; if(!A||!B) return;
    const pair = getTunnelPair(a, b);
    const tA = pair.A, tM = pair.M, tB = pair.B;

    const p1x = A.x + (B.x - A.x) / 3;
    const p1y = A.y + (B.y - A.y) / 3;
    const p2x = A.x + 2*(B.x - A.x) / 3;
    const p2y = A.y + 2*(B.y - A.y) / 3;

    /* Цвета сегментов */
    const colA = tA && tA.owner!=='neutral' ? FACTIONS[tA.owner].color : '#222';
    const colM = tM && tM.owner!=='neutral' ? FACTIONS[tM.owner].color : '#222';
    const colB = tB && tB.owner!=='neutral' ? FACTIONS[tB.owner].color : '#222';

    /* Толщина сегментов */
    const wA = tA && tA.owner!=='neutral' ? 6 : 3;
    const wM = tM && tM.owner!=='neutral' ? 7 : 3;
    const wB = tB && tB.owner!=='neutral' ? 6 : 3;

    /* Сегмент A: от A до p1 */
    const l1=document.createElementNS('http://www.w3.org/2000/svg','line');
    l1.setAttribute('x1',A.x); l1.setAttribute('y1',A.y);
    l1.setAttribute('x2',p1x); l1.setAttribute('y2',p1y);
    l1.setAttribute('stroke',colA);
    l1.setAttribute('stroke-width',wA);
    l1.setAttribute('stroke-linecap','round');
    if(tA && tA.owner==='neutral') l1.setAttribute('stroke-dasharray','4 6');
    svg.appendChild(l1);

    /* Сегмент M: от p1 до p2 */
    const l2=document.createElementNS('http://www.w3.org/2000/svg','line');
    l2.setAttribute('x1',p1x); l2.setAttribute('y1',p1y);
    l2.setAttribute('x2',p2x); l2.setAttribute('y2',p2y);
    l2.setAttribute('stroke',colM);
    l2.setAttribute('stroke-width',wM);
    l2.setAttribute('stroke-linecap','round');
    if(tM && tM.mutantNest) l2.setAttribute('stroke','#9c27b0');
    else if(tM && tM.owner==='neutral') l2.setAttribute('stroke-dasharray','4 6');
    svg.appendChild(l2);

    /* Сегмент B: от p2 до B */
    const l3=document.createElementNS('http://www.w3.org/2000/svg','line');
    l3.setAttribute('x1',p2x); l3.setAttribute('y1',p2y);
    l3.setAttribute('x2',B.x); l3.setAttribute('y2',B.y);
    l3.setAttribute('stroke',colB);
    l3.setAttribute('stroke-width',wB);
    l3.setAttribute('stroke-linecap','round');
    if(tB && tB.owner==='neutral') l3.setAttribute('stroke-dasharray','4 6');
    svg.appendChild(l3);

    /* Метки-разделители в центре каждого сегмента */
    const addSegMarker = (x, y, color, owner) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', 4);
      circle.setAttribute('fill', owner !== 'neutral' ? color : '#333');
      circle.setAttribute('stroke', '#0a0a0a');
      circle.setAttribute('stroke-width', 1.5);
      circle.style.pointerEvents = 'auto';
      circle.style.cursor = 'pointer';
      svg.appendChild(circle);
    };

    /* Ставим кликабельные маркеры в середине каждого сегмента */
    if(tA) {
      const mx = (A.x + p1x) / 2, my = (A.y + p1y) / 2;
      addSegMarker(mx, my, colA, tA.owner);
      /* Невидимый overlay для клика */
      const hit = document.createElementNS('http://www.w3.org/2000/svg','circle');
      hit.setAttribute('cx', mx); hit.setAttribute('cy', my);
      hit.setAttribute('r', 12); hit.setAttribute('fill', 'transparent');
      hit.style.cursor = 'pointer';
      hit.style.pointerEvents = 'auto';
      hit.addEventListener('click', () => selectTunnel(tA.id));
      svg.appendChild(hit);
    }
    if(tM) {
      const mx = (p1x + p2x) / 2, my = (p1y + p2y) / 2;
      addSegMarker(mx, my, colM, tM.owner);
      const hit = document.createElementNS('http://www.w3.org/2000/svg','circle');
      hit.setAttribute('cx', mx); hit.setAttribute('cy', my);
      hit.setAttribute('r', 14); hit.setAttribute('fill', 'transparent');
      hit.style.cursor = 'pointer';
      hit.style.pointerEvents = 'auto';
      hit.addEventListener('click', () => selectTunnel(tM.id));
      svg.appendChild(hit);
    }
    if(tB) {
      const mx = (p2x + B.x) / 2, my = (p2y + B.y) / 2;
      addSegMarker(mx, my, colB, tB.owner);
      const hit = document.createElementNS('http://www.w3.org/2000/svg','circle');
      hit.setAttribute('cx', mx); hit.setAttribute('cy', my);
      hit.setAttribute('r', 12); hit.setAttribute('fill', 'transparent');
      hit.style.cursor = 'pointer';
      hit.style.pointerEvents = 'auto';
      hit.addEventListener('click', () => selectTunnel(tB.id));
      svg.appendChild(hit);
    }
  });

  /* Станции */
  Object.values(state.stations).forEach(s=>{
    const el=document.createElement('div');
    el.className='station'; el.dataset.id=s.id;
    if(s.abandoned) el.classList.add('abandoned');
    el.style.left=s.x+'px'; el.style.top=s.y+'px';
    updateStationEl(el,s);
    if(state.selectedType==='station' && state.selected===s.id) el.classList.add('selected');
    el.addEventListener('click',e=>{
      if(suppressClick){ e.stopPropagation(); return; }
      selectStation(s.id);
    });
    map.appendChild(el);
  });
}

function updateStationEl(el,s){
  const color=s.owner==='neutral'?'var(--neutral)':FACTIONS[s.owner].color;
  el.style.color=color; el.style.borderColor=color;
  el.style.boxShadow=`0 0 8px ${color}55`;

  /* Полоски отрядов вокруг станции */
  const mySquads = state.squads.filter(q => q.stationId === s.id && q.owner === state.player);
  const enemySquads = state.squads.filter(q => q.stationId === s.id && q.owner !== state.player && q.owner !== 'neutral');
  const knownEnemySquads = enemySquads.filter(q => q.spied); /* Шпионаж */

  let squadBars = '';
  const totalBars = mySquads.length + (knownEnemySquads.length > 0 ? knownEnemySquads.length : 0);
  if(totalBars > 0){
    for(let i=0; i<Math.min(totalBars,5); i++){
      const isMine = i < mySquads.length;
      squadBars += `<div class="squad-bar ${isMine?'mine':'enemy'}"></div>`;
    }
  }

  /* Флаг фракции */
  let flagHtml = '';
  if(s.owner !== 'neutral' && FACTIONS[s.owner].flag){
    flagHtml = `<img class="station-flag" src="${FACTIONS[s.owner].flag}" alt="">`;
  }

  let extra='';
  if(s.buildings.includes('camp')) extra+='<div class="camp-ico">☠</div>';
  if(s.buildings.length>0&&!s.buildings.includes('camp')) extra+='<div class="build-ico">🏗</div>';
  if(s.mutantNest) extra+=`<div class="mutant-ico">${ICONS.spider?`<img src="${ICONS.spider}" class="ico-img">`:'🕷'}</div>`;
  if(s.garrisonWeapon) extra+=`<div class="weap-ico">🔫</div>`;
  if(s.owner!==state.player && s.owner!=='neutral'){
    const rel=getRelation(state.player, s.owner);
    if(rel==='trade'||rel==='defensive')
      extra+=`<div class="ally-ico">${rel==='defensive'?'🛡':'💰'}</div>`;
  }
  el.innerHTML=`<div class="gar">${s.garrison}</div>
    <div class="name">${s.name.length>9?s.name.slice(0,8)+'.':s.name}</div>
    ${s.ring?'<div class="ring"></div>':''}
    ${flagHtml}
    ${squadBars}
    ${extra}`;
  if(s.scared>0) el.style.filter='brightness(.6) saturate(2)';
  else el.style.filter='';
}

function updateTunnelEl(el,t){
  /* Больше не используется для отрисовки — тоннели теперь SVG-линии */
}

/* -------- ВЫБОР -------- */
function selectStation(id){
  state.selected=id; state.selectedType='station';
  document.querySelectorAll('.station').forEach(e=>e.classList.toggle('selected',e.dataset.id===id));
  document.querySelectorAll('.tunnel-marker').forEach(e=>e.classList.remove('selected'));
  openPanel();
  renderPanel();
}
function selectTunnel(id){
  state.selected=id; state.selectedType='tunnel';
  document.querySelectorAll('.tunnel-marker').forEach(e=>e.classList.toggle('selected',e.dataset.id===id));
  document.querySelectorAll('.station').forEach(e=>e.classList.remove('selected'));
  openPanel();
  renderPanel();
}