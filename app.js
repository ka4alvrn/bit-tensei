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
let currentActivityCategory = "story";
let currentShopCategory = "all";
let creationGender = "male";

// ------------------------------------------
// 0. ЗВУКОВОЙ ДВИЖОК (Web Audio API)
// ------------------------------------------
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "sword") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "magic") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.22);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === "coin") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(987, now);
      osc.frequency.setValueAtTime(1318, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "win") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.1);
      osc.frequency.setValueAtTime(784, now + 0.2);
      osc.frequency.setValueAtTime(1046, now + 0.3);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === "death" || type === "calamity") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById("btn-sound-toggle");
  if (btn) {
    btn.innerText = soundEnabled ? "🔊 Звук: ВКЛ" : "🔇 Звук: ВЫКЛ";
  }
  if (soundEnabled) playSound("click");
}

// ------------------------------------------
// 1. КАРМА, СИЛА И ХАРАКТЕРИСТИКИ
// ------------------------------------------

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

  // Демонические глаза
  if (p.demonEyes?.left) cp += p.demonEyes.left.cp || 0;
  if (p.demonEyes?.right) cp += p.demonEyes.right.cp || 0;

  // Штрафы за травмы
  if (p.injuries && p.injuries.length > 0) {
    p.injuries.forEach(inj => {
      if (inj.id === "lost_arm" && (!p.equipment.accessory || p.equipment.accessory.id !== "prosthetic_arm")) {
        cp = Math.floor(cp * 0.7);
      }
    });
  }

  const karma = getReincarnationKarma();
  if (karma > 0) {
    cp = Math.floor(cp * (1 + karma * 0.05));
  }

  const maxCap = GENERATION_CP_CAPS[p.generation] || 9999999;
  return Math.min(maxCap, Math.floor(cp));
}

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
// 2. СОЗДАНИЕ ПЕРСОНАЖА
// ------------------------------------------

function setCreationGender(g) {
  creationGender = g;
  document.getElementById("btn-gender-male").classList.toggle("active", g === "male");
  document.getElementById("btn-gender-female").classList.toggle("active", g === "female");
  randomizeNameInputs();
  playSound("click");
}

function randomizeNameInputs() {
  const list = creationGender === "male" ? SYLLABLES.male : SYLLABLES.female;
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
  const fName = document.getElementById("input-name").value.trim() || (creationGender === "male" ? "Рудеус" : "Эрис");
  const sName = document.getElementById("input-surname").value.trim() || "Грейрат";
  const raceKey = document.getElementById("select-race").value;
  const regKey = document.getElementById("select-region").value;
  const origId = document.getElementById("select-origin").value;
  const traitId = document.getElementById("select-trait").value;

  const race = RACES[raceKey];
  const origin = REGIONS[regKey].origins.find(o => o.id === origId);
  const trait = TRAITS.find(t => t.id === traitId);

  initCharacter(fName, sName, creationGender, race, regKey, origin, trait, 0);
  document.getElementById("creation-overlay").style.display = "none";
  playSound("win");
}

function randomCreation() {
  creationGender = Math.random() > 0.5 ? "male" : "female";
  document.getElementById("btn-gender-male").classList.toggle("active", creationGender === "male");
  document.getElementById("btn-gender-female").classList.toggle("active", creationGender === "female");
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

  initCharacter(fName, sName, creationGender, randRace, randRegKey, randOrigin, randTrait, 0);
  document.getElementById("creation-overlay").style.display = "none";
  playSound("win");
}

function initCharacter(fName, sName, gender, race, regionKey, origin, trait, startAge = 0) {
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
    gender: gender,
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
    demonEyes: { left: null, right: null },
    currentJob: null,
    jobRankIndex: 0,
    nobilityTitle: "citizen",
    asuraFaction: null,
    asuraInfluence: 0,
    calamityTriggered: false,
    storyCompleted: [],
    dynastyFaction: player?.dynastyFaction || "neutral",
    factionProgress: player?.factionProgress || 0,
    pregnancy: null,
    equipment: { weapon: null, armor: null, accessory: null },
    inventory: [],
    potionsCount: 2,
    relations: [
      { id: "father", name: fatherName, gender: "male", role: "Отец • Глава дома", cp: 1200, relation: 85, status: "Семья", isFamily: true, isLost: false },
      { id: "mother", name: motherName, gender: "female", role: "Мать • Хранительница", cp: 800, relation: 95, status: "Семья", isFamily: true, isLost: false }
    ],
    spouse: null,
    children: []
  };

  generateYearlyGuildQuests();

  document.getElementById("logs").innerHTML = "";
  log(`🌍 Вы воплотились как <b>${player.race}</b> (${player.gender === 'male' ? 'Мужчина' : 'Женщина'}) в <b>${REGIONS[player.currentRegionKey].name}</b> (${currentWorldYear} г. К.Д.).`);
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
    <div>👶 Имя: <b>${player.name}</b> (${player.gender === 'male' ? '♂️ Мужчина' : '♀️ Женщина'}, Поколение ${player.generation})</div>
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
  playSound("click");
}

// ------------------------------------------
// 3. UI И ИНТЕРФЕЙС
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
  if (tabId === 'relations') { renderRelations(); renderTravelTab(); renderSchools(); renderPolitics(); renderDynastyTree(); }
  playSound("click");
}

function setActivityCategory(cat, btnEl) {
  currentActivityCategory = cat;
  document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderActivities();
  playSound("click");
}

function setShopCategory(cat, btnEl) {
  currentShopCategory = cat;
  if (btnEl) {
    btnEl.parentElement.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }
  renderInventoryTab();
  playSound("click");
}

function setWorldSubTab(sub, btnEl) {
  const tabs = ['relations', 'politics', 'tree', 'travel', 'schools'];
  tabs.forEach(t => {
    const el = document.getElementById(`world-sub-${t}`);
    if (el) el.style.display = (t === sub) ? 'block' : 'none';
  });

  if (btnEl) {
    btnEl.parentElement.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }

  if (sub === 'relations') renderRelations();
  if (sub === 'politics') renderPolitics();
  if (sub === 'tree') renderDynastyTree();
  if (sub === 'travel') renderTravelTab();
  if (sub === 'schools') renderSchools();
  playSound("click");
}

function renderUI() {
  if (!player) return;

  document.getElementById("char-gender-icon").innerText = player.gender === "male" ? "♂️" : "♀️";
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
    capHint.innerText = cp >= cap ? `[Предел ${player.generation}-го поколения: ${cap.toLocaleString()}]` : `Потолок ${player.generation}-го рода: ${cap.toLocaleString()}`;
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

  // Демонические глаза
  const eyeL = document.getElementById("eye-left");
  const eyeR = document.getElementById("eye-right");
  if (player.demonEyes?.left) {
    eyeL.className = "eye-slot active";
    eyeL.innerText = player.demonEyes.left.name;
  } else {
    eyeL.className = "eye-slot";
    eyeL.innerText = "👁️ Левый: Обычный";
  }

  if (player.demonEyes?.right) {
    eyeR.className = "eye-slot active";
    eyeR.innerText = player.demonEyes.right.name;
  } else {
    eyeR.className = "eye-slot";
    eyeR.innerText = "👁️ Правый: Обычный";
  }

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

  // Бейджи работы и интриг
  const jobBox = document.getElementById("job-badge-container");
  if (player.currentJob) {
    const jobData = getJobDataById(player.currentJob);
    const rankObj = jobData?.ranks[player.jobRankIndex];
    jobBox.innerHTML = `<span style="font-size:10px; background:#1e293b; border:1px solid #38bdf8; color:#7dd3fc; padding:2px 6px; border-radius:4px;">💼 ${rankObj?.title || 'Служащий'} (+${rankObj?.salary || 0}🪙/г.)</span>`;
  } else {
    jobBox.innerHTML = `<span style="font-size:10px; color:var(--muted);">💼 Без постоянной службы</span>`;
  }

  const polBox = document.getElementById("politics-badge-container");
  const titleObj = ASURA_POLITICS.nobilityTitles.find(t => t.id === player.nobilityTitle);
  let factionName = "Вне политики";
  if (player.asuraFaction === "ariel") factionName = "Сторонник Ариэль 👑";
  if (player.asuraFaction === "prince_first") factionName = "Партия 1-го Принца 🦁";
  if (player.asuraFaction === "prince_second") factionName = "Партия 2-го Принца 🐍";
  polBox.innerHTML = `<span style="font-size:10px; background:#2e1065; border:1px solid #a855f7; color:#e9d5ff; padding:2px 6px; border-radius:4px;">👑 Титул: ${titleObj?.name} • ${factionName} (Влияние: ${player.asuraInfluence})</span>`;

  // Катаклизм статус
  const calBanner = document.getElementById("calamity-status-banner");
  const lostFamily = player.relations.filter(r => r.isLost);
  if (player.calamityTriggered && lostFamily.length > 0) {
    calBanner.style.display = "block";
    calBanner.innerHTML = `<div style="background:#450a0a; border:1px solid #ef4444; border-radius:8px; padding:6px; font-size:11px; color:#fca5a5;">⚡ <b>Катаклизм Фитоа продолжается:</b> Пропали без вести: ${lostFamily.map(r => r.name).join(", ")}. Ищите их в городах!</div>`;
  } else {
    calBanner.style.display = "none";
  }

  const facBox = document.getElementById("faction-badge-container");
  if (player.dynastyFaction === "hitogami") {
    facBox.innerHTML = `<span style="font-size:10px; background:#450a0a; border:1px solid #ef4444; color:#fca5a5; padding:2px 6px; border-radius:4px;">👁️ Апостол Хитогами (${player.factionProgress || 0}/1000)</span>`;
  } else if (player.dynastyFaction === "orsted") {
    facBox.innerHTML = `<span style="font-size:10px; background:#064e3b; border:1px solid #10b981; color:#a7f3d0; padding:2px 6px; border-radius:4px;">🐉 Подчиненный Орстеда (${player.factionProgress || 0}/1000)</span>`;
  } else {
    facBox.innerHTML = "";
  }

  document.getElementById("magic").innerText = calculateRank(player.magicExp, MAGIC_RANKS);
  document.getElementById("sword-god").innerText = calculateRank(player.swordGodExp, SWORD_RANKS);
  document.getElementById("water-god").innerText = calculateRank(player.waterGodExp, SWORD_RANKS);
  document.getElementById("north-god").innerText = calculateRank(player.northGodExp, SWORD_RANKS);
  document.getElementById("intellect").innerText = player.intellect;
  document.getElementById("coins").innerText = player.coins;

  document.getElementById("slot-weapon").innerText = player.equipment?.weapon ? player.equipment.weapon.name : "Кулаки";
  document.getElementById("slot-armor").innerText = player.equipment?.armor ? player.equipment.armor.name : "Одежда";
  document.getElementById("slot-accessory").innerText = player.equipment?.accessory ? player.equipment.accessory.name : "Нет";
}

function updateUI() {
  renderUI();
  saveGame();
}

// ------------------------------------------
// 4. ДЕЛА, СЮЖЕТ И ПОСТОЯННАЯ РАБОТА
// ------------------------------------------

function renderActivities() {
  const container = document.getElementById("activities-container");
  container.innerHTML = "";

  // 1. Сюжетные активности эпохи
  if (currentActivityCategory === "story") {
    const availableStories = STORY_ACTIVITIES.filter(s => player.age >= s.age && !player.storyCompleted.includes(s.id));
    if (availableStories.length === 0) {
      container.innerHTML = `<div style="color:var(--muted); text-align:center; padding:20px;">Все ключевые сюжетные вехи текущего возраста пройдены! Взрослейте дальше (кнопка «Прожить 1 год»).</div>`;
      return;
    }
    availableStories.forEach(st => {
      const card = document.createElement("div");
      card.className = "activity-card";
      card.style.borderColor = "var(--gold)";
      card.innerHTML = `
        <div class="act-info">
          <b style="color:var(--gold); font-size:13px;">${st.name} [Возраст: ${st.age}+]</b>
          <div style="font-size:11px; color:var(--text); margin-top:2px;">${st.desc}</div>
        </div>
        <button style="background:linear-gradient(135deg, #b45309, #d97706); margin-top:6px; width:100%;" onclick="performStoryActivity('${st.id}')">
          ✨ Совершить исторический шаг
        </button>
      `;
      container.appendChild(card);
    });
    return;
  }

  // 2. Постоянная работа и карьера
  if (currentActivityCategory === "job") {
    renderJobMarket(container);
    return;
  }

  // 3. Обычные активности
  let list = ACTIVITIES.filter(a => player.age >= a.minAge && player.age <= a.maxAge);
  if (currentActivityCategory !== "all") {
    list = list.filter(a => a.category === currentActivityCategory);
  }

  if (list.length === 0) {
    container.innerHTML = `<div style="color:var(--muted); text-align:center; padding:20px;">Нет доступных дел в этой категории. Переключите фильтр!</div>`;
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

function performStoryActivity(storyId) {
  const st = STORY_ACTIVITIES.find(s => s.id === storyId);
  if (!st) return;

  player.storyCompleted.push(st.id);
  const res = st.action(player);
  log(res);

  if (st.id === "story_10_calamity") {
    playSound("calamity");
  } else {
    playSound("win");
  }

  updateUI();
  renderActivities();
  switchTab('character');
}

function getJobDataById(jobId) {
  for (let reg in REGIONAL_JOBS) {
    const j = REGIONAL_JOBS[reg].find(x => x.id === jobId);
    if (j) return j;
  }
  return null;
}

function renderJobMarket(container) {
  const currentJobsInRegion = REGIONAL_JOBS[player.currentRegionKey] || [];
  
  if (player.currentJob) {
    const jData = getJobDataById(player.currentJob);
    const curRank = jData.ranks[player.jobRankIndex];
    const nextRank = jData.ranks[player.jobRankIndex + 1];

    const card = document.createElement("div");
    card.className = "card";
    card.style.background = "#131b2e";
    card.style.borderColor = "#38bdf8";
    card.innerHTML = `
      <b style="color:#38bdf8; font-size:14px;">💼 Ваша текущая служба: ${jData.name}</b>
      <div style="font-size:12px; color:#fff; margin-top:4px;">Должность: <b>${curRank.title}</b></div>
      <div style="font-size:11px; color:var(--muted);">${curRank.desc}</div>
      <div style="font-size:11px; color:var(--gold); margin-top:4px;">Жалование: <b>+${curRank.salary} 🪙/год</b> (выплачивается автоматически)</div>

      ${nextRank ? `
        <div style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.08); padding-top:8px;">
          <div style="font-size:11px; color:var(--accent-light);">Следующий чин: <b>${nextRank.title}</b> (+${nextRank.salary} 🪙)</div>
          <div style="font-size:10px; color:var(--muted);">Требования: Возраст ${nextRank.minAge}+ ${nextRank.minSword ? `• Меч ${nextRank.minSword}+` : ''} ${nextRank.minMagic ? `• Магия ${nextRank.minMagic}+` : ''} ${nextRank.minInt ? `• Знания ${nextRank.minInt}+` : ''}</div>
          <button style="margin-top:6px; width:100%; background:#2563eb;" onclick="tryJobPromotion()">🎖️ Добиться повышения чина</button>
        </div>
      ` : '<div style="color:var(--gold); font-size:11px; margin-top:6px;">🌟 Вы достигли вершины карьеры!</div>'}

      <button class="action-danger" style="margin-top:8px; width:100%; font-size:11px;" onclick="quitJob()">Подать в отставку</button>
    `;
    container.appendChild(card);
    return;
  }

  container.innerHTML += `<div style="font-size:12px; color:var(--muted); margin-bottom:8px;">Служба в текущем регионе (${REGIONS[player.currentRegionKey].name}):</div>`;

  if (currentJobsInRegion.length === 0) {
    container.innerHTML += `<div style="color:var(--muted); padding:10px;">В этом диком регионе нет постоянных государственных служб.</div>`;
    return;
  }

  currentJobsInRegion.forEach(jb => {
    const firstRank = jb.ranks[0];
    const canApply = player.age >= firstRank.minAge &&
      (!firstRank.minSword || player.swordGodExp >= firstRank.minSword) &&
      (!firstRank.minMagic || player.magicExp >= firstRank.minMagic) &&
      (!firstRank.minInt || player.intellect >= firstRank.minInt);

    const jCard = document.createElement("div");
    jCard.className = "job-card";
    jCard.innerHTML = `
      <div>
        <b style="color:#fff;">${jb.name}</b>
        <div style="font-size:11px; color:var(--muted);">Первый чин: ${firstRank.title} (+${firstRank.salary} 🪙/г.)</div>
        <div style="font-size:10px; color:var(--accent-light);">Мин. возраст: ${firstRank.minAge} лет</div>
      </div>
      <button ${canApply ? '' : 'disabled'} style="background:#1d4ed8;" onclick="applyForJob('${jb.id}')">
        ${canApply ? 'Поступить' : 'Не годен'}
      </button>
    `;
    container.appendChild(jCard);
  });
}

function applyForJob(jobId) {
  const jData = getJobDataById(jobId);
  player.currentJob = jobId;
  player.jobRankIndex = 0;
  log(`💼 Вы успешно поступили на службу: <b>${jData.name}</b> в чине «${jData.ranks[0].title}»! Жалование выплачивается каждый год.`);
  playSound("win");
  updateUI();
  renderActivities();
}

function tryJobPromotion() {
  const jData = getJobDataById(player.currentJob);
  const nextRank = jData.ranks[player.jobRankIndex + 1];
  if (!nextRank) return;

  const meetsAge = player.age >= nextRank.minAge;
  const meetsSword = !nextRank.minSword || player.swordGodExp >= nextRank.minSword;
  const meetsMagic = !nextRank.minMagic || player.magicExp >= nextRank.minMagic;
  const meetsInt = !nextRank.minInt || player.intellect >= nextRank.minInt;

  if (meetsAge && meetsSword && meetsMagic && meetsInt) {
    player.jobRankIndex++;
    log(`🎖️ <b>ПОВЫШЕНИЕ ПО СЛУЖБЕ!</b> Ваш новый чин: <b>${nextRank.title}</b>! Жалование выросло до +${nextRank.salary}🪙/год!`);
    playSound("win");
  } else {
    alert("Вы пока не соответствуете всем требованиям для повышения!");
  }
  updateUI();
  renderActivities();
}

function quitJob() {
  player.currentJob = null;
  player.jobRankIndex = 0;
  log("Вы подали прошение об отставке со службы.");
  playSound("click");
  updateUI();
  renderActivities();
}

function performActivity(actId) {
  const act = ACTIVITIES.find(a => a.id === actId);
  if (!act) return;

  if (player.ap < act.apCost) {
    alert("Вы истощены! Нажмите «Прожить 1 год» для отдыха.");
    return;
  }

  if (act.cost && player.coins < act.cost) {
    alert(`Недостаточно монет! Требуется ${act.cost}🪙`);
    return;
  }

  player.ap -= act.apCost;
  const resultMsg = act.action(player);
  log(resultMsg);

  if (act.category === "combat") playSound("sword");
  else if (act.category === "magic") playSound("magic");
  else playSound("click");

  updateUI();
  switchTab('character');
}

// ------------------------------------------
// 5. ПОЛИТИКА И ИНТРИГИ АСУРЫ
// ------------------------------------------

function renderPolitics() {
  const container = document.getElementById("politics-container");
  if (!container) return;
  container.innerHTML = "";

  const curTitleIdx = ASURA_POLITICS.nobilityTitles.findIndex(t => t.id === player.nobilityTitle);
  const nextTitle = ASURA_POLITICS.nobilityTitles[curTitleIdx + 1];

  container.innerHTML += `
    <div class="card" style="background:#191428; border-color:#9333ea; margin-bottom:10px;">
      <b style="color:#e9d5ff; font-size:13px;">🏛️ Ваш Дворянский Статус</b>
      <div style="font-size:12px; color:#fff; margin-top:2px;">Титул: <b>${ASURA_POLITICS.nobilityTitles[curTitleIdx].name}</b></div>
      <div style="font-size:11px; color:var(--muted);">Политическое влияние рода: <b>${player.asuraInfluence} очков</b></div>

      ${nextTitle ? `
        <button style="margin-top:8px; width:100%; background:#7e22ce; font-size:11px;" onclick="buyNobilityTitle('${nextTitle.id}', ${nextTitle.influence * 10}, ${nextTitle.influence})">
          👑 Приобрести патент: ${nextTitle.name} (${nextTitle.influence * 10}🪙, ${nextTitle.influence} влияния)
        </button>
      ` : '<div style="color:var(--gold); font-size:11px; margin-top:4px;">👑 Вы носите высший герцогский титул Королевства!</div>'}
    </div>
  `;

  container.innerHTML += `<div class="section-title">Претенденты на Трон Королевства Асура</div>`;

  ASURA_POLITICS.factions.forEach(f => {
    const isMyFaction = player.asuraFaction === f.id;
    const fCard = document.createElement("div");
    fCard.className = "card";
    fCard.style.marginBottom = "8px";
    fCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <b style="color:#fff;">${f.icon} ${f.name}</b>
        ${isMyFaction ? '<span class="badge-legendary">Ваш выбор ✓</span>' : ''}
      </div>
      <div style="font-size:11px; color:var(--muted); margin:4px 0;">${f.desc}</div>
      <div style="font-size:10px; color:var(--accent-light);">Сила влияния партии: ${f.power}%</div>

      <div style="display:flex; gap:6px; margin-top:6px;">
        ${!isMyFaction ? `
          <button style="flex:1; background:#4338ca; font-size:10px;" onclick="joinAsuraFaction('${f.id}')">Присягнуть</button>
        ` : `
          <button style="flex:1; background:#059669; font-size:10px;" onclick="supportFaction('${f.id}', 50)">💰 Финансировать кампанию (50🪙, +15 влияния)</button>
        `}
      </div>
    `;
    container.appendChild(fCard);
  });
}

function joinAsuraFaction(fId) {
  player.asuraFaction = fId;
  const f = ASURA_POLITICS.factions.find(x => x.id === fId);
  log(`👑 Вы официально объявили о поддержке: <b>${f.name}</b> в борьбе за трон Асуры!`);
  playSound("win");
  updateUI();
  renderPolitics();
}

function supportFaction(fId, cost) {
  if (player.coins < cost) {
    alert("Недостаточно монет для пожертвования!");
    return;
  }
  player.coins -= cost;
  player.asuraInfluence += 15;
  log(`👑 Вы профинансировали свою партию на +${cost} монет (+15 к политическому влиянию).`);
  playSound("coin");
  updateUI();
  renderPolitics();
}

function buyNobilityTitle(titleId, cost, reqInfluence) {
  if (player.coins < cost) { alert(`Нужно ${cost} монет!`); return; }
  if (player.asuraInfluence < reqInfluence) { alert(`Нужно ${reqInfluence} очков политического влияния!`); return; }

  player.coins -= cost;
  player.nobilityTitle = titleId;
  const tObj = ASURA_POLITICS.nobilityTitles.find(t => t.id === titleId);
  log(`👑 <b>КОРОЛЕВСКИЙ УКАЗ!</b> Вам дарован благородный дворянский титул: <b>${tObj.name}</b>!`);
  playSound("win");
  updateUI();
  renderPolitics();
}

// ------------------------------------------
// 6. ДРЕВО ДИНАСТИИ И ЗАЛ СЛАВЫ
// ------------------------------------------

function getDynastyHistory() {
  return JSON.parse(localStorage.getItem("bit_tensei_history") || "[]");
}

function recordAncestorToHistory(p, deathReason) {
  let hist = getDynastyHistory();
  hist.push({
    gen: p.generation,
    name: p.name,
    gender: p.gender,
    race: p.race,
    peakCp: calcCombatPower(p),
    maxAge: p.age,
    deathReason: deathReason,
    nobility: p.nobilityTitle,
    coinsLeft: p.coins
  });
  localStorage.setItem("bit_tensei_history", JSON.stringify(hist));
}

function renderDynastyTree() {
  const container = document.getElementById("dynasty-tree-container");
  if (!container) return;
  container.innerHTML = "";

  const history = getDynastyHistory();

  container.innerHTML += `
    <div class="tree-node current">
      <div class="tree-gen">👑 Поколение ${player.generation} (Текущий правитель рода)</div>
      <b style="color:#fff; font-size:13px;">${player.name}</b> (${player.gender === 'male' ? '♂️' : '♀️'}, ${player.race})
      <div style="font-size:11px; color:#c7d2fe;">БМ: ${calcCombatPower(player).toLocaleString()} • Возраст: ${player.age} лет</div>
    </div>
  `;

  if (history.length === 0) {
    container.innerHTML += `<div style="color:var(--muted); font-size:11px; text-align:center; padding:15px;">Вы — первый родоначальник династии. Зал предков откроется после первой смены поколений.</div>`;
    return;
  }

  container.innerHTML += `<div class="section-title">Славные Предки Рода</div>`;

  history.slice().reverse().forEach(anc => {
    const node = document.createElement("div");
    node.className = "tree-node";
    node.innerHTML = `
      <div class="tree-gen">📜 Поколение ${anc.gen}</div>
      <b style="color:#fff;">${anc.name}</b> <span style="font-size:10px; color:var(--muted);">(${anc.gender === 'male' ? '♂️' : '♀️'}, ${anc.race})</span>
      <div style="font-size:11px; color:#a78bfa;">Пиковая БМ: ${anc.peakCp.toLocaleString()} • Прожил: ${anc.maxAge} лет</div>
      <div style="font-size:10px; color:var(--muted);">Причина гибели: ${anc.deathReason}</div>
    `;
    container.appendChild(node);
  });
}

// ------------------------------------------
// 7. СЕМЬ ВЕЛИКИХ СИЛ (БИТВЫ И ПЕРМАНЕНТНАЯ СМЕРТЬ)
// ------------------------------------------

function renderPowersMonument() {
  const monCont = document.getElementById("powers-monument-list");
  if (!monCont) return;
  monCont.innerHTML = "";

  const myCp = calcCombatPower(player);

  SEVEN_GREAT_POWERS.forEach(pow => {
    const isPlayerSeat = (pow.isDead && pow.killerDynasty === player.surname);
    const row = document.createElement("div");
    row.className = `power-row ${isPlayerSeat ? 'power-player' : ''}`;
    
    row.innerHTML = `
      <div style="display:flex; align-items:center;">
        <span class="power-rank">#${pow.rank}</span>
        <div>
          <b>${isPlayerSeat ? player.name + ' (ВЫ / ВАШ РОД!)' : pow.title + ' — ' + (pow.isDead ? '💀 ПАЛ: ' + pow.name : pow.name)}</b>
          <div style="font-size:10px; color:var(--muted);">${pow.isDead ? 'Свергнут родом ' + (pow.killerDynasty || 'Грейрат') : 'Мощь: ' + pow.cp.toLocaleString() + ' БМ'}</div>
        </div>
      </div>
      <div>
        ${pow.isDead ? '<span class="badge-mythic">СВЕРГНУТ</span>' : `
          <button class="btn-challenge" ${myCp >= pow.cp * 0.45 ? '' : 'disabled'} onclick="challengeSevenPower(${pow.rank})">
            ⚔️ Бросить вызов
          </button>
        `}
      </div>
    `;
    monCont.appendChild(row);
  });
}

function challengeSevenPower(rank) {
  const pow = SEVEN_GREAT_POWERS.find(p => p.rank === rank);
  if (!pow || pow.isDead) return;

  if (!confirm(`Вы уверены, что готовы бросить вызов #${pow.rank} ${pow.title} — ${pow.name}? В случае поражения отступить нельзя!`)) {
    return;
  }

  currentBattle = {
    quest: { enemy: `${pow.title} ${pow.name}`, rank: "Семь Сил", reward: 20000, gp: 500 },
    enemyHp: pow.hp,
    enemyMaxHp: pow.maxHp,
    enemyCp: pow.cp,
    isSevenPower: true,
    powerObj: pow
  };

  document.getElementById("battle-enemy-name").innerText = `${pow.title} ${pow.name}`;
  document.getElementById("battle-enemy-cp").innerText = `БМ: ${pow.cp.toLocaleString()}`;
  document.getElementById("battle-enemy-hp-text").innerText = `${pow.hp}/${pow.maxHp}`;
  document.getElementById("battle-enemy-hp-bar").style.width = "100%";
  document.getElementById("battle-log").innerHTML = `⚡ <b>БИТВА ЗА МЕСТО В СЕМИ ВЕЛИКИХ СИЛАХ!</b> На монументе вы сошлись в схватке насмерть против <b>${pow.name}</b>!`;

  document.getElementById("battle-modal").style.display = "flex";
  playSound("calamity");
}

// ------------------------------------------
// 8. БОЕВАЯ СИСТЕМА И ДУЭЛИ
// ------------------------------------------

function combatAction(actionType) {
  if (!currentBattle) return;

  const logBox = document.getElementById("battle-log");
  const squadCp = currentBattle.isDuel ? calcCombatPower(player) : calcSquadCombatPower(player);
  const enemyCp = currentBattle.enemyCp;

  // Проверка уклонения от Глаза Предвидения
  let hasForesight = (player.demonEyes?.left?.id === "foresight" || player.demonEyes?.right?.id === "foresight");
  let hasAppraisal = (player.demonEyes?.left?.id === "appraisal" || player.demonEyes?.right?.id === "appraisal");

  if (actionType === "flee") {
    if (currentBattle.isSevenPower) {
      logBox.innerHTML += `<div style="color:var(--hp)">Из битвы с Семью Силами отступить невозможно!</div>`;
      return;
    }
    logBox.innerHTML += `<div>🏃 Вы спешно разорвали дистанцию и отступили!</div>`;
    setTimeout(() => { document.getElementById("battle-modal").style.display = "none"; currentBattle = null; }, 600);
    return;
  }

  if (actionType === "potion") {
    if (player.potionsCount > 0) {
      player.potionsCount--;
      player.hp = Math.min(player.maxHp, player.hp + 60);
      logBox.innerHTML += `<div style="color:var(--green)">🧪 Вы выпили зелье (+60 HP)!</div>`;
      playSound("coin");
      updateUI();
    } else {
      logBox.innerHTML += `<div style="color:var(--hp)">Зелья закончились!</div>`;
      return;
    }
  }

  let myDamage = 0;
  if (actionType === "sword") {
    let power = Math.max(12, player.swordGodExp + player.waterGodExp + player.northGodExp);
    myDamage = Math.floor(power * (squadCp / (enemyCp + 100)) * 2.2) + Math.floor(Math.random() * 25) + 15;
    if (hasAppraisal) myDamage = Math.floor(myDamage * 1.3);
    logBox.innerHTML += `<div>⚔️ Выпад клинком: <b>-${myDamage} HP</b>!</div>`;
    playSound("sword");
  } else if (actionType === "magic") {
    if (player.mana < 10) {
      logBox.innerHTML += `<div style="color:var(--muted)">Мана на исходе!</div>`;
      myDamage = 6;
    } else {
      player.mana -= 10;
      myDamage = Math.floor(player.magicExp * (squadCp / (enemyCp + 100)) * 2.8) + Math.floor(Math.random() * 35) + 25;
      if (hasAppraisal) myDamage = Math.floor(myDamage * 1.3);
      logBox.innerHTML += `<div style="color:var(--mana)">🔮 Удар стихией: <b>-${myDamage} HP</b>!</div>`;
      playSound("magic");
    }
  }

  currentBattle.enemyHp -= myDamage;

  // Победа
  if (currentBattle.enemyHp <= 0) {
    logBox.innerHTML += `<div style="color:var(--gold); font-weight:700;">🏆 ВЕЛИКАЯ ПОБЕДА! Враг сокрушен!</div>`;
    playSound("win");

    if (currentBattle.isSevenPower) {
      currentBattle.powerObj.isDead = true;
      currentBattle.powerObj.killerDynasty = player.surname;
      log(`👑💥 <b>ИСТОРИЧЕСКИЙ ТРИУМФ!</b> Вы сокрушили #${currentBattle.powerObj.rank} ${currentBattle.powerObj.title} — ${currentBattle.powerObj.name}! Ваше имя навсегда высечено на Монументе Семи Великих Сил Мира!`);
      player.coins += 25000;
      renderPowersMonument();
    } else if (currentBattle.isDuel) {
      currentBattle.npc.relation = Math.max(0, currentBattle.npc.relation - 15);
      player.swordGodExp += 15;
      log(`Вы одержали победу в дуэли против <b>${currentBattle.npc.name}</b>!`);
    } else {
      player.coins += currentBattle.quest.reward;
      player.guildExp += currentBattle.quest.gp;
      player.squadFame = (player.squadFame || 0) + currentBattle.quest.gp;
      player.swordGodExp += 10;
      player.magicExp += 10;
      log(`Заказ Гильдии выполнен (+${currentBattle.quest.reward}🪙, +${currentBattle.quest.gp} GP).`);
      player.guildQuestsThisYear = player.guildQuestsThisYear.filter(q => q.id !== currentBattle.quest.id);
      checkGuildRankUp();
    }

    setTimeout(() => {
      document.getElementById("battle-modal").style.display = "none";
      currentBattle = null;
      updateUI();
      renderGuildTab();
    }, 1200);
    return;
  }

  // Ответный удар врага с шансом уклонения
  if (hasForesight && Math.random() < 0.35) {
    logBox.innerHTML += `<div style="color:var(--accent-light)">👁️ <b>Глаз Предвидения!</b> Вы увидели траекторию удара за миг до атаки и грациозно уклонились!</div>`;
  } else {
    let enemyDamage = Math.floor(enemyCp / (squadCp + 60) * 18) + Math.floor(Math.random() * 14) + 8;
    player.hp -= enemyDamage;
    logBox.innerHTML += `<div style="color:var(--hp)">Враг ответил сокрушительным ударом: <b>-${enemyDamage} HP</b>!</div>`;
    playSound("sword");
  }

  logBox.scrollTop = logBox.scrollHeight;
  document.getElementById("battle-enemy-hp-text").innerText = `${Math.max(0, currentBattle.enemyHp)}/${currentBattle.enemyMaxHp}`;
  document.getElementById("battle-enemy-hp-bar").style.width = Math.max(0, (currentBattle.enemyHp / currentBattle.enemyMaxHp) * 100) + "%";
  updateUI();

  if (player.hp <= 0) {
    document.getElementById("battle-modal").style.display = "none";
    currentBattle = null;
    handleDeath(currentBattle?.isSevenPower ? `Пал в битве за место в Семи Силах` : `Погиб в схватке`);
  }
}

// ------------------------------------------
// 9. ЛАБИРИНТЫ И ДРОП АРТЕФАКТОВ
// ------------------------------------------

function exploreDungeonFloor(dungeonId) {
  if (player.ap < 1) {
    alert("Вы истощены! Требуется ⚡ 1 сила.");
    return;
  }
  player.ap -= 1;

  if (checkSquadBetrayal()) return;

  const d = DUNGEONS.find(x => x.id === dungeonId);
  player.dungeonProgress[d.id] = player.dungeonProgress[d.id] || 1;
  let floor = player.dungeonProgress[d.id];

  const roll = Math.random();
  const hasManaSight = (player.demonEyes?.left?.id === "mana_sight" || player.demonEyes?.right?.id === "mana_sight");

  // Ловушка телепортации
  if (roll < 0.22 && floor > 1) {
    if (hasManaSight) {
      log(`🔮 <b>Глаз Маны!</b> Вы заметили скрытые магические глифы телепортации под плитами и провели отряд в обход ловушки!`);
    } else {
      let stepsBack = Math.min(floor - 1, Math.floor(Math.random() * 2) + 1);
      player.dungeonProgress[d.id] -= stepsBack;
      log(`🌀 <b>ЛОВУШКА ТЕЛЕПОРТАЦИИ!</b> Отряд наступил на глиф: вас отбросило на <b>-${stepsBack} этаж(а) назад</b>!`);
      playSound("calamity");
    }
  }
  // Источник
  else if (roll < 0.35) {
    player.hp = player.maxHp; player.mana = player.maxMana;
    log(`⛲ Отряд нашел священный грот! Здоровье и Мана восстановлены!`);
    playSound("magic");
  }
  // Сундук и шанс артефакта
  else if (roll < 0.52) {
    let lootCoins = Math.floor(Math.random() * 120) + 50;
    player.coins += lootCoins;
    player.squadFame = (player.squadFame || 0) + 12;

    // Дроп артефакта подземелья
    if (d.dropArtifact && Math.random() < 0.35) {
      const art = SHOP_ITEMS.find(i => i.id === d.dropArtifact);
      if (art && !player.inventory.some(x => x.id === art.id)) {
        player.inventory.push(art);
        log(`💎✨ <b>РЕДКАЯ НАХОДКА В СУНДУКЕ!</b> Вы извлекли легендарный артефакт: <b>${art.name}</b> (+${art.cp} БМ)!`);
        playSound("win");
      }
    } else {
      log(`💎 На ${floor} этаже найден ларец с золотом (+${lootCoins}🪙, +12 Славы)!`);
      playSound("coin");
    }
  }
  // Бой со стражем этажа
  else if (roll < 0.85) {
    let monsterCp = Math.floor(d.cpBase * (1 + floor * 0.45));
    let squadCp = calcSquadCombatPower(player);
    let damage = Math.floor(monsterCp / (squadCp + 100) * 22) + 10;
    player.hp -= damage;

    if (damage > 35 && Math.random() < 0.25 && !player.injuries.some(i => i.id === "lost_arm")) {
      player.injuries.push({ id: "lost_arm", name: "Утрата левой руки" });
      log(`🩸 <b>ТЯЖЕЛАЯ ТРАВМА!</b> В лабиринте чудовище отсекло вам левую руку! Срочно найдите магический протез!`);
      playSound("death");
    }

    log(`⚔️ На ${floor} этаже отряд пробился сквозь стражей! Урон лидеру: -${damage} HP.`);
    playSound("sword");
    player.dungeonProgress[d.id]++;

    if (player.dungeonProgress[d.id] > d.maxFloors) {
      log(`🏆 <b>ЛАБИРИНТ ПОКОРЕН!</b> Отряд поверг Владыку глубин ${d.name} (+600🪙, +120 Славы)!`);
      player.coins += 600;
      player.guildExp += 120;
      player.squadFame = (player.squadFame || 0) + 120;
      playSound("win");
    }
  } else {
    player.dungeonProgress[d.id]++;
    log(`🪜 Отряд благополучно спустился на ${player.dungeonProgress[d.id]} этаж ${d.name}.`);
    playSound("click");
  }

  updateUI();
  renderGuildTab();
  if (player.hp <= 0) handleDeath("Сгинул в глубинах древнего лабиринта.");
}

// ------------------------------------------
// 10. РЫНОК, ИНВЕНТАРЬ И ПОМЕСТЬЯ
// ------------------------------------------

function renderInventoryTab() {
  const invCont = document.getElementById("inventory-list");
  invCont.innerHTML = "";

  if (player.inventory.length === 0 && player.potionsCount === 0) {
    invCont.innerHTML = `<div style="font-size:12px; color:var(--muted); padding:6px;">Рюкзак пуст. Приобретите вещи на рынке ниже.</div>`;
  } else {
    if (player.potionsCount > 0) {
      const pDiv = document.createElement("div");
      pDiv.className = "shop-item";
      pDiv.innerHTML = `
        <div>
          <b>🧪 Зелье Исцеления</b> (${player.potionsCount} шт.)
          <div style="font-size:11px; color:var(--muted);">Восстанавливает 60 HP в бою или вне боя</div>
        </div>
        <button onclick="usePotionOutOfCombat()">Пить (+60 HP)</button>
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

  let filteredShop = SHOP_ITEMS;
  if (currentShopCategory !== "all") {
    if (currentShopCategory === "artifact") {
      filteredShop = SHOP_ITEMS.filter(i => i.type === "accessory" || i.type === "potion");
    } else {
      filteredShop = SHOP_ITEMS.filter(i => i.type === currentShopCategory);
    }
  }

  filteredShop.forEach(it => {
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
    log(`Приобретено: <b>${item.name}</b> (+${item.cp} БМ).`);
  }
  playSound("coin");
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

  log(`Экипировано: <b>${item.name}</b>!`);
  playSound("sword");
  updateUI();
  renderInventoryTab();
}

function unequipSlot(slot) {
  if (!player.equipment[slot]) return;
  player.inventory.push(player.equipment[slot]);
  log(`Вы сняли <b>${player.equipment[slot].name}</b>.`);
  player.equipment[slot] = null;
  playSound("click");
  updateUI();
  renderInventoryTab();
}

function usePotionOutOfCombat() {
  if (player.potionsCount <= 0) return;
  player.potionsCount--;
  player.hp = Math.min(player.maxHp, player.hp + 60);
  log("Вы выпили целебное зелье (+60 HP).");
  playSound("coin");
  updateUI();
  renderInventoryTab();
}

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
    alert("У вас недостаточно монет!");
    return;
  }

  player.coins -= est.cost;
  player.estates = player.estates || [];
  player.estates.push(est.id);
  log(`🏰 Вы приобрели поместье: <b>${est.name}</b>! Доход поступает каждый год.`);
  playSound("win");
  updateUI();
  renderEstates();
}

// ------------------------------------------
// 11. ХОД ВРЕМЕНИ И СТАРЕНИЕ
// ------------------------------------------

function ageUp() {
  player.age++;
  currentWorldYear++;

  player.maxAp = getMaxAP(player.age);
  player.ap = player.maxAp;
  player.mana = player.maxMana;

  generateYearlyGuildQuests();

  // Доход от недвижимости
  if (player.estates && player.estates.length > 0) {
    let passiveIncome = 0;
    player.estates.forEach(estId => {
      let est = ESTATES.find(e => e.id === estId);
      if (est) passiveIncome += est.income;
    });
    player.coins += passiveIncome;
    log(`💰 Доход от поместий: <b>+${passiveIncome} монет</b>.`);
  }

  // Жалование от службы
  if (player.currentJob) {
    const jData = getJobDataById(player.currentJob);
    const curRank = jData?.ranks[player.jobRankIndex];
    if (curRank) {
      player.coins += curRank.salary;
      log(`💼 Получено ежегодное жалование чина (${curRank.title}): <b>+${curRank.salary} монет</b>.`);
    }
  }

  // Жалование от титула знати
  const titleObj = ASURA_POLITICS.nobilityTitles.find(t => t.id === player.nobilityTitle);
  if (titleObj && titleObj.salary > 0) {
    player.coins += titleObj.salary;
    log(`👑 Королевская рента титула (${titleObj.name}): <b>+${titleObj.salary} монет</b>.`);
  }

  // Рождение ребенка
  if (player.pregnancy) {
    const isMale = Math.random() > 0.5;
    const list = isMale ? SYLLABLES.male : SYLLABLES.female;
    const childName = list[Math.floor(Math.random() * list.length)];

    let childRoll = Math.random();
    let bonusMult = 1.0;
    if (childRoll < 0.60) bonusMult = 1.15;
    else if (childRoll > 0.90) bonusMult = 1.35;

    const child = {
      id: "child_" + Date.now(),
      name: `${childName} ${player.surname}`,
      gender: isMale ? "male" : "female",
      birthYear: currentWorldYear,
      cp: Math.round(500 * bonusMult),
      role: bonusMult > 1.3 ? "Наследник рода (Вундеркинд ⭐)" : "Наследник рода",
      relation: 100,
      status: "Семья",
      isFamily: true,
      isChild: true
    };

    player.children.push(child);
    player.relations.push(child);
    log(`🎉 <b>Пополнение в семье!</b> Родился ребенок — <b>${child.name}</b> (${child.gender === 'male' ? 'Сын' : 'Дочь'})!`);
    playSound("win");
    player.pregnancy = null;
  }

  // Автоматический сюжетный Катаклизм в 417 г. (если персонажу около 10 лет и он в Асуре)
  if (currentWorldYear === CALAMITY_YEAR && !player.calamityTriggered) {
    const calamityStory = STORY_ACTIVITIES.find(s => s.id === "story_10_calamity");
    if (calamityStory) {
      performStoryActivity("story_10_calamity");
      return;
    }
  }

  // Старость
  if (player.age > (player.maxAge - 15)) {
    let decay = Math.floor(Math.random() * 12) + 6;
    player.hp -= decay;
    log(`Годы берут свое: ломота в суставах (-${decay} HP).`);
  }

  if (player.hp <= 0 || player.age >= player.maxAge) {
    handleDeath(player.hp <= 0 ? "Смерть от ран и истощения" : "Мирная кончина от глубокой старости");
    return;
  }

  // Спавн каноничных героев
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
        log(`⭐ <b>Судьбоносная встреча!</b> Вы повстречали: <b>${c.name}</b> (${c.role})!`);
        playSound("win");
      }
    }
  });

  // Случайные события
  let triggeredEvent = null;
  for (let rev of RANDOM_EVENTS.filter(e => e.isRare && player.age >= e.minAge)) {
    if (Math.random() < rev.chance) {
      triggeredEvent = rev;
      break;
    }
  }

  if (!triggeredEvent && Math.random() < 0.40) {
    const normalEvents = RANDOM_EVENTS.filter(e => !e.isRare && player.age >= e.minAge);
    if (normalEvents.length > 0) {
      triggeredEvent = normalEvents[Math.floor(Math.random() * normalEvents.length)];
    }
  }

  if (triggeredEvent) {
    triggerRandomEvent(triggeredEvent);
    return;
  }

  log("Год прошел в размеренных тренировках, беседах и трудах.");
  playSound("click");
  updateUI();
}

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
      playSound("click");
      updateUI();
      if (player.hp <= 0) handleDeath("Пал жертвой роковых обстоятельств года.");
    };
    cBox.appendChild(btn);
  });

  document.getElementById("event-modal").style.display = "flex";
}

// ------------------------------------------
// 12. СМЕРТЬ, ЗАЛ СЛАВЫ И НАСЛЕДОВАНИЕ
// ------------------------------------------

function handleDeath(reason) {
  playSound("death");
  recordAncestorToHistory(player, reason);

  document.getElementById("death-reason").innerText = `${reason} в возрасте ${player.age} лет.`;

  const summaryBox = document.getElementById("death-summary");
  summaryBox.innerHTML = `
    <div style="background:#1c202b; padding:12px; border-radius:10px; font-size:12px; margin-bottom:12px;">
      <div>🎖️ Имя: <b>${player.name}</b> (${player.gender === 'male' ? '♂️' : '♀️'}, ${player.race})</div>
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
    log: `Вы продолжили славный род ${player.surname}. Поместья и семейное золото перешли к вам по праву крови.`
  };

  const oldEstates = player.estates || [];
  const oldFaction = player.dynastyFaction;
  const oldFactionProg = player.factionProgress || 0;
  const oldNobility = player.nobilityTitle;
  const oldAsuraFaction = player.asuraFaction;

  document.getElementById("death-overlay").style.display = "none";
  
  initCharacter(child.name.split(" ")[0], player.surname, child.gender, raceObj, player.currentRegionKey, originMock, player.trait, realAge);
  
  player.estates = oldEstates;
  player.dynastyFaction = oldFaction;
  player.factionProgress = oldFactionProg;
  player.nobilityTitle = oldNobility;
  player.asuraFaction = oldAsuraFaction;
}

function startNewDynasty() {
  const newKarma = addReincarnationKarma();
  document.getElementById("death-overlay").style.display = "none";
  dynastyGeneration = 1;
  currentWorldYear = START_YEAR;
  localStorage.removeItem("bit_tensei_save");
  alert(`🌀 Душа вернулась в Колесо Сансары! Накоплена Карма ${newKarma}-го уровня.`);
  showCreation();
}

function confirmReset() {
  if (confirm("Завершить текущую жизнь и начать новую династию с чистого листа?")) {
    startNewDynasty();
  }
}

// ------------------------------------------
// 13. ГИЛЬДИЯ, ОТНОШЕНИЯ И ВСПОМОГАТЕЛЬНЫЕ
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

  renderPowersMonument();

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
        <span class="tag badge-rare">Ранг ${d.reqRank}+</span>
      </div>
      <div style="font-size:11px; color:var(--muted); margin:4px 0;">${d.desc}</div>
      <div style="font-size:11px; color:var(--accent-light);">
        ${isCompleted ? '👑 Покорен полностью!' : `Глубина: Этаж ${curFloor} из ${d.maxFloors}`}
      </div>
      <button ${!canEnter || isCompleted ? 'disabled' : ''} onclick="exploreDungeonFloor('${d.id}')" style="margin-top:6px; background:#4338ca; width:100%;">
        ${isCompleted ? '✓ Лабиринт зачищен' : !hasRank ? `Требуется Ранг ${d.reqRank}` : 'Спуститься ниже ⬇️ (⚡ 1 сила)'}
      </button>
    `;
    dungCont.appendChild(dCard);
  });

  const qCont = document.getElementById("guild-quests-list");
  qCont.innerHTML = "";

  if (player.age < 10) {
    qCont.innerHTML = `<div style="color:var(--muted); padding:10px; text-align:center;">Гильдия открыта только с 10 лет!</div>`;
  } else if (!player.guildQuestsThisYear || player.guildQuestsThisYear.length === 0) {
    qCont.innerHTML = `<div style="color:var(--muted); padding:10px; text-align:center;">Все годовые заказы выполнены!</div>`;
  } else {
    player.guildQuestsThisYear.forEach(q => {
      const qDiv = document.createElement("div");
      qDiv.className = "quest-card";
      const canHunt = player.ap >= 2;
      qDiv.innerHTML = `
        <div>
          <span class="tag badge-rare">Ранг ${q.rank}</span>
          <b style="font-size:13px; display:block; margin:2px 0;">${q.name}</b>
          <div style="font-size:11px; color:var(--muted);">${q.enemy} • БМ: ${q.cp.toLocaleString()}</div>
          <div style="font-size:11px; color:var(--gold);">+${q.reward} 🪙 | +${q.gp} GP • ⚡ 2 силы</div>
        </div>
        <button ${canHunt ? '' : 'disabled'} style="background:#312e81;" onclick="startGuildBattle('${q.id}')">
          ${canHunt ? 'В бой' : 'Нет сил'}
        </button>
      `;
      qCont.appendChild(qDiv);
    });
  }
}

function startGuildBattle(questId) {
  if (player.ap < 2) { alert("Нужно ⚡ 2 силы!"); return; }
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
  document.getElementById("battle-log").innerHTML = `Схватка против <b>${quest.enemy}</b> началась!`;

  document.getElementById("battle-modal").style.display = "flex";
  playSound("sword");
}

function checkGuildRankUp() {
  const currentIdx = ADVENTURER_RANKS.indexOf(player.guildRank);
  if (currentIdx < ADVENTURER_RANKS.length - 1) {
    const nextRank = ADVENTURER_RANKS[currentIdx + 1];
    const req = ADVENTURER_REQ[nextRank];
    if (player.guildExp >= req) {
      player.guildRank = nextRank;
      log(`🌟 <b>ПОВЫШЕНИЕ В ГИЛЬДИИ!</b> Ваш ранг авантюриста вырос до <b>${nextRank}</b>!`);
      playSound("win");
    }
  }
}

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
    listEl.innerHTML = `<div style="font-size:11px; color:var(--muted);">В отряде только вы. Пригласите спутников во вкладке «Связи»!</div>`;
    return;
  }

  player.squad.forEach((m, idx) => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#12141c; padding:6px 10px; border-radius:8px; margin-bottom:4px; font-size:12px;";
    row.innerHTML = `
      <div>
        <b>${m.name}</b> <span style="font-size:10px; color:var(--muted);">(${m.role || m.race})</span>
        <div style="font-size:10px; color:#c7d2fe;">БМ: ${m.cp.toLocaleString()} • Отношение: ${m.relation}%</div>
      </div>
      <button style="padding:4px 8px; font-size:10px; background:#ef4444;" onclick="removeFromSquad(${idx})">Выгнать</button>
    `;
    listEl.appendChild(row);
  });
}

function addToSquad(npcId) {
  if (player.squad && player.squad.length >= 5) {
    alert("Отряд полон! Максимум 6 бойцов.");
    return;
  }
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;

  if (npc.relation < 60) {
    alert(`${npc.name} недостаточно доверяет вам (нужно 60%+ отношений)!`);
    return;
  }

  player.squad = player.squad || [];
  player.squad.push(npc);
  log(`🛡️ <b>${npc.name}</b> вступил(а) в ваш отряд!`);
  playSound("win");
  updateUI();
  renderRelations();
  renderSquad();
}

function removeFromSquad(index) {
  const m = player.squad[index];
  player.squad.splice(index, 1);
  log(`Вы исключили <b>${m.name}</b> из отряда.`);
  playSound("click");
  updateUI();
  renderSquad();
}

function checkSquadBetrayal() {
  if (!player.squad || player.squad.length === 0) return false;

  for (let i = 0; i < player.squad.length; i++) {
    let m = player.squad[i];
    if (m.isFamily || m.status === "Супруг/Супруга" || m.relation >= 85) continue;

    if (m.relation < 45 || Math.random() < 0.05) {
      log(`🗡️💥 <b>ПРЕДАТЕЛЬСТВО!</b> Напарник <b>${m.name}</b> ударил вам в спину и сбежал с частью золота!`);
      player.hp = Math.max(10, player.hp - 35);
      player.coins = Math.max(0, player.coins - 50);
      player.squad.splice(i, 1);
      m.relation = 0;
      m.status = "Заклятый враг";
      playSound("death");
      updateUI();
      renderSquad();
      return true;
    }
  }
  return false;
}

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
            ${npc.isLost ? '<span class="badge-mythic" style="font-size:10px;">Пропал(а) в Катаклизме ⚡</span>' : ''}
            ${inSquad ? '<span class="badge-rare">В отряде 🛡️</span>' : ''}
          </div>
          <div class="rel-role">${npc.role || npc.race} • БМ: <b>${(npc.cp || 500).toLocaleString()}</b></div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:13px; font-weight:700;"><span class="${statusClass}">${npc.status}</span> (${npc.relation}%)</div>
          <div style="font-size:10px; color:var(--accent);">${isOpened ? '▲ Свернуть' : '▼ Взаимодействовать'}</div>
        </div>
      </div>
      <div class="bar-bg" onclick="toggleNpcActions('${npc.id}')" style="cursor:pointer;">
        <div class="bar-fill bar-relation" style="width: ${Math.max(0, Math.min(100, npc.relation))}%; background: ${npc.relation < 30 ? 'var(--hp)' : 'var(--green)'};"></div>
      </div>

      ${isOpened ? `
        <div class="npc-inline-actions">
          ${npc.isLost ? `
            <button style="grid-column: span 2; background:#b45309;" onclick="searchLostFamily('${npc.id}')">🔍 Отправиться на поиски по континентам</button>
          ` : `
            <button onclick="actionTalk('${npc.id}')">💬 Поговорить</button>
            <button onclick="actionGift('${npc.id}')">🎁 Подарок (15🪙)</button>
            <button class="action-danger" onclick="actionDuel('${npc.id}')">⚔️ Вызвать на дуэль</button>
            <button class="action-danger" onclick="actionInsult('${npc.id}')">🤬 Оскорбить</button>

            ${!inSquad && player.age >= 10 && !npc.isChild ? `
              <button style="grid-column: span 2; background:#312e81;" onclick="addToSquad('${npc.id}')">🛡️ Пригласить в отряд</button>
            ` : ''}

            ${!npc.isFamily && !npc.isChild && player.age >= 14 && npc.status !== "Пара" && npc.status !== "Супруг/Супруга" ? `
              <button class="action-love" style="grid-column: span 2;" onclick="actionConfess('${npc.id}')">❤️ Признаться в чувствах</button>
            ` : ''}

            ${!npc.isFamily && !npc.isChild && player.age >= 16 && npc.status === "Пара" && !player.spouse ? `
              <button class="action-married" style="grid-column: span 2;" onclick="actionMarry('${npc.id}')">💍 Сделать предложение</button>
            ` : ''}

            ${npc.status === "Супруг/Супруга" && player.age >= 16 ? `
              <button class="action-married" style="grid-column: span 2;" ${player.pregnancy ? 'disabled' : ''} onclick="actionHaveChild('${npc.id}')">
                ${player.pregnancy ? '⏳ Ребенок родится через год' : '👶 Зачать ребенка (Родится через 1 год)'}
              </button>
            ` : ''}
          `}
        </div>
      ` : ''}
    `;
    container.appendChild(card);
  });
}

function searchLostFamily(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;

  if (Math.random() < 0.55) {
    npc.isLost = false;
    log(`🎉 <b>ПОИСКИ УВЕНЧАЛИСЬ УСПЕХОМ!</b> Вы нашли <b>${npc.name}</b> в одном из убежищ беженцев! Семья воссоединена!`);
    playSound("win");
  } else {
    log(`Вы прочесали окрестные деревни, но следов <b>${npc.name}</b> пока нет. Продолжайте поиски!`);
    playSound("click");
  }
  updateUI();
  renderRelations();
}

function actionTalk(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  npc.relation = Math.min(100, npc.relation + 7);
  if (npc.relation >= 60 && npc.status === "Знакомый") npc.status = "Друг";
  log(`Вы побеседовали с <b>${npc.name}</b> (+7%).`);
  playSound("click");
  updateUI();
  renderRelations();
}

function actionGift(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  if (player.coins < 15) { alert("Недостаточно монет (15🪙)!"); return; }
  player.coins -= 15;
  npc.relation = Math.min(100, npc.relation + 20);
  log(`Вы преподнесли подарок <b>${npc.name}</b> (+20%)!`);
  playSound("coin");
  updateUI();
  renderRelations();
}

function actionInsult(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  npc.relation = Math.max(0, npc.relation - 30);
  if (npc.relation <= 25) npc.status = "Заклятый враг";
  log(`Вы оскорбили <b>${npc.name}</b>.`);
  playSound("click");
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
  document.getElementById("battle-log").innerHTML = `Дуэль против <b>${npc.name}</b>!`;

  document.getElementById("battle-modal").style.display = "flex";
  playSound("sword");
}

function actionConfess(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  if (npc.relation >= 75) {
    npc.status = "Пара";
    log(`💖 <b>${npc.name}</b> ответила взаимностью на ваши чувства!`);
    playSound("win");
  } else {
    npc.relation = Math.max(0, npc.relation - 10);
    log(`💔 <b>${npc.name}</b>: "Давай останемся друзьями..."`);
    playSound("click");
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
    log(`💍 Колокола храма звенят! Вы и <b>${npc.name}</b> вступили в законный брак!`);
    playSound("win");
  } else {
    log(`${npc.name} считает, что нужно получше узнать друг друга.`);
  }
  updateUI();
  renderRelations();
}

function actionHaveChild(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  if (player.pregnancy) {
    alert("Беременность уже протекает! Ребенок родится в следующем году.");
    return;
  }
  player.pregnancy = { partnerName: npc.name };
  log(`💖 Чудесная весть! Вы и <b>${npc.name}</b> ждете ребенка!`);
  playSound("win");
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
    isCanon: false,
    isLost: false
  };

  player.relations.push(newNpc);
  log(`Вы познакомились с: <b>${newNpc.name}</b> (${newNpc.race}, ${newNpc.socialClass}, БМ: ${baseCp.toLocaleString()}).`);
  playSound("click");
  renderRelations();
  updateUI();
}

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
        <div style="font-size:10px; color:var(--gold);">Цена: ${reg.travelCost} 🪙 • В пути: ⏳ 1 год</div>
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
    alert("Вы слишком малы для странствий без родителей!");
    return;
  }
  const dest = REGIONS[destKey];
  if (player.coins < dest.travelCost) {
    alert(`Недостаточно монет (${dest.travelCost}🪙)!`);
    return;
  }

  if (!confirm(`Отправиться в ${dest.name}? Дорога займет ровно 1 год вашей жизни!`)) return;

  player.coins -= dest.travelCost;
  player.currentRegionKey = destKey;

  log(`🚢 Вы прибыли в <b>${dest.name}</b>. Дорога заняла ровно один год!`);
  playSound("calamity");
  ageUp();
  switchTab('character');
}

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
    else if (isEnrolled) btnText = `✓ Студент (${player.schoolProgress || 1}/4 курс)`;
    else if (!isCorrectRegion) btnText = "Прибудьте в этот регион";

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
  if (player.coins < sch.cost) { alert("Недостаточно монет!"); return; }

  player.coins -= sch.cost;
  player.enrolledSchool = sch.id;
  player.schoolProgress = 1;
  log(`🏛️ Вы поступили в <b>${sch.name}</b>!`);
  playSound("win");
  updateUI();
  renderSchools();
}

// ------------------------------------------
// 14. СОХРАНЕНИЕ И ЗАГРУЗКА
// ------------------------------------------

function saveGame() {
  if (!player) return;
  const saveData = {
    player: player,
    dynastyGeneration: dynastyGeneration,
    currentWorldYear: currentWorldYear,
    sevenPowers: SEVEN_GREAT_POWERS,
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
      if (data.sevenPowers) SEVEN_GREAT_POWERS = data.sevenPowers;
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
