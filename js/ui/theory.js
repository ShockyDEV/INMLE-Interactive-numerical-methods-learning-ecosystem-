/* MNO.theory — panel lateral (drawer) de teoría por método.
   El contenido vive en js/content/theory/*.js como
   NS.content.theory[id] = { secciones: [{titulo, icono?, lineas:[...]}] }.
   Cada línea admite $LaTeX$ inline y **negrita**. */
(function (NS) {
  'use strict';

  NS.content = NS.content || {};
  NS.content.theory = NS.content.theory || {};

  let overlay = null;

  function close() {
    if (!overlay) return;
    overlay.classList.remove('vivo');
    const o = overlay;
    overlay = null;
    setTimeout(function () { o.remove(); }, 280);
    document.removeEventListener('keydown', escHandler);
  }

  function escHandler(e) { if (e.key === 'Escape') close(); }

  function open(methodId) {
    const teo = NS.content.theory[methodId];
    const method = NS.registry[methodId];
    if (!teo || !method) {
      NS.ui.toast('La teoría de este método se está escribiendo…', 'info');
      return;
    }
    close();
    overlay = document.createElement('div');
    overlay.className = 'teo-overlay';
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    const panel = document.createElement('aside');
    panel.className = 'teo-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Teoría: ' + method.nombre);

    const head = document.createElement('div');
    head.className = 'teo-head';
    const h = document.createElement('h2');
    h.textContent = method.nombre;
    head.appendChild(h);
    const x = document.createElement('button');
    x.className = 'teo-cerrar';
    x.innerHTML = '✕';
    x.setAttribute('aria-label', 'Cerrar');
    x.addEventListener('click', close);
    head.appendChild(x);
    panel.appendChild(head);

    const body = document.createElement('div');
    body.className = 'teo-body';
    teo.secciones.forEach(function (sec) {
      const s = document.createElement('section');
      s.className = 'teo-sec';
      const st = document.createElement('h3');
      st.textContent = sec.titulo;
      s.appendChild(st);
      (sec.lineas || []).forEach(function (linea) {
        if (typeof linea === 'string') {
          s.appendChild(NS.math.line(linea, 'teo-linea'));
        } else if (linea.tipo === 'vs') {
          /* dos columnas ventajas/desventajas */
          const cols = document.createElement('div');
          cols.className = 'teo-vs';
          [['Ventajas', linea.pros], ['Limitaciones', linea.contras]].forEach(function (par) {
            const col = document.createElement('div');
            const ct = document.createElement('h4');
            ct.textContent = par[0];
            col.appendChild(ct);
            (par[1] || []).forEach(function (item) {
              col.appendChild(NS.math.line('• ' + item, 'teo-item'));
            });
            cols.appendChild(col);
          });
          s.appendChild(cols);
        } else if (linea.tipo === 'error') {
          const err = document.createElement('div');
          err.className = 'teo-error';
          NS.math.render(err, '**Error típico.** ' + linea.texto);
          s.appendChild(err);
        }
      });
      body.appendChild(s);
    });
    panel.appendChild(body);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('vivo'); });
    document.addEventListener('keydown', escHandler);
  }

  NS.theory = { open: open, close: close };
})(globalThis.MNO = globalThis.MNO || {});
