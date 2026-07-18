import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'enistere-success-state',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './enistere-success-state.component.html',
  styleUrl: './enistere-success-state.component.scss',
})
export class EnistereSuccessStateComponent {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly actionLabel = input<string>();
  readonly actionClicked = output<void>();
}
