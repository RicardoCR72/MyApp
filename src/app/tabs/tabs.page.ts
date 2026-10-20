import { Component, inject } from '@angular/core';
import { SyncService } from '../services/sync.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage {
  private readonly syncService = inject(SyncService);
  readonly syncStatus$ = this.syncService.status$;

  retrySync(): void {
    void this.syncService.syncRemoteData();
  }
}
