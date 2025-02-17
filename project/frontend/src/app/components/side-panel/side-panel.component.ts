import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TweetComponent } from './tweet/tweet.component';

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

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }
}
