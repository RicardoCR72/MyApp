import { Injectable } from '@angular/core';
import axios, { AxiosInstance } from 'axios';
import { environment } from '../../environments/environment';

export interface LoginCredentials { username: string; password: string; }
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}
export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  expiresAt: string;
  user: AuthUser;
}
interface ApiErrorResponse { success?: boolean; message?: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http: AxiosInstance = axios.create({
    baseURL: environment.apiUrl,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
  });

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await this.http.post<LoginResponse>('/login.php', credentials);
    if (!data.success || !data.token || !data.user) {
      throw new Error(data.message || 'La API devolvió una respuesta inválida.');
    }
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    localStorage.setItem('auth_expires_at', data.expiresAt);
    return data;
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_expires_at');
  }

  getToken(): string | null { return localStorage.getItem('auth_token'); }

  getCurrentUser(): AuthUser | null {
    const storedUser = localStorage.getItem('auth_user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const expiresAt = localStorage.getItem('auth_expires_at');
    if (!token || !expiresAt) return false;
    const expirationTime = Date.parse(expiresAt);
    if (Number.isNaN(expirationTime) || expirationTime <= Date.now()) {
      this.logout();
      return false;
    }
    return true;
  }

  getErrorMessage(error: unknown): string {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      if (!error.response) return 'No fue posible conectar con la API PHP.';
      return error.response.data?.message || 'No fue posible iniciar sesión.';
    }
    return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
  }
}
