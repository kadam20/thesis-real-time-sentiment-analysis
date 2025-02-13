import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  toggleDarkMode() {
    const element = document.querySelector('html');
    element!.classList.toggle('dark');
  }
}
