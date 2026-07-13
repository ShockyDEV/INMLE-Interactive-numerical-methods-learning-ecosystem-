/* MNO.num — utilidades numéricas y de formato compartidas.
   R() y P() conservan el comportamiento exacto del MNO Helper original
   para garantizar la paridad numérica con legacy/metodos_numericos.html. */
(function (NS) {
  'use strict';

  const num = {};

  /* Redondeo de presentación (idéntico al R() original). */
  num.R = function (v, d) {
    if (d === undefined) d = 8;
    if (typeof v !== 'number' || !isFinite(v)) return 'NaN';
    return parseFloat(v.toFixed(d));
  };

  /* Parseo de listas "1 2,3; 4" → [1,2,3,4] (idéntico al P() original). */
  num.P = function (t) {
    return String(t).trim().split(/[\s,;]+/).map(Number);
  };

  /* Parseo de matrices: filas separadas por salto de línea. */
  num.parseMatrix = function (t) {
    return String(t).trim().split('\n').map(function (r) {
      return r.trim().split(/[\s,;]+/).map(Number);
    });
  };

  /* Formato humano: recorta ceros, usa notación exponencial en extremos. */
  num.fmt = function (v, d) {
    if (d === undefined) d = 6;
    if (typeof v !== 'number' || !isFinite(v)) return isNaN(v) ? 'NaN' : (v > 0 ? '∞' : '−∞');
    if (v === 0) return '0';
    const a = Math.abs(v);
    let s;
    if (a >= 1e7 || a < 1e-5) {
      s = v.toExponential(Math.max(1, d - 2)).replace(/(\.\d*?)0+e/, '$1e').replace(/\.e/, 'e');
    } else {
      s = String(parseFloat(v.toFixed(d)));
    }
    return s.replace('-', '−');
  };

  /* Formato LaTeX-seguro (sin '−' unicode, KaTeX prefiere '-'). */
  num.tex = function (v, d) {
    if (d === undefined) d = 6;
    if (typeof v !== 'number' || !isFinite(v)) return '\\mathrm{NaN}';
    const a = Math.abs(v);
    if (v !== 0 && (a >= 1e7 || a < 1e-5)) {
      const e = v.toExponential(Math.max(1, d - 2));
      const m = e.split('e');
      return parseFloat(m[0]) + '\\times 10^{' + parseInt(m[1], 10) + '}';
    }
    return String(parseFloat(v.toFixed(d)));
  };

  num.linspace = function (a, b, n) {
    const out = new Array(n);
    const h = (b - a) / (n - 1);
    for (let i = 0; i < n; i++) out[i] = a + i * h;
    return out;
  };

  num.clone2D = function (M) { return M.map(function (r) { return r.slice(); }); };

  num.normInf = function (a, b) {
    let m = 0;
    for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - (b ? b[i] : 0)));
    return m;
  };

  num.clamp = function (v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); };

  /* Genera etiquetas x₁..xₙ, o x,y,z para sistemas pequeños. */
  num.varNames = function (n) {
    const vn = ['x', 'y', 'z', 'w', 'v', 'u', 't', 's'];
    if (n <= vn.length) return vn.slice(0, n);
    return Array.from({ length: n }, function (_, i) { return 'x_{' + (i + 1) + '}'; });
  };

  NS.num = num;
})(globalThis.MNO = globalThis.MNO || {});
