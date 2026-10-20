/**
 * Modelo genérico de respuesta JSON de la API REST.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  errors?: Record<string, string[] | string>;
}

/**
 * Modelo JSON de error devuelto por la API.
 */
export interface ApiErrorResponse {
  success: boolean;
  message: string;
  code?: string | number;
  details?: unknown;
}
