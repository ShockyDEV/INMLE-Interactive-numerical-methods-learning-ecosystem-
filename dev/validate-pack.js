/* Validador de packs de contenido (teoría + Practicar + Retos) sin navegador.
   Uso: node dev/validate-pack.js <ruta-del-pack.js> <metodoId>
   Ejemplo: node dev/validate-pack.js js/content/packs/newton.js newton */
'use strict';

const path = require('path');

require('../js/core/num.js');
require('../js/core/expr.js');
require('../js/core/trace.js');
require('../js/core/engines/rootfinding.js');
require('../js/core/engines/linear.js');
require('../js/core/engines/interp.js');
require('../js/registry.js');

const MNO = globalThis.MNO;
const packPath = process.argv[2];
const mid = process.argv[3];
if (!packPath || !mid) {
  console.error('Uso: node dev/validate-pack.js <pack.js> <metodoId>');
  process.exit(2);
}
require(path.resolve(packPath));

const U = {
  rand: (a, b) => a + Math.random() * (b - a),
  randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  elegir: (arr) => arr[Math.floor(Math.random() * arr.length)],
  baraja: (arr) => arr.slice().sort(() => Math.random() - 0.5),
};

let errores = 0;
const mal = (msg) => { errores++; console.log('  ✗ ' + msg); };
const bien = (msg) => console.log('  ✓ ' + msg);

/* $…$ debe ir emparejado en todos los strings del contenido */
function checkMath(str, donde) {
  if (typeof str !== 'string') return;
  const n = (str.match(/\$/g) || []).length;
  if (n % 2 !== 0) mal(donde + ': número impar de "$" → «' + str.slice(0, 70) + '…»');
  if (/\$\$/.test(str)) mal(donde + ': "$$" no está soportado (solo $…$ inline)');
}
function walkStrings(obj, donde, fn) {
  if (typeof obj === 'string') fn(obj, donde);
  else if (Array.isArray(obj)) obj.forEach((v, i) => walkStrings(v, donde + '[' + i + ']', fn));
  else if (obj && typeof obj === 'object') {
    for (const k in obj) if (typeof obj[k] !== 'function') walkStrings(obj[k], donde + '.' + k, fn);
  }
}

/* ---------- teoría ---------- */
console.log('— Teoría —');
const teo = MNO.content.theory && MNO.content.theory[mid];
if (!teo) mal('falta NS.content.theory.' + mid);
else if (!Array.isArray(teo.secciones) || teo.secciones.length < 4) mal('teoría con menos de 4 secciones');
else {
  teo.secciones.forEach((s, i) => {
    if (!s.titulo) mal('sección ' + i + ' sin título');
    if (!Array.isArray(s.lineas) || !s.lineas.length) mal('sección "' + s.titulo + '" sin líneas');
  });
  walkStrings(teo, 'theory', checkMath);
  if (!errores) bien(teo.secciones.length + ' secciones correctas');
}

/* ---------- practicar ---------- */
console.log('— Practicar —');
const qz = MNO.content.quizzes && MNO.content.quizzes[mid];
if (!qz || !Array.isArray(qz.generadores) || !qz.generadores.length) mal('falta NS.content.quizzes.' + mid + '.generadores');
else {
  qz.generadores.forEach((gen, gi) => {
    for (let rep = 0; rep < 6; rep++) {
      let q;
      try { q = gen(U); } catch (e) { mal('generador ' + gi + ' lanzó: ' + e.message); break; }
      const donde = 'generador ' + gi + ' (rep ' + rep + ')';
      if (!q || !q.enunciado) { mal(donde + ': sin enunciado'); break; }
      if (['choice', 'numeric', 'point-x'].indexOf(q.tipo) < 0) { mal(donde + ': tipo inválido ' + q.tipo); break; }
      if (!q.tema) mal(donde + ': falta tema (slug de misconception)');
      walkStrings({ e: q.enunciado, p: q.pista, s: q.solucion, o: q.opciones }, donde, checkMath);
      if (q.tipo === 'choice') {
        if (!Array.isArray(q.opciones) || q.opciones.length < 2) mal(donde + ': choice sin opciones');
        else if (typeof q.correcta !== 'number' || q.correcta < 0 || q.correcta >= q.opciones.length) mal(donde + ': correcta fuera de rango');
      }
      if (q.tipo === 'numeric') {
        if (!isFinite(q.respuesta)) mal(donde + ': respuesta no finita');
        if (!(q.tol > 0)) mal(donde + ': tol debe ser > 0');
      }
      if (q.tipo === 'point-x') {
        if (!q.traza || !q.traza.steps) mal(donde + ': point-x necesita traza');
        if (!isFinite(q.puntoX)) mal(donde + ': puntoX no finito');
        if (!(q.tolX > 0)) mal(donde + ': tolX debe ser > 0');
        if (q.hastaPaso !== undefined && q.traza) {
          /* el paso mostrado no debe contener ya la respuesta dibujada como punto siguiente */
          if (q.hastaPaso >= q.traza.steps.length) mal(donde + ': hastaPaso fuera de rango');
        }
      }
    }
  });
  if (!errores) bien(qz.generadores.length + ' generadores × 6 repeticiones OK');
}

/* ---------- retos ---------- */
console.log('— Retos —');
const chs = MNO.content.challenges && MNO.content.challenges[mid];
if (!chs || !chs.length) mal('falta NS.content.challenges.' + mid);
else {
  chs.forEach((c) => {
    const donde = 'reto ' + (c.id || '?');
    if (!c.id || !c.nombre || !c.tipo) mal(donde + ': faltan id/nombre/tipo');
    walkStrings({ d: c.desc, e: c.enunciado, p: c.pregunta, m: c.moraleja }, donde, checkMath);
    const method = MNO.registry[mid];
    if (c.tipo === 'param-goal') {
      if (!Array.isArray(c.libres) || !c.libres.length) mal(donde + ': param-goal sin libres');
      if (typeof c.evalua !== 'function') mal(donde + ': falta evalua()');
      else {
        /* lo ejecutamos con los valores iniciales */
        let raw = {};
        method.params.forEach((p) => {
          raw[p.id] = (c.inicial && c.inicial[p.id] !== undefined) ? c.inicial[p.id]
            : (c.fijos && c.fijos[p.id] !== undefined) ? c.fijos[p.id] : p.def;
        });
        if (c.prepara) raw = c.prepara(raw) || raw;
        try {
          const parsed = {};
          method.params.forEach((p) => {
            const v = raw[p.id];
            if (p.tipo === 'num' || p.tipo === 'int') parsed[p.id] = +v;
            else if (p.tipo === 'nums') parsed[p.id] = MNO.num.P(v);
            else if (p.tipo === 'matrix') parsed[p.id] = MNO.num.parseMatrix(v);
            else parsed[p.id] = v;
          });
          const tr = MNO.engines[method.engine](parsed);
          const ev = c.evalua(tr, U);
          if (!ev || typeof ev.puntos !== 'number' || ev.puntos < 0 || ev.puntos > 100) mal(donde + ': evalua() debe devolver {puntos: 0..100, msg}');
          else bien(donde + ': evalua() → ' + ev.puntos + ' pts con los valores iniciales');
        } catch (e) { mal(donde + ': evalua()/motor lanzó: ' + e.message); }
      }
    } else if (c.tipo === 'apuesta') {
      if (!Array.isArray(c.candidatos) || c.candidatos.length < 2) mal(donde + ': apuesta sin candidatos');
      else {
        try {
          const traces = c.candidatos.map((cand) => {
            const parsed = {};
            method.params.forEach((p) => {
              const v = cand.params[p.id] !== undefined ? cand.params[p.id] : p.def;
              if (p.tipo === 'num' || p.tipo === 'int') parsed[p.id] = +v;
              else if (p.tipo === 'nums') parsed[p.id] = MNO.num.P(v);
              else if (p.tipo === 'matrix') parsed[p.id] = MNO.num.parseMatrix(v);
              else parsed[p.id] = v;
            });
            return MNO.engines[method.engine](parsed);
          });
          let ganador = -1;
          if (typeof c.gana === 'function') ganador = c.gana(traces);
          else {
            let best = Infinity;
            traces.forEach((t, i) => { if (t.status === 'converged' && t.result.iters < best) { best = t.result.iters; ganador = i; } });
          }
          if (ganador < 0 || ganador >= c.candidatos.length) mal(donde + ': no hay ganador claro entre los candidatos');
          else bien(donde + ': gana el candidato ' + ganador + ' («' + c.candidatos[ganador].label.replace(/\$/g, '') + '»)');
        } catch (e) { mal(donde + ': correr candidatos lanzó: ' + e.message); }
      }
    } else if (c.tipo === 'quiz-serie') {
      if (!Array.isArray(c.generadores) || !c.generadores.length) mal(donde + ': quiz-serie sin generadores');
      else {
        c.generadores.forEach((g, gi) => {
          try {
            const q = g(U);
            if (!q.enunciado || (q.tipo !== 'numeric' && q.tipo !== 'choice')) mal(donde + ' gen ' + gi + ': quiz-serie solo admite numeric/choice');
          } catch (e) { mal(donde + ' gen ' + gi + ' lanzó: ' + e.message); }
        });
        bien(donde + ': ' + c.generadores.length + ' generadores OK');
      }
    } else mal(donde + ': tipo desconocido ' + c.tipo);
  });
}

console.log('\n' + (errores === 0 ? '✅ PACK VÁLIDO' : '❌ ' + errores + ' problemas'));
process.exit(errores === 0 ? 0 : 1);
