import { inject, Injectable } from '@angular/core';
import axios from 'axios';
import { ApiDiagnosticService } from './api-diagnostic.service';
import { AuthService } from './auth.service';
import { ConnectionService } from './connection.service';
import { CacheService, DataLoadState } from './cache.service';

export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive' | 'blocked';

export interface UserRecord {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}

export type UpdateUserInput = Partial<CreateUserInput>;

interface UserListResponse {
  success: boolean;
  count: number;
  data: UserRecord[];
}

interface UserResponse {
  success: boolean;
  message?: string;
  data: UserRecord;
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly authService = inject(AuthService);
  private readonly connectionService = inject(ConnectionService);
  private readonly diagnosticService = inject(ApiDiagnosticService);
  private readonly cacheService = inject(CacheService);
  private loadState: DataLoadState = { source: 'api', savedAt: null };

  async list(): Promise<UserRecord[]> {
    const url = this.connectionService.endpoint('/users.php');
    try {
      const response = await axios.get<UserListResponse>(url, this.authorizedConfig());
      this.recordSuccess('GET', url, response.status, response.statusText, response.data, response.headers);
      const cached = await this.cacheService.set('users', response.data.data);
      this.loadState = { source: 'api', savedAt: cached.savedAt };
      return response.data.data;
    } catch (error: unknown) {
      this.recordError(error, 'GET', url);
      const cached = await this.cacheService.get<UserRecord[]>('users');
      if (cached) {
        this.loadState = { source: 'cache', savedAt: cached.savedAt };
        return cached.data;
      }
      throw error;
    }
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    const url = this.connectionService.endpoint('/users.php');
    try {
      const response = await axios.post<UserResponse>(url, input, this.authorizedConfig());
      this.recordSuccess('POST', url, response.status, response.statusText, response.data, response.headers, input);
      await this.updateCachedUser(response.data.data);
      return response.data.data;
    } catch (error: unknown) {
      this.recordError(error, 'POST', url, input);
      throw error;
    }
  }

  async patch(id: number, input: UpdateUserInput): Promise<UserRecord> {
    const url = this.connectionService.endpoint(`/users.php?id=${id}`);
    try {
      const response = await axios.patch<UserResponse>(url, input, this.authorizedConfig());
      this.recordSuccess('PATCH', url, response.status, response.statusText, response.data, response.headers, input);
      await this.updateCachedUser(response.data.data);
      return response.data.data;
    } catch (error: unknown) {
      this.recordError(error, 'PATCH', url, input);
      throw error;
    }
  }

  async remove(id: number): Promise<DeleteResponse> {
    const url = this.connectionService.endpoint(`/users.php?id=${id}`);
    try {
      const response = await axios.delete<DeleteResponse>(url, this.authorizedConfig());
      this.recordSuccess('DELETE', url, response.status, response.statusText, response.data, response.headers);
      const cached = await this.cacheService.get<UserRecord[]>('users');
      if (cached) await this.cacheService.set('users', cached.data.filter(user => user.id !== id));
      return response.data;
    } catch (error: unknown) {
      this.recordError(error, 'DELETE', url);
      throw error;
    }
  }

  getErrorMessage(error: unknown): string {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      if (!error.response) return 'No fue posible conectar con la API de usuarios.';
      return error.response.data?.message || 'No fue posible completar la operación.';
    }
    return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
  }

  getLoadState(): DataLoadState {
    return { ...this.loadState };
  }

  private authorizedConfig(): {
    timeout: number;
    headers: { Authorization: string; 'Content-Type': string; Accept: string };
  } {
    const token = this.authService.getToken();
    return {
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${token ?? ''}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    };
  }

  private recordSuccess(
    method: string,
    url: string,
    status: number,
    statusText: string,
    responsePayload: unknown,
    responseHeaders: unknown,
    requestPayload?: unknown
  ): void {
    this.diagnosticService.captureSuccess({
      method, url, status, statusText, requestPayload, responsePayload,
      requestHeaders: this.authorizedConfig().headers, responseHeaders
    });
  }

  private recordError(error: unknown, method: string, url: string, requestPayload?: unknown): void {
    this.diagnosticService.captureError(error, {
      method, url, requestPayload, requestHeaders: this.authorizedConfig().headers
    });
  }

  private async updateCachedUser(user: UserRecord): Promise<void> {
    const cached = await this.cacheService.get<UserRecord[]>('users');
    const users = cached?.data ?? [];
    const index = users.findIndex(item => item.id === user.id);
    if (index >= 0) users[index] = user;
    else users.unshift(user);
    await this.cacheService.set('users', users);
  }
}
