import { Component } from '@angular/core';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './comparison.component.html',
  styleUrl: './comparison.component.scss'
})
export class ComparisonComponent {
  documentStyle = getComputedStyle(document.documentElement);

  tweet = {
    datasets: [{
      label: 'My First Dataset',
      data: [30, 70],
      backgroundColor: [
        this.documentStyle.getPropertyValue('--p-primary-red'),
        this.documentStyle.getPropertyValue('--p-primary-blue'),
      ],
      hoverOffset: 4
    }]
  };

  sentiment = {
    datasets: [{
      label: 'My First Dataset',
      data: [55, 45],
      backgroundColor: [
        this.documentStyle.getPropertyValue('--p-primary-orange'),
        this.documentStyle.getPropertyValue('--p-primary-green'),
      ],
      hoverOffset: 4
    }]
  };

  data = {
  labels: [1,2,3,4,5,6],
  datasets: [{
    label: 'My First Dataset',
    data: [65, 59, 80, 81, 56, 55, 40],
    backgroundColor: [
      this.documentStyle.getPropertyValue('--p-primary-red'),
      this.documentStyle.getPropertyValue('--p-primary-blue'),
      this.documentStyle.getPropertyValue('--p-primary-red'),
      this.documentStyle.getPropertyValue('--p-primary-blue'),
      this.documentStyle.getPropertyValue('--p-primary-red'),
      this.documentStyle.getPropertyValue('--p-primary-blue'),
    ],
    borderColor: [
      '#fff',
      '#fff',
      '#fff',
      '#fff',
      '#fff',
      '#fff',
    ],
    borderWidth: 2
  }]
};
}
