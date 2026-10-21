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

@Component({
  imports: [],
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
    const stream = this.http
    .get<{ id: number, name: string }[]>("/api/users")
    .pipe(
      mergeMap(users => users)
    );

    const subscriber: Partial<Subscriber<any>> = {
      next: user => console.log(user),
      complete: () => console.log("All users fetched successfully!")
    };

    const subscription: Subscription = stream.subscribe(subscriber);

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
}
