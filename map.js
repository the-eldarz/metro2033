/* ============================================================
   MAP: зум/пан, рендер, элементы станций и тоннелей
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
  map.querySelectorAll('.station,.tunnel').forEach(e=>e.remove());
  const svg=$('#connections'); svg.innerHTML='';

  CONNECTIONS.forEach(([a,b])=>{
    const A=state.stations[a],B=state.stations[b]; if(!A||!B) return;
    const tA=Object.values(state.tunnels).find(t=>t.from===a&&t.to===b);
    const tB=Object.values(state.tunnels).find(t=>t.from===b&&t.to===a);
    const colA=tA&&tA.owner!=='neutral'?FACTIONS[tA.owner].color:'#222';
    const colB=tB&&tB.owner!=='neutral'?FACTIONS[tB.owner].color:'#222';
    const midX=(A.x+B.x)/2, midY=(A.y+B.y)/2;
    const l1=document.createElementNS('http://www.w3.org/2000/svg','line');
    l1.setAttribute('x1',A.x); l1.setAttribute('y1',A.y);
    l1.setAttribute('x2',midX); l1.setAttribute('y2',midY);
    l1.setAttribute('stroke',colA);
    l1.setAttribute('stroke-width',tA&&tA.owner!=='neutral'?'6':'3');
    l1.setAttribute('stroke-linecap','round');
    svg.appendChild(l1);
    const l2=document.createElementNS('http://www.w3.org/2000/svg','line');
    l2.setAttribute('x1',B.x); l2.setAttribute('y1',B.y);
    l2.setAttribute('x2',midX); l2.setAttribute('y2',midY);
    l2.setAttribute('stroke',colB);
    l2.setAttribute('stroke-width',tB&&tB.owner!=='neutral'?'6':'3');
    l2.setAttribute('stroke-linecap','round');
    svg.appendChild(l2);
  });

  Object.values(state.tunnels).forEach(t=>{
    const el=document.createElement('div');
    el.className='tunnel'; el.dataset.id=t.id;
    el.style.left=t.x+'px'; el.style.top=t.y+'px';
    updateTunnelEl(el,t);
    el.addEventListener('click',e=>{
      if(suppressClick){ e.stopPropagation(); return; }
      selectTunnel(t.id);
    });
    map.appendChild(el);
  });

  Object.values(state.stations).forEach(s=>{
    const el=document.createElement('div');
    el.className='station'; el.dataset.id=s.id;
    if(s.abandoned) el.classList.add('abandoned');
    el.style.left=s.x+'px'; el.style.top=s.y+'px';
    updateStationEl(el,s);
    if(state.selectedType==='station'&&state.selected===s.id) el.classList.add('selected');
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
  let extra='';
  if(s.buildings.includes('camp')) extra+='<div class="camp-ico">☠</div>';
  if(s.buildings.length>0&&!s.buildings.includes('camp')) extra+='<div class="build-ico">🏗</div>';
  if(s.mutantNest) extra+=`<div class="mutant-ico">🕷</div>`;
  if(s.garrisonWeapon) extra+=`<div class="weap-ico">🔫</div>`;
  if(s.owner!==state.player&&s.owner!=='neutral'){
    const rel=getRelation(state.player,s.owner);
    if(rel==='trade'||rel==='defensive')
      extra+=`<div class="ally-ico">${rel==='defensive'?'🛡':'💰'}</div>`;
  }
  el.innerHTML=`<div class="gar">${s.garrison}</div>
    <div class="name">${s.name.length>9?s.name.slice(0,8)+'.':s.name}</div>
    ${s.ring?'<div class="ring"></div>':''}${extra}`;
  if(s.scared>0) el.style.filter='brightness(.6) saturate(2)';
  else el.style.filter='';
}

function updateTunnelEl(el,t){
  const color=t.owner==='neutral'?'#333':FACTIONS[t.owner].color;
  el.style.borderColor=color;
  el.style.boxShadow=t.owner!=='neutral'?`0 0 8px ${color}88`:'none';
  if(t.mutantNest) el.classList.add('has-mutants');
  else el.classList.remove('has-mutants');
  const buildIco=t.buildings.length>0?'<div class="build-ico">🏗</div>':'';
  el.innerHTML=`<div class="tico">${t.garrison||''}</div>${buildIco}`;
}

/* -------- ВЫБОР -------- */
function selectStation(id){
  state.selected=id; state.selectedType='station';
  document.querySelectorAll('.station').forEach(e=>e.classList.toggle('selected',e.dataset.id===id));
  document.querySelectorAll('.tunnel').forEach(e=>e.classList.remove('selected'));
  openPanel();
  renderPanel();
}
function selectTunnel(id){
  state.selected=id; state.selectedType='tunnel';
  document.querySelectorAll('.tunnel').forEach(e=>e.classList.toggle('selected',e.dataset.id===id));
  document.querySelectorAll('.station').forEach(e=>e.classList.remove('selected'));
  openPanel();
  renderPanel();
}