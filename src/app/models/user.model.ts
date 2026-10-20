export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive' | 'blocked';

/**
 * Modelo JSON de registro de usuario devuelto por la API.
 */
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

/**
 * Modelo JSON para creación de usuario en el servicio web (POST Request).
 */
export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}

/**
 * Modelo JSON para actualización parcial de un usuario (PATCH/PUT Request).
 */
export type UpdateUserInput = Partial<CreateUserInput>;

/**
 * Modelo JSON de respuesta para listado de usuarios (GET Response).
 */
export interface UserListResponse {
  success: boolean;
  count: number;
  data: UserRecord[];
}

/**
 * Modelo JSON de respuesta para un solo usuario (GET/POST/PATCH Response).
 */
export interface UserResponse {
  success: boolean;
  message?: string;
  data: UserRecord;
}

/**
 * Modelo JSON de respuesta al eliminar un usuario (DELETE Response).
 */
export interface DeleteResponse {
  success: boolean;
  message: string;
}
