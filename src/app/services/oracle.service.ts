import { inject, Injectable } from '@angular/core';
import axios from 'axios';
import { ApiDiagnosticService } from './api-diagnostic.service';
import { AuthService } from './auth.service';
import { ConnectionService } from './connection.service';
import { CacheService, DataLoadState } from './cache.service';

export type OracleSport = 'MLB' | 'NFL';

export interface OraclePrediction {
  id: number;
  externalGameId: string;
  sport: OracleSport;
  season: number;
  week: number | null;
  gameDate: string;
  awayTeam: string;
  homeTeam: string;
  gameStatus: string;
  venue: string | null;
  marketType: string;
  participantName: string | null;
  line: number;
  predictedValue: number | null;
  selection: string;
  probability: number;
  overProbability: number | null;
  underProbability: number | null;
  confidence: number | null;
  edge: number | null;
  odds: number | null;
  expectedValue: number | null;
  pickStatus: string;
  calibrationMethod: string | null;
  modelVersion: string;
  injuryStatus: string | null;
  notes: string | null;
  generatedAt: string;
}

interface PredictionListResponse {
  success: boolean;
  sport: OracleSport;
  count: number;
  data: OraclePrediction[];
}

export interface PredictionFilters {
  date?: string;
  week?: number;
  marketType?: string;
  pickStatus?: string;
}

@Injectable({ providedIn: 'root' })
export class OracleService {
  private readonly authService = inject(AuthService);
  private readonly connectionService = inject(ConnectionService);
  private readonly diagnosticService = inject(ApiDiagnosticService);
  private readonly cacheService = inject(CacheService);
  private loadState: DataLoadState = { source: 'api', savedAt: null };

  async getPredictions(
    sport: OracleSport,
    filters: PredictionFilters = {}
  ): Promise<OraclePrediction[]> {
    const token = this.authService.getToken();
    const url = this.connectionService.endpoint('/predictions.php');
    const config = {
        params: { sport, ...filters },
        timeout: 15000,
        headers: {
          Authorization: `Bearer ${token ?? ''}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      };
    try {
      const response = await axios.get<PredictionListResponse>(url, config);
      this.diagnosticService.captureSuccess({
        method: 'GET', url, status: response.status, statusText: response.statusText,
        requestPayload: config.params, responsePayload: response.data,
        requestHeaders: config.headers, responseHeaders: response.headers
      });
      const cached = await this.cacheService.set(`predictions_${sport.toLowerCase()}`, response.data.data);
      this.loadState = { source: 'api', savedAt: cached.savedAt };
      return response.data.data;
    } catch (error: unknown) {
      this.diagnosticService.captureError(error, {
        method: 'GET', url, requestPayload: config.params, requestHeaders: config.headers
      });
      const cached = await this.cacheService.get<OraclePrediction[]>(`predictions_${sport.toLowerCase()}`);
      if (cached) {
        this.loadState = { source: 'cache', savedAt: cached.savedAt };
        return cached.data;
      }
      throw error;
    }
  }

  getErrorMessage(error: unknown): string {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      if (!error.response) return 'No fue posible conectar con la API del Oraculo.';
      return error.response.data?.message || 'No fue posible cargar las predicciones.';
    }
    return error instanceof Error ? error.message : 'Ocurrio un error inesperado.';
  }

  getLoadState(): DataLoadState {
    return { ...this.loadState };
  }
}
