// ==========================================
// BIT TENSEI — ГЛАВНЫЙ ДВИЖОК ИГРЫ (app.js)
// ==========================================

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

let player = null;
let currentWorldYear = START_YEAR;
let dynastyGeneration = 1;
let currentSelectedNPC = null;
let currentBattle = null;
let currentActivityCategory = "all";

// Лимит очков действий (AP) в зависимости от возраста
function getMaxAP(age) {
  if (age <= 3) return 5;
  if (age <= 9) return 8;
  if (age <= 15) return 10;
  return 12; // 16+ лет
}

// Расчет совокупной Боевой Мощи (Combat Power)
function calcCombatPower(p) {
  if (!p) return 0;
  let cp = 0;
  cp += p.hp * 2;
  cp += p.maxMana * 3;
  cp += p.magicExp * 4;
  cp += p.swordGodExp * 4;
  cp += p.waterGodExp * 4;
  cp += p.northGodExp * 4;
  cp += p.intellect * 5;

  if (p.equipment.weapon) cp += p.equipment.weapon.cp || 0;
  if (p.equipment.armor) cp += p.equipment.armor.cp || 0;
  if (p.equipment.accessory) cp += p.equipment.accessory.cp || 0;

  return Math.floor(cp);
}

function calculateRank(exp, ranksList) {
  if (exp >= 1200) return ranksList[6];
  if (exp >= 600)  return ranksList[5];
  if (exp >= 300)  return ranksList[4];
  if (exp >= 120)  return ranksList[3];
  if (exp >= 40)   return ranksList[2];
  if (exp >= 10)   return ranksList[1];
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

// ------------------------------------------
// 1. СОЗДАНИЕ ПЕРСОНАЖА
// ------------------------------------------

function randomizeNameInputs() {
  const isMale = Math.random() > 0.5;
  const list = isMale ? SYLLABLES.male : SYLLABLES.female;
  const randName = list[Math.floor(Math.random() * list.length)] + (Math.random() > 0.4 ? SYLLABLES.suffix[Math.floor(Math.random() * SYLLABLES.suffix.length)] : "");
  const randSurname = SYLLABLES.surnames[Math.floor(Math.random() * SYLLABLES.surnames.length)];
  
  document.getElementById("input-name").value = randName;
  document.getElementById("input-surname").value = randSurname;
}

function updateRaceInfo() {
  const raceKey = document.getElementById("select-race").value;
  const r = RACES[raceKey];
  document.getElementById("race-desc").innerText = `${r.desc} (Базовый сосуд маны: ${r.bonus.baseMana}, Предел жизни: ~${r.maxAge} лет)`;
}

function showCreation() {
  const raceSelect = document.getElementById("select-race");
  raceSelect.innerHTML = "";
  for (let key in RACES) {
    let opt = document.createElement("option");
    opt.value = key;
    opt.innerText = RACES[key].name;
    raceSelect.appendChild(opt);
  }
  updateRaceInfo();

  const regSelect = document.getElementById("select-region");
  regSelect.innerHTML = "";
  for (let key in REGIONS) {
    let opt = document.createElement("option");
    opt.value = key;
    opt.innerText = REGIONS[key].name;
    regSelect.appendChild(opt);
  }
  updateOriginSelect();

  const traitSelect = document.getElementById("select-trait");
  traitSelect.innerHTML = "";
  TRAITS.forEach(t => {
    let opt = document.createElement("option");
    opt.value = t.id;
    opt.innerText = `${t.name} (${t.desc})`;
    traitSelect.appendChild(opt);
  });

  randomizeNameInputs();
  document.getElementById("creation-overlay").style.display = "flex";
}

function updateOriginSelect() {
  const regKey = document.getElementById("select-region").value;
  const origSelect = document.getElementById("select-origin");
  origSelect.innerHTML = "";
  if (!REGIONS[regKey]) return;
  REGIONS[regKey].origins.forEach(o => {
    let opt = document.createElement("option");
    opt.value = o.id;
    opt.innerText = o.name;
    origSelect.appendChild(opt);
  });
}

function confirmCreation() {
  const fName = document.getElementById("input-name").value.trim() || "Рудеус";
  const sName = document.getElementById("input-surname").value.trim() || "Грейрат";
  const raceKey = document.getElementById("select-race").value;
  const regKey = document.getElementById("select-region").value;
  const origId = document.getElementById("select-origin").value;
  const traitId = document.getElementById("select-trait").value;

  const race = RACES[raceKey];
  const origin = REGIONS[regKey].origins.find(o => o.id === origId);
  const trait = TRAITS.find(t => t.id === traitId);

  initCharacter(fName, sName, race, regKey, origin, trait, 0);
  document.getElementById("creation-overlay").style.display = "none";
}

function randomCreation() {
  randomizeNameInputs();
  const raceKeys = Object.keys(RACES);
  const regKeys = Object.keys(REGIONS);

  const randRace = RACES[raceKeys[Math.floor(Math.random() * raceKeys.length)]];
  const randRegKey = regKeys[Math.floor(Math.random() * regKeys.length)];
  const region = REGIONS[randRegKey];
  const randOrigin = region.origins[Math.floor(Math.random() * region.origins.length)];
  const randTrait = TRAITS[Math.floor(Math.random() * TRAITS.length)];

  const fName = document.getElementById("input-name").value;
  const sName = document.getElementById("input-surname").value;

  initCharacter(fName, sName, randRace, randRegKey, randOrigin, randTrait, 0);
  document.getElementById("creation-overlay").style.display = "none";
}

function initCharacter(fName, sName, race, regionKey, origin, trait, startAge = 0) {
  let baseMana = Math.round((race.bonus.baseMana + (origin.manaBonus || 0) + (trait.manaBonus || 0)) * (race.bonus.manaMod || 1.0));
  let baseHp = 100 + (trait.hp || 0) + (race.bonus.hp || 0);

  // Если персонаж начинает уже в сознательном возрасте (наследник)
  let ageBonusMultiplier = Math.max(1, startAge);
  if (startAge > 5) {
    baseMana += Math.min(250, startAge * 8);
  }

  player = {
    name: `${fName} ${sName}`,
    firstName: fName,
    surname: sName,
    generation: dynastyGeneration,
    race: race.name,
    raceObj: race,
    maxAge: race.maxAge,
    regionKey: regionKey,
    currentRegionKey: regionKey,
    origin: origin.name,
    trait: trait,
    age: startAge,
    ap: getMaxAP(startAge),
    maxAp: getMaxAP(startAge),
    hp: baseHp,
    maxHp: baseHp,
    mana: baseMana,
    maxMana: baseMana,
    magicExp: startAge > 5 ? Math.floor(startAge * 5) : 0,
    swordGodExp: (origin.swordGod || 0) + (trait.swordGod || 0) + (race.bonus.swordGod || 0) + (startAge > 5 ? startAge * 3 : 0),
    waterGodExp: (origin.waterGod || 0) + (trait.waterGod || 0) + (startAge > 5 ? startAge * 3 : 0),
    northGodExp: (origin.northGod || 0) + (trait.northGod || 0) + (race.bonus.northGod || 0) + (startAge > 5 ? startAge * 3 : 0),
    intellect: 10 + (origin.int || 0) + (trait.int || 0) + (race.bonus.int || 0) + (startAge * 2),
    coins: (origin.coins || 0) + (race.bonus.coins || 0),
    enrolledSchool: null,
    schoolProgress: 0,
    graduatedSchools: [],
    pregnancy: null, // Флаг протекающей беременности
    equipment: { weapon: null, armor: null, accessory: null },
    inventory: [],
    potionsCount: 2,
    relations: [
      { id: "father", name: `Отец ${sName}`, gender: "male", role: "Глава дома", relation: 80, status: "Семья", isFamily: true },
      { id: "mother", name: "Мать", gender: "female", role: "Хранительница очага", relation: 95, status: "Семья", isFamily: true }
    ],
    spouse: null,
    children: []
  };

  document.getElementById("logs").innerHTML = "";
  log(`🌍 Вы воплотились как <b>${player.race}</b> в <b>${REGIONS[player.currentRegionKey].name}</b> (${currentWorldYear} г. К.Д.).`);
  log(origin.log);
  log(`✨ Врожденное благословение: <b class="tag badge-${trait.rarity}">${trait.name}</b> — ${trait.desc}`);

  renderUI();
  saveGame();
  showBirthModal();
}

function showBirthModal() {
  const content = document.getElementById("birth-card-content");
  content.innerHTML = `
    <div>👶 Имя: <b>${player.name}</b> (${player.age} лет)</div>
    <div>🧬 Раса: <b>${player.race}</b> (Срок жизни: ~${player.maxAge} лет)</div>
    <div>🏰 Место пребывания: <b>${REGIONS[player.currentRegionKey].name}</b></div>
    <div>📜 Родословная: <b>${player.origin}</b></div>
    <div style="margin-top:6px; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px;">
      <div>🔮 Сосуд маны: <b style="color:var(--mana);">${player.maxMana}</b></div>
      <div>❤️ Здоровье: <b style="color:var(--hp);">${player.hp} HP</b></div>
      <div>⚡ Начальная Боевая Мощь: <b style="color:var(--accent-light);">${calcCombatPower(player)}</b></div>
      <div>✨ Особый дар: <b style="color:var(--gold);">${player.trait.name}</b></div>
    </div>
  `;
  document.getElementById("birth-modal").style.display = "flex";
}

function closeBirthModal() {
  document.getElementById("birth-modal").style.display = "none";
}

// ------------------------------------------
// 2. UI & НАВИГАЦИЯ
// ------------------------------------------

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.add('active');

  const navMap = { character: 0, activities: 1, inventory: 2, guild: 3, relations: 4 };
  const navItems = document.querySelectorAll('.nav-item');
  if (navItems[navMap[tabId]]) navItems[navMap[tabId]].classList.add('active');

  if (tabId === 'activities') renderActivities();
  if (tabId === 'inventory') renderInventoryTab();
  if (tabId === 'guild') renderGuildTab();
  if (tabId === 'relations') { renderTravelTab(); renderSchools(); renderRelations(); }
  tg?.HapticFeedback?.selectionChanged();
}

function setActivityCategory(cat, btnEl) {
  currentActivityCategory = cat;
  document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderActivities();
}

function renderUI() {
  if (!player) return;

  document.getElementById("char-name").innerText = player.name;
  document.getElementById("char-region").innerText = `${player.race} • ${REGIONS[player.currentRegionKey].name}`;
  document.getElementById("world-year").innerText = `${currentWorldYear} г. К.Д.`;
  document.getElementById("age").innerText = `${player.age} лет`;

  const apBadge = document.getElementById("char-ap");
  apBadge.innerText = `⚡ ${player.ap}/${player.maxAp} сил`;
  apBadge.style.background = player.ap === 0 ? "rgba(239, 68, 68, 0.2)" : "#312e81";
  apBadge.style.borderColor = player.ap === 0 ? "var(--hp)" : "#4f46e5";

  const traitEl = document.getElementById("char-trait");
  traitEl.innerText = player.trait.name;
  traitEl.className = `tag badge-${player.trait.rarity}`;

  const cp = calcCombatPower(player);
  document.getElementById("char-cp").innerText = cp.toLocaleString();

  let wRank = "Смертный";
  if (cp >= 1000000) wRank = "Мировое Бедствие 💥";
  else if (cp >= 180000) wRank = "Уровень Семи Сил 🏆";
  else if (cp >= 40000)  wRank = "Герой Ранга S 🌟";
  else if (cp >= 10000)  wRank = "Мастер Святого Ранга 🗡️";
  else if (cp >= 1500)   wRank = "Опытный Авантюрист";
  document.getElementById("char-world-rank").innerText = wRank;

  document.getElementById("hp-text").innerText = `${player.hp}/${player.maxHp}`;
  document.getElementById("hp-bar").style.width = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100)) + "%";

  document.getElementById("mana-text").innerText = `${player.mana}/${player.maxMana}`;
  document.getElementById("mana-bar").style.width = Math.min(100, (player.mana / player.maxMana) * 100) + "%";

  const manaStatus = document.getElementById("mana-status");
  if (player.age < 10) {
    manaStatus.innerText = "• Золотое Окно (Пластичные каналы) 🌱"; 
    manaStatus.style.color = "var(--green)";
  } else if (player.trait.id === "laplace_factor") {
    manaStatus.innerText = "• Фактор Лапласа (Безгранично) ✨"; 
    manaStatus.style.color = "var(--accent-light)";
  } else {
    manaStatus.innerText = "• Каналы затвердели (Предел достигнут) 🔒"; 
    manaStatus.style.color = "var(--muted)";
  }

  document.getElementById("magic").innerText = calculateRank(player.magicExp, MAGIC_RANKS);
  document.getElementById("sword-god").innerText = calculateRank(player.swordGodExp, SWORD_RANKS);
  document.getElementById("water-god").innerText = calculateRank(player.waterGodExp, SWORD_RANKS);
  document.getElementById("north-god").innerText = calculateRank(player.northGodExp, SWORD_RANKS);
  document.getElementById("intellect").innerText = player.intellect;
  document.getElementById("coins").innerText = player.coins;

  // Индикация Академии
  const scBox = document.getElementById("school-badge-container");
  scBox.innerHTML = "";
  if (player.enrolledSchool) {
    const scObj = SCHOOLS.find(s => s.id === player.enrolledSchool);
    if (scObj) {
      scBox.innerHTML = `<span style="font-size:10px; background:#1e1b4b; border:1px solid #6366f1; color:#c7d2fe; padding:2px 6px; border-radius:4px;">🎓 Студент: ${scObj.name} (Курс ${player.schoolProgress || 1}/4)</span>`;
    }
  }

  document.getElementById("slot-weapon").innerText = player.equipment.weapon ? player.equipment.weapon.name : "Кулаки";
  document.getElementById("slot-armor").innerText = player.equipment.armor ? player.equipment.armor.name : "Простая одежда";
  document.getElementById("slot-accessory").innerText = player.equipment.accessory ? player.equipment.accessory.name : "Нет";
}

function updateUI() {
  renderUI();
  saveGame();
}

// ------------------------------------------
// 3. АКТИВНОСТИ И ОЧКИ ДЕЙСТВИЙ
// ------------------------------------------

function renderActivities() {
  const container = document.getElementById("activities-container");
  container.innerHTML = "";

  let list = ACTIVITIES.filter(a => player.age >= a.minAge && player.age <= a.maxAge);
  if (currentActivityCategory !== "all") {
    list = list.filter(a => a.category === currentActivityCategory);
  }

  if (list.length === 0) {
    container.innerHTML = `<div style="color:var(--muted); text-align:center; padding:20px;">Нет доступных дел в этой категории. Переключите вкладку или пропустите год!</div>`;
    return;
  }

  list.forEach(act => {
    const card = document.createElement("div");
    card.className = "activity-card";
    const canDo = player.ap >= act.apCost;
    card.innerHTML = `
      <div class="act-info">
        <span class="act-name">${act.name}</span>
        <span class="act-desc">${act.desc}</span>
        <span class="act-req">Требует: ⚡ ${act.apCost} силы ${act.cost > 0 ? `• Стоимость: ${act.cost}🪙` : ''}</span>
      </div>
      <button class="act-btn" ${canDo ? '' : 'disabled'} onclick="performActivity('${act.id}')">
        ${canDo ? 'Заниматься' : 'Усталость'}
      </button>
    `;
    container.appendChild(card);
  });
}

function performActivity(actId) {
  const act = ACTIVITIES.find(a => a.id === actId);
  if (!act) return;

  if (player.ap < act.apCost) {
    alert("Вы слишком истощены! Нажмите «Прожить 1 год», чтобы отдохнуть и набраться сил.");
    return;
  }

  if (act.cost && player.coins < act.cost) {
    alert(`Недостаточно монет! Требуется ${act.cost}🪙`);
    return;
  }

  player.ap -= act.apCost;
  const resultMsg = act.action(player);
  log(resultMsg);
  updateUI();
  switchTab('character');
}

// ------------------------------------------
// 4. КАРТА МИРА И ГОДОВЫЕ ПУТЕШЕСТВИЯ
// ------------------------------------------

function renderTravelTab() {
  const container = document.getElementById("world-travel-list");
  if (!container) return;
  container.innerHTML = "";

  for (let regKey in REGIONS) {
    const reg = REGIONS[regKey];
    const isHere = player.currentRegionKey === regKey;
    const canTravel = player.age >= 8;

    const card = document.createElement("div");
    card.className = "travel-card";
    card.innerHTML = `
      <div>
        <b style="color:#fff;">${reg.name}</b> ${isHere ? '<span style="color:var(--green); font-size:11px;">(Вы здесь)</span>' : ''}
        <div style="font-size:11px; color:var(--muted);">${reg.desc}</div>
        <div style="font-size:10px; color:var(--gold);">Стоимость: ${reg.travelCost} 🪙 • Время пути: ⏳ 1 год</div>
      </div>
      <button ${isHere || !canTravel ? 'disabled' : ''} onclick="travelToRegion('${regKey}')">
        ${isHere ? 'Здесь' : 'Ехать (1 год)'}
      </button>
    `;
    container.appendChild(card);
  }
}

function travelToRegion(destKey) {
  if (player.age < 8) {
    alert("Вы слишком малы для далеких странствий без родителей (нужно 8+ лет)!");
    return;
  }

  const dest = REGIONS[destKey];
  if (player.coins < dest.travelCost) {
    alert(`Недостаточно монет для найма каравана или корабля (нужно ${dest.travelCost}🪙)!`);
    return;
  }

  if (!confirm(`Отправиться в ${dest.name}? Дорога на караване или корабле займет ровно 1 год вашей жизни!`)) {
    return;
  }

  player.coins -= dest.travelCost;
  player.currentRegionKey = destKey;

  log(`🚢 Вы сели на караван и отправились в долгий путь до <b>${dest.name}</b>. Дорога заняла ровно один год!`);
  
  // Путешествие занимает 1 год жизни!
  ageUp();
  switchTab('character');
}

// ------------------------------------------
// 5. ИНВЕНТАРЬ И МАГАЗИН
// ------------------------------------------

function renderInventoryTab() {
  const invCont = document.getElementById("inventory-list");
  invCont.innerHTML = "";

  if (player.inventory.length === 0 && player.potionsCount === 0) {
    invCont.innerHTML = `<div style="font-size:12px; color:var(--muted); padding:6px;">Рюкзак пуст. Купите вещи на рынке ниже.</div>`;
  } else {
    if (player.potionsCount > 0) {
      const pDiv = document.createElement("div");
      pDiv.className = "shop-item";
      pDiv.innerHTML = `
        <div>
          <b>🧪 Зелье Исцеления</b> (${player.potionsCount} шт.)
          <div style="font-size:11px; color:var(--muted);">Восстанавливает 50 HP в бою или вне боя</div>
        </div>
        <button onclick="usePotionOutOfCombat()">Пить (+50 HP)</button>
      `;
      invCont.appendChild(pDiv);
    }

    player.inventory.forEach((item, idx) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "shop-item";
      itemDiv.innerHTML = `
        <div>
          <b>${item.name}</b> (+${item.cp} БМ)
          <div style="font-size:11px; color:var(--muted);">${item.desc}</div>
        </div>
        <button style="background:#4338ca;" onclick="equipItem(${idx})">Надеть</button>
      `;
      invCont.appendChild(itemDiv);
    });
  }

  const shopCont = document.getElementById("shop-list");
  shopCont.innerHTML = "";
  SHOP_ITEMS.forEach(it => {
    const sDiv = document.createElement("div");
    sDiv.className = "shop-item";
    sDiv.innerHTML = `
      <div>
        <b>${it.name}</b> <span style="color:var(--gold); font-size:11px;">${it.cost} 🪙</span>
        <div style="font-size:11px; color:var(--muted);">${it.desc}</div>
      </div>
      <button onclick="buyShopItem('${it.id}')">Купить</button>
    `;
    shopCont.appendChild(sDiv);
  });
}

function buyShopItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;

  if (player.coins < item.cost) {
    alert("Недостаточно монет для покупки!");
    return;
  }

  player.coins -= item.cost;
  if (item.type === "potion") {
    player.potionsCount = (player.potionsCount || 0) + 1;
    log(`Куплено зелье лечения (+1 шт.).`);
  } else {
    player.inventory.push(item);
    log(`Приобретено снаряжение: <b>${item.name}</b> (+${item.cp} БМ).`);
  }
  updateUI();
  renderInventoryTab();
}

function equipItem(invIndex) {
  const item = player.inventory[invIndex];
  if (!item) return;

  const slot = item.type;
  if (player.equipment[slot]) {
    player.inventory.push(player.equipment[slot]);
  }
  player.equipment[slot] = item;
  player.inventory.splice(invIndex, 1);

  log(`Вы экипировали: <b>${item.name}</b>!`);
  updateUI();
  renderInventoryTab();
}

function unequipSlot(slot) {
  if (!player.equipment[slot]) return;
  player.inventory.push(player.equipment[slot]);
  log(`Вы сняли <b>${player.equipment[slot].name}</b>.`);
  player.equipment[slot] = null;
  updateUI();
  renderInventoryTab();
}

function usePotionOutOfCombat() {
  if (player.potionsCount <= 0) return;
  player.potionsCount--;
  player.hp = Math.min(player.maxHp, player.hp + 50);
  log("Вы выпили целебное зелье (+50 HP).");
  updateUI();
  renderInventoryTab();
}

// ------------------------------------------
// 6. ГИЛЬДИЯ И МОНУМЕНТ СЕМИ СИЛ
// ------------------------------------------

function renderGuildTab() {
  const monCont = document.getElementById("powers-monument-list");
  monCont.innerHTML = "";

  const myCp = calcCombatPower(player);
  let playerRank = -1;

  SEVEN_GREAT_POWERS.forEach(p => {
    if (myCp > p.cp && playerRank === -1) {
      playerRank = p.rank;
    }
  });

  SEVEN_GREAT_POWERS.forEach(pow => {
    const isMe = (playerRank === pow.rank);
    const row = document.createElement("div");
    row.className = `power-row ${isMe ? 'power-player' : ''}`;
    row.innerHTML = `
      <div style="display:flex; align-items:center;">
        <span class="power-rank">#${pow.rank}</span>
        <div>
          <b>${isMe ? player.name + ' (ВЫ!)' : pow.title + ' — ' + pow.name}</b>
          <div style="font-size:10px; color:var(--muted);">Порог мощи: ${pow.cp.toLocaleString()} БМ</div>
        </div>
      </div>
      <span class="badge-mythic">${isMe ? '👑 ВЫ' : 'Непостижимо'}</span>
    `;
    monCont.appendChild(row);
  });

  const qCont = document.getElementById("guild-quests-list");
  qCont.innerHTML = "";
  GUILD_QUESTS.forEach(q => {
    const qDiv = document.createElement("div");
    qDiv.className = "quest-card";
    const canHunt = player.ap >= 2;
    qDiv.innerHTML = `
      <div>
        <span class="tag badge-rare">Ранг ${q.rank}</span>
        <b style="font-size:13px; display:block; margin:2px 0;">${q.name}</b>
        <div style="font-size:11px; color:var(--muted);">Враг: ${q.enemy} • БМ: ${q.cp.toLocaleString()}</div>
        <div style="font-size:11px; color:var(--gold);">Награда: +${q.reward} 🪙 • Тратит: ⚡ 2 силы</div>
      </div>
      <button ${canHunt ? '' : 'disabled'} style="background:#312e81;" onclick="startGuildBattle('${q.id}')">
        ${canHunt ? 'В бой' : 'Нет сил'}
      </button>
    `;
    qCont.appendChild(qDiv);
  });
}

function startGuildBattle(questId) {
  if (player.ap < 2) {
    alert("У вас недостаточно сил для отправки на охоту (нужно ⚡ 2 силы)!");
    return;
  }

  const quest = GUILD_QUESTS.find(q => q.id === questId);
  if (!quest) return;

  player.ap -= 2;

  currentBattle = {
    quest: quest,
    enemyHp: quest.hp,
    enemyMaxHp: quest.hp,
    enemyCp: quest.cp
  };

  document.getElementById("battle-enemy-name").innerText = `${quest.enemy} (Ранг ${quest.rank})`;
  document.getElementById("battle-enemy-cp").innerText = `БМ: ${quest.cp.toLocaleString()}`;
  document.getElementById("battle-enemy-hp-text").innerText = `${quest.hp}/${quest.hp}`;
  document.getElementById("battle-enemy-hp-bar").style.width = "100%";
  document.getElementById("battle-log").innerHTML = `Вы обнажили оружие против <b>${quest.enemy}</b>!`;

  document.getElementById("battle-modal").style.display = "flex";
}

function combatAction(actionType) {
  if (!currentBattle) return;

  const logBox = document.getElementById("battle-log");
  const myCp = calcCombatPower(player);
  const enemyCp = currentBattle.enemyCp;

  if (actionType === "flee") {
    logBox.innerHTML += `<div>🏃 Вы спешно отступили из схватки!</div>`;
    setTimeout(() => { document.getElementById("battle-modal").style.display = "none"; currentBattle = null; }, 600);
    return;
  }

  if (actionType === "potion") {
    if (player.potionsCount > 0) {
      player.potionsCount--;
      player.hp = Math.min(player.maxHp, player.hp + 50);
      logBox.innerHTML += `<div style="color:var(--green)">🧪 Вы выпили зелье (+50 HP)!</div>`;
      updateUI();
    } else {
      logBox.innerHTML += `<div style="color:var(--hp)">У вас нет зелий в рюкзаке!</div>`;
      return;
    }
  }

  let myDamage = 0;
  if (actionType === "sword") {
    let power = Math.max(10, player.swordGodExp + player.waterGodExp + player.northGodExp);
    myDamage = Math.floor(power * (myCp / (enemyCp + 100)) * 2) + Math.floor(Math.random() * 20) + 15;
    logBox.innerHTML += `<div>⚔️ Вы нанесли удар клинком: <b>-${myDamage} HP</b>!</div>`;
  } else if (actionType === "magic") {
    if (player.mana < 10) {
      logBox.innerHTML += `<div style="color:var(--muted)">Мана иссякла! Слабый толчок.</div>`;
      myDamage = 5;
    } else {
      player.mana -= 10;
      myDamage = Math.floor(player.magicExp * (myCp / (enemyCp + 100)) * 2.5) + Math.floor(Math.random() * 30) + 20;
      logBox.innerHTML += `<div style="color:var(--mana)">🔮 Каст заклинания: <b>-${myDamage} HP</b>!</div>`;
    }
  }

  currentBattle.enemyHp -= myDamage;

  if (currentBattle.enemyHp <= 0) {
    logBox.innerHTML += `<div style="color:var(--gold); font-weight:700;">🏆 ПОБЕДА! Враг повержен!</div>`;
    player.coins += currentBattle.quest.reward;
    player.swordGodExp += 10;
    player.magicExp += 10;
    log(`Заказ Гильдии (${currentBattle.quest.name}) выполнен! Награда: +${currentBattle.quest.reward} 🪙.`);

    setTimeout(() => {
      document.getElementById("battle-modal").style.display = "none";
      currentBattle = null;
      updateUI();
      renderGuildTab();
    }, 1000);
    return;
  }

  let enemyDamage = Math.floor(enemyCp / (myCp + 50) * 18) + Math.floor(Math.random() * 12) + 6;
  player.hp -= enemyDamage;
  logBox.innerHTML += `<div style="color:var(--hp)">Враг нанес ответный удар: <b>-${enemyDamage} HP</b>!</div>`;
  logBox.scrollTop = logBox.scrollHeight;

  document.getElementById("battle-enemy-hp-text").innerText = `${Math.max(0, currentBattle.enemyHp)}/${currentBattle.enemyMaxHp}`;
  document.getElementById("battle-enemy-hp-bar").style.width = Math.max(0, (currentBattle.enemyHp / currentBattle.enemyMaxHp) * 100) + "%";
  updateUI();

  if (player.hp <= 0) {
    document.getElementById("battle-modal").style.display = "none";
    currentBattle = null;
    handleDeath("Погиб в схватке с чудовищем на заказе Гильдии.");
  }
}

// ------------------------------------------
// 7. СЛУЧАЙНЫЕ СОБЫТИЯ С ВЫБОРОМ
// ------------------------------------------

function triggerRandomEvent(eventObj) {
  document.getElementById("event-icon").innerText = eventObj.icon || "⚡";
  document.getElementById("event-title").innerText = eventObj.title;
  document.getElementById("event-desc").innerText = eventObj.desc;

  const cBox = document.getElementById("event-choices");
  cBox.innerHTML = "";

  eventObj.choices.forEach(ch => {
    const btn = document.createElement("button");
    btn.className = "event-choice-btn";
    btn.innerText = ch.text;
    btn.onclick = () => {
      const outcome = ch.action(player);
      document.getElementById("event-modal").style.display = "none";
      log(`<b>[Выбор]</b> ${outcome}`);
      updateUI();
      if (player.hp <= 0) {
        handleDeath("Пал жертвой роковых обстоятельств года.");
      }
    };
    cBox.appendChild(btn);
  });

  document.getElementById("event-modal").style.display = "flex";
}

// ------------------------------------------
// 8. ХОД ВРЕМЕНИ И СТАРЕНИЕ
// ------------------------------------------

function ageUp() {
  player.age++;
  currentWorldYear++;

  // Восстановление очков действий на новый год
  player.maxAp = getMaxAP(player.age);
  player.ap = player.maxAp;

  // Восстановление маны до текущего объема сосуда
  player.mana = player.maxMana;

  // 1. Проверка беременности: если был зачат ребенок, он рождается через год!
  if (player.pregnancy) {
    const isMale = Math.random() > 0.5;
    const list = isMale ? SYLLABLES.male : SYLLABLES.female;
    const childName = list[Math.floor(Math.random() * list.length)];

    const child = {
      id: "child_" + Date.now(),
      name: `${childName} ${player.surname}`,
      gender: isMale ? "male" : "female",
      birthYear: currentWorldYear, // Год рождения для фиксации возраста
      role: "Наследник рода",
      relation: 100,
      status: "Семья",
      isFamily: true,
      isChild: true
    };

    player.children.push(child);
    player.relations.push(child);
    log(`🎉 <b>Пополнение в семье!</b> Спустя год ожидания у вас и ${player.pregnancy.partnerName} родился ребенок — <b>${child.name}</b> (${child.gender === 'male' ? 'Сын' : 'Дочь'})!`);
    player.pregnancy = null;
  }

  // 2. Старение
  if (player.age > (player.maxAge - 15)) {
    let decay = Math.floor(Math.random() * 12) + 6;
    player.hp -= decay;
    log(`Старость берет свое: ломота в костях (-${decay} HP).`);
  }

  // 3. Проверка смерти
  if (player.hp <= 0 || player.age >= player.maxAge) {
    handleDeath(player.hp <= 0 ? "Смерть от ран и истощения сил" : "Мирная кончина от глубокой старости");
    return;
  }

  // 4. Предложение поступить в школу при наступлении возраста
  if (!player.enrolledSchool) {
    for (let sch of SCHOOLS) {
      if (player.age === sch.minAge && !player.graduatedSchools.includes(sch.id)) {
        triggerRandomEvent({
          icon: "📜",
          title: `Пригласительное письмо из ${sch.name}!`,
          desc: `Вам исполнилось ${player.age} лет! Почтальон доставил гербовый конверт: вас приглашают стать студентом заведения (${sch.region}). Стоимость обучения: ${sch.cost}🪙.`,
          choices: [
            {
              text: `Принять приглашение и оплатить (${sch.cost}🪙)`,
              action: (p) => {
                if (p.coins < sch.cost) return "У вас не хватило денег на взнос. Мечты об академии пришлось отложить.";
                p.coins -= sch.cost;
                p.enrolledSchool = sch.id;
                p.schoolProgress = 1;
                return `Вы торжественно зачислены в <b>${sch.name}</b>!`;
              }
            },
            {
              text: "Отклонить письмо и продолжить вольную жизнь",
              action: () => "Вы вежливо отказались от приглашения в Академию."
            }
          ]
        });
        return;
      }
    }
  }

  // 5. Редкий спавн каноничных персонажей в их родных регионах
  CANON_NPCS.forEach(c => {
    const inCorrectRegion = (player.currentRegionKey === c.region);
    const inAgeRange = (player.age >= c.minAge && player.age <= c.maxAge);
    const alreadyMet = player.relations.some(r => r.id === c.id);

    if (inCorrectRegion && inAgeRange && !alreadyMet) {
      if (Math.random() < c.baseChance) {
        player.relations.push({
          id: c.id,
          name: c.name,
          gender: c.gender,
          race: c.race,
          role: c.role,
          relation: 65,
          status: "Друг",
          isCanon: true
        });
        log(`⭐ <b>Невероятная встреча!</b> Судьба свела вас с: <b>${c.name}</b> (${c.role})!`);
      }
    }
  });

  // 6. Проверка интерактивных событий с выбором
  let triggeredEvent = null;

  for (let rev of RANDOM_EVENTS.filter(e => e.isRare && player.age >= e.minAge)) {
    if (Math.random() < rev.chance) {
      triggeredEvent = rev;
      break;
    }
  }

  if (!triggeredEvent && Math.random() < 0.45) {
    const normalEvents = RANDOM_EVENTS.filter(e => !e.isRare && player.age >= e.minAge);
    if (normalEvents.length > 0) {
      triggeredEvent = normalEvents[Math.floor(Math.random() * normalEvents.length)];
    }
  }

  if (triggeredEvent) {
    triggerRandomEvent(triggeredEvent);
    return;
  }

  const notes = [
    "Год пролетел за повседневными заботами, бытом и беседами у камина.",
    "Вы тренировали концентрацию ума, слушая байки бродячих бардов.",
    "Спокойный год в окружении знакомых и родных мест."
  ];
  log(notes[Math.floor(Math.random() * notes.length)]);

  updateUI();
}

function handleDeath(reason) {
  document.getElementById("death-reason").innerText = `${reason} в возрасте ${player.age} лет.`;

  const summaryBox = document.getElementById("death-summary");
  summaryBox.innerHTML = `
    <div style="background:#1c202b; padding:12px; border-radius:10px; font-size:12px; margin-bottom:12px;">
      <div>🎖️ Имя: <b>${player.name}</b> (${player.race})</div>
      <div>📅 Прожито: <b>${player.age} лет</b> (с ${currentWorldYear - player.age} по ${currentWorldYear} г.)</div>
      <div>⚡ Пиковая БМ: <b>${calcCombatPower(player).toLocaleString()}</b></div>
      <div>🪙 Оставлено золота: <b>${player.coins} монет</b></div>
      <div>👶 Наследников: <b>${player.children.length}</b></div>
    </div>
  `;

  const heirsBlock = document.getElementById("heirs-list");
  heirsBlock.innerHTML = "";

  if (player.children && player.children.length > 0) {
    document.getElementById("heir-selection-block").style.display = "block";
    player.children.forEach(child => {
      // Расчет реального возраста ребенка на момент смерти родителя
      const childRealAge = Math.max(1, currentWorldYear - (child.birthYear || (currentWorldYear - 20)));

      const hCard = document.createElement("div");
      hCard.className = "shop-item";
      hCard.innerHTML = `
        <div>
          <b style="color:#fff;">${child.name}</b>
          <div style="font-size:11px; color:var(--muted);">${child.gender === 'male' ? 'Сын' : 'Дочь'} • Реальный возраст: <b>${childRealAge} лет</b></div>
        </div>
        <button style="background:#10b981;" onclick="continueAsHeir('${child.id}', ${childRealAge})">Играть 👑</button>
      `;
      heirsBlock.appendChild(hCard);
    });
  } else {
    document.getElementById("heir-selection-block").style.display = "none";
  }

  document.getElementById("death-overlay").style.display = "flex";
}

function continueAsHeir(childId, realAge) {
  const child = player.children.find(c => c.id === childId);
  dynastyGeneration++;

  const inheritedCoins = Math.floor(player.coins * 0.7);
  const raceObj = Object.values(RACES).find(r => r.name === player.race) || RACES.human;

  const originMock = {
    name: `Династия ${player.surname}`,
    manaBonus: Math.floor(player.maxMana * 0.15),
    swordGod: Math.floor(player.swordGodExp * 0.2),
    coins: inheritedCoins,
    int: 10,
    log: `Вы продолжили великий род ${player.surname}. На момент наследования вам уже исполнилось ${realAge} лет.`
  };

  document.getElementById("death-overlay").style.display = "none";
  
  // Создаем персонажа с СОХРАНЕНИЕМ РЕАЛЬНОГО ВОЗРАСТА!
  initCharacter(child.name.split(" ")[0], player.surname, raceObj, player.currentRegionKey, originMock, player.trait, realAge);
}

function startNewDynasty() {
  document.getElementById("death-overlay").style.display = "none";
  dynastyGeneration = 1;
  currentWorldYear = START_YEAR;
  localStorage.removeItem("bit_tensei_save");
  showCreation();
}

function confirmReset() {
  if (confirm("Завершить текущую жизнь и начать новую династию с чистого листа?")) {
    startNewDynasty();
  }
}

// ------------------------------------------
// 9. ШКОЛЫ И АКАДЕМИИ
// ------------------------------------------

function renderSchools() {
  const container = document.getElementById("schools-list");
  if (!container) return;
  container.innerHTML = "";

  SCHOOLS.forEach(sch => {
    const isEnrolled = player.enrolledSchool === sch.id;
    const isGraduated = player.graduatedSchools.includes(sch.id);
    const isCorrectRegion = player.currentRegionKey === sch.regionKey;
    const canEnroll = isCorrectRegion && player.age >= sch.minAge && !isGraduated && !player.enrolledSchool;

    let btnText = "Поступить на курс";
    if (isGraduated) btnText = "✓ Окончено с отличием (Выпускник)";
    else if (isEnrolled) btnText = `✓ Вы студент (${player.schoolProgress || 1}/4 курс)`;
    else if (!isCorrectRegion) btnText = "Нужно приехать в этот регион";

    const card = document.createElement("div");
    card.className = "school-card";
    card.innerHTML = `
      <div class="header">
        <span style="font-size:13px; font-weight:700; color:#fff;">${sch.name}</span>
        <span style="color:var(--gold); font-size:12px;">${sch.cost} 🪙</span>
      </div>
      <div style="font-size:11px; color:var(--muted); margin:4px 0;">${sch.desc}</div>
      <div style="font-size:10px; color:var(--accent-light);">Локация: ${sch.region}</div>
      <button ${!canEnroll ? 'disabled' : ''} onclick="enrollSchool('${sch.id}')" style="margin-top:6px; background:${isGraduated ? '#059669' : isEnrolled ? '#10b981' : '#312e81'};">
        ${btnText}
      </button>
    `;
    container.appendChild(card);
  });
}

function enrollSchool(schoolId) {
  const sch = SCHOOLS.find(s => s.id === schoolId);
  if (!sch) return;
  if (player.coins < sch.cost) { alert("Недостаточно монет для оплаты обучения!"); return; }

  player.coins -= sch.cost;
  player.enrolledSchool = sch.id;
  player.schoolProgress = 1;
  log(`🏛️ Вы приняты на обучение в <b>${sch.name}</b>! Занятия доступны в меню «Дела» → «Академия».`);
  updateUI();
  renderSchools();
}

// ------------------------------------------
// 10. ОТНОШЕНИЯ И NPC
// ------------------------------------------

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
    if (player.pregnancy) {
      btnContainer.innerHTML += `<button class="action-married" disabled>⏳ Беременность уже идет (родится через год)</button>`;
    } else {
      btnContainer.innerHTML += `<button class="action-married" onclick="actionHaveChild()">👶 Зачать ребенка (Родится через 1 год)</button>`;
    }
  }

  document.getElementById("npc-modal").style.display = "flex";
}

function closeNPCModal() {
  document.getElementById("npc-modal").style.display = "none";
  currentSelectedNPC = null;
}

function meetStranger() {
  const isMale = Math.random() > 0.5;
  const list = isMale ? SYLLABLES.male : SYLLABLES.female;
  const fName = list[Math.floor(Math.random() * list.length)];
  const sName = SYLLABLES.surnames[Math.floor(Math.random() * SYLLABLES.surnames.length)];

  const newNpc = {
    id: "npc_" + Date.now(),
    name: `${fName} ${sName}`,
    gender: isMale ? "male" : "female",
    race: player.race,
    role: "Вольный авантюрист",
    relation: Math.floor(Math.random() * 25) + 35,
    status: "Знакомый",
    isCanon: false
  };

  player.relations.push(newNpc);
  log(`На улицах вы повстречали незнакомца: <b>${newNpc.name}</b> (${newNpc.role}).`);
  renderRelations();
  updateUI();
}

function actionTalk() {
  const npc = currentSelectedNPC;
  if (!npc) return;
  npc.relation = Math.min(100, npc.relation + 7);
  if (npc.relation >= 60 && npc.status === "Знакомый") npc.status = "Друг";
  log(`Вы побеседовали с <b>${npc.name}</b> (+7% к отношениям).`);
  closeNPCModal(); updateUI(); switchTab('character');
}

function actionGift() {
  const npc = currentSelectedNPC;
  if (!npc) return;
  if (player.coins < 15) { alert("Недостаточно монет для подарка (нужно 15🪙)!"); return; }
  player.coins -= 15;
  npc.relation = Math.min(100, npc.relation + 20);
  log(`Вы преподнесли подарок для <b>${npc.name}</b> (+20%)!`);
  closeNPCModal(); updateUI(); switchTab('character');
}

function actionInsult() {
  const npc = currentSelectedNPC;
  if (!npc) return;
  npc.relation = Math.max(0, npc.relation - 30);
  if (npc.relation <= 25) npc.status = "Заклятый враг";
  player.swordGodExp += 10;
  log(`Ссора с <b>${npc.name}</b> переросла в стычку на клинках!`);
  closeNPCModal(); updateUI(); switchTab('character');
}

function actionConfess() {
  const npc = currentSelectedNPC;
  if (!npc) return;
  if (npc.relation >= 75) {
    npc.status = "Пара";
    log(`💖 <b>${npc.name}</b> смущенно соглашается стать вашей парой!`);
  } else {
    npc.relation = Math.max(0, npc.relation - 10);
    log(`💔 <b>${npc.name}</b>: "Давай останемся друзьями..."`);
  }
  closeNPCModal(); updateUI(); switchTab('character');
}

function actionMarry() {
  const npc = currentSelectedNPC;
  if (!npc) return;
  if (npc.relation >= 88) {
    npc.status = "Супруг/Супруга";
    player.spouse = npc;
    log(`💍 Колокола звонят в соборе! Вы и <b>${npc.name}</b> связали жизни браком!`);
  } else {
    log(`${npc.name} считает, что нужно еще лучше укрепить взаимное доверие.`);
  }
  closeNPCModal(); updateUI(); switchTab('character');
}

// Зачатие ребенка: длится 1 год!
function actionHaveChild() {
  const npc = currentSelectedNPC;
  if (!npc) return;

  if (player.pregnancy) {
    alert("Беременность уже протекает! Ребенок появится на свет в следующем году.");
    return;
  }

  player.pregnancy = { partnerName: npc.name };
  log(`💖 Прекрасная весть! Вы и <b>${npc.name}</b> ждете ребенка! Малыш появится на свет в следующем году.`);
  closeNPCModal(); updateUI(); switchTab('character');
}

// ------------------------------------------
// 11. СОХРАНЕНИЕ И ЗАГРУЗКА
// ------------------------------------------

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

if (!loadGame()) {
  showCreation();
}
