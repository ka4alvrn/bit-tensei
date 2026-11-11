const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

let player = null;
let dynastyGeneration = 1;

// ==================== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ====================

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  document.getElementById(`tab-${tabId}`).classList.add('active');

  const navIndex = tabId === 'character' ? 0 : tabId === 'relations' ? 1 : 2;
  document.querySelectorAll('.nav-item')[navIndex].classList.add('active');

  if (tabId === 'relations') renderRelations();

  tg?.HapticFeedback?.selectionChanged();
}

// ==================== СИСТЕМА СОХРАНЕНИЯ ====================

function saveGame() {
  if (!player) return;
  const saveData = {
    player: player,
    dynastyGeneration: dynastyGeneration,
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

function clearSaveAndRestart() {
  localStorage.removeItem("bit_tensei_save");
  dynastyGeneration++;
  showCreation();
}

// ==================== СОЗДАНИЕ ПЕРСОНАЖА ====================

function showCreation() {
  populateRegionSelect();
  document.getElementById("creation-overlay").style.display = "flex";
}

function populateRegionSelect() {
  const regSelect = document.getElementById("select-region");
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
  const names = ["Рудеус", "Сильфи", "Клифф", "Эрис", "Пол", "Зенит", "Гилен", "Руджерд", "Норн", "Айша", "Люк", "Бадигади"];
  const randName = names[Math.floor(Math.random() * names.length)];
  const regKeys = Object.keys(REGIONS);
  const randRegKey = regKeys[Math.floor(Math.random() * regKeys.length)];
  const region = REGIONS[randRegKey];
  const randOrigin = region.origins[Math.floor(Math.random() * region.origins.length)];
  const trait = rollTrait();

  initCharacter(randName, randRegKey, randOrigin, trait);
  document.getElementById("creation-overlay").style.display = "none";
}

function generateInitialFamily(regionKey, origin) {
  let fatherName = "Пол";
  let motherName = "Зенит";
  let fatherRole = "Отец • Мечник";
  let motherRole = "Мать • Целительница";

  if (regionKey === "asura" && origin.id.includes("boreas")) {
    fatherName = "Филипп Бореас Грейрат";
    motherName = "Хильда";
    fatherRole = "Отец • Мэр города Роа";
    motherRole = "Мать • Знатная дама";
  } else if (regionKey === "demon") {
    fatherName = "Рокко Мигурд";
    motherName = "Рокалия";
    fatherRole = "Отец • Старейшина деревни";
    motherRole = "Мать • Травница";
  }

  return [
    { id: "father", name: fatherName, role: fatherRole, relation: 80 },
    { id: "mother", name: motherName, role: motherRole, relation: 95 }
  ];
}

function initCharacter(name, regionKey, origin, trait) {
  let baseMana = 20 + (origin.mana || 0) + (trait.mana || 0);

  player = {
    name: name,
    generation: dynastyGeneration,
    regionKey: regionKey,
    region: REGIONS[regionKey].name,
    origin: origin.name,
    trait: trait,
    age: 0,
    mana: baseMana,
    maxMana: baseMana,
    magic: "Новичок",
    magicExp: 0,
    sword: "Нет",
    swordExp: (origin.sword || 0) + (trait.sword || 0),
    intellect: 10 + (origin.int || 0) + (trait.int || 0),
    coins: origin.coins || 0,
    relations: generateInitialFamily(regionKey, origin)
  };

  document.getElementById("logs").innerHTML = "";
  log(`🌍 Вы родились: <b>${player.region}</b>`);
  log(origin.log);
  log(`✨ Врожденный дар: <b class="tag badge-${trait.rarity}">${trait.name}</b> (${trait.desc})`);
  
  renderUI();
  saveGame();
}

// ==================== ОТНОШЕНИЯ (NPC) ====================

function renderRelations() {
  const container = document.getElementById("relations-list");
  container.innerHTML = "";

  if (!player || !player.relations) return;

  player.relations.forEach(npc => {
    const card = document.createElement("div");
    card.className = "relation-card";
    card.innerHTML = `
      <div class="rel-header">
        <div>
          <div class="rel-name">${npc.name}</div>
          <div class="rel-role">${npc.role}</div>
        </div>
        <div style="font-size:12px; font-weight:700; color:var(--green);">${npc.relation}%</div>
      </div>
      <div class="bar-bg">
        <div class="bar-fill bar-relation" style="width: ${npc.relation}%;"></div>
      </div>
      <div class="rel-actions">
        <button class="rel-btn" onclick="talkNPC('${npc.id}')">💬 Поговорить</button>
        <button class="rel-btn" onclick="trainWithNPC('${npc.id}')">⚔️ Учиться</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function talkNPC(id) {
  const npc = player.relations.find(n => n.id === id);
  if (!npc) return;

  npc.relation = Math.min(100, npc.relation + 5);
  log(`Вы тепло пообщались с ${npc.name}. Отношения улучшились (+5%)!`);
  renderRelations();
  updateUI();
  switchTab('character');
}

function trainWithNPC(id) {
  const npc = player.relations.find(n => n.id === id);
  if (!npc) return;

  if (player.age < 3) {
    log(`${npc.name} с улыбкой говорит, что вы еще слишком малы для суровых тренировок.`);
  } else {
    npc.relation = Math.min(100, npc.relation + 3);
    player.swordExp += 10;
    log(`${npc.name} преподал вам урок дисциплины и стоек! (+Опыт меча)`);
  }
  renderRelations();
  updateUI();
  switchTab('character');
}

// ==================== ИГРОВАЯ ЛОГИКА ====================

function log(msg) {
  const box = document.getElementById("logs");
  const el = document.createElement("div");
  el.className = "log-entry";
  el.innerHTML = `<span class="log-year">[${player.age} лет]</span> ${msg}`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  tg?.HapticFeedback?.impactOccurred('light');
}

function renderUI() {
  if (!player) return;
  document.getElementById("char-name").innerText = player.name;
  document.getElementById("char-gen").innerText = `Поколение ${player.generation}`;
  document.getElementById("char-region").innerText = player.region;
  
  const traitEl = document.getElementById("char-trait");
  traitEl.innerText = player.trait.name;
  traitEl.className = `tag badge-${player.trait.rarity}`;

  document.getElementById("age").innerText = `${player.age} лет`;
  document.getElementById("mana-text").innerText = `${player.mana}/${player.maxMana}`;
  document.getElementById("mana-bar").style.width = Math.min(100, (player.mana / player.maxMana) * 100) + "%";
  document.getElementById("magic").innerText = player.magic;
  document.getElementById("sword").innerText = player.sword;
  document.getElementById("intellect").innerText = player.intellect;
  document.getElementById("coins").innerText = player.coins;
}

function updateUI() {
  renderUI();
  saveGame();
}

function trainMana() {
  let bonus = (player.trait.id === "laplace_factor") ? 15 : 6;
  player.maxMana += bonus; player.mana = player.maxMana; player.magicExp += 15;

  if (player.magicExp >= 50 && player.magic === "Новичок") {
    player.magic = "Рядовой 🥉";
    log("🎉 Вы освоили средний круг магии без палочки! Ранг: <b>Рядовой</b>!");
  } else if (player.magicExp >= 150 && player.magic === "Рядовой 🥉") {
    player.magic = "Святой 🌟";
    log("⚡ Сквозь тучи ударила молния! Вы признаны <b>Магом Святого Класса</b>!");
  } else {
    log(`Вы концентрировали ману в ладонях (+${bonus} к макс. мане).`);
  }
  updateUI();
  switchTab('character');
}

function trainSword() {
  player.swordExp += 15;
  if (player.swordExp >= 45 && player.sword === "Нет") {
    player.sword = "Бог Меча (Ученик) 🗡️";
    log("Вы освоили длинный выпад Стиля Бога Меча!");
  } else {
    log("Вы отрабатывали удары деревянным клинком до кровавых мозолей.");
  }
  updateUI();
  switchTab('character');
}

function readBook() {
  player.intellect += 4;
  log("Вы изучали старинные свитки и карты континентов (+4 к знаниям).");
  updateUI();
  switchTab('character');
}

function explore() {
  let roll = Math.random();
  if (roll > 0.5) {
    let found = Math.floor(Math.random() * 20) + 5;
    player.coins += found;
    log(`В ходе вылазки вы нашли мешочек с монетами (+${found} монет).`);
  } else {
    log("Вы исследовали местные окрестности и примечали повадки зверей.");
  }
  updateUI();
  switchTab('character');
}

function ageUp() {
  player.age++;
  let growth = Math.floor(player.maxMana * 0.12);
  player.maxMana += growth;
  player.mana = player.maxMana;

  // Динамическое появление персонажей в жизни
  if (player.age === 4) {
    if (!player.relations.some(n => n.id === "sylphie")) {
      player.relations.push({ id: "sylphie", name: "Сильфиетта", role: "Подруга детства • Эльфийка", relation: 70 });
      log("🟢 Вы спасли застенчивую зеленоволосую девочку от хулиганов! Сильфиетта теперь ваш друг.");
    }
  } else if (player.age === 5) {
    if (!player.relations.some(n => n.id === "roxy")) {
      player.relations.push({ id: "roxy", name: "Рокси Мигурдия", role: "Наставница • Маг Святого Ранга", relation: 65 });
      log("🧙‍♂️ В дом прибыла репетитор по магии из расы демонов — Рокси Мигурдия!");
    }
  } else if (player.age === 7) {
    log("Вам исполнилось 7 лет — пора делать первые шаги на пути воина или мага.");
  } else if (player.age === 10) {
    log("⚠️ В небесах раздался глухой гул... Плотность маны в атмосфере зашкаливает.");
  } else {
    const events = [
      "Год упорных тренировок и познания таинств мира.",
      "Вы помогали семье по хозяйству, укрепляя тело и выносливость.",
      "Спокойный год за чтением книг в тишине."
    ];
    log(events[Math.floor(Math.random() * events.length)]);
  }

  updateUI();
}

if (!loadGame()) {
  showCreation();
}
