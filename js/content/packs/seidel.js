/* Pack de contenido: GAUSS-SEIDEL (teoría + Practicar + Retos). */
(function (NS) {
  'use strict';

  NS.content = NS.content || {};
  NS.content.theory = NS.content.theory || {};
  NS.content.quizzes = NS.content.quizzes || {};
  NS.content.challenges = NS.content.challenges || {};

  const tex = NS.num.tex;

  /* ============ TEORÍA ============ */
  NS.content.theory.seidel = {
    secciones: [
      {
        titulo: 'La idea', icono: '',
        lineas: [
          'Jacobi tiene un despilfarro incorporado: calcula un $x^{(k+1)}$ flamante… y lo guarda en un cajón hasta la siguiente pasada. Gauss-Seidel lo arregla con puro sentido común: **cada valor recién calculado se usa INMEDIATAMENTE** en las fórmulas siguientes de la misma pasada.',
          'En el plano se ve precioso: Jacobi salta «en diagonal» hacia la solución; Gauss-Seidel baja **en escalera**, moviéndose eje a eje con la información más fresca disponible.',
        ],
      },
      {
        titulo: 'Formulación', icono: '',
        lineas: [
          '$x_i^{(k+1)} = \\dfrac{b_i - \\sum_{j < i} a_{ij}\\, x_j^{(k+1)} - \\sum_{j > i} a_{ij}\\, x_j^{(k)}}{a_{ii}}$',
          'Fíjate en los superíndices: para $j < i$ (los ya recalculados en esta pasada) usa $(k+1)$; para $j > i$ (los pendientes), $(k)$.',
          'En la práctica: un solo vector $X$ que se va **sobrescribiendo** sobre la marcha — más simple de programar y la mitad de memoria que Jacobi.',
        ],
      },
      {
        titulo: 'Convergencia', icono: '',
        lineas: [
          'Con $A$ estrictamente diagonal dominante: convergencia garantizada desde cualquier $X^{(0)}$ (igual que Jacobi). También converge si $A$ es simétrica definida positiva — un caso enorme en la práctica.',
          'Velocidad: al usar información más fresca, casi siempre adelanta a Jacobi. Regla empírica (exacta en matrices «consistentemente ordenadas»): $\\rho(T_{GS}) = \\rho(T_J)^2$ — **una pasada de Seidel avanza lo que dos de Jacobi**.',
          'Ojo: «casi siempre» no es «siempre». Existen matrices raras donde Jacobi converge y Seidel no (y viceversa). En la duda, medir.',
        ],
      },
      {
        titulo: 'Ventajas y limitaciones', icono: '',
        lineas: [
          {
            tipo: 'vs',
            pros: [
              'Típicamente el doble de rápido que Jacobi.',
              'Mitad de memoria: un solo vector que se sobrescribe.',
              'Mismas garantías con dominancia diagonal, y además con $A$ simétrica definida positiva.',
              'Base de métodos aún mejores (SOR: sobre-relajación).',
            ],
            contras: [
              'Secuencial de nacimiento: cada variable espera a la anterior → difícil de paralelizar (Jacobi gana en GPU).',
              'El orden de las ecuaciones afecta al camino (y algo a la velocidad).',
              'Sigue siendo lineal: para precisión brutal, mejor métodos directos o Krylov.',
            ],
          },
        ],
      },
      {
        titulo: 'Errores típicos', icono: '',
        lineas: [
          { tipo: 'error', texto: 'Usar valores VIEJOS para $j < i$: si en la fórmula de $y^{(k+1)}$ metes el $x^{(k)}$ antiguo en vez del $x^{(k+1)}$ recién calculado, estás haciendo Jacobi sin saberlo.' },
          { tipo: 'error', texto: 'Mezclar a medias: usar el $x$ nuevo pero el $z$ viejo cuando ya tenías el nuevo. La regla es mecánica: TODO lo ya recalculado en esta pasada entra con $(k+1)$.' },
          { tipo: 'error', texto: 'Creer que Seidel gana SIEMPRE a Jacobi: es lo habitual, no un teorema universal. Compruébalo con la vista lado a lado o en el reto «Duelo de gemelos».' },
          { tipo: 'error', texto: 'Olvidar que la solución NO cambia entre Jacobi y Seidel: cambian el camino y la velocidad, no el destino (si ambos convergen).' },
        ],
      },
      {
        titulo: '¿Cuándo usarlo?', icono: '',
        lineas: [
          'La misma cancha que Jacobi (sistemas grandes y dispersos con matriz dominante o SPD) cuando la ejecución es SECUENCIAL: mismo coste por pasada, menos pasadas.',
          'Si tienes paralelismo masivo, Jacobi se reparte mejor. Si necesitas exprimir más, el siguiente escalón es SOR (Seidel con un empujón ω).',
        ],
      },
    ],
  };

  /* ============ PRACTICAR ============ */
  function matrizDominante(U, n) {
    const A = [], B = [];
    for (let i = 0; i < n; i++) {
      const fila = [];
      let suma = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) { fila.push(0); continue; }
        const v = U.randInt(-3, 3);
        fila.push(v);
        suma += Math.abs(v);
      }
      fila[i] = U.elegir([-1, 1]) * (suma + U.randInt(1, 4));
      A.push(fila);
      B.push(U.randInt(-9, 9));
    }
    return { A: A, B: B };
  }
  function pintaSistema(A, B) {
    return A.map(function (f, i) { return '$[' + f.join(',\\ ') + '\\ |\\ ' + B[i] + ']$'; }).join('  ·  ');
  }

  NS.content.quizzes.seidel = {
    generadores: [

      /* 1 · numeric: usa el valor NUEVO (la esencia del método) */
      function (U) {
        const m = matrizDominante(U, 3);
        const tr = NS.engines.seidel({ A: m.A, B: m.B, X0: [0, 0, 0], tol: 1e-4, maxIter: 60 });
        const sweep = tr.steps.filter(function (s) { return s.type === 'sweep'; })[0];
        const x1 = sweep.perVar[0].val, y1 = sweep.perVar[1].val;
        return {
          tipo: 'numeric', tema: 'usa-valores-nuevos',
          enunciado: 'Gauss-Seidel sobre ' + pintaSistema(m.A, m.B) + ' desde $[0,0,0]$. Ya calculaste $x^{(1)} = ' + tex(x1, 5) + '$. **Calcula $y^{(1)}$ usando ese valor RECIÉN salido del horno** (3 decimales).',
          traza: null,
          respuesta: y1, tol: 0.005,
          pista: '$y^{(1)} = \\dfrac{b_2 - a_{21} \\cdot x^{(1)} - a_{23} \\cdot z^{(0)}}{a_{22}}$ — y $z^{(0)} = 0$ todavía.',
          solucion: '$y^{(1)} = ' + tex(y1, 5) + '$. Esa sustitución inmediata del $x$ nuevo ES Gauss-Seidel; con el $x$ viejo habrías hecho Jacobi.',
        };
      },

      /* 2 · choice: la diferencia esencial */
      function (U) {
        const ops = U.baraja([0, 1, 2]);
        const textos = [
          'Usa cada valor recién calculado INMEDIATAMENTE, dentro de la misma pasada',
          'Usa otra fórmula de despeje distinta a la de Jacobi',
          'Exige una condición de convergencia completamente diferente',
        ];
        return {
          tipo: 'choice', tema: 'jacobi-vs-seidel',
          enunciado: '¿En qué se diferencia Gauss-Seidel de Jacobi?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: 'El despeje es EL MISMO; lo que cambia es la frescura de los ingredientes.',
          solucion: 'Mismo despeje de la diagonal, pero Seidel consume al instante lo que produce ($x_j^{(k+1)}$ para $j < i$). Solo eso — y suele valer el doble de velocidad.',
        };
      },

      /* 3 · choice: ¿quién gana? (con datos reales) */
      function (U) {
        const m = matrizDominante(U, 3);
        const tj = NS.engines.jacobi({ A: m.A, B: m.B, X0: [0, 0, 0], tol: 1e-4, maxIter: 90 });
        const ts = NS.engines.seidel({ A: m.A, B: m.B, X0: [0, 0, 0], tol: 1e-4, maxIter: 90 });
        const ij = tj.status === 'converged' ? tj.result.iters : Infinity;
        const is = ts.status === 'converged' ? ts.result.iters : Infinity;
        const correcta = is < ij ? 1 : (ij < is ? 0 : 2);
        return {
          tipo: 'choice', tema: 'velocidad-seidel',
          enunciado: 'Sistema diagonal dominante: ' + pintaSistema(m.A, m.B) + ', tol $10^{-4}$, desde $[0,0,0]$. ¿Quién convergerá en MENOS iteraciones?',
          traza: null,
          opciones: ['Jacobi', 'Gauss-Seidel', 'Empatan'],
          correcta: correcta,
          pista: '¿Quién trabaja con información más fresca en cada fórmula?',
          solucion: 'Resultado real: Jacobi ' + (isFinite(ij) ? ij : '∞') + ' iteraciones, Gauss-Seidel ' + (isFinite(is) ? is : '∞') + '. ' + (correcta === 1 ? 'Seidel gana — regla empírica: una pasada suya rinde como dos de Jacobi.' : correcta === 0 ? '¡Sorpresa! Esta vez ganó Jacobi: la regla «Seidel × 2» es costumbre, no teorema.' : 'Empate técnico esta vez.'),
        };
      },

      /* 4 · numeric: cuenta las iteraciones de Seidel */
      function (U) {
        const m = matrizDominante(U, 3);
        const ts = NS.engines.seidel({ A: m.A, B: m.B, X0: [0, 0, 0], tol: 1e-3, maxIter: 90 });
        return {
          tipo: 'numeric', tema: 'conteo-iteraciones',
          enunciado: 'Gauss-Seidel sobre ' + pintaSistema(m.A, m.B) + ' (tol $10^{-3}$, desde $[0,0,0]$) converge. **¿En cuántas iteraciones?** (±2; estima por la fuerza de la diagonal)',
          traza: null,
          respuesta: ts.result.iters, tol: 2.2,
          pista: 'Dominancia holgada → 4-8 pasadas. Ajustada → 10-20. (Y siempre ~la mitad que Jacobi.)',
          solucion: 'Convergió en ' + ts.result.iters + ' iteraciones.',
        };
      },

      /* 5 · choice: por qué es difícil de paralelizar */
      function (U) {
        const ops = U.baraja([0, 1, 2]);
        const textos = [
          'Porque cada variable ESPERA al valor recién calculado de la anterior: hay una cadena de dependencias',
          'Porque necesita más memoria que Jacobi',
          'Porque las matrices dispersas no caben en varias máquinas',
        ];
        return {
          tipo: 'choice', tema: 'paralelismo',
          enunciado: 'En un clúster con miles de procesadores, Jacobi se reparte de maravilla y Gauss-Seidel se atasca. ¿Por qué?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: 'La fuerza de Seidel (usar lo recién calculado) es exactamente su cadena.',
          solucion: 'La sustitución inmediata crea dependencia secuencial: $y^{(k+1)}$ no puede empezar hasta acabar $x^{(k+1)}$. Jacobi calcula todo con la foto vieja → cada procesador va a lo suyo. La virtud de uno es el defecto del otro.',
        };
      },
    ],
  };

  /* ============ RETOS ============ */
  NS.content.challenges.seidel = [
    {
      id: 'dominante', nombre: 'Hazla dominante', icono: '',
      tipo: 'apuesta',
      desc: 'Otras tres ecuaciones barajadas. Encuentra la ordenación con la diagonal al mando antes de correrlas.',
      pregunta: 'Tres ordenaciones de las mismas ecuaciones. Solo una deja los coeficientes grandes en la diagonal. **¿Cuál converge con Gauss-Seidel?**',
      candidatos: [
        {
          label: 'Orden A: $[1, 1, 8]$, $[-7, 2, 1]$, $[2, 9, -1]$',
          params: { A: '1 1 8\n-7 2 1\n2 9 -1', B: '14 -4 11', X0: '0 0 0', tol: '0.0001', maxIter: '50' },
        },
        {
          label: 'Orden B: $[-7, 2, 1]$, $[2, 9, -1]$, $[1, 1, 8]$',
          params: { A: '-7 2 1\n2 9 -1\n1 1 8', B: '-4 11 14', X0: '0 0 0', tol: '0.0001', maxIter: '50' },
        },
        {
          label: 'Orden C: $[2, 9, -1]$, $[1, 1, 8]$, $[-7, 2, 1]$',
          params: { A: '2 9 -1\n1 1 8\n-7 2 1', B: '11 14 -4', X0: '0 0 0', tol: '0.0001', maxIter: '50' },
        },
      ],
      puntosAcierto: 100, puntosFallo: 25,
      moraleja: 'El orden B alinea −7, 9 y 8 en la diagonal: dominancia estricta y convergencia garantizada. Antes de rendirte con un sistema, pregúntate si solo está mal sentado.',
    },
    {
      id: 'duelo', nombre: 'Duelo de gemelos', icono: '',
      tipo: 'quiz-serie',
      desc: 'Jacobi contra Gauss-Seidel sobre el mismo sistema: predice iteraciones, ganador y el porqué.',
      n: 4,
      generadores: [
        function (U) {
          const m = matrizDominante(U, 3);
          const tj = NS.engines.jacobi({ A: m.A, B: m.B, X0: [0, 0, 0], tol: 1e-4, maxIter: 90 });
          return {
            tipo: 'numeric', tema: 'duelo-gemelos',
            enunciado: 'Primer asalto. Sistema: ' + pintaSistema(m.A, m.B) + ' (tol $10^{-4}$). ¿Cuántas iteraciones necesita **Jacobi**? (±2)',
            respuesta: tj.result.iters, tol: 2.2,
            pista: 'Dominancia fuerte → converge en menos de 10; floja → 15-30.',
            solucion: 'Jacobi: ' + tj.result.iters + ' iteraciones.',
          };
        },
        function (U) {
          const m = matrizDominante(U, 3);
          const ts = NS.engines.seidel({ A: m.A, B: m.B, X0: [0, 0, 0], tol: 1e-4, maxIter: 90 });
          return {
            tipo: 'numeric', tema: 'duelo-gemelos',
            enunciado: 'Segundo asalto. Mismo formato, otro sistema: ' + pintaSistema(m.A, m.B) + '. ¿Iteraciones de **Gauss-Seidel**? (±2)',
            respuesta: ts.result.iters, tol: 2.2,
            pista: 'Piensa en «lo que tardaría Jacobi… entre dos».',
            solucion: 'Gauss-Seidel: ' + ts.result.iters + ' iteraciones.',
          };
        },
        function (U) {
          const m = matrizDominante(U, 3);
          const tj = NS.engines.jacobi({ A: m.A, B: m.B, X0: [0, 0, 0], tol: 1e-4, maxIter: 90 });
          const ts = NS.engines.seidel({ A: m.A, B: m.B, X0: [0, 0, 0], tol: 1e-4, maxIter: 90 });
          const ij = tj.status === 'converged' ? tj.result.iters : Infinity;
          const is = ts.status === 'converged' ? ts.result.iters : Infinity;
          return {
            tipo: 'choice', tema: 'duelo-gemelos',
            enunciado: 'Tercer asalto: ' + pintaSistema(m.A, m.B) + '. Corro AMBOS con tol $10^{-4}$: ¿quién gana?',
            opciones: ['Jacobi', 'Gauss-Seidel', 'Empatan'],
            correcta: is < ij ? 1 : (ij < is ? 0 : 2),
            pista: 'En sistemas dominantes «normales», el que recicla información fresca…',
            solucion: 'Jacobi: ' + (isFinite(ij) ? ij : '∞') + ' · Gauss-Seidel: ' + (isFinite(is) ? is : '∞') + ' iteraciones.',
          };
        },
        function (U) {
          const ops = U.baraja([0, 1, 2]);
          const textos = [
            'Porque usa información más FRESCA: cada fórmula aprovecha lo recién calculado en la misma pasada',
            'Porque su fórmula de despeje tiene menos operaciones',
            'Porque exige una tolerancia más laxa',
          ];
          return {
            tipo: 'choice', tema: 'duelo-gemelos',
            enunciado: 'La pregunta del cinturón: ¿POR QUÉ suele ganar Gauss-Seidel?',
            opciones: ops.map(function (i) { return textos[i]; }),
            correcta: ops.indexOf(0),
            pista: 'Ambos hacen las mismas cuentas por pasada…',
            solucion: 'Mismo coste por pasada, pero Seidel corrige sobre la marcha: en matrices bien ordenadas $\\rho_{GS} = \\rho_J^2$, o sea, una pasada suya vale por dos. La información fresca ES la ventaja.',
          };
        },
      ],
    },
  ];
})(globalThis.MNO = globalThis.MNO || {});
