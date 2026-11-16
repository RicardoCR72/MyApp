import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { Tab5PageModule } from './tab5.module';
import { Tab5Page } from './tab5.page';
import { ApiErrorModalService } from '../services/api-error-modal.service';

describe('Tab5Page', () => {
  let component: Tab5Page;
  let fixture: ComponentFixture<Tab5Page>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tab5PageModule, RouterModule.forRoot([])],
      providers: [{ provide: ApiErrorModalService, useValue: { present: async () => undefined } }]
    }).compileComponents();

    fixture = TestBed.createComponent(Tab5Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
