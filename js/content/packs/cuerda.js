/* Pack de contenido: CUERDA / REGULA FALSI (teoría + Practicar + Retos). */
(function (NS) {
  'use strict';

  NS.content = NS.content || {};
  NS.content.theory = NS.content.theory || {};
  NS.content.quizzes = NS.content.quizzes || {};
  NS.content.challenges = NS.content.challenges || {};

  const tex = NS.num.tex;

  /* ============ TEORÍA ============ */
  NS.content.theory.cuerda = {
    secciones: [
      {
        titulo: 'La idea', icono: '💡',
        lineas: [
          'La bisección corta siempre por el centro, aunque $f(a)$ esté a un milímetro del eje y $f(b)$ a un kilómetro. La cuerda es más lista: **une $(a, f(a))$ con $(b, f(b))$ con una recta y corta por donde ESA recta cruza el eje**.',
          'Si $f$ es casi recta en el intervalo, ese corte cae casi encima de la raíz. Conserva la garantía del cambio de signo, pero apunta con conocimiento de causa.',
        ],
      },
      {
        titulo: 'Formulación', icono: '🧮',
        lineas: [
          '$c = a - f(a)\\,\\dfrac{b - a}{f(b) - f(a)}$',
          'Después, igual que en bisección: la mitad que conserva el cambio de signo sobrevive. Criterio de parada: $|f(c)| < \\varepsilon$.',
        ],
      },
      {
        titulo: 'Convergencia', icono: '📈',
        lineas: [
          'Lineal (orden 1), normalmente con mejor razón que el $\\tfrac{1}{2}$ de la bisección — cuanto más recta sea $f$ en el intervalo, más rápido.',
          'Fenómeno estrella: en funciones **convexas o cóncavas**, uno de los extremos se queda CLAVADO para siempre (el «extremo perezoso»). La longitud del intervalo NO tiende a cero… y sin embargo $c_n$ sí converge a la raíz.',
          'Por ese extremo perezoso, el criterio de parada correcto es $|f(c)| < \\varepsilon$, no la longitud del intervalo.',
        ],
      },
      {
        titulo: 'Ventajas y limitaciones', icono: '⚖️',
        lineas: [
          {
            tipo: 'vs',
            pros: [
              'Garantía de convergencia (mantiene el bracket, como bisección).',
              'Suele necesitar menos iteraciones que la bisección: usa los VALORES de $f$, no solo sus signos.',
              'Sin derivadas.',
            ],
            contras: [
              'Sigue siendo de orden 1: la secante y Newton la adelantan.',
              'El extremo perezoso puede hacerla LENTA en funciones muy curvadas.',
              'Pierde la cota de error a priori de la bisección (la longitud ya no mide el error).',
              'Necesita cambio de signo inicial.',
            ],
          },
        ],
      },
      {
        titulo: 'Errores típicos', icono: '🚫',
        lineas: [
          { tipo: 'error', texto: 'Parar cuando el intervalo es corto: con extremo perezoso, $b - a$ NUNCA se hace pequeño aunque $c$ ya esté clavado en la raíz. Mira el preset «Extremo perezoso».' },
          { tipo: 'error', texto: 'Confundirla con la secante: la SECANTE usa siempre los dos últimos puntos y puede escaparse del intervalo; la CUERDA conserva el cambio de signo a toda costa.' },
          { tipo: 'error', texto: 'Equivocar el signo en la fórmula: es $c = a - f(a)\\frac{b-a}{f(b)-f(a)}$; un signo cambiado te saca del intervalo (imposible en la cuerda bien hecha: $c$ SIEMPRE cae dentro).' },
          { tipo: 'error', texto: 'Aplicarla sin cambio de signo: sin bracket no hay red, igual que en bisección.' },
        ],
      },
      {
        titulo: '¿Cuándo usarla?', icono: '🧭',
        lineas: [
          'Cuando quieres la garantía del bracket pero la bisección te parece un caracol y no tienes derivada.',
          'Si la garantía no te importa → **secante** (más rápida). Si tienes $f\'$ → **Newton**. Si la función es salvaje → **bisección** a secas.',
        ],
      },
    ],
  };

  /* ============ PRACTICAR ============ */
  function casoAleatorio(U) {
    return U.elegir([
      { f: 'x^2 - ' + U.randInt(2, 9), a: 0, b: 3 },
      { f: 'cos(x) - x', a: 0, b: 1 },
      { f: 'x^3 - ' + U.randInt(2, 6), a: 0, b: 2 },
      { f: 'exp(x) - ' + U.randInt(2, 5), a: 0, b: 2 },
    ]);
  }

  NS.content.quizzes.cuerda = {
    generadores: [

      /* 1 · point-x: ¿dónde corta la cuerda? */
      function (U) {
        const c = casoAleatorio(U);
        const tr = NS.engines.cuerda({ f: c.f, a: c.a, b: c.b, tol: 1e-8, maxIter: 50 });
        const it = tr.steps.filter(function (s) { return s.type === 'iter'; })[0];
        const span = tr.plotHints.xmax - tr.plotHints.xmin;
        return {
          tipo: 'point-x', tema: 'geometria-cuerda',
          enunciado: 'Cuerda sobre $f(x) = ' + c.f + '$ en $[' + c.a + ', ' + c.b + ']$: ves los dos extremos marcados. **¿Dónde cortará al eje la recta que los une?** Haz clic sobre el eje.',
          traza: tr, hastaPaso: 0,
          puntoX: it.state.c, tolX: Math.max(0.1, span * 0.06),
          pista: 'Imagina la regla apoyada en $(a, ' + tex(it.state.fa, 3) + ')$ y $(b, ' + tex(it.state.fb, 3) + ')$: cae más cerca del extremo con $|f|$ pequeño.',
          solucion: '$c = a - f(a)\\frac{b-a}{f(b)-f(a)} = ' + tex(it.state.c, 6) + '$ — siempre más escorado hacia el extremo con menor $|f|$.',
        };
      },

      /* 2 · numeric: calcula c a mano */
      function (U) {
        const c = casoAleatorio(U);
        const tr = NS.engines.cuerda({ f: c.f, a: c.a, b: c.b, tol: 1e-8, maxIter: 50 });
        const it = tr.steps.filter(function (s) { return s.type === 'iter'; })[0];
        return {
          tipo: 'numeric', tema: 'formula-cuerda',
          enunciado: 'Con $a = ' + c.a + '$, $b = ' + c.b + '$, $f(a) = ' + tex(it.state.fa, 4) + '$ y $f(b) = ' + tex(it.state.fb, 4) + '$: calcula el corte de la cuerda $c$ (3 decimales).',
          traza: null,
          respuesta: it.state.c, tol: 0.005,
          pista: '$c = a - f(a)\\,\\dfrac{b - a}{f(b) - f(a)}$ — cuidado con los signos del denominador.',
          solucion: '$c = ' + tex(it.state.c, 6) + '$.',
        };
      },

      /* 3 · choice: el extremo perezoso */
      function (U) {
        const c = U.elegir([
          { f: 'x^3 - 2', a: 0, b: 2 },
          { f: 'x^3 - 5', a: 0, b: 2 },
          { f: 'exp(x) - 4', a: 0, b: 2 },
        ]);
        const tr = NS.engines.cuerda({ f: c.f, a: c.a, b: c.b, tol: 1e-10, maxIter: 25 });
        const iters = tr.steps.filter(function (s) { return s.type === 'iter'; });
        const ult = iters[iters.length - 1];
        /* qué extremo quedó clavado: compara con el inicial */
        const aFijo = Math.abs(ult.state.a - c.a) < 1e-12;
        const bFijo = Math.abs(ult.state.b - c.b) < 1e-12;
        const correcta = aFijo ? 0 : (bFijo ? 1 : 2);
        return {
          tipo: 'choice', tema: 'extremo-perezoso',
          enunciado: 'Aplicas la cuerda a $f(x) = ' + c.f + '$ en $[' + c.a + ', ' + c.b + ']$ (función de curvatura fija en ese tramo). Tras varias iteraciones, ¿qué extremo se habrá quedado **clavado sin moverse**?',
          traza: null,
          opciones: ['El extremo $a = ' + c.a + '$', 'El extremo $b = ' + c.b + '$', 'Ninguno: ambos se van moviendo'],
          correcta: correcta,
          pista: 'En una función convexa (∪), la cuerda queda POR ENCIMA de la curva: el corte $c$ cae siempre del mismo lado de la raíz… y el otro extremo no se toca.',
          solucion: 'Queda fijo ' + (correcta === 0 ? '$a$' : '$b$') + ': el nuevo punto $c$ siempre sustituye al mismo lado. Por eso la anchura del intervalo NO tiende a cero y el criterio de parada es $|f(c)| < \\varepsilon$.',
        };
      },

      /* 4 · choice: el criterio de parada correcto */
      function () {
        return {
          tipo: 'choice', tema: 'criterio-parada',
          enunciado: 'En la cuerda, ¿por qué NO sirve parar cuando la longitud del intervalo es pequeña ($\\frac{b-a}{2} < \\varepsilon$, como en bisección)?',
          traza: null,
          opciones: [
            'Porque un extremo puede quedarse fijo para siempre y la longitud nunca baja, aunque $c$ ya esté clavado en la raíz',
            'Porque la cuerda agranda el intervalo en cada iteración',
            'Sí sirve: es el mismo criterio de la bisección',
          ],
          correcta: 0,
          pista: 'Piensa en el «extremo perezoso» de una función convexa…',
          solucion: 'Con extremo perezoso, $b - a$ se estanca aunque la sucesión $c_n$ converja. Por eso se usa $|f(c)| < \\varepsilon$: mide lo que de verdad importa.',
        };
      },
    ],
  };

  /* ============ RETOS ============ */
  NS.content.challenges.cuerda = [
    {
      id: 'duelo', nombre: '¿Qué bracket gana?', icono: '🥊',
      tipo: 'apuesta',
      desc: 'Tres intervalos iniciales para la misma raíz de x³ = 2. ¿Cuál converge en menos iteraciones?',
      pregunta: 'Vas a resolver $x^3 - 2 = 0$ (raíz $\\sqrt[3]{2} \\approx 1.26$) con la cuerda y tol $10^{-4}$. Tres intervalos iniciales encierran la raíz: **¿cuál convergerá en MENOS iteraciones?**',
      candidatos: [
        { label: '$[0,\\ 2]$ — el ancho clásico', params: { f: 'x^3 - 2', a: '0', b: '2', tol: '0.0001', maxIter: '60' } },
        { label: '$[1,\\ 1.5]$ — ajustado', params: { f: 'x^3 - 2', a: '1', b: '1.5', tol: '0.0001', maxIter: '60' } },
        { label: '$[1.2,\\ 1.3]$ — de francotirador', params: { f: 'x^3 - 2', a: '1.2', b: '1.3', tol: '0.0001', maxIter: '60' } },
      ],
      puntosAcierto: 100, puntosFallo: 25,
      moraleja: 'En un tramo corto, la curva es casi recta y la cuerda acierta casi a la primera. Bracket estrecho = función «casi lineal» = cuerda letal.',
    },
    {
      id: 'punteria', nombre: 'Puntería con la cuerda', icono: '🏹',
      tipo: 'param-goal',
      desc: 'Elige [a, b] para cazar la raíz de eˣ = 3 en muy pocas iteraciones (tol 10⁻⁵).',
      enunciado: '$f(x) = e^x - 3$ tiene su raíz en $\\ln 3 \\approx 1.0986$. Con tol $10^{-5}$: **elige $[a, b]$ (con cambio de signo) para converger en las mínimas iteraciones posibles**. La curvatura de $e^x$ te va a hacer la puñeta con un extremo…',
      libres: ['a', 'b'],
      fijos: { f: 'exp(x) - 3', tol: '0.00001', maxIter: '60' },
      inicial: { a: '0', b: '3' },
      intentosMax: 3,
      plot: true,
      evalua: function (trace) {
        if (trace.status === 'error') return { puntos: 0, msg: '⛔ Sin cambio de signo: $e^a - 3$ y $e^b - 3$ deben tener signos opuestos.' };
        if (trace.status !== 'converged') return { puntos: 5, msg: 'No convergió en el máximo de iteraciones.' };
        const it = trace.result.iters;
        if (it <= 4) return { puntos: 100, msg: '¡' + it + ' iteraciones! En un tramo tan corto la exponencial parece una recta.' };
        if (it <= 6) return { puntos: 80, msg: it + ' iteraciones — muy fino. ¿Aún más cerca de 1.0986?' };
        if (it <= 9) return { puntos: 60, msg: it + ' iteraciones. La curvatura clava un extremo: estrecha el intervalo.' };
        return { puntos: 35, msg: it + ' iteraciones: el extremo perezoso te ha frenado. Prueba un bracket mucho más ceñido.' };
      },
    },
  ];
})(globalThis.MNO = globalThis.MNO || {});
