import { FileDown, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Alerta, Cargando } from '@/components/ui/Basicos';
import { Boton } from '@/components/ui/Boton';
import { Selector } from '@/components/ui/Campo';
import { CampoFecha } from '@/components/ui/CampoFecha';
import { useAuth } from '@/context/AuthContext';
import { useAvisos } from '@/context/AvisosContext';
import { construirDatosReporte, type DatosReporte } from '@/features/reportes/datosReporte';
import { EncabezadoPagina } from '@/layouts/AdminLayout';
import { consultarInscripciones } from '@/services/inscripciones.service';
import { listarTalleres } from '@/services/talleres.service';
import { GENEROS, RANGOS_EDAD, type Genero, type Inscripcion, type Taller } from '@/types/models';
import { deFechaInput } from '@/utils/formatters';

export default function ReportesPage() {
  const { usuario } = useAuth();
  const avisar = useAvisos();
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [tallerId, setTallerId] = useState('');
  const [talleres, setTalleres] = useState<Taller[] | null>(null);
  const [datos, setDatos] = useState<{ reporte: DatosReporte; inscripciones: Inscripcion[] } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState<'pdf' | 'xlsx' | null>(null);

  useEffect(() => {
    void listarTalleres().then(setTalleres);
  }, []);

  /** Lectura bajo demanda (nunca en tiempo real): así se cuidan las lecturas de Firestore. */
  const consultar = useCallback(async () => {
    if (!talleres) return;
    setCargando(true);
    const periodo = { desde: desde ? deFechaInput(desde) : null, hasta: hasta ? deFechaInput(hasta, true) : null };
    const inscripciones = await consultarInscripciones({
      tallerId: tallerId || undefined,
      desde: periodo.desde ?? undefined,
      hasta: periodo.hasta ?? undefined,
    });
    const universo = tallerId ? talleres.filter((t) => t.id === tallerId) : talleres;
    setDatos({ reporte: construirDatosReporte(universo, inscripciones, periodo), inscripciones });
    setCargando(false);
  }, [talleres, desde, hasta, tallerId]);

  useEffect(() => {
    void consultar();
    // Solo la primera vez que llegan los talleres; luego el usuario pulsa "Actualizar".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talleres]);

  const exportarPdf = async () => {
    if (!datos) return;
    setExportando('pdf');
    try {
      const { generarPdfEjecutivo } = await import('@/features/reportes/pdfReporte');
      generarPdfEjecutivo({ ...datos.reporte, generadoEn: Date.now() }, { elaboro: usuario?.nombre ?? '' });
      avisar('PDF generado.', 'exito');
    } catch (e) {
      console.error(e);
      avisar('No se pudo generar el PDF.', 'error');
    } finally {
      setExportando(null);
    }
  };

  const exportarExcel = async () => {
    if (!datos || !talleres) return;
    setExportando('xlsx');
    try {
      const { exportarExcelAuditoria } = await import('@/features/reportes/excelAuditoria');
      exportarExcelAuditoria({ ...datos.reporte, generadoEn: Date.now() }, datos.inscripciones, talleres);
      avisar('Excel generado.', 'exito');
    } catch (e) {
      console.error(e);
      avisar('No se pudo generar el Excel.', 'error');
    } finally {
      setExportando(null);
    }
  };

  if (!talleres) return <Cargando />;
  const generos = Object.keys(GENEROS) as Genero[];

  return (
    <>
      <EncabezadoPagina
        titulo="Reportes institucionales"
        descripcion="Reporte ejecutivo en PDF y auditoría de asistencia en Excel."
        acciones={
          <>
            <Boton icono={<FileDown aria-hidden className="size-5" />} onClick={exportarPdf} cargando={exportando === 'pdf'} disabled={!datos || cargando}>
              PDF ejecutivo
            </Boton>
            <Boton
              variante="secundario"
              icono={<FileSpreadsheet aria-hidden className="size-5" />}
              onClick={exportarExcel}
              cargando={exportando === 'xlsx'}
              disabled={!datos || cargando}
            >
              Excel de auditoría
            </Boton>
          </>
        }
      />

      <form
        className="tarjeta mb-6 grid grid-cols-1 items-end gap-4 p-5 md:grid-cols-[1fr_1fr_2fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          void consultar();
        }}
      >
        <CampoFecha etiqueta="Registrados desde" value={desde} onChange={setDesde} />
        <CampoFecha etiqueta="Hasta" value={hasta} min={desde || undefined} onChange={setHasta} />
        <Selector etiqueta="Actividad" value={tallerId} onChange={(e) => setTallerId(e.target.value)}>
          <option value="">Todas las actividades</option>
          {talleres.map((t) => (
            <option key={t.id} value={t.id}>
              {t.titulo}
              {t.activo ? '' : ' (inactiva)'}
            </option>
          ))}
        </Selector>
        <Boton type="submit" cargando={cargando} icono={<RefreshCw aria-hidden className="size-4" />}>
          Actualizar
        </Boton>
      </form>

      {cargando || !datos ? (
        <Cargando texto="Consultando registros…" />
      ) : (
        <div className="flex flex-col gap-6">
          {datos.inscripciones.length === 0 && (
            <Alerta tono="info">
              No hay inscripciones registradas en este filtro. Los datos de demostración traen contadores precargados pero no
              inscripciones individuales: inscríbete desde el sitio ciudadano para verlas aquí.
            </Alerta>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ['Pases emitidos', datos.reporte.totales.inscripciones],
              ['Personas registradas', datos.reporte.totales.personas],
              ['Asistentes validados', datos.reporte.totales.asistentes],
              [
                'Tasa de asistencia',
                `${datos.reporte.totales.personas ? Math.round((datos.reporte.totales.asistentes / datos.reporte.totales.personas) * 100) : 0} %`,
              ],
            ].map(([e, v]) => (
              <div key={e} className="tarjeta p-4">
                <p className="text-sm text-tenue">{e}</p>
                <p className="text-2xl font-bold tabular-nums">{v}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
            <section className="tarjeta overflow-x-auto" aria-labelledby="t-afl">
              <h2 id="t-afl" className="p-5 pb-1 text-lg font-bold">
                Afluencia por actividad
              </h2>
              <p className="px-5 pb-3 text-xs text-tenue">
                {desde || hasta
                  ? 'Calculado con las inscripciones registradas en el periodo.'
                  : 'Sin periodo: contadores acumulados de cada actividad (incluye cifras precargadas de la demo).'}
              </p>
              <table className="w-full text-left text-sm">
                <thead className="border-y border-linea bg-hundido text-sm text-tenue">
                  <tr>
                    <th scope="col" className="px-5 py-2">Actividad</th>
                    <th scope="col" className="px-3 py-2 text-right">Cupo</th>
                    <th scope="col" className="px-3 py-2 text-right">Inscritos</th>
                    <th scope="col" className="px-3 py-2 text-right">Asistentes</th>
                    <th scope="col" className="px-5 py-2 text-right">Ocupación</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.reporte.talleres.map((f) => (
                    <tr key={f.titulo} className="border-b border-linea last:border-0">
                      <th scope="row" className="px-5 py-2 font-semibold">
                        {f.titulo}
                        <span className="block text-xs font-normal text-tenue">
                          {f.tipo} · {f.recinto}
                        </span>
                      </th>
                      <td className="px-3 py-2 text-right tabular-nums">{f.cupo}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{f.inscritos}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{f.asistentes}</td>
                      <td className="px-5 py-2 text-right tabular-nums">{f.ocupacion} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="tarjeta overflow-x-auto" aria-labelledby="t-demo">
              <h2 id="t-demo" className="p-5 pb-1 text-lg font-bold">
                Desglose demográfico
              </h2>
              <p className="px-5 pb-3 text-xs text-tenue">Personas registradas (titulares y acompañantes) en el periodo.</p>
              <table className="w-full text-center text-sm">
                <thead className="border-y border-linea bg-hundido text-sm text-tenue">
                  <tr>
                    <th scope="col" className="px-5 py-2 text-left">Edad</th>
                    {generos.map((g) => (
                      <th key={g} scope="col" className="px-2 py-2">
                        {GENEROS[g]}
                      </th>
                    ))}
                    <th scope="col" className="px-5 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {RANGOS_EDAD.map((r) => {
                    const fila = generos.map((g) => datos.reporte.demografia[r][g]);
                    return (
                      <tr key={r} className="border-b border-linea last:border-0">
                        <th scope="row" className="px-5 py-2 text-left font-semibold">
                          {r} años
                        </th>
                        {fila.map((v, i) => (
                          <td key={i} className="px-2 py-2 tabular-nums">
                            {v}
                          </td>
                        ))}
                        <td className="px-5 py-2 font-bold tabular-nums">{fila.reduce((a, b) => a + b, 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
