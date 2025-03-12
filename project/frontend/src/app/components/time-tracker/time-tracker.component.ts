import {
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { isPlatformBrowser } from '@angular/common';
import { DataService } from '../../services/data.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-time-tracker',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './time-tracker.component.html',
  styleUrl: './time-tracker.component.scss',
})
export class TimeTrackerComponent {
  data: any;

  options: any;

  platformId = inject(PLATFORM_ID);

  chartData = signal<any[]>([]);

  dataService = inject(DataService);

  changeTracker = computed(() => {
    if (this.chartData().length === 0) return {
        trumpChange: 0,
        bidenChange: 0,
        totalChange: 0,
    };
    return {
      trumpChange: this.calculateChange('trump'),
      bidenChange: this.calculateChange('biden'),
      totalChange: this.calculateChange('total'),
    };
  });

  constructor(private cd: ChangeDetectorRef) {}

  async ngOnInit() {
    this.chartData.set(
      await firstValueFrom(this.dataService.getTimelineData())
    );
    this.initChart();
    console.log('mam', this.chartData());
    // TODO subscribe to change of the theme and reinit chart
  }

  calculateChange(candidate: string) {
    console.log('candidate:', `${candidate}_avg_sentiment`);
    const first = this.chartData()[0][`${candidate}_avg_sentiment`];
    const last =
      this.chartData()[this.chartData().length - 1][
        `${candidate}_avg_sentiment`
      ];

    return Math.round((last / first) * 100);
  }

  initChart() {
    if (isPlatformBrowser(this.platformId)) {
      const documentStyle = getComputedStyle(document.documentElement);
      const textColor = documentStyle.getPropertyValue('--p-primary-500');
      const textColorSecondary =
        documentStyle.getPropertyValue('--p-primary-500');
      const surfaceBorder = documentStyle.getPropertyValue(
        '--p-content-border-color'
      );

      this.data = {
        labels: this.chartData().map((item: any) => item.month_name),
        datasets: [
          {
            label: 'Trump',
            data: this.chartData().map((item: any) => item.trump_avg_sentiment),
            fill: false,
            borderColor: documentStyle.getPropertyValue('--p-primary-red'),
            tension: 0.4,
          },
          {
            label: 'Biden',
            data: this.chartData().map((item: any) => item.biden_avg_sentiment),
            fill: false,
            borderColor: documentStyle.getPropertyValue('--p-primary-blue'),
            tension: 0.4,
          },
        ],
      };

      this.options = {
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        plugins: {
          legend: {
            labels: {
              //   color: documentStyle.getPropertyValue('--p-primary-400')
            },
          },
        },
        scales: {
          x: {
            ticks: {
              //   color: textColorSecondary
            },
          },
          y: {
            min: -1, // Set the minimum value to -1
            max: 1, // Set the maximum value to 1
            ticks: {
              // color: textColorSecondary
            },
          },
        },
      };
      this.cd.markForCheck();
    }
  }
}
