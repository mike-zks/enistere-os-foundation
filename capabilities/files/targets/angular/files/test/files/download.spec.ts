import { isSafeDownloadUrl, triggerDownload } from '../download';

describe('Files signed download', () => {
  // FILES-CLIENT-004
  it('n’utilise que l’URL signée serveur et refuse les schémas dangereux', () => {
    expect(isSafeDownloadUrl('https://storage.example.test/signed?token=secret')).toBeTrue();
    expect(isSafeDownloadUrl('http://localhost:9000/signed', true)).toBeTrue();
    expect(isSafeDownloadUrl('http://storage.example.test/signed')).toBeFalse();
    expect(isSafeDownloadUrl('javascript:alert(1)')).toBeFalse();
    expect(isSafeDownloadUrl('/files/constructed')).toBeFalse();
  });

  // FILES-CLIENT-001, FILES-CLIENT-004
  it('consomme l’URL avec une ancre temporaire puis ne laisse aucune référence dans le document', () => {
    const click = spyOn(HTMLAnchorElement.prototype, 'click');
    const before = document.querySelectorAll('a').length;
    expect(triggerDownload('https://storage.example.test/signed?token=secret')).toBeTrue();
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('a').length).toBe(before);
  });

  it('ne crée aucune ancre pour une URL refusée', () => {
    const click = spyOn(HTMLAnchorElement.prototype, 'click');
    expect(triggerDownload('data:text/plain,secret')).toBeFalse();
    expect(click).not.toHaveBeenCalled();
  });
});
