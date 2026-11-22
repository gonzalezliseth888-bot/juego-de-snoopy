/* ═══════════════════════════════════════════════════════════════
   STATE — guardado, progreso, inventario y desbloqueos
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const SLW = window.SLW;
  const ST = SLW.State = {};

  const KEY = 'slw-save-v1';
  const VERSION = 1;

  function fresh() {
    return {
      version: VERSION,
      name: '',
      appearance: null,
      levels: {},
      inventory: [],
      unseen: [],
      flags: { joined: false, finished: false },
      introsSeen: {},
      startedAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  ST.data = fresh();

  ST.load = function () {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (!raw) { ST.data = fresh(); return ST.data; }
    try {
      const parsed = JSON.parse(raw);
      const base = fresh();
      const d = Object.assign(base, parsed || {});
      d.flags = Object.assign({ joined: false, finished: false }, parsed.flags || {});
      d.levels = parsed.levels && typeof parsed.levels === 'object' ? parsed.levels : {};
      d.inventory = Array.isArray(parsed.inventory) ? parsed.inventory.filter(id => SLW.ITEM_MAP[id]) : [];
      d.unseen = Array.isArray(parsed.unseen) ? parsed.unseen.filter(id => SLW.ITEM_MAP[id]) : [];
      d.introsSeen = parsed.introsSeen && typeof parsed.introsSeen === 'object' ? parsed.introsSeen : {};
      if (!Array.isArray(d.inventory)) d.inventory = [];
      if (!d.name || typeof d.name !== 'string') d.name = '';
      if (!d.appearance || typeof d.appearance !== 'object') d.appearance = null;
      ST.data = d;
    } catch (e) {
      ST.data = fresh();
    }
    return ST.data;
  };

  ST.save = function () {
    ST.data.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(ST.data)); } catch (e) { /* storage lleno o bloqueado */ }
    return ST.data;
  };

  ST.reset = function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    ST.data = fresh();
    return ST.data;
  };

  ST.hasSave = function () {
    return !!(ST.data.name && ST.data.appearance);
  };

  ST.playerName = function () {
    return ST.data.name || SLW.DEFAULT_NAME;
  };

  ST.appearance = function () {
    return Object.assign({}, SLW.DEFAULT_APPEARANCE, ST.data.appearance || {});
  };

  ST.setAppearance = function (app, name) {
    ST.data.appearance = clone(app);
    if (name != null) ST.data.name = String(name).trim().slice(0, 16) || SLW.DEFAULT_NAME;
    ST.save();
  };

  ST.setName = function (name) {
    ST.data.name = String(name || '').trim().slice(0, 16) || SLW.DEFAULT_NAME;
    ST.save();
  };

  ST.setFlag = function (key, val) {
    ST.data.flags[key] = val;
    ST.save();
  };

  ST.getFlag = function (key) {
    return !!ST.data.flags[key];
  };

  ST.markIntroSeen = function (levelId) {
    if (!ST.data.introsSeen[levelId]) {
      ST.data.introsSeen[levelId] = true;
      ST.save();
    }
  };

  ST.introSeen = function (levelId) {
    return !!ST.data.introsSeen[levelId];
  };

  ST.addItem = function (id) {
    if (!SLW.ITEM_MAP[id]) return false;
    if (ST.data.inventory.indexOf(id) >= 0) return false;
    ST.data.inventory.push(id);
    if (ST.data.unseen.indexOf(id) < 0) ST.data.unseen.push(id);
    ST.save();
    return true;
  };

  ST.hasItem = function (id) {
    return ST.data.inventory.indexOf(id) >= 0;
  };

  ST.markItemsSeen = function () {
    if (ST.data.unseen.length) {
      ST.data.unseen = [];
      ST.save();
    }
  };

  ST.unseenCount = function () {
    return ST.data.unseen.length;
  };

  ST.getItemCount = function () {
    return ST.data.inventory.length;
  };

  ST.levelRecord = function (id) {
    return ST.data.levels[id] || null;
  };

  ST.isLevelComplete = function (id) {
    const r = ST.data.levels[id];
    return !!(r && r.completed);
  };

  ST.completeLevel = function (id, result) {
    result = result || {};
    const prev = ST.data.levels[id] || {};
    const rec = {
      completed: true,
      stars: Math.max(prev.stars || 0, result.stars || 0),
      bones: Math.max(prev.bones || 0, result.bones || 0),
      totalBones: Math.max(prev.totalBones || 0, result.totalBones || 0),
      bestCombo: Math.max(prev.bestCombo || 0, result.bestCombo || 0),
      quizCorrect: Math.max(prev.quizCorrect || 0, result.quizCorrect || 0),
      quizTotal: Math.max(prev.quizTotal || 0, result.quizTotal || 0),
      playCount: (prev.playCount || 0) + 1,
      lastPlayed: Date.now()
    };
    ST.data.levels[id] = rec;
    ST.save();
    return rec;
  };

  ST.incrementPlay = function (id) {
    const rec = ST.data.levels[id] || {};
    rec.playCount = (rec.playCount || 0) + 1;
    rec.lastPlayed = Date.now();
    ST.data.levels[id] = rec;
    ST.save();
  };

  ST.totalStars = function () {
    return Object.keys(ST.data.levels).reduce((sum, k) => sum + (ST.data.levels[k].stars || 0), 0);
  };

  ST.maxStars = function () {
    return SLW.LEVEL_ORDER.length * 3;
  };

  ST.totalBones = function () {
    return Object.keys(ST.data.levels).reduce((sum, k) => sum + (ST.data.levels[k].bones || 0), 0);
  };

  ST.worldLevels = function (world) {
    return SLW.LEVEL_ORDER.filter(id => SLW.LEVELS[id] && SLW.LEVELS[id].world === world);
  };

  ST.isWorldUnlocked = function (world) {
    if (world <= 1) return true;
    const prev = ST.worldLevels(world - 1);
    if (!prev.length) return true;
    return prev.every(id => ST.isLevelComplete(id));
  };

  ST.isLevelUnlocked = function (id) {
    const lv = SLW.LEVELS[id];
    if (!lv) return false;
    if (lv.finale) return ST.isFinaleUnlocked();
    if (!ST.isWorldUnlocked(lv.world)) return false;
    if (lv.index <= 1) return true;
    const prevId = `${lv.world}-${lv.index - 1}`;
    return ST.isLevelComplete(prevId);
  };

  ST.worldProgress = function (world) {
    const ids = ST.worldLevels(world);
    let done = 0, stars = 0, bones = 0, totalBones = 0;
    ids.forEach(id => {
      const r = ST.data.levels[id];
      if (r && r.completed) done++;
      if (r) { stars += r.stars || 0; bones += r.bones || 0; totalBones += r.totalBones || 0; }
    });
    return {
      total: ids.length, done, stars, maxStars: ids.length * 3, bones, totalBones,
      unlocked: ST.isWorldUnlocked(world)
    };
  };

  ST.isFinaleUnlocked = function () {
    return SLW.LEVEL_ORDER.every(id => ST.isLevelComplete(id));
  };

  ST.canContinue = function () {
    return ST.hasSave();
  };

  ST.nextLevel = function (id) {
    const idx = SLW.LEVEL_ORDER.indexOf(id);
    if (idx >= 0 && idx < SLW.LEVEL_ORDER.length - 1) return SLW.LEVEL_ORDER[idx + 1];
    if (idx === SLW.LEVEL_ORDER.length - 1) return SLW.FINALE_ID;
    return null;
  };

  ST.load();
})();
