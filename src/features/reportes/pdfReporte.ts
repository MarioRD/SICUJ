import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { GENEROS, RANGOS_EDAD, type Genero } from '@/types/models';
import { formatearFecha, formatearFechaHora } from '@/utils/formatters';
import type { DatosReporte } from './datosReporte';

const MARCA: [number, number, number] = [15, 76, 92];
const GRIS: [number, number, number] = [75, 90, 102];

/** Las fuentes estándar de jsPDF no tienen los espacios especiales que usa Intl (p. ej. "6:00 p.m."). */
const limpiar = (s: string) => s.replace(/[   ]/g, ' ');

function describirPeriodo({ desde, hasta }: DatosReporte['periodo']) {
  if (desde === null && hasta === null) return 'Histórico completo';
  if (desde !== null && hasta !== null) return limpiar(`${formatearFecha(desde)} al ${formatearFecha(hasta)}`);
  return limpiar(desde !== null ? `Desde ${formatearFecha(desde)}` : `Hasta ${formatearFecha(hasta!)}`);
}

/** Último Y ocupado por AutoTable (la librería lo agrega al documento en tiempo de ejecución). */
const finTabla = (doc: jsPDF) => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

/** Reporte ejecutivo institucional en PDF (tamaño carta). */
export function generarPdfEjecutivo(datos: DatosReporte, opciones: { elaboro: string }) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const margen = 16;

  const encabezado = () => {
    doc.setFillColor(...MARCA);
    doc.rect(0, 0, ancho, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('H. Ayuntamiento de Coacalco de Berriozábal', margen, 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.text('Dirección de Cultura y Juventud · SICUJ', margen, 18);
    doc.setFontSize(8.5);
    doc.text('Documento generado por sistema · versión de prueba', ancho - margen, 18, { align: 'right' });
  };

  encabezado();
  doc.setTextColor(20, 33, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Reporte ejecutivo de afluencia', margen, 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRIS);
  doc.text(`Periodo: ${describirPeriodo(datos.periodo)}`, margen, 45);
  doc.text(limpiar(`Fecha de emisión: ${formatearFechaHora(datos.generadoEn)}`), margen, 50);

  // Resumen
  const { totales } = datos;
  autoTable(doc, {
    startY: 56,
    theme: 'grid',
    head: [['Inscripciones (pases)', 'Personas registradas', 'Asistentes validados', 'Tasa de asistencia']],
    body: [
      [
        String(totales.inscripciones),
        String(totales.personas),
        String(totales.asistentes),
        `${totales.personas ? Math.round((totales.asistentes / totales.personas) * 100) : 0} %`,
      ],
    ],
    headStyles: { fillColor: MARCA, halign: 'center' },
    bodyStyles: { halign: 'center', fontSize: 13, fontStyle: 'bold' },
    margin: { left: margen, right: margen },
  });

  // Afluencia por taller
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 33, 43);
  doc.text('Métricas de afluencia por actividad', margen, finTabla(doc) + 10);
  autoTable(doc, {
    startY: finTabla(doc) + 13,
    theme: 'striped',
    head: [['Actividad', 'Tipo', 'Recinto', 'Cupo', 'Inscritos', 'Asistentes', 'Ocupación', 'Asistencia']],
    body: datos.talleres.map((f) => [
      f.titulo,
      f.tipo,
      f.recinto,
      f.cupo,
      f.inscritos,
      f.asistentes,
      `${f.ocupacion} %`,
      `${f.asistencia} %`,
    ]),
    headStyles: { fillColor: MARCA },
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } },
    margin: { left: margen, right: margen, top: 32 },
    didDrawPage: (d) => {
      if (d.pageNumber > 1) encabezado();
    },
  });

  // Demografía
  const generos = Object.keys(GENEROS) as Genero[];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 33, 43);
  let y = finTabla(doc) + 10;
  if (y > alto - 80) {
    doc.addPage();
    encabezado();
    y = 38;
  }
  doc.text('Desglose demográfico (personas registradas)', margen, y);
  autoTable(doc, {
    startY: y + 3,
    theme: 'grid',
    head: [['Rango de edad', ...generos.map((g) => GENEROS[g]), 'Total']],
    body: [
      ...RANGOS_EDAD.map((r) => {
        const fila = generos.map((g) => datos.demografia[r][g]);
        return [`${r} años`, ...fila, fila.reduce((a, b) => a + b, 0)];
      }),
      [
        'Total',
        ...generos.map((g) => RANGOS_EDAD.reduce((s, r) => s + datos.demografia[r][g], 0)),
        totales.personas,
      ],
    ],
    headStyles: { fillColor: MARCA, halign: 'center' },
    styles: { fontSize: 9, halign: 'center' },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    margin: { left: margen, right: margen, top: 32 },
    didParseCell: (c) => {
      if (c.section === 'body' && c.row.index === RANGOS_EDAD.length) c.cell.styles.fontStyle = 'bold';
    },
  });

  // Firmas
  // Espacio para firmar (≈2 cm) + nombre debajo; solo pasa a otra hoja si no cabe sobre el pie de página.
  y = finTabla(doc) + 20;
  if (y > alto - 22) {
    doc.addPage();
    encabezado();
    y = 70;
  }
  const anchoFirma = (ancho - margen * 2 - 20) / 2;
  const firmas: Array<[string, string]> = [
    ['Elaboró', opciones.elaboro],
    ['Validó', 'Titular de la Dirección de Cultura y Juventud'],
  ];
  firmas.forEach(([rol, nombre], i) => {
    const x = margen + i * (anchoFirma + 20);
    doc.setDrawColor(...GRIS);
    doc.line(x, y, x + anchoFirma, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(20, 33, 43);
    doc.text(rol, x + anchoFirma / 2, y + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRIS);
    doc.text(nombre, x + anchoFirma / 2, y + 10, { align: 'center', maxWidth: anchoFirma });
  });

  // Pie de página con numeración
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text(
      'Datos personales tratados conforme al aviso de privacidad del SICUJ. Uso exclusivamente estadístico.',
      margen,
      alto - 8,
    );
    doc.text(`Página ${p} de ${paginas}`, ancho - margen, alto - 8, { align: 'right' });
  }

  const fecha = new Date(datos.generadoEn).toISOString().slice(0, 10);
  doc.save(`SICUJ_reporte_ejecutivo_${fecha}.pdf`);
}
