import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleChange, MatSlideToggle } from '@angular/material/slide-toggle';
import { DeviceList } from '../device-details/device-list/device-list.component';
import { ThemeService } from '../../theme-service.service';

@Component({
  imports: [MatIconModule, MatSlideToggle, DeviceList],
  selector: 'app-sidebar',
  styleUrl: './sidebar.component.css',
  templateUrl: './sidebar.component.html',
})
export class Sidebar {

  private themeService = inject(ThemeService);

  isSidebarOpen = false;
  isDarkMode = this.themeService.isDarkTheme;


  onThemeToggle(event: MatSlideToggleChange): void {
    this.themeService.toggleTheme(event.checked);
  }
}
