// Procedural soundtrack for the shared mythic pet park.
//
// The soundscape is deliberately generated with Web Audio instead of shipping
// a large MP3: it stays original, loops without a seam, and costs almost no
// network data on the entry-level phones used by the school. Browsers still
// require the first playback to happen inside a user gesture; PetGardenView
// handles that unlock and stores the visitor's mute preference.

const EcoMythicAudio = (() => {
  const PREF_KEY = "eco_pet_soundscape_enabled_v1";
  // Web Audio gains multiply. The first experimental mix used a 0.115 master
  // over 0.012-0.026 voices, which put the real phone output near -55 dB and
  // made it effectively inaudible. These levels target a gentle but clearly
  // audible game ambience; a compressor below keeps combined peaks safe.
  const MASTER_LEVEL = 0.42;
  const MUSIC_BUS_LEVEL = 0.88;
  const ACCENT_BUS_LEVEL = 0.95;
  const STEP_SECONDS = 0.75;
  const STEPS_PER_LOOP = 64; // 48-second harmonic cycle
  const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0];
  const MELODY = [
    0, null, 2, null, 4, 2, null, 1,
    null, 2, 3, null, 2, null, 0, null,
    1, null, 3, 4, null, 3, 1, null,
    0, null, 2, null, 1, null, 4, null,
    2, null, 4, null, 3, 1, null, 0,
    null, 1, 2, null, 4, null, 3, null,
    4, null, 3, 1, null, 2, 0, null,
    1, null, 3, null, 2, null, 0, null,
  ];
  const CHORDS = [
    [65.41, 98.0, 130.81],
    [73.42, 110.0, 146.83],
    [55.0, 82.41, 110.0],
    [98.0, 146.83, 196.0],
  ];
  const SPECIES_MOTIFS = {
    qilin:      { root: 392.00, notes: [0, 4, 7],       type: "bell" },
    phoenix:    { root: 440.00, notes: [0, 7, 12, 16],  type: "flare" },
    ninetail:   { root: 369.99, notes: [0, 3, 7, 10],   type: "shimmer" },
    yinglong:   { root: 293.66, notes: [0, 7, 5, 12],   type: "wind" },
    baize:      { root: 329.63, notes: [0, 5, 9],       type: "bell" },
    lingui:     { root: 261.63, notes: [0, 2, 7],       type: "pluck" },
    stardeer:   { root: 523.25, notes: [0, 4, 9, 12],   type: "shimmer" },
    cloudpard:  { root: 349.23, notes: [0, 7, 3],       type: "wind" },
    seakirin:   { root: 293.66, notes: [0, 5, 12, 7],   type: "water" },
    pixiu:      { root: 349.23, notes: [0, 4, 7, 11],   type: "bell" },
    thunder:    { root: 415.30, notes: [0, 12, 7],      type: "flare" },
    bamboo:     { root: 293.66, notes: [0, 2, 5, 9],    type: "pluck" },
    zhuque:     { root: 466.16, notes: [0, 7, 14, 12],  type: "flare" },
    xuanwu:     { root: 220.00, notes: [0, 5, 2, 7],    type: "water" },
    baihu:      { root: 329.63, notes: [0, 7, 10],      type: "pluck" },
    qinglong:   { root: 277.18, notes: [0, 5, 9, 14],   type: "wind" },
    griffin:    { root: 392.00, notes: [0, 7, 11, 14],  type: "flare" },
    snowferret: { root: 493.88, notes: [0, 3, 7, 12],   type: "shimmer" },
    firemouse:  { root: 523.25, notes: [0, 4, 7, 12],   type: "pluck" },
  };

  function readPreference() {
    try {
      const saved = localStorage.getItem(PREF_KEY);
      return saved === null ? true : saved !== "0";
    } catch (e) {
      return true;
    }
  }

  function writePreference(enabled) {
    try { localStorage.setItem(PREF_KEY, enabled ? "1" : "0"); } catch (e) {}
  }

  function create(options = {}) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    const onRunningChange = typeof options.onRunningChange === "function" ? options.onRunningChange : null;

    let context = null;
    let master = null;
    let musicBus = null;
    let accentBus = null;
    let echoInput = null;
    let schedulerId = null;
    let nextStepTime = 0;
    let step = 0;
    let muted = true;
    let destroyed = false;
    let welcomePlayed = false;

    function notifyRunning() {
      if (!onRunningChange) return;
      try { onRunningChange(!!context && context.state === "running" && !muted); } catch (e) {}
    }

    function startScheduler() {
      if (schedulerId || destroyed) return;
      schedulerId = window.setInterval(runScheduler, 240);
    }

    function stopScheduler() {
      if (schedulerId) window.clearInterval(schedulerId);
      schedulerId = null;
    }

    function safeParam(param, value, time, glide = 0.08) {
      if (!param || !context || context.state === "closed") return;
      const now = Math.max(context.currentTime, time || context.currentTime);
      param.cancelScheduledValues(now);
      param.setTargetAtTime(value, now, glide);
    }

    function connectWithEcho(node, dryBus, send = 0.16) {
      node.connect(dryBus);
      if (!echoInput || send <= 0) return;
      const sendGain = context.createGain();
      sendGain.gain.value = send;
      node.connect(sendGain);
      sendGain.connect(echoInput);
    }

    function makeNoiseBuffer(seconds = 3) {
      const length = Math.floor(context.sampleRate * seconds);
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      let smoothed = 0;
      for (let i = 0; i < length; i += 1) {
        smoothed = smoothed * 0.985 + (Math.random() * 2 - 1) * 0.055;
        data[i] = smoothed * 0.48;
      }
      return buffer;
    }

    function setupWind() {
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();
      const filterLfo = context.createOscillator();
      const filterLfoGain = context.createGain();

      source.buffer = makeNoiseBuffer(3.2);
      source.loop = true;
      filter.type = "bandpass";
      filter.frequency.value = 620;
      filter.Q.value = 0.32;
      gain.gain.value = 0.034;
      lfo.frequency.value = 0.07;
      lfoGain.gain.value = 0.006;
      filterLfo.frequency.value = 0.031;
      filterLfoGain.gain.value = 210;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(musicBus);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      filterLfo.connect(filterLfoGain);
      filterLfoGain.connect(filter.frequency);
      source.start();
      lfo.start();
      filterLfo.start();
    }

    function schedulePad(frequencies, time) {
      frequencies.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = index === 1 ? "triangle" : "sine";
        oscillator.frequency.value = frequency;
        oscillator.detune.value = index === 1 ? 3 : -2;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(index === 1 ? 0.019 : 0.024, time + 2.2);
        gain.gain.setValueAtTime(index === 1 ? 0.019 : 0.024, time + 9.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 13.5);
        oscillator.connect(gain);
        connectWithEcho(gain, musicBus, 0.09);
        oscillator.start(time);
        oscillator.stop(time + 13.7);
      });
    }

    function schedulePluck(frequency, time, duration = 1.25, level = 0.06, bus = musicBus, send = 0.2) {
      const oscillator = context.createOscillator();
      const overtone = context.createOscillator();
      const overtoneGain = context.createGain();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.value = frequency;
      overtone.type = "sine";
      overtone.frequency.value = frequency * 2.01;
      overtoneGain.gain.value = 0.2;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2100, time);
      filter.frequency.exponentialRampToValueAtTime(680, time + duration);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(level, time + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      oscillator.connect(filter);
      overtone.connect(overtoneGain);
      overtoneGain.connect(filter);
      filter.connect(gain);
      connectWithEcho(gain, bus, send);
      oscillator.start(time);
      overtone.start(time);
      oscillator.stop(time + duration + 0.05);
      overtone.stop(time + duration + 0.05);
    }

    function scheduleBell(frequency, time, level = 0.05, bus = musicBus) {
      [1, 2.01, 3.98].forEach((ratio, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const duration = 2.4 - index * 0.34;
        oscillator.type = "sine";
        oscillator.frequency.value = frequency * ratio;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(level / (index + 1), time + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        oscillator.connect(gain);
        connectWithEcho(gain, bus, 0.28);
        oscillator.start(time);
        oscillator.stop(time + duration + 0.05);
      });
    }

    function scheduleBreath(frequency, time, duration = 2.1) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency * 0.997, time);
      oscillator.frequency.linearRampToValueAtTime(frequency * 1.004, time + duration);
      filter.type = "lowpass";
      filter.frequency.value = 980;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.032, time + 0.45);
      gain.gain.setValueAtTime(0.032, time + duration * 0.68);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      oscillator.connect(filter);
      filter.connect(gain);
      connectWithEcho(gain, musicBus, 0.24);
      oscillator.start(time);
      oscillator.stop(time + duration + 0.05);
    }

    function scheduleDrum(time) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(92, time);
      oscillator.frequency.exponentialRampToValueAtTime(46, time + 0.55);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.062, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.72);
      oscillator.connect(gain);
      gain.connect(musicBus);
      oscillator.start(time);
      oscillator.stop(time + 0.78);
    }

    function scheduleStep(stepNumber, time) {
      const cycleStep = stepNumber % STEPS_PER_LOOP;
      if (cycleStep % 16 === 0) {
        schedulePad(CHORDS[Math.floor(cycleStep / 16)], time);
        scheduleDrum(time);
      }

      const noteIndex = MELODY[cycleStep];
      if (noteIndex !== null) {
        const octave = cycleStep >= 32 && cycleStep < 48 ? 0.5 : 1;
        schedulePluck(PENTATONIC[noteIndex] * octave, time + 0.035, 1.32, 0.052);
      }

      if ([6, 22, 38, 54].includes(cycleStep)) {
        scheduleBell(PENTATONIC[(cycleStep / 16 | 0) % PENTATONIC.length] * 2, time, 0.026);
      }
      if ([12, 28, 44, 60].includes(cycleStep)) {
        scheduleBreath(PENTATONIC[(cycleStep / 8 | 0) % PENTATONIC.length], time, 2.25);
      }
    }

    function runScheduler() {
      if (!context || context.state !== "running") return;
      const horizon = context.currentTime + 0.65;
      if (nextStepTime < context.currentTime - STEP_SECONDS) nextStepTime = context.currentTime + 0.05;
      while (nextStepTime < horizon) {
        scheduleStep(step, nextStepTime);
        step = (step + 1) % STEPS_PER_LOOP;
        nextStepTime += STEP_SECONDS;
      }
    }

    function initialize() {
      if (context || destroyed) return;
      context = new AudioContextClass();
      master = context.createGain();
      musicBus = context.createGain();
      accentBus = context.createGain();
      const echoDelay = context.createDelay(1.2);
      const echoTone = context.createBiquadFilter();
      const echoFeedback = context.createGain();
      const echoReturn = context.createGain();
      const limiter = context.createDynamicsCompressor();

      master.gain.value = 0.0001;
      musicBus.gain.value = MUSIC_BUS_LEVEL;
      accentBus.gain.value = ACCENT_BUS_LEVEL;
      echoDelay.delayTime.value = 0.375;
      echoTone.type = "lowpass";
      echoTone.frequency.value = 2300;
      echoFeedback.gain.value = 0.22;
      echoReturn.gain.value = 0.48;
      limiter.threshold.value = -16;
      limiter.knee.value = 10;
      limiter.ratio.value = 7;
      limiter.attack.value = 0.006;
      limiter.release.value = 0.24;

      musicBus.connect(master);
      accentBus.connect(master);
      master.connect(limiter);
      limiter.connect(context.destination);

      echoInput = context.createGain();
      echoInput.gain.value = 1;
      echoInput.connect(echoDelay);
      echoDelay.connect(echoTone);
      echoTone.connect(echoReturn);
      echoReturn.connect(master);
      echoTone.connect(echoFeedback);
      echoFeedback.connect(echoDelay);

      setupWind();
      nextStepTime = context.currentTime + 0.08;
      context.onstatechange = notifyRunning;
    }

    async function start() {
      if (destroyed) return false;
      try {
        initialize();
        if (!context) return false;
        // WebKit can report "interrupted" after a phone call, lock-screen, or
        // app switch. Treat every non-running state as resumable and only tell
        // the UI playback succeeded once the context actually runs.
        if (context.state !== "running") await context.resume();
        if (context.state !== "running") {
          notifyRunning();
          return false;
        }
        muted = false;
        nextStepTime = Math.max(nextStepTime, context.currentTime + 0.05);
        runScheduler();
        startScheduler();
        safeParam(master.gain, MASTER_LEVEL, context.currentTime, 0.18);
        if (!welcomePlayed) {
          welcomePlayed = true;
          // An unmistakable two-note jade-bell confirms that mobile audio has
          // actually unlocked before the quieter ambient layers settle in.
          scheduleBell(523.25, context.currentTime + 0.12, 0.11, accentBus);
          scheduleBell(659.25, context.currentTime + 0.38, 0.09, accentBus);
        }
        notifyRunning();
        return true;
      } catch (e) {
        notifyRunning();
        return false;
      }
    }

    function setMuted(shouldMute) {
      muted = !!shouldMute;
      if (!context || context.state === "closed") return;
      if (!muted) {
        start();
        return;
      }
      stopScheduler();
      safeParam(master.gain, 0.0001, context.currentTime, 0.12);
      notifyRunning();
      window.setTimeout(() => {
        if (muted && context && context.state === "running") context.suspend().catch(() => {});
      }, 650);
    }

    function duck(seconds = 3) {
      if (!context || !musicBus || muted || context.state !== "running") return;
      const now = context.currentTime;
      musicBus.gain.cancelScheduledValues(now);
      musicBus.gain.setTargetAtTime(0.34, now, 0.07);
      musicBus.gain.setTargetAtTime(MUSIC_BUS_LEVEL, now + Math.max(0.8, seconds - 0.55), 0.22);
    }

    function playAccent(speciesId, stageIndex = 0) {
      if (!context || !accentBus || muted || context.state !== "running") return;
      const now = context.currentTime + 0.025;
      duck(stageIndex >= 2 ? 3 : 1.6);

      if (stageIndex < 2) {
        scheduleBell(stageIndex === 0 ? 392 : 523.25, now, 0.085, accentBus);
        schedulePluck(stageIndex === 0 ? 293.66 : 659.25, now + 0.24, 0.72, 0.07, accentBus, 0.18);
        return;
      }

      const motif = SPECIES_MOTIFS[speciesId] || SPECIES_MOTIFS.qilin;
      motif.notes.forEach((semitones, index) => {
        const frequency = motif.root * Math.pow(2, semitones / 12);
        const at = now + index * (motif.type === "flare" ? 0.19 : 0.24);
        if (motif.type === "bell" || motif.type === "shimmer") {
          scheduleBell(frequency, at, motif.type === "shimmer" ? 0.06 : 0.075, accentBus);
        } else {
          schedulePluck(frequency, at, motif.type === "water" ? 1.15 : 0.82, 0.075, accentBus, motif.type === "wind" ? 0.34 : 0.2);
        }
      });
    }

    function pauseForVisibility() {
      stopScheduler();
      if (!context || context.state !== "running") return Promise.resolve(false);
      return context.suspend().then(() => {
        notifyRunning();
        return false;
      }).catch(() => false);
    }

    function resumeFromVisibility() {
      return muted ? Promise.resolve(false) : start();
    }

    function destroy() {
      destroyed = true;
      stopScheduler();
      if (context && context.state !== "closed") {
        context.onstatechange = null;
        try {
          master.gain.cancelScheduledValues(context.currentTime);
          master.gain.setTargetAtTime(0.0001, context.currentTime, 0.05);
        } catch (e) {}
        window.setTimeout(() => {
          if (context && context.state !== "closed") context.close().catch(() => {});
        }, 180);
      }
    }

    return {
      start,
      setMuted,
      playAccent,
      pauseForVisibility,
      resumeFromVisibility,
      destroy,
      isRunning: () => !!context && context.state === "running" && !muted,
    };
  }

  return { PREF_KEY, readPreference, writePreference, create };
})();

window.EcoMythicAudio = EcoMythicAudio;
