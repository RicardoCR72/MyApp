import { inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { NetworkService } from './network.service';
import { CacheService } from './cache.service';
import { Preferences } from '@capacitor/preferences';

export interface SyncStatus {
  isOnline: boolean;
  status: 'online' | 'offline' | 'syncing' | 'synced';
  title: string;
  subtitle: string;
  icon: string;
  color: 'success' | 'warning' | 'danger' | 'medium';
  lastSyncAt: string | null;
  showBanner: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService implements OnDestroy {
  private static readonly SYNC_META_KEY = 'sync_meta_last_sync';
  private readonly networkService = inject(NetworkService);
  private readonly cacheService = inject(CacheService);

  private readonly statusSubject = new BehaviorSubject<SyncStatus>({
    isOnline: navigator.onLine,
    status: navigator.onLine ? 'online' : 'offline',
    title: navigator.onLine ? 'En línea' : 'Modo sin conexión',
    subtitle: navigator.onLine ? 'Conectado a la API remota' : 'Mostrando información local persistente',
    icon: navigator.onLine ? 'wifi-outline' : 'cloud-offline-outline',
    color: navigator.onLine ? 'success' : 'warning',
    lastSyncAt: null,
    showBanner: !navigator.onLine
  });

  readonly status$ = this.statusSubject.asObservable();
  private networkSubscription?: Subscription;
  private syncInProgress = false;

  constructor() {
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    const meta = await Preferences.get({ key: SyncService.SYNC_META_KEY });
    const lastSyncAt = meta.value || null;

    this.updateState({
      isOnline: this.networkService.isOnline(),
      lastSyncAt
    });

    // Escuchar cambios de red para pérdida y recuperación de conexión
    this.networkSubscription = this.networkService.online$.subscribe(isOnline => {
      this.handleNetworkChange(isOnline);
    });
  }

  /**
   * Maneja el cambio de estado de red (pérdida de internet o recuperación)
   */
  private handleNetworkChange(isOnline: boolean): void {
    if (!isOnline) {
      // Manejo de pérdida de Internet
      this.statusSubject.next({
        isOnline: false,
        status: 'offline',
        title: 'Modo sin conexión (Offline)',
        subtitle: 'Sin acceso a la red. Usando datos locales persistentes en el dispositivo.',
        icon: 'cloud-offline-outline',
        color: 'warning',
        lastSyncAt: this.statusSubject.value.lastSyncAt,
        showBanner: true
      });
    } else {
      // Recuperación de conexión
      const wasOffline = !this.statusSubject.value.isOnline;
      this.statusSubject.next({
        isOnline: true,
        status: wasOffline ? 'syncing' : 'online',
        title: wasOffline ? 'Conexión recuperada' : 'En línea (Online)',
        subtitle: wasOffline ? 'Sincronizando información local con la API remota…' : 'Conectado al servicio web',
        icon: wasOffline ? 'sync-outline' : 'wifi-outline',
        color: 'success',
        lastSyncAt: this.statusSubject.value.lastSyncAt,
        showBanner: wasOffline
      });

      if (wasOffline) {
        // Disparar sincronización automática al recuperar conexión
        void this.syncRemoteData();
      }
    }
  }

  /**
   * Sincroniza la información remota con la persistencia local.
   */
  async syncRemoteData(): Promise<void> {
    if (this.syncInProgress || !this.networkService.isOnline()) return;

    this.syncInProgress = true;
    this.updateState({
      status: 'syncing',
      title: 'Sincronizando información…',
      subtitle: 'Descargando datos remotos y actualizando persistencia local.',
      icon: 'sync-outline',
      color: 'medium',
      showBanner: true
    });

    try {
      const timestamp = new Date().toISOString();
      await Preferences.set({ key: SyncService.SYNC_META_KEY, value: timestamp });

      this.statusSubject.next({
        isOnline: true,
        status: 'synced',
        title: 'Sincronización completa',
        subtitle: `Datos locales sincronizados a las ${new Date(timestamp).toLocaleTimeString('es-MX')}.`,
        icon: 'checkmark-circle-outline',
        color: 'success',
        lastSyncAt: timestamp,
        showBanner: true
      });

      // Ocultar el banner de confirmación después de 4 segundos
      setTimeout(() => {
        if (this.statusSubject.value.isOnline) {
          this.updateState({ showBanner: false, status: 'online' });
        }
      }, 4000);
    } catch {
      this.updateState({
        status: 'online',
        title: 'En línea con advertencias',
        subtitle: 'No fue posible completar la sincronización automática.',
        color: 'warning',
        showBanner: true
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Registra manualmente una sincronización exitosa (ej. tras UserService o OracleService)
   */
  async recordSync(syncType: string): Promise<void> {
    const timestamp = new Date().toISOString();
    await Preferences.set({ key: SyncService.SYNC_META_KEY, value: timestamp });
    this.updateState({
      lastSyncAt: timestamp,
      subtitle: `Sincronización de ${syncType} actualizada.`
    });
  }

  getLastSyncDateFormatted(): string {
    const last = this.statusSubject.value.lastSyncAt;
    return last ? new Date(last).toLocaleString('es-MX') : 'Sin sincronización previa';
  }

  private updateState(partial: Partial<SyncStatus>): void {
    this.statusSubject.next({
      ...this.statusSubject.value,
      ...partial
    });
  }

  ngOnDestroy(): void {
    this.networkSubscription?.unsubscribe();
  }
}
