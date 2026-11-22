/* ═══════════════════════════════════════════════════════════════
   AUDIO — música y efectos generados con WebAudio (sin archivos)
   Cada mundo tiene su propia melodía suave.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const SLW = window.SLW;
  const AU = SLW.Audio = {};

  const MUTE_KEY = 'slw-muted-v1';
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  let ctx = null;
  let master = null, musicBus = null, sfxBus = null, comp = null;
  let muted = false;
  let pendingTrack = null;
  let currentTrack = null;
  let timer = null;
  let nextTime = 0;
  let stepIdx = 0;
  let lastTick = 0;

  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* private mode */ }

  const TRACKS = {
    splash: {
      bpm: 72, root: 65, wave: 'sine', pluck: 'triangle', padWave: 'sine', padGain: 0.045, vol: 0.9,
      chords: [[0, 4, 7, 11], [5, 9, 12, 16], [7, 11, 14, 18], [-3, 0, 4, 7]],
      melody: [12, null, 16, null, 19, null, 16, null, 14, null, 19, null, 23, null, 19, null,
        12, null, 16, null, 19, null, 23, null, 21, null, 19, null, 16, null, 12, null],
      bells: [4, 12, 20, 28], swing: 0.02
    },
    creator: {
      bpm: 86, root: 67, wave: 'sine', pluck: 'triangle', padWave: 'sine', padGain: 0.04, vol: 0.85,
      chords: [[0, 4, 7, 11], [-3, 0, 4, 9], [5, 9, 12, 16], [7, 11, 14, 18]],
      melody: [12, null, null, 16, 14, null, 12, null, 9, null, 12, null, 16, null, 14, null,
        12, null, null, 16, 19, null, 16, null, 14, null, 12, null, 9, null, null, null],
      bells: [6, 14, 22, 30]
    },
    map: {
      bpm: 94, root: 60, wave: 'triangle', pluck: 'triangle', padWave: 'sine', padGain: 0.035, vol: 0.9,
      chords: [[0, 4, 7, 11], [5, 9, 12, 16], [9, 12, 16, 19], [7, 11, 14, 18]],
      melody: [12, null, 16, 19, null, 16, 14, null, 12, 14, null, 16, null, 12, null, null,
        14, null, 17, 21, null, 17, 16, null, 14, 16, null, 19, null, 16, null, null],
      bells: [2, 10, 18, 26]
    },
    meadow: {
      bpm: 92, root: 60, wave: 'triangle', pluck: 'triangle', padWave: 'sine', padGain: 0.04, vol: 0.95,
      chords: [[0, 4, 7, 11], [5, 9, 12, 16], [9, 12, 16, 19], [7, 11, 14, 18]],
      melody: [12, null, 16, null, 14, 12, null, 9, 12, null, 16, 19, null, 16, 14, null,
        12, null, 16, null, 14, 16, 19, null, 21, null, 19, 16, 14, null, 12, null],
      bells: [3, 11, 19, 27]
    },
    hills: {
      bpm: 84, root: 65, wave: 'sine', pluck: 'triangle', padWave: 'sine', padGain: 0.045, vol: 0.9,
      chords: [[0, 4, 7, 11], [-3, 0, 4, 7], [5, 9, 12, 16], [7, 11, 14, 18]],
      melody: [12, null, 14, 16, null, 19, null, 16, 14, null, 12, null, 9, null, null, null,
        12, null, 16, 19, null, 21, null, 19, 16, null, 14, null, 12, null, null, null],
      bells: [5, 13, 21, 29]
    },
    library: {
      bpm: 74, root: 57, wave: 'sine', pluck: 'sine', padWave: 'triangle', padGain: 0.035, vol: 0.9,
      chords: [[0, 3, 7, 10], [-4, 0, 3, 7], [5, 8, 12, 15], [7, 10, 14, 17]],
      melody: [12, null, null, 15, 14, null, 12, null, 10, null, 12, null, 15, null, 19, null,
        17, null, 15, null, 14, null, 12, null, 10, null, 7, null, 10, null, 12, null],
      bells: [2, 9, 16, 24, 30], swing: 0.03
    },
    garden: {
      bpm: 88, root: 62, wave: 'sine', pluck: 'triangle', padWave: 'sine', padGain: 0.04, vol: 0.9,
      chords: [[0, 4, 7, 11], [7, 11, 14, 18], [5, 9, 12, 16], [9, 12, 16, 19]],
      melody: [12, null, 16, 19, null, 23, 21, null, 19, null, 16, null, 14, 16, 19, null,
        16, null, 14, null, 12, null, 9, null, 12, 14, 16, null, 19, null, 16, null],
      bells: [1, 9, 17, 25]
    },
    arena: {
      bpm: 112, root: 50, wave: 'triangle', pluck: 'square', padWave: 'sawtooth', padGain: 0.02, vol: 0.85,
      chords: [[0, 3, 7, 10], [5, 8, 12, 15], [3, 7, 10, 14], [7, 10, 14, 17]],
      melody: [12, null, 15, 12, null, 10, 12, null, 15, null, 18, 15, null, 12, 10, null,
        12, null, 15, 19, null, 17, 15, null, 14, null, 12, null, 10, 12, 14, null],
      bells: [7, 23], drums: true
    },
    sky: {
      bpm: 96, root: 67, wave: 'sine', pluck: 'triangle', padWave: 'sine', padGain: 0.04, vol: 0.9,
      chords: [[0, 4, 7, 11], [5, 9, 12, 16], [7, 11, 14, 18], [9, 12, 16, 19]],
      melody: [19, null, 16, null, 14, null, 12, null, 14, null, 19, null, 23, null, 21, null,
        19, null, 16, null, 14, null, 16, null, 19, null, 21, null, 23, null, 19, null],
      bells: [0, 8, 16, 24]
    },
    jungle: {
      bpm: 90, root: 57, wave: 'triangle', pluck: 'triangle', padWave: 'sine', padGain: 0.035, vol: 0.9,
      chords: [[0, 3, 7, 10], [3, 7, 10, 14], [5, 8, 12, 15], [0, 3, 7, 10]],
      melody: [12, null, 15, 17, null, 15, 12, null, 10, 12, null, 15, null, 12, null, 7,
        12, null, 15, 19, null, 17, 15, null, 14, null, 12, 10, null, 7, null, null],
      bells: [6, 14, 22, 30]
    },
    ruins: {
      bpm: 80, root: 52, wave: 'sine', pluck: 'triangle', padWave: 'triangle', padGain: 0.04, vol: 0.9,
      chords: [[0, 3, 7, 10], [5, 8, 12, 15], [-2, 2, 5, 9], [3, 7, 10, 14]],
      melody: [12, null, null, 15, 12, null, 10, null, 12, null, 15, null, 19, null, 17, null,
        15, null, 12, null, 10, null, 7, null, 10, null, 12, null, 15, null, null, null],
      bells: [4, 12, 20, 28], swing: 0.02
    },
    dream: {
      bpm: 70, root: 60, wave: 'sine', pluck: 'sine', padWave: 'sine', padGain: 0.045, vol: 0.95,
      chords: [[0, 4, 7, 11], [-3, 0, 4, 9], [5, 9, 12, 16], [7, 11, 14, 18]],
      melody: [19, null, null, 16, null, 12, null, null, 14, null, 16, null, 19, null, null, null,
        21, null, 19, null, 16, null, 14, null, 12, null, null, 14, null, 16, null, null],
      bells: [0, 8, 16, 24, 30], swing: 0.03
    },
    ending: {
      bpm: 64, root: 60, wave: 'sine', pluck: 'triangle', padWave: 'sine', padGain: 0.05, vol: 1,
      chords: [[0, 4, 7, 11], [5, 9, 12, 16], [-3, 0, 4, 9], [7, 11, 14, 18]],
      melody: [12, null, null, 16, 19, null, 16, null, 14, null, null, 12, 9, null, null, null,
        12, null, 16, null, 19, null, 23, null, 21, null, 19, null, 16, null, 12, null],
      bells: [2, 10, 18, 26]
    }
  };

  AU.isReady = () => !!ctx;
  AU.getMuted = () => muted;

  AU.init = function () {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch (e) { return null; }
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 22;
    comp.ratio.value = 3;
    comp.attack.value = 0.004;
    comp.release.value = 0.28;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.62;
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.9;
    musicBus.connect(master);
    sfxBus.connect(master);
    master.connect(comp);
    comp.connect(ctx.destination);
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    if (pendingTrack) {
      const name = pendingTrack;
      pendingTrack = null;
      AU.playMusic(name);
    }
    return ctx;
  };

  AU.setMuted = function (m) {
    muted = !!m;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* ignore */ }
    if (master && ctx) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(muted ? 0 : 0.8, now + 0.25);
    }
    return muted;
  };

  AU.toggleMute = function () { return AU.setMuted(!muted); };

  /* ── sintetizadores base ── */
  function envGain(t, dur, peak, attack, release, dest) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + (attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, attack + release + 0.05));
    g.connect(dest || sfxBus);
    return g;
  }

  function tone(freq, delay, dur, type, vol, glide, attack, dest) {
    if (!ctx) return;
    const t = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, glide), t + dur);
    const g = envGain(t, dur, vol || 0.1, attack || 0.008, 0.08, dest || sfxBus);
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.1);
  }

  let noiseBuf = null;
  function noise(delay, dur, vol, filterFreq, type, dest) {
    if (!ctx) return;
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1), ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime + (delay || 0);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type || 'lowpass';
    f.frequency.value = filterFreq || 900;
    const g = envGain(t, dur, vol || 0.1, 0.006, 0.05, dest || sfxBus);
    src.connect(f); f.connect(g);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  /* ── música ── */
  AU.playMusic = function (name) {
    if (!TRACKS[name]) return;
    if (!ctx) { pendingTrack = name; return; }
    if (currentTrack === name) return;
    AU.stopMusic(0.4);
    currentTrack = name;
    const tr = TRACKS[name];
    stepIdx = 0;
    nextTime = ctx.currentTime + 0.08;
    if (musicBus) {
      const now = ctx.currentTime;
      musicBus.gain.cancelScheduledValues(now);
      musicBus.gain.setValueAtTime(0.0001, now);
      musicBus.gain.linearRampToValueAtTime(0.62 * (tr.vol || 1), now + 0.9);
    }
    if (timer) clearInterval(timer);
    timer = setInterval(schedule, 50);
    schedule();
  };

  AU.stopMusic = function (fade) {
    if (timer) { clearInterval(timer); timer = null; }
    currentTrack = null;
    if (ctx && musicBus) {
      const now = ctx.currentTime;
      musicBus.gain.cancelScheduledValues(now);
      musicBus.gain.setValueAtTime(musicBus.gain.value, now);
      musicBus.gain.linearRampToValueAtTime(0.0001, now + (fade == null ? 0.4 : fade));
    }
  };

  function schedule() {
    if (!ctx || !currentTrack) return;
    const tr = TRACKS[currentTrack];
    const stepDur = 60 / tr.bpm / 2;
    while (nextTime < ctx.currentTime + 0.3) {
      const step = stepIdx;
      const stepTime = nextTime - ctx.currentTime;
      const delay = Math.max(0, stepTime);
      const bar = Math.floor(step / 8) % tr.chords.length;
      const chord = tr.chords[bar];
      const barPos = step % 8;
      const root = tr.root;

      // pad al inicio de cada compás
      if (barPos === 0) {
        chord.slice(0, 3).forEach((iv, i) => {
          const t = ctx.currentTime + delay;
          const o = ctx.createOscillator();
          o.type = tr.padWave;
          o.frequency.value = midi(root + iv - 12);
          const g = ctx.createGain();
          const peak = (tr.padGain || 0.035) / (i + 1.2);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(peak, t + 0.5);
          g.gain.setValueAtTime(peak, t + stepDur * 7);
          g.gain.linearRampToValueAtTime(0.0001, t + stepDur * 8 + 0.4);
          o.connect(g); g.connect(musicBus);
          o.start(t); o.stop(t + stepDur * 8 + 0.5);
        });
      }

      // bajo
      if (barPos === 0 || barPos === 4) {
        const o = ctx.createOscillator();
        o.type = tr.wave;
        o.frequency.value = midi(root + chord[0] - 24);
        const g = ctx.createGain();
        const t = ctx.currentTime + delay;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.11 * (tr.vol || 1), t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + stepDur * 3.2);
        o.connect(g); g.connect(musicBus);
        o.start(t); o.stop(t + stepDur * 3.4);
      }

      // arpegio
      const arp = [0, 1, 2, 3, 2, 1, 2, 1];
      const iv = chord[arp[barPos] % chord.length];
      {
        const t = ctx.currentTime + delay;
        const o = ctx.createOscillator();
        o.type = tr.pluck;
        o.frequency.value = midi(root + iv);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.045 * (tr.vol || 1), t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + stepDur * 2.1);
        o.connect(g); g.connect(musicBus);
        o.start(t); o.stop(t + stepDur * 2.2);
      }

      // melodía
      const mel = tr.melody[step % tr.melody.length];
      if (mel != null) {
        const t = ctx.currentTime + delay;
        const o = ctx.createOscillator();
        o.type = tr.wave;
        o.frequency.value = midi(root + mel);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.075 * (tr.vol || 1), t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + stepDur * 3.6);
        o.connect(g); g.connect(musicBus);
        o.start(t); o.stop(t + stepDur * 3.8);
      }

      // campanitas
      if (tr.bells && tr.bells.indexOf(step % 32) >= 0) {
        const t = ctx.currentTime + delay;
        const notes = [chord[2] + 24, chord[1] + 24];
        notes.forEach((n, i) => {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.value = midi(root + n);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t + i * 0.09);
          g.gain.exponentialRampToValueAtTime(0.022 * (tr.vol || 1), t + i * 0.09 + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 1.2);
          o.connect(g); g.connect(musicBus);
          o.start(t + i * 0.09); o.stop(t + i * 0.09 + 1.3);
        });
      }

      // percusión suave
      if (tr.drums) {
        if (barPos === 0 || barPos === 3 || barPos === 4) {
          const t = ctx.currentTime + delay;
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.setValueAtTime(150, t);
          o.frequency.exponentialRampToValueAtTime(55, t + 0.14);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.09 * (tr.vol || 1), t + 0.008);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
          o.connect(g); g.connect(musicBus);
          o.start(t); o.stop(t + 0.24);
        }
        if (barPos % 2 === 1) {
          const t = ctx.currentTime + delay;
          const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const f = ctx.createBiquadFilter();
          f.type = 'highpass'; f.frequency.value = 5000;
          const g = ctx.createGain(); g.gain.value = 0.025;
          src.connect(f); f.connect(g); g.connect(musicBus);
          src.start(t);
        }
      }

      nextTime += stepDur;
      stepIdx = (stepIdx + 1) % 32;
    }
  }

  /* ── efectos de sonido ── */
  AU.sfx = function (name) {
    if (!ctx) return;
    switch (name) {
      case 'click':
        if (ctx.currentTime - lastTick < 0.04) return;
        lastTick = ctx.currentTime;
        tone(640, 0, 0.07, 'triangle', 0.07);
        break;
      case 'hover':
        tone(820, 0, 0.05, 'sine', 0.035);
        break;
      case 'back':
        tone(520, 0, 0.08, 'triangle', 0.07, 380);
        break;
      case 'confirm':
        tone(523, 0, 0.12, 'triangle', 0.10);
        tone(659, 0.08, 0.12, 'triangle', 0.10);
        tone(784, 0.16, 0.22, 'triangle', 0.09);
        break;
      case 'start':
        tone(392, 0, 0.18, 'sine', 0.1);
        tone(523, 0.1, 0.18, 'sine', 0.1);
        tone(659, 0.2, 0.2, 'triangle', 0.1);
        tone(784, 0.32, 0.5, 'triangle', 0.09);
        break;
      case 'jump':
        tone(320, 0, 0.16, 'sine', 0.10, 620);
        break;
      case 'doublejump':
        tone(420, 0, 0.16, 'triangle', 0.08, 780);
        break;
      case 'land':
        tone(130, 0, 0.1, 'sine', 0.08, 70);
        noise(0, 0.06, 0.04, 500);
        break;
      case 'step':
        noise(0, 0.04, 0.025, 700);
        break;
      case 'bone':
        tone(988, 0, 0.1, 'sine', 0.09);
        tone(1319, 0.05, 0.16, 'sine', 0.075);
        tone(1568, 0.1, 0.2, 'triangle', 0.04);
        break;
      case 'heal':
        tone(523, 0, 0.14, 'sine', 0.08);
        tone(659, 0.09, 0.14, 'sine', 0.08);
        tone(784, 0.18, 0.2, 'sine', 0.08);
        tone(1047, 0.27, 0.4, 'sine', 0.06);
        break;
      case 'hurt':
        tone(220, 0, 0.2, 'sawtooth', 0.06, 110);
        tone(165, 0.04, 0.24, 'triangle', 0.07, 80);
        break;
      case 'item':
        [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.35, i > 2 ? 'sine' : 'triangle', 0.085 - i * 0.01));
        break;
      case 'secret':
        [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.3, 'sine', 0.06));
        noise(0, 0.4, 0.02, 3000, 'highpass');
        break;
      case 'checkpoint':
        [659, 880, 1319].forEach((f, i) => tone(f, i * 0.11, 0.5, 'sine', 0.07));
        break;
      case 'correct':
        [659, 784, 988, 1319].forEach((f, i) => tone(f, i * 0.08, 0.3, 'triangle', 0.08));
        break;
      case 'wrong':
        tone(392, 0, 0.2, 'triangle', 0.08, 330);
        tone(311, 0.16, 0.3, 'triangle', 0.07, 260);
        break;
      case 'swing':
        noise(0, 0.12, 0.05, 1800, 'bandpass');
        tone(700, 0, 0.08, 'sine', 0.04, 300);
        break;
      case 'dodge':
        noise(0, 0.14, 0.05, 2200, 'bandpass');
        tone(660, 0, 0.1, 'sine', 0.05, 990);
        break;
      case 'hit':
        noise(0, 0.1, 0.12, 420);
        tone(140, 0, 0.14, 'square', 0.06, 70);
        break;
      case 'perfect':
        [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, i * 0.055, 0.3, 'sine', 0.07));
        noise(0, 0.25, 0.025, 4000, 'highpass');
        break;
      case 'miss':
        tone(180, 0, 0.2, 'triangle', 0.08, 90);
        noise(0, 0.12, 0.03, 600);
        break;
      case 'sense':
        tone(330, 0, 0.7, 'sine', 0.06, 990);
        tone(495, 0.12, 0.8, 'sine', 0.05, 1320);
        noise(0, 0.8, 0.02, 2500, 'highpass');
        break;
      case 'pluma':
        tone(880, 0, 0.18, 'sine', 0.07, 1180);
        tone(1180, 0.1, 0.4, 'sine', 0.05);
        break;
      case 'enemy':
        tone(160, 0, 0.25, 'sawtooth', 0.05, 300);
        tone(300, 0.12, 0.2, 'triangle', 0.05, 160);
        break;
      case 'victory':
        [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.5, 'triangle', 0.09));
        noise(0.1, 0.7, 0.02, 5000, 'highpass');
        break;
      case 'goal':
        [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.7, 'sine', 0.08));
        break;
      case 'unlock':
        [659, 784, 880, 1047, 1319].forEach((f, i) => tone(f, i * 0.07, 0.4, 'sine', 0.07));
        break;
      case 'star':
        [1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.05, 0.4, 'sine', 0.05));
        break;
      case 'open':
        noise(0, 0.25, 0.04, 1200, 'bandpass');
        tone(440, 0, 0.25, 'sine', 0.04, 660);
        break;
      case 'close':
        tone(520, 0, 0.14, 'sine', 0.05, 330);
        break;
      case 'dialog':
        tone(520 + Math.random() * 60, 0, 0.045, 'triangle', 0.03);
        break;
      case 'wrongzone':
        tone(240, 0, 0.12, 'triangle', 0.05, 200);
        break;
      case 'pop':
        tone(700, 0, 0.07, 'sine', 0.06, 1000);
        break;
      case 'select':
        tone(600, 0, 0.06, 'triangle', 0.05);
        tone(900, 0.04, 0.08, 'triangle', 0.04);
        break;
    }
  };
})();
