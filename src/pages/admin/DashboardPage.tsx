import { CalendarCheck, DoorOpen, Radio, RotateCcw, Ticket, UsersRound } from 'lucide-react';
import { Barra, Cargando, Insignia } from '@/components/ui/Basicos';
import { Boton } from '@/components/ui/Boton';
import { TarjetaMetrica } from '@/components/admin/TarjetaMetrica';
import { useAvisos } from '@/context/AvisosContext';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { EncabezadoPagina } from '@/layouts/AdminLayout';
import { restablecerDatosDemo } from '@/services/local/seed';
import { almacen } from '@/services/local/store';
import { suscribirMetricas } from '@/services/metricas.service';
import { cuposDisponibles } from '@/services/talleres.service';
import { formatearFecha, porcentaje } from '@/utils/formatters';

export default function DashboardPage() {
  const m = useSuscripcion(suscribirMetricas, []);
  const avisar = useAvisos();

  if (!m) return <Cargando />;
  const maxAfluencia = Math.max(1, ...m.afluenciaPorRecinto.map((r) => Math.max(r.afluencia, r.inscritos)));

  const restablecer = () => {
    if (!window.confirm('¿Restablecer los datos de demostración? Se borrarán inscripciones, cambios y cuentas ciudadanas de prueba.')) return;
    restablecerDatosDemo(almacen);
    avisar('Datos de demostración restablecidos.', 'exito');
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Indicadores en tiempo real"
        descripcion="Se actualizan solos cuando alguien se inscribe o se valida un pase (prueba con otra pestaña abierta)."
        acciones={
          <>
            <Insignia tono="ok">
              <Radio aria-hidden className="size-3.5 animate-pulse" /> En vivo
            </Insignia>
            <Boton variante="fantasma" tamano="sm" icono={<RotateCcw aria-hidden className="size-4" />} onClick={restablecer}>
              Restablecer demo
            </Boton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-live="polite">
        <TarjetaMetrica icono={UsersRound} etiqueta="Total de inscritos" valor={m.totalInscritos} detalle="En actividades vigentes" />
        <TarjetaMetrica icono={Ticket} etiqueta="Cupos disponibles" valor={m.cuposDisponibles} detalle="Suma de lugares libres" />
        <TarjetaMetrica
          icono={CalendarCheck}
          etiqueta="Actividades activas"
          valor={m.actividadesActivas}
          detalle={`${m.talleresActivos} talleres · ${m.eventosActivos} eventos`}
        />
        <TarjetaMetrica icono={DoorOpen} etiqueta="Asistencias validadas" valor={m.totalAsistentes} detalle="Pases escaneados en puerta" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className="tarjeta p-5" aria-labelledby="t-afluencia">
          <h2 id="t-afluencia" className="mb-1 text-xl font-bold">
            Afluencia por recinto
          </h2>
          <p className="mb-4 text-xs text-tenue">
            <span className="mr-1 inline-block size-2.5 rounded-sm bg-marca" /> Asistentes validados
            <span className="mr-1 ml-3 inline-block size-2.5 rounded-sm bg-acento" /> Inscritos
          </p>
          <ul className="flex flex-col gap-4">
            {m.afluenciaPorRecinto.map((r) => (
              <li key={r.id}>
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="truncate font-semibold">{r.nombre}</span>
                  <span className="shrink-0 tabular-nums">
                    {r.afluencia} / {r.inscritos}
                  </span>
                </div>
                <div className="flex flex-col gap-1" aria-hidden>
                  <div className="h-2.5 rounded-full bg-marca transition-[width]" style={{ width: `${(r.afluencia / maxAfluencia) * 100}%`, minWidth: 2 }} />
                  <div className="h-2.5 rounded-full bg-acento transition-[width]" style={{ width: `${(r.inscritos / maxAfluencia) * 100}%`, minWidth: 2 }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="tarjeta overflow-hidden" aria-labelledby="t-ocupacion">
          <h2 id="t-ocupacion" className="p-5 pb-3 text-xl font-bold">
            Ocupación de actividades vigentes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-linea bg-fondo text-xs text-tenue uppercase">
                <tr>
                  <th scope="col" className="px-5 py-2.5">Actividad</th>
                  <th scope="col" className="px-3 py-2.5">Inicio</th>
                  <th scope="col" className="w-[28%] px-3 py-2.5">Ocupación</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Libres</th>
                  <th scope="col" className="px-5 py-2.5 text-right">Asistentes</th>
                </tr>
              </thead>
              <tbody>
                {m.talleres.map((t) => (
                  <tr key={t.id} className="border-b border-linea last:border-0">
                    <th scope="row" className="px-5 py-2.5 font-semibold">
                      {t.titulo}
                      <span className="block text-xs font-normal text-tenue">{t.recintoNombre}</span>
                    </th>
                    <td className="px-3 py-2.5 whitespace-nowrap">{formatearFecha(t.fechaInicio)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Barra valor={t.inscritos} maximo={t.cupoMaximo} etiqueta={`Ocupación de ${t.titulo}`} />
                        <span className="w-10 shrink-0 text-right tabular-nums">{porcentaje(t.inscritos, t.cupoMaximo)}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{cuposDisponibles(t)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{t.asistentes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
