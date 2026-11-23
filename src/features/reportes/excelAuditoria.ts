import * as XLSX from 'xlsx';
import { CATEGORIAS, GENEROS, type Inscripcion, type Taller } from '@/types/models';
import { folioCorto } from '@/utils/id';
import { personasDe, type DatosReporte } from './datosReporte';

const fechaExcel = (ms: number | null) => (ms === null ? '' : new Date(ms));

/**
 * Libro de auditoría en .xlsx con tres hojas: Resumen, Asistencia (una fila
 * por persona) y Actividades. Por minimización de datos NO incluye correo ni
 * teléfono: para auditar asistencia no hacen falta.
 */
export function exportarExcelAuditoria(datos: DatosReporte, inscripciones: Inscripcion[], talleres: Taller[]) {
  const libro = XLSX.utils.book_new();

  const resumen = XLSX.utils.json_to_sheet(
    datos.talleres.map((f) => ({
      Actividad: f.titulo,
      Tipo: f.tipo,
      Recinto: f.recinto,
      Cupo: f.cupo,
      Inscritos: f.inscritos,
      Asistentes: f.asistentes,
      'Ocupación %': f.ocupacion,
      'Asistencia %': f.asistencia,
    })),
  );
  resumen['!cols'] = [{ wch: 36 }, { wch: 9 }, { wch: 36 }, { wch: 7 }, { wch: 10 }, { wch: 11 }, { wch: 12 }, { wch: 13 }];
  XLSX.utils.book_append_sheet(libro, resumen, 'Resumen');

  const filas = inscripciones.flatMap((ins) =>
    personasDe(ins).map((p, i) => ({
      Folio: folioCorto(ins.id),
      'ID de pase': ins.id,
      Actividad: ins.tallerTitulo,
      Recinto: ins.recintoNombre,
      'Fecha de registro': fechaExcel(ins.creadoEn),
      Tipo: i === 0 ? 'Titular' : 'Acompañante',
      Nombre: p.nombre,
      Edad: p.edad,
      'Rango de edad': p.rangoEdad,
      Género: GENEROS[p.genero],
      'Consentimiento tutor': ins.consentimientoTutor ? 'Sí' : 'No',
      Asistió: ins.usado ? 'Sí' : 'No',
      'Fecha de validación': fechaExcel(ins.usadoEn),
      'Validado por': ins.validadoPor ?? '',
    })),
  );
  const asistencia = XLSX.utils.json_to_sheet(filas, { cellDates: true, dateNF: 'dd/mm/yyyy hh:mm' });
  asistencia['!cols'] = [
    { wch: 11 }, { wch: 22 }, { wch: 32 }, { wch: 32 }, { wch: 18 }, { wch: 12 }, { wch: 20 },
    { wch: 6 }, { wch: 9 }, { wch: 17 }, { wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 16 },
  ];
  asistencia['!autofilter'] = { ref: asistencia['!ref'] ?? 'A1' };
  XLSX.utils.book_append_sheet(libro, asistencia, 'Asistencia');

  const actividades = XLSX.utils.json_to_sheet(
    talleres.map((t) => ({
      ID: t.id,
      Actividad: t.titulo,
      Tipo: t.tipo,
      Categoría: CATEGORIAS[t.categoria],
      Recinto: t.recintoNombre,
      Inicio: fechaExcel(t.fechaInicio),
      Fin: fechaExcel(t.fechaFin),
      Horario: t.horario,
      Cupo: t.cupoMaximo,
      Inscritos: t.inscritos,
      Asistentes: t.asistentes,
      Activo: t.activo ? 'Sí' : 'No',
    })),
    { cellDates: true, dateNF: 'dd/mm/yyyy' },
  );
  XLSX.utils.book_append_sheet(libro, actividades, 'Actividades');

  const fecha = new Date(datos.generadoEn).toISOString().slice(0, 10);
  XLSX.writeFile(libro, `SICUJ_auditoria_asistencia_${fecha}.xlsx`, { compression: true });
}
