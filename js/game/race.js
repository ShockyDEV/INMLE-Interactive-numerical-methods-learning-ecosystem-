/* MNO.views.race — Carrera de métodos.
   Cuatro corredores (Bisección, Cuerda, Newton, Secante) contra la misma
   f(x). Fase de APUESTA (predice el ganador), carrera animada por carriles,
   gráfico log₁₀|error| en vivo (las pendientes SON los órdenes de
   convergencia) y podio con doble criterio: iteraciones o evaluaciones de f. */
(function (NS) {
  'use strict';

  NS.views = NS.views || {};

  const CORREDORES = [
    { id: 'biseccion', nombre: 'Bisección' },
    { id: 'cuerda', nombre: 'Cuerda' },
    { id: 'newton', nombre: 'Newton' },
    { id: 'secante', nombre: 'Secante' },
  ];
  function colorDe(i) { return NS.plotPalette().serie[i % 4]; }
  function puntoHTML(color) {
    return '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + color + ';margin-right:8px;vertical-align:baseline"></span>';
  }

  /* Evaluaciones de f por corredor: iniciales + por iteración.
     Newton cuesta 2 por iteración (f y f'). */
  const COSTE = {
    biseccion: function (n) { return 2 + n; },
    cuerda: function (n) { return 2 + n; },
    newton: function (n) { return 2 * n; },
    secante: function (n) { return 2 + n; },
  };

  const PRESETS = [
    { nombre: 'x³ − x − 2', f: 'x^3 - x - 2', df: '3x^2 - 1', a: 1, b: 2 },
    { nombre: 'cos(x) = x', f: 'cos(x) - x', df: '-sin(x) - 1', a: 0, b: 1 },
    { nombre: 'eˣ = 3', f: 'exp(x) - 3', df: 'exp(x)', a: 0, b: 2 },
    { nombre: 'x⁵ = 7', f: 'x^5 - 7', df: '5x^4', a: 1, b: 2 },
    { nombre: 'x·eˣ = 1', f: 'x*exp(x) - 1', df: 'exp(x)*(1 + x)', a: 0, b: 1 },
  ];

  const TOL = 1e-10, MAXIT = 60;
  let S = null;

  function el(tag, cls, html) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html !== undefined) d.innerHTML = html;
    return d;
  }

  NS.views.race = {
    mount: function (root) {
      S = { timer: 0, ec: null };
      const sec = el('section', 'pantalla met');
      const head = el('header', 'met-head');
      const back = el('a', 'btn-back', '←');
      back.href = '#/';
      head.appendChild(back);
      const tit = el('div', 'met-tit');
      tit.appendChild(el('p', 'eyebrow', 'Comparativa'));
      tit.appendChild(el('h1', null, 'Carrera de métodos'));
      tit.appendChild(el('p', 'met-desc', 'Cuatro métodos, la misma raíz. Apuesta, mira la carrera y lee los órdenes de convergencia en las pendientes.'));
      head.appendChild(tit);
      if (NS.tema) head.appendChild(NS.tema.boton());
      sec.appendChild(head);
      S.zona = el('div');
      sec.appendChild(S.zona);
      root.appendChild(sec);
      setup();
    },
    unmount: function () {
      if (S) {
        if (S.timer) clearInterval(S.timer);
        if (S.ec) S.ec.destroy();
      }
      S = null;
    },
  };

  /* ---------- 1 · configuración ---------- */
  function setup() {
    S.zona.innerHTML = '';
    const caja = el('div', 'reto-carta race-setup');
    caja.appendChild(el('h3', null, '1 · Elige la función'));
    const chips = el('div', 'race-corredores');
    PRESETS.forEach(function (p, i) {
      const c = el('button', 'chip' + (i === 0 ? ' activo' : ''), p.nombre);
      c.type = 'button';
      c.addEventListener('click', function () {
        chips.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('activo'); });
        c.classList.add('activo');
        pon(p);
      });
      chips.appendChild(c);
    });
    caja.appendChild(chips);

    const form = el('div', 'params-form');
    const campos = {};
    [['f', 'f(x)', PRESETS[0].f], ['df', "f'(x) — para Newton", PRESETS[0].df], ['a', 'a (y x₀)', String(PRESETS[0].a)], ['b', 'b (y x₁)', String(PRESETS[0].b)]].forEach(function (par) {
      const f = el('div', 'field' + (par[0] === 'a' || par[0] === 'b' ? ' field-corto' : ''));
      f.appendChild(el('label', null, par[1]));
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.spellcheck = false;
      inp.value = par[2];
      campos[par[0]] = inp;
      f.appendChild(inp);
      form.appendChild(f);
    });
    caja.appendChild(form);
    function pon(p) {
      campos.f.value = p.f;
      campos.df.value = p.df;
      campos.a.value = String(p.a);
      campos.b.value = String(p.b);
    }

    caja.appendChild(el('h3', null, '2 · Haz tu apuesta: ¿quién converge en MENOS iteraciones? (tol 10⁻¹⁰)'));
    const ops = el('div', 'quiz-opciones');
    CORREDORES.forEach(function (c, ci) {
      const b = el('button', 'quiz-op', puntoHTML(colorDe(ci)) + c.nombre);
      b.type = 'button';
      b.addEventListener('click', function () {
        const conf = {
          f: campos.f.value, df: campos.df.value,
          a: +campos.a.value, b: +campos.b.value,
        };
        const chk = NS.expr.tryCompile(conf.f, ['x']);
        if (!chk.ok) { NS.ui.toast('f(x): ' + chk.error, 'error'); return; }
        const chk2 = NS.expr.tryCompile(conf.df, ['x']);
        if (!chk2.ok) { NS.ui.toast("f'(x): " + chk2.error, 'error'); return; }
        corre(conf, c.id);
      });
      ops.appendChild(b);
    });
    caja.appendChild(ops);
    S.zona.appendChild(caja);
  }

  /* ---------- 2 · carrera ---------- */
  function corre(conf, apuesta) {
    /* corre los 4 motores */
    const res = {};
    res.biseccion = NS.engines.biseccion({ f: conf.f, a: conf.a, b: conf.b, tol: TOL, maxIter: MAXIT });
    res.cuerda = NS.engines.cuerda({ f: conf.f, a: conf.a, b: conf.b, tol: TOL, maxIter: MAXIT });
    res.newton = NS.engines.newton({ f: conf.f, df: conf.df, x0: conf.a, tol: TOL, maxIter: MAXIT });
    res.secante = NS.engines.secante({ f: conf.f, x0: conf.a, x1: conf.b, tol: TOL, maxIter: MAXIT });

    /* raíz de referencia: la mejor estimación convergida */
    let rootRef = null;
    ['newton', 'secante', 'cuerda', 'biseccion'].forEach(function (k) {
      if (rootRef === null && res[k].status === 'converged') rootRef = res[k].result.root;
    });
    if (rootRef === null) {
      NS.ui.toast('Ningún método converge con esos datos (¿hay cambio de signo en [a, b]?). Prueba otro intervalo.', 'error', 5000);
      return;
    }

    /* series de error real |estimación − raíz| por iteración */
    const series = CORREDORES.map(function (c, ci) {
      const tr = res[c.id];
      const data = [];
      tr.steps.forEach(function (s) {
        if (s.type === 'iter' && typeof s.estimate === 'number' && isFinite(s.estimate)) {
          data.push({ k: s.k, err: Math.max(1e-16, Math.abs(s.estimate - rootRef)) });
        }
      });
      return {
        id: c.id, label: c.nombre, color: colorDe(ci), data: data,
        estado: tr.status, iters: tr.status === 'converged' ? tr.result.iters : Infinity,
      };
    });
    const maxK = Math.max.apply(null, series.map(function (s) { return s.data.length; }));

    /* UI de la carrera */
    S.zona.innerHTML = '';
    const caja = el('div', 'reto-carta');
    caja.appendChild(el('h3', null, 'Carrera en marcha — f(x) = ' + conf.f));
    const carriles = el('div', 'race-carriles');
    const runners = {};
    series.forEach(function (s) {
      const carril = el('div', 'race-carril');
      carril.appendChild(el('span', 'nombre', puntoHTML(s.color) + s.label));
      const pista = el('div', 'race-pista');
      const runner = el('span', 'race-corredor');
      runner.style.background = s.color;
      runner.style.left = '0%';
      pista.appendChild(runner);
      carril.appendChild(pista);
      const info = el('span', 'race-meta-info', '—');
      carril.appendChild(info);
      carriles.appendChild(carril);
      runners[s.id] = { runner: runner, info: info, serie: s };
    });
    caja.appendChild(carriles);

    const ecBox = el('div', 'ec-box');
    ecBox.style.marginTop = '14px';
    ecBox.appendChild(el('div', null, '<div style="padding:10px 14px;font-size:12px;color:var(--tinta2);font-weight:600;text-transform:uppercase;letter-spacing:0.06em">log₁₀ |xₖ − α| — recta = orden 1 · despeñada = orden 2</div>'));
    const ecCanvas = document.createElement('canvas');
    ecCanvas.className = 'ec-canvas';
    ecCanvas.style.height = '260px';
    ecBox.appendChild(ecCanvas);
    caja.appendChild(ecBox);
    S.zona.appendChild(caja);
    S.ec = new NS.ErrorChart(ecCanvas);

    /* animación por ticks de iteración */
    let k = 0;
    S.timer = setInterval(function () {
      k++;
      S.ec.setSeries(series.map(function (s) {
        return { label: s.label, color: s.color, data: s.data.slice(0, k) };
      }));
      S.ec.setCursor(k);
      series.forEach(function (s) {
        const r = runners[s.id];
        const total = isFinite(s.iters) ? s.iters : maxK;
        const pos = Math.min(1, k / Math.max(1, total));
        r.runner.style.left = (pos * 100) + '%';
        if (isFinite(s.iters) && k >= s.iters) {
          r.runner.classList.add('meta');
          r.info.textContent = s.iters + ' iteraciones · meta';
        } else if (k >= s.data.length && !isFinite(s.iters)) {
          r.runner.classList.add('fuera');
          r.info.textContent = s.estado === 'diverged' ? 'diverge' : 'no alcanza la tolerancia';
        } else if (k <= s.data.length) {
          const err = s.data[Math.min(k, s.data.length) - 1];
          r.info.textContent = 'iter ' + Math.min(k, s.data.length) + ' · err ' + (err ? err.err.toExponential(1) : '—');
        }
      });
      if (k >= maxK + 1) {
        clearInterval(S.timer);
        S.timer = 0;
        setTimeout(function () { podio(series, apuesta, conf); }, 600);
      }
    }, 520);
  }

  /* ---------- 3 · podio ---------- */
  function podio(series, apuesta, conf) {
    const porIters = series.slice().sort(function (a, b) { return a.iters - b.iters; });
    const ganador = porIters[0];
    const acierto = ganador.id === apuesta && isFinite(ganador.iters);
    if (NS.store) NS.store.carreraCorrida(acierto);

    const caja = el('div', 'reto-carta race-podio');
    caja.appendChild(el('h3', null, acierto ? 'Apuesta ganadora' : 'Tu apuesta no ganó'));
    const puesto = ['1.º', '2.º', '3.º', '4.º'];
    porIters.forEach(function (s, i) {
      const fila = el('div', 'dash-fila');
      fila.appendChild(el('span', 'nombre', puesto[i] + ' ' + puntoHTML(s.color) + s.label + (s.id === apuesta ? ' — tu apuesta' : '')));
      fila.appendChild(el('span', null, isFinite(s.iters) ? s.iters + ' iteraciones' : (s.estado === 'diverged' ? 'diverge' : 'no converge')));
      caja.appendChild(fila);
    });

    /* doble criterio: evaluaciones de f */
    const notas = el('div', 'quiz-instr');
    const conCoste = series.slice().filter(function (s) { return isFinite(s.iters); })
      .sort(function (a, b) { return COSTE[a.id](a.iters) - COSTE[b.id](b.iters); });
    if (conCoste.length > 1) {
      const g2 = conCoste[0];
      let txt = '**Contando evaluaciones de f** (Newton paga 2 por iteración): ' +
        conCoste.map(function (s) { return s.label + ' = ' + COSTE[s.id](s.iters); }).join(' · ') + '.';
      if (g2.id !== ganador.id) txt += ' **El podio cambia: gana ' + g2.label + '.** La velocidad por iteración no es gratis.';
      else txt += ' El podio no cambia, pero mira qué cerca queda la secante: 1 evaluación por iteración es su superpoder.';
      NS.math.render(notas, txt);
    }
    caja.appendChild(notas);

    const acciones = el('div');
    acciones.style.marginTop = '14px';
    const otra = el('button', 'btn btn-suave', 'Otra carrera');
    otra.type = 'button';
    otra.addEventListener('click', setup);
    acciones.appendChild(otra);
    caja.appendChild(acciones);
    S.zona.appendChild(caja);
    void conf;
  }
})(globalThis.MNO = globalThis.MNO || {});
