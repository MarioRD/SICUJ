import { describe, expect, it } from 'vitest';
import { limpiarLineas } from './preparar';

const p = (text: string, confidence = 90) => ({ text, confidence });

describe('limpiarLineas', () => {
  it('conserva el texto confiable', () => {
    const r = limpiarLineas([{ words: [p('Taller'), p('de'), p('guitarra')] }, { words: [p('Sábado'), p('10:00')] }]);
    expect(r.texto).toBe('Taller de guitarra\nSábado 10:00');
    expect(r.confianza).toBe(90);
  });
  it('descarta renglones de ruido y palabras dudosas', () => {
    const r = limpiarLineas([
      { words: [p('|', 40), p('~~', 30), p('ii', 35)] },
      { words: [p('Concierto'), p('§¤', 70), p('gratis')] },
      { words: [p('a', 80)] },
    ]);
    expect(r.texto).toBe('Concierto gratis');
  });
});
