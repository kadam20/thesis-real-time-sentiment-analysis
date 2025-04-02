import {
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { firstValueFrom } from 'rxjs';
import { DataService } from '../../services/data.service';
import { SocketService } from '../../services/socket.service';
import { UtilsService } from '../../services/utils.service';
import { Tweet } from '../../models/tweet.model';
import { ComparisonData, SentimentBins } from '../../models/comparison.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LayoutService } from '../../services/layout.service';
import { CardComponent } from '../_layout/card/card.component';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [ChartModule, CardComponent],
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.scss'],
  animations: [
    trigger('highlight', [
      state(
        'normal',
        style({
          opacity: 1,
        })
      ),
      state(
        'newTweet',
        style({
          opacity: 0.4,
          transform: 'scaleY(0.8)',
        })
      ),
      transition('normal => newTweet', [animate('0.2s')]),
      transition('newTweet => normal', [animate('0.2s')]),
    ]),
  ],
  providers: [FormatNumberPipe],
})
export class ComparisonComponent implements OnInit {
  private readonly _destroyRef = inject(DestroyRef);
  private dataService = inject(DataService);
  private socketService = inject(SocketService);
  private utilsService = inject(UtilsService);
  private layoutService = inject(LayoutService);
  numberPipe = inject(FormatNumberPipe);
  @ViewChild('tweetPieChart') tweetPieChart!: any;
  @ViewChild('sentimentPieChart') sentimentPieChart!: any;
  @ViewChild('binChart') binChart!: any;

  animation = signal<boolean>(true);
  comparisonData = signal<ComparisonData>({
    all_likes: 0,
    all_retweets: 0,
    avg_sentiment: 0,
    total_tweets: 0,
    total_biden: 0,
    total_trump: 0,
    total_positive: 0,
    total_negative: 0,
  });
  tweetPieConfig = signal<any>(null);
  sentimentPieConfig = signal<any>(null);
  binChartConfig = signal<any>(null);

  loading = computed(() => !this.comparisonData());

  async ngOnInit(): Promise<void> {
    // Fetching data
    const [bins, values] = await Promise.all([
      firstValueFrom(this.dataService.getSentimentBins()),
      firstValueFrom(this.dataService.getTotalData()),
    ]);

    this.comparisonData.set(values);
    this.createPieData(values);
    this.createBinData(bins);

    // Listening for new tweets
    this.socketService.tweets$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((tweet) => {
        this.handleNewTweet(tweet as Tweet);
      });

    setTimeout(() => {
      this.animation.set(false);
    }, 200);
  }

  /**
   * Handles new tweet data and updates the chart data.
   * @param {Tweet} tweet Data for the new tweet.
   */
  private handleNewTweet(tweet?: Tweet) {
    if (!tweet) return;
    this.comparisonData.update((prev) =>
      this.utilsService.handleNewTweet(prev!, tweet)
    );
    this.updatePieCharts(tweet!);
    this.updateBinChart(tweet!);

    // Animate new tweet effect
    this.animation.set(true);
    setTimeout(() => {
      this.animation.set(false);
    }, 500);
  }

  /**
   * Creates pie chart data for displaying tweet or sentiment data.
   * @param {ComparisonData} values Values for the charts.
   */
  private createPieData(values: ComparisonData) {
    this.tweetPieConfig.set({
      datasets: [
        {
          data: [values.total_trump, values.total_biden],
          backgroundColor: [
            this.layoutService.colorStyles.red,
            this.layoutService.colorStyles.blue,
          ],
        },
      ],
    });

    this.sentimentPieConfig.set({
      datasets: [
        {
          data: [values.total_positive, values.total_negative],
          backgroundColor: [
            this.layoutService.colorStyles.orange,
            this.layoutService.colorStyles.green,
          ],
        },
      ],
    });
  }

  updatePieCharts(tweet: Tweet) {
    // Update the chart data
    if (tweet.candidate !== 'trump')
      this.tweetPieChart.data.datasets[0].data[0] += 1;
    if (tweet.candidate !== 'biden')
      this.tweetPieChart.data.datasets[0].data[1] += 1;
    if (tweet.sentiment_score <= 0)
      this.sentimentPieChart.data.datasets[0].data[0] += 1;
    if (tweet.sentiment_score > 0)
      this.sentimentPieChart.data.datasets[0].data[1] += 1;

    this.tweetPieChart.chart.update();
    this.sentimentPieChart.chart.update();
  }

  updateBinChart(tweet: Tweet) {
    // Update the chart data
    switch (true) {
      case tweet.sentiment_score <= -0.3:
        if (tweet.candidate !== 'biden')
          this.binChart.chart.data.datasets[0].data[0] += 1;
        if (tweet.candidate !== 'trump')
          this.binChart.chart.data.datasets[0].data[1] += 1;
        break;
      case tweet.sentiment_score <= 0.3 && tweet.sentiment_score > -0.3:
        if (tweet.candidate !== 'biden')
          this.binChart.chart.data.datasets[0].data[2] += 1;
        if (tweet.candidate !== 'trump')
          this.binChart.chart.data.datasets[0].data[3] += 1;
        break;
      case tweet.sentiment_score > 0.3:
        if (tweet.candidate !== 'biden')
          this.binChart.chart.data.datasets[0].data[4] += 1;
        if (tweet.candidate !== 'trump')
          this.binChart.chart.data.datasets[0].data[5] += 1;
        break;
    }
    this.binChart.chart.update();
  }

  /**
   * Creates bin chart data, used for displaying sentiment bins.
   * @param {SentimentBins} bins The sentiment bins data.
   */
  private createBinData(bins: SentimentBins) {
    const labels = Object.keys(bins);
    const data = Object.values(bins);
    this.binChartConfig.set({
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: Array.from({ length: 6 }, (_, i) =>
            i % 2 === 0
              ? this.layoutService.colorStyles.red
              : this.layoutService.colorStyles.blue
          ),
          borderColor: ['#fff'],
          borderWidth: 2,
        },
      ],
    });
  }
}
