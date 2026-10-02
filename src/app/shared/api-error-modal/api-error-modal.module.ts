import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar
} from '@ionic/angular';
import { ApiErrorModalComponent } from './api-error-modal.component';

@NgModule({
  declarations: [ApiErrorModalComponent],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonChip
  ],
  exports: [ApiErrorModalComponent]
})
export class ApiErrorModalModule {}
