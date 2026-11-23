import type { Genero, Inscripcion, Persona, RangoEdad, Taller } from '@/types/models';
import { GENEROS, RANGOS_EDAD } from '@/types/models';
import { porcentaje } from '@/utils/formatters';

export interface FilaTaller {
  titulo: string;
  tipo: string;
  recinto: string;
  cupo: number;
  inscritos: number;
  asistentes: number;
  ocupacion: number;
  asistencia: number;
}

export interface DatosReporte {
  periodo: { desde: number | null; hasta: number | null };
  talleres: FilaTaller[];
  totales: { inscripciones: number; personas: number; asistentes: number; pasesUsados: number };
  /** demografia[rango][genero] = número de personas */
  demografia: Record<RangoEdad, Record<Genero, number>>;
  generadoEn: number;
}

export const personasDe = (i: Inscripcion): Persona[] => [i.titular, ...i.acompanantes];

/** Resume las inscripciones del periodo para el PDF y el Excel. Función pura (fácil de probar). */
export function construirDatosReporte(
  talleres: Taller[],
  inscripciones: Inscripcion[],
  periodo: { desde: number | null; hasta: number | null },
): DatosReporte {
  const porTaller = new Map<string, { personas: number; asistentes: number }>();
  const demografia = Object.fromEntries(
    RANGOS_EDAD.map((r) => [r, Object.fromEntries(Object.keys(GENEROS).map((g) => [g, 0]))]),
  ) as DatosReporte['demografia'];

  let personas = 0;
  let asistentes = 0;
  let pasesUsados = 0;
  for (const ins of inscripciones) {
    const acc = porTaller.get(ins.tallerId) ?? { personas: 0, asistentes: 0 };
    acc.personas += ins.personas;
    if (ins.usado) {
      acc.asistentes += ins.personas;
      asistentes += ins.personas;
      pasesUsados++;
    }
    porTaller.set(ins.tallerId, acc);
    personas += ins.personas;
    for (const p of personasDe(ins)) demografia[p.rangoEdad][p.genero]++;
  }

  // Con periodo: solo talleres con movimiento. Sin periodo: todos (con sus contadores).
  const conPeriodo = periodo.desde !== null || periodo.hasta !== null;
  const filas: FilaTaller[] = talleres
    .filter((t) => !conPeriodo || porTaller.has(t.id))
    .map((t) => {
      const d = porTaller.get(t.id);
      const inscritos = conPeriodo ? (d?.personas ?? 0) : t.inscritos;
      const asis = conPeriodo ? (d?.asistentes ?? 0) : t.asistentes;
      return {
        titulo: t.titulo,
        tipo: t.tipo === 'taller' ? 'Taller' : 'Evento',
        recinto: t.recintoNombre,
        cupo: t.cupoMaximo,
        inscritos,
        asistentes: asis,
        ocupacion: porcentaje(inscritos, t.cupoMaximo),
        asistencia: porcentaje(asis, inscritos),
      };
    })
    .sort((a, b) => b.inscritos - a.inscritos);

  return {
    periodo,
    talleres: filas,
    totales: { inscripciones: inscripciones.length, personas, asistentes, pasesUsados },
    demografia,
    generadoEn: Date.now(),
  };
}
