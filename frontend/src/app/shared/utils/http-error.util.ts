// ── Utilidad para normalizar errores HTTP del backend ─────────────────────

/**
 * Extrae un mensaje de error legible desde una respuesta HTTP fallida.
 * FastAPI devuelve `detail` como string en errores de negocio, pero como
 * arreglo de objetos {type, loc, msg} en errores de validación (422).
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  const detail = (err as { error?: { detail?: unknown } })?.error?.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item && typeof item === 'object' && 'msg' in item ? String(item.msg) : null))
      .filter((msg): msg is string => !!msg);

    return messages.length > 0 ? messages.join(' ') : 'Revisa los datos ingresados.';
  }

  return fallback;
}
