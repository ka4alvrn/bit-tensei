const START_YEAR = 407;
const CALAMITY_YEAR = 417;

const SWORD_RANKS = ["Нет", "Новичок", "Рядовой 🥉", "Святой 🌟", "Королевский 👑", "Император ⚡", "Бог ⚔️"];
const MAGIC_RANKS = ["Новичок", "Рядовой 🥉", "Святой 🌟", "Королевский 👑", "Император ⚡", "Бог 🔮"];
const ADVENTURER_RANKS = ["F", "E", "D", "C", "B", "A", "S"];
const ADVENTURER_REQ = { F: 0, E: 30, D: 80, C: 180, B: 380, A: 750, S: 1400 };

// Плотная шкала БМ: от 100 у младенца до ~100,000 у Богов и эндгейма
const GENERATION_CP_CAPS = { 1: 8500, 2: 22000, 3: 48000, 4: 80000, 5: 120000 };

const WORLD_ERAS = [
  { maxYear: 416, name: "Мир перед Бурей", desc: "Спокойное десятилетие перед Катаклизмом Маны." },
  { maxYear: 429, name: "Смута Катаклизма", desc: "Последствия телепортации Фитоа и скитания выживших." },
  { maxYear: 499, name: "Эпоха Восстановления", desc: "Расцвет Академии Раноа и тайная борьба Апостолов." },
  { maxYear: 599, name: "VI век: Век Затаившихся Богов", desc: "Скрытые интриги Белого Пространства и передел тронов." },
  { maxYear: 699, name: "VII век: Эпоха Маготехники", desc: "Небесные корабли, древние руны и расцвет магии." },
  { maxYear: 9999, name: "VIII+ век: Хроники Вечных Династий", desc: "Легендарная эра бессмертных родов и архимагов." }
];

const REGION_FAMILY_STATUSES = {
  asura: [
    { id: "asura_slums", name: "Нищие трущоб Арса", coins: 3, hp: 15, northGod: 10, desc: "Выживание на улицах (+15 HP, +10 Севера)." },
    { id: "asura_farmer", name: "Фермеры Фитоа", coins: 15, hp: 25, desc: "Дом среди золотых полей (+25 HP)." },
    { id: "asura_knight", name: "Рыцари Асуры", coins: 50, swordGod: 15, int: 4, desc: "Воинская честь (+50🪙, +15 Мечу)." },
    { id: "asura_high_noble", name: "Высшая знать Асуры", coins: 180, int: 14, influence: 35, desc: "Мраморные залы (+180🪙, +35 влияния, +14 Знаний)." }
  ],
  ranoa: [
    { id: "ranoa_trapper", name: "Охотники Севера", coins: 12, hp: 30, northGod: 12, desc: "Закалка льдом (+30 HP, +12 Севера)." },
    { id: "ranoa_artificer", name: "Артефакторы Шарии", coins: 45, int: 10, manaBonus: 20, desc: "Мастерская (+45🪙, +20 маны)." },
    { id: "ranoa_prof_dynasty", name: "Профессора Академии", coins: 120, int: 18, manaBonus: 45, desc: "Библиотеки (+120🪙, +45 маны)." }
  ],
  demon: [
    { id: "demon_outcast", name: "Парии пустошей", coins: 3, hp: 40, northGod: 15, desc: "Среди монстров (+40 HP, +15 Севера)." },
    { id: "demon_nomad_clan", name: "Кочевой клан демонов", coins: 25, hp: 45, swordGod: 20, desc: "Стойкость (+45 HP, +20 Мечу)." },
    { id: "demon_lord_blood", name: "Потомки Демон-Лордов", coins: 90, hp: 55, manaBonus: 65, desc: "Кровь владык (+65 маны, +55 HP)." }
  ],
  great_forest: [
    { id: "forest_orphan", name: "Лесные подкидыши", coins: 5, hp: 30, northGod: 15, desc: "Жизнь на кронах (+30 HP)." },
    { id: "forest_dorudia_hunter", name: "Стая Дорудиа", coins: 22, hp: 35, swordGod: 22, desc: "Звериное чутьё (+35 HP, +22 Мечу)." },
    { id: "forest_chieftain_family", name: "Род Вождя Леса", coins: 85, hp: 45, swordGod: 30, int: 10, desc: "Потомки зверей (+85🪙, +30 Мечу)." }
  ],
  milis: [
    { id: "milis_pilgrim", name: "Паломники Древа", coins: 10, hp: 20, int: 8, desc: "Молитвы (+20 HP, +8 Знаний)." },
    { id: "milis_merchant_house", name: "Купеческий дом", coins: 95, int: 14, desc: "Торговля (+95🪙, +14 Знаний)." },
    { id: "milis_templar_dynasty", name: "Рыцари Храма", coins: 140, swordGod: 20, waterGod: 20, int: 10, desc: "Белый доспех (+140🪙, +20 Воде и Мечу)." }
  ],
  begaritt: [
    { id: "desert_pariah", name: "Изгои барханов", coins: 5, hp: 35, northGod: 18, desc: "Выживание (+35 HP, +18 Севера)." },
    { id: "desert_nomad_caravan", name: "Кочевники оазисов", coins: 35, hp: 30, northGod: 20, desc: "Караваны (+35🪙, +20 Севера)." },
    { id: "desert_labyrinth_dynasty", name: "Кладоискатели", coins: 110, swordGod: 22, int: 12, manaBonus: 25, desc: "Древние карты (+110🪙, +22 Мечу)." }
  ]
};
const FAMILY_STATUSES = REGION_FAMILY_STATUSES.asura;

const RACES = {
  human: { id: "human", name: "Человек", maxAge: 75, learnMod: 1.35, desc: "Учатся стилям на 35% быстрее всех остальных рас.", bonus: { baseMana: 25, hp: 0, int: 5, coins: 15, manaMod: 1.0 } },
  demon: { id: "demon", name: "Демон", maxAge: 220, learnMod: 1.0, desc: "Огромный сосуд маны и долгий век.", bonus: { baseMana: 65, hp: 35, int: 2, coins: 5, manaMod: 1.5 } },
  beast: { id: "beast", name: "Зверочеловек", maxAge: 95, learnMod: 1.1, desc: "Звериный инстинкт в ближнем бою.", bonus: { baseMana: 20, hp: 25, swordGod: 18, coins: 8, manaMod: 0.9 } },
  elf: { id: "elf", name: "Эльф / Полуэльф", maxAge: 320, learnMod: 0.95, desc: "Долголетие, мудрость и сродство с маной.", bonus: { baseMana: 50, hp: -5, int: 12, coins: 15, manaMod: 1.35 } },
  speld: { id: "speld", name: "Спард", maxAge: 180, learnMod: 1.05, desc: "Алый камень во лбу, прирождённые бойцы.", bonus: { baseMana: 28, hp: 40, swordGod: 24, northGod: 15, coins: 5, manaMod: 1.0 } },
  dwarf: { id: "dwarf", name: "Гном / Дворф", maxAge: 130, learnMod: 1.0, desc: "Крепкое тело и мастерство ковки.", bonus: { baseMana: 15, hp: 38, northGod: 18, coins: 25, manaMod: 0.85 } }
};

const LANGUAGES = {
  human: { id: "human", name: "Человеческий язык", desc: "Общий язык Асуры, Раноа и Милиса." },
  demon: { id: "demon", name: "Демонический язык", desc: "Скидка 20% на рынке Демонического континента + обелиски." },
  beast: { id: "beast", name: "Звериный язык", desc: "+25% к отношениям со зверолюдьми и дипломатия Леса." },
  god_fighter: { id: "god_fighter", name: "Язык Бога Бойцов", desc: "Доступ к древним боевым свиткам и Скрижали." },
  dragon: { id: "dragon", name: "Язык Драконьего Племени", desc: "Руны телепортации и Плита Драконьего Владыки." }
};

const TRAITS = [
  { id: "healthy", name: "Стальное здоровье", rarity: "common", weight: 20, hp: 35, manaBonus: 0, growthMod: 1.0, desc: "+35 HP и стойкость к болезням." },
  { id: "curious", name: "Любознательность", rarity: "common", weight: 20, int: 8, manaBonus: 5, growthMod: 1.1, desc: "+8 Знаний, книги и лекции дают +50% опыта." },
  { id: "water_aff", name: "Сродство с Водой 💧", rarity: "rare", weight: 8, manaBonus: 30, waterGod: 16, growthMod: 1.35, desc: "+30 маны, бонус к стилю Воды." },
  { id: "fire_aff", name: "Сродство с Огнем 🔥", rarity: "rare", weight: 8, manaBonus: 30, swordGod: 16, growthMod: 1.35, desc: "+30 маны, взрывной выпад меча." },
  { id: "silent_cast", name: "Беззвучный каст 🔮", rarity: "epic", weight: 5, manaBonus: 60, growthMod: 1.8, desc: "+60 маны, магия в бою вдвое дешевле и на 30% сильнее!" },
  { id: "laplace_factor", name: "Истинный Фактор Лапласа ✨", rarity: "mythic", weight: 1, manaBonus: 180, growthMod: 2.8, desc: "Огромный сосуд маны. Каналы души не затвердевают после 10 лет!" },
  { id: "miko_strength", name: "🌟 Мико: Чудовищная Сила", rarity: "mythic", weight: 2, hp: 160, swordGod: 45, northGod: 45, manaBonus: -10, growthMod: 1.6, desc: "Стальное тело как у Занобы (+160 HP, +45 к Мечу и Северу)." },
  { id: "miko_memory", name: "🌟 Мико: Взор Памяти", rarity: "mythic", weight: 2, int: 25, manaBonus: 80, growthMod: 1.9, desc: "Абсолютная память души, +80 маны, +25 Знаний." },
  { id: "miko_healing", name: "🌟 Мико: Источник Жизни", rarity: "mythic", weight: 2, hp: 100, manaBonus: 55, waterGod: 30, growthMod: 1.55, desc: "Кровь исцеления: +25 HP регенерации каждый год." },
  { id: "god_mode", name: "⚡ ЧИТ-РЕЖИМ: Истинный Творец", rarity: "mythic", weight: 0, hp: 9999, manaBonus: 9999, swordGod: 1500, waterGod: 1500, northGod: 1500, int: 500, coins: 99999, growthMod: 6.0, desc: "Режим Бога: бесконечная мощь и казна." }
];

const DEMON_EYES = {
  foresight: { id: "foresight", name: "Глаз Предвидения 👁️", color: "#38bdf8", desc: "+35% уклонения в бою, +1,800 БМ.", cp: 1800 },
  mana_sight: { id: "mana_sight", name: "Глаз Маны 🔮", color: "#c084fc", desc: "Иммунитет к ловушкам лабиринтов, +1,500 БМ.", cp: 1500 },
  appraisal: { id: "appraisal", name: "Глаз Оценки 📜", color: "#fbbf24", desc: "+30% урона по слабым местам врага, +1,400 БМ.", cp: 1400 },
  clarity: { id: "clarity", name: "Глаз Дальнего Взора 🎯", color: "#34d399", desc: "+15% крита и 100% точность, +1,200 БМ.", cp: 1200 }
};

const REGIONAL_JOBS = {
  asura: [
    { id: "asura_guard", name: "Королевская Гвардия Асуры", ranks: [
      { title: "Новобранец гарнизона", salary: 10, minAge: 14, minSword: 15, desc: "Патрулирование рынков." },
      { title: "Страж ворот Роа", salary: 22, minAge: 16, minSword: 40, desc: "Охрана ворот." },
      { title: "Рыцарь Первого круга", salary: 55, minAge: 20, minSword: 95, desc: "Эскорт знати." },
      { title: "Капитан Гвардии", salary: 130, minAge: 25, minSword: 220, desc: "Батальон Арса." },
      { title: "Лорд-Командующий Асуры", salary: 280, minAge: 32, minSword: 450, desc: "Высший военный чин." }
    ]},
    { id: "asura_bureaucrat", name: "Королевское Казначейство", ranks: [
      { title: "Переписчик свитков", salary: 12, minAge: 14, minInt: 15, desc: "Налоговые свитки." },
      { title: "Податной инспектор", salary: 28, minAge: 18, minInt: 40, desc: "Сбор податей." },
      { title: "Аудитор Короны", salary: 70, minAge: 24, minInt: 80, desc: "Ревизия имений." },
      { title: "Главный Казначей", salary: 190, minAge: 30, minInt: 150, desc: "Золотой запас." }
    ]},
    { id: "asura_court_mage", name: "Придворная Коллегия Магов", ranks: [
      { title: "Адепт барьеров", salary: 18, minAge: 15, minMagic: 40, desc: "Глифы дворца." },
      { title: "Магистр эскорта", salary: 75, minAge: 21, minMagic: 120, desc: "Стража монархов." },
      { title: "Архимаг Совета", salary: 220, minAge: 28, minMagic: 300, desc: "Верховный маг." }
    ]}
  ],
  ranoa: [
    { id: "ranoa_researcher", name: "Институт Академии Шарии", ranks: [
      { title: "Лаборант алхимика", salary: 14, minAge: 13, minMagic: 25, desc: "Кристаллы маны." },
      { title: "Ассистент кафедры", salary: 35, minAge: 17, minMagic: 60, desc: "Магические круги." },
      { title: "Профессор боевой магии", salary: 90, minAge: 22, minMagic: 150, desc: "Высшие стихии." },
      { title: "Декан Академии Шарии", salary: 250, minAge: 30, minMagic: 340, desc: "Глава коллегии Севера." }
    ]},
    { id: "ranoa_winter_scout", name: "Ледяной Дозор Севера", ranks: [
      { title: "Следопыт снегов", salary: 14, minAge: 14, minNorth: 25, desc: "Патруль буранов." },
      { title: "Охотник на бегемотов", salary: 55, minAge: 19, minSword: 90, desc: "Защита караванов." },
      { title: "Капитан Рубежа", salary: 180, minAge: 27, minSword: 260, desc: "Гарнизоны Севера." }
    ]}
  ],
  milis: [
    { id: "milis_templar", name: "Орден Рыцарей Милиса", ranks: [
      { title: "Послушник Собора", salary: 10, minAge: 13, minInt: 12, desc: "Служба в храме." },
      { title: "Рыцарь-Храмовник", salary: 32, minAge: 17, minSword: 60, desc: "Охрана паломников." },
      { title: "Инквизитор Веры", salary: 85, minAge: 23, minSword: 160, desc: "Охота на еретиков." },
      { title: "Паладин Белого Древа", salary: 230, minAge: 30, minSword: 380, desc: "Верховный меч." }
    ]},
    { id: "milis_healer_seminary", name: "Госпиталь Святого Ранга", ranks: [
      { title: "Брат милосердия", salary: 15, minAge: 13, minMagic: 25, desc: "Уход за ранеными." },
      { title: "Священник-целитель", salary: 55, minAge: 18, minMagic: 95, desc: "Снятие проклятий." },
      { title: "Епископ Исцеления", salary: 195, minAge: 28, minMagic: 280, desc: "Высшее исцеление." }
    ]}
  ],
  demon: [
    { id: "demon_hunter", name: "Охотники Пустошей", ranks: [
      { title: "Сборщик чешуи", salary: 12, minAge: 12, minSword: 12, desc: "Кости чудовищ." },
      { title: "Загонщик виверн", salary: 34, minAge: 16, minSword: 55, desc: "Охота на ящеров." },
      { title: "Охотник Чёрных Руин", salary: 85, minAge: 21, minSword: 140, desc: "Гнёзда демонов." },
      { title: "Палач Пустошей", salary: 210, minAge: 28, minSword: 350, desc: "Легендарный охотник." }
    ]}
  ],
  great_forest: [
    { id: "forest_ranger", name: "Дозор Клана Дорудиа", ranks: [
      { title: "Дозорный ветвей", salary: 11, minAge: 12, minSword: 15, desc: "Охрана крон." },
      { title: "Следопыт чащи", salary: 32, minAge: 16, minSword: 55, desc: "Сезон дождей." },
      { title: "Хранитель Древа", salary: 90, minAge: 22, minSword: 150, desc: "Защита святилищ." },
      { title: "Первый Клинок Леса", salary: 220, minAge: 30, minSword: 380, desc: "Лидер воинов леса." }
    ]}
  ],
  begaritt: [
    { id: "desert_caravan", name: "Гильдия Караван-Баши", ranks: [
      { title: "Погонщик ящеров", salary: 14, minAge: 14, minInt: 12, desc: "Доставка воды." },
      { title: "Страж каравана", salary: 38, minAge: 18, minSword: 70, desc: "Отражение налётов." },
      { title: "Проводник Лабиринтов", salary: 95, minAge: 24, minInt: 80, desc: "Древние залы." },
      { title: "Песчаный Барон", salary: 260, minAge: 32, minInt: 180, desc: "Владелец оазисов." }
    ]}
  ]
};

const UNDERGROUND_JOBS = {
  asura: { id: "underground_asura", name: "🗡️ Теневой Синдикат Роа", ranks: [
    { title: "Карманник трущоб", salary: 22, minAge: 13, minNorth: 15, risk: 0.15 },
    { title: "Скупщик реликвий", salary: 60, minAge: 17, minNorth: 40, risk: 0.22 },
    { title: "Теневой ликвидатор", salary: 160, minAge: 22, minSword: 150, risk: 0.30 },
    { title: "Глава Теней Асуры", salary: 420, minAge: 28, minSword: 320, risk: 0.35 }
  ]},
  ranoa: { id: "underground_ranoa", name: "🔮 Контрабандисты Шарии", ranks: [
    { title: "Курьер чёрного рынка", salary: 24, minAge: 13, minNorth: 15, risk: 0.14 },
    { title: "Сбытчик кристаллов", salary: 65, minAge: 17, minMagic: 50, risk: 0.20 },
    { title: "Фальшивомонетчик", salary: 170, minAge: 22, minInt: 95, risk: 0.28 },
    { title: "Барон Чёрной Магии", salary: 410, minAge: 28, minMagic: 260, risk: 0.35 }
  ]},
  demon: { id: "underground_demon", name: "💀 Мародёры Пустошей", ranks: [
    { title: "Мародёр руин", salary: 20, minAge: 12, minNorth: 15, risk: 0.16 },
    { title: "Пустынный налётчик", salary: 55, minAge: 16, minSword: 55, risk: 0.24 },
    { title: "Главарь перевала", salary: 150, minAge: 21, minSword: 160, risk: 0.32 },
    { title: "Атаман Караванов", salary: 380, minAge: 27, minSword: 330, risk: 0.38 }
  ]},
  great_forest: { id: "underground_forest", name: "🌲 Браконьеры Чащи", ranks: [
    { title: "Капканщик шкур", salary: 22, minAge: 12, minNorth: 18, risk: 0.15 },
    { title: "Браконьер святилищ", salary: 58, minAge: 16, minSword: 60, risk: 0.22 },
    { title: "Теневой ловец", salary: 160, minAge: 21, minSword: 170, risk: 0.34 },
    { title: "Хозяин Подполья Леса", salary: 400, minAge: 28, minSword: 340, risk: 0.38 }
  ]},
  milis: { id: "underground_milis", name: "🩸 Культ Чёрного Древа", ranks: [
    { title: "Тайный святотатец", salary: 26, minAge: 14, minInt: 18, risk: 0.18 },
    { title: "Скупщик реликвий", salary: 70, minAge: 18, minInt: 55, risk: 0.26 },
    { title: "Ересиарх Культа", salary: 180, minAge: 23, minMagic: 150, risk: 0.33 },
    { title: "Патриарх Теней", salary: 450, minAge: 30, minMagic: 300, risk: 0.40 }
  ]},
  begaritt: { id: "underground_begaritt", name: "🏜️ Корсары Барханов", ranks: [
    { title: "Вор колодцев", salary: 24, minAge: 13, minNorth: 18, risk: 0.15 },
    { title: "Налётчик на оазисы", salary: 65, minAge: 17, minSword: 65, risk: 0.25 },
    { title: "Хозяин тайного оазиса", salary: 175, minAge: 22, minSword: 180, risk: 0.32 },
    { title: "Султан Разбойников", salary: 440, minAge: 29, minSword: 360, risk: 0.39 }
  ]}
};

const ASURA_POLITICS = {
  factions: [
    { id: "ariel", name: "Принцесса Ариэль Анемой Асура", icon: "👑", desc: "Реформаторы, союз с Сильфи и Люком." },
    { id: "prince_first", name: "Первый Принц Гравелл", icon: "🦁", desc: "Консерваторы, старая знать и армия." },
    { id: "prince_second", name: "Второй Принц Хальфас", icon: "🐍", desc: "Тайные интриги и гильдии убийц." }
  ],
  nobilityTitles: [
    { id: "citizen", name: "Свободный гражданин", salary: 0, influence: 0 },
    { id: "knight", name: "Пожалованный Рыцарь", salary: 15, influence: 10 },
    { id: "baron", name: "Барон Провинции", salary: 45, influence: 25 },
    { id: "viscount", name: "Виконт Роа", salary: 100, influence: 60 },
    { id: "count", name: "Граф Королевства", salary: 220, influence: 120 },
    { id: "duke", name: "Герцог Асуры", salary: 550, influence: 280 }
  ]
};

// Семь Великих Сил на плотной шкале (20 000 -> 95 000 БМ)
const SEVEN_GREAT_POWERS = [
  { rank: 1, title: "Бог Техники", name: "Неизвестный Владыка", region: "ranoa", cp: 95000, hp: 45000, maxHp: 45000, isDead: false },
  { rank: 2, title: "Бог Драконов", name: "Орстед", region: "asura", cp: 85000, hp: 40000, maxHp: 40000, isDead: false },
  { rank: 3, title: "Бог Бойцов", name: "Бадигади (Золотая Броня)", region: "begaritt", cp: 65000, hp: 32000, maxHp: 32000, isDead: false },
  { rank: 4, title: "Бог Демонов", name: "Лаплас", region: "demon", cp: 48000, hp: 22000, maxHp: 22000, isDead: false },
  { rank: 5, title: "Бог Смерти", name: "Рэндольф Мариан", region: "asura", cp: 35000, hp: 15000, maxHp: 15000, isDead: false },
  { rank: 6, title: "Бог Меча", name: "Гал Фарион", region: "ranoa", cp: 26000, hp: 11000, maxHp: 11000, isDead: false },
  { rank: 7, title: "Бог Севера", name: "Александр (Кальман III)", region: "asura", cp: 20000, hp: 8500, maxHp: 8500, isDead: false }
];

const REPLACEMENT_MASTERS = {
  1: ["Механический Архонт Зетта", "Хранитель Формул Альвиус", "Искатель Первой Эпохи Крон"],
  2: ["Кровавый Дракон Валхар", "Наследник Золотой Чешуи Игнис", "Рыцарь Дракона Сайрус"],
  3: ["Чемпион Арены Кассандра", "Титан Кулака Бранн", "Король Гладиаторов Рагнар"],
  4: ["Владычица Багровой Маны Селена", "Демонический Лорд Арктур", "Беззвучный Архимаг Валдис"],
  5: ["Тень Жнеца Нокс", "Безымянный Палач Милиса", "Мастер Клинков Туманов Каэль"],
  6: ["Алый Святой Меча Джино", "Принцесса Света Изольда", "Мастер Додзё Севера Торваль"],
  7: ["Странствующий Герой Эльдрик", "Железный Трикстер Леонхард", "Рыцарь Свободной Стали Маркус"]
};

const SEVEN_POWERS_QUESTS = [
  { rank: 7, title: "Поиски Бога Севера Кальмана III", regionKey: "asura", reqCp: 14000, desc: "Расспросить в тавернах Арса о мастере, орудующем мечом в перекате." },
  { rank: 6, title: "Экспедиция на Святую Землю Меча", regionKey: "ranoa", reqCp: 20000, desc: "Подняться на снежные пики додзё Гала Фариона." },
  { rank: 5, title: "Поиски Бога Смерти Рэндольфа", regionKey: "asura", reqCp: 28000, desc: "Найти трактир на окраине королевства, где скрывается великий фехтовальщик." },
  { rank: 4, title: "Гробница Бога Демонов", regionKey: "demon", reqCp: 38000, desc: "Спуститься в жерло чёрного разлома пустоши Некросса." },
  { rank: 3, title: "Алтарь Золотой Брони Бога Бойцов", regionKey: "begaritt", reqCp: 52000, desc: "Вызвать Бадигади на поединок в сердце пустыни." },
  { rank: 2, title: "Вызов Богу Драконов Орстеду", regionKey: "asura", reqCp: 70000, desc: "Встать на пути сильнейшего воина в ущелье Красного Дракона." },
  { rank: 1, title: "Врата Бога Техники", regionKey: "ranoa", reqCp: 82000, desc: "Пробить барьер древнейшей лаборатории Первой Эпохи." }
];

const FACTION_ENDGAMES = {
  orsted: {
    id: "hitogami_void_breach",
    title: "🌌 Прорыв в Белое Пространство: Финал против Хитогами",
    desc: "Вы и Орстед вторгаетесь в измерение Бога Людей! На кону судьба Шестиликого Мира.",
    reqGen: 4, reqCp: 78000, cardClass: "void-rift-card",
    btnText: "⚔️ ВОРВАТЬСЯ В ИЗМЕРЕНИЕ ХИТОГАМИ (ФИНАЛ)",
    boss: { name: "Бог Людей (Хитогами)", cp: 98000, hp: 50000, maxHp: 50000 }
  },
  hitogami: {
    id: "orsted_ambush_finale",
    title: "👁️ Воля Человекобога: Крушение Проклятого Дракона",
    desc: "Ведомый Снами Хитогами, вы заманили Орстеда в ловушку истощения маны! Сокрушите Бога Драконов!",
    reqGen: 4, reqCp: 78000, cardClass: "hitogami-rift-card",
    btnText: "🗡️ СРАЗИТЬ ОРСТЕДА ВО ИМЯ ХИТОГАМИ (ФИНАЛ)",
    boss: { name: "Бог Драконов Орстед (В Ловушке)", cp: 95000, hp: 48000, maxHp: 48000 }
  }
};

const ESTATES = [
  { id: "cottage_buena", name: "🏡 Домик с садом в Буэне", cost: 45, income: 6, hpRegen: 8, desc: "+6🪙/г., +8 HP/г." },
  { id: "townhouse_roa", name: "🏘️ Каменный особняк в Роа", cost: 180, income: 22, hpRegen: 18, desc: "+22🪙/г., +18 HP/г." },
  { id: "milis_manor", name: "⛪ Усадьба в Милисионе", cost: 520, income: 65, hpRegen: 35, desc: "+65🪙/г., +35 HP/г." },
  { id: "sharia_castle", name: "🏰 Замок-резиденция в Шарии", cost: 1400, income: 160, hpRegen: 65, desc: "+160🪙/г., +65 HP/г., +15 маны детям." },
  { id: "asura_palace", name: "👑 Дворец в Асуре", cost: 3500, income: 420, hpRegen: 120, desc: "+420🪙/г., +120 HP/г., +25 к стилям детям." }
];

const CASTLE_UPGRADES = [
  { id: "crypt", name: "🕯️ Фамильный Склеп Предков", cost: 150, desc: "Молитва раз в 5 лет (+20 к Мечу/Магии, 100% сил)." },
  { id: "training_yard", name: "⚔️ Воинский Полигон Меча", cost: 200, desc: "Дети рода получают +25 к Мечу, а тренировки на 25% эффективнее." },
  { id: "alchemy_lab", name: "🧪 Алхимическая Оранжерея", cost: 140, desc: "Ежегодно производит +2 целебных зелья." },
  { id: "grand_vault", name: "🪙 Неприступная Казна", cost: 260, desc: "+15% к прибыли караванов и -5% риска." },
  { id: "trophy_hall", name: "🐉 Зал Трофеев Драконов", cost: 400, desc: "+50 Славы отряда и +1,200 БМ авторитета." }
];

const CARAVAN_ROUTES = [
  { id: "caravan_local", name: "🛒 Местный тракт Фитоа", cost: 35, reward: 65, risk: 0.10, desc: "Доставка зерна (+30🪙)." },
  { id: "caravan_ranoa", name: "❄️ Снежный караван в Шарию", cost: 110, reward: 220, risk: 0.22, desc: "Перевозка мифрила (+110🪙)." },
  { id: "caravan_milis", name: "⛪ Морской конвой в Милис", cost: 280, reward: 620, risk: 0.32, desc: "Шелка и реликвии (+340🪙)." },
  { id: "caravan_begaritt", name: "🏜️ Золотой Караван Бегаритта", cost: 700, reward: 1750, risk: 0.45, desc: "Сквозь пустыню (+1050🪙)!" }
];

const PERUGIUS_TRIALS = [
  { rank: 1, name: "Испытание Первого Духа (Алхор)", reqCp: 5000, rewardText: "Признание рыцарей небес (+80 Знаний)" },
  { rank: 2, name: "Поединок с Золотым Рыцарем Сильфидом", reqCp: 14000, rewardText: "Благословение Дракона (+300 макс. HP, +2,500 БМ)" },
  { rank: 3, name: "Аудиенция у Перугиуса", reqCp: 32000, rewardText: "Драконье Имя и Фактор Лапласа (+1,000🪙)" }
];

const GREYRAT_BRANCHES = [
  { id: "boreas", name: "Северная Ветвь: Бореас Грейрат", region: "Роа", leader: "Саурос Бореас Грейрат", desc: "Яростные мечники и крепости." },
  { id: "notos", name: "Южная Ветвь: Нотос Грейрат", region: "Милис/Асура", leader: "Амарант Нотос Грейрат", desc: "Богатство и магия воды." },
  { id: "zephyrus", name: "Восточная Ветвь: Зефирос Грейрат", region: "Арс", leader: "Филипп Зефирос Грейрат", desc: "Шпионаж и тайные договоры." },
  { id: "euros", name: "Западная Ветвь: Эурос Грейрат", region: "Западные порты", leader: "Гарольд Эурос Грейрат", desc: "Торговый флот и верфи." }
];

const FIRST_WAR_TABLETS = [
  { id: "tab_human", name: "Скрижаль Бога Людей", regionKey: "asura", reqLang: "human", desc: "Катакомбы дворца Арс." },
  { id: "tab_demon", name: "Обелиск Бога Демонов", regionKey: "demon", reqLang: "demon", desc: "Пески пустоши Некросса." },
  { id: "tab_dragon", name: "Плита Драконьего Владыки", regionKey: "begaritt", reqLang: "dragon", desc: "Алтарь Лабиринта Бегаритта." },
  { id: "tab_beast", name: "Стела Священного Зверя", regionKey: "great_forest", reqLang: "beast", desc: "Сердце Великого Древа." },
  { id: "tab_fighter", name: "Скрижаль Бога Бойцов", regionKey: "ranoa", reqLang: "god_fighter", desc: "Тайная зала Академии Шарии." }
];

const REGIONS = {
  asura: { name: "🏰 Королевство Асура", travelCost: 25, mapX: 165, mapY: 108, color: "#fbbf24", desc: "Сердце мира, столица Арс и плодородные земли Фитоа.", origins: [
    { id: "boreas", name: "Дом Бореас Грейрат", coins: 110, manaBonus: 15, int: 5, swordGod: 12, log: "Вы открыли глаза в крепости Роа ветви Бореас." },
    { id: "notos", name: "Дом Нотос Грейрат", coins: 95, manaBonus: 18, int: 6, waterGod: 12, log: "Мраморные залы юга Асуры." },
    { id: "knight_buena", name: "Рыцари деревни Буэна", coins: 25, manaBonus: 8, swordGod: 10, int: 3, log: "Уютный дом у пшеничных полей." },
    { id: "slums_ars", name: "Трущобы столицы Арс", coins: 4, manaBonus: 5, northGod: 14, int: 2, log: "Суровые переулки столицы." }
  ]},
  ranoa: { name: "❄️ Королевства Раноа", travelCost: 45, mapX: 168, mapY: 42, color: "#38bdf8", desc: "Северные земли, Шария и Святая Земля Меча.", origins: [
    { id: "academy_prof", name: "Семья Профессора", coins: 75, manaBonus: 30, int: 12, log: "Вы выросли среди фолиантов Шарии." },
    { id: "magic_guild", name: "Цех Артефакторов", coins: 45, manaBonus: 20, int: 8, log: "Мастерская кристаллов маны." },
    { id: "winter_hunter", name: "Охотники ледников", coins: 12, manaBonus: 8, northGod: 14, int: 3, log: "Ледяной ветер Севера." }
  ]},
  demon: { name: "🌋 Демонический Континент", travelCost: 75, mapX: 288, mapY: 66, color: "#ef4444", desc: "Багровые пустоши, монстры и Город Ветров.", origins: [
    { id: "migurd_village", name: "Деревня Мигурд", coins: 10, manaBonus: 40, int: 8, log: "Сапфировые волосы и телепатия." },
    { id: "wind_port", name: "Контрабандисты Ветров", coins: 35, manaBonus: 12, northGod: 16, int: 5, log: "Шум портовых таверн." }
  ]},
  great_forest: { name: "🌲 Великий Лес", travelCost: 40, mapX: 222, mapY: 145, color: "#10b981", desc: "Вековые кроны, родина клана Дорудиа.", origins: [
    { id: "dorudia", name: "Клан Дорудиа", coins: 18, manaBonus: 12, swordGod: 20, int: 4, log: "Дом среди гигантских ветвей." },
    { id: "scout", name: "Лесные следопыты", coins: 8, manaBonus: 8, northGod: 18, int: 4, log: "Бесшумные прыжки по кронам." }
  ]},
  milis: { name: "⛪ Святая Земля Милис", travelCost: 45, mapX: 168, mapY: 178, color: "#e2e8f0", desc: "Белокаменная столица у Священного Древа.", origins: [
    { id: "temple_knight", name: "Рыцари Храма", coins: 60, manaBonus: 15, waterGod: 18, int: 5, log: "Белый плащ Святого Милиса." },
    { id: "merchant", name: "Торговый дом Милиса", coins: 80, manaBonus: 5, int: 8, log: "Шелка, специи и караваны." }
  ]},
  begaritt: { name: "🏜️ Континент Бегаритт", travelCost: 90, mapX: 62, mapY: 162, color: "#f59e0b", desc: "Раскалённая пустыня и смертоносные лабиринты.", origins: [
    { id: "dungeon_raider", name: "Искатели Лабиринтов", coins: 55, manaBonus: 18, swordGod: 15, int: 6, log: "Жизнь у входа в лабиринт." },
    { id: "desert_nomad", name: "Кочевники Барханов", coins: 15, manaBonus: 8, northGod: 20, int: 4, log: "Сквозь бури и пески." }
  ]}
};

const MAP_ROUTES = [
  ["ranoa", "asura"], ["asura", "great_forest"], ["great_forest", "milis"],
  ["asura", "milis"], ["ranoa", "demon"], ["milis", "begaritt"], ["asura", "begaritt"]
];

const SHOP_ITEMS = [
  { id: "bronze_dagger", type: "weapon", name: "🗡️ Бронзовый кинжал", cost: 15, cp: 45, desc: "+45 БМ." },
  { id: "iron_sword", type: "weapon", name: "⚔️ Железный палаш", cost: 40, cp: 130, desc: "+130 БМ." },
  { id: "oak_staff", type: "weapon", name: "🪄 Посох из ветви Энта", cost: 65, cp: 210, desc: "+210 БМ." },
  { id: "steel_rapier", type: "weapon", name: "🤺 Асурианская рапира", cost: 120, cp: 380, desc: "+380 БМ." },
  { id: "heavy_claymore", type: "weapon", name: "🪓 Двуручный клеймор севера", cost: 220, cp: 680, desc: "+680 БМ." },
  { id: "dragon_blade", type: "weapon", name: "🗡️ Клинок из кости Дракона", cost: 480, cp: 1400, desc: "+1,400 БМ." },
  { id: "staff_arcane", type: "weapon", name: "🔮 Посох Магического Океана", cost: 850, cp: 2400, desc: "+2,400 БМ." },
  { id: "phoenix_spear", type: "weapon", name: "🔱 Копьё Спардов", cost: 1300, cp: 3500, desc: "+3,500 БМ." },
  { id: "aqua_heartia", type: "weapon", name: "🌟 Посох Водного Океана", cost: 1900, cp: 4800, desc: "+4,800 БМ." },
  { id: "god_slayer_sword", type: "weapon", name: "⚡ Меч Рассекатель Света", cost: 3200, cp: 7500, desc: "Клинок школы Бога (+7,500 БМ)." },
  { id: "apprentice_robe", type: "armor", name: "🧥 Мантия ученика", cost: 12, cp: 35, hp: 10, desc: "+35 БМ, +10 макс. HP." },
  { id: "leather_armor", type: "armor", name: "🛡️ Кожаный доспех", cost: 35, cp: 110, hp: 25, desc: "+110 БМ, +25 макс. HP." },
  { id: "steel_plate", type: "armor", name: "🛡️ Стальной нагрудник", cost: 130, cp: 420, hp: 55, desc: "+420 БМ, +55 макс. HP." },
  { id: "mithril_chain", type: "armor", name: "⛓️ Мифриловая кольчуга", cost: 320, cp: 1000, hp: 100, desc: "+1,000 БМ, +100 макс. HP." },
  { id: "dragon_scale", type: "armor", name: "🐉 Доспех Красного Дракона", cost: 1100, cp: 3200, hp: 220, desc: "+3,200 БМ, +220 макс. HP." },
  { id: "royal_aegis", type: "armor", name: "👑 Королевский Эгид Асуры", cost: 2400, cp: 5800, hp: 380, desc: "+5,800 БМ, +380 макс. HP." },
  { id: "magic_armor", type: "armor", name: "🤖 Магическая Броня «Версия 1»", cost: 4500, cp: 9500, hp: 650, desc: "Экзоскелет титанов (+9,500 БМ, +650 макс. HP)." },
  { id: "ring_mana", type: "accessory", name: "💍 Кольцо Концентрации Маны", cost: 85, cp: 260, desc: "+260 БМ." },
  { id: "boots_wind", type: "accessory", name: "👢 Сапоги Ветроступа", cost: 260, cp: 750, desc: "+750 БМ." },
  { id: "laplace_gem", type: "accessory", name: "💎 Самоцвет Демон-Дракона", cost: 1100, cp: 2800, desc: "+2,800 БМ." },
  { id: "prosthetic_arm", type: "accessory", name: "🦾 Протез из Сплава Зари", cost: 650, cp: 1600, desc: "Снимает штраф за потерю руки (+1,600 БМ)." },
  { id: "heal_potion", type: "potion", name: "🧪 Зелье Исцеления", cost: 15, heal: 60, desc: "+60 HP в бою или вне боя." }
];

const DUNGEONS = [
  { id: "dung_cellar", name: "🕳️ Катакомбы Гоблинов", reqRank: "F", maxFloors: 5, cpBase: 160, dropArtifact: "bronze_dagger", desc: "Сырые норы под деревней Буэна." },
  { id: "dung_ruins", name: "🏛️ Руины Павших Рыцарей", reqRank: "D", maxFloors: 8, cpBase: 650, dropArtifact: "steel_rapier", desc: "Каменные залы с ловушками." },
  { id: "dung_teleport", name: "🌀 Лабиринт Телепортации", reqRank: "B", maxFloors: 12, cpBase: 3500, dropArtifact: "laplace_gem", desc: "Смертоносный лабиринт в Бегаритте." },
  { id: "dung_dragon", name: "🐉 Бездна Драконьего Гребня", reqRank: "S", maxFloors: 15, cpBase: 14000, dropArtifact: "dragon_scale", desc: "Гнездо древних виверн и Короля Драконов." }
];

const ALL_GUILD_QUESTS = [
  { id: "q_f1", rank: "F", name: "🐀 Крысы в амбарах", enemy: "Крыса-мутант", cp: 90, hp: 50, reward: 10, gp: 8 },
  { id: "q_f2", rank: "F", name: "🌿 Травы у волчьих нор", enemy: "Степной волчонок", cp: 120, hp: 60, reward: 14, gp: 10 },
  { id: "q_e1", rank: "E", name: "🐗 Клыкастые Кабаны", enemy: "Клыкастый Вепрь", cp: 260, hp: 110, reward: 25, gp: 15 },
  { id: "q_e2", rank: "E", name: "🍄 Кислотные Слизни", enemy: "Кислотный Слизень", cp: 320, hp: 130, reward: 32, gp: 18 },
  { id: "q_d1", rank: "D", name: "🐺 Двуглавые Волки", enemy: "Вожак Двуглавых", cp: 680, hp: 230, reward: 60, gp: 25 },
  { id: "q_d2", rank: "D", name: "🧌 Набег гоблинов", enemy: "Гоблин-главарь", cp: 880, hp: 280, reward: 78, gp: 30 },
  { id: "q_c1", rank: "C", name: "🐍 Багровые Кобры", enemy: "Багровая Кобра", cp: 1600, hp: 480, reward: 140, gp: 45 },
  { id: "q_c2", rank: "C", name: "🧟 Зачистка склепа", enemy: "Рыцарь-скелет", cp: 2100, hp: 580, reward: 185, gp: 50 },
  { id: "q_b1", rank: "B", name: "🗿 Каменный Энт", enemy: "Каменный Энт", cp: 4200, hp: 1100, reward: 320, gp: 80 },
  { id: "q_b2", rank: "B", name: "🦂 Императорский Скорпион", enemy: "Императорский Скорпион", cp: 5500, hp: 1400, reward: 420, gp: 95 },
  { id: "q_a1", rank: "A", name: "🦅 Ледяная Виверна", enemy: "Ледяная Виверна", cp: 9200, hp: 2600, reward: 680, gp: 150 },
  { id: "q_a2", rank: "A", name: "🦍 Снежный Бегемот", enemy: "Пещерный Бегемот", cp: 11500, hp: 3400, reward: 850, gp: 180 },
  { id: "q_s1", rank: "S", name: "🐉 Красный Дракон", enemy: "Красный Дракон", cp: 16000, hp: 6200, reward: 1400, gp: 300 },
  { id: "q_s2", rank: "S", name: "💀 Архилич Бездны", enemy: "Архилич Бездны", cp: 19500, hp: 8200, reward: 1850, gp: 450 }
];

const CANON_NPCS = [
  { id: "sylphie", name: "Сильфиетта", gender: "female", race: "Эльф / Полуэльф", role: "Подруга детства • Маг без слов", cp: 900, region: "asura", minAge: 4, maxAge: 14, baseChance: 0.25 },
  { id: "roxy", name: "Рокси Мигурдия", gender: "female", race: "Демон", role: "Наставница • Маг Святого Ранга", cp: 2800, region: "asura", minAge: 5, maxAge: 16, baseChance: 0.22 },
  { id: "eris", name: "Эрис Бореас Грейрат", gender: "female", race: "Человек", role: "Леди Бореас • Бешеная мечница", cp: 1800, region: "asura", minAge: 7, maxAge: 18, baseChance: 0.22 },
  { id: "ghislaine", name: "Гилен Дедольдия", gender: "female", race: "Зверочеловек", role: "Король Меча", cp: 9500, region: "asura", minAge: 7, maxAge: 25, baseChance: 0.16 },
  { id: "ruijerd", name: "Руджерд Спардия", gender: "male", race: "Спард", role: "Тупик • Воин сотен битв", cp: 11500, region: "demon", minAge: 10, maxAge: 35, baseChance: 0.22 },
  { id: "cliff", name: "Клифф Гриммор", gender: "male", race: "Человек", role: "Гениальный экзорцист Милиса", cp: 2200, region: "milis", minAge: 10, maxAge: 22, baseChance: 0.20 },
  { id: "zanoba", name: "Заноба Широне", gender: "male", race: "Человек", role: "Мико чудовищной силы", cp: 6800, region: "ranoa", minAge: 12, maxAge: 28, baseChance: 0.20 }
];

// Личные квесты канонических спутников (открываются при дружбе >= 80%)
const CANON_QUESTS = {
  roxy: { title: "Тайна Святого Водяного Круга", rewardText: "Рокси подарила вам Посох Водного Океана и обучила Святой магии!", action: (p) => {
    const st = SHOP_ITEMS.find(i => i.id === "aqua_heartia");
    if (st) p.inventory.push({ ...st });
    p.magicExp += 80;
  }},
  sylphie: { title: "Секрет Беззвучного Каста", rewardText: "Сильфи научила вас тончайшему контролю маны (+60 Магии, +45 макс. маны)!", action: (p) => { p.magicExp += 60; p.maxMana += 45; } },
  eris: { title: "Спарринг Бешеного Пса", rewardText: "Эрис выбила из вас весь страх в дуэли (+90 к Мечу, +30 HP)!", action: (p) => { p.swordGodExp += 90; p.maxHp += 30; } },
  ghislaine: { title: "Урок Короля Меча", rewardText: "Гилен показала стойку Меча Света (+110 к Мечу)!", action: (p) => { p.swordGodExp += 110; } },
  ruijerd: { title: "Клятва Воина-Спарда", rewardText: "Руджерд передал боевые приёмы (+80 Севера, +80 Славы отряда)!", action: (p) => { p.northGodExp += 80; p.squadFame += 80; } },
  cliff: { title: "Благословение Экзорциста", rewardText: "Клифф снял все ваши проклятия и излечил любые травмы (+40 Знаний)!", action: (p) => { p.injuries = []; p.hp = p.maxHp; p.intellect += 40; } },
  zanoba: { title: "Чертёж Магической Брони", rewardText: "Заноба подарил вам уникальную броню-прототип (+150 HP, +300🪙)!", action: (p) => { p.maxHp += 150; p.coins += 300; } }
};

const SCHOOLS = [
  { id: "ranoa_academy", name: "🎓 Магическая Академия Раноа", regionKey: "ranoa", region: "Раноа (Шария)", minAge: 13, cost: 120, desc: "Центр высшей магии и беззвучного каста." },
  { id: "asura_academy", name: "🏰 Королевская Академия Асуры", regionKey: "asura", region: "Асура (Арс)", minAge: 12, cost: 160, desc: "Элитное заведение знати и рыцарей." },
  { id: "sword_sanctuary", name: "🗡️ Святая Земля Меча", regionKey: "ranoa", region: "Раноа (Север)", minAge: 10, cost: 80, desc: "Тренировки в снежных пиках у Бога Меча." },
  { id: "milis_seminary", name: "⛪ Семинария Святого Милиса", regionKey: "milis", region: "Милис (Милисион)", minAge: 11, cost: 90, desc: "Священная магия лечения и барьеры." }
];

const STORY_ACTIVITIES = [
  // --- 1-Я ЖИЗНЬ / ЭПОХА КАТАКЛИЗМА (20 ВЕХ) ---
  { id: "s1_awakening", era: "first", age: 1, name: "📖 1. Пробуждение памяти прошлой жизни", desc: "Осознать себя в новом мире и ощутить потоки маны.",
    action: (p) => { p.intellect += 3; p.maxMana += 12; return "Вы вспомнили прошлый мир и начали расширять сосуд души (+3 Знаний, +12 макс. маны)!"; } },
  { id: "s1_books", era: "first", age: 3, name: "📖 2. Тайное чтение фолиантов отца", desc: "Добраться до запертого шкафа с трактатами по магии.",
    action: (p) => { p.intellect += 5; p.magicExp += 12; return "Вы освоили грамматику и азы заклинаний (+5 Знаний, +12 Магии)!"; } },
  { id: "s1_waterball", era: "first", age: 5, name: "📖 3. Первый беззвучный Водяной Шар", desc: "Сотворить магию силой воображения без слов во дворе.",
    action: (p) => { p.magicExp += 22; p.maxMana += 25; return "Водяной шар разнёс стену двора! Родители в шоке (+22 Магии, +25 макс. маны)!"; } },
  { id: "s1_mentor", era: "first", age: 6, name: "📖 4. Приезд странствующей наставницы", desc: "Демон-маг или ветеран меча стучится в двери дома.",
    action: (p) => { p.magicExp += 18; p.swordGodExp += 10; p.intellect += 5; return "Наставник открыл секреты стихий и дисциплины (+18 Магии, +10 Мечу, +5 Знаний)!"; } },
  { id: "s1_roa", era: "first", age: 7, name: "📖 5. Путь в крепость Роа (Служба гувернёром)", desc: "Отправиться в земли Бореас для обучения строптивой наследницы.",
    action: (p) => { p.coins += 45; p.swordGodExp += 15; p.asuraInfluence += 10; return "Походный плащ, монеты и уважение дома Бореас (+45🪙, +15 Мечу, +10 влияния)!"; } },
  { id: "s1_red_omen", era: "first", age: 9, name: "🔴 6. Багровое знамение в небе Фитоа", desc: "Огромный вихрь маны сгущается над облаками.",
    action: (p) => { p.maxMana += 18; p.intellect += 5; return "Вы зарисовали аномалию в дневник (+18 макс. маны, +5 Знаний)!"; } },
  { id: "s1_calamity", era: "first", age: 10, name: "⚡ 7. КАТАКЛИЗМ МАНЫ ФИТОА", desc: "Ослепительная вспышка разорвала небо и смела целую провинцию!",
    action: (p, ws) => {
      p.calamityTriggered = true;
      if (ws) ws.calamityOccurred = true;
      const targets = ["demon", "begaritt", "great_forest"];
      const newReg = targets[Math.floor(Math.random() * targets.length)];
      p.currentRegionKey = newReg;
      p.relations.forEach(r => { if (r.isFamily) r.isLost = true; });
      return `💥 <b>КАТАКЛИЗМ МАНЫ!</b> Вас выбросило на <b>${REGIONS[newReg].name}</b>! Семья рассеяна по свету!`;
    }
  },
  { id: "s1_hitogami_first_dream", era: "first", age: 11, name: "👁️ 8. Первый Сон Белого Пространства", desc: "Во сне возник безликий силуэт: «Я — Бог Людей Хитогами...»",
    choices: [
      { text: "Прислушаться к совету Хитогами (+55🪙, +15 Магии)", action: (p) => {
        p.hitogamiTrust += 15; p.coins += 55; p.magicExp += 15;
        return "Вы последовали голосу из сна и нашли схрон (+55🪙, +15 Магии, Доверие Хитогами +15)!";
      }},
      { text: "Отказать снам (+10 Знаний, +15 Севера)", action: (p) => {
        p.hitogamiTrust -= 10; p.intellect += 10; p.northGodExp += 15;
        return "Хитогами усмехнулся и исчез. Вы пробились сами (+10 Знаний, +15 Севера)!";
      }}
    ]
  },
  { id: "s1_demon_continent", era: "first", age: 12, name: "🌋 9. Переход через Багровые Пустоши", desc: "Выжить среди монстров и встретить воина-Спарда.",
    action: (p) => { p.swordGodExp += 22; p.northGodExp += 18; p.maxHp += 20; return "Суровые бои на пустошах закалили тело (+22 Мечу, +18 Севера, +20 HP)!"; } },
  { id: "s1_ocean_crossing", era: "first", age: 13, name: "🚢 10. Переправа в Милисион", desc: "Добраться до порта Ветров и переплыть океан.",
    action: (p) => {
      let found = p.relations.find(r => r.isLost);
      if (found) { found.isLost = false; return `🎉 В лагере Милиса вы чудом нашли <b>${found.name}</b>!`; }
      p.coins += 40; return "Вы переплыли океан, подрабатывая на судне (+40🪙).";
    }
  },
  { id: "s1_orsted_clash", era: "first", age: 14, name: "🐉 11. Встреча в Ущелье Красного Дракона", desc: "Перед вами возникает Бог Драконов Орстед. Проклятие душит вас!",
    choices: [
      { text: "Упасть на колени и промолчать (-20 HP, +8 Знаний)", action: (p) => { p.hp = Math.max(10, p.hp - 20); p.intellect += 8; return "Вы пережили ледяной взгляд Орстеда."; } },
      { text: "Упомянуть Хитогами! (-70 HP, +25 маны)", action: (p) => { p.hp = Math.max(5, p.hp - 70); p.maxMana += 25; return "Орстед пробил вам грудь, но пощадил в последний миг!"; } }
    ]
  },
  { id: "s1_fitoa_truth", era: "first", age: 15, name: "🏚️ 12. Руины родины и обелиск пропавших", desc: "Вернуться на пепелище Фитоа и прочесть списки погибших.",
    action: (p) => { p.intellect += 10; p.coins += 25; return "Вы дали клятву защищать оставшихся близких (+10 Знаний, +25🪙)."; } },
  { id: "s1_god_crossroads", era: "first", age: 16, name: "⚖️ 13. РАСПУТЬЕ БОГОВ: Орстед или Хитогами?", desc: "Сон Хитогами и тень Проклятого Дракона требуют выбора стороны!",
    choices: [
      { text: "🐉 Встать под знамя Орстеда (Союзник Дракона, Свет)", action: (p) => {
        p.dynastyFaction = "orsted"; p.factionProgress += 20; p.reputation += 20; p.swordGodExp += 25; p.magicExp += 25;
        return "Вы избрали путь союзника Бога Драконов! (+25 Мечу и Магии, +20 Света)!";
      }},
      { text: "👁️ Принять Сны Хитогами (Апостол Снов, +200🪙, +40 маны)", action: (p) => {
        p.dynastyFaction = "hitogami"; p.hitogamiTrust += 40; p.reputation -= 15; p.coins += 200; p.maxMana += 40;
        return "Вы стали Апостолом Снов! Хитогами раскрыл тайные клады (+200🪙, +40 макс. маны)!";
      }}
    ]
  },
  { id: "s1_academy_years", era: "first", age: 18, name: "🎓 14. Триумф в Академии Шарии", desc: "Дуэль со зверолюдьми и признание особого статуса студента.",
    action: (p) => { p.magicExp += 30; p.intellect += 15; p.squadFame += 30; return "Вы покорили Академию (+30 Магии, +15 Знаний, +30 Славы)!"; } },
  { id: "s1_begaritt_letter", era: "first", age: 21, name: "🏜️ 15. Письмо о беде в Лабиринте Бегаритта", desc: "Родные в ловушке пустыни! Пора идти через телепорт.",
    action: (p) => { p.dungeonProgress["dung_teleport"] = Math.max(p.dungeonProgress["dung_teleport"] || 1, 5); p.swordGodExp += 25; return "Вы пробились вглубь Лабиринта (+25 Мечу)!"; } },
  { id: "s1_labyrinth_guardian", era: "first", age: 23, name: "💎 16. Падение Магической Гидры", desc: "Решающая схватка в сердце лабиринта ради спасения семьи.",
    action: (p) => {
      let lost = p.relations.find(r => r.isLost);
      if (lost) lost.isLost = false;
      p.coins += 240; p.magicExp += 35;
      return "Гидра повержена! Вы спасли родных и вынесли сокровища (+240🪙, +35 Магии)!";
    }
  },
  { id: "s1_asura_throne", era: "first", age: 26, name: "👑 17. Битва за Трон Асуры", desc: "Столкновение клинков в столице Арс и политический переворот.",
    action: (p) => { p.asuraInfluence += 40; p.coins += 180; p.swordGodExp += 30; return "Ключевая роль в королевском перевороте (+40 влияния, +180🪙, +30 Мечу)!"; } },
  { id: "s1_apostle_clash", era: "first", age: 29, name: "🌑 18. Ночь Теней: Удар Апостола", desc: "Враждебный Бог подослал убийцу, чтобы переломить вашу судьбу.",
    action: (p) => {
      if (p.dynastyFaction === "hitogami") { p.coins += 220; p.northGodExp += 35; return "По Сну Хитогами вы перебили лазутчиков Орстеда (+220🪙, +35 Севера)!"; }
      p.swordGodExp += 35; p.magicExp += 35; return "Вы отбили ночную засаду Апостола (+35 Мечу и Магии)!";
    }
  },
  { id: "s1_magic_armor", era: "first", age: 34, name: "🤖 19. Чертежи Магической Брони", desc: "Соединить гномью инженерию и мана-кристаллы.",
    action: (p) => { p.intellect += 25; p.maxMana += 55; p.maxHp += 50; return "Чертежи боевой брони вписаны в архивы Шарии (+25 Знаний, +55 маны, +50 HP)!"; } },
  { id: "s1_elder_legacy", era: "first", age: 50, name: "📜 20. Завет Основателя Династии", desc: "Заложить фундамент влияния рода на грядущие столетия.",
    action: (p) => { p.asuraInfluence += 45; p.squadFame += 70; p.intellect += 20; return "Летописи рода запечатаны: потомки не забудут ваш путь (+45 влияния, +70 Славы)!"; } },

  // --- БУДУЩИЕ ЖИЗНИ И ВЕКА ВПЕРЁД (430 - 800+ ГГ., БЕЗ ВОЙНЫ С ЛАПЛАСОМ) ---
  { id: "f_child_archives", era: "future", minYear: 430, age: 4, name: "📚 Наследие: Дневники первых героев", desc: "В родовом сундуке хранятся записи времён Катаклизма Фитоа.",
    action: (p) => { p.intellect += 10; p.maxMana += 18; return "Вы изучили опыт прошлого поколения (+10 Знаний, +18 маны)!"; } },
  { id: "f_hitogami_whisper", era: "future", minYear: 430, age: 12, name: "👁️ Сон Хитогами: Зов Нового Поколения", desc: "Человекобог вновь пробирается в сны смертных: «Твои предки оставили след...»",
    choices: [
      { text: "Присягнуть Снам Хитогами (+220🪙, +40 маны)", action: (p) => {
        p.dynastyFaction = "hitogami"; p.hitogamiTrust += 35; p.reputation -= 15; p.coins += 220; p.maxMana += 40;
        return "Вы вступили в круг Апостолов Хитогами (+220🪙, +40 маны)!";
      }},
      { text: "Встать под знамя Орстеда (+30 Мечу и Магии)", action: (p) => {
        p.dynastyFaction = "orsted"; p.factionProgress += 25; p.reputation += 20; p.swordGodExp += 30; p.magicExp += 30;
        return "Вы отвергли Сны Пустоты и принесли клятву Орстеду (+30 Мечу и Магии)!";
      }}
    ]
  },
  { id: "f_fitoa_rebuild", era: "future", minYear: 430, maxYear: 520, age: 18, name: "🌾 Возрождение Провинции Фитоа", desc: "Отстройка разрушенных земель и зачистка бродячих чудовищ.",
    action: (p) => { p.coins += 160; p.asuraInfluence += 25; p.reputation += 15; return "Выросли новые города (+160🪙, +25 влияния, +15 Света)!"; } },
  { id: "f_orsted_network", era: "future", minYear: 440, reqFaction: "orsted", age: 24, name: "🐉 Тайная сеть Орстеда в Милисе", desc: "Охота на теневых агентов Белого Пространства.",
    action: (p) => { p.factionProgress += 30; p.intellect += 20; p.coins += 180; return "Ячейка Апостолов раскрыта (+180🪙, +20 Знаний)!"; } },
  { id: "f_hitogami_sabotage", era: "future", minYear: 440, reqFaction: "hitogami", age: 24, name: "👁️ Диверсия по Сну Хитогами", desc: "Человекобог указал на уязвимость союзников Орстеда.",
    action: (p) => { p.hitogamiTrust += 30; p.reputation -= 15; p.coins += 320; p.northGodExp += 35; return "Операция прошла бесшумно (+320🪙, +35 Севера)!"; } },
  { id: "f_c5_skyships", era: "future", minYear: 500, maxYear: 620, age: 20, name: "⛵ VI век: Магические Баржи", desc: "Учёные Шарии запустили первые воздушные суда на мана-кристаллах.",
    action: (p) => { p.intellect += 25; p.maxMana += 45; return "Освоена навигация небесных судов (+25 Знаний, +45 маны)!"; } },
  { id: "f_c5_powers_audit", era: "future", minYear: 500, age: 30, name: "🏆 Передел Монумента Семи Сил", desc: "Имена на каменной плите вызывают трепет. Пора вписать своё!",
    action: (p) => { p.swordGodExp += 50; p.squadFame += 90; return "Мастера мира следят за вашим ростом (+50 Мечу, +90 Славы)!"; } },
  { id: "f_c6_mana_crisis", era: "future", minYear: 600, maxYear: 720, age: 22, name: "❄️ VII век: Истощение Жил Севера", desc: "Кристаллы Раноа гаснут — нужно спуститься в глубины за сердцем земли.",
    action: (p) => { p.maxMana += 80; p.magicExp += 55; return "Вы стабилизировали северные жилы (+80 макс. маны, +55 Магии)!"; } },
  { id: "f_c6_hitogami_prophet", era: "future", minYear: 600, reqFaction: "hitogami", age: 35, name: "👁️ Пророк Седьмого Столетия", desc: "Сны Хитогами переписывают политическую карту континентов.",
    action: (p) => { p.asuraInfluence += 65; p.coins += 750; return "Короли и архимаги слушаются ваших предсказаний (+65 влияния, +750🪙)!"; } },
  { id: "f_c6_orsted_relics", era: "future", minYear: 600, reqFaction: "orsted", age: 35, name: "🐉 Архив Первого Бога Драконов", desc: "Орстед доверил вам часть древних рун защиты мира.",
    action: (p) => { p.swordGodExp += 60; p.waterGodExp += 60; p.maxHp += 120; return "Древнее искусство Драконов (+60 к стилям, +120 HP)!"; } },
  { id: "f_c7_eternal_dynasty", era: "future", minYear: 700, age: 28, name: "🏛️ VIII+ век: Бессмертный Род", desc: "Ваша фамилия известна от Асуры до пустошей Бегаритта.",
    action: (p) => { p.coins += 1200; p.squadFame += 150; p.maxMana += 100; return "Дома мира присылают дары (+1,200🪙, +150 Славы, +100 маны)!"; } },
  { id: "f_c7_void_echo", era: "future", minYear: 700, age: 42, name: "🌌 Отголосок Белого Пространства", desc: "Спустя столетия после Катаклизма барьер между мирами истончился.",
    action: (p) => { p.magicExp += 80; p.swordGodExp += 80; p.intellect += 40; return "Вы заглянули за грань мироздания (+80 Магии и Мечу, +40 Знаний)!"; } }
];

const ACTIVITIES = [
  { id: "baby_crawl", category: "childhood", name: "👶 Ползать и изучать комнаты", minAge: 0, maxAge: 3, cost: 0, apCost: 1, desc: "Развивает восприятие мира.", action: (p) => { p.intellect += 1; return "Вы изучали комнаты дома (+1 Знаний)."; } },
  { id: "baby_peekaboo", category: "childhood", name: "🍼 Играть с родителями", minAge: 0, maxAge: 2, cost: 0, apCost: 1, desc: "Укрепляет здоровье и покой.", action: (p) => { p.hp = Math.min(p.maxHp, p.hp + 15); return "Тепло родного дома восстановило силы (+15 HP)."; } },
  { id: "listen_parents", category: "childhood", name: "🗣️ Слушать сказки и разговоры", minAge: 1, maxAge: 5, cost: 0, apCost: 1, desc: "Азы речи и истории мира.", action: (p) => { p.intellect += 2; return "Сказки о героях расширили кругозор (+2 Знаний)."; } },
  { id: "toddler_mana", category: "magic", name: "🔮 Концентрация и расширение маны", minAge: 1, maxAge: 100, cost: 0, apCost: 1, desc: "До 10 лет сосуд растёт стремительно; после 10 — каналы твердеют (кроме Фактора Лапласа).", action: (p) => {
    const isLaplace = p.trait.id === "laplace_factor" || p.trait.id === "god_mode";
    const agePenalty = (p.age > 10 && !isLaplace) ? 0.25 : 1.0;
    const mod = (p.trait.growthMod || 1) * (p.raceObj.bonus.manaMod || 1) * agePenalty;
    const gain = Math.max(1, Math.round(6 * mod));
    p.maxMana += gain; p.mana = p.maxMana;
    p.magicExp += Math.round(6 * (p.raceObj.learnMod || 1));
    return `Сосуд маны расширился на <b>+${gain} макс. маны</b>${agePenalty < 1 ? " (каналы взрослого твердеют)" : ""}!`;
  }},
  { id: "wooden_stick_play", category: "childhood", name: "🪵 Тренировка с палкой", minAge: 3, maxAge: 6, cost: 0, apCost: 1, desc: "Первые замахи клинком.", action: (p) => { p.swordGodExp += 6; return "Вы сбивали крапиву палкой (+6 Мечу)."; } },
  { id: "catch_insects", category: "childhood", name: "🦗 Ловля сверчков", minAge: 3, maxAge: 7, cost: 0, apCost: 1, desc: "Реакция глаз и ловкость.", action: (p) => { p.northGodExp += 6; return "Вы перехватывали жуков (+6 Севера)."; } },
  { id: "read_scrolls", category: "life", name: "📜 Изучение свитков и летописей", minAge: 4, maxAge: 100, cost: 3, apCost: 1, desc: "Книги дают Знания (удваивается у Любознательных).", action: (p) => {
    const bonus = p.trait.id === "curious" ? 10 : 6;
    p.coins -= 3; p.intellect += bonus;
    return `Вы изучили древние трактаты (+${bonus} Знаний).`;
  }},
  { id: "magic_circle_study", category: "magic", name: "✨ Изучение магических кругов", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Формулы стихий и призыва.", action: (p) => {
    const gain = Math.round(12 * getTrainingMultiplier(p, p.magicExp));
    p.magicExp += gain; p.intellect += 3;
    return `Вы вычерчивали руны призыва (+${gain} Магии, +3 Знаний).`;
  }},
  { id: "sword_practice", category: "combat", name: "🗡️ Стойка Бога Меча", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Молниеносный выпад (ускоряется рангом и полигоном).", action: (p) => {
    const gain = Math.round(14 * getTrainingMultiplier(p, p.swordGodExp) * (p.castleUpgrades.includes("training_yard") ? 1.25 : 1));
    p.swordGodExp += gain; return `Клинок рассекает воздух (+${gain} Мечу).`;
  }},
  { id: "water_parry", category: "combat", name: "💧 Стойка Бога Воды", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Идеальное парирование.", action: (p) => {
    const gain = Math.round(14 * getTrainingMultiplier(p, p.waterGodExp));
    p.waterGodExp += gain; return `Вы гасили встречные выпады (+${gain} Воды).`;
  }},
  { id: "north_tricks", category: "combat", name: "🌪️ Стойка Бога Севера", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Финты, перекаты и уловки.", action: (p) => {
    const gain = Math.round(14 * getTrainingMultiplier(p, p.northGodExp));
    p.northGodExp += gain; return `Вы освоили выпад из переката (+${gain} Севера).`;
  }},
  { id: "gather_herbs", category: "life", name: "🌿 Сбор редких трав", minAge: 6, maxAge: 100, cost: 0, apCost: 1, desc: "Подработка для аптекаря.", action: (p) => { const e = Math.floor(Math.random() * 8) + 4; p.coins += e; return `Вы сдали корзину трав (+${e}🪙).`; } },
  { id: "school_lesson", category: "school", name: "🎓 Посетить академическую лекцию", minAge: 10, maxAge: 100, cost: 0, apCost: 1, desc: "Прогресс в зачисленной Академии.", action: (p) => {
    if (!p.enrolledSchool) return "Вы не зачислены в Академию! Поступите во вкладке «Мир & Род».";
    const intGain = p.trait.id === "curious" ? 10 : 6;
    p.schoolProgress = p.schoolProgress || 1;
    p.intellect += intGain; p.magicExp += Math.round(16 * (p.raceObj.learnMod || 1));
    if (Math.random() > 0.52) {
      p.schoolProgress++;
      if (p.schoolProgress > 4) {
        p.graduatedSchools.push(p.enrolledSchool);
        p.enrolledSchool = null; p.coins += 120;
        return `🏆 <b>ВЫПУСК!</b> Вы с отличием окончили Академию (+120🪙)!`;
      }
      return `📜 Экзамен сдан! Текущий курс: ${p.schoolProgress}/4.`;
    }
    return `Вы конспектировали лекцию магистра (+16 Магии, +${intGain} Знаний).`;
  }},
  { id: "street_sparring", category: "youth", name: "🥊 Уличные дуэли", minAge: 11, maxAge: 17, cost: 0, apCost: 1, desc: "Опыт уличных стычек.", action: (p) => { p.swordGodExp += 10; p.northGodExp += 10; return "Поединок на окраине (+10 Мечу и Севера)."; } },
  { id: "youth_debate", category: "youth", name: "📚 Диспуты о природе маны", minAge: 12, maxAge: 25, cost: 0, apCost: 1, desc: "Споры об устройстве мира.", action: (p) => { p.intellect += 8; return "Вы блестяще отстояли тезисы (+8 Знаний)."; } },
  { id: "tavern_rest", category: "life", name: "🛌 Отдых в таверне (100% HP)", minAge: 6, maxAge: 100, cost: 6, apCost: 1, desc: "Снять комнату и восстановить HP.", action: (p) => { p.coins -= 6; p.hp = p.maxHp; return "Горячий ужин и сон полностью восстановили здоровье!"; } },
  { id: "high_society_ball", category: "life", name: "🎭 Дворянский бал", minAge: 16, maxAge: 100, cost: 18, apCost: 1, desc: "Связи среди знати Асуры.", action: (p) => { p.coins -= 18; p.asuraInfluence += 12; return "Полезные знакомства (+12 влияния)."; } },
  { id: "write_memoirs", category: "elder", name: "✍️ Родовые хроники", minAge: 45, maxAge: 100, cost: 0, apCost: 1, desc: "Мудрость для потомков.", action: (p) => { p.intellect += 12; return "Мемуары занесены в архив (+12 Знаний)."; } },
  { id: "mentor_young", category: "elder", name: "🥋 Наставлять учеников", minAge: 40, maxAge: 100, cost: 0, apCost: 1, desc: "Передача секретов клинка.", action: (p) => { p.squadFame += 20; p.coins += 25; return "Ученики внимали урокам (+20 Славы, +25🪙)."; } }
];

const RANDOM_EVENTS = [
  { id: "hitogami_dream_tempt", minAge: 12, chance: 0.22, icon: "👁️", title: "Сон Белого Пространства (Хитогами)",
    desc: "Среди ночи туман расступается, и безликий Бог Людей улыбается вам: «Послушай мой совет — забери сундук в старой часовне до рассвета...»",
    choices: [
      { text: "Последовать совету Хитогами (+120🪙, +18 Магии, Доверие +20)", action: (p) => {
        p.coins += 120; p.magicExp += 18; p.hitogamiTrust += 20; p.reputation -= 10;
        if (p.dynastyFaction === "neutral" && p.hitogamiTrust >= 35) {
          p.dynastyFaction = "hitogami";
          return "Вы забрали золото! Сны Хитогами подчинили вашу судьбу — вы стали его Апостолом (+120🪙, +18 Магии)!";
        }
        return "В часовне действительно ждал забытый сундук (+120🪙, +18 Магии)!";
      }},
      { text: "Отвергнуть шёпот Пустоты (+8 Знаний, +10 Света)", action: (p) => {
        p.hitogamiTrust -= 10; p.intellect += 8; p.reputation += 10;
        return "Вы проснулись в холодном поту, но сохранили ясность разума (+8 Знаний, +10 Света).";
      }}
    ]
  },
  { id: "hitogami_dream_price", minAge: 18, chance: 0.25, icon: "🩸", title: "Цена Белого Пространства (Сон Хитогами)",
    desc: "Хитогами усмехается шире прежнего: «Ты получил мои дары. Теперь уничтожь тайник союзников Орстеда и подставь одного из знакомых ради моей цели!»",
    choices: [
      { text: "Исполнить волю Хитогами (+400🪙, +40 ко всем стилям, -30 Тень)", action: (p) => {
        p.coins += 400; p.swordGodExp += 40; p.magicExp += 40; p.hitogamiTrust += 35; p.reputation -= 30;
        const victim = p.relations.find(r => !r.isDead && !r.isFamily);
        if (victim) { victim.relation = Math.max(0, victim.relation - 50); victim.status = "Заклятый враг"; }
        return `Задание выполнено ценой предательства${victim ? ` (${victim.name} проклял вас)` : ""}! (+400🪙, +40 к стилям)`;
      }},
      { text: "Разорвать сделку! (Отказ: бой или удар Апостола!)", action: (p) => {
        p.dynastyFaction = "orsted"; p.hitogamiTrust = 0; p.hp = Math.max(10, p.hp - 55); p.reputation += 25;
        return "Разъярённый Хитогами наслал на вас наёмников! Вы чудом отбились (-55 HP) и перешли к Орстеду!";
      }}
    ]
  },
  { id: "milis_saint_healer", minAge: 14, chance: 0.25, icon: "✨", title: "Архиепископ Исцеления Милиса",
    desc: "Странствующий мастер Святой Магии способен срастить кости и вырастить утраченную руку!",
    choices: [
      { text: "Оплатить ритуал (300🪙 — лечит все травмы и 100% HP)", action: (p) => {
        if (p.coins < 300) return "У вас нет 300 монет на священные реагенты!";
        p.coins -= 300; p.injuries = []; p.hp = p.maxHp;
        return "Ослепительный свет восстановил ваше тело полностью!";
      }},
      { text: "Простое благословение (+20 HP)", action: (p) => { p.hp = Math.min(p.maxHp, p.hp + 20); return "Мягкое сияние согрело душу (+20 HP)."; } }
    ]
  },
  { id: "fame_challenger_duel", minAge: 14, chance: 0.20, icon: "⚔️", title: "Вызов от Искателя Славы!",
    desc: "Странствующий мечник узнал вас по балладам бардов: «Скрести со мной клинок!»",
    choices: [
      { text: "Принять бой и сокрушить наглеца!", action: (p) => {
        const myCp = calcCombatPower(p);
        if (myCp > myCp * (0.55 + Math.random() * 0.45)) { p.swordGodExp += 25; p.squadFame += 25; return "Наглец повержен (+25 Мечу, +25 Славы)!"; }
        p.hp = Math.max(10, p.hp - 30); return "Схватка вышла суровой (-30 HP), но победа за вами!";
      }},
      { text: "Пройти мимо", action: () => "Вы хладнокровно проигнорировали крикуна." }
    ]
  },
  { id: "noble_matchmaking", minAge: 16, chance: 0.16, icon: "💍", title: "Сватовство Дворянского Дома!",
    desc: "К дому прибыла карета знатного рода. Лорд предлагает брак с солидным приданым!",
    choices: [
      { text: "Принять предложение (+150🪙, +25 влияния)", action: (p) => {
        if (p.spouse) return "Вы уже в браке! Сваты удалились.";
        p.coins += 150; p.asuraInfluence += 25;
        const sName = p.gender === "male" ? "Леди Элеонора де Арс" : "Лорд Годфри де Роа";
        const sp = { id: "spouse_" + Date.now(), name: sName, gender: p.gender === "male" ? "female" : "male", race: "Человек", age: p.age + 1, role: "Дворянский супруг", cp: 800, relation: 80, status: "Супруг/Супруга", isFamily: false, isDead: false };
        p.spouse = sp; p.relations.push(sp);
        return `Вы заключили союз с <b>${sName}</b>! Приданое: +150🪙 и +25 влияния!`;
      }},
      { text: "Вежливо отказать", action: () => "Вы ответили, что сердце пока свободно." }
    ]
  },
  { id: "canon_kishirika", isRare: true, minAge: 8, chance: 0.08, icon: "👁️", title: "Императрица Демонов Киширика!",
    desc: "В пыли сидит голодная коротышка с рогами: «Ху-ха-ха! Накорми Киширику за 35 монет, и я подарю тебе Демонический Глаз!»",
    choices: [
      { text: "Отдать 35 монет за Демонический Глаз", action: (p) => {
        if (p.coins < 35) return "Нет 35 монет! Киширика обиженно сбежала.";
        p.coins -= 35;
        const keys = Object.keys(DEMON_EYES);
        const eye = DEMON_EYES[keys[Math.floor(Math.random() * keys.length)]];
        p.demonEyes = p.demonEyes || { left: null, right: null };
        if (!p.demonEyes.left) { p.demonEyes.left = eye; return `👁️ В левую глазницу вживлён <b>${eye.name}</b>!`; }
        if (!p.demonEyes.right) { p.demonEyes.right = eye; return `👁️ В правую глазницу вживлён <b>${eye.name}</b>!`; }
        p.swordGodExp += 30; p.magicExp += 30;
        return "У вас уже оба глаза демона! Киширика поделилась маной (+30 ко всем стилям).";
      }},
      { text: "Пройти мимо", action: () => "Вы не стали связываться со странной девчонкой." }
    ]
  },
  { id: "wandering_bard", minAge: 7, chance: 0.18, icon: "🪕", title: "Песнь Странствующего Барда",
    desc: "В таверне бард поёт баллады о героях прошлых лет.",
    choices: [
      { text: "Угостить элем (3🪙) и расспросить о слухах", action: (p) => { if (p.coins < 3) return "Не хватило монет."; p.coins -= 3; p.intellect += 6; return "Бард раскрыл древние легенды (+6 Знаний)."; } },
      { text: "Просто послушать музыку (+10 HP)", action: (p) => { p.hp = Math.min(p.maxHp, p.hp + 10); return "Мелодия успокоила сердце (+10 HP)."; } }
    ]
  },
  { id: "stolen_wallet", minAge: 10, chance: 0.18, icon: "👝", title: "Вор на базарной площади!",
    desc: "Карманник срезал кошель у купца и несётся прямо на вас!",
    choices: [
      { text: "Поставить подножку (+25🪙, +10 Севера, +8 Света)", action: (p) => {
        if (p.northGodExp >= 12 || Math.random() > 0.3) { p.coins += 25; p.northGodExp += 10; p.reputation += 8; return "Купец наградил вас за помощь (+25🪙, +10 Севера)!"; }
        p.hp = Math.max(5, p.hp - 15); return "Вор полоснул ножом и сбежал (-15 HP).";
      }},
      { text: "Сбить заклинанием (+12 Магии, +8 Света)", action: (p) => { p.magicExp += 12; p.reputation += 8; return "Вор задержан стражей (+12 Магии)."; } },
      { text: "Отойти в сторону", action: () => "Вы не стали вмешиваться." }
    ]
  },
  { id: "canon_orsted", isRare: true, minAge: 16, chance: 0.05, icon: "🐉", title: "Встреча: Бог Драконов Орстед!",
    desc: "В ущелье вы натыкаетесь на мужчину в белом чешуйчатом плаще. Проклятие ужаса сковывает грудь!",
    choices: [
      { text: "Упасть на колени и отвести взгляд", action: (p) => { p.hp = Math.max(10, p.hp - 15); return "Орстед окинул вас ледяным взглядом и прошёл мимо (-15 HP)."; } },
      { text: "Заговорить о Хитогами", action: (p) => {
        if (p.dynastyFaction === "orsted") { p.factionProgress += 15; return "Орстед коротко кивнул: «Действуй по плану, союзник» (+15 прогресса Орстеда)."; }
        p.hp = Math.max(5, p.hp - 70); return "Орстед нанёс сокрушительный удар! Вы чудом выжили (-70 HP)!";
      }}
    ]
  }
];

const SYLLABLES = {
  male: ["Вал", "Сед", "Лео", "Клод", "Жан", "Огюст", "Филипп", "Рей", "Люк", "Марк", "Ден", "Эд", "Рудеус", "Пол", "Клифф", "Арси", "Клайв", "Заноба"],
  female: ["Аме", "Селе", "Хиль", "Эле", "Клэр", "Роза", "Диа", "Лиза", "София", "Жанна", "Али", "Сильфи", "Эрис", "Рокси", "Зенит", "Норн", "Айша"],
  suffix: ["рик", "берт", "ион", "ард", "ель", "ис", "дар", "монт", "валь", "ус", "етта", "ин"],
  surnames: ["Грейрат", "де Роа", "де Арс", "Блэквуд", "Фрост", "Клемент", "Дорудиа", "Мигурдия", "Спардия", "Шевалье"]
};
