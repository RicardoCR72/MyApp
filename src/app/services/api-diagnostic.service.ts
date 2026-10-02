import { inject, Injectable } from '@angular/core';
import axios, { AxiosHeaders } from 'axios';
import { NetworkService } from './network.service';

export interface ApiDiagnostic {
  ok: boolean;
  timestamp: string;
  method: string;
  url: string;
  ip: string;
  networkStatus: string;
  httpStatus: number | null;
  statusText: string;
  requestPayload: unknown;
  responsePayload: unknown;
  requestHeaders: Record<string, unknown>;
  responseHeaders: Record<string, unknown>;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ApiDiagnosticService {
  private lastDiagnostic: ApiDiagnostic | null = null;
  private readonly networkService = inject(NetworkService);

  captureSuccess(options: {
    method: string;
    url: string;
    status: number;
    statusText: string;
    requestPayload?: unknown;
    responsePayload?: unknown;
    requestHeaders?: unknown;
    responseHeaders?: unknown;
    message?: string;
  }): ApiDiagnostic {
    this.lastDiagnostic = {
      ok: true,
      timestamp: new Date().toISOString(),
      method: options.method.toUpperCase(),
      url: options.url,
      ip: this.extractIp(options.url),
      networkStatus: this.networkService.label(),
      httpStatus: options.status,
      statusText: options.statusText || 'OK',
      requestPayload: this.sanitizePayload(options.requestPayload),
      responsePayload: options.responsePayload ?? null,
      requestHeaders: this.normalizeHeaders(options.requestHeaders),
      responseHeaders: this.normalizeHeaders(options.responseHeaders),
      message: options.message || 'La API respondió correctamente.'
    };
    return this.lastDiagnostic;
  }

  captureError(error: unknown, fallback: {
    method: string;
    url: string;
    requestPayload?: unknown;
    requestHeaders?: unknown;
  }): ApiDiagnostic {
    if (axios.isAxiosError(error)) {
      const url = error.config?.url || fallback.url;
      const responseData = error.response?.data as { message?: string } | undefined;
      this.lastDiagnostic = {
        ok: false,
        timestamp: new Date().toISOString(),
        method: (error.config?.method || fallback.method).toUpperCase(),
        url,
        ip: this.extractIp(url),
        networkStatus: error.response
          ? 'Con red: el servidor respondió'
          : this.networkService.isOnline() ? 'Con red, sin respuesta de la API' : 'Dispositivo sin red',
        httpStatus: error.response?.status ?? null,
        statusText: error.response?.statusText || 'Sin respuesta HTTP',
        requestPayload: this.sanitizePayload(error.config?.data ?? fallback.requestPayload),
        responsePayload: error.response?.data ?? null,
        requestHeaders: this.normalizeHeaders(error.config?.headers || fallback.requestHeaders),
        responseHeaders: this.normalizeHeaders(error.response?.headers),
        message: responseData?.message || error.message || 'Error al consumir la API.'
      };
      return this.lastDiagnostic;
    }

    this.lastDiagnostic = {
      ok: false,
      timestamp: new Date().toISOString(),
      method: fallback.method.toUpperCase(),
      url: fallback.url,
      ip: this.extractIp(fallback.url),
      networkStatus: this.networkService.label(),
      httpStatus: null,
      statusText: 'Error de aplicación',
      requestPayload: this.sanitizePayload(fallback.requestPayload),
      responsePayload: null,
      requestHeaders: this.normalizeHeaders(fallback.requestHeaders),
      responseHeaders: {},
      message: error instanceof Error ? error.message : 'Error inesperado.'
    };
    return this.lastDiagnostic;
  }

  getLast(): ApiDiagnostic | null {
    return this.lastDiagnostic;
  }

  private extractIp(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'No disponible';
    }
  }

  private sanitizePayload(payload: unknown): unknown {
    let parsed = payload;
    if (typeof payload === 'string') {
      try { parsed = JSON.parse(payload); } catch { return payload; }
    }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const record = { ...(parsed as Record<string, unknown>) };
      if ('password' in record) record['password'] = '********';
      return record;
    }
    return parsed ?? null;
  }

  private normalizeHeaders(headers: unknown): Record<string, unknown> {
    if (!headers) return {};
    const normalized = headers instanceof AxiosHeaders
      ? headers.toJSON()
      : typeof headers === 'object'
        ? { ...(headers as Record<string, unknown>) }
        : { value: String(headers) };
    for (const key of Object.keys(normalized)) {
      if (key.toLowerCase() === 'authorization') normalized[key] = 'Bearer ********';
    }
    return normalized;
  }
}
