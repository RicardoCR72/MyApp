import { TestBed } from '@angular/core/testing';
import axios from 'axios';
import { ApiDiagnosticService } from './api-diagnostic.service';
import { AuthService } from './auth.service';
import { CacheService } from './cache.service';
import { ConnectionService } from './connection.service';
import { UserRecord, UserService } from './user.service';

describe('UserService sin conexión', () => {
  afterEach(() => vi.restoreAllMocks());

  it('devuelve los usuarios almacenados cuando falla la API', async () => {
    const cachedUsers: UserRecord[] = [{
      id: 1,
      username: 'admin',
      email: 'admin@miapp.local',
      fullName: 'Administrador MiApp',
      role: 'admin',
      status: 'active',
      lastLoginAt: null,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z'
    }];
    const cacheMock = {
      get: vi.fn().mockResolvedValue({ data: cachedUsers, savedAt: '2026-10-01T23:00:00Z' }),
      set: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: AuthService, useValue: { getToken: () => 'token-prueba' } },
        { provide: ConnectionService, useValue: { endpoint: () => 'http://192.168.1.71:80/miapp-api/users.php' } },
        { provide: ApiDiagnosticService, useValue: { captureError: vi.fn(), captureSuccess: vi.fn() } },
        { provide: CacheService, useValue: cacheMock }
      ]
    });
    vi.spyOn(axios, 'get').mockRejectedValue(new Error('Servidor no disponible'));

    const service = TestBed.inject(UserService);
    const users = await service.list();

    expect(users).toEqual(cachedUsers);
    expect(service.getLoadState().source).toBe('cache');
    expect(cacheMock.get).toHaveBeenCalledWith('users');
  });
});
