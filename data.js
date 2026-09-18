/* ============================================================
   DATA: карта, тоннели, оружие, постройки, мутанты, фракции
   ============================================================ */

const MAP_W=1400, MAP_H=1000;

const STATIONS_DATA=[
  // КОЛЬЦО (ГАНЗА)
  {id:'novoslobodskaya',name:'Новослобод.',x:700,y:180,ring:true},
  {id:'prospekt_mira',  name:'Проспект Мира',x:855,y:230,ring:true},
  {id:'komsomolskaya',  name:'Комсомольская',x:960,y:350,ring:true},
  {id:'kurskaya',       name:'Курская',x:1000,y:500,ring:true},
  {id:'taganskaya',     name:'Таганская',x:960,y:650,ring:true},
  {id:'paveletskaya',   name:'Павелецкая',x:855,y:770,ring:true},
  {id:'dobryninskaya',  name:'Добрынинская',x:700,y:820,ring:true},
  {id:'oktyabrskaya',   name:'Октябрьская',x:545,y:770,ring:true},
  {id:'park_kultury',   name:'Парк Культуры',x:440,y:650,ring:true},
  {id:'kievskaya',      name:'Киевская',x:400,y:500,ring:true},
  {id:'krasnopresnenskaya',name:'Краснопресн.',x:440,y:350,ring:true},
  {id:'belorusskaya',   name:'Белорусская',x:545,y:230,ring:true},
  // КРАСНАЯ ЛИНИЯ
  {id:'bulvar_rokossovskogo',name:'Б. Рокоссовск.',x:1300,y:130},
  {id:'cherkizovskaya', name:'Черкизовская',x:1220,y:185},
  {id:'stalinckaya',    name:'Сталинская',x:1145,y:245},
  {id:'krasnoselskaya', name:'Красносельская',x:1050,y:300},
  {id:'krasnye_vorota', name:'Красные Ворота',x:915,y:420},
  {id:'kirovskaya',     name:'Кировская',x:855,y:465},
  {id:'dzerzhinskaya',  name:'Дзержинская',x:815,y:515},
  {id:'prospekt_marksa',name:'Пр. Маркса',x:765,y:540},
  {id:'pl_revolyucii',  name:'Пл. Революции',x:715,y:575},
  {id:'kropotkinskaya', name:'Кропоткинская',x:660,y:625},
  {id:'frunzenskaya',   name:'Фрунзенская',x:600,y:670},
  {id:'kommunisticheskaya',name:'Коммунистич.',x:515,y:705},
  {id:'teatralnaya',    name:'Театральная',x:805,y:575},
  // РЕЙХ
  {id:'tverskaya',      name:'Тверская',x:710,y:415},
  {id:'pushkinskaya',   name:'Пушкинская',x:815,y:385},
  {id:'chehovskaya',    name:'Чеховская',x:765,y:475},
  // ПОЛИС
  {id:'biblioteka',     name:'Библиотека',x:645,y:520},
  {id:'borovickaya',    name:'Боровицкая',x:590,y:580},
  {id:'aleksandrovsky_sad',name:'Алекс. Сад',x:570,y:515},
  {id:'arbatskaya',     name:'Арбатская',x:530,y:445},
  // БАНДИТЫ
  {id:'kitay_gorod',    name:'Китай-город',x:875,y:545},
  {id:'novokuzneckaya', name:'Новокузнецкая',x:920,y:605},
  {id:'tretyakovskaya', name:'Третьяковская',x:840,y:655},
  // ВДНХ
  {id:'vdnh',           name:'ВДНХ',x:760,y:100},
  {id:'alekseevskaya',  name:'Алексеевская',x:710,y:145},
  {id:'rizhskaya',      name:'Рижская',x:620,y:175},
  // КОНФЕДЕРАЦИЯ 1905
  {id:'barrikadnaya',   name:'Баррикадная',x:480,y:445},
  {id:'ulitsa_1905',    name:'Ул. 1905 года',x:415,y:390},
  {id:'begovaya',       name:'Беговая',x:355,y:335},
  // ДОПОЛНИТЕЛЬНЫЕ
  {id:'turgenevskaya',  name:'Тургеневская',x:775,y:295},
  {id:'polyanka',       name:'Полянка',x:685,y:645},
  {id:'serpuhovskaya',  name:'Серпуховская',x:735,y:735},
  {id:'partizanskaya',  name:'Партизанская',x:1180,y:60,abandoned:true},
  {id:'izmajlovskaya',  name:'Измайловская',x:1300,y:230,abandoned:true},
  {id:'myakinino',      name:'Мякинино',x:200,y:180,abandoned:true},
  {id:'kuntsevskaya',   name:'Кунцевская',x:130,y:280,abandoned:true},
  {id:'smolenskaya',    name:'Смоленская',x:465,y:560}
];

const STATION_MAP=Object.fromEntries(STATIONS_DATA.map(s=>[s.id,s]));
const RING_IDS=['novoslobodskaya','prospekt_mira','komsomolskaya','kurskaya','taganskaya',
  'paveletskaya','dobryninskaya','oktyabrskaya','park_kultury','kievskaya',
  'krasnopresnenskaya','belorusskaya'];

const CONNECTIONS=[
  ...RING_IDS.map((id,i)=>[id,RING_IDS[(i+1)%RING_IDS.length]]),
  ['bulvar_rokossovskogo','cherkizovskaya'],['cherkizovskaya','stalinckaya'],
  ['stalinckaya','krasnoselskaya'],['krasnoselskaya','komsomolskaya'],
  ['komsomolskaya','krasnye_vorota'],['krasnye_vorota','kirovskaya'],
  ['kirovskaya','dzerzhinskaya'],['dzerzhinskaya','prospekt_marksa'],
  ['prospekt_marksa','pl_revolyucii'],['pl_revolyucii','teatralnaya'],
  ['pl_revolyucii','kropotkinskaya'],['kropotkinskaya','frunzenskaya'],
  ['frunzenskaya','kommunisticheskaya'],
  ['tverskaya','pushkinskaya'],['pushkinskaya','chehovskaya'],
  ['chehovskaya','tverskaya'],['chehovskaya','pl_revolyucii'],
  ['pushkinskaya','dzerzhinskaya'],['tverskaya','belorusskaya'],
  ['biblioteka','borovickaya'],['biblioteka','aleksandrovsky_sad'],
  ['biblioteka','arbatskaya'],['arbatskaya','aleksandrovsky_sad'],
  ['borovickaya','aleksandrovsky_sad'],['biblioteka','pl_revolyucii'],
  ['arbatskaya','smolenskaya'],
  ['kitay_gorod','kirovskaya'],['kitay_gorod','novokuzneckaya'],
  ['kitay_gorod','taganskaya'],['novokuzneckaya','tretyakovskaya'],
  ['tretyakovskaya','oktyabrskaya'],['novokuzneckaya','paveletskaya'],
  ['kitay_gorod','teatralnaya'],
  ['vdnh','alekseevskaya'],['alekseevskaya','rizhskaya'],['rizhskaya','prospekt_mira'],
  ['barrikadnaya','ulitsa_1905'],['ulitsa_1905','begovaya'],['barrikadnaya','krasnopresnenskaya'],
  ['smolenskaya','kievskaya'],['smolenskaya','park_kultury'],
  ['kurskaya','komsomolskaya'],['kurskaya','kirovskaya'],
  ['belorusskaya','novoslobodskaya'],['novoslobodskaya','prospekt_mira'],
  ['krasnoselskaya','prospekt_mira'],
  ['turgenevskaya','suharevskaya'],['turgenevskaya','prospekt_mira'],
  ['polyanka','borovickaya'],['polyanka','tretyakovskaya'],['polyanka','dobryninskaya'],
  ['serpuhovskaya','dobryninskaya'],['serpuhovskaya','paveletskaya'],['serpuhovskaya','polyanka'],
  ['partizanskaya','cherkizovskaya'],['partizanskaya','izmajlovskaya'],
  ['izmajlovskaya','bulvar_rokossovskogo'],
  ['myakinino','begovaya'],['myakinino','kuntsevskaya'],['kuntsevskaya','krasnopresnenskaya'],
  ['chistye_prudy','turgenevskaya']
];

const ADJ={};
CONNECTIONS.forEach(([a,b])=>{ (ADJ[a]=ADJ[a]||[]).push(b); (ADJ[b]=ADJ[b]||[]).push(a); });

/* ============================================================
   ТОННЕЛИ — 3 сегмента на соединение
   Seg 1 (A) — подступ к станции A
   Seg 2 (M) — центральная часть (мутанты только здесь)
   Seg 3 (B) — подступ к станции B
   ============================================================ */
const TUNNELS_DATA=[];
CONNECTIONS.forEach(([a,b],i)=>{
  const A=STATION_MAP[a], B=STATION_MAP[b];
  if(!A||!B) return;
  const p1x=A.x+(B.x-A.x)/3, p1y=A.y+(B.y-A.y)/3;
  const p2x=A.x+2*(B.x-A.x)/3, p2y=A.y+2*(B.y-A.y)/3;

  TUNNELS_DATA.push({
    id:`t${i}_A`, pairId:`t${i}`, from:a, to:b, seg:1,
    x:(A.x+p1x)/2, y:(A.y+p1y)/2
  });
  TUNNELS_DATA.push({
    id:`t${i}_M`, pairId:`t${i}`, from:a, to:b, seg:2,
    x:(p1x+p2x)/2, y:(p1y+p2y)/2
  });
  TUNNELS_DATA.push({
    id:`t${i}_B`, pairId:`t${i}`, from:b, to:a, seg:3,
    x:(p2x+B.x)/2, y:(p2y+B.y)/2
  });
});
const TUNNEL_MAP=Object.fromEntries(TUNNELS_DATA.map(t=>[t.id,t]));

/* ============================================================
   ИКОНКИ (SVG DATA-URI)
   ============================================================ */
const ICONS = {
  food: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23d4a017" stroke-width="2"><path d="M12 2C8 2 5 5 5 9c0 4 3 7 7 7s7-3 7-7c0-4-3-7-7-7z"/><path d="M12 16v6"/></svg>',
  ammo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23d4a017" stroke-width="2"><path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z"/></svg>',
  influence: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23d4a017" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  soldier: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23d4a017" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2"/></svg>',
  station: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23d4a017" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 21V9h6v12"/></svg>',
  tunnel: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23d4a017" stroke-width="2"><path d="M3 21V8a9 9 0 0 1 18 0v13"/><path d="M8 21V12a4 4 0 0 1 8 0v9"/></svg>',
  weapon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23d4a017" stroke-width="2"><path d="M3 12h18"/><path d="M6 8v8"/><path d="M18 8v8"/></svg>',
  shield: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23d4a017" stroke-width="2"><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z"/></svg>',
  squad: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23d4a017" stroke-width="2"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 20v-2a4 4 0 0 1 4-4h4"/><path d="M18 20v-2a4 4 0 0 0-4-4h-4"/></svg>',
  spider: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%239c27b0" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 8v-4"/><path d="M8 12H4"/><path d="M16 12h4"/><path d="M12 16v4"/></svg>'
};

/* ============================================================
   ОРУЖИЕ (с иконками)
   ============================================================ */
const WEAPONS={
  knife:{name:'Нож',damage:15,accuracy:90,range:1,ammo:0,cost:5,desc:'Холодное оружие.',icon:null},
  throwing_knife:{name:'Метательный нож',damage:25,accuracy:70,range:3,ammo:0,cost:15,desc:'Бесшумное.',icon:null},
  revolver:{name:'Револьвер',damage:45,accuracy:75,range:15,ammo:6,cost:20,desc:'Надёжный, мощный.',icon:null},
  revolver_long:{name:'Револьвер (дл. ствол)',damage:60,accuracy:80,range:25,ammo:6,cost:35,desc:'Удлинённый ствол.',icon:null},
  bastard:{name:'Ублюдок',damage:22,accuracy:60,range:15,ammo:30,cost:30,desc:'Кустарный автомат.',icon:null},
  ak74:{name:'АК-74',damage:35,accuracy:80,range:35,ammo:30,cost:50,desc:'Надёжный автомат.',
    icon:'https://static.wikia.nocookie.net/metro2033/images/e/e8/AK-74M_isometric_M2033.png'},
  kalash2012:{name:'Калаш 2012',damage:40,accuracy:85,range:40,ammo:40,cost:75,desc:'Гибрид P90 и АК.',icon:null},
  vsv:{name:'ВСВ',damage:45,accuracy:90,range:45,ammo:20,cost:80,desc:'Бесшумный автомат.',icon:null},
  tihar:{name:'Тихарь',damage:30,accuracy:85,range:30,ammo:15,cost:45,desc:'Пневматика.',icon:null},
  uboinik:{name:'Убойник',damage:70,accuracy:55,range:15,ammo:6,cost:60,desc:'Дробовик.',icon:null},
  auto_shotgun:{name:'Авто дробовик',damage:90,accuracy:45,range:12,ammo:20,cost:100,desc:'Мощнейший.',icon:null},
  duplet:{name:'Дуплет',damage:55,accuracy:50,range:10,ammo:2,cost:25,desc:'Двустволка.',icon:null},
  ashot:{name:'Ашот',damage:80,accuracy:60,range:12,ammo:4,cost:70,desc:'Огромный урон.',icon:null},
  bulldog:{name:'Бульдог',damage:65,accuracy:82,range:35,ammo:20,cost:90,desc:'Ваншот в голову.',icon:null},
  helsing:{name:'Хельсинг',damage:75,accuracy:88,range:40,ammo:6,cost:85,desc:'Арбалет.',icon:null},
  valve:{name:'Вентиль',damage:110,accuracy:95,range:60,ammo:5,cost:120,desc:'Снайперка.',icon:null},
  flamethrower:{name:'Огнемёт',damage:85,accuracy:40,range:8,ammo:30,cost:110,desc:'Урон по площади.',icon:null}
};

/* ============================================================
   ПОСТРОЙКИ СТАНЦИЙ
   ============================================================ */
const BUILDINGS={
  mushroom_farm:{name:'Грибная ферма',cost:{food:0,ammo:40,influence:0},effect:'food',value:8,desc:'+8🍞/ход',icon:null},
  ammo_workshop:{name:'Оружейная мастерская',cost:{food:0,ammo:80,influence:20},effect:'ammo',value:6,desc:'+6⚡/ход, производство оружия',icon:null},
  generator:{name:'Генератор',cost:{food:30,ammo:60,influence:10},effect:'influence',value:4,desc:'+4⚖/ход',icon:null},
  fortifications:{name:'Укрепления',cost:{food:0,ammo:70,influence:0},effect:'fort',value:2,desc:'+2 к защите',icon:null},
  hospital:{name:'Госпиталь',cost:{food:50,ammo:50,influence:30},effect:'heal',value:3,desc:'+восстановление',icon:null},
  water_filter:{name:'Фильтр воды',cost:{food:60,ammo:30,influence:20},effect:'population',value:4,desc:'+4 населения/ход',icon:null},
  radio:{name:'Радиостанция',cost:{food:0,ammo:40,influence:50},effect:'influence_special',value:6,desc:'+6⚖/ход',icon:null},
  barracks:{name:'Казарма',cost:{food:60,ammo:60,influence:0},effect:'garrison_cap',value:10,desc:'+10 к гарнизону',icon:null},
  camp:{name:'Концлагерь',cost:{food:0,ammo:100,influence:40},effect:'camp',value:3,desc:'Только Рейх',icon:null}
};

const TUNNEL_BUILDINGS={
  barricade:{name:'Баррикада',cost:{ammo:30,food:10},effect:'fort',value:2,desc:'+2 к защите сегмента',icon:null},
  mg_nest:{name:'Пулемётная точка',cost:{ammo:60,food:20},effect:'fort',value:3,desc:'+3 к защите',icon:null},
  minefield:{name:'Минное поле',cost:{ammo:50,food:0},effect:'damage',value:20,desc:'20 урона атакующим',icon:null},
  searchlight:{name:'Прожектор',cost:{ammo:40,food:20},effect:'anti_spider',value:1,desc:'Отпугивает пауков',icon:null},
  ammo_depot:{name:'Склад боеприпасов',cost:{ammo:70,food:30},effect:'ammo',value:2,desc:'+2⚡/ход',icon:null},
  checkpoint:{name:'КПП',cost:{ammo:80,food:40},effect:'block',value:1,desc:'Блокирует проход врагам',icon:null},
  gas_trap:{name:'Газовая ловушка',cost:{ammo:90,food:0},effect:'damage',value:35,desc:'Только Рейх. 35 урона',icon:null},
  hidden_exit:{name:'Тайный выход',cost:{ammo:50,food:50},effect:'escape',value:1,desc:'Отступление без потерь',icon:null}
};

/* ============================================================
   МУТАНТЫ (с иконками)
   ============================================================ */
const MUTANTS={
  common_nosalis:{name:'Обычный носач',group:'Носачи',
    hp:30,damage:12,pack:true,minP:3,maxP:6,lightFear:false,
    desc:'Безволосый, розоватая кожа, вытянутая морда, кривые клыки. Быстр, ходит группами.',
    icon:'https://static.wikia.nocookie.net/metro2033/images/f/fc/NosalisUndercityStandard.png'},
  dark_nosalis:{name:'Тёмный носач',group:'Носачи',
    hp:70,damage:25,pack:true,minP:2,maxP:4,lightFear:false,
    desc:'Чёрная шерсть, огромная крокодилья пасть. Вожак стаи.',
    icon:'https://static.wikia.nocookie.net/metro2033/images/f/fc/NosalisUndercityStandard.png'},
  winged_nosalis:{name:'Крылатый носач',group:'Носачи',
    hp:45,damage:18,pack:true,minP:3,maxP:5,lightFear:false,
    desc:'Прыгает на большие расстояния. Встречается редко.',
    icon:'https://static.wikia.nocookie.net/metro2033/images/f/fc/NosalisUndercityStandard.png'},
  lurker:{name:'Сталкер (падальщик)',group:'Сталкеры',
    hp:25,damage:8,pack:true,minP:4,maxP:8,lightFear:false,
    desc:'Грызун, живёт в узких проходах. Питается трупами.',
    icon:null},
  kikimora:{name:'Кикимора',group:'Сталкеры',
    hp:20,damage:7,pack:true,minP:5,maxP:10,lightFear:false,
    desc:'Потомок крыс. Быстра, многочисленна.',
    icon:null},
  spiderbug:{name:'Жукопаук',group:'Пауки',
    hp:55,damage:30,pack:true,minP:2,maxP:4,lightFear:true,
    desc:'Гигантский паук. Боится света.',
    icon:'https://static.wikia.nocookie.net/metro2033/images/5/5f/Tkach_-_Spider-scorp.jpg'},
  giant_spider:{name:'Паук-матка',group:'Пауки',
    hp:150,damage:50,pack:false,minP:1,maxP:1,lightFear:true,
    desc:'Легендарный гигантский паук. Смертельно опасен.',
    icon:'https://static.wikia.nocookie.net/metro2033/images/5/5f/Tkach_-_Spider-scorp.jpg'},
  shrimp:{name:'Креветка',group:'Креветки',
    hp:60,damage:22,pack:true,minP:2,maxP:3,lightFear:false,aquatic:true,
    desc:'Хитиновый мутант из затопленных тоннелей. Крепкий панцирь.',
    icon:'https://static.wikia.nocookie.net/metro2033/images/1/1b/Krewetki.png'}
};

const MUTANT_NESTS={
  'rizhskaya|prospekt_mira':'kikimora',
  'chistye_prudy|turgenevskaya':'dark_nosalis',
  'kitay_gorod|taganskaya':'dark_nosalis',
  'partizanskaya|izmajlovskaya':'spiderbug',
  'myakinino|kuntsevskaya':'giant_spider',
  'paveletskaya|avtozavodskaya':'shrimp',
  'smolenskaya|kievskaya':'lurker',
  'polyanka|borovickaya':'common_nosalis',
  'novokuzneckaya|tretyakovskaya':'lurker'
};

const MUTANT_STATION_NESTS={
  'partizanskaya':'kikimora',
  'izmajlovskaya':'spiderbug',
  'myakinino':'common_nosalis',
  'kuntsevskaya':'dark_nosalis'
};

/* ============================================================
   ФРАКЦИИ (с флагами)
   ============================================================ */
const FACTIONS={
  red:{name:'Красная Линия',short:'КЛ',color:'#d32f2f',leader:'Генсек Максим Москвин',
    desc:'Коммунизм. Экспансия.',goalText:'Диктатура: 150 бойцов',abilityName:'Всеобщая мобилизация',
    flag:'https://static.wikia.nocookie.net/metro2033/images/7/7b/FlagofRedLine.png'},
  reich:{name:'Четвёртый Рейх',short:'Р',color:'#78909c',leader:'Фюрер Евгений Петренко',
    desc:'Нео-нацизм. Террор.',goalText:'Окончательное решение: уничтожить Красную Линию',abilityName:'Карательные акции',
    flag:'https://static.wikia.nocookie.net/metro2033/images/3/3f/FourthReichTexture1.png'},
  hansa:{name:'Ганза',short:'Г',color:'#f9a825',leader:'Президент Валерий Логинов',
    desc:'Торговая империя Кольца.',goalText:'Золотое кольцо: все 12 станций Кольца',abilityName:'Торговый караван',
    flag:'https://static.wikia.nocookie.net/metro2033/images/3/3a/HanzaFront.png'},
  polis:{name:'Полис',short:'П',color:'#1976d2',leader:'Совет Полиса',
    desc:'Наука и культура.',goalText:'Хранители: 400🍞 и 400⚡',abilityName:'Дипломатия',
    flag:'https://static.wikia.nocookie.net/metro2033/images/8/8e/Polis_logo.png'},
  bandits:{name:'Бандиты',short:'Б',color:'#8d6e63',leader:'Барон',
    desc:'Криминальные банды.',goalText:'Крысиный король: 700⚡',abilityName:'Грабёж',
    flag:null},
  vdnh:{name:'Содружество ВДНХ',short:'ВД',color:'#26a69a',leader:'Александр «Сухой» Алексеевич',
    desc:'Северный форпост.',goalText:'Северный щит: 3 стартовые + 5 всего',abilityName:'Северный рынок',
    flag:null},
  conf1905:{name:'Конфедерация 1905',short:'К1905',color:'#ab47bc',leader:'Совет трёх',
    desc:'Западный союз.',goalText:'Западный союз: Киевская и Краснопресненская',abilityName:'Свободная торговля',
    flag:null}
};

const START_OWNERS={
  'novoslobodskaya':'hansa','prospekt_mira':'hansa','komsomolskaya':'hansa',
  'kurskaya':'hansa','taganskaya':'hansa','paveletskaya':'hansa',
  'dobryninskaya':'hansa','oktyabrskaya':'hansa','park_kultury':'hansa',
  'kievskaya':'hansa','krasnopresnenskaya':'hansa','belorusskaya':'hansa',
  'bulvar_rokossovskogo':'red','cherkizovskaya':'red','stalinckaya':'red',
  'krasnoselskaya':'red','krasnye_vorota':'red','kirovskaya':'red',
  'dzerzhinskaya':'red','prospekt_marksa':'red','pl_revolyucii':'red',
  'kropotkinskaya':'red','frunzenskaya':'red','kommunisticheskaya':'red','teatralnaya':'red',
  'tverskaya':'reich','pushkinskaya':'reich','chehovskaya':'reich',
  'biblioteka':'polis','borovickaya':'polis','aleksandrovsky_sad':'polis','arbatskaya':'polis',
  'kitay_gorod':'bandits','novokuzneckaya':'bandits','tretyakovskaya':'bandits',
  'vdnh':'vdnh','alekseevskaya':'vdnh','rizhskaya':'vdnh',
  'barrikadnaya':'conf1905','ulitsa_1905':'conf1905','begovaya':'conf1905'
};