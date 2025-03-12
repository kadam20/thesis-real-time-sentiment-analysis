import { Component, OnInit, inject, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { firstValueFrom } from 'rxjs';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './comparison.component.html',
  styleUrl: './comparison.component.scss',
})
export class ComparisonComponent implements OnInit {
  dataService = inject(DataService);
  documentStyle = getComputedStyle(document.documentElement);
  blue = this.documentStyle.getPropertyValue('--p-primary-blue');
  red = this.documentStyle.getPropertyValue('--p-primary-red');
  orange = this.documentStyle.getPropertyValue('--p-primary-orange');
  green = this.documentStyle.getPropertyValue('--p-primary-green');
  comparisonData = signal<any>(null);
  tweetData = signal<any>(null);
  sentimentData = signal<any>(null);
  binData = signal<any>(null);

  tweetPie = signal({
    datasets: [
      {
        data: [0, 0],
        backgroundColor: [this.red, this.blue],
      },
    ],
  });

  sentimentPie = signal({
    datasets: [
      {
        data: [0, 0],
        backgroundColor: [this.orange, this.green],
      },
    ],
  });

  dataBins = signal({
    labels: [1, 2, 3, 4, 5, 6],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: Array.from({ length: 6 }, (_, i) =>
          i % 2 === 0 ? this.red : this.blue
        ),
        borderColor: ['#fff'],
        borderWidth: 2,
      },
    ],
  });

  async ngOnInit(): Promise<void> {
    const [bins, values] = await Promise.all([
      firstValueFrom(this.dataService.getSentimentBins()),
      firstValueFrom(this.dataService.getTotalData()),
    ]);

    this.comparisonData.set({
      bins,
      values,
    });

    this.configTotalData();
    this.configSentimentData();
    this.configBinData(bins);
    console.log('comparisonData', this.comparisonData());
  }

  configTotalData() {
    this.tweetPie.update((prev) => ({
      ...prev,
      datasets: prev.datasets.map((dataset, index) =>
        index === 0
          ? {
              ...dataset,
              data: [
                this.comparisonData().values.total_trump,
                this.comparisonData().values.total_biden,
              ],
            }
          : dataset
      ),
    }));
  }

  configSentimentData() {
    this.sentimentPie.update((prev) => ({
      ...prev,
      datasets: prev.datasets.map((dataset, index) =>
        index === 0
          ? {
              ...dataset,
              data: [
                this.comparisonData().values.total_positive,
                this.comparisonData().values.total_negative,
              ],
            }
          : dataset
      ),
    }));
  }

  configBinData(bins: any) {
    const data = Object.values(bins) as number[];

    this.dataBins.update((prev) => ({
      ...prev,
      datasets: prev.datasets.map((dataset) => ({
        ...dataset,
        data: data,
      })),
    }));
  }
}
