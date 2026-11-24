import { TerminosCondiciones } from '@/content/terminos';

export default function TerminosPage() {
  return (
    <article className="flex flex-col gap-4">
      <h1 className="text-3xl leading-tight font-bold">Términos y condiciones</h1>
      <TerminosCondiciones />
    </article>
  );
}
