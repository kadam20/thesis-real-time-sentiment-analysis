import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Tweet } from '../models/tweet.model';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: WebSocket;
  private tweetsSubject = new BehaviorSubject<Tweet | undefined>(undefined);
  tweets$ = this.tweetsSubject.asObservable();

  constructor() {
    this.socket = new WebSocket('ws://localhost:8000/ws');

    // Event: Connection opened
    this.socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    // Event: Receiving messages
    this.socket.onmessage = (event) => {
      try {
        let data = JSON.parse(event.data);

        if (typeof data === 'string') data = JSON.parse(data);

        const finalTweet: Tweet = {
          tweet: data.tweet,
          likes: data.likes,
          retweet_count: data.retweetCount,
          user_name: data.userName,
          user_followers_count: data.userFollower,
          state: data.state,
          state_code: data.state_code,
          candidate: data.candidate,
          sentiment_label: data.sentimentLabel,
          sentiment_score: Number(data.sentimentScore.toFixed(2)),
        };
        this.tweetsSubject.next(finalTweet);
      } catch (firstParseError) {
        console.error('The data that failed to parse:', event.data);
      }
    };

    // Event: Connection closed
    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Event: Connection error
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  sendMessage(message: string) {
    this.socket.send(JSON.stringify({ event: 'message', payload: message }));
  }

  closeConnection() {
    this.socket.close();
  }
}
