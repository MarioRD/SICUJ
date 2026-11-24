/**
 * Modelo de datos de SICUJ.
 * Las fechas son milisegundos (epoch), igual en la app y en Firestore: las reglas
 * de seguridad las comparan con request.time.toMillis().
 */

export type Categoria =
  | 'musica'
  | 'danza'
  | 'artes_plasticas'
  | 'teatro'
  | 'literatura'
  | 'idiomas'
  | 'cultura_pop'
  | 'autos'
  | 'juventud'
  | 'campanas'
  | 'otro';
export type TipoActividad = 'taller' | 'evento';
export type Genero = 'femenino' | 'masculino' | 'no_binario' | 'prefiero_no_decir';
export type RangoEdad = '0-11' | '12-17' | '18-29' | '30-59' | '60+';
export type Rol = 'admin' | 'staff' | 'ciudadano';

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface Recinto {
  id: string;
  nombre: string;
  direccion: string;
  ubicacion: Coordenadas;
  descripcion: string;
  imagenUrl: string | null;
  capacidad: number;
  accesible: boolean;
  activo: boolean;
  afluenciaTotal: number;
  creadoEn: number;
  actualizadoEn: number;
}

export interface Taller {
  id: string;
  tipo: TipoActividad;
  titulo: string;
  descripcion: string;
  categoria: Categoria;
  recintoId: string;
  recintoNombre: string;
  recintoUbicacion: Coordenadas;
  instructor: string | null;
  fechaInicio: number;
  fechaFin: number;
  horario: string;
  edadMin: number | null;
  edadMax: number | null;
  cupoMaximo: number;
  inscritos: number;
  asistentes: number;
  imagenUrl: string | null;
  costo: number;
  activo: boolean;
  creadoEn: number;
  actualizadoEn: number;
}

/** Una persona que asistirá. El nombre puede ser parcial (nombre de pila o iniciales). */
export interface Persona {
  nombre: string;
  edad: number;
  rangoEdad: RangoEdad;
  genero: Genero;
}

/** El ID de la inscripción ES el pase digital (va dentro del QR). */
export interface Inscripcion {
  id: string;
  /** Folio corto impreso bajo el QR (respaldo si no se puede escanear). */
  folio: string;
  tallerId: string;
  tallerTitulo: string;
  tallerFechaInicio: number;
  tallerHorario: string;
  recintoId: string;
  recintoNombre: string;
  /** null si se inscribió sin cuenta; se vincula al crear cuenta en el mismo dispositivo. */
  uidCiudadano: string | null;
  titular: Persona;
  acompanantes: Persona[];
  /** titular + acompañantes; cuenta contra el cupo. */
  personas: number;
  contacto: { email: string | null; telefono: string | null };
  aceptoAvisoPrivacidad: true;
  consentimientoTutor: boolean;
  usado: boolean;
  usadoEn: number | null;
  validadoPor: string | null;
  creadoEn: number;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  creadoEn: number;
}

/**
 * Datos que una persona con cuenta autoriza guardar para inscribirse con un toque.
 * Se guarda la fecha de nacimiento (no la edad) para calcular la edad al día de cada evento.
 * Solo la persona dueña de la cuenta puede leerlos (ni administración).
 */
export interface DatosInscripcion {
  nombre: string;
  /** AAAA-MM-DD */
  fechaNacimiento: string;
  genero: Genero;
  telefono: string | null;
  actualizadoEn: number;
}

export const CATEGORIAS: Record<Categoria, string> = {
  musica: 'Música',
  danza: 'Danza',
  artes_plasticas: 'Artes plásticas',
  teatro: 'Teatro',
  literatura: 'Literatura',
  idiomas: 'Idiomas',
  cultura_pop: 'Anime y cultura pop',
  autos: 'Autos y motor',
  juventud: 'Juventud',
  campanas: 'Campañas y jornadas',
  otro: 'Otro',
};

export const GENEROS: Record<Genero, string> = {
  femenino: 'Femenino',
  masculino: 'Masculino',
  no_binario: 'No binario',
  prefiero_no_decir: 'Prefiero no decir',
};

export const RANGOS_EDAD: RangoEdad[] = ['0-11', '12-17', '18-29', '30-59', '60+'];

export const MAX_ACOMPANANTES = 4;
