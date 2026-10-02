import { inject, Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiErrorModalComponent } from '../shared/api-error-modal/api-error-modal.component';
import { ApiDiagnostic } from './api-diagnostic.service';

@Injectable({ providedIn: 'root' })
export class ApiErrorModalService {
  private readonly modalController = inject(ModalController);

  async present(diagnostic: ApiDiagnostic | null): Promise<void> {
    if (!diagnostic) return;
    const modal = await this.modalController.create({
      component: ApiErrorModalComponent,
      componentProps: { diagnostic },
      breakpoints: [0, 0.55, 0.9],
      initialBreakpoint: 0.9
    });
    await modal.present();
  }
}
