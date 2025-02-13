import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
/**
 * Service for interacting with the browser's local storage.
 */
export class LocalstorageService {
  #window = inject(DOCUMENT).defaultView;

  /**
   * Retrieves the value associated with the specified key from local storage.
   * @param item - The key of the item to retrieve.
   * @param defaultValue - The default value to return if the item is not found in local storage.
   * @returns The value associated with the key, or the default value if the item is not found.
   */
  getItem(item: string, defaultValue?: string): string | null {
    return this.#window!.localStorage?.getItem(item) ?? defaultValue ?? null;
  }

  /**
   * Sets the value associated with the specified key in local storage.
   * @param item - The key of the item to set.
   * @param obj - The value to associate with the key.
   */
  setItem(item: string, obj: string): void {
    this.#window!.localStorage?.setItem(item, obj);
  }

  /**
   * Removes the item with the specified key from local storage.
   * @param item - The key of the item to remove.
   */
  removeItem(item: string): void {
    this.#window!.localStorage?.removeItem(item);
  }

  /**
   * Clears all items from local storage.
   */
  clear(): void {
    this.#window!.localStorage?.clear();
  }
}
