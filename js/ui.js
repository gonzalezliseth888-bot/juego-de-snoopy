/* ═══════════════════════════════════════════════════════════════
   UI — pantallas, creador, mapa, HUD, diálogos, trivia y final
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const SLW = window.SLW;
  const UI = SLW.UI = {};
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const A = SLW.Art;
  const ST = SLW.State;

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const CATS = SLW.CREATOR_CATEGORIES;
  const OPTIONS = {
    skin: SLW.SKIN_TONES, hairColor: SLW.HAIR_COLORS, hair: SLW.HAIRS,
    eyes: SLW.EYE_COLORS, top: SLW.TOPS, bottom: SLW.BOTTOMS,
    shoes: SLW.SHOES, accessory: SLW.ACCESSORIES
  };

  UI.screen = '';
  UI._switching = false;
  UI._overlays = {};

  let creator = null;
  let dialog = null;
  let quiz = null;
  let inv = null;
  let confirmCb = null;
  let results = null;
  let ending = null;
  let toastTimers = [];
  let emoteTimer = null;
  let bannerTimer = null;
  let screenFadeTimer = null;

  const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fitCanvas(canvas) {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width), h = Math.round(rect.height);
    if (!w || !h) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  const hash = A.utils.hash;

  /* ═══════════════════════════ INIT ═══════════════════════════ */
  UI.init = function () {
    if (this._ready) return;
    this._ready = true;

    this.screens = {
      splash: $('#screen-splash'),
      creator: $('#screen-creator'),
      map: $('#screen-map'),
      game: $('#screen-game'),
      ending: $('#screen-ending')
    };
    this.fade = $('#screen-fade');
    this.splashCanvas = $('#splash-canvas');
    this.creatorCanvas = $('#creator-bg');
    this.mapCanvas = $('#map-bg');
    this.endingCanvas = $('#ending-canvas');

    this.syncSound();
    this.setupSplash();
    this.setupCreator();
    this.setupMap();
    this.setupGameHud();
    this.setupDialog();
    this.setupPause();
    this.setupInventory();
    this.setupQuiz();
    this.setupResults();
    this.setupConfirm();
    this.setupEnding();

    document.addEventListener('keydown', this.globalKeys.bind(this));

    let last = performance.now();
    let t = 0;
    const loop = (ts) => {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000));
      last = ts;
      if (document.hidden) return;
      t += dt;
      if (this.screen === 'splash') this.drawSplash(t);
      else if (this.screen === 'creator') { this.drawCreatorBg(t); this.drawCreatorPreview(t); }
      else if (this.screen === 'map') this.drawMapBg(t);
      else if (this.screen === 'ending') this.drawEndingBg(t);
      else if (this.screen === 'game') this.drawHudWoodstock(t);
    };
    requestAnimationFrame(loop);

    this.setScreen('splash', { instant: true });
    this.updateSplash();
    this.updateSoundUi();
  };

  /* ═══════════════════════════ SONIDO ═══════════════════════════ */
  UI.syncSound = function () {
    const m = SLW.Audio.getMuted();
    document.body.classList.toggle('is-muted', m);
    const label = $('#pause-sound-label');
    if (label) label.textContent = m ? 'Sonido silenciado' : 'Sonido activado';
  };

  UI.updateSoundUi = function () { this.syncSound(); };

  UI.toggleSound = function () {
    SLW.Audio.init();
    const muted = SLW.Audio.toggleMute();
    this.syncSound();
    if (!muted) SLW.Audio.sfx('click');
    return muted;
  };

  /* ═══════════════════════════ PANTALLAS ═══════════════════════════ */
  UI.setScreen = function (name, opts) {
    opts = opts || {};
    const target = this.screens && this.screens[name];
    if (!target) return;
    if (this.screen === name && !opts.force) return;
    const music = { splash: 'splash', creator: 'creator', map: 'map', ending: 'ending', game: null }[name];
    if (music) SLW.Audio.playMusic(music);

    const swap = () => {
      Object.keys(this.screens).forEach(k => {
        const sc = this.screens[k];
        if (sc) sc.classList.toggle('is-active', k === name);
      });
      this.screen = name;
      if (name !== 'game') this.closeAllOverlays();
      if (name === 'map') {
        this.refreshMap();
        this.scrollMapToProgress(opts.keepScroll);
      }
      if (name === 'splash') this.updateSplash();
      if (name === 'ending') $('#ending-letter').classList.add('hidden');
    };

    clearTimeout(screenFadeTimer);
    if (opts.instant || reducedMotion()) {
      this.fade.classList.remove('is-on');
      swap();
      return;
    }
    this.fade.classList.add('is-on');
    screenFadeTimer = setTimeout(() => {
      swap();
      setTimeout(() => this.fade.classList.remove('is-on'), 90);
    }, 250);
  };

  /* ═══════════════════════════ SPLASH ═══════════════════════════ */
  UI.updateSplash = function () {
    const note = $('#splash-save-note');
    const cont = $('#btn-continue');
    const startSpan = $('#btn-start span');
    if (ST.hasSave()) {
      cont.classList.remove('hidden');
      startSpan.textContent = 'Comenzar una nueva aventura';
      const done = SLW.LEVEL_ORDER.filter(id => ST.isLevelComplete(id)).length;
      const stars = ST.totalStars();
      note.textContent = `${ST.playerName()} · ${done} de ${SLW.LEVEL_ORDER.length} capítulos · ${stars} estrellas guardadas`;
    } else {
      cont.classList.add('hidden');
      startSpan.textContent = 'Comenzar la aventura';
      note.textContent = 'Crea a tu explorador y cruza los cuatro mundos.';
    }
  };

  UI.setupSplash = function () {
    $('#btn-start').addEventListener('click', () => {
      SLW.Audio.init();
      if (ST.hasSave()) {
        this.confirm({
          title: '¿Empezar de nuevo?',
          text: 'Tu aventura actual seguirá guardada hasta que confirmes a tu nuevo explorador. Podrás volver a jugar todos los capítulos desde el principio.',
          okText: 'Crear otra aventura',
          cancelText: 'Volver',
          onOk: () => this.openCreator({ mode: 'new', fresh: true }),
          onCancel: () => {}
        });
      } else {
        this.openCreator({ mode: 'new', fresh: true });
      }
    });
    $('#btn-continue').addEventListener('click', () => {
      SLW.Audio.init();
      SLW.Audio.sfx('confirm');
      this.setScreen('map');
    });
    $('#btn-splash-sound').addEventListener('click', () => this.toggleSound());
  };

  /* ═══════════════════════════ FONDOS ═══════════════════════════ */
  UI.drawSplash = function (t) {
    const c = fitCanvas(this.splashCanvas);
    if (!c) return;
    const { ctx, w, h } = c;
    const g = ctx.createLinearGradient(0, 0, w * 0.3, h);
    g.addColorStop(0, '#171130'); g.addColorStop(0.5, '#241a42'); g.addColorStop(1, '#3a2a56');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // estrellas
    for (let i = 0; i < 110; i++) {
      const x = hash(i * 3.7 + 1) * w;
      const y = hash(i * 7.3 + 2) * h * 0.82;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + hash(i) * 1.4) + i));
      ctx.fillStyle = `rgba(255,246,214,${0.18 + tw * 0.55})`;
      ctx.beginPath(); ctx.arc(x, y, 0.7 + hash(i * 5 + 1) * 1.8, 0, Math.PI * 2); ctx.fill();
    }

    // luna
    const mx = w * 0.79, my = h * 0.2, mr = Math.max(38, Math.min(w, h) * 0.075);
    const glow = ctx.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 4.2);
    glow.addColorStop(0, 'rgba(255,228,160,.36)');
    glow.addColorStop(1, 'rgba(255,228,160,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(mx, my, mr * 4.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff0c2';
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(238,214,164,.5)';
    [[-0.3, -0.2, 0.22], [0.25, 0.18, 0.16], [-0.05, 0.4, 0.11]].forEach(cr => {
      ctx.beginPath(); ctx.arc(mx + cr[0] * mr, my + cr[1] * mr, cr[2] * mr, 0, Math.PI * 2); ctx.fill();
    });

    // nubes suaves
    for (let i = 0; i < 5; i++) {
      const cw = 200 + hash(i * 4) * 260;
      const x = ((i * 240 + t * (10 + i * 3)) % (w + 500)) - 250;
      const y = h * (0.22 + i * 0.1);
      const cg = ctx.createRadialGradient(x, y, 8, x, y, cw * 0.6);
      cg.addColorStop(0, 'rgba(196,174,235,.13)');
      cg.addColorStop(1, 'rgba(196,174,235,0)');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.ellipse(x, y, cw * 0.6, cw * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    }

    // colinas
    ctx.fillStyle = 'rgba(24,18,44,.85)';
    ctx.beginPath(); ctx.moveTo(0, h * 0.9);
    ctx.quadraticCurveTo(w * 0.22, h * 0.78, w * 0.52, h * 0.88);
    ctx.quadraticCurveTo(w * 0.8, h * 0.98, w, h * 0.86);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(17,13,32,.9)';
    ctx.beginPath(); ctx.moveTo(0, h * 0.95);
    ctx.quadraticCurveTo(w * 0.3, h * 0.89, w * 0.62, h * 0.96);
    ctx.quadraticCurveTo(w * 0.85, h * 1.0, w, h * 0.94);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

    const scl = Math.max(1.15, Math.min(w / 900, h / 560));
    const dx = w * 0.8, dy = h * 0.905;
    A.drawDoghouse(ctx, dx, dy, scl, { glow: true });

    // Snoopy bailando (el corazón de la portada)
    const sx = dx - 190 * Math.min(1.25, scl);
    const sy = dy - 2;
    const dance = Math.sin(t * 1.3) > -0.55 ? 'dance' : 'stand';
    A.drawSnoopy(ctx, sx, sy, scl * 0.92, t, dance, { facing: 1 });
    const halo = ctx.createRadialGradient(sx, sy - 100 * scl, 10, sx, sy - 100 * scl, 160 * scl);
    halo.addColorStop(0, 'rgba(255,240,190,.16)');
    halo.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(sx, sy - 100 * scl, 160 * scl, 0, Math.PI * 2); ctx.fill();

    // notas musicales
    ctx.fillStyle = 'rgba(255,231,170,.8)';
    ctx.font = `700 ${Math.round(20 * scl)}px "Baloo 2", sans-serif`;
    ctx.fillText('♪', sx + 66 * scl, sy - 150 * scl - Math.sin(t * 2) * 5);
    ctx.fillText('♫', sx + 104 * scl, sy - 178 * scl - Math.sin(t * 2 + 1) * 6);

    // Woodstock
    const wx = dx + 110 * scl + Math.sin(t * 0.7) * 22;
    const wy = dy - 330 * scl + Math.sin(t * 2.1) * 10;
    A.drawWoodstock(ctx, wx, wy, scl * 0.95, t, { facing: -1, expression: 'happy' });
    A.drawEmote(ctx, wx + 20, wy - 44, 'note', scl * 0.9, t);
    A.drawEmote(ctx, wx - 32, wy - 54, 'star', scl * 0.8, t + 1.2);

    // corazones flotantes
    for (let i = 0; i < 7; i++) {
      const p = (t * 0.05 + i / 7) % 1;
      const hx = w * (0.55 + hash(i * 9) * 0.4) + Math.sin(t + i) * 18;
      const hy = h * 0.82 - p * h * 0.5;
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.5;
      ctx.fillStyle = '#ffb6c9';
      ctx.save(); ctx.translate(hx, hy); ctx.scale(0.8 + hash(i) * 0.6, 0.8 + hash(i) * 0.6);
      ctx.beginPath(); ctx.moveTo(0, 5); ctx.bezierCurveTo(-9, -1, -7, -9, -2, -9);
      ctx.bezierCurveTo(1, -9, 2, -6, 0, -3); ctx.bezierCurveTo(-2, -6, 1, -9, 3, -9);
      ctx.bezierCurveTo(8, -9, 10, -1, 0, 5); ctx.fill(); ctx.restore();
    }
    ctx.globalAlpha = 1;

    // polvo dorado
    for (let i = 0; i < 26; i++) {
      const x = (hash(i * 13 + 2) * w + t * 6 * (0.4 + hash(i))) % w;
      const y = (hash(i * 7 + 5) * h + Math.sin(t * 0.7 + i) * 20);
      A.utils.sparkle(ctx, x, y, 2 + hash(i) * 3, '#ffe9a8', 0.25 + 0.35 * Math.abs(Math.sin(t + i)));
    }
  };

  UI.drawCreatorBg = function (t) {
    const c = fitCanvas(this.creatorCanvas);
    if (!c) return;
    const { ctx, w, h } = c;
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#fff8ea'); g.addColorStop(0.45, '#ffeaf0'); g.addColorStop(1, '#e8f1ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // sol y resplandores
    const sun = ctx.createRadialGradient(w * 0.82, h * 0.18, 10, w * 0.82, h * 0.18, Math.max(w, h) * 0.5);
    sun.addColorStop(0, 'rgba(255,214,148,.32)');
    sun.addColorStop(1, 'rgba(255,214,148,0)');
    ctx.fillStyle = sun; ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 4; i++) {
      const x = ((i * 330 + t * 12) % (w + 400)) - 200;
      const y = h * (0.16 + i * 0.13);
      ctx.fillStyle = `rgba(255,255,255,${0.34 + i * 0.04})`;
      ctx.beginPath();
      ctx.ellipse(x, y, 96, 26, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 70, y + 6, 64, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 62, y + 8, 52, 17, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // colinas pastel
    ctx.fillStyle = 'rgba(167,213,184,.55)';
    ctx.beginPath(); ctx.moveTo(0, h * 0.84);
    ctx.quadraticCurveTo(w * 0.22, h * 0.68, w * 0.48, h * 0.82);
    ctx.quadraticCurveTo(w * 0.74, h * 0.94, w, h * 0.78);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,196,208,.5)';
    ctx.beginPath(); ctx.moveTo(0, h);
    ctx.quadraticCurveTo(w * 0.3, h * 0.92, w, h * 0.97);
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();

    // flores sueltas
    for (let i = 0; i < 18; i++) {
      const x = (hash(i * 4 + 1) * w + Math.sin(t * 0.4 + i) * 10) % w;
      const y = hash(i * 6 + 2) * h * 0.9;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255,166,190,.55)' : i % 3 === 1 ? 'rgba(255,220,140,.5)' : 'rgba(180,206,255,.5)';
      ctx.beginPath(); ctx.arc(x, y, 2 + hash(i) * 3, 0, Math.PI * 2); ctx.fill();
    }

    for (let i = 0; i < 12; i++) {
      const x = (hash(i * 11 + 3) * w + t * 8) % w;
      const y = hash(i * 5 + 9) * h * 0.75 + Math.sin(t + i) * 8;
      A.utils.sparkle(ctx, x, y, 3, '#ffd166', 0.35 + 0.3 * Math.abs(Math.sin(t * 1.3 + i)));
    }
  };

  UI.drawMapBg = function (t) {
    const c = fitCanvas(this.mapCanvas);
    if (!c) return;
    const { ctx, w, h } = c;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#181131'); g.addColorStop(0.5, '#2b1f4a'); g.addColorStop(1, '#513565');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 140; i++) {
      const x = hash(i * 2.7 + 1) * w;
      const y = hash(i * 5.1 + 4) * h * 0.86;
      const a = 0.15 + 0.5 * Math.abs(Math.sin(t * (0.4 + hash(i) * 1.2) + i));
      ctx.fillStyle = `rgba(255,243,208,${a})`;
      ctx.beginPath(); ctx.arc(x, y, 0.6 + hash(i * 3) * 1.6, 0, Math.PI * 2); ctx.fill();
    }

    const mx = w * 0.14, my = h * 0.24, mr = Math.max(24, Math.min(w, h) * 0.05);
    const mg = ctx.createRadialGradient(mx, my, 4, mx, my, mr * 3.4);
    mg.addColorStop(0, 'rgba(255,226,166,.3)'); mg.addColorStop(1, 'rgba(255,226,166,0)');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr * 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff0c8'; ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();

    const neb = ctx.createRadialGradient(w * 0.72, h * 0.2, 10, w * 0.72, h * 0.2, w * 0.38);
    neb.addColorStop(0, 'rgba(150,110,230,.16)');
    neb.addColorStop(1, 'rgba(150,110,230,0)');
    ctx.fillStyle = neb; ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 4; i++) {
      const x = ((i * 360 + t * 7) % (w + 500)) - 260;
      const y = h * (0.3 + i * 0.14);
      const cg = ctx.createRadialGradient(x, y, 6, x, y, 210);
      cg.addColorStop(0, 'rgba(90,70,140,.22)');
      cg.addColorStop(1, 'rgba(90,70,140,0)');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.ellipse(x, y, 220, 54, 0, 0, Math.PI * 2); ctx.fill();
    }

    // colinas lejanas
    ctx.fillStyle = 'rgba(22,15,40,.85)';
    ctx.beginPath(); ctx.moveTo(0, h * 0.9);
    ctx.quadraticCurveTo(w * 0.2, h * 0.82, w * 0.45, h * 0.9);
    ctx.quadraticCurveTo(w * 0.72, h * 0.98, w, h * 0.88);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

    // luciérnagas
    for (let i = 0; i < 12; i++) {
      const x = (hash(i * 17 + 2) * w + Math.sin(t * 0.5 + i) * 40) % w;
      const y = h * (0.68 + hash(i * 3) * 0.24) + Math.cos(t * 0.7 + i) * 12;
      ctx.fillStyle = 'rgba(255,220,130,.6)';
      ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI * 2); ctx.fill();
      const fg = ctx.createRadialGradient(x, y, 0, x, y, 10);
      fg.addColorStop(0, 'rgba(255,220,130,.3)'); fg.addColorStop(1, 'rgba(255,220,130,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
    }
  };

  UI.drawEndingBg = function (t) {
    const c = fitCanvas(this.endingCanvas);
    if (!c) return;
    const { ctx, w, h } = c;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#120d26'); g.addColorStop(0.5, '#2a1b47'); g.addColorStop(1, '#5a3a5f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 150; i++) {
      const x = hash(i * 4.3 + 1) * w;
      const y = hash(i * 6.7 + 2) * h * 0.9;
      const a = 0.12 + 0.6 * Math.abs(Math.sin(t * (0.3 + hash(i) * 0.9) + i));
      ctx.fillStyle = `rgba(255,244,212,${a})`;
      ctx.beginPath(); ctx.arc(x, y, 0.6 + hash(i * 2) * 1.7, 0, Math.PI * 2); ctx.fill();
    }

    // luna grande
    const mx = w * 0.77, my = h * 0.24, mr = Math.max(42, Math.min(w, h) * 0.08);
    const mg = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 4);
    mg.addColorStop(0, 'rgba(255,230,175,.4)'); mg.addColorStop(1, 'rgba(255,230,175,0)');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr * 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff2cb'; ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(236,214,170,.45)';
    ctx.beginPath(); ctx.arc(mx - mr * 0.25, my - mr * 0.2, mr * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + mr * 0.3, my + mr * 0.24, mr * 0.13, 0, Math.PI * 2); ctx.fill();

    // nubes
    for (let i = 0; i < 4; i++) {
      const x = ((i * 300 + t * 6) % (w + 420)) - 210;
      const y = h * (0.34 + i * 0.1);
      const cg = ctx.createRadialGradient(x, y, 8, x, y, 190);
      cg.addColorStop(0, 'rgba(120,90,160,.14)'); cg.addColorStop(1, 'rgba(120,90,160,0)');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.ellipse(x, y, 200, 44, 0, 0, Math.PI * 2); ctx.fill();
    }

    // colina
    ctx.fillStyle = 'rgba(24,17,42,.9)';
    ctx.beginPath(); ctx.moveTo(0, h * 0.88);
    ctx.quadraticCurveTo(w * 0.25, h * 0.8, w * 0.55, h * 0.9);
    ctx.quadraticCurveTo(w * 0.8, h * 0.98, w, h * 0.9);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

    // casita de Snoopy
    const scl = Math.max(0.9, Math.min(w / 1500, h / 850) * 1.15);
    const dx = w * 0.18, dy = h * 0.92;
    A.drawDoghouse(ctx, dx, dy, scl, { glow: true });
    const roof = dy - 186 * scl;
    A.drawSnoopy(ctx, dx, roof + 26 * scl, scl * 0.9, t, 'lie', { facing: 1 });
    A.drawEmote(ctx, dx + 66 * scl, roof - 10 * scl, 'heart', scl, t);

    // Woodstock junto a la luna
    const wx = mx - mr * 1.8 + Math.sin(t * 0.8) * 20;
    const wy = my + mr * 0.9 + Math.cos(t * 1.6) * 8;
    A.drawWoodstock(ctx, wx, wy, Math.max(0.9, scl * 0.95), t, { facing: 1, expression: 'happy' });

    for (let i = 0; i < 9; i++) {
      const p = (t * 0.045 + i / 9) % 1;
      const hx = w * (0.08 + hash(i * 7) * 0.7) + Math.sin(t * 0.8 + i) * 22;
      const hy = h * 0.85 - p * h * 0.55;
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.5;
      ctx.fillStyle = i % 3 === 0 ? '#ffc7d8' : '#ffe5b0';
      ctx.save(); ctx.translate(hx, hy); ctx.scale(0.9 + hash(i) * 0.5, 0.9 + hash(i) * 0.5);
      ctx.beginPath(); ctx.moveTo(0, 5); ctx.bezierCurveTo(-9, -1, -7, -9, -2, -9);
      ctx.bezierCurveTo(1, -9, 2, -6, 0, -3); ctx.bezierCurveTo(-2, -6, 1, -9, 3, -9);
      ctx.bezierCurveTo(8, -9, 10, -1, 0, 5); ctx.fill(); ctx.restore();
    }
    ctx.globalAlpha = 1;

    // estrella fugaz
    const cycle = t % 9;
    if (cycle < 1.1) {
      const prog = cycle / 1.1;
      const x = w * (0.12 + prog * 0.4);
      const y = h * (0.1 + prog * 0.22);
      ctx.strokeStyle = `rgba(255,240,200,${0.7 * (1 - prog)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 70, y - 40); ctx.stroke();
    }
  };

  /* ═══════════════════════════ CREADOR ═══════════════════════════ */
  UI.setupCreator = function () {
    this.preview = $('#char-preview');
    this.preview.width = 840;
    this.preview.height = 960;
    this.previewCtx = this.preview.getContext('2d');

    $('#creator-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.cat-tab');
      if (!tab || !creator) return;
      creator.cat = tab.dataset.cat;
      SLW.Audio.sfx('click');
      this.renderCreator();
    });

    $('#creator-options').addEventListener('click', (e) => {
      const card = e.target.closest('.option-card');
      if (!card || !creator) return;
      const value = card.dataset.value;
      creator.app[creator.cat] = value;
      SLW.Audio.sfx('click');
      this.bubble(pickBubble());
      this.renderCreatorOptions(true);
    });

    $('#btn-creator-random').addEventListener('click', () => {
      if (!creator) return;
      const cats = ['skin', 'hairColor', 'hair', 'eyes', 'top', 'bottom', 'shoes', 'accessory'];
      cats.forEach(cat => {
        const list = OPTIONS[cat];
        creator.app[cat] = list[Math.floor(Math.random() * list.length)].id;
      });
      if (!creator.name) {
        creator.name = ['Mochi', 'Luna', 'Trébol', 'Pepita', 'Nube', 'Sol'][Math.floor(Math.random() * 6)];
        $('#char-name').value = creator.name;
      }
      SLW.Audio.sfx('confirm');
      this.bubble('¡Me encanta este look!');
      this.renderCreator();
    });

    $('#char-name').addEventListener('input', (e) => {
      if (!creator) return;
      creator.name = e.target.value;
      const n = creator.name.trim();
      this.bubble(n ? `¡Hola, ${n}!` : '¿Cómo te llamas?');
    });

    $('#btn-creator-back').addEventListener('click', () => {
      SLW.Audio.sfx('back');
      if (creator && creator.mode === 'edit') this.setScreen('map');
      else this.setScreen('splash');
    });

    $('#btn-creator-confirm').addEventListener('click', () => {
      if (!creator) return;
      const name = (creator.name || '').trim().slice(0, 16) || SLW.DEFAULT_NAME;
      if (creator.fresh) ST.reset();
      ST.setAppearance(creator.app, name);
      SLW.State.setName(name);
      SLW.Audio.init();
      SLW.Audio.sfx('confirm');
      creator = null;
      this.setScreen('map');
      this.refreshMap();
      const tip = $('#map-tip-text');
      if (tip) {
        tip.textContent = `${name}, tu historia ya está escrita. Elige un capítulo para comenzar.`;
        clearTimeout(this._tipTimer);
        this._tipTimer = setTimeout(() => this.resetMapTip(), 5000);
      }
    });
  };

  function pickBubble() {
    return ['¡Qué bonito!', '¡Me gusta!', '¿Y si probamos otro?', '¡Perfecto!', '¡Hola, mundo!'][Math.floor(Math.random() * 5)];
  }

  UI.bubble = function (text) {
    const b = $('#preview-bubble');
    if (!b) return;
    b.textContent = text;
    b.style.animation = 'none';
    void b.offsetWidth;
    b.style.animation = '';
  };

  UI.openCreator = function (opts) {
    opts = opts || {};
    const mode = opts.mode || 'new';
    const app = Object.assign({}, SLW.DEFAULT_APPEARANCE, mode === 'edit' ? ST.appearance() : {});
    creator = {
      app,
      name: mode === 'edit' ? (ST.data.name || '') : '',
      cat: 'skin',
      mode,
      fresh: !!opts.fresh && mode !== 'edit'
    };
    $('#char-name').value = creator.name;
    this.renderCreator();
    this.bubble(creator.name ? `¡Hola, ${creator.name}!` : '¡Hola!');
    this.setScreen('creator');
    setTimeout(() => {
      try { $('#char-name').focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }, 500);
  };

  UI.renderCreator = function (optionsOnly) {
    if (!creator) return;
    const cat = CATS.find(c => c.id === creator.cat) || CATS[0];
    if (!optionsOnly) {
      $('#creator-tabs').innerHTML = CATS.map(c =>
        `<button type="button" class="cat-tab${c.id === creator.cat ? ' active' : ''}" data-cat="${c.id}" style="--tab-color:${c.color}">
          <span class="tab-dot"></span>${esc(c.label)}
        </button>`).join('');
      $('#options-title').textContent = cat.title;
      $('#options-sub').textContent = cat.sub;
      $('#creator-progress').textContent = '8';
    }
    this.renderCreatorOptions(false);
  };

  UI.renderCreatorOptions = function (keepScroll) {
    if (!creator) return;
    const cat = creator.cat;
    const grid = $('#creator-options');
    const scroll = keepScroll ? grid.scrollTop : 0;
    const list = OPTIONS[cat] || [];
    grid.innerHTML = list.map(opt => {
      const selected = creator.app[cat] === opt.id;
      const label = opt.name || opt.id;
      return `<button type="button" class="option-card${selected ? ' selected' : ''}${cat === 'accessory' && opt.id === 'none' ? ' no-option' : ''}" data-value="${opt.id}" title="${esc(label)}">
        <canvas class="option-canvas" width="128" height="116"></canvas>
        <span class="option-label">${esc(label)}</span>
      </button>`;
    }).join('');
    grid.scrollTop = scroll;
    $$('.option-card', grid).forEach(card => {
      const canvas = $('canvas', card);
      try {
        A.drawOptionPreview(canvas, cat, card.dataset.value, creator.app);
      } catch (e) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  };

  UI.drawCreatorPreview = function (t) {
    const canvas = this.preview;
    if (!canvas || !creator) return;
    const ctx = this.previewCtx;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, 420, 480);

    const glow = ctx.createRadialGradient(210, 250, 30, 210, 250, 210);
    glow.addColorStop(0, 'rgba(255,238,200,.85)');
    glow.addColorStop(0.6, 'rgba(255,226,236,.4)');
    glow.addColorStop(1, 'rgba(255,226,236,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 420, 480);

    // suelo
    ctx.fillStyle = 'rgba(90,60,90,.13)';
    ctx.beginPath(); ctx.ellipse(210, 432, 130, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(120,90,130,.1)';
    ctx.beginPath(); ctx.ellipse(210, 438, 160, 22, 0, 0, Math.PI * 2); ctx.fill();

    for (let i = 0; i < 9; i++) {
      const a = t * 0.7 + i * 0.7;
      const x = 210 + Math.cos(a) * (120 + hash(i) * 80);
      const y = 250 + Math.sin(a * 1.3) * (100 + hash(i) * 60);
      A.utils.sparkle(ctx, x, y, 3 + hash(i) * 3, i % 2 ? '#ffd166' : '#ffb6c9', 0.25 + 0.3 * Math.abs(Math.sin(t + i)));
    }

    const celebrating = Math.floor(t / 3.2) % 5 === 4;
    A.drawPerson(ctx, creator.app, {
      x: 205, y: 424, scale: 2.2, facing: 1,
      state: celebrating ? 'cheer' : 'idle', time: t,
      expression: 'happy'
    });

    A.drawWoodstock(ctx, 344, 356 + Math.sin(t * 2.2) * 5, 1.15, t, { facing: -1, expression: 'happy' });
    if (Math.floor(t / 4) % 2 === 0) A.drawEmote(ctx, 366, 316, 'heart', 0.9, t);
  };

  /* ═══════════════════════════ MAPA ═══════════════════════════ */
  UI.setupMap = function () {
    $('#btn-map-logo').addEventListener('click', () => {
      const sc = $('#map-scroll');
      if (sc) sc.scrollTo({ top: 0, behavior: 'smooth' });
      SLW.Audio.sfx('click');
    });
    $('#btn-map-sound').addEventListener('click', () => this.toggleSound());
    $('#btn-map-inventory').addEventListener('click', () => this.openInventory({}));
    $('#btn-map-creator').addEventListener('click', () => {
      SLW.Audio.init(); SLW.Audio.sfx('click');
      this.openCreator({ mode: 'edit' });
    });
    $('#world-cards').addEventListener('click', (e) => {
      const btn = e.target.closest('.level-node');
      if (!btn || btn.disabled) return;
      const id = btn.dataset.level;
      if (!id || !ST.isLevelUnlocked(id)) return;
      SLW.Audio.init(); SLW.Audio.sfx('confirm');
      SLW.Game.startLevel(id);
    });
    $('#btn-finale').addEventListener('click', () => {
      if (!ST.isFinaleUnlocked()) return;
      SLW.Audio.init(); SLW.Audio.sfx('start');
      SLW.Game.startLevel(SLW.FINALE_ID);
    });
  };

  UI.resetMapTip = function () {
    const tip = $('#map-tip-text');
    if (!tip) return;
    tip.textContent = ST.isFinaleUnlocked()
      ? 'El Gran Encuentro ya está abierto. Cuando quieras, Snoopy te espera entre las estrellas.'
      : 'Completa los dos niveles de cada mundo para abrir el siguiente.';
  };

  UI.refreshMap = function () {
    const name = ST.playerName();
    const doneLevels = SLW.LEVEL_ORDER.filter(id => ST.isLevelComplete(id)).length;
    const stars = ST.totalStars();
    const items = ST.getItemCount();
    const finishing = ST.getFlag('finished');

    $('#map-bones').textContent = ST.totalBones();
    $('#map-items').textContent = `${items} / ${SLW.ITEMS.length}`;

    const greeting = $('#map-greeting');
    if (finishing) greeting.textContent = `Para ${name}, que encontró a Snoopy`;
    else if (doneLevels === 0) greeting.textContent = `Hola, ${name}. Tu aventura apenas comienza`;
    else if (ST.isFinaleUnlocked()) greeting.textContent = `${name}, el último camino ya está abierto`;
    else greeting.textContent = `${name}, el pequeño mundo sigue creciendo`;

    const quotes = finishing
      ? ['“Los sueños también saben volver a casa.”', '“Gracias por no dejar de buscar.”']
      : stars > 8
        ? ['“Cada huesito es un pasito más cerca de él.”', '“Las estrellas se guardan mejor de dos en dos.”']
        : doneLevels > 0
          ? ['“Sigue el camino de huesitos: los recuerdos te llevarán hasta él.”', '“Woodstock dice que los tesoros huelen a aventura.”']
          : ['“Sigue el camino de huesitos: los recuerdos te llevarán hasta él.”', '“Todo gran viaje empieza con un pequeño salto.”'];
    $('#map-quote').textContent = quotes[doneLevels % quotes.length];

    const cards = $('#world-cards');
    cards.innerHTML = SLW.WORLDS.map(w => {
      const prog = ST.worldProgress(w.id);
      const locked = !prog.unlocked;
      const complete = prog.done >= prog.total && prog.total > 0;
      const levelRows = (w.levels || []).map(id => {
        const lv = SLW.LEVELS[id];
        if (!lv) return '';
        const rec = ST.levelRecord(id);
        const levelDone = !!(rec && rec.completed);
        const levelUnlocked = ST.isLevelUnlocked(id);
        const lvStars = rec ? rec.stars || 0 : 0;
        const starsHtml = `<span class="stars">${[1, 2, 3].map(n =>
          `<svg class="ic${n <= lvStars ? ' on' : ''}"><use href="#i-star"></use></svg>`).join('')}</span>`;
        const sub = levelDone
          ? `completado · ${(rec.bones || 0)} huesitos`
          : levelUnlocked ? `capítulo ${lv.index} · por explorar` : 'bloqueado';
        return `<button type="button" class="level-node${levelDone ? ' done' : ''}${levelUnlocked ? '' : ' locked'}" data-level="${id}" ${levelUnlocked ? '' : 'disabled'}>
          <span class="level-badge">${levelUnlocked ? (levelDone ? '<svg class="ic"><use href="#i-check"></use></svg>' : lv.index) : '<svg class="ic"><use href="#i-lock"></use></svg>'}</span>
          <span class="level-node-main">
            <span class="level-node-name">${esc(lv.name)}</span>
            <span class="level-node-sub">${esc(sub)}</span>
          </span>
          ${starsHtml}
        </button>`;
      }).join('');

      const pips = Array.from({ length: prog.total }, (_, i) =>
        `<span class="pip${i < prog.done ? ' on' : ''}"></span>`).join('');

      return `<article class="world-card world-${w.id}${locked ? ' locked' : ''}" data-world="${w.id}" style="--accent:${w.color}">
        <div class="world-thumb">
          <canvas width="720" height="340" data-thumb="${w.theme}"></canvas>
          <span class="world-badge">Mundo ${w.id}</span>
          ${complete ? `<span class="world-done-badge"><svg class="ic"><use href="#i-star"></use></svg>completo</span>` : ''}
          <div class="world-lock-badge">
            <svg class="ic"><use href="#i-lock"></use></svg>
            <span>Completa el mundo ${w.id - 1}</span>
          </div>
        </div>
        <div class="world-body">
          <div class="world-title-row">
            <div>
              <span class="world-kicker">${esc(SLW.WORLD_META[w.id].label)}</span>
              <h3 class="world-title">${esc(w.name)}</h3>
            </div>
            <div class="world-progress">${pips}</div>
          </div>
          <p class="world-desc">${esc(w.desc)}</p>
          <div class="level-list">${levelRows}</div>
        </div>
      </article>`;
    }).join('');

    // miniaturas pintadas a mano
    requestAnimationFrame(() => {
      $$('canvas[data-thumb]', cards).forEach(cv => {
        try { SLW.Scenery.drawThumb(cv, cv.dataset.thumb, 0.8); } catch (e) { /* ignore */ }
      });
    });

    const finaleWrap = $('#finale-wrap');
    const finaleOpen = ST.isFinaleUnlocked();
    finaleWrap.classList.toggle('hidden', !finaleOpen);
    if (finaleOpen) {
      const t = $('.finale-text b', finaleWrap);
      const small = $('.finale-text small', finaleWrap);
      if (finishing) {
        if (t) t.textContent = 'Volver a ver a Snoopy';
        if (small) small.textContent = 'La carta sigue esperándote en el tejado';
      } else {
        if (t) t.textContent = 'El Gran Encuentro';
        if (small) small.textContent = 'El rincón de los sueños te espera';
      }
    }

    this.resetMapTip();
  };

  UI.scrollMapToProgress = function (keep) {
    if (keep) return;
    const sc = $('#map-scroll');
    if (!sc) return;
    setTimeout(() => {
      const cards = $$('.world-card', $('#world-cards'));
      let target = cards.find(card => {
        const w = Number(card.dataset.world);
        return ST.isWorldUnlocked(w) && ST.worldProgress(w).done < ST.worldProgress(w).total;
      }) || cards[cards.length - 1];
      if (!target) return;
      const top = target.offsetTop - 64;
      sc.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, 120);
  };

  /* ═══════════════════════════ HUD DEL JUEGO ═══════════════════════════ */
  UI.setupGameHud = function () {
    $('#btn-hud-inventory').addEventListener('click', () => {
      SLW.Audio.init();
      SLW.Game.openInventory();
    });
    $('#btn-hud-sound').addEventListener('click', () => this.toggleSound());
    $('#btn-hud-pause').addEventListener('click', () => SLW.Game.pauseGame(false));
    $('#ability-sense').addEventListener('click', () => SLW.Game.useSense());
  };

  UI.setHearts = function (cur, max) {
    const box = $('#hud-hearts');
    if (!box) return;
    const prev = this._lastHearts;
    this._lastHearts = cur;
    box.innerHTML = Array.from({ length: max }, (_, i) => {
      const empty = i >= cur;
      let cls = 'heart' + (empty ? ' empty' : '');
      if (prev != null && prev !== cur) {
        if (cur < prev && i === cur) cls += ' lost';
        if (cur > prev && i === cur - 1) cls += ' gain';
      }
      return `<span class="${cls}"><svg class="ic"><use href="#i-heart"></use></svg></span>`;
    }).join('');
    this.refreshCompanionVisibility();
  };

  UI.setLevelLabel = function (code, name) {
    const level = SLW.LEVELS[code];
    let label = 'Aventura';
    if (level) {
      label = level.finale ? 'El rincón de los sueños' : `Mundo ${level.world} · Nivel ${level.index}`;
    }
    $('#hud-level').textContent = label;
    $('#hud-level-name').textContent = name || '';
    $('#hud-player-name').textContent = ST.playerName();
  };

  UI.setBones = function (cur, total) {
    $('#hud-bones').textContent = cur;
    $('#hud-bones-total').textContent = `/ ${total}`;
  };

  UI.setCompanion = function (joined) {
    this._companion = !!joined;
    this.refreshCompanionVisibility();
    if (joined) this.drawHudWoodstock(performance.now() / 1000);
  };

  UI.refreshCompanionVisibility = function () {
    const panel = $('#companion-panel');
    if (!panel) return;
    panel.classList.toggle('hidden', !this._companion);
  };

  UI.drawHudWoodstock = function (t) {
    if (!this._companion) return;
    const cv = $('#hud-woodstock');
    if (!cv) return;
    try { A.drawWoodstockHud(cv, t); } catch (e) { /* ignore */ }
  };

  UI.setSense = function (s) {
    const chip = $('#ability-sense');
    const status = $('#sense-status');
    const cd = $('#sense-cd');
    if (!chip || !status) return;
    this._companion = !!s.joined;
    this.refreshCompanionVisibility();
    chip.classList.toggle('cooling', !s.ready && !s.active);
    chip.classList.toggle('active', !!s.active);
    if (!s.joined) status.textContent = 'sin Woodstock';
    else if (s.active) status.textContent = 'activo';
    else if (!s.ready) status.textContent = `${Math.ceil(s.cooldown)} s`;
    else status.textContent = 'listo';
    if (cd) cd.style.width = `${Math.round((s.active ? 1 : (s.ratio || 0)) * 100)}%`;
  };

  UI.setCombat = function (active, healLeft) {
    const cc = $('#combat-controls');
    const touch = $('#touch-controls');
    if (cc) cc.classList.toggle('hidden', !active);
    if (touch) touch.classList.toggle('hidden', !!active);
    const count = $('#combat-heal-count');
    if (count) count.textContent = healLeft == null ? 2 : healLeft;
    const heal = $('#btn-combat-heal');
    if (heal) heal.disabled = (healLeft || 0) <= 0;
  };

  UI.setCombatPhase = function (phase, info) {
    const cc = $('#combat-controls');
    if (!cc) return;
    cc.dataset.phase = phase || '';
    const strike = $('#btn-combat-strike');
    const heal = $('#btn-combat-heal');
    const labels = { choose: 'Atacar', aim: '¡AHORA!', incoming: '¡ESQUIVAR!' };
    const showStrike = !!labels[phase];
    const showHeal = phase === 'choose';
    if (strike) {
      strike.classList.toggle('hidden', !showStrike);
      if (showStrike) strike.textContent = labels[phase];
      strike.classList.toggle('is-dodge', phase === 'incoming');
    }
    if (heal) {
      heal.classList.toggle('hidden', !showHeal);
      const uses = info && info.healUses != null ? info.healUses : 0;
      heal.disabled = uses <= 0 || !!(info && info.heartsFull);
      const count = $('#combat-heal-count');
      if (count) count.textContent = Math.max(0, uses);
      const label = heal.querySelector('span');
      if (label) label.textContent = info && info.joined === false ? 'Sin Woodstock' : 'Curar';
    }
  };

  UI.showBanner = function (world, name, tip) {
    const banner = $('#level-banner');
    if (!banner) return;
    $('#banner-world').textContent = world || '';
    $('#banner-name').textContent = name || '';
    $('#banner-tip').textContent = tip || '';
    banner.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => banner.classList.remove('show'), 3600);
  };

  UI.toast = function (text, type, ms) {
    const area = $('#toast-area');
    if (!area) return;
    if (area.children.length >= 3) area.removeChild(area.firstChild);
    const icons = { info: 'i-info', item: 'i-sparkle', secret: 'i-sparkle', heal: 'i-heart', warn: 'i-info', sense: 'i-paw' };
    const labels = { info: 'pequeño mundo', item: 'recuerdo nuevo', secret: 'secreto', heal: 'corazón', warn: 'aviso', sense: 'sentido' };
    const typeKey = type || 'info';
    const el = document.createElement('div');
    el.className = `toast${typeKey === 'item' || typeKey === 'secret' ? ' gold' : ''}`;
    el.innerHTML = `<span class="toast-icon"><svg class="ic"><use href="#${icons[typeKey] || 'i-info'}"></use></svg></span>
      <span class="toast-body"><small>${esc(labels[typeKey] || 'aviso')}</small><span>${esc(text)}</span></span>`;
    area.appendChild(el);
    const timer = setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 360);
    }, ms || 2800);
    toastTimers.push(timer);
    if (toastTimers.length > 12) toastTimers = toastTimers.slice(-8);
  };

  UI.emote = function (text) {
    const el = $('#emote-text');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(emoteTimer);
    emoteTimer = setTimeout(() => el.classList.remove('show'), 2400);
  };

  /* ═══════════════════════════ DIÁLOGOS ═══════════════════════════ */
  UI.setupDialog = function () {
    const overlay = $('#dialog-overlay');
    overlay.addEventListener('click', () => { if (dialog) this.advanceDialog(); });
    $('#dialog-card').addEventListener('click', (e) => {
      e.stopPropagation();
      if (dialog) this.advanceDialog();
    });
  };

  UI.showDialog = function (lines, opts) {
    opts = opts || {};
    if (!lines || !lines.length) {
      if (opts.onDone) opts.onDone();
      return;
    }
    const overlay = $('#dialog-overlay');
    dialog = {
      lines: lines.slice(),
      idx: 0,
      chars: 0,
      typing: false,
      timer: null,
      full: '',
      onDone: opts.onDone || null
    };
    overlay.classList.remove('hidden');
    this.showLine();
  };

  UI.showLine = function () {
    if (!dialog) return;
    const line = dialog.lines[dialog.idx];
    if (!line) { this.finishDialog(false); return; }
    const who = line.who || 'narrator';
    $('#dialog-name').textContent = line.name || '';
    $('#dialog-chip').textContent = line.chip || '';
    const canvas = $('#dialog-portrait');
    try {
      A.drawPortrait(canvas, who, ST.appearance(), performance.now() / 1000);
    } catch (e) { /* ignore */ }
    dialog.full = line.text || '';
    dialog.chars = 0;
    dialog.typing = true;
    const textEl = $('#dialog-text');
    textEl.textContent = '';
    const next = $('#dialog-next');
    if (next) next.style.opacity = '0.45';
    clearInterval(dialog.timer);
    dialog.timer = setInterval(() => {
      if (!dialog) return;
      dialog.chars += 2;
      if (dialog.chars >= dialog.full.length) {
        dialog.chars = dialog.full.length;
        dialog.typing = false;
        clearInterval(dialog.timer);
        if (next) next.style.opacity = '1';
      }
      textEl.textContent = dialog.full.slice(0, dialog.chars);
    }, 16);
    SLW.Audio.sfx('dialog');
  };

  UI.advanceDialog = function () {
    if (!dialog) return;
    if (dialog.typing) {
      clearInterval(dialog.timer);
      dialog.chars = dialog.full.length;
      dialog.typing = false;
      $('#dialog-text').textContent = dialog.full;
      const next = $('#dialog-next');
      if (next) next.style.opacity = '1';
      return;
    }
    dialog.idx++;
    if (dialog.idx >= dialog.lines.length) this.finishDialog(false);
    else { SLW.Audio.sfx('click'); this.showLine(); }
  };

  UI.finishDialog = function (silent) {
    if (!dialog) return;
    clearInterval(dialog.timer);
    const cb = dialog.onDone;
    dialog = null;
    $('#dialog-overlay').classList.add('hidden');
    SLW.Audio.sfx('close');
    if (!silent && cb) cb();
  };

  /* ═══════════════════════════ PAUSA ═══════════════════════════ */
  UI.setupPause = function () {
    $('#btn-resume').addEventListener('click', () => SLW.Game.resumeGame());
    $('#btn-restart').addEventListener('click', () => {
      SLW.Audio.sfx('click');
      this.confirm({
        title: '¿Reiniciar el capítulo?',
        text: 'Volverás al principio del nivel. Los recuerdos que ya hayas guardado en tu mochila seguirán contigo.',
        okText: 'Sí, reiniciar',
        cancelText: 'Seguir jugando',
        onOk: () => {
          this.hidePause();
          SLW.Game.restartLevel();
        },
        onCancel: () => {}
      });
    });
    $('#btn-pause-inventory').addEventListener('click', () => {
      SLW.Audio.sfx('click');
      this.openInventory({});
    });
    $('#btn-pause-map').addEventListener('click', () => {
      SLW.Audio.sfx('click');
      this.confirm({
        title: '¿Volver al mapa?',
        text: 'Dejarás este capítulo a medias. Los recuerdos encontrados y las estrellas de los niveles ya completados se guardan solos.',
        okText: 'Volver al mapa',
        cancelText: 'Quedarme',
        onOk: () => {
          this.hidePause();
          SLW.Game.exitToMap();
        },
        onCancel: () => {}
      });
    });
    $('#btn-pause-sound').addEventListener('click', () => this.toggleSound());
    const overlay = $('#pause-overlay');
    overlay.addEventListener('click', (e) => { if (e.target === overlay) SLW.Game.resumeGame(); });
  };

  UI.showPause = function (fromBlur) {
    $('#pause-overlay').classList.remove('hidden');
    this.syncSound();
    if (fromBlur) {
      const eyebrow = $('#pause-overlay .eyebrow');
      if (eyebrow) eyebrow.textContent = 'Woodstock cuidará el mundo mientras vuelves';
    } else {
      const eyebrow = $('#pause-overlay .eyebrow');
      if (eyebrow) eyebrow.textContent = 'Un respiro entre huesitos';
    }
  };

  UI.hidePause = function () { $('#pause-overlay').classList.add('hidden'); };

  /* ═══════════════════════════ INVENTARIO ═══════════════════════════ */
  UI.setupInventory = function () {
    $('#btn-inv-close').addEventListener('click', () => this.closeInventory());
    $('#btn-inv-resume').addEventListener('click', () => this.closeInventory());
    $('#inv-grid').addEventListener('click', (e) => {
      const item = e.target.closest('.inv-item');
      if (!item || !inv) return;
      inv.selected = item.dataset.id;
      SLW.Audio.sfx('click');
      this.renderInventorySelection();
    });
    $('#inventory-overlay').addEventListener('keydown', (e) => {
      if (!inv) return;
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        const idx = SLW.ITEMS.findIndex(it => it.id === inv.selected);
        const dir = e.code === 'ArrowRight' ? 1 : -1;
        const next = (idx + dir + SLW.ITEMS.length) % SLW.ITEMS.length;
        inv.selected = SLW.ITEMS[next].id;
        this.renderInventorySelection();
      }
    });
  };

  UI.openInventory = function (opts) {
    opts = opts || {};
    const unseen = ST.data.unseen || [];
    const firstFound = SLW.ITEMS.find(it => ST.hasItem(it.id));
    const selected = unseen.find(id => ST.hasItem(id)) || (firstFound ? firstFound.id : SLW.ITEMS[0].id);
    inv = { selected, onClose: opts.onClose || null };
    $('#inventory-overlay').classList.remove('hidden');
    $('#inv-progress').textContent = `${ST.getItemCount()} / ${SLW.ITEMS.length}`;
    const grid = $('#inv-grid');
    grid.innerHTML = SLW.ITEMS.map(it => {
      const found = ST.hasItem(it.id);
      const isNew = found && unseen.indexOf(it.id) >= 0;
      return `<button type="button" class="inv-item${found ? '' : ' locked'}" data-id="${it.id}">
        ${isNew ? '<span class="inv-item-new"></span>' : ''}
        ${found ? '<canvas width="120" height="120"></canvas>' : '<span class="inv-silhouette">?</span>'}
        <span class="inv-item-name">${esc(found ? it.name : '¿?')}</span>
      </button>`;
    }).join('');
    $$('.inv-item canvas', grid).forEach(cv => {
      const item = SLW.ITEM_MAP[cv.closest('.inv-item').dataset.id];
      if (item) {
        try { A.drawItemIcon(cv.getContext('2d'), cv.width, cv.height, item); } catch (e) { /* ignore */ }
      }
    });
    this.renderInventorySelection();
    SLW.Audio.sfx('open');
  };

  UI.renderInventorySelection = function () {
    if (!inv) return;
    const item = SLW.ITEM_MAP[inv.selected] || SLW.ITEMS[0];
    const found = ST.hasItem(item.id);
    $$('.inv-item').forEach(el => el.classList.toggle('selected', el.dataset.id === item.id));
    const cv = $('#inv-detail-canvas');
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (found) {
      try { A.drawItemIcon(ctx, cv.width, cv.height, item); } catch (e) { /* ignore */ }
    } else {
      ctx.save();
      ctx.fillStyle = 'rgba(44,36,64,.1)';
      ctx.beginPath(); ctx.arc(130, 130, 78, 0, Math.PI * 2); ctx.fill();
      ctx.setLineDash([7, 8]);
      ctx.strokeStyle = 'rgba(44,36,64,.22)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(130, 130, 84, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(44,36,64,.28)';
      ctx.font = '800 76px "Baloo 2", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', 130, 134);
      ctx.restore();
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }
    $('#inv-detail-tag').textContent = found ? 'recuerdo encontrado' : 'por descubrir';
    $('#inv-detail-name').textContent = found ? item.name : 'Un recuerdo por descubrir';
    $('#inv-detail-desc').textContent = found
      ? item.desc
      : 'Explora los mundos para encontrar los objetos que Snoopy dejó escondidos entre sus sueños. Woodstock puede ayudarte con su Sentido.';
    const hint = $('#inv-detail-hint span');
    if (hint) {
      hint.textContent = found
        ? 'Está a salvo en tu mochila y se queda contigo para siempre.'
        : 'Algunos recuerdos solo aparecen cuando Woodstock usa su Sentido (Q).';
    }
    $('#inv-footer-note').textContent = `${ST.getItemCount()} de ${SLW.ITEMS.length} recuerdos encontrados`;
  };

  UI.closeInventory = function (silent) {
    if (!inv) return;
    const cb = inv.onClose;
    inv = null;
    $('#inventory-overlay').classList.add('hidden');
    ST.markItemsSeen();
    SLW.Audio.sfx('close');
    if (!silent && cb) cb();
  };

  /* ═══════════════════════════ TRIVIA ═══════════════════════════ */
  UI.setupQuiz = function () {
    $('#btn-quiz-close').addEventListener('click', () => this.closeQuiz());
    $('#quiz-options').addEventListener('click', (e) => {
      const opt = e.target.closest('.quiz-option');
      if (!opt || !quiz || quiz.answered) return;
      this.answerQuiz(Number(opt.dataset.i));
    });
    $('#quiz-progress').addEventListener('click', () => {
      if (quiz && quiz.answered) this.closeQuiz();
    });
  };

  UI.openQuiz = function (payload, opts) {
    opts = opts || {};
    quiz = {
      payload,
      answered: false,
      correct: false,
      correctIndex: payload.question.correct,
      onClose: opts.onClose || null
    };
    $('#quiz-kicker').textContent = payload.kicker || 'La biblioteca de los porqués';
    $('#quiz-question').textContent = payload.question.q;
    $('#quiz-portrait');
    try { A.drawPortrait($('#quiz-portrait'), 'owl', ST.appearance(), performance.now() / 1000); } catch (e) { /* ignore */ }
    const options = $('#quiz-options');
    options.innerHTML = payload.question.options.map((txt, i) => {
      const letter = 'ABCD'[i] || String(i + 1);
      return `<button type="button" class="quiz-option" data-i="${i}">
        <span class="quiz-letter">${letter}</span><span>${esc(txt)}</span>
      </button>`;
    }).join('');
    const fb = $('#quiz-feedback');
    fb.classList.add('hidden');
    fb.className = 'quiz-feedback hidden';
    fb.textContent = '';
    const prog = $('#quiz-progress');
    prog.textContent = `${payload.index} / ${payload.total}`;
    prog.style.cursor = 'default';
    prog.style.textDecoration = 'none';
    const qhint = $('.quiz-hint');
    if (qhint) qhint.innerHTML = `<span class="keycap">1</span> – <span class="keycap">4</span> para responder`;
    $('#quiz-overlay').classList.remove('hidden');
    SLW.Audio.sfx('open');
  };

  UI.answerQuiz = function (i) {
    if (!quiz || quiz.answered) return;
    const payload = quiz.payload;
    quiz.answered = true;
    quiz.correct = i === quiz.correctIndex;
    const buttons = $$('.quiz-option', $('#quiz-options'));
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === quiz.correctIndex) btn.classList.add('correct');
      if (idx === i && !quiz.correct) btn.classList.add('wrong');
    });
    const fb = $('#quiz-feedback');
    fb.classList.remove('hidden');
    fb.classList.add(quiz.correct ? 'good' : 'bad');
    fb.innerHTML = `${quiz.correct ? '¡Exacto!' : 'Casi...'} ${esc(payload.question.fact || '')}`;
    const prog = $('#quiz-progress');
    prog.textContent = 'Continuar →';
    prog.style.cursor = 'pointer';
    prog.style.textDecoration = 'underline';
    const qhint = $('.quiz-hint');
    if (qhint) qhint.innerHTML = 'Pulsa <span class="keycap">E</span> o toca «Continuar»';
    if (quiz.correct) SLW.Audio.sfx('correct'); else SLW.Audio.sfx('wrong');
  };

  UI.closeQuiz = function (silent) {
    if (!quiz) return;
    const state = { answered: quiz.answered, correct: quiz.correct };
    const cb = quiz.onClose;
    quiz = null;
    $('#quiz-overlay').classList.add('hidden');
    SLW.Audio.sfx('close');
    if (!silent && cb) cb(state);
  };

  /* ═══════════════════════════ RESULTADOS ═══════════════════════════ */
  UI.setupResults = function () {
    $('#btn-results-replay').addEventListener('click', () => {
      if (!results) return;
      const id = results.levelId;
      this.hideResults();
      SLW.Game.startLevel(id);
    });
    $('#btn-results-map').addEventListener('click', () => {
      this.hideResults();
      SLW.Game.exitToMap();
    });
  };

  UI.showResults = function (data) {
    results = data;
    const overlay = $('#results-overlay');
    $('#results-kicker').textContent = data.allWorldsDone
      ? '¡Los cuatro mundos están completos!'
      : 'Capítulo completado';
    $('#results-title').textContent = data.levelName;
    let subtitle;
    if (data.stars === 3) subtitle = '¡Perfecto! Ni un susto y todos los huesitos del capítulo.';
    else if (data.stars === 2) subtitle = 'Muy bien. Snoopy está un poquito más cerca.';
    else subtitle = 'El camino sigue abierto. Si vuelves, puedes conseguir más estrellas.';
    $('#results-subtitle').textContent = subtitle;

    $('#results-stars').innerHTML = [1, 2, 3].map(n =>
      `<span class="star${n <= data.stars ? ' on' : ''}"><svg class="ic"><use href="#i-star"></use></svg></span>`).join('');

    $('#results-stats').innerHTML = `
      <div class="result-stat"><svg class="ic"><use href="#i-bone"></use></svg><b>${data.bones} / ${data.totalBones}</b><span>huesitos</span></div>
      <div class="result-stat"><svg class="ic"><use href="#i-book"></use></svg><b>${data.quizCorrect} / ${data.quizAnswered}</b><span>trivia</span></div>
      <div class="result-stat"><svg class="ic"><use href="#i-sparkle"></use></svg><b>x${data.bestCombo || 0}</b><span>mejor combo</span></div>`;

    const unlock = $('#results-unlock');
    let unlockText = '';
    if (data.allWorldsDone) {
      unlockText = '¡El Gran Encuentro se ha abierto! El rincón de los sueños te espera.';
    } else if (data.nextId && data.nextUnlocked) {
      const next = SLW.LEVELS[data.nextId];
      if (next && next.finale) unlockText = '¡El Gran Encuentro se ha abierto!';
      else if (next && next.world !== data.world) unlockText = `¡Mundo ${next.world} desbloqueado: ${this.worldName(next.world)}!`;
      else if (next) unlockText = `¡Nuevo capítulo: ${next.name}!`;
    }
    unlock.classList.toggle('hidden', !unlockText);
    if (unlockText) $('#results-unlock-text').textContent = unlockText;

    const confetti = $('#confetti');
    confetti.innerHTML = '';
    const colors = ['#ffd166', '#ff8fb1', '#7ddcc4', '#a993f0', '#fff3c4'];
    for (let i = 0; i < 34; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDuration = `${1.8 + Math.random() * 1.6}s`;
      piece.style.animationDelay = `${Math.random() * 0.5}s`;
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      confetti.appendChild(piece);
    }

    overlay.classList.remove('hidden');
    SLW.Audio.sfx('goal');
    setTimeout(() => SLW.Audio.sfx('star'), 260);
    setTimeout(() => SLW.Audio.sfx('star'), 520);
  };

  UI.hideResults = function () {
    $('#results-overlay').classList.add('hidden');
    $('#confetti').innerHTML = '';
    results = null;
  };

  UI.worldName = function (id) {
    const w = SLW.WORLDS[id - 1];
    return w ? w.name : 'El rincón de los sueños';
  };

  /* ═══════════════════════════ CONFIRMACIÓN ═══════════════════════════ */
  UI.setupConfirm = function () {
    $('#btn-confirm-ok').addEventListener('click', () => this.finishConfirm(true));
    $('#btn-confirm-cancel').addEventListener('click', () => this.finishConfirm(false));
    $('#confirm-overlay').addEventListener('click', (e) => {
      if (e.target === $('#confirm-overlay')) this.finishConfirm(false);
    });
  };

  UI.confirm = function (opts) {
    opts = opts || {};
    confirmCb = { onOk: opts.onOk, onCancel: opts.onCancel };
    $('#confirm-title').textContent = opts.title || '¿Continuar?';
    $('#confirm-text').textContent = opts.text || '';
    $('#btn-confirm-ok').textContent = opts.okText || 'Sí, continuar';
    $('#btn-confirm-cancel').textContent = opts.cancelText || 'Cancelar';
    $('#confirm-overlay').classList.remove('hidden');
    SLW.Audio.sfx('open');
  };

  UI.finishConfirm = function (ok) {
    $('#confirm-overlay').classList.add('hidden');
    const cb = confirmCb;
    confirmCb = null;
    SLW.Audio.sfx(ok ? 'confirm' : 'back');
    if (!cb) return;
    if (ok && cb.onOk) cb.onOk();
    if (!ok && cb.onCancel) cb.onCancel();
  };

  /* ═══════════════════════════ FINAL ═══════════════════════════ */
  UI.setupEnding = function () {
    $('#ending-next').addEventListener('click', () => this.endingAdvance());
    $('#btn-ending-map').addEventListener('click', () => {
      SLW.Audio.sfx('confirm');
      this.setScreen('map');
    });
    $('#btn-ending-replay').addEventListener('click', () => {
      SLW.Audio.sfx('click');
      this.confirm({
        title: '¿Vivir la aventura otra vez?',
        text: 'Tu explorador conservará su nombre y su aspecto, pero los mundos volverán a estar cerrados y la mochila empezará vacía.',
        okText: 'Sí, empezar de nuevo',
        cancelText: 'Quedarme aquí',
        onOk: () => {
          const app = ST.appearance();
          const name = ST.playerName();
          ST.reset();
          ST.setAppearance(app, name);
          ST.save();
          this.setScreen('map');
        },
        onCancel: () => {}
      });
    });
  };

  UI.startEnding = function () {
    const lines = SLW.DIALOGUES.finale.map(l => ({
      name: (l.name || '').replace(/\{name\}/g, ST.playerName()),
      who: l.who,
      chip: l.chip,
      text: (l.text || '').replace(/\{name\}/g, ST.playerName())
    }));
    ending = { lines, idx: 0, letter: false };
    this.setScreen('ending', { force: true });
    $('#ending-letter').classList.add('hidden');
    $('#ending-stage').classList.remove('hidden');
    this.renderEndingLine();
    SLW.Audio.playMusic('ending');
    SLW.Audio.sfx('heal');
  };

  UI.renderEndingLine = function () {
    if (!ending) return;
    const line = ending.lines[ending.idx];
    if (!line) { this.showEndingLetter(); return; }
    $('#ending-speaker').textContent = line.name;
    $('#ending-line').textContent = line.text;
    const btn = $('#ending-next');
    const last = ending.idx >= ending.lines.length - 1;
    btn.innerHTML = `${last ? 'Abrir la carta' : 'Continuar'} <svg class="ic"><use href="#i-right"></use></svg>`;
    try {
      A.drawPortrait($('#ending-portrait'), line.who || 'narrator', ST.appearance(), performance.now() / 1000);
    } catch (e) { /* ignore */ }
    SLW.Audio.sfx('dialog');
  };

  UI.endingAdvance = function () {
    if (!ending) return;
    if (ending.idx >= ending.lines.length - 1) { this.showEndingLetter(); return; }
    ending.idx++;
    SLW.Audio.sfx('click');
    this.renderEndingLine();
  };

  UI.showEndingLetter = function () {
    if (!ending) return;
    ending.letter = true;
    $('#ending-stage').classList.add('hidden');
    $('#ending-letter').classList.remove('hidden');
    const name = ST.playerName();
    const personal = window.SLW_PERSONAL || {};
    const raw = (personal.dedication && personal.dedication.trim()) || SLW.ENDING_FALLBACK;
    const dedication = raw.replace(/\{name\}/g, name);
    const paragraphs = dedication.split(/\n{1,}/).map(p => p.trim()).filter(Boolean);
    const body = `<p>Para <span class="letter-highlight">${esc(name)}</span>,</p>` +
      paragraphs.map(p => `<p>${esc(p)}</p>`).join('');
    $('#ending-letter-body').innerHTML = body;

    const signB = $('#ending-letter .letter-sign b');
    if (signB) {
      const sig = (personal.signature && personal.signature.trim()) || 'Snoopy & Woodstock';
      signB.innerHTML = esc(sig).replace(/&amp;/g, '<span class="amp">&</span>');
    }

    const stars = ST.totalStars();
    const maxStars = ST.maxStars();
    const bones = ST.totalBones();
    const items = ST.getItemCount();
    $('#ending-stats').innerHTML = `
      <span><svg class="ic"><use href="#i-star"></use></svg>${stars} / ${maxStars} estrellas</span>
      <span><svg class="ic"><use href="#i-bone"></use></svg>${bones} huesitos</span>
      <span><svg class="ic"><use href="#i-sparkle"></use></svg>${items} / ${SLW.ITEMS.length} recuerdos</span>
      <span><svg class="ic"><use href="#i-heart"></use></svg>8 capítulos y un Snoopy</span>`;
    SLW.Audio.sfx('item');
    setTimeout(() => SLW.Audio.sfx('star'), 400);
  };

  /* ═══════════════════════════ TECLADO GLOBAL ═══════════════════════════ */
  UI.globalKeys = function (e) {
    const dialogOpen = dialog && !$('#dialog-overlay').classList.contains('hidden');
    const quizOpen = quiz && !$('#quiz-overlay').classList.contains('hidden');
    const invOpen = inv && !$('#inventory-overlay').classList.contains('hidden');
    const confirmOpen = confirmCb && !$('#confirm-overlay').classList.contains('hidden');
    const endingOpen = this.screen === 'ending' && ending && !ending.letter;

    if (dialogOpen) {
      if (['Space', 'Enter', 'KeyE'].indexOf(e.code) >= 0) {
        e.preventDefault(); e.stopPropagation();
        this.advanceDialog();
      }
      return;
    }
    if (quizOpen) {
      if (quiz.answered) {
        if (['Space', 'Enter', 'KeyE'].indexOf(e.code) >= 0) {
          e.preventDefault(); e.stopPropagation();
          this.closeQuiz();
        }
        return;
      }
      if (e.code === 'Escape') {
        e.preventDefault(); this.closeQuiz();
        return;
      }
      if (/^Digit[1-4]$/.test(e.code)) {
        const i = Number(e.code.slice(5)) - 1;
        if (i >= 0 && i < quiz.payload.question.options.length) {
          e.preventDefault(); this.answerQuiz(i);
        }
      }
      return;
    }
    if (confirmOpen) {
      if (e.code === 'Escape') { e.preventDefault(); this.finishConfirm(false); }
      if (e.code === 'Enter') { e.preventDefault(); this.finishConfirm(true); }
      return;
    }
    if (invOpen) {
      if (e.code === 'Escape' || e.code === 'KeyI') {
        e.preventDefault();
        this.closeInventory();
      }
      return;
    }
    if (endingOpen) {
      if (['Space', 'Enter'].indexOf(e.code) >= 0) {
        e.preventDefault();
        this.endingAdvance();
      }
      return;
    }
    if (this.screen === 'creator' && e.code === 'Enter') {
      const input = document.activeElement;
      if (input && input.id === 'char-name') {
        e.preventDefault();
        $('#btn-creator-confirm').click();
      }
    }
  };

  /* ═══════════════════════════ OVERLAYS ═══════════════════════════ */
  UI.closeAllOverlays = function (silent) {
    silent = silent === undefined ? true : silent;
    if (dialog) {
      clearInterval(dialog.timer);
      dialog = null;
      $('#dialog-overlay').classList.add('hidden');
    }
    if (quiz) { quiz = null; $('#quiz-overlay').classList.add('hidden'); }
    if (inv) { inv = null; $('#inventory-overlay').classList.add('hidden'); }
    if (results) { this.hideResults(); }
    confirmCb = null;
    $('#confirm-overlay').classList.add('hidden');
    this.hidePause();
    void silent;
  };

  UI.isOverlayOpen = function () {
    if (dialog || quiz || inv || results || confirmCb) return true;
    return !$('#pause-overlay').classList.contains('hidden');
  };

  UI.blocksGameKeys = function () {
    return !!(dialog || quiz || inv || results || confirmCb);
  };
})();
