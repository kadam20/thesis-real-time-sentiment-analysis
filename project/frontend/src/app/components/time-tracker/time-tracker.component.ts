import { ChangeDetectorRef, Component, effect, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { isPlatformBrowser } from '@angular/common';


@Component({
  selector: 'app-time-tracker',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './time-tracker.component.html',
  styleUrl: './time-tracker.component.scss'
})
export class TimeTrackerComponent {
  data: any;

  options: any;

  platformId = inject(PLATFORM_ID);



  constructor(private cd: ChangeDetectorRef) {}


  ngOnInit() {
      this.initChart();
      // TODO subscribe to change of the theme and reinit chart
  }

  initChart() {
      if (isPlatformBrowser(this.platformId)) {
          const documentStyle = getComputedStyle(document.documentElement);
          const textColor = documentStyle.getPropertyValue('--p-primary-500');
          const textColorSecondary = documentStyle.getPropertyValue('--p-primary-500');
          const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

          this.data = {
              labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
              datasets: [
                  {
                      label: 'First Dataset',
                      data: [65, 59, 80, 81, 56, 55, 40],
                      fill: false,
                      borderColor: documentStyle.getPropertyValue('--p-primary-red'),
                      tension: 0.4
                  },
                  {
                      label: 'Second Dataset',
                      data: [28, 48, 40, 19, 86, 27, 90],
                      fill: false,
                      borderColor: documentStyle.getPropertyValue('--p-primary-blue'),
                      tension: 0.4
                  }
              ]
          };

          this.options = {
              maintainAspectRatio: false,
              aspectRatio: 0.6,
              plugins: {
                  legend: {
                      labels: {
                          color: documentStyle.getPropertyValue('--p-primary-400')
                      }
                  }
              },
              scales: {
                  x: {
                      ticks: {
                          color: textColorSecondary
                      },
                     
                  },
                  y: {
                      ticks: {
                          color: textColorSecondary
                      },
                    
                  }
              }
          };
          this.cd.markForCheck()
      }
  }
}
