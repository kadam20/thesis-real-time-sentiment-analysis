import { Injectable, inject, signal } from '@angular/core';
import { LocalstorageService } from './localstorage.service';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  isDarkMode = signal<boolean>(false);
  localStorageService = inject(LocalstorageService);

  constructor() {
    this.getTheme();
  }

  /**
   * Toggles the dark mode of the application and updates local storage.
   */
  toggleDarkMode() {
    const element = document.querySelector('html');
    const isDark = element?.classList.toggle('dark');

    this.isDarkMode.set(isDark!);
    this.localStorageService.setItem('theme', isDark ? 'dark' : 'light');
  }

  /**
   * Gets the theme from local storage and sets it to the application.
   */
  getTheme() {
    const theme = this.localStorageService.getItem('theme');
    const element = document.querySelector('html');

    // If the theme is light, set the theme to light.
    if (theme === 'light') {
      this.isDarkMode.set(false);
      element?.classList.remove('dark');
      return;
    } else if (theme === 'dark') {
      element?.classList.add('dark');
      this.isDarkMode.set(true);
      return;
    }

    // If no theme is found in local storage, set the theme to dark.
    this.localStorageService.setItem('theme', 'dark');
    this.isDarkMode.set(true);
  }
}
