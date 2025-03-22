import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: WebSocket;
  private tweetsSubject = new BehaviorSubject<any[]>([]);
  tweets$ = this.tweetsSubject.asObservable();

  constructor() {
    this.socket = new WebSocket('ws://localhost:8000/ws');

    // Event: Connection opened
    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.socket.send(JSON.stringify({ event: 'connect', message: 'Hello Server!' }));
    };

    // Event: Receiving messages
    this.socket.onmessage = (event) => {
      console.log('Message received from server:', event.data);
      const data = JSON.parse(event.data);

      // Listen to 'new_data' event
      if (data.event === 'new_data') {
        this.tweetsSubject.next([...this.tweetsSubject.value, data.payload]);
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
