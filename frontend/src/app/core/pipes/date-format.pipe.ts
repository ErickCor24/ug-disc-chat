import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formatea una fecha ISO a hora local HH:mm.
 * Standalone para importar en cualquier componente que lo necesite.
 */
@Pipe({ name: 'dateFormat', standalone: true, pure: true })
export class DateFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    try {
      const date = new Date(value);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }
}
