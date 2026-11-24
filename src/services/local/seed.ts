/**
 * Datos de DEMOSTRACIÓN. Los recintos son lugares reales de Coacalco (coordenadas de
 * OpenStreetMap, aproximadas); las actividades, horarios e instructores son ficticios.
 */
import type { Categoria, Recinto, Taller, TipoActividad, Usuario } from '@/types/models';
import type { AlmacenLocal } from './store';

const DIA = 24 * 60 * 60 * 1000;

/** Cuentas de prueba del panel. Se reemplazan por Firebase Authentication. */
export const CUENTAS_DEMO = [
  {
    id: 'admin-demo',
    nombre: 'Administración (demo)',
    email: 'admin@sicuj.demo',
    password: 'admin123',
    rol: 'admin' as const,
    hash: '52c48d7de62cc7e1152ad4387cde634932d0b0b239ef7d9a2ee4377bea8ee34f',
  },
  {
    id: 'staff-demo',
    nombre: 'Personal de acceso (demo)',
    email: 'staff@sicuj.demo',
    password: 'staff123',
    rol: 'staff' as const,
    hash: 'd5ed24cef20dc4b932d5bec7b40455f3774975bafe67320ef4a1ba4b4c35d67e',
  },
];

const RECINTOS: Array<Omit<Recinto, 'creadoEn' | 'actualizadoEn' | 'afluenciaTotal' | 'imagenUrl' | 'activo'>> = [
  {
    id: 'rec-casa-cultura',
    nombre: 'Casa de Cultura Calmécac',
    direccion: 'Calle Miguel Hidalgo, San Francisco Coacalco',
    ubicacion: { lat: 19.63054, lng: -99.10454 },
    descripcion: 'Sede de la Dirección de Cultura: salones de música, danza, artes plásticas y teatro.',
    capacidad: 250,
    accesible: true,
  },
  {
    id: 'rec-palacio',
    nombre: 'Explanada del Palacio Municipal',
    direccion: 'Calle Severiano Reyes, San Francisco Coacalco',
    ubicacion: { lat: 19.62909, lng: -99.10413 },
    descripcion: 'Explanada frente al Palacio Municipal para festivales, conciertos y convenciones.',
    capacidad: 800,
    accesible: true,
  },
  {
    id: 'rec-villa-flores',
    nombre: 'Parque Villa de las Flores',
    direccion: 'Deportivo Villa de las Flores, Coacalco',
    ubicacion: { lat: 19.64379, lng: -99.09501 },
    descripcion: 'Parque y deportivo con áreas abiertas para talleres al aire libre y jornadas.',
    capacidad: 500,
    accesible: true,
  },
  {
    id: 'rec-biblioteca',
    nombre: 'Biblioteca de Villa de las Flores',
    direccion: 'Boulevard Coacalco, Villa de las Flores',
    ubicacion: { lat: 19.65252, lng: -99.09554 },
    descripcion: 'Sala de lectura, clases de idiomas y círculo de escritura.',
    capacidad: 80,
    accesible: true,
  },
  {
    id: 'rec-san-rafael',
    nombre: 'Parque San Rafael',
    direccion: 'Avenida Juárez, Col. San Rafael',
    ubicacion: { lat: 19.63874, lng: -99.0854 },
    descripcion: 'Parque de la colonia San Rafael con espacio para exhibiciones y eventos masivos.',
    capacidad: 900,
    accesible: false,
  },
  {
    id: 'rec-miguel-flores',
    nombre: 'Parque Miguel Flores',
    direccion: 'Calle Miguel Flores, Col. San Rafael',
    ubicacion: { lat: 19.64752, lng: -99.08253 },
    descripcion: 'Foro abierto para música en vivo, poesía y actividades de juventud.',
    capacidad: 300,
    accesible: true,
  },
];

interface SemillaTaller {
  tipo: TipoActividad;
  titulo: string;
  descripcion: string;
  categoria: Categoria;
  recintoId: string;
  instructor: string | null;
  inicioEnDias: number;
  duracionDias: number;
  horario: string;
  edadMin: number | null;
  edadMax: number | null;
  cupoMaximo: number;
  inscritos: number;
  costo: number;
}

const TALLERES: SemillaTaller[] = [
  {
    tipo: 'taller',
    titulo: 'Guitarra para principiantes',
    descripcion:
      'Aprende acordes básicos, rasgueos y tus primeras canciones. Trae tu guitarra; contamos con algunas en préstamo.',
    categoria: 'musica',
    recintoId: 'rec-casa-cultura',
    instructor: 'Prof. R. Méndez',
    inicioEnDias: 3,
    duracionDias: 60,
    horario: 'Lunes y miércoles · 16:00 – 18:00',
    edadMin: 10,
    edadMax: null,
    cupoMaximo: 20,
    inscritos: 14,
    costo: 0,
  },
  {
    tipo: 'taller',
    titulo: 'Danza folklórica mexicana',
    descripcion: 'Bailes tradicionales de distintas regiones del país. Al final del ciclo hay presentación pública.',
    categoria: 'danza',
    recintoId: 'rec-casa-cultura',
    instructor: 'Mtra. L. Hernández',
    inicioEnDias: 5,
    duracionDias: 90,
    horario: 'Martes y jueves · 17:00 – 19:00',
    edadMin: 6,
    edadMax: 17,
    cupoMaximo: 25,
    inscritos: 25,
    costo: 0,
  },
  {
    tipo: 'taller',
    titulo: 'Pintura y acuarela',
    descripcion: 'Técnicas de acuarela, mezcla de color y composición. Materiales incluidos para las primeras sesiones.',
    categoria: 'artes_plasticas',
    recintoId: 'rec-villa-flores',
    instructor: 'Mtro. J. Ortega',
    inicioEnDias: 1,
    duracionDias: 45,
    horario: 'Sábados · 10:00 – 13:00',
    edadMin: 15,
    edadMax: null,
    cupoMaximo: 15,
    inscritos: 6,
    costo: 0,
  },
  {
    tipo: 'taller',
    titulo: 'Inglés conversacional',
    descripcion: 'Practica inglés hablando: situaciones del día a día, música y juegos. Sin examen de entrada.',
    categoria: 'idiomas',
    recintoId: 'rec-biblioteca',
    instructor: 'Lic. M. Ramírez',
    inicioEnDias: 4,
    duracionDias: 90,
    horario: 'Martes y jueves · 17:00 – 19:00',
    edadMin: 12,
    edadMax: null,
    cupoMaximo: 25,
    inscritos: 18,
    costo: 0,
  },
  {
    tipo: 'taller',
    titulo: 'Japonés básico',
    descripcion: 'Hiragana, saludos y frases básicas, con ejemplos de anime y cultura japonesa.',
    categoria: 'idiomas',
    recintoId: 'rec-biblioteca',
    instructor: 'Mtra. K. Sato',
    inicioEnDias: 6,
    duracionDias: 90,
    horario: 'Sábados · 11:00 – 13:00',
    edadMin: 12,
    edadMax: null,
    cupoMaximo: 20,
    inscritos: 11,
    costo: 0,
  },
  {
    tipo: 'evento',
    titulo: 'Convención de anime y cosplay',
    descripcion: 'Pasarela de cosplay, karaoke, venta de arte local y torneo de videojuegos.',
    categoria: 'cultura_pop',
    recintoId: 'rec-palacio',
    instructor: null,
    inicioEnDias: 9,
    duracionDias: 0,
    horario: '11:00 – 19:00',
    edadMin: null,
    edadMax: null,
    cupoMaximo: 600,
    inscritos: 264,
    costo: 0,
  },
  {
    tipo: 'evento',
    titulo: 'Exhibición de autos clásicos',
    descripcion: 'Autos clásicos, modificados y motos de clubes de la zona. Trae a tu familia.',
    categoria: 'autos',
    recintoId: 'rec-san-rafael',
    instructor: null,
    inicioEnDias: 11,
    duracionDias: 0,
    horario: 'Domingo · 10:00 – 17:00',
    edadMin: null,
    edadMax: null,
    cupoMaximo: 800,
    inscritos: 312,
    costo: 0,
  },
  {
    tipo: 'taller',
    titulo: 'Teatro e improvisación',
    descripcion: 'Expresión corporal, voz y juego escénico para perder el miedo a hablar en público.',
    categoria: 'teatro',
    recintoId: 'rec-casa-cultura',
    instructor: 'Cía. Escena Abierta',
    inicioEnDias: 8,
    duracionDias: 60,
    horario: 'Viernes · 16:00 – 18:30',
    edadMin: 12,
    edadMax: 29,
    cupoMaximo: 18,
    inscritos: 9,
    costo: 0,
  },
  {
    tipo: 'taller',
    titulo: 'Dibujo de manga',
    descripcion: 'Proporciones, expresiones y viñetas. Al final armas tu propia página de manga.',
    categoria: 'cultura_pop',
    recintoId: 'rec-casa-cultura',
    instructor: 'Mtro. D. Aguilar',
    inicioEnDias: 3,
    duracionDias: 60,
    horario: 'Viernes · 17:00 – 19:00',
    edadMin: 10,
    edadMax: null,
    cupoMaximo: 20,
    inscritos: 15,
    costo: 0,
  },
  {
    tipo: 'evento',
    titulo: 'Noche de poesía y slam',
    descripcion: 'Micrófono abierto: inscríbete para leer o solo ven a escuchar.',
    categoria: 'literatura',
    recintoId: 'rec-miguel-flores',
    instructor: null,
    inicioEnDias: 6,
    duracionDias: 0,
    horario: '19:00 – 22:00',
    edadMin: 15,
    edadMax: null,
    cupoMaximo: 120,
    inscritos: 37,
    costo: 0,
  },
  {
    tipo: 'evento',
    titulo: 'Festival Juvenil de Bandas',
    descripcion: 'Bandas locales de rock, ska y hip hop. Entrada libre con pase digital.',
    categoria: 'juventud',
    recintoId: 'rec-palacio',
    instructor: null,
    inicioEnDias: 12,
    duracionDias: 0,
    horario: '15:00 – 21:00',
    edadMin: null,
    edadMax: null,
    cupoMaximo: 700,
    inscritos: 412,
    costo: 0,
  },
  {
    tipo: 'evento',
    titulo: 'Jornada de salud joven',
    descripcion: 'Orientación en salud mental y sexual, pruebas rápidas y vacunación. Gratuito y confidencial.',
    categoria: 'campanas',
    recintoId: 'rec-villa-flores',
    instructor: null,
    inicioEnDias: 2,
    duracionDias: 0,
    horario: '9:00 – 15:00',
    edadMin: 12,
    edadMax: 29,
    cupoMaximo: 300,
    inscritos: 96,
    costo: 0,
  },
  {
    tipo: 'taller',
    titulo: 'Círculo de escritura creativa',
    descripcion: 'Cuento, poesía y crónica. Lectura en voz alta y retroalimentación entre participantes.',
    categoria: 'literatura',
    recintoId: 'rec-biblioteca',
    instructor: 'Lic. A. Salinas',
    inicioEnDias: 2,
    duracionDias: 75,
    horario: 'Miércoles · 18:00 – 20:00',
    edadMin: 15,
    edadMax: null,
    cupoMaximo: 12,
    inscritos: 4,
    costo: 0,
  },
  {
    tipo: 'evento',
    titulo: 'Concierto de la Orquesta Infantil',
    descripcion: 'Presentación de fin de ciclo de la orquesta infantil y juvenil municipal.',
    categoria: 'musica',
    recintoId: 'rec-palacio',
    instructor: null,
    inicioEnDias: 0,
    duracionDias: 0,
    horario: '18:00 – 20:00',
    edadMin: null,
    edadMax: null,
    cupoMaximo: 400,
    inscritos: 143,
    costo: 0,
  },
];

export function sembrarDatosDemo(almacen: AlmacenLocal, ahora = Date.now()) {
  const hoy = new Date(ahora);
  hoy.setHours(0, 0, 0, 0);
  const base = hoy.getTime();

  almacen.transaccion((tx) => {
    const recintos = new Map<string, Recinto>();
    for (const r of RECINTOS) {
      const recinto: Recinto = {
        ...r,
        imagenUrl: null,
        activo: true,
        afluenciaTotal: 0,
        creadoEn: ahora,
        actualizadoEn: ahora,
      };
      recintos.set(r.id, recinto);
      tx.crear('recintos', recinto);
    }

    TALLERES.forEach((s, i) => {
      const recinto = recintos.get(s.recintoId)!;
      const taller: Taller = {
        id: `taller-demo-${i + 1}`,
        tipo: s.tipo,
        titulo: s.titulo,
        descripcion: s.descripcion,
        categoria: s.categoria,
        recintoId: recinto.id,
        recintoNombre: recinto.nombre,
        recintoUbicacion: recinto.ubicacion,
        instructor: s.instructor,
        fechaInicio: base + s.inicioEnDias * DIA,
        fechaFin: base + (s.inicioEnDias + s.duracionDias) * DIA + DIA - 1,
        horario: s.horario,
        edadMin: s.edadMin,
        edadMax: s.edadMax,
        cupoMaximo: s.cupoMaximo,
        inscritos: s.inscritos,
        asistentes: 0,
        imagenUrl: null,
        costo: s.costo,
        activo: true,
        creadoEn: ahora,
        actualizadoEn: ahora,
      };
      tx.crear('talleres', taller);
    });

    for (const c of CUENTAS_DEMO) {
      const usuario: Usuario = { id: c.id, nombre: c.nombre, email: c.email, rol: c.rol, activo: true, creadoEn: ahora };
      tx.crear('usuarios', usuario);
      tx.crear('credenciales', { id: c.id, email: c.email, hash: c.hash });
    }
  });
}

/** Sube este número cuando cambien los datos de demostración: los navegadores con datos viejos se reinician. */
const VERSION_DEMO = '2';
const CLAVE_VERSION = 'sicuj:demo-version';

export function asegurarDatosDemo(almacen: AlmacenLocal) {
  let version: string | null = null;
  try {
    version = localStorage.getItem(CLAVE_VERSION);
  } catch {
    /* sin almacenamiento */
  }
  if (!almacen.existe('recintos')) sembrarDatosDemo(almacen);
  else if (version !== VERSION_DEMO) restablecerDatosDemo(almacen);
  try {
    localStorage.setItem(CLAVE_VERSION, VERSION_DEMO);
  } catch {
    /* sin almacenamiento */
  }
}

export function restablecerDatosDemo(almacen: AlmacenLocal) {
  almacen.borrarTodo();
  sembrarDatosDemo(almacen);
}
