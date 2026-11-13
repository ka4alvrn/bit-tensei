const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

let worldState = {
  currentWorldYear: START_YEAR,
  calamityOccurred: false,
  sevenPowers: cloneDefaultPowers(),
  chronicles: [],
  dynastyHistory: []
};

let player = null;
let dynastyGeneration = 1;
let currentOpenedNpcId = null;
let currentBattle = null;
let currentActivityCategory = "all";
let currentShopCategory = "all";
let creationGender = "male";
let activeDungeon = null;
let confirmCallback = null;

function cloneDefaultPowers() {
  return SEVEN_GREAT_POWERS.map(p => ({ ...p, holderType: "npc" }));
}

const $ = (id) => document.getElementById(id);
const setText = (id, txt) => { const el = $(id); if (el) el.innerText = txt; };

function getWorldEra(year) {
  return WORLD_ERAS.find(e => year <= e.maxYear) || WORLD_ERAS[WORLD_ERAS.length - 1];
}

// =========================================================================
// ЗВУК (ИНТЕГРАЦИЯ С music.js) И TELEGRAM UX
// =========================================================================
function playSound(type) {
  if (typeof audioEngine === "undefined") return;
  const map = { sword: "hit", death: "hit", calamity: "hit", win: "levelup" };
  audioEngine.playSFX(map[type] || type);
}

function toggleSound() {
  if (typeof audioEngine === "undefined") return;
  const muted = audioEngine.toggleMute();
  setText("btn-sound-toggle", muted ? "🔇 Звук: ВЫКЛ" : "🔊 Звук: ВКЛ");
  if (!muted) playSound("click");
}

document.addEventListener("visibilitychange", () => {
  if (typeof audioEngine === "undefined") return;
  if (document.hidden) audioEngine.stopMusic();
  else if (!audioEngine.isMuted) audioEngine.startMusic();
});

// =========================================================================
// УНИВЕРСАЛЬНЫЕ МОДАЛКИ И ЛОГИ
// =========================================================================
function showActionModal(title, text, icon = "⚡") {
  setText("action-modal-icon", icon);
  setText("action-modal-title", title);
  const body = $("action-modal-body");
  if (body) body.innerHTML = text;
  if ($("action-modal")) $("action-modal").style.display = "flex";
}
function closeActionModal() { if ($("action-modal")) $("action-modal").style.display = "none"; playSound("click"); }

function askConfirm(title, text, onYes) {
  setText("confirm-modal-title", title);
  const body = $("confirm-modal-body");
  if (body) body.innerHTML = text;
  confirmCallback = onYes;
  const yesBtn = $("confirm-modal-yes");
  if (yesBtn) yesBtn.onclick = () => { closeConfirmModal(); if (confirmCallback) confirmCallback(); };
  if ($("confirm-modal")) $("confirm-modal").style.display = "flex";
}
function closeConfirmModal() { if ($("confirm-modal")) $("confirm-modal").style.display = "none"; }

function showBirthModal() {
  if (!player) return;
  const era = getWorldEra(worldState.currentWorldYear);
  const box = $("birth-card-content");
  if (box) {
    box.innerHTML = `
      <div><b>Имя:</b> ${player.name} (${player.gender === "male" ? "♂️" : "♀️"})</div>
      <div><b>Год и Эпоха:</b> ${worldState.currentWorldYear} г. К.Д. (${era.name})</div>
      <div><b>Раса:</b> ${player.race} (предел жизни ~${player.maxAge} лет)</div>
      <div><b>Регион:</b> ${REGIONS[player.currentRegionKey]?.name}</div>
      <div><b>Сословие и род:</b> ${player.familyStatus.name} • ${player.origin}</div>
      <div><b>Благословение:</b> ${player.trait.name}</div>
      <div><b>Стартовый сосуд маны:</b> ${player.maxMana} • <b>Золото:</b> ${player.coins}🪙</div>
    `;
  }
  if ($("birth-modal")) $("birth-modal").style.display = "flex";
}
function closeBirthModal() { if ($("birth-modal")) $("birth-modal").style.display = "none"; playSound("click"); }

function log(msg) {
  const box = $("logs");
  if (!box) return;
  const el = document.createElement("div");
  el.className = "log-entry";
  el.innerHTML = `<span class="log-year">[${player ? player.age : 0} л. | ${worldState.currentWorldYear} г.]</span> ${msg}`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  try { tg?.HapticFeedback?.impactOccurred("light"); } catch (e) {}
}

// =========================================================================
// КАРМА, СТАТЫ И БМ
// =========================================================================
function getReincarnationKarma() {
  try { return parseInt(localStorage.getItem("bit_tensei_karma") || "0", 10); } catch { return 0; }
}
function addReincarnationKarma() {
  const k = getReincarnationKarma() + 1;
  try { localStorage.setItem("bit_tensei_karma", String(k)); } catch {}
  return k;
}

function getMaxAP(age) { return age <= 3 ? 5 : age <= 9 ? 8 : age <= 15 ? 10 : 12; }

function calcCombatPower(p) {
  if (!p) return 0;
  let cp = (p.hp || 0) * 2 + (p.maxMana || 0) * 3 + (p.magicExp + p.swordGodExp + p.waterGodExp + p.northGodExp) * 4 + (p.intellect || 0) * 5;
  ["weapon", "armor", "accessory"].forEach(s => { if (p.equipment?.[s]) cp += p.equipment[s].cp || 0; });
  if (p.demonEyes?.left) cp += p.demonEyes.left.cp || 0;
  if (p.demonEyes?.right) cp += p.demonEyes.right.cp || 0;
  if (p.castleUpgrades?.includes("trophy_hall")) cp += 3000;
  if (p.injuries?.some(i => i.id === "lost_arm") && p.equipment?.accessory?.id !== "prosthetic_arm") cp = Math.floor(cp * 0.7);
  const karma = getReincarnationKarma();
  if (karma > 0) cp = Math.floor(cp * (1 + karma * 0.05));
  const cap = p.trait?.id === "god_mode" ? 999999999 : (GENERATION_CP_CAPS[p.generation] || 9999999);
  return Math.min(cap, Math.floor(cp));
}

function calcSquadCombatPower(p) {
  return !p ? 0 : calcCombatPower(p) + (p.squad || []).reduce((s, m) => s + (m.cp || 500), 0);
}

function calculateRank(exp, list) {
  if (exp >= 1200) return list[6] || list[list.length - 1];
  if (exp >= 600) return list[5] || list[list.length - 1];
  if (exp >= 300) return list[4] || list[list.length - 1];
  if (exp >= 120) return list[3] || list[list.length - 1];
  if (exp >= 40) return list[2] || list[list.length - 1];
  if (exp >= 10) return list[1] || list[0];
  return list[0];
}

function getBardNickname(p, cp) {
  if (p.age <= 3) return cp >= 2000 ? "Дитя с аурой легенды" : "Младенец в колыбели";
  if (p.currentPowersSeat) return `Владыка #${p.currentPowersSeat} Семи Сил`;
  if (p.currentUndergroundJob && p.undergroundRankIndex >= 2) return "Призрак Подполья";
  if (p.trait?.id === "silent_cast" && p.magicExp >= 120) return "Беззвучный Архимаг";
  if (p.swordGodExp >= p.magicExp && p.swordGodExp >= 300) return "Алый Клинок";
  if (p.magicExp >= 300) return "Повелитель Стихий";
  if (cp >= 180000) return "Живая Легенда Эпохи";
  if (cp >= 1500) return "Восходящий Мастер";
  return "Юный Путник";
}

// =========================================================================
// СОЗДАНИЕ ПЕРСОНАЖА
// =========================================================================
function setCreationGender(g) {
  creationGender = g;
  $("btn-gender-male")?.classList.toggle("active", g === "male");
  $("btn-gender-female")?.classList.toggle("active", g === "female");
  randomizeNameInputs();
  playSound("click");
}

function randomizeNameInputs() {
  const list = SYLLABLES[creationGender];
  const n = list[Math.floor(Math.random() * list.length)] + (Math.random() > 0.45 ? SYLLABLES.suffix[Math.floor(Math.random() * SYLLABLES.suffix.length)] : "");
  const s = SYLLABLES.surnames[Math.floor(Math.random() * SYLLABLES.surnames.length)];
  if ($("input-name")) $("input-name").value = n;
  if ($("input-surname")) $("input-surname").value = s;
}

function updateRaceInfo() {
  const r = RACES[$("select-race")?.value] || RACES.human;
  setText("race-desc", `${r.desc} (Мана: ${r.bonus.baseMana}, Жизнь: ~${r.maxAge} лет)`);
}

function onRegionChange() {
  const key = $("select-region")?.value || "asura";
  const reg = REGIONS[key] || REGIONS.asura;
  const origSel = $("select-origin");
  if (origSel) origSel.innerHTML = reg.origins.map(o => `<option value="${o.id}">${o.name}</option>`).join("");
  const famSel = $("select-family-status");
  const statuses = REGION_FAMILY_STATUSES[key] || FAMILY_STATUSES;
  if (famSel) famSel.innerHTML = statuses.map(f => `<option value="${f.id}">${f.name} — ${f.desc}</option>`).join("");
}

function showCreation() {
  if ($("select-race")) $("select-race").innerHTML = Object.entries(RACES).map(([k, r]) => `<option value="${k}">${r.name}</option>`).join("");
  if ($("select-region")) $("select-region").innerHTML = Object.entries(REGIONS).map(([k, r]) => `<option value="${k}">${r.name}</option>`).join("");
  if ($("select-trait")) $("select-trait").innerHTML = TRAITS.map(t => `<option value="${t.id}">${t.name} (${t.desc})</option>`).join("");

  const era = getWorldEra(worldState.currentWorldYear);
  setText("creation-world-era-hint", `📅 Текущий год мира: ${worldState.currentWorldYear} г. К.Д. • ${era.name}`);
  const resetBtn = $("btn-creation-reset-world");
  if (resetBtn) resetBtn.style.display = (worldState.currentWorldYear > START_YEAR || worldState.chronicles.length > 0) ? "block" : "none";

  updateRaceInfo();
  onRegionChange();
  randomizeNameInputs();
  if ($("creation-overlay")) $("creation-overlay").style.display = "flex";
}

function confirmCreation() {
  const fName = $("input-name")?.value.trim() || (creationGender === "male" ? "Рудеус" : "Эрис");
  const sName = $("input-surname")?.value.trim() || "Грейрат";
  const race = RACES[$("select-race")?.value] || RACES.human;
  const regKey = $("select-region")?.value || "asura";
  const reg = REGIONS[regKey] || REGIONS.asura;
  const origin = reg.origins.find(o => o.id === $("select-origin")?.value) || reg.origins[0];
  const trait = TRAITS.find(t => t.id === $("select-trait")?.value) || TRAITS[0];
  const famList = REGION_FAMILY_STATUSES[regKey] || FAMILY_STATUSES;
  const famStatus = famList.find(f => f.id === $("select-family-status")?.value) || famList[0];

  initCharacter(fName, sName, creationGender, race, regKey, origin, trait, famStatus, 0);
  if ($("creation-overlay")) $("creation-overlay").style.display = "none";
  playSound("win");
  showBirthModal();
}

function randomCreation() {
  creationGender = Math.random() > 0.5 ? "male" : "female";
  $("btn-gender-male")?.classList.toggle("active", creationGender === "male");
  $("btn-gender-female")?.classList.toggle("active", creationGender === "female");
  randomizeNameInputs();
  const rKeys = Object.keys(RACES), regKeys = Object.keys(REGIONS);
  const race = RACES[rKeys[Math.floor(Math.random() * rKeys.length)]];
  const regKey = regKeys[Math.floor(Math.random() * regKeys.length)];
  const origin = REGIONS[regKey].origins[Math.floor(Math.random() * REGIONS[regKey].origins.length)];
  const poolTraits = TRAITS.filter(t => t.id !== "god_mode");
  const trait = poolTraits[Math.floor(Math.random() * poolTraits.length)];
  const famList = REGION_FAMILY_STATUSES[regKey] || FAMILY_STATUSES;
  const fam = famList[Math.floor(Math.random() * famList.length)];
  initCharacter($("input-name")?.value || "Рудеус", $("input-surname")?.value || "Грейрат", creationGender, race, regKey, origin, trait, fam, 0);
  if ($("creation-overlay")) $("creation-overlay").style.display = "none";
  playSound("win");
  showBirthModal();
}

function initCharacter(fName, sName, gender, race, regionKey, origin, trait, familyStatus, startAge = 0, customRelations = null) {
  const karma = getReincarnationKarma();
  const isGod = trait?.id === "god_mode";
  const baseMana = isGod ? 99999 : Math.round(((race.bonus.baseMana || 25) + (origin.manaBonus || 0) + (trait.manaBonus || 0) + (familyStatus.manaBonus || 0) + karma * 15) * (race.bonus.manaMod || 1)) + (startAge > 5 ? Math.min(250, startAge * 8) : 0);
  const baseHp = isGod ? 99999 : 100 + (trait.hp || 0) + (race.bonus.hp || 0) + (familyStatus.hp || 0) + karma * 10;

  const fatherName = SYLLABLES.male[Math.floor(Math.random() * SYLLABLES.male.length)] + " " + sName;
  const motherName = SYLLABLES.female[Math.floor(Math.random() * SYLLABLES.female.length)] + " " + sName;

  player = {
    name: `${fName} ${sName}`, firstName: fName, surname: sName, gender,
    generation: dynastyGeneration,
    birthYear: worldState.currentWorldYear - startAge,
    isFirstEraLife: !worldState.calamityOccurred && dynastyGeneration === 1 && worldState.currentWorldYear <= 425,
    race: race.name, raceObj: race, maxAge: isGod ? 999 : race.maxAge,
    regionKey, currentRegionKey: regionKey, origin: origin.name, trait, familyStatus,
    age: startAge, ap: getMaxAP(startAge), maxAp: getMaxAP(startAge),
    hp: baseHp, maxHp: baseHp, mana: baseMana, maxMana: baseMana,
    magicExp: isGod ? 2000 : (startAge > 5 ? startAge * 5 : 0),
    swordGodExp: isGod ? 2000 : (origin.swordGod || 0) + (trait.swordGod || 0) + (race.bonus.swordGod || 0) + (familyStatus.swordGod || 0) + (startAge > 5 ? startAge * 3 : 0),
    waterGodExp: isGod ? 2000 : (origin.waterGod || 0) + (trait.waterGod || 0) + (startAge > 5 ? startAge * 3 : 0),
    northGodExp: isGod ? 2000 : (origin.northGod || 0) + (trait.northGod || 0) + (race.bonus.northGod || 0) + (familyStatus.northGod || 0) + (startAge > 5 ? startAge * 3 : 0),
    intellect: isGod ? 999 : 10 + (origin.int || 0) + (trait.int || 0) + (race.bonus.int || 0) + (familyStatus.int || 0) + startAge * 2,
    coins: isGod ? 9999999 : (origin.coins || 0) + (race.bonus.coins || 0) + (familyStatus.coins || 0),
    guildRank: isGod ? "S" : "F", guildExp: 0, guildQuestsThisYear: [], dungeonProgress: {},
    enrolledSchool: null, schoolProgress: 0, graduatedSchools: [],
    squad: [], squadFame: isGod ? 5000 : 0,
    estates: [], familySeat: null, castleUpgrades: [], lastCryptMeditationAge: -10,
    appointedHeirId: null, heirloomSlot: null,
    discoveredSevenPowers: [], currentPowersSeat: null,
    injuries: [], demonEyes: { left: null, right: null },
    languages: ["human"], tabletsDeciphered: [], perugiusTrials: [], greyratAllies: [],
    currentJob: null, jobRankIndex: 0, currentUndergroundJob: null, undergroundRankIndex: 0,
    nobilityTitle: "citizen", asuraFaction: null, asuraInfluence: familyStatus.influence || 0,
    calamityTriggered: false, storyCompleted: [],
    dynastyFaction: "neutral", factionProgress: 0, hitogamiTrust: 0,
    pregnancy: null, equipment: { weapon: null, armor: null, accessory: null },
    inventory: [], potionsCount: 2,
    relations: customRelations || [
      { id: "father", name: fatherName, gender: "male", age: startAge + 24, role: "Отец • Глава дома", cp: 1200, relation: 85, status: "Семья", isFamily: true, isDead: false },
      { id: "mother", name: motherName, gender: "female", age: startAge + 22, role: "Мать • Хранительница", cp: 800, relation: 95, status: "Семья", isFamily: true, isDead: false }
    ],
    spouse: null, children: []
  };

  generateYearlyGuildQuests();
  if ($("logs")) $("logs").innerHTML = "";
  log(`🌍 Воплощение: <b>${player.race}</b> (${gender === "male" ? "♂️" : "♀️"}) в <b>${REGIONS[regionKey].name}</b> (${worldState.currentWorldYear} г. К.Д.).`);
  log(`🏛️ Семья: <b>${familyStatus.name}</b> • ${origin.log}`);
  if (karma > 0) log(`✨ Карма Сансары ур. ${karma} (+${karma * 15} маны, +${karma * 10} HP).`);
  updateUI();
}

// =========================================================================
// ОТРИСОВКА ИНТЕРФЕЙСА
// =========================================================================
function renderUI() {
  if (!player) return;
  const era = getWorldEra(worldState.currentWorldYear);
  setText("char-gender-icon", player.gender === "male" ? "♂️" : "♀️");
  setText("char-name", player.name);
  setText("char-region", `${player.race} • ${REGIONS[player.currentRegionKey]?.name}`);
  setText("char-family-status-badge", player.familyStatus.name);
  setText("world-year", `${worldState.currentWorldYear} г. К.Д.`);
  setText("world-era-badge", era.name);
  setText("age", `${player.age} лет`);

  const apBadge = $("char-ap");
  if (apBadge) {
    apBadge.innerText = `⚡ ${player.ap}/${player.maxAp} сил`;
    apBadge.style.background = player.ap === 0 ? "rgba(239,68,68,0.2)" : "#312e81";
  }

  const traitEl = $("char-trait");
  if (traitEl) { traitEl.innerText = player.trait.name; traitEl.className = `tag badge-${player.trait.rarity || "common"}`; }

  const cp = calcCombatPower(player);
  setText("char-cp", cp.toLocaleString());
  const cap = player.trait.id === "god_mode" ? 999999999 : (GENERATION_CP_CAPS[player.generation] || 9999999);
  setText("char-cp-cap-hint", cp >= cap ? `[Предел ${player.generation}-го рода: ${cap.toLocaleString()}]` : `Потолок ${player.generation}-го рода: ${cap.toLocaleString()}`);

  setText("char-guild-badge", player.age >= 10 ? `Ранг ${player.guildRank}` : "Гильдия: с 10 лет");
  const nick = getBardNickname(player, cp);
  setText("char-world-rank", nick);
  setText("bard-fame-text", `Молва бардов: «${player.firstName} — ${nick}» (БМ ${cp.toLocaleString()})`);

  ["left", "right"].forEach(side => {
    const el = $(`eye-${side}`), eye = player.demonEyes?.[side];
    if (el) {
      el.className = eye ? "eye-slot active" : "eye-slot";
      el.innerText = eye ? eye.name : `👁️ ${side === "left" ? "Левый" : "Правый"}: Обычный`;
    }
  });
  setText("char-languages-text", player.languages.map(l => LANGUAGES[l]?.name || l).join(", "));

  const seatObj = ESTATES.find(e => e.id === player.familySeat);
  const regen = (seatObj ? seatObj.hpRegen : 5) + (player.trait.id === "miko_healing" ? 25 : 0);
  setText("hp-regen-hint", `(+${regen} HP/г.)`);
  setText("hp-text", `${player.hp}/${player.maxHp}`);
  if ($("hp-bar")) $("hp-bar").style.width = `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%`;
  setText("mana-text", `${player.mana}/${player.maxMana}`);
  if ($("mana-bar")) $("mana-bar").style.width = `${Math.min(100, (player.mana / player.maxMana) * 100)}%`;

  const injBanner = $("injuries-banner");
  if (injBanner) {
    injBanner.style.display = player.injuries.length ? "block" : "none";
    injBanner.innerHTML = player.injuries.map(i => `<span class="badge-mythic" style="margin-right:4px;">⚠️ ${i.name}</span>`).join("");
  }

  if ($("estate-residence-badge")) $("estate-residence-badge").innerHTML = seatObj
    ? `<span class="tag badge-rare">🏰 Родовой Замок: ${seatObj.name}</span>`
    : `<span style="font-size:10px; color:var(--muted);">🏡 Нет назначенного замка</span>`;

  if ($("powers-seat-badge")) $("powers-seat-badge").innerHTML = player.currentPowersSeat
    ? `<span class="tag badge-mythic">🏆 Владыка #${player.currentPowersSeat} Семи Сил</span>` : "";

  const jBox = $("job-badge-container");
  if (jBox) {
    let html = "";
    if (player.currentJob) {
      const r = getJobDataById(player.currentJob)?.ranks[player.jobRankIndex];
      if (r) html += `<span class="tag badge-rare" style="margin-right:4px;">💼 ${r.title} (+${r.salary}🪙/г.)</span>`;
    }
    if (player.currentUndergroundJob) {
      const ur = UNDERGROUND_JOBS[player.currentRegionKey]?.ranks[player.undergroundRankIndex];
      if (ur) html += `<span class="tag badge-mythic">🗡️ ${ur.title} (+${ur.salary}🪙/г.)</span>`;
    }
    jBox.innerHTML = html || `<span style="font-size:10px; color:var(--muted);">💼 Без постоянной службы</span>`;
  }

  const titleObj = ASURA_POLITICS.nobilityTitles.find(t => t.id === player.nobilityTitle) || ASURA_POLITICS.nobilityTitles[0];
  const fMap = { ariel: "Ариэль 👑", prince_first: "1-й Принц 🦁", prince_second: "2-й Принц 🐍" };
  if ($("politics-badge-container")) $("politics-badge-container").innerHTML =
    `<span class="tag badge-epic">👑 ${titleObj.name} • ${fMap[player.asuraFaction] || "Вне политики"} (Влияние: ${player.asuraInfluence})</span>`;

  const facMap = {
    orsted: `<span class="tag badge-rare">🐉 Знамя Орстеда (Прогресс: ${player.factionProgress})</span>`,
    hitogami: `<span class="tag badge-legendary">👁️ Апостол Снов Хитогами (Доверие: ${player.hitogamiTrust})</span>`,
    neutral: `<span style="font-size:10px; color:var(--muted);">⚖️ Сторона Богов: Не выбрана</span>`
  };
  if ($("faction-badge-container")) $("faction-badge-container").innerHTML = facMap[player.dynastyFaction] || facMap.neutral;

  const lost = player.relations.filter(r => r.isLost);
  if ($("calamity-status-banner")) {
    $("calamity-status-banner").style.display = lost.length ? "block" : "none";
    if (lost.length) $("calamity-status-banner").innerHTML = `<div style="background:#450a0a; border:1px solid #ef4444; border-radius:8px; padding:6px; font-size:11px; color:#fca5a5;">⚡ Пропали: ${lost.map(r => r.name).join(", ")}. Ищите их во вкладке «Мир & Род»!</div>`;
  }

  setText("magic", calculateRank(player.magicExp, MAGIC_RANKS));
  setText("sword-god", calculateRank(player.swordGodExp, SWORD_RANKS));
  setText("water-god", calculateRank(player.waterGodExp, SWORD_RANKS));
  setText("north-god", calculateRank(player.northGodExp, SWORD_RANKS));
  setText("intellect", player.intellect);
  setText("coins", player.coins.toLocaleString());
  setText("slot-weapon", player.equipment.weapon?.name || "Кулаки");
  setText("slot-armor", player.equipment.armor?.name || "Одежда");
  setText("slot-accessory", player.equipment.accessory?.name || "Нет");

  renderLifeStorySection();
  renderSevenPowersQuest();
  renderEndgameFactionSection();
}

function updateUI() { renderUI(); saveGame(); }

function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
  $(`tab-${tabId}`)?.classList.add("active");
  const idx = { character: 0, activities: 1, inventory: 2, guild: 3, relations: 4 }[tabId];
  document.querySelectorAll(".nav-item")[idx]?.classList.add("active");

  if (tabId === "activities") renderActivities();
  if (tabId === "inventory") { renderInventoryTab(); renderTestament(); renderFamilyCastle(); renderEstates(); renderCaravans(); }
  if (tabId === "guild") { renderGuildTab(); renderSquad(); }
  if (tabId === "relations") { renderRelations(); renderChaosBreaker(); renderGreyratBranches(); renderTablets(); renderLanguages(); }
  playSound("click");
}

function setWorldSubTab(sub, btnEl) {
  ["relations", "perugius", "greyrat", "tablets", "politics", "tree", "languages", "travel", "schools"].forEach(t => {
    const el = $(`world-sub-${t}`);
    if (el) el.style.display = t === sub ? "block" : "none";
  });
  btnEl?.parentElement?.querySelectorAll(".sub-tab-btn").forEach(b => b.classList.remove("active"));
  btnEl?.classList.add("active");
  ({ relations: renderRelations, perugius: renderChaosBreaker, greyrat: renderGreyratBranches, tablets: renderTablets, politics: renderPolitics, tree: renderDynastyTree, languages: renderLanguages, travel: renderTravelTab, schools: renderSchools })[sub]?.();
  playSound("click");
}

// =========================================================================
// СЮЖЕТНЫЕ ВЕХИ (1-Я ЖИЗНЬ + СЛЕДУЮЩИЕ ВЕКА)
// =========================================================================
function getAvailableStories() {
  return STORY_ACTIVITIES.filter(s => {
    if (player.storyCompleted.includes(s.id) || player.age < s.age) return false;
    if (s.reqFaction && player.dynastyFaction !== s.reqFaction) return false;
    if (s.era === "first") return player.isFirstEraLife;
    if (s.era === "future") {
      if (player.isFirstEraLife && worldState.currentWorldYear < 430) return false;
      if (s.minYear && worldState.currentWorldYear < s.minYear) return false;
      if (s.maxYear && worldState.currentWorldYear > s.maxYear) return false;
      return true;
    }
    return false;
  });
}

function renderLifeStorySection() {
  const container = $("life-story-container"), badge = $("story-notify-badge");
  if (!container) return;
  const list = getAvailableStories();
  if (badge) badge.style.display = list.length ? "inline-block" : "none";
  if (!list.length) {
    container.innerHTML = `<div style="font-size:11px; color:var(--muted); padding:6px;">Вехи текущего возраста и эпохи завершены. Взрослейте или переходите в новые века!</div>`;
    return;
  }
  container.innerHTML = list.map(st => `
    <div class="activity-card" style="border-color:var(--gold);">
      <div class="act-info">
        <div class="act-title-row"><span class="act-name" style="color:var(--gold);">${st.name}</span><span class="act-age-badge">с ${st.age} лет</span></div>
        <div class="act-desc">${st.desc}</div>
      </div>
      <button style="background:linear-gradient(135deg,#b45309,#d97706); min-width:105px;" onclick="performStoryActivity('${st.id}')">✨ Свершить</button>
    </div>`).join("");
}

function performStoryActivity(storyId) {
  const st = STORY_ACTIVITIES.find(s => s.id === storyId);
  if (!st || player.storyCompleted.includes(st.id)) return;
  if (st.choices) {
    triggerRandomEvent({
      icon: "📜", title: st.name, desc: st.desc,
      choices: st.choices.map(ch => ({
        text: ch.text,
        action: (p) => { p.storyCompleted.push(st.id); return ch.action(p, worldState); }
      }))
    });
    return;
  }
  player.storyCompleted.push(st.id);
  const res = st.action(player, worldState);
  log(res);
  playSound(st.id === "s1_calamity" ? "calamity" : "win");
  showActionModal("Сюжетная Веха", res, "📜");
  updateUI();
}

// =========================================================================
// ДЕЛА, СЛУЖБА И ПОДПОЛЬЕ
// =========================================================================
function setActivityCategory(cat, btnEl) {
  currentActivityCategory = cat;
  btnEl?.parentElement?.querySelectorAll(".sub-tab-btn").forEach(b => b.classList.remove("active"));
  btnEl?.classList.add("active");
  renderActivities();
  playSound("click");
}

function renderActivities() {
  const container = $("activities-container");
  if (!container) return;
  container.innerHTML = "";
  if (currentActivityCategory === "job") return renderJobMarket(container);
  if (currentActivityCategory === "underground") return renderUndergroundMarket(container);

  let list = ACTIVITIES.filter(a => player.age >= a.minAge && player.age <= a.maxAge);
  if (currentActivityCategory !== "all") list = list.filter(a => a.category === currentActivityCategory);
  if (!list.length) {
    container.innerHTML = `<div style="color:var(--muted); text-align:center; padding:20px;">Нет дел в этой категории для возраста ${player.age} лет.</div>`;
    return;
  }
  container.innerHTML = list.map(act => `
    <div class="activity-card">
      <div class="act-info">
        <div class="act-title-row"><span class="act-name">${act.name}</span><span class="act-age-badge">${act.minAge}–${act.maxAge} л.</span></div>
        <div class="act-desc">${act.desc}</div>
        <div class="act-req">⚡ ${act.apCost} силы ${act.cost > 0 ? `• ${act.cost}🪙` : ""}</div>
      </div>
      <button class="act-btn" ${player.ap >= act.apCost ? "" : "disabled"} onclick="performActivity('${act.id}')">${player.ap >= act.apCost ? "Делать" : "Устал"}</button>
    </div>`).join("");
}

function performActivity(actId) {
  const act = ACTIVITIES.find(a => a.id === actId);
  if (!act) return;
  if (player.ap < act.apCost) return showActionModal("Усталость", "Нажмите «Прожить 1 год», чтобы восстановить силы.", "💤");
  if (act.cost && player.coins < act.cost) return showActionModal("Нехватка монет", `Требуется ${act.cost}🪙.`, "🪙");
  player.ap -= act.apCost;
  const msg = act.action(player);
  log(msg);
  playSound(act.category === "combat" ? "sword" : act.category === "magic" ? "magic" : "click");
  showActionModal(act.name, msg, "✨");
  updateUI();
  renderActivities();
}

function getJobDataById(id) {
  for (const reg in REGIONAL_JOBS) {
    const j = REGIONAL_JOBS[reg].find(x => x.id === id);
    if (j) return j;
  }
  return null;
}

function meetsJobReq(r) {
  return player.age >= r.minAge && (!r.minSword || player.swordGodExp >= r.minSword) && (!r.minMagic || player.magicExp >= r.minMagic) && (!r.minInt || player.intellect >= r.minInt) && (!r.minNorth || player.northGodExp >= r.minNorth);
}

function renderJobMarket(container) {
  if (player.currentJob) {
    const jData = getJobDataById(player.currentJob);
    const cur = jData?.ranks[player.jobRankIndex], next = jData?.ranks[player.jobRankIndex + 1];
    if (cur) {
      container.innerHTML = `<div class="card" style="background:#131b2e; border-color:#38bdf8;">
        <b style="color:#38bdf8;">💼 ${jData.name}</b>
        <div style="font-size:12px; margin-top:4px;">Чин: <b>${cur.title}</b> (+${cur.salary}🪙/г.)</div>
        <div style="font-size:11px; color:var(--muted);">${cur.desc}</div>
        ${next ? `<div style="margin-top:8px; border-top:1px solid rgba(255,255,255,0.08); padding-top:8px;">
          <div style="font-size:11px; color:var(--accent-light);">Следующий чин: <b>${next.title}</b> (+${next.salary}🪙)</div>
          <div style="font-size:10px; color:var(--muted);">С ${next.minAge} л. ${next.minSword ? `• Меч ${next.minSword}+` : ""} ${next.minMagic ? `• Магия ${next.minMagic}+` : ""} ${next.minInt ? `• Знания ${next.minInt}+` : ""}</div>
          <button style="margin-top:6px; width:100%; background:#2563eb;" onclick="tryJobPromotion()">🎖️ Повышение</button>
        </div>` : `<div style="color:var(--gold); font-size:11px; margin-top:6px;">🌟 Вершина службы!</div>`}
        <button class="action-danger" style="margin-top:8px; width:100%; font-size:11px;" onclick="quitJob()">Уйти в отставку</button>
      </div>`;
      return;
    }
  }
  const jobs = REGIONAL_JOBS[player.currentRegionKey] || [];
  container.innerHTML = `<div style="font-size:12px; color:var(--muted); margin-bottom:8px;">Службы (${REGIONS[player.currentRegionKey].name}):</div>` +
    jobs.map(jb => {
      const r0 = jb.ranks[0], ok = meetsJobReq(r0);
      return `<div class="job-card"><div><b>${jb.name}</b><div style="font-size:11px; color:var(--muted);">${r0.title} (+${r0.salary}🪙/г.) • с ${r0.minAge} л.</div></div>
        <button ${ok ? "" : "disabled"} style="background:#1d4ed8;" onclick="applyForJob('${jb.id}')">${ok ? "Поступить" : "Не годен"}</button></div>`;
    }).join("");
}

function applyForJob(id) {
  const j = getJobDataById(id); if (!j) return;
  player.currentJob = id; player.jobRankIndex = 0;
  const msg = `Вы приняты на службу: <b>${j.name}</b> (${j.ranks[0].title})!`;
  log(msg); playSound("win"); showActionModal("Служба", msg, "💼"); updateUI(); renderActivities();
}
function tryJobPromotion() {
  const next = getJobDataById(player.currentJob)?.ranks[player.jobRankIndex + 1];
  if (next && meetsJobReq(next)) {
    player.jobRankIndex++;
    const msg = `<b>ПОВЫШЕНИЕ!</b> Новый чин: <b>${next.title}</b> (+${next.salary}🪙/г.)!`;
    log(msg); playSound("win"); showActionModal("Повышение", msg, "🎖️");
  } else showActionModal("Отказ", "Не хватает возраста или навыков!", "❌");
  updateUI(); renderActivities();
}
function quitJob() { player.currentJob = null; player.jobRankIndex = 0; log("Вы ушли со службы."); updateUI(); renderActivities(); }

function renderUndergroundMarket(container) {
  const uJob = UNDERGROUND_JOBS[player.currentRegionKey];
  if (!uJob) { container.innerHTML = `<div style="color:var(--muted);">Нет подполья в регионе.</div>`; return; }
  if (player.currentUndergroundJob) {
    const cur = uJob.ranks[player.undergroundRankIndex], next = uJob.ranks[player.undergroundRankIndex + 1];
    container.innerHTML = `<div class="card" style="background:#201115; border-color:#ef4444;">
      <b style="color:#f87171;">🗡️ ${uJob.name}</b>
      <div style="font-size:12px; margin-top:4px;">Роль: <b>${cur.title}</b> (+${cur.salary}🪙/г. • Риск: ${Math.round(cur.risk * 100)}%)</div>
      ${next ? `<button style="margin-top:8px; width:100%; background:#b91c1c;" onclick="tryUndergroundPromotion()">💀 Повыситься: ${next.title} (+${next.salary}🪙)</button>` : `<div style="color:var(--gold); font-size:11px; margin-top:6px;">👑 Владыка подполья!</div>`}
      <button class="action-danger" style="margin-top:8px; width:100%; font-size:11px;" onclick="quitUndergroundJob()">Залечь на дно</button>
    </div>`;
    return;
  }
  const r0 = uJob.ranks[0], ok = player.age >= r0.minAge;
  container.innerHTML = `<div class="job-card" style="border-color:#7f1d1d;">
    <div><b style="color:#f87171;">${uJob.name}</b><div style="font-size:11px; color:var(--muted);">${r0.title} (+${r0.salary}🪙/г.) • Риск ${Math.round(r0.risk * 100)}%</div></div>
    <button ${ok ? "" : "disabled"} style="background:#991b1b;" onclick="applyForUndergroundJob()">${ok ? "Вступить" : "Рано"}</button></div>`;
}

function applyForUndergroundJob() {
  const u = UNDERGROUND_JOBS[player.currentRegionKey];
  player.currentUndergroundJob = u.id; player.undergroundRankIndex = 0;
  const msg = `Вы вступили в <b>${u.name}</b>!`;
  log(msg); playSound("death"); showActionModal("Подполье", msg, "🗡️"); updateUI(); renderActivities();
}
function tryUndergroundPromotion() {
  const next = UNDERGROUND_JOBS[player.currentRegionKey]?.ranks[player.undergroundRankIndex + 1];
  if (next && meetsJobReq(next)) {
    player.undergroundRankIndex++;
    const msg = `💀 Новая ступень в синдикате: <b>${next.title}</b> (+${next.salary}🪙/г.)!`;
    log(msg); playSound("win"); showActionModal("Синдикат", msg, "💀");
  } else showActionModal("Отказ", "Недостаточно боевого опыта или возраста!", "❌");
  updateUI(); renderActivities();
}
function quitUndergroundJob() { player.currentUndergroundJob = null; player.undergroundRankIndex = 0; log("Вы залегли на дно."); updateUI(); renderActivities(); }

// =========================================================================
// ИМУЩЕСТВО, ЗАВЕЩАНИЕ, РЕЛИКВИЯ, ЗАМОК, КАРАВАНЫ И ИНВЕНТАРЬ
// =========================================================================
function renderTestament() {
  const cont = $("testament-container"); if (!cont) return;
  const children = player.children.filter(c => !c.isDead);
  const heir = children.find(c => c.id === player.appointedHeirId);
  const eqButtons = ["weapon", "armor", "accessory"].filter(s => player.equipment[s]).map(s => {
    const isH = player.heirloomSlot === s;
    return `<button style="font-size:10px; padding:5px 8px; background:${isH ? "#d97706" : "#1f2937"};" onclick="setHeirloom('${s}')">${isH ? "✨ Реликвия: " : "Завещать: "}${player.equipment[s].name}</button>`;
  }).join("");

  cont.innerHTML = `<div class="testament-card" style="background:#1b1828; border-color:#c084fc;">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <b style="color:#e9d5ff; font-size:13px;">📜 Завещание и Фамильная Реликвия</b>
      <span class="badge-legendary">${heir ? heir.name : "Не выбран"}</span>
    </div>
    <div style="font-size:11px; color:var(--muted); margin:4px 0;">Наследник получает <b>100% казны</b>, замки, титул Семи Сил и 1 Фамильную Реликвию!</div>
    ${children.length ? `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
      ${children.map(c => `<button style="font-size:10px; padding:5px 8px; background:${player.appointedHeirId === c.id ? "#059669" : "#312e81"};" onclick="appointTestamentHeir('${c.id}')">${player.appointedHeirId === c.id ? "👑 " : ""}${c.name}</button>`).join("")}
    </div>` : `<div style="font-size:11px; color:#fbbf24;">Заведите ребенка в браке, чтобы выбрать преемника!</div>`}
    ${eqButtons ? `<div style="margin-top:8px; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px;"><div style="font-size:10px; color:var(--gold); margin-bottom:4px;">Фамильная Реликвия (перейдёт к наследнику):</div><div style="display:flex; gap:6px; flex-wrap:wrap;">${eqButtons}</div></div>` : ""}
  </div>`;
}

function appointTestamentHeir(id) {
  player.appointedHeirId = id;
  const c = player.children.find(x => x.id === id);
  log(`👑 Наследником назначен(а) <b>${c?.name}</b>.`);
  playSound("win"); updateUI(); renderTestament();
}

function setHeirloom(slot) {
  player.heirloomSlot = player.heirloomSlot === slot ? null : slot;
  if (player.heirloomSlot) log(`✨ <b>${player.equipment[slot].name}</b> объявлена Фамильной Реликвией рода!`);
  playSound("coin"); updateUI(); renderTestament();
}

function renderFamilyCastle() {
  const cont = $("family-castle-container"); if (!cont) return;
  if (!player.estates.length) { cont.innerHTML = `<div style="font-size:11px; color:var(--muted);">Купите имение ниже, чтобы сделать его Замком рода.</div>`; return; }
  const seat = ESTATES.find(e => e.id === player.familySeat);
  let html = `<div class="castle-card" style="background:#1e1a2f; border-color:#8b5cf6;">
    <div style="display:flex; justify-content:space-between;"><b style="color:#e9d5ff;">🏰 Родовое Гнездо</b><span class="badge-legendary">${seat ? seat.name : "Не выбрано"}</span></div>
    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
      ${player.estates.map(id => {
        const e = ESTATES.find(x => x.id === id), isS = player.familySeat === id;
        return `<button style="font-size:10px; padding:5px 8px; background:${isS ? "#059669" : "#312e81"};" onclick="setFamilySeat('${id}')">${isS ? "✓ " : "Сделать главной: "}${e.name}</button>`;
      }).join("")}
    </div></div>`;
  if (player.familySeat) {
    html += `<div class="section-title">Улучшения Замка</div>` + CASTLE_UPGRADES.map(u => {
      const built = player.castleUpgrades.includes(u.id);
      return `<div class="shop-item"><div><b>${u.name}</b> ${built ? '<span style="color:var(--green); font-size:10px;">✓</span>' : ""}<div style="font-size:11px; color:var(--muted);">${u.desc}</div><div style="font-size:10px; color:var(--gold);">${u.cost}🪙</div></div>
        <button ${built ? "disabled" : ""} style="background:${built ? "#059669" : "#4338ca"};" onclick="buildCastleUpgrade('${u.id}')">${built ? "Готово" : "Возвести"}</button></div>`;
    }).join("");
    if (player.castleUpgrades.includes("crypt")) {
      const cd = 5 - (player.age - player.lastCryptMeditationAge);
      html += `<div class="card" style="background:#181422; border-color:#a855f7; display:flex; justify-content:space-between; align-items:center;">
        <div><b style="color:#f3e8ff; font-size:12px;">🕯️ Склеп Предков</b><div style="font-size:10px; color:var(--muted);">Молитва раз в 5 лет (+25 к Мечу/Магии, 100% HP/Маны).</div></div>
        <button ${cd <= 0 ? "" : "disabled"} style="background:#7e22ce; font-size:11px;" onclick="meditateInCrypt()">${cd <= 0 ? "Молиться" : `${cd} л.`}</button></div>`;
    }
  }
  cont.innerHTML = html;
}

function setFamilySeat(id) { player.familySeat = id; log(`🏰 Главным замком назначен: ${ESTATES.find(e => e.id === id)?.name}.`); playSound("win"); updateUI(); renderFamilyCastle(); }
function buildCastleUpgrade(id) {
  const u = CASTLE_UPGRADES.find(x => x.id === id); if (!u || player.coins < u.cost) return showActionModal("Золото", `Нужно ${u?.cost}🪙!`, "🪙");
  player.coins -= u.cost; player.castleUpgrades.push(id);
  log(`🛠️ Возведено: <b>${u.name}</b>!`); playSound("win"); updateUI(); renderFamilyCastle();
}
function meditateInCrypt() {
  player.lastCryptMeditationAge = player.age; player.hp = player.maxHp; player.mana = player.maxMana; player.swordGodExp += 25; player.magicExp += 25;
  const msg = "Духи предков благословили ваш клинок и разум (+25 Мечу и Магии, полное восстановление)!";
  log(`🕯️ ${msg}`); playSound("magic"); showActionModal("Склеп Предков", msg, "🕯️"); updateUI(); renderFamilyCastle();
}

function renderCaravans() {
  const cont = $("caravans-container"); if (!cont) return;
  cont.innerHTML = CARAVAN_ROUTES.map(r => `
    <div class="caravan-card"><div><b>${r.name}</b><div style="font-size:11px; color:var(--muted);">${r.desc}</div>
      <div style="font-size:10px; color:var(--gold);">Вклад: ${r.cost}🪙 • Возврат: +${r.reward}🪙 • Риск: ${Math.round(r.risk * 100)}%</div></div>
      <button style="background:#0284c7;" onclick="dispatchCaravan('${r.id}')">Отправить</button></div>`).join("");
}

function dispatchCaravan(id) {
  if (player.ap < 1) return showActionModal("Усталость", "Нужно ⚡ 1 сила!", "💤");
  const r = CARAVAN_ROUTES.find(x => x.id === id);
  if (!r || player.coins < r.cost) return showActionModal("Золото", `Нужно ${r?.cost}🪙!`, "🪙");
  player.ap -= 1; player.coins -= r.cost;
  const hasVault = player.castleUpgrades.includes("grand_vault");
  const risk = Math.max(0.05, r.risk - (hasVault ? 0.05 : 0) - (player.squad.length >= 3 ? 0.1 : 0));
  if (Math.random() < risk) {
    const msg = `⚠️ Засада разбойников на пути «${r.name}»! Потеряно ${r.cost}🪙.`;
    log(msg); playSound("death"); showActionModal("Нападение!", msg, "⚔️");
  } else {
    const reward = hasVault ? Math.round(r.reward * 1.1) : r.reward;
    player.coins += reward;
    const msg = `🎉 Караван прибыл! Получено <b>+${reward}🪙</b>!`;
    log(msg); playSound("coin"); showActionModal("Прибыль!", msg, "🐪");
  }
  updateUI();
}

function renderEstates() {
  const cont = $("estate-container"); if (!cont) return;
  cont.innerHTML = ESTATES.map(e => {
    const owned = player.estates.includes(e.id);
    return `<div class="estate-card"><div><b>${e.name}</b> ${owned ? '<span style="color:var(--green); font-size:11px;">✓</span>' : ""}
      <div style="font-size:11px; color:var(--muted);">${e.desc}</div><div style="font-size:10px; color:var(--gold);">Цена: ${e.cost.toLocaleString()}🪙</div></div>
      <button ${owned ? "disabled" : ""} style="background:${owned ? "#059669" : "#312e81"};" onclick="buyEstate('${e.id}')">${owned ? "Куплено" : "Купить"}</button></div>`;
  }).join("");
}

function buyEstate(id) {
  const e = ESTATES.find(x => x.id === id);
  if (!e || player.coins < e.cost) return showActionModal("Золото", "Недостаточно монет!", "🪙");
  player.coins -= e.cost; player.estates.push(id);
  if (!player.familySeat) player.familySeat = id;
  log(`🏰 Приобретено: <b>${e.name}</b>!`); playSound("win"); updateUI(); renderEstates(); renderFamilyCastle();
}

function getShopPrice(item) {
  return (player.currentRegionKey === "demon" && player.languages.includes("demon")) ? Math.max(1, Math.floor(item.cost * 0.8)) : item.cost;
}

function renderInventoryTab() {
  const inv = $("inventory-list");
  if (inv) {
    let html = "";
    if (player.potionsCount > 0) html += `<div class="shop-item"><div><b>🧪 Зелье Исцеления</b> (${player.potionsCount} шт.)<div style="font-size:11px; color:var(--muted);">+60 HP</div></div><button onclick="usePotionOutOfCombat()">Пить</button></div>`;
    html += player.inventory.map((it, i) => `
      <div class="shop-item"><div><b>${it.name}</b> (+${it.cp} БМ)<div style="font-size:11px; color:var(--muted);">${it.desc}</div></div>
      <div style="display:flex; gap:5px;"><button style="background:#4338ca; padding:6px 9px; font-size:11px;" onclick="equipItem(${i})">Надеть</button>
      <button class="btn-sell" onclick="sellInventoryItem(${i})">+${Math.max(5, Math.floor(it.cost * 0.5))}🪙</button></div></div>`).join("");
    inv.innerHTML = html || `<div style="font-size:12px; color:var(--muted);">Рюкзак пуст.</div>`;
  }
  const shop = $("shop-list");
  if (shop) {
    const items = currentShopCategory === "all" ? SHOP_ITEMS : SHOP_ITEMS.filter(i => currentShopCategory === "artifact" ? (i.type === "accessory" || i.type === "potion") : i.type === currentShopCategory);
    shop.innerHTML = items.map(it => {
      const price = getShopPrice(it);
      return `<div class="shop-item"><div><b>${it.name}</b> <span style="color:var(--gold); font-size:11px;">${price}🪙</span><div style="font-size:11px; color:var(--muted);">${it.desc}</div></div>
        <button onclick="buyShopItem('${it.id}')">Купить</button></div>`;
    }).join("");
  }
}

function setShopCategory(cat, btnEl) {
  currentShopCategory = cat;
  btnEl?.parentElement?.querySelectorAll(".sub-tab-btn").forEach(b => b.classList.remove("active"));
  btnEl?.classList.add("active");
  renderInventoryTab(); playSound("click");
}

function buyShopItem(id) {
  const it = SHOP_ITEMS.find(i => i.id === id); if (!it) return;
  const price = getShopPrice(it);
  if (player.coins < price) return showActionModal("Золото", `Нужно ${price}🪙!`, "🪙");
  player.coins -= price;
  if (it.type === "potion") player.potionsCount++; else player.inventory.push({ ...it });
  log(`🛒 Куплено: <b>${it.name}</b> (${price}🪙).`); playSound("coin"); updateUI(); renderInventoryTab();
}

function sellInventoryItem(idx) {
  const it = player.inventory[idx]; if (!it) return;
  const val = Math.max(5, Math.floor(it.cost * 0.5));
  player.coins += val; player.inventory.splice(idx, 1);
  log(`🪙 Продано: ${it.name} (+${val}🪙).`); playSound("coin"); updateUI(); renderInventoryTab();
}

function equipItem(idx) {
  const it = player.inventory[idx]; if (!it) return;
  const slot = it.type;
  if (player.equipment[slot]) unequipSlot(slot, true);
  player.equipment[slot] = it;
  if (it.hp) { player.maxHp += it.hp; player.hp += it.hp; }
  player.inventory.splice(idx, 1);
  log(`⚔️ Надето: <b>${it.name}</b>.`); playSound("sword"); updateUI(); renderInventoryTab(); renderTestament();
}

function unequipSlot(slot, silent = false) {
  const it = player.equipment[slot]; if (!it) return;
  if (it.hp) { player.maxHp = Math.max(20, player.maxHp - it.hp); player.hp = Math.min(player.hp, player.maxHp); }
  if (player.heirloomSlot === slot) player.heirloomSlot = null;
  player.inventory.push(it); player.equipment[slot] = null;
  if (!silent) { log(`Снято: ${it.name}.`); playSound("click"); updateUI(); renderInventoryTab(); renderTestament(); }
}

function usePotionOutOfCombat() {
  if (player.potionsCount <= 0) return;
  player.potionsCount--; player.hp = Math.min(player.maxHp, player.hp + 60);
  log("🧪 Выпито зелье (+60 HP)."); playSound("coin"); updateUI(); renderInventoryTab();
}

// =========================================================================
// ГИЛЬДИЯ, ОТРЯД, ЛАБИРИНТЫ, 7 СИЛ И ДВОЙНОЙ ЭНДГЕЙМ
// =========================================================================
function renderGuildTab() {
  setText("guild-status-tag", `Ранг: ${player.guildRank}`);
  const nextRank = ADVENTURER_RANKS[ADVENTURER_RANKS.indexOf(player.guildRank) + 1];
  setText("guild-exp-text", `${player.guildExp} / ${nextRank ? ADVENTURER_REQ[nextRank] : "MAX"} GP`);
  renderPowersMonument(); renderSevenPowersQuest(); renderEndgameFactionSection();

  const dCont = $("dungeon-container");
  if (dCont) {
    const pIdx = ADVENTURER_RANKS.indexOf(player.guildRank);
    dCont.innerHTML = DUNGEONS.map(d => {
      const floor = player.dungeonProgress[d.id] || 1, done = floor > d.maxFloors, ok = player.age >= 10 && pIdx >= ADVENTURER_RANKS.indexOf(d.reqRank);
      return `<div class="card" style="margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between;"><b style="font-size:13px;">${d.name}</b><span class="tag badge-rare">Ранг ${d.reqRank}+</span></div>
        <div style="font-size:11px; color:var(--muted); margin:4px 0;">${d.desc}</div>
        <div style="font-size:11px; color:var(--accent-light);">${done ? "👑 Покорен!" : `Этаж ${floor} из ${d.maxFloors}`}</div>
        <button ${!ok || done ? "disabled" : ""} onclick="openDungeonExploration('${d.id}')" style="margin-top:6px; background:#4338ca; width:100%;">
          ${done ? "✓ Зачищен" : ok ? "Войти в Лабиринт (⚡ 1 сила)" : `Нужен ранг ${d.reqRank} (с 10 л.)`}
        </button></div>`;
    }).join("");
  }

  const qCont = $("guild-quests-list");
  if (qCont) {
    if (player.age < 10) qCont.innerHTML = `<div style="color:var(--muted); text-align:center;">Гильдия открыта с 10 лет!</div>`;
    else if (!player.guildQuestsThisYear.length) qCont.innerHTML = `<div style="color:var(--muted); text-align:center;">Заказы года выполнены!</div>`;
    else qCont.innerHTML = player.guildQuestsThisYear.map(q => `
      <div class="quest-card"><div><span class="tag badge-rare">Ранг ${q.rank}</span> <b style="display:block; margin:2px 0;">${q.name}</b>
        <div style="font-size:11px; color:var(--muted);">${q.enemy} • БМ ${q.cp.toLocaleString()}</div>
        <div style="font-size:11px; color:var(--gold);">+${q.reward}🪙 • +${q.gp} GP • ⚡ 2 силы</div></div>
        <button ${player.ap >= 2 ? "" : "disabled"} style="background:#312e81;" onclick="startGuildBattle('${q.id}')">${player.ap >= 2 ? "В бой" : "Нет сил"}</button></div>`).join("");
  }
}

function openDungeonExploration(id) {
  if (player.ap < 1) return showActionModal("Усталость", "Нужно ⚡ 1 сила!", "💤");
  player.ap -= 1;
  if (checkSquadBetrayal()) return;
  const d = DUNGEONS.find(x => x.id === id);
  player.dungeonProgress[id] = player.dungeonProgress[id] || 1;
  activeDungeon = { id, obj: d };
  updateDungeonModalUI("Вы ступили под древние своды лабиринта.");
  if ($("dungeon-modal")) $("dungeon-modal").style.display = "flex";
  playSound("sword");
}

function updateDungeonModalUI(text) {
  if (!activeDungeon) return;
  const d = activeDungeon.obj, floor = player.dungeonProgress[d.id];
  setText("dung-modal-title", d.name);
  setText("dung-modal-floor-info", floor > d.maxFloors ? "Покорен!" : `Этаж ${floor} из ${d.maxFloors}`);
  setText("dung-hp-text", `${player.hp}/${player.maxHp}`);
  if ($("dung-hp-bar")) $("dung-hp-bar").style.width = `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%`;
  if ($("dung-modal-body")) $("dung-modal-body").innerHTML = text;
  const box = $("dung-modal-actions"); if (!box) return;
  box.innerHTML = floor > d.maxFloors
    ? `<button class="btn-main" onclick="closeDungeonModal()">👑 Покинуть лабиринт</button>`
    : `<button style="background:#4338ca;" onclick="dungeonTurn('fight')">⚔️ Пробиваться через этаж</button>
       <button style="background:#1d4ed8;" onclick="dungeonTurn('scout')">👁️ Разведка тайников</button>
       <button style="background:#059669;" onclick="dungeonTurn('rest')">🧪 Привал (+30 HP, +20 маны)</button>
       <button class="action-danger" onclick="closeDungeonModal()">🏃 Выйти наружу</button>`;
}

function dungeonTurn(choice) {
  if (!activeDungeon) return;
  const d = activeDungeon.obj, floor = player.dungeonProgress[d.id];
  const hasManaSight = player.demonEyes.left?.id === "mana_sight" || player.demonEyes.right?.id === "mana_sight";
  let txt = "";
  if (choice === "rest") {
    player.hp = Math.min(player.maxHp, player.hp + 30); player.mana = Math.min(player.maxMana, player.mana + 20);
    txt = "Отряд перевёл дух (+30 HP, +20 маны)."; playSound("magic");
  } else if (choice === "scout") {
    const r = Math.random();
    if (r < 0.35 && floor > 1) {
      if (hasManaSight) txt = "🔮 <b>Глаз Маны</b> раскрыл ловушку телепортации и уберёг отряд!";
      else { const back = Math.min(floor - 1, 2); player.dungeonProgress[d.id] -= back; txt = `🌀 Ловушка отбросила вас на -${back} этажа!`; playSound("calamity"); }
    } else if (r < 0.7) {
      const gold = Math.floor(Math.random() * 90) + 45; player.coins += gold;
      txt = `💎 В тайнике найден клад (+${gold}🪙)!`; playSound("coin");
    } else { player.dungeonProgress[d.id]++; txt = `Вы нашли тайный спуск на ${player.dungeonProgress[d.id]} этаж!`; playSound("win"); }
  } else {
    const mCp = Math.floor(d.cpBase * (1 + floor * 0.45)), dmg = Math.floor(mCp / (calcSquadCombatPower(player) + 100) * 20) + 10;
    player.hp -= dmg;
    if (dmg > 35 && Math.random() < 0.22 && !player.injuries.some(i => i.id === "lost_arm")) {
      player.injuries.push({ id: "lost_arm", name: "Утрата левой руки" });
      txt = `🩸 <b>ТРАВМА!</b> Вы потеряли руку (-${dmg} HP)! Ищите Протез или Целителя Милиса.`; playSound("death");
    } else { txt = `⚔️ Стражи ${floor} этажа повержены (-${dmg} HP)!`; playSound("sword"); }
    player.dungeonProgress[d.id]++;
  }
  if (player.dungeonProgress[d.id] > d.maxFloors) {
    const drop = SHOP_ITEMS.find(i => i.id === d.dropArtifact);
    if (drop && !player.inventory.some(x => x.id === drop.id)) player.inventory.push({ ...drop });
    player.coins += 800; player.guildExp += 150; player.squadFame += 150;
    txt = `👑 <b>ПОБЕДА!</b> ${d.name} зачищен! Награда: <b>${drop?.name}</b> (+800🪙, +150 GP)!`;
    log(txt); playSound("win");
  }
  updateDungeonModalUI(txt); updateUI();
  if (player.hp <= 0) { closeDungeonModal(); handleDeath(`Сгинул в недрах: ${d.name}`); }
}

function closeDungeonModal() { if ($("dungeon-modal")) $("dungeon-modal").style.display = "none"; activeDungeon = null; updateUI(); renderGuildTab(); }

function renderPowersMonument() {
  const cont = $("powers-monument-list"); if (!cont) return;
  cont.innerHTML = worldState.sevenPowers.map(pow => {
    const isMe = player.currentPowersSeat === pow.rank;
    const found = player.discoveredSevenPowers.includes(pow.rank);
    return `<div class="power-row ${isMe ? "power-player" : ""}">
      <div style="display:flex; align-items:center;"><span class="power-rank">#${pow.rank}</span>
        <div><b>${isMe ? `${player.name} (ВЫ!)` : `${pow.title} — ${pow.name}`}</b>
        <div style="font-size:10px; color:var(--muted);">${isMe ? `Ваш трон • ${calcCombatPower(player).toLocaleString()} БМ` : `Мощь: ${pow.cp.toLocaleString()} БМ`}</div></div></div>
      <div>${isMe ? `<span class="badge-legendary">ВАШ ТИТУЛ 👑</span>` : `<button class="btn-challenge" ${found ? "" : "disabled"} onclick="challengeSevenPower(${pow.rank})">${found ? "⚔️ Вызов" : "🔒 Не найден"}</button>`}</div>
    </div>`;
  }).join("");
}

function renderSevenPowersQuest() {
  const cont = $("seven-powers-quest-container"), badge = $("seven-powers-notify");
  if (!cont) return;
  const nextQ = SEVEN_POWERS_QUESTS.find(q => player.currentPowersSeat !== q.rank && !player.discoveredSevenPowers.includes(q.rank));
  if (!nextQ) { if (badge) badge.style.display = "none"; cont.innerHTML = `<div style="font-size:11px; color:var(--muted);">Все доступные владыки выслежены!</div>`; return; }
  const myCp = calcCombatPower(player), canTrack = myCp >= nextQ.reqCp, inReg = player.currentRegionKey === nextQ.regionKey;
  if (badge) badge.style.display = canTrack ? "inline-block" : "none";
  cont.innerHTML = `<div class="powers-quest-card">
    <div style="display:flex; justify-content:space-between;"><b style="color:#f59e0b; font-size:13px;">🔍 #${nextQ.rank}: ${nextQ.title}</b><span class="badge-rare">${nextQ.reqCp.toLocaleString()} БМ</span></div>
    <div style="font-size:11px; color:var(--muted); margin:4px 0;">${nextQ.desc} (${REGIONS[nextQ.regionKey].name})</div>
    <button ${canTrack && inReg ? "" : "disabled"} style="background:#d97706; width:100%;" onclick="trackSevenPower(${nextQ.rank})">
      ${!canTrack ? `Нужно ${nextQ.reqCp.toLocaleString()} БМ` : !inReg ? `Прибудьте в ${REGIONS[nextQ.regionKey].name}` : "🧭 Выследить Владыку (⚡ 1 сила)"}
    </button></div>`;
}

function trackSevenPower(rank) {
  if (player.ap < 1) return showActionModal("Усталость", "Нужно ⚡ 1 сила!", "💤");
  player.ap -= 1; player.discoveredSevenPowers.push(rank);
  const pow = worldState.sevenPowers.find(p => p.rank === rank);
  const msg = `🧭 Вы выследили #${rank} ${pow.title} — <b>${pow.name}</b>! Бросайте вызов на Монументе.`;
  log(msg); playSound("win"); showActionModal("Владыка найден!", msg, "🏆"); updateUI(); renderGuildTab();
}

function vacatePowerSeatToWorld(prevHero, reasonText = "пал без преемников") {
  if (!prevHero?.currentPowersSeat) return;
  const pow = worldState.sevenPowers.find(p => p.rank === prevHero.currentPowersSeat);
  if (!pow) return;
  const pool = REPLACEMENT_MASTERS[pow.rank] || ["Безымянный Мастер"];
  const newName = pool[Math.floor(Math.random() * pool.length)];
  pow.name = newName; pow.holderType = "npc"; pow.isDead = false;
  pow.cp = SEVEN_GREAT_POWERS.find(x => x.rank === pow.rank)?.cp || pow.cp;
  pow.hp = pow.maxHp;
  worldState.chronicles.push({ year: worldState.currentWorldYear, text: `🏆 После того как ${prevHero.name} ${reasonText}, трон #${pow.rank} (${pow.title}) занял(а) <b>${newName}</b>!` });
}

function renderEndgameFactionSection() {
  const cont = $("endgame-faction-section"); if (!cont) return;
  const cfg = FACTION_ENDGAMES[player.dynastyFaction];
  if (!cfg || player.generation < cfg.reqGen) { cont.innerHTML = ""; return; }
  const myCp = calcCombatPower(player), ok = myCp >= cfg.reqCp;
  cont.innerHTML = `<div class="${cfg.cardClass}">
    <div style="display:flex; justify-content:space-between;"><b style="color:#fff; font-size:13px;">${cfg.title}</b><span class="badge-mythic">Поколение ${player.generation}/${cfg.reqGen}+</span></div>
    <div style="font-size:11px; color:#e2e8f0; margin:6px 0;">${cfg.desc}</div>
    <button ${ok ? "" : "disabled"} style="background:linear-gradient(135deg,#7c3aed,#4c1d95); width:100%;" onclick="startFactionEndgameRaid()">
      ${ok ? cfg.btnText : `Требуется ${cfg.reqCp.toLocaleString()} БМ`}
    </button></div>`;
}

function openBattleModal(battleCfg) {
  currentBattle = battleCfg;
  setText("battle-enemy-name", battleCfg.enemyName);
  setText("battle-enemy-cp", `БМ: ${battleCfg.enemyCp.toLocaleString()}`);
  if ($("battle-log")) $("battle-log").innerHTML = battleCfg.intro;
  updateBattleBars();
  if ($("battle-modal")) $("battle-modal").style.display = "flex";
}

function updateBattleBars() {
  if (!currentBattle) return;
  setText("battle-enemy-hp-text", `${Math.max(0, currentBattle.enemyHp)}/${currentBattle.enemyMaxHp}`);
  if ($("battle-enemy-hp-bar")) $("battle-enemy-hp-bar").style.width = `${Math.max(0, (currentBattle.enemyHp / currentBattle.enemyMaxHp) * 100)}%`;
  setText("battle-player-hp-text", `${Math.max(0, player.hp)}/${player.maxHp}`);
  if ($("battle-player-hp-bar")) $("battle-player-hp-bar").style.width = `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%`;
  setText("battle-player-mana-text", `${player.mana}/${player.maxMana}`);
  if ($("battle-player-mana-bar")) $("battle-player-mana-bar").style.width = `${Math.max(0, Math.min(100, (player.mana / player.maxMana) * 100))}%`;
}

function startGuildBattle(id) {
  if (player.ap < 2) return showActionModal("Усталость", "Нужно ⚡ 2 силы!", "💤");
  const q = player.guildQuestsThisYear.find(x => x.id === id); if (!q) return;
  player.ap -= 2;
  openBattleModal({ quest: q, enemyName: `${q.enemy} (Ранг ${q.rank})`, enemyHp: q.hp, enemyMaxHp: q.hp, enemyCp: q.cp, intro: `Схватка против <b>${q.enemy}</b> началась!` });
  playSound("sword");
}

function challengeSevenPower(rank) {
  const pow = worldState.sevenPowers.find(p => p.rank === rank); if (!pow) return;
  openBattleModal({ isSevenPower: true, powerObj: pow, enemyName: `${pow.title} ${pow.name}`, enemyHp: pow.hp, enemyMaxHp: pow.maxHp, enemyCp: pow.cp, intro: `⚡ Вызов за ранг #${pow.rank} Семи Сил против <b>${pow.name}</b>!` });
  playSound("calamity");
}

function startFactionEndgameRaid() {
  const cfg = FACTION_ENDGAMES[player.dynastyFaction]; if (!cfg) return;
  openBattleModal({ isEndgame: true, endgameFaction: player.dynastyFaction, enemyName: cfg.boss.name, enemyHp: cfg.boss.hp, enemyMaxHp: cfg.boss.maxHp, enemyCp: cfg.boss.cp, intro: `🌌 <b>ФИНАЛЬНАЯ БИТВА ЭПОХИ!</b> Перед вами ${cfg.boss.name}!` });
  playSound("calamity");
}

function combatAction(type) {
  if (!currentBattle) return;
  const logBox = $("battle-log"), squadCp = currentBattle.isDuel ? calcCombatPower(player) : calcSquadCombatPower(player);
  const hasForesight = player.demonEyes.left?.id === "foresight" || player.demonEyes.right?.id === "foresight";
  const hasAppraisal = player.demonEyes.left?.id === "appraisal" || player.demonEyes.right?.id === "appraisal";
  const silentCast = player.trait.id === "silent_cast";

  if (type === "flee") {
    if (currentBattle.isSevenPower || currentBattle.isEndgame) {
      if (logBox) logBox.innerHTML += `<div style="color:var(--hp);">Из этой судьбоносной битвы не сбежать!</div>`;
      return;
    }
    if ($("battle-modal")) $("battle-modal").style.display = "none";
    currentBattle = null; return;
  }

  let dmgReduction = 1.0, myDmg = 0;
  if (type === "potion") {
    if (player.potionsCount <= 0) { if (logBox) logBox.innerHTML += `<div style="color:var(--hp);">Зелья закончились!</div>`; return; }
    player.potionsCount--; player.hp = Math.min(player.maxHp, player.hp + 60);
    if (logBox) logBox.innerHTML += `<div style="color:var(--green);">🧪 Вы выпили зелье (+60 HP)!</div>`;
    playSound("coin");
  } else if (type === "parry") {
    dmgReduction = Math.max(0.2, 0.55 - (player.waterGodExp / 1500));
    myDmg = Math.floor((player.waterGodExp + 20) * (squadCp / (currentBattle.enemyCp + 100)) * 1.4) + 12;
    if (logBox) logBox.innerHTML += `<div>💧 Парирование и контратака: <b>-${myDmg} HP</b>!</div>`;
    playSound("sword");
  } else if (type === "sword") {
    const pwr = Math.max(15, player.swordGodExp + player.waterGodExp + player.northGodExp);
    myDmg = Math.floor(pwr * (squadCp / (currentBattle.enemyCp + 100)) * 2.2) + Math.floor(Math.random() * 25) + 15;
    if (hasAppraisal) myDmg = Math.floor(myDmg * 1.3);
    if (logBox) logBox.innerHTML += `<div>⚔️ Выпад клинком: <b>-${myDmg} HP</b>!</div>`;
    playSound("sword");
  } else if (type === "magic") {
    const manaCost = silentCast ? 5 : 10;
    if (player.mana < manaCost) {
      myDmg = 8; if (logBox) logBox.innerHTML += `<div style="color:var(--muted);">Мана на нуле (-8 HP)!</div>`;
    } else {
      player.mana -= manaCost;
      myDmg = Math.floor((player.magicExp + 15) * (squadCp / (currentBattle.enemyCp + 100)) * 2.7) + Math.floor(Math.random() * 35) + 25;
      if (silentCast) myDmg = Math.floor(myDmg * 1.3);
      if (hasAppraisal) myDmg = Math.floor(myDmg * 1.3);
      if (logBox) logBox.innerHTML += `<div>🔮 Удар стихией: <b>-${myDmg} HP</b>!</div>`;
      playSound("magic");
    }
  }

  if (!currentBattle.isDuel && player.squad.length > 0 && type !== "potion") {
    const ally = player.squad[Math.floor(Math.random() * player.squad.length)];
    const allyDmg = Math.max(10, Math.floor((ally.cp / (currentBattle.enemyCp + 200)) * 45));
    myDmg += allyDmg;
    if (logBox) logBox.innerHTML += `<div style="color:#a78bfa;">🛡️ ${ally.name} помогает атакой: <b>-${allyDmg} HP</b>!</div>`;
  }

  currentBattle.enemyHp -= myDmg;

  if (currentBattle.enemyHp <= 0) {
    if (logBox) logBox.innerHTML += `<div style="color:var(--gold); font-weight:700;">🏆 ПОБЕДА!</div>`;
    playSound("win");
    if (currentBattle.isEndgame) {
      const msg = currentBattle.endgameFaction === "hitogami"
        ? `👁️👑 <b>ОРСТЕД ПОВЕРЖЕН!</b> Воля Хитогами восторжествовала! Ваш род вознесён как Высшие Апостолы Новой Эры!`
        : `🌌👑 <b>ХИТОГАМИ ПОВЕРЖЕН!</b> Вы и Орстед разорвали цепи Пустоты и спасли Шестилий Мир!`;
      player.coins += 100000; log(msg);
      worldState.chronicles.push({ year: worldState.currentWorldYear, text: msg });
      showActionModal("ФИНАЛ САГИ", msg, "👑");
    } else if (currentBattle.isSevenPower) {
      const pow = currentBattle.powerObj;
      if (player.currentPowersSeat && player.currentPowersSeat !== pow.rank) vacatePowerSeatToWorld(player, "перешёл на более высокий трон");
      pow.name = player.name; pow.holderType = "player"; pow.isDead = false; pow.cp = calcCombatPower(player);
      player.currentPowersSeat = pow.rank; player.coins += 25000;
      const msg = `👑 <b>ТРИУМФ!</b> Вы заняли ранг #${pow.rank} (${pow.title}) на Монументе Семи Сил!`;
      worldState.chronicles.push({ year: worldState.currentWorldYear, text: `🏆 ${player.name} взошёл на трон #${pow.rank} Семи Сил!` });
      log(msg);
    } else if (currentBattle.quest) {
      player.coins += currentBattle.quest.reward; player.guildExp += currentBattle.quest.gp;
      player.squadFame += currentBattle.quest.gp; player.swordGodExp += 10; player.magicExp += 10;
      log(`Заказ выполнен (+${currentBattle.quest.reward}🪙, +${currentBattle.quest.gp} GP).`);
      player.guildQuestsThisYear = player.guildQuestsThisYear.filter(q => q.id !== currentBattle.quest.id);
      checkGuildRankUp();
    }
    setTimeout(() => { if ($("battle-modal")) $("battle-modal").style.display = "none"; currentBattle = null; updateUI(); renderGuildTab(); }, 950);
    updateBattleBars(); return;
  }

  if (hasForesight && Math.random() < 0.35) {
    if (logBox) logBox.innerHTML += `<div style="color:var(--accent-light);">👁️ Вы уклонились от ответного удара!</div>`;
  } else {
    const eDmg = Math.max(4, Math.floor((currentBattle.enemyCp / (squadCp + 60) * 18 + Math.random() * 14 + 8) * dmgReduction));
    player.hp -= eDmg;
    if (logBox) logBox.innerHTML += `<div style="color:var(--hp);">Враг бьёт: <b>-${eDmg} HP</b>!</div>`;
  }
  if (logBox) logBox.scrollTop = logBox.scrollHeight;
  updateBattleBars(); updateUI();

  if (player.hp <= 0) {
    const ctx = currentBattle;
    if ($("battle-modal")) $("battle-modal").style.display = "none";
    currentBattle = null;
    const reason = ctx.isEndgame ? `Пал в финальной битве эпохи против ${ctx.enemyName}` : ctx.isSevenPower ? `Пал в дуэли за ранг #${ctx.powerObj.rank} Семи Сил` : `Погиб в схватке с ${ctx.enemyName}`;
    handleDeath(reason);
  }
}

function checkGuildRankUp() {
  const next = ADVENTURER_RANKS[ADVENTURER_RANKS.indexOf(player.guildRank) + 1];
  if (next && player.guildExp >= ADVENTURER_REQ[next]) {
    player.guildRank = next;
    const msg = `🌟 Ваш ранг Гильдии повышен до <b>${next}</b>!`;
    log(msg); playSound("win"); showActionModal("Ранг Гильдии", msg, "🌟");
  }
}

function renderSquad() {
  setText("squad-count", player.squad.length + 1);
  setText("squad-cp", calcSquadCombatPower(player).toLocaleString());
  setText("squad-fame", player.squadFame);
  const list = $("squad-members-list"); if (!list) return;
  list.innerHTML = player.squad.length ? player.squad.map((m, i) => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:#12141c; padding:6px 10px; border-radius:8px; margin-bottom:4px; font-size:12px;">
      <div><b>${m.name}</b> <span style="font-size:10px; color:var(--muted);">(${m.role || m.race})</span><div style="font-size:10px; color:#c7d2fe;">БМ: ${m.cp.toLocaleString()}</div></div>
      <button style="padding:4px 8px; font-size:10px; background:#ef4444;" onclick="removeFromSquad(${i})">Убрать</button>
    </div>`).join("") : `<div style="font-size:11px; color:var(--muted);">Пригласите спутников во вкладке «Мир & Род»!</div>`;
}

function addToSquad(id) {
  if (player.squad.length >= 5) return showActionModal("Отряд", "Максимум 6 бойцов!", "🛡️");
  const npc = player.relations.find(r => r.id === id); if (!npc || npc.relation < 60) return showActionModal("Недоверие", "Нужно 60%+ отношений!", "❌");
  player.squad.push(npc); log(`🛡️ ${npc.name} вступил(а) в отряд!`); playSound("win"); updateUI(); renderRelations(); renderSquad();
}
function removeFromSquad(i) { log(`${player.squad[i].name} покинул отряд.`); player.squad.splice(i, 1); updateUI(); renderSquad(); }

function checkSquadBetrayal() {
  for (let i = 0; i < player.squad.length; i++) {
    const m = player.squad[i];
    if (m.isFamily || m.status === "Супруг/Супруга" || m.relation >= 85) continue;
    if (m.relation < 45 || Math.random() < 0.04) {
      player.hp = Math.max(10, player.hp - 35); player.coins = Math.max(0, player.coins - 50);
      player.squad.splice(i, 1); m.relation = 0; m.status = "Заклятый враг";
      log(`🗡️ <b>ПРЕДАТЕЛЬСТВО!</b> ${m.name} ударил в спину и украл золото!`);
      playSound("death"); showActionModal("Предательство!", `${m.name} предал отряд!`, "🗡️"); updateUI(); return true;
    }
  }
  return false;
}

// =========================================================================
// МИР, ПУТЕШЕСТВИЯ, ШКОЛЫ, ПОЛИТИКА, ХАОС БРЕЙКЕР, ГРЕЙРАТ, СКРИЖАЛИ, ЯЗЫКИ
// =========================================================================
function renderTravelTab() {
  const cont = $("world-travel-list"); if (!cont) return;
  cont.innerHTML = Object.entries(REGIONS).map(([k, r]) => {
    const here = player.currentRegionKey === k, ok = player.age >= 8 && !here;
    return `<div class="travel-card"><div><b>${r.name}</b> ${here ? '<span style="color:var(--green); font-size:11px;">(Вы здесь)</span>' : ""}
      <div style="font-size:11px; color:var(--muted);">${r.desc}</div><div style="font-size:10px; color:var(--gold);">${r.travelCost}🪙 • 1 год</div></div>
      <button ${ok ? "" : "disabled"} onclick="travelToRegion('${k}')">${here ? "Здесь" : "Ехать"}</button></div>`;
  }).join("");
}

function travelToRegion(destKey) {
  const dest = REGIONS[destKey];
  if (player.age < 8 || !dest || player.coins < dest.travelCost) return showActionModal("Путь", `Нужно ${dest?.travelCost || 0}🪙 и возраст 8+!`, "🚢");
  player.coins -= dest.travelCost; player.currentRegionKey = destKey;
  log(`🚢 Вы прибыли в <b>${dest.name}</b>.`); playSound("calamity");
  ageUp(); renderTravelTab();
}

function renderSchools() {
  const cont = $("schools-list"); if (!cont) return;
  cont.innerHTML = SCHOOLS.map(s => {
    const enr = player.enrolledSchool === s.id, grad = player.graduatedSchools.includes(s.id), ok = player.currentRegionKey === s.regionKey && player.age >= s.minAge && !grad && !player.enrolledSchool;
    return `<div class="school-card"><div class="header"><b>${s.name}</b><span style="color:var(--gold);">${s.cost}🪙</span></div>
      <div style="font-size:11px; color:var(--muted); margin:4px 0;">${s.desc}</div>
      <button ${ok ? "" : "disabled"} style="width:100%; background:${grad ? "#059669" : enr ? "#10b981" : "#312e81"};" onclick="enrollSchool('${s.id}')">
      ${grad ? "✓ Диплом получен" : enr ? `Курс ${player.schoolProgress}/4` : player.currentRegionKey === s.regionKey ? "Поступить" : `Нужен регион: ${s.region}`}</button></div>`;
  }).join("");
}

function enrollSchool(id) {
  const s = SCHOOLS.find(x => x.id === id);
  if (!s || player.coins < s.cost) return showActionModal("Оплата", "Недостаточно золота!", "🪙");
  player.coins -= s.cost; player.enrolledSchool = id; player.schoolProgress = 1;
  log(`🎓 Зачислен в <b>${s.name}</b>!`); playSound("win"); updateUI(); renderSchools();
}

function renderPolitics() {
  const cont = $("politics-container"); if (!cont) return;
  const titles = ASURA_POLITICS.nobilityTitles, idx = titles.findIndex(t => t.id === player.nobilityTitle), next = titles[idx + 1];
  cont.innerHTML = `<div class="card" style="background:#191428; border-color:#9333ea;">
    <b style="color:#e9d5ff;">🏛️ Статус: ${titles[idx]?.name}</b>
    <div style="font-size:11px; color:var(--muted);">Влияние: <b>${player.asuraInfluence}</b></div>
    ${next ? `<button style="margin-top:8px; width:100%; background:#7e22ce; font-size:11px;" onclick="buyNobilityTitle('${next.id}', ${next.influence * 10}, ${next.influence})">👑 Купить патент: ${next.name} (${next.influence * 10}🪙, ${next.influence} вл.)</button>` : `<div style="color:var(--gold); font-size:11px;">👑 Высший титул Герцога!</div>`}
  </div><div class="section-title">Фракции Трона Асуры</div>` + ASURA_POLITICS.factions.map(f => {
    const mine = player.asuraFaction === f.id;
    return `<div class="card"><b>${f.icon} ${f.name}</b> ${mine ? '<span class="badge-legendary">Ваш выбор ✓</span>' : ""}
      <div style="font-size:11px; color:var(--muted); margin:4px 0;">${f.desc}</div>
      ${mine ? `<button style="width:100%; background:#059669; font-size:11px;" onclick="supportFaction(50)">💰 Спонсировать (50🪙, +15 вл.)</button>` : `<button style="width:100%; background:#4338ca; font-size:11px;" onclick="joinAsuraFaction('${f.id}')">Присягнуть</button>`}</div>`;
  }).join("");
}
function joinAsuraFaction(id) { player.asuraFaction = id; log(`👑 Вы поддержали фракцию Асуры.`); playSound("win"); updateUI(); renderPolitics(); }
function supportFaction(cost) { if (player.coins < cost) return; player.coins -= cost; player.asuraInfluence += 15; log(`💰 Влияние +15.`); playSound("coin"); updateUI(); renderPolitics(); }
function buyNobilityTitle(id, cost, reqInf) {
  if (player.coins < cost || player.asuraInfluence < reqInf) return showActionModal("Титул", `Нужно ${cost}🪙 и ${reqInf} влияния!`, "👑");
  player.coins -= cost; player.nobilityTitle = id; log(`👑 Дарован титул!`); playSound("win"); updateUI(); renderPolitics();
}

function renderDynastyTree() {
  const cont = $("dynasty-tree-container"); if (!cont) return;
  let html = `<div class="tree-node current"><div class="tree-gen">👑 Поколение ${player.generation} (Сейчас • ${worldState.currentWorldYear} г.)</div>
    <b>${player.name}</b> (${player.race}) • БМ ${calcCombatPower(player).toLocaleString()}</div>`;
  if (worldState.chronicles.length) {
    html += `<div class="section-title">Летопись Мира</div>` + worldState.chronicles.slice(-8).reverse().map(c => `<div class="tree-node" style="font-size:11px;"><b style="color:var(--gold);">[${c.year} г.]</b> ${c.text}</div>`).join("");
  }
  html += `<div class="section-title">Зал Славы Предков (${worldState.dynastyHistory.length})</div>`;
  html += worldState.dynastyHistory.length ? worldState.dynastyHistory.slice().reverse().map(a => `
    <div class="tree-node"><div class="tree-gen">📜 Поколение ${a.gen} ${a.powersSeat ? `• #${a.powersSeat} Семи Сил` : ""}</div>
    <b>${a.name}</b> (${a.race}) • Пик БМ: ${a.peakCp.toLocaleString()} • ${a.maxAge} л.<div style="font-size:10px; color:var(--muted);">${a.deathReason}</div></div>`).join("") : `<div style="color:var(--muted); font-size:11px;">Летопись предков пока пуста.</div>`;
  cont.innerHTML = html;
}

function renderChaosBreaker() {
  const cont = $("perugius-container"); if (!cont) return;
  const myCp = calcCombatPower(player);
  cont.innerHTML = PERUGIUS_TRIALS.map(t => {
    const done = player.perugiusTrials.includes(t.rank);
    return `<div class="card"><b>#${t.rank} ${t.name}</b><div style="font-size:11px; color:var(--muted); margin:4px 0;">${t.rewardText} (${t.reqCp.toLocaleString()} БМ)</div>
      <button ${done || myCp < t.reqCp ? "disabled" : ""} style="width:100%; background:${done ? "#059669" : "#eab308"}; color:${done ? "#fff" : "#000"} !important;" onclick="attemptPerugiusTrial(${t.rank})">${done ? "✓ Пройдено" : myCp < t.reqCp ? "Недостаточно БМ" : "Пройти испытание"}</button></div>`;
  }).join("");
}
function attemptPerugiusTrial(rank) {
  player.perugiusTrials.push(rank);
  if (rank === 1) player.intellect += 150;
  if (rank === 2) player.maxHp += 500;
  if (rank === 3) { player.coins += 5000; player.trait = TRAITS.find(t => t.id === "laplace_factor") || player.trait; }
  log(`🐉 Пройдено испытание #${rank} Перугиуса!`); playSound("win"); updateUI(); renderChaosBreaker();
}

function renderGreyratBranches() {
  const cont = $("greyrat-branches-container"); if (!cont) return;
  cont.innerHTML = GREYRAT_BRANCHES.map(b => {
    const allied = player.greyratAllies.includes(b.id);
    return `<div class="card"><b>${b.name}</b> <span class="badge-mythic">${allied ? "Союз ✓" : b.region}</span>
      <div style="font-size:11px; color:var(--muted); margin:4px 0;">${b.leader} • ${b.desc}</div>
      <button ${allied ? "disabled" : ""} style="width:100%; background:${allied ? "#059669" : "#b91c1c"};" onclick="negotiateGreyratBranch('${b.id}')">${allied ? "Пакт заключён" : "Заключить союз (⚡ 1 сила)"}</button></div>`;
  }).join("");
}
function negotiateGreyratBranch(id) {
  if (player.ap < 1) return showActionModal("Усталость", "Нужно ⚡ 1 сила!", "💤");
  player.ap -= 1;
  if (player.asuraInfluence >= 30 || player.swordGodExp >= 80 || calcCombatPower(player) > 10000) {
    player.greyratAllies.push(id); player.asuraInfluence += 25; log(`🩸 Заключён союз с ветвью Грейрат (+25 влияния)!`); playSound("win");
  } else showActionModal("Отказ", "Ваш авторитет ещё мал (нужно 30+ влияния или 10,000+ БМ).", "📜");
  updateUI(); renderGreyratBranches();
}

function renderTablets() {
  const cont = $("tablets-container"); if (!cont) return;
  cont.innerHTML = `<div class="card" style="border-color:#38bdf8;"><b style="color:#38bdf8;">📜 Расшифровано: ${player.tabletsDeciphered.length}/5</b></div>` +
    FIRST_WAR_TABLETS.map(t => {
      const done = player.tabletsDeciphered.includes(t.id), ok = !done && player.languages.includes(t.reqLang) && player.currentRegionKey === t.regionKey;
      return `<div class="tablet-card"><div><b>${t.name}</b> ${done ? '<span style="color:var(--green);">✓</span>' : ""}
        <div style="font-size:11px; color:var(--muted);">${t.desc}</div><div style="font-size:10px; color:var(--accent-light);">${LANGUAGES[t.reqLang].name} • ${REGIONS[t.regionKey].name}</div></div>
        <button ${ok ? "" : "disabled"} style="background:${done ? "#059669" : "#0284c7"};" onclick="decipherTablet('${t.id}')">${done ? "Готово" : ok ? "Читать" : "Условия"}</button></div>`;
    }).join("");
}
function decipherTablet(id) {
  player.tabletsDeciphered.push(id); player.intellect += 20; player.maxMana += 30;
  let msg = "Скрижаль расшифрована (+20 Знаний, +30 маны)!";
  if (player.tabletsDeciphered.length === 5) { player.maxMana += 200; player.magicExp += 200; msg += " 🌟 Все 5 скрижалей собраны (+200 к Магии)!"; }
  log(msg); playSound("win"); showActionModal("Скрижаль", msg, "📜"); updateUI(); renderTablets();
}

function renderLanguages() {
  const cont = $("languages-container"); if (!cont) return;
  cont.innerHTML = Object.entries(LANGUAGES).map(([k, l]) => {
    const known = player.languages.includes(k);
    return `<div class="lang-card"><div><b>${l.name}</b> ${known ? '<span style="color:var(--green);">✓</span>' : ""}<div style="font-size:11px; color:var(--muted);">${l.desc}</div></div>
      <button ${known ? "disabled" : ""} style="background:${known ? "#059669" : "#312e81"};" onclick="learnLanguage('${k}')">${known ? "Изучено" : "Учить (60🪙, ⚡1)"}</button></div>`;
  }).join("");
}
function learnLanguage(k) {
  if (player.ap < 1 || player.coins < 60) return showActionModal("Язык", "Нужно 60🪙 и ⚡ 1 сила!", "🗣️");
  player.ap -= 1; player.coins -= 60; player.languages.push(k); player.intellect += 8;
  log(`🗣️ Изучен язык: <b>${LANGUAGES[k].name}</b>!`); playSound("win"); updateUI(); renderLanguages();
}

// =========================================================================
// ОТНОШЕНИЯ, КАНОНИЧЕСКИЕ NPC И ЗНАКОМСТВА
// =========================================================================
function toggleNpcActions(id) { currentOpenedNpcId = currentOpenedNpcId === id ? null : id; renderRelations(); }

function renderRelations() {
  const cont = $("relations-list"); if (!cont) return;
  if (!player.relations.length) { cont.innerHTML = `<div style="color:var(--muted); text-align:center;">Знакомых пока нет.</div>`; return; }
  cont.innerHTML = player.relations.map(npc => {
    const cls = npc.isDead ? "status-dead" : npc.relation < 30 ? "status-enemy" : npc.status === "Супруг/Супруга" ? "status-married" : npc.status === "Пара" ? "status-love" : "status-friend";
    const open = currentOpenedNpcId === npc.id && !npc.isDead;
    const inSquad = player.squad.some(m => m.id === npc.id);
    let actHtml = "";
    if (open) {
      if (npc.isLost) actHtml = `<button class="npc-action-full" style="background:#b45309;" onclick="searchLostFamily('${npc.id}')">🔍 Искать пропавшего (⚡ 1 сила)</button>`;
      else if (player.age < 4) actHtml = `<button onclick="npcInteract('${npc.id}','play')">👶 Поиграть</button><button onclick="npcInteract('${npc.id}','cuddle')">🍼 На ручки</button>`;
      else if (player.age < 10) actHtml = `<button onclick="npcInteract('${npc.id}','story')">📖 Сказка</button><button onclick="npcInteract('${npc.id}','gift')">🎁 Подарок (15🪙)</button><button onclick="npcInteract('${npc.id}','spar')">🪵 Урок меча</button><button onclick="npcInteract('${npc.id}','pocket')">🪙 Попросить монет</button>`;
      else {
        actHtml = `<button onclick="npcInteract('${npc.id}','talk')">💬 Беседа</button><button onclick="npcInteract('${npc.id}','gift')">🎁 Подарок (15🪙)</button>
          <button onclick="npcInteract('${npc.id}','drink')">🍻 Таверна (12🪙)</button><button onclick="npcInteract('${npc.id}','spar')">⚔️ Спарринг</button>
          <button onclick="npcInteract('${npc.id}','loan')">🪙 Занять</button><button class="action-danger" onclick="npcInteract('${npc.id}','insult')">🤬 Оскорбить</button>`;
        if (player.age >= 16 && !inSquad && !npc.isChild) actHtml += `<button class="npc-action-full" style="background:#312e81;" onclick="addToSquad('${npc.id}')">🛡️ В боевой отряд</button>`;
        if (player.age >= 14 && !npc.isFamily && !npc.isChild && npc.status !== "Пара" && npc.status !== "Супруг/Супруга") actHtml += `<button class="action-love npc-action-full" onclick="npcInteract('${npc.id}','confess')">❤️ Признаться в чувствах</button>`;
        if (player.age >= 16 && npc.status === "Пара" && !player.spouse) actHtml += `<button class="action-married npc-action-full" onclick="npcInteract('${npc.id}','marry')">💍 Пожениться</button>`;
        if (npc.status === "Супруг/Супруга") actHtml += `<button class="action-married npc-action-full" ${player.pregnancy ? "disabled" : ""} onclick="npcInteract('${npc.id}','child')">${player.pregnancy ? "⏳ Ожидание малыша" : "👶 Зачать ребенка"}</button>`;
      }
    }
    const badges = `${npc.isCanon ? '<span class="badge-canon">Канон ⭐</span> ' : ""}${npc.isChild ? '<span style="color:#fbbf24;">(Наследник)</span> ' : ""}${npc.isLost ? '<span class="badge-mythic">Пропал ⚡</span> ' : ""}${inSquad ? '<span class="badge-rare">Отряд 🛡️</span>' : ""}`;
    return `<div class="relation-card"><div class="rel-header" onclick="${npc.isDead ? "" : `toggleNpcActions('${npc.id}')`}" style="cursor:${npc.isDead ? "default" : "pointer"};">
      <div><div class="rel-name">${npc.name} ${badges}</div><div class="rel-role">${npc.role || npc.race} • ${npc.age} л. • БМ ${(npc.cp || 500).toLocaleString()}</div></div>
      <div style="text-align:right;"><div style="font-size:12px; font-weight:700;"><span class="${cls}">${npc.status}</span> ${npc.isDead ? "" : `(${npc.relation}%)`}</div></div></div>
      ${!npc.isDead ? `<div class="bar-bg"><div class="bar-fill bar-relation" style="width:${npc.relation}%; background:${npc.relation < 30 ? "var(--hp)" : "var(--green)"};"></div></div>` : ""}
      ${actHtml ? `<div class="npc-inline-actions">${actHtml}</div>` : ""}</div>`;
  }).join("");
}

function npcInteract(id, act) {
  const npc = player.relations.find(r => r.id === id); if (!npc) return;
  const beastBoost = (npc.race === "Зверочеловек" && player.languages.includes("beast")) ? 1.25 : 1;
  const gainRel = (v) => { npc.relation = Math.min(100, npc.relation + Math.round(v * beastBoost)); };
  let msg = "";
  if (act === "play" || act === "cuddle") { gainRel(11); if (act === "cuddle") player.hp = Math.min(player.maxHp, player.hp + 10); msg = `Тёплое общение с ${npc.name}!`; playSound("win"); }
  else if (act === "story") { gainRel(8); player.intellect += 2; msg = `${npc.name} рассказал(а) сказку (+2 Знаний)!`; playSound("win"); }
  else if (act === "pocket") { if (npc.relation >= 70) { const g = Math.floor(Math.random() * 5) + 2; player.coins += g; msg = `${npc.name} дал(а) на сладости (+${g}🪙)!`; playSound("coin"); } else msg = `${npc.name} отказал(а).`; }
  else if (act === "talk") { gainRel(8); if (npc.relation >= 60 && npc.status === "Знакомый") npc.status = "Друг"; msg = `Душевная беседа с ${npc.name}.`; playSound("click"); }
  else if (act === "gift") { if (player.coins < 15) return showActionModal("Золото", "Нужно 15🪙!", "🪙"); player.coins -= 15; gainRel(20); msg = `Подарок порадовал ${npc.name} (+20%)!`; playSound("coin"); }
  else if (act === "drink") { if (player.coins < 12) return showActionModal("Золото", "Нужно 12🪙!", "🍻"); player.coins -= 12; gainRel(14); msg = `Отличный вечер в таверне с ${npc.name}!`; playSound("coin"); }
  else if (act === "spar") { player.swordGodExp += 10; npc.cp += 150; msg = `Спарринг с ${npc.name} (+10 Мечу)!`; playSound("sword"); }
  else if (act === "loan") { if (npc.relation >= 75) { const g = Math.floor(Math.random() * 40) + 20; player.coins += g; npc.relation -= 5; msg = `${npc.name} одолжил(а) +${g}🪙.`; playSound("coin"); } else msg = `Мало доверия (нужно 75%+).`; }
  else if (act === "insult") { npc.relation = Math.max(0, npc.relation - 30); if (npc.relation <= 25) npc.status = "Заклятый враг"; msg = `Вы оскорбили ${npc.name}!`; playSound("click"); }
  else if (act === "confess") { if (npc.relation >= 75) { npc.status = "Пара"; msg = `💖 ${npc.name} ответил(а) взаимностью!`; playSound("win"); } else { npc.relation = Math.max(0, npc.relation - 10); msg = `💔 ${npc.name}: "Останемся друзьями..."`; } }
  else if (act === "marry") { if (npc.relation >= 88) { npc.status = "Супруг/Супруга"; player.spouse = npc; msg = `💍 Вы и ${npc.name} поженились!`; playSound("win"); } else msg = `Укрепите отношения до 88%+!`; }
  else if (act === "child") { player.pregnancy = { partnerName: npc.name }; msg = `👶 Вы с ${npc.name} ждёте ребёнка!`; playSound("win"); }
  log(msg); showActionModal("Отношения", msg, "👥"); updateUI(); renderRelations();
}

function searchLostFamily(id) {
  if (player.ap < 1) return showActionModal("Усталость", "Нужно ⚡ 1 сила!", "💤");
  player.ap -= 1;
  const npc = player.relations.find(r => r.id === id);
  if (npc && Math.random() < 0.6) { npc.isLost = false; log(`🎉 Вы нашли <b>${npc.name}</b>!`); playSound("win"); showActionModal("Воссоединение!", `Вы нашли <b>${npc.name}</b>!`, "🎉"); }
  else showActionModal("Поиски", "Пока следов нет, ищите дальше!", "🔍");
  updateUI(); renderRelations();
}

function trySpawnCanonNpc(isSearch = false) {
  const pool = CANON_NPCS.filter(c => c.region === player.currentRegionKey && player.age >= c.minAge && player.age <= c.maxAge && !player.relations.some(r => r.id === c.id));
  if (!pool.length) return null;
  const cand = pool[Math.floor(Math.random() * pool.length)];
  if (Math.random() < (isSearch ? cand.baseChance * 1.6 : cand.baseChance)) {
    const npc = { ...cand, age: player.age + (cand.id === "roxy" || cand.id === "ghislaine" || cand.id === "ruijerd" ? 18 : 0), relation: 55, status: "Знакомый", isCanon: true, isLost: false, isDead: false };
    player.relations.push(npc);
    return npc;
  }
  return null;
}

function meetStranger() {
  const canon = trySpawnCanonNpc(true);
  if (canon) {
    const msg = `⭐ <b>КАНОНИЧЕСКАЯ ВСТРЕЧА!</b> Вы познакомились с <b>${canon.name}</b> (${canon.role})!`;
    log(msg); playSound("win"); showActionModal("Легендарная встреча!", msg, "⭐");
    renderRelations(); updateUI(); return;
  }
  const isM = Math.random() > 0.5, list = SYLLABLES[isM ? "male" : "female"];
  const classes = ["Крестьянин", "Наемник", "Купец", "Рыцарь", "Магистр", "Аристократ"];
  const cls = classes[Math.floor(Math.random() * classes.length)], cp = Math.floor(Math.random() * 2500) + 300;
  const rKeys = Object.keys(RACES);
  const npc = {
    id: "npc_" + Date.now(), name: `${list[Math.floor(Math.random() * list.length)]} ${SYLLABLES.surnames[Math.floor(Math.random() * SYLLABLES.surnames.length)]}`,
    gender: isM ? "male" : "female", race: RACES[rKeys[Math.floor(Math.random() * rKeys.length)]].name,
    age: Math.max(16, player.age + Math.floor(Math.random() * 8) - 4), role: cls, cp,
    relation: Math.floor(Math.random() * 25) + 35, status: "Знакомый", isDead: false
  };
  player.relations.push(npc);
  const msg = `Вы встретили <b>${npc.name}</b> (${npc.race}, ${npc.role}, БМ ${cp.toLocaleString()}).`;
  log(msg); playSound("click"); showActionModal("Знакомство", msg, "👥"); renderRelations(); updateUI();
}

// =========================================================================
// ТЕЧЕНИЕ ГОДА (AGE UP)
// =========================================================================
function ageUp() {
  player.age++; worldState.currentWorldYear++;
  player.maxAp = getMaxAP(player.age); player.ap = player.maxAp; player.mana = player.maxMana;

  const seatObj = ESTATES.find(e => e.id === player.familySeat);
  const regen = (seatObj ? seatObj.hpRegen : 5) + (player.trait.id === "miko_healing" ? 25 : 0);
  player.hp = Math.min(player.maxHp, player.hp + regen);

  player.relations.forEach(npc => {
    if (!npc.isDead) {
      npc.age = (npc.age || 20) + 1;
      if (npc.race === "Человек" && npc.age > 68 && Math.random() < 0.12) {
        npc.isDead = true; npc.status = "Покойный(ая)";
        log(`🕯️ ${npc.name} скончался(ась) в возрасте ${npc.age} лет.`);
      }
    }
  });

  generateYearlyGuildQuests();

  if (player.estates.length) {
    const inc = player.estates.reduce((s, id) => s + (ESTATES.find(e => e.id === id)?.income || 0), 0);
    player.coins += inc; log(`💰 Доход от имений: +${inc}🪙.`);
  }
  if (player.currentJob) {
    const sal = getJobDataById(player.currentJob)?.ranks[player.jobRankIndex]?.salary || 0;
    if (sal) { player.coins += sal; log(`💼 Жалование: +${sal}🪙.`); }
  }
  if (player.currentUndergroundJob) {
    const ur = UNDERGROUND_JOBS[player.currentRegionKey]?.ranks[player.undergroundRankIndex];
    if (ur) {
      if (Math.random() < ur.risk) {
        const fine = Math.min(player.coins, ur.salary * 2);
        player.coins -= fine; player.hp = Math.max(10, player.hp - 25);
        log(`🚨 <b>ОБЛАВА!</b> Откуп: -${fine}🪙, -25 HP.`); playSound("death");
      } else { player.coins += ur.salary; log(`🗡️ Доля подполья: +${ur.salary}🪙.`); }
    }
  }
  if (player.castleUpgrades.includes("alchemy_lab")) { player.potionsCount += 2; log(`🧪 Оранжерея сварила +2 зелья.`); }

  if (player.pregnancy) {
    const isM = Math.random() > 0.5, list = SYLLABLES[isM ? "male" : "female"];
    const child = {
      id: "child_" + Date.now(), name: `${list[Math.floor(Math.random() * list.length)]} ${player.surname}`,
      gender: isM ? "male" : "female", age: 0, birthYear: worldState.currentWorldYear,
      cp: Math.round(500 * (Math.random() > 0.85 ? 1.35 : 1.1)), role: "Наследник рода",
      relation: 100, status: "Семья", isFamily: true, isChild: true, isDead: false
    };
    player.children.push(child); player.relations.push(child);
    if (!player.appointedHeirId) player.appointedHeirId = child.id;
    log(`🎉 Родился ребёнок — <b>${child.name}</b>!`); playSound("win"); player.pregnancy = null;
  }

  if (worldState.currentWorldYear === CALAMITY_YEAR && !worldState.calamityOccurred) {
    performStoryActivity("s1_calamity");
    return;
  }

  const canon = trySpawnCanonNpc(false);
  if (canon) log(`⭐ На пути вам повстречался канонический герой: <b>${canon.name}</b>!`);

  if (player.currentPowersSeat && Math.random() < 0.14) {
    const seat = player.currentPowersSeat, myCp = calcCombatPower(player), chCp = Math.floor(myCp * (0.8 + Math.random() * 0.4));
    triggerRandomEvent({
      icon: "⚔️", title: `Вызов Владыке #${seat} Семи Сил!`,
      desc: `Претендент (БМ ${chCp.toLocaleString()}) требует ваш трон на Монументе!`,
      choices: [
        { text: "Защитить титул в бою!", action: (p) => {
          if (myCp >= chCp) { p.swordGodExp += 40; p.squadFame += 50; return "Вы разгромили претендента и защитили титул (+40 Мечу, +50 Славы)!"; }
          vacatePowerSeatToWorld(p, "уступил трон в дуэли"); p.currentPowersSeat = null; p.hp = Math.max(15, p.hp - 50);
          return "Вы проиграли дуэль и потеряли место в Семи Силах (-50 HP)!";
        }},
        { text: "Уступить титул без боя", action: (p) => { vacatePowerSeatToWorld(p, "добровольно сложил полномочия"); p.currentPowersSeat = null; return "Вы уступили ранг претенденту."; } }
      ]
    });
    return;
  }

  if (player.age > player.maxAge - 15 && player.trait.id !== "god_mode") {
    const decay = Math.floor(Math.random() * 10) + 5;
    player.hp -= decay; log(`Старость даёт о себе знать (-${decay} HP).`);
  }
  if (player.hp <= 0 || player.age >= player.maxAge) {
    handleDeath(player.hp <= 0 ? "Смерть от ран и истощения сил" : "Мирная кончина от старости");
    return;
  }

  // Сны Хитогами чаще приходят на его ветке или при нейтралитете
  const evPool = RANDOM_EVENTS.filter(e => {
    if (player.age < e.minAge) return false;
    if (e.id === "hitogami_dream_tempt" && player.dynastyFaction === "orsted") return false;
    const ch = (e.id === "hitogami_dream_tempt" && player.dynastyFaction === "hitogami") ? 0.35 : e.chance;
    return Math.random() < ch;
  });
  if (evPool.length && Math.random() < 0.55) {
    triggerRandomEvent(evPool[Math.floor(Math.random() * evPool.length)]);
    return;
  }

  log(player.age <= 3 ? "Безмятежное детство в кругу семьи (+10 HP)." : "Год прошёл в трудах и тренировках.");
  if (player.age <= 3) player.hp = Math.min(player.maxHp, player.hp + 10);
  playSound("year");
  updateUI();
}

function triggerRandomEvent(ev) {
  setText("event-icon", ev.icon || "⚡");
  setText("event-title", ev.title);
  setText("event-desc", ev.desc);
  const cBox = $("event-choices"); if (!cBox) return;
  cBox.innerHTML = "";
  ev.choices.forEach(ch => {
    const btn = document.createElement("button");
    btn.className = "event-choice-btn"; btn.innerText = ch.text;
    btn.onclick = () => {
      const out = ch.action(player);
      if ($("event-modal")) $("event-modal").style.display = "none";
      log(`<b>[Выбор]</b> ${out}`); playSound("click");
      showActionModal("Итог", out, ev.icon || "⚡");
      updateUI();
      if (player.hp <= 0) handleDeath("Пал жертвой роковых событий года");
    };
    cBox.appendChild(btn);
  });
  if ($("event-modal")) $("event-modal").style.display = "flex";
}

// =========================================================================
// СМЕРТЬ, НАСЛЕДОВАНИЕ (ТИТУЛ + РЕЛИКВИЯ + СЕМЬЯ), ПЕРЕРОЖДЕНИЕ И СБРОС
// =========================================================================
function handleDeath(reason) {
  playSound("death");
  worldState.dynastyHistory.push({
    gen: player.generation, name: player.name, gender: player.gender, race: player.race,
    peakCp: calcCombatPower(player), maxAge: player.age, deathReason: reason, powersSeat: player.currentPowersSeat
  });

  setText("death-reason", `${reason} в возрасте ${player.age} лет.`);
  if ($("death-summary")) $("death-summary").innerHTML = `
    <div>🎖️ <b>${player.name}</b> (${player.race}) • Прожито: <b>${player.age} л.</b></div>
    <div>⚡ Пиковая БМ: <b>${calcCombatPower(player).toLocaleString()}</b> • Золото: <b>${player.coins.toLocaleString()}🪙</b></div>
    ${player.currentPowersSeat ? `<div style="color:var(--gold);">🏆 Титул #${player.currentPowersSeat} Семи Сил (наследуется преемником!)</div>` : ""}`;

  const hList = $("heirs-list"), hBlock = $("heir-selection-block");
  const children = player.children.filter(c => !c.isDead);
  if (hList && hBlock) {
    if (children.length) {
      hBlock.style.display = "block";
      hList.innerHTML = children.map(c => {
        const age = Math.max(1, worldState.currentWorldYear - (c.birthYear || worldState.currentWorldYear - 20));
        const app = player.appointedHeirId === c.id;
        return `<div class="shop-item"><div><b>${c.name}</b> ${app ? '<span class="badge-legendary">Завещание 👑</span>' : ""}
          <div style="font-size:11px; color:var(--muted);">${c.gender === "male" ? "Сын" : "Дочь"} • ${age} л.</div></div>
          <button style="background:#10b981;" onclick="continueAsHeir('${c.id}', ${age})">Играть 👑</button></div>`;
      }).join("");
    } else {
      hBlock.style.display = "none";
      if (player.currentPowersSeat) vacatePowerSeatToWorld(player, "умер без наследников");
    }
  }
  saveGame();
  if ($("death-overlay")) $("death-overlay").style.display = "flex";
}

function continueAsHeir(childId, realAge) {
  const prev = player;
  const child = prev.children.find(c => c.id === childId); if (!child) return;
  dynastyGeneration++;

  const isApp = prev.appointedHeirId === childId;
  const inheritedCoins = isApp ? prev.coins : Math.floor(prev.coins * 0.7);
  const raceObj = Object.values(RACES).find(r => r.name === prev.race) || RACES.human;
  const hasYard = prev.castleUpgrades.includes("training_yard"), hasSharia = prev.estates.includes("sharia_castle"), hasPalace = prev.estates.includes("asura_palace");

  const originMock = {
    name: `Династия ${prev.surname}`,
    manaBonus: Math.floor(prev.maxMana * 0.2) + (hasSharia ? 15 : 0),
    swordGod: Math.floor(prev.swordGodExp * 0.25) + (hasYard ? 25 : 0) + (hasPalace ? 30 : 0),
    waterGod: hasPalace ? 30 : 0, northGod: hasPalace ? 30 : 0,
    coins: inheritedCoins, int: 12,
    log: `Вы продолжили род ${prev.surname}. ${isApp ? "Получено 100% казны!" : "Получено 70% казны."}`
  };

  // Реальные семейные связи (покойный предок + супруг + братья/сёстры)
  const familyRels = [{ id: "prev_parent", name: prev.name, gender: prev.gender, age: prev.age, role: "Предок-правитель", cp: calcCombatPower(prev), relation: 100, status: "Покойный(ая)", isFamily: true, isDead: true }];
  if (prev.spouse && !prev.spouse.isDead) familyRels.push({ ...prev.spouse, role: "Родитель", status: "Семья", isFamily: true });
  prev.children.filter(c => c.id !== childId && !c.isDead).forEach(sib => {
    familyRels.push({ ...sib, age: Math.max(1, worldState.currentWorldYear - (sib.birthYear || worldState.currentWorldYear - 15)), role: sib.gender === "male" ? "Брат" : "Сестра", isChild: false });
  });

  if ($("death-overlay")) $("death-overlay").style.display = "none";
  initCharacter(child.name.split(" ")[0], prev.surname, child.gender, raceObj, prev.currentRegionKey, originMock, prev.trait, prev.familyStatus, realAge, familyRels);

  // Наследуемые поля, включая титул Семи Сил и Фамильную Реликвию!
  player.estates = [...prev.estates];
  player.familySeat = prev.familySeat;
  player.castleUpgrades = [...prev.castleUpgrades];
  player.nobilityTitle = prev.nobilityTitle;
  player.asuraFaction = prev.asuraFaction;
  player.languages = [...prev.languages];
  player.dynastyFaction = prev.dynastyFaction;
  player.factionProgress = prev.factionProgress;
  player.hitogamiTrust = prev.hitogamiTrust;
  player.tabletsDeciphered = [...prev.tabletsDeciphered];
  player.perugiusTrials = [...prev.perugiusTrials];
  player.greyratAllies = [...prev.greyratAllies];
  player.discoveredSevenPowers = [...prev.discoveredSevenPowers];

  if (prev.currentPowersSeat) {
    player.currentPowersSeat = prev.currentPowersSeat;
    const pow = worldState.sevenPowers.find(p => p.rank === prev.currentPowersSeat);
    if (pow) { pow.name = player.name; pow.holderType = "player"; pow.cp = calcCombatPower(player); }
    log(`🏆 По праву крови вы унаследовали титул <b>#${player.currentPowersSeat} Семи Великих Сил</b>!`);
  }

  if (prev.heirloomSlot && prev.equipment[prev.heirloomSlot]) {
    const relic = { ...prev.equipment[prev.heirloomSlot] };
    player.equipment[prev.heirloomSlot] = relic;
    if (relic.hp) { player.maxHp += relic.hp; player.hp += relic.hp; }
    log(`✨ Вы унаследовали Фамильную Реликвию: <b>${relic.name}</b>!`);
  }

  updateUI();
}

function reincarnateNewSoul() {
  if (player?.currentPowersSeat) vacatePowerSeatToWorld(player, "переродился в новой душе");
  const karma = addReincarnationKarma();
  if ($("death-overlay")) $("death-overlay").style.display = "none";
  dynastyGeneration = 1; player = null;
  saveGame();
  showActionModal("Колесо Сансары", `Время мира продолжается (сейчас <b>${worldState.currentWorldYear} г. К.Д.</b>)! Накоплена Карма ур. ${karma}.`, "🔄");
  showCreation();
}

function askNewSoul() {
  askConfirm("Новая душа (время идёт дальше)", `Текущий герой оставит мир в <b>${worldState.currentWorldYear} г. К.Д.</b>, а вы воплотитесь новым персонажем с +1 Кармой. Продолжить?`, reincarnateNewSoul);
}

function askFullWorldReset() {
  askConfirm("Сброс мира к 407 году", "Вы начнёте самую первую жизнь заново в <b>407 г. К.Д.</b>! Все 7 Великих Сил вернутся на свои места, история мира очистится. Продолжить?", fullWorldReset);
}

function fullWorldReset() {
  worldState = { currentWorldYear: START_YEAR, calamityOccurred: false, sevenPowers: cloneDefaultPowers(), chronicles: [], dynastyHistory: [] };
  dynastyGeneration = 1; player = null;
  try { localStorage.removeItem("bit_tensei_save"); } catch {}
  if ($("death-overlay")) $("death-overlay").style.display = "none";
  showActionModal("Чистый лист", "Мир возвращён к 407 г. К.Д. Все Семь Великих Сил вновь на своих тронах!", "🌅");
  showCreation();
}

// =========================================================================
// СОХРАНЕНИЯ (LOCALSTORAGE + TELEGRAM CLOUD + ЭКСПОРТ/ИМПОРТ КОДОМ)
// =========================================================================
function generateYearlyGuildQuests() {
  const pIdx = ADVENTURER_RANKS.indexOf(player.guildRank);
  const pool = ALL_GUILD_QUESTS.filter(q => ADVENTURER_RANKS.indexOf(q.rank) <= pIdx + 1);
  player.guildQuestsThisYear = [...pool].sort(() => 0.5 - Math.random()).slice(0, 5);
}

function buildSavePayload() {
  return JSON.stringify({ player, dynastyGeneration, worldState, logsHtml: $("logs")?.innerHTML || "" });
}

function saveGame() {
  try {
    const json = buildSavePayload();
    localStorage.setItem("bit_tensei_save", json);
    if (tg?.CloudStorage && json.length < 4000) tg.CloudStorage.setItem("bit_tensei_save", json);
  } catch (e) {}
}

function applyLoadedData(data) {
  if (!data?.worldState) return false;
  worldState = data.worldState;
  dynastyGeneration = data.dynastyGeneration || 1;
  player = data.player || null;
  if ($("logs") && data.logsHtml) $("logs").innerHTML = data.logsHtml;
  if (player) {
    if ($("creation-overlay")) $("creation-overlay").style.display = "none";
    renderUI();
    return true;
  }
  return false;
}

function loadGame() {
  try {
    const raw = localStorage.getItem("bit_tensei_save");
    if (!raw) return false;
    return applyLoadedData(JSON.parse(raw));
  } catch { return false; }
}

function openSaveModal() {
  try {
    const b64 = btoa(unescape(encodeURIComponent(buildSavePayload())));
    if ($("save-export-text")) $("save-export-text").value = b64;
  } catch {}
  if ($("save-modal")) $("save-modal").style.display = "flex";
}
function closeSaveModal() { if ($("save-modal")) $("save-modal").style.display = "none"; }

function copySaveCode() {
  const txt = $("save-export-text")?.value;
  if (!txt) return;
  navigator.clipboard?.writeText(txt).then(() => showActionModal("Скопировано", "Код сохранения скопирован в буфер!", "📋"));
}

function importSaveCode() {
  try {
    const code = $("save-import-text")?.value.trim();
    if (!code) return;
    const json = decodeURIComponent(escape(atob(code)));
    if (applyLoadedData(JSON.parse(json))) {
      saveGame(); closeSaveModal();
      showActionModal("Загружено!", "Прогресс мира успешно восстановлен!", "💾");
    }
  } catch { showActionModal("Ошибка", "Неверный код сохранения!", "❌"); }
}

if (!loadGame()) showCreation();
