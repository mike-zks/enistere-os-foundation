import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'enistere-error-state',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './enistere-error-state.component.html',
  styleUrl: './enistere-error-state.component.scss',
})
export class EnistereErrorStateComponent {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly retryLabel = input<string>();
  readonly retried = output<void>();
}
