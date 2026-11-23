import { Accessibility, Archive, ArchiveRestore, LocateFixed, MapPin, Pencil, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Alerta, Cargando, Insignia, Modal } from '@/components/ui/Basicos';
import { Boton } from '@/components/ui/Boton';
import { AreaTexto, Campo, Casilla } from '@/components/ui/Campo';
import { SubirImagen } from '@/components/admin/SubirImagen';
import { useAvisos } from '@/context/AvisosContext';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { EncabezadoPagina } from '@/layouts/AdminLayout';
import { cambiarEstadoRecinto, guardarRecinto, suscribirRecintos } from '@/services/recintos.service';
import type { Recinto } from '@/types/models';

function FormularioRecinto({ recinto, alTerminar }: { recinto?: Recinto; alTerminar: () => void }) {
  const avisar = useAvisos();
  const [f, setF] = useState({
    nombre: recinto?.nombre ?? '',
    direccion: recinto?.direccion ?? '',
    descripcion: recinto?.descripcion ?? '',
    lat: recinto?.ubicacion.lat.toString() ?? '',
    lng: recinto?.ubicacion.lng.toString() ?? '',
    capacidad: recinto?.capacidad.toString() ?? '100',
    accesible: recinto?.accesible ?? false,
    imagenUrl: recinto?.imagenUrl ?? null,
  });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [ubicando, setUbicando] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const usarMiUbicacion = () => {
    setUbicando(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setF((x) => ({ ...x, lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) }));
        setUbicando(false);
      },
      () => {
        setError('No se pudo obtener la ubicación. Captúrala manualmente.');
        setUbicando(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await guardarRecinto(
        {
          nombre: f.nombre,
          direccion: f.direccion,
          descripcion: f.descripcion,
          ubicacion: { lat: Number(f.lat), lng: Number(f.lng) },
          capacidad: Number(f.capacidad),
          accesible: f.accesible,
          imagenUrl: f.imagenUrl,
        },
        recinto?.id,
      );
      avisar(recinto ? 'Recinto actualizado (también en sus actividades).' : 'Recinto creado.', 'exito');
      alTerminar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
      setGuardando(false);
    }
  };

  const latN = Number(f.lat);
  const lngN = Number(f.lng);
  const coordsValidas = f.lat !== '' && f.lng !== '' && Number.isFinite(latN) && Number.isFinite(lngN);

  return (
    <form onSubmit={enviar} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Campo className="md:col-span-2" etiqueta="Nombre" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} required />
      <Campo className="md:col-span-2" etiqueta="Dirección" value={f.direccion} onChange={(e) => set('direccion', e.target.value)} required />
      <AreaTexto className="md:col-span-2" etiqueta="Descripción" rows={2} value={f.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
      <Campo etiqueta="Latitud" type="number" step="any" min={-90} max={90} value={f.lat} onChange={(e) => set('lat', e.target.value)} required ayuda="Ej. 19.627100" />
      <Campo etiqueta="Longitud" type="number" step="any" min={-180} max={180} value={f.lng} onChange={(e) => set('lng', e.target.value)} required ayuda="Ej. -99.109700" />
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <Boton variante="secundario" tamano="sm" cargando={ubicando} icono={<LocateFixed aria-hidden className="size-4" />} onClick={usarMiUbicacion}>
          Usar mi ubicación actual
        </Boton>
        {coordsValidas && (
          <a
            href={`https://www.openstreetmap.org/?mlat=${latN}&mlon=${lngN}#map=18/${latN}/${lngN}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-marca underline"
          >
            <MapPin aria-hidden className="size-4" /> Verificar en el mapa
          </a>
        )}
      </div>
      <Campo etiqueta="Capacidad (personas)" type="number" min={0} value={f.capacidad} onChange={(e) => set('capacidad', e.target.value)} required />
      <Casilla className="self-end pb-3" etiqueta="Accesible (rampas, elevador, sanitario adaptado)" checked={f.accesible} onChange={(e) => set('accesible', e.target.checked)} />
      <div className="md:col-span-2">
        <SubirImagen valor={f.imagenUrl} alCambiar={(u) => set('imagenUrl', u)} etiqueta="Fotografía del recinto" />
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
          {recinto ? 'Guardar cambios' : 'Crear recinto'}
        </Boton>
      </div>
    </form>
  );
}

export default function RecintosAdminPage() {
  const recintos = useSuscripcion<Recinto[]>((cb) => suscribirRecintos({ incluirInactivos: true }, cb), []);
  const avisar = useAvisos();
  const [editando, setEditando] = useState<Recinto | 'nuevo' | null>(null);

  if (!recintos) return <Cargando />;

  const alternar = async (r: Recinto) => {
    if (r.activo && !window.confirm(`¿Dar de baja "${r.nombre}"? Ya no aparecerá en el mapa de recintos.`)) return;
    await cambiarEstadoRecinto(r.id, !r.activo);
    avisar(r.activo ? 'Recinto dado de baja.' : 'Recinto reactivado.', 'exito');
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Recintos"
        descripcion="Sedes culturales con sus coordenadas (se usan para ordenar por cercanía con la fórmula de Haversine)."
        acciones={
          <Boton icono={<Plus aria-hidden className="size-5" />} onClick={() => setEditando('nuevo')}>
            Nuevo recinto
          </Boton>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {recintos.map((r) => (
          <article key={r.id} className={`tarjeta flex flex-col overflow-hidden ${r.activo ? '' : 'opacity-60'}`}>
            {r.imagenUrl && <img src={r.imagenUrl} alt="" className="aspect-[16/6] w-full object-cover" />}
            <div className="flex flex-1 flex-col gap-2 p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg leading-tight font-bold">{r.nombre}</h2>
                {r.activo ? <Insignia tono="ok">Activo</Insignia> : <Insignia>Inactivo</Insignia>}
              </div>
              <p className="text-sm text-tenue">{r.direccion}</p>
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-tenue">Capacidad</dt>
                  <dd className="font-semibold tabular-nums">{r.capacidad}</dd>
                </div>
                <div>
                  <dt className="text-xs text-tenue">Afluencia total</dt>
                  <dd className="font-semibold tabular-nums">{r.afluenciaTotal}</dd>
                </div>
                <div>
                  <dt className="text-xs text-tenue">Coordenadas</dt>
                  <dd className="font-mono text-xs">
                    {r.ubicacion.lat.toFixed(4)}, {r.ubicacion.lng.toFixed(4)}
                  </dd>
                </div>
              </dl>
              {r.accesible && (
                <Insignia tono="ok">
                  <Accessibility aria-hidden className="size-3.5" /> Accesible
                </Insignia>
              )}
              <div className="mt-auto flex justify-end gap-1 pt-2">
                <Boton variante="fantasma" tamano="sm" icono={<Pencil aria-hidden className="size-4" />} onClick={() => setEditando(r)}>
                  Editar<span className="sr-only"> {r.nombre}</span>
                </Boton>
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  icono={r.activo ? <Archive aria-hidden className="size-4" /> : <ArchiveRestore aria-hidden className="size-4" />}
                  onClick={() => alternar(r)}
                >
                  {r.activo ? 'Dar de baja' : 'Reactivar'}
                </Boton>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Modal abierto={editando !== null} alCerrar={() => setEditando(null)} titulo={editando === 'nuevo' ? 'Nuevo recinto' : 'Editar recinto'}>
        {editando !== null && (
          <FormularioRecinto key={editando === 'nuevo' ? 'nuevo' : editando.id} recinto={editando === 'nuevo' ? undefined : editando} alTerminar={() => setEditando(null)} />
        )}
      </Modal>
    </>
  );
}
