import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleChange, MatSlideToggle } from '@angular/material/slide-toggle';

@Component({
  imports: [MatIconModule, MatSlideToggle],
  selector: 'app-sidebar',
  styleUrl: './sidebar.component.css',
  templateUrl: './sidebar.component.html',
})
export class Sidebar {
  isSidebarOpen = false;
  isDarkMode = false;

  devices = [
    { id: 'alpha', name: 'Device Alpha', active: true },
    { id: 'beta', name: 'Device Beta', active: false },
    { id: 'gamma', name: 'Device Gamma', active: false },
  ];

  onThemeToggle(event: MatSlideToggleChange): void {
    this.isDarkMode = event.checked;

    // Dead simple, standard JavaScript
    document.documentElement.classList.toggle('dark', this.isDarkMode);
  }
}
