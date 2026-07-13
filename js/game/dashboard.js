/* MNO.views.progress — 📊 Mi Progreso: autoevaluación del estudiante.
   Maestría por método, precisión al primer intento, detector de
   misconceptions (temas más fallados → recomendación), insignias y
   exportar/importar el progreso (JSON local, sin servidor). */
(function (NS) {
  'use strict';

  NS.views = NS.views || {};

  const NIVELES = ['Nuevo', 'Explorador', 'Aprendiz', 'Experto', 'Maestro'];

  function el(tag, cls, html) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html !== undefined) d.innerHTML = html;
    return d;
  }

  function fila(nombre, frac, texto) {
    const f = el('div', 'dash-fila');
    f.appendChild(el('span', 'nombre', nombre));
    const barra = el('div', 'dash-barra');
    const span = el('span');
    span.style.width = Math.round(Math.max(0, Math.min(1, frac)) * 100) + '%';
    barra.appendChild(span);
    f.appendChild(barra);
    f.appendChild(el('span', 'dash-val', texto));
    return f;
  }

  NS.views.progress = {
    mount: function (root) {
      const sec = el('section', 'pantalla met');
      const head = el('header', 'met-head');
      const back = el('a', 'btn-back', '←');
      back.href = '#/';
      head.appendChild(back);
      const tit = el('div', 'met-tit');
      tit.appendChild(el('h1', null, '📊 Mi Progreso'));
      tit.appendChild(el('p', 'met-desc', 'Todo esto vive SOLO en tu navegador: expórtalo si quieres conservarlo o compartirlo.'));
      head.appendChild(tit);
      sec.appendChild(head);

      const st = NS.store.raw();
      const g = NS.store.resumenGlobal();
      const grid = el('div', 'dash-grid');

      /* --- resumen --- */
      const c1 = el('div', 'dash-card');
      c1.appendChild(el('h3', null, 'Resumen'));
      c1.appendChild(el('p', null, '<span style="font-size:30px;font-weight:800;color:var(--warn)">⭐ ' + g.puntos + '</span> puntos'));
      c1.appendChild(el('p', 'met-desc', '🎖️ ' + g.insignias + ' de ' + NS.achievements.lista.length + ' insignias · 👑 ' + g.maestros + '/11 métodos a nivel Experto o más'));
      const botones = el('div');
      botones.style.marginTop = '14px';
      botones.style.display = 'flex';
      botones.style.gap = '8px';
      botones.style.flexWrap = 'wrap';
      const bExp = el('button', 'btn btn-suave', '⬇ Exportar JSON');
      bExp.type = 'button';
      bExp.addEventListener('click', function () { NS.exporter.descargar(); });
      const bImp = el('button', 'btn btn-suave', '⬆ Importar');
      bImp.type = 'button';
      bImp.addEventListener('click', function () { NS.exporter.importar(function () { NS.router.refresh(); }); });
      const bBor = el('button', 'btn btn-suave', '🗑 Borrar progreso');
      bBor.type = 'button';
      bBor.addEventListener('click', function () {
        if (confirm('¿Seguro? Se borra todo el progreso guardado en este navegador.')) {
          NS.store.borrar();
          NS.router.refresh();
        }
      });
      botones.appendChild(bExp);
      botones.appendChild(bImp);
      botones.appendChild(bBor);
      c1.appendChild(botones);
      grid.appendChild(c1);

      /* --- maestría por método --- */
      const c2 = el('div', 'dash-card');
      c2.appendChild(el('h3', null, 'Maestría por método'));
      Object.keys(NS.registry).forEach(function (mid) {
        if (mid === 'calc') return;
        const m = NS.registry[mid];
        const nivel = NS.store.mastery(mid);
        c2.appendChild(fila(m.icono + ' ' + m.nombre, nivel / 4, NIVELES[nivel]));
      });
      grid.appendChild(c2);

      /* --- precisión al primer intento --- */
      const c3 = el('div', 'dash-card');
      c3.appendChild(el('h3', null, 'Precisión al primer intento (Practicar)'));
      let hayPractica = false;
      Object.keys(NS.registry).forEach(function (mid) {
        const d = st.metodos[mid];
        if (!d || !d.practica.intentos) return;
        hayPractica = true;
        const p = d.practica;
        c3.appendChild(fila(
          NS.registry[mid].icono + ' ' + NS.registry[mid].nombre,
          p.primerIntento / p.intentos,
          Math.round(p.primerIntento / p.intentos * 100) + '% de ' + p.intentos
        ));
      });
      if (!hayPractica) c3.appendChild(el('p', 'met-desc', 'Aún no has practicado: entra en cualquier método → 🎯 Practicar.'));
      grid.appendChild(c3);

      /* --- detector de misconceptions --- */
      const c4 = el('div', 'dash-card');
      c4.appendChild(el('h3', null, '🔍 Detector de despistes'));
      const temas = [];
      Object.keys(st.metodos).forEach(function (mid) {
        const ft = st.metodos[mid].practica.fallosTema || {};
        Object.keys(ft).forEach(function (tema) {
          temas.push({ mid: mid, tema: tema, n: ft[tema] });
        });
      });
      temas.sort(function (a, b) { return b.n - a.n; });
      if (!temas.length) {
        c4.appendChild(el('p', 'met-desc', 'Sin patrones de fallo detectados (todavía 😏). Los fallos repetidos en un mismo concepto aparecerán aquí con una recomendación.'));
      } else {
        temas.slice(0, 5).forEach(function (t) {
          const m = NS.registry[t.mid];
          const item = el('div', 'teo-error');
          const legible = t.tema.replace(/-/g, ' ');
          item.innerHTML = '<b>' + legible + '</b> — ' + t.n + ' fallo' + (t.n > 1 ? 's' : '') +
            ' en ' + m.nombre + '. <a href="#/m/' + t.mid + '">Repasa la teoría 📖</a> y vuelve a <a href="#/m/' + t.mid + '?modo=practicar">Practicar 🎯</a>.';
          c4.appendChild(item);
        });
      }
      grid.appendChild(c4);

      /* --- carrera --- */
      const c5 = el('div', 'dash-card');
      c5.appendChild(el('h3', null, '🏁 Carrera de métodos'));
      c5.appendChild(el('p', null, st.carrera.corridas
        ? 'Has corrido <b>' + st.carrera.corridas + '</b> carrera' + (st.carrera.corridas > 1 ? 's' : '') + ' y acertado <b>' + st.carrera.apuestasOk + '</b> apuesta' + (st.carrera.apuestasOk === 1 ? '' : 's') + '.'
        : 'Aún no has corrido ninguna carrera. <a href="#/carrera">¡A la parrilla de salida!</a>'));
      grid.appendChild(c5);

      /* --- insignias --- */
      const c6 = el('div', 'dash-card');
      c6.style.gridColumn = '1 / -1';
      c6.appendChild(el('h3', null, '🎖️ Insignias'));
      NS.achievements.lista.forEach(function (a) {
        const tiene = !!st.logros[a.id];
        const chip = el('span', 'insignia ' + (tiene ? 'lograda' : 'pendiente'));
        chip.innerHTML = '<span class="ico">' + a.icono + '</span> <span><b>' + a.nombre + '</b> · ' + a.desc + '</span>';
        chip.title = tiene ? 'Conseguida el ' + String(st.logros[a.id]).slice(0, 10) : 'Pendiente';
        c6.appendChild(chip);
      });
      grid.appendChild(c6);

      sec.appendChild(grid);
      root.appendChild(sec);
    },
    unmount: function () {},
  };
})(globalThis.MNO = globalThis.MNO || {});
