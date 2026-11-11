const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

let player = null;
let dynastyGeneration = 1;
let currentSelectedNPC = null;

function rollTrait() {
  const totalWeight = TRAITS.reduce((sum, t) => sum + t.weight, 0);
  let randomNum = Math.random() * totalWeight;
  for (let trait of TRAITS) {
    if (randomNum < trait.weight) return trait;
    randomNum -= trait.weight;
  }
  return TRAITS[0];
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

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.add('active');

  const navIndex = tabId === 'character' ? 0 : tabId === 'relations' ? 1 : 2;
  const navItems = document.querySelectorAll('.nav-item');
  if (navItems[navIndex]) navItems[navIndex].classList.add('active');

  if (tabId === 'relations') renderRelations();
  tg?.HapticFeedback?.selectionChanged();
}

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
  if (!REGIONS[regKey]) return;
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
  const names = ["Рудеус", "Сильфи", "Клифф", "Эрис", "Пол", "Зенит", "Гилен", "Руджерд", "Норн", "Айша"];
  const randName = names[Math.floor(Math.random() * names.length)];
  const regKeys = Object.keys(REGIONS);
  const randRegKey = regKeys[Math.floor(Math.random() * regKeys.length)];
  const region = REGIONS[randRegKey];
  const randOrigin = region.origins[Math.floor(Math.random() * region.origins.length)];
  const trait = rollTrait();

  initCharacter(randName, randRegKey, randOrigin, trait);
  document.getElementById("creation-overlay").style.display = "none";
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
    relations: [
      { id: "father", name: "Отец", gender: "male", role: "Глава семьи", relation: 80, status: "Семья", isFamily: true },
      { id: "mother", name: "Мать", gender: "female", role: "Хранительница очага", relation: 95, status: "Семья", isFamily: true }
    ],
    spouse: null,
    children: []
  };

  document.getElementById("logs").innerHTML = "";
  log(`🌍 Вы родились: <b>${player.region}</b>`);
  log(origin.log);
  log(`✨ Врожденный дар: <b class="tag badge-${trait.rarity}">${trait.name}</b> (${trait.desc})`);
  
  renderUI();
  saveGame();
}

function renderRelations() {
  const container = document.getElementById("relations-list");
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
  btnContainer.innerHTML += `<button onclick="actionGift()">🎁 Подарок (10🪙)</button>`;
  btnContainer.innerHTML += `<button class="action-danger" onclick="actionInsult()">⚔️ Оскорбить / Дуэль</button>`;

  if (!npc.isFamily && !npc.isChild) {
    if (player.age >= 14 && npc.status !== "Пара" && npc.status !== "Супруг/Супруга") {
      btnContainer.innerHTML += `<button class="action-love" onclick="actionConfess()">❤️ Флирт / Признание</button>`;
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

  if (npc.relation < 25) {
    log(`${npc.name} с презрением отворачивается: "Убирайся с глаз моих!"`);
  } else {
    npc.relation = Math.min(100, npc.relation + 6);
    if (npc.relation >= 60 && npc.status === "Знакомый") npc.status = "Друг";
    log(`Вы душевно побеседовали с <b>${npc.name}</b> (+6% к отношениям).`);
  }
  closeNPCModal();
  updateUI();
  switchTab('character');
}

function actionGift() {
  const npc = currentSelectedNPC;
  if (!npc) return;

  if (player.coins < 10) {
    alert("У вас недостаточно монет (нужно 10🪙)!");
    return;
  }
  player.coins -= 10;
  npc.relation = Math.min(100, npc.relation + 15);
  if (npc.relation >= 30 && npc.status === "Заклятый враг") npc.status = "Знакомый";
  log(`Вы преподнесли подарок для <b>${npc.name}</b> (+15% к отношениям)!`);
  closeNPCModal();
  updateUI();
  switchTab('character');
}

function actionInsult() {
  const npc = currentSelectedNPC;
  if (!npc) return;

  npc.relation = Math.max(0, npc.relation - 30);
  if (npc.relation <= 25) npc.status = "Заклятый враг";

  if (Math.random() > 0.5) {
    player.swordExp += 10;
    log(`Ссора с <b>${npc.name}</b> переросла в дуэль! Вы получили боевой опыт.`);
  } else {
    log(`Вы жестоко унизили <b>${npc.name}</b>. Теперь между вами кровная вражда!`);
  }
  closeNPCModal();
  updateUI();
  switchTab('character');
}

function actionConfess() {
  const npc = currentSelectedNPC;
  if (!npc) return;

  if (npc.relation >= 75) {
    npc.status = "Пара";
    log(`💖 <b>${npc.name}</b> отвечает взаимностью! Вы теперь пара!`);
  } else {
    npc.relation = Math.max(0, npc.relation - 10);
    log(`💔 <b>${npc.name}</b>: "Ты замечательный человек, но давай останемся друзьями..."`);
  }
  closeNPCModal();
  updateUI();
  switchTab('character');
}

function actionMarry() {
  const npc = currentSelectedNPC;
  if (!npc) return;

  if (npc.relation >= 90) {
    npc.status = "Супруг/Супруга";
    player.spouse = npc;
    log(`💍 Свадьба! Вы и <b>${npc.name}</b> связали свои судьбы узами брака!`);
  } else {
    log(`${npc.name} считает, что вы торопите события. Укрепите доверие!`);
  }
  closeNPCModal();
  updateUI();
  switchTab('character');
}

function actionHaveChild() {
  const npc = currentSelectedNPC;
  if (!npc) return;

  const childGender = Math.random() > 0.5 ? "male" : "female";
  const childNames = childGender === "male" ? ["Зик", "Арси", "Люсиен", "Лео"] : ["Люси", "Лара", "Крис", "Эмили"];
  const childName = childNames[Math.floor(Math.random() * childNames.length)];

  const child = {
    id: "child_" + Date.now(),
    name: `${childName} ${player.name.split(" ")[1] || ""}`,
    gender: childGender,
    role: "Новорожденный наследник",
    relation: 100,
    status: "Семья",
    isFamily: true,
    isChild: true
  };

  player.children.push(child);
  player.relations.push(child);
  log(`🎉 Родился наследник — <b>${child.name}</b>! Продолжатель рода.`);
  closeNPCModal();
  updateUI();
  switchTab('character');
}

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
  player.maxMana += bonus; 
  player.mana = player.maxMana; 
  player.magicExp += 15;

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

  CANON_NPCS.forEach(c => {
    if (player.age === c.minAge && !player.relations.some(r => r.id === c.id)) {
      if (Math.random() > 0.3) {
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
        log(`⭐ **Судьбоносная встреча!** В вашей жизни появляется легендарный герой: <b>${c.name}</b> (${c.role})!`);
      }
    }
  });

  const events = [
    "Год упорных тренировок и постижения таинств мира.",
    "Вы помогали местным жителям, укрепляя тело и дух.",
    "Спокойный год за чтением книг в тишине."
  ];
  log(events[Math.floor(Math.random() * events.length)]);

  updateUI();
}

// Запуск игры
if (!loadGame()) {
  showCreation();
}
