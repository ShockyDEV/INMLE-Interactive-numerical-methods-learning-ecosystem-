/* MNO.modes.reto — retos con puntuación y estrellas (★★★ ≥90 · ★★ ≥60 · ★ >0).
   Los packs de contenido definen:
     NS.content.challenges[metodoId] = [reto, ...]
   Tres arquetipos:
   · tipo 'param-goal': lograr un objetivo eligiendo parámetros libres.
       {id, nombre, icono, desc, enunciado, libres:['x0'], fijos:{f:'…'},
        intentosMax:3, evalua(trace,U)→{puntos,msg}, plot:true}
   · tipo 'apuesta': predecir cuál de varios candidatos gana; luego se corren todos.
       {…, pregunta, candidatos:[{label, params}], gana(traces)→idx | 'menos-iteraciones',
        puntosAcierto:100, puntosFallo:25, columnas?:['iteraciones']}
   · tipo 'quiz-serie': n preguntas (generadores estilo Practicar); 100 base,
        −20 por pregunta fallada, −10 por pista usada.
       {…, n:5, generadores:[fn(U)→pregunta]} */
(function (NS) {
  'use strict';

  NS.modes = NS.modes || {};

  const U = {
    rand: function (a, b) { return a + Math.random() * (b - a); },
    randInt: function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    elegir: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  };

  let S = null;

  function el(tag, cls, html) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html !== undefined) d.innerHTML = html;
    return d;
  }

  function estrellasDe(p) { return p >= 90 ? 3 : (p >= 60 ? 2 : (p > 0 ? 1 : 0)); }
  function estrellasTxt(n) { return '★★★'.slice(0, n) + '<span style="opacity:0.25">' + '★★★'.slice(n) + '</span>'; }

  NS.modes.reto = {
    mount: function (container, ctx) {
      const defs = NS.content.challenges[ctx.method.id];
      if (!defs || !defs.length) {
        container.appendChild(el('div', 'placeholder-card',
          '<h2>🏆 Reto</h2><p>Los retos de este método se están diseñando…</p>'));
        return;
      }
      S = { ctx: ctx, defs: defs, plot: null };
      S.root = el('div');
      container.appendChild(S.root);
      lista();
    },
    unmount: function () {
      if (S && S.plot) S.plot.destroy();
      S = null;
    },
  };

  /* ---------- lista de retos ---------- */
  function lista() {
    if (S.plot) { S.plot.destroy(); S.plot = null; }
    S.root.innerHTML = '';
    const st = NS.store ? NS.store.raw().metodos[S.ctx.method.id] : null;
    const grid = el('div', 'reto-lista');
    S.defs.forEach(function (def) {
      const prev = st && st.retos[def.id];
      const card = el('div', 'reto-item');
      card.setAttribute('role', 'button');
      card.tabIndex = 0;
      card.appendChild(el('h3', null, (def.icono || '🏆') + ' ' + def.nombre));
      card.appendChild(el('p', null, def.desc || ''));
      card.appendChild(el('div', 'reto-mejor', prev
        ? estrellasTxt(prev.estrellas) + ' · mejor: ' + prev.mejor + ' pts'
        : estrellasTxt(0) + ' · sin intentos'));
      const abre = function () { juega(def); };
      card.addEventListener('click', abre);
      card.addEventListener('keydown', function (e) { if (e.key === 'Enter') abre(); });
      grid.appendChild(card);
    });
    S.root.appendChild(grid);
  }

  function cabecera(def, onVolver) {
    const head = el('div', 'reto-head');
    const izq = el('div');
    izq.appendChild(el('h3', null, (def.icono || '🏆') + ' ' + def.nombre));
    head.appendChild(izq);
    S.marcador = el('div', 'reto-puntos', '');
    head.appendChild(S.marcador);
    const volver = el('button', 'btn btn-suave', '← Retos');
    volver.type = 'button';
    volver.addEventListener('click', onVolver);
    head.appendChild(volver);
    return head;
  }

  function termina(def, puntos, detalle) {
    const est = estrellasDe(puntos);
    if (NS.store) NS.store.retoResultado(S.ctx.method.id, def.id, puntos, est);
    const fin = el('div', 'reto-carta reto-fin');
    fin.appendChild(el('div', 'reto-estrellas', estrellasTxt(est)));
    const msg = el('div');
    NS.math.render(msg, '**' + puntos + ' puntos.** ' + (detalle || ''));
    fin.appendChild(msg);
    const otra = el('button', 'btn', '↻ Intentar de nuevo');
    otra.type = 'button';
    otra.style.marginTop = '12px';
    otra.addEventListener('click', function () { juega(def); });
    fin.appendChild(otra);
    /* la tarjeta final se antepone: lo jugado (tabla, gráfica) queda debajo */
    S.zona.querySelectorAll('button').forEach(function (b) { if (b !== otra) b.disabled = true; });
    S.zona.prepend(fin);
    fin.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function juega(def) {
    S.root.innerHTML = '';
    S.root.appendChild(cabecera(def, lista));
    S.zona = el('div');
    S.root.appendChild(S.zona);
    if (def.tipo === 'param-goal') juegaParamGoal(def);
    else if (def.tipo === 'apuesta') juegaApuesta(def);
    else if (def.tipo === 'quiz-serie') juegaSerie(def);
    else S.zona.appendChild(el('div', 'placeholder-card', '<p>Tipo de reto desconocido.</p>'));
  }

  /* ---------- param-goal ---------- */
  function juegaParamGoal(def) {
    const method = S.ctx.method;
    let intentos = 0, mejor = 0, mejorMsg = '';
    S.marcador.textContent = 'intento 0/' + (def.intentosMax || 3);

    const carta = el('div', 'reto-carta');
    const enun = el('div', 'quiz-pregunta');
    NS.math.render(enun, def.enunciado);
    carta.appendChild(enun);

    /* formulario solo con los parámetros libres */
    const formBox = el('div', 'params-form');
    const inputs = {};
    method.params.forEach(function (p) {
      if ((def.libres || []).indexOf(p.id) < 0) return;
      const f = el('div', 'field field-corto');
      f.appendChild(el('label', null, p.label));
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.spellcheck = false;
      inp.value = (def.inicial && def.inicial[p.id] !== undefined) ? def.inicial[p.id] : p.def;
      f.appendChild(inp);
      inputs[p.id] = inp;
      formBox.appendChild(f);
    });
    carta.appendChild(formBox);

    const btn = el('button', 'btn btn-run', '🚀 PROBAR');
    btn.type = 'button';
    carta.appendChild(btn);
    const resultado = el('div', 'resultado');
    carta.appendChild(resultado);

    let canvas = null;
    if (def.plot !== false && method.vista !== 'matrix') {
      const cbox = el('div', 'canvas-box');
      cbox.style.marginTop = '12px';
      canvas = document.createElement('canvas');
      canvas.className = 'met-canvas';
      cbox.appendChild(canvas);
      carta.appendChild(cbox);
    }
    S.zona.innerHTML = '';
    S.zona.appendChild(carta);

    btn.addEventListener('click', function () {
      if (intentos >= (def.intentosMax || 3)) return;
      intentos++;
      S.marcador.textContent = 'intento ' + intentos + '/' + (def.intentosMax || 3);
      /* mezcla fijos + libres */
      let raw = {};
      method.params.forEach(function (p) {
        if (inputs[p.id]) raw[p.id] = inputs[p.id].value;
        else if (def.fijos && def.fijos[p.id] !== undefined) raw[p.id] = def.fijos[p.id];
        else raw[p.id] = p.def;
      });
      /* gancho para derivar parámetros (p. ej. valores = f(nodos) en Runge) */
      if (def.prepara) raw = def.prepara(raw) || raw;
      let trace;
      try {
        trace = S.ctx.runEngine(raw);
      } catch (e) {
        NS.ui.toast('Error: ' + e.message, 'error');
        intentos--;
        return;
      }
      /* dibuja el último paso */
      if (canvas) {
        if (S.plot) S.plot.destroy();
        S.plot = new NS.Plot2D(canvas, { square: method.vista === 'cobweb' });
        S.plot.setFns(trace.fns);
        const prims = [];
        trace.steps.forEach(function (st) { (st.draw || []).forEach(function (p) { prims.push(p); }); });
        let last = null;
        for (let j = trace.steps.length - 1; j >= 0; j--) if (trace.steps[j].draw) { last = trace.steps[j].draw; break; }
        const curvas = [];
        prims.forEach(function (p) { if (p.t === 'curve' && curvas.indexOf(p.fn) < 0) curvas.push(p.fn); });
        S.plot.staticPrims = curvas.map(function (fn) { return { t: 'curve', fn: fn }; });
        S.plot.autoscale(trace.plotHints, prims);
        S.plot._staticDirty = true;
        S.plot.render(last || []);
      }
      const ev = def.evalua(trace, U);
      if (ev.puntos > mejor) { mejor = ev.puntos; mejorMsg = ev.msg || ''; }
      resultado.className = 'resultado ' + (ev.puntos >= 60 ? 'res-ok' : (ev.puntos > 0 ? 'res-warn' : 'res-error'));
      NS.math.render(resultado, ev.msg + '  →  **' + ev.puntos + ' pts** (mejor: ' + mejor + ')');
      if (intentos >= (def.intentosMax || 3) || ev.puntos >= 100) {
        setTimeout(function () { termina(def, mejor, mejorMsg); }, 1400);
      }
    });
  }

  /* ---------- apuesta ---------- */
  function juegaApuesta(def) {
    S.marcador.textContent = '';
    const carta = el('div', 'reto-carta');
    const enun = el('div', 'quiz-pregunta');
    NS.math.render(enun, def.pregunta);
    carta.appendChild(enun);
    const ops = el('div', 'quiz-opciones');
    def.candidatos.forEach(function (c, i) {
      const b = el('button', 'quiz-op');
      b.type = 'button';
      NS.math.render(b, c.label);
      b.addEventListener('click', function () { resuelve(i); });
      ops.appendChild(b);
    });
    carta.appendChild(ops);
    S.zona.innerHTML = '';
    S.zona.appendChild(carta);

    function resuelve(idx) {
      ops.querySelectorAll('.quiz-op').forEach(function (b) { b.disabled = true; });
      /* corre todos los candidatos */
      const traces = def.candidatos.map(function (c) {
        const raw = {};
        S.ctx.method.params.forEach(function (p) {
          raw[p.id] = c.params[p.id] !== undefined ? c.params[p.id] : p.def;
        });
        try { return S.ctx.runEngine(raw); } catch (e) { return null; }
      });
      let ganador;
      if (typeof def.gana === 'function') ganador = def.gana(traces);
      else {
        /* menos iteraciones entre los que convergen */
        ganador = -1;
        let best = Infinity;
        traces.forEach(function (t, i) {
          if (t && t.status === 'converged' && t.result.iters < best) { best = t.result.iters; ganador = i; }
        });
      }
      /* tabla de resultados */
      const tabla = el('div', 'reto-carta');
      def.candidatos.forEach(function (c, i) {
        const t = traces[i];
        const fila = el('div', 'dash-fila');
        fila.appendChild(el('span', 'nombre', c.label.replace(/\$/g, '')));
        const txt = !t ? 'error' :
          t.status === 'converged' ? '✅ converge en ' + t.result.iters + ' iteraciones' :
            t.status === 'diverged' ? '💥 diverge' : '⏳ no converge (' + t.status + ')';
        fila.appendChild(el('span', null, txt + (i === ganador ? '  🏆' : '')));
        tabla.appendChild(fila);
      });
      S.zona.appendChild(tabla);
      const ok = idx === ganador;
      const puntos = ok ? (def.puntosAcierto || 100) : (def.puntosFallo || 25);
      setTimeout(function () {
        termina(def, puntos, ok ? '¡Apuesta ganadora! ' + (def.moraleja || '') : 'El ganador era otro. ' + (def.moraleja || ''));
      }, 1800);
    }
  }

  /* ---------- quiz-serie ---------- */
  function juegaSerie(def) {
    let i = 0, puntos = 100, fallos = 0;
    const n = def.n || def.generadores.length;
    avanza();

    function avanza() {
      if (i >= n) { termina(def, Math.max(0, puntos), fallos + ' fallos de ' + n + ' preguntas.'); return; }
      S.marcador.textContent = 'pregunta ' + (i + 1) + '/' + n + ' · ' + Math.max(0, puntos) + ' pts';
      const gen = def.generadores[i % def.generadores.length];
      let q;
      try { q = gen(U); } catch (e) { i++; avanza(); return; }
      pintaPregunta(q, function (resultado) {
        if (!resultado.ok) { puntos -= 20; fallos++; }
        else if (resultado.conPista) puntos -= 10;
        i++;
        setTimeout(avanza, 1100);
      });
    }

    function pintaPregunta(q, onFin) {
      const carta = el('div', 'reto-carta');
      const enun = el('div', 'quiz-pregunta');
      NS.math.render(enun, q.enunciado);
      carta.appendChild(enun);
      const fb = el('div');
      let intentos = 0;

      if (q.tipo === 'numeric') {
        const fila = el('div', 'quiz-num');
        const inp = document.createElement('input');
        inp.type = 'text'; inp.inputMode = 'decimal'; inp.spellcheck = false;
        const b = el('button', 'btn', 'Comprobar');
        b.type = 'button';
        fila.appendChild(inp); fila.appendChild(b);
        carta.appendChild(fila);
        carta.appendChild(fb);
        const check = function () {
          const v = parseFloat(String(inp.value).replace(',', '.').replace('−', '-'));
          if (!isFinite(v)) return;
          intentos++;
          const ok = Math.abs(v - q.respuesta) <= (q.tol || 1e-6);
          muestra(ok, inp);
        };
        b.addEventListener('click', check);
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
        inp.focus();
      } else {
        const ops = el('div', 'quiz-opciones');
        (q.opciones || []).forEach(function (op, oi) {
          const b = el('button', 'quiz-op');
          b.type = 'button';
          NS.math.render(b, op);
          b.addEventListener('click', function () {
            intentos++;
            const ok = oi === q.correcta;
            b.classList.add(ok ? 'bien' : 'mal');
            if (!ok) b.disabled = true;
            muestra(ok, null, ops);
          });
          ops.appendChild(b);
        });
        carta.appendChild(ops);
        carta.appendChild(fb);
      }
      S.zona.innerHTML = '';
      S.zona.appendChild(carta);

      function muestra(ok, inp, ops) {
        fb.innerHTML = '';
        if (ok) {
          const f = el('div', 'quiz-feedback bien');
          NS.math.render(f, '✅ **¡Bien!**' + (intentos > 1 ? ' (con pista: −10)' : ''));
          fb.appendChild(f);
          if (inp) inp.disabled = true;
          if (ops) ops.querySelectorAll('.quiz-op').forEach(function (b) { b.disabled = true; });
          onFin({ ok: true, conPista: intentos > 1 });
        } else if (intentos === 1 && q.pista) {
          const f = el('div', 'quiz-feedback pista');
          NS.math.render(f, '💡 ' + q.pista);
          fb.appendChild(f);
        } else {
          const f = el('div', 'quiz-feedback mal');
          NS.math.render(f, '❌ ' + (q.solucion || ''));
          fb.appendChild(f);
          if (inp) inp.disabled = true;
          if (ops) ops.querySelectorAll('.quiz-op').forEach(function (b) { b.disabled = true; });
          onFin({ ok: false });
        }
      }
    }
  }
})(globalThis.MNO = globalThis.MNO || {});
