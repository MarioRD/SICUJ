/**
 * TÉRMINOS Y CONDICIONES DE USO — BORRADOR PROVISIONAL.
 * Debe revisarlo el área jurídica del Ayuntamiento antes de publicarse.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FECHA_DOCUMENTOS } from './avisoPrivacidad';

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

export function TerminosCondiciones() {
  return (
    <div className="flex flex-col gap-5 leading-relaxed">
      <p className="rounded-lg border-l-4 border-aviso bg-aviso-fondo p-3 text-sm">
        <strong>Versión del {FECHA_DOCUMENTOS}.</strong> Documento provisional, pendiente de validación por el área jurídica
        municipal.
      </p>

      <Seccion titulo="1. Objeto">
        <p>
          Estos términos regulan el uso del Sistema Integral de Cultura y Juventud (SICUJ), servicio gratuito del H.
          Ayuntamiento de Coacalco de Berriozábal, a través de la Dirección de Cultura y Juventud, para consultar e
          inscribirse en talleres, eventos y campañas municipales. Al usar la aplicación aceptas estos términos.
        </p>
      </Seccion>

      <Seccion titulo="2. Uso del servicio">
        <p>
          La aplicación puede usarse sin cuenta. Crear una cuenta es opcional y sirve para ver tus pases en otros
          dispositivos y consultar tu historial. Te comprometes a dar datos verdaderos y a no usar el sistema para
          inscripciones falsas, acaparar lugares o afectar su funcionamiento.
        </p>
      </Seccion>

      <Seccion titulo="3. Inscripciones y pases">
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>Los lugares se asignan por orden de inscripción y hasta agotar el cupo de cada actividad.</li>
          <li>Cada pase es personal e intransferible y se valida con su código QR o folio en el recinto.</li>
          <li>Puedes cancelar un pase no utilizado desde “Mis pases” para liberar el lugar.</li>
          <li>
            La Dirección puede reprogramar o cancelar una actividad por causas de fuerza mayor; se avisará por los medios
            disponibles.
          </li>
          <li>Las actividades con costo indican el monto y la forma de pago en su ficha.</li>
        </ul>
      </Seccion>

      <Seccion titulo="4. Menores de edad">
        <p>
          Las personas menores de 18 años necesitan el consentimiento de su madre, padre o tutor para inscribirse, y deben
          respetar la edad indicada en cada actividad.
        </p>
      </Seccion>

      <Seccion titulo="5. Asistente por voz y lector de carteles">
        <p>
          Estas ayudas usan el micrófono y la cámara solo cuando las activas. El reconocimiento de voz lo realiza el servicio
          de tu navegador o teléfono y la lectura de carteles se hace en tu dispositivo; la aplicación no guarda grabaciones
          ni fotografías. Sus resultados pueden contener errores: revisa los datos antes de confirmar.
        </p>
      </Seccion>

      <Seccion titulo="6. Disponibilidad">
        <p>
          El servicio se ofrece tal como está y puede interrumpirse por mantenimiento o fallas técnicas. Algunas funciones
          requieren conexión a internet.
        </p>
      </Seccion>

      <Seccion titulo="7. Propiedad intelectual">
        <p>
          Los logotipos, imágenes y contenidos institucionales pertenecen al Ayuntamiento o a sus autores y no pueden usarse
          con fines comerciales sin autorización.
        </p>
      </Seccion>

      <Seccion titulo="8. Datos personales">
        <p>
          El tratamiento de tus datos se rige por el{' '}
          <Link to="/aviso-privacidad" className="font-semibold text-marca underline">
            aviso de privacidad integral
          </Link>
          .
        </p>
      </Seccion>

      <Seccion titulo="9. Cambios y legislación aplicable">
        <p>
          Cualquier cambio a estos términos se publicará en esta sección. Se rigen por las leyes del Estado de México; las
          controversias se atenderán ante las autoridades competentes del municipio.
        </p>
      </Seccion>

      <p className="text-sm text-tenue">Última actualización: {FECHA_DOCUMENTOS}.</p>
    </div>
  );
}
