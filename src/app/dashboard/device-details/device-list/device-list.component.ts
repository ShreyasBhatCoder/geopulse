import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DEVICE_TELEMETRY } from '../device-telemetry.service';
import { DeviceItem } from './device-item/device-item.component';
import { IoTDevice } from './device-item/device.model';

@Component({
  imports: [MatIconModule, DeviceItem],
  selector: 'app-device-list',
  styleUrl: './device-list.component.css',
  templateUrl: './device-list.component.html'
})
export class DeviceList {
  private deviceService = inject(DEVICE_TELEMETRY);

  devices = this.deviceService.devices;
  selectedDeviceId = signal<string | null>(null);

  selectDevice(device: IoTDevice) {
    this.selectedDeviceId.set(device.id);
    this.deviceService.selectedDevice.set(device);
  }
}
