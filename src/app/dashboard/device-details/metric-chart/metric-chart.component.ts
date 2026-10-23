import { Component } from '@angular/core';
import { LiveChart } from './live-chart/live-chart.component';
import { PerformanceChart } from './performance-chart/performance-chart.component';

@Component({
  imports: [LiveChart, PerformanceChart],
  selector: 'app-metric-chart',
  styleUrl: './metric-chart.component.css',
  templateUrl: './metric-chart.component.html',
})
export class MetricChart {}
