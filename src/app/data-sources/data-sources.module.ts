import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonTitle,
  IonToolbar
} from '@ionic/angular';
import { DataSourcesPageRoutingModule } from './data-sources-routing.module';
import { DataSourcesPage } from './data-sources.page';

@NgModule({
  declarations: [DataSourcesPage],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonInput,
    DataSourcesPageRoutingModule
  ]
})
export class DataSourcesPageModule {}
