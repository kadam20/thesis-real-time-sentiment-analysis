import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { DataService } from '../../services/data.service';
import { firstValueFrom } from 'rxjs';
import { TimelineData } from '../../models/timeline.model';
import { LayoutService } from '../../services/layout.service';
import { SocketService } from '../../services/socket.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Tweet } from '../../models/tweet.model';
import { CardComponent } from '../_layout/card/card.component';
import { IconEnum } from '../../enums/icon.enum';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

@Component({
  selector: 'app-time-tracker',
  standalone: true,
  imports: [ChartModule, CardComponent],
  templateUrl: './time-tracker.component.html',
  styleUrl: './time-tracker.component.scss',
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
})
export class TimeTrackerComponent {
  private readonly _destroyRef = inject(DestroyRef);
  private dataService = inject(DataService);
  private layoutService = inject(LayoutService);
  private socketService = inject(SocketService);
  chartData = signal<TimelineData[]>([]);
  animation = signal<boolean>(true);
  iconEnum = IconEnum;

  loading = computed(() => {
    return this.chartData().length === 0;
  });

  timelineChart = computed(() => {
    if (this.chartData().length === 0) return { data: {}, options: {} };
    return {
      data: this.createTimelineChart(this.chartData()),
      options: this.createTimelineOptions(),
    };
  });

  changeTracker = computed(() => {
    if (this.chartData().length === 0)
      return {
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

  async ngOnInit() {
    // Fetching initial data
    this.chartData.set(
      await firstValueFrom(this.dataService.getTimelineData())
    );

    // Listening for new tweets
    this.socketService.tweets$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((tweet) => {
        this.handleNewTweet(tweet!);
      });

    setTimeout(() => {
      this.animation.set(false);
    }, 200);
  }

  /**
   * Updates chart values with the new tweet.
   * @param {Tweet[]} tweet New tweet.
   */
  private handleNewTweet(tweet: Tweet) {
    if(!tweet) return;
    const newChartData = [...this.chartData()];
    const lastItem = newChartData[newChartData.length - 1];

    const sentiment = tweet.sentiment_score;
    lastItem.total_sum_sentiment += sentiment;

    if (tweet.candidate !== 'trump') lastItem.biden_sum_sentiment += sentiment;
    if (tweet.candidate !== 'biden') lastItem.trump_sum_sentiment += sentiment;

    this.chartData.set(newChartData);

    // Animate new tweet effect
    this.animation.set(true);
    setTimeout(() => {
      this.animation.set(false);
    }, 500);
  }

  /**
   * Calculates the change in sentiment for a candidate.
   * @param {'trump' | 'biden' | 'total'} candidate Candidate to calculate change for.
   */
  private calculateChange(candidate: 'trump' | 'biden' | 'total') {
    const first = this.chartData()[0][`${candidate}_sum_sentiment`];
    const last =
      this.chartData()[this.chartData().length - 1][
        `${candidate}_sum_sentiment`
      ];

    return Math.round(last / first - 1);
  }

  /**
   * Fills the chart with the tweet data.
   * @param {TimelineData[]} timelineData Data for the tweets over time.
   */
  private createTimelineChart(timelineData: TimelineData[]) {
    return {
      labels: timelineData.map((item: TimelineData) => item.month_name),
      datasets: [
        {
          label: 'Trump',
          data: timelineData.map(
            (item: TimelineData) => item.trump_sum_sentiment
          ),
          fill: false,
          borderColor: this.layoutService.colorStyles.red,
          tension: 0.4,
        },
        {
          label: 'Biden',
          data: timelineData.map(
            (item: TimelineData) => item.biden_sum_sentiment
          ),
          fill: false,
          borderColor: this.layoutService.colorStyles.blue,
          tension: 0.4,
        },
      ],
    };
  }

  /**
   * Returns the options for the timeline chart.
   */
  private createTimelineOptions() {
    return {
      maintainAspectRatio: false,
      aspectRatio: 0.55,
    };
  }
}
