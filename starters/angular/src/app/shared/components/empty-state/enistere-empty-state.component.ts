import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'enistere-empty-state',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './enistere-empty-state.component.html',
  styleUrl: './enistere-empty-state.component.scss',
})
export class EnistereEmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly actionLabel = input<string>();
  readonly actionClicked = output<void>();
}
