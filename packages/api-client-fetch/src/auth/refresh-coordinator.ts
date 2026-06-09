/**
 * Coordination « single-flight » : N appels concurrents partagent UNE seule exécution en vol.
 * Utilisé pour le refresh — deux 401 simultanés ne déclenchent qu'un seul `/auth/refresh`.
 */
export class SingleFlight<T> {
  private inFlight: Promise<T> | null = null;

  run(factory: () => Promise<T>): Promise<T> {
    this.inFlight ??= Promise.resolve()
      .then(factory)
      .finally(() => {
        this.inFlight = null;
      });
    return this.inFlight;
  }
}
