// ==========================================
// BIT TENSEI — ПРОЦЕДУРНЫЙ МУЗЫКАЛЬНЫЙ ДВИЖОК
// (Web Audio API — без внешних файлов и 404)
// ==========================================

const GameMusic = (function() {
  let ctx = null;
  let isEnabled = true;
  let currentMode = "peaceful"; // "peaceful" | "battle" | "silent"
  let timerId = null;
  let masterGain = null;
  let step = 0;

  // Минорный лад Шестиликого Мира (D-минор / Ре-минор)
  const peacefulNotes = [
    146.83, 220.00, 261.63, 293.66, 349.23, 440.00, 523.25, 587.33,
    174.61, 220.00, 261.63, 349.23, 392.00, 440.00, 523.25, 659.25,
    130.81, 196.00, 261.63, 329.63, 392.00, 523.25, 392.00, 329.63,
    116.54, 174.61, 233.08, 293.66, 349.23, 466.16, 349.23, 293.66
  ];

  // Боевой тревожный лад с низкими басами
  const battleNotes = [
    73.42, 110.00, 146.83, 110.00, 73.42, 146.83, 174.61, 146.83,
    65.41, 98.00, 130.81, 98.00, 65.41, 130.81, 155.56, 130.81,
    58.27, 87.31, 116.54, 87.31, 58.27, 116.54, 130.81, 116.54,
    55.00, 82.41, 110.00, 82.41, 73.42, 110.00, 146.83, 220.00
  ];

  function getContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.12, ctx.currentTime);
        masterGain.connect(ctx.destination);
      }
    }
    if (ctx && ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }

  // Синтез щипковой струны (лютня / арфа)
  function playPluck(freq, duration = 0.8, isBass = false) {
    const audio = getContext();
    if (!audio || !isEnabled || currentMode === "silent") return;

    const now = audio.currentTime;

    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const filter = audio.createBiquadFilter();

    osc.type = isBass ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(freq, now);

    // Фильтр для теплоты звучания
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(isBass ? 450 : 1800, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + duration);

    // Затухание струны
    gain.gain.setValueAtTime(isBass ? 0.22 : 0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Боевой ударный пульс
  function playDrum() {
    const audio = getContext();
    if (!audio || !isEnabled) return;
    const now = audio.currentTime;

    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  function tick() {
    if (!isEnabled || currentMode === "silent") return;

    if (currentMode === "peaceful") {
      const note = peacefulNotes[step % peacefulNotes.length];
      const isBass = (step % 4 === 0);
      playPluck(note, isBass ? 1.4 : 0.75, isBass);

      // Вторая гармоническая нота каждые 2 шага
      if (step % 2 === 0) {
        const harmony = note * 1.5;
        playPluck(harmony, 0.6, false);
      }
      step++;
    } else if (currentMode === "battle") {
      const bNote = battleNotes[step % battleNotes.length];
      playPluck(bNote, 0.45, true);

      if (step % 2 === 0) {
        playDrum();
      }
      if (step % 4 === 0) {
        playPluck(bNote * 2, 0.5, false);
      }
      step++;
    }
  }

  function startLoop() {
    if (timerId) clearInterval(timerId);
    const speed = (currentMode === "battle") ? 240 : 420;
    timerId = setInterval(tick, speed);
  }

  return {
    init: function() {
      // Автостарт при первом касании экрана игроком
      const unlock = () => {
        getContext();
        if (isEnabled && !timerId) {
          startLoop();
        }
        document.removeEventListener("click", unlock);
        document.removeEventListener("touchstart", unlock);
      };
      document.addEventListener("click", unlock, { once: true });
      document.addEventListener("touchstart", unlock, { once: true });
    },

    setMode: function(mode) {
      if (currentMode === mode) return;
      currentMode = mode;
      step = 0;
      if (isEnabled && currentMode !== "silent") {
        startLoop();
      } else if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    },

    toggle: function() {
      isEnabled = !isEnabled;
      if (!isEnabled) {
        if (timerId) { clearInterval(timerId); timerId = null; }
        if (ctx && masterGain) masterGain.gain.setValueAtTime(0, ctx.currentTime);
      } else {
        getContext();
        if (ctx && masterGain) masterGain.gain.setValueAtTime(0.12, ctx.currentTime);
        startLoop();
      }
      return isEnabled;
    },

    isMusicOn: function() {
      return isEnabled;
    }
  };
})();

// Инициализация при загрузке документа
if (typeof window !== "undefined") {
  window.GameMusic = GameMusic;
  GameMusic.init();
}
