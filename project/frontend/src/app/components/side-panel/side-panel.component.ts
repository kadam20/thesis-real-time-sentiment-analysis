import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TweetComponent } from './tweet/tweet.component';
import { Subscription } from 'rxjs';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-side-panel',
  standalone: true,
  imports: [DatePipe, TweetComponent],
  templateUrl: './side-panel.component.html',
  styleUrl: './side-panel.component.scss',
})
export class SidePanelComponent implements OnInit, OnDestroy {
  currentTime = new Date();
  private intervalId: any;
  private tweetsSubscription!: Subscription;
  socketService = inject(SocketService)
  tweets: any[] = [];

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    this.tweetsSubscription = this.socketService.tweets$.subscribe((tweets) => {
      this.tweets = tweets;
    });
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
    if (this.tweetsSubscription) {
      this.tweetsSubscription.unsubscribe();
    }
  }
}
