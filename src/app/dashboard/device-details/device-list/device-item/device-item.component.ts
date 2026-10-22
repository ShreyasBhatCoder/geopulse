import { Component, computed, inject, input } from '@angular/core';
import { IoTDevice, Percentage } from './device.model';
import { MatIconModule } from '@angular/material/icon';
import { DEVICE_TELEMETRY } from '../../device-telemetry.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  imports: [MatIconModule, MatTooltipModule],
  selector: 'app-device-item',
  styleUrl: './device-item.component.css',
  templateUrl: './device-item.component.html',
})
export class DeviceItem {
  private deviceService = inject(DEVICE_TELEMETRY);

  deviceItem = input.required<IoTDevice>();
  selected = input<boolean>(false);

  tooltipText = computed(() => {
    // Format options to explicitly force a 24-hour layout format grid
    const formattedPing = new Date(this.deviceItem().lastPing).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false, // ← Disables AM/PM layout, locking it to a clean 24hr grid
    });

    // Keep strings left-aligned inside backticks to prevent unwanted visual indent gap spaces
    return `
      MODEL     ${this.deviceItem().hardwareModel}
      FIRMWARE  v${this.deviceItem().firmwareVersion}
      PING      ${formattedPing}`
    });

  batteryInfo = computed(() => {
    const device = this.deviceItem();

    // 1. Prioritize batteryLevel if present on the device
    if (device.batteryLevel != null) {
      return {
        icon: this.deviceService.getBatteryIcon(device.batteryLevel),
        percentage: device.batteryLevel,
        color: this.deviceService.getBatteryColor(device.batteryLevel),
      };
    }

    // 2. Fallback to latest metricHistory batteryVoltage
    const history = device.metricHistory;
    const latestMetric = history && history.length > 0 ? history[history.length - 1] : null;

    if (latestMetric?.batteryVoltage != null) {
      const batteryMap = this.deviceService.getBatteryLevel(latestMetric.batteryVoltage);
      const [percentageStr, icon] = Object.entries(batteryMap)[0] ?? [];
      const percentage = Number(percentageStr) as Percentage;
      return {
        icon: icon ?? 'battery_unknown',
        percentage: Number.isNaN(percentage) ? null : percentage,
        color: Number.isNaN(percentage) ? '' : this.deviceService.getBatteryColor(percentage),
      };
    }

    return {
      icon: 'battery_unknown',
      percentage: null,
      color: '',
    };
  });

  currentBatteryLevel = computed(() => this.batteryInfo().icon);

  ngOnInit() {}
}
