import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConnectionService } from './connection.service';
import { AuthService } from './auth.service';
import { ApiDiagnosticService } from './api-diagnostic.service';
import { ApiResponse } from '../models';

/**
 * Servicio Angular optimizado para cliente móvil preparado para consumir
 * la API REST mediante HttpClient con tipado estricto en modelos JSON.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly connectionService = inject(ConnectionService);
  private readonly authService = inject(AuthService);
  private readonly diagnosticService = inject(ApiDiagnosticService);

  /**
   * Construye las cabeceras HTTP estándar con el token Bearer si existe sesión activa.
   */
  private getHeaders(customHeaders?: Record<string, string>): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(customHeaders || {})
    });

    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Realiza una petición GET tipada al servicio web.
   * @param path Ruta del endpoint (ej. '/users.php')
   * @param params Parámetros de consulta opcionales
   */
  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Observable<T> {
    const url = this.connectionService.endpoint(path);
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return this.http.get<T>(url, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(
      catchError(error => this.handleError(error, 'GET', url, params))
    );
  }

  /**
   * Realiza una petición POST con payload JSON al servicio web.
   * @param path Ruta del endpoint (ej. '/login.php' o '/users.php')
   * @param body Payload JSON a enviar
   */
  post<T>(path: string, body: unknown): Observable<T> {
    const url = this.connectionService.endpoint(path);
    return this.http.post<T>(url, body, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error, 'POST', url, body))
    );
  }

  /**
   * Realiza una petición PUT para reemplazo completo de recurso.
   */
  put<T>(path: string, body: unknown): Observable<T> {
    const url = this.connectionService.endpoint(path);
    return this.http.put<T>(url, body, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error, 'PUT', url, body))
    );
  }

  /**
   * Realiza una petición PATCH para actualización parcial con payload JSON.
   */
  patch<T>(path: string, body: unknown): Observable<T> {
    const url = this.connectionService.endpoint(path);
    return this.http.patch<T>(url, body, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error, 'PATCH', url, body))
    );
  }

  /**
   * Realiza una petición DELETE al servicio web.
   */
  delete<T>(path: string): Observable<T> {
    const url = this.connectionService.endpoint(path);
    return this.http.delete<T>(url, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError(error, 'DELETE', url))
    );
  }

  /**
   * Manejador centralizado de errores con diagnóstico de red.
   */
  private handleError(error: unknown, method: string, url: string, payload?: unknown) {
    this.diagnosticService.captureError(error, {
      method,
      url,
      requestPayload: payload
    });
    return throwError(() => error);
  }
}
