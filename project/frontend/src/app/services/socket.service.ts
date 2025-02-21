import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { environment } from '../../environments/environment.development';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  socket = io(environment.socketUrl);
  private tweetsSubject = new BehaviorSubject<any[]>([]);
  tweets$ = this.tweetsSubject.asObservable();

  connect(){
    try {
      console.log('Connecting to server');
      this.socket.on('new_data', (tweet) => {
        console.log(tweet);
        this.tweetsSubject.next([...this.tweetsSubject.getValue(), tweet]);
      });
      this.socket.on('connect', () => {
        console.log('Connected to server');
    });
    this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
    } catch (error) {
      console.error('Error:', error);
    }
  }
}
