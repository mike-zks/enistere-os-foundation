import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { AuthorizationService } from './authorization.service';

/** Vue technique du résumé ; aucune administration ni décision d’accès locale. */
@Component({
  selector: 'app-authorization',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <h1>Autorisations</h1>
      @switch (authorization.state().status) {
        @case ('loading') { <p>Chargement…</p> }
        @case ('ready') {
          <p>{{ authorization.roles().length }} rôle(s)</p>
          <p>{{ authorization.permissions().length }} permission(s)</p>
        }
        @case ('error') { <p role="alert">Autorisations indisponibles.</p> }
        @default { <p>Session authentifiée requise.</p> }
      }
    </main>
  `,
})
export class AuthorizationComponent implements OnInit {
  readonly authorization = inject(AuthorizationService);

  ngOnInit(): void {
    void this.authorization.load();
  }
}
