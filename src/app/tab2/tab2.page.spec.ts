import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { Tab2PageModule } from './tab2.module';
import { Tab2Page } from './tab2.page';
import { ApiErrorModalService } from '../services/api-error-modal.service';

describe('Tab2Page', () => {
  let component: Tab2Page;
  let fixture: ComponentFixture<Tab2Page>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tab2PageModule, RouterModule.forRoot([])],
      providers: [{ provide: ApiErrorModalService, useValue: { present: async () => undefined } }]
    }).compileComponents();

    fixture = TestBed.createComponent(Tab2Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
