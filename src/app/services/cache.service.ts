import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export interface CacheEntry<T> {
  data: T;
  savedAt: string;
}

export interface DataLoadState {
  source: 'api' | 'cache';
  savedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  private static readonly PREFIX = 'offline_cache_';

  async set<T>(key: string, data: T): Promise<CacheEntry<T>> {
    const entry: CacheEntry<T> = { data, savedAt: new Date().toISOString() };
    await Preferences.set({
      key: `${CacheService.PREFIX}${key}`,
      value: JSON.stringify(entry)
    });
    return entry;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const result = await Preferences.get({ key: `${CacheService.PREFIX}${key}` });
    if (!result.value) return null;
    try {
      const entry = JSON.parse(result.value) as CacheEntry<T>;
      if (!entry.savedAt || entry.data === undefined) throw new Error('Caché inválida');
      return entry;
    } catch {
      await this.remove(key);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key: `${CacheService.PREFIX}${key}` });
  }
}
