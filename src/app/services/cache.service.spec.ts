import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';
import { CacheService } from './cache.service';

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn()
  }
}));

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheService);
  });

  afterEach(() => vi.restoreAllMocks());

  it('guarda y recupera un arreglo desde Preferences', async () => {
    let storedValue: string | null = null;
    vi.mocked(Preferences.set).mockImplementation(async options => {
      storedValue = options.value;
    });
    vi.mocked(Preferences.get).mockImplementation(async () => ({ value: storedValue }));

    await service.set('users', [{ id: 1, username: 'admin' }]);
    const result = await service.get<Array<{ id: number; username: string }>>('users');

    expect(result?.data[0].username).toBe('admin');
    expect(result?.savedAt).toBeTruthy();
  });
});
