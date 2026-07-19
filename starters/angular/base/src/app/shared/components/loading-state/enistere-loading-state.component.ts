import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const DIAMETER: Record<'small' | 'medium' | 'large', number> = {
  small: 24,
  medium: 40,
  large: 64,
};

@Component({
  selector: 'enistere-loading-state',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './enistere-loading-state.component.html',
  styleUrl: './enistere-loading-state.component.scss',
})
export class EnistereLoadingStateComponent {
  readonly message = input<string>('Chargement en cours…');
  readonly size = input<'small' | 'medium' | 'large'>('medium');

  protected readonly diameterFor = DIAMETER;
}
