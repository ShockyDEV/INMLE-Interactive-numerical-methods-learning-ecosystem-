/* MNO.trace — formato estándar de traza.
   Una traza es el resultado completo de ejecutar un método: pasos tipados con
   estado numérico, líneas de explicación (texto con $LaTeX$ inline), primitivas
   geométricas a dibujar y ganchos de quiz. Los cuatro modos (Explorar,
   Practicar, Reto, Cuaderno) consumen la misma traza. */
(function (NS) {
  'use strict';

  const trace = {};

  /* Crea una traza vacía. inputs debe ser serializable (strings/números). */
  trace.make = function (method, family, inputs) {
    return {
      method: method,
      family: family,           // 'rootfinding' | 'linear' | 'interp'
      inputs: inputs,
      fns: {},                  // clausuras compiladas (NO serializable)
      status: 'running',        // 'converged' | 'maxIter' | 'diverged' | 'error'
      statusMsg: '',
      result: null,             // por familia: {root,...} | {X,L,U,det} | {coefs,evals}
      steps: [],
      errorSeries: [],          // [{k, err}] para gráficas de convergencia
      plotHints: null,          // {xmin, xmax} sugerencia de encuadre
    };
  };

  /* Añade un paso. Campos habituales:
     type: 'setup'|'iter'|'rowop'|'pivot'|'backsub'|'sweep'|'dd'|'basis'|'poly'|'eval'|'final'|'fail'
     title:   'Iteración 3'
     explain: ['línea con $c_3 = 1.25$', ...]
     state:   {a, b, c, ...}        estado numérico del paso
     draw:    [primitivas]          ver plot/primitives.js
     error:   número                para errorSeries
     quiz:    {predictPoint:{x}, choice:{...}}   ganchos de Practicar */
  trace.step = function (tr, s) {
    s.i = tr.steps.length;
    if (s.k === undefined) s.k = null;
    tr.steps.push(s);
    if (typeof s.error === 'number' && isFinite(s.error) && s.k !== null) {
      tr.errorSeries.push({ k: s.k, err: s.error });
    }
    return s;
  };

  /* Cierra la traza con estado y resultado. */
  trace.finish = function (tr, status, result, msg) {
    tr.status = status;
    tr.result = result || null;
    tr.statusMsg = msg || '';
    return tr;
  };

  /* Versión serializable (sin clausuras) para exportar/depurar. */
  trace.toJSON = function (tr) {
    const cp = {};
    for (const k in tr) if (k !== 'fns') cp[k] = tr[k];
    return cp;
  };

  NS.trace = trace;
})(globalThis.MNO = globalThis.MNO || {});
