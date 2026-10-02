import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { Tab3PageModule } from './tab3.module';
import { Tab3Page } from './tab3.page';
import { ApiErrorModalService } from '../services/api-error-modal.service';

describe('Tab3Page', () => {
  let component: Tab3Page;
  let fixture: ComponentFixture<Tab3Page>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tab3PageModule, RouterModule.forRoot([])],
      providers: [{ provide: ApiErrorModalService, useValue: { present: async () => undefined } }]
    }).compileComponents();

    fixture = TestBed.createComponent(Tab3Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
