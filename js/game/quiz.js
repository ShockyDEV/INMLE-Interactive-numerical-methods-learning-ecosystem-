/* MNO.modes.practicar — motor Predecir-Observar-Explicar.
   Las preguntas las generan los packs de contenido:
     NS.content.quizzes[metodoId] = { generadores: [ function (U) → pregunta ] }
   pregunta = {
     tipo: 'choice' | 'numeric' | 'point-x',
     tema: 'slug-de-misconception',            ← alimenta el dashboard
     enunciado: 'texto con $math$',
     traza: Trace | null,                      ← visual congelada
     hastaPaso: k,                             ← índice de paso a mostrar
     opciones: [...], correcta: idx,           ← choice
     respuesta: num, tol: abs,                 ← numeric
     puntoX: x, tolX: abs,                     ← point-x (clic en la gráfica)
     pista: '...', solucion: '...',
   }
   Feedback en dos niveles: 1.º fallo → pista; 2.º fallo → solución. */
(function (NS) {
  'use strict';

  NS.modes = NS.modes || {};

  const U = {
    rand: function (a, b) { return a + Math.random() * (b - a); },
    randInt: function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    elegir: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    baraja: function (arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    },
  };

  let S = null;

  function el(tag, cls, html) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html !== undefined) d.innerHTML = html;
    return d;
  }

  function drawDe(trace, i) {
    for (let j = Math.min(i, trace.steps.length - 1); j >= 0; j--) {
      if (trace.steps[j].draw) return trace.steps[j].draw;
    }
    return [];
  }

  NS.modes.practicar = {
    mount: function (container, ctx) {
      const banco = NS.content.quizzes[ctx.method.id];
      if (!banco || !banco.generadores || !banco.generadores.length) {
        container.appendChild(el('div', 'placeholder-card',
          '<h2>🎯 Practicar</h2><p>Las preguntas de este método se están escribiendo…</p>'));
        return;
      }
      S = { ctx: ctx, banco: banco, ultimo: -1, plot: null, sesion: { aciertos: 0, total: 0 } };

      const caja = el('div', 'quiz-caja');
      const barra = el('div', 'quiz-barra');
      S.marcas = el('div', 'quiz-marcas');
      barra.appendChild(S.marcas);
      caja.appendChild(barra);
      S.instr = el('div', 'quiz-instr');
      caja.appendChild(S.instr);
      S.visualBox = el('div', 'canvas-box quiz-canvas');
      S.visualBox.style.display = 'none';
      const cv = document.createElement('canvas');
      cv.className = 'met-canvas';
      cv.setAttribute('aria-label', 'Gráfica de la pregunta. Flechas + Enter para responder con teclado.');
      S.visualBox.appendChild(cv);
      caja.appendChild(S.visualBox);
      S.canvas = cv;
      S.enunciado = el('div', 'quiz-pregunta');
      caja.appendChild(S.enunciado);
      S.widget = el('div', 'quiz-widget');
      caja.appendChild(S.widget);
      S.feedback = el('div');
      caja.appendChild(S.feedback);
      S.acciones = el('div', 'quiz-acciones');
      S.acciones.style.marginTop = '14px';
      caja.appendChild(S.acciones);
      container.appendChild(caja);

      pintaMarcas();
      nueva();
    },
    unmount: function () {
      if (S && S.plot) S.plot.destroy();
      S = null;
    },
  };

  function pintaMarcas() {
    if (!S) return;
    const st = NS.store ? NS.store.raw().metodos[S.ctx.method.id] : null;
    const p = st ? st.practica : { rachaActual: 0 };
    S.marcas.innerHTML =
      '<span>Sesión: <b>' + S.sesion.aciertos + '/' + S.sesion.total + '</b></span>' +
      '<span class="quiz-racha">🔥 racha ' + (p.rachaActual || 0) + '</span>' +
      (NS.store ? '<span>⭐ <b>' + NS.store.raw().puntos + '</b> puntos</span>' : '');
  }

  function nueva() {
    if (!S) return;
    S.feedback.innerHTML = '';
    S.acciones.innerHTML = '';
    S.widget.innerHTML = '';
    S.intentos = 0;
    S.resuelta = false;
    if (S.plot) { S.plot.destroy(); S.plot = null; }

    /* elige un generador distinto del anterior */
    let idx = U.randInt(0, S.banco.generadores.length - 1);
    if (S.banco.generadores.length > 1 && idx === S.ultimo) idx = (idx + 1) % S.banco.generadores.length;
    S.ultimo = idx;
    let q;
    try {
      q = S.banco.generadores[idx](U);
    } catch (e) {
      S.enunciado.textContent = 'Error generando la pregunta: ' + e.message;
      return;
    }
    S.q = q;

    NS.math.render(S.enunciado, q.enunciado);

    /* visual */
    if (q.traza && q.traza.steps.length) {
      S.visualBox.style.display = '';
      S.plot = new NS.Plot2D(S.canvas, { square: S.ctx.method.vista === 'cobweb' });
      S.plot.setFns(q.traza.fns);
      const prims = drawDe(q.traza, q.hastaPaso === undefined ? q.traza.steps.length - 1 : q.hastaPaso);
      const curvas = [];
      prims.forEach(function (p) { if (p.t === 'curve' && curvas.indexOf(p.fn) < 0) curvas.push(p.fn); });
      S.plot.staticPrims = curvas.map(function (fn) { return { t: 'curve', fn: fn }; });
      S.plot.autoscale(q.traza.plotHints, prims);
      S.plot._staticDirty = true;
      S.basePrims = prims;
      S.plot.render(prims);
    } else {
      S.visualBox.style.display = 'none';
      S.basePrims = null;
    }

    /* widget según tipo */
    if (q.tipo === 'choice') {
      S.instr.style.display = 'none';
      const ops = el('div', 'quiz-opciones');
      q.opciones.forEach(function (op, i) {
        const b = el('button', 'quiz-op');
        b.type = 'button';
        NS.math.render(b, op);
        b.addEventListener('click', function () { respondeChoice(i, b); });
        ops.appendChild(b);
      });
      S.widget.appendChild(ops);
    } else if (q.tipo === 'numeric') {
      S.instr.style.display = 'none';
      const fila = el('div', 'quiz-num');
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.inputMode = 'decimal';
      inp.placeholder = 'tu respuesta…';
      inp.spellcheck = false;
      const b = el('button', 'btn', 'Comprobar');
      b.type = 'button';
      fila.appendChild(inp);
      fila.appendChild(b);
      S.widget.appendChild(fila);
      const comprueba = function () {
        const v = parseFloat(String(inp.value).replace(',', '.').replace('−', '-'));
        if (!isFinite(v)) { NS.ui.toast('Escribe un número (usa punto decimal).', 'info'); return; }
        respondeNumeric(v, inp);
      };
      b.addEventListener('click', comprueba);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') comprueba(); });
      inp.focus();
    } else if (q.tipo === 'point-x') {
      S.instr.style.display = '';
      S.instr.textContent = '👆 Toca o haz clic sobre la gráfica en el punto que creas — también puedes enfocar la gráfica y usar flechas + Enter.';
      S.plot.on('tap', function (t) {
        if (S.resuelta || !S.q || S.q.tipo !== 'point-x') return;
        respondePointX(t.wx);
      });
    }
  }

  function registra(ok) {
    S.resuelta = ok || S.intentos >= 2;
    if (!S.resuelta) return null;
    S.sesion.total++;
    if (ok) S.sesion.aciertos++;
    let res = null;
    if (NS.store) {
      res = NS.store.practicaResultado(S.ctx.method.id, {
        tipo: S.q.tipo,
        ok: ok,
        primerIntento: ok && S.intentos === 1,
        pistaUsada: S.intentos > 1,
        tema: S.q.tema || null,
      });
    }
    pintaMarcas();
    botonSiguiente();
    return res;
  }

  function botonSiguiente() {
    S.acciones.innerHTML = '';
    const b = el('button', 'btn', 'Siguiente pregunta →');
    b.type = 'button';
    b.addEventListener('click', nueva);
    S.acciones.appendChild(b);
    b.focus();
  }

  function feedbackBien(extra) {
    const puntosTxt = extra && extra.puntos ? '  (+' + extra.puntos + ' ⭐' + (extra.racha > 1 ? ' · racha ' + extra.racha + ' 🔥' : '') + ')' : '';
    const f = el('div', 'quiz-feedback bien');
    NS.math.render(f, U.elegir(['✅ **¡Exacto!**', '✅ **¡Muy bien!**', '✅ **¡Eso es!**', '✅ **¡Clavado!**']) + puntosTxt + (S.q.solucion ? ' ' + S.q.solucion : ''));
    S.feedback.innerHTML = '';
    S.feedback.appendChild(f);
  }

  function feedbackMal() {
    S.feedback.innerHTML = '';
    if (S.intentos === 1 && S.q.pista) {
      const f = el('div', 'quiz-feedback pista');
      NS.math.render(f, '💡 **Pista:** ' + S.q.pista + '  — te queda un intento.');
      S.feedback.appendChild(f);
    } else {
      const f = el('div', 'quiz-feedback mal');
      NS.math.render(f, '❌ ' + (S.q.solucion ? '**Solución:** ' + S.q.solucion : 'No era eso.'));
      S.feedback.appendChild(f);
    }
  }

  function respondeChoice(i, btn) {
    if (S.resuelta) return;
    S.intentos++;
    const ok = i === S.q.correcta;
    if (ok) {
      btn.classList.add('bien');
      S.widget.querySelectorAll('.quiz-op').forEach(function (b) { b.disabled = true; });
      feedbackBien(registra(true));
    } else {
      btn.classList.add('mal');
      btn.disabled = true;
      feedbackMal();
      if (S.intentos >= 2) {
        const cor = S.widget.querySelectorAll('.quiz-op')[S.q.correcta];
        if (cor) cor.classList.add('bien');
        S.widget.querySelectorAll('.quiz-op').forEach(function (b) { b.disabled = true; });
        registra(false);
      }
    }
  }

  function respondeNumeric(v, inp) {
    if (S.resuelta) return;
    S.intentos++;
    const ok = Math.abs(v - S.q.respuesta) <= (S.q.tol || 1e-6);
    if (ok) {
      inp.disabled = true;
      feedbackBien(registra(true));
    } else {
      feedbackMal();
      if (S.intentos >= 2) {
        inp.disabled = true;
        registra(false);
      }
    }
  }

  function respondePointX(wx) {
    S.intentos++;
    const ok = Math.abs(wx - S.q.puntoX) <= S.q.tolX;
    const marca = { t: 'vline', id: 'guess' + S.intentos, x: wx, cls: 'guia' };
    const punto = { t: 'point', id: 'gp' + S.intentos, x: wx, y: 0, cls: ok ? 'raiz' : 'error', label: ok ? '¡sí!' : '✗' };
    let prims = S.basePrims.concat([marca, punto]);
    if (ok) {
      feedbackBien(registra(true));
    } else {
      feedbackMal();
      if (S.intentos >= 2) {
        prims = prims.concat([{ t: 'point', id: 'sol', x: S.q.puntoX, y: 0, cls: 'siguiente', label: 'aquí' }]);
        registra(false);
      }
    }
    S.plot.render(prims);
  }
})(globalThis.MNO = globalThis.MNO || {});
