/* ============================================================
   КАРТА (расширенная)
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
  // КРАСНАЯ ЛИНИЯ (Сокольническая)
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
  // НОВЫЕ СТАНЦИИ
  {id:'turgenevskaya',  name:'Тургеневская',x:775,y:295},      // между Чистыми прудами и Сухаревской
  {id:'polyanka',       name:'Полянка',x:685,y:645},            // юг центра
  {id:'serpuhovskaya',  name:'Серпуховская',x:735,y:735},       // юг кольца
  {id:'partizanskaya',  name:'Партизанская',x:1180,y:60,abandoned:true},   // заброшенная
  {id:'izmajlovskaya',  name:'Измайловская',x:1300,y:230,abandoned:true},  // заброшенная
  {id:'myakinino',      name:'Мякинино',x:200,y:180,abandoned:true},       // заброшенная
  {id:'kuntsevskaya',   name:'Кунцевская',x:130,y:280,abandoned:true},     // заброшенная
  {id:'smolenskaya',    name:'Смоленская',x:465,y:560}          // без Спарты, теперь нейтрал
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
  ['smolenskaya','kievskaya'],['smolenskaya','park_pobedy'],['park_pobedy','kievskaya'],
  ['kurskaya','komsomolskaya'],['kurskaya','kirovskaya'],
  ['belorusskaya','novoslobodskaya'],['novoslobodskaya','prospekt_mira'],
  ['krasnoselskaya','prospekt_mira'],
  // Новые связи
  ['chistye_prudy','turgenevskaya'],['turgenevskaya','suharevskaya'],
  ['turgenevskaya','prospekt_mira'],
  ['polyanka','borovickaya'],['polyanka','tretyakovskaya'],['polyanka','dobryninskaya'],
  ['serpuhovskaya','dobryninskaya'],['serpuhovskaya','paveletskaya'],['serpuhovskaya','polyanka'],
  ['partizanskaya','cherkizovskaya'],['partizanskaya','izmajlovskaya'],
  ['izmajlovskaya','bulvar_rokossovskogo'],
  ['myakinino','begovaya'],['myakinino','kuntsevskaya'],['kuntsevskaya','krasnopresnenskaya']
];

// Псевдоним для устаревших ссылок
CONNECTIONS.push(['chistye_prudy','suharevskaya']);

/* ============================================================
   ТОННЕЛИ — 2 сегмента на каждое соединение
   ============================================================ */
const TUNNELS_DATA=[];
CONNECTIONS.forEach(([a,b],i)=>{
  const A=STATION_MAP[a], B=STATION_MAP[b];
  if(!A||!B) return;
  const midX=(A.x+B.x)/2, midY=(A.y+B.y)/2;
  TUNNELS_DATA.push({
    id:`t${i}_A`,
    from:a, to:b,
    x:(A.x+midX)/2, y:(A.y+midY)/2,
    seg:1
  });
  TUNNELS_DATA.push({
    id:`t${i}_B`,
    from:b, to:a,
    x:(B.x+midX)/2, y:(B.y+midY)/2,
    seg:2
  });
});

const TUNNEL_MAP=Object.fromEntries(TUNNELS_DATA.map(t=>[t.id,t]));

/* ============================================================
   КАНОН: ГНЁЗДА МУТАНТОВ
   ============================================================ */
// Привязка: id тоннеля или станции → тип мутантов
const MUTANT_NESTS={
  // Тоннели
  'rizhskaya|prospekt_mira':'kikimora',      // Проклятый тоннель
  'chistye_prudy|turgenevskaya':'dark_nosalis', // Тургеневская, чёрные упыри
  'kitay_gorod|taganskaya':'dark_nosalis',   // «Чёрная дыра»
  'partizanskaya|izmajlovskaya':'spiderbug', // пауки у Партизанской
  'myakinino|kuntsevskaya':'giant_spider',   // гигантский паук
  // Станции
  'partizanskaya':'kikimora',
  'izmajlovskaya':'spiderbug',
  'myakinino':'common_nosalis',
  'kuntsevskaya':'dark_nosalis'
};

/* ============================================================
   ОРУЖИЕ
   ============================================================ */
const WEAPONS={
  knife:{name:'Нож',damage:15,accuracy:90,range:1,ammo:0,cost:5,desc:'Холодное оружие. Бесшумно.'},
  throwing_knife:{name:'Метательный нож',damage:25,accuracy:70,range:3,ammo:0,cost:15,desc:'Бесшумное.'},
  revolver:{name:'Револьвер',damage:45,accuracy:75,range:15,ammo:6,cost:20,desc:'Надёжный, мощный.'},
  revolver_long:{name:'Револьвер (дл. ствол)',damage:60,accuracy:80,range:25,ammo:6,cost:35,desc:'Удлинённый ствол.'},
  bastard:{name:'Ублюдок',damage:22,accuracy:60,range:15,ammo:30,cost:30,desc:'Кустарный автомат.'},
  ak74:{name:'АК-74',damage:35,accuracy:80,range:35,ammo:30,cost:50,desc:'Надёжный автомат.'},
  kalash2012:{name:'Калаш 2012',damage:40,accuracy:85,range:40,ammo:40,cost:75,desc:'Гибрид P90 и АК.'},
  vsv:{name:'ВСВ',damage:45,accuracy:90,range:45,ammo:20,cost:80,desc:'Бесшумный автомат.'},
  tihar:{name:'Тихарь',damage:30,accuracy:85,range:30,ammo:15,cost:45,desc:'Пневматика, бесшумно.'},
  uboinik:{name:'Убойник',damage:70,accuracy:55,range:15,ammo:6,cost:60,desc:'Дробовик.'},
  auto_shotgun:{name:'Авто дробовик',damage:90,accuracy:45,range:12,ammo:20,cost:100,desc:'Мощнейший.'},
  duplet:{name:'Дуплет',damage:55,accuracy:50,range:10,ammo:2,cost:25,desc:'Двустволка.'},
  ashot:{name:'Ашот',damage:80,accuracy:60,range:12,ammo:4,cost:70,desc:'Огромный урон.'},
  bulldog:{name:'Бульдог',damage:65,accuracy:82,range:35,ammo:20,cost:90,desc:'Ваншот в голову.'},
  helsing:{name:'Хельсинг',damage:75,accuracy:88,range:40,ammo:6,cost:85,desc:'Арбалет.'},
  valve:{name:'Вентиль',damage:110,accuracy:95,range:60,ammo:5,cost:120,desc:'Снайперка.'},
  flamethrower:{name:'Огнемёт',damage:85,accuracy:40,range:8,ammo:30,cost:110,desc:'Урон по площади.'}
};

/* ============================================================
   ПОСТРОЙКИ — станции
   ============================================================ */
const BUILDINGS={
  mushroom_farm:{name:'Грибная ферма',cost:{food:0,ammo:40,influence:0},effect:'food',value:8,desc:'+8🍞/ход'},
  ammo_workshop:{name:'Оружейная мастерская',cost:{food:0,ammo:80,influence:20},effect:'ammo',value:6,desc:'+6⚡/ход, производство оружия'},
  generator:{name:'Генератор',cost:{food:30,ammo:60,influence:10},effect:'influence',value:4,desc:'+4⚖/ход'},
  fortifications:{name:'Укрепления',cost:{food:0,ammo:70,influence:0},effect:'fort',value:2,desc:'+2 к защите'},
  hospital:{name:'Госпиталь',cost:{food:50,ammo:50,influence:30},effect:'heal',value:3,desc:'+восстановление'},
  water_filter:{name:'Фильтр воды',cost:{food:60,ammo:30,influence:20},effect:'population',value:4,desc:'+4 населения/ход'},
  radio:{name:'Радиостанция',cost:{food:0,ammo:40,influence:50},effect:'influence_special',value:6,desc:'+6⚖/ход'},
  barracks:{name:'Казарма',cost:{food:60,ammo:60,influence:0},effect:'garrison_cap',value:10,desc:'+10 к гарнизону'},
  camp:{name:'Концлагерь',cost:{food:0,ammo:100,influence:40},effect:'camp',value:3,desc:'Только Рейх'}
};

/* ============================================================
   ПОСТРОЙКИ — только военные для тоннелей
   ============================================================ */
const TUNNEL_BUILDINGS={
  barricade:{name:'Баррикада',cost:{ammo:30,food:10},effect:'fort',value:2,desc:'+2 к защите сегмента'},
  mg_nest:{name:'Пулемётная точка',cost:{ammo:60,food:20},effect:'fort',value:3,desc:'+3 к защите, авто-огонь'},
  minefield:{name:'Минное поле',cost:{ammo:50,food:0},effect:'damage',value:20,desc:'20 урона атакующим'},
  searchlight:{name:'Прожектор',cost:{ammo:40,food:20},effect:'anti_spider',value:1,desc:'Отпугивает пауков'},
  ammo_depot:{name:'Склад боеприпасов',cost:{ammo:70,food:30},effect:'ammo',value:2,desc:'+2⚡/ход фракции'},
  checkpoint:{name:'КПП',cost:{ammo:80,food:40},effect:'block',value:1,desc:'Блокирует проход врагам'},
  gas_trap:{name:'Газовая ловушка',cost:{ammo:90,food:0},effect:'damage',value:35,desc:'Только Рейх. 35 урона'}
};

/* ============================================================
   МУТАНТЫ (канон)
   ============================================================ */
const MUTANTS={
  common_nosalis:{name:'Обычный носалис',hp:30,damage:12,pack:true,minP:3,maxP:6,
    desc:'Упырь-одиночка. Обычная угроза тоннелей.'},
  dark_nosalis:{name:'Тёмный носалис',hp:70,damage:25,pack:true,minP:2,maxP:4,
    desc:'Сильнее и умнее. Стаи чёрных упырей.'},
  winged_nosalis:{name:'Крылатый носалис',hp:45,damage:18,pack:true,minP:3,maxP:5,
    desc:'Прыгает на большие расстояния.'},
  kikimora:{name:'Кикимора',hp:20,damage:8,pack:true,minP:4,maxP:8,
    desc:'Потомок крыс. Быстрая, многочисленная.'},
  spiderbug:{name:'Жукопаук',hp:55,damage:30,pack:true,minP:2,maxP:4,lightFear:true,
    desc:'Боится света. Занимает заброшенные тоннели.'},
  giant_spider:{name:'Паук-матка',hp:150,damage:50,pack:false,minP:1,maxP:1,lightFear:true,
    desc:'Легендарный гигантский паук.'}
};

/* ============================================================
   ФРАКЦИИ
   ============================================================ */
const FACTIONS={
  red:{name:'Красная Линия',short:'КЛ',color:'#d32f2f',leader:'Генсек Максим Москвин',
    desc:'Коммунизм. Экспансия.',goalText:'Диктатура: 150 бойцов',abilityName:'Всеобщая мобилизация'},
  reich:{name:'Четвёртый Рейх',short:'Р',color:'#78909c',leader:'Фюрер Евгений Петренко',
    desc:'Нео-нацизм. Террор.',goalText:'Окончательное решение: уничтожить Красную Линию',abilityName:'Карательные акции'},
  hansa:{name:'Ганза',short:'Г',color:'#f9a825',leader:'Президент Валерий Логинов',
    desc:'Торговая империя Кольца.',goalText:'Золотое кольцо: все 12 станций Кольца',abilityName:'Торговый караван'},
  polis:{name:'Полис',short:'П',color:'#1976d2',leader:'Совет Полиса',
    desc:'Наука и культура.',goalText:'Хранители: 400🍞 и 400⚡',abilityName:'Дипломатия'},
  bandits:{name:'Бандиты',short:'Б',color:'#8d6e63',leader:'Барон',
    desc:'Криминальные банды.',goalText:'Крысиный король: 700⚡',abilityName:'Грабёж'},
  vdnh:{name:'Содружество ВДНХ',short:'ВД',color:'#26a69a',leader:'Александр «Сухой» Алексеевич',
    desc:'Северный форпост.',goalText:'Северный щит: 3 стартовые + 5 всего',abilityName:'Северный рынок'},
  conf1905:{name:'Конфедерация 1905',short:'К1905',color:'#ab47bc',leader:'Совет трёх',
    desc:'Западный союз.',goalText:'Западный союз: Киевская и Краснопресненская',abilityName:'Свободная торговля'}
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
  // turgenevskaya, polyanka, serpuhovskaya — нейтральные
  // партизанская, измайловская, мякинино, кунцевская — заброшенные (мутанты)
};

const ABANDONED_STATIONS=['partizanskaya','izmajlovskaya','myakinino','kuntsevskaya'];