import { Component } from '@angular/core';
import { MetricChart } from '../device-details/metric-chart/metric-chart.component';

@Component({
  imports: [MetricChart],
  selector: 'app-main',
  styleUrl: './main.component.css',
  templateUrl: './main.component.html',
})
export class Main {}
