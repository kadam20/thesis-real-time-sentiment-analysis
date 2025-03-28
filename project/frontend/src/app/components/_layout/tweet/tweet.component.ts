import { Component, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { Tweet } from '../../../models/tweet.model';

@Component({
  selector: 'app-tweet',
  standalone: true,
  imports: [TagModule],
  templateUrl: './tweet.component.html',
  styleUrl: './tweet.component.scss'
})
export class TweetComponent {
  tweet = input.required<Tweet>()
}
