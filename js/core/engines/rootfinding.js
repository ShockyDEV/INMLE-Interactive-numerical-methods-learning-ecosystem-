/* MNO.engines — métodos de búsqueda de raíces como funciones puras (params → Trace).
   La matemática está portada tal cual del MNO Helper original (legacy/) para
   conservar la paridad numérica; aquí solo cambia la salida: pasos estructurados
   con explicación, primitivas de dibujo y ganchos de quiz, en vez de HTML. */
(function (NS) {
  'use strict';

  const T = NS.trace, X = NS.expr, N = NS.num;
  const tex = N.tex, R = N.R;

  NS.engines = NS.engines || {};

  function compileOrFail(tr, src, label) {
    const r = X.tryCompile(src, ['x']);
    if (!r.ok) {
      T.step(tr, {
        type: 'fail', title: 'Error en ' + label,
        explain: ['No se pudo interpretar $' + label + '$: ' + r.error],
      });
      T.finish(tr, 'error', null, 'Expresión no válida en ' + label);
      return null;
    }
    return r.fn;
  }

  function hintFromXs(xs, extra) {
    let lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs);
    if (!isFinite(lo) || !isFinite(hi)) { lo = -5; hi = 5; }
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    const m = (hi - lo) * (extra || 0.25);
    return { xmin: lo - m, xmax: hi + m };
  }

  /* ---------- BISECCIÓN ---------- */
  NS.engines.biseccion = function (p) {
    const tr = T.make('biseccion', 'rootfinding', {
      f: p.f, a: +p.a, b: +p.b, tol: +p.tol, maxIter: +p.maxIter || 50,
    });
    const f = compileOrFail(tr, p.f, 'f(x)');
    if (!f) return tr;
    tr.fns.f = f;

    let a = +p.a, b = +p.b;
    const tol = +p.tol, mx = +p.maxIter || 50;
    let fa = f(a), fb = f(b);
    tr.plotHints = hintFromXs([a, b]);

    const setup = T.step(tr, {
      type: 'setup', title: 'Verificación inicial',
      state: { a: a, b: b, fa: fa, fb: fb },
      explain: [
        '$f(' + tex(a) + ') = ' + tex(fa) + '$ → signo ' + (fa >= 0 ? 'positivo' : 'negativo'),
        '$f(' + tex(b) + ') = ' + tex(fb) + '$ → signo ' + (fb >= 0 ? 'positivo' : 'negativo'),
      ],
      draw: [
        { t: 'curve', fn: 'f', cls: 'principal' },
        { t: 'band', id: 'iv', x1: a, x2: b, cls: 'intervalo' },
        { t: 'point', id: 'pa', x: a, y: fa, cls: 'extremo', label: 'a' },
        { t: 'point', id: 'pb', x: b, y: fb, cls: 'extremo', label: 'b' },
      ],
    });
    if (fa * fb > 0) {
      setup.explain.push('$f(a) \\cdot f(b) = ' + tex(fa * fb, 4) + ' > 0$ → **no hay cambio de signo**: el teorema de Bolzano no garantiza raíz en $[a,b]$.');
      setup.type = 'fail';
      return T.finish(tr, 'error', null, 'Sin cambio de signo en [a, b]');
    }
    setup.explain.push('$f(a) \\cdot f(b) = ' + tex(fa * fb, 4) + ' < 0$ → hay cambio de signo: **existe una raíz en $[a,b]$** ✓');
    setup.explain.push('Iteraciones que garantiza la teoría: $n \\ge \\log_2\\frac{b-a}{\\varepsilon} = \\log_2\\frac{' + tex(b - a) + '}{' + tex(tol) + '} \\approx ' + Math.ceil(Math.log2((b - a) / tol)) + '$');

    for (let i = 1; i <= mx; i++) {
      const c = (a + b) / 2, fc = f(c);
      fa = f(a); fb = f(b);
      const keepLeft = fa * fc < 0;
      const st = T.step(tr, {
        type: 'iter', k: i, title: 'Iteración ' + i,
        state: { a: a, b: b, c: c, fa: fa, fb: fb, fc: fc, keep: keepLeft ? 'izq' : 'der' },
        estimate: c,
        error: (b - a) / 2, errorKind: 'longitud/2',
        explain: [
          'Intervalo actual $[a, b] = [' + tex(a) + ',\\ ' + tex(b) + ']$, longitud $' + tex(b - a) + '$',
          '$c = \\dfrac{a + b}{2} = \\dfrac{' + tex(a) + ' + ' + tex(b) + '}{2} = ' + tex(c) + '$',
          '$f(c) = f(' + tex(c) + ') = ' + tex(fc) + '$',
        ],
        draw: [
          { t: 'curve', fn: 'f', cls: 'principal' },
          { t: 'band', id: 'iv', x1: a, x2: b, cls: 'intervalo' },
          { t: 'band', id: 'dead', x1: keepLeft ? c : a, x2: keepLeft ? b : c, cls: 'descartado' },
          { t: 'point', id: 'pa', x: a, y: fa, cls: 'extremo', label: 'a' },
          { t: 'point', id: 'pb', x: b, y: fb, cls: 'extremo', label: 'b' },
          { t: 'vline', id: 'vc', x: c, cls: 'guia' },
          { t: 'point', id: 'pc', x: c, y: fc, cls: 'candidato', label: 'c' },
        ],
        quiz: {
          mitad: keepLeft ? 'izq' : 'der',
          predictPoint: { x: c, pregunta: '¿Dónde está el punto medio del intervalo?' },
        },
      });
      if (Math.abs(fc) < 1e-15) {
        st.explain.push('$f(c) = 0$ → **¡raíz exacta encontrada!** $\\alpha = ' + tex(c, 10) + '$');
        T.step(tr, {
          type: 'final', title: 'Raíz exacta',
          explain: ['La bisección encontró la raíz exacta $\\alpha = ' + tex(c, 10) + '$ en ' + i + ' iteraciones.'],
          draw: [
            { t: 'curve', fn: 'f', cls: 'principal' },
            { t: 'point', id: 'raiz', x: c, y: 0, cls: 'raiz', label: 'α' },
          ],
        });
        return T.finish(tr, 'converged', { root: c, iters: i, fRoot: fc });
      }
      if ((b - a) / 2 < tol) {
        st.explain.push('$\\dfrac{b - a}{2} = ' + tex((b - a) / 2, 8) + ' < ' + tex(tol) + '$ → **CONVERGE**');
        T.step(tr, {
          type: 'final', title: 'Convergencia',
          explain: [
            'La semilongitud del intervalo ya es menor que la tolerancia.',
            '**Raíz aproximada: $\\alpha \\approx ' + tex(c, 10) + '$** tras ' + i + ' iteraciones.',
            'Cota del error: $|\\alpha - c| \\le ' + tex((b - a) / 2, 8) + '$',
          ],
          draw: [
            { t: 'curve', fn: 'f', cls: 'principal' },
            { t: 'band', id: 'iv', x1: keepLeft ? a : c, x2: keepLeft ? c : b, cls: 'intervalo' },
            { t: 'point', id: 'raiz', x: c, y: 0, cls: 'raiz', label: 'α' },
          ],
        });
        return T.finish(tr, 'converged', { root: c, iters: i, fRoot: fc });
      }
      if (keepLeft) {
        st.explain.push('$f(a) \\cdot f(c) < 0$ → la raíz está a la izquierda: nuevo intervalo $[' + tex(a) + ',\\ ' + tex(c) + ']$');
        b = c;
      } else {
        st.explain.push('$f(c) \\cdot f(b) < 0$ → la raíz está a la derecha: nuevo intervalo $[' + tex(c) + ',\\ ' + tex(b) + ']$');
        a = c;
      }
    }
    T.step(tr, {
      type: 'fail', title: 'Máximo de iteraciones',
      explain: ['Se alcanzó el máximo de ' + mx + ' iteraciones sin lograr la tolerancia. Última estimación: $' + tex((a + b) / 2, 10) + '$'],
    });
    return T.finish(tr, 'maxIter', { root: (a + b) / 2, iters: mx });
  };

  /* ---------- CUERDA (regula falsi) ---------- */
  NS.engines.cuerda = function (p) {
    const tr = T.make('cuerda', 'rootfinding', {
      f: p.f, a: +p.a, b: +p.b, tol: +p.tol, maxIter: +p.maxIter || 50,
    });
    const f = compileOrFail(tr, p.f, 'f(x)');
    if (!f) return tr;
    tr.fns.f = f;

    let a = +p.a, b = +p.b;
    const tol = +p.tol, mx = +p.maxIter || 50;
    let fa = f(a), fb = f(b);
    tr.plotHints = hintFromXs([a, b]);

    const setup = T.step(tr, {
      type: 'setup', title: 'Verificación inicial',
      state: { a: a, b: b, fa: fa, fb: fb },
      explain: [
        '$f(' + tex(a) + ') = ' + tex(fa) + '$, $f(' + tex(b) + ') = ' + tex(fb) + '$',
      ],
      draw: [
        { t: 'curve', fn: 'f', cls: 'principal' },
        { t: 'band', id: 'iv', x1: a, x2: b, cls: 'intervalo' },
        { t: 'point', id: 'pa', x: a, y: fa, cls: 'extremo', label: 'a' },
        { t: 'point', id: 'pb', x: b, y: fb, cls: 'extremo', label: 'b' },
      ],
    });
    if (fa * fb > 0) {
      setup.explain.push('$f(a) \\cdot f(b) > 0$ → **no hay cambio de signo**, no se puede aplicar el método.');
      setup.type = 'fail';
      return T.finish(tr, 'error', null, 'Sin cambio de signo en [a, b]');
    }
    setup.explain.push('$f(a) \\cdot f(b) < 0$ ✓ — en vez del punto medio, usamos el corte de la **cuerda** que une $(a, f(a))$ con $(b, f(b))$.');

    let lastEnd = null, lazyCount = 0, c = a;
    for (let i = 1; i <= mx; i++) {
      fa = f(a); fb = f(b);
      c = a - fa * (b - a) / (fb - fa);
      const fc = f(c);
      const keepLeft = fa * fc < 0;
      const st = T.step(tr, {
        type: 'iter', k: i, title: 'Iteración ' + i,
        state: { a: a, b: b, c: c, fa: fa, fb: fb, fc: fc, keep: keepLeft ? 'izq' : 'der' },
        estimate: c,
        error: Math.abs(fc), errorKind: '|f(c)|',
        explain: [
          'Cuerda por $(' + tex(a, 4) + ',\\ ' + tex(fa, 4) + ')$ y $(' + tex(b, 4) + ',\\ ' + tex(fb, 4) + ')$',
          '$c = a - f(a)\\dfrac{b-a}{f(b)-f(a)} = ' + tex(a) + ' - \\dfrac{' + tex(fa * (b - a)) + '}{' + tex(fb - fa) + '} = ' + tex(c) + '$',
          '$f(c) = ' + tex(fc) + '$',
        ],
        draw: [
          { t: 'curve', fn: 'f', cls: 'principal' },
          { t: 'band', id: 'iv', x1: a, x2: b, cls: 'intervalo' },
          { t: 'seg', id: 'cuerda', x1: a, y1: fa, x2: b, y2: fb, cls: 'cuerda', extend: true },
          { t: 'point', id: 'pa', x: a, y: fa, cls: 'extremo', label: 'a' },
          { t: 'point', id: 'pb', x: b, y: fb, cls: 'extremo', label: 'b' },
          { t: 'vline', id: 'vc', x: c, cls: 'guia' },
          { t: 'point', id: 'pc', x: c, y: fc, cls: 'candidato', label: 'c' },
        ],
        quiz: {
          mitad: keepLeft ? 'izq' : 'der',
          predictPoint: { x: c, pregunta: '¿Dónde corta la cuerda al eje x?' },
        },
      });
      /* Detector de extremo perezoso: un extremo lleva ≥3 iteraciones clavado. */
      const fixedEnd = keepLeft ? 'b→c' : 'a→c';
      if (lastEnd === (keepLeft ? 'a' : 'b')) lazyCount++; else lazyCount = 1;
      lastEnd = keepLeft ? 'a' : 'b';
      if (lazyCount >= 3) {
        st.lazyEnd = lastEnd;
        st.explain.push('El extremo $' + lastEnd + '$ lleva ' + lazyCount + ' iteraciones sin moverse (típico en funciones convexas): la anchura del intervalo **no** tiende a cero, pero $c$ sí converge.');
      }
      void fixedEnd;
      if (Math.abs(fc) < tol) {
        st.explain.push('$|f(c)| = ' + tex(Math.abs(fc), 8) + ' < ' + tex(tol) + '$ → **CONVERGE**');
        T.step(tr, {
          type: 'final', title: 'Convergencia',
          explain: ['**Raíz aproximada: $\\alpha \\approx ' + tex(c, 10) + '$** tras ' + i + ' iteraciones (criterio $|f(c)| < ' + tex(tol) + '$).'],
          draw: [
            { t: 'curve', fn: 'f', cls: 'principal' },
            { t: 'point', id: 'raiz', x: c, y: 0, cls: 'raiz', label: 'α' },
          ],
        });
        return T.finish(tr, 'converged', { root: c, iters: i, fRoot: fc });
      }
      if (keepLeft) {
        st.explain.push('$f(a) \\cdot f(c) < 0$ → nuevo intervalo $[' + tex(a) + ',\\ ' + tex(c) + ']$');
        b = c;
      } else {
        st.explain.push('$f(c) \\cdot f(b) < 0$ → nuevo intervalo $[' + tex(c) + ',\\ ' + tex(b) + ']$');
        a = c;
      }
    }
    T.step(tr, {
      type: 'fail', title: 'Máximo de iteraciones',
      explain: ['Se alcanzó el máximo de ' + mx + ' iteraciones. Última estimación: $' + tex(c, 10) + '$'],
    });
    return T.finish(tr, 'maxIter', { root: c, iters: mx });
  };

  /* ---------- PUNTO FIJO ---------- */
  NS.engines.puntofijo = function (p) {
    const tr = T.make('puntofijo', 'rootfinding', {
      g: p.g, x0: +p.x0, tol: +p.tol, maxIter: +p.maxIter || 50,
    });
    const g = compileOrFail(tr, p.g, 'g(x)');
    if (!g) return tr;
    tr.fns.g = g;
    tr.fns.id = function (x) { return x; };

    let x = +p.x0;
    const tol = +p.tol, mx = +p.maxIter || 50;
    const x0 = x;

    T.step(tr, {
      type: 'setup', title: 'Planteamiento',
      state: { x0: x0 },
      explain: [
        'Iteramos $x_{n+1} = g(x_n)$ con $g(x) = ' + p.g + '$ y $x_0 = ' + tex(x0) + '$.',
        'Un **punto fijo** $\\beta$ cumple $g(\\beta) = \\beta$: gráficamente, donde $g$ corta a la recta $y = x$.',
        'Criterio de parada: $|x_{n+1} - x_n| < ' + tex(tol) + '$.',
        'La teoría dice: converge localmente si $|g\'(\\beta)| < 1$ — y cuanto más pequeño, más rápido.',
      ],
      draw: [
        { t: 'curve', fn: 'g', cls: 'principal' },
        { t: 'curve', fn: 'id', cls: 'identidad' },
        { t: 'point', id: 'px', x: x0, y: 0, cls: 'candidato', label: 'x₀' },
      ],
    });

    const cw = [[x0, 0]];
    const allXs = [x0];
    let pv = null;
    for (let i = 0; i < mx; i++) {
      const xn = g(x);
      const d = Math.abs(xn - x);
      const rat = pv ? d / pv : null;
      cw.push([x, xn], [xn, xn]);
      allXs.push(xn);
      const st = T.step(tr, {
        type: 'iter', k: i + 1, title: 'Iteración ' + (i + 1),
        state: { x: x, xn: xn, d: d, ratio: rat },
        estimate: xn,
        error: d, errorKind: '|Δx|',
        explain: [
          '$x_{' + (i + 1) + '} = g(' + tex(x, 8) + ') = ' + tex(xn, 8) + '$',
          '$|x_{' + (i + 1) + '} - x_{' + i + '}| = ' + tex(d, 8) + '$',
          rat !== null
            ? 'Cociente de errores $\\dfrac{|\\Delta_{' + (i + 1) + '}|}{|\\Delta_{' + i + '}|} = ' + tex(rat, 6) + '$ — este cociente tiende a $|g\'(\\beta)|$'
            : 'En la telaraña: subimos hasta $g$ (vertical) y volvemos a la diagonal $y = x$ (horizontal).',
        ],
        draw: [
          { t: 'curve', fn: 'g', cls: 'principal' },
          { t: 'curve', fn: 'id', cls: 'identidad' },
          { t: 'polyline', id: 'cw', pts: cw.slice(), cls: 'trayectoria' },
          { t: 'point', id: 'px', x: xn, y: xn, cls: 'candidato', label: 'x' + (i + 1) },
        ],
        quiz: {
          predictPoint: { x: xn, pregunta: '¿A qué valor salta x en la siguiente iteración?' },
        },
      });
      if (d < tol) {
        st.explain.push('$|\\Delta| < ' + tex(tol) + '$ → **CONVERGE**');
        T.step(tr, {
          type: 'final', title: 'Convergencia',
          explain: [
            '**Punto fijo: $\\beta \\approx ' + tex(xn, 10) + '$** tras ' + (i + 1) + ' iteraciones.',
            rat !== null ? 'Estimación experimental: $|g\'(\\beta)| \\approx ' + tex(rat, 6) + '$' + (rat < 1 ? ' $< 1$ ✓ (por eso convergió)' : '') : '',
          ].filter(Boolean),
          draw: [
            { t: 'curve', fn: 'g', cls: 'principal' },
            { t: 'curve', fn: 'id', cls: 'identidad' },
            { t: 'polyline', id: 'cw', pts: cw.slice(), cls: 'trayectoria' },
            { t: 'point', id: 'raiz', x: xn, y: xn, cls: 'raiz', label: 'β' },
          ],
        });
        tr.plotHints = hintFromXs(allXs, 0.6);
        return T.finish(tr, 'converged', { root: xn, iters: i + 1, ratio: rat });
      }
      if (!isFinite(xn) || Math.abs(xn) > 1e12) {
        st.type = 'fail';
        st.explain.push('**DIVERGE**: los iterados crecen sin control — aquí $|g\'| > 1$ y la telaraña se aleja en espiral.');
        tr.plotHints = hintFromXs(allXs.filter(isFinite).slice(0, 6), 0.6);
        return T.finish(tr, 'diverged', null, 'La iteración diverge');
      }
      pv = d;
      x = xn;
    }
    tr.plotHints = hintFromXs(allXs, 0.6);
    T.step(tr, {
      type: 'fail', title: 'Máximo de iteraciones',
      explain: ['Se alcanzó el máximo de ' + mx + ' iteraciones sin cumplir la tolerancia.'],
    });
    return T.finish(tr, 'maxIter', { root: x, iters: mx });
  };

  /* ---------- NEWTON-RAPHSON ---------- */
  NS.engines.newton = function (p) {
    const tr = T.make('newton', 'rootfinding', {
      f: p.f, df: p.df, x0: +p.x0, tol: +p.tol, maxIter: +p.maxIter || 50,
    });
    const f = compileOrFail(tr, p.f, 'f(x)');
    if (!f) return tr;
    const df = compileOrFail(tr, p.df, "f'(x)");
    if (!df) return tr;
    tr.fns.f = f;
    tr.fns.df = df;

    let x = +p.x0;
    const tol = +p.tol, mx = +p.maxIter || 50;
    const x0 = x;
    const allXs = [x0];

    const setup = T.step(tr, {
      type: 'setup', title: 'Planteamiento',
      state: { x0: x0 },
      explain: [
        'Newton sigue la **tangente**: en cada punto sustituimos la curva por su recta tangente y saltamos a donde esta corta al eje.',
        '$x_{n+1} = x_n - \\dfrac{f(x_n)}{f\'(x_n)}$, con $x_0 = ' + tex(x0) + '$.',
        'Si todo va bien, la convergencia es **cuadrática**: el número de decimales correctos se duplica en cada paso.',
      ],
      draw: [
        { t: 'curve', fn: 'f', cls: 'principal' },
        { t: 'point', id: 'px', x: x0, y: f(x0), cls: 'candidato', label: 'x₀' },
      ],
    });
    /* Verificador de derivada: compara la f' tecleada con la derivada numérica. */
    const sample = [x0 - 1.5, x0 - 0.5, x0, x0 + 0.5, x0 + 1.5];
    const bad = X.checkDerivative(f, df, sample);
    if (bad) {
      setup.derivWarn = bad;
      setup.explain.push('**Revisa tu derivada**: cerca de $x = ' + tex(bad.x, 4) + '$ tu $f\'$ da $' + tex(bad.obtenido, 6) + '$ pero la derivada numérica de $f$ da $' + tex(bad.esperado, 6) + '$. Con una derivada incorrecta Newton pierde su velocidad cuadrática (o diverge).');
    }

    for (let i = 0; i < mx; i++) {
      const fx = f(x), dfx = df(x);
      if (Math.abs(dfx) < 1e-15) {
        T.step(tr, {
          type: 'fail', title: "f'(x) ≈ 0",
          explain: ['$f\'(' + tex(x, 6) + ') \\approx 0$: la tangente es horizontal y **no corta al eje**. Newton no puede continuar (prueba otro $x_0$).'],
          draw: [
            { t: 'curve', fn: 'f', cls: 'principal' },
            { t: 'point', id: 'px', x: x, y: fx, cls: 'extremo', label: 'x' + i },
            { t: 'seg', id: 'tang', x1: x - 2, y1: fx, x2: x + 2, y2: fx, cls: 'tangente', extend: true },
          ],
        });
        return T.finish(tr, 'error', null, 'Derivada nula');
      }
      const xn = x - fx / dfx;
      const d = Math.abs(xn - x);
      allXs.push(xn);
      const st = T.step(tr, {
        type: 'iter', k: i + 1, title: 'Iteración ' + (i + 1),
        state: { x: x, fx: fx, dfx: dfx, xn: xn, d: d },
        estimate: xn,
        error: d, errorKind: '|Δx|',
        explain: [
          '$f(' + tex(x, 6) + ') = ' + tex(fx, 8) + '$, $\\quad f\'(' + tex(x, 6) + ') = ' + tex(dfx, 8) + '$',
          '$x_{' + (i + 1) + '} = ' + tex(x, 8) + ' - \\dfrac{' + tex(fx, 8) + '}{' + tex(dfx, 8) + '} = ' + tex(x, 8) + ' - (' + tex(fx / dfx, 8) + ') = ' + tex(xn, 8) + '$',
          '$|x_{' + (i + 1) + '} - x_{' + i + '}| = ' + tex(d, 10) + '$',
        ],
        draw: [
          { t: 'curve', fn: 'f', cls: 'principal' },
          { t: 'point', id: 'px', x: x, y: fx, cls: 'candidato', label: 'x' + i },
          { t: 'seg', id: 'tang', x1: x, y1: fx, x2: xn, y2: 0, cls: 'tangente', extend: true },
          { t: 'vline', id: 'vn', x: xn, cls: 'guia' },
          { t: 'point', id: 'pn', x: xn, y: 0, cls: 'siguiente', label: 'x' + (i + 1) },
        ],
        quiz: {
          predictPoint: { x: xn, pregunta: '¿Dónde corta la tangente al eje x?' },
        },
      });
      if (d < tol) {
        const fr = f(xn);
        st.explain.push('$|\\Delta x| < ' + tex(tol) + '$ → **CONVERGE**');
        T.step(tr, {
          type: 'final', title: 'Convergencia',
          explain: [
            '**Raíz: $\\alpha \\approx ' + tex(xn, 10) + '$** tras ' + (i + 1) + ' iteraciones.',
            'Comprobación: $f(\\alpha) = ' + tex(fr, 10) + '$',
          ],
          draw: [
            { t: 'curve', fn: 'f', cls: 'principal' },
            { t: 'point', id: 'raiz', x: xn, y: 0, cls: 'raiz', label: 'α' },
          ],
        });
        tr.plotHints = hintFromXs(allXs, 0.45);
        return T.finish(tr, 'converged', { root: xn, iters: i + 1, fRoot: fr });
      }
      if (!isFinite(xn) || Math.abs(xn) > 1e12) {
        st.type = 'fail';
        st.explain.push('**DIVERGE**: el iterado se escapa — la tangente apuntó lejos de la raíz (típico si $x_0$ está cerca de un extremo local).');
        tr.plotHints = hintFromXs(allXs.filter(isFinite).slice(0, 5), 0.45);
        return T.finish(tr, 'diverged', null, 'La iteración diverge');
      }
      x = xn;
    }
    tr.plotHints = hintFromXs(allXs, 0.45);
    T.step(tr, {
      type: 'fail', title: 'Máximo de iteraciones',
      explain: ['Se alcanzó el máximo de ' + mx + ' iteraciones (¿ciclo? prueba el preset $x^3 - 2x + 2$ con $x_0 = 0$).'],
    });
    return T.finish(tr, 'maxIter', { root: x, iters: mx });
  };

  /* ---------- SECANTE ---------- */
  NS.engines.secante = function (p) {
    const tr = T.make('secante', 'rootfinding', {
      f: p.f, x0: +p.x0, x1: +p.x1, tol: +p.tol, maxIter: +p.maxIter || 50,
    });
    const f = compileOrFail(tr, p.f, 'f(x)');
    if (!f) return tr;
    tr.fns.f = f;

    let x0 = +p.x0, x1 = +p.x1;
    const tol = +p.tol, mx = +p.maxIter || 50;
    const allXs = [x0, x1];

    T.step(tr, {
      type: 'setup', title: 'Planteamiento',
      state: { x0: x0, x1: x1 },
      explain: [
        'Como Newton, pero **sin derivada**: la tangente se aproxima con la secante por los dos últimos puntos.',
        '$x_{n+1} = x_n - f(x_n)\\dfrac{x_n - x_{n-1}}{f(x_n) - f(x_{n-1})}$',
        'Arrancamos con $x_0 = ' + tex(x0) + '$ y $x_1 = ' + tex(x1) + '$. Solo cuesta **1 evaluación de $f$ por iteración** (Newton cuesta 2: $f$ y $f\'$).',
      ],
      draw: [
        { t: 'curve', fn: 'f', cls: 'principal' },
        { t: 'point', id: 'p0', x: x0, y: f(x0), cls: 'extremo', label: 'x₀' },
        { t: 'point', id: 'p1', x: x1, y: f(x1), cls: 'candidato', label: 'x₁' },
      ],
    });

    for (let i = 0; i < mx; i++) {
      const f0 = f(x0), f1 = f(x1);
      if (Math.abs(f1 - f0) < 1e-15) {
        T.step(tr, {
          type: 'fail', title: 'Secante horizontal',
          explain: ['$f(x_{n}) - f(x_{n-1}) \\approx 0$: la secante es horizontal y no corta al eje. Prueba otros puntos iniciales.'],
        });
        return T.finish(tr, 'error', null, 'División por cero en la secante');
      }
      const x2 = x1 - f1 * (x1 - x0) / (f1 - f0);
      const d = Math.abs(x2 - x1);
      allXs.push(x2);
      const st = T.step(tr, {
        type: 'iter', k: i + 1, title: 'Iteración ' + (i + 1),
        state: { x0: x0, x1: x1, f0: f0, f1: f1, x2: x2, d: d },
        estimate: x2,
        error: d, errorKind: '|Δx|',
        explain: [
          'Secante por $(' + tex(x0, 6) + ',\\ ' + tex(f0, 6) + ')$ y $(' + tex(x1, 6) + ',\\ ' + tex(f1, 6) + ')$',
          '$x_{' + (i + 2) + '} = ' + tex(x1, 8) + ' - ' + tex(f1, 6) + ' \\cdot \\dfrac{' + tex(x1 - x0, 6) + '}{' + tex(f1 - f0, 6) + '} = ' + tex(x2, 8) + '$',
          '$|\\Delta x| = ' + tex(d, 10) + '$',
        ],
        draw: [
          { t: 'curve', fn: 'f', cls: 'principal' },
          { t: 'point', id: 'p0', x: x0, y: f0, cls: 'extremo', label: 'x' + i },
          { t: 'point', id: 'p1', x: x1, y: f1, cls: 'candidato', label: 'x' + (i + 1) },
          { t: 'seg', id: 'sec', x1: x0, y1: f0, x2: x1, y2: f1, cls: 'secante', extend: true },
          { t: 'vline', id: 'vn', x: x2, cls: 'guia' },
          { t: 'point', id: 'p2', x: x2, y: 0, cls: 'siguiente', label: 'x' + (i + 2) },
        ],
        quiz: {
          predictPoint: { x: x2, pregunta: '¿Dónde corta la secante al eje x?' },
        },
      });
      if (d < tol) {
        st.explain.push('$|\\Delta x| < ' + tex(tol) + '$ → **CONVERGE**');
        T.step(tr, {
          type: 'final', title: 'Convergencia',
          explain: [
            '**Raíz: $\\alpha \\approx ' + tex(x2, 10) + '$** tras ' + (i + 1) + ' iteraciones.',
            'Orden de convergencia teórico: $\\varphi = \\frac{1+\\sqrt{5}}{2} \\approx 1.618$ (superlineal).',
          ],
          draw: [
            { t: 'curve', fn: 'f', cls: 'principal' },
            { t: 'point', id: 'raiz', x: x2, y: 0, cls: 'raiz', label: 'α' },
          ],
        });
        tr.plotHints = hintFromXs(allXs, 0.45);
        return T.finish(tr, 'converged', { root: x2, iters: i + 1, fRoot: f(x2) });
      }
      if (!isFinite(x2) || Math.abs(x2) > 1e12) {
        st.type = 'fail';
        st.explain.push('**DIVERGE**: la secante mandó el iterado lejos (recuerda: a diferencia de bisección/cuerda, la secante **no** mantiene la raíz acotada).');
        tr.plotHints = hintFromXs(allXs.filter(isFinite).slice(0, 5), 0.45);
        return T.finish(tr, 'diverged', null, 'La iteración diverge');
      }
      x0 = x1; x1 = x2;
    }
    tr.plotHints = hintFromXs(allXs, 0.45);
    T.step(tr, {
      type: 'fail', title: 'Máximo de iteraciones',
      explain: ['Se alcanzó el máximo de ' + mx + ' iteraciones.'],
    });
    return T.finish(tr, 'maxIter', { root: x1, iters: mx });
  };

  void R;
})(globalThis.MNO = globalThis.MNO || {});
