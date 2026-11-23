import type { Recinto, Taller } from '@/types/models';
import { almacen } from './local/store';
import { cuposDisponibles, estaVigente } from './talleres.service';

export interface Metricas {
  totalInscritos: number;
  totalAsistentes: number;
  cuposDisponibles: number;
  actividadesActivas: number;
  talleresActivos: number;
  eventosActivos: number;
  afluenciaPorRecinto: Array<{ id: string; nombre: string; afluencia: number; inscritos: number }>;
  talleres: Taller[];
  actualizadoEn: number;
}

/**
 * Indicadores en vivo. Se calculan con los CONTADORES de talleres y recintos
 * (decenas de documentos), nunca leyendo todas las inscripciones: en Firestore
 * esto mantiene el dashboard dentro de la cuota gratuita.
 */
export function suscribirMetricas(alCambiar: (m: Metricas) => void) {
  return almacen.suscribir(['talleres', 'recintos'], () => {
    const talleres = almacen.listar<Taller>('talleres');
    const recintos = almacen.listar<Recinto>('recintos').filter((r) => r.activo);
    const vigentes = talleres.filter((t) => estaVigente(t));

    const inscritosPorRecinto = new Map<string, number>();
    for (const t of vigentes) inscritosPorRecinto.set(t.recintoId, (inscritosPorRecinto.get(t.recintoId) ?? 0) + t.inscritos);

    alCambiar({
      totalInscritos: vigentes.reduce((s, t) => s + t.inscritos, 0),
      totalAsistentes: talleres.reduce((s, t) => s + t.asistentes, 0),
      cuposDisponibles: vigentes.reduce((s, t) => s + cuposDisponibles(t), 0),
      actividadesActivas: vigentes.length,
      talleresActivos: vigentes.filter((t) => t.tipo === 'taller').length,
      eventosActivos: vigentes.filter((t) => t.tipo === 'evento').length,
      afluenciaPorRecinto: recintos
        .map((r) => ({ id: r.id, nombre: r.nombre, afluencia: r.afluenciaTotal, inscritos: inscritosPorRecinto.get(r.id) ?? 0 }))
        .sort((a, b) => b.afluencia - a.afluencia || b.inscritos - a.inscritos),
      talleres: vigentes.sort((a, b) => a.fechaInicio - b.fechaInicio),
      actualizadoEn: Date.now(),
    });
  });
}
