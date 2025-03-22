import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { HeaderComponent } from './components/header/header.component';
import { SidePanelComponent } from './components/side-panel/side-panel.component';
import { SocketService } from './services/socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ButtonModule, HeaderComponent, SidePanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  socketService = inject(SocketService)


  ngOnInit(): void {
    console.log('app connect')
    // this.socketService.connect()
  }
}
