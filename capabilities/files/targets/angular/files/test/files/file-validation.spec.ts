import { isUuid, validateUpload } from '../file-validation';

describe('Files validation', () => {
  // FILES-CLIENT-002
  it('valide forme, catégorie et type déclaré avant tout upload', () => {
    const pdf = new File(['pdf'], 'report.pdf', { type: 'application/pdf' });
    expect(validateUpload(null, 'DOCUMENT', '').valid).toBeFalse();
    expect(validateUpload(pdf, '', '').valid).toBeFalse();
    expect(validateUpload(pdf, 'IMAGE', '').valid).toBeFalse();
    expect(validateUpload(pdf, 'DOCUMENT', 'x'.repeat(129)).valid).toBeFalse();
    expect(validateUpload(pdf, 'DOCUMENT', 'invoice-42').valid).toBeTrue();
  });

  // FILES-CLIENT-005
  it('refuse toute action portant un identifiant non UUID', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBeTrue();
    expect(isUuid('../storage/object')).toBeFalse();
    expect(isUuid('not-an-id')).toBeFalse();
  });
});
