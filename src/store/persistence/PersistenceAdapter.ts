import { AppState } from '../types';

export interface PersistenceAdapter {
  /**
   * Loads initial state from underlying storage medium.
   * Guaranteed to return valid domain objects with defaults on missing or corrupted data.
   */
  load(): Partial<AppState>;

  /**
   * Persists a partial snapshot of application state.
   */
  save(state: Partial<AppState>): void;

  /**
   * Persists a single domain key directly for granular updates.
   */
  saveKey<K extends keyof AppState>(key: K, value: AppState[K]): void;
}
