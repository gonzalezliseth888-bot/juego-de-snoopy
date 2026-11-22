/* ═══════════════════════════════════════════════════════════════
   GAME — motor de juego: físicas, niveles, combates, Woodstock
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const SLW = window.SLW;
  const G = SLW.Game = {};
  const W = 1280, H = 720;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const pad2 = n => String(n).padStart(2, '0');

  G.levelId = null;
  G.level = null;
  G.running = false;
  G.paused = false;
  G.uiBlock = false;
  G.finished = false;
  G.time = 0;
  G.lastTs = 0;
  G.raf = null;
  G.pixelRatio = 1;
  G.keys = {};
  G.touch = {};
  G.player = null;
  G.woodstock = null;
  G.cam = { x: 0, y: 0 };
  G.shake = 0;
  G.flashRed = 0;
  G.particles = [];
  G.floats = [];
  G.effects = [];
  G.prompt = null;
  G.combat = null;
  G.introDelay = 0;
  G.introPending = null;
  G.finishTimer = 0;
  G.senseTimer = 0;
  G.senseCd = 0;
  G.healUses = 2;
  G.senseUiTimer = 0;
  G.joined = false;
  G.newItems = 0;
  G.quizBonus = 0;
  G.bestCombo = 0;
  G.combo = 0;

  G.stats = { bones: 0, deaths: 0, bestCombo: 0, quizCorrect: 0, quizAnswered: 0, itemsFound: 0 };

  /* ═══════════════════════════ SETUP ═══════════════════════════ */
  G.init = function () {
    this.canvas = document.getElementById('game-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.bindInput();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.running && !this.paused && !this.uiBlock && !this.finished) this.pauseGame(true);
    });
    window.addEventListener('blur', () => {
      this.keys = {}; this.touch = {};
    });
  };

  G.resize = function () {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.pixelRatio = dpr;
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
  };

  G.hasCompanion = function () {
    return !!SLW.State.getFlag('joined') || this.joined;
  };

  G.startLevel = function (levelId, opts) {
    const level = SLW.LEVELS[levelId];
    if (!level) return;
    if (SLW.UI) {
      SLW.UI.closeAllOverlays();
      SLW.UI.setScreen('game');
    }
    this.levelId = levelId;
    this.level = level;
    this.finished = false;
    this.paused = false;
    this.uiBlock = false;
    this.combat = null;
    this.time = 0;
    this.lastTs = 0;
    this.particles = [];
    this.floats = [];
    this.effects = [];
    this.prompt = null;
    this.introPending = level.intro ? SLW.DIALOGUES[level.intro] : null;
    this.introDelay = 0.9;
    this.finishTimer = 0;
    this.shake = 0;
    this.flashRed = 0;
    this.senseTimer = 0;
    this.senseCd = 0;
    this.senseUiTimer = 0;
    this.healUses = 2;
    this.stats = { bones: 0, deaths: 0, bestCombo: 0, quizCorrect: 0, quizAnswered: 0, itemsFound: 0 };
    this.newItems = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.joined = this.hasCompanion();

    // salvaguarda narrativa: en mundos posteriores Woodstock ya está contigo
    if (!this.joined && level.world > 1) {
      this.joined = true;
      SLW.State.setFlag('joined', true);
    }

    const spawn = level.spawn;
    this.player = {
      x: spawn.x, y: spawn.y, vx: 0, vy: 0, w: 38, h: 100,
      facing: 1, onGround: false, coyote: 0, jumpBuffer: 0,
      jumpHeld: false, jumpCut: false, anim: 'idle', phase: 0,
      hearts: 3, maxHearts: 3, invuln: 0, hurtTimer: 0, attackTimer: 0,
      lastSafe: { x: spawn.x, y: spawn.y }
    };
    this.respawnPoint = { x: spawn.x, y: spawn.y };
    this.woodstock = {
      x: spawn.x - 60, y: spawn.y - 100, vx: 0, vy: 0,
      facing: 1, visible: this.joined, emote: null, emoteT: 0, peck: 0, glow: 0
    };
    this.cam.x = clamp(spawn.x - W * 0.42, 0, Math.max(0, level.length - W));
    this.cam.y = clamp(spawn.y - H * 0.72, -130, 220);

    // entidades dinámicas
    const src = this.levelData = level;
    this.bones = (level.bones || []).map(b => ({ x: b.x, y: b.y, taken: false, secret: false }))
      .concat((level.hiddenBones || []).map(b => ({ x: b.x, y: b.y, taken: false, secret: true })));
    this.items = (level.items || []).map(it => ({
      id: it.id, x: it.x, y: it.y, secret: !!it.secret,
      taken: SLW.State.hasItem(it.id), item: SLW.ITEM_MAP[it.id]
    })).filter(it => it.item);
    this.npcs = (level.npcs || []).map(n => ({ type: n.type, x: n.x, y: n.y, done: false, talked: false }))
      .filter(n => !(n.type === 'woodstock' && this.joined));
    this.quizzes = (level.quizzes || []).map((q, i) => ({
      x: q.x, y: q.y, qid: q.qid, id: q.stationId, solved: false, wrong: false, index: i
    }));
    this.signs = (level.signs || []).map(s => ({ x: s.x, y: s.y, def: s.def, read: false }));
    this.enemies = (level.enemies || []).map(e => ({
      type: e.type, x: e.x, y: e.y, hp: e.hp || 5, maxHp: e.hp || 5,
      boss: !!e.boss, dead: false, flash: 0, engaged: false
    }));
    this.checkpoints = (level.checkpoints || []).map(c => ({ x: c.x, y: c.y, active: false }));
    this.goal = level.goal ? { x: level.goal.x, y: level.goal.y, open: true } : null;
    this.gate = level.bossGate ? { x: level.bossGate.x, y: level.bossGate.y, open: !this.enemies.some(e => e.boss) } : null;
    this.finaleNpc = this.npcs.find(n => n.type === 'snoopy') || null;

    this.physicsPlatforms = (level.platforms || []).map(p => Object.assign({}, p));

    // huesitos potenciales: físicos + trivias
    this.physicalBones = this.bones.length;
    this.totalBones = this.physicalBones + this.quizzes.length * 5;

    // HUD
    if (SLW.UI) {
      SLW.UI.setHearts(this.player.hearts, this.player.maxHearts);
      SLW.UI.setLevelLabel(level.id, level.name);
      SLW.UI.setBones(0, this.totalBones);
      SLW.UI.setCompanion(this.joined);
      SLW.UI.setSense({ joined: this.joined, active: false, ready: true, cooldown: 0 });
      SLW.UI.setCombat(false, this.healUses);
      const wm = this.worldLabel(level.world);
      SLW.UI.showBanner(wm, level.name, level.tip || '');
    }

    SLW.State.incrementPlay(levelId);

    if (SLW.Audio) {
      SLW.Audio.init();
      SLW.Audio.playMusic(level.theme);
    }

    this.keys = {}; this.touch = {};
    this.running = true;
    this.raf = requestAnimationFrame(ts => this.loop(ts));
  };

  G.worldLabel = function (id) {
    if (id === 5) return 'El rincón de los sueños';
    const w = SLW.WORLDS[id - 1];
    return w ? w.name : 'Mundo';
  };

  G.restartLevel = function () {
    if (!this.levelId) return;
    if (SLW.UI) SLW.UI.closeAllOverlays();
    this.startLevel(this.levelId);
  };

  G.exitToMap = function () {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.paused = false;
    this.uiBlock = false;
    this.combat = null;
    if (SLW.Audio) SLW.Audio.playMusic('map');
    if (SLW.UI) {
      SLW.UI.closeAllOverlays();
      SLW.UI.setScreen('map');
      SLW.UI.refreshMap();
    }
  };

  /* ═══════════════════════════ BUCLE ═══════════════════════════ */
  G.loop = function (ts) {
    if (!this.running) return;
    this.raf = requestAnimationFrame(t => this.loop(t));
    if (!this.lastTs) this.lastTs = ts;
    let dt = (ts - this.lastTs) / 1000;
    this.lastTs = ts;
    if (!isFinite(dt) || dt < 0) dt = 0.016;
    dt = Math.min(dt, 0.05);

    if (!this.paused) {
      this.time += dt;
      if (!this.uiBlock) this.update(dt);
      else this.updatePassive(dt);
    }
    this.render();
  };

  G.updatePassive = function (dt) {
    // efectos visuales que siguen vivos tras los diálogos
    this.updateParticles(dt);
    this.shake = Math.max(0, this.shake - dt);
    this.flashRed = Math.max(0, this.flashRed - dt);
    if (this.player) {
      this.player.anim = 'idle';
      this.player.phase += dt * 2;
    }
    if (this.woodstock && this.joined) {
      this.woodstock.emoteT = Math.max(0, (this.woodstock.emoteT || 0) - dt);
      this.woodstock.glow = Math.max(0, this.woodstock.glow - dt);
      this.woodstock.y = lerp(this.woodstock.y, this.player.y - 100, Math.min(1, dt * 3));
      this.woodstock.x = lerp(this.woodstock.x, this.player.x - this.player.facing * 65, Math.min(1, dt * 3));
    }
    this.updateCamera(dt, true);
  };

  G.update = function (dt) {
    const p = this.player;
    const lvl = this.level;
    const t = this.time;

    this.introDelay = Math.max(0, this.introDelay - dt);
    if (this.introDelay === 0 && this.introPending && !this.finished) {
      const lines = this.introPending;
      this.introPending = null;
      if (!SLW.State.introSeen(lvl.id)) {
        SLW.State.markIntroSeen(lvl.id);
        this.openDialog(this.prepareLines(lines), () => {});
      }
    }

    if (this.finished) {
      p.anim = 'cheer';
      p.phase += dt * 3;
      this.finishTimer -= dt;
      this.updateWoodstock(dt, true);
      this.updateParticles(dt);
      this.updateCamera(dt);
      this.shake = Math.max(0, this.shake - dt);
      this.flashRed = Math.max(0, this.flashRed - dt);
      if (this.finishTimer <= 0 && !this.resultsShown) {
        this.resultsShown = true;
        this.finishLevelNow();
      }
      return;
    }

    if (this.combat) {
      this.updateCombat(dt);
      p.vx = 0;
      p.anim = p.attackTimer > 0 ? 'cheer' : 'idle';
      p.phase += dt * 4;
      p.hurtTimer = Math.max(0, p.hurtTimer - dt);
      p.attackTimer = Math.max(0, p.attackTimer - dt);
      this.updateWoodstock(dt, false);
      this.updateCamera(dt);
      this.updateParticles(dt);
      this.shake = Math.max(0, this.shake - dt);
      this.flashRed = Math.max(0, this.flashRed - dt);
      return;
    }

    /* ── movimiento horizontal ── */
    const left = this.keys.left || this.touch.left;
    const right = this.keys.right || this.touch.right;
    const running = this.keys.run || this.touch.run;
    let dir = (right ? 1 : 0) - (left ? 1 : 0);
    const accel = p.onGround ? 2600 : 1600;
    const maxSpeed = running ? 430 : 255;
    const targetVx = dir * maxSpeed;
    if (dir !== 0) {
      p.vx += clamp(targetVx - p.vx, -accel * dt, accel * dt);
      p.facing = dir;
    } else {
      const fr = p.onGround ? 2400 : 700;
      if (p.vx > 0) p.vx = Math.max(0, p.vx - fr * dt);
      else if (p.vx < 0) p.vx = Math.min(0, p.vx + fr * dt);
    }
    if (Math.abs(p.vx) > maxSpeed) p.vx = clamp(p.vx, -maxSpeed - 40, maxSpeed + 40);

    /* ── salto ── */
    this.coyote = Math.max(0, (this.coyote || 0) - dt);
    if (p.onGround) this.coyote = 0.11;
    p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    if (p.jumpBuffer > 0 && (p.onGround || this.coyote > 0)) {
      p.vy = -875;
      p.onGround = false;
      this.coyote = 0;
      p.jumpBuffer = 0;
      p.jumpCut = false;
      if (SLW.Audio) SLW.Audio.sfx('jump');
      this.emitDust(p.x, p.y, 5);
    }
    if (!p.jumpHeld && p.vy < -140 && !p.jumpCut) {
      p.vy *= 0.55;
      p.jumpCut = true;
    }

    /* ── físicas ── */
    p.vy = Math.min(p.vy + 2350 * dt, 1250);
    this.movePlayer(dt);

    p.x = clamp(p.x, 18, lvl.length - 18);
    if (this.gate && !this.gate.open) {
      p.x = Math.min(p.x, this.gate.x - 54);
    }

    /* ── estado de animación ── */
    p.invuln = Math.max(0, p.invuln - dt);
    p.hurtTimer = Math.max(0, p.hurtTimer - dt);
    p.attackTimer = Math.max(0, p.attackTimer - dt);
    if (p.hurtTimer > 0) p.anim = 'hurt';
    else if (!p.onGround) p.anim = p.vy < 0 ? 'jump' : 'fall';
    else if (Math.abs(p.vx) > 310) p.anim = 'run';
    else if (Math.abs(p.vx) > 24) p.anim = 'walk';
    else p.anim = 'idle';
    p.phase += dt * (p.anim === 'run' ? 15 : p.anim === 'walk' ? 9.5 : 2);

    // pasos
    if (p.onGround && Math.abs(p.vx) > 40) {
      this.stepTimer = (this.stepTimer || 0) - dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = p.anim === 'run' ? 0.2 : 0.32;
        if (SLW.Audio) SLW.Audio.sfx('step');
      }
    }

    // zona segura
    if (p.onGround && p.y < 760 && !this.combat) {
      p.lastSafe.x = p.x; p.lastSafe.y = p.y;
    }

    // caer al vacío
    if (p.y > 940) this.fallDamage();

    this.updateWoodstock(dt, false);

    // habilidades
    this.senseCd = Math.max(0, this.senseCd - dt);
    if (this.senseTimer > 0) {
      this.senseTimer -= dt;
      this.woodstock.glow = 0.4;
      if (this.senseTimer <= 0) {
        if (SLW.UI) SLW.UI.toast('Woodstock descansa un ratito. Vuelve a llamarlo con Q.', 'info', 2600);
      }
    }
    this.senseUiTimer -= dt;
    if (this.senseUiTimer <= 0) {
      this.senseUiTimer = 0.2;
      this.pushSenseUi();
    }

    // recolecciones y zonas
    this.collectNearby();
    this.checkCheckpoints();
    this.checkEnemyTriggers();
    this.checkAutoJoin();
    this.prompt = this.findPrompt();

    this.updateCamera(dt);
    this.updateParticles(dt);
    this.shake = Math.max(0, this.shake - dt);
    this.flashRed = Math.max(0, this.flashRed - dt);
  };

  /* ═══════════════════════════ FÍSICAS ═══════════════════════════ */
  G.movePlayer = function (dt) {
    const p = this.player;
    const plats = this.physicsPlatforms;
    const hw = p.w / 2;
    const prevFeet = p.y;

    // horizontal
    p.x += p.vx * dt;
    for (const pl of plats) {
      if (pl.kind !== 'block') continue;
      const py0 = p.y - p.h;
      if (p.x + hw > pl.x && p.x - hw < pl.x + pl.w && py0 < pl.y + pl.h && p.y > pl.y + 3) {
        if (p.vx > 0) { p.x = pl.x - hw; p.vx = 0; }
        else if (p.vx < 0) { p.x = pl.x + pl.w + hw; p.vx = 0; }
      }
    }

    // vertical
    p.y += p.vy * dt;
    let landed = false;
    if (p.vy >= 0) {
      let bestTop = Infinity;
      for (const pl of plats) {
        if (!pl.oneway && pl.kind === 'block') continue; // los bloques se tratan abajo
        if (p.x + hw < pl.x + 2 || p.x - hw > pl.x + pl.w - 2) continue;
        if (prevFeet <= pl.y + 6 && p.y >= pl.y && pl.y < bestTop) {
          bestTop = pl.y;
        }
      }
      // bloques también como suelo
      for (const pl of plats) {
        if (pl.kind === 'block') {
          if (p.x + hw < pl.x + 2 || p.x - hw > pl.x + pl.w - 2) continue;
          if (prevFeet <= pl.y + 6 && p.y >= pl.y && pl.y < bestTop) bestTop = pl.y;
        }
      }
      if (bestTop !== Infinity) {
        p.y = bestTop;
        p.vy = 0;
        landed = true;
      }
    } else {
      // techo
      const head = p.y - p.h;
      const prevHead = prevFeet - p.h;
      for (const pl of plats) {
        if (pl.kind !== 'block') continue;
        if (p.x + hw < pl.x + 2 || p.x - hw > pl.x + pl.w - 2) continue;
        const bottom = pl.y + pl.h;
        if (head <= bottom && prevHead >= bottom - 1) {
          p.y = bottom + p.h;
          p.vy = 0;
          break;
        }
      }
    }
    const wasGround = p.onGround;
    p.onGround = landed;
    if (landed && !wasGround) {
      this.emitDust(p.x, p.y, 8);
      if (this.combat === null && SLW.Audio) SLW.Audio.sfx('land');
    }
  };

  /* ═══════════════════════════ COMPAÑERO ═══════════════════════════ */
  G.updateWoodstock = function (dt, cheering) {
    const w = this.woodstock;
    const p = this.player;
    if (!this.joined) { w.visible = false; return; }
    w.visible = true;

    let tx = p.x - p.facing * 68;
    let ty = p.y - 102;
    if (this.combat) {
      tx = p.x - p.facing * 58;
      ty = p.y - 108;
    }

    // durante el Sentido, Woodstock busca el secreto más cercano
    if (this.senseTimer > 0 && !this.combat) {
      const secret = this.nearestSecret(540);
      if (secret) {
        tx = lerp(p.x, secret.x, 0.55);
        ty = lerp(p.y - 80, secret.y - 40, 0.55);
        w.emote = 'star';
      } else {
        w.emote = 'alert';
      }
    } else if (w.emoteT <= 0) {
      w.emote = null;
    }

    const ease = Math.min(1, dt * (this.combat ? 5 : 3.4));
    const nx = lerp(w.x, tx, ease);
    const ny = lerp(w.y, ty + Math.sin(this.time * 3.2) * 8, ease);
    w.vx = (nx - w.x) / Math.max(dt, 0.001);
    if (Math.abs(w.vx) > 30) w.facing = w.vx > 0 ? 1 : -1;
    w.x = nx; w.y = ny;

    if (cheering) { w.emote = 'heart'; }
    w.emoteT = Math.max(0, w.emoteT - dt);
    w.peck = Math.max(0, (w.peck || 0) - dt);
    w.glow = Math.max(0, (w.glow || 0) - dt);

    if (w.emoteT <= 0 && !cheering) w.emote = null;

    // lejano: se acerca volando
    if (Math.abs(w.x - p.x) > 500) { w.x = p.x - p.facing * 70; w.y = p.y - 120; }
  };

  G.emoteWoodstock = function (type, seconds) {
    if (!this.woodstock) return;
    this.woodstock.emote = type;
    this.woodstock.emoteT = seconds || 2;
  };

  G.nearestSecret = function (maxDist) {
    let best = null, bd = maxDist == null ? 9999 : maxDist;
    const p = this.player;
    this.bones.forEach(b => {
      if (!b.taken && b.secret) {
        const d = dist(p.x, p.y - 50, b.x, b.y);
        if (d < bd) { bd = d; best = b; }
      }
    });
    this.items.forEach(it => {
      if (!it.taken && it.secret) {
        const d = dist(p.x, p.y - 50, it.x, it.y - 30);
        if (d < bd) { bd = d; best = it; }
      }
    });
    return best;
  };

  /* ═══════════════════════════ HABILIDADES ═══════════════════════════ */
  G.useSense = function () {
    if (!this.joined) {
      if (SLW.UI) SLW.UI.toast('Woodstock aún no está contigo. Sigue el camino.', 'info');
      return;
    }
    if (this.senseCd > 0) {
      if (SLW.UI) SLW.UI.toast(`El Sentido descansa: faltan ${Math.ceil(this.senseCd)} s.`, 'info', 1600);
      return;
    }
    if (this.combat || this.finished || this.uiBlock) return;
    this.senseCd = 12;
    this.senseTimer = 5.2;
    this.senseUiTimer = 0;
    this.woodstock.glow = 0.5;
    this.emoteWoodstock('star', 3);
    if (SLW.Audio) SLW.Audio.sfx('sense');
    const secret = this.nearestSecret(600);
    if (secret) {
      if (SLW.UI) SLW.UI.toast('¡Woodstock siente un recuerdo escondido muy cerca!', 'sense', 2800);
    } else {
      if (SLW.UI) SLW.UI.toast('Woodstock escucha... pero no hay secretos cerca.', 'info', 2000);
    }
    this.emitRing(this.player.x, this.player.y - 60, '#ffe39a');
    this.pushSenseUi();
  };

  G.pushSenseUi = function () {
    if (!SLW.UI) return;
    SLW.UI.setSense({
      joined: this.joined,
      active: this.senseTimer > 0,
      ready: this.senseCd <= 0,
      cooldown: Math.max(0, this.senseCd),
      ratio: 1 - clamp(this.senseCd / 12, 0, 1)
    });
  };

  G.doHeal = function () {
    if (this.combat) { this.combatHeal(); return; }
    if (!this.joined) {
      if (SLW.UI) SLW.UI.toast('Necesitas a Woodstock para curarte.', 'info');
      return;
    }
    if (this.healUses <= 0) {
      if (SLW.UI) SLW.UI.toast('Woodstock ya usó sus dos plumas en este nivel.', 'warn');
      if (SLW.Audio) SLW.Audio.sfx('wrong');
      return;
    }
    const p = this.player;
    if (p.hearts >= p.maxHearts) {
      if (SLW.UI) SLW.UI.toast('¡Tu energía ya está completa!', 'info', 1600);
      return;
    }
    this.healUses--;
    p.hearts = Math.min(p.maxHearts, p.hearts + 1);
    p.invuln = Math.max(p.invuln, 0.8);
    if (SLW.UI) {
      SLW.UI.setHearts(p.hearts, p.maxHearts);
      SLW.UI.setCombat(!!this.combat, this.healUses);
      SLW.UI.toast('Woodstock te regala una pluma curativa. +1 corazón', 'heal', 2200);
    }
    if (SLW.Audio) SLW.Audio.sfx('heal');
    this.emoteWoodstock('heart', 2);
    this.woodstock.peck = 0;
    this.emitHearts(p.x, p.y - 80, 7);
  };

  /* ═══════════════════════════ INTERACCIÓN ═══════════════════════════ */
  G.findPrompt = function () {
    const p = this.player;
    const px = p.x, py = p.y;
    let best = null, bd = Infinity;
    const consider = (obj, type, label, radius) => {
      const d = Math.abs(obj.x - px);
      const dy = Math.abs((obj.y || py) - py);
      if (d < radius && dy < 180) {
        const score = d + dy * 0.5;
        if (score < bd) { bd = score; best = { type, obj, label }; }
      }
    };
    this.signs.forEach(s => { if (!s.read) consider(s, 'sign', 'Leer el cartel', 86); });
    this.npcs.forEach(n => {
      if (n.done) return;
      if (n.type === 'woodstock') consider(n, 'npc', 'Hablar con Woodstock', 110);
      else if (n.type === 'snoopy') consider(n, 'npc', 'Acercarte a Snoopy', 130);
      else {
        const def = SLW.NPCS[n.type];
        consider(n, 'npc', `Hablar con ${def ? def.name : 'un amigo'}`, 100);
      }
    });
    this.quizzes.forEach(q => {
      if (!q.solved) consider(q, 'quiz', 'Responder al Búho', 96);
    });
    if (this.goal) consider(this.goal, 'goal', 'Abrir la puerta del recuerdo', 100);
    return best;
  };

  G.interact = function () {
    if (this.finished || this.uiBlock || this.paused || this.combat) return;
    const prompt = this.prompt || this.findPrompt();
    if (!prompt) return;
    if (prompt.type === 'sign') this.readSign(prompt.obj);
    else if (prompt.type === 'npc') this.talkTo(prompt.obj);
    else if (prompt.type === 'quiz') this.openQuiz(prompt.obj);
    else if (prompt.type === 'goal') this.finishLevel();
  };

  G.readSign = function (sign) {
    sign.read = true;
    const def = SLW.SIGNS[sign.def] || SLW.SIGNS.move;
    const lines = def.lines.map((txt, i) => ({
      name: def.title, who: 'narrator', chip: i === 0 ? 'pista' : 'cartel', text: txt
    }));
    if (SLW.Audio) SLW.Audio.sfx('open');
    this.openDialog(lines, () => {});
  };

  G.talkTo = function (npc) {
    const def = SLW.NPCS[npc.type] || { name: 'Amigo', who: 'narrator', chip: 'amigo' };
    if (npc.type === 'snoopy') {
      // el encuentro se vive completo en la animación final (sin repetir el diálogo aquí)
      if (SLW.Audio) SLW.Audio.sfx('heal');
      this.finishAdventure();
      return;
    }
    let lines;
    if (npc.type === 'woodstock' && !this.joined) {
      lines = this.prepareLines(SLW.DIALOGUES.woodstockJoin);
      if (SLW.Audio) SLW.Audio.sfx('open');
      this.openDialog(lines, () => this.joinWoodstock(npc));
      return;
    }
    if (def.dialogue && SLW.DIALOGUES[def.dialogue]) {
      lines = this.prepareLines(SLW.DIALOGUES[def.dialogue]);
    } else {
      const pages = def.pages || [{ text: '¡Hola! Qué bonito día para pasear por el Pequeño Mundo.' }];
      const idx = (npc.talkIndex || 0) % pages.length;
      npc.talkIndex = idx + 1;
      lines = [{ name: def.name, who: def.who, chip: def.chip || 'amigo', text: pages[idx].text }];
    }
    if (SLW.Audio) SLW.Audio.sfx('open');
    this.openDialog(lines, () => {});
  };

  G.prepareLines = function (lines) {
    const name = SLW.State.playerName();
    return (lines || []).map(l => Object.assign({}, l, {
      name: (l.name || '').replace(/\{name\}/g, name),
      text: (l.text || '').replace(/\{name\}/g, name)
    }));
  };

  G.openDialog = function (lines, onDone) {
    if (!SLW.UI) { if (onDone) onDone(); return; }
    this.uiBlock = true;
    this.keys = {}; this.touch = {};
    SLW.UI.showDialog(lines, {
      onDone: () => {
        this.uiBlock = false;
        this.lastTs = 0;
        if (onDone) onDone();
      }
    });
  };

  G.joinWoodstock = function (npc) {
    this.joined = true;
    SLW.State.setFlag('joined', true);
    npc.done = true;
    this.woodstock.visible = true;
    this.woodstock.x = npc.x;
    this.woodstock.y = npc.y;
    this.woodstock.emote = 'heart';
    this.woodstock.emoteT = 3;
    this.emitHearts(this.player.x, this.player.y - 90, 10);
    if (SLW.UI) {
      SLW.UI.setCompanion(true);
      SLW.UI.setSense({ joined: true, active: false, ready: true, cooldown: 0 });
      SLW.UI.toast('Woodstock se unió a tu aventura. Pulsa Q para usar su Sentido.', 'heal', 4200);
      SLW.UI.emote('¡Pío-pío!');
    }
    if (SLW.Audio) SLW.Audio.sfx('checkpoint');
  };

  G.checkAutoJoin = function () {
    if (this.joined) return;
    const w = this.npcs.find(n => n.type === 'woodstock' && !n.done);
    if (w && Math.abs(this.player.x - w.x) < 105) {
      this.talkTo(w);
    }
  };

  G.collectNearby = function () {
    const p = this.player;
    const cy = p.y - 52;
    this.bones.forEach(b => {
      if (b.taken) return;
      if (b.secret && this.senseTimer <= 0) return;
      if (Math.abs(b.x - p.x) < 46 && Math.abs(b.y - cy) < 62) {
        b.taken = true;
        this.stats.bones++;
        this.totalBones += 0; // el total ya lo incluía
        this.emitBurst(b.x, b.y, 8, ['#ffd166', '#fff3c4', '#ffb340'], 'spark');
        this.addFloat(b.x, b.y - 18, '+1', '#ffe08a', 20);
        if (SLW.Audio) SLW.Audio.sfx('bone');
        if (SLW.UI) SLW.UI.setBones(this.stats.bones, this.totalBones);
        if (b.secret) { this.emoteWoodstock('star', 2); this.addFloat(b.x, b.y - 44, '¡secreto!', '#ffe08a', 18); }
      }
    });
    this.items.forEach(it => {
      if (it.taken) return;
      if (it.secret && this.senseTimer <= 0) return;
      const ix = it.x, iy = it.y - 38 + Math.sin(this.time * 2 + it.x) * 4;
      if (Math.abs(ix - p.x) < 62 && Math.abs(iy - cy) < 78) {
        it.taken = true;
        const isNew = SLW.State.addItem(it.id);
        this.stats.itemsFound++;
        if (isNew) this.newItems++;
        this.emitBurst(ix, iy, 22, ['#ffd166', '#ff8fb1', '#7ddcc4', '#fff3c4'], 'star');
        this.emitRing(ix, iy, '#ffe9b0');
        this.addFloat(ix, iy - 40, '¡Recuerdo!', '#fff3c4', 24);
        if (SLW.Audio) SLW.Audio.sfx(it.secret ? 'secret' : 'item');
        this.emoteWoodstock('heart', 2.4);
        if (SLW.UI) {
          SLW.UI.toast(`Nuevo recuerdo: ${it.item.name}`, 'item', 3400);
          SLW.UI.emote('¡Un recuerdo nuevo!');
        }
      }
    });
  };

  G.checkCheckpoints = function () {
    const p = this.player;
    this.checkpoints.forEach(c => {
      if (c.active) return;
      if (Math.abs(c.x - p.x) < 66 && Math.abs(c.y - p.y) < 110) {
        c.active = true;
        this.respawnPoint = { x: p.lastSafe.x, y: p.lastSafe.y };
        this.emitBurst(c.x, c.y - 70, 12, ['#ffd166', '#fff3c4'], 'star');
        if (SLW.Audio) SLW.Audio.sfx('checkpoint');
        if (SLW.UI) SLW.UI.toast('Punto de descanso recordado. Respiras tranquilo.', 'heal', 2200);
      }
    });
  };

  G.checkEnemyTriggers = function () {
    if (this.combat || this.finished) return;
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (Math.abs(e.x - p.x) < 205 && Math.abs(e.y - p.y) < 160) {
        this.beginCombat(e);
        break;
      }
    }
  };

  /* ═══════════════════════════ COMBATE ═══════════════════════════ */
  G.enemyName = function (e) {
    if (!e) return '';
    return e.type === 'cloud' ? 'Nube gruñona' : e.type === 'robot' ? 'Robot de hojalata' : (e.boss ? 'El Gato del Vecino' : 'Gato callejero');
  };

  G.beginCombat = function (e) {
    const p = this.player;
    const side = p.x <= e.x ? 1 : -1;
    p.x = clamp(e.x - side * 150, 40, this.level.length - 40);
    p.y = e.y;
    p.vx = 0; p.vy = 0;
    p.onGround = true;
    p.facing = side;
    p.lastSafe = { x: p.x, y: p.y };
    this.combo = 0;
    this.combat = {
      enemy: e,
      active: true,
      phase: 'intro',
      timer: 1.2,
      marker: 0,
      target: 0.52,
      speed: 2.4,
      strikeCount: 0,
      message: e.boss ? '¡El Gato del Vecino bloquea el camino!' : '¡Un duelo!',
      messageColor: '#ffe08a',
      messageTimer: 1.9,
      woodstockHit: false,
      dodgeWindow: 1.7
    };
    e.engaged = true;
    this.shake = 0.25;
    this.senseTimer = 0;
    this.emitDust(p.x, p.y, 10);
    if (SLW.Audio) SLW.Audio.sfx('enemy');
    if (SLW.UI) {
      SLW.UI.setCombat(true, this.healUses);
      SLW.UI.setCombatPhase('intro', this.combatInfo());
    }
    this.emoteWoodstock('alert', 2.2);
    if (!e.boss) {
      this.addFloat(e.x, e.y - 160, '¡Aquí está!', '#ffb3c1', 22);
    }
  };

  G.combatInfo = function () {
    const p = this.player;
    return {
      healUses: this.healUses,
      heartsFull: !!(p && p.hearts >= p.maxHearts),
      joined: this.joined
    };
  };

  G.setCombatPhase = function (phase) {
    const c = this.combat;
    if (!c) return;
    c.phase = phase;
    if (SLW.UI) SLW.UI.setCombatPhase(phase, this.combatInfo());
  };

  G.combatAction = function () {
    const c = this.combat;
    if (!c || this.uiBlock || this.paused) return;
    if (c.phase === 'choose') this.beginAttack();
    else if (c.phase === 'aim') this.strike();
    else if (c.phase === 'incoming') this.dodge();
  };

  G.beginAttack = function () {
    const c = this.combat;
    if (!c || c.phase !== 'choose' || this.uiBlock || this.paused) return;
    c.marker = 0;
    c.target = 0.3 + Math.random() * 0.36;
    c.speed = Math.max(1.7, 2.4 - c.strikeCount * 0.1);
    c.message = this.joined ? '¡Woodstock y tú al mismo tiempo!' : '¡Golpea en el momento justo!';
    c.messageColor = '#fff3c4';
    c.messageTimer = 1.4;
    this.setCombatPhase('aim');
    if (SLW.Audio) SLW.Audio.sfx('click');
  };

  G.combatHeal = function () {
    const c = this.combat;
    if (!c || this.uiBlock || this.paused) return;
    if (c.phase !== 'choose') {
      if (SLW.UI) SLW.UI.toast('Espera tu turno para pedir curación.', 'info', 1400);
      return;
    }
    if (!this.joined) {
      if (SLW.UI) SLW.UI.toast('Necesitas a Woodstock para curarte.', 'info');
      return;
    }
    const p = this.player;
    if (p.hearts >= p.maxHearts) {
      if (SLW.UI) SLW.UI.toast('Tu energía ya está completa.', 'info', 1600);
      return;
    }
    if (this.healUses <= 0) {
      if (SLW.UI) SLW.UI.toast('Woodstock ya usó sus plumas en este nivel.', 'warn');
      if (SLW.Audio) SLW.Audio.sfx('wrong');
      return;
    }
    this.healUses--;
    p.hearts = Math.min(p.maxHearts, p.hearts + 1);
    p.invuln = Math.max(p.invuln, 0.8);
    if (SLW.UI) {
      SLW.UI.setHearts(p.hearts, p.maxHearts);
      SLW.UI.setCombat(true, this.healUses);
    }
    if (SLW.Audio) SLW.Audio.sfx('heal');
    this.emoteWoodstock('heart', 2);
    this.woodstock.peck = 0;
    this.emitHearts(p.x, p.y - 80, 7);
    c.message = '¡Gracias, Woodstock! +1 ♥';
    c.messageColor = '#9ff0d2';
    c.messageTimer = 1.3;
    c.timer = 0.9;
    c.pauseNext = 'enemy';
    this.setCombatPhase('pause');
  };

  G.startEnemyTurn = function () {
    const c = this.combat;
    if (!c || !c.enemy || c.enemy.hp <= 0) return;
    c.timer = c.dodgeWindow;
    c.message = `¡${this.enemyName(c.enemy)} va a atacar!`;
    c.messageColor = '#ffc1cb';
    c.messageTimer = c.dodgeWindow;
    this.setCombatPhase('incoming');
    this.addFloat(c.enemy.x, c.enemy.y - 172, '¡Esquiva!', '#ffb3c1', 24);
    if (SLW.Audio) SLW.Audio.sfx('enemy');
    this.emoteWoodstock('alert', 2);
  };

  G.dodge = function () {
    const c = this.combat;
    if (!c || c.phase !== 'incoming' || this.uiBlock || this.paused) return;
    c.timer = 0.9;
    c.message = '¡Esquivaste! ¡Bien hecho!';
    c.messageColor = '#9ff0d2';
    c.messageTimer = 1.2;
    this.setCombatPhase('dodge');
    this.emitDust(this.player.x, this.player.y, 8);
    this.emoteWoodstock('star', 1.6);
    if (SLW.Audio) SLW.Audio.sfx('dodge');
  };

  G.enemyStrike = function () {
    const c = this.combat;
    if (!c) return;
    c.timer = 0.9;
    c.message = '¡Te alcanzó!';
    c.messageColor = '#ff9aa6';
    c.messageTimer = 1.2;
    c.pauseNext = 'player';
    this.setCombatPhase('pause');
    this.damagePlayer(1, c.enemy);
  };

  G.strike = function () {
    const c = this.combat;
    if (!c || c.phase !== 'aim' || this.uiBlock || this.paused) return;
    const tier = this.strikeTier(c.marker, c.target);
    c.strikeCount++;
    this.player.attackTimer = 0.35;
    this.woodstock.peck = 0.35;
    if (SLW.Audio) SLW.Audio.sfx('swing');

    if (tier === 'miss') {
      c.message = '¡Muy tarde!';
      c.messageColor = '#ff9aa6';
      c.messageTimer = 1.2;
      c.timer = 1.0;
      c.pauseNext = 'enemy';
      this.setCombatPhase('pause');
      this.combo = 0;
      this.addFloat(c.enemy.x, c.enemy.y - 140, 'fallo', '#ffb3c1', 26);
      if (SLW.Audio) SLW.Audio.sfx('miss');
      this.emitBurst(this.player.x + this.player.facing * 40, this.player.y - 64, 5, ['#ffffff', '#ffd166'], 'spark');
      return;
    }

    let dmg = tier === 'perfect' ? 3 : tier === 'good' ? 2 : 1;
    this.combo++;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    c.enemy.hp = Math.max(0, c.enemy.hp - dmg);
    c.enemy.flash = 0.35;
    c.message = tier === 'perfect' ? '¡PERFECTO!' : tier === 'good' ? '¡BIEN!' : 'FLOJO...';
    c.messageColor = tier === 'perfect' ? '#ffe08a' : tier === 'good' ? '#9ff0d2' : '#ffc0a0';
    c.messageTimer = 1.1;
    c.lastDamage = dmg;
    c.woodstockHit = false;

    // Woodstock ataca cada 3 golpes
    if (c.strikeCount % 3 === 0 && c.enemy.hp > 0) {
      c.enemy.hp = Math.max(0, c.enemy.hp - 1);
      c.woodstockHit = true;
      this.woodstock.peck = 0.6;
      this.emoteWoodstock('star', 1.6);
      this.addFloat(c.enemy.x + 20, c.enemy.y - 176, '¡Picotazo! +1', '#ffe08a', 20);
    }
    this.emitBurst(c.enemy.x - 10, c.enemy.y - 90, tier === 'perfect' ? 20 : 11,
      tier === 'perfect' ? ['#ffe08a', '#fff8ea', '#ffb347'] : ['#fff8ea', '#ffd166'], 'spark');
    this.emitSlash(c.enemy.x - 30, c.enemy.y - 90);
    this.shake = tier === 'perfect' ? 0.35 : 0.18;
    if (SLW.Audio) SLW.Audio.sfx(tier === 'perfect' ? 'perfect' : 'hit');

    if (c.enemy.hp <= 0) {
      this.winCombat();
      return;
    }
    c.timer = 0.9;
    c.pauseNext = 'enemy';
    this.setCombatPhase('pause');
  };

  G.strikeTier = function (m, target) {
    const d = Math.abs(m - target);
    if (d <= 0.045) return 'perfect';
    if (d <= 0.115) return 'good';
    if (d <= 0.2) return 'weak';
    return 'miss';
  };

  G.updateCombat = function (dt) {
    const c = this.combat;
    if (!c) return;
    const p = this.player;
    p.invuln = Math.max(0, p.invuln - dt);
    c.messageTimer = Math.max(0, c.messageTimer - dt);
    c.enemy.flash = Math.max(0, c.enemy.flash - dt);

    if (c.phase === 'intro') {
      c.timer -= dt;
      if (c.timer <= 0) {
        c.message = 'Tu turno: ¿atacas o te curas?';
        c.messageColor = '#fff3c4';
        c.messageTimer = 1.8;
        this.setCombatPhase('choose');
      }
      return;
    }
    if (c.phase === 'aim') {
      c.marker += dt / (c.speed * 1.15);
      if (c.marker >= 1.02) {
        c.marker = 1;
        c.strikeCount++;
        c.message = 'La marca se escapó...';
        c.messageColor = '#ff9aa6';
        c.messageTimer = 1.2;
        c.timer = 1.0;
        this.combo = 0;
        this.setCombatPhase('pause');
        if (SLW.Audio) SLW.Audio.sfx('miss');
        this.addFloat(p.x, p.y - 140, 'fallo', '#ffb3c1', 24);
      }
      return;
    }
    if (c.phase === 'incoming') {
      c.timer -= dt;
      if (c.timer <= 0) this.enemyStrike();
      return;
    }
    if (c.phase === 'pause' || c.phase === 'dodge') {
      c.timer -= dt;
      if (c.timer <= 0) {
        if (c.phase === 'dodge') {
          c.message = 'Tu turno.';
          c.messageColor = '#fff3c4';
          c.messageTimer = 1.2;
          this.setCombatPhase('choose');
        } else if (c.pauseNext === 'player') {
          c.message = 'Tu turno.';
          c.messageColor = '#fff3c4';
          c.messageTimer = 1.2;
          this.setCombatPhase('choose');
        } else {
          this.startEnemyTurn();
        }
      }
      return;
    }
    if (c.phase === 'win') {
      c.timer -= dt;
      if (c.timer <= 0) this.exitCombat(true);
      return;
    }
  };

  G.damagePlayer = function (amount, from) {
    const p = this.player;
    if (p.invuln > 0) return;
    p.hearts = Math.max(0, p.hearts - amount);
    p.hurtTimer = 0.6;
    p.invuln = 1.3;
    this.shake = 0.5;
    this.flashRed = 0.55;
    this.combo = 0;
    if (SLW.Audio) SLW.Audio.sfx('hurt');
    this.emitBurst(p.x, p.y - 70, 10, ['#ff8fa8', '#ffd0d8'], 'heart');
    this.addFloat(p.x, p.y - 140, '-1 ♥', '#ff9aa6', 26);
    if (SLW.UI) SLW.UI.setHearts(p.hearts, p.maxHearts);
    this.emoteWoodstock('alert', 2);
    if (from) {
      from.flash = 0.3;
    }
    if (p.hearts <= 0) {
      if (this.combat) this.loseCombat();
      else this.respawn(true);
    }
  };

  G.winCombat = function () {
    const c = this.combat;
    if (!c) return;
    c.enemy.dead = true;
    c.enemy.hp = 0;
    c.timer = 1.5;
    this.setCombatPhase('win');
    c.message = c.enemy.boss ? '¡El camino está libre!' : '¡Victoria!';
    c.messageColor = '#9ff0d2';
    c.messageTimer = 2;
    this.shake = 0.45;
    this.emitBurst(c.enemy.x, c.enemy.y - 90, 30, ['#ffd166', '#ff8fb1', '#7ddcc4', '#fff3c4'], 'confetti');
    this.emitRing(c.enemy.x, c.enemy.y - 80, '#fff3c4');
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    if (SLW.Audio) SLW.Audio.sfx('victory');
    this.emoteWoodstock('heart', 3);
    if (c.enemy.boss && this.gate) this.gate.open = true;
    // pequeña recompensa de energía
    if (this.player.hearts < this.player.maxHearts) {
      this.player.hearts++;
      if (SLW.UI) SLW.UI.setHearts(this.player.hearts, this.player.maxHearts);
    }
    // huesitos extra
    this.stats.bones += 3;
    this.totalBones += 3;
    if (SLW.UI) SLW.UI.setBones(this.stats.bones, this.totalBones);
    this.addFloat(c.enemy.x, c.enemy.y - 180, '+3 huesitos', '#ffe08a', 22);
    if (SLW.UI) SLW.UI.toast(c.enemy.boss ? '¡El Gato del Vecino se retira! La puerta se abre.' : '¡Combate superado! Woodstock está orgulloso.', 'heal', 3000);
  };

  G.exitCombat = function (won) {
    const c = this.combat;
    if (!c) return;
    if (won) {
      c.enemy.dead = true;
    }
    this.combat = null;
    this.keys = {};
    if (SLW.UI) SLW.UI.setCombat(false, this.healUses);
    this.combo = 0;
    if (won) {
      this.lastTs = 0;
      this.emitDust(this.player.x, this.player.y, 6);
    }
  };

  G.loseCombat = function () {
    const c = this.combat;
    if (!c) return;
    this.stats.deaths++;
    this.combat = null;
    if (SLW.UI) SLW.UI.setCombat(false, this.healUses);
    this.respawn(true);
  };

  G.fallDamage = function () {
    const p = this.player;
    p.hearts = Math.max(0, p.hearts - 1);
    p.hurtTimer = 0.5;
    this.shake = 0.4;
    this.flashRed = 0.7;
    if (SLW.Audio) SLW.Audio.sfx('hurt');
    this.emitBurst(p.x, 880, 8, ['#ff8fa8', '#ffd0d8'], 'heart');
    if (SLW.UI) SLW.UI.setHearts(p.hearts, p.maxHearts);
    if (p.hearts <= 0) {
      this.stats.deaths++;
      this.respawn(true);
      if (SLW.UI) SLW.UI.toast('Te despiertas en el último descanso. ¡Inténtalo otra vez!', 'info', 3000);
    } else {
      this.respawn(false);
      if (SLW.UI) SLW.UI.toast('¡Cuidado con los huecos! Perdiste un corazón.', 'warn', 2500);
    }
  };

  G.respawn = function (full) {
    const p = this.player;
    const rp = this.respawnPoint || { x: this.level.spawn.x, y: this.level.spawn.y };
    p.x = rp.x; p.y = rp.y;
    p.vx = 0; p.vy = 0;
    p.onGround = false;
    p.invuln = 1.6;
    p.hurtTimer = 0;
    this.cam.x = clamp(rp.x - W * 0.42, 0, Math.max(0, this.level.length - W));
    this.cam.y = clamp(rp.y - H * 0.72, -130, 220);
    if (full) {
      p.hearts = p.maxHearts;
      this.healUses = 2;
      this.combo = 0;
    }
    if (SLW.UI) {
      SLW.UI.setHearts(p.hearts, p.maxHearts);
      SLW.UI.setCombat(false, this.healUses);
    }
    if (this.woodstock) {
      this.woodstock.x = p.x - 60;
      this.woodstock.y = p.y - 110;
    }
    this.emitRing(p.x, p.y - 40, '#ffffff');
    this.emitDust(p.x, p.y, 8);
  };

  /* ═══════════════════════════ TRIVIA ═══════════════════════════ */
  G.openQuiz = function (station) {
    if (!SLW.UI) return;
    const q = SLW.QUESTIONS[station.qid];
    if (!q) return;
    this.uiBlock = true;
    this.keys = {}; this.touch = {};
    if (SLW.Audio) SLW.Audio.sfx('open');
    const total = this.quizzes.length;
    const idx = this.quizzes.filter(s => s.solved).length + 1;
    SLW.UI.openQuiz({
      question: q,
      name: SLW.QUIZ_MASTER.name,
      portrait: SLW.QUIZ_MASTER.portrait,
      kicker: `Pregunta ${Math.min(idx, total)} de ${total}`,
      index: Math.min(idx, total),
      total
    }, {
      onClose: (result) => {
        this.uiBlock = false;
        this.lastTs = 0;
        if (!result || !result.answered) return;
        station.solved = true;
        this.stats.quizAnswered++;
        this.stats.bones += 0;
        if (result.correct) {
          this.stats.quizCorrect++;
          this.stats.bones += 5;
          if (this.player.hearts < this.player.maxHearts) {
            this.player.hearts++;
            if (SLW.UI) SLW.UI.setHearts(this.player.hearts, this.player.maxHearts);
          }
          if (SLW.Audio) SLW.Audio.sfx('correct');
          this.emitBurst(station.x, station.y - 60, 18, ['#ffd166', '#7ddcc4', '#fff3c4'], 'star');
          if (SLW.UI) {
            SLW.UI.setBones(this.stats.bones, this.totalBones);
            SLW.UI.toast('¡Respuesta correcta! +5 huesitos y energía.', 'heal', 2800);
          }
          this.emoteWoodstock('star', 2.5);
        } else {
          station.wrong = true;
          if (SLW.Audio) SLW.Audio.sfx('wrong');
          if (SLW.UI) SLW.UI.toast('El Búho sonríe: equivocarse también enseña. Inténtalo en otra visita.', 'info', 3200);
        }
      }
    });
  };

  /* ═══════════════════════════ FIN DE NIVEL ═══════════════════════════ */
  G.finishLevel = function () {
    if (this.finished || !this.goal) return;
    this.finished = true;
    this.finishTimer = 1.1;
    this.resultsShown = false;
    this.goal.open = true;
    this.player.anim = 'cheer';
    this.emitBurst(this.goal.x, this.goal.y - 90, 26, ['#ffd166', '#ff8fb1', '#7ddcc4', '#fff3c4'], 'confetti');
    this.emitHearts(this.player.x, this.player.y - 90, 8);
    this.emoteWoodstock('heart', 3);
    if (SLW.Audio) SLW.Audio.sfx('goal');
    if (SLW.UI) SLW.UI.toast('La puerta del recuerdo se abre...', 'heal', 2400);
  };

  G.finishLevelNow = function () {
    const lv = this.level;
    const allBones = this.stats.bones >= this.totalBones;
    const noDeaths = this.stats.deaths === 0;
    const stars = allBones && noDeaths ? 3 : (allBones || noDeaths ? 2 : 1);
    SLW.State.completeLevel(lv.id, {
      stars,
      bones: this.stats.bones,
      totalBones: this.totalBones,
      bestCombo: this.bestCombo,
      quizCorrect: this.stats.quizCorrect,
      quizTotal: this.stats.quizAnswered
    });
    const nextId = SLW.State.nextLevel(lv.id);
    const nextUnlocked = nextId ? SLW.State.isLevelUnlocked(nextId) : false;
    const finaleUnlocked = SLW.State.isFinaleUnlocked();
    const data = {
      levelId: lv.id,
      levelName: lv.name,
      world: lv.world,
      worldName: this.worldLabel(lv.world),
      stars,
      bones: this.stats.bones,
      totalBones: this.totalBones,
      deaths: this.stats.deaths,
      bestCombo: this.bestCombo,
      quizCorrect: this.stats.quizCorrect,
      quizAnswered: this.stats.quizAnswered,
      itemsFound: this.stats.itemsFound,
      nextId,
      nextUnlocked,
      finaleUnlocked,
      allWorldsDone: finaleUnlocked,
      isFinale: false
    };
    this.uiBlock = true;
    if (SLW.UI) SLW.UI.showResults(data);
    if (SLW.Audio) SLW.Audio.playMusic('map');
  };

  G.finishAdventure = function () {
    this.finished = true;
    SLW.State.setFlag('finished', true);
    SLW.State.save();
    if (SLW.Audio) SLW.Audio.playMusic('ending');
    if (SLW.UI) SLW.UI.startEnding();
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  };

  /* ═══════════════════════════ CÁMARA ═══════════════════════════ */
  G.updateCamera = function (dt, passive) {
    const p = this.player;
    if (!p) return;
    let tx = p.x - W * 0.42 + p.facing * 50;
    let ty = p.y - H * 0.7;
    if (this.combat) {
      const e = this.combat.enemy;
      tx = (p.x + e.x) / 2 - W * 0.5 + 60;
      ty = Math.min(p.y, e.y) - H * 0.68;
    }
    const maxX = Math.max(0, this.level.length - W);
    tx = clamp(tx, 0, maxX);
    ty = clamp(ty, -140, 250);
    const s = passive ? 3 : (this.combat ? 4 : 5.5);
    this.cam.x = lerp(this.cam.x, tx, Math.min(1, dt * s));
    this.cam.y = lerp(this.cam.y, ty, Math.min(1, dt * s));
  };

  /* ═══════════════════════════ PARTÍCULAS ═══════════════════════════ */
  G.emitBurst = function (x, y, n, colors, type) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 220;
      this.particles.push({
        type: type || 'spark', x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
        life: 0.7 + Math.random() * 0.8, maxLife: 1.5,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 8,
        gravity: type === 'confetti' ? 420 : 140
      });
    }
  };

  G.emitDust = function (x, y, n) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        type: 'dust', x: x + (Math.random() - 0.5) * 20, y: y - 4,
        vx: (Math.random() - 0.5) * 120, vy: -30 - Math.random() * 60,
        life: 0.4 + Math.random() * 0.3, maxLife: 0.7,
        size: 3 + Math.random() * 5, color: 'rgba(255,248,235,.65)', gravity: 30
      });
    }
  };

  G.emitHearts = function (x, y, n) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        type: 'heart', x: x + (Math.random() - 0.5) * 46, y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 50, vy: -50 - Math.random() * 60,
        life: 1 + Math.random() * 0.6, maxLife: 1.6,
        size: 5 + Math.random() * 5, color: '#ff8fa8', gravity: -25,
        rot: 0, vr: 0
      });
    }
  };

  G.emitRing = function (x, y, color) {
    this.effects.push({ type: 'ring', x, y, life: 0.7, maxLife: 0.7, color: color || '#fff3c4', r0: 10, r1: 110 });
  };

  G.emitSlash = function (x, y) {
    this.effects.push({ type: 'slash', x, y, life: 0.28, maxLife: 0.28, color: '#fff3c4' });
  };

  G.addFloat = function (x, y, text, color, size) {
    this.floats.push({ x, y, text, color, size: size || 20, life: 1.1, maxLife: 1.1, vy: -46 });
  };

  G.updateParticles = function (dt) {
    const arr = this.particles;
    for (let i = arr.length - 1; i >= 0; i--) {
      const pt = arr[i];
      pt.life -= dt;
      if (pt.life <= 0) { arr.splice(i, 1); continue; }
      pt.vy += (pt.gravity || 0) * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.rot += (pt.vr || 0) * dt;
      if (pt.type === 'confetti') pt.vx *= 0.99;
    }
    const eff = this.effects;
    for (let i = eff.length - 1; i >= 0; i--) {
      eff[i].life -= dt;
      if (eff[i].life <= 0) eff.splice(i, 1);
    }
    this.updateFloats(dt);
  };

  G.updateFloats = function (dt) {
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.life -= dt;
      f.y += f.vy * dt;
      f.vy *= 0.94;
      if (f.life <= 0) this.floats.splice(i, 1);
    }
  };

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  G.render = function () {
    const ctx = this.ctx;
    if (!ctx || !this.level) return;
    const dpr = this.pixelRatio;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const cam = this.cam;
    const shakeAmt = this.shake > 0 ? this.shake * 14 : 0;
    const shx = (Math.random() - 0.5) * shakeAmt;
    const shy = (Math.random() - 0.5) * shakeAmt;

    SLW.Scenery.drawBackdrop(ctx, this.level.theme, cam.x, cam.y, this.time, W, H, { length: this.level.length });

    ctx.save();
    ctx.translate(-cam.x + shx, -cam.y + shy);

    // decorados
    SLW.Scenery.drawProps(ctx, this.level, cam.x, this.time);

    // plataformas visibles
    for (const pl of this.physicsPlatforms) {
      if (pl.x + pl.w < cam.x - 80 || pl.x > cam.x + W + 80) continue;
      SLW.Scenery.drawPlatform(ctx, pl, this.level.theme, this.time);
    }

    // zona del jefe
    if (this.gate) {
      const bossAlive = this.enemies.some(e => e.boss && !e.dead);
      this.gate.open = !bossAlive;
      if (Math.abs(this.gate.x - cam.x - W / 2) < W) SLW.Scenery.drawGate(ctx, this.gate.x, this.gate.y, this.time, !this.gate.open);
    }

    this.checkpoints.forEach(c => {
      if (c.x < cam.x - 100 || c.x > cam.x + W + 100) return;
      SLW.Scenery.drawCheckpoint(ctx, c.x, c.y, this.time, c.active);
    });

    this.quizzes.forEach(q => {
      if (q.x < cam.x - 100 || q.x > cam.x + W + 100) return;
      SLW.Scenery.drawQuizStand(ctx, q.x, q.y, this.time, q.solved);
      if (!q.solved) {
        SLW.Art.drawOwl(ctx, q.x + 4, q.y - 150 + Math.sin(this.time * 2 + q.x) * 5, 0.72, this.time);
      }
    });

    if (this.goal) {
      SLW.Scenery.drawGoal(ctx, this.goal.x, this.goal.y, this.time, this.goal.open, this.level.theme);
    }

    // casita y Snoopy en el final
    if (this.level.finale) {
      this.drawFinaleScene(ctx);
    }

    // huesitos
    const sense = this.senseTimer > 0;
    this.bones.forEach(b => {
      if (b.taken) return;
      if (b.secret && !sense) return;
      if (b.x < cam.x - 80 || b.x > cam.x + W + 80) return;
      const bobY = b.y + Math.sin(this.time * 2.2 + b.x * 0.01) * 4;
      if (b.secret) {
        const g = ctx.createRadialGradient(b.x, bobY, 2, b.x, bobY, 34);
        g.addColorStop(0, 'rgba(255,235,170,.4)'); g.addColorStop(1, 'rgba(255,235,170,0)');
        ctx.fillStyle = g; SLW.Art.utils.circle(ctx, b.x, bobY, 34); ctx.fill();
      }
      SLW.Art.drawBone(ctx, b.x, bobY, b.secret ? 24 : 27, Math.sin(this.time * 1.7 + b.x) * 0.25, this.time, { glow: true });
    });

    // objetos
    this.items.forEach(it => {
      if (it.taken) return;
      if (it.secret && !sense) return;
      if (it.x < cam.x - 120 || it.x > cam.x + W + 120) return;
      const iy = it.y - 38 + Math.sin(this.time * 2 + it.x * 0.01) * 5;
      ctx.save();
      ctx.translate(it.x, iy);
      const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 58);
      glow.addColorStop(0, 'rgba(255,242,200,.5)');
      glow.addColorStop(1, 'rgba(255,242,200,0)');
      ctx.fillStyle = glow;
      SLW.Art.utils.circle(ctx, 0, 0, 58); ctx.fill();
      ctx.scale(0.62, 0.62);
      SLW.Art.drawItemShape(ctx, it.item, 100);
      ctx.restore();
      const sparkleA = 0.5 + Math.sin(this.time * 3 + it.x) * 0.3;
      SLW.Art.utils.sparkle(ctx, it.x + 34, iy - 30, 5, '#fff3c4', sparkleA);
      if (it.secret) {
        ctx.fillStyle = 'rgba(255,240,180,.9)';
        ctx.font = '700 13px "Baloo 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('secreto', it.x, iy - 54);
        ctx.textAlign = 'left';
      }
    });

    // carteles
    this.signs.forEach(s => {
      if (s.x < cam.x - 100 || s.x > cam.x + W + 100) return;
      SLW.Scenery.drawSign(ctx, s.x, s.y, this.time, s.def);
    });

    // amigos
    this.npcs.forEach(n => {
      if (n.x < cam.x - 140 || n.x > cam.x + W + 140) return;
      this.drawNpc(ctx, n);
    });

    // enemigos
    this.enemies.forEach(e => {
      if (e.dead) return;
      if (e.x < cam.x - 160 || e.x > cam.x + W + 160) return;
      this.drawEnemy(ctx, e);
    });

    // jugador + compañero
    this.drawWoodstockWorld(ctx);
    this.drawPlayer(ctx);

    // partículas y efectos
    this.drawParticles(ctx);
    this.drawEffects(ctx);
    this.drawFloats(ctx);

    // pistas y prompts
    this.drawIndicators(ctx);
    this.drawPrompt(ctx);

    ctx.restore();

    // ambiente delante
    SLW.Scenery.drawAmbient(ctx, this.level.theme, cam.x, this.time, W, H);
    SLW.Scenery.drawForeground(ctx, this.level.theme, cam.x, this.time, W, H);

    // panel de combate
    if (this.combat) this.drawCombatUI(ctx);

    // flases
    if (this.flashRed > 0) {
      ctx.fillStyle = `rgba(255,120,130,${Math.min(0.45, this.flashRed * 0.7)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.player && this.player.invuln > 0 && !this.paused && !this.uiBlock) {
      // parpadeo suave del jugador se hace en drawPlayer
    }
  };

  G.drawPlayer = function (ctx) {
    const p = this.player;
    if (!p) return;
    if (p.invuln > 0 && Math.floor(this.time * 16) % 2 === 0 && p.hurtTimer > 0) return;

    // sombra
    if (p.onGround) {
      ctx.fillStyle = 'rgba(40,20,40,.18)';
      SLW.Art.utils.ell(ctx, p.x, p.y + 2, 24, 6); ctx.fill();
    }

    let state = p.anim;
    let expression = p.hurtTimer > 0 ? 'hurt' : 'happy';
    if (this.finished) { state = 'cheer'; expression = 'happy'; }
    if (this.combat) state = p.attackTimer > 0 ? 'cheer' : 'idle';

    SLW.Art.drawPerson(ctx, SLW.State.appearance(), {
      x: p.x, y: p.y, scale: 0.82, facing: this.combat ? p.facing : (p.vx < -12 ? -1 : p.vx > 12 ? 1 : p.facing),
      state, phase: p.phase, time: this.time, expression, blink: false
    });

    // estela del Sentido
    if (this.senseTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.25 + Math.sin(this.time * 6) * 0.1;
      ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 2;
      SLW.Art.utils.circle(ctx, p.x, p.y - 50, 42 + Math.sin(this.time * 4) * 4);
      ctx.stroke();
      ctx.restore();
    }
  };

  G.drawWoodstockWorld = function (ctx) {
    const w = this.woodstock;
    if (!w || !this.joined || !w.visible) return;
    const p = this.player;
    const near = dist(w.x, w.y, p.x, p.y) < 200;
    if (w.glow > 0) {
      const g = ctx.createRadialGradient(w.x, w.y, 4, w.x, w.y, 60);
      g.addColorStop(0, 'rgba(255,238,170,.35)');
      g.addColorStop(1, 'rgba(255,238,170,0)');
      ctx.fillStyle = g; SLW.Art.utils.circle(ctx, w.x, w.y, 60); ctx.fill();
    }
    SLW.Art.drawWoodstock(ctx, w.x, w.y, 1.35, this.time, {
      facing: w.facing,
      expression: w.emote === 'heart' ? 'happy' : 'normal',
      flap: this.combat ? Math.sin(this.time * 8) * 0.4 : 0
    });
    if (w.peck > 0) {
      const e = this.combat ? this.combat.enemy : null;
      const tx = e ? e.x - 20 : w.x + w.facing * 60;
      const ty = e ? e.y - 90 : w.y + 10;
      ctx.strokeStyle = 'rgba(255,240,170,.85)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.quadraticCurveTo((w.x + tx) / 2, w.y - 26, tx, ty); ctx.stroke();
      SLW.Art.utils.sparkle(ctx, tx, ty, 8, '#fff3c4', 0.9);
    }
    if (w.emote && w.emoteT > 0) {
      SLW.Art.drawEmote(ctx, w.x + 26, w.y - 46, w.emote, 1, this.time);
    }
    if (!near) {
      // flecha hacia Woodstock
      const dx = w.x - p.x, dy = w.y - (p.y - 60);
      const a = Math.atan2(dy, dx);
      const ax = p.x + Math.cos(a) * 56, ay = p.y - 60 + Math.sin(a) * 56;
      ctx.save();
      ctx.translate(ax, ay); ctx.rotate(a);
      ctx.fillStyle = 'rgba(255,225,140,.9)';
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, 5); ctx.lineTo(-2, 0); ctx.lineTo(-5, -5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  };

  G.drawNpc = function (ctx, n) {
    const def = SLW.NPCS[n.type] || {};
    const face = this.player.x < n.x ? -1 : 1;
    const t = this.time;
    if (n.type === 'woodstock') {
      SLW.Art.drawWoodstock(ctx, n.x, n.y + Math.sin(t * 2.4) * 6, 1.6, t, { expression: 'normal' });
    } else if (n.type === 'charlie') {
      SLW.Art.drawCharlie(ctx, n.x, n.y, 1.05, t, face);
    } else if (n.type === 'schroeder') {
      SLW.Art.drawSchroeder(ctx, n.x, n.y, 1.05, t, face);
    } else if (n.type === 'linus') {
      SLW.Art.drawLinus(ctx, n.x, n.y, 1.05, t, face);
    } else if (n.type === 'lucy') {
      SLW.Art.drawLucy(ctx, n.x, n.y, 1.05, t, face);
    } else if (n.type === 'snoopy') {
      // se dibuja en la escena final
    }
    if (n.type !== 'snoopy') {
      // burbuja de conversación
      const bob = Math.sin(t * 2 + n.x) * 2;
      const by = (n.type === 'woodstock' ? n.y - 66 : n.y - (n.type === 'charlie' ? 118 : 118)) + bob;
      ctx.fillStyle = 'rgba(255,251,238,.94)';
      SLW.Art.utils.rr(ctx, n.x - 16, by - 14, 32, 24, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(60,40,60,.12)'; ctx.lineWidth = 1.5;
      SLW.Art.utils.rr(ctx, n.x - 16, by - 14, 32, 24, 10); ctx.stroke();
      ctx.fillStyle = '#7a5a6a';
      for (let i = 0; i < 3; i++) {
        SLW.Art.utils.circle(ctx, n.x - 6 + i * 6, by - 2 + Math.sin(t * 3 + i) * 1.5, 1.7); ctx.fill();
      }
    }
  };

  G.drawEnemy = function (ctx, e) {
    SLW.Art.drawEnemy(ctx, e.type, e.x, e.y, 1, this.time, { flash: e.flash > 0 });
    // barra de vida sobre la cabeza
    const bw = e.boss ? 110 : 82;
    const bx = e.x - bw / 2;
    const by = e.y - (e.type === 'cat' ? 190 : 160);
    ctx.fillStyle = 'rgba(30,20,40,.55)';
    SLW.Art.utils.rr(ctx, bx - 2, by - 2, bw + 4, 12, 6); ctx.fill();
    ctx.fillStyle = '#ff7d8f';
    SLW.Art.utils.rr(ctx, bx, by, bw * (e.hp / e.maxHp), 8, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    SLW.Art.utils.rr(ctx, bx + 2, by + 1, Math.max(0, bw * (e.hp / e.maxHp) - 4), 2.5, 1.2); ctx.fill();
    if (e.boss) {
      ctx.fillStyle = '#ffe08a';
      ctx.font = '800 14px "Baloo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GATO JEFE', e.x, by - 8);
      ctx.textAlign = 'left';
    }
  };

  G.drawFinaleScene = function (ctx) {
    const x = 2920, y = 600;
    SLW.Art.drawDoghouse(ctx, x, y, 1.05, { glow: true });
    // Snoopy sobre el tejado
    const roofY = y - 186 * 1.05 + 4;
    SLW.Art.drawSnoopy(ctx, x + 2, roofY, 0.95, this.time, 'stand', { facing: -1 });
    const n = this.finaleNpc;
    if (n && !n.done) {
      const g = ctx.createRadialGradient(x, roofY, 10, x, roofY, 120);
      g.addColorStop(0, 'rgba(255,240,180,.25)');
      g.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = g; SLW.Art.utils.circle(ctx, x, roofY, 120); ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = this.time * 0.5 + i * 1.3;
        SLW.Art.utils.sparkle(ctx, x + Math.cos(a) * 70, roofY - 20 + Math.sin(a) * 34, 4, '#fff3c4', 0.7);
      }
    }
  };

  G.drawIndicators = function (ctx) {
    // brillo de la puerta y corazón flotante
    if (this.goal) {
      const t = this.time;
      SLW.Art.utils.sparkle(ctx, this.goal.x - 46, this.goal.y - 170 + Math.sin(t * 1.7) * 4, 4, '#fff3c4', 0.8);
      SLW.Art.utils.sparkle(ctx, this.goal.x + 48, this.goal.y - 140 + Math.cos(t * 1.5) * 4, 3, '#ffe9b0', 0.7);
    }
    // secretos durante el Sentido
    if (this.senseTimer > 0) {
      const secret = this.nearestSecret(800);
      if (secret) {
        const sx = secret.x, sy = secret.y - (secret.item ? 40 : 0);
        const a = 0.6 + Math.sin(this.time * 5) * 0.3;
        ctx.strokeStyle = `rgba(255,235,150,${a})`; ctx.lineWidth = 2;
        ctx.setLineDash([5, 7]);
        SLW.Art.utils.circle(ctx, sx, sy, 26 + Math.sin(this.time * 4) * 5); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  };

  G.drawPrompt = function (ctx) {
    const prompt = this.prompt;
    if (!prompt) return;
    const t = this.time;
    let x = this.player.x;
    let y = this.player.y - 132;
    if (prompt.type === 'sign') { x = prompt.obj.x; y = prompt.obj.y - 96; }
    else if (prompt.type === 'npc') { x = prompt.obj.x; y = prompt.obj.y - (prompt.obj.type === 'woodstock' ? 110 : 142); }
    else if (prompt.type === 'quiz') { x = prompt.obj.x; y = prompt.obj.y - 205; }
    else if (prompt.type === 'goal') { x = prompt.obj.x; y = prompt.obj.y - 208; }
    y += Math.sin(t * 3) * 3;

    const text = prompt.label;
    ctx.font = '800 15px "Baloo 2", sans-serif';
    const tw = ctx.measureText(text).width;
    const padX = 14, keySize = 24;
    const bw = tw + keySize + padX * 2 + 8;
    const bh = 36;
    ctx.save();
    ctx.globalAlpha = 0.97;
    ctx.fillStyle = 'rgba(38,26,48,.88)';
    SLW.Art.utils.rr(ctx, x - bw / 2, y - bh / 2, bw, bh, 18); ctx.fill();
    ctx.strokeStyle = 'rgba(255,231,160,.5)'; ctx.lineWidth = 1.5;
    SLW.Art.utils.rr(ctx, x - bw / 2, y - bh / 2, bw, bh, 18); ctx.stroke();
    ctx.fillStyle = '#ffe9a8';
    SLW.Art.utils.circle(ctx, x - bw / 2 + padX + keySize / 2, y, 11); ctx.fill();
    ctx.fillStyle = '#3a2a3e';
    ctx.font = '800 13px "Baloo 2", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('E', x - bw / 2 + padX + keySize / 2, y + 1);
    ctx.fillStyle = '#fff8ea';
    ctx.font = '800 15px "Baloo 2", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(text, x - bw / 2 + padX + keySize + 6, y + 1);
    ctx.restore();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  };

  G.drawParticles = function (ctx) {
    const A = SLW.Art.utils;
    for (const p of this.particles) {
      const a = clamp(p.life / p.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      if (p.type === 'dust') {
        ctx.fillStyle = p.color;
        A.circle(ctx, p.x, p.y, p.size * (1.2 - a * 0.4)); ctx.fill();
      } else if (p.type === 'heart') {
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        const s = p.size / 6;
        ctx.scale(s, s);
        ctx.beginPath(); ctx.moveTo(0, 5); ctx.bezierCurveTo(-9, -1, -7, -9, -2, -9); ctx.bezierCurveTo(1, -9, 2, -6, 0, -3); ctx.bezierCurveTo(-2, -6, 1, -9, 3, -9); ctx.bezierCurveTo(8, -9, 10, -1, 0, 5); ctx.fill();
      } else if (p.type === 'star') {
        A.sparkle(ctx, p.x, p.y, p.size * 1.6, p.color, a);
      } else if (p.type === 'confetti') {
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.fillStyle = p.color;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.4);
        g.addColorStop(0, p.color);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        A.circle(ctx, p.x, p.y, p.size * 2.2); ctx.fill();
        ctx.fillStyle = '#fff9ea';
        A.circle(ctx, p.x, p.y, Math.max(1, p.size * 0.45)); ctx.fill();
      }
      ctx.restore();
    }
  };

  G.drawEffects = function (ctx) {
    for (const e of this.effects) {
      const a = clamp(e.life / e.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      if (e.type === 'ring') {
        const r = lerp(e.r0, e.r1, 1 - a);
        ctx.strokeStyle = e.color; ctx.lineWidth = 3 * a + 1;
        SLW.Art.utils.circle(ctx, e.x, e.y, r); ctx.stroke();
      } else if (e.type === 'slash') {
        ctx.translate(e.x, e.y);
        ctx.rotate(-0.6 + (1 - a) * 0.5);
        ctx.strokeStyle = e.color; ctx.lineWidth = 4 * a + 1;
        ctx.beginPath(); ctx.arc(0, 0, 38, -0.9, 0.9); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 30, -0.7, 0.6); ctx.stroke();
      }
      ctx.restore();
    }
  };

  G.drawFloats = function (ctx) {
    for (const f of this.floats) {
      const a = clamp(f.life / f.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = Math.min(1, a * 1.6);
      ctx.font = `800 ${f.size}px "Baloo 2", sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(40,25,45,.55)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
    ctx.textAlign = 'left';
  };

  G.drawCombatUI = function (ctx) {
    const c = this.combat;
    const e = c.enemy;
    const pw = 760, ph = 174;
    const px = (W - pw) / 2, py = H - ph - 16;
    ctx.save();
    const g = ctx.createLinearGradient(0, py - 40, 0, H);
    g.addColorStop(0, 'rgba(24,16,34,0)');
    g.addColorStop(1, 'rgba(24,16,34,.42)');
    ctx.fillStyle = g; ctx.fillRect(0, py - 40, W, H - py + 40);

    ctx.fillStyle = 'rgba(38,27,52,.94)';
    SLW.Art.utils.rr(ctx, px, py, pw, ph, 24); ctx.fill();
    ctx.strokeStyle = 'rgba(255,226,150,.45)'; ctx.lineWidth = 2;
    SLW.Art.utils.rr(ctx, px, py, pw, ph, 24); ctx.stroke();

    // nombre enemigo + hp
    ctx.fillStyle = '#fff3dc';
    ctx.font = '800 20px "Baloo 2", sans-serif';
    ctx.fillText(this.enemyName(e), px + 28, py + 34);
    const nameW = ctx.measureText(this.enemyName(e)).width;
    ctx.font = '700 13px "Nunito", sans-serif';
    ctx.fillStyle = 'rgba(255,243,220,.6)';
    ctx.fillText(e.boss ? 'jefe' : 'guardián', px + 30 + nameW + 14, py + 33);
    const hbw = 250;
    const hx = px + pw - hbw - 28, hy = py + 20;
    ctx.fillStyle = 'rgba(12,8,20,.6)';
    SLW.Art.utils.rr(ctx, hx - 3, hy - 3, hbw + 6, 18, 9); ctx.fill();
    ctx.fillStyle = e.hp / e.maxHp < 0.35 ? '#ff8d7a' : '#ff6b8a';
    SLW.Art.utils.rr(ctx, hx, hy, hbw * (e.hp / e.maxHp), 12, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    SLW.Art.utils.rr(ctx, hx + 3, hy + 2, Math.max(0, hbw * (e.hp / e.maxHp) - 6), 3, 1.5); ctx.fill();
    ctx.fillStyle = 'rgba(255,243,220,.9)';
    ctx.font = '700 12px "Nunito", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${e.hp} / ${e.maxHp}`, hx + hbw, hy + 34);
    ctx.textAlign = 'left';

    // chip de turno
    const chips = { intro: '¡Prepárate!', choose: 'Tu turno', aim: 'Tu turno', incoming: 'Turno del enemigo', win: '¡Victoria!' };
    const chip = chips[c.phase];
    if (chip) {
      const gold = c.phase !== 'incoming';
      ctx.font = '800 12px "Baloo 2", sans-serif';
      const cw = ctx.measureText(chip.toUpperCase()).width + 28;
      const cx = px + pw - 28 - cw, cy = py + 52;
      ctx.fillStyle = gold ? 'rgba(255,209,102,.15)' : 'rgba(255,120,150,.16)';
      SLW.Art.utils.rr(ctx, cx, cy, cw, 22, 11); ctx.fill();
      ctx.strokeStyle = gold ? 'rgba(255,209,102,.55)' : 'rgba(255,140,165,.55)';
      ctx.lineWidth = 1.2;
      SLW.Art.utils.rr(ctx, cx, cy, cw, 22, 11); ctx.stroke();
      ctx.fillStyle = gold ? '#ffe08a' : '#ffb3c1';
      ctx.textAlign = 'center';
      ctx.fillText(chip.toUpperCase(), cx + cw / 2, cy + 15);
      ctx.textAlign = 'left';
    }

    const tw = 560, tx = px + (pw - tw) / 2, ty = py + 88;
    let hint = '';
    if (c.phase === 'aim') {
      ctx.fillStyle = 'rgba(16,10,24,.65)';
      SLW.Art.utils.rr(ctx, tx, ty, tw, 20, 10); ctx.fill();
      ctx.fillStyle = 'rgba(255,209,102,.16)';
      ctx.fillRect(tx + tw * (c.target - 0.2), ty + 2, tw * 0.4, 16);
      ctx.fillStyle = 'rgba(125,220,196,.22)';
      ctx.fillRect(tx + tw * (c.target - 0.115), ty + 2, tw * 0.23, 16);
      ctx.fillStyle = 'rgba(255,225,140,.85)';
      ctx.fillRect(tx + tw * (c.target - 0.045), ty, tw * 0.09, 20);
      ctx.fillStyle = 'rgba(255,255,255,.65)';
      ctx.fillRect(tx + tw * (c.target - 0.014), ty, tw * 0.028, 20);
      ctx.strokeStyle = 'rgba(255,240,200,.35)'; ctx.lineWidth = 1.5;
      SLW.Art.utils.rr(ctx, tx, ty, tw, 20, 10); ctx.stroke();
      const mx = tx + tw * clamp(c.marker, 0, 1);
      ctx.fillStyle = '#fff8ea';
      ctx.shadowColor = '#ffe9a8'; ctx.shadowBlur = 12;
      SLW.Art.utils.rr(ctx, mx - 2.5, ty - 7, 5, 34, 2.5); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = '700 11px "Nunito", sans-serif';
      ctx.fillStyle = 'rgba(255,226,150,.75)';
      ctx.textAlign = 'center';
      ctx.fillText('PERFECTO', tx + tw * c.target, ty + 38);
      ctx.textAlign = 'left';
      hint = 'ESPACIO o toca ¡AHORA! cuando la marca cruce el dorado';
    } else if (c.phase === 'incoming') {
      const ratio = clamp(c.timer / (c.dodgeWindow || 1.7), 0, 1);
      ctx.fillStyle = 'rgba(16,10,24,.65)';
      SLW.Art.utils.rr(ctx, tx, ty, tw, 22, 11); ctx.fill();
      const pulse = 0.68 + Math.sin(this.time * 9) * 0.22;
      ctx.fillStyle = `rgba(255,122,152,${pulse})`;
      SLW.Art.utils.rr(ctx, tx + 2, ty + 2, Math.max(8, (tw - 4) * ratio), 18, 9); ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,210,.55)'; ctx.lineWidth = 1.5;
      SLW.Art.utils.rr(ctx, tx, ty, tw, 22, 11); ctx.stroke();
      ctx.fillStyle = '#fff8ea';
      ctx.font = '800 13px "Baloo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('¡ESQUIVA!', W / 2, ty + 16);
      ctx.textAlign = 'left';
      hint = 'ESPACIO o toca ¡ESQUIVAR! antes de que la barra se vacíe';
    } else if (c.phase === 'choose') {
      ctx.fillStyle = '#fff3c4';
      ctx.font = '800 16px "Baloo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('¿Qué hacemos en este turno?', W / 2, ty + 12);
      ctx.font = '700 13px "Nunito", sans-serif';
      ctx.fillStyle = '#ffe08a';
      ctx.fillText('Atacar con Woodstock', W / 2 - 118, ty + 36);
      ctx.fillStyle = 'rgba(255,247,232,.5)';
      ctx.fillText('Espacio', W / 2 - 118, ty + 53);
      ctx.fillStyle = '#9ff0d2';
      ctx.fillText(`Curar +1 ♥ (${this.healUses} plumas)`, W / 2 + 112, ty + 36);
      ctx.fillStyle = 'rgba(255,247,232,.5)';
      ctx.fillText('tecla H o botón', W / 2 + 112, ty + 53);
      ctx.textAlign = 'left';
      hint = 'Cada acción tuya termina tu turno: luego toca esquivar el ataque del enemigo.';
    } else if (c.phase === 'dodge') {
      hint = '¡Bien esquivado! Respira: pronto será tu turno otra vez.';
    } else if (c.phase === 'win') {
      hint = 'Woodstock da una voltereta de alegría.';
    }

    if (hint) {
      ctx.fillStyle = 'rgba(255,247,232,.72)';
      ctx.font = '700 13px "Nunito", sans-serif';
      ctx.fillText(hint, px + 28, py + ph - 16);
    }

    // mensaje central
    if (c.messageTimer > 0) {
      ctx.globalAlpha = Math.min(1, c.messageTimer * 2);
      ctx.font = '800 30px "Baloo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(30,18,40,.6)';
      ctx.strokeText(c.message, W / 2, py - 26);
      ctx.fillStyle = c.messageColor;
      ctx.fillText(c.message, W / 2, py - 26);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }
    // combo
    if (this.combo > 1) {
      ctx.fillStyle = '#ffd166';
      ctx.font = '800 22px "Baloo 2", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`combo x${this.combo}`, px + pw - 28, py + ph - 16);
      ctx.textAlign = 'left';
    }
    ctx.restore();
  };

  /* ═══════════════════════════ INPUT ═══════════════════════════ */
  G.bindInput = function () {
    const isTyping = el => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

    window.addEventListener('keydown', e => {
      if (!this.running) return;
      if (isTyping(e.target)) return;
      if (SLW.UI && SLW.UI.blocksGameKeys && SLW.UI.blocksGameKeys()) return;
      const code = e.code;
      if (code === 'Escape' || code === 'KeyP') {
        e.preventDefault();
        if (this.paused) { this.resumeGame(); }
        else if (!this.uiBlock && !this.finished) this.pauseGame(false);
        return;
      }
      if (this.paused || this.uiBlock || this.finished) return;

      if (code === 'ArrowLeft' || code === 'KeyA') { this.keys.left = true; e.preventDefault(); }
      if (code === 'ArrowRight' || code === 'KeyD') { this.keys.right = true; e.preventDefault(); }
      if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.run = true;
      if (code === 'ArrowDown' || code === 'KeyS') this.keys.down = true;

      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
        e.preventDefault();
        if (e.repeat) return;
        if (this.combat) {
          this.combatAction();
        } else {
          this.jumpHeld = true;
          this.player.jumpHeld = true;
          this.player.jumpBuffer = 0.14;
        }
        return;
      }
      if (code === 'KeyE') {
        if (e.repeat) return;
        if (this.combat) this.combatAction();
        else this.interact();
      }
      if (code === 'Enter') {
        if (e.repeat) return;
        if (this.combat) this.combatAction();
      }
      if (code === 'KeyQ') {
        if (e.repeat) return;
        this.useSense();
      }
      if (code === 'KeyH') {
        if (e.repeat) return;
        this.doHeal();
      }
      if (code === 'KeyI') {
        if (e.repeat) return;
        this.openInventory();
      }
      if (code === 'KeyM') {
        if (e.repeat) return;
        if (SLW.UI) SLW.UI.toggleSound();
      }
    });

    window.addEventListener('keyup', e => {
      if (!this.running) return;
      const code = e.code;
      if (code === 'ArrowLeft' || code === 'KeyA') this.keys.left = false;
      if (code === 'ArrowRight' || code === 'KeyD') this.keys.right = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.run = false;
      if (code === 'ArrowDown' || code === 'KeyS') this.keys.down = false;
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
        if (this.player) this.player.jumpHeld = false;
      }
    });

    // táctil
    document.querySelectorAll('#touch-controls [data-key]').forEach(btn => {
      const key = btn.getAttribute('data-key');
      const down = e => {
        e.preventDefault();
        if (!this.running || this.paused || this.uiBlock || this.finished) return;
        if (btn.setPointerCapture) { try { btn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
        if (key === 'jump') {
          if (this.combat) this.combatAction();
          else {
            this.touch.jump = true;
            this.player.jumpHeld = true;
            this.player.jumpBuffer = 0.14;
          }
        } else if (key === 'interact') {
          if (this.combat) this.combatAction(); else this.interact();
        } else {
          this.touch[key] = true;
        }
        btn.classList.add('is-pressed');
      };
      const up = e => {
        if (e) e.preventDefault();
        if (key === 'jump') { this.touch.jump = false; if (this.player) this.player.jumpHeld = false; }
        else if (key !== 'interact') this.touch[key] = false;
        btn.classList.remove('is-pressed');
      };
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', up);
    });

    const strikeBtn = document.getElementById('btn-combat-strike');
    if (strikeBtn) strikeBtn.addEventListener('pointerdown', e => { e.preventDefault(); this.combatAction(); });
    const healBtn = document.getElementById('btn-combat-heal');
    if (healBtn) healBtn.addEventListener('pointerdown', e => { e.preventDefault(); this.combatHeal(); });
  };

  G.pauseGame = function (fromBlur) {
    if (this.paused || this.finished || this.uiBlock) return;
    this.paused = true;
    this.keys = {}; this.touch = {};
    if (SLW.Audio) SLW.Audio.sfx('open');
    if (SLW.UI) SLW.UI.showPause(!!fromBlur);
  };

  G.resumeGame = function () {
    this.paused = false;
    this.lastTs = 0;
    if (SLW.UI) SLW.UI.hidePause();
  };

  G.openInventory = function () {
    if (this.uiBlock || this.finished) return;
    this.uiBlock = true;
    this.keys = {}; this.touch = {};
    if (SLW.Audio) SLW.Audio.sfx('open');
    if (SLW.UI) SLW.UI.openInventory({ onClose: () => { this.uiBlock = false; this.lastTs = 0; } });
  };
})();
