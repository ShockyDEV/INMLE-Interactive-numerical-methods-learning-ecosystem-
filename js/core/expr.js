/* MNO.expr — parser y compilador de expresiones matemáticas.
   Reemplaza al E() original (regex + Function) por un parser Pratt que compila
   UNA vez a un árbol de clausuras: sin eval/Function, con errores en español
   con posición, multiplicación implícita (2x, 3sin(x)) y convención matemática
   -x^2 = -(x^2). Mantiene un wrapper E(src, {x:v}) compatible con el legacy. */
(function (NS) {
  'use strict';

  const FN1 = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    exp: Math.exp, log: Math.log, ln: Math.log,
    log10: Math.log10, log2: Math.log2,
    sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs,
    sign: Math.sign, floor: Math.floor, ceil: Math.ceil, round: Math.round,
  };
  const FN2 = {
    atan2: Math.atan2, pow: Math.pow, min: Math.min, max: Math.max,
    mod: function (a, b) { return a % b; },
  };
  const CONST = { pi: Math.PI, e: Math.E };

  function fail(msg, pos) {
    const e = new Error(msg + (pos !== undefined ? ' (posición ' + (pos + 1) + ')' : ''));
    e.pos = pos;
    e.esParseError = true;
    throw e;
  }

  /* Normaliza símbolos que suelen llegar pegados de apuntes/Word. */
  function normalize(src) {
    return String(src)
      .replace(/\*\*/g, '^')
      .replace(/[−–]/g, '-')
      .replace(/[·×]/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'pi');
  }

  function tokenize(src) {
    const toks = [];
    let i = 0;
    const n = src.length;
    while (i < n) {
      const ch = src[i];
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') { i++; continue; }
      if ((ch >= '0' && ch <= '9') || (ch === '.' && src[i + 1] >= '0' && src[i + 1] <= '9')) {
        const start = i;
        while (i < n && src[i] >= '0' && src[i] <= '9') i++;
        if (src[i] === '.') { i++; while (i < n && src[i] >= '0' && src[i] <= '9') i++; }
        if (src[i] === 'e' || src[i] === 'E') {
          let j = i + 1;
          if (src[j] === '+' || src[j] === '-') j++;
          if (src[j] >= '0' && src[j] <= '9') {
            i = j;
            while (i < n && src[i] >= '0' && src[i] <= '9') i++;
          }
        }
        const v = parseFloat(src.slice(start, i));
        if (!isFinite(v)) fail('Número no válido «' + src.slice(start, i) + '»', start);
        toks.push({ t: 'num', v: v, pos: start });
        continue;
      }
      if (/[a-zA-Z_]/.test(ch)) {
        const start = i;
        while (i < n && /[a-zA-Z_0-9]/.test(src[i])) i++;
        toks.push({ t: 'ident', v: src.slice(start, i), pos: start });
        continue;
      }
      if (ch === '(') { toks.push({ t: 'lp', pos: i }); i++; continue; }
      if (ch === ')') { toks.push({ t: 'rp', pos: i }); i++; continue; }
      if (ch === ',') { toks.push({ t: 'comma', pos: i }); i++; continue; }
      if ('+-*/^'.indexOf(ch) >= 0) { toks.push({ t: 'op', v: ch, pos: i }); i++; continue; }
      fail('Carácter no válido «' + ch + '»', i);
    }
    toks.push({ t: 'end', pos: n });
    return toks;
  }

  /* Poderes de enlace: + - (10) · * / ×implícita (20) · -unario (12) · ^ (30, asoc. derecha). */
  const LBP = { '+': 10, '-': 10, '*': 20, '/': 20, '^': 30 };
  const UNARY_BP = 12;

  function parse(src, vars) {
    const toks = tokenize(src);
    let p = 0;
    const varIdx = {};
    for (let i = 0; i < vars.length; i++) varIdx[vars[i]] = i;

    function peek() { return toks[p]; }
    function next() { return toks[p++]; }
    function expect(t, what) {
      const tk = next();
      if (tk.t !== t) fail('Se esperaba ' + what, tk.pos);
      return tk;
    }

    function nud() {
      const tk = next();
      if (tk.t === 'num') {
        const v = tk.v;
        return function () { return v; };
      }
      if (tk.t === 'op' && tk.v === '-') {
        const c = expr(UNARY_BP);
        return function (a) { return -c(a); };
      }
      if (tk.t === 'op' && tk.v === '+') {
        return expr(UNARY_BP);
      }
      if (tk.t === 'lp') {
        const c = expr(0);
        expect('rp', 'un «)» que cierre el paréntesis');
        return c;
      }
      if (tk.t === 'ident') {
        const name = tk.v;
        const lower = name.toLowerCase();
        /* ¿Llamada a función? */
        if ((FN1[lower] || FN2[lower]) && peek().t === 'lp') {
          next(); /* consume ( */
          const args = [expr(0)];
          while (peek().t === 'comma') { next(); args.push(expr(0)); }
          expect('rp', 'un «)» que cierre ' + lower + '(...)');
          if (FN2[lower]) {
            if (args.length !== 2 && (lower === 'atan2' || lower === 'pow' || lower === 'mod')) {
              fail('La función ' + lower + ' necesita 2 argumentos', tk.pos);
            }
            const f2 = FN2[lower];
            if (args.length === 2) {
              const a0 = args[0], a1 = args[1];
              return function (a) { return f2(a0(a), a1(a)); };
            }
            /* min/max con n argumentos */
            return function (a) {
              const vals = args.map(function (c) { return c(a); });
              return f2.apply(null, vals);
            };
          }
          if (args.length !== 1) fail('La función ' + lower + ' necesita 1 argumento', tk.pos);
          const f1 = FN1[lower], a0 = args[0];
          return function (a) { return f1(a0(a)); };
        }
        if (varIdx[name] !== undefined) {
          const idx = varIdx[name];
          return function (a) { return a[idx]; };
        }
        if (varIdx[lower] !== undefined) {
          const idx2 = varIdx[lower];
          return function (a) { return a[idx2]; };
        }
        if (CONST[lower] !== undefined) {
          const cv = CONST[lower];
          return function () { return cv; };
        }
        if (FN1[lower] || FN2[lower]) fail('La función ' + lower + ' requiere paréntesis: ' + lower + '(...)', tk.pos);
        fail('Variable o función desconocida «' + name + '»' +
          (vars.length ? ' — se esperaba ' + vars.join(', ') : ''), tk.pos);
      }
      fail('Expresión incompleta o símbolo inesperado', tk.pos);
    }

    function expr(minBp) {
      let left = nud();
      for (;;) {
        const tk = peek();
        let lbp = 0, kind = null;
        if (tk.t === 'op') { lbp = LBP[tk.v]; kind = tk.v; }
        else if (tk.t === 'num' || tk.t === 'ident' || tk.t === 'lp') { lbp = 20; kind = '*imp'; }
        else break;
        if (lbp <= minBp) break;
        if (kind !== '*imp') next();
        const rbp = (kind === '^') ? lbp - 1 : lbp; /* ^ asociativa a la derecha */
        const right = expr(kind === '*imp' ? 20 : rbp);
        const l = left, r = right;
        switch (kind) {
          case '+': left = function (a) { return l(a) + r(a); }; break;
          case '-': left = function (a) { return l(a) - r(a); }; break;
          case '*': case '*imp': left = function (a) { return l(a) * r(a); }; break;
          case '/': left = function (a) { return l(a) / r(a); }; break;
          case '^': left = function (a) { return Math.pow(l(a), r(a)); }; break;
        }
      }
      return left;
    }

    const root = expr(0);
    const tail = peek();
    if (tail.t !== 'end') fail('Símbolo inesperado tras la expresión', tail.pos);
    return root;
  }

  /* --- API pública --- */

  const cache = new Map(); /* clave: vars.join('|') + '::' + src */
  const CACHE_MAX = 200;

  /* compile('x^2-2', ['x']) → fn tal que fn(1.5) = 0.25. Lanza Error con .pos. */
  function compile(src, vars) {
    vars = vars || ['x'];
    const key = vars.join('|') + '::' + src;
    const hit = cache.get(key);
    if (hit) return hit;
    const norm = normalize(src);
    if (!norm.trim()) fail('Expresión vacía', 0);
    const root = parse(norm, vars);
    let fn;
    if (vars.length === 1) {
      const scratch = [0];
      fn = function (x) { scratch[0] = x; return root(scratch); };
    } else {
      fn = function () { return root(arguments); };
    }
    fn.src = src;
    fn.vars = vars;
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(key, fn);
    return fn;
  }

  /* Versión sin excepciones: {ok, fn} | {ok:false, error, pos}. */
  function tryCompile(src, vars) {
    try {
      return { ok: true, fn: compile(src, vars) };
    } catch (e) {
      return { ok: false, error: e.message, pos: e.pos };
    }
  }

  /* Evalúa una expresión constante: '3/7 + sqrt(2)'. */
  function evalConst(src) {
    return compile(src, [])();
  }

  /* Wrapper compatible con el E() del legacy: E('x^2', {x:3}) → 9, NaN si error. */
  function E(src, scope) {
    try {
      const names = scope ? Object.keys(scope) : [];
      const fn = compile(src, names.length ? names : ['x']);
      if (!names.length) return fn(0);
      if (names.length === 1) return fn(scope[names[0]]);
      return fn.apply(null, names.map(function (k) { return scope[k]; }));
    } catch (err) {
      return NaN;
    }
  }

  /* Derivada numérica central (paso relativo al tamaño de x). */
  function dNum(fn, x) {
    const h = 1e-6 * Math.max(1, Math.abs(x));
    return (fn(x + h) - fn(x - h)) / (2 * h);
  }

  /* Compara una derivada tecleada con la numérica en varios puntos.
     Devuelve null si coinciden o {x, esperado, obtenido} del peor desacuerdo. */
  function checkDerivative(f, df, xs) {
    let worst = null;
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i];
      const fx = f(x);
      if (!isFinite(fx)) continue;
      const dn = dNum(f, x);
      const dv = df(x);
      if (!isFinite(dn) || !isFinite(dv)) continue;
      const err = Math.abs(dn - dv) / Math.max(1, Math.abs(dn));
      if (err > 1e-3 && (!worst || err > worst.err)) {
        worst = { x: x, esperado: dn, obtenido: dv, err: err };
      }
    }
    return worst;
  }

  NS.expr = {
    compile: compile,
    tryCompile: tryCompile,
    evalConst: evalConst,
    E: E,
    dNum: dNum,
    checkDerivative: checkDerivative,
    _FN1: FN1, _FN2: FN2, _CONST: CONST,
  };
})(globalThis.MNO = globalThis.MNO || {});
