import { InMemoryCredentialStore } from '../credential-store';

describe('InMemoryCredentialStore', () => {
  // AUTH-CLIENT-002
  it('conserve, remplace et efface la créance', () => {
    const store = new InMemoryCredentialStore();
    expect(store.read()).toBeNull();

    store.write('refresh-1');
    expect(store.read()).toBe('refresh-1');

    store.write('refresh-2');
    expect(store.read()).toBe('refresh-2');

    store.clear();
    expect(store.read()).toBeNull();
  });

  // AUTH-CLIENT-002 : le défaut ne doit rien laisser derrière lui.
  it('n’écrit dans aucun stockage du navigateur', () => {
    const store = new InMemoryCredentialStore();
    store.write('refresh-1');

    expect(Object.keys(localStorage)).toEqual([]);
    expect(Object.keys(sessionStorage)).toEqual([]);
    expect(document.cookie).toBe('');
  });
});
