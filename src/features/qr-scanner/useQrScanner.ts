import {
  BinaryBitmap,
  DecodeHintType,
  HTMLCanvasElementLuminanceSource,
  HybridBinarizer,
  QRCodeReader,
} from '@zxing/library';
import { useCallback, useEffect, useRef, useState } from 'react';

export type EstadoCamara = 'apagada' | 'iniciando' | 'activa' | 'pausada' | 'error';

interface Opciones {
  /** Se llama con el texto de cada QR leído. El escaneo se pausa hasta que se llama a `reanudar()`. */
  alLeer: (texto: string) => void;
  intervaloMs?: number;
}

/**
 * Cámara con getUserMedia + decodificación con ZXing.
 * Cada `intervaloMs` se copia un cuadro del video a un canvas y se intenta leer un QR.
 * Tras cada lectura se pausa, para que un mismo pase no se procese dos veces.
 */
export function useQrScanner({ alLeer, intervaloMs = 200 }: Opciones) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const flujo = useRef<MediaStream | null>(null);
  const temporizador = useRef<number | null>(null);
  const pausado = useRef(false);
  const alLeerRef = useRef(alLeer);
  alLeerRef.current = alLeer;

  const [estado, setEstado] = useState<EstadoCamara>('apagada');
  const [error, setError] = useState<string | null>(null);

  const detenerBucle = () => {
    if (temporizador.current !== null) window.clearInterval(temporizador.current);
    temporizador.current = null;
  };

  const apagar = useCallback(() => {
    detenerBucle();
    flujo.current?.getTracks().forEach((t) => t.stop());
    flujo.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setEstado('apagada');
  }, []);

  const iniciarBucle = useCallback(() => {
    const lector = new QRCodeReader();
    const pistas = new Map([[DecodeHintType.TRY_HARDER, true]]);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    detenerBucle();
    temporizador.current = window.setInterval(() => {
      const video = videoRef.current;
      if (pausado.current || !video || !ctx || video.readyState < video.HAVE_ENOUGH_DATA) return;
      // Se analiza el cuadro central (donde está la guía) a máx. 640 px: más rápido y preciso.
      const lado = Math.min(video.videoWidth, video.videoHeight);
      const escala = Math.min(1, 640 / lado);
      canvas.width = canvas.height = Math.round(lado * escala);
      ctx.drawImage(
        video,
        (video.videoWidth - lado) / 2,
        (video.videoHeight - lado) / 2,
        lado,
        lado,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      try {
        const bitmap = new BinaryBitmap(new HybridBinarizer(new HTMLCanvasElementLuminanceSource(canvas)));
        const resultado = lector.decode(bitmap, pistas);
        pausado.current = true;
        setEstado('pausada');
        alLeerRef.current(resultado.getText());
      } catch {
        // NotFoundException / ChecksumException en cuadros sin QR: es lo normal, se ignora.
      } finally {
        lector.reset();
      }
    }, intervaloMs);
  }, [intervaloMs]);

  const encender = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setEstado('error');
      setError('Este navegador no permite usar la cámara. Usa la captura manual del folio.');
      return;
    }
    if (!window.isSecureContext) {
      setEstado('error');
      setError('La cámara solo funciona en HTTPS o en localhost.');
      return;
    }
    setEstado('iniciando');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      flujo.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error('Sin elemento de video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true'); // iOS: no abrir en pantalla completa
      await video.play();
      pausado.current = false;
      setEstado('activa');
      iniciarBucle();
    } catch (e) {
      apagar();
      setEstado('error');
      const nombre = e instanceof DOMException ? e.name : '';
      setError(
        nombre === 'NotAllowedError'
          ? 'Se negó el permiso de cámara. Actívalo en la configuración del navegador.'
          : nombre === 'NotFoundError'
            ? 'No se encontró ninguna cámara.'
            : nombre === 'NotReadableError'
              ? 'La cámara está siendo usada por otra aplicación.'
              : 'No se pudo iniciar la cámara.',
      );
    }
  }, [apagar, iniciarBucle]);

  const reanudar = useCallback(() => {
    if (!flujo.current) return;
    pausado.current = false;
    setEstado('activa');
  }, []);

  useEffect(() => apagar, [apagar]);

  return { videoRef, estado, error, encender, apagar, reanudar };
}
