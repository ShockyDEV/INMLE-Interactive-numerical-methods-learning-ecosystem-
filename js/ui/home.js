/* MNO.views.home — portada tipo índice de curso: unidades numeradas, fichas
   con glifo generativo y medidor de maestría. MNO.views.calc — laboratorio. */
(function (NS) {
  'use strict';

  NS.views = NS.views || {};

  function el(tag, cls, html) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html !== undefined) d.innerHTML = html;
    return d;
  }

  const NIVELES = ['Nuevo', 'Explorador', 'Aprendiz', 'Experto', 'Maestro'];

  NS.views.home = {
    mount: function (root) {
      const sec = el('section', 'pantalla home');

      /* ---- masthead ---- */
      const mast = el('header', 'masthead');
      mast.appendChild(el('p', 'eyebrow', 'Interactive Numerical Methods Learning Ecosystem'));
      mast.appendChild(el('h1', null, 'INMLE · Métodos numéricos'));
      mast.appendChild(el('p', 'lede', 'Un laboratorio interactivo para APRENDER los métodos, no solo ejecutarlos: explora cada algoritmo en movimiento, predice su siguiente paso y ponlo a competir.'));
      const acc = el('nav', 'masthead-acciones');
      [
        ['#/carrera', 'Carrera de métodos', 'btn'],
        ['#/progreso', 'Mi progreso', 'btn btn-suave'],
        ['#/calc', 'Laboratorio f(x)', 'btn btn-suave'],
      ].forEach(function (par) {
        const a = el('a', par[2], par[1]);
        a.href = par[0];
        acc.appendChild(a);
      });
      mast.appendChild(acc);
      if (NS.tema) mast.appendChild(NS.tema.boton());
      if (NS.store) {
        const g = NS.store.resumenGlobal();
        if (g.puntos > 0 || g.insignias > 0) {
          mast.appendChild(el('p', 'hero-marcas',
            g.puntos + ' pts · ' + g.insignias + '/' + NS.achievements.lista.length + ' insignias · ' + g.maestros + '/11 métodos dominados'));
        }
      }
      sec.appendChild(mast);

      /* ---- unidades ---- */
      NS.familias.forEach(function (fam, fi) {
        const unidad = el('section', 'unidad');
        const cab = el('div', 'unidad-cab');
        cab.appendChild(el('span', 'unidad-num', '0' + (fi + 1)));
        cab.appendChild(el('h2', null, fam.nombre));
        cab.appendChild(el('span', 'unidad-desc', fam.desc));
        unidad.appendChild(cab);
        const fichas = el('div', 'fichas');
        fam.metodos.forEach(function (mid, mi) {
          const m = NS.registry[mid];
          const card = el('a', 'ficha');
          card.href = '#/m/' + mid;
          const glifo = el('span', 'ficha-glifo');
          card.appendChild(glifo);
          const info = el('div', 'ficha-info');
          info.appendChild(el('div', 'ficha-num', (fi + 1) + '.' + (mi + 1)));
          info.appendChild(el('h3', null, m.nombre));
          info.appendChild(el('p', null, m.desc));
          const nivel = NS.store ? NS.store.mastery(mid) : 0; /* 0..4 */
          const me = el('div', 'maestria');
          for (let i = 0; i < 4; i++) me.appendChild(el('i', i < nivel ? 'on' : ''));
          me.appendChild(el('span', 'maestria-txt', NIVELES[Math.min(4, nivel)]));
          info.appendChild(me);
          card.appendChild(info);
          fichas.appendChild(card);
          NS.glyphs.into(glifo, mid, 52);
        });
        unidad.appendChild(fichas);
        sec.appendChild(unidad);
      });

      sec.appendChild(el('footer', 'pie',
        'INMLE — recurso educativo abierto de métodos numéricos. Funciona sin conexión; tu progreso vive únicamente en este navegador.'));
      root.appendChild(sec);
    },
    unmount: function () {},
  };

  /* ---------- Laboratorio f(x) ---------- */
  NS.views.calc = {
    mount: function (root) {
      const sec = el('section', 'pantalla met');
      const head = el('header', 'met-head');
      const back = el('a', 'btn-back', '←');
      back.href = '#/';
      back.setAttribute('aria-label', 'Volver al índice');
      head.appendChild(back);
      const glifo = el('span', 'met-glifo');
      head.appendChild(glifo);
      const tit = el('div', 'met-tit');
      tit.appendChild(el('p', 'eyebrow', 'Herramienta'));
      tit.appendChild(el('h1', null, 'Laboratorio f(x)'));
      tit.appendChild(el('p', 'met-desc', 'Dibuja funciones, evalúalas en una lista de puntos y calcula expresiones.'));
      head.appendChild(tit);
      if (NS.tema) head.appendChild(NS.tema.boton());
      sec.appendChild(head);
      NS.glyphs.into(glifo, 'calc', 46);

      const cuerpo = el('div', 'met-grid');
      const visual = el('div', 'met-visual');
      const lado = el('aside', 'met-lado');
      const cbox = el('div', 'canvas-box');
      const canvas = document.createElement('canvas');
      canvas.className = 'met-canvas';
      cbox.appendChild(canvas);
      visual.appendChild(cbox);
      const tabla = el('div', 'lab-tabla');
      visual.appendChild(tabla);

      const formBox = el('div', 'params-form');
      function campo(labelTxt, val, hint) {
        const f = el('div', 'field');
        const lab = el('label', null, labelTxt);
        f.appendChild(lab);
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.spellcheck = false;
        inp.value = val;
        f.appendChild(inp);
        if (hint) f.appendChild(el('span', 'hint', hint));
        formBox.appendChild(f);
        return inp;
      }
      const inF = campo('f(x)', '120*abs(x)', 'prueba sin(x)·e^(−x/5), x^3 − 2x…');
      const inXs = campo('Evaluar en x', '-1 0 1 2 3');
      const btn = el('button', 'btn btn-run', 'Evaluar');
      btn.type = 'button';
      formBox.appendChild(btn);
      const inC = campo('Calculadora', '', '3/7, sqrt(2), sin(pi/4)…');
      const resC = el('div', 'lab-calc-res');
      formBox.appendChild(resC);
      lado.appendChild(formBox);

      cuerpo.appendChild(visual);
      cuerpo.appendChild(lado);
      sec.appendChild(cuerpo);
      root.appendChild(sec);

      const plot = new NS.Plot2D(canvas, {});
      this._plot = plot;

      function pinta() {
        const r = NS.expr.tryCompile(inF.value, ['x']);
        if (!r.ok) { NS.ui.toast(r.error, 'error'); return; }
        const xs = NS.num.P(inXs.value).filter(isFinite);
        const fns = { f: r.fn };
        let lo = Math.min.apply(null, xs.length ? xs : [-5]);
        let hi = Math.max.apply(null, xs.length ? xs : [5]);
        if (hi - lo < 1e-9) { lo -= 3; hi += 3; }
        const mar = (hi - lo) * 0.3;
        const prims = xs.map(function (x, i) {
          return { t: 'point', id: 'e' + i, x: x, y: r.fn(x), cls: 'candidato', label: 'x=' + NS.num.fmt(x, 3) };
        });
        plot.setScene(fns, [{ t: 'curve', fn: 'f', cls: 'principal' }].concat(prims));
        plot.autoscale({ xmin: lo - mar, xmax: hi + mar }, prims);
        plot._staticDirty = true;
        plot.render();
        tabla.innerHTML = '';
        let mx = 0, mX = null;
        const grid = el('div', 'lab-grid');
        grid.appendChild(el('div', 'lab-cab', 'x'));
        grid.appendChild(el('div', 'lab-cab', 'f(x)'));
        grid.appendChild(el('div', 'lab-cab', '|f(x)|'));
        xs.forEach(function (x) {
          const v = r.fn(x), a = Math.abs(v);
          if (a > mx) { mx = a; mX = x; }
          grid.appendChild(el('div', 'lab-cel', NS.num.fmt(x, 6)));
          grid.appendChild(el('div', 'lab-cel', NS.num.fmt(v, 8)));
          grid.appendChild(el('div', 'lab-cel', NS.num.fmt(a, 8)));
        });
        tabla.appendChild(grid);
        if (mX !== null) {
          tabla.appendChild(el('p', 'lab-max', 'máx |f(x)| = ' + NS.num.fmt(mx, 8) + ' en x = ' + NS.num.fmt(mX, 6)));
        }
      }
      btn.addEventListener('click', pinta);
      [inF, inXs].forEach(function (inp) {
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') pinta(); });
      });
      inC.addEventListener('input', function () {
        if (!inC.value.trim()) { resC.textContent = ''; return; }
        try {
          resC.textContent = '= ' + NS.num.fmt(NS.expr.evalConst(inC.value), 10);
          resC.classList.remove('mal');
        } catch (e) {
          resC.textContent = e.message;
          resC.classList.add('mal');
        }
      });
      pinta();
    },
    unmount: function () {
      if (this._plot) { this._plot.destroy(); this._plot = null; }
    },
  };
})(globalThis.MNO = globalThis.MNO || {});
