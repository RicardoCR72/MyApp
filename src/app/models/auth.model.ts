/**
 * Modelo JSON para solicitud de inicio de sesión (Request Payload).
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Modelo JSON de datos del usuario autenticado devuelto por el servicio web.
 */
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

/**
 * Modelo JSON de respuesta de autenticación exitosa (Response Payload).
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  expiresAt: string;
  user: AuthUser;
}
