import { inject, Injectable } from '@angular/core';
import axios from 'axios';
import { ApiDiagnosticService } from './api-diagnostic.service';
import { AuthService } from './auth.service';
import { ConnectionService } from './connection.service';
import { CacheService, DataLoadState } from './cache.service';
import LOCAL_PREDICTIONS_JSON from '../../assets/data/predictions_data.json';

import {
  OracleSport,
  OraclePrediction,
  PredictionFilters,
  PredictionListResponse
} from '../models';

export {
  OracleSport,
  OraclePrediction,
  PredictionFilters,
  PredictionListResponse
};

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
    // Opción A: Carga instantánea (0ms) desde el dataset importado en bundle
    const localPredictions = this.loadLocalDataset(sport);
    if (localPredictions.length > 0) {
      this.loadState = { source: 'cache', savedAt: new Date().toISOString() };
      return localPredictions;
    }

    const token = this.authService.getToken();
    const url = this.connectionService.endpoint('/predictions.php');
    const config = {
      params: { sport, ...filters },
      timeout: 2000,
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
      if (response.data?.data && response.data.data.length > 0) {
        const cached = await this.cacheService.set(`predictions_${sport.toLowerCase()}`, response.data.data);
        this.loadState = { source: 'api', savedAt: cached.savedAt };
        return response.data.data;
      }
      return [];
    } catch (error: unknown) {
      this.diagnosticService.captureError(error, {
        method: 'GET', url, requestPayload: config.params, requestHeaders: config.headers
      });
      const cached = await this.cacheService.get<OraclePrediction[]>(`predictions_${sport.toLowerCase()}`);
      if (cached && cached.data && cached.data.length > 0) {
        this.loadState = { source: 'cache', savedAt: cached.savedAt };
        return cached.data;
      }
      throw error;
    }
  }

  loadLocalDataset(sport: OracleSport): OraclePrediction[] {
    try {
      const data = (LOCAL_PREDICTIONS_JSON as unknown as Record<string, OraclePrediction[]>)[sport];
      return Array.isArray(data) ? [...data] : [];
    } catch {
      return [];
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
