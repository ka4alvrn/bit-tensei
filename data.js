const START_YEAR = 407;
const CALAMITY_YEAR = 417;

const SWORD_RANKS = ["Нет", "Новичок", "Рядовой 🥉", "Святой 🌟", "Королевский 👑", "Император ⚡", "Бог ⚔️"];
const MAGIC_RANKS = ["Новичок", "Рядовой 🥉", "Святой 🌟", "Королевский 👑", "Император ⚡", "Бог 🔮"];
const ADVENTURER_RANKS = ["F", "E", "D", "C", "B", "A", "S"];
const ADVENTURER_REQ = { F: 0, E: 30, D: 80, C: 180, B: 380, A: 750, S: 1500 };

const GENERATION_CP_CAPS = { 1: 45000, 2: 140000, 3: 400000, 4: 1200000, 5: 9999999 };

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
    { id: "asura_slums", name: "Нищие трущоб Арса", coins: 5, hp: 15, northGod: 15, desc: "Выживание на улицах столицы (+15 HP, +15 Севера)." },
    { id: "asura_farmer", name: "Пшеничные фермеры Фитоа", coins: 40, hp: 25, desc: "Уютный дом среди золотых полей (+25 HP)." },
    { id: "asura_knight", name: "Потомственные рыцари Асуры", coins: 180, swordGod: 25, int: 5, desc: "Воинская честь (+180🪙, +25 к Мечу)." },
    { id: "asura_high_noble", name: "Высшая аристократия Асуры", coins: 950, int: 22, influence: 40, desc: "Мраморные залы Арса (+950🪙, +40 влияния, +22 Знаний)." }
  ],
  ranoa: [
    { id: "ranoa_trapper", name: "Охотники ледников Севера", coins: 30, hp: 35, northGod: 15, desc: "Закалка вечной мерзлотой (+35 HP, +15 Севера)." },
    { id: "ranoa_artificer", name: "Цеховые артефакторы Шарии", coins: 150, int: 15, manaBonus: 30, desc: "Мастерская кристаллов (+150🪙, +30 маны, +15 Знаний)." },
    { id: "ranoa_prof_dynasty", name: "Династия Профессоров Академии", coins: 500, int: 25, manaBonus: 70, desc: "Библиотеки магии (+500🪙, +70 маны, +25 Знаний)." }
  ],
  demon: [
    { id: "demon_outcast", name: "Парии каменистых пустошей", coins: 5, hp: 45, northGod: 20, desc: "Жестокая жизнь среди монстров (+45 HP, +20 Севера)." },
    { id: "demon_nomad_clan", name: "Кочевой клан воинов-демонов", coins: 70, hp: 55, swordGod: 30, desc: "Стоянки под багровым небом (+55 HP, +30 к Мечу)." },
    { id: "demon_lord_blood", name: "Потомки Демонических Лордов", coins: 350, hp: 65, manaBonus: 95, desc: "Кровь древних владык (+95 маны, +65 HP)." }
  ],
  great_forest: [
    { id: "forest_orphan", name: "Лесные подкидыши", coins: 10, hp: 35, northGod: 20, desc: "Жизнь на верхних ярусах деревьев (+35 HP)." },
    { id: "forest_dorudia_hunter", name: "Охотничья стая клана Дорудиа", coins: 60, hp: 40, swordGod: 35, desc: "Звериное чутье (+40 HP, +35 к Мечу)." },
    { id: "forest_chieftain_family", name: "Семья Верховного Вождя Леса", coins: 300, hp: 55, swordGod: 45, int: 12, desc: "Потомки священных зверей (+300🪙, +45 к Мечу)." }
  ],
  milis: [
    { id: "milis_pilgrim", name: "Семья смиренных паломников", coins: 25, hp: 20, int: 10, desc: "Молитвы у Священного Древа (+20 HP, +10 Знаний)." },
    { id: "milis_merchant_house", name: "Шелковый купеческий дом", coins: 350, int: 18, desc: "Торговля фимиамом (+350🪙, +18 Знаний)." },
    { id: "milis_templar_dynasty", name: "Высший рыцарский род Храма", coins: 600, swordGod: 30, waterGod: 30, int: 15, desc: "Белый доспех (+600🪙, +30 к Воде и Мечу)." }
  ],
  begaritt: [
    { id: "desert_pariah", name: "Изгои барханов Бегаритта", coins: 10, hp: 40, northGod: 25, desc: "Жизнь среди скорпионов (+40 HP, +25 Севера)." },
    { id: "desert_nomad_caravan", name: "Кочевники оазисов", coins: 90, hp: 35, northGod: 30, desc: "Караванная вольница (+90🪙, +30 Севера)." },
    { id: "desert_labyrinth_dynasty", name: "Клан расхитителей лабиринтов", coins: 450, swordGod: 35, int: 16, manaBonus: 35, desc: "Древние карты (+450🪙, +35 к Мечу, +35 маны)." }
  ]
};
const FAMILY_STATUSES = REGION_FAMILY_STATUSES.asura;

const RACES = {
  human: { id: "human", name: "Человек", maxAge: 75, desc: "Быстро обучаются, универсальны во всем.", bonus: { baseMana: 25, hp: 0, int: 5, coins: 50, manaMod: 1.0 } },
  demon: { id: "demon", name: "Демон", maxAge: 220, desc: "Огромный сосуд маны с рождения и долголетие.", bonus: { baseMana: 80, hp: 35, int: 2, coins: 15, manaMod: 1.6 } },
  beast: { id: "beast", name: "Зверочеловек", maxAge: 95, desc: "Острый нюх, дикая реакция в ближнем бою.", bonus: { baseMana: 20, hp: 25, swordGod: 25, coins: 25, manaMod: 0.9 } },
  elf: { id: "elf", name: "Эльф / Полуэльф", maxAge: 350, desc: "Древние хранители знаний и сродство с маной.", bonus: { baseMana: 60, hp: -10, int: 12, coins: 40, manaMod: 1.4 } },
  speld: { id: "speld", name: "Спард", maxAge: 180, desc: "Алый камень во лбу, грозные воины.", bonus: { baseMana: 30, hp: 45, swordGod: 35, northGod: 20, coins: 10, manaMod: 1.0 } },
  dwarf: { id: "dwarf", name: "Гном / Дворф", maxAge: 130, desc: "Мастера кузнечного дела и артефактов.", bonus: { baseMana: 15, hp: 40, northGod: 25, coins: 80, manaMod: 0.8 } }
};

const LANGUAGES = {
  human: { id: "human", name: "Человеческий язык", desc: "Общий язык Асуры, Раноа и Милиса." },
  demon: { id: "demon", name: "Демонический язык", desc: "Снимает наценки и даёт скидку 20% на Демоническом континенте + доступ к обелискам." },
  beast: { id: "beast", name: "Звериный язык", desc: "Язык Великого Леса. Улучшает дипломатию и отношения со зверолюдьми." },
  god_fighter: { id: "god_fighter", name: "Язык Бога Бойцов", desc: "Позволяет читать древние боевые свитки и Скрижаль Бога Бойцов." },
  dragon: { id: "dragon", name: "Язык Драконьего Племени", desc: "Язык древних рун телепортации и Плиты Драконьего Владыки." }
};

const TRAITS = [
  { id: "healthy", name: "Стальное здоровье", rarity: "common", weight: 20, hp: 35, manaBonus: 0, growthMod: 1.0, desc: "+35 HP и стойкость к болезням." },
  { id: "curious", name: "Любознательность", rarity: "common", weight: 20, int: 8, manaBonus: 5, growthMod: 1.1, desc: "+8 Знаний, книги и лекции дают +50% опыта." },
  { id: "water_aff", name: "Сродство с Водой 💧", rarity: "rare", weight: 8, manaBonus: 35, waterGod: 20, growthMod: 1.4, desc: "+35 маны, бонус к стилю Воды." },
  { id: "fire_aff", name: "Сродство с Огнем 🔥", rarity: "rare", weight: 8, manaBonus: 35, swordGod: 20, growthMod: 1.4, desc: "+35 маны, взрывной выпад меча." },
  { id: "silent_cast", name: "Беззвучный каст 🔮", rarity: "epic", weight: 5, manaBonus: 75, growthMod: 1.9, desc: "+75 маны, магия в бою тратит вдвое меньше маны и бьёт на 30% сильнее!" },
  { id: "laplace_factor", name: "Истинный Фактор Лапласа ✨", rarity: "mythic", weight: 1, manaBonus: 260, growthMod: 3.5, desc: "Океан маны. Каналы души никогда не затвердеют!" },
  { id: "miko_strength", name: "🌟 Мико: Чудовищная Сила", rarity: "mythic", weight: 2, hp: 200, swordGod: 70, northGod: 70, manaBonus: -10, growthMod: 1.8, desc: "Тело из стали (как у Занобы)! Огромный физический урон." },
  { id: "miko_memory", name: "🌟 Мико: Взор Времени и Памяти", rarity: "mythic", weight: 2, int: 30, manaBonus: 100, growthMod: 2.2, desc: "Абсолютная память души, +100 маны, +30 Знаний." },
  { id: "miko_healing", name: "🌟 Мико: Источник Жизни", rarity: "mythic", weight: 2, hp: 120, manaBonus: 70, waterGod: 45, growthMod: 1.7, desc: "Кровь исцеления: +25 HP регенерации каждый год." },
  { id: "god_mode", name: "⚡ ЧИТ-РЕЖИМ: Истинный Творец", rarity: "mythic", weight: 0, hp: 99999, manaBonus: 99999, swordGod: 2000, waterGod: 2000, northGod: 2000, int: 999, coins: 9999999, growthMod: 10.0, desc: "10,000,000🪙, бессмертие, ранг Бога во всех стихиях!" }
];

const DEMON_EYES = {
  foresight: { id: "foresight", name: "Глаз Предвидения 👁️", desc: "+35% уклонения в бою, +4500 БМ.", cp: 4500 },
  mana_sight: { id: "mana_sight", name: "Глаз Маны 🔮", desc: "Иммунитет к ловушкам в лабиринтах, +4000 БМ.", cp: 4000 },
  appraisal: { id: "appraisal", name: "Глаз Оценки 📜", desc: "+30% урона по слабым местам врага, +3500 БМ.", cp: 3500 },
  clarity: { id: "clarity", name: "Глаз Дальнего Взора 🎯", desc: "+15% крит. удара и 100% точность, +3000 БМ.", cp: 3000 }
};

const REGIONAL_JOBS = {
  asura: [
    { id: "asura_guard", name: "Королевская Гвардия Асуры", ranks: [
      { title: "Новобранец гарнизона", salary: 25, minAge: 14, minSword: 20, desc: "Патрулирование рынков." },
      { title: "Городской страж ворот", salary: 55, minAge: 16, minSword: 50, desc: "Охрана ворот Роа." },
      { title: "Рыцарь Первого круга", salary: 140, minAge: 20, minSword: 120, desc: "Эскорт дворянских карет." },
      { title: "Капитан Королевской Гвардии", salary: 380, minAge: 25, minSword: 300, desc: "Командование батальоном Арса." },
      { title: "Лорд-Командующий Армии Асуры", salary: 950, minAge: 32, minSword: 600, desc: "Высший военный чин." }
    ]},
    { id: "asura_bureaucrat", name: "Королевское Казначейство", ranks: [
      { title: "Младший переписчик свитков", salary: 30, minAge: 14, minInt: 20, desc: "Сортировка налоговых свитков." },
      { title: "Податной инспектор", salary: 70, minAge: 18, minInt: 45, desc: "Сбор податей с провинций." },
      { title: "Аудитор Короны", salary: 180, minAge: 24, minInt: 90, desc: "Ревизия дворянских имений." },
      { title: "Главный Казначей Асуры", salary: 600, minAge: 30, minInt: 180, desc: "Управление золотым запасом." }
    ]},
    { id: "asura_diplomat", name: "Дипломатический Корпус Короны", ranks: [
      { title: "Атташе посольства в Роа", salary: 45, minAge: 16, minInt: 35, desc: "Переговоры провинций." },
      { title: "Полномочный Посол Асуры", salary: 160, minAge: 22, minInt: 80, desc: "Миссии в Раноа и Милис." },
      { title: "Министр Иностранных Дел", salary: 550, minAge: 30, minInt: 170, desc: "Континентальные альянсы." }
    ]},
    { id: "asura_court_mage", name: "Придворная Коллегия Магов Арса", ranks: [
      { title: "Адепт дворцовых барьеров", salary: 50, minAge: 15, minMagic: 50, desc: "Поддержание глифов дворца." },
      { title: "Магистр королевского эскорта", salary: 190, minAge: 21, minMagic: 150, desc: "Магическая стража монархов." },
      { title: "Архимаг Королевского Совета", salary: 700, minAge: 28, minMagic: 380, desc: "Верховный чародей страны." }
    ]},
    { id: "asura_merchant_guild", name: "Торговая Палата Шелка и Зерна", ranks: [
      { title: "Оценщик торговых лавок", salary: 35, minAge: 14, minInt: 25, desc: "Инспекция базаров." },
      { title: "Управляющий караванами", salary: 120, minAge: 20, minInt: 60, desc: "Контракты на провизию." },
      { title: "Глава Гильдии Купцов Асуры", salary: 500, minAge: 28, minInt: 140, desc: "Контроль торговых потоков." }
    ]},
    { id: "asura_wyvern_knights", name: "Орден Рыцарей Небесных Виверн", ranks: [
      { title: "Смотритель гнезд", salary: 40, minAge: 15, minNorth: 30, desc: "Уход за боевыми вивернами." },
      { title: "Небесный всадник патруля", salary: 150, minAge: 19, minSword: 140, desc: "Воздушный дозор границ." },
      { title: "Командор Небесного Крыла", salary: 650, minAge: 27, minSword: 350, desc: "Командир воздушной армады." }
    ]}
  ],
  ranoa: [
    { id: "ranoa_researcher", name: "Исследовательский Институт Академии", ranks: [
      { title: "Лаборант алхимика", salary: 35, minAge: 13, minMagic: 30, desc: "Подготовка кристаллов маны." },
      { title: "Ассистент кафедры призыва", salary: 80, minAge: 17, minMagic: 70, desc: "Формулы магических кругов." },
      { title: "Профессор боевой магии", salary: 220, minAge: 22, minMagic: 180, desc: "Обучение высшим стихиям." },
      { title: "Декан Магической Академии Шарии", salary: 750, minAge: 30, minMagic: 400, desc: "Глава коллегии Севера." }
    ]},
    { id: "ranoa_artificer_guild", name: "Цех Магических Артефакторов", ranks: [
      { title: "Подмастерье гранильщика", salary: 40, minAge: 14, minInt: 30, desc: "Шлифовка ядер монстров." },
      { title: "Мастер накопительных колец", salary: 140, minAge: 19, minInt: 75, desc: "Создание амулетов." },
      { title: "Главный Артефактор Севера", salary: 550, minAge: 27, minInt: 160, desc: "Конструирование реликвий." }
    ]},
    { id: "ranoa_alchemist", name: "Гильдия Зельеваров Шарии", ranks: [
      { title: "Сборщик морозных трав", salary: 30, minAge: 13, minInt: 20, desc: "Поиск корней на ледниках." },
      { title: "Фармацевт Святых снадобий", salary: 110, minAge: 18, minInt: 65, desc: "Варка исцеляющих зелий." },
      { title: "Магистр Королевской Алхимии", salary: 480, minAge: 26, minInt: 150, desc: "Создание панацеи." }
    ]},
    { id: "ranoa_winter_scout", name: "Ледяной Дозор Границ Севера", ranks: [
      { title: "Следопыт снегов", salary: 35, minAge: 14, minNorth: 30, desc: "Патруль сквозь бураны." },
      { title: "Охотник на снежных бегемотов", salary: 130, minAge: 19, minSword: 110, desc: "Защита караванов." },
      { title: "Капитан Северного Рубежа", salary: 500, minAge: 27, minSword: 320, desc: "Командование гарнизонами." }
    ]},
    { id: "ranoa_library_archivist", name: "Архив Древних Рун Шарии", ranks: [
      { title: "Младший хранитель свитков", salary: 30, minAge: 13, minInt: 30, desc: "Реставрация текстов." },
      { title: "Дешифровщик забытых эпох", salary: 120, minAge: 19, minInt: 85, desc: "Перевод древних хроник." },
      { title: "Верховный Архивариус Севера", salary: 460, minAge: 27, minInt: 175, desc: "Хранитель запретных знаний." }
    ]},
    { id: "ranoa_mercenary_corps", name: "Северный Наемный Корпус", ranks: [
      { title: "Наемник-застрельщик", salary: 40, minAge: 14, minSword: 40, desc: "Охрана складов Шарии." },
      { title: "Ветеран морозных битв", salary: 160, minAge: 20, minSword: 160, desc: "Штурм гнезд чудовищ." },
      { title: "Генерал Вольных Клинков Севера", salary: 620, minAge: 28, minSword: 380, desc: "Лидер наемных армий." }
    ]}
  ],
  milis: [
    { id: "milis_templar", name: "Орден Рыцарей Святого Милиса", ranks: [
      { title: "Послушник Белого Собора", salary: 25, minAge: 13, minInt: 15, desc: "Пение гимнов." },
      { title: "Рыцарь-Храмовник", salary: 75, minAge: 17, minSword: 70, desc: "Охрана паломников." },
      { title: "Инквизитор Веры", salary: 210, minAge: 23, minSword: 190, desc: "Охота на еретиков." },
      { title: "Паладин Белого Древа", salary: 700, minAge: 30, minSword: 480, desc: "Верховный меч Милисиона." }
    ]},
    { id: "milis_healer_seminary", name: "Госпиталь Исцеления Святого Ранга", ranks: [
      { title: "Брат милосердия", salary: 35, minAge: 13, minMagic: 30, desc: "Уход за ранеными." },
      { title: "Священник-целитель", salary: 130, minAge: 18, minMagic: 110, desc: "Снятие ядов и проклятий." },
      { title: "Верховный Епископ Исцеления", salary: 580, minAge: 28, minMagic: 340, desc: "Высшая магия спасения." }
    ]},
    { id: "milis_choir_scribe", name: "Скрипторий Канонических Текстов", ranks: [
      { title: "Переписчик молитвенников", salary: 28, minAge: 14, minInt: 20, desc: "Копирование свитков." },
      { title: "Хранитель Догматов Веры", salary: 100, minAge: 20, minInt: 70, desc: "Надзор за учением." },
      { title: "Канцлер Священного Синода", salary: 450, minAge: 28, minInt: 160, desc: "Второй после Папы Милиса." }
    ]},
    { id: "milis_caravan_guard", name: "Конвойная Стража Паломников", ranks: [
      { title: "Страж тракта у Белого Древа", salary: 35, minAge: 14, minSword: 35, desc: "Защита верующих." },
      { title: "Сотник святого конвоя", salary: 140, minAge: 20, minSword: 130, desc: "Проводка караванов." },
      { title: "Командующий Путями Паломников", salary: 520, minAge: 27, minSword: 340, desc: "Безопасность Святой Земли." }
    ]},
    { id: "milis_holy_artificer", name: "Мастерская Сакральных Барьеров", ranks: [
      { title: "Гравер священных медальонов", salary: 32, minAge: 14, minInt: 25, desc: "Нанесение символов веры." },
      { title: "Кузнец антимагических щитов", salary: 125, minAge: 19, minInt: 75, desc: "Снаряжение против магов." },
      { title: "Магистр Святых Реликвий", salary: 490, minAge: 27, minInt: 155, desc: "Ковка реликвий." }
    ]},
    { id: "milis_inquisition_hunter", name: "Следственный Трибунал Инквизиции", ranks: [
      { title: "Осведомитель Трибунала", salary: 40, minAge: 15, minNorth: 35, desc: "Слежка за сектами." },
      { title: "Следователь по делам ереси", salary: 160, minAge: 21, minInt: 90, desc: "Допросы культистов." },
      { title: "Великий Инквизитор Милиса", salary: 680, minAge: 30, minSword: 420, desc: "Глава тайного надзора." }
    ]}
  ],
  demon: [
    { id: "demon_hunter", name: "Охотничий Цех Пустошей", ranks: [
      { title: "Сборщик костей чудовищ", salary: 25, minAge: 12, minSword: 15, desc: "Добыча чешуи тварей." },
      { title: "Загонщик пустынных виверн", salary: 70, minAge: 16, minSword: 60, desc: "Охота на ящеров." },
      { title: "Охотник Черных Руин", salary: 210, minAge: 21, minSword: 160, desc: "Зачистка гнезд демонов." },
      { title: "Палач Бесплодных Земель", salary: 620, minAge: 28, minSword: 450, desc: "Легендарный охотник." }
    ]},
    { id: "demon_blacksmith", name: "Кузница Черного Базальта", ranks: [
      { title: "Молотобоец рудной печи", salary: 30, minAge: 13, minNorth: 20, desc: "Плавка метеоритного железа." },
      { title: "Мастер клыкастых клинков", salary: 110, minAge: 18, minSword: 80, desc: "Ковка тяжелых мечей." },
      { title: "Владыка Огненного Горна", salary: 480, minAge: 26, minSword: 280, desc: "Создание брони пустошей." }
    ]},
    { id: "demon_ruin_scout", name: "Следопыты Развалин", ranks: [
      { title: "Искатель древних черепков", salary: 30, minAge: 13, minInt: 25, desc: "Раскопки в крепостях." },
      { title: "Проводник Гиблых Земель", salary: 130, minAge: 18, minNorth: 90, desc: "Тропы сквозь ядовитый туман." },
      { title: "Хранитель Тайн Пустошей", salary: 510, minAge: 27, minInt: 140, desc: "Знаток древних тайников." }
    ]},
    { id: "demon_beast_tamer", name: "Укротители Пустынных Тварей", ranks: [
      { title: "Погонщик скорпионов", salary: 35, minAge: 14, minNorth: 30, desc: "Выпас вьючных чудовищ." },
      { title: "Дрессировщик боевых виверн", salary: 140, minAge: 19, minSword: 120, desc: "Приручение хищников." },
      { title: "Владыка Зверей Пустошей", salary: 540, minAge: 28, minSword: 350, desc: "Управление стаями бегемотов." }
    ]}
  ],
  great_forest: [
    { id: "forest_ranger", name: "Лесной Дозор Клана Дорудиа", ranks: [
      { title: "Дозорный верхних ветвей", salary: 25, minAge: 12, minSword: 20, desc: "Наблюдение за кронами." },
      { title: "Следопыт чащи", salary: 70, minAge: 16, minSword: 65, desc: "Охота в сезон дождей." },
      { title: "Хранитель Священного Древа", salary: 220, minAge: 22, minSword: 180, desc: "Защита святилищ." },
      { title: "Первый Клинок Великого Леса", salary: 650, minAge: 30, minSword: 500, desc: "Лидер воинов леса." }
    ]},
    { id: "forest_herbalist", name: "Травники Священных Крон", ranks: [
      { title: "Сборщик древесной смолы", salary: 25, minAge: 12, minInt: 20, desc: "Добыча целебного сока." },
      { title: "Знахарь сезона дождей", salary: 95, minAge: 17, minInt: 60, desc: "Лечение лихорадок." },
      { title: "Верховный Шаман Леса", salary: 460, minAge: 26, minMagic: 220, desc: "Общение с духами предков." }
    ]},
    { id: "forest_shrine_guard", name: "Стражи Алтаря Священного Зверя", ranks: [
      { title: "Караульный поляны", salary: 30, minAge: 13, minSword: 35, desc: "Охрана алтарей." },
      { title: "Рыцарь Звериного Тотема", salary: 125, minAge: 19, minSword: 120, desc: "Ритуальные дуэли." },
      { title: "Защитник Священного Льва", salary: 520, minAge: 28, minSword: 360, desc: "Стража божественного зверя." }
    ]},
    { id: "forest_river_patrol", name: "Речной Патруль Великих Затонов", ranks: [
      { title: "Лодочник верхних порогов", salary: 28, minAge: 13, minNorth: 25, desc: "Сплав по рекам." },
      { title: "Охотник на болотных змей", salary: 110, minAge: 18, minSword: 90, desc: "Зачистка бродов." },
      { title: "Атаман Лесных Вод", salary: 480, minAge: 27, minSword: 300, desc: "Контроль водных путей." }
    ]}
  ],
  begaritt: [
    { id: "desert_caravan", name: "Гильдия Караван-Баши Бегаритта", ranks: [
      { title: "Погонщик песчаных ящеров", salary: 30, minAge: 14, minInt: 15, desc: "Перевозка воды." },
      { title: "Страж каравана", salary: 85, minAge: 18, minSword: 80, desc: "Отражение налетов." },
      { title: "Проводник Лабиринтов", salary: 240, minAge: 24, minInt: 90, desc: "Поиск погребенных залов." },
      { title: "Песчаный Барон Оазисов", salary: 800, minAge: 32, minInt: 220, desc: "Владелец торговых путей." }
    ]},
    { id: "desert_water_seeker", name: "Лозоходцы Глубинных Колодцев", ranks: [
      { title: "Копатель песчаных ям", salary: 28, minAge: 13, minNorth: 20, desc: "Поиск влаги." },
      { title: "Мастер артезианских жил", salary: 110, minAge: 18, minInt: 70, desc: "Бурение колодцев." },
      { title: "Владыка Водных Ключей", salary: 500, minAge: 27, minInt: 150, desc: "Контроль оазисов." }
    ]},
    { id: "desert_mercenary_corps", name: "Наемный Корпус Золотого Песка", ranks: [
      { title: "Охранник стоянки", salary: 35, minAge: 14, minSword: 40, desc: "Ночной дозор лагерей." },
      { title: "Ветеран песчаных войн", salary: 145, minAge: 20, minSword: 140, desc: "Отражение атак чудовищ." },
      { title: "Генерал Барханных Клинков", salary: 600, minAge: 29, minSword: 380, desc: "Лидер наемников Бегаритта." }
    ]},
    { id: "desert_labyrinth_scavengers", name: "Цех Добытчиков Мана-Кристаллов", ranks: [
      { title: "Рудокоп верхних ярусов", salary: 40, minAge: 15, minNorth: 35, desc: "Спил кристаллов." },
      { title: "Проходчик залов", salary: 160, minAge: 21, minInt: 80, desc: "Картография аномалий." },
      { title: "Магистр Подземных Сокровищ", salary: 680, minAge: 30, minInt: 170, desc: "Добытчик реликвий." }
    ]}
  ]
};

const UNDERGROUND_JOBS = {
  asura: { id: "underground_asura", name: "🗡️ Теневой Синдикат Воров Роа", ranks: [
    { title: "Карманник трущоб", salary: 60, minAge: 13, minNorth: 15, risk: 0.15, desc: "Срезание кошельков." },
    { title: "Скупщик краденых реликвий", salary: 160, minAge: 17, minNorth: 45, risk: 0.22, desc: "Сбыт драгоценностей." },
    { title: "Теневой ликвидатор знати", salary: 450, minAge: 22, minSword: 180, risk: 0.30, desc: "Устранение аристократов." },
    { title: "Глава Гильдии Теней Асуры", salary: 1400, minAge: 28, minSword: 380, risk: 0.35, desc: "Владыка криминала столицы." }
  ]},
  ranoa: { id: "underground_ranoa", name: "🔮 Контрабандисты Запретных Свитков", ranks: [
    { title: "Курьер черного рынка", salary: 65, minAge: 13, minNorth: 15, risk: 0.14, desc: "Нелегальные реагенты." },
    { title: "Сбытчик мана-кристаллов", salary: 170, minAge: 17, minMagic: 60, risk: 0.20, desc: "Продажа ядер монстров." },
    { title: "Магический фальшивомонетчик", salary: 480, minAge: 22, minInt: 110, risk: 0.28, desc: "Поддельные векселя." },
    { title: "Барон Черной Магии Шарии", salary: 1350, minAge: 28, minMagic: 320, risk: 0.35, desc: "Теневой магистр Севера." }
  ]},
  demon: { id: "underground_demon", name: "💀 Банда Пустынных Мародеров", ranks: [
    { title: "Мародер руин", salary: 50, minAge: 12, minNorth: 15, risk: 0.16, desc: "Разграбление лагерей." },
    { title: "Пустынный налетчик", salary: 140, minAge: 16, minSword: 60, risk: 0.24, desc: "Налеты на караваны." },
    { title: "Главарь шайки пустошей", salary: 420, minAge: 21, minSword: 190, risk: 0.32, desc: "Контроль перевалов." },
    { title: "Повелитель Черных Караванов", salary: 1200, minAge: 27, minSword: 400, risk: 0.38, desc: "Верховный атаман." }
  ]},
  great_forest: { id: "underground_forest", name: "🌲 Лесные Браконьеры Чащи", ranks: [
    { title: "Капканщик редких шкур", salary: 55, minAge: 12, minNorth: 20, risk: 0.15, desc: "Отлов священных зверей." },
    { title: "Браконьер запретных святилищ", salary: 150, minAge: 16, minSword: 70, risk: 0.22, desc: "Спил вековых ветвей." },
    { title: "Теневой ловец", salary: 440, minAge: 21, minSword: 200, risk: 0.34, desc: "Подпольные рынки." },
    { title: "Хозяин Лесного Подполья", salary: 1300, minAge: 28, minSword: 420, risk: 0.38, desc: "Контроль контрабанды." }
  ]},
  milis: { id: "underground_milis", name: "🩸 Еретический Культ Черного Древа", ranks: [
    { title: "Тайный святотатец", salary: 70, minAge: 14, minInt: 20, risk: 0.18, desc: "Кража священных чаш." },
    { title: "Скупщик демонических реликвий", salary: 190, minAge: 18, minInt: 60, risk: 0.26, desc: "Контрабанда артефактов." },
    { title: "Ересиарх Черного Культа", salary: 520, minAge: 23, minMagic: 180, risk: 0.33, desc: "Ритуалы в катакомбах." },
    { title: "Теневой Патриарх Ереси", salary: 1500, minAge: 30, minMagic: 360, risk: 0.40, desc: "Подкуп епископов Милиса." }
  ]},
  begaritt: { id: "underground_begaritt", name: "🏜️ Песчаные Корсары Барханов", ranks: [
    { title: "Песчаный вор колодцев", salary: 60, minAge: 13, minNorth: 20, risk: 0.15, desc: "Кража воды." },
    { title: "Налетчик на оазисы", salary: 170, minAge: 17, minSword: 75, risk: 0.25, desc: "Захват стоянок." },
    { title: "Хозяин тайного оазиса", salary: 490, minAge: 22, minSword: 210, risk: 0.32, desc: "Убежище беглых." },
    { title: "Султан Разбойников Бегаритта", salary: 1450, minAge: 29, minSword: 440, risk: 0.39, desc: "Теневые пути пустыни." }
  ]}
};

const ASURA_POLITICS = {
  factions: [
    { id: "ariel", name: "Принцесса Ариэль Анемой Асура", icon: "👑", desc: "Реформаторы, союз с Сильфи и Люком.", power: 35 },
    { id: "prince_first", name: "Первый Принц Гравелл", icon: "🦁", desc: "Консерваторы, старая знать и армия.", power: 45 },
    { id: "prince_second", name: "Второй Принц Хальфас", icon: "🐍", desc: "Тайные интриги и гильдии убийц.", power: 20 }
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

const SEVEN_GREAT_POWERS = [
  { rank: 1, title: "Бог Техники", name: "Неизвестный Владыка", region: "ranoa", cp: 5000000, hp: 500000, maxHp: 500000, isDead: false },
  { rank: 2, title: "Бог Драконов", name: "Орстед", region: "asura", cp: 3000000, hp: 300000, maxHp: 300000, isDead: false },
  { rank: 3, title: "Бог Бойцов", name: "Бадигади (Золотая Броня)", region: "begaritt", cp: 1500000, hp: 180000, maxHp: 180000, isDead: false },
  { rank: 4, title: "Бог Демонов", name: "Лаплас", region: "demon", cp: 800000, hp: 100000, maxHp: 100000, isDead: false },
  { rank: 5, title: "Бог Смерти", name: "Рэндольф Мариан", region: "asura", cp: 450000, hp: 60000, maxHp: 60000, isDead: false },
  { rank: 6, title: "Бог Меча", name: "Гал Фарион", region: "ranoa", cp: 280000, hp: 38000, maxHp: 38000, isDead: false },
  { rank: 7, title: "Бог Севера", name: "Александр (Кальман III)", region: "asura", cp: 180000, hp: 26000, maxHp: 26000, isDead: false }
];

const REPLACEMENT_MASTERS = {
  1: ["Механический Архонт Зетта", "Хранитель Забытых Формул Альвиус", "Искатель Первой Эпохи Крон"],
  2: ["Кровавый Дракон Валхар", "Наследник Золотой Чешуи Игнис", "Рыцарь Драконьих Клинков Сайрус"],
  3: ["Бессмертный Чемпион Арены Кассандра", "Титан Железного Кулака Бранн", "Король Гладиаторов Рагнар"],
  4: ["Владычица Багровой Маны Селена", "Демонический Лорд Арктур", "Беззвучный Архимаг Валдис"],
  5: ["Тень Жнеца Нокс", "Безымянный Палач Милиса", "Мастер Клинка Туманов Каэль"],
  6: ["Алый Святой Меча Джино", "Принцесса Рассекающего Света Изольда", "Мастер Додзё Севера Торваль"],
  7: ["Странствующий Герой Севера Эльдрик", "Железный Трикстер Леонхард", "Рыцарь Свободной Стали Маркус"]
};

const SEVEN_POWERS_QUESTS = [
  { rank: 7, title: "Поиски Бога Севера Кальмана III", regionKey: "asura", reqCp: 80000, desc: "Расспросить в тавернах Арса о мастере, орудующем мечом в перекате." },
  { rank: 6, title: "Экспедиция на Святую Землю Меча", regionKey: "ranoa", reqCp: 140000, desc: "Подняться на снежные пики додзё Гала Фариона и вызвать Бога Меча." },
  { rank: 5, title: "Поиски Бога Смерти Рэндольфа", regionKey: "asura", reqCp: 240000, desc: "Найти трактир на окраине королевства, где скрывается великий фехтовальщик." },
  { rank: 4, title: "Гробница Бога Демонов", regionKey: "demon", reqCp: 450000, desc: "Спуститься в жерло черного разлома пустоши Некросса." },
  { rank: 3, title: "Алтарь Золотой Брони Бога Бойцов", regionKey: "begaritt", reqCp: 850000, desc: "Вызвать Бадигади на поединок в сердце пустыни." },
  { rank: 2, title: "Вызов Богу Драконов Орстеду", regionKey: "asura", reqCp: 1800000, desc: "Встать на пути сильнейшего существа мира в ущелье Красного Дракона." },
  { rank: 1, title: "Врата Бога Техники", regionKey: "ranoa", reqCp: 3200000, desc: "Пробить барьер древнейшей лаборатории Первой Эпохи." }
];

const FACTION_ENDGAMES = {
  orsted: {
    id: "hitogami_void_breach",
    title: "🌌 Прорыв в Белое Пространство: Финал против Хитогами",
    desc: "Сквозь портал Пустоты вы и Орстед вторгаетесь в измерение Бога Людей! На кону судьба Шестиликого Мира.",
    reqGen: 4, reqCp: 2500000, cardClass: "void-rift-card",
    btnText: "⚔️ ВОРВАТЬСЯ В ИЗМЕРЕНИЕ ХИТОГАМИ (ФИНАЛ)",
    boss: { name: "Бог Людей (Хитогами)", cp: 4500000, hp: 550000, maxHp: 550000 }
  },
  hitogami: {
    id: "orsted_ambush_finale",
    title: "👁️ Воля Человекобога: Крушение Проклятого Дракона",
    desc: "Ведомый Снами Хитогами, вы заманили Орстеда в ловушку истощения маны! Сокрушите Бога Драконов ради новой эры!",
    reqGen: 4, reqCp: 2500000, cardClass: "hitogami-rift-card",
    btnText: "🗡️ СРАЗИТЬ ОРСТЕДА ВО ИМЯ ХИТОГАМИ (ФИНАЛ)",
    boss: { name: "Бог Драконов Орстед (В Ловушке)", cp: 4200000, hp: 520000, maxHp: 520000 }
  }
};

const ESTATES = [
  { id: "cottage_buena", name: "🏡 Лачуга с огородом в Буэне", cost: 120, income: 15, hpRegen: 10, desc: "+15🪙/г., +10 HP регенерации/г." },
  { id: "townhouse_roa", name: "🏘️ Каменный особняк в Роа", cost: 600, income: 60, hpRegen: 25, desc: "+60🪙/г., +25 HP регенерации/г." },
  { id: "milis_manor", name: "⛪ Торговая усадьба в Милисионе", cost: 2200, income: 200, hpRegen: 50, desc: "+200🪙/г., +50 HP регенерации/г." },
  { id: "sharia_castle", name: "🏰 Замок-резиденция в Шарии (Раноа)", cost: 7000, income: 700, hpRegen: 90, desc: "+700🪙/г., +90 HP/г., +15 маны детям при наследовании." },
  { id: "asura_palace", name: "👑 Королевское поместье в Асуре", cost: 22000, income: 2400, hpRegen: 160, desc: "+2400🪙/г., +160 HP/г., +30 ко всем стилям детям." }
];

const CASTLE_UPGRADES = [
  { id: "crypt", name: "🕯️ Фамильный Склеп Предков", cost: 500, desc: "Медитация у могил предков раз в 5 лет (восстановление + опыт)." },
  { id: "training_yard", name: "⚔️ Воинский Полигон Меча", cost: 650, desc: "Дети рода получают +25 к стилю Меча при вступлении в наследство." },
  { id: "alchemy_lab", name: "🧪 Алхимическая Оранжерея", cost: 450, desc: "Ежегодно производит +2 бесплатных целебных зелья." },
  { id: "grand_vault", name: "🪙 Неприступная Фамильная Казна", cost: 800, desc: "+10% к прибыли караванов и -5% риска засады." },
  { id: "trophy_hall", name: "🐉 Зал Трофеев и Чучел Драконов", cost: 1100, desc: "+50 Славы отряда и +3000 БМ авторитета династии." }
];

const CARAVAN_ROUTES = [
  { id: "caravan_local", name: "🛒 Местный тракт Фитоа", cost: 100, reward: 180, risk: 0.10, desc: "Безопасная доставка зерна (+80🪙)." },
  { id: "caravan_ranoa", name: "❄️ Снежный караван в Шарию", cost: 350, reward: 750, risk: 0.22, desc: "Перевозка мифрила (+400🪙)." },
  { id: "caravan_milis", name: "⛪ Морской конвой в Милис", cost: 900, reward: 2200, risk: 0.32, desc: "Шелка и реликвии (+1300🪙)." },
  { id: "caravan_begaritt", name: "🏜️ Золотой Караван Бегаритта", cost: 2500, reward: 6800, risk: 0.45, desc: "Путь сквозь пустыню (+4300🪙)!" }
];

const PERUGIUS_TRIALS = [
  { rank: 1, name: "Испытание Первого Духа (Алхор)", reqCp: 18000, rewardText: "Признание рыцарей небес (+150 Знаний)" },
  { rank: 2, name: "Поединок с Золотым Рыцарем Сильфидом", reqCp: 55000, rewardText: "Благословение Небесного Дракона (+15000 БМ)" },
  { rank: 3, name: "Аудиенция у Короля-Дракона Перугиуса", reqCp: 160000, rewardText: "Драконье Имя и Фактор Лапласа" }
];

const GREYRAT_BRANCHES = [
  { id: "boreas", name: "Северная Ветвь: Бореас Грейрат", region: "Роа", leader: "Саурос Бореас Грейрат", desc: "Яростные мечники и неприступные крепости." },
  { id: "notos", name: "Южная Ветвь: Нотос Грейрат", region: "Милис/Асура", leader: "Амарант Нотос Грейрат", desc: "Сказочное богатство и магия воды." },
  { id: "zephyrus", name: "Восточная Ветвь: Зефирос Грейрат", region: "Арс", leader: "Филипп Зефирос Грейрат", desc: "Мастера шпионажа и тайных договоров." },
  { id: "euros", name: "Западная Ветвь: Эурос Грейрат", region: "Западные порты", leader: "Гарольд Эурос Грейрат", desc: "Хозяева торгового флота и верфей." }
];

const FIRST_WAR_TABLETS = [
  { id: "tab_human", name: "Скрижаль Бога Людей", regionKey: "asura", reqLang: "human", desc: "Скрыта в катакомбах дворца Арс." },
  { id: "tab_demon", name: "Обелиск Бога Демонов", regionKey: "demon", reqLang: "demon", desc: "Погребен в песках пустоши Некросса." },
  { id: "tab_dragon", name: "Плита Драконьего Владыки", regionKey: "begaritt", reqLang: "dragon", desc: "Вмонтирована в алтарь Лабиринта Телепортации." },
  { id: "tab_beast", name: "Стела Священного Зверя", regionKey: "great_forest", reqLang: "beast", desc: "Высечена в сердце Великого Древа Дорудиа." },
  { id: "tab_fighter", name: "Скрижаль Бога Бойцов", regionKey: "ranoa", reqLang: "god_fighter", desc: "Находится в тайной зале Академии Шарии." }
];

const REGIONS = {
  asura: { name: "🏰 Королевство Асура", travelCost: 60, desc: "Сердце мира, цветущие сады и интриги.", origins: [
    { id: "boreas", name: "Дом Бореас Грейрат", coins: 350, manaBonus: 20, int: 5, swordGod: 15, log: "Вы открыли глаза в крепости Роа ветви Бореас." },
    { id: "notos", name: "Дом Нотос Грейрат", coins: 300, manaBonus: 25, int: 6, waterGod: 15, log: "Мраморные залы и сады юга Асуры." },
    { id: "knight_buena", name: "Рыцари деревни Буэна", coins: 60, manaBonus: 10, swordGod: 15, int: 3, log: "Уютный дом у пшеничных полей Фитоа." },
    { id: "slums_ars", name: "Трущобы столицы Арс", coins: 10, manaBonus: 5, northGod: 20, int: 2, log: "Суровые улицы и воровские переулки столицы." }
  ]},
  ranoa: { name: "❄️ Королевства Раноа (Север)", travelCost: 120, desc: "Магические королевства вечной мерзлоты.", origins: [
    { id: "academy_prof", name: "Семья Профессора Раноа", coins: 200, manaBonus: 45, int: 15, log: "Вы выросли в Шарии среди фолиантов." },
    { id: "magic_guild", name: "Цех Артефакторов", coins: 120, manaBonus: 30, int: 8, log: "Мастерская полна кристаллов маны." },
    { id: "winter_hunter", name: "Охотники ледников", coins: 30, manaBonus: 10, northGod: 20, int: 3, log: "Ледяной ветер севера закалил тело." }
  ]},
  demon: { name: "🌋 Демонический Континент", travelCost: 200, desc: "Бесплодные пустоши, монстры и древние руины.", origins: [
    { id: "migurd_village", name: "Деревня племени Мигурд", coins: 20, manaBonus: 55, int: 10, log: "Сапфировые волосы и телепатия сородичей." },
    { id: "wind_port", name: "Контрабандисты Города Ветров", coins: 90, manaBonus: 15, northGod: 25, int: 6, log: "Шум портовых таверн и соленый ветер." }
  ]},
  great_forest: { name: "🌲 Великий Лес", travelCost: 100, desc: "Вековые деревья, родина зверолюдей.", origins: [
    { id: "dorudia", name: "Клан воинов Дорудиа", coins: 40, manaBonus: 15, swordGod: 30, int: 5, log: "Дом среди гигантских ветвей клана Дорудиа." },
    { id: "scout", name: "Лесные следопыты", coins: 15, manaBonus: 10, northGod: 25, int: 4, log: "Бесшумные прыжки по ветвям." }
  ]},
  milis: { name: "⛪ Святая Земля Милис", travelCost: 110, desc: "Белокаменная столица у Священного Дерева.", origins: [
    { id: "temple_knight", name: "Орден Рыцарей Храма", coins: 160, manaBonus: 20, waterGod: 25, int: 6, log: "Белый плащ с гербом Святого Милиса." },
    { id: "merchant", name: "Торговый дом Милиса", coins: 220, manaBonus: 5, int: 9, log: "Шелка, специи и звон монет." }
  ]},
  begaritt: { name: "🏜️ Континент Бегаритт", travelCost: 250, desc: "Бескрайняя пустыня и смертоносные лабиринты.", origins: [
    { id: "dungeon_raider", name: "Искатели Лабиринтов", coins: 150, manaBonus: 25, swordGod: 20, int: 7, log: "Рождение у входа в лабиринт телепортации." },
    { id: "desert_nomad", name: "Кочевники Барханов", coins: 40, manaBonus: 10, northGod: 30, int: 4, log: "Караваны сквозь раскаленный песок." }
  ]}
};

const SHOP_ITEMS = [
  { id: "bronze_dagger", type: "weapon", name: "🗡️ Бронзовый кинжал", cost: 25, cp: 70, desc: "+70 БМ." },
  { id: "iron_sword", type: "weapon", name: "⚔️ Железный палаш", cost: 60, cp: 220, desc: "+220 БМ." },
  { id: "oak_staff", type: "weapon", name: "🪄 Посох из ветви Энта", cost: 95, cp: 320, desc: "+320 БМ." },
  { id: "steel_rapier", type: "weapon", name: "🤺 Асурианская рапира", cost: 180, cp: 650, desc: "+650 БМ." },
  { id: "heavy_claymore", type: "weapon", name: "🪓 Двуручный клеймор севера", cost: 320, cp: 1100, desc: "+1100 БМ." },
  { id: "dragon_blade", type: "weapon", name: "🗡️ Клинок из кости Дракона", cost: 750, cp: 2600, desc: "+2600 БМ." },
  { id: "staff_arcane", type: "weapon", name: "🔮 Посох Магического Океана", cost: 1600, cp: 5500, desc: "+5500 БМ." },
  { id: "phoenix_spear", type: "weapon", name: "🔱 Копье Спардов", cost: 2800, cp: 8900, desc: "+8900 БМ." },
  { id: "aqua_heartia", type: "weapon", name: "🌟 Посох Водного Океана", cost: 4200, cp: 15000, desc: "+15000 БМ." },
  { id: "god_slayer_sword", type: "weapon", name: "⚡ Меч Рассекатель Света", cost: 11000, cp: 42000, desc: "Клинок школы Бога (+42000 БМ)." },
  { id: "apprentice_robe", type: "armor", name: "🧥 Мантия ученика", cost: 20, cp: 60, hp: 10, desc: "+60 БМ, +10 макс. HP." },
  { id: "leather_armor", type: "armor", name: "🛡️ Кожаный доспех", cost: 55, cp: 180, hp: 25, desc: "+180 БМ, +25 макс. HP." },
  { id: "steel_plate", type: "armor", name: "🛡️ Стальной нагрудник", cost: 200, cp: 750, hp: 60, desc: "+750 БМ, +60 макс. HP." },
  { id: "mithril_chain", type: "armor", name: "⛓️ Мифриловая кольчуга", cost: 500, cp: 1800, hp: 110, desc: "+1800 БМ, +110 макс. HP." },
  { id: "dragon_scale", type: "armor", name: "🐉 Доспех Красного Дракона", cost: 2200, cp: 7200, hp: 280, desc: "+7200 БМ, +280 макс. HP." },
  { id: "royal_aegis", type: "armor", name: "👑 Королевский Эгид Асуры", cost: 6500, cp: 21000, hp: 600, desc: "+21000 БМ, +600 макс. HP." },
  { id: "magic_armor", type: "armor", name: "🤖 Магическая Броня «Версия 1»", cost: 18000, cp: 60000, hp: 1200, desc: "Экзоскелет титанов (+60000 БМ, +1200 макс. HP)." },
  { id: "ring_mana", type: "accessory", name: "💍 Кольцо Концентрации Маны", cost: 130, cp: 450, desc: "+450 БМ." },
  { id: "boots_wind", type: "accessory", name: "👢 Сапоги Ветроступа", cost: 420, cp: 1200, desc: "+1200 БМ." },
  { id: "laplace_gem", type: "accessory", name: "💎 Самоцвет Демон-Дракона", cost: 1900, cp: 6000, desc: "+6000 БМ." },
  { id: "prosthetic_arm", type: "accessory", name: "🦾 Протез из Сплава Зари", cost: 1600, cp: 4000, desc: "Снимает штраф за потерю руки (+4000 БМ)." },
  { id: "heal_potion", type: "potion", name: "🧪 Зелье Исцеления", cost: 30, heal: 60, desc: "+60 HP в бою или вне боя." }
];

const DUNGEONS = [
  { id: "dung_cellar", name: "🕳️ Катакомбы Гоблинов", reqRank: "F", maxFloors: 5, cpBase: 250, dropArtifact: "bronze_dagger", desc: "Сырые норы под деревней Буэна." },
  { id: "dung_ruins", name: "🏛️ Руины Павших Рыцарей", reqRank: "D", maxFloors: 8, cpBase: 1400, dropArtifact: "steel_rapier", desc: "Древние каменные залы с ловушками." },
  { id: "dung_teleport", name: "🌀 Лабиринт Телепортации Бегаритта", reqRank: "B", maxFloors: 12, cpBase: 16000, dropArtifact: "laplace_gem", desc: "Смертоносный лабиринт телепортов в пустыне." },
  { id: "dung_dragon", name: "🐉 Бездна Драконьего Гребня", reqRank: "S", maxFloors: 15, cpBase: 95000, dropArtifact: "dragon_scale", desc: "Гнездо древних виверн и Короля Драконов." }
];

const ALL_GUILD_QUESTS = [
  { id: "q_f1", rank: "F", name: "🐀 Зачистка амбаров от крыс", enemy: "Крыса-мутант", cp: 110, hp: 55, reward: 25, gp: 8 },
  { id: "q_f2", rank: "F", name: "🌿 Корни маны у волчьих нор", enemy: "Степной волчонок", cp: 140, hp: 65, reward: 30, gp: 10 },
  { id: "q_e1", rank: "E", name: "🐗 Клыкастые Кабаны", enemy: "Клыкастый Вепрь", cp: 340, hp: 120, reward: 60, gp: 15 },
  { id: "q_e2", rank: "E", name: "🍄 Кислотные Слизни", enemy: "Кислотный Слизень", cp: 400, hp: 140, reward: 75, gp: 18 },
  { id: "q_d1", rank: "D", name: "🐺 Стая Двуглавых Волков", enemy: "Вожак Двуглавых", cp: 900, hp: 260, reward: 150, gp: 25 },
  { id: "q_d2", rank: "D", name: "🧌 Набег гоблинов-лучников", enemy: "Гоблин-главарь", cp: 1200, hp: 320, reward: 190, gp: 30 },
  { id: "q_c1", rank: "C", name: "🐍 Гнездо Багровых Кобр", enemy: "Багровая Кобра", cp: 2800, hp: 620, reward: 400, gp: 45 },
  { id: "q_c2", rank: "C", name: "🧟 Зачистка склепа от нежити", enemy: "Рыцарь-скелет", cp: 3400, hp: 750, reward: 520, gp: 50 },
  { id: "q_b1", rank: "B", name: "🗿 Древний Каменный Энт", enemy: "Каменный Энт", cp: 8600, hp: 1600, reward: 1200, gp: 80 },
  { id: "q_b2", rank: "B", name: "🦂 Императорский Скорпион", enemy: "Императорский Скорпион", cp: 11500, hp: 2200, reward: 1600, gp: 95 },
  { id: "q_a1", rank: "A", name: "🦅 Ледяная Виверна", enemy: "Ледяная Виверна", cp: 33000, hp: 4500, reward: 4000, gp: 150 },
  { id: "q_a2", rank: "A", name: "🦍 Снежный Бегемот", enemy: "Пещерный Бегемот", cp: 45000, hp: 6200, reward: 5500, gp: 180 },
  { id: "q_s1", rank: "S", name: "🐉 Логово Красного Дракона", enemy: "Красный Дракон", cp: 130000, hp: 18000, reward: 18000, gp: 300 },
  { id: "q_s2", rank: "S", name: "💀 Древний Архилич Бездны", enemy: "Архилич Бездны", cp: 190000, hp: 26000, reward: 28000, gp: 450 }
];

const CANON_NPCS = [
  { id: "sylphie", name: "Сильфиетта", gender: "female", race: "Полуэльф", role: "Подруга детства • Маг без слов", cp: 1200, region: "asura", minAge: 4, maxAge: 14, baseChance: 0.25 },
  { id: "roxy", name: "Рокси Мигурдия", gender: "female", race: "Мигурд", role: "Наставница • Маг Святого Ранга", cp: 4500, region: "asura", minAge: 5, maxAge: 16, baseChance: 0.22 },
  { id: "eris", name: "Эрис Бореас Грейрат", gender: "female", race: "Человек", role: "Леди Бореас • Бешеная мечница", cp: 2400, region: "asura", minAge: 7, maxAge: 18, baseChance: 0.22 },
  { id: "ghislaine", name: "Гилен Дедольдия", gender: "female", race: "Зверочеловек", role: "Мечница Ранга Царя Меча", cp: 29000, region: "asura", minAge: 7, maxAge: 25, baseChance: 0.16 },
  { id: "ruijerd", name: "Руджерд Спардия", gender: "male", race: "Спард", role: "Тупик • Воин сотен битв", cp: 36000, region: "demon", minAge: 10, maxAge: 35, baseChance: 0.22 },
  { id: "cliff", name: "Клифф Гриммор", gender: "male", race: "Человек", role: "Гениальный экзорцист Милиса", cp: 3200, region: "milis", minAge: 10, maxAge: 22, baseChance: 0.20 },
  { id: "zanoba", name: "Заноба Широне", gender: "male", race: "Мико", role: "Принц чудовищной силы", cp: 19000, region: "ranoa", minAge: 12, maxAge: 28, baseChance: 0.20 }
];

const SCHOOLS = [
  { id: "ranoa_academy", name: "🎓 Магическая Академия Раноа", regionKey: "ranoa", region: "Раноа (Шария)", minAge: 13, cost: 300, desc: "Центр изучения высшей магии и беззвучного каста." },
  { id: "asura_academy", name: "🏰 Королевская Академия Асуры", regionKey: "asura", region: "Асура (Арс)", minAge: 12, cost: 450, desc: "Элитное заведение знати и рыцарей." },
  { id: "sword_sanctuary", name: "🗡️ Святая Земля Меча (Додзё Гала)", regionKey: "ranoa", region: "Святая Земля Меча", minAge: 10, cost: 150, desc: "Тренировки в снежных пиках под началом Бога Меча." },
  { id: "milis_seminary", name: "⛪ Семинария Святого Милиса", regionKey: "milis", region: "Милис (Милисион)", minAge: 11, cost: 200, desc: "Священная магия лечения и барьеры." }
];

// =========================================================================
// СЮЖЕТНЫЕ ВЕХИ СУДЬБЫ (1-Я ЖИЗНЬ + БУДУЩИЕ ЖИЗНИ НА ВЕКА ВПЕРЕД)
// =========================================================================
const STORY_ACTIVITIES = [
  // --- 1-Я ЖИЗНЬ / ЭПОХА КАТАКЛИЗМА (20 ВЕХ) ---
  { id: "s1_awakening", era: "first", age: 1, name: "📖 1. Пробуждение памяти прошлой жизни", desc: "Осознать себя в новом мире и ощутить потоки маны.",
    action: (p) => { p.intellect += 3; p.maxMana += 12; return "Вы вспомнили прошлый мир и поняли, что мана поддается тренировке (+3 Знаний, +12 макс. маны)!"; } },
  { id: "s1_books", era: "first", age: 3, name: "📖 2. Тайное чтение фолиантов отца", desc: "Добраться до запертого книжного шкафа с трактатами по магии.",
    action: (p) => { p.intellect += 5; p.magicExp += 12; return "Вы освоили грамматику и первые заклинания (+5 Знаний, +12 Магии)!"; } },
  { id: "s1_waterball", era: "first", age: 5, name: "📖 3. Первый беззвучный Водяной Шар", desc: "Сотворить магию силой воображения без слов во дворе.",
    action: (p) => { p.magicExp += 25; p.maxMana += 25; return "Сфера воды взорвала потолок и стену двора! Родители в шоке (+25 Магии, +25 макс. маны)!"; } },
  { id: "s1_mentor", era: "first", age: 6, name: "📖 4. Приезд странствующей наставницы", desc: "Демон-маг или ветеран меча стучится в двери дома.",
    action: (p) => { p.magicExp += 20; p.swordGodExp += 10; p.intellect += 5; return "Наставник открыл вам секреты стихий и дисциплины (+20 Магии, +10 Мечу, +5 Знаний)!"; } },
  { id: "s1_roa", era: "first", age: 7, name: "📖 5. Путь в крепость Роа (Служба гувернёром)", desc: "Отправиться в земли Бореас для обучения строптивой наследницы.",
    action: (p) => { p.coins += 60; p.swordGodExp += 15; p.asuraInfluence += 10; return "Вы получили походный плащ, монеты и уважение дома Бореас (+60🪙, +15 Мечу, +10 влияния)!"; } },
  { id: "s1_red_omen", era: "first", age: 9, name: "🔴 6. Багровое знамение в небе Фитоа", desc: "Огромный вихрь маны сгущается над облаками. Воздух звенит.",
    action: (p) => { p.maxMana += 20; p.intellect += 5; return "Вы зарисовали аномалию в дневник — вскоре эти знания спасут вам жизнь (+20 макс. маны, +5 Знаний)!"; } },
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
  { id: "s1_hitogami_first_dream", era: "first", age: 11, name: "👁️ 8. Первый Сон Белого Пространства", desc: "Во сне перед вами возник безликий силуэт: «Я — Бог Людей Хитогами...»",
    choices: [
      { text: "Прислушаться к совету Хитогами (Найти тайник на пустошах)", action: (p) => {
        p.hitogamiTrust += 15; p.coins += 120; p.magicExp += 15;
        return "Вы последовали голосу из сна и нашли схрон контрабандистов (+120🪙, +15 Магии, Доверие Хитогами +15)!";
      }},
      { text: "Отказ: «Я никому не доверяю, тем более снам!»", action: (p) => {
        p.hitogamiTrust -= 10; p.intellect += 10; p.northGodExp += 15;
        return "Хитогами усмехнулся и исчез. Вы пробились сами (+10 Знаний, +15 Севера)!";
      }}
    ]
  },
  { id: "s1_demon_continent", era: "first", age: 12, name: "🌋 9. Переход через Багровые Пустоши", desc: "Выжить среди монстров B-ранга и встретить воина-Спарда.",
    action: (p) => { p.swordGodExp += 25; p.northGodExp += 20; p.maxHp += 20; return "Суровые бои на пустошах закалили ваше тело (+25 Мечу, +20 Севера, +20 макс. HP)!"; } },
  { id: "s1_ocean_crossing", era: "first", age: 13, name: "🚢 10. Переправа в Милисион и след родных", desc: "Добраться до порта Ветров и переплыть океан к Святой Земле.",
    action: (p) => {
      let found = p.relations.find(r => r.isLost);
      if (found) { found.isLost = false; return `🎉 В лагере беженцев Милиса вы чудом нашли <b>${found.name}</b>!`; }
      p.coins += 80; return "Вы переплыли океан, взявшись за подработку на судне (+80🪙).";
    }
  },
  { id: "s1_orsted_clash", era: "first", age: 14, name: "🐉 11. Ледяная встреча в Ущелье Дракона", desc: "В тумане Красного Дракона перед вами возникает Орстед. Проклятие душит вас!",
    choices: [
      { text: "Упасть на колени и промолчать (Выжить)", action: (p) => { p.hp = Math.max(10, p.hp - 20); p.intellect += 8; return "Вы пережили ледяной взгляд Бога Драконов (-20 HP, +8 Знаний)."; } },
      { text: "Упомянуть Хитогами! (Смертельный риск)", action: (p) => {
        p.hp = Math.max(5, p.hp - 70); p.maxMana += 30;
        return "Орстед пробил вам грудь, но в последний миг пощадил! Вы увидели разницу сил богов (-70 HP, +30 макс. маны)!";
      }}
    ]
  },
  { id: "s1_fitoa_truth", era: "first", age: 15, name: "🏚️ 12. Руины родины и обелиск пропавших", desc: "Вернуться на пепелище Фитоа и прочесть списки погибших.",
    action: (p) => { p.intellect += 10; p.coins += 50; return "Вы дали клятву защищать оставшихся близких (+10 Знаний, +50🪙)."; } },
  { id: "s1_god_crossroads", era: "first", age: 16, name: "⚖️ 13. РАСПУТЬЕ БОГОВ: Орстед или Хитогами?", desc: "Сон Хитогами и тень Проклятого Дракона требуют выбора стороны!",
    choices: [
      { text: "🐉 Встать под знамя Орстеда (Трудный путь спасения мира)", action: (p) => {
        p.dynastyFaction = "orsted"; p.factionProgress += 20; p.swordGodExp += 30; p.magicExp += 30;
        return "Вы избрали путь союзника Бога Драконов! Хитогами стал вашим вечным врагом (+30 ко всем стилям)!";
      }},
      { text: "👁️ Принять Сны Хитогами (Тайная власть и пророчества Человекобога)", action: (p) => {
        p.dynastyFaction = "hitogami"; p.hitogamiTrust += 40; p.coins += 500; p.maxMana += 60;
        return "Вы стали Апостолом Снов! Хитогами раскрыл вам тайные сокровища мира (+500🪙, +60 макс. маны)!";
      }}
    ]
  },
  { id: "s1_academy_years", era: "first", age: 18, name: "🎓 14. Триумф в Академии Шарии", desc: "Дуэль с буйными зверолюдьми и признание особого статуса студента.",
    action: (p) => { p.magicExp += 40; p.intellect += 15; p.squadFame += 30; return "Вы покорили Академию своим мастерством (+40 Магии, +15 Знаний, +30 Славы)!"; } },
  { id: "s1_begaritt_letter", era: "first", age: 21, name: "🏜️ 15. Письмо о беде в Лабиринте Бегаритта", desc: "Родные в ловушке пустыни! Пора собирать отряд и идти через телепорт.",
    action: (p) => { p.dungeonProgress["dung_teleport"] = Math.max(p.dungeonProgress["dung_teleport"] || 1, 5); p.swordGodExp += 30; return "Вы преодолели пустыню и открыли проход вглубь Лабиринта (+30 Мечу)!"; } },
  { id: "s1_labyrinth_guardian", era: "first", age: 23, name: "💎 16. Падение Хранителя Магической Гидры", desc: "Решающая схватка в сердце лабиринта ради спасения семьи.",
    action: (p) => {
      let lost = p.relations.find(r => r.isLost);
      if (lost) lost.isLost = false;
      p.coins += 600; p.magicExp += 45;
      return "Многоглавая Гидра повержена! Вы вынесли сокровища и спасли родных (+600🪙, +45 Магии)!";
    }
  },
  { id: "s1_asura_throne", era: "first", age: 26, name: "👑 17. Битва за Трон Королевства Асура", desc: "Заговор знати, столкновение клинков в столице Арс и политический переворот.",
    action: (p) => { p.asuraInfluence += 45; p.coins += 400; p.swordGodExp += 35; return "Вы сыграли ключевую роль в королевском перевороте (+45 влияния, +400🪙, +35 Мечу)!"; } },
  { id: "s1_apostle_clash", era: "first", age: 29, name: "🌑 18. Ночь Теней: Удар Апостола / Наёмника", desc: "Враждебный Бог подослал убийцу, чтобы переломить вашу судьбу.",
    action: (p) => {
      if (p.dynastyFaction === "hitogami") { p.coins += 450; p.northGodExp += 40; return "По подсказке Сна Хитогами вы перебили лазутчиков Орстеда (+450🪙, +40 Севера)!"; }
      p.swordGodExp += 45; p.magicExp += 45; return "Вы отбили ночную засаду Апостола и захватили древние свитки (+45 Мечу и Магии)!";
    }
  },
  { id: "s1_magic_armor", era: "first", age: 34, name: "🤖 19. Чертежи Титанической Магической Брони", desc: "Соединить гномью инженерию и магию мана-кристаллов.",
    action: (p) => { p.intellect += 30; p.maxMana += 80; p.maxHp += 60; return "Ваши исследования боевой брони вписаны в архивы Шарии (+30 Знаний, +80 маны, +60 макс. HP)!"; } },
  { id: "s1_elder_legacy", era: "first", age: 50, name: "📜 20. Завет Основателя Династии", desc: "Заложить фундамент влияния рода на грядущие столетия.",
    action: (p) => { p.asuraInfluence += 50; p.squadFame += 80; p.intellect += 25; return "Летописи рода запечатаны: потомки не забудут ваш путь (+50 влияния, +80 Славы, +25 Знаний)!"; } },

  // --- БУДУЩИЕ ЖИЗНИ И СЛЕДУЮЩИЕ ВЕКА (ПОСТ-КАТАКЛИЗМ, 430 - 800+ ГГ., БЕЗ ВОЙНЫ С ЛАПЛАСОМ) ---
  { id: "f_child_archives", era: "future", minYear: 430, age: 4, name: "📚 Наследие: Дневники первых героев", desc: "В родовом сундуке хранятся записи времён Катаклизма Фитоа.",
    action: (p) => { p.intellect += 12; p.maxMana += 20; return "Вы изучили опыт прошлого поколения (+12 Знаний, +20 макс. маны)!"; } },
  { id: "f_hitogami_whisper", era: "future", minYear: 430, age: 12, name: "👁️ Сон Хитогами: Зов Нового Поколения", desc: "Человекобог вновь пробирается в сны смертных: «Твои предки оставили след... Служи мне!»",
    choices: [
      { text: "Присягнуть Снам Хитогами (+500🪙, +50 маны, ветка Хитогами)", action: (p) => {
        p.dynastyFaction = "hitogami"; p.hitogamiTrust += 35; p.coins += 500; p.maxMana += 50;
        return "Вы вступили в тайный круг Апостолов Хитогами (+500🪙, +50 макс. маны)!";
      }},
      { text: "Встать под знамя Орстеда (Путь Хранителя Мира)", action: (p) => {
        p.dynastyFaction = "orsted"; p.factionProgress += 25; p.swordGodExp += 35; p.magicExp += 35;
        return "Вы отвергли Сны Пустоты и принесли клятву Орстеду (+35 Мечу и Магии)!";
      }}
    ]
  },
  { id: "f_fitoa_rebuild", era: "future", minYear: 430, maxYear: 520, age: 18, name: "🌾 Возрождение Провинции Фитоа", desc: "Участие в отстройке разрушенных земель и охота на бродячих монстров.",
    action: (p) => { p.coins += 350; p.asuraInfluence += 30; return "На месте старых пустошей выросли новые города (+350🪙, +30 влияния)!"; } },
  { id: "f_orsted_network", era: "future", minYear: 440, reqFaction: "orsted", age: 24, name: "🐉 Тайная сеть Орстеда в Милисе", desc: "Координация гильдий и магов против теневых агентов Белого Пространства.",
    action: (p) => { p.factionProgress += 30; p.intellect += 25; p.coins += 400; return "Вы раскрыли ячейку Апостолов в Милисионе (+400🪙, +25 Знаний)!"; } },
  { id: "f_hitogami_sabotage", era: "future", minYear: 440, reqFaction: "hitogami", age: 24, name: "👁️ Диверсия по Сну Хитогами", desc: "Человекобог указал на уязвимость союзников Орстеда в Асуре.",
    action: (p) => { p.hitogamiTrust += 30; p.coins += 750; p.northGodExp += 45; return "Операция прошла бесшумно, сундуки врага ваши (+750🪙, +45 Севера)!"; } },
  { id: "f_c5_skyships", era: "future", minYear: 500, maxYear: 620, age: 20, name: "⛵ VI век: Испытание Магических Барж", desc: "Учёные Шарии запустили первые воздушные суда на мана-кристаллах.",
    action: (p) => { p.intellect += 30; p.maxMana += 60; return "Вы освоили навигацию небесных судов (+30 Знаний, +60 макс. маны)!"; } },
  { id: "f_c5_powers_audit", era: "future", minYear: 500, age: 30, name: "🏆 Передел Монумента Семи Сил", desc: "Спустя столетие имена на каменной плите вызывают трепет. Пора вписать своё!",
    action: (p) => { p.swordGodExp += 60; p.squadFame += 100; return "Мастера шести континентов следят за вашим ростом (+60 Мечу, +100 Славы)!"; } },
  { id: "f_c6_mana_crisis", era: "future", minYear: 600, maxYear: 720, age: 22, name: "❄️ VII век: Великое Истощение Жил Севера", desc: "Кристаллы Раноа гаснут — нужно спуститься в древние глубины за сердцем земли.",
    action: (p) => { p.maxMana += 120; p.magicExp += 70; return "Вы стабилизировали северные жилы и впитали чистую ману (+120 макс. маны, +70 Магии)!"; } },
  { id: "f_c6_hitogami_prophet", era: "future", minYear: 600, reqFaction: "hitogami", age: 35, name: "👁️ Пророк Седьмого Столетия", desc: "Сны Хитогами переписывают политическую карту континентов вашими руками.",
    action: (p) => { p.asuraInfluence += 80; p.coins += 2000; return "Короли и архимаги слушаются ваших «предсказаний» (+80 влияния, +2000🪙)!"; } },
  { id: "f_c6_orsted_relics", era: "future", minYear: 600, reqFaction: "orsted", age: 35, name: "🐉 Архив Первого Бога Драконов", desc: "Орстед доверил вам часть древних рун для защиты будущего мира.",
    action: (p) => { p.swordGodExp += 80; p.waterGodExp += 80; p.maxHp += 150; return "Тело и дух укреплены древним искусством Драконов (+80 к стилям, +150 макс. HP)!"; } },
  { id: "f_c7_eternal_dynasty", era: "future", minYear: 700, age: 28, name: "🏛️ VIII+ век: Легенда Бессмертного Рода", desc: "Ваша фамилия стала нарицательной от Асуры до пустошей Бегаритта.",
    action: (p) => { p.coins += 3500; p.squadFame += 200; p.maxMana += 150; return "Именитые дома мира присылают дары вашему престолу (+3500🪙, +200 Славы, +150 маны)!"; } },
  { id: "f_c7_void_echo", era: "future", minYear: 700, age: 42, name: "🌌 Отголосок Белого Пространства", desc: "Спустя три столетия после Катаклизма барьер между мирами истончился.",
    action: (p) => { p.magicExp += 120; p.swordGodExp += 120; p.intellect += 50; return "Вы заглянули за грань мироздания (+120 Магии и Мечу, +50 Знаний)!"; } }
];

const ACTIVITIES = [
  { id: "baby_crawl", category: "childhood", name: "👶 Ползать и изучать комнаты", minAge: 0, maxAge: 3, cost: 0, apCost: 1, desc: "Развивает восприятие мира.", action: (p) => { p.intellect += 1; return "Вы увлеченно изучали мир вокруг (+1 Знаний)."; } },
  { id: "baby_peekaboo", category: "childhood", name: "🍼 Играть с родителями", minAge: 0, maxAge: 2, cost: 0, apCost: 1, desc: "Укрепляет здоровье и покой.", action: (p) => { p.hp = Math.min(p.maxHp, p.hp + 15); return "Тепло родного дома восстановило силы (+15 HP)."; } },
  { id: "listen_parents", category: "childhood", name: "🗣️ Слушать сказки и разговоры", minAge: 1, maxAge: 5, cost: 0, apCost: 1, desc: "Азы речи и истории мира.", action: (p) => { p.intellect += 2; return "Сказки о великих героях расширили кругозор (+2 Знаний)."; } },
  { id: "toddler_mana", category: "magic", name: "🔮 Детская концентрация маны", minAge: 1, maxAge: 9, cost: 0, apCost: 1, desc: "Истощение пластичных каналов расширяет сосуд души.", action: (p) => {
    const mod = (p.trait.growthMod || 1) * (p.raceObj.bonus.manaMod || 1);
    const gain = Math.round(7 * mod);
    p.maxMana += gain; p.mana = p.maxMana; p.magicExp += 7;
    return `Сосуд маны расширился на <b>+${gain} макс. маны</b>!`;
  }},
  { id: "wooden_stick_play", category: "childhood", name: "🪵 Тренировка с палкой во дворе", minAge: 3, maxAge: 6, cost: 0, apCost: 1, desc: "Первые замахи клинком.", action: (p) => { p.swordGodExp += 8; return "Вы азартно сбивали крапиву палкой (+8 Мечу)."; } },
  { id: "catch_insects", category: "childhood", name: "🦗 Ловля сверчков в траве", minAge: 3, maxAge: 7, cost: 0, apCost: 1, desc: "Реакция глаз и ловкость.", action: (p) => { p.northGodExp += 8; return "Вы ловко перехватывали жуков (+8 Севера)."; } },
  { id: "read_scrolls", category: "life", name: "📜 Изучение свитков и летописей", minAge: 4, maxAge: 100, cost: 5, apCost: 1, desc: "Книги дают Знания (удваивается у Любознательных).", action: (p) => {
    const bonus = p.trait.id === "curious" ? 11 : 7;
    p.coins -= 5; p.intellect += bonus;
    return `Вы изучили древние трактаты (+${bonus} Знаний).`;
  }},
  { id: "magic_circle_study", category: "magic", name: "✨ Изучение магических кругов", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Формулы стихий и призыва.", action: (p) => { p.magicExp += 16; p.intellect += 3; return "Вы вычерчивали руны призыва (+16 Магии, +3 Знаний)."; } },
  { id: "sword_practice", category: "combat", name: "🗡️ Стойка Бога Меча", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Молниеносный первый выпад.", action: (p) => { p.swordGodExp += 18; return "Клинок со свистом рассекает воздух (+18 Мечу)."; } },
  { id: "water_parry", category: "combat", name: "💧 Стойка Бога Воды", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Идеальное парирование атак.", action: (p) => { p.waterGodExp += 18; return "Вы гасили встречные выпады (+18 Воды)."; } },
  { id: "north_tricks", category: "combat", name: "🌪️ Стойка Бога Севера", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Финты, перекаты и уловки.", action: (p) => { p.northGodExp += 18; return "Вы освоили выпад из переката (+18 Севера)."; } },
  { id: "gather_herbs", category: "life", name: "🌿 Сбор редких трав", minAge: 6, maxAge: 100, cost: 0, apCost: 1, desc: "Подработка для аптекаря.", action: (p) => { const e = Math.floor(Math.random() * 16) + 8; p.coins += e; return `Вы сдали корзину трав (+${e}🪙).`; } },
  { id: "school_lesson", category: "school", name: "🎓 Посетить академическую лекцию", minAge: 10, maxAge: 100, cost: 0, apCost: 1, desc: "Прогресс в зачисленной Академии.", action: (p) => {
    if (!p.enrolledSchool) return "Вы не зачислены в Академию! Поступите во вкладке «Мир».";
    const intGain = p.trait.id === "curious" ? 10 : 6;
    p.schoolProgress = p.schoolProgress || 1;
    p.intellect += intGain; p.magicExp += 18;
    if (Math.random() > 0.52) {
      p.schoolProgress++;
      if (p.schoolProgress > 4) {
        p.graduatedSchools.push(p.enrolledSchool);
        p.enrolledSchool = null; p.coins += 250;
        return `🏆 <b>ВЫПУСК!</b> Вы с отличием окончили Академию (+250🪙)!`;
      }
      return `📜 Экзамен сдан! Текущий курс: ${p.schoolProgress}/4.`;
    }
    return `Вы конспектировали лекцию магистра (+18 Магии, +${intGain} Знаний).`;
  }},
  { id: "street_sparring", category: "youth", name: "🥊 Уличные дуэли", minAge: 11, maxAge: 17, cost: 0, apCost: 1, desc: "Опыт уличных стычек.", action: (p) => { p.swordGodExp += 12; p.northGodExp += 12; return "Азартный поединок на окраине (+12 Мечу и Севера)."; } },
  { id: "youth_debate", category: "youth", name: "📚 Диспуты о природе маны", minAge: 12, maxAge: 25, cost: 0, apCost: 1, desc: "Споры об устройстве мира.", action: (p) => { p.intellect += 8; return "Вы блестяще отстояли свои тезисы (+8 Знаний)."; } },
  { id: "tavern_rest", category: "life", name: "🛌 Отдых в таверне (100% HP)", minAge: 6, maxAge: 100, cost: 10, apCost: 1, desc: "Снять комнату и полностью восстановить HP.", action: (p) => { p.coins -= 10; p.hp = p.maxHp; return "Горячий ужин и мягкая постель полностью восстановили здоровье!"; } },
  { id: "high_society_ball", category: "life", name: "🎭 Дворянский бал-маскарад", minAge: 16, maxAge: 100, cost: 35, apCost: 1, desc: "Связи среди знати Асуры.", action: (p) => { p.coins -= 35; p.asuraInfluence += 12; return "Полезные знакомства под сводами залов (+12 влияния)."; } },
  { id: "write_memoirs", category: "elder", name: "✍️ Родовые хроники и мемуары", minAge: 45, maxAge: 100, cost: 0, apCost: 1, desc: "Мудрость для потомков.", action: (p) => { p.intellect += 14; return "Мемуары занесены в родовой архив (+14 Знаний)."; } },
  { id: "mentor_young", category: "elder", name: "🥋 Наставлять молодых учеников", minAge: 40, maxAge: 100, cost: 0, apCost: 1, desc: "Передача секретов клинка.", action: (p) => { p.squadFame += 20; p.coins += 40; return "Ученики внимали вашим урокам (+20 Славы, +40🪙)."; } }
];

const RANDOM_EVENTS = [
  { id: "hitogami_dream_tempt", minAge: 12, chance: 0.22, icon: "👁️", title: "Сон Белого Пространства (Хитогами)",
    desc: "Среди ночи туман расступается, и безликий Бог Людей улыбается вам: «Послушай мой совет — забери сундук в старой часовне до рассвета...»",
    choices: [
      { text: "Последовать совету Хитогами (+250🪙, +20 Магии, связь с Хитогами)", action: (p) => {
        p.coins += 250; p.magicExp += 20; p.hitogamiTrust += 20;
        if (p.dynastyFaction === "neutral" && p.hitogamiTrust >= 35) {
          p.dynastyFaction = "hitogami";
          return "Вы забрали золото и артефактные свитки! Сны Хитогами полностью подчинили вашу судьбу — вы стали его Апостолом (+250🪙, +20 Магии)!";
        }
        return "В часовне действительно ждал забытый сундук с золотом (+250🪙, +20 Магии)!";
      }},
      { text: "Отвергнуть шёпот Пустоты", action: (p) => {
        p.hitogamiTrust -= 10; p.intellect += 8;
        return "Вы проснулись в холодном поту, но сохранили ясность разума (+8 Знаний).";
      }}
    ]
  },
  { id: "milis_saint_healer", minAge: 14, chance: 0.25, icon: "✨", title: "Странствующий Архиепископ Исцеления",
    desc: "Вы встретили редкого мастера Святой Магии Милиса, способного срастить кости и даже вырастить утраченные конечности!",
    choices: [
      { text: "Оплатить ритуал исцеления (800🪙 — лечит травмы и 100% HP)", action: (p) => {
        if (p.coins < 800) return "У вас нет 800 монет на священные реагенты!";
        p.coins -= 800; p.injuries = []; p.hp = p.maxHp;
        return "Ослепительный свет окутал ваше тело! Все раны и утраченные конечности полностью восстановлены!";
      }},
      { text: "Попросить лишь простого благословения (бесплатно, +20 HP)", action: (p) => { p.hp = Math.min(p.maxHp, p.hp + 20); return "Мягкое сияние согрело вашу душу (+20 HP)."; } }
    ]
  },
  { id: "fame_challenger_duel", minAge: 14, chance: 0.22, icon: "⚔️", title: "Вызов от Искателя Славы!",
    desc: "Странствующий мечник узнал вас по балладам бардов: «Скрести со мной клинок, и я заберу твою славу!»",
    choices: [
      { text: "Принять бой и сокрушить наглеца!", action: (p) => {
        const myCp = calcCombatPower(p);
        const enemyCp = Math.floor(myCp * (0.6 + Math.random() * 0.5));
        if (myCp > enemyCp) { p.swordGodExp += 30; p.squadFame += 25; return "Молниеносный выпад! Наглец повержен (+30 Мечу, +25 Славы)!"; }
        p.hp = Math.max(10, p.hp - 35); return "Схватка вышла суровой (-35 HP), но вы удержали победу!";
      }},
      { text: "Пройти мимо", action: () => "Вы хладнокровно проигнорировали крикуна." }
    ]
  },
  { id: "noble_matchmaking", minAge: 16, chance: 0.16, icon: "💍", title: "Сватовство Дворянского Дома!",
    desc: "К дому прибыла карета знатного рода. Лорд предлагает брак с солидным приданым!",
    choices: [
      { text: "Принять предложение (+350🪙, +25 влияния)", action: (p) => {
        if (p.spouse) return "Вы уже в браке! Сваты удалились.";
        p.coins += 350; p.asuraInfluence += 25;
        const sName = p.gender === "male" ? "Леди Элеонора де Арс" : "Лорд Годфри де Роа";
        const sp = { id: "spouse_" + Date.now(), name: sName, gender: p.gender === "male" ? "female" : "male", age: p.age + 1, role: "Дворянский супруг", cp: 1500, relation: 80, status: "Супруг/Супруга", isFamily: false, isDead: false };
        p.spouse = sp; p.relations.push(sp);
        return `Вы заключили союз с <b>${sName}</b>! Приданое: +350🪙 и +25 влияния!`;
      }},
      { text: "Вежливо отказать", action: () => "Вы ответили, что ваше сердце пока свободно." }
    ]
  },
  { id: "canon_kishirika", isRare: true, minAge: 8, chance: 0.08, icon: "👁️", title: "Императрица Демонов Киширика!",
    desc: "В пыли сидит голодная коротышка с рогами: «Ху-ха-ха! Накорми Киширику за 50 монет, и я подарю тебе Демонический Глаз!»",
    choices: [
      { text: "Отдать 50 монет за Демонический Глаз", action: (p) => {
        if (p.coins < 50) return "Нет 50 монет! Киширика обиженно сбежала.";
        p.coins -= 50;
        const keys = Object.keys(DEMON_EYES);
        const eye = DEMON_EYES[keys[Math.floor(Math.random() * keys.length)]];
        p.demonEyes = p.demonEyes || { left: null, right: null };
        if (!p.demonEyes.left) { p.demonEyes.left = eye; return `👁️ В левую глазницу вживлён <b>${eye.name}</b>!`; }
        if (!p.demonEyes.right) { p.demonEyes.right = eye; return `👁️ В правую глазницу вживлён <b>${eye.name}</b>!`; }
        p.swordGodExp += 35; p.magicExp += 35;
        return "У вас уже оба глаза демона! Киширика поделилась маной (+35 ко всем стилям).";
      }},
      { text: "Пройти мимо", action: () => "Вы не стали связываться со странной девчонкой." }
    ]
  },
  { id: "wandering_bard", minAge: 7, chance: 0.20, icon: "🪕", title: "Песнь Странствующего Барда",
    desc: "В таверне бард поёт баллады о героях прошлых лет и тайных землях.",
    choices: [
      { text: "Угостить элем (5🪙) и расспросить о слухах", action: (p) => { if (p.coins < 5) return "Не хватило монет."; p.coins -= 5; p.intellect += 6; return "Бард раскрыл древние легенды (+6 Знаний)."; } },
      { text: "Просто послушать музыку (+10 HP)", action: (p) => { p.hp = Math.min(p.maxHp, p.hp + 10); return "Мелодия успокоила сердце (+10 HP)."; } }
    ]
  },
  { id: "stolen_wallet", minAge: 10, chance: 0.20, icon: "👝", title: "Вор на базарной площади!",
    desc: "Карманник срезал кошель у купца и несется прямо на вас!",
    choices: [
      { text: "Поставить подножку (Стиль Севера)", action: (p) => {
        if (p.northGodExp >= 15 || Math.random() > 0.3) { p.coins += 50; p.northGodExp += 10; return "Купец наградил вас за помощь (+50🪙, +10 Севера)."; }
        p.hp = Math.max(5, p.hp - 15); return "Вор полоснул ножом и сбежал (-15 HP).";
      }},
      { text: "Сбить заклинанием", action: (p) => { p.magicExp += 15; return "Вор задержан стражей (+15 Магии)."; } },
      { text: "Отойти в сторону", action: () => "Вы не стали вмешиваться." }
    ]
  },
  { id: "canon_orsted", isRare: true, minAge: 16, chance: 0.05, icon: "🐉", title: "Встреча: Бог Драконов Орстед!",
    desc: "В ущелье вы натыкаетесь на мужчину в белом чешуйчатом плаще. Проклятие ужаса сковывает грудь!",
    choices: [
      { text: "Упасть на колени и отвести взгляд", action: (p) => { p.hp = Math.max(10, p.hp - 15); return "Орстед окинул вас ледяным взглядом и прошёл мимо (-15 HP)."; } },
      { text: "Попытаться заговорить о Хитогами", action: (p) => {
        if (p.dynastyFaction === "orsted") { p.factionProgress += 15; return "Орстед коротко кивнул: «Действуй по плану, союзник» (+15 прогресса Орстеда)."; }
        p.hp = Math.max(5, p.hp - 75); return "Орстед нанёс сокрушительный удар! Вы чудом выжили (-75 HP)!";
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
