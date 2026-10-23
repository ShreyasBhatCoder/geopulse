import { Component, inject } from '@angular/core';
import { MetricChart } from '../device-details/metric-chart/metric-chart.component';
import { DEVICE_TELEMETRY } from '../device-details/device-telemetry.service';

@Component({
  imports: [MetricChart],
  selector: 'app-main',
  styleUrl: './main.component.css',
  templateUrl: './main.component.html',
})
export class Main {
  private deviceService = inject(DEVICE_TELEMETRY);

  selectedDevice = this.deviceService.selectedDevice;
}
