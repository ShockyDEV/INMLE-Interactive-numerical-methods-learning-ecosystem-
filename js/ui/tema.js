/* MNO.tema — tema claro/oscuro (cuaderno de día / flexo de noche) y las
   paletas de canvas asociadas. El DOM se tematiza solo con los tokens CSS;
   los canvas (plot2d, errorchart, glifos) leen NS.plotPalette() al pintar. */
(function (NS) {
  'use strict';

  const CLAVE = 'mno.tema';

  function preferido() {
    try {
      const g = localStorage.getItem(CLAVE);
      if (g === 'light' || g === 'dark') return g;
    } catch (e) { /* sin storage */ }
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  const tema = {
    actual: function () {
      const attr = document.documentElement.getAttribute('data-theme');
      return attr === 'dark' || attr === 'light' ? attr : preferido();
    },
    aplicar: function (t) {
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem(CLAVE, t); } catch (e) { /* nada */ }
    },
    init: function () {
      /* el pre-init de index.html ya puso el atributo si había preferencia */
      if (!document.documentElement.getAttribute('data-theme')) {
        document.documentElement.setAttribute('data-theme', preferido());
      }
    },
    toggle: function () {
      tema.aplicar(tema.actual() === 'dark' ? 'light' : 'dark');
      if (NS.router) NS.router.refresh(); /* remonta la vista: los canvas repintan */
    },
    /* botón sol/luna */
    boton: function () {
      const b = document.createElement('button');
      b.className = 'btn-tema';
      b.type = 'button';
      const pinta = function () {
        const oscuro = tema.actual() === 'dark';
        b.setAttribute('aria-label', oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
        b.title = b.getAttribute('aria-label');
        b.innerHTML = oscuro
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5z"/></svg>';
      };
      pinta();
      b.addEventListener('click', function () { tema.toggle(); });
      return b;
    },
  };

  /* ---------- paletas de canvas ---------- */
  const CLARO = {
    grid: 'rgba(27, 73, 200, 0.10)',       /* papel milimetrado azulado */
    axis: '#8292ac',
    tick: '#7d8799',
    crosshair: '#1b49c8',
    pointStroke: '#ffffff',
    principal: '#1b49c8',
    secundaria: '#0e7490',
    identidad: '#9aa5b8',
    base: '#7d8799',
    interpolante: '#0e7490',
    tangente: '#c23d32',                    /* tinta roja de corrección */
    secante: '#c23d32',
    cuerda: '#c23d32',
    intervalo: 'rgba(27, 73, 200, 0.10)',
    descartado: 'rgba(194, 61, 50, 0.10)',
    candidato: '#c23d32',
    extremo: '#1b49c8',
    siguiente: '#14724a',
    raiz: '#14724a',
    guia: 'rgba(70, 83, 106, 0.55)',
    trayectoria: '#c23d32',
    recta1: '#1b49c8',
    recta2: '#0e7490',
    nodo: '#1b49c8',
    error: '#b3271e',
    ok: '#14724a', bad: '#b3271e', muted: '#7d8799',
    serie: ['#1b49c8', '#0e7490', '#c23d32', '#92610f'],
  };
  const OSCURO = {
    grid: 'rgba(125, 151, 238, 0.12)',
    axis: '#5f6b82',
    tick: '#7e8698',
    crosshair: '#7d97ee',
    pointStroke: '#12151d',
    principal: '#7d97ee',
    secundaria: '#4cc3d4',
    identidad: '#5a6478',
    base: '#7e8698',
    interpolante: '#4cc3d4',
    tangente: '#e0685c',
    secante: '#e0685c',
    cuerda: '#e0685c',
    intervalo: 'rgba(125, 151, 238, 0.15)',
    descartado: 'rgba(224, 104, 92, 0.13)',
    candidato: '#e0685c',
    extremo: '#7d97ee',
    siguiente: '#4fbe8b',
    raiz: '#4fbe8b',
    guia: 'rgba(179, 184, 194, 0.5)',
    trayectoria: '#e0685c',
    recta1: '#7d97ee',
    recta2: '#4cc3d4',
    nodo: '#7d97ee',
    error: '#e0685c',
    ok: '#4fbe8b', bad: '#e0685c', muted: '#7e8698',
    serie: ['#7d97ee', '#4cc3d4', '#e0685c', '#d8a94e'],
  };

  NS.plotPalette = function () {
    return tema.actual() === 'dark' ? OSCURO : CLARO;
  };

  NS.tema = tema;
})(globalThis.MNO = globalThis.MNO || {});
