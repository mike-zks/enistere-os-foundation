/** A signed URL is consumed immediately and never retained by this module. */
export function isSafeDownloadUrl(value: string, allowInsecure = false): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || (allowInsecure && parsed.protocol === 'http:');
  } catch {
    return false;
  }
}

export function triggerDownload(value: string, allowInsecure = false): boolean {
  if (!isSafeDownloadUrl(value, allowInsecure)) return false;
  const anchor = document.createElement('a');
  anchor.href = value;
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return true;
}

export function currentContextAllowsInsecure(): boolean {
  return window.location.protocol === 'http:';
}
