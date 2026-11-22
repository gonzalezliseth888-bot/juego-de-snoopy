/* ═══════════════════════════════════════════════════════════════
   MAIN — arranque del pequeño mundo
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function boot() {
    if (!window.SLW || !SLW.Game || !SLW.UI) return;
    SLW.Game.init();
    SLW.UI.init();

    // El audio solo puede nacer con un gesto del jugador.
    const unlock = () => {
      if (window.SLW && SLW.Audio) SLW.Audio.init();
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && SLW.Game && SLW.Game.running && !SLW.Game.paused && !SLW.Game.uiBlock) {
        SLW.Game.pauseGame(true);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
