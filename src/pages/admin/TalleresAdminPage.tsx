import { Archive, ArchiveRestore, Pencil, Plus, Search } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Alerta, Cargando, Insignia } from '@/components/ui/Basicos';
import { Boton } from '@/components/ui/Boton';
import { AreaTexto, Campo, Selector } from '@/components/ui/Campo';
import { Modal } from '@/components/ui/Basicos';
import { SubirImagen } from '@/components/admin/SubirImagen';
import { useAvisos } from '@/context/AvisosContext';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { EncabezadoPagina } from '@/layouts/AdminLayout';
import { suscribirRecintos } from '@/services/recintos.service';
import { cambiarEstadoTaller, guardarTaller, suscribirTalleres, type TallerEntrada } from '@/services/talleres.service';
import { CATEGORIAS, type Categoria, type Recinto, type Taller, type TipoActividad } from '@/types/models';
import { aFechaInput, deFechaInput, formatearRangoFechas } from '@/utils/formatters';

type Filtro = 'activos' | 'inactivos' | 'todos';

interface FormTaller {
  tipo: TipoActividad;
  titulo: string;
  descripcion: string;
  categoria: Categoria;
  recintoId: string;
  instructor: string;
  fechaInicio: string;
  fechaFin: string;
  horario: string;
  edadMin: string;
  edadMax: string;
  cupoMaximo: string;
  costo: string;
  imagenUrl: string | null;
}

function aFormulario(t?: Taller): FormTaller {
  const hoy = Date.now();
  return {
    tipo: t?.tipo ?? 'taller',
    titulo: t?.titulo ?? '',
    descripcion: t?.descripcion ?? '',
    categoria: t?.categoria ?? 'musica',
    recintoId: t?.recintoId ?? '',
    instructor: t?.instructor ?? '',
    fechaInicio: aFechaInput(t?.fechaInicio ?? hoy),
    fechaFin: aFechaInput(t?.fechaFin ?? hoy + 30 * 86400000),
    horario: t?.horario ?? '',
    edadMin: t?.edadMin?.toString() ?? '',
    edadMax: t?.edadMax?.toString() ?? '',
    cupoMaximo: t?.cupoMaximo.toString() ?? '20',
    costo: t?.costo.toString() ?? '0',
    imagenUrl: t?.imagenUrl ?? null,
  };
}

const numONulo = (s: string) => (s.trim() === '' ? null : Number(s));

function FormularioTaller({ taller, recintos, alTerminar }: { taller?: Taller; recintos: Recinto[]; alTerminar: () => void }) {
  const avisar = useAvisos();
  const [f, setF] = useState<FormTaller>(() => aFormulario(taller));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const set = <K extends keyof FormTaller>(k: K, v: FormTaller[K]) => setF((p) => ({ ...p, [k]: v }));

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const entrada: TallerEntrada = {
        tipo: f.tipo,
        titulo: f.titulo,
        descripcion: f.descripcion,
        categoria: f.categoria,
        recintoId: f.recintoId,
        instructor: f.instructor || null,
        fechaInicio: deFechaInput(f.fechaInicio),
        fechaFin: deFechaInput(f.fechaFin, true),
        horario: f.horario,
        edadMin: numONulo(f.edadMin),
        edadMax: numONulo(f.edadMax),
        cupoMaximo: Number(f.cupoMaximo),
        costo: Number(f.costo || 0),
        imagenUrl: f.imagenUrl,
      };
      await guardarTaller(entrada, taller?.id);
      avisar(taller ? 'Cambios guardados.' : 'Actividad creada y publicada en el catálogo.', 'exito');
      alTerminar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Selector etiqueta="Tipo" value={f.tipo} onChange={(e) => set('tipo', e.target.value as TipoActividad)}>
        <option value="taller">Taller (varias sesiones)</option>
        <option value="evento">Evento (fecha única)</option>
      </Selector>
      <Selector etiqueta="Categoría" value={f.categoria} onChange={(e) => set('categoria', e.target.value as Categoria)}>
        {Object.entries(CATEGORIAS).map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </Selector>
      <Campo className="md:col-span-2" etiqueta="Título" value={f.titulo} onChange={(e) => set('titulo', e.target.value)} required maxLength={90} />
      <AreaTexto className="md:col-span-2" etiqueta="Descripción" rows={3} value={f.descripcion} onChange={(e) => set('descripcion', e.target.value)} required maxLength={600} />
      <Selector etiqueta="Recinto" value={f.recintoId} onChange={(e) => set('recintoId', e.target.value)} required>
        <option value="" disabled>
          Selecciona…
        </option>
        {recintos.map((r) => (
          <option key={r.id} value={r.id}>
            {r.nombre}
          </option>
        ))}
      </Selector>
      <Campo etiqueta="Instructor / responsable" value={f.instructor} onChange={(e) => set('instructor', e.target.value)} opcional />
      <Campo etiqueta="Fecha de inicio" type="date" value={f.fechaInicio} onChange={(e) => set('fechaInicio', e.target.value)} required />
      <Campo etiqueta="Fecha de fin" type="date" value={f.fechaFin} min={f.fechaInicio} onChange={(e) => set('fechaFin', e.target.value)} required />
      <Campo className="md:col-span-2" etiqueta="Horario" placeholder="Lun y Mié · 16:00 – 18:00" value={f.horario} onChange={(e) => set('horario', e.target.value)} required />
      <div className="grid grid-cols-2 gap-4">
        <Campo etiqueta="Edad mínima" type="number" min={0} max={120} value={f.edadMin} onChange={(e) => set('edadMin', e.target.value)} opcional />
        <Campo etiqueta="Edad máxima" type="number" min={0} max={120} value={f.edadMax} onChange={(e) => set('edadMax', e.target.value)} opcional />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Campo
          etiqueta="Cupo máximo"
          type="number"
          min={Math.max(1, taller?.inscritos ?? 1)}
          value={f.cupoMaximo}
          onChange={(e) => set('cupoMaximo', e.target.value)}
          required
          ayuda={taller ? `${taller.inscritos} inscritos` : undefined}
        />
        <Campo etiqueta="Costo (MXN)" type="number" min={0} value={f.costo} onChange={(e) => set('costo', e.target.value)} ayuda="0 = gratuito" />
      </div>
      <div className="md:col-span-2">
        <SubirImagen valor={f.imagenUrl} alCambiar={(url) => set('imagenUrl', url)} />
      </div>
      {error && (
        <div className="md:col-span-2">
          <Alerta tono="error">{error}</Alerta>
        </div>
      )}
      <div className="flex justify-end gap-2 md:col-span-2">
        <Boton variante="fantasma" onClick={alTerminar}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={guardando}>
          {taller ? 'Guardar cambios' : 'Crear actividad'}
        </Boton>
      </div>
    </form>
  );
}

export default function TalleresAdminPage() {
  const talleres = useSuscripcion<Taller[]>((cb) => suscribirTalleres({ incluirInactivos: true }, cb), []);
  const recintos = useSuscripcion<Recinto[]>((cb) => suscribirRecintos({}, cb), []);
  const avisar = useAvisos();
  const [filtro, setFiltro] = useState<Filtro>('activos');
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState<Taller | 'nuevo' | null>(null);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (talleres ?? [])
      .filter((t) => filtro === 'todos' || (filtro === 'activos' ? t.activo : !t.activo))
      .filter((t) => !q || `${t.titulo} ${t.recintoNombre}`.toLowerCase().includes(q));
  }, [talleres, filtro, busqueda]);

  if (!talleres || !recintos) return <Cargando />;

  const alternar = async (t: Taller) => {
    if (t.activo && !window.confirm(`¿Dar de baja "${t.titulo}"? Dejará de aparecer en el catálogo. Las inscripciones se conservan.`)) return;
    await cambiarEstadoTaller(t.id, !t.activo);
    avisar(t.activo ? 'Actividad dada de baja.' : 'Actividad reactivada.', 'exito');
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Talleres y eventos"
        descripcion="Alta, edición y baja lógica. Los cambios se reflejan al instante en el catálogo ciudadano."
        acciones={
          <Boton icono={<Plus aria-hidden className="size-5" />} onClick={() => setEditando('nuevo')} disabled={!recintos.length}>
            Nueva actividad
          </Boton>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-[clamp(14rem,30vw,24rem)]">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tenue" />
          <label htmlFor="buscar-taller" className="sr-only">
            Buscar actividad
          </label>
          <input
            id="buscar-taller"
            type="search"
            placeholder="Buscar por título o recinto"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="min-h-(--toque-min) w-full rounded-md border-2 border-linea bg-superficie pr-3 pl-9 focus:border-marca focus:outline-none"
          />
        </div>
        <div className="flex rounded-md border-2 border-linea bg-superficie p-0.5" role="radiogroup" aria-label="Estado">
          {(['activos', 'inactivos', 'todos'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={filtro === v}
              onClick={() => setFiltro(v)}
              className={`rounded px-4 py-1.5 text-sm font-semibold capitalize ${filtro === v ? 'bg-marca text-marca-tinta' : ''}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="tarjeta overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-linea bg-hundido text-sm text-tenue">
            <tr>
              <th scope="col" className="px-4 py-3">Actividad</th>
              <th scope="col" className="px-3 py-3">Recinto</th>
              <th scope="col" className="px-3 py-3">Fechas</th>
              <th scope="col" className="px-3 py-3 text-right">Inscritos</th>
              <th scope="col" className="px-3 py-3">Estado</th>
              <th scope="col" className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((t) => (
              <tr key={t.id} className="border-b border-linea last:border-0 hover:bg-hundido/60">
                <th scope="row" className="px-4 py-3">
                  <span className="block font-semibold">{t.titulo}</span>
                  <span className="text-xs font-normal text-tenue">
                    {t.tipo === 'taller' ? 'Taller' : 'Evento'} · {CATEGORIAS[t.categoria]}
                  </span>
                </th>
                <td className="px-3 py-3">{t.recintoNombre}</td>
                <td className="px-3 py-3 whitespace-nowrap">{formatearRangoFechas(t.fechaInicio, t.fechaFin)}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {t.inscritos} / {t.cupoMaximo}
                </td>
                <td className="px-3 py-3">
                  {!t.activo ? (
                    <Insignia>Inactivo</Insignia>
                  ) : t.fechaFin < Date.now() ? (
                    <Insignia tono="aviso">Finalizado</Insignia>
                  ) : (
                    <Insignia tono="ok">Publicado</Insignia>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Boton variante="fantasma" tamano="sm" icono={<Pencil aria-hidden className="size-4" />} onClick={() => setEditando(t)}>
                      Editar<span className="sr-only"> {t.titulo}</span>
                    </Boton>
                    <Boton
                      variante="fantasma"
                      tamano="sm"
                      icono={t.activo ? <Archive aria-hidden className="size-4" /> : <ArchiveRestore aria-hidden className="size-4" />}
                      onClick={() => alternar(t)}
                    >
                      {t.activo ? 'Dar de baja' : 'Reactivar'}
                      <span className="sr-only"> {t.titulo}</span>
                    </Boton>
                  </div>
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-tenue">
                  No hay actividades con este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal abierto={editando !== null} alCerrar={() => setEditando(null)} titulo={editando === 'nuevo' ? 'Nueva actividad' : 'Editar actividad'}>
        {editando !== null && (
          <FormularioTaller
            key={editando === 'nuevo' ? 'nuevo' : editando.id}
            taller={editando === 'nuevo' ? undefined : editando}
            recintos={recintos}
            alTerminar={() => setEditando(null)}
          />
        )}
      </Modal>
    </>
  );
}
