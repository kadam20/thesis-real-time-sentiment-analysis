import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  socket = io(environment.socketUrl);
  constructor() {
    try {
      console.log('Connecting to server');
      this.socket.on('new_data', (data) => {
        console.log(data);
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
