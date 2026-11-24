import { useEffect, useRef } from 'react';

/**
 * Fondo del modo oscuro: luces de candil que flotan como brasas y, de vez en
 * cuando, un fuego artificial suave con los colores de la marca.
 * - 30 cuadros por segundo como máximo, se detiene con la pestaña oculta.
 * - Con movimiento reducido se dibuja un solo cuadro quieto.
 * Los colores se leen de los tokens CSS (--c-amarillo, --c-coral, --c-cielo, --c-blanco).
 */
export function LucesCandil({ contenido = false, fuegosCada = 9 }: { contenido?: boolean; fuegosCada?: number } = {}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const lienzo = ref.current;
    const ctx = lienzo?.getContext('2d');
    if (!lienzo || !ctx) return;
    const css = getComputedStyle(document.documentElement);
    const tono = (v: string) => css.getPropertyValue(v).trim();
    const colores = [tono('--c-amarillo'), tono('--c-amarillo'), tono('--c-coral'), tono('--c-cielo'), tono('--c-blanco')];
    const quieto =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.movimiento === 'reducido';

    // Halo pre-dibujado por color (más barato que shadowBlur en cada cuadro)
    const halos = new Map<string, HTMLCanvasElement>();
    const halo = (color: string) => {
      let h = halos.get(color);
      if (h) return h;
      h = document.createElement('canvas');
      h.width = h.height = 64;
      const c = h.getContext('2d')!;
      const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, color);
      g.addColorStop(0.16, color);
      g.addColorStop(1, 'transparent');
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
      halos.set(color, h);
      return h;
    };

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    type Luz = { x: number; y: number; r: number; vy: number; fase: number; f: number; c: string; a: number };
    type Chispa = { x: number; y: number; vx: number; vy: number; vida: number; c: string };
    let luces: Luz[] = [];
    let chispas: Chispa[] = [];
    const nueva = (alAzar = true): Luz => ({
      x: Math.random() * w,
      y: alAzar ? Math.random() * h : h + 20,
      r: 1.2 + Math.random() * 2.6,
      vy: 6 + Math.random() * 12,
      fase: Math.random() * Math.PI * 2,
      f: 0.6 + Math.random() * 1.4,
      c: colores[Math.floor(Math.random() * colores.length)] ?? '',
      a: 0.35 + Math.random() * 0.5,
    });
    const ajustar = () => {
      const caja = contenido ? lienzo.parentElement?.getBoundingClientRect() : null;
      w = caja ? caja.width : window.innerWidth;
      h = caja ? caja.height : window.innerHeight;
      lienzo.width = Math.round(w * dpr);
      lienzo.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(70, Math.max(18, Math.round((w * h) / (contenido ? 14000 : 24000))));
      luces = Array.from({ length: n }, () => nueva());
    };
    ajustar();

    const fuego = () => {
      const cx = w * (0.15 + Math.random() * 0.7);
      const cy = h * (0.12 + Math.random() * 0.35);
      const c = colores[Math.floor(Math.random() * 4)] ?? '';
      const n = 34;
      for (let k = 0; k < n; k++) {
        const ang = (k / n) * Math.PI * 2;
        const v = 40 + Math.random() * 45;
        chispas.push({ x: cx, y: cy, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, vida: 1, c });
      }
    };

    let t = 0;
    let previo = 0;
    let siguienteFuego = 3;
    let raf = 0;
    const dibujar = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const l of luces) {
        l.y -= l.vy * dt;
        l.x += Math.sin(t * 0.6 + l.fase) * 6 * dt;
        if (l.y < -20) Object.assign(l, nueva(false));
        const brillo = l.a * (0.55 + 0.45 * Math.sin(t * l.f + l.fase));
        const tam = l.r * 9;
        ctx.globalAlpha = brillo;
        ctx.drawImage(halo(l.c), l.x - tam / 2, l.y - tam / 2, tam, tam);
      }
      chispas = chispas.filter((s) => s.vida > 0);
      for (const s of chispas) {
        s.vy += 30 * dt;
        s.vx *= 0.985;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vida -= dt / 1.8;
        ctx.globalAlpha = Math.max(0, s.vida) * 0.7;
        ctx.drawImage(halo(s.c), s.x - 6, s.y - 6, 12, 12);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };

    const cuadro = (ahora: number) => {
      raf = requestAnimationFrame(cuadro);
      const s = ahora / 1000;
      if (s - previo < 1 / 30) return;
      const dt = previo ? Math.min(0.1, s - previo) : 1 / 30;
      previo = s;
      t += dt;
      siguienteFuego -= dt;
      if (siguienteFuego <= 0) {
        fuego();
        siguienteFuego = fuegosCada * (0.6 + Math.random() * 0.8);
      }
      dibujar(dt);
    };

    const alRedimensionar = () => {
      ajustar();
      if (quieto) dibujar(0);
    };
    const alVisibilidad = () => {
      cancelAnimationFrame(raf);
      previo = 0;
      if (!document.hidden && !quieto && visible) raf = requestAnimationFrame(cuadro);
    };
    window.addEventListener('resize', alRedimensionar);
    const ro = contenido && lienzo.parentElement ? new ResizeObserver(alRedimensionar) : null;
    if (ro && lienzo.parentElement) ro.observe(lienzo.parentElement);
    // Fuera de pantalla no se dibuja (ahorra batería)
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      alVisibilidad();
    });
    io.observe(lienzo);
    document.addEventListener('visibilitychange', alVisibilidad);
    if (quieto) dibujar(0);
    else raf = requestAnimationFrame(cuadro);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', alRedimensionar);
      ro?.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', alVisibilidad);
    };
  }, [contenido, fuegosCada]);

  return <canvas ref={ref} className="cielo-candil" aria-hidden="true" />;
}
