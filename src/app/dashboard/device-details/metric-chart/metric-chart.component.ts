import { Component } from '@angular/core';
import { LiveChart } from './live-chart/live-chart.component';

@Component({
  imports: [LiveChart],
  selector: 'app-metric-chart',
  styleUrl: './metric-chart.component.css',
  templateUrl: './metric-chart.component.html',
})
export class MetricChart {}
