import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

const CONTROL =
  'w-full rounded-md border-2 border-linea bg-superficie px-3 text-base text-tinta placeholder:text-tenue/70 focus:border-marca focus:outline-none aria-invalid:border-error min-h-(--toque-min)';

interface Base {
  etiqueta: string;
  ayuda?: ReactNode;
  error?: string | null;
  opcional?: boolean;
  className?: string;
}

/** Envuelve un control con su <label>, texto de ayuda y error enlazados por aria-describedby. */
function Envoltura({
  id,
  etiqueta,
  ayuda,
  error,
  opcional,
  className = '',
  children,
}: Base & { id: string; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold">
        {etiqueta}
        {opcional && <span className="font-normal text-tenue"> (opcional)</span>}
      </label>
      {children}
      {ayuda && (
        <p id={`${id}-ayuda`} className="text-xs text-tenue">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-semibold text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const describir = (id: string, ayuda: unknown, error: unknown) =>
  [ayuda ? `${id}-ayuda` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;

export function Campo({ etiqueta, ayuda, error, opcional, className, ...input }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Envoltura id={id} {...{ etiqueta, ayuda, error, opcional, className }}>
      <input
        id={id}
        className={CONTROL}
        aria-invalid={error ? true : undefined}
        aria-describedby={describir(id, ayuda, error)}
        {...input}
      />
    </Envoltura>
  );
}

export function Selector({
  etiqueta,
  ayuda,
  error,
  opcional,
  className,
  children,
  ...select
}: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Envoltura id={id} {...{ etiqueta, ayuda, error, opcional, className }}>
      <select
        id={id}
        className={CONTROL}
        aria-invalid={error ? true : undefined}
        aria-describedby={describir(id, ayuda, error)}
        {...select}
      >
        {children}
      </select>
    </Envoltura>
  );
}

export function AreaTexto({ etiqueta, ayuda, error, opcional, className, ...area }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Envoltura id={id} {...{ etiqueta, ayuda, error, opcional, className }}>
      <textarea
        id={id}
        className={`${CONTROL} py-2`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describir(id, ayuda, error)}
        {...area}
      />
    </Envoltura>
  );
}

export function Casilla({
  etiqueta,
  className = '',
  ...input
}: { etiqueta: ReactNode; className?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const id = useId();
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <input id={id} type="checkbox" className="mt-1 size-[1.3em] shrink-0 accent-(--c-marca)" {...input} />
      <label htmlFor={id} className="text-sm">
        {etiqueta}
      </label>
    </div>
  );
}
