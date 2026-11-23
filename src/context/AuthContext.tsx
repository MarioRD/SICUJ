import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { suscribirSesion } from '@/services/auth.service';
import type { Usuario } from '@/types/models';

interface Valor {
  usuario: Usuario | null;
  cargando: boolean;
}

const Contexto = createContext<Valor>({ usuario: null, cargando: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [valor, setValor] = useState<Valor>({ usuario: null, cargando: true });
  useEffect(() => suscribirSesion((usuario) => setValor({ usuario, cargando: false })), []);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useAuth = () => useContext(Contexto);
