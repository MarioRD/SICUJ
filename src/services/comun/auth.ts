export class ErrorAuth extends Error {}

export const normalizarEmail = (e: string) => e.trim().toLowerCase();

/** Valida y limpia los datos de registro antes de crear la cuenta. */
export function validarRegistro(nombreCrudo: string, emailCrudo: string, password: string) {
  const email = normalizarEmail(emailCrudo);
  const nombre = nombreCrudo.trim();
  if (nombre.length < 2) throw new ErrorAuth('Escribe tu nombre o cómo quieres que te llamemos.');
  if (nombre.length > 60) throw new ErrorAuth('El nombre es demasiado largo.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ErrorAuth('El correo no es válido.');
  if (password.length < 8) throw new ErrorAuth('La contraseña debe tener al menos 8 caracteres.');
  return { nombre, email };
}
