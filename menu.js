/* ============================================================
   MENU: главное меню в стиле Age of History II
   ============================================================ */

let selectedFactionForStart = null;

function openFactionSelect(){
  document.getElementById('main-menu').classList.add('hidden');
  document.getElementById('faction-select').classList.remove('hidden');
  renderFactionList();
}
function backToMainMenu(){
  document.getElementById('faction-select').classList.add('hidden');
  document.getElementById('main-menu').classList.remove('hidden');
  selectedFactionForStart = null;
}
function backToMenuFromGame(){
  if(!confirm('Вернуться в главное меню? Прогресс не сохранится.')) return;
  location.reload();
}

function renderFactionList(){
  const list = document.getElementById('fs-list');
  list.innerHTML = '';
  Object.entries(FACTIONS).forEach(([fid,f])=>{
    const el = document.createElement('div');
    el.className = 'fs-item';
    el.dataset.fid = fid;
    el.innerHTML = `
      <div class="fs-flag" style="background:${f.color}">${f.short}</div>
      <div class="fs-name">${f.name}</div>
    `;
    el.onclick = ()=>selectFactionInMenu(fid);
    list.appendChild(el);
  });
}

function selectFactionInMenu(fid){
  selectedFactionForStart = fid;
  document.querySelectorAll('.fs-item').forEach(e=>e.classList.toggle('active', e.dataset.fid===fid));
  const f = FACTIONS[fid];

  /* Стартовые станции */
  const startStations = STATIONS_DATA.filter(s=>START_OWNERS[s.id]===fid);
  const ownedTunnelCount = CONNECTIONS.filter(([a,b])=>{
    return START_OWNERS[a]===fid && START_OWNERS[b]===fid;
  }).length;

  /* Ресурсы */
  let res = {food:150, ammo:150, influence:80};
  if(fid==='hansa'){ res={food:220,ammo:220,influence:140}; }
  if(fid==='red'){ res={food:140,ammo:180,influence:100}; }
  if(fid==='bandits'){ res={food:120,ammo:170,influence:50}; }
  if(fid==='vdnh'){ res={food:180,ammo:150,influence:60}; }
  if(fid==='conf1905'){ res={food:180,ammo:140,influence:90}; }

  const info = document.getElementById('fs-info');
  info.innerHTML = `
    <div class="fs-info-banner" style="--fc:${f.color}">
      <div class="fs-info-flag" style="background:${f.color}">${f.short}</div>
      <div>
        <div class="fs-info-name">${f.name}</div>
        <div class="fs-info-leader">${f.leader}</div>
      </div>
    </div>

    <div class="fs-info-goal">
      <b>${f.abilityName}</b><br>
      ${f.desc}<br><br>
      <b>🎯 Цель:</b> ${f.goalText}
    </div>

    <div class="fs-info-section-title">СТАРТОВЫЕ РЕСУРСЫ</div>
    <div class="fs-stats">
      <div class="fs-stat">🍞 Еда<b>${res.food}</b></div>
      <div class="fs-stat">🔫 Патроны<b>${res.ammo}</b></div>
      <div class="fs-stat">⚖️ Влияние<b>${res.influence}</b></div>
    </div>

    <div class="fs-info-section-title">ВЛАДЕНИЯ (${startStations.length} ст. · ${ownedTunnelCount} тонн.)</div>
    <div class="fs-station-list">
      ${startStations.map(s=>`<span>${s.name}</span>`).join('') || '<span style="color:#666">Нет стартовых станций</span>'}
    </div>
  `;

  document.getElementById('fs-start-btn').classList.remove('disabled');
}

function confirmFaction(){
  if(!selectedFactionForStart){ toast('Выбери фракцию'); return; }
  startGame(selectedFactionForStart);
}

async function startGame(fid){
  await tryLockOrientation();
  document.getElementById('main-menu').classList.add('hidden');
  document.getElementById('faction-select').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  initGame(fid);
}

function showSettings(){
  showModal('Настройки', `
    <div style="line-height:1.6">
      Пока раздел в разработке.<br><br>
      Планируется: звук, сложность ИИ, скорость анимации, автосохранение.
    </div>
  `, [{label:'Закрыть', action:closeModal}]);
}
function showAbout(){
  showModal('Справка', `
    <b>Метро 2033: Война за Тоннели</b><br><br>
    Пошаговая стратегия по мотивам вселенной Metro 2033.<br><br>
    Выбери фракцию, захвати всё метро, отбейся от мутантов, веди дипломатию.<br><br>
    <b>Управление:</b><br>
    • 2 пальца — масштаб карты<br>
    • 1 палец — перемещение<br>
    • Тап по станции/тоннелю — открыть правую панель<br>
    • Кнопка ☰ слева сверху — меню: Дипломатия, Экономика, Армия, Арсенал
  `, [{label:'Понятно', action:closeModal}]);
}
function tryExit(){
  showModal('Покинуть игру', `
    Браузерная вкладка не может быть закрыта из JS.<br><br>
    Закрой вкладку или нажми Ctrl+W (Cmd+W на Mac).<br><br>
    На Android — кнопка "Назад" или свайп вниз.
  `, [{label:'Ок', action:closeModal}]);
}