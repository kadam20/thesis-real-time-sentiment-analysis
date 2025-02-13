import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalstorageService {
  #window = inject(DOCUMENT).defaultView;

  getItem(item: string, defaultValue?: string): string | null {
    return this.#window!.localStorage?.getItem(item) ?? defaultValue ?? null;
  }

  setItem(item: string, obj: string): void {
    this.#window!.localStorage?.setItem(item, obj);
  }

  removeItem(item: string): void {
    this.#window!.localStorage?.removeItem(item);
  }

  clear(): void {
    this.#window!.localStorage?.clear();
  }
}
