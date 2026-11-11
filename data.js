// База данных регионов, талантов и генератор персонажей

const REGIONS = {
  asura: {
    name: "🏰 Королевство Асура (Сердце Мира)",
    desc: "Богатейшая держава: роскошные дворцы, плодородные земли провинции Фиtoa и борьба за власть.",
    origins: [
      { id: "boreas", name: "Дом Бореас Грейрат (Лорды Роа)", coins: 300, mana: 15, int: 5, log: "Вы открыли глаза в неприступной крепости Роа ветви Бореас." },
      { id: "notos", name: "Дом Нотос Грейрат (Южная знать)", coins: 250, mana: 20, int: 6, log: "Вы родились среди садов и мраморных залов юга Асуры." },
      { id: "knight_buena", name: "Пограничные рыцари (Буэна)", coins: 35, mana: 10, sword: 10, int: 3, log: "Уютный дом на окраине деревни Буэна у пшеничных полей." },
      { id: "peasant_asura", name: "Крестьяне провинции Фиtoa", coins: 0, mana: 0, int: 0, log: "Глиняная изба и тяжелый полевой труд с восхода солнца." },
      { id: "slums_ars", name: "Трущобы столицы Арс", coins: 2, mana: 5, sword: 5, int: 1, log: "Вы родились под мостом великой столицы Асуры." }
    ]
  },
  ranoa: {
    name: "❄️ Магические Королевства Севера (Раноа)",
    desc: "Центр мировой науки, гигантской Магической Академии и авантюристов.",
    origins: [
      { id: "academy_prof", name: "Семья Профессора Академии Раноа", coins: 150, mana: 40, int: 15, log: "Вы родились в городе Шария среди магических фолиантов." },
      { id: "magic_guild", name: "Союз Артефакторов", coins: 90, mana: 25, int: 8, log: "Мастерская полна кристаллов маны и магических свитков." },
      { id: "winter_hunter", name: "Северные охотники", coins: 20, mana: 10, sword: 15, int: 2, log: "Ледяной ветер и вечная мерзлота закалили ваше тело." }
    ]
  },
  demon: {
    name: "🌋 Демонический Континент (Пустоши Зла)",
    desc: "Выжженная земля. Здесь выживают сильнейшие, повсюду бродят монстры ранга S.",
    origins: [
      { id: "migurd_village", name: "Деревня долгожителей Мигурд", coins: 10, mana: 40, int: 10, log: "Сапфировые волосы и врожденная способность к телепатии." },
      { id: "speld_clan", name: "Отверженный клан Спардов", coins: 5, mana: 25, sword: 25, int: 1, log: "Изумрудные волосы и алый кристалл на лбу. Вы рождены воином." },
      { id: "wind_port_pirate", name: "Контрабандисты Города Ветров", coins: 70, mana: 15, sword: 15, int: 6, log: "Шум портовых таверн и соленая вода океана." }
    ]
  },
  great_forest: {
    name: "🌲 Великий Лес (Царство Зверолюдей)",
    desc: "Непроходимые древние джунгли и сезон полугодовых тропических ливней.",
    origins: [
      { id: "dorudia_chieftain", name: "Правящая ветвь клана Дорудиа", coins: 30, mana: 20, sword: 20, int: 5, log: "Вы родились с мягкими ушками и сильным хвостом в семье вождя." },
      { id: "forest_scout", name: "Следопыты кроны деревьев", coins: 10, mana: 15, sword: 15, int: 4, log: "Вы научились прыгать по гигантским ветвям на высоте птичьего полета." }
    ]
  },
  milis: {
    name: "⛪ Святая Земля Милис (Царство Чистоты)",
    desc: "Религиозная теократия: рыцари веры и беспощадная Инквизиция.",
    origins: [
      { id: "temple_knight", name: "Орден Рыцарей Храма", coins: 130, mana: 20, sword: 15, int: 5, log: "Белоснежный плащ с гербом Святого Милиса." },
      { id: "milis_merchant", name: "Гильдия торговцев Великого Дерева", coins: 180, mana: 5, int: 8, log: "Дом у корней священного Белого Дерева столицы." }
    ]
  }
};

const TRAITS = [
  { id: "healthy", name: "Крепкое здоровье", rarity: "common", weight: 25, mana: 5, sword: 5, desc: "Быстро затягиваются ссадины и раны." },
  { id: "curious", name: "Любознательность", rarity: "common", weight: 25, int: 5, desc: "Впитываете книги и чужие обычаи как губка." },
  { id: "water_aff", name: "Сродство с Водой 💧", rarity: "rare", weight: 8, mana: 20, desc: "Природное чутье магии течения и пара." },
  { id: "fire_aff", name: "Сродство с Огнем 🔥", rarity: "rare", weight: 8, mana: 20, desc: "Огненные чары требуют меньше сил." },
  { id: "sword_instinct", name: "Инстинкт Мечника 🗡️", rarity: "rare", weight: 7, sword: 20, desc: "Молниеносная реакция первого выпада." },
  { id: "silent_cast", name: "Беззвучный каст 🔮", rarity: "epic", weight: 6, mana: 40, desc: "Колдовство силой мысли без заклинаний вслух." },
  { id: "beast_voice", name: "Голос Зверя 🐺", rarity: "epic", weight: 5, sword: 15, int: 5, desc: "Оглушающий утробный рев зверолюдей." },
  { id: "migurd_blood", name: "Кровь долгожителя 🧬", rarity: "epic", weight: 3, mana: 35, int: 10, desc: "Жизнь в сотни лет, ясный ум до старости." },
  { id: "isekai_memory", name: "Память Земли (Исекай) 🧠", rarity: "legendary", weight: 3, int: 25, mana: 30, desc: "Вы помните законы физики из прошлого мира!" },
  { id: "demon_eye", name: "Глаз Предвидения 👁️", rarity: "legendary", weight: 2, sword: 25, mana: 25, desc: "Видите траектории атак врагов на секунду раньше." },
  { id: "laplace_factor", name: "Истинный Фактор Лапласа ✨", rarity: "mythic", weight: 1, mana: 100, desc: "Колоссальный океан маны уровня Богов." }
];

function rollTrait() {
  const totalWeight = TRAITS.reduce((sum, t) => sum + t.weight, 0);
  let randomNum = Math.random() * totalWeight;
  for (let trait of TRAITS) {
    if (randomNum < trait.weight) return trait;
    randomNum -= trait.weight;
  }
  return TRAITS[0];
}

// ==================== ПРОЦЕДУРНЫЙ ГЕНЕРАТОР ИМЕН И ЛИЦ ====================

const SYLLABLES = {
  human_male: ["Вал", "Сед", "Лео", "Клод", "Жан", "Огюст", "Филипп", "Рей", "Люк", "Марк", "Ден", "Эд"],
  human_female: ["Аме", "Селе", "Хиль", "Эле", "Клэр", "Роза", "Диа", "Лиза", "София", "Жанна", "Али"],
  human_suffix: ["рик", "берт", "ион", "ард", "ель", "ис", "дар", "монт", "валь"],
  
  demon: ["Бади", "Ато", "Хаз", "Крок", "Рудж", "Зал", "Дул", "Вор", "Нок", "Мор"],
  demon_suffix: ["гади", "фе", "ерд", "рис", "кар", "дон", "зар", "тол"],
  
  beast: ["Ли", "Пур", "Ги", "Гар", "Вульф", "Мяу", "Рр", "Та"],
  beast_suffix: ["ния", "сена", "лен", "фа", "ра", "ко", "гри"]
};

const SURNAMES = {
  asura: ["Грейрат", "де Роа", "де Арс", "Фостер", "Шевалье", "Валуа", "Моррель"],
  ranoa: ["Блэквуд", "Фрост", "Винтерс", "фон Раноа", "Кристалл"],
  milis: ["Клемент", "Бенедикт", "де Милисион", "Санкт", "Люцер"],
  demon: ["Пустошный", "из Скал", "Железнорогий", "Кровавый Клык"],
  great_forest: ["Дорудиа", "Охотник Ветвей", "Быстрый Коготь"]
};

const ROLES = [
  "Вольный авантюрист (Ранг D)",
  "Наемник отряда клинков",
  "Ученик местной гильдии магов",
  "Странствующий торговец",
  "Охотник на чудовищ",
  "Младший послушник часовни",
  "Городской стражник",
  "Студент Академии Магии"
];

// Каноничные персонажи оригинала
const CANON_NPCS = [
  { id: "sylphie", name: "Сильфиетта", gender: "female", race: "Полуэльф", role: "Подруга детства • Маг без слов", relation: 70, isCanon: true, minAge: 4 },
  { id: "roxy", name: "Рокси Мигурдия", gender: "female", race: "Мигурд", role: "Наставница • Маг Святого Ранга", relation: 65, isCanon: true, minAge: 5 },
  { id: "eris", name: "Эрис Бореас Грейрат", gender: "female", race: "Человек", role: "Леди Бореас • Бешеная мечница", relation: 40, isCanon: true, minAge: 7 },
  { id: "ghislaine", name: "Гилен Дедольдия", gender: "female", race: "Зверочеловек", role: "Мечница Ранга Царя Меча", relation: 50, isCanon: true, minAge: 7 },
  { id: "ruijerd", name: "Руджерд Спардия", gender: "male", race: "Спард", role: "Тупик • Воин сотен битв", relation: 60, isCanon: true, minAge: 10 },
  { id: "elinalise", name: "Элинализ Драгонроуд", gender: "female", race: "Эльф", role: "Опытная воительница • Авантюрист S-ранга", relation: 50, isCanon: true, minAge: 12 },
  { id: "cliff", name: "Клифф Гриммор", gender: "male", race: "Человек", role: "Гениальный экзорцист Милиса", relation: 45, isCanon: true, minAge: 10 },
  { id: "zanoba", name: "Заноба Широне", gender: "male", race: "Мико", role: "Благословенный принц чудовищной силы", relation: 55, isCanon: true, minAge: 11 }
];

// Генератор случайного персонажа
function generateRandomNPC(regionKey = "asura") {
  const gender = Math.random() > 0.5 ? "male" : "female";
  let firstName = "";
  let race = "Человек";

  if (regionKey === "demon") {
    race = "Демон";
    firstName = SYLLABLES.demon[Math.floor(Math.random() * SYLLABLES.demon.length)] + 
                SYLLABLES.demon_suffix[Math.floor(Math.random() * SYLLABLES.demon_suffix.length)];
  } else if (regionKey === "great_forest") {
    race = "Зверочеловек";
    firstName = SYLLABLES.beast[Math.floor(Math.random() * SYLLABLES.beast.length)] + 
                SYLLABLES.beast_suffix[Math.floor(Math.random() * SYLLABLES.beast_suffix.length)];
  } else {
    const list = gender === "male" ? SYLLABLES.human_male : SYLLABLES.human_female;
    firstName = list[Math.floor(Math.random() * list.length)] + 
                SYLLABLES.human_suffix[Math.floor(Math.random() * SYLLABLES.human_suffix.length)];
  }

  const surnameList = SURNAMES[regionKey] || SURNAMES.asura;
  const surname = surnameList[Math.floor(Math.random() * surnameList.length)];
  const role = ROLES[Math.floor(Math.random() * ROLES.length)];

  return {
    id: "npc_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    name: `${firstName} ${surname}`,
    gender: gender,
    race: race,
    role: role,
    age: Math.floor(Math.random() * 12) + 14,
    relation: Math.floor(Math.random() * 30) + 30, // 30-60 нейтрально-дружелюбно
    status: "Знакомый", // Враг / Знакомый / Друг / Пара / Супруг
    isCanon: false
  };
}
