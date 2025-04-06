import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
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
import { UtilsService } from '../../services/utils.service';

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
  private utilService = inject(UtilsService);
  private colors = inject(LayoutService).colorStyles;
  private socketService = inject(SocketService);
  @ViewChild('timelineChart') timelineChart!: any;
  chartData = signal<TimelineData[]>([]);
  animation = signal<boolean>(true);
  iconEnum = IconEnum;

  timelineChartConfig = signal<any>({
    data: null,
    options: {
      maintainAspectRatio: false,
      aspectRatio: 0.55,
    },
  });

  loading = computed(() => {
    return this.chartData().length === 0;
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

    // Setting up the chart
    this.timelineChartConfig().data = this.utilService.createTimelineChart(
      this.chartData(),
      this.colors.red,
      this.colors.blue
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
    if (!tweet) return;

    // Update the component data
    this.chartData.set(
      this.utilService.handleTimeNewTweet(tweet, this.chartData())
    );

    // Update the chart
    this.utilService.updateTimelineChart(tweet, this.timelineChart);

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

    console.log('cchartData', this.chartData());
    console.log('first', first);
    console.log('last', last);

    return Math.round(last / first - 1);
  }
}
