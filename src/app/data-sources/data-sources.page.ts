import { Component, inject } from '@angular/core';
import { ApiDiagnostic, ApiDiagnosticService } from '../services/api-diagnostic.service';
import { ConnectionService, DataSourceConfig } from '../services/connection.service';

@Component({
  selector: 'app-data-sources',
  templateUrl: './data-sources.page.html',
  styleUrls: ['./data-sources.page.scss'],
  standalone: false
})
export class DataSourcesPage {
  readonly connectionService = inject(ConnectionService);
  private readonly diagnosticService = inject(ApiDiagnosticService);

  config!: DataSourceConfig;
  configJson = '';
  ipDraft = '';
  lastDiagnostic: ApiDiagnostic | null = null;
  message = '';
  isError = false;

  ionViewWillEnter(): void {
    this.refresh();
  }

  async save(): Promise<void> {
    this.message = '';
    try {
      await this.connectionService.setHost(this.ipDraft);
      this.isError = false;
      this.message = 'Origen de datos guardado como JSON persistente.';
      this.refresh(false);
    } catch (error: unknown) {
      this.isError = true;
      this.message = error instanceof Error ? error.message : 'No se pudo guardar la configuración.';
    }
  }

  refresh(clearMessage = true): void {
    this.config = this.connectionService.getConfig();
    this.configJson = this.connectionService.getConfigJson();
    this.ipDraft = this.config.ip;
    this.lastDiagnostic = this.diagnosticService.getLast();
    if (clearMessage) this.message = '';
  }
}
