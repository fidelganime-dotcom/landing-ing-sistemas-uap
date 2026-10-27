# 🚀 DISEÑA EL FUTURO DIGITAL — Ingeniería de Sistemas · UAP

Landing page institucional e interactiva de la carrera de **Ingeniería de Sistemas** de la
**Universidad Amazónica de Pando (UAP)**, dirigida a estudiantes de secundaria y a la comunidad
tecnológica.

> Diseño dark tech / cyberpunk con glassmorphism, neones, animaciones al scroll y una
> **Zona Gaming** con tres juegos totalmente jugables escritos desde cero.

---

## ✨ Secciones

| # | Sección | Descripción |
|---|---------|-------------|
| 1 | **Navbar responsiva** | Glassmorphism, indicador de sección activa al scroll, menú hamburguesa animado y CTA con glow *"Explorar Plan de Estudios"* |
| 2 | **Hero** | Red de partículas 3D interactiva (Three.js), título gigante en gradiente, subtítulo con efecto typewriter y 3 tarjetas flotantes (5 Años · LABS · 100% Salida laboral) |
| 3 | **Mitos vs Realidad** | 6 tarjetas con efecto **tilt 3D** que contrastan los mitos comunes con la realidad de la carrera |
| 4 | **Plan de Estudios** | Timeline interactivo con tabs por año (1.º–5.º), tarjetas desplegables por asignatura y badges de tecnologías (Python, C++, SQL, IoT, Java, Docker…) |
| 5 | **Campos de acción** | Grid con **glow hover** que sigue al cursor: Full Stack, IA & IoT, Datos, Ciberseguridad, PMO |
| 6 | **Zona Gaming** | Tabs con 3 juegos jugables: 🧩 Tetris Tech, 🎲 Cubo Rubik 3D, ♟️ Ajedrez Virtual + nota motivacional |
| 7 | **Eventos & QR** | Tarjeta de la *"Charla Orientativa en LAB 3"* + **generador/visualizador de QR** con presets, descarga PNG y copia de enlace |
| 8 | **Footer** | Enlaces rápidos, redes sociales, luces de fondo sutiles y copyright dinámico |

---

## 🎮 Zona Gaming

Tres juegos escritos en **JavaScript vanilla**, sin frameworks:

- **🧩 Tetris Tech** — Canvas 2D, rotación SRS con wall-kicks, bolsa aleatoria de 7 piezas,
  puntuación clásica, niveles con velocidad incremental, controles táctiles para celular y
  teclado para PC, pausa y reinicio.
- **🎲 Cubo Rubik 3D** — Three.js, 26 cubies, cámara orbital (arrastrar + rueda/pinch zoom),
  girar caras U D L R F B en ambos sentidos, mezclar, reiniciar, contador de movimientos y
  detección de solución.
- **♟️ Ajedrez Virtual** — Motor completo: validación por tipo de pieza, bloqueo por obstáculos,
  **jaque / jaque mate / ahogado**, **captura al paso**, **enroque**, notación SAN (`Qh4#`, `exd6`,
  `O-O`), piezas capturadas, historial y deshacer.

> *"Detrás de cada lógica de juego hay algoritmos, estructuras de datos y matemática aplicada:
> la base de la Ingeniería de Sistemas."*

---

## 🛠️ Tecnologías

- **Tailwind CSS** (CDN) — dark mode, sombras de neón, bordes con gradiente
- **Three.js** — partículas 3D de fondo y Cubo Rubik
- **Lucide Icons** + **Font Awesome** (solo iconos de marca)
- **qrcodejs** — generación de códigos QR
- **JavaScript vanilla** — interactividad liviana y modular
- **Google Fonts** — Orbitron · Rajdhani · JetBrains Mono

---

## ▶️ Cómo ejecutarlo

No hay build ni dependencias que instalar: basta con servir la carpeta por HTTP
(no abrir `index.html` directamente con `file://`, porque los módulos JS no se cargarían).

```bash
# con Python
python -m http.server 8765

# o con Node (npx)
npx serve -l 8765
```

Luego abre **http://localhost:8765/** en el navegador.

---

## 📁 Estructura

```
Pagina informativa/
├── index.html          # Página completa (8 secciones)
├── css/
│   └── styles.css      # Estilos propios: glassmorphism, neones, tilt, glow, responsive
└── js/
    ├── particles.js    # Red de nodos 3D (Three.js) + fallback Canvas 2D
    ├── plan-data.js    # Datos del plan de estudios (5 años × 5 asignaturas)
    ├── main.js         # Navbar, scroll, typewriter, tilt, tabs, acordeón, QR
    ├── tetris.js       # Motor de Tetris (SRS, scoring, niveles, táctil)
    ├── rubik.js        # Cubo Rubik 3D (rotación de capas, cámara orbital)
    └── chess.js        # Motor de ajedrez (validación, jaque/mate, al paso, enroque)
```

---

## 📱 Responsividad

Diseño 100% adaptable a **PC, tablet y celular**: layouts en Grid/Flexbox de Tailwind,
tablero y canvas con anchos `min()`, controles táctiles para los juegos y menú móvil
desplegable. Se respeta `prefers-reduced-motion` y el contenido es legible sin JavaScript.

---

## ✅ Calidad

- **0 errores de consola**
- **Lighthouse:** Best Practices **100** · Accessibilidad **90** · SEO **80**
- Código modular, comentado y con `node --check` limpio en los 6 módulos JS

---

<p align="center">
  Universidad Amazónica de Pando · Facultad de Ingeniería<br>
  <sub>Hecho con ♥ y mucha lógica · Ing. de Sistemas UAP</sub>
</p>
