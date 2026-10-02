import { Component, Input, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiDiagnostic } from '../../services/api-diagnostic.service';

@Component({
  selector: 'app-api-error-modal',
  templateUrl: './api-error-modal.component.html',
  styleUrls: ['./api-error-modal.component.scss'],
  standalone: false
})
export class ApiErrorModalComponent {
  @Input({ required: true }) diagnostic!: ApiDiagnostic;
  private readonly modalController = inject(ModalController);

  close(): Promise<boolean> {
    return this.modalController.dismiss();
  }
}
