/* ═══════════════════════════════════════════════════════════════
   ART — personajes, compañeros, retratos, objetos y criaturas
   Todo dibujado a mano con Canvas: nada de imágenes externas.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const SLW = window.SLW;
  const A = SLW.Art = {};
  const TAU = Math.PI * 2;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const pick = (list, id, fallback) => list.find(o => o.id === id) || list.find(o => o.id === fallback) || list[0];

  function hexToRgb(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgba(hex, a) {
    const c = hexToRgb(hex);
    return `rgba(${c.r},${c.g},${c.b},${a})`;
  }
  function shade(hex, amt) {
    const c = hexToRgb(hex);
    const f = v => clamp(Math.round(v + amt), 0, 255);
    return `rgb(${f(c.r)},${f(c.g)},${f(c.b)})`;
  }
  function rr(ctx, x, y, w, h, r) {
    const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
  function ell(ctx, x, y, rx, ry, rot) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); }
  function sparkle(ctx, x, y, s, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = color || '#ffd166';
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.quadraticCurveTo(x + s * 0.16, y - s * 0.16, x + s, y);
    ctx.quadraticCurveTo(x + s * 0.16, y + s * 0.16, x, y + s);
    ctx.quadraticCurveTo(x - s * 0.16, y + s * 0.16, x - s, y);
    ctx.quadraticCurveTo(x - s * 0.16, y - s * 0.16, x, y - s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const INK = 'rgba(50,38,62,.22)';

  /* ═══════════════════════════ PERSONAJE ═══════════════════════════ */
  A.drawPerson = function (ctx, app, opts) {
    const o = opts || {};
    const g = Object.assign({}, SLW.DEFAULT_APPEARANCE, app || {});
    const skin = pick(SLW.SKIN_TONES, g.skin, 's3');
    const hc = pick(SLW.HAIR_COLORS, g.hairColor, 'h1');
    const hair = pick(SLW.HAIRS, g.hair, 'bob');
    const eyes = pick(SLW.EYE_COLORS, g.eyes, 'e2');
    const top = pick(SLW.TOPS, g.top, 'tee');
    const bottom = pick(SLW.BOTTOMS, g.bottom, 'jeans');
    const shoe = pick(SLW.SHOES, g.shoes, 'sneakers');
    const acc = g.accessory || 'none';
    const state = o.state || 'idle';
    const phase = o.phase || 0;
    const time = o.time || 0;
    const facing = o.facing == null ? 1 : o.facing;
    const scale = o.scale || 1;
    const expr = o.expression || 'happy';
    const blink = o.blink !== undefined ? o.blink : (state === 'idle' && ((time * 0.9) % 4.6) > 4.44);

    let bob = 0, legF = 0, legB = 0, armF = 0.06, armB = -0.06, headShift = 0, headTilt = 0;
    if (state === 'idle') {
      bob = Math.sin(time * 2.2) * 1.3;
      armF = 0.08 + Math.sin(time * 2.2) * 0.02;
      armB = -0.08 - Math.sin(time * 2.2) * 0.02;
      headTilt = Math.sin(time * 1.1) * 0.02;
    } else if (state === 'walk') {
      bob = Math.abs(Math.sin(phase)) * 1.7;
      legF = -Math.sin(phase) * 0.52; legB = Math.sin(phase) * 0.52;
      armF = Math.sin(phase) * 0.42; armB = -Math.sin(phase) * 0.42;
      headTilt = Math.sin(phase) * 0.03;
    } else if (state === 'run') {
      bob = Math.abs(Math.sin(phase)) * 2.6;
      legF = -Math.sin(phase) * 0.82; legB = Math.sin(phase) * 0.82;
      armF = Math.sin(phase) * 0.78; armB = -Math.sin(phase) * 0.78;
      headShift = 2.5; headTilt = -0.06;
    } else if (state === 'jump') {
      bob = -2; legF = -0.72; legB = 0.5; armF = -1.45; armB = -1.05; headTilt = -0.03;
    } else if (state === 'fall') {
      bob = 0; legF = -0.28; legB = 0.34; armF = -1.15; armB = 1.02; headTilt = 0.04;
    } else if (state === 'hurt') {
      bob = 1; legF = 0.2; legB = -0.25; armF = 0.75; armB = -0.75; headTilt = -0.08;
    } else if (state === 'cheer') {
      bob = -Math.abs(Math.sin(time * 6)) * 3; armF = -1.7; armB = -1.7; headTilt = 0.06;
    }

    ctx.save();
    ctx.translate(o.x || 0, o.y || 0);
    ctx.scale(scale * facing, scale);
    ctx.translate(0, -bob);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const skinLeg = bottom.id === 'skirt' || bottom.id === 'shorts';
    const longSleeve = top.id === 'hoodie' || top.id === 'jacket' || top.id === 'sweater';

    const drawLeg = (angle, back) => {
      ctx.save();
      ctx.translate(back ? -6.2 : 6.2, -33);
      ctx.rotate(angle);
      ctx.fillStyle = skinLeg ? (back ? shade(skin.color, -14) : skin.color) : (back ? shade(bottom.color, -12) : bottom.color);
      rr(ctx, -5.2, -2, 10.4, 29, 5); ctx.fill();
      if (bottom.id === 'shorts') {
        ctx.fillStyle = back ? shade(bottom.color, -12) : bottom.color;
        rr(ctx, -5.5, -2, 11, 12, 4.5); ctx.fill();
      }
      if (skinLeg) {
        ctx.fillStyle = back ? shade(skin.color, -10) : '#fffaf2';
        rr(ctx, -4.6, 19, 9.2, 6, 2.5); ctx.fill();
      }
      ctx.save();
      ctx.translate(1.4, 25);
      ctx.rotate(-angle * 0.5);
      if (shoe.id === 'boots' || shoe.id === 'rain') {
        ctx.fillStyle = shoe.color;
        rr(ctx, -6.8, -9, 14.4, 16, 5); ctx.fill();
        ctx.fillStyle = shoe.color2;
        rr(ctx, -6.8, 2.5, 14.4, 5.5, 2.5); ctx.fill();
        ctx.fillStyle = rgba('#ffffff', 0.28);
        rr(ctx, -4.5, -7, 4, 10, 2); ctx.fill();
      } else if (shoe.id === 'sandals') {
        ctx.fillStyle = skin.color;
        rr(ctx, -6.5, -4, 14, 8, 3.5); ctx.fill();
        ctx.strokeStyle = shoe.color; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(-4.5, -3); ctx.lineTo(2, 3); ctx.moveTo(0, -3); ctx.lineTo(5, 2); ctx.stroke();
      } else {
        ctx.fillStyle = shoe.color;
        rr(ctx, -7, -4.5, 16, 9, 4.5); ctx.fill();
        ctx.fillStyle = shoe.color2;
        rr(ctx, -7, 2.2, 16, 3.6, 1.8); ctx.fill();
        if (shoe.id === 'sneakers') {
          ctx.strokeStyle = shoe.accent; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(-2, -2.6); ctx.lineTo(6, -2.6); ctx.stroke();
        } else if (shoe.id === 'mary') {
          ctx.strokeStyle = shoe.accent; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(1, 1.5); ctx.stroke();
        }
      }
      ctx.restore();
      ctx.restore();
    };

    const drawArm = (angle, back) => {
      ctx.save();
      ctx.translate(back ? -13.4 : 13.4, -72);
      ctx.rotate(angle);
      ctx.fillStyle = back ? shade(skin.color, -12) : skin.color;
      rr(ctx, -3.5, -1, 7, 26, 3.6); ctx.fill();
      const sleeve = longSleeve ? 18 : 8;
      ctx.fillStyle = back ? shade(top.color, -14) : top.color;
      rr(ctx, -4.4, -2.5, 8.8, sleeve + 3, 4.2); ctx.fill();
      if (top.id === 'stripes' && !longSleeve) {
        ctx.fillStyle = top.color2;
        rr(ctx, -4.4, 1.5, 8.8, 2.6, 1.2); ctx.fill();
      }
      ctx.fillStyle = back ? shade(skin.color, -8) : skin.color;
      circle(ctx, 0, 26, 4); ctx.fill();
      ctx.restore();
    };

    /* ── cabello ── */
    const hairBase = hc.color, hairLight = hc.light, hairDeep = shade(hairBase, -28);
    const HEAD_CY = -103;

    // casquete redondeado: cubre todo el cuero cabelludo y queda detrás de la cara
    const hairCap = () => {
      ctx.fillStyle = hairBase;
      ctx.beginPath();
      ctx.ellipse(0, HEAD_CY - 1, 26.8, 25.4, 0, Math.PI, TAU);
      ctx.closePath();
      ctx.fill();
    };

    const drawHairBack = () => {
      hairCap();
      ctx.fillStyle = hairBase;
      if (hair.id === 'long') {
        ctx.beginPath();
        ctx.moveTo(-26, -101);
        ctx.bezierCurveTo(-33, -86, -34, -66, -30, -50);
        ctx.quadraticCurveTo(-21, -43, -11, -52);
        ctx.lineTo(11, -52);
        ctx.quadraticCurveTo(21, -43, 30, -50);
        ctx.bezierCurveTo(34, -66, 33, -86, 26, -101);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(hairLight, 0.22);
        ell(ctx, -27, -72, 4, 16, 0.06); ctx.fill();
        ell(ctx, 27, -72, 4, 16, -0.06); ctx.fill();
      } else if (hair.id === 'bob') {
        rr(ctx, -30, -112, 10.5, 30, 5.2); ctx.fill();
        rr(ctx, 19.5, -112, 10.5, 30, 5.2); ctx.fill();
      } else if (hair.id === 'pony') {
        ctx.beginPath();
        ctx.moveTo(-21, -113);
        ctx.bezierCurveTo(-39, -114, -47, -92, -39, -75);
        ctx.bezierCurveTo(-34, -64, -39, -56, -30, -52);
        ctx.bezierCurveTo(-21, -49, -23, -61, -26, -70);
        ctx.bezierCurveTo(-30, -83, -23, -94, -15, -101);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff8fa8';
        ell(ctx, -26.5, -105, 5, 3.4, 0.55); ctx.fill();
        ctx.fillStyle = '#ffd166';
        circle(ctx, -25.5, -104.5, 1.7); ctx.fill();
      } else if (hair.id === 'curly') {
        [[-22, -100, 9], [-24, -112, 8], [-14, -122, 8.5], [-1, -127, 8.6], [13, -123, 8.2], [24, -112, 8], [26, -99, 7.2], [23, -86, 5.8], [-24, -86, 5.8]]
          .forEach(([x, y, r]) => { circle(ctx, x, y, r); ctx.fill(); });
        ctx.fillStyle = rgba(hairLight, 0.3);
        [[-18, -119, 3], [3, -125, 3.2], [18, -118, 2.8]].forEach(([x, y, r]) => { circle(ctx, x, y, r); ctx.fill(); });
      } else if (hair.id === 'buns') {
        circle(ctx, -20, -121, 9.5); ctx.fill();
        circle(ctx, 20, -121, 9.5); ctx.fill();
        ctx.fillStyle = rgba(hairLight, 0.32);
        circle(ctx, -22, -123.5, 3); ctx.fill();
        circle(ctx, 18, -123.5, 3); ctx.fill();
      }
    };

    const drawHairFront = () => {
      // flequillo con borde festoneado, siempre por encima de las cejas
      ctx.fillStyle = hairBase;
      ctx.beginPath();
      ctx.moveTo(-26.6, -104);
      ctx.bezierCurveTo(-28, -122, -16, -128.6, 0, -128.6);
      ctx.bezierCurveTo(16, -128.6, 28, -122, 26.6, -104);
      ctx.quadraticCurveTo(23, -113, 15, -116);
      ctx.quadraticCurveTo(6, -119.5, 0, -117.5);
      ctx.quadraticCurveTo(-7, -120.5, -15, -116);
      ctx.quadraticCurveTo(-23, -113, -26.6, -104);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(hairDeep, 0.38);
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-24.5, -106);
      ctx.quadraticCurveTo(-21, -113.5, -14.5, -115.5);
      ctx.quadraticCurveTo(-6.5, -119.2, 0, -117.2);
      ctx.quadraticCurveTo(7, -120.2, 14.5, -115.5);
      ctx.quadraticCurveTo(21, -113.5, 24.5, -106);
      ctx.stroke();
      ctx.fillStyle = rgba(hairLight, 0.5);
      ell(ctx, -2, -121.5, 9.5, 2.4, -0.06); ctx.fill();

      if (hair.id === 'bob' || hair.id === 'long') {
        const len = hair.id === 'long' ? 48 : 27;
        ctx.fillStyle = hairBase;
        rr(ctx, -29, -110, 6.2, len, 3.1); ctx.fill();
        rr(ctx, 22.8, -110, 6.2, len, 3.1); ctx.fill();
        ctx.strokeStyle = rgba(hairDeep, 0.3); ctx.lineWidth = 0.8;
        rr(ctx, -29, -110, 6.2, len, 3.1); ctx.stroke();
        rr(ctx, 22.8, -110, 6.2, len, 3.1); ctx.stroke();
        ctx.fillStyle = rgba(hairLight, 0.35);
        ell(ctx, -26.2, -104, 1.8, 9, 0); ctx.fill();
        ell(ctx, 26, -104, 1.8, 9, 0); ctx.fill();
      } else if (hair.id === 'curly') {
        ctx.fillStyle = hairBase;
        [[-17, -119, 4.5], [-7, -122.5, 5], [4, -122.5, 5], [15, -119, 4.5]]
          .forEach(([x, y, r]) => { circle(ctx, x, y, r); ctx.fill(); });
        ctx.fillStyle = rgba(hairLight, 0.5);
        circle(ctx, -2, -124, 1.8); ctx.fill();
      } else if (hair.id === 'pony') {
        ctx.fillStyle = hairBase;
        ctx.beginPath();
        ctx.moveTo(4, -122);
        ctx.bezierCurveTo(16, -126, 25, -119, 25.5, -110);
        ctx.quadraticCurveTo(22, -115, 17, -115.5);
        ctx.quadraticCurveTo(10, -116, 4, -122);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = rgba(hairLight, 0.45);
        ell(ctx, 15, -118, 5.5, 1.6, -0.2); ctx.fill();
      } else if (hair.id === 'buns') {
        ctx.fillStyle = hairBase;
        rr(ctx, -28.5, -108, 5.2, 11, 2.6); ctx.fill();
        rr(ctx, 23.3, -108, 5.2, 11, 2.6); ctx.fill();
      } else if (hair.id === 'short') {
        ctx.fillStyle = hairBase;
        rr(ctx, -28.5, -108, 5, 9, 2.5); ctx.fill();
        rr(ctx, 23.5, -108, 5, 9, 2.5); ctx.fill();
        ctx.fillStyle = rgba(hairLight, 0.45);
        ell(ctx, 9, -117, 7, 2, -0.15); ctx.fill();
      }
    };

    /* ── cabello trasero, piernas y brazos traseros ── */
    drawHairBack();
    drawArm(armB, true);
    drawLeg(legB, true);
    drawLeg(legF, false);

    /* ── cuello ── */
    ctx.fillStyle = skin.shade;
    rr(ctx, -5.2, -90, 10.4, 11, 4); ctx.fill();

    /* ── torso ── */
    const torsoPath = () => {
      ctx.beginPath();
      ctx.moveTo(-10.5, -81);
      ctx.quadraticCurveTo(-17, -78, -17, -69);
      ctx.lineTo(-15, -37);
      ctx.quadraticCurveTo(0, -32.5, 15, -37);
      ctx.lineTo(17, -69);
      ctx.quadraticCurveTo(17, -78, 10.5, -81);
      ctx.closePath();
    };
    ctx.fillStyle = top.color;
    torsoPath(); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 0.9; ctx.stroke();

    ctx.save();
    torsoPath(); ctx.clip();
    if (top.id === 'stripes') {
      ctx.fillStyle = top.color2;
      for (let i = 0; i < 3; i++) { rr(ctx, -20, -74 + i * 12, 40, 5, 2); ctx.fill(); }
    } else if (top.id === 'hoodie') {
      ctx.fillStyle = top.color2;
      rr(ctx, -20, -84, 40, 8, 3); ctx.fill();
      ctx.strokeStyle = rgba('#ffffff', 0.5); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, -77, 11, 0.15, Math.PI - 0.15); ctx.stroke();
      ctx.strokeStyle = rgba(top.trim, 0.9); ctx.lineWidth = 1.2;
      rr(ctx, -9, -53, 18, 11, 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-7, -81); ctx.lineTo(-6, -72); ctx.moveTo(7, -81); ctx.lineTo(6, -72); ctx.stroke();
    } else if (top.id === 'jacket') {
      ctx.fillStyle = top.color2;
      rr(ctx, -6.5, -81, 13, 46, 2); ctx.fill();
      ctx.strokeStyle = top.trim; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, -79); ctx.lineTo(0, -37); ctx.stroke();
      ctx.fillStyle = top.color;
      ctx.beginPath(); ctx.moveTo(-11, -81); ctx.lineTo(0, -69); ctx.lineTo(-13, -65); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(11, -81); ctx.lineTo(0, -69); ctx.lineTo(13, -65); ctx.closePath(); ctx.fill();
    } else if (top.id === 'sweater') {
      ctx.fillStyle = rgba(top.color2, 0.28);
      for (let i = 0; i < 4; i++) { rr(ctx, -17, -68 + i * 8, 34, 1.6, 1); ctx.fill(); }
      ctx.fillStyle = top.color2;
      rr(ctx, -10, -84, 20, 6, 3); ctx.fill();
    } else if (top.id === 'blouse') {
      ctx.fillStyle = rgba(top.trim, 0.55);
      ctx.beginPath(); ctx.moveTo(-7, -80); ctx.lineTo(0, -73); ctx.lineTo(-11, -72); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(7, -80); ctx.lineTo(0, -73); ctx.lineTo(11, -72); ctx.closePath(); ctx.fill();
      ctx.fillStyle = top.color2;
      ctx.beginPath(); ctx.ellipse(-4.5, -64, 5, 3.4, -0.5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(4.5, -64, 5, 3.4, 0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = shade(top.color2, -25); circle(ctx, 0, -64, 2.2); ctx.fill();
    } else {
      ctx.strokeStyle = rgba(top.trim, 0.7); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, -81, 7, 0.2, Math.PI - 0.2); ctx.stroke();
      ctx.fillStyle = rgba('#ffffff', 0.2);
      ell(ctx, -8, -57, 2, 3, 0.3); ctx.fill();
    }
    ctx.restore();

    if (bottom.id === 'skirt') {
      ctx.fillStyle = bottom.color;
      ctx.beginPath();
      ctx.moveTo(-16, -38); ctx.lineTo(16, -38);
      ctx.quadraticCurveTo(23, -25, 25, -17);
      ctx.quadraticCurveTo(15, -12, 8, -17);
      ctx.quadraticCurveTo(0, -13, -8, -17);
      ctx.quadraticCurveTo(-15, -12, -25, -17);
      ctx.quadraticCurveTo(-23, -25, -16, -38);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(bottom.color2, 0.9); ctx.lineWidth = 1.2;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 10, -35); ctx.quadraticCurveTo(i * 13, -25, i * 15, -17); ctx.stroke(); }
      ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.stroke();
    }

    /* ── brazo delantero ── */
    drawArm(armF, false);

    /* ── cabeza ── */
    ctx.save();
    ctx.translate(headShift, 0);
    ctx.rotate(headTilt);
    // orejas
    ctx.fillStyle = skin.color;
    circle(ctx, -24, -101, 5); ctx.fill();
    circle(ctx, 24, -101, 5); ctx.fill();
    ctx.fillStyle = rgba(skin.shade, 0.55);
    circle(ctx, -24, -101, 2.4); ctx.fill();
    circle(ctx, 24, -101, 2.4); ctx.fill();
    // cara
    ctx.fillStyle = skin.color;
    ell(ctx, 0, -103, 25, 23.5); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.1; ctx.stroke();
    ctx.fillStyle = rgba(skin.shade, 0.22);
    ell(ctx, 8, -96, 15, 11, 0.2); ctx.fill();

    // rubor
    ctx.fillStyle = 'rgba(255,119,145,.24)';
    ell(ctx, -14, -96, 5.2, 3, -0.15); ctx.fill();
    ell(ctx, 14, -96, 5.2, 3, 0.15); ctx.fill();

    // ojos
    const eyeY = -106, eyeX = 9;
    ctx.strokeStyle = shade(hc.color, -10); ctx.lineWidth = 1.4;
    if (blink || expr === 'hurt') {
      ctx.beginPath(); ctx.moveTo(-eyeX - 4, eyeY); ctx.quadraticCurveTo(-eyeX, eyeY + 3, -eyeX + 4, eyeY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(eyeX - 4, eyeY); ctx.quadraticCurveTo(eyeX, eyeY + 3, eyeX + 4, eyeY); ctx.stroke();
    } else {
      const scaleEye = expr === 'surprised' ? 1.18 : 1;
      ctx.fillStyle = '#fffdf8';
      ell(ctx, -eyeX, eyeY, 4.5 * scaleEye, 5.4 * scaleEye); ctx.fill();
      ell(ctx, eyeX, eyeY, 4.5 * scaleEye, 5.4 * scaleEye); ctx.fill();
      ctx.fillStyle = eyes.color;
      circle(ctx, -eyeX + 0.6, eyeY + 0.4, 2.9 * scaleEye); ctx.fill();
      circle(ctx, eyeX + 0.6, eyeY + 0.4, 2.9 * scaleEye); ctx.fill();
      ctx.fillStyle = '#2a2033';
      circle(ctx, -eyeX + 0.8, eyeY + 0.5, 1.5 * scaleEye); ctx.fill();
      circle(ctx, eyeX + 0.8, eyeY + 0.5, 1.5 * scaleEye); ctx.fill();
      ctx.fillStyle = '#fff';
      circle(ctx, -eyeX + 1.8, eyeY - 1.1, 0.9 * scaleEye); ctx.fill();
      circle(ctx, eyeX + 1.8, eyeY - 1.1, 0.9 * scaleEye); ctx.fill();
    }
    ctx.strokeStyle = rgba(shade(hc.color, -20), 0.7); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-eyeX - 3.6, eyeY - 6.4); ctx.quadraticCurveTo(-eyeX, eyeY - 7.7, -eyeX + 3.6, eyeY - 6.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(eyeX - 3.6, eyeY - 6.6); ctx.quadraticCurveTo(eyeX, eyeY - 7.9, eyeX + 3.6, eyeY - 6.4); ctx.stroke();

    // nariz
    ctx.strokeStyle = rgba(skin.shade, 0.9); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0.5, -98.5); ctx.quadraticCurveTo(2.4, -96.6, 0.4, -95.6); ctx.stroke();

    // boca
    ctx.strokeStyle = '#a6525c'; ctx.lineWidth = 1.5;
    if (expr === 'surprised') {
      ctx.fillStyle = '#8d3d49';
      ell(ctx, 0, -91.5, 2.4, 2.8); ctx.fill();
    } else if (expr === 'hurt') {
      ctx.beginPath(); ctx.moveTo(-4, -92); ctx.quadraticCurveTo(-1.5, -90, 1, -91.6); ctx.quadraticCurveTo(3, -93, 4.6, -91); ctx.stroke();
    } else if (expr === 'wink') {
      ctx.beginPath(); ctx.arc(-2, -93, 4.4, 0.15, Math.PI - 0.2); ctx.stroke();
      ctx.fillStyle = '#ff9bb0'; ell(ctx, -1, -91.6, 2.2, 1.2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(0, -93.5, 4.2, 0.2, Math.PI - 0.25); ctx.stroke();
      ctx.fillStyle = '#ff9bb0'; ell(ctx, 0, -91.8, 2.4, 1.2); ctx.fill();
    }

    // pecas
    ctx.fillStyle = rgba(skin.shade, 0.5);
    [[-17, -93], [-14.5, -90.8], [17, -93], [14.5, -90.8]].forEach(([x, y]) => { circle(ctx, x, y, 0.6); ctx.fill(); });

    drawHairFront();

    /* ── accesorios ── */
    ctx.save();
    if (acc === 'glasses') {
      ctx.fillStyle = 'rgba(255,255,255,.13)';
      ctx.strokeStyle = '#3b3550'; ctx.lineWidth = 1.7;
      circle(ctx, -eyeX, eyeY, 7.4); ctx.fill(); ctx.stroke();
      circle(ctx, eyeX, eyeY, 7.4); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-eyeX + 7.4, eyeY); ctx.lineTo(eyeX - 7.4, eyeY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-eyeX - 7.4, eyeY); ctx.lineTo(-24, eyeY + 1); ctx.moveTo(eyeX + 7.4, eyeY); ctx.lineTo(24, eyeY + 1); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-eyeX - 4, eyeY - 4); ctx.lineTo(-eyeX - 1, eyeY - 5.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(eyeX - 4, eyeY - 4); ctx.lineTo(eyeX - 1, eyeY - 5.5); ctx.stroke();
    } else if (acc === 'bow') {
      ctx.fillStyle = '#ff7d9c';
      ctx.beginPath(); ctx.ellipse(17, -118, 6, 3.6, -0.5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(25, -115, 5.5, 3.3, 0.45, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e35c7e'; circle(ctx, 21, -117, 2.6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; circle(ctx, 18.6, -119, 1); ctx.fill();
    } else if (acc === 'cap') {
      ctx.fillStyle = '#ff7a63';
      ctx.beginPath();
      ctx.moveTo(-23, -112);
      ctx.quadraticCurveTo(-22, -128, 0, -129);
      ctx.quadraticCurveTo(23, -128, 24, -112);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba('#a33f30', .5); ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#e85c46';
      ctx.beginPath();
      ctx.moveTo(2, -114);
      ctx.quadraticCurveTo(26, -117, 34, -108);
      ctx.quadraticCurveTo(25, -104, 2, -107);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff4dc'; sparkle(ctx, 1, -119, 3.2, '#fff4dc', .9);
      ctx.fillStyle = '#ffd166'; circle(ctx, 0, -128, 2); ctx.fill();
    } else if (acc === 'beanie') {
      ctx.fillStyle = '#6fd6c2';
      ctx.beginPath();
      ctx.moveTo(-24, -108);
      ctx.quadraticCurveTo(-25, -126, 0, -127);
      ctx.quadraticCurveTo(25, -126, 24, -108);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#9fe8d9';
      rr(ctx, -25, -112, 50, 7, 3.5); ctx.fill();
      ctx.fillStyle = '#fff3d6';
      circle(ctx, 0, -130, 4.5); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-14, -121); ctx.quadraticCurveTo(-8, -124, -2, -121); ctx.moveTo(4, -122); ctx.quadraticCurveTo(10, -125, 16, -122); ctx.stroke();
    } else if (acc === 'flowers') {
      const flower = (x, y, petal, center) => {
        ctx.fillStyle = petal;
        for (let i = 0; i < 5; i++) {
          const ang = i / 5 * TAU;
          circle(ctx, x + Math.cos(ang) * 3.2, y + Math.sin(ang) * 3.2, 2.1); ctx.fill();
        }
        ctx.fillStyle = center; circle(ctx, x, y, 1.7); ctx.fill();
      };
      flower(-16, -115, '#ffd0e0', '#ffc94d');
      flower(2, -123, '#fff3c9', '#ff9e6b');
      flower(19, -114, '#ffd0e0', '#ffc94d');
      ctx.fillStyle = '#7ddcc4';
      ell(ctx, 10, -121, 2.2, 1.2, 0.4); ctx.fill();
    } else if (acc === 'headphones') {
      ctx.strokeStyle = '#8d7ce8'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, -108, 25, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      ctx.fillStyle = '#7a68d6';
      circle(ctx, -25, -101, 6.6); ctx.fill();
      circle(ctx, 25, -101, 6.6); ctx.fill();
      ctx.fillStyle = '#ff9eb5';
      rr(ctx, -24, -104, 4, 6, 2); ctx.fill();
      rr(ctx, 20, -104, 4, 6, 2); ctx.fill();
    }
    ctx.restore();

    ctx.restore(); // head
    ctx.restore(); // person
  };

  A.drawOptionPreview = function (canvas, category, valueId, app) {
    const w = canvas.width, h = canvas.height;
    const ctx = canvas.getContext('2d');
    const g = Object.assign({}, SLW.DEFAULT_APPEARANCE, app || {});
    g[category] = valueId;
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createRadialGradient(w / 2, h * 0.42, 2, w / 2, h * 0.55, w * 0.62);
    bg.addColorStop(0, 'rgba(255,255,255,.85)');
    bg.addColorStop(1, 'rgba(255,243,225,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(90,60,80,.12)';
    ell(ctx, w / 2, h * 0.9, w * 0.23, h * 0.035); ctx.fill();
    A.drawPerson(ctx, g, { x: w / 2, y: h * 0.9, scale: h / 145, state: 'idle', time: 1.2, blink: false });
  };

  /* ═══════════════════════════ WOODSTOCK ═══════════════════════════ */
  A.drawWoodstock = function (ctx, x, y, scale, time, opts) {
    const o = opts || {};
    const s = scale || 1;
    const t = time || 0;
    const facing = o.facing == null ? 1 : o.facing;
    const flap = Math.sin(t * 9) * 0.5 + (o.flap || 0);
    const bob = Math.sin(t * 4.2) * 2;
    const alert = o.expression === 'alert';
    ctx.save();
    ctx.translate(x, y + bob * s);
    ctx.scale(s * facing, s);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // cola
    ctx.fillStyle = '#f2c93c';
    ctx.beginPath();
    ctx.moveTo(-14, 4);
    ctx.quadraticCurveTo(-28, 0, -27, -10);
    ctx.quadraticCurveTo(-22, -4, -16, -6);
    ctx.quadraticCurveTo(-24, -14, -18, -18);
    ctx.quadraticCurveTo(-12, -8, -9, -5);
    ctx.closePath(); ctx.fill();

    // patitas
    ctx.strokeStyle = '#e08f34'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-5, 16); ctx.lineTo(-6, 25); ctx.lineTo(-10, 27); ctx.moveTo(6, 16); ctx.lineTo(7, 25); ctx.lineTo(11, 27); ctx.stroke();

    // cuerpo
    const grad = ctx.createLinearGradient(0, -20, 0, 20);
    grad.addColorStop(0, '#ffe974');
    grad.addColorStop(1, '#f7c93f');
    ctx.fillStyle = grad;
    ell(ctx, 0, 6, 15, 16); ctx.fill();
    ctx.fillStyle = '#ffe974';
    ell(ctx, 1, -10, 17, 17); ctx.fill();
    ctx.strokeStyle = 'rgba(160,115,20,.25)'; ctx.lineWidth = 1; ell(ctx, 1, -10, 17, 17); ctx.stroke();

    // mechones
    ctx.fillStyle = '#f4c33e';
    ctx.beginPath(); ctx.moveTo(-8, -24); ctx.quadraticCurveTo(-12, -35, -3, -30); ctx.quadraticCurveTo(-1, -37, 4, -28); ctx.quadraticCurveTo(10, -35, 11, -24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8b32e';
    ctx.beginPath(); ctx.moveTo(-1, -28); ctx.quadraticCurveTo(2, -36, 6, -29); ctx.closePath(); ctx.fill();

    // alitas
    ctx.save();
    ctx.translate(-13, -2); ctx.rotate(-0.45 - flap);
    ctx.fillStyle = '#f2c93c';
    ell(ctx, 0, 7, 5.5, 12); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ell(ctx, -1, 5, 2, 4); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(14, 0); ctx.rotate(0.5 + flap * 1.15);
    ctx.fillStyle = '#ffd94f';
    ell(ctx, 0, 7, 5.5, 13); ctx.fill();
    ctx.restore();

    // ojos
    const eyeY = -14;
    if (o.expression === 'happy') {
      ctx.strokeStyle = '#3d2b18'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(4.5, eyeY, 2.6, Math.PI * 0.1, Math.PI * 0.9, true); ctx.stroke();
      ctx.beginPath(); ctx.arc(11.5, eyeY, 2.6, Math.PI * 0.1, Math.PI * 0.9, true); ctx.stroke();
    } else {
      ctx.fillStyle = '#2e2317';
      circle(ctx, 4.5, eyeY, alert ? 2.7 : 2.2); ctx.fill();
      circle(ctx, 11.5, eyeY, alert ? 2.7 : 2.2); ctx.fill();
      ctx.fillStyle = '#fff';
      circle(ctx, 5.2, eyeY - 0.8, 0.8); ctx.fill();
      circle(ctx, 12.2, eyeY - 0.8, 0.8); ctx.fill();
    }
    // pico
    ctx.fillStyle = '#ff9f43';
    ctx.beginPath(); ctx.moveTo(15, -9); ctx.lineTo(24, -5); ctx.lineTo(15, -2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(180,90,20,.4)'; ctx.lineWidth = 0.8; ctx.stroke();
    // mejillas
    ctx.fillStyle = 'rgba(255,140,90,.28)';
    circle(ctx, 2, -7, 2.2); ctx.fill();
    circle(ctx, 14, -7, 2.0); ctx.fill();
    // copete
    ctx.strokeStyle = '#d9a21f'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(1, -27); ctx.quadraticCurveTo(0, -32, 3, -33); ctx.stroke();

    ctx.restore();
  };

  A.drawWoodstockHud = function (canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w * 0.5, h * 0.6, 2, w * 0.5, h * 0.5, w * 0.5);
    g.addColorStop(0, 'rgba(255,240,170,.28)');
    g.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    A.drawWoodstock(ctx, w * 0.5, h * 0.52, w / 70, performance.now() / 1000, { expression: 'happy' });
  };

  /* ═══════════════════════════ SNOOPY ═══════════════════════════ */
  A.drawSnoopy = function (ctx, x, y, scale, time, pose, opts) {
    const o = opts || {};
    const s = scale || 1, t = time || 0;
    const facing = o.facing == null ? 1 : o.facing;
    const mode = pose || 'stand';

    const white = '#fffdf6', shadeC = '#e9e1d2', ink = 'rgba(74,62,88,.5)', inkDark = '#2b2833', red = '#e8484f';

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * facing, s);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const bob = mode === 'dance' ? -Math.abs(Math.sin(t * 5)) * 4.2 : -Math.sin(t * 2.1) * 1.2;

    const foot = (fx, fy, rot) => {
      ctx.save();
      ctx.translate(fx, fy); ctx.rotate(rot || 0);
      ctx.fillStyle = white;
      ell(ctx, 0, 0, 13.2, 6.6); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.fillStyle = rgba(shadeC, 0.85);
      ell(ctx, 0, 2.8, 9.5, 2.3); ctx.fill();
      ctx.strokeStyle = 'rgba(74,62,88,.22)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-1.5, 2.4); ctx.lineTo(-1.5, 5.6); ctx.stroke();
      ctx.restore();
    };

    const tail = (wag) => {
      ctx.save();
      ctx.translate(-17, -41);
      ctx.rotate(wag || 0);
      ctx.strokeStyle = ink; ctx.lineWidth = 13;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-17, -13, -10, -28); ctx.stroke();
      ctx.strokeStyle = white; ctx.lineWidth = 9.5;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-17, -13, -10, -28); ctx.stroke();
      ctx.restore();
    };

    const arm = (sx, sy, cx, cy, ex, ey, w) => {
      ctx.strokeStyle = ink; ctx.lineWidth = w + 3;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
      ctx.strokeStyle = white; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
      ctx.fillStyle = white;
      circle(ctx, ex, ey, (w + 3) / 2); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.1; ctx.stroke();
    };

    const head = (hx, hy, rot, expression, earSwing) => {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(rot || 0);
      // oreja negra colgante (detrás de la cabeza)
      ctx.save();
      ctx.translate(-15, -15);
      ctx.rotate(-0.22 + (earSwing || 0));
      ctx.fillStyle = inkDark;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-13, 2, -18, 16, -13, 27);
      ctx.bezierCurveTo(-10, 33, -1, 32, 4, 25);
      ctx.bezierCurveTo(8, 18, 6, 8, 3, 1);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.10)';
      ell(ctx, -7, 14, 2.6, 6, 0.15); ctx.fill();
      ctx.restore();
      // cráneo
      ctx.fillStyle = white;
      ell(ctx, 0, 0, 26, 22.5); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke();
      // hocico
      ctx.fillStyle = white;
      ell(ctx, 16.5, 8, 16.5, 11.5, 0.08); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.2; ctx.stroke();
      // sombra de la mejilla
      ctx.fillStyle = rgba(shadeC, 0.65);
      ell(ctx, 12, 13.5, 12.5, 4.8, 0.05); ctx.fill();
      // ojo
      if (expression === 'sleep') {
        ctx.strokeStyle = inkDark; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(7, -7, 4, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      } else if (expression === 'wink') {
        ctx.strokeStyle = inkDark; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(3.5, -7); ctx.quadraticCurveTo(7, -4, 10.5, -7); ctx.stroke();
      } else {
        ctx.fillStyle = inkDark;
        ell(ctx, 7, -7.5, 2.8, 3.6); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        circle(ctx, 8.1, -8.9, 0.95); ctx.fill();
      }
      // nariz
      ctx.fillStyle = inkDark;
      ell(ctx, 32.5, 5.5, 5.7, 4.4, 0.18); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ell(ctx, 30.8, 3.9, 1.7, 1.1); ctx.fill();
      // boca
      ctx.strokeStyle = inkDark; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(30, 9); ctx.quadraticCurveTo(23, 15.5, 13, 13.8); ctx.stroke();
      // collar rojo con placa
      ctx.strokeStyle = red; ctx.lineWidth = 5.6;
      ctx.beginPath(); ctx.ellipse(1, 21.5, 14.5, 5.4, 0.03, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#ffd166';
      circle(ctx, 3.5, 28.5, 3.2); ctx.fill();
      ctx.strokeStyle = 'rgba(146,96,20,.55)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    };

    if (mode === 'lie') {
      // cuerpo tumbado sobre el tejado
      ctx.save();
      ctx.translate(0, -2);
      ctx.strokeStyle = ink; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(-40, -30); ctx.quadraticCurveTo(-54, -40, -50, -54); ctx.stroke();
      ctx.strokeStyle = white; ctx.lineWidth = 8.5;
      ctx.beginPath(); ctx.moveTo(-40, -30); ctx.quadraticCurveTo(-54, -40, -50, -54); ctx.stroke();
      ctx.fillStyle = white;
      ell(ctx, -4, -22, 45, 19.5); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = rgba(shadeC, 0.7);
      ell(ctx, -8, -14, 32, 8, 0.02); ctx.fill();
      ctx.fillStyle = white;
      rr(ctx, 19, -20, 11.5, 24, 5.5); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.3; ctx.stroke();
      rr(ctx, 31, -18, 10.5, 22, 5); ctx.fill(); ctx.stroke();
      head(37, -47, -0.05, 'sleep', Math.sin(t * 1.4) * 0.04);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.font = '800 15px "Baloo 2", sans-serif';
      ctx.fillText('z', 72, -66 + Math.sin(t * 2) * 2.5);
      ctx.font = '800 10px "Baloo 2", sans-serif';
      ctx.fillText('z', 82, -76 + Math.sin(t * 2 + 1) * 2.5);
      ctx.restore();
    } else if (mode === 'dance') {
      const step = Math.sin(t * 5);
      foot(-16 - step * 3, -5 + Math.abs(step) * 2, -0.14);
      foot(16 + step * 3, -5 - Math.abs(step) * 1, 0.14);
      tail(-0.3 + Math.sin(t * 5 + 1) * 0.25);
      arm(-12, -58, -26, -70, -18 - step * 2, -86, 6.5);
      ctx.fillStyle = white;
      ell(ctx, 0, -42, 24, 30); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = rgba(shadeC, 0.7);
      ell(ctx, -10, -28, 6.5, 15, -0.2); ctx.fill();
      arm(12, -58, 28, -72, 22 + step * 2, -88, 7);
      head(4, -80 + bob, 0.12 + step * 0.04, 'happy', step * 0.09);
      // notas de baile
      ctx.strokeStyle = 'rgba(255,248,220,.7)'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(-36, -74 + step * 3); ctx.quadraticCurveTo(-42, -62, -35, -52); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(42, -68 - step * 3); ctx.quadraticCurveTo(48, -56, 41, -46); ctx.stroke();
      ctx.fillStyle = 'rgba(255,240,180,.85)';
      ctx.font = '800 13px "Baloo 2", sans-serif';
      ctx.fillText('♪', 34 + step * 3, -80 + Math.cos(t * 5) * 3);
    } else {
      const flying = mode === 'fly';
      foot(-12, -6, flying ? 0.28 : -0.04);
      foot(12, -6, flying ? -0.22 : 0.04);
      tail(flying ? -0.45 : Math.sin(t * 2.6) * 0.16);
      arm(-9, -58, -18, -50, -15, -38, 6);
      ctx.fillStyle = white;
      ell(ctx, 0, -42, 25, 31); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = rgba(shadeC, 0.6);
      ell(ctx, -11, -27, 7, 16, -0.22); ctx.fill();
      if (flying) {
        arm(13, -52, 30, -50, 38, -46, 7);
        head(16, -69 + bob, -0.04, 'happy', Math.sin(t * 2.2) * 0.05);
        // bufanda roja al viento
        ctx.strokeStyle = red; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(-2, -57); ctx.quadraticCurveTo(-24, -50, -40, -56); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(-2, -57); ctx.quadraticCurveTo(-24, -50, -40, -56); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(-46, -76); ctx.lineTo(-62, -76); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-44, -62); ctx.lineTo(-58, -62); ctx.stroke();
      } else {
        arm(13, -57, 23, -50, 20, -37, 7);
        head(4, -80 + bob, 0, 'happy', Math.sin(t * 2.2) * 0.05);
      }
    }
    ctx.restore();
  };

  A.drawDoghouse = function (ctx, x, y, scale, opts) {
    const o = opts || {};
    const s = scale || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineJoin = 'round';
    // sombra
    ctx.fillStyle = 'rgba(40,20,40,.18)';
    ell(ctx, 0, 2, 78, 13); ctx.fill();
    // base
    ctx.fillStyle = '#b23c3a';
    rr(ctx, -60, -110, 120, 108, 6); ctx.fill();
    // pared
    ctx.fillStyle = o.glow ? '#d95a50' : '#cf4b47';
    rr(ctx, -60, -118, 120, 114, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(90,25,30,.4)'; ctx.lineWidth = 1.6; ctx.stroke();
    // tablones
    ctx.strokeStyle = 'rgba(110,30,35,.25)'; ctx.lineWidth = 1.4;
    for (let i = -42; i <= 42; i += 21) { ctx.beginPath(); ctx.moveTo(i, -114); ctx.lineTo(i, -8); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-56, -66); ctx.lineTo(56, -66); ctx.stroke();
    // puerta
    ctx.fillStyle = '#3a2b3f';
    ctx.beginPath();
    ctx.moveTo(-22, -8); ctx.lineTo(-22, -68);
    ctx.quadraticCurveTo(0, -92, 22, -68); ctx.lineTo(22, -8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    rr(ctx, -14, -30, 6, 10, 3); ctx.fill(); rr(ctx, 8, -30, 6, 10, 3); ctx.fill();
    // tejado
    ctx.fillStyle = o.glow ? '#3a3147' : '#333041';
    ctx.beginPath();
    ctx.moveTo(-78, -112); ctx.lineTo(78, -112); ctx.lineTo(0, -186); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.beginPath(); ctx.moveTo(-66, -116); ctx.lineTo(0, -178); ctx.lineTo(0, -140); ctx.closePath(); ctx.fill();
    // cumbrera
    ctx.strokeStyle = '#c94b47'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-78, -112); ctx.lineTo(0, -186); ctx.lineTo(78, -112); ctx.stroke();
    if (o.glow) {
      const g = ctx.createRadialGradient(0, -90, 10, 0, -90, 130);
      g.addColorStop(0, 'rgba(255,220,150,.22)');
      g.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = g; ctx.fillRect(-140, -200, 280, 210);
    }
    ctx.restore();
  };

  /* ═══════════════════════════ AMIGOS ═══════════════════════════ */
  A.drawCharlie = function (ctx, x, y, scale, time, facing) {
    const s = scale || 1, f = facing == null ? 1 : facing, t = time || 0;
    const bob = Math.sin(t * 2) * 1;
    ctx.save(); ctx.translate(x, y - bob); ctx.scale(s * f, s);
    const skin = '#ffd7a6', ink = 'rgba(70,50,50,.25)';
    // piernas
    ctx.fillStyle = '#c48a4f'; rr(ctx, -12, -28, 9, 22, 4); ctx.fill(); rr(ctx, 3, -28, 9, 22, 4); ctx.fill();
    ctx.fillStyle = '#fffaf0'; rr(ctx, -12, -10, 9, 6, 2); ctx.fill(); rr(ctx, 3, -10, 9, 6, 2); ctx.fill();
    ctx.fillStyle = '#2c2633'; rr(ctx, -14, -4, 13, 6, 3); ctx.fill(); rr(ctx, 2, -4, 13, 6, 3); ctx.fill();
    // cuerpo amarillo
    ctx.fillStyle = '#ffd84d';
    rr(ctx, -16, -60, 32, 35, 9); ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 1.1; ctx.stroke();
    // zigzag
    ctx.strokeStyle = '#2c2633'; ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-16, -44);
    for (let i = 0; i < 4; i++) ctx.lineTo(-16 + i * 8 + 4, i % 2 === 0 ? -50 : -42);
    ctx.lineTo(16, -44);
    ctx.stroke();
    // brazos
    ctx.strokeStyle = skin; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-15, -54); ctx.quadraticCurveTo(-26, -44, -22, -34); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, -54); ctx.quadraticCurveTo(26, -44, 22, -34); ctx.stroke();
    // cuello
    ctx.fillStyle = skin; rr(ctx, -5, -68, 10, 10, 4); ctx.fill();
    // cabeza
    ctx.fillStyle = skin; ell(ctx, 0, -82, 24, 22); ctx.fill();
    ctx.strokeStyle = ink; ctx.stroke();
    // pelo rizo
    ctx.strokeStyle = '#6a4a32'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-9, -99); ctx.quadraticCurveTo(-4, -106, 2, -102); ctx.quadraticCurveTo(7, -106, 9, -99); ctx.stroke();
    // ojos
    ctx.fillStyle = '#2c2633'; ell(ctx, -9, -84, 2.2, 3); ctx.fill(); ell(ctx, 9, -84, 2.2, 3); ctx.fill();
    // boca
    ctx.strokeStyle = '#8d5650'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, -77, 5, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
  };

  A.drawSchroeder = function (ctx, x, y, scale, time, facing) {
    const s = scale || 1, f = facing == null ? 1 : facing, t = time || 0;
    ctx.save(); ctx.translate(x, y - Math.sin(t * 2.3) * 0.8); ctx.scale(s * f, s);
    const ink = 'rgba(60,50,70,.22)', skin = '#ffe1c2';
    // piernas
    ctx.fillStyle = '#4a6cab'; rr(ctx, -11, -27, 8, 21, 3.5); ctx.fill(); rr(ctx, 3, -27, 8, 21, 3.5); ctx.fill();
    ctx.fillStyle = '#2c2633'; rr(ctx, -13, -4, 12, 6, 3); ctx.fill(); rr(ctx, 1, -4, 12, 6, 3); ctx.fill();
    // torso rayas
    ctx.fillStyle = '#fff6ea'; rr(ctx, -15, -60, 30, 34, 8); ctx.fill();
    ctx.save(); rr(ctx, -15, -60, 30, 34, 8); ctx.clip();
    ctx.fillStyle = '#6b78c9';
    for (let i = 0; i < 4; i++) { rr(ctx, -18, -56 + i * 8, 36, 4, 1); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = ink; ctx.lineWidth = 1; rr(ctx, -15, -60, 30, 34, 8); ctx.stroke();
    // brazos
    ctx.strokeStyle = skin; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-14, -54); ctx.quadraticCurveTo(-24, -44, -18, -36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(14, -54); ctx.quadraticCurveTo(24, -44, 18, -36); ctx.stroke();
    // cabeza
    ctx.fillStyle = skin; ell(ctx, 0, -81, 22, 21); ctx.fill(); ctx.strokeStyle = ink; ctx.stroke();
    // pelo rubio ondulado
    ctx.fillStyle = '#e9c265';
    ctx.beginPath();
    ctx.moveTo(-22, -84);
    ctx.bezierCurveTo(-26, -104, 22, -108, 23, -84);
    ctx.quadraticCurveTo(16, -96, 8, -92);
    ctx.quadraticCurveTo(0, -102, -8, -94);
    ctx.quadraticCurveTo(-14, -98, -22, -84);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f4d98c';
    circle(ctx, -8, -99, 2.2); ctx.fill(); circle(ctx, 9, -98, 2); ctx.fill();
    // ojos
    ctx.fillStyle = '#3a2c3c'; ell(ctx, -8, -82, 2.1, 2.8); ctx.fill(); ell(ctx, 8, -82, 2.1, 2.8); ctx.fill();
    ctx.strokeStyle = '#a26662'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(0, -75, 3.8, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
  };

  A.drawLinus = function (ctx, x, y, scale, time, facing) {
    const s = scale || 1, f = facing == null ? 1 : facing, t = time || 0;
    ctx.save(); ctx.translate(x, y - Math.sin(t * 2.1) * 0.9); ctx.scale(s * f, s);
    const ink = 'rgba(60,45,60,.22)', skin = '#ffdcb8';
    // piernas
    ctx.fillStyle = '#cf9355'; rr(ctx, -11, -27, 8, 21, 3.5); ctx.fill(); rr(ctx, 3, -27, 8, 21, 3.5); ctx.fill();
    ctx.fillStyle = '#2c2633'; rr(ctx, -13, -4, 12, 6, 3); ctx.fill(); rr(ctx, 1, -4, 12, 6, 3); ctx.fill();
    // torso rojo rayas
    ctx.fillStyle = '#e85c57'; rr(ctx, -15, -61, 30, 35, 8); ctx.fill();
    ctx.save(); rr(ctx, -15, -61, 30, 35, 8); ctx.clip();
    ctx.fillStyle = '#2f2a38';
    for (let i = 0; i < 3; i++) { rr(ctx, -18, -57 + i * 9, 36, 3.2, 1); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = ink; ctx.lineWidth = 1; rr(ctx, -15, -61, 30, 35, 8); ctx.stroke();
    // manta
    ctx.fillStyle = '#7db4e6';
    ctx.beginPath();
    ctx.moveTo(14, -56); ctx.quadraticCurveTo(30, -48, 26, -20);
    ctx.quadraticCurveTo(22, -4, 12, -10);
    ctx.lineTo(18, -44); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#5c94c9'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(19, -48); ctx.quadraticCurveTo(25, -30, 20, -14); ctx.stroke();
    // brazo
    ctx.strokeStyle = skin; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-14, -55); ctx.quadraticCurveTo(-23, -45, -18, -37); ctx.stroke();
    // cabeza
    ctx.fillStyle = skin; ell(ctx, 0, -82, 22, 21); ctx.fill(); ctx.strokeStyle = ink; ctx.stroke();
    // pelo
    ctx.fillStyle = '#9b6b42';
    ctx.beginPath();
    ctx.moveTo(-21, -92);
    ctx.quadraticCurveTo(-18, -104, 0, -103);
    ctx.quadraticCurveTo(19, -104, 21, -91);
    ctx.quadraticCurveTo(14, -97, 7, -93);
    ctx.quadraticCurveTo(0, -99, -6, -93);
    ctx.quadraticCurveTo(-13, -96, -21, -92);
    ctx.closePath(); ctx.fill();
    // ojos
    ctx.fillStyle = '#3a2c3c'; ell(ctx, -8, -83, 2.1, 2.8); ctx.fill(); ell(ctx, 8, -83, 2.1, 2.8); ctx.fill();
    ctx.strokeStyle = '#a26662'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(0, -76, 3.8, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
  };

  A.drawLucy = function (ctx, x, y, scale, time, facing) {
    const s = scale || 1, f = facing == null ? 1 : facing, t = time || 0;
    ctx.save(); ctx.translate(x, y - Math.sin(t * 2.4) * 0.8); ctx.scale(s * f, s);
    const ink = 'rgba(60,45,60,.22)', skin = '#ffdcb8';
    // piernas
    ctx.strokeStyle = skin; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-6, -20); ctx.lineTo(-7, -2); ctx.moveTo(6, -20); ctx.lineTo(7, -2); ctx.stroke();
    ctx.fillStyle = '#fffaf0'; rr(ctx, -10, -14, 8, 7, 2); ctx.fill(); rr(ctx, 3, -14, 8, 7, 2); ctx.fill();
    ctx.fillStyle = '#2c2633'; rr(ctx, -12, -4, 11, 5, 2.5); ctx.fill(); rr(ctx, 1, -4, 11, 5, 2.5); ctx.fill();
    // vestido azul
    ctx.fillStyle = '#5f8fd6';
    ctx.beginPath();
    ctx.moveTo(-13, -59); ctx.lineTo(13, -59); ctx.lineTo(20, -20);
    ctx.quadraticCurveTo(0, -14, -20, -20); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#7aa7e8'; rr(ctx, -14, -53, 28, 5, 2.5); ctx.fill();
    // brazos
    ctx.strokeStyle = skin; ctx.lineWidth = 6.5;
    ctx.beginPath(); ctx.moveTo(-13, -53); ctx.quadraticCurveTo(-22, -44, -17, -36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(13, -53); ctx.quadraticCurveTo(22, -44, 17, -36); ctx.stroke();
    // cabeza
    ctx.fillStyle = skin; ell(ctx, 0, -80, 22, 21); ctx.fill(); ctx.strokeStyle = ink; ctx.stroke();
    // pelo negro bob
    ctx.fillStyle = '#2e2735';
    ctx.beginPath();
    ctx.moveTo(-23, -80);
    ctx.bezierCurveTo(-29, -104, 29, -104, 23, -80);
    ctx.quadraticCurveTo(23, -88, 12, -88);
    ctx.quadraticCurveTo(0, -84, -12, -88);
    ctx.quadraticCurveTo(-21, -87, -23, -80);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ell(ctx, -11, -95, 6, 2.6, -0.2); ctx.fill();
    // ojos
    ctx.fillStyle = '#3a2c3c'; ell(ctx, -8, -80, 2.1, 2.8); ctx.fill(); ell(ctx, 8, -80, 2.1, 2.8); ctx.fill();
    ctx.strokeStyle = '#a26662'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(0, -73, 3.6, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
  };

  A.drawPiano = function (ctx, x, y, scale, time) {
    const s = scale || 1, t = time || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#7b4b35';
    rr(ctx, -30, -34, 60, 30, 5); ctx.fill();
    ctx.fillStyle = '#9c6343';
    rr(ctx, -28, -31, 56, 9, 3); ctx.fill();
    ctx.fillStyle = '#fdf7ea';
    rr(ctx, -26, -22, 52, 14, 2); ctx.fill();
    ctx.fillStyle = '#3a2d2c';
    for (let i = 0; i < 7; i++) { rr(ctx, -23 + i * 7, -22, 3, 9, 1); ctx.fill(); }
    ctx.fillStyle = '#5d3b2c';
    rr(ctx, -32, -38, 64, 5, 2); ctx.fill();
    ctx.fillStyle = '#2f2936';
    rr(ctx, -27, -4, 4, 6, 1.5); ctx.fill(); rr(ctx, 23, -4, 4, 6, 1.5); ctx.fill();
    // notas
    ctx.fillStyle = 'rgba(255,220,140,.9)';
    ctx.font = '700 14px "Baloo 2", sans-serif';
    ctx.fillText('♪', 14, -46 - Math.sin(t * 2) * 3);
    ctx.font = '700 10px "Baloo 2", sans-serif';
    ctx.fillText('♫', 32, -58 - Math.sin(t * 2 + 1) * 4);
    ctx.restore();
  };

  /* ═══════════════════════════ BÚHO Y NARRADOR ═══════════════════════════ */
  A.drawOwl = function (ctx, x, y, scale, time) {
    const s = scale || 1, t = time || 0;
    ctx.save(); ctx.translate(x, y - Math.sin(t * 1.8) * 2); ctx.scale(s, s);
    // cuerpo
    ctx.fillStyle = '#a27750'; ell(ctx, 0, 0, 32, 36); ctx.fill();
    ctx.fillStyle = '#e9d3b2'; ell(ctx, 0, 8, 22, 26); ctx.fill();
    // alas
    ctx.fillStyle = '#8c6543'; ell(ctx, -30, 2, 9, 24, 0.15); ctx.fill(); ell(ctx, 30, 2, 9, 24, -0.15); ctx.fill();
    // mechones
    ctx.fillStyle = '#8c6543';
    ctx.beginPath(); ctx.moveTo(-22, -30); ctx.lineTo(-31, -46); ctx.lineTo(-12, -36); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(22, -30); ctx.lineTo(31, -46); ctx.lineTo(12, -36); ctx.closePath(); ctx.fill();
    // ojos grandes
    ctx.fillStyle = '#fff8ea'; circle(ctx, -12, -8, 12); ctx.fill(); circle(ctx, 12, -8, 12); ctx.fill();
    ctx.fillStyle = '#3a2c2c'; circle(ctx, -11, -8, 5.5); ctx.fill(); circle(ctx, 13, -8, 5.5); ctx.fill();
    ctx.fillStyle = '#fff'; circle(ctx, -13, -10, 1.7); ctx.fill(); circle(ctx, 11, -10, 1.7); ctx.fill();
    // pico
    ctx.fillStyle = '#f2a33c'; ctx.beginPath(); ctx.moveTo(-4, 4); ctx.lineTo(4, 4); ctx.lineTo(0, 12); ctx.closePath(); ctx.fill();
    // gafas
    ctx.strokeStyle = '#6b4a2f'; ctx.lineWidth = 2.2;
    circle(ctx, -12, -8, 14); ctx.stroke(); circle(ctx, 12, -8, 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -8); ctx.lineTo(0, -8); ctx.moveTo(-26, -8); ctx.lineTo(-34, -6); ctx.moveTo(26, -8); ctx.lineTo(34, -6); ctx.stroke();
    // birrete
    ctx.fillStyle = '#4c3a6b';
    ctx.beginPath(); ctx.moveTo(-26, -38); ctx.lineTo(0, -50); ctx.lineTo(26, -38); ctx.lineTo(0, -28); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd166'; rr(ctx, -3, -52, 6, 3, 1); ctx.fill();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -49); ctx.quadraticCurveTo(16, -44, 14, -36); ctx.stroke();
    ctx.fillStyle = '#ffd166'; circle(ctx, 14, -35, 2.4); ctx.fill();
    // signos
    ctx.fillStyle = 'rgba(255,240,200,.8)';
    ctx.font = '700 18px "Baloo 2", sans-serif';
    ctx.fillText('?', -48, -34 + Math.sin(t * 2) * 2);
    ctx.font = '700 12px "Baloo 2", sans-serif';
    ctx.fillText('?', 38, -46 - Math.sin(t * 1.7) * 2);
    ctx.restore();
  };

  A.drawNarrator = function (ctx, x, y, scale) {
    const s = scale || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#6b4f38';
    ctx.beginPath(); ctx.moveTo(-34, 12); ctx.quadraticCurveTo(0, -8, 34, 12); ctx.lineTo(34, 34); ctx.quadraticCurveTo(0, 16, -34, 34); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath(); ctx.moveTo(-30, 10); ctx.quadraticCurveTo(0, -6, 0, 2); ctx.lineTo(0, 28); ctx.quadraticCurveTo(-18, 16, -30, 28); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(30, 10); ctx.quadraticCurveTo(0, -6, 0, 2); ctx.lineTo(0, 28); ctx.quadraticCurveTo(18, 16, 30, 28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#d8c49e'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-26, 14 + i * 4); ctx.lineTo(-8, 10 + i * 4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(8, 10 + i * 4); ctx.lineTo(26, 14 + i * 4); ctx.stroke(); }
    sparkle(ctx, 0, -20, 8, '#ffd166', 0.9);
    sparkle(ctx, -22, -12, 4, '#ffe9a8', 0.7);
    sparkle(ctx, 24, -16, 5, '#ffe9a8', 0.7);
    ctx.restore();
  };

  /* ═══════════════════════════ RETRATOS ═══════════════════════════ */
  A.drawPortrait = function (canvas, who, app, time) {
    const w = canvas.width, h = canvas.height;
    const ctx = canvas.getContext('2d');
    const t = time || 0;
    ctx.clearRect(0, 0, w, h);
    const palettes = {
      player: ['#fff1d8', '#ffe0ec'], charlie: ['#fff1c9', '#ffe6b0'],
      woodstock: ['#fff8d6', '#ffe9a8'], snoopy: ['#f4ecff', '#e4dcff'],
      owl: ['#f0e6ff', '#dcd0ff'], narrator: ['#fff3dd', '#ffe7c2'],
      schroeder: ['#eaf2ff', '#d9e8ff'], linus: ['#ffeee8', '#ffdcd2'], lucy: ['#eef1ff', '#dde4ff']
    };
    const pal = palettes[who] || palettes.player;
    const g = ctx.createRadialGradient(w * 0.5, h * 0.24, 4, w * 0.5, h * 0.55, w * 0.8);
    g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (let i = 0; i < 8; i++) {
      const x = hash(i + 3) * w, y = hash(i + 9) * h;
      sparkle(ctx, x, y, 2 + hash(i + 2) * 3, '#ffffff', 0.6);
    }
    ctx.fillStyle = 'rgba(80,50,80,.12)';
    ell(ctx, w * 0.5, h * 0.94, w * 0.28, h * 0.045); ctx.fill();

    const s = w / 160;
    if (who === 'player') {
      A.drawPerson(ctx, app, { x: w * 0.5, y: h * 0.96, scale: 1.08 * s, state: 'idle', time: t, facing: 1 });
    } else if (who === 'charlie') {
      A.drawCharlie(ctx, w * 0.5, h * 0.94, 1.22 * s, t, 1);
    } else if (who === 'schroeder') {
      A.drawSchroeder(ctx, w * 0.5, h * 0.94, 1.22 * s, t, 1);
    } else if (who === 'linus') {
      A.drawLinus(ctx, w * 0.5, h * 0.94, 1.22 * s, t, 1);
    } else if (who === 'lucy') {
      A.drawLucy(ctx, w * 0.5, h * 0.94, 1.22 * s, t, 1);
    } else if (who === 'woodstock') {
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      circle(ctx, w * 0.5, h * 0.5, w * 0.33); ctx.fill();
      A.drawWoodstock(ctx, w * 0.5, h * 0.54, 2.7 * s, t, { expression: 'happy' });
    } else if (who === 'snoopy') {
      A.drawSnoopy(ctx, w * 0.5, h * 0.95, 1.25 * s, t, 'stand', { facing: 1 });
    } else if (who === 'owl') {
      A.drawOwl(ctx, w * 0.5, h * 0.54, 1.55 * s, t);
    } else {
      A.drawNarrator(ctx, w * 0.5, h * 0.55, 1.55 * s);
    }
  };

  /* ═══════════════════════════ CRIATURAS ═══════════════════════════ */
  A.drawEnemy = function (ctx, type, x, y, scale, time, opts) {
    const s = scale || 1, t = time || 0;
    const o = opts || {};
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (o.flash) ctx.globalAlpha = 0.6 + Math.sin(t * 40) * 0.3;
    if (type === 'cloud') {
      const bob = Math.sin(t * 2.4) * 5;
      ctx.translate(0, -70 + bob);
      ctx.fillStyle = 'rgba(20,15,35,.16)';
      ell(ctx, 0, 78 - bob, 36, 8); ctx.fill();
      const grd = ctx.createLinearGradient(0, -30, 0, 35);
      grd.addColorStop(0, '#7d7898'); grd.addColorStop(1, '#4d4766');
      ctx.fillStyle = grd;
      ell(ctx, 0, 0, 38, 25); ctx.fill();
      ell(ctx, -25, 8, 20, 16); ctx.fill();
      ell(ctx, 25, 8, 20, 16); ctx.fill();
      ell(ctx, 0, -14, 25, 18); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, 33, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke();
      // ojos enfadados
      ctx.fillStyle = '#fff3dd';
      ell(ctx, -12, -3, 8, 9); ctx.fill(); ell(ctx, 12, -3, 8, 9); ctx.fill();
      ctx.fillStyle = '#2a2338';
      circle(ctx, -11, -1, 3.4); ctx.fill(); circle(ctx, 13, -1, 3.4); ctx.fill();
      ctx.strokeStyle = '#2a2338'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-20, -11); ctx.lineTo(-6, -6); ctx.moveTo(20, -11); ctx.lineTo(6, -6); ctx.stroke();
      ctx.strokeStyle = '#2a2338'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 11, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      // rayo
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.moveTo(29, 16); ctx.lineTo(22, 30); ctx.lineTo(30, 29); ctx.lineTo(24, 44); ctx.lineTo(38, 26); ctx.lineTo(30, 27); ctx.closePath(); ctx.fill();
      sparkle(ctx, -32, -20, 3.5, '#ffd166', 0.7);
    } else if (type === 'robot') {
      const bob = Math.sin(t * 3.1) * 2.5;
      ctx.translate(0, -60 + bob);
      ctx.fillStyle = 'rgba(20,15,35,.16)';
      ell(ctx, 0, 68 - bob, 30, 7); ctx.fill();
      // piernas
      ctx.strokeStyle = '#6d6a7f'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-10, 22); ctx.lineTo(-13, 52); ctx.moveTo(10, 22); ctx.lineTo(13, 52); ctx.stroke();
      ctx.fillStyle = '#4d4a5f'; rr(ctx, -20, 49, 14, 8, 4); ctx.fill(); rr(ctx, 6, 49, 14, 8, 4); ctx.fill();
      // cuerpo
      const grd = ctx.createLinearGradient(-30, -30, 30, 30);
      grd.addColorStop(0, '#b8b2c9'); grd.addColorStop(0.5, '#8f89a6'); grd.addColorStop(1, '#6c6682');
      ctx.fillStyle = grd;
      rr(ctx, -26, -22, 52, 48, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(40,30,60,.35)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#5b5670'; rr(ctx, -16, -6, 32, 20, 6); ctx.fill();
      ctx.fillStyle = '#ffcf5c'; circle(ctx, -8, 3, 4); ctx.fill(); circle(ctx, 0, 3, 4); ctx.fill(); circle(ctx, 8, 3, 4); ctx.fill();
      // remaches
      ctx.fillStyle = '#d6d0e2';
      [[-21, -16], [21, -16], [-21, 18], [21, 18]].forEach(([ex, ey]) => { circle(ctx, ex, ey, 2.2); ctx.fill(); });
      // brazos
      ctx.strokeStyle = '#8f89a6'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(-25, -12); ctx.lineTo(-38, 8); ctx.moveTo(25, -12); ctx.lineTo(38, 8 + Math.sin(t * 3) * 3); ctx.stroke();
      ctx.fillStyle = '#5b5670'; circle(ctx, -38, 10, 5); ctx.fill(); circle(ctx, 38, 10 + Math.sin(t * 3) * 3, 5); ctx.fill();
      // cabeza
      ctx.fillStyle = '#a9a3bd'; rr(ctx, -22, -53, 44, 33, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(40,30,60,.35)'; ctx.stroke();
      // gafas
      ctx.fillStyle = '#ff6f6f';
      rr(ctx, -17, -42, 34, 12, 6); ctx.fill();
      ctx.fillStyle = '#ffd4c9'; rr(ctx, -12, -39, 24, 5, 2.5); ctx.fill();
      ctx.fillStyle = '#3a2a30'; circle(ctx, -6, -36.5, 2); ctx.fill(); circle(ctx, 6, -36.5, 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ell(ctx, -10, -47, 5, 1.5, -0.2); ctx.fill();
      // antena / hélice
      ctx.strokeStyle = '#6d6a7f'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, -53); ctx.lineTo(0, -64); ctx.stroke();
      ctx.save(); ctx.translate(0, -66); ctx.rotate(t * 12);
      ctx.fillStyle = '#ffcf5c'; ell(ctx, -11, 0, 11, 2.4); ctx.fill(); ell(ctx, 11, 0, 11, 2.4); ctx.fill();
      ctx.restore();
    } else if (type === 'cat') {
      const bob = Math.sin(t * 2) * 3;
      ctx.translate(0, -80 + bob);
      ctx.fillStyle = 'rgba(20,15,35,.16)';
      ell(ctx, 0, 86 - bob, 48, 10); ctx.fill();
      // cola
      ctx.strokeStyle = '#2b2438'; ctx.lineWidth = 11; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-38, 22); ctx.quadraticCurveTo(-64, 4, -52, -22); ctx.quadraticCurveTo(-46, -36, -38, -26); ctx.stroke();
      ctx.fillStyle = '#1f192c';
      ell(ctx, 0, 5, 42, 46); ctx.fill();
      ctx.fillStyle = '#332b46';
      ell(ctx, 0, 9, 24, 32); ctx.fill();
      // patas
      ctx.fillStyle = '#1f192c';
      ell(ctx, -22, 50, 14, 9); ctx.fill(); ell(ctx, 22, 50, 14, 9); ctx.fill();
      // cabeza
      ctx.fillStyle = '#241d33';
      ell(ctx, 0, -40, 34, 30); ctx.fill();
      // orejas
      ctx.beginPath(); ctx.moveTo(-30, -58); ctx.lineTo(-36, -86); ctx.lineTo(-12, -66); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(30, -58); ctx.lineTo(36, -86); ctx.lineTo(12, -66); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4a3b5c';
      ctx.beginPath(); ctx.moveTo(-27, -61); ctx.lineTo(-31, -79); ctx.lineTo(-17, -66); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(27, -61); ctx.lineTo(31, -79); ctx.lineTo(17, -66); ctx.closePath(); ctx.fill();
      // ojos verdes
      ctx.fillStyle = '#8ef2a7';
      ell(ctx, -14, -44, 8, 10); ctx.fill(); ell(ctx, 14, -44, 8, 10); ctx.fill();
      ctx.fillStyle = '#1b2b1e';
      ell(ctx, -14, -43, 2.6, 7); ctx.fill(); ell(ctx, 14, -43, 2.6, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      circle(ctx, -16.5, -47, 2); ctx.fill(); circle(ctx, 11.5, -47, 2); ctx.fill();
      // hocico
      ctx.fillStyle = '#e78da2'; ell(ctx, 0, -30, 6, 4); ctx.fill();
      ctx.strokeStyle = '#0f0b18'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-5, -27); ctx.lineTo(-27, -33); ctx.moveTo(-5, -25); ctx.lineTo(-28, -22); ctx.moveTo(5, -27); ctx.lineTo(27, -33); ctx.moveTo(5, -25); ctx.lineTo(28, -22); ctx.stroke();
      ctx.beginPath(); ctx.arc(-3, -24, 4, 0.1, Math.PI); ctx.arc(3, -24, 4, 0, Math.PI - 0.1); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, -40, 31, Math.PI * 1.1, Math.PI * 1.5); ctx.stroke();
    }
    ctx.restore();
  };

  /* ═══════════════════════════ OBJETOS ═══════════════════════════ */
  A.drawBone = function (ctx, x, y, size, angle, time, opts) {
    const s = size || 30, t = time || 0, o = opts || {};
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle == null ? Math.sin(t * 1.5) * 0.2 : angle);
    if (o.glow) {
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, s * 1.5);
      g.addColorStop(0, 'rgba(255,214,120,.45)');
      g.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = g; circle(ctx, 0, 0, s * 1.5); ctx.fill();
    }
    const grad = ctx.createLinearGradient(-s, -s * 0.4, s, s * 0.4);
    grad.addColorStop(0, '#fff3bc'); grad.addColorStop(0.5, '#ffd15c'); grad.addColorStop(1, '#eda62e');
    ctx.fillStyle = grad;
    rr(ctx, -s * 0.62, -s * 0.16, s * 1.24, s * 0.32, s * 0.16); ctx.fill();
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sy]) => {
      circle(ctx, sx * s * 0.62, sy * s * 0.2, s * 0.24); ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,255,255,.65)';
    rr(ctx, -s * 0.48, -s * 0.1, s * 0.7, s * 0.07, s * 0.03); ctx.fill();
    ctx.restore();
    if (o.sparkle !== false) {
      sparkle(ctx, x + s * 0.7, y - s * 0.7, s * 0.16, '#fff3c4', 0.8 + Math.sin(t * 4) * 0.2);
    }
  };

  function itemSparkles(ctx, tint, s) {
    sparkle(ctx, -s * 0.78, -s * 0.55, s * 0.12, tint, 0.9);
    sparkle(ctx, s * 0.8, -s * 0.3, s * 0.08, '#fff8ea', 0.8);
    sparkle(ctx, s * 0.55, s * 0.7, s * 0.06, tint, 0.7);
  }

  A.drawItemShape = function (ctx, item, size) {
    const s = (size || 100) / 100;
    ctx.save();
    ctx.scale(s, s);
    const tint = item.tint || '#ffd166';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    switch (item.art) {
      case 'bone': {
        ctx.rotate(-0.55);
        const g = ctx.createLinearGradient(-30, 0, 30, 0);
        g.addColorStop(0, '#fff2b0'); g.addColorStop(0.55, '#ffd15c'); g.addColorStop(1, '#eaa32b');
        ctx.fillStyle = g;
        rr(ctx, -24, -9, 48, 18, 9); ctx.fill();
        [[-24, -9], [-24, 9], [24, -9], [24, 9]].forEach(([x, y]) => { circle(ctx, x, y, 10); ctx.fill(); });
        ctx.strokeStyle = 'rgba(160,100,10,.3)'; ctx.lineWidth = 2;
        rr(ctx, -24, -9, 48, 18, 9); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        rr(ctx, -16, -4, 24, 4, 2); ctx.fill();
        break;
      }
      case 'collar': {
        ctx.strokeStyle = '#d63a4f'; ctx.lineWidth = 11;
        ctx.beginPath(); ctx.ellipse(0, -2, 24, 16, 0, 0.2, Math.PI * 1.15); ctx.stroke();
        ctx.strokeStyle = '#ff6f82'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.ellipse(0, -2, 24, 16, 0, 0.25, Math.PI * 1.1); ctx.stroke();
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const a = 0.5 + i * 0.55;
          circle(ctx, Math.cos(a) * 24, -2 + Math.sin(a) * 16, 2.4); ctx.fillStyle = '#ffd166'; ctx.fill();
        }
        // placa
        ctx.fillStyle = '#ffd166';
        ctx.beginPath(); ctx.arc(0, 24, 11, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#c98c15'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#e8484f';
        ctx.save(); ctx.translate(0, 25); ctx.scale(0.55, 0.55);
        ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-12, -1, -10, -12, -2, -12); ctx.bezierCurveTo(1, -12, 3, -9, 0, -4); ctx.bezierCurveTo(-3, -9, 0, -12, 3, -12); ctx.bezierCurveTo(10, -12, 12, -1, 0, 8); ctx.fill();
        ctx.restore();
        break;
      }
      case 'kite': {
        ctx.strokeStyle = '#b85c2c'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-22, -4); ctx.quadraticCurveTo(-10, 4, 4, -2); ctx.stroke();
        ctx.fillStyle = '#ff8a52';
        ctx.beginPath(); ctx.moveTo(2, -34); ctx.lineTo(26, -8); ctx.lineTo(2, 20); ctx.lineTo(-22, -8); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fff3d6'; ctx.lineWidth = 2.4; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(2, -34); ctx.lineTo(2, 20); ctx.moveTo(-22, -8); ctx.lineTo(26, -8); ctx.stroke();
        ctx.fillStyle = '#ffd166';
        ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(11, -8); ctx.lineTo(2, -16); ctx.lineTo(-7, -8); ctx.closePath(); ctx.fill();
        // cola
        ctx.strokeStyle = '#c75b3b'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(2, 20); ctx.quadraticCurveTo(-8, 30, 0, 38); ctx.quadraticCurveTo(8, 44, 2, 52); ctx.stroke();
        [[-7, 30], [4, 40], [-1, 49]].forEach(([x, y], i) => {
          ctx.fillStyle = i % 2 ? '#ffe08a' : '#8fd6b6';
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 7, y + 2); ctx.lineTo(x - 2, y + 7); ctx.closePath(); ctx.fill();
        });
        break;
      }
      case 'piano': {
        ctx.fillStyle = '#7b4b35'; rr(ctx, -30, -26, 60, 44, 7); ctx.fill();
        ctx.fillStyle = '#9c6343'; rr(ctx, -26, -30, 52, 8, 3); ctx.fill();
        ctx.fillStyle = '#5d3b2c'; rr(ctx, -34, -36, 68, 7, 3); ctx.fill();
        ctx.fillStyle = '#fdf7ea'; rr(ctx, -26, 2, 52, 16, 2); ctx.fill();
        ctx.fillStyle = '#3a2d2c';
        for (let i = 0; i < 7; i++) { rr(ctx, -23 + i * 7, 2, 3, 10, 1); ctx.fill(); }
        ctx.fillStyle = '#2f2936'; rr(ctx, -28, 18, 4, 8, 1.5); ctx.fill(); rr(ctx, 24, 18, 4, 8, 1.5); ctx.fill();
        ctx.fillStyle = '#ffd166';
        ctx.font = '700 16px "Baloo 2", sans-serif';
        ctx.fillText('♪', 16, -38); ctx.fillText('♫', 32, -28);
        break;
      }
      case 'blanket': {
        const g = ctx.createLinearGradient(-24, -20, 24, 24);
        g.addColorStop(0, '#a7d3f6'); g.addColorStop(1, '#5f9ad6');
        ctx.fillStyle = g;
        rr(ctx, -28, -22, 56, 46, 8); ctx.fill();
        ctx.fillStyle = '#7db9ea';
        rr(ctx, -28, -22, 56, 12, 6); ctx.fill();
        rr(ctx, -28, 4, 56, 8, 4); ctx.fill();
        ctx.fillStyle = '#fff6ea';
        ctx.beginPath();
        for (let x = -22; x < 24; x += 12) {
          ctx.moveTo(x, -14); ctx.quadraticCurveTo(x + 2, -8, x + 5, -12);
        }
        ctx.strokeStyle = '#fff6ea'; ctx.lineWidth = 1.4; ctx.stroke();
        // estrella
        ctx.fillStyle = '#ffe08a';
        ctx.save(); ctx.translate(8, 12); ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? 3 : 7, a = -Math.PI / 2 + i * Math.PI / 5;
          i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fill(); ctx.restore();
        ctx.strokeStyle = 'rgba(50,80,130,.4)'; ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]); rr(ctx, -25, -19, 50, 40, 7); ctx.stroke(); ctx.setLineDash([]);
        break;
      }
      case 'gloves': {
        [[-15, -4], [15, 6]].forEach(([gx, gy], i) => {
          ctx.save(); ctx.translate(gx, gy); ctx.rotate(i ? -0.35 : 0.3);
          ctx.fillStyle = '#e8484f';
          ell(ctx, 0, 0, 16, 19); ctx.fill();
          ctx.beginPath(); ctx.ellipse(-13, 8, 7, 5, 0.5, 0, TAU); ctx.fill();
          ctx.fillStyle = '#ff7b83'; ell(ctx, -4, -7, 7, 5, -0.3); ctx.fill();
          ctx.fillStyle = '#fff6ea'; rr(ctx, -14, 15, 28, 11, 4); ctx.fill();
          ctx.strokeStyle = 'rgba(160,30,40,.35)'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(-12, 18); ctx.lineTo(12, 18); ctx.stroke();
          ctx.restore();
        });
        break;
      }
      case 'badge': {
        ctx.fillStyle = '#e0a52c';
        // alas
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-24 - i * 4, -14 + i * 5, -34, 2 + i * 6); ctx.quadraticCurveTo(-20, 4 + i * 3, -8, 6);
        }
        ctx.fill();
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          ctx.moveTo(8, 0); ctx.quadraticCurveTo(24 + i * 4, -14 + i * 5, 34, 2 + i * 6); ctx.quadraticCurveTo(20, 4 + i * 3, 8, 6);
        }
        ctx.fill();
        const g = ctx.createRadialGradient(-4, -6, 2, 0, 0, 18);
        g.addColorStop(0, '#fff0a8'); g.addColorStop(1, '#f0b526');
        ctx.fillStyle = g; circle(ctx, 0, 0, 17); ctx.fill();
        ctx.strokeStyle = '#b27a10'; ctx.lineWidth = 2.2; ctx.stroke();
        ctx.fillStyle = '#7a4b25';
        ctx.beginPath(); ctx.moveTo(-8, 3); ctx.lineTo(0, -7); ctx.lineTo(8, 3); ctx.lineTo(3, 3); ctx.lineTo(3, 8); ctx.lineTo(-3, 8); ctx.lineTo(-3, 3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffd166'; sparkle(ctx, 0, -8, 4, '#fff6d0', 0.9);
        break;
      }
      case 'sunglasses': {
        ctx.strokeStyle = '#2b2638'; ctx.lineWidth = 4;
        ctx.fillStyle = '#3a3450';
        rr(ctx, -30, -12, 28, 22, 10); ctx.fill(); ctx.stroke();
        rr(ctx, 2, -12, 28, 22, 10); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(-2, -4); ctx.quadraticCurveTo(0, -8, 2, -4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-30, -5); ctx.lineTo(-38, -1); ctx.moveTo(30, -5); ctx.lineTo(38, -1); ctx.stroke();
        // reflejos
        const grad = ctx.createLinearGradient(-28, -10, 26, 8);
        grad.addColorStop(0, 'rgba(255,140,180,.5)'); grad.addColorStop(.45, 'rgba(255,220,120,.45)'); grad.addColorStop(.75, 'rgba(120,220,200,.4)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.moveTo(-28, 8); ctx.lineTo(-24, -10); ctx.lineTo(-12, -10); ctx.lineTo(-18, 8); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(4, 8); ctx.lineTo(8, -10); ctx.lineTo(20, -10); ctx.lineTo(14, 8); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-24, -6); ctx.lineTo(-19, -8); ctx.moveTo(8, -6); ctx.lineTo(13, -8); ctx.stroke();
        break;
      }
      case 'letter': {
        ctx.save(); ctx.rotate(-0.06);
        ctx.fillStyle = '#fff8ea';
        rr(ctx, -32, -24, 64, 46, 6); ctx.fill();
        ctx.strokeStyle = '#d8c4a4'; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.strokeStyle = '#e4d3b8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-32, -24); ctx.lineTo(0, 2); ctx.lineTo(32, -24); ctx.stroke();
        ctx.fillStyle = '#ff8fa8';
        ctx.save(); ctx.translate(0, 10); ctx.scale(0.9, 0.9);
        ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-12, -1, -10, -12, -2, -12); ctx.bezierCurveTo(1, -12, 3, -9, 0, -4); ctx.bezierCurveTo(-3, -9, 0, -12, 3, -12); ctx.bezierCurveTo(10, -12, 12, -1, 0, 8); ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'rgba(150,120,90,.35)';
        rr(ctx, -22, 18, 26, 2.4, 1); ctx.fill();
        rr(ctx, -22, 23, 16, 2.4, 1); ctx.fill();
        sparkle(ctx, 26, -20, 3.5, '#ffd166', 0.9);
        ctx.restore();
        break;
      }
      case 'doghouse': {
        ctx.fillStyle = 'rgba(40,20,40,.12)';
        ell(ctx, 0, 28, 30, 5); ctx.fill();
        ctx.fillStyle = '#cf4b47'; rr(ctx, -26, -18, 52, 46, 3); ctx.fill();
        ctx.strokeStyle = 'rgba(90,25,30,.35)'; ctx.lineWidth = 1.4; rr(ctx, -26, -18, 52, 46, 3); ctx.stroke();
        ctx.fillStyle = '#3a2b3f';
        ctx.beginPath(); ctx.moveTo(-9, 28); ctx.lineTo(-9, 2); ctx.quadraticCurveTo(0, -9, 9, 2); ctx.lineTo(9, 28); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#333041';
        ctx.beginPath(); ctx.moveTo(-34, -16); ctx.lineTo(34, -16); ctx.lineTo(0, -42); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#d95a50'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-34, -16); ctx.lineTo(0, -42); ctx.lineTo(34, -16); ctx.stroke();
        ctx.strokeStyle = 'rgba(110,30,35,.25)'; ctx.lineWidth = 1;
        for (let i = -16; i <= 16; i += 16) { ctx.beginPath(); ctx.moveTo(i, -14); ctx.lineTo(i, 26); ctx.stroke(); }
        ctx.fillStyle = '#ffd166'; sparkle(ctx, -20, -28, 3.5, '#ffe6a0', 0.9);
        break;
      }
      case 'pumpkin': {
        const g = ctx.createRadialGradient(-6, -6, 2, 0, 0, 30);
        g.addColorStop(0, '#ffc46a'); g.addColorStop(1, '#f18a25');
        ctx.fillStyle = g;
        ell(ctx, 0, 4, 27, 23); ctx.fill();
        ell(ctx, -14, 4, 14, 21); ctx.fill();
        ell(ctx, 14, 4, 14, 21); ctx.fill();
        ctx.strokeStyle = 'rgba(190,90,10,.35)'; ctx.lineWidth = 1.6;
        ell(ctx, -12, 4, 11, 20); ctx.stroke(); ell(ctx, 0, 4, 13, 22); ctx.stroke(); ell(ctx, 12, 4, 11, 20); ctx.stroke();
        ctx.fillStyle = '#5d7a3b'; rr(ctx, -4, -28, 8, 14, 3); ctx.fill();
        ctx.strokeStyle = '#7a9a4c'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(2, -22); ctx.quadraticCurveTo(16, -30, 20, -18); ctx.stroke();
        ctx.fillStyle = '#ffe08a'; sparkle(ctx, 22, 12, 3.4, '#ffe08a', 0.9);
        break;
      }
      case 'dinner': {
        ctx.fillStyle = '#eef2f7'; ell(ctx, 0, 10, 36, 14); ctx.fill();
        ctx.fillStyle = '#c7d6e8'; ell(ctx, 0, 10, 27, 9); ctx.fill();
        ctx.fillStyle = '#fff8ea'; ell(ctx, 0, 8, 24, 7); ctx.fill();
        // pollo
        ctx.fillStyle = '#b5703c';
        ell(ctx, -2, -2, 16, 11, -0.2); ctx.fill();
        ctx.strokeStyle = '#f4dfc0'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-13, 1); ctx.lineTo(6, -8); ctx.stroke();
        ctx.fillStyle = '#fff3e0'; ell(ctx, 7, -9, 4, 3, 0.4); ctx.fill();
        // verduras
        ctx.fillStyle = '#6aa84f'; ell(ctx, -18, 4, 6, 4, 0.2); ctx.fill(); ell(ctx, 14, 1, 5, 3.5, -0.3); ctx.fill();
        ctx.fillStyle = '#e8853c'; ell(ctx, 16, 6, 5, 4, 0.2); ctx.fill();
        // vapor
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-4, -18); ctx.quadraticCurveTo(-10, -26, -4, -32); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8, -18); ctx.quadraticCurveTo(14, -26, 8, -32); ctx.stroke();
        break;
      }
    }
    itemSparkles(ctx, tint, 34);
    ctx.restore();
  };

  A.drawItemIcon = function (ctx, w, h, item) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.46;
    const g = ctx.createRadialGradient(cx, cy - R * 0.2, 2, cx, cy, R);
    g.addColorStop(0, rgba(item.tint || '#ffd166', 0.3));
    g.addColorStop(0.7, rgba(item.tint || '#ffd166', 0.08));
    g.addColorStop(1, rgba(item.tint || '#ffd166', 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.save();
    ctx.translate(cx, cy);
    const s = Math.min(w, h) * 0.0125;
    ctx.scale(s, s);
    A.drawItemShape(ctx, item, 100);
    ctx.restore();
  };

  A.drawBoneIcon = function (ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    A.drawBone(ctx, w / 2, h / 2, Math.min(w, h) * 0.36, -0.55, 0, {});
  };

  A.drawEmote = function (ctx, x, y, type, scale, time) {
    const s = scale || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    rr(ctx, -16, -14, 32, 24, 10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-5, 8); ctx.lineTo(-10, 15); ctx.lineTo(2, 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,60,.12)'; ctx.lineWidth = 1.4;
    rr(ctx, -16, -14, 32, 24, 10); ctx.stroke();
    if (type === 'heart') {
      ctx.fillStyle = '#ff7d9c';
      ctx.beginPath(); ctx.moveTo(0, 7); ctx.bezierCurveTo(-12, -1, -9, -11, -2, -9); ctx.bezierCurveTo(1, -8, 2, -5, 0, -2); ctx.bezierCurveTo(-2, -5, 1, -8, 3, -9); ctx.bezierCurveTo(10, -11, 12, -1, 0, 7); ctx.fill();
    } else if (type === 'alert') {
      ctx.fillStyle = '#e88a2f';
      rr(ctx, -2.4, -8, 4.8, 10, 2); ctx.fill();
      circle(ctx, 0, 4, 2.2); ctx.fill();
    } else if (type === 'star') {
      sparkle(ctx, 0, -1, 7, '#ffc94d', 1);
    } else if (type === 'note') {
      ctx.fillStyle = '#7b68c9'; ctx.font = '800 20px "Baloo 2", sans-serif'; ctx.fillText('♪', -7, 6);
    } else {
      ctx.fillStyle = '#7ddcc4'; circle(ctx, 0, -1, 4); ctx.fill();
    }
    ctx.restore();
  };

  /* Export small helpers for scenery */
  A.utils = { clamp, lerp, hash, rgba, shade, rr, circle, ell, sparkle, TAU, pick };
})();
