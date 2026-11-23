let ctx: AudioContext | null = null;

function tono(frecuencia: number, inicio: number, duracion: number, tipo: OscillatorType = 'sine') {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gan = ctx.createGain();
  osc.type = tipo;
  osc.frequency.value = frecuencia;
  const t = ctx.currentTime + inicio;
  gan.gain.setValueAtTime(0.0001, t);
  gan.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
  gan.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
  osc.connect(gan).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duracion + 0.05);
}

/** Llamar en un clic del usuario: los navegadores bloquean el audio hasta que hay interacción. */
export function prepararAudio() {
  try {
    ctx ??= new AudioContext();
    void ctx.resume();
  } catch {
    ctx = null;
  }
}

export function sonidoAceptado() {
  tono(880, 0, 0.12);
  tono(1320, 0.13, 0.18);
  navigator.vibrate?.(80);
}

export function sonidoRechazado() {
  tono(220, 0, 0.22, 'square');
  tono(180, 0.25, 0.35, 'square');
  navigator.vibrate?.([200, 100, 200]);
}
