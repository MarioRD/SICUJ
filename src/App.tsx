import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AvisosProvider } from '@/context/AvisosContext';
import { PreferenciasProvider } from '@/context/PreferenciasContext';
import { router } from '@/routes/router';

export default function App() {
  return (
    <PreferenciasProvider>
      <AuthProvider>
        <AvisosProvider>
          <RouterProvider router={router} />
        </AvisosProvider>
      </AuthProvider>
    </PreferenciasProvider>
  );
}
