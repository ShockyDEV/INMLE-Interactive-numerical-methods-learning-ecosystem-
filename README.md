# INMLE · MNO Interactivo — Métodos Numéricos como juego

*Interactive Numerical Methods Learning Ecosystem*

Plataforma web educativa **interactiva y gamificada** para aprender métodos numéricos:
11 métodos con visualizaciones animadas, predicción de pasos con feedback, retos
puntuados, carrera de convergencia y analítica de aprendizaje local. Sin servidor,
sin build tools, sin dependencias obligatorias.

**Abrir**: doble clic en `index.html`, o sirviéndolo con cualquier servidor estático.

```bash
python dev/server.py 8123        # servidor de desarrollo sin caché
# o simplemente: python -m http.server
```

## Los cuatro modos de cada método

| Modo | Qué hace | Fundamento pedagógico |
|---|---|---|
| 🔬 **Explorar** | Visualización animada paso a paso: tangentes que se deslizan, telaraña del punto fijo, operaciones de fila que vuelan, intervalos que colapsan. Parámetros arrastrables sobre la gráfica. | Múltiples representaciones enlazadas (fórmula ↔ número ↔ dibujo) |
| 🎯 **Practicar** | Preguntas de predicción generadas al vuelo: «¿dónde cortará la tangente?» (clic en la gráfica), «¿qué mitad sobrevive?», «calcula m₂₁»… Feedback en dos niveles: pista → solución explicada. | Predecir-Observar-Explicar + feedback elaborado inmediato |
| 🏆 **Reto** | Desafíos puntuados (★★★ ≥90 · ★★ ≥60 · ★): cercar la raíz correcta, apostar qué g(x) converge, redescubrir los nodos de Chebyshev… | Aprendizaje por descubrimiento guiado, maestría |
| 📓 **Cuaderno** | El paso a paso completo con todas las cuentas (la calculadora clásica, conservada). | Ejemplo resuelto / apoyo al estudio |

Transversales: 🏁 **Carrera de Métodos** (apuesta + gráfico log del error en vivo +
podio por iteraciones Y por evaluaciones de f), 📊 **Mi Progreso** (maestría, precisión
al primer intento, detector de despistes por concepto, insignias, exportar JSON),
🧪 **Laboratorio f(x)**.

## Métodos incluidos

- **Raíces**: Bisección · Cuerda (regula falsi) · Punto Fijo (con telaraña) · Newton–Raphson · Secante
- **Sistemas**: Eliminación Gaussiana (con L, U y det) · Jacobi · Gauss-Seidel
- **Interpolación**: Lagrange · Newton (diferencias divididas) · Hermite (generalizadas)

## Arquitectura (sin build tools)

Scripts clásicos + espacio de nombres global `MNO` (funciona con `file://` y en
GitHub Pages). SPA con enrutado por hash (`#/m/newton?modo=practicar`).

```
index.html            shell + orden de carga + KaTeX en cascada
css/                  base · layout · componentes (tema oscuro)
js/core/              expr.js (parser propio, sin eval) · num · trace
js/core/engines/      los 11 métodos como funciones puras (params → Traza)
js/plot/              plot2d (canvas) · anim · errorchart · matrixview (DOM)
js/ui/                player · mathtext (KaTeX + fallback) · methodscreen · home · teoría
js/state/             store (localStorage versionado) · logros · exportador
js/game/              quiz (Practicar) · challenge (Reto) · race · dashboard
js/content/packs/     teoría + preguntas + retos de cada método
legacy/               la calculadora original intacta (oráculo de paridad)
dev/                  parity.js · validate-pack.js · server.py
```

**El concepto central es la Traza**: cada motor devuelve una lista de pasos tipados
(estado numérico + explicación con LaTeX + primitivas geométricas + ganchos de quiz).
Los cuatro modos consumen la MISMA traza: la visualización, la práctica y la
calculadora son la misma computación — el dibujo no puede mentir.

## Verificación

```bash
node dev/parity.js                                        # 98 comprobaciones vs oráculo
node dev/validate-pack.js js/content/packs/newton.js newton   # validar un pack
```

La paridad numérica con la calculadora original está verificada para los 11 métodos.
**Excepción deliberada**: Hermite. La versión original aplicaba la regla de nodos
repetidos como `dd[i][j] = dato[i+j]`, válida solo en la primera fila de la tabla;
su polinomio no interpolaba sus propios datos con derivadas de orden ≥ 2 en nodos
interiores. Esta versión usa la regla correcta `dd[i][j] = dato[inicioGrupo(i)+j]`
y el test verifica que P interpola valores y derivadas.

## KaTeX y uso sin conexión

Las fórmulas usan KaTeX con carga en cascada: `vendor/katex/` local → CDN
(jsdelivr) → conversor propio a HTML (siempre legible). Para aulas sin internet,
descarga una release de KaTeX y copia en `vendor/katex/`: `katex.min.css`,
`katex.min.js` y la carpeta `fonts/`. Sin eso, la app funciona igual (con CDN o
con el fallback).

## Publicar en GitHub Pages

1. Sube la carpeta a un repositorio.
2. Settings → Pages → Deploy from branch → `main` / root.
3. Listo: no hay pasos de build.

## Privacidad y datos (para estudios de aula)

Todo el progreso vive en `localStorage` del navegador del estudiante: no hay
servidor ni telemetría. Desde 📊 Mi Progreso se puede **exportar un JSON** con los
contadores agregados (intentos, aciertos al primer intento por tipo de pregunta,
temas fallados, retos y estrellas) — útil para estudios con consentimiento
explícito, compartiendo el archivo voluntariamente.
