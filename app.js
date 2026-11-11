// ==========================================
// BIT TENSEI — ОСНОВНОЙ СКРИПТ ИГРЫ (app.js)
// ==========================================

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

// Глобальное состояние
let player = null;
let currentWorldYear = START_YEAR;
let dynastyGeneration = 1;
let currentSelectedNPC = null;
let currentActivityCategory = "all";

// ==========================================
// 1. ВСПОМОГАТЕЛЬНЫЕ РАСЧЕТЫ И РАНГИ
// ==========================================

function rollTrait() {
  const totalWeight = TRAITS.reduce((sum, t) => sum + t.weight, 0);
  let randomNum = Math.random() * totalWeight;
  for (let trait of TRAITS) {
    if (randomNum < trait.weight) return trait;
    randomNum -= trait.weight;
  }
  return TRAITS[0];
}

function calculateRank(exp, ranksList) {
  if (exp >= 1200) return ranksList[6]; // Бог
  if (exp >= 600)  return ranksList[5]; // Император
  if (exp >= 300)  return ranksList[4]; // Королевский
  if (exp >= 120)  return ranksList[3]; // Святой
  if (exp >= 40)   return ranksList[2]; // Рядовой
  if (exp >= 10)   return ranksList[1]; // Новичок
  return ranksList[0];
}

function log(msg) {
  const box = document.getElementById("logs");
  if (!box) return;
  const el = document.createElement("div");
  el.className = "log-entry";
  el.innerHTML = `<span class="log-year">[${player ? player.age : 0} лет | ${currentWorldYear} г.]</span> ${msg}`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  tg?.HapticFeedback?.impactOccurred('light');
}

// ==========================================
// 2. ИНИЦИАЛИЗАЦИЯ И СОЗДАНИЕ ГЕРОЯ
// ==========================================

function initCharacter(name, regionKey, origin, trait, surname = null) {
  const regData = REGIONS[regionKey];
  let baseMana = 20 + (origin.mana || 0) + (trait.mana || 0);
  let familySurname = surname || SURNAMES[regionKey][Math.floor(Math.random() * SURNAMES[regionKey].length)];
  let fullName = name.includes(" ") ? name : `${name} ${familySurname}`;

  player = {
    name: fullName,
    surname: familySurname,
    generation: dynastyGeneration,
    regionKey: regionKey,
    region: regData.name,
    race: regData.race,
    maxAge: regData.maxAge + (trait.maxAgeBonus || 0),
    origin: origin.name,
    trait: trait,
    age: 0,
    hp: 100 + (trait.hp || 0),
    maxHp: 100 + (trait.hp || 0),
    mana: baseMana,
    maxMana: baseMana,
    magicExp: 0,
    swordGodExp: (origin.swordGod || 0) + (trait.swordGod || 0),
    waterGodExp: (origin.waterGod || 0) + (trait.waterGod || 0),
    northGodExp: (origin.northGod || 0) + (trait.northGod || 0),
    intellect: 10 + (origin.int || 0) + (trait.int || 0),
    coins: origin.coins || 0,
    enrolledSchool: null,
    schoolProgress: 0,
    relations: [
      { id: "father", name: "Отец " + familySurname, gender: "male", role: "Глава семьи", relation: 80, status: "Семья", isFamily: true },
      { id: "mother", name: "Мать", gender: "female", role: "Хранительница очага", relation: 95, status: "Семья", isFamily: true }
    ],
    spouse: null,
    children: []
  };

  const logsEl = document.getElementById("logs");
  if (logsEl) logsEl.innerHTML = "";

  log(`🌍 Вы родились в <b>${player.region}</b> (${currentWorldYear} год Календаря Дракона).`);
  log(origin.log);
  log(`✨ Врожденный дар: <b class="tag badge-${trait.rarity}">${trait.name}</b> — ${trait.desc}`);

  renderUI();
  saveGame();
}

function showCreation() {
  populateRegionSelect();
  document.getElementById("creation-overlay").style.display = "flex";
}

function populateRegionSelect() {
  const regSelect = document.getElementById("select-region");
  if (!regSelect) return;
  regSelect.innerHTML = "";
  for (let key in REGIONS) {
    let opt = document.createElement("option");
    opt.value = key;
    opt.innerText = REGIONS[key].name;
    regSelect.appendChild(opt);
  }
  updateOriginSelect();
}

function updateOriginSelect() {
  const regKey = document.getElementById("select-region").value;
  const origSelect = document.getElementById("select-origin");
  if (!origSelect || !REGIONS[regKey]) return;
  origSelect.innerHTML = "";
  REGIONS[regKey].origins.forEach(o => {
    let opt = document.createElement("option");
    opt.value = o.id;
    opt.innerText = o.name;
    origSelect.appendChild(opt);
  });
}

function confirmCreation() {
  const name = document.getElementById("input-name").value.trim() || "Безымянный";
  const regKey = document.getElementById("select-region").value;
  const origId = document.getElementById("select-origin").value;
  const origin = REGIONS[regKey].origins.find(o => o.id === origId);
  const trait = rollTrait();

  initCharacter(name, regKey, origin, trait);
  document.getElementById("creation-overlay").style.display = "none";
}

function randomCreation() {
  const names = ["Рудеус", "Сильфи", "Клифф", "Эрис", "Пол", "Зенит", "Гилен", "Руджерд", "Норн", "Айша", "Люсиен"];
  const randName = names[Math.floor(Math.random() * names.length)];
  const regKeys = Object.keys(REGIONS);
  const randRegKey = regKeys[Math.floor(Math.random() * regKeys.length)];
  const region = REGIONS[randRegKey];
  const randOrigin = region.origins[Math.floor(Math.random() * region.origins.length)];
  const trait = rollTrait();

  initCharacter(randName, randRegKey, randOrigin, trait);
  document.getElementById("creation-overlay").style.display = "none";
}

// ==========================================
// 3. ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК И РЕНДЕР UI
// ==========================================

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.add('active');

  const navIndex = tabId === 'character' ? 0 : tabId === 'activities' ? 1 : tabId === 'schools' ? 2 : 3;
  const navItems = document.querySelectorAll('.nav-item');
  if (navItems[navIndex]) navItems[navIndex].classList.add('active');

  if (tabId === 'relations') renderRelations();
  if (tabId === 'activities') renderActivities();
  if (tabId === 'schools') renderSchools();
  tg?.HapticFeedback?.selectionChanged();
}

function renderUI() {
  if (!player) return;

  document.getElementById("char-name").innerText = player.name;
  document.getElementById("char-gen").innerText = `Поколение ${player.generation}`;
  document.getElementById("char-region").innerText = player.region;
  document.getElementById("world-year").innerText = `${currentWorldYear} г. К.Д.`;
  document.getElementById("age").innerText = `${player.age} лет`;

  const traitEl = document.getElementById("char-trait");
  traitEl.innerText = player.trait.name;
  traitEl.className = `tag badge-${player.trait.rarity}`;

  // Полоска здоровья
  document.getElementById("hp-text").innerText = `${player.hp}/${player.maxHp}`;
  document.getElementById("hp-bar").style.width = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100)) + "%";

  // Полоска маны и статус кристаллизации
  document.getElementById("mana-text").innerText = `${player.mana}/${player.maxMana}`;
  document.getElementById("mana-bar").style.width = Math.min(100, (player.mana / player.maxMana) * 100) + "%";

  const manaStatus = document.getElementById("mana-status");
  if (player.age < 10) {
    manaStatus.innerText = "• Золотой рост 🌱";
    manaStatus.style.color = "var(--green)";
  } else if (player.trait.id === "laplace_factor") {
    manaStatus.innerText = "• Фактор Лапласа ✨";
    manaStatus.style.color = "var(--accent-light)";
  } else {
    manaStatus.innerText = "• Каналы затвердели 🔒";
    manaStatus.style.color = "var(--muted)";
  }

  // Ранги боевых искусств и магии
  document.getElementById("magic").innerText = calculateRank(player.magicExp, MAGIC_RANKS);
  document.getElementById("sword-god").innerText = calculateRank(player.swordGodExp, SWORD_RANKS);
  document.getElementById("water-god").innerText = calculateRank(player.waterGodExp, SWORD_RANKS);
  document.getElementById("north-god").innerText = calculateRank(player.northGodExp, SWORD_RANKS);
  document.getElementById("intellect").innerText = player.intellect;
  document.getElementById("coins").innerText = player.coins;

  // Бейдж учебного заведения
  const schoolCont = document.getElementById("school-badge-container");
  schoolCont.innerHTML = "";
  if (player.enrolledSchool) {
    const sc = SCHOOLS.find(s => s.id === player.enrolledSchool);
    if (sc) {
      schoolCont.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#1e1b4b; border:1px solid #6366f1; padding:6px 10px; border-radius:8px;">
          <span style="font-size:11px; color:#c7d2fe;">🎓 <b>${sc.name}</b> (Курс: ${player.schoolProgress || 1}/4)</span>
          <button style="padding:4px 8px; font-size:10px; background:#4338ca;" onclick="attendSchoolLesson()">Посетить лекцию</button>
        </div>`;
    }
  }
}

function updateUI() {
  renderUI();
  saveGame();
}

// ==========================================
// 4. СИСТЕМА АКТИВНОСТЕЙ И ОБУЧЕНИЯ
// ==========================================

function renderActivities() {
  const container = document.getElementById("activities-container");
  if (!container) return;
  container.innerHTML = "";

  const available = ACTIVITIES.filter(a => player.age >= a.minAge && player.age <= a.maxAge);

  if (available.length === 0) {
    container.innerHTML = `<div style="color:var(--muted); text-align:center; padding:30px;">Нет доступных занятий для возраста ${player.age} лет. Нажмите «Прожить 1 год».</div>`;
    return;
  }

  available.forEach(act => {
    const card = document.createElement("div");
    card.className = "activity-card";
    card.innerHTML = `
      <div class="act-info">
        <span class="act-name">${act.name}</span>
        <span class="act-desc">${act.desc}</span>
        <span class="act-req">Требования: Возраст ${act.minAge}-${act.maxAge} лет ${act.cost > 0 ? `• Цена: ${act.cost}🪙` : '• Бесплатно'}</span>
      </div>
      <button class="act-btn" onclick="performActivity('${act.id}')">Заниматься</button>
    `;
    container.appendChild(card);
  });
}

function performActivity(actId) {
  const act = ACTIVITIES.find(a => a.id === actId);
  if (!act) return;

  if (act.cost && player.coins < act.cost) {
    alert(`Не хватает монет! Нужно ${act.cost}🪙, а у вас ${player.coins}🪙.`);
    return;
  }

  const resultMsg = act.action(player);
  log(resultMsg);
  updateUI();
  switchTab('character');
}

// Активности внутри Академии
function attendSchoolLesson() {
  if (!player.enrolledSchool) return;
  const sc = SCHOOLS.find(s => s.id === player.enrolledSchool);
  if (!sc) return;

  player.schoolProgress = (player.schoolProgress || 1);

  if (player.enrolledSchool === "ranoa_academy") {
    player.magicExp += 25;
    player.intellect += 8;
    log(`🎓 Лекция в <b>Академии Раноа</b>: исследование магических кругов (+25 к Магии, +8 к Знаниям).`);
  } else if (player.enrolledSchool === "asura_academy") {
    player.waterGodExp += 20;
    player.intellect += 10;
    log(`🏰 Занятия в <b>Королевской Академии</b>: фехтование стилем Бога Воды и придворный этикет.`);
  } else if (player.enrolledSchool === "sword_sanctuary") {
    player.swordGodExp += 35;
    player.hp = Math.max(10, player.hp - 10);
    log(`🗡️ Беспощадный спарринг на <b>Святой Земле Меча</b>! Мышцы горят огнем (+35 к Богу Меча, -10 HP).`);
  } else if (player.enrolledSchool === "milis_seminary") {
    player.intellect += 12;
    player.hp = Math.min(player.maxHp, player.hp + 25);
    log(`⛪ Молитва в <b>Семинарии Милиса</b>: освоение детоксикации и барьеров (+25 HP).`);
  }

  if (Math.random() > 0.6) {
    player.schoolProgress++;
    log(`📜 Вы успешно сдали семестровый экзамен (Курс ${player.schoolProgress}/4)!`);
    if (player.schoolProgress >= 4) {
      log(`🏆 <b>ТОРЖЕСТВЕННЫЙ ВЫПУСК!</b> Вы с отличием окончили ${sc.name}! Престиж семьи возрос!`);
      player.coins += 100;
    }
  }

  updateUI();
  switchTab('character');
}

// ==========================================
// 5. ШКОЛЫ И УНИВЕРСИТЕТЫ МИРА
// ==========================================

function renderSchools() {
  const container = document.getElementById("schools-list");
  if (!container) return;
  container.innerHTML = "";

  SCHOOLS.forEach(sch => {
    const isEnrolled = player.enrolledSchool === sch.id;
    const meetsAge = player.age >= sch.minAge;
    const meetsExp = !sch.minSwordExp || (player.swordGodExp >= sch.minSwordExp);

    const card = document.createElement("div");
    card.className = "school-card";
    card.innerHTML = `
      <div class="school-header">
        <span class="school-title">${sch.name}</span>
        <span class="school-cost">${sch.cost} 🪙</span>
      </div>
      <div class="school-desc">${sch.desc}</div>
      <div style="font-size:11px; color:#c084fc; margin-top:2px;">⚡ Польза: ${sch.benefit}</div>
      <div style="font-size:10px; color:var(--muted); margin-top:4px;">
        Требования: Возраст ${sch.minAge}+ ${sch.minSwordExp ? `• Опыт Меча ${sch.minSwordExp}+` : ''} • Локация: ${sch.region}
      </div>
      <button ${isEnrolled || !meetsAge || !meetsExp ? 'disabled' : ''} onclick="enrollSchool('${sch.id}')" style="margin-top:8px; background:${isEnrolled ? '#10b981' : '#312e81'}">
        ${isEnrolled ? '✓ Вы студент этого заведения' : 'Поступить на обучение'}
      </button>
    `;
    container.appendChild(card);
  });
}

function enrollSchool(schoolId) {
  const sch = SCHOOLS.find(s => s.id === schoolId);
  if (!sch) return;

  if (player.coins < sch.cost) {
    alert(`Вам не хватает денег! Обучение стоит ${sch.cost}🪙, а у вас ${player.coins}🪙.`);
    return;
  }

  player.coins -= sch.cost;
  player.enrolledSchool = sch.id;
  player.schoolProgress = 1;
  log(`🏛️ <b>Поступление!</b> Вы зачислены в ряды студентов <b>${sch.name}</b>!`);
  updateUI();
  switchTab('character');
}

// ==========================================
// 6. ХОД ВРЕМЕНИ, СТАРЕНИЕ И СЮЖЕТ
// ==========================================

function ageUp() {
  player.age++;
  currentWorldYear++;

  // Канон маны: до 10 лет растет пластично, после 10 — твердеет
  if (player.age < 10) {
    let natural = Math.floor(player.maxMana * 0.08) + 2;
    player.maxMana += natural;
  } else if (player.trait.id === "laplace_factor") {
    player.maxMana += 18; // Фактор Лапласа игнорирует отвердевание
  } else {
    player.maxMana += 1;
  }
  player.mana = player.maxMana;

  // Старение и здоровье
  if (player.age > (player.maxAge - 15)) {
    let decay = Math.floor(Math.random() * 12) + 6;
    player.hp -= decay;
    log(`Старость дает о себе знать: слабость в теле и седина (-${decay} HP).`);
  }

  // 10 лет: Инцидент перемещения Фитоа (Катастрофа телепортации)
  if (player.age === 10 && player.regionKey === "asura") {
    log(`⚡💥 <b>КАТАСТРОФА ПЕРЕМЕЩЕНИЯ ФИТОА!</b> Ослепительный столп маны пронзил небеса! Вся провинция обратилась в пыль, а вас выбросило через пространственный разлом!`);
    player.hp = Math.max(15, player.hp - 35);
  }

  // 15 лет: Сон с Богом Людей (Хитогами)
  if (player.age === 15) {
    log(`☁️ <b>Белое Пространство...</b> Вам снится человек без лица: <i>"Я Бог Людей, Хитогами... Доверься мне, и твоя жизнь станет проще..."</i>`);
  }

  // Проверка наступления смерти
  if (player.hp <= 0 || player.age >= player.maxAge) {
    handleDeath(player.hp <= 0 ? "Смерть от тяжелых ран и боевого истощения" : "Мирная кончина от глубокой старости");
    return;
  }

  // Встречи с каноничными героями по возрасту
  CANON_NPCS.forEach(c => {
    if (player.age === c.minAge && !player.relations.some(r => r.id === c.id)) {
      if (Math.random() > 0.35) {
        player.relations.push({
          id: c.id,
          name: c.name,
          gender: c.gender,
          race: c.race,
          role: c.role,
          relation: c.relation,
          status: "Друг",
          isCanon: true
        });
        log(`⭐ <b>Судьбоносная встреча!</b> Судьба свела вас с: <b>${c.name}</b> (${c.role})!`);
      }
    }
  });

  const yearNotes = [
    "Год упорных размышлений, тренировок и бытовых хлопот.",
    "Вы помогали местным жителям, слушая слухи о подвигах странствующих авантюристов.",
    "Спокойный год за чтением хроник Шестиликого Мира в тепле очага."
  ];
  log(yearNotes[Math.floor(Math.random() * yearNotes.length)]);

  updateUI();
}

// ==========================================
// 7. СИСТЕМА СМЕРТИ И ПЕРЕДАЧИ ДИНАСТИИ
// ==========================================

function handleDeath(reason) {
  document.getElementById("death-reason").innerText = `${reason} в возрасте ${player.age} лет.`;

  const summaryBox = document.getElementById("death-summary");
  summaryBox.innerHTML = `
    <div style="background:#1c202b; padding:12px; border-radius:10px; font-size:12px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.08);">
      <div>🎖️ Имя героя: <b>${player.name}</b></div>
      <div>📅 Годы жизни: <b>${currentWorldYear - player.age} — ${currentWorldYear} г. К.Д.</b> (${player.age} лет)</div>
      <div>🔮 Запас маны на пике: <b>${player.maxMana}</b></div>
      <div>⚔️ Стиль Бога Меча: <b>${calculateRank(player.swordGodExp, SWORD_RANKS)}</b></div>
      <div>🪙 Оставленное наследство: <b>${player.coins} монет</b></div>
      <div>👶 Выращено наследников: <b>${player.children.length}</b></div>
    </div>
  `;

  const heirsBlock = document.getElementById("heirs-list");
  heirsBlock.innerHTML = "";

  if (player.children && player.children.length > 0) {
    document.getElementById("heir-selection-block").style.display = "block";
    player.children.forEach(child => {
      const hCard = document.createElement("div");
      hCard.className = "heir-card";
      hCard.innerHTML = `
        <div>
          <b style="color:#fff;">${child.name}</b>
          <div style="font-size:11px; color:var(--muted);">${child.gender === 'male' ? 'Сын' : 'Дочь'} • Возраст: ${Math.max(1, player.age - 20)} лет</div>
        </div>
        <button style="background:#10b981; padding:8px 12px; font-size:11px; border:none;" onclick="continueAsHeir('${child.id}')">
          Играть за наследника 👑
        </button>
      `;
      heirsBlock.appendChild(hCard);
    });
  } else {
    document.getElementById("heir-selection-block").style.display = "none";
  }

  document.getElementById("death-overlay").style.display = "flex";
}

function continueAsHeir(childId) {
  const child = player.children.find(c => c.id === childId);
  dynastyGeneration++;

  // Передача наследства: 70% золота, родословная, часть боевого опыта
  const inheritedCoins = Math.floor(player.coins * 0.7);
  const inheritedTrait = (Math.random() > 0.4) ? player.trait : rollTrait();

  const originMock = {
    name: `Династия ${player.surname}`,
    mana: Math.floor(player.maxMana * 0.15),
    swordGod: Math.floor(player.swordGodExp * 0.2),
    waterGod: Math.floor(player.waterGodExp * 0.2),
    northGod: Math.floor(player.northGodExp * 0.2),
    coins: inheritedCoins,
    int: 10,
    log: `Вы продолжили великий род ${player.surname}. Семейные тайны клинка и золотой сундук перешли в ваши руки.`
  };

  document.getElementById("death-overlay").style.display = "none";
  initCharacter(child.name, player.regionKey, originMock, inheritedTrait, player.surname);
}

function startNewDynasty() {
  document.getElementById("death-overlay").style.display = "none";
  dynastyGeneration = 1;
  currentWorldYear = START_YEAR;
  localStorage.removeItem("bit_tensei_save");
  showCreation();
}

function confirmReset() {
  if (confirm("Вы уверены, что хотите завершить текущую жизнь и переродиться?")) {
    startNewDynasty();
  }
}

// ==========================================
// 8. ОТНОШЕНИЯ, БРАК И РОЖДЕНИЕ ДЕТЕЙ
// ==========================================

function renderRelations() {
  const container = document.getElementById("relations-list");
  if (!container) return;
  container.innerHTML = "";
  if (!player || !player.relations) return;

  player.relations.forEach(npc => {
    let statusClass = "status-friend";
    if (npc.relation < 30) statusClass = "status-enemy";
    else if (npc.status === "Супруг/Супруга") statusClass = "status-married";
    else if (npc.status === "Пара") statusClass = "status-love";

    const card = document.createElement("div");
    card.className = "relation-card";
    card.onclick = () => openNPCModal(npc);
    card.innerHTML = `
      <div class="rel-header">
        <div>
          <div class="rel-name">
            ${npc.name}
            ${npc.isCanon ? '<span class="badge-canon">Канон ⭐</span>' : ''}
            ${npc.isChild ? '<span style="color:#fbbf24; font-size:11px;">(Наследник 👶)</span>' : ''}
          </div>
          <div class="rel-role">${npc.role || npc.race} • <span class="${statusClass}">${npc.status}</span></div>
        </div>
        <div style="font-size:13px; font-weight:700;">${npc.relation}%</div>
      </div>
      <div class="bar-bg">
        <div class="bar-fill bar-relation" style="width: ${Math.max(0, Math.min(100, npc.relation))}%; background: ${npc.relation < 30 ? 'var(--hp)' : 'var(--green)'};"></div>
      </div>
    `;
    container.appendChild(card);
  });
}

function openNPCModal(npc) {
  currentSelectedNPC = npc;
  document.getElementById("modal-npc-name").innerText = npc.name;
  document.getElementById("modal-npc-sub").innerText = `${npc.gender === 'male' ? 'Мужчина' : 'Женщина'} • ${npc.role || npc.race}`;
  document.getElementById("modal-npc-status").innerText = npc.status;
  document.getElementById("modal-npc-rel").innerText = `${npc.relation}%`;

  const btnContainer = document.getElementById("modal-npc-buttons");
  btnContainer.innerHTML = "";

  btnContainer.innerHTML += `<button onclick="actionTalk()">💬 Поговорить</button>`;
  btnContainer.innerHTML += `<button onclick="actionGift()">🎁 Подарок (15🪙)</button>`;
  btnContainer.innerHTML += `<button class="action-danger" onclick="actionInsult()">⚔️ Оскорбить / Дуэль</button>`;

  if (!npc.isFamily && !npc.isChild) {
    if (player.age >= 14 && npc.status !== "Пара" && npc.status !== "Супруг/Супруга") {
      btnContainer.innerHTML += `<button class="action-love" onclick="actionConfess()">❤️ Признание в чувствах</button>`;
    }
    if (player.age >= 16 && npc.status === "Пара" && !player.spouse) {
      btnContainer.innerHTML += `<button class="action-married" onclick="actionMarry()">💍 Сделать предложение</button>`;
    }
  }

  if (npc.status === "Супруг/Супруга" && player.age >= 16) {
    btnContainer.innerHTML += `<button class="action-married" onclick="actionHaveChild()">👶 Зачать ребенка (Наследника)</button>`;
  }

  document.getElementById("npc-modal").style.display = "flex";
}

function closeNPCModal() {
  document.getElementById("npc-modal").style.display = "none";
  currentSelectedNPC = null;
}

function meetStranger() {
  const newNpc = generateRandomNPC(player.regionKey);
  player.relations.push(newNpc);
  log(`На улицах вы повстречали незнакомца: <b>${newNpc.name}</b> (${newNpc.role}).`);
  renderRelations();
  updateUI();
}

function actionTalk() {
  const npc = currentSelectedNPC;
  if (!npc) return;
  npc.relation = Math.min(100, npc.relation + 6);
  if (npc.relation >= 60 && npc.status === "Знакомый") npc.status = "Друг";
  log(`Вы душевно побеседовали с <b>${npc.name}</b> (+6% к отношениям).`);
  closeNPCModal(); updateUI(); switchTab('character');
}

function actionGift() {
  const npc = currentSelectedNPC;
  if (!npc) return;
  if (player.coins < 15) { alert("Недостаточно монет для подарка (нужно 15🪙)!"); return; }
  player.coins -= 15;
  npc.relation = Math.min(100, npc.relation + 18);
  log(`Вы подарили изящный подарок для <b>${npc.name}</b> (+18%)!`);
  closeNPCModal(); updateUI(); switchTab('character');
}

function actionInsult() {
  const npc = currentSelectedNPC;
  if (!npc) return;
  npc.relation = Math.max(0, npc.relation - 30);
  if (npc.relation <= 25) npc.status = "Заклятый враг";
  player.swordGodExp += 10;
  log(`Ссора с <b>${npc.name}</b> переросла в дуэль! Вы обменялись ударами.`);
  closeNPCModal(); updateUI(); switchTab('character');
}

function actionConfess() {
  const npc = currentSelectedNPC;
  if (!npc) return;
  if (npc.relation >= 75) {
    npc.status = "Пара";
    log(`💖 <b>${npc.name}</b> опускает взгляд и отвечает взаимностью! Вы теперь пара!`);
  } else {
    npc.relation = Math.max(0, npc.relation - 10);
    log(`💔 <b>${npc.name}</b>: "Ты хороший друг, но давай не будем торопиться..."`);
  }
  closeNPCModal(); updateUI(); switchTab('character');
}

function actionMarry() {
  const npc = currentSelectedNPC;
  if (!npc) return;
  if (npc.relation >= 88) {
    npc.status = "Супруг/Супруга";
    player.spouse = npc;
    log(`💍 Колокола звенят в храме! Вы и <b>${npc.name}</b> официально вступили в брак!`);
  } else {
    log(`${npc.name} считает, что нужно еще лучше укрепить взаимное доверие.`);
  }
  closeNPCModal(); updateUI(); switchTab('character');
}

function actionHaveChild() {
  const npc = currentSelectedNPC;
  if (!npc) return;
  const childGender = Math.random() > 0.5 ? "male" : "female";
  const childNames = childGender === "male" ? ["Зик", "Арси", "Люсиен", "Лео", "Клайв"] : ["Люси", "Лара", "Крис", "Эмили", "Сильва"];
  const childName = childNames[Math.floor(Math.random() * childNames.length)];

  const child = {
    id: "child_" + Date.now(),
    name: `${childName} ${player.surname}`,
    gender: childGender,
    role: "Наследник рода",
    relation: 100,
    status: "Семья",
    isFamily: true,
    isChild: true
  };

  player.children.push(child);
  player.relations.push(child);
  log(`🎉 В семье родился продолжатель рода — <b>${child.name}</b>!`);
  closeNPCModal(); updateUI(); switchTab('character');
}

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
    relation: Math.floor(Math.random() * 30) + 30,
    status: "Знакомый",
    isCanon: false
  };
}

// ==========================================
// 9. СОХРАНЕНИЕ И ЗАГРУЗКА
// ==========================================

function saveGame() {
  if (!player) return;
  const saveData = {
    player: player,
    dynastyGeneration: dynastyGeneration,
    currentWorldYear: currentWorldYear,
    logsHtml: document.getElementById("logs").innerHTML
  };
  localStorage.setItem("bit_tensei_save", JSON.stringify(saveData));
}

function loadGame() {
  const raw = localStorage.getItem("bit_tensei_save");
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    if (data && data.player) {
      player = data.player;
      dynastyGeneration = data.dynastyGeneration || 1;
      currentWorldYear = data.currentWorldYear || START_YEAR;
      document.getElementById("creation-overlay").style.display = "none";
      if (data.logsHtml) document.getElementById("logs").innerHTML = data.logsHtml;
      renderUI();
      return true;
    }
  } catch (e) {
    console.error("Save load error:", e);
  }
  return false;
}

// Запуск при загрузке страницы
if (!loadGame()) {
  showCreation();
}
