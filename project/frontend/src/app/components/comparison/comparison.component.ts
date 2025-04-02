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
  private readonly colors = inject(LayoutService).colorStyles;
  private readonly _destroyRef = inject(DestroyRef);
  private dataService = inject(DataService);
  private socketService = inject(SocketService);
  private utilsService = inject(UtilsService);

  numberPipe = inject(FormatNumberPipe);

  @ViewChild('tweetPieChart') tweetPieChart!: any;
  @ViewChild('sentimentPieChart') sentimentPieChart!: any;
  @ViewChild('binChart') binChart!: any;

  comparisonData = signal<ComparisonData>({
    all_likes: 0,
    all_retweets: 0,
    avg_sentiment: 0,
    total_tweets: 0,
  });
  animation = signal<boolean>(true);
  tweetPieConfig = signal<any>(null);
  sentimentPieConfig = signal<any>(null);
  binChartConfig = signal<any>(null);
  loading = computed(() => false);

  async ngOnInit(): Promise<void> {
    // Fetching data
    const [bins, values] = await Promise.all([
      firstValueFrom(this.dataService.getSentimentBins()),
      firstValueFrom(this.dataService.getTotalData()),
    ]);

    this.setupCharts(bins, values);

    // Listening for new tweets
    this.socketService.tweets$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((tweet) => {
        this.handleNewTweet(tweet as Tweet);
      });

    this.stopAnimation();
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

    this.utilsService.updatePieCharts(
      tweet,
      this.tweetPieChart,
      this.sentimentPieChart
    );
    this.utilsService.updateBinChart(tweet, this.binChart);

    // Animate new tweet effect
    this.animation.set(true);
    this.stopAnimation();
  }

  /**
   * Sets up the chart data with the provided values.
   * @param {SentimentBins} bins Sentiment bins data.
   * @param {ComparisonData} values Comparison data.
   */
  private setupCharts(bins: SentimentBins, values: ComparisonData) {
    // Setting values for the cards
    this.comparisonData.set(values);

    // Setting up the tweet pie
    this.tweetPieConfig.set(
      this.utilsService.createPieChart(
        [values.total_trump!, values.total_biden!],
        [this.colors.red, this.colors.blue]
      )
    );

    // Setting up the sentiment pie
    this.sentimentPieConfig.set(
      this.utilsService.createPieChart(
        [values.total_positive!, values.total_negative!],
        [this.colors.orange, this.colors.green]
      )
    );

    // Setting up the bin chart
    this.binChartConfig.set(
      this.utilsService.createBinData(bins, this.colors.red, this.colors.blue)
    );
  }

  /**
   * Animate the new tweet effect.
   */
  stopAnimation() {
    setTimeout(() => {
      this.animation.set(false);
    }, 200);
  }
}
