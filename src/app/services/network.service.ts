import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetworkService implements OnDestroy {
  private readonly onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  readonly online$ = this.onlineSubject.asObservable();

  private readonly onlineHandler = (): void => this.onlineSubject.next(true);
  private readonly offlineHandler = (): void => this.onlineSubject.next(false);

  constructor() {
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }

  isOnline(): boolean {
    return this.onlineSubject.value;
  }

  label(): string {
    return this.isOnline() ? 'Con red' : 'Sin red';
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
    this.onlineSubject.complete();
  }
}
