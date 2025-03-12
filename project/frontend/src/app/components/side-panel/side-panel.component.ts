import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TweetComponent } from './tweet/tweet.component';
import { Subscription } from 'rxjs';
import { SocketService } from '../../services/socket.service';
import { DataService } from '../../services/data.service';

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
  tweets = signal<any[]>([]);
  dataService = inject(DataService)

  ngOnInit() {
    console.log('side panel connect')
    this.dataService.getLatestTweets().subscribe((tweets) => {
      console.log('tweets');
      console.log(tweets);
      this.tweets.set(tweets);
    });

    this.intervalId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    this.tweetsSubscription = this.socketService.tweets$.subscribe((tweet) => {
      this.tweets.set([...this.tweets(), tweet]);
    });
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
    if (this.tweetsSubscription) {
      this.tweetsSubscription.unsubscribe();
    }
  }
}
