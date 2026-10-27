/* ══════════════════════════════════════════════════════════════════
   PLAN DE ESTUDIOS — Ingeniería de Sistemas · UAP
   Datos por año (1.º → 5.º). Cada asignatura incluye:
     · nombre, icono (Lucide), descripción, semestre, área
     · tecnologías (badges) y contenidos clave
   Se consume desde js/main.js → renderPlan()
   ══════════════════════════════════════════════════════════════════ */

const PLAN = {
  1: {
    title: 'Fundamentos',
    summary: 'Base sólida: lógica, matemática, programación desde cero y descubrimiento del hardware.',
    color: 'neon-cyan',
    subjects: [
      {
        name: 'Introducción a la Programación', icon: 'code-xml', sem: '1.er Semestre', area: 'Programación',
        desc: 'Tu primer contacto con el pensamiento computacional: variables, condicionales, bucles y funciones resueltas en pseudocódigo y luego en código real.',
        tech: ['Pseudocódigo', 'Python', 'Flowchart'],
        topics: ['Algoritmos y estructuras básicas', 'Tipos de datos y operadores', 'Control de flujo', 'Funciones y modularidad']
      },
      {
        name: 'Fundamentos de Matemática Discreta', icon: 'sigma', sem: '1.er Semestre', area: 'Ciencias',
        desc: 'La matemática que sostiene toda la informática: lógica, conjuntos, grafos y combinatoria.',
        tech: ['Lógica', 'Grafos', 'Combinatoria'],
        topics: ['Proporcionalidad y álgebra', 'Lógica proposicional', 'Conjuntos y relaciones', 'Introducción a grafos']
      },
      {
        name: 'Arquitectura de Computadoras', icon: 'cpu', sem: '2.º Semestre', area: 'Hardware',
        desc: 'Cómo funciona por dentro la máquina: desde el transistor hasta el sistema de instrucciones.',
        tech: ['Ensamblador', 'Binario', 'Linux'],
        topics: ['Unidad central de proceso', 'Memoria y jerarquía de almacenamiento', 'Entrada / salida', 'Introducción a Linux y terminal']
      },
      {
        name: 'Física para Ingeniería', icon: 'atom', sem: '1.er Semestre', area: 'Ciencias',
        desc: 'Mecánica, electricidad y ondas: el puente entre el mundo físico y los sistemas que lo modelan.',
        tech: ['Simulaciones', 'Laboratorio'],
        topics: ['Cinemática y dinámica', 'Electricidad y circuitos', 'Ondas y señales', 'Medición experimental']
      },
      {
        name: 'Comunicación y Habilidades Blandas', icon: 'messages-square', sem: '2.º Semestre', area: 'Humano',
        desc: 'Un ingeniero que no comunica bien no lidera bien. Trabajo en equipo, presentación y escritura técnica.',
        tech: ['Public speaking', 'Scrum básico'],
        topics: ['Comunicación efectiva', 'Trabajo colaborativo', 'Gestión del tiempo', 'Ética profesional']
      }
    ]
  },

  2: {
    title: 'Construcción',
    summary: 'Programación avanzada, estructuras de datos, bases de datos y las primeras redes reales.',
    color: 'neon-lime',
    subjects: [
      {
        name: 'Programación Orientada a Objetos', icon: 'boxes', sem: '1.er Semestre', area: 'Programación',
        desc: 'El paradigma que domina la industria: clases, herencia, polimorfismo y diseño limpio.',
        tech: ['Java', 'C++', 'UML'],
        topics: ['Clases y objetos', 'Herencia y polimorfismo', 'Interfaces y patrones', 'Modelado con UML']
      },
      {
        name: 'Estructuras de Datos y Algoritmos', icon: 'network', sem: '2.º Semestre', area: 'Algoritmos',
        desc: 'El corazón de la eficiencia: listas, árboles, hash y análisis de complejidad big-O.',
        tech: ['Python', 'C++', 'Big-O'],
        topics: ['Listas, pilas y colas', 'Árboles y grafos', 'Tablas hash', 'Ordenamiento y búsqueda']
      },
      {
        name: 'Bases de Datos I', icon: 'database', sem: '1.er Semestre', area: 'Datos',
        desc: 'Diseña esquemas normalizados y extrae información con poderosas consultas SQL.',
        tech: ['SQL', 'PostgreSQL', 'MySQL', 'ER'],
        topics: ['Modelo entidad-relación', 'Normalización', 'DDL y DML', 'Joins y subconsultas']
      },
      {
        name: 'Redes de Computadoras I', icon: 'globe-2', sem: '2.º Semestre', area: 'Redes',
        desc: 'El modelo TCP/IP y la pila de protocolos que hace posible Internet.',
        tech: ['TCP/IP', 'Cisco', 'Wireshark'],
        topics: ['Modelo OSI / TCP-IP', 'Direccionamiento IP', 'Subredes y máscaras', 'Cableado y dispositivos']
      },
      {
        name: 'Cálculo e Ingeniería', icon: 'function-square', sem: '1.er Semestre', area: 'Ciencias',
        desc: 'Derivadas, integrales y modelado: herramientas para optimizar sistemas y procesos.',
        tech: ['GeoGebra', 'Modelado'],
        topics: ['Límites y continuidad', 'Derivadas e integrales', 'Optimización', 'Modelado de problemas']
      }
    ]
  },

  3: {
    title: 'Especialización',
    summary: 'Aquí la carrera se acelera: desarrollo web completo, ingeniería de software, IoT y seguridad.',
    color: 'neon-magenta',
    subjects: [
      {
        name: 'Ingeniería de Software', icon: 'layers-3', sem: '1.er Semestre', area: 'Software',
        desc: 'Metodologías para construir sistemas grandes a tiempo, con calidad y sin caos.',
        tech: ['Scrum', 'Git', 'Jira', 'Testing'],
        topics: ['Ciclo de vida del software', 'Scrum y Kanban', 'Control de versiones con Git', 'Pruebas unitarias y QA']
      },
      {
        name: 'Desarrollo Web Full Stack', icon: 'layout-dashboard', sem: '2.º Semestre', area: 'Desarrollo',
        desc: 'De la base de datos a la pantalla: construye aplicaciones web completas y responsivas.',
        tech: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Docker'],
        topics: ['Frontend moderno', 'APIs REST', 'Autenticación y sesiones', 'Despliegue contenedorizado']
      },
      {
        name: 'Sistemas Embebidos & IoT', icon: 'radio-tower', sem: '1.er Semestre', area: 'Hardware',
        desc: 'Programa microcontroladores y conecta sensores al mundo real mediante protocolos ligeros.',
        tech: ['Arduino', 'ESP32', 'MQTT', 'C'],
        topics: ['Microcontroladores y sensores', 'Comunicación serial', 'Protocolos MQTT / CoAP', 'Dashboards IoT']
      },
      {
        name: 'Ciberseguridad', icon: 'shield-alert', sem: '2.º Semestre', area: 'Seguridad',
        desc: 'Piensa como atacante para defenderte: vulnerabilidades, cifrado y buenas prácticas OWASP.',
        tech: ['Kali', 'OWASP', 'Wireshark', 'Firewall'],
        topics: ['Modelos de amenaza', 'Cifrado y hashing', 'OWASP Top 10', 'Auditoría básica']
      },
      {
        name: 'Sistemas Operativos', icon: 'hard-drive', sem: '1.er Semestre', area: 'Sistemas',
        desc: 'Procesos, hilos, memoria y permisos: lo que ocurre bajo el capó de todo sistema.',
        tech: ['Linux', 'Bash', 'Shell'],
        topics: ['Gestión de procesos', 'Memoria virtual', 'Sistema de archivos', 'Permisos y usuarios']
      }
    ]
  },

  4: {
    title: 'Inteligencia',
    summary: 'Inteligencia artificial, ciencia de datos, nube y las matemáticas que hacen posible la IA.',
    color: 'neon-violet',
    subjects: [
      {
        name: 'Inteligencia Artificial', icon: 'brain-circuit', sem: '1.er Semestre', area: 'IA',
        desc: 'Agentes inteligentes, búsqueda y los algoritmos que toman decisiones como los humanos.',
        tech: ['Python', 'A*', 'Minimax', 'Prolog'],
        topics: ['Sistemas expertos', 'Búsqueda informedada', 'Minimax y juegos', 'Lógica difusa']
      },
      {
        name: 'Machine Learning', icon: 'sparkles', sem: '2.º Semestre', area: 'IA',
        desc: 'Entrena modelos que aprenden de datos: clasificación, regresión y redes neuronales.',
        tech: ['scikit-learn', 'TensorFlow', 'Pandas', 'NumPy'],
        topics: ['Aprendizaje supervisado', 'No supervisado', 'Redes neuronales', 'Evaluación de modelos']
      },
      {
        name: 'Ciencia de Datos & Big Data', icon: 'bar-chart-3', sem: '1.er Semestre', area: 'Datos',
        desc: 'Transforma millones de registros en decisiones de negocio medibles.',
        tech: ['Pandas', 'Power BI', 'Spark', 'ETL'],
        topics: ['Limpieza y transformación', 'Visualización de datos', 'Data Warehousing', 'KPIs y reportes']
      },
      {
        name: 'Cloud & DevOps', icon: 'cloud-cog', sem: '2.º Semestre', area: 'Infra',
        desc: 'Despliega, escalas y automatiza infraestructura como código en la nube.',
        tech: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
        topics: ['Contenedores', 'Orquestación', 'Pipelines de integración', 'Infraestructura como código']
      },
      {
        name: 'Probabilidad y Estadística', icon: 'percent', sem: '1.er Semestre', area: 'Ciencias',
        desc: 'La base matemática que da rigor a cada modelo predictivo que construyas.',
        tech: ['R', 'Python'],
        topics: ['Distribuciones de probabilidad', 'Inferencia estadística', 'Correlación y regresión', 'Test de hipótesis']
      }
    ]
  },

  5: {
    title: 'Liderazgo',
    summary: 'Gestión de proyectos, seguridad avanzada, ingeniería de datos y tu trabajo de titulación.',
    color: 'neon-amber',
    subjects: [
      {
        name: 'Gestión de Proyectos (PMO)', icon: 'kanban', sem: '1.er Semestre', area: 'Gestión',
        desc: 'Lidera equipos y entregas con alcance, tiempo, costo y calidad bajo control.',
        tech: ['Scrum', 'MS Project', 'Jira', 'ITIL'],
        topics: ['Alcance y cronograma', 'Gestión de riesgos', 'Presupuesto y costos', 'Stakeholders']
      },
      {
        name: 'Auditoría y Seguridad Avanzada', icon: 'fingerprint', sem: '2.º Semestre', area: 'Seguridad',
        desc: 'Auditorías, cumplimiento normativo y respuesta a incidentes en entornos críticos.',
        tech: ['Pentest', 'ISO 27001', 'SIEM'],
        topics: ['Auditoría de sistemas', 'Cumplimiento normativo', 'Gestión de incidentes', 'Continuidad del negocio']
      },
      {
        name: 'Ingeniería de Datos', icon: 'workflow', sem: '1.er Semestre', area: 'Datos',
        desc: 'Diseña pipelines confiables que mueven datos de origen a destino a escala.',
        tech: ['Airflow', 'dbt', 'SQL', 'Lakehouse'],
        topics: ['Arquitecturas de datos', 'Orquestación de flujos', 'Calidad de datos', 'Governance']
      },
      {
        name: 'Emprendimiento & Innovación', icon: 'lightbulb', sem: '2.º Semestre', area: 'Negocio',
        desc: 'Del problema a la startup: valida tu idea, construye un modelo de negocio y presenta a inversionistas.',
        tech: ['Lean Startup', 'Business Model', 'Pitch'],
        topics: ['Descubrimiento de clientes', 'MVP y validación', 'Modelo de negocio', 'Financiamiento']
      },
      {
        name: 'Proyecto de Titulación', icon: 'graduation-cap', sem: '2.º Semestre', area: 'Final',
        desc: 'Tu obra de egreso: un sistema real, con impacto, documentado y defendido ante jurado.',
        tech: ['Investigación', 'Defensa', 'Publicación'],
        topics: ['Formulación del problema', 'Diseño y desarrollo', 'Pruebas y resultados', 'Sustentación final']
      }
    ]
  }
};

// Se expone globalmente para que main.js lo consuma
window.PLAN = PLAN;
