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
let currentShopCategory = "all";
let creationGender = "male";
let activeDungeon = null;

// ------------------------------------------
// 1. УНИВЕРСАЛЬНЫЕ ОКНА И ЛОГ
// ------------------------------------------

function showActionModal(title, text, icon = "⚡") {
  const modal = document.getElementById("action-modal");
  if (!modal) return;
  const iconEl = document.getElementById("action-modal-icon");
  const titleEl = document.getElementById("action-modal-title");
  const bodyEl = document.getElementById("action-modal-body");
  if (iconEl) iconEl.innerText = icon;
  if (titleEl) titleEl.innerText = title;
  if (bodyEl) bodyEl.innerHTML = text;
  modal.style.display = "flex";
}

function closeActionModal() {
  const modal = document.getElementById("action-modal");
  if (modal) modal.style.display = "none";
  playSound("click");
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
// 2. ЗВУК И МУЗЫКА
// ------------------------------------------

function playSound(type) {
  if (!window.GameMusic || !GameMusic.isMusicOn()) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
    } else if (type === "sword") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now); osc.stop(now + 0.12);
    } else if (type === "magic") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.22);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now); osc.stop(now + 0.22);
    } else if (type === "coin") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(987, now);
      osc.frequency.setValueAtTime(1318, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === "win") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.1);
      osc.frequency.setValueAtTime(784, now + 0.2);
      osc.frequency.setValueAtTime(1046, now + 0.3);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now); osc.stop(now + 0.45);
    } else if (type === "death" || type === "calamity") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
    }
  } catch (e) {
    console.error(e);
  }
}

function toggleSound() {
  if (!window.GameMusic) return;
  const on = GameMusic.toggle();
  const btn = document.getElementById("btn-sound-toggle");
  if (btn) btn.innerText = on ? "🔊 Звук: ВКЛ" : "🔇 Звук: ВЫКЛ";
  if (on) playSound("click");
}

// ------------------------------------------
// 3. БОЕВАЯ МОЩЬ И ХАРАКТЕРИСТИКИ
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
  cp += (p.hp || 0) * 2;
  cp += (p.maxMana || 0) * 3;
  cp += (p.magicExp || 0) * 4;
  cp += (p.swordGodExp || 0) * 4;
  cp += (p.waterGodExp || 0) * 4;
  cp += (p.northGodExp || 0) * 4;
  cp += (p.intellect || 0) * 5;

  if (p.equipment?.weapon) cp += p.equipment.weapon.cp || 0;
  if (p.equipment?.armor) cp += p.equipment.armor.cp || 0;
  if (p.equipment?.accessory) cp += p.equipment.accessory.cp || 0;

  if (p.demonEyes?.left) cp += p.demonEyes.left.cp || 0;
  if (p.demonEyes?.right) cp += p.demonEyes.right.cp || 0;

  if (p.castleUpgrades && p.castleUpgrades.includes("trophy_hall")) {
    cp += 3000;
  }

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

  const maxCap = (p.trait && p.trait.id === "god_mode") ? 999999999 : (GENERATION_CP_CAPS[p.generation] || 9999999);
  return Math.min(maxCap, Math.floor(cp));
}

function calcSquadCombatPower(p) {
  if (!p) return 0;
  let total = calcCombatPower(p);
  if (p.squad && p.squad.length > 0) {
    p.squad.forEach(m => {
      total += (m.cp || 500);
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

// ------------------------------------------
// 4. СОЗДАНИЕ ПЕРСОНАЖА (100% БЕЗОПАСНОСТЬ)
// ------------------------------------------

function setCreationGender(g) {
  creationGender = g;
  const bM = document.getElementById("btn-gender-male");
  const bF = document.getElementById("btn-gender-female");
  if (bM) bM.classList.toggle("active", g === "male");
  if (bF) bF.classList.toggle("active", g === "female");
  randomizeNameInputs();
  playSound("click");
}

function randomizeNameInputs() {
  const list = creationGender === "male" ? SYLLABLES.male : SYLLABLES.female;
  const randName = list[Math.floor(Math.random() * list.length)] + (Math.random() > 0.4 ? SYLLABLES.suffix[Math.floor(Math.random() * SYLLABLES.suffix.length)] : "");
  const randSurname = SYLLABLES.surnames[Math.floor(Math.random() * SYLLABLES.surnames.length)];
  const inName = document.getElementById("input-name");
  const inSur = document.getElementById("input-surname");
  if (inName) inName.value = randName;
  if (inSur) inSur.value = randSurname;
}

function updateRaceInfo() {
  const raceSelect = document.getElementById("select-race");
  const raceKey = raceSelect ? raceSelect.value : "human";
  const r = RACES[raceKey] || RACES.human;
  const descEl = document.getElementById("race-desc");
  if (descEl) descEl.innerText = `${r.desc} (Сосуд маны: ${r.bonus.baseMana}, Предел жизни: ~${r.maxAge} лет)`;
}

function onRegionChange() {
  const regSelect = document.getElementById("select-region");
  const regKey = regSelect ? regSelect.value : "asura";
  const region = REGIONS[regKey] || REGIONS.asura;

  // 1. Обновление ветвей происхождения
  const origSelect = document.getElementById("select-origin");
  if (origSelect) {
    origSelect.innerHTML = "";
    region.origins.forEach(o => {
      let opt = document.createElement("option");
      opt.value = o.id;
      opt.innerText = o.name;
      origSelect.appendChild(opt);
    });
  }

  // 2. Обновление сословий семьи (привязка к региону)
  const famSelect = document.getElementById("select-family-status");
  if (famSelect) {
    famSelect.innerHTML = "";
    const statuses = REGION_FAMILY_STATUSES[regKey] || REGION_FAMILY_STATUSES.asura;
    statuses.forEach(f => {
      let opt = document.createElement("option");
      opt.value = f.id;
      opt.innerText = `${f.name} — ${f.desc}`;
      famSelect.appendChild(opt);
    });
  }
}

function showCreation() {
  // Расы
  const raceSelect = document.getElementById("select-race");
  if (raceSelect) {
    raceSelect.innerHTML = "";
    for (let key in RACES) {
      let opt = document.createElement("option");
      opt.value = key;
      opt.innerText = RACES[key].name;
      raceSelect.appendChild(opt);
    }
  }

  // Регионы
  const regSelect = document.getElementById("select-region");
  if (regSelect) {
    regSelect.innerHTML = "";
    for (let key in REGIONS) {
      let opt = document.createElement("option");
      opt.value = key;
      opt.innerText = REGIONS[key].name;
      regSelect.appendChild(opt);
    }
  }

  // Трейты (включая Мико и Чит-Режим Бога)
  const traitSelect = document.getElementById("select-trait");
  if (traitSelect) {
    traitSelect.innerHTML = "";
    TRAITS.forEach(t => {
      let opt = document.createElement("option");
      opt.value = t.id;
      opt.innerText = `${t.name} (${t.desc})`;
      traitSelect.appendChild(opt);
    });
  }

  updateRaceInfo();
  onRegionChange();
  randomizeNameInputs();

  const overlay = document.getElementById("creation-overlay");
  if (overlay) overlay.style.display = "flex";
}

function confirmCreation() {
  try {
    const inName = document.getElementById("input-name");
    const inSur = document.getElementById("input-surname");
    const fName = (inName && inName.value.trim()) || (creationGender === "male" ? "Рудеус" : "Эрис");
    const sName = (inSur && inSur.value.trim()) || "Грейрат";

    const raceKey = document.getElementById("select-race")?.value || "human";
    const regKey = document.getElementById("select-region")?.value || "asura";
    const origId = document.getElementById("select-origin")?.value || "";
    const traitId = document.getElementById("select-trait")?.value || "healthy";
    const famStatusId = document.getElementById("select-family-status")?.value || "";

    const race = RACES[raceKey] || RACES.human;
    const region = REGIONS[regKey] || REGIONS.asura;
    const origin = region.origins.find(o => o.id === origId) || region.origins[0];
    const trait = TRAITS.find(t => t.id === traitId) || TRAITS[0];

    const regFamList = REGION_FAMILY_STATUSES[regKey] || REGION_FAMILY_STATUSES.asura;
    const famStatus = regFamList.find(f => f.id === famStatusId) || regFamList[0];

    initCharacter(fName, sName, creationGender, race, regKey, origin, trait, famStatus, 0);

    const overlay = document.getElementById("creation-overlay");
    if (overlay) overlay.style.display = "none";
    playSound("win");
  } catch (err) {
    console.error("Ошибка при создании героя:", err);
    alert("Произошел сбой создания. Сбрасываем к стандартным параметрам...");
    initCharacter("Рудеус", "Грейрат", "male", RACES.human, "asura", REGIONS.asura.origins[0], TRAITS[0], REGION_FAMILY_STATUSES.asura[0], 0);
    const overlay = document.getElementById("creation-overlay");
    if (overlay) overlay.style.display = "none";
  }
}

function randomCreation() {
  creationGender = Math.random() > 0.5 ? "male" : "female";
  const bM = document.getElementById("btn-gender-male");
  const bF = document.getElementById("btn-gender-female");
  if (bM) bM.classList.toggle("active", creationGender === "male");
  if (bF) bF.classList.toggle("active", creationGender === "female");
  randomizeNameInputs();

  const raceKeys = Object.keys(RACES);
  const regKeys = Object.keys(REGIONS);

  const randRace = RACES[raceKeys[Math.floor(Math.random() * raceKeys.length)]];
  const randRegKey = regKeys[Math.floor(Math.random() * regKeys.length)];
  const region = REGIONS[randRegKey];
  const randOrigin = region.origins[Math.floor(Math.random() * region.origins.length)];
  const randTrait = TRAITS.filter(t => t.id !== "god_mode")[Math.floor(Math.random() * (TRAITS.length - 1))];

  const regFamList = REGION_FAMILY_STATUSES[randRegKey] || REGION_FAMILY_STATUSES.asura;
  const randFam = regFamList[Math.floor(Math.random() * regFamList.length)];

  const fName = document.getElementById("input-name")?.value || "Рудеус";
  const sName = document.getElementById("input-surname")?.value || "Грейрат";

  initCharacter(fName, sName, creationGender, randRace, randRegKey, randOrigin, randTrait, randFam, 0);
  const overlay = document.getElementById("creation-overlay");
  if (overlay) overlay.style.display = "none";
  playSound("win");
}

function initCharacter(fName, sName, gender, race, regionKey, origin, trait, familyStatus, startAge = 0) {
  const karma = getReincarnationKarma();
  const isGod = (trait?.id === "god_mode");

  let baseMana = isGod ? 99999 : Math.round(((race?.bonus?.baseMana || 25) + (origin?.manaBonus || 0) + (trait?.manaBonus || 0) + (familyStatus?.manaBonus || 0) + (karma * 15)) * (race?.bonus?.manaMod || 1.0));
  let baseHp = isGod ? 99999 : (100 + (trait?.hp || 0) + (race?.bonus?.hp || 0) + (familyStatus?.hp || 0) + (karma * 10));

  if (startAge > 5 && !isGod) {
    baseMana += Math.min(250, startAge * 8);
  }

  const fatherName = SYLLABLES.male[Math.floor(Math.random() * SYLLABLES.male.length)] + " " + sName;
  const motherName = SYLLABLES.female[Math.floor(Math.random() * SYLLABLES.female.length)] + " " + sName;

  player = {
    name: `${fName} ${sName}`,
    firstName: fName,
    surname: sName,
    gender: gender || "male",
    generation: dynastyGeneration,
    race: race?.name || "Человек",
    raceObj: race || RACES.human,
    maxAge: isGod ? 999 : (race?.maxAge || 75),
    regionKey: regionKey || "asura",
    currentRegionKey: regionKey || "asura",
    origin: origin?.name || "Дом Грейрат",
    trait: trait || TRAITS[0],
    familyStatus: familyStatus || REGION_FAMILY_STATUSES.asura[0],
    age: startAge,
    ap: getMaxAP(startAge),
    maxAp: getMaxAP(startAge),
    hp: baseHp,
    maxHp: baseHp,
    mana: baseMana,
    maxMana: baseMana,
    magicExp: isGod ? 2000 : (startAge > 5 ? Math.floor(startAge * 5) : 0),
    swordGodExp: isGod ? 2000 : ((origin?.swordGod || 0) + (trait?.swordGod || 0) + (race?.bonus?.swordGod || 0) + (familyStatus?.swordGod || 0) + (startAge > 5 ? startAge * 3 : 0)),
    waterGodExp: isGod ? 2000 : ((origin?.waterGod || 0) + (trait?.waterGod || 0) + (startAge > 5 ? startAge * 3 : 0)),
    northGodExp: isGod ? 2000 : ((origin?.northGod || 0) + (trait?.northGod || 0) + (race?.bonus?.northGod || 0) + (familyStatus?.northGod || 0) + (startAge > 5 ? startAge * 3 : 0)),
    intellect: isGod ? 999 : (10 + (origin?.int || 0) + (trait?.int || 0) + (race?.bonus?.int || 0) + (familyStatus?.int || 0) + (startAge * 2)),
    coins: isGod ? 9999999 : ((origin?.coins || 0) + (race?.bonus?.coins || 0) + (familyStatus?.coins || 0)),
    guildRank: isGod ? "S" : "F",
    guildExp: 0,
    guildQuestsThisYear: [],
    dungeonProgress: {},
    enrolledSchool: null,
    schoolProgress: 0,
    graduatedSchools: [],
    squad: [],
    squadFame: isGod ? 5000 : 0,
    estates: [],
    familySeat: null,
    castleUpgrades: [],
    lastCryptMeditationAge: -10,
    appointedHeirId: null,
    injuries: [],
    demonEyes: { left: null, right: null },
    languages: ["human"],
    tabletsDeciphered: [],
    currentJob: null,
    jobRankIndex: 0,
    currentUndergroundJob: null,
    undergroundRankIndex: 0,
    nobilityTitle: "citizen",
    asuraFaction: null,
    asuraInfluence: familyStatus?.influence || 0,
    calamityTriggered: false,
    storyCompleted: [],
    dynastyFaction: "neutral",
    factionProgress: 0,
    pregnancy: null,
    equipment: { weapon: null, armor: null, accessory: null },
    inventory: [],
    potionsCount: 2,
    relations: [
      { id: "father", name: fatherName, gender: "male", age: startAge + 24, role: "Отец • Глава дома", cp: 1200, relation: 85, status: "Семья", isFamily: true, isLost: false, isDead: false },
      { id: "mother", name: motherName, gender: "female", age: startAge + 22, role: "Мать • Хранительница", cp: 800, relation: 95, status: "Семья", isFamily: true, isLost: false, isDead: false }
    ],
    spouse: null,
    children: []
  };

  generateYearlyGuildQuests();

  const logsEl = document.getElementById("logs");
  if (logsEl) logsEl.innerHTML = "";
  log(`🌍 Вы воплотились как <b>${player.race}</b> (${player.gender === 'male' ? 'Мужчина' : 'Женщина'}) в <b>${REGIONS[player.currentRegionKey].name}</b> (${currentWorldYear} г. К.Д.).`);
  log(`🏛️ Статус семьи: <b>${player.familyStatus.name}</b>.`);
  if (karma > 0) log(`✨ Карма Сансары: <b>Уровень ${karma}</b> (+${karma * 15} маны, +${karma * 10} HP).`);
  if (origin?.log) log(origin.log);

  renderUI();
  saveGame();
  showBirthModal();
}

function showBirthModal() {
  const cap = (player.trait && player.trait.id === "god_mode") ? "Бесконечно" : (GENERATION_CP_CAPS[player.generation] || 9999999).toLocaleString();
  const content = document.getElementById("birth-card-content");
  if (content) {
    content.innerHTML = `
      <div>👶 Имя: <b>${player.name}</b> (${player.gender === 'male' ? '♂️ Мужчина' : '♀️ Женщина'}, Поколение ${player.generation})</div>
      <div>🧬 Раса: <b>${player.race}</b> (Срок жизни: ~${player.maxAge} лет)</div>
      <div>🏛️ Сословие семьи: <b>${player.familyStatus.name}</b></div>
      <div>🏰 Регион: <b>${REGIONS[player.currentRegionKey].name}</b></div>
      <div>👨‍👩‍👦 Родители: <b>${player.relations[0].name}</b> и <b>${player.relations[1].name}</b></div>
      <div style="margin-top:6px; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px;">
        <div>🔮 Сосуд маны: <b style="color:var(--mana);">${player.maxMana}</b></div>
        <div>❤️ Здоровье: <b style="color:var(--hp);">${player.hp} HP</b></div>
        <div>⚡ Начальная Боевая Мощь: <b style="color:var(--accent-light);">${calcCombatPower(player).toLocaleString()}</b></div>
        <div>🛑 Потолок силы ${player.generation}-го поколения: <b style="color:var(--gold);">${cap} БМ</b></div>
      </div>
    `;
  }
  const modal = document.getElementById("birth-modal");
  if (modal) modal.style.display = "flex";
}

function closeBirthModal() {
  const modal = document.getElementById("birth-modal");
  if (modal) modal.style.display = "none";
  playSound("click");
}

// ------------------------------------------
// 5. ОСНОВНОЙ РЕНДЕР ИНТЕРФЕЙСА (БЕЗОПАСНЫЙ)
// ------------------------------------------

function renderUI() {
  if (!player) return;

  const setSafeText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };
  const setSafeHtml = (id, html) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };

  setSafeText("char-gender-icon", player.gender === "male" ? "♂️" : "♀️");
  setSafeText("char-name", player.name);
  setSafeText("char-region", `${player.race} • ${REGIONS[player.currentRegionKey]?.name || 'Мир'}`);
  setSafeText("char-family-status-badge", player.familyStatus ? player.familyStatus.name : "Простолюдины");
  setSafeText("world-year", `${currentWorldYear} г. К.Д.`);
  setSafeText("age", `${player.age} лет`);

  const apBadge = document.getElementById("char-ap");
  if (apBadge) {
    apBadge.innerText = `⚡ ${player.ap}/${player.maxAp} сил`;
    apBadge.style.background = player.ap === 0 ? "rgba(239, 68, 68, 0.2)" : "#312e81";
    apBadge.style.borderColor = player.ap === 0 ? "var(--hp)" : "#4f46e5";
  }

  const traitEl = document.getElementById("char-trait");
  if (traitEl && player.trait) {
    traitEl.innerText = player.trait.name;
    traitEl.className = `tag badge-${player.trait.rarity || 'common'}`;
  }

  const cp = calcCombatPower(player);
  setSafeText("char-cp", cp.toLocaleString());

  const cap = (player.trait && player.trait.id === "god_mode") ? 999999999 : (GENERATION_CP_CAPS[player.generation] || 9999999);
  const capHint = document.getElementById("char-cp-cap-hint");
  if (capHint) {
    capHint.innerText = cp >= cap ? `[Предел ${player.generation}-го поколения: ${cap.toLocaleString()}]` : `Потолок ${player.generation}-го рода: ${cap.toLocaleString()}`;
  }

  setSafeText("char-guild-badge", player.age >= 10 ? `Ранг ${player.guildRank}` : "Гильдия: с 10 лет");

  let wRank = "Смертный";
  if (cp >= 1000000) wRank = "Мировое Бедствие 💥";
  else if (cp >= 180000) wRank = "Уровень Семи Сил 🏆";
  else if (cp >= 40000)  wRank = "Герой Ранга S 🌟";
  else if (cp >= 10000)  wRank = "Мастер Святого Ранга 🗡️";
  else if (cp >= 1500)   wRank = "Опытный Мечник";
  setSafeText("char-world-rank", wRank);

  // Живая молва бардов (работает даже соло)
  let bardText = "О вас пока шепчутся лишь в узких кругах...";
  if (cp >= 180000) bardText = "Живая легенда эпохи! Барды поют о вас при дворах всех шести континентов!";
  else if (cp >= 40000) bardText = "Сказания о вашей несокрушимой мощи поют при королевском дворе Асуры!";
  else if (cp >= 10000) bardText = "О вашем великом мастерстве клинка слагают баллады в лучших тавернах!";
  else if (cp >= 1500) bardText = "Барды в тавернах поют о подающем надежды молодом воине!";
  setSafeText("bard-fame-text", bardText);

  // Демонические глаза
  const eyeL = document.getElementById("eye-left");
  const eyeR = document.getElementById("eye-right");
  if (eyeL) {
    if (player.demonEyes?.left) {
      eyeL.className = "eye-slot active";
      eyeL.innerText = player.demonEyes.left.name;
    } else {
      eyeL.className = "eye-slot";
      eyeL.innerText = "👁️ Левый: Обычный";
    }
  }
  if (eyeR) {
    if (player.demonEyes?.right) {
      eyeR.className = "eye-slot active";
      eyeR.innerText = player.demonEyes.right.name;
    } else {
      eyeR.className = "eye-slot";
      eyeR.innerText = "👁️ Правый: Обычный";
    }
  }

  // Языки
  setSafeText("char-languages-text", (player.languages || ["human"]).map(l => LANGUAGES[l]?.name || l).join(", "));

  // Регенерация HP от жилья
  let currentRegen = 5;
  if (player.familySeat) {
    const seatObj = ESTATES.find(e => e.id === player.familySeat);
    if (seatObj) currentRegen = seatObj.hpRegen || 15;
  }
  setSafeText("hp-regen-hint", `(+${currentRegen} HP/г. от жилья)`);

  setSafeText("hp-text", `${player.hp}/${player.maxHp}`);
  const hpBar = document.getElementById("hp-bar");
  if (hpBar) hpBar.style.width = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100)) + "%";

  setSafeText("mana-text", `${player.mana}/${player.maxMana}`);
  const manaBar = document.getElementById("mana-bar");
  if (manaBar) manaBar.style.width = Math.min(100, (player.mana / player.maxMana) * 100) + "%";

  // Травмы
  const injBanner = document.getElementById("injuries-banner");
  if (injBanner) {
    if (player.injuries && player.injuries.length > 0) {
      injBanner.style.display = "block";
      injBanner.innerHTML = player.injuries.map(i => `<span class="badge-mythic" style="font-size:10px; margin-right:4px;">⚠️ ${i.name}</span>`).join("");
    } else {
      injBanner.style.display = "none";
    }
  }

  // Резиденция
  const resBadge = document.getElementById("estate-residence-badge");
  if (resBadge) {
    if (player.familySeat) {
      const seatObj = ESTATES.find(e => e.id === player.familySeat);
      resBadge.innerHTML = `<span style="font-size:10px; background:#1e1b4b; border:1px solid #6366f1; color:#c7d2fe; padding:2px 6px; border-radius:4px;">🏰 Родовой Замок: ${seatObj?.name || 'Поместье'}</span>`;
    } else {
      resBadge.innerHTML = `<span style="font-size:10px; color:var(--muted);">🏡 Нет назначенного фамильного замка</span>`;
    }
  }

  // Работа (законная и теневая)
  const jobBox = document.getElementById("job-badge-container");
  if (jobBox) {
    let jobHtml = "";
    if (player.currentJob) {
      const jData = getJobDataById(player.currentJob);
      const curRank = jData?.ranks[player.jobRankIndex];
      jobHtml += `<span style="font-size:10px; background:#1e293b; border:1px solid #38bdf8; color:#7dd3fc; padding:2px 6px; border-radius:4px; margin-right:4px;">💼 ${curRank?.title || 'Служащий'} (+${curRank?.salary || 0}🪙/г.)</span>`;
    }
    if (player.currentUndergroundJob) {
      const uJob = UNDERGROUND_JOBS[player.currentRegionKey];
      const curURank = uJob?.ranks[player.undergroundRankIndex];
      jobHtml += `<span style="font-size:10px; background:#450a0a; border:1px solid #ef4444; color:#fca5a5; padding:2px 6px; border-radius:4px;">🗡️ Тень: ${curURank?.title || 'Вор'} (+${curURank?.salary || 0}🪙/г.)</span>`;
    }
    if (!jobHtml) jobHtml = `<span style="font-size:10px; color:var(--muted);">💼 Без постоянной службы</span>`;
    jobBox.innerHTML = jobHtml;
  }

  // Дворянский титул
  const polBox = document.getElementById("politics-badge-container");
  if (polBox) {
    const titleObj = ASURA_POLITICS.nobilityTitles.find(t => t.id === player.nobilityTitle) || ASURA_POLITICS.nobilityTitles[0];
    let factionName = "Вне политики";
    if (player.asuraFaction === "ariel") factionName = "Сторонник Ариэль 👑";
    if (player.asuraFaction === "prince_first") factionName = "Партия 1-го Принца 🦁";
    if (player.asuraFaction === "prince_second") factionName = "Партия 2-го Принца 🐍";
    polBox.innerHTML = `<span style="font-size:10px; background:#2e1065; border:1px solid #a855f7; color:#e9d5ff; padding:2px 6px; border-radius:4px;">👑 Титул: ${titleObj.name} • ${factionName} (Влияние: ${player.asuraInfluence})</span>`;
  }

  // Катаклизм
  const calBanner = document.getElementById("calamity-status-banner");
  if (calBanner) {
    const lostFamily = (player.relations || []).filter(r => r.isLost);
    if (player.calamityTriggered && lostFamily.length > 0) {
      calBanner.style.display = "block";
      calBanner.innerHTML = `<div style="background:#450a0a; border:1px solid #ef4444; border-radius:8px; padding:6px; font-size:11px; color:#fca5a5;">⚡ <b>Катаклизм Фитоа:</b> Пропали без вести: ${lostFamily.map(r => r.name).join(", ")}. Ищите их в городах!</div>`;
    } else {
      calBanner.style.display = "none";
    }
  }

  setSafeText("magic", calculateRank(player.magicExp, MAGIC_RANKS));
  setSafeText("sword-god", calculateRank(player.swordGodExp, SWORD_RANKS));
  setSafeText("water-god", calculateRank(player.waterGodExp, SWORD_RANKS));
  setSafeText("north-god", calculateRank(player.northGodExp, SWORD_RANKS));
  setSafeText("intellect", player.intellect);
  setSafeText("coins", player.coins.toLocaleString());

  setSafeText("slot-weapon", player.equipment?.weapon ? player.equipment.weapon.name : "Кулаки");
  setSafeText("slot-armor", player.equipment?.armor ? player.equipment.armor.name : "Одежда");
  setSafeText("slot-accessory", player.equipment?.accessory ? player.equipment.accessory.name : "Нет");

  renderLifeStorySection();
}

function updateUI() {
  renderUI();
  saveGame();
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.add('active');

  const navMap = { character: 0, activities: 1, inventory: 2, guild: 3, relations: 4 };
  const navItems = document.querySelectorAll('.nav-item');
  if (navItems[navMap[tabId]]) navItems[navMap[tabId]].classList.add('active');

  if (tabId === 'activities') renderActivities();
  if (tabId === 'inventory') { renderInventoryTab(); renderFamilyCastle(); renderTestament(); renderCaravans(); renderEstates(); }
  if (tabId === 'guild') { renderGuildTab(); renderSquad(); }
  if (tabId === 'relations') { renderRelations(); renderChaosBreaker(); renderGreyratBranches(); renderTablets(); renderLanguages(); }
  playSound("click");
}

function setWorldSubTab(sub, btnEl) {
  const tabs = ['relations', 'perugius', 'greyrat', 'tablets', 'politics', 'tree', 'languages', 'travel', 'schools'];
  tabs.forEach(t => {
    const el = document.getElementById(`world-sub-${t}`);
    if (el) el.style.display = (t === sub) ? 'block' : 'none';
  });

  if (btnEl) {
    btnEl.parentElement.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }

  if (sub === 'relations') renderRelations();
  if (sub === 'perugius') renderChaosBreaker();
  if (sub === 'greyrat') renderGreyratBranches();
  if (sub === 'tablets') renderTablets();
  if (sub === 'politics') renderPolitics();
  if (sub === 'tree') renderDynastyTree();
  if (sub === 'languages') renderLanguages();
  if (sub === 'travel') renderTravelTab();
  if (sub === 'schools') renderSchools();
  playSound("click");
}

// ------------------------------------------
// 6. СЮЖЕТНЫЕ ВЕХИ
// ------------------------------------------

function renderLifeStorySection() {
  const container = document.getElementById("life-story-container");
  const badge = document.getElementById("story-notify-badge");
  if (!container) return;

  const availableStories = STORY_ACTIVITIES.filter(s => player.age >= s.age && !player.storyCompleted.includes(s.id));
  
  if (badge) badge.style.display = (availableStories.length > 0) ? "inline-block" : "none";

  container.innerHTML = "";
  if (availableStories.length === 0) {
    container.innerHTML = `<div style="font-size:11px; color:var(--muted); padding:6px;">Все ключевые исторические вехи текущего возраста завершены. Взрослейте дальше!</div>`;
    return;
  }

  availableStories.forEach(st => {
    const card = document.createElement("div");
    card.className = "activity-card";
    card.style.borderColor = "var(--gold)";
    card.innerHTML = `
      <div class="act-info">
        <div class="act-title-row">
          <span class="act-name" style="color:var(--gold);">${st.name}</span>
          <span class="act-age-badge">с ${st.age} лет</span>
        </div>
        <div class="act-desc">${st.desc}</div>
      </div>
      <button style="background:linear-gradient(135deg, #b45309, #d97706); min-width:110px;" onclick="performStoryActivity('${st.id}')">
        ✨ Свершить
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

  if (st.id === "story_10_calamity") playSound("calamity");
  else playSound("win");

  showActionModal("Историческая Веха", res, "📜");
  updateUI();
}

// ------------------------------------------
// 7. ДЕЛА, СЛУЖБА И ТЕНЕВОЕ ПОДПОЛЬЕ
// ------------------------------------------

function setActivityCategory(cat, btnEl) {
  currentActivityCategory = cat;
  document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderActivities();
  playSound("click");
}

function renderActivities() {
  const container = document.getElementById("activities-container");
  if (!container) return;
  container.innerHTML = "";

  if (currentActivityCategory === "job") {
    renderJobMarket(container);
    return;
  }
  if (currentActivityCategory === "underground") {
    renderUndergroundMarket(container);
    return;
  }

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
        <div class="act-title-row">
          <span class="act-name">${act.name}</span>
          <span class="act-age-badge">Возраст: ${act.minAge}–${act.maxAge} лет</span>
        </div>
        <div class="act-desc">${act.desc}</div>
        <div class="act-req">⚡ Требует: ${act.apCost} силы ${act.cost > 0 ? `• Стоимость: ${act.cost}🪙` : ''}</div>
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
    showActionModal("Усталость", "Вы слишком истощены! Нажмите «Прожить 1 год», чтобы восстановить силы.", "💤");
    return;
  }

  if (act.cost && player.coins < act.cost) {
    showActionModal("Нехватка монет", `Недостаточно золота! Требуется ${act.cost}🪙.`, "🪙");
    return;
  }

  player.ap -= act.apCost;
  const resultMsg = act.action(player);
  log(resultMsg);

  if (act.category === "combat") playSound("sword");
  else if (act.category === "magic") playSound("magic");
  else playSound("click");

  showActionModal(act.name, resultMsg, "✨");
  updateUI();
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
      <b style="color:#38bdf8; font-size:14px;">💼 Ваша законная служба: ${jData.name}</b>
      <div style="font-size:12px; color:#fff; margin-top:4px;">Текущий чин: <b>${curRank.title}</b></div>
      <div style="font-size:11px; color:var(--muted);">${curRank.desc}</div>
      <div style="font-size:11px; color:var(--gold); margin-top:4px;">Жалование: <b>+${curRank.salary} 🪙/год</b></div>

      ${nextRank ? `
        <div style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.08); padding-top:8px;">
          <div style="font-size:11px; color:var(--accent-light);">Следующий чин: <b>${nextRank.title}</b> (+${nextRank.salary} 🪙)</div>
          <div style="font-size:10px; color:var(--muted);">Требования: с ${nextRank.minAge} лет ${nextRank.minSword ? `• Меч ${nextRank.minSword}+` : ''} ${nextRank.minMagic ? `• Магия ${nextRank.minMagic}+` : ''} ${nextRank.minInt ? `• Знания ${nextRank.minInt}+` : ''}</div>
          <button style="margin-top:6px; width:100%; background:#2563eb;" onclick="tryJobPromotion()">🎖️ Добиться повышения в чине</button>
        </div>
      ` : '<div style="color:var(--gold); font-size:11px; margin-top:6px;">🌟 Вы достигли вершины карьеры!</div>'}

      <button class="action-danger" style="margin-top:8px; width:100%; font-size:11px;" onclick="quitJob()">Подать в отставку</button>
    `;
    container.appendChild(card);
    return;
  }

  container.innerHTML += `<div style="font-size:12px; color:var(--muted); margin-bottom:8px;">Законные службы региона (${REGIONS[player.currentRegionKey]?.name || 'Провинция'}):</div>`;

  if (currentJobsInRegion.length === 0) {
    container.innerHTML += `<div style="color:var(--muted); padding:10px;">В этой провинции нет открытых вакансий Короны.</div>`;
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
        <div style="font-size:11px; color:var(--muted);">Чин: ${firstRank.title} (+${firstRank.salary} 🪙/г.)</div>
        <div style="font-size:10px; color:var(--accent-light);">Возраст: с ${firstRank.minAge} лет</div>
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
  const msg = `Вы приняты на службу: <b>${jData.name}</b> в чине «${jData.ranks[0].title}»!`;
  log(msg);
  playSound("win");
  showActionModal("Поступление на службу", msg, "💼");
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
    const msg = `<b>ПОВЫШЕНИЕ!</b> Ваш новый чин: <b>${nextRank.title}</b>! Жалование: +${nextRank.salary}🪙/год!`;
    log(msg);
    playSound("win");
    showActionModal("Повышение", msg, "🎖️");
  } else {
    showActionModal("Отказ", "Вы пока не соответствуете всем требованиям для получения следующего чина!", "❌");
  }
  updateUI();
  renderActivities();
}

function quitJob() {
  player.currentJob = null;
  player.jobRankIndex = 0;
  log("Вы подали в отставку со службы.");
  playSound("click");
  showActionModal("Отставка", "Вы покинули службу Короны.", "📜");
  updateUI();
  renderActivities();
}

// Теневое подполье
function renderUndergroundMarket(container) {
  const uJob = UNDERGROUND_JOBS[player.currentRegionKey];
  if (!uJob) {
    container.innerHTML = `<div style="color:var(--muted); padding:10px;">В этом регионе нет организованного синдиката.</div>`;
    return;
  }

  if (player.currentUndergroundJob) {
    const curRank = uJob.ranks[player.undergroundRankIndex];
    const nextRank = uJob.ranks[player.undergroundRankIndex + 1];

    const card = document.createElement("div");
    card.className = "card";
    card.style.background = "#201115";
    card.style.borderColor = "#ef4444";
    card.innerHTML = `
      <b style="color:#f87171; font-size:14px;">🗡️ Теневое Подполье: ${uJob.name}</b>
      <div style="font-size:12px; color:#fff; margin-top:4px;">Ваша роль: <b>${curRank.title}</b></div>
      <div style="font-size:11px; color:var(--muted);">${curRank.desc}</div>
      <div style="font-size:11px; color:var(--gold); margin-top:4px;">Теневой куш: <b>+${curRank.salary} 🪙/год</b> • Риск ареста: <b>${Math.round(curRank.risk * 100)}%</b></div>

      ${nextRank ? `
        <div style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.08); padding-top:8px;">
          <div style="font-size:11px; color:#fca5a5;">Следующая ступень: <b>${nextRank.title}</b> (+${nextRank.salary} 🪙)</div>
          <button style="margin-top:6px; width:100%; background:#b91c1c;" onclick="tryUndergroundPromotion()">💀 Занять более высокий пост в банде</button>
        </div>
      ` : '<div style="color:var(--gold); font-size:11px; margin-top:6px;">👑 Вы — теневой владыка преступного мира провинции!</div>'}

      <button class="action-danger" style="margin-top:8px; width:100%; font-size:11px;" onclick="quitUndergroundJob()">Залечь на дно (Покинуть синдикат)</button>
    `;
    container.appendChild(card);
    return;
  }

  container.innerHTML += `<div style="font-size:12px; color:var(--muted); margin-bottom:8px;">Криминальное подполье (${REGIONS[player.currentRegionKey]?.name || 'Провинция'}):</div>`;

  const firstRank = uJob.ranks[0];
  const canJoin = player.age >= firstRank.minAge;

  const uCard = document.createElement("div");
  uCard.className = "job-card";
  uCard.style.borderColor = "#7f1d1d";
  uCard.innerHTML = `
    <div>
      <b style="color:#f87171;">${uJob.name}</b>
      <div style="font-size:11px; color:var(--muted);">Первая роль: ${firstRank.title} (+${firstRank.salary} 🪙/г.)</div>
      <div style="font-size:10px; color:#fca5a5;">Риск ареста стражей: ${Math.round(firstRank.risk * 100)}%</div>
    </div>
    <button ${canJoin ? '' : 'disabled'} style="background:#991b1b;" onclick="applyForUndergroundJob()">
      ${canJoin ? 'Вступить в банду' : 'Слишком юн'}
    </button>
  `;
  container.appendChild(uCard);
}

function applyForUndergroundJob() {
  const uJob = UNDERGROUND_JOBS[player.currentRegionKey];
  player.currentUndergroundJob = uJob.id;
  player.undergroundRankIndex = 0;
  const msg = `Вы примкнули к криминалу: <b>${uJob.name}</b> как «${uJob.ranks[0].title}»! Берегитесь облав стражи!`;
  log(msg);
  playSound("death");
  showActionModal("Криминальное подполье", msg, "🗡️");
  updateUI();
  renderActivities();
}

function tryUndergroundPromotion() {
  const uJob = UNDERGROUND_JOBS[player.currentRegionKey];
  const nextRank = uJob.ranks[player.undergroundRankIndex + 1];
  if (!nextRank) return;

  const meetsAge = player.age >= nextRank.minAge;
  const meetsNorth = !nextRank.minNorth || player.northGodExp >= nextRank.minNorth;
  const meetsSword = !nextRank.minSword || player.swordGodExp >= nextRank.minSword;
  const meetsMagic = !nextRank.minMagic || player.magicExp >= nextRank.minMagic;

  if (meetsAge && meetsNorth && meetsSword && meetsMagic) {
    player.undergroundRankIndex++;
    const msg = `💀 <b>АВТОРИТЕТ В ПОДПОЛЬЕ ВЫРОС!</b> Ваша новая роль: <b>${nextRank.title}</b>! Годовой куш: +${nextRank.salary}🪙!`;
    log(msg);
    playSound("win");
    showActionModal("Власть в Синдикате", msg, "💀");
  } else {
    showActionModal("Отказ", "Главари банды считают, что у вас недостаточно боевого или воровского опыта!", "❌");
  }
  updateUI();
  renderActivities();
}

function quitUndergroundJob() {
  player.currentUndergroundJob = null;
  player.undergroundRankIndex = 0;
  log("Вы порвали связи с теневым синдикатом и залегли на дно.");
  playSound("click");
  showActionModal("Залечь на дно", "Вы покинули преступную организацию.", "🕶️");
  updateUI();
  renderActivities();
}

// ------------------------------------------
// 8. ЗАВЕЩАНИЕ, ЗАМОК, КАРАВАНЫ И ПРОДАЖА
// ------------------------------------------

function renderTestament() {
  const container = document.getElementById("testament-container");
  if (!container) return;
  container.innerHTML = "";

  const children = (player.children || []).filter(c => !c.isDead);
  const heir = children.find(c => c.id === player.appointedHeirId);

  container.innerHTML = `
    <div class="testament-card" style="background:#1b1828; border-color:#c084fc;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <b style="color:#e9d5ff; font-size:13px;">📜 Фамильное Завещание Династии</b>
        <span class="badge-legendary">${heir ? 'Наследник: ' + heir.name : 'Наследник не назначен'}</span>
      </div>
      <div style="font-size:11px; color:var(--muted); margin:4px 0;">
        Назначенный наследник после вашей смерти получит <b>100% семейного золота без потерь</b>, все замки, поместья и статус рода!
      </div>

      ${children.length > 0 ? `
        <div style="margin-top:8px;">
          <label style="font-size:10px;">Выберите официального наследника престола рода:</label>
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
            ${children.map(c => {
              const isAppointed = (player.appointedHeirId === c.id);
              return `<button style="font-size:10px; padding:5px 8px; background:${isAppointed ? '#059669' : '#312e81'};" onclick="appointTestamentHeir('${c.id}')">
                ${isAppointed ? '👑 Главный наследник: ' + c.name : 'Назначить: ' + c.name}
              </button>`;
            }).join("")}
          </div>
        </div>
      ` : '<div style="font-size:11px; color:#fbbf24; margin-top:4px;">У вас пока нет детей. Заведите ребенка в браке, чтобы передать ему наследство!</div>'}
    </div>
  `;
}

function appointTestamentHeir(childId) {
  player.appointedHeirId = childId;
  const child = player.children.find(c => c.id === childId);
  const msg = `Вы официально заверили родовое завещание: <b>${child.name}</b> объявлен(а) единственным законным преемником рода ${player.surname}!`;
  log(msg);
  playSound("win");
  showActionModal("Фамильное Завещание", msg, "👑");
  updateUI();
  renderTestament();
}

function renderFamilyCastle() {
  const container = document.getElementById("family-castle-container");
  if (!container) return;
  container.innerHTML = "";

  if (!player.estates || player.estates.length === 0) {
    container.innerHTML = `<div style="font-size:11px; color:var(--muted); padding:6px;">Купите недвижимость ниже, чтобы сделать её Фамильным Замком!</div>`;
    return;
  }

  const currentSeat = player.familySeat ? ESTATES.find(e => e.id === player.familySeat) : null;

  container.innerHTML += `
    <div class="castle-card" style="background:#1e1a2f; border-color:#8b5cf6;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <b style="color:#e9d5ff; font-size:13px;">🏰 Главное Родовое Гнездо</b>
        <span class="badge-legendary">${currentSeat ? currentSeat.name : 'Не назначено'}</span>
      </div>
      <div style="font-size:11px; color:var(--muted); margin:4px 0;">
        ${currentSeat ? `Резиденция ускоряет регенерацию: <b>+${currentSeat.hpRegen} HP/год</b>.` : 'Назначьте одно из имений родовым замком рода!'}
      </div>

      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
        ${player.estates.map(estId => {
          const estObj = ESTATES.find(e => e.id === estId);
          const isSeat = (player.familySeat === estId);
          return `<button style="font-size:10px; padding:5px 8px; background:${isSeat ? '#059669' : '#312e81'};" onclick="setFamilySeat('${estId}')">${isSeat ? '✓ Резиденция' : 'Сделать главной: ' + estObj.name}</button>`;
        }).join("")}
      </div>
    </div>
  `;

  if (player.familySeat) {
    container.innerHTML += `<div class="section-title" style="margin-top:8px;">Улучшения Родового Замка</div>`;
    player.castleUpgrades = player.castleUpgrades || [];

    CASTLE_UPGRADES.forEach(upg => {
      const isBuilt = player.castleUpgrades.includes(upg.id);
      const uCard = document.createElement("div");
      uCard.className = "shop-item";
      uCard.innerHTML = `
        <div>
          <b>${upg.name}</b> ${isBuilt ? '<span style="color:var(--green); font-size:10px;">(Построено ✓)</span>' : ''}
          <div style="font-size:11px; color:var(--muted);">${upg.desc}</div>
          <div style="font-size:10px; color:var(--gold);">Стоимость: ${upg.cost} 🪙</div>
        </div>
        <button ${isBuilt ? 'disabled' : ''} style="background:${isBuilt ? '#059669' : '#4338ca'};" onclick="buildCastleUpgrade('${upg.id}')">
          ${isBuilt ? 'Построено' : 'Возвести'}
        </button>
      `;
      container.appendChild(uCard);
    });

    if (player.castleUpgrades.includes("crypt")) {
      const canMeditate = (player.age - (player.lastCryptMeditationAge || -10)) >= 5;
      const cryptCard = document.createElement("div");
      cryptCard.className = "card";
      cryptCard.style.marginTop = "6px";
      cryptCard.style.background = "#181422";
      cryptCard.style.borderColor = "#a855f7";
      cryptCard.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <b style="color:#f3e8ff; font-size:13px;">🕯️ Молитва в Склепе Предков</b>
            <div style="font-size:11px; color:var(--muted);">Медитация у гробниц предыдущих поколений династии (раз в 5 лет).</div>
          </div>
          <button ${canMeditate ? '' : 'disabled'} style="background:#7e22ce; font-size:11px;" onclick="meditateInCrypt()">
            ${canMeditate ? 'Медитировать' : `Осталось ${5 - (player.age - player.lastCryptMeditationAge)} л.`}
          </button>
        </div>
      `;
      container.appendChild(cryptCard);
    }
  }
}

function setFamilySeat(estateId) {
  player.familySeat = estateId;
  const est = ESTATES.find(e => e.id === estateId);
  const msg = `Вы объявили <b>${est.name}</b> фамильным замком! Регенерация HP выросла до +${est.hpRegen}/год.`;
  log(msg);
  playSound("win");
  showActionModal("Родовой Замок", msg, "🏰");
  updateUI();
  renderFamilyCastle();
}

function buildCastleUpgrade(upgId) {
  const upg = CASTLE_UPGRADES.find(u => u.id === upgId);
  if (!upg) return;

  if (player.coins < upg.cost) {
    showActionModal("Недостаточно золота", `Нужно ${upg.cost} монет!`, "🪙");
    return;
  }

  player.coins -= upg.cost;
  player.castleUpgrades.push(upg.id);
  const msg = `В замке возведено: <b>${upg.name}</b>! ${upg.desc}`;
  log(msg);
  playSound("win");
  showActionModal("Строительство", msg, "🛠️");
  updateUI();
  renderFamilyCastle();
}

function meditateInCrypt() {
  player.lastCryptMeditationAge = player.age;
  player.hp = player.maxHp;
  player.mana = player.maxMana;
  player.swordGodExp += 25;
  player.magicExp += 25;
  const msg = `Вы преклонили колени перед саркофагами славных предков династии ${player.surname}. Духи прошлого благословили ваш разум (+25 к Мечу и Магии, полное восстановление HP и Маны)!`;
  log(msg);
  playSound("magic");
  showActionModal("Благословение Предков", msg, "🕯️");
  updateUI();
  renderFamilyCastle();
}

function renderCaravans() {
  const container = document.getElementById("caravans-container");
  if (!container) return;
  container.innerHTML = "";

  CARAVAN_ROUTES.forEach(route => {
    const card = document.createElement("div");
    card.className = "caravan-card";
    card.innerHTML = `
      <div>
        <b style="color:#fff;">${route.name}</b>
        <div style="font-size:11px; color:var(--muted);">${route.desc}</div>
        <div style="font-size:10px; color:var(--gold);">Вложения: ${route.cost} 🪙 • Возврат: +${route.reward} 🪙 • Риск: ${Math.round(route.risk * 100)}%</div>
      </div>
      <button style="background:#0284c7;" onclick="dispatchCaravan('${route.id}')">Отправить</button>
    `;
    container.appendChild(card);
  });
}

function dispatchCaravan(routeId) {
  if (player.ap < 1) { showActionModal("Усталость", "Нужно ⚡ 1 сила!", "💤"); return; }
  const route = CARAVAN_ROUTES.find(r => r.id === routeId);
  if (!route) return;

  if (player.coins < route.cost) {
    showActionModal("Недостаточно средств", `Требуется ${route.cost} монет!`, "🪙");
    return;
  }

  player.ap -= 1;
  player.coins -= route.cost;

  let riskMod = route.risk;
  if (player.castleUpgrades && player.castleUpgrades.includes("grand_vault")) riskMod -= 0.05;
  if (player.squad && player.squad.length >= 3) riskMod -= 0.10;

  if (Math.random() < Math.max(0.05, riskMod)) {
    const msg = `⚠️ Караван попал в засаду разбойников на маршруте «${route.name}»! Охрана рассеяна. Убыток: -${route.cost} монет.`;
    log(msg);
    playSound("death");
    showActionModal("Нападение на караван!", msg, "⚔️");
  } else {
    player.coins += route.reward;
    const profit = route.reward - route.cost;
    const msg = `🎉 Караван успешно вернулся! Получено: <b>+${route.reward}🪙</b> (Прибыль: +${profit} монет)!`;
    log(msg);
    playSound("coin");
    showActionModal("Караван прибыл!", msg, "🐪");
  }

  updateUI();
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
        <b style="color:#fff;">${est.name}</b> ${isOwned ? '<span style="color:var(--green); font-size:11px;">(В собственности ✓)</span>' : ''}
        <div style="font-size:11px; color:var(--muted);">${est.desc}</div>
        <div style="font-size:10px; color:var(--gold);">Цена: ${est.cost.toLocaleString()} 🪙</div>
      </div>
      <button ${isOwned ? 'disabled' : ''} onclick="buyEstate('${est.id}')" style="background:${isOwned ? '#059669' : '#312e81'};">
        ${isOwned ? 'Куплено' : 'Купить'}
      </button>
    `;
    container.appendChild(card);
  });
}

function buyEstate(estateId) {
  const est = ESTATES.find(e => e.id === estateId);
  if (!est) return;

  if (player.coins < est.cost) {
    showActionModal("Нехватка золота", "У вас недостаточно монет!", "🪙");
    return;
  }

  player.coins -= est.cost;
  player.estates = player.estates || [];
  player.estates.push(est.id);
  
  if (!player.familySeat) player.familySeat = est.id;

  const msg = `Вы приобрели недвижимость: <b>${est.name}</b>! Она приносит доход каждый год.`;
  log(msg);
  playSound("win");
  showActionModal("Покупка Недвижимости", msg, "🏰");
  updateUI();
  renderEstates();
  renderFamilyCastle();
}

// Рюкзак с возможностью ПРОДАЖИ ненужного снаряжения (50% цены)
function renderInventoryTab() {
  const invCont = document.getElementById("inventory-list");
  if (!invCont) return;
  invCont.innerHTML = "";

  if ((!player.inventory || player.inventory.length === 0) && player.potionsCount === 0) {
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
      const sellPrice = Math.max(5, Math.floor(item.cost * 0.5));
      const itemDiv = document.createElement("div");
      itemDiv.className = "shop-item";
      itemDiv.innerHTML = `
        <div>
          <b>${item.name}</b> (+${item.cp} БМ)
          <div style="font-size:11px; color:var(--muted);">${item.desc}</div>
        </div>
        <div style="display:flex; gap:6px;">
          <button style="background:#4338ca; padding:6px 10px; font-size:11px;" onclick="equipItem(${idx})">Надеть</button>
          <button class="btn-sell" onclick="sellInventoryItem(${idx})">Продать (+${sellPrice}🪙)</button>
        </div>
      `;
      invCont.appendChild(itemDiv);
    });
  }

  const shopCont = document.getElementById("shop-list");
  if (!shopCont) return;
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

function sellInventoryItem(idx) {
  const item = player.inventory[idx];
  if (!item) return;

  const sellPrice = Math.max(5, Math.floor(item.cost * 0.5));
  player.coins += sellPrice;
  player.inventory.splice(idx, 1);

  const msg = `Вы продали торговцу <b>${item.name}</b> и получили <b>+${sellPrice} монет</b>!`;
  log(msg);
  playSound("coin");
  showActionModal("Продажа снаряжения", msg, "🪙");
  updateUI();
  renderInventoryTab();
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

function buyShopItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;

  if (player.coins < item.cost) {
    showActionModal("Нехватка монет", "Недостаточно золота для покупки!", "🪙");
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
  showActionModal("Покупка", `Вы приобрели: <b>${item.name}</b>!`, "🛒");
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
  showActionModal("Снаряжение", `Вы экипировали: <b>${item.name}</b>!`, "⚔️");
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
  showActionModal("Зелье", "Вы восстановили 60 HP!", "🧪");
  updateUI();
  renderInventoryTab();
}

// ------------------------------------------
// 9. ЛАБИРИНТЫ
// ------------------------------------------

function renderGuildTab() {
  const gTag = document.getElementById("guild-status-tag");
  if (gTag) gTag.innerText = `Ранг: ${player.guildRank}`;
  const nextRank = ADVENTURER_RANKS[ADVENTURER_RANKS.indexOf(player.guildRank) + 1] || "MAX";
  const nextReq = ADVENTURER_REQ[nextRank] || "MAX";
  const gExpText = document.getElementById("guild-exp-text");
  if (gExpText) gExpText.innerText = `${player.guildExp} / ${nextReq} GP`;

  renderPowersMonument();

  const dungCont = document.getElementById("dungeon-container");
  if (!dungCont) return;
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
      <button ${!canEnter || isCompleted ? 'disabled' : ''} onclick="openDungeonExploration('${d.id}')" style="margin-top:6px; background:#4338ca; width:100%;">
        ${isCompleted ? '✓ Лабиринт зачищен' : !hasRank ? `Требуется Ранг ${d.reqRank}` : 'Войти в Лабиринт ⬇️ (Пошагово) (⚡ 1 сила)'}
      </button>
    `;
    dungCont.appendChild(dCard);
  });

  const qCont = document.getElementById("guild-quests-list");
  if (!qCont) return;
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

function openDungeonExploration(dungeonId) {
  if (player.ap < 1) { showActionModal("Усталость", "Нужно ⚡ 1 сила!", "💤"); return; }
  player.ap -= 1;

  if (checkSquadBetrayal()) return;

  const d = DUNGEONS.find(x => x.id === dungeonId);
  player.dungeonProgress[d.id] = player.dungeonProgress[d.id] || 1;
  activeDungeon = {
    id: dungeonId,
    obj: d,
    floor: player.dungeonProgress[d.id]
  };

  updateDungeonModalUI("Вы ступили под своды лабиринта. Воздух пропитан древней маной.");
  const modal = document.getElementById("dungeon-modal");
  if (modal) modal.style.display = "flex";
  playSound("sword");
}

function updateDungeonModalUI(text) {
  if (!activeDungeon) return;
  const d = activeDungeon.obj;
  const floor = player.dungeonProgress[d.id];

  const titleEl = document.getElementById("dung-modal-title");
  const floorEl = document.getElementById("dung-modal-floor-info");
  const hpText = document.getElementById("dung-hp-text");
  const hpBar = document.getElementById("dung-hp-bar");
  const bodyEl = document.getElementById("dung-modal-body");
  const actionsBox = document.getElementById("dung-modal-actions");

  if (titleEl) titleEl.innerText = d.name;
  if (floorEl) floorEl.innerText = `Этаж ${floor} из ${d.maxFloors}`;
  if (hpText) hpText.innerText = `${player.hp}/${player.maxHp}`;
  if (hpBar) hpBar.style.width = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100)) + "%";
  if (bodyEl) bodyEl.innerHTML = text;

  if (!actionsBox) return;
  actionsBox.innerHTML = "";

  if (floor > d.maxFloors) {
    actionsBox.innerHTML = `<button class="btn-main" onclick="closeDungeonModal()">👑 Покинуть покоренный лабиринт</button>`;
    return;
  }

  actionsBox.innerHTML = `
    <button style="background:#4338ca;" onclick="dungeonTurn('fight')">⚔️ Пробиваться сквозь монстров этажа</button>
    <button style="background:#1d4ed8;" onclick="dungeonTurn('scout')">👁️ Осторожная разведка тайников (Глаз/Ловкость)</button>
    <button style="background:#059669;" onclick="dungeonTurn('rest')">🧪 Перевести дух и сделать привал</button>
    <button class="action-danger" onclick="closeDungeonModal()">🏃 Отступить на поверхность</button>
  `;
}

function dungeonTurn(choice) {
  if (!activeDungeon) return;
  const d = activeDungeon.obj;
  let floor = player.dungeonProgress[d.id];
  let roll = Math.random();
  let logText = "";

  const hasManaSight = (player.demonEyes?.left?.id === "mana_sight" || player.demonEyes?.right?.id === "mana_sight");

  if (choice === "rest") {
    player.hp = Math.min(player.maxHp, player.hp + 30);
    player.mana = Math.min(player.maxMana, player.mana + 20);
    logText = "Отряд перевёл дух и восполнил силы (+30 HP, +20 маны).";
    playSound("magic");
  } else if (choice === "scout") {
    if (roll < 0.35 && floor > 1) {
      if (hasManaSight) {
        logText = "🔮 <b>Глаз Маны!</b> Вы увидели магический глиф ловушки и провели отряд мимо опасности!";
      } else {
        let back = Math.min(floor - 1, 2);
        player.dungeonProgress[d.id] -= back;
        logText = `🌀 <b>Телепортационная ловушка!</b> Вспышка глифа отбросила вас на -${back} этажа назад!`;
        playSound("calamity");
      }
    } else if (roll < 0.7) {
      let coinsFound = Math.floor(Math.random() * 90) + 45;
      player.coins += coinsFound;
      logText = `💎 В тайнике обнаружен кошель древней чеканки (+${coinsFound}🪙)!`;
      playSound("coin");
    } else {
      player.dungeonProgress[d.id]++;
      logText = `Вы разведали тайный проход и поднялись на ${player.dungeonProgress[d.id]} этаж!`;
      playSound("win");
    }
  } else if (choice === "fight") {
    let monsterCp = Math.floor(d.cpBase * (1 + floor * 0.45));
    let squadCp = calcSquadCombatPower(player);
    let dmg = Math.floor(monsterCp / (squadCp + 100) * 20) + 10;
    player.hp -= dmg;

    if (dmg > 35 && Math.random() < 0.25 && !player.injuries.some(i => i.id === "lost_arm")) {
      player.injuries.push({ id: "lost_arm", name: "Утрата левой руки" });
      logText = `🩸 <b>КРИТИЧЕСКАЯ ТРАВМА!</b> В бою монстр отсек вам левую руку! Срочно нужен протез! (-${dmg} HP).`;
      playSound("death");
    } else {
      logText = `⚔️ Вы сокрушили стражей ${floor} этажа! Получен урон: -${dmg} HP. Путь свободен!`;
      playSound("sword");
    }
    player.dungeonProgress[d.id]++;
  }

  if (player.dungeonProgress[d.id] > d.maxFloors) {
    let dropItem = SHOP_ITEMS.find(i => i.id === d.dropArtifact);
    if (dropItem && !player.inventory.some(x => x.id === dropItem.id)) {
      player.inventory.push(dropItem);
    }
    player.coins += 800;
    player.guildExp += 150;
    player.squadFame += 150;

    logText = `👑 <b>ПОЛНЫЙ ТРИУМФ!</b> Босс лабиринта ${d.name} сокрушен! Получена легендарная награда: <b>${dropItem ? dropItem.name : 'Древний артефакт'}</b> (+800🪙, +150 GP, +150 Славы)!`;
    playSound("win");
    log(logText);
  }

  updateDungeonModalUI(logText);
  updateUI();

  if (player.hp <= 0) {
    closeDungeonModal();
    handleDeath("Сгинул в глубинах древнего лабиринта.");
  }
}

function closeDungeonModal() {
  const modal = document.getElementById("dungeon-modal");
  if (modal) modal.style.display = "none";
  activeDungeon = null;
  playSound("click");
  updateUI();
  renderGuildTab();
}

// ------------------------------------------
// 10. ХАОС БРЕЙКЕР, ГРЕЙРАТЫ И СКРИЖАЛИ
// ------------------------------------------

function renderChaosBreaker() {
  const container = document.getElementById("perugius-container");
  if (!container) return;
  container.innerHTML = "";

  const myCp = calcCombatPower(player);

  container.innerHTML += `
    <div class="card" style="background:#1e1a2f; border-color:#eab308; margin-bottom:10px;">
      <b style="color:#fde047; font-size:13px;">🐉 Дрейфующая Цитадель Хаос Брейкер</b>
      <div style="font-size:11px; color:var(--muted); margin-top:2px;">
        Обитель Короля-Дракона Перугиуса Долы. Доступна героям с высоким признанием.
      </div>
    </div>
  `;

  PERUGIUS_TRIALS.forEach(tr => {
    const passed = player.perugiusTrials && player.perugiusTrials.includes(tr.rank);
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "8px";
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <b style="color:#fff;">#${tr.rank} ${tr.name}</b>
        <span class="badge-legendary">${passed ? 'Пройдено ✓' : 'Требует: ' + tr.reqCp.toLocaleString() + ' БМ'}</span>
      </div>
      <div style="font-size:11px; color:var(--muted); margin:4px 0;">Награда: ${tr.rewardText}</div>
      <button ${passed || myCp < tr.reqCp ? 'disabled' : ''} style="background:${passed ? '#059669' : '#eab308'}; color:${passed ? '#fff' : '#000'} !important; width:100%; margin-top:4px;" onclick="attemptPerugiusTrial(${tr.rank})">
        ${passed ? '✓ Испытание зачтено' : myCp < tr.reqCp ? 'Недостаточно боевой мощи' : 'Бросить вызов стражу'}
      </button>
    `;
    container.appendChild(card);
  });
}

function attemptPerugiusTrial(rank) {
  const tr = PERUGIUS_TRIALS.find(t => t.rank === rank);
  player.perugiusTrials = player.perugiusTrials || [];
  player.perugiusTrials.push(rank);

  if (rank === 3) {
    player.coins += 5000;
    player.trait = TRAITS.find(t => t.id === "laplace_factor") || player.trait;
  }

  const msg = `👑 <b>ВЫСШИЙ ТРИУМФ В ХАОС БРЕЙКЕРЕ!</b> Вы одолели стража #${rank} Перугиуса! Получено: ${tr.rewardText}!`;
  log(msg);
  playSound("win");
  showActionModal("Испытание Перугиуса", msg, "🐉");
  updateUI();
  renderChaosBreaker();
}

function renderGreyratBranches() {
  const container = document.getElementById("greyrat-branches-container");
  if (!container) return;
  container.innerHTML = "";

  container.innerHTML += `
    <div class="card" style="background:#20141a; border-color:#ef4444; margin-bottom:10px;">
      <b style="color:#fca5a5; font-size:13px;">🩸 Кровная Вражда Великого Дома Грейрат</b>
      <div style="font-size:11px; color:var(--muted); margin-top:2px;">
        Четыре ветви ведут скрытую войну за единовластие над королевством Асура.
      </div>
    </div>
  `;

  GREYRAT_BRANCHES.forEach(b => {
    const isAllied = player.greyratAllies && player.greyratAllies.includes(b.id);
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "8px";
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <b style="color:#fff;">${b.name}</b>
        <span class="badge-mythic">${isAllied ? 'В союзе ✓' : b.region}</span>
      </div>
      <div style="font-size:11px; color:var(--muted); margin:4px 0;">Глава ветви: <b>${b.leader}</b> • ${b.desc}</div>
      <button ${isAllied ? 'disabled' : ''} style="background:${isAllied ? '#059669' : '#b91c1c'}; width:100%; margin-top:4px;" onclick="negotiateGreyratBranch('${b.id}')">
        ${isAllied ? 'Союз заключен' : 'Отправить послов (Заключить пакт крови) (⚡ 1 сила)'}
      </button>
    `;
    container.appendChild(card);
  });
}

function negotiateGreyratBranch(branchId) {
  if (player.ap < 1) { showActionModal("Усталость", "Нужно ⚡ 1 сила!", "💤"); return; }
  player.ap -= 1;
  player.greyratAllies = player.greyratAllies || [];

  const b = GREYRAT_BRANCHES.find(x => x.id === branchId);
  if (player.asuraInfluence >= 30 || player.swordGodExp >= 80 || calcCombatPower(player) > 10000) {
    player.greyratAllies.push(branchId);
    player.asuraInfluence += 25;
    const msg = `Вы заключили династический пакт с <b>${b.name}</b>! Авторитет дома Грейрат объединен (+25 влияния)!`;
    log(msg);
    playSound("win");
    showActionModal("Династический Союз", msg, "🩸");
  } else {
    const msg = `Послы ${b.name} надменно отвергли предложение: ваш статус пока недостаточно велик.`;
    log(msg);
    playSound("click");
    showActionModal("Отказ послов", msg, "📜");
  }
  updateUI();
  renderGreyratBranches();
}

function renderTablets() {
  const container = document.getElementById("tablets-container");
  if (!container) return;
  container.innerHTML = "";

  player.tabletsDeciphered = player.tabletsDeciphered || [];

  container.innerHTML += `
    <div class="card" style="background:#151c28; border-color:#38bdf8; margin-bottom:10px;">
      <b style="color:#38bdf8; font-size:13px;">📜 Археология: Расшифровано ${player.tabletsDeciphered.length}/5 Скрижалей</b>
      <div style="font-size:11px; color:var(--muted); margin-top:2px;">
        Соберите древнюю истину Первой Войны для открытия священного заклинания.
      </div>
    </div>
  `;

  FIRST_WAR_TABLETS.forEach(t => {
    const isDone = player.tabletsDeciphered.includes(t.id);
    const knowsLang = player.languages && player.languages.includes(t.reqLang);
    const inRegion = player.currentRegionKey === t.regionKey;
    const canDecipher = !isDone && knowsLang && inRegion;

    const card = document.createElement("div");
    card.className = "tablet-card";
    card.innerHTML = `
      <div>
        <b style="color:#fff;">${t.name}</b> ${isDone ? '<span style="color:var(--green); font-size:11px;">(Расшифровано ✓)</span>' : ''}
        <div style="font-size:11px; color:var(--muted);">${t.desc}</div>
        <div style="font-size:10px; color:var(--accent-light);">Язык: ${LANGUAGES[t.reqLang]?.name} • Регион: ${REGIONS[t.regionKey]?.name || 'Мир'}</div>
      </div>
      <button ${canDecipher ? '' : 'disabled'} style="background:${isDone ? '#059669' : '#0284c7'};" onclick="decipherTablet('${t.id}')">
        ${isDone ? 'Готово' : !knowsLang ? 'Не знаете языка' : !inRegion ? 'Прибудьте в регион' : 'Расшифровать'}
      </button>
    `;
    container.appendChild(card);
  });
}

function decipherTablet(tabletId) {
  player.tabletsDeciphered = player.tabletsDeciphered || [];
  player.tabletsDeciphered.push(tabletId);
  player.intellect += 20;
  player.maxMana += 30;

  const t = FIRST_WAR_TABLETS.find(x => x.id === tabletId);
  let msg = `Вы перевели древние символы на «${t.name}» (+20 к Знаниям, +30 макс. маны)!`;

  if (player.tabletsDeciphered.length === 5) {
    player.maxMana += 200;
    player.magicExp += 200;
    msg += `<br><br>🌟 <b>ВЕЛИКОЕ ОТКРЫТИЕ!</b> Вы расшифровали все 5 скрижалей Первой Войны! Открыто Священное Заклинание Изначального Бога (+200 ко всем школам магии)!`;
    playSound("win");
  } else {
    playSound("magic");
  }

  log(msg);
  showActionModal("Расшифровка Скрижали", msg, "📜");
  updateUI();
  renderTablets();
}

function renderLanguages() {
  const container = document.getElementById("languages-container");
  if (!container) return;
  container.innerHTML = "";

  player.languages = player.languages || ["human"];

  for (let lKey in LANGUAGES) {
    const lObj = LANGUAGES[lKey];
    const isKnown = player.languages.includes(lKey);
    const card = document.createElement("div");
    card.className = "lang-card";
    card.innerHTML = `
      <div>
        <b style="color:#fff;">${lObj.name}</b> ${isKnown ? '<span style="color:var(--green); font-size:11px;">(Изучено ✓)</span>' : ''}
        <div style="font-size:11px; color:var(--muted);">${lObj.desc}</div>
      </div>
      <button ${isKnown ? 'disabled' : ''} style="background:${isKnown ? '#059669' : '#312e81'};" onclick="learnLanguage('${lKey}')">
        ${isKnown ? 'Изучено' : 'Учить язык (60🪙, ⚡ 1 сила)'}
      </button>
    `;
    container.appendChild(card);
  }
}

function learnLanguage(langKey) {
  if (player.ap < 1) { showActionModal("Усталость", "Нужно ⚡ 1 сила!", "💤"); return; }
  if (player.coins < 60) { showActionModal("Нехватка золота", "Нужно 60 монет на словари!", "🪙"); return; }

  player.ap -= 1;
  player.coins -= 60;
  player.languages = player.languages || ["human"];
  player.languages.push(langKey);
  player.intellect += 8;

  const l = LANGUAGES[langKey];
  const msg = `Вы овладели наречием: <b>${l.name}</b> (+8 к Знаниям)!`;
  log(msg);
  playSound("win");
  showActionModal("Изучение Языка", msg, "🗣️");
  updateUI();
  renderLanguages();
}

// ------------------------------------------
// 11. СОЦИАЛЬНЫЕ ДЕЙСТВИЯ, СТАРЕНИЕ И СМЕРТЬ NPC
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
    if (npc.isDead) statusClass = "status-dead";
    else if (npc.relation < 30) statusClass = "status-enemy";
    else if (npc.status === "Супруг/Супруга") statusClass = "status-married";
    else if (npc.status === "Пара") statusClass = "status-love";

    const isOpened = (currentOpenedNpcId === npc.id);
    const inSquad = player.squad && player.squad.some(m => m.id === npc.id);

    const card = document.createElement("div");
    card.className = "relation-card";
    card.innerHTML = `
      <div class="rel-header" onclick="${npc.isDead ? '' : `toggleNpcActions('${npc.id}')`}" style="cursor:${npc.isDead ? 'default' : 'pointer'};">
        <div>
          <div class="rel-name">
            ${npc.name}
            ${npc.isCanon ? '<span class="badge-canon">Канон ⭐</span>' : ''}
            ${npc.isChild ? '<span style="color:#fbbf24; font-size:11px;">(Наследник 👶)</span>' : ''}
            ${npc.isLost ? '<span class="badge-mythic" style="font-size:10px;">Пропал в Катаклизме ⚡</span>' : ''}
            ${npc.isDead ? '<span class="status-dead" style="font-size:11px;">(Покойный ✝)</span>' : ''}
            ${inSquad ? '<span class="badge-rare">В отряде 🛡️</span>' : ''}
          </div>
          <div class="rel-role">${npc.role || npc.race} • Возраст: <b>${npc.age || 20} лет</b> • БМ: <b>${(npc.cp || 500).toLocaleString()}</b></div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:13px; font-weight:700;"><span class="${statusClass}">${npc.status}</span> ${npc.isDead ? '' : `(${npc.relation}%)`}</div>
          ${!npc.isDead ? `<div style="font-size:10px; color:var(--accent);">${isOpened ? '▲ Свернуть' : '▼ Взаимодействовать'}</div>` : ''}
        </div>
      </div>
      ${!npc.isDead ? `
        <div class="bar-bg" onclick="toggleNpcActions('${npc.id}')" style="cursor:pointer;">
          <div class="bar-fill bar-relation" style="width: ${Math.max(0, Math.min(100, npc.relation))}%; background: ${npc.relation < 30 ? 'var(--hp)' : 'var(--green)'};"></div>
        </div>
      ` : ''}

      ${isOpened && !npc.isDead ? `
        <div class="npc-inline-actions">
          ${npc.isLost ? `
            <button class="npc-action-full" style="background:#b45309;" onclick="searchLostFamily('${npc.id}')">🔍 Отправиться на поиски по континентам (⚡ 1 сила)</button>
          ` : `
            <button onclick="actionTalk('${npc.id}')">💬 Побеседовать</button>
            <button onclick="actionGift('${npc.id}')">🎁 Подарок (15🪙)</button>
            <button onclick="actionTavernDrink('${npc.id}')">🍻 Выпить в таверне (12🪙)</button>
            <button onclick="actionSparring('${npc.id}')">⚔️ Спарринг мечей</button>
            <button onclick="actionBorrowGold('${npc.id}')">🪙 Занять монет</button>
            <button class="action-danger" onclick="actionInsult('${npc.id}')">🤬 Оскорбить</button>

            ${!inSquad && player.age >= 10 && !npc.isChild ? `
              <button class="npc-action-full" style="background:#312e81;" onclick="addToSquad('${npc.id}')">🛡️ Пригласить в боевой отряд</button>
            ` : ''}

            ${!npc.isFamily && !npc.isChild && player.age >= 14 && npc.status !== "Пара" && npc.status !== "Супруг/Супруга" ? `
              <button class="action-love npc-action-full" onclick="actionConfess('${npc.id}')">❤️ Признаться в чувствах</button>
            ` : ''}

            ${!npc.isFamily && !npc.isChild && player.age >= 16 && npc.status === "Пара" && !player.spouse ? `
              <button class="action-married npc-action-full" onclick="actionMarry('${npc.id}')">💍 Сделать предложение руки и сердца</button>
            ` : ''}

            ${npc.status === "Супруг/Супруга" && player.age >= 16 ? `
              <button class="action-married npc-action-full" ${player.pregnancy ? 'disabled' : ''} onclick="actionHaveChild('${npc.id}')">
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

function actionTavernDrink(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  if (player.coins < 12) { showActionModal("Нехватка монет", "Нужно 12 монет на эль!", "🪙"); return; }

  player.coins -= 12;
  npc.relation = Math.min(100, npc.relation + 14);
  const msg = `Вы провели вечер в таверне за кружкой доброго эля вместе с <b>${npc.name}</b> (+14% отношений)!`;
  log(msg);
  playSound("coin");
  showActionModal("Вечер в таверне", msg, "🍻");
  updateUI();
  renderRelations();
}

function actionSparring(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;

  player.swordGodExp += 10;
  npc.cp = (npc.cp || 500) + 150;
  const msg = `Вы провели дружеский спарринг на тренировочных мечах с <b>${npc.name}</b> (+10 к Мечу обоим)!`;
  log(msg);
  playSound("sword");
  showActionModal("Спарринг", msg, "⚔️");
  updateUI();
  renderRelations();
}

function actionBorrowGold(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;

  if (npc.relation >= 75) {
    let loan = Math.floor(Math.random() * 40) + 20;
    player.coins += loan;
    npc.relation -= 5;
    const msg = `<b>${npc.name}</b> выручил(а) вас золотом из своих сбережений (+${loan} монет)!`;
    log(msg);
    playSound("coin");
    showActionModal("Займ золота", msg, "🪙");
  } else {
    showActionModal("Отказ", `${npc.name} пока недостаточно доверяет вам для займов (нужно 75%+ отношений).`, "❌");
  }
  updateUI();
  renderRelations();
}

function actionTalk(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  npc.relation = Math.min(100, npc.relation + 8);
  if (npc.relation >= 60 && npc.status === "Знакомый") npc.status = "Друг";
  const msg = `Вы побеседовали с <b>${npc.name}</b> (+8% отношений).`;
  log(msg);
  playSound("click");
  showActionModal("Беседа", msg, "💬");
  updateUI();
  renderRelations();
}

function actionGift(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  if (player.coins < 15) { showActionModal("Нехватка монет", "Нужно 15 монет!", "🪙"); return; }
  player.coins -= 15;
  npc.relation = Math.min(100, npc.relation + 20);
  const msg = `Вы преподнесли ценный подарок для <b>${npc.name}</b> (+20%)!`;
  log(msg);
  playSound("coin");
  showActionModal("Подарок", msg, "🎁");
  updateUI();
  renderRelations();
}

function actionInsult(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  npc.relation = Math.max(0, npc.relation - 30);
  if (npc.relation <= 25) npc.status = "Заклятый враг";
  const msg = `Вы жестоко оскорбили <b>${npc.name}</b>. Отношения испорчены!`;
  log(msg);
  playSound("click");
  showActionModal("Ссора", msg, "🤬");
  updateUI();
  renderRelations();
}

function actionConfess(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  if (npc.relation >= 75) {
    npc.status = "Пара";
    const msg = `💖 <b>${npc.name}</b> ответила взаимностью на ваши чувства!`;
    log(msg);
    playSound("win");
    showActionModal("Признание", msg, "💖");
  } else {
    npc.relation = Math.max(0, npc.relation - 10);
    const msg = `💔 <b>${npc.name}</b>: "Давай пока останемся друзьями..."`;
    log(msg);
    playSound("click");
    showActionModal("Отказ", msg, "💔");
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
    const msg = `💍 Колокола собора звонят! Вы и <b>${npc.name}</b> вступили в законный брак!`;
    log(msg);
    playSound("win");
    showActionModal("Свадьба", msg, "💍");
  } else {
    showActionModal("Свадьба", `${npc.name} считает, что нужно еще лучше укрепить взаимное доверие.`, "💍");
  }
  updateUI();
  renderRelations();
}

function actionHaveChild(npcId) {
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;
  if (player.pregnancy) {
    showActionModal("Беременность", "Беременность уже протекает! Ребенок появится через год.", "👶");
    return;
  }
  player.pregnancy = { partnerName: npc.name };
  const msg = `💖 Чудесная весть! Вы и <b>${npc.name}</b> ждете ребенка! Малыш появится на свет через 1 год.`;
  log(msg);
  playSound("win");
  showActionModal("Пополнение", msg, "👶");
  updateUI();
  renderRelations();
}

function searchLostFamily(npcId) {
  if (player.ap < 1) { showActionModal("Усталость", "Нужно ⚡ 1 сила!", "💤"); return; }
  player.ap -= 1;

  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;

  if (Math.random() < 0.6) {
    npc.isLost = false;
    const msg = `🎉 <b>ПОИСКИ УВЕНЧАЛИСЬ УСПЕХОМ!</b> Вы нашли <b>${npc.name}</b> в одном из лагерей беженцев! Семья воссоединена!`;
    log(msg);
    playSound("win");
    showActionModal("Воссоединение", msg, "🎉");
  } else {
    const msg = `Вы обошли таверны и лагеря, но вестей о <b>${npc.name}</b> пока нет. Продолжайте поиски!`;
    log(msg);
    playSound("click");
    showActionModal("Поиски продолжаются", msg, "🔍");
  }
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
    age: Math.max(16, player.age + Math.floor(Math.random() * 8) - 4),
    socialClass: randClass,
    role: randClass,
    cp: baseCp,
    relation: Math.floor(Math.random() * 25) + 35,
    status: "Знакомый",
    isCanon: false,
    isLost: false,
    isDead: false
  };

  player.relations.push(newNpc);
  const msg = `Вы повстречали: <b>${newNpc.name}</b> (${newNpc.race}, ${newNpc.age} лет, ${newNpc.socialClass}, БМ: ${baseCp.toLocaleString()}).`;
  log(msg);
  playSound("click");
  showActionModal("Новое знакомство", msg, "👥");
  renderRelations();
  updateUI();
}

// ------------------------------------------
// 12. ХОД ВРЕМЕНИ И СТАРЕНИЕ
// ------------------------------------------

function ageUp() {
  player.age++;
  currentWorldYear++;

  player.maxAp = getMaxAP(player.age);
  player.ap = player.maxAp;
  player.mana = player.maxMana;

  // Регенерация здоровья от жилья
  let regen = 5;
  if (player.familySeat) {
    const seatObj = ESTATES.find(e => e.id === player.familySeat);
    if (seatObj) regen = seatObj.hpRegen || 15;
  }
  player.hp = Math.min(player.maxHp, player.hp + regen);

  // Старение и естественная смерть знакомых
  if (player.relations && player.relations.length > 0) {
    player.relations.forEach(npc => {
      if (!npc.isDead) {
        npc.age = (npc.age || 20) + 1;
        // Проверка на старость для людей (>68 лет)
        if (npc.race === "Человек" && npc.age > 68 && Math.random() < 0.12) {
          npc.isDead = true;
          npc.status = "Покойный(ая)";
          log(`🕯️ Ваш знакомый <b>${npc.name}</b> мирно скончался от глубокой старости в возрасте ${npc.age} лет.`);
        }
      }
    });
  }

  generateYearlyGuildQuests();

  // Доход от недвижимости
  if (player.estates && player.estates.length > 0) {
    let passiveIncome = 0;
    player.estates.forEach(estId => {
      let est = ESTATES.find(e => e.id === estId);
      if (est) passiveIncome += est.income;
    });
    player.coins += passiveIncome;
    log(`💰 Доход от имений: <b>+${passiveIncome} монет</b>.`);
  }

  // Жалование со службы
  if (player.currentJob) {
    const jData = getJobDataById(player.currentJob);
    const curRank = jData?.ranks[player.jobRankIndex];
    if (curRank) {
      player.coins += curRank.salary;
      log(`💼 Получено жалование по чину: <b>+${curRank.salary} монет</b>.`);
    }
  }

  // Доход с теневого подполья и риск облавы стражи
  if (player.currentUndergroundJob) {
    const uJob = UNDERGROUND_JOBS[player.currentRegionKey];
    const curURank = uJob?.ranks[player.undergroundRankIndex];
    if (curURank) {
      if (Math.random() < curURank.risk) {
        let fine = Math.min(player.coins, curURank.salary * 2);
        player.coins -= fine;
        player.hp = Math.max(10, player.hp - 25);
        log(`🚨 <b>ОБЛАВА СТРАЖИ!</b> Ваша банда попала в засаду! Вы ранены и выплатили откуп: -${fine} монет!`);
        playSound("death");
      } else {
        player.coins += curURank.salary;
        log(`🗡️ Теневой синдикат выплатил куш: <b>+${curURank.salary} монет</b>.`);
      }
    }
  }

  // Зелья от алхимической оранжереи
  if (player.castleUpgrades && player.castleUpgrades.includes("alchemy_lab")) {
    player.potionsCount = (player.potionsCount || 0) + 2;
    log(`🧪 Фамильная оранжерея произвела +2 целебных зелья.`);
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
      age: 0,
      birthYear: currentWorldYear,
      cp: Math.round(500 * bonusMult),
      role: bonusMult > 1.3 ? "Наследник рода (Вундеркинд ⭐)" : "Наследник рода",
      relation: 100,
      status: "Семья",
      isFamily: true,
      isChild: true,
      isDead: false
    };

    player.children.push(child);
    player.relations.push(child);
    if (!player.appointedHeirId) player.appointedHeirId = child.id;
    log(`🎉 <b>Пополнение в семье!</b> Родился ребенок — <b>${child.name}</b> (${child.gender === 'male' ? 'Сын' : 'Дочь'})!`);
    playSound("win");
    player.pregnancy = null;
  }

  // Катаклизм Маны 417 г.
  if (currentWorldYear === CALAMITY_YEAR && !player.calamityTriggered) {
    const calamityStory = STORY_ACTIVITIES.find(s => s.id === "story_10_calamity");
    if (calamityStory) {
      performStoryActivity("story_10_calamity");
      return;
    }
  }

  // Старение
  if (player.age > (player.maxAge - 15) && player.trait?.id !== "god_mode") {
    let decay = Math.floor(Math.random() * 10) + 5;
    player.hp -= decay;
    log(`Старость берет свое: ломота в суставах (-${decay} HP).`);
  }

  if (player.hp <= 0 || player.age >= player.maxAge) {
    handleDeath(player.hp <= 0 ? "Смерть от ран и истощения сил" : "Мирная кончина от глубокой старости");
    return;
  }

  // ГАРАНТИРОВАННОЕ ВЫПАДЕНИЕ СОБЫТИЯ КАЖДЫЙ ГОД
  const eligibleEvents = RANDOM_EVENTS.filter(e => player.age >= e.minAge);
  if (eligibleEvents.length > 0) {
    const ev = eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
    triggerRandomEvent(ev);
    return;
  }

  log("Год прошел в размеренных трудах и тренировках.");
  playSound("click");
  updateUI();
}

function triggerRandomEvent(eventObj) {
  const iconEl = document.getElementById("event-icon");
  const titleEl = document.getElementById("event-title");
  const descEl = document.getElementById("event-desc");
  const cBox = document.getElementById("event-choices");

  if (iconEl) iconEl.innerText = eventObj.icon || "⚡";
  if (titleEl) titleEl.innerText = eventObj.title;
  if (descEl) descEl.innerText = eventObj.desc;
  if (!cBox) return;

  cBox.innerHTML = "";

  eventObj.choices.forEach(ch => {
    const btn = document.createElement("button");
    btn.className = "event-choice-btn";
    btn.innerText = ch.text;
    btn.onclick = () => {
      const outcome = ch.action(player);
      const modal = document.getElementById("event-modal");
      if (modal) modal.style.display = "none";
      log(`<b>[Выбор]</b> ${outcome}`);
      playSound("click");
      showActionModal("Итог события", outcome, eventObj.icon || "⚡");
      updateUI();
      if (player.hp <= 0) handleDeath("Пал жертвой роковых обстоятельств года.");
    };
    cBox.appendChild(btn);
  });

  const modal = document.getElementById("event-modal");
  if (modal) modal.style.display = "flex";
}

// ------------------------------------------
// 13. СМЕРТЬ, ЗАВЕЩАНИЕ И ЗАЛ СЛАВЫ
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

function handleDeath(reason) {
  playSound("death");
  recordAncestorToHistory(player, reason);

  const reasonEl = document.getElementById("death-reason");
  if (reasonEl) reasonEl.innerText = `${reason} в возрасте ${player.age} лет.`;

  const summaryBox = document.getElementById("death-summary");
  if (summaryBox) {
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
  }

  const heirsBlock = document.getElementById("heirs-list");
  if (heirsBlock) {
    heirsBlock.innerHTML = "";
    const children = (player.children || []).filter(c => !c.isDead);

    if (children.length > 0) {
      const heirSelectionBlock = document.getElementById("heir-selection-block");
      if (heirSelectionBlock) heirSelectionBlock.style.display = "block";

      children.forEach(child => {
        const childRealAge = Math.max(1, currentWorldYear - (child.birthYear || (currentWorldYear - 20)));
        const isAppointed = (player.appointedHeirId === child.id);

        const hCard = document.createElement("div");
        hCard.className = "shop-item";
        hCard.innerHTML = `
          <div>
            <b style="color:#fff;">${child.name}</b> ${isAppointed ? '<span class="badge-legendary">Наследник по завещанию (100% золота) 👑</span>' : ''}
            <div style="font-size:11px; color:var(--muted);">${child.gender === 'male' ? 'Сын' : 'Дочь'} • Возраст: <b>${childRealAge} лет</b> • ${child.role}</div>
          </div>
          <button style="background:#10b981;" onclick="continueAsHeir('${child.id}', ${childRealAge})">Играть 👑</button>
        `;
        heirsBlock.appendChild(hCard);
      });
    } else {
      const heirSelectionBlock = document.getElementById("heir-selection-block");
      if (heirSelectionBlock) heirSelectionBlock.style.display = "none";
    }
  }

  const deathOverlay = document.getElementById("death-overlay");
  if (deathOverlay) deathOverlay.style.display = "flex";
}

function continueAsHeir(childId, realAge) {
  const child = player.children.find(c => c.id === childId);
  dynastyGeneration++;

  // Если наследник был назначен в завещании — передается 100% золота, иначе 70%
  const isAppointed = (player.appointedHeirId === childId);
  const inheritedCoins = isAppointed ? player.coins : Math.floor(player.coins * 0.7);

  const raceObj = Object.values(RACES).find(r => r.name === player.race) || RACES.human;

  const originMock = {
    name: `Династия ${player.surname}`,
    manaBonus: Math.floor(player.maxMana * 0.20),
    swordGod: Math.floor(player.swordGodExp * 0.25),
    coins: inheritedCoins,
    int: 12,
    log: `Вы продолжили славный род ${player.surname}. ${isAppointed ? 'По завещанию вам отошло 100% семейной казны!' : 'Семейное золото перешло к вам.'}`
  };

  const oldEstates = player.estates || [];
  const oldSeat = player.familySeat;
  const oldUpgrades = player.castleUpgrades || [];
  const oldNobility = player.nobilityTitle;
  const oldAsuraFaction = player.asuraFaction;
  const oldLangs = player.languages || ["human"];

  const deathOverlay = document.getElementById("death-overlay");
  if (deathOverlay) deathOverlay.style.display = "none";
  
  initCharacter(child.name.split(" ")[0], player.surname, child.gender, raceObj, player.currentRegionKey, originMock, player.trait, player.familyStatus, realAge);
  
  player.estates = oldEstates;
  player.familySeat = oldSeat;
  player.castleUpgrades = oldUpgrades;
  player.nobilityTitle = oldNobility;
  player.asuraFaction = oldAsuraFaction;
  player.languages = oldLangs;
}

function startNewDynasty() {
  const newKarma = addReincarnationKarma();
  const deathOverlay = document.getElementById("death-overlay");
  if (deathOverlay) deathOverlay.style.display = "none";
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
// 14. СЕМЬ ВЕЛИКИХ СИЛ И БИТВЫ
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

  if (!confirm(`Вы уверены, что готовы бросить вызов #${pow.rank} ${pow.title} — ${pow.name}?`)) return;

  currentBattle = {
    quest: { enemy: `${pow.title} ${pow.name}`, rank: "Семь Сил", reward: 20000, gp: 500 },
    enemyHp: pow.hp,
    enemyMaxHp: pow.maxHp,
    enemyCp: pow.cp,
    isSevenPower: true,
    powerObj: pow
  };

  const nameEl = document.getElementById("battle-enemy-name");
  const cpEl = document.getElementById("battle-enemy-cp");
  const hpText = document.getElementById("battle-enemy-hp-text");
  const hpBar = document.getElementById("battle-enemy-hp-bar");
  const logBox = document.getElementById("battle-log");

  if (nameEl) nameEl.innerText = `${pow.title} ${pow.name}`;
  if (cpEl) cpEl.innerText = `БМ: ${pow.cp.toLocaleString()}`;
  if (hpText) hpText.innerText = `${pow.hp}/${pow.maxHp}`;
  if (hpBar) hpBar.style.width = "100%";
  if (logBox) logBox.innerHTML = `⚡ Схватка за место на Монументе Семи Сил против <b>${pow.name}</b> началась!`;

  const modal = document.getElementById("battle-modal");
  if (modal) modal.style.display = "flex";
  playSound("calamity");
}

function combatAction(actionType) {
  if (!currentBattle) return;

  const logBox = document.getElementById("battle-log");
  const squadCp = currentBattle.isDuel ? calcCombatPower(player) : calcSquadCombatPower(player);
  const enemyCp = currentBattle.enemyCp;

  let hasForesight = (player.demonEyes?.left?.id === "foresight" || player.demonEyes?.right?.id === "foresight");
  let hasAppraisal = (player.demonEyes?.left?.id === "appraisal" || player.demonEyes?.right?.id === "appraisal");

  if (actionType === "flee") {
    if (currentBattle.isSevenPower) {
      if (logBox) logBox.innerHTML += `<div style="color:var(--hp)">Из битвы с Семью Силами отступить невозможно!</div>`;
      return;
    }
    if (logBox) logBox.innerHTML += `<div>🏃 Вы разорвали дистанцию и отступили!</div>`;
    setTimeout(() => {
      const modal = document.getElementById("battle-modal");
      if (modal) modal.style.display = "none";
      currentBattle = null;
    }, 600);
    return;
  }

  if (actionType === "potion") {
    if (player.potionsCount > 0) {
      player.potionsCount--;
      player.hp = Math.min(player.maxHp, player.hp + 60);
      if (logBox) logBox.innerHTML += `<div style="color:var(--green)">🧪 Вы выпили целебное зелье (+60 HP)!</div>`;
      playSound("coin");
      updateUI();
    } else {
      if (logBox) logBox.innerHTML += `<div style="color:var(--hp)">Зелья закончились!</div>`;
      return;
    }
  }

  let myDamage = 0;
  if (actionType === "sword") {
    let power = Math.max(12, player.swordGodExp + player.waterGodExp + player.northGodExp);
    myDamage = Math.floor(power * (squadCp / (enemyCp + 100)) * 2.2) + Math.floor(Math.random() * 25) + 15;
    if (hasAppraisal) myDamage = Math.floor(myDamage * 1.3);
    if (logBox) logBox.innerHTML += `<div>⚔️ Выпад клинком: <b>-${myDamage} HP</b>!</div>`;
    playSound("sword");
  } else if (actionType === "magic") {
    if (player.mana < 10) {
      if (logBox) logBox.innerHTML += `<div style="color:var(--muted)">Мана иссякла!</div>`;
      myDamage = 6;
    } else {
      player.mana -= 10;
      myDamage = Math.floor(player.magicExp * (squadCp / (enemyCp + 100)) * 2.8) + Math.floor(Math.random() * 35) + 25;
      if (hasAppraisal) myDamage = Math.floor(myDamage * 1.3);
      if (logBox) logBox.innerHTML += `<div style="color:var(--mana)">🔮 Удар стихией: <b>-${myDamage} HP</b>!</div>`;
      playSound("magic");
    }
  }

  currentBattle.enemyHp -= myDamage;

  if (currentBattle.enemyHp <= 0) {
    if (logBox) logBox.innerHTML += `<div style="color:var(--gold); font-weight:700;">🏆 ПОБЕДА! Враг повержен!</div>`;
    playSound("win");

    if (currentBattle.isSevenPower) {
      currentBattle.powerObj.isDead = true;
      currentBattle.powerObj.killerDynasty = player.surname;
      const msg = `👑💥 <b>ИСТОРИЧЕСКИЙ ТРИУМФ!</b> Вы сокрушили #${currentBattle.powerObj.rank} ${currentBattle.powerObj.title} — ${currentBattle.powerObj.name}! Ваше имя навсегда высечено на Монументе Семи Сил!`;
      log(msg);
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
      const modal = document.getElementById("battle-modal");
      if (modal) modal.style.display = "none";
      currentBattle = null;
      updateUI();
      renderGuildTab();
    }, 1200);
    return;
  }

  if (hasForesight && Math.random() < 0.35) {
    if (logBox) logBox.innerHTML += `<div style="color:var(--accent-light)">👁️ <b>Глаз Предвидения!</b> Вы уклонились от встречного удара!</div>`;
  } else {
    let enemyDamage = Math.floor(enemyCp / (squadCp + 60) * 18) + Math.floor(Math.random() * 14) + 8;
    player.hp -= enemyDamage;
    if (logBox) logBox.innerHTML += `<div style="color:var(--hp)">Враг ответил ударом: <b>-${enemyDamage} HP</b>!</div>`;
    playSound("sword");
  }

  if (logBox) logBox.scrollTop = logBox.scrollHeight;
  const hpText = document.getElementById("battle-enemy-hp-text");
  const hpBar = document.getElementById("battle-enemy-hp-bar");
  if (hpText) hpText.innerText = `${Math.max(0, currentBattle.enemyHp)}/${currentBattle.enemyMaxHp}`;
  if (hpBar) hpBar.style.width = Math.max(0, (currentBattle.enemyHp / currentBattle.enemyMaxHp) * 100) + "%";
  updateUI();

  if (player.hp <= 0) {
    const modal = document.getElementById("battle-modal");
    if (modal) modal.style.display = "none";
    currentBattle = null;
    handleDeath(currentBattle?.isSevenPower ? `Пал в битве за место в Семи Силах` : `Погиб в схватке`);
  }
}

function startGuildBattle(questId) {
  if (player.ap < 2) { showActionModal("Усталость", "Нужно ⚡ 2 силы!", "💤"); return; }
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

  const nameEl = document.getElementById("battle-enemy-name");
  const cpEl = document.getElementById("battle-enemy-cp");
  const hpText = document.getElementById("battle-enemy-hp-text");
  const hpBar = document.getElementById("battle-enemy-hp-bar");
  const logBox = document.getElementById("battle-log");

  if (nameEl) nameEl.innerText = `${quest.enemy} (Ранг ${quest.rank})`;
  if (cpEl) cpEl.innerText = `БМ: ${quest.cp.toLocaleString()}`;
  if (hpText) hpText.innerText = `${quest.hp}/${quest.hp}`;
  if (hpBar) hpBar.style.width = "100%";
  if (logBox) logBox.innerHTML = `Схватка против <b>${quest.enemy}</b> началась!`;

  const modal = document.getElementById("battle-modal");
  if (modal) modal.style.display = "flex";
  playSound("sword");
}

function checkGuildRankUp() {
  const currentIdx = ADVENTURER_RANKS.indexOf(player.guildRank);
  if (currentIdx < ADVENTURER_RANKS.length - 1) {
    const nextRank = ADVENTURER_RANKS[currentIdx + 1];
    const req = ADVENTURER_REQ[nextRank];
    if (player.guildExp >= req) {
      player.guildRank = nextRank;
      const msg = `🌟 <b>ПОВЫШЕНИЕ В ГИЛЬДИИ!</b> Ваш ранг авантюриста вырос до <b>${nextRank}</b>!`;
      log(msg);
      playSound("win");
      showActionModal("Ранг Гильдии", msg, "🌟");
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
  if (cpEl) cpEl.innerText = calcSquadCombatPower(player).toLocaleString();
  if (fameEl) fameEl.innerText = player.squadFame || 0;
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
    showActionModal("Отряд полон", "Максимум 6 бойцов в отряде!", "🛡️");
    return;
  }
  const npc = player.relations.find(r => r.id === npcId);
  if (!npc) return;

  if (npc.relation < 60) {
    showActionModal("Недоверие", `${npc.name} недостаточно доверяет вам (нужно 60%+ отношений)!`, "❌");
    return;
  }

  player.squad = player.squad || [];
  player.squad.push(npc);
  const msg = `🛡️ <b>${npc.name}</b> вступил(а) в ваш боевой отряд!`;
  log(msg);
  playSound("win");
  showActionModal("Боевой Отряд", msg, "🛡️");
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

    if (m.relation < 45 || Math.random() < 0.04) {
      log(`🗡️💥 <b>ПРЕДАТЕЛЬСТВО!</b> Напарник <b>${m.name}</b> ударил в спину и сбежал с частью золота!`);
      player.hp = Math.max(10, player.hp - 35);
      player.coins = Math.max(0, player.coins - 50);
      player.squad.splice(i, 1);
      m.relation = 0;
      m.status = "Заклятый враг";
      playSound("death");
      showActionModal("Предательство в отряде!", `Напарник <b>${m.name}</b> подло ударил в спину и украл золото!`, "🗡️");
      updateUI();
      renderSquad();
      return true;
    }
  }
  return false;
}

// ------------------------------------------
// 15. ПУТЕШЕСТВИЯ, ШКОЛЫ И ПОЛИТИКА
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
    showActionModal("Ограничение", "Вы слишком малы для странствий без родителей!", "👶");
    return;
  }
  const dest = REGIONS[destKey];
  if (player.coins < dest.travelCost) {
    showActionModal("Нехватка золота", `Нужно ${dest.travelCost} монет на караван/корабль!`, "🪙");
    return;
  }

  if (!confirm(`Отправиться в ${dest.name}? Дорога займет ровно 1 год вашей жизни!`)) return;

  player.coins -= dest.travelCost;
  player.currentRegionKey = destKey;

  log(`🚢 Вы прибыли в <b>${dest.name}</b>. Дорога заняла ровно один год!`);
  playSound("calamity");
  showActionModal("Дальнее путешествие", `Караван доставил вас в <b>${dest.name}</b>. Минул ровно 1 год пути.`, "🚢");
  ageUp();
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
  if (player.coins < sch.cost) { showActionModal("Нехватка монет", "Недостаточно монет для оплаты обучения!", "🪙"); return; }

  player.coins -= sch.cost;
  player.enrolledSchool = sch.id;
  player.schoolProgress = 1;
  const msg = `Вы торжественно зачислены в <b>${sch.name}</b>!`;
  log(msg);
  playSound("win");
  showActionModal("Зачисление", msg, "🎓");
  updateUI();
  renderSchools();
}

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
  const msg = `Вы официально объявили о поддержке: <b>${f.name}</b> в борьбе за трон Асуры!`;
  log(msg);
  playSound("win");
  showActionModal("Присяга", msg, "👑");
  updateUI();
  renderPolitics();
}

function supportFaction(fId, cost) {
  if (player.coins < cost) { showActionModal("Нехватка монет", "Недостаточно золота для пожертвования!", "🪙"); return; }
  player.coins -= cost;
  player.asuraInfluence += 15;
  const msg = `Вы профинансировали кампанию на +${cost} монет (+15 влияния)!`;
  log(msg);
  playSound("coin");
  showActionModal("Финансирование", msg, "💰");
  updateUI();
  renderPolitics();
}

function buyNobilityTitle(titleId, cost, reqInfluence) {
  if (player.coins < cost) { showActionModal("Нехватка золота", `Нужно ${cost} монет!`, "🪙"); return; }
  if (player.asuraInfluence < reqInfluence) { showActionModal("Недостаточно влияния", `Нужно ${reqInfluence} очков политического влияния!`, "👑"); return; }

  player.coins -= cost;
  player.nobilityTitle = titleId;
  const tObj = ASURA_POLITICS.nobilityTitles.find(t => t.id === titleId);
  const msg = `Вам официально дарован благородный дворянский патент: <b>${tObj.name}</b>!`;
  log(msg);
  playSound("win");
  showActionModal("Королевский Патент", msg, "👑");
  updateUI();
  renderPolitics();
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
    container.innerHTML += `<div style="color:var(--muted); font-size:11px; text-align:center; padding:15px;">Вы — основатель династии. Зал славы предков откроется после первой смены поколений.</div>`;
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

// ------------------------------------------
// 16. СОХРАНЕНИЕ И ЗАГРУЗКА
// ------------------------------------------

function saveGame() {
  if (!player) return;
  const saveData = {
    player: player,
    dynastyGeneration: dynastyGeneration,
    currentWorldYear: currentWorldYear,
    sevenPowers: SEVEN_GREAT_POWERS,
    logsHtml: document.getElementById("logs")?.innerHTML || ""
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

      const overlay = document.getElementById("creation-overlay");
      if (overlay) overlay.style.display = "none";

      const logsEl = document.getElementById("logs");
      if (logsEl && data.logsHtml) logsEl.innerHTML = data.logsHtml;

      renderUI();
      return true;
    }
  } catch (e) {
    console.error(e);
  }
  return false;
}

// Инициализация при старте
if (!loadGame()) {
  showCreation();
}
