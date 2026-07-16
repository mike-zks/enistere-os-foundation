import { AbstractControl } from '@angular/forms';

export function getFieldError(control: AbstractControl, label: string): string | null {
  if (!control.errors) return null;
  if (control.hasError('required')) return `${label} est obligatoire.`;
  if (control.hasError('email')) return `${label} n'est pas valide.`;
  if (control.hasError('minlength')) {
    const { requiredLength } = control.getError('minlength') as { requiredLength: number };
    return `${label} doit contenir au moins ${requiredLength} caractères.`;
  }
  if (control.hasError('maxlength')) {
    const { requiredLength } = control.getError('maxlength') as { requiredLength: number };
    return `${label} ne doit pas dépasser ${requiredLength} caractères.`;
  }
  if (control.hasError('pattern')) return `${label} n'est pas au bon format.`;
  return null;
}
