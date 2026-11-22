/* ═══════════════════════════════════════════════════════════════
   SCENERY — fondos con parallax, decorados, plataformas y partículas
   Cada mundo tiene su propia identidad visual.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const SLW = window.SLW;
  const S = SLW.Scenery = {};
  const A = SLW.Art;
  const { clamp, lerp, hash, rgba, shade, rr, circle, ell, sparkle, TAU } = A.utils;

  function theme(id) { return SLW.THEMES[id] || SLW.THEMES.meadow; }

  function drawCloud(ctx, x, y, s, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = color;
    ell(ctx, x, y, 46 * s, 24 * s); ctx.fill();
    ell(ctx, x - 30 * s, y + 6 * s, 24 * s, 17 * s); ctx.fill();
    ell(ctx, x + 30 * s, y + 6 * s, 26 * s, 18 * s); ctx.fill();
    ell(ctx, x - 8 * s, y - 12 * s, 22 * s, 17 * s); ctx.fill();
    ell(ctx, x + 18 * s, y - 8 * s, 18 * s, 14 * s); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ell(ctx, x - 10 * s, y - 14 * s, 20 * s, 6 * s); ctx.fill();
    ctx.restore();
  }

  function drawPuff(ctx, x, y, s, color) {
    ctx.fillStyle = color;
    circle(ctx, x, y, 18 * s); ctx.fill();
    circle(ctx, x - 15 * s, y + 4 * s, 13 * s); ctx.fill();
    circle(ctx, x + 15 * s, y + 4 * s, 14 * s); ctx.fill();
    circle(ctx, x - 7 * s, y - 9 * s, 12 * s); ctx.fill();
    circle(ctx, x + 8 * s, y - 8 * s, 11 * s); ctx.fill();
  }

  function starField(ctx, w, h, t, count, seed, color) {
    for (let i = 0; i < count; i++) {
      const x = hash(i * 7 + seed) * w;
      const y = hash(i * 13 + seed + 5) * h * 0.62;
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(t * (0.6 + hash(i + seed) * 1.4) + i));
      const r = 0.8 + hash(i * 3 + seed) * 1.8;
      ctx.fillStyle = rgba(color || '#fff8dc', tw * 0.85);
      circle(ctx, x, y, r); ctx.fill();
      if (r > 2.1) sparkle(ctx, x, y, r * 2.6, '#fff6d8', tw * 0.35);
    }
  }

  function hill(ctx, camX, parallax, baseY, amp, freq, color, seed, w, h) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-60, h + 10);
    for (let x = -60; x <= w + 60; x += 14) {
      const wx = x + camX * parallax;
      ctx.lineTo(x, baseY - Math.sin(wx * freq + seed) * amp - Math.sin(wx * freq * 0.37 + seed * 2.3) * amp * 0.55);
    }
    ctx.lineTo(w + 60, h + 10);
    ctx.closePath(); ctx.fill();
  }

  function tree(ctx, x, baseY, s, trunk, leaves, type) {
    ctx.save();
    ctx.translate(x, baseY);
    ctx.scale(s, s);
    ctx.fillStyle = trunk;
    rr(ctx, -5, -74, 10, 78, 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-4, -50); ctx.lineTo(-20, -66); ctx.lineTo(-4, -62); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, -58); ctx.lineTo(20, -74); ctx.lineTo(4, -70); ctx.closePath(); ctx.fill();
    ctx.fillStyle = leaves;
    if (type === 'round') {
      circle(ctx, 0, -92, 34); ctx.fill();
      circle(ctx, -26, -78, 24); ctx.fill();
      circle(ctx, 27, -78, 25); ctx.fill();
      circle(ctx, -8, -114, 22); ctx.fill();
      circle(ctx, 16, -108, 20); ctx.fill();
    } else if (type === 'blossom') {
      circle(ctx, 0, -98, 40); ctx.fill();
      circle(ctx, -30, -82, 26); ctx.fill();
      circle(ctx, 30, -84, 26); ctx.fill();
      circle(ctx, -4, -122, 26); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.3)';
      circle(ctx, 10, -112, 9); ctx.fill();
      circle(ctx, -18, -102, 7); ctx.fill();
    } else {
      // pino
      ctx.beginPath(); ctx.moveTo(0, -140); ctx.lineTo(38, -80); ctx.lineTo(18, -80); ctx.lineTo(42, -40); ctx.lineTo(-42, -40); ctx.lineTo(-18, -80); ctx.lineTo(-38, -80); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    circle(ctx, -8, -100, 12); ctx.fill();
    ctx.restore();
  }

  /* ═══════════════════════════ FONDO PRINCIPAL ═══════════════════════════ */
  S.drawBackdrop = function (ctx, themeId, camX, camY, time, w, h, opts) {
    const o = opts || {};
    const th = theme(themeId);
    w = w || 1280; h = h || 720;
    const t = time || 0;
    const cy = (camY || 0) * 0.05;

    // cielo
    const sky = ctx.createLinearGradient(0, 0, w * 0.15, h);
    sky.addColorStop(0, th.sky[0]);
    sky.addColorStop(0.55, th.sky[1]);
    sky.addColorStop(1, th.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(-2, -2, w + 4, h + 4);

    const sx = w * 0.78 - camX * 0.012;
    const sy = h * 0.19 - cy;
    const night = themeId === 'dream' || themeId === 'library' || themeId === 'jungle';

    if (themeId === 'library') {
      drawLibrary(ctx, camX, time, w, h, th);
      return;
    }
    if (themeId === 'dream') {
      starField(ctx, w, h, t, 70, 4, '#fff4d6');
    } else if (themeId === 'jungle') {
      starField(ctx, w, h, t, 22, 9, '#c9ffe0');
    } else if (themeId === 'sky' && camY < 0) {
      starField(ctx, w, h, t, 18, 12);
    }

    // sol / luna
    if (themeId === 'dream') {
      const g = ctx.createRadialGradient(sx, sy, 8, sx, sy, 190);
      g.addColorStop(0, 'rgba(255,246,214,.5)');
      g.addColorStop(0.35, 'rgba(255,236,190,.16)');
      g.addColorStop(1, 'rgba(255,236,190,0)');
      ctx.fillStyle = g; circle(ctx, sx, sy, 190); ctx.fill();
      ctx.fillStyle = th.sun; circle(ctx, sx, sy, 62); ctx.fill();
      ctx.fillStyle = 'rgba(210,190,150,.28)';
      circle(ctx, sx - 20, sy - 12, 10); ctx.fill();
      circle(ctx, sx + 18, sy + 14, 14); ctx.fill();
      circle(ctx, sx + 8, sy - 24, 6); ctx.fill();
      // nubes suaves
      ctx.fillStyle = 'rgba(255,240,220,.08)';
      ell(ctx, w * 0.2, h * 0.3, 220, 40); ctx.fill();
      ell(ctx, w * 0.6, h * 0.45, 260, 46); ctx.fill();
    } else if (themeId === 'arena') {
      const g = ctx.createRadialGradient(sx, h * 0.42, 10, sx, h * 0.42, 230);
      g.addColorStop(0, 'rgba(255,190,120,.55)');
      g.addColorStop(1, 'rgba(255,150,90,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = th.sun; circle(ctx, sx, h * 0.4, 58); ctx.fill();
    } else {
      const glow = ctx.createRadialGradient(sx, sy, 20, sx, sy, 210);
      glow.addColorStop(0, th.sunGlow);
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = th.sun; circle(ctx, sx, sy, themeId === 'hills' ? 54 : 44); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      circle(ctx, sx - 12, sy - 12, 16); ctx.fill();
    }

    // nubes
    const cloudCount = themeId === 'sky' ? 12 : themeId === 'garden' ? 6 : 7;
    for (let i = 0; i < cloudCount; i++) {
      const base = hash(i * 5 + 2) * (w + 500);
      const par = themeId === 'sky' ? 0.1 + (i % 3) * 0.08 : 0.05 + (i % 2) * 0.03;
      const range = w + 500;
      let x = ((base - camX * par) % range + range) % range - 250;
      const y = h * (0.08 + hash(i * 9 + 1) * 0.32) - cy;
      const s = 0.55 + hash(i * 4 + 7) * 0.8;
      if (themeId === 'jungle' || themeId === 'arena') {
        ctx.globalAlpha = 0.25;
      }
      drawCloud(ctx, x, y, s, th.cloud, themeId === 'sky' ? 0.75 : 0.9);
      ctx.globalAlpha = 1;
    }

    const len = o.length || 9000;
    switch (themeId) {
      case 'meadow': {
        hill(ctx, camX, 0.12, h * 0.66, 26, 0.0016, th.far, 1.7, w, h);
        hill(ctx, camX, 0.22, h * 0.73, 22, 0.0024, th.mid, 3.1, w, h);
        // árboles lejanos
        for (let i = 0; i < 10; i++) {
          const wx = (i * 260 + hash(i) * 100) - camX * 0.3;
          if (wx > -160 && wx < w + 160) tree(ctx, wx, h * 0.75, 0.65 + hash(i + 3) * 0.3, rgba(shade(th.mid, -30), 0.75), th.mid, i % 3 ? 'round' : 'pine');
        }
        hill(ctx, camX, 0.34, h * 0.82, 16, 0.0031, th.near, 5.4, w, h);
        // valla lejana
        ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 3;
        const fenceShift = (camX * 0.34) % 46;
        for (let i = 0; i < Math.ceil(w / 46) + 3; i++) {
          const x = i * 46 - fenceShift - 20;
          ctx.beginPath(); ctx.moveTo(x, h * 0.79); ctx.lineTo(x, h * 0.83); ctx.stroke();
        }
        break;
      }
      case 'hills': {
        hill(ctx, camX, 0.1, h * 0.62, 30, 0.0014, th.far, 2.2, w, h);
        hill(ctx, camX, 0.18, h * 0.7, 26, 0.0022, th.mid, 4.7, w, h);
        hill(ctx, camX, 0.3, h * 0.78, 20, 0.003, th.near, 6.1, w, h);
        // pajarillos
        ctx.strokeStyle = 'rgba(90,60,70,.4)'; ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const bx = (w * 0.2 + i * 90 + Math.sin(t * 0.4 + i) * 20 - camX * 0.03) % (w + 200);
          const by = h * 0.2 + i * 18;
          ctx.beginPath(); ctx.arc(bx - 6, by, 5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
          ctx.beginPath(); ctx.arc(bx + 4, by, 5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        }
        break;
      }
      case 'library': break;
      case 'garden': {
        hill(ctx, camX, 0.1, h * 0.68, 24, 0.0016, th.far, 3.3, w, h);
        for (let i = 0; i < 7; i++) {
          const wx = i * 300 + hash(i + 5) * 120 - camX * 0.24;
          if (wx > -220 && wx < w + 220) tree(ctx, wx, h * 0.71, 1.1 + hash(i) * 0.5, rgba(shade(th.mid, -20), .9), th.far, 'blossom');
        }
        hill(ctx, camX, 0.3, h * 0.81, 18, 0.0028, th.near, 7.2, w, h);
        // setos
        ctx.fillStyle = rgba(shade(th.near, -12), 0.9);
        const hedgeShift = (camX * 0.3) % 120;
        for (let i = 0; i < Math.ceil(w / 120) + 3; i++) {
          const x = i * 120 - hedgeShift;
          ell(ctx, x, h * 0.84, 66, 24); ctx.fill();
        }
        break;
      }
      case 'arena': {
        // coliseo
        const par = 0.08;
        ctx.fillStyle = rgba(th.far, 0.9);
        for (let row = 0; row < 2; row++) {
          const by = h * (0.55 + row * 0.08);
          for (let i = 0; i < 14; i++) {
            const bx = i * 130 - (camX * par) % 130 - 60;
            const bw = 96, bh = 74 + row * 10;
            ctx.fillRect(bx, by - bh, bw, bh);
            ctx.fillStyle = rgba(th.sky[1], 0.55);
            ctx.beginPath();
            ctx.moveTo(bx + 16, by);
            ctx.lineTo(bx + 16, by - bh + 22);
            ctx.quadraticCurveTo(bx + bw / 2, by - bh + 6, bx + bw - 16, by - bh + 22);
            ctx.lineTo(bx + bw - 16, by); ctx.closePath(); ctx.fill();
            ctx.fillStyle = rgba(th.far, 0.9);
          }
        }
        // gradas y banderines
        ctx.fillStyle = rgba(th.mid, 0.95);
        ctx.beginPath(); ctx.moveTo(0, h * 0.72); ctx.lineTo(w, h * 0.72); ctx.lineTo(w, h * 0.8); ctx.lineTo(0, h * 0.8); ctx.closePath(); ctx.fill();
        for (let i = 0; i < 12; i++) {
          const x = i * 150 - (camX * 0.18) % 150;
          if (x < -80 || x > w + 80) continue;
          ctx.fillStyle = i % 2 ? '#ff8b5f' : '#ffd166';
          ctx.beginPath(); ctx.moveTo(x, h * 0.16); ctx.lineTo(x + 44, h * 0.16); ctx.lineTo(x + 22, h * 0.27); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(50,20,30,.35)'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(x, h * 0.16); ctx.lineTo(x + 44, h * 0.16); ctx.stroke();
        }
        // antorchas
        for (let i = 0; i < 6; i++) {
          const x = i * 260 + 120 - camX * 0.2;
          if (x < -60 || x > w + 60) continue;
          const fy = h * 0.72;
          ctx.fillStyle = '#4a2c2c'; ctx.fillRect(x - 3, fy - 92, 6, 92);
          const fg = ctx.createRadialGradient(x, fy - 98, 2, x, fy - 98, 30);
          fg.addColorStop(0, 'rgba(255,230,150,.9)'); fg.addColorStop(0.5, 'rgba(255,150,60,.45)'); fg.addColorStop(1, 'rgba(255,120,60,0)');
          ctx.fillStyle = fg; circle(ctx, x, fy - 98, 30); ctx.fill();
          ctx.fillStyle = '#ffd166';
          ctx.beginPath(); ctx.moveTo(x, fy - 118); ctx.quadraticCurveTo(x + 8, fy - 100, x, fy - 88); ctx.quadraticCurveTo(x - 8, fy - 100, x, fy - 118); ctx.fill();
        }
        break;
      }
      case 'sky': {
        // islas flotantes
        for (let i = 0; i < 5; i++) {
          const wx = i * 420 + hash(i) * 160 - camX * 0.14;
          if (wx < -260 || wx > w + 260) continue;
          const iy = h * (0.3 + hash(i + 4) * 0.3) - cy;
          const sc = 0.6 + hash(i + 8) * 0.7;
          ctx.fillStyle = rgba(th.far, 0.55);
          ell(ctx, wx, iy, 90 * sc, 20 * sc); ctx.fill();
          ctx.beginPath(); ctx.moveTo(wx - 70 * sc, iy); ctx.lineTo(wx, iy + 70 * sc); ctx.lineTo(wx + 70 * sc, iy); ctx.closePath();
          ctx.fillStyle = rgba(th.mid, 0.6); ctx.fill();
          if (i % 2 === 0) tree(ctx, wx + 20 * sc, iy, 0.5 * sc, rgba(shade(th.near, -20), .6), th.far, 'round');
        }
        hill(ctx, camX, 0.26, h * 0.86, 20, 0.002, th.mid, 2.9, w, h);
        // globo aerostático
        const bx = ((w * 0.72 - camX * 0.05) % (w + 400) + (w + 400)) % (w + 400) - 200;
        const by = h * 0.28 + Math.sin(t * 0.5) * 8 - cy;
        ctx.fillStyle = 'rgba(255,255,255,.08)'; circle(ctx, bx, by, 150); ctx.fill();
        ctx.fillStyle = '#ffd166';
        ctx.beginPath(); ctx.ellipse(bx, by, 34, 40, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ff8b5f';
        ctx.beginPath(); ctx.ellipse(bx, by, 34, 40, 0, 0.3, Math.PI - 0.3); ctx.fill();
        ctx.fillStyle = '#7ddcc4';
        ctx.beginPath(); ctx.ellipse(bx, by, 20, 40, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#8a5a3a'; rr(ctx, bx - 10, by + 48, 20, 14, 3); ctx.fill();
        break;
      }
      case 'jungle': {
        // rayos de luz
        for (let i = 0; i < 4; i++) {
          const lx = w * (0.2 + i * 0.22) - camX * 0.03;
          const lg = ctx.createLinearGradient(lx, 0, lx + 120, h);
          lg.addColorStop(0, 'rgba(255,246,190,.15)');
          lg.addColorStop(1, 'rgba(255,246,190,0)');
          ctx.fillStyle = lg;
          ctx.beginPath(); ctx.moveTo(lx, -10); ctx.lineTo(lx + 70, -10); ctx.lineTo(lx + 240, h); ctx.lineTo(lx + 100, h); ctx.closePath(); ctx.fill();
        }
        // ruinas lejanas
        for (let i = 0; i < 4; i++) {
          const wx = i * 480 + 200 - camX * 0.12;
          if (wx < -260 || wx > w + 260) continue;
          ctx.fillStyle = rgba(th.far, 0.8);
          ctx.fillRect(wx - 26, h * 0.44, 52, h * 0.4);
          ctx.fillRect(wx - 64, h * 0.47, 128, 22);
          ctx.fillRect(wx - 54, h * 0.52, 108, 16);
          ctx.fillStyle = rgba(th.mid, 0.7);
          ctx.fillRect(wx - 16, h * 0.5, 32, h * 0.34);
        }
        hill(ctx, camX, 0.2, h * 0.72, 30, 0.0018, th.mid, 4.1, w, h);
        // hojas gigantes
        for (let i = 0; i < 9; i++) {
          const wx = i * 260 - camX * 0.3 + hash(i) * 60;
          if (wx < -200 || wx > w + 200) continue;
          const ly = h * (0.5 + hash(i + 2) * 0.35) - cy;
          ctx.save();
          ctx.translate(wx, ly);
          ctx.rotate(hash(i + 6) * 0.6 - 0.3);
          ctx.fillStyle = rgba(th.far, 0.55);
          ell(ctx, 0, 0, 120, 26); ctx.fill();
          ctx.strokeStyle = rgba(th.mid, 0.5); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-110, 0); ctx.lineTo(110, 0); ctx.stroke();
          ctx.restore();
        }
        // lianas
        ctx.strokeStyle = 'rgba(20,70,50,.6)'; ctx.lineWidth = 4;
        for (let i = 0; i < 8; i++) {
          const x = i * 190 - camX * 0.18 + 40;
          if (x < -40 || x > w + 40) continue;
          ctx.beginPath(); ctx.moveTo(x, -10); ctx.quadraticCurveTo(x + 20, h * 0.16, x - 6, h * (0.24 + hash(i) * 0.14)); ctx.stroke();
          ctx.fillStyle = rgba(th.near, .8);
          ell(ctx, x - 6, h * (0.24 + hash(i) * 0.14), 10, 5, 0.4); ctx.fill();
        }
        break;
      }
      case 'ruins': {
        // cascada lejana
        const wx = w * 0.72 - camX * 0.06;
        ctx.fillStyle = 'rgba(190,230,220,.22)';
        ctx.fillRect(wx, h * 0.32, 130, h * 0.55);
        ctx.fillStyle = 'rgba(240,255,250,.3)';
        ctx.fillRect(wx + 30, h * 0.32, 26, h * 0.55);
        ctx.fillRect(wx + 78, h * 0.32, 14, h * 0.55);
        hill(ctx, camX, 0.14, h * 0.64, 34, 0.0015, th.far, 3.6, w, h);
        // templo
        for (let i = 0; i < 3; i++) {
          const tx = i * 520 + 130 - camX * 0.16;
          if (tx < -200 || tx > w + 200) continue;
          ctx.fillStyle = rgba(th.mid, 0.85);
          for (let c = 0; c < 4; c++) {
            const cx = tx + c * 46;
            ctx.fillRect(cx, h * 0.42, 20, h * 0.28);
            ctx.fillRect(cx - 4, h * 0.42, 28, 10);
          }
          ctx.fillRect(tx - 12, h * 0.39, 190, 18);
          ctx.beginPath(); ctx.moveTo(tx - 26, h * 0.39); ctx.lineTo(tx + 88, h * 0.34); ctx.lineTo(tx + 200, h * 0.39); ctx.closePath(); ctx.fill();
        }
        hill(ctx, camX, 0.28, h * 0.8, 22, 0.0026, th.near, 6.4, w, h);
        // columnas caídas
        for (let i = 0; i < 5; i++) {
          const cx = i * 330 + 70 - camX * 0.26;
          if (cx < -120 || cx > w + 120) continue;
          ctx.save(); ctx.translate(cx, h * 0.83); ctx.rotate(i % 2 ? 0.12 : -0.05);
          ctx.fillStyle = rgba(th.mid, 0.9); rr(ctx, -60, -16, 120, 30, 6); ctx.fill();
          ctx.fillStyle = rgba(th.near, 0.5); rr(ctx, -60, -16, 120, 8, 4); ctx.fill();
          ctx.restore();
        }
        break;
      }
      case 'dream': {
        // islas flotantes
        for (let i = 0; i < 4; i++) {
          const wx = i * 460 + 100 - camX * 0.1;
          if (wx < -220 || wx > w + 220) continue;
          const iy = h * (0.36 + hash(i + 3) * 0.26) - cy;
          ctx.fillStyle = 'rgba(120,100,190,.35)';
          ell(ctx, wx, iy, 100, 22); ctx.fill();
          ctx.beginPath(); ctx.moveTo(wx - 80, iy); ctx.lineTo(wx, iy + 62); ctx.lineTo(wx + 80, iy); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,230,180,.5)';
          circle(ctx, wx + 40, iy - 10, 4); ctx.fill();
        }
        hill(ctx, camX, 0.18, h * 0.8, 30, 0.0016, th.far, 2.4, w, h);
        hill(ctx, camX, 0.3, h * 0.87, 20, 0.0024, th.mid, 5.2, w, h);
        // luces flotantes
        for (let i = 0; i < 10; i++) {
          const lx = ((i * 173 + 80 - camX * 0.2) % (w + 160) + (w + 160)) % (w + 160) - 80;
          const ly = h * (0.3 + hash(i + 5) * 0.45) + Math.sin(t * 0.7 + i) * 12 - cy;
          const lr = 2 + hash(i) * 3;
          const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr * 5);
          g.addColorStop(0, 'rgba(255,236,170,.9)'); g.addColorStop(1, 'rgba(255,236,170,0)');
          ctx.fillStyle = g; circle(ctx, lx, ly, lr * 5); ctx.fill();
          ctx.fillStyle = '#fff3c4'; circle(ctx, lx, ly, lr); ctx.fill();
        }
        // casita lejana
        const hx = w * 0.82 - camX * 0.08;
        if (hx > -120 && hx < w + 120) {
          A.drawDoghouse(ctx, hx, h * 0.84, 0.55, { glow: true });
        }
        break;
      }
    }

    // niebla inferior
    const fog = ctx.createLinearGradient(0, h * 0.72, 0, h);
    fog.addColorStop(0, 'rgba(255,255,255,0)');
    fog.addColorStop(1, th.fog);
    ctx.fillStyle = fog; ctx.fillRect(0, h * 0.7, w, h * 0.3);
  };

  /* Biblioteca: escena interior propia */
  function drawLibrary(ctx, camX, time, w, h, th) {
    const t = time;
    // pared
    const wall = ctx.createLinearGradient(0, 0, 0, h);
    wall.addColorStop(0, '#241c42');
    wall.addColorStop(0.6, '#3d2f60');
    wall.addColorStop(1, '#5b4577');
    ctx.fillStyle = wall; ctx.fillRect(0, 0, w, h);
    // papel tapiz
    ctx.strokeStyle = 'rgba(255,220,170,.06)'; ctx.lineWidth = 2;
    for (let i = 0; i < 22; i++) {
      const x = i * 70 - (camX * 0.04) % 70;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 30, h * 0.3, x, h * 0.7); ctx.stroke();
    }
    // ventana arqueada
    const wx = w * 0.66 - camX * 0.03;
    const wy = h * 0.16;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(wx - 120, wy + 200);
    ctx.lineTo(wx - 120, wy + 80);
    ctx.quadraticCurveTo(wx - 120, wy, wx, wy);
    ctx.quadraticCurveTo(wx + 120, wy, wx + 120, wy + 80);
    ctx.lineTo(wx + 120, wy + 200);
    ctx.closePath();
    ctx.fillStyle = '#1a1636'; ctx.fill();
    ctx.clip();
    const ny = ctx.createLinearGradient(0, wy, 0, wy + 200);
    ny.addColorStop(0, '#1a1740'); ny.addColorStop(1, '#3a2f63');
    ctx.fillStyle = ny; ctx.fillRect(wx - 120, wy, 240, 200);
    ctx.fillStyle = '#fdf3d0'; circle(ctx, wx + 44, wy + 52, 22); ctx.fill();
    ctx.fillStyle = 'rgba(253,243,208,.18)'; circle(ctx, wx + 44, wy + 52, 44); ctx.fill();
    starField(ctx, wx * 2, 300, t, 26, 8, '#fff2cc');
    // colinas dentro de la ventana
    ctx.fillStyle = 'rgba(120,160,180,.35)';
    ctx.beginPath(); ctx.moveTo(wx - 120, wy + 200);
    for (let x = -120; x <= 120; x += 20) ctx.lineTo(wx + x, wy + 152 + Math.sin(x * 0.03) * 12);
    ctx.lineTo(wx + 120, wy + 200); ctx.closePath(); ctx.fill();
    // marcos
    ctx.strokeStyle = 'rgba(30,20,45,.7)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + 200); ctx.moveTo(wx - 120, wy + 110); ctx.lineTo(wx + 120, wy + 110); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = '#6b4a3c'; ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(wx - 120, wy + 200);
    ctx.lineTo(wx - 120, wy + 80);
    ctx.quadraticCurveTo(wx - 120, wy, wx, wy);
    ctx.quadraticCurveTo(wx + 120, wy, wx + 120, wy + 80);
    ctx.lineTo(wx + 120, wy + 200);
    ctx.stroke();
    // cortinas
    ctx.fillStyle = 'rgba(150,60,90,.5)';
    ctx.beginPath(); ctx.moveTo(wx - 136, wy - 10); ctx.quadraticCurveTo(wx - 170, wy + 90, wx - 146, wy + 210); ctx.lineTo(wx - 114, wy + 210); ctx.quadraticCurveTo(wx - 132, wy + 90, wx - 118, wy - 6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(wx + 136, wy - 10); ctx.quadraticCurveTo(wx + 170, wy + 90, wx + 146, wy + 210); ctx.lineTo(wx + 114, wy + 210); ctx.quadraticCurveTo(wx + 132, wy + 90, wx + 118, wy - 6); ctx.closePath(); ctx.fill();

    // estanterías
    const shelfPar = 0.2;
    for (let layer = 0; layer < 2; layer++) {
      const y = h * (0.34 + layer * 0.24);
      const off = (camX * shelfPar * (1 + layer * 0.5)) % 460;
      ctx.fillStyle = layer ? '#3f2c4f' : '#43305a';
      ctx.fillRect(-10, y, w + 20, 16);
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fillRect(-10, y + 16, w + 20, 6);
      for (let i = 0; i < Math.ceil(w / 26) + 4; i++) {
        const bx = i * 26 - off;
        if (bx < -26 || bx > w + 26) continue;
        const seed = Math.floor((bx + off) / 26) + layer * 100;
        const bh = 26 + hash(seed) * 16;
        const bw = 14 + hash(seed + 1) * 8;
        const colors = ['#c85a5a', '#5f8fd6', '#ffd166', '#7ddcc4', '#a99bf0', '#e88aa8', '#7eb86b', '#e8a25a'];
        ctx.fillStyle = colors[Math.floor(hash(seed + 2) * colors.length)];
        rr(ctx, bx, y - bh, bw, bh, 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.22)';
        ctx.fillRect(bx + 3, y - bh + 4, bw - 6, 2);
      }
    }
    // lámparas colgantes
    for (let i = 0; i < 4; i++) {
      const lx = i * 340 + 170 - camX * 0.08;
      if (lx < -80 || lx > w + 80) continue;
      const ly = h * 0.2 + Math.sin(t * 0.8 + i) * 3;
      ctx.strokeStyle = '#2a2038'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(lx, -10); ctx.lineTo(lx, ly - 16); ctx.stroke();
      const lg = ctx.createRadialGradient(lx, ly, 2, lx, ly, 70);
      lg.addColorStop(0, 'rgba(255,230,160,.35)'); lg.addColorStop(1, 'rgba(255,230,160,0)');
      ctx.fillStyle = lg; circle(ctx, lx, ly, 70); ctx.fill();
      ctx.fillStyle = '#ffdf94';
      ctx.beginPath(); ctx.moveTo(lx - 14, ly - 12); ctx.lineTo(lx + 14, ly - 12); ctx.lineTo(lx + 9, ly + 8); ctx.lineTo(lx - 9, ly + 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4a3a5c'; rr(ctx, lx - 16, ly - 16, 32, 6, 2); ctx.fill();
    }
    // siluetas de sillones cercanos
    const chairPar = 0.38;
    for (let i = 0; i < 4; i++) {
      const cx = i * 520 + 100 - (camX * chairPar) % 520;
      if (cx < -200 || cx > w + 200) continue;
      ctx.fillStyle = 'rgba(30,22,46,.55)';
      ell(ctx, cx, h * 0.9, 120, 44); ctx.fill();
      rr(ctx, cx - 60, h * 0.9 - 70, 120, 70, 30); ctx.fill();
    }
    // niebla
    const fog = ctx.createLinearGradient(0, h * 0.6, 0, h);
    fog.addColorStop(0, 'rgba(60,40,90,0)');
    fog.addColorStop(1, 'rgba(40,25,65,.35)');
    ctx.fillStyle = fog; ctx.fillRect(0, h * 0.6, w, h * 0.4);
  }

  /* ═══════════════════════════ PROPS ═══════════════════════════ */
  function propHash(level, i) {
    let seed = 0;
    const id = level.id || '';
    for (let k = 0; k < id.length; k++) seed += id.charCodeAt(k) * (k + 7);
    return hash(seed + i * 1.37);
  }

  function findGround(level, x) {
    if (!level.platforms) return null;
    for (const p of level.platforms) {
      if (p.kind === 'ground' && x > p.x + 18 && x < p.x + p.w - 18) return p;
    }
    return null;
  }

  S.drawProps = function (ctx, level, camX, time) {
    if (!level || !level.platforms) return;
    const themeId = level.theme;
    const t = time || 0;
    const len = level.length || 4000;
    const step = themeId === 'library' ? 260 : 230;
    const start = Math.floor((camX - 260) / step);
    const end = Math.ceil((camX + 1540) / step);
    for (let i = start; i <= end; i++) {
      const seed = propHash(level, i);
      const x = i * step + seed * 150;
      const p = findGround(level, x);
      if (!p) continue;
      const y = p.y;
      const r = propHash(level, i + 50);
      drawProp(ctx, themeId, x, y, r, t, seed, i, level);
    }
  };

  function drawProp(ctx, themeId, x, y, r, t, seed, i, level) {
    switch (themeId) {
      case 'meadow':
      case 'hills':
      case 'sky': {
        if (r < 0.22) {
          // arbusto
          ctx.fillStyle = themeId === 'sky' ? 'rgba(150,120,180,.5)' : 'rgba(85,150,90,.75)';
          ell(ctx, x, y - 12, 26, 16); ctx.fill();
          ell(ctx, x - 16, y - 6, 16, 11); ctx.fill();
          ell(ctx, x + 16, y - 6, 16, 11); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.16)';
          ell(ctx, x - 6, y - 20, 12, 5, -0.2); ctx.fill();
        } else if (r < 0.46) {
          flowerClump(ctx, x, y, 0.8 + r, themeId === 'hills' ? ['#ffd166', '#ff9e7a', '#fff4d8'] : ['#fff4d8', '#ffd166', '#ff9ec5']);
        } else if (r < 0.56) {
          // seta
          ctx.fillStyle = '#fff1dc'; rr(ctx, x - 4, y - 16, 8, 16, 3); ctx.fill();
          ctx.fillStyle = '#ff7d9c';
          ctx.beginPath(); ctx.ellipse(x, y - 18, 14, 9, 0, Math.PI, 0); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.7)';
          circle(ctx, x - 5, y - 20, 2.2); ctx.fill(); circle(ctx, x + 4, y - 18, 1.6); ctx.fill();
        } else if (r < 0.66) {
          // piedrita
          ctx.fillStyle = 'rgba(140,140,160,.6)';
          ell(ctx, x, y - 6, 14, 8); ctx.fill();
          ell(ctx, x - 10, y - 3, 7, 5); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.4)';
          ell(ctx, x - 3, y - 9, 7, 3, -0.3); ctx.fill();
        } else if (r < 0.74 && level.theme !== 'sky') {
          // margaritas
          for (let k = 0; k < 5; k++) {
            const fx = x + (hash(seed + k) - 0.5) * 50;
            const fy = y - 2;
            ctx.strokeStyle = '#5aa06a'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(fx, y); ctx.lineTo(fx, fy - 10); ctx.stroke();
            ctx.fillStyle = '#fff8ea';
            for (let p2 = 0; p2 < 5; p2++) { const a = p2 / 5 * TAU; circle(ctx, fx + Math.cos(a) * 2.6, fy - 12 + Math.sin(a) * 2.6, 2.1); ctx.fill(); }
            ctx.fillStyle = '#ffd166'; circle(ctx, fx, fy - 12, 1.6); ctx.fill();
          }
        }
        break;
      }
      case 'library': {
        if (r < 0.3) {
          // pila de libros
          const cols = ['#c85a5a', '#5f8fd6', '#ffd166', '#7ddcc4'];
          let ly = y, lw = 34;
          for (let k = 0; k < 4; k++) {
            ctx.fillStyle = cols[(i + k) % cols.length];
            rr(ctx, x - lw / 2, ly - 10, lw, 9, 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x - lw / 2 + 3, ly - 8, lw - 6, 1.6);
            ly -= 9; lw -= 3;
          }
          // velita
          ctx.fillStyle = '#ffe8b0'; rr(ctx, x + 18, y - 18, 6, 18, 2); ctx.fill();
          ctx.fillStyle = '#ffcf5c'; ell(ctx, x + 21, y - 22, 2.4, 4); ctx.fill();
          const g = ctx.createRadialGradient(x + 21, y - 23, 1, x + 21, y - 23, 26);
          g.addColorStop(0, 'rgba(255,210,120,.5)'); g.addColorStop(1, 'rgba(255,210,120,0)');
          ctx.fillStyle = g; circle(ctx, x + 21, y - 23, 26); ctx.fill();
        } else if (r < 0.5) {
          // lámpara de pie
          ctx.strokeStyle = '#3a2c46'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 40); ctx.stroke();
          ctx.fillStyle = '#ffd88a';
          ctx.beginPath(); ctx.moveTo(x - 14, y - 40); ctx.lineTo(x + 14, y - 40); ctx.lineTo(x + 9, y - 58); ctx.lineTo(x - 9, y - 58); ctx.closePath(); ctx.fill();
          const g = ctx.createRadialGradient(x, y - 48, 2, x, y - 48, 50);
          g.addColorStop(0, 'rgba(255,220,150,.35)'); g.addColorStop(1, 'rgba(255,220,150,0)');
          ctx.fillStyle = g; circle(ctx, x, y - 48, 50); ctx.fill();
        } else if (r < 0.62) {
          // taza humeante
          ctx.fillStyle = '#fff4e6'; rr(ctx, x - 9, y - 12, 18, 12, 5); ctx.fill();
          ctx.strokeStyle = '#fff4e6'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x + 11, y - 7, 4, -1.2, 1.2); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(x - 3, y - 18); ctx.quadraticCurveTo(x - 7, y - 24, x - 3, y - 30); ctx.stroke();
        }
        break;
      }
      case 'garden': {
        if (r < 0.3) {
          flowerClump(ctx, x, y, 1 + r * 1.6, ['#ffd0e4', '#fff3c9', '#ff9ec5', '#c9b8ff']);
        } else if (r < 0.44) {
          // arco de rosas
          ctx.strokeStyle = '#6a5a7a'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(x, y, 44, Math.PI, 0); ctx.stroke();
          ctx.strokeStyle = '#4e7a52'; ctx.lineWidth = 2;
          for (let k = 0; k < 8; k++) {
            const a = Math.PI + k / 8 * Math.PI;
            const fx = x + Math.cos(a) * 44, fy = y + Math.sin(a) * 44;
            ctx.fillStyle = k % 2 ? '#ffb7cf' : '#ffd7e6';
            circle(ctx, fx, fy, 5); ctx.fill();
            ctx.fillStyle = '#ffd166'; circle(ctx, fx, fy, 1.6); ctx.fill();
          }
        } else if (r < 0.56) {
          // banco
          ctx.fillStyle = '#8a6a4a';
          rr(ctx, x - 30, y - 22, 60, 7, 3); ctx.fill();
          rr(ctx, x - 30, y - 34, 60, 6, 3); ctx.fill();
          ctx.fillStyle = '#6d5138';
          ctx.fillRect(x - 24, y - 15, 6, 15); ctx.fillRect(x + 18, y - 15, 6, 15);
        } else if (r < 0.66) {
          // fuente
          ctx.fillStyle = 'rgba(200,220,235,.45)';
          ell(ctx, x, y - 2, 28, 8); ctx.fill();
          ctx.fillStyle = '#b8a7d0'; rr(ctx, x - 5, y - 30, 10, 28, 3); ctx.fill();
          ctx.fillStyle = 'rgba(190,220,240,.7)';
          ell(ctx, x, y - 32, 20, 6); ctx.fill();
          ctx.strokeStyle = 'rgba(190,230,255,.7)'; ctx.lineWidth = 2;
          for (let k = 0; k < 3; k++) {
            ctx.beginPath(); ctx.moveTo(x - 10 + k * 10, y - 32); ctx.quadraticCurveTo(x - 20 + k * 20, y - 44, x - 24 + k * 24, y - 12); ctx.stroke();
          }
        }
        break;
      }
      case 'arena': {
        if (r < 0.32) {
          // barril
          ctx.fillStyle = '#8a5a3a'; rr(ctx, x - 14, y - 34, 28, 34, 6); ctx.fill();
          ctx.strokeStyle = '#5c3a24'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(x - 14, y - 26); ctx.lineTo(x + 14, y - 26); ctx.moveTo(x - 14, y - 10); ctx.lineTo(x + 14, y - 10); ctx.stroke();
          ctx.fillStyle = '#a56a44'; ell(ctx, x, y - 34, 14, 4); ctx.fill();
        } else if (r < 0.5) {
          // antorcha
          ctx.fillStyle = '#5c3a2a'; ctx.fillRect(x - 3, y - 50, 6, 50);
          const g = ctx.createRadialGradient(x, y - 56, 2, x, y - 56, 40);
          g.addColorStop(0, 'rgba(255,220,140,.6)'); g.addColorStop(1, 'rgba(255,150,60,0)');
          ctx.fillStyle = g; circle(ctx, x, y - 56, 40); ctx.fill();
          ctx.fillStyle = '#ffd166';
          ctx.beginPath(); ctx.moveTo(x, y - 76 + Math.sin(t * 6 + i) * 3); ctx.quadraticCurveTo(x + 9, y - 58, x, y - 48); ctx.quadraticCurveTo(x - 9, y - 58, x, y - 76); ctx.fill();
        } else if (r < 0.62) {
          // rocas
          ctx.fillStyle = 'rgba(90,60,70,.65)';
          ell(ctx, x, y - 7, 16, 9); ctx.fill();
          ell(ctx, x - 13, y - 3, 9, 6); ctx.fill();
        } else if (r < 0.72) {
          // cartel de entrenamiento
          ctx.fillStyle = '#6b4a35'; ctx.fillRect(x - 2, y - 48, 5, 48);
          ctx.fillStyle = '#c48a4f'; rr(ctx, x - 24, y - 66, 48, 26, 5); ctx.fill();
          ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 2; rr(ctx, x - 24, y - 66, 48, 26, 5); ctx.stroke();
          ctx.fillStyle = '#5c3a24'; ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('¡ÁNIMO!', x, y - 48); ctx.textAlign = 'left';
        }
        break;
      }
      case 'jungle': {
        if (r < 0.3) {
          // helecho
          for (let k = 0; k < 5; k++) {
            const a = -Math.PI / 2 + (k - 2) * 0.38;
            ctx.strokeStyle = 'rgba(90,170,120,.8)'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * 20, y + Math.sin(a) * 26, x + Math.cos(a) * 34, y + Math.sin(a) * 38); ctx.stroke();
            ctx.fillStyle = 'rgba(110,190,130,.75)';
            for (let j = 1; j < 4; j++) {
              const px = x + Math.cos(a) * 10 * j, py = y + Math.sin(a) * 11 * j;
              ell(ctx, px - 4, py, 6, 3, a); ctx.fill();
              ell(ctx, px + 4, py, 6, 3, a); ctx.fill();
            }
          }
        } else if (r < 0.44) {
          // hongo luminoso
          ctx.fillStyle = 'rgba(230,240,220,.9)'; rr(ctx, x - 4, y - 14, 8, 14, 3); ctx.fill();
          ctx.fillStyle = '#8ef2c1';
          ctx.beginPath(); ctx.ellipse(x, y - 16, 15, 9, 0, Math.PI, 0); ctx.fill();
          const g = ctx.createRadialGradient(x, y - 16, 2, x, y - 16, 40);
          g.addColorStop(0, 'rgba(140,255,200,.25)'); g.addColorStop(1, 'rgba(140,255,200,0)');
          ctx.fillStyle = g; circle(ctx, x, y - 16, 40); ctx.fill();
        } else if (r < 0.56) {
          // ídolo de piedra
          ctx.fillStyle = 'rgba(105,120,100,.85)';
          rr(ctx, x - 16, y - 40, 32, 40, 5); ctx.fill();
          ctx.fillStyle = 'rgba(60,80,60,.9)';
          circle(ctx, x - 6, y - 28, 3); ctx.fill(); circle(ctx, x + 6, y - 28, 3); ctx.fill();
          ctx.strokeStyle = 'rgba(60,80,60,.9)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, y - 20, 7, 0.2, Math.PI - 0.2); ctx.stroke();
          ctx.fillStyle = 'rgba(120,200,140,.5)';
          ell(ctx, x - 12, y - 38, 7, 3); ctx.fill();
        } else if (r < 0.68) {
          // piedra cubierta de musgo
          ctx.fillStyle = 'rgba(110,125,105,.8)';
          ell(ctx, x, y - 8, 20, 11); ctx.fill();
          ctx.fillStyle = 'rgba(90,170,110,.6)';
          ell(ctx, x - 3, y - 14, 13, 4); ctx.fill();
        }
        break;
      }
      case 'ruins': {
        if (r < 0.28) {
          // columna rota
          ctx.fillStyle = 'rgba(160,150,120,.8)';
          rr(ctx, x - 14, y - 52, 28, 52, 3); ctx.fill();
          ctx.fillStyle = 'rgba(190,180,150,.8)';
          rr(ctx, x - 18, y - 58, 36, 8, 2); ctx.fill();
          ctx.strokeStyle = 'rgba(110,100,80,.4)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x - 8, y - 50); ctx.lineTo(x - 8, y - 6); ctx.moveTo(x + 8, y - 50); ctx.lineTo(x + 8, y - 6); ctx.stroke();
          ctx.fillStyle = 'rgba(110,160,100,.55)';
          ell(ctx, x - 9, y - 54, 8, 4); ctx.fill();
        } else if (r < 0.42) {
          // ánfora
          ctx.fillStyle = '#b5764d';
          ell(ctx, x, y - 16, 14, 18); ctx.fill();
          ctx.fillStyle = '#8c5636'; rr(ctx, x - 6, y - 38, 12, 9, 3); ctx.fill();
          ctx.strokeStyle = 'rgba(255,230,180,.45)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(x, y - 18, 10, 4, 0, 0, Math.PI); ctx.stroke();
        } else if (r < 0.54) {
          // hierba dorada
          for (let k = 0; k < 6; k++) {
            const a = -Math.PI / 2 + (k - 2.5) * 0.24;
            ctx.strokeStyle = k % 2 ? 'rgba(255,214,120,.8)' : 'rgba(180,200,110,.75)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x + (k - 2.5) * 4, y); ctx.quadraticCurveTo(x + (k - 2.5) * 10, y - 20, x + Math.cos(a) * 26, y - 26 + Math.abs(k - 2.5) * 3); ctx.stroke();
          }
        } else if (r < 0.66) {
          // piedra con símbolo
          ctx.fillStyle = 'rgba(140,130,105,.85)';
          rr(ctx, x - 18, y - 26, 36, 26, 6); ctx.fill();
          ctx.strokeStyle = 'rgba(255,220,140,.6)'; ctx.lineWidth = 2.5;
          circle(ctx, x, y - 14, 7); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x, y - 21); ctx.lineTo(x, y - 7); ctx.stroke();
        }
        break;
      }
      case 'dream': {
        if (r < 0.3) {
          flowerClump(ctx, x, y, 0.9 + r, ['#c9b8ff', '#ffe9b0', '#fff3d8']);
        } else if (r < 0.48) {
          // farolillo
          ctx.strokeStyle = 'rgba(255,240,200,.5)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 42); ctx.stroke();
          const g = ctx.createRadialGradient(x, y - 46, 1, x, y - 46, 34);
          g.addColorStop(0, 'rgba(255,235,170,.6)'); g.addColorStop(1, 'rgba(255,235,170,0)');
          ctx.fillStyle = g; circle(ctx, x, y - 46, 34); ctx.fill();
          ctx.fillStyle = '#ffe9b0'; circle(ctx, x, y - 46, 6); ctx.fill();
          ctx.fillStyle = 'rgba(90,70,120,.9)';
          rr(ctx, x - 8, y - 56, 16, 4, 2); ctx.fill();
        } else if (r < 0.62) {
          // cristal
          ctx.fillStyle = 'rgba(170,150,240,.8)';
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y - 20); ctx.lineTo(x, y - 40); ctx.lineTo(x + 10, y - 20); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.3)';
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y - 20); ctx.lineTo(x, y - 34); ctx.closePath(); ctx.fill();
        } else if (r < 0.74) {
          // seta de ensueño
          ctx.fillStyle = 'rgba(230,220,255,.75)'; rr(ctx, x - 4, y - 14, 8, 14, 3); ctx.fill();
          ctx.fillStyle = 'rgba(150,130,220,.8)';
          ctx.beginPath(); ctx.ellipse(x, y - 16, 14, 9, 0, Math.PI, 0); ctx.fill();
        }
        break;
      }
    }
  }

  function flowerClump(ctx, x, y, sc, colors) {
    for (let k = 0; k < 6; k++) {
      const fx = x + (hash(k * 3 + x) - 0.5) * 44 * sc;
      const fh = 10 + hash(k + y) * 12;
      ctx.strokeStyle = 'rgba(80,140,90,.7)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(fx, y); ctx.quadraticCurveTo(fx + 2, y - fh * 0.6, fx, y - fh); ctx.stroke();
      ctx.fillStyle = colors[k % colors.length];
      for (let p = 0; p < 5; p++) {
        const a = p / 5 * TAU;
        circle(ctx, fx + Math.cos(a) * 3 * sc, y - fh + Math.sin(a) * 3 * sc, 2.4 * sc); ctx.fill();
      }
      ctx.fillStyle = '#ffd166'; circle(ctx, fx, y - fh, 1.6 * sc); ctx.fill();
    }
  }

  /* ═══════════════════════════ PLATAFORMAS ═══════════════════════════ */
  S.drawPlatform = function (ctx, p, themeId, time) {
    const th = theme(themeId);
    const t = time || 0;
    const x = p.x, y = p.y, w = p.w, h = p.h || 16;
    const fluffy = themeId === 'sky' || themeId === 'dream';

    if (p.kind === 'ground') {
      // cuerpo
      const g = ctx.createLinearGradient(0, y, 0, y + h + 160);
      g.addColorStop(0, th.ground);
      g.addColorStop(0.35, shade(th.ground, -10));
      g.addColorStop(1, th.groundDark);
      ctx.fillStyle = g;
      ctx.fillRect(x, y + 8, w, h + 200);
      // estratos
      ctx.strokeStyle = 'rgba(0,0,0,.06)'; ctx.lineWidth = 2;
      for (let k = 0; k < 6; k++) {
        const ly = y + 40 + k * 34;
        ctx.beginPath();
        for (let gx = 0; gx <= w; gx += 26) {
          const py = ly + Math.sin((x + gx) * 0.02 + k) * 5;
          gx ? ctx.lineTo(x + gx, py) : ctx.moveTo(x, py);
        }
        ctx.stroke();
      }
      // pebbles
      for (let k = 0; k < Math.floor(w / 90); k++) {
        const px = x + hash(x + k * 17) * w;
        const py = y + 46 + hash(x + k * 29) * 110;
        ctx.fillStyle = 'rgba(255,255,255,.07)';
        ell(ctx, px, py, 7 + hash(k + x) * 6, 4); ctx.fill();
      }
      // borde superior (hierba/tema)
      if (themeId === 'library') {
        ctx.fillStyle = th.groundTop;
        ctx.fillRect(x, y, w, 12);
        ctx.fillStyle = 'rgba(255,255,255,.12)';
        ctx.fillRect(x, y, w, 3);
        ctx.strokeStyle = 'rgba(40,25,60,.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y + 12); ctx.lineTo(x + w, y + 12); ctx.stroke();
      } else if (themeId === 'arena' || themeId === 'ruins') {
        ctx.fillStyle = th.groundTop;
        ctx.fillRect(x, y, w, 12);
        ctx.fillStyle = 'rgba(0,0,0,.16)';
        for (let gx = 0; gx < w; gx += 44) ctx.fillRect(x + gx, y, 2, 12);
        ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(x, y, w, 3);
        // musgo
        if (themeId === 'ruins') {
          ctx.fillStyle = 'rgba(110,170,100,.45)';
          for (let gx = 10; gx < w; gx += 60) ell(ctx, x + gx + hash(gx) * 20, y + 3, 12, 4); ctx.fill();
        }
      } else {
        ctx.fillStyle = th.groundTop;
        ctx.beginPath();
        ctx.moveTo(x, y + 16);
        for (let gx = 0; gx <= w; gx += 14) {
          ctx.lineTo(x + gx, y + 2 + Math.sin((x + gx) * 0.09) * 2.4 + Math.sin((x + gx) * 0.021) * 2);
        }
        ctx.lineTo(x + w, y + 16);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.2)';
        ctx.beginPath();
        ctx.moveTo(x, y + 8);
        for (let gx = 0; gx <= w; gx += 20) ctx.lineTo(x + gx, y + 2 + Math.sin((x + gx) * 0.09) * 2.4);
        ctx.lineTo(x + w, y + 6); ctx.lineTo(x, y + 6); ctx.closePath(); ctx.fill();
        // matitas
        ctx.strokeStyle = rgba(shade(th.groundTop, -18), 0.9); ctx.lineWidth = 1.6;
        for (let gx = 14; gx < w; gx += 46) {
          const s = x + gx;
          if (hash(s) < 0.45) continue;
          ctx.beginPath(); ctx.moveTo(s, y + 2); ctx.quadraticCurveTo(s + 2, y - 5, s + 5, y - 6); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(s + 3, y + 2); ctx.quadraticCurveTo(s + 5, y - 4, s + 8, y - 4); ctx.stroke();
        }
      }
      return;
    }

    if (p.kind === 'block') {
      // bloque flotante
      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, th.groundTop);
      grad.addColorStop(1, shade(th.ground, -12));
      ctx.fillStyle = grad;
      rr(ctx, x, y, w, h, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 2;
      rr(ctx, x, y, w, h, 8); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      rr(ctx, x + 5, y + 4, w - 10, 5, 2.5); ctx.fill();
      // grabado
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2;
      circle(ctx, x + w / 2, y + h / 2, Math.min(w, h) * 0.2); ctx.stroke();
      // hierba encima
      ctx.fillStyle = themeId === 'library' ? 'rgba(255,255,255,.06)' : th.groundTop;
      if (themeId !== 'library') {
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 4);
        for (let gx = 2; gx <= w - 2; gx += 10) ctx.lineTo(x + gx, y + 1 + Math.sin(gx * 0.4) * 1.5);
        ctx.lineTo(x + w - 2, y + 5); ctx.closePath(); ctx.fill();
      }
      // enredadera
      if (themeId === 'jungle' || themeId === 'ruins') {
        ctx.strokeStyle = 'rgba(90,160,100,.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + 8, y + h); ctx.quadraticCurveTo(x + 2, y + h + 12, x + 10, y + h + 18); ctx.stroke();
      }
      return;
    }

    // plataformas de un solo sentido
    if (fluffy) {
      // nube
      ctx.fillStyle = 'rgba(255,255,255,.16)';
      drawPuff(ctx, x + 14, y + 12, 0.7, 'rgba(255,255,255,.2)');
      ctx.fillStyle = themeId === 'dream' ? 'rgba(210,195,255,.9)' : '#fffdf6';
      for (let gx = 0; gx <= w; gx += 30) {
        const r = 0.55 + hash(x + gx) * 0.35;
        circle(ctx, x + gx, y + 8 + (gx === 0 || gx >= w - 1 ? 4 : 0), 15 * r); ctx.fill();
      }
      rr(ctx, x + 2, y + 4, w - 4, 12, 8); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      rr(ctx, x + 8, y + 5, Math.max(10, w - 16), 4, 2); ctx.fill();
      // brillos
      if (themeId === 'dream') {
        sparkle(ctx, x + w * 0.3, y - 2, 3, '#fff3c4', 0.8);
        sparkle(ctx, x + w * 0.7, y + 4, 2, '#fff3c4', 0.6);
      }
      return;
    }

    // plataforma temática
    if (themeId === 'library') {
      ctx.fillStyle = '#5c4033';
      rr(ctx, x, y - 4, w, 22, 5); ctx.fill();
      ctx.fillStyle = '#8a6248';
      rr(ctx, x + 2, y - 2, w - 4, 8, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      ctx.fillRect(x + 8, y - 1, w - 16, 2);
      // libros colgando
      for (let gx = 10; gx < w - 10; gx += 20) {
        const cols = ['#c85a5a', '#5f8fd6', '#ffd166', '#7ddcc4', '#a99bf0'];
        ctx.fillStyle = cols[Math.floor(hash(x + gx) * cols.length)];
        rr(ctx, x + gx, y + 18 + hash(gx) * 6, 11, 12 + hash(gx + 3) * 8, 2); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 2;
      rr(ctx, x, y - 4, w, 22, 5); ctx.stroke();
      return;
    }

    if (themeId === 'sky') {
      ctx.fillStyle = '#9a7bb8';
      rr(ctx, x, y, w, 14, 6); ctx.fill();
      ctx.fillStyle = '#d3a77c';
      rr(ctx, x + 2, y - 2, w - 4, 8, 4); ctx.fill();
      return;
    }

    if (themeId === 'arena') {
      ctx.fillStyle = '#6b4b3a';
      rr(ctx, x, y, w, 16, 5); ctx.fill();
      ctx.fillStyle = '#a5644e'; rr(ctx, x + 2, y - 1, w - 4, 7, 3); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.2)';
      for (let gx = 16; gx < w; gx += 34) ctx.fillRect(x + gx, y + 8, 3, 8);
      return;
    }

    if (themeId === 'jungle') {
      ctx.fillStyle = '#4b5a42';
      rr(ctx, x, y, w, 16, 5); ctx.fill();
      ctx.fillStyle = '#57a85e';
      ctx.beginPath();
      ctx.moveTo(x, y + 8);
      for (let gx = 0; gx <= w; gx += 15) ctx.lineTo(x + gx, y + 2 + Math.sin((x + gx) * 0.12) * 2);
      ctx.lineTo(x + w, y + 8); ctx.closePath(); ctx.fill();
      // musgo colgante
      ctx.strokeStyle = 'rgba(110,200,130,.55)'; ctx.lineWidth = 2;
      for (let gx = 12; gx < w; gx += 28) {
        ctx.beginPath(); ctx.moveTo(x + gx, y + 14); ctx.quadraticCurveTo(x + gx - 3, y + 22, x + gx + 2, y + 28 + hash(gx) * 10); ctx.stroke();
      }
      return;
    }

    if (themeId === 'ruins') {
      ctx.fillStyle = '#8c7a5a';
      rr(ctx, x, y, w, 16, 4); ctx.fill();
      ctx.fillStyle = '#b3a071'; rr(ctx, x + 1, y - 1, w - 2, 7, 3); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.2)';
      for (let gx = 20; gx < w; gx += 40) ctx.fillRect(x + gx, y, 2, 15);
      ctx.fillStyle = 'rgba(110,170,100,.5)';
      ell(ctx, x + w * 0.3, y + 2, 14, 3); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x, y + 14, w, 3);
      return;
    }

    // pradera / colinas / jardín / ensueño
    ctx.fillStyle = shade(th.ground, 6);
    rr(ctx, x, y, w, 16, 6); ctx.fill();
    ctx.fillStyle = th.groundTop;
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    for (let gx = 0; gx <= w; gx += 13) ctx.lineTo(x + gx, y + 1 + Math.sin((x + gx) * 0.1) * 2);
    ctx.lineTo(x + w, y + 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x + 4, y + 1, w - 8, 2);
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1.5;
    rr(ctx, x, y, w, 16, 6); ctx.stroke();
    // raíces
    ctx.strokeStyle = rgba(shade(th.ground, -18), 0.8); ctx.lineWidth = 2;
    for (let gx = 18; gx < w; gx += 42) {
      if (hash(x + gx) < 0.4) continue;
      ctx.beginPath(); ctx.moveTo(x + gx, y + 15); ctx.quadraticCurveTo(x + gx + 3, y + 21, x + gx + 1, y + 27); ctx.stroke();
    }
    if (themeId === 'garden') {
      for (let gx = 12; gx < w; gx += 38) {
        if (hash(x + gx + 2) < 0.5) continue;
        ctx.fillStyle = 'rgba(255,183,207,.85)';
        circle(ctx, x + gx, y - 2, 2.2); ctx.fill();
        circle(ctx, x + gx + 4, y - 3, 1.8); ctx.fill();
      }
    }
    if (themeId === 'dream') {
      sparkle(ctx, x + w * 0.25, y - 3, 2.6, '#ffe9b0', 0.7);
      sparkle(ctx, x + w * 0.72, y + 2, 2, '#cdbcff', 0.6);
    }
  };

  /* ═══════════════════════════ ELEMENTOS INTERACTIVOS ═══════════════════════════ */
  S.drawSign = function (ctx, x, y, time, defId) {
    const t = time || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(40,25,30,.18)';
    ell(ctx, 0, 1, 22, 5); ctx.fill();
    ctx.fillStyle = '#8a5a3a';
    rr(ctx, -3, -46, 6, 46, 2); ctx.fill();
    ctx.fillStyle = '#b07a4a';
    rr(ctx, -26, -66, 52, 30, 5); ctx.fill();
    ctx.strokeStyle = '#7a4f30'; ctx.lineWidth = 2;
    rr(ctx, -26, -66, 52, 30, 5); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    rr(ctx, -22, -62, 44, 3, 1.5); ctx.fill();
    // pictograma
    ctx.strokeStyle = '#5b3b26'; ctx.fillStyle = '#5b3b26'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const cx = 0, cy = -51;
    if (defId === 'jump') {
      ctx.beginPath(); ctx.moveTo(cx, cy + 7); ctx.lineTo(cx, cy - 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 5, cy - 2); ctx.lineTo(cx, cy - 8); ctx.lineTo(cx + 5, cy - 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 8, cy + 8); ctx.lineTo(cx + 8, cy + 8); ctx.stroke();
    } else if (defId === 'run') {
      ctx.font = '800 13px "Baloo 2", sans-serif'; ctx.fillText('»»', cx, cy + 1);
    } else if (defId === 'interact') {
      ctx.strokeStyle = '#5b3b26'; ctx.lineWidth = 2;
      rr(ctx, cx - 7, cy - 8, 14, 16, 4); ctx.stroke();
      ctx.font = '800 12px "Baloo 2", sans-serif'; ctx.fillText('E', cx, cy + 1);
    } else if (defId === 'companion') {
      ctx.fillStyle = '#b8860b';
      ctx.beginPath(); ctx.ellipse(cx, cy, 9, 7, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8a5a3a'; circle(ctx, cx + 6, cy - 4, 2); ctx.fill();
    } else if (defId === 'combat') {
      ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.fillText('⚔', cx, cy + 1);
    } else if (defId === 'secret') {
      ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.fillText('?', cx, cy + 1);
    } else if (defId === 'goal') {
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#ff7d9c'; circle(ctx, cx, cy, 2.4); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(cx - 7, cy); ctx.lineTo(cx + 7, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 2, cy - 5); ctx.lineTo(cx + 7, cy); ctx.lineTo(cx + 2, cy + 5); ctx.stroke();
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    // brillo
    const g = ctx.createRadialGradient(0, -54, 2, 0, -54, 40);
    g.addColorStop(0, 'rgba(255,240,180,.30)');
    g.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = g; circle(ctx, 0, -54, 40); ctx.fill();
    ctx.restore();
  };

  S.drawCheckpoint = function (ctx, x, y, time, active) {
    const t = time || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(40,25,30,.16)';
    ell(ctx, 0, 1, 14, 4); ctx.fill();
    ctx.fillStyle = active ? '#c9a24a' : '#8a7a6a';
    rr(ctx, -3, -66, 6, 66, 2); ctx.fill();
    const glow = active ? 0.85 : 0.3;
    if (active) {
      const g = ctx.createRadialGradient(0, -72, 2, 0, -72, 46);
      g.addColorStop(0, 'rgba(255,225,140,.5)');
      g.addColorStop(1, 'rgba(255,225,140,0)');
      ctx.fillStyle = g; circle(ctx, 0, -72, 46); ctx.fill();
    }
    ctx.fillStyle = active ? '#ffd166' : 'rgba(200,190,175,.6)';
    ctx.beginPath();
    ctx.moveTo(0, -76);
    ctx.lineTo(22, -68);
    ctx.lineTo(0, -58);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(90,60,30,.3)'; ctx.lineWidth = 1.2; ctx.stroke();
    // farol
    ctx.fillStyle = active ? '#ffe9b0' : 'rgba(230,220,205,.5)';
    circle(ctx, 0, -80, 5); ctx.fill();
    ctx.fillStyle = active ? '#c9a24a' : '#8a7a6a';
    rr(ctx, -5, -86, 10, 3, 1.5); ctx.fill();
    if (active) {
      for (let i = 0; i < 3; i++) {
        const a = t * 2 + i * 2.1;
        sparkle(ctx, Math.cos(a) * 16, -74 + Math.sin(a) * 10, 2, '#fff3c4', 0.7);
      }
    }
    ctx.restore();
  };

  S.drawQuizStand = function (ctx, x, y, time, solved) {
    const t = time || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(40,20,40,.18)';
    ell(ctx, 0, 1, 28, 6); ctx.fill();
    const glowColor = solved ? 'rgba(140,230,170,' : 'rgba(255,225,150,';
    const glow = ctx.createRadialGradient(0, -26, 2, 0, -26, 52);
    glow.addColorStop(0, glowColor + '0.4)');
    glow.addColorStop(1, glowColor + '0)');
    ctx.fillStyle = glow; circle(ctx, 0, -26, 52); ctx.fill();
    // libro abierto pedestal
    ctx.fillStyle = '#8a6248'; rr(ctx, -16, -20, 32, 20, 4); ctx.fill();
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath(); ctx.moveTo(-22, -26); ctx.quadraticCurveTo(-10, -32, 0, -26); ctx.lineTo(0, -14); ctx.quadraticCurveTo(-10, -20, -22, -16); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(22, -26); ctx.quadraticCurveTo(10, -32, 0, -26); ctx.lineTo(0, -14); ctx.quadraticCurveTo(10, -20, 22, -16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,90,60,.4)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(0, -14); ctx.stroke();
    // símbolo flotante
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '800 26px "Baloo 2", sans-serif';
    ctx.fillStyle = solved ? '#7ddcc4' : '#ffcf5c';
    ctx.save();
    ctx.translate(0, -58 + Math.sin(t * 2) * 4);
    ctx.fillText(solved ? '✓' : '?', 0, 0);
    ctx.restore();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (!solved) {
      for (let i = 0; i < 3; i++) {
        const a = t * 1.3 + i * 2.3;
        sparkle(ctx, Math.cos(a) * 30, -54 + Math.sin(a) * 12, 2.4, '#ffe9a8', 0.7);
      }
    }
    ctx.restore();
  };

  S.drawGoal = function (ctx, x, y, time, open, themeId) {
    const t = time || 0;
    const th = theme(themeId);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(40,20,40,.2)';
    ell(ctx, 0, 2, 56, 12); ctx.fill();
    // pórtico
    const glow = ctx.createRadialGradient(0, -76, 6, 0, -76, 90);
    glow.addColorStop(0, open ? 'rgba(255,235,170,.4)' : 'rgba(255,225,160,.22)');
    glow.addColorStop(1, 'rgba(255,225,160,0)');
    ctx.fillStyle = glow; circle(ctx, 0, -76, 90); ctx.fill();
    ctx.fillStyle = open ? '#ffe9b0' : '#dfc99a';
    rr(ctx, -44, -150, 18, 150, 8); ctx.fill();
    rr(ctx, 26, -150, 18, 150, 8); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-52, -142);
    ctx.quadraticCurveTo(0, -196, 52, -142);
    ctx.lineTo(40, -134);
    ctx.quadraticCurveTo(0, -180, -40, -134);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(140,100,50,.3)'; ctx.lineWidth = 2; ctx.stroke();
    // puerta de luz
    const doorGrad = ctx.createLinearGradient(0, -130, 0, 0);
    doorGrad.addColorStop(0, open ? 'rgba(255,246,210,.85)' : 'rgba(255,240,200,.4)');
    doorGrad.addColorStop(1, open ? 'rgba(255,214,150,.35)' : 'rgba(255,230,190,.15)');
    ctx.fillStyle = doorGrad;
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-30, -118);
    ctx.quadraticCurveTo(0, -154, 30, -118);
    ctx.lineTo(30, 0);
    ctx.closePath(); ctx.fill();
    // corazones que suben
    if (open) {
      for (let i = 0; i < 5; i++) {
        const k = (t * 0.4 + i * 0.2) % 1;
        const hx = Math.sin(t + i * 2) * 18;
        ctx.globalAlpha = (1 - k) * 0.8;
        ctx.fillStyle = '#ff9ab5';
        ctx.save();
        ctx.translate(hx, -20 - k * 120);
        ctx.scale(0.6, 0.6);
        ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-12, -1, -10, -12, -2, -12); ctx.bezierCurveTo(1, -12, 3, -9, 0, -4); ctx.bezierCurveTo(-3, -9, 0, -12, 3, -12); ctx.bezierCurveTo(10, -12, 12, -1, 0, 8); ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    // estrellas del dintel
    [ [-36, -150], [0, -176], [36, -150] ].forEach(([sx, sy], i) => {
      sparkle(ctx, sx, sy + Math.sin(t * 2 + i) * 2, 5, '#fff3c4', 0.9);
    });
    ctx.restore();
  };

  S.drawGate = function (ctx, x, y, time, locked) {
    const t = time || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(40,20,40,.18)';
    ell(ctx, 0, 2, 40, 9); ctx.fill();
    ctx.fillStyle = '#7a5a3a';
    rr(ctx, -34, -112, 10, 112, 4); ctx.fill();
    rr(ctx, 24, -112, 10, 112, 4); ctx.fill();
    ctx.fillStyle = locked ? '#b04a4a' : '#7ddcc4';
    ctx.beginPath();
    ctx.moveTo(-28, -96); ctx.quadraticCurveTo(0, -114, 28, -96);
    ctx.lineTo(28, -84); ctx.quadraticCurveTo(0, -100, -28, -84); ctx.closePath(); ctx.fill();
    // cuerdas
    if (locked) {
      ctx.strokeStyle = '#d8b57a'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-24, -78 + i * 10);
        ctx.quadraticCurveTo(0, -70 + i * 10 + Math.sin(t * 2 + i) * 2, 24, -78 + i * 10);
        ctx.stroke();
      }
      // candado
      ctx.fillStyle = '#ffd166';
      rr(ctx, -9, -44, 18, 15, 4); ctx.fill();
      ctx.strokeStyle = '#c99a2a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, -44, 7, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = '#8a5a3a'; circle(ctx, 0, -37, 2.4); ctx.fill();
    } else {
      const g = ctx.createRadialGradient(0, -60, 2, 0, -60, 70);
      g.addColorStop(0, 'rgba(180,255,220,.3)'); g.addColorStop(1, 'rgba(180,255,220,0)');
      ctx.fillStyle = g; circle(ctx, 0, -60, 70); ctx.fill();
      sparkle(ctx, -12, -60, 5, '#d9ffe8', 0.9);
      sparkle(ctx, 14, -48, 4, '#d9ffe8', 0.8);
    }
    ctx.restore();
  };

  S.drawCompanionSpot = function (ctx, x, y, time) {
    const t = time || 0;
    ctx.save();
    ctx.translate(x, y);
    const g = ctx.createRadialGradient(0, -16, 2, 0, -16, 34);
    g.addColorStop(0, 'rgba(255,230,150,.28)'); g.addColorStop(1, 'rgba(255,230,150,0)');
    ctx.fillStyle = g; circle(ctx, 0, -16, 34); ctx.fill();
    ctx.strokeStyle = 'rgba(255,225,150,.5)'; ctx.lineWidth = 2; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  };

  /* ═══════════════════════════ PARTÍCULAS AMBIENTALES ═══════════════════════════ */
  S.drawAmbient = function (ctx, themeId, camX, time, w, h, opts) {
    const th = theme(themeId);
    w = w || 1280; h = h || 720;
    const t = time || 0;
    const o = opts || {};
    const count = o.count || 26;
    const type = th.particle;
    for (let i = 0; i < count; i++) {
      const seed = hash(i * 3.7 + 2);
      let x = (hash(i * 5.1) * (w + 160) - camX * 0.18 + t * (8 + seed * 16)) % (w + 160);
      if (x < 0) x += w + 160;
      x -= 80;
      let y, a = 1, r = 2;
      if (type === 'pollen') {
        y = h * 0.25 + hash(i * 7.3) * h * 0.62 + Math.sin(t * 0.6 + i) * 18;
        x += Math.sin(t * 0.4 + i * 1.7) * 12;
        a = 0.25 + 0.5 * Math.abs(Math.sin(t * 0.8 + i * 2));
        r = 1.2 + seed * 2;
        ctx.fillStyle = `rgba(255,240,180,${a})`;
        circle(ctx, x, y, r); ctx.fill();
        if (seed > 0.8) sparkle(ctx, x, y, 4, '#fff6d0', a * 0.5);
      } else if (type === 'petal') {
        y = ((hash(i * 6.3) * (h + 80) + t * (14 + seed * 22)) % (h + 80)) - 40;
        x += Math.sin(t * 0.9 + i) * 24;
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * 1.2 + i);
        ctx.fillStyle = `rgba(255,190,215,${0.4 + seed * 0.4})`;
        ell(ctx, 0, 0, 4.5 + seed * 2, 2.4); ctx.fill();
        ctx.restore();
      } else if (type === 'ember') {
        y = h + 20 - ((hash(i * 4.9) * (h + 100) + t * (18 + seed * 26)) % (h + 100));
        x += Math.sin(t * 0.7 + i * 2) * 16;
        a = 0.3 + 0.5 * Math.abs(Math.sin(t * 1.6 + i));
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 7);
        grd.addColorStop(0, `rgba(255,200,110,${a})`);
        grd.addColorStop(1, 'rgba(255,140,60,0)');
        ctx.fillStyle = grd; circle(ctx, x, y, 7); ctx.fill();
        ctx.fillStyle = `rgba(255,220,150,${a})`; circle(ctx, x, y, 1.6); ctx.fill();
      } else if (type === 'firefly') {
        y = h * 0.3 + hash(i * 8.7) * h * 0.55 + Math.sin(t * 0.8 + i * 1.3) * 22;
        x += Math.sin(t * 0.5 + i) * 20;
        const blink = Math.max(0, Math.sin(t * 1.5 + i * 2.3));
        if (blink < 0.15) continue;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 9);
        grd.addColorStop(0, `rgba(210,255,170,${blink * 0.8})`);
        grd.addColorStop(1, 'rgba(160,255,180,0)');
        ctx.fillStyle = grd; circle(ctx, x, y, 9); ctx.fill();
        ctx.fillStyle = `rgba(240,255,210,${blink})`; circle(ctx, x, y, 1.8); ctx.fill();
      } else if (type === 'lantern') {
        y = h * 0.2 + hash(i * 2.9) * h * 0.55 + Math.sin(t * 0.5 + i) * 10;
        a = 0.25 + 0.3 * Math.abs(Math.sin(t * 0.9 + i));
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 12);
        grd.addColorStop(0, `rgba(255,220,150,${a})`);
        grd.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = grd; circle(ctx, x, y, 12); ctx.fill();
        ctx.fillStyle = `rgba(255,235,180,${a * 1.5})`; circle(ctx, x, y, 1.6); ctx.fill();
      } else {
        // star
        y = hash(i * 9.1) * h * 0.6;
        a = 0.2 + 0.6 * Math.abs(Math.sin(t * 0.7 + i * 1.9));
        ctx.fillStyle = `rgba(255,246,215,${a})`;
        circle(ctx, x, y, 1 + seed * 1.5); ctx.fill();
        if (seed > 0.75) sparkle(ctx, x, y, 3 + seed * 3, '#fff6d8', a * 0.7);
      }
    }
  };

  /* ═══════════════════════════ PRIMER PLANO ═══════════════════════════ */
  S.drawForeground = function (ctx, themeId, camX, time, w, h) {
    w = w || 1280; h = h || 720;
    const t = time || 0;
    // viñeta suave
    const vg = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.35, w / 2, h * 0.5, h * 0.85);
    vg.addColorStop(0, 'rgba(20,10,30,0)');
    vg.addColorStop(1, 'rgba(20,10,30,.22)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    if (themeId === 'jungle' || themeId === 'garden' || themeId === 'meadow') {
      // hojas en las esquinas
      const corner = (cx, cy, flip) => {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(flip, 1);
        ctx.fillStyle = themeId === 'garden' ? 'rgba(60,40,80,.5)' : 'rgba(20,50,35,.5)';
        for (let i = 0; i < 4; i++) {
          ctx.save(); ctx.rotate(0.3 + i * 0.22);
          ell(ctx, 30 + i * 20, 10 + i * 6, 50, 14, -0.1); ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      };
      corner(0, h - 10, 1);
      corner(w, h - 10, -1);
    } else if (themeId === 'library') {
      // marco de estantería en los bordes
      ctx.fillStyle = 'rgba(25,18,40,.55)';
      rr(ctx, -20, 0, 70, h, 0); ctx.fill();
      rr(ctx, w - 50, 0, 70, h, 0); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.05)';
      for (let i = 0; i < 20; i++) { ctx.fillRect(4, i * 40 + 6, 18, 30); ctx.fillRect(w - 32, i * 40 + 6, 18, 30); }
    } else if (themeId === 'dream') {
      const g = ctx.createLinearGradient(0, h - 70, 0, h);
      g.addColorStop(0, 'rgba(60,40,100,0)');
      g.addColorStop(1, 'rgba(40,25,70,.45)');
      ctx.fillStyle = g; ctx.fillRect(0, h - 70, w, 70);
    }
  };

  /* ═══════════════════════════ MINIATURAS ═══════════════════════════ */
  S.drawThumb = function (canvas, themeId, time) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const t = time || 0;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
    S.drawBackdrop(ctx, themeId, w * 0.3, 0, t, w, h, { length: 2000 });
    // suelo
    const th = theme(themeId);
    ctx.fillStyle = themeId === 'library' ? '#5c4033' : shade(th.ground, -6);
    ctx.fillRect(0, h * 0.84, w, h * 0.16);
    ctx.fillStyle = th.groundTop;
    ctx.fillRect(0, h * 0.82, w, h * 0.04);
    // siluetas de personajes
    if (themeId === 'dream') {
      A.drawSnoopy(ctx, w * 0.74, h * 0.95, h / 120, t, 'stand', { facing: -1 });
    } else if (themeId === 'library' || themeId === 'garden') {
      A.drawWoodstock(ctx, w * 0.72, h * 0.86, h / 210, t, { expression: 'happy' });
    }
    ctx.restore();
  };
})();
