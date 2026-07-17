/* Pack de contenido: HERMITE — diferencias divididas generalizadas. */
(function (NS) {
  'use strict';

  NS.content = NS.content || {};
  NS.content.theory = NS.content.theory || {};
  NS.content.quizzes = NS.content.quizzes || {};
  NS.content.challenges = NS.content.challenges || {};

  const tex = NS.num.tex;

  /* ============ TEORÍA ============ */
  NS.content.theory.hermite = {
    secciones: [
      {
        titulo: 'La idea', icono: '',
        lineas: [
          'A veces sabes más que el valor de $f$ en cada punto: conoces también su PENDIENTE (velocidad y posición de un móvil, por ejemplo). Hermite interpola **valores Y derivadas**: la curva no solo pasa por tus puntos — sale de ellos con el ángulo correcto.',
          'El truco es de una elegancia criminal: se **repite cada nodo** tantas veces como datos aporte, y donde la tabla de diferencias divididas explotaría ($\\frac{0}{0}$), se enchufa el dato de derivada. La maquinaria de Newton hace el resto sin enterarse.',
        ],
      },
      {
        titulo: 'Formulación', icono: '',
        lineas: [
          'Nodos expandidos: $x_0, x_0, x_1, x_1, \\ldots$ (cada uno repetido según sus datos). La tabla generalizada usa la regla habitual salvo cuando los nodos extremos COINCIDEN: $f[x_i, \\ldots, x_{i+k}] = \\dfrac{f^{(k)}(x_i)}{k!}$ (con nodos iguales, el cociente se sustituye por la derivada).',
          'Convenio de esta app (y del curso): los datos se introducen ya divididos, $f,\\ \\frac{f\'}{1!},\\ \\frac{f\'\'}{2!}, \\ldots$',
          'Con $n$ valores y $n$ derivadas: polinomio único de grado $\\le 2n - 1$ (2 puntos con pendiente → cúbica, la base de las splines cúbicas de Hermite).',
        ],
      },
      {
        titulo: 'El error', icono: '',
        lineas: [
          'Análogo a Lagrange pero con los nodos por duplicado: $f(x) - P(x) = \\dfrac{f^{(2n)}(\\xi)}{(2n)!} \\prod_i (x - x_i)^2$.',
          'El cuadrado en el producto cuenta la historia: cerca de cada nodo el error muere DOS veces más rápido — la curva no solo toca, se ADHIERE.',
          'Mismo demonio que siempre en grados altos: oscilaciones tipo Runge. Por eso en la práctica Hermite brilla A TROZOS (splines de Hermite: cada tramo cúbico con sus dos puntos y sus dos pendientes).',
        ],
      },
      {
        titulo: 'Ventajas y limitaciones', icono: '',
        lineas: [
          {
            tipo: 'vs',
            pros: [
              'Aprovecha información de derivadas: el doble de datos por nodo.',
              'La curva reproduce valor Y tangente: ajuste visualmente perfecto.',
              'Reutiliza toda la maquinaria de diferencias divididas.',
              'Base de las splines cúbicas de Hermite y de la animación por keyframes.',
            ],
            contras: [
              'Necesitas las derivadas (medirlas o calcularlas).',
              'Grado $2n-1$: se dispara rápido → oscilaciones si abusas.',
              'La contabilidad de la tabla (qué celda es derivada, cuál cociente) exige pulcritud.',
            ],
          },
        ],
      },
      {
        titulo: 'Errores típicos', icono: '',
        lineas: [
          { tipo: 'error', texto: 'Aplicar el cociente donde tocaba la regla de derivada (o al revés): la regla especial se usa EXACTAMENTE cuando los nodos extremos de la celda coinciden. En la tabla de la app esas celdas van en rosa.' },
          { tipo: 'error', texto: 'Olvidar el factorial: el dato que entra en la tabla de orden $k$ es $f^{(k)}/k!$. Con segunda derivada, hay que dividir entre 2 (el convenio de la app ya lo asume en la entrada).' },
          { tipo: 'error', texto: 'Repetir mal los nodos: un nodo con $f$, $f\'$ y $f\'\'$ aparece TRES veces en la lista expandida. La cuenta de repeticiones = la cuenta de datos.' },
          { tipo: 'error', texto: 'Creer que el grado es $n - 1$ como en Lagrange: con $n$ nodos dobles hay $2n$ datos → grado $\\le 2n - 1$.' },
        ],
      },
      {
        titulo: '¿Cuándo usarlo?', icono: '',
        lineas: [
          'Cuando tienes pendientes de verdad: cinemática (posición + velocidad), diseño de curvas y animación (keyframes con tangentes), soluciones de EDOs con derivada conocida.',
          'Solo valores → Newton/Lagrange. Muchos puntos → splines cúbicas (que por dentro son… Hermite a trozos).',
        ],
      },
    ],
  };

  /* ============ PRACTICAR ============ */
  NS.content.quizzes.hermite = {
    generadores: [

      /* 1 · choice: cuándo actúa la regla especial */
      function (U) {
        const ops = U.baraja([0, 1, 2]);
        const textos = [
          'Cuando los nodos EXTREMOS de la celda coinciden (el cociente sería 0/0)',
          'Siempre en la primera columna de la tabla',
          'Nunca: la tabla generalizada usa siempre el cociente',
        ];
        return {
          tipo: 'choice', tema: 'regla-derivada',
          enunciado: 'En la tabla de diferencias divididas GENERALIZADAS de Hermite, ¿cuándo se sustituye el cociente por el dato de derivada?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: '¿Qué pasaría con el denominador $x_{i+k} - x_i$ si esos dos nodos son el mismo?',
          solucion: 'Cuando $x_{i+k} = x_i$ el cociente es $\\frac{0}{0}$… y el límite de la diferencia dividida es precisamente $\\frac{f^{(k)}(x_i)}{k!}$: ahí entra el dato de derivada (celdas destacadas en rojo en Explorar).',
        };
      },

      /* 2 · numeric: el grado de Hermite */
      function (U) {
        const n = U.randInt(2, 4);
        return {
          tipo: 'numeric', tema: 'grado-hermite',
          enunciado: 'Interpolas $' + n + '$ puntos con su VALOR y su DERIVADA en cada uno ($' + (2 * n) + '$ datos en total). El polinomio de Hermite tiene grado a lo sumo…',
          traza: null,
          respuesta: 2 * n - 1, tol: 0.4,
          pista: 'Regla de oro: grado ≤ (número de datos) − 1. ¿Cuántos datos tienes?',
          solucion: 'Grado $\\le 2 \\cdot ' + n + ' - 1 = ' + (2 * n - 1) + '$. (El clásico despiste es contestar $' + (n - 1) + '$, olvidando que las derivadas también son datos.)',
        };
      },

      /* 3 · choice: la tangencia exacta */
      function (U) {
        const ops = U.baraja([0, 1, 2]);
        const textos = [
          'EXACTAMENTE $f\'(x_0)$: Hermite interpola valores y derivadas',
          'Aproximadamente $f\'(x_0)$, con un pequeño error',
          'No se puede saber sin construir la tabla',
        ];
        return {
          tipo: 'choice', tema: 'tangencia',
          enunciado: 'Construyes el polinomio de Hermite $P$ con datos de $f$ y $f\'$ en $x_0$. ¿Cuánto vale $P\'(x_0)$?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: '¿Qué significa «interpolar la derivada»?',
          solucion: '$P\'(x_0) = f\'(x_0)$ EXACTO, igual que $P(x_0) = f(x_0)$. La curva sale del punto con el ángulo verdadero: por eso «abraza» a $f$ en vez de solo tocarla.',
        };
      },

      /* 4 · numeric: la celda de derivada, con datos reales */
      function (U) {
        const f0 = U.randInt(-3, 3), d0 = U.randInt(-3, 3) || 1, f1 = U.randInt(-3, 3), d1 = U.randInt(-3, 3);
        const tr = NS.engines.hermite({ nodes: [0, 0, 1, 1], values: [f0, d0, f1, d1], evalXs: [] });
        return {
          tipo: 'numeric', tema: 'celda-derivada',
          enunciado: 'Hermite con nodos expandidos $\\{0, 0, 1, 1\\}$ y datos $\\{f(0) = ' + f0 + ',\\ f\'(0) = ' + d0 + ',\\ f(1) = ' + f1 + ',\\ f\'(1) = ' + d1 + '\\}$. ¿Cuánto vale la celda $f[x_0, x_1] = f[0, 0]$ de la tabla?',
          traza: null,
          respuesta: tr.result.tabla[0][1], tol: 0.005,
          pista: 'Los nodos coinciden (0 y 0): no hay cociente que valga — entra el dato directamente.',
          solucion: '$f[0, 0] = f\'(0) = ' + tex(tr.result.tabla[0][1], 4) + '$: celda de regla especial (destacada en rojo en la app).',
        };
      },

      /* 5 · choice: el porqué del factorial */
      function (U) {
        const ops = U.baraja([0, 1, 2]);
        const textos = [
          'Porque la diferencia dividida de orden $k$ con nodos repetidos tiende a $\\frac{f^{(k)}}{k!}$, no a $f^{(k)}$ a secas',
          'Por convención histórica, sin significado',
          'Para que los números queden más pequeños y no desborden',
        ];
        return {
          tipo: 'choice', tema: 'factorial',
          enunciado: 'Al introducir una segunda derivada en la tabla generalizada se usa $\\frac{f\'\'}{2!}$, no $f\'\'$. ¿Por qué?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: 'Recuerda el teorema: $f[x_0, \\ldots, x_k] = \\frac{f^{(k)}(\\xi)}{k!}$…',
          solucion: 'Las diferencias divididas SON derivadas divididas por factoriales: $f[\\underbrace{x_0, \\ldots, x_0}_{k+1}] = \\frac{f^{(k)}(x_0)}{k!}$. Es la misma razón por la que Taylor lleva sus factoriales — de hecho, Hermite con un único nodo repetido ES el polinomio de Taylor.',
        };
      },
    ],
  };

  /* ============ RETOS ============ */
  NS.content.challenges.hermite = [
    {
      id: 'trampas', nombre: 'Tabla con trampas', icono: '',
      tipo: 'quiz-serie',
      desc: 'Una tabla generalizada mezcla celdas-cociente y celdas-derivada. Identifica la regla y calcula sin caer en las trampas.',
      n: 5,
      generadores: [
        function (U) {
          const ops = U.baraja([0, 1]);
          const textos = ['Regla de DERIVADA: los nodos extremos coinciden (0 y 0)', 'Cociente normal: los nodos extremos difieren'];
          void U;
          return {
            tipo: 'choice', tema: 'trampas',
            enunciado: 'Nodos expandidos $\\{0, 0, 1, 1\\}$. La celda $f[x_0, x_1] = f[0, 0]$… ¿qué regla usa?',
            opciones: ops.map(function (i) { return textos[i]; }),
            correcta: ops.indexOf(0),
            pista: 'Mira los nodos EXTREMOS del tramo de la celda: $x_0 = 0$ y $x_1 = 0$.',
            solucion: 'Extremos iguales (0 = 0) → regla de derivada: $f[0,0] = f\'(0)$.',
          };
        },
        function (U) {
          const f0 = U.randInt(-3, 3), d0 = U.randInt(-2, 2) || 1, f1 = U.randInt(-3, 3), d1 = U.randInt(-2, 2);
          const tr = NS.engines.hermite({ nodes: [0, 0, 1, 1], values: [f0, d0, f1, d1], evalXs: [] });
          return {
            tipo: 'numeric', tema: 'trampas',
            enunciado: 'Datos: $f(0) = ' + f0 + '$, $f\'(0) = ' + d0 + '$, $f(1) = ' + f1 + '$, $f\'(1) = ' + d1 + '$. La celda $f[x_1, x_2] = f[0, 1]$ (¡extremos distintos!): calcúlala (3 decimales).',
            respuesta: tr.result.tabla[1][1], tol: 0.005,
            pista: 'Extremos 0 y 1, distintos → cociente normal: $\\dfrac{f(1) - f(0)}{1 - 0}$. ¡No uses la derivada aquí: esa es la trampa!',
            solucion: '$f[0, 1] = \\dfrac{' + f1 + ' - (' + f0 + ')}{1} = ' + tex(tr.result.tabla[1][1], 4) + '$ — cociente, porque los extremos difieren aunque haya nodos repetidos por medio.',
          };
        },
        function (U) {
          const ops = U.baraja([0, 1]);
          const textos = ['Regla de DERIVADA: extremos iguales (1 y 1) → $f\'(1)$', 'Cociente normal entre celdas de orden 1'];
          void U;
          return {
            tipo: 'choice', tema: 'trampas',
            enunciado: 'Misma tabla ($\\{0, 0, 1, 1\\}$): la celda $f[x_2, x_3] = f[1, 1]$… ¿qué regla usa?',
            opciones: ops.map(function (i) { return textos[i]; }),
            correcta: ops.indexOf(0),
            pista: '¿Los extremos del tramo son iguales o distintos?',
            solucion: 'Extremos 1 y 1 → derivada: $f[1,1] = f\'(1)$. En cada celda, la pregunta es SIEMPRE la misma: ¿coinciden los nodos extremos?',
          };
        },
        function (U) {
          const f0 = U.randInt(-3, 3), d0 = U.randInt(-2, 2) || 1, f1 = U.randInt(-3, 3), d1 = U.randInt(-2, 2);
          const tr = NS.engines.hermite({ nodes: [0, 0, 1, 1], values: [f0, d0, f1, d1], evalXs: [] });
          return {
            tipo: 'numeric', tema: 'trampas',
            enunciado: 'Con $f(0) = ' + f0 + '$, $f\'(0) = ' + d0 + '$, $f(1) = ' + f1 + '$, $f\'(1) = ' + d1 + '$: calcula la celda de orden 2, $f[x_0, x_1, x_2] = f[0, 0, 1]$ (3 decimales).',
            respuesta: tr.result.tabla[0][2], tol: 0.005,
            pista: 'Extremos 0 y 1 (distintos) → cociente de sus padres: $\\dfrac{f[0,1] - f[0,0]}{1 - 0}$, donde $f[0,0] = f\'(0)$.',
            solucion: '$f[0,0,1] = ' + tex(tr.result.tabla[0][2], 4) + '$ — cociente cuyos PADRES ya mezclan una celda-derivada y una celda-cociente.',
          };
        },
        function (U) {
          const ops = U.baraja([0, 1, 2]);
          const textos = ['3 veces: aporta $f$, $f\'$ y $f\'\'$ (tres datos)', '2 veces: las derivadas van aparte', '1 vez: los nodos nunca se repiten'];
          void U;
          return {
            tipo: 'choice', tema: 'trampas',
            enunciado: 'Última trampa: un nodo del que conoces $f$, $f\'$ y $f\'\'$, ¿cuántas veces aparece en la lista de nodos expandidos?',
            opciones: ops.map(function (i) { return textos[i]; }),
            correcta: ops.indexOf(0),
            pista: 'Repeticiones = datos que aporta el nodo.',
            solucion: '3 veces — y sus datos entran como $f$, $f\'/1!$, $f\'\'/2!$. Así el ejemplo de clase «1 1 1 1 4» significa: el nodo 1 aporta cuatro datos y el nodo 4 uno.',
          };
        },
      ],
    },
    {
      id: 'tangentes', nombre: 'Ajuste de tangentes', icono: '',
      tipo: 'param-goal',
      desc: 'Curva de Hermite entre (0,·) y (1,·): elige valores y pendientes para que pase EXACTAMENTE por el blanco en x = 0.5.',
      enunciado: 'Vas a esculpir una cúbica de Hermite con nodos $\\{0, 0, 1, 1\\}$: tus cuatro datos son $f(0),\\ f\'(0),\\ f(1),\\ f\'(1)$ (en ese orden). **Objetivo: que la curva pase por el blanco $P(0.5) = 0.75$.** Con los datos iniciales pasa por $0.625$: ajusta valores y/o pendientes con cabeza (¿qué dato empuja más al centro?).',
      libres: ['values'],
      fijos: { nodes: '0 0 1 1', evalXs: '0.5' },
      inicial: { values: '0 1 1 0' },
      intentosMax: 4,
      plot: true,
      evalua: function (trace) {
        if (trace.status !== 'converged' || !trace.result.evals.length) {
          return { puntos: 0, msg: '⛔ Necesito exactamente 4 datos: f(0), f\'(0), f(1), f\'(1).' };
        }
        const y = trace.result.evals[0].y;
        const d = Math.abs(y - 0.75);
        const msg = '$P(0.5) = ' + tex(y, 5) + '$ (blanco: 0.75, desvío ' + tex(d, 4) + ').';
        if (d < 0.01) return { puntos: 100, msg: msg + ' En la diana: escultura de precisión.' };
        if (d < 0.05) return { puntos: 75, msg: msg + ' Rozando el blanco: un pelín más de pendiente en 0 o de altura en los extremos.' };
        if (d < 0.15) return { puntos: 45, msg: msg + ' Se acerca. Sugerencia: subir $f\'(0)$ levanta el centro sin mover los extremos.' };
        return { puntos: 15, msg: msg + ' Lejos del blanco. Recuerda: los 4 datos son palancas independientes — juega con las pendientes.' };
      },
    },
  ];
})(globalThis.MNO = globalThis.MNO || {});
