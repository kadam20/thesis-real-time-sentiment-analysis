import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { firstValueFrom } from 'rxjs';
import { DataService } from '../../services/data.service';
import { SocketService } from '../../services/socket.service';
import { UtilsService } from '../../services/utils.service';
import { Tweet } from '../../models/tweet.model';
import { ComparisonData, SentimentBins } from '../../models/comparison.model';

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.scss'],
})
export class ComparisonComponent implements OnInit {
  dataService = inject(DataService);
  socketService = inject(SocketService);
  utilsService = inject(UtilsService);

  private get colorStyles() {
    const documentStyle = getComputedStyle(document.documentElement);
    return {
      blue: documentStyle.getPropertyValue('--p-primary-blue'),
      red: documentStyle.getPropertyValue('--p-primary-red'),
      orange: documentStyle.getPropertyValue('--p-primary-orange'),
      green: documentStyle.getPropertyValue('--p-primary-green'),
    };
  }

  comparisonData = signal<ComparisonData>({
    tweetValues: null,
    sentimentBins: null,
  });

  tweetPie = computed(() => {
    if (!this.comparisonData().tweetValues) return null;
    const values = this.comparisonData().tweetValues;
    return this.createPieData(
      [values!.total_trump, values!.total_biden],
      [this.colorStyles.red, this.colorStyles.blue]
    );
  });

  sentimentPie = computed(() => {
    if (!this.comparisonData().tweetValues) return null;
    const values = this.comparisonData().tweetValues;
    return this.createPieData(
      [values!.total_positive, values!.total_negative],
      [this.colorStyles.orange, this.colorStyles.green]
    );
  });

  sentimentBins = computed(() => {
    if (!this.comparisonData().sentimentBins) return null;
    const values = this.comparisonData().sentimentBins;
    return this.createBinData(values!);
  });

  async ngOnInit(): Promise<void> {
    // Fetching data
    const [bins, values] = await Promise.all([
      firstValueFrom(this.dataService.getSentimentBins()),
      firstValueFrom(this.dataService.getTotalData()),
    ]);

    this.comparisonData.set({
      sentimentBins: bins,
      tweetValues: values,
    });

    // Listening for new tweets
    this.socketService.tweets$.subscribe((tweet) => {
      this.handleNewTweet(tweet);
    });
  }

  /**
   * Handles new tweet data and updates the chart data.
   * @param {Tweet} tweet Data for the new tweet.
   */
  handleNewTweet(tweet?: Tweet) {
    if(!tweet ) return;
    this.comparisonData.update((prev) =>
      this.utilsService.handleNewTweet(prev, tweet)
    );
    // this.updateChartData();
  }

  /**
   * Creates pie chart data for displaying tweet or sentiment data.
   * @param {number[]} data The data array for the chart.
   * @param {string[]} colors The background color array for the chart.
   */
  private createPieData(data: number[], colors: string[]) {
    return {
      datasets: [
        {
          data,
          backgroundColor: colors,
        },
      ],
    };
  }

  /**
   * Creates bin chart data, used for displaying sentiment bins.
   */
  private createBinData(bins: SentimentBins) {
    const labels = Object.keys(bins);
    const data = Object.values(bins);
    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: Array.from({ length: 6 }, (_, i) =>
            i % 2 === 0 ? this.colorStyles.red : this.colorStyles.blue
          ),
          borderColor: ['#fff'],
          borderWidth: 2,
        },
      ],
    };
  }

//   /**
//    * Updates the chart data for all three charts: tweet data, sentiment data, and sentiment bins.
//    */
//   private updateChartData() {
//     this.updateTweetData();
//     this.updateSentimentData();
//     this.updateBinData();
//   }

//   /**
//    * Updates the tweet data chart with the latest values.
//    * This updates the data for Trump and Biden total tweet counts.
//    */
//   private updateTweetData() {
//     this.comparisonData.update((prev) => ({
//       ...prev,
//       tweetPie: this.createPieData(
//         [prev.tweetValues!.total_trump, prev.tweetValues!.total_biden],
//         [this.colorStyles.red, this.colorStyles.blue]
//       ),
//     }));
//   }

//   /**
//    * Updates the sentiment data chart with the latest positive and negative sentiment counts.
//    */
//   private updateSentimentData() {
//     this.comparisonData.update((prev) => ({
//       ...prev,
//       sentimentPie: this.createPieData(
//         [prev.tweetValues!.total_positive, prev.tweetValues!.total_negative],
//         [this.colorStyles.orange, this.colorStyles.green]
//       ),
//     }));
//   }

//   /**
//    * Updates the sentiment bin chart with the latest bin values.
//    */
//   private updateBinData() {
//     this.comparisonData.update(prev => ({
//       ...prev,
//       dataBins: this.createBinData(),
//     }));
//   }
}
