import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Cargando } from '@/components/ui/Basicos';
import { PublicLayout } from '@/layouts/PublicLayout';
import CatalogoPage from '@/pages/public/CatalogoPage';
import NoEncontradaPage from '@/pages/public/NoEncontradaPage';
import { ProtectedRoute } from './ProtectedRoute';

/**
 * Carga diferida: el ciudadano solo descarga el catálogo al entrar.
 * El panel admin, el OCR, el escáner QR y los reportes se descargan
 * únicamente cuando se visitan.
 */
function diferida(cargar: () => Promise<{ default: ComponentType }>) {
  const Componente = lazy(cargar);
  return (
    <Suspense fallback={<Cargando />}>
      <Componente />
    </Suspense>
  );
}

const AdminLayout = lazy(() => import('@/layouts/AdminLayout').then((m) => ({ default: m.AdminLayout })));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <CatalogoPage /> },
      { path: 'taller/:id', element: diferida(() => import('@/pages/public/TallerDetallePage')) },
      { path: 'taller/:id/inscripcion', element: diferida(() => import('@/pages/public/InscripcionPage')) },
      { path: 'pase/:id', element: diferida(() => import('@/pages/public/PasePage')) },
      { path: 'mis-pases', element: diferida(() => import('@/pages/public/MisPasesPage')) },
      { path: 'recintos', element: diferida(() => import('@/pages/public/RecintosPage')) },
      { path: 'accesibilidad', element: diferida(() => import('@/pages/public/AccesibilidadPage')) },
      { path: 'cuenta', element: diferida(() => import('@/pages/public/CuentaPage')) },
      { path: 'aviso-privacidad', element: diferida(() => import('@/pages/public/AvisoPrivacidadPage')) },
    ],
  },
  { path: '/admin/login', element: diferida(() => import('@/pages/admin/LoginPage')) },
  {
    path: '/admin',
    element: (
      <ProtectedRoute roles={['admin', 'staff']}>
        <Suspense fallback={<Cargando />}>
          <AdminLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ProtectedRoute roles={['admin']}>{diferida(() => import('@/pages/admin/DashboardPage'))}</ProtectedRoute>,
      },
      {
        path: 'talleres',
        element: <ProtectedRoute roles={['admin']}>{diferida(() => import('@/pages/admin/TalleresAdminPage'))}</ProtectedRoute>,
      },
      {
        path: 'recintos',
        element: <ProtectedRoute roles={['admin']}>{diferida(() => import('@/pages/admin/RecintosAdminPage'))}</ProtectedRoute>,
      },
      { path: 'validacion', element: diferida(() => import('@/pages/admin/ValidacionQRPage')) },
      {
        path: 'reportes',
        element: <ProtectedRoute roles={['admin']}>{diferida(() => import('@/pages/admin/ReportesPage'))}</ProtectedRoute>,
      },
    ],
  },
  { path: '*', element: <NoEncontradaPage /> },
]);
