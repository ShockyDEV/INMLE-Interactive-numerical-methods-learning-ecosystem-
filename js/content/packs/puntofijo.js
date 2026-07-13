/* Pack de contenido: PUNTO FIJO (teoría + Practicar + Retos). */
(function (NS) {
  'use strict';

  NS.content = NS.content || {};
  NS.content.theory = NS.content.theory || {};
  NS.content.quizzes = NS.content.quizzes || {};
  NS.content.challenges = NS.content.challenges || {};

  const tex = NS.num.tex;

  /* ============ TEORÍA ============ */
  NS.content.theory.puntofijo = {
    secciones: [
      {
        titulo: 'La idea', icono: '💡',
        lineas: [
          'Reescribe tu ecuación $f(x) = 0$ como $x = g(x)$ y conviértela en una máquina de reciclar: metes un número, sale $g$ de ese número, lo vuelves a meter… Si la máquina se estabiliza, has encontrado un **punto fijo**: un $\\beta$ con $g(\\beta) = \\beta$.',
          'En la gráfica, los puntos fijos son los cruces de $y = g(x)$ con la diagonal $y = x$, y la iteración dibuja la famosa **telaraña**: vertical hasta la curva, horizontal hasta la diagonal, y vuelta a empezar.',
        ],
      },
      {
        titulo: 'Formulación', icono: '🧮',
        lineas: [
          '$x_{n+1} = g(x_n)$, parando cuando $|x_{n+1} - x_n| < \\varepsilon$.',
          'De un mismo $f(x) = 0$ salen INFINITOS despejes $g$: $x^2 = 3$ da $g = 3/x$, $g = x - \\frac{x^2-3}{4}$, $g = \\frac{1}{2}(x + 3/x)$… Todos son álgebra válida, pero cada uno itera de forma completamente distinta.',
        ],
      },
      {
        titulo: 'Convergencia', icono: '📈',
        lineas: [
          'Teorema clave: si $|g\'(\\beta)| < 1$, el punto fijo **atrae** (converge localmente); si $|g\'(\\beta)| > 1$, **repele** (diverge). La razón de convergencia es exactamente $|g\'(\\beta)|$: cuanto más plana la curva al cruzar la diagonal, más rápido.',
          'El signo de $g\'$ dibuja: $0 < g\' < 1$ → escalera directa; $-1 < g\' < 0$ → **espiral** que alterna lados (¡tu error cambia de signo en cada paso!).',
          'El cociente $|x_{n+1}-x_n| / |x_n - x_{n-1}|$ tiende a $|g\'(\\beta)|$: la app lo muestra en cada paso — es un medidor experimental de velocidad.',
          'Caso de lujo: si $g\'(\\beta) = 0$ la convergencia se vuelve cuadrática. Newton no es más que un punto fijo diseñado para lograr exactamente eso.',
        ],
      },
      {
        titulo: 'Ventajas y limitaciones', icono: '⚖️',
        lineas: [
          {
            tipo: 'vs',
            pros: [
              'Marco conceptual de TODOS los métodos iterativos (Newton, Jacobi y Gauss-Seidel son puntos fijos).',
              'Baratísimo: una evaluación de $g$ por iteración.',
              'La telaraña hace VISIBLE la convergencia y su velocidad.',
            ],
            contras: [
              'Todo depende de elegir bien $g$: un mal despeje diverge.',
              'Convergencia solo local y lineal en general.',
              'Puede ciclar u oscilar eternamente si $|g\'(\\beta)| = 1$.',
              'Encontrar la cuenca de atracción correcta puede ser un arte.',
            ],
          },
        ],
      },
      {
        titulo: 'Errores típicos', icono: '🚫',
        lineas: [
          { tipo: 'error', texto: 'Creer que cualquier despeje algebraico sirve: $g = x^2$ y $g = \\sqrt{x+2}$ pueden venir de ecuaciones parecidas y comportarse como el día y la noche. SIEMPRE mira $|g\'(\\beta)|$ (reto «Elige tu g(x)»).' },
          { tipo: 'error', texto: 'Confundir la raíz de $f$ con el punto fijo de $g$: el punto fijo cumple $g(\\beta) = \\beta$, no $g(\\beta) = 0$. En la gráfica se busca el cruce con la DIAGONAL, no con el eje.' },
          { tipo: 'error', texto: 'Pensar que «más pendiente = más velocidad»: es al revés, la velocidad la da $|g\'|$ PEQUEÑO. La g más rápida es la más plana al cruzar la diagonal.' },
          { tipo: 'error', texto: 'Ignorar la cuenca de atracción: con $g = x^2$, desde $x_0 = 0.9$ caes al punto fijo 0, y desde $x_0 = 1.1$ sales disparado al infinito (presets «Cuenca» y «Diverge»).' },
        ],
      },
      {
        titulo: '¿Cuándo usarlo?', icono: '🧭',
        lineas: [
          'Cuando el problema YA viene en forma $x = g(x)$ (ecuaciones de balance, ecuaciones implícitas, iteraciones de consenso) o cuando puedes diseñar una $g$ con $|g\'|$ pequeño.',
          'Como lente teórica: entender punto fijo es entender POR QUÉ Newton es cuadrático y por qué Jacobi/Gauss-Seidel convergen. Es la gramática de los métodos iterativos.',
        ],
      },
    ],
  };

  /* ============ PRACTICAR ============ */
  const POOL = [
    { g: 'cos(x)', x0min: 0, x0max: 1 },
    { g: 'sqrt(x + 2)', x0min: 0, x0max: 1.5 },
    { g: 'exp(-x)', x0min: 0.2, x0max: 0.9 },
  ];

  NS.content.quizzes.puntofijo = {
    generadores: [

      /* 1 · choice: ¿converge y cómo, según |g'|? */
      function (U) {
        const K = U.elegir([0.1, 0.95, 1.3, 2.5]);
        const correcta = K < 0.5 ? 0 : (K < 1 ? 1 : 2);
        return {
          tipo: 'choice', tema: 'condicion-convergencia',
          enunciado: 'Cerca del punto fijo $\\beta$ se sabe que $|g\'(\\beta)| = ' + K + '$. Si arrancas suficientemente cerca, la iteración $x_{n+1} = g(x_n)$…',
          traza: null,
          opciones: [
            'Converge, y RÁPIDO (el error se multiplica por ' + K + ' en cada paso)',
            'Converge, pero MUY despacio (el error apenas baja: factor ' + K + ')',
            'Diverge: el punto fijo repele',
          ],
          correcta: correcta,
          pista: 'La frontera mágica es $|g\'(\\beta)| = 1$: por debajo atrae, por encima repele. Y el propio valor ES el factor de reducción del error.',
          solucion: 'Con $|g\'(\\beta)| = ' + K + '$ ' + (K < 1 ? 'el error se multiplica por ' + K + ' en cada iteración: converge ' + (K < 0.5 ? 'a buen ritmo.' : 'pero arrastrándose.') : 'cada paso ALEJA el iterado: divergencia garantizada por cerca que empieces.'),
        };
      },

      /* 2 · choice: ¿cuál converge más rápido? */
      function (U) {
        const vals = U.baraja([0.2, 0.9, 1.3]);
        const correcta = vals.indexOf(0.2);
        return {
          tipo: 'choice', tema: 'mas-pendiente-mas-rapido',
          enunciado: 'Tres despejes de la misma ecuación tienen $|g\'(\\beta)|$ = ' + vals.join(', ') + ' respectivamente. ¿Cuál converge **MÁS RÁPIDO**?',
          traza: null,
          opciones: vals.map(function (v) { return 'El de $|g\'(\\beta)| = ' + v + '$'; }),
          correcta: correcta,
          pista: 'El error se multiplica por $|g\'(\\beta)|$ en cada paso: ¿quieres multiplicarlo por mucho o por poco?',
          solucion: 'Gana $0.2$: en cada iteración el error queda en un 20%. El de $0.9$ converge a paso de tortuga y el de $1.3$ directamente diverge. **Menor $|g\'|$ = más velocidad** (y $g\' = 0$ es Newton).',
        };
      },

      /* 3 · point-x: ¿a dónde salta la siguiente iteración? */
      function (U) {
        const c = U.elegir(POOL);
        const x0 = NS.num.R(U.rand(c.x0min, c.x0max), 2);
        const tr = NS.engines.puntofijo({ g: c.g, x0: x0, tol: 1e-7, maxIter: 60 });
        const iters = tr.steps.filter(function (s) { return s.type === 'iter'; });
        const k = U.randInt(2, Math.min(4, iters.length - 1));
        const paso = iters[k - 1];
        const sig = iters[k];
        const span = tr.plotHints ? (tr.plotHints.xmax - tr.plotHints.xmin) : 2;
        return {
          tipo: 'point-x', tema: 'lectura-telarana',
          enunciado: 'Telaraña de $g(x) = ' + c.g + '$: vas por $x_{' + k + '} = ' + tex(paso.state.xn, 4) + '$. **¿A qué valor saltará $x_{' + (k + 1) + '}$?** Haz clic sobre el eje horizontal.',
          traza: tr, hastaPaso: paso.i,
          puntoX: sig.state.xn, tolX: Math.max(0.07, span * 0.06),
          pista: 'Sube (o baja) en vertical desde el punto actual hasta la curva $g$: la ALTURA que encuentres es el siguiente $x$.',
          solucion: '$x_{' + (k + 1) + '} = g(' + tex(paso.state.xn, 4) + ') = ' + tex(sig.state.xn, 5) + '$ — en la telaraña: vertical a la curva, horizontal a la diagonal.',
        };
      },

      /* 4 · numeric: calcula x1 */
      function (U) {
        const c = U.elegir(POOL);
        const x0 = NS.num.R(U.rand(c.x0min, c.x0max), 2);
        const tr = NS.engines.puntofijo({ g: c.g, x0: x0, tol: 1e-7, maxIter: 5 });
        const it = tr.steps.filter(function (s) { return s.type === 'iter'; })[0];
        return {
          tipo: 'numeric', tema: 'formula-punto-fijo',
          enunciado: 'Con $g(x) = ' + c.g + '$ y $x_0 = ' + x0 + '$: calcula $x_1 = g(x_0)$ (4 decimales).',
          traza: null,
          respuesta: it.state.xn, tol: 0.001,
          pista: 'Solo hay que evaluar: $x_1 = g(' + x0 + ')$. Calculadora en mano (o el Laboratorio 🧪).',
          solucion: '$x_1 = ' + tex(it.state.xn, 6) + '$.',
        };
      },

      /* 5 · choice: espiral o escalera */
      function (U) {
        const esp = U.elegir([true, false]);
        return {
          tipo: 'choice', tema: 'espiral-vs-escalera',
          enunciado: 'Cerca del punto fijo, ' + (esp ? '$g\'(\\beta) = -0.6$ (negativa)' : '$g\'(\\beta) = 0.6$ (positiva)') + '. ¿Qué dibuja la telaraña al converger?',
          traza: null,
          opciones: [
            'Una **espiral**: los iterados alternan a un lado y a otro de $\\beta$',
            'Una **escalera**: los iterados se acercan siempre por el mismo lado',
            'Una recta vertical: se queda quieto',
          ],
          correcta: esp ? 0 : 1,
          pista: 'El signo de $g\'$ decide si el error CAMBIA de signo en cada paso o lo conserva.',
          solucion: esp
            ? 'Con $g\' < 0$ el error alterna de signo: espiral. Ventaja oculta: la raíz queda SIEMPRE entre dos iterados consecutivos (¡bracket gratis!). Preset «Espiral: cos(x)».'
            : 'Con $0 < g\' < 1$ el error conserva el signo: escalera directa por un solo lado. Preset «Escalera: √(x+2)».',
        };
      },
    ],
  };

  /* ============ RETOS ============ */
  NS.content.challenges.puntofijo = [
    {
      id: 'eligeg', nombre: 'Elige tu g(x)', icono: '🎲',
      tipo: 'apuesta',
      desc: 'Cuatro despejes de x² = 3, cuatro destinos: rapidísimo, lento, cíclico y explosivo. Apuesta antes de verlos correr.',
      pregunta: 'Para resolver $x^2 = 3$ (es decir, hallar $\\sqrt{3} \\approx 1.732$) te ofrecen CUATRO despejes de la forma $x = g(x)$, todos algebraicamente impecables. Desde $x_0 = 1.5$: **¿cuál converge en MENOS iteraciones?**',
      candidatos: [
        { label: '$g(x) = \\frac{1}{2}\\left(x + \\frac{3}{x}\\right)$', params: { g: '(x + 3/x)/2', x0: '1.5', tol: '0.0000001', maxIter: '80' } },
        { label: '$g(x) = x - \\frac{x^2 - 3}{4}$', params: { g: 'x - (x^2 - 3)/4', x0: '1.5', tol: '0.0000001', maxIter: '80' } },
        { label: '$g(x) = \\frac{3}{x}$', params: { g: '3/x', x0: '1.5', tol: '0.0000001', maxIter: '80' } },
        { label: '$g(x) = x^2 + x - 3$', params: { g: 'x^2 + x - 3', x0: '1.5', tol: '0.0000001', maxIter: '80' } },
      ],
      puntosAcierto: 100, puntosFallo: 25,
      moraleja: 'Los cuatro cumplen $g(\\sqrt{3}) = \\sqrt{3}$, pero sus derivadas en la raíz son 0, 0.13, −1 y 4.46: convergencia cuadrática (¡es Herón/Newton disfrazado!), convergencia rápida, ciclo perpetuo y explosión. La g no se elige por estética: se elige por $|g\'(\\beta)|$.',
    },
    {
      id: 'zonasegura', nombre: 'Zona segura', icono: '🧗',
      tipo: 'param-goal',
      desc: 'g(x) = x² tiene una cuenca de atracción con borde en |x| = 1. Converge… acercándote al precipicio todo lo que te atrevas.',
      enunciado: '$g(x) = x^2$ tiene dos puntos fijos: $0$ (atractor, $g\'(0) = 0$) y $1$ (repulsor, $g\'(1) = 2$). Desde $|x_0| < 1$ caes a 0; desde $|x_0| > 1$ sales disparado al infinito. **Elige un $x_0$ que converja… lo MÁS CERCA posible del borde de la cuenca** (más cerca del precipicio = más puntos).',
      libres: ['x0'],
      fijos: { g: 'x^2', tol: '0.0001', maxIter: '60' },
      inicial: { x0: '1.05' },
      intentosMax: 3,
      plot: true,
      evalua: function (trace) {
        const x0 = Math.abs(+trace.inputs.x0);
        if (trace.status === 'diverged' || (trace.status === 'maxIter' && x0 >= 1)) {
          return { puntos: 10, msg: '💥 |x₀| = ' + NS.num.fmt(x0, 4) + ' ≥ 1: fuera de la cuenca, la telaraña escapa en espiral hacia el infinito.' };
        }
        if (trace.status !== 'converged') return { puntos: 20, msg: 'No llegó a converger en 60 iteraciones (los bordes de la cuenca son lentíiiisimos).' };
        if (x0 >= 0.99) return { puntos: 100, msg: '🏆 |x₀| = ' + NS.num.fmt(x0, 4) + ': funambulismo sobre el borde de la cuenca. Cada iteración eleva al cuadrado… y aun así caes hacia 0.' };
        if (x0 >= 0.9) return { puntos: 85, msg: '|x₀| = ' + NS.num.fmt(x0, 4) + ': muy valiente. ¿Te atreves con 0.99?' };
        if (x0 >= 0.7) return { puntos: 65, msg: '|x₀| = ' + NS.num.fmt(x0, 4) + ': converge de sobra — el borde está en |x₀| = 1, acércate más.' };
        return { puntos: 45, msg: '|x₀| = ' + NS.num.fmt(x0, 4) + ': demasiado cómodo, lejos del precipicio. El reto es rozar el 1.' };
      },
    },
  ];
})(globalThis.MNO = globalThis.MNO || {});
