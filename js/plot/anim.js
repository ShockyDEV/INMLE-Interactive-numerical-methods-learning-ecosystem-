/* MNO.anim — interpolación entre pasos: tween con rAF y mezcla de primitivas
   emparejadas por id (el punto "viaja", la banda se encoge, la telaraña se
   dibuja sola; primitivas sin pareja hacen fade in/out). */
(function (NS) {
  'use strict';

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* tween(400, up, done) → función de cancelación. */
  function tween(dur, onUpdate, onDone) {
    let raf = 0, cancelled = false;
    const t0 = performance.now();
    function frame(now) {
      if (cancelled) return;
      const t = Math.min(1, (now - t0) / dur);
      onUpdate(easeInOutCubic(t), t);
      if (t < 1) raf = requestAnimationFrame(frame);
      else if (onDone) onDone();
    }
    raf = requestAnimationFrame(frame);
    return function () { cancelled = true; cancelAnimationFrame(raf); };
  }

  const NUMF = ['x', 'y', 'x1', 'y1', 'x2', 'y2', 'a', 'b', 'c', 'r'];

  function lerp(a, b, t) { return a + (b - a) * t; }

  function lerpPrim(pa, pb, t) {
    const out = Object.assign({}, pb);
    NUMF.forEach(function (f) {
      if (typeof pa[f] === 'number' && typeof pb[f] === 'number') out[f] = lerp(pa[f], pb[f], t);
    });
    if (pb.t === 'polyline' && pa.pts && pb.pts) {
      if (pb.pts.length > pa.pts.length) {
        /* la trayectoria crece: efecto "se dibuja sola" */
        out.pts = pb.pts;
        out.upTo = (pa.pts.length - 1) + (pb.pts.length - pa.pts.length) * t;
      } else if (pb.pts.length === pa.pts.length) {
        out.pts = pb.pts.map(function (q, i) {
          return [lerp(pa.pts[i][0], q[0], t), lerp(pa.pts[i][1], q[1], t)];
        });
      }
    }
    return out;
  }

  /* Mezcla dos listas de primitivas dinámicas para el instante t ∈ [0,1]. */
  function lerpPrims(aPrims, bPrims, t) {
    if (t >= 1) return bPrims;
    const byId = {};
    (aPrims || []).forEach(function (p) { if (p.id) byId[p.id] = p; });
    const out = [];
    const usados = {};
    (bPrims || []).forEach(function (p) {
      if (p.t === 'curve') { out.push(p); return; }
      const pa = p.id && byId[p.id];
      if (pa) {
        usados[p.id] = true;
        out.push(lerpPrim(pa, p, t));
      } else {
        const cp = Object.assign({}, p);
        cp._alpha = t;
        out.push(cp);
      }
    });
    (aPrims || []).forEach(function (p) {
      if (p.t === 'curve' || (p.id && usados[p.id])) return;
      const cp = Object.assign({}, p);
      cp._alpha = (1 - t) * (p._alpha !== undefined ? p._alpha : 1);
      out.push(cp);
    });
    return out;
  }

  NS.anim = { tween: tween, lerpPrims: lerpPrims, ease: easeInOutCubic };
})(globalThis.MNO = globalThis.MNO || {});
