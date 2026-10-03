import { Component, inject } from '@angular/core';
import { AuthService, AuthUser } from '../services/auth.service';
import {
  OraclePrediction,
  OracleService,
  OracleSport
} from '../services/oracle.service';
import { ApiDiagnosticService } from '../services/api-diagnostic.service';
import { ApiErrorModalService } from '../services/api-error-modal.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page {
  private readonly authService = inject(AuthService);
  private readonly oracleService = inject(OracleService);
  private readonly diagnosticService = inject(ApiDiagnosticService);
  private readonly errorModalService = inject(ApiErrorModalService);

  currentUser: AuthUser | null = null;
  selectedSport: OracleSport = 'MLB';
  predictions: OraclePrediction[] = [];
  isLoading = false;
  errorMessage = '';
  cacheMessage = '';

  ionViewWillEnter(): void {
    this.currentUser = this.authService.getCurrentUser();
    void this.loadPredictions();
  }

  async changeSport(sport: OracleSport): Promise<void> {
    this.selectedSport = sport;
    await this.loadPredictions();
  }

  async loadPredictions(event?: { target?: { complete?: () => void } }): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    this.cacheMessage = '';
    try {
      this.predictions = await this.oracleService.getPredictions(this.selectedSport);
      const state = this.oracleService.getLoadState();
      if (state.source === 'cache') {
        this.cacheMessage = `Sin conexión con la API. Mostrando predicciones guardadas el ${this.formatCacheDate(state.savedAt)}.`;
      }
    } catch (error: unknown) {
      this.predictions = [];
      this.errorMessage = this.oracleService.getErrorMessage(error);
      await this.errorModalService.present(this.diagnosticService.getLast());
    } finally {
      this.isLoading = false;
      event?.target?.complete?.();
    }
  }

  probabilityPercent(value: number | null): string {
    if (value === null || !Number.isFinite(value)) return 'N/D';
    return `${(value * 100).toFixed(1)}%`;
  }

  signedNumber(value: number | null, suffix = ''): string {
    if (value === null || !Number.isFinite(value)) return 'N/D';
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}${suffix}`;
  }

  oddsLabel(value: number | null): string {
    if (value === null || !Number.isFinite(value)) return 'N/D';
    return value > 0 ? `+${value.toFixed(0)}` : value.toFixed(0);
  }

  expectedValueLabel(value: number | null): string {
    if (value === null || !Number.isFinite(value)) return 'N/D';
    const percent = Math.abs(value) <= 2 ? value * 100 : value;
    return this.signedNumber(percent, '%');
  }

  marketLabel(prediction: OraclePrediction): string {
    const labels: Record<string, string> = {
      F5_TOTAL: 'Total primeras 5 entradas',
      GAME_TOTAL: 'Total del partido',
      receptions: 'Recepciones',
      receiving_yards: 'Yardas por recepcion',
      rushing_yards: 'Yardas terrestres',
      passing_yards: 'Yardas de pase',
      touchdowns: 'Touchdown'
    };
    return labels[prediction.marketType] ?? prediction.marketType.replaceAll('_', ' ');
  }

  pickColor(status: string): string {
    const normalized = status.toUpperCase();
    if (normalized === 'PICK') return 'success';
    if (normalized.includes('LESION') || normalized.includes('REVISAR')) return 'warning';
    return 'medium';
  }

  private formatCacheDate(value: string | null): string {
    return value ? new Date(value).toLocaleString('es-MX') : 'momento desconocido';
  }
}
