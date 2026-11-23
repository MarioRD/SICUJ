/**
 * Datos de DEMOSTRACIÓN. Nombres, ubicaciones y horarios son ficticios y
 * aproximados (alrededor de Coacalco de Berriozábal); sirven solo para probar.
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
    nombre: 'Casa de Cultura Municipal (demo)',
    direccion: 'Cabecera municipal, Coacalco de Berriozábal, Edo. Méx.',
    ubicacion: { lat: 19.6271, lng: -99.1097 },
    descripcion: 'Sede principal de talleres artísticos: salones de música, danza y artes plásticas.',
    capacidad: 250,
    accesible: true,
  },
  {
    id: 'rec-villa-flores',
    nombre: 'Centro Cultural Villa de las Flores (demo)',
    direccion: 'Fracc. Villa de las Flores, Coacalco, Edo. Méx.',
    ubicacion: { lat: 19.6155, lng: -99.0918 },
    descripcion: 'Espacio comunitario con foro al aire libre y biblioteca.',
    capacidad: 180,
    accesible: true,
  },
  {
    id: 'rec-foro-juvenil',
    nombre: 'Foro Juvenil Parque Central (demo)',
    direccion: 'Parque Central, Coacalco, Edo. Méx.',
    ubicacion: { lat: 19.6342, lng: -99.0995 },
    descripcion: 'Foro abierto para conciertos, slam de poesía y actividades de juventud.',
    capacidad: 400,
    accesible: false,
  },
  {
    id: 'rec-biblioteca',
    nombre: 'Biblioteca Pública San Lorenzo (demo)',
    direccion: 'Col. San Lorenzo Tetlixtac, Coacalco, Edo. Méx.',
    ubicacion: { lat: 19.6408, lng: -99.1155 },
    descripcion: 'Sala de lectura, círculo de escritura y préstamo de libros.',
    capacidad: 80,
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
    titulo: 'Teatro e improvisación',
    descripcion: 'Expresión corporal, voz y juego escénico para perder el miedo a hablar en público.',
    categoria: 'teatro',
    recintoId: 'rec-villa-flores',
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
    titulo: 'Festival Juvenil de Bandas',
    descripcion: 'Bandas locales de rock, ska y hip hop en el foro del parque. Entrada libre con pase digital.',
    categoria: 'juventud',
    recintoId: 'rec-foro-juvenil',
    instructor: null,
    inicioEnDias: 12,
    duracionDias: 0,
    horario: '15:00 – 21:00',
    edadMin: null,
    edadMax: null,
    cupoMaximo: 350,
    inscritos: 212,
    costo: 0,
  },
  {
    tipo: 'evento',
    titulo: 'Noche de poesía y slam',
    descripcion: 'Micrófono abierto: inscríbete para leer o solo ven a escuchar.',
    categoria: 'literatura',
    recintoId: 'rec-foro-juvenil',
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
    titulo: 'Concierto de la Orquesta Infantil',
    descripcion: 'Presentación de fin de ciclo de la orquesta infantil y juvenil municipal.',
    categoria: 'musica',
    recintoId: 'rec-casa-cultura',
    instructor: null,
    inicioEnDias: 0,
    duracionDias: 0,
    horario: '18:00 – 20:00',
    edadMin: null,
    edadMax: null,
    cupoMaximo: 200,
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

export function asegurarDatosDemo(almacen: AlmacenLocal) {
  if (!almacen.existe('recintos')) sembrarDatosDemo(almacen);
}

export function restablecerDatosDemo(almacen: AlmacenLocal) {
  almacen.borrarTodo();
  sembrarDatosDemo(almacen);
}
