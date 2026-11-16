import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { Tab4PageModule } from './tab4.module';
import { Tab4Page } from './tab4.page';
import { ApiErrorModalService } from '../services/api-error-modal.service';

describe('Tab4Page', () => {
  let component: Tab4Page;
  let fixture: ComponentFixture<Tab4Page>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tab4PageModule, RouterModule.forRoot([])],
      providers: [{ provide: ApiErrorModalService, useValue: { present: async () => undefined } }]
    }).compileComponents();

    fixture = TestBed.createComponent(Tab4Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
