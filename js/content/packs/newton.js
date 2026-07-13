/* Pack de contenido: NEWTON–RAPHSON (teoría + Practicar + Retos).
   Este archivo es el EJEMPLAR del formato de pack: registra
   NS.content.theory.<id>, NS.content.quizzes.<id> y NS.content.challenges.<id>. */
(function (NS) {
  'use strict';

  NS.content = NS.content || {};
  NS.content.theory = NS.content.theory || {};
  NS.content.quizzes = NS.content.quizzes || {};
  NS.content.challenges = NS.content.challenges || {};

  const tex = NS.num.tex;

  /* ============ TEORÍA ============ */
  NS.content.theory.newton = {
    secciones: [
      {
        titulo: 'La idea', icono: '💡',
        lineas: [
          'En cada punto, la curva se parece mucho a su **recta tangente**. Newton explota eso sin piedad: sustituye $f$ por su tangente en $x_n$ y salta a donde la tangente corta al eje. Si la curva y la tangente se parecen, ese corte está mucho más cerca de la raíz.',
          'Repite: apoyo, tangente, salto. En pocas iteraciones el salto es microscópico.',
        ],
      },
      {
        titulo: 'Formulación', icono: '🧮',
        lineas: [
          '$x_{n+1} = x_n - \\dfrac{f(x_n)}{f\'(x_n)}$',
          'Es una iteración de punto fijo con $G(x) = x - \\frac{f(x)}{f\'(x)}$: en la raíz simple, $G\'(\\alpha) = 0$, y por eso es tan rápido.',
        ],
      },
      {
        titulo: 'Convergencia', icono: '📈',
        lineas: [
          'Si $\\alpha$ es raíz **simple** ($f\'(\\alpha) \\ne 0$), $f\'\'$ es continua y $x_0$ está suficientemente cerca, la convergencia es **cuadrática**: $|e_{n+1}| \\approx C\\,|e_n|^2$.',
          'En la práctica: **el número de decimales correctos se duplica en cada iteración**. Míralo en la pestaña Convergencia: la curva del error se despeña.',
          'Si la raíz es múltiple, Newton no muere… pero baja a convergencia lineal (existe el remedio $x_{n+1} = x_n - m\\,f/f\'$ si conoces la multiplicidad $m$).',
        ],
      },
      {
        titulo: 'Ventajas y limitaciones', icono: '⚖️',
        lineas: [
          {
            tipo: 'vs',
            pros: [
              'Convergencia cuadrática cerca de la raíz: el más rápido del curso.',
              'Generaliza a sistemas no lineales (Newton multivariante).',
              'Autocorrectivo: un error de redondeo se corrige solo en la siguiente iteración.',
            ],
            contras: [
              'Necesitas $f\'(x)$ — y calcularla bien.',
              'Solo convergencia **local**: un mal $x_0$ puede mandarlo a otra raíz o al infinito.',
              'Cada iteración cuesta 2 evaluaciones ($f$ y $f\'$).',
              'Se atasca si $f\'(x_n) \\approx 0$ (tangente horizontal).',
            ],
          },
        ],
      },
      {
        titulo: 'Errores típicos', icono: '🚫',
        lineas: [
          { tipo: 'error', texto: 'Derivar mal $f$. Newton "funciona" igual… pero converge lento y ya no es Newton. La app compara tu $f\'$ con la derivada numérica y te avisa. Practícalo con el preset «Derivada mal escrita».' },
          { tipo: 'error', texto: 'Elegir $x_0$ cerca de un máximo/mínimo local: la tangente es casi horizontal y el primer salto sale disparado (preset «Tangente horizontal»).' },
          { tipo: 'error', texto: 'Creer que siempre converge. Prueba el preset «Ciclo infinito»: $x^3 - 2x + 2$ desde $x_0 = 0$ salta 0 → 1 → 0 → 1… eternamente.' },
          { tipo: 'error', texto: 'Confundir el criterio de parada $|x_{n+1} - x_n| < \\varepsilon$ con el error real: son parecidos SOLO si la convergencia es rápida.' },
        ],
      },
      {
        titulo: '¿Cuándo usarlo?', icono: '🧭',
        lineas: [
          'Cuando tienes $f\'$ barata y un $x_0$ razonable (por ejemplo, afinado antes con unas iteraciones de bisección): imbatible.',
          'Si no tienes derivada → **Secante**. Si necesitas garantía absoluta → **Bisección** (o híbridos). Si $f\'$ es carísima → Secante otra vez.',
        ],
      },
    ],
  };

  /* ============ PRACTICAR ============ */
  /* Pool de funciones sencillas con derivada limpia para preguntas frescas. */
  function fAleatoria(U) {
    const a = U.randInt(2, 9);
    return U.elegir([
      { f: 'x^2 - ' + a, df: '2x', x0: U.randInt(1, 3), nombre: '\\sqrt{' + a + '}' },
      { f: 'x^3 - ' + a, df: '3x^2', x0: U.randInt(1, 2), nombre: '\\sqrt[3]{' + a + '}' },
      { f: 'exp(x) - ' + a, df: 'exp(x)', x0: U.randInt(1, 2), nombre: '\\ln(' + a + ')' },
    ]);
  }

  NS.content.quizzes.newton = {
    generadores: [

      /* 1 · point-x: ¿dónde corta la tangente? (la pregunta insignia) */
      function (U) {
        const c = fAleatoria(U);
        const tr = NS.engines.newton({ f: c.f, df: c.df, x0: c.x0, tol: 1e-12, maxIter: 1 });
        const it = tr.steps.filter(function (s) { return s.type === 'iter'; })[0];
        const span = tr.plotHints ? (tr.plotHints.xmax - tr.plotHints.xmin) : 4;
        return {
          tipo: 'point-x', tema: 'geometria-tangente',
          enunciado: 'Con $f(x) = ' + c.f.replace(/\*/g, '') + '$ y $x_0 = ' + c.x0 + '$ (punto naranja): **¿dónde cortará al eje x la tangente en $x_0$?** Haz clic sobre el eje.',
          traza: tr, hastaPaso: 0,
          puntoX: it.state.xn, tolX: Math.max(0.1, span * 0.06),
          pista: 'La pendiente en el punto es $f\'(' + c.x0 + ') = ' + tex(tr.fns.df(c.x0), 4) + '$: baja desde $(x_0, f(x_0))$ siguiendo esa pendiente hasta cruzar el eje.',
          solucion: 'La tangente corta en $x_1 = x_0 - \\frac{f(x_0)}{f\'(x_0)} = ' + tex(it.state.xn, 5) + '$.',
        };
      },

      /* 2 · numeric: calcula x1 a mano */
      function (U) {
        const c = fAleatoria(U);
        const tr = NS.engines.newton({ f: c.f, df: c.df, x0: c.x0, tol: 1e-12, maxIter: 1 });
        const it = tr.steps.filter(function (s) { return s.type === 'iter'; })[0];
        return {
          tipo: 'numeric', tema: 'formula-newton',
          enunciado: 'Sea $f(x) = ' + c.f.replace(/\*/g, '') + '$, $f\'(x) = ' + c.df.replace(/\*/g, '') + '$ y $x_0 = ' + c.x0 + '$. Calcula **$x_1$** con la fórmula de Newton (3 decimales).',
          traza: null,
          respuesta: it.state.xn, tol: 0.005,
          pista: '$x_1 = x_0 - \\dfrac{f(x_0)}{f\'(x_0)} = ' + c.x0 + ' - \\dfrac{' + tex(it.state.fx, 4) + '}{' + tex(it.state.dfx, 4) + '}$',
          solucion: '$x_1 = ' + tex(it.state.xn, 6) + '$.',
        };
      },

      /* 3 · choice: la firma de la convergencia cuadrática */
      function (U) {
        const e = U.elegir([['10^{-3}', '10^{-6}', '10^{-4}', '5 \\cdot 10^{-3}'], ['10^{-2}', '10^{-4}', '10^{-3}', '5 \\cdot 10^{-2}'], ['10^{-4}', '10^{-8}', '10^{-5}', '10^{-2}']]);
        const ops = U.baraja([0, 1, 2]);
        const textos = ['$\\approx ' + e[1] + '$', '$\\approx ' + e[2] + '$', '$\\approx ' + e[3] + '$'];
        return {
          tipo: 'choice', tema: 'convergencia-cuadratica',
          enunciado: 'Newton va convergiendo a una raíz simple y el error actual es $\\approx ' + e[0] + '$. Tras la **próxima** iteración, el error será…',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: 'Convergencia cuadrática: $|e_{n+1}| \\approx C |e_n|^2$. ¿Qué pasa al elevar ' + e[0].replace(/\\cdot.*/, '') + ' al cuadrado?',
          solucion: 'Cuadrática significa $e_{n+1} \\sim e_n^2$: el exponente se duplica, ' + e[0] + ' → ' + e[1] + '. Los decimales correctos se duplican en cada paso.',
        };
      },

      /* 4 · choice: x0 en un extremo local */
      function (U) {
        const ops = U.baraja([0, 1, 2]);
        const textos = [
          'La tangente es casi horizontal y el salto sale **disparado lejos**',
          'Converge igual, solo que un poco más lento',
          'Se queda quieto en $x_0$ para siempre',
        ];
        return {
          tipo: 'choice', tema: 'extremo-local',
          enunciado: 'Colocas $x_0$ **muy cerca de un mínimo local** de $f$ (donde $f\'(x_0) \\approx 0$ pero $f(x_0) \\ne 0$). ¿Qué hace la primera iteración de Newton?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: 'Mira la fórmula: divides $f(x_0)$ entre $f\'(x_0) \\approx 0$…',
          solucion: 'Dividir por una pendiente casi nula produce un salto enorme: la tangente horizontal corta al eje lejísimos. Pruébalo en Explorar con el preset «Tangente horizontal».',
        };
      },

      /* 5 · choice: raíz múltiple */
      function (U) {
        const m = U.randInt(2, 3);
        const ops = U.baraja([0, 1, 2]);
        const textos = [
          'Converge, pero **lento** (lineal, ya no cuadrático)',
          'Diverge siempre',
          'Converge cuadrático como siempre',
        ];
        return {
          tipo: 'choice', tema: 'raiz-multiple',
          enunciado: '$f(x) = (x - 1)^' + m + '$ tiene una raíz de multiplicidad ' + m + ' en $x = 1$. Si aplicas Newton, ¿qué pasa?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: 'En una raíz múltiple también $f\'(\\alpha) = 0$: la hipótesis de la convergencia cuadrática se rompe.',
          solucion: 'Con raíz múltiple Newton se vuelve lineal con razón $1 - 1/m$. Remedio clásico: $x_{n+1} = x_n - m\\,f/f\'$.',
        };
      },
    ],
  };

  /* ============ RETOS ============ */
  NS.content.challenges.newton = [
    {
      id: 'tiro', nombre: 'Tiro de precisión', icono: '🎯',
      tipo: 'param-goal',
      desc: 'Elige x₀ para clavar la raíz de x³ − 2x + 2 en ≤ 4 iteraciones (tol 10⁻¹⁰). Cuidado: hay ciclos y despistes.',
      enunciado: 'La función $f(x) = x^3 - 2x + 2$ tiene UNA raíz real (cerca de $-1.77$)… y un campo de minas: desde $x_0 = 0$ Newton entra en ciclo, y cerca de $\\pm 0.816$ la tangente es horizontal. **Elige $x_0$ para converger con tol $10^{-10}$ en 4 iteraciones o menos.**',
      libres: ['x0'],
      fijos: { f: 'x^3 - 2x + 2', df: '3x^2 - 2', tol: '0.0000000001', maxIter: '30' },
      inicial: { x0: '0' },
      intentosMax: 3,
      plot: true,
      evalua: function (trace) {
        if (trace.status !== 'converged') {
          return { puntos: 0, msg: trace.status === 'maxIter' ? '💫 No convergió: ¿habrás caído en el ciclo?' : '💥 Se fue lejos: esa cuenca no era.' };
        }
        const it = trace.result.iters;
        if (it <= 4) return { puntos: 100, msg: '¡Convergió en ' + it + ' iteraciones! Puntería de francotirador.' };
        if (it <= 5) return { puntos: 80, msg: 'Convergió en ' + it + ' — rozando la diana.' };
        if (it <= 7) return { puntos: 60, msg: 'Convergió en ' + it + ' iteraciones. Acércate más a −1.77.' };
        return { puntos: 35, msg: 'Convergió, pero tras ' + it + ' iteraciones: demasiado paseo.' };
      },
    },
    {
      id: 'detective', nombre: 'Detective de derivadas', icono: '🕵️',
      tipo: 'apuesta',
      desc: 'Tres candidatas a f′ para f = x² − 5. Solo una es correcta: descúbrela por la VELOCIDAD.',
      pregunta: 'Para $f(x) = x^2 - 5$ te ofrecen tres derivadas. Con las tres, "Newton" converge a $\\sqrt{5}$… pero solo la correcta lo hace con velocidad cuadrática. **¿Cuál es la buena?** (gana la que converja en menos iteraciones)',
      candidatos: [
        { label: '$f\'(x) = x$', params: { f: 'x^2 - 5', df: 'x', x0: '3', tol: '0.0000000001', maxIter: '60' } },
        { label: '$f\'(x) = 2x$', params: { f: 'x^2 - 5', df: '2x', x0: '3', tol: '0.0000000001', maxIter: '60' } },
        { label: '$f\'(x) = 2x + 1$', params: { f: 'x^2 - 5', df: '2x + 1', x0: '3', tol: '0.0000000001', maxIter: '60' } },
      ],
      puntosAcierto: 100, puntosFallo: 25,
      moraleja: 'Con una derivada equivocada, la iteración sigue siendo un punto fijo válido… pero pierde la magia cuadrática: converge lineal. Por eso la VELOCIDAD delata a la derivada correcta.',
    },
  ];
})(globalThis.MNO = globalThis.MNO || {});
