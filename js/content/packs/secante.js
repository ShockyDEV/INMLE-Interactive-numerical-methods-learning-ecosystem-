/* Pack de contenido: SECANTE (teoría + Practicar + Retos). */
(function (NS) {
  'use strict';

  NS.content = NS.content || {};
  NS.content.theory = NS.content.theory || {};
  NS.content.quizzes = NS.content.quizzes || {};
  NS.content.challenges = NS.content.challenges || {};

  const tex = NS.num.tex;

  /* ============ TEORÍA ============ */
  NS.content.theory.secante = {
    secciones: [
      {
        titulo: 'La idea', icono: '',
        lineas: [
          'Newton es magnífico… si tienes $f\'$. ¿Y si no? La secante hace trampa con elegancia: **aproxima la tangente con la recta que pasa por los dos últimos puntos** (una secante). No pide derivada: se la fabrica con lo que ya tiene.',
          'A diferencia de la cuerda, NO conserva el cambio de signo: siempre usa los dos iterados más recientes, estén donde estén. Menos red de seguridad, más velocidad.',
        ],
      },
      {
        titulo: 'Formulación', icono: '',
        lineas: [
          '$x_{n+1} = x_n - f(x_n)\\,\\dfrac{x_n - x_{n-1}}{f(x_n) - f(x_{n-1})}$',
          'Es la fórmula de Newton con $f\'(x_n)$ sustituida por el cociente incremental $\\frac{f(x_n) - f(x_{n-1})}{x_n - x_{n-1}}$.',
          'Necesita DOS puntos de arranque $x_0, x_1$ — pero no hace falta que encierren la raíz.',
        ],
      },
      {
        titulo: 'Convergencia', icono: '',
        lineas: [
          'Orden $\\varphi = \\frac{1 + \\sqrt{5}}{2} \\approx 1.618$: **el número áureo**. Superlineal — entre la cuerda (1) y Newton (2).',
          'El truco del coste: cada iteración solo gasta **1 evaluación nueva de $f$** (reutiliza la anterior), mientras Newton gasta 2 ($f$ y $f\'$). Midiendo por EVALUACIONES, dos pasos de secante (orden $\\varphi^2 \\approx 2.6$) cuestan lo que uno de Newton (orden 2): la secante suele ganar en eficiencia real.',
          'La misma advertencia que Newton: convergencia solo local, y sin bracket puede escaparse.',
        ],
      },
      {
        titulo: 'Ventajas y limitaciones', icono: '',
        lineas: [
          {
            tipo: 'vs',
            pros: [
              'Sin derivadas: solo evaluaciones de $f$.',
              'Casi tan rápida como Newton (orden 1.618).',
              'Más eficiente que Newton por evaluación de función.',
              'No necesita cambio de signo para arrancar.',
            ],
            contras: [
              'No garantiza mantener la raíz acotada: puede fugarse.',
              'Si $f(x_n) \\approx f(x_{n-1})$ la secante es casi horizontal → salto enorme o división por cero.',
              'Convergencia local: sensible a los puntos iniciales.',
            ],
          },
        ],
      },
      {
        titulo: 'Errores típicos', icono: '',
        lineas: [
          { tipo: 'error', texto: 'Confundirla con la cuerda (regula falsi): la cuerda elige los extremos que ENCIERRAN la raíz; la secante usa SIEMPRE los dos últimos iterados, aunque queden del mismo lado.' },
          { tipo: 'error', texto: 'Creer que mantiene el bracket: no hay garantía — el nuevo iterado puede caer fuera de cualquier intervalo anterior y hasta divergir.' },
          { tipo: 'error', texto: 'Arrancar con $x_0, x_1$ donde $f$ vale casi lo mismo: denominador $f(x_1) - f(x_0) \\approx 0$ → secante casi horizontal → $x_2$ en la estratosfera.' },
          { tipo: 'error', texto: 'Comparar métodos SOLO por iteraciones: por iteración gana Newton, pero por evaluaciones de $f$ la secante suele ser la más barata para la misma precisión.' },
        ],
      },
      {
        titulo: '¿Cuándo usarla?', icono: '',
        lineas: [
          'Cuando no tienes $f\'$ (o es carísima) y quieres velocidad: es el caballo de batalla práctico de las raíces.',
          'Con una f traicionera, mejor híbrido: bisección para acorralar + secante para rematar (así funcionan los métodos profesionales tipo Brent).',
        ],
      },
    ],
  };

  /* ============ PRACTICAR ============ */
  function casoAleatorio(U) {
    return U.elegir([
      { f: 'x^2 - ' + U.randInt(2, 9), x0: 1, x1: U.randInt(2, 3) },
      { f: 'x^3 - x - ' + U.randInt(1, 4), x0: 1, x1: 2 },
      { f: 'exp(x) - ' + U.randInt(2, 5), x0: 0, x1: 2 },
      { f: 'cos(x) - x', x0: 0, x1: 1 },
    ]);
  }

  NS.content.quizzes.secante = {
    generadores: [

      /* 1 · point-x: ¿dónde corta la secante? */
      function (U) {
        const c = casoAleatorio(U);
        const tr = NS.engines.secante({ f: c.f, x0: c.x0, x1: c.x1, tol: 1e-9, maxIter: 40 });
        const it = tr.steps.filter(function (s) { return s.type === 'iter'; })[0];
        const span = tr.plotHints.xmax - tr.plotHints.xmin;
        return {
          tipo: 'point-x', tema: 'geometria-secante',
          enunciado: 'Secante sobre $f(x) = ' + c.f + '$ con $x_0 = ' + c.x0 + '$ y $x_1 = ' + c.x1 + '$ (los dos puntos marcados). **¿Dónde cortará al eje la recta que los une?**',
          traza: tr, hastaPaso: 0,
          puntoX: it.state.x2, tolX: Math.max(0.1, span * 0.06),
          pista: 'Une mentalmente $(x_0, ' + tex(it.state.f0, 3) + ')$ con $(x_1, ' + tex(it.state.f1, 3) + ')$ y prolonga hasta el eje.',
          solucion: '$x_2 = x_1 - f(x_1)\\frac{x_1 - x_0}{f(x_1) - f(x_0)} = ' + tex(it.state.x2, 5) + '$.',
        };
      },

      /* 2 · choice: ¿qué puntos usa la siguiente secante? */
      function () {
        return {
          tipo: 'choice', tema: 'confusion-regula-falsi',
          enunciado: 'La secante acaba de calcular $x_2$ a partir de $x_0$ y $x_1$. Para calcular $x_3$, ¿qué dos puntos usará?',
          traza: null,
          opciones: [
            '$x_1$ y $x_2$: **siempre los dos últimos**',
            'Los dos que dejen la raíz encerrada entre ellos',
            '$x_0$ y $x_2$: el primero y el último',
          ],
          correcta: 0,
          pista: 'Aquí está LA diferencia con la cuerda/regula falsi…',
          solucion: 'La secante recicla sin mirar signos: siempre los dos iterados más recientes ($x_1, x_2$). La cuerda, en cambio, elige los que conservan el cambio de signo — por eso ella garantiza y la secante corre.',
        };
      },

      /* 3 · choice: ¿mantiene la raíz acotada? */
      function () {
        return {
          tipo: 'choice', tema: 'sin-bracket',
          enunciado: 'Arrancas la secante con $x_0, x_1$ tales que $f(x_0) \\cdot f(x_1) < 0$ (encierran la raíz). ¿Está garantizado que TODOS los iterados sigan encerrándola?',
          traza: null,
          opciones: [
            'No: el siguiente iterado puede caer fuera y hasta divergir',
            'Sí: es la propiedad fundamental del método',
            'Solo si $f$ es continua',
          ],
          correcta: 0,
          pista: '¿La secante comprueba signos en algún momento?',
          solucion: 'La secante ignora los signos: dos puntos del mismo lado pueden generar una recta casi horizontal que dispara $x_{n+1}$ lejísimos. Es su precio por la velocidad; si necesitas garantía, usa cuerda o bisección (o un híbrido).',
        };
      },

      /* 4 · numeric: calcula x2 */
      function (U) {
        const c = casoAleatorio(U);
        const tr = NS.engines.secante({ f: c.f, x0: c.x0, x1: c.x1, tol: 1e-9, maxIter: 40 });
        const it = tr.steps.filter(function (s) { return s.type === 'iter'; })[0];
        return {
          tipo: 'numeric', tema: 'formula-secante',
          enunciado: 'Con $x_0 = ' + c.x0 + '$, $x_1 = ' + c.x1 + '$, $f(x_0) = ' + tex(it.state.f0, 4) + '$ y $f(x_1) = ' + tex(it.state.f1, 4) + '$: calcula $x_2$ (3 decimales).',
          traza: null,
          respuesta: it.state.x2, tol: 0.005,
          pista: '$x_2 = x_1 - f(x_1)\\,\\dfrac{x_1 - x_0}{f(x_1) - f(x_0)}$',
          solucion: '$x_2 = ' + tex(it.state.x2, 6) + '$.',
        };
      },

      /* 5 · choice: el orden áureo */
      function (U) {
        const ops = U.baraja([0, 1, 2]);
        const textos = ['$\\varphi = \\frac{1+\\sqrt{5}}{2} \\approx 1.618$ (¡el número áureo!)', '$2$ (igual que Newton)', '$1$ (como la bisección)'];
        return {
          tipo: 'choice', tema: 'orden-aureo',
          enunciado: '¿Cuál es el orden de convergencia de la secante en una raíz simple?',
          traza: null,
          opciones: ops.map(function (i) { return textos[i]; }),
          correcta: ops.indexOf(0),
          pista: 'Ni lineal ni cuadrático: un número famoso se esconde entre ambos.',
          solucion: 'Orden $\\varphi \\approx 1.618$, el número áureo — sale de la recurrencia de errores $e_{n+1} \\sim e_n e_{n-1}$. Y como cada iteración cuesta 1 sola evaluación, dos pasos de secante ($\\varphi^2 \\approx 2.6$) superan a un paso de Newton (2) al mismo coste.',
        };
      },
    ],
  };

  /* ============ RETOS ============ */
  NS.content.challenges.secante = [
    {
      id: 'aguila', nombre: 'Ojo de águila', icono: '',
      tipo: 'param-goal',
      desc: 'sin(x) = x/3 tiene tres raíces. Caza la POSITIVA (≈ 2.279) eligiendo bien tus dos puntos de arranque.',
      enunciado: '$f(x) = \\sin(x) - x/3$ tiene tres raíces: $-2.279$, $0$ y $2.279$. **Elige $x_0$ y $x_1$ para que la secante cace la raíz POSITIVA** (tol $10^{-7}$) en las mínimas iteraciones. Ojo: sin bracket que la sujete, la secante se escapa con facilidad hacia la raíz equivocada.',
      libres: ['x0', 'x1'],
      fijos: { f: 'sin(x) - x/3', tol: '0.0000001', maxIter: '40' },
      inicial: { x0: '0.5', x1: '1' },
      intentosMax: 3,
      plot: true,
      evalua: function (trace) {
        if (trace.status === 'error') return { puntos: 0, msg: '⛔ La secante se quedó sin pendiente (f(x₀) ≈ f(x₁)).' };
        if (trace.status === 'diverged') return { puntos: 5, msg: 'Se fugó al infinito: esos puntos generaron una secante traicionera.' };
        if (trace.status !== 'converged') return { puntos: 5, msg: 'No convergió en 40 iteraciones.' };
        const root = trace.result.root;
        if (Math.abs(root - 2.2789) > 0.1) {
          return { puntos: 15, msg: 'Convergió a ' + NS.num.fmt(root, 4) + '… que no es la raíz positiva pedida. La secante fue a donde la llevaron sus dos primeros pasos.' };
        }
        const it = trace.result.iters;
        if (it <= 5) return { puntos: 100, msg: '¡Raíz positiva en ' + it + ' iteraciones! Vista de águila.' };
        if (it <= 7) return { puntos: 80, msg: it + ' iteraciones — buen ojo, casi perfecto.' };
        if (it <= 10) return { puntos: 60, msg: it + ' iteraciones. Arranca con los dos puntos abrazando 2.28.' };
        return { puntos: 35, msg: 'Llegó, pero en ' + it + ' iteraciones: demasiado turismo.' };
      },
    },
    {
      id: 'presupuesto10', nombre: 'Contable de evaluaciones', icono: '',
      tipo: 'quiz-serie',
      desc: 'Newton corre más por iteración… pero ¿quién gana cuando pagas por cada evaluación de f? Haz las cuentas.',
      n: 4,
      generadores: [
        function () {
          const tn = NS.engines.newton({ f: 'x^3 - x - 2', df: '3x^2 - 1', x0: 2, tol: 1e-10, maxIter: 50 });
          return {
            tipo: 'numeric', tema: 'coste-evaluaciones',
            enunciado: 'Newton resolvió $x^3 - x - 2 = 0$ en $' + tn.result.iters + '$ iteraciones. Cada iteración evalúa $f$ Y $f\'$ (2 evaluaciones). ¿**Cuántas evaluaciones** hizo en total?',
            respuesta: 2 * tn.result.iters, tol: 0.5,
            pista: 'Evaluaciones = 2 × iteraciones.',
            solucion: '$2 \\cdot ' + tn.result.iters + ' = ' + (2 * tn.result.iters) + '$ evaluaciones.',
          };
        },
        function () {
          const ts = NS.engines.secante({ f: 'x^3 - x - 2', x0: 1, x1: 2, tol: 1e-10, maxIter: 50 });
          return {
            tipo: 'numeric', tema: 'coste-evaluaciones',
            enunciado: 'La secante resolvió lo mismo en $' + ts.result.iters + '$ iteraciones. Arranca con 2 evaluaciones (en $x_0$ y $x_1$) y cada iteración añade SOLO UNA nueva (recicla la anterior). ¿Total de evaluaciones? (usa: $2 + (\\text{iteraciones} - 1)$)',
            respuesta: 2 + ts.result.iters - 1, tol: 0.5,
            pista: 'Las 2 del arranque + una nueva por cada iteración menos la primera (que usa las de arranque).',
            solucion: '$2 + ' + ts.result.iters + ' - 1 = ' + (2 + ts.result.iters - 1) + '$ evaluaciones.',
          };
        },
        function () {
          const tn = NS.engines.newton({ f: 'x^3 - x - 2', df: '3x^2 - 1', x0: 2, tol: 1e-10, maxIter: 50 });
          const ts = NS.engines.secante({ f: 'x^3 - x - 2', x0: 1, x1: 2, tol: 1e-10, maxIter: 50 });
          const evN = 2 * tn.result.iters, evS = 2 + ts.result.iters - 1;
          return {
            tipo: 'choice', tema: 'coste-evaluaciones',
            enunciado: 'Recapitulando: Newton usó ' + evN + ' evaluaciones y la secante ' + evS + ' para la MISMA precisión. Midiendo por lo que de verdad cuesta (evaluar $f$), ¿quién fue más eficiente aquí?',
            opciones: ['La secante', 'Newton', 'Empate técnico'],
            correcta: evS < evN ? 0 : (evN < evS ? 1 : 2),
            pista: 'Compara ' + evS + ' contra ' + evN + '.',
            solucion: (evS < evN ? 'La secante: menos evaluaciones para la misma tolerancia. Su orden 1.618 con coste 1 rinde $\\varphi^2 \\approx 2.6$ «por Newton equivalente».' : 'Newton esta vez: cuando converge en muy pocas iteraciones, su ventaja de orden puede compensar el doble coste.'),
          };
        },
        function () {
          return {
            tipo: 'choice', tema: 'coste-evaluaciones',
            enunciado: 'Si evaluar $f$ tarda 1 hora de superordenador (simulaciones caras) y NO tienes $f\'$ analítica, ¿qué método de raíces eliges?',
            opciones: [
              'Secante: 1 evaluación por iteración y orden 1.618',
              'Newton con derivada numérica (2-3 evaluaciones por iteración)',
              'Bisección: garantía ante todo, aunque sean 40 horas más',
            ],
            correcta: 0,
            pista: 'Cuenta evaluaciones, no iteraciones.',
            solucion: 'La secante es la reina cuando la evaluación es cara: máximo progreso por evaluación. Newton con derivada numérica ES esencialmente una secante… pagando el doble.',
          };
        },
      ],
    },
  ];
})(globalThis.MNO = globalThis.MNO || {});
