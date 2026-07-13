/* MNO.router — enrutado por hash: funciona igual en file:// y GitHub Pages.
   #/            → mapa de aprendizaje
   #/m/newton    → pantalla de método (+ ?modo=practicar|reto|cuaderno)
   #/carrera     → carrera de métodos
   #/progreso    → dashboard
   #/calc        → laboratorio f(x)                                        */
(function (NS) {
  'use strict';

  let actual = null; /* vista montada */

  function parse() {
    const h = location.hash || '#/';
    const m = h.match(/^#\/m\/([a-z]+)(?:\?(.*))?$/);
    if (m) {
      const params = { id: m[1] };
      (m[2] || '').split('&').forEach(function (kv) {
        const p = kv.split('=');
        if (p[0]) params[p[0]] = decodeURIComponent(p[1] || '');
      });
      return { view: 'method', params: params };
    }
    if (h.indexOf('#/carrera') === 0) return { view: 'race', params: {} };
    if (h.indexOf('#/progreso') === 0) return { view: 'progress', params: {} };
    if (h.indexOf('#/calc') === 0) return { view: 'calc', params: {} };
    return { view: 'home', params: {} };
  }

  function go() {
    const app = document.getElementById('app');
    const r = parse();
    let vista = NS.views[r.view];
    if (!vista) {
      NS.ui.toast('Esa sección aún no está disponible.', 'info');
      vista = NS.views.home;
    }
    if (actual && actual.unmount) { try { actual.unmount(); } catch (e) { /* nunca bloquear la navegación */ } }
    app.innerHTML = '';
    window.scrollTo(0, 0);
    actual = vista;
    vista.mount(app, r.params);
  }

  NS.router = {
    start: function () {
      window.addEventListener('hashchange', go);
      go();
    },
    refresh: go,
  };
})(globalThis.MNO = globalThis.MNO || {});
