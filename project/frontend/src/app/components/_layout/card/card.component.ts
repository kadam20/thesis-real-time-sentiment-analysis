import { Component, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';


@Component({
  selector: 'app-card',
  standalone: true,
  imports: [TagModule, SkeletonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  loading = input.required<boolean>();
}
