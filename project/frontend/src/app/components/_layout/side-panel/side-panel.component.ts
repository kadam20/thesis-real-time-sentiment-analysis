import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { TweetComponent } from '../tweet/tweet.component';
import { Subscription } from 'rxjs';
import { SocketService } from '../../../services/socket.service';
import { DataService } from '../../../services/data.service';
import { Tweet } from '../../../models/tweet.model';
import { SkeletonModule } from 'primeng/skeleton';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-side-panel',
  standalone: true,
  imports: [DatePipe, TweetComponent, SkeletonModule],
  templateUrl: './side-panel.component.html',
  styleUrl: './side-panel.component.scss',
  animations: [
    trigger('listAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate(
          '300ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms ease-in',
          style({ opacity: 0, transform: 'translateY(-10px)' })
        ),
      ]),
    ]),
  ],
})
export class SidePanelComponent implements OnInit, OnDestroy {
  currentTime = new Date();
  socketService = inject(SocketService);
  tweets = signal<Tweet[]>([]);
  dataService = inject(DataService);

  loading = computed(() => {
    return this.tweets().length === 0;
  });

  private tweetsSubscription!: Subscription;
  private intervalId: any;

  ngOnInit() {
    this.dataService.getLatestTweets().subscribe((tweets) => {
      this.tweets.set(tweets);
    });

    this.intervalId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    this.tweetsSubscription = this.socketService.tweets$.subscribe(
      (tweet: Tweet | undefined) => {
        this.tweets.set([tweet!, ...this.tweets().slice(0, -1)]);
      }
    );
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
    if (this.tweetsSubscription) {
      this.tweetsSubscription.unsubscribe();
    }
  }
}
