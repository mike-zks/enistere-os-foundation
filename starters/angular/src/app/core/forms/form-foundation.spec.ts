import { required, validateForm } from './form-foundation';

describe('form foundation', () => {
  it('validates typed fields without owning business rules', () => {
    const errors = validateForm(
      { email: ' ', count: 2 },
      { email: required('Email'), count: (value) => value > 0 ? null : 'invalide' },
    );
    expect(errors).toEqual({ email: 'Email est requis' });
  });
});
