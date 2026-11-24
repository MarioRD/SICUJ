import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * "Coacalco en el tiempo": los murales de cada época entran volando en mosaico al desplazarse,
 * se acercan y se abren para dejar paso a la línea del tiempo con los textos.
 * Murales originales al estilo de la pintura mural del valle (ocre, hueso y jade sobre rojo).
 * Pendiente: validar los textos con el cronista municipal.
 */

const Mural = ({ titulo, children, decorativo = false }: { titulo: string; children: ReactNode; decorativo?: boolean }) => (
  <div className="mural">
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      {...(decorativo ? { 'aria-hidden': true } : { role: 'img', 'aria-label': titulo })}
    >
      <rect className="m-fondo" width="320" height="200" />
      <path className="m-fondo-2" d="M0 170c40-6 80 6 120 0s80-8 120 0 60 4 80 0v30H0z" opacity="0.6" />
      <g filter="url(#trazo-mural)">{children}</g>
    </svg>
  </div>
);

const Persona = ({ x, y, s = 1, brazos = 'arriba' }: { x: number; y: number; s?: number; brazos?: 'arriba' | 'abajo' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle className="m-hueso" cx="0" cy="-22" r="5" />
    <path className="m-trazo" d={`M0-17v16M0-1l-6 12M0-1l6 12${brazos === 'arriba' ? 'M0-13l-8-8M0-13l8-8' : 'M0-13l-7 7M0-13l7 7'}`} />
  </g>
);

const EPOCAS: Array<{ cuando: string; titulo: string; texto: string; mural: ReactNode }> = [
  {
    cuando: 'Siglos I a VII',
    titulo: 'El valle de Teotihuacan',
    texto:
      'La cuenca de México era un sistema de lagos. A unos 30 km de aquí florecía Teotihuacan, la gran ciudad del valle, con sus pirámides y murales.',
    mural: (
      <>
        <circle className="m-amarillo" cx="250" cy="48" r="20" />
        <path className="m-trazo-ocre" d="M250 18v-8M250 86v-8M220 48h-8M288 48h-8M229 27l-6-6M271 69l6 6M271 27l6-6M229 69l-6 6" />
        <path className="m-ocre" d="M70 160h150l-12-22h-20l-10-22h-18l-10-24h-14l-10 24h-18l-10 22h-20z" />
        <path className="m-trazo" d="M100 138h90M110 116h70M124 92h42" />
        <rect className="m-hueso" x="138" y="80" width="14" height="12" />
        <Persona x={40} y={170} />
        <Persona x={262} y={170} s={0.9} brazos="abajo" />
        <path className="m-trazo-jade" d="M20 120c10-10 18 10 28 0M276 112c10-10 18 10 28 0" />
      </>
    ),
  },
  {
    cuando: 'Época prehispánica',
    titulo: 'A la orilla del lago de Xaltocan',
    texto:
      'Las tierras bajas de lo que hoy es Coacalco estaban cubiertas por el lago de Xaltocan, parte del sistema del lago de Texcoco. Por eso aquí el suelo es fangoso.',
    mural: (
      <>
        <path className="m-cielo" d="M0 110c20-8 40 8 60 0s40-8 60 0 40 8 60 0 40-8 60 0 40 8 80 0v90H0z" opacity="0.85" />
        <path className="m-trazo" d="M10 132c14-8 28 8 42 0s28-8 42 0M150 146c14-8 28 8 42 0s28-8 42 0M60 168c14-8 28 8 42 0s28-8 42 0" />
        <path className="m-ocre" d="M110 112h96c-6 12-20 16-48 16s-42-4-48-16z" />
        <Persona x={150} y={112} s={0.9} brazos="abajo" />
        <path className="m-trazo" d="M168 100l18 34" />
        <path className="m-trazo-jade" d="M30 110V70M38 110V62M46 110V76M270 110V66M278 110V58M286 110V72" />
        <path className="m-hueso" d="M230 150c10-8 22-8 30 0-8 8-20 8-30 0zm30 0l8-6v12z" />
      </>
    ),
  },
  {
    cuando: 'Su nombre',
    titulo: 'En la casa de la serpiente',
    texto: 'Coacalco viene del náhuatl: cóatl (serpiente), calli (casa) y -co (en). Significa "en la casa de la serpiente".',
    mural: (
      <>
        <path className="m-trazo" d="M110 170v-48h100v48M140 170v-28h40v28M100 122l12-18h96l12 18M124 104v-8h12v8M154 104v-8h12v8M184 104v-8h12v8" />
        <path
          className="m-trazo-jade"
          style={{ strokeWidth: 9 }}
          d="M86 172c-18-30-14-62 16-76 30-14 60 6 80-12 14-12 8-32 22-42"
        />
        <path className="m-trazo" style={{ strokeDasharray: '2 9', strokeWidth: 6 }} d="M86 172c-18-30-14-62 16-76 30-14 60 6 80-12 14-12 8-32 22-42" />
        <path className="m-ocre" d="M200 44c4-14 26-20 40-12 10 6 8 16 0 16-6 0-20 2-28 8l18 6c-12 6-26 4-34-2z" />
        <circle className="m-hueso" cx="222" cy="36" r="3.5" />
        <path className="m-trazo" d="M238 54l20-2M252 52l8-6M252 52l8 6" />
        <path className="m-trazo-ocre" d="M206 34c-6-10-2-20 8-24M214 30c0-10 8-18 18-18" />
      </>
    ),
  },
  {
    cuando: 'Finales del siglo XVI',
    titulo: 'San Francisco Coacalco',
    texto:
      'Tras la conquista se levanta la parroquia de San Francisco de Asís, alrededor de la cual crece el pueblo que hoy es la cabecera municipal.',
    mural: (
      <>
        <path className="m-hueso" d="M110 170V96h100v74z" />
        <path className="m-ocre" d="M118 96l42-26 42 26z" />
        <path className="m-hueso" d="M200 170V70h28v100z" />
        <path className="m-ocre" d="M198 70l16-16 16 16z" />
        <path className="m-trazo-ocre" style={{ strokeWidth: 3.5 }} d="M214 54V40M208 46h12" />
        <path className="m-fondo-2" d="M146 170v-30a14 14 0 0 1 28 0v30z" />
        <circle className="m-fondo-2" cx="160" cy="114" r="7" />
        <rect className="m-fondo-2" x="208" y="84" width="12" height="16" rx="6" />
        <path className="m-trazo-jade" d="M60 170v-30M50 150c6-14 14-14 20 0M50 140c6-14 14-14 20 0M262 170v-34M252 152c6-14 14-14 20 0M252 142c6-14 14-14 20 0" />
      </>
    ),
  },
  {
    cuando: '12 de febrero de 1862',
    titulo: 'Nace el municipio',
    texto:
      'Un decreto firmado por el gobernador Felipe Berriozábal erige el municipio de Coacalco. Por eso hoy se llama Coacalco de Berriozábal.',
    mural: (
      <>
        <rect className="m-hueso" x="96" y="44" width="128" height="112" rx="6" />
        <path className="m-ocre" d="M90 44h140v12H90zM90 150h140v12H90z" />
        <path className="m-trazo-ocre" d="M112 74h96M112 90h96M112 106h70M112 122h86" />
        <circle className="m-fondo" cx="196" cy="132" r="10" />
        <path className="m-trazo" d="M240 150l40-80M276 78l10-14" />
        <text x="160" y="190" textAnchor="middle" className="m-hueso" style={{ font: '700 18px var(--font-display)' }}>
          1862
        </text>
        <Persona x={52} y={170} brazos="abajo" />
      </>
    ),
  },
  {
    cuando: '1966 a 1970',
    titulo: 'De pueblos a ciudad',
    texto:
      'El municipio era de pueblos y rancherías. Con la expansión de la Ciudad de México nacen Villa de las Flores (1966) y Parque Residencial Coacalco.',
    mural: (
      <>
        {[30, 90, 150, 210, 270].map((x, i) => (
          <g key={x} transform={`translate(${x} ${i % 2 ? 104 : 96})`}>
            <path className="m-hueso" d="M-22 60V24h44v36z" />
            <path className="m-ocre" d="M-26 24L0 4l26 20z" />
            <rect className="m-fondo-2" x="-6" y="40" width="12" height="20" />
          </g>
        ))}
        <path className="m-trazo-jade" d="M0 172h320" />
        <path className="m-trazo" style={{ strokeDasharray: '10 10' }} d="M0 186h320" />
        <circle className="m-amarillo" cx="40" cy="40" r="12" />
      </>
    ),
  },
  {
    cuando: 'Hoy',
    titulo: 'Casa de 293 mil personas',
    texto:
      'Coacalco forma parte de la zona metropolitana del Valle de México. En 2020 vivían aquí 293,444 personas, y su juventud sigue escribiendo la historia.',
    mural: (
      <>
        {[48, 84, 120, 156, 192, 228, 264].map((x, i) => (
          <Persona key={x} x={x} y={i % 2 ? 176 : 168} s={i % 3 === 0 ? 1.1 : 1} />
        ))}
        <g className="m-trazo-ocre">
          <path d="M90 50l0-14M90 64l0 14M76 57h-14M104 57h14M80 47l-8-8M100 67l8 8M100 47l8-8M80 67l-8 8" />
        </g>
        <g className="m-trazo-jade">
          <path d="M230 40v-12M230 52v12M218 46h-12M242 46h12M222 38l-6-6M238 54l6 6M238 38l6-6M222 54l-6 6" />
        </g>
        <circle className="m-amarillo" cx="90" cy="57" r="5" />
        <circle className="m-hueso" cx="230" cy="46" r="4" />
        <circle className="m-amarillo" cx="160" cy="34" r="3" />
        <circle className="m-hueso" cx="190" cy="80" r="2.5" />
        <circle className="m-hueso" cx="130" cy="86" r="2.5" />
      </>
    ),
  },
];

/** Mosaico de cierre: manos y espiral, como en los abrigos rocosos. */
const MURAL_MANOS = (
  <>
    {[
      [70, 70, -12],
      [150, 120, 8],
      [240, 66, 18],
    ].map(([x, y, g]) => (
      <g key={x} transform={`translate(${x} ${y}) rotate(${g})`} className="m-hueso">
        <ellipse cx="0" cy="12" rx="17" ry="20" />
        {[-14, -6, 2, 10].map((dx, k) => (
          <rect key={dx} x={dx} y={-30 + Math.abs(k - 1.5) * 4} width="7" height="26" rx="3.5" />
        ))}
        <rect x="14" y="0" width="7" height="20" rx="3.5" transform="rotate(-40 17 10)" />
      </g>
    ))}
    <path className="m-trazo-ocre" d="M250 150c0-10 14-10 14 0s-24 14-24 0 34-20 34 0-44 26-44 0" />
    <path className="m-trazo-jade" d="M30 170c20-12 40 12 60 0s40-12 60 0" />
  </>
);

/** Rejilla 3×3: la celda central es para el título; las 8 restantes son murales. */
const MOSAICOS: Array<{ pos: number; titulo: string; cuando?: string; mural: ReactNode }> = [
  ...EPOCAS.map((e, i) => ({ pos: i < 4 ? i : i + 1, titulo: e.titulo, cuando: e.cuando, mural: e.mural })),
  { pos: 8, titulo: 'Manos pintadas', mural: MURAL_MANOS },
];

const prefiereQuieto = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.movimiento === 'reducido';

const limitar = (v: number) => Math.min(1, Math.max(0, v));
const salida = (t: number) => 1 - (1 - t) ** 3;
const vaiven = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

export function HistoriaCoacalco() {
  const escenario = useRef<HTMLDivElement>(null);
  const rejilla = useRef<HTMLDivElement>(null);
  const titulo = useRef<HTMLDivElement>(null);
  const [animado] = useState(() => !prefiereQuieto());

  useEffect(() => {
    if (!animado) return;
    let cuadro = 0;
    const mover = () => {
      cuadro = 0;
      const e = escenario.current;
      const g = rejilla.current;
      if (!e || !g) return;
      const r = e.getBoundingClientRect();
      const recorrido = r.height - window.innerHeight;
      const p = recorrido > 0 ? limitar(-r.top / recorrido) : 0;
      const alto = window.innerHeight;

      // Fase 2: la rejilla se acerca y las columnas se abren
      const z = vaiven(limitar((p - 0.5) / 0.32));
      g.style.transform = `scale(${1 + 1.05 * z})`;
      const fuera = limitar((p - 0.7) / 0.14);

      for (const t of Array.from(g.children) as HTMLElement[]) {
        const pos = Number(t.dataset.pos);
        const c = pos % 3;
        const f = Math.floor(pos / 3);
        // Fase 1: cada columna entra desde un borde distinto, con desfase por fila
        const inicio = c * 0.04 + (c % 2 ? 2 - f : f) * 0.07;
        const v = salida(limitar((p - inicio) / 0.3));
        const dir = c % 2 ? 1 : -1;
        const dx = (c - 1) * 0.4 * z * t.offsetWidth;
        const dy = (f - 1) * 0.4 * z * t.offsetHeight + (1 - v) * dir * alto * 1.15;
        t.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${(1 - v) * dir * 7}deg)`;
        t.style.opacity = String(1 - fuera);
      }
      // Fase 3: el título se queda y aparece la invitación a seguir
      titulo.current?.style.setProperty('--sub', limitar((p - 0.78) / 0.12).toFixed(3));
    };
    const alDesplazar = () => {
      if (!cuadro) cuadro = requestAnimationFrame(mover);
    };
    mover();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    window.addEventListener('resize', alDesplazar);
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener('scroll', alDesplazar);
      window.removeEventListener('resize', alDesplazar);
    };
  }, [animado]);

  const escena = (
    <div className="mosaico-escena">
      <div ref={rejilla} className="mosaico-rejilla">
        {MOSAICOS.map((m) => (
          <div key={m.pos} data-pos={m.pos} className="mosaico-pieza" style={{ gridArea: `${Math.floor(m.pos / 3) + 1} / ${(m.pos % 3) + 1}` }}>
            <Mural titulo={m.titulo} decorativo>
              {m.mural}
            </Mural>
            {m.cuando && <span className="mosaico-fecha">{m.cuando}</span>}
          </div>
        ))}
      </div>
      <div ref={titulo} className="mosaico-titulo">
        <h2 id="historia-titulo" className="fuente-display leading-[1.02] font-extrabold">
          Coacalco
          <span className="block text-marca">en el tiempo</span>
        </h2>
        <p className="mosaico-sub text-tenue">Del valle de Teotihuacan a hoy</p>
      </div>
    </div>
  );

  return (
    <section aria-labelledby="historia-titulo" className="historia mt-10">
      {/* Filtro que hace los trazos irregulares, como pintados a mano sobre muro */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <filter id="trazo-mural">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="3.5" />
        </filter>
      </svg>

      {animado ? (
        <div ref={escenario} style={{ height: '340dvh' }}>
          <div className="sticky top-0 grid h-dvh place-items-center overflow-hidden max-sm:mx-[calc(50%-50vw)]">{escena}</div>
        </div>
      ) : (
        <div className="grid place-items-center py-6 [--sub:1]">{escena}</div>
      )}

      <ol className="historia-linea contenedor mt-4">
        {EPOCAS.map((e) => (
          <li key={e.titulo} className="historia-hito">
            <div className="w-full max-w-[17rem] shrink-0 sm:w-36">
              <Mural titulo={`Ilustración: ${e.titulo}`}>{e.mural}</Mural>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="w-fit rounded-full bg-mural px-3 py-0.5 text-sm font-semibold sm:text-xs text-hueso">{e.cuando}</p>
              <h3 className="text-[clamp(1.45rem,1.1rem+1.6vw,1.6rem)] leading-tight font-bold sm:text-lg">{e.titulo}</h3>
              <p className="text-[clamp(1.05rem,0.95rem+0.6vw,1.15rem)] leading-relaxed text-tinta sm:text-sm">{e.texto}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="contenedor mt-6 text-xs text-tenue">Fuente: INEGI, Censo de Población y Vivienda 2020.</p>
    </section>
  );
}
