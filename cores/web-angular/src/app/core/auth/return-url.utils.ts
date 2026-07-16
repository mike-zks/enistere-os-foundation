const DEFAULT_POST_LOGIN = '/dashboard';

export function sanitizeReturnUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') {
    return DEFAULT_POST_LOGIN;
  }
  const trimmed = url.trim();
  // Must start with / and not with // (protocol-relative)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return DEFAULT_POST_LOGIN;
  }
  // Reject /%2F... encoded protocol-relative variants
  if (/^\/%2[fF]/.test(trimmed)) {
    return DEFAULT_POST_LOGIN;
  }
  return trimmed;
}
