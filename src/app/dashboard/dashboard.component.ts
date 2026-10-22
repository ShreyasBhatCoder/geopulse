import { HttpClient, provideHttpClient } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import {
  concatMap,
  delay,
  from,
  fromEvent,
  map,
  mergeMap,
  Observable,
  of,
  Subscriber,
  Subscription,
  switchMap,
} from 'rxjs';
import { IoTDevice } from './device-details/device-list/device-item/device.model';
import { Sidebar } from './sidebar/sidebar.component';
import { Main } from './main/main.component';
import { DEVICE_TELEMETRY, DeviceTelemetryService, provideDeviceService } from './device-details/device-telemetry.service';

@Component({
  imports: [Sidebar, Main],
  selector: 'app-dashboard',
  styleUrl: './dashboard.component.css',
  templateUrl: './dashboard.component.html',
  providers: [provideDeviceService]
})
export class Dashboard implements OnInit {
  
  private deviceService = inject(DEVICE_TELEMETRY);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {}

  
}
