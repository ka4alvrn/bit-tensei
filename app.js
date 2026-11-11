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
let currentOpenedNpcId = null;
let currentBattle = null;
let currentActivityCategory = "all";

// Карма перерождений (Roguelike мета-прогресс Сансары)
function getReincarnationKarma() {
  return parseInt(localStorage.getItem("bit_tensei_karma") || "0", 10);
}

function addReincarnationKarma() {
  let k = getReincarnationKarma() + 1;
  localStorage.setItem("bit_tensei_karma", k.toString());
  return k;
}

function getMaxAP(age) {
  if (age <= 3) return 5;
  if (age <= 9) return 8;
  if (age <= 15) return 10;
  return 12;
}

// Расчет совокупной Боевой Мощи персонажа (с учетом потолка сил поколения и травм)
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

  if (p.equipment?.weapon) cp += p.equipment.weapon.cp || 0;
  if (p.equipment?.armor) cp += p.equipment.armor.cp || 0;
  if (p.equipment?.accessory) cp += p.equipment.accessory.cp || 0;

  // Штрафы за травмы
  if (p.injuries && p.injuries.length > 0) {
    p.injuries.forEach(inj => {
      if (inj.id === "lost_arm" && (!p.equipment.accessory || p.equipment.accessory.id !== "prosthetic_arm")) {
        cp = Math.floor(cp * 0.7); // Без протеза потеря руки срезает 30% БМ
      }
    });
  }

  // Бонус кармы перерождений
  const karma = getReincarnationKarma();
  if (karma > 0) {
    cp = Math.floor(cp * (1 + karma * 0.05));
  }

  // Потолок сил для текущего поколения
  const maxCap = GENERATION_CP_CAPS[p.generation] || 9999999;
  return Math.min(maxCap, Math.floor(cp));
}

// Расчет совокупной Боевой Мощи всего Отряда
function calcSquadCombatPower(p) {
  if (!p) return 0;
  let total = calcCombatPower(p);
  if (p.squad && p.squad.length > 0) {
    p.squad.forEach(m => {
      total += m.cp || 500;
    });
  }
  return total;
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
  const karma = getReincarnationKarma();
  let baseMana = Math.round((race.bonus.baseMana + (origin.manaBonus || 0) + (trait.manaBonus || 0) + (karma * 15)) * (race.bonus.manaMod || 1.0));
  let baseHp = 100 + (trait.hp || 0) + (race.bonus.hp || 0) + (karma * 10);

  if (startAge > 5) {
    baseMana += Math.min(250, startAge * 8);
  }

  const fatherName = SYLLABLES.male[Math.floor(Math.random() * SYLLABLES.male.length)] + " " + sName;
  const motherName = SYLLABLES.female[Math.floor(Math.random() * SYLLABLES.female.length)] + " " + sName;

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
    guildRank: "F",
    guildExp: 0,
    guildQuestsThisYear: [],
    dungeonProgress: {},
    enrolledSchool: null,
    schoolProgress: 0,
    graduatedSchools: [],
    squad: [],
    squadFame: 0,
    estates: [],
    injuries: [],
    dynastyFaction: player?.dynastyFaction || "neutral",
    factionProgress: player?.factionProgress || 0,
    pregnancy: null,
    equipment: { weapon: null, armor: null, accessory: null },
    inventory: [],
    potionsCount: 2,
    relations: [
      { id: "father", name: fatherName, gender: "male", role: "Отец • Глава дома", cp: 1200, relation: 85, status: "Семья", isFamily: true },
      { id: "mother", name: motherName, gender: "female", role: "Мать • Хранительница", cp: 800, relation: 95, status: "Семья", isFamily: true }
    ],
    spouse: null,
    children: []
  };

  generateYearlyGuildQuests();

  document.getElementById("logs").innerHTML = "";
  log(`🌍 Вы воплотились как <b>${player.race}</b> в <b>${REGIONS[player.currentRegionKey].name}</b> (${currentWorldYear} г. К.Д.).`);
  if (karma > 0) log(`✨ Карма Сансары: <b>Уровень ${karma}</b> (+${karma * 15} маны, +${karma * 10} HP, +${karma * 5}% БМ к душе).`);
  log(origin.log);

  renderUI();
  saveGame();
  showBirthModal();
}

function showBirthModal() {
  const cap = GENERATION_CP_CAPS[player.generation] || 9999999;
  const content = document.getElementById("birth-card-content");
  content.innerHTML = `
    <div>👶 Имя: <b>${player.name}</b> (${player.age} лет, Поколение ${player.generation})</div>
    <div>🧬 Раса: <b>${player.race}</b> (Срок жизни: ~${player.maxAge} лет)</div>
    <div>🏰 Пребывание: <b>${REGIONS[player.currentRegionKey].name}</b></div>
    <div>👨‍👩‍👦 Родители: <b>${player.relations[0].name}</b> и <b>${player.relations[1].name}</b></div>
    <div style="margin-top:6px; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px;">
      <div>🔮 Сосуд маны: <b style="color:var(--mana);">${player.maxMana}</b></div>
      <div>❤️ Здоровье: <b style="color:var(--hp);">${player.hp} HP</b></div>
      <div>⚡ Начальная Боевая Мощь: <b style="color:var(--accent-light);">${calcCombatPower(player)}</b></div>
      <div>🛑 Потолок силы ${player.generation}-го поколения: <b style="color:var(--gold);">${cap.toLocaleString()} БМ</b></div>
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
  if (tabId === 'inventory') { renderInventoryTab(); renderEstates(); }
  if (tabId === 'guild') { renderGuildTab(); renderSquad(); }
  if (tabId === 'relations') { renderRelations(); renderTravelTab(); renderSchools(); }
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

  const cap = GENERATION_CP_CAPS[player.generation] || 9999999;
  const capHint = document.getElementById("char-cp-cap-hint");
  if (capHint) {
    capHint.innerText = cp >= cap ? `[Достигнут предел ${player.generation}-го поколения: ${cap.toLocaleString()}]` : `Потолок ${player.generation}-го рода: ${cap.toLocaleString()}`;
  }

  const gBadge = document.getElementById("char-guild-badge");
  gBadge.innerText = player.age >= 10 ? `Ранг ${player.guildRank}` : "Гильдия: с 10 лет";

  let wRank = "Смертный";
  if (cp >= 1000000) wRank = "Мировое Бедствие 💥";
  else if (cp >= 180000) wRank = "Уровень Семи Сил 🏆";
  else if (cp >= 40000)  wRank = "Герой Ранга S 🌟";
  else if (cp >= 10000)  wRank = "Мастер Святого Ранга 🗡️";
  else if (cp >= 1500)   wRank = "Опытный Мечник";
  document.getElementById("char-world-rank").innerText = wRank;

  document.getElementById("hp-text").innerText = `${player.hp}/${player.maxHp}`;
  document.getElementById("hp-bar").style.width = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100)) + "%";

  document.getElementById("mana-text").innerText = `${player.mana}/${player.maxMana}`;
  document.getElementById("mana-bar").style.width = Math.min(100, (player.mana / player.maxMana) * 100) + "%";

  // Травмы
  const injBanner = document.getElementById("injuries-banner");
  if (player.injuries && player.injuries.length > 0) {
    injBanner.style.display = "block";
    injBanner.innerHTML = player.injuries.map(i => `<span class="badge-mythic" style="font-size:10px; margin-right:4px;">⚠️ ${i.name}</span>`).join("");
  } else {
    injBanner.style.display = "none";
  }

  // Фракция Войны Судеб
  const facBox = document.getElementById("faction-badge-container");
  if (player.dynastyFaction === "hitogami") {
    facBox.innerHTML = `<span style="font-size:10px; background:#450a0a; border:1px solid #ef4444; color:#fca5a5; padding:2px 6px; border-radius:4px;">👁️ Апостол Хитогами (Влияние: ${player.factionProgress || 0}/1000)</span>`;
  } else if (player.dynastyFaction === "orsted") {
    facBox.innerHTML = `<span style="font-size:10px; background:#064e3b; border:1px solid #10b981; color:#a7f3d0; padding:2px 6px; border-radius:4px;">🐉 Подчиненный Орстеда (Влияние: ${player.factionProgress || 0}/1000)</span>`;
  } else {
    facBox.innerHTML = "";
  }

  const manaStatus = document.getElementById("mana-status");
  if (player.age < 10) {
    manaStatus.innerText = "• Золотое Окно 🌱"; manaStatus.style.color = "var(--green)";
  } else if (player.trait.id === "laplace_factor") {
    manaStatus.innerText = "• Фактор Лапласа ✨"; manaStatus.style.color = "var(--accent-light)";
  } else {
    manaStatus.innerText = "• Каналы затвердели 🔒"; manaStatus.style.color = "var(--muted)";
  }

  document.getElementById("magic").innerText = calculateRank(player.magicExp, MAGIC_RANKS);
  document.getElementById("sword-god").innerText = calculateRank(player.swordGodExp, SWORD_RANKS);
  document.getElementById("water-god").innerText = calculateRank(player.waterGodExp, SWORD_RANKS);
  document.getElementById("north-god").innerText = calculateRank(player.northGodExp, SWORD_RANKS);
  document.getElementById("intellect").innerText = player.intellect;
  document.getElementById("coins").innerText = player.coins;

  document.getElementById("slot-weapon").innerText = player.equipment?.weapon ? player.equipment.weapon.name : "Кулаки";
  document.getElementById("slot-armor").innerText = player.equipment?.armor ? player.equipment.armor.name : "Простая одежда";
  document.getElementById("slot-accessory").innerText = player.equipment?.accessory ? player.equipment.accessory.name : "Нет";
}

function updateUI() {
  renderUI();
  saveGame();
}

// ------------------------------------------
// 3. АКТИВНОСТИ И ДЕЛА
// ------------------------------------------

function renderActivities() {
  const container = document.getElementById("activities-container");
  container.innerHTML = "";

  let list = ACTIVITIES.filter(a => player.age >= a.minAge && player.age <= a.maxAge);
  if (currentActivityCategory !== "all") {
    list = list.filter(a => a.category === currentActivityCategory);
  }

  if (list.length === 0) {
    container.innerHTML = `<div style="color:var(--muted); text-align:center; padding:20px;">Нет доступных дел в этой категории. Переключите фильтр или пропустите год!</div>`;
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
    alert("Вы слишком истощены! Нажмите «Прожить 1 год», чтобы отдохнуть.");
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
// 4. СИСТЕМА ОТРЯДА (ДО 6 НАПАРНИКОВ)
// ------------------------------------------

function renderSquad() {
  const countEl = document.getElementById("squad-count");
  const cpEl = document.getElementById("squad-cp");
  const fameEl = document.getElementById("squad-fame");
  const listEl = document.getElementById("squad-members-list");

  if (!countEl || !listEl) return;

  countEl.innerText = (player.squad ? player.squad.length + 1 : 1);
  cpEl.innerText = calcSquadCombatPower(player).toLocaleString();
  fameEl.innerText = player.squadFame || 0;
  listEl.innerHTML = "";

  if (!player.squad || player.squad.length === 0) {
    listEl.innerHTML = `<div style="font-size:11px; color:var(--muted);">В отряде только вы. Пригласите друзей или супруга во вкладке «Связи»!</div>`;
    return;
  }

  player.squad.forEach((m, idx) => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#12141c; padding:6px 10px; border-radius:8px; margin-bottom:4px; font-size:12px;";
    row.innerHTML = `
      <div>
        <b>${m.name}</b> <span style="font-size:10px; color:var(--muted);">(${m.role || m.race})</span>
        <div style="font-size:10px; color:#c7d2fe;">БМ: ${m.cp.toLocaleString()} • Преданность: ${m.relation}%</div>
      </div>
      <button style="padding:4px 8px; font-size:10px; background:#ef4444;" onclick="removeFromSquad(${idx})">Выгнать</button>
    `;
    listEl.appendChild(row);
  });
}

function addToSquad(npcId) {
  if (player.squad && player.squad.length >= 5) {
    alert("Отряд полон! Максимум 6 бойцов (вы + 5 спутников).");
    return;
  }

  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;

  if (npc.relation < 60) {
    alert(`${npc.name} недостаточно доверяет вам для совместных походов (нужно 60%+ отношений)!`);
    return;
  }

  player.squad = player.squad || [];
  player.squad.push(npc);
  log(`🛡️ <b>${npc.name}</b> вступил(а) в ваш боевой отряд! Общая мощь выросла!`);
  updateUI();
  renderRelations();
  renderSquad();
}

function removeFromSquad(index) {
  const m = player.squad[index];
  player.squad.splice(index, 1);
  log(`Вы исключили <b>${m.name}</b> из отряда.`);
  updateUI();
  renderSquad();
}

// Проверка шанса предательства напарника
function checkSquadBetrayal() {
  if (!player.squad || player.squad.length === 0) return false;

  for (let i = 0; i < player.squad.length; i++) {
    let m = player.squad[i];
    // Не предают члены семьи, супруги и те, у кого отношение > 85
    if (m.isFamily || m.status === "Супруг/Супруга" || m.relation >= 85) continue;

    if (m.relation < 45 || Math.random() < 0.05) {
      log(`🗡️💥 <b>ПРЕДАТЕЛЬСТВО В ОТРЯДЕ!</b> Напарник <b>${m.name}</b> ударил вас в спину в критический момент и украл часть золота!`);
      player.hp = Math.max(10, player.hp - 35);
      player.coins = Math.max(0, player.coins - 50);
      player.squad.splice(i, 1);
      m.relation = 0;
      m.status = "Заклятый враг";
      updateUI();
      renderSquad();
      return true;
    }
  }
  return false;
}

// ------------------------------------------
// 5. ВЗАИМОДЕЙСТВИЯ С ПЕРСОНАЖАМИ (ПОД КАРТОЧКОЙ)
// ------------------------------------------

function toggleNpcActions(npcId) {
  currentOpenedNpcId = (currentOpenedNpcId === npcId) ? null : npcId;
  renderRelations();
}

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

    const isOpened = (currentOpenedNpcId === npc.id);
    const inSquad = player.squad && player.squad.some(m => m.id === npc.id);

    const card = document.createElement("div");
    card.className = "relation-card";
    card.innerHTML = `
      <div class="rel-header" onclick="toggleNpcActions('${npc.id}')" style="cursor:pointer;">
        <div>
          <div class="rel-name">
            ${npc.name}
            ${npc.isCanon ? '<span class="badge-canon">Канон ⭐</span>' : ''}
            ${npc.isChild ? '<span style="color:#fbbf24; font-size:11px;">(Наследник 👶)</span>' : ''}
            ${inSquad ? '<span class="badge-rare">В отряде 🛡️</span>' : ''}
          </div>
          <div class="rel-role">${npc.role || npc.race} • Сословие: ${npc.socialClass || 'Горожанин'} • БМ: <b>${(npc.cp || 500).toLocaleString()}</b></div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:13px; font-weight:700;"><span class="${statusClass}">${npc.status}</span> (${npc.relation}%)</div>
          <div style="font-size:10px; color:var(--accent);">${isOpened ? '▲ Свернуть' : '▼ Взаимодействовать'}</div>
        </div>
      </div>
      <div class="bar-bg" onclick="toggleNpcActions('${npc.id}')" style="cursor:pointer;">
        <div class="bar-fill bar-relation" style="width: ${Math.max(0, Math.min(100, npc.relation))}%; background: ${npc.relation < 30 ? 'var(--hp)' : 'var(--green)'};"></div>
      </div>

      <!-- Действия ПРЯМО ПОД КАРТОЧКОЙ -->
      ${isOpened ? `
        <div class="npc-inline-actions">
          <button onclick="actionTalk('${npc.id}')">💬 Поговорить</button>
          <button onclick="actionGift('${npc.id}')">🎁 Подарок (15🪙)</button>
          <button class="action-danger" onclick="actionDuel('${npc.id}')">⚔️ Вызвать на дуэль</button>
          <button class="action-danger" onclick="actionInsult('${npc.id}')">🤬 Оскорбить</button>

          ${!inSquad && player.age >= 10 && !npc.isChild ? `
            <button style="grid-column: span 2; background:#312e81;" onclick="addToSquad('${npc.id}')">🛡️ Пригласить в отряд</button>
          ` : ''}

          ${!npc.isFamily && !npc.isChild && player.age >= 14 && npc.status !== "Пара" && npc.status !== "Супруг/Супруга" ? `
            <button class="action-love" style="grid-column: span 2;" onclick="actionConfess('${npc.id}')">❤️ Признаться в любви</button>
          ` : ''}

          ${!npc.isFamily && !npc.isChild && player.age >= 16 && npc.status === "Пара" && !player.spouse ? `
            <button class="action-married" style="grid-column: span 2;" onclick="actionMarry('${npc.id}')">💍 Сделать предложение</button>
          ` : ''}

          ${npc.status === "Супруг/Супруга" && player.age >= 16 ? `
            <button class="action-married" style="grid-column: span 2;" ${player.pregnancy ? 'disabled' : ''} onclick="actionHaveChild('${npc.id}')">
              ${player.pregnancy ? '⏳ Ребенок родится в следующем году' : '👶 Зачать ребенка (Родится через 1 год)'}
            </button>
          ` : ''}
        </div>
      ` : ''}
    `;
    container.appendChild(card);
  });
}

function actionTalk(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  npc.relation = Math.min(100, npc.relation + 7);
  if (npc.relation >= 60 && npc.status === "Знакомый") npc.status = "Друг";
  log(`Вы побеседовали с <b>${npc.name}</b> (+7% к отношениям).`);
  updateUI();
  renderRelations();
}

function actionGift(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  if (player.coins < 15) { alert("Недостаточно монет (нужно 15🪙)!"); return; }
  player.coins -= 15;
  npc.relation = Math.min(100, npc.relation + 20);
  log(`Вы преподнесли ценный подарок для <b>${npc.name}</b> (+20%)!`);
  updateUI();
  renderRelations();
}

function actionInsult(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  npc.relation = Math.max(0, npc.relation - 30);
  if (npc.relation <= 25) npc.status = "Заклятый враг";
  log(`Вы жестоко оскорбили <b>${npc.name}</b>. Отношения испорчены!`);
  updateUI();
  renderRelations();
}

function actionDuel(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;

  const npcCp = npc.cp || 800;
  currentBattle = {
    quest: { enemy: npc.name, rank: "Дуэль", reward: 0, gp: 5 },
    enemyHp: Math.round(npcCp / 10),
    enemyMaxHp: Math.round(npcCp / 10),
    enemyCp: npcCp,
    isDuel: true,
    npc: npc
  };

  document.getElementById("battle-enemy-name").innerText = `Дуэль: ${npc.name}`;
  document.getElementById("battle-enemy-cp").innerText = `БМ: ${npcCp.toLocaleString()}`;
  document.getElementById("battle-enemy-hp-text").innerText = `${currentBattle.enemyHp}/${currentBattle.enemyHp}`;
  document.getElementById("battle-enemy-hp-bar").style.width = "100%";
  document.getElementById("battle-log").innerHTML = `Вы обнажили клинки в дуэли против <b>${npc.name}</b>!`;

  document.getElementById("battle-modal").style.display = "flex";
}

function actionConfess(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  if (npc.relation >= 75) {
    npc.status = "Пара";
    log(`💖 <b>${npc.name}</b> смущенно соглашается стать вашей парой!`);
  } else {
    npc.relation = Math.max(0, npc.relation - 10);
    log(`💔 <b>${npc.name}</b>: "Давай пока останемся друзьями..."`);
  }
  updateUI();
  renderRelations();
}

function actionMarry(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  if (npc.relation >= 88) {
    npc.status = "Супруг/Супруга";
    player.spouse = npc;
    log(`💍 Колокола звонят в храме! Вы и <b>${npc.name}</b> вступили в брак!`);
  } else {
    log(`${npc.name} считает, что нужно еще лучше укрепить взаимное доверие.`);
  }
  updateUI();
  renderRelations();
}

function actionHaveChild(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  if (player.pregnancy) {
    alert("Беременность уже протекает! Ребенок появится на свет в следующем году.");
    return;
  }
  player.pregnancy = { partnerName: npc.name };
  log(`💖 Прекрасная весть! Вы и <b>${npc.name}</b> ждете ребенка! Малыш появится на свет в следующем году.`);
  updateUI();
  renderRelations();
}

function meetStranger() {
  const isMale = Math.random() > 0.5;
  const list = isMale ? SYLLABLES.male : SYLLABLES.female;
  const fName = list[Math.floor(Math.random() * list.length)];
  const sName = SYLLABLES.surnames[Math.floor(Math.random() * SYLLABLES.surnames.length)];

  const raceKeys = Object.keys(RACES);
  const randRace = RACES[raceKeys[Math.floor(Math.random() * raceKeys.length)]].name;

  const classes = ["Нищий", "Крестьянин", "Вольный наемник", "Купец", "Младший рыцарь", "Магистр школы", "Аристократ"];
  const randClass = classes[Math.floor(Math.random() * classes.length)];

  // Рандомизация силы от сословия и возраста игрока
  let baseCp = Math.floor(Math.random() * 2000) + 300;
  if (randClass === "Младший рыцарь" || randClass === "Магистр школы") baseCp += 3500;

  const newNpc = {
    id: "npc_" + Date.now(),
    name: `${fName} ${sName}`,
    gender: isMale ? "male" : "female",
    race: randRace,
    socialClass: randClass,
    role: randClass,
    cp: baseCp,
    relation: Math.floor(Math.random() * 25) + 35,
    status: "Знакомый",
    isCanon: false
  };

  player.relations.push(newNpc);
  log(`На улицах вы повстречали: <b>${newNpc.name}</b> (${newNpc.race}, ${newNpc.socialClass}, БМ: ${baseCp.toLocaleString()}).`);
  renderRelations();
  updateUI();
}

// ------------------------------------------
// 6. ПОМЕСТЬЕ И НЕДВИЖИМОСТЬ
// ------------------------------------------

function renderEstates() {
  const container = document.getElementById("estate-container");
  if (!container) return;
  container.innerHTML = "";

  ESTATES.forEach(est => {
    const isOwned = player.estates && player.estates.includes(est.id);
    const card = document.createElement("div");
    card.className = "estate-card";
    card.innerHTML = `
      <div>
        <b style="color:#fff;">${est.name}</b> ${isOwned ? '<span style="color:var(--green); font-size:11px;">(В собственности)</span>' : ''}
        <div style="font-size:11px; color:var(--muted);">${est.desc}</div>
        <div style="font-size:10px; color:var(--gold);">Цена: ${est.cost.toLocaleString()} 🪙</div>
      </div>
      <button ${isOwned ? 'disabled' : ''} onclick="buyEstate('${est.id}')" style="background:${isOwned ? '#059669' : '#312e81'};">
        ${isOwned ? '✓ Куплено' : 'Купить'}
      </button>
    `;
    container.appendChild(card);
  });
}

function buyEstate(estateId) {
  const est = ESTATES.find(e => e.id === estateId);
  if (!est) return;

  if (player.coins < est.cost) {
    alert("У вас недостаточно монет для покупки этого поместья!");
    return;
  }

  player.coins -= est.cost;
  player.estates = player.estates || [];
  player.estates.push(est.id);
  log(`🏰 Вы приобрели родовую недвижимость: <b>${est.name}</b>! Теперь она будет приносить ежегодный доход и перейдет вашим детям.`);
  updateUI();
  renderEstates();
}

// ------------------------------------------
// 7. ГИЛЬДИЯ, ЛАБИРИНТЫ И БОИ
// ------------------------------------------

function generateYearlyGuildQuests() {
  const pRankIdx = ADVENTURER_RANKS.indexOf(player.guildRank);
  const pool = ALL_GUILD_QUESTS.filter(q => {
    let qRankIdx = ADVENTURER_RANKS.indexOf(q.rank);
    return qRankIdx <= pRankIdx + 1;
  });

  player.guildQuestsThisYear = [];
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  player.guildQuestsThisYear = shuffled.slice(0, 5);
}

function renderGuildTab() {
  document.getElementById("guild-status-tag").innerText = `Ранг: ${player.guildRank}`;
  const nextRank = ADVENTURER_RANKS[ADVENTURER_RANKS.indexOf(player.guildRank) + 1] || "MAX";
  const nextReq = ADVENTURER_REQ[nextRank] || "MAX";
  document.getElementById("guild-exp-text").innerText = `${player.guildExp} / ${nextReq} GP`;

  const dungCont = document.getElementById("dungeon-container");
  dungCont.innerHTML = "";

  DUNGEONS.forEach(d => {
    const curFloor = player.dungeonProgress[d.id] || 1;
    const isCompleted = curFloor > d.maxFloors;
    const pRankIdx = ADVENTURER_RANKS.indexOf(player.guildRank);
    const reqRankIdx = ADVENTURER_RANKS.indexOf(d.reqRank);
    const hasRank = pRankIdx >= reqRankIdx;
    const canEnter = player.age >= 10 && hasRank;

    const dCard = document.createElement("div");
    dCard.className = "card";
    dCard.style.marginBottom = "8px";
    dCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <b style="font-size:13px; color:#fff;">${d.name}</b>
        <span class="tag badge-rare">Доступ: Ранг ${d.reqRank}+</span>
      </div>
      <div style="font-size:11px; color:var(--muted); margin:4px 0;">${d.desc}</div>
      <div style="font-size:11px; color:var(--accent-light);">
        ${isCompleted ? '👑 Полностью покорен!' : `Глубина: Этаж ${curFloor} из ${d.maxFloors}`}
      </div>
      <button ${!canEnter || isCompleted ? 'disabled' : ''} onclick="exploreDungeonFloor('${d.id}')" style="margin-top:6px; background:#4338ca; width:100%;">
        ${isCompleted ? '✓ Лабиринт зачищен' : !hasRank ? `Требуется Ранг ${d.reqRank}` : 'Спуститься ниже ⬇️ (Отрядом) (⚡ 1 сила)'}
      </button>
    `;
    dungCont.appendChild(dCard);
  });

  const qCont = document.getElementById("guild-quests-list");
  qCont.innerHTML = "";

  if (player.age < 10) {
    qCont.innerHTML = `<div style="color:var(--muted); padding:10px; text-align:center;">Регистрация в Гильдии доступна только с 10 лет!</div>`;
  } else if (!player.guildQuestsThisYear || player.guildQuestsThisYear.length === 0) {
    qCont.innerHTML = `<div style="color:var(--muted); padding:10px; text-align:center;">Все доступные заказы выполнены. Нажмите «Прожить 1 год» для обновления!</div>`;
  } else {
    player.guildQuestsThisYear.forEach(q => {
      const qDiv = document.createElement("div");
      qDiv.className = "quest-card";
      const canHunt = player.ap >= 2;
      qDiv.innerHTML = `
        <div>
          <span class="tag badge-rare">Ранг ${q.rank}</span>
          <b style="font-size:13px; display:block; margin:2px 0;">${q.name}</b>
          <div style="font-size:11px; color:var(--muted);">Враг: ${q.enemy} • БМ: ${q.cp.toLocaleString()}</div>
          <div style="font-size:11px; color:var(--gold);">Награда: +${q.reward} 🪙 | +${q.gp} GP • Тратит: ⚡ 2 силы</div>
        </div>
        <button ${canHunt ? '' : 'disabled'} style="background:#312e81;" onclick="startGuildBattle('${q.id}')">
          ${canHunt ? 'В бой' : 'Нет сил'}
        </button>
      `;
      qCont.appendChild(qDiv);
    });
  }

  const monCont = document.getElementById("powers-monument-list");
  monCont.innerHTML = "";
  const myCp = calcCombatPower(player);
  let playerRank = -1;

  SEVEN_GREAT_POWERS.forEach(p => {
    if (myCp > p.cp && playerRank === -1) playerRank = p.rank;
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
          <div style="font-size:10px; color:var(--muted);">Порог: ${pow.cp.toLocaleString()} БМ</div>
        </div>
      </div>
      <span class="badge-mythic">${isMe ? '👑 ВЫ' : 'Непостижимо'}</span>
    `;
    monCont.appendChild(row);
  });
}

function exploreDungeonFloor(dungeonId) {
  if (player.ap < 1) {
    alert("Вы слишком устали для вылазки в лабиринт! (Нужно ⚡ 1 сила).");
    return;
  }
  player.ap -= 1;

  // Проверка предательства спутника
  if (checkSquadBetrayal()) return;

  const d = DUNGEONS.find(x => x.id === dungeonId);
  player.dungeonProgress[d.id] = player.dungeonProgress[d.id] || 1;
  let floor = player.dungeonProgress[d.id];

  const roll = Math.random();

  // Ловушка телепортации
  if (roll < 0.22 && floor > 1) {
    let stepsBack = Math.min(floor - 1, Math.floor(Math.random() * 2) + 1);
    player.dungeonProgress[d.id] -= stepsBack;
    log(`🌀 <b>ЛОВУШКА ТЕЛЕПОРТАЦИИ!</b> Отряд наступил на глиф! Вас отбросило на <b>-${stepsBack} этаж(а) назад</b>!`);
  }
  // Источник
  else if (roll < 0.35) {
    player.hp = player.maxHp; player.mana = player.maxMana;
    log(`⛲ Отряд нашел тайный грот со Священным источником! Здоровье и Мана восстановлены!`);
  }
  // Сундук
  else if (roll < 0.50) {
    let lootCoins = Math.floor(Math.random() * 100) + 40;
    player.coins += lootCoins;
    player.squadFame = (player.squadFame || 0) + 10;
    log(`💎 На ${floor} этаже отряд нашел старинный ларец (+${lootCoins} монет, +10 к Славе отряда)!`);
  }
  // Схватка со стражем этажа
  else if (roll < 0.85) {
    let monsterCp = Math.floor(d.cpBase * (1 + floor * 0.4));
    let squadCp = calcSquadCombatPower(player);
    let damage = Math.floor(monsterCp / (squadCp + 100) * 20) + 10;
    player.hp -= damage;

    // Шанс тяжелой травмы
    if (damage > 35 && Math.random() < 0.25 && !player.injuries.some(i => i.id === "lost_arm")) {
      player.injuries.push({ id: "lost_arm", name: "Утрата левой руки" });
      log(`🩸 <b>ТЯЖЕЛАЯ ТРАВМА!</b> В жестокой схватке с монстром вы потеряли левую руку! Срочно нужен магический протез!`);
    }

    log(`⚔️ На ${floor} этаже отряд столкнулся с тварями! Урон лидеру: -${damage} HP.`);
    player.dungeonProgress[d.id]++;

    if (player.dungeonProgress[d.id] > d.maxFloors) {
      log(`🏆 <b>ТРИУМФ!</b> Отряд сокрушил Босса лабиринта ${d.name}! Подземелье покорено (+500🪙, +100 Славы)!`);
      player.coins += 500;
      player.guildExp += 100;
      player.squadFame = (player.squadFame || 0) + 100;
    }
  }
  // Проход дальше
  else {
    player.dungeonProgress[d.id]++;
    log(`🪜 Отряд успешно пробился на ${player.dungeonProgress[d.id]} этаж ${d.name}.`);
  }

  updateUI();
  renderGuildTab();
  if (player.hp <= 0) handleDeath("Сгинул в глубинах лабиринта подземелья.");
}

function startGuildBattle(questId) {
  if (player.ap < 2) {
    alert("У вас недостаточно сил для отправки на охоту (нужно ⚡ 2 силы)!");
    return;
  }

  const quest = player.guildQuestsThisYear.find(q => q.id === questId);
  if (!quest) return;

  player.ap -= 2;

  currentBattle = {
    quest: quest,
    enemyHp: quest.hp,
    enemyMaxHp: quest.hp,
    enemyCp: quest.cp,
    isDuel: false
  };

  document.getElementById("battle-enemy-name").innerText = `${quest.enemy} (Ранг ${quest.rank})`;
  document.getElementById("battle-enemy-cp").innerText = `БМ: ${quest.cp.toLocaleString()}`;
  document.getElementById("battle-enemy-hp-text").innerText = `${quest.hp}/${quest.hp}`;
  document.getElementById("battle-enemy-hp-bar").style.width = "100%";
  document.getElementById("battle-log").innerHTML = `Ваш отряд обнажил оружие против <b>${quest.enemy}</b>!`;

  document.getElementById("battle-modal").style.display = "flex";
}

function combatAction(actionType) {
  if (!currentBattle) return;

  const logBox = document.getElementById("battle-log");
  const squadCp = currentBattle.isDuel ? calcCombatPower(player) : calcSquadCombatPower(player);
  const enemyCp = currentBattle.enemyCp;

  if (actionType === "flee") {
    logBox.innerHTML += `<div>🏃 Отряд отступил из схватки!</div>`;
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
    myDamage = Math.floor(power * (squadCp / (enemyCp + 100)) * 2) + Math.floor(Math.random() * 20) + 15;
    logBox.innerHTML += `<div>⚔️ Вы и отряд нанесли мощный выпад: <b>-${myDamage} HP</b>!</div>`;
  } else if (actionType === "magic") {
    if (player.mana < 10) {
      logBox.innerHTML += `<div style="color:var(--muted)">Мана иссякла!</div>`;
      myDamage = 5;
    } else {
      player.mana -= 10;
      myDamage = Math.floor(player.magicExp * (squadCp / (enemyCp + 100)) * 2.5) + Math.floor(Math.random() * 30) + 20;
      logBox.innerHTML += `<div style="color:var(--mana)">🔮 Каст заклинания: <b>-${myDamage} HP</b>!</div>`;
    }
  }

  currentBattle.enemyHp -= myDamage;

  if (currentBattle.enemyHp <= 0) {
    logBox.innerHTML += `<div style="color:var(--gold); font-weight:700;">🏆 ПОБЕДА! Враг повержен!</div>`;

    if (currentBattle.isDuel) {
      currentBattle.npc.relation = Math.max(0, currentBattle.npc.relation - 15);
      player.swordGodExp += 15;
      log(`Вы одержали победу в дуэли против <b>${currentBattle.npc.name}</b> (+15 к опыту меча)!`);
    } else {
      player.coins += currentBattle.quest.reward;
      player.guildExp += currentBattle.quest.gp;
      player.squadFame = (player.squadFame || 0) + currentBattle.quest.gp;
      player.swordGodExp += 10;
      player.magicExp += 10;
      log(`Заказ Гильдии выполнен! Награда: +${currentBattle.quest.reward} 🪙, +${currentBattle.quest.gp} GP, +${currentBattle.quest.gp} Славы отряда.`);

      player.guildQuestsThisYear = player.guildQuestsThisYear.filter(q => q.id !== currentBattle.quest.id);
      checkGuildRankUp();
    }

    setTimeout(() => {
      document.getElementById("battle-modal").style.display = "none";
      currentBattle = null;
      updateUI();
      renderGuildTab();
    }, 1000);
    return;
  }

  let enemyDamage = Math.floor(enemyCp / (squadCp + 50) * 18) + Math.floor(Math.random() * 12) + 6;
  player.hp -= enemyDamage;
  logBox.innerHTML += `<div style="color:var(--hp)">Враг нанес ответный удар: <b>-${enemyDamage} HP</b>!</div>`;
  logBox.scrollTop = logBox.scrollHeight;

  document.getElementById("battle-enemy-hp-text").innerText = `${Math.max(0, currentBattle.enemyHp)}/${currentBattle.enemyMaxHp}`;
  document.getElementById("battle-enemy-hp-bar").style.width = Math.max(0, (currentBattle.enemyHp / currentBattle.enemyMaxHp) * 100) + "%";
  updateUI();

  if (player.hp <= 0) {
    document.getElementById("battle-modal").style.display = "none";
    currentBattle = null;
    handleDeath("Погиб в схватке на заказе Гильдии.");
  }
}

function checkGuildRankUp() {
  const currentIdx = ADVENTURER_RANKS.indexOf(player.guildRank);
  if (currentIdx < ADVENTURER_RANKS.length - 1) {
    const nextRank = ADVENTURER_RANKS[currentIdx + 1];
    const req = ADVENTURER_REQ[nextRank];
    if (player.guildExp >= req) {
      player.guildRank = nextRank;
      log(`🌟 <b>ПОВЫШЕНИЕ В ГИЛЬДИИ!</b> Ваш ранг авантюриста вырос до <b>${nextRank}</b>! Доступны новые заказы и подземелья!`);
    }
  }
}

// ------------------------------------------
// 8. КАРТА МИРА И ПУТЕШЕСТВИЯ (1 ГОД)
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
  ageUp();
  switchTab('character');
}

// ------------------------------------------
// 9. ИНВЕНТАРЬ И МАГАЗИН
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
// 10. ХОД ВРЕМЕНИ, СТАРЕНИЕ И ДИНАСТИЯ
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
      if (player.hp <= 0) handleDeath("Пал жертвой роковых обстоятельств года.");
    };
    cBox.appendChild(btn);
  });

  document.getElementById("event-modal").style.display = "flex";
}

function ageUp() {
  player.age++;
  currentWorldYear++;

  player.maxAp = getMaxAP(player.age);
  player.ap = player.maxAp;
  player.mana = player.maxMana;

  generateYearlyGuildQuests();

  // Пассивный доход от недвижимости
  if (player.estates && player.estates.length > 0) {
    let passiveIncome = 0;
    player.estates.forEach(estId => {
      let est = ESTATES.find(e => e.id === estId);
      if (est) passiveIncome += est.income;
    });
    player.coins += passiveIncome;
    log(`💰 Ваша родовая недвижимость принесла ежегодный доход: <b>+${passiveIncome} монет</b>.`);
  }

  // Рождение ребенка через 1 год с генетическим потенциалом
  if (player.pregnancy) {
    const isMale = Math.random() > 0.5;
    const list = isMale ? SYLLABLES.male : SYLLABLES.female;
    const childName = list[Math.floor(Math.random() * list.length)];

    // Генетический прирост потенциала ребенка
    let childPotentialRoll = Math.random();
    let bonusMult = 1.0;
    if (childPotentialRoll < 0.60) {
      bonusMult = 1.12; // 60% шанс: на 12% сильнее отца
    } else if (childPotentialRoll < 0.90) {
      bonusMult = 1.0;  // 30% шанс: равен отцу
    } else {
      bonusMult = 1.35; // 10% шанс: гений поколения (+35% силы!)
    }

    const child = {
      id: "child_" + Date.now(),
      name: `${childName} ${player.surname}`,
      gender: isMale ? "male" : "female",
      birthYear: currentWorldYear,
      cp: Math.round(500 * bonusMult),
      potentialMult: bonusMult,
      role: bonusMult > 1.3 ? "Наследник рода (Вундеркинд ⭐)" : "Наследник рода",
      relation: 100,
      status: "Семья",
      isFamily: true,
      isChild: true
    };

    player.children.push(child);
    player.relations.push(child);
    log(`🎉 <b>Пополнение в семье!</b> Родился ребенок — <b>${child.name}</b> (${child.gender === 'male' ? 'Сын' : 'Дочь'})! ${bonusMult > 1.3 ? 'Звезды благоволят ему: невероятный потенциал гения!' : ''}`);
    player.pregnancy = null;
  }

  // Выбор стороны в Войне Судеб (Хитогами против Орстеда в 16 лет)
  if (player.age === 16 && player.dynastyFaction === "neutral") {
    triggerRandomEvent({
      icon: "⚖️",
      title: "Судьбоносный раскол: Хитогами или Орстед?",
      desc: "Вам снится белый туман. Голос Хитогами манит легким могуществом, а ледяной взор Бога Драконов Орстеда обещает истинную правду о Шестиликом Мире. Ваш выбор определит путь всей династии на века вперед!",
      choices: [
        {
          text: "👁️ Присягнуть Богу Людей (Хитогами)",
          action: (p) => {
            p.dynastyFaction = "hitogami";
            p.coins += 200; p.magicExp += 30; p.factionProgress = (p.factionProgress || 0) + 50;
            return "Вы доверились Хитогами. Он одарил вас богатством, но впереди бесконечная война против Драконьего племени.";
          }
        },
        {
          text: "🐉 Встать под знамена Бога Драконов (Орстеда)",
          action: (p) => {
            p.dynastyFaction = "orsted";
            p.swordGodExp += 35; p.maxHp += 20; p.factionProgress = (p.factionProgress || 0) + 50;
            return "Вы поклялись разрушить козни Хитогами вместе с Орстедом. Путь будет тяжелым, но славным для ваших потомков.";
          }
        },
        {
          text: "⚖️ Сохранить нейтралитет смертного",
          action: () => "Вы отвергли зов обоих богов, решив прожить простую земную жизнь."
        }
      ]
    });
    return;
  }

  // Старение
  if (player.age > (player.maxAge - 15)) {
    let decay = Math.floor(Math.random() * 12) + 6;
    player.hp -= decay;
    log(`Старость берет свое: ломота в костях (-${decay} HP).`);
  }

  if (player.hp <= 0 || player.age >= player.maxAge) {
    handleDeath(player.hp <= 0 ? "Смерть от ран и истощения сил" : "Мирная кончина от глубокой старости");
    return;
  }

  // Приглашение в школу по возрасту
  if (!player.enrolledSchool) {
    for (let sch of SCHOOLS) {
      if (player.age === sch.minAge && !player.graduatedSchools.includes(sch.id)) {
        triggerRandomEvent({
          icon: "📜",
          title: `Приглашение из ${sch.name}!`,
          desc: `Вам исполнилось ${player.age} лет! Почтальон доставил гербовый конверт: вас приглашают стать студентом заведения (${sch.region}). Стоимость обучения: ${sch.cost}🪙.`,
          choices: [
            {
              text: `Принять приглашение и оплатить (${sch.cost}🪙)`,
              action: (p) => {
                if (p.coins < sch.cost) return "У вас не хватило денег на взнос. Поступление отложено.";
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

  // Редкий спавн каноничных героев
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
          socialClass: "Легендарный герой",
          cp: c.cp,
          relation: 65,
          status: "Друг",
          isCanon: true
        });
        log(`⭐ <b>Судьбоносная встреча!</b> Судьба свела вас с: <b>${c.name}</b> (${c.role})!`);
      }
    }
  });

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
    "Год пролетел за повседневными делами, тренировками и беседами у очага.",
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
      <div>🏰 Владений рода: <b>${player.estates ? player.estates.length : 0}</b></div>
      <div>👶 Наследников: <b>${player.children.length}</b></div>
    </div>
  `;

  const heirsBlock = document.getElementById("heirs-list");
  heirsBlock.innerHTML = "";

  if (player.children && player.children.length > 0) {
    document.getElementById("heir-selection-block").style.display = "block";
    player.children.forEach(child => {
      const childRealAge = Math.max(1, currentWorldYear - (child.birthYear || (currentWorldYear - 20)));
      const hCard = document.createElement("div");
      hCard.className = "shop-item";
      hCard.innerHTML = `
        <div>
          <b style="color:#fff;">${child.name}</b>
          <div style="font-size:11px; color:var(--muted);">${child.gender === 'male' ? 'Сын' : 'Дочь'} • Возраст: <b>${childRealAge} лет</b> • ${child.role}</div>
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
    manaBonus: Math.floor(player.maxMana * 0.20),
    swordGod: Math.floor(player.swordGodExp * 0.25),
    coins: inheritedCoins,
    int: 12,
    log: `Вы продолжили славный род ${player.surname}. Вам уже ${realAge} лет. Поместья предка и семейное золото перешли к вам.`
  };

  const oldEstates = player.estates || [];
  const oldFaction = player.dynastyFaction;
  const oldFactionProg = player.factionProgress || 0;

  document.getElementById("death-overlay").style.display = "none";
  
  initCharacter(child.name.split(" ")[0], player.surname, raceObj, player.currentRegionKey, originMock, player.trait, realAge);
  
  // Сохранение унаследованной недвижимости и стороны в Войне Судеб
  player.estates = oldEstates;
  player.dynastyFaction = oldFaction;
  player.factionProgress = oldFactionProg;
}

function startNewDynasty() {
  const newKarma = addReincarnationKarma();
  document.getElementById("death-overlay").style.display = "none";
  dynastyGeneration = 1;
  currentWorldYear = START_YEAR;
  localStorage.removeItem("bit_tensei_save");
  alert(`🌀 Душа вернулась в Колесо Сансары! Накоплена Карма ${newKarma}-го уровня. Следующая жизнь начнется с повышенными характеристиками!`);
  showCreation();
}

function confirmReset() {
  if (confirm("Завершить текущую жизнь и начать новую династию с чистого листа?")) {
    startNewDynasty();
  }
}

// ------------------------------------------
// 11. ШКОЛЫ И АКАДЕМИИ
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
    if (isGraduated) btnText = "✓ Окончено с отличием";
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
// 12. СОХРАНЕНИЕ И ЗАГРУЗКА
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
