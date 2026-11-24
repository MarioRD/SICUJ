/**
 * AVISO DE PRIVACIDAD — BORRADOR PROVISIONAL.
 * Debe revisarlo el área jurídica y la Unidad de Transparencia del Ayuntamiento
 * antes de publicarse. Los datos entre [corchetes] deben completarse.
 *
 * Como el responsable es un ente público municipal, el marco aplicable es la
 * Ley de Protección de Datos Personales en Posesión de Sujetos Obligados del
 * Estado de México y Municipios (no la ley federal para particulares).
 */
import type { ReactNode } from 'react';

export const AVISO_VERSION = 'Borrador 0.1 · noviembre 2026';

const RESPONSABLE = 'H. Ayuntamiento de Coacalco de Berriozábal, a través de la Dirección de Cultura y Juventud';
const DOMICILIO = '[Domicilio oficial del Palacio Municipal o de la Dirección]';
const CONTACTO_TRANSPARENCIA = '[correo y teléfono de la Unidad de Transparencia]';

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

export function AvisoProvisional() {
  return (
    <p className="rounded-lg border-l-4 border-aviso bg-aviso-fondo p-3 text-sm">
      <strong>Documento provisional ({AVISO_VERSION}).</strong> Pendiente de validación por el área jurídica y la Unidad de
      Transparencia municipal.
    </p>
  );
}

export function AvisoPrivacidadSimplificado() {
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed">
      <AvisoProvisional />
      <p>
        El <strong>{RESPONSABLE}</strong> es responsable del tratamiento de los datos personales que proporciones en el
        Sistema Integral de Cultura y Juventud (SICUJ).
      </p>
      <p>
        <strong>¿Qué datos pedimos?</strong> Nombre (puede ser parcial o iniciales), edad y género de cada asistente y, de
        forma opcional, un correo o teléfono de contacto. No pedimos CURP, domicilio, fotografía ni datos sensibles.
      </p>
      <p>
        <strong>Inscripción rápida (opcional):</strong> si tienes cuenta y lo autorizas, guardamos tu nombre, fecha de
        nacimiento, género y teléfono para inscribirte con un toque. Solo tú puedes verlos y los cambias o borras cuando
        quieras en “Mis datos”.
      </p>
      <p>
        <strong>¿Para qué?</strong> (1) Registrar tu lugar y generar tu pase digital; (2) controlar el acceso y evitar
        duplicados; (3) avisarte de cambios o cancelaciones, solo si dejaste un contacto; y (4) elaborar estadísticas
        anónimas de participación por edad y género para planear la oferta cultural.
      </p>
      <p>
        <strong>No compartimos tus datos</strong> con terceros, salvo requerimiento de autoridad competente. Las estadísticas
        que se publiquen nunca identifican a personas.
      </p>
      <p>
        Puedes ejercer tus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición (ARCO)</strong> ante la
        Unidad de Transparencia municipal o en la Plataforma Nacional de Transparencia. Consulta el aviso integral para
        más detalles.
      </p>
    </div>
  );
}

export function AvisoPrivacidadIntegral() {
  return (
    <div className="flex flex-col gap-5 leading-relaxed">
      <AvisoProvisional />

      <Seccion titulo="1. Responsable del tratamiento">
        <p>
          {RESPONSABLE}, con domicilio en {DOMICILIO}, es responsable del tratamiento de los datos personales recabados a
          través del Sistema Integral de Cultura y Juventud (SICUJ), en su aplicación web y en los puntos de registro de sus
          recintos.
        </p>
      </Seccion>

      <Seccion titulo="2. Datos personales que se recaban">
        <ul className="list-disc pl-5">
          <li>
            <strong>De cada asistente:</strong> nombre o forma de identificación elegida por la persona (puede ser solo el
            nombre de pila o iniciales), edad y género (incluida la opción “prefiero no decir”).
          </li>
          <li>
            <strong>De contacto (opcionales):</strong> correo electrónico y/o número telefónico.
          </li>
          <li>
            <strong>Si crea una cuenta (opcional):</strong> nombre o alias, correo electrónico y contraseña (almacenada de
            forma cifrada e irreversible).
          </li>
          <li>
            <strong>Inscripción rápida (opcional, solo con cuenta y con autorización expresa):</strong> nombre, fecha de
            nacimiento, género y teléfono, para llenar automáticamente futuras inscripciones. Se usa la fecha de nacimiento
            (no la edad) para calcular la edad al día de cada actividad. Solo la persona titular de la cuenta puede
            consultarlos; puede modificarlos o eliminarlos en cualquier momento desde la sección “Mis datos”, y se
            eliminan al cancelar la cuenta.
          </li>
          <li>
            <strong>Registro de asistencia:</strong> fecha y hora en que se validó el pase y el personal que lo validó.
          </li>
        </ul>
        <p>
          <strong>No se recaban datos personales sensibles.</strong> La ubicación del dispositivo, cuando se usa la función
          “Cerca de mí”, se procesa únicamente en el propio dispositivo para ordenar los recintos por distancia y{' '}
          <strong>no se envía ni se almacena</strong>. Las imágenes procesadas con la función de lectura de texto (OCR)
          también se procesan solo en el dispositivo. Al usar el <strong>asistente por voz</strong>, tu voz la convierte en
          texto el servicio de reconocimiento de tu navegador (en Chrome y Edge lo hace Google o Microsoft; en Safari, Apple);
          SICUJ solo recibe ese texto para buscar actividades y <strong>no guarda grabaciones ni la conversación</strong>.
        </p>
      </Seccion>

      <Seccion titulo="3. Datos de niñas, niños y adolescentes">
        <p>
          Cuando la inscripción incluya a personas menores de 18 años, sus datos solo se tratarán con el consentimiento de
          quien ejerza la patria potestad o tutela, quien lo manifiesta expresamente al realizar el registro. Se tratarán
          privilegiando el interés superior de la niñez y con el mínimo de datos indispensable.
        </p>
      </Seccion>

      <Seccion titulo="4. Finalidades del tratamiento">
        <p>
          <strong>Finalidades principales</strong> (necesarias para el servicio):
        </p>
        <ol className="list-decimal pl-5">
          <li>Registrar la inscripción a talleres y eventos culturales y generar el pase digital correspondiente.</li>
          <li>Controlar el cupo de cada actividad y validar el acceso presencial evitando duplicidades.</li>
          <li>Integrar listas de asistencia para la operación de las actividades.</li>
          <li>
            Generar estadísticas disociadas (que no identifican a personas) de participación por edad, género, actividad y
            recinto, para planeación, evaluación y rendición de cuentas.
          </li>
        </ol>
        <p>
          <strong>Finalidad secundaria</strong> (solo si proporcionó un medio de contacto): informarle sobre cambios,
          reprogramaciones o cancelaciones de la actividad en la que se inscribió. Puede manifestar su negativa a esta
          finalidad en cualquier momento sin que ello afecte su inscripción.
        </p>
      </Seccion>

      <Seccion titulo="5. Fundamento legal">
        <p>
          El tratamiento se realiza con fundamento en la Ley de Protección de Datos Personales en Posesión de Sujetos
          Obligados del Estado de México y Municipios; la Ley General de Protección de Datos Personales en Posesión de
          Sujetos Obligados; la Ley Orgánica Municipal del Estado de México; y [reglamento interior o disposición municipal
          que otorga atribuciones a la Dirección de Cultura y Juventud].
        </p>
      </Seccion>

      <Seccion titulo="6. Transferencias">
        <p>
          No se realizan transferencias de datos personales, salvo aquellas necesarias para atender requerimientos de
          información de una autoridad competente, debidamente fundados y motivados. La información estadística que se
          publique o comparta estará disociada.
        </p>
      </Seccion>

      <Seccion titulo="7. Conservación y seguridad">
        <p>
          Los datos se conservarán durante el ciclo de la actividad y por el plazo que establezcan las disposiciones de
          archivo aplicables [plazo a definir por el área de archivo]; después se suprimirán o se conservarán únicamente de
          forma disociada. Se aplican medidas de seguridad administrativas, técnicas y físicas, incluido el control de
          acceso por roles para el personal autorizado y la comunicación cifrada (HTTPS).
        </p>
        <p>
          La plataforma utiliza servicios de infraestructura en la nube como encargados del tratamiento, que actúan
          únicamente por cuenta del Ayuntamiento [nombre del proveedor y ubicación de los servidores, a definir].
        </p>
      </Seccion>

      <Seccion titulo="8. Derechos ARCO y portabilidad">
        <p>
          Usted puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO), así como el de
          portabilidad, mediante solicitud presentada ante la Unidad de Transparencia del Ayuntamiento ({CONTACTO_TRANSPARENCIA}
          ), o a través de la Plataforma Nacional de Transparencia o del sistema electrónico estatal habilitado para ello.
        </p>
        <p>
          La solicitud deberá indicar su nombre, el derecho que desea ejercer, la actividad en la que se inscribió y, de
          preferencia, el folio de su pase. También puede cancelar en cualquier momento una inscripción no utilizada desde la
          sección “Mis pases” de la aplicación.
        </p>
      </Seccion>

      <Seccion titulo="9. Cambios al aviso de privacidad">
        <p>
          Cualquier modificación a este aviso se publicará en esta misma sección de la aplicación y en los medios oficiales
          del Ayuntamiento.
        </p>
      </Seccion>

      <p className="text-sm text-tenue">Última actualización: {AVISO_VERSION}.</p>
    </div>
  );
}
