import { HttpClient, provideHttpClient } from '@angular/common/http';
import { Component, DestroyRef, OnInit } from '@angular/core';
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

@Component({
  imports: [Sidebar, Main],
  selector: 'app-dashboard',
  styleUrl: './dashboard.component.css',
  templateUrl: './dashboard.component.html',
})
export class Dashboard implements OnInit {
  constructor(
    private http: HttpClient,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit() {
    const stream = this.http.get<IoTDevice[]>('/api').pipe(mergeMap((deviceList) => deviceList));

    const subscriber = {
      next: (device: IoTDevice) => console.dir(device),
      error: (err: Error) => console.error(`Error: ${err.message}`),
      complete: () => console.log('Completed!'),
    };

    const subscription: Subscription = stream.subscribe(subscriber);

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
}
