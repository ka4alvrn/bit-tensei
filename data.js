const START_YEAR = 407;
const CALAMITY_YEAR = 417; // 417 г. — Год Катаклизма Маны провинции Фитоа

const SWORD_RANKS = ["Нет", "Новичок", "Рядовой 🥉", "Святой 🌟", "Королевский 👑", "Император ⚡", "Бог ⚔️"];
const MAGIC_RANKS = ["Новичок", "Рядовой 🥉", "Святой 🌟", "Королевский 👑", "Император ⚡", "Бог 🔮"];

const ADVENTURER_RANKS = ["F", "E", "D", "C", "B", "A", "S"];
const ADVENTURER_REQ = { F: 0, E: 30, D: 80, C: 180, B: 380, A: 750, S: 1500 };

const GENERATION_CP_CAPS = {
  1: 45000,
  2: 140000,
  3: 400000,
  4: 1200000,
  5: 9999999
};

const RACES = {
  human: { id: "human", name: "Человек", maxAge: 75, desc: "Быстро обучаются, универсальны во всем.", bonus: { baseMana: 25, hp: 0, int: 5, coins: 50, manaMod: 1.0 } },
  demon: { id: "demon", name: "Демон", maxAge: 220, desc: "Огромный сосуд маны с рождения, выносливость, долголетие.", bonus: { baseMana: 80, hp: 35, int: 2, coins: 15, manaMod: 1.6 } },
  beast: { id: "beast", name: "Зверочеловек", maxAge: 95, desc: "Острый нюх, дикая реакция в ближнем бою.", bonus: { baseMana: 20, hp: 25, swordGod: 25, coins: 25, manaMod: 0.9 } },
  elf: { id: "elf", name: "Эльф / Полуэльф", maxAge: 350, desc: "Древнейшие хранители знаний и глубокое сродство с маной.", bonus: { baseMana: 60, hp: -10, int: 12, coins: 40, manaMod: 1.4 } },
  speld: { id: "speld", name: "Спард", maxAge: 180, desc: "Алый камень во лбу, грозные воины смерти.", bonus: { baseMana: 30, hp: 45, swordGod: 35, northGod: 20, coins: 10, manaMod: 1.0 } },
  dwarf: { id: "dwarf", name: "Гном / Дворф", maxAge: 130, desc: "Мастера кузнечного дела и артефактов.", bonus: { baseMana: 15, hp: 40, northGod: 25, coins: 80, manaMod: 0.8 } }
};

// Демонические Глаза Киширики
const DEMON_EYES = {
  foresight: { id: "foresight", name: "Глаз Предвидения 👁️", desc: "+35% шанс уклонения от любых атак в бою, +4500 БМ.", cp: 4500, dodgeChance: 0.35 },
  mana_sight: { id: "mana_sight", name: "Глаз Маны 🔮", desc: "Видит потоки маны. Иммунитет к ловушкам в лабиринтах, +4000 БМ.", cp: 4000, trapImmune: true },
  appraisal: { id: "appraisal", name: "Глаз Оценки 📜", desc: "Раскрывает слабые места врагов (+30% урон магией и мечом), +3500 БМ.", cp: 3500, damageBonus: 1.3 },
  clarity: { id: "clarity", name: "Глаз Дальнего Взора 🎯", desc: "Сверхзрение на километры. Точность атак 100%, +3000 БМ.", cp: 3000, alwaysHit: true }
};

// Должности и постоянная работа по регионам с рангами
const REGIONAL_JOBS = {
  asura: [
    {
      id: "asura_guard", name: "Королевская Гвардия Асуры",
      ranks: [
        { title: "Новобранец гарнизона", salary: 25, minAge: 14, minSword: 20, desc: "Патрулирование рыночных площадей." },
        { title: "Городской страж", salary: 55, minAge: 16, minSword: 50, desc: "Охрана внутренних ворот Роа." },
        { title: "Рыцарь Первого круга", salary: 140, minAge: 20, minSword: 120, desc: "Эскорт дворянских карет." },
        { title: "Капитан Королевской Гвардии", salary: 380, minAge: 25, minSword: 300, desc: "Командование батальоном столицы Арс." },
        { title: "Лорд-Командующий Армии Асуры", salary: 950, minAge: 32, minSword: 600, desc: "Высший военный чин королевства." }
      ]
    },
    {
      id: "asura_bureaucrat", name: "Королевское Казначейство",
      ranks: [
        { title: "Младший переписчик", salary: 30, minAge: 14, minInt: 20, desc: "Сортировка налоговых свитков." },
        { title: "Податной инспектор", salary: 70, minAge: 18, minInt: 45, desc: "Сбор податей с провинций." },
        { title: "Аудитор Короны", salary: 180, minAge: 24, minInt: 90, desc: "Ревизия дворянских имений." },
        { title: "Главный Казначей Асуры", salary: 600, minAge: 30, minInt: 180, desc: "Управление государственным золотым запасом." }
      ]
    }
  ],
  ranoa: [
    {
      id: "ranoa_researcher", name: "Исследовательский Институт Академии",
      ranks: [
        { title: "Лаборант алхимика", salary: 35, minAge: 13, minMagic: 30, desc: "Подготовка кристаллов маны." },
        { title: "Ассистент кафедры призыва", salary: 80, minAge: 17, minMagic: 70, desc: "Составление формул магических кругов." },
        { title: "Профессор боевой магии", salary: 220, minAge: 22, minMagic: 180, desc: "Обучение студентов высшим стихиям." },
        { title: "Декан Магической Академии Шарии", salary: 750, minAge: 30, minMagic: 400, desc: "Глава исследовательской коллегии Севера." }
      ]
    }
  ],
  demon: [
    {
      id: "demon_hunter", name: "Охотничий Цех Пустошей",
      ranks: [
        { title: "Сборщик костей чудовищ", salary: 20, minAge: 12, minSword: 15, desc: "Сдирание чешуи павших тварей." },
        { title: "Загонщик пустынных виверн", salary: 60, minAge: 16, minSword: 60, desc: "Капканы и сети на ядовитых ящеров." },
        { title: "Охотник Черных Руин", salary: 190, minAge: 21, minSword: 160, desc: "Зачистка гнезд древних демонов." },
        { title: "Палач Бесплодных Земель", salary: 580, minAge: 28, minSword: 450, desc: "Легендарный добытчик сердец чудовищ." }
      ]
    }
  ],
  great_forest: [
    {
      id: "forest_ranger", name: "Лесной Дозор Клана Дорудиа",
      ranks: [
        { title: "Дозорный верхних ветвей", salary: 20, minAge: 12, minSword: 20, desc: "Наблюдение за кронами гигантских деревьев." },
        { title: "Следопыт чащи", salary: 65, minAge: 16, minSword: 65, desc: "Охота на болотных монстров сезона дождей." },
        { title: "Хранитель Священного Древа", salary: 200, minAge: 22, minSword: 180, desc: "Защита древних святилищ клана." },
        { title: "Первый Клинок Великого Леса", salary: 620, minAge: 30, minSword: 500, desc: "Лидер всех зверолюдей-воинов." }
      ]
    }
  ],
  milis: [
    {
      id: "milis_templar", name: "Орден Рыцарей Святого Милиса",
      ranks: [
        { title: "Послушник Белого Собора", salary: 25, minAge: 13, minInt: 15, desc: "Пение гимнов и зажжение священного огня." },
        { title: "Рыцарь-Храмовник", salary: 75, minAge: 17, minSword: 70, desc: "Охрана священников и паломников." },
        { title: "Инквизитор Веры", salary: 210, minAge: 23, minSword: 190, desc: "Охота на темных еретиков и культистов." },
        { title: "Паладин Белого Древа", salary: 700, minAge: 30, minSword: 480, desc: "Верховный меч Священного града Милисион." }
      ]
    }
  ],
  begaritt: [
    {
      id: "desert_caravan", name: "Гильдия Караван-Баши Бегаритта",
      ranks: [
        { title: "Погонщик песчаных ящеров", salary: 30, minAge: 14, minInt: 15, desc: "Перевозка воды сквозь песчаные бури." },
        { title: "Страж каравана", salary: 85, minAge: 18, minSword: 80, desc: "Отражение налетов скорпионов и разбойников." },
        { title: "Проводник Лабиринтов", salary: 240, minAge: 24, minInt: 90, desc: "Поиск входов в древние погребенные залы." },
        { title: "Песчаный Барон Оазисов", salary: 800, minAge: 32, minInt: 220, desc: "Владелец всех торговых путей Бегаритта." }
      ]
    }
  ]
};

// Политика Королевства Асура: Фракции за трон и дворянство
const ASURA_POLITICS = {
  factions: [
    { id: "ariel", name: "Принцесса Ариэль Анемой Асура", icon: "👑", desc: "Реформаторы, защита слабых, поддержка Сильфи и Люка.", power: 35 },
    { id: "prince_first", name: "Первый Принц Гравелл", icon: "🦁", desc: "Консерваторы, опора на старую знать, рыцарей и армию.", power: 45 },
    { id: "prince_second", name: "Второй Принц Хальфас", icon: "🐍", desc: "Тайные интриги, наемные гильдии убийц и культ денег.", power: 20 }
  ],
  nobilityTitles: [
    { id: "citizen", name: "Свободный гражданин", salary: 0, influence: 0 },
    { id: "knight", name: "Пожалованный Рыцарь", salary: 50, influence: 10 },
    { id: "baron", name: "Барон Провинции", salary: 180, influence: 25 },
    { id: "viscount", name: "Виконт Роа", salary: 420, influence: 60 },
    { id: "count", name: "Граф Королевства", salary: 900, influence: 120 },
    { id: "duke", name: "Герцог Асуры", salary: 2500, influence: 300 }
  ]
};

// Семь Великих Сил Мира (Интерактивные боссы с перманентной смертью)
let SEVEN_GREAT_POWERS = [
  { rank: 1, title: "Бог Техники", name: "Неизвестный Владыка", cp: 5000000, hp: 500000, maxHp: 500000, isDead: false },
  { rank: 2, title: "Бог Драконов", name: "Орстед", cp: 3000000, hp: 300000, maxHp: 300000, isDead: false },
  { rank: 3, title: "Бог Бойцов", name: "Бадигади (Золотая Броня)", cp: 1500000, hp: 180000, maxHp: 180000, isDead: false },
  { rank: 4, title: "Бог Демонов", name: "Лаплас", cp: 800000, hp: 100000, maxHp: 100000, isDead: false },
  { rank: 5, title: "Бог Смерти", name: "Рэндольф Мариан", cp: 450000, hp: 60000, maxHp: 60000, isDead: false },
  { rank: 6, title: "Бог Меча", name: "Гал Фарион", cp: 280000, hp: 38000, maxHp: 38000, isDead: false },
  { rank: 7, title: "Бог Севера", name: "Александр (Кальман III)", cp: 180000, hp: 26000, maxHp: 26000, isDead: false }
];

const ESTATES = [
  { id: "cottage_buena", name: "🏡 Лачуга с огородом в Буэне", cost: 120, income: 15, desc: "Уютный домик на окраине деревни (+15🪙/год)." },
  { id: "townhouse_roa", name: "🏘️ Каменный особняк в Роа", cost: 600, income: 60, desc: "Крепкий двухэтажный дом знати (+60🪙/год)." },
  { id: "milis_manor", name: "⛪ Торговая усадьба в Милисионе", cost: 2200, income: 200, desc: "Дом у Белого Дерева с караванной лавкой (+200🪙/год)." },
  { id: "sharia_castle", name: "🏰 Замок-резиденция в Шарии (Раноа)", cost: 7000, income: 700, desc: "Легендарный особняк с залом артефактов (+700🪙/год, +15 маны детям)." },
  { id: "asura_palace", name: "👑 Королевское поместье в Асуре", cost: 22000, income: 2400, desc: "Дворец среди садов столицы Арс (+2400🪙/год, +30 ко всем стилям детям)." }
];

const REGIONS = {
  asura: {
    name: "🏰 Королевство Асура", travelCost: 60, desc: "Сердце мира, цветущие сады и политические интриги.",
    origins: [
      { id: "boreas", name: "Дом Бореас Грейрат", coins: 350, manaBonus: 20, int: 5, swordGod: 15, log: "Вы открыли глаза в неприступной крепости Роа ветви Бореас." },
      { id: "notos", name: "Дом Нотос Грейрат", coins: 300, manaBonus: 25, int: 6, waterGod: 15, log: "Мраморные залы и цветущие сады юга Асуры." },
      { id: "knight_buena", name: "Рыцари деревни Буэна", coins: 60, manaBonus: 10, swordGod: 15, int: 3, log: "Уютный дом у пшеничных полей провинции Фитоа." },
      { id: "slums_ars", name: "Трущобы столицы Арс", coins: 10, manaBonus: 5, northGod: 20, int: 2, log: "Вы выросли среди бродяг и воров столицы." }
    ]
  },
  ranoa: {
    name: "❄️ Королевства Раноа (Север)", travelCost: 120, desc: "Магические королевства вечной мерзлоты и Академии.",
    origins: [
      { id: "academy_prof", name: "Семья Профессора Раноа", coins: 200, manaBonus: 45, int: 15, log: "Вы выросли в городе Шария среди магических фолиантов." },
      { id: "magic_guild", name: "Цех Артефакторов", coins: 120, manaBonus: 30, int: 8, log: "Мастерская полна кристаллов маны и свитков." },
      { id: "winter_hunter", name: "Охотники ледников", coins: 30, manaBonus: 10, northGod: 20, int: 3, log: "Ледяной ветер севера закалил ваше тело." }
    ]
  },
  demon: {
    name: "🌋 Демонический Континент", travelCost: 200, desc: "Бесплодные пустоши, сильные чудовища и древние руины.",
    origins: [
      { id: "migurd_village", name: "Деревня племени Мигурд", coins: 20, manaBonus: 55, int: 10, log: "Сапфировые волосы и телепатический зов сородичей." },
      { id: "wind_port", name: "Контрабандисты Города Ветров", coins: 90, manaBonus: 15, northGod: 25, int: 6, log: "Шум портовых таверн и соленая вода океана." }
    ]
  },
  great_forest: {
    name: "🌲 Великий Лес", travelCost: 100, desc: "Огромные вековые деревья, родина зверолюдей.",
    origins: [
      { id: "dorudia", name: "Клан воинов Дорудиа", coins: 40, manaBonus: 15, swordGod: 30, int: 5, log: "Дом среди ветвей гигантских деревьев клана Дорудиа." },
      { id: "scout", name: "Лесные следопыты", coins: 15, manaBonus: 10, northGod: 25, int: 4, log: "Бесшумные прыжки по ветвям на высоте птичьего полета." }
    ]
  },
  milis: {
    name: "⛪ Святая Земля Милис", travelCost: 110, desc: "Белокаменная столица у корней Священного Дерева.",
    origins: [
      { id: "temple_knight", name: "Орден Рыцарей Храма", coins: 160, manaBonus: 20, waterGod: 25, int: 6, log: "Белый плащ с гербом Святого Милиса." },
      { id: "merchant", name: "Торговый дом Милиса", coins: 220, manaBonus: 5, int: 9, log: "Шелка, специи и звон монет у Священного Дерева." }
    ]
  },
  begaritt: {
    name: "🏜️ Континент Бегаритт", travelCost: 250, desc: "Бескрайняя пустыня, песчаные бури и смертоносные лабиринты.",
    origins: [
      { id: "dungeon_raider", name: "Искатели Лабиринтов", coins: 150, manaBonus: 25, swordGod: 20, int: 7, log: "Вы родились у входа в лабиринт телепортации." },
      { id: "desert_nomad", name: "Кочевники Барханов", coins: 40, manaBonus: 10, northGod: 30, int: 4, log: "Караваны сквозь раскаленный песок под палящим солнцем." }
    ]
  }
};

const TRAITS = [
  { id: "healthy", name: "Стальное здоровье", rarity: "common", weight: 25, hp: 30, manaBonus: 0, growthMod: 1.0, desc: "+30 HP и стойкость к болезням." },
  { id: "curious", name: "Любознательность", rarity: "common", weight: 25, int: 8, manaBonus: 5, growthMod: 1.1, desc: "+8 к Знаниям, ускоренное чтение книг." },
  { id: "water_aff", name: "Сродство с Водой 💧", rarity: "rare", weight: 8, manaBonus: 35, waterGod: 20, growthMod: 1.4, desc: "+35 маны, бонус к водным стихиям." },
  { id: "fire_aff", name: "Сродство с Огнем 🔥", rarity: "rare", weight: 8, manaBonus: 35, swordGod: 20, growthMod: 1.4, desc: "+35 маны, взрывной первый выпад меча." },
  { id: "silent_cast", name: "Беззвучный каст 🔮", rarity: "epic", weight: 6, manaBonus: 75, growthMod: 1.9, desc: "+75 маны, мгновенный каст заклинаний силой мысли!" },
  { id: "demon_eye_talent", name: "Родовое Око 👁️", rarity: "legendary", weight: 2, swordGod: 35, waterGod: 35, manaBonus: 50, growthMod: 1.4, desc: "Врожденная восприимчивость к Демоническим Глазам." },
  { id: "laplace_factor", name: "Истинный Фактор Лапласа ✨", rarity: "mythic", weight: 1, manaBonus: 260, growthMod: 3.5, desc: "Океан маны. Каналы души никогда не затвердеют!" }
];

// ОГРОМНЫЙ выбор товаров на Рынке и реликвий
const SHOP_ITEMS = [
  // Оружие
  { id: "bronze_dagger", type: "weapon", name: "🗡️ Бронзовый охотничий кинжал", cost: 25, cp: 70, desc: "Простое вспомогательное оружие (+70 БМ)." },
  { id: "iron_sword", type: "weapon", name: "⚔️ Железный палаш стражи", cost: 60, cp: 220, desc: "Острое кованое лезвие (+220 БМ)." },
  { id: "oak_staff", type: "weapon", name: "🪄 Посох из ветви Энта", cost: 95, cp: 320, desc: "Проводит потоки стихийной магии (+320 БМ)." },
  { id: "steel_rapier", type: "weapon", name: "🤺 Тонкая асурианская рапира", cost: 180, cp: 650, desc: "Любимое оружие дуэлянтов знати (+650 БМ)." },
  { id: "heavy_claymore", type: "weapon", name: "🪓 Двуручный клеймор севера", cost: 320, cp: 1100, desc: "Раскалывает вражеские щиты надвое (+1100 БМ)." },
  { id: "dragon_blade", type: "weapon", name: "🗡️ Клинок из кости Дракона", cost: 750, cp: 2600, desc: "Режет мифрил как масло (+2600 БМ)." },
  { id: "staff_arcane", type: "weapon", name: "🔮 Посох Магического Океана", cost: 1600, cp: 5500, desc: "Инкрустирован ядром древнего духа (+5500 БМ)." },
  { id: "phoenix_spear", type: "weapon", name: "🔱 Копье Спардов: Алое Пламя", cost: 2800, cp: 8900, desc: "Легендарный трезубец с наконечником из метеорита (+8900 БМ)." },
  { id: "aqua_heartia", type: "weapon", name: "🌟 Посох Гордости Водного Океана", cost: 4200, cp: 15000, desc: "Божественный артефакт водной стихии (+15000 БМ)." },
  { id: "god_slayer_sword", type: "weapon", name: "⚡ Меч Рассекатель Света (Школа Бога)", cost: 11000, cp: 42000, desc: "Клинок, выкованный для схваток с Богами (+42000 БМ)." },

  // Броня
  { id: "apprentice_robe", type: "armor", name: "🧥 Мантия ученика мага", cost: 20, cp: 60, hp: 10, desc: "Защита от легких брызг маны (+60 БМ, +10 HP)." },
  { id: "leather_armor", type: "armor", name: "🛡️ Кожаный доспех охотника", cost: 55, cp: 180, hp: 25, desc: "Легкая броня от когтей волков (+180 БМ, +25 HP)." },
  { id: "steel_plate", type: "armor", name: "🛡️ Стальной рыцарский нагрудник", cost: 200, cp: 750, hp: 60, desc: "Надежная броня тяжелой пехоты (+750 БМ, +60 HP)." },
  { id: "mithril_chain", type: "armor", name: "⛓️ Мифриловая кольчужная рубаха", cost: 500, cp: 1800, hp: 110, desc: "Невесомая защита от клинков (+1800 БМ, +110 HP)." },
  { id: "dragon_scale", type: "armor", name: "🐉 Доспех из чешуи Красного Дракона", cost: 2200, cp: 7200, hp: 280, desc: "Абсолютная защита от огня (+7200 БМ, +280 HP)." },
  { id: "royal_aegis", type: "armor", name: "👑 Королевский Эгид Асуры", cost: 6500, cp: 21000, hp: 600, desc: "Золоченый латный доспех высших лордов (+21000 БМ, +600 HP)." },
  { id: "magic_armor", type: "armor", name: "🤖 Магическая Броня «Версия 1»", cost: 18000, cp: 60000, hp: 1200, desc: "Титанический автономный экзоскелет титанов (+60000 БМ, +1200 HP)." },

  // Реликвии, Артефакты и Зелья
  { id: "ring_mana", type: "accessory", name: "💍 Кольцо Концентрации Маны", cost: 130, cp: 450, desc: "Ускоряет фокусировку чар (+450 БМ)." },
  { id: "boots_wind", type: "accessory", name: "👢 Сапоги Ветроступа", cost: 420, cp: 1200, desc: "Увеличивают скорость рывка в дуэлях (+1200 БМ)." },
  { id: "laplace_gem", type: "accessory", name: "💎 Самоцвет Демонического Дракона", cost: 1900, cp: 6000, desc: "Древнейший артефакт эпохи войн (+6000 БМ)." },
  { id: "prosthetic_arm", type: "accessory", name: "🦾 Протез из Сплава Зари (как у Рудеуса)", cost: 1600, cp: 4000, desc: "Снимает штраф за потерю руки (+4000 БМ, встроенная картечь)." },
  { id: "golden_badge_hero", type: "accessory", name: "🏅 Золотая Медаль Героя Семи Королевств", cost: 4500, cp: 13000, desc: "Признание всеми королями Шестиликого Мира (+13000 БМ)." },
  { id: "heal_potion", type: "potion", name: "🧪 Зелье Исцеления Святого Ранга", cost: 30, heal: 60, desc: "Восстанавливает 60 HP в бою или вне боя." }
];

// Подземелья с шансом дропа легендарных артефактов
const DUNGEONS = [
  { id: "dung_cellar", name: "🕳️ Катакомбы Гоблинов", reqRank: "F", maxFloors: 5, cpBase: 250, dropArtifact: "bronze_dagger", desc: "Сырые норы под деревней Буэна." },
  { id: "dung_ruins", name: "🏛️ Руины Павших Рыцарей", reqRank: "D", maxFloors: 8, cpBase: 1400, dropArtifact: "steel_rapier", desc: "Древние каменные залы с ловушками и стражами." },
  { id: "dung_teleport", name: "🌀 Лабиринт Телепортации Бегаритта", reqRank: "B", maxFloors: 12, cpBase: 16000, dropArtifact: "laplace_gem", desc: "Смертоносный лабиринт телепортов! Где-то здесь погребена Зенит Грейрат." },
  { id: "dung_dragon", name: "🐉 Бездна Драконьего Гребня", reqRank: "S", maxFloors: 15, cpBase: 95000, dropArtifact: "dragon_scale", desc: "Гнездо древних виверн и самого Короля Драконов." }
];

const ALL_GUILD_QUESTS = [
  { id: "q_f1", rank: "F", name: "🐀 Зачистка амбаров от крыс-людоедов", enemy: "Крыса-мутант", cp: 110, hp: 55, reward: 25, gp: 8 },
  { id: "q_f2", rank: "F", name: "🌿 Сбор корней маны у волчьих нор", enemy: "Степной волчонок", cp: 140, hp: 65, reward: 30, gp: 10 },
  { id: "q_e1", rank: "E", name: "🐗 Охота на Клыкастых Кабанов", enemy: "Клыкастый Вепрь", cp: 340, hp: 120, reward: 60, gp: 15 },
  { id: "q_e2", rank: "E", name: "🍄 Истребление Кислотных Слизней", enemy: "Кислотный Слизень", cp: 400, hp: 140, reward: 75, gp: 18 },
  { id: "q_d1", rank: "D", name: "🐺 Стая Двуглавых Волков на тракте", enemy: "Вожак Двуглавых", cp: 900, hp: 260, reward: 150, gp: 25 },
  { id: "q_d2", rank: "D", name: "🧌 Набег шайки гоблинов-лучников", enemy: "Гоблин-главарь", cp: 1200, hp: 320, reward: 190, gp: 30 },
  { id: "q_c1", rank: "C", name: "🐍 Гнездо Багровых Кобр Бегаритта", enemy: "Багровая Кобра", cp: 2800, hp: 620, reward: 400, gp: 45 },
  { id: "q_c2", rank: "C", name: "🧟 Зачистка склепа от нежити", enemy: "Рыцарь-скелет", cp: 3400, hp: 750, reward: 520, gp: 50 },
  { id: "q_b1", rank: "B", name: "🗿 Убийство Древнего Каменного Энта", enemy: "Каменный Энт", cp: 8600, hp: 1600, reward: 1200, gp: 80 },
  { id: "q_b2", rank: "B", name: "🦂 Песчаные Скорпионы Пустыни", enemy: "Императорский Скорпион", cp: 11500, hp: 2200, reward: 1600, gp: 95 },
  { id: "q_a1", rank: "A", name: "🦅 Охота на Ледяную Виверну в пиках", enemy: "Ледяная Виверна", cp: 33000, hp: 4500, reward: 4000, gp: 150 },
  { id: "q_a2", rank: "A", name: "🦍 Снежный Демонический Бегемот", enemy: "Пещерный Бегемот", cp: 45000, hp: 6200, reward: 5500, gp: 180 },
  { id: "q_s1", rank: "S", name: "🐉 Логово Красного Дракона", enemy: "Красный Дракон", cp: 130000, hp: 18000, reward: 18000, gp: 300 },
  { id: "q_s2", rank: "S", name: "💀 Древний Архилич забытой эпохи", enemy: "Архилич Бездны", cp: 190000, hp: 26000, reward: 28000, gp: 450 }
];

const CANON_NPCS = [
  { id: "sylphie", name: "Сильфиетта", gender: "female", race: "Полуэльф", role: "Подруга детства • Маг без слов", cp: 1200, region: "asura", minAge: 4, maxAge: 9, baseChance: 0.16 },
  { id: "roxy", name: "Рокси Мигурдия", gender: "female", race: "Мигурд", role: "Наставница • Маг Святого Ранга", cp: 4500, region: "asura", minAge: 5, maxAge: 12, baseChance: 0.14 },
  { id: "eris", name: "Эрис Бореас Грейрат", gender: "female", race: "Человек", role: "Леди Бореас • Бешеная мечница", cp: 2400, region: "asura", minAge: 7, maxAge: 14, baseChance: 0.14 },
  { id: "ghislaine", name: "Гилен Дедольдия", gender: "female", race: "Зверочеловек", role: "Мечница Ранга Царя Меча", cp: 29000, region: "asura", minAge: 7, maxAge: 16, baseChance: 0.12 },
  { id: "ruijerd", name: "Руджерд Спардия", gender: "male", race: "Спард", role: "Тупик • Воин сотен битв", cp: 36000, region: "demon", minAge: 10, maxAge: 25, baseChance: 0.12 },
  { id: "cliff", name: "Клифф Гриммор", gender: "male", race: "Человек", role: "Гениальный экзорцист Милиса", cp: 3200, region: "milis", minAge: 10, maxAge: 16, baseChance: 0.11 },
  { id: "zanoba", name: "Заноба Широне", gender: "male", race: "Мико", role: "Принц чудовищной силы", cp: 19000, region: "ranoa", minAge: 12, maxAge: 22, baseChance: 0.10 }
];

const SCHOOLS = [
  { id: "ranoa_academy", name: "🎓 Магическая Академия Раноа", regionKey: "ranoa", region: "Раноа (Шария)", minAge: 13, cost: 300, desc: "Центр изучения высшей магии. Лекции магов Святого и Королевского рангов." },
  { id: "asura_academy", name: "🏰 Королевская Академия Асуры", regionKey: "asura", region: "Асура (Арс)", minAge: 12, cost: 450, desc: "Элитное заведение высшей знати и королевских рыцарей." },
  { id: "sword_sanctuary", name: "🗡️ Святая Земля Меча (Додзё Гула)", regionKey: "ranoa", region: "Святая Земля Меча", minAge: 10, cost: 150, desc: "Беспощадные тренировки в снежных пиках под началом Бога Меча." },
  { id: "milis_seminary", name: "⛪ Семинария Святого Милиса", regionKey: "milis", region: "Милис (Милисион)", minAge: 11, cost: 200, desc: "Священная магия лечения, детоксикации и барьеры." }
];

// Сюжетные активности по годам и эпохам
const STORY_ACTIVITIES = [
  {
    id: "story_1", age: 1, name: "📖 Первое осознание перерождения", desc: "Вспомнить свою прежнюю земную жизнь и почувствовать ману в ладонях.",
    action: (p) => { p.intellect += 3; p.maxMana += 10; return "Вы осознали законы этого мира: мана течет по телу подобно крови (+3 к Знаниям, +10 макс. маны)!"; }
  },
  {
    id: "story_3", age: 3, name: "📖 Тайком прокрасться в кабинет за книгой", desc: "Достать со шкафа фолиант по основам стихийной магии.",
    action: (p) => { p.intellect += 4; p.magicExp += 8; return "Вы научились читать на языке людей и изучили магические символы (+4 к Знаниям, +8 к Магии)!"; }
  },
  {
    id: "story_5", age: 5, name: "📖 Первый беззвучный водяной шар во дворе", desc: "Попробовать сконденсировать влагу воздуха без произнесения заклинания.",
    action: (p) => { p.magicExp += 25; p.maxMana += 25; return "Огромный шар чистейшей воды завис в воздухе! Отец и мать застыли в немом шоке (+25 к Магии, +25 макс. маны)!"; }
  },
  {
    id: "story_7", age: 7, name: "📖 Получение выпускного посоха и мантии", desc: "Пройти ритуал посвящения в начинающие маги или мечники.",
    action: (p) => { p.coins += 40; p.swordGodExp += 15; return "Наставник торжественно вручил вам походный плащ и благословил ваш путь (+40 монет, +15 к Мечу)!"; }
  },
  {
    id: "story_10_calamity", age: 10, name: "⚡ КАТАКЛИЗМ МАНЫ ПРОВИНЦИИ ФИТОА (417 г.)", desc: "Небо раскололось багровым сиянием. Землю накрыла волна телепортации!",
    action: (p) => {
      p.calamityTriggered = true;
      const targetRegions = ["demon", "begaritt", "great_forest", "ranoa"];
      const newReg = targetRegions[Math.floor(Math.random() * targetRegions.length)];
      p.currentRegionKey = newReg;
      // Все родные считаются потерянными
      p.relations.forEach(r => { if (r.isFamily) r.isLost = true; });
      return `💥 <b>КАТАКЛИЗМ МАНЫ!</b> Вспышка колоссальной мощи стерла провинцию Фитоа! Всех ваших близких разбросало по миру! Вас выбросило в: <b>${REGIONS[newReg].name}</b>! Ваша семья потеряна!`;
    }
  },
  {
    id: "story_12", age: 12, name: "📖 Выживание на чужом континенте и поиск вестей", desc: "Расспрашивать трактирщиков и караванщиков о пропавших членах семьи.",
    action: (p) => {
      let found = p.relations.find(r => r.isLost);
      if (found && Math.random() < 0.6) {
        found.isLost = false;
        return `🎉 <b>Счастливая весть!</b> До вас дошли слухи о местонахождении <b>${found.name}</b>! Вы воссоединились!`;
      }
      p.coins += 20;
      return "Вы обошли десятки таверн. Слухов о семье пока нет, но вы подзаработали на новостях (+20 монет).";
    }
  },
  {
    id: "story_15", age: 15, name: "📖 Приглашение на Большой Военный Совет", desc: "Дворяне и гильдии собирают силы для зачистки смертоносных лабиринтов.",
    action: (p) => { p.coins += 100; p.intellect += 8; return "Вы приняли участие в разработке карт глубин лабиринтов (+100 монет, +8 к Знаниям)!"; }
  },
  {
    id: "story_18", age: 18, name: "📖 Слухи о Лабиринте Телепортации в Бегаритте", desc: "Торговцы шепчутся, что на 6-м этаже лабиринта заточена великая волшебница.",
    action: (p) => { p.dungeonProgress["dung_teleport"] = Math.max(p.dungeonProgress["dung_teleport"] || 1, 3); return "Вы получили тайную карту безопасных переходов Лабиринта Телепортации Бегаритта!"; }
  },
  {
    id: "story_21", age: 21, name: "📖 Испытание на Звание Мастера Королевского Ранга", desc: "Официальный поединок перед коллегией верховных магистров и мечников.",
    action: (p) => { p.swordGodExp += 40; p.magicExp += 40; return "Ваше мастерство официально признано! Вы заслужили славу во всех королевствах (+40 к Мечу и Магии)!"; }
  }
];

const ACTIVITIES = [
  { id: "baby_crawl", category: "childhood", name: "👶 Ползать по комнатам и изучать мир", minAge: 0, maxAge: 3, cost: 0, apCost: 1, desc: "Развивает моторику и восприятие окружающего пространства.", action: (p) => { p.intellect += 1; return "Вы ползали по коврам и увлеченно изучали блестящие предметы (+1 к Знаниям)."; } },
  { id: "listen_parents", category: "childhood", name: "🗣️ Слушать разговоры родителей и сказки", minAge: 1, maxAge: 5, cost: 0, apCost: 1, desc: "Знакомство с речью, этикетом и историей континентов.", action: (p) => { p.intellect += 2; return "Мать читала вам старинные легенды о Шестиликом Мире (+2 к Знаниям)."; } },
  { id: "wooden_stick_play", category: "childhood", name: "🪵 Размахивать деревянной палкой во дворе", minAge: 3, maxAge: 6, cost: 0, apCost: 1, desc: "Первые неуклюжие замахи во дворе дома.", action: (p) => { p.swordGodExp += 8; return "Вы азартно сбивали крапиву во дворе деревянной палкой (+8 к стилю Меча)."; } },

  { id: "toddler_mana", category: "magic", name: "🔮 Детская концентрация маны (Золотое Окно)", minAge: 1, maxAge: 9, cost: 0, apCost: 1, desc: "Ежедневное истощение пластичных каналов расширяет сосуд души.", action: (p) => {
      let base = 7;
      let mod = (p.trait.growthMod || 1.0) * (p.raceObj.bonus.manaMod || 1.0);
      let gain = Math.round(base * mod);
      p.maxMana += gain; p.mana = p.maxMana; p.magicExp += 7;
      return `Вы концентрировали шар маны до дрожи в ладонях! Сосуд маны расширился: <b>+${gain} макс. маны</b>!`;
    }
  },
  { id: "magic_circle_study", category: "magic", name: "✨ Изучение структуры магических кругов", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Понимание формул магии земли, воды, огня и ветра.", action: (p) => { p.magicExp += 16; p.intellect += 3; return "Вы вычерчивали на пергаменте круги призыва стихий (+16 к Магии, +3 к Знаниям)."; } },

  { id: "sword_practice", category: "combat", name: "🗡️ Стойка Бога Меча: Выпад Света", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Отработка молниеносного первого взмаха.", action: (p) => { p.swordGodExp += 18; return "Клинок со свистом рассекает воздух (+18 к Богу Меча)."; } },
  { id: "water_parry", category: "combat", name: "💧 Стойка Бога Воды: Абсолютное Парирование", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Отражение встречных ударов и непробиваемая защита.", action: (p) => { p.waterGodExp += 18; return "Вы плавным круговым движением гасили встречные выпады (+18 к Богу Воды)."; } },
  { id: "north_tricks", category: "combat", name: "🌪️ Стойка Бога Севера: Непредсказуемый Выпад", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Броски песка, кувырки и атаки из слепой зоны.", action: (p) => { p.northGodExp += 18; return "Вы освоили внезапный выпад из переката (+18 к Богу Севера)."; } },

  { id: "school_lesson", category: "school", name: "🎓 Посетить академическую лекцию и семинар", minAge: 10, maxAge: 100, cost: 0, apCost: 1, desc: "Доступно только студентам заведений. Продвигает по курсу обучения.", action: (p) => {
      if (!p.enrolledSchool) return "Вы не зачислены ни в одну Академию! Поступите во вкладке «Мир».";
      p.schoolProgress = (p.schoolProgress || 1);
      p.intellect += 6; p.magicExp += 16;
      if (Math.random() > 0.55) {
        p.schoolProgress++;
        if (p.schoolProgress > 4) {
          p.graduatedSchools.push(p.enrolledSchool);
          p.enrolledSchool = null; p.coins += 200;
          return `🏆 <b>ТОРЖЕСТВЕННЫЙ ВЫПУСК!</b> Вы с отличием окончили Академию! Получен диплом и премия (+200🪙).`;
        }
        return `📜 Вы сдали семестровый экзамен! Текущий курс: ${p.schoolProgress}/4.`;
      }
      return "Вы конспектировали лекцию магистра (+16 к Магии, +6 к Знаниям).";
    }
  },

  { id: "gather_herbs", category: "life", name: "🌿 Сбор редких трав и целебных кореньев", minAge: 6, maxAge: 100, cost: 0, apCost: 1, desc: "Несложная подработка для пополнения запаса монет.", action: (p) => {
      let earned = Math.floor(Math.random() * 16) + 8;
      p.coins += earned;
      return `Вы наполнили корзину мятой и корнями маны, сдав аптекарю (+${earned} монет).`;
    }
  },
  { id: "read_scrolls", category: "life", name: "📜 Изучение древних свитков и летописей", minAge: 5, maxAge: 100, cost: 5, apCost: 1, desc: "Язык Богов, Демонов и хроники Первой Великой Войны.", action: (p) => {
      if (p.coins < 5) return "Не хватает монет на аренду свитков (нужно 5🪙).";
      p.coins -= 5; p.intellect += 7;
      return "Вы погрузились в изучение летописей Войны Лапласа (+7 к Знаниям).";
    }
  }
];

const RANDOM_EVENTS = [
  {
    id: "canon_orsted", isRare: true, minAge: 16, chance: 0.04, icon: "🐉",
    title: "Встреча: Бог Драконов Орстед!",
    desc: "В узком ущелье вы натыкаетесь на мужчину в белом чешуйчатом плаще. Воздух застыл. Ваше тело сковал первобытный ужас смерти!",
    choices: [
      { text: "В ужасе упасть на колени и опустить взгляд", action: (p) => { p.hp = Math.max(10, p.hp - 15); return "Орстед окинул вас ледяным взглядом и прошел мимо (-15 HP от ужаса)."; } },
      { text: "Спросить дрожащим голосом: 'Ты знаешь Хитогами?'", action: (p) => { p.hp = Math.max(5, p.hp - 75); return "Взгляд Орстеда вспыхнул яростью! Он пробил вам плечо: 'Пешка...'. Вы чудом выжили (-75 HP)!"; } },
      { text: "Обнажить клинок и напасть!", action: (p) => { p.hp = 0; return "Один взмах разорвал скалу позади вас вместе с вашим телом. Мгновенная гибель."; } }
    ]
  },
  {
    id: "canon_kishirika", isRare: true, minAge: 8, chance: 0.08, icon: "👁️",
    title: "Императрица Демонов Киширика Киширису!",
    desc: "В пыли сидит голодная коротышка с закрученными рогами: 'Ху-ха-ха! Накорми Великую Киширику, и я вживлю в твой череп легендарный Демонический Глаз!'",
    choices: [
      { text: "Отдать провизию и 50 монет за Демонический Глаз", action: (p) => {
          if (p.coins >= 50) {
            p.coins -= 50;
            const eyeKeys = Object.keys(DEMON_EYES);
            const chosenEyeKey = eyeKeys[Math.floor(Math.random() * eyeKeys.length)];
            const eye = DEMON_EYES[chosenEyeKey];
            if (!p.demonEyes.left) {
              p.demonEyes.left = eye;
              return `👁️ Киширика вонзила пальцы и вживила в вашу ЛЕВУЮ глазницу: <b>${eye.name}</b> (${eye.desc})!`;
            } else if (!p.demonEyes.right) {
              p.demonEyes.right = eye;
              return `👁️ Киширика вживила в вашу ПРАВУЮ глазницу: <b>${eye.name}</b> (${eye.desc})! Теперь вы двуокий владыка!`;
            } else {
              p.swordGodExp += 30; p.magicExp += 30;
              return "Киширика похлопала по плечу: 'У тебя уже оба глаза демона! Держи прилив чистой маны!' (+30 ко всем стилям).";
            }
          }
          return "У вас не нашлось монет. Киширика обиженно надулась и сбежала.";
        }
      },
      { text: "Пройти мимо", action: () => "Вы побоялись приближаться к странной рогатой девчонке." }
    ]
  },
  {
    id: "stolen_wallet", minAge: 10, chance: 0.35, icon: "👝",
    title: "Вор на базарной площади",
    desc: "Карманник срезал кошель у купца и несется прямо на вас!",
    choices: [
      { text: "Поставить подножку (Ловкость)", action: (p) => {
          if (p.northGodExp >= 15 || Math.random() > 0.4) {
            p.coins += 45; p.northGodExp += 10;
            return "Купец щедро отсыпал золота за возврат кошелька (+45 монет).";
          }
          p.hp -= 15;
          return "Вор полоснул ножом и скрылся в толпе (-15 HP).";
        }
      },
      { text: "Испепелить струей маны", action: (p) => { p.magicExp += 15; return "Вор арестован подоспевшей стражей (+15 к опыту магии)."; } },
      { text: "Отойти в сторону", action: () => "Вы спокойно отошли в сторону." }
    ]
  }
];

const SYLLABLES = {
  male: ["Вал", "Сед", "Лео", "Клод", "Жан", "Огюст", "Филипп", "Рей", "Люк", "Марк", "Ден", "Эд", "Рудеус", "Пол", "Клифф", "Арси", "Клайв"],
  female: ["Аме", "Селе", "Хиль", "Эле", "Клэр", "Роза", "Диа", "Лиза", "София", "Жанна", "Али", "Сильфи", "Эрис", "Рокси", "Зенит", "Норн"],
  suffix: ["рик", "берт", "ион", "ард", "ель", "ис", "дар", "монт", "валь", "ус", "етта", "ин"],
  surnames: ["Грейрат", "де Роа", "де Арс", "Блэквуд", "Фрост", "Клемент", "Дорудиа", "Мигурдия", "Спардия", "Шевалье"]
};
