const START_YEAR = 407;
const CALAMITY_YEAR = 417;

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

// 1. Сословия семьи с привязкой к региону рождения
const REGION_FAMILY_STATUSES = {
  asura: [
    { id: "asura_slums", name: "Нищие трущоб Арса", coins: 5, hp: 15, northGod: 15, desc: "Выживание на улицах столицы (+15 HP, +15 к стилю Севера)." },
    { id: "asura_farmer", name: "Пшеничные фермеры Фитоа", coins: 40, hp: 25, desc: "Уютный дом среди золотых полей (+25 HP)." },
    { id: "asura_knight", name: "Потомственные рыцари Асуры", coins: 180, swordGod: 25, int: 5, desc: "Родовое фехтование и воинская честь (+180🪙, +25 к Мечу)." },
    { id: "asura_high_noble", name: "Высшая аристократия Асуры", coins: 950, int: 22, influence: 40, desc: "Мраморные залы столицы Арс (+950🪙, +40 влияния, +22 Знаний)." }
  ],
  ranoa: [
    { id: "ranoa_trapper", name: "Охотники ледников Севера", coins: 30, hp: 35, northGod: 15, desc: "Закалка вечной мерзлотой (+35 HP, +15 к стилю Севера)." },
    { id: "ranoa_artificer", name: "Цеховые артефакторы Шарии", coins: 150, int: 15, manaBonus: 30, desc: "Мастерская кристаллов маны (+150🪙, +30 маны, +15 Знаний)." },
    { id: "ranoa_prof_dynasty", name: "Династия Профессоров Академии", coins: 500, int: 25, manaBonus: 70, desc: "Библиотеки высшей магии (+500🪙, +70 маны, +25 Знаний)." }
  ],
  demon: [
    { id: "demon_outcast", name: "Парии каменистых пустошей", coins: 5, hp: 45, northGod: 20, desc: "Жестокая жизнь среди монстров (+45 HP, +20 к стилю Севера)." },
    { id: "demon_nomad_clan", name: "Кочевой клан воинов-демонов", coins: 70, hp: 55, swordGod: 30, desc: "Охотничьи стоянки под багровым небом (+55 HP, +30 к Мечу)." },
    { id: "demon_lord_blood", name: "Потомки Демонических Лордов", coins: 350, hp: 65, manaBonus: 95, desc: "Кровь древних владык эпохи войн (+95 маны, +65 HP)." }
  ],
  great_forest: [
    { id: "forest_orphan", name: "Лесные подкидыши", coins: 10, hp: 35, northGod: 20, desc: "Жизнь на верхних ярусах гигантских деревьев (+35 HP)." },
    { id: "forest_dorudia_hunter", name: "Охотничья стая клана Дорудиа", coins: 60, hp: 40, swordGod: 35, desc: "Звериное чутье и выпад клыков (+40 HP, +35 к Мечу)." },
    { id: "forest_chieftain_family", name: "Семья Верховного Вождя Леса", coins: 300, hp: 55, swordGod: 45, int: 12, desc: "Прямые потомки священных зверей (+300🪙, +45 к Мечу)." }
  ],
  milis: [
    { id: "milis_pilgrim", name: "Семья смиренных паломников", coins: 25, hp: 20, int: 10, desc: "Молитвы у корней Священного Древа (+20 HP, +10 Знаний)." },
    { id: "milis_merchant_house", name: "Шелковый купеческий дом", coins: 350, int: 18, desc: "Торговля фимиамом и шелком (+350🪙, +18 Знаний)." },
    { id: "milis_templar_dynasty", name: "Высший рыцарский род Храма", coins: 600, swordGod: 30, waterGod: 30, int: 15, desc: "Священный белый доспех и статус (+600🪙, +30 к стилям Воды и Меча)." }
  ],
  begaritt: [
    { id: "desert_pariah", name: "Изгои барханов Бегаритта", coins: 10, hp: 40, northGod: 25, desc: "Жизнь среди песчаных скорпионов (+40 HP, +25 к стилю Севера)." },
    { id: "desert_nomad_caravan", name: "Кочевники оазисов", coins: 90, hp: 35, northGod: 30, desc: "Караванная вольница пустыни (+90🪙, +30 к стилю Севера)." },
    { id: "desert_labyrinth_dynasty", name: "Клан расхитителей лабиринтов", coins: 450, swordGod: 35, int: 16, manaBonus: 35, desc: "Древние карты подземных сокровищниц (+450🪙, +35 к Мечу, +35 маны)." }
  ]
};

const FAMILY_STATUSES = REGION_FAMILY_STATUSES.asura;

const RACES = {
  human: { id: "human", name: "Человек", maxAge: 75, desc: "Быстро обучаются, универсальны во всем.", bonus: { baseMana: 25, hp: 0, int: 5, coins: 50, manaMod: 1.0 } },
  demon: { id: "demon", name: "Демон", maxAge: 220, desc: "Огромный сосуд маны с рождения, выносливость, долголетие.", bonus: { baseMana: 80, hp: 35, int: 2, coins: 15, manaMod: 1.6 } },
  beast: { id: "beast", name: "Зверочеловек", maxAge: 95, desc: "Острый нюх, дикая реакция в ближнем бою.", bonus: { baseMana: 20, hp: 25, swordGod: 25, coins: 25, manaMod: 0.9 } },
  elf: { id: "elf", name: "Эльф / Полуэльф", maxAge: 350, desc: "Древнейшие хранители знаний и глубокое сродство с маной.", bonus: { baseMana: 60, hp: -10, int: 12, coins: 40, manaMod: 1.4 } },
  speld: { id: "speld", name: "Спард", maxAge: 180, desc: "Алый камень во лбу, грозные воины смерти.", bonus: { baseMana: 30, hp: 45, swordGod: 35, northGod: 20, coins: 10, manaMod: 1.0 } },
  dwarf: { id: "dwarf", name: "Гном / Дворф", maxAge: 130, desc: "Мастера кузнечного дела и артефактов.", bonus: { baseMana: 15, hp: 40, northGod: 25, coins: 80, manaMod: 0.8 } }
};

const LANGUAGES = {
  human: { id: "human", name: "Человеческий язык", desc: "Общий язык Асуры, Раноа и Милиса." },
  demon: { id: "demon", name: "Демонический язык", desc: "Снимает наценки торговцев на Демоническом континенте и открывает диалоги с демонами." },
  beast: { id: "beast", name: "Звериный язык", desc: "Язык кланов Великого Леса. Открывает дипломатию с вождями Дорудиа." },
  god_fighter: { id: "god_fighter", name: "Язык Бога Бойцов", desc: "Позволяет читать древние свитки секретных техник ближнего боя." },
  dragon: { id: "dragon", name: "Язык Драконьего Племени", desc: "Язык древних рун. Необходим для чтения телепортационных кругов." }
};

const TRAITS = [
  { id: "healthy", name: "Стальное здоровье", rarity: "common", weight: 20, hp: 35, manaBonus: 0, growthMod: 1.0, desc: "+35 HP и стойкость к болезням." },
  { id: "curious", name: "Любознательность", rarity: "common", weight: 20, int: 8, manaBonus: 5, growthMod: 1.1, desc: "+8 к Знаниям, книги читаются быстрее." },
  { id: "water_aff", name: "Сродство с Водой 💧", rarity: "rare", weight: 8, manaBonus: 35, waterGod: 20, growthMod: 1.4, desc: "+35 маны, бонус к водным стихиям." },
  { id: "fire_aff", name: "Сродство с Огнем 🔥", rarity: "rare", weight: 8, manaBonus: 35, swordGod: 20, growthMod: 1.4, desc: "+35 маны, взрывной первый выпад меча." },
  { id: "silent_cast", name: "Беззвучный каст 🔮", rarity: "epic", weight: 5, manaBonus: 75, growthMod: 1.9, desc: "+75 маны, мгновенный каст заклинаний силой мысли!" },
  { id: "laplace_factor", name: "Истинный Фактор Лапласа ✨", rarity: "mythic", weight: 1, manaBonus: 260, growthMod: 3.5, desc: "Океан маны. Каналы души никогда не затвердеют!" },

  { id: "miko_strength", name: "🌟 Благословение Мико: Чудовищная Сила", rarity: "mythic", weight: 2, hp: 200, swordGod: 70, northGod: 70, manaBonus: -10, growthMod: 1.8, desc: "Тело из живой стали (как у Занобы)! Огромный физический урон." },
  { id: "miko_memory", name: "🌟 Благословение Мико: Взор Времени и Памяти", rarity: "mythic", weight: 2, int: 30, manaBonus: 100, growthMod: 2.2, desc: "Абсолютная память души. Все науки изучаются мгновенно, +100 к мане." },
  { id: "miko_healing", name: "🌟 Благословение Мико: Источник Жизни", rarity: "mythic", weight: 2, hp: 120, manaBonus: 70, waterGod: 45, growthMod: 1.7, desc: "Кровь святого исцеления. Регенерация HP каждый год." },

  { id: "god_mode", name: "⚡ ЧИТ-РЕЖИМ: Истинный Творец (Бог)", rarity: "mythic", weight: 0, hp: 99999, manaBonus: 99999, swordGod: 2000, waterGod: 2000, northGod: 2000, int: 999, coins: 9999999, growthMod: 10.0, desc: "Бесконечные деньги (10,000,000🪙), бессмертие, высший ранг Бога во всех стихиях!" }
];

const DEMON_EYES = {
  foresight: { id: "foresight", name: "Глаз Предвидения 👁️", desc: "+35% шанс уклонения от любых атак в бою, +4500 БМ.", cp: 4500, dodgeChance: 0.35 },
  mana_sight: { id: "mana_sight", name: "Глаз Маны 🔮", desc: "Видит потоки маны. Полный иммунитет к ловушкам в лабиринтах, +4000 БМ.", cp: 4000, trapImmune: true },
  appraisal: { id: "appraisal", name: "Глаз Оценки 📜", desc: "Раскрывает слабые места врагов (+30% урона), +3500 БМ.", cp: 3500, damageBonus: 1.3 },
  clarity: { id: "clarity", name: "Глаз Дальнего Взора 🎯", desc: "Сверхзрение на километры. Точность атак 100%, +3000 БМ.", cp: 3000, alwaysHit: true }
};

// 2. Расширенные законные службы (минимум 6 в густонаселенных)
const REGIONAL_JOBS = {
  asura: [
    {
      id: "asura_guard", name: "Королевская Гвардия Асуры",
      ranks: [
        { title: "Новобранец гарнизона", salary: 25, minAge: 14, minSword: 20, desc: "Патрулирование рыночных площадей." },
        { title: "Городской страж ворот", salary: 55, minAge: 16, minSword: 50, desc: "Охрана внутренних ворот Роа." },
        { title: "Рыцарь Первого круга", salary: 140, minAge: 20, minSword: 120, desc: "Эскорт дворянских карет." },
        { title: "Капитан Королевской Гвардии", salary: 380, minAge: 25, minSword: 300, desc: "Командование батальоном столицы Арс." },
        { title: "Лорд-Командующий Армии Асуры", salary: 950, minAge: 32, minSword: 600, desc: "Высший военный чин королевства." }
      ]
    },
    {
      id: "asura_bureaucrat", name: "Королевское Казначейство",
      ranks: [
        { title: "Младший переписчик свитков", salary: 30, minAge: 14, minInt: 20, desc: "Сортировка налоговых свитков." },
        { title: "Податной инспектор провинций", salary: 70, minAge: 18, minInt: 45, desc: "Сбор податей с провинций." },
        { title: "Аудитор Короны", salary: 180, minAge: 24, minInt: 90, desc: "Ревизия дворянских имений." },
        { title: "Главный Казначей Асуры", salary: 600, minAge: 30, minInt: 180, desc: "Управление государственным золотым запасом." }
      ]
    },
    {
      id: "asura_diplomat", name: "Дипломатический Корпус Короны",
      ranks: [
        { title: "Атташе посольства в Роа", salary: 45, minAge: 16, minInt: 35, desc: "Переговоры между провинциями." },
        { title: "Полномочный Посол Асуры", salary: 160, minAge: 22, minInt: 80, desc: "Миссии в Раноа и Святой Милис." },
        { title: "Министр Иностранных Дел", salary: 550, minAge: 30, minInt: 170, desc: "Формирование континентальных альянсов." }
      ]
    },
    {
      id: "asura_court_mage", name: "Придворная Коллегия Магов Арса",
      ranks: [
        { title: "Адепт дворцовых барьеров", salary: 50, minAge: 15, minMagic: 50, desc: "Поддержание охранных глифов дворца." },
        { title: "Магистр королевского эскорта", salary: 190, minAge: 21, minMagic: 150, desc: "Личная магическая стража монархов." },
        { title: "Архимаг Королевского Совета", salary: 700, minAge: 28, minMagic: 380, desc: "Верховный чародей королевства." }
      ]
    },
    {
      id: "asura_merchant_guild", name: "Торговая Палата Шелка и Зерна",
      ranks: [
        { title: "Оценщик торговых лавок", salary: 35, minAge: 14, minInt: 25, desc: "Инспекция цен на базарах." },
        { title: "Управляющий караванными путями", salary: 120, minAge: 20, minInt: 60, desc: "Контракты на поставку провизии." },
        { title: "Глава Гильдии Купцов Асуры", salary: 500, minAge: 28, minInt: 140, desc: "Контроль всех торговых потоков страны." }
      ]
    },
    {
      id: "asura_wyvern_knights", name: "Орден Рыцарей Небесных Виверн",
      ranks: [
        { title: "Смотритель королевских гнезд", salary: 40, minAge: 15, minNorth: 30, desc: "Уход за боевыми вивернами." },
        { title: "Небесный всадник патруля", salary: 150, minAge: 19, minSword: 140, desc: "Воздушный дозор границ королевства." },
        { title: "Командор Небесного Крыла", salary: 650, minAge: 27, minSword: 350, desc: "Командование воздушной армадой Асуры." }
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
    },
    {
      id: "ranoa_artificer_guild", name: "Цех Магических Артефакторов",
      ranks: [
        { title: "Подмастерье гранильщика", salary: 40, minAge: 14, minInt: 30, desc: "Шлифовка ядер монстров." },
        { title: "Мастер накопительных колец", salary: 140, minAge: 19, minInt: 75, desc: "Создание амулетов концентрации." },
        { title: "Главный Артефактор Севера", salary: 550, minAge: 27, minInt: 160, desc: "Конструирование легендарных реликвий." }
      ]
    },
    {
      id: "ranoa_alchemist", name: "Гильдия Зельеваров Шарии",
      ranks: [
        { title: "Сборщик морозных трав", salary: 30, minAge: 13, minInt: 20, desc: "Поиск редких корней на ледниках." },
        { title: "Фармацевт Святых снадобий", salary: 110, minAge: 18, minInt: 65, desc: "Варка исцеляющих зелий высокой чистоты." },
        { title: "Магистр Королевской Алхимии", salary: 480, minAge: 26, minInt: 150, desc: "Создание панацеи и эликсиров бессмертия." }
      ]
    },
    {
      id: "ranoa_winter_scout", name: "Ледяной Дозор Границ Севера",
      ranks: [
        { title: "Следопыт снегов", salary: 35, minAge: 14, minNorth: 30, desc: "Патруль троп сквозь бураны." },
        { title: "Охотник на снежных бегемотов", salary: 130, minAge: 19, minSword: 110, desc: "Защита караванов от ледяных тварей." },
        { title: "Капитан Северного Рубежа", salary: 500, minAge: 27, minSword: 320, desc: "Командование гарнизонами ледников." }
      ]
    },
    {
      id: "ranoa_library_archivist", name: "Архив Древних Рун Шарии",
      ranks: [
        { title: "Младший хранитель свитков", salary: 30, minAge: 13, minInt: 30, desc: "Реставрация древних текстов." },
        { title: "Дешифровщик забытых эпох", salary: 120, minAge: 19, minInt: 85, desc: "Перевод хроник Войны Лапласа." },
        { title: "Верховный Архивариус Севера", salary: 460, minAge: 27, minInt: 175, desc: "Хранитель запретных знаний о богах." }
      ]
    },
    {
      id: "ranoa_mercenary_corps", name: "Северный Наемный Корпус",
      ranks: [
        { title: "Наемник-застрельщик", salary: 40, minAge: 14, minSword: 40, desc: "Охрана торговых складов Шарии." },
        { title: "Ветеран морозных битв", salary: 160, minAge: 20, minSword: 160, desc: "Штурм гнезд горных чудовищ." },
        { title: "Генерал Вольных Клинков Севера", salary: 620, minAge: 28, minSword: 380, desc: "Лидер всех наемных армий трех королевств." }
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
    },
    {
      id: "milis_healer_seminary", name: "Госпиталь Исцеления Святого Ранга",
      ranks: [
        { title: "Брат милосердия", salary: 35, minAge: 13, minMagic: 30, desc: "Уход за ранеными паломниками." },
        { title: "Священник-целитель", salary: 130, minAge: 18, minMagic: 110, desc: "Снятие ядов и проклятий высшего ранга." },
        { title: "Верховный Епископ Исцеления", salary: 580, minAge: 28, minMagic: 340, desc: "Магия воскрешения и спасения душ." }
      ]
    },
    {
      id: "milis_choir_scribe", name: "Скрипторий Канонических Текстов",
      ranks: [
        { title: "Переписчик молитвенников", salary: 28, minAge: 14, minInt: 20, desc: "Копирование священных свитков." },
        { title: "Хранитель Догматов Веры", salary: 100, minAge: 20, minInt: 70, desc: "Цензура и надзор за чистотой учения." },
        { title: "Канцлер Священного Синода", salary: 450, minAge: 28, minInt: 160, desc: "Второй человек после Папы Милиса." }
      ]
    },
    {
      id: "milis_caravan_guard", name: "Конвойная Стража Паломников",
      ranks: [
        { title: "Страж тракта у Белого Древа", salary: 35, minAge: 14, minSword: 35, desc: "Защита верующих от диких зверей." },
        { title: "Сотник святого конвоя", salary: 140, minAge: 20, minSword: 130, desc: "Проводка караванов через горные перевалы." },
        { title: "Командующий Путями Паломников", salary: 520, minAge: 27, minSword: 340, desc: "Безопасность всех дорог Святой Земли." }
      ]
    },
    {
      id: "milis_holy_artificer", name: "Мастерская Сакральных Барьеров",
      ranks: [
        { title: "Гравер священных медальонов", salary: 32, minAge: 14, minInt: 25, desc: "Нанесение защитных символов веры." },
        { title: "Кузнец антимагических щитов", salary: 125, minAge: 19, minInt: 75, desc: "Создание снаряжения против темных магов." },
        { title: "Магистр Святых Реликвий", salary: 490, minAge: 27, minInt: 155, desc: "Ковка оружия Божественного Благословения." }
      ]
    },
    {
      id: "milis_inquisition_hunter", name: "Следственный Трибунал Инквизиции",
      ranks: [
        { title: "Осведомитель Трибунала", salary: 40, minAge: 15, minNorth: 35, desc: "Слежка за сектами и контрабандистами." },
        { title: "Следователь по делам ереси", salary: 160, minAge: 21, minInt: 90, desc: "Допросы темных культистов." },
        { title: "Великий Инквизитор Милиса", salary: 680, minAge: 30, minSword: 420, desc: "Глава тайного надзора Священного Государства." }
      ]
    }
  ],
  demon: [
    {
      id: "demon_hunter", name: "Охотничий Цех Пустошей",
      ranks: [
        { title: "Сборщик костей чудовищ", salary: 25, minAge: 12, minSword: 15, desc: "Сдирание чешуи павших тварей." },
        { title: "Загонщик пустынных виверн", salary: 70, minAge: 16, minSword: 60, desc: "Капканы и сети на ядовитых ящеров." },
        { title: "Охотник Черных Руин", salary: 210, minAge: 21, minSword: 160, desc: "Зачистка гнезд древних демонов." },
        { title: "Палач Бесплодных Земель", salary: 620, minAge: 28, minSword: 450, desc: "Легендарный добытчик сердец чудовищ." }
      ]
    },
    {
      id: "demon_blacksmith", name: "Кузница Черного Базальта",
      ranks: [
        { title: "Молотобоец рудной печи", salary: 30, minAge: 13, minNorth: 20, desc: "Плавка метеоритного железа." },
        { title: "Мастер клыкастых клинков", salary: 110, minAge: 18, minSword: 80, desc: "Ковка тяжелых мечей демонического стиля." },
        { title: "Владыка Огненного Горна", salary: 480, minAge: 26, minSword: 280, desc: "Создание несокрушимой брони пустошей." }
      ]
    },
    {
      id: "demon_ruin_scout", name: "Следопыты Развалин Лапласа",
      ranks: [
        { title: "Искатель древних черепков", salary: 30, minAge: 13, minInt: 25, desc: "Раскопки в разрушенных крепостях." },
        { title: "Проводник Гиблых Земель", salary: 130, minAge: 18, minNorth: 90, desc: "Безопасные тропы сквозь ядовитый туман." },
        { title: "Хранитель Тайн Первой Войны", salary: 510, minAge: 27, minInt: 140, desc: "Знаток всех тайников Бога Демонов." }
      ]
    },
    {
      id: "demon_beast_tamer", name: "Укротители Пустынных Тварей",
      ranks: [
        { title: "Погонщик гигантских скорпионов", salary: 35, minAge: 14, minNorth: 30, desc: "Выпас вьючных чудовищ." },
        { title: "Дрессировщик боевых виверн", salary: 140, minAge: 19, minSword: 120, desc: "Подчинение крылатых хищников." },
        { title: "Владыка Зверей Пустошей", salary: 540, minAge: 28, minSword: 350, desc: "Управление стаями древних бегемотов." }
      ]
    }
  ],
  great_forest: [
    {
      id: "forest_ranger", name: "Лесной Дозор Клана Дорудиа",
      ranks: [
        { title: "Дозорный верхних ветвей", salary: 25, minAge: 12, minSword: 20, desc: "Наблюдение за кронами гигантских деревьев." },
        { title: "Следопыт чащи", salary: 70, minAge: 16, minSword: 65, desc: "Охота на болотных монстров сезона дождей." },
        { title: "Хранитель Священного Древа", salary: 220, minAge: 22, minSword: 180, desc: "Защита древних святилищ клана." },
        { title: "Первый Клинок Великого Леса", salary: 650, minAge: 30, minSword: 500, desc: "Лидер всех зверолюдей-воинов." }
      ]
    },
    {
      id: "forest_herbalist", name: "Травники Священных Крон",
      ranks: [
        { title: "Сборщик древесной смолы", salary: 25, minAge: 12, minInt: 20, desc: "Добыча целебного сока великих деревьев." },
        { title: "Знахарь сезона дождей", salary: 95, minAge: 17, minInt: 60, desc: "Лечение тропических лихорадок." },
        { title: "Верховный Шаман Леса", salary: 460, minAge: 26, minMagic: 220, desc: "Общение с духами предков клана." }
      ]
    },
    {
      id: "forest_shrine_guard", name: "Стражи Алтаря Священного Зверя",
      ranks: [
        { title: "Караульный священной поляны", salary: 30, minAge: 13, minSword: 35, desc: "Охрана алтарей от чужаков." },
        { title: "Рыцарь Звериного Тотема", salary: 125, minAge: 19, minSword: 120, desc: "Ритуальные дуэли на когтях и копьях." },
        { title: "Защитник Священного Льва", salary: 520, minAge: 28, minSword: 360, desc: "Личная стража божественного зверя." }
      ]
    },
    {
      id: "forest_river_patrol", name: "Речной Патруль Великих Затонов",
      ranks: [
        { title: "Лодочник верхних порогов", salary: 28, minAge: 13, minNorth: 25, desc: "Сплав по бурным рекам в сезон дождей." },
        { title: "Охотник на болотных змей", salary: 110, minAge: 18, minSword: 90, desc: "Зачистка бродов от гигантских анаконд." },
        { title: "Атаман Лесных Вод", salary: 480, minAge: 27, minSword: 300, desc: "Контроль всех водных путей леса." }
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
    },
    {
      id: "desert_water_seeker", name: "Лозоходцы Глубинных Колодцев",
      ranks: [
        { title: "Копатель песчаных ям", salary: 28, minAge: 13, minNorth: 20, desc: "Поиск влаги под барханами." },
        { title: "Мастер артезианских жил", salary: 110, minAge: 18, minInt: 70, desc: "Бурение скальных колодцев в оазисах." },
        { title: "Владыка Водных Ключей Пустыни", salary: 500, minAge: 27, minInt: 150, desc: "Контроль над источниками жизни континента." }
      ]
    },
    {
      id: "desert_mercenary_corps", name: "Наемный Корпус Золотого Песка",
      ranks: [
        { title: "Охранник стоянки", salary: 35, minAge: 14, minSword: 40, desc: "Ночной дозор лагерей кочевников." },
        { title: "Ветеран песчаных войн", salary: 145, minAge: 20, minSword: 140, desc: "Отражение нападений кочующих чудовищ." },
        { title: "Генерал Барханных Клинков", salary: 600, minAge: 29, minSword: 380, desc: "Непобедимый наемный лидер Бегаритта." }
      ]
    },
    {
      id: "desert_labyrinth_scavengers", name: "Цех Добытчиков Мана-Кристаллов",
      ranks: [
        { title: "Рудокоп верхних ярусов лабиринта", salary: 40, minAge: 15, minNorth: 35, desc: "Спил кристаллов у входов в гробницы." },
        { title: "Проходчик телепортационных залов", salary: 160, minAge: 21, minInt: 80, desc: "Картография аномалий Бегаритта." },
        { title: "Магистр Подземных Сокровищ", salary: 680, minAge: 30, minInt: 170, desc: "Добытчик древнейших реликвий титанов." }
      ]
    }
  ]
};

// 3. Теневое подполье для всех 6 регионов
const UNDERGROUND_JOBS = {
  asura: {
    id: "underground_asura", name: "🗡️ Теневой Синдикат Воров Роа",
    ranks: [
      { title: "Карманник трущоб", salary: 60, minAge: 13, minNorth: 15, risk: 0.15, desc: "Срезание кошельков на ярмарках Роа." },
      { title: "Скупщик краденых реликвий", salary: 160, minAge: 17, minNorth: 45, risk: 0.22, desc: "Сбыт дворянских драгоценностей." },
      { title: "Теневой ликвидатор знати", salary: 450, minAge: 22, minSword: 180, risk: 0.30, desc: "Устранение неугодных аристократов в Арсе." },
      { title: "Глава Гильдии Теней Асуры", salary: 1400, minAge: 28, minSword: 380, risk: 0.35, desc: "Владыка криминального мира столицы." }
    ]
  },
  ranoa: {
    id: "underground_ranoa", name: "🔮 Контрабандисты Запретных Свитков",
    ranks: [
      { title: "Курьер черного рынка", salary: 65, minAge: 13, minNorth: 15, risk: 0.14, desc: "Доставка контрабандных реагентов в общежития." },
      { title: "Сбытчик мана-кристаллов", salary: 170, minAge: 17, minMagic: 60, risk: 0.20, desc: "Нелегальная продажа ядер монстров." },
      { title: "Магический фальшивомонетчик", salary: 480, minAge: 22, minInt: 110, risk: 0.28, desc: "Создание поддельных векселей." },
      { title: "Барон Черной Магии Шарии", salary: 1350, minAge: 28, minMagic: 320, risk: 0.35, desc: "Теневой магистр Севера." }
    ]
  },
  demon: {
    id: "underground_demon", name: "💀 Банда Пустынных Мародеров",
    ranks: [
      { title: "Мародер руин", salary: 50, minAge: 12, minNorth: 15, risk: 0.16, desc: "Разграбление тел павших наемников." },
      { title: "Пустынный налетчик", salary: 140, minAge: 16, minSword: 60, risk: 0.24, desc: "Налеты на одиночные караваны." },
      { title: "Главарь шайки пустошей", salary: 420, minAge: 21, minSword: 190, risk: 0.32, desc: "Контроль над черными перевалами демонов." },
      { title: "Повелитель Черных Караванов", salary: 1200, minAge: 27, minSword: 400, risk: 0.38, desc: "Верховный атаман разбойничьих банд." }
    ]
  },
  great_forest: {
    id: "underground_forest", name: "🌲 Лесные Браконьеры Чащи",
    ranks: [
      { title: "Капканщик редких шкур", salary: 55, minAge: 12, minNorth: 20, risk: 0.15, desc: "Тайный отлов священных зверей леса." },
      { title: "Браконьер запретных святилищ", salary: 150, minAge: 16, minSword: 70, risk: 0.22, desc: "Спил вековых ветвей Великого Древа." },
      { title: "Теневой ловец зверолюдей", salary: 440, minAge: 21, minSword: 200, risk: 0.34, desc: "Похищение на черные рынки невольников." },
      { title: "Хозяин Лесного Подполья", salary: 1300, minAge: 28, minSword: 420, risk: 0.38, desc: "Контроль контрабанды леса." }
    ]
  },
  milis: {
    id: "underground_milis", name: "🩸 Еретический Культ Черного Древа",
    ranks: [
      { title: "Тайный святотатец", salary: 70, minAge: 14, minInt: 20, risk: 0.18, desc: "Кража священных чаш из соборов." },
      { title: "Скупщик демонических реликвий", salary: 190, minAge: 18, minInt: 60, risk: 0.26, desc: "Контрабанда запрещенных артефактов." },
      { title: "Ересиарх Черного Культа", salary: 520, minAge: 23, minMagic: 180, risk: 0.33, desc: "Тайные ритуалы в катакомбах." },
      { title: "Теневой Патриарх Ереси", salary: 1500, minAge: 30, minMagic: 360, risk: 0.40, desc: "Владыка, подкупивший епископов Милиса." }
    ]
  },
  begaritt: {
    id: "underground_begaritt", name: "🏜️ Песчаные Корсары Барханов",
    ranks: [
      { title: "Песчаный вор колодцев", salary: 60, minAge: 13, minNorth: 20, risk: 0.15, desc: "Кража бочек с водой у караванов." },
      { title: "Налетчик на оазисы", salary: 170, minAge: 17, minSword: 75, risk: 0.25, desc: "Захват стоянок с верблюдами." },
      { title: "Хозяин тайного оазиса", salary: 490, minAge: 22, minSword: 210, risk: 0.32, desc: "Убежище для всех беглых каторжников." },
      { title: "Султан Разбойников Бегаритта", salary: 1450, minAge: 29, minSword: 440, risk: 0.39, desc: "Владелец всех теневых путей пустыни." }
    ]
  }
};

const ASURA_POLITICS = {
  factions: [
    { id: "ariel", name: "Принцесса Ариэль Анемой Асура", icon: "👑", desc: "Реформаторы, защита слабых, союз с Сильфи и Люком.", power: 35 },
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

let SEVEN_GREAT_POWERS = [
  { rank: 1, title: "Бог Техники", name: "Неизвестный Владыка", region: "ranoa", cp: 5000000, hp: 500000, maxHp: 500000, isDead: false },
  { rank: 2, title: "Бог Драконов", name: "Орстед", region: "asura", cp: 3000000, hp: 300000, maxHp: 300000, isDead: false },
  { rank: 3, title: "Бог Бойцов", name: "Бадигади (Золотая Броня)", region: "begaritt", cp: 1500000, hp: 180000, maxHp: 180000, isDead: false },
  { rank: 4, title: "Бог Демонов", name: "Лаплас", region: "demon", cp: 800000, hp: 100000, maxHp: 100000, isDead: false },
  { rank: 5, title: "Бог Смерти", name: "Рэндольф Мариан", region: "asura", cp: 450000, hp: 60000, maxHp: 60000, isDead: false },
  { rank: 6, title: "Бог Меча", name: "Гал Фарион", region: "ranoa", cp: 280000, hp: 38000, maxHp: 38000, isDead: false },
  { rank: 7, title: "Бог Севера", name: "Александр (Кальман III)", region: "asura", cp: 180000, hp: 26000, maxHp: 26000, isDead: false }
];

// 4. Цепочка выслеживания Семи Сил
const SEVEN_POWERS_QUESTS = [
  { rank: 7, title: "Поиски Бога Севера Кальмана III", regionKey: "asura", reqCp: 80000, desc: "Расспросить в тавернах столицы Арс о мастере, орудующем мечом в перекате." },
  { rank: 6, title: "Экспедиция на Святую Землю Меча", regionKey: "ranoa", reqCp: 140000, desc: "Подняться на снежные пики додзё Гула Фариона и вызвать Бога Меча." },
  { rank: 5, title: "Поиски Бога Смерти Рэндольфа", regionKey: "asura", reqCp: 240000, desc: "Найти трактир на окраине королевства, где скрывается великий фехтовальщик." },
  { rank: 4, title: "Гробница Бога Демонов Лапласа", regionKey: "demon", reqCp: 450000, desc: "Спуститься в жерло черного разлома пустоши Некросса." },
  { rank: 3, title: "Алтарь Золотой Брони Бога Бойцов", regionKey: "begaritt", reqCp: 850000, desc: "Вызвать Бадигади на поединок в сердце пустыни." },
  { rank: 2, title: "Вызов Богу Драконов Орстеду", regionKey: "asura", reqCp: 1800000, desc: "Встать на пути сильнейшего существа мира в ущелье Красного Дракона." },
  { rank: 1, title: "Врата Бога Техники", regionKey: "ranoa", reqCp: 3200000, desc: "Пробить барьер древнейшей лаборатории Первой Эпохи." }
];

// 5. Эндгейм: Прорыв в Белое Измерение против Хитогами
const HITOGAMI_ENDGAME = {
  id: "hitogami_void_breach",
  title: "🌌 Прорыв в Белое Пространство: Финальная Битва с Хитогами",
  desc: "Сквозь портал Пустоты вы и Орстед вторгаетесь в измерение Бога Людей! На кону судьба всего Шестиликого Мира!",
  reqGen: 6,
  reqCp: 2500000,
  reqFaction: "orsted",
  boss: { name: "Бог Людей (Хитогами)", cp: 4500000, hp: 550000, maxHp: 550000 }
};

const ESTATES = [
  { id: "cottage_buena", name: "🏡 Лачуга с огородом в Буэне", cost: 120, income: 15, hpRegen: 10, desc: "Уютный домик на окраине деревни (+15🪙/год, +10 HP регенерации/год)." },
  { id: "townhouse_roa", name: "🏘️ Каменный особняк в Роа", cost: 600, income: 60, hpRegen: 25, desc: "Крепкий двухэтажный дом знати (+60🪙/год, +25 HP регенерации/год)." },
  { id: "milis_manor", name: "⛪ Торговая усадьба в Милисионе", cost: 2200, income: 200, hpRegen: 50, desc: "Дом у корней Белого Дерева (+200🪙/год, +50 HP регенерации/год)." },
  { id: "sharia_castle", name: "🏰 Замок-резиденция в Шарии (Раноа)", cost: 7000, income: 700, hpRegen: 90, desc: "Легендарный особняк (+700🪙/год, +90 HP регенерации/год, +15 маны детям)." },
  { id: "asura_palace", name: "👑 Королевское поместье в Асуре", cost: 22000, income: 2400, hpRegen: 160, desc: "Дворец среди садов столицы Арс (+2400🪙/год, +160 HP регенерации/год, +30 ко всем стилям детям)." }
];

const CASTLE_UPGRADES = [
  { id: "crypt", name: "🕯️ Фамильный Склеп Предков", cost: 500, desc: "Позволяет медитировать у могил усопших предков раз в 5 лет, получая их благословение." },
  { id: "training_yard", name: "⚔️ Воинский Полигон Меча", cost: 650, desc: "Дети рода с 5 лет пассивно обучаются клинку (+15 к Мечу/год)." },
  { id: "alchemy_lab", name: "🧪 Алхимическая Оранжерея", cost: 450, desc: "Ежегодно производит +2 бесплатных целебных зелья в инвентарь." },
  { id: "grand_vault", name: "🪙 Неприступная Фамильная Казна", cost: 800, desc: "Защищает семейное золото от грабителей и предательства спутников (+5% к доходу караванов)." },
  { id: "trophy_hall", name: "🐉 Зал Трофеев и Чучел Драконов", cost: 1100, desc: "+50 Славы отряда, +3000 БМ авторитета династии." }
];

const CARAVAN_ROUTES = [
  { id: "caravan_local", name: "🛒 Местный тракт провинции Фитоа", cost: 100, reward: 180, risk: 0.10, desc: "Безопасная доставка зерна и тканей (+80🪙 прибыли)." },
  { id: "caravan_ranoa", name: "❄️ Снежный караван в Шарию (Раноа)", cost: 350, reward: 750, risk: 0.22, desc: "Перевозка мифрила сквозь метели (+400🪙 прибыли)." },
  { id: "caravan_milis", name: "⛪ Морской конвой к Святому Милису", cost: 900, reward: 2200, risk: 0.32, desc: "Шелка и драгоценности через океан (+1300🪙 прибыли)." },
  { id: "caravan_begaritt", name: "🏜️ Золотой Песчаный Караван Бегаритта", cost: 2500, reward: 6800, risk: 0.45, desc: "Путь сквозь чудовищ пустыни (+4300🪙 прибыли)!" }
];

const PERUGIUS_TRIALS = [
  { rank: 1, name: "Испытание Первого Духа (Алхор)", reqCp: 18000, rewardText: "Признание рыцарей небес (+150 Знаний, аудиенция открыта)" },
  { rank: 2, name: "Поединок с Золотым Рыцарем Сильфидом", reqCp: 55000, rewardText: "Благословение Небесного Дракона (+15000 БМ, Небесный щит)" },
  { rank: 3, name: "Аудиенция у Короля-Дракона Перугиуса", reqCp: 160000, rewardText: "Драконье Имя Первенцу (+30,000 БМ и фактор Лапласа всем детям рода)" }
];

const GREYRAT_BRANCHES = [
  { id: "boreas", name: "Северная Ветвь: Бореас Грейрат", region: "Роа", leader: "Саурос Бореас Грейрат", desc: "Яростные мечники, свирепый нрав и неприступные крепости." },
  { id: "notos", name: "Южная Ветвь: Нотос Грейрат", region: "Милис/Асура", leader: "Амарант Нотос Грейрат", desc: "Сказочное богатство, мраморные залы и изящная магия воды." },
  { id: "zephyrus", name: "Восточная Ветвь: Зефирос Грейрат", region: "Арс", leader: "Филипп Зефирос Грейрат", desc: "Мастера политического яда, шпионажа и тайных договоров." },
  { id: "euros", name: "Западная Ветвь: Эурос Грейрат", region: "Западные порты", leader: "Гарольд Эурос Грейрат", desc: "Хозяева торгового флота, океанских верфей и сокровищниц." }
];

const FIRST_WAR_TABLETS = [
  { id: "tab_human", name: "Скрижаль Бога Людей", regionKey: "asura", reqLang: "human", desc: "Скрыта в катакомбах королевского дворца Арс." },
  { id: "tab_demon", name: "Обелиск Бога Демонов", regionKey: "demon", reqLang: "demon", desc: "Погребен в песках пустоши Некросса." },
  { id: "tab_dragon", name: "Плита Драконьего Владыки", regionKey: "begaritt", reqLang: "dragon", desc: "Вмонтирована в алтарь Лабиринта Телепортации." },
  { id: "tab_beast", name: "Древесная Стела Священного Зверя", regionKey: "great_forest", reqLang: "beast", desc: "Высечена в сердце Великого Древа Дорудиа." },
  { id: "tab_fighter", name: "Скрижаль Бога Бойцов", regionKey: "ranoa", reqLang: "god_fighter", desc: "Находится в тайной зале Академии Шарии." }
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

const SHOP_ITEMS = [
  { id: "bronze_dagger", type: "weapon", name: "🗡️ Бронзовый охотничий кинжал", cost: 25, cp: 70, desc: "Простое вспомогательное оружие (+70 БМ)." },
  { id: "iron_sword", type: "weapon", name: "⚔️ Железный палаш стражи", cost: 60, cp: 220, desc: "Острое кованое лезвие (+220 БМ)." },
  { id: "oak_staff", type: "weapon", name: "🪄 Посох из ветви Энта", cost: 95, cp: 320, desc: "Проводит потоки стихийной магии (+320 БМ)." },
  { id: "steel_rapier", type: "weapon", name: "🤺 Тонкая асурианская рапира", cost: 180, cp: 650, desc: "Любимое оружие дуэлянтов знати (+650 БМ)." },
  { id: "heavy_claymore", type: "weapon", name: "🪓 Двуручный клеймор севера", cost: 320, cp: 1100, desc: "Раскалывает вражеские щиты надвое (+1100 БМ)." },
  { id: "dragon_blade", type: "weapon", name: "🗡️ Клинок из кости Дракона", cost: 750, cp: 2600, desc: "Режет мифрил как масло (+2600 БМ)." },
  { id: "staff_arcane", type: "weapon", name: "🔮 Посох Магического Океана", cost: 1600, cp: 5500, desc: "Инкрустирован ядром древнего духа (+5500 БМ)." },
  { id: "phoenix_spear", type: "weapon", name: "🔱 Копье Спардов: Алое Пламя", cost: 2800, cp: 8900, desc: "Легендарный трезубец из метеоритной стали (+8900 БМ)." },
  { id: "aqua_heartia", type: "weapon", name: "🌟 Посох Гордости Водного Океана", cost: 4200, cp: 15000, desc: "Божественный артефакт водной стихии (+15000 БМ)." },
  { id: "god_slayer_sword", type: "weapon", name: "⚡ Меч Рассекатель Света (Школа Бога)", cost: 11000, cp: 42000, desc: "Клинок, выкованный для схваток с Богами (+42000 БМ)." },

  { id: "apprentice_robe", type: "armor", name: "🧥 Мантия ученика мага", cost: 20, cp: 60, hp: 10, desc: "Защита от брызг маны (+60 БМ, +10 HP)." },
  { id: "leather_armor", type: "armor", name: "🛡️ Кожаный доспех охотника", cost: 55, cp: 180, hp: 25, desc: "Легкая броня от когтей волков (+180 БМ, +25 HP)." },
  { id: "steel_plate", type: "armor", name: "🛡️ Стальной рыцарский нагрудник", cost: 200, cp: 750, hp: 60, desc: "Надежная броня тяжелой пехоты (+750 БМ, +60 HP)." },
  { id: "mithril_chain", type: "armor", name: "⛓️ Мифриловая кольчужная рубаха", cost: 500, cp: 1800, hp: 110, desc: "Невесомая защита от клинков (+1800 БМ, +110 HP)." },
  { id: "dragon_scale", type: "armor", name: "🐉 Доспех из чешуи Красного Дракона", cost: 2200, cp: 7200, hp: 280, desc: "Абсолютная защита от огня (+7200 БМ, +280 HP)." },
  { id: "royal_aegis", type: "armor", name: "👑 Королевский Эгид Асуры", cost: 6500, cp: 21000, hp: 600, desc: "Золоченый латный доспех высших лордов (+21000 БМ, +600 HP)." },
  { id: "magic_armor", type: "armor", name: "🤖 Магическая Броня «Версия 1»", cost: 18000, cp: 60000, hp: 1200, desc: "Титанический автономный экзоскелет титанов (+60000 БМ, +1200 HP)." },

  { id: "ring_mana", type: "accessory", name: "💍 Кольцо Концентрации Маны", cost: 130, cp: 450, desc: "Ускоряет фокусировку чар (+450 БМ)." },
  { id: "boots_wind", type: "accessory", name: "👢 Сапоги Ветроступа", cost: 420, cp: 1200, desc: "Увеличивают скорость рывка в дуэлях (+1200 БМ)." },
  { id: "laplace_gem", type: "accessory", name: "💎 Самоцвет Демонического Дракона", cost: 1900, cp: 6000, desc: "Древнейший артефакт эпохи войн (+6000 БМ)." },
  { id: "prosthetic_arm", type: "accessory", name: "🦾 Протез из Сплава Зари (как у Рудеуса)", cost: 1600, cp: 4000, desc: "Снимает штраф за потерю руки (+4000 БМ, встроенная картечь)." },
  { id: "heal_potion", type: "potion", name: "🧪 Зелье Исцеления Святого Ранга", cost: 30, heal: 60, desc: "Восстанавливает 60 HP в бою или вне боя." }
];

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

const STORY_ACTIVITIES = [
  {
    id: "story_1", age: 1, name: "📖 Первое пробуждение маны", desc: "Вспомнить прошлую жизнь и ощутить циркуляцию маны в ладонях.",
    action: (p) => { p.intellect += 3; p.maxMana += 12; return "Вы осознали законы этого мира: мана течет по телу подобно крови (+3 к Знаниям, +12 макс. маны)!"; }
  },
  {
    id: "story_3", age: 3, name: "📖 Тайком изучить книжный шкаф отца", desc: "Достать тяжелый иллюстрированный фолиант с верхних полок.",
    action: (p) => { p.intellect += 5; p.magicExp += 10; return "Вы научились читать на Человеческом языке и освоили первые стихийные руны (+5 к Знаниям, +10 к Магии)!"; }
  },
  {
    id: "story_5", age: 5, name: "📖 Первый беззвучный водяной шар во дворе", desc: "Сконцентрировать влагу воздуха без произнесения заклинаний.",
    action: (p) => { p.magicExp += 25; p.maxMana += 25; return "Огромный шар кристальной воды завис над двором! Родители застыли в немом восторге (+25 к Магии, +25 макс. маны)!"; }
  },
  {
    id: "story_7", age: 7, name: "📖 Посвящение в юные воины", desc: "Пройти ритуал первого клинка или посоха под надзором наставника.",
    action: (p) => { p.coins += 40; p.swordGodExp += 15; return "Вам вручили настоящий тренировочный клинок и походный плащ (+40 монет, +15 к Мечу)!"; }
  },
  {
    id: "story_10_calamity", age: 10, name: "⚡ КАТАКЛИЗМ МАНЫ ФИТОА (417 г.)", desc: "Небо раскололось багровым сиянием. Землю накрыла волна телепортации!",
    action: (p) => {
      p.calamityTriggered = true;
      const targetRegions = ["demon", "begaritt", "great_forest", "ranoa"];
      const newReg = targetRegions[Math.floor(Math.random() * targetRegions.length)];
      p.currentRegionKey = newReg;
      p.relations.forEach(r => { if (r.isFamily) r.isLost = true; });
      return `💥 <b>КАТАКЛИЗМ МАНЫ!</b> Вспышка стерла провинцию Фитоа! Вас выбросило в: <b>${REGIONS[newReg].name}</b>! Близкие потеряны!`;
    }
  },
  {
    id: "story_13", age: 13, name: "📖 Скитания по чужому континенту и поиск родных", desc: "Расспрашивать гильдейских информаторов и караванщиков.",
    action: (p) => {
      let found = p.relations.find(r => r.isLost);
      if (found && Math.random() < 0.6) {
        found.isLost = false;
        return `🎉 <b>Счастливая весть!</b> Вы напали на след <b>${found.name}</b> и воссоединились!`;
      }
      p.coins += 25;
      return "Вы обошли десятки таверн. Слухов о семье пока нет, но вы подзаработали на новостях (+25 монет).";
    }
  },
  {
    id: "story_16", age: 16, name: "📖 Судьбоносный раскол: Взор Богов", desc: "Хитогами или Орстед? Ваш выбор предрешит судьбу династии.",
    action: (p) => {
      p.intellect += 10; p.swordGodExp += 20; p.magicExp += 20;
      return "Вы утвердили свою волю в противостоянии богов (+10 Знаний, +20 ко всем стилям)!";
    }
  },
  {
    id: "story_20", age: 20, name: "📖 Совет Королевского Двора Асуры", desc: "Принять участие в распределении дворянских наделов столицы Арс.",
    action: (p) => { p.asuraInfluence += 30; p.coins += 200; return "Ваше слово имело вес на заседании лордов (+30 влияния, +200 монет)!"; }
  },
  {
    id: "story_25", age: 25, name: "📖 Экспедиция в Лабиринт Телепортации Бегаритта", desc: "Спуск в глубины древней гробницы за легендарными кристаллами.",
    action: (p) => {
      p.dungeonProgress["dung_teleport"] = Math.max(p.dungeonProgress["dung_teleport"] || 1, 6);
      p.coins += 300;
      return "Вы нанесли на карту ключевые развилки Лабиринта Телепортации (+300 монет)!";
    }
  },
  {
    id: "story_35", age: 35, name: "📖 Закладка Главной Фамильной Резиденции", desc: "Основание родового архива и зала артефактов для будущих поколений.",
    action: (p) => { p.intellect += 15; p.maxHp += 20; return "Имя вашей семьи занесено в летописи континентов (+15 Знаний, +20 макс. HP)!"; }
  }
];

// 5. Дела со строгой возрастной классификацией
const ACTIVITIES = [
  // Младенчество (0-3)
  { id: "baby_crawl", category: "childhood", name: "👶 Ползать по комнатам и изучать мир", minAge: 0, maxAge: 3, cost: 0, apCost: 1, desc: "Развивает моторику и восприятие окружающего пространства.", action: (p) => { p.intellect += 1; return "Вы ползали по коврам и увлеченно изучали блестящие предметы (+1 к Знаниям)."; } },
  { id: "baby_peekaboo", category: "childhood", name: "🍼 Играть в прятки с матерью", minAge: 0, maxAge: 2, cost: 0, apCost: 1, desc: "Укрепляет связь с родителями и дарит душевный покой.", action: (p) => { p.hp = Math.min(p.maxHp, p.hp + 15); return "Мать смеялась и прижимала вас к груди (+15 HP, тепло родного дома)."; } },
  { id: "listen_parents", category: "childhood", name: "🗣️ Слушать разговоры родителей и сказки", minAge: 1, maxAge: 5, cost: 0, apCost: 1, desc: "Знакомство с речью, этикетом и историей континентов.", action: (p) => { p.intellect += 2; return "Мать читала вам старинные легенды о Шестиликом Мире (+2 к Знаниям)."; } },
  { id: "toddler_mana", category: "magic", name: "🔮 Детская концентрация маны (Золотое Окно)", minAge: 1, maxAge: 9, cost: 0, apCost: 1, desc: "Ежедневное истощение пластичных каналов расширяет сосуд души.", action: (p) => {
      let base = 7;
      let mod = (p.trait.growthMod || 1.0) * (p.raceObj.bonus.manaMod || 1.0);
      let gain = Math.round(base * mod);
      p.maxMana += gain; p.mana = p.maxMana; p.magicExp += 7;
      return `Вы концентрировали шар маны до дрожи в ладонях! Сосуд маны расширился: <b>+${gain} макс. маны</b>!`;
    }
  },

  // Детство (3-6)
  { id: "wooden_stick_play", category: "childhood", name: "🪵 Размахивать палкой во дворе", minAge: 3, maxAge: 6, cost: 0, apCost: 1, desc: "Первые неуклюжие замахи во дворе дома.", action: (p) => { p.swordGodExp += 8; return "Вы азартно сбивали крапиву во дворе деревянной палкой (+8 к стилю Меча)."; } },
  { id: "catch_insects", category: "childhood", name: "🦗 Ловля прыгучих сверчков в траве", minAge: 3, maxAge: 7, cost: 0, apCost: 1, desc: "Тренирует реакцию глаз и ловкость детских пальцев.", action: (p) => { p.northGodExp += 8; return "Вы ловко перехватывали жуков на лету (+8 к стилю Севера)."; } },
  { id: "read_scrolls", category: "life", name: "📜 Изучение древних свитков и летописей", minAge: 4, maxAge: 12, cost: 5, apCost: 1, desc: "Азы языков и хроники Первой Великой Войны.", action: (p) => {
      if (p.coins < 5) return "Не хватает монет на аренду свитков (нужно 5🪙).";
      p.coins -= 5; p.intellect += 7;
      return "Вы погрузились в изучение летописей Войны Лапласа (+7 к Знаниям).";
    }
  },

  // Отрочество и боевая школа (7-11)
  { id: "magic_circle_study", category: "magic", name: "✨ Изучение структуры магических кругов", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Понимание формул магии земли, воды, огня и ветра.", action: (p) => { p.magicExp += 16; p.intellect += 3; return "Вы вычерчивали на пергаменте круги призыва стихий (+16 к Магии, +3 к Знаниям)."; } },
  { id: "sword_practice", category: "combat", name: "🗡️ Стойка Бога Меча: Выпад Света", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Отработка молниеносного первого взмаха.", action: (p) => { p.swordGodExp += 18; return "Клинок со свистом рассекает воздух (+18 к Богу Меча)."; } },
  { id: "water_parry", category: "combat", name: "💧 Стойка Бога Воды: Парирование", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Отражение встречных ударов и непробиваемая защита.", action: (p) => { p.waterGodExp += 18; return "Вы плавным движением гасили встречные выпады (+18 к Богу Воды)."; } },
  { id: "north_tricks", category: "combat", name: "🌪️ Стойка Бога Севера: Уловка", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Броски песка, кувырки и атаки из слепой зоны.", action: (p) => { p.northGodExp += 18; return "Вы освоили внезапный выпад из переката (+18 к Богу Севера)."; } },
  { id: "gather_herbs", category: "life", name: "🌿 Сбор редких трав и целебных кореньев", minAge: 6, maxAge: 100, cost: 0, apCost: 1, desc: "Подработка для пополнения запаса монет.", action: (p) => {
      let earned = Math.floor(Math.random() * 16) + 8;
      p.coins += earned;
      return `Вы наполнили корзину мятой и корнями маны, сдав аптекарю (+${earned} монет).`;
    }
  },

  // Юность и Академия (10-15)
  { id: "school_lesson", category: "school", name: "🎓 Посетить академическую лекцию", minAge: 10, maxAge: 100, cost: 0, apCost: 1, desc: "Продвигает по курсу обучения в зачисленной Академии.", action: (p) => {
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
  { id: "street_sparring", category: "youth", name: "🥊 Уличные дуэли с городскими забияками", minAge: 11, maxAge: 17, cost: 0, apCost: 1, desc: "Закалка характера и практический опыт уличных стычек.", action: (p) => {
      p.swordGodExp += 12; p.northGodExp += 12;
      return "Вы сошлись в азартном поединке на окраине города (+12 к стилям Меча и Севера).";
    }
  },
  { id: "youth_debate", category: "youth", name: "📚 Философские диспуты о природе мира", minAge: 12, maxAge: 25, cost: 0, apCost: 1, desc: "Обсуждение магии, политики и мироустройства.", action: (p) => {
      p.intellect += 8;
      return "Вы блестяще отстояли свою точку зрения в споре о природе маны Лапласа (+8 к Знаниям).";
    }
  },

  // Зрелость и быт (16+)
  {
    id: "tavern_rest", category: "life", name: "🛌 Поселиться в таверну (Полный отдых)", minAge: 6, maxAge: 100, cost: 10, apCost: 1,
    desc: "Снять лучшую комнату, плотно поужинать и выспаться. Полностью восстанавливает HP до 100%!",
    action: (p) => {
      if (p.coins < 10) return "Не хватает монет на комнату в таверне (нужно 10🪙)!";
      p.coins -= 10;
      p.hp = p.maxHp;
      return "Вы поселились в теплой таверне у очага, сытно поужинали мясом и отлично выспались. Здоровье полностью восстановлено!";
    }
  },
  { id: "high_society_ball", category: "life", name: "🎭 Посетить дворянский бал-маскарад", minAge: 16, maxAge: 100, cost: 35, apCost: 1, desc: "Завязать полезные знакомства среди высшей знати.", action: (p) => {
      if (p.coins < 35) return "Не хватает монет на бальный наряд и маску (нужно 35🪙)!";
      p.coins -= 35; p.asuraInfluence += 12;
      return "Вы кружились в вальсе под сводами мраморного зала Арса (+12 к политическому влиянию).";
    }
  },

  // Почтенный возраст и наставничество (45+)
  { id: "write_memoirs", category: "elder", name: "✍️ Написание родовых хроник и мемуаров", minAge: 45, maxAge: 100, cost: 0, apCost: 1, desc: "Оставить мудрость прожитых лет потомкам династии.", action: (p) => {
      p.intellect += 14;
      return "Вы перенесли на пергамент воспоминания о битвах и странствиях (+14 к Знаниям).";
    }
  },
  { id: "mentor_young_swordsmen", category: "elder", name: "🥋 Наставлять молодых учеников во дворе", minAge: 40, maxAge: 100, cost: 0, apCost: 1, desc: "Передача секретов фехтования следующему поколению.", action: (p) => {
      p.squadFame += 20; p.coins += 40;
      return "Молодежь внимала каждому вашему взмаху клинка (+20 к Славе, +40 монет за урок).";
    }
  }
];

// 6. Огромный пул ежегодных событий
const RANDOM_EVENTS = [
  // 1. Вызов на дуэль от амбициозного мечника при росте славы
  {
    id: "fame_challenger_duel", minAge: 14, chance: 0.25, icon: "⚔️",
    title: "Вызов от Искателя Славы!",
    desc: "Странствующий мечник узнал вас по балладам бардов и преградил путь: 'Твое имя гремит по тавернам! Скрести со мной клинок, и я заберу твою славу!'",
    choices: [
      {
        text: "Принять бой и сокрушить наглеца!",
        action: (p) => {
          let myCp = calcCombatPower(p);
          let enemyCp = Math.floor(myCp * (0.6 + Math.random() * 0.5));
          if (myCp > enemyCp) {
            p.swordGodExp += 30; p.squadFame += 25;
            return `Вы парировали выпад и прижали острие к горлу противника! Толпа рукоплещет (+30 к Мечу, +25 к Славе)!`;
          }
          p.hp = Math.max(10, p.hp - 35);
          return "Поединок вышел суровым: наглец задел вам плечо (-35 HP), но вы удержали победу!";
        }
      },
      { text: "Окинуть ледяным взглядом и пройти мимо", action: () => "Вы хладнокровно проигнорировали крикуна." }
    ]
  },

  // 2. Сватовство знати
  {
    id: "noble_matchmaking", minAge: 16, chance: 0.18, icon: "💍",
    title: "Сватовство Дворянского Дома!",
    desc: "К вашему дому прибыла роскошная карета с гербом знатного рода. Лорд предлагает брак и готов передать солидное приданое в казну вашей семьи!",
    choices: [
      {
        text: "Принять брачное предложение (+350🪙, +25 влияния)",
        action: (p) => {
          if (p.spouse) return "Вы уже состоите в браке! Сваты удалились.";
          p.coins += 350; p.asuraInfluence += 25;
          const sName = p.gender === "male" ? "Леди Элеонора де Арс" : "Лорд Годфри де Роа";
          const newSpouse = { id: "spouse_noble", name: sName, gender: p.gender === "male" ? "female" : "male", age: p.age + 1, role: "Дворянский супруг", cp: 1500, relation: 80, status: "Супруг/Супруга", isFamily: false, isDead: false };
          p.spouse = newSpouse; p.relations.push(newSpouse);
          return `Вы заключили дворянский союз с <b>${sName}</b>! Получено приданое: +350🪙 и +25 влияния!`;
        }
      },
      { text: "Вежливо отказать сватам", action: () => "Вы ответили, что ваше сердце принадлежит пути меча и свободы." }
    ]
  },

  // 3. Дуэль за сердце (адаптирована под пол игрока)
  {
    id: "love_rival_duel", minAge: 15, chance: 0.16, icon: "⚔️",
    title: "Поединок Чести за Руку и Сердце!",
    desc: "Знатный рыцарь прилюдно обнажил клинок. Он считает, что достоин быть рядом с вашей половинкой, и требует дуэли чести!",
    choices: [
      {
        text: "Принять вызов на дуэль!",
        action: (p) => {
          if (p.swordGodExp >= 30 || calcCombatPower(p) > 2500) {
            p.swordGodExp += 25; p.asuraInfluence += 10;
            if (p.gender === "female") {
              return "Вы лично преподали наглецу урок фехтования! Он повержен в пыль под аплодисменты толпы (+25 к Мечу)!";
            }
            return "Вы обезоружили соперника молниеносным выпадом! Ваша избранница в восторге от вашей доблести (+25 к Мечу)!";
          }
          p.hp = Math.max(10, p.hp - 30);
          return "Поединок вышел суровым: вы получили ранение (-30 HP), но отстояли честь!";
        }
      },
      { text: "Гордо проигнорировать наглеца", action: () => "Вы сочли ниже своего достоинства марать сталь о базарного хвастуна." }
    ]
  },

  // 4. Киширика (РЕДКИЙ ШАНС 6%)
  {
    id: "canon_kishirika", isRare: true, minAge: 8, chance: 0.06, icon: "👁️",
    title: "Императрица Демонов Киширика Киширису!",
    desc: "В пыли сидит голодная коротышка с закрученными рогами: 'Ху-ха-ха! Накорми Великую Киширику за 50 монет, и я вживлю в твой череп легендарный Демонический Глаз!'",
    choices: [
      {
        text: "Отдать 50 монет за Демонический Глаз",
        action: (p) => {
          if (p.coins < 50) return "У вас нет 50 монет! Киширика обиженно надулась и сбежала.";
          p.coins -= 50;

          const eyeKeys = Object.keys(DEMON_EYES);
          const chosenEyeKey = eyeKeys[Math.floor(Math.random() * eyeKeys.length)];
          const eye = DEMON_EYES[chosenEyeKey];

          p.demonEyes = p.demonEyes || { left: null, right: null };

          if (!p.demonEyes.left) {
            p.demonEyes.left = eye;
            return `👁️ <b>УСПЕХ!</b> Киширика вонзила пальцы и вживила в вашу ЛЕВУЮ глазницу: <b>${eye.name}</b> (${eye.desc})!`;
          } else if (!p.demonEyes.right) {
            p.demonEyes.right = eye;
            return `👁️ <b>УСПЕХ!</b> Киширика вживила в вашу ПРАВУЮ глазницу: <b>${eye.name}</b> (${eye.desc})! Теперь вы двуокий владыка!`;
          } else {
            p.swordGodExp += 35; p.magicExp += 35;
            return "Киширика довольно рыгнула: 'У тебя уже оба глаза демона! Держи прилив чистой маны!' (+35 ко всем стилям).";
          }
        }
      },
      { text: "Пройти мимо", action: () => "Вы побоялись приближаться к странной рогатой девчонке." }
    ]
  },

  // 5. Барды и Слухи
  {
    id: "wandering_bard", minAge: 7, chance: 0.20, icon: "🪕",
    title: "Песнь Странствующего Барда",
    desc: "В шумной таверне бард исполняет баллады о героях континентов, собирая звон монет со слушателей.",
    choices: [
      {
        text: "Угостить барда элем (5🪙) и расспросить о слухах",
        action: (p) => {
          if (p.coins < 5) return "Не хватило монет на кружку эля барду.";
          p.coins -= 5; p.intellect += 6;
          return "Бард поведал вам о тайных ориентирах к каменным скрижалям (+6 к Знаниям).";
        }
      },
      { text: "Просто послушать музыку у очага", action: (p) => { p.hp = Math.min(p.maxHp, p.hp + 10); return "Мелодия лютни успокоила ваше сердце (+10 HP)."; } }
    ]
  },

  // 6. Вор на базаре
  {
    id: "stolen_wallet", minAge: 10, chance: 0.20, icon: "👝",
    title: "Вор на базарной площади!",
    desc: "Карманник срезал кошель у купца и несется прямо на вас!",
    choices: [
      {
        text: "Поставить подножку (Стиль Севера)",
        action: (p) => {
          if (p.northGodExp >= 15 || Math.random() > 0.3) {
            p.coins += 50; p.northGodExp += 10;
            return "Купец щедро отсыпал золота за возврат кошелька (+50 монет).";
          }
          p.hp -= 15;
          return "Вор полоснул ножом и скрылся в толпе (-15 HP).";
        }
      },
      { text: "Испепелить струей маны", action: (p) => { p.magicExp += 15; return "Вор арестован подоспевшей стражей (+15 к Магии)."; } },
      { text: "Отойти в сторону", action: () => "Вы спокойно отошли в сторону." }
    ]
  },

  // 7. Встреча с Орстедом
  {
    id: "canon_orsted", isRare: true, minAge: 16, chance: 0.04, icon: "🐉",
    title: "Встреча: Бог Драконов Орстед!",
    desc: "В узком ущелье вы натыкаетесь на мужчину в белом чешуйчатом плаще. Воздух застыл. Ваше тело сковал первобытный ужас смерти!",
    choices: [
      { text: "В ужасе упасть на колени и опустить взгляд", action: (p) => { p.hp = Math.max(10, p.hp - 15); return "Орстед окинул вас ледяным взглядом и прошел мимо (-15 HP от ужаса)."; } },
      { text: "Спросить дрожащим голосом: 'Ты знаешь Хитогами?'", action: (p) => { p.hp = Math.max(5, p.hp - 75); return "Взгляд Орстеда вспыхнул яростью! Он пробил вам плечо: 'Пешка...'. Вы чудом выжили (-75 HP)!"; } },
      { text: "Обнажить клинок и напасть!", action: (p) => { p.hp = 0; return "Один взмах разорвал скалу позади вас вместе с вашим телом. Мгновенная гибель."; } }
    ]
  }
];

const SYLLABLES = {
  male: ["Вал", "Сед", "Лео", "Клод", "Жан", "Огюст", "Филипп", "Рей", "Люк", "Марк", "Ден", "Эд", "Рудеус", "Пол", "Клифф", "Арси", "Клайв", "Заноба"],
  female: ["Аме", "Селе", "Хиль", "Эле", "Клэр", "Роза", "Диа", "Лиза", "София", "Жанна", "Али", "Сильфи", "Эрис", "Рокси", "Зенит", "Норн", "Айша"],
  suffix: ["рик", "берт", "ион", "ард", "ель", "ис", "дар", "монт", "валь", "ус", "етта", "ин"],
  surnames: ["Грейрат", "де Роа", "де Арс", "Блэквуд", "Фрост", "Клемент", "Дорудиа", "Мигурдия", "Спардия", "Шевалье"]
};
