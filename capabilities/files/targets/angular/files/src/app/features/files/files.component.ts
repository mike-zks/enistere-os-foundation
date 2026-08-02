import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FILE_CATEGORIES } from './files-models';
import { FilesService } from './files.service';
import { AuthorizationService } from '../authorization/authorization.service';

@Component({
  selector: 'app-files',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <h1>Fichiers</h1>
      @if (authorization.hasPermission('files.upload')) {
        <form (submit)="submit($event)">
          <label>Fichier <input type="file" (change)="selectFile($event)"></label>
          <label>Catégorie
            <select #category (change)="selectedCategory = category.value"><option value="">Choisir</option>
              @for (value of categories; track value) { <option [value]="value">{{ value }}</option> }
            </select>
          </label>
          <label>Référence <input #subject maxlength="128" (input)="subjectId = subject.value"></label>
          <button type="submit">Envoyer</button>
        </form>
      }

      @switch (files.state().status) {
        @case ('loading') { <p>Chargement…</p> }
        @case ('error') { <p role="alert">{{ errorMessage() }}</p> }
        @case ('ready') {
          <p>{{ files.state().page?.total }} fichier(s)</p>
          <ul>
            @for (file of files.state().page?.items ?? []; track file.id) {
              <li>
                <span>{{ file.originalName }} — {{ file.category }} — {{ file.size }} octets</span>
                @if (authorization.hasPermission('files.download')) {
                  <button type="button" (click)="download(file.id)">Télécharger</button>
                }
                @if (authorization.hasPermission('files.delete')) {
                  <button type="button" (click)="remove(file.id)">Supprimer</button>
                }
                @if (authorization.hasPermission('files.quarantine')) {
                  <button type="button" (click)="quarantine(file.id)">Quarantaine</button>
                }
                @if (authorization.hasPermission('files.restore')) {
                  <button type="button" (click)="restore(file.id)">Restaurer</button>
                }
              </li>
            } @empty { <li>Aucun fichier.</li> }
          </ul>
          @if (files.state().page?.nextOffset !== null) {
            <button type="button" (click)="next()">Page suivante</button>
          }
        }
        @default { <p>Session authentifiée requise.</p> }
      }
    </main>
  `,
})
export class FilesComponent implements OnInit {
  readonly files = inject(FilesService);
  readonly authorization = inject(AuthorizationService);
  readonly categories = FILE_CATEGORIES;
  selectedFile: File | null = null;
  selectedCategory = '';
  subjectId = '';

  ngOnInit(): void {
    void this.authorization.load();
    void this.files.load();
  }

  selectFile(event: Event): void {
    this.selectedFile = (event.target as HTMLInputElement).files?.item(0) ?? null;
  }

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    await this.files.upload(this.selectedFile, this.selectedCategory, this.subjectId);
    this.selectedFile = null;
  }

  next(): void {
    const offset = this.files.state().page?.nextOffset;
    if (offset !== null && offset !== undefined) void this.files.load(offset);
  }

  download(id: string): void { void this.files.download(id); }
  remove(id: string): void { void this.files.delete(id); }
  quarantine(id: string): void { void this.files.quarantine(id); }
  restore(id: string): void { void this.files.restore(id); }

  errorMessage(): string {
    const kind = this.files.state().error?.kind;
    if (kind === 'unauthorized') return 'Connexion requise.';
    if (kind === 'forbidden') return 'Accès refusé.';
    if (kind === 'unavailable') return 'Service momentanément indisponible.';
    return 'Les fichiers sont indisponibles.';
  }
}
