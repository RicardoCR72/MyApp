import { TestBed } from '@angular/core/testing';
import { NetworkService } from './network.service';

describe('NetworkService', () => {
  it('reacciona a los eventos offline y online', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(NetworkService);

    window.dispatchEvent(new Event('offline'));
    expect(service.isOnline()).toBe(false);
    expect(service.label()).toBe('Sin red');

    window.dispatchEvent(new Event('online'));
    expect(service.isOnline()).toBe(true);
  });
});
