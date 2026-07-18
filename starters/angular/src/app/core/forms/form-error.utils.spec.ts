import { FormControl, Validators } from '@angular/forms';
import { getFieldError } from './form-error.utils';

describe('getFieldError', () => {
  it('returns null when control has no errors', () => {
    const ctrl = new FormControl('user@example.com', Validators.email);
    expect(getFieldError(ctrl, 'Email')).toBeNull();
  });

  it('returns null when control has no validators', () => {
    const ctrl = new FormControl('anything');
    expect(getFieldError(ctrl, 'Champ')).toBeNull();
  });

  it('returns required message', () => {
    const ctrl = new FormControl('', Validators.required);
    expect(getFieldError(ctrl, 'Nom')).toBe('Nom est obligatoire.');
  });

  it('returns email message for invalid email', () => {
    const ctrl = new FormControl('not-an-email', Validators.email);
    expect(getFieldError(ctrl, 'Adresse e-mail')).toBe("Adresse e-mail n'est pas valide.");
  });

  it('returns minlength message with required count', () => {
    const ctrl = new FormControl('short', Validators.minLength(8));
    expect(getFieldError(ctrl, 'Mot de passe')).toBe('Mot de passe doit contenir au moins 8 caractères.');
  });

  it('returns maxlength message with required count', () => {
    const ctrl = new FormControl('too-long-value', Validators.maxLength(5));
    expect(getFieldError(ctrl, 'Champ')).toBe('Champ ne doit pas dépasser 5 caractères.');
  });

  it('returns pattern message', () => {
    const ctrl = new FormControl('ABC', Validators.pattern(/^[0-9]+$/));
    expect(getFieldError(ctrl, 'Code')).toBe("Code n'est pas au bon format.");
  });

  it('prioritizes required over email when both could match', () => {
    const ctrl = new FormControl('', [Validators.required, Validators.email]);
    expect(getFieldError(ctrl, 'Email')).toBe('Email est obligatoire.');
  });

  it('uses the provided label in the message', () => {
    const ctrl = new FormControl('', Validators.required);
    const msg = getFieldError(ctrl, 'Prénom');
    expect(msg).toContain('Prénom');
  });
});
