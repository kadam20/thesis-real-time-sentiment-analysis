import { Component, input } from '@angular/core';

@Component({
  selector: 'app-map-tooltip',
  imports: [],
  templateUrl: './map-tooltip.component.html',
  styleUrl: './map-tooltip.component.scss'
})
export class MapTooltipComponent {
  tooltipData = input<any>();
}
