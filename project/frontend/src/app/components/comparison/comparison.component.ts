import {
  Component,
  DestroyRef,
  OnInit,
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

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [ChartModule, CardComponent],
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.scss'],
  providers: [FormatNumberPipe],
})
export class ComparisonComponent implements OnInit {
  private readonly _destroyRef = inject(DestroyRef);
  private dataService = inject(DataService);
  private socketService = inject(SocketService);
  private utilsService = inject(UtilsService);
  private layoutService = inject(LayoutService);
  
  numberPipe = inject(FormatNumberPipe);
  comparisonData = signal<ComparisonData>({
    tweetValues: null,
    sentimentBins: null,
  });

  loading = computed(() => {
    return !this.comparisonData().tweetValues || !this.comparisonData().sentimentBins;
  });

  tweetPie = computed(() => {
    if (!this.comparisonData().tweetValues) return null;
    const values = this.comparisonData().tweetValues;
    return this.createPieData(
      [values!.total_trump, values!.total_biden],
      [this.layoutService.colorStyles.red, this.layoutService.colorStyles.blue]
    );
  });

  sentimentPie = computed(() => {
    if (!this.comparisonData().tweetValues) return null;
    const values = this.comparisonData().tweetValues;
    return this.createPieData(
      [values!.total_positive, values!.total_negative],
      [
        this.layoutService.colorStyles.orange,
        this.layoutService.colorStyles.green,
      ]
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
    this.socketService.tweets$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((tweet) => {
        this.handleNewTweet(tweet as Tweet);
      });
  }

  /**
   * Handles new tweet data and updates the chart data.
   * @param {Tweet} tweet Data for the new tweet.
   */
  private handleNewTweet(tweet?: Tweet) {
    if (!tweet) return;
    this.comparisonData.update((prev) =>
      this.utilsService.handleNewTweet(prev, tweet)
    );
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
            i % 2 === 0
              ? this.layoutService.colorStyles.red
              : this.layoutService.colorStyles.blue
          ),
          borderColor: ['#fff'],
          borderWidth: 2,
        },
      ],
    };
  }
}
