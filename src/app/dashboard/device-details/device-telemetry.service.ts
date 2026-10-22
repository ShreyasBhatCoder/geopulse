import { inject, Injectable, InjectionToken, Provider } from '@angular/core';
import { IoTDevice, Percentage } from './device-list/device-item/device.model';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable()
export class DeviceTelemetryService {
  private http = inject(HttpClient);
  devices = toSignal(this.http.get<IoTDevice[]>('/api'), { initialValue: [] });

  /* 
      battery_0_bar (0% to 5%)
      battery_1_bar (5% to 20%)
      battery_2_bar (20% to 35%)
      battery_3_bar (35% to 50%)
      battery_4_bar (50% to 65%)
      battery_5_bar (65% to 80%)
      battery_6_bar (80% to 100%)
    */

  getBatteryIcon(level: Percentage): string {
    switch (true) {
      case level <= 5:
        return 'battery_0_bar';
      case level <= 20:
        return 'battery_1_bar';
      case level <= 35:
        return 'battery_2_bar';
      case level <= 50:
        return 'battery_3_bar';
      case level <= 65:
        return 'battery_4_bar';
      case level <= 80:
        return 'battery_5_bar';
      case level < 100:
        return 'battery_6_bar';
      default:
        return "battery_full"
    }
  }

  getBatteryLevel(batteryVoltage: number): Partial<Record<Percentage, string>> {
    const rawLevel = Math.floor(((batteryVoltage - 3.2) / (4.2 - 3.2)) * 100);
    const level = Math.max(0, Math.min(100, rawLevel)) as Percentage;
    return { [level]: this.getBatteryIcon(level) };
  }


  getBatteryColor(level: Percentage): string {
    let color = "";
    switch(true) {
        case level <= 20:
            color = "red";
            break;
        case level < 100:
            color = "orange";
            break;
        default:
            color = "green";
            break;
    }
    return color;
  }
}

export const DEVICE_TELEMETRY = new InjectionToken<DeviceTelemetryService>(
  'Device Telemetry Service',
);

export const provideDeviceService: Provider = {
  provide: DEVICE_TELEMETRY,
  useClass: DeviceTelemetryService,
};
