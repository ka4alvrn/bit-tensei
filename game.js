const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

let player = null;
let dynastyGeneration = 1;

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
  const names = ["Рудеус", "Сильфи", "Клифф", "Эрис", "Пол", "Зенит", "Гилен", "Руджерд", "Норн", "Айша", "Люк", "Бадигади", "Линия", "Пурсена"];
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
    coins: origin.coins || 0
  };

  document.getElementById("logs").innerHTML = "";
  log(`🌍 Вы родились: <b>${player.region}</b>`);
  log(origin.log);
  log(`✨ Врожденный дар: <b class="tag badge-${trait.rarity}">${trait.name}</b> (${trait.desc})`);
  updateUI();
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

function updateUI() {
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
    log(`Вы концентрировали ману в кончиках пальцев (+${bonus} к макс. мане).`);
  }
  updateUI();
}

function trainSword() {
  player.swordExp += 15;
  if (player.swordExp >= 45 && player.sword === "Нет") {
    player.sword = "Бог Меча (Ученик) 🗡️";
    log("Вы освоили длинный выпад и базовую стойку Стиля Бога Меча!");
  } else {
    log("Вы отрабатывали удары деревянным клинком до кровавых мозолей.");
  }
  updateUI();
}

function readBook() {
  player.intellect += 4;
  log("Вы изучали старинные свитки и карты континентов (+4 к знаниям).");
  updateUI();
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
}

function ageUp() {
  player.age++;
  let growth = Math.floor(player.maxMana * 0.12);
  player.maxMana += growth;
  player.mana = player.maxMana;

  if (player.age === 3) log("Вы впервые осознанно применили стихию, удивив окружающих.");
  else if (player.age === 7) log("Вам исполнилось 7 лет — пора делать первые шаги на пути воина или мага.");
  else if (player.age === 10) log("⚠️ В небесах раздался глухой гул... Плотность маны в атмосфере зашкаливает.");
  else {
    const events = [
      "Год упорных тренировок и познания таинств мира.",
      "Вы помогали семье по хозяйству, укрепляя тело и выносливость.",
      "Спокойный год за чтением книг в тишине."
    ];
    log(events[Math.floor(Math.random() * events.length)]);
  }
  updateUI();
}

showCreation();
