import { sanitizeReturnUrl } from './return-url.utils';

describe('sanitizeReturnUrl', () => {
  it('returns /dashboard for null', () => {
    expect(sanitizeReturnUrl(null)).toBe('/dashboard');
  });

  it('returns /dashboard for undefined', () => {
    expect(sanitizeReturnUrl(undefined)).toBe('/dashboard');
  });

  it('returns /dashboard for empty string', () => {
    expect(sanitizeReturnUrl('')).toBe('/dashboard');
  });

  it('returns /dashboard for external URL (https)', () => {
    expect(sanitizeReturnUrl('https://evil.com')).toBe('/dashboard');
  });

  it('returns /dashboard for external URL (http)', () => {
    expect(sanitizeReturnUrl('http://evil.com')).toBe('/dashboard');
  });

  it('returns /dashboard for protocol-relative URL //', () => {
    expect(sanitizeReturnUrl('//evil.com')).toBe('/dashboard');
  });

  it('returns /dashboard for encoded protocol-relative /%2F', () => {
    expect(sanitizeReturnUrl('/%2Fevil.com')).toBe('/dashboard');
  });

  it('returns /dashboard for encoded protocol-relative /%2f (lowercase)', () => {
    expect(sanitizeReturnUrl('/%2fevil.com')).toBe('/dashboard');
  });

  it('accepts /dashboard', () => {
    expect(sanitizeReturnUrl('/dashboard')).toBe('/dashboard');
  });

  it('accepts /dashboard/projects', () => {
    expect(sanitizeReturnUrl('/dashboard/projects')).toBe('/dashboard/projects');
  });

  it('accepts /settings?tab=profile', () => {
    expect(sanitizeReturnUrl('/settings?tab=profile')).toBe('/settings?tab=profile');
  });

  it('accepts /admin/users/42', () => {
    expect(sanitizeReturnUrl('/admin/users/42')).toBe('/admin/users/42');
  });
});
