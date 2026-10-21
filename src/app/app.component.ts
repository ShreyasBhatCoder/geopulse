import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Dashboard } from './dashboard/dashboard.component';

@Component({
  imports: [RouterOutlet, Dashboard],
  selector: 'app-root',
  styleUrl: './app.component.css',
  templateUrl: './app.component.html',
})
export class App {
  protected readonly title = signal('geopulse');
}
