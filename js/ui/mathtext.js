/* MNO.math — texto con matemáticas: «Texto con $x_{n+1} = \frac{a+b}{2}$ y **negrita**».
   Si KaTeX está cargado (vendor o CDN) renderiza con calidad LaTeX; si no
   (sin internet y sin vendor/), un conversor propio a HTML sub/sup/frac
   mantiene todo legible. El contenido de la app usa solo el subconjunto
   LaTeX que el fallback entiende. */
(function (NS) {
  'use strict';

  const GREEK = {
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε',
    zeta: 'ζ', eta: 'η', theta: 'θ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ',
    pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', varphi: 'φ', chi: 'χ',
    psi: 'ψ', omega: 'ω', Delta: 'Δ', Sigma: 'Σ', Pi: 'Π', Omega: 'Ω',
  };
  const SYM = {
    cdot: '·', times: '×', div: '÷', pm: '±', le: '≤', ge: '≥', ne: '≠',
    approx: '≈', to: '→', rightarrow: '→', leftarrow: '←', infty: '∞',
    sum: 'Σ', prod: 'Π', int: '∫', partial: '∂', forall: '∀', exists: '∃',
    in: '∈', subset: '⊂', cup: '∪', cap: '∩', neg: '¬', ldots: '…', cdots: '⋯',
    quad: ' ', qquad: '  ', ' ': ' ', ',': ' ', ';': ' ', '!': '', '{': '{', '}': '}',
    max: 'max', min: 'min', log: 'log', ln: 'ln', sin: 'sin', cos: 'cos',
    tan: 'tan', exp: 'exp', det: 'det', deg: 'deg', text: '', mathrm: '', mathbf: '',
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Lee un grupo {…} balanceado a partir de s[i] (que debe ser '{').
     Devuelve [contenido, siguienteÍndice]. */
  function readGroup(s, i) {
    if (s[i] !== '{') return [s[i] || '', i + 1];
    let depth = 1, j = i + 1, out = '';
    while (j < s.length && depth > 0) {
      if (s[j] === '{') depth++;
      else if (s[j] === '}') { depth--; if (!depth) break; }
      out += s[j];
      j++;
    }
    return [out, j + 1];
  }

  /* Conversor LaTeX→HTML de emergencia (subconjunto restringido). */
  function fallback(tex) {
    let out = '', i = 0;
    const s = tex;
    while (i < s.length) {
      const ch = s[i];
      if (ch === '\\') {
        let j = i + 1, cmd = '';
        while (j < s.length && /[a-zA-Z]/.test(s[j])) { cmd += s[j]; j++; }
        if (!cmd) { /* \, \; \{ ... */
          const c1 = s[j] || '';
          out += SYM[c1] !== undefined ? SYM[c1] : esc(c1);
          i = j + 1;
          continue;
        }
        i = j;
        if (cmd === 'frac' || cmd === 'dfrac' || cmd === 'tfrac') {
          const [num, i2] = readGroup(s, i);
          const [den, i3] = readGroup(s, i2);
          out += '<span class="frac"><span class="frn">' + fallback(num) + '</span><span class="frd">' + fallback(den) + '</span></span>';
          i = i3;
        } else if (cmd === 'sqrt') {
          const [rad, i2] = readGroup(s, i);
          out += '√(' + fallback(rad) + ')';
          i = i2;
        } else if (cmd === 'left' || cmd === 'right') {
          /* siguiente carácter es el delimitador */
          const d = s[i];
          if (d === '\\') { i++; } /* \left\{ */
          else { out += d === '.' ? '' : esc(d); i++; }
        } else if (cmd === 'text' || cmd === 'mathrm' || cmd === 'mathbf' || cmd === 'operatorname') {
          const [txt, i2] = readGroup(s, i);
          out += esc(txt);
          i = i2;
        } else if (GREEK[cmd]) {
          out += GREEK[cmd];
        } else if (SYM[cmd] !== undefined) {
          out += SYM[cmd];
        } else {
          out += esc(cmd);
        }
      } else if (ch === '_' || ch === '^') {
        const tag = ch === '_' ? 'sub' : 'sup';
        i++;
        let content;
        if (s[i] === '{') {
          const [g, i2] = readGroup(s, i);
          content = fallback(g);
          i = i2;
        } else if (s[i] === '\\') {
          let j = i + 1, cmd = '';
          while (j < s.length && /[a-zA-Z]/.test(s[j])) { cmd += s[j]; j++; }
          content = GREEK[cmd] || SYM[cmd] || esc(cmd);
          i = j;
        } else {
          content = esc(s[i] || '');
          i++;
        }
        out += '<' + tag + '>' + content + '</' + tag + '>';
      } else if (ch === '{' || ch === '}') {
        i++;
      } else {
        out += esc(ch);
        i++;
      }
    }
    return out;
  }

  /* KaTeX puede llegar tarde (CDN): lo que se pintó con el fallback se
     recuerda y se re-renderiza en cuanto KaTeX esté disponible. */
  const pendientes = [];
  let vigilando = false;
  function vigilaKatex() {
    if (vigilando) return;
    vigilando = true;
    let intentos = 0;
    const timer = setInterval(function () {
      intentos++;
      if (typeof katex !== 'undefined' && katex.render) {
        clearInterval(timer);
        const lote = pendientes.splice(0, pendientes.length);
        lote.forEach(function (p) {
          if (p.span.isConnected) renderMathInto(p.span, p.tex);
        });
      } else if (intentos > 80 || pendientes.length === 0) {
        clearInterval(timer);
        vigilando = false;
      }
    }, 250);
  }

  function renderMathInto(span, tex) {
    if (typeof katex !== 'undefined' && katex.render) {
      try {
        span.className = '';
        katex.render(tex, span, { throwOnError: false, displayMode: false, output: 'html' });
        return;
      } catch (e) { /* cae al fallback */ }
    }
    span.className = 'math-fb';
    span.innerHTML = fallback(tex);
    pendientes.push({ span: span, tex: tex });
    vigilaKatex();
  }

  /* Renderiza «texto con $mates$ y **negrita**» dentro de el.
     La negrita se procesa primero para poder envolver fórmulas. */
  function renderTrozo(el, part) {
    const trozos = part.split(/(\$[^$]+\$)/g);
    trozos.forEach(function (tz) {
      if (tz.startsWith('$') && tz.endsWith('$') && tz.length > 2) {
        const span = document.createElement('span');
        renderMathInto(span, tz.slice(1, -1));
        el.appendChild(span);
      } else if (tz) {
        el.appendChild(document.createTextNode(tz));
      }
    });
  }

  function render(el, str) {
    el.textContent = '';
    const bold = String(str).split(/(\*\*[^*]+?\*\*)/g);
    bold.forEach(function (b) {
      if (b.startsWith('**') && b.endsWith('**') && b.length > 4) {
        const st = document.createElement('strong');
        renderTrozo(st, b.slice(2, -2));
        el.appendChild(st);
      } else if (b) {
        renderTrozo(el, b);
      }
    });
  }

  /* Un elemento nuevo con la línea renderizada. */
  function line(str, cls) {
    const div = document.createElement('div');
    div.className = cls || 'mline';
    render(div, str);
    return div;
  }

  NS.math = { render: render, line: line, fallback: fallback, renderMathInto: renderMathInto };
})(globalThis.MNO = globalThis.MNO || {});
