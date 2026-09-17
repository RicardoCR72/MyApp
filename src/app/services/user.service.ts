import { inject, Injectable } from '@angular/core';
import axios, { AxiosInstance } from 'axios';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

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

  private readonly http: AxiosInstance = axios.create({
    baseURL: environment.apiUrl,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
  });

  async list(): Promise<UserRecord[]> {
    const { data } = await this.http.get<UserListResponse>('/users.php', this.authorizedConfig());
    return data.data;
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    const { data } = await this.http.post<UserResponse>('/users.php', input, this.authorizedConfig());
    return data.data;
  }

  async patch(id: number, input: UpdateUserInput): Promise<UserRecord> {
    const { data } = await this.http.patch<UserResponse>(`/users.php?id=${id}`, input, this.authorizedConfig());
    return data.data;
  }

  async remove(id: number): Promise<DeleteResponse> {
    const { data } = await this.http.delete<DeleteResponse>(`/users.php?id=${id}`, this.authorizedConfig());
    return data;
  }

  getErrorMessage(error: unknown): string {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      if (!error.response) return 'No fue posible conectar con la API de usuarios.';
      return error.response.data?.message || 'No fue posible completar la operación.';
    }
    return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
  }

  private authorizedConfig(): { headers: { Authorization: string } } {
    const token = this.authService.getToken();
    return { headers: { Authorization: `Bearer ${token ?? ''}` } };
  }
}
