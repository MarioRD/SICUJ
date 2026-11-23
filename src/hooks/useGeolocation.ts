import { useCallback, useState } from 'react';
import type { Coordenadas } from '@/types/models';

export type EstadoUbicacion =
  | { estado: 'inactivo' }
  | { estado: 'buscando' }
  | { estado: 'listo'; coords: Coordenadas; precisionM: number }
  | { estado: 'error'; mensaje: string };

const CLAVE = 'sicuj:ultima-ubicacion';

function ubicacionGuardada(): EstadoUbicacion {
  try {
    const v = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null') as { coords: Coordenadas; precisionM: number } | null;
    return v ? { estado: 'listo', ...v } : { estado: 'inactivo' };
  } catch {
    return { estado: 'inactivo' };
  }
}

/**
 * Pide la ubicación solo cuando el usuario lo solicita (nunca al cargar la página).
 * Se recuerda durante la sesión para no volver a preguntar en cada pantalla.
 */
export function useGeolocation() {
  const [ubicacion, setUbicacion] = useState<EstadoUbicacion>(ubicacionGuardada);

  const solicitar = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setUbicacion({ estado: 'error', mensaje: 'Tu navegador no permite obtener la ubicación.' });
      return;
    }
    setUbicacion({ estado: 'buscando' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const v = { coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, precisionM: pos.coords.accuracy };
        try {
          sessionStorage.setItem(CLAVE, JSON.stringify(v));
        } catch {
          /* sin almacenamiento */
        }
        setUbicacion({ estado: 'listo', ...v });
      },
      (err) => {
        const mensajes: Record<number, string> = {
          1: 'No diste permiso para usar tu ubicación. Puedes activarlo en la configuración del navegador.',
          2: 'No se pudo determinar tu ubicación.',
          3: 'Se agotó el tiempo para obtener tu ubicación.',
        };
        setUbicacion({ estado: 'error', mensaje: mensajes[err.code] ?? 'Error al obtener la ubicación.' });
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  return { ubicacion, solicitar };
}
