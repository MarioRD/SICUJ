/**
 * Entender respuestas habladas sin IA de pago: palabras clave sobre el texto que
 * entrega el reconocimiento de voz del navegador. Funciones puras (fáciles de probar).
 */
import { CATEGORIAS, type Categoria, type Taller } from '@/types/models';
import { cuposDisponibles, estaVigente } from '@/services/comun/talleres';

export const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Palabras que la gente usa al hablar de cada tipo de actividad. */
const PALABRAS: Record<Categoria, string[]> = {
  musica: ['musica', 'musical', 'guitarra', 'piano', 'canto', 'cantar', 'banda', 'orquesta', 'concierto', 'violin', 'bateria', 'rap', 'coro', 'rock'],
  danza: ['danza', 'baile', 'bailar', 'ballet', 'folklor', 'folclor', 'folklorico', 'zumba', 'hip hop', 'salsa', 'bachata'],
  artes_plasticas: ['arte', 'artes', 'pintura', 'pintar', 'dibujo', 'dibujar', 'acuarela', 'escultura', 'ceramica', 'grafiti', 'graffiti', 'manualidades', 'plasticas'],
  teatro: ['teatro', 'actuacion', 'actuar', 'obra', 'improvisacion', 'clown', 'titeres'],
  literatura: ['literatura', 'lectura', 'libro', 'libros', 'poesia', 'escritura', 'escribir', 'cuento', 'cuentos', 'biblioteca', 'letras'],
  idiomas: ['idioma', 'idiomas', 'ingles', 'frances', 'lengua', 'nahuatl', 'senas', 'aleman', 'japones'],
  cultura_pop: ['anime', 'manga', 'cosplay', 'videojuegos', 'videojuego', 'gamer', 'comic', 'comics', 'kpop', 'k pop', 'otaku', 'geek'],
  autos: ['auto', 'autos', 'coche', 'coches', 'carro', 'carros', 'motor', 'moto', 'motos', 'mecanica'],
  juventud: ['juventud', 'jovenes', 'joven', 'emprendimiento', 'emprender', 'empleo', 'liderazgo', 'consejo', 'voluntariado'],
  campanas: ['campana', 'campanas', 'jornada', 'jornadas', 'salud', 'vacunacion', 'donacion', 'limpieza'],
  otro: [],
};

const contiene = (texto: string, palabras: string[]) => palabras.some((p) => new RegExp(`(^| )${p}( |$)`).test(texto));

const SI = ['si', 'sip', 'claro', 'va', 'vale', 'dale', 'ok', 'okay', 'de acuerdo', 'por favor', 'me interesa', 'quiero', 'inscribeme', 'acepto', 'correcto', 'simon', 'sale', 'andale', 'adelante', 'esa', 'ese', 'eso'];
const NO = ['no', 'nel', 'otro', 'otra', 'siguiente', 'paso', 'despues', 'mejor no', 'tampoco', 'no gracias'];
const SALIR = ['salir', 'adios', 'terminar', 'termina', 'cancelar', 'cancela', 'ya no', 'olvidalo', 'basta', 'cerrar', 'gracias nada', 'eso es todo', 'nada mas'];
const REPETIR = ['repite', 'repetir', 'otra vez', 'no escuche', 'que dijiste', 'mande', 'perdon'];
const CUALQUIERA = ['lo que sea', 'cualquier', 'cualquiera', 'todo', 'todos', 'todas', 'sorprendeme', 'no se', 'que hay', 'lo que haya', 'recomiendame'];

export type Intencion = 'si' | 'no' | 'salir' | 'repetir' | 'cualquiera' | 'otra';

/** Qué quiso decir: sí, no, salir, repetir… El "no" pesa más que el "sí" ("no quiero"). */
export function intencion(dicho: string): Intencion {
  const t = normalizar(dicho);
  if (!t) return 'otra';
  if (contiene(t, SALIR)) return 'salir';
  if (t === 'como' || (contiene(t, REPETIR) && t.split(' ').length <= 4)) return 'repetir';
  if (contiene(t, NO)) return 'no';
  if (contiene(t, SI)) return 'si';
  if (contiene(t, CUALQUIERA)) return 'cualquiera';
  return 'otra';
}

const VACIAS = new Set('algo para unos unas como sobre quiero quisiera interesa interesan gustaria gusta talleres taller eventos evento clases clase curso cursos actividad actividades donde puedo hacer aprender tomar tienen tengan pues este esta bueno'.split(' '));

/** Categorías y palabras sueltas que se mencionan en la respuesta. */
export function interes(dicho: string) {
  const t = normalizar(dicho);
  const categorias = (Object.keys(PALABRAS) as Categoria[]).filter((c) => contiene(t, PALABRAS[c]));
  const palabras = t.split(' ').filter((p) => p.length >= 4 && !VACIAS.has(p));
  return { categorias, palabras, cualquiera: contiene(t, CUALQUIERA) };
}

/** Actividades vigentes, con lugar, que coinciden con lo que se pidió; las más próximas primero. */
export function buscarPorVoz(talleres: Taller[], dicho: string, ahora = Date.now()): Taller[] {
  const { categorias, palabras, cualquiera } = interes(dicho);
  const abiertas = talleres.filter((t) => estaVigente(t, ahora) && cuposDisponibles(t) > 0).sort((a, b) => a.fechaInicio - b.fechaInicio);
  if (cualquiera && !categorias.length) return abiertas;
  if (!categorias.length && !palabras.length) return [];
  return abiertas.filter((t) => {
    if (categorias.includes(t.categoria)) return true;
    const texto = normalizar(`${t.titulo} ${t.descripcion} ${t.instructor ?? ''}`);
    return palabras.some((p) => texto.includes(p));
  });
}

/** Cómo nombrar lo que se pidió en la respuesta hablada. */
export function nombrarInteres(dicho: string) {
  const { categorias, palabras } = interes(dicho);
  if (categorias.length) return categorias.map((c) => CATEGORIAS[c].toLowerCase()).join(' y ');
  return palabras.slice(0, 3).join(' ') || normalizar(dicho);
}

const fmtDia = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' });

/** Horario escrito ("Sábados · 10:00 – 13:00") en forma que suene natural al leerlo. */
export const horarioHablado = (h: string) =>
  h
    .replace(/\s*·\s*/g, ', ')
    .replace(/\s*[–-]\s*/g, ' a ')
    .trim();

/** "Guitarra para principiantes, en la Casa de Cultura, empieza el sábado 29 de noviembre; sábados, 10:00 a 13:00." */
export function describirActividad(t: Taller, ahora = Date.now()) {
  const tipo = t.tipo === 'evento' ? 'el evento' : 'el taller';
  const cuando =
    t.fechaInicio > ahora ? `${t.tipo === 'evento' ? 'es' : 'empieza'} el ${fmtDia.format(t.fechaInicio)}` : t.tipo === 'evento' ? 'es hoy' : 'ya está en curso';
  const h = horarioHablado(t.horario);
  const horario = h ? `; horario: ${h[0]!.toLowerCase()}${h.slice(1)}` : '';
  const costo = t.costo > 0 ? `, cuesta ${t.costo} pesos` : ', es gratis';
  return `${tipo} ${t.titulo}, en ${t.recintoNombre}. ${cuando[0]!.toUpperCase()}${cuando.slice(1)}${horario}${costo}.`;
}
