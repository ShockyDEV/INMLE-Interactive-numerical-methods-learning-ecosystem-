/* Empaqueta MNO Interactivo en UN solo archivo HTML autocontenido.
   Genera:
     dist/mno-interactivo.html  → documento completo (doble clic / compartir)
     dist/artifact.html         → variante sin <html>/<head>/<body> (para publicar
                                  como página alojada que envuelve el contenido)
   Uso: node dev/build-single.js */
'use strict';

const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const lee = (p) => fs.readFileSync(path.join(raiz, p), 'utf8');

const CSS = ['css/base.css', 'css/layout.css', 'css/components.css'];

/* mismo orden que index.html: core → plot → registry → state → ui → game → content → app */
const JS = [
  'js/core/num.js',
  'js/core/expr.js',
  'js/core/trace.js',
  'js/core/engines/rootfinding.js',
  'js/core/engines/linear.js',
  'js/core/engines/interp.js',
  'js/plot/plot2d.js',
  'js/plot/anim.js',
  'js/plot/errorchart.js',
  'js/plot/matrixview.js',
  'js/registry.js',
  'js/state/store.js',
  'js/state/achievements.js',
  'js/state/exporter.js',
  'js/ui/mathtext.js',
  'js/ui/widgets.js',
  'js/ui/player.js',
  'js/ui/theory.js',
  'js/ui/methodscreen.js',
  'js/ui/home.js',
  'js/game/quiz.js',
  'js/game/challenge.js',
  'js/game/race.js',
  'js/game/dashboard.js',
  'js/content/theory/teoria.js',
  'js/content/quizzes/preguntas.js',
  'js/content/challenges/retos.js',
  'js/content/packs/biseccion.js',
  'js/content/packs/cuerda.js',
  'js/content/packs/puntofijo.js',
  'js/content/packs/newton.js',
  'js/content/packs/secante.js',
  'js/content/packs/gauss.js',
  'js/content/packs/jacobi.js',
  'js/content/packs/seidel.js',
  'js/content/packs/lagrange.js',
  'js/content/packs/newtoni.js',
  'js/content/packs/hermite.js',
  'js/router.js',
  'js/app.js',
];

const css = CSS.map((p) => '/* === ' + p + ' === */\n' + lee(p)).join('\n');
/* </script> dentro de strings JS rompería el inline; no existe en el código, pero por si acaso */
const js = JS.map((p) => '/* === ' + p + ' === */\n' + lee(p)).join('\n;\n').replace(/<\/script>/gi, '<\\/script>');

const katexLoader = `
(function () {
  var d = document;
  function css(href, onerr) { var l = d.createElement('link'); l.rel = 'stylesheet'; l.href = href; if (onerr) l.onerror = onerr; d.head.appendChild(l); }
  function js(src) { var s = d.createElement('script'); s.src = src; s.defer = true; d.head.appendChild(s); }
  var CDN = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/';
  css(CDN + 'katex.min.css');
  js(CDN + 'katex.min.js');
})();
`;

const cuerpo = [
  '<title>MNO Interactivo — Métodos Numéricos</title>',
  '<style>\n' + css + '\n</style>',
  '<script>' + katexLoader + '</script>',
  '<div id="app" aria-live="polite"></div>',
  '<noscript><div class="boot-error"><h1>MNO Interactivo</h1><p>Esta aplicación necesita JavaScript.</p></div></noscript>',
  '<script>\n' + js + '\n</script>',
].join('\n');

const docCompleto = [
  '<!DOCTYPE html>',
  '<html lang="es">',
  '<head>',
  '<meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">',
  '<meta name="description" content="MNO Interactivo — aprende métodos numéricos jugando: visualizaciones animadas, predicción de pasos, retos y carrera de convergencia.">',
  '<meta name="theme-color" content="#0b0e17">',
  '<link rel="icon" href="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><text y=\'0.9em\' font-size=\'90\'>🎯</text></svg>">',
  '</head>',
  '<body>',
  cuerpo,
  '</body>',
  '</html>',
].join('\n');

fs.mkdirSync(path.join(raiz, 'dist'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'dist/mno-interactivo.html'), docCompleto);
fs.writeFileSync(path.join(raiz, 'dist/artifact.html'), cuerpo);

const kb = (s) => Math.round(Buffer.byteLength(s, 'utf8') / 1024) + ' KB';
console.log('dist/mno-interactivo.html →', kb(docCompleto));
console.log('dist/artifact.html        →', kb(cuerpo));
