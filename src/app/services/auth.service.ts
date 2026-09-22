import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
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
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY = 'auth_user';
  private static readonly EXPIRES_AT_KEY = 'auth_expires_at';

  private token: string | null = null;
  private currentUser: AuthUser | null = null;
  private expiresAt: string | null = null;
  private restoredFromPreferences = false;

  private readonly http: AxiosInstance = axios.create({
    baseURL: environment.apiUrl,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
  });

  /**
   * Restaura la sesión antes de que Angular evalúe las rutas protegidas.
   * AppModule ejecuta este método mediante provideAppInitializer.
   */
  async initialize(): Promise<void> {
    const [tokenResult, userResult, expirationResult] = await Promise.all([
      Preferences.get({ key: AuthService.TOKEN_KEY }),
      Preferences.get({ key: AuthService.USER_KEY }),
      Preferences.get({ key: AuthService.EXPIRES_AT_KEY })
    ]);

    this.token = tokenResult.value;
    this.expiresAt = expirationResult.value;
    this.currentUser = this.parseUser(userResult.value);

    if (!this.hasValidSession()) {
      await this.logout();
      return;
    }

    this.restoredFromPreferences = true;
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await this.http.post<LoginResponse>('/login.php', credentials);
    if (!data.success || !data.token || !data.user) {
      throw new Error(data.message || 'La API devolvió una respuesta inválida.');
    }

    this.token = data.token;
    this.currentUser = data.user;
    this.expiresAt = data.expiresAt;
    this.restoredFromPreferences = false;

    await Promise.all([
      Preferences.set({ key: AuthService.TOKEN_KEY, value: data.token }),
      Preferences.set({ key: AuthService.USER_KEY, value: JSON.stringify(data.user) }),
      Preferences.set({ key: AuthService.EXPIRES_AT_KEY, value: data.expiresAt })
    ]);

    return data;
  }

  async logout(): Promise<void> {
    this.token = null;
    this.currentUser = null;
    this.expiresAt = null;
    this.restoredFromPreferences = false;

    await Promise.all([
      Preferences.remove({ key: AuthService.TOKEN_KEY }),
      Preferences.remove({ key: AuthService.USER_KEY }),
      Preferences.remove({ key: AuthService.EXPIRES_AT_KEY })
    ]);
  }

  getToken(): string | null {
    return this.token;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  wasRestoredFromPreferences(): boolean {
    return this.restoredFromPreferences;
  }

  isAuthenticated(): boolean {
    if (!this.hasValidSession()) {
      void this.logout();
      return false;
    }
    return true;
  }

  private hasValidSession(): boolean {
    if (!this.token || !this.currentUser || !this.expiresAt) return false;
    const expirationTime = Date.parse(this.expiresAt);
    return !Number.isNaN(expirationTime) && expirationTime > Date.now();
  }

  private parseUser(value: string | null): AuthUser | null {
    if (!value) return null;
    try {
      return JSON.parse(value) as AuthUser;
    } catch {
      return null;
    }
  }

  getErrorMessage(error: unknown): string {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      if (!error.response) return 'No fue posible conectar con la API PHP.';
      return error.response.data?.message || 'No fue posible iniciar sesión.';
    }
    return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
  }
}
