import { Component, inject, input } from '@angular/core';
import { FormatNumberPipe } from '../../../pipes/format-number.pipe';
import { StateProperty } from '../../../models/state.model';

@Component({
  selector: 'app-map-tooltip',
  imports: [],
  templateUrl: './map-tooltip.component.html',
  styleUrl: './map-tooltip.component.scss',
  providers: [FormatNumberPipe],
})
export class MapTooltipComponent {
  numberPipe = inject(FormatNumberPipe);
  tooltipData = input<Partial<StateProperty>>();
}
