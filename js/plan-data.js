/* ══════════════════════════════════════════════════════════════════
   PLAN DE ESTUDIOS — Ingeniería de Sistemas · UAP
   Datos por año (1.º → 5.º). Cada grupo indica el semestre que
   corresponde y la lista de asignaturas (solo el nombre).
   Se consume desde js/main.js → renderPlan()
   ══════════════════════════════════════════════════════════════════ */

const PLAN = {
  1: {
    sem: 'Segundo Semestre',
    color: 'neon-cyan',
    subjects: [
      'Programación II',
      'Física III',
      'Cálculo II',
      'Álgebra II',
      'Sistemas Administrativos',
      'Matemática Discreta'
    ]
  },

  2: {
    sem: 'Cuarto Semestre',
    color: 'neon-lime',
    subjects: [
      'Base de Datos I',
      'Métodos Numéricos',
      'Tecnologías Emergentes',
      'Estadística II',
      'Arquitectura de Computadoras I',
      'Sistemas Económicos'
    ]
  },

  3: {
    sem: 'Sexto Semestre',
    color: 'neon-magenta',
    subjects: [
      'Ingeniería de Software I',
      'Sistemas de Información II',
      'Sistemas de Información Geográfica I',
      'Investigación Operativa II',
      'Diseño Organizacional',
      'Sistemas Operativos'
    ]
  },

  4: {
    sem: 'Octavo Semestre',
    color: 'neon-violet',
    subjects: [
      'Ingeniería de Sistemas II',
      'Gerencia de Proyectos',
      'Dinámica de Sistemas',
      'Gestión de Calidad',
      'Sistemas CAD/CAE/CAM',
      'Automatización de Sistemas'
    ]
  },

  5: {
    sem: 'Décimo Semestre',
    color: 'neon-amber',
    subjects: [
      'Taller de Grado II'
    ]
  }
};

// Se expone globalmente para que main.js lo consuma
window.PLAN = PLAN;
