const START_YEAR = 407;

const SWORD_RANKS = ["Нет", "Новичок", "Рядовой 🥉", "Святой 🌟", "Королевский 👑", "Император ⚡", "Бог ⚔️"];
const MAGIC_RANKS = ["Новичок", "Рядовой 🥉", "Святой 🌟", "Королевский 👑", "Император ⚡", "Бог 🔮"];

const ADVENTURER_RANKS = ["F", "E", "D", "C", "B", "A", "S"];
const ADVENTURER_REQ = { F: 0, E: 30, D: 80, C: 180, B: 380, A: 750, S: 1500 };

// Потолки боевой мощи по поколениям (чтобы нельзя было стать Богом в 1-й жизни)
const GENERATION_CP_CAPS = {
  1: 45000,   // Потолок 1-й жизни: уровень Королевского ранга
  2: 140000,  // 2-е поколение: уровень Императора
  3: 400000,  // 3-е поколение: уровень Бога Меча / Смерти
  4: 1200000, // 4-е поколение: уровень Бога Демонов Лапласа
  5: 9999999  // 5+ поколение: уровень Орстеда и Бога Техники
};

const RACES = {
  human: { id: "human", name: "Человек", maxAge: 75, desc: "Быстро обучаются, универсальны во всем.", bonus: { baseMana: 25, hp: 0, int: 5, coins: 50, manaMod: 1.0 } },
  demon: { id: "demon", name: "Демон", maxAge: 220, desc: "Огромный сосуд маны с рождения, выносливость, долголетие.", bonus: { baseMana: 80, hp: 35, int: 2, coins: 15, manaMod: 1.6 } },
  beast: { id: "beast", name: "Зверочеловек", maxAge: 95, desc: "Острый нюх, дикая реакция в ближнем бою.", bonus: { baseMana: 20, hp: 25, swordGod: 25, coins: 25, manaMod: 0.9 } },
  elf: { id: "elf", name: "Эльф / Полуэльф", maxAge: 350, desc: "Древнейшие хранители знаний и глубокое сродство с маной.", bonus: { baseMana: 60, hp: -10, int: 12, coins: 40, manaMod: 1.4 } },
  speld: { id: "speld", name: "Спард", maxAge: 180, desc: "Алый камень во лбу, грозные копейщики, воины смерти.", bonus: { baseMana: 30, hp: 45, swordGod: 35, northGod: 20, coins: 10, manaMod: 1.0 } },
  dwarf: { id: "dwarf", name: "Гном / Дворф", maxAge: 130, desc: "Мастера кузнечного дела и артефактов.", bonus: { baseMana: 15, hp: 40, northGod: 25, coins: 80, manaMod: 0.8 } }
};

const ESTATES = [
  { id: "cottage_buena", name: "🏡 Лачуга с огородом в Буэне", cost: 120, income: 10, desc: "Уютный домик на окраине деревни (+10🪙/год)." },
  { id: "townhouse_roa", name: "🏘️ Каменный особняк в Роа", cost: 600, income: 45, desc: "Крепкий двухэтажный дом знати (+45🪙/год)." },
  { id: "milis_manor", name: "⛪ Торговая усадьба в Милисионе", cost: 2200, income: 160, desc: "Дом у Белого Дерева с караванной лавкой (+160🪙/год)." },
  { id: "sharia_castle", name: "🏰 Замок-резиденция в Шарии (Раноа)", cost: 7000, income: 550, desc: "Легендарный особняк с залом артефактов (+550🪙/год, +15 маны детям)." },
  { id: "asura_palace", name: "👑 Королевское поместье в Асуре", cost: 22000, income: 1800, desc: "Дворец среди садов столицы Арс (+1800🪙/год, +30 ко всем стилям детям)." }
];

const REGIONS = {
  asura: {
    name: "🏰 Королевство Асура", travelCost: 60, desc: "Сердце мира, цветущие сады и политические интриги.",
    origins: [
      { id: "boreas", name: "Дом Бореас Грейрат", coins: 350, manaBonus: 20, int: 5, swordGod: 15, log: "Вы открыли глаза в неприступной крепости Роа ветви Бореас." },
      { id: "notos", name: "Дом Нотос Грейрат", coins: 300, manaBonus: 25, int: 6, waterGod: 15, log: "Мраморные залы и цветущие сады юга Асуры." },
      { id: "knight_buena", name: "Рыцари деревни Буэна", coins: 60, manaBonus: 10, swordGod: 15, int: 3, log: "Уютный дом у пшеничных полей провинции Фитоа." },
      { id: "slums_ars", name: "Трущобы столицы Арс", coins: 5, manaBonus: 5, northGod: 20, int: 2, log: "Вы выросли среди бродяг и воров столицы." }
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
  { id: "healthy", name: "Стальное здоровье", rarity: "common", weight: 25, hp: 25, manaBonus: 0, growthMod: 1.0, desc: "+25 HP и стойкость к болезням." },
  { id: "curious", name: "Любознательность", rarity: "common", weight: 25, int: 6, manaBonus: 5, growthMod: 1.1, desc: "+6 к Знаниям, книги читаются быстрее." },
  { id: "water_aff", name: "Сродство с Водой 💧", rarity: "rare", weight: 8, manaBonus: 30, waterGod: 15, growthMod: 1.4, desc: "+30 маны, усиленный прирост от водных тренировок." },
  { id: "fire_aff", name: "Сродство с Огнем 🔥", rarity: "rare", weight: 8, manaBonus: 30, swordGod: 15, growthMod: 1.4, desc: "+30 маны, взрывной первый выпад меча." },
  { id: "silent_cast", name: "Беззвучный каст 🔮", rarity: "epic", weight: 6, manaBonus: 60, growthMod: 1.8, desc: "+60 маны, каст без заклинаний силой мысли!" },
  { id: "demon_eye", name: "Глаз Предвидения 👁️", rarity: "legendary", weight: 2, swordGod: 30, waterGod: 30, manaBonus: 40, growthMod: 1.3, desc: "Видение атак врага на секунду раньше." },
  { id: "laplace_factor", name: "Истинный Фактор Лапласа ✨", rarity: "mythic", weight: 1, manaBonus: 220, growthMod: 3.5, desc: "Колоссальный океан маны. Каналы никогда не твердеют!" }
];

const SEVEN_GREAT_POWERS = [
  { rank: 1, title: "Бог Техники", name: "Неизвестный Владыка", cp: 5000000 },
  { rank: 2, title: "Бог Драконов", name: "Орстед", cp: 3000000 },
  { rank: 3, title: "Бог Бойцов", name: "Бадигади (Золотая Броня)", cp: 1500000 },
  { rank: 4, title: "Бог Демонов", name: "Лаплас", cp: 800000 },
  { rank: 5, title: "Бог Смерти", name: "Рэндольф Мариан", cp: 450000 },
  { rank: 6, title: "Бог Меча", name: "Гал Фарион", cp: 280000 },
  { rank: 7, title: "Бог Севера", name: "Александр (Кальман III)", cp: 180000 }
];

const DUNGEONS = [
  { id: "dung_cellar", name: "🕳️ Затопленные Катакомбы Гоблинов", reqRank: "F", maxFloors: 5, cpBase: 250, desc: "Темные тоннели под окраинами. Идеально для новичков." },
  { id: "dung_ruins", name: "🏛️ Руины Павших Рыцарей Меча", reqRank: "D", maxFloors: 8, cpBase: 1200, desc: "Каменные залы с ловушками и ожившими доспехами стражей." },
  { id: "dung_teleport", name: "🌀 Лабиринт Телепортации Бегаритта", reqRank: "B", maxFloors: 12, cpBase: 15000, desc: "Легендарный лабиринт телепортов! Шаг влево может швырнуть на 3 этажа назад." },
  { id: "dung_dragon", name: "🐉 Бездна Драконьего Гребня", reqRank: "S", maxFloors: 15, cpBase: 90000, desc: "В жерле вулкана спят древние виверны и сам Красный Дракон." }
];

const ALL_GUILD_QUESTS = [
  { id: "q_f1", rank: "F", name: "🐀 Зачистка погреба от крыс-мутантов", enemy: "Крыса-людоед", cp: 110, hp: 55, reward: 20, gp: 8 },
  { id: "q_f2", rank: "F", name: "🌿 Сбор белладонны у волчьих нор", enemy: "Дикий волчонок", cp: 140, hp: 65, reward: 25, gp: 10 },
  { id: "q_e1", rank: "E", name: "🐗 Охота на Клыкастых Кабанов", enemy: "Клыкастый Вепрь", cp: 320, hp: 110, reward: 55, gp: 15 },
  { id: "q_e2", rank: "E", name: "🍄 Истребление Плесневых Слизней", enemy: "Кислотный Слизень", cp: 380, hp: 130, reward: 70, gp: 18 },
  { id: "q_d1", rank: "D", name: "🐺 Стая Двуглавых Волков на тракте", enemy: "Вожак Двуглавых", cp: 850, hp: 240, reward: 140, gp: 25 },
  { id: "q_d2", rank: "D", name: "🧌 Набег шайки гоблинов-лучников", enemy: "Гоблин-главарь", cp: 1100, hp: 300, reward: 180, gp: 30 },
  { id: "q_c1", rank: "C", name: "🐍 Гнездо Красных Кобр", enemy: "Красная Кобра", cp: 2600, hp: 580, reward: 380, gp: 45 },
  { id: "q_c2", rank: "C", name: "🧟 Зачистка склепа от мертвецов", enemy: "Рыцарь-скелет", cp: 3200, hp: 700, reward: 480, gp: 50 },
  { id: "q_b1", rank: "B", name: "🗿 Убийство Древнего Каменного Энта", enemy: "Каменный Энт", cp: 8200, hp: 1500, reward: 1100, gp: 80 },
  { id: "q_b2", rank: "B", name: "🦂 Песчаные Скорпионы Бегаритта", enemy: "Императорский Скорпион", cp: 11000, hp: 2100, reward: 1500, gp: 95 },
  { id: "q_a1", rank: "A", name: "🦅 Охота на Ледяную Виверну в пиках", enemy: "Ледяная Виверна", cp: 31000, hp: 4200, reward: 3800, gp: 150 },
  { id: "q_a2", rank: "A", name: "🦍 Снежный Демонический Бегемот", enemy: "Пещерный Бегемот", cp: 42000, hp: 6000, reward: 5200, gp: 180 },
  { id: "q_s1", rank: "S", name: "🐉 Логово Красного Дракона", enemy: "Красный Дракон", cp: 120000, hp: 17000, reward: 17000, gp: 300 },
  { id: "q_s2", rank: "S", name: "💀 Древний Архилич забытой эпохи", enemy: "Архилич Бездны", cp: 180000, hp: 24000, reward: 25000, gp: 450 }
];

const SHOP_ITEMS = [
  { id: "iron_sword", type: "weapon", name: "⚔️ Железный палаш стражи", cost: 60, cp: 200, desc: "Острое лезвие стражников (+200 БМ)." },
  { id: "oak_staff", type: "weapon", name: "🪄 Посох из ветви Энта", cost: 90, cp: 280, desc: "Усиливает проводимость магии (+280 БМ)." },
  { id: "dragon_blade", type: "weapon", name: "🗡️ Клинок из кости Дракона", cost: 650, cp: 2200, desc: "Режет сталь как масло (+2200 БМ)." },
  { id: "aqua_heartia", type: "weapon", name: "🌟 Посох Гордости Водного Океана", cost: 3500, cp: 12000, desc: "Легендарный артефакт Божественного Класса (+12000 БМ)." },

  { id: "leather_armor", type: "armor", name: "🛡️ Кожаный доспех охотника", cost: 50, cp: 150, hp: 20, desc: "Защита от клыков (+150 БМ, +20 HP)." },
  { id: "mithril_chain", type: "armor", name: "⛓️ Мифриловая кольчуга", cost: 400, cp: 1400, hp: 50, desc: "Легкая и прочная (+1400 БМ, +50 HP)." },
  { id: "magic_armor", type: "armor", name: "🤖 Магическая Броня (Прототип)", cost: 15000, cp: 50000, hp: 200, desc: "Автономный костюм титанов (+50000 БМ, +200 HP)." },

  { id: "ring_mana", type: "accessory", name: "💍 Кольцо Концентрации Маны", cost: 120, cp: 400, desc: "+400 БМ к силе заклинаний." },
  { id: "prosthetic_arm", type: "accessory", name: "🦾 Магический протез из сплава зари", cost: 1500, cp: 3500, desc: "Идеально заменяет утраченную конечность (+3500 БМ, встроенная каменная пуля)." },
  { id: "heal_potion", type: "potion", name: "🧪 Зелье Исцеления Святого Ранга", cost: 25, heal: 50, desc: "Восстанавливает 50 HP в бою или вне боя." }
];

const CANON_NPCS = [
  { id: "sylphie", name: "Сильфиетта", gender: "female", race: "Полуэльф", role: "Подруга детства • Маг без слов", cp: 1200, region: "asura", minAge: 4, maxAge: 8, baseChance: 0.14 },
  { id: "roxy", name: "Рокси Мигурдия", gender: "female", race: "Мигурд", role: "Наставница • Маг Святого Ранга", cp: 4500, region: "asura", minAge: 5, maxAge: 12, baseChance: 0.12 },
  { id: "eris", name: "Эрис Бореас Грейрат", gender: "female", race: "Человек", role: "Леди Бореас • Бешеная мечница", cp: 2200, region: "asura", minAge: 7, maxAge: 13, baseChance: 0.12 },
  { id: "ghislaine", name: "Гилен Дедольдия", gender: "female", race: "Зверочеловек", role: "Мечница Ранга Царя Меча", cp: 28000, region: "asura", minAge: 7, maxAge: 15, baseChance: 0.10 },
  { id: "ruijerd", name: "Руджерд Спардия", gender: "male", race: "Спард", role: "Тупик • Воин сотен битв", cp: 35000, region: "demon", minAge: 10, maxAge: 25, baseChance: 0.10 },
  { id: "cliff", name: "Клифф Гриммор", gender: "male", race: "Человек", role: "Гениальный экзорцист Милиса", cp: 3000, region: "milis", minAge: 10, maxAge: 16, baseChance: 0.10 },
  { id: "zanoba", name: "Заноба Широне", gender: "male", race: "Мико", role: "Принц чудовищной силы", cp: 18000, region: "ranoa", minAge: 12, maxAge: 20, baseChance: 0.09 }
];

const SCHOOLS = [
  { id: "ranoa_academy", name: "🎓 Магическая Академия Раноа", regionKey: "ranoa", region: "Раноа (Шария)", minAge: 13, cost: 300, desc: "Главный центр изучения высшей магии. Лекции магов Святого и Королевского рангов." },
  { id: "asura_academy", name: "🏰 Королевская Академия Асуры", regionKey: "asura", region: "Асура (Арс)", minAge: 12, cost: 450, desc: "Элитное заведение высшей знати и королевских рыцарей." },
  { id: "sword_sanctuary", name: "🗡️ Святая Земля Меча (Додзё Гула)", regionKey: "ranoa", region: "Святая Земля Меча", minAge: 10, cost: 150, desc: "Беспощадные тренировки в снежных пиках под началом Бога Меча." },
  { id: "milis_seminary", name: "⛪ Семинария Святого Милиса", regionKey: "milis", region: "Милис (Милисион)", minAge: 11, cost: 200, desc: "Священная магия лечения, детоксикации и барьеры." }
];

const ACTIVITIES = [
  { id: "baby_crawl", category: "childhood", name: "👶 Ползать по комнатам и изучать мир", minAge: 0, maxAge: 3, cost: 0, apCost: 1, desc: "Развивает моторику и восприятие окружающего пространства.", action: (p) => { p.intellect += 1; return "Вы ползали по коврам и увлеченно изучали блестящие предметы (+1 к Знаниям)."; } },
  { id: "listen_parents", category: "childhood", name: "🗣️ Слушать разговоры родителей и сказки", minAge: 1, maxAge: 5, cost: 0, apCost: 1, desc: "Знакомство с речью, этикетом и историей континентов.", action: (p) => { p.intellect += 2; return "Мать читала вам старинные легенды о Шестиликом Мире (+2 к Знаниям)."; } },
  { id: "wooden_stick_play", category: "childhood", name: "🪵 Размахивать деревянной палкой во дворе", minAge: 3, maxAge: 6, cost: 0, apCost: 1, desc: "Первые неуклюжие замахи во дворе дома.", action: (p) => { p.swordGodExp += 8; return "Вы азартно сбивали крапиву во дворе деревянной палкой (+8 к стилю Меча)."; } },

  { id: "toddler_mana", category: "magic", name: "🔮 Детская концентрация маны (Золотое Окно)", minAge: 1, maxAge: 9, cost: 0, apCost: 1, desc: "Ежедневное истощение пластичных каналов расширяет сосуд души.", action: (p) => {
      let base = 6;
      let mod = (p.trait.growthMod || 1.0) * (p.raceObj.bonus.manaMod || 1.0);
      let gain = Math.round(base * mod);
      p.maxMana += gain; p.mana = p.maxMana; p.magicExp += 6;
      return `Вы концентрировали шар маны до дрожи в ладонях! Сосуд маны расширился: <b>+${gain} макс. маны</b>!`;
    }
  },
  { id: "magic_circle_study", category: "magic", name: "✨ Изучение структуры магических кругов", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Понимание формул магии земли, воды, огня и ветра.", action: (p) => { p.magicExp += 14; p.intellect += 2; return "Вы вычерчивали на пергаменте круги призыва стихий (+14 к Магии, +2 к Знаниям)."; } },

  { id: "sword_practice", category: "combat", name: "🗡️ Стойка Бога Меча: Выпад Света", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Отработка молниеносного первого взмаха.", action: (p) => { p.swordGodExp += 15; return "Клинок со свистом рассекает воздух (+15 к Богу Меча)."; } },
  { id: "water_parry", category: "combat", name: "💧 Стойка Бога Воды: Абсолютное Парирование", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Отражение встречных ударов и непробиваемая защита.", action: (p) => { p.waterGodExp += 15; return "Вы плавным круговым движением гасили удары напарника (+15 к Богу Воды)."; } },
  { id: "north_tricks", category: "combat", name: "🌪️ Стойка Бога Севера: Непредсказуемый Выпад", minAge: 7, maxAge: 100, cost: 0, apCost: 1, desc: "Броски песка, кувырки и атаки из слепой зоны.", action: (p) => { p.northGodExp += 15; return "Вы освоили внезапный выпад из переката (+15 к Богу Севера)."; } },

  { id: "school_lesson", category: "school", name: "🎓 Посетить академическую лекцию и семинар", minAge: 10, maxAge: 100, cost: 0, apCost: 1, desc: "Доступно только студентам заведений. Продвигает по курсу обучения.", action: (p) => {
      if (!p.enrolledSchool) return "Вы не зачислены ни в одну Академию! Поступите во вкладке «Мир».";
      p.schoolProgress = (p.schoolProgress || 1);
      p.intellect += 6; p.magicExp += 15;
      if (Math.random() > 0.55) {
        p.schoolProgress++;
        if (p.schoolProgress > 4) {
          p.graduatedSchools.push(p.enrolledSchool);
          p.enrolledSchool = null; p.coins += 150;
          return `🏆 <b>ТОРЖЕСТВЕННЫЙ ВЫПУСК!</b> Вы с отличием окончили обучение! Получен диплом и премия (+150🪙).`;
        }
        return `📜 Вы сдали семестровый зачет! Текущий курс: ${p.schoolProgress}/4.`;
      }
      return "Вы усердно конспектировали лекцию магистра (+15 к Магии, +6 к Знаниям).";
    }
  },

  { id: "gather_herbs", category: "life", name: "🌿 Сбор редких трав и целебных кореньев", minAge: 6, maxAge: 100, cost: 0, apCost: 1, desc: "Несложная подработка для пополнения запаса монет.", action: (p) => {
      let earned = Math.floor(Math.random() * 14) + 6;
      p.coins += earned;
      return `Вы наполнили корзину мятой и корнями маны, сдав травнику (+${earned} монет).`;
    }
  },
  { id: "read_scrolls", category: "life", name: "📜 Изучение древних свитков и летописей", minAge: 5, maxAge: 100, cost: 5, apCost: 1, desc: "Язык Богов, Демонов и хроники Первой Великой Войны.", action: (p) => {
      if (p.coins < 5) return "Не хватает монет на аренду свитков (нужно 5🪙).";
      p.coins -= 5; p.intellect += 6;
      return "Вы погрузились в изучение летописей Войны Лапласа (+6 к Знаниям).";
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
    id: "canon_kishirika", isRare: true, minAge: 8, chance: 0.06, icon: "👁️",
    title: "Императрица Демонов Киширика!",
    desc: "В пыли сидит голодная коротышка с закрученными рогами: 'Ху-ха-ха! Накорми Великую Киширику, и я одарю тебя мощью!'",
    choices: [
      { text: "Отдать провизию и 30 монет", action: (p) => {
          if (p.coins >= 30) {
            p.coins -= 30; p.swordGodExp += 30; p.waterGodExp += 30;
            return "Киширика мигом съела все: 'Получи Демонический Глаз!' Ваши рефлексы удвоились (+30 ко всем стилям)!";
          }
          return "У вас не нашлось монет. Киширика обиделась и убежала.";
        }
      },
      { text: "Пройти мимо", action: () => "Вы проигнорировали странную бродяжку." }
    ]
  },
  {
    id: "stolen_wallet", minAge: 10, chance: 0.4, icon: "👝",
    title: "Вор на базарной площади",
    desc: "Карманник срезал кошель у купца и несется прямо на вас!",
    choices: [
      { text: "Поставить подножку (Ловкость)", action: (p) => {
          if (p.northGodExp >= 15 || Math.random() > 0.4) {
            p.coins += 40; p.northGodExp += 10;
            return "Купец щедро отсыпал золота за возврат кошелька (+40 монет).";
          }
          p.hp -= 15;
          return "Вор полоснул ножом и скрылся в толпе (-15 HP).";
        }
      },
      { text: "Испепелить струей маны", action: (p) => { p.magicExp += 12; return "Вор арестован подоспевшей стражей (+12 к опыту магии)."; } },
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
