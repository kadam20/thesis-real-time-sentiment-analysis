import {
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { DataService } from '../../services/data.service';
import { firstValueFrom, take } from 'rxjs';
import { TimelineData } from '../../models/timeline.model';
import { LayoutService } from '../../services/layout.service';
import { SocketService } from '../../services/socket.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Tweet } from '../../models/tweet.model';
import { CardComponent } from '../_layout/card/card.component';
import { IconEnum } from '../../enums/icon.enum';

@Component({
  selector: 'app-time-tracker',
  standalone: true,
  imports: [ChartModule, CardComponent],
  templateUrl: './time-tracker.component.html',
  styleUrl: './time-tracker.component.scss',
})
export class TimeTrackerComponent {
  private readonly _destroyRef = inject(DestroyRef);
  private dataService = inject(DataService);
  private layoutService = inject(LayoutService);
  private socketService = inject(SocketService);
  platformId = inject(PLATFORM_ID);
  chartData = signal<TimelineData[]>([]);
  iconEnum = IconEnum;

  loading = computed(() => {
    return this.chartData().length === 0;
  });

  timelineChart = computed(() => {
    if (this.chartData().length === 0) return {data: {}, options: {}};
    return {
      data: this.createTimelineChart(this.chartData()),
      options: this.createTimelineOptions()
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

  constructor(private cd: ChangeDetectorRef) {}

  async ngOnInit() {
    this.chartData.set(
      await firstValueFrom(this.dataService.getTimelineData())
    );

    console.log(this.chartData());
    
    // Listening for new tweets
    this.socketService.tweets$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((tweet) => {
        this.handleNewTweet(tweet!)
      });
  }

  private handleNewTweet(tweet: Tweet){
    const newChartData = [...this.chartData()];
    const lastItem = newChartData[newChartData.length - 1];
    lastItem.biden_avg_sentiment ? lastItem.biden_avg_sentiment = tweet.sentiment_score : 0;
    lastItem.biden_avg_sentiment = (lastItem.biden_avg_sentiment + tweet.sentiment_score) / 2;
    lastItem.trump_avg_sentiment = (lastItem.trump_avg_sentiment + tweet.sentiment_score) / 2;
    this.chartData.set(newChartData);
    this.cd.detectChanges
  }

  private calculateChange(candidate: 'trump' | 'biden' | 'total') {
    console.log('candidate:', `${candidate}_avg_sentiment`);
    const first = this.chartData()[0][`${candidate}_avg_sentiment`];
    const last =
      this.chartData()[this.chartData().length - 1][
        `${candidate}_avg_sentiment`
      ];

    return Math.round((last / first) * 100);
  }

  /**
   * Fills the chart with the new tweet data.
   * @param {TimelineData[]} timelineData Data for the new tweet.
   */
  private createTimelineChart(timelineData: TimelineData[]) {
      return  {
        labels: timelineData.map((item: TimelineData) => item.month_name),
        datasets: [
          {
            label: 'Trump',
            data: timelineData.map((item: TimelineData) => item.trump_avg_sentiment),
            fill: false,
            borderColor: this.layoutService.colorStyles.red,
            tension: 0.4,
          },
          {
            label: 'Biden',
            data: timelineData.map((item: TimelineData) => item.biden_avg_sentiment),
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
