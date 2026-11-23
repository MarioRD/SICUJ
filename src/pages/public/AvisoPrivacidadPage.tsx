import { AvisoPrivacidadIntegral } from '@/content/avisoPrivacidad';

export default function AvisoPrivacidadPage() {
  return (
    <article className="flex flex-col gap-4">
      <h1 className="text-3xl leading-tight font-bold">Aviso de privacidad integral</h1>
      <AvisoPrivacidadIntegral />
    </article>
  );
}
