/* MNO.views.method — pantalla de un método: cabecera, modos (Explorar /
   Practicar / Reto / Cuaderno), presets, formulario, visual (canvas y/o
   matriz), reproductor y panel de pasos, todos sincronizados por el player.
   Los modos Practicar y Reto se delegan en NS.modes.* (game/). */
(function (NS) {
  'use strict';

  NS.views = NS.views || {};
  NS.modes = NS.modes || {};

  const MODOS = [
    { id: 'explorar', nombre: 'Explorar' },
    { id: 'practicar', nombre: 'Practicar' },
    { id: 'reto', nombre: 'Reto' },
    { id: 'cuaderno', nombre: 'Cuaderno' },
  ];

  let S = null; /* estado de la pantalla montada */
  NS._S = function () { return S; };
  NS._debugMet = function () {
    return S && {
      metodo: S.method.id, modo: S.modoActivo,
      world: S.plot && S.plot.world,
      hints: S.trace && S.trace.plotHints,
      status: S.trace && S.trace.status,
      pasos: S.trace && S.trace.steps.length,
      pasoActual: S.player && S.player.i,
      canvasW: S.plot && S.plot.W,
      dyn: S.plot && S.plot.dynPrims.map(function (p) { return p.t + ':' + (p.id || '') + (p.drag ? '(drag ' + p.drag + ')' : ''); }),
    };
  };

  function el(tag, cls, html) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html !== undefined) d.innerHTML = html;
    return d;
  }

  /* ---------- montaje ---------- */
  NS.views.method = {
    mount: function (root, params) {
      const method = NS.registry[params.id];
      if (!method) { location.hash = '#/'; return; }
      const modo = params.modo || 'explorar';
      S = { method: method, modo: modo, root: root, tweenCancel: null, rerunTimer: 0 };

      const sec = el('section', 'pantalla met');
      sec.appendChild(buildHeader(method));
      sec.appendChild(buildModos(method, modo));
      const cuerpo = el('div', 'met-cuerpo');
      sec.appendChild(cuerpo);
      root.appendChild(sec);
      S.cuerpo = cuerpo;

      renderModo(modo);
      if (NS.store) NS.store.visita(method.id, modo);
    },
    unmount: function () {
      cleanupModo();
      S = null;
    },
  };

  function buildHeader(method) {
    const head = el('header', 'met-head');
    const back = el('a', 'btn-back', '←');
    back.href = '#/';
    back.setAttribute('aria-label', 'Volver al índice');
    head.appendChild(back);
    const glifo = el('span', 'met-glifo');
    head.appendChild(glifo);
    NS.glyphs.into(glifo, method.id, 46);
    const pos = NS.numeroDe(method.id);
    const tit = el('div', 'met-tit');
    tit.appendChild(el('p', 'eyebrow', pos.num ? pos.num + ' · ' + pos.familia : ''));
    tit.appendChild(el('h1', null, method.nombre));
    tit.appendChild(el('p', 'met-desc', method.desc));
    head.appendChild(tit);
    const bTeo = el('button', 'btn-teoria', 'Teoría');
    bTeo.type = 'button';
    bTeo.addEventListener('click', function () {
      if (NS.theory) NS.theory.open(method.id);
      else NS.ui.toast('La teoría de este método llega en breve.', 'info');
    });
    head.appendChild(bTeo);
    if (NS.tema) head.appendChild(NS.tema.boton());
    return head;
  }

  function buildModos(method, activo) {
    const nav = el('nav', 'modos');
    MODOS.forEach(function (m) {
      const b = el('button', 'modo-btn' + (m.id === activo ? ' activo' : ''), m.nombre);
      b.type = 'button';
      b.dataset.m = m.id;
      b.addEventListener('click', function () {
        if (S.modo === m.id) return;
        S.modo = m.id;
        nav.querySelectorAll('.modo-btn').forEach(function (x) { x.classList.toggle('activo', x.dataset.m === m.id); });
        const url = '#/m/' + method.id + (m.id !== 'explorar' ? '?modo=' + m.id : '');
        history.replaceState(null, '', url);
        renderModo(m.id);
        if (NS.store) NS.store.visita(method.id, m.id);
      });
      nav.appendChild(b);
    });
    return nav;
  }

  function cleanupModo() {
    if (!S) return;
    if (S.tweenCancel) { S.tweenCancel(); S.tweenCancel = null; }
    if (S.player) { S.player.destroy(); S.player = null; }
    if (S.plot) { S.plot.destroy(); S.plot = null; }
    if (S.ec) { S.ec.destroy(); S.ec = null; }
    if (S.keyHandler) { document.removeEventListener('keydown', S.keyHandler); S.keyHandler = null; }
    if (S.modoActivo && NS.modes[S.modoActivo] && NS.modes[S.modoActivo].unmount) {
      NS.modes[S.modoActivo].unmount();
    }
    S.modoActivo = null;
  }

  function renderModo(modo) {
    cleanupModo();
    S.cuerpo.innerHTML = '';
    S.modoActivo = modo;
    if (modo === 'explorar') renderExplorar();
    else if (modo === 'cuaderno') renderCuaderno();
    else if (NS.modes[modo] && NS.modes[modo].mount) {
      NS.modes[modo].mount(S.cuerpo, {
        method: S.method,
        runEngine: runEngine,
        parseValues: function (raw) { return NS.ui.parseValues(S.method, raw); },
      });
    } else {
      const card = el('div', 'placeholder-card',
        '<h2>' + (modo === 'practicar' ? 'Practicar' : 'Reto') + '</h2>' +
        '<p>Este modo se está terminando de preparar.</p>');
      S.cuerpo.appendChild(card);
    }
  }

  function runEngine(rawValues) {
    const parsed = NS.ui.parseValues(S.method, rawValues);
    return NS.engines[S.method.engine](parsed);
  }

  /* ---------- EXPLORAR ---------- */
  function renderExplorar() {
    const method = S.method;
    const conCanvas = method.vista !== 'matrix';
    const conMatrix = method.vista === 'matrix' || method.vista === 'linear-iter' || method.vista === 'interp';

    /* presets */
    const presets = el('div', 'presets');
    S.cuerpo.appendChild(presets);

    const grid = el('div', 'met-grid');
    const visual = el('div', 'met-visual');
    const lado = el('aside', 'met-lado');
    grid.appendChild(visual);
    grid.appendChild(lado);
    S.cuerpo.appendChild(grid);

    /* zona visual */
    let canvas = null, mvBox = null;
    if (conCanvas) {
      const cbox = el('div', 'canvas-box');
      canvas = document.createElement('canvas');
      canvas.className = 'met-canvas';
      canvas.setAttribute('aria-label', 'Gráfica interactiva de ' + method.nombre + '. Usa las flechas y Enter para explorar con teclado.');
      cbox.appendChild(canvas);
      const reenc = el('button', 'btn-reenc', '⌖');
      reenc.title = 'Reencuadrar';
      reenc.type = 'button';
      cbox.appendChild(reenc);
      visual.appendChild(cbox);
      reenc.addEventListener('click', function () { autoEncuadre(); pintarActual(); });
    }
    if (conMatrix) {
      mvBox = el('div', 'mv-box');
      visual.appendChild(mvBox);
    }
    const playerEl = el('div');
    visual.appendChild(playerEl);
    const resultado = el('div', 'resultado');
    visual.appendChild(resultado);
    const ecBox = el('details', 'ec-box');
    ecBox.innerHTML = '<summary>Convergencia — log₁₀ del error por iteración</summary>';
    const ecCanvas = document.createElement('canvas');
    ecCanvas.className = 'ec-canvas';
    ecBox.appendChild(ecCanvas);
    visual.appendChild(ecBox);

    /* lateral: parámetros + pasos */
    const paramsBox = el('div');
    lado.appendChild(paramsBox);
    const btnRun = el('button', 'btn btn-run', 'Ejecutar');
    btnRun.type = 'button';
    lado.appendChild(btnRun);
    const stepsBox = el('div');
    lado.appendChild(stepsBox);

    /* instancias */
    S.plot = canvas ? new NS.Plot2D(canvas, { square: method.vista === 'cobweb' }) : null;
    S.mv = mvBox ? new NS.MatrixView(mvBox) : null;
    S.player = new NS.StepPlayer(playerEl);
    S.panel = new NS.StepPanel(stepsBox);
    S.ec = new NS.ErrorChart(ecCanvas);
    S.resultado = resultado;
    S.prevDrawn = null;

    const guardado = NS.store ? NS.store.ultimosParams(method.id) : null;
    S.form = NS.ui.buildForm(paramsBox, method, guardado, function () { rerun(false); });
    NS.ui.presetBar(presets, method, function (pr) {
      S.form.setValues(Object.assign({}, valoresPorDefecto(method), pr.v), true);
      rerun(true);
    });

    btnRun.addEventListener('click', function () { rerun(true); });

    S.panel.onSeek = function (i) { S.player.pause(); S.player.seek(i); };

    S.player.on('step', onStep);

    /* interacción de arrastre en el canvas */
    if (S.plot) {
      S.plot.on('drag', function (d) {
        const tag = d.prim.drag;
        if (!tag) return;
        if (tag.indexOf('node:') === 0) {
          const idx = +tag.slice(5);
          const nodes = NS.num.P(S.form.getValues().nodes);
          const values = NS.num.P(S.form.getValues().values);
          if (idx < nodes.length) {
            nodes[idx] = NS.num.R(d.wx, 3);
            values[idx] = NS.num.R(d.wy, 3);
            S.form.setValue('nodes', nodes.join(' '), true);
            S.form.setValue('values', values.join(' '), true);
          }
        } else {
          S.form.setValue(tag, String(NS.num.R(d.wx, 4)), true);
        }
        programarRerun();
      });
      S.plot.on('dragend', function () { rerun(false, true); });
    }

    /* teclado global del modo Explorar */
    S.keyHandler = function (e) {
      if (!S || S.modoActivo !== 'explorar') return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight') { S.player.next(); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { S.player.prev(); e.preventDefault(); }
      else if (e.key === ' ') { S.player.toggle(); e.preventDefault(); }
    };
    document.addEventListener('keydown', S.keyHandler);

    rerun(true);
  }

  function valoresPorDefecto(method) {
    const out = {};
    method.params.forEach(function (p) { out[p.id] = p.def; });
    return out;
  }

  function programarRerun() {
    clearTimeout(S.rerunTimer);
    S.rerunTimer = setTimeout(function () { rerun(false, true); }, 130);
  }

  /* Ejecuta el motor y recarga toda la vista. */
  function rerun(autoplay, conservarEncuadre) {
    if (!S || !S.form) return;
    const raw = S.form.getValues();
    let trace;
    try {
      trace = runEngine(raw);
    } catch (e) {
      NS.ui.toast('Error: ' + e.message, 'error');
      return;
    }
    S.trace = trace;
    decorarDrag(trace);
    if (NS.store) NS.store.guardaParams(S.method.id, raw);

    if (S.plot) {
      S.plot.setFns(trace.fns);
      if (!conservarEncuadre) autoEncuadre();
    }
    S.panel.load(trace);
    S.player.load(trace, { autoplay: autoplay && trace.steps.length > 1 && trace.status !== 'error' });
    pintarResultado(trace);
    pintarError(trace);
    if (NS.store && trace.status === 'converged') NS.store.ejecucion(S.method.id, trace);
  }

  function autoEncuadre() {
    if (!S.plot || !S.trace) return;
    /* encuadre estable: cubre las primitivas de TODOS los pasos */
    const todas = [];
    S.trace.steps.forEach(function (st) { (st.draw || []).forEach(function (p) { todas.push(p); }); });
    const curvas = [];
    todas.forEach(function (p) { if (p.t === 'curve' && curvas.indexOf(p.fn) < 0) curvas.push(p.fn); });
    S.plot.staticPrims = curvas.map(function (fn) { return { t: 'curve', fn: fn }; });
    S.plot.autoscale(S.trace.plotHints, todas);
    S.plot._staticDirty = true;
  }

  function decorarDrag(trace) {
    const method = S.method;
    trace.steps.forEach(function (st) {
      (st.draw || []).forEach(function (p) {
        if (p.t !== 'point') return;
        if (method.drag && method.drag[p.id]) p.drag = method.drag[p.id];
        else if (method.dragNodes && /^n\d+$/.test(p.id || '')) p.drag = 'node:' + p.id.slice(1);
      });
    });
  }

  function drawDe(i) {
    /* primitivas del paso i, o las del último paso anterior que dibuje */
    for (let j = i; j >= 0; j--) {
      if (S.trace.steps[j].draw) return S.trace.steps[j].draw;
    }
    return null;
  }

  function pintarActual() {
    if (!S.player || !S.trace) return;
    const d = drawDe(S.player.i);
    if (S.plot && d) { S.plot.render(d); S.prevDrawn = d; }
  }

  function onStep(ev) {
    if (!S) return;
    S.panel.setActive(ev.i);
    const step = ev.step;
    if (S.plot) {
      const cur = drawDe(ev.i);
      if (cur) {
        if (S.tweenCancel) { S.tweenCancel(); S.tweenCancel = null; }
        const prev = S.prevDrawn;
        if (ev.animate && prev && prev !== cur && ev.durMs > 60) {
          S.tweenCancel = NS.anim.tween(ev.durMs, function (t) {
            S.plot.render(NS.anim.lerpPrims(prev, cur, t));
          }, function () { S.plot.render(cur); S.tweenCancel = null; });
        } else {
          S.plot.render(cur);
        }
        S.prevDrawn = cur;
      }
    }
    if (S.mv) {
      const tieneMv = step.M || step.tabla || step.xNew || step.dd || (step.L && step.U);
      S.mv.el.style.display = tieneMv ? '' : (S.method.vista === 'matrix' ? '' : 'none');
      if (tieneMv) S.mv.render(step, S.trace);
    }
    if (S.ec) S.ec.setCursor(step.k || null);
  }

  function pintarResultado(trace) {
    const r = S.resultado;
    r.className = 'resultado ' + (trace.status === 'converged' ? 'res-ok' : (trace.status === 'error' ? 'res-error' : 'res-warn'));
    let msg = '';
    const res = trace.result;
    if (trace.status === 'error') {
      msg = '**No se pudo ejecutar.** ' + (trace.statusMsg || '');
    } else if (trace.status === 'diverged') {
      msg = '**Diverge.** ' + (trace.statusMsg || '');
    } else if (trace.status === 'maxIter') {
      msg = 'Sin convergencia: se agotó el máximo de iteraciones.';
    } else if (res) {
      if (trace.family === 'rootfinding') {
        msg = 'Converge: **raíz ≈ ' + NS.num.fmt(res.root, 8) + '** en ' + res.iters + ' iteraciones.';
      } else if (trace.method === 'gauss') {
        msg = '**X = [' + res.X.map(function (v) { return NS.num.fmt(v, 5); }).join(', ') + ']** · det(A) = ' + NS.num.fmt(res.det, 5);
      } else if (trace.family === 'linear') {
        msg = 'Converge: **X ≈ [' + res.X.map(function (v) { return NS.num.fmt(v, 5); }).join(', ') + ']** en ' + res.iters + ' iteraciones.';
      } else if (trace.family === 'interp') {
        msg = res.evals && res.evals.length
          ? res.evals.map(function (e) { return '**P(' + NS.num.fmt(e.x) + ') = ' + NS.num.fmt(e.y, 8) + '**'; }).join(' · ')
          : 'Polinomio construido.';
      }
    }
    NS.math.render(r, msg);
  }

  function pintarError(trace) {
    const box = S.cuerpo.querySelector('.ec-box');
    if (!trace.errorSeries || trace.errorSeries.length < 2) {
      box.style.display = 'none';
      return;
    }
    box.style.display = '';
    S.ec.setSeries([{
      label: S.method.nombre,
      color: '#00cec9',
      data: trace.errorSeries,
    }]);
  }

  /* ---------- CUADERNO (el paso a paso clásico, completo) ---------- */
  function renderCuaderno() {
    const method = S.method;
    const presets = el('div', 'presets');
    S.cuerpo.appendChild(presets);
    const wrap = el('div', 'cuaderno');
    const paramsBox = el('div');
    wrap.appendChild(paramsBox);
    const btnRun = el('button', 'btn btn-run', 'Resolver paso a paso');
    btnRun.type = 'button';
    wrap.appendChild(btnRun);
    const resultado = el('div', 'resultado');
    wrap.appendChild(resultado);
    const stepsBox = el('div');
    wrap.appendChild(stepsBox);
    S.cuerpo.appendChild(wrap);

    S.resultado = resultado;
    S.panel = new NS.StepPanel(stepsBox);
    const guardado = NS.store ? NS.store.ultimosParams(method.id) : null;
    S.form = NS.ui.buildForm(paramsBox, method, guardado, null);
    NS.ui.presetBar(presets, method, function (pr) {
      S.form.setValues(Object.assign({}, valoresPorDefecto(method), pr.v), true);
      correr();
    });
    function correr() {
      const trace = runEngine(S.form.getValues());
      S.trace = trace;
      S.panel.load(trace);
      /* en el cuaderno se muestra todo desplegado */
      for (let i = 0; i < trace.steps.length; i++) S.panel._renderBody(i);
      S.panel.el.classList.add('steps-cuaderno');
      pintarResultado(trace);
      if (NS.store) NS.store.guardaParams(method.id, S.form.getValues());
    }
    btnRun.addEventListener('click', correr);
    correr();
  }
})(globalThis.MNO = globalThis.MNO || {});
