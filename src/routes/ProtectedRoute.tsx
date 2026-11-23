import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Cargando } from '@/components/ui/Basicos';
import { useAuth } from '@/context/AuthContext';
import type { Rol } from '@/types/models';

/**
 * Protege rutas por rol. Ojo: esto es solo navegación; la protección real de
 * los datos estará en las reglas de Firestore cuando se conecte la base.
 */
export function ProtectedRoute({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const ubicacion = useLocation();

  if (cargando) return <Cargando texto="Verificando sesión…" />;
  if (!usuario || usuario.rol === 'ciudadano') {
    return <Navigate to="/admin/login" replace state={{ desde: ubicacion.pathname }} />;
  }
  if (!roles.includes(usuario.rol)) {
    // p. ej. staff entrando a /admin → su única sección
    return <Navigate to="/admin/validacion" replace />;
  }
  return <>{children}</>;
}
