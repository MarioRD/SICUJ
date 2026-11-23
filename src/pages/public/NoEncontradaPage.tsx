import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Vacio } from '@/components/ui/Basicos';

export default function NoEncontradaPage() {
  return (
    <div className="contenedor py-10">
      <Vacio icono={Compass} titulo="Esta página no existe">
        <Link to="/" className="font-semibold text-marca underline">
          Volver al inicio
        </Link>
      </Vacio>
    </div>
  );
}
