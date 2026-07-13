/* Pack de contenido: BISECCIÓN (teoría + Practicar + Retos). */
(function (NS) {
  'use strict';

  NS.content = NS.content || {};
  NS.content.theory = NS.content.theory || {};
  NS.content.quizzes = NS.content.quizzes || {};
  NS.content.challenges = NS.content.challenges || {};

  const tex = NS.num.tex;

  /* ============ TEORÍA ============ */
  NS.content.theory.biseccion = {
    secciones: [
      {
        titulo: 'La idea', icono: '💡',
        lineas: [
          'Si $f$ es continua y cambia de signo entre $a$ y $b$, el teorema de Bolzano garantiza una raíz dentro. La bisección juega al **frío-caliente perfecto**: mira el signo en el punto medio, descarta la mitad donde NO puede estar la raíz, y repite.',
          'Cada iteración reduce la incertidumbre exactamente a la mitad. No es lista, pero es **implacable**: nunca falla si hay cambio de signo.',
        ],
      },
      {
        titulo: 'Formulación', icono: '🧮',
        lineas: [
          '$c = \\dfrac{a + b}{2}$; si $f(a) \\cdot f(c) < 0$ la raíz está en $[a, c]$; si no, en $[c, b]$.',
          'Cota del error tras $n$ iteraciones: $|\\alpha - c_n| \\le \\dfrac{b - a}{2^n}$ — **sabes el error ANTES de empezar**, un lujo que ningún otro método regala.',
        ],
      },
      {
        titulo: 'Convergencia', icono: '📈',
        lineas: [
          'Lineal con razón exactamente $\\tfrac{1}{2}$: cada iteración regala un dígito binario (~0.3 dígitos decimales).',
          'Iteraciones necesarias para tolerancia $\\varepsilon$: $n \\ge \\log_2 \\dfrac{b - a}{\\varepsilon}$. Para 6 decimales partiendo de un intervalo de longitud 1: unas 20 iteraciones. Newton lo haría en 3… si le va bien.',
          'En el gráfico de Convergencia se ve una **recta perfecta**: la firma del orden 1 con razón constante.',
        ],
      },
      {
        titulo: 'Ventajas y limitaciones', icono: '⚖️',
        lineas: [
          {
            tipo: 'vs',
            pros: [
              'Convergencia **garantizada** si hay cambio de signo.',
              'Cota de error a priori: puedes prometer precisión con contrato.',
              'Solo necesita evaluar $f$ (ni derivadas ni suavidad extra).',
              'Inmune a que $f$ sea fea: solo mira signos.',
            ],
            contras: [
              'Lenta: razón fija $\\tfrac{1}{2}$, da igual lo suave que sea $f$.',
              'Necesita un intervalo con cambio de signo para arrancar.',
              'No ve raíces de multiplicidad par (no hay cambio de signo).',
              'No se generaliza a sistemas de ecuaciones.',
            ],
          },
        ],
      },
      {
        titulo: 'Errores típicos', icono: '🚫',
        lineas: [
          { tipo: 'error', texto: 'Aplicarla sin comprobar $f(a) \\cdot f(b) < 0$. Sin cambio de signo no hay garantía de nada (preset «⚠ Sin cambio de signo»).' },
          { tipo: 'error', texto: 'Buscar una raíz doble como la de $(x-1)^2$: la parábola TOCA el eje sin cruzarlo, no hay cambio de signo y la bisección es ciega ante ella (preset «⚠ Raíz doble (invisible)»).' },
          { tipo: 'error', texto: 'Confundir «hay una raíz» con «hay UNA sola»: si $f$ cambia de signo varias veces dentro de $[a,b]$, la bisección converge a alguna de las raíces, no necesariamente a la que tú querías.' },
          { tipo: 'error', texto: 'Elegir la mitad por el TAMAÑO de $|f|$ en vez de por el SIGNO: que $|f(c)|$ sea pequeño no dice en qué mitad está el cambio de signo.' },
        ],
      },
      {
        titulo: '¿Cuándo usarlo?', icono: '🧭',
        lineas: [
          'Como **red de seguridad**: cuando necesitas garantía absoluta, cuando $f$ es poco fiable, o para acorralar la raíz unas iteraciones y entregarle el testigo a Newton o a la secante.',
          'Los algoritmos profesionales (como el método de Brent) son exactamente eso: bisección de guardaespaldas + secante de velocista.',
        ],
      },
    ],
  };

  /* ============ PRACTICAR ============ */
  function casoAleatorio(U) {
    return U.elegir([
      { f: 'x^2 - ' + U.randInt(2, 9), a: 0, b: U.randInt(3, 4) },
      { f: 'cos(x) - x', a: 0, b: 1 },
      { f: 'x^3 - x - ' + U.randInt(1, 4), a: 1, b: 2 },
      { f: 'exp(x) - ' + U.randInt(2, 5), a: 0, b: 2 },
    ]);
  }

  NS.content.quizzes.biseccion = {
    generadores: [

      /* 1 · point-x: ¿dónde caerá el PRÓXIMO punto medio? */
      function (U) {
        const c = casoAleatorio(U);
        const tr = NS.engines.biseccion({ f: c.f, a: c.a, b: c.b, tol: 1e-8, maxIter: 30 });
        const iters = tr.steps.filter(function (s) { return s.type === 'iter'; });
        const k = U.randInt(1, Math.min(3, iters.length - 2));
        const paso = iters[k - 1];   /* iteración k (índice k en steps: setup + iters) */
        const sig = iters[k];
        const span = tr.plotHints.xmax - tr.plotHints.xmin;
        return {
          tipo: 'point-x', tema: 'siguiente-punto-medio',
          enunciado: 'Bisección sobre $f(x) = ' + c.f + '$. Estás viendo la iteración ' + k + ': el punto $c$ y la mitad descartada (en rojo). **¿Dónde caerá el PRÓXIMO punto medio?** Haz clic sobre el eje.',
          traza: tr, hastaPaso: paso.i,
          puntoX: sig.state.c, tolX: Math.max(0.08, span * 0.05),
          pista: 'Primero decide qué mitad sobrevive (la que conserva el cambio de signo) y luego apunta a SU centro.',
          solucion: 'Sobrevive $[' + tex(sig.state.a, 4) + ',\\ ' + tex(sig.state.b, 4) + ']$ y su punto medio es $' + tex(sig.state.c, 6) + '$.',
        };
      },

      /* 2 · choice: ¿qué mitad sobrevive? */
      function (U) {
        const c = casoAleatorio(U);
        const tr = NS.engines.biseccion({ f: c.f, a: c.a, b: c.b, tol: 1e-8, maxIter: 30 });
        const it = tr.steps.filter(function (s) { return s.type === 'iter'; })[0];
        const sa = it.state.fa < 0 ? '-' : '+', sc = it.state.fc < 0 ? '-' : '+', sb = it.state.fb < 0 ? '-' : '+';
        const correcta = it.state.keep === 'izq' ? 0 : 1;
        return {
          tipo: 'choice', tema: 'signo-intervalo',
          enunciado: 'En $[' + tex(it.state.a, 4) + ',\\ ' + tex(it.state.b, 4) + ']$ los signos son: $f(a): ' + sa + '$, $\\ f(c): ' + sc + '$, $\\ f(b): ' + sb + '$. ¿Qué mitad conserva la raíz?',
          traza: null,
          opciones: ['La izquierda: $[a, c]$', 'La derecha: $[c, b]$', 'Las dos: hay que quedarse con ambas'],
          correcta: correcta,
          pista: 'Busca el par de extremos con signos OPUESTOS: ahí obliga Bolzano a que haya raíz.',
          solucion: 'El cambio de signo está entre ' + (correcta === 0 ? '$a$ y $c$' : '$c$ y $b$') + ': esa mitad sobrevive y la otra se descarta entera.',
        };
      },

      /* 3 · numeric: la cota teórica de iteraciones */
      function (U) {
        const L = U.elegir([1, 2, 4]);
        const tol = U.elegir([0.01, 0.001, 0.0001]);
        const n = Math.ceil(Math.log2(L / tol));
        return {
          tipo: 'numeric', tema: 'cota-teorica',
          enunciado: 'Intervalo inicial de longitud $' + L + '$ y tolerancia $' + tol + '$. Según la cota $n \\ge \\log_2\\frac{b-a}{\\varepsilon}$, ¿**cuántas iteraciones** garantizan alcanzarla? (número entero)',
          traza: null,
          respuesta: n, tol: 0.5,
          pista: '$\\log_2$ de $' + L + '/' + tol + ' = ' + tex(L / tol) + '$… y redondea hacia ARRIBA: con iteraciones no se puede hacer «media».',
          solucion: '$n = \\lceil \\log_2(' + tex(L / tol) + ') \\rceil = ' + n + '$. Esta cota se conoce ANTES de evaluar $f$ ni una sola vez: es el superpoder de la bisección.',
        };
      },

      /* 4 · choice: la raíz doble invisible */
      function (U) {
        const r = U.randInt(1, 3);
        return {
          tipo: 'choice', tema: 'cambio-de-signo',
          enunciado: '$f(x) = (x - ' + r + ')^2$ tiene una raíz doble en $x = ' + r + '$. ¿Puede encontrarla la bisección?',
          traza: null,
          opciones: [
            'No: $f \\ge 0$ en todas partes, nunca hay cambio de signo',
            'Sí, como cualquier otra raíz',
            'Sí, pero solo si $a$ o $b$ caen exactamente en la raíz',
          ],
          correcta: 0,
          pista: 'Dibuja la parábola: ¿cruza el eje… o solo lo acaricia?',
          solucion: 'La parábola toca el eje sin cruzarlo: $f(a) \\cdot f(b) > 0$ para cualquier intervalo y la bisección no tiene dónde agarrarse. Las raíces de multiplicidad PAR son invisibles para los métodos de bracketing (pruébalo con el preset «Raíz doble»).',
        };
      },
    ],
  };

  /* ============ RETOS ============ */
  NS.content.challenges.biseccion = [
    {
      id: 'cerco', nombre: 'Cerco a la raíz', icono: '⭐',
      tipo: 'param-goal',
      desc: 'f tiene TRES raíces: −2, 0 y 3. Acorrala exactamente la marcada con ⭐ (x = 3) en pocas iteraciones.',
      enunciado: '$f(x) = x^3 - x^2 - 6x = x\\,(x + 2)(x - 3)$ tiene tres raíces: $-2$, $0$ y $\\; 3\\,⭐$. **Elige $[a, b]$ para que la bisección converja a la raíz $x = 3$** (tol $0.001$) — y cuantas menos iteraciones, más puntos. Ojo: con el intervalo inicial $[-4, 4]$ pasa algo curioso…',
      libres: ['a', 'b'],
      fijos: { f: 'x^3 - x^2 - 6x', tol: '0.001', maxIter: '60' },
      inicial: { a: '-4', b: '4' },
      intentosMax: 3,
      plot: true,
      evalua: function (trace) {
        if (trace.status === 'error') return { puntos: 0, msg: '⛔ Sin cambio de signo: ese intervalo no encierra ninguna raíz (o encierra un número PAR de ellas).' };
        if (trace.status !== 'converged') return { puntos: 5, msg: 'No convergió dentro del máximo de iteraciones.' };
        const root = trace.result.root;
        if (Math.abs(root - 3) > 0.1) {
          return { puntos: 10, msg: '🎯 Convergió… ¡pero a la raíz ' + NS.num.fmt(root, 3) + '! Has cercado a la equivocada. Pista: los DOS extremos deben dejar fuera a las otras dos raíces.' };
        }
        const it = trace.result.iters;
        if (it <= 9) return { puntos: 100, msg: '¡Raíz ⭐ cercada en ' + it + ' iteraciones! Bracket de francotirador.' };
        if (it <= 11) return { puntos: 80, msg: 'Raíz ⭐ en ' + it + ' iteraciones. Un intervalo inicial más estrecho la cerca antes.' };
        if (it <= 14) return { puntos: 60, msg: 'Raíz ⭐ en ' + it + ' iteraciones — correcta, pero el cerco empezó ancho.' };
        return { puntos: 40, msg: 'Raíz ⭐ atrapada, pero tras ' + it + ' iteraciones. Recuerda: cada mitad de anchura inicial ahorra una iteración.' };
      },
    },
    {
      id: 'presupuesto', nombre: 'Presupuesto de 8 iteraciones', icono: '⏱️',
      tipo: 'param-goal',
      desc: 'Solo 8 iteraciones para cazar cos(x) = x. La precisión final depende SOLO de tu intervalo inicial.',
      enunciado: 'La ecuación $\\cos(x) = x$ tiene su raíz cerca de $0.739$. Tienes un presupuesto FIJO de **8 iteraciones**. Como cada una divide el intervalo por 2, tu error final será $\\approx \\frac{b-a}{2^9}$: **todo se decide en el intervalo inicial** (que debe seguir encerrando la raíz).',
      libres: ['a', 'b'],
      fijos: { f: 'cos(x) - x', tol: '0.0000000001', maxIter: '8' },
      inicial: { a: '0', b: '4' },
      intentosMax: 3,
      plot: true,
      evalua: function (trace) {
        if (trace.status === 'error') return { puntos: 0, msg: '⛔ Ese intervalo no tiene cambio de signo: la raíz se te escapó del cerco.' };
        const serie = trace.errorSeries;
        if (!serie.length) return { puntos: 0, msg: 'Sin iteraciones registradas.' };
        const err = serie[serie.length - 1].err;
        const msg = 'Error final (semilongitud): $' + tex(err, 8) + '$.';
        if (err < 0.0005) return { puntos: 100, msg: msg + ' 🏆 Precisión de relojero con solo 8 cortes.' };
        if (err < 0.002) return { puntos: 80, msg: msg + ' Muy fino: tu intervalo inicial ya valía oro.' };
        if (err < 0.005) return { puntos: 60, msg: msg + ' Bien. ¿Puedes arrancar aún más cerca de 0.739 sin perder el cambio de signo?' };
        return { puntos: 30, msg: msg + ' Demasiado ancho el punto de partida: 8 iteraciones solo dividen por 256.' };
      },
    },
  ];
})(globalThis.MNO = globalThis.MNO || {});
