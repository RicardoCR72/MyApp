export type OracleSport = 'MLB' | 'NFL';

/**
 * Modelo JSON de una predicción deportiva entregada por el servicio web.
 */
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

/**
 * Filtros de consulta JSON enviados como parámetros (Query Params).
 */
export interface PredictionFilters {
  date?: string;
  week?: number;
  marketType?: string;
  pickStatus?: string;
}

/**
 * Modelo JSON de respuesta con listado de predicciones deportivas.
 */
export interface PredictionListResponse {
  success: boolean;
  sport: OracleSport;
  count: number;
  data: OraclePrediction[];
}
